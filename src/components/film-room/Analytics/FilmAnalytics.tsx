"use client";

// ═══════════════════════════════════════════════════════════════════════════
// FILM ANALYTICS — Study Progress & Performance Metrics
// Track improvement, study time, and mastery scores
// ═══════════════════════════════════════════════════════════════════════════

import { StudyProgress } from './StudyProgress';

interface FilmAnalyticsProps {
  className?: string;
}

// Mock data for analytics
const ANALYTICS_DATA = {
  coverageIdScore: 92,
  formationIdScore: 88,
  routeRecognition: 95,
  studyTimeToday: 45, // minutes
  weeklyStudyTime: 280, // minutes
  clipsStudied: 47,
  totalClips: 124,
  improvementTrend: 12, // percentage
  streakDays: 7,
  mistakeTendencies: [
    { type: 'Cover 2 vs Tampa 2', count: 5 },
    { type: 'Quarters vs Cover 4', count: 3 },
    { type: 'Motion reads', count: 2 },
  ],
};

export function FilmAnalytics({ className = '' }: FilmAnalyticsProps) {
  return (
    <div className={`space-y-6 ${className}`}>
      {/* Score Cards */}
      <div className="grid grid-cols-3 gap-4">
        <ScoreCard
          label="Coverage ID"
          score={ANALYTICS_DATA.coverageIdScore}
          color="teal"
          icon={<ShieldIcon className="h-5 w-5" />}
        />
        <ScoreCard
          label="Formation ID"
          score={ANALYTICS_DATA.formationIdScore}
          color="gold"
          icon={<FormationIcon className="h-5 w-5" />}
        />
        <ScoreCard
          label="Route Recognition"
          score={ANALYTICS_DATA.routeRecognition}
          color="ice"
          icon={<RouteIcon className="h-5 w-5" />}
        />
      </div>

      {/* Study Progress */}
      <StudyProgress
        clipsStudied={ANALYTICS_DATA.clipsStudied}
        totalClips={ANALYTICS_DATA.totalClips}
        studyTimeToday={ANALYTICS_DATA.studyTimeToday}
        weeklyStudyTime={ANALYTICS_DATA.weeklyStudyTime}
        streakDays={ANALYTICS_DATA.streakDays}
      />

      {/* Improvement Trend */}
      <div className="p-4 rounded-xl bg-[#1B1E20] border border-[#00F6E5]/20">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-semibold uppercase tracking-widest text-slate-500">
            Improvement Trend
          </span>
          <span className="text-xs text-slate-500">Last 30 days</span>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <TrendingUpIcon className="h-6 w-6 text-[#00F6E5]" />
            <span className="text-3xl font-black text-[#00F6E5]">
              +{ANALYTICS_DATA.improvementTrend}%
            </span>
          </div>
          <span className="text-sm text-slate-400">overall performance</span>
        </div>
        
        {/* Mini Chart (simplified visual) */}
        <div className="mt-4 flex items-end gap-1 h-12">
          {[40, 45, 42, 55, 58, 62, 65, 70, 68, 75, 80, 85, 82, 88, 92].map((value, idx) => (
            <div
              key={idx}
              className="flex-1 bg-gradient-to-t from-[#00F6E5] to-[#00F6E5]/50 rounded-t"
              style={{ height: `${value}%` }}
            />
          ))}
        </div>
      </div>

      {/* Mistake Tendencies */}
      <div className="p-4 rounded-xl bg-[#1B1E20]">
        <div className="flex items-center gap-2 mb-4">
          <WarningIcon className="h-5 w-5 text-[#FF6A3D]" />
          <span className="text-xs font-semibold uppercase tracking-widest text-slate-500">
            Focus Areas
          </span>
        </div>
        <div className="space-y-3">
          {ANALYTICS_DATA.mistakeTendencies.map((mistake, idx) => (
            <div key={idx} className="flex items-center justify-between">
              <span className="text-sm text-slate-300">{mistake.type}</span>
              <div className="flex items-center gap-2">
                <div className="w-16 h-1.5 rounded-full bg-[#0A0A0A] overflow-hidden">
                  <div
                    className="h-full bg-[#FF6A3D] rounded-full"
                    style={{ width: `${(mistake.count / 5) * 100}%` }}
                  />
                </div>
                <span className="text-xs text-[#FF6A3D] font-semibold tabular-nums w-6 text-right">
                  {mistake.count}
                </span>
              </div>
            </div>
          ))}
        </div>
        <button className="w-full mt-4 py-2 rounded-lg bg-[#FF6A3D]/15 text-[#FF6A3D] text-xs font-semibold uppercase tracking-wider hover:bg-[#FF6A3D]/25 transition-colors">
          Create Practice Drill →
        </button>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// SCORE CARD
// ═══════════════════════════════════════════════════════════════════════════

function ScoreCard({
  label,
  score,
  color,
  icon,
}: {
  label: string;
  score: number;
  color: 'teal' | 'gold' | 'ice';
  icon: React.ReactNode;
}) {
  const colors = {
    teal: {
      bg: 'bg-[#00F6E5]/10',
      border: 'border-[#00F6E5]/30',
      text: 'text-[#00F6E5]',
      bar: 'bg-[#00F6E5]',
    },
    gold: {
      bg: 'bg-[#F5C253]/10',
      border: 'border-[#F5C253]/30',
      text: 'text-[#F5C253]',
      bar: 'bg-[#F5C253]',
    },
    ice: {
      bg: 'bg-[#3DF3FF]/10',
      border: 'border-[#3DF3FF]/30',
      text: 'text-[#3DF3FF]',
      bar: 'bg-[#3DF3FF]',
    },
  };

  const c = colors[color];

  return (
    <div className={`p-4 rounded-xl ${c.bg} border ${c.border}`}>
      <div className={`mb-2 ${c.text}`}>{icon}</div>
      <div className={`text-2xl font-black ${c.text} mb-1`}>{score}%</div>
      <div className="text-[10px] font-semibold uppercase tracking-widest text-slate-500">
        {label}
      </div>
      <div className="mt-2 h-1.5 rounded-full bg-[#0A0A0A] overflow-hidden">
        <div
          className={`h-full ${c.bar} rounded-full`}
          style={{ width: `${score}%` }}
        />
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// ICONS
// ═══════════════════════════════════════════════════════════════════════════

function ShieldIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </svg>
  );
}

function FormationIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <rect x="3" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="8" y="14" width="7" height="7" rx="1" />
    </svg>
  );
}

function RouteIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <circle cx="12" cy="19" r="2" />
      <path d="M12 17V7" />
      <path d="M7 12l5-5 5 5" />
    </svg>
  );
}

function TrendingUpIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
      <polyline points="17 6 23 6 23 12" />
    </svg>
  );
}

function WarningIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
      <line x1="12" y1="9" x2="12" y2="13" />
      <line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  );
}

export default FilmAnalytics;








