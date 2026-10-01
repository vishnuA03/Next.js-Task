"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Product, PaginationInfo } from "../types";
import { api } from "../lib/api";
import { ProductCard } from "./ProductCard";
import { Pagination } from "./Pagination";
import {
  Search,
  Filter,
  ArrowUpDown,
  X,
  Loader2,
  RefreshCw,
  Sparkles,
  SlidersHorizontal,
} from "lucide-react";

interface ProductExplorerProps {
  onOpenAuth: () => void;
}

export const ProductExplorer: React.FC<ProductExplorerProps> = ({ onOpenAuth }) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filter & Search & Pagination States
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [minPrice, setMinPrice] = useState<string>("");
  const [maxPrice, setMaxPrice] = useState<string>("");
  const [sortBy, setSortBy] = useState<string>("");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [showFilters, setShowFilters] = useState(false);

  const [pagination, setPagination] = useState<PaginationInfo>({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
    hasNextPage: false,
    hasPrevPage: false,
  });

  // Debounce search term by 400ms
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      setPage(1); // reset to page 1 on new search
    }, 400);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Fetch Categories on mount
  useEffect(() => {
    async function loadCategories() {
      try {
        const res = await api.getCategories();
        if (res.data) {
          // Normalize category objects if DummyJSON returns objects or strings
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

  // Fetch Products based on current filters, search, and pagination
  const fetchProducts = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const res = await api.getProducts({
        search: debouncedSearch || undefined,
        category: selectedCategory || undefined,
        minPrice: minPrice ? parseFloat(minPrice) : undefined,
        maxPrice: maxPrice ? parseFloat(maxPrice) : undefined,
        sortBy: sortBy || undefined,
        order: sortOrder,
        page,
        limit,
      });

      setProducts(res.data);
      setPagination(res.pagination);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load products");
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, selectedCategory, minPrice, maxPrice, sortBy, sortOrder, page, limit]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const handleResetFilters = () => {
    setSearchTerm("");
    setDebouncedSearch("");
    setSelectedCategory("");
    setMinPrice("");
    setMaxPrice("");
    setSortBy("");
    setSortOrder("asc");
    setPage(1);
  };

  const hasActiveFilters =
    debouncedSearch.length > 0 ||
    selectedCategory.length > 0 ||
    minPrice.length > 0 ||
    maxPrice.length > 0 ||
    sortBy.length > 0;

  return (
    <div className="space-y-6">
      {/* Header & Description */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 text-xs font-semibold mb-2">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Third-Party API Integration (DummyJSON)</span>
          </div>
          <h2 className="text-2xl font-extrabold text-zinc-900 dark:text-zinc-100 tracking-tight">
            Explore Products & Data
          </h2>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            Real-time live search, dynamic category filtering, price bounds, and server-side pagination.
          </p>
        </div>

        <button
          onClick={fetchProducts}
          title="Refresh Data"
          className="self-start md:self-auto flex items-center gap-2 px-3.5 py-2 rounded-xl bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 text-xs font-medium transition-colors cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Search & Filter Controls Bar */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4 shadow-sm space-y-4">
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center gap-3">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search products by title, description, or keywords..."
              className="w-full pl-10 pr-9 py-2.5 bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700/80 rounded-xl text-sm text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Category Dropdown */}
          <div className="relative min-w-[180px]">
            <select
              value={selectedCategory}
              onChange={(e) => {
                setSelectedCategory(e.target.value);
                setPage(1);
              }}
              className="w-full px-3.5 py-2.5 bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700/80 rounded-xl text-sm text-zinc-800 dark:text-zinc-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 capitalize cursor-pointer"
            >
              <option value="">All Categories ({categories.length})</option>
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat.replace(/-/g, " ")}
                </option>
              ))}
            </select>
          </div>

          {/* Sort By Dropdown */}
          <div className="relative min-w-[170px]">
            <select
              value={sortBy ? `${sortBy}:${sortOrder}` : ""}
              onChange={(e) => {
                const val = e.target.value;
                if (!val) {
                  setSortBy("");
                  setSortOrder("asc");
                } else {
                  const [field, order] = val.split(":");
                  setSortBy(field);
                  setSortOrder(order as "asc" | "desc");
                }
                setPage(1);
              }}
              className="w-full px-3.5 py-2.5 bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700/80 rounded-xl text-sm text-zinc-800 dark:text-zinc-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
            >
              <option value="">Default Order</option>
              <option value="price:asc">Price: Low to High</option>
              <option value="price:desc">Price: High to Low</option>
              <option value="rating:desc">Top Rated</option>
              <option value="title:asc">Title (A - Z)</option>
            </select>
          </div>

          {/* Toggle More Filters Button */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center justify-center gap-2 px-3.5 py-2.5 rounded-xl border text-sm font-medium transition-colors cursor-pointer ${
              showFilters || minPrice || maxPrice
                ? "bg-indigo-50 dark:bg-indigo-950/50 border-indigo-300 dark:border-indigo-800 text-indigo-600 dark:text-indigo-400"
                : "bg-zinc-50 dark:bg-zinc-800/60 border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-700"
            }`}
          >
            <SlidersHorizontal className="w-4 h-4" />
            <span>Filters</span>
          </button>
        </div>

        {/* Collapsible Price Filter Range */}
        {showFilters && (
          <div className="pt-3 border-t border-zinc-100 dark:border-zinc-800 flex flex-wrap items-center gap-4 animate-in fade-in duration-200">
            <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
              Price Range ($):
            </span>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min="0"
                placeholder="Min"
                value={minPrice}
                onChange={(e) => {
                  setMinPrice(e.target.value);
                  setPage(1);
                }}
                className="w-24 px-3 py-1.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
              <span className="text-zinc-400">-</span>
              <input
                type="number"
                min="0"
                placeholder="Max"
                value={maxPrice}
                onChange={(e) => {
                  setMaxPrice(e.target.value);
                  setPage(1);
                }}
                className="w-24 px-3 py-1.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>

            {hasActiveFilters && (
              <button
                onClick={handleResetFilters}
                className="ml-auto text-xs text-red-600 dark:text-red-400 hover:underline font-medium cursor-pointer"
              >
                Reset All Filters
              </button>
            )}
          </div>
        )}

        {/* Active Filter Badges */}
        {hasActiveFilters && (
          <div className="flex flex-wrap items-center gap-2 pt-2">
            <span className="text-xs text-zinc-400">Active filters:</span>

            {debouncedSearch && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 text-xs font-medium border border-indigo-200 dark:border-indigo-800">
                Search: &quot;{debouncedSearch}&quot;
                <button
                  onClick={() => setSearchTerm("")}
                  className="hover:text-red-500 cursor-pointer"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}

            {selectedCategory && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 text-xs font-medium border border-purple-200 dark:border-purple-800 capitalize">
                Category: {selectedCategory}
                <button
                  onClick={() => setSelectedCategory("")}
                  className="hover:text-red-500 cursor-pointer"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}

            {(minPrice || maxPrice) && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 text-xs font-medium border border-emerald-200 dark:border-emerald-800">
                Price: ${minPrice || "0"} - ${maxPrice || "∞"}
                <button
                  onClick={() => {
                    setMinPrice("");
                    setMaxPrice("");
                  }}
                  className="hover:text-red-500 cursor-pointer"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}

            {sortBy && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 text-xs font-medium border border-zinc-200 dark:border-zinc-700">
                Sorted by {sortBy} ({sortOrder})
                <button
                  onClick={() => setSortBy("")}
                  className="hover:text-red-500 cursor-pointer"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}

            <button
              onClick={handleResetFilters}
              className="text-xs text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 underline ml-2 cursor-pointer"
            >
              Clear all
            </button>
          </div>
        )}
      </div>

      {/* Error state */}
      {error && (
        <div className="p-4 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 rounded-2xl text-red-700 dark:text-red-400 text-sm flex items-center justify-between">
          <span>{error}</span>
          <button
            onClick={fetchProducts}
            className="text-xs underline font-semibold cursor-pointer"
          >
            Retry
          </button>
        </div>
      )}

      {/* Loading state skeleton / spinner */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 py-6">
          {Array.from({ length: limit }).map((_, idx) => (
            <div
              key={idx}
              className="animate-pulse bg-zinc-100 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-800 rounded-2xl h-80 flex flex-col p-4"
            >
              <div className="w-full aspect-square bg-zinc-200 dark:bg-zinc-700 rounded-xl mb-4" />
              <div className="h-4 bg-zinc-200 dark:bg-zinc-700 rounded w-3/4 mb-2" />
              <div className="h-3 bg-zinc-200 dark:bg-zinc-700 rounded w-1/2 mb-auto" />
              <div className="h-8 bg-zinc-200 dark:bg-zinc-700 rounded-xl mt-4" />
            </div>
          ))}
        </div>
      ) : products.length === 0 ? (
        <div className="text-center py-16 px-4 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl space-y-3">
          <div className="inline-flex h-12 w-12 rounded-2xl bg-zinc-100 dark:bg-zinc-800 items-center justify-center text-zinc-400">
            <Search className="w-6 h-6" />
          </div>
          <h4 className="text-lg font-bold text-zinc-800 dark:text-zinc-200">
            No products found
          </h4>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 max-w-sm mx-auto">
            Try adjusting your search terms or clearing active filters.
          </p>
          {hasActiveFilters && (
            <button
              onClick={handleResetFilters}
              className="mt-2 px-4 py-2 bg-indigo-600 text-white text-xs font-semibold rounded-xl hover:bg-indigo-700 transition-colors cursor-pointer"
            >
              Clear Filters
            </button>
          )}
        </div>
      ) : (
        <>
          {/* Products Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {products.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                onOpenAuth={onOpenAuth}
              />
            ))}
          </div>

          {/* Dynamic Pagination */}
          <Pagination
            pagination={pagination}
            onPageChange={(newPage) => {
              setPage(newPage);
              window.scrollTo({ top: 0, behavior: "smooth" });
            }}
            onLimitChange={(newLimit) => {
              setLimit(newLimit);
              setPage(1);
            }}
          />
        </>
      )}
    </div>
  );
};
