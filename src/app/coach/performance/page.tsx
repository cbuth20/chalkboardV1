"use client";

import React from 'react';
import { SidebarLayout } from '@/components/SidebarLayout';
import { useMode } from '@/contexts/ModeContext';

export default function PerformancePage() {
  const { mode } = useMode();

  // Access control - only coaches can access
  if (mode !== 'coach') {
    return (
      <SidebarLayout>
        <div className="flex items-center justify-center h-screen">
          <div className="text-center">
            <h2 className="text-xl font-bold text-white mb-2">Access Denied</h2>
            <p className="text-slate-400">Only coaches can access Performance Analytics.</p>
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
            <PerformanceIcon className="h-8 w-8 text-[#00F6E5]" />
            <h1 className="text-3xl font-black tracking-tight text-white lg:text-4xl">
              Performance Analytics
            </h1>
          </div>
          <p className="text-slate-400">
            Deep dive into player and team performance data
          </p>
        </header>

        {/* Coming Soon Card */}
        <div className="glass-card p-12 text-center">
          <div className="max-w-md mx-auto">
            <div className="h-20 w-20 mx-auto mb-6 rounded-full bg-[#00F6E5]/10 flex items-center justify-center">
              <PerformanceIcon className="h-10 w-10 text-[#00F6E5]" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-3">Coming Soon</h2>
            <p className="text-slate-400 mb-6">
              Performance Analytics is currently under development. Soon you'll be able to:
            </p>
            <ul className="text-left text-slate-300 space-y-2 mb-8">
              <li className="flex items-start gap-2">
                <CheckIcon className="h-5 w-5 text-[#00F6E5] flex-shrink-0 mt-0.5" />
                <span>Analyze individual player progress over time</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckIcon className="h-5 w-5 text-[#00F6E5] flex-shrink-0 mt-0.5" />
                <span>View detailed breakdowns by position, formation, and play type</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckIcon className="h-5 w-5 text-[#00F6E5] flex-shrink-0 mt-0.5" />
                <span>Identify knowledge gaps and areas for improvement</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckIcon className="h-5 w-5 text-[#00F6E5] flex-shrink-0 mt-0.5" />
                <span>Generate custom reports and visualizations</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckIcon className="h-5 w-5 text-[#00F6E5] flex-shrink-0 mt-0.5" />
                <span>Set performance goals and track achievement</span>
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
function PerformanceIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
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
