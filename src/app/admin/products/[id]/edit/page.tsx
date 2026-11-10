
"use client";

import {
  FormEvent,
  ChangeEvent,
  useCallback,
  useEffect,
  useState,
} from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { api } from "@/lib/api";

type ProductVariant = {
  _id?: string;
  color: string;
  size: string;
  sku: string;
  price: number;
  compareAtPrice: number | null;
  stock: number;
  isActive: boolean;
};

type ProductForm = {
  name: string;
  slug: string;
  description: string;
  category: string;
  tags: string;
  images: string[];
  variants: ProductVariant[];
  isActive: boolean;
  isFeatured: boolean;
  seoTitle: string;
  seoDescription: string;
};

type Category = {
  _id: string;
  name: string;
  slug?: string;
};

const emptyVariant: ProductVariant = {
  color: "",
  size: "",
  sku: "",
  price: 0,
  compareAtPrice: null,
  stock: 0,
  isActive: true,
};

const emptyProduct: ProductForm = {
  name: "",
  slug: "",
  description: "",
  category: "",
  tags: "",
  images: [],
  variants: [{ ...emptyVariant }],
  isActive: true,
  isFeatured: false,
  seoTitle: "",
  seoDescription: "",
};

function getErrorMessage(error: unknown): string {
  if (
    typeof error === "object" &&
    error !== null &&
    "response" in error
  ) {
    const response = error.response;

    if (
      typeof response === "object" &&
      response !== null &&
      "data" in response
    ) {
      const data = response.data;

      if (
        typeof data === "object" &&
        data !== null &&
        "message" in data &&
        typeof data.message === "string"
      ) {
        return data.message;
      }
    }
  }

  return "عملیات انجام نشد. اتصال سرور را بررسی کنید.";
}

function unwrap<T>(data: unknown, key: string): T {
  if (typeof data === "object" && data !== null && key in data) {
    return (data as Record<string, T>)[key];
  }

  return data as T;
}

function toFormProduct(raw: Record<string, unknown>): ProductForm {
  const variants = Array.isArray(raw.variants) ? raw.variants : [];

  return {
    name: String(raw.name ?? ""),
    slug: String(raw.slug ?? ""),
    description: String(raw.description ?? ""),
    category:
      typeof raw.category === "object" && raw.category !== null
        ? String(
            (raw.category as Record<string, unknown>)._id ?? "",
          )
        : String(raw.category ?? ""),
    tags: Array.isArray(raw.tags)
      ? raw.tags.map(String).join(", ")
      : "",
    images: Array.isArray(raw.images)
      ? raw.images.map((image) =>
          typeof image === "string"
            ? image
            : String(
                (image as Record<string, unknown>).url ?? "",
              ),
        )
      : [],
    variants: variants.length
      ? variants.map((item) => {
          const variant = item as Record<string, unknown>;

          return {
            _id: variant._id ? String(variant._id) : undefined,
            color: String(variant.color ?? ""),
            size: String(variant.size ?? ""),
            sku: String(variant.sku ?? ""),
            price: Number(variant.price ?? 0),
            compareAtPrice:
              variant.compareAtPrice == null
                ? null
                : Number(variant.compareAtPrice),
            stock: Number(variant.stock ?? 0),
            isActive: variant.isActive !== false,
          };
        })
      : [{ ...emptyVariant }],
    isActive: raw.isActive !== false,
    isFeatured: raw.isFeatured === true,
    seoTitle: String(raw.seoTitle ?? ""),
    seoDescription: String(raw.seoDescription ?? ""),
  };
}

export default function EditProductPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const productId = params.id;

  const [form, setForm] = useState<ProductForm>(emptyProduct);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const [productResponse, categoriesResponse] = await Promise.all([
        api.get(`/products/${productId}`),
        api.get("/categories"),
      ]);

      const productData = unwrap<unknown>(
        productResponse.data,
        "product",
      );
      const product = unwrap<unknown>(productData, "data");

      if (
        typeof product !== "object" ||
        product === null ||
        Array.isArray(product)
      ) {
        throw new Error("اطلاعات محصول از سرور معتبر نیست.");
      }

      const categoriesData = unwrap<unknown>(
        categoriesResponse.data,
        "categories",
      );
      const categoriesList = unwrap<unknown>(categoriesData, "data");

      setForm(toFormProduct(product as Record<string, unknown>));

      if (Array.isArray(categoriesList)) {
        setCategories(
          categoriesList.filter(
            (item): item is Category =>
              typeof item === "object" &&
              item !== null &&
              "_id" in item &&
              "name" in item,
          ),
        );
      }
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [productId]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  function updateField<K extends keyof ProductForm>(
    key: K,
    value: ProductForm[K],
  ) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function updateVariant(
    index: number,
    key: keyof ProductVariant,
    value: string | number | boolean | null,
  ) {
    setForm((current) => ({
      ...current,
      variants: current.variants.map((variant, i) =>
        i === index ? { ...variant, [key]: value } : variant,
      ),
    }));
  }

  function addVariant() {
    setForm((current) => ({
      ...current,
      variants: [...current.variants, { ...emptyVariant }],
    }));
  }

  function removeVariant(index: number) {
    setForm((current) => ({
      ...current,
      variants:
        current.variants.length === 1
          ? current.variants
          : current.variants.filter((_, i) => i !== index),
    }));
  }

  async function handleUpload(event: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? []);
    event.target.value = "";

    if (!files.length) return;

    try {
      setUploading(true);
      setError("");
      setSuccess("");

      const uploadedUrls: string[] = [];

      for (const file of files) {
        const body = new FormData();
        body.append("file", file);

        const response = await api.post("/uploads", body, {
          headers: { "Content-Type": "multipart/form-data" },
        });

        const result = unwrap<Record<string, unknown>>(
          response.data,
          "data",
        );

        const url =
          typeof result.url === "string"
            ? result.url
            : typeof result.imageUrl === "string"
              ? result.imageUrl
              : typeof result.path === "string"
                ? result.path
                : "";

        if (!url) {
          throw new Error(
            "آدرس تصویر در پاسخ سرور پیدا نشد. مسیر آپلود را بررسی کنید.",
          );
        }

        uploadedUrls.push(url);
      }

      setForm((current) => ({
        ...current,
        images: [...current.images, ...uploadedUrls],
      }));

      setSuccess("تصاویر با موفقیت اضافه شدند.");
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setUploading(false);
    }
  }

  function removeImage(index: number) {
    setForm((current) => ({
      ...current,
      images: current.images.filter((_, i) => i !== index),
    }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSuccess("");

    if (!form.name.trim()) {
      setError("نام محصول را وارد کنید.");
      return;
    }

    if (!form.category) {
      setError("دسته‌بندی محصول را انتخاب کنید.");
      return;
    }

    if (!form.variants.length) {
      setError("حداقل یک تنوع برای محصول ثبت کنید.");
      return;
    }

    if (
      form.variants.some(
        (variant) =>
          variant.price < 0 ||
          variant.stock < 0 ||
          (variant.compareAtPrice != null &&
            variant.compareAtPrice < 0),
      )
    ) {
      setError("قیمت و موجودی نمی‌توانند منفی باشند.");
      return;
    }

    const payload = {
      name: form.name.trim(),
      slug: form.slug.trim(),
      description: form.description.trim(),
      category: form.category,
      tags: form.tags
        .split(",")
        .map((tag) => tag.trim())
        .filter(Boolean),
      images: form.images,
      variants: form.variants.map(
        ({ _id, ...variant }) => variant,
      ),
      isActive: form.isActive,
      isFeatured: form.isFeatured,
      seoTitle: form.seoTitle.trim(),
      seoDescription: form.seoDescription.trim(),
    };

    try {
      setSaving(true);

      await api.put(`/products/${productId}`, payload);

      setSuccess("تغییرات محصول با موفقیت ذخیره شد.");
      router.refresh();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  const inputClass =
    "mt-2 w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-800 outline-none transition placeholder:text-gray-400 focus:border-[#E60A54] focus:ring-4 focus:ring-[#E60A54]/10";

  const labelClass = "text-sm font-semibold text-gray-700";

  if (loading) {
    return (
      <main
        dir="rtl"
        className="flex min-h-[70vh] items-center justify-center bg-gray-50"
      >
        <div className="text-center">
          <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-pink-100 border-t-[#E60A54]" />
          <p className="mt-4 text-sm text-gray-500">
            در حال دریافت اطلاعات محصول...
          </p>
        </div>
      </main>
    );
  }

  return (
    <main dir="rtl" className="min-h-screen bg-[#faf9fb] p-4 sm:p-7">
      <div className="mx-auto max-w-6xl">
        <div className="mb-7 flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="mb-2 flex items-center gap-2 text-sm text-gray-400">
              <Link
                href="/admin"
                className="transition hover:text-[#E60A54]"
              >
                مدیریت
              </Link>
              <span>/</span>
              <Link
                href="/admin/products"
                className="transition hover:text-[#E60A54]"
              >
                محصولات
              </Link>
              <span>/</span>
              <span className="text-gray-600">ویرایش محصول</span>
            </div>

            <h1 className="text-2xl font-black text-gray-900 sm:text-3xl">
              ویرایش محصول
            </h1>
            <p className="mt-2 text-sm text-gray-500">
              مشخصات، قیمت، موجودی و تصاویر محصول را مدیریت کنید.
            </p>
          </div>

          <Link
            href="/admin/products"
            className="rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm font-semibold text-gray-700 transition hover:border-pink-200 hover:text-[#E60A54]"
          >
            بازگشت به محصولات
          </Link>
        </div>

        {error && (
          <div
            role="alert"
            className="mb-5 flex items-start justify-between gap-3 rounded-2xl border border-red-100 bg-red-50 p-4 text-sm text-red-700"
          >
            <span>{error}</span>
            <button
              type="button"
              onClick={() => setError("")}
              aria-label="بستن پیام"
            >
              ✕
            </button>
          </div>
        )}

        {success && (
          <div
            role="status"
            className="mb-5 rounded-2xl border border-green-100 bg-green-50 p-4 text-sm text-green-700"
          >
            {success}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <section className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm sm:p-7">
            <div className="mb-6 flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-pink-50 text-xl">
                ✦
              </div>
              <div>
                <h2 className="font-bold text-gray-900">
                  اطلاعات اصلی محصول
                </h2>
                <p className="mt-1 text-xs text-gray-400">
                  نام، آدرس و توضیحات محصول
                </p>
              </div>
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              <label className={labelClass}>
                نام محصول *
                <input
                  className={inputClass}
                  value={form.name}
                  onChange={(e) => updateField("name", e.target.value)}
                  placeholder="مثلاً مانتو لینن"
                  required
                />
              </label>

              <label className={labelClass}>
                نامک (Slug)
                <input
                  className={inputClass}
                  dir="ltr"
                  value={form.slug}
                  onChange={(e) => updateField("slug", e.target.value)}
                  placeholder="linen-manteau"
                />
              </label>

              <label className={labelClass}>
                دسته‌بندی *
                <select
                  className={inputClass}
                  value={form.category}
                  onChange={(e) =>
                    updateField("category", e.target.value)
                  }
                  required
                >
                  <option value="">انتخاب دسته‌بندی</option>
                  {categories.map((category) => (
                    <option key={category._id} value={category._id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </label>

              <label className={labelClass}>
                برچسب‌ها
                <input
                  className={inputClass}
                  value={form.tags}
                  onChange={(e) => updateField("tags", e.target.value)}
                  placeholder="تابستانی، لینن، جدید"
                />
                <span className="mt-1 block text-xs font-normal text-gray-400">
                  برچسب‌ها را با ویرگول جدا کنید.
                </span>
              </label>

              <label className={`${labelClass} sm:col-span-2`}>
                توضیحات محصول
                <textarea
                  className={`${inputClass} min-h-32 resize-y`}
                  value={form.description}
                  onChange={(e) =>
                    updateField("description", e.target.value)
                  }
                  placeholder="توضیحات کامل محصول..."
                />
              </label>
            </div>
          </section>

          <section className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm sm:p-7">
            <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="font-bold text-gray-900">
                  تصاویر محصول
                </h2>
                <p className="mt-1 text-xs text-gray-400">
                  تصویر اصلی و تصاویر تکمیلی محصول
                </p>
              </div>

              <label className="cursor-pointer rounded-xl bg-[#E60A54] px-4 py-3 text-sm font-bold text-white transition hover:bg-[#c90849]">
                {uploading ? "در حال آپلود..." : "+ افزودن تصویر"}
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  disabled={uploading}
                  onChange={handleUpload}
                  className="hidden"
                />
              </label>
            </div>

            {form.images.length === 0 ? (
              <div className="rounded-xl border-2 border-dashed border-gray-200 py-12 text-center">
                <div className="text-3xl">▧</div>
                <p className="mt-3 text-sm text-gray-500">
                  هنوز تصویری برای این محصول ثبت نشده است.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
                {form.images.map((url, index) => (
                  <div
                    key={`${url}-${index}`}
                    className="group relative overflow-hidden rounded-xl border border-gray-100 bg-gray-50"
                  >
                    <div className="flex aspect-square items-center justify-center p-2">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={url}
                        alt={`تصویر ${index + 1} محصول`}
                        className="h-full w-full rounded-lg object-contain"
                      />
                    </div>

                    {index === 0 && (
                      <span className="absolute right-2 top-2 rounded-full bg-[#E60A54] px-2.5 py-1 text-[10px] font-bold text-white">
                        تصویر اصلی
                      </span>
                    )}

                    <button
                      type="button"
                      onClick={() => removeImage(index)}
                      className="absolute left-2 top-2 rounded-lg bg-white/95 px-2.5 py-1.5 text-xs font-bold text-red-600 shadow-sm transition hover:bg-red-50"
                    >
                      حذف
                    </button>
                  </div>
                ))}
              </div>
            )}

            <p className="mt-4 text-xs leading-6 text-gray-400">
              اولین تصویر، تصویر اصلی محصول خواهد بود؛ این موضوع به نحوه
              نمایش تصاویر در فروشگاه بستگی دارد.
            </p>
          </section>

          <section className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm sm:p-7">
            <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="font-bold text-gray-900">
                  تنوع، قیمت و موجودی
                </h2>
                <p className="mt-1 text-xs text-gray-400">
                  برای هر رنگ یا سایز یک تنوع تعریف کنید.
                </p>
              </div>

              <button
                type="button"
                onClick={addVariant}
                className="rounded-xl border border-pink-200 bg-pink-50 px-4 py-2.5 text-sm font-bold text-[#E60A54] transition hover:bg-pink-100"
              >
                + افزودن تنوع
              </button>
            </div>

            <div className="space-y-5">
              {form.variants.map((variant, index) => (
                <div
                  key={variant._id ?? `variant-${index}`}
                  className="rounded-2xl border border-gray-200 bg-gray-50/70 p-4 sm:p-5"
                >
                  <div className="mb-4 flex items-center justify-between">
                    <span className="rounded-lg bg-white px-3 py-1.5 text-sm font-bold text-gray-700">
                      تنوع {index + 1}
                    </span>

                    <button
                      type="button"
                      disabled={form.variants.length === 1}
                      onClick={() => removeVariant(index)}
                      className="text-xs font-semibold text-red-500 transition hover:text-red-700 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      حذف تنوع
                    </button>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    <label className={labelClass}>
                      رنگ
                      <input
                        className={inputClass}
                        value={variant.color}
                        onChange={(e) =>
                          updateVariant(index, "color", e.target.value)
                        }
                        placeholder="مشکی"
                      />
                    </label>

                    <label className={labelClass}>
                      سایز
                      <input
                        className={inputClass}
                        value={variant.size}
                        onChange={(e) =>
                          updateVariant(index, "size", e.target.value)
                        }
                        placeholder="مثلاً M یا 38"
                      />
                    </label>

                    <label className={labelClass}>
                      کد محصول (SKU)
                      <input
                        className={inputClass}
                        dir="ltr"
                        value={variant.sku}
                        onChange={(e) =>
                          updateVariant(index, "sku", e.target.value)
                        }
                        placeholder="AME-001"
                      />
                    </label>

                    <label className={labelClass}>
                      قیمت فروش (تومان) *
                      <input
                        type="number"
                        min="0"
                        className={inputClass}
                        value={variant.price}
                        onChange={(e) =>
                          updateVariant(
                            index,
                            "price",
                            Number(e.target.value),
                          )
                        }
                        required
                      />
                    </label>

                    <label className={labelClass}>
                      قیمت قبل از تخفیف (تومان)
                      <input
                        type="number"
                        min="0"
                        className={inputClass}
                        value={variant.compareAtPrice ?? ""}
                        onChange={(e) =>
                          updateVariant(
                            index,
                            "compareAtPrice",
                            e.target.value === ""
                              ? null
                              : Number(e.target.value),
                          )
                        }
                        placeholder="اختیاری"
                      />
                    </label>

                    <label className={labelClass}>
                      موجودی
                      <input
                        type="number"
                        min="0"
                        className={inputClass}
                        value={variant.stock}
                        onChange={(e) =>
                          updateVariant(
                            index,
                            "stock",
                            Number(e.target.value),
                          )
                        }
                        required
                      />
                    </label>
                  </div>

                  <label className="mt-4 flex cursor-pointer items-center gap-3 rounded-xl border border-gray-100 bg-white p-3 text-sm text-gray-700">
                    <input
                      type="checkbox"
                      checked={variant.isActive}
                      onChange={(e) =>
                        updateVariant(index, "isActive", e.target.checked)
                      }
                      className="h-4 w-4 accent-[#E60A54]"
                    />
                    این تنوع قابل فروش باشد
                  </label>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm sm:p-7">
            <h2 className="mb-5 font-bold text-gray-900">
              وضعیت نمایش محصول
            </h2>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-gray-100 p-4">
                <input
                  type="checkbox"
                  checked={form.isActive}
                  onChange={(e) =>
                    updateField("isActive", e.target.checked)
                  }
                  className="h-4 w-4 accent-[#E60A54]"
                />
                <span>
                  <span className="block text-sm font-semibold text-gray-800">
                    محصول فعال
                  </span>
                  <span className="mt-1 block text-xs text-gray-400">
                    محصول در فروشگاه قابل نمایش باشد.
                  </span>
                </span>
              </label>

              <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-gray-100 p-4">
                <input
                  type="checkbox"
                  checked={form.isFeatured}
                  onChange={(e) =>
                    updateField("isFeatured", e.target.checked)
                  }
                  className="h-4 w-4 accent-[#E60A54]"
                />
                <span>
                  <span className="block text-sm font-semibold text-gray-800">
                    محصول ویژه
                  </span>
                  <span className="mt-1 block text-xs text-gray-400">
                    برای نمایش در بخش محصولات ویژه.
                  </span>
                </span>
              </label>
            </div>
          </section>

          <section className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm sm:p-7">
            <h2 className="font-bold text-gray-900">
              تنظیمات سئو
            </h2>
            <p className="mt-1 text-xs text-gray-400">
              در صورت پشتیبانی بک‌اند، این فیلدها برای صفحه محصول ذخیره می‌شوند.
            </p>

            <div className="mt-5 space-y-5">
              <label className={labelClass}>
                عنوان سئو
                <input
                  className={inputClass}
                  value={form.seoTitle}
                  onChange={(e) =>
                    updateField("seoTitle", e.target.value)
                  }
                  maxLength={70}
                  placeholder="عنوان مناسب برای موتورهای جستجو"
                />
                <span className="mt-1 block text-xs font-normal text-gray-400">
                  {form.seoTitle.length}/70
                </span>
              </label>

              <label className={labelClass}>
                توضیحات سئو
                <textarea
                  className={`${inputClass} min-h-24 resize-y`}
                  value={form.seoDescription}
                  onChange={(e) =>
                    updateField("seoDescription", e.target.value)
                  }
                  maxLength={170}
                  placeholder="خلاصه جذاب و دقیق درباره محصول..."
                />
                <span className="mt-1 block text-xs font-normal text-gray-400">
                  {form.seoDescription.length}/170
                </span>
              </label>
            </div>
          </section>

          <div className="sticky bottom-3 z-10 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-gray-100 bg-white/95 p-4 shadow-lg backdrop-blur">
            <p className="hidden text-xs text-gray-500 sm:block">
              پس از بررسی اطلاعات، تغییرات را ذخیره کنید.
            </p>

            <div className="mr-auto flex gap-3">
              <Link
                href="/admin/products"
                className="rounded-xl border border-gray-200 px-4 py-3 text-sm font-semibold text-gray-600 transition hover:bg-gray-50"
              >
                انصراف
              </Link>

              <button
                type="submit"
                disabled={saving || uploading}
                className="rounded-xl bg-[#E60A54] px-6 py-3 text-sm font-bold text-white shadow-md shadow-pink-200 transition hover:bg-[#c90849] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {saving ? "در حال ذخیره..." : "ذخیره تغییرات"}
              </button>
            </div>
          </div>
        </form>
      </div>
    </main>
  );
}
