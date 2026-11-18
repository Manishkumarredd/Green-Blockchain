"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Zap,
  Search,
  Filter,
  SlidersHorizontal,
  RefreshCw,
  Eye,
  XCircle,
  Clock,
  CheckCircle2,
  AlertCircle,
  Plus,
  ShoppingBag,
  ArrowUpDown,
} from "lucide-react";
import { DashboardLayout } from "../../../components/layout/DashboardLayout";
import { PageHeader } from "../../../components/ui/PageHeader";
import { DataTable, Column } from "../../../components/ui/DataTable";
import { StatusBadge } from "../../../components/ui/StatusBadge";
import { Button } from "../../../components/ui/Button";
import { Input } from "../../../components/ui/Input";
import { Select } from "../../../components/ui/Select";
import { ConfirmationDialog } from "../../../components/ui/ConfirmationDialog";
import { EmptyState } from "../../../components/ui/EmptyState";
import { ErrorState } from "../../../components/ui/ErrorState";
import { SkeletonTable } from "../../../components/ui/LoadingSkeleton";
import { useApp } from "../../../components/common/AppContext";
import { consumersApi } from "../../../services/api";

export default function ConsumerRequestsPage() {
  const router = useRouter();
  const { setRole, addToast } = useApp();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Data State
  const [requests, setRequests] = useState<any[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // Filters State
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [sourceFilter, setSourceFilter] = useState("ALL");
  const [sortBy, setSortBy] = useState("date_desc");

  // Cancellation Modal State
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<any>(null);
  const [isCancelling, setIsCancelling] = useState(false);

  useEffect(() => {
    setRole("CONSUMER");
  }, [setRole]);

  const fetchRequests = useCallback(async () => {
    try {
      setError(null);
      const res = await consumersApi.getMyRequests({
        page,
        limit: 10,
        status: statusFilter,
        source: sourceFilter,
        search,
        sortBy,
      });

      if (res && res.success) {
        setRequests(res.data || []);
        if (res.meta) {
          setTotalPages(res.meta.totalPages || 1);
          setTotalCount(res.meta.total || 0);
        }
      } else {
        setError(res?.error || "Failed to load energy purchase requests");
      }
    } catch (err: any) {
      console.error("Requests fetch error:", err);
      setError(err?.message || "An unexpected error occurred while loading requests.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [page, statusFilter, sourceFilter, search, sortBy]);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchRequests();
  };

  // Open Cancel Dialog
  const handleOpenCancelDialog = (req: any) => {
    if (req.status !== "PENDING") {
      addToast({
        type: "warning",
        title: "Action Not Allowed",
        message: `Only PENDING requests can be cancelled. Current status is ${req.status}.`,
      });
      return;
    }
    setSelectedRequest(req);
    setCancelModalOpen(true);
  };

  // Confirm Cancellation
  const handleConfirmCancel = async () => {
    if (!selectedRequest) return;
    try {
      setIsCancelling(true);
      const res = await consumersApi.cancelRequest(selectedRequest.id);
      if (res && res.success) {
        addToast({
          type: "success",
          title: "Request Cancelled",
          message: `Energy purchase demand #REQ-${selectedRequest.id.toString().padStart(4, "0")} has been safely cancelled.`,
        });
        setCancelModalOpen(false);
        setSelectedRequest(null);
        fetchRequests();
      } else {
        addToast({
          type: "error",
          title: "Cancellation Failed",
          message: res?.error || "Could not cancel energy request",
        });
      }
    } catch (err: any) {
      addToast({
        type: "error",
        title: "Error",
        message: err?.message || "An error occurred while cancelling the request.",
      });
    } finally {
      setIsCancelling(false);
    }
  };

  const columns: Column<any>[] = [
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
      header: "Price / kWh",
      accessor: "price_per_kwh",
      cell: (row) => <span className="text-xs font-mono text-navy-700 dark:text-navy-200">{row.price_per_kwh} ETH</span>,
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
      header: "Request Date",
      accessor: "created_at",
      cell: (row) => (
        <span className="text-xs text-navy-500 dark:text-navy-400">
          {new Date(row.created_at).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          })}
        </span>
      ),
    },
    {
      header: "Status",
      accessor: "status",
      cell: (row) => {
        const s = (row.status || row.request_status || "PENDING").toUpperCase();
        let variant: "warning" | "success" | "info" | "neutral" | "danger" = "warning";
        let displayStatus = s;
        if (s === "FULFILLED" || s === "SETTLED") {
          variant = "success";
          displayStatus = "SETTLED";
        } else if (s === "ACCEPTED") {
          variant = "info";
          displayStatus = "ACCEPTED (PAYMENT READY)";
        } else if (s === "MATCHED" || s === "PARTIALLY_MATCHED") {
          variant = "info";
        } else if (s === "CANCELLED") {
          variant = "neutral";
        } else if (s === "REJECTED") {
          variant = "danger";
        }
        return <StatusBadge status={displayStatus} variant={variant} />;
      },
    },
    {
      header: "Actions",
      accessor: "actions",
      cell: (row) => {
        const s = (row.status || row.request_status || "PENDING").toUpperCase();
        return (
          <div className="flex items-center gap-2">
            {s === "ACCEPTED" ? (
              <Button
                variant="primary"
                size="sm"
                onClick={() => router.push(`/consumer/requests/${row.id}`)}
                className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold"
                leftIcon={<Zap className="w-3.5 h-3.5" />}
              >
                Pay & Settle
              </Button>
            ) : (
              <Button
                variant="outline"
                size="sm"
                onClick={() => router.push(`/consumer/requests/${row.id}`)}
                leftIcon={<Eye className="w-3.5 h-3.5" />}
              >
                Details
              </Button>
            )}
            {s === "PENDING" && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleOpenCancelDialog(row)}
                className="text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40"
                leftIcon={<XCircle className="w-3.5 h-3.5" />}
              >
                Cancel
              </Button>
            )}
          </div>
        );
      },
    },
  ];

  return (
    <DashboardLayout activeNavId="requests">
      <div className="space-y-6 animate-fadeIn">
        {/* Page Header */}
        <PageHeader
          title="Consumer Energy Purchase Requests"
          description="Manage active demand bids, algorithmic allocation status, and pending clearing cycles."
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
                  New Purchase Request
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
              placeholder="Search by producer name, source, or request ID..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="w-full pl-10 pr-4 py-2 text-sm bg-navy-50/50 dark:bg-navy-800/50 border border-navy-200 dark:border-navy-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500/30 dark:text-white"
            />
          </div>

          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
              className="px-3 py-2 text-xs font-semibold bg-white dark:bg-navy-800 border border-navy-200 dark:border-navy-700 rounded-xl text-navy-700 dark:text-navy-200 focus:outline-none focus:ring-2 focus:ring-brand-500/30"
            >
              <option value="ALL">All Statuses</option>
              <option value="PENDING">Pending</option>
              <option value="MATCHED">Matched</option>
              <option value="FULFILLED">Fulfilled</option>
              <option value="CANCELLED">Cancelled</option>
            </select>

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
              <option value="price_desc">Highest Price</option>
              <option value="price_asc">Lowest Price</option>
            </select>
          </div>
        </div>

        {/* Requests Table */}
        {loading ? (
          <SkeletonTable rows={5} />
        ) : error ? (
          <ErrorState
            title="Failed to Load Demands"
            message={error}
            onRetry={fetchRequests}
          />
        ) : requests.length === 0 ? (
          <div className="bg-white dark:bg-navy-900 rounded-2xl p-12 border border-navy-200 dark:border-navy-800 text-center">
            <EmptyState
              title="No Energy Demands Found"
              description={
                search || statusFilter !== "ALL" || sourceFilter !== "ALL"
                  ? "No requests match your current search and filter settings. Try clearing the filters."
                  : "You haven't submitted any energy purchase demands yet. Select a renewable offer from the Clean Energy Market to submit a demand request."
              }
              action={{
                label: search || statusFilter !== "ALL" ? "Clear Filters" : "Browse Clean Energy Market",
                onClick: () => {
                  if (search || statusFilter !== "ALL") {
                    setSearch("");
                    setStatusFilter("ALL");
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
            data={requests}
            columns={columns}
            pagination={{
              currentPage: page,
              totalPages: totalPages,
              onPageChange: (p) => setPage(p),
            }}
          />
        )}

        {/* Cancellation Confirmation Dialog */}
        <ConfirmationDialog
          isOpen={cancelModalOpen}
          onClose={() => {
            if (!isCancelling) setCancelModalOpen(false);
          }}
          onConfirm={handleConfirmCancel}
          title="Cancel Energy Purchase Demand?"
          message={
            selectedRequest
              ? `Are you sure you want to cancel request #REQ-${selectedRequest.id.toString().padStart(4, "0")} for ${selectedRequest.requested_energy_kwh} kWh? This will revoke your bid from the double-auction matching engine.`
              : "Are you sure you want to cancel this request?"
          }
          confirmLabel="Cancel Request"
          cancelLabel="Keep Request"
          variant="danger"
          loading={isCancelling}
        />
      </div>
    </DashboardLayout>
  );
}
