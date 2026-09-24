"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Zap, ChevronRight, ArrowUpRight } from "lucide-react";

export default function HomePage() {
  const router = useRouter();
  const [isLaunching, setIsLaunching] = useState(false);

  const handleLaunch = () => {
    if (isLaunching) return;
    setIsLaunching(true);
    // After shutter blocks close across screen (~520ms), route to dashboard with reveal
    setTimeout(() => {
      router.push("/dashboard?reveal=true");
    }, 550);
  };

  return (
    <div className="relative h-screen w-screen max-h-screen overflow-hidden bg-[#07080c] text-slate-100 flex flex-col justify-between selection:bg-red-500/20 selection:text-white select-none">
      {/* ========================================================================= */}
      {/* 1. CINEMATIC ATMOSPHERE & DEEP NOIR LIGHTING                              */}
      {/* ========================================================================= */}
      <div className="absolute inset-0 pointer-events-none z-0">
        {/* Subtle Dark Crimson Rim Aura on Left */}
        <div className="absolute top-1/4 -left-20 w-[450px] h-[450px] bg-red-600/[0.045] rounded-full blur-[140px]" />
        {/* Cold Titanium Slate Aura on Right */}
        <div className="absolute bottom-1/4 -right-20 w-[500px] h-[500px] bg-slate-400/[0.035] rounded-full blur-[160px]" />
        {/* Center Headlight Beam behind triad */}
        <div className="absolute top-[18%] left-1/2 -translate-x-1/2 w-[700px] h-[420px] bg-white/[0.028] rounded-full blur-[120px]" />
      </div>

      {/* ========================================================================= */}
      {/* 2. THE BROAD RECTANGLE (FULL-WIDTH STRETCHED DIAGONAL BAND - REFERENCE)   */}
      {/*    Characters pop from the bottom line and break through the top line    */}
      {/* ========================================================================= */}
      <div className="absolute inset-0 pointer-events-none z-[1] overflow-hidden">
        <svg
          className="w-full h-full"
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
        >
          <defs>
            {/* Broad Rectangle Surface Gradient (Matte Slate Steel Tone) */}
            <linearGradient id="bandSurface" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#1a1e28" stopOpacity="0.88" />
              <stop offset="50%" stopColor="#29303d" stopOpacity="0.92" />
              <stop offset="100%" stopColor="#181a24" stopOpacity="0.88" />
            </linearGradient>

            {/* Top Border Hairline Glow */}
            <linearGradient id="topLineGlow" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="rgba(255, 255, 255, 0.04)" />
              <stop offset="35%" stopColor="rgba(255, 255, 255, 0.45)" />
              <stop offset="65%" stopColor="rgba(255, 255, 255, 0.35)" />
              <stop offset="100%" stopColor="rgba(255, 255, 255, 0.05)" />
            </linearGradient>

            {/* Bottom Border Hairline Glow (The baseline from where characters pop) */}
            <linearGradient id="bottomLineGlow" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="rgba(239, 68, 68, 0.2)" />
              <stop offset="30%" stopColor="rgba(255, 255, 255, 0.65)" />
              <stop offset="70%" stopColor="rgba(255, 255, 255, 0.45)" />
              <stop offset="100%" stopColor="rgba(255, 255, 255, 0.08)" />
            </linearGradient>

            {/* Subtle Diagonal Grid Pinstripes */}
            <pattern id="diagGrid" width="4" height="4" patternTransform="rotate(45 0 0)" patternUnits="userSpaceOnUse">
              <line x1="0" y1="0" x2="0" y2="4" stroke="rgba(255,255,255,0.03)" strokeWidth="0.8" />
            </pattern>
          </defs>

          {/* Broad Diagonal Rectangle Stretched 100% Full-Width Edge to Edge */}
          {/* Top line: 0% 32% -> 100% 16% | Bottom line: 0% 74% -> 100% 64% */}
          <polygon
            points="0,32 100,16 100,64 0,74"
            fill="url(#bandSurface)"
          />
          <polygon
            points="0,32 100,16 100,64 0,74"
            fill="url(#diagGrid)"
          />

          {/* Top Line of the Rectangle */}
          <line
            x1="0"
            y1="32"
            x2="100"
            y2="16"
            stroke="url(#topLineGlow)"
            strokeWidth="0.35"
          />

          {/* Bottom Line of the Rectangle (Where characters pop from) */}
          <line
            x1="0"
            y1="74"
            x2="100"
            y2="64"
            stroke="url(#bottomLineGlow)"
            strokeWidth="0.55"
          />
        </svg>

        {/* Watermark Triad Typography in Background (Reference "LAST" motif) */}
        <div className="absolute right-4 sm:right-10 lg:right-20 top-[38%] pointer-events-none select-none z-[2]">
          <h2 className="text-6xl sm:text-7xl lg:text-9xl font-black tracking-tighter text-white/[0.04] font-mono leading-none">
            TRIAD
          </h2>
          <div className="text-[9px] sm:text-[11px] font-mono tracking-[0.4em] text-slate-500 text-right mt-1">
            LEAD INTELLIGENCE OS
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 3. MINIMAL TOP NAVIGATION BAR                                             */}
      {/* ========================================================================= */}
      <header className="relative z-30 w-full px-6 sm:px-12 py-3.5 sm:py-4 flex items-center justify-between flex-none">
        {/* Brand */}
        <Link href="/" className="flex items-center space-x-3 group">
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
        </Link>

        {/* Center Minimal Status */}
        <div className="hidden md:flex items-center space-x-2 text-[11px] font-mono text-slate-400 px-3 py-1 rounded-full bg-white/[0.03] border border-white/[0.08]">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
          <span>AUTONOMOUS ENGINE ONLINE</span>
        </div>

        {/* Direct Console Entry Link */}
        <button
          onClick={handleLaunch}
          className="group px-3.5 py-1.5 rounded-lg border border-white/[0.15] hover:border-white/[0.3] bg-zinc-900/70 hover:bg-zinc-800 text-[11px] font-mono text-slate-300 hover:text-white transition-all flex items-center space-x-2 cursor-pointer"
        >
          <span>CONSOLE</span>
          <ArrowUpRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-white transition-colors" />
        </button>
      </header>

      {/* ========================================================================= */}
      {/* 4. MAIN HERO SECTION (STRICT SINGLE SCREEN - ZERO SCROLL)                 */}
      {/*    Characters pop from rectangle bottom line; bold titles fade up behind  */}
      {/* ========================================================================= */}
      <main className="relative z-10 flex-1 w-full flex flex-col items-center justify-end pb-3 sm:pb-5 overflow-visible">
        {/* Character + Designations Stage */}
        <div className="relative w-full max-w-[960px] lg:max-w-[1140px] xl:max-w-[1280px] h-[55vh] sm:h-[61vh] lg:h-[65vh] flex items-end justify-center">

          {/* ------------------------------------------------------------------- */}
          {/* THE 3 BOLD DESIGNATIONS FADING UP FROM BEHIND EACH HEAD (Z-INDEX 10)*/}
          {/* ------------------------------------------------------------------- */}

          {/* LEFT HEAD: RESEARCHER (Centered at ~21% width, distinct from Architect) */}
          <div
            className="absolute left-[21%] top-[14%] sm:top-[12%] lg:top-[9%] z-10 pointer-events-none select-none text-center"
            style={{
              transform: "translate(-50%, -50%)",
            }}
          >
            <span
              className="block font-mono font-black text-lg sm:text-2xl md:text-3xl lg:text-4xl tracking-widest uppercase bg-gradient-to-t from-white via-white/80 to-white/10 bg-clip-text text-transparent drop-shadow-[0_0_24px_rgba(255,255,255,0.3)] whitespace-nowrap"
              style={{
                WebkitMaskImage: "linear-gradient(to top, black 25%, rgba(0,0,0,0.8) 60%, transparent 100%)",
                maskImage: "linear-gradient(to top, black 25%, rgba(0,0,0,0.8) 60%, transparent 100%)",
              }}
            >
              RESEARCHER
            </span>
          </div>

          {/* CENTER HEAD: ARCHITECT (Centered at 50%, elevated above center visor) */}
          <div
            className="absolute left-[50%] -top-[4%] sm:-top-[8%] lg:-top-[12%] z-10 pointer-events-none select-none text-center"
            style={{
              transform: "translate(-50%, -50%)",
            }}
          >
            <span
              className="block font-mono font-black text-2xl sm:text-4xl md:text-5xl lg:text-6xl tracking-widest uppercase bg-gradient-to-t from-white via-white/85 to-white/15 bg-clip-text text-transparent drop-shadow-[0_0_35px_rgba(255,255,255,0.4)] whitespace-nowrap"
              style={{
                WebkitMaskImage: "linear-gradient(to top, black 25%, rgba(0,0,0,0.85) 60%, transparent 100%)",
                maskImage: "linear-gradient(to top, black 25%, rgba(0,0,0,0.85) 60%, transparent 100%)",
              }}
            >
              ARCHITECT
            </span>
          </div>

          {/* RIGHT HEAD: OUTREACHER (Centered at ~79% width, distinct from Architect) */}
          <div
            className="absolute left-[79%] top-[15%] sm:top-[13%] lg:top-[10%] z-10 pointer-events-none select-none text-center"
            style={{
              transform: "translate(-50%, -50%)",
            }}
          >
            <span
              className="block font-mono font-black text-lg sm:text-2xl md:text-3xl lg:text-4xl tracking-widest uppercase bg-gradient-to-t from-white via-white/80 to-white/10 bg-clip-text text-transparent drop-shadow-[0_0_24px_rgba(255,255,255,0.3)] whitespace-nowrap"
              style={{
                WebkitMaskImage: "linear-gradient(to top, black 25%, rgba(0,0,0,0.8) 60%, transparent 100%)",
                maskImage: "linear-gradient(to top, black 25%, rgba(0,0,0,0.8) 60%, transparent 100%)",
              }}
            >
              OUTREACHER
            </span>
          </div>

          {/* ------------------------------------------------------------------- */}
          {/* THE CHARACTERS (hero_char.png) - POPPED FROM BOTTOM LINE (Z-INDEX 20)*/}
          {/* Base anchored right at the bottom line of the broad rectangle       */}
          {/* ------------------------------------------------------------------- */}
          <div
            className="relative z-20 w-full flex items-end justify-center pointer-events-none select-none"
            style={{
              /* Mask characters so their bottom cuts right along the bottom line of the rectangle */
              WebkitMaskImage: "linear-gradient(to bottom, black 0%, black 90%, rgba(0,0,0,0.7) 97%, transparent 100%)",
              maskImage: "linear-gradient(to bottom, black 0%, black 90%, rgba(0,0,0,0.7) 97%, transparent 100%)",
            }}
          >
            <picture className="w-full flex justify-center">
              <source srcSet="/hero_char_web.webp" type="image/webp" />
              <img
                src="/hero_char.png"
                alt="Lead Intelligence OS Triad"
                className="w-full h-auto max-h-[55vh] sm:max-h-[61vh] lg:max-h-[65vh] object-contain filter drop-shadow-[0_20px_50px_rgba(0,0,0,0.95)]"
              />
            </picture>
          </div>

          {/* ------------------------------------------------------------------- */}
          {/* 5. MODERN ANIMATED LAUNCH BUTTON (ALWAYS VISIBLE WITHIN VIEWPORT)   */}
          {/* ------------------------------------------------------------------- */}
          <div className="absolute -bottom-8 sm:-bottom-9 left-1/2 -translate-x-1/2 z-30">
            <button
              onClick={handleLaunch}
              disabled={isLaunching}
              className="relative group p-0.5 rounded-full overflow-hidden focus:outline-none transition-all duration-300 hover:scale-105 active:scale-95 cursor-pointer shadow-[0_0_40px_rgba(239,68,68,0.3)] hover:shadow-[0_0_65px_rgba(239,68,68,0.55)]"
            >
              {/* High-Velocity Rotating Energy Ring */}
              <span className="absolute inset-0 bg-gradient-to-r from-red-600 via-white to-red-600 opacity-90 animate-[spin_2.5s_linear_infinite]" />

              {/* Button Body */}
              <div className="relative px-7 sm:px-11 py-3 sm:py-3.5 rounded-full bg-[#0a0c13] border border-white/[0.15] flex items-center space-x-3.5 group-hover:bg-[#111420] transition-colors">
                {/* Glowing Pulsing Beacon */}
                <div className="relative flex items-center justify-center">
                  <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping absolute opacity-80"></span>
                  <span className="w-2 h-2 rounded-full bg-red-500"></span>
                </div>

                {/* Button Typography */}
                <span className="text-xs sm:text-sm font-black tracking-widest text-white uppercase font-mono flex items-center gap-2">
                  <span>LAUNCH COMMAND DASHBOARD</span>
                  <ChevronRight className="w-4 h-4 text-red-400 group-hover:translate-x-1 transition-transform" />
                </span>
              </div>
            </button>
          </div>

        </div>
      </main>

      {/* ========================================================================= */}
      {/* 5. MINIMAL TELEMETRY FOOTER                                               */}
      {/* ========================================================================= */}
      <footer className="relative z-30 w-full px-6 sm:px-12 py-3 flex items-center justify-between text-[11px] font-mono text-slate-500 border-t border-white/[0.05] bg-[#07080c]/80 backdrop-blur-md flex-none">
        <div className="flex items-center space-x-3">
          <span className="text-slate-400 font-semibold">ENTERPRISE OS</span>
          <span className="text-slate-700">|</span>
          <span className="text-slate-400">RESEARCH • VALUATION • OUTREACH</span>
        </div>

        <div className="hidden sm:flex items-center space-x-2 text-slate-400">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
          <span>100% REVENUE CONFIRMATION GATE ACTIVE</span>
        </div>
      </footer>

      {/* ========================================================================= */}
      {/* 6. SIDEWISE ALTERNATING BLOCKS PRELOADER ANIMATION (MODERN REVEAL)         */}
      {/* ========================================================================= */}
      {isLaunching && (
        <div className="fixed inset-0 z-50 pointer-events-auto flex flex-col justify-between overflow-hidden">
          {/* 7 Alternating Horizontal Kinetic Shutter Blocks */}
          {[0, 1, 2, 3, 4, 5, 6].map((index) => {
            const isEven = index % 2 === 0;
            return (
              <div
                key={index}
                className={`relative w-full flex-1 bg-[#07080c] border-y border-white/[0.08] flex items-center ${
                  isEven ? "animate-shutter-in-left" : "animate-shutter-in-right"
                }`}
                style={{
                  animationDelay: `${index * 35}ms`,
                }}
              >
                {/* Glowing Laser Tracer on leading edge */}
                <div
                  className={`absolute top-0 bottom-0 w-24 bg-gradient-to-r ${
                    isEven
                      ? "right-0 from-transparent to-red-500/50"
                      : "left-0 from-red-500/50 to-transparent"
                  }`}
                />
              </div>
            );
          })}

          {/* Central Cyber Preloader HUD Badge */}
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center space-y-3 pointer-events-none animate-in fade-in zoom-in-95 duration-200 delay-150">
            <div className="w-12 h-12 rounded-2xl bg-zinc-900 border border-red-500/50 flex items-center justify-center text-red-500 shadow-[0_0_40px_rgba(239,68,68,0.5)] animate-pulse">
              <Zap className="w-6 h-6 fill-red-500 text-red-500" />
            </div>
            <div className="text-center space-y-1">
              <div className="text-xs sm:text-sm font-mono font-black tracking-widest text-white uppercase animate-pulse">
                INITIALIZING COMMAND DASHBOARD
              </div>
              <div className="text-[10px] font-mono text-red-400 tracking-wider">
                SYNCHRONIZING TACTICAL TRIAD [OK]
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
