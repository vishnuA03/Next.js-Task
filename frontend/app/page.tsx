"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useAuth } from "../src/context/AuthContext";
import { api } from "../src/lib/api";
import { Product, SavedItem, PaginationInfo } from "../src/types";
import { Pagination } from "../src/components/Pagination";

export default function Home() {
  const { user, login, register, logout, isLoading: authLoading } = useAuth();

  // Tab: 'products' | 'saved'
  const [tab, setTab] = useState<"products" | "saved">("products");

  // Auth form state
  const [showAuth, setShowAuth] = useState(false);
  const [isLoginMode, setIsLoginMode] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [authError, setAuthError] = useState<string | null>(null);
  const [authSubmitting, setAuthSubmitting] = useState(false);

  // Products (Third-Party API) state
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [productsLoading, setProductsLoading] = useState(true);
  const [productsError, setProductsError] = useState<string | null>(null);

  // Product Filters & Search
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [sortBy, setSortBy] = useState("");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [productPagination, setProductPagination] = useState<PaginationInfo>({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
    hasNextPage: false,
    hasPrevPage: false,
  });

  // Saved Items (in MySQL) state
  const [savedItems, setSavedItems] = useState<SavedItem[]>([]);
  const [savedLoading, setSavedLoading] = useState(false);
  const [savedPage, setSavedPage] = useState(1);
  const [savedLimit, setSavedLimit] = useState(10);
  const [savedPagination, setSavedPagination] = useState<PaginationInfo>({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
    hasNextPage: false,
    hasPrevPage: false,
  });

  // Notification message
  const [message, setMessage] = useState<{ text: string; isError?: boolean } | null>(null);

  const showMessage = (text: string, isError = false) => {
    setMessage({ text, isError });
    setTimeout(() => setMessage(null), 3000);
  };

  // Load Categories on start
  useEffect(() => {
    async function loadCategories() {
      try {
        const res = await api.getCategories();
        if (res.data) {
          const list = res.data.map((cat: any) =>
            typeof cat === "string" ? cat : cat.slug || cat.name || String(cat)
          );
          setCategories(list);
        }
      } catch (err) {
        console.error("Failed to load categories:", err);
      }
    }
    loadCategories();
  }, []);

  // Fetch Third-Party Products
  const loadProducts = useCallback(async () => {
    setProductsLoading(true);
    setProductsError(null);

    let sortField: string | undefined = undefined;
    let sortOrder: "asc" | "desc" | undefined = undefined;
    if (sortBy) {
      const [f, o] = sortBy.split(":");
      sortField = f;
      sortOrder = o as "asc" | "desc";
    }

    try {
      const res = await api.getProducts({
        search: search.trim() || undefined,
        category: category || undefined,
        sortBy: sortField,
        order: sortOrder,
        page,
        limit,
      });

      setProducts(res.data || []);
      setProductPagination(res.pagination);
    } catch (err) {
      setProductsError(err instanceof Error ? err.message : "Failed to load products");
    } finally {
      setProductsLoading(false);
    }
  }, [search, category, sortBy, page, limit]);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  // Fetch Saved Items from Database
  const loadSavedItems = useCallback(async () => {
    if (!user) return;
    setSavedLoading(true);

    try {
      const res = await api.getSavedItems({
        page: savedPage,
        limit: savedLimit,
      });
      setSavedItems(res.data || []);
      setSavedPagination(res.pagination);
    } catch (err) {
      console.error("Failed to load saved items:", err);
    } finally {
      setSavedLoading(false);
    }
  }, [user, savedPage, savedLimit]);

  useEffect(() => {
    if (tab === "saved" && user) {
      loadSavedItems();
    }
  }, [tab, user, loadSavedItems]);

  // Auth Handler
  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    setAuthSubmitting(true);

    try {
      if (isLoginMode) {
        await login(email, password);
        showMessage("Logged in successfully!");
      } else {
        await register(email, password, name);
        showMessage("Account created and logged in!");
      }
      setShowAuth(false);
      setEmail("");
      setPassword("");
      setName("");
    } catch (err) {
      setAuthError(err instanceof Error ? err.message : "Authentication failed");
    } finally {
      setAuthSubmitting(false);
    }
  };

  // Save Product to DB Handler
  const handleSaveProduct = async (product: Product) => {
    if (!user) {
      setShowAuth(true);
      return;
    }

    try {
      await api.saveProduct(product);
      showMessage(`Saved "${product.title}" to database!`);
    } catch (err) {
      showMessage(err instanceof Error ? err.message : "Failed to save", true);
    }
  };

  // Delete Saved Item Handler
  const handleDeleteSaved = async (id: number) => {
    try {
      await api.deleteSavedItem(id);
      showMessage("Item removed from database");
      loadSavedItems();
    } catch (err) {
      showMessage("Failed to remove item", true);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 font-sans">
      {/* 1. Simple Navigation Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h1 className="text-xl font-bold text-blue-600">Next-Task</h1>

            {/* Simple Tab Switch */}
            <nav className="flex items-center gap-2 text-sm">
              <button
                onClick={() => setTab("products")}
                className={`px-3 py-1.5 rounded border ${
                  tab === "products"
                    ? "bg-blue-50 border-blue-500 text-blue-700 font-medium"
                    : "border-transparent text-gray-600 hover:bg-gray-100"
                }`}
              >
                Products (3rd Party API)
              </button>

              <button
                onClick={() => {
                  if (!user) {
                    setShowAuth(true);
                  } else {
                    setTab("saved");
                  }
                }}
                className={`px-3 py-1.5 rounded border ${
                  tab === "saved"
                    ? "bg-blue-50 border-blue-500 text-blue-700 font-medium"
                    : "border-transparent text-gray-600 hover:bg-gray-100"
                }`}
              >
                My Saved Items (DB)
              </button>
            </nav>
          </div>

          {/* User / Auth section */}
          <div>
            {authLoading ? (
              <span className="text-xs text-gray-400">Loading...</span>
            ) : user ? (
              <div className="flex items-center gap-3 text-sm">
                <span className="text-gray-700">
                  Hi, <strong>{user.name || user.email}</strong>
                </span>
                <button
                  onClick={logout}
                  className="px-3 py-1 border border-gray-300 rounded text-xs text-red-600 hover:bg-red-50"
                >
                  Logout
                </button>
              </div>
            ) : (
              <button
                onClick={() => {
                  setIsLoginMode(true);
                  setShowAuth(true);
                }}
                className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm font-medium"
              >
                Login / Register
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Notification banner */}
      {message && (
        <div
          className={`py-2 px-4 text-center text-sm font-medium ${
            message.isError
              ? "bg-red-100 text-red-800 border-b border-red-200"
              : "bg-green-100 text-green-800 border-b border-green-200"
          }`}
        >
          {message.text}
        </div>
      )}

      {/* 2. Main Content */}
      <main className="max-w-6xl mx-auto px-4 py-6">
        {/* TAB 1: 3RD PARTY PRODUCTS WITH SEARCH, FILTER, PAGINATION */}
        {tab === "products" && (
          <div className="space-y-4">
            {/* Search, Filter & Sort Controls */}
            <div className="bg-white p-4 rounded border border-gray-200 shadow-sm flex flex-col sm:flex-row items-center gap-3">
              {/* Search Box */}
              <div className="flex-1 w-full">
                <input
                  type="text"
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setPage(1);
                  }}
                  placeholder="Search products by title..."
                  className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:border-blue-500"
                />
              </div>

              {/* Category Filter */}
              <div className="w-full sm:w-48">
                <select
                  value={category}
                  onChange={(e) => {
                    setCategory(e.target.value);
                    setPage(1);
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded text-sm bg-white focus:outline-none focus:border-blue-500"
                >
                  <option value="">All Categories</option>
                  {categories.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              {/* Sort Dropdown */}
              <div className="w-full sm:w-44">
                <select
                  value={sortBy}
                  onChange={(e) => {
                    setSortBy(e.target.value);
                    setPage(1);
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded text-sm bg-white focus:outline-none focus:border-blue-500"
                >
                  <option value="">Sort: Default</option>
                  <option value="price:asc">Price: Low to High</option>
                  <option value="price:desc">Price: High to Low</option>
                  <option value="rating:desc">Highest Rating</option>
                  <option value="title:asc">Title (A-Z)</option>
                </select>
              </div>

              {/* Clear button */}
              {(search || category || sortBy) && (
                <button
                  onClick={() => {
                    setSearch("");
                    setCategory("");
                    setSortBy("");
                    setPage(1);
                  }}
                  className="px-3 py-2 text-xs text-red-600 hover:underline shrink-0"
                >
                  Clear Filters
                </button>
              )}
            </div>

            {/* Error Message */}
            {productsError && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded">
                {productsError}
              </div>
            )}

            {/* Products Table / List */}
            {productsLoading ? (
              <div className="py-12 text-center text-gray-500 text-sm">
                Loading products from DummyJSON...
              </div>
            ) : products.length === 0 ? (
              <div className="py-12 text-center text-gray-500 text-sm bg-white border border-gray-200 rounded">
                No products found matching your search or filter.
              </div>
            ) : (
              <div className="bg-white border border-gray-200 rounded shadow-sm overflow-hidden">
                <table className="w-full text-left text-sm">
                  <thead className="bg-gray-100 border-b border-gray-200 text-xs font-semibold text-gray-600 uppercase">
                    <tr>
                      <th className="py-3 px-4 w-16">Image</th>
                      <th className="py-3 px-4">Title</th>
                      <th className="py-3 px-4">Category</th>
                      <th className="py-3 px-4">Price</th>
                      <th className="py-3 px-4">Rating</th>
                      <th className="py-3 px-4 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {products.map((p) => (
                      <tr key={p.id} className="hover:bg-gray-50">
                        <td className="py-2 px-4">
                          <img
                            src={p.thumbnail}
                            alt={p.title}
                            className="w-10 h-10 object-contain rounded bg-gray-100"
                            loading="lazy"
                          />
                        </td>
                        <td className="py-2 px-4 font-medium text-gray-900">
                          {p.title}
                          <p className="text-xs text-gray-500 line-clamp-1">{p.description}</p>
                        </td>
                        <td className="py-2 px-4 capitalize text-gray-600">
                          {p.category}
                        </td>
                        <td className="py-2 px-4 font-semibold text-gray-900">
                          ${p.price.toFixed(2)}
                        </td>
                        <td className="py-2 px-4 text-amber-600 font-medium">
                          ★ {p.rating}
                        </td>
                        <td className="py-2 px-4 text-right">
                          <button
                            onClick={() => handleSaveProduct(p)}
                            className="px-3 py-1 bg-blue-50 text-blue-600 border border-blue-200 rounded text-xs font-medium hover:bg-blue-100"
                          >
                            Save to DB
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Pagination Controls */}
            <Pagination
              pagination={productPagination}
              onPageChange={(p) => setPage(p)}
              onLimitChange={(l) => {
                setLimit(l);
                setPage(1);
              }}
            />
          </div>
        )}

        {/* TAB 2: MY SAVED ITEMS (IN MYSQL DATABASE) */}
        {tab === "saved" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-800">
                Saved Items in Database
              </h2>
              <button
                onClick={loadSavedItems}
                className="px-3 py-1 border border-gray-300 rounded text-xs hover:bg-gray-100"
              >
                Refresh
              </button>
            </div>

            {savedLoading ? (
              <div className="py-12 text-center text-gray-500 text-sm">
                Loading saved items from MySQL...
              </div>
            ) : savedItems.length === 0 ? (
              <div className="py-12 text-center text-gray-500 text-sm bg-white border border-gray-200 rounded">
                You have not saved any items yet. Go to the Products tab and click &quot;Save to DB&quot;.
              </div>
            ) : (
              <div className="bg-white border border-gray-200 rounded shadow-sm overflow-hidden">
                <table className="w-full text-left text-sm">
                  <thead className="bg-gray-100 border-b border-gray-200 text-xs font-semibold text-gray-600 uppercase">
                    <tr>
                      <th className="py-3 px-4 w-16">Image</th>
                      <th className="py-3 px-4">Title</th>
                      <th className="py-3 px-4">Category</th>
                      <th className="py-3 px-4">Price</th>
                      <th className="py-3 px-4 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {savedItems.map((item) => (
                      <tr key={item.id} className="hover:bg-gray-50">
                        <td className="py-2 px-4">
                          {item.thumbnail ? (
                            <img
                              src={item.thumbnail}
                              alt={item.title}
                              className="w-10 h-10 object-contain rounded bg-gray-100"
                            />
                          ) : (
                            <div className="w-10 h-10 bg-gray-200 rounded" />
                          )}
                        </td>
                        <td className="py-2 px-4 font-medium text-gray-900">
                          {item.title}
                          {item.description && (
                            <p className="text-xs text-gray-500 line-clamp-1">{item.description}</p>
                          )}
                        </td>
                        <td className="py-2 px-4 capitalize text-gray-600">
                          {item.category || "N/A"}
                        </td>
                        <td className="py-2 px-4 font-semibold text-gray-900">
                          ${item.price?.toFixed(2) ?? "0.00"}
                        </td>
                        <td className="py-2 px-4 text-right">
                          <button
                            onClick={() => handleDeleteSaved(item.id)}
                            className="px-3 py-1 bg-red-50 text-red-600 border border-red-200 rounded text-xs font-medium hover:bg-red-100"
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Saved Items Pagination */}
            <Pagination
              pagination={savedPagination}
              onPageChange={(p) => setSavedPage(p)}
              onLimitChange={(l) => {
                setSavedLimit(l);
                setSavedPage(1);
              }}
            />
          </div>
        )}
      </main>

      {/* 3. Simple Auth Modal */}
      {showAuth && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
          <div className="bg-white border border-gray-300 rounded-lg p-6 w-full max-w-sm shadow-lg space-y-4">
            <div className="flex items-center justify-between border-b pb-2">
              <h3 className="text-lg font-bold text-gray-800">
                {isLoginMode ? "Login" : "Register"}
              </h3>
              <button
                onClick={() => setShowAuth(false)}
                className="text-gray-400 hover:text-gray-600 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            {authError && (
              <div className="p-2 bg-red-50 border border-red-200 text-red-600 text-xs rounded">
                {authError}
              </div>
            )}

            <form onSubmit={handleAuthSubmit} className="space-y-3">
              {!isLoginMode && (
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Name
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Your Name"
                    className="w-full px-3 py-1.5 border border-gray-300 rounded text-sm focus:outline-none focus:border-blue-500"
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Email *
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="user@example.com"
                  className="w-full px-3 py-1.5 border border-gray-300 rounded text-sm focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Password *
                </label>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••"
                  className="w-full px-3 py-1.5 border border-gray-300 rounded text-sm focus:outline-none focus:border-blue-500"
                />
              </div>

              <button
                type="submit"
                disabled={authSubmitting}
                className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium text-sm rounded disabled:opacity-50"
              >
                {authSubmitting
                  ? "Please wait..."
                  : isLoginMode
                  ? "Login"
                  : "Register"}
              </button>
            </form>

            <div className="text-center text-xs text-gray-500 pt-2 border-t">
              {isLoginMode ? (
                <span>
                  Don&apos;t have an account?{" "}
                  <button
                    onClick={() => {
                      setIsLoginMode(false);
                      setAuthError(null);
                    }}
                    className="text-blue-600 hover:underline font-medium"
                  >
                    Register
                  </button>
                </span>
              ) : (
                <span>
                  Already have an account?{" "}
                  <button
                    onClick={() => {
                      setIsLoginMode(true);
                      setAuthError(null);
                    }}
                    className="text-blue-600 hover:underline font-medium"
                  >
                    Login
                  </button>
                </span>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
