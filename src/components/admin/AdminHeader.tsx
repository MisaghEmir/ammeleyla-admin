
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const titles: Record<string, string> = {
  "/admin": "داشبورد",
  "/admin/products": "مدیریت محصولات",
  "/admin/products/new": "افزودن محصول",
  "/admin/categories": "مدیریت دسته‌بندی‌ها",
  "/admin/login": "ورود ادمین",
};

export default function AdminHeader() {
  const pathname = usePathname();
  const title = titles[pathname] ?? "پنل مدیریت";

  return (
    <header className="flex min-h-20 items-center justify-between border-b border-gray-100 bg-white px-4 sm:px-8">
      <div>
        <h1 className="font-bold">{title}</h1>
        <p className="mt-1 text-xs text-gray-400">
          مدیریت فروشگاه Amé Leila
        </p>
      </div>

      <Link
        href="/"
        className="rounded-xl border border-gray-200 px-4 py-2 text-sm transition hover:border-[#E60A54] hover:text-[#E60A54]"
      >
        مشاهده فروشگاه
      </Link>
    </header>
  );
}
