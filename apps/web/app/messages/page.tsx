"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  CheckCircle2,
  Edit3,
  RefreshCw,
  XCircle,
  Mail,
  MessageSquare,
  Sparkles,
  ArrowRight,
  ExternalLink,
  BarChart3,
  Copy,
  Info,
  Check,
  Building2,
  ChevronRight,
} from "lucide-react";

export default function ReviewQueuePage() {
  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionId, setActionId] = useState<string | null>(null);
  const [filter, setFilter] = useState("READY_FOR_REVIEW");
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const fetchMessages = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/messages?status=${filter}`);
      const json = await res.json();
      if (json.success) {
        setMessages(json.data || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMessages();
  }, [filter]);

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleApprove = async (msgId: string) => {
    try {
      setActionId(msgId);
      const res = await fetch(`/api/messages/${msgId}/approve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notes: "Approved from triage queue" }),
      });
      const json = await res.json();
      if (json.success) {
        await fetchMessages();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setActionId(null);
    }
  };

  const handleReject = async (msgId: string) => {
    try {
      setActionId(msgId);
      const res = await fetch(`/api/messages/${msgId}/reject`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: "Skipped in triage review queue" }),
      });
      const json = await res.json();
      if (json.success) {
        await fetchMessages();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setActionId(null);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/60 pb-6">
        <div>
          <div className="flex items-center space-x-2 mb-1.5">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <CheckCircle2 className="w-3 h-3" />
              Human Approval Gate
            </span>
            <span className="text-xs text-slate-500">•</span>
            <span className="text-xs text-slate-400">Zero Unauthorized Sends</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-white">
            Outreach Approval Deck ({messages.length})
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-2xl leading-relaxed">
            Audit AI-generated Email and WhatsApp messages with grounded technical proof. Messages require explicit approval prior to dispatch.
          </p>
        </div>

        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="px-3.5 py-2.5 rounded-xl bg-card border border-border/80 text-xs text-slate-200 focus:outline-none focus:border-indigo-500/80 cursor-pointer self-start sm:self-auto transition-all"
        >
          <option value="READY_FOR_REVIEW">Awaiting Review (Pending)</option>
          <option value="EDITED">Edited Copies (Pending)</option>
          <option value="APPROVED">Approved Messages</option>
          <option value="ALL">All Messages</option>
        </select>
      </div>

      {/* Messages List */}
      {loading ? (
        <div className="py-20 text-center text-slate-400 text-xs flex flex-col items-center space-y-3">
          <RefreshCw className="w-5 h-5 animate-spin text-indigo-400" />
          <span className="font-medium text-slate-400">Loading approval queue...</span>
        </div>
      ) : messages.length === 0 ? (
        <div className="p-12 rounded-2xl border border-dashed border-border/80 text-center space-y-3 bg-card/20">
          <div className="w-12 h-12 rounded-2xl bg-card border border-border mx-auto flex items-center justify-center text-slate-500">
            <CheckCircle2 className="w-6 h-6 text-emerald-400" />
          </div>
          <p className="text-sm font-medium text-white">Queue is clear</p>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            No outbound messages currently awaiting human review.
          </p>
          <Link
            href="/leads"
            className="inline-flex items-center space-x-2 text-xs px-4 py-2 rounded-xl bg-indigo-600/10 text-indigo-300 border border-indigo-500/20 hover:bg-indigo-600/20 transition-all mt-2"
          >
            <span>Browse Leads to Research</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      ) : (
        <div className="space-y-5">
          {messages.map((msg) => {
            const isProcessing = actionId === msg.id;
            const emailWordCount = (msg.emailBody || "").trim().split(/\s+/).filter(Boolean).length;
            const whatsappWordCount = (msg.whatsappBody || "").trim().split(/\s+/).filter(Boolean).length;
            const evidenceList = (msg.evidenceUsed || []) as string[];

            return (
              <div
                key={msg.id}
                className="glass-panel p-5 sm:p-6 rounded-2xl border border-white/[0.06] hover:border-white/[0.12] transition-all space-y-5"
              >
                {/* Message Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/[0.04] pb-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 rounded-xl bg-white/[0.04] border border-white/[0.08] flex items-center justify-center text-slate-300 font-semibold text-xs shrink-0">
                      {msg.company.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div className="flex items-center space-x-2">
                        <Link
                          href={`/leads/${msg.company.id}`}
                          className="text-base font-semibold text-white hover:text-indigo-300 transition-colors"
                        >
                          {msg.company.name}
                        </Link>
                        <span className="text-[11px] px-2 py-0.5 rounded-full bg-white/[0.04] text-slate-400 border border-white/[0.06]">
                          {msg.company.industry || msg.company.location || "UAE"}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2.5">
                    {msg.qualityScore !== undefined && (
                      <span className="text-xs px-2.5 py-1 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 font-medium flex items-center space-x-1.5">
                        <BarChart3 className="w-3.5 h-3.5" />
                        <span>Quality: {msg.qualityScore}/100</span>
                      </span>
                    )}

                    <span
                      className={`text-xs px-2.5 py-1 rounded-full font-medium border ${
                        msg.status === "APPROVED"
                          ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
                          : msg.status === "EDITED"
                          ? "bg-blue-500/10 border-blue-500/20 text-blue-400"
                          : "bg-amber-500/10 border-amber-500/20 text-amber-400"
                      }`}
                    >
                      {msg.status.replace(/_/g, " ")}
                    </span>
                  </div>
                </div>

                {/* Recipient and Opportunity Banner */}
                {msg.opportunity && (
                  <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/[0.06] text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <span className="text-[10px] text-slate-500 block uppercase font-medium">Diagnosed Opportunity</span>
                      <span className="font-medium text-slate-200 text-xs">
                        {msg.opportunity.suggestedOffer || msg.opportunity.service?.name}
                      </span>
                    </div>
                    <div className="sm:text-right">
                      <span className="text-[10px] text-slate-500 block uppercase font-medium">Estimated Value</span>
                      <span className="text-slate-300 font-medium text-xs">
                        {(msg.opportunity.currency === "INR" ? "₹" : (msg.opportunity.currency === "USD" ? "$" : (msg.opportunity.currency === "GBP" ? "£" : (msg.opportunity.currency === "EUR" ? "€" : `${msg.opportunity.currency || "AED"} `))))}
                        {Number(msg.opportunity.estimatedBudgetMin).toLocaleString()} –{" "}
                        {(msg.opportunity.currency === "INR" ? "₹" : (msg.opportunity.currency === "USD" ? "$" : (msg.opportunity.currency === "GBP" ? "£" : (msg.opportunity.currency === "EUR" ? "€" : `${msg.opportunity.currency || "AED"} `))))}
                        {Number(msg.opportunity.estimatedBudgetMax).toLocaleString()}
                      </span>
                    </div>
                  </div>
                )}

                {/* Evidence Grounding */}
                {evidenceList.length > 0 && (
                  <div className="p-3 rounded-xl bg-indigo-500/[0.04] border border-indigo-500/10 text-xs space-y-1">
                    <div className="text-[11px] font-medium text-indigo-400 flex items-center space-x-1.5">
                      <Info className="w-3.5 h-3.5" />
                      <span>Grounded on verified technical evidence:</span>
                    </div>
                    <div className="space-y-0.5 pt-0.5">
                      {evidenceList.map((ev, i) => (
                        <p key={i} className="text-xs text-slate-400 pl-3 relative before:content-['•'] before:absolute before:left-0 before:text-indigo-400">
                          {ev}
                        </p>
                      ))}
                    </div>
                  </div>
                )}

                {/* Side-by-Side Channels */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Email Box */}
                  <div className="p-4 rounded-xl bg-black/20 border border-white/[0.05] space-y-2.5">
                    <div className="flex items-center justify-between border-b border-white/[0.04] pb-2">
                      <span className="text-xs font-medium text-indigo-400 flex items-center space-x-1.5">
                        <Mail className="w-3.5 h-3.5" />
                        <span>Email Draft</span>
                        <span className="text-[10px] text-slate-500">({emailWordCount}w)</span>
                      </span>
                      <button
                        onClick={() => copyToClipboard(`Subject: ${msg.emailSubject}\n\n${msg.emailBody}`, `${msg.id}-email`)}
                        className="text-xs text-slate-400 hover:text-white flex items-center space-x-1 transition-colors px-2 py-0.5 rounded-lg hover:bg-white/[0.05]"
                      >
                        {copiedId === `${msg.id}-email` ? (
                          <>
                            <Check className="w-3 h-3 text-emerald-400" />
                            <span className="text-emerald-400 text-[11px]">Copied</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3 h-3" />
                            <span className="text-[11px]">Copy</span>
                          </>
                        )}
                      </button>
                    </div>

                    <div className="text-xs text-slate-400">
                      <span className="text-slate-500 font-medium">Subject:</span>{" "}
                      <span className="text-slate-200 font-medium">{msg.emailSubject}</span>
                    </div>

                    <div className="text-xs whitespace-pre-line text-slate-300 leading-relaxed max-h-48 overflow-y-auto pr-1">
                      {msg.emailBody}
                    </div>
                  </div>

                  {/* WhatsApp Box */}
                  <div className="p-4 rounded-xl bg-emerald-500/[0.03] border border-emerald-500/10 space-y-2.5">
                    <div className="flex items-center justify-between border-b border-emerald-500/10 pb-2">
                      <span className="text-xs font-medium text-emerald-400 flex items-center space-x-1.5">
                        <MessageSquare className="w-3.5 h-3.5" />
                        <span>WhatsApp Angle</span>
                        <span className="text-[10px] text-emerald-500/70">({whatsappWordCount}w)</span>
                      </span>
                      {msg.whatsappBody && (
                        <button
                          onClick={() => copyToClipboard(msg.whatsappBody, `${msg.id}-wa`)}
                          className="text-xs text-emerald-400 hover:text-emerald-300 flex items-center space-x-1 transition-colors px-2 py-0.5 rounded-lg hover:bg-emerald-500/10"
                        >
                          {copiedId === `${msg.id}-wa` ? (
                            <>
                              <Check className="w-3 h-3 text-emerald-400" />
                              <span className="text-emerald-400 text-[11px]">Copied</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3 h-3" />
                              <span className="text-[11px]">Copy</span>
                            </>
                          )}
                        </button>
                      )}
                    </div>

                    <div className="text-xs whitespace-pre-line text-slate-300 leading-relaxed max-h-48 overflow-y-auto">
                      {msg.whatsappBody || "No WhatsApp angle generated."}
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center justify-between pt-2 border-t border-white/[0.04]">
                  <div className="flex items-center space-x-3">
                    {msg.status !== "APPROVED" && (
                      <button
                        onClick={() => handleApprove(msg.id)}
                        disabled={isProcessing}
                        className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium flex items-center space-x-1.5 transition-all shadow-md shadow-emerald-600/20 active:scale-95 disabled:opacity-50"
                      >
                        {isProcessing ? (
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <CheckCircle2 className="w-3.5 h-3.5" />
                        )}
                        <span>Approve Outreach</span>
                      </button>
                    )}

                    <Link
                      href={`/leads/${msg.company.id}`}
                      className="px-3.5 py-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-slate-300 text-xs font-medium flex items-center space-x-1.5 transition-all"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      <span>Review / Edit</span>
                    </Link>
                  </div>

                  {msg.status !== "APPROVED" && (
                    <button
                      onClick={() => handleReject(msg.id)}
                      disabled={isProcessing}
                      className="text-xs text-slate-400 hover:text-rose-400 transition-colors"
                    >
                      Skip / Reject
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
