"use client";

import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import {
  X,
  Smartphone,
  Laptop,
  CheckCircle2,
  ExternalLink,
  QrCode,
  ShieldCheck,
  RefreshCw,
  Sparkles,
} from "lucide-react";

export interface WalletOption {
  id: string;
  name: string;
  tagline: string;
  iconBg: string;
  badge?: string;
  installUrl: string;
  isInstalled: () => boolean;
}

interface ConnectWalletModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectWallet: (walletId: string) => Promise<void>;
  isConnecting: boolean;
  activeWalletId?: string | null;
}

export const ConnectWalletModal: React.FC<ConnectWalletModalProps> = ({
  isOpen,
  onClose,
  onSelectWallet,
  isConnecting,
  activeWalletId,
}) => {
  const [activeTab, setActiveTab] = useState<"desktop" | "mobile">("desktop");
  const [selectedWallet, setSelectedWallet] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) {
      document.addEventListener("keydown", handleKeyDown);
    }
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !mounted) return null;

  // Detect which wallets are installed in the user's browser
  const checkInstalled = (walletId: string): boolean => {
    if (typeof window === "undefined") return false;
    const eth = (window as any).ethereum;
    const rabby = (window as any).rabby;
    const coinbase = (window as any).coinbaseWalletExtension;

    if (walletId === "rabby") {
      return Boolean(
        rabby ||
        eth?.isRabby ||
        (eth?.providers && eth.providers.some((p: any) => p.isRabby))
      );
    }
    if (walletId === "coinbase") {
      return Boolean(
        coinbase ||
        eth?.isCoinbaseWallet ||
        (eth?.providers && eth.providers.some((p: any) => p.isCoinbaseWallet))
      );
    }
    if (walletId === "brave") {
      return Boolean(eth?.isBraveWallet || (window as any).braveEthereum);
    }
    if (walletId === "metamask") {
      return Boolean(
        (eth?.isMetaMask && !eth?.isRabby && !eth?.isBraveWallet) ||
        (eth?.providers && eth.providers.some((p: any) => p.isMetaMask && !p.isRabby))
      );
    }
    return Boolean(eth);
  };

  const WALLETS: WalletOption[] = [
    {
      id: "metamask",
      name: "MetaMask",
      tagline: "Popular browser extension & mobile app",
      iconBg: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
      badge: "Popular",
      installUrl: "https://metamask.io/download/",
      isInstalled: () => checkInstalled("metamask") || Boolean(typeof window !== "undefined" && window.ethereum),
    },
    {
      id: "coinbase",
      name: "Coinbase Wallet",
      tagline: "Secure extension & standalone dApp wallet",
      iconBg: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20",
      installUrl: "https://www.coinbase.com/wallet",
      isInstalled: () => checkInstalled("coinbase"),
    },
    {
      id: "rabby",
      name: "Rabby Wallet",
      tagline: "DeFi-centric with transaction pre-simulation",
      iconBg: "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20",
      badge: "Security",
      installUrl: "https://rabby.io/",
      isInstalled: () => checkInstalled("rabby"),
    },
    {
      id: "brave",
      name: "Brave Wallet",
      tagline: "Native Web3 wallet built directly into Brave",
      iconBg: "bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/20",
      installUrl: "https://brave.com/wallet/",
      isInstalled: () => checkInstalled("brave"),
    },
  ];

  const handleConnect = async (walletId: string) => {
    setSelectedWallet(walletId);
    await onSelectWallet(walletId);
  };

  return createPortal(
    <div className="fixed inset-0 z-[999999] flex items-center justify-center p-4 bg-navy-950/80 backdrop-blur-md animate-fadeIn overflow-y-auto">
      <div
        className="relative w-full max-w-lg bg-white dark:bg-navy-900 rounded-3xl border border-navy-200 dark:border-navy-800 shadow-2xl overflow-hidden my-auto animate-scaleIn max-h-[92vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-navy-100 dark:border-navy-800 shrink-0">
          <div>
            <h3 className="text-base sm:text-lg font-extrabold text-navy-950 dark:text-white flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-brand-500" />
              Connect Web3 Wallet
            </h3>
            <p className="text-xs text-navy-500 dark:text-navy-400 mt-0.5">
              Select your Ethereum wallet to trade green energy on Sepolia
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-navy-400 hover:text-navy-700 dark:hover:text-white rounded-xl hover:bg-navy-100 dark:hover:bg-navy-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher: Desktop Extensions vs Mobile QR */}
        <div className="px-6 pt-3 shrink-0">
          <div className="grid grid-cols-2 p-1 bg-navy-50 dark:bg-navy-950 rounded-2xl border border-navy-100 dark:border-navy-800 text-xs font-bold">
            <button
              onClick={() => setActiveTab("desktop")}
              className={`flex items-center justify-center gap-2 py-2 rounded-xl transition cursor-pointer ${
                activeTab === "desktop"
                  ? "bg-white dark:bg-navy-800 text-brand-600 dark:text-brand-400 shadow-sm"
                  : "text-navy-500 hover:text-navy-900 dark:hover:text-white"
              }`}
            >
              <Laptop className="w-4 h-4" />
              Browser Wallets
            </button>
            <button
              onClick={() => setActiveTab("mobile")}
              className={`flex items-center justify-center gap-2 py-2 rounded-xl transition cursor-pointer ${
                activeTab === "mobile"
                  ? "bg-white dark:bg-navy-800 text-brand-600 dark:text-brand-400 shadow-sm"
                  : "text-navy-500 hover:text-navy-900 dark:hover:text-white"
              }`}
            >
              <Smartphone className="w-4 h-4" />
              Mobile Scan (QR)
            </button>
          </div>
        </div>

        {/* Tab 1: Browser Wallets (Scrollable if screen is compact) */}
        {activeTab === "desktop" && (
          <div className="p-6 space-y-2.5 overflow-y-auto">
            {WALLETS.map((w) => {
              const installed = w.isInstalled();
              const isSelected = selectedWallet === w.id || activeWalletId === w.id;

              return (
                <div
                  key={w.id}
                  onClick={() => installed && !isConnecting && handleConnect(w.id)}
                  className={`group relative flex items-center justify-between p-3.5 rounded-2xl border transition cursor-pointer ${
                    isSelected && isConnecting
                      ? "bg-brand-50/60 dark:bg-brand-950/40 border-brand-500 ring-2 ring-brand-500/20"
                      : installed
                      ? "bg-emerald-50/40 dark:bg-navy-950 hover:bg-emerald-50 dark:hover:bg-navy-800/80 border-emerald-300/80 dark:border-emerald-800/60 hover:border-brand-500"
                      : "bg-slate-50/40 dark:bg-navy-950/40 border-navy-100 dark:border-navy-800/50 opacity-80"
                  }`}
                >
                  <div className="flex items-center gap-3.5">
                    {/* Wallet Badge / Icon */}
                    <div className={`w-10 h-10 rounded-2xl flex items-center justify-center font-extrabold text-sm border shrink-0 ${w.iconBg}`}>
                      {w.id === "metamask" ? "🦊" : w.id === "coinbase" ? "🛡️" : w.id === "rabby" ? "🐰" : "🦁"}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-navy-950 dark:text-white group-hover:text-brand-600 dark:group-hover:text-brand-400 transition">
                          {w.name}
                        </span>
                        {w.badge && (
                          <span className="px-1.5 py-0.5 rounded-md text-[10px] font-extrabold bg-brand-50 dark:bg-brand-950 text-brand-600 dark:text-brand-400 border border-brand-200 dark:border-brand-800">
                            {w.badge}
                          </span>
                        )}
                        {installed && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 font-bold">
                            Ready
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-navy-500 dark:text-navy-400">{w.tagline}</p>
                    </div>
                  </div>

                  {/* Status Indicator */}
                  <div>
                    {isSelected && isConnecting ? (
                      <RefreshCw className="w-5 h-5 text-brand-500 animate-spin" />
                    ) : installed ? (
                      <button
                        onClick={() => handleConnect(w.id)}
                        className="inline-flex items-center gap-1 text-[11px] font-bold text-white px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 transition shadow-xs cursor-pointer"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Connect
                      </button>
                    ) : (
                      <a
                        href={w.installUrl}
                        target="_blank"
                        rel="noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="inline-flex items-center gap-1 text-[11px] font-bold text-navy-600 dark:text-navy-300 px-2.5 py-1 rounded-lg bg-navy-100 dark:bg-navy-800 hover:bg-brand-500 hover:text-white transition"
                      >
                        Install <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Tab 2: Mobile Scan / WalletConnect */}
        {activeTab === "mobile" && (
          <div className="p-6 text-center space-y-4 overflow-y-auto">
            <div className="relative mx-auto w-44 h-44 bg-white p-3 rounded-2xl border-2 border-dashed border-brand-400 dark:border-brand-600 shadow-sm flex flex-col items-center justify-center">
              <QrCode className="w-28 h-28 text-navy-900" />
              <div className="absolute inset-0 flex items-center justify-center bg-white/80 dark:bg-navy-950/80 rounded-2xl backdrop-blur-xs">
                <div className="text-center p-3">
                  <span className="w-3 h-3 rounded-full bg-emerald-500 animate-ping inline-block mb-1.5" />
                  <p className="text-xs font-bold text-navy-950 dark:text-white">Bridge Ready</p>
                  <p className="text-[10px] text-navy-500">Scan with your mobile wallet</p>
                </div>
              </div>
            </div>

            <div className="space-y-1.5 max-w-sm mx-auto text-left bg-navy-50 dark:bg-navy-950 p-3.5 rounded-2xl border border-navy-100 dark:border-navy-800 text-xs">
              <p className="font-bold text-navy-900 dark:text-white flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-brand-500" />
                How to connect mobile wallet:
              </p>
              <ol className="list-decimal list-inside space-y-1 text-[11px] text-navy-600 dark:text-navy-400 pl-1">
                <li>Open <strong>MetaMask Mobile</strong>, <strong>Trust Wallet</strong>, or <strong>Rainbow</strong>.</li>
                <li>Tap the <strong>Scan QR Code</strong> button at the top right.</li>
                <li>Approve the connection request on <strong>Ethereum Sepolia</strong>.</li>
              </ol>
            </div>

            <button
              onClick={() => handleConnect("metamask")}
              className="w-full py-2.5 px-4 text-xs font-bold rounded-xl bg-brand-600 hover:bg-brand-500 text-white shadow-md transition cursor-pointer"
            >
              Continue via Injected Browser Wallet
            </button>
          </div>
        )}

        {/* Footer Note */}
        <div className="px-6 py-3 bg-slate-50 dark:bg-navy-950/70 border-t border-navy-100 dark:border-navy-800 flex items-center justify-between text-[11px] text-navy-400 shrink-0">
          <span>Supported Network: Ethereum Sepolia</span>
          <span className="font-semibold text-brand-600 dark:text-brand-400">Chain ID: 11155111</span>
        </div>
      </div>
    </div>,
    document.body
  );
};
