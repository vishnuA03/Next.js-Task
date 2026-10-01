"use client";

import React, { useState } from "react";
import Image from "next/image";
import { Product } from "../types";
import { Star, Bookmark, Check, Loader2, Tag } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { api } from "../lib/api";

interface ProductCardProps {
  product: Product;
  onOpenAuth: () => void;
  onSaveSuccess?: () => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  onOpenAuth,
  onSaveSuccess,
}) => {
  const { user } = useAuth();
  const [isSaving, setIsSaving] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

  const handleSave = async () => {
    if (!user) {
      onOpenAuth();
      return;
    }

    try {
      setIsSaving(true);
      await api.saveProduct(product);
      setIsSaved(true);
      if (onSaveSuccess) onSaveSuccess();
      setTimeout(() => setIsSaved(false), 2500);
    } catch (err) {
      console.error("Failed to save product:", err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="group relative flex flex-col bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl overflow-hidden hover:shadow-xl hover:border-indigo-500/40 transition-all duration-300">
      {/* Thumbnail */}
      <div className="relative aspect-square w-full bg-zinc-100 dark:bg-zinc-800 overflow-hidden flex items-center justify-center p-4">
        {product.thumbnail ? (
          <img
            src={product.thumbnail}
            alt={product.title}
            className="h-full w-full object-contain group-hover:scale-105 transition-transform duration-300"
            loading="lazy"
          />
        ) : (
          <Tag className="w-12 h-12 text-zinc-400" />
        )}

        {/* Category Badge */}
        <span className="absolute top-3 left-3 px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-md text-white text-[11px] font-medium capitalize">
          {product.category}
        </span>

        {/* Save/Bookmark Button */}
        <button
          onClick={handleSave}
          disabled={isSaving || isSaved}
          title={user ? "Save to your Database" : "Sign in to save"}
          className={`absolute top-3 right-3 p-2 rounded-xl backdrop-blur-md shadow-md transition-all active:scale-90 cursor-pointer ${
            isSaved
              ? "bg-emerald-500 text-white"
              : "bg-white/80 dark:bg-zinc-800/80 text-zinc-700 dark:text-zinc-200 hover:bg-white dark:hover:bg-zinc-700"
          }`}
        >
          {isSaving ? (
            <Loader2 className="w-4 h-4 animate-spin text-indigo-600" />
          ) : isSaved ? (
            <Check className="w-4 h-4" />
          ) : (
            <Bookmark className="w-4 h-4" />
          )}
        </button>
      </div>

      {/* Content */}
      <div className="flex flex-col flex-1 p-4">
        <div className="flex items-center justify-between gap-2 mb-1.5">
          <div className="flex items-center gap-1 text-amber-500 text-xs font-semibold">
            <Star className="w-3.5 h-3.5 fill-current" />
            <span>{product.rating ? product.rating.toFixed(1) : "N/A"}</span>
          </div>
          {product.stock && (
            <span className="text-[11px] text-zinc-500 dark:text-zinc-400">
              {product.stock} in stock
            </span>
          )}
        </div>

        <h4 className="font-semibold text-zinc-900 dark:text-zinc-100 text-sm line-clamp-1 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
          {product.title}
        </h4>

        <p className="text-xs text-zinc-500 dark:text-zinc-400 line-clamp-2 mt-1 flex-1">
          {product.description}
        </p>

        {/* Price & Action */}
        <div className="mt-4 pt-3 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
          <div>
            <div className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
              ${product.price?.toFixed(2)}
            </div>
            {product.discountPercentage > 0 && (
              <span className="text-[10px] text-emerald-600 font-semibold">
                {product.discountPercentage}% OFF
              </span>
            )}
          </div>

          <button
            onClick={handleSave}
            disabled={isSaving || isSaved}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all active:scale-95 cursor-pointer ${
              isSaved
                ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300"
                : "bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-900/50"
            }`}
          >
            {isSaved ? "Saved in DB" : "Save to DB"}
          </button>
        </div>
      </div>
    </div>
  );
};
