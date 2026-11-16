"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Logo } from "../../components/ui/Logo";
import { Input } from "../../components/ui/Input";
import { Button } from "../../components/ui/Button";
import { ArrowLeft, CheckCircle2, Mail, AlertCircle } from "lucide-react";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");

    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setErrorMessage("Please enter a valid email address.");
      return;
    }

    setIsLoading(true);

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api/v1";
      const res = await fetch(`${apiUrl}/auth/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim().toLowerCase() }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Request failed.");
      }

      setIsSubmitted(true);
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to submit request.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 sm:p-6 bg-slate-50 dark:bg-navy-950 transition-colors">
      <div className="w-full max-w-md bg-white dark:bg-navy-900 rounded-3xl border border-navy-200 dark:border-navy-800 shadow-2xl p-6 sm:p-10">
        <div className="flex items-center justify-between pb-6 border-b border-navy-100 dark:border-navy-800">
          <Link href="/">
            <Logo size="md" />
          </Link>
          <Link
            href="/login"
            className="inline-flex items-center gap-1 text-xs font-semibold text-navy-500 hover:text-brand-600 transition"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Sign In
          </Link>
        </div>

        {isSubmitted ? (
          <div className="pt-8 text-center space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-brand-50 dark:bg-brand-950/60 text-brand-600 border border-brand-200 dark:border-brand-800 mx-auto flex items-center justify-center">
              <CheckCircle2 className="w-6 h-6" />
            </div>

            <h2 className="text-xl font-bold text-navy-900 dark:text-white tracking-tight">
              Check Your Inbox
            </h2>

            <p className="text-xs sm:text-sm text-navy-500 dark:text-navy-400 leading-relaxed">
              If an account is associated with <span className="font-semibold text-navy-800 dark:text-navy-200">{email}</span>, we have dispatched secure password reset instructions.
            </p>

            <div className="pt-4">
              <Link href="/login">
                <Button variant="primary" size="md" fullWidth>
                  Return to Sign In
                </Button>
              </Link>
            </div>
          </div>
        ) : (
          <div className="pt-8 space-y-4">
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-navy-900 dark:text-white tracking-tight">
                Reset Your Password
              </h2>
              <p className="mt-1 text-xs sm:text-sm text-navy-500 dark:text-navy-400">
                Enter your registered email address and we will send you instructions to reset your account password.
              </p>
            </div>

            {errorMessage && (
              <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 text-xs text-rose-700 dark:text-rose-300 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <span>{errorMessage}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4 pt-2">
              <Input
                label="Email Address"
                type="email"
                required
                placeholder="name@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                startIcon={<Mail className="w-4 h-4" />}
              />

              <Button
                type="submit"
                variant="primary"
                size="lg"
                fullWidth
                isLoading={isLoading}
              >
                Send Reset Instructions
              </Button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
