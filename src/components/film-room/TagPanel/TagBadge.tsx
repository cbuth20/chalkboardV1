"use client";

// ═══════════════════════════════════════════════════════════════════════════
// TAG BADGE — Individual Tag Display
// Shows tag with category color and remove action
// ═══════════════════════════════════════════════════════════════════════════

import type { ClipTag } from '../types';

interface TagBadgeProps {
  tag: ClipTag;
  onRemove?: () => void;
  onClick?: () => void;
  showCategory?: boolean;
}

const CATEGORY_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  formation: { bg: 'bg-[#00F6E5]/15', text: 'text-[#00F6E5]', border: 'border-[#00F6E5]/30' },
  personnel: { bg: 'bg-[#3DF3FF]/15', text: 'text-[#3DF3FF]', border: 'border-[#3DF3FF]/30' },
  playName: { bg: 'bg-[#F5C253]/15', text: 'text-[#F5C253]', border: 'border-[#F5C253]/30' },
  motion: { bg: 'bg-[#FF6A3D]/15', text: 'text-[#FF6A3D]', border: 'border-[#FF6A3D]/30' },
  playType: { bg: 'bg-emerald-500/15', text: 'text-emerald-400', border: 'border-emerald-500/30' },
  front: { bg: 'bg-rose-500/15', text: 'text-rose-400', border: 'border-rose-500/30' },
  coverage: { bg: 'bg-amber-500/15', text: 'text-amber-400', border: 'border-amber-500/30' },
  routeConcept: { bg: 'bg-violet-500/15', text: 'text-violet-400', border: 'border-violet-500/30' },
  assignment: { bg: 'bg-sky-500/15', text: 'text-sky-400', border: 'border-sky-500/30' },
  downDistance: { bg: 'bg-pink-500/15', text: 'text-pink-400', border: 'border-pink-500/30' },
  hash: { bg: 'bg-lime-500/15', text: 'text-lime-400', border: 'border-lime-500/30' },
  result: { bg: 'bg-cyan-500/15', text: 'text-cyan-400', border: 'border-cyan-500/30' },
};

export function TagBadge({ tag, onRemove, onClick, showCategory = false }: TagBadgeProps) {
  const colors = CATEGORY_COLORS[tag.category] || CATEGORY_COLORS.formation;

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs font-semibold transition-all ${colors.bg} ${colors.text} ${colors.border} ${
        onClick ? 'cursor-pointer hover:opacity-80' : ''
      }`}
      onClick={onClick}
    >
      {/* AI Indicator */}
      {tag.isAIGenerated && (
        <AIIcon className="h-3 w-3 opacity-60" />
      )}

      {/* Category Label */}
      {showCategory && (
        <span className="opacity-60 uppercase tracking-wider text-[10px]">
          {tag.category}:
        </span>
      )}

      {/* Value */}
      <span className="truncate max-w-[120px]">{tag.value}</span>

      {/* Confidence */}
      {tag.confidence !== undefined && (
        <span className="opacity-50 text-[10px] tabular-nums">
          {Math.round(tag.confidence * 100)}%
        </span>
      )}

      {/* Remove Button */}
      {onRemove && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          className="ml-0.5 h-4 w-4 flex items-center justify-center rounded hover:bg-white/20 transition-colors"
        >
          <CloseIcon className="h-3 w-3" />
        </button>
      )}
    </span>
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

function CloseIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}

export default TagBadge;








