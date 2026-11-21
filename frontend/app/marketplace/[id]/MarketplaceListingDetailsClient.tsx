"use client";

import React, { useState, useEffect, useCallback, use } from "react";
import { useRouter, useParams } from "next/navigation";
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
  Sliders,
  Send,
  MessageSquare,
} from "lucide-react";
import { PublicLayout } from "../../../components/layout/PublicLayout";
import { DashboardLayout } from "../../../components/layout/DashboardLayout";
import { Card } from "../../../components/ui/Card";
import { Button } from "../../../components/ui/Button";
import { Input } from "../../../components/ui/Input";
import { StatusBadge } from "../../../components/ui/StatusBadge";
import { Modal } from "../../../components/ui/Modal";
import { SkeletonCard } from "../../../components/ui/LoadingSkeleton";
import { EmptyState } from "../../../components/ui/EmptyState";
import { ErrorState } from "../../../components/ui/ErrorState";
import { useApp } from "../../../components/common/AppContext";
import { marketplaceApi, consumersApi, transactionsApi } from "../../../services/api";

export default function MarketplaceListingDetailsClient() {
  const rawParams = useParams();
  const listingId = (rawParams?.id as string) || "1";
  const router = useRouter();
  const { role, addToast } = useApp();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [listing, setListing] = useState<any>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("greenledger_auth_token") || localStorage.getItem("greenledger_jwt");
      setIsAuthenticated(Boolean(token));
    }
  }, []);

  // Purchase Request Form State
  const [orderQuantityKwh, setOrderQuantityKwh] = useState("50");
  const [priorityWeight, setPriorityWeight] = useState("1.0");
  const [urgencyLevel, setUrgencyLevel] = useState<"HIGH" | "NORMAL" | "FLEXIBLE">("NORMAL");
  const [maxPrice, setMaxPrice] = useState("");
  const [consumerMessage, setConsumerMessage] = useState("");

  // Request Modal State
  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);
  const [isSubmittingRequest, setIsSubmittingRequest] = useState(false);

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
        setMaxPrice(String(res.data.price_per_kwh || res.data.unit_price_eth));
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

  // Handle Request Energy Button Click
  const handleInitiateRequest = () => {
    const token = typeof window !== "undefined"
      ? (localStorage.getItem("greenledger_auth_token") || localStorage.getItem("greenledger_jwt"))
      : null;
    if (!token) {
      addToast({
        type: "warning",
        title: "Sign In Required",
        message: "Please log in with a Consumer account to submit an energy purchase demand.",
      });
      router.push(`/login?redirect=/marketplace/${listingId}`);
      return;
    }

    if (role === "PRODUCER") {
      addToast({
        type: "warning",
        title: "Producer Role Restricted",
        message: "Producers cannot buy or request energy listings. Switch to a Consumer account to participate.",
      });
      return;
    }

    setIsRequestModalOpen(true);
  };

  // Submit Energy Purchase Request
  const handleSubmitRequest = async () => {
    const qty = parseFloat(orderQuantityKwh);
    const avail = Number(listing?.available_energy_kwh || listing?.available_kwh || 0);
    const minVal = Number(listing?.min_purchase_kwh || 1.0);

    if (isNaN(qty) || qty <= 0) {
      addToast({
        type: "error",
        title: "Invalid Quantity",
        message: "Requested energy quantity must be greater than zero.",
      });
      return;
    }

    if (qty > avail) {
      addToast({
        type: "error",
        title: "Capacity Exceeded",
        message: `Requested quantity (${qty} kWh) exceeds available capacity (${avail} kWh).`,
      });
      return;
    }

    if (qty < minVal) {
      addToast({
        type: "error",
        title: "Minimum Purchase Required",
        message: `Minimum order for this listing is ${minVal} kWh.`,
      });
      return;
    }

    try {
      setIsSubmittingRequest(true);
      const res = await consumersApi.createRequest({
        listingId: Number(listingId),
        requestedEnergyKwh: qty,
        priorityWeight: parseFloat(priorityWeight) || 1.0,
        maxAcceptablePrice: maxPrice ? parseFloat(maxPrice) : undefined,
        urgencyLevel: urgencyLevel,
        message: consumerMessage.trim() || undefined,
      });

      if (res.success && res.data) {
        addToast({
          type: "success",
          title: "Demand Request Submitted",
          message: `Your energy request for ${qty} kWh has been submitted to the double-auction matching engine.`,
        });
        setIsRequestModalOpen(false);
        router.push(`/consumer/requests/${res.data.id}`);
      } else {
        addToast({
          type: "error",
          title: "Request Submission Failed",
          message: res.error || "Could not submit energy request",
        });
      }
    } catch (err: any) {
      addToast({
        type: "error",
        title: "Submission Error",
        message: err.message || "An unexpected error occurred while submitting request",
      });
    } finally {
      setIsSubmittingRequest(false);
    }
  };

  const Layout = isAuthenticated ? DashboardLayout : PublicLayout;
  const layoutProps = isAuthenticated ? { activeNavId: "marketplace" } : {};

  if (loading) {
    return (
      <Layout {...layoutProps}>
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
      </Layout>
    );
  }

  if (error || !listing) {
    return (
      <Layout {...layoutProps}>
        <div className="max-w-3xl mx-auto px-4 py-16 text-center">
          <ErrorState
            title="Listing Not Found"
            message={error || "The energy listing you are looking for does not exist or has expired."}
            onRetry={fetchListing}
          />
          <div className="mt-6">
            <Link href="/marketplace">
              <Button variant="outline" icon={ArrowLeft}>
                Back to Energy Marketplace
              </Button>
            </Link>
          </div>
        </div>
      </Layout>
    );
  }

  const priceNum = parseFloat(listing.price_per_kwh || listing.unit_price_eth) || 0;
  const availKwh = Number(listing.available_energy_kwh || listing.available_kwh);
  const totalKwh = Number(listing.total_energy_kwh || listing.quantity_kwh || availKwh);
  const minPurchase = Number(listing.min_purchase_kwh || 1.0);
  const orderQtyNum = parseFloat(orderQuantityKwh) || 0;

  // Cost Estimations
  const baseCost = orderQtyNum * priceNum;
  const platformFee = baseCost * 0.015; // 1.5%
  const totalEth = (baseCost + platformFee).toFixed(8);
  const totalInr = ((baseCost + platformFee) * 280000).toFixed(2);
  const avoidedCo2 = (orderQtyNum * 0.82).toFixed(2);

  const getSourceIcon = (source: string) => {
    switch ((source || "").toUpperCase()) {
      case "SOLAR":
        return Sun;
      case "WIND":
        return Wind;
      case "HYDRO":
        return Droplets;
      case "BIOMASS":
        return Flame;
      default:
        return Zap;
    }
  };

  const SourceIcon = getSourceIcon(listing.energy_source);

  return (
    <Layout {...(isAuthenticated ? { activeNavId: "marketplace" } : {})}>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8 animate-fadeIn">
        {/* Navigation Breadcrumb */}
        <div className="flex items-center justify-between">
          <Link
            href="/marketplace"
            className="inline-flex items-center gap-2 text-xs font-bold text-navy-500 hover:text-navy-900 dark:hover:text-white transition"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Energy Marketplace
          </Link>
          <div className="flex items-center gap-2">
            <span className="text-xs text-navy-400">Listing Status:</span>
            <StatusBadge status={listing.listing_status || "ACTIVE"} variant="success" />
          </div>
        </div>

        {/* Listing Header Hero */}
        <div className="bg-white dark:bg-navy-900 rounded-3xl p-6 sm:p-8 border border-navy-200 dark:border-navy-800 shadow-card flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-start gap-4">
            <div className="p-4 rounded-2xl bg-brand-50 dark:bg-brand-950/60 text-brand-600 dark:text-brand-400 border border-brand-200/50 flex-shrink-0">
              <SourceIcon className="w-8 h-8" />
            </div>
            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-brand-50 text-brand-700 dark:bg-brand-950/60 dark:text-brand-300 border border-brand-200/60">
                  {listing.energy_source} Generation
                </span>
                <span className="font-mono text-xs font-semibold text-navy-400">
                  Listing #{listing.id}
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-navy-900 dark:text-white mt-1 tracking-tight">
                {listing.producer_name || "Green Energy Producer"}
              </h1>
              <p className="text-xs text-navy-500 dark:text-navy-400 mt-1 flex items-center gap-3">
                <span>Node: {listing.location_grid || "Alpha Microgrid Cluster 1"}</span>
                <span>•</span>
                <span className="font-mono">Smart Meter: {listing.producer_meter_id || "METER-PROD-101"}</span>
              </p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row md:flex-col items-start md:items-end justify-between border-t md:border-t-0 pt-4 md:pt-0 border-navy-100 dark:border-navy-800">
            <p className="text-xs uppercase font-bold text-navy-400">Spot Tariff Rate</p>
            <p className="text-3xl font-black text-navy-900 dark:text-white font-mono mt-0.5">
              {priceNum.toFixed(8)} <span className="text-sm font-semibold text-navy-500">ETH/kWh</span>
            </p>
            <p className="text-xs text-brand-600 dark:text-brand-400 font-semibold mt-0.5">
              ≈ ₹{(priceNum * 280000).toFixed(2)} per kWh
            </p>
          </div>
        </div>

        {/* Technical Specifications & Purchase Calculator Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column: Technical Specifications */}
          <div className="lg:col-span-2 space-y-6">
            <Card className="p-6">
              <h3 className="text-base font-bold text-navy-900 dark:text-white mb-4 flex items-center gap-2">
                <Layers className="w-4 h-4 text-brand-600" />
                Technical Capacity & Availability
              </h3>

              <div className="space-y-4">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-semibold text-navy-600 dark:text-navy-300">
                    Available Capacity:
                  </span>
                  <span className="font-mono font-bold text-navy-900 dark:text-white">
                    {availKwh.toLocaleString()} kWh of {totalKwh.toLocaleString()} kWh total
                  </span>
                </div>
                <div className="h-3 w-full bg-navy-100 dark:bg-navy-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-brand-500 to-emerald-400 rounded-full"
                    style={{ width: `${Math.min(100, (availKwh / (totalKwh || 1)) * 100)}%` }}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 pt-6 mt-6 border-t border-navy-100 dark:border-navy-800 text-xs">
                <div>
                  <p className="text-navy-400 font-bold uppercase text-[10px]">Min Purchase</p>
                  <p className="text-sm font-bold text-navy-900 dark:text-white mt-0.5">
                    {minPurchase} kWh
                  </p>
                </div>
                <div>
                  <p className="text-navy-400 font-bold uppercase text-[10px]">Settlement Method</p>
                  <p className="text-sm font-bold text-navy-900 dark:text-white mt-0.5">
                    Atomic On-Chain Escrow
                  </p>
                </div>
                <div>
                  <p className="text-navy-400 font-bold uppercase text-[10px]">Certificate</p>
                  <p className="text-sm font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">
                    ERC-721 REC Included
                  </p>
                </div>
              </div>
            </Card>

            <Card className="p-6 bg-gradient-to-br from-brand-900/10 via-transparent to-transparent border-brand-500/20">
              <h3 className="text-base font-bold text-navy-900 dark:text-white mb-2 flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-brand-600" />
                Guaranteed Renewable Provenance
              </h3>
              <p className="text-xs text-navy-600 dark:text-navy-300 leading-relaxed">
                Energy generated by this producer is verified through calibrated smart meters and algorithmically audited against deterministic physical simulation models (solar irradiance and wind power curves). Every transaction results in minting a cryptographic Renewable Energy Certificate (REC).
              </p>
            </Card>
          </div>

          {/* Right Column: Interactive Purchase Estimator */}
          <div className="space-y-6">
            <Card className="p-6 space-y-6 border-brand-500/40 shadow-lg">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold text-navy-900 dark:text-white flex items-center gap-2">
                  <Calculator className="w-5 h-5 text-brand-600" />
                  Order Estimator
                </h3>
                <span className="text-xs font-bold text-brand-600 bg-brand-50 dark:bg-brand-950/60 px-2 py-0.5 rounded-full">
                  Real-time
                </span>
              </div>

              {/* Quantity Slider & Input */}
              <div className="space-y-3">
                <div className="flex justify-between items-center text-xs">
                  <label className="font-bold text-navy-700 dark:text-navy-200">
                    Energy Volume (kWh):
                  </label>
                  <span className="font-mono font-bold text-brand-600">
                    {orderQuantityKwh} kWh
                  </span>
                </div>
                <input
                  type="range"
                  min={minPurchase}
                  max={availKwh}
                  step={1}
                  value={orderQuantityKwh}
                  onChange={(e) => setOrderQuantityKwh(e.target.value)}
                  className="w-full accent-brand-600 cursor-pointer"
                />
                <Input
                  type="number"
                  min={minPurchase}
                  max={availKwh}
                  value={orderQuantityKwh}
                  onChange={(e) => setOrderQuantityKwh(e.target.value)}
                  helperText={`Min purchase: ${minPurchase} kWh | Max available: ${availKwh} kWh`}
                />
              </div>

              {/* Itemized Cost Breakdown */}
              <div className="p-4 bg-navy-50/60 dark:bg-navy-800/40 rounded-2xl border border-navy-100 dark:border-navy-700/60 space-y-2.5 text-xs">
                <div className="flex justify-between text-navy-600 dark:text-navy-300">
                  <span>Base Energy Cost ({orderQtyNum} kWh):</span>
                  <span className="font-mono font-bold text-navy-900 dark:text-white">
                    {baseCost.toFixed(8)} ETH
                  </span>
                </div>
                <div className="flex justify-between text-navy-600 dark:text-navy-300">
                  <span>Microgrid Commission (1.5%):</span>
                  <span className="font-mono text-navy-500">
                    {platformFee.toFixed(8)} ETH
                  </span>
                </div>
                <div className="flex justify-between text-navy-600 dark:text-navy-300 pt-2 border-t border-navy-200/60 dark:border-navy-700/60">
                  <span className="font-bold">Avoided CO₂:</span>
                  <span className="font-bold text-emerald-600 dark:text-emerald-400">
                    {avoidedCo2} kg
                  </span>
                </div>
                <div className="flex justify-between items-baseline pt-2 border-t border-navy-200/60 dark:border-navy-700/60">
                  <span className="text-sm font-extrabold text-navy-900 dark:text-white">Total Amount:</span>
                  <div className="text-right">
                    <span className="text-base font-black text-brand-600 dark:text-brand-400 font-mono">
                      {totalEth} ETH
                    </span>
                    <p className="text-[10px] text-navy-400">≈ ₹{Number(totalInr).toLocaleString()}</p>
                  </div>
                </div>
              </div>

              {/* Action Button */}
              <Button
                variant="primary"
                size="lg"
                className="w-full text-sm font-bold shadow-md shadow-brand-600/20"
                onClick={handleInitiateRequest}
                leftIcon={<ShoppingBag className="w-4 h-4" />}
              >
                Request Energy Demand
              </Button>
            </Card>
          </div>
        </div>

        {/* Request Energy Modal Form */}
        {isRequestModalOpen && (
          <Modal
            isOpen={true}
            onClose={() => setIsRequestModalOpen(false)}
            title="Submit Energy Purchase Demand"
            size="lg"
          >
            <div className="space-y-6 pt-2">
              <p className="text-xs text-navy-600 dark:text-navy-300 leading-relaxed">
                Submit a purchase request to the double-auction matching engine for <strong>{listing.producer_name}</strong> ({listing.energy_source}). Your request will be queued for algorithmic proportional allocation.
              </p>

              {/* Listing Summary Pill */}
              <div className="p-4 rounded-2xl bg-navy-50 dark:bg-navy-950 text-xs grid grid-cols-2 sm:grid-cols-4 gap-3 border border-navy-100 dark:border-navy-800">
                <div>
                  <span className="text-navy-400 uppercase font-bold text-[10px]">Source</span>
                  <p className="font-bold text-navy-900 dark:text-white mt-0.5">{listing.energy_source}</p>
                </div>
                <div>
                  <span className="text-navy-400 uppercase font-bold text-[10px]">Available</span>
                  <p className="font-bold text-navy-900 dark:text-white mt-0.5">{availKwh} kWh</p>
                </div>
                <div>
                  <span className="text-navy-400 uppercase font-bold text-[10px]">Unit Price</span>
                  <p className="font-mono font-bold text-navy-900 dark:text-white mt-0.5">{priceNum} ETH</p>
                </div>
                <div>
                  <span className="text-navy-400 uppercase font-bold text-[10px]">Avoided CO₂</span>
                  <p className="font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">{avoidedCo2} kg</p>
                </div>
              </div>

              {/* Form Controls */}
              <div className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-navy-700 dark:text-navy-200 block mb-1">
                    Requested Energy Volume (kWh) *
                  </label>
                  <Input
                    type="number"
                    min={minPurchase}
                    max={availKwh}
                    value={orderQuantityKwh}
                    onChange={(e) => setOrderQuantityKwh(e.target.value)}
                    helperText={`Must be between ${minPurchase} kWh and ${availKwh} kWh`}
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold text-navy-700 dark:text-navy-200 block mb-1">
                      Priority Tier Weight
                    </label>
                    <select
                      value={priorityWeight}
                      onChange={(e) => setPriorityWeight(e.target.value)}
                      className="w-full px-3 py-2 text-xs font-semibold bg-white dark:bg-navy-900 border border-navy-200 dark:border-navy-700 rounded-xl text-navy-800 dark:text-navy-200 focus:outline-none focus:ring-2 focus:ring-brand-500/30"
                    >
                      <option value="1.0">Standard Priority (1.0x)</option>
                      <option value="1.5">Commercial Priority (1.5x)</option>
                      <option value="2.0">Critical Infrastructure (2.0x)</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-navy-700 dark:text-navy-200 block mb-1">
                      Urgency Level
                    </label>
                    <select
                      value={urgencyLevel}
                      onChange={(e) => setUrgencyLevel(e.target.value as any)}
                      className="w-full px-3 py-2 text-xs font-semibold bg-white dark:bg-navy-900 border border-navy-200 dark:border-navy-700 rounded-xl text-navy-800 dark:text-navy-200 focus:outline-none focus:ring-2 focus:ring-brand-500/30"
                    >
                      <option value="NORMAL">Normal</option>
                      <option value="HIGH">High (Immediate Clearing)</option>
                      <option value="FLEXIBLE">Flexible (Cost Optimized)</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-navy-700 dark:text-navy-200 block mb-1">
                    Maximum Acceptable Price (ETH / kWh)
                  </label>
                  <Input
                    type="number"
                    step="0.00000001"
                    value={maxPrice}
                    onChange={(e) => setMaxPrice(e.target.value)}
                    helperText="Pre-filled with producer tariff. Set upper limit to prevent dynamic price swings."
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-navy-700 dark:text-navy-200 block mb-1">
                    Optional Message to Producer
                  </label>
                  <textarea
                    rows={2}
                    value={consumerMessage}
                    onChange={(e) => setConsumerMessage(e.target.value)}
                    placeholder="e.g., Hospital backup reserve, night shift load requirements..."
                    className="w-full px-3.5 py-2 text-xs bg-white dark:bg-navy-900 border border-navy-200 dark:border-navy-700 rounded-xl text-navy-800 dark:text-navy-200 focus:outline-none focus:ring-2 focus:ring-brand-500/30"
                  />
                </div>
              </div>

              {/* Total Estimated Commitment */}
              <div className="p-4 rounded-xl bg-brand-50/60 dark:bg-brand-950/40 border border-brand-200/60 dark:border-brand-800/40 flex justify-between items-center text-xs">
                <div>
                  <p className="text-brand-800 dark:text-brand-200 font-bold">Estimated Total Order</p>
                  <p className="text-[11px] text-brand-600 dark:text-brand-400">Includes 1.5% microgrid fee</p>
                </div>
                <div className="text-right">
                  <p className="text-base font-extrabold text-brand-700 dark:text-brand-300 font-mono">
                    {totalEth} ETH
                  </p>
                  <p className="text-[10px] text-navy-400">≈ ₹{Number(totalInr).toLocaleString()}</p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end gap-3 pt-3 border-t border-navy-100 dark:border-navy-800">
                <Button
                  variant="outline"
                  type="button"
                  onClick={() => setIsRequestModalOpen(false)}
                  disabled={isSubmittingRequest}
                >
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  loading={isSubmittingRequest}
                  onClick={handleSubmitRequest}
                  rightIcon={<Send className="w-4 h-4" />}
                >
                  Submit Demand Request
                </Button>
              </div>
            </div>
          </Modal>
        )}
      </div>
    </Layout>
  );
}
