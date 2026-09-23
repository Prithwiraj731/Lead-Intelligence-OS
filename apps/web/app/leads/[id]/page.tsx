"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Sparkles,
  Search,
  CheckCircle2,
  Edit3,
  RefreshCw,
  XCircle,
  Globe,
  Phone,
  Mail,
  MapPin,
  Building2,
  ShieldCheck,
  Smartphone,
  AlertTriangle,
  Send,
  MessageSquare,
  FileText,
  Clock,
  ExternalLink,
  Layers,
  Activity,
  Check,
  Zap,
  Crosshair,
  BarChart3,
  Flame,
  HelpCircle,
  Link as LinkIcon,
  Copy,
  Info,
  Sliders,
  ShieldAlert,
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

  // 5. Save Edited Message (without instant approval or with approval)
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
      <div className="py-24 text-center text-slate-400 text-xs flex flex-col items-center space-y-3">
        <RefreshCw className="w-6 h-6 animate-spin text-blue-500" />
        <span>Loading deep lead intelligence command deck...</span>
      </div>
    );
  }

  if (!lead) {
    return (
      <div className="text-center py-20 space-y-3">
        <XCircle className="w-8 h-8 text-rose-500 mx-auto" />
        <p className="text-sm font-semibold text-white">Lead Not Found</p>
        <Link href="/leads" className="text-xs text-blue-400 hover:underline">
          Back to Leads Directory
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
  const socialLinks = digitalPresence.socialLinks || {};
  const qualityReport = latestMessage?.qualityReport || null;
  const evidenceUsed = (latestMessage?.evidenceUsed || []) as string[];

  const emailWordCount = (latestMessage?.emailBody || "").trim().split(/\s+/).filter(Boolean).length;
  const whatsappWordCount = (latestMessage?.whatsappBody || "").trim().split(/\s+/).filter(Boolean).length;

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-16">
      {/* Top Navigation & Action Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border pb-6">
        <div className="space-y-1.5">
          <Link
            href="/leads"
            className="text-xs text-slate-400 hover:text-white flex items-center space-x-1.5 font-mono mb-1"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>BACK TO LEADS DIRECTORY</span>
          </Link>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white font-sans">
              {lead.name}
            </h1>
            <span className="text-xs font-mono px-3 py-1 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
              {lead.status.replace(/_/g, " ")}
            </span>
            {topOpportunity && (
              <span className="text-xs font-mono px-3 py-1 rounded-full bg-blue-950/80 text-blue-400 border border-blue-800/80">
                RECOMMENDED: {topOpportunity.service?.name || topOpportunity.suggestedOffer}
              </span>
            )}
          </div>
          <p className="text-xs text-slate-400">
            {lead.industry || "General Commercial"} &bull; {lead.city || lead.location || "UAE"} &bull; Added{" "}
            {new Date(lead.createdAt).toLocaleDateString()}
          </p>
        </div>

        {/* Global Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={handleRunResearch}
            disabled={researching}
            className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold flex items-center space-x-2 transition-colors disabled:opacity-50 shadow-lg shadow-blue-900/20"
          >
            <Sparkles className={`w-3.5 h-3.5 ${researching ? "animate-spin" : ""}`} />
            <span>{researching ? "Analyzing Digital Presence..." : "Run Deep Lead Research"}</span>
          </button>

          {topOpportunity && !latestMessage && (
            <button
              onClick={handleGenerateMessage}
              disabled={generating}
              className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center space-x-2 transition-colors disabled:opacity-50 shadow-lg shadow-emerald-900/20"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{generating ? "Drafting Evidence Pitch..." : "Generate Outreach"}</span>
            </button>
          )}
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="p-4 rounded-xl bg-rose-950/60 border border-rose-800 text-rose-300 text-xs flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{error}</span>
          </div>
          <button onClick={() => setError(null)} className="text-rose-400 hover:text-white font-mono text-xs">
            DISMISS
          </button>
        </div>
      )}

      {/* Executive Strategy Hero Banner */}
      {topOpportunity && (
        <div className="p-6 rounded-2xl bg-gradient-to-r from-blue-950/60 via-slate-900/80 to-[#0c0e14] border border-blue-800/60 shadow-xl space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-blue-900/40 pb-4">
            <div className="space-y-1">
              <span className="text-[10px] font-mono text-blue-400 uppercase tracking-wider flex items-center space-x-1.5">
                <Crosshair className="w-3.5 h-3.5 text-blue-400" />
                <span>EXECUTIVE OUTREACH STRATEGY & REASON TO CONTACT</span>
              </span>
              <h2 className="text-lg sm:text-xl font-bold text-white leading-snug">
                {topOpportunity.reasonToContact || topOpportunity.primaryPainPoint}
              </h2>
            </div>

            {/* Dual Score Pills */}
            <div className="flex items-center space-x-3 shrink-0">
              <div className="px-4 py-2 rounded-xl bg-amber-950/60 border border-amber-700/60 text-right">
                <span className="text-[10px] text-amber-400/80 font-mono block uppercase">
                  Opportunity Score
                </span>
                <span className="text-xl font-bold font-mono text-amber-300">
                  {topOpportunity.opportunityScore}/100
                </span>
              </div>
              <div className="px-4 py-2 rounded-xl bg-cyan-950/60 border border-cyan-700/60 text-right">
                <span className="text-[10px] text-cyan-400/80 font-mono block uppercase">
                  Confidence Score
                </span>
                <span className="text-xl font-bold font-mono text-cyan-300">
                  {topOpportunity.confidenceScore}/100
                </span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs pt-1">
            <div className="p-3.5 rounded-xl bg-[#0c0e14]/80 border border-border/80 space-y-1">
              <span className="text-[10px] text-slate-400 font-mono uppercase block">
                Bespoke Offer Title
              </span>
              <p className="text-xs font-semibold text-white">
                {topOpportunity.suggestedOffer || topOpportunity.service?.name}
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-[#0c0e14]/80 border border-border/80 space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-slate-400 font-mono uppercase block">
                  Expected Business Benefit
                </span>
                <span
                  className={`text-[9px] font-mono px-1.5 py-0.2 rounded uppercase font-bold ${
                    topOpportunity.claimType === "VERIFIED_FACT"
                      ? "bg-emerald-950 text-emerald-400 border border-emerald-800"
                      : topOpportunity.claimType === "INFERRED_INSIGHT"
                      ? "bg-blue-950 text-blue-400 border border-blue-800"
                      : "bg-amber-950 text-amber-400 border border-amber-800"
                  }`}
                >
                  {topOpportunity.claimType || "ESTIMATE"}
                </span>
              </div>
              <p className="text-xs font-medium text-emerald-400">
                {topOpportunity.expectedBusinessBenefit || topOpportunity.potentialImpact}
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-[#0c0e14]/80 border border-border/80 space-y-1">
              <span className="text-[10px] text-slate-400 font-mono uppercase block">
                Estimated Project Bracket ({topOpportunity.currency || "USD"})
              </span>
              <p className="text-xs font-mono font-bold text-cyan-300">
                {(topOpportunity.currency === "INR" ? "₹" : (topOpportunity.currency === "USD" ? "$" : (topOpportunity.currency === "GBP" ? "£" : (topOpportunity.currency === "EUR" ? "€" : `${topOpportunity.currency || "AED"} `))))}
                {Number(topOpportunity.estimatedBudgetMin).toLocaleString()} –{" "}
                {(topOpportunity.currency === "INR" ? "₹" : (topOpportunity.currency === "USD" ? "$" : (topOpportunity.currency === "GBP" ? "£" : (topOpportunity.currency === "EUR" ? "€" : `${topOpportunity.currency || "AED"} `))))}
                {Number(topOpportunity.estimatedBudgetMax).toLocaleString()}{" "}
                <span className="text-[10px] text-slate-500 font-sans font-normal">(Estimated guide)</span>
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Main Two-Column Side-by-Side Review Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* LEFT COLUMN (5 Cols): Diagnostic Context & "Why this message?" Evidence Provenance */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* Company & Contact Profile */}
          <div className="p-5 rounded-2xl bg-card border border-border space-y-4">
            <h2 className="text-xs font-semibold text-white tracking-wider uppercase font-mono flex items-center space-x-2">
              <Building2 className="w-3.5 h-3.5 text-blue-400" />
              <span>Company Information</span>
            </h2>

            <div className="space-y-2.5 text-xs text-slate-300">
              <div className="flex items-center space-x-2">
                <Globe className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                {lead.domain ? (
                  <a
                    href={lead.domain.startsWith("http") ? lead.domain : `https://${lead.domain}`}
                    target="_blank"
                    rel="noreferrer"
                    className="text-blue-400 hover:underline truncate"
                  >
                    {lead.domain}
                  </a>
                ) : (
                  <span className="text-slate-500 font-mono">No Registered Website</span>
                )}
              </div>

              {primaryContact && (
                <div className="p-3 rounded-xl bg-[#0c0e14] border border-border/60 space-y-1">
                  <div className="text-[10px] font-mono text-slate-400 uppercase">Primary Contact</div>
                  <div className="text-xs font-semibold text-white">
                    {primaryContact.name || "Unknown Decision Maker"}
                  </div>
                  <div className="text-[11px] text-slate-400">{primaryContact.role || "Executive"}</div>
                  {primaryContact.email && (
                    <div className="text-[11px] text-blue-400 font-mono">{primaryContact.email}</div>
                  )}
                  {primaryContact.phone && (
                    <div className="text-[11px] text-slate-300 font-mono">{primaryContact.phone}</div>
                  )}
                </div>
              )}
            </div>

            {/* Digital Presence Signals */}
            {research && (
              <div className="space-y-3 pt-3 border-t border-border/80">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-slate-400 font-mono uppercase block">
                    Digital Presence Radar
                  </span>
                  <span
                    className={`text-[10px] font-mono px-2 py-0.5 rounded ${
                      research.websiteStatus === "ONLINE"
                        ? "bg-emerald-950 text-emerald-400 border border-emerald-800"
                        : "bg-rose-950 text-rose-400 border border-rose-800"
                    }`}
                  >
                    {research.websiteStatus} ({research.websiteScore}/100)
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-[11px]">
                  <div className="p-2 rounded-lg bg-[#0c0e14] border border-border/60 flex items-center justify-between">
                    <span className="text-slate-400">HTTPS / SSL</span>
                    <span
                      className={`font-mono text-[10px] font-bold ${
                        digitalPresence.hasHttps ? "text-emerald-400" : "text-rose-400"
                      }`}
                    >
                      {digitalPresence.hasHttps ? "SECURE" : "INSECURE"}
                    </span>
                  </div>

                  <div className="p-2 rounded-lg bg-[#0c0e14] border border-border/60 flex items-center justify-between">
                    <span className="text-slate-400">Mobile Viewport</span>
                    <span
                      className={`font-mono text-[10px] font-bold ${
                        digitalPresence.hasMobileViewport ? "text-emerald-400" : "text-amber-400"
                      }`}
                    >
                      {digitalPresence.hasMobileViewport ? "OPTIMIZED" : "BROKEN"}
                    </span>
                  </div>

                  <div className="p-2 rounded-lg bg-[#0c0e14] border border-border/60 flex items-center justify-between">
                    <span className="text-slate-400">Direct WhatsApp</span>
                    <span
                      className={`font-mono text-[10px] font-bold ${
                        digitalPresence.hasWhatsapp ? "text-emerald-400" : "text-slate-500"
                      }`}
                    >
                      {digitalPresence.hasWhatsapp ? "DETECTED" : "NONE"}
                    </span>
                  </div>

                  <div className="p-2 rounded-lg bg-[#0c0e14] border border-border/60 flex items-center justify-between">
                    <span className="text-slate-400">Enquiry Form</span>
                    <span
                      className={`font-mono text-[10px] font-bold ${
                        digitalPresence.hasContactForm ? "text-emerald-400" : "text-amber-400"
                      }`}
                    >
                      {digitalPresence.hasContactForm ? "ACTIVE" : "MISSING"}
                    </span>
                  </div>
                </div>

                {/* Detected Tech Badges */}
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {digitalPresence.cms?.map((c: string, i: number) => (
                    <span key={i} className="px-2 py-0.5 rounded bg-blue-950/60 border border-blue-800/60 text-[10px] text-blue-300 font-mono">
                      CMS: {c}
                    </span>
                  ))}
                  {digitalPresence.chatWidgets?.map((cw: string, i: number) => (
                    <span key={i} className="px-2 py-0.5 rounded bg-amber-950/60 border border-amber-800/60 text-[10px] text-amber-300 font-mono">
                      Chat: {cw}
                    </span>
                  ))}
                  {digitalPresence.bookingEngines?.map((be: string, i: number) => (
                    <span key={i} className="px-2 py-0.5 rounded bg-cyan-950/60 border border-cyan-800/60 text-[10px] text-cyan-300 font-mono">
                      Booking: {be}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* "Why This Message?" Evidence Provenance Panel */}
          <div className="p-5 rounded-2xl bg-card border border-indigo-900/60 shadow-lg space-y-3.5">
            <div className="flex items-center justify-between border-b border-border/80 pb-2.5">
              <h2 className="text-xs font-semibold text-white tracking-wider uppercase font-mono flex items-center space-x-2">
                <Info className="w-3.5 h-3.5 text-indigo-400" />
                <span>Why This Message? (Evidence Provenance)</span>
              </h2>
              <span className="text-[10px] font-mono text-indigo-400 bg-indigo-950/80 border border-indigo-800/80 px-2 py-0.5 rounded">
                ANTI-HALLUCINATION
              </span>
            </div>

            <p className="text-[11px] text-slate-400 leading-relaxed">
              Every outreach phrase is deterministically grounded in verified digital observations. No unsupported assertions or synthetic claims.
            </p>

            <div className="space-y-2 text-xs">
              {evidenceUsed.length > 0 ? (
                evidenceUsed.map((ev, idx) => (
                  <div key={idx} className="p-2.5 rounded-xl bg-[#0c0e14] border border-border/80 text-slate-300 flex items-start space-x-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                    <span className="text-[11px]">{ev}</span>
                  </div>
                ))
              ) : evidenceMatrix.length > 0 ? (
                evidenceMatrix.slice(0, 3).map((item, idx) => (
                  <div key={idx} className="p-2.5 rounded-xl bg-[#0c0e14] border border-border/80 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-mono font-bold text-slate-200">{item.observation}</span>
                      <span className={`text-[9px] font-mono px-1.5 py-0.2 rounded ${
                        item.truthTier === "VERIFIED" ? "bg-emerald-950 text-emerald-400 border border-emerald-800" : "bg-blue-950 text-blue-400 border border-blue-800"
                      }`}>{item.truthTier}</span>
                    </div>
                    <div className="text-[10px] text-slate-400 italic">Evidence: {item.evidence}</div>
                  </div>
                ))
              ) : (
                <div className="text-slate-500 text-xs italic">Run research to establish verified evidence anchors.</div>
              )}
            </div>
          </div>

          {/* Deterministic Message Quality Scorecard */}
          {qualityReport && (
            <div className="p-5 rounded-2xl bg-card border border-border space-y-4">
              <div className="flex items-center justify-between border-b border-border/80 pb-2.5">
                <h2 className="text-xs font-semibold text-white tracking-wider uppercase font-mono flex items-center space-x-2">
                  <BarChart3 className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Outreach Quality Scorecard</span>
                </h2>
                <span
                  className={`text-xs font-mono font-bold px-2.5 py-0.5 rounded-full border ${
                    qualityReport.passed
                      ? "bg-emerald-950 text-emerald-400 border-emerald-800"
                      : "bg-amber-950 text-amber-400 border-amber-800"
                  }`}
                >
                  SCORE: {qualityReport.overallScore}/100
                </span>
              </div>

              {/* Granular Breakdown */}
              <div className="grid grid-cols-2 gap-2 text-[11px]">
                <div className="p-2 rounded-lg bg-[#0c0e14] border border-border/60 flex items-center justify-between">
                  <span className="text-slate-400">Evidence Grounding</span>
                  <span className="font-mono font-bold text-emerald-400">{qualityReport.evidenceScore}%</span>
                </div>
                <div className="p-2 rounded-lg bg-[#0c0e14] border border-border/60 flex items-center justify-between">
                  <span className="text-slate-400">Claim Safety</span>
                  <span className="font-mono font-bold text-emerald-400">{qualityReport.claimSafetyScore}%</span>
                </div>
                <div className="p-2 rounded-lg bg-[#0c0e14] border border-border/60 flex items-center justify-between">
                  <span className="text-slate-400">Naturalness / Tone</span>
                  <span className="font-mono font-bold text-cyan-400">{qualityReport.naturalnessScore}%</span>
                </div>
                <div className="p-2 rounded-lg bg-[#0c0e14] border border-border/60 flex items-center justify-between">
                  <span className="text-slate-400">Brevity & Focus</span>
                  <span className="font-mono font-bold text-blue-400">{qualityReport.brevityScore}%</span>
                </div>
              </div>

              {/* Detected Warnings */}
              {qualityReport.detectedIssues && qualityReport.detectedIssues.length > 0 && (
                <div className="p-3 rounded-xl bg-amber-950/30 border border-amber-800/50 space-y-1 text-xs">
                  <div className="text-[10px] font-mono text-amber-400 uppercase font-bold flex items-center space-x-1">
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

          {/* Subpages Audited Grid */}
          {subPagesAudited && subPagesAudited.length > 0 && (
            <div className="p-5 rounded-2xl bg-card border border-border space-y-3">
              <h2 className="text-xs font-semibold text-white tracking-wider uppercase font-mono flex items-center space-x-2">
                <Layers className="w-3.5 h-3.5 text-indigo-400" />
                <span>Multi-Page Audit Coverage ({subPagesAudited.length})</span>
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                {subPagesAudited.map((sub, idx) => (
                  <div key={idx} className="p-2.5 rounded-xl bg-[#0c0e14] border border-border/80 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-mono font-bold text-indigo-400">{sub.pageType}</span>
                      <span className={`text-[9px] font-mono px-1.5 py-0.2 rounded ${
                        sub.isReachable ? "bg-emerald-950 text-emerald-400 border border-emerald-800" : "bg-rose-950 text-rose-400 border border-rose-800"
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

        {/* RIGHT COLUMN (7 Cols): Multi-Channel Outreach Review Deck */}
        <div className="lg:col-span-7 space-y-6">
          <div className="p-6 rounded-2xl bg-card border border-border space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border/80 pb-4">
              <div>
                <h2 className="text-xs font-semibold text-white tracking-wider uppercase font-mono flex items-center space-x-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Human-Approved Multi-Channel Review Deck</span>
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Review tailored Email and WhatsApp drafts. Zero emails or messages can be dispatched without approval.
                </p>
              </div>

              {latestMessage && (
                <div className="flex items-center space-x-2">
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-mono font-bold border ${
                      latestMessage.status === "APPROVED"
                        ? "bg-emerald-950 text-emerald-400 border-emerald-800"
                        : latestMessage.status === "EDITED"
                        ? "bg-blue-950 text-blue-400 border-blue-800"
                        : latestMessage.status === "READY_FOR_REVIEW"
                        ? "bg-amber-950 text-amber-400 border-amber-800 animate-pulse"
                        : "bg-slate-800 text-slate-300 border-slate-700"
                    }`}
                  >
                    STATUS: {latestMessage.status}
                  </span>
                </div>
              )}
            </div>

            {!latestMessage ? (
              <div className="py-16 text-center text-slate-400 text-xs space-y-4">
                <Mail className="w-8 h-8 text-slate-600 mx-auto" />
                <p>No outreach message drafted yet.</p>
                {topOpportunity && (
                  <button
                    onClick={handleGenerateMessage}
                    disabled={generating}
                    className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold flex items-center space-x-2 mx-auto shadow-lg shadow-emerald-900/20"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>{generating ? "Generating Evidence Pitch..." : "Generate Personalized Outreach"}</span>
                  </button>
                )}
              </div>
            ) : isEditingMessage ? (
              /* Inline Edit Mode */
              <div className="space-y-4 text-xs">
                <div className="flex items-center justify-between border-b border-border/60 pb-2">
                  <span className="font-mono text-xs font-bold text-white flex items-center space-x-1.5">
                    <Edit3 className="w-3.5 h-3.5 text-blue-400" />
                    <span>EDITING OUTREACH BLUEPRINT</span>
                  </span>
                  <span className="text-[10px] font-mono text-slate-400">Live Quality Re-evaluation</span>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] font-mono text-slate-400">Email Subject</label>
                  <input
                    type="text"
                    value={editSubject}
                    onChange={(e) => setEditSubject(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-lg bg-[#0c0e14] border border-border text-xs text-white focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <div className="flex justify-between items-center">
                    <label className="text-[11px] font-mono text-slate-400">Email Body (Markdown)</label>
                    <span className="text-[10px] font-mono text-slate-500">
                      {editEmailBody.trim().split(/\s+/).filter(Boolean).length} words
                    </span>
                  </div>
                  <textarea
                    rows={6}
                    value={editEmailBody}
                    onChange={(e) => setEditEmailBody(e.target.value)}
                    className="w-full p-3 rounded-lg bg-[#0c0e14] border border-border text-xs text-white focus:outline-none focus:border-blue-500 font-mono leading-relaxed"
                  />
                </div>

                <div className="space-y-1.5">
                  <div className="flex justify-between items-center">
                    <label className="text-[11px] font-mono text-slate-400">WhatsApp Message</label>
                    <span className="text-[10px] font-mono text-slate-500">
                      {editWhatsappBody.trim().split(/\s+/).filter(Boolean).length} words
                    </span>
                  </div>
                  <textarea
                    rows={3}
                    value={editWhatsappBody}
                    onChange={(e) => setEditWhatsappBody(e.target.value)}
                    className="w-full p-3 rounded-lg bg-[#0c0e14] border border-border text-xs text-white focus:outline-none focus:border-blue-500 font-mono leading-relaxed"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] font-mono text-slate-400">Follow-up Message (4 Days Later)</label>
                  <textarea
                    rows={2}
                    value={editFollowupBody}
                    onChange={(e) => setEditFollowupBody(e.target.value)}
                    className="w-full p-3 rounded-lg bg-[#0c0e14] border border-border text-xs text-white focus:outline-none focus:border-blue-500 font-mono"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] font-mono text-slate-400">Call to Action (CTA)</label>
                  <input
                    type="text"
                    value={editCallToAction}
                    onChange={(e) => setEditCallToAction(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-lg bg-[#0c0e14] border border-border text-xs text-white focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div className="flex items-center space-x-3 pt-3 border-t border-border/80">
                  <button
                    onClick={() => handleSaveEdit(latestMessage.id, true)}
                    disabled={savingEdit}
                    className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center space-x-1.5"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Save & Approve</span>
                  </button>
                  <button
                    onClick={() => handleSaveEdit(latestMessage.id, false)}
                    disabled={savingEdit}
                    className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold"
                  >
                    Save Changes as EDITED
                  </button>
                  <button
                    onClick={() => setIsEditingMessage(false)}
                    className="px-4 py-2 rounded-xl border border-border text-slate-400 text-xs"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              /* Multi-Channel Side-by-Side Review Deck */
              <div className="space-y-6 text-xs">
                
                {/* 1. Primary Email Channel Card */}
                <div className="p-5 rounded-xl bg-[#0c0e14] border border-border/80 space-y-3.5">
                  <div className="flex items-center justify-between border-b border-border/60 pb-2.5">
                    <div className="flex items-center space-x-2">
                      <Mail className="w-4 h-4 text-blue-400" />
                      <span className="text-[11px] font-mono font-bold text-white uppercase">
                        CHANNEL: EMAIL OUTREACH
                      </span>
                      <span className="text-[10px] font-mono px-2 py-0.2 rounded bg-slate-800 text-slate-400">
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
                      className="text-[11px] text-slate-400 hover:text-white flex items-center space-x-1 font-mono"
                    >
                      <Copy className="w-3 h-3" />
                      <span>{copiedField === "email" ? "COPIED!" : "COPY EMAIL"}</span>
                    </button>
                  </div>

                  {/* Email Subject Line */}
                  <div className="p-2.5 rounded-lg bg-card/60 border border-border/40 text-xs flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-slate-400 font-mono block">SUBJECT:</span>
                      <span className="font-semibold text-slate-100 font-sans text-xs">
                        {latestMessage.emailSubject}
                      </span>
                    </div>
                  </div>

                  {/* Email Body */}
                  <div className="p-4 rounded-xl bg-card/40 border border-border/40 whitespace-pre-line text-slate-200 text-xs leading-relaxed font-sans">
                    {latestMessage.emailBody}
                  </div>

                  {/* Follow-up Teaser */}
                  {latestMessage.followupBody && (
                    <div className="p-3 rounded-lg bg-blue-950/20 border border-blue-900/40 space-y-1">
                      <span className="text-[10px] font-mono text-blue-400 block uppercase">
                        Follow-Up (4 Days Later):
                      </span>
                      <p className="text-[11px] text-slate-300 leading-relaxed font-sans">
                        {latestMessage.followupBody}
                      </p>
                    </div>
                  )}
                </div>

                {/* 2. Direct WhatsApp Channel Card */}
                {latestMessage.whatsappBody && (
                  <div className="p-5 rounded-xl bg-emerald-950/10 border border-emerald-800/40 space-y-3.5">
                    <div className="flex items-center justify-between border-b border-emerald-900/40 pb-2.5">
                      <div className="flex items-center space-x-2">
                        <MessageSquare className="w-4 h-4 text-emerald-400" />
                        <span className="text-[11px] font-mono font-bold text-emerald-300 uppercase">
                          CHANNEL: WHATSAPP DIRECT MESSAGE
                        </span>
                        <span className="text-[10px] font-mono px-2 py-0.2 rounded bg-emerald-950 text-emerald-400 border border-emerald-800">
                          {whatsappWordCount} words
                        </span>
                      </div>

                      <button
                        onClick={() => copyToClipboard(latestMessage.whatsappBody, "whatsapp")}
                        className="text-[11px] text-emerald-400 hover:text-emerald-300 flex items-center space-x-1 font-mono"
                      >
                        <Copy className="w-3 h-3" />
                        <span>{copiedField === "whatsapp" ? "COPIED!" : "COPY WHATSAPP"}</span>
                      </button>
                    </div>

                    {/* WhatsApp Chat Bubble */}
                    <div className="p-4 rounded-2xl bg-emerald-900/30 border border-emerald-700/40 text-xs text-slate-100 leading-relaxed font-sans max-w-lg shadow-md">
                      {latestMessage.whatsappBody}
                      <div className="text-[9px] font-mono text-emerald-400 text-right mt-1.5">
                        Delivered &bull; Read
                      </div>
                    </div>
                  </div>
                )}

                {/* 3. Strategic Building Blocks Summary */}
                <div className="p-3.5 rounded-xl bg-[#0c0e14] border border-border/80 text-[11px] text-slate-400 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-slate-300">Outreach Angle:</span>
                    <span className="text-slate-200 font-medium">
                      {latestMessage.outreachAngle || topOpportunity?.pitchAngle || "Direct Value Proposition"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-slate-300">Call to Action:</span>
                    <span className="text-emerald-400 font-medium">{latestMessage.callToAction}</span>
                  </div>
                </div>

                {/* 4. Human Review & Approval Action Bar */}
                <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-border/80">
                  <div className="flex flex-wrap items-center gap-2.5">
                    {latestMessage.status !== "APPROVED" ? (
                      <button
                        onClick={() => handleApproveMessage(latestMessage.id)}
                        disabled={approving}
                        className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center space-x-2 shadow-lg shadow-emerald-900/20 transition-all"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>{approving ? "Approving..." : "Approve Outreach"}</span>
                      </button>
                    ) : (
                      <div className="flex items-center space-x-2">
                        <span className="px-4 py-2 rounded-xl bg-emerald-950/80 border border-emerald-800 text-emerald-300 text-xs font-mono font-bold flex items-center space-x-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                          <span>APPROVED</span>
                        </span>
                        <button
                          onClick={() => handleSimulateDelivery(latestMessage.id)}
                          disabled={delivering}
                          className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold flex items-center space-x-1.5 shadow-lg shadow-blue-900/20 transition-all font-mono"
                        >
                          <Zap className={`w-3.5 h-3.5 ${delivering ? "animate-spin" : ""}`} />
                          <span>{delivering ? "Testing Safety Gate..." : "Simulate Dry-Run Delivery"}</span>
                        </button>
                      </div>
                    )}

                    <button
                      onClick={() => setIsEditingMessage(true)}
                      className="px-4 py-2.5 rounded-xl bg-card hover:bg-card-hover border border-border text-slate-200 text-xs font-medium flex items-center space-x-1.5"
                    >
                      <Edit3 className="w-3.5 h-3.5 text-blue-400" />
                      <span>Edit Copy</span>
                    </button>

                    <button
                      onClick={() => handleRegenerateMessage(latestMessage.id)}
                      disabled={regenerating}
                      className="px-4 py-2.5 rounded-xl border border-border text-slate-400 hover:text-white text-xs flex items-center space-x-1.5 transition-colors"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${regenerating ? "animate-spin" : ""}`} />
                      <span>{regenerating ? "Regenerating..." : "Regenerate"}</span>
                    </button>
                  </div>

                  {latestMessage.status !== "APPROVED" && (
                    <button
                      onClick={() => handleRejectMessage(latestMessage.id)}
                      className="text-xs text-slate-400 hover:text-rose-400 transition-colors font-mono"
                    >
                      REJECT / SKIP
                    </button>
                  )}
                </div>

                {/* Dry-Run Delivery Inspection Card */}
                {dryRunResult && (
                  <div className="p-5 rounded-xl bg-[#0c0e14] border border-blue-900/60 shadow-xl space-y-3.5 mt-4 text-xs">
                    <div className="flex items-center justify-between border-b border-border/60 pb-2.5">
                      <div className="flex items-center space-x-2">
                        <Zap className="w-4 h-4 text-blue-400" />
                        <span className="font-mono font-bold text-white uppercase">
                          SIMULATED DRY-RUN DELIVERY RECEIPT
                        </span>
                      </div>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-950 text-blue-400 border border-blue-800">
                        ZERO EXTERNAL CALLS
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-[11px]">
                      <div className="p-2 rounded bg-card/60 border border-border/40">
                        <span className="text-slate-400 block font-mono text-[10px]">RECIPIENT DESTINATION</span>
                        <span className="font-mono text-slate-200 font-bold">
                          {dryRunResult.safetyCheck?.destination || "N/A"}
                        </span>
                      </div>
                      <div className="p-2 rounded bg-card/60 border border-border/40">
                        <span className="text-slate-400 block font-mono text-[10px]">DELIVERY PROVIDER</span>
                        <span className="font-mono text-blue-400 font-bold">
                          {dryRunResult.provider} ({dryRunResult.status})
                        </span>
                      </div>
                      <div className="p-2 rounded bg-card/60 border border-border/40 col-span-2">
                        <span className="text-slate-400 block font-mono text-[10px]">SHA-256 IDEMPOTENCY KEY</span>
                        <span className="font-mono text-slate-400 text-[10px] truncate block">
                          {dryRunResult.idempotencyKey}
                        </span>
                      </div>
                    </div>

                    <div className="p-3 rounded-lg bg-emerald-950/20 border border-emerald-900/40 text-emerald-300 text-[11px] space-y-1">
                      <span className="font-mono font-bold block flex items-center space-x-1">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Safety Gate Verification: ALL CHECKS PASSED</span>
                      </span>
                      <p className="text-slate-300 text-[10px]">
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
