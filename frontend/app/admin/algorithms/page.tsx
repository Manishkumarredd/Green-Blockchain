"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Sliders,
  Scale,
  TrendingUp,
  Play,
  RotateCcw,
  Zap,
  Clock,
  Layers,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Activity,
  FileText,
  BarChart2,
  Cpu,
  Sparkles,
  ArrowRight,
  RefreshCw,
  Eye,
  Info,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  Cell,
} from "recharts";
import { DashboardLayout } from "../../../components/layout/DashboardLayout";
import { PageHeader } from "../../../components/ui/PageHeader";
import { Card } from "../../../components/ui/Card";
import { Button } from "../../../components/ui/Button";
import { StatusBadge } from "../../../components/ui/StatusBadge";
import { ChartContainer } from "../../../components/ui/ChartContainer";
import { DataTable, Column } from "../../../components/ui/DataTable";
import { Modal } from "../../../components/ui/Modal";
import { Skeleton, SkeletonCard, SkeletonTable } from "../../../components/ui/LoadingSkeleton";
import { EmptyState } from "../../../components/ui/EmptyState";
import { ErrorState } from "../../../components/ui/ErrorState";
import { useApp } from "../../../components/common/AppContext";
import { algorithmsApi, allocationApi, authApi } from "../../../services/api";

const ALGO_COLORS = {
  fcfs: "#94A3B8",
  basicProportional: "#3B82F6",
  proposed: "#16A34A",
};

export default function AdminAlgorithmsPage() {
  const { setRole, addToast } = useApp();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Active Tab
  const [activeTab, setActiveTab] = useState<"benchmarks" | "allocation" | "matching" | "pricing" | "history">("benchmarks");

  // Benchmark / Experiment State
  const [scenarios, setScenarios] = useState<any[]>([]);
  const [selectedScenario, setSelectedScenario] = useState("LOW_SUPPLY_HIGH_DEMAND");
  const [experimentResult, setExperimentResult] = useState<any>(null);
  const [runningExperiment, setRunningExperiment] = useState(false);

  // Dynamic Pricing State
  const [pricingData, setPricingData] = useState<any>(null);
  const [pricingSource, setPricingSource] = useState("SOLAR");

  // Allocation Execution State
  const [executionHistory, setExecutionHistory] = useState<any[]>([]);
  const [isAllocating, setIsAllocating] = useState(false);
  const [allocAlgorithm, setAllocAlgorithm] = useState<"WEIGHTED_PROPORTIONAL" | "PROPORTIONAL" | "FCFS">("WEIGHTED_PROPORTIONAL");
  const [isSimulation, setIsSimulation] = useState(true);

  // Matching Execution State
  const [isMatching, setIsMatching] = useState(false);
  const [pricingRule, setPricingRule] = useState<"MIDPOINT" | "PRODUCER_ASK" | "CONSUMER_BID">("MIDPOINT");
  const [matchingResult, setMatchingResult] = useState<any>(null);

  // Selected Result Modal
  const [selectedResult, setSelectedResult] = useState<any>(null);
  const [resultModalOpen, setResultModalOpen] = useState(false);

  useEffect(() => {
    setRole("ADMIN");
  }, [setRole]);

  // Load Initial Data
  const loadInitialData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Ensure admin authentication if current local user is not ADMIN
      if (typeof window !== "undefined") {
        try {
          const stored = localStorage.getItem("greenledger_user") || localStorage.getItem("user");
          const u = stored ? JSON.parse(stored) : null;
          if (!u || u.role !== "ADMIN") {
            await authApi.switchDemoRole("ADMIN");
          }
        } catch (_) {}
      }

      // 1. Fetch scenarios
      const scenRes = await algorithmsApi.getExperiments();
      if (scenRes && scenRes.success) {
        setScenarios(scenRes.data || []);
      }

      // 2. Fetch baseline experiment
      const expRes = await algorithmsApi.runExperiment({ scenarioId: "LOW_SUPPLY_HIGH_DEMAND" });
      if (expRes && expRes.success) {
        setExperimentResult(expRes.data);
      }

      // 3. Fetch pricing
      const priceRes = await algorithmsApi.getPricing({ energySource: "SOLAR" });
      if (priceRes && priceRes.success) {
        setPricingData(priceRes.data);
      }

      // 4. Fetch allocation history
      const histRes = await allocationApi.getResults();
      if (histRes && histRes.success) {
        setExecutionHistory(histRes.data || []);
      }
    } catch (err: any) {
      console.error("Failed to load algorithms data:", err);
      setError(err?.message || "Failed to initialize research algorithms dashboard.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadInitialData();
  }, [loadInitialData]);

  // Run Selected Research Experiment Scenario
  const handleRunExperiment = async (scenarioId: string) => {
    try {
      setRunningExperiment(true);
      setSelectedScenario(scenarioId);
      const res = await algorithmsApi.runExperiment({ scenarioId });
      if (res && res.success) {
        setExperimentResult(res.data);
        addToast({
          type: "success",
          title: "Experiment Scenario Executed",
          message: `Benchmark completed for ${res.data.scenario.name} using fixed seed ${res.data.scenario.seed}.`,
        });
      } else {
        addToast({
          type: "error",
          title: "Experiment Failed",
          message: res?.error || "Could not execute research experiment.",
        });
      }
    } catch (err: any) {
      addToast({
        type: "error",
        title: "Execution Error",
        message: err?.message || "An error occurred during experiment execution.",
      });
    } finally {
      setRunningExperiment(false);
    }
  };

  // Run Allocation Cycle
  const handleExecuteAllocation = async () => {
    try {
      setIsAllocating(true);
      const res = await algorithmsApi.allocate({
        algorithm: allocAlgorithm,
        isSimulation,
      });

      if (res && res.success) {
        addToast({
          type: "success",
          title: isSimulation ? "Simulation Completed" : "Live Allocation Executed",
          message: `${res.data.algorithmName} completed with Jain's Index ${res.data.metrics.jainsFulfillmentIndex}.`,
        });
        if (!isSimulation) {
          const histRes = await allocationApi.getResults();
          if (histRes && histRes.success) setExecutionHistory(histRes.data || []);
        }
      } else {
        addToast({
          type: "error",
          title: "Allocation Failed",
          message: res?.error || "Could not execute allocation cycle.",
        });
      }
    } catch (err: any) {
      addToast({
        type: "error",
        title: "Allocation Error",
        message: err?.message || "Failed to process allocation algorithm.",
      });
    } finally {
      setIsAllocating(false);
    }
  };

  // Run Greedy Double-Auction Matching
  const handleExecuteMatching = async () => {
    try {
      setIsMatching(true);
      const res = await algorithmsApi.match({ pricingRule });
      if (res && res.success) {
        setMatchingResult(res.data);
        addToast({
          type: "success",
          title: "Greedy Matching Completed",
          message: `Formed ${res.data.matches.length} proposed trade pairs (${res.data.totalMatchedKwh} kWh total).`,
        });
      } else {
        addToast({
          type: "error",
          title: "Matching Failed",
          message: res?.error || "Could not execute greedy matching.",
        });
      }
    } catch (err: any) {
      addToast({
        type: "error",
        title: "Matching Error",
        message: err?.message || "Failed to process double-auction matching.",
      });
    } finally {
      setIsMatching(false);
    }
  };

  // Update Dynamic Pricing for source
  const handleUpdatePricingSource = async (source: string) => {
    setPricingSource(source);
    try {
      const res = await algorithmsApi.getPricing({ energySource: source });
      if (res && res.success) setPricingData(res.data);
    } catch (err) {
      console.warn("Failed to update pricing source:", err);
    }
  };

  // View Execution Details Modal
  const handleViewExecutionDetails = async (id: number) => {
    try {
      const res = await algorithmsApi.getResultById(id);
      if (res && res.success) {
        setSelectedResult(res.data);
        setResultModalOpen(true);
      }
    } catch (err: any) {
      addToast({
        type: "error",
        title: "Details Error",
        message: err?.message || "Could not fetch execution details.",
      });
    }
  };

  if (loading) {
    return (
      <DashboardLayout activeNavId="algorithms">
        <div className="space-y-6 max-w-7xl mx-auto">
          <Skeleton className="h-10 w-72 rounded-xl" />
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </div>
          <Skeleton className="h-80 rounded-2xl" />
        </div>
      </DashboardLayout>
    );
  }

  if (error) {
    const isRoleMismatch = typeof error === "string" && error.includes("Requires one of [ADMIN]");
    return (
      <DashboardLayout activeNavId="algorithms">
        <div className="max-w-xl mx-auto my-12 p-8 rounded-3xl bg-white dark:bg-navy-900 border border-navy-200 dark:border-navy-800 shadow-xl text-center">
          <div className="w-14 h-14 rounded-2xl bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800 flex items-center justify-center mx-auto mb-4 text-amber-600 dark:text-amber-400">
            <AlertCircle className="w-7 h-7" />
          </div>
          <h3 className="text-lg font-bold text-navy-900 dark:text-white">
            {isRoleMismatch ? "Admin Authentication Required" : "Algorithms Dashboard Unavailable"}
          </h3>
          <p className="mt-2 text-xs sm:text-sm text-navy-500 dark:text-navy-400 leading-relaxed">
            {isRoleMismatch
              ? "Your current session is authenticated as a Producer. Switch to the Administrator demo session to access and run platform research algorithms."
              : error}
          </p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            {isRoleMismatch && (
              <Button
                variant="primary"
                onClick={async () => {
                  setLoading(true);
                  await authApi.switchDemoRole("ADMIN");
                  setRole("ADMIN");
                  await loadInitialData();
                }}
              >
                Switch to Admin & Load Dashboard
              </Button>
            )}
            <Button
              variant="secondary"
              onClick={loadInitialData}
            >
              Try Again
            </Button>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  // Comparison Metrics Prepared for Recharts
  const comparisonData = [
    {
      metric: "Jain's Fairness",
      FCFS: experimentResult?.algorithms?.fcfs?.metrics?.jainsFulfillmentIndex || 0,
      BasicProportional: experimentResult?.algorithms?.basicProportional?.metrics?.jainsFulfillmentIndex || 0,
      ProposedDAWPA: experimentResult?.algorithms?.proposedAlgorithm?.metrics?.jainsFulfillmentIndex || 0,
    },
    {
      metric: "Overall Fulfillment",
      FCFS: experimentResult?.algorithms?.fcfs?.metrics?.overallFulfillmentRatio || 0,
      BasicProportional: experimentResult?.algorithms?.basicProportional?.metrics?.overallFulfillmentRatio || 0,
      ProposedDAWPA: experimentResult?.algorithms?.proposedAlgorithm?.metrics?.overallFulfillmentRatio || 0,
    },
    {
      metric: "Min Fulfillment",
      FCFS: experimentResult?.algorithms?.fcfs?.metrics?.minFulfillmentRatio || 0,
      BasicProportional: experimentResult?.algorithms?.basicProportional?.metrics?.minFulfillmentRatio || 0,
      ProposedDAWPA: experimentResult?.algorithms?.proposedAlgorithm?.metrics?.minFulfillmentRatio || 0,
    },
  ];

  const efficiencyData = [
    {
      algorithm: "FCFS",
      efficiency: experimentResult?.algorithms?.fcfs?.metrics?.allocationEfficiencyPct || 0,
      unmetDemand: experimentResult?.algorithms?.fcfs?.metrics?.unmetDemandKwh || 0,
      runtimeMs: experimentResult?.algorithms?.fcfs?.metrics?.executionTimeMs || 0,
    },
    {
      algorithm: "Basic Proportional",
      efficiency: experimentResult?.algorithms?.basicProportional?.metrics?.allocationEfficiencyPct || 0,
      unmetDemand: experimentResult?.algorithms?.basicProportional?.metrics?.unmetDemandKwh || 0,
      runtimeMs: experimentResult?.algorithms?.basicProportional?.metrics?.executionTimeMs || 0,
    },
    {
      algorithm: "Proposed DA-WPA",
      efficiency: experimentResult?.algorithms?.proposedAlgorithm?.metrics?.allocationEfficiencyPct || 0,
      unmetDemand: experimentResult?.algorithms?.proposedAlgorithm?.metrics?.unmetDemandKwh || 0,
      runtimeMs: experimentResult?.algorithms?.proposedAlgorithm?.metrics?.executionTimeMs || 0,
    },
  ];

  // Execution History Columns
  const historyColumns: Column<any>[] = [
    {
      header: "Cycle ID",
      accessor: "id",
      cell: (row) => (
        <span className="font-mono text-xs font-bold text-navy-900 dark:text-white">
          #CYCLE-{row.id.toString().padStart(4, "0")}
        </span>
      ),
    },
    {
      header: "Algorithm",
      accessor: "algorithm_name",
      cell: (row) => (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-brand-50 text-brand-700 dark:bg-brand-950/60 dark:text-brand-300 border border-brand-200/60">
          <Cpu className="w-3.5 h-3.5" />
          {row.algorithm_name}
        </span>
      ),
    },
    {
      header: "Available / Traded",
      accessor: "total_allocated_energy",
      cell: (row) => (
        <span className="text-xs font-bold text-navy-900 dark:text-white font-mono">
          {Number(row.total_allocated_energy).toLocaleString()} / {Number(row.total_available_energy).toLocaleString()} kWh
        </span>
      ),
    },
    {
      header: "Jain's Fairness",
      accessor: "jain_fairness_index",
      cell: (row) => (
        <span className="text-xs font-mono font-extrabold text-emerald-600 dark:text-emerald-400">
          {row.jain_fairness_index}
        </span>
      ),
    },
    {
      header: "Latency",
      accessor: "execution_time_ms",
      cell: (row) => <span className="text-xs font-mono text-navy-500">{row.execution_time_ms} ms</span>,
    },
    {
      header: "Timestamp",
      accessor: "created_at",
      cell: (row) => (
        <span className="text-xs text-navy-400">
          {new Date(row.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
        </span>
      ),
    },
    {
      header: "Actions",
      accessor: "actions",
      cell: (row) => (
        <Button
          variant="outline"
          size="sm"
          onClick={() => handleViewExecutionDetails(row.id)}
          leftIcon={<Eye className="w-3.5 h-3.5" />}
        >
          Details
        </Button>
      ),
    },
  ];

  return (
    <DashboardLayout activeNavId="algorithms">
      <div className="space-y-8 animate-fadeIn max-w-7xl mx-auto">
        {/* Page Header */}
        <PageHeader
          title="Core Research Algorithms Laboratory"
          description="Evaluate and benchmark Demand-Aware Weighted Proportional Allocation, Price-Aware Greedy Matching, and Rule-Based Dynamic Pricing."
          action={
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={loadInitialData}
                leftIcon={<RefreshCw className="w-4 h-4" />}
              >
                Reset Live State
              </Button>
              <Button
                size="sm"
                onClick={() => setActiveTab("benchmarks")}
                leftIcon={<Sparkles className="w-4 h-4" />}
              >
                Run Benchmark
              </Button>
            </div>
          }
        />

        {/* Navigation Tabs */}
        <div className="flex border-b border-navy-200 dark:border-navy-800 space-x-1 sm:space-x-4 overflow-x-auto pb-1">
          {[
            { id: "benchmarks", label: "Research Benchmarks", icon: BarChart2 },
            { id: "allocation", label: "Energy Allocation Engine", icon: Sliders },
            { id: "matching", label: "Greedy Matching Engine", icon: Scale },
            { id: "pricing", label: "Dynamic Pricing Rules", icon: TrendingUp },
            { id: "history", label: "Execution Audit History", icon: FileText },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-4 py-2.5 text-xs sm:text-sm font-bold border-b-2 transition whitespace-nowrap cursor-pointer ${
                  isActive
                    ? "border-brand-600 text-brand-600 dark:border-brand-400 dark:text-brand-400"
                    : "border-transparent text-navy-500 hover:text-navy-900 dark:hover:text-white"
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* ------------------------------------------------------------------ */}
        {/* TAB 1: RESEARCH BENCHMARKS & EXPERIMENTS                           */}
        {/* ------------------------------------------------------------------ */}
        {activeTab === "benchmarks" && (
          <div className="space-y-8 animate-fadeIn">
            {/* Scenario Selector Ribbon */}
            <Card className="p-6 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h3 className="text-base font-bold text-navy-900 dark:text-white flex items-center gap-2">
                    <Cpu className="w-5 h-5 text-brand-600" />
                    Reproducible Research Scenarios
                  </h3>
                  <p className="text-xs text-navy-500 mt-0.5">
                    Select a deterministic microgrid testbed to evaluate algorithms on identical inputs with fixed pseudo-random seeds.
                  </p>
                </div>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200/60 text-xs font-bold">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  Deterministic Mulberry32 Engine
                </div>
              </div>

              {/* Scenario Cards Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 pt-2">
                {scenarios.map((scen) => {
                  const isSelected = selectedScenario === scen.id;
                  return (
                    <button
                      key={scen.id}
                      onClick={() => handleRunExperiment(scen.id)}
                      disabled={runningExperiment}
                      className={`p-4 rounded-xl text-left border transition cursor-pointer flex flex-col justify-between ${
                        isSelected
                          ? "bg-brand-50/60 dark:bg-brand-950/60 border-brand-500 ring-2 ring-brand-500/20"
                          : "bg-white dark:bg-navy-900 border-navy-200 dark:border-navy-800 hover:border-navy-300"
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-mono font-bold text-navy-400">
                            Seed #{scen.seed}
                          </span>
                          {isSelected && (
                            <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-brand-600 text-white">
                              Active
                            </span>
                          )}
                        </div>
                        <h4 className="text-xs font-bold text-navy-900 dark:text-white mt-1">
                          {scen.name}
                        </h4>
                        <p className="text-[11px] text-navy-500 dark:text-navy-400 mt-1 line-clamp-2">
                          {scen.description}
                        </p>
                      </div>
                      <div className="mt-3 pt-2 border-t border-navy-100 dark:border-navy-800/80 flex items-center justify-between text-[10px] font-mono text-navy-500">
                        <span>Supply: {scen.totalSupplyKwh} kWh</span>
                        <span>Consumers: {scen.consumersCount}</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </Card>

            {/* Experiment Results Comparison Table */}
            {experimentResult && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-bold text-navy-900 dark:text-white flex items-center gap-2">
                      <Scale className="w-5 h-5 text-brand-600" />
                      Empirical Performance Comparison: {experimentResult.scenario.name}
                    </h3>
                    <p className="text-xs text-navy-500 mt-0.5">
                      Supply: {experimentResult.scenario.totalSupplyKwh} kWh | Demand: {experimentResult.scenario.totalRequestedKwh} kWh | Ratio: {(experimentResult.scenario.totalRequestedKwh / experimentResult.scenario.totalSupplyKwh).toFixed(2)}
                    </p>
                  </div>
                </div>

                {/* Structured Metrics Table */}
                <div className="overflow-x-auto rounded-2xl border border-navy-200 dark:border-navy-800 shadow-sm bg-white dark:bg-navy-900">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-navy-50 dark:bg-navy-800/80 uppercase font-bold text-[10px] text-navy-500">
                      <tr>
                        <th className="py-3 px-4">Evaluation Metric</th>
                        <th className="py-3 px-4 text-center text-slate-500">FCFS (Baseline 1)</th>
                        <th className="py-3 px-4 text-center text-sky-600">Basic Proportional (Baseline 2)</th>
                        <th className="py-3 px-4 text-center text-emerald-600 font-extrabold bg-emerald-50/50 dark:bg-emerald-950/30">
                          Proposed DA-WPA
                        </th>
                        <th className="py-3 px-4">Research Significance</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-navy-100 dark:divide-navy-800">
                      {experimentResult.comparisonTable.map((row: any, idx: number) => (
                        <tr key={idx} className="hover:bg-navy-50/50 dark:hover:bg-navy-800/40">
                          <td className="py-3.5 px-4 font-bold text-navy-900 dark:text-white">
                            {row.metric}
                          </td>
                          <td className="py-3.5 px-4 text-center font-mono text-slate-600 dark:text-slate-300">
                            {row.fcfs} {row.unit !== "Ratio (0-1)" && row.unit !== "Index (0-1)" ? row.unit : ""}
                          </td>
                          <td className="py-3.5 px-4 text-center font-mono text-sky-700 dark:text-sky-300 font-semibold">
                            {row.basicProportional} {row.unit !== "Ratio (0-1)" && row.unit !== "Index (0-1)" ? row.unit : ""}
                          </td>
                          <td className="py-3.5 px-4 text-center font-mono text-emerald-600 dark:text-emerald-400 font-black bg-emerald-50/30 dark:bg-emerald-950/20">
                            {row.proposedAlgorithm} {row.unit !== "Ratio (0-1)" && row.unit !== "Index (0-1)" ? row.unit : ""}
                          </td>
                          <td className="py-3.5 px-4 text-navy-500 dark:text-navy-400 text-[11px]">
                            {row.interpretation}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* 5 Recharts Comparison Visualizations */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Chart 1: Fairness & Fulfillment Comparison */}
                  <ChartContainer
                    title="Jain's Fairness & Fulfillment Ratios"
                    subtitle="Empirical comparison between FCFS, Basic Proportional, and Proposed DA-WPA"
                  >
                    <div className="h-72 w-full pt-4">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={comparisonData}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" opacity={0.6} />
                          <XAxis dataKey="metric" stroke="#64748B" fontSize={12} tickLine={false} />
                          <YAxis domain={[0, 1.0]} stroke="#64748B" fontSize={12} tickLine={false} />
                          <Tooltip
                            contentStyle={{
                              backgroundColor: "#0F172A",
                              border: "none",
                              borderRadius: "8px",
                              color: "#fff",
                              fontSize: "12px",
                            }}
                          />
                          <Legend verticalAlign="top" height={36} />
                          <Bar dataKey="FCFS" fill={ALGO_COLORS.fcfs} name="FCFS" radius={[4, 4, 0, 0]} />
                          <Bar dataKey="BasicProportional" fill={ALGO_COLORS.basicProportional} name="Basic Proportional" radius={[4, 4, 0, 0]} />
                          <Bar dataKey="ProposedDAWPA" fill={ALGO_COLORS.proposed} name="Proposed DA-WPA" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </ChartContainer>

                  {/* Chart 2: Allocation Efficiency (%) */}
                  <ChartContainer
                    title="Allocation Efficiency (%)"
                    subtitle="Percentage of available renewable generation utilized by the microgrid"
                  >
                    <div className="h-72 w-full pt-4">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={efficiencyData}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" opacity={0.6} />
                          <XAxis dataKey="algorithm" stroke="#64748B" fontSize={12} tickLine={false} />
                          <YAxis domain={[0, 100]} stroke="#64748B" fontSize={12} tickLine={false} unit="%" />
                          <Tooltip
                            contentStyle={{
                              backgroundColor: "#0F172A",
                              border: "none",
                              borderRadius: "8px",
                              color: "#fff",
                              fontSize: "12px",
                            }}
                          />
                          <Bar dataKey="efficiency" name="Efficiency (%)" fill="#10B981" radius={[6, 6, 0, 0]}>
                            {efficiencyData.map((entry, index) => (
                              <Cell
                                key={`cell-${index}`}
                                fill={index === 2 ? ALGO_COLORS.proposed : index === 1 ? ALGO_COLORS.basicProportional : ALGO_COLORS.fcfs}
                              />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </ChartContainer>

                  {/* Chart 3: Unmet Energy Demand (kWh) */}
                  <ChartContainer
                    title="Unmet Demand Deficit (kWh)"
                    subtitle="Remaining unfulfilled demand across consumer nodes"
                  >
                    <div className="h-72 w-full pt-4">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={efficiencyData}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" opacity={0.6} />
                          <XAxis dataKey="algorithm" stroke="#64748B" fontSize={12} tickLine={false} />
                          <YAxis stroke="#64748B" fontSize={12} tickLine={false} unit=" kWh" />
                          <Tooltip
                            contentStyle={{
                              backgroundColor: "#0F172A",
                              border: "none",
                              borderRadius: "8px",
                              color: "#fff",
                              fontSize: "12px",
                            }}
                          />
                          <Bar dataKey="unmetDemand" name="Unmet Demand (kWh)" fill="#F59E0B" radius={[6, 6, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </ChartContainer>

                  {/* Chart 4: Computational Latency Runtime (ms) */}
                  <ChartContainer
                    title="Algorithm Computational Latency"
                    subtitle="Execution runtime benchmarked in high-resolution milliseconds"
                  >
                    <div className="h-72 w-full pt-4">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={efficiencyData}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" opacity={0.6} />
                          <XAxis dataKey="algorithm" stroke="#64748B" fontSize={12} tickLine={false} />
                          <YAxis stroke="#64748B" fontSize={12} tickLine={false} unit=" ms" />
                          <Tooltip
                            contentStyle={{
                              backgroundColor: "#0F172A",
                              border: "none",
                              borderRadius: "8px",
                              color: "#fff",
                              fontSize: "12px",
                            }}
                          />
                          <Bar dataKey="runtimeMs" name="Runtime (ms)" fill="#8B5CF6" radius={[6, 6, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </ChartContainer>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ------------------------------------------------------------------ */}
        {/* TAB 2: LIVE ENERGY ALLOCATION ENGINE EXECUTION                    */}
        {/* ------------------------------------------------------------------ */}
        {activeTab === "allocation" && (
          <div className="space-y-6 animate-fadeIn">
            <Card className="p-6 space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-navy-900 dark:text-white flex items-center gap-2">
                    <Sliders className="w-5 h-5 text-brand-600" />
                    Execute Microgrid Energy Allocation Cycle
                  </h3>
                  <p className="text-xs text-navy-500 mt-0.5">
                    Clear active pending consumer requests against available producer capacity.
                  </p>
                </div>
              </div>

              {/* Formulation Explanation Card */}
              <div className="p-4 bg-navy-50 dark:bg-navy-950 rounded-2xl border border-navy-200 dark:border-navy-800 text-xs space-y-2">
                <span className="font-bold text-navy-800 dark:text-navy-200">
                  Mathematical Allocation Model:
                </span>
                <p className="font-mono text-brand-600 dark:text-brand-400 bg-white dark:bg-navy-900 p-2.5 rounded-lg border border-navy-200 dark:border-navy-800">
                  x_i = min(d_i, S * (w_i * d_i / sum(w_j * d_j))) with iterative residual surplus redistribution
                </p>
                <p className="text-navy-500">
                  Ensures zero negative allocations ($x_i \ge 0$), caps at requested demand ($x_i \le d_i$), and limits aggregate trades to total available generation ($\sum x_i \le S$).
                </p>
              </div>

              {/* Controls */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-navy-700 dark:text-navy-200 block mb-1">
                    Select Algorithm
                  </label>
                  <select
                    value={allocAlgorithm}
                    onChange={(e) => setAllocAlgorithm(e.target.value as any)}
                    className="w-full px-3 py-2 text-xs font-semibold bg-white dark:bg-navy-900 border border-navy-200 dark:border-navy-700 rounded-xl text-navy-800 dark:text-navy-200"
                  >
                    <option value="WEIGHTED_PROPORTIONAL">Demand-Aware Weighted Proportional (Proposed)</option>
                    <option value="PROPORTIONAL">Basic Proportional (Uniform Weights)</option>
                    <option value="FCFS">First-Come, First-Served (FCFS)</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-navy-700 dark:text-navy-200 block mb-1">
                    Execution Mode
                  </label>
                  <div className="flex items-center gap-4 mt-2">
                    <label className="inline-flex items-center gap-2 text-xs font-semibold text-navy-700 dark:text-navy-300 cursor-pointer">
                      <input
                        type="radio"
                        name="simulationMode"
                        checked={isSimulation}
                        onChange={() => setIsSimulation(true)}
                        className="accent-brand-600"
                      />
                      Simulation Only (No Database Mutation)
                    </label>
                    <label className="inline-flex items-center gap-2 text-xs font-semibold text-navy-700 dark:text-navy-300 cursor-pointer">
                      <input
                        type="radio"
                        name="simulationMode"
                        checked={!isSimulation}
                        onChange={() => setIsSimulation(false)}
                        className="accent-brand-600"
                      />
                      Live Execution (Commit to Ledger)
                    </label>
                  </div>
                </div>
              </div>

              <div className="pt-2">
                <Button
                  variant="primary"
                  loading={isAllocating}
                  onClick={handleExecuteAllocation}
                  leftIcon={<Play className="w-4 h-4" />}
                >
                  Run Allocation Engine
                </Button>
              </div>
            </Card>
          </div>
        )}

        {/* ------------------------------------------------------------------ */}
        {/* TAB 3: PRICE-AWARE GREEDY MATCHING ENGINE                         */}
        {/* ------------------------------------------------------------------ */}
        {activeTab === "matching" && (
          <div className="space-y-6 animate-fadeIn">
            <Card className="p-6 space-y-6">
              <div>
                <h3 className="text-base font-bold text-navy-900 dark:text-white flex items-center gap-2">
                  <Scale className="w-5 h-5 text-brand-600" />
                  Price-Aware Double-Auction Merit-Order Matching
                </h3>
                <p className="text-xs text-navy-500 mt-0.5">
                  Matches cheapest active producer asks with highest consumer bids while respecting max price ceilings.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="text-xs font-bold text-navy-700 dark:text-navy-200 block mb-1">
                    Clearing Price Determination Rule
                  </label>
                  <select
                    value={pricingRule}
                    onChange={(e) => setPricingRule(e.target.value as any)}
                    className="w-full px-3 py-2 text-xs font-semibold bg-white dark:bg-navy-900 border border-navy-200 dark:border-navy-700 rounded-xl text-navy-800 dark:text-navy-200"
                  >
                    <option value="MIDPOINT">Midpoint ((Ask + Bid) / 2)</option>
                    <option value="PRODUCER_ASK">Producer Marginal Cost (Ask Price)</option>
                    <option value="CONSUMER_BID">Consumer Willingness-to-Pay (Bid Price)</option>
                  </select>
                </div>
                <div className="sm:col-span-2 flex items-end">
                  <Button
                    variant="primary"
                    loading={isMatching}
                    onClick={handleExecuteMatching}
                    leftIcon={<Play className="w-4 h-4" />}
                  >
                    Run Greedy Double-Auction Matching
                  </Button>
                </div>
              </div>

              {matchingResult && (
                <div className="space-y-4 pt-4 border-t border-navy-100 dark:border-navy-800">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                    <div className="p-3 bg-navy-50 dark:bg-navy-800/50 rounded-xl">
                      <p className="text-navy-400 font-bold uppercase text-[10px]">Total Pairs</p>
                      <p className="text-base font-black text-navy-900 dark:text-white mt-0.5">
                        {matchingResult.matches.length} trades
                      </p>
                    </div>
                    <div className="p-3 bg-navy-50 dark:bg-navy-800/50 rounded-xl">
                      <p className="text-navy-400 font-bold uppercase text-[10px]">Volume Matched</p>
                      <p className="text-base font-black text-brand-600 mt-0.5">
                        {matchingResult.totalMatchedKwh} kWh
                      </p>
                    </div>
                    <div className="p-3 bg-navy-50 dark:bg-navy-800/50 rounded-xl">
                      <p className="text-navy-400 font-bold uppercase text-[10px]">Trading Value</p>
                      <p className="text-base font-black text-navy-900 dark:text-white mt-0.5 font-mono">
                        {matchingResult.totalTradingVolumeEth} ETH
                      </p>
                    </div>
                    <div className="p-3 bg-navy-50 dark:bg-navy-800/50 rounded-xl">
                      <p className="text-navy-400 font-bold uppercase text-[10px]">Latency</p>
                      <p className="text-base font-black text-purple-600 mt-0.5 font-mono">
                        {matchingResult.runtimeMs} ms
                      </p>
                    </div>
                  </div>

                  <div className="overflow-x-auto rounded-xl border border-navy-200 dark:border-navy-800">
                    <table className="w-full text-xs text-left">
                      <thead className="bg-navy-50 dark:bg-navy-800 text-[10px] uppercase font-bold text-navy-400">
                        <tr>
                          <th className="py-2.5 px-3">Listing</th>
                          <th className="py-2.5 px-3">Demand Request</th>
                          <th className="py-2.5 px-3">Source</th>
                          <th className="py-2.5 px-3">Volume (kWh)</th>
                          <th className="py-2.5 px-3">Clearing Price</th>
                          <th className="py-2.5 px-3">Total (ETH)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-navy-100 dark:divide-navy-800">
                        {matchingResult.matches.map((m: any, idx: number) => (
                          <tr key={idx}>
                            <td className="py-2 px-3 font-mono font-bold">Listing #{m.listingId}</td>
                            <td className="py-2 px-3 font-mono">Request #{m.requestId}</td>
                            <td className="py-2 px-3">{m.energySource}</td>
                            <td className="py-2 px-3 font-bold text-brand-600">{m.matchedKwh}</td>
                            <td className="py-2 px-3 font-mono">{m.clearingPriceEth}</td>
                            <td className="py-2 px-3 font-mono font-bold">{m.totalCostEth}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </Card>
          </div>
        )}

        {/* ------------------------------------------------------------------ */}
        {/* TAB 4: RULE-BASED DYNAMIC PRICING                                  */}
        {/* ------------------------------------------------------------------ */}
        {activeTab === "pricing" && (
          <div className="space-y-6 animate-fadeIn">
            <Card className="p-6 space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h3 className="text-base font-bold text-navy-900 dark:text-white flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-brand-600" />
                    Rule-Based Dynamic Pricing Mechanism
                  </h3>
                  <p className="text-xs text-navy-500 mt-0.5">
                    Deterministic tariff adjustments based on aggregate supply-demand ratio R, Time-of-Use hours, and regulatory caps.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-navy-500">Source:</span>
                  {(["SOLAR", "WIND", "HYDRO"] as const).map((src) => (
                    <button
                      key={src}
                      onClick={() => handleUpdatePricingSource(src)}
                      className={`px-3 py-1 text-xs font-bold rounded-lg transition cursor-pointer ${
                        pricingSource === src
                          ? "bg-brand-600 text-white"
                          : "bg-navy-100 dark:bg-navy-800 text-navy-700 dark:text-navy-300"
                      }`}
                    >
                      {src}
                    </button>
                  ))}
                </div>
              </div>

              {pricingData && (
                <div className="space-y-6">
                  {/* Pricing Key Indicators */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                    <div className="p-4 bg-navy-50 dark:bg-navy-800/50 rounded-2xl border border-navy-100 dark:border-navy-700">
                      <p className="text-navy-400 uppercase font-bold text-[10px]">Base Reference Tariff</p>
                      <p className="text-lg font-mono font-bold text-navy-900 dark:text-white mt-1">
                        {pricingData.referencePriceEth} ETH
                      </p>
                      <p className="text-[10px] text-navy-400">Regional benchmark</p>
                    </div>

                    <div className="p-4 bg-brand-50 dark:bg-brand-950/60 rounded-2xl border border-brand-200/60 dark:border-brand-800">
                      <p className="text-brand-700 dark:text-brand-300 uppercase font-bold text-[10px]">Recommended Tariff</p>
                      <p className="text-xl font-mono font-black text-brand-600 dark:text-brand-400 mt-1">
                        {pricingData.calculatedPriceEth} ETH
                      </p>
                      <p className="text-[10px] text-brand-600">≈ ₹{(pricingData.calculatedPriceEth * 280000).toFixed(2)}/kWh</p>
                    </div>

                    <div className="p-4 bg-navy-50 dark:bg-navy-800/50 rounded-2xl border border-navy-100 dark:border-navy-700">
                      <p className="text-navy-400 uppercase font-bold text-[10px]">Supply-Demand Ratio (R)</p>
                      <p className="text-lg font-mono font-bold text-navy-900 dark:text-white mt-1">
                        R = {pricingData.supplyDemandRatio}
                      </p>
                      <p className="text-[10px] text-navy-400">Demand: {pricingData.totalDemandKwh} kWh</p>
                    </div>

                    <div className="p-4 bg-navy-50 dark:bg-navy-800/50 rounded-2xl border border-navy-100 dark:border-navy-700">
                      <p className="text-navy-400 uppercase font-bold text-[10px]">Time-of-Use Schedule</p>
                      <p className="text-sm font-bold text-navy-900 dark:text-white mt-1">
                        {pricingData.touMultiplier}x Multiplier
                      </p>
                      <p className="text-[10px] text-navy-400">{pricingData.touPeriodLabel}</p>
                    </div>
                  </div>

                  {/* Transparent Rule Breakdown */}
                  <div className="p-5 rounded-2xl bg-slate-50 dark:bg-navy-950 border border-navy-200 dark:border-navy-800 space-y-3 text-xs">
                    <span className="font-bold text-navy-900 dark:text-white uppercase tracking-wider text-[10px]">
                      Transparent Pricing Decision Explanation:
                    </span>
                    <div className="space-y-1.5 text-navy-700 dark:text-navy-300">
                      <p>• <strong>Supply-Demand Rule:</strong> {pricingData.ruleReason}</p>
                      <p>• <strong>Source Adjustment:</strong> {pricingData.sourceReason}</p>
                      <p>• <strong>Regulatory Clamping:</strong> {pricingData.clampNotice} (Floor: {pricingData.minPriceFloorEth} ETH | Ceiling: {pricingData.maxPriceCeilingEth} ETH)</p>
                    </div>
                    <div className="pt-2 border-t border-navy-200 dark:border-navy-800 font-mono text-[11px] text-brand-600 dark:text-brand-400">
                      {pricingData.formulaSummary}
                    </div>
                  </div>
                </div>
              )}
            </Card>
          </div>
        )}

        {/* ------------------------------------------------------------------ */}
        {/* TAB 5: EXECUTION AUDIT HISTORY                                    */}
        {/* ------------------------------------------------------------------ */}
        {activeTab === "history" && (
          <div className="space-y-6 animate-fadeIn">
            <Card className="p-6">
              <h3 className="text-base font-bold text-navy-900 dark:text-white mb-4 flex items-center gap-2">
                <FileText className="w-5 h-5 text-brand-600" />
                Historical Clearing Cycles Audit Log
              </h3>
              {executionHistory.length > 0 ? (
                <DataTable data={executionHistory} columns={historyColumns} />
              ) : (
                <EmptyState
                  title="No Clearing History"
                  description="Run an allocation cycle from the Allocation tab to create verifiable historical records."
                />
              )}
            </Card>
          </div>
        )}

        {/* Details Modal */}
        {selectedResult && (
          <Modal
            isOpen={resultModalOpen}
            onClose={() => setResultModalOpen(false)}
            title={`Clearing Cycle Details #CYCLE-${selectedResult.id}`}
            size="lg"
          >
            <div className="space-y-4 pt-2 text-xs">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3 bg-navy-50 dark:bg-navy-950 rounded-xl">
                <div>
                  <span className="text-navy-400 uppercase text-[10px] font-bold">Algorithm</span>
                  <p className="font-bold text-navy-900 dark:text-white mt-0.5">{selectedResult.algorithm_name}</p>
                </div>
                <div>
                  <span className="text-navy-400 uppercase text-[10px] font-bold">Jain&apos;s Index</span>
                  <p className="font-mono font-bold text-emerald-600 mt-0.5">{selectedResult.jain_fairness_index}</p>
                </div>
                <div>
                  <span className="text-navy-400 uppercase text-[10px] font-bold">Total Traded</span>
                  <p className="font-bold text-brand-600 mt-0.5">{selectedResult.total_allocated_energy} kWh</p>
                </div>
                <div>
                  <span className="text-navy-400 uppercase text-[10px] font-bold">Latency</span>
                  <p className="font-mono text-navy-500 mt-0.5">{selectedResult.execution_time_ms} ms</p>
                </div>
              </div>

              <h4 className="font-bold text-navy-900 dark:text-white pt-2">Itemized Consumer Allocations:</h4>
              <div className="max-h-60 overflow-y-auto rounded-xl border border-navy-200 dark:border-navy-800">
                <table className="w-full text-xs text-left">
                  <thead className="bg-navy-50 dark:bg-navy-800 text-[10px] uppercase font-bold text-navy-400">
                    <tr>
                      <th className="py-2 px-3">Consumer</th>
                      <th className="py-2 px-3">Requested</th>
                      <th className="py-2 px-3">Allocated</th>
                      <th className="py-2 px-3">Fulfillment</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-navy-100 dark:divide-navy-800">
                    {(selectedResult.details || []).map((d: any, idx: number) => (
                      <tr key={idx}>
                        <td className="py-2 px-3 font-bold">{d.consumer_name || `Consumer #${d.consumer_id}`}</td>
                        <td className="py-2 px-3">{d.requested_energy_kwh} kWh</td>
                        <td className="py-2 px-3 font-bold text-brand-600">{d.allocated_energy_kwh} kWh</td>
                        <td className="py-2 px-3 font-mono font-semibold">
                          {(Number(d.fulfillment_ratio || 0) * 100).toFixed(1)}%
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </Modal>
        )}
      </div>
    </DashboardLayout>
  );
}
