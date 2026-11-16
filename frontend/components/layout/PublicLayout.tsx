"use client";

import React, { useState } from "react";
import { Logo } from "../ui/Logo";
import { Button } from "../ui/Button";
import { Sun, Moon, ArrowRight, ShieldCheck, Zap, Menu, X, FileText } from "lucide-react";
import { useApp } from "../common/AppContext";
import Link from "next/link";

export const PublicLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { theme, toggleTheme, setActiveView } = useApp();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navLinks = [
    { label: "Home", href: "#home" },
    { label: "Marketplace", href: "#marketplace" },
    { label: "How It Works", href: "#how-it-works" },
    { label: "Features", href: "#features" },
    { label: "Fair Allocation", href: "#fair-allocation" },
    { label: "Blockchain", href: "#blockchain" },
    { label: "About", href: "#about" },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-navy-950 text-navy-900 dark:text-navy-100 transition-colors">
      {/* Sticky Public Header */}
      <header className="sticky top-0 z-50 h-20 bg-white/90 dark:bg-navy-900/90 backdrop-blur-md border-b border-navy-200 dark:border-navy-800 transition-colors">
        <div className="max-w-7xl mx-auto h-full px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-4">
          <a href="#home" className="flex items-center">
            <Logo size="md" showTagline={false} />
          </a>

          {/* Desktop Navigation Links */}
          <nav className="hidden lg:flex items-center gap-7 text-sm font-semibold text-navy-600 dark:text-navy-300">
            {navLinks.map((link) => (
              <a
                key={link.label}
                href={link.href}
                className="hover:text-brand-600 dark:hover:text-brand-400 transition"
              >
                {link.label}
              </a>
            ))}
          </nav>

          {/* Desktop Action buttons */}
          <div className="hidden sm:flex items-center gap-3">
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
              Login
            </Button>

            <Button
              variant="primary"
              size="sm"
              rightIcon={<ArrowRight className="w-4 h-4" />}
              onClick={() => setActiveView("auth")}
            >
              Get Started
            </Button>
          </div>

          {/* Mobile Menu Button */}
          <div className="flex sm:hidden items-center gap-2">
            <button
              onClick={toggleTheme}
              className="p-2 rounded-xl text-navy-500 hover:text-navy-900 dark:hover:text-white"
            >
              {theme === "light" ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4 text-amber-400" />}
            </button>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-xl text-navy-700 dark:text-navy-200 hover:bg-navy-100 dark:hover:bg-navy-800"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Dropdown Menu */}
        {mobileMenuOpen && (
          <div className="sm:hidden bg-white dark:bg-navy-900 border-b border-navy-200 dark:border-navy-800 px-4 pt-3 pb-6 space-y-3 animate-in slide-in-from-top-4 duration-200 shadow-xl">
            {navLinks.map((link) => (
              <a
                key={link.label}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className="block text-sm font-semibold text-navy-700 dark:text-navy-200 py-1.5 hover:text-brand-600"
              >
                {link.label}
              </a>
            ))}
            <div className="pt-3 border-t border-navy-100 dark:border-navy-800 flex flex-col gap-2">
              <Button
                variant="secondary"
                size="sm"
                fullWidth
                onClick={() => {
                  setMobileMenuOpen(false);
                  setActiveView("auth");
                }}
              >
                Login
              </Button>
              <Button
                variant="primary"
                size="sm"
                fullWidth
                onClick={() => {
                  setMobileMenuOpen(false);
                  setActiveView("auth");
                }}
              >
                Get Started
              </Button>
            </div>
          </div>
        )}
      </header>

      {/* Main Page Content */}
      <main className="flex-1" id="home">{children}</main>

      {/* Public Footer */}
      <footer className="border-t border-navy-200 dark:border-navy-800 bg-white dark:bg-navy-900 mt-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="col-span-1 md:col-span-2 space-y-4">
              <Logo size="lg" showTagline />
              <p className="text-xs sm:text-sm text-navy-500 dark:text-navy-400 max-w-sm leading-relaxed mt-2">
                GreenLedger is an open software protocol for decentralized, demand-aware peer-to-peer renewable energy trading, fair proportional allocation, and blockchain-verifiable renewable energy certificates.
              </p>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-xs font-semibold text-emerald-700 dark:text-emerald-400">
                <ShieldCheck className="w-4 h-4" /> 100% Software Simulated • Ethereum Sepolia Testnet
              </div>
            </div>

            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-navy-900 dark:text-white mb-3">
                Navigation & Portals
              </h4>
              <ul className="space-y-2 text-xs sm:text-sm text-navy-500 dark:text-navy-400">
                <li><a href="#marketplace" className="hover:text-brand-600 transition">Marketplace</a></li>
                <li><a href="#how-it-works" className="hover:text-brand-600 transition">How It Works</a></li>
                <li><a href="#features" className="hover:text-brand-600 transition">Platform Features</a></li>
                <li><a href="#fair-allocation" className="hover:text-brand-600 transition">Fair Allocation Model</a></li>
                <li><a href="#blockchain" className="hover:text-brand-600 transition">Blockchain Verification</a></li>
              </ul>
            </div>

            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-navy-900 dark:text-white mb-3">
                Technical Documentation
              </h4>
              <ul className="space-y-2 text-xs sm:text-sm text-navy-500 dark:text-navy-400">
                <li><span className="hover:text-brand-600 transition cursor-pointer">Architecture Specification</span></li>
                <li><span className="hover:text-brand-600 transition cursor-pointer">REST API Reference</span></li>
                <li><span className="hover:text-brand-600 transition cursor-pointer">PostgreSQL Schema Design</span></li>
                <li><span className="hover:text-brand-600 transition cursor-pointer">Smart Contract Audits</span></li>
                <li><a href="https://sepolia.etherscan.io" target="_blank" rel="noreferrer" className="hover:text-brand-600 transition">Sepolia Block Explorer</a></li>
              </ul>
            </div>
          </div>

          <div className="mt-12 pt-6 border-t border-navy-100 dark:border-navy-800 flex flex-col sm:flex-row items-center justify-between text-xs text-navy-400 dark:text-navy-500 gap-4">
            <p>© {new Date().getFullYear()} GreenLedger. All rights reserved.</p>
            <p className="flex items-center gap-1">
              Software simulated renewable research benchmark.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};
