"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Search,
  Layers,
  Upload,
  Sparkles,
  RefreshCw,
  Eye,
  Globe,
  Phone,
  User,
  Building2,
  ChevronRight,
  Filter,
} from "lucide-react";

export default function LeadsDirectoryPage() {
  const [leads, setLeads] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [researchingId, setResearchingId] = useState<string | null>(null);

  const fetchLeads = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (statusFilter && statusFilter !== "ALL") params.set("status", statusFilter);

      const res = await fetch(`/api/leads?${params.toString()}`);
      const json = await res.json();
      if (json.success) {
        setLeads(json.data.leads || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeads();
  }, [statusFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchLeads();
  };

  const handleTriggerResearch = async (id: string) => {
    try {
      setResearchingId(id);
      const res = await fetch(`/api/leads/${id}/research`, { method: "POST" });
      const json = await res.json();
      if (json.success) {
        await fetchLeads();
      }
    } catch (err) {
      console.error("Research trigger failed:", err);
    } finally {
      setResearchingId(null);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/60 pb-6">
        <div>
          <div className="flex items-center space-x-2 mb-1.5">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              <Layers className="w-3 h-3" />
              Verified Directory
            </span>
            <span className="text-xs text-slate-500">•</span>
            <span className="text-xs text-slate-400">{leads.length} Companies Loaded</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-white">
            Lead Intelligence Directory
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-2xl leading-relaxed">
            Normalized commercial accounts with automated technical audits, opportunity detection, and decision-maker profiles.
          </p>
        </div>

        <Link
          href="/leads/import"
          className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium flex items-center space-x-2 transition-all shadow-md shadow-indigo-600/20 self-start sm:self-auto active:scale-95"
        >
          <Upload className="w-3.5 h-3.5" />
          <span>Import Leads</span>
        </Link>
      </div>

      {/* Modern Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row items-center gap-3">
        <form onSubmit={handleSearchSubmit} className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by company, domain, city, or industry..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-card border border-border/80 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500/80 focus:ring-1 focus:ring-indigo-500/30 transition-all"
          />
        </form>

        <div className="relative w-full sm:w-auto">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-card border border-border/80 text-xs text-slate-200 focus:outline-none focus:border-indigo-500/80 cursor-pointer transition-all"
          >
            <option value="ALL">All Statuses</option>
            <option value="NEW">New Leads</option>
            <option value="RESEARCHING">Researching</option>
            <option value="OPPORTUNITY_IDENTIFIED">Opportunity Identified</option>
            <option value="OUTREACH_READY">Outreach Ready</option>
            <option value="OUTREACH_APPROVED">Outreach Approved</option>
          </select>
        </div>
      </div>

      {/* Leads List */}
      <div className="glass-panel rounded-2xl border border-white/[0.06] overflow-hidden">
        {loading ? (
          <div className="py-20 text-center text-slate-400 text-xs flex flex-col items-center space-y-3">
            <RefreshCw className="w-5 h-5 animate-spin text-indigo-400" />
            <span className="font-medium text-slate-400">Loading intelligence records...</span>
          </div>
        ) : leads.length === 0 ? (
          <div className="py-16 text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-card border border-border mx-auto flex items-center justify-center text-slate-500">
              <Layers className="w-6 h-6 text-slate-400" />
            </div>
            <p className="text-sm font-medium text-white">No leads match your criteria</p>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Try adjusting your search query or import new leads via CSV or XLSX.
            </p>
            <Link
              href="/leads/import"
              className="inline-flex items-center space-x-2 text-xs px-4 py-2 rounded-xl bg-indigo-600/10 text-indigo-300 border border-indigo-500/20 hover:bg-indigo-600/20 transition-all mt-2"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Import Leads</span>
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-white/[0.04]">
            {leads.map((lead) => {
              const topOpp = lead.opportunities?.[0];
              const isResearching = researchingId === lead.id;

              return (
                <div
                  key={lead.id}
                  className="p-4 sm:p-5 hover:bg-white/[0.02] transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4 group"
                >
                  <div className="space-y-2 flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <div className="w-7 h-7 rounded-xl bg-white/[0.04] border border-white/[0.08] flex items-center justify-center text-slate-300 font-semibold text-xs shrink-0">
                        {lead.name.charAt(0).toUpperCase()}
                      </div>
                      <Link
                        href={`/leads/${lead.id}`}
                        className="text-sm font-medium text-white hover:text-indigo-300 transition-colors"
                      >
                        {lead.name}
                      </Link>
                      <span className="text-[11px] px-2 py-0.5 rounded-full bg-white/[0.04] text-slate-400 border border-white/[0.06]">
                        {lead.city || lead.location || "UAE"}
                      </span>
                      {lead.industry && (
                        <span className="text-[11px] px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
                          {lead.industry}
                        </span>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400">
                      {lead.contacts?.[0] && (
                        <div className="flex items-center space-x-1.5">
                          <User className="w-3 h-3 text-slate-500" />
                          <span>
                            {lead.contacts[0].name}
                            <span className="text-slate-500 ml-1">
                              ({lead.contacts[0].role || "Decision Maker"})
                            </span>
                          </span>
                        </div>
                      )}
                      {lead.domain && (
                        <div className="flex items-center space-x-1 font-mono text-slate-400 text-[11px]">
                          <Globe className="w-3 h-3 text-slate-500" />
                          <span>{lead.domain}</span>
                        </div>
                      )}
                      {lead.phone && (
                        <div className="flex items-center space-x-1 font-mono text-slate-400 text-[11px]">
                          <Phone className="w-3 h-3 text-slate-500" />
                          <span>{lead.phone}</span>
                        </div>
                      )}
                    </div>

                    {topOpp && (
                      <div className="pt-0.5 flex items-center space-x-2 text-xs">
                        <span className="text-amber-400 font-medium">
                          {topOpp.suggestedOffer || topOpp.service?.name}:
                        </span>
                        <span className="text-slate-400 truncate">
                          {topOpp.primaryPainPoint}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Right Score & Action Zone */}
                  <div className="flex items-center space-x-3.5 shrink-0 self-end md:self-center">
                    {topOpp ? (
                      <div className="flex items-center gap-2">
                        <div className="px-2.5 py-1 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-semibold">
                          <span className="text-[10px] text-amber-500/70 font-normal mr-1">OPP</span>
                          {topOpp.opportunityScore}
                        </div>
                        <div className="px-2.5 py-1 rounded-lg bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-xs font-semibold">
                          <span className="text-[10px] text-cyan-500/70 font-normal mr-1">CONF</span>
                          {topOpp.confidenceScore}
                        </div>
                      </div>
                    ) : (
                      <span className="text-xs text-slate-500 italic px-2">
                        Awaiting audit
                      </span>
                    )}

                    <div className="flex items-center space-x-2">
                      {!topOpp && (
                        <button
                          onClick={() => handleTriggerResearch(lead.id)}
                          disabled={isResearching}
                          className="px-3.5 py-1.5 rounded-xl bg-indigo-600/10 hover:bg-indigo-600 text-indigo-300 hover:text-white border border-indigo-500/20 text-xs font-medium transition-all flex items-center space-x-1.5 active:scale-95 disabled:opacity-50"
                        >
                          {isResearching ? (
                            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <Sparkles className="w-3.5 h-3.5 text-indigo-400 group-hover:text-white" />
                          )}
                          <span>{isResearching ? "Auditing..." : "Audit"}</span>
                        </button>
                      )}

                      <Link
                        href={`/leads/${lead.id}`}
                        className="p-2 rounded-xl border border-white/[0.08] bg-white/[0.03] hover:bg-white/[0.08] text-slate-300 hover:text-white transition-all"
                        title="View Full Profile"
                      >
                        <Eye className="w-4 h-4" />
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
