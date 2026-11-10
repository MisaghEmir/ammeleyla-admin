"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";

export default function AdminLoginPage() {
  const router = useRouter();

  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // async function handleSubmit(event: FormEvent<HTMLFormElement>) {
  //   event.preventDefault();
  //    window.location.href = "/admin";
  //   return;
  //   event.preventDefault();
  //   setError("");

  //   const normalizedPhone = phone.replace(/\s/g, "");

  //   if (!/^09\d{9}$/.test(normalizedPhone)) {
  //     setError("شماره موبایل باید با 09 شروع شود و 11 رقم باشد.");
  //     return;
  //   }

  //   if (!password) {
  //     setError("رمز عبور را وارد کنید.");
  //     return;
  //   }

  //   try {
  //     setLoading(true);

  //     const response = await api.post("/auth/admin-login", {
  //       phone: normalizedPhone,
  //       password,
  //     });

  //     const data = response.data;

  //     if (!data?.success || !data?.token || data?.user?.role !== "ADMIN") {
  //       setError("پاسخ ورود معتبر نیست.");
  //       return;
  //     }

  //     localStorage.setItem("accessToken", data.token);
  //     router.replace("/admin");
  //   } catch (err: unknown) {
  //     const message =
  //       typeof err === "object" &&
  //       err !== null &&
  //       "response" in err &&
  //       typeof err.response === "object" &&
  //       err.response !== null &&
  //       "data" in err.response &&
  //       typeof err.response.data === "object" &&
  //       err.response.data !== null &&
  //       "message" in err.response.data &&
  //       typeof err.response.data.message === "string"
  //         ? err.response.data.message
  //         : "ورود انجام نشد. اتصال سرور را بررسی کنید.";

  //     setError(message);
  //   } finally {
  //     setLoading(false);
  //   }
  // }

   async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    const normalizedPhone = phone.replace(/\s/g, "");

    if (!/^09\d{9}$/.test(normalizedPhone)) {
      setError("شماره موبایل باید ۱۱ رقم باشد.");
      return;
    }

    if (!password) {
      setError("رمز عبور را وارد کنید.");
      return;
    }

    try {
      setLoading(true);

      const response = await api.post("/auth/admin-login", {
        phone: normalizedPhone,
        password,
      });

      const data = response.data;

      if (!data?.success || !data?.token || data?.user?.role !== "ADMIN") {
        setError("اطلاعات ورود معتبر نیست.");
        return;
      }

      localStorage.setItem("accessToken", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));

      window.location.replace("/admin");
    } catch (err: any) {
      setError(
        err.response?.data?.message ||
          "ورود انجام نشد. اتصال سرور را بررسی کنید.",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main
      dir="rtl"
      className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#faf7f8] px-4 py-10"
    >
      <div className="pointer-events-none absolute -right-24 -top-24 h-80 w-80 rounded-full bg-[#E60A54]/10 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-24 -left-24 h-80 w-80 rounded-full bg-pink-200/40 blur-3xl" />

      <section className="relative w-full max-w-md">
        <div className="mb-7 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#E60A54] text-2xl font-black text-white shadow-lg shadow-pink-200">
            A
          </div>

          <h1 className="text-2xl font-black tracking-tight text-gray-900">
            Amé LeilaA
          </h1>

          <p className="mt-2 text-sm text-gray-500">
            ورود امن به پنل مدیریت فروشگاه
          </p>
        </div>

        <div className="rounded-3xl border border-gray-100 bg-white p-6 shadow-xl shadow-gray-200/60 sm:p-8">
          <div className="mb-7">
            <h2 className="text-xl font-bold text-gray-900">خوش آمدید</h2>
            <p className="mt-2 text-sm leading-6 text-gray-500">
              برای ورود، شماره موبایل و رمز عبور حساب مدیر را وارد کنید.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label
                htmlFor="phone"
                className="mb-2 block text-sm font-semibold text-gray-700"
              >
                شماره موبایل مدیر
              </label>

              <input
                id="phone"
                type="tel"
                inputMode="numeric"
                autoComplete="username"
                dir="ltr"
                placeholder="09123456789"
                value={phone}
                onChange={(event) =>
                  setPhone(event.target.value.replace(/[^\d]/g, ""))
                }
                maxLength={11}
                required
                className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3.5 text-left text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-[#E60A54] focus:bg-white focus:ring-4 focus:ring-[#E60A54]/10"
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="mb-2 block text-sm font-semibold text-gray-700"
              >
                رمز عبور
              </label>

              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  placeholder="رمز عبور خود را وارد کنید"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  required
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3.5 pl-20 text-gray-900 outline-none transition placeholder:text-right placeholder:text-gray-400 focus:border-[#E60A54] focus:bg-white focus:ring-4 focus:ring-[#E60A54]/10"
                />

                <button
                  type="button"
                  onClick={() => setShowPassword((value) => !value)}
                  className="absolute left-3 top-1/2 -translate-y-1/2 rounded-lg px-2 py-1 text-xs font-semibold text-gray-500 transition hover:bg-gray-100 hover:text-[#E60A54]"
                >
                  {showPassword ? "پنهان کردن" : "نمایش"}
                </button>
              </div>
            </div>

            {error && (
              <div
                role="alert"
                className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm leading-6 text-red-700"
              >
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#E60A54] px-4 py-3.5 font-bold text-white shadow-lg shadow-pink-200 transition hover:bg-[#c90849] focus:outline-none focus:ring-4 focus:ring-[#E60A54]/20 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? (
                <>
                  <span className="h-5 w-5 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                  در حال بررسی...
                </>
              ) : (
                "ورود به پنل مدیریت"
              )}
            </button>
          </form>

          <div className="mt-6 border-t border-gray-100 pt-5 text-center">
            <p className="text-xs leading-6 text-gray-400">
              این بخش مخصوص مدیران مجاز فروشگاه است.
            </p>
          </div>
        </div>

        <p className="mt-6 text-center text-xs text-gray-400">
          © Amé Leila — پنل مدیریت فروشگاه
        </p>
      </section>
    </main>
  );
}
