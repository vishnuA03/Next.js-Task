import {
  AuthResponse,
  PaginatedResponse,
  Product,
  SavedItem,
  Task,
  User,
  LoginLog,
} from "../types";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

function getAuthHeader(): Record<string, string> {
  if (typeof window === "undefined") return {};
  const token = localStorage.getItem("next_task_token");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function handleResponse<T>(response: Response): Promise<T> {
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const errorMessage =
      data.error || data.message || `Request failed with status ${response.status}`;
    throw new Error(errorMessage);
  }
  return data;
}

export const api = {
  // Authentication
  async register(data: {
    email: string;
    password: string;
    name?: string;
  }): Promise<AuthResponse> {
    const res = await fetch(`${API_BASE_URL}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    return handleResponse<AuthResponse>(res);
  },

  async login(data: { email: string; password: string }): Promise<AuthResponse> {
    const res = await fetch(`${API_BASE_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    return handleResponse<AuthResponse>(res);
  },

  async getMe(): Promise<{ user: User }> {
    const res = await fetch(`${API_BASE_URL}/auth/me`, {
      headers: { ...getAuthHeader() },
    });
    return handleResponse<{ user: User }>(res);
  },

  async getLoginLogs(
    page = 1,
    limit = 10
  ): Promise<{ data: LoginLog[]; pagination: any }> {
    const res = await fetch(
      `${API_BASE_URL}/auth/logs?page=${page}&limit=${limit}`,
      {
        headers: { ...getAuthHeader() },
      }
    );
    return handleResponse<{ data: LoginLog[]; pagination: any }>(res);
  },

  // Third-Party External Products API (Search, Filter, Pagination)
  async getProducts(params: {
    search?: string;
    category?: string;
    minPrice?: number;
    maxPrice?: number;
    sortBy?: string;
    order?: "asc" | "desc";
    page?: number;
    limit?: number;
  }): Promise<PaginatedResponse<Product>> {
    const query = new URLSearchParams();
    if (params.search) query.set("search", params.search);
    if (params.category) query.set("category", params.category);
    if (params.minPrice !== undefined && params.minPrice > 0)
      query.set("minPrice", params.minPrice.toString());
    if (params.maxPrice !== undefined && params.maxPrice > 0)
      query.set("maxPrice", params.maxPrice.toString());
    if (params.sortBy) query.set("sortBy", params.sortBy);
    if (params.order) query.set("order", params.order);
    if (params.page) query.set("page", params.page.toString());
    if (params.limit) query.set("limit", params.limit.toString());

    const res = await fetch(`${API_BASE_URL}/external/products?${query.toString()}`);
    return handleResponse<PaginatedResponse<Product>>(res);
  },

  async getCategories(): Promise<{ success: boolean; data: any[] }> {
    const res = await fetch(`${API_BASE_URL}/external/categories`);
    return handleResponse<{ success: boolean; data: any[] }>(res);
  },

  async getProductById(id: number): Promise<{ success: boolean; data: Product }> {
    const res = await fetch(`${API_BASE_URL}/external/products/${id}`);
    return handleResponse<{ success: boolean; data: Product }>(res);
  },

  // Saved Items (in Database)
  async saveProduct(product: Product): Promise<{ message: string; data: SavedItem }> {
    const res = await fetch(`${API_BASE_URL}/external/saved`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...getAuthHeader(),
      },
      body: JSON.stringify({
        externalId: product.id,
        title: product.title,
        description: product.description,
        category: product.category,
        price: product.price,
        thumbnail: product.thumbnail,
      }),
    });
    return handleResponse<{ message: string; data: SavedItem }>(res);
  },

  async getSavedItems(params: {
    search?: string;
    category?: string;
    page?: number;
    limit?: number;
  }): Promise<PaginatedResponse<SavedItem>> {
    const query = new URLSearchParams();
    if (params.search) query.set("search", params.search);
    if (params.category) query.set("category", params.category);
    if (params.page) query.set("page", params.page.toString());
    if (params.limit) query.set("limit", params.limit.toString());

    const res = await fetch(
      `${API_BASE_URL}/external/saved?${query.toString()}`,
      {
        headers: { ...getAuthHeader() },
      }
    );
    return handleResponse<PaginatedResponse<SavedItem>>(res);
  },

  async deleteSavedItem(id: number): Promise<{ message: string }> {
    const res = await fetch(`${API_BASE_URL}/external/saved/${id}`, {
      method: "DELETE",
      headers: { ...getAuthHeader() },
    });
    return handleResponse<{ message: string }>(res);
  },

  // Database Tasks API
  async getTasks(params: {
    search?: string;
    category?: string;
    completed?: boolean;
    priority?: string;
    page?: number;
    limit?: number;
    sortBy?: string;
    order?: "asc" | "desc";
  }): Promise<PaginatedResponse<Task>> {
    const query = new URLSearchParams();
    if (params.search) query.set("search", params.search);
    if (params.category) query.set("category", params.category);
    if (params.completed !== undefined)
      query.set("completed", params.completed.toString());
    if (params.priority) query.set("priority", params.priority);
    if (params.page) query.set("page", params.page.toString());
    if (params.limit) query.set("limit", params.limit.toString());
    if (params.sortBy) query.set("sortBy", params.sortBy);
    if (params.order) query.set("order", params.order);

    const res = await fetch(`${API_BASE_URL}/tasks?${query.toString()}`, {
      headers: { ...getAuthHeader() },
    });
    return handleResponse<PaginatedResponse<Task>>(res);
  },

  async createTask(task: {
    title: string;
    description?: string;
    category?: string;
    priority?: string;
  }): Promise<{ success: boolean; data: Task }> {
    const res = await fetch(`${API_BASE_URL}/tasks`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...getAuthHeader(),
      },
      body: JSON.stringify(task),
    });
    return handleResponse<{ success: boolean; data: Task }>(res);
  },

  async updateTask(
    id: number,
    updates: Partial<Task>
  ): Promise<{ success: boolean; data: Task }> {
    const res = await fetch(`${API_BASE_URL}/tasks/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        ...getAuthHeader(),
      },
      body: JSON.stringify(updates),
    });
    return handleResponse<{ success: boolean; data: Task }>(res);
  },

  async deleteTask(id: number): Promise<{ success: boolean; message: string }> {
    const res = await fetch(`${API_BASE_URL}/tasks/${id}`, {
      method: "DELETE",
      headers: { ...getAuthHeader() },
    });
    return handleResponse<{ success: boolean; message: string }>(res);
  },
};
