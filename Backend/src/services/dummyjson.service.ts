export interface DummyProduct {
  id: number;
  title: string;
  description: string;
  category: string;
  price: number;
  discountPercentage: number;
  rating: number;
  stock: number;
  tags: string[];
  brand?: string;
  sku?: string;
  thumbnail: string;
  images: string[];
}

export interface DummyJsonResponse {
  products: DummyProduct[];
  total: number;
  skip: number;
  limit: number;
}

export interface FetchProductsOptions {
  search?: string;
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  sortBy?: string;
  order?: "asc" | "desc";
  page?: number;
  limit?: number;
}

export interface PaginatedResult<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
  filtersApplied: {
    search?: string;
    category?: string;
    minPrice?: number;
    maxPrice?: number;
    sortBy?: string;
    order?: string;
  };
}

const DUMMY_JSON_BASE = "https://dummyjson.com";

// Resilient fetch with timeout and 1 retry
async function fetchWithRetry(url: string, retries = 2, timeoutMs = 15000): Promise<Response> {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), timeoutMs);

      const res = await fetch(url, { signal: controller.signal });
      clearTimeout(timer);
      return res;
    } catch (err) {
      if (attempt === retries) throw err;
      await new Promise((r) => setTimeout(r, 1000));
    }
  }
  throw new Error("Fetch failed after retries");
}

export async function fetchThirdPartyProducts(
  options: FetchProductsOptions = {}
): Promise<PaginatedResult<DummyProduct>> {
  const page = Math.max(1, options.page || 1);
  const limit = Math.min(100, Math.max(1, options.limit || 10));
  const skip = (page - 1) * limit;

  let url = `${DUMMY_JSON_BASE}/products`;

  // Search takes precedence if provided
  if (options.search && options.search.trim().length > 0) {
    url = `${DUMMY_JSON_BASE}/products/search?q=${encodeURIComponent(
      options.search.trim()
    )}&limit=${limit}&skip=${skip}`;
  } else if (options.category && options.category.trim().length > 0) {
    url = `${DUMMY_JSON_BASE}/products/category/${encodeURIComponent(
      options.category.trim()
    )}?limit=${limit}&skip=${skip}`;
  } else {
    url = `${DUMMY_JSON_BASE}/products?limit=${limit}&skip=${skip}`;
  }

  // Add sorting parameters if specified
  if (options.sortBy) {
    const delimiter = url.includes("?") ? "&" : "?";
    url += `${delimiter}sortBy=${encodeURIComponent(options.sortBy)}&order=${
      options.order === "desc" ? "desc" : "asc"
    }`;
  }

  const response = await fetchWithRetry(url);

  if (!response.ok) {
    throw new Error(`Third party API error: ${response.status} ${response.statusText}`);
  }

  const json = (await response.json()) as DummyJsonResponse;

  let products = json.products;
  let total = json.total;

  // Optional in-memory price filter if requested
  if (options.minPrice !== undefined || options.maxPrice !== undefined) {
    const min = options.minPrice ?? 0;
    const max = options.maxPrice ?? Number.MAX_SAFE_INTEGER;
    products = products.filter((p) => p.price >= min && p.price <= max);
  }

  const totalPages = Math.ceil(total / limit);

  return {
    data: products,
    pagination: {
      page,
      limit,
      total,
      totalPages,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1,
    },
    filtersApplied: {
      search: options.search,
      category: options.category,
      minPrice: options.minPrice,
      maxPrice: options.maxPrice,
      sortBy: options.sortBy,
      order: options.order || "asc",
    },
  };
}

export async function fetchCategories(): Promise<any[]> {
  const response = await fetchWithRetry(`${DUMMY_JSON_BASE}/products/categories`);
  if (!response.ok) {
    throw new Error(`Failed to fetch categories: ${response.statusText}`);
  }
  return (await response.json()) as any[];
}

export async function fetchProductById(id: number): Promise<DummyProduct> {
  const response = await fetchWithRetry(`${DUMMY_JSON_BASE}/products/${id}`);
  if (!response.ok) {
    if (response.status === 404) {
      throw new Error(`Product with ID ${id} not found`);
    }
    throw new Error(`Failed to fetch product: ${response.statusText}`);
  }
  return (await response.json()) as DummyProduct;
}
