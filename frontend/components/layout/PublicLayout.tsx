"use client";

import React from "react";
import { Logo } from "../ui/Logo";
import { Button } from "../ui/Button";
import { Sun, Moon, ArrowRight, ShieldCheck, Zap, Globe, Heart } from "lucide-react";
import { useApp } from "../common/AppContext";

export const PublicLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { theme, toggleTheme, setActiveView } = useApp();

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-navy-950 text-navy-900 dark:text-navy-100 transition-colors">
      {/* Public Header */}
      <header className="sticky top-0 z-40 h-20 bg-white/80 dark:bg-navy-900/80 backdrop-blur-md border-b border-navy-200 dark:border-navy-800">
        <div className="max-w-7xl mx-auto h-full px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-4">
          <Logo size="md" showTagline={false} />

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center gap-8 text-sm font-semibold text-navy-600 dark:text-navy-300">
            <a href="#marketplace" className="hover:text-brand-600 dark:hover:text-brand-400 transition">
              Live Market
            </a>
            <a href="#how-it-works" className="hover:text-brand-600 dark:hover:text-brand-400 transition">
              How It Works
            </a>
            <a href="#producers" className="hover:text-brand-600 dark:hover:text-brand-400 transition">
              For Microgrids
            </a>
            <a href="#consumers" className="hover:text-brand-600 dark:hover:text-brand-400 transition">
              For Buyers
            </a>
            <a href="#certificates" className="hover:text-brand-600 dark:hover:text-brand-400 transition">
              REC Tokens
            </a>
          </nav>

          {/* Right Action buttons */}
          <div className="flex items-center gap-3">
            <button
              onClick={toggleTheme}
              className="p-2 rounded-xl text-navy-500 hover:text-navy-900 dark:hover:text-white hover:bg-navy-100 dark:hover:bg-navy-800 transition"
              title="Toggle Theme"
            >
              {theme === "light" ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4 text-amber-400" />}
            </button>

            <Button
              variant="secondary"
              size="sm"
              onClick={() => setActiveView("auth")}
            >
              Sign In
            </Button>

            <Button
              variant="primary"
              size="sm"
              rightIcon={<ArrowRight className="w-4 h-4" />}
              onClick={() => setActiveView("dashboard")}
            >
              Launch Portal
            </Button>
          </div>
        </div>
      </header>

      {/* Main Page Content */}
      <main className="flex-1">{children}</main>

      {/* Public Footer */}
      <footer className="border-t border-navy-200 dark:border-navy-800 bg-white dark:bg-navy-900 mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="col-span-1 md:col-span-2 space-y-4">
              <Logo size="lg" showTagline />
              <p className="text-xs sm:text-sm text-navy-500 dark:text-navy-400 max-w-sm leading-relaxed mt-2">
                Decentralized, demand-aware peer-to-peer renewable energy trading protocol anchored on Ethereum Sepolia. Empowering microgrid independence and transparent carbon offset certification.
              </p>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-xs font-semibold text-emerald-700 dark:text-emerald-400">
                <ShieldCheck className="w-4 h-4" /> Zero Speculative AI • 100% Deterministic Rule Engine
              </div>
            </div>

            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-navy-900 dark:text-white mb-3">
                Protocol & Portals
              </h4>
              <ul className="space-y-2 text-xs sm:text-sm text-navy-500 dark:text-navy-400">
                <li><button onClick={() => setActiveView("dashboard")} className="hover:text-brand-600 transition">Producer Hub</button></li>
                <li><button onClick={() => setActiveView("dashboard")} className="hover:text-brand-600 transition">Consumer Hub</button></li>
                <li><button onClick={() => setActiveView("dashboard")} className="hover:text-brand-600 transition">Admin Clearing Engine</button></li>
                <li><button onClick={() => setActiveView("showroom")} className="hover:text-brand-600 transition">Component Showroom</button></li>
              </ul>
            </div>

            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-navy-900 dark:text-white mb-3">
                Blockchain & Compliance
              </h4>
              <ul className="space-y-2 text-xs sm:text-sm text-navy-500 dark:text-navy-400">
                <li><a href="https://sepolia.etherscan.io" target="_blank" rel="noreferrer" className="hover:text-brand-600 transition">Sepolia Explorer</a></li>
                <li><span className="hover:text-brand-600 transition cursor-pointer">ERC-721 G-REC Token</span></li>
                <li><span className="hover:text-brand-600 transition cursor-pointer">0.820 kg CO2 Baseline</span></li>
                <li><span className="hover:text-brand-600 transition cursor-pointer">Security & Audits</span></li>
              </ul>
            </div>
          </div>

          <div className="mt-12 pt-6 border-t border-navy-100 dark:border-navy-800 flex flex-col sm:flex-row items-center justify-between text-xs text-navy-400 dark:text-navy-500 gap-4">
            <p>© {new Date().getFullYear()} GreenLedger Protocol. All rights reserved.</p>
            <p className="flex items-center gap-1">
              Built with Next.js, Tailwind CSS, Solidity & Wagmi.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};
