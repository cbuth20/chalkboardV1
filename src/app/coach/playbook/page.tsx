"use client";

import React, { useState, useMemo } from 'react';
import { SidebarLayout } from '@/components/SidebarLayout';
import { useAuth } from '@/contexts/AuthContext';
import { usePlays, useUpdatePlayStatus, useUpdatePlay, UpdatePlayRequest } from '@/hooks/usePlaysAPI';
import { Play, Unit } from '@/lib/api/plays';
import { FileUploadScreen } from '@/components/play-recognition/FileUploadScreen';
import { PlayBuilder, BuiltPlayData } from '@/components/play-recognition/PlayBuilder';
import { PlaybookMetadataInput } from '@/types/playbook-metadata';
import { getPlaybooksApiUrl } from '@/lib/api-config';

type ViewState = 'list' | 'upload' | 'create';

export default function CoachPlaybookPage() {
  const { orgId, teamId, userRole, loading: authLoading } = useAuth();
  const { plays, loading, error, refetch } = usePlays({});
  const { updateStatus } = useUpdatePlayStatus();
  const { updatePlay } = useUpdatePlay();

  const [currentView, setCurrentView] = useState<ViewState>('list');

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUnit, setSelectedUnit] = useState<Unit | 'all'>('all');
  const [selectedSection, setSelectedSection] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [expandedPlayId, setExpandedPlayId] = useState<string | null>(null);
  const [editingPlayId, setEditingPlayId] = useState<string | null>(null);
  const [editFormData, setEditFormData] = useState<UpdatePlayRequest>({});
  const [isUpdating, setIsUpdating] = useState(false);
  const [expandedUnits, setExpandedUnits] = useState<Record<Unit, boolean>>({
    O: true,
    D: true,
    ST: true,
  });

  // Organize plays by unit
  const organizedPlays = useMemo(() => {
    const organized: Record<Unit, Play[]> = {
      O: [],
      D: [],
      ST: [],
    };

    plays.forEach((play) => {
      const unit = play.unit || 'O';
      organized[unit].push(play);
    });

    // Sort plays within each unit by name
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

  // Stats by unit and status
  const stats = useMemo(() => {
    return {
      total: plays.length,
      offense: plays.filter(p => p.unit === 'O').length,
      defense: plays.filter(p => p.unit === 'D').length,
      specialTeams: plays.filter(p => p.unit === 'ST').length,
      uncategorized: plays.filter(p => !p.unit).length,
      draft: plays.filter(p => p.contentStatus === 'draft').length,
      approved: plays.filter(p => p.contentStatus === 'approved').length,
      generating: plays.filter(p => p.contentStatus === 'generating').length,
      rejected: plays.filter(p => p.contentStatus === 'rejected').length,
      published: plays.filter(p => p.isPublished).length,
      unpublished: plays.filter(p => !p.isPublished).length,
    };
  }, [plays]);

  const toggleUnit = (unit: Unit) => {
    setExpandedUnits(prev => ({ ...prev, [unit]: !prev[unit] }));
  };

  const handleRowClick = (playId: string) => {
    if (editingPlayId === playId) return; // Don't collapse if editing
    setExpandedPlayId(expandedPlayId === playId ? null : playId);
  };

  const handleEditClick = (play: Play, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingPlayId(play.id);
    setEditFormData({
      name: play.name,
      shortName: play.shortName,
      playType: play.playType,
      formationName: play.formationName,
      concept: play.concept,
      unit: play.unit,
      playbookSection: play.playbookSection,
      primaryClassification: play.primaryClassification,
      situation: play.situation,
    });
    setExpandedPlayId(play.id);
  };

  const handleCancelEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingPlayId(null);
    setEditFormData({});
  };

  const handleSaveEdit = async (playId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      setIsUpdating(true);
      await updatePlay(playId, editFormData);
      setEditingPlayId(null);
      setEditFormData({});
      await refetch();
    } catch (error) {
      console.error('Error updating play:', error);
      alert('Failed to update play. Please try again.');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleTogglePublish = async (playId: string, playName: string, currentStatus: boolean, e: React.MouseEvent) => {
    e.stopPropagation();
    const action = currentStatus ? 'unpublish' : 'publish';
    const message = currentStatus
      ? `Unpublish "${playName}"? It will be hidden from players but can be republished later.`
      : `Publish "${playName}"? It will become visible to players.`;

    if (!confirm(message)) {
      return;
    }

    try {
      setIsUpdating(true);
      await updateStatus(playId, { isPublished: !currentStatus });
      alert(`Play ${action}ed successfully`);
      refetch();
    } catch (error) {
      console.error(`Error ${action}ing play:`, error);
      alert(`Failed to ${action} play. Please try again.`);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleStatusChange = async (playId: string, newStatus: Play['contentStatus'], e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      setIsUpdating(true);
      await updateStatus(playId, { contentStatus: newStatus });
      await refetch();
    } catch (error) {
      console.error('Error updating status:', error);
      alert('Failed to update status. Please try again.');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleUploadClick = () => {
    setCurrentView('upload');
  };

  const handleCreatePlayClick = () => {
    setCurrentView('create');
  };

  const handleBackToList = () => {
    setCurrentView('list');
  };

  const handleUploadComplete = async (files: Array<{fileData: string, fileName: string, fileType: string, metadata?: PlaybookMetadataInput}>) => {
    try {
      if (!orgId) {
        alert('Authentication error. Please sign in.');
        return;
      }

      console.log('[Upload] Starting upload for', files.length, 'files');
      console.log('[Upload] Auth context:', { orgId, teamId });

      const apiUrl = getPlaybooksApiUrl();

      // Upload all files in parallel
      const uploadPromises = files.map(file => {
        console.log('[Upload] Uploading file:', file.fileName);
        console.log('[Upload] Metadata:', file.metadata);

        return fetch(apiUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            fileName: file.fileName,
            fileData: file.fileData,
            metadata: file.metadata,
            orgId,
            teamId,
          }),
        });
      });

      const responses = await Promise.all(uploadPromises);

      // Check responses and log any errors
      for (let i = 0; i < responses.length; i++) {
        const response = responses[i];
        if (!response.ok) {
          const errorText = await response.text();
          console.error(`[Upload] File ${i} failed:`, response.status, errorText);
        } else {
          const result = await response.json();
          console.log(`[Upload] File ${i} succeeded:`, result);
        }
      }

      // Check if all uploads succeeded
      const failedUploads = responses.filter(r => !r.ok);
      if (failedUploads.length > 0) {
        throw new Error(`Failed to upload ${failedUploads.length} of ${files.length} files`);
      }

      console.log('[Upload] All files uploaded successfully');
      alert(`Successfully uploaded ${files.length} file(s)`);

      // Refresh plays list and go back to list view
      await refetch();
      setCurrentView('list');
    } catch (error) {
      console.error('[Upload] Error uploading files:', error);
      alert(`Failed to upload files: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const handlePlayBuilt = async (playData: BuiltPlayData, metadata?: PlaybookMetadataInput) => {
    try {
      if (!orgId) {
        alert('Authentication error. Please sign in.');
        return;
      }

      const apiUrl = getPlaybooksApiUrl();
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fileName: `built-play-${Date.now()}.json`,
          playData,
          metadata,
          orgId,
          teamId,
          isBuiltPlay: true,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to save built play');
      }

      alert('Play created successfully!');

      // Refresh plays list and go back to list view
      await refetch();
      setCurrentView('list');
    } catch (error) {
      console.error('Error saving built play:', error);
      alert('Failed to save play. Please try again.');
    }
  };

  // Show file upload screen
  if (currentView === 'upload') {
    return (
      <SidebarLayout>
        <FileUploadScreen onUploadComplete={handleUploadComplete} onBack={handleBackToList} />
      </SidebarLayout>
    );
  }

  // Show play builder screen
  if (currentView === 'create') {
    return (
      <SidebarLayout>
        <PlayBuilder onSave={handlePlayBuilt} onBack={handleBackToList} />
      </SidebarLayout>
    );
  }

  if (authLoading || loading) {
    return (
      <SidebarLayout>
        <div className="flex items-center justify-center h-screen">
          <div className="text-center">
            <div className="h-12 w-12 mx-auto mb-4 animate-spin rounded-full border-4 border-[#00F6E5]/20 border-t-[#00F6E5]" />
            <p className="text-slate-400">Loading playbook...</p>
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
              No organization found. Please sign in or check your browser console for errors.
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
            <h2 className="text-xl font-bold text-white mb-2">Error Loading Playbook</h2>
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
                Team Playbook
              </h1>
              <p className="text-slate-400">
                Manage and organize your team's plays
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={handleCreatePlayClick}
                className="px-4 py-2 rounded-lg bg-[#1B1E20] text-white text-sm font-semibold hover:bg-[#2A2E30] transition-all flex items-center gap-2"
              >
                <PlusIcon className="h-4 w-4" />
                Create Play
              </button>
              <button
                onClick={handleUploadClick}
                className="px-4 py-2 rounded-lg bg-[#00F6E5] text-black text-sm font-semibold hover:bg-[#00F6E5]/90 transition-all flex items-center gap-2"
              >
                <UploadIcon className="h-4 w-4" />
                Upload Plays
              </button>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-6 gap-4 mb-6">
            <div className="glass-card p-4">
              <div className="text-2xl font-black text-[#00F6E5]">{stats.total}</div>
              <div className="text-xs text-slate-400 uppercase tracking-wider">Total Plays</div>
            </div>
            <div className="glass-card p-4">
              <div className="text-2xl font-black text-green-400">{stats.published}</div>
              <div className="text-xs text-slate-400 uppercase tracking-wider">Published</div>
            </div>
            <div className="glass-card p-4">
              <div className="text-2xl font-black text-orange-400">{stats.unpublished}</div>
              <div className="text-xs text-slate-400 uppercase tracking-wider">Unpublished</div>
            </div>
            <div className="glass-card p-4">
              <div className="text-2xl font-black text-green-400">{stats.approved}</div>
              <div className="text-xs text-slate-400 uppercase tracking-wider">Content Approved</div>
            </div>
            <div className="glass-card p-4">
              <div className="text-2xl font-black text-yellow-400">{stats.draft}</div>
              <div className="text-xs text-slate-400 uppercase tracking-wider">Draft</div>
            </div>
            <div className="glass-card p-4">
              <div className="text-2xl font-black text-blue-400">{stats.generating}</div>
              <div className="text-xs text-slate-400 uppercase tracking-wider">Generating</div>
            </div>
          </div>

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
              <option value="approved">Approved</option>
              <option value="generating">Generating</option>
              <option value="rejected">Rejected</option>
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
                : 'Upload plays from the Scanner page to get started'}
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {(['O', 'D', 'ST'] as Unit[]).map((unit) => {
              const unitPlays = organizedPlays[unit].filter(play => filteredIds.has(play.id));

              if (unitPlays.length === 0) return null;

              const unitConfig = {
                O: { label: 'Offense', color: 'blue-400', bgColor: 'blue-900/20', icon: '⚡' },
                D: { label: 'Defense', color: 'red-400', bgColor: 'red-900/20', icon: '🛡️' },
                ST: { label: 'Special Teams', color: 'yellow-400', bgColor: 'yellow-900/20', icon: '⭐' },
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
                      <span className="text-slate-400 text-sm font-semibold">
                        ({unitPlays.length} plays)
                      </span>
                    </div>
                    <span className="text-slate-400 text-xl">
                      {expandedUnits[unit] ? '▼' : '▶'}
                    </span>
                  </button>

                  {expandedUnits[unit] && (
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b border-[#1B1E20] bg-[#0D1117]">
                            <th className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">
                              Play Name
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">
                              Section
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">
                              Classification
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">
                              Formation
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">
                              Type
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">
                              Published
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">
                              Content Status
                            </th>
                            <th className="px-4 py-3 text-right text-xs font-semibold text-slate-400 uppercase tracking-wider">
                              Actions
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {unitPlays.map((play) => (
                            <React.Fragment key={play.id}>
                              <tr
                                onClick={() => handleRowClick(play.id)}
                                className={`border-b border-[#1B1E20]/50 transition-colors cursor-pointer ${
                                  expandedPlayId === play.id ? 'bg-[#00F6E5]/5' : 'hover:bg-[#1B1E20]/30'
                                }`}
                              >
                                <td className="px-4 py-3">
                                  <div className="font-semibold text-white">{play.name}</div>
                                  {play.shortName && (
                                    <div className="text-xs text-slate-500">{play.shortName}</div>
                                  )}
                                </td>
                                <td className="px-4 py-3 text-slate-300 text-sm">
                                  {play.playbookSection || '-'}
                                </td>
                                <td className="px-4 py-3 text-slate-300 text-sm">
                                  {play.primaryClassification || '-'}
                                </td>
                                <td className="px-4 py-3 text-slate-300 text-sm">
                                  {play.formationName || '-'}
                                </td>
                                <td className="px-4 py-3">
                                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded ${
                                    play.playType === 'PASS' ? 'bg-blue-900/20 text-blue-400' :
                                    play.playType === 'RUN' ? 'bg-green-900/20 text-green-400' :
                                    play.playType === 'RPO' ? 'bg-purple-900/20 text-purple-400' :
                                    'bg-slate-700/20 text-slate-400'
                                  }`}>
                                    {play.playType}
                                  </span>
                                </td>
                                <td className="px-4 py-3">
                                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded ${
                                    play.isPublished ? 'bg-green-900/20 text-green-400' : 'bg-orange-900/20 text-orange-400'
                                  }`}>
                                    {play.isPublished ? 'Published' : 'Unpublished'}
                                  </span>
                                </td>
                                <td className="px-4 py-3">
                                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded ${
                                    play.contentStatus === 'approved' ? 'bg-green-900/20 text-green-400' :
                                    play.contentStatus === 'draft' ? 'bg-yellow-900/20 text-yellow-400' :
                                    play.contentStatus === 'generating' ? 'bg-blue-900/20 text-blue-400' :
                                    play.contentStatus === 'rejected' ? 'bg-red-900/20 text-red-400' :
                                    'bg-slate-700/20 text-slate-400'
                                  }`}>
                                    {play.contentStatus}
                                  </span>
                                </td>
                                <td className="px-4 py-3 text-right">
                                  <button
                                    onClick={(e) => handleEditClick(play, e)}
                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#00F6E5]/10 text-[#00F6E5] text-xs font-semibold hover:bg-[#00F6E5]/20 transition-all"
                                  >
                                    Edit
                                  </button>
                                </td>
                              </tr>

                              {/* Expanded Row - Play Details */}
                              {expandedPlayId === play.id && (
                                <tr className="bg-[#0D1117] border-b border-[#1B1E20]">
                                  <td colSpan={8} className="px-6 py-6">
                                    {editingPlayId === play.id ? (
                                      <PlayEditForm
                                        play={play}
                                        formData={editFormData}
                                        onFormChange={setEditFormData}
                                        onSave={(e) => handleSaveEdit(play.id, e)}
                                        onCancel={handleCancelEdit}
                                        isUpdating={isUpdating}
                                      />
                                    ) : (
                                      <PlayDetailsView
                                        play={play}
                                        onEdit={(e) => handleEditClick(play, e)}
                                        onTogglePublish={(e) => handleTogglePublish(play.id, play.name, play.isPublished, e)}
                                        onStatusChange={(status, e) => handleStatusChange(play.id, status, e)}
                                        isUpdating={isUpdating}
                                      />
                                    )}
                                  </td>
                                </tr>
                              )}
                            </React.Fragment>
                          ))}
                        </tbody>
                      </table>
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

// Play Details View Component
function PlayDetailsView({
  play,
  onEdit,
  onTogglePublish,
  onStatusChange,
  isUpdating,
}: {
  play: Play;
  onEdit: (e: React.MouseEvent) => void;
  onTogglePublish: (e: React.MouseEvent) => void;
  onStatusChange: (status: Play['contentStatus'], e: React.MouseEvent) => void;
  isUpdating: boolean;
}) {
  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-xl font-bold text-white mb-2">{play.name}</h3>
          {play.shortName && (
            <p className="text-slate-400 text-sm mb-1">Short Name: {play.shortName}</p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={onEdit}
            className="px-4 py-2 rounded-lg bg-[#00F6E5] text-black text-sm font-semibold hover:bg-[#00F6E5]/90 transition-all"
          >
            Edit Play
          </button>
          <button
            onClick={onTogglePublish}
            disabled={isUpdating}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all disabled:opacity-50 ${
              play.isPublished
                ? 'bg-orange-900/20 text-orange-400 hover:bg-orange-900/30'
                : 'bg-green-900/20 text-green-400 hover:bg-green-900/30'
            }`}
          >
            {play.isPublished ? 'Unpublish' : 'Publish'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <DetailField label="Play Type" value={play.playType} />
        <DetailField label="Formation" value={play.formationName} />
        <DetailField label="Concept" value={play.concept} />
        <DetailField label="Unit" value={play.unit} />
        <DetailField label="Section" value={play.playbookSection} />
        <DetailField label="Classification" value={play.primaryClassification} />
        <DetailField label="Situation" value={play.situation} />
        <DetailField label="Status" value={play.contentStatus} />
        <DetailField label="Published" value={play.isPublished ? 'Yes' : 'No'} />
      </div>

      {play.aiInsights && (
        <div className="glass-card p-4">
          <h4 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-2">
            AI Insights
          </h4>
          <p className="text-slate-300 text-sm whitespace-pre-wrap">{play.aiInsights}</p>
        </div>
      )}

      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <span className="text-sm text-slate-400 font-semibold">Content Status:</span>
          <button
            onClick={(e) => onStatusChange('approved', e)}
            disabled={isUpdating || play.contentStatus === 'approved'}
            className="px-3 py-1.5 rounded-lg bg-green-900/20 text-green-400 text-xs font-semibold hover:bg-green-900/30 transition-all disabled:opacity-50"
          >
            Approve
          </button>
          <button
            onClick={(e) => onStatusChange('draft', e)}
            disabled={isUpdating || play.contentStatus === 'draft'}
            className="px-3 py-1.5 rounded-lg bg-yellow-900/20 text-yellow-400 text-xs font-semibold hover:bg-yellow-900/30 transition-all disabled:opacity-50"
          >
            Draft
          </button>
          <button
            onClick={(e) => onStatusChange('rejected', e)}
            disabled={isUpdating || play.contentStatus === 'rejected'}
            className="px-3 py-1.5 rounded-lg bg-red-900/20 text-red-400 text-xs font-semibold hover:bg-red-900/30 transition-all disabled:opacity-50"
          >
            Reject
          </button>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-slate-400 font-semibold">Visibility:</span>
          <span className="text-xs text-slate-500">
            {play.isPublished
              ? 'This play is visible to players'
              : 'This play is hidden from players'}
          </span>
        </div>
      </div>
    </div>
  );
}

// Detail Field Component
function DetailField({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className="glass-card p-3">
      <div className="text-xs text-slate-400 uppercase tracking-wider mb-1">{label}</div>
      <div className="text-white font-semibold">{value || '-'}</div>
    </div>
  );
}

// Upload Icon Component
function UploadIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
    </svg>
  );
}

// Plus Icon Component
function PlusIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
    </svg>
  );
}

// Play Edit Form Component
function PlayEditForm({
  play,
  formData,
  onFormChange,
  onSave,
  onCancel,
  isUpdating,
}: {
  play: Play;
  formData: UpdatePlayRequest;
  onFormChange: (data: UpdatePlayRequest) => void;
  onSave: (e: React.MouseEvent) => void;
  onCancel: (e: React.MouseEvent) => void;
  isUpdating: boolean;
}) {
  const handleChange = (field: keyof UpdatePlayRequest, value: string) => {
    onFormChange({ ...formData, [field]: value });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-bold text-white">Edit Play</h3>
        <div className="flex items-center gap-2">
          <button
            onClick={onCancel}
            disabled={isUpdating}
            className="px-4 py-2 rounded-lg bg-[#1B1E20] text-slate-300 text-sm font-semibold hover:bg-[#2A2E30] transition-all disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={onSave}
            disabled={isUpdating}
            className="px-4 py-2 rounded-lg bg-[#00F6E5] text-black text-sm font-semibold hover:bg-[#00F6E5]/90 transition-all disabled:opacity-50"
          >
            {isUpdating ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-semibold text-slate-400 mb-2">Play Name</label>
          <input
            type="text"
            value={formData.name || ''}
            onChange={(e) => handleChange('name', e.target.value)}
            className="w-full px-4 py-2 rounded-lg bg-[#1B1E20] border border-[#2A2E30] text-white focus:border-[#00F6E5] focus:outline-none"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-slate-400 mb-2">Short Name</label>
          <input
            type="text"
            value={formData.shortName || ''}
            onChange={(e) => handleChange('shortName', e.target.value)}
            className="w-full px-4 py-2 rounded-lg bg-[#1B1E20] border border-[#2A2E30] text-white focus:border-[#00F6E5] focus:outline-none"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-slate-400 mb-2">Play Type</label>
          <select
            value={formData.playType || ''}
            onChange={(e) => handleChange('playType', e.target.value)}
            className="w-full px-4 py-2 rounded-lg bg-[#1B1E20] border border-[#2A2E30] text-white focus:border-[#00F6E5] focus:outline-none"
          >
            <option value="">Select Type</option>
            <option value="PASS">Pass</option>
            <option value="RUN">Run</option>
            <option value="RPO">RPO</option>
            <option value="SCREEN">Screen</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-semibold text-slate-400 mb-2">Unit</label>
          <select
            value={formData.unit || ''}
            onChange={(e) => handleChange('unit', e.target.value)}
            className="w-full px-4 py-2 rounded-lg bg-[#1B1E20] border border-[#2A2E30] text-white focus:border-[#00F6E5] focus:outline-none"
          >
            <option value="">Select Unit</option>
            <option value="O">Offense</option>
            <option value="D">Defense</option>
            <option value="ST">Special Teams</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-semibold text-slate-400 mb-2">Formation</label>
          <input
            type="text"
            value={formData.formationName || ''}
            onChange={(e) => handleChange('formationName', e.target.value)}
            className="w-full px-4 py-2 rounded-lg bg-[#1B1E20] border border-[#2A2E30] text-white focus:border-[#00F6E5] focus:outline-none"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-slate-400 mb-2">Concept</label>
          <input
            type="text"
            value={formData.concept || ''}
            onChange={(e) => handleChange('concept', e.target.value)}
            className="w-full px-4 py-2 rounded-lg bg-[#1B1E20] border border-[#2A2E30] text-white focus:border-[#00F6E5] focus:outline-none"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-slate-400 mb-2">Section</label>
          <input
            type="text"
            value={formData.playbookSection || ''}
            onChange={(e) => handleChange('playbookSection', e.target.value)}
            className="w-full px-4 py-2 rounded-lg bg-[#1B1E20] border border-[#2A2E30] text-white focus:border-[#00F6E5] focus:outline-none"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-slate-400 mb-2">Classification</label>
          <input
            type="text"
            value={formData.primaryClassification || ''}
            onChange={(e) => handleChange('primaryClassification', e.target.value)}
            className="w-full px-4 py-2 rounded-lg bg-[#1B1E20] border border-[#2A2E30] text-white focus:border-[#00F6E5] focus:outline-none"
          />
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm font-semibold text-slate-400 mb-2">Situation</label>
          <input
            type="text"
            value={formData.situation || ''}
            onChange={(e) => handleChange('situation', e.target.value)}
            className="w-full px-4 py-2 rounded-lg bg-[#1B1E20] border border-[#2A2E30] text-white focus:border-[#00F6E5] focus:outline-none"
            placeholder="e.g., 3rd & Long, Red Zone, 2-Minute Drill"
          />
        </div>
      </div>
    </div>
  );
}
