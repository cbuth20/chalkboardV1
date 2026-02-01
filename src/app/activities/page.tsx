"use client";

import { SidebarLayout } from "@/components/SidebarLayout";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { useAuth } from "@/contexts/AuthContext";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import type { ActivityType } from "@/types/activities";

// ═══════════════════════════════════════════════════════════════════════════
// ACTIVITY METADATA
// ═══════════════════════════════════════════════════════════════════════════

const ACTIVITY_METADATA: Record<ActivityType, {
  title: string;
  subtitle: string;
  icon: string;
  color: string;
  description: string;
}> = {
  quick_quiz: {
    title: "QUICK QUIZ",
    subtitle: "Multiple Choice",
    icon: "📋",
    color: "teal",
    description: "Test your knowledge with multiple choice questions",
  },
  true_false: {
    title: "TRUE/FALSE",
    subtitle: "Speed Challenge",
    icon: "⚡",
    color: "orange",
    description: "Quick true or false statements - build your streak!",
  },
  scenario: {
    title: "SCENARIO",
    subtitle: "Game Situations",
    icon: "🏈",
    color: "ice",
    description: "Make the right call in game-like scenarios",
  },
  coverage_id: {
    title: "COVERAGE ID",
    subtitle: "Recognition Test",
    icon: "🛡️",
    color: "purple",
    description: "Identify defensive coverages from pre-snap looks",
  },
  route_id: {
    title: "ROUTE ID",
    subtitle: "Pattern Recognition",
    icon: "📍",
    color: "gold",
    description: "Recognize route concepts and combinations",
  },
  mixed: {
    title: "MIXED REVIEW",
    subtitle: "All Question Types",
    icon: "⭐",
    color: "cyan",
    description: "Comprehensive review with all question types",
  },
};

const COLOR_CLASSES = {
  teal: "from-teal-500/10 to-teal-600/5 border-teal-500/20 text-teal-400",
  orange: "from-orange-500/10 to-orange-600/5 border-orange-500/20 text-orange-400",
  ice: "from-cyan-500/10 to-cyan-600/5 border-cyan-500/20 text-cyan-400",
  purple: "from-purple-500/10 to-purple-600/5 border-purple-500/20 text-purple-400",
  gold: "from-yellow-500/10 to-yellow-600/5 border-yellow-500/20 text-yellow-400",
  cyan: "from-cyan-500/10 to-cyan-600/5 border-cyan-500/20 text-cyan-400",
};

// ═══════════════════════════════════════════════════════════════════════════
// MAIN PAGE
// ═══════════════════════════════════════════════════════════════════════════

export default function ActivitiesPage() {
  return (
    <ProtectedRoute>
      <ActivitiesContent />
    </ProtectedRoute>
  );
}

function ActivitiesContent() {
  const { orgId, session, loading: authLoading } = useAuth();
  const router = useRouter();
  const [activities, setActivities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'todo' | 'completed'>('all');

  useEffect(() => {
    if (orgId && session) {
      fetchActivities();
    }
  }, [orgId, session]);

  const fetchActivities = async () => {
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
      setActivities(data.activities || []);
    } catch (error) {
      console.error('Error fetching activities:', error);
    } finally {
      setLoading(false);
    }
  };

  const getActivityStatus = (activity: any) => {
    const progress = activity.user_progress;

    if (progress?.passed) return 'completed';
    if (progress?.attempts_count > 0) return 'in_progress';

    // Check if overdue
    if (activity.due_date) {
      const dueDate = new Date(activity.due_date);
      if (dueDate < new Date()) return 'overdue';
    }

    return 'todo';
  };

  const filteredActivities = activities.filter(activity => {
    const status = getActivityStatus(activity);

    if (filter === 'todo') return status === 'todo' || status === 'overdue';
    if (filter === 'completed') return status === 'completed';
    return true; // 'all'
  });

  const stats = {
    total: activities.length,
    todo: activities.filter(a => ['todo', 'overdue'].includes(getActivityStatus(a))).length,
    completed: activities.filter(a => getActivityStatus(a) === 'completed').length,
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
      <main className="mx-auto max-w-7xl px-4 py-8 lg:px-8">
        {/* Header */}
        <header className="mb-8">
          <h1 className="text-3xl font-black tracking-tight text-white lg:text-4xl mb-2">
            My Activities
          </h1>
          <p className="text-slate-400">
            Complete activities assigned by your coach to improve your football IQ
          </p>
        </header>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="glass-card p-4">
            <div className="text-2xl font-black text-[#00F6E5]">{stats.total}</div>
            <div className="text-xs text-slate-400 uppercase tracking-wider">Total</div>
          </div>
          <div className="glass-card p-4">
            <div className="text-2xl font-black text-orange-400">{stats.todo}</div>
            <div className="text-xs text-slate-400 uppercase tracking-wider">To Do</div>
          </div>
          <div className="glass-card p-4">
            <div className="text-2xl font-black text-green-400">{stats.completed}</div>
            <div className="text-xs text-slate-400 uppercase tracking-wider">Completed</div>
          </div>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-3 mb-6">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
              filter === 'all'
                ? 'bg-[#00F6E5] text-black'
                : 'bg-[#1B1E20] text-slate-400 hover:text-white'
            }`}
          >
            All Activities
          </button>
          <button
            onClick={() => setFilter('todo')}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
              filter === 'todo'
                ? 'bg-[#00F6E5] text-black'
                : 'bg-[#1B1E20] text-slate-400 hover:text-white'
            }`}
          >
            To Do
          </button>
          <button
            onClick={() => setFilter('completed')}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
              filter === 'completed'
                ? 'bg-[#00F6E5] text-black'
                : 'bg-[#1B1E20] text-slate-400 hover:text-white'
            }`}
          >
            Completed
          </button>
        </div>

        {/* Activity Cards */}
        {filteredActivities.length === 0 ? (
          <div className="glass-card p-12 text-center">
            <div className="text-4xl mb-4">📚</div>
            <h3 className="text-xl font-bold text-white mb-2">No Activities</h3>
            <p className="text-slate-400">
              {filter === 'all'
                ? "You don't have any assigned activities yet."
                : `No ${filter} activities.`}
            </p>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredActivities.map((activity) => {
              const metadata = ACTIVITY_METADATA[activity.activity_type as ActivityType];
              const status = getActivityStatus(activity);
              const progress = activity.user_progress;

              return (
                <div
                  key={activity.id}
                  onClick={() => router.push(`/activities/${activity.id}`)}
                  className={`glass-card p-6 cursor-pointer transition-all hover:scale-105 hover:border-[#00F6E5]/50 bg-gradient-to-br ${
                    COLOR_CLASSES[metadata.color as keyof typeof COLOR_CLASSES]
                  }`}
                >
                  {/* Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="text-3xl">{metadata.icon}</div>
                    <div className="flex flex-col items-end gap-2">
                      {status === 'completed' && (
                        <span className="px-2 py-1 rounded text-xs font-bold bg-green-500/20 text-green-400">
                          COMPLETED
                        </span>
                      )}
                      {status === 'in_progress' && (
                        <span className="px-2 py-1 rounded text-xs font-bold bg-blue-500/20 text-blue-400">
                          IN PROGRESS
                        </span>
                      )}
                      {status === 'overdue' && (
                        <span className="px-2 py-1 rounded text-xs font-bold bg-red-500/20 text-red-400">
                          OVERDUE
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Content */}
                  <h3 className="text-lg font-black text-white mb-1">
                    {activity.title}
                  </h3>
                  <p className="text-xs text-slate-400 uppercase tracking-wider mb-3">
                    {metadata.subtitle}
                  </p>

                  {/* Stats */}
                  <div className="flex items-center gap-4 text-sm">
                    {progress?.best_score !== null && progress?.best_score !== undefined && (
                      <div>
                        <span className="text-white font-bold">{Math.round(progress.best_score)}%</span>
                        <span className="text-slate-500 ml-1">score</span>
                      </div>
                    )}
                    <div>
                      <span className="text-white font-bold">{progress?.attempts_count || 0}</span>
                      <span className="text-slate-500 ml-1">attempts</span>
                    </div>
                  </div>

                  {/* Due Date */}
                  {activity.due_date && (
                    <div className="mt-4 pt-4 border-t border-white/10">
                      <p className="text-xs text-slate-400">
                        Due: {new Date(activity.due_date).toLocaleDateString()}
                      </p>
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
