"use client";

import React, { useState, useEffect, useCallback } from "react";
import { SavedItem, PaginationInfo } from "../types";
import { api } from "../lib/api";
import { Pagination } from "./Pagination";
import { useAuth } from "../context/AuthContext";
import {
  BookmarkCheck,
  Search,
  Trash2,
  Tag,
  Loader2,
  LogIn,
  RefreshCw,
  X,
} from "lucide-react";

interface SavedItemsViewProps {
  onOpenAuth: () => void;
}

export const SavedItemsView: React.FC<SavedItemsViewProps> = ({ onOpenAuth }) => {
  const { user } = useAuth();
  const [items, setItems] = useState<SavedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [category, setCategory] = useState("");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const [pagination, setPagination] = useState<PaginationInfo>({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
    hasNextPage: false,
    hasPrevPage: false,
  });

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      setPage(1);
    }, 400);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const loadSavedItems = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await api.getSavedItems({
        search: debouncedSearch || undefined,
        category: category || undefined,
        page,
        limit,
      });
      setItems(res.data);
      setPagination(res.pagination);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load saved items");
    } finally {
      setLoading(false);
    }
  }, [user, debouncedSearch, category, page, limit]);

  useEffect(() => {
    loadSavedItems();
  }, [loadSavedItems]);

  const handleDelete = async (id: number) => {
    try {
      setDeletingId(id);
      await api.deleteSavedItem(id);
      setItems((prev) => prev.filter((item) => item.id !== id));
      setPagination((prev) => ({
        ...prev,
        total: Math.max(0, prev.total - 1),
      }));
    } catch (err) {
      console.error("Failed to delete saved item:", err);
    } finally {
      setDeletingId(null);
    }
  };

  if (!user) {
    return (
      <div className="text-center py-20 px-6 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl space-y-4 max-w-xl mx-auto shadow-sm">
        <div className="inline-flex h-16 w-16 rounded-3xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 items-center justify-center">
          <BookmarkCheck className="w-8 h-8" />
        </div>
        <h3 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
          Database Persistence
        </h3>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          Sign in to save third-party products, manage your items, and query them with search, filter, and pagination from MySQL database.
        </p>
        <button
          onClick={onOpenAuth}
          className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-2xl shadow-lg shadow-indigo-500/25 transition-all active:scale-95 cursor-pointer"
        >
          <LogIn className="w-4 h-4" />
          <span>Sign In / Register</span>
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 text-xs font-semibold mb-2">
            <BookmarkCheck className="w-3.5 h-3.5" />
            <span>Saved in MySQL (`saved_items` table)</span>
          </div>
          <h2 className="text-2xl font-extrabold text-zinc-900 dark:text-zinc-100 tracking-tight">
            My Saved Items
          </h2>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            Stored persistently in MySQL. Supports database-level search, category filter, and pagination.
          </p>
        </div>

        <button
          onClick={loadSavedItems}
          className="self-start md:self-auto flex items-center gap-2 px-3.5 py-2 rounded-xl bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 text-xs font-medium transition-colors cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Search & Filter Bar */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4 shadow-sm flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search saved items by title or description..."
            className="w-full pl-10 pr-9 py-2 bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-zinc-400 hover:text-zinc-600"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Error alert */}
      {error && (
        <div className="p-4 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 rounded-2xl text-red-700 dark:text-red-400 text-sm">
          {error}
        </div>
      )}

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
        </div>
      ) : items.length === 0 ? (
        <div className="text-center py-16 px-4 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl space-y-3">
          <div className="inline-flex h-12 w-12 rounded-2xl bg-zinc-100 dark:bg-zinc-800 items-center justify-center text-zinc-400">
            <BookmarkCheck className="w-6 h-6" />
          </div>
          <h4 className="text-lg font-bold text-zinc-800 dark:text-zinc-200">
            No saved items yet
          </h4>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 max-w-sm mx-auto">
            Explore products from the Third-Party Explorer tab and click &quot;Save to DB&quot; to bookmark them here.
          </p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {items.map((item) => (
              <div
                key={item.id}
                className="group relative flex flex-col bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl overflow-hidden hover:shadow-lg transition-all"
              >
                <div className="relative aspect-square w-full bg-zinc-100 dark:bg-zinc-800 overflow-hidden flex items-center justify-center p-4">
                  {item.thumbnail ? (
                    <img
                      src={item.thumbnail}
                      alt={item.title}
                      className="h-full w-full object-contain"
                    />
                  ) : (
                    <Tag className="w-10 h-10 text-zinc-400" />
                  )}

                  {item.category && (
                    <span className="absolute top-3 left-3 px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-md text-white text-[10px] font-medium capitalize">
                      {item.category}
                    </span>
                  )}

                  <button
                    onClick={() => handleDelete(item.id)}
                    disabled={deletingId === item.id}
                    title="Remove from DB"
                    className="absolute top-3 right-3 p-2 rounded-xl bg-white/80 dark:bg-zinc-800/80 text-red-600 hover:bg-red-50 dark:hover:bg-red-950/50 backdrop-blur-md shadow transition-colors cursor-pointer"
                  >
                    {deletingId === item.id ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Trash2 className="w-4 h-4" />
                    )}
                  </button>
                </div>

                <div className="p-4 flex flex-col flex-1">
                  <h4 className="font-semibold text-zinc-900 dark:text-zinc-100 text-sm line-clamp-1">
                    {item.title}
                  </h4>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 line-clamp-2 mt-1 flex-1">
                    {item.description || "No description provided"}
                  </p>

                  <div className="mt-4 pt-3 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
                    <span className="text-base font-bold text-zinc-900 dark:text-zinc-100">
                      ${item.price?.toFixed(2) ?? "0.00"}
                    </span>
                    <span className="text-[10px] text-zinc-400">
                      Saved {new Date(item.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <Pagination
            pagination={pagination}
            onPageChange={(p) => setPage(p)}
            onLimitChange={(l) => {
              setLimit(l);
              setPage(1);
            }}
          />
        </>
      )}
    </div>
  );
};
