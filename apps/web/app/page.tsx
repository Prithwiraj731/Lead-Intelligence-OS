"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Zap,
  ChevronRight,
  ShieldCheck,
  Search,
  Sparkles,
  Send,
  Layers,
  Activity,
  ArrowUpRight,
  Crosshair,
  Radar,
} from "lucide-react";

export default function HomePage() {
  const router = useRouter();
  const [isWarping, setIsWarping] = useState(false);
  const [activeAgent, setActiveAgent] = useState<number | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleLaunchDashboard = () => {
    setIsWarping(true);
    setTimeout(() => {
      router.push("/dashboard");
    }, 750);
  };

  return (
    <div className="relative min-h-screen w-full bg-[#07080c] text-slate-100 flex flex-col justify-between overflow-hidden selection:bg-red-500/20 selection:text-white select-none">
      {/* ========================================================================= */}
      {/* 1. CINEMATIC BACKGROUND & GEOMETRIC SLICE (REFERENCE MOTIF)               */}
      {/* ========================================================================= */}

      {/* Atmospheric Vignette & Deep Noir Ambient Lights */}
      <div className="absolute inset-0 pointer-events-none z-0">
        {/* Subtle Dark Crimson Rim Aura on Left (matching characters' suit rim lights) */}
        <div className="absolute top-1/4 -left-32 w-[550px] h-[550px] bg-red-600/[0.045] rounded-full blur-[140px]" />
        {/* Cold Titanium Slate Aura on Right */}
        <div className="absolute bottom-1/4 -right-32 w-[600px] h-[600px] bg-slate-400/[0.035] rounded-full blur-[160px]" />
        {/* Center Spotlight */}
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[500px] bg-white/[0.02] rounded-full blur-[120px]" />

        {/* Tactical Crosshair Coordinates */}
        <div className="absolute top-28 left-12 text-[10px] font-mono text-slate-700 tracking-widest hidden lg:block">
          SEC_GRID // 25.2048° N • 55.2708° E
        </div>
        <div className="absolute bottom-16 right-12 text-[10px] font-mono text-slate-700 tracking-widest hidden lg:block">
          SYS_FREQ // 104.8 GHz • ENCRYPTED
        </div>
      </div>

      {/* THE SIGNATURE DIAGONAL BAND (POPPING OUT GEOMETRY FROM REFERENCE) */}
      <div className="absolute inset-0 pointer-events-none z-[1] overflow-hidden flex items-center justify-center">
        {/* Primary Diagonal Platinum/Slate Geometric Slash */}
        <div
          className="w-[220vw] h-[340px] sm:h-[400px] lg:h-[440px] bg-gradient-to-r from-[#94a3b8]/[0.08] via-[#cbd5e1]/[0.18] to-[#94a3b8]/[0.08] backdrop-blur-[2px] border-y border-white/[0.12] -rotate-[22deg] translate-y-6 sm:translate-y-10 relative shadow-[0_0_90px_rgba(0,0,0,0.85)]"
        >
          {/* Subtle Cyber Data Streams inside the band */}
          <div className="absolute inset-0 opacity-20 bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:24px_24px]" />
          
          {/* Subtle Ascending Vector Chevrons inside the band */}
          <div className="absolute top-1/2 left-3/4 -translate-y-1/2 opacity-20 text-white flex flex-col space-y-3 font-mono text-sm tracking-widest pointer-events-none">
            <span>▲ ▲ ▲ RECON</span>
            <span>▲ ▲ ▲ AUDIT</span>
            <span>▲ ▲ ▲ OUTREACH</span>
          </div>

          <div className="absolute top-1/2 left-[18%] -translate-y-1/2 opacity-15 text-white font-mono text-xs tracking-[0.3em] pointer-events-none hidden md:block">
            AUTONOMOUS COMMERCIAL PIPELINE // TACTICAL TRIAD
          </div>
        </div>
      </div>

      {/* Giant Textured Metallic Stencil Typography in Background (Reference "LAST") */}
      <div className="absolute right-4 sm:right-10 lg:right-20 bottom-24 sm:bottom-28 z-[2] pointer-events-none select-none">
        <h2 className="text-6xl sm:text-8xl lg:text-9xl font-black tracking-tighter text-white/[0.045] uppercase font-mono leading-none">
          TRIAD
        </h2>
        <div className="text-[11px] font-mono tracking-[0.4em] text-slate-700 text-right mt-1">
          LEAD INTELLIGENCE OS
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. MINIMALIST TOP NAVIGATION (REFERENCE STYLE)                            */}
      {/* ========================================================================= */}
      <header className="relative z-30 w-full px-6 sm:px-12 py-6 flex items-center justify-between">
        {/* Brand Mark */}
        <div className="flex items-center space-x-3 group cursor-pointer" onClick={() => router.push("/")}>
          <div className="w-8 h-8 rounded-lg bg-zinc-900 border border-white/[0.15] flex items-center justify-center text-white shadow-lg shadow-black/80 group-hover:border-red-500/60 transition-all duration-300">
            <Zap className="w-4 h-4 fill-white text-white group-hover:text-red-400 transition-colors" />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-base font-bold tracking-tight text-white font-mono">
              LEADINTEL
            </span>
            <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse"></span>
            <span className="text-[10px] font-mono tracking-widest text-slate-500 uppercase px-1.5 py-0.5 rounded bg-white/[0.04] border border-white/[0.08]">
              OS
            </span>
          </div>
        </div>

        {/* Minimalist Center Navigation */}
        <nav className="hidden md:flex items-center space-x-8 text-xs font-mono tracking-wider text-slate-400">
          <button
            onClick={() => setActiveAgent(activeAgent === 0 ? null : 0)}
            className={`transition-colors flex items-center space-x-1.5 ${
              activeAgent === 0 ? "text-white" : "hover:text-white"
            }`}
          >
            <span className="text-red-500/80">01</span>
            <span>RESEARCHER</span>
          </button>
          <button
            onClick={() => setActiveAgent(activeAgent === 1 ? null : 1)}
            className={`transition-colors flex items-center space-x-1.5 ${
              activeAgent === 1 ? "text-white" : "hover:text-white"
            }`}
          >
            <span className="text-slate-200">02</span>
            <span>ARCHITECT</span>
          </button>
          <button
            onClick={() => setActiveAgent(activeAgent === 2 ? null : 2)}
            className={`transition-colors flex items-center space-x-1.5 ${
              activeAgent === 2 ? "text-white" : "hover:text-white"
            }`}
          >
            <span className="text-red-500/80">03</span>
            <span>OUTREACHER</span>
          </button>
        </nav>

        {/* Right Action / Direct Console Link */}
        <div className="flex items-center space-x-4">
          <Link
            href="/dashboard"
            className="group px-3.5 py-1.5 rounded-lg border border-white/[0.15] hover:border-white/[0.3] bg-zinc-900/60 hover:bg-zinc-800/80 text-[11px] font-mono text-slate-300 hover:text-white transition-all flex items-center space-x-2"
          >
            <span>CONSOLE</span>
            <ArrowUpRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-white transition-colors" />
          </Link>
        </div>
      </header>

      {/* ========================================================================= */}
      {/* 3. HERO CENTER: POPPED-OUT CHARACTERS & TACTICAL HUD CARDS                */}
      {/* ========================================================================= */}
      <main className="relative z-20 flex-1 flex flex-col justify-center items-center px-4 sm:px-8 max-w-7xl mx-auto w-full">
        <div className="relative w-full h-[540px] sm:h-[620px] lg:h-[700px] flex items-center justify-center">

          {/* LEFT FLOATING BRIEFING GLASS CARD (INSPIRED BY REFERENCE) */}
          <div className="absolute left-2 sm:left-4 lg:left-6 top-12 sm:top-20 max-w-[260px] sm:max-w-[320px] z-20 hidden md:block">
            <div className="p-5 sm:p-6 rounded-2xl bg-[#0b0d14]/85 backdrop-blur-xl border border-white/[0.1] shadow-2xl shadow-black/90 space-y-3 hover:border-white/[0.2] transition-all">
              <div className="flex items-center justify-between text-[10px] font-mono text-slate-500 border-b border-white/[0.08] pb-2">
                <span>MISSION_BRIEFING // 01</span>
                <span className="text-emerald-400 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                  READY
                </span>
              </div>
              <p className="text-xs sm:text-[13px] text-slate-300 leading-relaxed font-normal">
                Are you ready to deploy the autonomous revenue triad to scout, audit, and convert high-ticket enterprise accounts before your competitors make contact?
              </p>
              <div className="pt-2 flex items-center justify-between text-[11px] font-mono text-slate-400">
                <span className="text-slate-500">VELOCITY</span>
                <span className="text-white font-semibold">1.46s / AUDIT</span>
              </div>
            </div>
          </div>

          {/* =================================================================== */}
          {/* THE 3 AGENT CHARACTER HUD LABELS (BEHIND / ABOVE HEADS - NO OVERLAP) */}
          {/* =================================================================== */}

          {/* CHARACTER 01: LEFT HEAD (DEEP RESEARCHER - EYE EMBLEM) */}
          <div
            className={`absolute left-[4%] sm:left-[10%] lg:left-[14%] top-16 sm:top-20 lg:top-24 z-20 transition-all duration-300 ${
              activeAgent === 0 ? "scale-105" : "hover:scale-105"
            }`}
          >
            <div className="relative group cursor-pointer" onClick={() => setActiveAgent(activeAgent === 0 ? null : 0)}>
              {/* Hairline Pointer Trace to Left Visor */}
              <div className="absolute -bottom-10 right-4 w-[1px] h-10 bg-gradient-to-b from-red-500/80 to-transparent rotate-[20deg]" />

              <div className="px-3.5 py-2 rounded-xl bg-[#090b10]/95 backdrop-blur-md border border-white/[0.12] hover:border-red-500/50 shadow-xl shadow-black/90 space-y-1">
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-500"></span>
                  <span className="text-[9px] font-mono text-slate-400 uppercase tracking-wider">
                    AGENT 01 // RECON
                  </span>
                </div>
                <div className="text-xs sm:text-sm font-bold tracking-tight text-white font-mono flex items-center gap-1.5">
                  <span>DEEP RESEARCHER</span>
                </div>
                <div className="text-[10px] text-slate-500 font-mono hidden sm:block">
                  Live Web Audit • SSL & CMS Fingerprint
                </div>
              </div>
            </div>
          </div>

          {/* CHARACTER 02: CENTER HEAD (DEAL ARCHITECT - CHEVRON EMBLEM - ELEVATED) */}
          <div
            className={`absolute left-1/2 -translate-x-1/2 -top-4 sm:-top-2 lg:top-0 z-20 transition-all duration-300 ${
              activeAgent === 1 ? "scale-105" : "hover:scale-105"
            }`}
          >
            <div className="relative group cursor-pointer" onClick={() => setActiveAgent(activeAgent === 1 ? null : 1)}>
              {/* Hairline Pointer Trace to Center Visor */}
              <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 w-[1px] h-8 bg-gradient-to-b from-white/90 to-transparent" />

              <div className="px-4 py-2.5 rounded-xl bg-[#090b10]/95 backdrop-blur-md border border-white/[0.2] hover:border-white/60 shadow-2xl shadow-black/90 space-y-1 text-center">
                <div className="flex items-center justify-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping"></span>
                  <span className="text-[9px] font-mono text-slate-300 uppercase tracking-widest font-semibold">
                    AGENT 02 // VALUATION
                  </span>
                </div>
                <div className="text-xs sm:text-base font-extrabold tracking-tight text-white font-mono">
                  DEAL ARCHITECT
                </div>
                <div className="text-[10px] text-slate-400 font-mono hidden sm:block">
                  15-Service Neural Matcher • Commercial ROI Matrix
                </div>
              </div>
            </div>
          </div>

          {/* CHARACTER 03: RIGHT HEAD (SIGNAL OUTREACHER - PYRAMID EMBLEM) */}
          <div
            className={`absolute right-[4%] sm:right-[10%] lg:right-[14%] top-16 sm:top-20 lg:top-24 z-20 transition-all duration-300 ${
              activeAgent === 2 ? "scale-105" : "hover:scale-105"
            }`}
          >
            <div className="relative group cursor-pointer" onClick={() => setActiveAgent(activeAgent === 2 ? null : 2)}>
              {/* Hairline Pointer Trace to Right Visor */}
              <div className="absolute -bottom-10 left-4 w-[1px] h-10 bg-gradient-to-b from-red-500/80 to-transparent -rotate-[20deg]" />

              <div className="px-3.5 py-2 rounded-xl bg-[#090b10]/95 backdrop-blur-md border border-white/[0.12] hover:border-red-500/50 shadow-xl shadow-black/90 space-y-1 text-right">
                <div className="flex items-center justify-end gap-2">
                  <span className="text-[9px] font-mono text-slate-400 uppercase tracking-wider">
                    AGENT 03 // DISPATCH
                  </span>
                  <span className="w-1.5 h-1.5 rounded-full bg-red-500"></span>
                </div>
                <div className="text-xs sm:text-sm font-bold tracking-tight text-white font-mono flex items-center justify-end gap-1.5">
                  <span>SIGNAL OUTREACHER</span>
                </div>
                <div className="text-[10px] text-slate-500 font-mono hidden sm:block">
                  1:1 Verified Gmail & WhatsApp Pipeline
                </div>
              </div>
            </div>
          </div>

          {/* =================================================================== */}
          {/* THE 3 CHARACTERS (hero_char.png) POPPING OUT WITH FADED SIDES       */}
          {/* =================================================================== */}
          <div className="relative z-10 w-[360px] sm:w-[500px] lg:w-[620px] max-w-full flex items-center justify-center select-none pointer-events-none mt-14 sm:mt-18">
            {/* The Image with Dual-Axis Soft Feathering to hide cropped edges */}
            <picture>
              <source srcSet="/hero_char_web.webp" type="image/webp" />
              <img
                src="/hero_char_web.png"
                alt="Lead Intelligence OS Autonomous Triad"
                className="w-full h-auto object-contain filter drop-shadow-[0_20px_50px_rgba(0,0,0,0.9)] transform transition-transform duration-700 hover:scale-[1.01]"
                style={{
                  /* Dual-axis gradient mask: seamlessly fades the cropped left/right arms and the bottom */
                  maskImage:
                    "linear-gradient(to right, transparent 0%, rgba(0,0,0,0.4) 6%, black 18%, black 82%, rgba(0,0,0,0.4) 94%, transparent 100%), linear-gradient(to bottom, black 0%, black 72%, rgba(0,0,0,0.5) 86%, transparent 100%)",
                  WebkitMaskImage:
                    "linear-gradient(to right, transparent 0%, rgba(0,0,0,0.4) 6%, black 18%, black 82%, rgba(0,0,0,0.4) 94%, transparent 100%), linear-gradient(to bottom, black 0%, black 72%, rgba(0,0,0,0.5) 86%, transparent 100%)",
                  maskComposite: "intersect",
                  WebkitMaskComposite: "destination-in",
                }}
              />
            </picture>
          </div>

          {/* =================================================================== */}
          {/* 4. THE ULTIMATE ANIMATED HYPERCAR LAUNCH BUTTON                     */}
          {/* =================================================================== */}
          <div className="absolute bottom-2 sm:bottom-4 left-1/2 -translate-x-1/2 z-30">
            <button
              onClick={handleLaunchDashboard}
              className="relative group p-0.5 rounded-full overflow-hidden focus:outline-none transition-transform duration-300 active:scale-95 cursor-pointer shadow-[0_0_40px_rgba(239,68,68,0.25)] hover:shadow-[0_0_60px_rgba(239,68,68,0.45)]"
            >
              {/* Shimmering Animated Laser Border */}
              <span className="absolute inset-0 bg-gradient-to-r from-red-600 via-white to-red-600 opacity-90 animate-[spin_3s_linear_infinite]" />

              {/* Inner Button Body */}
              <div className="relative px-8 sm:px-12 py-3.5 sm:py-4 rounded-full bg-[#0a0c13] border border-white/[0.15] flex items-center space-x-3.5 group-hover:bg-[#10131d] transition-colors">
                {/* Pulsing Ember Beacon */}
                <div className="relative flex items-center justify-center">
                  <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping absolute opacity-75"></span>
                  <span className="w-2 h-2 rounded-full bg-red-500"></span>
                </div>

                {/* Main Action Text */}
                <div className="flex flex-col text-left">
                  <div className="text-xs sm:text-sm font-black tracking-widest text-white uppercase font-mono flex items-center gap-2">
                    <span>LAUNCH COMMAND DASHBOARD</span>
                    <ChevronRight className="w-4 h-4 text-red-400 group-hover:translate-x-1 transition-transform" />
                  </div>
                  <span className="text-[9px] font-mono tracking-wider text-slate-500 uppercase">
                    INITIALIZE ENTERPRISE TERMINAL // VERIFIED ACCESS
                  </span>
                </div>
              </div>
            </button>
          </div>
        </div>
      </main>

      {/* ========================================================================= */}
      {/* 5. MINIMALIST FOOTER TELEMETRY STATUS (REFERENCE INVENTORY)               */}
      {/* ========================================================================= */}
      <footer className="relative z-30 w-full px-6 sm:px-12 py-5 flex flex-col sm:flex-row items-center justify-between text-[11px] font-mono text-slate-500 border-t border-white/[0.05] gap-3 bg-[#07080c]/60 backdrop-blur-md">
        {/* Left Subsystem Badges */}
        <div className="flex items-center space-x-4">
          <span className="text-slate-400 font-semibold">CORE PLATFORMS</span>
          <span className="text-slate-700">|</span>
          <span className="hover:text-slate-300 transition-colors">PostgreSQL 16</span>
          <span>•</span>
          <span className="hover:text-slate-300 transition-colors">NASA n8n Telemetry</span>
          <span>•</span>
          <span className="hover:text-slate-300 transition-colors">Gmail API 2.0</span>
        </div>

        {/* Right Security Guarantee */}
        <div className="flex items-center space-x-2 text-slate-400">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          <span>ZERO-UNAUTHORIZED OUTREACH ACTIVE</span>
        </div>
      </footer>

      {/* ========================================================================= */}
      {/* 6. HYPERSPACE WARP JUMP TRANSITION SCREEN                                 */}
      {/* ========================================================================= */}
      {isWarping && (
        <div className="fixed inset-0 z-50 bg-[#07080c] flex flex-col items-center justify-center animate-in fade-in duration-300">
          {/* Radial Warp Speed Lines */}
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(239,68,68,0.15)_0%,transparent_70%)] animate-pulse" />
          
          <div className="relative z-10 flex flex-col items-center space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-zinc-900 border border-white/[0.2] flex items-center justify-center text-red-500 shadow-2xl shadow-red-500/30 animate-spin">
              <Zap className="w-6 h-6 fill-red-500 text-red-500" />
            </div>

            <div className="text-center space-y-1">
              <div className="text-sm font-mono font-bold tracking-widest text-white uppercase animate-pulse">
                INITIALIZING COMMAND DASHBOARD...
              </div>
              <div className="text-[10px] font-mono text-slate-500 tracking-wider">
                CALIBRATING TRIAD SENSORS [100%]
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
