"use client";

import { SidebarLayout } from "@/components/SidebarLayout";
import { useAuth } from "@/contexts/AuthContext";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useToast } from '@/components/Toast';
import type { ActivityType } from "@/types/activities";

// ═══════════════════════════════════════════════════════════════════════════
// ACTIVITY TYPE CARDS
// ═══════════════════════════════════════════════════════════════════════════

const ACTIVITY_TYPES: Array<{
  type: ActivityType;
  title: string;
  subtitle: string;
  icon: string;
  color: string;
  description: string;
}> = [
  {
    type: 'quick_quiz',
    title: 'QUICK QUIZ',
    subtitle: 'Multiple Choice',
    icon: '📋',
    color: 'teal',
    description: 'Test knowledge with multiple choice questions. Best for comprehension and recall.',
  },
  {
    type: 'true_false',
    title: 'TRUE/FALSE',
    subtitle: 'Speed Challenge',
    icon: '⚡',
    color: 'orange',
    description: 'Fast-paced true or false statements. Great for building streaks and quick recall.',
  },
  {
    type: 'scenario',
    title: 'SCENARIO',
    subtitle: 'Game Situations',
    icon: '🏈',
    color: 'ice',
    description: 'Real game situations requiring decision-making. Perfect for situational football.',
  },
  {
    type: 'coverage_id',
    title: 'COVERAGE ID',
    subtitle: 'Recognition',
    icon: '🛡️',
    color: 'purple',
    description: 'Identify defensive coverages from descriptions. Essential for QBs and receivers.',
  },
  {
    type: 'route_id',
    title: 'ROUTE ID',
    subtitle: 'Pattern Recognition',
    icon: '📍',
    color: 'gold',
    description: 'Recognize route concepts and combinations. Key for receivers and QBs.',
  },
  {
    type: 'mixed',
    title: 'MIXED REVIEW',
    subtitle: 'All Types',
    icon: '⭐',
    color: 'cyan',
    description: 'Comprehensive review with all question types mixed together.',
  },
];

const COLOR_CLASSES = {
  teal: 'from-teal-500/10 to-teal-600/5 border-teal-500/20',
  orange: 'from-orange-500/10 to-orange-600/5 border-orange-500/20',
  ice: 'from-cyan-500/10 to-cyan-600/5 border-cyan-500/20',
  purple: 'from-purple-500/10 to-purple-600/5 border-purple-500/20',
  gold: 'from-yellow-500/10 to-yellow-600/5 border-yellow-500/20',
  cyan: 'from-cyan-500/10 to-cyan-600/5 border-cyan-500/20',
};

// ═══════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

export default function CreateActivityPage() {
  const { orgId, teamId, session, loading: authLoading } = useAuth();
  const router = useRouter();
  const { showToast } = useToast();

  const [step, setStep] = useState(1);
  const [plays, setPlays] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);

  // Form data
  const [activityType, setActivityType] = useState<ActivityType | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [selectedPlayIds, setSelectedPlayIds] = useState<Set<string>>(new Set());
  const [difficulty, setDifficulty] = useState<string[]>([]);
  const [topics, setTopics] = useState<string[]>([]);
  const [positions, setPositions] = useState<string[]>([]);
  const [timeLimit, setTimeLimit] = useState<number | null>(null);
  const [passingScore, setPassingScore] = useState(80);
  const [questionCount, setQuestionCount] = useState<number | null>(null);
  const [showExplanations, setShowExplanations] = useState(true);
  const [allowRetakes, setAllowRetakes] = useState(true);
  const [assignmentType, setAssignmentType] = useState<'team' | 'positions' | 'users'>('team');
  const [assignmentValues, setAssignmentValues] = useState<string[]>([]);
  const [dueDate, setDueDate] = useState('');

  useEffect(() => {
    if (orgId && session) {
      fetchPlays();
    }
  }, [orgId, session]);

  const fetchPlays = async () => {
    if (!session?.access_token) {
      console.error('No session token available');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const response = await fetch(`/.netlify/functions/plays-list?orgId=${orgId}&status=approved`, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch plays');
      }

      const data = await response.json();
      setPlays(data.plays || []);
    } catch (error) {
      console.error('Error fetching plays:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    if (!activityType || !title || selectedPlayIds.size === 0) {
      showToast('Please complete all required fields', 'error');
      return;
    }

    if (!session?.access_token) {
      showToast('You must be signed in to create activities', 'error');
      return;
    }

    try {
      setCreating(true);

      const response = await fetch(`/.netlify/functions/activities-create?orgId=${orgId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          activity_type: activityType,
          title,
          description,
          play_ids: Array.from(selectedPlayIds),
          question_filters: {
            difficulty: difficulty.length > 0 ? difficulty : undefined,
            topics: topics.length > 0 ? topics : undefined,
            positions: positions.length > 0 ? positions : undefined,
          },
          time_limit_seconds: timeLimit,
          passing_score_percent: passingScore,
          question_count: questionCount,
          show_explanations: showExplanations,
          allow_retakes: allowRetakes,
          randomize_questions: true,
          randomize_options: true,
          assigned_to: {
            type: assignmentType,
            values: assignmentValues,
          },
          due_date: dueDate || null,
          team_id: teamId,
          status: 'active',
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create activity');
      }

      const data = await response.json();
      showToast('Activity created successfully!', 'success');
      router.push('/coach/activities');
    } catch (error) {
      console.error('Error creating activity:', error);
      showToast(error instanceof Error ? error.message : 'Failed to create activity', 'error');
      setCreating(false);
    }
  };

  if (authLoading || loading) {
    return (
      <SidebarLayout>
        <div className="flex h-screen items-center justify-center">
          <div className="flex items-center gap-3">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-[#00F6E5] border-t-transparent" />
            <span className="text-sm text-slate-400">Loading...</span>
          </div>
        </div>
      </SidebarLayout>
    );
  }

  return (
    <SidebarLayout>
      <main className="mx-auto max-w-5xl px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => router.push('/coach/activities')}
            className="text-slate-400 hover:text-white transition-colors mb-4"
          >
            ← Back to Activities
          </button>
          <h1 className="text-3xl font-black text-white mb-2">Create Activity</h1>
          <p className="text-slate-400">
            Step {step} of 4: {
              step === 1 ? 'Choose Activity Type' :
              step === 2 ? 'Select Plays' :
              step === 3 ? 'Configure Settings' :
              'Assign to Players'
            }
          </p>
        </div>

        {/* Progress Bar */}
        <div className="mb-8">
          <div className="h-2 bg-[#1B1E20] rounded-full overflow-hidden">
            <div
              className="h-full bg-[#00F6E5] transition-all duration-300"
              style={{ width: `${(step / 4) * 100}%` }}
            />
          </div>
        </div>

        {/* Step 1: Activity Type */}
        {step === 1 && (
          <div>
            <h2 className="text-xl font-bold text-white mb-6">Choose Activity Type</h2>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {ACTIVITY_TYPES.map((type) => (
                <button
                  key={type.type}
                  onClick={() => setActivityType(type.type)}
                  className={`glass-card p-6 text-left transition-all hover:scale-105 bg-gradient-to-br ${
                    COLOR_CLASSES[type.color as keyof typeof COLOR_CLASSES]
                  } ${
                    activityType === type.type
                      ? 'border-2 border-[#00F6E5] ring-2 ring-[#00F6E5]/50'
                      : 'border-2 border-transparent'
                  }`}
                >
                  <div className="text-3xl mb-3">{type.icon}</div>
                  <h3 className="text-lg font-black text-white mb-1">{type.title}</h3>
                  <p className="text-xs text-slate-400 uppercase mb-2">{type.subtitle}</p>
                  <p className="text-sm text-slate-300">{type.description}</p>
                </button>
              ))}
            </div>
            <div className="mt-8 flex justify-end">
              <button
                onClick={() => setStep(2)}
                disabled={!activityType}
                className="px-6 py-3 rounded-lg bg-[#00F6E5] text-black font-semibold hover:bg-[#00F6E5]/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next: Select Plays →
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Select Plays */}
        {step === 2 && (
          <div>
            <h2 className="text-xl font-bold text-white mb-6">Select Plays</h2>
            <div className="glass-card p-6 mb-6">
              <label className="block text-sm font-semibold text-white mb-2">
                Activity Title *
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., Week 3 Pass Game Quiz"
                className="w-full px-4 py-2 rounded-lg bg-[#1B1E20] text-white border border-[#2A2E30] focus:border-[#00F6E5] focus:outline-none mb-4"
              />

              <label className="block text-sm font-semibold text-white mb-2">
                Description (optional)
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="e.g., Test your knowledge of our pass game concepts"
                rows={3}
                className="w-full px-4 py-2 rounded-lg bg-[#1B1E20] text-white border border-[#2A2E30] focus:border-[#00F6E5] focus:outline-none"
              />
            </div>

            <h3 className="text-lg font-bold text-white mb-4">
              Choose Plays ({selectedPlayIds.size} selected)
            </h3>
            {plays.length === 0 ? (
              <div className="glass-card p-12 text-center">
                <p className="text-slate-400">
                  No approved plays found. Create and approve plays first.
                </p>
              </div>
            ) : (
              <div className="glass-card overflow-hidden max-h-96 overflow-y-auto">
                {plays.map((play) => (
                  <label
                    key={play.id}
                    className="flex items-center p-4 hover:bg-[#1B1E20]/50 cursor-pointer border-b border-[#1B1E20] last:border-0"
                  >
                    <input
                      type="checkbox"
                      checked={selectedPlayIds.has(play.id)}
                      onChange={(e) => {
                        const newSet = new Set(selectedPlayIds);
                        if (e.target.checked) {
                          newSet.add(play.id);
                        } else {
                          newSet.delete(play.id);
                        }
                        setSelectedPlayIds(newSet);
                      }}
                      className="mr-3 w-5 h-5"
                    />
                    <div className="flex-1">
                      <div className="text-white font-semibold">{play.name}</div>
                      <div className="text-sm text-slate-400">
                        {play.formation_name} • {play.concept}
                      </div>
                    </div>
                  </label>
                ))}
              </div>
            )}

            <div className="mt-8 flex justify-between">
              <button
                onClick={() => setStep(1)}
                className="px-6 py-3 rounded-lg bg-[#1B1E20] text-white font-semibold hover:bg-[#2A2E30] transition-all"
              >
                ← Back
              </button>
              <button
                onClick={() => setStep(3)}
                disabled={!title || selectedPlayIds.size === 0}
                className="px-6 py-3 rounded-lg bg-[#00F6E5] text-black font-semibold hover:bg-[#00F6E5]/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next: Configure Settings →
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Settings */}
        {step === 3 && (
          <div>
            <h2 className="text-xl font-bold text-white mb-6">Configure Settings</h2>
            <div className="glass-card p-6 space-y-6">
              {/* Time Limit */}
              <div>
                <label className="block text-sm font-semibold text-white mb-2">
                  Time Limit (optional)
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="number"
                    value={timeLimit || ''}
                    onChange={(e) => setTimeLimit(e.target.value ? parseInt(e.target.value) * 60 : null)}
                    placeholder="Minutes"
                    className="w-32 px-4 py-2 rounded-lg bg-[#1B1E20] text-white border border-[#2A2E30] focus:border-[#00F6E5] focus:outline-none"
                  />
                  <span className="text-slate-400">minutes</span>
                </div>
              </div>

              {/* Passing Score */}
              <div>
                <label className="block text-sm font-semibold text-white mb-2">
                  Passing Score: {passingScore}%
                </label>
                <input
                  type="range"
                  min="0"
                  max="100"
                  step="5"
                  value={passingScore}
                  onChange={(e) => setPassingScore(parseInt(e.target.value))}
                  className="w-full"
                />
              </div>

              {/* Question Count */}
              <div>
                <label className="block text-sm font-semibold text-white mb-2">
                  Number of Questions
                </label>
                <input
                  type="number"
                  value={questionCount || ''}
                  onChange={(e) => setQuestionCount(e.target.value ? parseInt(e.target.value) : null)}
                  placeholder="All available questions"
                  className="w-full px-4 py-2 rounded-lg bg-[#1B1E20] text-white border border-[#2A2E30] focus:border-[#00F6E5] focus:outline-none"
                />
              </div>

              {/* Checkboxes */}
              <div className="space-y-3">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={showExplanations}
                    onChange={(e) => setShowExplanations(e.target.checked)}
                    className="w-5 h-5"
                  />
                  <span className="text-white">Show explanations after each question</span>
                </label>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={allowRetakes}
                    onChange={(e) => setAllowRetakes(e.target.checked)}
                    className="w-5 h-5"
                  />
                  <span className="text-white">Allow players to retake this activity</span>
                </label>
              </div>
            </div>

            <div className="mt-8 flex justify-between">
              <button
                onClick={() => setStep(2)}
                className="px-6 py-3 rounded-lg bg-[#1B1E20] text-white font-semibold hover:bg-[#2A2E30] transition-all"
              >
                ← Back
              </button>
              <button
                onClick={() => setStep(4)}
                className="px-6 py-3 rounded-lg bg-[#00F6E5] text-black font-semibold hover:bg-[#00F6E5]/90 transition-all"
              >
                Next: Assign to Players →
              </button>
            </div>
          </div>
        )}

        {/* Step 4: Assignment */}
        {step === 4 && (
          <div>
            <h2 className="text-xl font-bold text-white mb-6">Assign to Players</h2>
            <div className="glass-card p-6 space-y-6">
              {/* Assignment Type */}
              <div>
                <label className="block text-sm font-semibold text-white mb-3">
                  Who should complete this activity?
                </label>
                <div className="space-y-2">
                  <label className="flex items-center gap-3 p-3 rounded-lg bg-[#1B1E20] cursor-pointer hover:bg-[#2A2E30]">
                    <input
                      type="radio"
                      name="assignment"
                      checked={assignmentType === 'team'}
                      onChange={() => {
                        setAssignmentType('team');
                        setAssignmentValues([]);
                      }}
                      className="w-5 h-5"
                    />
                    <span className="text-white">Entire Team</span>
                  </label>
                  <label className="flex items-center gap-3 p-3 rounded-lg bg-[#1B1E20] cursor-pointer hover:bg-[#2A2E30]">
                    <input
                      type="radio"
                      name="assignment"
                      checked={assignmentType === 'positions'}
                      onChange={() => setAssignmentType('positions')}
                      className="w-5 h-5"
                    />
                    <span className="text-white">Specific Positions</span>
                  </label>
                </div>
              </div>

              {/* Position Selection */}
              {assignmentType === 'positions' && (
                <div>
                  <label className="block text-sm font-semibold text-white mb-2">
                    Select Positions
                  </label>
                  <div className="grid grid-cols-4 gap-2">
                    {['QB', 'RB', 'FB', 'X', 'Z', 'H', 'Y', 'TE', 'LT', 'LG', 'C', 'RG', 'RT'].map(pos => (
                      <label
                        key={pos}
                        className="flex items-center gap-2 p-2 rounded bg-[#1B1E20] cursor-pointer hover:bg-[#2A2E30]"
                      >
                        <input
                          type="checkbox"
                          checked={assignmentValues.includes(pos)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setAssignmentValues([...assignmentValues, pos]);
                            } else {
                              setAssignmentValues(assignmentValues.filter(p => p !== pos));
                            }
                          }}
                          className="w-4 h-4"
                        />
                        <span className="text-white text-sm">{pos}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {/* Due Date */}
              <div>
                <label className="block text-sm font-semibold text-white mb-2">
                  Due Date (optional)
                </label>
                <input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="w-full px-4 py-2 rounded-lg bg-[#1B1E20] text-white border border-[#2A2E30] focus:border-[#00F6E5] focus:outline-none"
                />
              </div>
            </div>

            <div className="mt-8 flex justify-between">
              <button
                onClick={() => setStep(3)}
                className="px-6 py-3 rounded-lg bg-[#1B1E20] text-white font-semibold hover:bg-[#2A2E30] transition-all"
              >
                ← Back
              </button>
              <button
                onClick={handleCreate}
                disabled={creating || (assignmentType === 'positions' && assignmentValues.length === 0)}
                className="px-8 py-3 rounded-lg bg-[#00F6E5] text-black font-bold hover:bg-[#00F6E5]/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {creating ? (
                  <span className="flex items-center gap-2">
                    <div className="h-5 w-5 animate-spin rounded-full border-2 border-black border-t-transparent" />
                    Creating...
                  </span>
                ) : (
                  'Create Activity'
                )}
              </button>
            </div>
          </div>
        )}
      </main>
    </SidebarLayout>
  );
}
