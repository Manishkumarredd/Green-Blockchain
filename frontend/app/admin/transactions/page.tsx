"use client";

import React, { useEffect, useState } from "react";
import {
  Coins,
  Search,
  Filter,
  Eye,
  RefreshCw,
  ExternalLink,
  ShieldCheck,
  CheckCircle,
  Clock,
  Zap,
} from "lucide-react";
import { useApp } from "../../../components/common/AppContext";
import { DashboardLayout } from "../../../components/layout/DashboardLayout";
import { PageHeader } from "../../../components/ui/PageHeader";
import { StatusBadge } from "../../../components/ui/StatusBadge";
import { adminApi } from "../../../services/api";

export default function AdminTransactionsPage() {
  const { setRole } = useApp();
  const [loading, setLoading] = useState(true);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [pagination, setPagination] = useState({ total: 0, page: 1, limit: 10, totalPages: 1 });
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [selectedTx, setSelectedTx] = useState<any | null>(null);
  const [inspectModalOpen, setInspectModalOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    setRole("ADMIN");
  }, [setRole]);

  useEffect(() => {
    loadTransactions();
  }, [pagination.page, statusFilter]);

  const loadTransactions = async () => {
    try {
      setLoading(true);
      setErrorMessage(null);
      const res = await adminApi.getTransactions({
        search,
        status: statusFilter,
        page: pagination.page,
        limit: pagination.limit,
      });
      setTransactions(res.data?.transactions || []);
      if (res.data?.pagination) {
        setPagination((prev) => ({ ...prev, ...res.data.pagination }));
      }
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to load platform transactions");
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPagination((prev) => ({ ...prev, page: 1 }));
    loadTransactions();
  };

  return (
    <DashboardLayout activeNavId="transactions">
      <div className="space-y-6">
        <PageHeader
          title="Peer-to-Peer Energy Settlements Ledger"
          description="Surveil all settled green electricity orders, on-chain cryptographic transaction proofs, and escrow releases."
          action={
            <button
              onClick={() => {
                setPagination((prev) => ({ ...prev, page: 1 }));
                loadTransactions();
              }}
              disabled={loading}
              className="flex items-center px-3.5 py-2 bg-white dark:bg-navy-800 text-navy-700 dark:text-navy-200 border border-navy-200 dark:border-navy-700 rounded-xl hover:bg-slate-50 dark:hover:bg-navy-700 text-xs font-medium transition cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${loading ? "animate-spin" : ""}`} />
              Refresh Ledger
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
              placeholder="Search tx ID, producer, consumer, hash..."
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
                <option value="SETTLED">Settled</option>
                <option value="PENDING">Pending Escrow</option>
                <option value="FAILED">Failed</option>
              </select>
            </div>
          </div>
        </div>

        {/* Transactions Table */}
        <div className="bg-white dark:bg-navy-900 rounded-2xl border border-navy-200 dark:border-navy-800 overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-navy-950/50 text-navy-500 uppercase tracking-wider font-semibold border-b border-navy-100 dark:border-navy-800">
                <tr>
                  <th className="px-6 py-3.5">Tx ID</th>
                  <th className="px-6 py-3.5">Producer</th>
                  <th className="px-6 py-3.5">Consumer</th>
                  <th className="px-6 py-3.5">Traded Energy</th>
                  <th className="px-6 py-3.5">Price / kWh</th>
                  <th className="px-6 py-3.5">Total Settlement</th>
                  <th className="px-6 py-3.5">Blockchain Status</th>
                  <th className="px-6 py-3.5">Settlement Status</th>
                  <th className="px-6 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-navy-100 dark:divide-navy-800 font-medium">
                {loading ? (
                  <tr>
                    <td colSpan={9} className="px-6 py-10 text-center text-navy-400">
                      <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-brand-600" />
                      Loading settlement ledger...
                    </td>
                  </tr>
                ) : transactions.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="px-6 py-12 text-center text-navy-400">
                      No matching transaction records found.
                    </td>
                  </tr>
                ) : (
                  transactions.map((tx) => (
                    <tr key={tx.id} className="hover:bg-slate-50/50 dark:hover:bg-navy-800/40">
                      <td className="px-6 py-4 font-mono font-bold text-brand-600">
                        #{tx.id}
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-bold text-navy-900 dark:text-white">
                          {tx.producer_name || `Producer #${tx.producer_id}`}
                        </div>
                        <div className="text-[11px] text-navy-400 font-mono">
                          {tx.producer_meter || "Meter: N/A"}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-bold text-navy-900 dark:text-white">
                          {tx.consumer_name || `Consumer #${tx.consumer_id}`}
                        </div>
                        <div className="text-[11px] text-navy-400 font-mono">
                          {tx.consumer_meter || "Meter: N/A"}
                        </div>
                      </td>
                      <td className="px-6 py-4 font-bold text-navy-900 dark:text-white">
                        {tx.energy_quantity_kwh} kWh
                      </td>
                      <td className="px-6 py-4 font-mono">
                        {tx.price_per_kwh} ETH
                      </td>
                      <td className="px-6 py-4 font-mono font-bold text-emerald-600 dark:text-emerald-400">
                        {tx.total_amount} ETH
                      </td>
                      <td className="px-6 py-4">
                        {tx.blockchain_transaction_hash ? (
                          <a
                            href={`https://sepolia.etherscan.io/tx/${tx.blockchain_transaction_hash}`}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center text-[11px] text-brand-600 hover:text-brand-700 font-mono"
                          >
                            <ShieldCheck className="w-3.5 h-3.5 mr-1" />
                            {tx.blockchain_transaction_hash.substring(0, 6)}...{tx.blockchain_transaction_hash.substring(60)}
                            <ExternalLink className="w-2.5 h-2.5 ml-1" />
                          </a>
                        ) : (
                          <span className="text-[11px] text-navy-400 font-mono">Off-Chain Microgrid</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <StatusBadge
                          status={tx.transaction_status === "SETTLED" ? "ACTIVE" : "PENDING"}
                          label={tx.transaction_status || "SETTLED"}
                          size="sm"
                        />
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => {
                            setSelectedTx(tx);
                            setInspectModalOpen(true);
                          }}
                          className="p-1.5 rounded-lg bg-slate-100 dark:bg-navy-800 text-navy-600 dark:text-navy-300 hover:text-brand-600 transition cursor-pointer"
                          title="View Transaction Receipt"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls */}
          <div className="p-4 border-t border-navy-100 dark:border-navy-800 flex items-center justify-between text-xs text-navy-500">
            <div>
              Showing {transactions.length} of {pagination.total} transactions
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

        {/* Modal: Transaction Receipt Deep Dive */}
        {inspectModalOpen && selectedTx && (
          <div className="fixed inset-0 z-50 bg-navy-950/70 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white dark:bg-navy-900 border border-navy-200 dark:border-navy-800 rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-5 animate-in fade-in duration-150">
              <div className="flex justify-between items-center pb-4 border-b border-navy-100 dark:border-navy-800">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 flex items-center justify-center text-emerald-600 font-bold">
                    <Coins className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-navy-900 dark:text-white">
                      Settlement Receipt #{selectedTx.id}
                    </h3>
                    <p className="text-xs text-navy-400">
                      Settled on {new Date(selectedTx.created_at || Date.now()).toLocaleString()}
                    </p>
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
                    <div className="text-navy-400">Producer Prosumer</div>
                    <div className="font-bold text-navy-900 dark:text-white mt-0.5">{selectedTx.producer_name}</div>
                  </div>
                  <div className="p-3 bg-slate-50 dark:bg-navy-800/50 rounded-xl">
                    <div className="text-navy-400">Consumer Node</div>
                    <div className="font-bold text-navy-900 dark:text-white mt-0.5">{selectedTx.consumer_name}</div>
                  </div>
                  <div className="p-3 bg-slate-50 dark:bg-navy-800/50 rounded-xl">
                    <div className="text-navy-400">Energy Quantity</div>
                    <div className="font-bold text-navy-900 dark:text-white mt-0.5">{selectedTx.energy_quantity_kwh} kWh</div>
                  </div>
                  <div className="p-3 bg-slate-50 dark:bg-navy-800/50 rounded-xl">
                    <div className="text-navy-400">Clearing Price</div>
                    <div className="font-mono font-bold text-navy-900 dark:text-white mt-0.5">{selectedTx.price_per_kwh} ETH</div>
                  </div>
                  <div className="p-3 bg-slate-50 dark:bg-navy-800/50 rounded-xl col-span-2">
                    <div className="text-navy-400">Total Settlement Amount</div>
                    <div className="font-mono text-base font-extrabold text-emerald-600 dark:text-emerald-400 mt-0.5">
                      {selectedTx.total_amount} ETH
                    </div>
                  </div>
                  {selectedTx.blockchain_transaction_hash && (
                    <div className="p-3 bg-slate-50 dark:bg-navy-800/50 rounded-xl col-span-2">
                      <div className="text-navy-400 flex items-center justify-between">
                        <span>Ethereum Sepolia Transaction Hash</span>
                        <span className="text-[10px] bg-brand-100 dark:bg-brand-950/60 text-brand-700 dark:text-brand-300 px-1.5 py-0.2 rounded font-bold">
                          Block #{selectedTx.block_number || "5839210"}
                        </span>
                      </div>
                      <div className="font-mono text-xs text-navy-900 dark:text-white mt-1 break-all flex items-center justify-between">
                        <span>{selectedTx.blockchain_transaction_hash}</span>
                        <a
                          href={`https://sepolia.etherscan.io/tx/${selectedTx.blockchain_transaction_hash}`}
                          target="_blank"
                          rel="noreferrer"
                          className="ml-2 text-brand-600 hover:text-brand-700"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="pt-2">
                <button
                  onClick={() => setInspectModalOpen(false)}
                  className="w-full py-2 bg-slate-100 dark:bg-navy-800 hover:bg-slate-200 text-navy-700 dark:text-navy-200 font-bold rounded-xl text-xs transition cursor-pointer"
                >
                  Close Receipt
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
