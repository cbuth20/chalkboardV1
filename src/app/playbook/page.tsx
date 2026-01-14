"use client";

import { useState, useEffect, useCallback } from "react";
import PlayerNavbar from "@/components/PlayerNavbar";
import { ToastProvider, useToast } from "@/components/playbook-builder";
import { MetadataPlay } from "@/types/playbook";
import { getPlaybookMetadataApiUrl, getGenerateInsightsApiUrl } from "@/lib/api-config";
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
  const [aiInsights, setAiInsights] = useState<string | null>(null);
  const [isGeneratingInsights, setIsGeneratingInsights] = useState(false);
  const [insightsCache, setInsightsCache] = useState<Map<string, string>>(new Map());

  // Derived: selected play
  const selectedPlay = plays.find((p) => p.id === selectedPlayId) || null;

  // ═══════════════════════════════════════════════════════════════════════════
  // LOAD INSIGHTS CACHE FROM LOCALSTORAGE
  // ═══════════════════════════════════════════════════════════════════════════

  useEffect(() => {
    try {
      const stored = localStorage.getItem('playbook_insights_cache');
      if (stored) {
        const data = JSON.parse(stored);
        const cacheMap = new Map<string, string>(Object.entries(data.insights || {}));
        setInsightsCache(cacheMap);
        console.log(`Loaded ${cacheMap.size} cached insights`);
      }
    } catch (error) {
      console.error('Failed to load insights cache:', error);
    }
  }, []);

  // ═══════════════════════════════════════════════════════════════════════════
  // SAVE INSIGHTS CACHE TO LOCALSTORAGE
  // ═══════════════════════════════════════════════════════════════════════════

  useEffect(() => {
    if (insightsCache.size > 0) {
      try {
        const cacheObject: Record<string, string> = {};
        insightsCache.forEach((insights, playId) => {
          cacheObject[playId] = insights;
        });
        const data = {
          insights: cacheObject,
          lastUpdated: new Date().toISOString(),
        };
        localStorage.setItem('playbook_insights_cache', JSON.stringify(data));
      } catch (error) {
        console.error('Failed to save insights cache:', error);
      }
    }
  }, [insightsCache]);

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
  // AI INSIGHTS GENERATION
  // ═══════════════════════════════════════════════════════════════════════════

  const generateAIInsights = useCallback(async (play: MetadataPlay, forceRegenerate = false) => {
    // Check cache first (unless forcing regenerate)
    if (!forceRegenerate && insightsCache.has(play.id)) {
      const cached = insightsCache.get(play.id);
      console.log(`Using cached insights for ${play.name}`);
      setAiInsights(cached || null);
      return;
    }

    setIsGeneratingInsights(true);
    setAiInsights(null);

    try {
      const apiUrl = getGenerateInsightsApiUrl();
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          metadata: {
            formation: play.formation,
            concept: play.concept,
            side_of_ball: play.side_of_ball,
            content_type: play.content_type,
            level: play.level,
            position_relevance: play.position_relevance,
            custom_notes: play.custom_notes,
          },
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate insights');
      }

      const data = await response.json();
      setAiInsights(data.insights);

      // Store in cache
      setInsightsCache(prev => {
        const newCache = new Map(prev);
        newCache.set(play.id, data.insights);
        return newCache;
      });
    } catch (err) {
      console.error('Failed to generate AI insights:', err);
      showToast('Failed to generate AI insights', 'error');
      setAiInsights('Failed to generate insights. Please try again.');
    } finally {
      setIsGeneratingInsights(false);
    }
  }, [showToast, insightsCache]);

  // ═══════════════════════════════════════════════════════════════════════════
  // PLAY LIST HANDLERS
  // ═══════════════════════════════════════════════════════════════════════════

  const handleSelectPlay = useCallback((id: string) => {
    setSelectedPlayId(id);
    const play = plays.find((p) => p.id === id);
    if (play) {
      // Check cache first
      if (insightsCache.has(play.id)) {
        const cached = insightsCache.get(play.id);
        console.log(`Loading cached insights for ${play.name}`);
        setAiInsights(cached || null);
      } else {
        // Generate if not cached
        generateAIInsights(play);
      }
    }
  }, [plays, insightsCache, generateAIInsights]);

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

        {/* Main Content: AI Insights */}
        <div className="flex-1 overflow-y-auto">
          {!selectedPlay ? (
            <div className="flex h-full items-center justify-center">
              <div className="text-center">
                <svg className="mx-auto h-16 w-16 mb-4 text-slate-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <p className="text-sm text-slate-500">Select a play to view AI-generated insights</p>
              </div>
            </div>
          ) : (
            <div className="p-8 max-w-4xl mx-auto">
              {/* Header */}
              <div className="mb-8">
                <h1 className="text-3xl font-bold text-white mb-2">
                  {selectedPlay.name || "Untitled Play"}
                </h1>
                <div className="flex items-center gap-4 text-sm text-slate-400">
                  <span>{selectedPlay.formation}</span>
                  <span>•</span>
                  <span>{selectedPlay.concept}</span>
                  {selectedPlay.side_of_ball && (
                    <>
                      <span>•</span>
                      <span className="capitalize">{selectedPlay.side_of_ball}</span>
                    </>
                  )}
                </div>
              </div>

              {/* AI Insights Section */}
              <div className="bg-gradient-to-br from-[#151a1e] to-[#0f1215] border border-[#1B1E20] rounded-2xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-[#00F6E5]/10 flex items-center justify-center">
                      <svg className="w-5 h-5 text-[#00F6E5]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                    </div>
                    <div>
                      <h2 className="text-lg font-bold text-white">AI Coaching Insights</h2>
                      <p className="text-xs text-slate-500">Generated from play metadata</p>
                    </div>
                  </div>
                  <button
                    onClick={() => selectedPlay && generateAIInsights(selectedPlay, true)}
                    disabled={isGeneratingInsights}
                    className="flex items-center gap-2 rounded-lg bg-[#00F6E5]/10 border border-[#00F6E5]/30 px-3 py-2 text-sm font-semibold text-[#00F6E5] transition-all hover:bg-[#00F6E5]/20 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      <path d="M9 10h.01M15 10h.01M9.5 15a3.5 3.5 0 005 0" />
                    </svg>
                    Regenerate
                  </button>
                </div>

                {/* Loading State */}
                {isGeneratingInsights && (
                  <div className="flex items-center justify-center py-12">
                    <div className="text-center">
                      <div className="h-8 w-8 mx-auto mb-3 animate-spin rounded-full border-2 border-[#00F6E5] border-t-transparent" />
                      <p className="text-sm text-slate-400">Generating insights...</p>
                    </div>
                  </div>
                )}

                {/* AI Insights Content */}
                {!isGeneratingInsights && aiInsights && (
                  <div className="prose prose-invert prose-sm max-w-none">
                    <div className="text-slate-300 whitespace-pre-wrap leading-relaxed">
                      {aiInsights}
                    </div>
                  </div>
                )}

                {/* No Insights Yet */}
                {!isGeneratingInsights && !aiInsights && (
                  <div className="py-8 text-center text-slate-500">
                    <p className="text-sm">Click on a play to generate AI insights</p>
                  </div>
                )}
              </div>

              {/* Play Metadata Card */}
              <div className="mt-6 bg-[#0d1117] border border-[#1B1E20] rounded-xl p-6">
                <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 mb-4">
                  Play Metadata
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {selectedPlay.level && (
                    <div>
                      <div className="text-xs text-slate-500 mb-1">Level</div>
                      <div className="text-sm text-white capitalize">{selectedPlay.level.replace('_', ' ')}</div>
                    </div>
                  )}
                  {selectedPlay.content_type && (
                    <div>
                      <div className="text-xs text-slate-500 mb-1">Type</div>
                      <div className="text-sm text-white capitalize">{selectedPlay.content_type.replace('_', ' ')}</div>
                    </div>
                  )}
                  {selectedPlay.position_relevance && selectedPlay.position_relevance.length > 0 && (
                    <div>
                      <div className="text-xs text-slate-500 mb-1">Positions</div>
                      <div className="text-sm text-white uppercase">{selectedPlay.position_relevance.join(', ')}</div>
                    </div>
                  )}
                </div>
                {selectedPlay.custom_notes && (
                  <div className="mt-4 pt-4 border-t border-[#1B1E20]">
                    <div className="text-xs text-slate-500 mb-1">Notes</div>
                    <div className="text-sm text-slate-300">{selectedPlay.custom_notes}</div>
                  </div>
                )}
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
