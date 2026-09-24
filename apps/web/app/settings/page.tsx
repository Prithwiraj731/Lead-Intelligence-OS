"use client";

import { useEffect, useState } from "react";
import {
  Settings,
  Database,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Zap,
  Mail,
  ShieldAlert,
  AlertTriangle,
  Lock,
  Globe,
  Plus,
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
      const res = await fetch("/api/auth/gmail/url?returnTo=/settings");
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
      <div className="border-b border-border/60 pb-6">
        <div className="flex items-center space-x-2 mb-1.5">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
            <Settings className="w-3 h-3" />
            Infrastructure & Outbound Control
          </span>
          <span className="text-xs text-slate-500">•</span>
          <span className="text-xs text-slate-400">System Diagnostics</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-white">
          System Settings & Delivery Infrastructure
        </h1>
        <p className="text-xs sm:text-sm text-slate-400 mt-1 leading-relaxed">
          Manage system health, provider abstractions, domain DNS verification, rate limits, and global kill switch.
        </p>
      </div>

      {/* Global Kill Switch & Dry-Run State Banner */}
      <div className="glass-panel p-6 rounded-2xl border border-white/[0.08] space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/[0.04] pb-4">
          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <Lock className="w-4 h-4 text-emerald-400" />
              <span className="text-xs font-semibold text-white">
                Global Outbound Kill Switch & Delivery Status
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Live transmission of emails and WhatsApp messages is locked server-side. Zero external provider dispatches can occur.
            </p>
          </div>

          <div className="flex items-center space-x-2 shrink-0">
            <span className="px-3 py-1 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center space-x-1.5">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Kill Switch: Active</span>
            </span>
            <span className="px-3 py-1 rounded-full text-xs font-medium bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 flex items-center space-x-1.5">
              <Zap className="w-3.5 h-3.5" />
              <span>Dry-Run: On</span>
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          <div className="glass-card p-3.5 rounded-xl border border-white/[0.06] space-y-1">
            <span className="text-[11px] text-slate-500 font-medium">Hourly Sending Limit</span>
            <p className="text-base font-bold text-white">20 Messages / hr</p>
          </div>
          <div className="glass-card p-3.5 rounded-xl border border-white/[0.06] space-y-1">
            <span className="text-[11px] text-slate-500 font-medium">Daily Sending Limit</span>
            <p className="text-base font-bold text-white">100 Messages / day</p>
          </div>
          <div className="glass-card p-3.5 rounded-xl border border-white/[0.06] space-y-1">
            <span className="text-[11px] text-slate-500 font-medium">Duplicate Window Guard</span>
            <p className="text-base font-bold text-white">14 Days Cool-down</p>
          </div>
        </div>
      </div>

      {/* Core Infrastructure Diagnostics */}
      <div className="space-y-4">
        <h2 className="text-sm font-semibold text-slate-200 tracking-tight flex items-center space-x-2">
          <Database className="w-4 h-4 text-indigo-400" />
          <span>Core Infrastructure Diagnostics</span>
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* PostgreSQL Card */}
          <div className="glass-panel p-5 rounded-2xl border border-white/[0.06] space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                  <Database className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-xs font-semibold text-white">PostgreSQL Database</h3>
                  <span className="text-[11px] text-slate-500 font-mono">
                    leadintel-postgres :5432
                  </span>
                </div>
              </div>

              {loading ? (
                <RefreshCw className="w-4 h-4 animate-spin text-slate-400" />
              ) : health?.database?.connected ? (
                <span className="flex items-center space-x-1.5 text-xs text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20 font-medium">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span>Online ({health.database.latencyMs}ms)</span>
                </span>
              ) : (
                <span className="flex items-center space-x-1 text-xs text-rose-400 bg-rose-500/10 px-2.5 py-1 rounded-full border border-rose-500/20 font-medium">
                  <XCircle className="w-3.5 h-3.5" />
                  <span>Offline</span>
                </span>
              )}
            </div>

            <p className="text-xs text-slate-400 leading-relaxed">
              Stores normalized leads, technical research footprints, diagnosed opportunities, and immutable delivery audit trails.
            </p>
          </div>

          {/* n8n Orchestration Layer Card */}
          <div className="glass-panel p-5 rounded-2xl border border-white/[0.06] space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
                  <Zap className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-xs font-semibold text-white">n8n Workflow Engine</h3>
                  <span className="text-[11px] text-slate-500 font-mono">
                    Service Port :5678
                  </span>
                </div>
              </div>

              {loading ? (
                <RefreshCw className="w-4 h-4 animate-spin text-slate-400" />
              ) : health?.n8n?.connected ? (
                <span className="flex items-center space-x-1.5 text-xs text-indigo-400 bg-indigo-500/10 px-2.5 py-1 rounded-full border border-indigo-500/20 font-medium">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Active (LIO — 02)</span>
                </span>
              ) : (
                <span className="flex items-center space-x-1 text-xs text-amber-400 bg-amber-500/10 px-2.5 py-1 rounded-full border border-amber-500/20 font-medium">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  <span>Disconnected</span>
                </span>
              )}
            </div>

            <p className="text-xs text-slate-400 leading-relaxed">
              Orchestrates deterministic crawler nodes, multi-page deep inspection, and webhooks.
            </p>
          </div>
        </div>
      </div>

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

      {/* Gmail API OAuth 2.0 Integration Card (Controlled Pilot) */}
      <div className="glass-panel p-6 rounded-2xl border border-white/[0.08] space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/[0.04] pb-4">
          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <Mail className="w-4 h-4 text-indigo-400" />
              <h2 className="text-xs font-semibold text-white">
                Gmail API OAuth 2.0 Authentication (Pilot Sender)
              </h2>
            </div>
            <p className="text-xs text-slate-400">
              Zero password storage. Uses OAuth 2.0 authorization tokens stored strictly server-side.
            </p>
          </div>

          <div className="flex items-center space-x-2 shrink-0">
            {loadingGmail ? (
              <span className="flex items-center space-x-1 text-xs text-slate-400">
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>Checking...</span>
              </span>
            ) : gmailStatus?.connected ? (
              <span className="px-3 py-1 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center space-x-1.5">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Authenticated: {gmailStatus.email}</span>
              </span>
            ) : (
              <span className="px-3 py-1 rounded-full text-xs font-medium bg-white/[0.04] text-slate-400 border border-white/[0.08] flex items-center space-x-1.5">
                <Lock className="w-3.5 h-3.5" />
                <span>Not Connected</span>
              </span>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
          <div className="glass-card p-3.5 rounded-xl border border-white/[0.06] space-y-1">
            <span className="text-[11px] text-slate-500 font-medium">Verified Sender Identity</span>
            <p className="text-sm font-semibold text-white truncate">
              {gmailStatus?.email || "prithwi1016@gmail.com"}
            </p>
            <span className="text-[11px] text-emerald-400 font-medium flex items-center gap-1">
              ✓ Verified Identity
            </span>
          </div>

          <div className="glass-card p-3.5 rounded-xl border border-white/[0.06] space-y-1">
            <span className="text-[11px] text-slate-500 font-medium">Token Security</span>
            <p className="text-sm font-semibold text-white">Server-Side Storage</p>
            <span className="text-[11px] text-indigo-400 font-medium flex items-center gap-1">
              🔒 Zero Client Exposure
            </span>
          </div>

          <div className="glass-card p-3.5 rounded-xl border border-white/[0.06] space-y-1">
            <span className="text-[11px] text-slate-500 font-medium">Pilot Outbound Gate</span>
            <p className="text-sm font-semibold text-white">Kill Switch Active</p>
            <span className="text-[11px] text-amber-400 font-medium flex items-center gap-1">
              ⚡ Zero Transmissions
            </span>
          </div>
        </div>

        <div className="pt-2 flex flex-wrap items-center justify-between gap-3">
          <div className="text-xs text-slate-400 flex items-center space-x-1.5">
            <Info className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
            <span>
              Google OAuth tokens are kept in server storage. Password or SMTP credentials are never stored.
            </span>
          </div>

          <div className="flex items-center space-x-2">
            {gmailStatus?.connected ? (
              <button
                onClick={handleDisconnectGmail}
                disabled={disconnectingGmail}
                className="px-3.5 py-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 text-rose-300 text-xs font-medium transition-all disabled:opacity-50 flex items-center space-x-1.5"
              >
                {disconnectingGmail && <RefreshCw className="w-3 h-3 animate-spin" />}
                <span>Disconnect Gmail</span>
              </button>
            ) : (
              <button
                onClick={handleConnectGmail}
                disabled={connectingGmail}
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium transition-all shadow-md shadow-indigo-600/20 flex items-center space-x-2 disabled:opacity-50 active:scale-95"
              >
                {connectingGmail ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Mail className="w-3.5 h-3.5" />
                )}
                <span>Connect Gmail</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Email & Outbound Provider Abstractions */}
      <div className="space-y-4">
        <h2 className="text-sm font-semibold text-slate-200 tracking-tight flex items-center space-x-2">
          <Mail className="w-4 h-4 text-indigo-400" />
          <span>Pluggable Provider Abstractions</span>
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
          {/* Dry-Run Engine Card */}
          <div className="glass-panel p-4 rounded-2xl border border-indigo-500/30 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-white">Dry-Run Simulator</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 font-medium">
                ACTIVE
              </span>
            </div>
            <p className="text-slate-400 text-xs leading-relaxed">
              Executes all 7 safety gates, calculates SHA-256 idempotency locks, and writes audit receipts.
            </p>
          </div>

          {/* Gmail API OAuth 2.0 Card */}
          <div className="glass-panel p-4 rounded-2xl border border-white/[0.06] space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-white">Gmail API</span>
              <span
                className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                  gmailStatus?.connected
                    ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                    : "bg-white/[0.04] text-slate-400 border border-white/[0.08]"
                }`}
              >
                {gmailStatus?.connected ? "READY" : "CONFIGURED"}
              </span>
            </div>
            <p className="text-slate-400 text-xs leading-relaxed">
              {gmailStatus?.connected
                ? `Authenticated sender: ${gmailStatus.email}. Ready for pilot.`
                : "Gmail OAuth 2.0 provider with server-side token management."}
            </p>
          </div>

          {/* Resend / SMTP Card */}
          <div className="glass-panel p-4 rounded-2xl border border-white/[0.06] space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-white">Resend / SMTP</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/[0.04] text-slate-400 border border-white/[0.08]">
                STANDBY
              </span>
            </div>
            <p className="text-slate-400 text-xs leading-relaxed">
              Pluggable email provider abstraction with server-side credentials and header signing.
            </p>
          </div>

          {/* Official WhatsApp Cloud API Card */}
          <div className="glass-panel p-4 rounded-2xl border border-white/[0.06] space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-white">WhatsApp Cloud API</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/[0.04] text-slate-400 border border-white/[0.08]">
                DISABLED
              </span>
            </div>
            <p className="text-slate-400 text-xs leading-relaxed">
              Official Meta Cloud API provider interface. WhatsApp is disabled during the pilot.
            </p>
          </div>
        </div>
      </div>

      {/* Domain Health Check (SPF / DKIM / DMARC) */}
      <div className="glass-panel p-6 rounded-2xl border border-white/[0.06] space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/[0.04] pb-3">
          <div>
            <h2 className="text-sm font-semibold text-white flex items-center space-x-2">
              <Globe className="w-4 h-4 text-indigo-400" />
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
              className="px-3.5 py-2 rounded-xl bg-card border border-border/80 text-xs text-white focus:outline-none focus:border-indigo-500/80 font-mono"
            />
            <button
              onClick={handleCheckDomain}
              disabled={checkingDomain}
              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium flex items-center space-x-1.5 transition-all shadow-md shadow-indigo-600/20 active:scale-95"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${checkingDomain ? "animate-spin" : ""}`} />
              <span>Verify DNS</span>
            </button>
          </div>
        </div>

        {domainHealth && (
          <div className="space-y-3 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="glass-card p-3.5 rounded-xl border border-white/[0.06] space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-slate-300">SPF Record</span>
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                      domainHealth.isProviderManaged
                        ? "bg-indigo-500/10 text-indigo-300 border border-indigo-500/20"
                        : domainHealth.hasSpf
                        ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                        : "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                    }`}
                  >
                    {domainHealth.isProviderManaged ? "PROVIDER MANAGED" : domainHealth.hasSpf ? "VERIFIED" : "UNVERIFIED"}
                  </span>
                </div>
                <p className="text-[11px] text-slate-400">Authorizes sending IP addresses</p>
              </div>

              <div className="glass-card p-3.5 rounded-xl border border-white/[0.06] space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-slate-300">DKIM Signature</span>
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                      domainHealth.isProviderManaged
                        ? "bg-indigo-500/10 text-indigo-300 border border-indigo-500/20"
                        : domainHealth.hasDkim
                        ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                        : "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                    }`}
                  >
                    {domainHealth.isProviderManaged ? "PROVIDER MANAGED" : domainHealth.hasDkim ? "VERIFIED" : "UNVERIFIED"}
                  </span>
                </div>
                <p className="text-[11px] text-slate-400">Cryptographic message integrity</p>
              </div>

              <div className="glass-card p-3.5 rounded-xl border border-white/[0.06] space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-slate-300">DMARC Policy</span>
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                      domainHealth.isProviderManaged
                        ? "bg-indigo-500/10 text-indigo-300 border border-indigo-500/20"
                        : domainHealth.hasDmarc
                        ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                        : "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                    }`}
                  >
                    {domainHealth.isProviderManaged ? "PROVIDER MANAGED" : domainHealth.hasDmarc ? "VERIFIED" : "UNVERIFIED"}
                  </span>
                </div>
                <p className="text-[11px] text-slate-400">Domain-level enforcement policy</p>
              </div>
            </div>

            {/* DNS Records Detail Table */}
            <div className="p-3.5 rounded-xl bg-black/20 border border-white/[0.04] space-y-2">
              <span className="text-[11px] font-medium text-slate-400 block">DNS Query Audit Log</span>
              <div className="space-y-1.5">
                {domainHealth.records?.map((rec: any, i: number) => (
                  <div key={i} className="p-2.5 rounded-lg bg-white/[0.02] border border-white/[0.04] text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="space-y-0.5">
                      <span className="font-semibold text-white">{rec.recordType}</span> &bull; <span className="font-mono text-slate-400 text-[11px]">{rec.name}</span>
                      <p className="text-slate-400 text-xs">{rec.notes}</p>
                    </div>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full shrink-0 self-start sm:self-auto font-medium ${
                      rec.status === "VERIFIED"
                        ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                        : rec.status === "PROVIDER_MANAGED"
                        ? "bg-indigo-500/10 text-indigo-300 border border-indigo-500/20"
                        : "bg-white/[0.04] text-slate-400 border border-white/[0.08]"
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
      <div className="glass-panel p-6 rounded-2xl border border-white/[0.06] space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/[0.04] pb-3">
          <div>
            <h2 className="text-sm font-semibold text-white flex items-center space-x-2">
              <ShieldAlert className="w-4 h-4 text-rose-400" />
              <span>Global Suppression Registry ({suppressions.length})</span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Suppressed emails, domains, and phone numbers are permanently blocked across all future delivery attempts.
            </p>
          </div>
        </div>

        {/* Add Manual Suppression Form */}
        <form onSubmit={handleAddSuppression} className="flex flex-col sm:flex-row items-center gap-2.5 text-xs">
          <input
            type="text"
            value={newSuppressionEmail}
            onChange={(e) => setNewSuppressionEmail(e.target.value)}
            placeholder="email@example.com or domain.com"
            className="flex-1 px-3.5 py-2.5 rounded-xl bg-card border border-border/80 text-xs text-white focus:outline-none focus:border-indigo-500/80 w-full sm:w-auto"
          />
          <select
            value={newSuppressionReason}
            onChange={(e) => setNewSuppressionReason(e.target.value)}
            className="px-3.5 py-2.5 rounded-xl bg-card border border-border/80 text-xs text-slate-300 focus:outline-none focus:border-indigo-500/80 cursor-pointer"
          >
            <option value="MANUAL_SUPPRESSION">Manual Suppression</option>
            <option value="UNSUBSCRIBE">Unsubscribe</option>
            <option value="DO_NOT_CONTACT">Do Not Contact</option>
            <option value="BOUNCE">Bounce</option>
            <option value="INVALID_CONTACT">Invalid Contact</option>
          </select>
          <button
            type="submit"
            disabled={addingSuppression || !newSuppressionEmail}
            className="px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-medium flex items-center space-x-1.5 transition-all shadow-md shadow-rose-600/20 disabled:opacity-50 shrink-0 active:scale-95"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Suppression</span>
          </button>
        </form>

        {/* Suppressions Table */}
        <div className="space-y-2 text-xs">
          {suppressions.length === 0 ? (
            <p className="text-slate-500 text-xs italic py-2">No active suppressions recorded.</p>
          ) : (
            suppressions.slice(0, 10).map((s) => (
              <div key={s.id} className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.04] flex items-center justify-between text-xs">
                <div className="flex items-center space-x-3">
                  <span className="font-mono text-slate-300 text-xs">{s.email || s.domain || s.phone}</span>
                  <span className="text-[10px] text-rose-400 bg-rose-500/10 border border-rose-500/20 px-2 py-0.5 rounded-full font-medium">
                    {s.reason.replace(/_/g, " ")}
                  </span>
                </div>
                <span className="text-[11px] text-slate-500">
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
