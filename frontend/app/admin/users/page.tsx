"use client";

import React, { useEffect, useState } from "react";
import {
  Users,
  Search,
  Filter,
  CheckCircle,
  XCircle,
  Shield,
  Eye,
  AlertTriangle,
  RefreshCw,
  Zap,
  ShoppingBag,
  Coins,
  Sliders,
  Wallet,
  Clock,
  ExternalLink,
} from "lucide-react";
import { useApp } from "../../../components/common/AppContext";
import { DashboardLayout } from "../../../components/layout/DashboardLayout";
import { PageHeader } from "../../../components/ui/PageHeader";
import { StatusBadge } from "../../../components/ui/StatusBadge";
import { ConfirmationDialog } from "../../../components/ui/ConfirmationDialog";
import { adminApi } from "../../../services/api";

export default function AdminUsersPage() {
  const { setRole } = useApp();
  const [currentAdminId, setCurrentAdminId] = useState<number | string>(1);
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<any[]>([]);
  const [pagination, setPagination] = useState({ total: 0, page: 1, limit: 10, totalPages: 1 });
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [selectedUser, setSelectedUser] = useState<any | null>(null);
  const [inspectModalOpen, setInspectModalOpen] = useState(false);
  const [inspectLoading, setInspectLoading] = useState(false);
  const [statusChangeDialog, setStatusChangeDialog] = useState<{
    open: boolean;
    user: any | null;
    targetStatus: "ACTIVE" | "SUSPENDED";
  }>({ open: false, user: null, targetStatus: "SUSPENDED" });
  const [actionLoading, setActionLoading] = useState(false);
  const [statusReason, setStatusReason] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    setRole("ADMIN");
    try {
      const stored = localStorage.getItem("greenledger_user") || localStorage.getItem("user");
      if (stored) {
        const u = JSON.parse(stored);
        if (u.id) setCurrentAdminId(u.id);
      }
    } catch (_) {}
  }, [setRole]);

  useEffect(() => {
    loadUsers();
  }, [pagination.page, roleFilter, statusFilter]);

  const loadUsers = async () => {
    try {
      setLoading(true);
      setErrorMessage(null);
      const res = await adminApi.getUsers({
        search,
        role: roleFilter,
        status: statusFilter,
        page: pagination.page,
        limit: pagination.limit,
      });
      setUsers(res.data?.users || []);
      if (res.data?.pagination) {
        setPagination((prev) => ({ ...prev, ...res.data.pagination }));
      }
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to load platform users");
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPagination((prev) => ({ ...prev, page: 1 }));
    loadUsers();
  };

  const handleInspectUser = async (userId: number | string) => {
    try {
      setInspectLoading(true);
      setInspectModalOpen(true);
      const res = await adminApi.getUserById(userId);
      setSelectedUser(res.data);
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to load user profile");
      setInspectModalOpen(false);
    } finally {
      setInspectLoading(false);
    }
  };

  const confirmStatusChange = async () => {
    if (!statusChangeDialog.user) return;
    try {
      setActionLoading(true);
      setErrorMessage(null);
      await adminApi.updateUserStatus(statusChangeDialog.user.id, {
        status: statusChangeDialog.targetStatus,
        reason: statusReason,
      });
      setSuccessMessage(`Account status for ${statusChangeDialog.user.full_name || statusChangeDialog.user.name} changed to ${statusChangeDialog.targetStatus}`);
      setStatusChangeDialog({ open: false, user: null, targetStatus: "SUSPENDED" });
      setStatusReason("");
      loadUsers();
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to update user account status");
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <DashboardLayout activeNavId="users">
      <div className="space-y-6">
        <PageHeader
          title="User Management & Identity Verification"
          description="Surveil all registered microgrid prosumers, clean energy consumers, and system operators."
          action={
            <button
              onClick={() => {
                setPagination((prev) => ({ ...prev, page: 1 }));
                loadUsers();
              }}
              disabled={loading}
              className="flex items-center px-3.5 py-2 bg-white dark:bg-navy-800 text-navy-700 dark:text-navy-200 border border-navy-200 dark:border-navy-700 rounded-xl hover:bg-slate-50 dark:hover:bg-navy-700 text-xs font-medium transition cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${loading ? "animate-spin" : ""}`} />
              Refresh Registry
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
              placeholder="Search by name, email, wallet..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 dark:bg-navy-800 border border-navy-200 dark:border-navy-700 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-brand-500 text-navy-900 dark:text-white"
            />
          </form>

          <div className="flex items-center space-x-3 w-full md:w-auto">
            <div className="flex items-center space-x-2">
              <span className="text-xs text-navy-400">Role:</span>
              <select
                value={roleFilter}
                onChange={(e) => {
                  setRoleFilter(e.target.value);
                  setPagination((prev) => ({ ...prev, page: 1 }));
                }}
                className="text-xs bg-slate-50 dark:bg-navy-800 border border-navy-200 dark:border-navy-700 rounded-xl px-3 py-2 text-navy-900 dark:text-white"
              >
                <option value="ALL">All Roles</option>
                <option value="PRODUCER">Producers</option>
                <option value="CONSUMER">Consumers</option>
                <option value="ADMIN">Administrators</option>
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
                <option value="INACTIVE">Inactive</option>
              </select>
            </div>
          </div>
        </div>

        {/* Users Table */}
        <div className="bg-white dark:bg-navy-900 rounded-2xl border border-navy-200 dark:border-navy-800 overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-navy-950/50 text-navy-500 uppercase tracking-wider font-semibold border-b border-navy-100 dark:border-navy-800">
                <tr>
                  <th className="px-6 py-3.5">User</th>
                  <th className="px-6 py-3.5">Role</th>
                  <th className="px-6 py-3.5">Smart Meter ID</th>
                  <th className="px-6 py-3.5">Wallet Connection</th>
                  <th className="px-6 py-3.5">Registered</th>
                  <th className="px-6 py-3.5">Status</th>
                  <th className="px-6 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-navy-100 dark:divide-navy-800 font-medium">
                {loading ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-10 text-center text-navy-400">
                      <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-brand-600" />
                      Loading user registry...
                    </td>
                  </tr>
                ) : users.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-navy-400">
                      No matching user accounts found.
                    </td>
                  </tr>
                ) : (
                  users.map((user) => {
                    const isSelf = Boolean(currentAdminId && String(currentAdminId) === String(user.id));
                    return (
                      <tr key={user.id} className="hover:bg-slate-50/50 dark:hover:bg-navy-800/40">
                        <td className="px-6 py-4">
                          <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 rounded-full bg-navy-100 dark:bg-navy-800 flex items-center justify-center font-bold text-xs text-navy-600 dark:text-navy-300">
                              {user.full_name?.charAt(0) || user.name?.charAt(0) || "U"}
                            </div>
                            <div>
                              <div className="font-bold text-navy-900 dark:text-white flex items-center">
                                {user.full_name || user.name}
                                {isSelf && (
                                  <span className="ml-2 text-[10px] bg-purple-100 text-purple-800 dark:bg-purple-950/60 dark:text-purple-400 px-1.5 py-0.2 rounded font-bold">
                                    You
                                  </span>
                                )}
                              </div>
                              <div className="text-[11px] text-navy-400 font-mono">{user.email}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                            user.role === "PRODUCER" ? "bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-400" :
                            user.role === "ADMIN" ? "bg-purple-100 text-purple-800 dark:bg-purple-950/60 dark:text-purple-400" :
                            "bg-sky-100 text-sky-800 dark:bg-sky-950/60 dark:text-sky-400"
                          }`}>
                            {user.role}
                          </span>
                        </td>
                        <td className="px-6 py-4 font-mono text-navy-700 dark:text-navy-300">
                          {user.meter_id || "METER-UNASSIGNED"}
                        </td>
                        <td className="px-6 py-4">
                          {user.wallet_address && user.wallet_address.startsWith("0x") ? (
                            <span className="inline-flex items-center text-[11px] text-emerald-600 dark:text-emerald-400 font-mono">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1.5" />
                              {user.wallet_address.substring(0, 6)}...{user.wallet_address.substring(38)}
                            </span>
                          ) : (
                            <span className="text-[11px] text-navy-400">Not Connected</span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-navy-400">
                          {new Date(user.created_at || Date.now()).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4">
                          <StatusBadge
                            status={user.account_status === "ACTIVE" ? "ACTIVE" : "FAILED"}
                            label={user.account_status || "ACTIVE"}
                            size="sm"
                          />
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end space-x-2">
                            <button
                              onClick={() => handleInspectUser(user.id)}
                              className="p-1.5 rounded-lg bg-slate-100 dark:bg-navy-800 text-navy-600 dark:text-navy-300 hover:text-brand-600 transition cursor-pointer"
                              title="View Profile Details"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>

                            {/* Status Toggle Button (with Self-Deactivation Guard) */}
                            {user.account_status === "ACTIVE" ? (
                              <button
                                onClick={() =>
                                  setStatusChangeDialog({
                                    open: true,
                                    user,
                                    targetStatus: "SUSPENDED",
                                  })
                                }
                                disabled={isSelf}
                                className={`p-1.5 rounded-lg transition ${
                                  isSelf
                                    ? "opacity-30 cursor-not-allowed bg-slate-100 text-navy-400"
                                    : "bg-rose-50 text-rose-600 hover:bg-rose-100 dark:bg-rose-950/40 dark:text-rose-400 cursor-pointer"
                                }`}
                                title={isSelf ? "You cannot deactivate your own account" : "Suspend Account"}
                              >
                                <XCircle className="w-3.5 h-3.5" />
                              </button>
                            ) : (
                              <button
                                onClick={() =>
                                  setStatusChangeDialog({
                                    open: true,
                                    user,
                                    targetStatus: "ACTIVE",
                                  })
                                }
                                className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:text-emerald-400 cursor-pointer"
                                title="Reactivate Account"
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
              Showing {users.length} of {pagination.total} registered users
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

        {/* Modal 1: User Profile Deep Dive */}
        {inspectModalOpen && (
          <div className="fixed inset-0 z-50 bg-navy-950/70 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white dark:bg-navy-900 border border-navy-200 dark:border-navy-800 rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-5 animate-in fade-in duration-150">
              <div className="flex justify-between items-center pb-4 border-b border-navy-100 dark:border-navy-800">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-2xl bg-brand-50 dark:bg-brand-950/60 flex items-center justify-center text-brand-600 font-bold">
                    {selectedUser?.user?.full_name?.charAt(0) || "U"}
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-navy-900 dark:text-white">
                      {selectedUser?.user?.full_name || selectedUser?.user?.name}
                    </h3>
                    <p className="text-xs text-navy-400 font-mono">{selectedUser?.user?.email}</p>
                  </div>
                </div>
                <button
                  onClick={() => setInspectModalOpen(false)}
                  className="text-navy-400 hover:text-navy-600 text-lg cursor-pointer"
                >
                  ✕
                </button>
              </div>

              {inspectLoading ? (
                <div className="py-12 text-center text-xs text-navy-400">Loading user profile...</div>
              ) : selectedUser ? (
                <div className="space-y-4 text-xs">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 bg-slate-50 dark:bg-navy-800/50 rounded-xl">
                      <div className="text-navy-400">Role Designation</div>
                      <div className="font-bold text-navy-900 dark:text-white mt-0.5">{selectedUser.user.role}</div>
                    </div>
                    <div className="p-3 bg-slate-50 dark:bg-navy-800/50 rounded-xl">
                      <div className="text-navy-400">Smart Meter ID</div>
                      <div className="font-mono font-bold text-navy-900 dark:text-white mt-0.5">
                        {selectedUser.user.meter_id || "N/A"}
                      </div>
                    </div>
                    <div className="p-3 bg-slate-50 dark:bg-navy-800/50 rounded-xl col-span-2">
                      <div className="text-navy-400">Ethereum Wallet Address</div>
                      <div className="font-mono text-xs text-navy-900 dark:text-white mt-0.5 break-all">
                        {selectedUser.user.wallet_address || "Not connected"}
                      </div>
                    </div>
                  </div>

                  {/* Activity Stats Breakdown */}
                  <div>
                    <h4 className="font-bold text-navy-900 dark:text-white mb-2">Microgrid Activity Summary</h4>
                    <div className="grid grid-cols-2 gap-2 text-navy-600 dark:text-navy-300 bg-slate-50 dark:bg-navy-800/40 p-3 rounded-xl">
                      {selectedUser.user.role === "PRODUCER" && (
                        <>
                          <div>Total Energy Listed:</div>
                          <div className="font-bold text-right">{selectedUser.activityStats?.totalEnergyListedKwh ?? 0} kWh</div>
                          <div>Total Listings Created:</div>
                          <div className="font-bold text-right">{selectedUser.activityStats?.totalListings ?? 0}</div>
                        </>
                      )}
                      {selectedUser.user.role === "CONSUMER" && (
                        <>
                          <div>Total Energy Demands:</div>
                          <div className="font-bold text-right">{selectedUser.activityStats?.totalEnergyRequestedKwh ?? 0} kWh</div>
                          <div>Total Requests Placed:</div>
                          <div className="font-bold text-right">{selectedUser.activityStats?.totalRequests ?? 0}</div>
                        </>
                      )}
                      <div>Total Settled Trades:</div>
                      <div className="font-bold text-right">{selectedUser.activityStats?.totalTransactions ?? 0}</div>
                      <div>Total Traded Value:</div>
                      <div className="font-bold text-right text-brand-600">{selectedUser.activityStats?.totalVolumeEth ?? 0} ETH</div>
                    </div>
                  </div>
                </div>
              ) : null}

              <div className="pt-2">
                <button
                  onClick={() => setInspectModalOpen(false)}
                  className="w-full py-2 bg-slate-100 dark:bg-navy-800 hover:bg-slate-200 text-navy-700 dark:text-navy-200 font-bold rounded-xl text-xs transition cursor-pointer"
                >
                  Close Profile
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal 2: Status Change Confirmation Dialog */}
        <ConfirmationDialog
          isOpen={statusChangeDialog.open}
          onClose={() => setStatusChangeDialog({ open: false, user: null, targetStatus: "SUSPENDED" })}
          onConfirm={confirmStatusChange}
          isLoading={actionLoading}
          title={statusChangeDialog.targetStatus === "SUSPENDED" ? "Suspend User Account" : "Reactivate User Account"}
          description={`Are you sure you want to change the status of ${
            statusChangeDialog.user?.full_name || statusChangeDialog.user?.name
          } to ${statusChangeDialog.targetStatus}? ${
            statusChangeDialog.targetStatus === "SUSPENDED"
              ? "Suspended users cannot place energy requests, create listings, or execute trades."
              : "Reactivated users regain complete platform privileges."
          }`}
          confirmLabel={statusChangeDialog.targetStatus === "SUSPENDED" ? "Confirm Suspension" : "Confirm Reactivation"}
          variant={statusChangeDialog.targetStatus === "SUSPENDED" ? "danger" : "primary"}
        />
      </div>
    </DashboardLayout>
  );
}
