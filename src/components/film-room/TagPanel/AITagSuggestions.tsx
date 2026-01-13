"use client";

// ═══════════════════════════════════════════════════════════════════════════
// AI TAG SUGGESTIONS — AI-Generated Tag Recommendations
// Displays AI analysis results with confidence scores
// ═══════════════════════════════════════════════════════════════════════════

import { useFilmRoom } from '../FilmRoomContext';
import type { AIAnalysis } from '../types';

interface AITagSuggestionsProps {
  analysis: AIAnalysis;
}

export function AITagSuggestions({ analysis }: AITagSuggestionsProps) {
  const { addTag, confirmAITags } = useFilmRoom();

  const suggestions = [
    { category: 'formation', data: analysis.offenseFormation, label: 'Formation' },
    { category: 'front', data: analysis.defensiveFront, label: 'Defensive Front' },
    { category: 'coverage', data: analysis.coverageShell, label: 'Coverage' },
    { category: 'routeConcept', data: analysis.concept, label: 'Concept' },
    { category: 'personnel', data: analysis.personnel, label: 'Personnel' },
    { category: 'motion', data: analysis.motion, label: 'Motion' },
  ].filter((s) => s.data);

  const handleAccept = (category: string, value: string) => {
    addTag({
      category: category as any,
      value,
      isAIGenerated: true,
    });
  };

  if (suggestions.length === 0) return null;

  return (
    <div className="px-4 py-3">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <AIIcon className="h-4 w-4 text-[#F5C253]" />
          <span className="text-[10px] font-semibold uppercase tracking-widest text-[#F5C253]">
            AI Suggestions
          </span>
        </div>
        <button
          onClick={confirmAITags}
          className="text-[10px] font-semibold uppercase tracking-wider text-[#00F6E5] hover:underline"
        >
          Accept All
        </button>
      </div>

      {/* Suggestions */}
      <div className="space-y-2">
        {suggestions.map(({ category, data, label }) => {
          if (!data) return null;

          const confidence = Math.round(data.confidence * 100);
          const confidenceColor =
            confidence >= 90
              ? 'text-[#00F6E5]'
              : confidence >= 70
              ? 'text-[#F5C253]'
              : 'text-[#FF6A3D]';

          return (
            <div
              key={category}
              className="flex items-center gap-3 p-2 rounded-lg bg-[#F5C253]/5 border border-[#F5C253]/20"
            >
              {/* Info */}
              <div className="flex-1 min-w-0">
                <span className="text-[10px] font-semibold uppercase tracking-widest text-slate-500 block">
                  {label}
                </span>
                <p className="text-sm font-bold text-white truncate">{data.value}</p>
              </div>

              {/* Confidence */}
              <div className="flex items-center gap-2">
                <div className="w-12 h-1.5 rounded-full bg-[#1B1E20] overflow-hidden">
                  <div
                    className="h-full bg-[#F5C253] rounded-full transition-all"
                    style={{ width: `${confidence}%` }}
                  />
                </div>
                <span className={`text-xs font-bold tabular-nums ${confidenceColor}`}>
                  {confidence}%
                </span>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-1">
                <button
                  onClick={() => handleAccept(category, data.value)}
                  className="h-7 w-7 flex items-center justify-center rounded-lg bg-[#00F6E5]/20 text-[#00F6E5] hover:bg-[#00F6E5]/30 transition-colors"
                  title="Accept"
                >
                  <CheckIcon className="h-4 w-4" />
                </button>
                <button
                  className="h-7 w-7 flex items-center justify-center rounded-lg bg-[#FF6A3D]/20 text-[#FF6A3D] hover:bg-[#FF6A3D]/30 transition-colors"
                  title="Reject"
                >
                  <XIcon className="h-4 w-4" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Suggested Play */}
      {analysis.suggestedPlay && (
        <div className="mt-3 p-3 rounded-lg bg-[#00F6E5]/10 border border-[#00F6E5]/30">
          <div className="flex items-center gap-2 mb-2">
            <PlaybookIcon className="h-4 w-4 text-[#00F6E5]" />
            <span className="text-[10px] font-semibold uppercase tracking-widest text-[#00F6E5]">
              Playbook Match
            </span>
          </div>
          <p className="text-sm font-bold text-white mb-1">
            {analysis.suggestedPlay.playName}
          </p>
          <p className="text-xs text-slate-400">
            {analysis.suggestedPlay.explanation}
          </p>
          <div className="mt-2 flex items-center justify-between">
            <span className="text-xs text-[#00F6E5]">
              {Math.round(analysis.suggestedPlay.matchScore * 100)}% Match
            </span>
            <button className="text-xs font-semibold text-[#00F6E5] hover:underline">
              Link to Play →
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// ICONS
// ═══════════════════════════════════════════════════════════════════════════

function AIIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2a2 2 0 0 1 2 2c0 .74-.4 1.39-1 1.73V7h1a7 7 0 0 1 7 7h1a1 1 0 0 1 1 1v3a1 1 0 0 1-1 1h-1v1a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-1H2a1 1 0 0 1-1-1v-3a1 1 0 0 1 1-1h1a7 7 0 0 1 7-7h1V5.73c-.6-.34-1-.99-1-1.73a2 2 0 0 1 2-2M7.5 13A2.5 2.5 0 0 0 5 15.5 2.5 2.5 0 0 0 7.5 18a2.5 2.5 0 0 0 2.5-2.5A2.5 2.5 0 0 0 7.5 13m9 0a2.5 2.5 0 0 0-2.5 2.5 2.5 2.5 0 0 0 2.5 2.5 2.5 2.5 0 0 0 2.5-2.5 2.5 2.5 0 0 0-2.5-2.5z" />
    </svg>
  );
}

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

function XIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
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

export default AITagSuggestions;








