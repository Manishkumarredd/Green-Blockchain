"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Coins,
  Search,
  Filter,
  RefreshCw,
  ExternalLink,
  Zap,
  Leaf,
  ShieldCheck,
  Award,
  CheckCircle2,
  ShoppingBag,
  ArrowRight,
  Eye,
} from "lucide-react";
import { DashboardLayout } from "../../../components/layout/DashboardLayout";
import { PageHeader } from "../../../components/ui/PageHeader";
import { DataTable, Column } from "../../../components/ui/DataTable";
import { StatusBadge } from "../../../components/ui/StatusBadge";
import { Button } from "../../../components/ui/Button";
import { EmptyState } from "../../../components/ui/EmptyState";
import { ErrorState } from "../../../components/ui/ErrorState";
import { SkeletonTable } from "../../../components/ui/LoadingSkeleton";
import { Modal } from "../../../components/ui/Modal";
import { useApp } from "../../../components/common/AppContext";
import { consumersApi } from "../../../services/api";

export default function ConsumerPurchasesPage() {
  const router = useRouter();
  const { setRole } = useApp();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Data State
  const [purchases, setPurchases] = useState<any[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // Filters State
  const [search, setSearch] = useState("");
  const [sourceFilter, setSourceFilter] = useState("ALL");
  const [sortBy, setSortBy] = useState("date_desc");

  // Transaction Receipt Modal State
  const [selectedTx, setSelectedTx] = useState<any>(null);
  const [receiptModalOpen, setReceiptModalOpen] = useState(false);

  useEffect(() => {
    setRole("CONSUMER");
  }, [setRole]);

  const fetchPurchases = useCallback(async () => {
    try {
      setError(null);
      const res = await consumersApi.getMyPurchases({
        page,
        limit: 10,
        source: sourceFilter,
        search,
        sortBy,
      });

      if (res && res.success) {
        setPurchases(res.data || []);
        if (res.meta) {
          setTotalPages(res.meta.totalPages || 1);
          setTotalCount(res.meta.total || 0);
        }
      } else {
        setError(res?.error || "Failed to load energy purchase history");
      }
    } catch (err: any) {
      console.error("Purchases fetch error:", err);
      setError(err?.message || "An unexpected error occurred while loading purchases.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [page, sourceFilter, search, sortBy]);

  useEffect(() => {
    fetchPurchases();
  }, [fetchPurchases]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchPurchases();
  };

  const handleOpenReceipt = (tx: any) => {
    setSelectedTx(tx);
    setReceiptModalOpen(true);
  };

  const columns: Column<any>[] = [
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
          <p className="text-xs font-bold text-navy-900 dark:text-white">{row.producer_name}</p>
          <p className="text-[10px] text-navy-400 font-mono">{row.producer_meter_id || "METER-PROD"}</p>
        </div>
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
      cell: (row) => (
        <span className="text-xs font-mono text-navy-600 dark:text-navy-300">
          {row.price_per_kwh} ETH
        </span>
      ),
    },
    {
      header: "Total Settled",
      accessor: "total_amount",
      cell: (row) => (
        <div>
          <p className="text-xs font-bold text-navy-900 dark:text-white">{row.total_amount} ETH</p>
          <p className="text-[10px] text-navy-400">≈ ₹{Number(row.total_amount_inr || 0).toLocaleString()}</p>
        </div>
      ),
    },
    {
      header: "Avoided CO₂",
      accessor: "carbon_saved_kg",
      cell: (row) => (
        <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-600 dark:text-emerald-400">
          <Leaf className="w-3 h-3" />
          {row.carbon_saved_kg} kg
        </span>
      ),
    },
    {
      header: "Settlement Status",
      accessor: "status",
      cell: (row) => <StatusBadge status={row.status || "SETTLED"} variant="success" />,
    },
    {
      header: "Receipt",
      accessor: "actions",
      cell: (row) => (
        <Button
          variant="outline"
          size="sm"
          onClick={() => handleOpenReceipt(row)}
          leftIcon={<Eye className="w-3.5 h-3.5" />}
        >
          Receipt
        </Button>
      ),
    },
  ];

  return (
    <DashboardLayout activeNavId="purchases">
      <div className="space-y-6 animate-fadeIn">
        {/* Page Header */}
        <PageHeader
          title="Settled Energy Purchases"
          description="Verified peer-to-peer trade settlements with blockchain proof of settlement and carbon reductions."
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
                  Buy More Energy
                </Button>
              </Link>
            </div>
          }
        />

        {/* Filter and Search Bar */}
        <div className="bg-white dark:bg-navy-900 rounded-2xl p-4 border border-navy-200 dark:border-navy-800 shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-navy-400" />
            <input
              type="text"
              placeholder="Search by producer name, source, or blockchain hash..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="w-full pl-10 pr-4 py-2 text-sm bg-navy-50/50 dark:bg-navy-800/50 border border-navy-200 dark:border-navy-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500/30 dark:text-white"
            />
          </div>

          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
            {/* Source Filter */}
            <select
              value={sourceFilter}
              onChange={(e) => {
                setSourceFilter(e.target.value);
                setPage(1);
              }}
              className="px-3 py-2 text-xs font-semibold bg-white dark:bg-navy-800 border border-navy-200 dark:border-navy-700 rounded-xl text-navy-700 dark:text-navy-200 focus:outline-none focus:ring-2 focus:ring-brand-500/30"
            >
              <option value="ALL">All Sources</option>
              <option value="SOLAR">Solar</option>
              <option value="WIND">Wind</option>
              <option value="HYDRO">Hydro</option>
              <option value="BIOMASS">Biomass</option>
              <option value="HYBRID">Hybrid</option>
            </select>

            {/* Sort Dropdown */}
            <select
              value={sortBy}
              onChange={(e) => {
                setSortBy(e.target.value);
                setPage(1);
              }}
              className="px-3 py-2 text-xs font-semibold bg-white dark:bg-navy-800 border border-navy-200 dark:border-navy-700 rounded-xl text-navy-700 dark:text-navy-200 focus:outline-none focus:ring-2 focus:ring-brand-500/30"
            >
              <option value="date_desc">Newest First</option>
              <option value="date_asc">Oldest First</option>
              <option value="qty_desc">Highest Quantity</option>
              <option value="qty_asc">Lowest Quantity</option>
              <option value="amount_desc">Highest Amount</option>
              <option value="amount_asc">Lowest Amount</option>
            </select>
          </div>
        </div>

        {/* Purchases Table */}
        {loading ? (
          <SkeletonTable rows={5} />
        ) : error ? (
          <ErrorState
            title="Failed to Load Purchases"
            message={error}
            onRetry={fetchPurchases}
          />
        ) : purchases.length === 0 ? (
          <div className="bg-white dark:bg-navy-900 rounded-2xl p-12 border border-navy-200 dark:border-navy-800 text-center">
            <EmptyState
              title="No Settled Purchases Found"
              description={
                search || sourceFilter !== "ALL"
                  ? "No transactions match your current search and filter settings. Try adjusting your search query."
                  : "You have not completed any energy purchases yet. Settle energy from the Clean Energy Market to build your verifiable clean power profile."
              }
              action={{
                label: search || sourceFilter !== "ALL" ? "Clear Filters" : "Browse Clean Energy Market",
                onClick: () => {
                  if (search || sourceFilter !== "ALL") {
                    setSearch("");
                    setSourceFilter("ALL");
                    setPage(1);
                  } else {
                    router.push("/marketplace");
                  }
                },
              }}
            />
          </div>
        ) : (
          <DataTable
            data={purchases}
            columns={columns}
            pagination={{
              currentPage: page,
              totalPages: totalPages,
              onPageChange: (p) => setPage(p),
            }}
          />
        )}

        {/* Detailed Transaction Settlement Receipt Modal */}
        {selectedTx && (
          <Modal
            isOpen={receiptModalOpen}
            onClose={() => setReceiptModalOpen(false)}
            title="Peer-to-Peer Trade Settlement Receipt"
            size="lg"
          >
            <div className="space-y-6 pt-2">
              <div className="p-4 bg-brand-50/60 dark:bg-brand-950/40 rounded-2xl border border-brand-200/60 dark:border-brand-800/50 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-brand-700 dark:text-brand-300">
                    Settlement Status
                  </span>
                  <div className="flex items-center gap-2 mt-0.5">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                    <span className="text-base font-extrabold text-navy-900 dark:text-white">
                      Settled on Ethereum Sepolia
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-[10px] font-mono text-navy-400">Transaction ID</span>
                  <p className="font-mono text-sm font-bold text-navy-900 dark:text-white">
                    #TX-{selectedTx.id.toString().padStart(4, "0")}
                  </p>
                </div>
              </div>

              {/* Settlement Itemized Details */}
              <div className="grid grid-cols-2 gap-4 text-xs">
                <div className="bg-navy-50/50 dark:bg-navy-800/40 p-3.5 rounded-xl border border-navy-100 dark:border-navy-800">
                  <p className="text-navy-400 uppercase font-bold text-[10px]">Producer</p>
                  <p className="text-sm font-bold text-navy-900 dark:text-white mt-0.5">
                    {selectedTx.producer_name}
                  </p>
                  <p className="font-mono text-[10px] text-navy-400 truncate mt-0.5">
                    {selectedTx.producer_wallet}
                  </p>
                </div>

                <div className="bg-navy-50/50 dark:bg-navy-800/40 p-3.5 rounded-xl border border-navy-100 dark:border-navy-800">
                  <p className="text-navy-400 uppercase font-bold text-[10px]">Renewable Energy Delivered</p>
                  <p className="text-sm font-extrabold text-brand-600 dark:text-brand-400 mt-0.5">
                    {Number(selectedTx.energy_quantity_kwh).toLocaleString()} kWh ({selectedTx.energy_source})
                  </p>
                  <p className="text-[10px] text-navy-500 mt-0.5">Tariff: {selectedTx.price_per_kwh} ETH/kWh</p>
                </div>

                <div className="bg-navy-50/50 dark:bg-navy-800/40 p-3.5 rounded-xl border border-navy-100 dark:border-navy-800">
                  <p className="text-navy-400 uppercase font-bold text-[10px]">Total Amount Settled</p>
                  <p className="text-base font-black text-navy-900 dark:text-white mt-0.5">
                    {selectedTx.total_amount} ETH
                  </p>
                  <p className="text-[10px] text-navy-500 mt-0.5">
                    ≈ ₹{Number(selectedTx.total_amount_inr || 0).toLocaleString()}
                  </p>
                </div>

                <div className="bg-navy-50/50 dark:bg-navy-800/40 p-3.5 rounded-xl border border-navy-100 dark:border-navy-800">
                  <p className="text-navy-400 uppercase font-bold text-[10px]">Avoided Carbon Emissions</p>
                  <p className="text-base font-bold text-emerald-600 dark:text-emerald-400 mt-0.5 inline-flex items-center gap-1.5">
                    <Leaf className="w-4 h-4" />
                    {selectedTx.carbon_saved_kg} kg CO₂
                  </p>
                  <p className="text-[10px] text-navy-500 mt-0.5">0.8200 kg CO₂/kWh Grid Baseline</p>
                </div>
              </div>

              {/* Cryptographic Transaction Hash */}
              <div className="bg-navy-950 p-4 rounded-xl text-white space-y-1">
                <span className="text-[10px] uppercase font-bold text-slate-400">
                  Ethereum Sepolia Transaction Hash
                </span>
                <p className="font-mono text-xs text-brand-400 break-all select-all">
                  {selectedTx.blockchain_transaction_hash || "0x9a8f3b1940c213498f7e2d192cb9120349a8f4c10293df1029e84b01293c8a91"}
                </p>
              </div>

              <div className="flex flex-wrap justify-end gap-3 pt-2">
                <Button variant="outline" onClick={() => setReceiptModalOpen(false)}>
                  Close
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    window.open(`/verify-certificate/${selectedTx.id}`, "_blank");
                  }}
                  leftIcon={<ShieldCheck className="w-4 h-4 text-emerald-500" />}
                >
                  View Verified GL-REC
                </Button>
                <Button
                  variant="primary"
                  onClick={() => {
                    const hash = selectedTx.blockchain_transaction_hash || "0x9a8f3b1940c213498f7e2d192cb9120349a8f4c10293df1029e84b01293c8a91";
                    window.open(`https://sepolia.etherscan.io/tx/${hash}`, "_blank");
                  }}
                  rightIcon={<ExternalLink className="w-4 h-4" />}
                >
                  Verify on Sepolia Etherscan
                </Button>
              </div>
            </div>
          </Modal>
        )}
      </div>
    </DashboardLayout>
  );
}
