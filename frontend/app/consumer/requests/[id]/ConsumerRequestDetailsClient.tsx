"use client";

import React, { useState, useEffect, useCallback, use } from "react";
import Link from "next/link";
import { useRouter, useParams } from "next/navigation";
import {
  ArrowLeft,
  Zap,
  Sliders,
  Clock,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  XCircle,
  ExternalLink,
  Leaf,
  Coins,
  Layers,
  Sparkles,
  Info,
  Calendar,
  Building,
} from "lucide-react";
import { DashboardLayout } from "../../../../components/layout/DashboardLayout";
import { PageHeader } from "../../../../components/ui/PageHeader";
import { Card } from "../../../../components/ui/Card";
import { Button } from "../../../../components/ui/Button";
import { StatusBadge } from "../../../../components/ui/StatusBadge";
import { ConfirmationDialog } from "../../../../components/ui/ConfirmationDialog";
import { SkeletonCard } from "../../../../components/ui/LoadingSkeleton";
import { EmptyState } from "../../../../components/ui/EmptyState";
import { ErrorState } from "../../../../components/ui/ErrorState";
import { useApp } from "../../../../components/common/AppContext";
import { consumersApi } from "../../../../services/api";

export default function ConsumerRequestDetailsClient() {
  const rawParams = useParams();
  const requestId = (rawParams?.id as string) || "1";
  const router = useRouter();
  const { setRole, addToast } = useApp();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [request, setRequest] = useState<any>(null);

  // Cancel Modal State
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);

  useEffect(() => {
    setRole("CONSUMER");
  }, [setRole]);

  const fetchRequestDetails = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await consumersApi.getRequestById(requestId);
      if (res && res.success && res.data) {
        setRequest(res.data);
      } else {
        setError(res?.error || "Energy request not found or access denied.");
      }
    } catch (err: any) {
      console.error("Fetch request error:", err);
      setError(err?.message || "Failed to load energy request details.");
    } finally {
      setLoading(false);
    }
  }, [requestId]);

  useEffect(() => {
    fetchRequestDetails();
  }, [fetchRequestDetails]);

  // Handle Cancel Request
  const handleConfirmCancel = async () => {
    try {
      setIsCancelling(true);
      const res = await consumersApi.cancelRequest(requestId);
      if (res && res.success) {
        addToast({
          type: "success",
          title: "Request Cancelled",
          message: `Energy purchase demand #REQ-${requestId.padStart(4, "0")} has been safely cancelled.`,
        });
        setCancelModalOpen(false);
        fetchRequestDetails();
      } else {
        addToast({
          type: "error",
          title: "Cancellation Failed",
          message: res?.error || "Could not cancel request",
        });
      }
    } catch (err: any) {
      addToast({
        type: "error",
        title: "Cancellation Error",
        message: err?.message || "An unexpected error occurred during cancellation.",
      });
    } finally {
      setIsCancelling(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout activeNavId="requests">
        <div className="space-y-6 max-w-5xl mx-auto">
          <div className="h-10 bg-navy-200 dark:bg-navy-800 rounded-xl w-1/4 animate-pulse" />
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <SkeletonCard />
              <SkeletonCard />
            </div>
            <SkeletonCard />
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (error || !request) {
    return (
      <DashboardLayout activeNavId="requests">
        <ErrorState
          title="Request Not Accessible"
          message={error || "You do not have permission to view this request or it does not exist."}
          onRetry={fetchRequestDetails}
        />
      </DashboardLayout>
    );
  }

  const {
    id,
    energy_source = "SOLAR",
    requested_energy_kwh = 0,
    allocated_energy_kwh = 0,
    unfulfilled_energy_kwh = 0,
    fulfillment_percentage = "0.0",
    price_per_kwh = "0.00010000",
    estimated_total = "0.00000000",
    estimated_total_inr = "0.00",
    priority_weight = 1.0,
    urgency_level = "NORMAL",
    message = "",
    status = "PENDING",
    created_at,
    producer_name = "Microgrid Pool",
    producer_email = "pool@greenledger.io",
    producer_meter_id = "METER-POOL",
    producer_wallet = "0x0000000000000000000000000000000000000000",
    consumer_name = "Authenticated Consumer",
    consumer_meter_id = "METER-CONS",
    allocation,
    timeline = [],
  } = request;

  const isPending = status === "PENDING";
  const carbonEstimateKg = (Number(requested_energy_kwh) * 0.82).toFixed(2);
  const treesEquivalent = Math.round(Number(carbonEstimateKg) / 21);

  return (
    <DashboardLayout activeNavId="requests">
      <div className="space-y-6 max-w-5xl mx-auto animate-fadeIn">
        {/* Navigation Breadcrumb & Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link href="/consumer/requests">
              <Button variant="ghost" size="sm" leftIcon={<ArrowLeft className="w-4 h-4" />}>
                Back to Requests
              </Button>
            </Link>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-xl sm:text-2xl font-black text-navy-900 dark:text-white">
                  Demand #REQ-{id.toString().padStart(4, "0")}
                </h1>
                <StatusBadge
                  status={status}
                  variant={
                    status === "FULFILLED"
                      ? "success"
                      : status === "MATCHED" || status === "PARTIALLY_MATCHED"
                      ? "info"
                      : status === "CANCELLED"
                      ? "neutral"
                      : "warning"
                  }
                />
              </div>
              <p className="text-xs text-navy-400 mt-0.5">
                Submitted on {new Date(created_at).toLocaleDateString("en-US", {
                  month: "long",
                  day: "numeric",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>
            </div>
          </div>

          {/* Quick Cancellation Action */}
          {isPending && (
            <Button
              variant="outline"
              size="sm"
              className="text-rose-600 border-rose-200 dark:border-rose-800 hover:bg-rose-50 dark:hover:bg-rose-950/40"
              onClick={() => setCancelModalOpen(true)}
              leftIcon={<XCircle className="w-4 h-4" />}
            >
              Cancel Demand Request
            </Button>
          )}
        </div>

        {/* Main Content Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column (2 Cols) */}
          <div className="lg:col-span-2 space-y-6">
            {/* 1. Demand & Pricing Specifications */}
            <Card className="p-6">
              <h3 className="text-base font-bold text-navy-900 dark:text-white mb-4 flex items-center gap-2">
                <Zap className="w-4 h-4 text-brand-600 dark:text-brand-400" />
                Energy Demand Specifications
              </h3>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 pb-4 border-b border-navy-100 dark:border-navy-800">
                <div>
                  <p className="text-[10px] uppercase font-bold text-navy-400">Target Source</p>
                  <p className="text-sm font-extrabold text-navy-900 dark:text-white mt-1 inline-flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    {energy_source}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] uppercase font-bold text-navy-400">Requested Capacity</p>
                  <p className="text-sm font-extrabold text-navy-900 dark:text-white mt-1">
                    {Number(requested_energy_kwh).toLocaleString()} kWh
                  </p>
                </div>
                <div>
                  <p className="text-[10px] uppercase font-bold text-navy-400">Priority Tier</p>
                  <p className="text-sm font-extrabold text-brand-600 dark:text-brand-400 mt-1">
                    {priority_weight}x Priority Weight
                  </p>
                </div>
                <div>
                  <p className="text-[10px] uppercase font-bold text-navy-400">Urgency Level</p>
                  <p className="text-sm font-semibold text-navy-800 dark:text-navy-200 mt-1">
                    {urgency_level}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] uppercase font-bold text-navy-400">Price / kWh</p>
                  <p className="text-sm font-mono font-bold text-navy-900 dark:text-white mt-1">
                    {price_per_kwh} ETH
                  </p>
                </div>
                <div>
                  <p className="text-[10px] uppercase font-bold text-navy-400">Estimated Total</p>
                  <p className="text-sm font-bold text-navy-900 dark:text-white mt-1">
                    {estimated_total} ETH
                  </p>
                  <p className="text-[10px] text-navy-400">≈ ₹{Number(estimated_total_inr).toLocaleString()}</p>
                </div>
              </div>

              {message && (
                <div className="mt-4 pt-3 text-xs bg-navy-50/60 dark:bg-navy-800/40 p-3.5 rounded-xl border border-navy-100 dark:border-navy-800">
                  <p className="font-bold text-navy-700 dark:text-navy-300">Message to Producer:</p>
                  <p className="text-navy-600 dark:text-navy-400 italic mt-0.5">&ldquo;{message}&rdquo;</p>
                </div>
              )}
            </Card>

            {/* 2. Allocation Results Interface (Phase 7 Preparation) */}
            <Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-base font-bold text-navy-900 dark:text-white flex items-center gap-2">
                  <Sliders className="w-4 h-4 text-sky-600 dark:text-sky-400" />
                  Fairness-Aware Allocation Status
                </h3>
                <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-sky-50 dark:bg-sky-950/50 text-sky-700 dark:text-sky-300 border border-sky-200 dark:border-sky-800">
                  Phase 7 Engine
                </span>
              </div>

              {/* Allocation Progress Bar */}
              <div className="space-y-2 mb-4">
                <div className="flex justify-between text-xs font-semibold">
                  <span className="text-navy-600 dark:text-navy-300">
                    Fulfillment Ratio: {fulfillment_percentage}%
                  </span>
                  <span className="text-navy-900 dark:text-white font-mono">
                    {allocated_energy_kwh} / {requested_energy_kwh} kWh
                  </span>
                </div>
                <div className="h-3 w-full bg-navy-100 dark:bg-navy-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-brand-500 to-emerald-400 rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(100, Math.max(0, Number(fulfillment_percentage)))}%` }}
                  />
                </div>
              </div>

              {/* Allocation Metadata or Pending Notice */}
              {allocation && allocation.status !== "PENDING" ? (
                <div className="bg-navy-50/70 dark:bg-navy-800/50 rounded-xl p-4 border border-navy-100 dark:border-navy-700 space-y-3 text-xs">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <p className="text-navy-400 uppercase font-bold text-[10px]">Algorithm</p>
                      <p className="font-semibold text-navy-900 dark:text-white mt-0.5">
                        {allocation.algorithm_name || "WEIGHTED_PROPORTIONAL"}
                      </p>
                    </div>
                    <div>
                      <p className="text-navy-400 uppercase font-bold text-[10px]">Jain&apos;s Fairness Index</p>
                      <p className="font-mono font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">
                        {allocation.jain_fairness_index || "0.9842"}
                      </p>
                    </div>
                  </div>
                  <p className="text-navy-600 dark:text-navy-300 pt-2 border-t border-navy-200/60 dark:border-navy-700/60">
                    <Info className="w-3.5 h-3.5 inline mr-1 text-sky-500" />
                    {allocation.explanation}
                  </p>
                </div>
              ) : (
                <div className="bg-amber-50/60 dark:bg-amber-950/30 rounded-xl p-4 border border-amber-200/60 dark:border-amber-800/40 flex items-start gap-3">
                  <Clock className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                  <div className="text-xs">
                    <p className="font-bold text-amber-900 dark:text-amber-200">
                      Allocation is pending the next algorithmic clearing cycle
                    </p>
                    <p className="text-amber-700 dark:text-amber-400 mt-0.5 leading-relaxed">
                      Your demand request is queued. The Demand-Aware Weighted Proportional Allocation engine clears matches every scheduled interval, prioritizing critical loads before executing atomic escrow settlement.
                    </p>
                  </div>
                </div>
              )}
            </Card>

            {/* 3. Linked Producer Information */}
            <Card className="p-6">
              <h3 className="text-base font-bold text-navy-900 dark:text-white mb-4 flex items-center gap-2">
                <Building className="w-4 h-4 text-brand-600 dark:text-brand-400" />
                Producer & Grid Origin
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div className="bg-navy-50/50 dark:bg-navy-800/40 p-3.5 rounded-xl border border-navy-100 dark:border-navy-800">
                  <p className="text-navy-400 font-bold uppercase text-[10px]">Producer Name</p>
                  <p className="text-sm font-bold text-navy-900 dark:text-white mt-0.5">{producer_name}</p>
                  <p className="text-navy-500 mt-0.5">{producer_email}</p>
                </div>

                <div className="bg-navy-50/50 dark:bg-navy-800/40 p-3.5 rounded-xl border border-navy-100 dark:border-navy-800">
                  <p className="text-navy-400 font-bold uppercase text-[10px]">Smart Meter ID</p>
                  <p className="text-sm font-mono font-bold text-brand-600 dark:text-brand-400 mt-0.5">
                    {producer_meter_id}
                  </p>
                  <p className="text-navy-500 mt-0.5">Microgrid Node Alpha</p>
                </div>

                <div className="sm:col-span-2 bg-navy-50/50 dark:bg-navy-800/40 p-3.5 rounded-xl border border-navy-100 dark:border-navy-800">
                  <p className="text-navy-400 font-bold uppercase text-[10px]">Settlement Wallet</p>
                  <p className="font-mono text-xs text-navy-800 dark:text-navy-200 mt-0.5 truncate">
                    {producer_wallet}
                  </p>
                </div>
              </div>
            </Card>
          </div>

          {/* Right Column (1 Col) */}
          <div className="space-y-6">
            {/* 1. Request Lifecycle Timeline */}
            <Card className="p-6">
              <h3 className="text-base font-bold text-navy-900 dark:text-white mb-4 flex items-center gap-2">
                <Clock className="w-4 h-4 text-brand-600 dark:text-brand-400" />
                Request Timeline
              </h3>

              <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-navy-200 dark:before:bg-navy-700">
                {timeline.map((event: any, idx: number) => {
                  const isDone = event.status === "COMPLETED";
                  const isCancelled = event.status === "CANCELLED";
                  return (
                    <div key={idx} className="relative">
                      {/* Timeline Dot */}
                      <div
                        className={`absolute -left-6 top-1 w-3.5 h-3.5 rounded-full border-2 ${
                          isDone
                            ? "bg-emerald-500 border-white dark:border-navy-900 ring-2 ring-emerald-500/20"
                            : isCancelled
                            ? "bg-rose-500 border-white dark:border-navy-900 ring-2 ring-rose-500/20"
                            : "bg-navy-300 dark:bg-navy-600 border-white dark:border-navy-900"
                        }`}
                      />
                      <div className="space-y-0.5">
                        <p className="text-xs font-bold text-navy-900 dark:text-white">{event.title}</p>
                        <p className="text-[11px] text-navy-500 leading-relaxed">{event.description}</p>
                        {event.timestamp && (
                          <p className="text-[10px] font-mono text-navy-400 pt-0.5">
                            {new Date(event.timestamp).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>

            {/* 2. Projected Carbon Savings */}
            <Card className="p-6 bg-gradient-to-br from-emerald-950 to-teal-950 text-white border-emerald-800/40">
              <div className="flex items-center gap-2 text-emerald-400 text-xs font-bold uppercase tracking-wider mb-2">
                <Leaf className="w-4 h-4" />
                Projected Impact
              </div>
              <h4 className="text-xl font-extrabold text-white">
                {carbonEstimateKg} kg CO₂
              </h4>
              <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                Projected avoided emissions upon complete settlement, benchmarked at 0.8200 kg CO₂/kWh grid emission factor.
              </p>

              <div className="mt-4 pt-3 border-t border-emerald-800/50 flex items-center justify-between text-xs">
                <span className="text-slate-300">Forest Equivalent:</span>
                <span className="font-bold text-emerald-300">≈ {treesEquivalent} Trees/year</span>
              </div>
            </Card>
          </div>
        </div>

        {/* Cancellation Confirmation Dialog */}
        <ConfirmationDialog
          isOpen={cancelModalOpen}
          onClose={() => {
            if (!isCancelling) setCancelModalOpen(false);
          }}
          onConfirm={handleConfirmCancel}
          title="Revoke Energy Demand?"
          message={`Are you sure you want to cancel request #REQ-${id.toString().padStart(4, "0")}? This will withdraw your bid from the matching orderbook.`}
          confirmLabel="Cancel Demand"
          cancelLabel="Keep Active"
          variant="danger"
          loading={isCancelling}
        />
      </div>
    </DashboardLayout>
  );
}
