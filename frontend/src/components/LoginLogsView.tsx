"use client";

import React, { useState, useEffect, useCallback } from "react";
import { LoginLog, PaginationInfo } from "../types";
import { api } from "../lib/api";
import { Pagination } from "./Pagination";
import { useAuth } from "../context/AuthContext";
import { ShieldCheck, CheckCircle2, XCircle, Clock, Laptop, RefreshCw, Loader2 } from "lucide-react";

export const LoginLogsView: React.FC = () => {
  const { user } = useAuth();
  const [logs, setLogs] = useState<LoginLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);

  const [pagination, setPagination] = useState<PaginationInfo>({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
    hasNextPage: false,
    hasPrevPage: false,
  });

  const loadLogs = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    setError(null);

    try {
      const res = await api.getLoginLogs(page, limit);
      setLogs(res.data);
      setPagination(res.pagination);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load login history");
    } finally {
      setLoading(false);
    }
  }, [user, page, limit]);

  useEffect(() => {
    loadLogs();
  }, [loadLogs]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 text-xs font-semibold mb-2">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Security & Audit Trail</span>
          </div>
          <h2 className="text-2xl font-extrabold text-zinc-900 dark:text-zinc-100 tracking-tight">
            Database Login History
          </h2>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            Recorded automatically in MySQL (`login_logs` table) upon each authentication attempt.
          </p>
        </div>

        <button
          onClick={loadLogs}
          className="self-start sm:self-auto flex items-center gap-2 px-3.5 py-2 rounded-xl bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 text-xs font-medium transition-colors cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          <span>Refresh Logs</span>
        </button>
      </div>

      {error && (
        <div className="p-4 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 rounded-2xl text-red-700 dark:text-red-400 text-sm">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
        </div>
      ) : logs.length === 0 ? (
        <div className="text-center py-16 px-4 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl space-y-3">
          <ShieldCheck className="w-12 h-12 text-zinc-400 mx-auto" />
          <h4 className="text-lg font-bold text-zinc-800 dark:text-zinc-200">
            No login history records found
          </h4>
        </div>
      ) : (
        <>
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-zinc-50 dark:bg-zinc-800/60 text-zinc-500 dark:text-zinc-400 text-xs uppercase font-semibold border-b border-zinc-200 dark:border-zinc-800">
                  <tr>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Date & Time</th>
                    <th className="py-3 px-4">IP Address</th>
                    <th className="py-3 px-4">Device / Client</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800 text-zinc-800 dark:text-zinc-200">
                  {logs.map((log) => (
                    <tr key={log.id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/30 transition-colors">
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${
                            log.status === "SUCCESS"
                              ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800"
                              : "bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-200 dark:border-rose-800"
                          }`}
                        >
                          {log.status === "SUCCESS" ? (
                            <CheckCircle2 className="w-3.5 h-3.5" />
                          ) : (
                            <XCircle className="w-3.5 h-3.5" />
                          )}
                          <span>{log.status}</span>
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-xs">
                        <div className="flex items-center gap-1.5 text-zinc-600 dark:text-zinc-400">
                          <Clock className="w-3.5 h-3.5" />
                          <span>{new Date(log.createdAt).toLocaleString()}</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 font-mono text-xs text-zinc-500">
                        {log.ipAddress || "127.0.0.1"}
                      </td>
                      <td className="py-3.5 px-4 text-xs text-zinc-500 max-w-xs truncate">
                        <div className="flex items-center gap-1.5" title={log.userAgent || "Unknown"}>
                          <Laptop className="w-3.5 h-3.5 shrink-0" />
                          <span className="truncate">{log.userAgent || "Browser Client"}</span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
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
