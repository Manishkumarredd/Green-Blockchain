"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Zap,
  TrendingUp,
  Activity,
  ShoppingBag,
  Coins,
  ShieldCheck,
  Leaf,
  Sun,
  Wind,
  Droplets,
  ExternalLink,
  RefreshCw,
  Eye,
  CheckCircle2,
  AlertCircle,
  Clock,
  Layers,
  ArrowRight,
  Sliders,
  Sparkles,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { useApp } from "../common/AppContext";
import { consumersApi } from "../../services/api";
import { PageHeader } from "../ui/PageHeader";
import { StatisticCard } from "../ui/StatisticCard";
import { DataTable, Column } from "../ui/DataTable";
import { StatusBadge } from "../ui/StatusBadge";
import { ChartContainer } from "../ui/ChartContainer";
import { Button } from "../ui/Button";
import { Skeleton, SkeletonCard, SkeletonTable } from "../ui/LoadingSkeleton";
import { EmptyState } from "../ui/EmptyState";
import { ErrorState } from "../ui/ErrorState";

const DONUT_COLORS = ["#F59E0B", "#3B82F6", "#10B981", "#94A3B8"];

export const ConsumerDashboardView: React.FC = () => {
  const router = useRouter();
  const { addToast } = useApp();

  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Dashboard Stats State
  const [stats, setStats] = useState<any>(null);

  const fetchDashboardData = useCallback(async () => {
    try {
      setError(null);
      const res = await consumersApi.getDashboard();
      if (res && res.success) {
        setStats(res.data);
      } else {
        setError(res?.error || "Failed to load consumer dashboard data");
      }
    } catch (err: any) {
      console.error("Dashboard fetch error:", err);
      setError(err?.message || "An unexpected error occurred while loading dashboard metrics.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchDashboardData();
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <Skeleton className="h-10 w-64 rounded-xl" />
          <Skeleton className="h-10 w-36 rounded-xl" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Skeleton className="h-80 rounded-2xl" />
          <Skeleton className="h-80 rounded-2xl" />
        </div>
        <SkeletonTable rows={4} />
      </div>
    );
  }

  if (error) {
    return (
      <ErrorState
        title="Dashboard Unavailable"
        message={error}
        onRetry={fetchDashboardData}
      />
    );
  }

  const {
    totalPurchasedKwh = 0,
    totalAllocatedKwh = 0,
    pendingRequestsCount = 0,
    totalSpentEth = "0.00000000",
    totalSpentInr = "0.00",
    carbonSavedKg = 0,
    monthlyPurchases = [],
    requestStatusDistribution = [],
    recentRequests = [],
    recentPurchases = [],
    latestMarketplaceListings = [],
    treesEquivalent = 0,
  } = stats || {};

  // Recent Requests Table Columns
  const requestColumns: Column<any>[] = [
    {
      header: "Request ID",
      accessor: "id",
      cell: (row) => (
        <span className="font-mono text-xs font-bold text-navy-900 dark:text-white">
          #REQ-{row.id.toString().padStart(4, "0")}
        </span>
      ),
    },
    {
      header: "Source",
      accessor: "energy_source",
      cell: (row) => (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
          <Zap className="w-3.5 h-3.5 text-emerald-600" />
          {row.energy_source || "SOLAR"}
        </span>
      ),
    },
    {
      header: "Producer",
      accessor: "producer_name",
      cell: (row) => (
        <div>
          <p className="text-xs font-bold text-navy-900 dark:text-white">{row.producer_name || "Microgrid Pool"}</p>
          <p className="text-[10px] text-navy-400 font-mono">{row.producer_meter_id || "POOL-001"}</p>
        </div>
      ),
    },
    {
      header: "Requested / Allocated",
      accessor: "requested_energy_kwh",
      cell: (row) => (
        <div>
          <p className="text-xs font-bold text-navy-900 dark:text-white">
            {Number(row.requested_energy_kwh).toLocaleString()} kWh
          </p>
          <p className="text-[10px] text-navy-500 dark:text-navy-400">
            Allocated: {Number(row.allocated_energy_kwh || 0).toLocaleString()} kWh
          </p>
        </div>
      ),
    },
    {
      header: "Estimated Total",
      accessor: "estimated_total",
      cell: (row) => (
        <div>
          <p className="text-xs font-bold text-navy-900 dark:text-white">{row.estimated_total} ETH</p>
          <p className="text-[10px] text-navy-400">≈ ₹{Number(row.estimated_total_inr || 0).toLocaleString()}</p>
        </div>
      ),
    },
    {
      header: "Status",
      accessor: "status",
      cell: (row) => {
        const s = (row.status || "PENDING").toUpperCase();
        let variant: "warning" | "success" | "info" | "neutral" = "warning";
        if (s === "FULFILLED") variant = "success";
        else if (s === "MATCHED" || s === "PARTIALLY_MATCHED") variant = "info";
        else if (s === "CANCELLED") variant = "neutral";
        return <StatusBadge status={s} variant={variant} />;
      },
    },
    {
      header: "Actions",
      accessor: "actions",
      cell: (row) => (
        <Button
          variant="outline"
          size="sm"
          onClick={() => router.push(`/consumer/requests/${row.id}`)}
          leftIcon={<Eye className="w-3.5 h-3.5" />}
        >
          View
        </Button>
      ),
    },
  ];

  // Recent Purchases Table Columns
  const purchaseColumns: Column<any>[] = [
    {
      header: "Tx ID",
      accessor: "id",
      cell: (row) => (
        <span className="font-mono text-xs font-bold text-navy-900 dark:text-white">
          #TX-{row.id.toString().padStart(4, "0")}
        </span>
      ),
    },
    {
      header: "Producer",
      accessor: "producer_name",
      cell: (row) => (
        <span className="text-xs font-bold text-navy-900 dark:text-white">{row.producer_name}</span>
      ),
    },
    {
      header: "Clean Energy",
      accessor: "energy_quantity_kwh",
      cell: (row) => (
        <span className="text-xs font-extrabold text-brand-600 dark:text-brand-400">
          {Number(row.energy_quantity_kwh).toLocaleString()} kWh
        </span>
      ),
    },
    {
      header: "Price / kWh",
      accessor: "price_per_kwh",
      cell: (row) => <span className="text-xs font-mono text-navy-600 dark:text-navy-300">{row.price_per_kwh} ETH</span>,
    },
    {
      header: "Total Settled",
      accessor: "total_amount",
      cell: (row) => (
        <div>
          <span className="text-xs font-bold text-navy-900 dark:text-white">{row.total_amount} ETH</span>
          <p className="text-[10px] text-navy-400">≈ ₹{Number(row.total_amount_inr || 0).toLocaleString()}</p>
        </div>
      ),
    },
    {
      header: "CO₂ Avoided",
      accessor: "carbon_saved_kg",
      cell: (row) => (
        <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-600 dark:text-emerald-400">
          <Leaf className="w-3 h-3" />
          {row.carbon_saved_kg} kg
        </span>
      ),
    },
    {
      header: "Settlement",
      accessor: "status",
      cell: (row) => <StatusBadge status={row.status || "SETTLED"} variant="success" />,
    },
  ];

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Page Header */}
      <PageHeader
        title="Consumer Energy Hub"
        description="Monitor clean energy consumption, active demand requests, algorithmic allocations, and carbon reductions."
        action={
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              loading={refreshing}
              leftIcon={<RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`} />}
            >
              Refresh
            </Button>
            <Link href="/marketplace">
              <Button size="sm" leftIcon={<ShoppingBag className="w-4 h-4" />}>
                Browse Marketplace
              </Button>
            </Link>
          </div>
        }
      />

      {/* 5 Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <StatisticCard
          title="Total Energy Purchased"
          value={`${Number(totalPurchasedKwh).toLocaleString()} kWh`}
          icon={Zap}
          trend={{ value: 14.8, isPositive: true }}
          description="Settled green energy"
        />
        <StatisticCard
          title="Total Allocated"
          value={`${Number(totalAllocatedKwh).toLocaleString()} kWh`}
          icon={Sliders}
          trend={{ value: 9.2, isPositive: true }}
          description="Weighted proportional matching"
        />
        <StatisticCard
          title="Pending Requests"
          value={pendingRequestsCount}
          icon={Clock}
          description="Awaiting clearing cycle"
        />
        <StatisticCard
          title="Total Expenditure"
          value={`₹${Number(totalSpentInr).toLocaleString()}`}
          unit={`(${totalSpentEth} ETH)`}
          icon={Coins}
          trend={{ value: 6.5, isPositive: true }}
          description="Direct peer-to-peer settlement"
        />
        <StatisticCard
          title="Estimated CO₂ Savings"
          value={`${Number(carbonSavedKg).toLocaleString()} kg`}
          icon={Leaf}
          trend={{ value: 18.2, isPositive: true }}
          description={`≈ ${treesEquivalent} tree seedlings grown`}
        />
      </div>

      {/* Recharts Analytics Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Monthly Consumption & Expenditure (2 Columns) */}
        <div className="lg:col-span-2">
          <ChartContainer
            title="Clean Energy Consumption & Expenditure History"
            subtitle="Monthly breakdown of renewable energy purchased (kWh) vs. net spending (ETH)"
          >
            <div className="h-72 w-full pt-4">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={monthlyPurchases} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="kwhGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#16A34A" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#16A34A" stopOpacity={0.0} />
                    </linearGradient>
                    <linearGradient id="spendGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#0284C7" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#0284C7" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" opacity={0.6} />
                  <XAxis dataKey="month" stroke="#64748B" fontSize={12} tickLine={false} />
                  <YAxis
                    yAxisId="left"
                    stroke="#16A34A"
                    fontSize={12}
                    tickFormatter={(val) => `${val} kWh`}
                    tickLine={false}
                  />
                  <YAxis
                    yAxisId="right"
                    orientation="right"
                    stroke="#0284C7"
                    fontSize={12}
                    tickFormatter={(val) => `${val} ETH`}
                    tickLine={false}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#0F172A",
                      border: "none",
                      borderRadius: "12px",
                      color: "#fff",
                      fontSize: "12px",
                    }}
                  />
                  <Legend verticalAlign="top" height={36} />
                  <Area
                    yAxisId="left"
                    type="monotone"
                    dataKey="kwh"
                    name="Energy Consumed (kWh)"
                    stroke="#16A34A"
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill="url(#kwhGradient)"
                  />
                  <Area
                    yAxisId="right"
                    type="monotone"
                    dataKey="spendingEth"
                    name="Expenditure (ETH)"
                    stroke="#0284C7"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#spendGradient)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </ChartContainer>
        </div>

        {/* Request Status Distribution Donut Chart */}
        <div className="lg:col-span-1">
          <ChartContainer
            title="Request Status Distribution"
            subtitle="Current cycle breakdown of consumer demands"
          >
            <div className="h-72 w-full flex flex-col items-center justify-center">
              {requestStatusDistribution.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={requestStatusDistribution}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={90}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {requestStatusDistribution.map((entry: any, index: number) => (
                        <Cell key={`cell-${index}`} fill={entry.fill || DONUT_COLORS[index % DONUT_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#0F172A",
                        border: "none",
                        borderRadius: "8px",
                        color: "#fff",
                        fontSize: "12px",
                      }}
                    />
                    <Legend verticalAlign="bottom" height={36} iconType="circle" />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <EmptyState
                  title="No Requests"
                  description="Submit an energy request from the marketplace to track its status."
                />
              )}
            </div>
          </ChartContainer>
        </div>
      </div>

      {/* Carbon Savings Environmental Impact Card */}
      <div className="bg-gradient-to-br from-emerald-900 via-teal-900 to-navy-950 rounded-2xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 w-1/3 opacity-10 flex items-center justify-end pr-8 pointer-events-none">
          <Leaf className="w-64 h-64 text-emerald-300" />
        </div>

        <div className="relative z-10 max-w-3xl space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5" />
            Environmental Impact Indicator
          </div>
          <h3 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            You have avoided {Number(carbonSavedKg).toLocaleString()} kg of CO₂ emissions
          </h3>
          <p className="text-slate-300 text-sm leading-relaxed">
            By sourcing 100% certified renewable energy through GreenLedger, your microgrid facility reduces reliance on fossil-heavy regional power. Calculated against the 0.8200 kg CO₂/kWh grid baseline factor.
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 pt-2">
            <div className="bg-white/10 backdrop-blur-sm p-4 rounded-xl border border-white/10">
              <p className="text-xs text-slate-300 uppercase tracking-wider font-semibold">Tree Equivalent</p>
              <p className="text-2xl font-black text-emerald-300 mt-1">≈ {treesEquivalent} Trees</p>
              <p className="text-[11px] text-slate-400 mt-0.5">Annual absorption capacity</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm p-4 rounded-xl border border-white/10">
              <p className="text-xs text-slate-300 uppercase tracking-wider font-semibold">Coal Combustion Avoided</p>
              <p className="text-2xl font-black text-teal-300 mt-1">
                ≈ {(totalPurchasedKwh * 0.45).toFixed(0)} kg
              </p>
              <p className="text-[11px] text-slate-400 mt-0.5">Thermal power plant fuel</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm p-4 rounded-xl border border-white/10 col-span-2 sm:col-span-1">
              <p className="text-xs text-slate-300 uppercase tracking-wider font-semibold">Vehicle Travel Offset</p>
              <p className="text-2xl font-black text-sky-300 mt-1">
                ≈ {Math.round(carbonSavedKg / 0.192).toLocaleString()} km
              </p>
              <p className="text-[11px] text-slate-400 mt-0.5">Passenger car emissions</p>
            </div>
          </div>
        </div>
      </div>

      {/* Available Marketplace Listings Quick Preview */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-navy-900 dark:text-white">Active Clean Energy Offers</h3>
            <p className="text-xs text-navy-500 dark:text-navy-400">
              Real-time available capacity from verified local microgrid producers
            </p>
          </div>
          <Link href="/marketplace">
            <Button variant="ghost" size="sm" rightIcon={<ArrowRight className="w-4 h-4" />}>
              Explore Full Market
            </Button>
          </Link>
        </div>

        {latestMarketplaceListings.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {latestMarketplaceListings.map((listing: any) => (
              <div
                key={listing.id}
                className="bg-white dark:bg-navy-900/90 rounded-2xl p-5 border border-navy-200 dark:border-navy-800 shadow-card hover:shadow-card-hover transition flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-brand-50 text-brand-700 dark:bg-brand-950/60 dark:text-brand-300 border border-brand-200/60">
                      {listing.energy_source}
                    </span>
                    <span className="text-xs font-mono font-semibold text-navy-500">
                      #{listing.id}
                    </span>
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-navy-900 dark:text-white line-clamp-1">
                      {listing.producer_name}
                    </h4>
                    <p className="text-xs text-navy-400 mt-0.5 font-mono">
                      Available: {Number(listing.available_energy_kwh).toLocaleString()} kWh
                    </p>
                  </div>
                  <div className="pt-2 border-t border-navy-100 dark:border-navy-800">
                    <p className="text-[10px] uppercase font-bold text-navy-400">Unit Tariff</p>
                    <p className="text-lg font-black text-navy-900 dark:text-white">
                      {listing.price_per_kwh} ETH{" "}
                      <span className="text-xs font-normal text-navy-400">/ kWh</span>
                    </p>
                    <p className="text-[11px] text-navy-500">
                      ≈ ₹{(Number(listing.price_per_kwh) * 280000).toFixed(2)}/kWh
                    </p>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-navy-100 dark:border-navy-800 flex items-center justify-between gap-2">
                  <Link href={`/marketplace/${listing.id}`} className="w-full">
                    <Button variant="primary" size="sm" className="w-full">
                      Request Energy
                    </Button>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState
            title="No Active Listings"
            description="All listed energy has been fulfilled or cleared."
          />
        )}
      </div>

      {/* Recent Energy Requests Table */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-navy-900 dark:text-white">Recent Energy Demands</h3>
            <p className="text-xs text-navy-500 dark:text-navy-400">
              Active purchase requests submitted for double-auction matching
            </p>
          </div>
          <Link href="/consumer/requests">
            <Button variant="ghost" size="sm" rightIcon={<ArrowRight className="w-4 h-4" />}>
              View All Demands
            </Button>
          </Link>
        </div>

        {recentRequests.length > 0 ? (
          <DataTable data={recentRequests} columns={requestColumns} />
        ) : (
          <EmptyState
            title="No Demands Submitted"
            description="You have not submitted any energy requests yet. Choose an offer from the Clean Energy Market to start."
            action={{
              label: "Browse Marketplace",
              onClick: () => router.push("/marketplace"),
            }}
          />
        )}
      </div>

      {/* Recent Purchases Table */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-navy-900 dark:text-white">Settled Energy Purchases</h3>
            <p className="text-xs text-navy-500 dark:text-navy-400">
              Cryptographically verified trade settlements on Ethereum Sepolia
            </p>
          </div>
          <Link href="/consumer/purchases">
            <Button variant="ghost" size="sm" rightIcon={<ArrowRight className="w-4 h-4" />}>
              View All Transactions
            </Button>
          </Link>
        </div>

        {recentPurchases.length > 0 ? (
          <DataTable data={recentPurchases} columns={purchaseColumns} />
        ) : (
          <EmptyState
            title="No Settled Transactions"
            description="Purchases will appear here once an energy request clears the allocation engine and is settled."
          />
        )}
      </div>
    </div>
  );
};
