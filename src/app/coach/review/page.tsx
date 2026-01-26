"use client";

import React, { useState } from 'react';
import { SidebarLayout } from '@/components/SidebarLayout';
import { useAuth } from '@/contexts/AuthContext';
import { usePlays, useUpdatePlayStatus } from '@/hooks/usePlaysAPI';
import { useFlashcards } from '@/hooks/useFlashcardsAPI';

export default function PlayReviewPage() {
  const { orgId, userRole, loading: authLoading } = useAuth();
  const { plays, loading, error, refetch } = usePlays({ status: 'draft' });
  const { updateStatus, loading: updating } = useUpdatePlayStatus();

  const [selectedPlayId, setSelectedPlayId] = useState<string | null>(null);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({});
  const [reviewNotes, setReviewNotes] = useState<Record<string, string>>({});

  const selectedPlay = plays.find(p => p.id === selectedPlayId);

  // Fetch flashcards for selected play
  const { flashcards } = useFlashcards(
    selectedPlayId ? { playId: selectedPlayId } : undefined
  );

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const handleApprove = async (playId: string) => {
    const notes = reviewNotes[playId] || '';
    if (!confirm(`Approve and publish this play?\n\n${notes ? `Notes: ${notes}\n\n` : ''}This will make it visible to players.`)) {
      return;
    }

    try {
      await updateStatus(playId, {
        contentStatus: 'approved',
        isPublished: true,
      });
      alert('Play approved and published successfully!');
      refetch();
      setSelectedPlayId(null);
      setReviewNotes(prev => {
        const updated = { ...prev };
        delete updated[playId];
        return updated;
      });
    } catch (err) {
      console.error('[Review] Error approving play:', err);
      alert('Failed to approve play. Please try again.');
    }
  };

  const handleReject = async (playId: string) => {
    const notes = reviewNotes[playId] || '';
    if (!notes.trim()) {
      alert('Please provide a reason for rejection in the notes field.');
      return;
    }

    if (!confirm(`Reject this play?\n\nReason: ${notes}\n\nThe play will remain as draft and can be regenerated.`)) {
      return;
    }

    try {
      await updateStatus(playId, {
        contentStatus: 'rejected',
      });
      alert('Play rejected. It will remain in drafts for regeneration.');
      refetch();
      setSelectedPlayId(null);
      setReviewNotes(prev => {
        const updated = { ...prev };
        delete updated[playId];
        return updated;
      });
    } catch (err) {
      console.error('[Review] Error rejecting play:', err);
      alert('Failed to reject play. Please try again.');
    }
  };

  if (authLoading || loading) {
    return (
      <SidebarLayout>
        <div className="flex items-center justify-center h-screen">
          <div className="text-center">
            <div className="h-12 w-12 mx-auto mb-4 animate-spin rounded-full border-4 border-[#00F6E5]/20 border-t-[#00F6E5]" />
            <p className="text-slate-400">Loading plays for review...</p>
          </div>
        </div>
      </SidebarLayout>
    );
  }

  if (!orgId) {
    return (
      <SidebarLayout>
        <div className="flex items-center justify-center h-screen">
          <div className="text-center max-w-md">
            <div className="text-red-400 text-5xl mb-4">⚠️</div>
            <h2 className="text-xl font-bold text-white mb-2">Authentication Issue</h2>
            <p className="text-slate-400 mb-4">
              No organization found. Please sign in.
            </p>
          </div>
        </div>
      </SidebarLayout>
    );
  }

  if (error) {
    return (
      <SidebarLayout>
        <div className="flex items-center justify-center h-screen">
          <div className="text-center max-w-md">
            <div className="text-red-400 text-5xl mb-4">❌</div>
            <h2 className="text-xl font-bold text-white mb-2">Error Loading Plays</h2>
            <p className="text-slate-400 mb-4">{error}</p>
            <button
              onClick={() => refetch()}
              className="px-4 py-2 bg-[#00F6E5] text-black font-semibold rounded-lg hover:bg-[#00F6E5]/90"
            >
              Try Again
            </button>
          </div>
        </div>
      </SidebarLayout>
    );
  }

  return (
    <SidebarLayout>
      <main className="h-screen overflow-hidden flex flex-col">
        {/* Header */}
        <header className="px-4 py-6 lg:px-8 border-b border-[#1B1E20]">
          <div className="max-w-[1400px] mx-auto">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h1 className="text-3xl font-black tracking-tight text-white lg:text-4xl mb-2">
                  Play Review Dashboard
                </h1>
                <p className="text-slate-400">
                  Review AI-generated plays before publishing to your team
                </p>
              </div>
              {plays.length > 0 && (
                <div className="flex items-center gap-3">
                  <span className="px-4 py-2 rounded-lg bg-amber-900/20 text-amber-400 text-sm font-semibold">
                    {plays.length} Pending Review
                  </span>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Content */}
        <div className="flex-1 overflow-hidden flex">
          {plays.length === 0 ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center max-w-md px-4">
                <div className="h-16 w-16 mx-auto mb-4 rounded-full bg-[#1B1E20] flex items-center justify-center">
                  <CheckIcon className="h-8 w-8 text-[#00F6E5]" />
                </div>
                <h2 className="text-xl font-bold text-white mb-2">All Caught Up!</h2>
                <p className="text-slate-400 mb-4">
                  No plays are currently pending review. New plays will appear here after AI generation.
                </p>
              </div>
            </div>
          ) : (
            <>
              {/* Plays List Sidebar */}
              <aside className="w-80 border-r border-[#1B1E20] overflow-y-auto">
                <div className="p-4 space-y-2">
                  {plays.map((play) => (
                    <button
                      key={play.id}
                      onClick={() => setSelectedPlayId(play.id)}
                      className={`w-full text-left p-4 rounded-lg transition-all ${
                        selectedPlayId === play.id
                          ? 'bg-[#00F6E5]/10 ring-1 ring-[#00F6E5]/30'
                          : 'bg-[#1B1E20]/50 hover:bg-[#1B1E20]'
                      }`}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <h3 className={`font-semibold ${
                          selectedPlayId === play.id ? 'text-[#00F6E5]' : 'text-white'
                        }`}>
                          {play.name}
                        </h3>
                        <span className="px-2 py-0.5 text-xs rounded bg-amber-900/20 text-amber-400 font-semibold">
                          DRAFT
                        </span>
                      </div>
                      <div className="space-y-1">
                        <p className="text-xs text-slate-400">
                          <span className="font-medium">Formation:</span> {play.formationName || 'N/A'}
                        </p>
                        <p className="text-xs text-slate-400">
                          <span className="font-medium">Type:</span>{' '}
                          <span className={`inline-flex px-1.5 py-0.5 text-[10px] font-semibold rounded ${
                            play.playType === 'PASS' ? 'bg-blue-900/20 text-blue-400' :
                            play.playType === 'RUN' ? 'bg-green-900/20 text-green-400' :
                            'bg-slate-700/20 text-slate-400'
                          }`}>
                            {play.playType}
                          </span>
                        </p>
                        <p className="text-xs text-slate-500">
                          Created {new Date(play.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              </aside>

              {/* Detail View */}
              <div className="flex-1 overflow-y-auto">
                {!selectedPlay ? (
                  <div className="flex items-center justify-center h-full">
                    <p className="text-slate-500">Select a play to review</p>
                  </div>
                ) : (
                  <div className="max-w-[1000px] mx-auto p-6 space-y-6">
                    {/* Play Header */}
                    <div className="glass-card p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <h2 className="text-2xl font-bold text-white mb-2">{selectedPlay.name}</h2>
                          {selectedPlay.shortName && (
                            <p className="text-sm text-slate-400">Short name: {selectedPlay.shortName}</p>
                          )}
                        </div>
                        <span className={`inline-flex px-3 py-1.5 text-sm font-semibold rounded ${
                          selectedPlay.playType === 'PASS' ? 'bg-blue-900/20 text-blue-400' :
                          selectedPlay.playType === 'RUN' ? 'bg-green-900/20 text-green-400' :
                          selectedPlay.playType === 'RPO' ? 'bg-purple-900/20 text-purple-400' :
                          'bg-slate-700/20 text-slate-400'
                        }`}>
                          {selectedPlay.playType}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-slate-400">Formation:</span>
                          <span className="ml-2 text-white font-medium">
                            {selectedPlay.formationName || 'N/A'}
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-400">Concept:</span>
                          <span className="ml-2 text-white font-medium">
                            {selectedPlay.concept || 'N/A'}
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-400">Created:</span>
                          <span className="ml-2 text-white">
                            {new Date(selectedPlay.createdAt).toLocaleString()}
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-400">Status:</span>
                          <span className="ml-2">
                            <span className="px-2 py-1 text-xs rounded bg-amber-900/20 text-amber-400 font-semibold">
                              {selectedPlay.contentStatus.toUpperCase()}
                            </span>
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* AI Insights */}
                    {selectedPlay.aiInsights && (
                      <div className="glass-card">
                        <button
                          onClick={() => toggleSection('insights')}
                          className="w-full px-6 py-4 flex items-center justify-between hover:bg-white/5 transition-colors"
                        >
                          <h3 className="text-lg font-bold text-white flex items-center gap-2">
                            <SparklesIcon className="h-5 w-5 text-[#00F6E5]" />
                            AI-Generated Insights
                          </h3>
                          <ChevronIcon className={`h-5 w-5 text-slate-400 transition-transform ${
                            expandedSections['insights'] ? 'rotate-180' : ''
                          }`} />
                        </button>
                        {expandedSections['insights'] && (
                          <div className="px-6 pb-6">
                            <div className="prose prose-invert max-w-none">
                              <pre className="whitespace-pre-wrap text-sm text-slate-300 bg-[#0A0F12] p-4 rounded-lg">
                                {selectedPlay.aiInsights}
                              </pre>
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Flashcards */}
                    <div className="glass-card">
                      <button
                        onClick={() => toggleSection('flashcards')}
                        className="w-full px-6 py-4 flex items-center justify-between hover:bg-white/5 transition-colors"
                      >
                        <h3 className="text-lg font-bold text-white flex items-center gap-2">
                          <CardIcon className="h-5 w-5 text-[#00F6E5]" />
                          Generated Flashcards
                          <span className="ml-2 px-2 py-0.5 text-xs rounded bg-[#00F6E5]/10 text-[#00F6E5]">
                            {flashcards.length}
                          </span>
                        </h3>
                        <ChevronIcon className={`h-5 w-5 text-slate-400 transition-transform ${
                          expandedSections['flashcards'] ? 'rotate-180' : ''
                        }`} />
                      </button>
                      {expandedSections['flashcards'] && (
                        <div className="px-6 pb-6 space-y-3">
                          {flashcards.length === 0 ? (
                            <p className="text-sm text-slate-500 text-center py-4">
                              No flashcards generated yet
                            </p>
                          ) : (
                            flashcards.map((card, index) => (
                              <div key={card.id} className="p-4 rounded-lg bg-[#0A0F12] border border-[#1B1E20]">
                                <div className="flex items-start justify-between mb-2">
                                  <span className="text-xs font-semibold text-slate-400 uppercase">
                                    Question {index + 1}
                                  </span>
                                  <div className="flex gap-2">
                                    <span className={`px-2 py-0.5 text-xs rounded font-semibold ${
                                      card.difficulty === 'beginner' ? 'bg-green-900/20 text-green-400' :
                                      card.difficulty === 'intermediate' ? 'bg-amber-900/20 text-amber-400' :
                                      'bg-red-900/20 text-red-400'
                                    }`}>
                                      {card.difficulty}
                                    </span>
                                    <span className="px-2 py-0.5 text-xs rounded bg-[#1B1E20] text-slate-400">
                                      {card.position}
                                    </span>
                                  </div>
                                </div>
                                <p className="text-sm text-white mb-2">{card.questionPrompt}</p>
                                <p className="text-sm text-[#00F6E5]">
                                  <span className="text-slate-500">Answer:</span> {card.correctAnswer}
                                </p>
                                {card.category && (
                                  <p className="text-xs text-slate-500 mt-2">
                                    Category: {card.category}
                                  </p>
                                )}
                              </div>
                            ))
                          )}
                        </div>
                      )}
                    </div>

                    {/* Review Notes */}
                    <div className="glass-card p-6">
                      <label className="block text-sm font-semibold text-slate-400 uppercase tracking-wider mb-3">
                        Review Notes
                      </label>
                      <textarea
                        value={reviewNotes[selectedPlay.id] || ''}
                        onChange={(e) => setReviewNotes(prev => ({
                          ...prev,
                          [selectedPlay.id]: e.target.value
                        }))}
                        rows={4}
                        className="w-full px-4 py-3 rounded-lg bg-[#1B1E20] border border-[#2A2E30] text-white placeholder-slate-500 focus:border-[#00F6E5] focus:outline-none resize-none"
                        placeholder="Add notes about this play (required for rejection)..."
                      />
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-4 sticky bottom-0 bg-[#0A0F12] py-4">
                      <button
                        onClick={() => handleApprove(selectedPlay.id)}
                        disabled={updating}
                        className="flex-1 flex items-center justify-center gap-2 px-6 py-3 rounded-lg bg-[#00F6E5] text-black font-bold hover:bg-[#3DF3FF] transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_20px_rgba(0,246,229,0.3)]"
                      >
                        <CheckIcon className="h-5 w-5" />
                        Approve & Publish
                      </button>
                      <button
                        onClick={() => handleReject(selectedPlay.id)}
                        disabled={updating}
                        className="flex-1 flex items-center justify-center gap-2 px-6 py-3 rounded-lg bg-red-900/20 text-red-400 font-bold hover:bg-red-900/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <XIcon className="h-5 w-5" />
                        Reject
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </main>
    </SidebarLayout>
  );
}

// Icon Components
function CheckIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
    </svg>
  );
}

function XIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
  );
}

function SparklesIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM16.894 20.567L16.5 22.5l-.394-1.933a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423L16.5 15l.394 1.933a2.25 2.25 0 001.423 1.423l1.933.394-1.933.394a2.25 2.25 0 00-1.423 1.423z" />
    </svg>
  );
}

function CardIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <rect x="3" y="7" width="18" height="13" rx="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M8 7V5a2 2 0 012-2h4a2 2 0 012 2v2" strokeLinecap="round" strokeLinejoin="round" />
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
