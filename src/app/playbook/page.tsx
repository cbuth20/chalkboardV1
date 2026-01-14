"use client";

import { useState, useEffect, useCallback } from "react";
import PlayerNavbar from "@/components/PlayerNavbar";
import { ToastProvider, useToast } from "@/components/playbook-builder";
import { MetadataPlay } from "@/types/playbook";
import { getPlaybookMetadataApiUrl } from "@/lib/api-config";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";

// ═══════════════════════════════════════════════════════════════════════════
// PLAYBOOK PAGE — Main container component
// ═══════════════════════════════════════════════════════════════════════════

export default function PlaybookPage() {
  return (
    <ProtectedRoute>
      <ToastProvider>
        <PlaybookBuilder />
      </ToastProvider>
    </ProtectedRoute>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// PLAYBOOK BUILDER — Core state management and layout
// ═══════════════════════════════════════════════════════════════════════════

function PlaybookBuilder() {
  const { showToast } = useToast();

  // Core state
  const [plays, setPlays] = useState<MetadataPlay[]>([]);
  const [selectedPlayId, setSelectedPlayId] = useState<string | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Derived: selected play
  const selectedPlay = plays.find((p) => p.id === selectedPlayId) || null;

  // ═══════════════════════════════════════════════════════════════════════════
  // FETCH FROM API ON MOUNT
  // ═══════════════════════════════════════════════════════════════════════════

  useEffect(() => {
    const fetchPlays = async () => {
      try {
        setIsLoading(true);
        const apiUrl = getPlaybookMetadataApiUrl();
        const response = await fetch(apiUrl);

        if (!response.ok) {
          throw new Error('Failed to fetch playbook metadata');
        }

        const data = await response.json();
        setPlays(data);

        // Select first play by default
        if (data.length > 0) {
          setSelectedPlayId(data[0].id);
        }

        setIsLoaded(true);
      } catch (err) {
        console.error("Failed to load playbook:", err);
        showToast("Failed to load playbook metadata.", "error");
        setPlays([]);
        setIsLoaded(true);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPlays();
  }, [showToast]);

  // ═══════════════════════════════════════════════════════════════════════════
  // PLAY LIST HANDLERS
  // ═══════════════════════════════════════════════════════════════════════════

  const handleSelectPlay = useCallback((id: string) => {
    setSelectedPlayId(id);
  }, []);

  const handleDeletePlay = useCallback(
    async (id: string) => {
      if (!confirm("Delete this play? This cannot be undone.")) return;

      try {
        const apiUrl = getPlaybookMetadataApiUrl();
        const response = await fetch(apiUrl, {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id }),
        });

        if (!response.ok) {
          throw new Error('Failed to delete play');
        }

        setPlays((prev) => {
          const newPlays = prev.filter((p) => p.id !== id);
          // If we deleted the selected play, select another
          if (id === selectedPlayId && newPlays.length > 0) {
            setSelectedPlayId(newPlays[0].id);
          }
          return newPlays;
        });

        showToast("Play deleted.", "success");
      } catch (err) {
        console.error("Failed to delete play:", err);
        showToast("Failed to delete play.", "error");
      }
    },
    [selectedPlayId, showToast]
  );

  // ═══════════════════════════════════════════════════════════════════════════
  // METADATA HANDLERS
  // ═══════════════════════════════════════════════════════════════════════════

  const handleUpdateMetadata = useCallback(
    async (updates: Partial<MetadataPlay>) => {
      if (!selectedPlayId) return;

      try {
        const apiUrl = getPlaybookMetadataApiUrl();
        const response = await fetch(apiUrl, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: selectedPlayId,
            formation_name: updates.formation,
            concept_name: updates.concept,
            side_of_ball: updates.side_of_ball,
            content_type: updates.content_type,
            position_relevance: updates.position_relevance,
            level: updates.level,
            custom_notes: updates.custom_notes,
          }),
        });

        if (!response.ok) {
          throw new Error('Failed to update metadata');
        }

        const updatedPlay = await response.json();

        setPlays((prev) =>
          prev.map((p) =>
            p.id === selectedPlayId
              ? { ...p, ...updates, updated_at: updatedPlay.updated_at }
              : p
          )
        );

        showToast("Play updated!", "success");
      } catch (err) {
        console.error("Failed to update metadata:", err);
        showToast("Failed to update play.", "error");
      }
    },
    [selectedPlayId, showToast]
  );

  // ═══════════════════════════════════════════════════════════════════════════
  // LOADING STATE
  // ═══════════════════════════════════════════════════════════════════════════

  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] text-white">
        <PlayerNavbar />
        <div className="flex h-[calc(100vh-64px)] items-center justify-center">
          <div className="flex items-center gap-3">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-[#00F6E5] border-t-transparent" />
            <span className="text-sm text-slate-400">Loading playbook...</span>
          </div>
        </div>
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // MAIN LAYOUT
  // ═══════════════════════════════════════════════════════════════════════════

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white">
      <PlayerNavbar />
      <main className="flex h-[calc(100vh-64px)]">
        {/* Left Sidebar: Play List */}
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

          {/* Play List */}
          <div className="flex-1 overflow-y-auto p-2">
            {plays.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center px-4">
                <p className="text-sm text-slate-500 mb-2">No plays found</p>
                <p className="text-xs text-slate-600">Upload plays with metadata to get started</p>
              </div>
            ) : (
              plays.map((play) => (
                <button
                  key={play.id}
                  onClick={() => handleSelectPlay(play.id)}
                  className={`group mb-1 w-full rounded-lg px-3 py-2.5 text-left transition-all ${
                    play.id === selectedPlayId
                      ? "bg-[#00F6E5]/10 ring-1 ring-[#00F6E5]/30"
                      : "hover:bg-[#1B1E20]/50"
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="min-w-0 flex-1">
                      <p
                        className={`truncate text-sm font-semibold ${
                          play.id === selectedPlayId ? "text-[#00F6E5]" : "text-white"
                        }`}
                      >
                        {play.name || "Untitled Play"}
                      </p>
                      <p className="mt-0.5 truncate text-xs text-slate-500">
                        {play.formation} • {play.concept}
                      </p>
                    </div>
                    {play.id === selectedPlayId && (
                      <div className="ml-2 mt-1 h-2 w-2 shrink-0 rounded-full bg-[#00F6E5]" />
                    )}
                  </div>
                </button>
              ))
            )}
          </div>
        </aside>

        {/* Main Content: Play Details */}
        <div className="flex-1 overflow-y-auto">
          {!selectedPlay ? (
            <div className="flex h-full items-center justify-center">
              <p className="text-sm text-slate-500">Select a play to view details</p>
            </div>
          ) : (
            <div className="p-6">
              {/* Header */}
              <div className="mb-6 flex items-start justify-between">
                <div>
                  <h1 className="text-2xl font-bold text-white">
                    {selectedPlay.name || "Untitled Play"}
                  </h1>
                  <p className="mt-1 text-sm text-slate-400">
                    Created {new Date(selectedPlay.created_at).toLocaleDateString()}
                  </p>
                </div>
                <button
                  onClick={() => handleDeletePlay(selectedPlay.id)}
                  className="flex items-center gap-1.5 rounded-lg bg-red-900/20 px-3 py-2 text-xs font-semibold text-red-400 transition-colors hover:bg-red-900/30"
                >
                  <TrashIcon className="h-4 w-4" />
                  Delete Play
                </button>
              </div>

              {/* Metadata Form */}
              <div className="space-y-4">
                {/* Formation & Concept */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-400">
                      Formation
                    </label>
                    <input
                      type="text"
                      value={selectedPlay.formation}
                      onChange={(e) =>
                        handleUpdateMetadata({ formation: e.target.value })
                      }
                      className="w-full rounded-lg border border-[#1B1E20] bg-[#1B1E20]/50 px-3 py-2 text-sm text-white transition-all focus:border-[#00F6E5]/50 focus:outline-none focus:ring-2 focus:ring-[#00F6E5]/10"
                      placeholder="Formation name..."
                    />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-400">
                      Concept
                    </label>
                    <input
                      type="text"
                      value={selectedPlay.concept}
                      onChange={(e) =>
                        handleUpdateMetadata({ concept: e.target.value })
                      }
                      className="w-full rounded-lg border border-[#1B1E20] bg-[#1B1E20]/50 px-3 py-2 text-sm text-white transition-all focus:border-[#00F6E5]/50 focus:outline-none focus:ring-2 focus:ring-[#00F6E5]/10"
                      placeholder="Concept name..."
                    />
                  </div>
                </div>

                {/* Side of Ball & Content Type */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-400">
                      Side of Ball
                    </label>
                    <select
                      value={selectedPlay.side_of_ball || ""}
                      onChange={(e) =>
                        handleUpdateMetadata({
                          side_of_ball: e.target.value as any,
                        })
                      }
                      className="w-full rounded-lg border border-[#1B1E20] bg-[#1B1E20]/50 px-3 py-2 text-sm text-white transition-all focus:border-[#00F6E5]/50 focus:outline-none focus:ring-2 focus:ring-[#00F6E5]/10"
                    >
                      <option value="">Select...</option>
                      <option value="offense">Offense</option>
                      <option value="defense">Defense</option>
                      <option value="special_teams">Special Teams</option>
                    </select>
                  </div>
                  <div>
                    <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-400">
                      Content Type
                    </label>
                    <select
                      value={selectedPlay.content_type || ""}
                      onChange={(e) =>
                        handleUpdateMetadata({
                          content_type: e.target.value as any,
                        })
                      }
                      className="w-full rounded-lg border border-[#1B1E20] bg-[#1B1E20]/50 px-3 py-2 text-sm text-white transition-all focus:border-[#00F6E5]/50 focus:outline-none focus:ring-2 focus:ring-[#00F6E5]/10"
                    >
                      <option value="">Select...</option>
                      <option value="full_playbook">Full Playbook</option>
                      <option value="single_play">Single Play</option>
                      <option value="formation">Formation</option>
                      <option value="concept">Concept</option>
                      <option value="install_notes">Install Notes</option>
                    </select>
                  </div>
                </div>

                {/* Level */}
                <div>
                  <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-400">
                    Level
                  </label>
                  <select
                    value={selectedPlay.level || ""}
                    onChange={(e) =>
                      handleUpdateMetadata({ level: e.target.value as any })
                    }
                    className="w-full rounded-lg border border-[#1B1E20] bg-[#1B1E20]/50 px-3 py-2 text-sm text-white transition-all focus:border-[#00F6E5]/50 focus:outline-none focus:ring-2 focus:ring-[#00F6E5]/10"
                  >
                    <option value="">Select...</option>
                    <option value="high_school">High School</option>
                    <option value="college">College</option>
                    <option value="pro">Pro</option>
                  </select>
                </div>

                {/* Position Relevance */}
                <div>
                  <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-400">
                    Position Relevance
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {["all", "qb", "rb", "wr", "te", "ol", "dl", "lb", "db", "k"].map(
                      (pos) => {
                        const isSelected =
                          selectedPlay.position_relevance?.includes(pos as any);
                        return (
                          <button
                            key={pos}
                            onClick={() => {
                              const current =
                                selectedPlay.position_relevance || ["all"];
                              const updated = isSelected
                                ? current.filter((p) => p !== pos)
                                : [...current.filter((p) => p !== "all"), pos];
                              handleUpdateMetadata({
                                position_relevance:
                                  updated.length === 0 ? ["all"] : updated,
                              });
                            }}
                            className={`rounded-lg px-3 py-1.5 text-xs font-semibold uppercase transition-all ${
                              isSelected
                                ? "bg-[#00F6E5]/10 text-[#00F6E5] ring-1 ring-[#00F6E5]/30"
                                : "bg-[#1B1E20]/50 text-slate-400 hover:bg-[#1B1E20]"
                            }`}
                          >
                            {pos}
                          </button>
                        );
                      }
                    )}
                  </div>
                </div>

                {/* Custom Notes */}
                <div>
                  <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-400">
                    Custom Notes
                  </label>
                  <textarea
                    value={selectedPlay.custom_notes || ""}
                    onChange={(e) =>
                      handleUpdateMetadata({ custom_notes: e.target.value })
                    }
                    rows={4}
                    className="w-full resize-none rounded-lg border border-[#1B1E20] bg-[#1B1E20]/50 px-3 py-2 text-sm text-white transition-all focus:border-[#00F6E5]/50 focus:outline-none focus:ring-2 focus:ring-[#00F6E5]/10"
                    placeholder="Add any coaching notes, reads, or adjustments..."
                  />
                </div>

                {/* File Paths */}
                <div>
                  <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-400">
                    Associated Files ({selectedPlay.file_paths?.length || 0})
                  </label>
                  <div className="space-y-2">
                    {selectedPlay.file_paths?.map((path, idx) => (
                      <div
                        key={idx}
                        className="rounded-lg border border-[#1B1E20] bg-[#1B1E20]/30 px-3 py-2"
                      >
                        <a
                          href={path}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-[#00F6E5] hover:underline"
                        >
                          {path.split("/").pop()}
                        </a>
                      </div>
                    )) || (
                      <p className="text-xs text-slate-500">No files associated</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// ICONS
// ═══════════════════════════════════════════════════════════════════════════

function TrashIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
    </svg>
  );
}
