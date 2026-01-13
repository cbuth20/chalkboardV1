"use client";

// ═══════════════════════════════════════════════════════════════════════════
// COACH NOTES — Coaching Notes & Insights
// AI-generated and user-added coaching points
// ═══════════════════════════════════════════════════════════════════════════

import { useState } from 'react';
import type { FilmClip } from '../types';

interface CoachNotesProps {
  clip: FilmClip;
}

export function CoachNotes({ clip }: CoachNotesProps) {
  const [newNote, setNewNote] = useState('');
  const [notes, setNotes] = useState<{ id: string; text: string; isAI: boolean; timestamp: Date }[]>([
    // Pre-populate with AI coaching notes if available
    ...(clip.aiAnalysis?.coachingNotes?.map((note, idx) => ({
      id: `ai-${idx}`,
      text: note,
      isAI: true,
      timestamp: new Date(),
    })) || []),
  ]);

  const handleAddNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNote.trim()) return;

    setNotes([
      ...notes,
      {
        id: `user-${Date.now()}`,
        text: newNote.trim(),
        isAI: false,
        timestamp: new Date(),
      },
    ]);
    setNewNote('');
  };

  const handleDeleteNote = (id: string) => {
    setNotes(notes.filter((n) => n.id !== id));
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex-shrink-0 px-4 py-3 border-b border-[#1B1E20]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <NotesIcon className="h-5 w-5 text-[#F5C253]" />
            <h3 className="text-sm font-bold uppercase tracking-wider text-white">
              Coaching Notes
            </h3>
          </div>
          <span className="text-xs text-slate-500">
            {notes.length} notes
          </span>
        </div>
      </div>

      {/* Notes List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {notes.length === 0 ? (
          <div className="text-center py-8">
            <PenIcon className="h-10 w-10 text-slate-700 mx-auto mb-3" />
            <p className="text-sm text-slate-500 mb-2">No coaching notes yet</p>
            <p className="text-xs text-slate-600">
              Add your own notes or run AI analysis to get suggestions
            </p>
          </div>
        ) : (
          notes.map((note) => (
            <div
              key={note.id}
              className={`relative group p-3 rounded-lg border ${
                note.isAI
                  ? 'bg-[#F5C253]/5 border-[#F5C253]/20'
                  : 'bg-[#1B1E20] border-[#1B1E20]'
              }`}
            >
              {/* AI Badge */}
              {note.isAI && (
                <div className="flex items-center gap-1.5 mb-2">
                  <AIIcon className="h-3.5 w-3.5 text-[#F5C253]" />
                  <span className="text-[10px] font-semibold uppercase tracking-widest text-[#F5C253]">
                    AI Generated
                  </span>
                </div>
              )}

              {/* Note Text */}
              <p className="text-sm text-slate-300 leading-relaxed pr-8">
                {note.text}
              </p>

              {/* Delete Button */}
              <button
                onClick={() => handleDeleteNote(note.id)}
                className="absolute top-3 right-3 h-6 w-6 flex items-center justify-center rounded opacity-0 group-hover:opacity-100 text-slate-500 hover:text-[#FF6A3D] hover:bg-[#FF6A3D]/10 transition-all"
              >
                <TrashIcon className="h-3.5 w-3.5" />
              </button>
            </div>
          ))
        )}
      </div>

      {/* Quick Notes */}
      <div className="flex-shrink-0 px-4 pb-3">
        <span className="text-[10px] font-semibold uppercase tracking-widest text-slate-500 mb-2 block">
          Quick Notes
        </span>
        <div className="flex flex-wrap gap-2">
          {[
            '✅ Good execution',
            '⚠️ Assignment issue',
            '🔁 Rep again',
            '⭐ Film this',
          ].map((quickNote) => (
            <button
              key={quickNote}
              onClick={() =>
                setNotes([
                  ...notes,
                  {
                    id: `quick-${Date.now()}`,
                    text: quickNote,
                    isAI: false,
                    timestamp: new Date(),
                  },
                ])
              }
              className="px-2.5 py-1.5 rounded-lg bg-[#1B1E20] text-xs text-slate-400 hover:bg-[#00F6E5]/15 hover:text-[#00F6E5] transition-colors"
            >
              {quickNote}
            </button>
          ))}
        </div>
      </div>

      {/* Add Note Form */}
      <form onSubmit={handleAddNote} className="flex-shrink-0 p-4 border-t border-[#1B1E20]">
        <div className="flex gap-2">
          <input
            type="text"
            value={newNote}
            onChange={(e) => setNewNote(e.target.value)}
            placeholder="Add a coaching note..."
            className="flex-1 px-4 py-2.5 rounded-lg bg-[#1B1E20] border border-transparent text-sm text-white placeholder-slate-500 focus:outline-none focus:border-[#00F6E5]/30"
          />
          <button
            type="submit"
            disabled={!newNote.trim()}
            className="px-4 py-2.5 rounded-lg bg-[#F5C253] text-[#0A0A0A] font-semibold text-sm disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:shadow-lg hover:shadow-[#F5C253]/30"
          >
            <PlusIcon className="h-4 w-4" />
          </button>
        </div>
      </form>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// ICONS
// ═══════════════════════════════════════════════════════════════════════════

function NotesIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="16" y1="13" x2="8" y2="13" />
      <line x1="16" y1="17" x2="8" y2="17" />
    </svg>
  );
}

function PenIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
      <path d="M12 19l7-7 3 3-7 7-3-3z" />
      <path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z" />
      <path d="M2 2l7.586 7.586" />
      <circle cx="11" cy="11" r="2" />
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

function TrashIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
    </svg>
  );
}

function PlusIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  );
}

export default CoachNotes;








