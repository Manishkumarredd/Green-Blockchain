"use client";

import React, { useState } from "react";
import { Logo } from "../ui/Logo";
import { Input } from "../ui/Input";
import { Button } from "../ui/Button";
import { useApp } from "../common/AppContext";
import { Eye, EyeOff, ArrowRight, ShieldCheck, Zap, TrendingUp, CheckCircle2 } from "lucide-react";

export const AuthLayout: React.FC = () => {
  const { setActiveView, addToast, theme, toggleTheme } = useApp();
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [selectedRole, setSelectedRole] = useState<"PRODUCER" | "CONSUMER">("CONSUMER");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      addToast({
        type: "success",
        title: isSignUp ? "Account Created" : "Welcome Back",
        description: `Signed in as ${selectedRole.toLowerCase()} participant.`,
      });
      setActiveView("dashboard");
    }, 800);
  };

  return (
    <div className="min-h-screen grid grid-cols-1 lg:grid-cols-12 bg-white dark:bg-navy-950 transition-colors">
      {/* Left Form Area (5 or 6 cols) */}
      <div className="lg:col-span-6 xl:col-span-5 flex flex-col justify-between p-6 sm:p-10 lg:p-14 z-10">
        <div>
          <div className="flex items-center justify-between">
            <Logo size="md" />
            <button
              onClick={() => setActiveView("landing")}
              className="text-xs font-semibold text-navy-500 hover:text-brand-600 transition"
            >
              ← Back to Home
            </button>
          </div>

          <div className="mt-12 sm:mt-16 max-w-sm">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-navy-900 dark:text-white tracking-tight">
              {isSignUp ? "Create an Account" : "Sign In"}
            </h1>
            <p className="mt-2 text-xs sm:text-sm text-navy-500 dark:text-navy-400">
              {isSignUp ? "Already have an account?" : "Don't have an account yet?"}{" "}
              <button
                type="button"
                onClick={() => setIsSignUp(!isSignUp)}
                className="font-bold text-brand-600 dark:text-brand-400 hover:underline cursor-pointer"
              >
                {isSignUp ? "Sign In" : "Sign Up"}
              </button>
            </p>

            {/* Portal Role Selection during signup */}
            {isSignUp && (
              <div className="mt-6 p-1 bg-navy-100 dark:bg-navy-800 rounded-xl grid grid-cols-2 gap-1">
                <button
                  type="button"
                  onClick={() => setSelectedRole("CONSUMER")}
                  className={`py-2 text-xs font-bold rounded-lg transition ${
                    selectedRole === "CONSUMER"
                      ? "bg-white dark:bg-navy-900 text-brand-600 dark:text-brand-400 shadow-sm"
                      : "text-navy-500 hover:text-navy-900 dark:hover:text-white"
                  }`}
                >
                  Clean Consumer
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedRole("PRODUCER")}
                  className={`py-2 text-xs font-bold rounded-lg transition ${
                    selectedRole === "PRODUCER"
                      ? "bg-white dark:bg-navy-900 text-brand-600 dark:text-brand-400 shadow-sm"
                      : "text-navy-500 hover:text-navy-900 dark:hover:text-white"
                  }`}
                >
                  Microgrid Producer
                </button>
              </div>
            )}

            <form onSubmit={handleSubmit} className="mt-8 space-y-4">
              <Input
                label="Email Address"
                type="email"
                required
                placeholder="name@company.com"
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
                    className="text-navy-400 hover:text-navy-600 focus:outline-none"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                }
              />

              <div className="flex items-center justify-between text-xs">
                <label className="flex items-center gap-2 cursor-pointer text-navy-600 dark:text-navy-300">
                  <input
                    type="checkbox"
                    className="w-4 h-4 rounded text-brand-600 border-navy-300 focus:ring-brand-500"
                    defaultChecked
                  />
                  <span>Remember me for 30 days</span>
                </label>
                <a href="#forgot" className="font-semibold text-brand-600 dark:text-brand-400 hover:underline">
                  Forgot password?
                </a>
              </div>

              <Button
                type="submit"
                variant="primary"
                size="lg"
                fullWidth
                isLoading={isLoading}
                className="mt-2"
              >
                {isSignUp ? "Create GreenLedger Account" : "Sign In to Portal"}
              </Button>

              <div className="relative my-6 flex items-center justify-center">
                <div className="border-t border-navy-200 dark:border-navy-800 w-full" />
                <span className="bg-white dark:bg-navy-950 px-3 text-[11px] font-semibold uppercase text-navy-400 tracking-wider absolute">
                  Or continue with
                </span>
              </div>

              {/* Web3 Direct Wallet Auth Button */}
              <Button
                type="button"
                variant="secondary"
                size="md"
                fullWidth
                leftIcon={<Zap className="w-4 h-4 text-brand-600" />}
                onClick={() => {
                  addToast({ type: "success", title: "Web3 Authenticated", description: "Connected with MetaMask (Sepolia)" });
                  setActiveView("dashboard");
                }}
              >
                Sign In with Ethereum Wallet
              </Button>
            </form>
          </div>
        </div>

        <div className="mt-8 text-xs text-navy-400">
          By signing in, you agree to GreenLedger's{" "}
          <a href="#terms" className="underline hover:text-navy-600">Terms of Service</a> and{" "}
          <a href="#privacy" className="underline hover:text-navy-600">Privacy Policy</a>.
        </div>
      </div>

      {/* Right Feature Panel (Deep Forest Green with Floating Card, matching reference image!) */}
      <div className="hidden lg:col-span-6 xl:col-span-7 bg-gradient-to-br from-brand-900 via-brand-950 to-navy-950 p-12 lg:p-16 relative overflow-hidden flex flex-col justify-between text-white">
        {/* Background glow and decorative circles */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-brand-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Top Tagline */}
        <div className="flex items-center justify-between z-10">
          <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-800/40 border border-brand-700/50 text-xs font-semibold text-brand-300">
            <ShieldCheck className="w-4 h-4" /> Ethereum Sepolia Verified
          </span>
          <span className="text-xs text-brand-200/80 font-mono">v1.0.0 Release</span>
        </div>

        {/* Floating Fintech Preview Card (Directly inspired by rightmost image in user reference!) */}
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

            {/* Simulated mini chart curve */}
            <div className="mt-4 flex items-end justify-between h-24 gap-1.5 px-2">
              {[45, 62, 58, 80, 95, 75, 88, 100, 85, 92].map((val, idx) => (
                <div key={idx} className="flex-1 flex flex-col items-center gap-1 group">
                  <div
                    style={{ height: `${val}%` }}
                    className={`w-full rounded-t-md transition-all ${
                      idx === 7 ? "bg-brand-500" : "bg-brand-500/30 group-hover:bg-brand-500/60"
                    }`}
                  />
                </div>
              ))}
            </div>

            {/* Microgrid Stats */}
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

        {/* Bottom micro quote */}
        <div className="z-10 text-xs text-brand-300/80 flex items-center justify-between">
          <span>Peer-to-Peer Renewable Clearing</span>
          <span>© GreenLedger 2026</span>
        </div>
      </div>
    </div>
  );
};
