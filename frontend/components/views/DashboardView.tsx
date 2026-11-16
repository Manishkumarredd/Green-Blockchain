"use client";

import React, { useState } from "react";
import {
  Zap,
  TrendingUp,
  Activity,
  Plus,
  ShieldCheck,
  Award,
  Sun,
  Coins,
  ArrowUpRight,
  ExternalLink,
  Repeat,
  Sliders,
  CheckCircle2,
} from "lucide-react";
import { useApp } from "../common/AppContext";
import { PageHeader } from "../ui/PageHeader";
import { StatisticCard } from "../ui/StatisticCard";
import { DataTable, Column } from "../ui/DataTable";
import { StatusBadge } from "../ui/StatusBadge";
import { ChartContainer } from "../ui/ChartContainer";
import { Button } from "../ui/Button";
import { Modal } from "../ui/Modal";
import { ConfirmationDialog } from "../ui/ConfirmationDialog";
import { Input } from "../ui/Input";
import { Select } from "../ui/Select";

export const DashboardView: React.FC = () => {
  const { role, addToast } = useApp();

  // Modal states for interactive demonstration
  const [isListingModalOpen, setIsListingModalOpen] = useState(false);
  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form states
  const [energySource, setEnergySource] = useState("SOLAR");
  const [quantityKwh, setQuantityKwh] = useState("50");
  const [unitPriceEth, setUnitPriceEth] = useState("0.000085");

  // Sample data for Producer
  const sampleListings = [
    { id: 1, source: "SOLAR", quantity: 150.0, available: 150.0, price: "0.00008800 ETH", status: "ACTIVE", window: "8h remaining" },
    { id: 2, source: "WIND", quantity: 300.0, available: 300.0, price: "0.00008200 ETH", status: "ACTIVE", window: "12h remaining" },
    { id: 3, source: "HYDRO", quantity: 100.0, available: 100.0, price: "0.00009400 ETH", status: "ACTIVE", window: "6h remaining" },
  ];

  // Sample data for Settlements
  const sampleSettlements = [
    {
      id: "0x4f87...8192",
      producer: "Helios Solar Park",
      consumer: "Metro Hospital",
      volume: "80.00 kWh",
      totalEth: "0.00704 ETH",
      carbon: "65.6 kg CO2",
      status: "SETTLED",
      txHash: "0x9a8f...8a91",
    },
    {
      id: "0x3c21...47a0",
      producer: "AeroFlow Wind",
      consumer: "EcoCloud Data Center",
      volume: "200.00 kWh",
      totalEth: "0.01640 ETH",
      carbon: "161.8 kg CO2",
      status: "SETTLED",
      txHash: "0x7b12...39e0",
    },
  ];

  const listingColumns: Column<typeof sampleListings[0]>[] = [
    { key: "id", header: "Order ID", render: (r) => <span className="font-mono text-xs font-bold text-navy-900 dark:text-white">#{r.id}</span> },
    {
      key: "source",
      header: "Generation Source",
      render: (r) => <StatusBadge status={r.source} size="sm" />,
    },
    { key: "quantity", header: "Total Capacity", render: (r) => <span className="font-semibold">{r.quantity} kWh</span> },
    { key: "available", header: "Available", render: (r) => <span className="font-semibold text-brand-600 dark:text-brand-400">{r.available} kWh</span> },
    { key: "price", header: "Unit Price", render: (r) => <span className="font-mono text-xs font-semibold">{r.price}</span> },
    { key: "status", header: "Status", render: (r) => <StatusBadge status={r.status} size="sm" /> },
    { key: "window", header: "Window", render: (r) => <span className="text-xs text-navy-400">{r.window}</span> },
  ];

  const settlementColumns: Column<typeof sampleSettlements[0]>[] = [
    {
      key: "id",
      header: "Trade Commitment Hash",
      render: (r) => (
        <span className="font-mono text-xs font-semibold text-brand-600 dark:text-brand-400 hover:underline cursor-pointer">
          {r.id}
        </span>
      ),
    },
    { key: "producer", header: "Producer", render: (r) => <span className="text-xs font-semibold">{r.producer}</span> },
    { key: "consumer", header: "Consumer", render: (r) => <span className="text-xs font-semibold">{r.consumer}</span> },
    { key: "volume", header: "Traded Volume", render: (r) => <span className="font-bold">{r.volume}</span> },
    { key: "totalEth", header: "Gross Value", render: (r) => <span className="font-mono text-xs font-bold">{r.totalEth}</span> },
    { key: "carbon", header: "Avoided CO2", render: (r) => <span className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold">{r.carbon}</span> },
    { key: "status", header: "Settlement", render: (r) => <StatusBadge status={r.status} size="sm" /> },
    {
      key: "txHash",
      header: "Sepolia Tx",
      align: "right",
      render: (r) => (
        <a
          href={`https://sepolia.etherscan.io/tx/${r.txHash}`}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1 text-xs text-navy-500 hover:text-brand-600 font-mono"
        >
          <span>{r.txHash}</span>
          <ExternalLink className="w-3 h-3" />
        </a>
      ),
    },
  ];

  const handleCreateListing = () => {
    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      setIsListingModalOpen(false);
      addToast({
        type: "success",
        title: "Energy Listing Created",
        description: `Listed ${quantityKwh} kWh ${energySource} @ ${unitPriceEth} ETH/kWh.`,
      });
    }, 600);
  };

  const handleRunClearing = () => {
    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      setIsConfirmDialogOpen(false);
      addToast({
        type: "success",
        title: "Clearing Cycle Completed",
        description: "Matched 3 orders with uniform midpoint price 0.000088 ETH.",
      });
    }, 800);
  };

  return (
    <div className="space-y-8">
      {/* Dynamic Header according to active Role */}
      {role === "PRODUCER" && (
        <PageHeader
          title="Producer Microgrid Hub"
          subtitle="Monitor simulated generation telemetry, manage active energy supply listings, and view ETH settlement earnings."
          breadcrumbs={[{ label: "GreenLedger" }, { label: "Producer Portal" }, { label: "Overview" }]}
          actions={
            <Button
              variant="primary"
              size="md"
              leftIcon={<Plus className="w-4 h-4" />}
              onClick={() => setIsListingModalOpen(true)}
            >
              List Renewable Energy
            </Button>
          }
        />
      )}

      {role === "CONSUMER" && (
        <PageHeader
          title="Consumer Energy Hub"
          subtitle="Explore renewable microgrid supply, submit proportional energy demands, and verify ERC-721 REC certificates."
          breadcrumbs={[{ label: "GreenLedger" }, { label: "Consumer Portal" }, { label: "Overview" }]}
          actions={
            <Button
              variant="primary"
              size="md"
              leftIcon={<Zap className="w-4 h-4" />}
              onClick={() => setIsListingModalOpen(true)}
            >
              Submit Energy Demand
            </Button>
          }
        />
      )}

      {role === "ADMIN" && (
        <PageHeader
          title="Platform Operations & Clearing Engine"
          subtitle="Govern Time-of-Use dynamic tariffs, execute batch double-auction clearing cycles, and audit on-chain Sepolia anchors."
          breadcrumbs={[{ label: "GreenLedger" }, { label: "Administrator" }, { label: "System Monitor" }]}
          actions={
            <Button
              variant="primary"
              size="md"
              leftIcon={<Repeat className="w-4 h-4" />}
              onClick={() => setIsConfirmDialogOpen(true)}
            >
              Execute Clearing Cycle
            </Button>
          }
        />
      )}

      {/* 4 Summary Statistic Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {role === "PRODUCER" ? (
          <>
            <StatisticCard
              title="Simulated Output"
              value="142.30"
              unit="kWh"
              change={12.4}
              trend="up"
              timeframe="vs. peak capacity"
              icon={<Sun className="w-5 h-5" />}
            />
            <StatisticCard
              title="Active Listed Power"
              value="150.00"
              unit="kWh"
              change={0}
              trend="neutral"
              timeframe="3 active orders"
              icon={<Zap className="w-5 h-5" />}
            />
            <StatisticCard
              title="Settled Revenue"
              value="1.0625"
              unit="ETH"
              change={18.2}
              trend="up"
              timeframe="last 7 days"
              icon={<Coins className="w-5 h-5 text-amber-500" />}
              iconBgColor="bg-amber-50 dark:bg-amber-950/60 text-amber-500 border border-amber-200 dark:border-amber-800"
            />
            <StatisticCard
              title="Microgrid Reliability"
              value="99.20"
              unit="Score"
              change={0.5}
              trend="up"
              timeframe="METER-PROD-SOL-101"
              icon={<ShieldCheck className="w-5 h-5 text-brand-600" />}
            />
          </>
        ) : role === "CONSUMER" ? (
          <>
            <StatisticCard
              title="Clean Energy Bought"
              value="80.00"
              unit="kWh"
              change={15.0}
              trend="up"
              timeframe="100% fulfill rate"
              icon={<Zap className="w-5 h-5 text-brand-600" />}
            />
            <StatisticCard
              title="Verified CO2 Avoided"
              value="65.60"
              unit="kg CO2"
              change={22.5}
              trend="up"
              timeframe="equiv. 3 mature trees"
              icon={<ShieldCheck className="w-5 h-5 text-emerald-500" />}
              iconBgColor="bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 border border-emerald-200 dark:border-emerald-800"
            />
            <StatisticCard
              title="G-REC Certificates"
              value="12"
              unit="Tokens"
              change={2}
              trend="up"
              timeframe="ERC-721 on Sepolia"
              icon={<Award className="w-5 h-5 text-sky-500" />}
              iconBgColor="bg-sky-50 dark:bg-sky-950/60 text-sky-500 border border-sky-200 dark:border-sky-800"
            />
            <StatisticCard
              title="Weighted Priority"
              value="Tier 1"
              unit="Critical"
              trend="neutral"
              timeframe="Hospital baseline load"
              icon={<Sliders className="w-5 h-5 text-purple-500" />}
              iconBgColor="bg-purple-50 dark:bg-purple-950/60 text-purple-500 border border-purple-200 dark:border-purple-800"
            />
          </>
        ) : (
          <>
            <StatisticCard
              title="Platform Gross Volume"
              value="48,500"
              unit="kWh"
              change={14.2}
              trend="up"
              timeframe="P2P microgrid total"
              icon={<TrendingUp className="w-5 h-5 text-brand-600" />}
            />
            <StatisticCard
              title="Clearing Settlement"
              value="0.000088"
              unit="ETH/kWh"
              change={-4.5}
              trend="down"
              timeframe="Midpoint clearing"
              icon={<Coins className="w-5 h-5 text-amber-500" />}
              iconBgColor="bg-amber-50 dark:bg-amber-950/60 text-amber-500 border border-amber-200 dark:border-amber-800"
            />
            <StatisticCard
              title="CO2 Platform Offset"
              value="34,030"
              unit="kg CO2"
              change={12.0}
              trend="up"
              timeframe="vs 0.82 kg/kWh baseline"
              icon={<ShieldCheck className="w-5 h-5 text-emerald-500" />}
            />
            <StatisticCard
              title="Registered Meters"
              value="7"
              unit="Nodes"
              trend="neutral"
              timeframe="3 Prods • 3 Cons • 1 Adm"
              icon={<Activity className="w-5 h-5 text-purple-500" />}
              iconBgColor="bg-purple-50 dark:bg-purple-950/60 text-purple-500 border border-purple-200 dark:border-purple-800"
            />
          </>
        )}
      </div>

      {/* Main Center Chart and Simulation Visualizer */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <ChartContainer
            title="Clean Generation & Demand Profile"
            subtitle="Real-time physical simulation telemetry curve vs. consumer aggregate demand"
            timeframes={["6H", "12H", "24H", "7D"]}
            height={280}
          >
            {/* Highly visual responsive bar & curve telemetry */}
            <div className="w-full h-full flex flex-col justify-end p-2">
              <div className="flex items-end justify-between h-48 gap-2 sm:gap-3 px-2">
                {[
                  { time: "06:00", solar: 10, wind: 60, demand: 40 },
                  { time: "08:00", solar: 45, wind: 50, demand: 70 },
                  { time: "10:00", solar: 85, wind: 40, demand: 90 },
                  { time: "12:00", solar: 100, wind: 35, demand: 95 },
                  { time: "14:00", solar: 92, wind: 30, demand: 85 },
                  { time: "16:00", solar: 65, wind: 45, demand: 90 },
                  { time: "18:00", solar: 25, wind: 70, demand: 110 },
                  { time: "20:00", solar: 0, wind: 85, demand: 105 },
                ].map((item, idx) => (
                  <div key={idx} className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end group">
                    <div className="w-full flex items-end justify-center gap-1 h-40">
                      {/* Solar Generation */}
                      <div
                        style={{ height: `${item.solar}%` }}
                        className="w-1/3 bg-amber-400 dark:bg-amber-500 rounded-t-md transition-all group-hover:opacity-80"
                        title={`Solar: ${item.solar} kWh`}
                      />
                      {/* Wind Generation */}
                      <div
                        style={{ height: `${item.wind}%` }}
                        className="w-1/3 bg-sky-400 dark:bg-sky-500 rounded-t-md transition-all group-hover:opacity-80"
                        title={`Wind: ${item.wind} kWh`}
                      />
                      {/* Demand */}
                      <div
                        style={{ height: `${item.demand}%` }}
                        className="w-1/3 bg-brand-600 rounded-t-md transition-all group-hover:opacity-80"
                        title={`Demand: ${item.demand} kWh`}
                      />
                    </div>
                    <span className="text-[10px] font-semibold text-navy-400">{item.time}</span>
                  </div>
                ))}
              </div>

              {/* Legend */}
              <div className="mt-4 pt-3 border-t border-navy-100 dark:border-navy-800 flex items-center justify-center gap-6 text-xs text-navy-500 dark:text-navy-400">
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-sm bg-amber-400" /> Solar PV Simulation
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-sm bg-sky-400" /> Wind Turbine Curve
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-sm bg-brand-600" /> Aggregate Consumer Demand
                </span>
              </div>
            </div>
          </ChartContainer>
        </div>

        {/* Dynamic Pricing / TOU Widget */}
        <div className="lg:col-span-1">
          <div className="bg-white dark:bg-navy-900 rounded-2xl p-6 border border-navy-200 dark:border-navy-800 shadow-card flex flex-col justify-between h-full">
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-navy-100 dark:border-navy-800">
                <span className="text-xs uppercase font-bold text-navy-400 tracking-wider">
                  Rule-Based Dynamic Pricing
                </span>
                <StatusBadge status="ACTIVE" label="Normal Hour" size="sm" />
              </div>

              <div className="mt-4 space-y-3">
                <div className="flex items-baseline justify-between">
                  <span className="text-xs text-navy-500">Current Recommended</span>
                  <span className="text-xl font-black text-navy-900 dark:text-white font-mono">
                    0.000088 <span className="text-xs font-semibold text-navy-400">ETH/kWh</span>
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-navy-50 dark:bg-navy-950/60 border border-navy-100 dark:border-navy-800 space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-navy-500">Time-of-Use Multiplier:</span>
                    <span className="font-bold text-navy-800 dark:text-navy-200">1.00× (Shoulder)</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-navy-500">Supply-to-Demand Ratio:</span>
                    <span className="font-bold text-emerald-600 dark:text-emerald-400">1.66× (Surplus)</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-navy-500">Regulatory Floor:</span>
                    <span className="font-mono text-navy-700 dark:text-navy-300">0.000040 ETH</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-navy-500">Regulatory Ceiling:</span>
                    <span className="font-mono text-navy-700 dark:text-navy-300">0.000250 ETH</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-navy-100 dark:border-navy-800">
              <Button
                variant="secondary"
                size="sm"
                fullWidth
                onClick={() => addToast({ type: "info", title: "Price Quotes Updated", description: "Real-time TOU multipliers recalculated." })}
              >
                Recalculate Dynamic Quote
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Active Listings Table */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-navy-900 dark:text-white tracking-tight">
              Active Clean Energy Supply Orders
            </h3>
            <p className="text-xs text-navy-500 dark:text-navy-400">
              Merit-order listed microgrid energy available for matching
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsListingModalOpen(true)}
          >
            + New Order
          </Button>
        </div>

        <DataTable
          columns={listingColumns}
          data={sampleListings}
          onRowClick={(row) => addToast({ type: "info", title: `Listing #${row.id} Selected`, description: `${row.quantity} kWh of ${row.source} power.` })}
        />
      </div>

      {/* Settled On-Chain Transactions Table */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-navy-900 dark:text-white tracking-tight">
              Recent On-Chain Settlement Records
            </h3>
            <p className="text-xs text-navy-500 dark:text-navy-400">
              Cryptographically verified trades anchored to Ethereum Sepolia
            </p>
          </div>
        </div>

        <DataTable
          columns={settlementColumns}
          data={sampleSettlements}
        />
      </div>

      {/* Interactive Create Listing Modal */}
      <Modal
        isOpen={isListingModalOpen}
        onClose={() => setIsListingModalOpen(false)}
        title="List Surplus Renewable Energy"
        description="Submit your verified clean generation capacity into the P2P double auction merit queue."
        footer={
          <>
            <Button variant="secondary" onClick={() => setIsListingModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" isLoading={isSubmitting} onClick={handleCreateListing}>
              Publish Energy Listing
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <Select
            label="Renewable Source"
            value={energySource}
            onChange={(e) => setEnergySource(e.target.value)}
            options={[
              { value: "SOLAR", label: "Solar Photovoltaic (PV)" },
              { value: "WIND", label: "Wind Turbine" },
              { value: "HYDRO", label: "Hydroelectric" },
            ]}
          />

          <Input
            label="Energy Volume (kWh)"
            type="number"
            value={quantityKwh}
            onChange={(e) => setQuantityKwh(e.target.value)}
            helperText="Minimum order lot is 1.0 kWh"
          />

          <Input
            label="Ask Price per kWh (ETH)"
            type="text"
            value={unitPriceEth}
            onChange={(e) => setUnitPriceEth(e.target.value)}
            helperText="Current regional grid baseline: 0.000100 ETH"
          />
        </div>
      </Modal>

      {/* Interactive Confirmation Dialog for Clearing Execution */}
      <ConfirmationDialog
        isOpen={isConfirmDialogOpen}
        onClose={() => setIsConfirmDialogOpen(false)}
        onConfirm={handleRunClearing}
        isLoading={isSubmitting}
        title="Execute Clearing & Allocation Cycle?"
        message="This will greedily match all active bids and asks, compute demand-weighted proportional allocation, calculate carbon savings, and generate on-chain trade hashes for Sepolia settlement."
        confirmText="Execute Batch Clearing"
        type="warning"
      />
    </div>
  );
};
