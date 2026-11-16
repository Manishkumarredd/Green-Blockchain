"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useApp } from "../common/AppContext";
import { Sidebar } from "../ui/Sidebar";
import { Navbar } from "../ui/Navbar";
import { ToastContainer } from "../ui/Toast";

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
  const { role } = useApp();

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
    } else if (role === "ADMIN") {
      if (navId === "overview") router.push("/admin/dashboard");
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
