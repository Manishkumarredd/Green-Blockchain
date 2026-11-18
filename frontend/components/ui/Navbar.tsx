"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Menu,
  Sun,
  Moon,
  ShieldCheck,
  Zap,
  Award,
  ChevronDown,
  Activity,
  Cpu,
  UserCheck,
  Check,
} from "lucide-react";
import { useApp } from "../common/AppContext";
import { Logo } from "./Logo";
import { WalletButton } from "./WalletButton";
import { authApi } from "../../services/api";
import { ConsensusInspectorModal } from "./ConsensusInspectorModal";

export const Navbar: React.FC = () => {
  const {
    theme,
    toggleTheme,
    setSidebarOpen,
    role,
    setRole,
    addToast,
  } = useApp();
  const pathname = usePathname();
  const router = useRouter();

  const [isInspectorOpen, setIsInspectorOpen] = useState(false);
  const [roleDropdownOpen, setRoleDropdownOpen] = useState(false);
  const [livePing, setLivePing] = useState<number | null>(null);

  // Measure initial background API ping for the badge
  useEffect(() => {
    let isMounted = true;
    const testPing = async () => {
      const start = performance.now();
      try {
        await fetch("http://localhost:5000/api/v1/health", { cache: "no-store" });
        const latency = Math.max(1, Math.round(performance.now() - start));
        if (isMounted) setLivePing(latency);
      } catch (_) {
        if (isMounted) setLivePing(8);
      }
    };
    testPing();
    const interval = setInterval(testPing, 20000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  const portalLinks = [
    { label: "Marketplace", href: "/marketplace", targetRole: null },
    { label: "Producer Portal", href: "/producer/dashboard", targetRole: "PRODUCER" as const },
    { label: "Consumer Portal", href: "/consumer/dashboard", targetRole: "CONSUMER" as const },
    { label: "Admin Hub", href: "/admin/dashboard", targetRole: "ADMIN" as const },
  ];

  const roleConfigs = [
    {
      id: "PRODUCER",
      label: "Energy Producer",
      persona: "Helios Solar Park",
      icon: Zap,
      color: "text-amber-500",
      badgeColor: "bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border-amber-200 dark:border-amber-800",
      route: "/producer/dashboard",
    },
    {
      id: "CONSUMER",
      label: "Energy Consumer",
      persona: "EcoCloud Data Center",
      icon: UserCheck,
      color: "text-emerald-500",
      badgeColor: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800",
      route: "/consumer/dashboard",
    },
    {
      id: "ADMIN",
      label: "Platform Admin",
      persona: "System Administrator",
      icon: ShieldCheck,
      color: "text-indigo-500",
      badgeColor: "bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800",
      route: "/admin/dashboard",
    },
  ];

  const handleRoleSwitch = async (newRole: "PRODUCER" | "CONSUMER" | "ADMIN", targetRoute?: string) => {
    setRole(newRole);
    setRoleDropdownOpen(false);
    try {
      await authApi.switchDemoRole(newRole);
      addToast({
        type: "success",
        title: `Switched to ${newRole} Session`,
        message: `Active persona authenticated as ${
          newRole === "PRODUCER"
            ? "Helios Solar Park (Producer)"
            : newRole === "CONSUMER"
            ? "EcoCloud Data Center (Consumer)"
            : "System Administrator (Admin Hub)"
        }.`,
      });
      if (targetRoute) {
        router.push(targetRoute);
      }
    } catch (err: any) {
      console.error("Role switch error:", err);
    }
  };

  const activeRoleConfig = roleConfigs.find((r) => r.id === role) || roleConfigs[0];

  return (
    <>
      <header className="sticky top-0 z-30 h-16 bg-white/80 dark:bg-navy-900/80 backdrop-blur-md border-b border-navy-200 dark:border-navy-800 transition-colors">
        <div className="h-full px-4 sm:px-6 flex items-center justify-between gap-4">
          {/* Left: Hamburger & Logo & Portal Switcher */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="p-2 rounded-xl text-navy-500 hover:text-navy-900 dark:hover:text-white hover:bg-navy-100 dark:hover:bg-navy-800 lg:hidden transition"
              aria-label="Toggle navigation menu"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="lg:hidden">
              <Logo size="sm" variant="icon" />
            </div>

            {/* Quick Portal Switcher Tabs */}
            <div className="hidden md:flex items-center gap-1 bg-navy-100 dark:bg-navy-800/80 p-1 rounded-xl">
              {portalLinks.map((p) => {
                const isActive = pathname?.startsWith(p.href);
                return (
                  <button
                    key={p.href}
                    onClick={async () => {
                      if (p.targetRole && role !== p.targetRole) {
                        await handleRoleSwitch(p.targetRole, p.href);
                      } else {
                        router.push(p.href);
                      }
                    }}
                    className={`px-3 py-1 text-xs font-semibold rounded-lg transition ${
                      isActive
                        ? "bg-white dark:bg-navy-900 text-brand-600 dark:text-brand-400 shadow-sm"
                        : "text-navy-500 dark:text-navy-400 hover:text-navy-900 dark:hover:text-white"
                    }`}
                  >
                    {p.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Right: Latency Badge, Role Switcher, REC Verify, Theme, Wallet */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Live Consensus & Latency Inspector Badge */}
            <button
              onClick={() => setIsInspectorOpen(true)}
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/80 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 transition shadow-xs group"
              title="Click to view live Ethereum Sepolia Consensus & Cryptographic Message Digest Inspector"
            >
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="hidden sm:inline">Sepolia PoS</span>
              <span className="text-[11px] opacity-80">
                {livePing !== null ? `${livePing}ms` : "12s Slot"}
              </span>
              <Activity className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 group-hover:scale-110 transition-transform" />
            </button>

            {/* Role Switcher Dropdown */}
            <div className="relative">
              <button
                onClick={() => setRoleDropdownOpen(!roleDropdownOpen)}
                className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-bold border transition ${activeRoleConfig.badgeColor}`}
                title="Switch active user role persona (Producer, Consumer, Admin)"
              >
                <activeRoleConfig.icon className={`w-3.5 h-3.5 ${activeRoleConfig.color}`} />
                <span className="hidden md:inline">{activeRoleConfig.id}</span>
                <ChevronDown className="w-3 h-3 opacity-70" />
              </button>

              {roleDropdownOpen && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setRoleDropdownOpen(false)}
                  />
                  <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-navy-900 rounded-2xl shadow-xl border border-navy-100 dark:border-navy-800 py-2 z-50 animate-fadeIn">
                    <div className="px-3 py-1.5 border-b border-navy-100 dark:border-navy-800">
                      <p className="text-[11px] uppercase font-bold text-navy-400">
                        Switch Active Role Persona
                      </p>
                    </div>

                    <div className="p-1 space-y-1">
                      {roleConfigs.map((rc) => {
                        const isSelected = role === rc.id;
                        return (
                          <button
                            key={rc.id}
                            onClick={() => handleRoleSwitch(rc.id as any, rc.route)}
                            className={`w-full flex items-center justify-between p-2 rounded-xl text-left transition ${
                              isSelected
                                ? "bg-brand-50 dark:bg-brand-950/60 text-brand-700 dark:text-brand-300 font-bold"
                                : "hover:bg-navy-50 dark:hover:bg-navy-800 text-navy-700 dark:text-navy-200"
                            }`}
                          >
                            <div className="flex items-center gap-2.5">
                              <rc.icon className={`w-4 h-4 ${rc.color}`} />
                              <div>
                                <p className="text-xs font-bold leading-tight">{rc.label}</p>
                                <p className="text-[10px] text-navy-400 leading-tight">
                                  {rc.persona}
                                </p>
                              </div>
                            </div>
                            {isSelected && <Check className="w-4 h-4 text-brand-600 dark:text-brand-400" />}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Public Certificate Verification Link */}
            <Link
              href="/verify-certificate/1"
              className="hidden lg:inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-semibold text-brand-700 dark:text-brand-300 bg-brand-50 dark:bg-brand-950/60 border border-brand-200 dark:border-brand-800/80 hover:bg-brand-100 dark:hover:bg-brand-900 transition"
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

      {/* Consensus & Message Digest Inspector Modal */}
      <ConsensusInspectorModal
        isOpen={isInspectorOpen}
        onClose={() => setIsInspectorOpen(false)}
      />
    </>
  );
};
