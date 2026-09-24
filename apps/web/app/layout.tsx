import type { Metadata } from "next";
import "./globals.css";
import Link from "next/link";
import {
  Layers,
  Sparkles,
  CheckCircle2,
  Upload,
  Settings,
  Activity,
  Send,
  Zap,
} from "lucide-react";

export const metadata: Metadata = {
  title: "LeadIntel OS | Intelligent Lead Research & Outreach",
  description:
    "Autonomous B2B Lead Intelligence, Technical Footprint Auditing & High-Intent Outreach Engine.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body suppressHydrationWarning className="bg-background text-slate-100 min-h-screen flex flex-col antialiased selection:bg-indigo-500/30 selection:text-white">
        {/* Top Navigation Bar */}
        <header className="sticky top-0 z-50 border-b border-border/80 bg-[#08090d]/80 backdrop-blur-xl px-5 sm:px-8 py-2.5 flex items-center justify-between transition-all">
          <div className="flex items-center space-x-8">
            <Link href="/" className="flex items-center space-x-2.5 group">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-purple-500 flex items-center justify-center text-white shadow-md shadow-indigo-500/20 group-hover:scale-105 transition-transform duration-200">
                <Zap className="w-4 h-4 fill-white" />
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-sm font-semibold tracking-tight text-white group-hover:text-indigo-200 transition-colors">
                  LeadIntel
                </span>
                <span className="text-[10px] font-medium tracking-wide uppercase px-1.5 py-0.5 rounded-md bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                  OS
                </span>
              </div>
            </Link>

            <nav className="hidden md:flex items-center space-x-1 text-xs font-medium">
              <Link
                href="/"
                className="px-3 py-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/[0.05] transition-all flex items-center space-x-1.5"
              >
                <Activity className="w-3.5 h-3.5" />
                <span>Dashboard</span>
              </Link>
              <Link
                href="/leads"
                className="px-3 py-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/[0.05] transition-all flex items-center space-x-1.5"
              >
                <Layers className="w-3.5 h-3.5" />
                <span>Leads</span>
              </Link>
              <Link
                href="/opportunities"
                className="px-3 py-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/[0.05] transition-all flex items-center space-x-1.5"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-400/80" />
                <span>Opportunities</span>
              </Link>
              <Link
                href="/messages"
                className="px-3 py-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/[0.05] transition-all flex items-center space-x-1.5"
              >
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400/80" />
                <span>Review Queue</span>
              </Link>
              <Link
                href="/pilot"
                className="px-3 py-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/[0.05] transition-all flex items-center space-x-1.5"
              >
                <Send className="w-3.5 h-3.5 text-indigo-400/80" />
                <span>Campaign Pilot</span>
              </Link>
              <Link
                href="/leads/import"
                className="px-3 py-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/[0.05] transition-all flex items-center space-x-1.5"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>Import</span>
              </Link>
            </nav>
          </div>

          <div className="flex items-center space-x-3.5">
            {/* Minimalist Live Status Pill */}
            <div className="hidden sm:flex items-center space-x-2 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-[11px] font-medium text-emerald-400">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
              <span>All Systems Operational</span>
            </div>

            <Link
              href="/settings"
              className="p-2 rounded-lg border border-border bg-card/60 text-slate-400 hover:text-white hover:border-slate-600/80 hover:bg-card transition-all"
              title="Settings & System Diagnostics"
            >
              <Settings className="w-4 h-4" />
            </Link>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="flex-1 max-w-7xl w-full mx-auto p-5 sm:p-8">
          {children}
        </main>

        {/* Minimalist Footer */}
        <footer className="border-t border-border/50 bg-[#08090d]/60 backdrop-blur-sm px-6 py-4 text-xs text-slate-500 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center space-x-2 text-slate-400">
            <span className="font-medium text-slate-300">LeadIntel OS</span>
            <span className="text-slate-600">•</span>
            <span>Zero-Unauthorized Outreach Policy</span>
          </div>
          <div className="text-[11px] text-slate-500 flex items-center gap-3">
            <span>Deterministic Scoring</span>
            <span>•</span>
            <span>7-Layer Safety Gate</span>
          </div>
        </footer>
      </body>
    </html>
  );
}
