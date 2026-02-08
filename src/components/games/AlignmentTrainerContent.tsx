"use client";

import React, { useState, useEffect } from 'react';

// ═══════════════════════════════════════════════════════════════════════════
// TYPES & DATA
// ═══════════════════════════════════════════════════════════════════════════

interface Formation {
  name: string;
  personnel: string;
  positions: Record<string, { x: number; y: number }>;
  alignments: Record<string, { spot: string; detail: string }>;
}

interface QuizQuestion {
  type: 'alignment';
  formation: string;
  player: string;
  question: string;
  correct: string;
  options: string[];
}

const FORMATIONS: Formation[] = [
  {
    name: 'Ace Rt',
    personnel: 'POSSE',
    positions: { Q: { x: 50, y: 82 }, T: { x: 50, y: 72 }, Y: { x: 62, y: 65 }, X: { x: 12, y: 65 }, Z: { x: 88, y: 65 }, R: { x: 30, y: 65 } },
    alignments: {
      X: { spot: 'Split wide LEFT (boundary)', detail: 'Outside the numbers, alone on the weak side' },
      Y: { spot: 'Attached RIGHT', detail: 'On the line, tight to the right tackle' },
      Z: { spot: 'Split wide RIGHT (field)', detail: 'Outside the numbers on the strong side' },
      R: { spot: 'Slot LEFT', detail: 'Inside the numbers, between X and the ball' },
      T: { spot: 'Offset behind QB', detail: 'Standard depth, slightly offset for handoff timing' },
    },
  },
  {
    name: 'Ace Lt',
    personnel: 'POSSE',
    positions: { Q: { x: 50, y: 82 }, T: { x: 50, y: 72 }, Y: { x: 38, y: 65 }, X: { x: 88, y: 65 }, Z: { x: 12, y: 65 }, R: { x: 70, y: 65 } },
    alignments: {
      X: { spot: 'Split wide RIGHT', detail: 'Flipped from Ace Rt — X is now field side' },
      Y: { spot: 'Attached LEFT', detail: 'On the line, tight to the left tackle' },
      Z: { spot: 'Split wide LEFT', detail: 'Z moves to boundary side' },
      R: { spot: 'Slot RIGHT', detail: 'Between X and the ball on the field side' },
      T: { spot: 'Offset behind QB', detail: 'Same as Ace Rt' },
    },
  },
  {
    name: 'Brave Rt',
    personnel: 'POSSE',
    positions: { Q: { x: 50, y: 82 }, T: { x: 68, y: 65 }, Y: { x: 62, y: 65 }, X: { x: 12, y: 65 }, Z: { x: 88, y: 65 }, R: { x: 28, y: 65 } },
    alignments: {
      X: { spot: 'Split wide LEFT', detail: 'Standard X alignment, alone on boundary' },
      Y: { spot: 'Attached RIGHT', detail: 'On the line next to TB' },
      Z: { spot: 'Split wide RIGHT', detail: 'Outside numbers, field side' },
      R: { spot: 'Slot LEFT', detail: 'Inside numbers on boundary side' },
      T: { spot: 'WING at LOS (right)', detail: 'AT THE LINE next to Y — not in backfield!' },
    },
  },
  {
    name: 'Trips Rt',
    personnel: 'POSSE',
    positions: { Q: { x: 50, y: 82 }, T: { x: 50, y: 72 }, Y: { x: 62, y: 65 }, X: { x: 12, y: 65 }, Z: { x: 75, y: 65 }, R: { x: 88, y: 65 } },
    alignments: {
      X: { spot: 'ALONE on LEFT (iso)', detail: 'Isolated boundary receiver — expect single coverage' },
      Y: { spot: 'Attached RIGHT (trips)', detail: 'Innermost of the 3 receivers to the right' },
      Z: { spot: 'Slot RIGHT (trips)', detail: 'Middle receiver in the trips alignment' },
      R: { spot: 'Wide RIGHT (trips)', detail: 'Outermost receiver in trips' },
      T: { spot: 'Offset behind QB', detail: 'Standard — may swing weak to X side' },
    },
  },
  {
    name: 'Empty Rt',
    personnel: 'POSSE',
    positions: { Q: { x: 50, y: 78 }, T: { x: 25, y: 65 }, Y: { x: 62, y: 65 }, X: { x: 10, y: 65 }, Z: { x: 90, y: 65 }, R: { x: 78, y: 65 } },
    alignments: {
      X: { spot: 'Wide LEFT', detail: 'Boundary receiver' },
      Y: { spot: 'Attached RIGHT', detail: 'Inline tight end' },
      Z: { spot: 'Wide RIGHT', detail: 'Field receiver' },
      R: { spot: 'Slot RIGHT', detail: 'Inside Z on field side' },
      T: { spot: 'SPLIT OUT as slot LEFT', detail: "YOU'RE A RECEIVER — between X and the ball" },
    },
  },
];

// Generate quiz questions
const generateQuizQuestions = (): QuizQuestion[] => {
  const questions: QuizQuestion[] = [];

  const alignmentQuestions = [
    {
      formation: 'Brave Rt',
      player: 'T',
      q: 'In BRAVE RT, where does the TB line up?',
      correct: 'At the LINE OF SCRIMMAGE in wing position',
      wrong: ['Offset behind the QB', 'Split out wide as a receiver', 'Deep in I-formation'],
    },
    {
      formation: 'Empty Rt',
      player: 'T',
      q: 'In EMPTY RT, where do YOU (TB) line up?',
      correct: 'Split out as a SLOT receiver on the LEFT',
      wrong: ['Offset behind the QB', 'At the line in wing position', 'Deep behind the QB'],
    },
    {
      formation: 'Trips Rt',
      player: 'X',
      q: 'In TRIPS RT, where does X line up?',
      correct: 'ALONE on the LEFT (isolated boundary)',
      wrong: ['Part of the trips RIGHT', 'In the slot', 'In the backfield'],
    },
    {
      formation: 'Ace Rt',
      player: 'Y',
      q: 'In ACE RT, where does Y (TE) line up?',
      correct: 'Attached to the RIGHT side of the line',
      wrong: ['Attached LEFT', 'Split wide', 'In the slot'],
    },
    {
      formation: 'Ace Rt',
      player: 'Z',
      q: 'In ACE RT, where is Z?',
      correct: 'Split WIDE RIGHT (field side)',
      wrong: ['Split wide left', 'In the slot', 'Attached to the line'],
    },
    {
      formation: 'Ace Rt',
      player: 'R',
      q: 'In ACE RT, where does R line up?',
      correct: 'SLOT LEFT (inside the numbers)',
      wrong: ['Slot right', 'Wide right', 'Attached to the line'],
    },
    {
      formation: 'Trips Rt',
      player: 'R',
      q: 'In TRIPS RT, where is R?',
      correct: 'WIDE RIGHT — outermost in trips',
      wrong: ['Alone on the left', 'In the slot left', 'Attached inline'],
    },
    {
      formation: 'comparison',
      player: 'T',
      q: 'Which formation has the TB at the LINE OF SCRIMMAGE instead of in the backfield?',
      correct: 'Brave',
      wrong: ['Ace', 'Trips', 'Empty'],
    },
    {
      formation: 'comparison',
      player: 'T',
      q: 'Which formation splits YOU out as a receiver?',
      correct: 'Empty',
      wrong: ['Brave', 'Trips', 'Ace'],
    },
  ];

  alignmentQuestions.forEach(aq => {
    questions.push({
      type: 'alignment',
      formation: aq.formation,
      player: aq.player,
      question: aq.q,
      correct: aq.correct,
      options: [aq.correct, ...aq.wrong].sort(() => Math.random() - 0.5),
    });
  });

  return questions;
};

const shuffleArray = <T,>(arr: T[]): T[] => [...arr].sort(() => Math.random() - 0.5);

const getPlayerColor = (player: string): string => {
  const colors: Record<string, string> = {
    T: '#00d4aa',
    X: '#ef4444',
    Y: '#fbbf24',
    Z: '#8b5cf6',
    R: '#ec4899',
    H: '#fbbf24',
  };
  return colors[player] || '#7a8a88';
};

// ═══════════════════════════════════════════════════════════════════════════
// FIELD COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

interface FieldProps {
  formation: Formation;
  highlightPlayer?: string | null;
  showLabels?: boolean;
}

const Field: React.FC<FieldProps> = ({ formation, highlightPlayer = null, showLabels = true }) => (
  <svg className="w-full max-w-[500px] mx-auto block" viewBox="0 0 100 45" preserveAspectRatio="xMidYMid meet">
    <rect x="0" y="0" width="100" height="45" fill="#0d1a14" />
    <line x1="30" y1="0" x2="30" y2="45" stroke="#1a2f24" strokeWidth="0.3" strokeDasharray="2,2" />
    <line x1="70" y1="0" x2="70" y2="45" stroke="#1a2f24" strokeWidth="0.3" strokeDasharray="2,2" />
    <line x1="0" y1="30" x2="100" y2="30" stroke="#2a4035" strokeWidth="0.5" />
    <rect x="38" y="28" width="24" height="4" rx="1" fill="#1a2f24" stroke="#2a4035" strokeWidth="0.5" />
    <text x="50" y="31" textAnchor="middle" fill="#3a5045" fontSize="3" fontFamily="Inter">
      OL
    </text>

    {Object.entries(formation.positions)
      .filter(([p]) => p !== 'OL' && p !== 'Q')
      .map(([player, pos]) => {
        const color = getPlayerColor(player);
        const yPos = 45 - (pos.y - 60) * 0.6;
        const isHighlighted = highlightPlayer === player;

        return (
          <g key={player} className={isHighlighted ? 'animate-pulse' : ''}>
            <circle
              cx={pos.x}
              cy={yPos}
              r={player === 'T' ? 3.5 : 3}
              fill={color}
              fillOpacity={isHighlighted ? 0.5 : 0.3}
              stroke={color}
              strokeWidth={isHighlighted ? 2 : 1.5}
            />
            {showLabels && (
              <text
                x={pos.x}
                y={yPos + 1}
                textAnchor="middle"
                fontSize="3"
                fill={color}
                fontWeight="600"
                fontFamily="Inter"
              >
                {player}
              </text>
            )}
          </g>
        );
      })}
    {/* QB */}
    <circle
      cx={formation.positions.Q.x}
      cy={45 - (formation.positions.Q.y - 60) * 0.6}
      r="2.5"
      fill="#666"
      fillOpacity="0.3"
      stroke="#666"
      strokeWidth="1"
    />
    <text
      x={formation.positions.Q.x}
      y={45 - (formation.positions.Q.y - 60) * 0.6 + 1}
      textAnchor="middle"
      fontSize="2.5"
      fill="#666"
      fontWeight="600"
    >
      Q
    </text>
  </svg>
);

// ═══════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

export function AlignmentTrainerContent() {
  const [view, setView] = useState<'home' | 'learn' | 'quiz' | 'results'>('home');
  const [learnIndex, setLearnIndex] = useState(0);
  const [quizQuestions, setQuizQuestions] = useState<QuizQuestion[]>([]);
  const [quizIndex, setQuizIndex] = useState(0);
  const [answers, setAnswers] = useState<Array<{ question: QuizQuestion; answer: string; isCorrect: boolean }>>([]);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [stats, setStats] = useState({ attempts: 0, correct: 0 });

  useEffect(() => {
    try {
      const saved = localStorage.getItem('alignmentStats');
      if (saved) setStats(JSON.parse(saved));
    } catch (e) {
      console.error('Failed to load stats', e);
    }
  }, []);

  const saveStats = (newStats: { attempts: number; correct: number }) => {
    setStats(newStats);
    localStorage.setItem('alignmentStats', JSON.stringify(newStats));
  };

  const startLearn = () => {
    setLearnIndex(0);
    setView('learn');
  };

  const startQuiz = () => {
    const questions = generateQuizQuestions();
    setQuizQuestions(shuffleArray(questions).slice(0, 15));
    setQuizIndex(0);
    setAnswers([]);
    setSelectedAnswer(null);
    setShowFeedback(false);
    setView('quiz');
  };

  const handleAnswer = (answer: string) => {
    if (showFeedback) return;
    const q = quizQuestions[quizIndex];
    const isCorrect = answer === q.correct;

    setSelectedAnswer(answer);
    setShowFeedback(true);
    setAnswers([...answers, { question: q, answer, isCorrect }]);
    saveStats({ attempts: stats.attempts + 1, correct: stats.correct + (isCorrect ? 1 : 0) });

    setTimeout(() => {
      if (quizIndex + 1 < quizQuestions.length) {
        setQuizIndex(quizIndex + 1);
        setSelectedAnswer(null);
        setShowFeedback(false);
      } else {
        setView('results');
      }
    }, 2000);
  };

  const currentFormation = FORMATIONS[learnIndex];
  const currentQuestion = quizQuestions[quizIndex];

  // ═══════════════════════════════════════════════════════════════════════════
  // HOME VIEW
  // ═══════════════════════════════════════════════════════════════════════════

  if (view === 'home') {
    return (
      <div>
        {/* Header */}
        <div className="mb-8">
          <div className="inline-block bg-[#00d4aa]/10 text-[#00d4aa] px-3 py-1 rounded-md text-xs font-semibold uppercase tracking-wide mb-4">
            Module 1C
          </div>
          <h2 className="text-4xl font-bold text-white mb-2">
            Your <span className="text-[#00d4aa]">Alignment</span>
          </h2>
          <p className="text-gray-400">Know where YOU and every receiver lines up in each formation</p>
        </div>

        {/* Player Legend */}
        <div className="flex justify-center gap-4 flex-wrap mb-6 p-4 bg-gray-800/50 rounded-lg">
          <div className="flex items-center gap-2 text-sm">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: '#ef4444' }} />
            <span>X (boundary WR)</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: '#fbbf24' }} />
            <span>Y (TE)</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: '#8b5cf6' }} />
            <span>Z (field WR)</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: '#ec4899' }} />
            <span>R (slot)</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: '#00d4aa' }} />
            <span>T (you - TB)</span>
          </div>
        </div>

        {/* Mode Selection */}
        <div className="grid grid-cols-2 gap-4 mb-8">
          <div
            onClick={startLearn}
            className="bg-gray-800 hover:bg-gray-700 border border-gray-700 hover:border-[#00d4aa] rounded-xl p-8 cursor-pointer transition text-center"
          >
            <div className="text-4xl mb-4">📍</div>
            <div className="text-xl font-bold mb-2">Learn</div>
            <div className="text-sm text-gray-400">Study every player's spot in {FORMATIONS.length} formations</div>
          </div>
          <div
            onClick={startQuiz}
            className="bg-gray-800 hover:bg-gray-700 border border-gray-700 hover:border-[#00d4aa] rounded-xl p-8 cursor-pointer transition text-center"
          >
            <div className="text-4xl mb-4">🎯</div>
            <div className="text-xl font-bold mb-2">Test</div>
            <div className="text-sm text-gray-400">15 questions on X, Y, Z, R, and TB spots</div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
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
            <div className="text-3xl font-bold text-[#00d4aa]">5</div>
            <div className="text-xs text-gray-400 uppercase tracking-wide mt-1">Positions</div>
          </div>
        </div>
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // LEARN VIEW
  // ═══════════════════════════════════════════════════════════════════════════

  if (view === 'learn' && currentFormation) {
    const alignments = currentFormation.alignments;
    return (
      <div>
        <div className="text-sm text-gray-400 mb-6 cursor-pointer hover:text-[#00d4aa]" onClick={() => setView('home')}>
          ← Back to menu
        </div>

        <div className="bg-gray-800 rounded-xl p-6 mb-4">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2 text-xs font-semibold text-gray-400 uppercase tracking-wide">
              <div className="w-2 h-2 bg-[#00d4aa] rounded-full" />
              Alignment
            </div>
            <div className="bg-gray-900 text-[#00d4aa] px-3 py-1 rounded-md text-xs font-semibold">
              {learnIndex + 1} of {FORMATIONS.length}
            </div>
          </div>

          {/* Navigation Dots */}
          <div className="flex justify-center gap-2 mb-6">
            {FORMATIONS.map((_, i) => (
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
          <div className="text-4xl font-bold text-[#00d4aa] text-center mb-1">{currentFormation.name}</div>
          <div className="text-sm text-gray-400 text-center mb-6">{currentFormation.personnel}</div>

          {/* Field */}
          <div className="bg-[#0d1a14] border border-gray-700 rounded-lg p-5 mb-5">
            <Field formation={currentFormation} />
          </div>

          {/* Legend */}
          <div className="flex justify-center gap-4 flex-wrap mb-5 p-4 bg-gray-900 rounded-lg">
            <div className="flex items-center gap-2 text-xs">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: '#ef4444' }} />
              <span>X</span>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: '#fbbf24' }} />
              <span>Y</span>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: '#8b5cf6' }} />
              <span>Z</span>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: '#ec4899' }} />
              <span>R</span>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: '#00d4aa' }} />
              <span>T (you)</span>
            </div>
          </div>

          {/* Alignment Cards */}
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
          <div className="bg-gray-900 rounded-lg p-5">
            <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Your spot (TB)</div>
            <div className="text-sm text-gray-300">
              <strong>{alignments.T.spot}</strong> — {alignments.T.detail}
            </div>
          </div>

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
              onClick={() => setLearnIndex(Math.min(FORMATIONS.length - 1, learnIndex + 1))}
              disabled={learnIndex === FORMATIONS.length - 1}
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

  if (view === 'quiz' && currentQuestion) {
    const formationData =
      currentQuestion.formation !== 'comparison'
        ? FORMATIONS.find(f => f.name === currentQuestion.formation)
        : null;

    return (
      <div>
        <div className="text-sm text-gray-400 mb-6 cursor-pointer hover:text-[#00d4aa]" onClick={() => setView('home')}>
          ← Exit test
        </div>

        <div className="bg-gray-800 rounded-xl p-6">
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
              <span>
                {quizIndex + 1}/{quizQuestions.length}
              </span>
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
              <Field
                formation={formationData}
                highlightPlayer={currentQuestion.player !== 'comparison' ? currentQuestion.player : null}
              />
            </div>
          )}

          {/* Question */}
          <div className="text-xl font-semibold text-center mb-6 leading-snug">{currentQuestion.question}</div>

          {/* Options */}
          <div className="grid grid-cols-2 gap-3">
            {currentQuestion.options.map((opt, i) => {
              let className = 'bg-gray-900 border-2 border-gray-700 rounded-xl p-4 cursor-pointer transition text-center';
              if (showFeedback) {
                className += ' pointer-events-none';
                if (opt === currentQuestion.correct) className = 'bg-green-500/15 border-green-500 rounded-xl p-4 text-center';
                else if (opt === selectedAnswer)
                  className = 'bg-red-500/10 border-red-500 rounded-xl p-4 text-center';
              } else {
                className += ' hover:border-[#00d4aa] hover:bg-[#00d4aa]/5';
              }
              return (
                <div key={i} className={className} onClick={() => handleAnswer(opt)}>
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
    const pct = Math.round((correct / total) * 100);

    let message = '';
    if (pct >= 90) message = '🔥 You know where everyone lines up! Ready for Module 2: Run Game.';
    else if (pct >= 70) message = '💪 Good progress. Review the formations where you missed spots.';
    else message = '📚 Study the alignment cards again. Focus on what makes each spot unique.';

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
            <div className="text-lg text-gray-400 mt-2">
              {correct} of {total} correct
            </div>
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
