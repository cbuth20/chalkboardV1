"use client";

// ═══════════════════════════════════════════════════════════════════════════
// STUDY PROGRESS — Visual Progress Indicators
// Shows study time, clips reviewed, and streak
// ═══════════════════════════════════════════════════════════════════════════

interface StudyProgressProps {
  clipsStudied: number;
  totalClips: number;
  studyTimeToday: number; // minutes
  weeklyStudyTime: number; // minutes
  streakDays: number;
}

export function StudyProgress({
  clipsStudied,
  totalClips,
  studyTimeToday,
  weeklyStudyTime,
  streakDays,
}: StudyProgressProps) {
  const progressPercent = Math.round((clipsStudied / totalClips) * 100);

  const formatTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  };

  return (
    <div className="p-4 rounded-xl bg-[#1B1E20]">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <span className="text-xs font-semibold uppercase tracking-widest text-slate-500">
          Study Progress
        </span>
        <span className="text-xs text-slate-500">
          {progressPercent}% Complete
        </span>
      </div>

      {/* Progress Ring */}
      <div className="flex items-center gap-6 mb-4">
        <div className="relative h-24 w-24">
          <svg className="h-full w-full -rotate-90">
            {/* Background circle */}
            <circle
              cx="48"
              cy="48"
              r="40"
              stroke="#0A0A0A"
              strokeWidth="8"
              fill="none"
            />
            {/* Progress circle */}
            <circle
              cx="48"
              cy="48"
              r="40"
              stroke="#00F6E5"
              strokeWidth="8"
              fill="none"
              strokeLinecap="round"
              strokeDasharray={`${2 * Math.PI * 40}`}
              strokeDashoffset={`${2 * Math.PI * 40 * (1 - progressPercent / 100)}`}
              className="transition-all duration-500"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-2xl font-black text-white">{clipsStudied}</span>
            <span className="text-[10px] text-slate-500">of {totalClips}</span>
          </div>
        </div>

        {/* Stats */}
        <div className="flex-1 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ClockIcon className="h-4 w-4 text-slate-500" />
              <span className="text-sm text-slate-400">Today</span>
            </div>
            <span className="text-sm font-bold text-white">{formatTime(studyTimeToday)}</span>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CalendarIcon className="h-4 w-4 text-slate-500" />
              <span className="text-sm text-slate-400">This Week</span>
            </div>
            <span className="text-sm font-bold text-white">{formatTime(weeklyStudyTime)}</span>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FireIcon className="h-4 w-4 text-[#F5C253]" />
              <span className="text-sm text-slate-400">Streak</span>
            </div>
            <span className="text-sm font-bold text-[#F5C253]">{streakDays} days</span>
          </div>
        </div>
      </div>

      {/* Weekly Heatmap */}
      <div>
        <span className="text-[10px] font-semibold uppercase tracking-widest text-slate-600 mb-2 block">
          Activity This Week
        </span>
        <div className="flex gap-1">
          {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((day, idx) => {
            // Simulated activity levels
            const levels = [3, 4, 2, 5, 4, 1, 3];
            const level = levels[idx];
            const opacity = level / 5;

            return (
              <div key={idx} className="flex-1 text-center">
                <div
                  className="h-8 rounded-md mb-1 transition-all"
                  style={{
                    backgroundColor: `rgba(0, 246, 229, ${opacity})`,
                  }}
                />
                <span className="text-[10px] text-slate-600">{day}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// ICONS
// ═══════════════════════════════════════════════════════════════════════════

function ClockIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  );
}

function CalendarIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  );
}

function FireIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 23c-4.97 0-9-4.03-9-9 0-3.53 2.04-6.43 5-7.87V4c0-.55.45-1 1-1s1 .45 1 1v2.13c2.96 1.44 5 4.34 5 7.87 0 4.97-4.03 9-9 9z" />
    </svg>
  );
}

export default StudyProgress;








