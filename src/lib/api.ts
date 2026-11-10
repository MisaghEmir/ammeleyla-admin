
import axios from "axios";

// آدرس بک‌اند
const API_URL =
  // process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000/api";
   process.env.NEXT_PUBLIC_API_URL || "https://ammeleyla-server.onrender.com/api";

export const api = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 15000,
});

// افزودن توکن احراز هویت در مرورگر
api.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("accessToken");

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }

  return config;
});

// مدیریت خطاهای API

api.interceptors.response.use(
  (response) => response,
  (error: unknown) => {
    if (axios.isAxiosError(error)) {
      const message =
        error.response?.data?.message ??
        error.response?.data?.error ??
        error.message ??
        "خطا در ارتباط با سرور";

      return Promise.reject(
        Object.assign(new Error(message), {
          status: error.response?.status,
        }),
      );
    }

    return Promise.reject(error);
  },
);


// ==============================
// انواع داده‌ها
// ==============================

export interface ApiResponse<T> {
  success?: boolean;
  message?: string;
  data: T;
}

export interface ProductImage {
  url: string;
  alt?: string;
}

export interface ProductVariant {
  _id?: string;
  color?: string;
  size?: string;
  sku?: string;
  price: number;
  compareAtPrice?: number;
  stock: number;
  isActive?: boolean;
}

export interface Product {
  _id: string;
  name: string;
  slug: string;
  description?: string;
  category:
    | string
    | {
        _id: string;
        name: string;
        slug: string;
      };
  images: ProductImage[];
  variants: ProductVariant[];
  tags?: string[];
  isActive: boolean;
  isFeatured?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface ProductInput {
  name: string;
  slug: string;
  description?: string;
  category: string;
  images?: ProductImage[];
  variants: ProductVariant[];
  tags?: string[];
  isActive?: boolean;
  isFeatured?: boolean;
}

export interface Category {
  _id: string;
  name: string;
  slug: string;
  description?: string;
  image?: string;
  parent?: string | null | {
  _id: string;
  name: string;
  slug?: string;
};
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface CategoryInput {
  name: string;
  slug: string;
  description?: string;
  image?: string;
  parent?: string | null;
  isActive?: boolean;
}

export interface User {
  _id: string;
  name: string;
  phone: string;
  email?: string;
  role: "USER" | "ADMIN";
  isActive?: boolean;
}

// ==============================
// استخراج داده از پاسخ API
// ==============================

function unwrap<T>(response: { data: unknown }): T {
  const body = response.data as ApiResponse<T> | T;

  if (
    body !== null &&
    typeof body === "object" &&
    "data" in body
  ) {
    return (body as ApiResponse<T>).data;
  }

  return body as T;
}

// ==============================
// احراز هویت
// ==============================

export const authApi = {
  me: async (): Promise<User> => {
    const response = await api.get("/auth/me");
    return unwrap<User>(response);
  },
};

// ==============================
// محصولات
// ==============================

export const productsApi = {
  getAll: async (): Promise<Product[]> => {
    const response = await api.get("/products");

    // بررسی ساختار واقعی پاسخ در مرورگر
    console.log("PRODUCTS API RESPONSE:", response.data);

    const result = unwrap<unknown>(response);

    // پشتیبانی از آرایه مستقیم و چند ساختار متداول
    if (Array.isArray(result)) {
      return result as Product[];
    }

    if (result && typeof result === "object") {
      const data = result as {
        products?: unknown;
        data?: unknown;
      };

      if (Array.isArray(data.products)) {
        return data.products as Product[];
      }

      if (Array.isArray(data.data)) {
        return data.data as Product[];
      }
    }

    console.error(
      "ساختار پاسخ محصولات آرایه نیست:",
      result
    );

    throw new Error(
      "ساختار پاسخ API محصولات معتبر نیست. کنسول مرورگر را بررسی کن."
    );
  },

  getById: async (id: string): Promise<Product> => {
    const response = await api.get(`/products/${id}`);
    return unwrap<Product>(response);
  },

  getBySlug: async (slug: string): Promise<Product> => {
    const response = await api.get(`/products/slug/${slug}`);
    return unwrap<Product>(response);
  },

  getFeatured: async (): Promise<Product[]> => {
    const response = await api.get("/products/featured");
    return unwrap<Product[]>(response);
  },

  getByCategory: async (
    categoryId: string
  ): Promise<Product[]> => {
    const response = await api.get(
      `/products/category/${categoryId}`
    );

    return unwrap<Product[]>(response);
  },

  create: async (input: ProductInput): Promise<Product> => {
    const response = await api.post("/products", input);
    return unwrap<Product>(response);
  },

  update: async (
    id: string,
    input: Partial<ProductInput>
  ): Promise<Product> => {
    const response = await api.patch(
      `/products/${id}`,
      input
    );

    return unwrap<Product>(response);
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/products/${id}`);
  },
};

// ==============================
// دسته‌بندی‌ها
// ==============================


export const categoriesApi = {
  getAll: async (): Promise<Category[]> => {
    const response = await api.get("/categories");
    const categories = response.data?.categories;

    if (!Array.isArray(categories)) {
      throw new Error("دریافت فهرست دسته‌بندی‌ها ناموفق بود.");
    }

    return categories as Category[];
  },

  getById: async (id: string): Promise<Category> => {
    const response = await api.get(`/categories/${id}`);
    return response.data.category as Category;
  },

  getBySlug: async (slug: string): Promise<Category> => {
    const response = await api.get(`/categories/slug/${slug}`);
    return response.data.category as Category;
  },

  getChildren: async (parentId: string): Promise<Category[]> => {
    const response = await api.get(`/categories/${parentId}/children`);
    const result = response.data?.categories ?? response.data?.data;
    return Array.isArray(result) ? result as Category[] : [];
  },

  create: async (input: CategoryInput): Promise<Category> => {
    const response = await api.post("/categories", input);
    return response.data.category as Category;
  },

  update: async (
    id: string,
    input: Partial<CategoryInput>,
  ): Promise<Category> => {
    const response = await api.patch(`/categories/${id}`, input);
    return response.data.category as Category;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/categories/${id}`);
  },
};

