"use client";

import { useRef, useEffect, useCallback, useState } from "react";
import { DemoPlay } from "@/lib/playbook/demo-types";

// ═══════════════════════════════════════════════════════════════════════════
// PLAY METADATA PANEL (HORIZONTAL - BELOW DIAGRAM)
// ═══════════════════════════════════════════════════════════════════════════

interface PlayMetadataProps {
  play: DemoPlay | null;
  onUpdate: (updates: Partial<DemoPlay>) => void;
  onExportJSON: () => void;
  onResetDemo: () => void;
}

export function PlayMetadata({
  play,
  onUpdate,
  onExportJSON,
  onResetDemo,
}: PlayMetadataProps) {
  // Local state for controlled inputs
  const [name, setName] = useState(play?.name || "");
  const [formation, setFormation] = useState(play?.formation || "");
  const [personnel, setPersonnel] = useState(play?.personnel || "");
  const [concept, setConcept] = useState(play?.concept || "");
  const [notes, setNotes] = useState(play?.notes || "");
  const [isExpanded, setIsExpanded] = useState(false);

  // Track last saved play ID to detect switches
  const lastPlayId = useRef(play?.id);

  // Sync local state when play changes
  useEffect(() => {
    if (play && play.id !== lastPlayId.current) {
      setName(play.name);
      setFormation(play.formation);
      setPersonnel(play.personnel);
      setConcept(play.concept);
      setNotes(play.notes);
      lastPlayId.current = play.id;
    }
  }, [play]);

  // Debounced save (500ms)
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const debouncedSave = useCallback(
    (updates: Partial<DemoPlay>) => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
      saveTimeoutRef.current = setTimeout(() => {
        onUpdate(updates);
      }, 500);
    },
    [onUpdate]
  );

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, []);

  // Handlers that update local state and trigger debounced save
  const handleNameChange = (value: string) => {
    setName(value);
    debouncedSave({ name: value });
  };

  const handleFormationChange = (value: string) => {
    setFormation(value);
    debouncedSave({ formation: value });
  };

  const handlePersonnelChange = (value: string) => {
    setPersonnel(value);
    debouncedSave({ personnel: value });
  };

  const handleConceptChange = (value: string) => {
    setConcept(value);
    debouncedSave({ concept: value });
  };

  const handleNotesChange = (value: string) => {
    setNotes(value);
    debouncedSave({ notes: value });
  };

  if (!play) {
    return (
      <div className="border-t border-[#1B1E20] bg-[#0A0A0A] px-4 py-3">
        <p className="text-center text-sm text-slate-500">Select a play to edit details</p>
      </div>
    );
  }

  return (
    <div className="border-t border-[#1B1E20] bg-[#0A0A0A]">
      {/* Collapsible Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex w-full items-center justify-between px-4 py-3 hover:bg-[#1B1E20]/50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <ChevronIcon className={`h-4 w-4 text-[#00F6E5] transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-300">
            Play Details
          </h2>
          {!isExpanded && (
            <span className="text-sm text-slate-500">
              {name || "Untitled"} • {formation} • {personnel}
            </span>
          )}
        </div>
        <span className="text-[10px] text-slate-600 uppercase tracking-wide">
          {isExpanded ? 'Collapse' : 'Expand'}
        </span>
      </button>

      {/* Expanded Content */}
      {isExpanded && (
        <div className="px-4 pb-4">
          {/* Horizontal Form Layout */}
          <div className="flex flex-wrap gap-4">
            {/* Name */}
            <div className="flex-1 min-w-[200px]">
              <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => handleNameChange(e.target.value)}
                className="input-field"
                placeholder="Play name..."
              />
            </div>

            {/* Formation */}
            <div className="w-[160px]">
              <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                Formation
              </label>
              <select
                value={formation}
                onChange={(e) => handleFormationChange(e.target.value)}
                className="input-field"
              >
                <option value="Shotgun Spread">Shotgun Spread</option>
                <option value="I-Formation">I-Formation</option>
                <option value="Singleback">Singleback</option>
                <option value="Pistol">Pistol</option>
                <option value="Empty">Empty</option>
                <option value="Trips Right">Trips Right</option>
                <option value="Trips Left">Trips Left</option>
                <option value="Bunch">Bunch</option>
                <option value="Ace">Ace</option>
                <option value="Pro">Pro</option>
              </select>
            </div>

            {/* Personnel */}
            <div className="w-[180px]">
              <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                Personnel
              </label>
              <select
                value={personnel}
                onChange={(e) => handlePersonnelChange(e.target.value)}
                className="input-field"
              >
                <option value="10">10 (1 RB, 0 TE, 4 WR)</option>
                <option value="11">11 (1 RB, 1 TE, 3 WR)</option>
                <option value="12">12 (1 RB, 2 TE, 2 WR)</option>
                <option value="21">21 (2 RB, 1 TE, 2 WR)</option>
                <option value="22">22 (2 RB, 2 TE, 1 WR)</option>
                <option value="13">13 (1 RB, 3 TE, 1 WR)</option>
              </select>
            </div>

            {/* Concept */}
            <div className="flex-1 min-w-[150px]">
              <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                Concept
              </label>
              <input
                type="text"
                value={concept}
                onChange={(e) => handleConceptChange(e.target.value)}
                className="input-field"
                placeholder="e.g., Mesh, Four Verts..."
              />
            </div>

            {/* Actions */}
            <div className="flex items-end gap-2">
              <button
                onClick={onExportJSON}
                className="flex items-center gap-1.5 rounded-lg bg-[#1B1E20] px-3 py-2 text-xs font-semibold text-white transition-colors hover:bg-slate-800"
              >
                <DownloadIcon className="h-3.5 w-3.5" />
                Export
              </button>
              <button
                onClick={onResetDemo}
                className="rounded-lg border border-slate-700 px-3 py-2 text-xs font-medium text-slate-500 transition-colors hover:border-[#FF6A3D]/30 hover:text-[#FF6A3D]"
              >
                Reset
              </button>
            </div>
          </div>

          {/* Notes Row */}
          <div className="mt-3">
            <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-slate-500">
              Notes
            </label>
            <textarea
              value={notes}
              onChange={(e) => handleNotesChange(e.target.value)}
              className="input-field h-16 resize-none"
              placeholder="Coaching notes, reads, adjustments..."
            />
          </div>
        </div>
      )}

      <style jsx>{`
        .input-field {
          width: 100%;
          padding: 0.5rem 0.75rem;
          border-radius: 0.375rem;
          border: 1px solid #1B1E20;
          background: rgba(27, 30, 32, 0.5);
          color: white;
          font-size: 0.8125rem;
          transition: all 0.2s;
        }
        .input-field:focus {
          outline: none;
          border-color: rgba(0, 246, 229, 0.5);
          box-shadow: 0 0 0 2px rgba(0, 246, 229, 0.1);
        }
        .input-field::placeholder {
          color: #64748b;
        }
      `}</style>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// ICONS
// ═══════════════════════════════════════════════════════════════════════════

function DownloadIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3" />
    </svg>
  );
}

function ChevronIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
    </svg>
  );
}

export default PlayMetadata;
