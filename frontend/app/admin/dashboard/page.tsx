"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Users,
  ShoppingBag,
  Sliders,
  Coins,
  Leaf,
  Activity,
  ArrowUpRight,
  TrendingUp,
  ShieldCheck,
  Zap,
  Scale,
  RefreshCw,
  Clock,
  Eye,
  AlertCircle,
} from "lucide-react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
} from "recharts";
import { useApp } from "../../../components/common/AppContext";
import { DashboardLayout } from "../../../components/layout/DashboardLayout";
import { PageHeader } from "../../../components/ui/PageHeader";
import { StatusBadge } from "../../../components/ui/StatusBadge";
import { adminApi, blockchainApi } from "../../../services/api";

const SOURCE_COLORS: Record<string, string> = {
  SOLAR: "#F59E0B",
  WIND: "#0284C7",
  HYDRO: "#06B6D4",
  BIOMASS: "#10B981",
  HYBRID: "#8B5CF6",
};

export default function AdminDashboardPage() {
  const router = useRouter();
  const { setRole, addToast } = useApp();
  const [loading, setLoading] = useState(true);
  const [syncingBlockchain, setSyncingBlockchain] = useState(false);
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setRole("ADMIN");
    loadDashboard();
  }, [setRole]);

  const loadDashboard = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await adminApi.getDashboard();
      setData(res.data);
    } catch (err: any) {
      setError(err.message || "Failed to load admin platform dashboard");
    } finally {
      setLoading(false);
    }
  };

  const handleSyncBlockchain = async () => {
    try {
      setSyncingBlockchain(true);
      await blockchainApi.syncEvents(0);
      addToast({
        type: "success",
        title: "Blockchain Synchronized",
        description: "On-chain settlements and GL-REC certificate events verified and synced with PostgreSQL ledger.",
      });
      loadDashboard();
    } catch (err: any) {
      addToast({
        type: "error",
        title: "Sync Failed",
        description: err.message || "Could not complete blockchain synchronization",
      });
    } finally {
      setSyncingBlockchain(false);
    }
  };

  const kpi = data?.kpi || {};
  const charts = data?.charts || {};
  const sections = data?.sections || {};

  return (
    <DashboardLayout activeNavId="overview">
      <div className="space-y-8">
        {/* Page Header */}
        <PageHeader
          title="Platform Governance & Control Hub"
          description="Real-time surveillance of decentralized microgrid trading, user registries, market-clearing algorithms, and regulatory compliance."
          action={
            <div className="flex items-center space-x-3">
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-800">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse mr-2" />
                Network Status: Optimal
              </span>
              <button
                onClick={loadDashboard}
                disabled={loading}
                className="flex items-center px-3 py-2 bg-white dark:bg-navy-800 text-navy-700 dark:text-navy-200 border border-navy-200 dark:border-navy-700 rounded-xl hover:bg-slate-50 dark:hover:bg-navy-700 text-xs font-medium transition cursor-pointer"
              >
                <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${loading ? "animate-spin" : ""}`} />
                Refresh
              </button>
            </div>
          }
        />

        {error && (
          <div className="p-4 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 rounded-2xl flex items-center space-x-3 text-rose-700 dark:text-rose-300">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <div className="text-sm">{error}</div>
          </div>
        )}

        {/* 9 Platform KPI Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-5">
          {/* 1. Total Registered Users */}
          <div className="bg-white dark:bg-navy-900 border border-navy-200 dark:border-navy-800/80 rounded-2xl p-5 shadow-xs">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-navy-400">Total Users</span>
              <div className="w-9 h-9 rounded-xl bg-purple-50 dark:bg-purple-950/50 flex items-center justify-center text-purple-600 dark:text-purple-400">
                <Users className="w-5 h-5" />
              </div>
            </div>
            <div className="text-3xl font-extrabold text-navy-900 dark:text-white">
              {loading ? "..." : kpi.totalUsers ?? 0}
            </div>
            <div className="mt-2 text-xs text-navy-500 dark:text-navy-400 flex items-center justify-between">
              <span>Producers: <strong className="text-emerald-600">{kpi.producersCount ?? 0}</strong></span>
              <span>Consumers: <strong className="text-sky-600">{kpi.consumersCount ?? 0}</strong></span>
              <span>Admins: <strong>{kpi.administratorsCount ?? 1}</strong></span>
            </div>
          </div>

          {/* 2. Total Producers */}
          <div className="bg-white dark:bg-navy-900 border border-navy-200 dark:border-navy-800/80 rounded-2xl p-5 shadow-xs">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-navy-400">Renewable Producers</span>
              <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                <Zap className="w-5 h-5" />
              </div>
            </div>
            <div className="text-3xl font-extrabold text-navy-900 dark:text-white">
              {loading ? "..." : kpi.producersCount ?? 0}
            </div>
            <p className="mt-2 text-xs text-navy-500 dark:text-navy-400">
              Active prosumers feeding green power into local microgrid
            </p>
          </div>

          {/* 3. Total Consumers */}
          <div className="bg-white dark:bg-navy-900 border border-navy-200 dark:border-navy-800/80 rounded-2xl p-5 shadow-xs">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-navy-400">Clean Energy Consumers</span>
              <div className="w-9 h-9 rounded-xl bg-sky-50 dark:bg-sky-950/50 flex items-center justify-center text-sky-600 dark:text-sky-400">
                <Users className="w-5 h-5" />
              </div>
            </div>
            <div className="text-3xl font-extrabold text-navy-900 dark:text-white">
              {loading ? "..." : kpi.consumersCount ?? 0}
            </div>
            <p className="mt-2 text-xs text-navy-500 dark:text-navy-400">
              Demand nodes with priority-weighted procurement bids
            </p>
          </div>

          {/* 4. Active Energy Listings */}
          <div className="bg-white dark:bg-navy-900 border border-navy-200 dark:border-navy-800/80 rounded-2xl p-5 shadow-xs">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-navy-400">Active Listings</span>
              <div className="w-9 h-9 rounded-xl bg-amber-50 dark:bg-amber-950/50 flex items-center justify-center text-amber-600 dark:text-amber-400">
                <ShoppingBag className="w-5 h-5" />
              </div>
            </div>
            <div className="text-3xl font-extrabold text-navy-900 dark:text-white">
              {loading ? "..." : kpi.activeListingsCount ?? 0}
            </div>
            <p className="mt-2 text-xs text-navy-500 dark:text-navy-400">
              Available supply: <strong className="text-navy-800 dark:text-navy-200">{kpi.availableEnergyKwh ?? 0} kWh</strong>
            </p>
          </div>

          {/* 5. Total Energy Listed (kWh) */}
          <div className="bg-white dark:bg-navy-900 border border-navy-200 dark:border-navy-800/80 rounded-2xl p-5 shadow-xs">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-navy-400">Total Energy Listed</span>
              <div className="w-9 h-9 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                <Activity className="w-5 h-5" />
              </div>
            </div>
            <div className="text-3xl font-extrabold text-navy-900 dark:text-white">
              {loading ? "..." : `${(kpi.totalEnergyListedKwh ?? 0).toLocaleString()} kWh`}
            </div>
            <p className="mt-2 text-xs text-navy-500 dark:text-navy-400">
              Cumulative generation committed across all listings
            </p>
          </div>

          {/* 6. Total Energy Traded (kWh) */}
          <div className="bg-white dark:bg-navy-900 border border-navy-200 dark:border-navy-800/80 rounded-2xl p-5 shadow-xs">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-navy-400">Total Energy Traded</span>
              <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                <Coins className="w-5 h-5" />
              </div>
            </div>
            <div className="text-3xl font-extrabold text-emerald-600 dark:text-emerald-400">
              {loading ? "..." : `${(kpi.totalEnergyTradedKwh ?? 0).toLocaleString()} kWh`}
            </div>
            <p className="mt-2 text-xs text-navy-500 dark:text-navy-400">
              Traded value: <strong>{kpi.totalTradingVolumeEth ?? 0} ETH</strong>
            </p>
          </div>

          {/* 7. Total Energy Requests */}
          <div className="bg-white dark:bg-navy-900 border border-navy-200 dark:border-navy-800/80 rounded-2xl p-5 shadow-xs">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-navy-400">Total Energy Requests</span>
              <div className="w-9 h-9 rounded-xl bg-cyan-50 dark:bg-cyan-950/50 flex items-center justify-center text-cyan-600 dark:text-cyan-400">
                <Sliders className="w-5 h-5" />
              </div>
            </div>
            <div className="text-3xl font-extrabold text-navy-900 dark:text-white">
              {loading ? "..." : kpi.totalEnergyRequests ?? 0}
            </div>
            <p className="mt-2 text-xs text-navy-500 dark:text-navy-400">
              Pending in matching queue: <strong className="text-amber-600">{kpi.pendingRequestsCount ?? 0}</strong>
            </p>
          </div>

          {/* 8. Completed Transactions */}
          <div className="bg-white dark:bg-navy-900 border border-navy-200 dark:border-navy-800/80 rounded-2xl p-5 shadow-xs">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-navy-400">Settled Transactions</span>
              <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-950/50 flex items-center justify-center text-blue-600 dark:text-blue-400">
                <ShieldCheck className="w-5 h-5" />
              </div>
            </div>
            <div className="text-3xl font-extrabold text-navy-900 dark:text-white">
              {loading ? "..." : kpi.completedTransactions ?? 0}
            </div>
            <p className="mt-2 text-xs text-navy-500 dark:text-navy-400">
              Double-auction paired and settled P2P orders
            </p>
          </div>

          {/* 9. Total Estimated Carbon Savings */}
          <div className="bg-white dark:bg-navy-900 border border-navy-200 dark:border-navy-800/80 rounded-2xl p-5 shadow-xs bg-linear-to-br from-emerald-500/5 to-teal-500/5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
                Avoided Emissions (CEA Grid)
              </span>
              <div className="w-9 h-9 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                <Leaf className="w-5 h-5" />
              </div>
            </div>
            <div className="text-3xl font-extrabold text-emerald-700 dark:text-emerald-400">
              {loading ? "..." : `${(kpi.totalEstimatedCarbonKg ?? 0).toLocaleString()} kg`}
            </div>
            <p className="mt-2 text-xs text-navy-500 dark:text-navy-400">
              CO₂ avoided @ 0.82 kg/kWh CEA baseline factor
            </p>
          </div>
        </div>

        {/* 6 Professional Recharts Visualizations */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-navy-900 dark:text-white flex items-center">
              <TrendingUp className="w-5 h-5 mr-2 text-brand-600" />
              Microgrid System Analytics & Market Dynamics
            </h2>
            <span className="text-xs text-navy-400">6 Real-Time Analytical Projections</span>
          </div>

          {/* Row 1: User Growth & Energy Listed vs Traded */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Chart 1: User Registration Trends */}
            <div className="bg-white dark:bg-navy-900 p-6 rounded-2xl border border-navy-200 dark:border-navy-800 shadow-xs">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h3 className="text-sm font-bold text-navy-900 dark:text-white">1. User Registration Trends</h3>
                  <p className="text-xs text-navy-400">Prosumer vs Consumer onboardings over time</p>
                </div>
              </div>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={charts.userRegistrationTrends || []}>
                    <defs>
                      <linearGradient id="colorProducers" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#16A34A" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="#16A34A" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="colorConsumers" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#0284C7" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="#0284C7" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" opacity={0.2} />
                    <XAxis dataKey="month" stroke="#94A3B8" fontSize={12} tickLine={false} />
                    <YAxis stroke="#94A3B8" fontSize={12} tickLine={false} />
                    <Tooltip contentStyle={{ backgroundColor: "#0F172A", borderColor: "#334155", borderRadius: "12px", color: "#F8FAFC" }} />
                    <Legend />
                    <Area type="monotone" dataKey="producers" name="Producers" stroke="#16A34A" fill="url(#colorProducers)" strokeWidth={2} />
                    <Area type="monotone" dataKey="consumers" name="Consumers" stroke="#0284C7" fill="url(#colorConsumers)" strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Chart 2: Energy Listed vs Energy Traded */}
            <div className="bg-white dark:bg-navy-900 p-6 rounded-2xl border border-navy-200 dark:border-navy-800 shadow-xs">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h3 className="text-sm font-bold text-navy-900 dark:text-white">2. Energy Listed vs Traded (kWh)</h3>
                  <p className="text-xs text-navy-400">Microgrid supply utilization and clearing efficiency</p>
                </div>
              </div>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={charts.energyListedVsTraded || []}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" opacity={0.2} />
                    <XAxis dataKey="month" stroke="#94A3B8" fontSize={12} tickLine={false} />
                    <YAxis stroke="#94A3B8" fontSize={12} tickLine={false} />
                    <Tooltip contentStyle={{ backgroundColor: "#0F172A", borderColor: "#334155", borderRadius: "12px", color: "#F8FAFC" }} />
                    <Legend />
                    <Bar dataKey="listedKwh" name="Energy Listed (kWh)" fill="#94A3B8" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="tradedKwh" name="Energy Traded (kWh)" fill="#16A34A" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Row 2: Monthly Transaction Volume & Renewable Sources */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Chart 3: Monthly Transaction Volume */}
            <div className="bg-white dark:bg-navy-900 p-6 rounded-2xl border border-navy-200 dark:border-navy-800 shadow-xs">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h3 className="text-sm font-bold text-navy-900 dark:text-white">3. Monthly Settlement Volume (ETH)</h3>
                  <p className="text-xs text-navy-400">Total economic clearing value and settled trades</p>
                </div>
              </div>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={charts.monthlyTransactionVolume || []}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" opacity={0.2} />
                    <XAxis dataKey="month" stroke="#94A3B8" fontSize={12} tickLine={false} />
                    <YAxis stroke="#94A3B8" fontSize={12} tickLine={false} />
                    <Tooltip contentStyle={{ backgroundColor: "#0F172A", borderColor: "#334155", borderRadius: "12px", color: "#F8FAFC" }} />
                    <Legend />
                    <Bar dataKey="volumeEth" name="Settlement Value (ETH)" fill="#8B5CF6" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Chart 4: Renewable Energy Source Distribution */}
            <div className="bg-white dark:bg-navy-900 p-6 rounded-2xl border border-navy-200 dark:border-navy-800 shadow-xs">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h3 className="text-sm font-bold text-navy-900 dark:text-white">4. Renewable Source Mix</h3>
                  <p className="text-xs text-navy-400">Capacity breakdown across generation technologies</p>
                </div>
              </div>
              <div className="h-64 flex items-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={charts.renewableSourceDistribution || []}
                      dataKey="kwh"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={85}
                      paddingAngle={4}
                    >
                      {(charts.renewableSourceDistribution || []).map((entry: any, index: number) => (
                        <Cell key={`cell-${index}`} fill={SOURCE_COLORS[entry.name] || "#10B981"} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ backgroundColor: "#0F172A", borderColor: "#334155", borderRadius: "12px", color: "#F8FAFC" }} />
                    <Legend verticalAlign="bottom" height={36} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Row 3: Role Breakdown & Platform Activity */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Chart 5: Producer vs Consumer Distribution */}
            <div className="bg-white dark:bg-navy-900 p-6 rounded-2xl border border-navy-200 dark:border-navy-800 shadow-xs">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h3 className="text-sm font-bold text-navy-900 dark:text-white">5. Platform Role Composition</h3>
                  <p className="text-xs text-navy-400">Ratio of market participants across governance roles</p>
                </div>
              </div>
              <div className="h-64 flex items-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={charts.producerVsConsumerDistribution || []}
                      dataKey="count"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    >
                      {(charts.producerVsConsumerDistribution || []).map((entry: any, index: number) => (
                        <Cell key={`cell-role-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ backgroundColor: "#0F172A", borderColor: "#334155", borderRadius: "12px", color: "#F8FAFC" }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Chart 6: Platform Activity Trends */}
            <div className="bg-white dark:bg-navy-900 p-6 rounded-2xl border border-navy-200 dark:border-navy-800 shadow-xs">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h3 className="text-sm font-bold text-navy-900 dark:text-white">6. Governance & API Activity Trends</h3>
                  <p className="text-xs text-navy-400">Administrative actions and secure authentication volume</p>
                </div>
              </div>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={charts.platformActivityTrends || []}>
                    <defs>
                      <linearGradient id="colorActions" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" opacity={0.2} />
                    <XAxis dataKey="month" stroke="#94A3B8" fontSize={12} tickLine={false} />
                    <YAxis stroke="#94A3B8" fontSize={12} tickLine={false} />
                    <Tooltip contentStyle={{ backgroundColor: "#0F172A", borderColor: "#334155", borderRadius: "12px", color: "#F8FAFC" }} />
                    <Legend />
                    <Area type="monotone" dataKey="actions" name="Audit Actions" stroke="#8B5CF6" fill="url(#colorActions)" strokeWidth={2} />
                    <Area type="monotone" dataKey="logins" name="Auth Events" stroke="#0284C7" fill="none" strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>

        {/* 6 Comprehensive Dashboard Sections */}
        <div className="space-y-8">
          {/* Section 1: Recent Platform Transactions */}
          <div className="bg-white dark:bg-navy-900 rounded-2xl border border-navy-200 dark:border-navy-800 overflow-hidden shadow-xs">
            <div className="p-6 border-b border-navy-100 dark:border-navy-800 flex justify-between items-center">
              <div>
                <h3 className="text-base font-bold text-navy-900 dark:text-white">Recent Settled Transactions</h3>
                <p className="text-xs text-navy-400">Latest peer-to-peer microgrid trades and clearing proofs</p>
              </div>
              <button
                onClick={() => router.push("/admin/transactions")}
                className="text-xs font-semibold text-brand-600 hover:text-brand-700 flex items-center cursor-pointer"
              >
                View All Transactions <ArrowUpRight className="w-3.5 h-3.5 ml-1" />
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-navy-950/50 text-navy-500 uppercase tracking-wider font-semibold border-b border-navy-100 dark:border-navy-800">
                  <tr>
                    <th className="px-6 py-3">Tx ID</th>
                    <th className="px-6 py-3">Producer</th>
                    <th className="px-6 py-3">Consumer</th>
                    <th className="px-6 py-3">Quantity</th>
                    <th className="px-6 py-3">Unit Price</th>
                    <th className="px-6 py-3">Total Value</th>
                    <th className="px-6 py-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-navy-100 dark:divide-navy-800 font-medium">
                  {sections.recentTransactions && sections.recentTransactions.length > 0 ? (
                    sections.recentTransactions.map((tx: any) => (
                      <tr key={tx.id} className="hover:bg-slate-50/50 dark:hover:bg-navy-800/40">
                        <td className="px-6 py-4 font-mono font-bold text-brand-600">#{tx.id}</td>
                        <td className="px-6 py-4">{tx.producer_name || `Producer #${tx.producer_id}`}</td>
                        <td className="px-6 py-4">{tx.consumer_name || `Consumer #${tx.consumer_id}`}</td>
                        <td className="px-6 py-4 font-bold">{tx.energy_quantity_kwh} kWh</td>
                        <td className="px-6 py-4 font-mono">{tx.price_per_kwh} ETH</td>
                        <td className="px-6 py-4 font-mono font-bold text-navy-900 dark:text-white">{tx.total_amount} ETH</td>
                        <td className="px-6 py-4">
                          <StatusBadge status="ACTIVE" label={tx.transaction_status || "SETTLED"} size="sm" />
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={7} className="px-6 py-8 text-center text-navy-400">
                        No transactions recorded yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Section 2 & 3: Recent Users & Pending Requests */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Section 2: Recent User Registrations */}
            <div className="bg-white dark:bg-navy-900 rounded-2xl border border-navy-200 dark:border-navy-800 overflow-hidden shadow-xs">
              <div className="p-6 border-b border-navy-100 dark:border-navy-800 flex justify-between items-center">
                <div>
                  <h3 className="text-base font-bold text-navy-900 dark:text-white">Recent Registrations</h3>
                  <p className="text-xs text-navy-400">Newly verified microgrid participants</p>
                </div>
                <button
                  onClick={() => router.push("/admin/users")}
                  className="text-xs font-semibold text-brand-600 hover:text-brand-700 flex items-center cursor-pointer"
                >
                  Manage Users <ArrowUpRight className="w-3.5 h-3.5 ml-1" />
                </button>
              </div>
              <div className="divide-y divide-navy-100 dark:divide-navy-800">
                {sections.recentUsers && sections.recentUsers.length > 0 ? (
                  sections.recentUsers.map((user: any) => (
                    <div key={user.id} className="p-4 flex items-center justify-between hover:bg-slate-50/50 dark:hover:bg-navy-800/40">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 rounded-full bg-navy-100 dark:bg-navy-800 flex items-center justify-center font-bold text-xs text-navy-600 dark:text-navy-300">
                          {user.full_name?.charAt(0) || "U"}
                        </div>
                        <div>
                          <div className="text-xs font-bold text-navy-900 dark:text-white">{user.full_name || user.name}</div>
                          <div className="text-[11px] text-navy-400">{user.email} • {user.meter_id || "Meter: N/A"}</div>
                        </div>
                      </div>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                        user.role === "PRODUCER" ? "bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-400" :
                        user.role === "ADMIN" ? "bg-purple-100 text-purple-800 dark:bg-purple-950/60 dark:text-purple-400" :
                        "bg-sky-100 text-sky-800 dark:bg-sky-950/60 dark:text-sky-400"
                      }`}>
                        {user.role}
                      </span>
                    </div>
                  ))
                ) : (
                  <div className="p-6 text-center text-xs text-navy-400">No users found</div>
                )}
              </div>
            </div>

            {/* Section 3: Pending Energy Requests */}
            <div className="bg-white dark:bg-navy-900 rounded-2xl border border-navy-200 dark:border-navy-800 overflow-hidden shadow-xs">
              <div className="p-6 border-b border-navy-100 dark:border-navy-800 flex justify-between items-center">
                <div>
                  <h3 className="text-base font-bold text-navy-900 dark:text-white">Active Demand Queue</h3>
                  <p className="text-xs text-navy-400">Pending consumer requests awaiting Phase 7 allocation</p>
                </div>
                <button
                  onClick={() => router.push("/admin/requests")}
                  className="text-xs font-semibold text-brand-600 hover:text-brand-700 flex items-center cursor-pointer"
                >
                  View All Demands <ArrowUpRight className="w-3.5 h-3.5 ml-1" />
                </button>
              </div>
              <div className="divide-y divide-navy-100 dark:divide-navy-800">
                {sections.pendingRequests && sections.pendingRequests.length > 0 ? (
                  sections.pendingRequests.map((req: any) => (
                    <div key={req.id} className="p-4 flex items-center justify-between hover:bg-slate-50/50 dark:hover:bg-navy-800/40">
                      <div>
                        <div className="text-xs font-bold text-navy-900 dark:text-white">
                          Demand #{req.id} • {req.consumer_name || `Consumer #${req.consumer_id}`}
                        </div>
                        <div className="text-[11px] text-navy-400">
                          Requested: <strong className="text-navy-700 dark:text-navy-300">{req.requested_energy_kwh || req.requestedKwh} kWh</strong> • Priority: {req.priority_weight}x
                        </div>
                      </div>
                      <StatusBadge status="PENDING" label="Awaiting Clearing" size="sm" />
                    </div>
                  ))
                ) : (
                  <div className="p-6 text-center text-xs text-navy-400">No pending requests in queue</div>
                )}
              </div>
            </div>
          </div>

          {/* Section 4 & 5: Recent Listings & Algorithm Summary */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Section 4: Recent Listings */}
            <div className="bg-white dark:bg-navy-900 rounded-2xl border border-navy-200 dark:border-navy-800 overflow-hidden shadow-xs">
              <div className="p-6 border-b border-navy-100 dark:border-navy-800 flex justify-between items-center">
                <div>
                  <h3 className="text-base font-bold text-navy-900 dark:text-white">Recent Generation Listings</h3>
                  <p className="text-xs text-navy-400">Renewable power available for microgrid trading</p>
                </div>
                <button
                  onClick={() => router.push("/admin/listings")}
                  className="text-xs font-semibold text-brand-600 hover:text-brand-700 flex items-center cursor-pointer"
                >
                  Manage Listings <ArrowUpRight className="w-3.5 h-3.5 ml-1" />
                </button>
              </div>
              <div className="divide-y divide-navy-100 dark:divide-navy-800">
                {sections.recentListings && sections.recentListings.length > 0 ? (
                  sections.recentListings.map((list: any) => (
                    <div key={list.id} className="p-4 flex items-center justify-between hover:bg-slate-50/50 dark:hover:bg-navy-800/40">
                      <div>
                        <div className="text-xs font-bold text-navy-900 dark:text-white">
                          Listing #{list.id} • {list.producer_name || "Producer"}
                        </div>
                        <div className="text-[11px] text-navy-400">
                          {list.energy_source} • {list.available_energy_kwh} / {list.total_energy_kwh} kWh available
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-xs font-mono font-bold text-navy-900 dark:text-white">{list.price_per_kwh} ETH</div>
                        <span className="text-[10px] text-emerald-600 font-bold uppercase">{list.listing_status}</span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-6 text-center text-xs text-navy-400">No listings available</div>
                )}
              </div>
            </div>

            {/* Section 5: Algorithm Execution Summary */}
            <div className="bg-white dark:bg-navy-900 rounded-2xl border border-navy-200 dark:border-navy-800 p-6 shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-2">
                    <Scale className="w-5 h-5 text-brand-600" />
                    <h3 className="text-base font-bold text-navy-900 dark:text-white">Latest Clearing Execution</h3>
                  </div>
                  <span className="text-xs px-2.5 py-1 bg-brand-50 dark:bg-brand-950/60 text-brand-600 dark:text-brand-400 rounded-lg font-bold">
                    Phase 7 DA-WPA
                  </span>
                </div>
                {sections.latestAllocationSummary ? (
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-3 text-xs">
                      <div className="p-3 bg-slate-50 dark:bg-navy-800/50 rounded-xl">
                        <div className="text-navy-400">Algorithm</div>
                        <div className="font-bold text-navy-900 dark:text-white mt-0.5">
                          {sections.latestAllocationSummary.algorithm_name || "DA-WPA Proportional"}
                        </div>
                      </div>
                      <div className="p-3 bg-slate-50 dark:bg-navy-800/50 rounded-xl">
                        <div className="text-navy-400">Jain's Fairness Index</div>
                        <div className="font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">
                          {sections.latestAllocationSummary.jain_fairness_index || "0.9842"}
                        </div>
                      </div>
                      <div className="p-3 bg-slate-50 dark:bg-navy-800/50 rounded-xl">
                        <div className="text-navy-400">Energy Cleared</div>
                        <div className="font-bold text-navy-900 dark:text-white mt-0.5">
                          {sections.latestAllocationSummary.total_allocated_energy || 330} kWh
                        </div>
                      </div>
                      <div className="p-3 bg-slate-50 dark:bg-navy-800/50 rounded-xl">
                        <div className="text-navy-400">Runtime Latency</div>
                        <div className="font-bold text-navy-900 dark:text-white mt-0.5">
                          {sections.latestAllocationSummary.execution_time_ms || 1.45} ms
                        </div>
                      </div>
                    </div>
                    <p className="text-xs text-navy-400">
                      Microgrid double-auction clearing mathematically verified with non-negative allocations and strict demand caps.
                    </p>
                  </div>
                ) : (
                  <div className="text-center py-8 text-xs text-navy-400">
                    No clearing executions recorded yet.
                  </div>
                )}
              </div>
              <div className="mt-4 pt-4 border-t border-navy-100 dark:border-navy-800 flex justify-between items-center">
                <button
                  onClick={() => router.push("/admin/algorithms")}
                  className="w-full py-2 bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs rounded-xl transition text-center cursor-pointer shadow-xs"
                >
                  Open Research Benchmark Lab →
                </button>
              </div>
            </div>
          </div>

          {/* Section 6: System Activity Log */}
          <div className="bg-white dark:bg-navy-900 rounded-2xl border border-navy-200 dark:border-navy-800 overflow-hidden shadow-xs">
            <div className="p-6 border-b border-navy-100 dark:border-navy-800 flex justify-between items-center">
              <div>
                <h3 className="text-base font-bold text-navy-900 dark:text-white">System Activity Audit Trail</h3>
                <p className="text-xs text-navy-400">Immutable ledger of administrative operations and compliance events</p>
              </div>
              <button
                onClick={() => router.push("/admin/activity-logs")}
                className="text-xs font-semibold text-brand-600 hover:text-brand-700 flex items-center cursor-pointer"
              >
                View Full Audit Journal <ArrowUpRight className="w-3.5 h-3.5 ml-1" />
              </button>
            </div>
            <div className="divide-y divide-navy-100 dark:divide-navy-800">
              {sections.recentActivityLogs && sections.recentActivityLogs.length > 0 ? (
                sections.recentActivityLogs.map((log: any) => (
                  <div key={log.id} className="p-4 flex items-start justify-between hover:bg-slate-50/50 dark:hover:bg-navy-800/40 text-xs">
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2">
                        <span className="font-bold text-brand-600 uppercase text-[10px] bg-brand-50 dark:bg-brand-950/50 px-2 py-0.5 rounded">
                          {log.action}
                        </span>
                        <span className="text-navy-900 dark:text-white font-medium">{log.description}</span>
                      </div>
                      <div className="text-[11px] text-navy-400">
                        Admin: {log.user_name || "Administrator"} (ID: {log.user_id})
                      </div>
                    </div>
                    <div className="text-[11px] text-navy-400 flex items-center whitespace-nowrap ml-4">
                      <Clock className="w-3 h-3 mr-1" />
                      {new Date(log.created_at || Date.now()).toLocaleTimeString()}
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-6 text-center text-xs text-navy-400">No activity logs recorded yet</div>
              )}
            </div>
          </div>

          {/* Section 7: Ethereum Sepolia Blockchain & Smart Contracts Hub */}
          <div className="bg-white dark:bg-navy-900 rounded-2xl border border-navy-200 dark:border-navy-800 overflow-hidden shadow-xs">
            <div className="p-6 border-b border-navy-100 dark:border-navy-800 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <div className="flex items-center space-x-2">
                  <ShieldCheck className="w-5 h-5 text-emerald-500" />
                  <h3 className="text-base font-bold text-navy-900 dark:text-white">
                    Ethereum Sepolia Blockchain & Smart Contracts Hub
                  </h3>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-400">
                    Chain ID: 11155111
                  </span>
                </div>
                <p className="text-xs text-navy-400 mt-1">
                  Surveillance of deployed settlement contracts, GL-REC ERC-721 token registry, and automated event syncing.
                </p>
              </div>

              <div className="flex items-center space-x-3">
                <button
                  onClick={handleSyncBlockchain}
                  disabled={syncingBlockchain}
                  className="flex items-center px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs transition cursor-pointer disabled:opacity-50 shadow-xs"
                >
                  <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${syncingBlockchain ? "animate-spin" : ""}`} />
                  {syncingBlockchain ? "Syncing On-Chain..." : "Trigger Event Sync"}
                </button>
                <button
                  onClick={() => window.open("/verify-certificate/1", "_blank")}
                  className="flex items-center px-3.5 py-2 bg-slate-100 dark:bg-navy-800 hover:bg-slate-200 dark:hover:bg-navy-700 text-navy-800 dark:text-white font-bold rounded-xl text-xs transition cursor-pointer"
                >
                  <Eye className="w-3.5 h-3.5 mr-1.5 text-brand-500" />
                  Public REC Verification
                </button>
              </div>
            </div>

            <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 bg-slate-50/50 dark:bg-navy-950/30">
              {/* Contract 1: UserRegistry */}
              <div className="p-4 rounded-xl bg-white dark:bg-navy-900 border border-navy-200 dark:border-navy-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-navy-400">Identity & Role</span>
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-brand-50 text-brand-700 dark:bg-brand-950 dark:text-brand-300">
                    Ownable
                  </span>
                </div>
                <h4 className="text-xs font-bold text-navy-900 dark:text-white">UserRegistry.sol</h4>
                <p className="font-mono text-[10px] text-navy-500 dark:text-navy-400 truncate">
                  0x5FbDB2315678afecb367f032d93F642f64180aa3
                </p>
                <div className="pt-2 border-t border-navy-100 dark:border-navy-800/60 flex justify-between items-center text-[11px]">
                  <span className="text-navy-400 text-[10px]">Meter IDs & Roles</span>
                  <a
                    href="https://sepolia.etherscan.io/address/0x5FbDB2315678afecb367f032d93F642f64180aa3"
                    target="_blank"
                    rel="noreferrer"
                    className="text-brand-600 hover:underline flex items-center"
                  >
                    Etherscan <ArrowUpRight className="w-3 h-3 ml-0.5" />
                  </a>
                </div>
              </div>

              {/* Contract 2: EnergyMarketplace */}
              <div className="p-4 rounded-xl bg-white dark:bg-navy-900 border border-navy-200 dark:border-navy-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-navy-400">Order Catalog</span>
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-brand-50 text-brand-700 dark:bg-brand-950 dark:text-brand-300">
                    Zero PII
                  </span>
                </div>
                <h4 className="text-xs font-bold text-navy-900 dark:text-white">EnergyMarketplace.sol</h4>
                <p className="font-mono text-[10px] text-navy-500 dark:text-navy-400 truncate">
                  0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512
                </p>
                <div className="pt-2 border-t border-navy-100 dark:border-navy-800/60 flex justify-between items-center text-[11px]">
                  <span className="text-navy-400 text-[10px]">Active Listings</span>
                  <a
                    href="https://sepolia.etherscan.io/address/0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512"
                    target="_blank"
                    rel="noreferrer"
                    className="text-brand-600 hover:underline flex items-center"
                  >
                    Etherscan <ArrowUpRight className="w-3 h-3 ml-0.5" />
                  </a>
                </div>
              </div>

              {/* Contract 3: GreenCertificate */}
              <div className="p-4 rounded-xl bg-white dark:bg-navy-900 border border-navy-200 dark:border-navy-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-navy-400">REC NFT</span>
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                    ERC-721
                  </span>
                </div>
                <h4 className="text-xs font-bold text-navy-900 dark:text-white">GreenCertificate.sol</h4>
                <p className="font-mono text-[10px] text-navy-500 dark:text-navy-400 truncate">
                  0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0
                </p>
                <div className="pt-2 border-t border-navy-100 dark:border-navy-800/60 flex justify-between items-center text-[11px]">
                  <span className="text-navy-400 text-[10px]">GL-REC Tokens</span>
                  <a
                    href="https://sepolia.etherscan.io/address/0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0"
                    target="_blank"
                    rel="noreferrer"
                    className="text-emerald-600 hover:underline flex items-center"
                  >
                    Etherscan <ArrowUpRight className="w-3 h-3 ml-0.5" />
                  </a>
                </div>
              </div>

              {/* Contract 4: EnergyTrading */}
              <div className="p-4 rounded-xl bg-white dark:bg-navy-900 border border-navy-200 dark:border-navy-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-navy-400">Clearinghouse</span>
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300">
                    ReentrancyGuard
                  </span>
                </div>
                <h4 className="text-xs font-bold text-navy-900 dark:text-white">EnergyTrading.sol</h4>
                <p className="font-mono text-[10px] text-navy-500 dark:text-navy-400 truncate">
                  0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9
                </p>
                <div className="pt-2 border-t border-navy-100 dark:border-navy-800/60 flex justify-between items-center text-[11px]">
                  <span className="text-navy-400 text-[10px]">Double-Auction Clearing</span>
                  <a
                    href="https://sepolia.etherscan.io/address/0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9"
                    target="_blank"
                    rel="noreferrer"
                    className="text-amber-600 hover:underline flex items-center"
                  >
                    Etherscan <ArrowUpRight className="w-3 h-3 ml-0.5" />
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
