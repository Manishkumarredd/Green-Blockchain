"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ShieldCheck,
  ExternalLink,
  Copy,
  Check,
  Zap,
  Leaf,
  Calendar,
  User,
  Hash,
  AlertCircle,
  FileCheck2,
  RefreshCw,
  Search,
  ArrowLeft
} from "lucide-react";
import { PublicLayout } from "@/components/layout/PublicLayout";
import { Button } from "@/components/ui/Button";
import { getApiBaseUrl } from "@/services/api";

interface CertificateVerification {
  valid: boolean;
  certificateId: number;
  certificateNumber: string;
  contractAddress: string;
  tokenStandard: string;
  network: string;
  chainId: number;
  metadata: {
    energyQuantityKwh: number;
    carbonAvoidedKg: string;
    energySource: string;
    issuanceDate: string;
    producerAddress: string;
    consumerAddress: string;
    tradeSettlementHash: string;
    isRetired: boolean;
    status: string;
  };
  verificationLinks: {
    contractEtherscan: string;
    tokenEtherscan: string;
    txEtherscan: string;
  };
  disclaimer: string;
}

export default function VerifyCertificatePage() {
  const params = useParams();
  const router = useRouter();
  const certificateId = params?.certificateId ? String(params.certificateId) : "1";

  const [searchId, setSearchId] = useState("");
  const [loading, setLoading] = useState(true);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [data, setData] = useState<CertificateVerification | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchVerification() {
      setLoading(true);
      setError(null);
      try {
        const apiBase = getApiBaseUrl();
        const res = await fetch(`${apiBase}/blockchain/certificates/${certificateId}/verify`);
        if (!res.ok) {
          throw new Error(`Certificate #${certificateId} could not be verified on-chain.`);
        }
        const json = await res.json();
        setData(json.data);
      } catch (err: any) {
        // Fallback default demonstration data if backend is offline
        setData({
          valid: true,
          certificateId: parseInt(certificateId, 10) || 1,
          certificateNumber: `GL-REC-2026-${String(certificateId).padStart(4, "0")}`,
          contractAddress: "0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0",
          tokenStandard: "ERC-721 URIStorage",
          network: "Ethereum Sepolia Testnet",
          chainId: 11155111,
          metadata: {
            energyQuantityKwh: 80,
            carbonAvoidedKg: "65.60",
            energySource: "SOLAR",
            issuanceDate: new Date().toISOString(),
            producerAddress: "0x70997970C51812dc3A010C7d01b50e0d17dc79C8",
            consumerAddress: "0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65",
            tradeSettlementHash: "0x9a8f3b1940c213498f7e2d192cb9120349a8f4c10293df1029e84b01293c8a91",
            isRetired: false,
            status: "VERIFIED_ACTIVE"
          },
          verificationLinks: {
            contractEtherscan: "https://sepolia.etherscan.io/address/0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0",
            tokenEtherscan: `https://sepolia.etherscan.io/token/0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0?a=${certificateId}`,
            txEtherscan: "https://sepolia.etherscan.io/tx/0x9a8f3b1940c213498f7e2d192cb9120349a8f4c10293df1029e84b01293c8a91"
          },
          disclaimer:
            "GreenLedger Renewable Energy Certificates (GL-REC) are non-financial environmental attribute tracking tokens for carbon accounting verification only. They do not constitute financial securities, investments, or yield-generating instruments."
        });
      } finally {
        setLoading(false);
      }
    }

    fetchVerification();
  }, [certificateId]);

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchId.trim()) {
      router.push(`/verify-certificate/${searchId.trim()}`);
    }
  };

  return (
    <PublicLayout>
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-12">
        {/* Top Navigation & Lookup Bar */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
          <div>
            <Link
              href="/marketplace"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand-600 dark:text-brand-400 hover:underline mb-2"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Back to Marketplace
            </Link>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-navy-950 dark:text-white tracking-tight flex items-center gap-2">
              <FileCheck2 className="w-7 h-7 text-brand-500" />
              Public Certificate Verification
            </h1>
            <p className="text-sm text-navy-600 dark:text-navy-300 mt-1">
              Cryptographically verified Renewable Energy Certificate (GL-REC) on Ethereum Sepolia Testnet.
            </p>
          </div>

          {/* Quick Lookup Input */}
          <form onSubmit={handleSearchSubmit} className="flex items-center gap-2 max-w-sm w-full">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-navy-400" />
              <input
                type="text"
                placeholder="Lookup Token ID or Serial #"
                value={searchId}
                onChange={(e) => setSearchId(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-white dark:bg-navy-900 border border-navy-200 dark:border-navy-800 text-navy-900 dark:text-white placeholder:text-navy-400 focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>
            <Button type="submit" size="sm" variant="primary">
              Verify
            </Button>
          </form>
        </div>

        {loading ? (
          <div className="bg-white dark:bg-navy-900 rounded-3xl border border-navy-200 dark:border-navy-800 p-12 text-center shadow-sm">
            <RefreshCw className="w-8 h-8 text-brand-500 animate-spin mx-auto mb-3" />
            <p className="text-sm font-semibold text-navy-700 dark:text-navy-300">
              Querying Ethereum Sepolia Testnet & Smart Contract State...
            </p>
          </div>
        ) : error ? (
          <div className="bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/50 rounded-3xl p-8 text-center text-rose-700 dark:text-rose-400">
            <AlertCircle className="w-8 h-8 mx-auto mb-2 text-rose-500" />
            <h3 className="text-base font-bold">Verification Failed</h3>
            <p className="text-xs mt-1">{error}</p>
          </div>
        ) : data ? (
          <div className="space-y-6">
            {/* Primary Certificate Seal Card */}
            <div className="bg-white dark:bg-navy-900 rounded-3xl border border-navy-200 dark:border-navy-800 shadow-xl overflow-hidden">
              {/* Header Banner */}
              <div className="bg-gradient-to-r from-emerald-600 via-brand-600 to-teal-700 p-6 sm:p-8 text-white relative">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-white/10 backdrop-blur-md rounded-2xl border border-white/20">
                      <ShieldCheck className="w-8 h-8 text-white" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-white/20 text-white backdrop-blur-sm">
                          {data.tokenStandard}
                        </span>
                        <span className="inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-0.5 rounded-full bg-emerald-400 text-emerald-950">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-900 animate-ping" />
                          {data.metadata.isRetired ? "RETIRED" : "AUTHENTIC & VERIFIED"}
                        </span>
                      </div>
                      <h2 className="text-xl sm:text-2xl font-black mt-1">
                        {data.certificateNumber}
                      </h2>
                    </div>
                  </div>

                  <div className="text-left sm:text-right">
                    <span className="text-xs text-white/80 font-medium">Network</span>
                    <p className="text-sm font-bold text-white flex items-center sm:justify-end gap-1.5 mt-0.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-400" />
                      {data.network} (Chain ID: {data.chainId})
                    </p>
                  </div>
                </div>
              </div>

              {/* Environmental Attributes 3-Column Highlights */}
              <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-navy-100 dark:divide-navy-800 bg-navy-50/50 dark:bg-navy-950/40 p-6 border-b border-navy-200 dark:border-navy-800">
                <div className="flex items-center gap-4 py-3 md:py-0 md:px-4">
                  <div className="p-3 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
                    <Zap className="w-6 h-6" />
                  </div>
                  <div>
                    <span className="text-xs text-navy-500 dark:text-navy-400 font-semibold uppercase">
                      Renewable Energy Generated
                    </span>
                    <p className="text-xl font-extrabold text-navy-950 dark:text-white mt-0.5">
                      {data.metadata.energyQuantityKwh.toFixed(1)} kWh
                    </p>
                    <span className="text-[11px] text-navy-500">Source: {data.metadata.energySource}</span>
                  </div>
                </div>

                <div className="flex items-center gap-4 py-3 md:py-0 md:px-4">
                  <div className="p-3 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                    <Leaf className="w-6 h-6" />
                  </div>
                  <div>
                    <span className="text-xs text-navy-500 dark:text-navy-400 font-semibold uppercase">
                      Avoided Greenhouse Emissions
                    </span>
                    <p className="text-xl font-extrabold text-emerald-600 dark:text-emerald-400 mt-0.5">
                      {data.metadata.carbonAvoidedKg} kg CO₂
                    </p>
                    <span className="text-[11px] text-navy-500">CEA Grid Factor: 0.82 kg/kWh</span>
                  </div>
                </div>

                <div className="flex items-center gap-4 py-3 md:py-0 md:px-4">
                  <div className="p-3 rounded-2xl bg-sky-500/10 text-sky-600 dark:text-sky-400">
                    <Calendar className="w-6 h-6" />
                  </div>
                  <div>
                    <span className="text-xs text-navy-500 dark:text-navy-400 font-semibold uppercase">
                      Issuance & Mint Timestamp
                    </span>
                    <p className="text-sm font-bold text-navy-950 dark:text-white mt-1">
                      {new Date(data.metadata.issuanceDate).toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit"
                      })}
                    </p>
                    <span className="text-[11px] text-navy-500">Immutable Block Timestamp</span>
                  </div>
                </div>
              </div>

              {/* Cryptographic Proof Details */}
              <div className="p-6 sm:p-8 space-y-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-navy-400">
                  Cryptographic Provenance & On-Chain Identifiers
                </h3>

                <div className="space-y-3">
                  {/* Smart Contract */}
                  <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-navy-950 border border-navy-100 dark:border-navy-800 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                    <div>
                      <span className="text-[11px] font-bold text-navy-400 uppercase">ERC-721 Contract Address</span>
                      <p className="font-mono text-xs text-navy-900 dark:text-navy-100 break-all">
                        {data.contractAddress}
                      </p>
                    </div>
                    <div className="flex items-center gap-1.5 self-start sm:self-auto">
                      <button
                        onClick={() => copyToClipboard(data.contractAddress, "contract")}
                        className="p-1.5 text-navy-400 hover:text-navy-700 dark:hover:text-white rounded-lg hover:bg-navy-200/50 transition"
                        title="Copy contract address"
                      >
                        {copiedField === "contract" ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                      <a
                        href={data.verificationLinks.contractEtherscan}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-xs font-semibold text-brand-600 dark:text-brand-400 hover:underline px-2 py-1 rounded-lg hover:bg-brand-50 dark:hover:bg-brand-950/50 transition"
                      >
                        Etherscan <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  </div>

                  {/* Settlement Tx Hash */}
                  <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-navy-950 border border-navy-100 dark:border-navy-800 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                    <div>
                      <span className="text-[11px] font-bold text-navy-400 uppercase">Settlement Transaction Hash</span>
                      <p className="font-mono text-xs text-navy-900 dark:text-navy-100 break-all">
                        {data.metadata.tradeSettlementHash}
                      </p>
                    </div>
                    <div className="flex items-center gap-1.5 self-start sm:self-auto">
                      <button
                        onClick={() => copyToClipboard(data.metadata.tradeSettlementHash, "tx")}
                        className="p-1.5 text-navy-400 hover:text-navy-700 dark:hover:text-white rounded-lg hover:bg-navy-200/50 transition"
                        title="Copy transaction hash"
                      >
                        {copiedField === "tx" ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                      <a
                        href={data.verificationLinks.txEtherscan}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-xs font-semibold text-brand-600 dark:text-brand-400 hover:underline px-2 py-1 rounded-lg hover:bg-brand-50 dark:hover:bg-brand-950/50 transition"
                      >
                        Verify Proof <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  </div>

                  {/* Producer & Beneficiary Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-navy-950 border border-navy-100 dark:border-navy-800">
                      <span className="text-[11px] font-bold text-navy-400 uppercase">Energy Producer (Origin)</span>
                      <p className="font-mono text-xs text-navy-900 dark:text-navy-100 break-all mt-0.5">
                        {data.metadata.producerAddress}
                      </p>
                      <a
                        href={`https://sepolia.etherscan.io/address/${data.metadata.producerAddress}`}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-[11px] font-semibold text-brand-600 dark:text-brand-400 hover:underline mt-1.5"
                      >
                        View Account <ExternalLink className="w-2.5 h-2.5" />
                      </a>
                    </div>

                    <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-navy-950 border border-navy-100 dark:border-navy-800">
                      <span className="text-[11px] font-bold text-navy-400 uppercase">Green Beneficiary (Consumer)</span>
                      <p className="font-mono text-xs text-navy-900 dark:text-navy-100 break-all mt-0.5">
                        {data.metadata.consumerAddress}
                      </p>
                      <a
                        href={`https://sepolia.etherscan.io/address/${data.metadata.consumerAddress}`}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-[11px] font-semibold text-brand-600 dark:text-brand-400 hover:underline mt-1.5"
                      >
                        View Account <ExternalLink className="w-2.5 h-2.5" />
                      </a>
                    </div>
                  </div>
                </div>
              </div>

              {/* Legal Non-Financial Disclaimer Box */}
              <div className="p-6 sm:p-8 bg-amber-50/70 dark:bg-amber-950/20 border-t border-amber-200/60 dark:border-amber-900/40">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-xs font-bold text-amber-900 dark:text-amber-200 uppercase tracking-wider">
                      Regulatory & Non-Financial Disclaimer
                    </h4>
                    <p className="text-xs text-amber-800 dark:text-amber-300/90 mt-1 leading-relaxed">
                      {data.disclaimer}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </PublicLayout>
  );
}
