"use client";

// ═══════════════════════════════════════════════════════════════════════════
// CLIP FILTERS — Filter Controls for Clips
// Search and filter by formation, coverage, concept, etc.
// ═══════════════════════════════════════════════════════════════════════════

import { useState } from 'react';
import { useFilmRoom } from '../FilmRoomContext';

const FILTER_OPTIONS = {
  formations: ['2x2', '3x1', 'Trips', 'Empty', 'Bunch', 'Pro', 'Gun'],
  coverages: ['Cover 0', 'Cover 1', 'Cover 2', 'Cover 3', 'Cover 4', 'Quarters', 'Man'],
  concepts: ['Mesh', 'Smash', 'Flood', 'Four Verts', 'Sail', 'Drive', 'Y-Cross'],
};

export function ClipFilters() {
  const [search, setSearch] = useState('');
  const [selectedFilters, setSelectedFilters] = useState<{
    formations: string[];
    coverages: string[];
    concepts: string[];
    hasAI: boolean | null;
    isStudied: boolean | null;
  }>({
    formations: [],
    coverages: [],
    concepts: [],
    hasAI: null,
    isStudied: null,
  });

  const { setFilters } = useFilmRoom();

  const toggleArrayFilter = (
    category: 'formations' | 'coverages' | 'concepts',
    value: string
  ) => {
    setSelectedFilters((prev) => {
      const current = prev[category];
      const updated = current.includes(value)
        ? current.filter((v) => v !== value)
        : [...current, value];
      return { ...prev, [category]: updated };
    });
  };

  const clearAll = () => {
    setSelectedFilters({
      formations: [],
      coverages: [],
      concepts: [],
      hasAI: null,
      isStudied: null,
    });
    setSearch('');
    setFilters({});
  };

  const activeFilterCount =
    selectedFilters.formations.length +
    selectedFilters.coverages.length +
    selectedFilters.concepts.length +
    (selectedFilters.hasAI !== null ? 1 : 0) +
    (selectedFilters.isStudied !== null ? 1 : 0);

  return (
    <div className="p-4 space-y-4">
      {/* Search */}
      <div className="relative">
        <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search clips..."
          className="w-full pl-10 pr-4 py-2 rounded-lg bg-[#1B1E20] border border-transparent text-sm text-white placeholder-slate-500 focus:outline-none focus:border-[#00F6E5]/30"
        />
      </div>

      {/* Quick Toggles */}
      <div className="flex gap-2">
        <button
          onClick={() =>
            setSelectedFilters((prev) => ({
              ...prev,
              hasAI: prev.hasAI === true ? null : true,
            }))
          }
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
            selectedFilters.hasAI === true
              ? 'bg-[#F5C253]/20 text-[#F5C253] border border-[#F5C253]/30'
              : 'bg-[#1B1E20] text-slate-400 border border-transparent hover:text-white'
          }`}
        >
          <AIIcon className="h-3.5 w-3.5" />
          AI Analyzed
        </button>
        <button
          onClick={() =>
            setSelectedFilters((prev) => ({
              ...prev,
              isStudied: prev.isStudied === true ? null : true,
            }))
          }
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
            selectedFilters.isStudied === true
              ? 'bg-[#00F6E5]/20 text-[#00F6E5] border border-[#00F6E5]/30'
              : 'bg-[#1B1E20] text-slate-400 border border-transparent hover:text-white'
          }`}
        >
          <CheckIcon className="h-3.5 w-3.5" />
          Studied
        </button>
      </div>

      {/* Formation Filter */}
      <div>
        <span className="text-[10px] font-semibold uppercase tracking-widest text-slate-500 mb-2 block">
          Formation
        </span>
        <div className="flex flex-wrap gap-1.5">
          {FILTER_OPTIONS.formations.map((f) => (
            <FilterChip
              key={f}
              label={f}
              isActive={selectedFilters.formations.includes(f)}
              onClick={() => toggleArrayFilter('formations', f)}
            />
          ))}
        </div>
      </div>

      {/* Coverage Filter */}
      <div>
        <span className="text-[10px] font-semibold uppercase tracking-widest text-slate-500 mb-2 block">
          Coverage
        </span>
        <div className="flex flex-wrap gap-1.5">
          {FILTER_OPTIONS.coverages.map((c) => (
            <FilterChip
              key={c}
              label={c}
              isActive={selectedFilters.coverages.includes(c)}
              onClick={() => toggleArrayFilter('coverages', c)}
            />
          ))}
        </div>
      </div>

      {/* Concept Filter */}
      <div>
        <span className="text-[10px] font-semibold uppercase tracking-widest text-slate-500 mb-2 block">
          Concept
        </span>
        <div className="flex flex-wrap gap-1.5">
          {FILTER_OPTIONS.concepts.map((c) => (
            <FilterChip
              key={c}
              label={c}
              isActive={selectedFilters.concepts.includes(c)}
              onClick={() => toggleArrayFilter('concepts', c)}
            />
          ))}
        </div>
      </div>

      {/* Clear All */}
      {activeFilterCount > 0 && (
        <div className="flex items-center justify-between pt-2 border-t border-[#1B1E20]">
          <span className="text-xs text-slate-500">
            {activeFilterCount} filter{activeFilterCount !== 1 ? 's' : ''} active
          </span>
          <button
            onClick={clearAll}
            className="text-xs font-semibold text-[#FF6A3D] hover:underline"
          >
            Clear All
          </button>
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// FILTER CHIP
// ═══════════════════════════════════════════════════════════════════════════

function FilterChip({
  label,
  isActive,
  onClick,
}: {
  label: string;
  isActive: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-colors ${
        isActive
          ? 'bg-[#00F6E5]/20 text-[#00F6E5] border border-[#00F6E5]/30'
          : 'bg-[#0A0A0A] text-slate-400 border border-transparent hover:text-white hover:bg-[#1B1E20]'
      }`}
    >
      {label}
    </button>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// ICONS
// ═══════════════════════════════════════════════════════════════════════════

function SearchIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  );
}

function AIIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2a2 2 0 0 1 2 2c0 .74-.4 1.39-1 1.73V7h1a7 7 0 0 1 7 7h1a1 1 0 0 1 1 1v3a1 1 0 0 1-1 1h-1v1a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-1H2a1 1 0 0 1-1-1v-3a1 1 0 0 1 1-1h1a7 7 0 0 1 7-7h1V5.73c-.6-.34-1-.99-1-1.73a2 2 0 0 1 2-2" />
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

export default ClipFilters;








