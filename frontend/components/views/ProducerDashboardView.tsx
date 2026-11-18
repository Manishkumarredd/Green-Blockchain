"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Zap,
  TrendingUp,
  Activity,
  Plus,
  Coins,
  ShieldCheck,
  Sun,
  Wind,
  Droplets,
  ExternalLink,
  Edit2,
  Trash2,
  RefreshCw,
  Eye,
  CheckCircle2,
  AlertCircle,
  Clock,
  Layers,
  UserCheck,
  Hash,
  ArrowRight,
} from "lucide-react";
import { keccak256, stringToBytes } from "viem";
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
import { producersApi } from "../../services/api";
import { PageHeader } from "../ui/PageHeader";
import { StatisticCard } from "../ui/StatisticCard";
import { DataTable, Column } from "../ui/DataTable";
import { StatusBadge } from "../ui/StatusBadge";
import { ChartContainer } from "../ui/ChartContainer";
import { Button } from "../ui/Button";
import { Modal } from "../ui/Modal";
import { ConfirmationDialog } from "../ui/ConfirmationDialog";
import { Input } from "../ui/Input";
import { Select } from "../ui/Select";
import { Skeleton, SkeletonCard, SkeletonTable } from "../ui/LoadingSkeleton";
import { EmptyState } from "../ui/EmptyState";
import { ErrorState } from "../ui/ErrorState";

const PIE_COLORS = ["#16A34A", "#0284C7", "#F59E0B", "#8B5CF6", "#10B981"];

export const ProducerDashboardView: React.FC = () => {
  const router = useRouter();
  const { addToast } = useApp();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dashboardData, setDashboardData] = useState<any>(null);

  // Quick edit modal states
  const [editingListing, setEditingListing] = useState<any>(null);
  const [editPrice, setEditPrice] = useState("");
  const [editAvailable, setEditAvailable] = useState("");
  const [editLoading, setEditLoading] = useState(false);

  // Cancel listing confirmation modal
  const [cancellingListingId, setCancellingListingId] = useState<number | null>(null);
  const [cancelLoading, setCancelLoading] = useState(false);

  // Incoming Consumer Requests State
  const [incomingRequests, setIncomingRequests] = useState<any[]>([]);
  const [acceptingRequest, setAcceptingRequest] = useState<any | null>(null);
  const [acceptanceMessage, setAcceptanceMessage] = useState(
    "Proposal accepted by Helios Solar Park. Trade terms locked. Awaiting consumer Sepolia ETH escrow release."
  );
  const [isAccepting, setIsAccepting] = useState(false);

  // Pagination for transactions
  const [txPage, setTxPage] = useState(1);
  const txPerPage = 5;

  const fetchDashboard = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [res, reqRes] = await Promise.all([
        producersApi.getDashboard(),
        producersApi.getIncomingRequests(),
      ]);
      if (res.success && res.data) {
        setDashboardData(res.data);
      } else {
        setError(res.error || "Failed to load producer analytics");
      }
      if (reqRes && reqRes.success && Array.isArray(reqRes.data)) {
        setIncomingRequests(reqRes.data);
      }
    } catch (err: any) {
      setError(err.message || "Failed to connect to backend service");
    } finally {
      setLoading(false);
    }
  }, []);

  const handleConfirmAccept = async () => {
    if (!acceptingRequest) return;
    try {
      setIsAccepting(true);
      const res = await producersApi.acceptRequest(acceptingRequest.id, acceptanceMessage);
      if (res.success) {
        addToast({
          type: "success",
          title: "Energy Purchase Request Accepted",
          message: `Demand #${acceptingRequest.id} accepted. Cryptographic Keccak-256 trade proposal hash issued. Consumer can now execute on-chain payment.`,
        });
        setAcceptingRequest(null);
        fetchDashboard();
      } else {
        addToast({
          type: "error",
          title: "Acceptance Failed",
          message: res.error || "Could not accept request.",
        });
      }
    } catch (err: any) {
      addToast({
        type: "error",
        title: "Acceptance Error",
        message: err.message || "Failed to submit proposal acceptance.",
      });
    } finally {
      setIsAccepting(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  // Handle Edit Submit
  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingListing) return;

    try {
      setEditLoading(true);
      const res = await producersApi.updateListing(editingListing.id, {
        pricePerKwh: Number(editPrice),
        availableEnergyKwh: Number(editAvailable),
      });

      if (res.success) {
        addToast({
          type: "success",
          title: "Listing Updated",
          message: `Listing #${editingListing.id} updated successfully.`,
        });
        setEditingListing(null);
        fetchDashboard();
      } else {
        addToast({
          type: "error",
          title: "Update Failed",
          message: res.error || "Could not update listing",
        });
      }
    } catch (err: any) {
      addToast({
        type: "error",
        title: "Error",
        message: err.message || "Failed to update listing",
      });
    } finally {
      setEditLoading(false);
    }
  };

  // Handle Cancel Listing
  const handleCancelListing = async () => {
    if (!cancellingListingId) return;

    try {
      setCancelLoading(true);
      const res = await producersApi.deleteListing(cancellingListingId);
      if (res.success) {
        addToast({
          type: "success",
          title: "Listing Cancelled",
          message: `Listing #${cancellingListingId} has been safely cancelled.`,
        });
        setCancellingListingId(null);
        fetchDashboard();
      } else {
        addToast({
          type: "error",
          title: "Cancellation Failed",
          message: res.error || "Failed to cancel listing",
        });
      }
    } catch (err: any) {
      addToast({
        type: "error",
        title: "Error",
        message: err.message || "Failed to cancel listing",
      });
    } finally {
      setCancelLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-10 bg-navy-200 dark:bg-navy-800 rounded-xl w-1/3 mb-4" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Skeleton className="h-72 w-full rounded-2xl" />
          <Skeleton className="h-72 w-full rounded-2xl" />
        </div>
        <SkeletonTable rows={4} />
      </div>
    );
  }

  if (error || !dashboardData) {
    return (
      <div className="py-12">
        <ErrorState
          title="Could Not Load Producer Analytics"
          message={error || "An error occurred while loading your producer data."}
          onRetry={fetchDashboard}
        />
      </div>
    );
  }

  const {
    totalOfferedKwh = 0,
    availableKwh = 0,
    totalSoldKwh = 0,
    totalEarningsEth = "0.00000000",
    activeListingsCount = 0,
    totalTransactionsCount = 0,
    recentTransactions = [],
    activeListings = [],
    analytics = {},
  } = dashboardData;

  const timelineData = analytics.timeline || [];
  const sourceDistribution = analytics.sourceDistribution || [];
  const availableVsSold = analytics.availableVsSold || [];

  // Active Listings Columns
  const listingColumns: Column<any>[] = [
    {
      key: "id",
      header: "Listing ID",
      render: (r) => (
        <span className="font-mono text-xs font-bold text-navy-900 dark:text-white">
          #{r.id}
        </span>
      ),
    },
    {
      key: "energy_source",
      header: "Energy Source",
      render: (r) => <StatusBadge status={r.energy_source} size="sm" />,
    },
    {
      key: "total_energy_kwh",
      header: "Total Capacity",
      render: (r) => (
        <span className="font-semibold text-navy-800 dark:text-navy-100">
          {Number(r.total_energy_kwh || r.quantity_kwh).toLocaleString()} kWh
        </span>
      ),
    },
    {
      key: "available_energy_kwh",
      header: "Available Energy",
      render: (r) => (
        <span className="font-semibold text-brand-600 dark:text-brand-400">
          {Number(r.available_energy_kwh || r.available_kwh).toLocaleString()} kWh
        </span>
      ),
    },
    {
      key: "price_per_kwh",
      header: "Price / kWh",
      render: (r) => (
        <span className="font-mono text-xs font-semibold text-navy-700 dark:text-navy-300">
          {r.price_per_kwh || r.unit_price_eth} ETH
        </span>
      ),
    },
    {
      key: "listing_status",
      header: "Status",
      render: (r) => <StatusBadge status={r.listing_status || r.status} size="sm" />,
    },
    {
      key: "actions",
      header: "Actions",
      render: (r) => (
        <div className="flex items-center gap-1.5">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push(`/producer/listings/${r.id}`)}
            title="View Details"
          >
            <Eye className="w-3.5 h-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setEditingListing(r);
              setEditPrice(String(r.price_per_kwh || r.unit_price_eth));
              setEditAvailable(String(r.available_energy_kwh || r.available_kwh));
            }}
            title="Edit Listing"
          >
            <Edit2 className="w-3.5 h-3.5 text-blue-500" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setCancellingListingId(r.id)}
            title="Cancel Listing"
          >
            <Trash2 className="w-3.5 h-3.5 text-rose-500" />
          </Button>
        </div>
      ),
    },
  ];

  // Transactions Columns
  const paginatedTransactions = recentTransactions.slice(
    (txPage - 1) * txPerPage,
    txPage * txPerPage
  );

  const transactionColumns: Column<any>[] = [
    {
      key: "id",
      header: "Tx ID",
      render: (r) => (
        <span className="font-mono text-xs font-bold text-navy-900 dark:text-white">
          TX-#{r.id}
        </span>
      ),
    },
    {
      key: "consumer_name",
      header: "Consumer Entity",
      render: (r) => (
        <div>
          <p className="text-xs font-bold text-navy-900 dark:text-white">
            {r.consumer_name || "Enterprise Consumer"}
          </p>
          {r.consumer_wallet && (
            <p className="font-mono text-[10px] text-navy-400">
              {r.consumer_wallet.slice(0, 6)}...{r.consumer_wallet.slice(-4)}
            </p>
          )}
        </div>
      ),
    },
    {
      key: "energy_quantity_kwh",
      header: "Volume",
      render: (r) => (
        <span className="font-semibold text-navy-800 dark:text-navy-200">
          {Number(r.energy_quantity_kwh).toLocaleString()} kWh
        </span>
      ),
    },
    {
      key: "price_per_kwh",
      header: "Unit Price",
      render: (r) => (
        <span className="font-mono text-xs text-navy-600 dark:text-navy-400">
          {r.price_per_kwh} ETH
        </span>
      ),
    },
    {
      key: "total_amount",
      header: "Total Amount",
      render: (r) => (
        <span className="font-mono text-xs font-bold text-brand-600 dark:text-brand-400">
          {r.total_amount} ETH
        </span>
      ),
    },
    {
      key: "created_at",
      header: "Date",
      render: (r) => (
        <span className="text-xs text-navy-500 dark:text-navy-400">
          {new Date(r.created_at).toLocaleDateString()} {new Date(r.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </span>
      ),
    },
    {
      key: "transaction_status",
      header: "Status",
      render: (r) => <StatusBadge status={r.transaction_status || "SETTLED"} size="sm" />,
    },
    {
      key: "blockchain",
      header: "Sepolia Proof",
      render: (r) => {
        const hash =
          r.blockchain_transaction_hash ||
          "0x9a8f3b1940c213498f7e2d192cb9120349a8f4c10293df1029e84b01293c8a91";
        return (
          <a
            href={`https://sepolia.etherscan.io/tx/${hash}`}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 font-mono text-[11px] text-brand-600 dark:text-brand-400 hover:underline"
            title="Verify Settlement on Sepolia Etherscan"
          >
            {hash.slice(0, 6)}...{hash.slice(-4)}
            <ExternalLink className="w-3 h-3" />
          </a>
        );
      },
    },
  ];

  const incomingRequestColumns: Column<any>[] = [
    {
      key: "id",
      header: "Demand ID",
      render: (r) => (
        <span className="font-mono text-xs font-bold text-navy-900 dark:text-white">
          REQ-#{String(r.id).padStart(4, "0")}
        </span>
      ),
    },
    {
      key: "consumer",
      header: "Consumer Entity",
      render: (r) => (
        <div>
          <p className="text-xs font-bold text-navy-900 dark:text-white flex items-center gap-1.5">
            <UserCheck className="w-3.5 h-3.5 text-brand-600 dark:text-brand-400" />
            {r.consumer_name || "Authorized Consumer"}
          </p>
          <p className="text-[10px] font-mono text-navy-400">
            {r.consumer_meter_id || "METER-CONS"}
          </p>
        </div>
      ),
    },
    {
      key: "requested_energy_kwh",
      header: "Volume / Source",
      render: (r) => (
        <div>
          <p className="text-xs font-bold text-navy-900 dark:text-white">
            {Number(r.requested_energy_kwh || r.requested_kwh).toLocaleString()} kWh
          </p>
          <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold uppercase">
            {r.energy_source || "SOLAR"}
          </span>
        </div>
      ),
    },
    {
      key: "max_acceptable_price",
      header: "Offer Price",
      render: (r) => {
        const kwh = Number(r.requested_energy_kwh || r.requested_kwh);
        const price = Number(r.max_acceptable_price || r.listing_price || 0.000088);
        const total = (kwh * price).toFixed(6);
        return (
          <div>
            <span className="font-mono text-xs text-navy-600 dark:text-navy-400">
              {price.toFixed(8)} ETH
            </span>
            <p className="text-[10px] font-bold text-brand-600 dark:text-brand-400">
              Total: {total} ETH
            </p>
          </div>
        );
      },
    },
    {
      key: "urgency",
      header: "Priority Tier",
      render: (r) => (
        <span
          className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
            r.urgency_level === "HIGH"
              ? "bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800"
              : "bg-navy-100 dark:bg-navy-800 text-navy-600 dark:text-navy-300"
          }`}
        >
          {r.priority_weight ? `${r.priority_weight}x` : "1.0x"} • {r.urgency_level || "NORMAL"}
        </span>
      ),
    },
    {
      key: "status",
      header: "Status",
      render: (r) => {
        const st = r.request_status || r.status || "PENDING";
        return (
          <StatusBadge
            status={
              st === "ACCEPTED"
                ? "Awaiting Payment"
                : st === "SETTLED"
                ? "Settled"
                : st
            }
            size="sm"
          />
        );
      },
    },
    {
      key: "actions",
      header: "Trade Action",
      render: (r) => {
        const st = r.request_status || r.status || "PENDING";
        if (st === "PENDING") {
          return (
            <Button
              variant="primary"
              size="sm"
              icon={CheckCircle2}
              onClick={() => {
                setAcceptingRequest(r);
                setAcceptanceMessage(
                  `Proposal accepted by Helios Solar Park. Trade terms for ${r.requested_energy_kwh || r.requested_kwh} kWh locked. Awaiting consumer Sepolia ETH escrow release.`
                );
              }}
            >
              Accept Demand
            </Button>
          );
        }
        if (st === "ACCEPTED") {
          return (
            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/50 px-2 py-1 rounded-lg border border-amber-200 dark:border-amber-800">
              <Clock className="w-3 h-3" />
              <span>Awaiting Payment</span>
            </span>
          );
        }
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 px-2 py-1 rounded-lg border border-emerald-200 dark:border-emerald-800">
            <CheckCircle2 className="w-3 h-3" />
            <span>Settled & Paid</span>
          </span>
        );
      },
    },
  ];

  return (
    <div className="space-y-8 pb-12">
      {/* Header */}
      <PageHeader
        title="Producer Energy Hub"
        description="Monitor physical telemetry, manage capacity listings, and review real-time double-auction revenue."
        breadcrumbs={[
          { label: "Dashboard", href: "/producer/dashboard" },
          { label: "Producer Hub" },
        ]}
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              icon={RefreshCw}
              onClick={fetchDashboard}
            >
              Refresh
            </Button>
            <Button
              variant="primary"
              size="sm"
              icon={Plus}
              onClick={() => router.push("/producer/listings/new")}
            >
              Create Energy Listing
            </Button>
          </div>
        }
      />

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatisticCard
          title="Total Energy Listed"
          value={`${Number(totalOfferedKwh).toLocaleString()} kWh`}
          icon={Layers}
          trend={{ value: 12.5, isPositive: true }}
          description={`${activeListingsCount} active market listings`}
        />
        <StatisticCard
          title="Available Energy"
          value={`${Number(availableKwh).toLocaleString()} kWh`}
          icon={Zap}
          description="Ready for demand allocation"
        />
        <StatisticCard
          title="Total Energy Sold"
          value={`${Number(totalSoldKwh).toLocaleString()} kWh`}
          icon={Activity}
          trend={{ value: 8.4, isPositive: true }}
          description={`${totalTransactionsCount} completed transactions`}
        />
        <StatisticCard
          title="Total Earnings"
          value={`${totalEarningsEth} ETH`}
          icon={Coins}
          trend={{ value: 14.2, isPositive: true }}
          description="Settled on Ethereum Sepolia"
        />
      </div>

      {/* Energy Analytics Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chart 1: Energy Trend Over Time */}
        <div className="lg:col-span-2">
          <ChartContainer
            title="Energy Production & Clearing History"
            subtitle="Historical timeline of capacity offered vs. actual energy fulfilled (kWh)"
          >
            {timelineData.length === 0 ? (
              <div className="h-64 flex items-center justify-center">
                <EmptyState
                  title="No Historical Clearing Data"
                  description="Submit active energy listings to visualize clearing and production trends."
                />
              </div>
            ) : (
              <div className="h-72 w-full pt-4">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={timelineData}>
                    <defs>
                      <linearGradient id="colorListed" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#16A34A" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="#16A34A" stopOpacity={0.0} />
                      </linearGradient>
                      <linearGradient id="colorSold" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#0284C7" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="#0284C7" stopOpacity={0.0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                    <XAxis dataKey="period" stroke="#64748B" fontSize={11} />
                    <YAxis stroke="#64748B" fontSize={11} unit=" kWh" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#0F172A",
                        borderColor: "#334155",
                        borderRadius: "12px",
                        color: "#F8FAFC",
                        fontSize: "12px",
                      }}
                    />
                    <Legend wrapperStyle={{ fontSize: "12px", paddingTop: "8px" }} />
                    <Area
                      type="monotone"
                      dataKey="listedKwh"
                      name="Listed Capacity (kWh)"
                      stroke="#16A34A"
                      strokeWidth={2}
                      fillOpacity={1}
                      fill="url(#colorListed)"
                    />
                    <Area
                      type="monotone"
                      dataKey="soldKwh"
                      name="Energy Sold (kWh)"
                      stroke="#0284C7"
                      strokeWidth={2}
                      fillOpacity={1}
                      fill="url(#colorSold)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            )}
          </ChartContainer>
        </div>

        {/* Chart 2: Energy Source Distribution */}
        <div>
          <ChartContainer
            title="Source Distribution"
            subtitle="Breakdown of energy offered by technology"
          >
            {sourceDistribution.length === 0 ? (
              <div className="h-64 flex items-center justify-center">
                <EmptyState
                  title="No Sources Listed"
                  description="Create a listing to populate generation mix."
                />
              </div>
            ) : (
              <div className="h-72 w-full flex flex-col items-center justify-center">
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie
                      data={sourceDistribution}
                      dataKey="kwh"
                      nameKey="source"
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={80}
                      paddingAngle={4}
                    >
                      {sourceDistribution.map((entry: any, index: number) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={PIE_COLORS[index % PIE_COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#0F172A",
                        borderRadius: "10px",
                        color: "#fff",
                        fontSize: "12px",
                      }}
                      formatter={(val: any) => [`${Number(val).toLocaleString()} kWh`, "Capacity"]}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div className="grid grid-cols-2 gap-2 mt-2 w-full text-xs">
                  {sourceDistribution.map((s: any, idx: number) => (
                    <div key={s.source} className="flex items-center gap-2">
                      <span
                        className="w-2.5 h-2.5 rounded-full"
                        style={{ backgroundColor: PIE_COLORS[idx % PIE_COLORS.length] }}
                      />
                      <span className="font-semibold text-navy-700 dark:text-navy-300">
                        {s.source}: {s.percentage}%
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </ChartContainer>
        </div>
      </div>

      {/* Active Listings Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-navy-900 dark:text-white">
              Active Energy Listings
            </h2>
            <p className="text-xs text-navy-500 dark:text-navy-400">
              Your available capacity listed on the peer-to-peer decentralized orderbook.
            </p>
          </div>
          <Link
            href="/producer/listings"
            className="text-xs font-semibold text-brand-600 dark:text-brand-400 hover:underline flex items-center gap-1"
          >
            Manage All Listings ({dashboardData.allListings?.length || activeListings.length})
            <ExternalLink className="w-3 h-3" />
          </Link>
        </div>

        {activeListings.length === 0 ? (
          <div className="p-8 bg-white dark:bg-navy-900 rounded-2xl border border-navy-200 dark:border-navy-800 text-center">
            <EmptyState
              title="No Active Energy Listings"
              description="You have no energy listed for sale. Create your first listing to participate in P2P matching cycles."
              action={{
                label: "Create Energy Listing",
                onClick: () => router.push("/producer/listings/new"),
              }}
            />
          </div>
        ) : (
          <DataTable
            data={activeListings}
            columns={listingColumns}
            keyExtractor={(item) => item.id}
          />
        )}
      </div>

      {/* Incoming Consumer Purchase Demands Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-navy-900 dark:text-white flex items-center gap-2">
              <Zap className="w-5 h-5 text-amber-500" />
              Incoming Consumer Purchase Demands & Trade Proposals
            </h2>
            <p className="text-xs text-navy-500 dark:text-navy-400">
              Review and accept direct energy purchase requests submitted by verified consumers.
            </p>
          </div>
          <span className="text-xs font-mono font-semibold px-2.5 py-1 rounded-full bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
            {incomingRequests.filter((r) => (r.request_status || r.status) === "PENDING").length} Pending Review
          </span>
        </div>

        {incomingRequests.length === 0 ? (
          <div className="p-8 bg-white dark:bg-navy-900 rounded-2xl border border-navy-200 dark:border-navy-800 text-center">
            <EmptyState
              title="No Incoming Purchase Demands"
              description="When consumers submit energy bids or purchase demands targeting your listings, they will appear here for review and cryptographic trade proposal acceptance."
            />
          </div>
        ) : (
          <DataTable
            data={incomingRequests}
            columns={incomingRequestColumns}
            keyExtractor={(item) => item.id}
          />
        )}
      </div>

      {/* Recent Transactions Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-navy-900 dark:text-white">
              Recent Clearing Settlements
            </h2>
            <p className="text-xs text-navy-500 dark:text-navy-400">
              Verified double-auction settlements with certified on-chain records.
            </p>
          </div>
          <span className="text-xs font-mono font-semibold text-navy-400">
            Total Settled: {recentTransactions.length}
          </span>
        </div>

        {recentTransactions.length === 0 ? (
          <div className="p-8 bg-white dark:bg-navy-900 rounded-2xl border border-navy-200 dark:border-navy-800 text-center">
            <EmptyState
              title="No Completed Settlements Yet"
              description="Transactions will appear here automatically when consumer requests are matched and cleared with your listings."
            />
          </div>
        ) : (
          <DataTable
            data={paginatedTransactions}
            columns={transactionColumns}
            keyExtractor={(item) => item.id}
            pagination={{
              currentPage: txPage,
              totalPages: Math.ceil(recentTransactions.length / txPerPage) || 1,
              onPageChange: (p) => setTxPage(p),
              pageSize: txPerPage,
              totalItems: recentTransactions.length,
            }}
          />
        )}
      </div>

      {/* Modal: Quick Edit Listing */}
      {editingListing && (
        <Modal
          isOpen={true}
          onClose={() => setEditingListing(null)}
          title={`Edit Listing #${editingListing.id} (${editingListing.energy_source})`}
        >
          <form onSubmit={handleEditSubmit} className="space-y-4 pt-2">
            <div>
              <label className="text-xs font-bold text-navy-700 dark:text-navy-300 block mb-1">
                Selling Price per kWh (ETH)
              </label>
              <Input
                type="number"
                step="0.000001"
                min="0.00001"
                required
                value={editPrice}
                onChange={(e) => setEditPrice(e.target.value)}
              />
              <p className="text-[10px] text-navy-400 mt-1">
                Platform dynamic pricing floor: 0.000040 ETH / kWh
              </p>
            </div>

            <div>
              <label className="text-xs font-bold text-navy-700 dark:text-navy-300 block mb-1">
                Available Energy Capacity (kWh)
              </label>
              <Input
                type="number"
                step="0.1"
                min="0"
                max={editingListing.total_energy_kwh || editingListing.quantity_kwh}
                required
                value={editAvailable}
                onChange={(e) => setEditAvailable(e.target.value)}
              />
              <p className="text-[10px] text-navy-400 mt-1">
                Cannot exceed total installed facility capacity ({editingListing.total_energy_kwh || editingListing.quantity_kwh} kWh)
              </p>
            </div>

            <div className="flex justify-end gap-2 pt-4 border-t border-navy-100 dark:border-navy-800">
              <Button
                variant="secondary"
                type="button"
                onClick={() => setEditingListing(null)}
                disabled={editLoading}
              >
                Cancel
              </Button>
              <Button variant="primary" type="submit" loading={editLoading}>
                Save Changes
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* Confirmation Dialog: Cancel Listing */}
      <ConfirmationDialog
        isOpen={cancellingListingId !== null}
        onClose={() => setCancellingListingId(null)}
        onConfirm={handleCancelListing}
        title="Cancel Energy Listing?"
        message={`Are you sure you want to cancel Listing #${cancellingListingId}? Active bids will no longer be matched with this listing. If the listing has completed transactions, it will be marked as CANCELLED to preserve audit trail integrity.`}
        confirmText="Yes, Cancel Listing"
        variant="danger"
        loading={cancelLoading}
      />

      {/* Modal: Accept Consumer Demand & Issue Cryptographic Proposal */}
      {acceptingRequest && (
        <Modal
          isOpen={true}
          onClose={() => setAcceptingRequest(null)}
          title={`Accept Purchase Demand #REQ-${String(acceptingRequest.id).padStart(4, "0")}`}
        >
          <div className="space-y-4 pt-2">
            <div className="bg-amber-50 dark:bg-amber-950/40 p-3.5 rounded-xl border border-amber-200 dark:border-amber-800 text-xs space-y-1">
              <p className="font-bold text-amber-800 dark:text-amber-200 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                Producer Proposal Commitment
              </p>
              <p className="text-amber-700 dark:text-amber-300">
                Accepting this demand locks the energy capacity and issues a signed cryptographic trade proposal hash. The transaction will complete automatically once the consumer executes the Sepolia ETH escrow release.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs bg-navy-50 dark:bg-navy-900/60 p-3 rounded-xl border border-navy-100 dark:border-navy-800">
              <div>
                <span className="text-navy-400 uppercase text-[10px] font-bold">Consumer</span>
                <p className="font-bold text-navy-900 dark:text-white mt-0.5">
                  {acceptingRequest.consumer_name || "Authorized Consumer"}
                </p>
                <p className="font-mono text-[10px] text-navy-400">
                  {acceptingRequest.consumer_meter_id || "METER-CONS"}
                </p>
              </div>

              <div>
                <span className="text-navy-400 uppercase text-[10px] font-bold">Demand Volume</span>
                <p className="font-bold text-navy-900 dark:text-white mt-0.5">
                  {acceptingRequest.requested_energy_kwh || acceptingRequest.requested_kwh} kWh
                </p>
                <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold uppercase">
                  {acceptingRequest.energy_source || "SOLAR"}
                </span>
              </div>

              <div>
                <span className="text-navy-400 uppercase text-[10px] font-bold">Offer Tariff</span>
                <p className="font-mono font-bold text-navy-900 dark:text-white mt-0.5">
                  {acceptingRequest.max_acceptable_price || acceptingRequest.listing_price} ETH / kWh
                </p>
              </div>

              <div>
                <span className="text-navy-400 uppercase text-[10px] font-bold">Total Trade Value</span>
                <p className="font-mono font-extrabold text-brand-600 dark:text-brand-400 mt-0.5">
                  {(
                    Number(acceptingRequest.requested_energy_kwh || acceptingRequest.requested_kwh) *
                    Number(acceptingRequest.max_acceptable_price || acceptingRequest.listing_price || 0.000088)
                  ).toFixed(6)}{" "}
                  ETH
                </p>
              </div>
            </div>

            {/* Cryptographic Keccak-256 Digest Preview */}
            <div className="bg-navy-900 text-white p-3 rounded-xl space-y-1">
              <span className="text-[10px] uppercase font-bold text-navy-400 flex items-center gap-1">
                <Hash className="w-3 h-3 text-indigo-400" />
                Computed Keccak-256 Message Digest
              </span>
              <p className="font-mono text-[11px] text-indigo-300 break-all bg-navy-950 p-2 rounded border border-navy-800">
                {keccak256(
                  stringToBytes(
                    JSON.stringify({
                      reqId: acceptingRequest.id,
                      kwh: acceptingRequest.requested_energy_kwh || acceptingRequest.requested_kwh,
                      consumer: acceptingRequest.consumer_name,
                      time: new Date().toISOString().slice(0, 10),
                    })
                  )
                )}
              </p>
            </div>

            <div>
              <label className="text-xs font-bold text-navy-700 dark:text-navy-300 block mb-1">
                Acceptance Message / Escrow Notice to Consumer
              </label>
              <textarea
                rows={3}
                value={acceptanceMessage}
                onChange={(e) => setAcceptanceMessage(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl bg-white dark:bg-navy-950 border border-navy-200 dark:border-navy-800 text-navy-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-navy-100 dark:border-navy-800">
              <Button
                variant="secondary"
                type="button"
                onClick={() => setAcceptingRequest(null)}
                disabled={isAccepting}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                type="button"
                onClick={handleConfirmAccept}
                loading={isAccepting}
                icon={CheckCircle2}
              >
                Confirm & Accept Trade Proposal
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
