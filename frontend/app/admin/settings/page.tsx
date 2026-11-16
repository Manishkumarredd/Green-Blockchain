"use client";

import React, { useEffect, useState } from "react";
import {
  Settings,
  Save,
  RefreshCw,
  Sliders,
  DollarSign,
  Leaf,
  Shield,
  AlertCircle,
  CheckCircle,
  HelpCircle,
  Scale,
} from "lucide-react";
import { useApp } from "../../../components/common/AppContext";
import { DashboardLayout } from "../../../components/layout/DashboardLayout";
import { PageHeader } from "../../../components/ui/PageHeader";
import { adminApi } from "../../../services/api";

export default function AdminSettingsPage() {
  const { setRole } = useApp();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    platform_name: "GreenLedger P2P Microgrid",
    platform_commission_rate: "0.015",
    base_grid_tariff_eth: "0.00010000",
    min_price_floor_eth: "0.00005000",
    max_price_ceiling_eth: "0.00020000",
    low_demand_threshold: "0.50",
    high_demand_threshold: "1.00",
    low_demand_discount_pct: "0.10",
    high_demand_surcharge_pct: "0.10",
    grid_emission_factor_kg_per_kwh: "0.8200",
    weight_critical: "2.0",
    weight_commercial: "1.5",
    weight_standard: "1.0",
  });
  const [metadata, setMetadata] = useState<any>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    setRole("ADMIN");
    loadSettings();
  }, [setRole]);

  const loadSettings = async () => {
    try {
      setLoading(true);
      setErrorMessage(null);
      const res = await adminApi.getSettings();
      const settings = res.data;
      setMetadata(settings);

      // Populate flat form fields
      if (settings.rawSettings) {
        const flat: Record<string, string> = {};
        settings.rawSettings.forEach((r: any) => {
          flat[r.setting_key] = String(r.setting_value);
        });
        setFormData((prev) => ({ ...prev, ...flat }));
      }
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to load platform settings");
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (key: string, value: string) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      setErrorMessage(null);
      setSuccessMessage(null);

      // Validation guardrails
      const minPrice = parseFloat(formData.min_price_floor_eth);
      const maxPrice = parseFloat(formData.max_price_ceiling_eth);
      const basePrice = parseFloat(formData.base_grid_tariff_eth);

      if (minPrice >= maxPrice) {
        throw new Error("Minimum price floor must be strictly lower than maximum price ceiling.");
      }
      if (basePrice < minPrice || basePrice > maxPrice) {
        throw new Error("Base reference tariff must be situated within the regulatory safety bounds [P_min, P_max].");
      }

      const res = await adminApi.updateSettings({ settings: formData });
      setMetadata(res.data);
      setSuccessMessage("Platform parameters updated and permanently persisted to PostgreSQL audit ledger.");
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to update platform settings");
    } finally {
      setSaving(false);
    }
  };

  return (
    <DashboardLayout activeNavId="settings">
      <div className="space-y-6 max-w-5xl">
        <PageHeader
          title="Microgrid Platform Settings & Governance Rules"
          description="Configure decentralized market clearing parameters, dynamic pricing bounds, priority allocation weights, and environmental baselines."
          action={
            <button
              onClick={loadSettings}
              disabled={loading}
              className="flex items-center px-3.5 py-2 bg-white dark:bg-navy-800 text-navy-700 dark:text-navy-200 border border-navy-200 dark:border-navy-700 rounded-xl hover:bg-slate-50 dark:hover:bg-navy-700 text-xs font-medium transition cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${loading ? "animate-spin" : ""}`} />
              Reload Parameters
            </button>
          }
        />

        {/* Notifications */}
        {errorMessage && (
          <div className="p-4 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 rounded-2xl flex items-center justify-between text-rose-700 dark:text-rose-300 text-xs">
            <div className="flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{errorMessage}</span>
            </div>
            <button onClick={() => setErrorMessage(null)} className="font-bold underline ml-2">Dismiss</button>
          </div>
        )}
        {successMessage && (
          <div className="p-4 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-2xl flex items-center justify-between text-emerald-700 dark:text-emerald-300 text-xs">
            <div className="flex items-center space-x-2">
              <CheckCircle className="w-4 h-4 flex-shrink-0" />
              <span>{successMessage}</span>
            </div>
            <button onClick={() => setSuccessMessage(null)} className="font-bold underline ml-2">Dismiss</button>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Section 1: Platform & Market Configuration */}
          <div className="bg-white dark:bg-navy-900 rounded-2xl border border-navy-200 dark:border-navy-800 p-6 shadow-xs space-y-4">
            <div className="flex items-center space-x-2.5 pb-3 border-b border-navy-100 dark:border-navy-800">
              <Settings className="w-5 h-5 text-brand-600" />
              <h3 className="text-base font-bold text-navy-900 dark:text-white">1. Platform Parameters & Protocol Identity</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-navy-700 dark:text-navy-300 block mb-1.5">
                  Platform Name
                </label>
                <input
                  type="text"
                  value={formData.platform_name}
                  onChange={(e) => handleInputChange("platform_name", e.target.value)}
                  className="w-full text-xs px-3.5 py-2.5 bg-slate-50 dark:bg-navy-800 border border-navy-200 dark:border-navy-700 rounded-xl text-navy-900 dark:text-white"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-navy-700 dark:text-navy-300 block mb-1.5">
                  Platform Escrow Fee Rate (Decimal: 0.015 = 1.5%)
                </label>
                <input
                  type="number"
                  step="0.001"
                  min="0"
                  max="0.10"
                  value={formData.platform_commission_rate}
                  onChange={(e) => handleInputChange("platform_commission_rate", e.target.value)}
                  className="w-full text-xs px-3.5 py-2.5 bg-slate-50 dark:bg-navy-800 border border-navy-200 dark:border-navy-700 rounded-xl text-navy-900 dark:text-white font-mono"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Rule-Based Dynamic Pricing & Safety Clamps */}
          <div className="bg-white dark:bg-navy-900 rounded-2xl border border-navy-200 dark:border-navy-800 p-6 shadow-xs space-y-4">
            <div className="flex items-center space-x-2.5 pb-3 border-b border-navy-100 dark:border-navy-800">
              <DollarSign className="w-5 h-5 text-brand-600" />
              <div>
                <h3 className="text-base font-bold text-navy-900 dark:text-white">2. Dynamic Tariff Engine & Regulatory Clamps</h3>
                <p className="text-xs text-navy-400">Guarantees bounded price exploration and prevents price gouging</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="text-xs font-bold text-navy-700 dark:text-navy-300 block mb-1.5">
                  Base Reference Tariff (ETH / kWh)
                </label>
                <input
                  type="number"
                  step="0.000001"
                  value={formData.base_grid_tariff_eth}
                  onChange={(e) => handleInputChange("base_grid_tariff_eth", e.target.value)}
                  className="w-full text-xs px-3.5 py-2.5 bg-slate-50 dark:bg-navy-800 border border-navy-200 dark:border-navy-700 rounded-xl text-navy-900 dark:text-white font-mono"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-navy-700 dark:text-navy-300 block mb-1.5">
                  Minimum Regulatory Floor P_min (ETH / kWh)
                </label>
                <input
                  type="number"
                  step="0.000001"
                  value={formData.min_price_floor_eth}
                  onChange={(e) => handleInputChange("min_price_floor_eth", e.target.value)}
                  className="w-full text-xs px-3.5 py-2.5 bg-slate-50 dark:bg-navy-800 border border-navy-200 dark:border-navy-700 rounded-xl text-navy-900 dark:text-white font-mono"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-navy-700 dark:text-navy-300 block mb-1.5">
                  Maximum Regulatory Ceiling P_max (ETH / kWh)
                </label>
                <input
                  type="number"
                  step="0.000001"
                  value={formData.max_price_ceiling_eth}
                  onChange={(e) => handleInputChange("max_price_ceiling_eth", e.target.value)}
                  className="w-full text-xs px-3.5 py-2.5 bg-slate-50 dark:bg-navy-800 border border-navy-200 dark:border-navy-700 rounded-xl text-navy-900 dark:text-white font-mono"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-navy-700 dark:text-navy-300 block mb-1.5">
                  Low Demand Elasticity Threshold (R &lt; 0.50)
                </label>
                <input
                  type="number"
                  step="0.05"
                  value={formData.low_demand_threshold}
                  onChange={(e) => handleInputChange("low_demand_threshold", e.target.value)}
                  className="w-full text-xs px-3.5 py-2.5 bg-slate-50 dark:bg-navy-800 border border-navy-200 dark:border-navy-700 rounded-xl text-navy-900 dark:text-white font-mono"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-navy-700 dark:text-navy-300 block mb-1.5">
                  High Demand Elasticity Threshold (R &gt; 1.00)
                </label>
                <input
                  type="number"
                  step="0.05"
                  value={formData.high_demand_threshold}
                  onChange={(e) => handleInputChange("high_demand_threshold", e.target.value)}
                  className="w-full text-xs px-3.5 py-2.5 bg-slate-50 dark:bg-navy-800 border border-navy-200 dark:border-navy-700 rounded-xl text-navy-900 dark:text-white font-mono"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-navy-700 dark:text-navy-300 block mb-1.5">
                  Surplus Green Discount (0.10 = -10%)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.low_demand_discount_pct}
                  onChange={(e) => handleInputChange("low_demand_discount_pct", e.target.value)}
                  className="w-full text-xs px-3.5 py-2.5 bg-slate-50 dark:bg-navy-800 border border-navy-200 dark:border-navy-700 rounded-xl text-navy-900 dark:text-white font-mono"
                />
              </div>
            </div>
          </div>

          {/* Section 3: Phase 7 Priority Allocation Weights */}
          <div className="bg-white dark:bg-navy-900 rounded-2xl border border-navy-200 dark:border-navy-800 p-6 shadow-xs space-y-4">
            <div className="flex items-center space-x-2.5 pb-3 border-b border-navy-100 dark:border-navy-800">
              <Scale className="w-5 h-5 text-brand-600" />
              <div>
                <h3 className="text-base font-bold text-navy-900 dark:text-white">3. Demand-Aware Weighted Proportional (DA-WPA) Weights</h3>
                <p className="text-xs text-navy-400">Multiplier applied to consumer demand for proportional capacity distribution</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="text-xs font-bold text-navy-700 dark:text-navy-300 block mb-1.5">
                  Critical Healthcare / Hospital Load (w_critical)
                </label>
                <input
                  type="number"
                  step="0.1"
                  min="1.0"
                  max="5.0"
                  value={formData.weight_critical}
                  onChange={(e) => handleInputChange("weight_critical", e.target.value)}
                  className="w-full text-xs px-3.5 py-2.5 bg-slate-50 dark:bg-navy-800 border border-navy-200 dark:border-navy-700 rounded-xl text-navy-900 dark:text-white font-mono"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-navy-700 dark:text-navy-300 block mb-1.5">
                  Commercial Data Centers / EV Fleet (w_commercial)
                </label>
                <input
                  type="number"
                  step="0.1"
                  min="1.0"
                  max="5.0"
                  value={formData.weight_commercial}
                  onChange={(e) => handleInputChange("weight_commercial", e.target.value)}
                  className="w-full text-xs px-3.5 py-2.5 bg-slate-50 dark:bg-navy-800 border border-navy-200 dark:border-navy-700 rounded-xl text-navy-900 dark:text-white font-mono"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-navy-700 dark:text-navy-300 block mb-1.5">
                  Standard Residential Microgrid Node (w_standard)
                </label>
                <input
                  type="number"
                  step="0.1"
                  min="0.5"
                  max="2.0"
                  value={formData.weight_standard}
                  onChange={(e) => handleInputChange("weight_standard", e.target.value)}
                  className="w-full text-xs px-3.5 py-2.5 bg-slate-50 dark:bg-navy-800 border border-navy-200 dark:border-navy-700 rounded-xl text-navy-900 dark:text-white font-mono"
                />
              </div>
            </div>
          </div>

          {/* Section 4: Environmental & Carbon Emission Factor */}
          <div className="bg-white dark:bg-navy-900 rounded-2xl border border-navy-200 dark:border-navy-800 p-6 shadow-xs space-y-4">
            <div className="flex items-center space-x-2.5 pb-3 border-b border-navy-100 dark:border-navy-800">
              <Leaf className="w-5 h-5 text-emerald-600" />
              <div>
                <h3 className="text-base font-bold text-navy-900 dark:text-white">4. Environmental Impact & Emission Baseline</h3>
                <p className="text-xs text-navy-400">Standard factors for estimating avoided grid carbon emissions</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-navy-700 dark:text-navy-300 block mb-1.5">
                  Grid Emission Factor (kg CO₂ / kWh)
                </label>
                <input
                  type="number"
                  step="0.001"
                  value={formData.grid_emission_factor_kg_per_kwh}
                  onChange={(e) => handleInputChange("grid_emission_factor_kg_per_kwh", e.target.value)}
                  className="w-full text-xs px-3.5 py-2.5 bg-slate-50 dark:bg-navy-800 border border-navy-200 dark:border-navy-700 rounded-xl text-navy-900 dark:text-white font-mono"
                />
              </div>

              <div className="p-3 bg-slate-50 dark:bg-navy-800/60 rounded-xl border border-navy-100 dark:border-navy-800 text-xs">
                <div className="font-bold text-navy-900 dark:text-white flex items-center mb-1">
                  <HelpCircle className="w-3.5 h-3.5 mr-1 text-emerald-600" />
                  Source Documentation & Methodology
                </div>
                <p className="text-navy-500 dark:text-navy-400 leading-relaxed">
                  Based on the <strong>Central Electricity Authority (CEA) Baseline Database for the Indian Power Sector (v19)</strong>. Used for informational avoided emissions calculation. <em>Not claimed as certified tradable carbon offsets.</em>
                </p>
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={saving}
              className="flex items-center px-6 py-2.5 bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-xs transition cursor-pointer"
            >
              <Save className={`w-4 h-4 mr-2 ${saving ? "animate-spin" : ""}`} />
              {saving ? "Persisting Parameters..." : "Save Platform Configuration"}
            </button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
}
