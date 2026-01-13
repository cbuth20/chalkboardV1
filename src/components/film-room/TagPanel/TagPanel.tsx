"use client";

// ═══════════════════════════════════════════════════════════════════════════
// TAG PANEL — Manual & AI Tagging System
// Comprehensive clip tagging with AI suggestions
// ═══════════════════════════════════════════════════════════════════════════

import { useState } from 'react';
import { useFilmRoom } from '../FilmRoomContext';
import { TagSelector } from './TagSelector';
import { AITagSuggestions } from './AITagSuggestions';
import { TagBadge } from './TagBadge';
import type { TagCategory } from '../types';

const TAG_CATEGORIES: { key: TagCategory; label: string; icon: React.ReactNode }[] = [
  { key: 'formation', label: 'Formation', icon: <FormationIcon /> },
  { key: 'personnel', label: 'Personnel', icon: <PersonnelIcon /> },
  { key: 'playName', label: 'Play Name', icon: <PlayIcon /> },
  { key: 'motion', label: 'Motion', icon: <MotionIcon /> },
  { key: 'playType', label: 'Run/Pass', icon: <TypeIcon /> },
  { key: 'front', label: 'Front', icon: <FrontIcon /> },
  { key: 'coverage', label: 'Coverage', icon: <CoverageIcon /> },
  { key: 'routeConcept', label: 'Route Concept', icon: <RouteIcon /> },
  { key: 'downDistance', label: 'Down & Distance', icon: <DownIcon /> },
  { key: 'hash', label: 'Hash / Field', icon: <HashIcon /> },
  { key: 'result', label: 'Result', icon: <ResultIcon /> },
];

export function TagPanel() {
  const [activeCategory, setActiveCategory] = useState<TagCategory | null>(null);
  const { currentClip, addTag, removeTag, requestAnalysis, isAnalyzing, analysisProgress } = useFilmRoom();

  if (!currentClip) {
    return (
      <div className="flex flex-col items-center justify-center h-full py-12 px-4">
        <TagIcon className="h-12 w-12 text-slate-700 mb-4" />
        <p className="text-slate-500 text-sm text-center">
          Select a clip to start tagging
        </p>
      </div>
    );
  }

  const existingTags = currentClip.tags;
  const aiSuggestions = currentClip.aiAnalysis;
  const hasAISuggestions = aiSuggestions && aiSuggestions.status === 'complete';

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex-shrink-0 px-4 py-3 border-b border-[#1B1E20]">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <TagIcon className="h-5 w-5 text-[#00F6E5]" />
            <h3 className="text-sm font-bold uppercase tracking-wider text-white">
              Clip Tags
            </h3>
          </div>
          <span className="text-xs text-slate-500">
            {existingTags.length} tags
          </span>
        </div>

        {/* AI Analysis Button */}
        <button
          onClick={requestAnalysis}
          disabled={isAnalyzing}
          className={`w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg font-semibold text-sm uppercase tracking-wide transition-all ${
            isAnalyzing
              ? 'bg-[#00F6E5]/10 text-[#00F6E5] border border-[#00F6E5]/30'
              : 'bg-gradient-to-r from-[#00F6E5] to-[#00d4c5] text-[#0A0A0A] hover:shadow-lg hover:shadow-[#00F6E5]/30'
          }`}
        >
          {isAnalyzing ? (
            <>
              <SpinnerIcon className="h-4 w-4 animate-spin" />
              <span>Analyzing... {analysisProgress}%</span>
            </>
          ) : (
            <>
              <AIIcon className="h-4 w-4" />
              <span>Run AI Analysis</span>
            </>
          )}
        </button>
      </div>

      {/* Current Tags */}
      {existingTags.length > 0 && (
        <div className="flex-shrink-0 px-4 py-3 border-b border-[#1B1E20]">
          <span className="text-[10px] font-semibold uppercase tracking-widest text-slate-500 mb-2 block">
            Applied Tags
          </span>
          <div className="flex flex-wrap gap-2">
            {existingTags.map((tag) => (
              <TagBadge
                key={tag.id}
                tag={tag}
                onRemove={() => removeTag(tag.id)}
              />
            ))}
          </div>
        </div>
      )}

      {/* AI Suggestions */}
      {hasAISuggestions && (
        <div className="flex-shrink-0 border-b border-[#1B1E20]">
          <AITagSuggestions analysis={aiSuggestions} />
        </div>
      )}

      {/* Tag Categories */}
      <div className="flex-1 overflow-y-auto">
        <div className="px-4 py-3">
          <span className="text-[10px] font-semibold uppercase tracking-widest text-slate-500 mb-3 block">
            Tag Categories
          </span>
          <div className="space-y-1">
            {TAG_CATEGORIES.map((category) => {
              const hasTag = existingTags.some((t) => t.category === category.key);
              const isActive = activeCategory === category.key;

              return (
                <button
                  key={category.key}
                  onClick={() => setActiveCategory(isActive ? null : category.key)}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg transition-all ${
                    isActive
                      ? 'bg-[#00F6E5]/15 border border-[#00F6E5]/30 text-[#00F6E5]'
                      : hasTag
                      ? 'bg-[#1B1E20] border border-transparent text-white'
                      : 'border border-transparent text-slate-400 hover:bg-[#1B1E20] hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className={`h-5 w-5 ${isActive ? 'text-[#00F6E5]' : hasTag ? 'text-[#00F6E5]' : 'text-slate-500'}`}>
                      {category.icon}
                    </span>
                    <span className="text-sm font-medium">{category.label}</span>
                  </div>
                  {hasTag && (
                    <span className="h-2 w-2 rounded-full bg-[#00F6E5]" />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Tag Selector (when category is active) */}
        {activeCategory && (
          <div className="px-4 pb-4">
            <TagSelector
              category={activeCategory}
              onSelect={(value) => {
                addTag({
                  category: activeCategory,
                  value,
                  isAIGenerated: false,
                });
                setActiveCategory(null);
              }}
              onClose={() => setActiveCategory(null)}
            />
          </div>
        )}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// ICONS
// ═══════════════════════════════════════════════════════════════════════════

function TagIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" />
      <line x1="7" y1="7" x2="7.01" y2="7" />
    </svg>
  );
}

function AIIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2a2 2 0 0 1 2 2c0 .74-.4 1.39-1 1.73V7h1a7 7 0 0 1 7 7h1a1 1 0 0 1 1 1v3a1 1 0 0 1-1 1h-1v1a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-1H2a1 1 0 0 1-1-1v-3a1 1 0 0 1 1-1h1a7 7 0 0 1 7-7h1V5.73c-.6-.34-1-.99-1-1.73a2 2 0 0 1 2-2M7.5 13A2.5 2.5 0 0 0 5 15.5 2.5 2.5 0 0 0 7.5 18a2.5 2.5 0 0 0 2.5-2.5A2.5 2.5 0 0 0 7.5 13m9 0a2.5 2.5 0 0 0-2.5 2.5 2.5 2.5 0 0 0 2.5 2.5 2.5 2.5 0 0 0 2.5-2.5 2.5 2.5 0 0 0-2.5-2.5z" />
    </svg>
  );
}

function SpinnerIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <path d="M21 12a9 9 0 1 1-6.219-8.56" />
    </svg>
  );
}

function FormationIcon() {
  return (
    <svg className="h-full w-full" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <rect x="3" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="8" y="14" width="7" height="7" rx="1" />
    </svg>
  );
}

function PersonnelIcon() {
  return (
    <svg className="h-full w-full" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}

function PlayIcon() {
  return (
    <svg className="h-full w-full" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
      <rect x="8" y="2" width="8" height="4" rx="1" />
    </svg>
  );
}

function MotionIcon() {
  return (
    <svg className="h-full w-full" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <path d="M5 12h14" />
      <path d="M12 5l7 7-7 7" />
    </svg>
  );
}

function TypeIcon() {
  return (
    <svg className="h-full w-full" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <circle cx="12" cy="12" r="10" />
      <path d="M8 12h8" />
      <path d="M12 8v8" />
    </svg>
  );
}

function FrontIcon() {
  return (
    <svg className="h-full w-full" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <rect x="2" y="7" width="20" height="10" rx="2" />
      <line x1="6" y1="12" x2="6" y2="12" strokeWidth={3} />
      <line x1="12" y1="12" x2="12" y2="12" strokeWidth={3} />
      <line x1="18" y1="12" x2="18" y2="12" strokeWidth={3} />
    </svg>
  );
}

function CoverageIcon() {
  return (
    <svg className="h-full w-full" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </svg>
  );
}

function RouteIcon() {
  return (
    <svg className="h-full w-full" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <circle cx="12" cy="19" r="2" />
      <path d="M12 17V7" />
      <path d="M7 12l5-5 5 5" />
    </svg>
  );
}

function DownIcon() {
  return (
    <svg className="h-full w-full" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <circle cx="12" cy="12" r="10" />
      <path d="M8 12l4 4 4-4" />
      <path d="M12 8v8" />
    </svg>
  );
}

function HashIcon() {
  return (
    <svg className="h-full w-full" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <line x1="4" y1="9" x2="20" y2="9" />
      <line x1="4" y1="15" x2="20" y2="15" />
      <line x1="10" y1="3" x2="8" y2="21" />
      <line x1="16" y1="3" x2="14" y2="21" />
    </svg>
  );
}

function ResultIcon() {
  return (
    <svg className="h-full w-full" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
      <polyline points="22 4 12 14.01 9 11.01" />
    </svg>
  );
}

export default TagPanel;








