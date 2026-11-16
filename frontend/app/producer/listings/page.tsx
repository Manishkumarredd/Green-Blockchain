"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Plus,
  Search,
  Filter,
  Eye,
  Edit2,
  Trash2,
  RefreshCw,
  Sun,
  Wind,
  Droplets,
  Zap,
  CheckCircle2,
  SlidersHorizontal,
} from "lucide-react";
import { DashboardLayout } from "../../../components/layout/DashboardLayout";
import { PageHeader } from "../../../components/ui/PageHeader";
import { Button } from "../../../components/ui/Button";
import { Input } from "../../../components/ui/Input";
import { Select } from "../../../components/ui/Select";
import { DataTable, Column } from "../../../components/ui/DataTable";
import { StatusBadge } from "../../../components/ui/StatusBadge";
import { Modal } from "../../../components/ui/Modal";
import { ConfirmationDialog } from "../../../components/ui/ConfirmationDialog";
import { SkeletonTable } from "../../../components/ui/LoadingSkeleton";
import { EmptyState } from "../../../components/ui/EmptyState";
import { ErrorState } from "../../../components/ui/ErrorState";
import { useApp } from "../../../components/common/AppContext";
import { producersApi } from "../../../services/api";

export default function ProducerListingsPage() {
  const router = useRouter();
  const { addToast } = useApp();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [listings, setListings] = useState<any[]>([]);

  // Search, Filter, Sort, Pagination states
  const [searchTerm, setSearchTerm] = useState("");
  const [sourceFilter, setSourceFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [sortBy, setSortBy] = useState("created_desc");
  const [page, setPage] = useState(1);
  const pageSize = 8;

  // Edit Modal State
  const [editingListing, setEditingListing] = useState<any>(null);
  const [editPrice, setEditPrice] = useState("");
  const [editAvailable, setEditAvailable] = useState("");
  const [editLoading, setEditLoading] = useState(false);

  // Cancel Confirmation State
  const [cancellingId, setCancellingId] = useState<number | null>(null);
  const [cancelLoading, setCancelLoading] = useState(false);

  const fetchListings = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await producersApi.getMyListings();
      if (res.success && res.data) {
        setListings(res.data);
      } else {
        setError(res.error || "Could not load producer listings");
      }
    } catch (err: any) {
      setError(err.message || "Failed to communicate with API service");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchListings();
  }, [fetchListings]);

  // Handle Edit Submission
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
        fetchListings();
      } else {
        addToast({
          type: "error",
          title: "Update Failed",
          message: res.error || "Could not update listing parameters",
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

  // Handle Cancel Submission
  const handleCancel = async () => {
    if (!cancellingId) return;

    try {
      setCancelLoading(true);
      const res = await producersApi.deleteListing(cancellingId);
      if (res.success) {
        addToast({
          type: "success",
          title: "Listing Status Updated",
          message: `Listing #${cancellingId} has been successfully cancelled.`,
        });
        setCancellingId(null);
        fetchListings();
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

  // Filter & Sort Logic
  const filteredListings = listings.filter((l) => {
    const matchesSearch =
      searchTerm === "" ||
      l.id.toString().includes(searchTerm) ||
      (l.energy_source || "").toLowerCase().includes(searchTerm.toLowerCase());

    const matchesSource =
      sourceFilter === "ALL" ||
      (l.energy_source || "").toUpperCase() === sourceFilter.toUpperCase();

    const currentStatus = (l.listing_status || l.status || "ACTIVE").toUpperCase();
    const matchesStatus =
      statusFilter === "ALL" || currentStatus === statusFilter.toUpperCase();

    return matchesSearch && matchesSource && matchesStatus;
  });

  filteredListings.sort((a, b) => {
    const priceA = Number(a.price_per_kwh || a.unit_price_eth);
    const priceB = Number(b.price_per_kwh || b.unit_price_eth);
    const availA = Number(a.available_energy_kwh || a.available_kwh);
    const availB = Number(b.available_energy_kwh || b.available_kwh);
    const dateA = new Date(a.created_at).getTime();
    const dateB = new Date(b.created_at).getTime();

    if (sortBy === "price_asc") return priceA - priceB;
    if (sortBy === "price_desc") return priceB - priceA;
    if (sortBy === "quantity_desc") return availB - availA;
    if (sortBy === "created_asc") return dateA - dateB;
    return dateB - dateA; // created_desc
  });

  const totalPages = Math.ceil(filteredListings.length / pageSize) || 1;
  const paginatedListings = filteredListings.slice((page - 1) * pageSize, page * pageSize);

  const columns: Column<any>[] = [
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
      header: "Source",
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
      header: "Available",
      render: (r) => (
        <span className="font-semibold text-brand-600 dark:text-brand-400">
          {Number(r.available_energy_kwh || r.available_kwh).toLocaleString()} kWh
        </span>
      ),
    },
    {
      key: "price_per_kwh",
      header: "Unit Price",
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
      key: "created_at",
      header: "Created Date",
      render: (r) => (
        <span className="text-xs text-navy-500 dark:text-navy-400">
          {new Date(r.created_at).toLocaleDateString()}
        </span>
      ),
    },
    {
      key: "actions",
      header: "Actions",
      render: (r) => {
        const isCancelledOrFilled =
          (r.listing_status || r.status) === "CANCELLED" ||
          (r.listing_status || r.status) === "FILLED";

        return (
          <div className="flex items-center gap-1.5">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push(`/producer/listings/${r.id}`)}
              title="View Details"
            >
              <Eye className="w-3.5 h-3.5" />
            </Button>
            {!isCancelledOrFilled && (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setEditingListing(r);
                    setEditPrice(String(r.price_per_kwh || r.unit_price_eth));
                    setEditAvailable(String(r.available_energy_kwh || r.available_kwh));
                  }}
                  title="Edit Parameters"
                >
                  <Edit2 className="w-3.5 h-3.5 text-blue-500" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setCancellingId(r.id)}
                  title="Cancel Listing"
                >
                  <Trash2 className="w-3.5 h-3.5 text-rose-500" />
                </Button>
              </>
            )}
          </div>
        );
      },
    },
  ];

  return (
    <DashboardLayout activeNavId="listings">
      <div className="space-y-6 pb-12">
        <PageHeader
          title="Energy Listing Management"
          description="Manage, edit and monitor all renewable energy listings submitted from your smart meters."
          breadcrumbs={[
            { label: "Dashboard", href: "/producer/dashboard" },
            { label: "Listings" },
          ]}
          actions={
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                icon={RefreshCw}
                onClick={fetchListings}
              >
                Refresh
              </Button>
              <Button
                variant="primary"
                size="sm"
                icon={Plus}
                onClick={() => router.push("/producer/listings/new")}
              >
                Create Listing
              </Button>
            </div>
          }
        />

        {/* Search & Filter Controls */}
        <div className="p-4 bg-white dark:bg-navy-900 rounded-2xl border border-navy-200 dark:border-navy-800 shadow-sm flex flex-col md:flex-row items-center justify-between gap-3">
          <div className="relative w-full md:w-72">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-navy-400" />
            <Input
              type="text"
              placeholder="Search by ID or source..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setPage(1);
              }}
              className="pl-9 h-10 text-xs"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
            {/* Energy Source Filter */}
            <Select
              options={[
                { value: "ALL", label: "All Energy Sources" },
                { value: "SOLAR", label: "Solar PV" },
                { value: "WIND", label: "Wind Turbines" },
                { value: "HYDRO", label: "Hydroelectric" },
                { value: "BIOMASS", label: "Biomass" },
                { value: "HYBRID", label: "Hybrid Mix" },
              ]}
              value={sourceFilter}
              onChange={(e) => {
                setSourceFilter(e.target.value);
                setPage(1);
              }}
              className="h-10 text-xs min-w-[150px]"
            />

            {/* Status Filter */}
            <Select
              options={[
                { value: "ALL", label: "All Statuses" },
                { value: "ACTIVE", label: "Active" },
                { value: "PARTIALLY_FILLED", label: "Partially Filled" },
                { value: "FILLED", label: "Filled / Completed" },
                { value: "CANCELLED", label: "Cancelled" },
              ]}
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
              className="h-10 text-xs min-w-[130px]"
            />

            {/* Sort Dropdown */}
            <Select
              options={[
                { value: "created_desc", label: "Newest Listings" },
                { value: "created_asc", label: "Oldest Listings" },
                { value: "price_asc", label: "Price: Low to High" },
                { value: "price_desc", label: "Price: High to Low" },
                { value: "quantity_desc", label: "Highest Capacity" },
              ]}
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="h-10 text-xs min-w-[160px]"
            />
          </div>
        </div>

        {/* Table View */}
        {loading ? (
          <SkeletonTable rows={6} />
        ) : error ? (
          <ErrorState
            title="Failed to Load Listings"
            message={error}
            onRetry={fetchListings}
          />
        ) : filteredListings.length === 0 ? (
          <div className="p-12 bg-white dark:bg-navy-900 rounded-2xl border border-navy-200 dark:border-navy-800 text-center">
            <EmptyState
              title="No Listings Found"
              description={
                searchTerm || sourceFilter !== "ALL" || statusFilter !== "ALL"
                  ? "No energy listings match the selected search or filter criteria."
                  : "You haven't listed any renewable generation capacity yet."
              }
              action={{
                label: "Create New Listing",
                onClick: () => router.push("/producer/listings/new"),
              }}
            />
          </div>
        ) : (
          <DataTable
            data={paginatedListings}
            columns={columns}
            keyExtractor={(item) => item.id}
            pagination={{
              currentPage: page,
              totalPages,
              onPageChange: (p) => setPage(p),
              pageSize,
              totalItems: filteredListings.length,
            }}
          />
        )}

        {/* Quick Edit Modal */}
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
                  Save Updates
                </Button>
              </div>
            </form>
          </Modal>
        )}

        {/* Cancel Confirmation Dialog */}
        <ConfirmationDialog
          isOpen={cancellingId !== null}
          onClose={() => setCancellingId(null)}
          onConfirm={handleCancel}
          title="Cancel Energy Listing?"
          message={`Are you sure you want to cancel Listing #${cancellingId}? Unfilled bids will be removed from the market orderbook.`}
          confirmText="Yes, Cancel Listing"
          variant="danger"
          loading={cancelLoading}
        />
      </div>
    </DashboardLayout>
  );
}
