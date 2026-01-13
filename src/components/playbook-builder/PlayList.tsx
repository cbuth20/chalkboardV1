"use client";

import { useState } from "react";
import { DemoPlay, createBlankPlay, duplicatePlay, FORMATION_TEMPLATES } from "@/lib/playbook/demo-types";

// ═══════════════════════════════════════════════════════════════════════════
// PLAY LIST SIDEBAR
// ═══════════════════════════════════════════════════════════════════════════

interface PlayListProps {
  plays: DemoPlay[];
  selectedPlayId: string | null;
  onSelectPlay: (id: string) => void;
  onCreatePlay: (play: DemoPlay) => void;
  onDuplicatePlay: (play: DemoPlay) => void;
  onDeletePlay: (id: string) => void;
}

export function PlayList({
  plays,
  selectedPlayId,
  onSelectPlay,
  onCreatePlay,
  onDuplicatePlay,
  onDeletePlay,
}: PlayListProps) {
  const [showFormationPicker, setShowFormationPicker] = useState(false);
  
  const handleNewPlay = (formationId?: string) => {
    const newPlay = createBlankPlay(formationId);
    onCreatePlay(newPlay);
    setShowFormationPicker(false);
  };

  const handleDuplicate = () => {
    const current = plays.find((p) => p.id === selectedPlayId);
    if (current) {
      const dup = duplicatePlay(current);
      onDuplicatePlay(dup);
    }
  };

  const handleDelete = () => {
    if (selectedPlayId && plays.length > 1) {
      onDeletePlay(selectedPlayId);
    }
  };

  return (
    <aside className="flex w-72 flex-col border-r border-[#1B1E20] bg-[#0A0A0A]">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[#1B1E20] px-4 py-3">
        <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400">
          Plays
        </h2>
        <span className="rounded bg-[#1B1E20] px-2 py-0.5 text-xs font-medium text-slate-500">
          {plays.length}
        </span>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-2 border-b border-[#1B1E20] p-3">
        <button
          onClick={() => setShowFormationPicker(!showFormationPicker)}
          className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-[#00F6E5] px-3 py-2 text-xs font-bold uppercase tracking-wide text-[#0A0A0A] transition-all hover:bg-[#3DF3FF] hover:shadow-lg hover:shadow-[#00F6E5]/20"
        >
          <PlusIcon className="h-4 w-4" />
          New Play
        </button>
        <button
          onClick={handleDuplicate}
          disabled={!selectedPlayId}
          className="flex items-center justify-center rounded-lg bg-[#1B1E20] px-3 py-2 text-slate-400 transition-colors hover:bg-slate-800 hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
          title="Duplicate"
        >
          <CopyIcon className="h-4 w-4" />
        </button>
        <button
          onClick={handleDelete}
          disabled={!selectedPlayId || plays.length <= 1}
          className="flex items-center justify-center rounded-lg bg-[#1B1E20] px-3 py-2 text-slate-400 transition-colors hover:bg-red-900/30 hover:text-red-400 disabled:cursor-not-allowed disabled:opacity-40"
          title="Delete"
        >
          <TrashIcon className="h-4 w-4" />
        </button>
      </div>
      
      {/* Formation Picker */}
      {showFormationPicker && (
        <div className="border-b border-[#1B1E20] p-3 bg-[#0d1117]">
          <p className="text-xs text-slate-500 mb-2 uppercase tracking-wide font-semibold">Choose Formation</p>
          <div className="space-y-1">
            {FORMATION_TEMPLATES.map((formation) => (
              <button
                key={formation.id}
                onClick={() => handleNewPlay(formation.id)}
                className="w-full flex items-center justify-between px-3 py-2 rounded-lg bg-[#1B1E20] hover:bg-[#1B1E20]/80 text-left transition-colors group"
              >
                <span className="text-sm text-white group-hover:text-[#00F6E5]">{formation.name}</span>
                <span className="text-xs text-slate-500">{formation.personnel}</span>
              </button>
            ))}
          </div>
          <button
            onClick={() => setShowFormationPicker(false)}
            className="w-full mt-2 py-1.5 text-xs text-slate-500 hover:text-slate-300 transition-colors"
          >
            Cancel
          </button>
        </div>
      )}

      {/* Play List */}
      <div className="flex-1 overflow-y-auto p-2">
        {plays.map((play) => (
          <PlayListItem
            key={play.id}
            play={play}
            isSelected={play.id === selectedPlayId}
            onSelect={() => onSelectPlay(play.id)}
          />
        ))}
      </div>
    </aside>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// PLAY LIST ITEM
// ═══════════════════════════════════════════════════════════════════════════

function PlayListItem({
  play,
  isSelected,
  onSelect,
}: {
  play: DemoPlay;
  isSelected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      onClick={onSelect}
      className={`group mb-1 w-full rounded-lg px-3 py-2.5 text-left transition-all ${
        isSelected
          ? "bg-[#00F6E5]/10 ring-1 ring-[#00F6E5]/30"
          : "hover:bg-[#1B1E20]/50"
      }`}
    >
      <div className="flex items-start justify-between">
        <div className="min-w-0 flex-1">
          <p
            className={`truncate text-sm font-semibold ${
              isSelected ? "text-[#00F6E5]" : "text-white"
            }`}
          >
            {play.name || "Untitled Play"}
          </p>
          <p className="mt-0.5 truncate text-xs text-slate-500">
            {play.formation} • {play.personnel} personnel
          </p>
        </div>
        {isSelected && (
          <div className="ml-2 mt-1 h-2 w-2 shrink-0 rounded-full bg-[#00F6E5]" />
        )}
      </div>
    </button>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// ICONS
// ═══════════════════════════════════════════════════════════════════════════

function PlusIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 5v14M5 12h14" />
    </svg>
  );
}

function CopyIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <rect x="9" y="9" width="13" height="13" rx="2" />
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
    </svg>
  );
}

function TrashIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
    </svg>
  );
}

export default PlayList;

