"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import FootballIQFlow from "@/components/landing/FootballIQFlow";
import Footer from "@/components/Footer";
import { LEGAL_BRAND_NAME } from "@/lib/brand";

// UI Preview Card Component - Shows real product screenshots
function UIPreviewCard({ 
  label, 
  title, 
  annotation,
  children 
}: { 
  label: string; 
  title: string; 
  annotation?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="glass-card overflow-hidden">
      <div className="px-4 py-2 border-b border-slate-700/50 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-neon-teal" />
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{label}</span>
        </div>
        {annotation && (
          <span className="text-[10px] text-neon-teal font-medium px-2 py-0.5 rounded bg-neon-teal/10 border border-neon-teal/20">
            {annotation}
          </span>
        )}
      </div>
      <div className="p-4">
        <p className="text-sm font-semibold text-white mb-3">{title}</p>
        {children}
      </div>
    </div>
  );
}

// Coverage Shell Preview
function CoveragePreview() {
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-4 gap-2">
        {["Cover 2", "Cover 3", "Cover 4", "Cover 1"].map((coverage, i) => (
          <button
            key={coverage}
            className={`px-2 py-2 rounded text-xs font-semibold transition-all ${
              i === 1 
                ? "bg-neon-teal text-deep-space-black" 
                : "bg-slate-800 text-slate-400 hover:bg-slate-700"
            }`}
          >
            {coverage}
          </button>
        ))}
      </div>
      <div className="flex items-center gap-2 text-xs text-slate-500">
        <svg className="w-4 h-4 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
        </svg>
        <span>Correct — single-high safety, corners at depth</span>
      </div>
    </div>
  );
}

// Formation ID Preview
function FormationPreview() {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        <div className="flex-1 h-2 bg-slate-800 rounded-full overflow-hidden">
          <div className="h-full w-4/5 bg-gradient-to-r from-neon-teal to-ice-blue rounded-full" />
        </div>
        <span className="text-xs font-mono text-neon-teal">4/5</span>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {["2x2", "3x1", "Empty", "Bunch"].map((tag, i) => (
          <span 
            key={tag}
            className={`px-2 py-1 rounded text-[10px] font-semibold ${
              i < 2 ? "bg-neon-teal/20 text-neon-teal" : "bg-slate-800 text-slate-500"
            }`}
          >
            {tag}
          </span>
        ))}
      </div>
    </div>
  );
}

// Assignment Preview
function AssignmentPreview() {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-xs text-slate-500">Your Assignment</span>
        <span className="text-[10px] font-mono text-victory-gold">PRE-SNAP</span>
      </div>
      <div className="p-3 rounded-lg bg-slate-800/50 border border-slate-700/50">
        <p className="text-sm text-white font-medium">Flat defender vs 3x1</p>
        <p className="text-xs text-slate-400 mt-1">#2 receiver to flat, eyes on #3 vertical</p>
      </div>
    </div>
  );
}

// Role-based Feature Card component
function FeatureCard({ 
  icon, 
  title, 
  forRoles,
  bullets,
  tagline,
  accentColor = "teal"
}: { 
  icon: React.ReactNode; 
  title: string; 
  forRoles: string;
  bullets: string[];
  tagline: string;
  accentColor?: "teal" | "gold" | "blue" | "orange";
}) {
  const accentClasses = {
    teal: "group-hover:border-neon-teal/40 group-hover:shadow-[0_0_20px_rgba(0,246,229,0.1)]",
    gold: "group-hover:border-victory-gold/40 group-hover:shadow-[0_0_20px_rgba(245,194,83,0.1)]",
    blue: "group-hover:border-ice-blue/40 group-hover:shadow-[0_0_20px_rgba(61,243,255,0.1)]",
    orange: "group-hover:border-warning-orange/40 group-hover:shadow-[0_0_20px_rgba(255,106,61,0.1)]",
  };

  const iconColors = {
    teal: "text-neon-teal",
    gold: "text-victory-gold",
    blue: "text-ice-blue",
    orange: "text-warning-orange",
  };

  const taglineColors = {
    teal: "text-neon-teal",
    gold: "text-victory-gold",
    blue: "text-ice-blue",
    orange: "text-warning-orange",
  };

  return (
    <div className={`group glass-card p-6 transition-all duration-300 flex flex-col ${accentClasses[accentColor]}`}>
      <div className={`w-12 h-12 rounded-lg bg-slate-800/80 flex items-center justify-center mb-4 ${iconColors[accentColor]}`}>
        {icon}
      </div>
      <h3 className="text-lg font-bold text-white mb-2">{title}</h3>
      <p className="text-xs text-slate-500 uppercase tracking-wide mb-3">For: {forRoles}</p>
      <ul className="space-y-2 mb-4 flex-1">
        {bullets.map((bullet, i) => (
          <li key={i} className="flex items-start gap-2 text-sm text-slate-400">
            <span className="w-1 h-1 rounded-full bg-slate-600 mt-2 flex-shrink-0" />
            {bullet}
          </li>
        ))}
      </ul>
      <p className={`text-sm font-medium italic ${taglineColors[accentColor]}`}>{tagline}</p>
    </div>
  );
}

// Use case item
function UseCase({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3 py-3 px-4 rounded-lg bg-slate-800/30 border border-slate-700/30">
      <div className="w-1.5 h-1.5 rounded-full bg-neon-teal flex-shrink-0" />
      <span className="text-sm text-slate-300">{children}</span>
    </div>
  );
}

export default function LandingPage() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  return (
    <div className="min-h-screen bg-deep-space-black">
      {/* Subtle Background */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute inset-0 holographic-grid opacity-30" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-neon-teal/5 rounded-full blur-[120px]" />
      </div>

      {/* Navigation */}
      <nav className="relative z-50 px-6 py-5 border-b border-slate-800/50">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-neon-teal to-ice-blue flex items-center justify-center">
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="#0A0A0A">
                <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
              </svg>
            </div>
            <span className="text-xl font-bold text-white tracking-tight">
              CHALKBOARD
            </span>
          </div>
          
          <div className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-slate-400 hover:text-white transition-colors text-sm font-medium">Features</a>
            <a href="#how-it-works" className="text-slate-400 hover:text-white transition-colors text-sm font-medium">How It Works</a>
            <a href="#preparation" className="text-slate-400 hover:text-white transition-colors text-sm font-medium">For Players</a>
          </div>

          <Link 
            href="/playbook" 
            className="btn-primary text-sm text-[#0A0A0A]"
          >
            Start Training
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative z-10 px-6 pt-16 pb-20 md:pt-24 md:pb-28">
        <div className="max-w-6xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-start">
            {/* Left: Copy */}
            <div className={`transform transition-all duration-700 ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'}`}>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6 leading-[1.1] tracking-tight">
                The snap starts the play.<br />
                <span className="gradient-text-teal">Preparation</span> finishes it.
              </h1>

              <p className="text-lg text-slate-300 mb-4 leading-relaxed max-w-xl">
                {LEGAL_BRAND_NAME} trains the mental reps that separate prepared players from everyone else — coverage recognition, formation ID, pressure awareness, and assignment clarity.
              </p>

              <p className="text-sm text-slate-500 mb-8 italic">
                While others scroll, the best players are processing.
              </p>

              {/* CTA Buttons */}
              <div className="flex flex-col sm:flex-row items-start gap-4">
                <Link 
                  href="/playbook" 
                  className="group inline-flex items-center gap-2 px-6 py-3.5 rounded-lg bg-gradient-to-r from-neon-teal to-ice-blue text-[#0A0A0A] font-bold text-sm uppercase tracking-wide transition-all hover:shadow-[0_0_30px_rgba(0,246,229,0.3)]"
                >
                  Start Training
                  <svg className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
                  </svg>
                </Link>
                
                <a 
                  href="#how-it-works" 
                  className="inline-flex items-center gap-2 px-6 py-3.5 rounded-lg border border-slate-700 text-slate-300 font-medium text-sm hover:border-slate-600 hover:text-white transition-all"
                >
                  See How It Works
                </a>
              </div>
            </div>

            {/* Right: Football IQ Flow Diagram */}
            <div className={`transform transition-all duration-700 delay-200 ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'}`}>
              <FootballIQFlow />
            </div>
          </div>
        </div>
      </section>

      {/* The Reality Section */}
      <section id="reality" className="relative z-10 px-6 py-20 bg-gradient-to-b from-slate-900/20 to-transparent">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-10">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-widest">The Reality</span>
          </div>

          <div className="space-y-6 text-center">
            <p className="text-2xl md:text-3xl font-bold text-white leading-tight">
              Every rep you skip is a rep someone else takes.
            </p>

            <div className="space-y-4 text-slate-400 text-base md:text-lg leading-relaxed max-w-2xl mx-auto">
              <p>
                Games are won before the snap.<br />
                Quarterbacks throw on time because they recognize coverage early.<br />
                Linebackers make plays because they see formations and splits faster.<br />
                Skill players earn trust because they're never unsure of their assignment.
              </p>
            </div>

            <div className="pt-6">
              <p className="text-lg text-slate-300">
                Physical talent gets you noticed.
              </p>
              <p className="text-lg text-white font-semibold">
                Mental preparation gets you on the field.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="relative z-10 px-6 py-20">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Train Football IQ. <span className="gradient-text-teal">Align the Entire Team.</span>
            </h2>
            <p className="text-slate-400 max-w-3xl mx-auto text-lg">
              {LEGAL_BRAND_NAME} turns installs, film, and concepts into structured mental reps — so players learn faster, coaches teach clearer, and teams stay aligned.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-5">
            {/* Row 1: Core Learning */}
            <FeatureCard
              icon={
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                </svg>
              }
              title="Coverage & Structure Recognition"
              forRoles="Skill Positions, QBs, DBs, LBs"
              bullets={[
                "Identify common coverages, rotations, and leverage",
                "Understand why defenses align the way they do",
                "Train recognition speed before the snap"
              ]}
              tagline="Learn what you're seeing — not just what you're told."
              accentColor="teal"
            />
            
            <FeatureCard
              icon={
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 0 1 6 3.75h2.25A2.25 2.25 0 0 1 10.5 6v2.25a2.25 2.25 0 0 1-2.25 2.25H6a2.25 2.25 0 0 1-2.25-2.25V6ZM3.75 15.75A2.25 2.25 0 0 1 6 13.5h2.25a2.25 2.25 0 0 1 2.25 2.25V18a2.25 2.25 0 0 1-2.25 2.25H6A2.25 2.25 0 0 1 3.75 18v-2.25ZM13.5 6a2.25 2.25 0 0 1 2.25-2.25H18A2.25 2.25 0 0 1 20.25 6v2.25A2.25 2.25 0 0 1 18 10.5h-2.25a2.25 2.25 0 0 1-2.25-2.25V6ZM13.5 15.75a2.25 2.25 0 0 1 2.25-2.25H18a2.25 2.25 0 0 1 2.25 2.25V18A2.25 2.25 0 0 1 18 20.25h-2.25A2.25 2.25 0 0 1 13.5 18v-2.25Z" />
                </svg>
              }
              title="Formation & Alignment Intelligence"
              forRoles="All Positions, Coaches"
              bullets={[
                "Instantly recognize offensive and defensive formations",
                "See how shifts, motions, and splits change assignments",
                "Build shared understanding across position groups"
              ]}
              tagline="Everyone sees the same picture."
              accentColor="gold"
            />
            
            <FeatureCard
              icon={
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9.568 3H5.25A2.25 2.25 0 0 0 3 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 0 0 5.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 0 0 9.568 3Z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 6h.008v.008H6V6Z" />
                </svg>
              }
              title="Route, Concept & Assignment Fluency"
              forRoles="WRs, RBs, TEs, QBs"
              bullets={[
                "Master route depths, spacing, timing, and intent",
                "Understand full concepts — not just your line on the play",
                "Communicate adjustments with confidence"
              ]}
              tagline="Know where you fit — and why it works."
              accentColor="blue"
            />
            
            <FeatureCard
              icon={
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 0 1 3 19.875v-6.75ZM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V8.625ZM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V4.125Z" />
                </svg>
              }
              title="Pressure & Protection Awareness"
              forRoles="QBs, RBs, OL, TEs"
              bullets={[
                "Learn how pressure is created and disguised",
                "Understand responsibilities in different protections",
                "Improve decision speed and situational confidence"
              ]}
              tagline="Anticipate chaos before it arrives."
              accentColor="orange"
            />

            {/* Row 2: Tools & Infrastructure */}
            <FeatureCard
              icon={
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="m15.75 10.5 4.72-4.72a.75.75 0 0 1 1.28.53v11.38a.75.75 0 0 1-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 0 0 2.25-2.25v-9a2.25 2.25 0 0 0-2.25-2.25h-9A2.25 2.25 0 0 0 2.25 7.5v9a2.25 2.25 0 0 0 2.25 2.25Z" />
                </svg>
              }
              title="Film Room, Simplified"
              forRoles="Players & Coaches"
              bullets={[
                "Study film with structure and purpose",
                "Tag concepts, situations, and teaching points",
                "Reinforce installs with visual context"
              ]}
              tagline="Film study that actually sticks."
              accentColor="teal"
            />
            
            <FeatureCard
              icon={
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12.75V12A2.25 2.25 0 0 1 4.5 9.75h15A2.25 2.25 0 0 1 21.75 12v.75m-8.69-6.44-2.12-2.12a1.5 1.5 0 0 0-1.061-.44H4.5A2.25 2.25 0 0 0 2.25 6v12a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18V9a2.25 2.25 0 0 0-2.25-2.25h-5.379a1.5 1.5 0 0 1-1.06-.44Z" />
                </svg>
              }
              title="Install & Playbook Organization"
              forRoles="Coaches, Teams"
              bullets={[
                "Centralize installs, concepts, and teaching material",
                "Reduce confusion, repetition, and miscommunication",
                "Keep players aligned week to week"
              ]}
              tagline="One source of truth for the team."
              accentColor="gold"
            />
            
            <FeatureCard
              icon={
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.26 10.147a60.438 60.438 0 0 0-.491 6.347A48.62 48.62 0 0 1 12 20.904a48.62 48.62 0 0 1 8.232-4.41 60.46 60.46 0 0 0-.491-6.347m-15.482 0a50.636 50.636 0 0 0-2.658-.813A59.906 59.906 0 0 1 12 3.493a59.903 59.903 0 0 1 10.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.717 50.717 0 0 1 12 13.489a50.702 50.702 0 0 1 7.74-3.342M6.75 15a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5Zm0 0v-3.675A55.378 55.378 0 0 1 12 8.443m-7.007 11.55A5.981 5.981 0 0 0 6.75 15.75v-1.5" />
                </svg>
              }
              title="Coach-to-Player Teaching Tools"
              forRoles="Coaches"
              bullets={[
                "Explain concepts visually and consistently",
                "Reinforce what matters without overloading players",
                "Teach faster without watering things down"
              ]}
              tagline="Coach once. Teach everywhere."
              accentColor="blue"
            />
            
            <FeatureCard
              icon={
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3v11.25A2.25 2.25 0 0 0 6 16.5h2.25M3.75 3h-1.5m1.5 0h16.5m0 0h1.5m-1.5 0v11.25A2.25 2.25 0 0 1 18 16.5h-2.25m-7.5 0h7.5m-7.5 0-1 3m8.5-3 1 3m0 0 .5 1.5m-.5-1.5h-9.5m0 0-.5 1.5m.75-9 3-3 2.148 2.148A12.061 12.061 0 0 1 16.5 7.605" />
                </svg>
              }
              title="Learning Progress & Accountability"
              forRoles="Coaches, Position Groups"
              bullets={[
                "Track understanding over time (not just reps taken)",
                "Identify gaps early",
                "Support players before mistakes show up on the field"
              ]}
              tagline="Confidence comes from clarity."
              accentColor="orange"
            />
          </div>

          {/* Built for Every Level */}
          <div className="mt-16 glass-card p-8 md:p-10">
            <h3 className="text-xl md:text-2xl font-bold text-white text-center mb-8">
              Built for Every Level of Football
            </h3>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="text-center p-4">
                <div className="w-10 h-10 rounded-full bg-neon-teal/20 flex items-center justify-center mx-auto mb-3">
                  <svg className="w-5 h-5 text-neon-teal" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
                  </svg>
                </div>
                <p className="text-white font-semibold mb-1">Players</p>
                <p className="text-sm text-slate-400">Learn faster. Play freer.</p>
              </div>
              <div className="text-center p-4">
                <div className="w-10 h-10 rounded-full bg-victory-gold/20 flex items-center justify-center mx-auto mb-3">
                  <svg className="w-5 h-5 text-victory-gold" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 0 0 3.741-.479 3 3 0 0 0-4.682-2.72m.94 3.198.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0 1 12 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 0 1 6 18.719m12 0a5.971 5.971 0 0 0-.941-3.197m0 0A5.995 5.995 0 0 0 12 12.75a5.995 5.995 0 0 0-5.058 2.772m0 0a3 3 0 0 0-4.681 2.72 8.986 8.986 0 0 0 3.74.477m.94-3.197a5.971 5.971 0 0 0-.94 3.197M15 6.75a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm6 3a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Zm-13.5 0a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Z" />
                  </svg>
                </div>
                <p className="text-white font-semibold mb-1">Position Groups</p>
                <p className="text-sm text-slate-400">Speak the same language.</p>
              </div>
              <div className="text-center p-4">
                <div className="w-10 h-10 rounded-full bg-ice-blue/20 flex items-center justify-center mx-auto mb-3">
                  <svg className="w-5 h-5 text-ice-blue" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.26 10.147a60.438 60.438 0 0 0-.491 6.347A48.62 48.62 0 0 1 12 20.904a48.62 48.62 0 0 1 8.232-4.41 60.46 60.46 0 0 0-.491-6.347m-15.482 0a50.636 50.636 0 0 0-2.658-.813A59.906 59.906 0 0 1 12 3.493a59.903 59.903 0 0 1 10.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.717 50.717 0 0 1 12 13.489a50.702 50.702 0 0 1 7.74-3.342M6.75 15a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5Zm0 0v-3.675A55.378 55.378 0 0 1 12 8.443m-7.007 11.55A5.981 5.981 0 0 0 6.75 15.75v-1.5" />
                  </svg>
                </div>
                <p className="text-white font-semibold mb-1">Coaches</p>
                <p className="text-sm text-slate-400">Teach with precision.</p>
              </div>
              <div className="text-center p-4">
                <div className="w-10 h-10 rounded-full bg-warning-orange/20 flex items-center justify-center mx-auto mb-3">
                  <svg className="w-5 h-5 text-warning-orange" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 21h16.5M4.5 3h15M5.25 3v18m13.5-18v18M9 6.75h1.5m-1.5 3h1.5m-1.5 3h1.5m3-6H15m-1.5 3H15m-1.5 3H15M9 21v-3.375c0-.621.504-1.125 1.125-1.125h3.75c.621 0 1.125.504 1.125 1.125V21" />
                  </svg>
                </div>
                <p className="text-white font-semibold mb-1">Teams</p>
                <p className="text-sm text-slate-400">Stay aligned all season.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Fits Section */}
      <section id="preparation" className="relative z-10 px-6 py-20">
        <div className="max-w-4xl mx-auto">
          <div className="glass-card p-8 md:p-10">
            <div className="grid md:grid-cols-2 gap-10 items-center">
              <div>
                <h2 className="text-2xl md:text-3xl font-bold text-white mb-4">
                  Built for How Players Actually Prepare
                </h2>
                
                <p className="text-slate-400 mb-6 leading-relaxed">
                  {LEGAL_BRAND_NAME} doesn&apos;t replace meetings, film, or coaching.<br />
                  <span className="text-white font-medium">It sharpens them.</span>
                </p>

                <p className="text-sm text-slate-500">
                  Use it when reps aren't available — and show up to install ready.
                </p>
              </div>

              <div className="space-y-3">
                <UseCase>Between meetings</UseCase>
                <UseCase>At night before install</UseCase>
                <UseCase>While traveling</UseCase>
                <UseCase>When you can't get on the field</UseCase>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Credibility Section */}
      <section id="how-it-works" className="relative z-10 px-6 py-16">
        <div className="max-w-4xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            <div className="p-4">
              <p className="text-xs text-slate-500 uppercase tracking-wider mb-2">Recognition</p>
              <p className="text-sm text-slate-300">Faster through repetition</p>
            </div>
            <div className="p-4">
              <p className="text-xs text-slate-500 uppercase tracking-wider mb-2">Reps Logged</p>
              <p className="text-sm text-slate-300">Thousands daily</p>
            </div>
            <div className="p-4">
              <p className="text-xs text-slate-500 uppercase tracking-wider mb-2">Built By</p>
              <p className="text-sm text-slate-300">Players who've been there</p>
            </div>
            <div className="p-4">
              <p className="text-xs text-slate-500 uppercase tracking-wider mb-2">Designed For</p>
              <p className="text-sm text-slate-300">The next level</p>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="relative z-10 px-6 py-20">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Ready to Prepare Like a Pro?
          </h2>
          
          <p className="text-lg text-slate-400 mb-10 max-w-xl mx-auto">
            The players who take preparation seriously are the ones who earn trust, reps, and opportunities.
          </p>

          <Link 
            href="/playbook" 
            className="group inline-flex items-center gap-2 px-8 py-4 rounded-lg bg-gradient-to-r from-neon-teal to-ice-blue text-[#0A0A0A] font-bold text-base uppercase tracking-wide transition-all hover:shadow-[0_0_40px_rgba(0,246,229,0.4)]"
          >
            Start Training Now
            <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
            </svg>
          </Link>

          <p className="mt-6 text-sm text-slate-600">
            No credit card required · Built for serious players · Works anywhere
          </p>
        </div>
      </section>

      {/* Footer */}
      <Footer />
    </div>
  );
}
