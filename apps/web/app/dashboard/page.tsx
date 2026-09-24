"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Sparkles,
  Layers,
  CheckCircle2,
  Upload,
  ArrowRight,
  TrendingUp,
  Search,
  ExternalLink,
  Clock,
  AlertCircle,
  FileCheck,
  Building2,
  ChevronRight,
  ShieldCheck,
  Terminal,
  Zap,
} from "lucide-react";

export default function DashboardPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [bootSequence, setBootSequence] = useState(false);
  const [isRevealing, setIsRevealing] = useState(false);

  const fetchMetrics = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/metrics");
      const json = await res.json();
      if (json.success) {
        setData(json.data);
      } else {
        setError(json.error || "Failed to load dashboard metrics");
      }
    } catch (err: any) {
      setError(err.message || "Failed to connect to backend");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMetrics();
    // Check if entered from homepage with modern shutter reveal
    if (typeof window !== "undefined" && window.location.search.includes("reveal")) {
      setIsRevealing(true);
      const revealTimer = setTimeout(() => setIsRevealing(false), 700);
      return () => clearTimeout(revealTimer);
    }
    // Trigger smooth boot sequence animation
    const timer = setTimeout(() => setBootSequence(true), 80);
    return () => clearTimeout(timer);
  }, []);

  const metrics = data?.metrics || {
    totalLeads: 0,
    researchCompleted: 0,
    highOpportunityLeads: 0,
    readyForReview: 0,
    approvedOutreach: 0,
    sentOutreach: 0,
    conversionRate: 0,
  };

  return (
    <>
      {/* Alternating Horizontal Kinetic Shutter Blocks Opening Reveal */}
      {isRevealing && (
        <div className="fixed inset-0 z-50 pointer-events-none flex flex-col justify-between overflow-hidden">
          {[0, 1, 2, 3, 4, 5, 6].map((index) => {
            const isEven = index % 2 === 0;
            return (
              <div
                key={index}
                className={`w-full flex-1 bg-[#07080c] border-y border-white/[0.08] ${
                  isEven ? "animate-shutter-out-right" : "animate-shutter-out-left"
                }`}
                style={{
                  animationDelay: `${index * 35}ms`,
                }}
              />
            );
          })}
        </div>
      )}

      <div
        className={`space-y-8 pb-12 transition-all duration-700 ease-out ${
          bootSequence ? "opacity-100 translate-y-0 scale-100" : "opacity-0 translate-y-6 scale-[0.99]"
        }`}
      >

      {/* Sci-Fi Entrance Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/60 pb-6 relative overflow-hidden">
        {/* Subtle background glow */}
        <div className="absolute -top-12 -left-12 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10">
          <div className="flex items-center space-x-2 mb-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-mono tracking-wider bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
              SYS_STATUS: ONLINE
            </span>
            <span className="text-xs text-slate-600 font-mono">//</span>
            <span className="text-xs text-slate-400 font-mono tracking-tight">NEURAL TRIAD ENGAGED</span>
            <span className="text-xs text-slate-600 font-mono">//</span>
            <span className="text-xs text-slate-500 font-mono">POSTGRES: OK</span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white flex items-center gap-3">
            <span>Lead Intelligence Command</span>
            <span className="text-xs font-mono font-normal uppercase px-2 py-0.5 rounded bg-white/[0.06] border border-white/[0.1] text-slate-400">
              v2.4 Core
            </span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-2xl leading-relaxed">
            Real-time telemetry, autonomous forensic auditing, and commercial valuation engine for UAE enterprise leads.
          </p>
        </div>

        <div className="flex items-center space-x-2.5 shrink-0 relative z-10">
          <Link
            href="/leads/import"
            className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium flex items-center space-x-2 transition-all shadow-md shadow-indigo-600/20 active:scale-95 group"
          >
            <Upload className="w-3.5 h-3.5 group-hover:-translate-y-0.5 transition-transform" />
            <span>Import Leads</span>
          </Link>
          <Link
            href="/messages"
            className="px-4 py-2 rounded-xl bg-card hover:bg-card-hover border border-border text-slate-200 text-xs font-medium flex items-center space-x-2 transition-all hover:border-slate-600 active:scale-95"
          >
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            <span>Review Queue</span>
            {metrics.readyForReview > 0 && (
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-emerald-500/20 text-emerald-300 font-semibold">
                {metrics.readyForReview}
              </span>
            )}
          </Link>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-center space-x-3">
          <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* KPI Stats Grid with Staggered Visual Feel */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
        {/* Total Leads */}
        <div className="glass-card p-4 rounded-2xl border border-white/[0.06] hover:border-white/[0.12] transition-all group relative overflow-hidden">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-3">
            <span className="font-medium text-slate-400">Total Leads</span>
            <div className="w-7 h-7 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 group-hover:scale-105 transition-transform">
              <Layers className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-2xl font-bold tracking-tight text-white font-mono">
            {metrics.totalLeads}
          </div>
          <p className="text-[11px] text-slate-500 mt-1 font-medium">In directory</p>
        </div>

        {/* Researched */}
        <div className="glass-card p-4 rounded-2xl border border-white/[0.06] hover:border-white/[0.12] transition-all group relative overflow-hidden">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-3">
            <span className="font-medium text-slate-400">Audited</span>
            <div className="w-7 h-7 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 group-hover:scale-105 transition-transform">
              <Search className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-2xl font-bold tracking-tight text-cyan-400 font-mono">
            {metrics.researchCompleted}
          </div>
          <p className="text-[11px] text-slate-500 mt-1 font-medium">Footprint inspected</p>
        </div>

        {/* High Opportunity */}
        <div className="glass-card p-4 rounded-2xl border border-white/[0.06] hover:border-white/[0.12] transition-all group relative overflow-hidden">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-3">
            <span className="font-medium text-slate-400">High Yield</span>
            <div className="w-7 h-7 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 group-hover:scale-105 transition-transform">
              <Sparkles className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-2xl font-bold tracking-tight text-amber-400 font-mono">
            {metrics.highOpportunityLeads}
          </div>
          <p className="text-[11px] text-slate-500 mt-1 font-medium">Score ≥ 80 / 100</p>
        </div>

        {/* Ready for Review */}
        <div className="glass-card p-4 rounded-2xl border border-white/[0.06] hover:border-white/[0.12] transition-all group relative overflow-hidden">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-3">
            <span className="font-medium text-slate-400">Pending Review</span>
            <div className="w-7 h-7 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 group-hover:scale-105 transition-transform">
              <CheckCircle2 className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-2xl font-bold tracking-tight text-emerald-400 font-mono">
            {metrics.readyForReview}
          </div>
          <p className="text-[11px] text-slate-500 mt-1 font-medium">Human sign-off</p>
        </div>

        {/* Approved Outreach */}
        <div className="glass-card p-4 rounded-2xl border border-white/[0.06] hover:border-white/[0.12] transition-all group relative overflow-hidden">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-3">
            <span className="font-medium text-slate-400">Approved</span>
            <div className="w-7 h-7 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 group-hover:scale-105 transition-transform">
              <FileCheck className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-2xl font-bold tracking-tight text-purple-400 font-mono">
            {metrics.approvedOutreach}
          </div>
          <p className="text-[11px] text-slate-500 mt-1 font-medium">Ready to dispatch</p>
        </div>

        {/* Conversion Rate */}
        <div className="glass-card p-4 rounded-2xl border border-white/[0.06] hover:border-white/[0.12] transition-all group relative overflow-hidden">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-3">
            <span className="font-medium text-slate-400">Conversion</span>
            <div className="w-7 h-7 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 group-hover:scale-105 transition-transform">
              <TrendingUp className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-2xl font-bold tracking-tight text-indigo-400 font-mono">
            {metrics.conversionRate}%
          </div>
          <p className="text-[11px] text-slate-500 mt-1 font-medium">Positive yield</p>
        </div>
      </div>

      {/* Main Two-Column Split */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Top Diagnosed Opportunities (2 Cols) */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="w-6 h-6 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-400">
                <Sparkles className="w-3.5 h-3.5" />
              </div>
              <h2 className="text-sm font-semibold text-slate-200 tracking-tight">
                Top Diagnosed Opportunities
              </h2>
            </div>
            <Link
              href="/opportunities"
              className="text-xs text-indigo-400 hover:text-indigo-300 font-medium flex items-center space-x-1 group transition-colors"
            >
              <span>View all</span>
              <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
            </Link>
          </div>

          {loading ? (
            <div className="p-8 rounded-2xl border border-border bg-card/40 text-center text-slate-500 text-xs">
              Loading top opportunities...
            </div>
          ) : data?.topOpportunities?.length === 0 ? (
            <div className="p-10 rounded-2xl border border-dashed border-border/80 text-center space-y-3 bg-card/20">
              <div className="w-10 h-10 rounded-xl bg-card border border-border mx-auto flex items-center justify-center text-slate-500">
                <Sparkles className="w-5 h-5 text-amber-400/60" />
              </div>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                No opportunities diagnosed yet. Import leads and click "Research" to trigger deep technical auditing.
              </p>
              <Link
                href="/leads/import"
                className="inline-flex items-center space-x-2 text-xs px-4 py-2 rounded-xl bg-indigo-600/10 text-indigo-300 border border-indigo-500/20 hover:bg-indigo-600/20 transition-all"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>Import Lead File</span>
              </Link>
            </div>
          ) : (
            <div className="space-y-2.5">
              {data?.topOpportunities?.map((opp: any) => (
                <div
                  key={opp.id}
                  className="glass-card p-4 rounded-2xl border border-white/[0.06] hover:border-white/[0.12] transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 group"
                >
                  <div className="space-y-1.5 flex-1 min-w-0">
                    <div className="flex items-center space-x-2">
                      <div className="w-6 h-6 rounded-lg bg-white/[0.04] border border-white/[0.08] flex items-center justify-center text-slate-400 font-medium text-[11px] shrink-0 font-mono">
                        {opp.company.name.charAt(0).toUpperCase()}
                      </div>
                      <Link
                        href={`/leads/${opp.company.id}`}
                        className="text-sm font-medium text-white group-hover:text-indigo-300 transition-colors truncate"
                      >
                        {opp.company.name}
                      </Link>
                      <span className="text-[11px] px-2 py-0.5 rounded-full bg-white/[0.04] text-slate-400 border border-white/[0.06]">
                        {opp.company.city || opp.company.location || "UAE"}
                      </span>
                    </div>

                    <p className="text-xs text-slate-300 font-medium truncate">
                      {opp.suggestedOffer || opp.service?.name}
                    </p>

                    <p className="text-[11px] text-slate-500 line-clamp-1">
                      {opp.primaryPainPoint}
                    </p>
                  </div>

                  <div className="flex items-center space-x-4 shrink-0 sm:self-center self-end">
                    <div className="flex items-center gap-2">
                      <div className="px-2 py-1 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-semibold font-mono">
                        <span className="text-[10px] text-amber-500/70 font-normal mr-1">OPP</span>
                        {opp.opportunityScore}
                      </div>
                      <div className="px-2 py-1 rounded-lg bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-xs font-semibold font-mono">
                        <span className="text-[10px] text-cyan-500/70 font-normal mr-1">CONF</span>
                        {opp.confidenceScore}
                      </div>
                    </div>

                    <Link
                      href={`/leads/${opp.company.id}`}
                      className="px-3.5 py-1.5 rounded-xl bg-white/[0.05] hover:bg-indigo-600 hover:text-white border border-white/[0.08] text-slate-300 text-xs font-medium transition-all flex items-center space-x-1"
                    >
                      <span>Action</span>
                      <ChevronRight className="w-3 h-3 text-slate-400 group-hover:text-white" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Live Audit Trail (1 Col) */}
        <div className="space-y-4">
          <div className="flex items-center space-x-2">
            <div className="w-6 h-6 rounded-lg bg-cyan-500/10 flex items-center justify-center text-cyan-400">
              <Clock className="w-3.5 h-3.5" />
            </div>
            <h2 className="text-sm font-semibold text-slate-200 tracking-tight">
              Live Audit Trail
            </h2>
          </div>

          <div className="glass-card p-4 rounded-2xl border border-white/[0.06]">
            {loading ? (
              <p className="text-xs text-slate-500 text-center py-4">Loading audit activity...</p>
            ) : data?.recentActivity?.length === 0 ? (
              <p className="text-xs text-slate-500 text-center py-6">No recent system activity logged.</p>
            ) : (
              <div className="space-y-3.5">
                {data?.recentActivity?.map((act: any) => (
                  <div
                    key={act.id}
                    className="flex items-start space-x-3 text-xs border-b border-white/[0.04] pb-3 last:border-0 last:pb-0"
                  >
                    <div className="w-1.5 h-1.5 rounded-full bg-indigo-400 mt-1.5 shrink-0 shadow-[0_0_6px_#818cf8]"></div>
                    <div className="space-y-0.5 flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-medium text-slate-200 truncate">
                          {act.action.replace(/_/g, " ")}
                        </span>
                        <span className="text-[10px] text-slate-500 shrink-0 font-mono">
                          {new Date(act.createdAt).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </div>
                      {act.company && (
                        <p className="text-[11px] text-slate-400 truncate">{act.company.name}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  </>
);
}

