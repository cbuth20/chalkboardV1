"use client";

import React, { useState, useEffect } from 'react';
import { SidebarLayout } from '@/components/SidebarLayout';
import { useAuth } from '@/contexts/AuthContext';
import { useMode } from '@/contexts/ModeContext';
import { SkillPosition } from '@/lib/supabase/types/database';
import { supabase } from '@/lib/supabase/client';

interface TeamMemberRow {
  user_id: string;
  first_name: string;
  last_name: string;
  jersey_number: number | null;
  position: SkillPosition | null;
  role: string;
  is_active: boolean;
}

const POSITIONS: SkillPosition[] = ['QB', 'RB', 'FB', 'X', 'Z', 'H', 'Y', 'TE', 'LT', 'LG', 'C', 'RG', 'RT'];

const POSITION_NAMES: Record<SkillPosition, string> = {
  QB: 'Quarterback',
  RB: 'Running Back',
  FB: 'Fullback',
  X: 'X Receiver',
  Z: 'Z Receiver',
  H: 'H Receiver',
  Y: 'Y Receiver',
  TE: 'Tight End',
  LT: 'Left Tackle',
  LG: 'Left Guard',
  C: 'Center',
  RG: 'Right Guard',
  RT: 'Right Tackle',
};

export default function CoachTeamPage() {
  const { teamId, loading: authLoading } = useAuth();
  const { mode } = useMode();
  const [teamMembers, setTeamMembers] = useState<TeamMemberRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [pendingChanges, setPendingChanges] = useState<Record<string, SkillPosition | null>>({});
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (teamId) {
      fetchTeamMembers();
    } else if (!authLoading) {
      // Auth is done loading but no teamId - stop loading
      setLoading(false);
    }
  }, [teamId, authLoading]);

  const fetchTeamMembers = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('team_members')
        .select(`
          user_id,
          position,
          role,
          users!inner(
            first_name,
            last_name
          )
        `)
        .eq('team_id', teamId)
        .eq('role', 'player')  // Only show players, not coaches/admins
        .order('users(last_name)', { ascending: true });

      if (error) throw error;

      // Flatten the nested users data
      const members = (data as any[]).map((item) => ({
        user_id: item.user_id,
        first_name: item.users.first_name,
        last_name: item.users.last_name,
        jersey_number: null, // Jersey number not in schema
        position: item.position,
        role: item.role,
        is_active: true, // Default to active
      }));

      setTeamMembers(members);
    } catch (error: any) {
      console.error('Error fetching team members:', error);
      setSaveError(error.message || 'Failed to load team members');
    } finally {
      setLoading(false);
    }
  };

  const handlePositionChange = (userId: string, position: SkillPosition | null) => {
    setPendingChanges((prev) => ({
      ...prev,
      [userId]: position,
    }));
  };

  const getCurrentPosition = (userId: string): SkillPosition | null => {
    if (userId in pendingChanges) {
      return pendingChanges[userId];
    }
    const member = teamMembers.find((m) => m.user_id === userId);
    return member?.position || null;
  };

  const hasUnsavedChanges = Object.keys(pendingChanges).length > 0;

  const handleSaveAll = async () => {
    if (!hasUnsavedChanges) return;

    setSaving(true);
    setSaveError(null);
    setSaveSuccess(false);

    try {
      // Update each changed member
      const updates = Object.entries(pendingChanges).map(([userId, position]) => {
        return supabase
          .from('team_members')
          .update({ position })
          .eq('user_id', userId)
          .eq('team_id', teamId);
      });

      const results = await Promise.all(updates);

      const hasErrors = results.some((result) => result.error);
      if (hasErrors) {
        throw new Error('Some updates failed');
      }

      // Clear pending changes and refresh data
      setPendingChanges({});
      await fetchTeamMembers();
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (error: any) {
      console.error('Error saving positions:', error);
      setSaveError(error.message || 'Failed to save positions');
    } finally {
      setSaving(false);
    }
  };

  const filteredMembers = teamMembers.filter((member) => {
    const fullName = `${member.first_name} ${member.last_name}`.toLowerCase();
    return fullName.includes(searchQuery.toLowerCase());
  });

  const unassignedCount = teamMembers.filter((m) => !m.position).length;

  if (authLoading) {
    return (
      <SidebarLayout>
        <div className="flex items-center justify-center h-screen">
          <div className="text-center">
            <div className="h-12 w-12 mx-auto mb-4 animate-spin rounded-full border-4 border-[#00F6E5]/20 border-t-[#00F6E5]" />
            <p className="text-slate-400">Loading...</p>
          </div>
        </div>
      </SidebarLayout>
    );
  }

  if (mode !== 'coach') {
    return (
      <SidebarLayout>
        <div className="flex items-center justify-center h-screen">
          <div className="text-center">
            <AlertIcon className="h-12 w-12 text-[#FF6A3D] mx-auto mb-4" />
            <h2 className="text-xl font-bold text-white mb-2">Access Denied</h2>
            <p className="text-slate-400">Only coaches can access team management.</p>
          </div>
        </div>
      </SidebarLayout>
    );
  }

  if (loading) {
    return (
      <SidebarLayout>
        <div className="flex items-center justify-center h-screen">
          <div className="text-center">
            <div className="h-12 w-12 mx-auto mb-4 animate-spin rounded-full border-4 border-[#00F6E5]/20 border-t-[#00F6E5]" />
            <p className="text-slate-400">Loading team...</p>
          </div>
        </div>
      </SidebarLayout>
    );
  }

  return (
    <SidebarLayout>
      <main className="mx-auto max-w-[1600px] px-4 py-8 lg:px-8 holographic-grid">
        {/* Header */}
        <header className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <TeamIcon className="h-8 w-8 text-[#00F6E5]" />
            <h1 className="text-3xl font-black tracking-tight text-white lg:text-4xl">
              Team Management
            </h1>
          </div>
          <p className="text-slate-400">
            Assign positions to players on your team
          </p>
        </header>

        {/* Warning for unassigned players */}
        {unassignedCount > 0 && (
          <div className="mb-6 p-4 rounded-lg bg-[#FF6A3D]/5 border border-[#FF6A3D]/20">
            <div className="flex items-start gap-3">
              <AlertIcon className="h-5 w-5 text-[#FF6A3D] mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-semibold text-[#FF6A3D] mb-1">
                  {unassignedCount} player{unassignedCount !== 1 ? 's' : ''} need position assignments
                </p>
                <p className="text-xs text-slate-400">
                  Players without positions cannot access position-specific content like assignments and drills.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Actions Bar */}
        <div className="mb-6 flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          {/* Search */}
          <div className="relative flex-1 max-w-md">
            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
            <input
              type="text"
              placeholder="Search players..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-[#1B1E20]/50 border border-[#1B1E20] rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:border-[#00F6E5]/50 focus:ring-2 focus:ring-[#00F6E5]/10"
            />
          </div>

          {/* Save Button */}
          <button
            onClick={handleSaveAll}
            disabled={!hasUnsavedChanges || saving}
            className={`flex items-center gap-2 rounded-lg px-6 py-2.5 text-sm font-semibold transition-all ${
              hasUnsavedChanges && !saving
                ? 'bg-[#00F6E5] text-black hover:bg-[#3DF3FF] shadow-[0_0_15px_rgba(0,246,229,0.3)]'
                : 'bg-[#1B1E20] text-slate-600 cursor-not-allowed'
            }`}
          >
            {saving ? (
              <>
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-black border-t-transparent" />
                Saving...
              </>
            ) : (
              <>
                <SaveIcon className="h-4 w-4" />
                Save Changes ({Object.keys(pendingChanges).length})
              </>
            )}
          </button>
        </div>

        {/* Success/Error Messages */}
        {saveSuccess && (
          <div className="mb-4 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center gap-2">
            <CheckIcon className="h-5 w-5 text-emerald-400" />
            <span className="text-sm font-semibold text-emerald-400">
              Positions saved successfully!
            </span>
          </div>
        )}

        {saveError && (
          <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 flex items-center gap-2">
            <AlertIcon className="h-5 w-5 text-red-400" />
            <span className="text-sm text-red-400">{saveError}</span>
          </div>
        )}

        {/* Team Members Table */}
        <div className="glass-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[#1B1E20] bg-[#0A0A0A]/50">
                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-400">
                    Player
                  </th>
                  <th className="px-6 py-4 text-center text-xs font-semibold uppercase tracking-wider text-slate-400">
                    Jersey #
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-400">
                    Position
                  </th>
                  <th className="px-6 py-4 text-center text-xs font-semibold uppercase tracking-wider text-slate-400">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1B1E20]/30">
                {filteredMembers.map((member) => {
                  const currentPosition = getCurrentPosition(member.user_id);
                  const hasChanges = member.user_id in pendingChanges;

                  return (
                    <tr key={member.user_id} className="hover:bg-[#1B1E20]/30 transition-colors">
                      {/* Player Name */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-[#1B1E20] to-[#0A0A0A] text-xs font-bold text-slate-400">
                            {member.first_name[0]}{member.last_name[0]}
                          </div>
                          <div>
                            <div className="font-semibold text-white">
                              {member.first_name} {member.last_name}
                            </div>
                            {!member.is_active && (
                              <span className="text-xs text-slate-500">(Inactive)</span>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Jersey Number */}
                      <td className="px-6 py-4 text-center">
                        {member.jersey_number ? (
                          <span className="font-mono text-sm font-semibold text-white">
                            #{member.jersey_number}
                          </span>
                        ) : (
                          <span className="text-xs text-slate-600">—</span>
                        )}
                      </td>

                      {/* Position Dropdown */}
                      <td className="px-6 py-4">
                        <select
                          value={currentPosition || ''}
                          onChange={(e) =>
                            handlePositionChange(
                              member.user_id,
                              e.target.value ? (e.target.value as SkillPosition) : null
                            )
                          }
                          className={`w-full max-w-xs rounded-lg border px-3 py-2 text-sm font-medium transition-all focus:outline-none focus:ring-2 ${
                            hasChanges
                              ? 'bg-[#00F6E5]/10 border-[#00F6E5] text-[#00F6E5] ring-2 ring-[#00F6E5]/20'
                              : currentPosition
                              ? 'bg-[#1B1E20]/50 border-[#1B1E20] text-white hover:border-[#00F6E5]/50 focus:border-[#00F6E5]/50 focus:ring-[#00F6E5]/10'
                              : 'bg-red-900/10 border-red-500/30 text-red-400 hover:border-red-500/50 focus:border-red-500/50 focus:ring-red-500/10'
                          }`}
                        >
                          <option value="">Unassigned</option>
                          {POSITIONS.map((pos) => (
                            <option key={pos} value={pos}>
                              {pos} - {POSITION_NAMES[pos]}
                            </option>
                          ))}
                        </select>
                      </td>

                      {/* Status */}
                      <td className="px-6 py-4 text-center">
                        {currentPosition ? (
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-400">
                            <CheckIcon className="h-3 w-3" />
                            Assigned
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-red-500/10 px-3 py-1 text-xs font-semibold text-red-400">
                            <AlertIcon className="h-3 w-3" />
                            Missing
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {filteredMembers.length === 0 && (
            <div className="py-12 text-center">
              <p className="text-slate-500">No players found</p>
            </div>
          )}
        </div>

        {/* Stats Footer */}
        <div className="mt-6 flex items-center justify-between text-sm">
          <p className="text-slate-400">
            {filteredMembers.length} player{filteredMembers.length !== 1 ? 's' : ''} {searchQuery && 'found'}
          </p>
          <p className="text-slate-400">
            {teamMembers.filter((m) => m.position).length} / {teamMembers.length} assigned
          </p>
        </div>
      </main>
    </SidebarLayout>
  );
}

// Icons
function TeamIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}

function SearchIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <circle cx="11" cy="11" r="8" />
      <path d="m21 21-4.35-4.35" />
    </svg>
  );
}

function SaveIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
      <polyline points="17 21 17 13 7 13 7 21" />
      <polyline points="7 3 7 8 15 8" />
    </svg>
  );
}

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

function AlertIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="8" x2="12" y2="12" />
      <line x1="12" y1="16" x2="12.01" y2="16" />
    </svg>
  );
}
