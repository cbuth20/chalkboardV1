"use client";

import { SidebarLayout } from "@/components/SidebarLayout";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from '@/components/Toast';
import { useState, useEffect } from "react";
import { useRouter, useParams, useSearchParams } from "next/navigation";

export default function ActivityResultsPage() {
  return (
    <ProtectedRoute>
      <ActivityResultsContent />
    </ProtectedRoute>
  );
}

function ActivityResultsContent() {
  const { orgId, session } = useAuth();
  const { showToast } = useToast();
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const activityId = params.id as string;
  const attemptId = searchParams.get('attemptId');

  const [results, setResults] = useState<any>(null);
  const [activity, setActivity] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (attemptId && session && orgId) {
      // For now, we'll fetch from activity list and find the attempt
      // In production, you might want a dedicated endpoint for attempt results
      fetchResults();
    }
  }, [attemptId, session, orgId]);

  const fetchResults = async () => {
    if (!session?.access_token) {
      console.error('No session token available');
      setLoading(false);
      router.push(`/activities/${activityId}`);
      return;
    }

    if (!orgId) {
      console.error('No orgId available');
      setLoading(false);
      return;
    }

    if (!attemptId) {
      console.error('No attemptId available');
      setLoading(false);
      router.push(`/activities/${activityId}`);
      return;
    }

    try {
      setLoading(true);
      // Fetch specific attempt results
      const response = await fetch(
        `/.netlify/functions/activities-results?orgId=${orgId}&attemptId=${attemptId}`,
        {
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
          },
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch results');
      }

      const data = await response.json();

      setActivity(data.activity);
      setResults({
        score_percent: data.attempt.score_percent,
        correct_answers: data.attempt.correct_answers,
        total_questions: data.attempt.total_questions,
        time_spent_seconds: data.attempt.time_spent_seconds,
        passed: data.attempt.passed,
        question_results: data.attempt.question_results,
      });
    } catch (error) {
      console.error('Error fetching results:', error);
      showToast(error instanceof Error ? error.message : 'Failed to load results', 'error');
      router.push(`/activities/${activityId}`);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <SidebarLayout>
        <div className="flex h-screen items-center justify-center">
          <div className="flex items-center gap-3">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-[#00F6E5] border-t-transparent" />
            <span className="text-sm text-slate-400">Loading results...</span>
          </div>
        </div>
      </SidebarLayout>
    );
  }

  if (!results || !activity) {
    return null;
  }

  const passed = results.passed;
  const scorePercent = Math.round(results.score_percent || 0);
  const minutes = Math.floor((results.time_spent_seconds || 0) / 60);
  const seconds = (results.time_spent_seconds || 0) % 60;

  // Calculate topic breakdown
  const topicBreakdown: Record<string, { correct: number; total: number }> = {};

  if (results.question_results) {
    results.question_results.forEach((result: any) => {
      const topic = result.topic || 'general';
      if (!topicBreakdown[topic]) {
        topicBreakdown[topic] = { correct: 0, total: 0 };
      }
      topicBreakdown[topic].total++;
      if (result.correct) {
        topicBreakdown[topic].correct++;
      }
    });
  }

  return (
    <SidebarLayout>
      <main className="mx-auto max-w-4xl px-4 py-8">
        {/* Results Header */}
        <div className="glass-card p-8 mb-6 text-center">
          <div className="text-6xl mb-4">
            {passed ? '🎉' : '💪'}
          </div>
          <h1 className="text-3xl font-black text-white mb-2">
            {passed ? 'Congratulations!' : 'Keep Practicing!'}
          </h1>
          <p className="text-slate-400 mb-6">
            {passed
              ? `You passed with a score of ${scorePercent}%`
              : `You scored ${scorePercent}%. Keep studying and try again!`}
          </p>

          {/* Score Circle */}
          <div className="flex items-center justify-center mb-6">
            <div className={`relative w-48 h-48 rounded-full flex items-center justify-center ${
              passed
                ? 'bg-gradient-to-br from-green-500/20 to-green-600/5 border-4 border-green-500'
                : 'bg-gradient-to-br from-orange-500/20 to-orange-600/5 border-4 border-orange-500'
            }`}>
              <div className="text-center">
                <div className={`text-5xl font-black ${passed ? 'text-green-400' : 'text-orange-400'}`}>
                  {scorePercent}%
                </div>
                <div className="text-sm text-slate-400">
                  {results.correct_answers}/{results.total_questions}
                </div>
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 gap-4 max-w-md mx-auto">
            <div className="glass-card p-4">
              <div className="text-2xl font-black text-[#00F6E5]">
                {minutes}:{seconds.toString().padStart(2, '0')}
              </div>
              <div className="text-xs text-slate-400 uppercase">Time Taken</div>
            </div>
            <div className="glass-card p-4">
              <div className="text-2xl font-black text-yellow-400">
                {activity.passing_score_percent}%
              </div>
              <div className="text-xs text-slate-400 uppercase">Passing Score</div>
            </div>
          </div>
        </div>

        {/* Topic Breakdown */}
        {Object.keys(topicBreakdown).length > 0 && (
          <div className="glass-card p-6 mb-6">
            <h2 className="text-lg font-bold text-white mb-4">Performance by Topic</h2>
            <div className="space-y-3">
              {Object.entries(topicBreakdown).map(([topic, stats]) => {
                const percentage = Math.round((stats.correct / stats.total) * 100);
                return (
                  <div key={topic}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm text-slate-300 capitalize">
                        {topic.replace(/_/g, ' ')}
                      </span>
                      <span className="text-sm font-bold text-white">
                        {stats.correct}/{stats.total} ({percentage}%)
                      </span>
                    </div>
                    <div className="h-2 bg-[#1B1E20] rounded-full overflow-hidden">
                      <div
                        className={`h-full transition-all ${
                          percentage >= 80
                            ? 'bg-green-500'
                            : percentage >= 60
                            ? 'bg-yellow-500'
                            : 'bg-red-500'
                        }`}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-center gap-4">
          <button
            onClick={() => router.push('/activities')}
            className="px-6 py-3 rounded-lg bg-[#1B1E20] text-white font-semibold hover:bg-[#2A2E30] transition-all"
          >
            Back to Activities
          </button>
          {activity.allow_retakes && (
            <button
              onClick={() => router.push(`/activities/${activityId}`)}
              className="px-6 py-3 rounded-lg bg-[#00F6E5] text-black font-semibold hover:bg-[#00F6E5]/90 transition-all"
            >
              {passed ? 'Try to Improve' : 'Try Again'}
            </button>
          )}
        </div>
      </main>
    </SidebarLayout>
  );
}
