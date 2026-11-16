"use client";

import React from "react";
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
} from "lucide-react";
import { Button } from "../ui/Button";
import { Card, CardHeader, CardTitle, CardContent } from "../ui/Card";
import { StatusBadge } from "../ui/StatusBadge";
import { useApp } from "../common/AppContext";

export const PublicLandingView: React.FC = () => {
  const { setActiveView, setRole } = useApp();

  return (
    <div className="space-y-24 py-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      {/* Hero Section (Inspired by Image 1 & 2 in user reference) */}
      <section className="text-center space-y-6 pt-6 sm:pt-12">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-bold bg-brand-50 dark:bg-brand-950/60 text-brand-700 dark:text-brand-300 border border-brand-200 dark:border-brand-800 shadow-sm animate-in fade-in duration-300">
          <Sparkles className="w-3.5 h-3.5 text-brand-600 dark:text-brand-400" />
          <span>From Source to Our Systems • Powered by Sepolia</span>
        </div>

        <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black text-navy-900 dark:text-white tracking-tight max-w-4xl mx-auto leading-[1.1]">
          Trade Energy, <br className="hidden sm:inline" />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-600 via-emerald-500 to-teal-400">
            Power Change.
          </span>
        </h1>

        <p className="text-base sm:text-lg text-navy-600 dark:text-navy-300 max-w-2xl mx-auto leading-relaxed">
          Decentralized peer-to-peer renewable energy trading protocol. Buy and sell clean electricity directly with verified microgrids using demand-aware proportional allocation and on-chain REC settlements.
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
          <Button
            variant="primary"
            size="lg"
            rightIcon={<ArrowRight className="w-5 h-5" />}
            onClick={() => {
              setRole("CONSUMER");
              setActiveView("dashboard");
            }}
          >
            Explore Marketplace
          </Button>

          <Button
            variant="secondary"
            size="lg"
            onClick={() => {
              setRole("PRODUCER");
              setActiveView("dashboard");
            }}
          >
            Start Selling Power
          </Button>
        </div>

        {/* Key Platform Numbers (Matching Solvix style from user reference image) */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 pt-12 max-w-4xl mx-auto">
          <div className="p-5 rounded-2xl bg-white dark:bg-navy-900 border border-navy-200 dark:border-navy-800 shadow-card">
            <span className="text-3xl sm:text-4xl font-extrabold text-navy-900 dark:text-white">10k+</span>
            <p className="text-xs text-navy-500 dark:text-navy-400 font-semibold mt-1">Clean Energy Users</p>
          </div>
          <div className="p-5 rounded-2xl bg-white dark:bg-navy-900 border border-navy-200 dark:border-navy-800 shadow-card">
            <span className="text-3xl sm:text-4xl font-extrabold text-navy-900 dark:text-white">100k</span>
            <p className="text-xs text-navy-500 dark:text-navy-400 font-semibold mt-1">Total Distributed kWh</p>
          </div>
          <div className="p-5 rounded-2xl bg-white dark:bg-navy-900 border border-navy-200 dark:border-navy-800 shadow-card">
            <span className="text-3xl sm:text-4xl font-extrabold text-brand-600 dark:text-brand-400">70%</span>
            <p className="text-xs text-navy-500 dark:text-navy-400 font-semibold mt-1">Peak Cost Avoidance</p>
          </div>
          <div className="p-5 rounded-2xl bg-white dark:bg-navy-900 border border-navy-200 dark:border-navy-800 shadow-card">
            <span className="text-3xl sm:text-4xl font-extrabold text-navy-900 dark:text-white">34.0t</span>
            <p className="text-xs text-navy-500 dark:text-navy-400 font-semibold mt-1">Verified CO2 Offset</p>
          </div>
        </div>
      </section>

      {/* Clean Renewable Sources Section */}
      <section className="space-y-8" id="marketplace">
        <div className="text-center max-w-xl mx-auto space-y-2">
          <span className="text-xs font-bold uppercase tracking-wider text-brand-600 dark:text-brand-400">
            Real-Time Microgrid Supply
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-navy-900 dark:text-white tracking-tight">
            Clean, Renewable, Limitless Energy
          </h2>
          <p className="text-xs sm:text-sm text-navy-500 dark:text-navy-400">
            Traded peer-to-peer via double auction merit-order matching.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Solar Card */}
          <Card hoverable borderAccent="amber">
            <CardHeader className="flex-row items-center justify-between pb-2">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-500 border border-amber-200 dark:border-amber-800">
                  <Sun className="w-5 h-5" />
                </div>
                <div>
                  <CardTitle>Solar PV Parks</CardTitle>
                  <span className="text-xs text-navy-400">Helios Array Sector-1</span>
                </div>
              </div>
              <StatusBadge status="SOLAR" />
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-baseline justify-between pt-2 border-t border-navy-100 dark:border-navy-800">
                <span className="text-xs text-navy-500">Available Supply</span>
                <span className="text-lg font-bold text-navy-900 dark:text-white">150.00 kWh</span>
              </div>
              <div className="flex items-baseline justify-between">
                <span className="text-xs text-navy-500">Spot Unit Price</span>
                <span className="text-sm font-semibold text-brand-600 dark:text-brand-400">0.000088 ETH</span>
              </div>
              <div className="flex items-baseline justify-between text-xs text-navy-400">
                <span>Avoided Emission</span>
                <span>0.779 kg CO2/kWh</span>
              </div>
            </CardContent>
          </Card>

          {/* Wind Card */}
          <Card hoverable borderAccent="blue">
            <CardHeader className="flex-row items-center justify-between pb-2">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-sky-50 dark:bg-sky-950/60 text-sky-500 border border-sky-200 dark:border-sky-800">
                  <Wind className="w-5 h-5" />
                </div>
                <div>
                  <CardTitle>Wind Stations</CardTitle>
                  <span className="text-xs text-navy-400">AeroFlow Ridge</span>
                </div>
              </div>
              <StatusBadge status="WIND" />
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-baseline justify-between pt-2 border-t border-navy-100 dark:border-navy-800">
                <span className="text-xs text-navy-500">Available Supply</span>
                <span className="text-lg font-bold text-navy-900 dark:text-white">300.00 kWh</span>
              </div>
              <div className="flex items-baseline justify-between">
                <span className="text-xs text-navy-500">Spot Unit Price</span>
                <span className="text-sm font-semibold text-brand-600 dark:text-brand-400">0.000082 ETH</span>
              </div>
              <div className="flex items-baseline justify-between text-xs text-navy-400">
                <span>Avoided Emission</span>
                <span>0.809 kg CO2/kWh</span>
              </div>
            </CardContent>
          </Card>

          {/* Hydro Card */}
          <Card hoverable borderAccent="green">
            <CardHeader className="flex-row items-center justify-between pb-2">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-cyan-50 dark:bg-cyan-950/60 text-cyan-500 border border-cyan-200 dark:border-cyan-800">
                  <Droplets className="w-5 h-5" />
                </div>
                <div>
                  <CardTitle>Hydroelectric Plant</CardTitle>
                  <span className="text-xs text-navy-400">Cascadia Basinhole</span>
                </div>
              </div>
              <StatusBadge status="HYDRO" />
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-baseline justify-between pt-2 border-t border-navy-100 dark:border-navy-800">
                <span className="text-xs text-navy-500">Available Supply</span>
                <span className="text-lg font-bold text-navy-900 dark:text-white">100.00 kWh</span>
              </div>
              <div className="flex items-baseline justify-between">
                <span className="text-xs text-navy-500">Spot Unit Price</span>
                <span className="text-sm font-semibold text-brand-600 dark:text-brand-400">0.000094 ETH</span>
              </div>
              <div className="flex items-baseline justify-between text-xs text-navy-400">
                <span>Avoided Emission</span>
                <span>0.796 kg CO2/kWh</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Role Feature Showcase */}
      <section className="space-y-8" id="producers">
        <div className="text-center max-w-xl mx-auto space-y-2">
          <span className="text-xs font-bold uppercase tracking-wider text-brand-600 dark:text-brand-400">
            Tailored Portal Experiences
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-navy-900 dark:text-white tracking-tight">
            Designed for Every Energy Participant
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-6 rounded-3xl bg-white dark:bg-navy-900 border border-navy-200 dark:border-navy-800 shadow-card flex flex-col justify-between">
            <div className="space-y-4">
              <span className="inline-flex p-3 rounded-2xl bg-amber-50 dark:bg-amber-950/60 text-amber-500 border border-amber-200 dark:border-amber-800">
                <Sun className="w-6 h-6" />
              </span>
              <h3 className="text-xl font-bold text-navy-900 dark:text-white">Producers & Microgrids</h3>
              <p className="text-xs sm:text-sm text-navy-600 dark:text-navy-300 leading-relaxed">
                List surplus renewable energy, automate generation telemetry via physical simulation, set reserve pricing floors, and earn instant ETH settlement.
              </p>
              <ul className="space-y-2 text-xs text-navy-500 dark:text-navy-400 pt-2">
                <li className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-brand-600" /> Automated generation telemetry feeds</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-brand-600" /> Real-time order book integration</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-brand-600" /> Transparent on-chain payout settlement</li>
              </ul>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="mt-6"
              onClick={() => {
                setRole("PRODUCER");
                setActiveView("dashboard");
              }}
            >
              Enter Producer Hub →
            </Button>
          </div>

          <div className="p-6 rounded-3xl bg-white dark:bg-navy-900 border border-navy-200 dark:border-navy-800 shadow-card flex flex-col justify-between">
            <div className="space-y-4">
              <span className="inline-flex p-3 rounded-2xl bg-sky-50 dark:bg-sky-950/60 text-sky-500 border border-sky-200 dark:border-sky-800">
                <Users className="w-6 h-6" />
              </span>
              <h3 className="text-xl font-bold text-navy-900 dark:text-white">Clean Energy Consumers</h3>
              <p className="text-xs sm:text-sm text-navy-600 dark:text-navy-300 leading-relaxed">
                Submit energy requests with customized willingness to pay, receive guaranteed fair proportional allocation during high demand, and mint verified REC tokens.
              </p>
              <ul className="space-y-2 text-xs text-navy-500 dark:text-navy-400 pt-2">
                <li className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-brand-600" /> Demand-aware weighted allocation</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-brand-600" /> ERC-721 G-REC token verification</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-brand-600" /> Tangible carbon avoided accounting</li>
              </ul>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="mt-6"
              onClick={() => {
                setRole("CONSUMER");
                setActiveView("dashboard");
              }}
            >
              Enter Consumer Hub →
            </Button>
          </div>

          <div className="p-6 rounded-3xl bg-white dark:bg-navy-900 border border-navy-200 dark:border-navy-800 shadow-card flex flex-col justify-between">
            <div className="space-y-4">
              <span className="inline-flex p-3 rounded-2xl bg-purple-50 dark:bg-purple-950/60 text-purple-500 border border-purple-200 dark:border-purple-800">
                <ShieldCheck className="w-6 h-6" />
              </span>
              <h3 className="text-xl font-bold text-navy-900 dark:text-white">Market Administrators</h3>
              <p className="text-xs sm:text-sm text-navy-600 dark:text-navy-300 leading-relaxed">
                Govern Time-of-Use tariff schedules, execute double auction clearing cycles, audit on-chain settlement hashes, and manage platform participant credentials.
              </p>
              <ul className="space-y-2 text-xs text-navy-500 dark:text-navy-400 pt-2">
                <li className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-brand-600" /> Batch clearing cycle orchestrator</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-brand-600" /> TOU tariff multiplier configuration</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-brand-600" /> Sepolia smart contract dispute auditing</li>
              </ul>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="mt-6"
              onClick={() => {
                setRole("ADMIN");
                setActiveView("dashboard");
              }}
            >
              Enter Admin Portal →
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
};
