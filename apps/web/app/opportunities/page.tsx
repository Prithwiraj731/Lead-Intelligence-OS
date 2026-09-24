"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Sparkles, ArrowRight, ExternalLink, RefreshCw, Layers, ChevronRight, TrendingUp } from "lucide-react";

export default function OpportunitiesPage() {
  const [opportunities, setOpportunities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchOpportunities = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/leads?minOpportunity=70");
      const json = await res.json();
      if (json.success) {
        setOpportunities(json.data.leads || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOpportunities();
  }, []);

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/60 pb-6">
        <div>
          <div className="flex items-center space-x-2 mb-1.5">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <Sparkles className="w-3 h-3" />
              High Yield Matrix
            </span>
            <span className="text-xs text-slate-500">•</span>
            <span className="text-xs text-slate-400">Score ≥ 70 / 100</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-white">
            Diagnosed Opportunities ({opportunities.length})
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-2xl leading-relaxed">
            Prioritized by commercial leverage, technical vulnerability severity, and verified client acquisition gap.
          </p>
        </div>
      </div>

      {loading ? (
        <div className="py-20 text-center text-slate-400 text-xs flex flex-col items-center space-y-3">
          <RefreshCw className="w-5 h-5 animate-spin text-amber-400" />
          <span className="font-medium text-slate-400">Ranking high-ticket opportunities...</span>
        </div>
      ) : opportunities.length === 0 ? (
        <div className="p-12 rounded-2xl border border-dashed border-border/80 text-center space-y-3 bg-card/20">
          <div className="w-12 h-12 rounded-2xl bg-card border border-border mx-auto flex items-center justify-center text-slate-500">
            <Sparkles className="w-6 h-6 text-amber-400/70" />
          </div>
          <p className="text-sm font-medium text-white">No High Opportunities Yet</p>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Import leads and run deep technical audits on companies in your directory.
          </p>
          <Link
            href="/leads"
            className="inline-flex items-center space-x-2 text-xs px-4 py-2 rounded-xl bg-indigo-600/10 text-indigo-300 border border-indigo-500/20 hover:bg-indigo-600/20 transition-all mt-2"
          >
            <span>Open Leads Directory</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {opportunities.map((lead) => {
            const opp = lead.opportunities?.[0];
            if (!opp) return null;

            return (
              <div
                key={lead.id}
                className="glass-card p-5 rounded-2xl border border-white/[0.06] hover:border-white/[0.12] transition-all space-y-4 flex flex-col justify-between group"
              >
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center space-x-2">
                      <div className="w-6 h-6 rounded-lg bg-white/[0.04] border border-white/[0.08] flex items-center justify-center text-slate-300 font-semibold text-xs shrink-0">
                        {lead.name.charAt(0).toUpperCase()}
                      </div>
                      <Link
                        href={`/leads/${lead.id}`}
                        className="text-sm font-medium text-white group-hover:text-indigo-300 transition-colors"
                      >
                        {lead.name}
                      </Link>
                    </div>

                    <div className="px-2 py-0.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-semibold shrink-0">
                      <span className="text-[10px] text-amber-500/70 font-normal mr-1">OPP</span>
                      {opp.opportunityScore}
                    </div>
                  </div>

                  <div className="text-xs font-medium text-indigo-400">
                    {opp.suggestedOffer || opp.service?.name}
                  </div>

                  <p className="text-xs text-slate-300 leading-relaxed">
                    {opp.primaryPainPoint}
                  </p>

                  {opp.potentialImpact && (
                    <div className="text-[11px] text-emerald-400/90 font-medium flex items-center space-x-1.5 pt-1">
                      <TrendingUp className="w-3.5 h-3.5" />
                      <span>Impact: {opp.potentialImpact}</span>
                    </div>
                  )}
                </div>

                <div className="pt-3 border-t border-white/[0.04] flex items-center justify-between gap-2">
                  <span className="text-xs font-medium text-slate-400">
                    Est: {(opp.currency === "INR" ? "₹" : (opp.currency === "USD" ? "$" : (opp.currency === "GBP" ? "£" : (opp.currency === "EUR" ? "€" : `${opp.currency || "AED"} `))))}{Number(opp.estimatedBudgetMin).toLocaleString()} –{" "}
                    {(opp.currency === "INR" ? "₹" : (opp.currency === "USD" ? "$" : (opp.currency === "GBP" ? "£" : (opp.currency === "EUR" ? "€" : `${opp.currency || "AED"} `))))}{Number(opp.estimatedBudgetMax).toLocaleString()}
                  </span>

                  <Link
                    href={`/leads/${lead.id}`}
                    className="px-3.5 py-1.5 rounded-xl bg-white/[0.05] hover:bg-indigo-600 hover:text-white border border-white/[0.08] text-slate-200 text-xs font-medium transition-all flex items-center space-x-1"
                  >
                    <span>View & Pitch</span>
                    <ChevronRight className="w-3 h-3 text-slate-400 group-hover:text-white" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
