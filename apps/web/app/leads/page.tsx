"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Search,
  Filter,
  Layers,
  Upload,
  ArrowRight,
  ExternalLink,
  Sparkles,
  RefreshCw,
  Eye,
  CheckCircle2,
  AlertCircle,
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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-6">
        <div>
          <div className="flex items-center space-x-2">
            <span className="px-2 py-0.5 rounded text-[11px] font-mono bg-blue-950/80 border border-blue-800/60 text-blue-400">
              DIRECTORY
            </span>
            <span className="text-xs text-slate-400">Normalized Leads Repository</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white mt-1">
            Company Leads ({leads.length})
          </h1>
          <p className="text-sm text-slate-400 mt-0.5">
            Select any lead to inspect technical research, opportunity analysis, or generate outreach.
          </p>
        </div>

        <Link
          href="/leads/import"
          className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium flex items-center space-x-2 transition-colors self-start sm:self-auto"
        >
          <Upload className="w-3.5 h-3.5" />
          <span>Import Leads</span>
        </Link>
      </div>

      {/* Filters Bar */}
      <div className="flex flex-col sm:flex-row items-center gap-3">
        <form onSubmit={handleSearchSubmit} className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search company, domain, city, industry..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-lg bg-card border border-border text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors"
          />
        </form>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3.5 py-2 rounded-lg bg-card border border-border text-xs text-slate-200 focus:outline-none focus:border-blue-500"
        >
          <option value="ALL">All Statuses</option>
          <option value="NEW">New Leads</option>
          <option value="RESEARCHING">Researching</option>
          <option value="OPPORTUNITY_IDENTIFIED">Opportunity Identified</option>
          <option value="OUTREACH_READY">Outreach Ready</option>
          <option value="OUTREACH_APPROVED">Outreach Approved</option>
        </select>
      </div>

      {/* Leads Table */}
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        {loading ? (
          <div className="py-16 text-center text-slate-400 text-xs flex flex-col items-center space-y-2">
            <RefreshCw className="w-5 h-5 animate-spin text-blue-500" />
            <span>Loading lead intelligence records...</span>
          </div>
        ) : leads.length === 0 ? (
          <div className="py-16 text-center space-y-3">
            <Layers className="w-8 h-8 text-slate-400 mx-auto" />
            <p className="text-xs text-slate-400">No leads found matching your criteria.</p>
            <Link
              href="/leads/import"
              className="inline-flex items-center space-x-2 text-xs px-3.5 py-1.5 rounded-lg bg-blue-600/20 border border-blue-500/40 text-blue-400 hover:bg-blue-600 hover:text-white"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Import Leads from CSV</span>
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-border/60">
            {leads.map((lead) => {
              const topOpp = lead.opportunities?.[0];
              const isResearching = researchingId === lead.id;

              return (
                <div
                  key={lead.id}
                  className="p-4 hover:bg-card-hover/40 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4"
                >
                  <div className="space-y-1.5 flex-1">
                    <div className="flex items-center space-x-2.5">
                      <Link
                        href={`/leads/${lead.id}`}
                        className="text-sm font-semibold text-white hover:text-blue-400 transition-colors"
                      >
                        {lead.name}
                      </Link>
                      <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-mono">
                        {lead.city || lead.location || "UAE"}
                      </span>
                      {lead.industry && (
                        <span className="text-[10px] px-2 py-0.5 rounded bg-blue-950/60 border border-blue-800/40 text-blue-300 font-mono">
                          {lead.industry}
                        </span>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-400">
                      {lead.contacts?.[0] && (
                        <span>
                          Contact:{" "}
                          <strong className="text-slate-300">
                            {lead.contacts[0].name}
                          </strong>{" "}
                          ({lead.contacts[0].role || "Decision Maker"})
                        </span>
                      )}
                      {lead.domain && (
                        <span className="font-mono text-slate-400">{lead.domain}</span>
                      )}
                      {lead.phone && (
                        <span className="font-mono text-slate-400">{lead.phone}</span>
                      )}
                    </div>

                    {topOpp && (
                      <div className="pt-1 flex items-center space-x-2 text-[11px]">
                        <span className="text-amber-400 font-medium">
                          {topOpp.suggestedOffer || topOpp.service?.name}:
                        </span>
                        <span className="text-slate-400 line-clamp-1">
                          {topOpp.primaryPainPoint}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Right Score & Action Zone */}
                  <div className="flex items-center space-x-4 shrink-0 self-end md:self-center">
                    {topOpp ? (
                      <div className="text-right">
                        <div className="flex items-center space-x-1.5 justify-end">
                          <span className="text-[10px] text-slate-400 font-mono">OPP:</span>
                          <span className="text-xs font-bold font-mono text-amber-400 bg-amber-950/60 px-1.5 py-0.5 rounded border border-amber-800/40">
                            {topOpp.opportunityScore}/100
                          </span>
                        </div>
                        <div className="flex items-center space-x-1.5 justify-end mt-1">
                          <span className="text-[10px] text-slate-400 font-mono">CONF:</span>
                          <span className="text-xs font-bold font-mono text-cyan-400 bg-cyan-950/60 px-1.5 py-0.5 rounded border border-cyan-800/40">
                            {topOpp.confidenceScore}/100
                          </span>
                        </div>
                      </div>
                    ) : (
                      <span className="text-[11px] text-slate-400 font-mono italic">
                        Not researched
                      </span>
                    )}

                    <div className="flex items-center space-x-2">
                      {!topOpp && (
                        <button
                          onClick={() => handleTriggerResearch(lead.id)}
                          disabled={isResearching}
                          className="px-3 py-1.5 rounded-lg bg-blue-600/20 border border-blue-500/40 text-blue-400 hover:bg-blue-600 hover:text-white text-xs font-medium transition-colors flex items-center space-x-1.5"
                        >
                          {isResearching ? (
                            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <Sparkles className="w-3.5 h-3.5" />
                          )}
                          <span>{isResearching ? "Auditing..." : "Research"}</span>
                        </button>
                      )}

                      <Link
                        href={`/leads/${lead.id}`}
                        className="p-1.5 rounded-lg border border-border hover:border-slate-600 text-slate-300 hover:text-white text-xs transition-colors"
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
