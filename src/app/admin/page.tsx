"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import {
  AlertCircle,
  ArrowLeft,
  ArrowUpLeft,
  LayoutDashboard,
  Package,
  Plus,
  RefreshCw,
  ShoppingBag,
  Users,
  FolderTree,
  ImageOff,
} from "lucide-react";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

type DashboardStats = {
  products: number;
  categories: number;
  users: number;
};

type ProductImage = string | {
  url?: string;
  secure_url?: string;
};

type RecentProduct = {
  _id?: string;
  id?: string;
  name: string;
  slug?: string;
  price?: number | string;
  images?: ProductImage[];
  isActive?: boolean;
  createdAt?: string;
};

type DashboardResponse = {
  success: boolean;
  message?: string;
  data: {
    stats: DashboardStats;
    recentProducts: RecentProduct[];
  };
};

const initialStats: DashboardStats = {
  products: 0,
  categories: 0,
  users: 0,
};

function formatNumber(value: number) {
  return new Intl.NumberFormat("fa-IR").format(value);
}

function formatPrice(price?: number | string) {
  if (price === undefined || price === null || price === "") {
    return "قیمت ثبت نشده";
  }

  const numericPrice = Number(price);

  if (!Number.isFinite(numericPrice)) {
    return String(price);
  }

  return `${formatNumber(numericPrice)} تومان`;
}

function getProductImage(images?: ProductImage[]) {
  if (!images?.length) return null;

  const firstImage = images[0];

  if (typeof firstImage === "string") {
    return firstImage || null;
  }

  return firstImage.url || firstImage.secure_url || null;
}

function StatCard({
  title,
  value,
  description,
  icon: Icon,
  iconClass,
}: {
  title: string;
  value: number;
  description: string;
  icon: typeof Package;
  iconClass: string;
}) {
  return (
    <article className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
      <div className="flex items-start justify-between">
        <div
          className={`flex h-12 w-12 items-center justify-center rounded-2xl ${iconClass}`}
        >
          <Icon size={22} strokeWidth={1.8} />
        </div>

        <span className="rounded-lg bg-gray-50 px-2 py-1 text-xs text-gray-500">
          اطلاعات زنده
        </span>
      </div>

      <p className="mt-5 text-sm text-gray-500">{title}</p>

      <p className="mt-2 text-2xl font-bold tracking-tight">
        {formatNumber(value)}
      </p>

      <p className="mt-3 text-xs text-gray-400">{description}</p>
    </article>
  );
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<DashboardStats>(initialStats);
  const [recentProducts, setRecentProducts] = useState<RecentProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadDashboard = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const token = localStorage.getItem("accessToken");

      if (!token) {
        window.location.replace("/login?redirect=%2Fadmin");
        return;
      }

      const response = await fetch(`${API_URL}/admin/dashboard`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
        cache: "no-store",
      });

      const result = (await response.json()) as DashboardResponse;

      if (response.status === 401) {
        localStorage.removeItem("accessToken");
        localStorage.removeItem("user");
        window.location.replace("/login?redirect=%2Fadmin");
        return;
      }

      if (response.status === 403) {
        throw new Error("شما دسترسی لازم برای مشاهده داشبورد ادمین را ندارید.");
      }

      if (!response.ok) {
        throw new Error(
          result.message || "دریافت اطلاعات داشبورد ناموفق بود."
        );
      }

      if (!result.data?.stats) {
        throw new Error("ساختار پاسخ سرور برای داشبورد معتبر نیست.");
      }

      setStats({
        products: Number(result.data.stats.products) || 0,
        categories: Number(result.data.stats.categories) || 0,
        users: Number(result.data.stats.users) || 0,
      });

      setRecentProducts(
        Array.isArray(result.data.recentProducts)
          ? result.data.recentProducts
          : []
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "ارتباط با سرور برقرار نشد."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadDashboard();
  }, [loadDashboard]);

  return (
    <div dir="rtl" className="min-h-full space-y-7 pb-10 text-[#29242A]">
      {/* Welcome */}
      <section className="relative overflow-hidden rounded-[28px] bg-[#251820] px-6 py-8 text-white sm:px-9 sm:py-10">
        <div className="pointer-events-none absolute -left-12 -top-24 h-72 w-72 rounded-full bg-[#E60A54]/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-28 left-1/3 h-64 w-64 rounded-full bg-[#E60A54]/10 blur-3xl" />

        <div className="relative flex flex-col justify-between gap-7 md:flex-row md:items-center">
          <div>
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.07] px-3 py-1.5 text-xs text-pink-200">
              <LayoutDashboard size={14} />
              پنل مدیریت Amé Leila
            </div>

            <h1 className="text-2xl font-bold leading-relaxed sm:text-3xl">
              به داشبورد خوش آمدید
            </h1>

            <p className="mt-2 max-w-xl text-sm leading-7 text-white/65">
              وضعیت محصولات، دسته‌بندی‌ها و کاربران فروشگاه را
              از اطلاعات واقعی سرور مشاهده و مدیریت کنید.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link
              href="/admin/products/new"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#E60A54] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#c90849]"
            >
              <Plus size={18} />
              افزودن محصول
            </Link>

            <button
              type="button"
              onClick={() => void loadDashboard()}
              disabled={loading}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/[0.06] px-5 py-3 text-sm font-medium text-white transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <RefreshCw
                size={17}
                className={loading ? "animate-spin" : ""}
              />
              بروزرسانی اطلاعات
            </button>
          </div>
        </div>
      </section>

      {/* Error */}
      {error && (
        <section
          role="alert"
          className="flex flex-col gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-800 sm:flex-row sm:items-center sm:justify-between"
        >
          <div className="flex items-start gap-3">
            <AlertCircle size={20} className="mt-0.5 shrink-0" />
            <div>
              <p className="font-semibold">دریافت اطلاعات با مشکل مواجه شد</p>
              <p className="mt-1 leading-6">{error}</p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => void loadDashboard()}
            className="shrink-0 rounded-lg border border-red-200 px-3 py-2 font-medium transition hover:bg-red-100"
          >
            تلاش مجدد
          </button>
        </section>
      )}

      {/* Stats */}
      <section>
        <div className="mb-4">
          <h2 className="text-lg font-bold">گزارش کلی فروشگاه</h2>
          <p className="mt-1 text-sm text-gray-500">
            آمار دریافت‌شده از دیتابیس
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          <StatCard
            title="محصولات"
            value={stats.products}
            description="تعداد کل محصولات ثبت‌شده"
            icon={Package}
            iconClass="bg-[#FCE7EF] text-[#E60A54]"
          />

          <StatCard
            title="دسته‌بندی‌ها"
            value={stats.categories}
            description="تعداد کل دسته‌بندی‌ها"
            icon={FolderTree}
            iconClass="bg-[#E8F0FF] text-[#4778D9]"
          />

          <StatCard
            title="کاربران"
            value={stats.users}
            description="تعداد کل کاربران ثبت‌شده"
            icon={Users}
            iconClass="bg-[#E4F6EC] text-[#23955B]"
          />
        </div>

        {loading && (
          <p className="mt-3 text-xs text-gray-400">
            در حال دریافت آمار از سرور...
          </p>
        )}
      </section>

      {/* Recent products */}
      <section className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm sm:p-6">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold">آخرین محصولات</h2>
            <p className="mt-1 text-sm text-gray-500">
              آخرین محصولات ثبت‌شده در دیتابیس
            </p>
          </div>

          <Link
            href="/admin/products"
            className="inline-flex items-center gap-2 text-sm font-semibold text-[#E60A54] transition hover:gap-3"
          >
            همه محصولات
            <ArrowLeft size={16} />
          </Link>
        </div>

        {loading && recentProducts.length === 0 ? (
          <div className="space-y-3">
            {[1, 2, 3].map((item) => (
              <div
                key={item}
                className="h-20 animate-pulse rounded-xl bg-gray-100"
              />
            ))}
          </div>
        ) : recentProducts.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-gray-200 px-4 py-12 text-center">
            <Package size={32} className="text-gray-300" />
            <p className="mt-3 font-semibold">محصولی برای نمایش وجود ندارد</p>
            <p className="mt-1 text-sm text-gray-500">
              بعد از ثبت محصول، اطلاعات آن در این قسمت نمایش داده می‌شود.
            </p>
            <Link
              href="/admin/products/new"
              className="mt-4 inline-flex items-center gap-2 rounded-xl bg-[#E60A54] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#c90849]"
            >
              <Plus size={16} />
              ثبت محصول
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {recentProducts.map((product, index) => {
              const imageUrl = getProductImage(product.images);
              const productKey =
                product._id || product.id || product.slug || product.name;

              return (
                <article
                  key={productKey}
                  className="flex flex-wrap items-center gap-4 rounded-xl border border-gray-100 p-3 transition hover:border-pink-200 hover:bg-gray-50/50 sm:flex-nowrap"
                >
                  <div className="flex h-[68px] w-[68px] shrink-0 items-center justify-center overflow-hidden rounded-xl bg-[#F8F1F3]">
                    {imageUrl ? (
                      <img
                        src={imageUrl}
                        alt={product.name}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <ImageOff size={23} className="text-gray-300" />
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold">
                      {product.name}
                    </p>

                    <p className="mt-1 text-sm text-gray-500">
                      {formatPrice(product.price)}
                    </p>

                    <p className="mt-1 text-xs text-gray-400">
                      {product.isActive === undefined
                        ? "وضعیت محصول ثبت نشده"
                        : product.isActive
                          ? "فعال در فروشگاه"
                          : "غیرفعال"}
                    </p>
                  </div>

                  <span className="rounded-lg bg-gray-50 px-3 py-2 text-xs text-gray-500">
                    #{formatNumber(index + 1)}
                  </span>
                </article>
              );
            })}
          </div>
        )}
      </section>

      {/* Quick links */}
      <section>
        <h2 className="mb-4 text-lg font-bold">دسترسی سریع</h2>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <Link
            href="/admin/products/new"
            className="group flex items-center gap-4 rounded-2xl border border-gray-100 bg-white p-4 transition hover:border-pink-200 hover:shadow-sm"
          >
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#FCE7EF] text-[#E60A54]">
              <Plus size={21} />
            </div>

            <div className="flex-1">
              <p className="font-semibold">افزودن محصول</p>
              <p className="mt-1 text-xs text-gray-500">
                ثبت محصول جدید در فروشگاه
              </p>
            </div>

            <ArrowUpLeft
              size={18}
              className="text-gray-400 transition group-hover:text-[#E60A54]"
            />
          </Link>

          <Link
            href="/admin/products"
            className="group flex items-center gap-4 rounded-2xl border border-gray-100 bg-white p-4 transition hover:border-pink-200 hover:shadow-sm"
          >
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
              <Package size={21} />
            </div>

            <div className="flex-1">
              <p className="font-semibold">مدیریت محصولات</p>
              <p className="mt-1 text-xs text-gray-500">
                مشاهده و مدیریت محصولات
              </p>
            </div>

            <ArrowUpLeft
              size={18}
              className="text-gray-400 transition group-hover:text-[#E60A54]"
            />
          </Link>

          <Link
            href="/admin/categories"
            className="group flex items-center gap-4 rounded-2xl border border-gray-100 bg-white p-4 transition hover:border-pink-200 hover:shadow-sm"
          >
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-purple-50 text-purple-600">
              <FolderTree size={21} />
            </div>

            <div className="flex-1">
              <p className="font-semibold">مدیریت دسته‌بندی‌ها</p>
              <p className="mt-1 text-xs text-gray-500">
                سازمان‌دهی محصولات
              </p>
            </div>

            <ArrowUpLeft
              size={18}
              className="text-gray-400 transition group-hover:text-[#E60A54]"
            />
          </Link>
        </div>
      </section>

      {/* Not yet connected */}
      <section className="rounded-2xl border border-gray-100 bg-white p-5">
        <div className="flex items-start gap-3">
          <ShoppingBag
            size={21}
            className="mt-0.5 shrink-0 text-[#E60A54]"
          />

          <div>
            <h2 className="font-semibold">گزارش فروش و سفارش‌ها</h2>
            <p className="mt-2 text-sm leading-7 text-gray-500">
              این بخش تا زمان اتصال API سفارش‌ها و پرداخت‌ها نمایش داده
              نمی‌شود. پس از پیاده‌سازی مدل سفارش و ثبت تراکنش‌ها،
              می‌توانیم نمودار فروش، مجموع درآمد و وضعیت سفارش‌ها را
              با داده‌های واقعی نمایش دهیم.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}