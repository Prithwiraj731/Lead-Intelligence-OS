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

import { AppShell } from "@/components/AppShell";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body suppressHydrationWarning className="bg-[#07080c] text-slate-100 min-h-screen antialiased selection:bg-red-500/20 selection:text-white">
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
