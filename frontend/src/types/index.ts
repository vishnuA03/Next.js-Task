export interface User {
  id: number;
  email: string;
  name: string | null;
  lastLoginAt?: string | null;
  createdAt?: string;
  _count?: {
    tasks: number;
    loginLogs: number;
    savedItems: number;
  };
}

export interface AuthResponse {
  message: string;
  user: User;
  token: string;
}

export interface LoginLog {
  id: number;
  userId: number;
  ipAddress: string | null;
  userAgent: string | null;
  status: "SUCCESS" | "FAILED";
  createdAt: string;
}

export interface Product {
  id: number;
  title: string;
  description: string;
  category: string;
  price: number;
  discountPercentage: number;
  rating: number;
  stock: number;
  tags?: string[];
  brand?: string;
  thumbnail: string;
  images?: string[];
}

export interface SavedItem {
  id: number;
  externalId: number;
  title: string;
  description: string | null;
  category: string | null;
  price: number | null;
  thumbnail: string | null;
  source: string;
  userId: number;
  createdAt: string;
}

export interface Task {
  id: number;
  title: string;
  description: string | null;
  completed: boolean;
  category: string | null;
  priority: "LOW" | "MEDIUM" | "HIGH";
  userId: number;
  createdAt: string;
  updatedAt: string;
}

export interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: PaginationInfo;
  filtersApplied?: Record<string, any>;
}
