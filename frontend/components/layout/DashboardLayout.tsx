"use client";

import React, { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useApp } from "../common/AppContext";
import { Sidebar } from "../ui/Sidebar";
import { Navbar } from "../ui/Navbar";
import { ToastContainer } from "../ui/Toast";
import { authApi } from "../../services/api";

export interface DashboardLayoutProps {
  children: React.ReactNode;
  activeNavId?: string;
  onNavSelect?: (navId: string) => void;
}

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({
  children,
  activeNavId = "overview",
  onNavSelect,
}) => {
  const router = useRouter();
  const pathname = usePathname();
  const { role, setRole } = useApp();

  useEffect(() => {
    let targetRole: "PRODUCER" | "CONSUMER" | "ADMIN" | null = null;
    if (pathname?.startsWith("/admin")) targetRole = "ADMIN";
    else if (pathname?.startsWith("/consumer")) targetRole = "CONSUMER";
    else if (pathname?.startsWith("/producer")) targetRole = "PRODUCER";

    if (targetRole) {
      if (role !== targetRole) {
        setRole(targetRole);
      }
      try {
        const stored = typeof window !== "undefined"
          ? (localStorage.getItem("greenledger_user") || localStorage.getItem("user"))
          : null;
        const u = stored ? JSON.parse(stored) : null;
        if (!u || u.role !== targetRole) {
          authApi.switchDemoRole(targetRole);
        }
      } catch (_) {}
    }
  }, [pathname, role, setRole]);

  const handleNavSelect = (navId: string) => {
    if (onNavSelect) {
      onNavSelect(navId);
      return;
    }

    // Default route navigation
    if (role === "PRODUCER") {
      if (navId === "overview") router.push("/producer/dashboard");
      else if (navId === "listings") router.push("/producer/listings");
      else if (navId === "telemetry") router.push("/producer/dashboard");
      else if (navId === "settlements") router.push("/producer/dashboard");
    } else if (role === "CONSUMER") {
      if (navId === "overview") router.push("/consumer/dashboard");
      else if (navId === "marketplace") router.push("/marketplace");
      else if (navId === "requests") router.push("/consumer/requests");
      else if (navId === "purchases") router.push("/consumer/purchases");
      else if (navId === "carbon") router.push("/consumer/dashboard");
    } else if (role === "ADMIN") {
      if (navId === "overview") router.push("/admin/dashboard");
      else if (navId === "users") router.push("/admin/users");
      else if (navId === "listings") router.push("/admin/listings");
      else if (navId === "requests") router.push("/admin/requests");
      else if (navId === "transactions") router.push("/admin/transactions");
      else if (navId === "algorithms" || navId === "matching" || navId === "pricing") router.push("/admin/algorithms");
      else if (navId === "research") router.push("/admin/research-analytics");
      else if (navId === "settings") router.push("/admin/settings");
      else if (navId === "audit") router.push("/admin/activity-logs");
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-navy-950 text-navy-900 dark:text-navy-100 flex flex-col transition-colors">
      {/* Toast Notification Mount */}
      <ToastContainer />

      {/* Main Container */}
      <div className="flex flex-1">
        {/* Left Responsive Sidebar */}
        <Sidebar activeNavId={activeNavId} onNavSelect={handleNavSelect} />

        {/* Content Wrapper (with left padding on lg screens for sidebar) */}
        <div className="flex-1 flex flex-col lg:pl-64 min-w-0">
          {/* Top Sticky Navbar */}
          <Navbar />

          {/* Main Dashboard Canvas */}
          <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
};
