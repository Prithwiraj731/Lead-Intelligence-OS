"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Sparkles, ArrowRight, ExternalLink, RefreshCw, Layers } from "lucide-react";

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
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-6">
        <div>
          <div className="flex items-center space-x-2">
            <span className="px-2 py-0.5 rounded text-[11px] font-mono bg-amber-950/80 border border-amber-800/60 text-amber-400">
              HIGH YIELD
            </span>
            <span className="text-xs text-slate-400">Opportunity Score ≥ 70</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white mt-1">
            Diagnosed High-Ticket Opportunities ({opportunities.length})
          </h1>
          <p className="text-sm text-slate-400 mt-0.5">
            Ranked by commercial leverage, technical pain severity, and verified client acquisition gap.
          </p>
        </div>
      </div>

      {loading ? (
        <div className="py-20 text-center text-slate-400 text-xs flex flex-col items-center space-y-2">
          <RefreshCw className="w-5 h-5 animate-spin text-blue-500" />
          <span>Ranking opportunities...</span>
        </div>
      ) : opportunities.length === 0 ? (
        <div className="p-12 rounded-2xl border border-dashed border-border text-center space-y-3 bg-card/30">
          <Sparkles className="w-8 h-8 text-amber-400 mx-auto" />
          <p className="text-sm font-semibold text-white">No High Opportunities Yet</p>
          <p className="text-xs text-slate-400">
            Import leads and run deep research on companies in your directory.
          </p>
          <Link
            href="/leads"
            className="inline-flex items-center space-x-2 text-xs px-4 py-2 rounded-lg bg-blue-600/20 border border-blue-500/40 text-blue-400 hover:bg-blue-600 hover:text-white mt-2"
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
                className="p-5 rounded-2xl bg-card border border-border hover:border-slate-700 transition-colors space-y-4 flex flex-col justify-between"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Link
                      href={`/leads/${lead.id}`}
                      className="text-sm font-bold text-white hover:text-blue-400 transition-colors flex items-center space-x-1.5"
                    >
                      <span>{lead.name}</span>
                      <ExternalLink className="w-3 h-3 text-slate-400" />
                    </Link>

                    <div className="flex items-center space-x-2 font-mono text-xs">
                      <span className="bg-amber-950/80 border border-amber-800 text-amber-300 px-2 py-0.5 rounded font-bold">
                        OPP: {opp.opportunityScore}
                      </span>
                    </div>
                  </div>

                  <div className="text-xs font-semibold text-blue-400">
                    {opp.suggestedOffer || opp.service?.name}
                  </div>

                  <p className="text-xs text-slate-300 leading-relaxed">
                    {opp.primaryPainPoint}
                  </p>

                  <div className="text-[11px] text-emerald-400 pt-1">
                    Impact: {opp.potentialImpact}
                  </div>
                </div>

                <div className="pt-3 border-t border-border/60 flex items-center justify-between">
                  <span className="text-[11px] font-mono text-slate-400">
                    Est: {(opp.currency === "INR" ? "₹" : (opp.currency === "USD" ? "$" : (opp.currency === "GBP" ? "£" : (opp.currency === "EUR" ? "€" : `${opp.currency || "AED"} `))))}{Number(opp.estimatedBudgetMin).toLocaleString()} -{" "}
                    {(opp.currency === "INR" ? "₹" : (opp.currency === "USD" ? "$" : (opp.currency === "GBP" ? "£" : (opp.currency === "EUR" ? "€" : `${opp.currency || "AED"} `))))}{Number(opp.estimatedBudgetMax).toLocaleString()}
                  </span>

                  <Link
                    href={`/leads/${lead.id}`}
                    className="px-3 py-1.5 rounded-lg bg-blue-600/20 border border-blue-500/40 text-blue-400 hover:bg-blue-600 hover:text-white text-xs font-medium transition-colors"
                  >
                    View & Pitch
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
