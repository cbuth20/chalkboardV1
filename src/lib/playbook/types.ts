// ═══════════════════════════════════════════════════════════════════════════════════════════
// CHALKBOARD — PLAYBOOK TYPES
// 
// Type definitions for the Playbook system as specified in PLAYBOOK_SPEC.md
// ═══════════════════════════════════════════════════════════════════════════════════════════

import type { FormationId } from "@/types/football";
import type { RouteId } from "@/types/football";
import type { CoverageId } from "@/types/football";
import type { DiagramData } from "@/lib/ai-coach/types";

// ───────────────────────────────────────────────────────────────────────────────────────────
// CORE ENUMS & CONSTANTS
// ───────────────────────────────────────────────────────────────────────────────────────────

/**
 * Play type categories
 */
export type PlayType = "PASS" | "RUN" | "RPO" | "SCREEN" | "TRICK" | "SPECIAL";

/**
 * Dynamic play status (calculated based on progress + schedule)
 */
export type PlayStatus = 
  | "NEW"          // Recently added, never studied
  | "DUE_TODAY"    // Spaced repetition says review now
  | "EMPHASIS"     // Coach flagged as priority
  | "NEEDS_REPS"   // Behind on rep target
  | "COMPLETED"    // Fully mastered for current install
  | "NORMAL";      // Standard status

/**
 * Skill positions that receive assignments
 */
export type SkillPosition = 
  | "QB"
  | "RB"
  | "FB"
  | "X"    // Split end (usually left WR)
  | "Z"    // Flanker (usually right WR)
  | "H"    // Slot receiver
  | "Y"    // Tight end / slot
  | "TE";

/**
 * Mastery levels for player progress
 */
export type MasteryLevel = "new" | "learning" | "proficient" | "mastered";

/**
 * Flashcard categories
 */
export type FlashcardCategory = 
  | "alignment"
  | "assignment"
  | "coverage"
  | "motion"
  | "read"
  | "progression";

/**
 * Study session types
 */
export type StudySessionType = "quiz" | "flashcard" | "review" | "rep" | "walkthrough";

/**
 * Motion types
 */
export type MotionType = "jet" | "orbit" | "shift" | "trade" | "stack" | "empty";

/**
 * Motion timing
 */
export type MotionTiming = "pre" | "on" | "post";

// ───────────────────────────────────────────────────────────────────────────────────────────
// PLAY DEFINITION TYPES
// ───────────────────────────────────────────────────────────────────────────────────────────

/**
 * Motion/shift information for a position
 */
export interface MotionInfo {
  type: MotionType;
  timing: MotionTiming;
  path: string;
}

/**
 * Coverage-specific adjustments for a position
 */
export interface PositionAdjustments {
  vsMan: string;
  vsZone: string;
  vsCover2?: string;
  vsCover3?: string;
  vsCover4?: string;
  vsBlitz?: string;
  vsFireZone?: string;
}

/**
 * Position-specific assignment within a play
 */
export interface PlayAssignment {
  position: SkillPosition;
  
  // Core assignment fields (quizzable)
  alignment: string;
  splitDepth?: string;
  landmark: string;
  firstStep?: string;
  assignment: string;
  readProgression?: string[];
  runTrack?: string;
  
  // Route info (for pass plays)
  routeId?: RouteId;
  routeDepth?: number;
  routeLandmarks?: string;
  
  // Motion (if applicable)
  motion?: MotionInfo;
  
  // Coverage adjustments
  adjustments: PositionAdjustments;
  
  // Key read
  read: string;
}

/**
 * Coverage adjustment for a play
 */
export interface CoverageAdjustment {
  coverageId: CoverageId;
  playAdjustment: string;
  positionAdjustments: {
    position: SkillPosition;
    adjustment: string;
    reason: string;
  }[];
  coverageKey: string;
  effectiveness: "excellent" | "good" | "neutral" | "poor";
}

/**
 * Motion timeline step
 */
export interface MotionStep {
  step: number;
  timing: "pre-huddle" | "at-line" | "on-cadence" | "on-snap";
  description: string;
  involvedPositions: SkillPosition[];
}

/**
 * Main playbook play definition
 */
export interface PlaybookPlay {
  id: string;
  teamId: string;
  
  // Identity
  name: string;
  shortName: string;
  formationId: FormationId;
  playType: PlayType;
  concept: string;
  
  // Personnel & tags
  personnel: string;
  tags: string[];
  situationalTags: string[];
  
  // Install schedule
  installWeek: number;
  installDate: string;
  isActive: boolean;
  
  // Position assignments
  assignments: PlayAssignment[];
  
  // Coaching content
  coachingPoints: string[];
  coverageAdjustments: CoverageAdjustment[];
  motionTimeline?: MotionStep[];
  
  // Metadata
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  
  // Diagram reference
  diagramType: "pass" | "run";
  diagramData?: DiagramData;
}

// ───────────────────────────────────────────────────────────────────────────────────────────
// PLAYER PROGRESS TYPES
// ───────────────────────────────────────────────────────────────────────────────────────────

/**
 * Study session record
 */
export interface StudySession {
  timestamp: string;
  type: StudySessionType;
  score?: number;
  duration: number;
  questionsAttempted?: number;
  questionsCorrect?: number;
}

/**
 * Category-specific scores
 */
export interface CategoryScores {
  alignment: number;
  landmark: number;
  assignment: number;
  read: number;
  adjustment: number;
}

/**
 * Player progress on a specific play
 */
export interface PlayerPlayProgress {
  id: string;
  userId: string;
  teamId: string;
  playId: string;
  position: SkillPosition;
  
  // Rep tracking
  repsCompleted: number;
  repsTarget: number;
  physicalReps: number;
  
  // Mastery metrics
  masteryScore: number;
  masteryLevel: MasteryLevel;
  
  // Quiz performance
  quizAttempts: number;
  quizCorrect: number;
  quizAccuracy: number;
  avgResponseTimeMs: number;
  
  // Category breakdown
  categoryScores: CategoryScores;
  
  // Spaced repetition
  lastStudied: string;
  nextDueDate: string;
  easeFactor: number;
  interval: number;
  
  // Status flags
  isStarred: boolean;
  isEmphasis: boolean;
  needsReview: boolean;
  
  // History
  studyHistory: StudySession[];
}

// ───────────────────────────────────────────────────────────────────────────────────────────
// INSTALL TYPES
// ───────────────────────────────────────────────────────────────────────────────────────────

/**
 * Rep targets configuration
 */
export interface RepTargets {
  default: number;
  byPosition?: Partial<Record<SkillPosition, number>>;
  byPlayId?: Record<string, number>;
}

/**
 * Weekly install schedule
 */
export interface Install {
  id: string;
  teamId: string;
  
  // Schedule
  weekNumber: number;
  weekLabel: string;
  startDate: string;
  endDate: string;
  
  // Content
  playIds: string[];
  emphasisPlayIds: string[];
  
  // Player targets
  repTargets: RepTargets;
  
  // Status
  status: "upcoming" | "active" | "completed";
  
  // Notes
  coachNotes: string;
  focusAreas: string[];
}

// ───────────────────────────────────────────────────────────────────────────────────────────
// FLASHCARD TYPES
// ───────────────────────────────────────────────────────────────────────────────────────────

/**
 * Playbook flashcard
 */
export interface PlaybookFlashcard {
  id: string;
  playId: string;
  position: SkillPosition;
  category: FlashcardCategory;
  
  front: string;
  back: string;
  hint?: string;
  
  difficulty: "beginner" | "intermediate" | "advanced";
  
  // Spaced repetition
  easeFactor: number;
  interval: number;
  dueDate: string;
  
  // Performance
  timesShown: number;
  timesCorrect: number;
}

/**
 * Flashcard study result
 */
export interface FlashcardStudyResult {
  cardId: string;
  correct: boolean;
  timeMs: number;
}

// ───────────────────────────────────────────────────────────────────────────────────────────
// AI & INTELLIGENCE TYPES
// ───────────────────────────────────────────────────────────────────────────────────────────

/**
 * Weakness analysis from AI
 */
export interface WeaknessAnalysis {
  weakestCategories: {
    category: string;
    avgScore: number;
    reason: string;
  }[];
  weakestPlays: {
    playId: string;
    playName: string;
    masteryScore: number;
    reason: string;
  }[];
  recommendation: string;
}

/**
 * AI playbook analysis response
 */
export interface AIPlaybookAnalysis {
  weakestConcepts: {
    conceptId: string;
    conceptName: string;
    score: number;
    reason: string;
  }[];
  
  recommendedPlays: {
    playId: string;
    playName: string;
    reason: string;
    priority: "high" | "medium" | "low";
  }[];
  
  overallAssessment: string;
  nextSteps: string[];
}

/**
 * Study path step
 */
export interface StudyStep {
  type: "study" | "review" | "learn" | "remediation" | "quiz";
  playId: string;
  reason: string;
  suggestedDuration: number;
}

/**
 * Generated study path
 */
export interface StudyPath {
  steps: StudyStep[];
  totalDuration: number;
  generatedAt: string;
}

/**
 * Adaptive learning rules
 */
export interface AdaptiveLearningRule {
  trigger: "repeated_failure" | "mastery" | "coasting";
  threshold: number;
  action: string;
  changes: string[];
}

// ───────────────────────────────────────────────────────────────────────────────────────────
// COACH DASHBOARD TYPES
// ───────────────────────────────────────────────────────────────────────────────────────────

/**
 * Position mastery summary
 */
export interface PositionMasterySummary {
  avgMastery: number;
  playersAtRisk: number;
  playersComplete: number;
}

/**
 * Play mastery by position
 */
export interface PlayMasteryHeatmapItem {
  playId: string;
  playName: string;
  positionMastery: Record<SkillPosition, PositionMasterySummary>;
}

/**
 * Struggling concept info
 */
export interface StrugglingConcept {
  concept: string;
  avgMastery: number;
  affectedPlayers: string[];
  suggestedAction: string;
}

/**
 * Position room summary
 */
export interface PositionRoomMastery {
  position: SkillPosition;
  avgMastery: number;
  topPerformer: { name: string; mastery: number };
  needsAttention: { name: string; mastery: number }[];
}

/**
 * Full mastery heatmap
 */
export interface MasteryHeatmap {
  plays: PlayMasteryHeatmapItem[];
  strugglingConcepts: StrugglingConcept[];
  positionRooms: PositionRoomMastery[];
}

/**
 * Coach alert
 */
export interface CoachAlert {
  type: "at_risk_player" | "low_mastery" | "missed_reps" | "install_incomplete";
  severity: "warning" | "alert";
  message: string;
  affectedIds: string[];
  suggestedAction: string;
}

// ───────────────────────────────────────────────────────────────────────────────────────────
// QUIZ TYPES
// ───────────────────────────────────────────────────────────────────────────────────────────

/**
 * Assignment question (for quizzing)
 */
export interface AssignmentQuestion {
  id: string;
  playId: string;
  position: SkillPosition;
  category: FlashcardCategory;
  question: string;
  correctAnswer: string;
  options: string[];
  hint?: string;
  explanation?: string;
}

/**
 * Quiz answer submission
 */
export interface QuizAnswer {
  questionId: string;
  answerId: string;
  timeMs: number;
}

/**
 * Quiz result
 */
export interface QuizResult {
  questionId: string;
  isCorrect: boolean;
  correctAnswer: string;
  userAnswer: string;
  timeMs: number;
  explanation?: string;
}

/**
 * Quiz session summary
 */
export interface QuizSessionSummary {
  playId: string;
  questionsAttempted: number;
  questionsCorrect: number;
  accuracy: number;
  avgTimeMs: number;
  categoryBreakdown: Record<FlashcardCategory, { correct: number; total: number }>;
  xpEarned: number;
}

// ───────────────────────────────────────────────────────────────────────────────────────────
// API REQUEST/RESPONSE TYPES
// ───────────────────────────────────────────────────────────────────────────────────────────

/**
 * Get plays response
 */
export interface GetPlaysResponse {
  plays: PlaybookPlay[];
  progress: Record<string, PlayerPlayProgress>;
  install: Install;
  aiRecommendations: AIPlaybookAnalysis;
}

/**
 * Log rep request
 */
export interface LogRepRequest {
  playId: string;
  repType: "mental" | "physical" | "walkthrough";
  notes?: string;
}

/**
 * Submit quiz request
 */
export interface SubmitQuizRequest {
  playId: string;
  answers: QuizAnswer[];
}

/**
 * Submit quiz response
 */
export interface SubmitQuizResponse {
  results: QuizResult[];
  summary: QuizSessionSummary;
  updatedProgress: PlayerPlayProgress;
}

/**
 * Get due flashcards response
 */
export interface GetDueFlashcardsResponse {
  cards: PlaybookFlashcard[];
  totalDue: number;
  byCategory: Record<FlashcardCategory, number>;
}

/**
 * Submit flashcard session request
 */
export interface SubmitFlashcardSessionRequest {
  results: FlashcardStudyResult[];
}

/**
 * Submit flashcard session response
 */
export interface SubmitFlashcardSessionResponse {
  cardsStudied: number;
  cardsCorrect: number;
  xpEarned: number;
  streakBonus: number;
  nextDueCards: number;
}

/**
 * Update install request
 */
export interface UpdateInstallRequest {
  weekNumber: number;
  weekLabel: string;
  playIds: string[];
  emphasisPlayIds: string[];
  repTargets: RepTargets;
  coachNotes?: string;
  focusAreas?: string[];
}

/**
 * Set emphasis request
 */
export interface SetEmphasisRequest {
  playId: string;
  isEmphasis: boolean;
  reason?: string;
}

/**
 * Get mastery heatmap response
 */
export interface GetMasteryHeatmapResponse {
  heatmap: MasteryHeatmap;
  alerts: CoachAlert[];
}

// ───────────────────────────────────────────────────────────────────────────────────────────
// CONSTANTS
// ───────────────────────────────────────────────────────────────────────────────────────────

/**
 * Mastery level thresholds
 */
export const MASTERY_THRESHOLDS = {
  NEW: { min: 0, max: 20 },
  LEARNING: { min: 21, max: 50 },
  PROFICIENT: { min: 51, max: 80 },
  MASTERED: { min: 81, max: 100 },
} as const;

/**
 * Spaced repetition intervals (in days)
 */
export const SPACED_REPETITION_INTERVALS = {
  INITIAL: 1,
  SECOND: 3,
  THIRD: 7,
  FOURTH: 14,
  MULTIPLIER: 2.0,
} as const;

/**
 * Rep target defaults
 */
export const DEFAULT_REP_TARGETS = {
  NEW_PLAY: 10,
  EMPHASIS_PLAY: 15,
  STANDARD_PLAY: 8,
  MAINTENANCE: 5,
} as const;

/**
 * Quiz scoring thresholds
 */
export const QUIZ_THRESHOLDS = {
  PASSING_ACCURACY: 70,
  MASTERY_ACCURACY: 85,
  FAST_RESPONSE_MS: 5000,
  SLOW_RESPONSE_MS: 15000,
} as const;

/**
 * Category weights for mastery calculation
 */
export const MASTERY_WEIGHTS = {
  quizAccuracy: 0.40,
  repCompletion: 0.25,
  categoryBalance: 0.20,
  recency: 0.15,
} as const;




