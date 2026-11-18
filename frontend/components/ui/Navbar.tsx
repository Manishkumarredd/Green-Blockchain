"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, Sun, Moon, Bell, ShieldCheck, ShoppingBag, Zap, Award } from "lucide-react";
import { useApp } from "../common/AppContext";
import { Logo } from "./Logo";
import { WalletButton } from "./WalletButton";
import { authApi } from "../../services/api";

export const Navbar: React.FC = () => {
  const {
    theme,
    toggleTheme,
    setSidebarOpen,
    role,
    setRole,
  } = useApp();
  const pathname = usePathname();

  const portalLinks = [
    { label: "Marketplace", href: "/marketplace", role: "ALL" },
    { label: "Producer Portal", href: "/producer/dashboard", role: "PRODUCER" },
    { label: "Consumer Portal", href: "/consumer/dashboard", role: "CONSUMER" },
    { label: "Admin Hub", href: "/admin/dashboard", role: "ADMIN" },
  ];

  return (
    <header className="sticky top-0 z-30 h-16 bg-white/80 dark:bg-navy-900/80 backdrop-blur-md border-b border-navy-200 dark:border-navy-800 transition-colors">
      <div className="h-full px-4 sm:px-6 flex items-center justify-between gap-4">
        {/* Left: Hamburger & Logo */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 rounded-xl text-navy-500 hover:text-navy-900 dark:hover:text-white hover:bg-navy-100 dark:hover:bg-navy-800 lg:hidden transition"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div className="lg:hidden">
            <Logo size="sm" variant="icon" />
          </div>

          {/* Quick Portal Switcher Pills */}
          <div className="hidden md:flex items-center gap-1 bg-navy-100 dark:bg-navy-800/80 p-1 rounded-xl">
            {portalLinks.map((p) => {
              const isActive = pathname?.startsWith(p.href);
              return (
                <Link
                  key={p.href}
                  href={p.href}
                  onClick={async () => {
                    if (p.role !== "ALL") {
                      setRole(p.role as any);
                      try {
                        await authApi.switchDemoRole(p.role as any);
                      } catch (_) {}
                    }
                  }}
                  className={`px-3 py-1 text-xs font-semibold rounded-lg transition ${
                    isActive
                      ? "bg-white dark:bg-navy-900 text-brand-600 dark:text-brand-400 shadow-sm"
                      : "text-navy-500 dark:text-navy-400 hover:text-navy-900 dark:hover:text-white"
                  }`}
                >
                  {p.label}
                </Link>
              );
            })}
          </div>
        </div>

        {/* Right: Network, Theme Toggle, Certificate Verify, Wallet */}
        <div className="flex items-center gap-2.5 sm:gap-3">
          {/* Public Certificate Verification Link */}
          <Link
            href="/verify-certificate/1"
            className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-semibold text-brand-700 dark:text-brand-300 bg-brand-50 dark:bg-brand-950/60 border border-brand-200 dark:border-brand-800/80 hover:bg-brand-100 dark:hover:bg-brand-900 transition"
          >
            <Award className="w-3.5 h-3.5 text-brand-600 dark:text-brand-400" />
            <span>Verify REC</span>
          </Link>

          {/* Theme Toggle Button */}
          <button
            onClick={toggleTheme}
            className="p-2 rounded-xl text-navy-500 hover:text-navy-900 dark:hover:text-white hover:bg-navy-100 dark:hover:bg-navy-800 transition"
            title="Toggle theme"
          >
            {theme === "light" ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4 text-amber-400" />}
          </button>

          {/* Web3 Wallet Connect Button */}
          <WalletButton />
        </div>
      </div>
    </header>
  );
};
