import React, { useState, useEffect } from 'react';
import {
  getPlaybooksApiUrl,
  getPlaybookMetadataApiUrl,
  getCreatePlayRecordApiUrl,
  getProcessPlayContentApiUrl,
  getReviewPlayContentApiUrl,
  getCheckPlayStatusApiUrl,
} from '@/lib/api-config';
import { PlaybookMetadataInput } from '@/types/playbook-metadata';
import PlayContentReviewModal from './PlayContentReviewModal';
import { usePlayContentGeneration } from '@/contexts/PlayContentGenerationContext';
import { PlayRenderer } from './PlayRenderer';

interface Play {
  id: string;
  name: string;
  fileName: string;
  type: string;
  uploadedAt: string;
  tags: string[];
  playType: string;
  url: string;
  metadata?: PlaybookMetadataInput & {
    id: string;
    is_built_play?: boolean;
    play_data?: any; // BuiltPlayData from PlayBuilder
  };
  isBuiltPlay?: boolean;
}

interface SavedPlayLibraryProps {
  onSelectPlay: (url: string, fileName: string, type: 'pdf' | 'image') => void;
  onFileUpload: () => void;
  onCreatePlay: () => void;
}

export const SavedPlayLibrary: React.FC<SavedPlayLibraryProps> = ({ onSelectPlay, onFileUpload, onCreatePlay }) => {
  const [plays, setPlays] = useState<Play[]>([]);
  const [selectedPlayId, setSelectedPlayId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [updateSuccess, setUpdateSuccess] = useState(false);
  const [generatedContent, setGeneratedContent] = useState<any>(null);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [selectedPlayIds, setSelectedPlayIds] = useState<Set<string>>(new Set());
  const [isMultiSelectMode, setIsMultiSelectMode] = useState(false);
  // TODO: Get from auth context instead of hardcoding
  const [teamId] = useState<string>('00000000-0000-0000-0000-000000000000');
  const [pendingMetadata, setPendingMetadata] = useState<Partial<PlaybookMetadataInput>>({});
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  const selectedPlay = plays.find((p) => p.id === selectedPlayId) || null;

  // Multi-play generation context
  const { startGeneration, generatedContents, isComplete } = usePlayContentGeneration();

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

  // Show review modal when multi-play generation is complete
  useEffect(() => {
    if (isComplete && generatedContents.length > 0) {
      setShowReviewModal(true);
    }
  }, [isComplete, generatedContents]);

  // Reset pending changes when selected play changes
  useEffect(() => {
    setPendingMetadata({});
    setHasUnsavedChanges(false);
  }, [selectedPlayId]);

  // Track metadata changes locally (don't save immediately)
  const handleMetadataChange = (updates: Partial<PlaybookMetadataInput>) => {
    setPendingMetadata(prev => ({ ...prev, ...updates }));
    setHasUnsavedChanges(true);
  };

  // Get current value for a field (pending or saved)
  const getCurrentMetadataValue = (field: keyof PlaybookMetadataInput) => {
    if (field in pendingMetadata) {
      return pendingMetadata[field];
    }
    return selectedPlay?.metadata?.[field];
  };

  // Save metadata changes
  const handleSaveMetadata = async () => {
    if (!selectedPlay?.metadata?.id) return;

    try {
      const apiUrl = getPlaybookMetadataApiUrl();
      const response = await fetch(apiUrl, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: selectedPlay.metadata.id,
          ...pendingMetadata,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update metadata');
      }

      // Update local state
      setPlays((prev) =>
        prev.map((p) =>
          p.id === selectedPlayId && p.metadata
            ? { ...p, metadata: { ...p.metadata, ...pendingMetadata } }
            : p
        )
      );

      // Reset pending changes
      setPendingMetadata({});
      setHasUnsavedChanges(false);

      setUpdateSuccess(true);
      setTimeout(() => setUpdateSuccess(false), 2000);
    } catch (err) {
      console.error('Failed to update metadata:', err);
      alert('Failed to update metadata');
    }
  };

  // Update metadata (used by other functions that need direct updates)
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

  // Toggle multi-select mode
  const handleToggleMultiSelect = () => {
    setIsMultiSelectMode(!isMultiSelectMode);
    if (isMultiSelectMode) {
      setSelectedPlayIds(new Set());
    }
  };

  // Toggle play selection
  const handleTogglePlaySelection = (playId: string) => {
    const newSelected = new Set(selectedPlayIds);
    if (newSelected.has(playId)) {
      newSelected.delete(playId);
    } else {
      newSelected.add(playId);
    }
    setSelectedPlayIds(newSelected);
  };

  // Generate content for multiple plays
  const handleGenerateMultiplePlays = async () => {
    if (selectedPlayIds.size === 0) {
      alert('Please select at least one play');
      return;
    }

    const selectedPlays = plays
      .filter((p) => selectedPlayIds.has(p.id))
      .map((p) => ({
        id: p.id,
        fileName: p.fileName,
        name: p.name || 'Untitled Play',
        url: p.url,
        metadataId: p.metadata?.id,
        teamId: teamId,
      }));

    await startGeneration(selectedPlays, teamId);
  };

  // Generate AI content (insights + assignments + knowledge cards)
  const handleGenerateContent = async () => {
    if (!selectedPlay) {
      alert('Please select a play first');
      return;
    }

    console.log('Generate content - selectedPlay:', selectedPlay);
    console.log('Generate content - metadata:', selectedPlay?.metadata);
    console.log('Generate content - metadata.id:', selectedPlay?.metadata?.id);

    // If no metadata exists, create it first
    let metadataId = selectedPlay.metadata?.id;
    if (!metadataId) {
      console.log('No metadata found, creating minimal metadata...');
      try {
        const metadataApiUrl = getPlaybookMetadataApiUrl();
        const filePath = `public/${selectedPlay.fileName}`;

        const response = await fetch(metadataApiUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            team_id: teamId,
            file_paths: [filePath],
            position_relevance: ['all'],
            formation_name: selectedPlay.name,
          }),
        });

        if (!response.ok) {
          throw new Error('Failed to create metadata');
        }

        const newMetadata = await response.json();
        metadataId = newMetadata.id;

        // Update local state with new metadata
        setPlays((prev) =>
          prev.map((p) =>
            p.id === selectedPlayId ? { ...p, metadata: newMetadata } : p
          )
        );

        console.log('Created metadata:', newMetadata);
      } catch (err) {
        console.error('Failed to create metadata:', err);
        alert('Failed to create metadata. Please try adding metadata manually first.');
        return;
      }
    }

    setIsGenerating(true);
    let pollIntervalId: NodeJS.Timeout | null = null;

    try {
      // Check if we're running locally
      const isLocalhost = window.location.hostname === 'localhost' ||
                         window.location.hostname === '127.0.0.1';

      if (isLocalhost) {
        // Local development: Use all-in-one API route
        console.log('📝 Local dev: Using all-in-one API');
        const apiUrl = '/api/generate-play-content';

        // For built plays, send playData instead of imageUrl
        const isBuiltPlay = selectedPlay.type === 'built-play' || selectedPlay.isBuiltPlay;
        const requestBody = {
          playbookMetadataId: metadataId,
          fileName: selectedPlay.fileName,
          teamId: teamId || 'default-team-id',
          generateInsights: true,
          generateAssignments: true,
          generateKnowledge: true,
          ...(isBuiltPlay && selectedPlay.metadata?.play_data
            ? { playData: selectedPlay.metadata.play_data }
            : { imageUrl: selectedPlay.url }
          ),
        };

        const response = await fetch(apiUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(requestBody),
        });

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`Failed to generate content: ${errorText.substring(0, 200)}`);
        }

        const data = await response.json();
        console.log('✅ Generation complete!');
        setGeneratedContent(data);
        setShowReviewModal(true);
        setIsGenerating(false);
        return;
      }

      // Production: Use two-step process with background function
      // Step 1: Create the play record (fast)
      console.log('📝 Step 1: Creating play record...');
      const createUrl = getCreatePlayRecordApiUrl();
      const createResponse = await fetch(createUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          playbookMetadataId: metadataId,
          fileName: selectedPlay.fileName,
          teamId: teamId || 'default-team-id',
        }),
      });

      if (!createResponse.ok) {
        const errorText = await createResponse.text();
        throw new Error(`Failed to create play: ${errorText.substring(0, 200)}`);
      }

      const { playId } = await createResponse.json();
      console.log('✅ Play created with ID:', playId);

      // Step 2: Trigger background processing
      console.log('🚀 Step 2: Starting background AI generation...');
      const processUrl = getProcessPlayContentApiUrl();

      // For built plays, send playData instead of imageUrl
      const isBuiltPlay = selectedPlay.type === 'built-play' || selectedPlay.isBuiltPlay;
      const processRequestBody = {
        playId,
        fileName: selectedPlay.fileName,
        generateInsights: true,
        generateAssignments: true,
        generateKnowledge: true,
        ...(isBuiltPlay && selectedPlay.metadata?.play_data
          ? { playData: selectedPlay.metadata.play_data }
          : { imageUrl: selectedPlay.url }
        ),
      };

      const processResponse = await fetch(processUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(processRequestBody),
      });

      // Background function returns 202 immediately
      console.log('📥 Background function triggered, status:', processResponse.status);

      // Step 3: Start polling for completion
      console.log('🔄 Step 3: Polling for completion...');
      let pollCount = 0;
      const maxPolls = 300; // 15 minutes

      pollIntervalId = setInterval(async () => {
        pollCount++;

        if (pollCount > maxPolls) {
          if (pollIntervalId) clearInterval(pollIntervalId);
          console.error('⏰ Polling timeout');
          alert('Generation is taking longer than expected. Please refresh and check back.');
          setIsGenerating(false);
          return;
        }

        try {
          const statusUrl = `${getCheckPlayStatusApiUrl()}?playId=${playId}`;
          const statusResponse = await fetch(statusUrl);

          if (!statusResponse.ok) {
            console.error('Status check failed:', statusResponse.status);
            if (pollCount > 5 && statusResponse.status >= 500) {
              if (pollIntervalId) clearInterval(pollIntervalId);
              alert('Server error. Please try again.');
              setIsGenerating(false);
            }
            return;
          }

          const statusData = await statusResponse.json();
          console.log(`📊 Poll ${pollCount}: Status = ${statusData.status}`);

          if (statusData.status === 'draft') {
            // Complete!
            if (pollIntervalId) clearInterval(pollIntervalId);
            console.log('✅ Generation complete!');
            setGeneratedContent(statusData);
            setShowReviewModal(true);
            setIsGenerating(false);
          } else if (statusData.status === 'rejected') {
            // Failed
            if (pollIntervalId) clearInterval(pollIntervalId);
            console.error('❌ Generation failed');
            alert('Content generation failed. Please try again.');
            setIsGenerating(false);
          }
        } catch (pollError) {
          console.error('Polling error:', pollError);
        }
      }, 3000); // Poll every 3 seconds

    } catch (err: any) {
      console.error('❌ Failed to generate content:', err);
      if (pollIntervalId) clearInterval(pollIntervalId);
      alert(`Failed to generate content: ${err.message}`);
      setIsGenerating(false);
    }
  };

  // Handle approve content
  const handleApprove = async (editedContent: any, notes: string, playId?: string) => {
    const targetPlayId = playId || generatedContent?.playId;
    console.log('🟢 Approving play:', targetPlayId);

    if (!targetPlayId) {
      console.error('❌ No playId provided');
      return;
    }

    try {
      const apiUrl = getReviewPlayContentApiUrl();
      console.log('📤 Calling review API:', apiUrl);

      const requestBody = {
        playId: targetPlayId,
        action: 'approve',
        coachId: '00000000-0000-0000-0000-000000000001', // TODO: Get from auth context
        updates: editedContent,
        reviewNotes: notes,
      };
      console.log('📤 Request body:', requestBody);

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      });

      console.log('📥 Response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Error response:', errorText);
        throw new Error(`Failed to approve content: ${response.status} - ${errorText.substring(0, 200)}`);
      }

      const result = await response.json();
      console.log('✅ Approve successful:', result);

      // Only close modal and clear if single-play mode
      if (!playId) {
        setShowReviewModal(false);
        setGeneratedContent(null);
        alert('Content approved and published successfully!');

        // Refresh play library
        const fetchUrl = getPlaybooksApiUrl();
        const fetchResponse = await fetch(fetchUrl);
        const data = await fetchResponse.json();
        setPlays(data);
      }
    } catch (err: any) {
      console.error('❌ Failed to approve content:', err);
      alert(`Failed to approve content: ${err.message}`);
    }
  };

  // Handle reject content
  const handleReject = async (notes: string, playId?: string) => {
    const targetPlayId = playId || generatedContent?.playId;
    console.log('🔴 Rejecting play:', targetPlayId);

    if (!targetPlayId) {
      console.error('❌ No playId provided');
      return;
    }

    try {
      const apiUrl = getReviewPlayContentApiUrl();
      console.log('📤 Calling review API:', apiUrl);

      const requestBody = {
        playId: targetPlayId,
        action: 'reject',
        coachId: '00000000-0000-0000-0000-000000000001', // TODO: Get from auth context
        reviewNotes: notes,
      };
      console.log('📤 Request body:', requestBody);

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      });

      console.log('📥 Response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Error response:', errorText);
        throw new Error(`Failed to reject content: ${response.status} - ${errorText.substring(0, 200)}`);
      }

      const result = await response.json();
      console.log('✅ Reject successful:', result);

      // Only close modal and clear if single-play mode
      if (!playId) {
        setShowReviewModal(false);
        setGeneratedContent(null);
        alert('Content rejected');
      }
    } catch (err: any) {
      console.error('❌ Failed to reject content:', err);
      alert(`Failed to reject content: ${err.message}`);
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
          coachId: '00000000-0000-0000-0000-000000000001', // TODO: Get from auth context
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


  // Delete play (cascades to metadata and associated play records)
  const handleDeletePlay = async () => {
    if (!selectedPlay) return;

    const confirmMessage = `Delete "${selectedPlay.name}"?\n\nThis will permanently delete:\n• The play file (image/PDF)\n• Metadata record\n• Associated play record (if exists)\n• All assignments\n• All flashcards\n\nThis cannot be undone.`;

    if (!confirm(confirmMessage)) return;

    try {
      const apiUrl = getPlaybooksApiUrl();
      const deletePayload = {
        fileName: selectedPlay.fileName,
        metadataId: selectedPlay.metadata?.id, // Include metadata ID for cascade delete
      };

      console.log('[Delete Play] Request payload:', deletePayload);
      console.log('[Delete Play] Selected play:', selectedPlay);

      const response = await fetch(apiUrl, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(deletePayload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('[Delete Play] API error response:', errorData);
        throw new Error(errorData.error || 'Failed to delete play');
      }

      const result = await response.json();
      console.log('[Delete Play] API success response:', result);

      // Show success message
      alert('Playbook deleted successfully!\n\nDeleted:\n• File from storage\n• Metadata record\n• Associated play records\n• All assignments and flashcards');

      // Remove from local state
      setPlays((prev) => {
        const newPlays = prev.filter((p) => p.id !== selectedPlayId);
        if (newPlays.length > 0) {
          setSelectedPlayId(newPlays[0].id);
        } else {
          setSelectedPlayId(null);
        }
        return newPlays;
      });
    } catch (err: any) {
      console.error('[Delete Play] Error:', err);
      alert(`Failed to delete play: ${err.message}\n\nCheck console for details.`);
    }
  };

  // Delete multiple selected plays
  const handleDeleteSelected = async () => {
    if (selectedPlayIds.size === 0) return;

    const count = selectedPlayIds.size;
    const confirmMessage = `Delete ${count} selected playbook${count > 1 ? 's' : ''}?\n\nThis will permanently delete:\n• ${count} play file${count > 1 ? 's' : ''}\n• ${count} metadata record${count > 1 ? 's' : ''}\n• Associated play records\n• All assignments and flashcards\n\nThis cannot be undone.`;

    if (!confirm(confirmMessage)) return;

    try {
      setIsGenerating(true); // Reuse loading state
      const apiUrl = getPlaybooksApiUrl();

      // Get selected plays data
      const playsToDelete = plays.filter((p) => selectedPlayIds.has(p.id));

      // Delete each play
      const deletePromises = playsToDelete.map((play) =>
        fetch(apiUrl, {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            fileName: play.fileName,
            metadataId: play.metadata?.id,
          }),
        })
      );

      const results = await Promise.all(deletePromises);
      const failedCount = results.filter((r) => !r.ok).length;

      if (failedCount > 0) {
        alert(`${count - failedCount} of ${count} playbooks deleted successfully.\n${failedCount} failed - check console for details.`);
      } else {
        alert(`Successfully deleted ${count} playbook${count > 1 ? 's' : ''}!`);
      }

      // Remove deleted plays from local state
      setPlays((prev) => {
        const newPlays = prev.filter((p) => !selectedPlayIds.has(p.id));
        if (newPlays.length > 0 && !newPlays.find((p) => p.id === selectedPlayId)) {
          setSelectedPlayId(newPlays[0].id);
        } else if (newPlays.length === 0) {
          setSelectedPlayId(null);
        }
        return newPlays;
      });

      // Clear selection and exit multi-select mode
      setSelectedPlayIds(new Set());
      setIsMultiSelectMode(false);
    } catch (err: any) {
      console.error('[Delete Selected] Error:', err);
      alert(`Failed to delete playbooks: ${err.message}\n\nCheck console for details.`);
    } finally {
      setIsGenerating(false);
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
          <div className="grid grid-cols-2 gap-2 mb-2">
            <button
              onClick={onFileUpload}
              className="bg-[#00F6E5] text-black font-bold px-3 py-2.5 rounded-lg hover:bg-[#3DF3FF] transition-all shadow-[0_0_15px_rgba(0,246,229,0.3)] flex items-center justify-center gap-1.5 text-xs"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="17 8 12 3 7 8"/>
                <line x1="12" y1="3" x2="12" y2="15"/>
              </svg>
              FILE UPLOAD
            </button>
            <button
              onClick={onCreatePlay}
              className="bg-[#A855F7] text-white font-bold px-3 py-2.5 rounded-lg hover:bg-[#9333EA] transition-all shadow-[0_0_15px_rgba(168,85,247,0.3)] flex items-center justify-center gap-1.5 text-xs"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                <line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/>
              </svg>
              CREATE PLAY
            </button>
          </div>

          {/* Multi-select controls */}
          <div className="flex gap-2">
            <button
              onClick={handleToggleMultiSelect}
              className={`flex-1 px-3 py-2 rounded-lg text-xs font-semibold transition-all ${
                isMultiSelectMode
                  ? 'bg-[#00F6E5]/10 text-[#00F6E5] ring-1 ring-[#00F6E5]/30'
                  : 'bg-[#1B1E20] text-slate-400 hover:bg-[#1B1E20]/70'
              }`}
            >
              {isMultiSelectMode ? `Selected (${selectedPlayIds.size})` : 'Multi-Select'}
            </button>
            {isMultiSelectMode && (
              <>
                <button
                  onClick={handleGenerateMultiplePlays}
                  disabled={selectedPlayIds.size === 0}
                  className="flex-1 px-3 py-2 rounded-lg text-xs font-semibold bg-[#00F6E5] text-black hover:bg-[#3DF3FF] transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_10px_rgba(0,246,229,0.3)]"
                >
                  Generate
                </button>
                <button
                  onClick={handleDeleteSelected}
                  disabled={selectedPlayIds.size === 0}
                  className="px-3 py-2 rounded-lg text-xs font-semibold bg-red-900/20 text-red-400 hover:bg-red-900/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Delete
                </button>
              </>
            )}
          </div>
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
              <div
                key={play.id}
                className={`group mb-1 w-full rounded-lg px-3 py-2.5 transition-all ${
                  play.id === selectedPlayId
                    ? "bg-[#00F6E5]/10 ring-1 ring-[#00F6E5]/30"
                    : "hover:bg-[#1B1E20]/50"
                }`}
              >
                <div className="flex items-start gap-2">
                  {isMultiSelectMode && (
                    <input
                      type="checkbox"
                      checked={selectedPlayIds.has(play.id)}
                      onChange={(e) => {
                        e.stopPropagation();
                        handleTogglePlaySelection(play.id);
                      }}
                      className="mt-1 h-4 w-4 rounded border-gray-600 bg-[#1B1E20] text-[#00F6E5] focus:ring-[#00F6E5] focus:ring-offset-0"
                    />
                  )}
                  <button
                    onClick={() => setSelectedPlayId(play.id)}
                    className="flex-1 text-left"
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
                      {!isMultiSelectMode && play.id === selectedPlayId && (
                        <div className="ml-2 mt-1 h-2 w-2 shrink-0 rounded-full bg-[#00F6E5]" />
                      )}
                    </div>
                  </button>
                </div>
              </div>
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

            {/* Play Preview */}
            <div className="mb-6 rounded-lg border border-[#1B1E20] bg-[#0d1117] overflow-hidden">
              {selectedPlay.type === 'built-play' && selectedPlay.metadata?.play_data ? (
                // Built play - render visually
                <div className="p-6">
                  <PlayRenderer playData={selectedPlay.metadata.play_data} className="max-h-[500px]" />
                </div>
              ) : selectedPlay.type === 'image' ? (
                // Uploaded image
                <img
                  src={selectedPlay.url}
                  alt={selectedPlay.name}
                  className="w-full h-auto max-h-[500px] object-contain"
                />
              ) : (
                // PDF document
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
                    value={(getCurrentMetadataValue('formation_name') as string) || ""}
                    onChange={(e) =>
                      handleMetadataChange({ formation_name: e.target.value })
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
                    value={(getCurrentMetadataValue('concept_name') as string) || ""}
                    onChange={(e) =>
                      handleMetadataChange({ concept_name: e.target.value })
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
                    value={(getCurrentMetadataValue('side_of_ball') as string) || ""}
                    onChange={(e) =>
                      handleMetadataChange({ side_of_ball: e.target.value as any })
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
                    value={(getCurrentMetadataValue('content_type') as string) || ""}
                    onChange={(e) =>
                      handleMetadataChange({ content_type: e.target.value as any })
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
                  value={(getCurrentMetadataValue('level') as string) || ""}
                  onChange={(e) =>
                    handleMetadataChange({ level: e.target.value as any })
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
                    const currentPositions = (getCurrentMetadataValue('position_relevance') as string[]) || ["all"];
                    const isSelected = currentPositions.includes(pos as any);
                    return (
                      <button
                        key={pos}
                        onClick={() => {
                          const updated = isSelected
                            ? currentPositions.filter((p) => p !== pos)
                            : [...currentPositions.filter((p) => p !== "all"), pos];
                          handleMetadataChange({
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

              {/* Additional Information / Custom Notes */}
              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Additional Information
                  <span className="ml-2 text-xs text-slate-500 font-normal normal-case">(Helps AI generate better content)</span>
                </label>
                <textarea
                  value={(getCurrentMetadataValue('custom_notes') as string) || ""}
                  onChange={(e) =>
                    handleMetadataChange({ custom_notes: e.target.value })
                  }
                  rows={6}
                  className="w-full resize-none rounded-lg border border-[#1B1E20] bg-[#1B1E20]/50 px-3 py-2 text-sm text-white transition-all focus:border-[#00F6E5]/50 focus:outline-none focus:ring-2 focus:ring-[#00F6E5]/10"
                  placeholder="Add detailed context: QB progressions, protection schemes, route details, blocking assignments, reads, adjustments, etc. This information helps the AI generate more accurate and detailed content."
                />
                <p className="mt-1.5 text-xs text-slate-500">
                  Providing detailed information here will help the AI generate more accurate assignments, insights, and quiz questions when you click "Generate AI Content".
                </p>
              </div>

              {/* Save Button - Only shown when there are unsaved changes */}
              {hasUnsavedChanges && (
                <div className="flex items-center gap-3 pt-4 border-t border-[#1B1E20]">
                  <button
                    onClick={handleSaveMetadata}
                    className="flex items-center gap-2 rounded-lg bg-[#00F6E5] px-6 py-2.5 text-sm font-semibold text-black transition-all hover:bg-[#3DF3FF] shadow-[0_0_15px_rgba(0,246,229,0.3)]"
                  >
                    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                    Save Changes
                  </button>
                  <span className="text-xs text-slate-400">
                    You have unsaved changes
                  </span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Review Modal */}
      {showReviewModal && (generatedContent || generatedContents.length > 0) && (
        <PlayContentReviewModal
          content={generatedContent}
          playName={selectedPlay?.name || 'Untitled Play'}
          imageUrl={selectedPlay?.url}
          playData={selectedPlay?.metadata?.play_data}
          isBuiltPlay={selectedPlay?.type === 'built-play' || selectedPlay?.isBuiltPlay}
          multipleContents={generatedContents.length > 0 ? generatedContents : undefined}
          onClose={() => {
            setShowReviewModal(false);
            setGeneratedContent(null);
          }}
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





