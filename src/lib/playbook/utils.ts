// ═══════════════════════════════════════════════════════════════════════════════════════════
// CHALKBOARD — PLAYBOOK UTILITIES
// 
// Core utility functions for the Playbook system
// ═══════════════════════════════════════════════════════════════════════════════════════════

import type {
  PlaybookPlay,
  PlayerPlayProgress,
  Install,
  PlayStatus,
  MasteryLevel,
  CategoryScores,
  StudyPath,
  StudyStep,
  WeaknessAnalysis,
  PlaybookFlashcard,
  FlashcardCategory,
  SkillPosition,
  MASTERY_THRESHOLDS,
  MASTERY_WEIGHTS,
  SPACED_REPETITION_INTERVALS,
} from "./types";

// ───────────────────────────────────────────────────────────────────────────────────────────
// DATE UTILITIES
// ───────────────────────────────────────────────────────────────────────────────────────────

/**
 * Get current date as ISO string
 */
export function now(): string {
  return new Date().toISOString();
}

/**
 * Check if a date is today
 */
export function isToday(dateString: string | null | undefined): boolean {
  if (!dateString) return false;
  const date = new Date(dateString);
  const today = new Date();
  return (
    date.getFullYear() === today.getFullYear() &&
    date.getMonth() === today.getMonth() &&
    date.getDate() === today.getDate()
  );
}

/**
 * Check if a date is in the past
 */
export function isPast(dateString: string | null | undefined): boolean {
  if (!dateString) return false;
  const date = new Date(dateString);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return date < today;
}

/**
 * Calculate days between two dates
 */
export function daysBetween(date1: string, date2: string): number {
  const d1 = new Date(date1);
  const d2 = new Date(date2);
  const diffTime = Math.abs(d2.getTime() - d1.getTime());
  return Math.floor(diffTime / (1000 * 60 * 60 * 24));
}

/**
 * Add days to a date
 */
export function addDays(dateString: string, days: number): string {
  const date = new Date(dateString);
  date.setDate(date.getDate() + days);
  return date.toISOString();
}

/**
 * Get week progress (0-1)
 */
export function getWeekProgress(install: Install): number {
  const start = new Date(install.startDate);
  const end = new Date(install.endDate);
  const today = new Date();
  
  if (today < start) return 0;
  if (today > end) return 1;
  
  const totalDays = daysBetween(install.startDate, install.endDate);
  const elapsedDays = daysBetween(install.startDate, now());
  
  return Math.min(1, elapsedDays / totalDays);
}

// ───────────────────────────────────────────────────────────────────────────────────────────
// MASTERY CALCULATIONS
// ───────────────────────────────────────────────────────────────────────────────────────────

/**
 * Calculate mastery score from progress data
 * 
 * Formula:
 * mastery = quizAccuracy × 0.40 + repCompletion × 0.25 + categoryBalance × 0.20 + recency × 0.15
 */
export function calculateMasteryScore(progress: PlayerPlayProgress): number {
  // Quiz accuracy component (0-100)
  const quizScore = progress.quizAttempts > 0 ? progress.quizAccuracy : 50;
  
  // Rep completion component (0-100)
  const repScore = Math.min(100, (progress.repsCompleted / progress.repsTarget) * 100);
  
  // Category balance (0-100): all categories should be above threshold
  const categoryScores = Object.values(progress.categoryScores);
  const minCategory = Math.min(...categoryScores);
  const avgCategory = categoryScores.reduce((a, b) => a + b, 0) / categoryScores.length;
  const categoryBalance = minCategory * 0.4 + avgCategory * 0.6;
  
  // Recency (0-100): decay over time since last study
  const daysSinceStudy = progress.lastStudied 
    ? daysBetween(progress.lastStudied, now())
    : 30;
  const recencyScore = Math.max(0, 100 - daysSinceStudy * 5);
  
  return Math.round(
    quizScore * 0.40 +
    repScore * 0.25 +
    categoryBalance * 0.20 +
    recencyScore * 0.15
  );
}

/**
 * Determine mastery level from score
 */
export function getMasteryLevel(score: number): MasteryLevel {
  if (score <= 20) return "new";
  if (score <= 50) return "learning";
  if (score <= 80) return "proficient";
  return "mastered";
}

/**
 * Calculate rep progress percentage
 */
export function calculateRepProgress(progress: PlayerPlayProgress): number {
  const mentalWeight = 0.7;
  const physicalWeight = 0.3;
  
  const mentalProgress = Math.min(progress.repsCompleted / progress.repsTarget, 1);
  const physicalProgress = Math.min(
    progress.physicalReps / Math.max(progress.repsTarget * 0.5, 3),
    1
  );
  
  return (mentalProgress * mentalWeight + physicalProgress * physicalWeight) * 100;
}

// ───────────────────────────────────────────────────────────────────────────────────────────
// PLAY STATUS DETERMINATION
// ───────────────────────────────────────────────────────────────────────────────────────────

/**
 * Determine the dynamic status of a play
 */
export function determinePlayStatus(
  play: PlaybookPlay,
  progress: PlayerPlayProgress | undefined,
  install: Install
): PlayStatus {
  // NEW: Recently added or never studied
  if (!progress || progress.masteryLevel === "new" || progress.repsCompleted === 0) {
    const daysSinceInstall = daysBetween(play.installDate, now());
    if (daysSinceInstall <= 7) return "NEW";
  }
  
  // DUE_TODAY: Spaced repetition says review now
  if (progress && (isToday(progress.nextDueDate) || isPast(progress.nextDueDate))) {
    return "DUE_TODAY";
  }
  
  // EMPHASIS: Coach flagged as priority
  if (progress?.isEmphasis || install.emphasisPlayIds.includes(play.id)) {
    return "EMPHASIS";
  }
  
  // NEEDS_REPS: Behind on rep target
  if (progress) {
    const repProgress = progress.repsCompleted / progress.repsTarget;
    const weekProgress = getWeekProgress(install);
    if (repProgress < weekProgress - 0.2) {
      return "NEEDS_REPS";
    }
  }
  
  // COMPLETED: Fully mastered for this install
  if (progress && progress.masteryLevel === "mastered") {
    const repProgress = progress.repsCompleted / progress.repsTarget;
    if (repProgress >= 1) {
      return "COMPLETED";
    }
  }
  
  return "NORMAL";
}

/**
 * Calculate priority score for sorting plays
 */
export function calculatePriorityScore(
  play: PlaybookPlay,
  progress: PlayerPlayProgress | undefined,
  install: Install
): number {
  let score = 0;
  
  // Status weights
  if (!progress || progress.masteryLevel === "new") score += 50;
  if (progress?.isEmphasis || install.emphasisPlayIds.includes(play.id)) score += 40;
  if (progress && (isToday(progress.nextDueDate) || isPast(progress.nextDueDate))) score += 35;
  if (progress && progress.repsCompleted < progress.repsTarget * 0.5) score += 25;
  
  // Recency penalty (recently studied = lower priority)
  if (progress?.lastStudied) {
    const daysAgo = daysBetween(progress.lastStudied, now());
    if (daysAgo < 1) score -= 20;
    else if (daysAgo < 3) score -= 10;
  }
  
  // Low mastery boost
  if (progress && progress.masteryScore < 50) score += 30;
  
  return score;
}

/**
 * Sort plays by priority
 */
export function sortPlaysByPriority(
  plays: PlaybookPlay[],
  progressMap: Map<string, PlayerPlayProgress>,
  install: Install
): PlaybookPlay[] {
  return [...plays].sort((a, b) => {
    const progA = progressMap.get(a.id);
    const progB = progressMap.get(b.id);
    
    const scoreA = calculatePriorityScore(a, progA, install);
    const scoreB = calculatePriorityScore(b, progB, install);
    
    return scoreB - scoreA; // Descending
  });
}

// ───────────────────────────────────────────────────────────────────────────────────────────
// SPACED REPETITION
// ───────────────────────────────────────────────────────────────────────────────────────────

/**
 * Calculate next due date using SM-2 spaced repetition algorithm
 */
export function calculateNextDueDate(
  progress: PlayerPlayProgress,
  wasCorrect: boolean
): { nextDueDate: string; easeFactor: number; interval: number } {
  let { easeFactor, interval } = progress;
  
  if (wasCorrect) {
    if (interval === 0) {
      interval = 1;
    } else if (interval === 1) {
      interval = 3;
    } else {
      interval = Math.round(interval * easeFactor);
    }
    easeFactor = Math.max(1.3, easeFactor + 0.1);
  } else {
    interval = 1;
    easeFactor = Math.max(1.3, easeFactor - 0.2);
  }
  
  return {
    nextDueDate: addDays(now(), interval),
    easeFactor,
    interval,
  };
}

// ───────────────────────────────────────────────────────────────────────────────────────────
// WEAKNESS DETECTION
// ───────────────────────────────────────────────────────────────────────────────────────────

/**
 * Identify weakest categories and plays
 */
export function identifyWeaknesses(
  progressList: PlayerPlayProgress[],
  plays: PlaybookPlay[]
): WeaknessAnalysis {
  // Group by category
  const categoryPerformance: Record<string, number[]> = {
    alignment: [],
    landmark: [],
    assignment: [],
    read: [],
    adjustment: [],
  };
  
  for (const progress of progressList) {
    for (const [category, score] of Object.entries(progress.categoryScores)) {
      if (categoryPerformance[category]) {
        categoryPerformance[category].push(score);
      }
    }
  }
  
  // Find weakest categories
  const weakCategories = Object.entries(categoryPerformance)
    .map(([category, scores]) => ({
      category,
      avgScore: scores.length > 0 
        ? scores.reduce((a, b) => a + b, 0) / scores.length 
        : 50,
      reason: `Average score: ${Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)}%`,
    }))
    .filter((c) => c.avgScore < 70)
    .sort((a, b) => a.avgScore - b.avgScore);
  
  // Find weakest plays
  const playMap = new Map(plays.map((p) => [p.id, p]));
  const weakPlays = progressList
    .filter((p) => p.masteryScore < 60)
    .sort((a, b) => a.masteryScore - b.masteryScore)
    .slice(0, 5)
    .map((progress) => ({
      playId: progress.playId,
      playName: playMap.get(progress.playId)?.name || "Unknown Play",
      masteryScore: progress.masteryScore,
      reason: `Mastery at ${progress.masteryScore}%`,
    }));
  
  // Generate recommendation
  let recommendation = "";
  if (weakCategories.length > 0) {
    recommendation = `Focus on ${weakCategories[0].category} questions - your average is ${Math.round(weakCategories[0].avgScore)}%.`;
  } else if (weakPlays.length > 0) {
    recommendation = `Study ${weakPlays[0].playName} - mastery is at ${weakPlays[0].masteryScore}%.`;
  } else {
    recommendation = "Great job! Keep practicing to maintain your mastery.";
  }
  
  return {
    weakestCategories: weakCategories.slice(0, 3),
    weakestPlays: weakPlays,
    recommendation,
  };
}

// ───────────────────────────────────────────────────────────────────────────────────────────
// STUDY PATH GENERATION
// ───────────────────────────────────────────────────────────────────────────────────────────

/**
 * Generate personalized study path
 */
export function generateStudyPath(
  progressList: PlayerPlayProgress[],
  plays: PlaybookPlay[],
  install: Install
): StudyPath {
  const steps: StudyStep[] = [];
  const playMap = new Map(plays.map((p) => [p.id, p]));
  const progressMap = new Map(progressList.map((p) => [p.playId, p]));
  
  // Priority 1: Emphasis plays not yet at 80% mastery
  const emphasisNeeded = progressList.filter(
    (p) => install.emphasisPlayIds.includes(p.playId) && p.masteryScore < 80
  );
  
  for (const progress of emphasisNeeded.slice(0, 2)) {
    const play = playMap.get(progress.playId);
    if (play) {
      steps.push({
        type: "study",
        playId: progress.playId,
        reason: "Coach emphasized this play",
        suggestedDuration: 10,
      });
    }
  }
  
  // Priority 2: Due today based on spaced repetition
  const dueToday = progressList.filter(
    (p) => isToday(p.nextDueDate) || isPast(p.nextDueDate)
  );
  
  for (const progress of dueToday.slice(0, 3)) {
    if (!steps.find((s) => s.playId === progress.playId)) {
      steps.push({
        type: "review",
        playId: progress.playId,
        reason: "Scheduled review",
        suggestedDuration: 5,
      });
    }
  }
  
  // Priority 3: New plays this week
  const newPlays = progressList.filter((p) => p.masteryLevel === "new");
  
  for (const progress of newPlays.slice(0, 2)) {
    if (!steps.find((s) => s.playId === progress.playId)) {
      steps.push({
        type: "learn",
        playId: progress.playId,
        reason: "New this week",
        suggestedDuration: 15,
      });
    }
  }
  
  // Priority 4: Weak areas identified by AI
  const weaknesses = identifyWeaknesses(progressList, plays);
  
  for (const weak of weaknesses.weakestPlays.slice(0, 2)) {
    if (!steps.find((s) => s.playId === weak.playId)) {
      steps.push({
        type: "remediation",
        playId: weak.playId,
        reason: `Mastery at ${weak.masteryScore}%`,
        suggestedDuration: 10,
      });
    }
  }
  
  return {
    steps,
    totalDuration: steps.reduce((sum, s) => sum + s.suggestedDuration, 0),
    generatedAt: now(),
  };
}

// ───────────────────────────────────────────────────────────────────────────────────────────
// FLASHCARD GENERATION
// ───────────────────────────────────────────────────────────────────────────────────────────

/**
 * Generate flashcards from a play's assignments
 */
export function generateFlashcardsForPlay(
  play: PlaybookPlay,
  position: SkillPosition
): Omit<PlaybookFlashcard, "id" | "easeFactor" | "interval" | "dueDate" | "timesShown" | "timesCorrect">[] {
  const assignment = play.assignments.find((a) => a.position === position);
  if (!assignment) return [];
  
  const cards: Omit<PlaybookFlashcard, "id" | "easeFactor" | "interval" | "dueDate" | "timesShown" | "timesCorrect">[] = [];
  
  // Alignment card
  cards.push({
    playId: play.id,
    position,
    category: "alignment",
    front: `On ${play.name}, where do you align?`,
    back: assignment.alignment,
    difficulty: "beginner",
  });
  
  // Assignment card
  cards.push({
    playId: play.id,
    position,
    category: "assignment",
    front: `What's your assignment on ${play.name}?`,
    back: assignment.assignment,
    hint: assignment.routeId ? `Hint: Think about your route` : undefined,
    difficulty: "beginner",
  });
  
  // Read card
  cards.push({
    playId: play.id,
    position,
    category: "read",
    front: `What are you reading on ${play.name}?`,
    back: assignment.read,
    difficulty: "intermediate",
  });
  
  // Coverage adjustment cards
  const coverageLabels: Record<string, string> = {
    vsMan: "Man coverage",
    vsZone: "Zone coverage",
    vsCover2: "Cover 2",
    vsCover3: "Cover 3",
    vsCover4: "Cover 4",
    vsBlitz: "Blitz",
    vsFireZone: "Fire Zone",
  };
  
  for (const [key, adjustment] of Object.entries(assignment.adjustments)) {
    if (adjustment) {
      const coverageName = coverageLabels[key] || key.replace("vs", "");
      cards.push({
        playId: play.id,
        position,
        category: "coverage",
        front: `On ${play.name}, how do you adjust vs ${coverageName}?`,
        back: adjustment,
        difficulty: "advanced",
      });
    }
  }
  
  // Motion card (if applicable)
  if (assignment.motion) {
    cards.push({
      playId: play.id,
      position,
      category: "motion",
      front: `Describe the motion on ${play.name}`,
      back: `${assignment.motion.type} motion, ${assignment.motion.timing} snap: ${assignment.motion.path}`,
      difficulty: "intermediate",
    });
  }
  
  return cards;
}

// ───────────────────────────────────────────────────────────────────────────────────────────
// FORMATTING UTILITIES
// ───────────────────────────────────────────────────────────────────────────────────────────

/**
 * Format coverage name for display
 */
export function formatCoverage(coverageKey: string): string {
  const labels: Record<string, string> = {
    vsMan: "Man",
    vsZone: "Zone",
    vsCover2: "Cover 2",
    vsCover3: "Cover 3",
    vsCover4: "Cover 4",
    vsBlitz: "Blitz",
    vsFireZone: "Fire Zone",
  };
  return labels[coverageKey] || coverageKey.replace("vs", "");
}

/**
 * Format position for display
 */
export function formatPosition(position: SkillPosition): string {
  const labels: Record<SkillPosition, string> = {
    QB: "Quarterback",
    RB: "Running Back",
    FB: "Fullback",
    X: "X Receiver (Split End)",
    Z: "Z Receiver (Flanker)",
    H: "H Receiver (Slot)",
    Y: "Y Receiver (Tight End/Slot)",
    TE: "Tight End",
  };
  return labels[position] || position;
}

/**
 * Format mastery level for display
 */
export function formatMasteryLevel(level: MasteryLevel): string {
  const labels: Record<MasteryLevel, string> = {
    new: "New",
    learning: "Learning",
    proficient: "Proficient",
    mastered: "Mastered",
  };
  return labels[level];
}

/**
 * Get color for mastery level
 */
export function getMasteryColor(score: number): string {
  if (score >= 80) return "text-[#00F6E5]"; // Teal - Mastered
  if (score >= 60) return "text-[#3DF3FF]"; // Ice - Proficient
  if (score >= 40) return "text-[#F5C253]"; // Gold - Learning
  return "text-[#FF6A3D]"; // Orange - Needs work
}

/**
 * Get status badge color
 */
export function getStatusColor(status: PlayStatus): string {
  const colors: Record<PlayStatus, string> = {
    NEW: "bg-[#00F6E5] text-[#0A0A0A]",
    DUE_TODAY: "bg-[#FF6A3D] text-white",
    EMPHASIS: "bg-[#F5C253] text-[#0A0A0A]",
    NEEDS_REPS: "bg-orange-500/20 text-orange-400 border-orange-500/30",
    COMPLETED: "bg-green-500/20 text-green-400 border-green-500/30",
    NORMAL: "bg-slate-800 text-slate-400 border-slate-700",
  };
  return colors[status];
}




