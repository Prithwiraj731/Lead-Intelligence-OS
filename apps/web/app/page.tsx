"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Sparkles,
  Layers,
  CheckCircle2,
  Send,
  Upload,
  ArrowRight,
  TrendingUp,
  ShieldCheck,
  Search,
  ExternalLink,
  Clock,
  AlertCircle,
  FileCheck,
} from "lucide-react";

export default function DashboardPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
    <div className="space-y-8">
      {/* Top Welcome & Command Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border pb-6">
        <div>
          <div className="flex items-center space-x-2">
            <span className="px-2 py-0.5 rounded text-[11px] font-mono bg-blue-950/80 border border-blue-800/60 text-blue-400">
              COMMAND DECK
            </span>
            <span className="text-xs text-slate-400">Live Database Connected</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-white mt-1">
            Lead Intelligence Command Center
          </h1>
          <p className="text-sm text-slate-400 mt-0.5">
            Automated deep research, opportunity detection, and human-approved high-ticket outreach.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <Link
            href="/leads/import"
            className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium flex items-center space-x-2 transition-colors shadow-lg shadow-blue-900/20"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Import Lead File</span>
          </Link>
          <Link
            href="/messages"
            className="px-4 py-2 rounded-lg bg-card hover:bg-card-hover border border-border text-slate-200 text-xs font-medium flex items-center space-x-2 transition-colors"
          >
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            <span>Review Queue ({metrics.readyForReview})</span>
          </Link>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-lg bg-rose-950/40 border border-rose-800/50 text-rose-300 text-xs flex items-center space-x-2">
          <AlertCircle className="w-4 h-4 text-rose-400" />
          <span>{error}</span>
        </div>
      )}

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
        <div className="p-4 rounded-xl bg-card border border-border hover:border-slate-700 transition-colors">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-2">
            <span>Total Leads</span>
            <Layers className="w-4 h-4 text-blue-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-white">
            {metrics.totalLeads}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">Normalized in DB</div>
        </div>

        <div className="p-4 rounded-xl bg-card border border-border hover:border-slate-700 transition-colors">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-2">
            <span>Researched</span>
            <Search className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-cyan-400">
            {metrics.researchCompleted}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">Audited signals</div>
        </div>

        <div className="p-4 rounded-xl bg-card border border-border hover:border-slate-700 transition-colors">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-2">
            <span>High Opp.</span>
            <Sparkles className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-amber-400">
            {metrics.highOpportunityLeads}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">Score ≥ 80/100</div>
        </div>

        <div className="p-4 rounded-xl bg-card border border-border hover:border-slate-700 transition-colors">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-2">
            <span>Awaiting Review</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-emerald-400">
            {metrics.readyForReview}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">Human Gate Pending</div>
        </div>

        <div className="p-4 rounded-xl bg-card border border-border hover:border-slate-700 transition-colors">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-2">
            <span>Approved</span>
            <FileCheck className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-purple-400">
            {metrics.approvedOutreach}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">Signed off by you</div>
        </div>

        <div className="p-4 rounded-xl bg-card border border-border hover:border-slate-700 transition-colors">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-2">
            <span>Conversion</span>
            <TrendingUp className="w-4 h-4 text-blue-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-blue-400">
            {metrics.conversionRate}%
          </div>
          <div className="text-[11px] text-slate-400 mt-1">Positive response</div>
        </div>
      </div>

      {/* Main Split: Top Opportunities & Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Top Opportunities (2 Cols) */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <h2 className="text-sm font-semibold text-white tracking-wide uppercase font-mono">
                Top Diagnosed Opportunities
              </h2>
            </div>
            <Link
              href="/opportunities"
              className="text-xs text-blue-400 hover:text-blue-300 flex items-center space-x-1"
            >
              <span>View all</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {data?.topOpportunities?.length === 0 ? (
            <div className="p-8 rounded-xl border border-dashed border-border text-center space-y-3 bg-card/40">
              <p className="text-xs text-slate-400">
                No opportunities diagnosed yet. Import leads and click "Research" on any company.
              </p>
              <Link
                href="/leads/import"
                className="inline-flex items-center space-x-2 text-xs px-3.5 py-1.5 rounded-lg bg-blue-600/30 text-blue-400 border border-blue-500/40 hover:bg-blue-600/40"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>Import Dubai Leads CSV</span>
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {data?.topOpportunities?.map((opp: any) => (
                <div
                  key={opp.id}
                  className="p-4 rounded-xl bg-card border border-border hover:border-slate-700 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 group"
                >
                  <div className="space-y-1.5 max-w-lg">
                    <div className="flex items-center space-x-2">
                      <Link
                        href={`/leads/${opp.company.id}`}
                        className="text-sm font-semibold text-white group-hover:text-blue-400 transition-colors flex items-center space-x-1.5"
                      >
                        <span>{opp.company.name}</span>
                        <ExternalLink className="w-3 h-3 text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </Link>
                      <span className="text-[11px] px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-mono">
                        {opp.company.city || opp.company.location || "UAE"}
                      </span>
                    </div>

                    <p className="text-xs text-slate-300 font-medium line-clamp-1">
                      {opp.suggestedOffer || opp.service?.name}
                    </p>

                    <p className="text-[11px] text-slate-400 line-clamp-1">
                      {opp.primaryPainPoint}
                    </p>
                  </div>

                  <div className="flex items-center space-x-4 shrink-0">
                    <div className="text-right">
                      <div className="flex items-center space-x-1.5 justify-end">
                        <span className="text-[10px] text-slate-400 font-mono">OPP:</span>
                        <span className="text-xs font-bold font-mono text-amber-400 bg-amber-950/60 px-1.5 py-0.5 rounded border border-amber-800/40">
                          {opp.opportunityScore}/100
                        </span>
                      </div>
                      <div className="flex items-center space-x-1.5 justify-end mt-1">
                        <span className="text-[10px] text-slate-400 font-mono">CONF:</span>
                        <span className="text-xs font-bold font-mono text-cyan-400 bg-cyan-950/60 px-1.5 py-0.5 rounded border border-cyan-800/40">
                          {opp.confidenceScore}/100
                        </span>
                      </div>
                    </div>

                    <Link
                      href={`/leads/${opp.company.id}`}
                      className="px-3 py-1.5 rounded-lg bg-blue-600/20 border border-blue-500/40 text-blue-400 hover:bg-blue-600 hover:text-white text-xs font-medium transition-colors"
                    >
                      Action
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Live Activity Stream (1 Col) */}
        <div className="space-y-4">
          <div className="flex items-center space-x-2">
            <Clock className="w-4 h-4 text-cyan-400" />
            <h2 className="text-sm font-semibold text-white tracking-wide uppercase font-mono">
              Live Audit Trail
            </h2>
          </div>

          <div className="p-4 rounded-xl bg-card border border-border space-y-3">
            {data?.recentActivity?.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-4">No recent activity logged.</p>
            ) : (
              <div className="space-y-3">
                {data?.recentActivity?.map((act: any) => (
                  <div
                    key={act.id}
                    className="flex items-start space-x-3 text-xs border-b border-border/50 pb-2.5 last:border-0 last:pb-0"
                  >
                    <div className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-1.5 shrink-0"></div>
                    <div className="space-y-0.5 flex-1">
                      <div className="flex items-center justify-between">
                        <span className="font-mono font-medium text-slate-200">
                          {act.action.replace(/_/g, " ")}
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono">
                          {new Date(act.createdAt).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </div>
                      {act.company && (
                        <p className="text-[11px] text-slate-400">{act.company.name}</p>
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
  );
}
