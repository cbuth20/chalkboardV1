"use client";

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';

// ═══════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════

interface Defender {
  id: string;
  x: number;
  y: number;
  label: string;
  rushing: boolean;
  blitz?: boolean;
  hot?: boolean;
  walked_up?: boolean;
  tb_read?: number;
}

interface ProtectionScenario {
  id: string;
  coverage_name: string;       // front name (e.g., "OVER", "UNDER")
  coverage_type: string;       // zone/man/blitz
  protection_type: string;     // "360", "64", "350", etc.
  call_side: string;           // "left" or "right"
  solid_call: boolean;
  free_release: boolean;
  play_action: boolean;
  naked: boolean;
  hoss: boolean;
  scat_release: string | null;
  defensive_positions: Record<string, Defender>;
  correct_block_target: string; // defender id or "RELEASE"
  explanation: string;
  coaching_notes?: string;
}

interface PlayResult {
  scenario: ProtectionScenario;
  userAnswer: string;
  correct: boolean;
  responseTime: number;
}

interface SessionStats {
  totalReps: number;
  totalCorrect: number;
  totalTime: number;
  byProtection: Record<string, { reps: number; correct: number; totalTime: number }>;
  byFront: Record<string, { reps: number; correct: number; totalTime: number }>;
  sessions: Array<{ date: string; reps: number; correct: number; avgTime: number }>;
}

type Difficulty = 'chill' | 'normal' | 'fast' | 'elite';
type Screen = 'menu' | 'playing' | 'feedback' | 'results' | 'stats';

const DIFFICULTY_CONFIG: Record<Difficulty, { label: string; time: number }> = {
  chill: { label: 'Chill', time: 5000 },
  normal: { label: 'Normal', time: 3500 },
  fast: { label: 'Fast', time: 2500 },
  elite: { label: 'Elite', time: 1800 },
};

const GRADE_TIERS = [
  { min: 100, grade: 'S', label: 'ELITE', color: '#fbbf24' },
  { min: 80, grade: 'A', label: 'PRO BOWL', color: '#00d4aa' },
  { min: 60, grade: 'B', label: 'STARTER', color: '#3b82f6' },
  { min: 40, grade: 'C', label: 'BACKUP', color: '#f97316' },
  { min: 0, grade: 'D', label: 'PRACTICE SQUAD', color: '#ef4444' },
];

// ═══════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

interface RBProtectionContentProps {
  demoMode?: boolean;
  demoScenarios?: ProtectionScenario[];
}

export function RBProtectionContent({ demoMode = false, demoScenarios }: RBProtectionContentProps = {}) {
  const { session, orgId, loading: authLoading } = useAuth();

  const [screen, setScreen] = useState<Screen>('menu');
  const [scenarios, setScenarios] = useState<ProtectionScenario[]>([]);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisStatus, setAnalysisStatus] = useState<'idle' | 'processing' | 'completed' | 'failed'>('idle');
  const [analysisId, setAnalysisId] = useState<string | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Menu state
  const [selectedProtection, setSelectedProtection] = useState<string | null>(null);
  const [difficulty, setDifficulty] = useState<Difficulty>('normal');

  // Playing state
  const [currentScenarios, setCurrentScenarios] = useState<ProtectionScenario[]>([]);
  const [playIndex, setPlayIndex] = useState(0);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [playStartTime, setPlayStartTime] = useState(0);
  const [results, setResults] = useState<PlayResult[]>([]);
  const [bestStreak, setBestStreak] = useState(0);
  const [currentStreak, setCurrentStreak] = useState(0);

  // Feedback state
  const [lastResult, setLastResult] = useState<PlayResult | null>(null);

  // Stats
  const [sessionStats, setSessionStats] = useState<SessionStats>({
    totalReps: 0, totalCorrect: 0, totalTime: 0,
    byProtection: {}, byFront: {}, sessions: [],
  });

  // Timer ref
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const animFrameRef = useRef<number | null>(null);

  // Load stats from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem('rbProtectionStats');
      if (saved) setSessionStats(JSON.parse(saved));
    } catch {
      // ignore
    }
  }, []);

  const saveSessionStats = (newStats: SessionStats) => {
    setSessionStats(newStats);
    localStorage.setItem('rbProtectionStats', JSON.stringify(newStats));
  };

  // Load scenarios on mount
  useEffect(() => {
    if (demoMode && demoScenarios) {
      setScenarios(demoScenarios);
      setLoading(false);
      return;
    }
    if (!authLoading && session && orgId) {
      const timer = setTimeout(() => loadScenarios(), 300);
      return () => clearTimeout(timer);
    } else if (!authLoading && !session) {
      setLoading(false);
    }
  }, [authLoading, session, orgId, demoMode, demoScenarios]);

  const loadScenarios = async () => {
    if (!session?.access_token || !orgId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`/api/player-block-coverages?orgId=${orgId}`, {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        const scenarioData = (data.scenarios || []).map((s: any) => ({
          id: s.id,
          coverage_name: s.coverage_name || 'Unknown',
          coverage_type: s.coverage_type || 'all',
          protection_type: s.protection_type || 'unknown',
          call_side: s.call_side || 'right',
          solid_call: s.solid_call || false,
          free_release: s.free_release || false,
          play_action: s.play_action || false,
          naked: s.naked || false,
          hoss: s.hoss || false,
          scat_release: s.scat_release || null,
          defensive_positions: s.defensive_positions || {},
          correct_block_target: s.correct_block_target || 'RELEASE',
          explanation: s.explanation || s.coaching_notes || '',
          coaching_notes: s.blocking_rules || '',
        }));
        setScenarios(scenarioData);
      }
    } catch (error) {
      console.error('Error loading scenarios:', error);
    } finally {
      setLoading(false);
    }
  };

  const startAnalysis = async () => {
    if (!confirm('This will analyze your playbook PDFs using AI to extract protection scenarios. This may take several minutes. Continue?')) return;
    if (!session?.access_token || !orgId) return;

    setAnalyzing(true);
    setAnalysisStatus('processing');
    try {
      const response = await fetch(`/api/player-protections-analyze?orgId=${orgId}`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || 'Analysis failed');
      }

      const data = await response.json();
      setAnalysisId(data.analysisId);

      // Start polling for completion
      startPolling();
    } catch (error) {
      setAnalysisStatus('failed');
      setAnalyzing(false);
      alert(`Failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const startPolling = () => {
    if (pollRef.current) clearInterval(pollRef.current);

    pollRef.current = setInterval(async () => {
      try {
        // Re-fetch scenarios to see if new ones appeared
        const response = await fetch(`/api/player-block-coverages?orgId=${orgId}`, {
          headers: { Authorization: `Bearer ${session!.access_token}` },
        });

        if (response.ok) {
          const data = await response.json();
          const newScenarios = data.scenarios || [];

          if (newScenarios.length > scenarios.length) {
            // New scenarios arrived — analysis completed
            const scenarioData = newScenarios.map((s: any) => ({
              id: s.id,
              coverage_name: s.coverage_name || 'Unknown',
              coverage_type: s.coverage_type || 'all',
              protection_type: s.protection_type || 'unknown',
              call_side: s.call_side || 'right',
              solid_call: s.solid_call || false,
              free_release: s.free_release || false,
              play_action: s.play_action || false,
              naked: s.naked || false,
              hoss: s.hoss || false,
              scat_release: s.scat_release || null,
              defensive_positions: s.defensive_positions || {},
              correct_block_target: s.correct_block_target || 'RELEASE',
              explanation: s.explanation || s.coaching_notes || '',
              coaching_notes: s.blocking_rules || '',
            }));
            setScenarios(scenarioData);
            setAnalysisStatus('completed');
            setAnalyzing(false);
            if (pollRef.current) clearInterval(pollRef.current);
          }
        }
      } catch {
        // Silently continue polling
      }
    }, 8000); // Poll every 8 seconds

    // Stop polling after 10 minutes
    setTimeout(() => {
      if (pollRef.current) {
        clearInterval(pollRef.current);
        if (analysisStatus === 'processing') {
          setAnalysisStatus('failed');
          setAnalyzing(false);
        }
      }
    }, 10 * 60 * 1000);
  };

  // Cleanup polling on unmount
  useEffect(() => {
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, []);

  // Group scenarios by protection type
  const groupedScenarios = scenarios.reduce((acc, s) => {
    const type = s.protection_type || 'unknown';
    if (!acc[type]) acc[type] = [];
    acc[type].push(s);
    return acc;
  }, {} as Record<string, ProtectionScenario[]>);

  // Categorize protection types
  const categorizeProtection = (type: string): string => {
    const freeRelease = ['350', '351', '50', '51', 'scat', 'scoot', 'hoss'];
    const playAction = ['433', '432', '201', '200'];
    const tbAssignment = ['360', '361', '64', '65'];
    const lower = type.toLowerCase();
    if (freeRelease.some(f => lower.includes(f))) return 'TB Free Release';
    if (playAction.some(f => lower.includes(f))) return 'Play Action';
    if (tbAssignment.some(f => lower.includes(f))) return 'TB Has Assignment';
    return 'Other';
  };

  const protectionsByCategory = Object.keys(groupedScenarios).reduce((acc, type) => {
    const cat = categorizeProtection(type);
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(type);
    return acc;
  }, {} as Record<string, string[]>);

  // ═══════════════════════════════════════════════════════════════════════════
  // GAME LOGIC
  // ═══════════════════════════════════════════════════════════════════════════

  const startTraining = () => {
    let pool: ProtectionScenario[];
    if (selectedProtection === 'mix' || selectedProtection === null) {
      pool = [...scenarios];
    } else {
      pool = scenarios.filter(s => s.protection_type === selectedProtection);
    }

    if (pool.length === 0) {
      alert('No scenarios available for this protection type.');
      return;
    }

    // Shuffle and take 5
    const shuffled = shuffleArray(pool).slice(0, 5);
    setCurrentScenarios(shuffled);
    setPlayIndex(0);
    setResults([]);
    setBestStreak(0);
    setCurrentStreak(0);
    startPlay(shuffled[0]);
    setScreen('playing');
  };

  const startPlay = (scenario: ProtectionScenario) => {
    const totalTime = DIFFICULTY_CONFIG[difficulty].time;
    setTimeRemaining(totalTime);
    setPlayStartTime(Date.now());

    // Clear any existing timer
    if (timerRef.current) clearInterval(timerRef.current);

    // Start countdown
    const startMs = Date.now();
    timerRef.current = setInterval(() => {
      const elapsed = Date.now() - startMs;
      const remaining = Math.max(0, totalTime - elapsed);
      setTimeRemaining(remaining);

      if (remaining <= 0) {
        if (timerRef.current) clearInterval(timerRef.current);
        handleAnswer('TIMEOUT', scenario);
      }
    }, 50);
  };

  const handleAnswer = useCallback((answer: string, scenario?: ProtectionScenario) => {
    if (timerRef.current) clearInterval(timerRef.current);

    const current = scenario || currentScenarios[playIndex];
    if (!current) return;

    const responseTime = Date.now() - playStartTime;
    const isCorrect = answer.toUpperCase() === current.correct_block_target.toUpperCase();

    const result: PlayResult = {
      scenario: current,
      userAnswer: answer,
      correct: isCorrect,
      responseTime,
    };

    setLastResult(result);
    setResults(prev => [...prev, result]);

    if (isCorrect) {
      setCurrentStreak(prev => {
        const newStreak = prev + 1;
        setBestStreak(best => Math.max(best, newStreak));
        return newStreak;
      });
    } else {
      setCurrentStreak(0);
    }

    // Update cumulative stats
    const newStats = { ...sessionStats };
    newStats.totalReps++;
    if (isCorrect) newStats.totalCorrect++;
    newStats.totalTime += responseTime;

    const pType = current.protection_type || 'unknown';
    if (!newStats.byProtection[pType]) newStats.byProtection[pType] = { reps: 0, correct: 0, totalTime: 0 };
    newStats.byProtection[pType].reps++;
    if (isCorrect) newStats.byProtection[pType].correct++;
    newStats.byProtection[pType].totalTime += responseTime;

    const front = current.coverage_name || 'unknown';
    if (!newStats.byFront[front]) newStats.byFront[front] = { reps: 0, correct: 0, totalTime: 0 };
    newStats.byFront[front].reps++;
    if (isCorrect) newStats.byFront[front].correct++;
    newStats.byFront[front].totalTime += responseTime;

    saveSessionStats(newStats);

    setScreen('feedback');
  }, [currentScenarios, playIndex, playStartTime, sessionStats]);

  const nextPlay = () => {
    const nextIdx = playIndex + 1;
    if (nextIdx >= currentScenarios.length) {
      // Save session to history
      const correctCount = results.length > 0
        ? results.filter(r => r.correct).length + (lastResult?.correct ? 1 : 0)
        : (lastResult?.correct ? 1 : 0);
      const totalTimeMs = results.reduce((s, r) => s + r.responseTime, 0) + (lastResult?.responseTime || 0);
      const total = results.length + (lastResult ? 1 : 0);

      const newStats = { ...sessionStats };
      newStats.sessions.push({
        date: new Date().toISOString(),
        reps: total,
        correct: correctCount,
        avgTime: total > 0 ? Math.round(totalTimeMs / total) : 0,
      });
      // Keep last 20 sessions
      if (newStats.sessions.length > 20) newStats.sessions = newStats.sessions.slice(-20);
      saveSessionStats(newStats);

      setScreen('results');
    } else {
      setPlayIndex(nextIdx);
      startPlay(currentScenarios[nextIdx]);
      setScreen('playing');
    }
  };

  // Cleanup timers on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, []);

  // ═══════════════════════════════════════════════════════════════════════════
  // LOADING / AUTH
  // ═══════════════════════════════════════════════════════════════════════════

  if (!demoMode && (authLoading || loading)) {
    return (
      <div className="flex items-center justify-center py-32">
        <div className="text-center">
          <div className="h-12 w-12 mx-auto mb-4 animate-spin rounded-full border-4 border-[#00d4aa]/20 border-t-[#00d4aa]" />
          <p className="text-gray-400">Loading protection trainer...</p>
        </div>
      </div>
    );
  }

  if (!demoMode && !session) {
    return (
      <div className="flex items-center justify-center py-32">
        <div className="text-center">
          <div className="text-4xl mb-4">🔒</div>
          <p className="text-gray-400">Please log in to access the protection trainer</p>
        </div>
      </div>
    );
  }

  if (demoMode && loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <div className="text-center">
          <div className="h-12 w-12 mx-auto mb-4 animate-spin rounded-full border-4 border-[#00d4aa]/20 border-t-[#00d4aa]" />
          <p className="text-gray-400">Loading protection trainer...</p>
        </div>
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // MENU SCREEN
  // ═══════════════════════════════════════════════════════════════════════════

  if (screen === 'menu') {
    return (
      <div>
        {/* Header */}
        <div className="text-center mb-8">
          <div className="text-5xl mb-3">⚡</div>
          <h2 className="text-4xl font-bold text-white mb-2">PROTECTION IQ</h2>
          <p className="text-gray-400 italic mb-4">The snap starts the play. Preparation finishes it.</p>
          <p className="text-sm text-gray-500">
            Tap the defender you need to block — or release if it's not your job.
          </p>
        </div>

        {/* Analysis Status Banner */}
        {analysisStatus === 'processing' && (
          <div className="bg-[#00d4aa]/5 border border-[#00d4aa]/30 rounded-xl p-6 mb-8">
            <div className="flex items-center gap-4">
              <div className="h-10 w-10 flex-shrink-0 animate-spin rounded-full border-4 border-[#00d4aa]/20 border-t-[#00d4aa]" />
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-[#00d4aa] mb-1">Analyzing Playbooks...</h3>
                <p className="text-sm text-gray-400">
                  Extracting protection schemes, defensive fronts, and RB assignments from your PDFs.
                  This typically takes 2-5 minutes.
                </p>
                <div className="mt-3 h-1.5 bg-gray-800 rounded-full overflow-hidden">
                  <div className="h-full bg-[#00d4aa]/60 rounded-full animate-pulse" style={{ width: '60%' }} />
                </div>
              </div>
            </div>
          </div>
        )}

        {analysisStatus === 'completed' && scenarios.length > 0 && (
          <div className="bg-green-500/5 border border-green-500/30 rounded-xl p-5 mb-8 flex items-center gap-4">
            <div className="text-3xl">✓</div>
            <div>
              <h3 className="text-lg font-semibold text-green-400">Analysis Complete</h3>
              <p className="text-sm text-gray-400">{scenarios.length} protection scenarios ready to train.</p>
            </div>
          </div>
        )}

        {analysisStatus === 'failed' && (
          <div className="bg-red-500/5 border border-red-500/30 rounded-xl p-5 mb-8 flex items-center gap-4">
            <div className="text-3xl">✗</div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-red-400">Analysis Failed</h3>
              <p className="text-sm text-gray-400">Something went wrong. Please try again.</p>
            </div>
            <button
              onClick={startAnalysis}
              className="px-4 py-2 bg-red-500/20 hover:bg-red-500/30 border border-red-500/50 text-red-300 rounded-lg text-sm font-semibold transition"
            >
              Retry
            </button>
          </div>
        )}

        {scenarios.length === 0 && analysisStatus !== 'processing' ? (
          /* Empty State */
          <div className="bg-yellow-900/20 border border-yellow-700/50 rounded-lg p-6 mb-8">
            <h3 className="text-lg font-semibold text-yellow-400 mb-2">No Protection Scenarios</h3>
            <p className="text-gray-300 mb-4">
              Upload your playbook PDFs in <strong>My Notes</strong>, then analyze them to generate protection scenarios.
            </p>
            <button
              onClick={startAnalysis}
              disabled={analyzing}
              className="px-6 py-3 bg-[#00d4aa] hover:bg-[#00bfa0] disabled:bg-gray-600 disabled:cursor-not-allowed text-black font-bold rounded-lg transition"
            >
              {analyzing ? 'Starting Analysis...' : 'Analyze Playbooks'}
            </button>
          </div>
        ) : (
          <>
            {/* Protection Selection */}
            {Object.entries(protectionsByCategory).map(([category, types]) => (
              <div key={category} className="mb-6">
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">{category}</h3>
                <div className="flex flex-wrap gap-2">
                  {types.map(type => (
                    <button
                      key={type}
                      onClick={() => setSelectedProtection(selectedProtection === type ? null : type)}
                      className={`px-4 py-2 rounded-lg text-sm font-semibold transition ${
                        selectedProtection === type
                          ? 'bg-[#00d4aa] text-black'
                          : 'bg-gray-800 text-gray-300 border border-gray-700 hover:border-[#00d4aa]'
                      }`}
                    >
                      {type} <span className="text-xs opacity-70">({groupedScenarios[type].length})</span>
                    </button>
                  ))}
                </div>
              </div>
            ))}

            {/* Mix All Button */}
            <button
              onClick={() => setSelectedProtection(selectedProtection === 'mix' ? null : 'mix')}
              className={`w-full py-3 rounded-lg font-bold text-sm transition mb-8 ${
                selectedProtection === 'mix'
                  ? 'bg-[#00d4aa] text-black'
                  : 'bg-gray-800 text-gray-300 border border-gray-700 hover:border-[#00d4aa]'
              }`}
            >
              Mix All Protections ({scenarios.length} scenarios)
            </button>

            {/* Difficulty Selector */}
            <div className="mb-8">
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Difficulty</h3>
              <div className="grid grid-cols-4 gap-2">
                {(Object.keys(DIFFICULTY_CONFIG) as Difficulty[]).map(d => (
                  <button
                    key={d}
                    onClick={() => setDifficulty(d)}
                    className={`py-3 rounded-lg text-sm font-semibold transition ${
                      difficulty === d
                        ? 'bg-[#00d4aa] text-black'
                        : 'bg-gray-800 text-gray-300 border border-gray-700 hover:border-[#00d4aa]'
                    }`}
                  >
                    {DIFFICULTY_CONFIG[d].label}
                    <div className="text-xs opacity-70">{DIFFICULTY_CONFIG[d].time / 1000}s</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Start Button */}
            <button
              onClick={startTraining}
              className="w-full py-4 bg-[#00d4aa] hover:bg-[#00bfa0] text-black font-bold text-lg rounded-lg transition mb-4"
            >
              START TRAINING →
            </button>

            {/* View Stats */}
            <button
              onClick={() => setScreen('stats')}
              className="w-full py-3 bg-transparent border border-gray-700 hover:border-[#00d4aa] text-gray-300 hover:text-[#00d4aa] font-semibold rounded-lg transition"
            >
              View Stats ({sessionStats.totalReps} total reps)
            </button>

            {/* Re-analyze */}
            {!demoMode && (
              <div className="mt-6 text-center">
                <button
                  onClick={startAnalysis}
                  disabled={analyzing}
                  className="text-sm text-gray-500 hover:text-[#00d4aa] transition"
                >
                  {analyzing ? 'Analyzing...' : 'Re-analyze Playbooks'}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // PLAYING SCREEN
  // ═══════════════════════════════════════════════════════════════════════════

  if (screen === 'playing') {
    const scenario = currentScenarios[playIndex];
    if (!scenario) return null;

    const totalTime = DIFFICULTY_CONFIG[difficulty].time;
    const pct = (timeRemaining / totalTime) * 100;
    const timerColor = pct > 60 ? '#00d4aa' : pct > 30 ? '#fbbf24' : '#ef4444';

    const defenders = Object.entries(scenario.defensive_positions).map(([id, def]) => {
      // Support both old format (just coordinates) and new format (full defender object)
      const defender = typeof def === 'object' && def !== null ? def as Defender : { id, x: 50, y: 30, label: id, rushing: false };
      return { ...defender, id: defender.id || id };
    });

    // Build flag badges
    const flags: string[] = [];
    if (scenario.solid_call) flags.push('SOLID');
    if (scenario.free_release) flags.push('FREE RELEASE');
    if (scenario.play_action) flags.push('PLAY ACTION');
    if (scenario.naked) flags.push('NAKED');
    if (scenario.hoss) flags.push('HOSS');

    return (
      <div>
        {/* Info Bar */}
        <div className="bg-gray-800 rounded-lg p-4 mb-4">
          <div className="flex items-center justify-between mb-2">
            <div>
              <span className="text-[#00d4aa] font-bold">{scenario.protection_type}</span>
              <span className="text-gray-400 mx-2">vs</span>
              <span className="text-white font-semibold">{scenario.coverage_name}</span>
            </div>
            <div className="text-sm text-gray-400">
              TB {scenario.call_side?.toUpperCase() || ''}
            </div>
          </div>
          {flags.length > 0 && (
            <div className="flex gap-2 flex-wrap">
              {flags.map(flag => (
                <span key={flag} className="text-xs bg-[#00d4aa]/10 text-[#00d4aa] px-2 py-0.5 rounded font-semibold">
                  {flag}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Timer */}
        <div className="mb-4">
          <div className="flex justify-between text-xs text-gray-400 mb-1">
            <span>Play {playIndex + 1} of {currentScenarios.length}</span>
            <span style={{ color: timerColor }}>{(timeRemaining / 1000).toFixed(1)}s</span>
          </div>
          <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-100"
              style={{ width: `${pct}%`, backgroundColor: timerColor }}
            />
          </div>
        </div>

        {/* Football Field */}
        <div
          className="relative bg-[#1a3a25] rounded-lg overflow-hidden mb-4"
          style={{ height: 340 }}
        >
          {/* Yard lines */}
          {[20, 40, 60, 80].map(pctLine => (
            <div
              key={pctLine}
              className="absolute w-full border-t border-[#2a5035]/50"
              style={{ top: `${pctLine}%` }}
            />
          ))}

          {/* OL */}
          {['LT', 'LG', 'C', 'RG', 'RT'].map((label, i) => (
            <div
              key={label}
              className="absolute w-8 h-8 rounded-full bg-[#1a2744] border-2 border-[#2a3f66] flex items-center justify-center text-xs font-bold text-gray-400"
              style={{
                left: `${30 + i * 10}%`,
                top: '65%',
                transform: 'translate(-50%, -50%)',
              }}
            >
              {label.replace('L', '').replace('R', '')}
            </div>
          ))}

          {/* QB */}
          <div
            className="absolute w-8 h-8 rounded-full bg-[#1a2744] border-2 border-[#3a5f88] flex items-center justify-center text-xs font-bold text-gray-300"
            style={{ left: '50%', top: '73%', transform: 'translate(-50%, -50%)' }}
          >
            QB
          </div>

          {/* TB */}
          <div
            className="absolute flex flex-col items-center"
            style={{
              left: scenario.call_side === 'left' ? '38%' : '62%',
              top: '80%',
              transform: 'translate(-50%, -50%)',
            }}
          >
            <div className="w-9 h-9 rounded-full bg-[#00d4aa]/20 border-2 border-[#00d4aa] flex items-center justify-center text-xs font-bold text-[#00d4aa]">
              TB
            </div>
          </div>

          {/* Release button below TB */}
          <button
            onClick={() => handleAnswer('RELEASE')}
            className="absolute px-3 py-1 bg-[#00d4aa]/20 border border-[#00d4aa]/50 rounded text-xs font-semibold text-[#00d4aa] hover:bg-[#00d4aa]/30 transition"
            style={{
              left: scenario.call_side === 'left' ? '38%' : '62%',
              top: '90%',
              transform: 'translate(-50%, -50%)',
            }}
          >
            Release
          </button>

          {/* Defenders */}
          {defenders.map(def => {
            const isBlitz = def.blitz;
            const isWalkedUp = def.walked_up;
            const isHot = def.hot;

            return (
              <button
                key={def.id}
                onClick={() => handleAnswer(def.id)}
                className={`absolute w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold transition-transform hover:scale-110 ${
                  def.rushing
                    ? 'bg-red-900/80 border-2 border-red-500 text-red-200'
                    : 'bg-red-950/60 border-2 border-red-800/50 text-red-300/70'
                } ${isBlitz ? 'shadow-[0_0_12px_rgba(234,179,8,0.4)] border-yellow-400' : ''} ${
                  isWalkedUp ? 'border-[#00d4aa]' : ''
                }`}
                style={{
                  left: `${def.x}%`,
                  top: `${def.y}%`,
                  transform: 'translate(-50%, -50%)',
                }}
              >
                <span>{def.label}</span>
                {def.tb_read && (
                  <span className="absolute -top-3 -right-1 text-[10px] bg-gray-900 text-[#00d4aa] rounded-full w-4 h-4 flex items-center justify-center border border-[#00d4aa]/50">
                    {def.tb_read}
                  </span>
                )}
                {isHot && (
                  <span className="absolute -top-3 -left-1 text-[10px]">🔥</span>
                )}
                {isWalkedUp && (
                  <span className="absolute -bottom-4 text-[8px] text-[#00d4aa] font-semibold tracking-wide">WALKED</span>
                )}
              </button>
            );
          })}
        </div>

        {/* Legend */}
        <div className="flex justify-center gap-6 text-xs text-gray-400">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full border-2 border-yellow-400 bg-red-900/50" />
            <span>Blitzing</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full border-2 border-[#00d4aa] bg-red-950/50" />
            <span>Walked Up</span>
          </div>
          <div className="flex items-center gap-2">
            <span>🔥</span>
            <span>Hot (unblocked)</span>
          </div>
        </div>
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // FEEDBACK SCREEN
  // ═══════════════════════════════════════════════════════════════════════════

  if (screen === 'feedback' && lastResult) {
    const isCorrect = lastResult.correct;
    const isTimeout = lastResult.userAnswer === 'TIMEOUT';

    return (
      <div>
        {/* Banner */}
        <div
          className={`rounded-xl p-6 mb-6 text-center ${
            isCorrect ? 'bg-green-500/10 border-2 border-green-500' : 'bg-red-500/10 border-2 border-red-500'
          }`}
        >
          <div className="text-3xl font-bold mb-2" style={{ color: isCorrect ? '#22c55e' : '#ef4444' }}>
            {isCorrect ? '✓ CORRECT' : isTimeout ? '⏰ TIME\'S UP' : '✗ INCORRECT'}
          </div>
          {!isCorrect && (
            <div className="flex justify-center gap-8 mt-4">
              <div>
                <div className="text-xs text-gray-500 uppercase mb-1">Your Pick</div>
                <div className="text-lg font-bold text-red-400">
                  {isTimeout ? 'No answer' : lastResult.userAnswer}
                </div>
              </div>
              <div>
                <div className="text-xs text-gray-500 uppercase mb-1">Correct</div>
                <div className="text-lg font-bold text-green-400">{lastResult.scenario.correct_block_target}</div>
              </div>
            </div>
          )}
        </div>

        {/* Explanation */}
        {lastResult.scenario.explanation && (
          <div className="bg-gray-800 rounded-lg p-5 mb-6">
            <div className="text-xs text-gray-500 uppercase tracking-wide mb-2">Why?</div>
            <p className="text-gray-300">{lastResult.scenario.explanation}</p>
          </div>
        )}

        {/* Time */}
        <div className="text-center text-sm text-gray-400 mb-6">
          Response time: {(lastResult.responseTime / 1000).toFixed(1)}s
        </div>

        {/* Next Button */}
        <button
          onClick={nextPlay}
          className="w-full py-4 bg-[#00d4aa] hover:bg-[#00bfa0] text-black font-bold text-lg rounded-lg transition"
        >
          {playIndex + 1 >= currentScenarios.length ? 'See Results' : 'Next Play →'}
        </button>
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // RESULTS SCREEN
  // ═══════════════════════════════════════════════════════════════════════════

  if (screen === 'results') {
    const allResults = [...results, ...(lastResult && !results.find(r => r === lastResult) ? [lastResult] : [])];
    const correctCount = allResults.filter(r => r.correct).length;
    const total = allResults.length;
    const pct = total > 0 ? Math.round((correctCount / total) * 100) : 0;
    const avgTime = total > 0 ? Math.round(allResults.reduce((s, r) => s + r.responseTime, 0) / total) : 0;

    const tier = GRADE_TIERS.find(t => pct >= t.min) || GRADE_TIERS[GRADE_TIERS.length - 1];

    return (
      <div>
        {/* Grade Badge */}
        <div className="text-center mb-8">
          <div
            className="inline-flex items-center justify-center w-24 h-24 rounded-full border-4 text-5xl font-black mb-3"
            style={{ borderColor: tier.color, color: tier.color }}
          >
            {tier.grade}
          </div>
          <div className="text-lg font-bold" style={{ color: tier.color }}>{tier.label}</div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          <div className="bg-gray-800 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-[#00d4aa]">{correctCount}/{total}</div>
            <div className="text-xs text-gray-400 uppercase mt-1">Correct</div>
          </div>
          <div className="bg-gray-800 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-[#00d4aa]">{(avgTime / 1000).toFixed(1)}s</div>
            <div className="text-xs text-gray-400 uppercase mt-1">Avg Time</div>
          </div>
          <div className="bg-gray-800 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-[#00d4aa]">{bestStreak}</div>
            <div className="text-xs text-gray-400 uppercase mt-1">Best Streak</div>
          </div>
        </div>

        {/* Play-by-play */}
        <div className="bg-gray-800 rounded-lg p-4 mb-6">
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Play-by-Play</h3>
          {allResults.map((r, i) => (
            <div key={i} className="flex items-center justify-between py-2 border-b border-gray-700 last:border-0">
              <div className="flex items-center gap-3">
                <span className={`text-lg ${r.correct ? 'text-green-400' : 'text-red-400'}`}>
                  {r.correct ? '✓' : '✗'}
                </span>
                <span className="text-sm text-gray-300">
                  {r.scenario.protection_type} vs {r.scenario.coverage_name}
                </span>
              </div>
              <span className="text-sm text-gray-400">{(r.responseTime / 1000).toFixed(1)}s</span>
            </div>
          ))}
        </div>

        {/* Actions */}
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={startTraining}
            className="py-3 bg-[#00d4aa] hover:bg-[#00bfa0] text-black font-bold rounded-lg transition"
          >
            Run Again
          </button>
          <button
            onClick={() => setScreen('menu')}
            className="py-3 bg-transparent border border-gray-700 hover:border-[#00d4aa] text-gray-300 hover:text-[#00d4aa] font-semibold rounded-lg transition"
          >
            Menu
          </button>
        </div>
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // STATS SCREEN
  // ═══════════════════════════════════════════════════════════════════════════

  if (screen === 'stats') {
    const avgTime = sessionStats.totalReps > 0
      ? Math.round(sessionStats.totalTime / sessionStats.totalReps)
      : 0;
    const accuracy = sessionStats.totalReps > 0
      ? Math.round((sessionStats.totalCorrect / sessionStats.totalReps) * 100)
      : 0;

    return (
      <div>
        <div
          className="text-sm text-gray-400 mb-6 cursor-pointer hover:text-[#00d4aa] transition"
          onClick={() => setScreen('menu')}
        >
          ← Back to menu
        </div>

        <h2 className="text-2xl font-bold text-white mb-6">Your Stats</h2>

        {/* Overview */}
        <div className="grid grid-cols-3 gap-3 mb-8">
          <div className="bg-gray-800 rounded-lg p-5 text-center">
            <div className="text-3xl font-bold text-[#00d4aa]">{sessionStats.totalReps}</div>
            <div className="text-xs text-gray-400 uppercase mt-1">Total Reps</div>
          </div>
          <div className="bg-gray-800 rounded-lg p-5 text-center">
            <div className="text-3xl font-bold text-[#00d4aa]">{accuracy}%</div>
            <div className="text-xs text-gray-400 uppercase mt-1">Accuracy</div>
          </div>
          <div className="bg-gray-800 rounded-lg p-5 text-center">
            <div className="text-3xl font-bold text-[#00d4aa]">{(avgTime / 1000).toFixed(1)}s</div>
            <div className="text-xs text-gray-400 uppercase mt-1">Avg Time</div>
          </div>
        </div>

        {/* By Protection */}
        {Object.keys(sessionStats.byProtection).length > 0 && (
          <div className="mb-8">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">By Protection</h3>
            <div className="bg-gray-800 rounded-lg overflow-hidden">
              {Object.entries(sessionStats.byProtection).map(([type, data]) => (
                <div key={type} className="flex items-center justify-between px-4 py-3 border-b border-gray-700 last:border-0">
                  <span className="text-sm font-semibold text-white">{type}</span>
                  <div className="flex items-center gap-4 text-sm text-gray-400">
                    <span>{data.reps} reps</span>
                    <span>{data.reps > 0 ? Math.round((data.correct / data.reps) * 100) : 0}%</span>
                    <span>{data.reps > 0 ? (data.totalTime / data.reps / 1000).toFixed(1) : '0.0'}s</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* By Front */}
        {Object.keys(sessionStats.byFront).length > 0 && (
          <div className="mb-8">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">By Front</h3>
            <div className="bg-gray-800 rounded-lg overflow-hidden">
              {Object.entries(sessionStats.byFront).map(([front, data]) => (
                <div key={front} className="flex items-center justify-between px-4 py-3 border-b border-gray-700 last:border-0">
                  <span className="text-sm font-semibold text-white">{front}</span>
                  <div className="flex items-center gap-4 text-sm text-gray-400">
                    <span>{data.reps} reps</span>
                    <span>{data.reps > 0 ? Math.round((data.correct / data.reps) * 100) : 0}%</span>
                    <span>{data.reps > 0 ? (data.totalTime / data.reps / 1000).toFixed(1) : '0.0'}s</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Recent Sessions */}
        {sessionStats.sessions.length > 0 && (
          <div className="mb-8">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Recent Sessions</h3>
            <div className="bg-gray-800 rounded-lg overflow-hidden">
              {[...sessionStats.sessions].reverse().slice(0, 10).map((s, i) => (
                <div key={i} className="flex items-center justify-between px-4 py-3 border-b border-gray-700 last:border-0">
                  <span className="text-sm text-gray-400">{new Date(s.date).toLocaleDateString()}</span>
                  <div className="flex items-center gap-4 text-sm text-gray-400">
                    <span>{s.correct}/{s.reps}</span>
                    <span>{s.reps > 0 ? Math.round((s.correct / s.reps) * 100) : 0}%</span>
                    <span>{(s.avgTime / 1000).toFixed(1)}s avg</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Reset */}
        <button
          onClick={() => {
            if (confirm('Reset all protection training stats? This cannot be undone.')) {
              const empty: SessionStats = {
                totalReps: 0, totalCorrect: 0, totalTime: 0,
                byProtection: {}, byFront: {}, sessions: [],
              };
              saveSessionStats(empty);
            }
          }}
          className="w-full py-3 bg-transparent border border-red-800/50 text-red-400 hover:bg-red-900/20 rounded-lg font-semibold transition"
        >
          Reset Stats
        </button>
      </div>
    );
  }

  return null;
}

// ═══════════════════════════════════════════════════════════════════════════
// UTILS
// ═══════════════════════════════════════════════════════════════════════════

function shuffleArray<T>(arr: T[]): T[] {
  const shuffled = [...arr];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}
