"use client";

import { SidebarLayout } from "@/components/SidebarLayout";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { useAuth } from "@/contexts/AuthContext";
import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { useToast } from '@/components/Toast';
import type { ActivityType } from "@/types/activities";

const ACTIVITY_METADATA: Record<ActivityType, {
  title: string;
  icon: string;
  color: string;
}> = {
  quick_quiz: { title: "QUICK QUIZ", icon: "📋", color: "teal" },
  true_false: { title: "TRUE/FALSE", icon: "⚡", color: "orange" },
  scenario: { title: "SCENARIO", icon: "🏈", color: "ice" },
  coverage_id: { title: "COVERAGE ID", icon: "🛡️", color: "purple" },
  route_id: { title: "ROUTE ID", icon: "📍", color: "gold" },
  mixed: { title: "MIXED REVIEW", icon: "⭐", color: "cyan" },
};

export default function ActivityDetailPage() {
  return (
    <ProtectedRoute>
      <ActivityDetailContent />
    </ProtectedRoute>
  );
}

function ActivityDetailContent() {
  const { orgId, session } = useAuth();
  const router = useRouter();
  const params = useParams();
  const { showToast } = useToast();
  const activityId = params.id as string;

  const [activity, setActivity] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(false);

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

    if (!orgId) {
      console.error('No orgId available');
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
        router.push('/activities');
        return;
      }

      setActivity(found);
    } catch (error) {
      console.error('Error fetching activity:', error);
      showToast('Failed to load activity', 'error');
      router.push('/activities');
    } finally {
      setLoading(false);
    }
  };

  const handleStart = async () => {
    if (!session?.access_token) {
      showToast('You must be signed in to start activities', 'error');
      return;
    }

    try {
      setStarting(true);
      const response = await fetch(`/.netlify/functions/activities-start?orgId=${orgId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ activityId }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to start activity');
      }

      const data = await response.json();

      // Navigate to play page with attempt data
      router.push(`/activities/${activityId}/play?attemptId=${data.attempt.id}`);
    } catch (error) {
      console.error('Error starting activity:', error);
      showToast(error instanceof Error ? error.message : 'Failed to start activity', 'error');
      setStarting(false);
    }
  };

  if (loading) {
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
  const progress = activity.user_progress;
  const hasPassed = progress?.passed;
  const canRetake = activity.allow_retakes || !hasPassed;

  return (
    <SidebarLayout>
      <main className="mx-auto max-w-4xl px-4 py-8">
        {/* Back Button */}
        <button
          onClick={() => router.push('/activities')}
          className="mb-6 text-slate-400 hover:text-white transition-colors"
        >
          ← Back to Activities
        </button>

        {/* Header */}
        <div className="glass-card p-8 mb-6">
          <div className="flex items-start gap-6">
            <div className="text-5xl">{metadata.icon}</div>
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-3xl font-black text-white">
                  {activity.title}
                </h1>
                {hasPassed && (
                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-green-500/20 text-green-400">
                    ✓ PASSED
                  </span>
                )}
              </div>
              <p className="text-sm text-slate-400 uppercase tracking-wider mb-3">
                {metadata.title}
              </p>
              {activity.description && (
                <p className="text-slate-300 mb-4">
                  {activity.description}
                </p>
              )}

              {/* Stats */}
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
                  <span className="text-slate-400">Questions:</span>
                  <span className="text-white font-bold ml-2">
                    {activity.question_count || 'All available'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Due Date Warning */}
        {activity.due_date && new Date(activity.due_date) < new Date() && !hasPassed && (
          <div className="glass-card p-4 mb-6 bg-red-500/10 border-red-500/20">
            <div className="flex items-center gap-3">
              <span className="text-2xl">⚠️</span>
              <div>
                <p className="text-red-400 font-semibold">This activity is overdue!</p>
                <p className="text-sm text-slate-400">
                  Due: {new Date(activity.due_date).toLocaleDateString()}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Previous Attempts */}
        {progress?.attempts_count > 0 && (
          <div className="glass-card p-6 mb-6">
            <h2 className="text-lg font-bold text-white mb-4">Your Progress</h2>
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-2xl font-black text-[#00F6E5]">
                  {progress.attempts_count}
                </div>
                <div className="text-xs text-slate-400 uppercase">Attempts</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-black text-yellow-400">
                  {progress.best_score ? `${Math.round(progress.best_score)}%` : '—'}
                </div>
                <div className="text-xs text-slate-400 uppercase">Best Score</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-black text-green-400">
                  {hasPassed ? 'YES' : 'NO'}
                </div>
                <div className="text-xs text-slate-400 uppercase">Passed</div>
              </div>
            </div>
          </div>
        )}

        {/* Start Button */}
        <div className="glass-card p-6">
          {!canRetake ? (
            <div className="text-center">
              <p className="text-slate-400 mb-4">
                You've already passed this activity and retakes are not allowed.
              </p>
              <button
                onClick={() => router.push('/activities')}
                className="px-6 py-3 rounded-lg bg-[#1B1E20] text-white font-semibold hover:bg-[#2A2E30] transition-all"
              >
                Back to Activities
              </button>
            </div>
          ) : (
            <div className="text-center">
              {progress?.attempts_count > 0 && (
                <p className="text-slate-400 mb-4">
                  {hasPassed
                    ? "You've passed! Want to improve your score?"
                    : "Ready to try again? You can do it!"}
                </p>
              )}
              <button
                onClick={handleStart}
                disabled={starting}
                className="px-8 py-4 rounded-lg bg-[#00F6E5] text-black text-lg font-bold hover:bg-[#00F6E5]/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {starting ? (
                  <span className="flex items-center gap-2">
                    <div className="h-5 w-5 animate-spin rounded-full border-2 border-black border-t-transparent" />
                    Starting...
                  </span>
                ) : progress?.attempts_count > 0 ? (
                  'Start New Attempt'
                ) : (
                  'Start Activity'
                )}
              </button>
            </div>
          )}
        </div>
      </main>
    </SidebarLayout>
  );
}
