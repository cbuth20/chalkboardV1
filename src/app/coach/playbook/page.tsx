"use client";

import React, { useState } from 'react';
import { SidebarLayout } from '@/components/SidebarLayout';
import { useAuth } from '@/contexts/AuthContext';
import { usePlays, useUpdatePlayStatus } from '@/hooks/usePlaysAPI';

export default function CoachPlaybookPage() {
  const { orgId, userRole, loading: authLoading } = useAuth();
  const { plays, loading, error, refetch } = usePlays({ status: 'approved' });
  const { updateStatus } = useUpdatePlayStatus();

  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [selectedPlays, setSelectedPlays] = useState<Set<string>>(new Set());
  const [isMultiSelectMode, setIsMultiSelectMode] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  // Filter plays
  const filteredPlays = plays.filter(play => {
    const matchesSearch =
      play.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      play.concept?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      play.formationName?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesType = filterType === 'all' || play.playType === filterType;

    return matchesSearch && matchesType;
  });

  // Unpublish single play
  const handleUnpublishPlay = async (playId: string, playName: string) => {
    if (!confirm(`Unpublish "${playName}"? It will be hidden from players but can be republished later.`)) {
      return;
    }

    try {
      setIsUpdating(true);
      await updateStatus(playId, { isPublished: false });
      alert('Play unpublished successfully');
      refetch();
    } catch (error) {
      console.error('Error unpublishing play:', error);
      alert('Failed to unpublish play. Please try again.');
    } finally {
      setIsUpdating(false);
    }
  };

  // Unpublish selected plays
  const handleUnpublishSelected = async () => {
    if (selectedPlays.size === 0) return;

    const count = selectedPlays.size;
    if (!confirm(`Unpublish ${count} play${count > 1 ? 's' : ''}? They will be hidden from players.`)) {
      return;
    }

    try {
      setIsUpdating(true);
      const promises = Array.from(selectedPlays).map(playId =>
        updateStatus(playId, { isPublished: false })
      );

      await Promise.all(promises);
      alert(`${count} play${count > 1 ? 's' : ''} unpublished successfully`);

      refetch();
      setSelectedPlays(new Set());
      setIsMultiSelectMode(false);
    } catch (error) {
      console.error('Error unpublishing plays:', error);
      alert('Failed to unpublish plays. Please try again.');
    } finally {
      setIsUpdating(false);
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
                {plays.filter(p => p.playType === 'PASS').length}
              </div>
              <div className="text-xs text-slate-400 uppercase tracking-wider">Pass Plays</div>
            </div>
            <div className="glass-card p-4">
              <div className="text-2xl font-black text-[#00F6E5]">
                {plays.filter(p => p.playType === 'RUN').length}
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
                  onClick={handleUnpublishSelected}
                  disabled={isUpdating}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg bg-orange-900/20 text-orange-400 text-sm font-semibold hover:bg-orange-900/30 transition-all disabled:opacity-50"
                >
                  <EyeOffIcon className="h-4 w-4" />
                  Unpublish ({selectedPlays.size})
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
                        checked={selectedPlays.size === filteredPlays.length && filteredPlays.length > 0}
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
                      {play.shortName && (
                        <div className="text-xs text-slate-500">{play.shortName}</div>
                      )}
                    </td>
                    <td className="px-4 py-4 text-slate-300">
                      {play.formationName || '-'}
                    </td>
                    <td className="px-4 py-4 text-slate-300">
                      {play.concept || '-'}
                    </td>
                    <td className="px-4 py-4">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded ${
                        play.playType === 'PASS' ? 'bg-blue-900/20 text-blue-400' :
                        play.playType === 'RUN' ? 'bg-green-900/20 text-green-400' :
                        play.playType === 'RPO' ? 'bg-purple-900/20 text-purple-400' :
                        'bg-slate-700/20 text-slate-400'
                      }`}>
                        {play.playType}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-sm text-slate-400">
                      {new Date(play.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-4 text-right">
                      {!isMultiSelectMode && (
                        <button
                          onClick={() => handleUnpublishPlay(play.id, play.name)}
                          disabled={isUpdating}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-orange-900/20 text-orange-400 text-xs font-semibold hover:bg-orange-900/30 transition-all disabled:opacity-50"
                        >
                          <EyeOffIcon className="h-3.5 w-3.5" />
                          Unpublish
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

function EyeOffIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
    </svg>
  );
}
