
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const menu = [
  { label: "داشبورد", href: "/admin", icon: "⌂" },
  { label: "محصولات", href: "/admin/products", icon: "▦" },
  { label: "افزودن محصول", href: "/admin/products/new", icon: "+" },
  { label: "دسته‌بندی‌ها", href: "/admin/categories", icon: "▤" },
  { label: "افزودن دسته‌بندی", href: "/admin/categories/new", icon: "⊞" },
  { label: "سفارش‌ها", href: "/admin/orders", icon: "🛍" },
  { label: "مشتریان", href: "/admin/customers", icon: "♙" },
  { label: "تخفیف‌ها و کدهای تخفیف", href: "/admin/discounts", icon: "%" },
  { label: "نظرات محصولات", href: "/admin/reviews", icon: "☆" },
  { label: "موجودی انبار", href: "/admin/inventory", icon: "▣" },
  { label: "بنرها و اسلایدرها", href: "/admin/banners", icon: "▧" },
  { label: "وبلاگ", href: "/admin/blog", icon: "▤" },
  { label: "صفحات سایت", href: "/admin/pages", icon: "▱" },
  { label: "تنظیمات فروشگاه", href: "/admin/settings", icon: "⚙" },
  { label: "پروفایل مدیر", href: "/admin/profile", icon: "♙" },
];

export default function AdminSidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-full shrink-0 bg-white p-4 md:min-h-screen md:w-64 md:border-l md:border-gray-100">
      <Link href="/admin" className="mb-8 flex items-center gap-3 px-2 py-4">
        <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#E60A54] text-xl font-bold text-white">
          A
        </span>

        <span>
          <span className="block text-lg font-bold">Amé Leila</span>
          <span className="text-xs text-gray-400">پنل مدیریت</span>
        </span>
      </Link>

      <nav className="flex gap-2 overflow-x-auto md:flex-col">
        {menu.map((item) => {
          const active =
            item.href === "/admin"
              ? pathname === "/admin"
              : pathname === item.href ||
                pathname.startsWith(`${item.href}/`);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex shrink-0 items-center gap-3 rounded-xl px-4 py-3 text-sm transition ${
                active
                  ? "bg-[#E60A54]/10 font-semibold text-[#E60A54]"
                  : "text-gray-600 hover:bg-gray-50"
              }`}
            >
              <span className="text-lg">{item.icon}</span>
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="mt-8 hidden rounded-2xl bg-gray-50 p-4 text-xs leading-6 text-gray-500 md:block">
        مدیریت فروشگاه
        <br />
        محصولات و دسته‌بندی‌ها
      </div>
    </aside>
  );
}
