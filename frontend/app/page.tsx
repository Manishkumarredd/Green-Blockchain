import React from "react";
import { Zap, ShieldCheck, TrendingUp, Sun, Wind, Droplets, Award, Activity, Users, ArrowUpRight } from "lucide-react";

export default function Home() {
  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Header */}
      <header className="flex flex-col md:flex-row items-start md:items-center justify-between pb-8 border-b border-emerald-950/80 gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <Zap className="w-6 h-6" />
            </span>
            <h1 className="text-3xl font-bold tracking-tight text-white">GreenLedger</h1>
          </div>
          <p className="mt-1 text-sm text-zinc-400">
            Decentralized P2P Renewable Energy Trading & Settlement Protocol
          </p>
        </div>

        <div className="flex items-center gap-3">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-emerald-950/60 text-emerald-400 border border-emerald-800/40">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            Ethereum Sepolia Connected
          </span>
          <button className="px-4 py-2 text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-500 rounded-lg shadow-sm transition">
            Connect Wallet
          </button>
        </div>
      </header>

      {/* Platform Metrics */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-8">
        <div className="p-5 rounded-xl bg-zinc-900/60 border border-zinc-800">
          <div className="flex items-center justify-between text-zinc-400">
            <span className="text-xs uppercase font-semibold tracking-wider">Clean Energy Traded</span>
            <Zap className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="mt-2 text-2xl font-bold text-white">48,500 <span className="text-sm font-normal text-zinc-400">kWh</span></div>
          <div className="mt-1 text-xs text-emerald-400 flex items-center gap-1">
            <TrendingUp className="w-3.5 h-3.5" /> +14.2% this week
          </div>
        </div>

        <div className="p-5 rounded-xl bg-zinc-900/60 border border-zinc-800">
          <div className="flex items-center justify-between text-zinc-400">
            <span className="text-xs uppercase font-semibold tracking-wider">CO2 Emissions Avoided</span>
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="mt-2 text-2xl font-bold text-white">34,030 <span className="text-sm font-normal text-zinc-400">kg CO2</span></div>
          <div className="mt-1 text-xs text-zinc-400">Equivalent to 1,563 mature trees</div>
        </div>

        <div className="p-5 rounded-xl bg-zinc-900/60 border border-zinc-800">
          <div className="flex items-center justify-between text-zinc-400">
            <span className="text-xs uppercase font-semibold tracking-wider">Active Microgrid Listings</span>
            <Activity className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="mt-2 text-2xl font-bold text-white">550 <span className="text-sm font-normal text-zinc-400">kWh Available</span></div>
          <div className="mt-1 text-xs text-emerald-400">Solar (150) • Wind (300) • Hydro (100)</div>
        </div>

        <div className="p-5 rounded-xl bg-zinc-900/60 border border-zinc-800">
          <div className="flex items-center justify-between text-zinc-400">
            <span className="text-xs uppercase font-semibold tracking-wider">Verified RECs Issued</span>
            <Award className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="mt-2 text-2xl font-bold text-white">128 <span className="text-sm font-normal text-zinc-400">NFTs</span></div>
          <div className="mt-1 text-xs text-zinc-400">ERC-721 On-Chain Verified</div>
        </div>
      </section>

      {/* Three User Roles Showcase */}
      <section className="mt-12">
        <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
          <Users className="w-5 h-5 text-emerald-400" /> Platform Roles & Architectural Portals
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Producer Card */}
          <div className="p-6 rounded-2xl bg-zinc-900/40 border border-zinc-800 hover:border-emerald-600/40 transition">
            <div className="flex items-center gap-3">
              <span className="p-2.5 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
                <Sun className="w-5 h-5" />
              </span>
              <div>
                <h3 className="text-lg font-semibold text-white">Producer Portal</h3>
                <span className="text-xs text-zinc-400">Solar, Wind & Hydro Microgrids</span>
              </div>
            </div>
            <p className="mt-4 text-sm text-zinc-300">
              List surplus renewable generation, monitor generation telemetry, set price floors, and receive automated on-chain settlements.
            </p>
            <ul className="mt-4 space-y-2 text-xs text-zinc-400">
              <li>✓ Automated generation simulation feed</li>
              <li>✓ Dynamic merit-order listing queue</li>
              <li>✓ Instant ETH settlement payout</li>
            </ul>
          </div>

          {/* Consumer Card */}
          <div className="p-6 rounded-2xl bg-zinc-900/40 border border-zinc-800 hover:border-emerald-600/40 transition">
            <div className="flex items-center gap-3">
              <span className="p-2.5 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
                <Droplets className="w-5 h-5" />
              </span>
              <div>
                <h3 className="text-lg font-semibold text-white">Consumer Portal</h3>
                <span className="text-xs text-zinc-400">Commercial & Residential Loads</span>
              </div>
            </div>
            <p className="mt-4 text-sm text-zinc-300">
              Request clean energy, specify maximum willingness to pay, receive fair proportional allocation, and claim verified REC tokens.
            </p>
            <ul className="mt-4 space-y-2 text-xs text-zinc-400">
              <li>✓ Weighted proportional demand matching</li>
              <li>✓ Verified REC (ERC-721) NFT minting</li>
              <li>✓ Real-time carbon reduction telemetry</li>
            </ul>
          </div>

          {/* Administrator Card */}
          <div className="p-6 rounded-2xl bg-zinc-900/40 border border-zinc-800 hover:border-emerald-600/40 transition">
            <div className="flex items-center gap-3">
              <span className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <ShieldCheck className="w-5 h-5" />
              </span>
              <div>
                <h3 className="text-lg font-semibold text-white">Administrator Portal</h3>
                <span className="text-xs text-zinc-400">System Governor & Auditor</span>
              </div>
            </div>
            <p className="mt-4 text-sm text-zinc-300">
              Govern time-of-use tariff multipliers, execute batch clearing cycles, monitor on-chain transaction anchors, and audit platform state.
            </p>
            <ul className="mt-4 space-y-2 text-xs text-zinc-400">
              <li>✓ Dynamic pricing parameters configuration</li>
              <li>✓ Double-auction matching cycle trigger</li>
              <li>✓ Sepolia transaction & contract audits</li>
            </ul>
          </div>
        </div>
      </section>

      {/* Algorithmic Engine Highlights */}
      <section className="mt-12 p-6 rounded-2xl bg-emerald-950/20 border border-emerald-800/30">
        <h3 className="text-lg font-semibold text-white mb-2">Core Algorithmic Foundations (Phase 1 Baseline)</h3>
        <p className="text-sm text-zinc-300 mb-4">
          GreenLedger replaces speculative machine learning with robust, auditable, and rule-based mathematical models:
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-zinc-300">
          <div className="p-4 rounded-xl bg-zinc-900/60 border border-zinc-800">
            <span className="font-semibold text-emerald-400 block mb-1">1. Demand-Aware Weighted Proportional Allocation</span>
            Guarantees fair distribution among competing consumers when renewable generation is scarce, weighted by critical priority tiers.
          </div>
          <div className="p-4 rounded-xl bg-zinc-900/60 border border-zinc-800">
            <span className="font-semibold text-emerald-400 block mb-1">2. Price-Aware Greedy Merit-Order Matching</span>
            Orders sellers by cheapest kWh and buyers by highest bid to maximize market surplus and compute fair midpoint clearing prices.
          </div>
          <div className="p-4 rounded-xl bg-zinc-900/60 border border-zinc-800">
            <span className="font-semibold text-emerald-400 block mb-1">3. Rule-Based Dynamic Energy Pricing</span>
            Enforces Time-of-Use schedules, supply-demand balance ratios, and price safety bands without unpredictable AI black-boxes.
          </div>
          <div className="p-4 rounded-xl bg-zinc-900/60 border border-zinc-800">
            <span className="font-semibold text-emerald-400 block mb-1">4. On-Chain Sepolia Settlement & REC Issuance</span>
            Anchors immutable trade hashes to Ethereum Sepolia and issues ERC-721 Renewable Energy Certificates for carbon accounting.
          </div>
        </div>
      </section>
    </main>
  );
}
