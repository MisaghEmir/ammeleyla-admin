"use client";

import {
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
  type FormEvent,
} from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  ArrowUpLeft,
  Check,
  ChevronDown,
  ImagePlus,
  Images,
  Layers3,
  Link2,
  LoaderCircle,
  Package,
  Plus,
  Search,
  Sparkles,
  Trash2,
  Upload,
  X,
  Eye,
  Globe,
  Tag,
  Boxes,
  FileText,
  CircleHelp,
} from "lucide-react";

import { api, type ProductInput } from "@/lib/api";
import { useCategories, useCreateProduct } from "@/lib/queries";

type ProductImage = {
  id: string;
  url: string;
  alt: string;
  file?: File;
  preview?: string;
};

type Variant = {
  id: string;
  color: string;
  size: string;
  sku: string;
  price: string;
  compareAtPrice: string;
  stock: string;
  isActive: boolean;
};

const initialVariant = (): Variant => ({
  id: crypto.randomUUID(),
  color: "",
  size: "",
  sku: "",
  price: "",
  compareAtPrice: "",
  stock: "0",
  isActive: true,
});

const inputClass =
  "w-full rounded-xl border border-[#e8e3e5] bg-white px-4 py-3 text-sm text-[#292329] outline-none transition placeholder:text-[#b5abb2] hover:border-[#d7c5ce] focus:border-[#E60A54] focus:ring-4 focus:ring-[#E60A54]/10";

const labelClass = "mb-2 block text-sm font-semibold text-[#393039]";

function slugify(value: string) {
  return value
    .trim()
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function getErrorMessage(error: unknown) {
  const err = error as {
    response?: { data?: { message?: string; error?: string } };
    message?: string;
  };

  return (
    err.response?.data?.message ||
    err.response?.data?.error ||
    err.message ||
    "عملیات ناموفق بود. دوباره تلاش کن."
  );
}

export default function NewProductPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const categoriesQuery = useCategories();
  const createProduct = useCreateProduct();

  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [slugEdited, setSlugEdited] = useState(false);
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [tagsText, setTagsText] = useState("");

  const [images, setImages] = useState<ProductImage[]>([]);
  const [variants, setVariants] = useState<Variant[]>([initialVariant()]);

  const [isActive, setIsActive] = useState(true);
  const [isFeatured, setIsFeatured] = useState(false);

  const [seoTitle, setSeoTitle] = useState("");
  const [seoDescription, setSeoDescription] = useState("");
  const [focusKeyword, setFocusKeyword] = useState("");
  const [canonicalUrl, setCanonicalUrl] = useState("");

  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  type AdminCategory = {
    _id?: string;
    id?: string;
    name: string;
    slug?: string;
  };

  const categoriesData = categoriesQuery.data;

  function isAdminCategory(value: unknown): value is AdminCategory {
    if (typeof value !== "object" || value === null) {
      return false;
    }

    const item = value as Record<string, unknown>;

    return (
      typeof item.name === "string" &&
      (typeof item._id === "string" || typeof item.id === "string")
    );
  }

  function extractCategories(data: unknown): AdminCategory[] {
    if (Array.isArray(data)) {
      return data.filter(isAdminCategory);
    }

    if (typeof data !== "object" || data === null) {
      return [];
    }

    const result = data as Record<string, unknown>;

    if (Array.isArray(result.categories)) {
      return result.categories.filter(isAdminCategory);
    }

    if (Array.isArray(result.data)) {
      return result.data.filter(isAdminCategory);
    }

    return [];
  }

  const categories = extractCategories(categoriesData);

  useEffect(() => {
    return () => {
      images.forEach((image) => {
        if (image.preview) URL.revokeObjectURL(image.preview);
      });
    };
  }, [images]);

  const totalStock = variants.reduce(
    (total, variant) => total + Math.max(0, Number(variant.stock) || 0),
    0,
  );

  const lowestPrice = variants.reduce<number | null>((lowest, variant) => {
    if (!variant.price || Number(variant.price) <= 0) return lowest;
    const price = Number(variant.price);
    return lowest === null ? price : Math.min(lowest, price);
  }, null);

  const tags = tagsText
    .split(/[,،\n]/)
    .map((tag) => tag.trim())
    .filter(Boolean);

  function handleNameChange(value: string) {
    setName(value);

    if (!slugEdited) {
      setSlug(slugify(value));
    }

    if (!seoTitle) {
      setSeoTitle(value);
    }
  }

  function handleSlugChange(value: string) {
    setSlugEdited(true);
    setSlug(slugify(value));
  }

  function handleImagesChange(event: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? []);
    event.target.value = "";

    const validFiles = files.filter((file) => {
      const isImage = file.type.startsWith("image/");
      const isSmallEnough = file.size <= 5 * 1024 * 1024;

      return isImage && isSmallEnough;
    });

    if (validFiles.length !== files.length) {
      setErrorMessage("فقط تصاویر با حجم حداکثر ۵ مگابایت قابل انتخاب هستند.");
    } else {
      setErrorMessage("");
    }

    setImages((previous) => {
      const remaining = Math.max(0, 8 - previous.length);
      const selected = validFiles.slice(0, remaining).map((file) => ({
        id: crypto.randomUUID(),
        url: "",
        alt: name || "تصویر محصول",
        file,
        preview: URL.createObjectURL(file),
      }));

      return [...previous, ...selected];
    });
  }

  function updateImage(id: string, patch: Partial<ProductImage>) {
    setImages((previous) =>
      previous.map((image) =>
        image.id === id ? { ...image, ...patch } : image,
      ),
    );
  }

  function removeImage(id: string) {
    setImages((previous) => {
      const target = previous.find((image) => image.id === id);

      if (target?.preview) {
        URL.revokeObjectURL(target.preview);
      }

      return previous.filter((image) => image.id !== id);
    });
  }

  function updateVariant(id: string, patch: Partial<Variant>) {
    setVariants((previous) =>
      previous.map((variant) =>
        variant.id === id ? { ...variant, ...patch } : variant,
      ),
    );
  }

  function addVariant() {
    setVariants((previous) => [...previous, initialVariant()]);
  }

  function removeVariant(id: string) {
    setVariants((previous) => {
      if (previous.length === 1) return previous;
      return previous.filter((variant) => variant.id !== id);
    });
  }

 
async function uploadImages() {
  const uploaded: Array<{ url: string; alt: string }> = [];

  for (const image of images) {
    if (!image.file) {
      if (image.url) {
        uploaded.push({
          url: image.url,
          alt: image.alt || name,
        });
      }
      continue;
    }

    const formData = new FormData();
    formData.append("file", image.file);

    const response = await api.post("/uploads", formData, {
      timeout: 60000,
      headers: {
        "Content-Type": undefined,
      },
    });

    const result = response.data;
    const url = result?.url ?? result?.data?.url;

    if (
      response.data?.success !== true ||
      typeof url !== "string" ||
      !url
    ) {
      throw new Error(
        response.data?.message || "آدرس تصویر از سرور دریافت نشد.",
      );
    }

    uploaded.push({
      url,
      alt: image.alt || name,
    });
  }

  return uploaded;
}


  async function handleSubmit(
    event: FormEvent<HTMLFormElement>,
    publish: boolean,
  ) {
    event.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");

    if (!name.trim()) {
      setErrorMessage("نام محصول را وارد کن.");
      return;
    }

    if (!slug.trim()) {
      setErrorMessage(
        "اسلاگ انگلیسی محصول را وارد کن؛ مثلاً manto-katan-zananeh.",
      );
      return;
    }

    if (!category) {
      setErrorMessage("یک دسته‌بندی برای محصول انتخاب کن.");
      return;
    }

    if (
      variants.some((variant) => !variant.price || Number(variant.price) <= 0)
    ) {
      setErrorMessage("قیمت معتبر را برای تمام تنوع‌های محصول وارد کن.");
      return;
    }

    if (variants.some((variant) => Number(variant.stock) < 0)) {
      setErrorMessage("موجودی نمی‌تواند منفی باشد.");
      return;
    }

    setSaving(true);

    try {
      const uploadedImages = await uploadImages();

      const productPayload = {
        name: name.trim(),
        slug: slug.trim(),
        description: description.trim(),
        category,
        tags,
        images: uploadedImages,
        variants: variants.map((variant) => ({
          color: variant.color.trim(),
          size: variant.size.trim(),
          sku: variant.sku.trim(),
          price: Number(variant.price),
          compareAtPrice: variant.compareAtPrice
            ? Number(variant.compareAtPrice)
            : undefined,
          stock: Number(variant.stock) || 0,
          isActive: variant.isActive,
        })),
        isActive: publish ? true : isActive,
        isFeatured,
        seoTitle: seoTitle.trim(),
        seoDescription: seoDescription.trim(),
        focusKeyword: focusKeyword.trim(),
        canonicalUrl: canonicalUrl.trim(),
      } as ProductInput;

      await createProduct.mutateAsync(productPayload);

      setSuccessMessage("محصول با موفقیت ثبت شد.");

      router.push("/admin/products");
      router.refresh();
    } catch (error) {
      setErrorMessage(getErrorMessage(error));
    } finally {
      setSaving(false);
    }
  }

  return (
    <main dir="rtl" className="min-h-screen bg-[#faf8f9] pb-28 text-[#292329]">
      <div className="mx-auto max-w-[1500px] px-4 py-6 sm:px-6 lg:px-9 lg:py-9">
        {/* Page heading */}
        <div className="mb-8 flex flex-col justify-between gap-5 sm:flex-row sm:items-center">
          <div>
            <Link
              href="/admin/products"
              className="mb-4 inline-flex items-center gap-2 text-sm text-[#8e818a] transition hover:text-[#E60A54]"
            >
              <ArrowRight size={16} />
              بازگشت به محصولات
            </Link>

            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#E60A54]/10 text-[#E60A54]">
                <Package size={24} />
              </div>
              <div>
                <h1 className="text-2xl font-black tracking-tight sm:text-3xl">
                  افزودن محصول جدید
                </h1>
                <p className="mt-1 text-sm text-[#958994]">
                  محصولت را با جزئیات کامل به فروشگاه اضافه کن.
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start rounded-full border border-[#eee7eb] bg-white px-4 py-2 text-xs font-medium text-[#8e818a] shadow-sm sm:self-center">
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
            پنل مدیریت Amé Leila
          </div>
        </div>

        {/* Summary cards */}
        <div className="mb-7 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <SummaryCard
            icon={<Images size={19} />}
            label="تصاویر انتخاب‌شده"
            value={`${images.length} از ۸`}
            detail="تصاویر باکیفیت محصول"
          />
          <SummaryCard
            icon={<Layers3 size={19} />}
            label="تنوع محصول"
            value={String(variants.length)}
            detail="رنگ، سایز و قیمت"
          />
          <SummaryCard
            icon={<Boxes size={19} />}
            label="موجودی کل"
            value={totalStock.toLocaleString("fa-IR")}
            detail="مجموع تعداد موجود"
          />
        </div>

        <form
          onSubmit={(event) => handleSubmit(event, false)}
          className="grid grid-cols-1 items-start gap-6 xl:grid-cols-[minmax(0,1fr)_340px]"
        >
          {/* Main column */}
          <div className="min-w-0 space-y-6">
            {/* General info */}
            <SectionCard
              icon={<FileText size={19} />}
              title="اطلاعات محصول"
              description="نام، آدرس و توضیحات اصلی محصول"
              step="01"
            >
              <div className="grid gap-5 md:grid-cols-2">
                <div className="md:col-span-2">
                  <label className={labelClass}>
                    نام محصول <Required />
                  </label>
                  <input
                    className={inputClass}
                    value={name}
                    onChange={(event) => handleNameChange(event.target.value)}
                    placeholder="مثلاً مانتو کتان زنانه"
                    required
                  />
                  <p className="mt-2 text-xs text-[#a69aa3]">
                    نام واضح و توصیفی به مشتری کمک می‌کند محصول را بهتر پیدا
                    کند.
                  </p>
                </div>

                <div className="md:col-span-2">
                  <label className={labelClass}>
                    آدرس محصول (Slug) <Required />
                  </label>
                  <div className="flex items-center gap-2 rounded-xl border border-[#e8e3e5] bg-[#fcfafb] px-3 transition focus-within:border-[#E60A54] focus-within:ring-4 focus-within:ring-[#E60A54]/10">
                    <Link2 size={17} className="shrink-0 text-[#b3a5ae]" />
                    <input
                      className="w-full bg-transparent py-3 text-left text-sm outline-none placeholder:text-[#b5abb2]"
                      dir="ltr"
                      value={slug}
                      onChange={(event) => handleSlugChange(event.target.value)}
                      placeholder="manto-katan-zananeh"
                      required
                    />
                  </div>
                  <p className="mt-2 text-xs text-[#a69aa3]" dir="ltr">
                    /products/{slug || "your-product-slug"}
                  </p>
                </div>

                <div className="md:col-span-2">
                  <label className={labelClass}>توضیحات محصول</label>
                  <textarea
                    className={`${inputClass} min-h-36 resize-y leading-7`}
                    value={description}
                    onChange={(event) => setDescription(event.target.value)}
                    placeholder="جنس پارچه، ویژگی‌ها، نحوه نگهداری و جزئیات محصول را بنویس..."
                    rows={5}
                  />
                  <div className="mt-2 flex justify-between text-xs text-[#a69aa3]">
                    <span>توضیحات دقیق، تجربه خرید بهتری می‌سازد.</span>
                    <span>
                      {description.length.toLocaleString("fa-IR")} کاراکتر
                    </span>
                  </div>
                </div>
              </div>
            </SectionCard>

            {/* Images */}
            <SectionCard
              icon={<Images size={19} />}
              title="گالری تصاویر"
              description="حداکثر ۸ تصویر با حجم حداکثر ۵ مگابایت برای هر تصویر"
              step="02"
              badge="ضروری"
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={handleImagesChange}
              />

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={images.length >= 8}
                className="group flex w-full flex-col items-center justify-center rounded-2xl border-2 border-dashed border-[#e9d7e0] bg-gradient-to-b from-[#fff9fc] to-white px-5 py-10 text-center transition hover:border-[#E60A54]/60 hover:bg-[#fff5f9] disabled:cursor-not-allowed disabled:opacity-50"
              >
                <span className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#E60A54]/10 text-[#E60A54] transition group-hover:scale-105">
                  <Upload size={25} />
                </span>
                <span className="font-bold">تصاویر محصول را انتخاب کن</span>
                <span className="mt-2 text-sm text-[#9c8d97]">
                  برای انتخاب فایل کلیک کن؛ انتخاب چند تصویر امکان‌پذیر است.
                </span>
                <span className="mt-4 rounded-lg bg-white px-3 py-1.5 text-xs text-[#8e818a] shadow-sm">
                  PNG · JPG · WEBP
                </span>
              </button>

              {images.length > 0 && (
                <div className="mt-5 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
                  {images.map((image, index) => (
                    <div
                      key={image.id}
                      className="overflow-hidden rounded-2xl border border-[#eee7eb] bg-white"
                    >
                      <div className="group relative aspect-square overflow-hidden bg-[#f8f5f7]">
                        {image.preview || image.url ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={image.preview || image.url}
                            alt={image.alt}
                            className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                          />
                        ) : (
                          <div className="flex h-full items-center justify-center text-[#c4b7c0]">
                            <ImagePlus size={30} />
                          </div>
                        )}

                        {index === 0 && (
                          <span className="absolute right-2 top-2 rounded-lg bg-[#E60A54] px-2 py-1 text-[10px] font-bold text-white shadow">
                            تصویر اصلی
                          </span>
                        )}

                        <button
                          type="button"
                          onClick={() => removeImage(image.id)}
                          aria-label="حذف تصویر"
                          className="absolute left-2 top-2 flex h-8 w-8 items-center justify-center rounded-lg bg-white/95 text-rose-600 opacity-100 shadow transition hover:bg-rose-50 sm:opacity-0 sm:group-hover:opacity-100"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>

                      <div className="p-3">
                        <label className="mb-1.5 block text-xs font-semibold text-[#7c6e78]">
                          متن جایگزین تصویر
                        </label>
                        <input
                          value={image.alt}
                          onChange={(event) =>
                            updateImage(image.id, { alt: event.target.value })
                          }
                          className="w-full rounded-lg border border-[#eee7eb] px-2.5 py-2 text-xs outline-none focus:border-[#E60A54]"
                          placeholder="توضیح تصویر"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <p className="mt-4 text-xs leading-6 text-[#9c8d97]">
                تصویر اول به‌عنوان تصویر اصلی محصول در نظر گرفته می‌شود. متن
                جایگزین تصاویر برای دسترس‌پذیری و سئو مفید است.
              </p>
            </SectionCard>

            {/* Variants */}
            <SectionCard
              icon={<Layers3 size={19} />}
              title="تنوع و موجودی"
              description="قیمت، رنگ، سایز و تعداد موجود هر تنوع را مشخص کن."
              step="03"
            >
              <div className="mb-5 flex flex-col justify-between gap-3 rounded-xl bg-[#faf7f9] p-4 sm:flex-row sm:items-center">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-[#E60A54] shadow-sm">
                    <Tag size={18} />
                  </div>
                  <div>
                    <p className="text-sm font-bold">تنوع‌های محصول</p>
                    <p className="mt-1 text-xs text-[#a0939d]">
                      برای هر ترکیب رنگ و سایز، یک ردیف بساز.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={addVariant}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#E60A54] px-4 py-2.5 text-sm font-bold text-white transition hover:bg-[#c80848]"
                >
                  <Plus size={17} />
                  افزودن تنوع
                </button>
              </div>

              <div className="space-y-4">
                {variants.map((variant, index) => (
                  <div
                    key={variant.id}
                    className="rounded-2xl border border-[#eee7eb] bg-white p-4 sm:p-5"
                  >
                    <div className="mb-5 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#E60A54]/10 text-sm font-black text-[#E60A54]">
                          {String(index + 1).padStart(2, "0")}
                        </span>
                        <div>
                          <p className="text-sm font-bold">
                            تنوع شماره {index + 1}
                          </p>
                          <p className="mt-1 text-xs text-[#a0939d]">
                            مشخصات و قیمت‌گذاری
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeVariant(variant.id)}
                        disabled={variants.length === 1}
                        aria-label="حذف تنوع"
                        className="rounded-lg p-2 text-[#b5a7b1] transition hover:bg-rose-50 hover:text-rose-600 disabled:cursor-not-allowed disabled:opacity-30"
                      >
                        <Trash2 size={17} />
                      </button>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                      <Field label="رنگ">
                        <input
                          className={inputClass}
                          value={variant.color}
                          onChange={(event) =>
                            updateVariant(variant.id, {
                              color: event.target.value,
                            })
                          }
                          placeholder="مثلاً مشکی"
                        />
                      </Field>

                      <Field label="سایز">
                        <input
                          className={inputClass}
                          value={variant.size}
                          onChange={(event) =>
                            updateVariant(variant.id, {
                              size: event.target.value,
                            })
                          }
                          placeholder="مثلاً M یا ۳۸"
                        />
                      </Field>

                      <Field label="کد SKU">
                        <input
                          className={inputClass}
                          value={variant.sku}
                          onChange={(event) =>
                            updateVariant(variant.id, {
                              sku: event.target.value,
                            })
                          }
                          placeholder="ML-001-BLK"
                          dir="ltr"
                        />
                      </Field>

                      <Field label="قیمت فروش (تومان) *">
                        <input
                          className={inputClass}
                          type="number"
                          min="1"
                          step="1"
                          required
                          value={variant.price}
                          onChange={(event) =>
                            updateVariant(variant.id, {
                              price: event.target.value,
                            })
                          }
                          placeholder="مثلاً ۸۹۰۰۰۰"
                        />
                      </Field>

                      <Field label="قیمت قبل از تخفیف (تومان)">
                        <input
                          className={inputClass}
                          type="number"
                          min="0"
                          step="1"
                          value={variant.compareAtPrice}
                          onChange={(event) =>
                            updateVariant(variant.id, {
                              compareAtPrice: event.target.value,
                            })
                          }
                          placeholder="اختیاری"
                        />
                      </Field>

                      <Field label="موجودی">
                        <input
                          className={inputClass}
                          type="number"
                          min="0"
                          step="1"
                          value={variant.stock}
                          onChange={(event) =>
                            updateVariant(variant.id, {
                              stock: event.target.value,
                            })
                          }
                          placeholder="۰"
                        />
                      </Field>
                    </div>

                    <div className="mt-4 flex items-center justify-between border-t border-[#f2edf0] pt-4">
                      <span className="text-sm text-[#8d7f89]">
                        وضعیت این تنوع
                      </span>
                      <button
                        type="button"
                        onClick={() =>
                          updateVariant(variant.id, {
                            isActive: !variant.isActive,
                          })
                        }
                        className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-bold transition ${
                          variant.isActive
                            ? "bg-emerald-50 text-emerald-700"
                            : "bg-gray-100 text-gray-500"
                        }`}
                      >
                        <span
                          className={`h-2 w-2 rounded-full ${
                            variant.isActive ? "bg-emerald-500" : "bg-gray-400"
                          }`}
                        />
                        {variant.isActive ? "فعال" : "غیرفعال"}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </SectionCard>

            {/* SEO */}
            <SectionCard
              icon={<Search size={19} />}
              title="بهینه‌سازی برای گوگل"
              description="عنوان و توضیحی بنویس که در نتایج جست‌وجو نمایش داده شود."
              step="04"
            >
              <div className="space-y-5">
                <Field label="عنوان سئو (SEO Title)">
                  <input
                    className={inputClass}
                    value={seoTitle}
                    onChange={(event) => setSeoTitle(event.target.value)}
                    placeholder="خرید مانتو کتان زنانه | Amé Leila"
                    maxLength={70}
                  />
                  <Counter value={seoTitle.length} max={60} />
                </Field>

                <Field label="توضیحات متا (Meta Description)">
                  <textarea
                    className={`${inputClass} min-h-24 resize-y leading-6`}
                    value={seoDescription}
                    onChange={(event) => setSeoDescription(event.target.value)}
                    placeholder="توضیح کوتاه و جذاب درباره محصول، ویژگی‌های آن و مزیت خرید..."
                    maxLength={200}
                    rows={3}
                  />
                  <Counter value={seoDescription.length} max={160} />
                </Field>

                <div className="grid gap-5 md:grid-cols-2">
                  <Field label="کلمه کلیدی اصلی">
                    <input
                      className={inputClass}
                      value={focusKeyword}
                      onChange={(event) => setFocusKeyword(event.target.value)}
                      placeholder="مانتو کتان زنانه"
                    />
                  </Field>

                  <Field label="آدرس Canonical">
                    <input
                      className={inputClass}
                      dir="ltr"
                      value={canonicalUrl}
                      onChange={(event) => setCanonicalUrl(event.target.value)}
                      placeholder="https://example.com/products/..."
                    />
                  </Field>
                </div>

                <div className="overflow-hidden rounded-2xl border border-[#e8e3e5] bg-white">
                  <div className="flex items-center gap-2 border-b border-[#f1ecef] bg-[#faf8f9] px-4 py-3">
                    <Globe size={16} className="text-[#8e818a]" />
                    <span className="text-xs font-bold text-[#6e606a]">
                      پیش‌نمایش نتیجه جست‌وجو
                    </span>
                  </div>
                  <div className="p-5" dir="ltr">
                    <p className="truncate text-sm text-[#188038]">
                      amel eila · Products
                    </p>
                    <p className="mt-2 line-clamp-2 text-lg font-medium text-[#1a0dab]">
                      {seoTitle || name || "عنوان محصول در گوگل"}
                    </p>
                    <p className="mt-1 line-clamp-3 text-sm leading-6 text-[#4d5156]">
                      {seoDescription ||
                        description ||
                        "توضیحات محصول در این بخش از نتایج جست‌وجو نمایش داده می‌شود."}
                    </p>
                    <p className="mt-2 truncate text-xs text-[#188038]">
                      amel eila / products / {slug || "product-slug"}
                    </p>
                  </div>
                </div>

                <div className="flex gap-3 rounded-xl border border-amber-100 bg-amber-50/70 p-4">
                  <CircleHelp
                    size={19}
                    className="mt-0.5 shrink-0 text-amber-600"
                  />
                  <p className="text-xs leading-6 text-amber-800">
                    این فیلدهای سئو زمانی در دیتابیس ذخیره و در صفحات محصول
                    استفاده می‌شوند که مدل و API بک‌اند نیز آن‌ها را پشتیبانی
                    کنند. پر کردن این فیلدها به‌تنهایی تضمین‌کننده رتبه بهتر در
                    گوگل نیست.
                  </p>
                </div>
              </div>
            </SectionCard>
          </div>

          {/* Sidebar */}
          <aside className="space-y-6 xl:sticky xl:top-6">
            <section className="overflow-hidden rounded-2xl border border-[#eee7eb] bg-white shadow-sm">
              <div className="bg-gradient-to-bl from-[#E60A54] to-[#a90740] px-5 py-6 text-white">
                <div className="mb-4 flex items-center justify-between">
                  <span className="rounded-full bg-white/15 px-3 py-1 text-xs">
                    پیش‌نمایش
                  </span>
                  <Eye size={19} />
                </div>
                <h2 className="text-lg font-black">
                  {name || "نام محصول شما"}
                </h2>
                <p className="mt-2 text-sm text-white/75">
                  {category
                    ? (categories.find(
                        (item) => (item._id ?? item.id) === category,
                      )?.name ?? "دسته‌بندی انتخاب‌شده")
                    : "هنوز دسته‌بندی انتخاب نشده"}
                </p>
              </div>

              <div className="p-5">
                <div className="mb-5 flex items-center justify-between">
                  <span className="text-sm text-[#958994]">قیمت از</span>
                  <span className="text-lg font-black text-[#E60A54]">
                    {lowestPrice !== null
                      ? `${lowestPrice.toLocaleString("fa-IR")} تومان`
                      : "—"}
                  </span>
                </div>

                <div className="mb-5 grid grid-cols-2 gap-3">
                  <MiniStat label="تنوع‌ها" value={variants.length} />
                  <MiniStat
                    label="موجودی"
                    value={totalStock.toLocaleString("fa-IR")}
                  />
                </div>

                <div className="flex items-center justify-between border-t border-[#f1ecef] py-3">
                  <span className="text-sm text-[#7f707b]">وضعیت محصول</span>
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-bold ${
                      isActive
                        ? "bg-emerald-50 text-emerald-700"
                        : "bg-gray-100 text-gray-600"
                    }`}
                  >
                    {isActive ? "فعال" : "پیش‌نویس"}
                  </span>
                </div>

                <div className="flex items-center justify-between border-t border-[#f1ecef] py-3">
                  <span className="text-sm text-[#7f707b]">محصول ویژه</span>
                  <span className="text-sm font-bold">
                    {isFeatured ? "بله" : "خیر"}
                  </span>
                </div>
              </div>
            </section>

            <section className="rounded-2xl border border-[#eee7eb] bg-white p-5 shadow-sm">
              <h3 className="mb-4 flex items-center gap-2 font-bold">
                <Layers3 size={18} className="text-[#E60A54]" />
                دسته‌بندی
              </h3>
              <label className={labelClass}>
                دسته‌بندی محصول <Required />
              </label>

              <div className="relative">
                <select
                  className={`${inputClass} appearance-none pl-10`}
                  value={category}
                  onChange={(event) => setCategory(event.target.value ?? "")}
                  required
                >
                  <option value="">انتخاب دسته‌بندی</option>
                  {categories.map((item) => (
                    <option
                      key={item._id ?? item.id ?? item.slug ?? item.name}
                      value={item._id ?? item.id ?? ""}
                    >
                      {item.name}
                    </option>
                  ))}
                </select>
                <ChevronDown
                  size={16}
                  className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#9b8d97]"
                />
              </div>

              {categoriesQuery.isLoading && (
                <p className="mt-2 text-xs text-[#a0939d]">
                  در حال دریافت دسته‌بندی‌ها...
                </p>
              )}

              {categoriesQuery.isError && (
                <p className="mt-2 text-xs text-rose-600">
                  دریافت دسته‌بندی‌ها ناموفق بود.
                </p>
              )}

              <Link
                href="/admin/categories"
                className="mt-4 inline-flex items-center gap-2 text-xs font-bold text-[#E60A54] hover:underline"
              >
                <Plus size={15} />
                مدیریت دسته‌بندی‌ها
              </Link>
            </section>

            <section className="rounded-2xl border border-[#eee7eb] bg-white p-5 shadow-sm">
              <h3 className="mb-4 flex items-center gap-2 font-bold">
                <Sparkles size={18} className="text-[#E60A54]" />
                تنظیمات انتشار
              </h3>

              <ToggleRow
                title="فعال بودن محصول"
                description="نمایش محصول در فروشگاه"
                checked={isActive}
                onChange={setIsActive}
              />

              <div className="my-4 border-t border-[#f1ecef]" />

              <ToggleRow
                title="محصول ویژه"
                description="قابل نمایش در بخش محصولات ویژه"
                checked={isFeatured}
                onChange={setIsFeatured}
              />
            </section>

            <section className="rounded-2xl border border-[#f0dce5] bg-gradient-to-bl from-[#fff4f8] to-white p-5">
              <div className="mb-3 flex items-center gap-2 text-[#E60A54]">
                <Sparkles size={18} />
                <h3 className="font-bold">چک‌لیست محصول</h3>
              </div>

              <div className="space-y-3">
                <ChecklistItem done={!!name.trim()} text="نام محصول" />
                <ChecklistItem done={!!slug.trim()} text="آدرس انگلیسی" />
                <ChecklistItem done={!!category} text="دسته‌بندی" />
                <ChecklistItem done={images.length > 0} text="تصاویر محصول" />
                <ChecklistItem
                  done={variants.every(
                    (variant) =>
                      Number(variant.price) > 0 && variant.stock !== "",
                  )}
                  text="قیمت و موجودی"
                />
                <ChecklistItem
                  done={!!seoTitle.trim() && !!seoDescription.trim()}
                  text="عنوان و توضیح سئو"
                />
              </div>
            </section>
          </aside>

          {/* Sticky bottom actions */}
          <div className="fixed inset-x-0 bottom-0 z-40 border-t border-[#eee7eb] bg-white/95 px-4 py-3 shadow-[0_-8px_30px_rgba(40,20,30,0.06)] backdrop-blur-xl sm:px-6">
            <div className="mx-auto flex max-w-[1500px] flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="hidden items-center gap-2 text-xs text-[#a0939d] sm:flex">
                <span className="h-2 w-2 rounded-full bg-[#E60A54]" />
                قبل از انتشار، اطلاعات و تصاویر محصول را بررسی کن.
              </div>

              <div className="flex items-center gap-3">
                <Link
                  href="/admin/products"
                  className="flex-1 rounded-xl border border-[#e8e3e5] px-4 py-3 text-center text-sm font-bold text-[#796a75] transition hover:bg-[#faf7f9] sm:flex-none"
                >
                  انصراف
                </Link>

                <button
                  type="submit"
                  disabled={saving}
                  className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-[#E60A54] px-5 py-3 text-sm font-bold text-white shadow-lg shadow-[#E60A54]/20 transition hover:-translate-y-0.5 hover:bg-[#c80848] disabled:cursor-not-allowed disabled:opacity-60 sm:flex-none"
                >
                  {saving ? (
                    <LoaderCircle size={18} className="animate-spin" />
                  ) : (
                    <Check size={18} />
                  )}
                  {saving ? "در حال ذخیره..." : "ذخیره محصول"}
                </button>
              </div>
            </div>
          </div>
        </form>

        {(errorMessage || successMessage) && (
          <div
            role="status"
            className={`fixed left-4 top-4 z-50 flex max-w-[calc(100%-2rem)] items-start gap-3 rounded-2xl border p-4 shadow-xl sm:left-6 sm:max-w-md ${
              errorMessage
                ? "border-rose-200 bg-white text-rose-700"
                : "border-emerald-200 bg-white text-emerald-700"
            }`}
          >
            {errorMessage ? (
              <CircleHelp size={20} className="mt-0.5 shrink-0" />
            ) : (
              <Check size={20} className="mt-0.5 shrink-0" />
            )}
            <p className="flex-1 text-sm leading-6">
              {errorMessage || successMessage}
            </p>
            <button
              type="button"
              onClick={() => {
                setErrorMessage("");
                setSuccessMessage("");
              }}
              aria-label="بستن پیام"
            >
              <X size={17} />
            </button>
          </div>
        )}
      </div>
    </main>
  );
}

function Required() {
  return <span className="mr-1 text-[#E60A54]">*</span>;
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="min-w-0">
      <label className={labelClass}>{label}</label>
      {children}
    </div>
  );
}

function SectionCard({
  icon,
  title,
  description,
  step,
  badge,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  step: string;
  badge?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="overflow-hidden rounded-2xl border border-[#eee7eb] bg-white shadow-[0_3px_16px_rgba(40,20,30,0.025)]">
      <div className="flex items-start gap-3 border-b border-[#f1ecef] px-5 py-5 sm:px-7">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#E60A54]/10 text-[#E60A54]">
          {icon}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="font-black">{title}</h2>
            {badge && (
              <span className="rounded-md bg-[#fff0f5] px-2 py-1 text-[10px] font-bold text-[#E60A54]">
                {badge}
              </span>
            )}
          </div>
          <p className="mt-1 text-xs leading-6 text-[#9b8d97]">{description}</p>
        </div>
        <span className="hidden text-sm font-black text-[#e5dce1] sm:block">
          {step}
        </span>
      </div>
      <div className="p-5 sm:p-7">{children}</div>
    </section>
  );
}

function SummaryCard({
  icon,
  label,
  value,
  detail,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  detail: string;
}) {
  return (
    <div className="flex items-center gap-4 rounded-2xl border border-[#eee7eb] bg-white p-5 shadow-sm">
      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#E60A54]/10 text-[#E60A54]">
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-xs text-[#9b8d97]">{label}</p>
        <p className="mt-1 text-xl font-black">{value}</p>
        <p className="mt-1 text-[11px] text-[#b0a3ac]">{detail}</p>
      </div>
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-xl bg-[#faf7f9] p-3">
      <p className="text-xs text-[#9b8d97]">{label}</p>
      <p className="mt-1 font-black">{value}</p>
    </div>
  );
}

function Counter({ value, max }: { value: number; max: number }) {
  return (
    <p
      className={`mt-2 text-left text-xs ${
        value > max ? "text-rose-600" : "text-[#a69aa3]"
      }`}
      dir="ltr"
    >
      {value} / {max}
    </p>
  );
}

function ToggleRow({
  title,
  description,
  checked,
  onChange,
}: {
  title: string;
  description: string;
  checked: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <div>
        <p className="text-sm font-bold">{title}</p>
        <p className="mt-1 text-xs leading-5 text-[#9b8d97]">{description}</p>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative h-6 w-11 shrink-0 rounded-full transition ${
          checked ? "bg-[#E60A54]" : "bg-[#ddd5da]"
        }`}
      >
        <span
          className={`absolute top-1 h-4 w-4 rounded-full bg-white shadow transition-all ${
            checked ? "right-1" : "right-6"
          }`}
        />
      </button>
    </div>
  );
}

function ChecklistItem({ done, text }: { done: boolean; text: string }) {
  return (
    <div className="flex items-center gap-2.5">
      <span
        className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full ${
          done
            ? "bg-emerald-100 text-emerald-700"
            : "border border-[#e4d9df] text-transparent"
        }`}
      >
        <Check size={12} />
      </span>
      <span className={`text-xs ${done ? "text-[#6f626c]" : "text-[#aa9ca6]"}`}>
        {text}
      </span>
    </div>
  );
}
