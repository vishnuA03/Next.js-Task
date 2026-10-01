"use client";

import React from "react";
import { PaginationInfo } from "../types";

interface PaginationProps {
  pagination: PaginationInfo;
  onPageChange: (page: number) => void;
  onLimitChange?: (limit: number) => void;
}

export const Pagination: React.FC<PaginationProps> = ({
  pagination,
  onPageChange,
  onLimitChange,
}) => {
  const { page, totalPages, total, limit } = pagination;

  if (totalPages <= 1 && total <= limit) return null;

  return (
    <div className="flex flex-wrap items-center justify-between gap-4 py-4 mt-4 border-t border-gray-200 text-sm text-gray-700">
      <div>
        <span>
          Page <strong>{page}</strong> of <strong>{totalPages || 1}</strong> ({total} total items)
        </span>
      </div>

      <div className="flex items-center gap-2">
        {onLimitChange && (
          <div className="flex items-center gap-1 mr-4">
            <span className="text-xs text-gray-500">Show:</span>
            <select
              value={limit}
              onChange={(e) => onLimitChange(Number(e.target.value))}
              className="border border-gray-300 rounded px-2 py-1 text-xs bg-white text-gray-800"
            >
              <option value={5}>5</option>
              <option value={10}>10</option>
              <option value={20}>20</option>
            </select>
          </div>
        )}

        <button
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
          className="px-3 py-1.5 border border-gray-300 rounded bg-white hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed font-medium text-xs"
        >
          &larr; Previous
        </button>

        <span className="px-2 font-semibold text-xs">
          {page} / {totalPages}
        </span>

        <button
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages}
          className="px-3 py-1.5 border border-gray-300 rounded bg-white hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed font-medium text-xs"
        >
          Next &rarr;
        </button>
      </div>
    </div>
  );
};
