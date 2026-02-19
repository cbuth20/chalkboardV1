"use client";

import React, { useState, Suspense, lazy } from "react";
import Link from "next/link";
import Footer from "@/components/Footer";
import EarlySignupSection from "@/components/landing/EarlySignupSection";

const DemoPlayBuilder = lazy(() => import("@/components/demo/DemoPlayBuilder"));
const DemoFormationTrainer = lazy(() =>
  import("@/components/demo/DemoGamesCenter").then((m) => ({ default: m.DemoFormationTrainer }))
);
const DemoRBProtection = lazy(() =>
  import("@/components/demo/DemoGamesCenter").then((m) => ({ default: m.DemoRBProtection }))
);
const DemoFlashcardsPlaceholder = lazy(() =>
  import("@/components/demo/DemoGamesCenter").then((m) => ({ default: m.DemoFlashcardsPlaceholder }))
);

type DemoTab = "play-designer" | "formation-trainer" | "rb-protection";

function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center py-32">
      <div className="text-center">
        <div className="h-12 w-12 mx-auto mb-4 animate-spin rounded-full border-4 border-neon-teal/20 border-t-neon-teal" />
        <p className="text-slate-400">Loading...</p>
      </div>
    </div>
  );
}

export default function DemoPage() {
  const [activeTab, setActiveTab] = useState<DemoTab>("play-designer");
  const [bannerDismissed, setBannerDismissed] = useState(false);

  const tabs: { id: DemoTab; label: string }[] = [
    { id: "play-designer", label: "Play Designer" },
    { id: "formation-trainer", label: "Formation Trainer" },
    { id: "rb-protection", label: "RB Protection" },
  ];

  return (
    <div className="min-h-screen bg-deep-space-black">
      {/* Background */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute inset-0 holographic-grid opacity-30" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-neon-teal/5 rounded-full blur-[120px]" />
      </div>

      {/* Demo Nav */}
      <nav className="relative z-50 px-6 py-4 border-b border-slate-800/50">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/" className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-neon-teal to-ice-blue flex items-center justify-center">
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="#0A0A0A">
                  <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
                </svg>
              </div>
              <span className="text-xl font-bold text-white tracking-tight">
                CHALKBOARD
              </span>
            </Link>
            <span className="text-xs font-semibold text-victory-gold uppercase tracking-widest px-2.5 py-1 rounded-full bg-victory-gold/10 border border-victory-gold/20">
              Demo Mode
            </span>
          </div>

          <div className="flex items-center gap-4">
            <Link
              href="/"
              className="text-sm text-slate-400 hover:text-white transition-colors hidden sm:block"
            >
              Back to Home
            </Link>
            <Link
              href="/login"
              className="btn-primary text-sm text-[#0A0A0A]"
            >
              Sign Up for Full Access
            </Link>
          </div>
        </div>
      </nav>

      {/* Demo Banner */}
      {!bannerDismissed && (
        <div className="relative z-40 bg-victory-gold/10 border-b border-victory-gold/20">
          <div className="max-w-7xl mx-auto px-6 py-3 flex items-center justify-between">
            <p className="text-sm text-slate-300">
              You&apos;re exploring the demo.{" "}
              <Link href="/login" className="text-neon-teal font-semibold hover:underline">
                Sign up
              </Link>{" "}
              for the full experience.
            </p>
            <button
              onClick={() => setBannerDismissed(true)}
              className="text-slate-500 hover:text-white transition-colors ml-4"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* Tab Navigation */}
      <div className="relative z-30 border-b border-slate-800/50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex gap-1 overflow-x-auto">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-5 py-3.5 text-sm font-semibold whitespace-nowrap transition-all border-b-2 ${
                  activeTab === tab.id
                    ? "text-neon-teal border-neon-teal"
                    : "text-slate-400 border-transparent hover:text-white hover:border-slate-600"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Tab Content */}
      <main className="relative z-10">
        <Suspense fallback={<LoadingSpinner />}>
          {activeTab === "play-designer" && (
            <DemoPlayBuilder />
          )}
          {activeTab === "formation-trainer" && (
            <div className="max-w-2xl mx-auto px-6 py-6">
              <DemoFormationTrainer />
            </div>
          )}
          {activeTab === "rb-protection" && (
            <div className="max-w-2xl mx-auto px-6 py-6">
              <DemoRBProtection />
            </div>
          )}
        </Suspense>
      </main>

      {/* Early Signup - hide on play designer tab to keep it focused */}
      {activeTab !== "play-designer" && <EarlySignupSection />}

      {/* Footer */}
      {activeTab !== "play-designer" && <Footer />}
    </div>
  );
}
