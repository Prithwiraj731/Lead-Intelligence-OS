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
  Building2,
  Sparkles,
  ArrowRight,
  ExternalLink,
  ShieldAlert,
  BarChart3,
  Copy,
  Info,
  Layers,
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-6">
        <div>
          <div className="flex items-center space-x-2">
            <span className="px-2 py-0.5 rounded text-[11px] font-mono bg-emerald-950/80 border border-emerald-800/60 text-emerald-400 font-bold">
              HUMAN APPROVAL GATE
            </span>
            <span className="text-xs text-slate-400">Zero Unauthorized Sends</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white mt-1">
            Outreach Approval Deck ({messages.length})
          </h1>
          <p className="text-sm text-slate-400 mt-0.5">
            Carefully audit generated Email and WhatsApp copies. Only approved messages can ever be dispatched.
          </p>
        </div>

        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="px-3.5 py-2 rounded-lg bg-card border border-border text-xs text-slate-200 focus:outline-none focus:border-blue-500 self-start sm:self-auto font-mono"
        >
          <option value="READY_FOR_REVIEW">Awaiting Review (Pending)</option>
          <option value="EDITED">Edited Copies (Pending Approval)</option>
          <option value="APPROVED">Approved Messages</option>
          <option value="ALL">All Messages</option>
        </select>
      </div>

      {/* Messages List */}
      {loading ? (
        <div className="py-20 text-center text-slate-400 text-xs flex flex-col items-center space-y-2">
          <RefreshCw className="w-5 h-5 animate-spin text-blue-500" />
          <span>Loading approval queue...</span>
        </div>
      ) : messages.length === 0 ? (
        <div className="p-12 rounded-2xl border border-dashed border-border text-center space-y-3 bg-card/30">
          <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto" />
          <p className="text-sm font-semibold text-white">Queue is clear</p>
          <p className="text-xs text-slate-400">
            No outbound messages currently awaiting human review.
          </p>
          <Link
            href="/leads"
            className="inline-flex items-center space-x-2 text-xs px-4 py-2 rounded-lg bg-blue-600/20 border border-blue-500/40 text-blue-400 hover:bg-blue-600 hover:text-white mt-2"
          >
            <span>Browse Leads to Research</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      ) : (
        <div className="space-y-6">
          {messages.map((msg) => {
            const isProcessing = actionId === msg.id;
            const emailWordCount = (msg.emailBody || "").trim().split(/\s+/).filter(Boolean).length;
            const whatsappWordCount = (msg.whatsappBody || "").trim().split(/\s+/).filter(Boolean).length;
            const evidenceList = (msg.evidenceUsed || []) as string[];

            return (
              <div
                key={msg.id}
                className="p-6 rounded-2xl bg-card border border-border hover:border-slate-700 transition-colors space-y-5"
              >
                {/* Message Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border/60 pb-3">
                  <div className="flex items-center space-x-3">
                    <Link
                      href={`/leads/${msg.company.id}`}
                      className="text-base font-bold text-white hover:text-blue-400 transition-colors flex items-center space-x-1.5"
                    >
                      <span>{msg.company.name}</span>
                      <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
                    </Link>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-mono">
                      {msg.company.industry || msg.company.location || "UAE"}
                    </span>
                  </div>

                  <div className="flex items-center space-x-3">
                    {msg.qualityScore !== undefined && (
                      <span className="text-[11px] font-mono px-2.5 py-0.5 rounded bg-emerald-950/80 border border-emerald-800 text-emerald-400 font-bold flex items-center space-x-1">
                        <BarChart3 className="w-3 h-3" />
                        <span>QUALITY: {msg.qualityScore}/100</span>
                      </span>
                    )}

                    <span
                      className={`text-[11px] font-mono px-2.5 py-0.5 rounded-full border font-bold ${
                        msg.status === "APPROVED"
                          ? "bg-emerald-950/80 border-emerald-800 text-emerald-400"
                          : msg.status === "EDITED"
                          ? "bg-blue-950/80 border-blue-800 text-blue-400"
                          : "bg-amber-950/80 border-amber-800 text-amber-400 animate-pulse"
                      }`}
                    >
                      {msg.status}
                    </span>
                  </div>
                </div>

                {/* Recipient and Opportunity Banner */}
                {msg.opportunity && (
                  <div className="p-3.5 rounded-xl bg-[#0c0e14] border border-border text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <span className="text-[10px] text-slate-400 font-mono block">DIAGNOSED OFFER:</span>
                      <span className="font-semibold text-white">
                        {msg.opportunity.suggestedOffer || msg.opportunity.service?.name}
                      </span>
                    </div>
                    <div className="sm:text-right font-mono">
                      <span className="text-[10px] text-slate-400 block">EST. BUDGET</span>
                      <span className="text-cyan-400 font-bold text-xs">
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
                  <div className="p-3 rounded-xl bg-[#0c0e14]/60 border border-indigo-950 text-xs space-y-1">
                    <div className="text-[10px] font-mono text-indigo-400 uppercase font-bold flex items-center space-x-1">
                      <Info className="w-3 h-3 text-indigo-400" />
                      <span>Grounded On Verified Evidence:</span>
                    </div>
                    {evidenceList.map((ev, i) => (
                      <p key={i} className="text-[11px] text-slate-300">&bull; {ev}</p>
                    ))}
                  </div>
                )}

                {/* Side-by-Side Channels */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Email Box */}
                  <div className="p-4 rounded-xl bg-[#0c0e14] border border-border space-y-3">
                    <div className="flex items-center justify-between border-b border-border/60 pb-2">
                      <span className="text-[11px] font-mono font-bold text-blue-400 flex items-center space-x-1">
                        <Mail className="w-3.5 h-3.5" />
                        <span>EMAIL DRAFT ({emailWordCount}w)</span>
                      </span>
                      <button
                        onClick={() => copyToClipboard(`Subject: ${msg.emailSubject}\n\n${msg.emailBody}`, `${msg.id}-email`)}
                        className="text-[10px] font-mono text-slate-400 hover:text-white flex items-center space-x-1"
                      >
                        <Copy className="w-3 h-3" />
                        <span>{copiedId === `${msg.id}-email` ? "COPIED!" : "COPY"}</span>
                      </button>
                    </div>

                    <div className="text-xs font-mono text-slate-400">
                      Subject: <span className="text-slate-200 font-sans font-medium">{msg.emailSubject}</span>
                    </div>

                    <div className="text-xs whitespace-pre-line text-slate-200 leading-relaxed font-sans max-h-48 overflow-y-auto pr-1">
                      {msg.emailBody}
                    </div>
                  </div>

                  {/* WhatsApp Box */}
                  <div className="p-4 rounded-xl bg-emerald-950/10 border border-emerald-800/40 space-y-3">
                    <div className="flex items-center justify-between border-b border-emerald-900/40 pb-2">
                      <span className="text-[11px] font-mono font-bold text-emerald-400 flex items-center space-x-1">
                        <MessageSquare className="w-3.5 h-3.5" />
                        <span>WHATSAPP DRAFT ({whatsappWordCount}w)</span>
                      </span>
                      {msg.whatsappBody && (
                        <button
                          onClick={() => copyToClipboard(msg.whatsappBody, `${msg.id}-wa`)}
                          className="text-[10px] font-mono text-emerald-400 hover:text-emerald-300 flex items-center space-x-1"
                        >
                          <Copy className="w-3 h-3" />
                          <span>{copiedId === `${msg.id}-wa` ? "COPIED!" : "COPY"}</span>
                        </button>
                      )}
                    </div>

                    <div className="p-3 rounded-xl bg-emerald-900/20 text-xs text-slate-200 leading-relaxed font-sans max-h-48 overflow-y-auto">
                      {msg.whatsappBody || "No WhatsApp copy generated."}
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center justify-between pt-2 border-t border-border/60">
                  <div className="flex items-center space-x-3">
                    {msg.status !== "APPROVED" && (
                      <button
                        onClick={() => handleApprove(msg.id)}
                        disabled={isProcessing}
                        className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center space-x-1.5 transition-colors shadow-lg shadow-emerald-900/20"
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
                      className="px-3.5 py-2 rounded-xl bg-card hover:bg-card-hover border border-border text-slate-300 text-xs font-medium flex items-center space-x-1.5"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      <span>Side-by-Side Review / Edit</span>
                    </Link>
                  </div>

                  {msg.status !== "APPROVED" && (
                    <button
                      onClick={() => handleReject(msg.id)}
                      disabled={isProcessing}
                      className="text-xs text-slate-400 hover:text-rose-400 transition-colors font-mono"
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
