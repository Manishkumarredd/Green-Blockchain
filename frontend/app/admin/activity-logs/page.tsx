"use client";

import React, { useEffect, useState } from "react";
import {
  FileText,
  Search,
  Filter,
  Clock,
  Shield,
  RefreshCw,
  AlertCircle,
  User,
  Settings,
  ShoppingBag,
  Scale,
} from "lucide-react";
import { useApp } from "../../../components/common/AppContext";
import { DashboardLayout } from "../../../components/layout/DashboardLayout";
import { PageHeader } from "../../../components/ui/PageHeader";
import { adminApi } from "../../../services/api";

const ACTION_ICONS: Record<string, React.ElementType> = {
  USER_STATUS_CHANGE: User,
  LISTING_MODERATION: ShoppingBag,
  PLATFORM_SETTINGS_UPDATE: Settings,
  ALGORITHM_EXECUTION: Scale,
  SYSTEM_STARTUP: Shield,
};

const ACTION_COLORS: Record<string, string> = {
  USER_STATUS_CHANGE: "bg-purple-100 text-purple-800 dark:bg-purple-950/60 dark:text-purple-400",
  LISTING_MODERATION: "bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-400",
  PLATFORM_SETTINGS_UPDATE: "bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-400",
  ALGORITHM_EXECUTION: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-400",
  SYSTEM_STARTUP: "bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300",
};

export default function AdminActivityLogsPage() {
  const { setRole } = useApp();
  const [loading, setLoading] = useState(true);
  const [logs, setLogs] = useState<any[]>([]);
  const [pagination, setPagination] = useState({ total: 0, page: 1, limit: 15, totalPages: 1 });
  const [actionFilter, setActionFilter] = useState("ALL");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    setRole("ADMIN");
  }, [setRole]);

  useEffect(() => {
    loadLogs();
  }, [pagination.page, actionFilter]);

  const loadLogs = async () => {
    try {
      setLoading(true);
      setErrorMessage(null);
      const res = await adminApi.getActivityLogs({
        action: actionFilter,
        page: pagination.page,
        limit: pagination.limit,
      });
      setLogs(res.data?.logs || []);
      if (res.data?.pagination) {
        setPagination((prev) => ({ ...prev, ...res.data.pagination }));
      }
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to load audit logs");
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout activeNavId="audit">
      <div className="space-y-6">
        <PageHeader
          title="System Audit Trail & Governance Logs"
          description="Tamper-evident chronological compliance log recording administrative actions, parameter alterations, and market-clearing executions."
          action={
            <button
              onClick={() => {
                setPagination((prev) => ({ ...prev, page: 1 }));
                loadLogs();
              }}
              disabled={loading}
              className="flex items-center px-3.5 py-2 bg-white dark:bg-navy-800 text-navy-700 dark:text-navy-200 border border-navy-200 dark:border-navy-700 rounded-xl hover:bg-slate-50 dark:hover:bg-navy-700 text-xs font-medium transition cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${loading ? "animate-spin" : ""}`} />
              Refresh Journal
            </button>
          }
        />

        {errorMessage && (
          <div className="p-4 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 rounded-2xl flex items-center justify-between text-rose-700 dark:text-rose-300 text-xs">
            <span>{errorMessage}</span>
            <button onClick={() => setErrorMessage(null)} className="font-bold underline ml-2">Dismiss</button>
          </div>
        )}

        {/* Action Type Filter Bar */}
        <div className="bg-white dark:bg-navy-900 p-4 rounded-2xl border border-navy-200 dark:border-navy-800 shadow-xs flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="text-xs text-navy-400 font-bold uppercase tracking-wider">Action Filter:</span>
            <select
              value={actionFilter}
              onChange={(e) => {
                setActionFilter(e.target.value);
                setPagination((prev) => ({ ...prev, page: 1 }));
              }}
              className="text-xs bg-slate-50 dark:bg-navy-800 border border-navy-200 dark:border-navy-700 rounded-xl px-3 py-2 text-navy-900 dark:text-white"
            >
              <option value="ALL">All Administrative Actions</option>
              <option value="USER_STATUS_CHANGE">User Status Changes</option>
              <option value="LISTING_MODERATION">Listing Moderation</option>
              <option value="PLATFORM_SETTINGS_UPDATE">Platform Settings Changes</option>
              <option value="ALGORITHM_EXECUTION">Algorithm Executions</option>
              <option value="SYSTEM_STARTUP">System Startup</option>
            </select>
          </div>

          <div className="text-xs text-navy-400 font-mono">
            Immutable Audit Trail • PostgreSQL
          </div>
        </div>

        {/* Logs Timeline Table */}
        <div className="bg-white dark:bg-navy-900 rounded-2xl border border-navy-200 dark:border-navy-800 overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-navy-950/50 text-navy-500 uppercase tracking-wider font-semibold border-b border-navy-100 dark:border-navy-800">
                <tr>
                  <th className="px-6 py-3.5">Log ID</th>
                  <th className="px-6 py-3.5">Action Category</th>
                  <th className="px-6 py-3.5">Audit Description</th>
                  <th className="px-6 py-3.5">Operator</th>
                  <th className="px-6 py-3.5 text-right">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-navy-100 dark:divide-navy-800 font-medium">
                {loading ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-10 text-center text-navy-400">
                      <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-brand-600" />
                      Loading audit journal...
                    </td>
                  </tr>
                ) : logs.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-navy-400">
                      No audit logs recorded for this filter.
                    </td>
                  </tr>
                ) : (
                  logs.map((log) => {
                    const IconComponent = ACTION_ICONS[log.action] || Shield;
                    const colorClass = ACTION_COLORS[log.action] || "bg-slate-100 text-slate-800";
                    return (
                      <tr key={log.id} className="hover:bg-slate-50/50 dark:hover:bg-navy-800/40">
                        <td className="px-6 py-4 font-mono font-bold text-navy-400">
                          #{log.id}
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center text-[10px] font-bold px-2 py-0.5 rounded-md ${colorClass}`}>
                            <IconComponent className="w-3 h-3 mr-1" />
                            {log.action}
                          </span>
                        </td>
                        <td className="px-6 py-4 font-normal text-navy-900 dark:text-white max-w-md">
                          {log.description}
                        </td>
                        <td className="px-6 py-4">
                          <div className="font-bold text-navy-900 dark:text-white">
                            {log.user_name || "Administrator"}
                          </div>
                          <div className="text-[10px] text-navy-400 font-mono">
                            ID: {log.user_id || 1} • {log.user_role || "ADMIN"}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-right font-mono text-navy-400 whitespace-nowrap">
                          {new Date(log.created_at || Date.now()).toLocaleString()}
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
              Showing {logs.length} of {pagination.total} audit entries
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
      </div>
    </DashboardLayout>
  );
}
