
"use client";

import { ReactNode, useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import AdminSidebar from "@/components/admin/AdminSidebar";
import AdminHeader from "@/components/admin/AdminHeader";
import { authApi } from "@/lib/api";

export default function AdminLayout({
  children,
}: {
  children: ReactNode;
}) {
  const router = useRouter();

  const [isChecking, setIsChecking] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [verificationError, setVerificationError] = useState("");

  const verifySession = useCallback(async () => {
    setIsChecking(true);
    setVerificationError("");

    const token = localStorage.getItem("accessToken");

    if (!token) {
      setIsAuthenticated(false);
      router.replace("/");
      return;
    }

    try {
      await authApi.me();
      setIsAuthenticated(true);
    } catch (error: unknown) {
      const status =
        typeof error === "object" &&
        error !== null &&
        "status" in error
          ? error.status
          : undefined;

      if (status === 401 || status === 403) {
        localStorage.removeItem("accessToken");
        setIsAuthenticated(false);
        router.replace("/");
        return;
      }

      setIsAuthenticated(false);
      setVerificationError(
        error instanceof Error
          ? error.message
          : "بررسی ورود به سرور انجام نشد.",
      );
    } finally {
      setIsChecking(false);
    }
  }, [router]);

  useEffect(() => {
    void verifySession();
  }, [verifySession]);

  if (isChecking) {
    return (
      <div
        dir="rtl"
        className="flex min-h-screen items-center justify-center bg-[#F7F7F9]"
      >
        <div className="flex flex-col items-center gap-3">
          <span className="h-9 w-9 animate-spin rounded-full border-4 border-[#E60A54]/20 border-t-[#E60A54]" />
          <p className="text-sm text-gray-500">
            در حال بررسی حساب کاربری...
          </p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    if (verificationError) {
      return (
        <div
          dir="rtl"
          className="flex min-h-screen items-center justify-center bg-[#F7F7F9] p-5"
        >
          <div className="w-full max-w-md rounded-2xl bg-white p-6 text-center shadow">
            <h1 className="text-lg font-bold text-gray-900">
              بررسی ورود ناموفق بود
            </h1>

            <p className="mt-3 text-sm leading-7 text-gray-600">
              {verificationError}
            </p>

            <button
              type="button"
              onClick={() => void verifySession()}
              className="mt-5 rounded-xl bg-[#E60A54] px-5 py-3 font-semibold text-white hover:bg-[#c90849]"
            >
              تلاش مجدد
            </button>

            <button
              type="button"
              onClick={() => {
                localStorage.removeItem("accessToken");
                router.replace("/");
              }}
              className="mr-2 mt-5 rounded-xl border border-gray-200 px-5 py-3 font-semibold text-gray-700"
            >
              بازگشت به ورود
            </button>
          </div>
        </div>
      );
    }

    return null;
  }

  return (
    <div
      dir="rtl"
      className="min-h-screen bg-[#F7F7F9] text-gray-900 md:flex"
    >
      <AdminSidebar />

      <div className="min-w-0 flex-1">
        <AdminHeader />
        <main className="p-4 sm:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
