"use client";

import React, { useState, useEffect } from 'react';
import { SidebarLayout } from '@/components/SidebarLayout';
import { useAuth } from '@/contexts/AuthContext';

interface Play {
  id: string;
  name: string;
  short_name: string | null;
  formation_name: string | null;
  concept: string | null;
  play_type: string;
  created_at: string;
  playbook_metadata?: {
    formation_name: string | null;
    concept_name: string | null;
    side_of_ball: string | null;
  } | null;
}

export default function CoachPlaybookPage() {
  const { teamId, loading: authLoading } = useAuth();
  const [plays, setPlays] = useState<Play[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [selectedPlays, setSelectedPlays] = useState<Set<string>>(new Set());
  const [isMultiSelectMode, setIsMultiSelectMode] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Fetch approved plays
  const fetchPlays = async () => {
    console.log('[Coach Playbook] fetchPlays called with teamId:', teamId);
    if (!teamId) {
      console.warn('[Coach Playbook] No teamId available, skipping fetch');
      return;
    }

    try {
      setLoading(true);
      console.log('[Coach Playbook] Fetching from:', `/api/get-approved-plays?teamId=${teamId}&type=all`);
      const response = await fetch(`/api/get-approved-plays?teamId=${teamId}&type=all`);
      console.log('[Coach Playbook] Response status:', response.status);
      if (!response.ok) throw new Error('Failed to fetch plays');

      const data = await response.json();
      console.log('[Coach Playbook] Received data:', data);
      setPlays(data.plays || []);
    } catch (error) {
      console.error('[Coach Playbook] Error fetching plays:', error);
      alert('Failed to load plays. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (teamId && !authLoading) {
      fetchPlays();
    } else if (!authLoading) {
      setLoading(false);
    }
  }, [teamId, authLoading]);

  // Filter plays
  const filteredPlays = plays.filter(play => {
    const matchesSearch =
      play.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      play.concept?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      play.formation_name?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesType = filterType === 'all' || play.play_type === filterType;

    return matchesSearch && matchesType;
  });

  // Delete single play
  const handleDeletePlay = async (playId: string, playName: string) => {
    if (!confirm(`Delete "${playName}"? This will remove all assignments and flashcards for this play. This action cannot be undone.`)) {
      return;
    }

    try {
      setIsDeleting(true);
      const response = await fetch(`/api/get-approved-plays?playId=${playId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete play');
      }

      // Remove from local state
      setPlays(prev => prev.filter(p => p.id !== playId));
      alert('Play deleted successfully');
    } catch (error) {
      console.error('[Coach Playbook] Error deleting play:', error);
      alert('Failed to delete play. Please try again.');
    } finally {
      setIsDeleting(false);
    }
  };

  // Delete selected plays
  const handleDeleteSelected = async () => {
    if (selectedPlays.size === 0) return;

    const count = selectedPlays.size;
    if (!confirm(`Delete ${count} play${count > 1 ? 's' : ''}? This will remove all assignments and flashcards. This action cannot be undone.`)) {
      return;
    }

    try {
      setIsDeleting(true);
      const deletePromises = Array.from(selectedPlays).map(playId =>
        fetch(`/api/get-approved-plays?playId=${playId}`, { method: 'DELETE' })
      );

      const results = await Promise.all(deletePromises);
      const failedCount = results.filter(r => !r.ok).length;

      if (failedCount > 0) {
        alert(`${count - failedCount} of ${count} plays deleted. ${failedCount} failed.`);
      } else {
        alert(`${count} play${count > 1 ? 's' : ''} deleted successfully`);
      }

      // Refresh the list
      await fetchPlays();
      setSelectedPlays(new Set());
      setIsMultiSelectMode(false);
    } catch (error) {
      console.error('[Coach Playbook] Error deleting plays:', error);
      alert('Failed to delete plays. Please try again.');
    } finally {
      setIsDeleting(false);
    }
  };

  // Toggle multi-select mode
  const handleToggleMultiSelect = () => {
    setIsMultiSelectMode(!isMultiSelectMode);
    setSelectedPlays(new Set());
  };

  // Toggle play selection
  const handleTogglePlaySelection = (playId: string) => {
    const newSelected = new Set(selectedPlays);
    if (newSelected.has(playId)) {
      newSelected.delete(playId);
    } else {
      newSelected.add(playId);
    }
    setSelectedPlays(newSelected);
  };

  // Select all filtered plays
  const handleSelectAll = () => {
    const allIds = new Set(filteredPlays.map(p => p.id));
    setSelectedPlays(allIds);
  };

  if (authLoading || loading) {
    return (
      <SidebarLayout>
        <div className="flex items-center justify-center h-screen">
          <div className="text-center">
            <div className="h-12 w-12 mx-auto mb-4 animate-spin rounded-full border-4 border-[#00F6E5]/20 border-t-[#00F6E5]" />
            <p className="text-slate-400">Loading playbook...</p>
            {!authLoading && !teamId && (
              <p className="text-xs text-red-400 mt-2">No team ID found - check authentication</p>
            )}
          </div>
        </div>
      </SidebarLayout>
    );
  }

  // Show message if no teamId after loading completes
  if (!authLoading && !loading && !teamId) {
    return (
      <SidebarLayout>
        <div className="flex items-center justify-center h-screen">
          <div className="text-center max-w-md">
            <div className="text-red-400 text-5xl mb-4">⚠️</div>
            <h2 className="text-xl font-bold text-white mb-2">Authentication Issue</h2>
            <p className="text-slate-400 mb-4">
              No team ID found. Please sign in or check your browser console for errors.
            </p>
            <p className="text-xs text-slate-500">
              Team ID: {teamId || 'null'} | Auth Loading: {authLoading.toString()}
            </p>
          </div>
        </div>
      </SidebarLayout>
    );
  }

  return (
    <SidebarLayout>
      <main className="mx-auto max-w-[1400px] px-4 py-8 lg:px-8">
        {/* Header */}
        <header className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-black tracking-tight text-white lg:text-4xl mb-2">
                Team Playbook
              </h1>
              <p className="text-slate-400">
                Manage approved plays for your team
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={handleToggleMultiSelect}
                className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                  isMultiSelectMode
                    ? 'bg-[#00F6E5] text-black'
                    : 'bg-[#1B1E20] text-slate-300 hover:bg-[#2A2E30]'
                }`}
              >
                {isMultiSelectMode ? 'Cancel Multi-Select' : 'Multi-Select'}
              </button>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="glass-card p-4">
              <div className="text-2xl font-black text-[#00F6E5]">{plays.length}</div>
              <div className="text-xs text-slate-400 uppercase tracking-wider">Total Plays</div>
            </div>
            <div className="glass-card p-4">
              <div className="text-2xl font-black text-[#00F6E5]">
                {plays.filter(p => p.play_type === 'PASS').length}
              </div>
              <div className="text-xs text-slate-400 uppercase tracking-wider">Pass Plays</div>
            </div>
            <div className="glass-card p-4">
              <div className="text-2xl font-black text-[#00F6E5]">
                {plays.filter(p => p.play_type === 'RUN').length}
              </div>
              <div className="text-xs text-slate-400 uppercase tracking-wider">Run Plays</div>
            </div>
          </div>

          {/* Filters */}
          <div className="flex items-center gap-4">
            <input
              type="text"
              placeholder="Search plays..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 px-4 py-2 rounded-lg bg-[#1B1E20] border border-[#2A2E30] text-white placeholder-slate-500 focus:border-[#00F6E5] focus:outline-none"
            />
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="px-4 py-2 rounded-lg bg-[#1B1E20] border border-[#2A2E30] text-white focus:border-[#00F6E5] focus:outline-none"
            >
              <option value="all">All Types</option>
              <option value="PASS">Pass</option>
              <option value="RUN">Run</option>
              <option value="RPO">RPO</option>
              <option value="SCREEN">Screen</option>
              <option value="TRICK">Trick</option>
            </select>

            {isMultiSelectMode && selectedPlays.size > 0 && (
              <>
                <button
                  onClick={handleSelectAll}
                  className="px-4 py-2 rounded-lg bg-[#1B1E20] text-slate-300 text-sm font-semibold hover:bg-[#2A2E30] transition-all"
                >
                  Select All ({filteredPlays.length})
                </button>
                <button
                  onClick={handleDeleteSelected}
                  disabled={isDeleting}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg bg-red-900/20 text-red-400 text-sm font-semibold hover:bg-red-900/30 transition-all disabled:opacity-50"
                >
                  <TrashIcon className="h-4 w-4" />
                  Delete Selected ({selectedPlays.size})
                </button>
              </>
            )}
          </div>
        </header>

        {/* Plays Table */}
        {filteredPlays.length === 0 ? (
          <div className="glass-card p-12 text-center">
            <div className="text-slate-400 mb-2">No plays found</div>
            <p className="text-sm text-slate-500">
              {searchQuery || filterType !== 'all'
                ? 'Try adjusting your filters'
                : 'Upload plays from the Scanner page to get started'}
            </p>
          </div>
        ) : (
          <div className="glass-card overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[#1B1E20]">
                  {isMultiSelectMode && (
                    <th className="px-4 py-3 text-left">
                      <input
                        type="checkbox"
                        checked={selectedPlays.size === filteredPlays.length}
                        onChange={() => {
                          if (selectedPlays.size === filteredPlays.length) {
                            setSelectedPlays(new Set());
                          } else {
                            handleSelectAll();
                          }
                        }}
                        className="rounded border-[#2A2E30] bg-[#1B1E20] text-[#00F6E5] focus:ring-[#00F6E5]"
                      />
                    </th>
                  )}
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    Play Name
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    Formation
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    Concept
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    Date Added
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredPlays.map((play) => (
                  <tr
                    key={play.id}
                    className={`border-b border-[#1B1E20]/50 transition-colors ${
                      selectedPlays.has(play.id) ? 'bg-[#00F6E5]/5' : 'hover:bg-[#1B1E20]/30'
                    }`}
                  >
                    {isMultiSelectMode && (
                      <td className="px-4 py-4">
                        <input
                          type="checkbox"
                          checked={selectedPlays.has(play.id)}
                          onChange={() => handleTogglePlaySelection(play.id)}
                          className="rounded border-[#2A2E30] bg-[#1B1E20] text-[#00F6E5] focus:ring-[#00F6E5]"
                        />
                      </td>
                    )}
                    <td className="px-4 py-4">
                      <div className="font-semibold text-white">{play.name}</div>
                      {play.short_name && (
                        <div className="text-xs text-slate-500">{play.short_name}</div>
                      )}
                    </td>
                    <td className="px-4 py-4 text-slate-300">
                      {play.formation_name || play.playbook_metadata?.formation_name || '-'}
                    </td>
                    <td className="px-4 py-4 text-slate-300">
                      {play.concept || play.playbook_metadata?.concept_name || '-'}
                    </td>
                    <td className="px-4 py-4">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded ${
                        play.play_type === 'PASS' ? 'bg-blue-900/20 text-blue-400' :
                        play.play_type === 'RUN' ? 'bg-green-900/20 text-green-400' :
                        play.play_type === 'RPO' ? 'bg-purple-900/20 text-purple-400' :
                        'bg-slate-700/20 text-slate-400'
                      }`}>
                        {play.play_type}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-sm text-slate-400">
                      {new Date(play.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-4 text-right">
                      {!isMultiSelectMode && (
                        <button
                          onClick={() => handleDeletePlay(play.id, play.name)}
                          disabled={isDeleting}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-900/20 text-red-400 text-xs font-semibold hover:bg-red-900/30 transition-all disabled:opacity-50"
                        >
                          <TrashIcon className="h-3.5 w-3.5" />
                          Delete
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </SidebarLayout>
  );
}

function TrashIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
    </svg>
  );
}
