"use client";

import React, { useState } from "react";
import {
  Zap,
  Sun,
  Wind,
  Droplets,
  Coins,
  ShieldCheck,
  Award,
  AlertTriangle,
  Mail,
  Lock,
  Plus,
  RefreshCw,
} from "lucide-react";
import { Button } from "../ui/Button";
import { Input } from "../ui/Input";
import { Select } from "../ui/Select";
import { Textarea } from "../ui/Textarea";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "../ui/Card";
import { StatisticCard } from "../ui/StatisticCard";
import { StatusBadge } from "../ui/StatusBadge";
import { SearchBar } from "../ui/SearchBar";
import { FilterDropdown } from "../ui/FilterDropdown";
import { Pagination } from "../ui/Pagination";
import { Modal } from "../ui/Modal";
import { ConfirmationDialog } from "../ui/ConfirmationDialog";
import { LoadingSkeleton, Skeleton, SkeletonCard, SkeletonTable } from "../ui/LoadingSkeleton";
import { EmptyState } from "../ui/EmptyState";
import { ErrorState } from "../ui/ErrorState";
import { ChartContainer } from "../ui/ChartContainer";
import { Logo } from "../ui/Logo";
import { useApp } from "../common/AppContext";

export const ShowroomView: React.FC = () => {
  const { addToast } = useApp();

  // Component state playgrounds
  const [modalOpen, setModalOpen] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [searchValue, setSearchValue] = useState("");
  const [filterValues, setFilterValues] = useState<string[]>(["SOLAR"]);
  const [currentPage, setCurrentPage] = useState(1);
  const [textValue, setTextValue] = useState("");

  return (
    <div className="space-y-16 pb-16">
      {/* Showroom Header */}
      <div className="pb-6 border-b border-navy-200 dark:border-navy-800">
        <span className="text-xs font-bold uppercase tracking-wider text-brand-600 dark:text-brand-400">
          Design System & UI Library
        </span>
        <h1 className="text-3xl font-black text-navy-900 dark:text-white tracking-tight mt-1">
          GreenLedger Component Showroom
        </h1>
        <p className="mt-1 text-sm text-navy-500 dark:text-navy-400">
          Interactive gallery of all 22 reusable components designed for fintech, Web3, and renewable energy SaaS.
        </p>
      </div>

      {/* 1. Brand & Logo Variants */}
      <section className="space-y-4">
        <h2 className="text-lg font-bold text-navy-900 dark:text-white">1. Brand Identity & Logo Variants</h2>
        <div className="p-6 rounded-2xl bg-white dark:bg-navy-900 border border-navy-200 dark:border-navy-800 shadow-card flex flex-wrap items-center gap-10">
          <Logo size="sm" />
          <Logo size="md" />
          <Logo size="lg" showTagline />
          <Logo size="md" variant="icon" />
        </div>
      </section>

      {/* 2. Buttons */}
      <section className="space-y-4">
        <h2 className="text-lg font-bold text-navy-900 dark:text-white">2. Button Component (Variants & States)</h2>
        <div className="p-6 rounded-2xl bg-white dark:bg-navy-900 border border-navy-200 dark:border-navy-800 shadow-card space-y-6">
          <div className="flex flex-wrap items-center gap-4">
            <Button variant="primary">Primary Action</Button>
            <Button variant="secondary">Secondary Action</Button>
            <Button variant="outline">Outline Action</Button>
            <Button variant="ghost">Ghost Action</Button>
            <Button variant="danger">Danger Action</Button>
          </div>

          <div className="flex flex-wrap items-center gap-4 pt-4 border-t border-navy-100 dark:border-navy-800">
            <Button size="sm">Small (sm)</Button>
            <Button size="md">Medium (md)</Button>
            <Button size="lg">Large (lg)</Button>
            <Button variant="primary" leftIcon={<Zap className="w-4 h-4" />}>
              With Left Icon
            </Button>
            <Button variant="primary" isLoading loadingText="Settling on Chain...">
              Submit
            </Button>
            <Button variant="secondary" disabled>
              Disabled State
            </Button>
          </div>
        </div>
      </section>

      {/* 3. Form Controls (Input, Select, Textarea) */}
      <section className="space-y-4">
        <h2 className="text-lg font-bold text-navy-900 dark:text-white">3. Form Controls (Input, Select, Textarea)</h2>
        <div className="p-6 rounded-2xl bg-white dark:bg-navy-900 border border-navy-200 dark:border-navy-800 shadow-card grid grid-cols-1 md:grid-cols-3 gap-6">
          <Input
            label="Email Address"
            placeholder="producer@greenledger.io"
            startIcon={<Mail className="w-4 h-4" />}
            helperText="We will never share your email."
          />

          <Input
            label="Wallet Password"
            type="password"
            placeholder="••••••••••••"
            startIcon={<Lock className="w-4 h-4" />}
            error="Password must be at least 8 characters."
          />

          <Select
            label="Generation Source"
            options={[
              { value: "SOLAR", label: "Solar Photovoltaic" },
              { value: "WIND", label: "Wind Turbine" },
              { value: "HYDRO", label: "Hydroelectric" },
            ]}
          />

          <div className="md:col-span-3">
            <Textarea
              label="Energy Purchase Note"
              placeholder="Specify microgrid interconnect preferences or delivery urgency..."
              showCount
              maxLength={200}
              value={textValue}
              onChange={(e) => setTextValue(e.target.value)}
            />
          </div>
        </div>
      </section>

      {/* 4. Search Bar & Filter Dropdown */}
      <section className="space-y-4">
        <h2 className="text-lg font-bold text-navy-900 dark:text-white">4. Search Bar & Filter Dropdown</h2>
        <div className="p-6 rounded-2xl bg-white dark:bg-navy-900 border border-navy-200 dark:border-navy-800 shadow-card flex flex-col sm:flex-row items-center gap-4">
          <SearchBar
            value={searchValue}
            onChange={setSearchValue}
            placeholder="Search microgrids, trades, tokens..."
          />
          <FilterDropdown
            label="Energy Source"
            options={[
              { value: "SOLAR", label: "Solar PV" },
              { value: "WIND", label: "Wind Turbine" },
              { value: "HYDRO", label: "Hydroelectric" },
            ]}
            selectedValues={filterValues}
            onChange={setFilterValues}
          />
        </div>
      </section>

      {/* 5. Status Badges */}
      <section className="space-y-4">
        <h2 className="text-lg font-bold text-navy-900 dark:text-white">5. Status Badges (Domain States)</h2>
        <div className="p-6 rounded-2xl bg-white dark:bg-navy-900 border border-navy-200 dark:border-navy-800 shadow-card flex flex-wrap items-center gap-3">
          <StatusBadge status="ACTIVE" />
          <StatusBadge status="SETTLED" />
          <StatusBadge status="PENDING" />
          <StatusBadge status="FAILED" />
          <StatusBadge status="CRITICAL" />
          <StatusBadge status="COMMERCIAL" />
          <StatusBadge status="STANDARD" />
          <StatusBadge status="SOLAR" />
          <StatusBadge status="WIND" />
          <StatusBadge status="HYDRO" />
        </div>
      </section>

      {/* 6. Statistic Cards */}
      <section className="space-y-4">
        <h2 className="text-lg font-bold text-navy-900 dark:text-white">6. Statistic Cards (Financial & Energy Metrics)</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <StatisticCard
            title="Clean Power Volume"
            value="142.30"
            unit="kWh"
            change={12.4}
            trend="up"
            icon={<Zap className="w-5 h-5 text-brand-600" />}
          />
          <StatisticCard
            title="Spot Unit Price"
            value="0.000088"
            unit="ETH"
            change={-3.2}
            trend="down"
            icon={<Coins className="w-5 h-5 text-amber-500" />}
            iconBgColor="bg-amber-50 dark:bg-amber-950/60 border-amber-200 dark:border-amber-800"
          />
          <StatisticCard
            title="Avoided CO2 Emissions"
            value="65.60"
            unit="kg CO2"
            change={24.0}
            trend="up"
            icon={<ShieldCheck className="w-5 h-5 text-emerald-500" />}
          />
        </div>
      </section>

      {/* 7. Cards with Accent Borders */}
      <section className="space-y-4">
        <h2 className="text-lg font-bold text-navy-900 dark:text-white">7. Cards with Accent Borders</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <Card hoverable borderAccent="green">
            <CardHeader>
              <CardTitle>Solar Node Alpha</CardTitle>
              <CardDescription>250 kW Rated Photovoltaic Array</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-navy-500">Peak daylight production logged with 99.2% reliability rating.</p>
            </CardContent>
            <CardFooter>
              <span>Substation Sector 1</span>
              <span className="font-bold text-brand-600">Active</span>
            </CardFooter>
          </Card>

          <Card hoverable borderAccent="blue">
            <CardHeader>
              <CardTitle>Wind Ridge Beta</CardTitle>
              <CardDescription>500 kW Wind Turbine Array</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-navy-500">Nocturnal high wind output with 0.809 kg CO2/kWh offset.</p>
            </CardContent>
            <CardFooter>
              <span>Substation Sector 4</span>
              <span className="font-bold text-sky-600">Active</span>
            </CardFooter>
          </Card>

          <Card hoverable borderAccent="amber">
            <CardHeader>
              <CardTitle>Demand Allocation Pool</CardTitle>
              <CardDescription>Weighted Proportional Engine</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-navy-500">Critical commercial and standard consumers balanced proportionally.</p>
            </CardContent>
            <CardFooter>
              <span>Cycle #1001</span>
              <span className="font-bold text-amber-600">Clearing</span>
            </CardFooter>
          </Card>
        </div>
      </section>

      {/* 8. Interactive Modals, Dialogs, and Toasts */}
      <section className="space-y-4">
        <h2 className="text-lg font-bold text-navy-900 dark:text-white">8. Overlays: Modal, Dialog & Toast Notifications</h2>
        <div className="p-6 rounded-2xl bg-white dark:bg-navy-900 border border-navy-200 dark:border-navy-800 shadow-card flex flex-wrap items-center gap-4">
          <Button variant="secondary" onClick={() => setModalOpen(true)}>
            Open Sample Modal
          </Button>

          <Button variant="secondary" onClick={() => setDialogOpen(true)}>
            Open Confirmation Dialog
          </Button>

          <Button
            variant="outline"
            onClick={() =>
              addToast({
                type: "success",
                title: "Trade Settled On-Chain",
                description: "Tx Hash 0x9a8f...8a91 confirmed on Sepolia Block #5839210",
              })
            }
          >
            Trigger Success Toast
          </Button>

          <Button
            variant="outline"
            onClick={() =>
              addToast({
                type: "error",
                title: "Transaction Failed",
                description: "Insufficient gas or bid price lower than reserve ask.",
              })
            }
          >
            Trigger Error Toast
          </Button>
        </div>
      </section>

      {/* 9. Feedback & Skeleton States */}
      <section className="space-y-4">
        <h2 className="text-lg font-bold text-navy-900 dark:text-white">9. Feedback, Empty & Skeleton States</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <EmptyState
            title="No Energy Listings Found"
            description="There are currently no active energy supply orders matching your search filters."
            actionLabel="Post New Supply"
            onAction={() => addToast({ type: "info", title: "Action Clicked", description: "Navigating to order creation form." })}
          />

          <ErrorState
            title="Failed to Reach Sepolia Node"
            message="The RPC endpoint timed out while querying contract events. Check your network or Infura/Alchemy credentials."
            onRetry={() => addToast({ type: "info", title: "Retrying RPC Query", description: "Connecting to fallback RPC endpoint..." })}
          />
        </div>

        <div className="mt-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-navy-400 mb-3">
            Loading Skeleton Previews
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </div>
        </div>
      </section>

      {/* 10. Pagination */}
      <section className="space-y-4">
        <h2 className="text-lg font-bold text-navy-900 dark:text-white">10. Pagination Component</h2>
        <div className="p-6 rounded-2xl bg-white dark:bg-navy-900 border border-navy-200 dark:border-navy-800 shadow-card">
          <Pagination
            currentPage={currentPage}
            totalPages={8}
            onPageChange={setCurrentPage}
            totalItems={78}
            pageSize={10}
          />
        </div>
      </section>

      {/* Sample Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Interactive Component Modal"
        description="This modal supports keyboard ESC closing, backdrop blur, and accessible focus management."
        footer={
          <Button variant="primary" onClick={() => setModalOpen(false)}>
            Close Modal
          </Button>
        }
      >
        <p className="text-sm text-navy-600 dark:text-navy-300 leading-relaxed">
          GreenLedger modals feature smooth CSS transitions, responsive sizing from small to extra-large, and scrollable body areas to accommodate forms or data views.
        </p>
      </Modal>

      {/* Sample Confirmation Dialog */}
      <ConfirmationDialog
        isOpen={dialogOpen}
        onClose={() => setDialogOpen(false)}
        onConfirm={() => {
          setDialogOpen(false);
          addToast({ type: "success", title: "Action Confirmed", description: "Operation successfully executed." });
        }}
        title="Confirm Irreversible Settlement?"
        message="Are you sure you want to retire this ERC-721 Renewable Energy Certificate? Once retired, the carbon offset cannot be transferred."
        confirmText="Retire Certificate"
        type="danger"
      />
    </div>
  );
};
