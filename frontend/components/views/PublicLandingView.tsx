"use client";

import React from "react";
import Link from "next/link";
import {
  Zap,
  ShieldCheck,
  TrendingUp,
  Sun,
  Wind,
  Droplets,
  Award,
  ArrowRight,
  Activity,
  Users,
  CheckCircle2,
  Sparkles,
  Sliders,
  Scale,
  FileText,
  Lock,
  Layers,
  BarChart3,
  HelpCircle,
  Leaf,
} from "lucide-react";
import { Button } from "../ui/Button";
import { Card, CardHeader, CardTitle, CardContent } from "../ui/Card";
import { StatusBadge } from "../ui/StatusBadge";
import { useApp } from "../common/AppContext";

export const PublicLandingView: React.FC = () => {
  const { setActiveView, setRole } = useApp();

  return (
    <div className="space-y-28 py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      {/* 1. HERO SECTION */}
      <section className="text-center space-y-6 pt-6 sm:pt-14" id="home">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-bold bg-brand-50 dark:bg-brand-950/60 text-brand-700 dark:text-brand-300 border border-brand-200 dark:border-brand-800 shadow-sm animate-in fade-in duration-300">
          <Sparkles className="w-3.5 h-3.5 text-brand-600 dark:text-brand-400" />
          <span>Blockchain-Powered P2P Renewable Energy Exchange • Ethereum Sepolia</span>
        </div>

        <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black text-navy-900 dark:text-white tracking-tight max-w-4xl mx-auto leading-[1.1]">
          Powering a Fairer, <br className="hidden sm:inline" />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-600 via-emerald-500 to-teal-400">
            Greener Energy Future.
          </span>
        </h1>

        <p className="text-base sm:text-lg text-navy-600 dark:text-navy-300 max-w-2xl mx-auto leading-relaxed">
          Trade renewable energy directly, benefit from fair energy allocation and experience transparent peer-to-peer energy trading powered by blockchain technology.
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
          <Link href="/marketplace">
            <Button
              variant="primary"
              size="lg"
              rightIcon={<ArrowRight className="w-5 h-5" />}
            >
              Explore Marketplace
            </Button>
          </Link>

          <Link href="/register">
            <Button
              variant="secondary"
              size="lg"
            >
              Get Started
            </Button>
          </Link>
        </div>

        {/* Hero Visual: Premium Dashboard & Energy Trading Analytics Preview */}
        <div className="pt-10 max-w-5xl mx-auto">
          <div className="rounded-3xl bg-white dark:bg-navy-900 border border-navy-200 dark:border-navy-800 shadow-2xl overflow-hidden p-6 sm:p-8 relative">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-navy-100 dark:border-navy-800 gap-4">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse" />
                <div>
                  <h3 className="text-base font-bold text-navy-900 dark:text-white text-left">
                    Live Microgrid Clearing Depth (Simulated Feed)
                  </h3>
                  <p className="text-xs text-navy-400 text-left">
                    Double auction matching engine active on Ethereum Sepolia
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <StatusBadge status="ACTIVE" label="Microgrid Grid Active" size="sm" />
                <span className="text-xs font-mono px-2 py-1 rounded-md bg-navy-100 dark:bg-navy-800 text-navy-500 dark:text-navy-300">
                  Block #5,839,210
                </span>
              </div>
            </div>

            {/* Grid preview cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6 text-left">
              <div className="p-4 rounded-2xl bg-amber-50/60 dark:bg-amber-950/30 border border-amber-200/60 dark:border-amber-800/40">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-amber-700 dark:text-amber-400 uppercase">Solar Telemetry</span>
                  <Sun className="w-4 h-4 text-amber-500" />
                </div>
                <div className="mt-2 text-2xl font-black text-navy-900 dark:text-white">150.0 kWh</div>
                <p className="text-xs text-navy-500 mt-1">Spot Ask: 0.000088 ETH/kWh</p>
              </div>

              <div className="p-4 rounded-2xl bg-sky-50/60 dark:bg-sky-950/30 border border-sky-200/60 dark:border-sky-800/40">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-sky-700 dark:text-sky-400 uppercase">Wind Telemetry</span>
                  <Wind className="w-4 h-4 text-sky-500" />
                </div>
                <div className="mt-2 text-2xl font-black text-navy-900 dark:text-white">300.0 kWh</div>
                <p className="text-xs text-navy-500 mt-1">Spot Ask: 0.000082 ETH/kWh</p>
              </div>

              <div className="p-4 rounded-2xl bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-200/60 dark:border-emerald-800/40">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400 uppercase">Clearing Rate</span>
                  <Scale className="w-4 h-4 text-brand-600" />
                </div>
                <div className="mt-2 text-2xl font-black text-navy-900 dark:text-white">100% Match</div>
                <p className="text-xs text-navy-500 mt-1">Proportional Allocation Active</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. PLATFORM STATISTICS (CLEARLY LABELED AS SIMULATED DATA) */}
      <section className="space-y-4">
        <div className="flex items-center justify-center gap-2">
          <span className="w-2 h-2 rounded-full bg-amber-500" />
          <span className="text-xs font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/60 px-3 py-1 rounded-full border border-amber-200 dark:border-amber-800">
            Simulated Demonstration Data • Benchmark Research Testbed
          </span>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 pt-2">
          <div className="p-6 rounded-3xl bg-white dark:bg-navy-900 border border-navy-200 dark:border-navy-800 shadow-card text-center">
            <span className="text-3xl sm:text-4xl font-black text-navy-900 dark:text-white">48,500</span>
            <span className="text-sm font-semibold text-navy-400 ml-1">kWh</span>
            <p className="text-xs text-navy-500 font-bold uppercase tracking-wider mt-1.5">Total Energy Traded</p>
            <span className="text-[10px] text-amber-600 dark:text-amber-400 font-medium">[Simulated]</span>
          </div>

          <div className="p-6 rounded-3xl bg-white dark:bg-navy-900 border border-navy-200 dark:border-navy-800 shadow-card text-center">
            <span className="text-3xl sm:text-4xl font-black text-navy-900 dark:text-white">18</span>
            <span className="text-sm font-semibold text-navy-400 ml-1">Microgrids</span>
            <p className="text-xs text-navy-500 font-bold uppercase tracking-wider mt-1.5">Active Producers</p>
            <span className="text-[10px] text-amber-600 dark:text-amber-400 font-medium">[Simulated]</span>
          </div>

          <div className="p-6 rounded-3xl bg-white dark:bg-navy-900 border border-navy-200 dark:border-navy-800 shadow-card text-center">
            <span className="text-3xl sm:text-4xl font-black text-brand-600 dark:text-brand-400">142</span>
            <span className="text-sm font-semibold text-navy-400 ml-1">Loads</span>
            <p className="text-xs text-navy-500 font-bold uppercase tracking-wider mt-1.5">Active Consumers</p>
            <span className="text-[10px] text-amber-600 dark:text-amber-400 font-medium">[Simulated]</span>
          </div>

          <div className="p-6 rounded-3xl bg-white dark:bg-navy-900 border border-navy-200 dark:border-navy-800 shadow-card text-center">
            <span className="text-3xl sm:text-4xl font-black text-navy-900 dark:text-white">34.0</span>
            <span className="text-sm font-semibold text-navy-400 ml-1">Tons</span>
            <p className="text-xs text-navy-500 font-bold uppercase tracking-wider mt-1.5">Estimated CO2 Savings</p>
            <span className="text-[10px] text-amber-600 dark:text-amber-400 font-medium">[Simulated]</span>
          </div>
        </div>
      </section>

      {/* 3. HOW GREENLEDGER WORKS (4 STEPS WITH CONNECTORS) */}
      <section className="space-y-12" id="how-it-works">
        <div className="text-center max-w-xl mx-auto space-y-2">
          <span className="text-xs font-bold uppercase tracking-wider text-brand-600 dark:text-brand-400">
            End-to-End Workflow
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-navy-900 dark:text-white tracking-tight">
            How GreenLedger Works
          </h2>
          <p className="text-xs sm:text-sm text-navy-500 dark:text-navy-400">
            A seamless bridge between off-chain physical simulation and on-chain blockchain settlement.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 relative">
          {/* Step 1 */}
          <div className="p-6 rounded-3xl bg-white dark:bg-navy-900 border border-navy-200 dark:border-navy-800 shadow-card space-y-4 text-center relative group hover:border-brand-500 transition">
            <div className="w-12 h-12 rounded-2xl bg-amber-50 dark:bg-amber-950/60 text-amber-500 border border-amber-200 dark:border-amber-800 mx-auto flex items-center justify-center font-bold text-lg">
              1
            </div>
            <h3 className="text-base font-bold text-navy-900 dark:text-white">Producers List Energy</h3>
            <p className="text-xs text-navy-500 leading-relaxed">
              Microgrids list surplus solar, wind, and hydro generation with volume (kWh) and floor price (ETH).
            </p>
          </div>

          {/* Step 2 */}
          <div className="p-6 rounded-3xl bg-white dark:bg-navy-900 border border-navy-200 dark:border-navy-800 shadow-card space-y-4 text-center relative group hover:border-brand-500 transition">
            <div className="w-12 h-12 rounded-2xl bg-sky-50 dark:bg-sky-950/60 text-sky-500 border border-sky-200 dark:border-sky-800 mx-auto flex items-center justify-center font-bold text-lg">
              2
            </div>
            <h3 className="text-base font-bold text-navy-900 dark:text-white">Consumers Submit Requests</h3>
            <p className="text-xs text-navy-500 leading-relaxed">
              Buyers specify demand requirements, willingness to pay ceiling, and urgency priority tier (Critical to Standard).
            </p>
          </div>

          {/* Step 3 */}
          <div className="p-6 rounded-3xl bg-white dark:bg-navy-900 border border-navy-200 dark:border-navy-800 shadow-card space-y-4 text-center relative group hover:border-brand-500 transition">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-brand-600 border border-brand-200 dark:border-brand-800 mx-auto flex items-center justify-center font-bold text-lg">
              3
            </div>
            <h3 className="text-base font-bold text-navy-900 dark:text-white">Algorithms Match & Allocate</h3>
            <p className="text-xs text-navy-500 leading-relaxed">
              Greedy double-auction matches orders in merit order, and weighted proportional allocation distributes scarce power.
            </p>
          </div>

          {/* Step 4 */}
          <div className="p-6 rounded-3xl bg-white dark:bg-navy-900 border border-navy-200 dark:border-navy-800 shadow-card space-y-4 text-center relative group hover:border-brand-500 transition">
            <div className="w-12 h-12 rounded-2xl bg-purple-50 dark:bg-purple-950/60 text-purple-500 border border-purple-200 dark:border-purple-800 mx-auto flex items-center justify-center font-bold text-lg">
              4
            </div>
            <h3 className="text-base font-bold text-navy-900 dark:text-white">Blockchain Settles Trades</h3>
            <p className="text-xs text-navy-500 leading-relaxed">
              Trade hashes are anchored to Ethereum Sepolia, releasing payments and minting ERC-721 Green Certificates.
            </p>
          </div>
        </div>
      </section>

      {/* 4. FOUR FEATURE SECTIONS */}
      <section className="space-y-12" id="features">
        <div className="text-center max-w-xl mx-auto space-y-2">
          <span className="text-xs font-bold uppercase tracking-wider text-brand-600 dark:text-brand-400">
            Core Technological Innovations
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-navy-900 dark:text-white tracking-tight">
            Engineered for Energy Freedom
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card hoverable borderAccent="green">
            <CardHeader className="flex-row items-center gap-3 pb-2">
              <div className="p-3 rounded-2xl bg-brand-50 dark:bg-brand-950/60 text-brand-600 border border-brand-200 dark:border-brand-800">
                <Zap className="w-6 h-6" />
              </div>
              <div>
                <CardTitle>1. Decentralized Renewable Energy Trading</CardTitle>
                <span className="text-xs text-navy-400">Peer-to-Peer Direct Exchange</span>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-xs sm:text-sm text-navy-600 dark:text-navy-300 leading-relaxed">
                Empowers local microgrids (solar rooftop owners, wind communities, hydro operators) to bypass monopolistic centralized utility markups. Trades are executed off-chain with merit-order efficiency and settled on-chain.
              </p>
            </CardContent>
          </Card>

          <Card hoverable borderAccent="blue">
            <CardHeader className="flex-row items-center gap-3 pb-2">
              <div className="p-3 rounded-2xl bg-sky-50 dark:bg-sky-950/60 text-sky-500 border border-sky-200 dark:border-sky-800">
                <Sliders className="w-6 h-6" />
              </div>
              <div>
                <CardTitle>2. Demand-Aware Fair Energy Allocation</CardTitle>
                <span className="text-xs text-navy-400">Eliminating Starvation & Monopolization</span>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-xs sm:text-sm text-navy-600 dark:text-navy-300 leading-relaxed">
                When clean energy supply is limited, the protocol replaces unfair first-come-first-served queues with mathematical weighted proportional allocation, ensuring healthcare and critical infrastructure maintain reliable baselines.
              </p>
            </CardContent>
          </Card>

          <Card hoverable borderAccent="amber">
            <CardHeader className="flex-row items-center gap-3 pb-2">
              <div className="p-3 rounded-2xl bg-amber-50 dark:bg-amber-950/60 text-amber-500 border border-amber-200 dark:border-amber-800">
                <TrendingUp className="w-6 h-6" />
              </div>
              <div>
                <CardTitle>3. Rule-Based Dynamic Energy Pricing</CardTitle>
                <span className="text-xs text-navy-400">Deterministic Economic Guardrails</span>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-xs sm:text-sm text-navy-600 dark:text-navy-300 leading-relaxed">
                Uses transparent Time-of-Use (TOU) tariffs and scarcity multipliers instead of unpredictable AI black-boxes. Regulates prices within enforceable floor and ceiling guardrails to protect producers and consumers alike.
              </p>
            </CardContent>
          </Card>

          <Card hoverable borderAccent="purple">
            <CardHeader className="flex-row items-center gap-3 pb-2">
              <div className="p-3 rounded-2xl bg-purple-50 dark:bg-purple-950/60 text-purple-500 border border-purple-200 dark:border-purple-800">
                <Award className="w-6 h-6" />
              </div>
              <div>
                <CardTitle>4. Blockchain Green Certificates (REC)</CardTitle>
                <span className="text-xs text-navy-400">ERC-721 Non-Fungible Tokens</span>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-xs sm:text-sm text-navy-600 dark:text-navy-300 leading-relaxed">
                Every settled kilowatt-hour mints a tamper-proof ERC-721 Renewable Energy Certificate on Ethereum Sepolia. Contains generation timestamp, producer address, source type, and calculated carbon offset in grams.
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* 5. FAIR ALLOCATION RESEARCH HIGHLIGHT (CORE RESEARCH CONTRIBUTION) */}
      <section className="space-y-8 p-8 sm:p-12 rounded-3xl bg-gradient-to-br from-emerald-950/20 via-slate-900/10 to-brand-950/30 border border-emerald-800/40" id="fair-allocation">
        <div className="text-center max-w-2xl mx-auto space-y-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-brand-500/10 text-brand-400 border border-brand-500/20">
            <Scale className="w-3.5 h-3.5" /> Research Contribution
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-navy-900 dark:text-white tracking-tight">
            Fair Energy. Transparent Allocation.
          </h2>
          <p className="text-xs sm:text-sm text-navy-500 dark:text-navy-300 leading-relaxed">
            In microgrids during peak evening hours or cloud cover, renewable energy supply is strictly constrained. GreenLedger proves how weighted proportional allocation prevents monopoly starvation.
          </p>
        </div>

        {/* Visual Benchmark Comparison Table */}
        <div className="w-full overflow-hidden rounded-2xl border border-navy-200 dark:border-navy-800 bg-white dark:bg-navy-900 shadow-xl">
          <div className="p-4 bg-navy-50 dark:bg-navy-950/60 border-b border-navy-200 dark:border-navy-800 flex items-center justify-between">
            <span className="text-xs font-bold text-navy-700 dark:text-navy-300 uppercase tracking-wider">
              Allocation Mechanism Comparison (Simulated Benchmark: 150 kWh Supply vs. 230 kWh Demand)
            </span>
            <span className="text-[10px] font-semibold text-amber-500">[Illustrative Benchmark Data]</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm border-collapse">
              <thead>
                <tr className="border-b border-navy-200 dark:border-navy-800 bg-navy-100/50 dark:bg-navy-900/80 text-navy-500 font-bold uppercase text-[11px]">
                  <th className="py-3 px-4">Consumer Tier</th>
                  <th className="py-3 px-4">Requested</th>
                  <th className="py-3 px-4 text-rose-500">First-Come-First-Served (FCFS)</th>
                  <th className="py-3 px-4 text-sky-500">Basic Proportional</th>
                  <th className="py-3 px-4 text-brand-600 font-black">Proposed Weighted Proportional</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-navy-100 dark:divide-navy-800">
                <tr>
                  <td className="py-3.5 px-4 font-bold text-navy-900 dark:text-white">
                    Metro Hospital (Critical Tier, W=2.0)
                  </td>
                  <td className="py-3.5 px-4 font-semibold">80 kWh</td>
                  <td className="py-3.5 px-4 text-rose-500 font-bold">
                    0 kWh <span className="text-[10px] block text-navy-400 font-normal">(Starved if late queue)</span>
                  </td>
                  <td className="py-3.5 px-4 text-sky-500 font-bold">52.17 kWh (65%)</td>
                  <td className="py-3.5 px-4 text-brand-600 font-extrabold bg-brand-50/50 dark:bg-brand-950/30">
                    73.50 kWh (92% Fulfilled) ✓
                  </td>
                </tr>

                <tr>
                  <td className="py-3.5 px-4 font-bold text-navy-900 dark:text-white">
                    Data Center (Commercial Tier, W=1.5)
                  </td>
                  <td className="py-3.5 px-4 font-semibold">100 kWh</td>
                  <td className="py-3.5 px-4 text-rose-500 font-bold">100 kWh (100%)</td>
                  <td className="py-3.5 px-4 text-sky-500 font-bold">65.22 kWh (65%)</td>
                  <td className="py-3.5 px-4 text-brand-600 font-extrabold bg-brand-50/50 dark:bg-brand-950/30">
                    61.25 kWh (61% Fulfilled) ✓
                  </td>
                </tr>

                <tr>
                  <td className="py-3.5 px-4 font-bold text-navy-900 dark:text-white">
                    Residential EcoHub (Standard Tier, W=1.0)
                  </td>
                  <td className="py-3.5 px-4 font-semibold">50 kWh</td>
                  <td className="py-3.5 px-4 text-rose-500 font-bold">50 kWh (100%)</td>
                  <td className="py-3.5 px-4 text-sky-500 font-bold">32.61 kWh (65%)</td>
                  <td className="py-3.5 px-4 text-brand-600 font-extrabold bg-brand-50/50 dark:bg-brand-950/30">
                    15.25 kWh (31% Fulfilled) ✓
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs text-navy-600 dark:text-navy-300 pt-2">
          <div className="p-4 rounded-xl bg-white dark:bg-navy-900 border border-navy-200 dark:border-navy-800">
            <span className="font-bold text-rose-500 block mb-1">❌ FCFS Failure:</span>
            Queue latency dictates survival. If a high-volume non-critical load arrives first, essential hospital lifelines are completely starved.
          </div>
          <div className="p-4 rounded-xl bg-white dark:bg-navy-900 border border-navy-200 dark:border-navy-800">
            <span className="font-bold text-sky-500 block mb-1">⚠️ Basic Proportional Limit:</span>
            Every participant receives an identical percentage cut regardless of medical criticality or social priority.
          </div>
          <div className="p-4 rounded-xl bg-white dark:bg-navy-900 border border-navy-200 dark:border-navy-800">
            <span className="font-bold text-brand-600 block mb-1">✅ GreenLedger Weighted Proportional:</span>
            Scales allocations by both demand volume and priority weights ($W_i \times D_i$), maximizing public welfare while preventing gaming.
          </div>
        </div>
      </section>

      {/* 6. BLOCKCHAIN TRANSPARENCY SECTION */}
      <section className="space-y-8" id="blockchain">
        <div className="text-center max-w-xl mx-auto space-y-2">
          <span className="text-xs font-bold uppercase tracking-wider text-brand-600 dark:text-brand-400">
            Cryptographic Integrity
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-navy-900 dark:text-white tracking-tight">
            Transparent Blockchain Settlement
          </h2>
          <p className="text-xs sm:text-sm text-navy-500 dark:text-navy-400">
            Every traded kilowatt-hour is anchored to the Ethereum Sepolia blockchain with zero counterparty risk.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="p-6 rounded-3xl bg-white dark:bg-navy-900 border border-navy-200 dark:border-navy-800 shadow-card space-y-3">
            <ShieldCheck className="w-8 h-8 text-brand-600" />
            <h3 className="text-base font-bold text-navy-900 dark:text-white">Smart Contract Validation</h3>
            <p className="text-xs text-navy-500 leading-relaxed">
              EnergyTrading.sol executes programmatic checks: participant roles, verified meter hashes, and clearing math before settlement.
            </p>
          </div>

          <div className="p-6 rounded-3xl bg-white dark:bg-navy-900 border border-navy-200 dark:border-navy-800 shadow-card space-y-3">
            <FileText className="w-8 h-8 text-sky-500" />
            <h3 className="text-base font-bold text-navy-900 dark:text-white">Transaction Verification</h3>
            <p className="text-xs text-navy-500 leading-relaxed">
              Trades receive deterministic keccak256 hashes public on Etherscan Sepolia, making duplicate billing cryptographically impossible.
            </p>
          </div>

          <div className="p-6 rounded-3xl bg-white dark:bg-navy-900 border border-navy-200 dark:border-navy-800 shadow-card space-y-3">
            <Award className="w-8 h-8 text-amber-500" />
            <h3 className="text-base font-bold text-navy-900 dark:text-white">Green Certificates (REC)</h3>
            <p className="text-xs text-navy-500 leading-relaxed">
              Minted automatically as ERC-721 NFTs. Contains exact generation timestamp, avoided CO2, and one-click retirement proof.
            </p>
          </div>

          <div className="p-6 rounded-3xl bg-white dark:bg-navy-900 border border-navy-200 dark:border-navy-800 shadow-card space-y-3">
            <Lock className="w-8 h-8 text-purple-500" />
            <h3 className="text-base font-bold text-navy-900 dark:text-white">Non-Custodial Security</h3>
            <p className="text-xs text-navy-500 leading-relaxed">
              GreenLedger never stores private keys or seed phrases. Users authenticate with MetaMask via standard EIP-712 / personal_sign.
            </p>
          </div>
        </div>
      </section>

      {/* 7. CARBON IMPACT SECTION */}
      <section className="space-y-8" id="about">
        <div className="text-center max-w-xl mx-auto space-y-2">
          <span className="text-xs font-bold uppercase tracking-wider text-brand-600 dark:text-brand-400">
            Environmental Accountability
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-navy-900 dark:text-white tracking-tight">
            Verified Carbon Impact Baseline
          </h2>
          <p className="text-xs sm:text-sm text-navy-500 dark:text-navy-400">
            Calculated against regional fossil-grid emission baselines (0.820 kg CO2 / kWh).
          </p>
        </div>

        <div className="p-8 rounded-3xl bg-white dark:bg-navy-900 border border-navy-200 dark:border-navy-800 shadow-card">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center divide-y md:divide-y-0 md:divide-x divide-navy-100 dark:divide-navy-800">
            <div className="pt-4 md:pt-0">
              <Leaf className="w-8 h-8 text-brand-600 mx-auto mb-2" />
              <span className="text-3xl font-extrabold text-navy-900 dark:text-white">34,030 kg</span>
              <p className="text-xs text-navy-500 font-semibold mt-1">Estimated Avoided Greenhouse Gases</p>
              <span className="text-[10px] text-amber-500 font-medium">[Simulated Demonstration Data]</span>
            </div>

            <div className="pt-6 md:pt-0 md:pl-6">
              <Sun className="w-8 h-8 text-amber-500 mx-auto mb-2" />
              <span className="text-3xl font-extrabold text-navy-900 dark:text-white">1,563 Trees</span>
              <p className="text-xs text-navy-500 font-semibold mt-1">Mature Tree Absorption Equivalent (1 Year)</p>
              <span className="text-[10px] text-amber-500 font-medium">[Simulated Demonstration Data]</span>
            </div>

            <div className="pt-6 md:pt-0 md:pl-6">
              <Award className="w-8 h-8 text-sky-500 mx-auto mb-2" />
              <span className="text-3xl font-extrabold text-navy-900 dark:text-white">128 Tokens</span>
              <p className="text-xs text-navy-500 font-semibold mt-1">Verified ERC-721 G-REC Certificates</p>
              <span className="text-[10px] text-amber-500 font-medium">[Simulated Demonstration Data]</span>
            </div>
          </div>
        </div>
      </section>

      {/* 8. CALL TO ACTION */}
      <section className="text-center p-10 sm:p-16 rounded-3xl bg-gradient-to-r from-brand-900 via-brand-800 to-navy-950 text-white relative overflow-hidden shadow-2xl">
        <div className="max-w-2xl mx-auto space-y-6 relative z-10">
          <h2 className="text-3xl sm:text-5xl font-black tracking-tight">
            Be Part of the Renewable Energy Revolution.
          </h2>
          <p className="text-sm sm:text-base text-brand-100/90 leading-relaxed">
            Whether you operate an interconnected solar array or want guaranteed green power for your commercial facility, join GreenLedger today.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
            <Link href="/register?role=PRODUCER">
              <Button
                variant="primary"
                size="lg"
                className="bg-white text-brand-900 hover:bg-brand-50 hover:text-brand-950 font-bold"
              >
                Join as Producer
              </Button>
            </Link>

            <Link href="/register?role=CONSUMER">
              <Button
                variant="outline"
                size="lg"
                className="text-white border-white hover:bg-white/10"
              >
                Join as Consumer
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};
