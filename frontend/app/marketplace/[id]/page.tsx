"use client";

import React, { useState, useEffect, useCallback, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Zap,
  Sun,
  Wind,
  Droplets,
  Flame,
  ShieldCheck,
  Award,
  Layers,
  Coins,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Activity,
  Calculator,
  ShoppingBag,
} from "lucide-react";
import { PublicLayout } from "../../../components/layout/PublicLayout";
import { Card } from "../../../components/ui/Card";
import { Button } from "../../../components/ui/Button";
import { Input } from "../../../components/ui/Input";
import { StatusBadge } from "../../../components/ui/StatusBadge";
import { Modal } from "../../../components/ui/Modal";
import { SkeletonCard } from "../../../components/ui/LoadingSkeleton";
import { EmptyState } from "../../../components/ui/EmptyState";
import { ErrorState } from "../../../components/ui/ErrorState";
import { useApp } from "../../../components/common/AppContext";
import { marketplaceApi, transactionsApi } from "../../../services/api";

export default function MarketplaceListingDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);
  const listingId = resolvedParams.id;
  const router = useRouter();
  const { role, addToast } = useApp();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [listing, setListing] = useState<any>(null);

  // Purchase Estimator State
  const [orderQuantityKwh, setOrderQuantityKwh] = useState("50");

  // Purchase Modal State
  const [isPurchaseModalOpen, setIsPurchaseModalOpen] = useState(false);
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [completedTx, setCompletedTx] = useState<any>(null);

  const fetchListing = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await marketplaceApi.getListingById(listingId);
      if (res.success && res.data) {
        setListing(res.data);
        const minVal = Number(res.data.min_purchase_kwh || 1.0);
        const avail = Number(res.data.available_energy_kwh || res.data.available_kwh);
        const initialOrder = Math.min(avail, Math.max(minVal, 50));
        setOrderQuantityKwh(String(initialOrder));
      } else {
        setError(res.error || "Failed to load energy listing details");
      }
    } catch (err: any) {
      setError(err.message || "Failed to communicate with marketplace API");
    } finally {
      setLoading(false);
    }
  }, [listingId]);

  useEffect(() => {
    fetchListing();
  }, [fetchListing]);

  // Handle Request/Buy Trigger
  const handleInitiateRequest = () => {
    const token = typeof window !== "undefined" ? localStorage.getItem("greenledger_auth_token") : null;
    if (!token) {
      addToast({
        type: "warning",
        title: "Sign In Required",
        message: "Please log in with a Consumer account to purchase renewable energy.",
      });
      router.push(`/login?redirect=/marketplace/${listingId}`);
      return;
    }

    if (role === "PRODUCER") {
      addToast({
        type: "warning",
        title: "Producer Role Restricted",
        message: "Producers cannot buy energy listings. Switch to a Consumer account to participate in purchasing.",
      });
      return;
    }

    setIsPurchaseModalOpen(true);
  };

  // Execute Energy Purchase Settlement
  const handleConfirmPurchase = async () => {
    const qty = parseFloat(orderQuantityKwh);
    if (!qty || qty <= 0) return;

    try {
      setIsPurchasing(true);
      const res = await transactionsApi.createTransaction({
        listingId: Number(listingId),
        energyQuantityKwh: qty,
      });

      if (res.success && res.data) {
        setCompletedTx(res.data);
        addToast({
          type: "success",
          title: "Energy Purchase Settled",
          message: `Successfully purchased ${qty} kWh from Listing #${listingId}.`,
        });
        fetchListing();
      } else {
        addToast({
          type: "error",
          title: "Settlement Failed",
          message: res.error || "Could not complete transaction settlement",
        });
      }
    } catch (err: any) {
      addToast({
        type: "error",
        title: "Transaction Error",
        message: err.message || "An error occurred during trade execution",
      });
    } finally {
      setIsPurchasing(false);
    }
  };

  if (loading) {
    return (
      <PublicLayout>
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-6 animate-pulse">
          <div className="h-8 bg-navy-200 dark:bg-navy-800 rounded-lg w-1/4 mb-4" />
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-4">
              <SkeletonCard />
              <SkeletonCard />
            </div>
            <SkeletonCard />
          </div>
        </div>
      </PublicLayout>
    );
  }

  if (error || !listing) {
    return (
      <PublicLayout>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-16 text-center">
          <ErrorState
            title="Energy Listing Unavailable"
            message={error || `Could not find marketplace listing #${listingId}`}
            onRetry={fetchListing}
          />
        </div>
      </PublicLayout>
    );
  }

  const priceNum = parseFloat(listing.price_per_kwh || listing.unit_price_eth) || 0;
  const availKwh = Number(listing.available_energy_kwh || listing.available_kwh);
  const totalKwh = Number(listing.total_energy_kwh || listing.quantity_kwh || availKwh);
  const minPurchase = Number(listing.min_purchase_kwh || 1.0);

  // Estimator Math
  const orderQtyNum = Math.min(availKwh, Math.max(minPurchase, parseFloat(orderQuantityKwh) || minPurchase));
  const baseEth = orderQtyNum * priceNum;
  const feeEth = baseEth * 0.015; // 1.5% commission
  const totalEth = (baseEth + feeEth).toFixed(6);
  const carbonSavedKg = (orderQtyNum * 0.82).toFixed(1);

  return (
    <PublicLayout>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
        {/* Navigation Breadcrumb */}
        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            size="sm"
            icon={ArrowLeft}
            onClick={() => router.push("/marketplace")}
          >
            Back to Marketplace
          </Button>

          <div className="flex items-center gap-2">
            <span className="text-xs text-navy-400">Listing Status:</span>
            <StatusBadge status={listing.listing_status || "ACTIVE"} size="sm" />
          </div>
        </div>

        {/* Main Grid: Details + Cost Estimator */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column: Full Specifications */}
          <div className="lg:col-span-2 space-y-6">
            {/* Header Card */}
            <Card className="p-6 space-y-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <StatusBadge status={listing.energy_source} size="sm" />
                    <span className="text-xs font-mono font-bold text-navy-400">
                      Listing #{listing.id}
                    </span>
                  </div>
                  <h1 className="text-2xl font-extrabold text-navy-900 dark:text-white">
                    {listing.energy_source} Renewable Energy Capacity
                  </h1>
                  <p className="text-xs text-navy-500 dark:text-navy-400 mt-1">
                    Certified clean generation delivered across Microgrid Sector {listing.location_grid || "Alpha-1"}
                  </p>
                </div>

                <div className="text-right">
                  <p className="text-[11px] font-bold uppercase text-navy-400">Unit Price</p>
                  <p className="font-mono text-2xl font-black text-brand-600 dark:text-brand-400">
                    {priceNum} <span className="text-xs font-bold">ETH/kWh</span>
                  </p>
                </div>
              </div>

              {/* Producer Credibility Banner */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-navy-950/60 border border-navy-100 dark:border-navy-800/80 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-brand-500/10 text-brand-600 dark:text-brand-400 flex items-center justify-center font-bold">
                    {listing.producer_name?.slice(0, 2).toUpperCase() || "GL"}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-navy-900 dark:text-white">
                      {listing.producer_name}
                    </p>
                    <p className="font-mono text-xs text-navy-400">
                      Smart Meter: {listing.producer_meter_id || "METER-PROD-SOL-101"}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-4 text-xs font-semibold">
                  <div className="flex items-center gap-1 text-brand-600 dark:text-brand-400">
                    <ShieldCheck className="w-4 h-4" />
                    <span>{listing.reputation_score || 99.2}% Proven Track Record</span>
                  </div>
                  {listing.producer_wallet && (
                    <div className="font-mono text-navy-500 text-[11px]">
                      {listing.producer_wallet.slice(0, 6)}...{listing.producer_wallet.slice(-4)}
                    </div>
                  )}
                </div>
              </div>
            </Card>

            {/* Technical Specifications */}
            <Card className="p-6 space-y-4">
              <h3 className="font-bold text-base text-navy-900 dark:text-white flex items-center gap-2">
                <Activity className="w-4 h-4 text-brand-600" />
                Technical & Orderbook Specifications
              </h3>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs">
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-navy-950/40 border border-navy-100 dark:border-navy-800">
                  <p className="text-navy-400 font-medium">Total Generation</p>
                  <p className="text-sm font-bold text-navy-900 dark:text-white mt-0.5">
                    {totalKwh.toLocaleString()} kWh
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 dark:bg-navy-950/40 border border-navy-100 dark:border-navy-800">
                  <p className="text-navy-400 font-medium">Available in Escrow</p>
                  <p className="text-sm font-bold text-brand-600 dark:text-brand-400 mt-0.5">
                    {availKwh.toLocaleString()} kWh
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 dark:bg-navy-950/40 border border-navy-100 dark:border-navy-800">
                  <p className="text-navy-400 font-medium">Min Order Size</p>
                  <p className="text-sm font-bold text-navy-900 dark:text-white mt-0.5">
                    {minPurchase} kWh
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 dark:bg-navy-950/40 border border-navy-100 dark:border-navy-800">
                  <p className="text-navy-400 font-medium">Settlement Layer</p>
                  <p className="text-sm font-bold text-navy-900 dark:text-white mt-0.5">
                    Ethereum Sepolia
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 dark:bg-navy-950/40 border border-navy-100 dark:border-navy-800">
                  <p className="text-navy-400 font-medium">REC Token Eligible</p>
                  <p className="text-sm font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">
                    ERC-721 G-REC
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 dark:bg-navy-950/40 border border-navy-100 dark:border-navy-800">
                  <p className="text-navy-400 font-medium">Avoided Factor</p>
                  <p className="text-sm font-bold text-navy-900 dark:text-white mt-0.5">
                    0.82 kg CO2/kWh
                  </p>
                </div>
              </div>
            </Card>
          </div>

          {/* Right Column: Interactive Purchase Cost Estimator & Order CTA */}
          <div className="space-y-6">
            <Card className="p-6 border-brand-500/40 shadow-xl space-y-6 bg-white dark:bg-navy-900">
              <div className="flex items-center gap-2 pb-3 border-b border-navy-100 dark:border-navy-800">
                <Calculator className="w-5 h-5 text-brand-600 dark:text-brand-400" />
                <h3 className="font-extrabold text-base text-navy-900 dark:text-white">
                  Order Cost Estimator
                </h3>
              </div>

              {/* Order Volume Input */}
              <div className="space-y-2">
                <div className="flex justify-between items-center text-xs font-bold text-navy-800 dark:text-navy-200">
                  <span>Energy Quantity (kWh)</span>
                  <span className="text-brand-600 dark:text-brand-400">{availKwh} kWh max</span>
                </div>

                <Input
                  type="number"
                  step="1"
                  min={minPurchase}
                  max={availKwh}
                  value={orderQuantityKwh}
                  onChange={(e) => setOrderQuantityKwh(e.target.value)}
                  className="h-11 font-bold text-base"
                />

                {/* Slider for quick picking */}
                <input
                  type="range"
                  min={minPurchase}
                  max={availKwh}
                  step="1"
                  value={orderQtyNum}
                  onChange={(e) => setOrderQuantityKwh(e.target.value)}
                  className="w-full accent-brand-600 cursor-pointer"
                />
              </div>

              {/* Itemized Cost Breakdown */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-navy-950/80 border border-navy-100 dark:border-navy-800 space-y-2.5 text-xs">
                <div className="flex justify-between">
                  <span className="text-navy-500 dark:text-navy-400">
                    Energy Base ({orderQtyNum} kWh × {priceNum}):
                  </span>
                  <span className="font-mono font-semibold text-navy-900 dark:text-white">
                    {baseEth.toFixed(6)} ETH
                  </span>
                </div>

                <div className="flex justify-between">
                  <span className="text-navy-500 dark:text-navy-400">
                    Platform Commission (1.5%):
                  </span>
                  <span className="font-mono font-semibold text-navy-900 dark:text-white">
                    {feeEth.toFixed(6)} ETH
                  </span>
                </div>

                <div className="flex justify-between py-1 border-t border-navy-200/50 dark:border-navy-800">
                  <span className="text-navy-500 dark:text-navy-400">
                    CO2 Greenhouse Avoided:
                  </span>
                  <span className="font-bold text-brand-600 dark:text-brand-400">
                    {carbonSavedKg} kg CO2
                  </span>
                </div>

                <div className="flex justify-between pt-2 border-t border-navy-200 dark:border-navy-700 text-sm">
                  <span className="font-extrabold text-navy-900 dark:text-white">
                    Total Estimated Amount:
                  </span>
                  <span className="font-mono font-black text-brand-700 dark:text-brand-300">
                    {totalEth} ETH
                  </span>
                </div>
              </div>

              {/* Request / Buy CTA */}
              <Button
                variant="primary"
                size="lg"
                className="w-full h-12 text-sm font-bold shadow-md shadow-brand-500/20"
                icon={ShoppingBag}
                onClick={handleInitiateRequest}
                disabled={availKwh <= 0}
              >
                {availKwh <= 0 ? "Listing Capacity Sold Out" : "Request Energy Allocation"}
              </Button>

              <p className="text-[11px] text-center text-navy-400 leading-tight">
                Non-custodial smart escrow guarantees atomic energy delivery and ERC-721 certificate issuance upon settlement.
              </p>
            </Card>
          </div>
        </div>

        {/* Modal: Purchase Confirmation & Settlement */}
        {isPurchaseModalOpen && (
          <Modal
            isOpen={true}
            onClose={() => {
              setIsPurchaseModalOpen(false);
              setCompletedTx(null);
            }}
            title={completedTx ? "Settlement Receipt" : "Confirm Energy Request"}
          >
            {completedTx ? (
              <div className="space-y-4 pt-2 text-center">
                <div className="w-14 h-14 rounded-full bg-brand-100 dark:bg-brand-950/60 text-brand-600 mx-auto flex items-center justify-center">
                  <CheckCircle2 className="w-8 h-8" />
                </div>

                <div>
                  <h3 className="text-lg font-extrabold text-navy-900 dark:text-white">
                    Trade Confirmed & Settled
                  </h3>
                  <p className="text-xs text-navy-500 mt-1">
                    Your renewable energy purchase has been processed and logged on the peer-to-peer ledger.
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-slate-50 dark:bg-navy-950 text-left text-xs space-y-2 border border-navy-100 dark:border-navy-800">
                  <div className="flex justify-between">
                    <span className="text-navy-400">Transaction ID:</span>
                    <span className="font-mono font-bold text-navy-900 dark:text-white">TX-#{completedTx.id}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-navy-400">Allocated Volume:</span>
                    <span className="font-bold text-navy-900 dark:text-white">{completedTx.energy_quantity_kwh} kWh</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-navy-400">Total Settlement:</span>
                    <span className="font-mono font-bold text-brand-600">{completedTx.total_amount} ETH</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-navy-400">Carbon Offset:</span>
                    <span className="font-bold text-emerald-600">{completedTx.carbonSavedKg} kg CO2</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-navy-400">Status:</span>
                    <StatusBadge status="CONFIRMED" size="sm" />
                  </div>
                </div>

                <Button
                  variant="primary"
                  className="w-full"
                  onClick={() => {
                    setIsPurchaseModalOpen(false);
                    setCompletedTx(null);
                    router.push("/consumer/dashboard");
                  }}
                >
                  Go to Consumer Dashboard
                </Button>
              </div>
            ) : (
              <div className="space-y-4 pt-2">
                <p className="text-xs text-navy-600 dark:text-navy-300">
                  You are about to execute an energy trade with <strong>{listing.producer_name}</strong> for:
                </p>

                <div className="p-4 rounded-xl bg-slate-50 dark:bg-navy-950 text-xs space-y-2 border border-navy-100 dark:border-navy-800">
                  <div className="flex justify-between">
                    <span className="text-navy-400">Energy Volume:</span>
                    <span className="font-bold text-navy-900 dark:text-white">{orderQtyNum} kWh</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-navy-400">Unit Price:</span>
                    <span className="font-mono font-bold text-navy-900 dark:text-white">{priceNum} ETH/kWh</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-navy-400">Total Commitment:</span>
                    <span className="font-mono font-black text-brand-600">{totalEth} ETH</span>
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-4 border-t border-navy-100 dark:border-navy-800">
                  <Button
                    variant="secondary"
                    type="button"
                    onClick={() => setIsPurchaseModalOpen(false)}
                    disabled={isPurchasing}
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="primary"
                    loading={isPurchasing}
                    onClick={handleConfirmPurchase}
                  >
                    Confirm & Settle Trade
                  </Button>
                </div>
              </div>
            )}
          </Modal>
        )}
      </div>
    </PublicLayout>
  );
}
