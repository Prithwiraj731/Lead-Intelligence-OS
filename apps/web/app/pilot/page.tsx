"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ShieldCheck,
  ShieldAlert,
  CheckCircle2,
  AlertTriangle,
  Mail,
  Send,
  Building2,
  Sparkles,
  RefreshCw,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Copy,
  Check,
  Lock,
  Layers,
  Activity,
  Info,
} from "lucide-react";

export default function CampaignPilotPage() {
  const [loading, setLoading] = useState(true);
  const [preflightLoading, setPreflightLoading] = useState(true);
  const [preflight, setPreflight] = useState<any>(null);
  const [leadsData, setLeadsData] = useState<any>(null);
  const [expandedLeadId, setExpandedLeadId] = useState<string | null>(null);
  const [confirmations, setConfirmations] = useState<Record<string, boolean>>({});
  const [dispatchingId, setDispatchingId] = useState<string | null>(null);
  const [approvingId, setApprovingId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [deliveryReceipts, setDeliveryReceipts] = useState<Record<string, any>>({});
  const [errorBanner, setErrorBanner] = useState<string | null>(null);

  // Gmail OAuth State
  const [gmailStatus, setGmailStatus] = useState<any>(null);
  const [loadingGmail, setLoadingGmail] = useState(true);
  const [connectingGmail, setConnectingGmail] = useState(false);
  const [disconnectingGmail, setDisconnectingGmail] = useState(false);
  const [oauthBanner, setOauthBanner] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const fetchGmailStatus = async () => {
    try {
      setLoadingGmail(true);
      const res = await fetch("/api/auth/gmail/status");
      const json = await res.json();
      if (json.success) {
        setGmailStatus(json.data);
      }
    } catch (err) {
      console.error("Failed to load Gmail OAuth status:", err);
    } finally {
      setLoadingGmail(false);
    }
  };

  const handleConnectGmail = async () => {
    try {
      setConnectingGmail(true);
      const res = await fetch("/api/auth/gmail/url?returnTo=/pilot");
      const json = await res.json();
      if (json.success && json.authUrl) {
        window.location.href = json.authUrl;
      } else {
        setOauthBanner({ type: "error", message: json.error || "Failed to generate OAuth URL" });
      }
    } catch (err: any) {
      setOauthBanner({ type: "error", message: err.message || "Failed to initiate Gmail OAuth" });
    } finally {
      setConnectingGmail(false);
    }
  };

  const handleDisconnectGmail = async () => {
    try {
      setDisconnectingGmail(true);
      setOauthBanner(null);
      const res = await fetch("/api/auth/gmail/disconnect", { method: "POST" });
      const json = await res.json();
      if (json.success) {
        setOauthBanner({ type: "success", message: "Gmail account disconnected successfully. Tokens cleared." });
        await fetchGmailStatus();
        await fetchPreflight();
      } else {
        setOauthBanner({ type: "error", message: json.error || "Failed to disconnect Gmail" });
      }
    } catch (err: any) {
      setOauthBanner({ type: "error", message: err.message || "Failed to disconnect Gmail" });
    } finally {
      setDisconnectingGmail(false);
    }
  };

  const fetchPreflight = async () => {
    try {
      setPreflightLoading(true);
      const res = await fetch("/api/delivery/preflight");
      const json = await res.json();
      if (json.success) {
        setPreflight(json.data);
      }
    } catch (err) {
      console.error("Failed to load preflight checks:", err);
    } finally {
      setPreflightLoading(false);
    }
  };

  const fetchPilotLeads = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/pilot/leads");
      const json = await res.json();
      if (json.success) {
        setLeadsData(json.data);
      }
    } catch (err) {
      console.error("Failed to load pilot leads:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPreflight();
    fetchPilotLeads();
    fetchGmailStatus();

    // Check for query param feedback
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      if (params.get("oauth") === "success") {
        setOauthBanner({
          type: "success",
          message: `Gmail authenticated successfully as ${params.get("email") || "prithwi1016@gmail.com"}! OAuth tokens stored securely server-side.`,
        });
      } else if (params.get("oauth") === "error") {
        setOauthBanner({
          type: "error",
          message: `Gmail OAuth connection failed: ${params.get("message") || "Authorization error"}`,
        });
      }
    }
  }, []);

  const handleToggleConfirm = (messageId: string) => {
    setConfirmations((prev) => ({
      ...prev,
      [messageId]: !prev[messageId],
    }));
  };

  const handleApprove = async (messageId: string) => {
    try {
      setApprovingId(messageId);
      setErrorBanner(null);
      const res = await fetch(`/api/messages/${messageId}/approve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notes: "Approved directly from Campaign Pilot Console" }),
      });
      const json = await res.json();
      if (json.success) {
        await fetchPilotLeads();
      } else {
        setErrorBanner(json.error || "Failed to approve message");
      }
    } catch (err: any) {
      setErrorBanner(err.message || "Failed to approve message");
    } finally {
      setApprovingId(null);
    }
  };

  const handleDispatchPilotEmail = async (lead: any) => {
    const messageId = lead.message?.id;
    if (!messageId) return;

    if (!confirmations[messageId]) {
      setErrorBanner("You must check 'I have reviewed this recipient, evidence, and message' before dispatching.");
      return;
    }

    try {
      setDispatchingId(messageId);
      setErrorBanner(null);
      const res = await fetch("/api/pilot/deliver", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messageId,
          hasReviewedConfirmation: true,
          destinationOverride: lead.recipientEmail,
        }),
      });

      const json = await res.json();
      if (json.success) {
        setDeliveryReceipts((prev) => ({
          ...prev,
          [messageId]: json.data,
        }));
        await fetchPilotLeads();
        await fetchPreflight();
      } else {
        setErrorBanner(json.error || "Delivery failed safety gate checks.");
      }
    } catch (err: any) {
      setErrorBanner(err.message || "Network error during delivery dispatch");
    } finally {
      setDispatchingId(null);
    }
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const metrics = leadsData?.metrics || {
    pilotRecipientsUsed: 0,
    pilotRecipientsMax: 5,
    isPilotCapReached: false,
    totalApprovedMessages: 0,
  };

  const leads = leadsData?.leads || [];
  const eligibleLeads = leads.filter((l: any) => l.isEligible);

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-20">
      {/* Header Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-border/60 pb-6">
        <div>
          <div className="flex items-center space-x-2 mb-1.5">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              <ShieldCheck className="w-3 h-3" />
              Controlled Pilot Sandbox
            </span>
            <span className="text-xs text-slate-500">•</span>
            <span className="text-xs text-slate-400">Strict 5-Recipient Safety Cap</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-white">
            Campaign Pilot Console
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-3xl leading-relaxed">
            Controlled execution environment for the initial live pilot recipients. Requires mandatory human sign-off on technical proof, diagnosed angle, and copy before delivery.
          </p>
        </div>

        {/* Action Controls & Quota Gauge */}
        <div className="flex items-center gap-4 glass-card border border-white/[0.08] rounded-2xl p-4 self-start lg:self-auto">
          <div className="text-right">
            <div className="text-[11px] font-medium text-slate-400">Pilot Quota</div>
            <div className="text-xl font-bold text-white flex items-center justify-end gap-1">
              <span className={metrics.pilotRecipientsUsed >= 5 ? "text-rose-400" : "text-emerald-400"}>
                {metrics.pilotRecipientsUsed}
              </span>
              <span className="text-slate-500">/</span>
              <span className="text-slate-300">{metrics.pilotRecipientsMax}</span>
              <span className="text-xs font-normal text-slate-400 ml-1">Sent</span>
            </div>
          </div>

          <div className="w-24 bg-white/[0.06] rounded-full h-2 overflow-hidden border border-white/[0.08]">
            <div
              className={`h-full transition-all duration-500 ${
                metrics.pilotRecipientsUsed >= 5 ? "bg-rose-500" : "bg-gradient-to-r from-indigo-500 to-emerald-400"
              }`}
              style={{
                width: `${Math.min(100, (metrics.pilotRecipientsUsed / metrics.pilotRecipientsMax) * 100)}%`,
              }}
            />
          </div>

          <button
            onClick={() => {
              fetchPreflight();
              fetchPilotLeads();
            }}
            className="p-2.5 rounded-xl border border-white/[0.08] bg-white/[0.03] hover:bg-white/[0.08] text-slate-300 hover:text-white transition-all"
            title="Refresh Status"
          >
            <RefreshCw className={`w-4 h-4 ${loading || preflightLoading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {/* Error Alert */}
      {errorBanner && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 flex items-start gap-3 text-xs">
          <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
          <div>
            <span className="font-semibold">Safety Gate Notice: </span>
            {errorBanner}
          </div>
        </div>
      )}

      {/* OAuth Notification Banner */}
      {oauthBanner && (
        <div
          className={`p-4 rounded-xl border flex items-center justify-between text-xs ${
            oauthBanner.type === "success"
              ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-300"
              : "bg-rose-500/10 border-rose-500/20 text-rose-300"
          }`}
        >
          <div className="flex items-center space-x-2">
            {oauthBanner.type === "success" ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            ) : (
              <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0" />
            )}
            <span>{oauthBanner.message}</span>
          </div>
          <button
            onClick={() => setOauthBanner(null)}
            className="text-slate-400 hover:text-white px-2 py-0.5"
          >
            ✕
          </button>
        </div>
      )}

      {/* Gmail OAuth Authentication & Verified Sender Bar */}
      <div className="glass-panel p-5 rounded-2xl border border-white/[0.08] flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start space-x-3.5">
          <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 shrink-0">
            <Mail className="w-5 h-5" />
          </div>
          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <span className="text-xs font-semibold text-white">
                Gmail API OAuth 2.0 Sender Identity
              </span>
              {loadingGmail ? (
                <span className="text-[10px] text-slate-500">checking...</span>
              ) : gmailStatus?.connected ? (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  CONNECTED
                </span>
              ) : (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-white/[0.04] text-slate-400 border border-white/[0.08]">
                  DISCONNECTED
                </span>
              )}
            </div>
            <p className="text-xs text-slate-400">
              Verified Sender:{" "}
              <strong className="text-slate-200">
                {gmailStatus?.email || "prithwi1016@gmail.com"}
              </strong>{" "}
              &bull; <span className="text-slate-500">Tokens stored server-side only (zero password storage)</span>
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2 shrink-0">
          {gmailStatus?.connected ? (
            <button
              onClick={handleDisconnectGmail}
              disabled={disconnectingGmail}
              className="px-3.5 py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 text-rose-300 text-xs font-medium transition-all disabled:opacity-50 flex items-center space-x-1.5"
            >
              {disconnectingGmail && <RefreshCw className="w-3 h-3 animate-spin" />}
              <span>Disconnect Gmail</span>
            </button>
          ) : (
            <button
              onClick={handleConnectGmail}
              disabled={connectingGmail}
              className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium transition-all shadow-md shadow-indigo-600/20 flex items-center space-x-2 disabled:opacity-50 active:scale-95"
            >
              {connectingGmail ? (
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Mail className="w-3.5 h-3.5" />
              )}
              <span>Connect Gmail (prithwi1016@gmail.com)</span>
            </button>
          )}
        </div>
      </div>

      {/* Section 1: Pre-flight Delivery Infrastructure Checklist */}
      <div className="glass-panel rounded-2xl border border-white/[0.06] p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/[0.04] pb-3">
          <div className="flex items-center space-x-2">
            <div className="w-6 h-6 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-400">
              <ShieldCheck className="w-3.5 h-3.5" />
            </div>
            <h2 className="text-sm font-semibold text-slate-200">
              Pre-Flight Delivery Infrastructure Verification (11 Checks)
            </h2>
          </div>
          <div className="flex items-center space-x-3 text-xs">
            <span className="text-emerald-400 font-medium">
              ✓ {preflight?.passedCount ?? 0} Passed
            </span>
            {preflight?.providerManagedCount > 0 && (
              <span className="text-indigo-400 font-medium">
                ⚡ {preflight.providerManagedCount} Provider Managed
              </span>
            )}
            {preflight?.warningCount > 0 && (
              <span className="text-amber-400 font-medium">
                ⚠ {preflight.warningCount} Warnings
              </span>
            )}
            {preflight?.failedCount > 0 && (
              <span className="text-rose-400 font-medium">
                ✕ {preflight.failedCount} Failed
              </span>
            )}
          </div>
        </div>

        {preflightLoading ? (
          <div className="py-6 text-center text-slate-500 text-xs flex items-center justify-center gap-2">
            <RefreshCw className="w-4 h-4 animate-spin text-indigo-400" />
            Verifying DNS authentication (SPF, DKIM, DMARC), Resend/SMTP config, and rate limiters...
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {(preflight?.checks || []).map((check: any) => (
              <div
                key={check.id}
                className="p-3.5 rounded-xl bg-white/[0.02] border border-white/[0.06] flex items-start space-x-3 text-xs"
              >
                <div className="mt-0.5 shrink-0">
                  {check.status === "PASSED" ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  ) : check.status === "PROVIDER_MANAGED" ? (
                    <Sparkles className="w-4 h-4 text-indigo-400" />
                  ) : check.status === "WARNING" ? (
                    <AlertTriangle className="w-4 h-4 text-amber-400" />
                  ) : (
                    <ShieldAlert className="w-4 h-4 text-rose-400" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-1">
                    <span className="font-medium text-slate-200 truncate">{check.name}</span>
                    {check.status === "PROVIDER_MANAGED" && (
                      <span className="text-[9px] px-1.5 py-0.5 rounded-md bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 shrink-0 font-medium">
                        MANAGED
                      </span>
                    )}
                  </div>
                  <div className="text-[11px] text-slate-400 mt-0.5 line-clamp-2">{check.summary}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Section 2: Pilot Leads Table & Direct Approval Console */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-6 h-6 rounded-lg bg-indigo-500/10 flex items-center justify-center text-indigo-400">
              <Mail className="w-3.5 h-3.5" />
            </div>
            <h2 className="text-sm font-semibold text-slate-200">
              Pilot Candidates ({eligibleLeads.length} Eligible Accounts)
            </h2>
          </div>
          <div className="text-xs text-slate-500">
            Hard Pilot Cap: Maximum 5 Deliveries Total
          </div>
        </div>

        {loading ? (
          <div className="py-12 text-center text-slate-400 text-xs flex items-center justify-center gap-2">
            <RefreshCw className="w-4 h-4 animate-spin text-indigo-400" />
            Loading pilot candidate queue...
          </div>
        ) : eligibleLeads.length === 0 ? (
          <div className="py-12 text-center glass-card border border-white/[0.06] rounded-2xl p-6 text-slate-400 text-xs">
            No eligible leads found with verified email contacts. Please import leads and execute research.
          </div>
        ) : (
          <div className="space-y-4">
            {eligibleLeads.map((lead: any, idx: number) => {
              const msg = lead.message;
              const isExpanded = expandedLeadId === lead.companyId;
              const isApproved = msg?.status === "APPROVED";
              const isConfirmed = confirmations[msg?.id || ""] || false;
              const receipt = deliveryReceipts[msg?.id || ""] || lead.latestDelivery;
              const isDelivered = receipt?.status === "SENT" || receipt?.status === "DELIVERED";

              return (
                <div
                  key={lead.companyId}
                  className={`rounded-2xl border transition-all duration-200 overflow-hidden ${
                    isDelivered
                      ? "glass-panel border-emerald-500/30"
                      : isApproved
                      ? "glass-panel border-indigo-500/30 shadow-lg shadow-indigo-950/20"
                      : "glass-card border-white/[0.06]"
                  }`}
                >
                  {/* Summary Header */}
                  <div className="p-4 sm:p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    <div className="flex items-start space-x-3.5 min-w-0 flex-1">
                      <div className="w-9 h-9 rounded-xl bg-white/[0.04] border border-white/[0.08] flex items-center justify-center text-slate-300 shrink-0 font-medium text-xs">
                        #{idx + 1}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-semibold text-base text-white truncate">
                            {lead.companyName}
                          </span>
                          <span className="px-2 py-0.5 rounded-full text-[11px] bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
                            {lead.industry}
                          </span>
                          <span className="px-2 py-0.5 rounded-full text-[11px] bg-white/[0.04] text-slate-400 border border-white/[0.06]">
                            {lead.location}
                          </span>
                        </div>

                        <div className="flex flex-wrap items-center gap-3 mt-1.5 text-xs text-slate-400">
                          <span className="text-slate-300">
                            Recipient: <strong className="text-white font-mono text-[11px]">{lead.recipientEmail}</strong>
                          </span>
                          <span>•</span>
                          <span className="text-amber-400 font-medium">
                            Opp Score: <strong>{lead.opportunityScore}</strong>
                          </span>
                          <span>•</span>
                          <span className="text-cyan-400 font-medium">
                            Conf: <strong>{lead.confidenceScore}%</strong>
                          </span>
                          <span>•</span>
                          <span className="text-slate-300">
                            Offer: <strong className="text-slate-200">{lead.recommendedService}</strong>
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Status & Quick Action Buttons */}
                    <div className="flex flex-wrap items-center gap-2.5 shrink-0">
                      {/* Approval Status Chip */}
                      <span
                        className={`px-2.5 py-1 rounded-full text-xs font-medium flex items-center gap-1.5 border ${
                          isDelivered
                            ? "bg-emerald-500/10 text-emerald-300 border-emerald-500/20"
                            : isApproved
                            ? "bg-indigo-500/10 text-indigo-300 border-indigo-500/20"
                            : "bg-amber-500/10 text-amber-300 border-amber-500/20"
                        }`}
                      >
                        {isDelivered ? (
                          <>
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>{receipt.status}</span>
                          </>
                        ) : isApproved ? (
                          <>
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Approved</span>
                          </>
                        ) : (
                          <>
                            <AlertTriangle className="w-3.5 h-3.5" />
                            <span>Awaiting Review</span>
                          </>
                        )}
                      </span>

                      {/* Quality Score Badge */}
                      {msg && (
                        <span className="px-2.5 py-1 rounded-full text-xs bg-white/[0.04] border border-white/[0.08] text-slate-300">
                          Quality: {msg.qualityScore}/100
                        </span>
                      )}

                      {/* Expand / Collapse Button */}
                      <button
                        onClick={() => setExpandedLeadId(isExpanded ? null : lead.companyId)}
                        className="px-3.5 py-1.5 rounded-xl border border-white/[0.08] bg-white/[0.03] hover:bg-white/[0.08] text-xs font-medium text-slate-300 flex items-center gap-1.5 transition-all"
                      >
                        <span>{isExpanded ? "Hide Details" : "Review Message"}</span>
                        {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>

                  {/* Expanded Review & Dispatch Section */}
                  {isExpanded && (
                    <div className="border-t border-white/[0.04] bg-black/20 p-5 space-y-5">
                      {/* Evidence & Diagnosis Breakdown */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                        <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/[0.06] space-y-1">
                          <span className="text-[10px] uppercase text-slate-500 font-medium">
                            Research Evidence
                          </span>
                          <p className="text-slate-200">
                            {lead.evidenceSummary && lead.evidenceSummary.length > 0
                              ? lead.evidenceSummary.join(" • ")
                              : "No active friction detected on technical audit."}
                          </p>
                        </div>

                        <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/[0.06] space-y-1">
                          <span className="text-[10px] uppercase text-slate-500 font-medium">
                            Diagnosed Reason
                          </span>
                          <p className="text-slate-200 font-mono">{lead.reasonCode}</p>
                        </div>

                        <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/[0.06] space-y-1">
                          <span className="text-[10px] uppercase text-slate-500 font-medium">
                            Verified Recipient
                          </span>
                          <p className="text-slate-200 font-mono">{lead.recipientEmail}</p>
                          <p className="text-[11px] text-slate-400">
                            {lead.contactName ? `Contact: ${lead.contactName}` : "Company General Inbox"}
                          </p>
                        </div>
                      </div>

                      {/* Email Preview Box */}
                      {msg ? (
                        <div className="space-y-2">
                          <div className="flex items-center justify-between text-xs text-slate-400">
                            <span className="font-medium text-slate-300">Email Copy Preview</span>
                            <button
                              onClick={() => copyToClipboard(`${msg.emailSubject}\n\n${msg.emailBody}`, msg.id)}
                              className="flex items-center gap-1 text-slate-400 hover:text-white transition-colors px-2 py-0.5 rounded-lg hover:bg-white/[0.05]"
                            >
                              {copiedId === msg.id ? (
                                <>
                                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                                  <span className="text-emerald-400 text-xs">Copied</span>
                                </>
                              ) : (
                                <>
                                  <Copy className="w-3.5 h-3.5" />
                                  <span className="text-xs">Copy Draft</span>
                                </>
                              )}
                            </button>
                          </div>

                          <div className="p-4 rounded-xl bg-black/30 border border-white/[0.05] space-y-2.5 text-xs text-slate-200">
                            <div className="border-b border-white/[0.04] pb-2">
                              <span className="text-slate-500 font-medium">Subject: </span>
                              <strong className="text-slate-200">{msg.emailSubject}</strong>
                            </div>
                            <div className="whitespace-pre-wrap leading-relaxed text-slate-300">
                              {msg.emailBody}
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.06] text-xs text-slate-400">
                          No draft generated yet. Generate message from lead detail page first.
                        </div>
                      )}

                      {/* Delivery Receipt (if already dispatched) */}
                      {receipt && (
                        <div className="p-4 rounded-xl bg-emerald-500/[0.04] border border-emerald-500/20 space-y-2 text-xs">
                          <div className="flex items-center justify-between text-emerald-400 font-semibold">
                            <span className="flex items-center gap-1.5">
                              <CheckCircle2 className="w-4 h-4" />
                              Delivery Receipt: {receipt.status}
                            </span>
                            <span className="text-[11px] text-slate-400 font-normal">
                              Provider: {receipt.provider || "RESEND"}
                            </span>
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-slate-300 text-[11px] font-mono">
                            <div>Delivery ID: {receipt.id || receipt.deliveryId}</div>
                            <div>Idempotency Key: {receipt.idempotencyKey?.slice(0, 24)}...</div>
                            <div>Timestamp: {receipt.sentAt || receipt.timestamp || new Date().toISOString()}</div>
                            <div>Mode: {receipt.isDryRun ? "DRY_RUN" : "REAL_PILOT_TRANSMISSION"}</div>
                          </div>
                        </div>
                      )}

                      {/* Delivery Action Bar */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-3 border-t border-white/[0.04]">
                        {/* Approval & Confirmation Checkbox */}
                        {!isDelivered && (
                          <div className="flex items-center space-x-3">
                            {!isApproved ? (
                              <button
                                onClick={() => handleApprove(msg.id)}
                                disabled={approvingId === msg.id}
                                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium flex items-center gap-2 transition-all shadow-md shadow-emerald-600/20 disabled:opacity-50 active:scale-95"
                              >
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                <span>{approvingId === msg.id ? "Approving..." : "Approve Message"}</span>
                              </button>
                            ) : (
                              <label className="flex items-center space-x-2.5 cursor-pointer text-xs select-none">
                                <input
                                  type="checkbox"
                                  checked={isConfirmed}
                                  onChange={() => handleToggleConfirm(msg.id)}
                                  className="w-4 h-4 rounded border-slate-700 bg-slate-900 text-indigo-600 focus:ring-indigo-500"
                                />
                                <span className="text-slate-300 font-medium">
                                  I have reviewed this recipient, evidence, and message.
                                </span>
                              </label>
                            )}
                          </div>
                        )}

                        {/* Dispatch Button */}
                        {!isDelivered && isApproved && (
                          <button
                            onClick={() => handleDispatchPilotEmail(lead)}
                            disabled={
                              !isConfirmed ||
                              dispatchingId === msg?.id ||
                              metrics.pilotRecipientsUsed >= metrics.pilotRecipientsMax
                            }
                            className={`px-5 py-2.5 rounded-xl text-xs font-medium flex items-center gap-2 transition-all active:scale-95 ${
                              isConfirmed && metrics.pilotRecipientsUsed < metrics.pilotRecipientsMax
                                ? "bg-gradient-to-r from-indigo-600 to-emerald-600 hover:from-indigo-500 hover:to-emerald-500 text-white shadow-md shadow-indigo-600/20"
                                : "bg-white/[0.04] text-slate-500 border border-white/[0.06] cursor-not-allowed"
                            }`}
                          >
                            <Send className={`w-3.5 h-3.5 ${dispatchingId === msg?.id ? "animate-spin" : ""}`} />
                            <span>
                              {dispatchingId === msg?.id
                                ? "Dispatching..."
                                : metrics.pilotRecipientsUsed >= metrics.pilotRecipientsMax
                                ? "Pilot Cap Reached (5/5)"
                                : "Dispatch Real Pilot Email"}
                            </span>
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Safety Notice Footer */}
      <div className="glass-panel p-4 rounded-2xl border border-white/[0.06] flex items-start space-x-3 text-xs text-slate-400">
        <Info className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <span className="font-medium text-slate-200">Safety Rule & Reply Governance:</span>
          <p className="leading-relaxed">
            Incoming replies will be logged and classified by the intelligence engine, but will <strong>NEVER</strong> automatically trigger an automated follow-up. Every subsequent message requires manual review and approval.
          </p>
        </div>
      </div>
    </div>
  );
}
