"use client";

import React, { useState, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { SidebarLayout } from '@/components/SidebarLayout';
import { useAuth } from '@/contexts/AuthContext';
import {
  usePlayerPlays,
  useUpdatePlayerPlayStatus,
  useUpdatePlayerPlay,
  useProcessPlayerPlay,
  useDeletePlayerPlay,
  useCreatePlayerPlay,
  usePlayerPlay,
} from '@/hooks/usePlayerPlaysAPI';
import { PlayerPlay, Unit, UpdatePlayerPlayRequest } from '@/lib/api/player-plays';
import { playerGamesAPI } from '@/lib/api/player-games';
import { FileUploadScreen } from '@/components/play-recognition/FileUploadScreen';
import { PlayBuilder, BuiltPlayData } from '@/components/play-recognition/PlayBuilder';
import { PlaybookMetadataInput } from '@/types/playbook-metadata';
import { situationalTagsAPI, type SituationalTag } from '@/lib/api/situational-tags';
import { conceptTagsAPI, type ConceptTag } from '@/lib/api/concept-tags';
import { formationsAPI, type Formation } from '@/lib/api/formations';
import { getPlaybooksApiUrl } from '@/lib/api-config';

type ViewState = 'list' | 'upload' | 'create' | 'view';

// View Play Screen Component
function ViewPlayScreen({ playId, onBack, orgId }: { playId: string; onBack: () => void; orgId?: string }) {
  const { play, loading, error } = usePlayerPlay(playId);

  if (loading) {
    return (
      <SidebarLayout>
        <div className="flex items-center justify-center h-screen">
          <div className="text-center">
            <div className="h-12 w-12 mx-auto mb-4 animate-spin rounded-full border-4 border-[#00F6E5]/20 border-t-[#00F6E5]" />
            <p className="text-slate-400">Loading play...</p>
          </div>
        </div>
      </SidebarLayout>
    );
  }

  if (error || !play) {
    return (
      <SidebarLayout>
        <div className="flex items-center justify-center h-screen">
          <div className="text-center">
            <p className="text-red-400 mb-4">{error || 'Play not found'}</p>
            <button
              onClick={onBack}
              className="px-4 py-2 bg-[#00F6E5] text-black font-semibold rounded-lg hover:bg-[#00D4C7]"
            >
              Back to Library
            </button>
          </div>
        </div>
      </SidebarLayout>
    );
  }

  // Check if this is a diagram play or image play
  const isDiagramPlay = play.play?.diagram_data && play.play.diagram_data.offensePlayers;

  if (isDiagramPlay) {
    // Convert diagram_data to BuiltPlayData format
    const builtPlayData = {
      mode: play.play.diagram_data.mode || 'pass',
      offensePlayers: play.play.diagram_data.offensePlayers || [],
      defensePlayers: play.play.diagram_data.defensePlayers || [],
      routes: play.play.diagram_data.routes || [],
      blocking: play.play.diagram_data.blocking || [],
      ballCarrierPath: play.play.diagram_data.ballCarrierPath,
      metadata: {
        name: play.play.name,
        formation: play.play.formationName || '',
        concept: play.play.concept || '',
        playType: play.play.playType as 'PASS' | 'RUN' | 'RPO',
        strength: 'Right' as const,
        personnel: '11',
      },
    };

    return (
      <SidebarLayout>
        <PlayBuilder
          onBack={onBack}
          onSave={() => {}}
          orgId={orgId}
          mode="player"
          initialPlayData={builtPlayData}
          viewOnly={true}
        />
      </SidebarLayout>
    );
  }

  // Image-based play - show the image
  return (
    <SidebarLayout>
      <div className="h-screen flex flex-col bg-[#0A0A0A] text-white">
        <header className="border-b border-[#1B1E20] bg-[#0A0A0A]/95 backdrop-blur-xl px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={onBack}
                className="flex items-center gap-2 text-slate-400 hover:text-white transition"
              >
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                  <path d="M19 12H5m7 7l-7-7 7-7"/>
                </svg>
                Back
              </button>
              <div className="h-6 w-px bg-[#1B1E20]" />
              <h1 className="text-2xl font-bold text-white">{play.play.name}</h1>
            </div>
          </div>
        </header>

        <div className="flex-1 flex items-center justify-center p-8 bg-[#0D1117]">
          {play.play.metadata?.file_paths?.[0] ? (
            <img
              src={`https://svqkijmzpmxcmmapsdzp.supabase.co/storage/v1/object/public/Chalkboard%20Bucket/${play.play.metadata.file_paths[0]}`}
              alt={play.play.name}
              className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
            />
          ) : (
            <div className="text-center text-slate-400">
              <p>No image available for this play</p>
            </div>
          )}
        </div>
      </div>
    </SidebarLayout>
  );
}

export default function LearningCenterPage() {
  const router = useRouter();
  const { session, orgId, loading: authLoading } = useAuth();
  const { plays, loading, error, refetch } = usePlayerPlays({});
  const { updateStatus } = useUpdatePlayerPlayStatus();
  const { updatePlay } = useUpdatePlayerPlay();
  const { processPlay } = useProcessPlayerPlay();
  const { deletePlay } = useDeletePlayerPlay();
  const { createPlay } = useCreatePlayerPlay();

  const [currentView, setCurrentView] = useState<ViewState>('list');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUnit, setSelectedUnit] = useState<Unit | 'all'>('all');
  const [selectedSection, setSelectedSection] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [expandedPlayId, setExpandedPlayId] = useState<string | null>(null);
  const [editingPlayId, setEditingPlayId] = useState<string | null>(null);
  const [editFormData, setEditFormData] = useState<UpdatePlayerPlayRequest>({});
  const [isUpdating, setIsUpdating] = useState(false);
  const [viewingPlayId, setViewingPlayId] = useState<string | null>(null);
  const [processingPlayIds, setProcessingPlayIds] = useState<Set<string>>(new Set());
  const [expandedUnits, setExpandedUnits] = useState<Record<Unit, boolean>>({
    O: true,
    D: true,
    ST: true,
  });
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  // Batch processing
  const [selectedPlayIds, setSelectedPlayIds] = useState<Set<string>>(new Set());
  const [isBatchProcessing, setIsBatchProcessing] = useState(false);

  // Structured play builder data
  const [situationalTags, setSituationalTags] = useState<SituationalTag[]>([]);
  const [conceptTags, setConceptTags] = useState<ConceptTag[]>([]);
  const [formations, setFormations] = useState<Formation[]>([]);
  const [loadingStructuredData, setLoadingStructuredData] = useState(false);

  // Mark initial load as complete once we have data
  React.useEffect(() => {
    if (!loading && isInitialLoad) {
      setIsInitialLoad(false);
    }
  }, [loading, isInitialLoad]);

  // Load structured data when entering create mode
  useEffect(() => {
    const loadStructuredData = async () => {
      if (currentView !== 'create' || !session?.access_token) {
        return;
      }

      if (situationalTags.length > 0 && conceptTags.length > 0 && formations.length > 0) {
        // Already loaded
        return;
      }

      try {
        setLoadingStructuredData(true);

        console.log('Loading structured data for PlayBuilder...');

        const [situationalTagsRes, conceptTagsRes, formationsRes] = await Promise.all([
          situationalTagsAPI.list(session.access_token),
          conceptTagsAPI.list(session.access_token),
          formationsAPI.list(session.access_token),
        ]);

        console.log('Loaded formations:', formationsRes.formations);
        console.log('Loaded situational tags:', situationalTagsRes.tags);
        console.log('Loaded concept tags:', conceptTagsRes.tags);

        setSituationalTags(situationalTagsRes.tags);
        setConceptTags(conceptTagsRes.tags);
        setFormations(formationsRes.formations);
      } catch (err) {
        console.error('Error loading structured data:', err);
        alert(`Failed to load play builder data: ${err instanceof Error ? err.message : 'Unknown error'}`);
      } finally {
        setLoadingStructuredData(false);
      }
    };

    loadStructuredData();
  }, [currentView, session?.access_token]);

  // Poll for plays that are generating
  React.useEffect(() => {
    const generatingPlays = plays.filter(p => p.contentStatus === 'generating');

    if (generatingPlays.length === 0) {
      return;
    }

    console.log(`Polling for ${generatingPlays.length} generating play(s)`);

    // Poll every 5 seconds
    const interval = setInterval(async () => {
      console.log('Checking status of generating plays...');
      await refetch();
    }, 5000);

    return () => clearInterval(interval);
  }, [plays, refetch]);

  // Organize plays by unit
  const organizedPlays = useMemo(() => {
    const organized: Record<Unit, PlayerPlay[]> = {
      O: [],
      D: [],
      ST: [],
    };

    plays.forEach((play) => {
      const unit = play.unit || 'O';
      organized[unit].push(play);
    });

    Object.keys(organized).forEach((unit) => {
      organized[unit as Unit].sort((a, b) => a.name.localeCompare(b.name));
    });

    return organized;
  }, [plays]);

  // Get unique sections for filtering
  const availableSections = useMemo(() => {
    const sections = new Set<string>();
    plays.forEach((play) => {
      if (play.playbookSection) {
        sections.add(play.playbookSection);
      }
    });
    return Array.from(sections).sort();
  }, [plays]);

  // Filter plays
  const filteredPlays = useMemo(() => {
    return plays.filter(play => {
      const matchesSearch =
        play.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        play.concept?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        play.formationName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        play.playbookSection?.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesUnit = selectedUnit === 'all' || play.unit === selectedUnit;
      const matchesSection = selectedSection === 'all' || play.playbookSection === selectedSection;
      const matchesStatus = selectedStatus === 'all' || play.contentStatus === selectedStatus;

      return matchesSearch && matchesUnit && matchesSection && matchesStatus;
    });
  }, [plays, searchQuery, selectedUnit, selectedSection, selectedStatus]);

  // Stats
  const stats = useMemo(() => {
    return {
      total: plays.length,
      offense: plays.filter(p => p.unit === 'O').length,
      defense: plays.filter(p => p.unit === 'D').length,
      specialTeams: plays.filter(p => p.unit === 'ST').length,
      draft: plays.filter(p => p.contentStatus === 'draft').length,
      approved: plays.filter(p => p.contentStatus === 'approved').length,
      generating: plays.filter(p => p.contentStatus === 'generating').length,
      failed: plays.filter(p => p.contentStatus === 'rejected').length,
    };
  }, [plays]);

  const toggleUnit = (unit: Unit) => {
    setExpandedUnits(prev => ({ ...prev, [unit]: !prev[unit] }));
  };

  const handleProcessPlay = async (playId: string, playName: string, e: React.MouseEvent) => {
    e.stopPropagation();

    if (!session?.access_token) {
      alert('You must be signed in to process plays.');
      return;
    }

    if (!confirm(`Process "${playName}"? This will analyze the play and generate assignments and questions.`)) {
      return;
    }

    try {
      setIsUpdating(true);
      await processPlay(playId, {
        generateInsights: true,
        generateAssignments: true,
        generateKnowledge: true,
      });
      alert('Processing started! Check back in a few minutes.');
      await refetch();
    } catch (error) {
      console.error('Error processing play:', error);
      alert('Failed to start processing. Please try again.');
    } finally {
      setIsUpdating(false);
    }
  };

  const quickPractice = async (playId: string) => {
    if (!orgId) {
      alert('Organization ID not found. Please try refreshing the page.');
      return;
    }

    try {
      // Start an ad-hoc game with just this play
      const result = await playerGamesAPI.startGame({
        adHocFilters: {
          playIds: [playId],
          difficulty: ['beginner', 'intermediate', 'advanced'],
        },
        questionCount: 10,
      }, orgId);

      // Store questions in sessionStorage
      sessionStorage.setItem(`game_${result.attemptId}`, JSON.stringify(result.questions));

      router.push(`/games-center/play/${result.attemptId}`);
    } catch (error) {
      console.error('Failed to start practice:', error);

      // Show more helpful error message
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      if (errorMessage.includes('No questions')) {
        alert('This play has no questions yet. Try processing it again or check if the questions were generated successfully.');
      } else {
        alert(`Failed to start practice: ${errorMessage}`);
      }
    }
  };

  const togglePlaySelection = (playId: string) => {
    setSelectedPlayIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(playId)) {
        newSet.delete(playId);
      } else {
        newSet.add(playId);
      }
      return newSet;
    });
  };

  const toggleSelectAll = () => {
    if (selectedPlayIds.size === filteredPlays.length) {
      setSelectedPlayIds(new Set());
    } else {
      setSelectedPlayIds(new Set(filteredPlays.map(p => p.id)));
    }
  };

  const handleBatchProcess = async () => {
    if (!session || !orgId) {
      alert('Please log in to process plays');
      return;
    }

    if (selectedPlayIds.size === 0) {
      alert('Please select at least one play to process');
      return;
    }

    if (selectedPlayIds.size > 10) {
      alert('Maximum 10 plays can be processed at once');
      return;
    }

    const confirmMessage = `Process ${selectedPlayIds.size} selected play(s)?\n\nThis will generate:\n• Insights\n• Assignments\n• Knowledge cards`;

    if (!confirm(confirmMessage)) {
      return;
    }

    setIsBatchProcessing(true);

    try {
      const playIdsArray = Array.from(selectedPlayIds);

      // Call batch process API directly
      const baseURL = window.location.hostname === 'localhost'
        ? 'http://localhost:8888/.netlify/functions'
        : '/.netlify/functions';

      const response = await fetch(`${baseURL}/player-plays-batch-process?orgId=${orgId}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          playIds: playIdsArray,
          generateInsights: true,
          generateAssignments: true,
          generateKnowledge: true,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to batch process');
      }

      const result = await response.json();

      alert(`Successfully started processing ${result.processingCount} play(s)!\n\nProcessing in background. Check back in a minute to see results.\n\nTip: Failed plays will show a "🔄 Retry" button.`);
      setSelectedPlayIds(new Set());

      // Refetch to update statuses - poll multiple times to catch updates
      setTimeout(() => refetch(), 1000);
      setTimeout(() => refetch(), 5000);
      setTimeout(() => refetch(), 10000);
    } catch (error) {
      console.error('Failed to batch process:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      alert(`Failed to start batch processing: ${errorMessage}`);
    } finally {
      setIsBatchProcessing(false);
    }
  };

  const addToGames = (playId: string) => {
    // Navigate to games-center with play pre-selected (query param)
    router.push(`/games-center?play=${playId}`);
  };

  const handleDeletePlay = async (playId: string, playName: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm(`Delete "${playName}"? This will permanently remove the play, flashcards, assignments, and associated files. This cannot be undone.`)) {
      return;
    }

    try {
      setIsUpdating(true);
      await deletePlay(playId);
      alert('Play deleted successfully');
      await refetch();
    } catch (error) {
      console.error('Error deleting play:', error);
      alert('Failed to delete play. Please try again.');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleViewPlay = (playId: string) => {
    setViewingPlayId(playId);
    setCurrentView('view');
  };

  const handleUploadComplete = async (files: Array<{fileData: string, fileName: string, fileType: string, metadata?: PlaybookMetadataInput}>) => {
    try {
      if (!session?.access_token || !orgId) {
        alert('Authentication error. Please sign in.');
        return;
      }

      console.log('[Player Upload] Starting upload for', files.length, 'files');

      // Upload all files to player library in parallel
      const uploadPromises = files.map(file => {
        console.log('[Player Upload] Uploading file:', file.fileName);

        const baseURL = typeof window !== 'undefined' &&
          (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
          ? 'http://localhost:8888/.netlify/functions'
          : '/.netlify/functions';

        return fetch(`${baseURL}/player-playbooks?orgId=${orgId}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({
            fileData: file.fileData,
            fileName: file.fileName,
            metadata: file.metadata,
          }),
        });
      });

      const responses = await Promise.all(uploadPromises);

      // Check responses and log any errors
      for (let i = 0; i < responses.length; i++) {
        const response = responses[i];
        if (!response.ok) {
          const errorText = await response.text();
          console.error(`[Player Upload] File ${i} failed:`, response.status, errorText);
        } else {
          const result = await response.json();
          console.log(`[Player Upload] File ${i} succeeded:`, result);
        }
      }

      const failedUploads = responses.filter(r => !r.ok);
      if (failedUploads.length > 0) {
        throw new Error(`Failed to upload ${failedUploads.length} of ${files.length} files`);
      }

      console.log('[Player Upload] All files uploaded successfully');
      alert(`Successfully uploaded ${files.length} file(s) to your library`);

      // Refresh plays list and go back to list view
      await refetch();
      setCurrentView('list');
    } catch (error) {
      console.error('[Player Upload] Error uploading files:', error);
      alert(`Failed to upload files: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  // Upload screen view
  if (currentView === 'upload') {
    return (
      <SidebarLayout>
        <FileUploadScreen
          onBack={() => setCurrentView('list')}
          onUploadComplete={handleUploadComplete}
        />
      </SidebarLayout>
    );
  }

  // Play builder view
  if (currentView === 'create') {
    if (loadingStructuredData) {
      return (
        <SidebarLayout>
          <div className="flex items-center justify-center h-screen bg-[#0A0A0A]">
            <div className="text-center">
              <div className="h-12 w-12 mx-auto mb-4 animate-spin rounded-full border-4 border-[#00F6E5]/20 border-t-[#00F6E5]" />
              <p className="text-slate-400">Loading Play Builder...</p>
            </div>
          </div>
        </SidebarLayout>
      );
    }

    return (
      <SidebarLayout>
        <PlayBuilder
          onBack={() => setCurrentView('list')}
          onSave={async (playData, metadata) => {
            try {
              // Create the play using the existing API
              await createPlay({
                name: playData.metadata.name,
                unit: metadata?.unit || 'O',
                sectionName: metadata?.formation_name || '',
                playType: playData.metadata.playType,
                concept: playData.metadata.concept,
                formationName: playData.metadata.formation,
                diagramData: {
                  mode: playData.mode,
                  offensePlayers: playData.offensePlayers,
                  defensePlayers: playData.defensePlayers,
                  routes: playData.routes,
                  blocking: playData.blocking,
                  ballCarrierPath: playData.ballCarrierPath,
                },
                // Add structured metadata if available
                ...(metadata?.sideOfBall && {
                  sideOfBall: metadata.sideOfBall,
                  structuredPlayType: metadata.structuredPlayType,
                  situationalTags: metadata.situationalTags,
                  conceptTags: metadata.conceptTags,
                  formationId: metadata.formationId,
                  installPhase: metadata.installPhase,
                  defensiveLook: metadata.defensiveLook,
                  offensiveLook: metadata.offensiveLook,
                }),
              });

              await refetch();
              setCurrentView('list');
            } catch (error) {
              console.error('Error creating play:', error);
              alert('Failed to create play. Please try again.');
            }
          }}
          orgId={orgId}
          mode="player"
          situationalTags={situationalTags.map(tag => ({
            id: tag.id,
            name: tag.name,
            category: tag.category,
          }))}
          conceptTags={conceptTags.map(tag => ({
            id: tag.id,
            name: tag.name,
          }))}
          formations={formations.map(f => ({
            id: f.id,
            name: f.name,
            sideOfBall: f.sideOfBall,
          }))}
        />
      </SidebarLayout>
    );
  }

  // View play view
  if (currentView === 'view' && viewingPlayId) {
    return <ViewPlayScreen playId={viewingPlayId} onBack={() => setCurrentView('list')} orgId={orgId} />;
  }

  // Only show loading UI on initial load, not during background polling
  if (authLoading || (loading && isInitialLoad)) {
    return (
      <SidebarLayout>
        <div className="flex items-center justify-center h-screen">
          <div className="text-center">
            <div className="h-12 w-12 mx-auto mb-4 animate-spin rounded-full border-4 border-[#00F6E5]/20 border-t-[#00F6E5]" />
            <p className="text-slate-400">Loading your library...</p>
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
            <h2 className="text-xl font-bold text-white mb-2">Error Loading Library</h2>
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

  const filteredIds = new Set(filteredPlays.map(p => p.id));

  return (
    <SidebarLayout>
      <main className="mx-auto max-w-[1600px] px-4 py-8 lg:px-8">
        {/* Header */}
        <header className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-black tracking-tight text-white lg:text-4xl mb-2">
                My Learning Library
              </h1>
              <p className="text-slate-400">
                Create and manage your personal study materials
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setCurrentView('create')}
                className="px-4 py-2 rounded-lg bg-[#1B1E20] text-white text-sm font-semibold hover:bg-[#2A2E30] transition-all flex items-center gap-2"
              >
                <PlusIcon className="h-4 w-4" />
                Create Play
              </button>
              <button
                onClick={() => setCurrentView('upload')}
                className="px-4 py-2 rounded-lg bg-[#00F6E5] text-black text-sm font-semibold hover:bg-[#00F6E5]/90 transition-all flex items-center gap-2"
              >
                <UploadIcon className="h-4 w-4" />
                Upload Plays
              </button>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
            <div className="glass-card p-4">
              <div className="text-2xl font-black text-[#00F6E5]">{stats.total}</div>
              <div className="text-xs text-slate-400 uppercase tracking-wider">Total Plays</div>
            </div>
            <div className="glass-card p-4">
              <div className="text-2xl font-black text-blue-400">{stats.offense}</div>
              <div className="text-xs text-slate-400 uppercase tracking-wider">Offense</div>
            </div>
            <div className="glass-card p-4">
              <div className="text-2xl font-black text-red-400">{stats.defense}</div>
              <div className="text-xs text-slate-400 uppercase tracking-wider">Defense</div>
            </div>
            <div className="glass-card p-4">
              <div className="text-2xl font-black text-green-400">{stats.approved}</div>
              <div className="text-xs text-slate-400 uppercase tracking-wider">Ready</div>
            </div>
            <div className="glass-card p-4">
              <div className="text-2xl font-black text-yellow-400">{stats.generating}</div>
              <div className="text-xs text-slate-400 uppercase tracking-wider">Generating</div>
            </div>
            {stats.failed > 0 && (
              <div className="glass-card p-4 border-red-500/30">
                <div className="text-2xl font-black text-red-400">{stats.failed}</div>
                <div className="text-xs text-slate-400 uppercase tracking-wider">Failed</div>
              </div>
            )}
          </div>

          {/* Batch Processing Controls */}
          {filteredPlays.length > 0 && (
            <div className="flex items-center justify-between p-4 bg-[#1B1E20] rounded-lg border border-[#2A2F33]">
              <div className="flex items-center gap-3">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedPlayIds.size === filteredPlays.length && filteredPlays.length > 0}
                    onChange={toggleSelectAll}
                    className="w-4 h-4 rounded border-[#2A2F33] bg-[#0A0A0A] text-[#00F6E5] focus:ring-[#00F6E5]"
                  />
                  <span className="text-sm text-slate-300">
                    Select All ({selectedPlayIds.size} of {filteredPlays.length} selected)
                  </span>
                </label>
              </div>

              <button
                onClick={handleBatchProcess}
                disabled={selectedPlayIds.size === 0 || isBatchProcessing}
                className="px-4 py-2 bg-[#00F6E5] text-black font-semibold rounded-lg hover:bg-[#00D4C7] transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {isBatchProcessing ? (
                  <>
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-black border-t-transparent" />
                    Processing...
                  </>
                ) : (
                  <>
                    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                      <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
                    </svg>
                    Process Selected ({selectedPlayIds.size})
                  </>
                )}
              </button>
            </div>
          )}

          {/* Filters */}
          <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
            <input
              type="text"
              placeholder="Search plays..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 px-4 py-2 rounded-lg bg-[#1B1E20] border border-[#2A2E30] text-white placeholder-slate-500 focus:border-[#00F6E5] focus:outline-none"
            />

            <select
              value={selectedUnit}
              onChange={(e) => setSelectedUnit(e.target.value as Unit | 'all')}
              className="px-4 py-2 rounded-lg bg-[#1B1E20] border border-[#2A2E30] text-white focus:border-[#00F6E5] focus:outline-none"
            >
              <option value="all">All Units</option>
              <option value="O">Offense</option>
              <option value="D">Defense</option>
              <option value="ST">Special Teams</option>
            </select>

            {availableSections.length > 0 && (
              <select
                value={selectedSection}
                onChange={(e) => setSelectedSection(e.target.value)}
                className="px-4 py-2 rounded-lg bg-[#1B1E20] border border-[#2A2E30] text-white focus:border-[#00F6E5] focus:outline-none"
              >
                <option value="all">All Sections</option>
                {availableSections.map((section) => (
                  <option key={section} value={section}>
                    {section}
                  </option>
                ))}
              </select>
            )}

            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="px-4 py-2 rounded-lg bg-[#1B1E20] border border-[#2A2E30] text-white focus:border-[#00F6E5] focus:outline-none"
            >
              <option value="all">All Statuses</option>
              <option value="draft">Draft</option>
              <option value="approved">Ready</option>
              <option value="generating">Generating</option>
              <option value="rejected">Failed</option>
            </select>
          </div>
        </header>

        {/* Content */}
        {filteredPlays.length === 0 ? (
          <div className="glass-card p-12 text-center">
            <div className="text-slate-400 mb-2">No plays found</div>
            <p className="text-sm text-slate-500">
              {searchQuery || selectedUnit !== 'all' || selectedSection !== 'all'
                ? 'Try adjusting your filters'
                : 'Upload plays or create from scratch to build your library'}
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {(['O', 'D', 'ST'] as Unit[]).map((unit) => {
              const unitPlays = organizedPlays[unit].filter(play => filteredIds.has(play.id));

              if (unitPlays.length === 0) return null;

              const unitConfig = {
                O: { label: 'Offense', color: 'blue-400', icon: '⚡' },
                D: { label: 'Defense', color: 'red-400', icon: '🛡️' },
                ST: { label: 'Special Teams', color: 'yellow-400', icon: '⭐' },
              };

              const config = unitConfig[unit];

              return (
                <div key={unit} className="glass-card overflow-hidden">
                  <button
                    onClick={() => toggleUnit(unit)}
                    className="w-full px-6 py-4 bg-[#1B1E20] hover:bg-[#2A2E30] transition-colors flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{config.icon}</span>
                      <h2 className={`text-2xl font-black text-${config.color}`}>
                        {config.label}
                      </h2>
                      <span className="text-sm text-slate-500 ml-2">({unitPlays.length})</span>
                    </div>
                    <ChevronIcon className={`h-5 w-5 text-slate-400 transition-transform ${expandedUnits[unit] ? 'rotate-180' : ''}`} />
                  </button>

                  {expandedUnits[unit] && (
                    <div className="divide-y divide-[#2A2E30]">
                      {unitPlays.map((play) => (
                        <div
                          key={play.id}
                          className="px-6 py-4 hover:bg-[#1B1E20]/50 transition-colors cursor-pointer"
                          onClick={() => handleViewPlay(play.id)}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3 flex-1">
                              <input
                                type="checkbox"
                                checked={selectedPlayIds.has(play.id)}
                                onChange={(e) => {
                                  e.stopPropagation();
                                  togglePlaySelection(play.id);
                                }}
                                onClick={(e) => e.stopPropagation()}
                                className="w-4 h-4 rounded border-[#2A2F33] bg-[#0A0A0A] text-[#00F6E5] focus:ring-[#00F6E5] cursor-pointer"
                              />
                              <div className="flex-1">
                                <h3 className="text-white font-semibold mb-1">{play.name}</h3>
                              <div className="flex items-center gap-3 text-sm text-slate-400">
                                {play.concept && <span>{play.concept}</span>}
                                {play.playbookSection && <span>• {play.playbookSection}</span>}
                                <span
                                  className={`px-2 py-0.5 rounded text-xs font-semibold ${
                                    play.contentStatus === 'approved'
                                      ? 'bg-green-900/30 text-green-400'
                                      : play.contentStatus === 'generating'
                                      ? 'bg-yellow-900/30 text-yellow-400'
                                      : play.contentStatus === 'rejected'
                                      ? 'bg-red-900/30 text-red-400'
                                      : 'bg-slate-800 text-slate-400'
                                  }`}
                                >
                                  {play.contentStatus === 'rejected' ? '❌ Failed' : play.contentStatus}
                                </span>
                              </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                              {play.contentStatus === 'rejected' && (
                                <button
                                  onClick={(e) => handleProcessPlay(play.id, play.name, e)}
                                  disabled={isUpdating}
                                  className="px-3 py-1.5 text-sm font-semibold bg-orange-600 text-white rounded-lg hover:bg-orange-500 transition-colors disabled:opacity-50 flex items-center gap-1.5"
                                  title={play.aiInsights ? play.aiInsights.substring(0, 200) : 'Processing failed - click to retry'}
                                >
                                  🔄 Retry
                                </button>
                              )}
                              {play.contentStatus !== 'approved' && play.contentStatus !== 'generating' && play.contentStatus !== 'rejected' && (
                                <button
                                  onClick={(e) => handleProcessPlay(play.id, play.name, e)}
                                  disabled={isUpdating}
                                  className="px-3 py-1.5 text-sm font-semibold bg-[#00F6E5] text-black rounded-lg hover:bg-[#00F6E5]/90 transition-colors disabled:opacity-50"
                                >
                                  Process
                                </button>
                              )}
                              {play.contentStatus === 'generating' && (
                                <span className="px-3 py-1.5 text-sm font-semibold text-yellow-400 flex items-center gap-2">
                                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-yellow-400 border-t-transparent" />
                                  Processing...
                                </span>
                              )}
                              {play.contentStatus === 'approved' && (
                                <>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      router.push(`/learning-center/flashcards/${play.id}`);
                                    }}
                                    className="px-3 py-1.5 text-sm font-semibold bg-purple-600 text-white rounded-lg hover:bg-purple-500 transition-colors flex items-center gap-1.5"
                                  >
                                    <SparklesIconSmall className="h-4 w-4" />
                                    Study
                                  </button>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      quickPractice(play.id);
                                    }}
                                    className="px-3 py-1.5 text-sm font-semibold bg-[#00F6E5] text-black rounded-lg hover:bg-[#00D4C7] transition-colors flex items-center gap-1.5"
                                  >
                                    🎮 Practice Game
                                  </button>
                                </>
                              )}
                              <button
                                onClick={(e) => handleDeletePlay(play.id, play.name, e)}
                                disabled={isUpdating}
                                className="px-3 py-1.5 text-sm font-semibold text-red-400 hover:text-red-300 transition-colors disabled:opacity-50"
                              >
                                Delete
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </main>
    </SidebarLayout>
  );
}

// Icons
function PlusIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  );
}

function UploadIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="17 8 12 3 7 8" />
      <line x1="12" y1="3" x2="12" y2="15" />
    </svg>
  );
}

function ChevronIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <polyline points="6 9 12 15 18 9" />
    </svg>
  );
}

function SparklesIconSmall({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path fillRule="evenodd" d="M9 4.5a.75.75 0 01.721.544l.813 2.846a3.75 3.75 0 002.576 2.576l2.846.813a.75.75 0 010 1.442l-2.846.813a3.75 3.75 0 00-2.576 2.576l-.813 2.846a.75.75 0 01-1.442 0l-.813-2.846a3.75 3.75 0 00-2.576-2.576l-2.846-.813a.75.75 0 010-1.442l2.846-.813A3.75 3.75 0 007.466 7.89l.813-2.846A.75.75 0 019 4.5zM18 1.5a.75.75 0 01.728.568l.258 1.036c.236.94.97 1.674 1.91 1.91l1.036.258a.75.75 0 010 1.456l-1.036.258c-.94.236-1.674.97-1.91 1.91l-.258 1.036a.75.75 0 01-1.456 0l-.258-1.036a2.625 2.625 0 00-1.91-1.91l-1.036-.258a.75.75 0 010-1.456l1.036-.258a2.625 2.625 0 001.91-1.91l.258-1.036A.75.75 0 0118 1.5zM16.5 15a.75.75 0 01.712.513l.394 1.183c.15.447.5.799.948.948l1.183.395a.75.75 0 010 1.422l-1.183.395c-.447.15-.799.5-.948.948l-.395 1.183a.75.75 0 01-1.422 0l-.395-1.183a1.5 1.5 0 00-.948-.948l-1.183-.395a.75.75 0 010-1.422l1.183-.395c.447-.15.799-.5.948-.948l.395-1.183A.75.75 0 0116.5 15z" clipRule="evenodd" />
    </svg>
  );
}
