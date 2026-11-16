"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Sun,
  Wind,
  Droplets,
  Flame,
  Zap,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Coins,
  ShieldCheck,
} from "lucide-react";
import { DashboardLayout } from "../../../../components/layout/DashboardLayout";
import { PageHeader } from "../../../../components/ui/PageHeader";
import { Card } from "../../../../components/ui/Card";
import { Button } from "../../../../components/ui/Button";
import { Input } from "../../../../components/ui/Input";
import { Select } from "../../../../components/ui/Select";
import { useApp } from "../../../../components/common/AppContext";
import { producersApi } from "../../../../services/api";

const SOURCE_OPTIONS = [
  { value: "SOLAR", label: "Solar Photovoltaic (PV)", icon: Sun, desc: "Clean daytime solar irradiance generation" },
  { value: "WIND", label: "Wind Turbine Station", icon: Wind, desc: "Aerodynamic kinetic wind energy" },
  { value: "HYDRO", label: "Hydroelectric Turbine", icon: Droplets, desc: "Run-of-the-river or reservoir generation" },
  { value: "BIOMASS", label: "Biomass / Bio-Gas", icon: Flame, desc: "Sustainable organic thermal generation" },
  { value: "HYBRID", label: "Hybrid Solar + Storage", icon: Zap, desc: "Renewable battery energy storage mix" },
];

export default function CreateListingPage() {
  const router = useRouter();
  const { addToast } = useApp();

  const [energySource, setEnergySource] = useState("SOLAR");
  const [totalEnergyKwh, setTotalEnergyKwh] = useState("");
  const [pricePerKwh, setPricePerKwh] = useState("0.000085");
  const [minPurchaseKwh, setMinPurchaseKwh] = useState("5.0");
  const [windowHours, setWindowHours] = useState("24");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Calculations
  const totalKwhNum = parseFloat(totalEnergyKwh) || 0;
  const priceNum = parseFloat(pricePerKwh) || 0;
  const projectedGrossRevenueEth = (totalKwhNum * priceNum).toFixed(6);
  const estimatedCarbonOffsetKg = (totalKwhNum * 0.82).toFixed(1);

  const validateForm = () => {
    const errs: Record<string, string> = {};
    if (!totalEnergyKwh || totalKwhNum <= 0) {
      errs.totalEnergyKwh = "Energy quantity must be greater than 0 kWh";
    }
    if (!pricePerKwh || priceNum <= 0) {
      errs.pricePerKwh = "Selling price must be greater than 0 ETH";
    } else if (priceNum < 0.00004) {
      errs.pricePerKwh = "Price is below minimum platform floor tariff (0.000040 ETH)";
    }
    if (parseFloat(minPurchaseKwh) <= 0) {
      errs.minPurchaseKwh = "Minimum purchase must be at least 0.1 kWh";
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      setLoading(true);
      const res = await producersApi.createListing({
        energySource: energySource as any,
        totalEnergyKwh: totalKwhNum,
        pricePerKwh: priceNum,
        minPurchaseKwh: parseFloat(minPurchaseKwh) || 1.0,
        windowHours: parseInt(windowHours, 10) || 24,
      });

      if (res.success) {
        addToast({
          type: "success",
          title: "Listing Created Successfully",
          message: `Listed ${totalKwhNum} kWh of ${energySource} at ${priceNum} ETH/kWh on the decentralized orderbook.`,
        });
        router.push("/producer/listings");
      } else {
        addToast({
          type: "error",
          title: "Listing Submission Failed",
          message: res.error || "Please verify your parameters and try again.",
        });
      }
    } catch (err: any) {
      addToast({
        type: "error",
        title: "Submission Error",
        message: err.message || "Could not publish listing to backend",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout activeNavId="listings">
      <div className="max-w-4xl mx-auto space-y-6 pb-12">
        <PageHeader
          title="Create Renewable Energy Listing"
          description="Publish available generation capacity to the decentralized GreenLedger P2P orderbook."
          breadcrumbs={[
            { label: "Dashboard", href: "/producer/dashboard" },
            { label: "Listings", href: "/producer/listings" },
            { label: "Create New" },
          ]}
          actions={
            <Button
              variant="outline"
              size="sm"
              icon={ArrowLeft}
              onClick={() => router.push("/producer/listings")}
            >
              Back to Listings
            </Button>
          }
        />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Listing Form */}
          <div className="lg:col-span-2">
            <Card className="p-6">
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* 1. Renewable Energy Source Selection */}
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-navy-500 dark:text-navy-400 block mb-2">
                    1. Renewable Energy Generation Source
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {SOURCE_OPTIONS.map((opt) => {
                      const Icon = opt.icon;
                      const isSelected = energySource === opt.value;
                      return (
                        <div
                          key={opt.value}
                          onClick={() => setEnergySource(opt.value)}
                          className={`p-3.5 rounded-xl border-2 cursor-pointer transition flex items-start gap-3 ${
                            isSelected
                              ? "border-brand-500 bg-brand-50/50 dark:bg-brand-950/20 text-brand-950 dark:text-brand-100"
                              : "border-navy-200 dark:border-navy-800 hover:border-navy-300 dark:hover:border-navy-700 bg-white dark:bg-navy-900"
                          }`}
                        >
                          <div
                            className={`p-2 rounded-lg ${
                              isSelected
                                ? "bg-brand-500 text-white"
                                : "bg-navy-100 dark:bg-navy-800 text-navy-600 dark:text-navy-300"
                            }`}
                          >
                            <Icon className="w-5 h-5" />
                          </div>
                          <div>
                            <p className="text-sm font-bold">{opt.label}</p>
                            <p className="text-[11px] text-navy-500 dark:text-navy-400 mt-0.5">
                              {opt.desc}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* 2. Total Capacity & Pricing */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold text-navy-800 dark:text-navy-200 block mb-1">
                      Total Energy Quantity (kWh) *
                    </label>
                    <Input
                      type="number"
                      step="0.1"
                      min="1"
                      placeholder="e.g. 250.0"
                      value={totalEnergyKwh}
                      onChange={(e) => setTotalEnergyKwh(e.target.value)}
                      error={errors.totalEnergyKwh}
                      required
                    />
                    <p className="text-[11px] text-navy-400 mt-1">
                      Available capacity certified by smart meter
                    </p>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-navy-800 dark:text-navy-200 block mb-1">
                      Selling Price per kWh (ETH) *
                    </label>
                    <Input
                      type="number"
                      step="0.000001"
                      min="0.00001"
                      placeholder="e.g. 0.000085"
                      value={pricePerKwh}
                      onChange={(e) => setPricePerKwh(e.target.value)}
                      error={errors.pricePerKwh}
                      required
                    />
                    <p className="text-[11px] text-navy-400 mt-1">
                      Dynamic grid benchmark: ~0.000088 ETH
                    </p>
                  </div>
                </div>

                {/* 3. Purchase Parameters */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold text-navy-800 dark:text-navy-200 block mb-1">
                      Min Purchase Order (kWh)
                    </label>
                    <Input
                      type="number"
                      step="0.5"
                      min="0.5"
                      value={minPurchaseKwh}
                      onChange={(e) => setMinPurchaseKwh(e.target.value)}
                      error={errors.minPurchaseKwh}
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-navy-800 dark:text-navy-200 block mb-1">
                      Listing Window (Hours)
                    </label>
                    <Select
                      options={[
                        { value: "6", label: "6 Hours (Intraday Peak)" },
                        { value: "12", label: "12 Hours (Half Day)" },
                        { value: "24", label: "24 Hours (Full Cycle)" },
                        { value: "48", label: "48 Hours (Multi-Day)" },
                      ]}
                      value={windowHours}
                      onChange={(e) => setWindowHours(e.target.value)}
                    />
                  </div>
                </div>

                {/* 4. Description & Notes */}
                <div>
                  <label className="text-xs font-bold text-navy-800 dark:text-navy-200 block mb-1">
                    Facility Notes & Microgrid Sector (Optional)
                  </label>
                  <Input
                    placeholder="e.g. Microgrid Alpha Sector 1 - Rooftop high-efficiency array"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                  />
                </div>

                {/* Submit Action */}
                <div className="flex items-center justify-end gap-3 pt-4 border-t border-navy-100 dark:border-navy-800">
                  <Button
                    variant="secondary"
                    type="button"
                    onClick={() => router.push("/producer/listings")}
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="primary"
                    type="submit"
                    loading={loading}
                    icon={CheckCircle2}
                  >
                    Publish Energy Listing
                  </Button>
                </div>
              </form>
            </Card>
          </div>

          {/* Side Summary & Live Projection */}
          <div className="space-y-4">
            <Card className="p-5 border-brand-200 dark:border-brand-900 bg-brand-50/30 dark:bg-brand-950/20">
              <div className="flex items-center gap-2 mb-3">
                <Coins className="w-5 h-5 text-brand-600 dark:text-brand-400" />
                <h3 className="font-bold text-sm text-navy-900 dark:text-white">
                  Listing Projection Summary
                </h3>
              </div>

              <div className="space-y-3 text-xs">
                <div className="flex justify-between py-1.5 border-b border-navy-200/50 dark:border-navy-800">
                  <span className="text-navy-500 dark:text-navy-400">Generation Source:</span>
                  <span className="font-bold text-navy-900 dark:text-white">{energySource}</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-navy-200/50 dark:border-navy-800">
                  <span className="text-navy-500 dark:text-navy-400">Total Capacity:</span>
                  <span className="font-bold text-navy-900 dark:text-white">{totalKwhNum.toLocaleString()} kWh</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-navy-200/50 dark:border-navy-800">
                  <span className="text-navy-500 dark:text-navy-400">Unit Rate:</span>
                  <span className="font-mono font-bold text-navy-900 dark:text-white">{priceNum} ETH</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-navy-200/50 dark:border-navy-800">
                  <span className="text-navy-500 dark:text-navy-400">Est. Carbon Avoidance:</span>
                  <span className="font-bold text-brand-600 dark:text-brand-400">{estimatedCarbonOffsetKg} kg CO2</span>
                </div>
                <div className="flex justify-between pt-2">
                  <span className="font-bold text-navy-700 dark:text-navy-300">Projected Revenue:</span>
                  <span className="font-mono text-sm font-bold text-brand-700 dark:text-brand-300">
                    {projectedGrossRevenueEth} ETH
                  </span>
                </div>
              </div>
            </Card>

            <Card className="p-4 bg-navy-50 dark:bg-navy-900 text-xs text-navy-600 dark:text-navy-400 space-y-2">
              <div className="flex items-center gap-1.5 font-bold text-navy-800 dark:text-navy-200">
                <ShieldCheck className="w-4 h-4 text-brand-500" />
                Decentralized Protocol Guarantees
              </div>
              <p>
                - Capacity is held in non-custodial double-auction escrow.
              </p>
              <p>
                - Automated merit-order allocation executes when consumer demand cycles trigger.
              </p>
              <p>
                - No blockchain gas fee is incurred until settlement is confirmed on-chain.
              </p>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
