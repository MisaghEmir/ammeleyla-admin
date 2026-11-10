
"use client";

import {
  useQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";

import {
  authApi,
  productsApi,
  categoriesApi,
  type ProductInput,
  type CategoryInput,
} from "@/lib/api";

// کلیدهای کش
export const queryKeys = {
  auth: {
    me: ["auth", "me"] as const,
  },

  products: {
    all: ["products"] as const,
    detail: (id: string) => ["products", "detail", id] as const,
    slug: (slug: string) => ["products", "slug", slug] as const,
    featured: ["products", "featured"] as const,
    category: (categoryId: string) =>
      ["products", "category", categoryId] as const,
  },

  categories: {
    all: ["categories"] as const,
    detail: (id: string) => ["categories", "detail", id] as const,
    slug: (slug: string) => ["categories", "slug", slug] as const,
    children: (parentId: string) =>
      ["categories", "children", parentId] as const,
  },
};

// ========================
// AUTH QUERIES
// ========================

export function useCurrentUser() {
  return useQuery({
    queryKey: queryKeys.auth.me,
    queryFn: authApi.me,
    retry: false,
    staleTime: 60_000,
  });
}

// ========================
// PRODUCT QUERIES
// ========================

export function useProducts() {
  return useQuery({
    queryKey: queryKeys.products.all,
    queryFn: productsApi.getAll,
  });
}

export function useProduct(id: string) {
  return useQuery({
    queryKey: queryKeys.products.detail(id),
    queryFn: () => productsApi.getById(id),
    enabled: Boolean(id),
  });
}

export function useProductBySlug(slug: string) {
  return useQuery({
    queryKey: queryKeys.products.slug(slug),
    queryFn: () => productsApi.getBySlug(slug),
    enabled: Boolean(slug),
  });
}

export function useFeaturedProducts() {
  return useQuery({
    queryKey: queryKeys.products.featured,
    queryFn: productsApi.getFeatured,
  });
}

export function useProductsByCategory(categoryId: string) {
  return useQuery({
    queryKey: queryKeys.products.category(categoryId),
    queryFn: () => productsApi.getByCategory(categoryId),
    enabled: Boolean(categoryId),
  });
}

// ========================
// PRODUCT MUTATIONS
// ========================

export function useCreateProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: ProductInput) =>
      productsApi.create(input),

    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: queryKeys.products.all,
      });

      await queryClient.invalidateQueries({
        queryKey: queryKeys.products.featured,
      });

      await queryClient.invalidateQueries({
        queryKey: ["products", "category"],
      });
    },
  });
}

export function useUpdateProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      input,
    }: {
      id: string;
      input: Partial<ProductInput>;
    }) => productsApi.update(id, input),

    onSuccess: async (product) => {
      await queryClient.invalidateQueries({
        queryKey: queryKeys.products.all,
      });

      await queryClient.invalidateQueries({
        queryKey: queryKeys.products.detail(product._id),
      });

      await queryClient.invalidateQueries({
        queryKey: queryKeys.products.featured,
      });

      await queryClient.invalidateQueries({
        queryKey: ["products", "category"],
      });
    },
  });
}

export function useDeleteProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => productsApi.delete(id),

    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: queryKeys.products.all,
      });

      await queryClient.invalidateQueries({
        queryKey: queryKeys.products.featured,
      });

      await queryClient.invalidateQueries({
        queryKey: ["products", "category"],
      });
    },
  });
}

// ========================
// CATEGORY QUERIES
// ========================

export function useCategories() {
  return useQuery({
    queryKey: queryKeys.categories.all,
    queryFn: categoriesApi.getAll,
  });
}

export function useCategory(id: string) {
  return useQuery({
    queryKey: queryKeys.categories.detail(id),
    queryFn: () => categoriesApi.getById(id),
    enabled: Boolean(id),
  });
}

export function useCategoryBySlug(slug: string) {
  return useQuery({
    queryKey: queryKeys.categories.slug(slug),
    queryFn: () => categoriesApi.getBySlug(slug),
    enabled: Boolean(slug),
  });
}

export function useCategoryChildren(parentId: string) {
  return useQuery({
    queryKey: queryKeys.categories.children(parentId),
    queryFn: () => categoriesApi.getChildren(parentId),
    enabled: Boolean(parentId),
  });
}

// ========================
// CATEGORY MUTATIONS
// ========================

export function useCreateCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CategoryInput) =>
      categoriesApi.create(input),

    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: queryKeys.categories.all,
      });
    },
  });
}

export function useUpdateCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      input,
    }: {
      id: string;
      input: Partial<CategoryInput>;
    }) => categoriesApi.update(id, input),

    onSuccess: async (category) => {
      await queryClient.invalidateQueries({
        queryKey: queryKeys.categories.all,
      });

      await queryClient.invalidateQueries({
        queryKey: queryKeys.categories.detail(category._id),
      });
    },
  });
}

export function useDeleteCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => categoriesApi.delete(id),

    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: queryKeys.categories.all,
      });
    },
  });
}
