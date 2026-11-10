
"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import {
  Search,
  Plus,
  FolderTree,
  Pencil,
  Trash2,
  ChevronLeft,
  RefreshCw,
} from "lucide-react";
import { categoriesApi, type Category } from "@/lib/api";


function getParentName(category: Category, categories: Category[]) {
  const parent = category.parent;

  if (!parent) {
    return "دسته اصلی";
  }

  const parentId =
    typeof parent === "string" ? parent : parent._id;

  const parentCategory = categories.find(
    (item) => item._id === parentId
  );

  if (parentCategory) {
    return parentCategory.name;
  }

  return typeof parent === "object"
    ? parent.name
    : "زیر‌دسته";
}


export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const loadCategories = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const result = await categoriesApi.getAll();
      setCategories(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "دریافت دسته‌بندی‌ها ناموفق بود.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadCategories();
  }, [loadCategories]);

  const filtered = categories.filter((category) => {
    const query = search.trim().toLowerCase();
    const matchesSearch =
      category.name.toLowerCase().includes(query) ||
      category.slug.toLowerCase().includes(query);

    const active = category.isActive !== false;
    const matchesFilter =
      filter === "all" ||
      (filter === "active" && active) ||
      (filter === "inactive" && !active);

    return matchesSearch && matchesFilter;
  });

  async function handleDelete(category: Category) {
    if (!window.confirm(`دسته‌بندی «${category.name}» غیرفعال شود؟`)) return;

    setDeletingId(category._id);
    setError("");

    try {
      await categoriesApi.delete(category._id);

      setCategories((previous) =>
        previous.map((item) =>
          item._id === category._id
            ? { ...item, isActive: false }
            : item,
        ),
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "غیرفعال‌سازی دسته‌بندی ناموفق بود.");
    } finally {
      setDeletingId(null);
    }
  }

  const activeCount = categories.filter((item) => item.isActive !== false).length;
  const inactiveCount = categories.length - activeCount;

  return (
    <div dir="rtl" className="min-h-screen space-y-7 bg-[#f8f8fa] p-4 text-[#24232b] sm:p-7 lg:p-9">
      <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-center">
        <div>
          <div className="mb-2 flex items-center gap-2 text-xs text-gray-400">
            <span>مدیریت فروشگاه</span>
            <ChevronLeft size={14} />
            <span className="text-[#E60A54]">دسته‌بندی‌ها</span>
          </div>
          <h1 className="text-2xl font-black sm:text-3xl">دسته‌بندی‌ها</h1>
          <p className="mt-2 text-sm text-gray-500">
            دسته‌بندی‌های محصولات فروشگاه را مدیریت کن.
          </p>
        </div>

        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => void loadCategories()}
            disabled={loading}
            className="flex items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm font-bold hover:bg-gray-50 disabled:opacity-50"
          >
            <RefreshCw size={17} className={loading ? "animate-spin" : ""} />
            بروزرسانی
          </button>
          <Link
            href="/admin/categories/new"
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#E60A54] px-5 py-3 text-sm font-bold text-white shadow-lg shadow-pink-100 hover:bg-[#c90849]"
          >
            <Plus size={19} />
            افزودن دسته‌بندی
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard title="همه دسته‌بندی‌ها" value={categories.length} />
        <StatCard title="دسته‌بندی‌های فعال" value={activeCount} />
        <StatCard title="دسته‌بندی‌های غیرفعال" value={inactiveCount} />
      </div>

      {error && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-red-100 bg-red-50 p-4 text-sm text-red-700">
          <span>{error}</span>
          <button onClick={() => void loadCategories()} className="font-bold underline">
            تلاش مجدد
          </button>
        </div>
      )}

      <section className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
        <div className="flex flex-col gap-4 border-b border-gray-100 p-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="font-extrabold">فهرست دسته‌بندی‌ها</h2>
            <p className="mt-1 text-xs text-gray-400">
              {loading ? "در حال دریافت اطلاعات..." : `${filtered.length} دسته‌بندی`}
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <div className="flex items-center gap-2 rounded-xl border border-gray-200 px-3 sm:w-64">
              <Search size={18} className="shrink-0 text-gray-400" />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="جستجوی دسته‌بندی..."
                className="w-full bg-transparent py-3 text-sm outline-none"
              />
            </div>
            <select
              value={filter}
              onChange={(event) => setFilter(event.target.value)}
              className="rounded-xl border border-gray-200 bg-white px-3 py-3 text-sm outline-none focus:border-[#E60A54]"
            >
              <option value="all">همه وضعیت‌ها</option>
              <option value="active">فعال</option>
              <option value="inactive">غیرفعال</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-right">
            <thead className="bg-gray-50 text-xs text-gray-500">
              <tr>
                <th className="px-5 py-4 font-semibold">دسته‌بندی</th>
                <th className="px-5 py-4 font-semibold">اسلاگ</th>
                <th className="px-5 py-4 font-semibold">دسته والد</th>
                <th className="px-5 py-4 font-semibold">وضعیت</th>
                <th className="px-5 py-4 font-semibold">عملیات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-5 py-16 text-center text-sm text-gray-400">
                    در حال دریافت دسته‌بندی‌ها از سرور...
                  </td>
                </tr>
              ) : filtered.map((category) => {
                const active = category.isActive !== false;

                return (
                  <tr key={category._id} className="transition hover:bg-pink-50/30">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        {category.image ? (
                          <img
                            src={category.image}
                            alt={category.name}
                            className="h-11 w-11 rounded-xl border border-gray-100 object-cover"
                          />
                        ) : (
                          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-pink-50 text-[#E60A54]">
                            <FolderTree size={21} />
                          </div>
                        )}
                        <span className="font-bold">{category.name}</span>
                      </div>
                    </td>
                    <td dir="ltr" className="px-5 py-4 text-sm text-gray-500">{category.slug}</td>
                    <td className="px-5 py-4 text-sm text-gray-600">
                      {getParentName(category, categories)}
                    </td>
                    <td className="px-5 py-4">
                      <span className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-bold ${active ? "bg-emerald-50 text-emerald-700" : "bg-gray-100 text-gray-500"}`}>
                        <span className={`h-1.5 w-1.5 rounded-full ${active ? "bg-emerald-500" : "bg-gray-400"}`} />
                        {active ? "فعال" : "غیرفعال"}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        <Link
                          href={`/admin/categories/new?edit=${category._id}`}
                          title="ویرایش"
                          className="rounded-lg border border-gray-200 p-2 text-gray-500 hover:border-pink-200 hover:bg-pink-50 hover:text-[#E60A54]"
                        >
                          <Pencil size={16} />
                        </Link>
                        <button
                          onClick={() => void handleDelete(category)}
                          disabled={deletingId === category._id || !active}
                          title="غیرفعال‌سازی"
                          className="rounded-lg border border-gray-200 p-2 text-gray-500 hover:border-red-200 hover:bg-red-50 hover:text-red-600 disabled:opacity-40"
                        >
                          {deletingId === category._id
                            ? <RefreshCw size={16} className="animate-spin" />
                            : <Trash2 size={16} />}
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {!loading && filtered.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-5 py-16 text-center text-sm text-gray-400">
                    دسته‌بندی‌ای پیدا نشد.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

function StatCard({ title, value }: { title: string; value: number }) {
  return (
    <div className="flex items-center justify-between rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
      <div>
        <p className="text-sm text-gray-500">{title}</p>
        <p className="mt-3 text-3xl font-black">{value}</p>
      </div>
      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-pink-50 text-[#E60A54]">
        <FolderTree size={21} />
      </div>
    </div>
  );
}
