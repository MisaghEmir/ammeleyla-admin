
"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  Search,
  Plus,
  Package,
  Pencil,
  Trash2,
  RefreshCw,
  ImageIcon,
  AlertCircle,
} from "lucide-react";

import {
  useProducts,
  useDeleteProduct,
} from "@/lib/queries";

import type { Product } from "@/lib/api";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";

type StatusFilter = "all" | "active" | "inactive";

type ProductsResponse =
  | Product[]
  | {
      products?: Product[];
      data?: Product[];
    };

function formatPrice(price: number) {
  return new Intl.NumberFormat("fa-IR").format(price) + " تومان";
}

function getProductPrice(product: Product): number {
  if (!product.variants?.length) return 0;

  return Math.min(
    ...product.variants.map((variant) => variant.price)
  );
}

function getProductStock(product: Product): number {
  return (
    product.variants?.reduce(
      (total, variant) => total + (variant.stock || 0),
      0
    ) ?? 0
  );
}

function getCategoryName(product: Product): string {
  if (typeof product.category === "object" && product.category) {
    return product.category.name;
  }

  return "—";
}

export default function AdminProductsPage() {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<StatusFilter>("all");

  const {
    data: products,
    isLoading,
    isError,
    error,
    refetch,
    isFetching,
  } = useProducts();

  const deleteProduct = useDeleteProduct();

const filteredProducts = useMemo(() => {
  const response = products as ProductsResponse | undefined;

  let productList: Product[] = [];

  if (Array.isArray(response)) {
    productList = response;
  } else if (response && Array.isArray(response.products)) {
    productList = response.products;
  } else if (response && Array.isArray(response.data)) {
    productList = response.data;
  }

  return productList.filter((product: Product) => {
    const searchTerm = search.trim().toLowerCase();

    const matchesSearch =
      !searchTerm ||
      (product.name ?? "").toLowerCase().includes(searchTerm) ||
      (product.slug ?? "").toLowerCase().includes(searchTerm) ||
      getCategoryName(product).toLowerCase().includes(searchTerm);

    const matchesStatus =
      status === "all" ||
      (status === "active" && product.isActive) ||
      (status === "inactive" && !product.isActive);

    return matchesSearch && matchesStatus;
  });
}, [products, search, status]);

  const activeCount = (products ?? []).filter(
    (product) => product.isActive
  ).length;

  const inactiveCount = (products ?? []).length - activeCount;

  async function handleDelete(product: Product) {
    const confirmed = window.confirm(
      `آیا از حذف محصول «${product.name}» مطمئن هستی؟`
    );

    if (!confirmed) return;

    try {
      await deleteProduct.mutateAsync(product._id);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "حذف محصول با خطا مواجه شد.";

      window.alert(message);
    }
  }

  return (
    <div dir="rtl" className="mx-auto max-w-7xl space-y-6">
      {/* Page heading */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            مدیریت محصولات
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            محصولات فروشگاه را مشاهده و مدیریت کن.
          </p>
        </div>

        <Button  className="bg-[#E60A54] hover:bg-[#c90849]">
          <Link href="/admin/products/new">
            <Plus className="ml-2 h-4 w-4" />
            افزودن محصول
          </Link>
        </Button>
      </div>

      {/* Statistics */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border bg-card p-5">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              کل محصولات
            </p>
            <Package className="h-5 w-5 text-muted-foreground" />
          </div>

          <div className="mt-3 text-2xl font-bold">
            {isLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              (products?.length ?? 0).toLocaleString("fa-IR")
            )}
          </div>
        </div>

        <div className="rounded-xl border bg-card p-5">
          <p className="text-sm text-muted-foreground">
            محصولات فعال
          </p>

          <div className="mt-3 text-2xl font-bold text-emerald-600">
            {isLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              activeCount.toLocaleString("fa-IR")
            )}
          </div>
        </div>

        <div className="rounded-xl border bg-card p-5">
          <p className="text-sm text-muted-foreground">
            محصولات غیرفعال
          </p>

          <div className="mt-3 text-2xl font-bold text-muted-foreground">
            {isLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              inactiveCount.toLocaleString("fa-IR")
            )}
          </div>
        </div>
      </div>

      {/* Search and filters */}
      <div className="rounded-xl border bg-card p-4">
        <div className="flex flex-col gap-3 md:flex-row">
          <div className="relative flex-1">
            <Search className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />

            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="جست‌وجوی نام، شناسه یا دسته‌بندی..."
              className="pr-10"
            />
          </div>

          <Select
            value={status}
            onValueChange={(value) =>
              setStatus(value as StatusFilter)
            }
          >
            <SelectTrigger className="w-full md:w-48">
              <SelectValue placeholder="وضعیت محصول" />
            </SelectTrigger>

            <SelectContent>
              <SelectItem value="all">همه محصولات</SelectItem>
              <SelectItem value="active">فعال</SelectItem>
              <SelectItem value="inactive">غیرفعال</SelectItem>
            </SelectContent>
          </Select>

          <Button
            variant="outline"
            onClick={() => refetch()}
            disabled={isFetching}
          >
            <RefreshCw
              className={`ml-2 h-4 w-4 ${
                isFetching ? "animate-spin" : ""
              }`}
            />
            بروزرسانی
          </Button>
        </div>
      </div>

      {/* Error state */}
      {isError && (
        <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-5">
          <div className="flex items-start gap-3">
            <AlertCircle className="mt-0.5 h-5 w-5 text-destructive" />

            <div className="flex-1">
              <p className="font-semibold">
                دریافت محصولات ناموفق بود
              </p>

              <p className="mt-1 text-sm text-muted-foreground">
                {error instanceof Error
                  ? error.message
                  : "اتصال به سرور را بررسی کن."}
              </p>

              <Button
                variant="outline"
                size="sm"
                className="mt-3"
                onClick={() => refetch()}
              >
                تلاش مجدد
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Products table */}
      <div className="overflow-hidden rounded-xl border bg-card">
        <div className="flex items-center justify-between border-b p-4">
          <div>
            <h2 className="font-semibold">فهرست محصولات</h2>
            <p className="mt-1 text-xs text-muted-foreground">
              {filteredProducts.length.toLocaleString("fa-IR")} محصول
            </p>
          </div>
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-right">محصول</TableHead>
              <TableHead className="text-right">دسته‌بندی</TableHead>
              <TableHead className="text-right">قیمت شروع</TableHead>
              <TableHead className="text-right">موجودی</TableHead>
              <TableHead className="text-right">وضعیت</TableHead>
              <TableHead className="text-left">عملیات</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {isLoading &&
              Array.from({ length: 5 }).map((_, index) => (
                <TableRow key={index}>
                  <TableCell colSpan={6}>
                    <Skeleton className="h-12 w-full" />
                  </TableCell>
                </TableRow>
              ))}

            {!isLoading &&
              !isError &&
              filteredProducts.map((product) => {
                const price = getProductPrice(product);
                const stock = getProductStock(product);

                return (
                  <TableRow key={product._id}>
                    <TableCell>
                      <div className="flex min-w-48 items-center gap-3">
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-lg border bg-muted">
                          {product.images?.[0]?.url ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={product.images[0].url}
                              alt={
                                product.images[0].alt || product.name
                              }
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <ImageIcon className="h-5 w-5 text-muted-foreground" />
                          )}
                        </div>

                        <div className="min-w-0">
                          <p className="max-w-56 truncate font-medium">
                            {product.name}
                          </p>
                          <p className="mt-1 max-w-56 truncate text-xs text-muted-foreground">
                            {product.slug}
                          </p>
                        </div>
                      </div>
                    </TableCell>

                    <TableCell>
                      {getCategoryName(product)}
                    </TableCell>

                    <TableCell className="whitespace-nowrap font-medium">
                      {formatPrice(price)}
                    </TableCell>

                    <TableCell>
                      <span
                        className={
                          stock === 0
                            ? "font-medium text-destructive"
                            : stock < 5
                              ? "font-medium text-amber-600"
                              : ""
                        }
                      >
                        {stock.toLocaleString("fa-IR")}
                      </span>
                    </TableCell>

                    <TableCell>
                      <Badge
                        variant={
                          product.isActive ? "default" : "secondary"
                        }
                        className={
                          product.isActive
                            ? "border-0 bg-emerald-100 text-emerald-700 hover:bg-emerald-100"
                            : ""
                        }
                      >
                        {product.isActive ? "فعال" : "غیرفعال"}
                      </Badge>
                    </TableCell>

                    <TableCell>
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="outline"
                          size="icon"
                          title="ویرایش محصول"
                          aria-label={`ویرایش ${product.name}`}
                          
                        >
                          <Link
                            href={`/admin/products/${product._id}/edit`}
                          >
                            <Pencil className="h-4 w-4" />
                          </Link>
                        </Button>

                        <Button
                          variant="outline"
                          size="icon"
                          title="حذف محصول"
                          aria-label={`حذف ${product.name}`}
                          disabled={deleteProduct.isPending}
                          onClick={() => handleDelete(product)}
                          className="text-destructive hover:bg-destructive hover:text-destructive-foreground"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}

            {!isLoading &&
              !isError &&
              filteredProducts.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="h-40 text-center">
                    <Package className="mx-auto mb-3 h-8 w-8 text-muted-foreground/50" />

                    <p className="font-medium">
                      محصولی پیدا نشد
                    </p>

                    <p className="mt-1 text-sm text-muted-foreground">
                      عبارت جست‌وجو یا فیلتر وضعیت را تغییر بده.
                    </p>
                  </TableCell>
                </TableRow>
              )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
