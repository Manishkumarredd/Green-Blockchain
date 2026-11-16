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

  // Pagination for transactions
  const [txPage, setTxPage] = useState(1);
  const txPerPage = 5;

  const fetchDashboard = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await producersApi.getDashboard();
      if (res.success && res.data) {
        setDashboardData(res.data);
      } else {
        setError(res.error || "Failed to load producer analytics");
      }
    } catch (err: any) {
      setError(err.message || "Failed to connect to backend service");
    } finally {
      setLoading(false);
    }
  }, []);

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
    </div>
  );
};
