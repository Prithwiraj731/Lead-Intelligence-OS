"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Sparkles,
  CheckCircle2,
  Edit3,
  RefreshCw,
  XCircle,
  Globe,
  Mail,
  Building2,
  AlertTriangle,
  Send,
  MessageSquare,
  ExternalLink,
  Layers,
  Activity,
  Check,
  Zap,
  Target,
  BarChart3,
  Copy,
  Info,
  Shield,
  ArrowRight,
  TrendingUp,
  Smartphone,
  CheckCheck,
} from "lucide-react";

export default function LeadDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);
  const id = resolvedParams.id;

  const [lead, setLead] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [researching, setResearching] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [approving, setApproving] = useState(false);
  const [regenerating, setRegenerating] = useState(false);
  const [delivering, setDelivering] = useState(false);
  const [dryRunResult, setDryRunResult] = useState<any>(null);
  const [savingEdit, setSavingEdit] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  // Edit Mode state
  const [isEditingMessage, setIsEditingMessage] = useState(false);
  const [editSubject, setEditSubject] = useState("");
  const [editEmailBody, setEditEmailBody] = useState("");
  const [editWhatsappBody, setEditWhatsappBody] = useState("");
  const [editFollowupBody, setEditFollowupBody] = useState("");
  const [editCallToAction, setEditCallToAction] = useState("");

  const copyToClipboard = (text: string, fieldName: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const fetchLead = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/leads/${id}`);
      const json = await res.json();
      if (json.success) {
        setLead(json.data);
        const msg = json.data.messages?.[0];
        if (msg) {
          setEditSubject(msg.emailSubject || "");
          setEditEmailBody(msg.emailBody || "");
          setEditWhatsappBody(msg.whatsappBody || "");
          setEditFollowupBody(msg.followupBody || "");
          setEditCallToAction(msg.callToAction || "");
        }
      } else {
        setError(json.error || "Lead not found");
      }
    } catch (err: any) {
      setError(err.message || "Failed to load lead details");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLead();
  }, [id]);

  // 1. Run Research
  const handleRunResearch = async () => {
    try {
      setResearching(true);
      setError(null);
      const res = await fetch(`/api/leads/${id}/research`, { method: "POST" });
      const json = await res.json();
      if (json.success) {
        await fetchLead();
      } else {
        setError(json.error || "Failed to complete research");
      }
    } catch (err: any) {
      setError(err.message || "Research failed");
    } finally {
      setResearching(false);
    }
  };

  // 2. Generate Message
  const handleGenerateMessage = async () => {
    try {
      setGenerating(true);
      setError(null);
      const res = await fetch(`/api/leads/${id}/generate-message`, { method: "POST" });
      const json = await res.json();
      if (json.success) {
        await fetchLead();
      } else {
        setError(json.error || "Failed to generate message");
      }
    } catch (err: any) {
      setError(err.message || "Message generation failed");
    } finally {
      setGenerating(false);
    }
  };

  // 3. Regenerate Message
  const handleRegenerateMessage = async (messageId: string) => {
    try {
      setRegenerating(true);
      setError(null);
      const res = await fetch(`/api/messages/${messageId}/regenerate`, { method: "POST" });
      const json = await res.json();
      if (json.success) {
        await fetchLead();
      } else {
        setError(json.error || "Failed to regenerate message");
      }
    } catch (err: any) {
      setError(err.message || "Message regeneration failed");
    } finally {
      setRegenerating(false);
    }
  };

  // 4. Human Approval Gate: Approve
  const handleApproveMessage = async (messageId: string) => {
    try {
      setApproving(true);
      const res = await fetch(`/api/messages/${messageId}/approve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notes: "Approved via Lead Intelligence OS Command Deck" }),
      });
      const json = await res.json();
      if (json.success) {
        await fetchLead();
      } else {
        setError(json.error || "Failed to approve message");
      }
    } catch (err: any) {
      setError(err.message || "Failed to approve message");
    } finally {
      setApproving(false);
    }
  };

  // 4.5. Simulate Dry-Run Delivery
  const handleSimulateDelivery = async (messageId: string) => {
    try {
      setDelivering(true);
      setError(null);
      const res = await fetch(`/api/messages/${messageId}/deliver`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ forceDryRun: true }),
      });
      const json = await res.json();
      if (json.success) {
        setDryRunResult(json.data);
        await fetchLead();
      } else {
        setError(json.error || "Dry run delivery blocked by safety gate");
        if (json.data) {
          setDryRunResult(json.data);
        }
      }
    } catch (err: any) {
      setError(err.message || "Failed to simulate delivery");
    } finally {
      setDelivering(false);
    }
  };

  // 5. Save Edited Message
  const handleSaveEdit = async (messageId: string, approveAfter: boolean = false) => {
    try {
      setSavingEdit(true);
      const res = await fetch(`/api/messages/${messageId}/edit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          emailSubject: editSubject,
          emailBody: editEmailBody,
          whatsappBody: editWhatsappBody,
          followupBody: editFollowupBody,
          callToAction: editCallToAction,
          approveAfterEdit: approveAfter,
        }),
      });
      const json = await res.json();
      if (json.success) {
        setIsEditingMessage(false);
        await fetchLead();
      } else {
        setError(json.error || "Failed to save edits");
      }
    } catch (err: any) {
      setError(err.message || "Failed to save edits");
    } finally {
      setSavingEdit(false);
    }
  };

  // 6. Reject / Skip Message
  const handleRejectMessage = async (messageId: string) => {
    try {
      const res = await fetch(`/api/messages/${messageId}/reject`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: "Skipped by user in lead detail view" }),
      });
      const json = await res.json();
      if (json.success) {
        await fetchLead();
      } else {
        setError(json.error || "Failed to reject message");
      }
    } catch (err: any) {
      setError(err.message || "Failed to reject message");
    }
  };

  if (loading) {
    return (
      <div className="py-32 flex flex-col items-center justify-center space-y-4">
        <div className="w-8 h-8 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin" />
        <span className="text-sm font-medium text-slate-400">Loading intelligence profile...</span>
      </div>
    );
  }

  if (!lead) {
    return (
      <div className="text-center py-24 glass-card rounded-2xl p-12 max-w-md mx-auto space-y-4">
        <div className="w-12 h-12 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center mx-auto">
          <XCircle className="w-6 h-6" />
        </div>
        <h3 className="text-base font-semibold text-white">Lead Profile Not Found</h3>
        <p className="text-xs text-slate-400 leading-relaxed">
          The requested company ID could not be located in your database.
        </p>
        <Link href="/leads" className="inline-flex items-center space-x-2 text-xs font-medium text-indigo-400 hover:text-indigo-300 transition-colors pt-2">
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Return to Leads Directory</span>
        </Link>
      </div>
    );
  }

  const primaryContact = lead.contacts?.[0];
  const research = lead.research;
  const topOpportunity = lead.opportunities?.[0];
  const latestMessage = lead.messages?.[0];

  const digitalPresence = research?.digitalPresence || {};
  const evidenceMatrix = (research?.evidenceMatrix || []) as any[];
  const subPagesAudited = (research?.subPagesAudited || []) as any[];
  const qualityReport = latestMessage?.qualityReport || null;
  const evidenceUsed = (latestMessage?.evidenceUsed || []) as string[];

  const emailWordCount = (latestMessage?.emailBody || "").trim().split(/\s+/).filter(Boolean).length;
  const whatsappWordCount = (latestMessage?.whatsappBody || "").trim().split(/\s+/).filter(Boolean).length;

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-16">
      {/* Top Breadcrumb & Header Action Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-white/[0.06]">
        <div className="space-y-2">
          <Link
            href="/leads"
            className="inline-flex items-center space-x-1.5 text-xs font-medium text-slate-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Leads Directory</span>
          </Link>
          
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-white">
              {lead.name}
            </h1>
            <span
              className={`px-2.5 py-0.5 rounded-full text-[11px] font-medium border ${
                lead.status === "CONTACTED"
                  ? "badge-green"
                  : lead.status === "OPPORTUNITY_IDENTIFIED"
                  ? "badge-blue"
                  : lead.status === "RESEARCHED"
                  ? "badge-purple"
                  : "badge-gray"
              }`}
            >
              {lead.status.replace(/_/g, " ")}
            </span>
            {topOpportunity && (
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-medium badge-blue">
                {topOpportunity.service?.name || topOpportunity.suggestedOffer}
              </span>
            )}
          </div>
          
          <p className="text-xs text-slate-400 flex items-center space-x-2">
            <span>{lead.industry || "General Commercial"}</span>
            <span>&bull;</span>
            <span>{lead.city || lead.location || "UAE"}</span>
            <span>&bull;</span>
            <span>Added {new Date(lead.createdAt).toLocaleDateString()}</span>
          </p>
        </div>

        {/* Global Action Buttons */}
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={handleRunResearch}
            disabled={researching}
            className="btn-secondary text-xs flex items-center space-x-2 py-2 px-4 shadow-sm"
          >
            <Sparkles className={`w-3.5 h-3.5 text-indigo-400 ${researching ? "animate-spin" : ""}`} />
            <span>{researching ? "Analyzing Digital Presence..." : "Run Deep Research"}</span>
          </button>

          {topOpportunity && !latestMessage && (
            <button
              onClick={handleGenerateMessage}
              disabled={generating}
              className="btn-primary text-xs flex items-center space-x-2 py-2 px-4 shadow-sm"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{generating ? "Drafting Pitch..." : "Generate Outreach"}</span>
            </button>
          )}
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{error}</span>
          </div>
          <button onClick={() => setError(null)} className="text-xs font-medium text-rose-400 hover:text-white">
            Dismiss
          </button>
        </div>
      )}

      {/* Executive Strategy Hero Banner */}
      {topOpportunity && (
        <div className="glass-card rounded-2xl p-6 sm:p-7 relative overflow-hidden border-white/[0.08] shadow-xl">
          <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-bl from-indigo-500/10 via-purple-500/5 to-transparent rounded-full blur-3xl pointer-events-none" />

          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 border-b border-white/[0.06] pb-6 relative z-10">
            <div className="space-y-1.5 max-w-2xl">
              <div className="flex items-center space-x-2">
                <Target className="w-4 h-4 text-indigo-400" />
                <span className="text-[11px] font-semibold text-indigo-400 tracking-wide uppercase">
                  Identified Growth Angle & Primary Pain Point
                </span>
              </div>
              <h2 className="text-lg sm:text-xl font-semibold text-white leading-relaxed">
                {topOpportunity.reasonToContact || topOpportunity.primaryPainPoint}
              </h2>
            </div>

            {/* Score Indicators */}
            <div className="flex items-center space-x-3 shrink-0">
              <div className="px-4 py-2.5 rounded-xl bg-white/[0.03] border border-white/[0.08] text-right">
                <span className="text-[10px] text-slate-400 font-medium block uppercase tracking-wider">
                  Opportunity Score
                </span>
                <span className="text-2xl font-semibold text-amber-300 tracking-tight">
                  {topOpportunity.opportunityScore}
                  <span className="text-xs text-slate-500 font-normal">/100</span>
                </span>
              </div>
              <div className="px-4 py-2.5 rounded-xl bg-white/[0.03] border border-white/[0.08] text-right">
                <span className="text-[10px] text-slate-400 font-medium block uppercase tracking-wider">
                  Confidence
                </span>
                <span className="text-2xl font-semibold text-indigo-300 tracking-tight">
                  {topOpportunity.confidenceScore}
                  <span className="text-xs text-slate-500 font-normal">/100</span>
                </span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-5 relative z-10 text-xs">
            <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.04] space-y-1">
              <span className="text-[11px] text-slate-400 font-medium block">
                Tailored Service Offer
              </span>
              <p className="text-sm font-semibold text-white">
                {topOpportunity.suggestedOffer || topOpportunity.service?.name}
              </p>
            </div>

            <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.04] space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-[11px] text-slate-400 font-medium block">
                  Expected Impact
                </span>
                <span
                  className={`text-[9px] px-1.5 py-0.5 rounded font-medium ${
                    topOpportunity.claimType === "VERIFIED_FACT"
                      ? "badge-green"
                      : topOpportunity.claimType === "INFERRED_INSIGHT"
                      ? "badge-blue"
                      : "badge-amber"
                  }`}
                >
                  {topOpportunity.claimType || "ESTIMATE"}
                </span>
              </div>
              <p className="text-xs font-medium text-emerald-400">
                {topOpportunity.expectedBusinessBenefit || topOpportunity.potentialImpact}
              </p>
            </div>

            <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.04] space-y-1">
              <span className="text-[11px] text-slate-400 font-medium block">
                Estimated Project Scope ({topOpportunity.currency || "USD"})
              </span>
              <p className="text-sm font-semibold text-indigo-300">
                {(topOpportunity.currency === "INR" ? "₹" : (topOpportunity.currency === "USD" ? "$" : (topOpportunity.currency === "GBP" ? "£" : (topOpportunity.currency === "EUR" ? "€" : `${topOpportunity.currency || "AED"} `))))}
                {Number(topOpportunity.estimatedBudgetMin).toLocaleString()} –{" "}
                {(topOpportunity.currency === "INR" ? "₹" : (topOpportunity.currency === "USD" ? "$" : (topOpportunity.currency === "GBP" ? "£" : (topOpportunity.currency === "EUR" ? "€" : `${topOpportunity.currency || "AED"} `))))}
                {Number(topOpportunity.estimatedBudgetMax).toLocaleString()}
                <span className="text-[11px] text-slate-500 font-normal ml-1">(Estimated)</span>
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Main Two-Column Side-by-Side Review Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* LEFT COLUMN: Diagnostic Context & Evidence Provenance (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* Company & Contact Profile */}
          <div className="glass-card rounded-2xl p-5 space-y-4">
            <div className="flex items-center space-x-2 text-white">
              <Building2 className="w-4 h-4 text-indigo-400" />
              <h2 className="text-sm font-semibold">Company Profile</h2>
            </div>

            <div className="space-y-3 text-xs text-slate-300">
              <div className="flex items-center justify-between p-3 rounded-xl bg-white/[0.02] border border-white/[0.04]">
                <div className="flex items-center space-x-2 truncate">
                  <Globe className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  {lead.domain ? (
                    <a
                      href={lead.domain.startsWith("http") ? lead.domain : `https://${lead.domain}`}
                      target="_blank"
                      rel="noreferrer"
                      className="text-indigo-400 hover:text-indigo-300 hover:underline truncate"
                    >
                      {lead.domain}
                    </a>
                  ) : (
                    <span className="text-slate-500">No Registered Website</span>
                  )}
                </div>
                {lead.domain && <ExternalLink className="w-3 h-3 text-slate-500 shrink-0 ml-2" />}
              </div>

              {primaryContact && (
                <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/[0.04] space-y-1.5">
                  <div className="text-[10px] font-medium text-slate-400 uppercase tracking-wider">Primary Contact</div>
                  <div className="text-xs font-semibold text-white">
                    {primaryContact.name || "Decision Maker"}
                  </div>
                  <div className="text-[11px] text-slate-400">{primaryContact.role || "Executive"}</div>
                  {primaryContact.email && (
                    <div className="text-[11px] text-indigo-400">{primaryContact.email}</div>
                  )}
                  {primaryContact.phone && (
                    <div className="text-[11px] text-slate-300 font-mono">{primaryContact.phone}</div>
                  )}
                </div>
              )}
            </div>

            {/* Digital Presence Signals */}
            {research && (
              <div className="space-y-3 pt-3 border-t border-white/[0.06]">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-slate-300">
                    Digital Audit Radar
                  </span>
                  <span
                    className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${
                      research.websiteStatus === "ONLINE"
                        ? "badge-green"
                        : "badge-rose"
                    }`}
                  >
                    {research.websiteStatus} ({research.websiteScore}/100)
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-[11px]">
                  <div className="p-2.5 rounded-xl bg-white/[0.02] border border-white/[0.04] flex items-center justify-between">
                    <span className="text-slate-400">HTTPS / SSL</span>
                    <span
                      className={`text-[10px] font-semibold ${
                        digitalPresence.hasHttps ? "text-emerald-400" : "text-rose-400"
                      }`}
                    >
                      {digitalPresence.hasHttps ? "Secure" : "Insecure"}
                    </span>
                  </div>

                  <div className="p-2.5 rounded-xl bg-white/[0.02] border border-white/[0.04] flex items-center justify-between">
                    <span className="text-slate-400">Mobile Ready</span>
                    <span
                      className={`text-[10px] font-semibold ${
                        digitalPresence.hasMobileViewport ? "text-emerald-400" : "text-amber-400"
                      }`}
                    >
                      {digitalPresence.hasMobileViewport ? "Optimized" : "Broken"}
                    </span>
                  </div>

                  <div className="p-2.5 rounded-xl bg-white/[0.02] border border-white/[0.04] flex items-center justify-between">
                    <span className="text-slate-400">WhatsApp Link</span>
                    <span
                      className={`text-[10px] font-semibold ${
                        digitalPresence.hasWhatsapp ? "text-emerald-400" : "text-slate-500"
                      }`}
                    >
                      {digitalPresence.hasWhatsapp ? "Active" : "None"}
                    </span>
                  </div>

                  <div className="p-2.5 rounded-xl bg-white/[0.02] border border-white/[0.04] flex items-center justify-between">
                    <span className="text-slate-400">Contact Form</span>
                    <span
                      className={`text-[10px] font-semibold ${
                        digitalPresence.hasContactForm ? "text-emerald-400" : "text-amber-400"
                      }`}
                    >
                      {digitalPresence.hasContactForm ? "Present" : "Missing"}
                    </span>
                  </div>
                </div>

                {/* Detected Tech Badges */}
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {digitalPresence.cms?.map((c: string, i: number) => (
                    <span key={i} className="px-2 py-0.5 rounded-md bg-indigo-500/10 border border-indigo-500/20 text-[10px] text-indigo-300">
                      CMS: {c}
                    </span>
                  ))}
                  {digitalPresence.chatWidgets?.map((cw: string, i: number) => (
                    <span key={i} className="px-2 py-0.5 rounded-md bg-amber-500/10 border border-amber-500/20 text-[10px] text-amber-300">
                      Chat: {cw}
                    </span>
                  ))}
                  {digitalPresence.bookingEngines?.map((be: string, i: number) => (
                    <span key={i} className="px-2 py-0.5 rounded-md bg-cyan-500/10 border border-cyan-500/20 text-[10px] text-cyan-300">
                      Booking: {be}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Evidence Provenance Panel */}
          <div className="glass-card rounded-2xl p-5 space-y-3.5 border-white/[0.08]">
            <div className="flex items-center justify-between border-b border-white/[0.06] pb-3">
              <div className="flex items-center space-x-2 text-white">
                <Info className="w-4 h-4 text-indigo-400" />
                <h2 className="text-sm font-semibold">Evidence Provenance</h2>
              </div>
              <span className="text-[10px] font-medium badge-purple">
                Anti-Hallucination
              </span>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed">
              Every outreach phrase is deterministically grounded in verified digital observations. No synthetic assumptions.
            </p>

            <div className="space-y-2 text-xs">
              {evidenceUsed.length > 0 ? (
                evidenceUsed.map((ev, idx) => (
                  <div key={idx} className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.04] text-slate-300 flex items-start space-x-2.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                    <span className="text-xs leading-relaxed">{ev}</span>
                  </div>
                ))
              ) : evidenceMatrix.length > 0 ? (
                evidenceMatrix.slice(0, 3).map((item, idx) => (
                  <div key={idx} className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.04] space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-slate-200">{item.observation}</span>
                      <span className={`text-[9px] px-1.5 py-0.5 rounded font-medium ${
                        item.truthTier === "VERIFIED" ? "badge-green" : "badge-blue"
                      }`}>{item.truthTier}</span>
                    </div>
                    <div className="text-[11px] text-slate-400">Anchor: {item.evidence}</div>
                  </div>
                ))
              ) : (
                <div className="text-slate-500 text-xs italic p-2">Run research to establish verified evidence anchors.</div>
              )}
            </div>
          </div>

          {/* Outreach Quality Scorecard */}
          {qualityReport && (
            <div className="glass-card rounded-2xl p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-white/[0.06] pb-3">
                <div className="flex items-center space-x-2 text-white">
                  <BarChart3 className="w-4 h-4 text-emerald-400" />
                  <h2 className="text-sm font-semibold">Quality Scorecard</h2>
                </div>
                <span
                  className={`text-xs font-semibold px-2.5 py-0.5 rounded-full border ${
                    qualityReport.passed
                      ? "badge-green"
                      : "badge-amber"
                  }`}
                >
                  Score: {qualityReport.overallScore}/100
                </span>
              </div>

              {/* Granular Breakdown */}
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="p-2.5 rounded-xl bg-white/[0.02] border border-white/[0.04] flex items-center justify-between">
                  <span className="text-slate-400">Grounding</span>
                  <span className="font-semibold text-emerald-400">{qualityReport.evidenceScore}%</span>
                </div>
                <div className="p-2.5 rounded-xl bg-white/[0.02] border border-white/[0.04] flex items-center justify-between">
                  <span className="text-slate-400">Safety</span>
                  <span className="font-semibold text-emerald-400">{qualityReport.claimSafetyScore}%</span>
                </div>
                <div className="p-2.5 rounded-xl bg-white/[0.02] border border-white/[0.04] flex items-center justify-between">
                  <span className="text-slate-400">Natural Tone</span>
                  <span className="font-semibold text-indigo-400">{qualityReport.naturalnessScore}%</span>
                </div>
                <div className="p-2.5 rounded-xl bg-white/[0.02] border border-white/[0.04] flex items-center justify-between">
                  <span className="text-slate-400">Brevity</span>
                  <span className="font-semibold text-blue-400">{qualityReport.brevityScore}%</span>
                </div>
              </div>

              {/* Detected Warnings */}
              {qualityReport.detectedIssues && qualityReport.detectedIssues.length > 0 && (
                <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 space-y-1 text-xs">
                  <div className="text-[10px] text-amber-400 font-semibold uppercase flex items-center space-x-1">
                    <AlertTriangle className="w-3 h-3 text-amber-400" />
                    <span>Suggestions for Reviewer:</span>
                  </div>
                  {qualityReport.detectedIssues.map((issue: string, i: number) => (
                    <p key={i} className="text-[11px] text-amber-200/90">&bull; {issue}</p>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Subpages Audited Coverage */}
          {subPagesAudited && subPagesAudited.length > 0 && (
            <div className="glass-card rounded-2xl p-5 space-y-3">
              <div className="flex items-center space-x-2 text-white">
                <Layers className="w-4 h-4 text-indigo-400" />
                <h2 className="text-sm font-semibold">Multi-Page Coverage ({subPagesAudited.length})</h2>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                {subPagesAudited.map((sub, idx) => (
                  <div key={idx} className="p-2.5 rounded-xl bg-white/[0.02] border border-white/[0.04] space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-semibold text-indigo-400 uppercase">{sub.pageType}</span>
                      <span className={`text-[9px] px-1.5 py-0.2 rounded font-medium ${
                        sub.isReachable ? "badge-green" : "badge-rose"
                      }`}>
                        {sub.isReachable ? `HTTP ${sub.statusCode}` : "ERR"}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-300 truncate" title={sub.title}>{sub.title || sub.url}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* RIGHT COLUMN: Multi-Channel Outreach Review Deck (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          <div className="glass-card rounded-2xl p-6 sm:p-7 space-y-6 border-white/[0.08]">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/[0.06] pb-5">
              <div>
                <div className="flex items-center space-x-2 text-white">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <h2 className="text-sm font-semibold">Multi-Channel Review Deck</h2>
                </div>
                <p className="text-xs text-slate-400 mt-1">
                  Human-verified outreach. No email or message is dispatched without manual review.
                </p>
              </div>

              {latestMessage && (
                <div className="flex items-center space-x-2">
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-medium border ${
                      latestMessage.status === "APPROVED"
                        ? "badge-green"
                        : latestMessage.status === "EDITED"
                        ? "badge-blue"
                        : latestMessage.status === "READY_FOR_REVIEW"
                        ? "badge-amber animate-pulse"
                        : "badge-gray"
                    }`}
                  >
                    {latestMessage.status.replace(/_/g, " ")}
                  </span>
                </div>
              )}
            </div>

            {!latestMessage ? (
              <div className="py-20 text-center text-slate-400 text-xs space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-white/[0.03] border border-white/[0.06] text-slate-400 flex items-center justify-center mx-auto">
                  <Mail className="w-6 h-6" />
                </div>
                <p className="text-slate-300 font-medium">No outreach message drafted yet.</p>
                {topOpportunity && (
                  <button
                    onClick={handleGenerateMessage}
                    disabled={generating}
                    className="btn-primary text-xs flex items-center space-x-2 mx-auto py-2.5 px-5 shadow-lg"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>{generating ? "Generating Pitch..." : "Generate Personalized Outreach"}</span>
                  </button>
                )}
              </div>
            ) : isEditingMessage ? (
              /* Inline Edit Mode */
              <div className="space-y-4 text-xs">
                <div className="flex items-center justify-between border-b border-white/[0.06] pb-3">
                  <span className="text-xs font-semibold text-white flex items-center space-x-1.5">
                    <Edit3 className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Edit Outreach Draft</span>
                  </span>
                  <span className="text-[10px] text-slate-400">Live Quality Recalculation</span>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] font-medium text-slate-400">Email Subject</label>
                  <input
                    type="text"
                    value={editSubject}
                    onChange={(e) => setEditSubject(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white/[0.02] border border-white/[0.08] text-xs text-white focus:outline-none focus:border-indigo-500 transition-colors"
                  />
                </div>

                <div className="space-y-1.5">
                  <div className="flex justify-between items-center">
                    <label className="text-[11px] font-medium text-slate-400">Email Body (Markdown)</label>
                    <span className="text-[10px] text-slate-500">
                      {editEmailBody.trim().split(/\s+/).filter(Boolean).length} words
                    </span>
                  </div>
                  <textarea
                    rows={6}
                    value={editEmailBody}
                    onChange={(e) => setEditEmailBody(e.target.value)}
                    className="w-full p-3.5 rounded-xl bg-white/[0.02] border border-white/[0.08] text-xs text-white focus:outline-none focus:border-indigo-500 font-mono leading-relaxed transition-colors"
                  />
                </div>

                <div className="space-y-1.5">
                  <div className="flex justify-between items-center">
                    <label className="text-[11px] font-medium text-slate-400">WhatsApp Message</label>
                    <span className="text-[10px] text-slate-500">
                      {editWhatsappBody.trim().split(/\s+/).filter(Boolean).length} words
                    </span>
                  </div>
                  <textarea
                    rows={3}
                    value={editWhatsappBody}
                    onChange={(e) => setEditWhatsappBody(e.target.value)}
                    className="w-full p-3.5 rounded-xl bg-white/[0.02] border border-white/[0.08] text-xs text-white focus:outline-none focus:border-indigo-500 font-mono leading-relaxed transition-colors"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] font-medium text-slate-400">Follow-up Message (4 Days Later)</label>
                  <textarea
                    rows={2}
                    value={editFollowupBody}
                    onChange={(e) => setEditFollowupBody(e.target.value)}
                    className="w-full p-3.5 rounded-xl bg-white/[0.02] border border-white/[0.08] text-xs text-white focus:outline-none focus:border-indigo-500 font-mono transition-colors"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] font-medium text-slate-400">Call to Action (CTA)</label>
                  <input
                    type="text"
                    value={editCallToAction}
                    onChange={(e) => setEditCallToAction(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white/[0.02] border border-white/[0.08] text-xs text-white focus:outline-none focus:border-indigo-500 transition-colors"
                  />
                </div>

                <div className="flex items-center space-x-3 pt-3 border-t border-white/[0.06]">
                  <button
                    onClick={() => handleSaveEdit(latestMessage.id, true)}
                    disabled={savingEdit}
                    className="btn-primary text-xs flex items-center space-x-1.5 py-2 px-4"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Save & Approve</span>
                  </button>
                  <button
                    onClick={() => handleSaveEdit(latestMessage.id, false)}
                    disabled={savingEdit}
                    className="btn-secondary text-xs py-2 px-4"
                  >
                    Save Changes as Edited
                  </button>
                  <button
                    onClick={() => setIsEditingMessage(false)}
                    className="text-xs text-slate-400 hover:text-white px-3 py-2 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              /* Multi-Channel Side-by-Side Review Deck */
              <div className="space-y-6 text-xs">
                
                {/* 1. Primary Email Channel Card */}
                <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/[0.06] space-y-4">
                  <div className="flex items-center justify-between border-b border-white/[0.06] pb-3">
                    <div className="flex items-center space-x-2">
                      <Mail className="w-4 h-4 text-indigo-400" />
                      <span className="text-xs font-semibold text-white">
                        Email Outreach Channel
                      </span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/[0.04] text-slate-400">
                        {emailWordCount} words
                      </span>
                    </div>

                    <button
                      onClick={() =>
                        copyToClipboard(
                          `Subject: ${latestMessage.emailSubject}\n\n${latestMessage.emailBody}`,
                          "email"
                        )
                      }
                      className="text-xs text-slate-400 hover:text-white flex items-center space-x-1.5 transition-colors"
                    >
                      {copiedField === "email" ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                          <span className="text-emerald-400 font-medium">Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>Copy Email</span>
                        </>
                      )}
                    </button>
                  </div>

                  {/* Email Subject Line */}
                  <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.04] flex items-center space-x-3">
                    <span className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">Subject</span>
                    <span className="font-medium text-slate-200 text-xs">
                      {latestMessage.emailSubject}
                    </span>
                  </div>

                  {/* Email Body */}
                  <div className="p-4 rounded-xl bg-white/[0.015] border border-white/[0.04] whitespace-pre-line text-slate-300 text-xs leading-relaxed font-sans">
                    {latestMessage.emailBody}
                  </div>

                  {/* Follow-up Teaser */}
                  {latestMessage.followupBody && (
                    <div className="p-3.5 rounded-xl bg-indigo-500/5 border border-indigo-500/10 space-y-1">
                      <span className="text-[10px] font-medium text-indigo-400 block uppercase tracking-wider">
                        Automated Follow-Up (4 Days Later)
                      </span>
                      <p className="text-[11px] text-slate-300 leading-relaxed">
                        {latestMessage.followupBody}
                      </p>
                    </div>
                  )}
                </div>

                {/* 2. Direct WhatsApp Channel Card */}
                {latestMessage.whatsappBody && (
                  <div className="p-5 rounded-2xl bg-emerald-500/[0.02] border border-emerald-500/20 space-y-4">
                    <div className="flex items-center justify-between border-b border-emerald-500/10 pb-3">
                      <div className="flex items-center space-x-2">
                        <MessageSquare className="w-4 h-4 text-emerald-400" />
                        <span className="text-xs font-semibold text-emerald-300">
                          WhatsApp Direct Message
                        </span>
                        <span className="text-[10px] px-2 py-0.5 rounded-full badge-green">
                          {whatsappWordCount} words
                        </span>
                      </div>

                      <button
                        onClick={() => copyToClipboard(latestMessage.whatsappBody, "whatsapp")}
                        className="text-xs text-emerald-400 hover:text-emerald-300 flex items-center space-x-1.5 transition-colors"
                      >
                        {copiedField === "whatsapp" ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-emerald-400" />
                            <span className="text-emerald-400 font-medium">Copied</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5" />
                            <span>Copy WhatsApp</span>
                          </>
                        )}
                      </button>
                    </div>

                    {/* WhatsApp Chat Bubble */}
                    <div className="p-4 rounded-2xl bg-emerald-950/30 border border-emerald-500/20 text-xs text-slate-200 leading-relaxed max-w-lg shadow-sm">
                      {latestMessage.whatsappBody}
                      <div className="text-[10px] text-emerald-400/80 text-right mt-2 flex items-center justify-end space-x-1">
                        <span>Read</span>
                        <CheckCheck className="w-3 h-3 text-emerald-400" />
                      </div>
                    </div>
                  </div>
                )}

                {/* 3. Strategic Building Blocks Summary */}
                <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.04] text-xs text-slate-400 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Outreach Angle</span>
                    <span className="text-slate-200 font-medium">
                      {latestMessage.outreachAngle || topOpportunity?.pitchAngle || "Direct Value Proposition"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Call to Action</span>
                    <span className="text-emerald-400 font-medium">{latestMessage.callToAction}</span>
                  </div>
                </div>

                {/* 4. Human Review & Approval Action Bar */}
                <div className="flex flex-wrap items-center justify-between gap-4 pt-3 border-t border-white/[0.06]">
                  <div className="flex flex-wrap items-center gap-3">
                    {latestMessage.status !== "APPROVED" ? (
                      <button
                        onClick={() => handleApproveMessage(latestMessage.id)}
                        disabled={approving}
                        className="btn-primary text-xs flex items-center space-x-2 py-2 px-5 shadow-sm"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>{approving ? "Approving..." : "Approve Outreach"}</span>
                      </button>
                    ) : (
                      <div className="flex items-center space-x-2.5">
                        <span className="px-3.5 py-2 rounded-xl badge-green text-xs font-semibold flex items-center space-x-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                          <span>Approved</span>
                        </span>
                        <button
                          onClick={() => handleSimulateDelivery(latestMessage.id)}
                          disabled={delivering}
                          className="btn-primary text-xs flex items-center space-x-1.5 py-2 px-4 shadow-sm"
                        >
                          <Zap className={`w-3.5 h-3.5 ${delivering ? "animate-spin" : ""}`} />
                          <span>{delivering ? "Testing Safety Gate..." : "Simulate Dry-Run"}</span>
                        </button>
                      </div>
                    )}

                    <button
                      onClick={() => setIsEditingMessage(true)}
                      className="btn-secondary text-xs flex items-center space-x-1.5 py-2 px-4"
                    >
                      <Edit3 className="w-3.5 h-3.5 text-indigo-400" />
                      <span>Edit Copy</span>
                    </button>

                    <button
                      onClick={() => handleRegenerateMessage(latestMessage.id)}
                      disabled={regenerating}
                      className="btn-secondary text-xs flex items-center space-x-1.5 py-2 px-4 text-slate-400 hover:text-white"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${regenerating ? "animate-spin" : ""}`} />
                      <span>{regenerating ? "Regenerating..." : "Regenerate"}</span>
                    </button>
                  </div>

                  {latestMessage.status !== "APPROVED" && (
                    <button
                      onClick={() => handleRejectMessage(latestMessage.id)}
                      className="text-xs text-slate-400 hover:text-rose-400 transition-colors font-medium px-2 py-1"
                    >
                      Reject / Skip
                    </button>
                  )}
                </div>

                {/* Dry-Run Delivery Inspection Card */}
                {dryRunResult && (
                  <div className="p-5 rounded-2xl bg-white/[0.02] border border-indigo-500/30 shadow-xl space-y-3.5 mt-4 text-xs">
                    <div className="flex items-center justify-between border-b border-white/[0.06] pb-2.5">
                      <div className="flex items-center space-x-2">
                        <Zap className="w-4 h-4 text-indigo-400" />
                        <span className="font-semibold text-white">
                          Simulated Dry-Run Receipt
                        </span>
                      </div>
                      <span className="text-[10px] px-2 py-0.5 rounded-full badge-blue">
                        Zero External Dispatch
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="p-2.5 rounded-xl bg-white/[0.02] border border-white/[0.04]">
                        <span className="text-slate-400 block text-[10px] uppercase">Destination</span>
                        <span className="text-slate-200 font-medium">
                          {dryRunResult.safetyCheck?.destination || "N/A"}
                        </span>
                      </div>
                      <div className="p-2.5 rounded-xl bg-white/[0.02] border border-white/[0.04]">
                        <span className="text-slate-400 block text-[10px] uppercase">Provider</span>
                        <span className="text-indigo-400 font-medium">
                          {dryRunResult.provider} ({dryRunResult.status})
                        </span>
                      </div>
                      <div className="p-2.5 rounded-xl bg-white/[0.02] border border-white/[0.04] col-span-2">
                        <span className="text-slate-400 block text-[10px] uppercase">SHA-256 Idempotency Key</span>
                        <span className="text-slate-400 text-[11px] font-mono truncate block">
                          {dryRunResult.idempotencyKey}
                        </span>
                      </div>
                    </div>

                    <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs space-y-1">
                      <span className="font-semibold flex items-center space-x-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Safety Gate Verification Passed</span>
                      </span>
                      <p className="text-slate-300 text-[11px]">
                        Message Approved &bull; Valid Destination &bull; No Suppressions &bull; No Duplicate Outreach &bull; Rate Limit Permitted.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
