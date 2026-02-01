"use client";

import { SidebarLayout } from "@/components/SidebarLayout";
import { useAuth } from "@/contexts/AuthContext";
import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import type { ActivityType } from "@/types/activities";

const ACTIVITY_METADATA: Record<ActivityType, {
  title: string;
  icon: string;
}> = {
  quick_quiz: { title: "QUICK QUIZ", icon: "📋" },
  true_false: { title: "TRUE/FALSE", icon: "⚡" },
  scenario: { title: "SCENARIO", icon: "🏈" },
  coverage_id: { title: "COVERAGE ID", icon: "🛡️" },
  route_id: { title: "ROUTE ID", icon: "📍" },
  mixed: { title: "MIXED REVIEW", icon: "⭐" },
};

export default function CoachActivityDetailPage() {
  const { orgId, session, loading: authLoading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const activityId = params.id as string;

  const [activity, setActivity] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (orgId && session && activityId) {
      fetchActivity();
    }
  }, [orgId, session, activityId]);

  const fetchActivity = async () => {
    if (!session?.access_token) {
      console.error('No session token available');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const response = await fetch(`/.netlify/functions/activities-list?orgId=${orgId}`, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch activities');
      }

      const data = await response.json();
      const found = data.activities.find((a: any) => a.id === activityId);

      if (!found) {
        router.push('/coach/activities');
        return;
      }

      setActivity(found);
    } catch (error) {
      console.error('Error fetching activity:', error);
      alert('Failed to load activity');
      router.push('/coach/activities');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this activity? This action cannot be undone.')) {
      return;
    }

    // TODO: Implement delete endpoint
    alert('Delete functionality coming soon!');
  };

  const handleArchive = async () => {
    if (!confirm('Archive this activity? Players will no longer be able to access it.')) {
      return;
    }

    // TODO: Implement archive endpoint
    alert('Archive functionality coming soon!');
  };

  if (authLoading || loading) {
    return (
      <SidebarLayout>
        <div className="flex h-screen items-center justify-center">
          <div className="flex items-center gap-3">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-[#00F6E5] border-t-transparent" />
            <span className="text-sm text-slate-400">Loading activity...</span>
          </div>
        </div>
      </SidebarLayout>
    );
  }

  if (!activity) {
    return null;
  }

  const metadata = ACTIVITY_METADATA[activity.activity_type as ActivityType];
  const stats = activity.stats || {
    assigned_users: 0,
    completed_users: 0,
    passed_users: 0,
    total_attempts: 0,
  };

  const completionRate = stats.assigned_users > 0
    ? Math.round((stats.completed_users / stats.assigned_users) * 100)
    : 0;

  const passRate = stats.completed_users > 0
    ? Math.round((stats.passed_users / stats.completed_users) * 100)
    : 0;

  return (
    <SidebarLayout>
      <main className="mx-auto max-w-6xl px-4 py-8">
        {/* Back Button */}
        <button
          onClick={() => router.push('/coach/activities')}
          className="mb-6 text-slate-400 hover:text-white transition-colors"
        >
          ← Back to Activities
        </button>

        {/* Header */}
        <div className="glass-card p-8 mb-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-start gap-6">
              <div className="text-5xl">{metadata.icon}</div>
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h1 className="text-3xl font-black text-white">
                    {activity.title}
                  </h1>
                  <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                    activity.status === 'active'
                      ? 'bg-green-500/20 text-green-400'
                      : activity.status === 'draft'
                      ? 'bg-yellow-500/20 text-yellow-400'
                      : 'bg-slate-500/20 text-slate-400'
                  }`}>
                    {activity.status.toUpperCase()}
                  </span>
                </div>
                <p className="text-sm text-slate-400 uppercase tracking-wider mb-3">
                  {metadata.title}
                </p>
                {activity.description && (
                  <p className="text-slate-300 mb-4">
                    {activity.description}
                  </p>
                )}

                {/* Settings */}
                <div className="flex items-center gap-6 text-sm">
                  <div>
                    <span className="text-slate-400">Passing Score:</span>
                    <span className="text-white font-bold ml-2">
                      {activity.passing_score_percent}%
                    </span>
                  </div>
                  {activity.time_limit_seconds && (
                    <div>
                      <span className="text-slate-400">Time Limit:</span>
                      <span className="text-white font-bold ml-2">
                        {Math.floor(activity.time_limit_seconds / 60)} min
                      </span>
                    </div>
                  )}
                  <div>
                    <span className="text-slate-400">Plays:</span>
                    <span className="text-white font-bold ml-2">
                      {activity.play_ids?.length || 0}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400">Retakes:</span>
                    <span className="text-white font-bold ml-2">
                      {activity.allow_retakes ? 'Allowed' : 'Not Allowed'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => router.push(`/coach/activities/${activityId}/edit`)}
                className="px-4 py-2 rounded-lg bg-[#1B1E20] text-white text-sm font-semibold hover:bg-[#2A2E30] transition-all"
              >
                Edit
              </button>
              <button
                onClick={handleArchive}
                className="px-4 py-2 rounded-lg bg-[#1B1E20] text-slate-400 text-sm font-semibold hover:text-white hover:bg-[#2A2E30] transition-all"
              >
                Archive
              </button>
              <button
                onClick={handleDelete}
                className="px-4 py-2 rounded-lg bg-red-500/10 text-red-400 text-sm font-semibold hover:bg-red-500/20 transition-all"
              >
                Delete
              </button>
            </div>
          </div>

          {/* Due Date */}
          {activity.due_date && (
            <div className="pt-4 border-t border-white/10">
              <span className="text-sm text-slate-400">Due Date:</span>
              <span className="text-white font-semibold ml-2">
                {new Date(activity.due_date).toLocaleDateString('en-US', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </span>
            </div>
          )}
        </div>

        {/* Analytics */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          <div className="glass-card p-6">
            <div className="text-3xl font-black text-[#00F6E5] mb-2">
              {stats.assigned_users || 0}
            </div>
            <div className="text-sm text-slate-400">Assigned Players</div>
          </div>
          <div className="glass-card p-6">
            <div className="text-3xl font-black text-yellow-400 mb-2">
              {completionRate}%
            </div>
            <div className="text-sm text-slate-400">Completion Rate</div>
            <div className="text-xs text-slate-500 mt-1">
              {stats.completed_users}/{stats.assigned_users} completed
            </div>
          </div>
          <div className="glass-card p-6">
            <div className="text-3xl font-black text-green-400 mb-2">
              {passRate}%
            </div>
            <div className="text-sm text-slate-400">Pass Rate</div>
            <div className="text-xs text-slate-500 mt-1">
              {stats.passed_users}/{stats.completed_users} passed
            </div>
          </div>
          <div className="glass-card p-6">
            <div className="text-3xl font-black text-purple-400 mb-2">
              {stats.total_attempts || 0}
            </div>
            <div className="text-sm text-slate-400">Total Attempts</div>
          </div>
        </div>

        {/* Assignment Info */}
        <div className="glass-card p-6 mb-6">
          <h2 className="text-lg font-bold text-white mb-4">Assignment</h2>
          <div className="flex items-center gap-4">
            <div>
              <span className="text-sm text-slate-400">Assigned To:</span>
              <span className="text-white font-semibold ml-2">
                {activity.assigned_to?.type === 'team'
                  ? 'Entire Team'
                  : activity.assigned_to?.type === 'positions'
                  ? `Positions: ${activity.assigned_to.values.join(', ')}`
                  : `${activity.assigned_to?.values.length || 0} Players`}
              </span>
            </div>
          </div>
        </div>

        {/* Player-by-Player Breakdown */}
        <div className="glass-card p-6">
          <h2 className="text-lg font-bold text-white mb-4">Player Performance</h2>
          <div className="text-center py-12">
            <div className="text-4xl mb-4">📊</div>
            <p className="text-slate-400 mb-2">
              Player-by-player breakdown coming soon!
            </p>
            <p className="text-sm text-slate-500">
              View individual player scores, completion times, and common mistakes.
            </p>
          </div>
        </div>
      </main>
    </SidebarLayout>
  );
}
