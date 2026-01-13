// ═══════════════════════════════════════════════════════════════════════════════════════════
// CHALKBOARD — GAME ANALYTICS TYPES
// 
// Type definitions for the analytics layer powering coach dashboards and player insights.
// ═══════════════════════════════════════════════════════════════════════════════════════════

import type { FootballPosition, GameType, DifficultyLevel } from '@/lib/types/database';

// ───────────────────────────────────────────────────────────────────────────────────────────
// FOOTBALL IQ METRICS
// ───────────────────────────────────────────────────────────────────────────────────────────

/**
 * Overall Football IQ Index breakdown (0-100 scale)
 * 
 * FORMULA:
 * Football IQ = (
 *   (Accuracy × 0.35) +                    // How often correct
 *   (Speed Factor × 0.20) +                // How fast when correct
 *   (Difficulty Weighted Score × 0.25) +   // Playing harder = higher IQ
 *   (Consistency × 0.10) +                 // Low variance in performance
 *   (Engagement × 0.10)                    // Regular practice shows commitment
 * ) × 100
 */
export interface FootballIQIndex {
  overall: number;           // 0-100 composite score
  coverageIQ: number;        // Coverage recognition proficiency
  blitzIQ: number;           // Blitz/protection reading proficiency
  situationalIQ: number;     // Red zone, 2-minute, etc.
  formationIQ: number;       // Formation memory & recognition
  routeConceptIQ: number;    // Route matching proficiency
  assignmentIQ: number;      // Play responsibility knowledge
  
  // Metadata
  confidence: 'low' | 'medium' | 'high';  // Based on sample size
  gamesPlayed: number;
  lastUpdated: string;
}

/**
 * Category-specific IQ score with breakdown
 */
export interface CategoryIQ {
  score: number;              // 0-100
  accuracy: number;           // Percentage correct
  avgResponseTimeMs: number;  // Speed metric
  gamesPlayed: number;
  questionsAnswered: number;
  trend: 'improving' | 'stable' | 'declining';
  percentile: number;         // vs team or position group
}

// ───────────────────────────────────────────────────────────────────────────────────────────
// COACH DASHBOARD TYPES
// ───────────────────────────────────────────────────────────────────────────────────────────

/**
 * Top-line KPIs for Coach Dashboard
 */
export interface TeamKPIs {
  // This Week
  thisWeek: {
    totalSessions: number;
    totalXPEarned: number;
    averageAccuracy: number;
    activePlayers: number;
    averageFootballIQ: number;
  };
  
  // Last Week (for comparison)
  lastWeek: {
    totalSessions: number;
    totalXPEarned: number;
    averageAccuracy: number;
    activePlayers: number;
    averageFootballIQ: number;
  };
  
  // Deltas (positive = improvement)
  deltas: {
    sessions: number;
    sessionsPercent: number;
    xp: number;
    xpPercent: number;
    accuracy: number;
    accuracyPercent: number;
    activePlayers: number;
    activePlayersPercent: number;
    footballIQ: number;
    footballIQPercent: number;
  };
}

/**
 * Player summary for leaderboard/rankings
 */
export interface PlayerRankingSummary {
  userId: string;
  displayName: string;
  firstName: string;
  lastName: string;
  avatarUrl: string | null;
  position: FootballPosition | null;
  positionGroup: string | null;
  jerseyNumber: number | null;
  
  // IQ Scores
  footballIQ: number;
  coverageIQ: number;
  blitzIQ: number;
  
  // Performance
  accuracy: number;
  gamesThisWeek: number;
  xpThisWeek: number;
  currentStreak: number;
  level: number;
  
  // Rank info
  rank: number;
  previousRank: number | null;
  rankChange: number | null;  // positive = moved up
  
  // Engagement
  lastActiveAt: string;
  daysActiveLast14: number;
}

/**
 * Call-out: Most Improved Player
 */
export interface MostImprovedPlayer {
  userId: string;
  displayName: string;
  position: FootballPosition | null;
  avatarUrl: string | null;
  
  // Improvement metrics
  footballIQGain: number;      // IQ points gained
  accuracyGain: number;        // Accuracy percentage points gained
  xpGained: number;
  gamesPlayedThisWeek: number;
  
  // Category improvements
  mostImprovedCategory: {
    category: string;
    previousScore: number;
    currentScore: number;
    gain: number;
  };
}

/**
 * Call-out: Player At Risk
 * Identifies players who may need coach attention
 */
export interface PlayerAtRisk {
  userId: string;
  displayName: string;
  position: FootballPosition | null;
  avatarUrl: string | null;
  
  // Risk indicators
  riskLevel: 'low' | 'medium' | 'high';
  riskReasons: RiskReason[];
  
  // Stats
  daysInactive: number;
  accuracyTrend: 'stable' | 'declining';
  accuracyDropPercent: number | null;
  currentAccuracy: number;
  gamesLastWeek: number;
  gamesThisWeek: number;
  
  // Recommendation
  suggestedAction: string;
}

export interface RiskReason {
  type: 'inactivity' | 'low_reps' | 'declining_accuracy' | 'low_accuracy' | 'no_streak';
  severity: 'warning' | 'alert';
  message: string;
}

/**
 * IQ Comparison Chart Data (Coverage vs Blitz, etc.)
 */
export interface IQComparisonData {
  labels: string[];  // Player names or position groups
  datasets: {
    label: string;   // e.g., "Coverage IQ", "Blitz IQ"
    data: number[];  // Scores corresponding to labels
    backgroundColor?: string;
    borderColor?: string;
  }[];
}

/**
 * Radar Chart Data for player strengths/weaknesses
 */
export interface PlayerRadarData {
  categories: string[];
  scores: number[];
  teamAverage: number[];
}

// ───────────────────────────────────────────────────────────────────────────────────────────
// POSITION GROUP ANALYTICS
// ───────────────────────────────────────────────────────────────────────────────────────────

/**
 * Position group (room) summary
 */
export interface PositionRoomSummary {
  positionGroup: string;
  displayName: string;  // e.g., "WR Room", "Secondary"
  
  // Aggregate stats
  playerCount: number;
  activePlayerCount: number;
  averageFootballIQ: number;
  averageAccuracy: number;
  totalGamesThisWeek: number;
  totalXPThisWeek: number;
  
  // Comparison to team
  footballIQvsTeam: number;  // Delta from team average
  
  // Top performer
  topPlayer: {
    userId: string;
    displayName: string;
    footballIQ: number;
  } | null;
  
  // Focus areas (categories where room is weakest)
  weakestCategories: {
    category: string;
    averageScore: number;
    teamAverageScore: number;
  }[];
}

// ───────────────────────────────────────────────────────────────────────────────────────────
// READINESS & INSTALL TRACKING
// ───────────────────────────────────────────────────────────────────────────────────────────

/**
 * Player readiness for a specific install/concept
 */
export interface InstallReadiness {
  conceptId: string;
  conceptName: string;
  category: 'coverage' | 'blitz' | 'formation' | 'route' | 'situation';
  
  // Readiness score (0-100)
  readinessScore: number;
  readinessLevel: 'not_started' | 'learning' | 'proficient' | 'mastered';
  
  // Stats
  totalReps: number;
  correctReps: number;
  accuracy: number;
  lastPracticed: string | null;
  
  // Thresholds
  repsNeeded: number;      // How many more reps to reach next level
  accuracyNeeded: number;  // Target accuracy for proficiency
}

/**
 * Sunday Readiness Report
 */
export interface SundayReadinessReport {
  playerId: string;
  playerName: string;
  position: FootballPosition | null;
  
  overallReadiness: number;  // 0-100
  readinessLevel: 'not_ready' | 'developing' | 'ready' | 'game_ready';
  
  // By category
  categoryReadiness: {
    category: string;
    score: number;
    status: 'red' | 'yellow' | 'green';
    blindSpots: string[];  // Specific concepts needing work
  }[];
  
  // Action items
  recommendedFocus: string[];
  estimatedPrepTime: string;  // e.g., "2 hours of reps needed"
}

// ───────────────────────────────────────────────────────────────────────────────────────────
// TRENDS & TIME SERIES
// ───────────────────────────────────────────────────────────────────────────────────────────

/**
 * Time series data point
 */
export interface TrendDataPoint {
  date: string;        // ISO date
  value: number;
  label?: string;
}

/**
 * Player trend data
 */
export interface PlayerTrends {
  userId: string;
  
  // Football IQ over time
  footballIQTrend: TrendDataPoint[];
  
  // Accuracy trend
  accuracyTrend: TrendDataPoint[];
  
  // Games per day
  activityTrend: TrendDataPoint[];
  
  // Category trends
  categoryTrends: {
    category: string;
    data: TrendDataPoint[];
  }[];
  
  // Period covered
  periodStart: string;
  periodEnd: string;
  granularity: 'daily' | 'weekly';
}

/**
 * Team engagement trend
 */
export interface TeamEngagementTrend {
  dates: string[];
  sessionsPerDay: number[];
  activePlayersPerDay: number[];
  averageAccuracyPerDay: number[];
}

// ───────────────────────────────────────────────────────────────────────────────────────────
// API REQUEST/RESPONSE TYPES
// ───────────────────────────────────────────────────────────────────────────────────────────

export interface CoachDashboardRequest {
  teamId: string;
  dateRange?: {
    start: string;
    end: string;
  };
  positionGroupFilter?: string;
}

export interface CoachDashboardResponse {
  teamId: string;
  teamName: string;
  generatedAt: string;
  
  // KPIs
  kpis: TeamKPIs;
  
  // Rankings
  playerRankings: PlayerRankingSummary[];
  
  // IQ Comparison Chart Data
  iqComparison: IQComparisonData;
  
  // Call-outs
  mostImproved: MostImprovedPlayer | null;
  playersAtRisk: PlayerAtRisk[];
  
  // Position rooms
  positionRooms: PositionRoomSummary[];
}

export interface PlayerAnalyticsRequest {
  playerId: string;
  teamId: string;
  period?: 'week' | 'month' | 'season';
}

export interface PlayerAnalyticsResponse {
  player: PlayerRankingSummary;
  footballIQ: FootballIQIndex;
  categoryBreakdown: Record<string, CategoryIQ>;
  trends: PlayerTrends;
  readiness: InstallReadiness[];
  recommendations: string[];
}

// ───────────────────────────────────────────────────────────────────────────────────────────
// CONSTANTS
// ───────────────────────────────────────────────────────────────────────────────────────────

/**
 * Thresholds for Football IQ interpretation
 */
export const FOOTBALL_IQ_THRESHOLDS = {
  ELITE: 90,
  ADVANCED: 75,
  PROFICIENT: 60,
  DEVELOPING: 45,
  BEGINNER: 0,
};

/**
 * Risk thresholds for player monitoring
 */
export const RISK_THRESHOLDS = {
  DAYS_INACTIVE_WARNING: 3,
  DAYS_INACTIVE_ALERT: 7,
  ACCURACY_DROP_WARNING: 10,  // percentage points
  ACCURACY_DROP_ALERT: 20,
  MIN_WEEKLY_GAMES: 3,
  LOW_ACCURACY_THRESHOLD: 60,
};

/**
 * Readiness level thresholds
 */
export const READINESS_THRESHOLDS = {
  MASTERED: { accuracy: 95, reps: 20 },
  PROFICIENT: { accuracy: 85, reps: 10 },
  LEARNING: { accuracy: 70, reps: 5 },
  NOT_STARTED: { accuracy: 0, reps: 0 },
};

/**
 * Game type to IQ category mapping
 */
export const GAME_TYPE_TO_IQ_CATEGORY: Record<GameType, keyof Omit<FootballIQIndex, 'overall' | 'confidence' | 'gamesPlayed' | 'lastUpdated'>> = {
  coverage_recognition: 'coverageIQ',
  blitz_id: 'blitzIQ',
  route_matching: 'routeConceptIQ',
  formation_memory: 'formationIQ',
  play_responsibility: 'assignmentIQ',
  red_zone_scenarios: 'situationalIQ',
  two_minute_drill: 'situationalIQ',
  film_reaction: 'coverageIQ',  // General film study maps to coverage
};








