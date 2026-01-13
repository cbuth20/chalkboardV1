// ═══════════════════════════════════════════════════════════════════════════════════════════
// CHALKBOARD — ANALYTICS CALCULATIONS
// 
// Core formulas and algorithms for computing Football IQ and analytics metrics.
// All formulas documented in plain English with thresholds explained.
// ═══════════════════════════════════════════════════════════════════════════════════════════

import type { GameType, DifficultyLevel } from '@/lib/types/database';
import type {
  FootballIQIndex,
  CategoryIQ,
  PlayerRankingSummary,
  MostImprovedPlayer,
  PlayerAtRisk,
  RiskReason,
  TeamKPIs,
  InstallReadiness,
} from './types';

import { GAME_TYPE_TO_IQ_CATEGORY } from './types';

// ───────────────────────────────────────────────────────────────────────────────────────────
// FOOTBALL IQ CALCULATION
// ───────────────────────────────────────────────────────────────────────────────────────────

/**
 * FOOTBALL IQ FORMULA
 * 
 * The Football IQ Index (0-100) measures a player's cognitive understanding of the game.
 * 
 * COMPONENTS:
 * 1. Accuracy Factor (35%): Raw percentage of correct answers
 * 2. Speed Factor (20%): Average response time weighted by correctness
 * 3. Difficulty Factor (25%): Weighted score based on difficulty of questions attempted
 * 4. Consistency Factor (10%): Low variance in performance across sessions
 * 5. Engagement Factor (10%): Regular practice demonstrates commitment to improvement
 * 
 * FORMULA:
 * IQ = (accuracy × 0.35 + speed × 0.20 + difficulty × 0.25 + consistency × 0.10 + engagement × 0.10) × 100
 * 
 * All factors are normalized to 0-1 scale before multiplication.
 */

interface PlayerGameStats {
  totalQuestions: number;
  correctAnswers: number;
  totalResponseTimeMs: number;
  sessionCount: number;
  accuracyVariance: number;      // Variance in accuracy across sessions
  daysActive: number;            // Days with at least one game
  totalDaysInPeriod: number;     // Total days in measurement period
  difficultyBreakdown: {
    easy: { questions: number; correct: number };
    medium: { questions: number; correct: number };
    hard: { questions: number; correct: number };
    expert: { questions: number; correct: number };
  };
  gameTypeBreakdown: Map<GameType, {
    questions: number;
    correct: number;
    avgResponseTimeMs: number;
  }>;
}

/**
 * Calculate the overall Football IQ Index from player stats
 */
export function calculateFootballIQIndex(stats: PlayerGameStats): FootballIQIndex {
  // Calculate each component factor (0-1 scale)
  const accuracyFactor = calculateAccuracyFactor(stats);
  const speedFactor = calculateSpeedFactor(stats);
  const difficultyFactor = calculateDifficultyFactor(stats);
  const consistencyFactor = calculateConsistencyFactor(stats);
  const engagementFactor = calculateEngagementFactor(stats);
  
  // Weighted combination
  const overallRaw = 
    accuracyFactor * 0.35 +
    speedFactor * 0.20 +
    difficultyFactor * 0.25 +
    consistencyFactor * 0.10 +
    engagementFactor * 0.10;
  
  // Scale to 0-100
  const overall = Math.round(overallRaw * 100);
  
  // Calculate category-specific IQs
  const categoryIQs = calculateCategoryIQs(stats);
  
  // Determine confidence level based on sample size
  const confidence = determineConfidence(stats);
  
  return {
    overall: clamp(overall, 0, 100),
    coverageIQ: categoryIQs.coverageIQ,
    blitzIQ: categoryIQs.blitzIQ,
    situationalIQ: categoryIQs.situationalIQ,
    formationIQ: categoryIQs.formationIQ,
    routeConceptIQ: categoryIQs.routeConceptIQ,
    assignmentIQ: categoryIQs.assignmentIQ,
    confidence,
    gamesPlayed: stats.sessionCount,
    lastUpdated: new Date().toISOString(),
  };
}

/**
 * Accuracy Factor (0-1)
 * Simple ratio of correct to total questions
 * 
 * 100% accuracy = 1.0
 * 50% accuracy = 0.5
 * 0% accuracy = 0.0
 */
function calculateAccuracyFactor(stats: PlayerGameStats): number {
  if (stats.totalQuestions === 0) return 0.5; // Default to mid-range for new players
  return stats.correctAnswers / stats.totalQuestions;
}

/**
 * Speed Factor (0-1)
 * Based on average response time for correct answers
 * 
 * THRESHOLDS:
 * - < 2 seconds: 1.0 (elite reaction time)
 * - 2-5 seconds: 0.7-1.0 (good)
 * - 5-10 seconds: 0.4-0.7 (average)
 * - > 10 seconds: 0.2-0.4 (slow)
 * - > 20 seconds: 0.0-0.2 (very slow)
 */
function calculateSpeedFactor(stats: PlayerGameStats): number {
  if (stats.correctAnswers === 0) return 0.5;
  
  const avgResponseMs = stats.totalResponseTimeMs / stats.totalQuestions;
  
  // Convert to seconds
  const avgSeconds = avgResponseMs / 1000;
  
  // Piecewise linear scoring
  if (avgSeconds <= 2) return 1.0;
  if (avgSeconds <= 5) return 1.0 - ((avgSeconds - 2) / 3) * 0.3;  // 1.0 to 0.7
  if (avgSeconds <= 10) return 0.7 - ((avgSeconds - 5) / 5) * 0.3; // 0.7 to 0.4
  if (avgSeconds <= 20) return 0.4 - ((avgSeconds - 10) / 10) * 0.2; // 0.4 to 0.2
  return Math.max(0, 0.2 - ((avgSeconds - 20) / 30) * 0.2); // 0.2 to 0
}

/**
 * Difficulty Factor (0-1)
 * Rewards players who tackle harder questions
 * 
 * WEIGHTS:
 * - Easy: 1x
 * - Medium: 1.5x
 * - Hard: 2x
 * - Expert: 2.5x
 * 
 * Score = weighted accuracy across difficulties
 */
function calculateDifficultyFactor(stats: PlayerGameStats): number {
  const weights: Record<DifficultyLevel, number> = {
    easy: 1.0,
    medium: 1.5,
    hard: 2.0,
    expert: 2.5,
  };
  
  let weightedCorrect = 0;
  let weightedTotal = 0;
  
  for (const [difficulty, data] of Object.entries(stats.difficultyBreakdown)) {
    const weight = weights[difficulty as DifficultyLevel];
    weightedCorrect += data.correct * weight;
    weightedTotal += data.questions * weight;
  }
  
  if (weightedTotal === 0) return 0.5;
  
  // Base score on weighted accuracy
  const baseScore = weightedCorrect / weightedTotal;
  
  // Bonus for attempting harder difficulties (up to 20% bonus)
  const hardQuestions = stats.difficultyBreakdown.hard.questions + stats.difficultyBreakdown.expert.questions;
  const totalQuestions = stats.totalQuestions;
  const difficultyBonus = totalQuestions > 0 
    ? Math.min(0.2, (hardQuestions / totalQuestions) * 0.4)
    : 0;
  
  return Math.min(1.0, baseScore + difficultyBonus);
}

/**
 * Consistency Factor (0-1)
 * Rewards consistent performance across sessions
 * 
 * Low variance in accuracy = higher score
 * 
 * CALCULATION:
 * Uses coefficient of variation (CV = stddev / mean)
 * CV < 0.1: Excellent (1.0)
 * CV 0.1-0.2: Good (0.8)
 * CV 0.2-0.3: Average (0.6)
 * CV > 0.3: Inconsistent (0.4)
 */
function calculateConsistencyFactor(stats: PlayerGameStats): number {
  if (stats.sessionCount < 3) return 0.5; // Need minimum sessions
  
  // Using variance provided (assume it's the CV or similar)
  const cv = Math.sqrt(stats.accuracyVariance);
  
  if (cv < 0.1) return 1.0;
  if (cv < 0.2) return 0.8 + (0.2 - cv) * 2; // 0.8 to 1.0
  if (cv < 0.3) return 0.6 + (0.3 - cv) * 2; // 0.6 to 0.8
  return Math.max(0.4, 0.6 - (cv - 0.3) * 2);
}

/**
 * Engagement Factor (0-1)
 * Rewards regular practice
 * 
 * CALCULATION:
 * Based on percentage of days active in the period
 * 
 * 7+ days in 14: 1.0
 * 5-6 days: 0.7-0.85
 * 3-4 days: 0.5-0.7
 * 1-2 days: 0.3-0.5
 * 0 days: 0.0
 */
function calculateEngagementFactor(stats: PlayerGameStats): number {
  if (stats.totalDaysInPeriod === 0) return 0;
  
  const activeRatio = stats.daysActive / stats.totalDaysInPeriod;
  
  // For a 14-day period:
  if (activeRatio >= 0.5) return 0.85 + (activeRatio - 0.5) * 0.3; // 0.85-1.0
  if (activeRatio >= 0.35) return 0.7 + (activeRatio - 0.35) * 1.0; // 0.7-0.85
  if (activeRatio >= 0.2) return 0.5 + (activeRatio - 0.2) * 1.33; // 0.5-0.7
  if (activeRatio >= 0.07) return 0.3 + (activeRatio - 0.07) * 1.54; // 0.3-0.5
  return activeRatio * 4.29; // 0-0.3
}

/**
 * Calculate category-specific IQ scores
 */
function calculateCategoryIQs(stats: PlayerGameStats): {
  coverageIQ: number;
  blitzIQ: number;
  situationalIQ: number;
  formationIQ: number;
  routeConceptIQ: number;
  assignmentIQ: number;
} {
  const gameTypeToCategory: Record<GameType, string> = {
    coverage_recognition: 'coverageIQ',
    blitz_id: 'blitzIQ',
    route_matching: 'routeConceptIQ',
    formation_memory: 'formationIQ',
    play_responsibility: 'assignmentIQ',
    red_zone_scenarios: 'situationalIQ',
    two_minute_drill: 'situationalIQ',
    film_reaction: 'coverageIQ',
  };
  
  const categoryScores: Record<string, { total: number; correct: number; speedSum: number; count: number }> = {
    coverageIQ: { total: 0, correct: 0, speedSum: 0, count: 0 },
    blitzIQ: { total: 0, correct: 0, speedSum: 0, count: 0 },
    situationalIQ: { total: 0, correct: 0, speedSum: 0, count: 0 },
    formationIQ: { total: 0, correct: 0, speedSum: 0, count: 0 },
    routeConceptIQ: { total: 0, correct: 0, speedSum: 0, count: 0 },
    assignmentIQ: { total: 0, correct: 0, speedSum: 0, count: 0 },
  };
  
  for (const [gameType, data] of stats.gameTypeBreakdown) {
    const category = gameTypeToCategory[gameType];
    if (category && categoryScores[category]) {
      categoryScores[category].total += data.questions;
      categoryScores[category].correct += data.correct;
      categoryScores[category].speedSum += data.avgResponseTimeMs * data.questions;
      categoryScores[category].count++;
    }
  }
  
  // Convert to 0-100 scores
  const result: Record<string, number> = {};
  
  for (const [category, data] of Object.entries(categoryScores)) {
    if (data.total === 0) {
      result[category] = 50; // Default for no data
    } else {
      const accuracy = data.correct / data.total;
      const avgSpeed = data.speedSum / data.total;
      const speedScore = calculateSpeedFactor({ 
        ...stats, 
        correctAnswers: data.correct, 
        totalResponseTimeMs: avgSpeed * data.total,
        totalQuestions: data.total 
      });
      
      // Combine accuracy (70%) and speed (30%)
      result[category] = Math.round((accuracy * 0.7 + speedScore * 0.3) * 100);
    }
  }
  
  return result as {
    coverageIQ: number;
    blitzIQ: number;
    situationalIQ: number;
    formationIQ: number;
    routeConceptIQ: number;
    assignmentIQ: number;
  };
}

/**
 * Determine confidence level based on sample size
 */
function determineConfidence(stats: PlayerGameStats): 'low' | 'medium' | 'high' {
  if (stats.totalQuestions >= 100 && stats.sessionCount >= 10) return 'high';
  if (stats.totalQuestions >= 30 && stats.sessionCount >= 5) return 'medium';
  return 'low';
}

// ───────────────────────────────────────────────────────────────────────────────────────────
// KPI CALCULATIONS
// ───────────────────────────────────────────────────────────────────────────────────────────

/**
 * Calculate week-over-week KPI deltas
 */
export function calculateKPIDeltas(
  thisWeek: TeamKPIs['thisWeek'],
  lastWeek: TeamKPIs['lastWeek']
): TeamKPIs['deltas'] {
  const safePercent = (current: number, previous: number): number => {
    if (previous === 0) return current > 0 ? 100 : 0;
    return Math.round(((current - previous) / previous) * 100 * 10) / 10;
  };
  
  return {
    sessions: thisWeek.totalSessions - lastWeek.totalSessions,
    sessionsPercent: safePercent(thisWeek.totalSessions, lastWeek.totalSessions),
    xp: thisWeek.totalXPEarned - lastWeek.totalXPEarned,
    xpPercent: safePercent(thisWeek.totalXPEarned, lastWeek.totalXPEarned),
    accuracy: Math.round((thisWeek.averageAccuracy - lastWeek.averageAccuracy) * 10) / 10,
    accuracyPercent: safePercent(thisWeek.averageAccuracy, lastWeek.averageAccuracy),
    activePlayers: thisWeek.activePlayers - lastWeek.activePlayers,
    activePlayersPercent: safePercent(thisWeek.activePlayers, lastWeek.activePlayers),
    footballIQ: Math.round((thisWeek.averageFootballIQ - lastWeek.averageFootballIQ) * 10) / 10,
    footballIQPercent: safePercent(thisWeek.averageFootballIQ, lastWeek.averageFootballIQ),
  };
}

// ───────────────────────────────────────────────────────────────────────────────────────────
// RISK DETECTION
// ───────────────────────────────────────────────────────────────────────────────────────────

/**
 * Risk thresholds
 */
const RISK_THRESHOLDS = {
  DAYS_INACTIVE_WARNING: 3,
  DAYS_INACTIVE_ALERT: 7,
  ACCURACY_DROP_WARNING: 10,
  ACCURACY_DROP_ALERT: 20,
  MIN_WEEKLY_GAMES: 3,
  LOW_ACCURACY_THRESHOLD: 60,
};

/**
 * Identify risk factors for a player
 */
export function identifyPlayerRisks(player: {
  daysInactive: number;
  currentAccuracy: number;
  previousAccuracy: number | null;
  gamesThisWeek: number;
  gamesLastWeek: number;
  currentStreak: number;
}): { riskLevel: 'low' | 'medium' | 'high'; reasons: RiskReason[] } {
  const reasons: RiskReason[] = [];
  
  // Inactivity check
  if (player.daysInactive >= RISK_THRESHOLDS.DAYS_INACTIVE_ALERT) {
    reasons.push({
      type: 'inactivity',
      severity: 'alert',
      message: `No activity in ${player.daysInactive} days`,
    });
  } else if (player.daysInactive >= RISK_THRESHOLDS.DAYS_INACTIVE_WARNING) {
    reasons.push({
      type: 'inactivity',
      severity: 'warning',
      message: `Inactive for ${player.daysInactive} days`,
    });
  }
  
  // Low reps check
  if (player.gamesThisWeek < RISK_THRESHOLDS.MIN_WEEKLY_GAMES) {
    const severity = player.gamesThisWeek === 0 ? 'alert' : 'warning';
    reasons.push({
      type: 'low_reps',
      severity,
      message: `Only ${player.gamesThisWeek} games this week (target: ${RISK_THRESHOLDS.MIN_WEEKLY_GAMES}+)`,
    });
  }
  
  // Declining accuracy check
  if (player.previousAccuracy !== null) {
    const accuracyDrop = player.previousAccuracy - player.currentAccuracy;
    if (accuracyDrop >= RISK_THRESHOLDS.ACCURACY_DROP_ALERT) {
      reasons.push({
        type: 'declining_accuracy',
        severity: 'alert',
        message: `Accuracy dropped ${accuracyDrop.toFixed(1)}% from last week`,
      });
    } else if (accuracyDrop >= RISK_THRESHOLDS.ACCURACY_DROP_WARNING) {
      reasons.push({
        type: 'declining_accuracy',
        severity: 'warning',
        message: `Accuracy down ${accuracyDrop.toFixed(1)}% from last week`,
      });
    }
  }
  
  // Low accuracy check
  if (player.currentAccuracy < RISK_THRESHOLDS.LOW_ACCURACY_THRESHOLD && player.gamesThisWeek >= 3) {
    reasons.push({
      type: 'low_accuracy',
      severity: 'warning',
      message: `Current accuracy ${player.currentAccuracy.toFixed(1)}% is below target (${RISK_THRESHOLDS.LOW_ACCURACY_THRESHOLD}%)`,
    });
  }
  
  // No streak
  if (player.currentStreak === 0 && player.gamesThisWeek > 0) {
    reasons.push({
      type: 'no_streak',
      severity: 'warning',
      message: 'No active streak – needs consistent daily practice',
    });
  }
  
  // Determine overall risk level
  const alertCount = reasons.filter(r => r.severity === 'alert').length;
  const warningCount = reasons.filter(r => r.severity === 'warning').length;
  
  let riskLevel: 'low' | 'medium' | 'high' = 'low';
  if (alertCount >= 2 || (alertCount >= 1 && warningCount >= 2)) {
    riskLevel = 'high';
  } else if (alertCount >= 1 || warningCount >= 2) {
    riskLevel = 'medium';
  }
  
  return { riskLevel, reasons };
}

/**
 * Generate suggested action for at-risk player
 */
export function generateRiskAction(player: PlayerAtRisk): string {
  const priorities: string[] = [];
  
  for (const reason of player.riskReasons) {
    switch (reason.type) {
      case 'inactivity':
        priorities.push('check in with player');
        break;
      case 'low_reps':
        priorities.push('encourage more daily reps');
        break;
      case 'declining_accuracy':
        priorities.push('review fundamental concepts');
        break;
      case 'low_accuracy':
        priorities.push('focus on easier difficulty first');
        break;
      case 'no_streak':
        priorities.push('establish daily practice routine');
        break;
    }
  }
  
  if (priorities.length === 0) return 'Continue monitoring';
  
  return priorities[0].charAt(0).toUpperCase() + priorities[0].slice(1);
}

// ───────────────────────────────────────────────────────────────────────────────────────────
// READINESS CALCULATIONS
// ───────────────────────────────────────────────────────────────────────────────────────────

/**
 * Readiness thresholds
 */
const READINESS_THRESHOLDS = {
  MASTERED: { accuracy: 95, reps: 20 },
  PROFICIENT: { accuracy: 85, reps: 10 },
  LEARNING: { accuracy: 70, reps: 5 },
  NOT_STARTED: { accuracy: 0, reps: 0 },
};

/**
 * Calculate readiness level for a concept
 */
export function calculateReadinessLevel(
  accuracy: number,
  totalReps: number
): InstallReadiness['readinessLevel'] {
  if (totalReps === 0) return 'not_started';
  
  const { MASTERED, PROFICIENT, LEARNING } = READINESS_THRESHOLDS;
  
  if (accuracy >= MASTERED.accuracy && totalReps >= MASTERED.reps) {
    return 'mastered';
  }
  if (accuracy >= PROFICIENT.accuracy && totalReps >= PROFICIENT.reps) {
    return 'proficient';
  }
  if (accuracy >= LEARNING.accuracy && totalReps >= LEARNING.reps) {
    return 'learning';
  }
  return 'learning'; // Has reps but hasn't reached proficiency
}

/**
 * Calculate readiness score (0-100)
 */
export function calculateReadinessScore(
  accuracy: number,
  totalReps: number,
  level: InstallReadiness['readinessLevel']
): number {
  switch (level) {
    case 'mastered':
      return 100;
    case 'proficient':
      // 75-99 based on accuracy and reps toward mastery
      const proficientProgress = Math.min(
        ((accuracy - 85) / 10) * 0.5 + 
        ((totalReps - 10) / 10) * 0.5,
        1
      );
      return Math.round(75 + proficientProgress * 24);
    case 'learning':
      // 25-74 based on progress toward proficiency
      const learningProgress = Math.min(
        ((accuracy - 50) / 35) * 0.5 + 
        ((totalReps - 0) / 10) * 0.5,
        1
      );
      return Math.round(25 + learningProgress * 49);
    case 'not_started':
    default:
      return 0;
  }
}

// ───────────────────────────────────────────────────────────────────────────────────────────
// TREND DETECTION
// ───────────────────────────────────────────────────────────────────────────────────────────

/**
 * Determine trend direction from data points
 */
export function detectTrend(
  dataPoints: number[],
  minChange: number = 5
): 'improving' | 'stable' | 'declining' {
  if (dataPoints.length < 2) return 'stable';
  
  // Calculate simple linear regression slope
  const n = dataPoints.length;
  const xMean = (n - 1) / 2;
  const yMean = dataPoints.reduce((a, b) => a + b, 0) / n;
  
  let numerator = 0;
  let denominator = 0;
  
  for (let i = 0; i < n; i++) {
    numerator += (i - xMean) * (dataPoints[i] - yMean);
    denominator += (i - xMean) ** 2;
  }
  
  const slope = denominator !== 0 ? numerator / denominator : 0;
  
  // Calculate total change over period
  const totalChange = slope * (n - 1);
  
  if (totalChange > minChange) return 'improving';
  if (totalChange < -minChange) return 'declining';
  return 'stable';
}

// ───────────────────────────────────────────────────────────────────────────────────────────
// UTILITY FUNCTIONS
// ───────────────────────────────────────────────────────────────────────────────────────────

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

/**
 * Format IQ score for display
 */
export function formatIQScore(score: number): string {
  if (score >= 90) return 'Elite';
  if (score >= 75) return 'Advanced';
  if (score >= 60) return 'Proficient';
  if (score >= 45) return 'Developing';
  return 'Beginner';
}

/**
 * Get color class for IQ score
 */
export function getIQColorClass(score: number): string {
  if (score >= 90) return 'text-[#F5C253]'; // Gold - Elite
  if (score >= 75) return 'text-[#00F6E5]'; // Teal - Advanced
  if (score >= 60) return 'text-[#3DF3FF]'; // Ice - Proficient
  if (score >= 45) return 'text-slate-300'; // Gray - Developing
  return 'text-[#FF6A3D]'; // Orange - Needs work
}

/**
 * Calculate percentile rank
 */
export function calculatePercentile(value: number, allValues: number[]): number {
  if (allValues.length === 0) return 50;
  
  const sorted = [...allValues].sort((a, b) => a - b);
  const below = sorted.filter(v => v < value).length;
  
  return Math.round((below / sorted.length) * 100);
}








