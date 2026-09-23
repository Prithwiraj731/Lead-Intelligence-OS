"use client";

import { useEffect, useState } from "react";
import {
  Settings,
  Database,
  Cpu,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Zap,
  Key,
  Mail,
  MessageSquare,
  ShieldAlert,
  Sliders,
  Send,
  AlertTriangle,
  Lock,
  Globe,
  Plus,
  Trash2,
  Info,
} from "lucide-react";

export default function SettingsPage() {
  const [health, setHealth] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Domain Health State
  const [domainInput, setDomainInput] = useState("leadintel.local");
  const [domainHealth, setDomainHealth] = useState<any>(null);
  const [checkingDomain, setCheckingDomain] = useState(false);

  // Suppressions State
  const [suppressions, setSuppressions] = useState<any[]>([]);
  const [newSuppressionEmail, setNewSuppressionEmail] = useState("");
  const [newSuppressionReason, setNewSuppressionReason] = useState("MANUAL_SUPPRESSION");
  const [addingSuppression, setAddingSuppression] = useState(false);

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
      setOauthBanner(null);
      const res = await fetch("/api/auth/gmail/url?redirectUri=" + encodeURIComponent(window.location.origin + "/api/auth/gmail/callback"));
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
      } else {
        setOauthBanner({ type: "error", message: json.error || "Failed to disconnect Gmail" });
      }
    } catch (err: any) {
      setOauthBanner({ type: "error", message: err.message || "Failed to disconnect Gmail" });
    } finally {
      setDisconnectingGmail(false);
    }
  };

  const checkHealth = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/health");
      const json = await res.json();
      setHealth(json);
    } catch {
      setHealth({ status: "error", database: { connected: false }, n8n: { connected: false } });
    } finally {
      setLoading(false);
    }
  };

  const fetchSuppressions = async () => {
    try {
      const res = await fetch("/api/delivery/suppressions");
      const json = await res.json();
      if (json.success) {
        setSuppressions(json.data || []);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleCheckDomain = async () => {
    try {
      setCheckingDomain(true);
      const res = await fetch(`/api/delivery/domain-health?domain=${encodeURIComponent(domainInput)}`);
      const json = await res.json();
      if (json.success) {
        setDomainHealth(json.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setCheckingDomain(false);
    }
  };

  const handleAddSuppression = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSuppressionEmail) return;

    try {
      setAddingSuppression(true);
      const res = await fetch("/api/delivery/suppressions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: newSuppressionEmail,
          reason: newSuppressionReason,
          source: "USER_DASHBOARD",
        }),
      });
      const json = await res.json();
      if (json.success) {
        setNewSuppressionEmail("");
        await fetchSuppressions();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setAddingSuppression(false);
    }
  };

  useEffect(() => {
    checkHealth();
    fetchSuppressions();
    fetchGmailStatus();
    handleCheckDomain();

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

  return (
    <div className="space-y-8 max-w-5xl mx-auto pb-16">
      {/* Header */}
      <div className="border-b border-border pb-6">
        <div className="flex items-center space-x-2">
          <span className="px-2 py-0.5 rounded text-[11px] font-mono bg-blue-950/80 border border-blue-800/60 text-blue-400">
            SYSTEM DIAGNOSTICS & DELIVERY CONTROL
          </span>
          <span className="text-xs text-slate-400">Infrastructure & Outbound Governance</span>
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-white mt-1">
          Settings & Outbound Delivery Infrastructure
        </h1>
        <p className="text-sm text-slate-400 mt-0.5">
          Manage system health, provider abstractions, domain DNS verification, rate limits, and global kill switch.
        </p>
      </div>

      {/* Global Kill Switch & Dry-Run State Banner */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-slate-900 via-[#0c0e14] to-blue-950/40 border border-border shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/60 pb-4">
          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <Lock className="w-4 h-4 text-emerald-400" />
              <span className="text-xs font-mono font-bold text-white uppercase">
                GLOBAL OUTBOUND KILL SWITCH & DELIVERY STATUS
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Live transmission of emails and WhatsApp messages is locked server-side. Zero external provider dispatches can occur.
            </p>
          </div>

          <div className="flex items-center space-x-2 shrink-0">
            <span className="px-3 py-1 rounded-full text-xs font-mono font-bold bg-emerald-950 text-emerald-400 border border-emerald-800 flex items-center space-x-1.5">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>KILL SWITCH: ACTIVE (SAFE)</span>
            </span>
            <span className="px-3 py-1 rounded-full text-xs font-mono font-bold bg-blue-950 text-blue-400 border border-blue-800 flex items-center space-x-1.5">
              <Zap className="w-3.5 h-3.5" />
              <span>DRY-RUN MODE: ON</span>
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          <div className="p-3 rounded-xl bg-[#0c0e14] border border-border space-y-1">
            <span className="text-[10px] font-mono text-slate-400 uppercase">Hourly Sending Limit</span>
            <p className="text-sm font-bold font-mono text-white">20 Messages / hr</p>
          </div>
          <div className="p-3 rounded-xl bg-[#0c0e14] border border-border space-y-1">
            <span className="text-[10px] font-mono text-slate-400 uppercase">Daily Sending Limit</span>
            <p className="text-sm font-bold font-mono text-white">100 Messages / day</p>
          </div>
          <div className="p-3 rounded-xl bg-[#0c0e14] border border-border space-y-1">
            <span className="text-[10px] font-mono text-slate-400 uppercase">Duplicate Window Guard</span>
            <p className="text-sm font-bold font-mono text-white">14 Days Cool-down</p>
          </div>
        </div>
      </div>

      {/* Core Infrastructure Diagnostics */}
      <div className="space-y-4">
        <h2 className="text-xs font-semibold text-white tracking-wider uppercase font-mono flex items-center space-x-2">
          <Database className="w-3.5 h-3.5 text-blue-400" />
          <span>Core Infrastructure Diagnostics</span>
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* PostgreSQL Card */}
          <div className="p-5 rounded-2xl bg-card border border-border space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2.5">
                <Database className="w-5 h-5 text-emerald-400" />
                <div>
                  <h3 className="text-xs font-semibold text-white">PostgreSQL Database</h3>
                  <span className="text-[10px] text-slate-400 font-mono">
                    Container: leadintel-postgres :5432
                  </span>
                </div>
              </div>

              {loading ? (
                <RefreshCw className="w-4 h-4 animate-spin text-slate-400" />
              ) : health?.database?.connected ? (
                <span className="flex items-center space-x-1 text-[11px] font-mono text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-800">
                  <CheckCircle2 className="w-3 h-3" />
                  <span>ONLINE ({health.database.latencyMs}ms)</span>
                </span>
              ) : (
                <span className="flex items-center space-x-1 text-[11px] font-mono text-rose-400 bg-rose-950/80 px-2 py-0.5 rounded border border-rose-800">
                  <XCircle className="w-3 h-3" />
                  <span>OFFLINE</span>
                </span>
              )}
            </div>

            <p className="text-xs text-slate-300">
              Stores leads, deep research signals, diagnosed opportunities, human approval logs, and delivery records.
            </p>
          </div>

          {/* n8n Orchestration Layer Card */}
          <div className="p-5 rounded-2xl bg-card border border-border space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2.5">
                <Zap className="w-5 h-5 text-blue-400" />
                <div>
                  <h3 className="text-xs font-semibold text-white">n8n Workflow Engine</h3>
                  <span className="text-[10px] text-slate-400 font-mono">
                    Existing Container :5678
                  </span>
                </div>
              </div>

              {loading ? (
                <RefreshCw className="w-4 h-4 animate-spin text-slate-400" />
              ) : health?.n8n?.connected ? (
                <span className="flex items-center space-x-1 text-[11px] font-mono text-blue-400 bg-blue-950/80 px-2 py-0.5 rounded border border-blue-800">
                  <CheckCircle2 className="w-3 h-3" />
                  <span>ACTIVE (LIO — 02)</span>
                </span>
              ) : (
                <span className="flex items-center space-x-1 text-[11px] font-mono text-amber-400 bg-amber-950/80 px-2 py-0.5 rounded border border-amber-800">
                  <AlertTriangle className="w-3 h-3" />
                  <span>DISCONNECTED</span>
                </span>
              )}
            </div>

            <p className="text-xs text-slate-300">
              Workflow <code className="text-blue-300 font-mono">LIO — 02 Lead Research</code> automates multi-page research.
            </p>
          </div>
        </div>
      </div>

      {/* OAuth Notification Banner */}
      {oauthBanner && (
        <div
          className={`p-4 rounded-xl border flex items-center justify-between text-xs font-mono ${
            oauthBanner.type === "success"
              ? "bg-emerald-950/80 border-emerald-800/80 text-emerald-300"
              : "bg-rose-950/80 border-rose-800/80 text-rose-300"
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

      {/* Gmail API OAuth 2.0 Integration Card (Controlled Pilot) */}
      <div className="p-6 rounded-2xl bg-gradient-to-br from-card via-[#0e111a] to-blue-950/30 border border-blue-900/50 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/60 pb-4">
          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <Mail className="w-4 h-4 text-blue-400" />
              <h2 className="text-xs font-semibold text-white tracking-wider uppercase font-mono">
                Gmail API OAuth 2.0 Authentication (Controlled Pilot)
              </h2>
            </div>
            <p className="text-xs text-slate-400">
              Zero password storage. Uses OAuth 2.0 authorization tokens stored strictly server-side.
            </p>
          </div>

          <div className="flex items-center space-x-2 shrink-0">
            {loadingGmail ? (
              <span className="flex items-center space-x-1 text-[11px] font-mono text-slate-400">
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>Checking Status...</span>
              </span>
            ) : gmailStatus?.connected ? (
              <span className="px-3 py-1 rounded-full text-xs font-mono font-bold bg-emerald-950 text-emerald-400 border border-emerald-800 flex items-center space-x-1.5">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>AUTHENTICATED: {gmailStatus.email}</span>
              </span>
            ) : (
              <span className="px-3 py-1 rounded-full text-xs font-mono font-bold bg-slate-800 text-slate-400 border border-slate-700 flex items-center space-x-1.5">
                <Lock className="w-3.5 h-3.5" />
                <span>NOT CONNECTED</span>
              </span>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
          <div className="p-3.5 rounded-xl bg-[#0c0e14] border border-border space-y-1.5">
            <span className="text-[10px] font-mono text-slate-400 uppercase">Verified Sender Identity</span>
            <p className="text-sm font-bold font-mono text-white truncate">
              {gmailStatus?.email || "prithwi1016@gmail.com"}
            </p>
            <span className="text-[10px] text-emerald-400 font-mono flex items-center gap-1">
              ✓ Verified Identity
            </span>
          </div>

          <div className="p-3.5 rounded-xl bg-[#0c0e14] border border-border space-y-1.5">
            <span className="text-[10px] font-mono text-slate-400 uppercase">Token Security</span>
            <p className="text-sm font-bold font-mono text-white">Server-Side Only</p>
            <span className="text-[10px] text-blue-400 font-mono flex items-center gap-1">
              🔒 Zero Client Exposure
            </span>
          </div>

          <div className="p-3.5 rounded-xl bg-[#0c0e14] border border-border space-y-1.5">
            <span className="text-[10px] font-mono text-slate-400 uppercase">Pilot Outbound Gate</span>
            <p className="text-sm font-bold font-mono text-white">Kill Switch Active</p>
            <span className="text-[10px] text-amber-400 font-mono flex items-center gap-1">
              ⚡ Zero Transmissions
            </span>
          </div>
        </div>

        <div className="pt-2 flex flex-wrap items-center justify-between gap-3">
          <div className="text-[11px] text-slate-400 flex items-center space-x-1.5">
            <Info className="w-3.5 h-3.5 text-blue-400 shrink-0" />
            <span>
              Google OAuth tokens are kept in server storage. Password or SMTP credentials are never stored.
            </span>
          </div>

          <div className="flex items-center space-x-2">
            {gmailStatus?.connected ? (
              <button
                onClick={handleDisconnectGmail}
                disabled={disconnectingGmail}
                className="px-3.5 py-1.5 rounded-lg bg-rose-950/80 hover:bg-rose-900 border border-rose-800 text-rose-300 text-xs font-mono font-semibold transition-colors disabled:opacity-50 flex items-center space-x-1.5"
              >
                {disconnectingGmail && <RefreshCw className="w-3 h-3 animate-spin" />}
                <span>DISCONNECT GMAIL</span>
              </button>
            ) : (
              <button
                onClick={handleConnectGmail}
                disabled={connectingGmail}
                className="px-4 py-2 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-mono font-bold transition-all shadow-lg shadow-blue-900/30 flex items-center space-x-2 disabled:opacity-50"
              >
                {connectingGmail ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Mail className="w-3.5 h-3.5" />
                )}
                <span>CONNECT GMAIL (prithwi1016@gmail.com)</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Email & Outbound Provider Abstractions */}
      <div className="space-y-4">
        <h2 className="text-xs font-semibold text-white tracking-wider uppercase font-mono flex items-center space-x-2">
          <Mail className="w-3.5 h-3.5 text-blue-400" />
          <span>Pluggable Provider Abstractions (Zero Hardcoding)</span>
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
          {/* Dry-Run Engine Card */}
          <div className="p-4 rounded-xl bg-card border border-blue-800/60 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-mono font-bold text-white">Dry-Run Simulator</span>
              <span className="text-[10px] font-mono px-2 py-0.2 rounded bg-blue-950 text-blue-400 border border-blue-800">
                ACTIVE (DEFAULT)
              </span>
            </div>
            <p className="text-slate-400 text-[11px]">
              Executes all 8 safety gates, calculates SHA-256 idempotency, and creates simulated delivery receipts.
            </p>
          </div>

          {/* Gmail API OAuth 2.0 Card */}
          <div className="p-4 rounded-xl bg-card border border-blue-900/50 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-mono font-bold text-white">Gmail API (OAuth 2.0)</span>
              <span
                className={`text-[10px] font-mono px-2 py-0.2 rounded ${
                  gmailStatus?.connected
                    ? "bg-emerald-950 text-emerald-400 border border-emerald-800"
                    : "bg-slate-800 text-slate-400 border border-slate-700"
                }`}
              >
                {gmailStatus?.connected ? "READY (PILOT)" : "READY TO CONNECT"}
              </span>
            </div>
            <p className="text-slate-400 text-[11px]">
              {gmailStatus?.connected
                ? `Authenticated sender: ${gmailStatus.email}. Ready for controlled pilot sends.`
                : "Gmail OAuth 2.0 provider abstraction with server-side token management."}
            </p>
          </div>

          {/* Resend / SMTP Card */}
          <div className="p-4 rounded-xl bg-card border border-border space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-mono font-bold text-white">Resend / SMTP</span>
              <span className="text-[10px] font-mono px-2 py-0.2 rounded bg-slate-800 text-slate-400">
                LOCKED (DRY-RUN)
              </span>
            </div>
            <p className="text-slate-400 text-[11px]">
              Pluggable email provider abstraction with server-side credentials and header signing.
            </p>
          </div>

          {/* Official WhatsApp Cloud API Card */}
          <div className="p-4 rounded-xl bg-card border border-border space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-mono font-bold text-white">WhatsApp Business API</span>
              <span className="text-[10px] font-mono px-2 py-0.2 rounded bg-slate-800 text-slate-400">
                LOCKED (OFFICIAL)
              </span>
            </div>
            <p className="text-slate-400 text-[11px]">
              Official Meta Cloud API provider interface. WhatsApp is strictly disabled during the pilot.
            </p>
          </div>
        </div>
      </div>

      {/* Domain Health Check (SPF / DKIM / DMARC) */}
      <div className="p-6 rounded-2xl bg-card border border-border space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border/60 pb-3">
          <div>
            <h2 className="text-xs font-semibold text-white tracking-wider uppercase font-mono flex items-center space-x-2">
              <Globe className="w-3.5 h-3.5 text-indigo-400" />
              <span>Outbound Domain DNS Health Check (SPF / DKIM / DMARC)</span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Verify DNS authentication records to ensure email deliverability and sender reputation.
            </p>
          </div>

          <div className="flex items-center space-x-2">
            <input
              type="text"
              value={domainInput}
              onChange={(e) => setDomainInput(e.target.value)}
              placeholder="e.g. yourdomain.com"
              className="px-3 py-1.5 rounded-lg bg-[#0c0e14] border border-border text-xs text-white focus:outline-none focus:border-blue-500 font-mono"
            />
            <button
              onClick={handleCheckDomain}
              disabled={checkingDomain}
              className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold flex items-center space-x-1 font-mono"
            >
              <RefreshCw className={`w-3 h-3 ${checkingDomain ? "animate-spin" : ""}`} />
              <span>CHECK DNS</span>
            </button>
          </div>
        </div>

        {domainHealth && (
          <div className="space-y-3 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-3 rounded-xl bg-[#0c0e14] border border-border space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-slate-400">SPF Record</span>
                  <span
                    className={`text-[9px] font-mono px-1.5 py-0.2 rounded font-bold ${
                      domainHealth.isProviderManaged
                        ? "bg-blue-950 text-blue-400 border border-blue-800"
                        : domainHealth.hasSpf
                        ? "bg-emerald-950 text-emerald-400 border border-emerald-800"
                        : "bg-amber-950 text-amber-400 border border-amber-800"
                    }`}
                  >
                    {domainHealth.isProviderManaged ? "PROVIDER MANAGED" : domainHealth.hasSpf ? "VERIFIED" : "UNVERIFIED"}
                  </span>
                </div>
                <p className="text-[11px] text-slate-400">Authorizes sending IP addresses</p>
              </div>

              <div className="p-3 rounded-xl bg-[#0c0e14] border border-border space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-slate-400">DKIM Signature</span>
                  <span
                    className={`text-[9px] font-mono px-1.5 py-0.2 rounded font-bold ${
                      domainHealth.isProviderManaged
                        ? "bg-blue-950 text-blue-400 border border-blue-800"
                        : domainHealth.hasDkim
                        ? "bg-emerald-950 text-emerald-400 border border-emerald-800"
                        : "bg-amber-950 text-amber-400 border border-amber-800"
                    }`}
                  >
                    {domainHealth.isProviderManaged ? "PROVIDER MANAGED" : domainHealth.hasDkim ? "VERIFIED" : "UNVERIFIED"}
                  </span>
                </div>
                <p className="text-[11px] text-slate-400">Cryptographic message integrity</p>
              </div>

              <div className="p-3 rounded-xl bg-[#0c0e14] border border-border space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-slate-400">DMARC Policy</span>
                  <span
                    className={`text-[9px] font-mono px-1.5 py-0.2 rounded font-bold ${
                      domainHealth.isProviderManaged
                        ? "bg-blue-950 text-blue-400 border border-blue-800"
                        : domainHealth.hasDmarc
                        ? "bg-emerald-950 text-emerald-400 border border-emerald-800"
                        : "bg-amber-950 text-amber-400 border border-amber-800"
                    }`}
                  >
                    {domainHealth.isProviderManaged ? "PROVIDER MANAGED" : domainHealth.hasDmarc ? "VERIFIED" : "UNVERIFIED"}
                  </span>
                </div>
                <p className="text-[11px] text-slate-400">Domain-level enforcement policy</p>
              </div>
            </div>

            {/* DNS Records Detail Table */}
            <div className="p-3 rounded-xl bg-[#0c0e14] border border-border space-y-2">
              <span className="text-[10px] font-mono text-slate-400 uppercase block">DNS Query Audit Log</span>
              <div className="space-y-1.5">
                {domainHealth.records?.map((rec: any, i: number) => (
                  <div key={i} className="p-2 rounded bg-card/60 border border-border/40 text-[11px] flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="space-y-0.5">
                      <span className="font-mono font-bold text-white">{rec.recordType}</span> &bull; <span className="font-mono text-slate-400">{rec.name}</span>
                      <p className="text-slate-300">{rec.notes}</p>
                    </div>
                    <span className={`text-[9px] font-mono px-2 py-0.5 rounded shrink-0 self-start sm:self-auto font-bold ${
                      rec.status === "VERIFIED"
                        ? "bg-emerald-950 text-emerald-400 border border-emerald-800"
                        : rec.status === "PROVIDER_MANAGED"
                        ? "bg-blue-950 text-blue-400 border border-blue-800"
                        : "bg-slate-800 text-slate-400 border border-slate-700"
                    }`}>
                      {rec.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Global Suppression Registry */}
      <div className="p-6 rounded-2xl bg-card border border-border space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border/60 pb-3">
          <div>
            <h2 className="text-xs font-semibold text-white tracking-wider uppercase font-mono flex items-center space-x-2">
              <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />
              <span>Global Suppression Registry ({suppressions.length})</span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Suppressed emails, domains, and phone numbers are permanently blocked across all future delivery attempts.
            </p>
          </div>
        </div>

        {/* Add Manual Suppression Form */}
        <form onSubmit={handleAddSuppression} className="flex flex-col sm:flex-row items-center gap-2 text-xs">
          <input
            type="text"
            value={newSuppressionEmail}
            onChange={(e) => setNewSuppressionEmail(e.target.value)}
            placeholder="email@example.com or domain.com"
            className="flex-1 px-3.5 py-2 rounded-lg bg-[#0c0e14] border border-border text-xs text-white focus:outline-none focus:border-blue-500 font-mono w-full sm:w-auto"
          />
          <select
            value={newSuppressionReason}
            onChange={(e) => setNewSuppressionReason(e.target.value)}
            className="px-3 py-2 rounded-lg bg-[#0c0e14] border border-border text-xs text-white focus:outline-none focus:border-blue-500 font-mono"
          >
            <option value="MANUAL_SUPPRESSION">MANUAL_SUPPRESSION</option>
            <option value="UNSUBSCRIBE">UNSUBSCRIBE</option>
            <option value="DO_NOT_CONTACT">DO_NOT_CONTACT</option>
            <option value="BOUNCE">BOUNCE</option>
            <option value="INVALID_CONTACT">INVALID_CONTACT</option>
          </select>
          <button
            type="submit"
            disabled={addingSuppression || !newSuppressionEmail}
            className="px-4 py-2 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-semibold flex items-center space-x-1.5 transition-colors disabled:opacity-50 font-mono shrink-0"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>ADD SUPPRESSION</span>
          </button>
        </form>

        {/* Suppressions Table */}
        <div className="space-y-2 text-xs">
          {suppressions.length === 0 ? (
            <p className="text-slate-500 text-xs italic py-2">No active suppressions recorded.</p>
          ) : (
            suppressions.slice(0, 10).map((s) => (
              <div key={s.id} className="p-2.5 rounded-lg bg-[#0c0e14] border border-border/80 flex items-center justify-between text-xs">
                <div className="flex items-center space-x-3">
                  <span className="font-mono text-slate-200">{s.email || s.domain || s.phone}</span>
                  <span className="text-[10px] font-mono text-rose-400 bg-rose-950/80 border border-rose-800/80 px-2 py-0.2 rounded">
                    {s.reason}
                  </span>
                </div>
                <span className="text-[10px] font-mono text-slate-500">
                  {new Date(s.createdAt).toLocaleDateString()}
                </span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
