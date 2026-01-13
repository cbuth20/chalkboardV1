// ═══════════════════════════════════════════════════════════════════════════════════════════
// CHALKBOARD — SCORING ENGINE
// 
// Comprehensive scoring, XP, level, and streak calculation logic.
// All formulas are documented and designed to be fair, rewarding, and anti-exploit.
// ═══════════════════════════════════════════════════════════════════════════════════════════

import type {
  DifficultyLevel,
  GameType,
  GameMode,
  GameSession,
  GameAttempt,
  XPEventType,
} from '@/lib/types/database';

// ───────────────────────────────────────────────────────────────────────────────────────────
// CONFIGURATION CONSTANTS
// ───────────────────────────────────────────────────────────────────────────────────────────

/**
 * Base points awarded for a correct answer (before any multipliers)
 */
export const BASE_POINTS_PER_CORRECT = 100;

/**
 * Difficulty multipliers - harder questions are worth more
 */
export const DIFFICULTY_MULTIPLIERS: Record<DifficultyLevel, number> = {
  easy: 1.0,
  medium: 1.5,
  hard: 2.0,
  expert: 2.5,
};

/**
 * Mode multipliers - compete mode is worth more
 */
export const MODE_MULTIPLIERS: Record<GameMode, number> = {
  train: 1.0,
  compete: 1.25,
};

/**
 * Time bonus configuration
 * Fast answers earn bonus points; the faster you answer, the more bonus
 */
export const TIME_BONUS = {
  /** Maximum bonus points for fastest possible answer */
  MAX_BONUS: 50,
  /** Answer faster than this (ms) gets max bonus */
  FAST_THRESHOLD_MS: 2000,
  /** Answer slower than this (ms) gets no bonus */
  SLOW_THRESHOLD_MS: 15000,
  /** Minimum time to be considered valid (anti-bot protection) */
  MIN_VALID_TIME_MS: 500,
};

/**
 * Streak bonus configuration
 * Consecutive correct answers earn increasing multipliers
 */
export const STREAK_BONUS = {
  /** Streak length needed to start getting bonuses */
  MIN_STREAK_FOR_BONUS: 3,
  /** Maximum streak multiplier */
  MAX_MULTIPLIER: 2.0,
  /** Multiplier increase per correct answer after threshold */
  MULTIPLIER_INCREMENT: 0.1,
  /** XP bonus for maintaining a daily streak */
  DAILY_STREAK_XP: [
    0,    // Day 0 (no bonus)
    0,    // Day 1
    25,   // Day 2
    50,   // Day 3
    75,   // Day 4
    100,  // Day 5
    150,  // Day 6
    200,  // Day 7
    250,  // Day 8+
  ],
};

/**
 * XP configuration
 */
export const XP_CONFIG = {
  /** Base XP earned per point scored */
  POINTS_TO_XP_RATIO: 0.1,
  /** Bonus XP for completing a game */
  COMPLETION_BONUS: 50,
  /** Bonus XP for a perfect game (100% accuracy) */
  PERFECT_GAME_BONUS: 200,
  /** Bonus XP for first play of the day */
  FIRST_PLAY_BONUS: 100,
  /** Minimum XP per completed game */
  MIN_XP_PER_GAME: 25,
};

/**
 * Anti-exploit thresholds
 */
export const ANTI_EXPLOIT = {
  /** Minimum session duration (seconds) to be valid */
  MIN_SESSION_DURATION_SECONDS: 30,
  /** Maximum games per hour before throttling XP */
  MAX_GAMES_PER_HOUR: 20,
  /** If accuracy is below this with fast answers, flag as suspicious */
  SUSPICIOUS_ACCURACY_THRESHOLD: 0.3,
  /** If average response time is below this (ms), flag as suspicious */
  SUSPICIOUS_AVG_RESPONSE_TIME_MS: 800,
};

/**
 * Level progression - total XP required to reach each level
 * Uses a polynomial growth curve: XP = 500 * level^1.5
 */
export const LEVELS = generateLevelThresholds(35);

// ───────────────────────────────────────────────────────────────────────────────────────────
// SCORING CALCULATIONS
// ───────────────────────────────────────────────────────────────────────────────────────────

/**
 * Calculate the time bonus for a single answer
 * 
 * Formula:
 * - If time < FAST_THRESHOLD: MAX_BONUS
 * - If time > SLOW_THRESHOLD: 0
 * - Otherwise: Linear interpolation between MAX_BONUS and 0
 * 
 * @param timeTakenMs - Time in milliseconds to answer
 * @returns Bonus points (0 to MAX_BONUS)
 */
export function calculateTimeBonus(timeTakenMs: number): number {
  // Anti-bot: too fast = no bonus
  if (timeTakenMs < TIME_BONUS.MIN_VALID_TIME_MS) {
    return 0;
  }
  
  // Fast answer: max bonus
  if (timeTakenMs <= TIME_BONUS.FAST_THRESHOLD_MS) {
    return TIME_BONUS.MAX_BONUS;
  }
  
  // Slow answer: no bonus
  if (timeTakenMs >= TIME_BONUS.SLOW_THRESHOLD_MS) {
    return 0;
  }
  
  // Linear interpolation between thresholds
  const range = TIME_BONUS.SLOW_THRESHOLD_MS - TIME_BONUS.FAST_THRESHOLD_MS;
  const elapsed = timeTakenMs - TIME_BONUS.FAST_THRESHOLD_MS;
  const ratio = 1 - (elapsed / range);
  
  return Math.round(TIME_BONUS.MAX_BONUS * ratio);
}

/**
 * Calculate the streak multiplier based on consecutive correct answers
 * 
 * Formula:
 * - Streak < MIN_STREAK_FOR_BONUS: 1.0
 * - Otherwise: 1.0 + (streak - MIN_STREAK_FOR_BONUS + 1) * MULTIPLIER_INCREMENT
 * - Capped at MAX_MULTIPLIER
 * 
 * @param currentStreak - Number of consecutive correct answers
 * @returns Multiplier (1.0 to MAX_MULTIPLIER)
 */
export function calculateStreakMultiplier(currentStreak: number): number {
  if (currentStreak < STREAK_BONUS.MIN_STREAK_FOR_BONUS) {
    return 1.0;
  }
  
  const bonusStreak = currentStreak - STREAK_BONUS.MIN_STREAK_FOR_BONUS + 1;
  const multiplier = 1.0 + (bonusStreak * STREAK_BONUS.MULTIPLIER_INCREMENT);
  
  return Math.min(multiplier, STREAK_BONUS.MAX_MULTIPLIER);
}

/**
 * Calculate points for a single attempt
 * 
 * Formula:
 * totalPoints = (basePoints + timeBonus) * streakMultiplier * difficultyMultiplier
 * 
 * @param params - Attempt parameters
 * @returns Calculated attempt score breakdown
 */
export function calculateAttemptScore(params: {
  isCorrect: boolean;
  timeTakenMs: number;
  difficulty: DifficultyLevel;
  currentStreak: number;
  basePoints?: number;
}): {
  basePoints: number;
  timeBonus: number;
  streakMultiplier: number;
  difficultyMultiplier: number;
  totalPoints: number;
  newStreak: number;
} {
  const {
    isCorrect,
    timeTakenMs,
    difficulty,
    currentStreak,
    basePoints = BASE_POINTS_PER_CORRECT,
  } = params;

  if (!isCorrect) {
    return {
      basePoints: 0,
      timeBonus: 0,
      streakMultiplier: 1.0,
      difficultyMultiplier: DIFFICULTY_MULTIPLIERS[difficulty],
      totalPoints: 0,
      newStreak: 0,
    };
  }

  const timeBonus = calculateTimeBonus(timeTakenMs);
  const newStreak = currentStreak + 1;
  const streakMultiplier = calculateStreakMultiplier(newStreak);
  const difficultyMultiplier = DIFFICULTY_MULTIPLIERS[difficulty];

  const totalPoints = Math.round(
    (basePoints + timeBonus) * streakMultiplier * difficultyMultiplier
  );

  return {
    basePoints,
    timeBonus,
    streakMultiplier,
    difficultyMultiplier,
    totalPoints,
    newStreak,
  };
}

/**
 * Calculate the final session score from all attempts
 * 
 * @param attempts - Array of attempt results
 * @param mode - Train or Compete mode
 * @returns Session score breakdown
 */
export function calculateSessionScore(
  attempts: {
    isCorrect: boolean;
    totalPoints: number;
    streakMultiplier: number;
  }[],
  mode: GameMode
): {
  rawScore: number;
  modeMultiplier: number;
  totalStreakBonus: number;
  finalScore: number;
  accuracy: number;
  longestStreak: number;
} {
  let rawScore = 0;
  let totalStreakBonus = 0;
  let currentStreak = 0;
  let longestStreak = 0;
  let correctCount = 0;

  for (const attempt of attempts) {
    rawScore += attempt.totalPoints;
    
    if (attempt.isCorrect) {
      correctCount++;
      currentStreak++;
      longestStreak = Math.max(longestStreak, currentStreak);
      
      // Calculate streak bonus contribution
      if (attempt.streakMultiplier > 1.0) {
        totalStreakBonus += Math.round(
          attempt.totalPoints * (1 - 1 / attempt.streakMultiplier)
        );
      }
    } else {
      currentStreak = 0;
    }
  }

  const modeMultiplier = MODE_MULTIPLIERS[mode];
  const finalScore = Math.round(rawScore * modeMultiplier);
  const accuracy = attempts.length > 0 
    ? (correctCount / attempts.length) * 100 
    : 0;

  return {
    rawScore,
    modeMultiplier,
    totalStreakBonus,
    finalScore,
    accuracy,
    longestStreak,
  };
}

// ───────────────────────────────────────────────────────────────────────────────────────────
// XP CALCULATIONS
// ───────────────────────────────────────────────────────────────────────────────────────────

/**
 * Calculate XP earned from a completed game session
 * 
 * Formula:
 * baseXP = finalScore * POINTS_TO_XP_RATIO
 * bonuses = completion + perfectGame + firstPlay + dailyStreak
 * totalXP = max(baseXP + bonuses, MIN_XP_PER_GAME)
 * 
 * @param session - Completed game session
 * @param context - Additional context for bonuses
 * @returns XP breakdown and events
 */
export function calculateSessionXP(
  session: {
    finalScore: number;
    accuracy: number;
    correctAnswers: number;
    totalQuestions: number;
    mode: GameMode;
  },
  context: {
    isFirstPlayToday: boolean;
    dailyStreakDays: number;
    isDailyChallenge: boolean;
    dailyChallengeXP?: number;
  }
): {
  baseXP: number;
  completionBonus: number;
  perfectGameBonus: number;
  firstPlayBonus: number;
  dailyStreakBonus: number;
  dailyChallengeBonus: number;
  totalXP: number;
  events: Array<{ type: XPEventType; amount: number; description: string }>;
} {
  const events: Array<{ type: XPEventType; amount: number; description: string }> = [];

  // Base XP from score
  const baseXP = Math.round(session.finalScore * XP_CONFIG.POINTS_TO_XP_RATIO);
  events.push({
    type: 'game_completion',
    amount: baseXP,
    description: `Earned from game score: ${session.finalScore}`,
  });

  // Completion bonus
  const completionBonus = XP_CONFIG.COMPLETION_BONUS;
  events.push({
    type: 'game_completion',
    amount: completionBonus,
    description: 'Game completion bonus',
  });

  // Perfect game bonus (100% accuracy)
  let perfectGameBonus = 0;
  if (session.accuracy === 100 && session.totalQuestions >= 5) {
    perfectGameBonus = XP_CONFIG.PERFECT_GAME_BONUS;
    events.push({
      type: 'perfect_game',
      amount: perfectGameBonus,
      description: `Perfect game! ${session.correctAnswers}/${session.totalQuestions}`,
    });
  }

  // First play of the day bonus
  let firstPlayBonus = 0;
  if (context.isFirstPlayToday) {
    firstPlayBonus = XP_CONFIG.FIRST_PLAY_BONUS;
    events.push({
      type: 'first_play_of_day',
      amount: firstPlayBonus,
      description: 'First game of the day!',
    });
  }

  // Daily streak bonus
  let dailyStreakBonus = 0;
  if (context.dailyStreakDays > 0) {
    const streakIndex = Math.min(
      context.dailyStreakDays,
      STREAK_BONUS.DAILY_STREAK_XP.length - 1
    );
    dailyStreakBonus = STREAK_BONUS.DAILY_STREAK_XP[streakIndex];
    if (dailyStreakBonus > 0) {
      events.push({
        type: 'streak_bonus',
        amount: dailyStreakBonus,
        description: `${context.dailyStreakDays} day streak bonus!`,
      });
    }
  }

  // Daily challenge bonus
  let dailyChallengeBonus = 0;
  if (context.isDailyChallenge && context.dailyChallengeXP) {
    dailyChallengeBonus = context.dailyChallengeXP;
    events.push({
      type: 'daily_challenge',
      amount: dailyChallengeBonus,
      description: 'Daily Challenge completed!',
    });
  }

  // Calculate total with minimum guarantee
  const totalXP = Math.max(
    baseXP + completionBonus + perfectGameBonus + firstPlayBonus + dailyStreakBonus + dailyChallengeBonus,
    XP_CONFIG.MIN_XP_PER_GAME
  );

  return {
    baseXP,
    completionBonus,
    perfectGameBonus,
    firstPlayBonus,
    dailyStreakBonus,
    dailyChallengeBonus,
    totalXP,
    events,
  };
}

// ───────────────────────────────────────────────────────────────────────────────────────────
// LEVEL CALCULATIONS
// ───────────────────────────────────────────────────────────────────────────────────────────

/**
 * Generate level threshold table
 * Uses polynomial growth: XP = baseXP * level^exponent
 */
function generateLevelThresholds(maxLevel: number): {
  level: number;
  xpRequired: number;
  xpToNext: number;
  title: string;
}[] {
  const BASE_XP = 500;
  const EXPONENT = 1.5;
  
  const levels = [];
  let previousXP = 0;

  for (let level = 1; level <= maxLevel; level++) {
    const xpRequired = level === 1 ? 0 : Math.round(BASE_XP * Math.pow(level, EXPONENT));
    const nextLevelXP = level < maxLevel 
      ? Math.round(BASE_XP * Math.pow(level + 1, EXPONENT))
      : xpRequired;
    const xpToNext = nextLevelXP - xpRequired;
    
    const title = getLevelTitle(level);
    
    levels.push({ level, xpRequired, xpToNext, title });
    previousXP = xpRequired;
  }

  return levels;
}

/**
 * Get the title for a given level
 */
function getLevelTitle(level: number): string {
  if (level <= 3) return 'Rookie';
  if (level <= 6) return 'Sophomore';
  if (level <= 9) return 'Varsity';
  if (level <= 12) return 'Starter';
  if (level <= 15) return 'All-Conference';
  if (level <= 18) return 'All-American';
  if (level <= 21) return 'Pro';
  if (level <= 24) return 'Elite';
  if (level <= 27) return 'Hall of Fame';
  if (level <= 30) return 'Legend';
  return 'GOAT';
}

/**
 * Calculate level from total XP
 * 
 * @param totalXP - User's total accumulated XP
 * @returns Current level and progress
 */
export function calculateLevelFromXP(totalXP: number): {
  level: number;
  title: string;
  xpInCurrentLevel: number;
  xpRequiredForLevel: number;
  xpToNextLevel: number;
  progressPercent: number;
} {
  // Find the highest level the user has reached
  let currentLevel = 1;
  
  for (const levelData of LEVELS) {
    if (totalXP >= levelData.xpRequired) {
      currentLevel = levelData.level;
    } else {
      break;
    }
  }

  const levelData = LEVELS[currentLevel - 1];
  const nextLevelData = LEVELS[currentLevel] || levelData;
  
  const xpInCurrentLevel = totalXP - levelData.xpRequired;
  const xpRequiredForLevel = levelData.xpRequired;
  const xpToNextLevel = levelData.xpToNext;
  
  const progressPercent = xpToNextLevel > 0 
    ? Math.min((xpInCurrentLevel / xpToNextLevel) * 100, 100)
    : 100;

  return {
    level: currentLevel,
    title: levelData.title,
    xpInCurrentLevel,
    xpRequiredForLevel,
    xpToNextLevel,
    progressPercent: Math.round(progressPercent * 100) / 100,
  };
}

/**
 * Check if user leveled up and return new level info
 * 
 * @param previousXP - XP before earning new XP
 * @param newXP - New total XP
 * @returns Level up info or null if no level up
 */
export function checkLevelUp(
  previousXP: number,
  newXP: number
): {
  previousLevel: number;
  newLevel: number;
  levelsGained: number;
  newTitle: string;
} | null {
  const previousLevel = calculateLevelFromXP(previousXP);
  const newLevel = calculateLevelFromXP(newXP);

  if (newLevel.level > previousLevel.level) {
    return {
      previousLevel: previousLevel.level,
      newLevel: newLevel.level,
      levelsGained: newLevel.level - previousLevel.level,
      newTitle: newLevel.title,
    };
  }

  return null;
}

// ───────────────────────────────────────────────────────────────────────────────────────────
// STREAK CALCULATIONS
// ───────────────────────────────────────────────────────────────────────────────────────────

/**
 * Calculate daily streak status
 * 
 * @param lastPlayDate - Date of last game played (YYYY-MM-DD)
 * @param currentStreak - Current streak count
 * @returns Updated streak info
 */
export function calculateStreakStatus(
  lastPlayDate: string | null,
  currentStreak: number,
  freezeTokens: number = 0
): {
  isActive: boolean;
  canContinue: boolean;
  newStreak: number;
  streakBroken: boolean;
  usedFreezeToken: boolean;
} {
  if (!lastPlayDate) {
    return {
      isActive: false,
      canContinue: true,
      newStreak: 1,
      streakBroken: false,
      usedFreezeToken: false,
    };
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const lastPlay = new Date(lastPlayDate);
  lastPlay.setHours(0, 0, 0, 0);
  
  const daysDiff = Math.floor(
    (today.getTime() - lastPlay.getTime()) / (1000 * 60 * 60 * 24)
  );

  // Played today - streak is active
  if (daysDiff === 0) {
    return {
      isActive: true,
      canContinue: true,
      newStreak: currentStreak,
      streakBroken: false,
      usedFreezeToken: false,
    };
  }

  // Played yesterday - can continue streak
  if (daysDiff === 1) {
    return {
      isActive: false,
      canContinue: true,
      newStreak: currentStreak + 1,
      streakBroken: false,
      usedFreezeToken: false,
    };
  }

  // Missed a day but have freeze token
  if (daysDiff === 2 && freezeTokens > 0) {
    return {
      isActive: false,
      canContinue: true,
      newStreak: currentStreak + 1,
      streakBroken: false,
      usedFreezeToken: true,
    };
  }

  // Streak is broken
  return {
    isActive: false,
    canContinue: true,
    newStreak: 1,
    streakBroken: true,
    usedFreezeToken: false,
  };
}

// ───────────────────────────────────────────────────────────────────────────────────────────
// ANTI-EXPLOIT VALIDATION
// ───────────────────────────────────────────────────────────────────────────────────────────

/**
 * Validate a completed session for suspicious activity
 * 
 * @param session - Session data to validate
 * @param attempts - Individual attempts
 * @returns Validation result
 */
export function validateSession(
  session: {
    totalTimeSeconds: number;
    accuracy: number;
    avgResponseTimeMs: number;
    correctAnswers: number;
    totalQuestions: number;
  },
  attempts: Array<{ timeTakenMs: number; isCorrect: boolean }>
): {
  isValid: boolean;
  flags: string[];
  adjustedXPMultiplier: number;
} {
  const flags: string[] = [];
  let isValid = true;
  let adjustedXPMultiplier = 1.0;

  // Check minimum session duration
  if (session.totalTimeSeconds < ANTI_EXPLOIT.MIN_SESSION_DURATION_SECONDS) {
    flags.push('Session too short');
    isValid = false;
  }

  // Check for suspiciously fast average response time
  if (session.avgResponseTimeMs < ANTI_EXPLOIT.SUSPICIOUS_AVG_RESPONSE_TIME_MS) {
    flags.push('Average response time suspiciously fast');
    if (session.accuracy > 70) {
      // High accuracy with very fast responses is suspicious
      isValid = false;
    } else {
      adjustedXPMultiplier = 0.5;
    }
  }

  // Check for random guessing pattern (low accuracy, fast answers)
  if (
    session.accuracy < ANTI_EXPLOIT.SUSPICIOUS_ACCURACY_THRESHOLD * 100 &&
    session.avgResponseTimeMs < 1500
  ) {
    flags.push('Possible random guessing detected');
    adjustedXPMultiplier = 0.25;
  }

  // Check for impossibly consistent timing (bot detection)
  if (attempts.length >= 5) {
    const times = attempts.map(a => a.timeTakenMs);
    const avgTime = times.reduce((a, b) => a + b, 0) / times.length;
    const variance = times.reduce((sum, t) => sum + Math.pow(t - avgTime, 2), 0) / times.length;
    const stdDev = Math.sqrt(variance);
    
    // If all answers are within 100ms of each other, suspicious
    if (stdDev < 100 && avgTime < 2000) {
      flags.push('Suspiciously consistent timing');
      isValid = false;
    }
  }

  return { isValid, flags, adjustedXPMultiplier };
}

// ───────────────────────────────────────────────────────────────────────────────────────────
// FOOTBALL IQ RATING
// ───────────────────────────────────────────────────────────────────────────────────────────

/**
 * Calculate a user's Football IQ rating
 * 
 * This is a skill-based rating (like chess ELO) that takes into account:
 * - Accuracy across all games
 * - Difficulty of questions answered
 * - Speed of correct answers
 * - Consistency (low variance in performance)
 * 
 * Base rating: 100
 * Range: 0 - 200+
 * 
 * @param stats - User's historical stats
 * @returns Football IQ rating
 */
export function calculateFootballIQ(stats: {
  totalGames: number;
  avgAccuracy: number;
  avgDifficulty: number; // 1-4 scale (easy to expert)
  avgResponseTimeMs: number;
  consistencyScore: number; // 0-1, how consistent performance is
}): number {
  // Need minimum games for reliable rating
  if (stats.totalGames < 5) {
    return 100; // Default rating
  }

  // Base rating
  let rating = 100;

  // Accuracy component (±30 points)
  // 50% accuracy = 0 adjustment, 100% = +30, 0% = -30
  const accuracyAdjustment = (stats.avgAccuracy - 50) * 0.6;
  rating += accuracyAdjustment;

  // Difficulty component (±20 points)
  // Playing harder games is rewarded
  const difficultyAdjustment = (stats.avgDifficulty - 2) * 10;
  rating += difficultyAdjustment;

  // Speed component (±15 points)
  // Fast correct answers are rewarded
  // Under 3s = +15, over 10s = -15
  const speedScore = Math.max(0, Math.min(1, (10000 - stats.avgResponseTimeMs) / 7000));
  const speedAdjustment = (speedScore - 0.5) * 30;
  rating += speedAdjustment;

  // Consistency component (±10 points)
  const consistencyAdjustment = (stats.consistencyScore - 0.5) * 20;
  rating += consistencyAdjustment;

  // Games played bonus (up to +25 points)
  // More games = more reliable rating and slight bonus
  const gamesBonus = Math.min(stats.totalGames / 4, 25);
  rating += gamesBonus;

  // Clamp to reasonable range
  return Math.max(0, Math.round(rating * 100) / 100);
}

/**
 * Calculate position-specific IQ ratings
 * 
 * @param stats - Stats broken down by game type
 * @returns Position-specific ratings
 */
export function calculatePositionIQ(
  position: string,
  gameTypeStats: Map<GameType, {
    gamesPlayed: number;
    avgAccuracy: number;
    avgScore: number;
  }>
): {
  overallIQ: number;
  categoryRatings: Record<string, number>;
} {
  // Define which game types matter for each position
  const positionWeights: Record<string, Partial<Record<GameType, number>>> = {
    QB: {
      coverage_recognition: 0.25,
      blitz_id: 0.30,
      route_matching: 0.15,
      red_zone_scenarios: 0.15,
      two_minute_drill: 0.15,
    },
    WR: {
      coverage_recognition: 0.20,
      route_matching: 0.35,
      play_responsibility: 0.25,
      red_zone_scenarios: 0.20,
    },
    RB: {
      blitz_id: 0.30,
      play_responsibility: 0.30,
      red_zone_scenarios: 0.20,
      route_matching: 0.20,
    },
    DB: {
      coverage_recognition: 0.35,
      route_matching: 0.25,
      formation_memory: 0.20,
      play_responsibility: 0.20,
    },
    LB: {
      blitz_id: 0.25,
      coverage_recognition: 0.25,
      play_responsibility: 0.25,
      formation_memory: 0.25,
    },
    OL: {
      blitz_id: 0.40,
      formation_memory: 0.25,
      play_responsibility: 0.35,
    },
    DL: {
      blitz_id: 0.25,
      formation_memory: 0.25,
      play_responsibility: 0.30,
      red_zone_scenarios: 0.20,
    },
  };

  // Default weights if position not specifically defined
  const defaultWeights: Partial<Record<GameType, number>> = {
    coverage_recognition: 0.15,
    blitz_id: 0.15,
    route_matching: 0.15,
    formation_memory: 0.15,
    play_responsibility: 0.20,
    red_zone_scenarios: 0.10,
    two_minute_drill: 0.05,
    film_reaction: 0.05,
  };

  // Get position group (simplify position to group)
  const positionGroup = getPositionGroup(position);
  const weights = positionWeights[positionGroup] || defaultWeights;

  let weightedSum = 0;
  let totalWeight = 0;
  const categoryRatings: Record<string, number> = {};

  for (const [gameType, weight] of Object.entries(weights)) {
    const stats = gameTypeStats.get(gameType as GameType);
    if (stats && stats.gamesPlayed >= 3) {
      // Calculate rating for this category
      const categoryRating = Math.round(
        50 + (stats.avgAccuracy * 0.5) + (stats.avgScore / 100)
      );
      categoryRatings[gameType] = categoryRating;
      weightedSum += categoryRating * weight;
      totalWeight += weight;
    }
  }

  const overallIQ = totalWeight > 0 
    ? Math.round(weightedSum / totalWeight) 
    : 100;

  return { overallIQ, categoryRatings };
}

/**
 * Map specific positions to position groups
 */
function getPositionGroup(position: string): string {
  const groups: Record<string, string[]> = {
    QB: ['QB'],
    RB: ['RB', 'FB'],
    WR: ['WR'],
    TE: ['TE'],
    OL: ['OT', 'OG', 'C'],
    DL: ['DE', 'DT', 'NT'],
    LB: ['OLB', 'ILB', 'MLB'],
    DB: ['CB', 'FS', 'SS'],
    ST: ['K', 'P', 'LS'],
  };

  for (const [group, positions] of Object.entries(groups)) {
    if (positions.includes(position)) {
      return group;
    }
  }
  return 'OTHER';
}

// ───────────────────────────────────────────────────────────────────────────────────────────
// EXPORTS
// ───────────────────────────────────────────────────────────────────────────────────────────

export const ScoringEngine = {
  calculateTimeBonus,
  calculateStreakMultiplier,
  calculateAttemptScore,
  calculateSessionScore,
  calculateSessionXP,
  calculateLevelFromXP,
  checkLevelUp,
  calculateStreakStatus,
  validateSession,
  calculateFootballIQ,
  calculatePositionIQ,
  LEVELS,
  DIFFICULTY_MULTIPLIERS,
  MODE_MULTIPLIERS,
  TIME_BONUS,
  STREAK_BONUS,
  XP_CONFIG,
};








