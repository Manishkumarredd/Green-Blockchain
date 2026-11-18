"use client";

import React, { useState, useEffect, useCallback, use } from "react";
import { useRouter, useParams } from "next/navigation";
import {
  ArrowLeft,
  Edit2,
  Trash2,
  Sun,
  Wind,
  Droplets,
  Flame,
  Zap,
  CheckCircle2,
  Clock,
  Coins,
  ShieldCheck,
  Activity,
  Layers,
  UserCheck,
} from "lucide-react";
import { DashboardLayout } from "../../../../components/layout/DashboardLayout";
import { PageHeader } from "../../../../components/ui/PageHeader";
import { Card } from "../../../../components/ui/Card";
import { Button } from "../../../../components/ui/Button";
import { StatusBadge } from "../../../../components/ui/StatusBadge";
import { DataTable, Column } from "../../../../components/ui/DataTable";
import { Modal } from "../../../../components/ui/Modal";
import { ConfirmationDialog } from "../../../../components/ui/ConfirmationDialog";
import { Input } from "../../../../components/ui/Input";
import { SkeletonCard, SkeletonTable } from "../../../../components/ui/LoadingSkeleton";
import { EmptyState } from "../../../../components/ui/EmptyState";
import { ErrorState } from "../../../../components/ui/ErrorState";
import { useApp } from "../../../../components/common/AppContext";
import { producersApi } from "../../../../services/api";

export default function ProducerListingDetailsClient() {
  const rawParams = useParams();
  const listingId = (rawParams?.id as string) || "1";
  const router = useRouter();
  const { addToast } = useApp();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [listing, setListing] = useState<any>(null);

  // Edit & Cancel Modal states
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editPrice, setEditPrice] = useState("");
  const [editAvailable, setEditAvailable] = useState("");
  const [editLoading, setEditLoading] = useState(false);

  const [isCancelOpen, setIsCancelOpen] = useState(false);
  const [cancelLoading, setCancelLoading] = useState(false);

  const fetchListing = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await producersApi.getListingById(listingId);
      if (res.success && res.data) {
        setListing(res.data);
        setEditPrice(String(res.data.price_per_kwh || res.data.unit_price_eth));
        setEditAvailable(String(res.data.available_energy_kwh || res.data.available_kwh));
      } else {
        setError(res.error || "Failed to load energy listing details");
      }
    } catch (err: any) {
      setError(err.message || "Failed to communicate with API service");
    } finally {
      setLoading(false);
    }
  }, [listingId]);

  useEffect(() => {
    fetchListing();
  }, [fetchListing]);

  // Handle Edit Submit
  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setEditLoading(true);
      const res = await producersApi.updateListing(listingId, {
        pricePerKwh: Number(editPrice),
        availableEnergyKwh: Number(editAvailable),
      });

      if (res.success) {
        addToast({
          type: "success",
          title: "Listing Updated",
          message: `Listing #${listingId} parameters successfully saved.`,
        });
        setIsEditOpen(false);
        fetchListing();
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

  // Handle Cancel Submit
  const handleCancel = async () => {
    try {
      setCancelLoading(true);
      const res = await producersApi.deleteListing(listingId);
      if (res.success) {
        addToast({
          type: "success",
          title: "Listing Status Updated",
          message: `Listing #${listingId} has been successfully cancelled.`,
        });
        setIsCancelOpen(false);
        fetchListing();
      } else {
        addToast({
          type: "error",
          title: "Cancellation Failed",
          message: res.error || "Could not cancel listing",
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
      <DashboardLayout activeNavId="listings">
        <div className="space-y-6 pb-12 animate-pulse">
          <div className="h-8 bg-navy-200 dark:bg-navy-800 rounded-lg w-1/4 mb-4" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </div>
          <SkeletonTable rows={4} />
        </div>
      </DashboardLayout>
    );
  }

  if (error || !listing) {
    return (
      <DashboardLayout activeNavId="listings">
        <div className="py-12">
          <ErrorState
            title="Listing Not Found"
            message={error || `Could not find energy listing with ID #${listingId}`}
            onRetry={fetchListing}
          />
        </div>
      </DashboardLayout>
    );
  }

  const totalKwh = Number(listing.total_energy_kwh || listing.quantity_kwh || 0);
  const availKwh = Number(listing.available_energy_kwh || listing.available_kwh || 0);
  const soldKwh = Math.max(0, totalKwh - availKwh);
  const fulfillmentPercent = totalKwh > 0 ? ((soldKwh / totalKwh) * 100).toFixed(1) : "0";

  const isCancelledOrFilled =
    (listing.listing_status || listing.status) === "CANCELLED" ||
    (listing.listing_status || listing.status) === "FILLED";

  const relatedTransactions = listing.related_transactions || [];

  const txColumns: Column<any>[] = [
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
      header: "Settled Volume",
      render: (r) => (
        <span className="font-semibold text-navy-800 dark:text-navy-100">
          {Number(r.energy_quantity_kwh).toLocaleString()} kWh
        </span>
      ),
    },
    {
      key: "price_per_kwh",
      header: "Price / kWh",
      render: (r) => (
        <span className="font-mono text-xs text-navy-600 dark:text-navy-400">
          {r.price_per_kwh} ETH
        </span>
      ),
    },
    {
      key: "total_amount",
      header: "Total Settlement",
      render: (r) => (
        <span className="font-mono text-xs font-bold text-brand-600 dark:text-brand-400">
          {r.total_amount} ETH
        </span>
      ),
    },
    {
      key: "created_at",
      header: "Settlement Time",
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
    <DashboardLayout activeNavId="listings">
      <div className="space-y-6 pb-12">
        <PageHeader
          title={`Energy Listing #${listing.id}`}
          description={`Registered on ${new Date(listing.created_at).toLocaleDateString()} via Smart Meter ${listing.meter_id || "METER-PROD-SOL-101"}`}
          breadcrumbs={[
            { label: "Dashboard", href: "/producer/dashboard" },
            { label: "Listings", href: "/producer/listings" },
            { label: `#${listing.id}` },
          ]}
          actions={
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                icon={ArrowLeft}
                onClick={() => router.push("/producer/listings")}
              >
                Back
              </Button>
              {!isCancelledOrFilled && (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    icon={Edit2}
                    onClick={() => setIsEditOpen(true)}
                  >
                    Edit
                  </Button>
                  <Button
                    variant="danger"
                    size="sm"
                    icon={Trash2}
                    onClick={() => setIsCancelOpen(true)}
                  >
                    Cancel Listing
                  </Button>
                </>
              )}
            </div>
          }
        />

        {/* Top Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="p-4 flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-brand-50 dark:bg-brand-950/40 text-brand-600 dark:text-brand-400">
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[11px] font-bold uppercase text-navy-400">Energy Source</p>
              <div className="mt-0.5">
                <StatusBadge status={listing.energy_source} size="sm" />
              </div>
            </div>
          </Card>

          <Card className="p-4 flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[11px] font-bold uppercase text-navy-400">Available / Total</p>
              <p className="text-sm font-bold text-navy-900 dark:text-white mt-0.5">
                {availKwh} / {totalKwh} kWh
              </p>
            </div>
          </Card>

          <Card className="p-4 flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400">
              <Coins className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[11px] font-bold uppercase text-navy-400">Price Rate</p>
              <p className="font-mono text-sm font-bold text-navy-900 dark:text-white mt-0.5">
                {listing.price_per_kwh || listing.unit_price_eth} ETH
              </p>
            </div>
          </Card>

          <Card className="p-4 flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400">
              <Activity className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[11px] font-bold uppercase text-navy-400">Listing Status</p>
              <div className="mt-0.5">
                <StatusBadge status={listing.listing_status || listing.status} size="sm" />
              </div>
            </div>
          </Card>
        </div>

        {/* Capacity Breakdown & Fulfillment Progress */}
        <Card className="p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-sm text-navy-900 dark:text-white">
                Capacity Fulfillment & Clearing Progress
              </h3>
              <p className="text-xs text-navy-500 dark:text-navy-400">
                {soldKwh} kWh fulfilled ({fulfillmentPercent}%) of total {totalKwh} kWh listed capacity.
              </p>
            </div>
            <span className="font-mono text-xs font-bold text-brand-600 dark:text-brand-400">
              {availKwh} kWh Available
            </span>
          </div>

          {/* Dual Bar Progress Indicator */}
          <div className="h-3 w-full bg-navy-100 dark:bg-navy-800 rounded-full overflow-hidden flex">
            <div
              className="bg-navy-900 dark:bg-navy-200 h-full transition-all duration-500"
              style={{ width: `${fulfillmentPercent}%` }}
              title={`Sold: ${soldKwh} kWh`}
            />
            <div
              className="bg-brand-500 h-full transition-all duration-500"
              style={{ width: `${100 - parseFloat(fulfillmentPercent)}%` }}
              title={`Available: ${availKwh} kWh`}
            />
          </div>

          <div className="flex items-center justify-between text-xs text-navy-500 dark:text-navy-400 pt-1">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-sm bg-navy-900 dark:bg-navy-200" />
              <span>Fulfilled Capacity ({soldKwh} kWh)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-sm bg-brand-500" />
              <span>Available on Orderbook ({availKwh} kWh)</span>
            </div>
          </div>
        </Card>

        {/* Related Transactions Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-navy-900 dark:text-white">
                Clearing Transactions Tied to this Listing
              </h3>
              <p className="text-xs text-navy-500 dark:text-navy-400">
                Audited consumer purchases and double-auction allocations.
              </p>
            </div>
            <span className="text-xs font-mono font-semibold text-navy-400">
              {relatedTransactions.length} Settlements
            </span>
          </div>

          {relatedTransactions.length === 0 ? (
            <div className="p-8 bg-white dark:bg-navy-900 rounded-2xl border border-navy-200 dark:border-navy-800 text-center">
              <EmptyState
                title="No Transactions Yet"
                description="This listing is currently active on the market. Settlements will record here once consumer demand matches are cleared."
              />
            </div>
          ) : (
            <DataTable
              data={relatedTransactions}
              columns={txColumns}
              keyExtractor={(item) => item.id}
            />
          )}
        </div>

        {/* Quick Edit Modal */}
        {isEditOpen && (
          <Modal
            isOpen={true}
            onClose={() => setIsEditOpen(false)}
            title={`Edit Listing #${listing.id}`}
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
                  Available Capacity (kWh)
                </label>
                <Input
                  type="number"
                  step="0.1"
                  min="0"
                  max={totalKwh}
                  required
                  value={editAvailable}
                  onChange={(e) => setEditAvailable(e.target.value)}
                />
                <p className="text-[10px] text-navy-400 mt-1">
                  Max capacity certified: {totalKwh} kWh
                </p>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-navy-100 dark:border-navy-800">
                <Button
                  variant="secondary"
                  type="button"
                  onClick={() => setIsEditOpen(false)}
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

        {/* Cancel Confirmation Dialog */}
        <ConfirmationDialog
          isOpen={isCancelOpen}
          onClose={() => setIsCancelOpen(false)}
          onConfirm={handleCancel}
          title="Cancel Energy Listing?"
          message={`Are you sure you want to cancel Listing #${listing.id}? This listing will be immediately removed from the active marketplace orderbook.`}
          confirmText="Yes, Cancel Listing"
          variant="danger"
          loading={cancelLoading}
        />
      </div>
    </DashboardLayout>
  );
}
