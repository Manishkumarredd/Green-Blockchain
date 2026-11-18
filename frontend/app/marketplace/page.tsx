"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Search,
  Filter,
  Zap,
  Sun,
  Wind,
  Droplets,
  Flame,
  ArrowRight,
  ShieldCheck,
  Award,
  Layers,
  Coins,
  TrendingDown,
  Activity,
  SlidersHorizontal,
  RefreshCw,
  ShoppingBag,
} from "lucide-react";
import { PublicLayout } from "../../components/layout/PublicLayout";
import { Card } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { Select } from "../../components/ui/Select";
import { StatusBadge } from "../../components/ui/StatusBadge";
import { Pagination } from "../../components/ui/Pagination";
import { SkeletonCard } from "../../components/ui/LoadingSkeleton";
import { EmptyState } from "../../components/ui/EmptyState";
import { ErrorState } from "../../components/ui/ErrorState";
import { useApp } from "../../components/common/AppContext";
import { marketplaceApi } from "../../services/api";

const SOURCE_FILTERS = [
  { value: "ALL", label: "All Sources", icon: Layers },
  { value: "SOLAR", label: "Solar", icon: Sun },
  { value: "WIND", label: "Wind", icon: Wind },
  { value: "HYDRO", label: "Hydro", icon: Droplets },
  { value: "BIOMASS", label: "Biomass", icon: Flame },
  { value: "HYBRID", label: "Hybrid", icon: Zap },
];

export default function MarketplacePage() {
  const router = useRouter();
  const { role, addToast } = useApp();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [listings, setListings] = useState<any[]>([]);
  const [summary, setSummary] = useState<any>(null);

  // Filters & Pagination
  const [search, setSearch] = useState("");
  const [selectedSource, setSelectedSource] = useState("ALL");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [minEnergy, setMinEnergy] = useState("");
  const [sortBy, setSortBy] = useState("price_asc");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  // Fetch Summary
  const fetchSummary = useCallback(async () => {
    try {
      const res = await marketplaceApi.getSummary();
      if (res.success && res.data) {
        setSummary(res.data);
      }
    } catch (err) {
      console.warn("Could not load marketplace summary:", err);
    }
  }, []);

  // Fetch Listings
  const fetchListings = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const params: any = {
        page,
        limit: 9,
        sortBy,
      };

      if (selectedSource !== "ALL") params.energySource = selectedSource;
      if (search.trim()) params.search = search.trim();
      if (minPrice) params.minPrice = Number(minPrice);
      if (maxPrice) params.maxPrice = Number(maxPrice);
      if (minEnergy) params.minEnergy = Number(minEnergy);

      const res = await marketplaceApi.getListings(params);
      if (res.success && res.data) {
        setListings(res.data);
        if (res.meta) {
          setTotalPages(res.meta.totalPages || 1);
          setTotalItems(res.meta.total || 0);
        }
      } else {
        setError(res.error || "Failed to load marketplace listings");
      }
    } catch (err: any) {
      setError(err.message || "Failed to communicate with marketplace API");
    } finally {
      setLoading(false);
    }
  }, [page, sortBy, selectedSource, search, minPrice, maxPrice, minEnergy]);

  useEffect(() => {
    fetchSummary();
  }, [fetchSummary]);

  useEffect(() => {
    fetchListings();
  }, [fetchListings]);

  // Handle Request Energy Button Click
  const handleRequestEnergy = (listingId: number) => {
    // Check authentication
    const token = typeof window !== "undefined"
      ? (localStorage.getItem("greenledger_auth_token") || localStorage.getItem("greenledger_jwt"))
      : null;
    if (!token) {
      addToast({
        type: "warning",
        title: "Authentication Required",
        message: "Please log in with a Consumer account to purchase or request clean energy.",
      });
      router.push(`/login?redirect=/marketplace/${listingId}`);
      return;
    }

    if (role === "PRODUCER") {
      addToast({
        type: "warning",
        title: "Producer Account Restricted",
        message: "Producers can only list energy. Switch to a Consumer account to submit purchase demands.",
      });
      return;
    }

    // Navigate to listing details with purchase modal
    router.push(`/marketplace/${listingId}`);
  };

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

  return (
    <PublicLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
        {/* Marketplace Header */}
        <div className="bg-gradient-to-br from-navy-900 via-navy-950 to-brand-950 rounded-3xl p-8 sm:p-10 text-white relative overflow-hidden shadow-xl border border-navy-800">
          <div className="absolute top-0 right-0 w-96 h-96 bg-brand-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 max-w-3xl space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-500/20 text-brand-400 text-xs font-bold border border-brand-500/30">
              <ShoppingBag className="w-3.5 h-3.5" />
              Decentralized Renewable Energy Orderbook
            </div>

            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
              Discover Renewable Energy.
            </h1>

            <p className="text-navy-300 text-sm sm:text-base leading-relaxed">
              Explore available renewable energy listings and connect with certified clean producers through GreenLedger.
              Instant algorithmic double-auction matching with on-chain cryptographic settlement.
            </p>
          </div>

          {/* Header Summary Statistics */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-8 pt-8 border-t border-navy-800/80">
            <div>
              <p className="text-xs text-navy-400 font-medium">Active Listings</p>
              <p className="text-2xl font-extrabold text-white mt-1">
                {summary ? summary.activeListingsCount : totalItems || "4"}
              </p>
            </div>
            <div>
              <p className="text-xs text-navy-400 font-medium">Available Energy</p>
              <p className="text-2xl font-extrabold text-brand-400 mt-1">
                {summary ? Number(summary.totalAvailableKwh).toLocaleString() : "650"} kWh
              </p>
            </div>
            <div>
              <p className="text-xs text-navy-400 font-medium">Generation Mix</p>
              <p className="text-2xl font-extrabold text-white mt-1">
                {summary ? summary.distinctSourcesCount : "3"} Sources
              </p>
            </div>
            <div>
              <p className="text-xs text-navy-400 font-medium">Floor Tariff</p>
              <p className="text-2xl font-extrabold text-amber-400 font-mono mt-1">
                {summary ? summary.minPriceEth : "0.000082"} ETH
              </p>
            </div>
          </div>
        </div>

        {/* Search & Filter Toolbar */}
        <div className="bg-white dark:bg-navy-900 rounded-2xl p-5 border border-navy-200 dark:border-navy-800 shadow-sm space-y-4">
          <div className="flex flex-col lg:flex-row items-center justify-between gap-4">
            {/* Search Input */}
            <div className="relative w-full lg:w-96">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-navy-400" />
              <Input
                type="text"
                placeholder="Search producer, facility or source..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                className="pl-9 h-11 text-xs"
              />
            </div>

            {/* Source Category Pills */}
            <div className="flex flex-wrap items-center gap-1.5 w-full lg:w-auto">
              {SOURCE_FILTERS.map((s) => {
                const Icon = s.icon;
                const isSelected = selectedSource === s.value;
                return (
                  <button
                    key={s.value}
                    onClick={() => {
                      setSelectedSource(s.value);
                      setPage(1);
                    }}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition ${
                      isSelected
                        ? "bg-brand-600 text-white shadow-sm"
                        : "bg-navy-100 dark:bg-navy-800 text-navy-600 dark:text-navy-300 hover:bg-navy-200 dark:hover:bg-navy-700"
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    {s.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Granular Price & Sort Controls */}
          <div className="pt-3 border-t border-navy-100 dark:border-navy-800/60 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex flex-wrap items-center gap-3">
              <span className="font-bold text-navy-500 dark:text-navy-400 flex items-center gap-1">
                <SlidersHorizontal className="w-3.5 h-3.5" />
                Refine:
              </span>

              {/* Price Filter */}
              <div className="flex items-center gap-1.5">
                <Input
                  type="number"
                  step="0.000005"
                  placeholder="Min Price (ETH)"
                  value={minPrice}
                  onChange={(e) => {
                    setMinPrice(e.target.value);
                    setPage(1);
                  }}
                  className="w-28 h-8 text-[11px]"
                />
                <span className="text-navy-400">-</span>
                <Input
                  type="number"
                  step="0.000005"
                  placeholder="Max Price (ETH)"
                  value={maxPrice}
                  onChange={(e) => {
                    setMaxPrice(e.target.value);
                    setPage(1);
                  }}
                  className="w-28 h-8 text-[11px]"
                />
              </div>

              {/* Min Energy Filter */}
              <Input
                type="number"
                placeholder="Min kWh"
                value={minEnergy}
                onChange={(e) => {
                  setMinEnergy(e.target.value);
                  setPage(1);
                }}
                className="w-24 h-8 text-[11px]"
              />

              {(minPrice || maxPrice || minEnergy || search || selectedSource !== "ALL") && (
                <button
                  onClick={() => {
                    setMinPrice("");
                    setMaxPrice("");
                    setMinEnergy("");
                    setSearch("");
                    setSelectedSource("ALL");
                    setPage(1);
                  }}
                  className="text-xs text-brand-600 dark:text-brand-400 hover:underline font-semibold"
                >
                  Reset Filters
                </button>
              )}
            </div>

            {/* Sort Dropdown */}
            <div className="flex items-center gap-2 ml-auto">
              <span className="text-navy-400">Sort By:</span>
              <Select
                options={[
                  { value: "price_asc", label: "Lowest Price" },
                  { value: "price_desc", label: "Highest Price" },
                  { value: "quantity_desc", label: "Highest Available Energy" },
                  { value: "created_desc", label: "Newest Listings" },
                ]}
                value={sortBy}
                onChange={(e) => {
                  setSortBy(e.target.value);
                  setPage(1);
                }}
                className="h-8 text-xs min-w-[170px]"
              />
            </div>
          </div>
        </div>

        {/* Listings Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </div>
        ) : error ? (
          <ErrorState
            title="Failed to Load Marketplace"
            message={error}
            onRetry={fetchListings}
          />
        ) : listings.length === 0 ? (
          <div className="p-16 bg-white dark:bg-navy-900 rounded-3xl border border-navy-200 dark:border-navy-800 text-center">
            <EmptyState
              title="No Renewable Energy Listings Found"
              description="No active listings match your current search and filter criteria. Try adjusting your price thresholds or source selections."
              action={{
                label: "Clear All Filters",
                onClick: () => {
                  setMinPrice("");
                  setMaxPrice("");
                  setMinEnergy("");
                  setSearch("");
                  setSelectedSource("ALL");
                  setPage(1);
                },
              }}
            />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {listings.map((item) => {
              const SourceIcon = getSourceIcon(item.energy_source);
              const priceNum = parseFloat(item.price_per_kwh || item.unit_price_eth) || 0;
              const availKwh = Number(item.available_energy_kwh || item.available_kwh);
              const totalKwh = Number(item.total_energy_kwh || item.quantity_kwh || availKwh);
              const soldKwh = Math.max(0, totalKwh - availKwh);
              const pctAvailable = totalKwh > 0 ? (availKwh / totalKwh) * 100 : 100;

              // Cost examples
              const cost50 = (50 * priceNum).toFixed(6);
              const cost100 = (100 * priceNum).toFixed(6);

              return (
                <Card
                  key={item.id}
                  className="p-6 flex flex-col justify-between hover:border-brand-500/50 hover:shadow-lg transition-all duration-200"
                >
                  <div className="space-y-4">
                    {/* Top Header: Source & Status */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="p-2 rounded-xl bg-brand-50 dark:bg-brand-950/40 text-brand-600 dark:text-brand-400">
                          <SourceIcon className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-navy-900 dark:text-white">
                            {item.energy_source} Generation
                          </p>
                          <p className="font-mono text-[10px] text-navy-400">
                            Listing #{item.id}
                          </p>
                        </div>
                      </div>
                      <StatusBadge status={item.listing_status || "ACTIVE"} size="sm" />
                    </div>

                    {/* Producer Meta */}
                    <div className="bg-slate-50 dark:bg-navy-950/50 rounded-xl p-3 border border-navy-100 dark:border-navy-800/60">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-navy-900 dark:text-white">
                          {item.producer_name}
                        </span>
                        <span className="inline-flex items-center gap-1 font-bold text-brand-600 dark:text-brand-400 text-[11px]">
                          <ShieldCheck className="w-3.5 h-3.5" />
                          {item.reputation_score || 99.2}% Rep
                        </span>
                      </div>
                      {item.producer_wallet && (
                        <p className="font-mono text-[10px] text-navy-400 mt-1">
                          {item.producer_wallet.slice(0, 8)}...{item.producer_wallet.slice(-6)}
                        </p>
                      )}
                    </div>

                    {/* Capacity & Price Metrics */}
                    <div className="grid grid-cols-2 gap-2 pt-1">
                      <div>
                        <p className="text-[10px] uppercase font-bold text-navy-400">Available Capacity</p>
                        <p className="text-base font-extrabold text-navy-900 dark:text-white mt-0.5">
                          {availKwh.toLocaleString()} <span className="text-xs font-normal">kWh</span>
                        </p>
                      </div>
                      <div>
                        <p className="text-[10px] uppercase font-bold text-navy-400">Unit Price</p>
                        <p className="font-mono text-base font-extrabold text-brand-600 dark:text-brand-400 mt-0.5">
                          {priceNum} <span className="text-xs font-normal">ETH</span>
                        </p>
                      </div>
                    </div>

                    {/* Available Capacity Progress Bar */}
                    <div className="space-y-1">
                      <div className="flex justify-between text-[11px] text-navy-400">
                        <span>Available Capacity</span>
                        <span>{pctAvailable.toFixed(0)}% in Escrow</span>
                      </div>
                      <div className="h-1.5 w-full bg-navy-100 dark:bg-navy-800 rounded-full overflow-hidden">
                        <div
                          className="bg-brand-500 h-full rounded-full transition-all duration-300"
                          style={{ width: `${pctAvailable}%` }}
                        />
                      </div>
                    </div>

                    {/* Cost Preview Calculations */}
                    <div className="bg-navy-50/70 dark:bg-navy-800/40 rounded-xl p-2.5 text-[11px] text-navy-600 dark:text-navy-300 space-y-1">
                      <p className="font-bold text-navy-800 dark:text-navy-200">
                        Estimated Order Settlement:
                      </p>
                      <div className="flex justify-between font-mono">
                        <span>50 kWh order:</span>
                        <span className="font-bold">{cost50} ETH</span>
                      </div>
                      <div className="flex justify-between font-mono">
                        <span>100 kWh order:</span>
                        <span className="font-bold">{cost100} ETH</span>
                      </div>
                    </div>
                  </div>

                  {/* Card Actions */}
                  <div className="grid grid-cols-2 gap-2 pt-5 border-t border-navy-100 dark:border-navy-800 mt-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => router.push(`/marketplace/${item.id}`)}
                    >
                      View Details
                    </Button>
                    <Button
                      variant="primary"
                      size="sm"
                      icon={ArrowRight}
                      onClick={() => handleRequestEnergy(item.id)}
                    >
                      Request Energy
                    </Button>
                  </div>
                </Card>
              );
            })}
          </div>
        )}

        {/* Pagination */}
        {totalItems > 0 && (
          <div className="pt-4 flex justify-center">
            <Pagination
              currentPage={page}
              totalPages={totalPages}
              onPageChange={(p) => setPage(p)}
            />
          </div>
        )}
      </div>
    </PublicLayout>
  );
}
