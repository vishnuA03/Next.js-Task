"use client";

import React from "react";
import { useAuth } from "../context/AuthContext";
import {
  Sparkles,
  Search,
  BookmarkCheck,
  CheckSquare,
  ShieldCheck,
  LogOut,
  LogIn,
  User as UserIcon,
} from "lucide-react";

interface NavbarProps {
  activeTab: "products" | "saved" | "tasks" | "logs";
  setActiveTab: (tab: "products" | "saved" | "tasks" | "logs") => void;
  onOpenAuth: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  onOpenAuth,
}) => {
  const { user, logout } = useAuth();

  return (
    <header className="sticky top-0 z-40 w-full backdrop-blur-md bg-white/80 dark:bg-zinc-900/80 border-b border-zinc-200 dark:border-zinc-800 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-purple-600 to-pink-500 flex items-center justify-center text-white shadow-md shadow-indigo-500/20">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 font-medium">
              API Explorer & Task Hub
            </p>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="hidden md:flex items-center gap-1 p-1 bg-zinc-100 dark:bg-zinc-800 rounded-xl border border-zinc-200 dark:border-zinc-700/50">
          <button
            onClick={() => setActiveTab("products")}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-sm font-medium transition-all ${
              activeTab === "products"
                ? "bg-white dark:bg-zinc-900 text-indigo-600 dark:text-indigo-400 shadow-sm"
                : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100"
            }`}
          >
            <Search className="w-4 h-4" />
          </button>

          <button
            onClick={() => setActiveTab("saved")}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-sm font-medium transition-all ${
              activeTab === "saved"
                ? "bg-white dark:bg-zinc-900 text-indigo-600 dark:text-indigo-400 shadow-sm"
                : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100"
            }`}
          >
            <BookmarkCheck className="w-4 h-4" />
            {/* <span>Saved in DB</span> */}
          </button>

          <button
            onClick={() => setActiveTab("tasks")}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-sm font-medium transition-all ${
              activeTab === "tasks"
                ? "bg-white dark:bg-zinc-900 text-indigo-600 dark:text-indigo-400 shadow-sm"
                : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100"
            }`}
          >
            <CheckSquare className="w-4 h-4" />
            <span>Tasks</span>
          </button>

          {user && (
            <button
              onClick={() => setActiveTab("logs")}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-sm font-medium transition-all ${
                activeTab === "logs"
                  ? "bg-white dark:bg-zinc-900 text-indigo-600 dark:text-indigo-400 shadow-sm"
                  : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100"
              }`}
            >
              <ShieldCheck className="w-4 h-4" />
              <span>Login Logs</span>
            </button>
          )}
        </nav>

        {/* User Status / Auth Controls */}
        <div className="flex items-center gap-3">
          {user ? (
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700">
                <div className="h-7 w-7 rounded-full bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-semibold text-xs">
                  {user.name
                    ? user.name[0].toUpperCase()
                    : user.email[0].toUpperCase()}
                </div>
                <div className="hidden sm:block text-left">
                  <p className="text-xs font-semibold text-zinc-800 dark:text-zinc-200 leading-tight">
                    {user.name || user.email.split("@")[0]}
                  </p>
                  <p className="text-[10px] text-zinc-500 dark:text-zinc-400 truncate max-w-[120px]">
                    {user.email}
                  </p>
                </div>
              </div>
              <button
                onClick={logout}
                title="Log out"
                className="p-2 text-zinc-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg transition-colors"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button
              onClick={onOpenAuth}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium shadow-md shadow-indigo-500/20 transition-all active:scale-95 cursor-pointer"
            >
              <LogIn className="w-4 h-4" />
              <span>Sign In</span>
            </button>
          )}
        </div>
      </div>

      {/* Mobile navigation tab bar */}
      <div className="md:hidden flex items-center justify-around border-t border-zinc-200 dark:border-zinc-800 py-2 px-2 bg-zinc-50 dark:bg-zinc-900">
        <button
          onClick={() => setActiveTab("products")}
          className={`flex flex-col items-center gap-1 text-xs py-1 px-2 rounded-lg ${
            activeTab === "products"
              ? "text-indigo-600 font-semibold"
              : "text-zinc-500"
          }`}
        >
          <Search className="w-4 h-4" />
          <span>Explorer</span>
        </button>
        <button
          onClick={() => setActiveTab("saved")}
          className={`flex flex-col items-center gap-1 text-xs py-1 px-2 rounded-lg ${
            activeTab === "saved"
              ? "text-indigo-600 font-semibold"
              : "text-zinc-500"
          }`}
        >
          <BookmarkCheck className="w-4 h-4" />
          <span>Saved</span>
        </button>
        <button
          onClick={() => setActiveTab("tasks")}
          className={`flex flex-col items-center gap-1 text-xs py-1 px-2 rounded-lg ${
            activeTab === "tasks"
              ? "text-indigo-600 font-semibold"
              : "text-zinc-500"
          }`}
        >
          <CheckSquare className="w-4 h-4" />
          <span>Tasks</span>
        </button>
        {user && (
          <button
            onClick={() => setActiveTab("logs")}
            className={`flex flex-col items-center gap-1 text-xs py-1 px-2 rounded-lg ${
              activeTab === "logs"
                ? "text-indigo-600 font-semibold"
                : "text-zinc-500"
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            <span>Logs</span>
          </button>
        )}
      </div>
    </header>
  );
};
