import type { Metadata } from "next";
import "./globals.css";
import Link from "next/link";
import {
  ShieldAlert,
  Layers,
  Sparkles,
  CheckCircle2,
  Upload,
  Settings,
  Activity,
  Cpu,
  Send,
} from "lucide-react";

export const metadata: Metadata = {
  title: "LEAD INTELLIGENCE OS | AI Opportunity & Outreach Platform",
  description:
    "Production-grade AI Lead Intelligence, Opportunity Detection, and Human-Approved Sales Outreach System.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="bg-background text-slate-100 min-h-screen flex flex-col antialiased">
        {/* Top Command Bar */}
        <header className="sticky top-0 z-50 border-b border-border bg-[#090a0f]/90 backdrop-blur-md px-6 py-3 flex items-center justify-between">
          <div className="flex items-center space-x-6">
            <Link href="/" className="flex items-center space-x-2.5 group">
              <div className="w-8 h-8 rounded-lg bg-blue-600/20 border border-blue-500/40 flex items-center justify-center text-blue-400 group-hover:border-blue-400 transition-colors">
                <Cpu className="w-4 h-4" />
              </div>
              <div>
                <span className="text-sm font-semibold tracking-wider text-slate-100 font-mono">
                  LEAD INTELLIGENCE<span className="text-blue-500 ml-1">OS</span>
                </span>
                <span className="block text-[10px] text-slate-400 font-mono -mt-1 tracking-tight">
                  ENTERPRISE v1.0
                </span>
              </div>
            </Link>

            <nav className="hidden md:flex items-center space-x-1 text-xs font-medium">
              <Link
                href="/"
                className="px-3 py-1.5 rounded-md text-slate-300 hover:text-white hover:bg-card transition-colors flex items-center space-x-1.5"
              >
                <Activity className="w-3.5 h-3.5" />
                <span>Dashboard</span>
              </Link>
              <Link
                href="/leads"
                className="px-3 py-1.5 rounded-md text-slate-300 hover:text-white hover:bg-card transition-colors flex items-center space-x-1.5"
              >
                <Layers className="w-3.5 h-3.5" />
                <span>Leads</span>
              </Link>
              <Link
                href="/opportunities"
                className="px-3 py-1.5 rounded-md text-slate-300 hover:text-white hover:bg-card transition-colors flex items-center space-x-1.5"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>Opportunities</span>
              </Link>
              <Link
                href="/messages"
                className="px-3 py-1.5 rounded-md text-slate-300 hover:text-white hover:bg-card transition-colors flex items-center space-x-1.5"
              >
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>Review Queue</span>
              </Link>
              <Link
                href="/pilot"
                className="px-3 py-1.5 rounded-md text-slate-300 hover:text-white hover:bg-blue-950/40 hover:border-blue-800/60 border border-transparent transition-colors flex items-center space-x-1.5"
              >
                <Send className="w-3.5 h-3.5 text-blue-400" />
                <span>Pilot (Max 5)</span>
              </Link>
              <Link
                href="/leads/import"
                className="px-3 py-1.5 rounded-md text-slate-300 hover:text-white hover:bg-card transition-colors flex items-center space-x-1.5"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>Import Leads</span>
              </Link>
            </nav>
          </div>

          <div className="flex items-center space-x-4">
            {/* System Status Indicators */}
            <div className="hidden sm:flex items-center space-x-2 text-[11px] font-mono">
              <span className="flex items-center space-x-1 px-2 py-0.5 rounded bg-emerald-950/60 border border-emerald-800/40 text-emerald-400">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                <span>POSTGRES:5432</span>
              </span>
              <span className="flex items-center space-x-1 px-2 py-0.5 rounded bg-blue-950/60 border border-blue-800/40 text-blue-400">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-400"></span>
                <span>N8N:5678</span>
              </span>
            </div>

            <Link
              href="/settings"
              className="p-1.5 rounded-lg border border-border bg-card text-slate-400 hover:text-white hover:border-slate-600 transition-colors"
              title="Settings & System Diagnostics"
            >
              <Settings className="w-4 h-4" />
            </Link>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="flex-1 max-w-7xl w-full mx-auto p-6 md:p-8">
          {children}
        </main>

        {/* Footer */}
        <footer className="border-t border-border/60 bg-[#090a0f] px-6 py-4 text-xs text-slate-400 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center space-x-2">
            <span>LEAD INTELLIGENCE OS</span>
            <span>•</span>
            <span>Human-Approved Outreach Gate Active</span>
          </div>
          <div className="font-mono text-[11px] text-slate-400">
            Zero Unauthorized Cold Outreach Policy
          </div>
        </footer>
      </body>
    </html>
  );
}
