"use client";

import React, { useState, useEffect } from 'react';
import { SidebarLayout } from '@/components/SidebarLayout';
import { useAuth } from '@/contexts/AuthContext';
import { useMode } from '@/contexts/ModeContext';
import { SkillPosition } from '@/lib/supabase/types/database';

// Types
interface Assignment {
  id: string;
  play_id: string;
  position: SkillPosition;
  alignment: string;
  landmark: string;
  assignment: string;
  key_read: string;
  read_progression: string[] | null;
  route_id: string | null;
  route_depth: number | null;
  blocking_assignment: string | null;
  coverage_adjustments: any;
  visible_to_positions: SkillPosition[];
  play: {
    id: string;
    name: string;
    formation_name: string;
    concept: string;
  };
}

const SKILL_POSITIONS: SkillPosition[] = ['QB', 'RB', 'FB', 'X', 'Z', 'H', 'Y', 'TE', 'LT', 'LG', 'C', 'RG', 'RT'];

export default function AssignmentLibraryPage() {
  const { teamId, loading: authLoading } = useAuth();
  const { mode } = useMode();
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterPosition, setFilterPosition] = useState<SkillPosition | 'all'>('all');
  const [selectedAssignment, setSelectedAssignment] = useState<Assignment | null>(null);
  const [showEditor, setShowEditor] = useState(false);
  const [showCreator, setShowCreator] = useState(false);
  const [isMultiSelectMode, setIsMultiSelectMode] = useState(false);
  const [selectedAssignmentIds, setSelectedAssignmentIds] = useState<Set<string>>(new Set());
  const [isDeleting, setIsDeleting] = useState(false);

  // Fetch assignments
  useEffect(() => {
    if (teamId) {
      fetchAssignments();
    } else if (!authLoading) {
      // Auth is done loading but no teamId - stop loading
      setLoading(false);
    }
  }, [teamId, authLoading]);

  const fetchAssignments = async () => {
    try {
      setLoading(true);
      console.log('[Coach Assignments] Fetching assignments for teamId:', teamId);
      const response = await fetch(`/api/coach/assignments?teamId=${teamId}`);
      console.log('[Coach Assignments] Response status:', response.status);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('[Coach Assignments] API error:', errorData);
        throw new Error('Failed to fetch assignments');
      }
      const data = await response.json();
      console.log('[Coach Assignments] Received data:', data);
      console.log('[Coach Assignments] First assignment sample:', data.assignments?.[0]);
      setAssignments(data.assignments || []);
    } catch (error) {
      console.error('[Coach Assignments] Error fetching assignments:', error);
    } finally {
      setLoading(false);
    }
  };

  // Delete single assignment
  const handleDeleteAssignment = async (assignmentId: string) => {
    if (!confirm('Delete this assignment? This action cannot be undone.')) return;

    try {
      setIsDeleting(true);
      const response = await fetch(`/api/coach/assignments/${assignmentId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete assignment');
      }

      // Update local state
      setAssignments(prev => prev.filter(a => a.id !== assignmentId));
      setShowEditor(false);
      setSelectedAssignment(null);
      alert('Assignment deleted successfully');
    } catch (error) {
      console.error('[Coach Assignments] Error deleting assignment:', error);
      alert('Failed to delete assignment. Please try again.');
    } finally {
      setIsDeleting(false);
    }
  };

  // Delete multiple selected assignments
  const handleDeleteSelected = async () => {
    if (selectedAssignmentIds.size === 0) {
      alert('Please select assignments to delete');
      return;
    }

    const count = selectedAssignmentIds.size;
    if (!confirm(`Delete ${count} assignment${count > 1 ? 's' : ''}? This action cannot be undone.`)) return;

    try {
      setIsDeleting(true);
      const deletePromises = Array.from(selectedAssignmentIds).map(id =>
        fetch(`/api/coach/assignments/${id}`, { method: 'DELETE' })
      );

      const results = await Promise.all(deletePromises);
      const failedCount = results.filter(r => !r.ok).length;

      if (failedCount > 0) {
        alert(`${count - failedCount} of ${count} assignments deleted. ${failedCount} failed.`);
      } else {
        alert(`${count} assignment${count > 1 ? 's' : ''} deleted successfully`);
      }

      // Refresh assignments
      await fetchAssignments();
      setSelectedAssignmentIds(new Set());
      setIsMultiSelectMode(false);
    } catch (error) {
      console.error('[Coach Assignments] Error deleting assignments:', error);
      alert('Failed to delete assignments. Please try again.');
    } finally {
      setIsDeleting(false);
    }
  };

  // Delete all assignments
  const handleDeleteAll = async () => {
    if (assignments.length === 0) return;

    const count = assignments.length;
    if (!confirm(`Delete ALL ${count} assignments? This action cannot be undone and will affect all positions and plays.`)) return;

    try {
      setIsDeleting(true);
      const deletePromises = assignments.map(a =>
        fetch(`/api/coach/assignments/${a.id}`, { method: 'DELETE' })
      );

      const results = await Promise.all(deletePromises);
      const failedCount = results.filter(r => !r.ok).length;

      if (failedCount > 0) {
        alert(`${count - failedCount} of ${count} assignments deleted. ${failedCount} failed.`);
      } else {
        alert('All assignments deleted successfully');
      }

      // Refresh assignments
      await fetchAssignments();
    } catch (error) {
      console.error('[Coach Assignments] Error deleting all assignments:', error);
      alert('Failed to delete all assignments. Please try again.');
    } finally {
      setIsDeleting(false);
    }
  };

  // Toggle multi-select mode
  const handleToggleMultiSelect = () => {
    setIsMultiSelectMode(!isMultiSelectMode);
    if (isMultiSelectMode) {
      setSelectedAssignmentIds(new Set());
    }
  };

  // Toggle assignment selection
  const handleToggleAssignmentSelection = (assignmentId: string) => {
    const newSelected = new Set(selectedAssignmentIds);
    if (newSelected.has(assignmentId)) {
      newSelected.delete(assignmentId);
    } else {
      newSelected.add(assignmentId);
    }
    setSelectedAssignmentIds(newSelected);
  };

  // Filter assignments
  const filteredAssignments = assignments.filter(assignment => {
    // Safety check for missing play data
    if (!assignment.play) {
      console.warn('[Coach Assignments] Assignment missing play data:', assignment.id, assignment);
      return false;
    }

    const matchesSearch =
      assignment.play.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      assignment.position?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      assignment.assignment?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesPosition = filterPosition === 'all' || assignment.position === filterPosition;

    return matchesSearch && matchesPosition;
  });

  // Log filtering results
  console.log('[Coach Assignments] Total assignments:', assignments.length);
  console.log('[Coach Assignments] Filtered assignments:', filteredAssignments.length);
  console.log('[Coach Assignments] Filter position:', filterPosition);

  // Access control
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
            <h2 className="text-xl font-bold text-white mb-2">Access Denied</h2>
            <p className="text-slate-400">Only coaches can access the Assignment Library.</p>
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
          <div className="flex items-center justify-between mb-2">
            <div>
              <h1 className="text-3xl font-black tracking-tight text-white lg:text-4xl">
                Assignment Library
              </h1>
              <p className="text-slate-400 mt-2">
                Manage position-specific assignments for your plays
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowCreator(true)}
                className="px-6 py-3 rounded-lg bg-[#00F6E5] text-black font-semibold hover:bg-[#3DF3FF] transition shadow-[0_0_15px_rgba(0,246,229,0.3)]"
              >
                <span className="flex items-center gap-2">
                  <PlusIcon className="h-5 w-5" />
                  Create Assignment
                </span>
              </button>
              {assignments.length > 0 && (
                <button
                  onClick={handleDeleteAll}
                  disabled={isDeleting}
                  className="px-4 py-3 rounded-lg bg-red-900/20 text-red-400 font-semibold hover:bg-red-900/30 transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <span className="flex items-center gap-2">
                    <TrashIcon className="h-5 w-5" />
                    Delete All
                  </span>
                </button>
              )}
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
            <div className="glass-card p-4">
              <div className="text-sm text-slate-400">Total Assignments</div>
              <div className="text-2xl font-bold text-white mt-1">{assignments.length}</div>
            </div>
            <div className="glass-card p-4">
              <div className="text-sm text-slate-400">Plays with Assignments</div>
              <div className="text-2xl font-bold text-white mt-1">
                {new Set(assignments.map(a => a.play_id)).size}
              </div>
            </div>
            <div className="glass-card p-4">
              <div className="text-sm text-slate-400">Positions Covered</div>
              <div className="text-2xl font-bold text-white mt-1">
                {new Set(assignments.map(a => a.position)).size} / {SKILL_POSITIONS.length}
              </div>
            </div>
          </div>
        </header>

        {/* Filter Bar */}
        <div className="glass-card p-4 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="flex-1">
              <input
                type="text"
                placeholder="Search by play name, position, or assignment..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-4 py-2 rounded-lg bg-[#1B1E20] border border-[#2A2F35] text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-[#00F6E5]"
              />
            </div>

            {/* Position Filter */}
            <select
              value={filterPosition}
              onChange={(e) => setFilterPosition(e.target.value as SkillPosition | 'all')}
              className="px-4 py-2 rounded-lg bg-[#1B1E20] border border-[#2A2F35] text-white focus:outline-none focus:ring-2 focus:ring-[#00F6E5]"
            >
              <option value="all">All Positions</option>
              {SKILL_POSITIONS.map(pos => (
                <option key={pos} value={pos}>{pos}</option>
              ))}
            </select>

            {/* Multi-Select Toggle */}
            <button
              onClick={handleToggleMultiSelect}
              className={`px-4 py-2 rounded-lg font-semibold transition ${
                isMultiSelectMode
                  ? 'bg-[#00F6E5]/10 text-[#00F6E5] ring-1 ring-[#00F6E5]/30'
                  : 'bg-[#1B1E20] text-slate-400 hover:bg-[#252a2e]'
              }`}
            >
              {isMultiSelectMode ? `Selected (${selectedAssignmentIds.size})` : 'Multi-Select'}
            </button>

            {/* Delete Selected Button */}
            {isMultiSelectMode && selectedAssignmentIds.size > 0 && (
              <button
                onClick={handleDeleteSelected}
                disabled={isDeleting}
                className="px-4 py-2 rounded-lg bg-red-900/20 text-red-400 font-semibold hover:bg-red-900/30 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Delete Selected
              </button>
            )}
          </div>
        </div>

        {/* Assignments List */}
        {loading ? (
          <div className="text-center py-12 text-gray-400">Loading assignments...</div>
        ) : filteredAssignments.length === 0 ? (
          <div className="glass-card p-12 text-center">
            <div className="text-slate-400 mb-4">No assignments found</div>
            <button
              onClick={() => setShowCreator(true)}
              className="px-6 py-3 rounded-lg bg-[#00F6E5] text-black font-semibold hover:bg-[#3DF3FF] transition"
            >
              Create Your First Assignment
            </button>
          </div>
        ) : (
          <div className="glass-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-[#1B1E20]">
                    {isMultiSelectMode && (
                      <th className="px-4 py-4 text-left">
                        <input
                          type="checkbox"
                          checked={selectedAssignmentIds.size === filteredAssignments.length && filteredAssignments.length > 0}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedAssignmentIds(new Set(filteredAssignments.map(a => a.id)));
                            } else {
                              setSelectedAssignmentIds(new Set());
                            }
                          }}
                          className="h-4 w-4 rounded border-gray-600 bg-[#1B1E20] text-[#00F6E5] focus:ring-[#00F6E5] focus:ring-offset-0"
                        />
                      </th>
                    )}
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">
                      Play Name
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">
                      Formation
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">
                      Position
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">
                      Assignment Summary
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">
                      Assigned To
                    </th>
                    <th className="px-6 py-4 text-right text-xs font-semibold text-slate-400 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredAssignments.map((assignment) => (
                    <tr
                      key={assignment.id}
                      className="border-b border-[#1B1E20]/50 hover:bg-[#1B1E20]/30 transition cursor-pointer"
                      onClick={() => {
                        if (!isMultiSelectMode) {
                          setSelectedAssignment(assignment);
                          setShowEditor(true);
                        }
                      }}
                    >
                      {isMultiSelectMode && (
                        <td className="px-4 py-4">
                          <input
                            type="checkbox"
                            checked={selectedAssignmentIds.has(assignment.id)}
                            onChange={(e) => {
                              e.stopPropagation();
                              handleToggleAssignmentSelection(assignment.id);
                            }}
                            className="h-4 w-4 rounded border-gray-600 bg-[#1B1E20] text-[#00F6E5] focus:ring-[#00F6E5] focus:ring-offset-0"
                          />
                        </td>
                      )}
                      <td className="px-6 py-4 text-white font-medium">
                        {assignment.play.name}
                      </td>
                      <td className="px-6 py-4 text-slate-300">
                        {assignment.play.formation_name}
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center px-3 py-1 rounded-full bg-[#00F6E5]/10 text-[#00F6E5] text-sm font-semibold">
                          {assignment.position}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-slate-300 max-w-md truncate">
                        {assignment.assignment}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-wrap gap-1">
                          {assignment.visible_to_positions && assignment.visible_to_positions.length > 0 ? (
                            assignment.visible_to_positions.map(pos => (
                              <span key={pos} className="inline-flex items-center px-2 py-0.5 rounded bg-[#1B1E20] text-slate-300 text-xs">
                                {pos}
                              </span>
                            ))
                          ) : (
                            <span className="text-xs text-slate-500">Not assigned</span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedAssignment(assignment);
                            setShowEditor(true);
                          }}
                          className="text-[#00F6E5] hover:text-[#3DF3FF] font-semibold transition"
                        >
                          View
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Results count */}
        <div className="mt-4 text-sm text-slate-400">
          Showing {filteredAssignments.length} of {assignments.length} assignments
        </div>
      </main>

      {/* Assignment Detail Modal */}
      {showEditor && selectedAssignment && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4" onClick={() => {
          setShowEditor(false);
          setSelectedAssignment(null);
        }}>
          <div className="bg-[#0A0A0A] border border-[#1B1E20] rounded-lg p-6 max-w-3xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            {/* Header */}
            <div className="flex items-start justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold text-white mb-1">{selectedAssignment.play.name}</h2>
                <p className="text-slate-400">{selectedAssignment.play.formation_name} • {selectedAssignment.play.concept}</p>
              </div>
              <button
                onClick={() => {
                  setShowEditor(false);
                  setSelectedAssignment(null);
                }}
                className="text-slate-400 hover:text-white transition"
              >
                <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                  <path d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Position Badge */}
            <div className="mb-6">
              <span className="inline-flex items-center px-4 py-2 rounded-lg bg-[#00F6E5]/10 text-[#00F6E5] text-lg font-bold border border-[#00F6E5]/30">
                {selectedAssignment.position}
              </span>
            </div>

            {/* Assignment Details Grid */}
            <div className="space-y-4">
              {/* Alignment */}
              <div className="glass-card p-4">
                <div className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">Alignment</div>
                <div className="text-white text-lg">{selectedAssignment.alignment}</div>
              </div>

              {/* Landmark */}
              <div className="glass-card p-4">
                <div className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">Landmark</div>
                <div className="text-white text-lg">{selectedAssignment.landmark}</div>
              </div>

              {/* Assignment */}
              <div className="glass-card p-4">
                <div className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">Assignment</div>
                <div className="text-white text-lg">{selectedAssignment.assignment}</div>
              </div>

              {/* Key Read */}
              <div className="glass-card p-4">
                <div className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">Key Read</div>
                <div className="text-white text-lg">{selectedAssignment.key_read}</div>
              </div>

              {/* Read Progression */}
              {selectedAssignment.read_progression && selectedAssignment.read_progression.length > 0 && (
                <div className="glass-card p-4">
                  <div className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">Read Progression</div>
                  <ol className="list-decimal list-inside space-y-1">
                    {selectedAssignment.read_progression.map((read, idx) => (
                      <li key={idx} className="text-white">{read}</li>
                    ))}
                  </ol>
                </div>
              )}

              {/* Route Info */}
              {selectedAssignment.route_id && (
                <div className="glass-card p-4">
                  <div className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">Route</div>
                  <div className="text-white text-lg">
                    {selectedAssignment.route_id}
                    {selectedAssignment.route_depth && (
                      <span className="text-slate-400 text-base ml-2">({selectedAssignment.route_depth} yards)</span>
                    )}
                  </div>
                </div>
              )}

              {/* Blocking Assignment */}
              {selectedAssignment.blocking_assignment && (
                <div className="glass-card p-4">
                  <div className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">Blocking Assignment</div>
                  <div className="text-white text-lg">{selectedAssignment.blocking_assignment}</div>
                </div>
              )}

              {/* Coverage Adjustments */}
              {selectedAssignment.coverage_adjustments && Object.keys(selectedAssignment.coverage_adjustments).length > 0 && (
                <div className="glass-card p-4">
                  <div className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-3">Coverage Adjustments</div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {Object.entries(selectedAssignment.coverage_adjustments).map(([coverage, adjustment]) => (
                      <div key={coverage} className="bg-[#1B1E20]/50 rounded p-3">
                        <div className="text-xs text-[#00F6E5] font-semibold mb-1">
                          {coverage.replace('vs_', 'vs ').replace(/_/g, ' ').toUpperCase()}
                        </div>
                        <div className="text-white text-sm">{String(adjustment)}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Visible To Positions */}
              <div className="glass-card p-4">
                <div className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-3">Visible To Positions</div>
                <div className="flex flex-wrap gap-2">
                  {selectedAssignment.visible_to_positions && selectedAssignment.visible_to_positions.length > 0 ? (
                    selectedAssignment.visible_to_positions.map(pos => (
                      <span key={pos} className="inline-flex items-center px-3 py-1 rounded-full bg-[#00F6E5]/10 text-[#00F6E5] text-sm font-semibold border border-[#00F6E5]/30">
                        {pos}
                      </span>
                    ))
                  ) : (
                    <span className="text-slate-500">Only visible to {selectedAssignment.position}</span>
                  )}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="mt-6 pt-6 border-t border-[#1B1E20] flex justify-between gap-3">
              <button
                onClick={() => handleDeleteAssignment(selectedAssignment.id)}
                disabled={isDeleting}
                className="px-6 py-2 rounded-lg bg-red-900/20 text-red-400 font-semibold hover:bg-red-900/30 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                <TrashIcon className="h-4 w-4" />
                Delete Assignment
              </button>
              <button
                onClick={() => {
                  setShowEditor(false);
                  setSelectedAssignment(null);
                }}
                className="px-6 py-2 rounded-lg bg-[#1B1E20] text-white hover:bg-[#252a2e] transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Creator Modal - To be implemented */}
      {showCreator && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-[#0A0A0A] border border-[#1B1E20] rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold text-white mb-4">Create Assignment</h2>
            <p className="text-slate-400 mb-4">Creator interface coming soon...</p>
            <button
              onClick={() => setShowCreator(false)}
              className="px-6 py-2 rounded-lg bg-[#1B1E20] text-white hover:bg-[#252a2e] transition"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </SidebarLayout>
  );
}

// Icons
function PlusIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  );
}

function TrashIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M3 6h18" />
      <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
      <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
      <line x1="10" x2="10" y1="11" y2="17" />
      <line x1="14" x2="14" y1="11" y2="17" />
    </svg>
  );
}
