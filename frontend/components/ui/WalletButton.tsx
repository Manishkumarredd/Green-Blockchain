"use client";

import React, { useState, useRef, useEffect } from "react";
import { Wallet, Copy, ExternalLink, LogOut, Check, AlertTriangle, RefreshCw } from "lucide-react";
import { useApp } from "../common/AppContext";
import { useMetaMask } from "../../hooks/useMetaMask";
import { Button } from "./Button";

export const WalletButton: React.FC = () => {
  const { addToast } = useApp();
  const {
    isInstalled,
    isConnected,
    address,
    isSepolia,
    isConnecting,
    connectWallet,
    disconnectWallet,
    switchToSepolia,
  } = useMetaMask();

  const [isOpen, setIsOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [switchingNetwork, setSwitchingNetwork] = useState(false);
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
    if (address) {
      navigator.clipboard.writeText(address);
      setCopied(true);
      addToast({ type: "success", title: "Address Copied", description: address });
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleConnect = async () => {
    if (!isInstalled) {
      addToast({
        type: "warning",
        title: "MetaMask Not Found",
        description: "Please install the MetaMask browser extension to connect your Web3 wallet.",
      });
      window.open("https://metamask.io/download/", "_blank");
      return;
    }
    const connectedAddress = await connectWallet();
    if (connectedAddress) {
      addToast({
        type: "success",
        title: "Wallet Connected",
        description: `Connected: ${connectedAddress.slice(0, 6)}...${connectedAddress.slice(-4)}`,
      });
    }
  };

  const handleSwitchNetwork = async () => {
    try {
      setSwitchingNetwork(true);
      const success = await switchToSepolia();
      if (success) {
        addToast({
          type: "success",
          title: "Switched to Sepolia",
          description: "Connected to Ethereum Sepolia Testnet.",
        });
      } else {
        addToast({
          type: "error",
          title: "Network Switch Failed",
          description: "Please manually switch to Sepolia Testnet in your MetaMask extension.",
        });
      }
    } finally {
      setSwitchingNetwork(false);
    }
  };

  if (!isConnected || !address) {
    return (
      <Button
        variant="primary"
        size="sm"
        leftIcon={<Wallet className="w-4 h-4" />}
        isLoading={isConnecting}
        onClick={handleConnect}
      >
        Connect Wallet
      </Button>
    );
  }

  const truncated = `${address.slice(0, 6)}...${address.slice(-4)}`;

  return (
    <div ref={popoverRef} className="relative inline-block">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold bg-white dark:bg-navy-800 border shadow-sm transition cursor-pointer ${
          isSepolia
            ? "text-navy-800 dark:text-navy-100 border-navy-200 dark:border-navy-700 hover:border-brand-500"
            : "text-amber-700 dark:text-amber-400 border-amber-300 dark:border-amber-700 hover:border-amber-500"
        }`}
      >
        <span
          className={`w-2 h-2 rounded-full animate-pulse flex-shrink-0 ${
            isSepolia ? "bg-emerald-500" : "bg-amber-500"
          }`}
        />
        <span className="font-mono">{truncated}</span>
        <span
          className={`hidden md:inline px-1.5 py-0.5 rounded-md text-[10px] font-bold ${
            isSepolia
              ? "bg-navy-100 dark:bg-navy-700 text-navy-500 dark:text-navy-300"
              : "bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400"
          }`}
        >
          {isSepolia ? "Sepolia" : "Wrong Network"}
        </span>
      </button>

      {/* Wallet Details Popover */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-navy-900 rounded-2xl border border-navy-200 dark:border-navy-800 shadow-2xl p-4 z-40 animate-in fade-in zoom-in-95 duration-150">
          <div className="flex items-center justify-between pb-3 border-b border-navy-100 dark:border-navy-800">
            <span className="text-xs font-bold uppercase tracking-wider text-navy-400">
              Web3 Account
            </span>
            <span
              className={`inline-flex items-center gap-1 text-[11px] font-semibold ${
                isSepolia
                  ? "text-emerald-600 dark:text-emerald-400"
                  : "text-amber-600 dark:text-amber-400"
              }`}
            >
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  isSepolia ? "bg-emerald-500" : "bg-amber-500"
                }`}
              />
              {isSepolia ? "Sepolia Active" : "Unsupported Network"}
            </span>
          </div>

          {!isSepolia && (
            <div className="mt-3 p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5 text-xs text-amber-800 dark:text-amber-300">
                <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                <span>Switch to Sepolia (Chain 11155111)</span>
              </div>
              <button
                onClick={handleSwitchNetwork}
                disabled={switchingNetwork}
                className="px-2 py-1 bg-amber-600 hover:bg-amber-700 text-white text-[11px] font-bold rounded-lg transition cursor-pointer flex items-center gap-1"
              >
                {switchingNetwork ? <RefreshCw className="w-3 h-3 animate-spin" /> : "Switch"}
              </button>
            </div>
          )}

          <div className="mt-3 p-3 rounded-xl bg-navy-50 dark:bg-navy-950/60 border border-navy-100 dark:border-navy-800/80">
            <span className="text-[10px] font-bold uppercase text-navy-400">Wallet Address</span>
            <div className="flex items-center justify-between mt-1">
              <span className="text-xs font-mono text-navy-800 dark:text-navy-200 truncate mr-2">
                {address}
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

          <div className="mt-4 pt-3 border-t border-navy-100 dark:border-navy-800 flex items-center justify-between gap-2">
            <a
              href={`https://sepolia.etherscan.io/address/${address}`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 text-xs text-navy-500 hover:text-navy-800 dark:hover:text-navy-200 transition font-medium"
            >
              <span>View on Etherscan</span>
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
