"use client";

import { SidebarLayout } from "@/components/SidebarLayout";
import { useAuth } from "@/contexts/AuthContext";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import type { ActivityType } from "@/types/activities";

// ═══════════════════════════════════════════════════════════════════════════
// COACH ACTIVITIES PAGE
// ═══════════════════════════════════════════════════════════════════════════

export default function CoachActivitiesPage() {
  const { orgId, session, loading: authLoading } = useAuth();
  const router = useRouter();
  const [activities, setActivities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'active' | 'draft' | 'archived'>('active');

  useEffect(() => {
    if (orgId && session) {
      fetchActivities();
    }
  }, [orgId, session, filter]);

  const fetchActivities = async () => {
    if (!session?.access_token) {
      console.error('No session token available');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const response = await fetch(
        `/.netlify/functions/activities-list?orgId=${orgId}&status=${filter}`,
        {
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch activities');
      }

      const data = await response.json();
      setActivities(data.activities || []);
    } catch (error) {
      console.error('Error fetching activities:', error);
    } finally {
      setLoading(false);
    }
  };

  const stats = {
    total: activities.length,
    active: activities.filter(a => a.status === 'active').length,
    draft: activities.filter(a => a.status === 'draft').length,
  };

  if (authLoading || loading) {
    return (
      <SidebarLayout>
        <div className="flex h-screen items-center justify-center">
          <div className="flex items-center gap-3">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-[#00F6E5] border-t-transparent" />
            <span className="text-sm text-slate-400">Loading activities...</span>
          </div>
        </div>
      </SidebarLayout>
    );
  }

  return (
    <SidebarLayout>
      <main className="mx-auto max-w-[1600px] px-4 py-8 lg:px-8">
        {/* Header */}
        <header className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-black tracking-tight text-white lg:text-4xl mb-2">
                Manage Activities
              </h1>
              <p className="text-slate-400">
                Create and assign learning activities to your players
              </p>
            </div>
            <button
              onClick={() => router.push('/coach/activities/create')}
              className="px-6 py-3 rounded-lg bg-[#00F6E5] text-black text-sm font-semibold hover:bg-[#00F6E5]/90 transition-all"
            >
              + Create Activity
            </button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="glass-card p-4">
              <div className="text-2xl font-black text-[#00F6E5]">{stats.total}</div>
              <div className="text-xs text-slate-400 uppercase tracking-wider">Total Activities</div>
            </div>
            <div className="glass-card p-4">
              <div className="text-2xl font-black text-green-400">{stats.active}</div>
              <div className="text-xs text-slate-400 uppercase tracking-wider">Active</div>
            </div>
            <div className="glass-card p-4">
              <div className="text-2xl font-black text-yellow-400">{stats.draft}</div>
              <div className="text-xs text-slate-400 uppercase tracking-wider">Draft</div>
            </div>
          </div>

          {/* Filters */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                filter === 'all'
                  ? 'bg-[#00F6E5] text-black'
                  : 'bg-[#1B1E20] text-slate-400 hover:text-white'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setFilter('active')}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                filter === 'active'
                  ? 'bg-[#00F6E5] text-black'
                  : 'bg-[#1B1E20] text-slate-400 hover:text-white'
              }`}
            >
              Active
            </button>
            <button
              onClick={() => setFilter('draft')}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                filter === 'draft'
                  ? 'bg-[#00F6E5] text-black'
                  : 'bg-[#1B1E20] text-slate-400 hover:text-white'
              }`}
            >
              Draft
            </button>
            <button
              onClick={() => setFilter('archived')}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                filter === 'archived'
                  ? 'bg-[#00F6E5] text-black'
                  : 'bg-[#1B1E20] text-slate-400 hover:text-white'
              }`}
            >
              Archived
            </button>
          </div>
        </header>

        {/* Activities Table */}
        {activities.length === 0 ? (
          <div className="glass-card p-12 text-center">
            <div className="text-4xl mb-4">📚</div>
            <h3 className="text-xl font-bold text-white mb-2">No Activities</h3>
            <p className="text-slate-400 mb-6">
              {filter === 'all'
                ? "You haven't created any activities yet."
                : `No ${filter} activities.`}
            </p>
            <button
              onClick={() => router.push('/coach/activities/create')}
              className="px-6 py-3 rounded-lg bg-[#00F6E5] text-black text-sm font-semibold hover:bg-[#00F6E5]/90 transition-all"
            >
              Create Your First Activity
            </button>
          </div>
        ) : (
          <div className="glass-card overflow-hidden">
            <table className="w-full">
              <thead className="bg-[#1B1E20]">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">
                    Activity
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">
                    Plays
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">
                    Due Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">
                    Completion
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">
                    Avg Score
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-bold text-slate-400 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1B1E20]">
                {activities.map((activity) => {
                  const completionRate = activity.stats.assigned_users > 0
                    ? Math.round((activity.stats.completed_users / activity.stats.assigned_users) * 100)
                    : 0;

                  return (
                    <tr
                      key={activity.id}
                      className="hover:bg-[#1B1E20]/50 cursor-pointer"
                      onClick={() => router.push(`/coach/activities/${activity.id}`)}
                    >
                      <td className="px-6 py-4">
                        <div className="text-sm font-semibold text-white">
                          {activity.title}
                        </div>
                        {activity.description && (
                          <div className="text-xs text-slate-400 mt-1 truncate max-w-xs">
                            {activity.description}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <span className="px-2 py-1 rounded text-xs font-semibold bg-[#1B1E20] text-[#00F6E5]">
                          {activity.activity_type.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-300">
                        {activity.play_ids.length} plays
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-300">
                        {activity.due_date
                          ? new Date(activity.due_date).toLocaleDateString()
                          : '—'}
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-white font-semibold">
                          {activity.stats.completed_users} / {activity.stats.assigned_users || 0}
                        </div>
                        <div className="text-xs text-slate-400">
                          {completionRate}% complete
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-300">
                        {activity.stats.avg_score
                          ? `${Math.round(activity.stats.avg_score)}%`
                          : '—'}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`px-2 py-1 rounded text-xs font-semibold ${
                            activity.status === 'active'
                              ? 'bg-green-500/20 text-green-400'
                              : activity.status === 'draft'
                              ? 'bg-yellow-500/20 text-yellow-400'
                              : 'bg-slate-500/20 text-slate-400'
                          }`}
                        >
                          {activity.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            router.push(`/coach/activities/${activity.id}/edit`);
                          }}
                          className="text-[#00F6E5] hover:text-[#00F6E5]/80 text-sm font-semibold"
                        >
                          Edit
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </SidebarLayout>
  );
}
