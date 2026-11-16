"use client";

import React, { useState, useRef, useEffect } from "react";
import { Wallet, Copy, ExternalLink, LogOut, Check } from "lucide-react";
import { useApp } from "../common/AppContext";
import { Button } from "./Button";

export const WalletButton: React.FC = () => {
  const { isWalletConnected, walletAddress, connectWallet, disconnectWallet, addToast } = useApp();
  const [isOpen, setIsOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleCopy = () => {
    if (walletAddress) {
      navigator.clipboard.writeText(walletAddress);
      setCopied(true);
      addToast({ type: "success", title: "Address Copied", description: walletAddress });
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (!isWalletConnected) {
    return (
      <Button
        variant="primary"
        size="sm"
        leftIcon={<Wallet className="w-4 h-4" />}
        onClick={connectWallet}
      >
        Connect Wallet
      </Button>
    );
  }

  const truncated = `${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}`;

  return (
    <div ref={popoverRef} className="relative inline-block">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold bg-white dark:bg-navy-800 text-navy-800 dark:text-navy-100 border border-navy-200 dark:border-navy-700 shadow-sm hover:border-brand-500 transition cursor-pointer"
      >
        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse flex-shrink-0" />
        <span className="font-mono">{truncated}</span>
        <span className="hidden md:inline px-1.5 py-0.5 rounded-md bg-navy-100 dark:bg-navy-700 text-[10px] text-navy-500 dark:text-navy-300 font-bold">
          2.45 ETH
        </span>
      </button>

      {/* Wallet Details Popover */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-72 bg-white dark:bg-navy-900 rounded-2xl border border-navy-200 dark:border-navy-800 shadow-2xl p-4 z-40 animate-in fade-in zoom-in-95 duration-150">
          <div className="flex items-center justify-between pb-3 border-b border-navy-100 dark:border-navy-800">
            <span className="text-xs font-bold uppercase tracking-wider text-navy-400">
              Connected Account
            </span>
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Sepolia
            </span>
          </div>

          <div className="mt-3 p-3 rounded-xl bg-navy-50 dark:bg-navy-950/60 border border-navy-100 dark:border-navy-800/80">
            <span className="text-[10px] font-bold uppercase text-navy-400">Address</span>
            <div className="flex items-center justify-between mt-1">
              <span className="text-xs font-mono text-navy-800 dark:text-navy-200 truncate mr-2">
                {walletAddress}
              </span>
              <button
                onClick={handleCopy}
                className="text-navy-400 hover:text-navy-600 dark:hover:text-navy-200 transition"
                title="Copy Address"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-brand-600" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>

          <div className="mt-2.5 flex items-center justify-between text-xs px-1">
            <span className="text-navy-500 dark:text-navy-400 font-medium">Testnet Balance</span>
            <span className="font-bold text-navy-900 dark:text-white">2.4500 ETH</span>
          </div>

          <div className="mt-4 pt-3 border-t border-navy-100 dark:border-navy-800 flex items-center justify-between gap-2">
            <a
              href={`https://sepolia.etherscan.io/address/${walletAddress}`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 text-xs text-navy-500 hover:text-navy-800 dark:hover:text-navy-200 transition font-medium"
            >
              <span>Etherscan</span>
              <ExternalLink className="w-3 h-3" />
            </a>

            <button
              onClick={() => {
                disconnectWallet();
                setIsOpen(false);
              }}
              className="inline-flex items-center gap-1 text-xs font-semibold text-rose-600 dark:text-rose-400 hover:underline cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Disconnect</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
