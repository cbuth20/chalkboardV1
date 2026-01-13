// ═══════════════════════════════════════════════════════════════════════════
// CHALK TALK TYPES — Type definitions for the Chalk Talk system
// ═══════════════════════════════════════════════════════════════════════════

import type { CoverageId, CoverageShell } from "@/types/football";
import type { FormationId, Formation } from "@/types/football";
import type { RouteId, Route, ConceptId, RouteConcept, ProtectionId, Protection } from "@/types/football";

// ═══════════════════════════════════════════════════════════════════════════
// COACH MODES & PERSONAS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Different modes Chalk Talk can operate in
 */
export type CoachMode = 
  | "teach"    // Teaching/explaining concepts
  | "quiz"     // Quizzing and testing knowledge
  | "film"     // Breaking down film/video
  | "draw"     // Drawing plays and diagrams
  | "assist"   // Helping during games
  | "analyze"; // Analyzing plays/coverages

/**
 * Coach persona determines communication style
 */
export type CoachPersona = 
  | "position-coach"  // Direct, specific, drill-focused
  | "coordinator"     // Strategic, big-picture
  | "head-coach"      // Motivational, leadership
  | "analyst";        // Technical, data-driven

// ═══════════════════════════════════════════════════════════════════════════
// MESSAGE TYPES
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Supported message content types
 */
export type MessageContentType = 
  | "text"
  | "diagram"
  | "flashcard"
  | "quiz"
  | "film-timestamp"
  | "play-breakdown"
  | "correction"
  | "suggestion";

/**
 * Diagram data for rendered play diagrams
 */
export interface DiagramData {
  type: "formation" | "coverage" | "route" | "blitz" | "full-play";
  formationId?: FormationId;
  coverageId?: CoverageId;
  routes?: RouteId[];
  concept?: ConceptId;
  protection?: ProtectionId;
  annotations?: string[];
}

/**
 * Flashcard data for study cards
 */
export interface FlashcardData {
  id: string;
  front: string;
  back: string;
  category: "coverage" | "route" | "formation" | "protection" | "concept";
  difficulty: "beginner" | "intermediate" | "advanced";
  hint?: string;
}

/**
 * Quiz question data
 */
export interface QuizData {
  id: string;
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
  diagram?: DiagramData;
  category: string;
  difficulty: "beginner" | "intermediate" | "advanced";
}

/**
 * Film timestamp reference
 */
export interface FilmTimestamp {
  videoId: string;
  startTime: number;
  endTime?: number;
  label: string;
  tags: string[];
}

/**
 * Play breakdown analysis
 */
export interface PlayBreakdown {
  coverage: CoverageId;
  formation: FormationId;
  concept?: ConceptId;
  protection?: ProtectionId;
  presnap: string[];
  postsnap: string[];
  coachingNotes: string[];
}

/**
 * Message content block
 */
export interface MessageContent {
  type: MessageContentType;
  text?: string;
  diagram?: DiagramData;
  flashcard?: FlashcardData;
  quiz?: QuizData;
  filmTimestamp?: FilmTimestamp;
  playBreakdown?: PlayBreakdown;
  isExpandable?: boolean;
  isExpanded?: boolean;
}

/**
 * Chat message structure
 */
export interface CoachMessage {
  id: string;
  role: "coach" | "user" | "system";
  content: MessageContent[];
  timestamp: Date;
  mode?: CoachMode;
  isProcessing?: boolean;
  suggestedActions?: SuggestedAction[];
}

/**
 * Suggested follow-up actions
 */
export interface SuggestedAction {
  id: string;
  label: string;
  action: "ask" | "diagram" | "quiz" | "simplify" | "film" | "next";
  payload?: unknown;
}

// ═══════════════════════════════════════════════════════════════════════════
// COACH STATE & CONTEXT
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Current context the coach is operating in
 */
export interface CoachContext {
  module: "playbook" | "film-room" | "games" | "assignments" | "installs" | "general";
  currentTopic?: string;
  currentPlay?: string;
  currentCoverage?: CoverageId;
  currentFormation?: FormationId;
  studentPosition?: string;
  difficultyLevel: "beginner" | "intermediate" | "advanced";
}

/**
 * Coach session state
 */
export interface CoachSession {
  id: string;
  messages: CoachMessage[];
  context: CoachContext;
  mode: CoachMode;
  persona: CoachPersona;
  startedAt: Date;
  isDrawerOpen: boolean;
  isFullPage: boolean;
}

/**
 * User response for grading
 */
export interface UserResponse {
  questionId: string;
  answer: string | number;
  timeSpent: number;
  attemptNumber: number;
}

/**
 * Graded response result
 */
export interface GradedResponse {
  isCorrect: boolean;
  score: number;
  maxScore: number;
  feedback: string;
  correction?: string;
  coachingNote?: string;
  nextSteps?: SuggestedAction[];
}

// ═══════════════════════════════════════════════════════════════════════════
// FUNCTION PARAMETERS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Parameters for ExplainConcept function
 */
export interface ExplainConceptParams {
  concept: string;
  depth: "simple" | "standard" | "advanced";
  includeVisual?: boolean;
  relatedTo?: string;
}

/**
 * Parameters for DrawPlay function
 */
export interface DrawPlayParams {
  formation?: FormationId;
  coverage?: CoverageId;
  concept?: ConceptId;
  routes?: RouteId[];
  protection?: ProtectionId;
  annotations?: string[];
}

/**
 * Parameters for AnalyzeCoverage function
 */
export interface AnalyzeCoverageParams {
  imageUrl?: string;
  description?: string;
  presnap?: {
    safetyAlignment: "single-high" | "two-high" | "zero-high";
    cornerTechnique: "press" | "off" | "bail";
    linebackerDepth: "shallow" | "normal" | "deep";
  };
}

/**
 * Parameters for RouteTeach function
 */
export interface RouteTeachParams {
  routeId: RouteId;
  includeVariations?: boolean;
  position?: "x" | "z" | "slot" | "te" | "rb";
  vsDefender?: "press" | "off" | "zone";
}

/**
 * Parameters for GameAssist function
 */
export interface GameAssistParams {
  gameName: string;
  currentQuestion?: unknown;
  userAnswer?: unknown;
  needsHint?: boolean;
  needsExplanation?: boolean;
}

/**
 * Parameters for InstallTeaching function
 */
export interface InstallTeachParams {
  installSection: string;
  position: string;
  weekNumber?: number;
  includeReps?: boolean;
}

// ═══════════════════════════════════════════════════════════════════════════
// EXPORTS
// ═══════════════════════════════════════════════════════════════════════════

export type {
  CoverageId,
  CoverageShell,
  FormationId,
  Formation,
  RouteId,
  Route,
  ConceptId,
  RouteConcept,
  ProtectionId,
  Protection,
};

