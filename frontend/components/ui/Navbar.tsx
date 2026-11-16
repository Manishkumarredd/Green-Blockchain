"use client";

import React from "react";
import { Menu, Sun, Moon, Bell, ShieldCheck } from "lucide-react";
import { useApp } from "../common/AppContext";
import { Logo } from "./Logo";
import { WalletButton } from "./WalletButton";

export const Navbar: React.FC = () => {
  const {
    theme,
    toggleTheme,
    setSidebarOpen,
    activeView,
    setActiveView,
    addToast,
  } = useApp();

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

          {/* Quick View Switcher Pills */}
          <div className="hidden md:flex items-center gap-1 bg-navy-100 dark:bg-navy-800/80 p-1 rounded-xl">
            {(
              [
                { id: "dashboard", label: "Dashboard" },
                { id: "landing", label: "Landing View" },
                { id: "auth", label: "Auth View" },
                { id: "showroom", label: "Component Showroom" },
              ] as const
            ).map((v) => (
              <button
                key={v.id}
                onClick={() => setActiveView(v.id)}
                className={`px-3 py-1 text-xs font-semibold rounded-lg transition ${
                  activeView === v.id
                    ? "bg-white dark:bg-navy-900 text-brand-600 dark:text-brand-400 shadow-sm"
                    : "text-navy-500 dark:text-navy-400 hover:text-navy-900 dark:hover:text-white"
                }`}
              >
                {v.label}
              </button>
            ))}
          </div>
        </div>

        {/* Right: Network, Theme Toggle, Notifications, Wallet */}
        <div className="flex items-center gap-2.5 sm:gap-3">
          {/* Sepolia Network Badge */}
          <span className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/50">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            Ethereum Sepolia
          </span>

          {/* Notification Bell */}
          <button
            onClick={() =>
              addToast({
                type: "info",
                title: "New Matching Cycle",
                description: "Cycle #1002 completed. 3 trades cleared at 0.000088 ETH/kWh.",
              })
            }
            className="p-2 rounded-xl text-navy-500 hover:text-navy-900 dark:hover:text-white hover:bg-navy-100 dark:hover:bg-navy-800 transition relative"
            title="Notifications"
          >
            <Bell className="w-4 h-4" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-brand-500 ring-2 ring-white dark:ring-navy-900"></span>
          </button>

          {/* Theme Toggle Button */}
          <button
            onClick={toggleTheme}
            className="p-2 rounded-xl text-navy-500 hover:text-navy-900 dark:hover:text-white hover:bg-navy-100 dark:hover:bg-navy-800 transition cursor-pointer"
            title={theme === "light" ? "Switch to Dark Mode" : "Switch to Light Mode"}
          >
            {theme === "light" ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4 text-amber-400" />}
          </button>

          {/* Web3 Wallet Connection Button */}
          <WalletButton />
        </div>
      </div>
    </header>
  );
};
