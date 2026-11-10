
"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import {
  ArrowRight,
  FolderTree,
  ImagePlus,
  Link2,
  CheckCircle2,
  X,
  RefreshCw,
} from "lucide-react";
import {
  api,
  categoriesApi,
  type Category,
  type CategoryInput,
} from "@/lib/api";

function slugify(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export default function NewCategoryPage() {
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [slugEdited, setSlugEdited] = useState(false);
  const [description, setDescription] = useState("");
  const [parent, setParent] = useState("");
  const [active, setActive] = useState(true);
  const [image, setImage] = useState<File | null>(null);
  const [imageUrl, setImageUrl] = useState("");
  const [preview, setPreview] = useState("");
  const [categories, setCategories] = useState<Category[]>([]);
  const [editId, setEditId] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const loadData = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const allCategories = await categoriesApi.getAll();
      setCategories(allCategories);

      const params = new URLSearchParams(window.location.search);
      const id = params.get("edit");

      if (id) {
        const category = allCategories.find((item) => item._id === id);

        if (!category) {
          throw new Error("دسته‌بندی موردنظر در فهرست پیدا نشد.");
        }

        setEditId(category._id);
        setName(category.name);
        setSlug(category.slug);
        setSlugEdited(true);
        setDescription(category.description ?? "");
        setImageUrl(category.image ?? "");
        setPreview(category.image ?? "");
        setActive(category.isActive !== false);

        const parentId =
          typeof category.parent === "string"
            ? category.parent
            : category.parent?._id ?? "";

        setParent(parentId);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "دریافت اطلاعات ناموفق بود.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  useEffect(() => {
    return () => {
      if (preview.startsWith("blob:")) {
        URL.revokeObjectURL(preview);
      }
    };
  }, [preview]);

  function handleImage(file?: File) {
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setError("لطفاً یک فایل تصویری انتخاب کن.");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError("حجم تصویر باید حداکثر ۵ مگابایت باشد.");
      return;
    }

    setImage(file);
    setPreview(URL.createObjectURL(file));
    setError("");
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSuccess("");

    if (!name.trim() || !slug.trim()) {
      setError("نام و اسلاگ دسته‌بندی را وارد کن.");
      return;
    }

    setSaving(true);

    try {
      let finalImageUrl = imageUrl;

      if (image) {
        const formData = new FormData();
        formData.append("file", image);

        const uploadResponse = await api.post("/uploads", formData, {
          timeout: 60000,
          headers: {
            "Content-Type": undefined,
          },
        });

        finalImageUrl = uploadResponse.data?.url ?? "";

        if (!finalImageUrl) {
          throw new Error(
            uploadResponse.data?.message ?? "آپلود تصویر انجام نشد.",
          );
        }
      }

      const payload: CategoryInput = {
        name: name.trim(),
        slug: slug.trim(),
        description: description.trim(),
        image: finalImageUrl || undefined,
        parent: parent || null,
        isActive: active,
      };

      if (editId) {
        await categoriesApi.update(editId, payload);
        setSuccess("دسته‌بندی با موفقیت ویرایش شد.");
      } else {
        await categoriesApi.create(payload);
        setSuccess("دسته‌بندی با موفقیت ایجاد شد.");
      }

      window.location.assign("/admin/categories");
    } catch (err) {
      setError(err instanceof Error ? err.message : "ذخیره دسته‌بندی ناموفق بود.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div dir="rtl" className="min-h-screen bg-[#f8f8fa] p-4 text-[#24232b] sm:p-7 lg:p-9">
      <div className="mb-7 flex items-center gap-3">
        <Link
          href="/admin/categories"
          className="flex h-11 w-11 items-center justify-center rounded-xl border border-gray-200 bg-white hover:border-pink-200 hover:text-[#E60A54]"
          aria-label="بازگشت"
        >
          <ArrowRight size={20} />
        </Link>
        <div>
          <p className="mb-1 text-xs text-gray-400">مدیریت فروشگاه / دسته‌بندی‌ها</p>
          <h1 className="text-2xl font-black">
            {editId ? "ویرایش دسته‌بندی" : "افزودن دسته‌بندی"}
          </h1>
        </div>
      </div>

      {loading ? (
        <div className="rounded-2xl border border-gray-100 bg-white p-12 text-center text-sm text-gray-500">
          <RefreshCw size={22} className="mx-auto mb-3 animate-spin" />
          در حال دریافت اطلاعات...
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="mx-auto grid max-w-6xl grid-cols-1 items-start gap-6 lg:grid-cols-[1fr_320px]">
          <div className="space-y-6">
            <section className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm sm:p-7">
              <div className="mb-6 flex items-center gap-3 border-b border-gray-100 pb-5">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-pink-50 text-[#E60A54]">
                  <FolderTree size={22} />
                </div>
                <div>
                  <h2 className="font-extrabold">اطلاعات دسته‌بندی</h2>
                  <p className="mt-1 text-xs text-gray-400">اطلاعات اصلی را وارد کن.</p>
                </div>
              </div>

              <div className="space-y-5">
                <Field label="نام دسته‌بندی" required>
                  <input
                    value={name}
                    onChange={(event) => {
                      const value = event.target.value;
                      setName(value);
                      if (!slugEdited) setSlug(slugify(value));
                    }}
                    placeholder="مثلاً مانتو و رویه"
                    className="form-input"
                    required
                  />
                </Field>

                <Field label="اسلاگ انگلیسی" required>
                  <div className="flex items-center gap-2 rounded-xl border border-gray-200 px-3 focus-within:border-[#E60A54]">
                    <Link2 size={17} className="shrink-0 text-gray-400" />
                    <input
                      dir="ltr"
                      value={slug}
                      onChange={(event) => {
                        setSlugEdited(true);
                        setSlug(slugify(event.target.value));
                      }}
                      placeholder="women-manto"
                      className="w-full bg-transparent py-3.5 text-left text-sm outline-none"
                      required
                    />
                  </div>
                </Field>

                <Field label="توضیحات">
                  <textarea
                    value={description}
                    onChange={(event) => setDescription(event.target.value)}
                    placeholder="توضیح کوتاهی درباره دسته‌بندی..."
                    rows={4}
                    className="form-input resize-y"
                  />
                </Field>

                <Field label="دسته‌بندی والد">
                  <select
                    value={parent}
                    onChange={(event) => setParent(event.target.value)}
                    className="form-input"
                  >
                    <option value="">بدون والد (دسته اصلی)</option>
                    {categories
                      .filter((item) => item._id !== editId)
                      .map((item) => (
                        <option key={item._id} value={item._id}>
                          {item.name}
                        </option>
                      ))}
                  </select>
                </Field>
              </div>
            </section>

            <section className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm sm:p-7">
              <h2 className="mb-2 font-extrabold">تصویر دسته‌بندی</h2>
              <p className="mb-5 text-xs leading-6 text-gray-400">
                JPG، PNG، WEBP یا AVIF؛ حداکثر ۵ مگابایت.
              </p>

              {preview ? (
                <div className="relative w-full max-w-xs overflow-hidden rounded-2xl border border-gray-200">
                  <img src={preview} alt="پیش‌نمایش دسته‌بندی" className="aspect-square w-full object-cover" />
                  <button
                    type="button"
                    onClick={() => {
                      setPreview("");
                      setImage(null);
                      setImageUrl("");
                    }}
                    className="absolute left-3 top-3 rounded-full bg-white p-2 text-red-600 shadow"
                    aria-label="حذف تصویر"
                  >
                    <X size={17} />
                  </button>
                </div>
              ) : (
                <label className="flex min-h-48 cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-gray-200 bg-gray-50/70 p-6 text-center hover:border-pink-300 hover:bg-pink-50/30">
                  <ImagePlus size={30} className="mb-3 text-[#E60A54]" />
                  <span className="text-sm font-bold">انتخاب تصویر</span>
                  <span className="mt-2 text-xs text-gray-400">حداکثر ۵ مگابایت</span>
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/avif"
                    className="hidden"
                    onChange={(event) => handleImage(event.target.files?.[0])}
                  />
                </label>
              )}
              {image && <p className="mt-3 text-xs text-gray-500">{image.name}</p>}
            </section>
          </div>

          <aside className="space-y-5">
            <section className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
              <h2 className="mb-5 font-extrabold">وضعیت انتشار</h2>
              <button
                type="button"
                onClick={() => setActive((value) => !value)}
                className="flex w-full items-center justify-between gap-3 rounded-xl border border-gray-100 p-3 text-right"
              >
                <div>
                  <p className="text-sm font-bold">{active ? "دسته‌بندی فعال" : "دسته‌بندی غیرفعال"}</p>
                  <p className="mt-1 text-xs text-gray-400">
                    {active ? "قابل نمایش در فروشگاه" : "در فروشگاه نمایش داده نمی‌شود"}
                  </p>
                </div>
                <span className={`relative h-6 w-11 rounded-full transition ${active ? "bg-[#E60A54]" : "bg-gray-300"}`}>
                  <span className={`absolute top-1 h-4 w-4 rounded-full bg-white transition-all ${active ? "right-1" : "right-6"}`} />
                </span>
              </button>
            </section>

            <section className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
              <h2 className="mb-4 font-extrabold">پیش‌نمایش</h2>
              <div className="overflow-hidden rounded-xl border border-gray-100">
                {preview ? (
                  <img src={preview} alt="" className="aspect-[4/3] w-full object-cover" />
                ) : (
                  <div className="flex aspect-[4/3] items-center justify-center bg-pink-50 text-[#E60A54]">
                    <FolderTree size={36} />
                  </div>
                )}
                <div className="p-4">
                  <p className="font-bold">{name || "نام دسته‌بندی"}</p>
                  <p className="mt-1 text-left text-xs text-gray-400" dir="ltr">
                    {slug || "category-slug"}
                  </p>
                </div>
              </div>
            </section>

            {error && (
              <div className="rounded-xl border border-red-100 bg-red-50 p-4 text-sm leading-6 text-red-700">
                {error}
              </div>
            )}
            {success && (
              <div className="rounded-xl border border-emerald-100 bg-emerald-50 p-4 text-sm leading-6 text-emerald-700">
                {success}
              </div>
            )}

            <button
              type="submit"
              disabled={saving}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#E60A54] px-5 py-4 font-bold text-white shadow-lg shadow-pink-100 hover:bg-[#c90849] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saving ? (
                <RefreshCw size={19} className="animate-spin" />
              ) : (
                <CheckCircle2 size={19} />
              )}
              {saving ? "در حال ذخیره..." : editId ? "ذخیره تغییرات" : "ثبت دسته‌بندی"}
            </button>

            <Link
              href="/admin/categories"
              className="block rounded-xl border border-gray-200 bg-white px-5 py-3 text-center text-sm font-bold text-gray-600 hover:bg-gray-50"
            >
              انصراف
            </Link>
          </aside>
        </form>
      )}

      <style jsx>{`
        .form-input {
          width: 100%;
          border: 1px solid #e5e7eb;
          border-radius: 12px;
          background: white;
          padding: 13px 14px;
          font-size: 14px;
          outline: none;
          transition: border-color 150ms ease;
        }
        .form-input:focus {
          border-color: #e60a54;
        }
        .form-input::placeholder {
          color: #9ca3af;
        }
      `}</style>
    </div>
  );
}

function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className="block space-y-2">
      <span className="text-sm font-bold">
        {label}
        {required && <span className="mr-1 text-[#E60A54]">*</span>}
      </span>
      {children}
    </label>
  );
}
