"use client";

import React, { useEffect, useState } from "react";
import {
  Sliders,
  Search,
  Filter,
  Eye,
  RefreshCw,
  Clock,
  CheckCircle,
  AlertCircle,
  Scale,
} from "lucide-react";
import { useApp } from "../../../components/common/AppContext";
import { DashboardLayout } from "../../../components/layout/DashboardLayout";
import { PageHeader } from "../../../components/ui/PageHeader";
import { StatusBadge } from "../../../components/ui/StatusBadge";
import { adminApi } from "../../../services/api";

const PRIORITY_BADGES: Record<string, string> = {
  "2": "bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-400 border border-rose-300 dark:border-rose-800",
  "1.5": "bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-400 border border-amber-300 dark:border-amber-800",
  "1": "bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300 border border-slate-300 dark:border-slate-700",
};

export default function AdminRequestsPage() {
  const { setRole } = useApp();
  const [loading, setLoading] = useState(true);
  const [requests, setRequests] = useState<any[]>([]);
  const [pagination, setPagination] = useState({ total: 0, page: 1, limit: 10, totalPages: 1 });
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [priorityFilter, setPriorityFilter] = useState("ALL");
  const [selectedRequest, setSelectedRequest] = useState<any | null>(null);
  const [inspectModalOpen, setInspectModalOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    setRole("ADMIN");
  }, [setRole]);

  useEffect(() => {
    loadRequests();
  }, [pagination.page, statusFilter, priorityFilter]);

  const loadRequests = async () => {
    try {
      setLoading(true);
      setErrorMessage(null);
      const res = await adminApi.getRequests({
        search,
        status: statusFilter,
        priority: priorityFilter,
        page: pagination.page,
        limit: pagination.limit,
      });
      setRequests(res.data?.requests || []);
      if (res.data?.pagination) {
        setPagination((prev) => ({ ...prev, ...res.data.pagination }));
      }
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to load energy requests");
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPagination((prev) => ({ ...prev, page: 1 }));
    loadRequests();
  };

  return (
    <DashboardLayout activeNavId="requests">
      <div className="space-y-6">
        <PageHeader
          title="Energy Demands & Consumer Request Management"
          description="Surveil all consumer purchase requests entering the double-auction matching engine and Phase 7 proportional allocation."
          action={
            <button
              onClick={() => {
                setPagination((prev) => ({ ...prev, page: 1 }));
                loadRequests();
              }}
              disabled={loading}
              className="flex items-center px-3.5 py-2 bg-white dark:bg-navy-800 text-navy-700 dark:text-navy-200 border border-navy-200 dark:border-navy-700 rounded-xl hover:bg-slate-50 dark:hover:bg-navy-700 text-xs font-medium transition cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${loading ? "animate-spin" : ""}`} />
              Refresh Queue
            </button>
          }
        />

        {errorMessage && (
          <div className="p-4 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 rounded-2xl flex items-center justify-between text-rose-700 dark:text-rose-300 text-xs">
            <span>{errorMessage}</span>
            <button onClick={() => setErrorMessage(null)} className="font-bold underline ml-2">Dismiss</button>
          </div>
        )}

        {/* Search & Filter Bar */}
        <div className="bg-white dark:bg-navy-900 p-4 rounded-2xl border border-navy-200 dark:border-navy-800 shadow-xs flex flex-col md:flex-row gap-3 items-center justify-between">
          <form onSubmit={handleSearchSubmit} className="relative w-full md:w-80">
            <Search className="w-4 h-4 text-navy-400 absolute left-3.5 top-3" />
            <input
              type="text"
              placeholder="Search consumer, email, meter ID..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 dark:bg-navy-800 border border-navy-200 dark:border-navy-700 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-brand-500 text-navy-900 dark:text-white"
            />
          </form>

          <div className="flex items-center space-x-3 w-full md:w-auto">
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
                <option value="PENDING">Pending Clearing</option>
                <option value="PARTIALLY_MATCHED">Partially Matched</option>
                <option value="FULFILLED">Fulfilled</option>
                <option value="CANCELLED">Cancelled</option>
              </select>
            </div>

            <div className="flex items-center space-x-2">
              <span className="text-xs text-navy-400">Priority:</span>
              <select
                value={priorityFilter}
                onChange={(e) => {
                  setPriorityFilter(e.target.value);
                  setPagination((prev) => ({ ...prev, page: 1 }));
                }}
                className="text-xs bg-slate-50 dark:bg-navy-800 border border-navy-200 dark:border-navy-700 rounded-xl px-3 py-2 text-navy-900 dark:text-white"
              >
                <option value="ALL">All Tiers</option>
                <option value="CRITICAL">Critical (2.0x)</option>
                <option value="COMMERCIAL">Commercial (1.5x)</option>
                <option value="STANDARD">Standard (1.0x)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Requests Table */}
        <div className="bg-white dark:bg-navy-900 rounded-2xl border border-navy-200 dark:border-navy-800 overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-navy-950/50 text-navy-500 uppercase tracking-wider font-semibold border-b border-navy-100 dark:border-navy-800">
                <tr>
                  <th className="px-6 py-3.5">Request ID</th>
                  <th className="px-6 py-3.5">Consumer</th>
                  <th className="px-6 py-3.5">Priority Weight</th>
                  <th className="px-6 py-3.5">Target Listing / Source</th>
                  <th className="px-6 py-3.5">Requested Demand</th>
                  <th className="px-6 py-3.5">Max Willingness-to-Pay</th>
                  <th className="px-6 py-3.5">Date Placed</th>
                  <th className="px-6 py-3.5">Status</th>
                  <th className="px-6 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-navy-100 dark:divide-navy-800 font-medium">
                {loading ? (
                  <tr>
                    <td colSpan={9} className="px-6 py-10 text-center text-navy-400">
                      <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-brand-600" />
                      Loading demand queue...
                    </td>
                  </tr>
                ) : requests.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="px-6 py-12 text-center text-navy-400">
                      No matching energy requests found.
                    </td>
                  </tr>
                ) : (
                  requests.map((r) => {
                    const weightStr = String(r.priority_weight || 1.0);
                    return (
                      <tr key={r.id} className="hover:bg-slate-50/50 dark:hover:bg-navy-800/40">
                        <td className="px-6 py-4 font-mono font-bold text-brand-600">
                          #{r.id}
                        </td>
                        <td className="px-6 py-4">
                          <div className="font-bold text-navy-900 dark:text-white">
                            {r.consumer_name || `Consumer #${r.consumer_id}`}
                          </div>
                          <div className="text-[11px] text-navy-400 font-mono">
                            {r.consumer_meter_id || "Meter: N/A"}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${PRIORITY_BADGES[weightStr] || "bg-slate-100 text-slate-800"}`}>
                            {weightStr === "2" ? "Critical (2.0x)" : weightStr === "1.5" ? "Commercial (1.5x)" : "Standard (1.0x)"}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="font-bold text-navy-800 dark:text-navy-200">
                            {r.energy_source || "Any Green Source"}
                          </div>
                          {r.listing_id && (
                            <div className="text-[11px] text-navy-400">Listing #{r.listing_id}</div>
                          )}
                        </td>
                        <td className="px-6 py-4 font-bold text-navy-900 dark:text-white">
                          {r.requested_energy_kwh || r.requestedKwh} kWh
                        </td>
                        <td className="px-6 py-4 font-mono">
                          {r.max_acceptable_price ? `${r.max_acceptable_price} ETH` : "Market Tariff"}
                        </td>
                        <td className="px-6 py-4 text-navy-400">
                          {new Date(r.created_at || Date.now()).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4">
                          <StatusBadge
                            status={r.request_status === "FULFILLED" ? "ACTIVE" : r.request_status === "PARTIALLY_MATCHED" ? "PENDING" : r.request_status === "CANCELLED" ? "FAILED" : "PENDING"}
                            label={r.request_status || "PENDING"}
                            size="sm"
                          />
                        </td>
                        <td className="px-6 py-4 text-right">
                          <button
                            onClick={() => {
                              setSelectedRequest(r);
                              setInspectModalOpen(true);
                            }}
                            className="p-1.5 rounded-lg bg-slate-100 dark:bg-navy-800 text-navy-600 dark:text-navy-300 hover:text-brand-600 transition cursor-pointer"
                            title="Inspect Request"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
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
              Showing {requests.length} of {pagination.total} demands
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

        {/* Modal: Demand Deep Inspection */}
        {inspectModalOpen && selectedRequest && (
          <div className="fixed inset-0 z-50 bg-navy-950/70 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white dark:bg-navy-900 border border-navy-200 dark:border-navy-800 rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-5 animate-in fade-in duration-150">
              <div className="flex justify-between items-center pb-4 border-b border-navy-100 dark:border-navy-800">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-2xl bg-sky-50 dark:bg-sky-950/60 flex items-center justify-center text-sky-600 font-bold">
                    <Sliders className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-navy-900 dark:text-white">
                      Demand Request #{selectedRequest.id}
                    </h3>
                    <p className="text-xs text-navy-400">Consumer: {selectedRequest.consumer_name}</p>
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
                    <div className="text-navy-400">Requested Quantity</div>
                    <div className="font-bold text-navy-900 dark:text-white mt-0.5">{selectedRequest.requested_energy_kwh || selectedRequest.requestedKwh} kWh</div>
                  </div>
                  <div className="p-3 bg-slate-50 dark:bg-navy-800/50 rounded-xl">
                    <div className="text-navy-400">Status</div>
                    <div className="font-bold text-navy-900 dark:text-white mt-0.5">{selectedRequest.request_status}</div>
                  </div>
                  <div className="p-3 bg-slate-50 dark:bg-navy-800/50 rounded-xl">
                    <div className="text-navy-400">Priority Weight Tier</div>
                    <div className="font-bold text-navy-900 dark:text-white mt-0.5">{selectedRequest.priority_weight}x Priority</div>
                  </div>
                  <div className="p-3 bg-slate-50 dark:bg-navy-800/50 rounded-xl">
                    <div className="text-navy-400">Max Willingness-to-Pay</div>
                    <div className="font-mono font-bold text-navy-900 dark:text-white mt-0.5">
                      {selectedRequest.max_acceptable_price ? `${selectedRequest.max_acceptable_price} ETH` : "Market Tariff"}
                    </div>
                  </div>
                  {selectedRequest.message && (
                    <div className="p-3 bg-slate-50 dark:bg-navy-800/50 rounded-xl col-span-2">
                      <div className="text-navy-400">Consumer Note</div>
                      <div className="italic text-navy-800 dark:text-navy-200 mt-0.5">"{selectedRequest.message}"</div>
                    </div>
                  )}
                </div>

                <div className="p-3 bg-brand-50 dark:bg-brand-950/40 border border-brand-200 dark:border-brand-800/60 rounded-xl flex items-start space-x-2.5">
                  <Scale className="w-4 h-4 text-brand-600 flex-shrink-0 mt-0.5" />
                  <div className="text-[11px] text-brand-900 dark:text-brand-300">
                    <strong>Algorithmic Integrity Note:</strong> Demand fulfillment is governed exclusively by Phase 7 Demand-Aware Weighted Proportional Allocation. Administrators cannot manually override allocation shares to protect mathematical fairness.
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
      </div>
    </DashboardLayout>
  );
}
