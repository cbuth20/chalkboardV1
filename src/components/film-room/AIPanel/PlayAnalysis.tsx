"use client";

// ═══════════════════════════════════════════════════════════════════════════
// PLAY ANALYSIS — AI-Generated Play Breakdown
// Shows detected elements, routes, and key reads
// ═══════════════════════════════════════════════════════════════════════════

import type { FilmClip } from '../types';

interface PlayAnalysisProps {
  clip: FilmClip;
}

export function PlayAnalysis({ clip }: PlayAnalysisProps) {
  const { aiAnalysis } = clip;

  if (!aiAnalysis || aiAnalysis.status !== 'complete') {
    return (
      <div className="flex flex-col items-center justify-center h-full py-12 px-4">
        <AnalysisIcon className="h-12 w-12 text-slate-700 mb-4" />
        <p className="text-slate-500 text-sm text-center mb-4">
          No AI analysis available yet
        </p>
        <p className="text-xs text-slate-600 text-center">
          Run AI Analysis from the Tags panel to get detailed breakdown
        </p>
      </div>
    );
  }

  const { routes = [], keyReads = [], assignmentBreakdown = [] } = aiAnalysis;

  return (
    <div className="p-4 space-y-6">
      {/* Play Summary */}
      <section>
        <h4 className="text-[10px] font-semibold uppercase tracking-widest text-slate-500 mb-3">
          Play Summary
        </h4>
        <div className="grid grid-cols-2 gap-3">
          {aiAnalysis.offenseFormation && (
            <SummaryCard
              label="Formation"
              value={aiAnalysis.offenseFormation.value}
              confidence={aiAnalysis.offenseFormation.confidence}
              color="teal"
            />
          )}
          {aiAnalysis.coverageShell && (
            <SummaryCard
              label="Coverage"
              value={aiAnalysis.coverageShell.value}
              confidence={aiAnalysis.coverageShell.confidence}
              color="gold"
            />
          )}
          {aiAnalysis.defensiveFront && (
            <SummaryCard
              label="Front"
              value={aiAnalysis.defensiveFront.value}
              confidence={aiAnalysis.defensiveFront.confidence}
              color="orange"
            />
          )}
          {aiAnalysis.concept && (
            <SummaryCard
              label="Concept"
              value={aiAnalysis.concept.value}
              confidence={aiAnalysis.concept.confidence}
              color="ice"
            />
          )}
        </div>
      </section>

      {/* Detected Routes */}
      {routes.length > 0 && (
        <section>
          <h4 className="text-[10px] font-semibold uppercase tracking-widest text-slate-500 mb-3">
            Detected Routes
          </h4>
          <div className="space-y-2">
            {routes.map((route, idx) => (
              <div
                key={idx}
                className="flex items-center gap-3 p-3 rounded-lg bg-[#1B1E20] border border-[#1B1E20]"
              >
                {/* Player Badge */}
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#00F6E5]/20 text-[#00F6E5] font-bold text-sm">
                  {route.player}
                </div>

                {/* Route Info */}
                <div className="flex-1">
                  <p className="text-sm font-semibold text-white">{route.routeName}</p>
                  {route.depth && (
                    <p className="text-xs text-slate-500">{route.depth} yards</p>
                  )}
                </div>

                {/* Confidence */}
                <div className="flex items-center gap-2">
                  <div className="w-8 h-1.5 rounded-full bg-[#0A0A0A] overflow-hidden">
                    <div
                      className="h-full bg-[#00F6E5] rounded-full"
                      style={{ width: `${route.confidence * 100}%` }}
                    />
                  </div>
                  <span className="text-xs text-slate-400 tabular-nums">
                    {Math.round(route.confidence * 100)}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Key Reads */}
      {keyReads.length > 0 && (
        <section>
          <h4 className="text-[10px] font-semibold uppercase tracking-widest text-slate-500 mb-3">
            Key Reads
          </h4>
          <div className="space-y-2">
            {keyReads.map((read, idx) => (
              <div
                key={idx}
                className="flex items-start gap-3 p-3 rounded-lg bg-[#F5C253]/5 border border-[#F5C253]/20"
              >
                <div className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-[#F5C253]/20 text-[#F5C253] font-bold text-xs">
                  {idx + 1}
                </div>
                <p className="text-sm text-slate-300 leading-relaxed">{read}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Assignment Breakdown */}
      {assignmentBreakdown.length > 0 && (
        <section>
          <h4 className="text-[10px] font-semibold uppercase tracking-widest text-slate-500 mb-3">
            Assignment Breakdown
          </h4>
          <div className="space-y-3">
            {assignmentBreakdown.map((assignment, idx) => (
              <div
                key={idx}
                className="p-3 rounded-lg bg-[#1B1E20] border border-[#1B1E20]"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-[#00F6E5]">
                    {assignment.position}
                  </span>
                  <span className="text-xs text-slate-500">{assignment.key}</span>
                </div>
                <p className="text-sm font-medium text-white mb-1">
                  {assignment.assignment}
                </p>
                <p className="text-xs text-slate-400 italic">
                  💡 {assignment.coaching}
                </p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Playbook Match */}
      {aiAnalysis.suggestedPlay && (
        <section>
          <h4 className="text-[10px] font-semibold uppercase tracking-widest text-slate-500 mb-3">
            Playbook Match
          </h4>
          <div className="p-4 rounded-xl bg-gradient-to-br from-[#00F6E5]/10 to-[#00F6E5]/5 border border-[#00F6E5]/30">
            <div className="flex items-center gap-3 mb-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#00F6E5]/20">
                <PlaybookIcon className="h-5 w-5 text-[#00F6E5]" />
              </div>
              <div>
                <p className="text-sm font-bold text-white">
                  {aiAnalysis.suggestedPlay.playName}
                </p>
                <p className="text-xs text-[#00F6E5]">
                  {Math.round(aiAnalysis.suggestedPlay.matchScore * 100)}% Match
                </p>
              </div>
            </div>
            <p className="text-xs text-slate-400 mb-3">
              {aiAnalysis.suggestedPlay.explanation}
            </p>
            <button className="w-full py-2 rounded-lg bg-[#00F6E5]/20 text-[#00F6E5] text-xs font-semibold uppercase tracking-wider hover:bg-[#00F6E5]/30 transition-colors">
              View in Playbook →
            </button>
          </div>
        </section>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// SUMMARY CARD
// ═══════════════════════════════════════════════════════════════════════════

function SummaryCard({
  label,
  value,
  confidence,
  color,
}: {
  label: string;
  value: string;
  confidence: number;
  color: 'teal' | 'gold' | 'orange' | 'ice';
}) {
  const colors = {
    teal: 'border-[#00F6E5]/30 bg-[#00F6E5]/5',
    gold: 'border-[#F5C253]/30 bg-[#F5C253]/5',
    orange: 'border-[#FF6A3D]/30 bg-[#FF6A3D]/5',
    ice: 'border-[#3DF3FF]/30 bg-[#3DF3FF]/5',
  };

  return (
    <div className={`p-3 rounded-lg border ${colors[color]}`}>
      <span className="text-[10px] font-semibold uppercase tracking-widest text-slate-500 block mb-1">
        {label}
      </span>
      <p className="text-sm font-bold text-white truncate">{value}</p>
      <div className="mt-2 flex items-center gap-2">
        <div className="flex-1 h-1 rounded-full bg-[#0A0A0A] overflow-hidden">
          <div
            className="h-full bg-slate-400 rounded-full"
            style={{ width: `${confidence * 100}%` }}
          />
        </div>
        <span className="text-[10px] text-slate-500 tabular-nums">
          {Math.round(confidence * 100)}%
        </span>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// ICONS
// ═══════════════════════════════════════════════════════════════════════════

function AnalysisIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
      <line x1="18" y1="20" x2="18" y2="10" />
      <line x1="12" y1="20" x2="12" y2="4" />
      <line x1="6" y1="20" x2="6" y2="14" />
    </svg>
  );
}

function PlaybookIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
    </svg>
  );
}

export default PlayAnalysis;








