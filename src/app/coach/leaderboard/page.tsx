"use client";

import React from 'react';
import { SidebarLayout } from '@/components/SidebarLayout';
import { useMode } from '@/contexts/ModeContext';

export default function LeaderboardPage() {
  const { mode } = useMode();

  // Access control - only coaches can access
  if (mode !== 'coach') {
    return (
      <SidebarLayout>
        <div className="flex items-center justify-center h-screen">
          <div className="text-center">
            <h2 className="text-xl font-bold text-white mb-2">Access Denied</h2>
            <p className="text-slate-400">Only coaches can access the Leaderboard.</p>
          </div>
        </div>
      </SidebarLayout>
    );
  }

  return (
    <SidebarLayout>
      <main className="mx-auto max-w-[1600px] px-4 py-8 lg:px-8 holographic-grid">
        {/* Header */}
        <header className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <LeaderboardIcon className="h-8 w-8 text-[#00F6E5]" />
            <h1 className="text-3xl font-black tracking-tight text-white lg:text-4xl">
              Leaderboard
            </h1>
          </div>
          <p className="text-slate-400">
            Track player rankings, performance metrics, and team standings
          </p>
        </header>

        {/* Coming Soon Card */}
        <div className="glass-card p-12 text-center">
          <div className="max-w-md mx-auto">
            <div className="h-20 w-20 mx-auto mb-6 rounded-full bg-[#00F6E5]/10 flex items-center justify-center">
              <LeaderboardIcon className="h-10 w-10 text-[#00F6E5]" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-3">Coming Soon</h2>
            <p className="text-slate-400 mb-6">
              The Leaderboard feature is currently under development. Soon you'll be able to:
            </p>
            <ul className="text-left text-slate-300 space-y-2 mb-8">
              <li className="flex items-start gap-2">
                <CheckIcon className="h-5 w-5 text-[#00F6E5] flex-shrink-0 mt-0.5" />
                <span>View player rankings based on quiz scores and performance</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckIcon className="h-5 w-5 text-[#00F6E5] flex-shrink-0 mt-0.5" />
                <span>Track team-wide progress and engagement metrics</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckIcon className="h-5 w-5 text-[#00F6E5] flex-shrink-0 mt-0.5" />
                <span>Identify top performers and players who need extra support</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckIcon className="h-5 w-5 text-[#00F6E5] flex-shrink-0 mt-0.5" />
                <span>Export reports and share achievements</span>
              </li>
            </ul>
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#00F6E5]/10 text-[#00F6E5] text-sm font-semibold">
              <ClockIcon className="h-4 w-4" />
              Feature in development
            </div>
          </div>
        </div>
      </main>
    </SidebarLayout>
  );
}

// Icons
function LeaderboardIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <path d="M8 21h8" />
      <path d="M12 21v-4" />
      <path d="M6 13H4a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2h2" />
      <path d="M18 13h2a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-2" />
      <rect x="6" y="7" width="12" height="14" rx="1" />
      <line x1="9" y1="3" x2="15" y2="3" />
      <line x1="12" y1="3" x2="12" y2="7" />
    </svg>
  );
}

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
      <path d="M20 6L9 17l-5-5" />
    </svg>
  );
}

function ClockIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  );
}
