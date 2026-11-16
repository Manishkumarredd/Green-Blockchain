"use client";

import React, { useEffect, useState } from "react";
import {
  ShoppingBag,
  Search,
  Filter,
  Eye,
  AlertTriangle,
  RefreshCw,
  Zap,
  CheckCircle,
  XCircle,
  Clock,
  ExternalLink,
} from "lucide-react";
import { useApp } from "../../../components/common/AppContext";
import { DashboardLayout } from "../../../components/layout/DashboardLayout";
import { PageHeader } from "../../../components/ui/PageHeader";
import { StatusBadge } from "../../../components/ui/StatusBadge";
import { ConfirmationDialog } from "../../../components/ui/ConfirmationDialog";
import { adminApi } from "../../../services/api";

const SOURCE_COLORS: Record<string, string> = {
  SOLAR: "bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-400",
  WIND: "bg-sky-100 text-sky-800 dark:bg-sky-950/60 dark:text-sky-400",
  HYDRO: "bg-cyan-100 text-cyan-800 dark:bg-cyan-950/60 dark:text-cyan-400",
  BIOMASS: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-400",
  HYBRID: "bg-purple-100 text-purple-800 dark:bg-purple-950/60 dark:text-purple-400",
};

export default function AdminListingsPage() {
  const { setRole } = useApp();
  const [loading, setLoading] = useState(true);
  const [listings, setListings] = useState<any[]>([]);
  const [pagination, setPagination] = useState({ total: 0, page: 1, limit: 10, totalPages: 1 });
  const [search, setSearch] = useState("");
  const [sourceFilter, setSourceFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [selectedListing, setSelectedListing] = useState<any | null>(null);
  const [inspectModalOpen, setInspectModalOpen] = useState(false);
  const [statusChangeDialog, setStatusChangeDialog] = useState<{
    open: boolean;
    listing: any | null;
    targetStatus: "ACTIVE" | "SUSPENDED" | "CANCELLED";
  }>({ open: false, listing: null, targetStatus: "SUSPENDED" });
  const [actionLoading, setActionLoading] = useState(false);
  const [statusReason, setStatusReason] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    setRole("ADMIN");
  }, [setRole]);

  useEffect(() => {
    loadListings();
  }, [pagination.page, sourceFilter, statusFilter]);

  const loadListings = async () => {
    try {
      setLoading(true);
      setErrorMessage(null);
      const res = await adminApi.getListings({
        search,
        source: sourceFilter,
        status: statusFilter,
        page: pagination.page,
        limit: pagination.limit,
      });
      setListings(res.data?.listings || []);
      if (res.data?.pagination) {
        setPagination((prev) => ({ ...prev, ...res.data.pagination }));
      }
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to load energy listings");
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPagination((prev) => ({ ...prev, page: 1 }));
    loadListings();
  };

  const confirmStatusChange = async () => {
    if (!statusChangeDialog.listing) return;
    try {
      setActionLoading(true);
      setErrorMessage(null);
      await adminApi.updateListingStatus(statusChangeDialog.listing.id, {
        status: statusChangeDialog.targetStatus,
        reason: statusReason,
      });
      setSuccessMessage(`Listing #${statusChangeDialog.listing.id} status updated to ${statusChangeDialog.targetStatus}`);
      setStatusChangeDialog({ open: false, listing: null, targetStatus: "SUSPENDED" });
      setStatusReason("");
      loadListings();
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to moderate listing");
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <DashboardLayout activeNavId="listings">
      <div className="space-y-6">
        <PageHeader
          title="Energy Listing Moderation & Inventory Control"
          description="Surveil producer generation offers, inspect technical parameters, and moderate fraudulent or stale listings."
          action={
            <button
              onClick={() => {
                setPagination((prev) => ({ ...prev, page: 1 }));
                loadListings();
              }}
              disabled={loading}
              className="flex items-center px-3.5 py-2 bg-white dark:bg-navy-800 text-navy-700 dark:text-navy-200 border border-navy-200 dark:border-navy-700 rounded-xl hover:bg-slate-50 dark:hover:bg-navy-700 text-xs font-medium transition cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${loading ? "animate-spin" : ""}`} />
              Refresh Inventory
            </button>
          }
        />

        {/* Notifications */}
        {errorMessage && (
          <div className="p-4 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 rounded-2xl flex items-center justify-between text-rose-700 dark:text-rose-300 text-xs">
            <span>{errorMessage}</span>
            <button onClick={() => setErrorMessage(null)} className="font-bold underline ml-2">Dismiss</button>
          </div>
        )}
        {successMessage && (
          <div className="p-4 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-2xl flex items-center justify-between text-emerald-700 dark:text-emerald-300 text-xs">
            <span>{successMessage}</span>
            <button onClick={() => setSuccessMessage(null)} className="font-bold underline ml-2">Dismiss</button>
          </div>
        )}

        {/* Search & Filter Bar */}
        <div className="bg-white dark:bg-navy-900 p-4 rounded-2xl border border-navy-200 dark:border-navy-800 shadow-xs flex flex-col md:flex-row gap-3 items-center justify-between">
          <form onSubmit={handleSearchSubmit} className="relative w-full md:w-80">
            <Search className="w-4 h-4 text-navy-400 absolute left-3.5 top-3" />
            <input
              type="text"
              placeholder="Search producer, email, meter ID..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 dark:bg-navy-800 border border-navy-200 dark:border-navy-700 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-brand-500 text-navy-900 dark:text-white"
            />
          </form>

          <div className="flex items-center space-x-3 w-full md:w-auto">
            <div className="flex items-center space-x-2">
              <span className="text-xs text-navy-400">Source:</span>
              <select
                value={sourceFilter}
                onChange={(e) => {
                  setSourceFilter(e.target.value);
                  setPagination((prev) => ({ ...prev, page: 1 }));
                }}
                className="text-xs bg-slate-50 dark:bg-navy-800 border border-navy-200 dark:border-navy-700 rounded-xl px-3 py-2 text-navy-900 dark:text-white"
              >
                <option value="ALL">All Sources</option>
                <option value="SOLAR">Solar</option>
                <option value="WIND">Wind</option>
                <option value="HYDRO">Hydro</option>
                <option value="BIOMASS">Biomass</option>
                <option value="HYBRID">Hybrid</option>
              </select>
            </div>

            <div className="flex items-center space-x-2">
              <span className="text-xs text-navy-400">Status:</span>
              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setPagination((prev) => ({ ...prev, page: 1 }));
                }}
                className="text-xs bg-slate-50 dark:bg-navy-800 border border-navy-200 dark:border-navy-700 rounded-xl px-3 py-2 text-navy-900 dark:text-white"
              >
                <option value="ALL">All Statuses</option>
                <option value="ACTIVE">Active</option>
                <option value="SUSPENDED">Suspended</option>
                <option value="CANCELLED">Cancelled</option>
              </select>
            </div>
          </div>
        </div>

        {/* Listings Table */}
        <div className="bg-white dark:bg-navy-900 rounded-2xl border border-navy-200 dark:border-navy-800 overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-navy-950/50 text-navy-500 uppercase tracking-wider font-semibold border-b border-navy-100 dark:border-navy-800">
                <tr>
                  <th className="px-6 py-3.5">Listing ID</th>
                  <th className="px-6 py-3.5">Producer</th>
                  <th className="px-6 py-3.5">Energy Source</th>
                  <th className="px-6 py-3.5">Capacity (Available / Total)</th>
                  <th className="px-6 py-3.5">Unit Price</th>
                  <th className="px-6 py-3.5">Listed Date</th>
                  <th className="px-6 py-3.5">Status</th>
                  <th className="px-6 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-navy-100 dark:divide-navy-800 font-medium">
                {loading ? (
                  <tr>
                    <td colSpan={8} className="px-6 py-10 text-center text-navy-400">
                      <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-brand-600" />
                      Loading listings directory...
                    </td>
                  </tr>
                ) : listings.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-6 py-12 text-center text-navy-400">
                      No matching energy listings found.
                    </td>
                  </tr>
                ) : (
                  listings.map((l) => {
                    const source = (l.energy_source || "SOLAR").toUpperCase();
                    const avail = Number(l.available_energy_kwh ?? l.availableKwh ?? 0);
                    const total = Number(l.total_energy_kwh ?? l.totalEnergyKwh ?? 0);
                    const pct = total > 0 ? Math.round((avail / total) * 100) : 0;

                    return (
                      <tr key={l.id} className="hover:bg-slate-50/50 dark:hover:bg-navy-800/40">
                        <td className="px-6 py-4 font-mono font-bold text-brand-600">
                          #{l.id}
                        </td>
                        <td className="px-6 py-4">
                          <div className="font-bold text-navy-900 dark:text-white">
                            {l.producer_name || `Producer #${l.producer_id}`}
                          </div>
                          <div className="text-[11px] text-navy-400 font-mono">
                            {l.producer_meter_id || "Meter: N/A"}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${SOURCE_COLORS[source] || "bg-slate-100 text-slate-800"}`}>
                            {source}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="space-y-1">
                            <div className="font-bold text-navy-900 dark:text-white">
                              {avail} / {total} kWh
                            </div>
                            <div className="w-24 bg-slate-100 dark:bg-navy-800 h-1.5 rounded-full overflow-hidden">
                              <div
                                className="bg-brand-500 h-full rounded-full"
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 font-mono font-bold text-navy-900 dark:text-white">
                          {l.price_per_kwh} ETH
                        </td>
                        <td className="px-6 py-4 text-navy-400">
                          {new Date(l.created_at || Date.now()).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4">
                          <StatusBadge
                            status={l.listing_status === "ACTIVE" ? "ACTIVE" : l.listing_status === "SUSPENDED" ? "FAILED" : "PENDING"}
                            label={l.listing_status || "ACTIVE"}
                            size="sm"
                          />
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end space-x-2">
                            <button
                              onClick={() => {
                                setSelectedListing(l);
                                setInspectModalOpen(true);
                              }}
                              className="p-1.5 rounded-lg bg-slate-100 dark:bg-navy-800 text-navy-600 dark:text-navy-300 hover:text-brand-600 transition cursor-pointer"
                              title="Inspect Technical Specs"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>

                            {l.listing_status === "ACTIVE" ? (
                              <button
                                onClick={() =>
                                  setStatusChangeDialog({
                                    open: true,
                                    listing: l,
                                    targetStatus: "SUSPENDED",
                                  })
                                }
                                className="p-1.5 rounded-lg bg-rose-50 text-rose-600 hover:bg-rose-100 dark:bg-rose-950/40 dark:text-rose-400 cursor-pointer"
                                title="Suspend Listing"
                              >
                                <XCircle className="w-3.5 h-3.5" />
                              </button>
                            ) : (
                              <button
                                onClick={() =>
                                  setStatusChangeDialog({
                                    open: true,
                                    listing: l,
                                    targetStatus: "ACTIVE",
                                  })
                                }
                                className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:text-emerald-400 cursor-pointer"
                                title="Reactivate Listing"
                              >
                                <CheckCircle className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls */}
          <div className="p-4 border-t border-navy-100 dark:border-navy-800 flex items-center justify-between text-xs text-navy-500">
            <div>
              Showing {listings.length} of {pagination.total} listings
            </div>
            <div className="flex items-center space-x-2">
              <button
                disabled={pagination.page <= 1 || loading}
                onClick={() => setPagination((prev) => ({ ...prev, page: prev.page - 1 }))}
                className="px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-navy-800 border border-navy-200 dark:border-navy-700 disabled:opacity-40 cursor-pointer"
              >
                Previous
              </button>
              <span className="font-bold text-navy-900 dark:text-white px-2">
                Page {pagination.page} of {pagination.totalPages}
              </span>
              <button
                disabled={pagination.page >= pagination.totalPages || loading}
                onClick={() => setPagination((prev) => ({ ...prev, page: prev.page + 1 }))}
                className="px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-navy-800 border border-navy-200 dark:border-navy-700 disabled:opacity-40 cursor-pointer"
              >
                Next
              </button>
            </div>
          </div>
        </div>

        {/* Modal: Listing Deep Inspection */}
        {inspectModalOpen && selectedListing && (
          <div className="fixed inset-0 z-50 bg-navy-950/70 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white dark:bg-navy-900 border border-navy-200 dark:border-navy-800 rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-5 animate-in fade-in duration-150">
              <div className="flex justify-between items-center pb-4 border-b border-navy-100 dark:border-navy-800">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-2xl bg-amber-50 dark:bg-amber-950/60 flex items-center justify-center text-amber-600 font-bold">
                    <ShoppingBag className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-navy-900 dark:text-white">
                      Listing #{selectedListing.id} Details
                    </h3>
                    <p className="text-xs text-navy-400">Producer: {selectedListing.producer_name}</p>
                  </div>
                </div>
                <button
                  onClick={() => setInspectModalOpen(false)}
                  className="text-navy-400 hover:text-navy-600 text-lg cursor-pointer"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-4 text-xs">
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 bg-slate-50 dark:bg-navy-800/50 rounded-xl">
                    <div className="text-navy-400">Energy Source</div>
                    <div className="font-bold text-navy-900 dark:text-white mt-0.5">{selectedListing.energy_source}</div>
                  </div>
                  <div className="p-3 bg-slate-50 dark:bg-navy-800/50 rounded-xl">
                    <div className="text-navy-400">Status</div>
                    <div className="font-bold text-navy-900 dark:text-white mt-0.5">{selectedListing.listing_status}</div>
                  </div>
                  <div className="p-3 bg-slate-50 dark:bg-navy-800/50 rounded-xl">
                    <div className="text-navy-400">Total Capacity</div>
                    <div className="font-bold text-navy-900 dark:text-white mt-0.5">{selectedListing.total_energy_kwh} kWh</div>
                  </div>
                  <div className="p-3 bg-slate-50 dark:bg-navy-800/50 rounded-xl">
                    <div className="text-navy-400">Remaining Available</div>
                    <div className="font-bold text-emerald-600 mt-0.5">{selectedListing.available_energy_kwh} kWh</div>
                  </div>
                  <div className="p-3 bg-slate-50 dark:bg-navy-800/50 rounded-xl">
                    <div className="text-navy-400">Unit Price</div>
                    <div className="font-mono font-bold text-navy-900 dark:text-white mt-0.5">{selectedListing.price_per_kwh} ETH / kWh</div>
                  </div>
                  <div className="p-3 bg-slate-50 dark:bg-navy-800/50 rounded-xl">
                    <div className="text-navy-400">Minimum Order</div>
                    <div className="font-bold text-navy-900 dark:text-white mt-0.5">{selectedListing.min_purchase_kwh || 1.0} kWh</div>
                  </div>
                  <div className="p-3 bg-slate-50 dark:bg-navy-800/50 rounded-xl col-span-2">
                    <div className="text-navy-400">Producer Wallet Address</div>
                    <div className="font-mono text-xs text-navy-900 dark:text-white mt-0.5 break-all">
                      {selectedListing.producer_wallet || "Not connected"}
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-2">
                <button
                  onClick={() => setInspectModalOpen(false)}
                  className="w-full py-2 bg-slate-100 dark:bg-navy-800 hover:bg-slate-200 text-navy-700 dark:text-navy-200 font-bold rounded-xl text-xs transition cursor-pointer"
                >
                  Close Inspection
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal: Moderation Confirmation Dialog */}
        <ConfirmationDialog
          isOpen={statusChangeDialog.open}
          onClose={() => setStatusChangeDialog({ open: false, listing: null, targetStatus: "SUSPENDED" })}
          onConfirm={confirmStatusChange}
          isLoading={actionLoading}
          title={statusChangeDialog.targetStatus === "SUSPENDED" ? "Suspend Energy Listing" : "Reactivate Energy Listing"}
          description={`Are you sure you want to change the status of Listing #${statusChangeDialog.listing?.id} to ${statusChangeDialog.targetStatus}? Moderating listings preserves historical transactions and does not mutate settled on-chain trades.`}
          confirmLabel={statusChangeDialog.targetStatus === "SUSPENDED" ? "Confirm Suspension" : "Confirm Reactivation"}
          variant={statusChangeDialog.targetStatus === "SUSPENDED" ? "danger" : "primary"}
        />
      </div>
    </DashboardLayout>
  );
}
