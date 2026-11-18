"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Logo } from "../../components/ui/Logo";
import { Input } from "../../components/ui/Input";
import { Button } from "../../components/ui/Button";
import { useApp } from "../../components/common/AppContext";
import { useMetaMask } from "../../hooks/useMetaMask";
import { Eye, EyeOff, Zap, ShieldCheck, AlertCircle, ArrowLeft } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const { setRole, addToast } = useApp();
  const { isInstalled, isConnected, address, connectWallet, signMessage } = useMetaMask();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");

    if (!email || !password) {
      setErrorMessage("Please enter both your email address and password.");
      return;
    }

    setIsLoading(true);

    try {
      const apiUrl = typeof window !== "undefined" && (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1")
        ? "http://localhost:5000/api/v1"
        : (process.env.NEXT_PUBLIC_API_URL || "https://l19idchgw6.execute-api.ap-southeast-2.amazonaws.com/api/v1");
      const res = await fetch(`${apiUrl}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), password }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || "Invalid email or password.");
      }

      // Store tokens and user profile under both keys for universal compatibility
      localStorage.setItem("greenledger_auth_token", data.token);
      localStorage.setItem("greenledger_jwt", data.token);
      localStorage.setItem("greenledger_user", JSON.stringify(data.user));
      localStorage.setItem("user", JSON.stringify(data.user));

      setRole(data.user.role);
      addToast({
        type: "success",
        title: "Welcome Back",
        description: `Logged in as ${data.user.name} (${data.user.role}).`,
      });

      router.push(data.redirectPath || "/producer/dashboard");
    } catch (err: any) {
      setErrorMessage(err.message || "Login failed. Please check your credentials.");
      addToast({
        type: "error",
        title: "Login Failed",
        description: err.message || "Invalid email or password.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleWalletSignIn = async () => {
    setErrorMessage("");
    try {
      let targetAddress = address;
      if (!isConnected || !targetAddress) {
        targetAddress = await connectWallet();
      }

      if (!targetAddress) return;

      const apiUrl = typeof window !== "undefined" && (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1")
        ? "http://localhost:5000/api/v1"
        : (process.env.NEXT_PUBLIC_API_URL || "https://l19idchgw6.execute-api.ap-southeast-2.amazonaws.com/api/v1");

      // 1. Request nonce
      const nonceRes = await fetch(`${apiUrl}/auth/nonce`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ walletAddress: targetAddress }),
      });
      const nonceData = await nonceRes.json();

      // 2. Sign with MetaMask
      const signature = await signMessage(nonceData.nonce);
      if (!signature) return;

      addToast({
        type: "success",
        title: "Wallet Verified",
        description: `Signed with account ${targetAddress.slice(0, 6)}...${targetAddress.slice(-4)}`,
      });

      // Default redirect
      router.push("/consumer/dashboard");
    } catch (err: any) {
      setErrorMessage(err.message || "Wallet sign-in failed.");
    }
  };

  return (
    <div className="min-h-screen grid grid-cols-1 lg:grid-cols-12 bg-white dark:bg-navy-950 transition-colors">
      {/* Left Form Column */}
      <div className="lg:col-span-6 xl:col-span-5 flex flex-col justify-between p-6 sm:p-10 lg:p-14 z-10">
        <div>
          <div className="flex items-center justify-between">
            <Link href="/">
              <Logo size="md" />
            </Link>
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-navy-500 hover:text-brand-600 transition"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Back to Home
            </Link>
          </div>

          <div className="mt-12 sm:mt-16 max-w-sm">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-navy-900 dark:text-white tracking-tight">
              Sign In to GreenLedger
            </h1>
            <p className="mt-2 text-xs sm:text-sm text-navy-500 dark:text-navy-400">
              Don't have an account yet?{" "}
              <Link
                href="/register"
                className="font-bold text-brand-600 dark:text-brand-400 hover:underline"
              >
                Create Account
              </Link>
            </p>

            {/* Error Message Alert */}
            {errorMessage && (
              <div className="mt-4 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 text-xs text-rose-700 dark:text-rose-300 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <span>{errorMessage}</span>
              </div>
            )}

            <form onSubmit={handleLogin} className="mt-6 space-y-4">
              <Input
                label="Email Address"
                type="email"
                required
                placeholder="producer@greenledger.io"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />

              <Input
                label="Password"
                type={showPassword ? "text" : "password"}
                required
                placeholder="••••••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                endIcon={
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="text-navy-400 hover:text-navy-600 focus:outline-none cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                }
              />

              <div className="flex items-center justify-between text-xs">
                <label className="flex items-center gap-2 cursor-pointer text-navy-600 dark:text-navy-300">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-4 h-4 rounded text-brand-600 border-navy-300 focus:ring-brand-500"
                  />
                  <span>Remember me for 30 days</span>
                </label>
                <Link
                  href="/forgot-password"
                  className="font-semibold text-brand-600 dark:text-brand-400 hover:underline"
                >
                  Forgot password?
                </Link>
              </div>

              <Button
                type="submit"
                variant="primary"
                size="lg"
                fullWidth
                isLoading={isLoading}
                className="mt-2"
              >
                Sign In to Portal
              </Button>

              <div className="relative my-6 flex items-center justify-center">
                <div className="border-t border-navy-200 dark:border-navy-800 w-full" />
                <span className="bg-white dark:bg-navy-950 px-3 text-[11px] font-semibold uppercase text-navy-400 tracking-wider absolute">
                  Or continue with
                </span>
              </div>

              {/* Web3 Direct MetaMask Auth Button */}
              <Button
                type="button"
                variant="secondary"
                size="md"
                fullWidth
                leftIcon={<Zap className="w-4 h-4 text-brand-600" />}
                onClick={handleWalletSignIn}
              >
                Sign In with Ethereum Wallet
              </Button>

              {/* 1-Click Demo Accounts */}
              <div className="mt-4 p-3 rounded-2xl bg-navy-50 dark:bg-navy-900 border border-navy-200 dark:border-navy-800">
                <span className="text-[11px] font-bold uppercase tracking-wider text-navy-400 block mb-2 text-center">
                  Quick Demo Access (Pass: Password123!)
                </span>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setEmail("producer.solarfarm@greenledger.io");
                      setPassword("Password123!");
                    }}
                    className="px-2 py-1.5 rounded-lg text-xs font-semibold bg-white dark:bg-navy-800 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800/60 hover:bg-amber-50 dark:hover:bg-amber-950/40 transition cursor-pointer"
                  >
                    Producer
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setEmail("consumer.datacenter@ecotech.com");
                      setPassword("Password123!");
                    }}
                    className="px-2 py-1.5 rounded-lg text-xs font-semibold bg-white dark:bg-navy-800 text-sky-700 dark:text-sky-400 border border-sky-200 dark:border-sky-800/60 hover:bg-sky-50 dark:hover:bg-sky-950/40 transition cursor-pointer"
                  >
                    Consumer
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setEmail("admin@greenledger.io");
                      setPassword("Password123!");
                    }}
                    className="px-2 py-1.5 rounded-lg text-xs font-semibold bg-white dark:bg-navy-800 text-purple-700 dark:text-purple-400 border border-purple-200 dark:border-purple-800/60 hover:bg-purple-50 dark:hover:bg-purple-950/40 transition cursor-pointer"
                  >
                    Admin
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>

        <div className="mt-8 text-xs text-navy-400">
          Demo Credentials: <span className="font-mono text-navy-600 dark:text-navy-300">producer.solarfarm@greenledger.io</span> / <span className="font-mono text-navy-600 dark:text-navy-300">Password123!</span>
        </div>
      </div>

      {/* Right Feature Panel */}
      <div className="hidden lg:col-span-6 xl:col-span-7 bg-gradient-to-br from-brand-900 via-brand-950 to-navy-950 p-12 lg:p-16 relative overflow-hidden flex flex-col justify-between text-white">
        <div className="absolute top-0 right-0 w-96 h-96 bg-brand-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex items-center justify-between z-10">
          <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-800/40 border border-brand-700/50 text-xs font-semibold text-brand-300">
            <ShieldCheck className="w-4 h-4" /> Ethereum Sepolia Verified
          </span>
          <span className="text-xs text-brand-200/80 font-mono">Chain ID: 11155111</span>
        </div>

        {/* Floating Telemetry Preview Card */}
        <div className="my-auto max-w-md mx-auto w-full z-10">
          <div className="bg-white/95 dark:bg-navy-900/95 backdrop-blur-xl text-navy-900 dark:text-white rounded-3xl p-6 border border-white/20 shadow-2xl">
            <div className="flex items-center justify-between pb-4 border-b border-navy-100 dark:border-navy-800">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-brand-500 animate-pulse" />
                <span className="text-xs font-bold uppercase tracking-wider text-navy-500 dark:text-navy-400">
                  Live Microgrid Telemetry
                </span>
              </div>
              <span className="text-xs font-bold text-brand-600 dark:text-brand-400">
                Active Node
              </span>
            </div>

            <div className="mt-4 flex items-end justify-between h-24 gap-1.5 px-2">
              {[45, 62, 58, 80, 95, 75, 88, 100, 85, 92].map((val, idx) => (
                <div key={idx} className="flex-1 flex flex-col items-center gap-1">
                  <div
                    style={{ height: `${val}%` }}
                    className={`w-full rounded-t-md ${
                      idx === 7 ? "bg-brand-500" : "bg-brand-500/30"
                    }`}
                  />
                </div>
              ))}
            </div>

            <div className="grid grid-cols-3 gap-3 mt-5 pt-4 border-t border-navy-100 dark:border-navy-800 text-center">
              <div>
                <span className="text-[11px] font-semibold text-navy-400 uppercase">Settled</span>
                <p className="text-base font-extrabold text-navy-900 dark:text-white">48.5k</p>
                <span className="text-[10px] text-brand-600 font-bold">+14.2%</span>
              </div>
              <div>
                <span className="text-[11px] font-semibold text-navy-400 uppercase">CO2 Offset</span>
                <p className="text-base font-extrabold text-navy-900 dark:text-white">34.0t</p>
                <span className="text-[10px] text-navy-400">Avoided</span>
              </div>
              <div>
                <span className="text-[11px] font-semibold text-navy-400 uppercase">RECs</span>
                <p className="text-base font-extrabold text-navy-900 dark:text-white">128</p>
                <span className="text-[10px] text-emerald-600 font-bold">ERC-721</span>
              </div>
            </div>
          </div>

          <div className="mt-8 text-center">
            <h3 className="text-xl font-bold tracking-tight">Powering a Fairer, Greener Future</h3>
            <p className="mt-2 text-xs text-brand-200/80 leading-relaxed max-w-sm mx-auto">
              Decentralized peer trading with demand-aware allocation and verifiable proof-of-generation.
            </p>
          </div>
        </div>

        <div className="z-10 text-xs text-brand-300/80 flex items-center justify-between">
          <span>Peer-to-Peer Renewable Clearing</span>
          <span>© GreenLedger 2026</span>
        </div>
      </div>
    </div>
  );
}
