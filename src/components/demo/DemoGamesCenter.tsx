"use client";

import { FormationTrainerContent } from "@/components/games/FormationTrainerContent";
import { RBProtectionContent } from "@/components/games/RBProtectionContent";
import { DEMO_FORMATIONS, DEMO_PROTECTION_SCENARIOS } from "@/lib/demo/demo-data";
import Link from "next/link";

export function DemoFormationTrainer() {
  return (
    <FormationTrainerContent
      demoMode={true}
      demoFormations={DEMO_FORMATIONS as any}
    />
  );
}

export function DemoRBProtection() {
  return (
    <RBProtectionContent
      demoMode={true}
      demoScenarios={DEMO_PROTECTION_SCENARIOS as any}
    />
  );
}

export function DemoFlashcardsPlaceholder() {
  return (
    <div className="flex items-center justify-center py-20">
      <div className="glass-card p-8 md:p-10 text-center max-w-md">
        <div className="w-14 h-14 rounded-full bg-slate-800 flex items-center justify-center mx-auto mb-4">
          <svg className="w-7 h-7 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z" />
          </svg>
        </div>
        <h3 className="text-xl font-bold text-white mb-2">Flashcards</h3>
        <p className="text-slate-400 mb-6">
          Flashcards are generated from your team&apos;s playbook. Sign up to upload your playbook and access custom flashcards.
        </p>
        <Link
          href="/login"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-gradient-to-r from-neon-teal to-ice-blue text-[#0A0A0A] font-bold text-sm uppercase tracking-wide transition-all hover:shadow-[0_0_30px_rgba(0,246,229,0.3)]"
        >
          Sign Up to Access
        </Link>
      </div>
    </div>
  );
}
