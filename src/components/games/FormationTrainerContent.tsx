"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';

// ═══════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════

interface AlignmentInfo {
  spot: string;
  detail: string;
}

interface Formation {
  id: string;
  formation_name: string;
  personnel?: string;
  description?: string;
  module: string;
  positions: Record<string, { x: number; y: number }>;
  coaching_notes: Record<string, string>;
  alignments: Record<string, AlignmentInfo>;
  source_pdf_ids: string[];
}

interface AnalysisStatus {
  id: string;
  status: 'processing' | 'completed' | 'failed';
  formations_extracted: number;
  estimated_tokens: number;
  processing_time_seconds: number;
  completed_at: string;
  started_at?: string;
}

interface QuizQuestion {
  type: 'alignment' | 'comparison';
  formation: string;
  player: string;
  question: string;
  correct: string;
  options: string[];
}

type View = 'home' | 'learn' | 'quiz' | 'results';

// ═══════════════════════════════════════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════════════════════════════════════

const PLAYER_COLORS: Record<string, string> = {
  T: '#00d4aa',
  X: '#ef4444',
  Y: '#fbbf24',
  Z: '#8b5cf6',
  R: '#ec4899',
  H: '#fbbf24',
};

const PLAYER_LABELS: Record<string, string> = {
  X: 'X (boundary WR)',
  Y: 'Y (TE)',
  Z: 'Z (field WR)',
  R: 'R (slot)',
  T: 'T (you - TB)',
};

const getPlayerColor = (player: string): string => PLAYER_COLORS[player] || '#7a8a88';

// ═══════════════════════════════════════════════════════════════════════════
// QUESTION GENERATION
// ═══════════════════════════════════════════════════════════════════════════

function generateQuizQuestions(formations: Formation[]): QuizQuestion[] {
  const questions: QuizQuestion[] = [];
  const formationsWithAlignments = formations.filter(
    f => f.alignments && Object.keys(f.alignments).length > 0
  );

  if (formationsWithAlignments.length === 0) return [];

  // Collect all unique spots for generating wrong answers
  const allSpots: string[] = [];
  formationsWithAlignments.forEach(f => {
    Object.values(f.alignments).forEach(a => {
      if (a.spot && !allSpots.includes(a.spot)) allSpots.push(a.spot);
    });
  });

  // Generate alignment questions
  formationsWithAlignments.forEach(f => {
    const positions = Object.keys(f.alignments);
    positions.forEach(pos => {
      const alignment = f.alignments[pos];
      if (!alignment?.spot) return;

      // Get wrong options from other positions in same formation + other formations
      const wrongOptions = allSpots.filter(s => s !== alignment.spot);
      const shuffledWrong = shuffleArray(wrongOptions).slice(0, 3);

      if (shuffledWrong.length < 3) return; // Need at least 3 wrong answers

      questions.push({
        type: 'alignment',
        formation: f.formation_name,
        player: pos,
        question: `In ${f.formation_name.toUpperCase()}, where does the ${pos} line up?`,
        correct: alignment.spot,
        options: shuffleArray([alignment.spot, ...shuffledWrong]),
      });
    });
  });

  // Generate comparison questions (which formation has position X at spot Y?)
  if (formationsWithAlignments.length >= 2) {
    const tbFormations = formationsWithAlignments.filter(f => f.alignments.T?.spot);
    if (tbFormations.length >= 2) {
      tbFormations.forEach(f => {
        const otherNames = tbFormations
          .filter(o => o.id !== f.id)
          .map(o => o.formation_name);
        const wrongNames = shuffleArray(otherNames).slice(0, 3);

        if (wrongNames.length < 3) return;

        questions.push({
          type: 'comparison',
          formation: f.formation_name,
          player: 'T',
          question: `Which formation has the TB at "${f.alignments.T.spot}"?`,
          correct: f.formation_name,
          options: shuffleArray([f.formation_name, ...wrongNames]),
        });
      });
    }
  }

  // Shuffle all questions and limit to 15
  return shuffleArray(questions).slice(0, 15);
}

function shuffleArray<T>(arr: T[]): T[] {
  const shuffled = [...arr];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

// ═══════════════════════════════════════════════════════════════════════════
// SVG FIELD COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

interface FieldProps {
  formation: Formation;
  highlightPlayer?: string | null;
}

function Field({ formation, highlightPlayer = null }: FieldProps) {
  // Data-driven Y normalization: works regardless of what coordinate system
  // Claude chose (y: 0-10, 0-50, 60-85, etc.)
  //
  // Strategy: receivers (X, Y, Z, R) cluster at the LOS, while QB/TB are
  // further back. We detect which end has more players and map accordingly.
  // SVG layout: LOS at y=28, backfield extends down to y=40.
  const yValues = Object.values(formation.positions).map(p => p.y);
  const minY = Math.min(...yValues);
  const maxY = Math.max(...yValues);
  const yRange = maxY - minY || 1;

  // Count positions near each extreme — the end with more is the LOS
  const threshold = yRange * 0.3;
  const nearMin = yValues.filter(y => y - minY < threshold).length;
  const nearMax = yValues.filter(y => maxY - y < threshold).length;
  const losIsMax = nearMax >= nearMin;

  const SVG_LOS = 28;  // where LOS renders in the SVG
  const SVG_BACK = 40;  // deepest backfield position

  const transformY = (y: number): number => {
    const norm = (y - minY) / yRange; // 0..1
    if (losIsMax) {
      // Higher data-y = LOS (SVG 28), lower data-y = backfield (SVG 40)
      return SVG_LOS + (1 - norm) * (SVG_BACK - SVG_LOS);
    }
    // Lower data-y = LOS (SVG 28), higher data-y = backfield (SVG 40)
    return SVG_LOS + norm * (SVG_BACK - SVG_LOS);
  };

  return (
    <svg className="w-full max-w-[500px] mx-auto block" viewBox="0 0 100 45" preserveAspectRatio="xMidYMid meet">
      <rect x="0" y="0" width="100" height="45" fill="#0d1a14" />
      <line x1="30" y1="0" x2="30" y2="45" stroke="#1a2f24" strokeWidth="0.3" strokeDasharray="2,2" />
      <line x1="70" y1="0" x2="70" y2="45" stroke="#1a2f24" strokeWidth="0.3" strokeDasharray="2,2" />
      <line x1="0" y1="30" x2="100" y2="30" stroke="#2a4035" strokeWidth="0.5" />
      <rect x="38" y="28" width="24" height="4" rx="1" fill="#1a2f24" stroke="#2a4035" strokeWidth="0.5" />
      <text x="50" y="31" textAnchor="middle" fill="#3a5045" fontSize="3" fontFamily="sans-serif">OL</text>

      {Object.entries(formation.positions)
        .filter(([p]) => p !== 'OL' && p !== 'Q')
        .map(([player, pos]) => {
          const color = getPlayerColor(player);
          const yPos = transformY(pos.y);
          const isHighlighted = highlightPlayer === player;

          return (
            <g key={player}>
              {isHighlighted && (
                <circle cx={pos.x} cy={yPos} r="5" fill={color} fillOpacity="0.15">
                  <animate attributeName="r" values="4;6;4" dur="1.5s" repeatCount="indefinite" />
                  <animate attributeName="opacity" values="0.3;0.1;0.3" dur="1.5s" repeatCount="indefinite" />
                </circle>
              )}
              <circle
                cx={pos.x}
                cy={yPos}
                r={player === 'T' ? 3.5 : 3}
                fill={color}
                fillOpacity={isHighlighted ? 0.5 : 0.3}
                stroke={color}
                strokeWidth={isHighlighted ? 2 : 1.5}
              />
              <text
                x={pos.x}
                y={yPos + 1}
                textAnchor="middle"
                fontSize="3"
                fill={color}
                fontWeight="600"
                fontFamily="sans-serif"
              >
                {player}
              </text>
            </g>
          );
        })}

      {/* QB */}
      {formation.positions.Q && (() => {
        const qbY = transformY(formation.positions.Q.y);
        return (
          <>
            <circle
              cx={formation.positions.Q.x}
              cy={qbY}
              r="2.5"
              fill="#666"
              fillOpacity="0.3"
              stroke="#666"
              strokeWidth="1"
            />
            <text
              x={formation.positions.Q.x}
              y={qbY + 1}
              textAnchor="middle"
              fontSize="2.5"
              fill="#666"
              fontWeight="600"
              fontFamily="sans-serif"
            >
              Q
            </text>
          </>
        );
      })()}
    </svg>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// PLAYER LEGEND
// ═══════════════════════════════════════════════════════════════════════════

function PlayerLegend({ compact = false }: { compact?: boolean }) {
  const entries = Object.entries(PLAYER_LABELS);
  return (
    <div className={`flex justify-center gap-4 flex-wrap ${compact ? 'p-3 bg-gray-900 rounded-lg' : 'p-4 bg-gray-800/50 rounded-lg'}`}>
      {entries.map(([key, label]) => (
        <div key={key} className={`flex items-center gap-2 ${compact ? 'text-xs' : 'text-sm'}`}>
          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: getPlayerColor(key) }} />
          <span>{compact ? key + (key === 'T' ? ' (you)' : '') : label}</span>
        </div>
      ))}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

export function FormationTrainerContent() {
  const { session, orgId, loading: authLoading } = useAuth();

  const [view, setView] = useState<View>('home');
  const [formations, setFormations] = useState<Formation[]>([]);
  const [analysisStatus, setAnalysisStatus] = useState<AnalysisStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);

  // Learn state
  const [learnIndex, setLearnIndex] = useState(0);

  // Quiz state
  const [quizQuestions, setQuizQuestions] = useState<QuizQuestion[]>([]);
  const [quizIndex, setQuizIndex] = useState(0);
  const [answers, setAnswers] = useState<Array<{ question: QuizQuestion; answer: string; isCorrect: boolean }>>([]);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);

  // Stats from localStorage
  const [stats, setStats] = useState({ attempts: 0, correct: 0 });

  useEffect(() => {
    try {
      const saved = localStorage.getItem('formationAlignmentStats');
      if (saved) setStats(JSON.parse(saved));
    } catch {
      // ignore
    }
  }, []);

  const saveStats = (newStats: { attempts: number; correct: number }) => {
    setStats(newStats);
    localStorage.setItem('formationAlignmentStats', JSON.stringify(newStats));
  };

  // Load formations on mount
  useEffect(() => {
    if (!authLoading && session && orgId) {
      const timer = setTimeout(() => loadData(), 300);
      return () => clearTimeout(timer);
    } else if (!authLoading && !session) {
      setLoading(false);
    }
  }, [authLoading, session, orgId]);

  const loadData = async () => {
    if (!session?.access_token || !orgId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`/api/player-formations?orgId=${orgId}`, {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });

      if (!response.ok) throw new Error('Failed to fetch formations');

      const data = await response.json();
      setFormations(data.formations || []);
      setAnalysisStatus(data.latestAnalysis);

      // Check if analysis is stuck
      if (data.latestAnalysis?.status === 'processing') {
        const startedAt = new Date(data.latestAnalysis.started_at).getTime();
        const minutesElapsed = (Date.now() - startedAt) / 1000 / 60;
        if (minutesElapsed > 15) {
          const confirmed = confirm('Your previous analysis appears to be stuck. Would you like to reset it?');
          if (confirmed) await clearStuckAnalysis(data.latestAnalysis.id);
        }
      }
    } catch (error) {
      console.error('Error loading formations:', error);
    } finally {
      setLoading(false);
    }
  };

  const clearStuckAnalysis = async (analysisId: string) => {
    if (!session?.access_token || !orgId) return;
    try {
      const response = await fetch(`/api/player-formations-analysis-reset?orgId=${orgId}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${session.access_token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ analysisId }),
      });
      if (!response.ok) throw new Error((await response.json()).error || 'Failed to reset');
      alert('Analysis reset successfully! You can now start a new analysis.');
      await loadData();
    } catch (error) {
      alert(`Failed to reset: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const startAnalysis = async () => {
    if (!confirm('This will analyze all your uploaded PDFs using AI. This may take several minutes. Continue?')) return;
    if (!session?.access_token || !orgId) return;

    setAnalyzing(true);
    try {
      const response = await fetch(`/api/player-formations-analyze?orgId=${orgId}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${session.access_token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ positions: ['QB', 'RB', 'WR', 'OT'] }),
      });

      if (!response.ok) throw new Error((await response.json()).error || 'Analysis failed');
      const data = await response.json();
      alert(`Analysis started! Processing ${data.pdfCount} PDFs. Estimated time: ${data.estimatedDuration}. Refresh in a few minutes.`);
      await loadData();
    } catch (error) {
      alert(`Failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setAnalyzing(false);
    }
  };

  // Formations with alignment data
  const formationsWithAlignments = formations.filter(
    f => f.alignments && Object.keys(f.alignments).length > 0
  );

  const startLearn = () => {
    setLearnIndex(0);
    setView('learn');
  };

  const startQuiz = () => {
    const source = formationsWithAlignments.length > 0 ? formationsWithAlignments : formations;
    const questions = generateQuizQuestions(source);
    if (questions.length === 0) {
      alert('Not enough alignment data to generate a quiz. Try analyzing your playbooks first.');
      return;
    }
    setQuizQuestions(questions);
    setQuizIndex(0);
    setAnswers([]);
    setSelectedAnswer(null);
    setShowFeedback(false);
    setView('quiz');
  };

  const handleAnswer = useCallback((answer: string) => {
    if (showFeedback) return;
    const q = quizQuestions[quizIndex];
    const isCorrect = answer === q.correct;

    setSelectedAnswer(answer);
    setShowFeedback(true);
    setAnswers(prev => [...prev, { question: q, answer, isCorrect }]);
    saveStats({ attempts: stats.attempts + 1, correct: stats.correct + (isCorrect ? 1 : 0) });

    setTimeout(() => {
      if (quizIndex + 1 < quizQuestions.length) {
        setQuizIndex(prev => prev + 1);
        setSelectedAnswer(null);
        setShowFeedback(false);
      } else {
        setView('results');
      }
    }, 2000);
  }, [showFeedback, quizQuestions, quizIndex, stats]);

  // ═══════════════════════════════════════════════════════════════════════════
  // LOADING / AUTH STATES
  // ═══════════════════════════════════════════════════════════════════════════

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <div className="text-center">
          <div className="h-12 w-12 mx-auto mb-4 animate-spin rounded-full border-4 border-[#00d4aa]/20 border-t-[#00d4aa]" />
          <p className="text-gray-400">Loading formation trainer...</p>
        </div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="flex items-center justify-center py-32">
        <div className="text-center">
          <div className="text-4xl mb-4">🔒</div>
          <p className="text-gray-400">Please log in to access the formation trainer</p>
        </div>
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // HOME VIEW
  // ═══════════════════════════════════════════════════════════════════════════

  if (view === 'home') {
    const positionCount = new Set(
      formationsWithAlignments.flatMap(f => Object.keys(f.alignments))
    ).size;

    return (
      <div>
        {/* Module Tag */}
        <div className="inline-block bg-[#00d4aa]/10 text-[#00d4aa] px-3 py-1 rounded-md text-xs font-semibold uppercase tracking-wide mb-4">
          YOUR PLAYBOOK
        </div>

        {/* Title */}
        <h2 className="text-4xl font-bold text-white mb-2">
          Your <span className="text-[#00d4aa]">Alignment</span>
        </h2>
        <p className="text-gray-400 mb-6">Know where YOU and every receiver lines up in each formation</p>

        {/* Player Legend */}
        <div className="mb-6">
          <PlayerLegend />
        </div>

        {/* Mode Cards */}
        {formationsWithAlignments.length > 0 ? (
          <>
            <div className="grid grid-cols-2 gap-4 mb-8">
              <div
                onClick={startLearn}
                className="bg-gray-800 hover:bg-gray-700 border border-gray-700 hover:border-[#00d4aa] rounded-xl p-8 cursor-pointer transition text-center"
              >
                <div className="text-4xl mb-4">📍</div>
                <div className="text-xl font-bold mb-2">Learn</div>
                <div className="text-sm text-gray-400">
                  Study every player's spot in {formationsWithAlignments.length} formations
                </div>
              </div>
              <div
                onClick={startQuiz}
                className="bg-gray-800 hover:bg-gray-700 border border-gray-700 hover:border-[#00d4aa] rounded-xl p-8 cursor-pointer transition text-center"
              >
                <div className="text-4xl mb-4">🎯</div>
                <div className="text-xl font-bold mb-2">Test</div>
                <div className="text-sm text-gray-400">15 questions on alignment spots</div>
              </div>
            </div>

            {/* Stats Row */}
            <div className="grid grid-cols-3 gap-3 mb-8">
              <div className="bg-gray-800 rounded-lg p-5 text-center">
                <div className="text-3xl font-bold text-[#00d4aa]">{stats.attempts}</div>
                <div className="text-xs text-gray-400 uppercase tracking-wide mt-1">Answered</div>
              </div>
              <div className="bg-gray-800 rounded-lg p-5 text-center">
                <div className="text-3xl font-bold text-[#00d4aa]">
                  {stats.attempts > 0 ? Math.round((stats.correct / stats.attempts) * 100) : 0}%
                </div>
                <div className="text-xs text-gray-400 uppercase tracking-wide mt-1">Accuracy</div>
              </div>
              <div className="bg-gray-800 rounded-lg p-5 text-center">
                <div className="text-3xl font-bold text-[#00d4aa]">{positionCount}</div>
                <div className="text-xs text-gray-400 uppercase tracking-wide mt-1">Positions</div>
              </div>
            </div>
          </>
        ) : formations.length > 0 ? (
          <div className="bg-yellow-900/20 border border-yellow-700/50 rounded-lg p-6 mb-8">
            <h3 className="text-lg font-semibold text-yellow-400 mb-2">No Alignment Data Yet</h3>
            <p className="text-gray-300 mb-4">
              Your formations have been loaded but don't have alignment data yet.
              Re-analyze your playbooks to extract alignment information.
            </p>
          </div>
        ) : (
          <div className="bg-yellow-900/20 border border-yellow-700/50 rounded-lg p-6 mb-8">
            <h3 className="text-lg font-semibold text-yellow-400 mb-2">No Formations Found</h3>
            <p className="text-gray-300 mb-4">
              Upload your playbook PDFs in the <strong>My Notes</strong> section, then come back here to analyze them.
            </p>
          </div>
        )}

        {/* Analyze Playbooks Button */}
        <div className="bg-[#1B1E20] border border-[#2A2F33] rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-white mb-1">
                {formations.length > 0 ? 'Re-analyze Playbooks' : 'Analyze Playbooks'}
              </h3>
              <p className="text-sm text-gray-400">
                {formations.length > 0
                  ? 'Added new PDFs? Run analysis again to update formations.'
                  : 'Upload playbook PDFs first, then analyze to extract formations.'}
              </p>
              {analysisStatus?.status === 'processing' && (
                <p className="text-sm text-yellow-400 mt-1">Analysis in progress...</p>
              )}
            </div>
            <button
              onClick={startAnalysis}
              disabled={analyzing || analysisStatus?.status === 'processing'}
              className="px-6 py-3 bg-[#00d4aa] hover:bg-[#00bfa0] disabled:bg-gray-600 disabled:cursor-not-allowed text-black font-bold rounded-lg transition whitespace-nowrap"
            >
              {analyzing ? 'Starting...' : analysisStatus?.status === 'processing' ? 'In Progress...' : 'Analyze Playbooks'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // LEARN VIEW
  // ═══════════════════════════════════════════════════════════════════════════

  if (view === 'learn') {
    const source = formationsWithAlignments.length > 0 ? formationsWithAlignments : formations;
    const currentFormation = source[learnIndex];

    if (!currentFormation) {
      setView('home');
      return null;
    }

    const alignments = currentFormation.alignments || {};

    return (
      <div>
        <div
          className="text-sm text-gray-400 mb-6 cursor-pointer hover:text-[#00d4aa] transition"
          onClick={() => setView('home')}
        >
          ← Back to menu
        </div>

        <div className="bg-gray-800 rounded-xl p-6 mb-4">
          {/* Header */}
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2 text-xs font-semibold text-gray-400 uppercase tracking-wide">
              <div className="w-2 h-2 bg-[#00d4aa] rounded-full" />
              Alignment
            </div>
            <div className="bg-gray-900 text-[#00d4aa] px-3 py-1 rounded-md text-xs font-semibold">
              {learnIndex + 1} of {source.length}
            </div>
          </div>

          {/* Navigation Dots */}
          <div className="flex justify-center gap-2 mb-6">
            {source.map((_, i) => (
              <div
                key={i}
                onClick={() => setLearnIndex(i)}
                className={`h-2 rounded-full cursor-pointer transition-all ${
                  i === learnIndex ? 'w-6 bg-[#00d4aa]' : 'w-2 bg-gray-700 hover:bg-gray-600'
                }`}
              />
            ))}
          </div>

          {/* Formation Name */}
          <div className="text-4xl font-bold text-[#00d4aa] text-center mb-1">
            {currentFormation.formation_name}
          </div>
          <div className="text-sm text-gray-400 text-center mb-6">
            {currentFormation.personnel || currentFormation.module}
          </div>

          {/* Field */}
          <div className="bg-[#0d1a14] border border-gray-700 rounded-lg p-5 mb-5">
            <Field formation={currentFormation} />
          </div>

          {/* Legend */}
          <div className="mb-5">
            <PlayerLegend compact />
          </div>

          {/* Alignment Cards */}
          {Object.keys(alignments).length > 0 && (
            <>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 mb-4">
                {Object.entries(alignments).map(([player, info]) => (
                  <div key={player} className="bg-gray-900 rounded-lg p-4 text-center">
                    <div className="text-xl font-bold mb-1" style={{ color: getPlayerColor(player) }}>
                      {player}
                    </div>
                    <div className="text-xs text-gray-400 leading-snug">{info.spot}</div>
                  </div>
                ))}
              </div>

              {/* TB Highlight */}
              {alignments.T && (
                <div className="bg-gray-900 rounded-lg p-5">
                  <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Your spot (TB)</div>
                  <div className="text-sm text-gray-300">
                    <strong>{alignments.T.spot}</strong> — {alignments.T.detail}
                  </div>
                </div>
              )}
            </>
          )}

          {/* Navigation Buttons */}
          <div className="flex gap-3 justify-center mt-8">
            <button
              onClick={() => setLearnIndex(Math.max(0, learnIndex - 1))}
              disabled={learnIndex === 0}
              className="px-6 py-3 bg-transparent border border-gray-700 hover:border-[#00d4aa] hover:text-[#00d4aa] rounded-lg font-semibold disabled:opacity-30 disabled:cursor-not-allowed transition"
            >
              ← Previous
            </button>
            <button
              onClick={startQuiz}
              className="px-8 py-3 bg-[#00d4aa] hover:bg-[#00bfa0] text-black font-bold rounded-lg transition"
            >
              Start Test
            </button>
            <button
              onClick={() => setLearnIndex(Math.min(source.length - 1, learnIndex + 1))}
              disabled={learnIndex === source.length - 1}
              className="px-6 py-3 bg-transparent border border-gray-700 hover:border-[#00d4aa] hover:text-[#00d4aa] rounded-lg font-semibold disabled:opacity-30 disabled:cursor-not-allowed transition"
            >
              Next →
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // QUIZ VIEW
  // ═══════════════════════════════════════════════════════════════════════════

  if (view === 'quiz') {
    const currentQuestion = quizQuestions[quizIndex];
    if (!currentQuestion) {
      setView('results');
      return null;
    }

    // Find formation for field display
    const formationData = currentQuestion.type !== 'comparison'
      ? formations.find(f => f.formation_name === currentQuestion.formation)
      : null;

    return (
      <div>
        <div
          className="text-sm text-gray-400 mb-6 cursor-pointer hover:text-[#00d4aa] transition"
          onClick={() => setView('home')}
        >
          ← Exit test
        </div>

        <div className="bg-gray-800 rounded-xl p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2 text-xs font-semibold text-gray-400 uppercase tracking-wide">
              <div className="w-2 h-2 bg-[#00d4aa] rounded-full" />
              Alignment
            </div>
            <div className="bg-gray-900 text-[#00d4aa] px-3 py-1 rounded-md text-xs font-semibold">
              Question {quizIndex + 1}
            </div>
          </div>

          {/* Progress Bar */}
          <div className="mb-6">
            <div className="flex justify-between text-xs text-gray-400 mb-2">
              <span>Progress</span>
              <span>{quizIndex + 1}/{quizQuestions.length}</span>
            </div>
            <div className="h-1.5 bg-gray-900 rounded-full overflow-hidden">
              <div
                className="h-full bg-[#00d4aa] transition-all"
                style={{ width: `${((quizIndex + 1) / quizQuestions.length) * 100}%` }}
              />
            </div>
          </div>

          {/* Field */}
          {formationData && (
            <div className="bg-[#0d1a14] border border-gray-700 rounded-lg p-5 mb-6">
              <Field formation={formationData} highlightPlayer={currentQuestion.player} />
            </div>
          )}

          {/* Question */}
          <div className="text-xl font-semibold text-center mb-6 leading-snug">{currentQuestion.question}</div>

          {/* Options */}
          <div className="grid grid-cols-2 gap-3">
            {currentQuestion.options.map((opt, i) => {
              let cls = 'bg-gray-900 border-2 border-gray-700 rounded-xl p-4 cursor-pointer transition text-center';
              if (showFeedback) {
                cls += ' pointer-events-none';
                if (opt === currentQuestion.correct) {
                  cls = 'bg-green-500/15 border-2 border-green-500 rounded-xl p-4 text-center';
                } else if (opt === selectedAnswer) {
                  cls = 'bg-red-500/10 border-2 border-red-500 rounded-xl p-4 text-center';
                }
              } else {
                cls += ' hover:border-[#00d4aa] hover:bg-[#00d4aa]/5';
              }
              return (
                <div key={i} className={cls} onClick={() => handleAnswer(opt)}>
                  <div className="text-sm font-semibold">{opt}</div>
                </div>
              );
            })}
          </div>

          {/* Feedback */}
          {showFeedback && (
            <div
              className={`mt-5 text-center p-4 rounded-lg font-medium ${
                selectedAnswer === currentQuestion.correct
                  ? 'bg-green-500/10 text-green-400'
                  : 'bg-red-500/10 text-red-400'
              }`}
            >
              {selectedAnswer === currentQuestion.correct ? '✓ Correct!' : `✗ ${currentQuestion.correct}`}
            </div>
          )}
        </div>
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // RESULTS VIEW
  // ═══════════════════════════════════════════════════════════════════════════

  if (view === 'results') {
    const correct = answers.filter(a => a.isCorrect).length;
    const total = answers.length;
    const pct = total > 0 ? Math.round((correct / total) * 100) : 0;

    let message = '';
    if (pct >= 90) message = 'You know where everyone lines up! Elite-level alignment knowledge.';
    else if (pct >= 70) message = 'Good progress. Review the formations where you missed spots.';
    else message = 'Study the alignment cards again. Focus on what makes each spot unique.';

    return (
      <div>
        <div className="bg-gray-800 rounded-xl p-6">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2 text-xs font-semibold text-gray-400 uppercase tracking-wide">
              <div className="w-2 h-2 bg-[#00d4aa] rounded-full" />
              Test Complete
            </div>
            <div className="bg-gray-900 text-[#00d4aa] px-3 py-1 rounded-md text-xs font-semibold">Alignment</div>
          </div>

          <div className="text-center py-12">
            <div className="text-7xl font-bold text-[#00d4aa]">{pct}%</div>
            <div className="text-lg text-gray-400 mt-2">{correct} of {total} correct</div>
            <div className="text-base text-white mt-6 leading-relaxed max-w-md mx-auto">{message}</div>
          </div>

          <div className="flex gap-3 justify-center mt-8">
            <button
              onClick={startLearn}
              className="px-6 py-3 bg-transparent border border-gray-700 hover:border-[#00d4aa] hover:text-[#00d4aa] rounded-lg font-semibold transition"
            >
              Review
            </button>
            <button
              onClick={startQuiz}
              className="px-8 py-3 bg-[#00d4aa] hover:bg-[#00bfa0] text-black font-bold rounded-lg transition"
            >
              Try Again
            </button>
            <button
              onClick={() => setView('home')}
              className="px-6 py-3 bg-transparent border border-gray-700 hover:border-[#00d4aa] hover:text-[#00d4aa] rounded-lg font-semibold transition"
            >
              Menu
            </button>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
