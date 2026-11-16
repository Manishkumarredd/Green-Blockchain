"use client";

import React, { useEffect, useState } from "react";
import {
  TrendingUp,
  Download,
  RefreshCw,
  Scale,
  Award,
  Zap,
  Sliders,
  CheckCircle,
  AlertCircle,
  FileText,
  Clock,
  Layers,
} from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
} from "recharts";
import { useApp } from "../../../components/common/AppContext";
import { DashboardLayout } from "../../../components/layout/DashboardLayout";
import { PageHeader } from "../../../components/ui/PageHeader";
import { adminApi } from "../../../services/api";

export default function AdminResearchAnalyticsPage() {
  const { setRole } = useApp();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);
  const [selectedScenarioKey, setSelectedScenarioKey] = useState("LOW_SUPPLY_HIGH_DEMAND");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    setRole("ADMIN");
  }, [setRole]);

  useEffect(() => {
    loadAnalytics();
  }, [selectedScenarioKey]);

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      setErrorMessage(null);
      const res = await adminApi.getResearchAnalytics({ scenarioKey: selectedScenarioKey });
      setData(res.data);
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to load research analytics");
    } finally {
      setLoading(false);
    }
  };

  const handleExportCsv = () => {
    const exportUrl = adminApi.exportResearchAnalyticsCsv();
    window.open(exportUrl, "_blank");
  };

  const activeExperiment = data?.activeScenario || null;
  const comparisonTable = activeExperiment?.comparisonTable || [];

  // Recharts Chart Formats
  const fairnessComparisonData = comparisonTable.filter(
    (item: any) => item.metric.includes("Jain") || item.metric.includes("Fulfillment") || item.metric.includes("Efficiency")
  ).map((item: any) => ({
    metric: item.metric,
    FCFS: item.fcfs,
    BPA: item.basicProportional,
    "DA-WPA (Proposed)": item.proposedAlgorithm,
  }));

  const runtimeComparisonData = comparisonTable.filter((item: any) => item.metric.includes("Runtime")).map((item: any) => ({
    metric: "Execution Latency",
    FCFS: item.fcfs,
    BPA: item.basicProportional,
    "DA-WPA (Proposed)": item.proposedAlgorithm,
  }));

  return (
    <DashboardLayout activeNavId="research">
      <div className="space-y-6">
        <PageHeader
          title="Empirical Research Analytics & Benchmarks"
          description="Rigorously evaluate Demand-Aware Weighted Proportional Allocation against FCFS and Basic Proportional baselines across 6 reproducible scenarios."
          action={
            <div className="flex items-center space-x-3">
              <button
                onClick={handleExportCsv}
                className="flex items-center px-3.5 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-xs font-bold transition shadow-xs cursor-pointer"
              >
                <Download className="w-3.5 h-3.5 mr-1.5" />
                Export Research CSV
              </button>
              <button
                onClick={loadAnalytics}
                disabled={loading}
                className="flex items-center px-3.5 py-2 bg-white dark:bg-navy-800 text-navy-700 dark:text-navy-200 border border-navy-200 dark:border-navy-700 rounded-xl hover:bg-slate-50 dark:hover:bg-navy-700 text-xs font-medium transition cursor-pointer"
              >
                <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${loading ? "animate-spin" : ""}`} />
                Re-run Experiments
              </button>
            </div>
          }
        />

        {/* Academic Simulation Notice */}
        <div className="p-4 bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800 rounded-2xl flex items-start space-x-3 text-xs text-purple-900 dark:text-purple-300">
          <Layers className="w-5 h-5 text-purple-600 flex-shrink-0 mt-0.5" />
          <div className="space-y-1">
            <strong className="block font-bold">Academic Experimentation Sandbox:</strong>
            <p className="leading-relaxed">
              These empirical evaluations simulate deterministic renewable generation profiles using seeded pseudo-random numbers (Mulberry32). They are strictly isolated from real commercial settlement ledgers to preserve scientific reproducibility.
            </p>
          </div>
        </div>

        {errorMessage && (
          <div className="p-4 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 rounded-2xl flex items-center justify-between text-rose-700 dark:text-rose-300 text-xs">
            <span>{errorMessage}</span>
            <button onClick={() => setErrorMessage(null)} className="font-bold underline ml-2">Dismiss</button>
          </div>
        )}

        {/* Scenario Selection Pills */}
        <div className="bg-white dark:bg-navy-900 p-4 rounded-2xl border border-navy-200 dark:border-navy-800 shadow-xs">
          <label className="text-xs font-bold uppercase tracking-wider text-navy-400 mb-2.5 block">
            Select Standardized Research Scenario (6 Benchmarks)
          </label>
          <div className="flex flex-wrap gap-2">
            {[
              { key: "LOW_SUPPLY_HIGH_DEMAND", label: "1. Scarcity (Low Supply, High Demand)" },
              { key: "HIGH_SUPPLY_LOW_DEMAND", label: "2. Surplus (High Supply, Low Demand)" },
              { key: "BALANCED_SUPPLY_DEMAND", label: "3. Balanced Market" },
              { key: "UNEQUAL_CONSUMER_REQUESTS", label: "4. Unequal Demand Disparity" },
              { key: "MULTI_PRODUCER_DIVERSE_PRICING", label: "5. Multi-Producer Double Auction" },
              { key: "SCALABILITY_STRESS_TEST", label: "6. Stress Test (50+ Nodes)" },
            ].map((sc) => (
              <button
                key={sc.key}
                onClick={() => setSelectedScenarioKey(sc.key)}
                className={`px-3 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                  selectedScenarioKey === sc.key
                    ? "bg-brand-600 text-white shadow-xs"
                    : "bg-slate-50 dark:bg-navy-800 text-navy-700 dark:text-navy-300 hover:bg-slate-100 dark:hover:bg-navy-700 border border-navy-200 dark:border-navy-700"
                }`}
              >
                {sc.label}
              </button>
            ))}
          </div>
        </div>

        {/* Active Scenario Overview Card */}
        {activeExperiment && (
          <div className="bg-white dark:bg-navy-900 rounded-2xl border border-navy-200 dark:border-navy-800 p-6 shadow-xs">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-navy-100 dark:border-navy-800">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-brand-600 dark:text-brand-400 bg-brand-50 dark:bg-brand-950/60 px-2.5 py-1 rounded-md">
                  Active Scenario: {activeExperiment.scenario.id}
                </span>
                <h3 className="text-lg font-bold text-navy-900 dark:text-white mt-2">
                  {activeExperiment.scenario.name}
                </h3>
                <p className="text-xs text-navy-500 dark:text-navy-400 mt-1 max-w-2xl leading-relaxed">
                  {activeExperiment.scenario.description}
                </p>
              </div>

              <div className="flex items-center space-x-4 text-xs font-mono">
                <div className="p-3 bg-slate-50 dark:bg-navy-800/60 rounded-xl text-center">
                  <div className="text-[10px] text-navy-400 uppercase font-bold">Available Supply</div>
                  <div className="text-sm font-bold text-navy-900 dark:text-white mt-0.5">{activeExperiment.scenario.totalSupplyKwh} kWh</div>
                </div>
                <div className="p-3 bg-slate-50 dark:bg-navy-800/60 rounded-xl text-center">
                  <div className="text-[10px] text-navy-400 uppercase font-bold">Total Demand</div>
                  <div className="text-sm font-bold text-navy-900 dark:text-white mt-0.5">{activeExperiment.scenario.totalRequestedKwh} kWh</div>
                </div>
                <div className="p-3 bg-slate-50 dark:bg-navy-800/60 rounded-xl text-center">
                  <div className="text-[10px] text-navy-400 uppercase font-bold">Consumers</div>
                  <div className="text-sm font-bold text-navy-900 dark:text-white mt-0.5">{activeExperiment.scenario.consumersCount}</div>
                </div>
              </div>
            </div>

            {/* Empirical Comparison Table */}
            <div className="mt-6 overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-navy-950/50 text-navy-500 uppercase tracking-wider font-semibold border-b border-navy-100 dark:border-navy-800">
                  <tr>
                    <th className="px-6 py-3.5">Performance / Fairness Metric</th>
                    <th className="px-6 py-3.5 text-center text-slate-500">Baseline 1: FCFS</th>
                    <th className="px-6 py-3.5 text-center text-sky-600">Baseline 2: Basic Proportional</th>
                    <th className="px-6 py-3.5 text-center text-brand-600 font-bold bg-brand-50/50 dark:bg-brand-950/30">
                      Proposed: DA-WPA
                    </th>
                    <th className="px-6 py-3.5">Unit</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-navy-100 dark:divide-navy-800 font-medium">
                  {comparisonTable.map((item: any, idx: number) => {
                    const isJain = item.metric.includes("Jain");
                    const isMinFulfill = item.metric.includes("Minimum");
                    return (
                      <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-navy-800/40">
                        <td className="px-6 py-3.5 font-bold text-navy-900 dark:text-white flex items-center">
                          {isJain && <Award className="w-4 h-4 mr-2 text-brand-600" />}
                          {item.metric}
                        </td>
                        <td className="px-6 py-3.5 text-center font-mono text-slate-600 dark:text-slate-400">
                          {item.fcfs}
                        </td>
                        <td className="px-6 py-3.5 text-center font-mono text-sky-600 dark:text-sky-400">
                          {item.basicProportional}
                        </td>
                        <td className="px-6 py-3.5 text-center font-mono font-bold text-brand-600 dark:text-brand-400 bg-brand-50/50 dark:bg-brand-950/30">
                          {item.proposedAlgorithm}
                        </td>
                        <td className="px-6 py-3.5 text-navy-400 font-mono">{item.unit || "Ratio"}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Recharts Visual Comparison Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Chart 1: Fairness & Fulfillment Comparison */}
          <div className="bg-white dark:bg-navy-900 p-6 rounded-2xl border border-navy-200 dark:border-navy-800 shadow-xs">
            <h3 className="text-sm font-bold text-navy-900 dark:text-white mb-1">
              Fairness & Fulfillment Ratio Comparison
            </h3>
            <p className="text-xs text-navy-400 mb-6">Normalized evaluation across the 3 allocation regimes</p>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={fairnessComparisonData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" opacity={0.2} />
                  <XAxis dataKey="metric" stroke="#94A3B8" fontSize={11} tickLine={false} />
                  <YAxis stroke="#94A3B8" fontSize={11} tickLine={false} />
                  <Tooltip contentStyle={{ backgroundColor: "#0F172A", borderColor: "#334155", borderRadius: "12px", color: "#F8FAFC" }} />
                  <Legend />
                  <Bar dataKey="FCFS" fill="#94A3B8" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="BPA" fill="#0284C7" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="DA-WPA (Proposed)" fill="#16A34A" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Chart 2: Algorithmic Latency & Computational Overhead */}
          <div className="bg-white dark:bg-navy-900 p-6 rounded-2xl border border-navy-200 dark:border-navy-800 shadow-xs">
            <h3 className="text-sm font-bold text-navy-900 dark:text-white mb-1">
              Computational Execution Latency (ms)
            </h3>
            <p className="text-xs text-navy-400 mb-6">Sub-millisecond runtime proving scalability for off-chain matching</p>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={runtimeComparisonData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" opacity={0.2} />
                  <XAxis dataKey="metric" stroke="#94A3B8" fontSize={11} tickLine={false} />
                  <YAxis stroke="#94A3B8" fontSize={11} tickLine={false} unit=" ms" />
                  <Tooltip contentStyle={{ backgroundColor: "#0F172A", borderColor: "#334155", borderRadius: "12px", color: "#F8FAFC" }} />
                  <Legend />
                  <Bar dataKey="FCFS" fill="#94A3B8" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="BPA" fill="#0284C7" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="DA-WPA (Proposed)" fill="#8B5CF6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
