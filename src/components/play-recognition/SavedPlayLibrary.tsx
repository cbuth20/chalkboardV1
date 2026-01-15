import React, { useState, useEffect } from 'react';
import {
  getPlaybooksApiUrl,
  getPlaybookMetadataApiUrl,
  getGeneratePlayContentApiUrl,
  getReviewPlayContentApiUrl,
} from '@/lib/api-config';
import { PlaybookMetadataInput } from '@/types/playbook-metadata';
import PlayContentReviewModal from './PlayContentReviewModal';

interface Play {
  id: string;
  name: string;
  fileName: string;
  type: string;
  uploadedAt: string;
  tags: string[];
  playType: string;
  url: string;
  metadata?: PlaybookMetadataInput & { id: string };
}

interface SavedPlayLibraryProps {
  onSelectPlay: (url: string, fileName: string, type: 'pdf' | 'image') => void;
  onNewScan: () => void;
}

export const SavedPlayLibrary: React.FC<SavedPlayLibraryProps> = ({ onSelectPlay, onNewScan }) => {
  const [plays, setPlays] = useState<Play[]>([]);
  const [selectedPlayId, setSelectedPlayId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [updateSuccess, setUpdateSuccess] = useState(false);
  const [generatedContent, setGeneratedContent] = useState<any>(null);
  const [showReviewModal, setShowReviewModal] = useState(false);
  // TODO: Get from auth context instead of hardcoding
  const [teamId] = useState<string>('00000000-0000-0000-0000-000000000000');

  const selectedPlay = plays.find((p) => p.id === selectedPlayId) || null;

  // Fetch plays from API
  useEffect(() => {
    const fetchPlays = async () => {
      try {
        setIsLoading(true);
        const apiUrl = getPlaybooksApiUrl();
        const response = await fetch(apiUrl);

        if (!response.ok) {
          throw new Error('Failed to fetch playbooks');
        }

        const data = await response.json();
        setPlays(data);

        // Select first play by default
        if (data.length > 0) {
          setSelectedPlayId(data[0].id);
        }
      } catch (err: any) {
        console.error('Error fetching plays:', err);
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPlays();
  }, []);

  // Update metadata
  const handleUpdateMetadata = async (updates: Partial<PlaybookMetadataInput>) => {
    if (!selectedPlay?.metadata?.id) return;

    try {
      const apiUrl = getPlaybookMetadataApiUrl();
      const response = await fetch(apiUrl, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: selectedPlay.metadata.id,
          ...updates,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update metadata');
      }

      // Update local state
      setPlays((prev) =>
        prev.map((p) =>
          p.id === selectedPlayId && p.metadata
            ? { ...p, metadata: { ...p.metadata, ...updates } }
            : p
        )
      );

      setUpdateSuccess(true);
      setTimeout(() => setUpdateSuccess(false), 2000);
    } catch (err) {
      console.error('Failed to update metadata:', err);
      alert('Failed to update metadata');
    }
  };

  // Generate AI content (insights + assignments + knowledge cards)
  const handleGenerateContent = async () => {
    if (!selectedPlay || !selectedPlay.metadata?.id) {
      alert('Please ensure play metadata is saved before generating content');
      return;
    }

    setIsGenerating(true);
    try {
      const apiUrl = getGeneratePlayContentApiUrl();
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          playbookMetadataId: selectedPlay.metadata.id,
          imageUrl: selectedPlay.url,
          fileName: selectedPlay.fileName,
          teamId: teamId || 'default-team-id', // TODO: Get from auth context
          generateInsights: true,
          generateAssignments: true,
          generateKnowledge: true,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate content');
      }

      const data = await response.json();
      setGeneratedContent(data);
      setShowReviewModal(true);
    } catch (err: any) {
      console.error('Failed to generate content:', err);
      alert(`Failed to generate content: ${err.message}`);
    } finally {
      setIsGenerating(false);
    }
  };

  // Handle approve content
  const handleApprove = async (editedContent: any, notes: string) => {
    if (!generatedContent?.playId) return;

    try {
      const apiUrl = getReviewPlayContentApiUrl();
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          playId: generatedContent.playId,
          action: 'approve',
          coachId: 'coach-user-id', // TODO: Get from auth context
          updates: editedContent,
          reviewNotes: notes,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to approve content');
      }

      setShowReviewModal(false);
      setGeneratedContent(null);
      alert('Content approved and published successfully!');

      // Refresh play library
      const fetchUrl = getPlaybooksApiUrl();
      const fetchResponse = await fetch(fetchUrl);
      const data = await fetchResponse.json();
      setPlays(data);
    } catch (err) {
      console.error('Failed to approve content:', err);
      alert('Failed to approve content');
    }
  };

  // Handle reject content
  const handleReject = async (notes: string) => {
    if (!generatedContent?.playId) return;

    try {
      const apiUrl = getReviewPlayContentApiUrl();
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          playId: generatedContent.playId,
          action: 'reject',
          coachId: 'coach-user-id', // TODO: Get from auth context
          reviewNotes: notes,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to reject content');
      }

      setShowReviewModal(false);
      setGeneratedContent(null);
      alert('Content rejected');
    } catch (err) {
      console.error('Failed to reject content:', err);
      alert('Failed to reject content');
    }
  };

  // Handle save draft
  const handleSaveDraft = async (editedContent: any) => {
    if (!generatedContent?.playId) return;

    try {
      const apiUrl = getReviewPlayContentApiUrl();
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          playId: generatedContent.playId,
          action: 'update',
          coachId: 'coach-user-id', // TODO: Get from auth context
          updates: editedContent,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to save draft');
      }

      setShowReviewModal(false);
      setGeneratedContent(null);
      alert('Draft saved successfully');
    } catch (err) {
      console.error('Failed to save draft:', err);
      alert('Failed to save draft');
    }
  };

  // Delete play
  const handleDeletePlay = async () => {
    if (!selectedPlay) return;

    const confirmMessage = `Delete "${selectedPlay.name}"?\n\nThis will permanently delete:\n• The play image/PDF\n• All generated content (insights, assignments, flashcards)\n• Metadata\n\nThis cannot be undone.`;

    if (!confirm(confirmMessage)) return;

    try {
      const apiUrl = getPlaybooksApiUrl();
      const response = await fetch(apiUrl, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fileName: selectedPlay.fileName }),
      });

      if (!response.ok) {
        throw new Error('Failed to delete play');
      }

      const result = await response.json();
      console.log('Deleted:', result);

      // Show success message with counts
      if (result.deleted) {
        const { plays, assignments, flashcards, metadata } = result.deleted;
        alert(
          `Successfully deleted:\n• ${plays} play(s)\n• ${assignments} assignment(s)\n• ${flashcards} flashcard(s)\n• ${metadata} metadata record(s)\n• 1 file from storage`
        );
      }

      setPlays((prev) => {
        const newPlays = prev.filter((p) => p.id !== selectedPlayId);
        if (newPlays.length > 0) {
          setSelectedPlayId(newPlays[0].id);
        } else {
          setSelectedPlayId(null);
        }
        return newPlays;
      });
    } catch (err) {
      console.error('Failed to delete play:', err);
      alert('Failed to delete play. Check console for details.');
    }
  };

  // Format date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="h-full w-full bg-[#0A0A0A] flex items-center justify-center">
        <div className="flex items-center gap-3">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-[#00F6E5] border-t-transparent" />
          <span className="text-sm text-slate-400">Loading play library...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex bg-[#0A0A0A]">
      {/* Left Sidebar: Play List */}
      <aside className="flex w-80 flex-col border-r border-[#1B1E20] bg-[#0A0A0A]">
        {/* Header */}
        <div className="border-b border-[#1B1E20] px-4 py-3">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400">
              Play Library
            </h2>
            <span className="rounded bg-[#1B1E20] px-2 py-0.5 text-xs font-medium text-slate-500">
              {plays.length}
            </span>
          </div>
          <button
            onClick={onNewScan}
            className="w-full bg-[#00F6E5] text-black font-bold px-4 py-2.5 rounded-lg hover:bg-[#3DF3FF] transition-all shadow-[0_0_15px_rgba(0,246,229,0.3)] flex items-center justify-center gap-2"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M12 5v14"/><path d="M5 12h14"/>
            </svg>
            NEW SCAN
          </button>
        </div>

        {/* Play List */}
        <div className="flex-1 overflow-y-auto p-2">
          {plays.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center px-4">
              <p className="text-sm text-slate-500 mb-2">No plays found</p>
              <p className="text-xs text-slate-600">Upload plays to get started</p>
            </div>
          ) : (
            plays.map((play) => (
              <button
                key={play.id}
                onClick={() => setSelectedPlayId(play.id)}
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
                      {play.metadata?.formation_name || "Unknown"} • {formatDate(play.uploadedAt)}
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

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto">
        {!selectedPlay ? (
          <div className="flex h-full items-center justify-center">
            <p className="text-sm text-slate-500">Select a play to view details</p>
          </div>
        ) : (
          <div className="p-6">
            {/* Header with Actions */}
            <div className="mb-6 flex items-start justify-between">
              <div>
                <h1 className="text-2xl font-bold text-white">
                  {selectedPlay.name || "Untitled Play"}
                </h1>
                <p className="mt-1 text-sm text-slate-400">
                  Uploaded {formatDate(selectedPlay.uploadedAt)}
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleGenerateContent}
                  disabled={isGenerating}
                  className="flex items-center gap-2 rounded-lg bg-[#00F6E5] px-4 py-2 text-sm font-semibold text-black transition-all hover:bg-[#3DF3FF] disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_10px_rgba(0,246,229,0.3)]"
                >
                  {isGenerating ? (
                    <>
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-black border-t-transparent" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
                      </svg>
                      Generate AI Content
                    </>
                  )}
                </button>
                <button
                  onClick={handleDeletePlay}
                  className="flex items-center gap-1.5 rounded-lg bg-red-900/20 px-3 py-2 text-xs font-semibold text-red-400 transition-colors hover:bg-red-900/30"
                >
                  <TrashIcon className="h-4 w-4" />
                  Delete
                </button>
              </div>
            </div>

            {/* Image Preview */}
            <div className="mb-6 rounded-lg border border-[#1B1E20] bg-[#0d1117] overflow-hidden">
              {selectedPlay.type === 'image' ? (
                <img
                  src={selectedPlay.url}
                  alt={selectedPlay.name}
                  className="w-full h-auto max-h-[500px] object-contain"
                />
              ) : (
                <div className="flex items-center justify-center h-64 text-slate-400">
                  <div className="text-center">
                    <svg className="mx-auto h-12 w-12 mb-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
                      <path d="M14 2v6h6" />
                    </svg>
                    <p className="text-sm">PDF Document</p>
                  </div>
                </div>
              )}
            </div>

            {/* Success Message */}
            {updateSuccess && (
              <div className="mb-4 rounded-lg bg-green-900/20 border border-green-500/30 px-4 py-2 text-sm text-green-400">
                Metadata updated successfully
              </div>
            )}

            {/* Metadata Form */}
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-white">Play Metadata</h2>

              {/* Formation & Concept */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-400">
                    Formation
                  </label>
                  <input
                    type="text"
                    value={selectedPlay.metadata?.formation_name || ""}
                    onChange={(e) =>
                      handleUpdateMetadata({ formation_name: e.target.value })
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
                    value={selectedPlay.metadata?.concept_name || ""}
                    onChange={(e) =>
                      handleUpdateMetadata({ concept_name: e.target.value })
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
                    value={selectedPlay.metadata?.side_of_ball || ""}
                    onChange={(e) =>
                      handleUpdateMetadata({ side_of_ball: e.target.value as any })
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
                    value={selectedPlay.metadata?.content_type || ""}
                    onChange={(e) =>
                      handleUpdateMetadata({ content_type: e.target.value as any })
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
                  value={selectedPlay.metadata?.level || ""}
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
                  {["all", "qb", "rb", "wr", "te", "ol", "dl", "lb", "db", "k"].map((pos) => {
                    const isSelected = selectedPlay.metadata?.position_relevance?.includes(pos as any);
                    return (
                      <button
                        key={pos}
                        onClick={() => {
                          const current = selectedPlay.metadata?.position_relevance || ["all"];
                          const updated = isSelected
                            ? current.filter((p) => p !== pos)
                            : [...current.filter((p) => p !== "all"), pos];
                          handleUpdateMetadata({
                            position_relevance: updated.length === 0 ? ["all"] : updated,
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
                  })}
                </div>
              </div>

              {/* Custom Notes */}
              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Custom Notes
                </label>
                <textarea
                  value={selectedPlay.metadata?.custom_notes || ""}
                  onChange={(e) =>
                    handleUpdateMetadata({ custom_notes: e.target.value })
                  }
                  rows={4}
                  className="w-full resize-none rounded-lg border border-[#1B1E20] bg-[#1B1E20]/50 px-3 py-2 text-sm text-white transition-all focus:border-[#00F6E5]/50 focus:outline-none focus:ring-2 focus:ring-[#00F6E5]/10"
                  placeholder="Add any coaching notes, reads, or adjustments..."
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Review Modal */}
      {showReviewModal && generatedContent && (
        <PlayContentReviewModal
          content={generatedContent}
          playName={selectedPlay?.name || 'Untitled Play'}
          onClose={() => setShowReviewModal(false)}
          onApprove={handleApprove}
          onReject={handleReject}
          onSaveDraft={handleSaveDraft}
        />
      )}
    </div>
  );
};

// Icon component
function TrashIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
    </svg>
  );
}





