"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Activity,
  PlusCircle,
  Coins,
  Settings,
  ShoppingBag,
  Sliders,
  Award,
  Leaf,
  Scale,
  TrendingUp,
  Users,
  FileText,
  ChevronRight,
  ShieldAlert,
  Zap,
  LogOut,
} from "lucide-react";
import { useApp, UserRole } from "../common/AppContext";
import { Logo } from "./Logo";
import { authApi } from "../../services/api";

export interface NavItem {
  id: string;
  label: string;
  icon: React.ElementType;
  badge?: string | number;
}

export const Sidebar: React.FC<{ activeNavId?: string; onNavSelect?: (id: string) => void }> = ({
  activeNavId = "overview",
  onNavSelect,
}) => {
  const router = useRouter();
  const { role, setRole, sidebarOpen, setSidebarOpen, addToast } = useApp();
  const [currentUser, setCurrentUser] = useState<any>(null);

  useEffect(() => {
    try {
      const stored = typeof window !== "undefined"
        ? (localStorage.getItem("greenledger_user") || localStorage.getItem("user"))
        : null;
      if (stored) {
        setCurrentUser(JSON.parse(stored));
      }
    } catch (_) {}
  }, [role]);



  const handleLogout = () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("greenledger_auth_token");
      localStorage.removeItem("greenledger_jwt");
      localStorage.removeItem("greenledger_user");
      localStorage.removeItem("user");
    }
    addToast({
      type: "info",
      title: "Logged Out",
      description: "You have securely signed out of GreenLedger.",
    });
    router.push("/login");
  };

  const producerNav: NavItem[] = [
    { id: "overview", label: "Producer Hub", icon: LayoutDashboard },
    { id: "telemetry", label: "Generation Feeds", icon: Activity, badge: "Live" },
    { id: "listings", label: "Energy Listings", icon: PlusCircle, badge: "P2P" },
    { id: "settlements", label: "Settlement Payouts", icon: Coins },
  ];

  const consumerNav: NavItem[] = [
    { id: "overview", label: "Consumer Hub", icon: LayoutDashboard },
    { id: "marketplace", label: "Clean Energy Market", icon: ShoppingBag, badge: "Live" },
    { id: "requests", label: "Energy Requests", icon: Sliders },
    { id: "purchases", label: "Purchase History", icon: Coins },
    { id: "carbon", label: "Carbon Savings", icon: Leaf },
  ];

  const adminNav: NavItem[] = [
    { id: "overview", label: "Platform Overview", icon: LayoutDashboard },
    { id: "users", label: "User Governance", icon: Users },
    { id: "listings", label: "Listing Surveillance", icon: PlusCircle },
    { id: "requests", label: "Demand Queue", icon: Sliders },
    { id: "transactions", label: "P2P Transactions", icon: Coins },
    { id: "algorithms", label: "Research Algorithms", icon: Scale, badge: "DA-WPA" },
    { id: "research", label: "Research Analytics", icon: TrendingUp, badge: "Empirical" },
    { id: "settings", label: "Platform Settings", icon: Settings },
    { id: "audit", label: "Activity Logs & Audit", icon: FileText },
  ];

  const currentNav = role === "PRODUCER" ? producerNav : role === "CONSUMER" ? consumerNav : adminNav;

  const roleMeta = {
    PRODUCER: { label: "Producer Portal", color: "text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40" },
    CONSUMER: { label: "Consumer Portal", color: "text-sky-600 dark:text-sky-400 bg-sky-50 dark:bg-sky-950/40" },
    ADMIN: { label: "Administrator", color: "text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-950/40" },
  }[role];

  const displayName = currentUser?.name || currentUser?.fullName || (
    role === "PRODUCER" ? "Helios Solar Park" : role === "CONSUMER" ? "EcoCloud Data Center" : "Platform Admin"
  );
  const displayMeter = currentUser?.meterId || currentUser?.meter_id || (
    role === "PRODUCER" ? "METER-PROD-SOL-101" : role === "CONSUMER" ? "METER-CONS-DAT-501" : "METER-ADMIN-000"
  );
  const initials = displayName
    .split(" ")
    .map((n: string) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <>
      {/* Mobile Backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-navy-950/60 backdrop-blur-sm lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar Panel */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-40 w-64 bg-white dark:bg-navy-900 border-r border-navy-200 dark:border-navy-800 flex flex-col justify-between transition-transform duration-200 ease-in-out lg:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Top Logo & Role Switcher */}
        <div>
          <div className="h-16 flex items-center px-6 border-b border-navy-100 dark:border-navy-800/80">
            <Logo size="md" />
          </div>

          {/* Active Portal Role Badge */}
          <div className="p-4 border-b border-navy-100 dark:border-navy-800/60">
            <div className={`py-1.5 px-3 rounded-xl text-xs font-semibold flex items-center justify-between ${roleMeta.color}`}>
              <span className="font-bold">{roleMeta.label}</span>
              <span className="w-2 h-2 rounded-full bg-brand-500 animate-pulse"></span>
            </div>
          </div>

          {/* Navigation Items */}
          <nav className="p-3 space-y-1">
            {currentNav.map((item) => {
              const Icon = item.icon;
              const isActive = activeNavId === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    onNavSelect?.(item.id);
                    setSidebarOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition cursor-pointer ${
                    isActive
                      ? "bg-brand-50 dark:bg-brand-950/60 text-brand-700 dark:text-brand-300 font-bold"
                      : "text-navy-600 dark:text-navy-300 hover:bg-navy-50 dark:hover:bg-navy-800 hover:text-navy-900 dark:hover:text-white"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className={`w-4 h-4 ${isActive ? "text-brand-600 dark:text-brand-400" : "text-navy-400 dark:text-navy-500"}`} />
                    <span>{item.label}</span>
                  </div>
                  {item.badge && (
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        isActive
                          ? "bg-brand-200/70 text-brand-800 dark:bg-brand-900 dark:text-brand-200"
                          : "bg-navy-100 text-navy-600 dark:bg-navy-800 dark:text-navy-300"
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* User / Meter Profile Footer with Logout */}
        <div className="p-4 border-t border-navy-100 dark:border-navy-800 bg-navy-50/50 dark:bg-navy-950/40">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-9 h-9 rounded-xl bg-brand-600 text-white flex items-center justify-center font-bold text-sm shadow-sm flex-shrink-0">
                {initials || "GL"}
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="text-xs font-bold text-navy-900 dark:text-white truncate">
                  {displayName}
                </h4>
                <p className="text-[11px] text-navy-400 dark:text-navy-500 truncate font-mono">
                  {displayMeter}
                </p>
              </div>
            </div>

            <button
              onClick={handleLogout}
              className="p-2 text-navy-400 hover:text-rose-600 dark:hover:text-rose-400 rounded-xl hover:bg-rose-50 dark:hover:bg-rose-950/50 transition cursor-pointer flex-shrink-0"
              title="Sign Out of Session"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};
