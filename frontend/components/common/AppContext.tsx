"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

export type Theme = "light" | "dark";
export type UserRole = "PRODUCER" | "CONSUMER" | "ADMIN";
export type ActiveView = "landing" | "auth" | "dashboard" | "showroom";

export interface ToastMessage {
  id: string;
  type: "success" | "error" | "info" | "warning";
  title: string;
  description?: string;
  duration?: number;
}

interface AppContextType {
  theme: Theme;
  toggleTheme: () => void;
  role: UserRole;
  setRole: (role: UserRole) => void;
  activeView: ActiveView;
  setActiveView: (view: ActiveView) => void;
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  isWalletConnected: boolean;
  walletAddress: string;
  connectWallet: () => void;
  disconnectWallet: () => void;
  toasts: ToastMessage[];
  addToast: (toast: Omit<ToastMessage, "id">) => void;
  removeToast: (id: string) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>("light");
  const [role, setRole] = useState<UserRole>("PRODUCER");
  const [activeView, setActiveView] = useState<ActiveView>("landing");
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(false);
  const [isWalletConnected, setIsWalletConnected] = useState<boolean>(true);
  const [walletAddress, setWalletAddress] = useState<string>("0x70997970C51812dc3A010C7d01b50e0d17dc79C8");
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  useEffect(() => {
    // Check saved theme or system preference
    const savedTheme = localStorage.getItem("greenledger_theme") as Theme | null;
    if (savedTheme) {
      setTheme(savedTheme);
      if (savedTheme === "dark") {
        document.documentElement.classList.add("dark");
      } else {
        document.documentElement.classList.remove("dark");
      }
    } else if (window.matchMedia("(prefers-color-scheme: dark)").matches) {
      setTheme("dark");
      document.documentElement.classList.add("dark");
    }
  }, []);

  const toggleTheme = () => {
    const nextTheme: Theme = theme === "light" ? "dark" : "light";
    setTheme(nextTheme);
    localStorage.setItem("greenledger_theme", nextTheme);
    if (nextTheme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  };

  const connectWallet = () => {
    setIsWalletConnected(true);
    setWalletAddress("0x70997970C51812dc3A010C7d01b50e0d17dc79C8");
    addToast({
      type: "success",
      title: "Wallet Connected",
      description: "Connected to Ethereum Sepolia Testnet (0x7099...79C8)",
    });
  };

  const disconnectWallet = () => {
    setIsWalletConnected(false);
    setWalletAddress("");
    addToast({
      type: "info",
      title: "Wallet Disconnected",
      description: "You have disconnected your Ethereum wallet.",
    });
  };

  const addToast = (toast: Omit<ToastMessage, "id">) => {
    const id = Math.random().toString(36).substring(2, 9);
    const newToast: ToastMessage = { ...toast, id };
    setToasts((prev) => [...prev, newToast]);

    const duration = toast.duration || 4000;
    setTimeout(() => {
      removeToast(id);
    }, duration);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  return (
    <AppContext.Provider
      value={{
        theme,
        toggleTheme,
        role,
        setRole,
        activeView,
        setActiveView,
        sidebarOpen,
        setSidebarOpen,
        isWalletConnected,
        walletAddress,
        connectWallet,
        disconnectWallet,
        toasts,
        addToast,
        removeToast,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error("useApp must be used within an AppProvider");
  }
  return context;
}
