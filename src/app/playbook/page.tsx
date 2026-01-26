"use client";

import { useState, useEffect, useCallback } from "react";
import { SidebarLayout } from "@/components/SidebarLayout";
import { ToastProvider, useToast } from "@/components/playbook-builder";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { useAuth } from "@/contexts/AuthContext";
import { usePlays } from "@/hooks/usePlaysAPI";

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
  const { orgId, loading: authLoading } = useAuth();

  // Core state
  const [selectedPlayId, setSelectedPlayId] = useState<string | null>(null);

  // Fetch approved plays using new API
  const { plays, loading: playsLoading, error: playsError } = usePlays({
    status: 'approved'
  });

  // Derived: selected play
  const selectedPlay = plays.find((p) => p.id === selectedPlayId) || null;

  // Auto-select first play when plays load
  useEffect(() => {
    if (!playsLoading && plays.length > 0 && !selectedPlayId) {
      setSelectedPlayId(plays[0].id);
    }
  }, [plays, playsLoading, selectedPlayId]);

  // Show error toast if fetching fails
  useEffect(() => {
    if (playsError) {
      showToast(playsError || "Failed to load playbook. Please try again.", "error");
    }
  }, [playsError, showToast]);

  // ═══════════════════════════════════════════════════════════════════════════
  // PLAY LIST HANDLERS
  // ═══════════════════════════════════════════════════════════════════════════

  const handleSelectPlay = useCallback((id: string) => {
    setSelectedPlayId(id);
  }, []);

  // ═══════════════════════════════════════════════════════════════════════════
  // LOADING STATE
  // ═══════════════════════════════════════════════════════════════════════════

  if (authLoading || playsLoading) {
    return (
      <SidebarLayout>
        <div className="flex h-screen items-center justify-center">
          <div className="flex items-center gap-3">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-[#00F6E5] border-t-transparent" />
            <span className="text-sm text-slate-400">Loading playbook...</span>
          </div>
        </div>
      </SidebarLayout>
    );
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // MAIN LAYOUT
  // ═══════════════════════════════════════════════════════════════════════════

  return (
    <SidebarLayout>
      <main className="flex h-screen text-white">
        {/* Left Sidebar: Play List */}
        <aside className="flex w-72 flex-col border-r border-[#1B1E20] bg-[#0A0A0A]">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-[#1B1E20] px-4 py-3">
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400">
              Approved Plays
            </h2>
            <span className="rounded bg-[#1B1E20] px-2 py-0.5 text-xs font-medium text-slate-500">
              {plays.length}
            </span>
          </div>

          {/* Play List */}
          <div className="flex-1 overflow-y-auto p-2">
            {plays.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center px-4">
                <svg className="mx-auto h-12 w-12 mb-3 text-slate-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <p className="text-sm text-slate-500 mb-2">No approved plays yet</p>
                <p className="text-xs text-slate-600">Ask your coach to upload and approve plays</p>
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
                        {play.formationName || "Unknown"} • {play.concept || "Unknown"}
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

        {/* Main Content: AI Insights */}
        <div className="flex-1 overflow-y-auto">
          {!selectedPlay ? (
            <div className="flex h-full items-center justify-center">
              <div className="text-center">
                <svg className="mx-auto h-16 w-16 mb-4 text-slate-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <p className="text-sm text-slate-500">Select a play to view coach-approved insights</p>
              </div>
            </div>
          ) : (
            <div className="p-8 max-w-4xl mx-auto">
              {/* Header */}
              <div className="mb-8">
                <div className="flex items-center gap-2 mb-2">
                  <h1 className="text-3xl font-bold text-white">
                    {selectedPlay.name || "Untitled Play"}
                  </h1>
                  <span className="px-2 py-1 text-xs font-semibold bg-green-900/20 text-green-400 border border-green-500/30 rounded">
                    ✓ APPROVED
                  </span>
                </div>
                <div className="flex items-center gap-4 text-sm text-slate-400">
                  <span>{selectedPlay.formationName || 'Unknown Formation'}</span>
                  <span>•</span>
                  <span>{selectedPlay.concept || 'Unknown Concept'}</span>
                  {selectedPlay.metadata?.side_of_ball && (
                    <>
                      <span>•</span>
                      <span className="capitalize">{selectedPlay.metadata.side_of_ball}</span>
                    </>
                  )}
                </div>
              </div>

              {/* AI Insights Section */}
              <div className="bg-gradient-to-br from-[#151a1e] to-[#0f1215] border border-[#1B1E20] rounded-2xl p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-full bg-[#00F6E5]/10 flex items-center justify-center">
                    <svg className="w-5 h-5 text-[#00F6E5]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-white">Coach-Approved Insights</h2>
                    <p className="text-xs text-slate-500">AI-generated and reviewed by your coach</p>
                  </div>
                </div>

                {/* AI Insights Content */}
                {selectedPlay.aiInsights ? (
                  <div className="prose prose-invert prose-sm max-w-none">
                    <div className="text-slate-300 whitespace-pre-wrap leading-relaxed">
                      {selectedPlay.aiInsights}
                    </div>
                  </div>
                ) : (
                  <div className="py-8 text-center text-slate-500">
                    <p className="text-sm">No insights available for this play</p>
                    <p className="text-xs mt-1">Ask your coach to generate insights</p>
                  </div>
                )}
              </div>

              {/* Play Metadata Card */}
              {selectedPlay.metadata && (
                <div className="mt-6 bg-[#0d1117] border border-[#1B1E20] rounded-xl p-6">
                  <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 mb-4">
                    Play Metadata
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {selectedPlay.metadata.level && (
                      <div>
                        <div className="text-xs text-slate-500 mb-1">Level</div>
                        <div className="text-sm text-white capitalize">
                          {selectedPlay.metadata.level.replace('_', ' ')}
                        </div>
                      </div>
                    )}
                    {selectedPlay.metadata.content_type && (
                      <div>
                        <div className="text-xs text-slate-500 mb-1">Type</div>
                        <div className="text-sm text-white capitalize">
                          {selectedPlay.metadata.content_type.replace('_', ' ')}
                        </div>
                      </div>
                    )}
                    {selectedPlay.metadata.position_relevance &&
                     selectedPlay.metadata.position_relevance.length > 0 && (
                      <div>
                        <div className="text-xs text-slate-500 mb-1">Positions</div>
                        <div className="text-sm text-white uppercase">
                          {selectedPlay.metadata.position_relevance.join(', ')}
                        </div>
                      </div>
                    )}
                  </div>
                  {selectedPlay.metadata.custom_notes && (
                    <div className="mt-4 pt-4 border-t border-[#1B1E20]">
                      <div className="text-xs text-slate-500 mb-1">Coach Notes</div>
                      <div className="text-sm text-slate-300">{selectedPlay.metadata.custom_notes}</div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </main>
    </SidebarLayout>
  );
}
