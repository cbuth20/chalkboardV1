/**
 * TypeScript types for Activity-Based Learning System
 */

export type ActivityType =
  | 'quick_quiz'        // Multiple choice questions
  | 'true_false'        // True/false challenge
  | 'scenario'          // Scenario-based decisions
  | 'coverage_id'       // Coverage recognition
  | 'route_id'          // Route identification
  | 'mixed';            // Mix of all types

export type ActivityStatus = 'draft' | 'active' | 'completed' | 'archived';

export type AssignmentType = 'positions' | 'users' | 'team';

export interface AssignedTo {
  type: AssignmentType;
  values: string[]; // position names or user UUIDs or empty array for team
}

export interface QuestionFilters {
  difficulty?: string[]; // e.g., ['beginner', 'intermediate']
  topics?: string[];     // e.g., ['coverage_recognition', 'route_running']
  positions?: string[];  // e.g., ['QB', 'WR']
}

export interface Activity {
  id: string;
  org_id: string;
  team_id: string | null;

  // Activity details
  activity_type: ActivityType;
  title: string;
  description: string | null;

  // Content
  play_ids: string[];
  question_filters: QuestionFilters;

  // Settings
  time_limit_seconds: number | null;
  passing_score_percent: number;
  question_count: number | null;
  show_explanations: boolean;
  allow_retakes: boolean;
  randomize_questions: boolean;
  randomize_options: boolean;

  // Assignment
  created_by: string;
  assigned_to: AssignedTo;
  due_date: string | null;

  // Status
  status: ActivityStatus;
  is_active: boolean;

  // Metadata
  created_at: string;
  updated_at: string;
}

export interface QuestionResult {
  question_id: string;
  flashcard_id: string;
  correct: boolean;
  time_spent: number; // seconds
  answer_given: string;
  correct_answer: string;
}

export interface ActivityAttempt {
  id: string;
  activity_id: string;
  user_id: string;
  org_id: string;

  // Attempt details
  attempt_number: number;
  started_at: string;
  completed_at: string | null;
  time_spent_seconds: number | null;

  // Results
  total_questions: number;
  correct_answers: number;
  score_percent: number | null;
  passed: boolean | null;

  // Question-level results
  question_results: QuestionResult[];

  // Metadata
  created_at: string;
}

// View types
export interface ActivityStats {
  activity_id: string;
  title: string;
  activity_type: ActivityType;
  org_id: string;
  team_id: string | null;
  due_date: string | null;
  status: ActivityStatus;
  total_assigned_users: number;
  completed_users: number;
  avg_score: number | null;
  avg_time_seconds: number | null;
  total_attempts: number;
}

export interface PlayerActivityProgress {
  user_id: string;
  activity_id: string;
  title: string;
  activity_type: ActivityType;
  description: string | null;
  due_date: string | null;
  passing_score_percent: number;
  allow_retakes: boolean;
  attempts_taken: number;
  best_score: number | null;
  last_completed_at: string | null;
  ever_passed: boolean;
  latest_attempt_number: number;
}

// UI-specific types
export interface ActivityCardData {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  icon: string;
  color: string;
  activity_type: ActivityType;
  due_date: string | null;
  status: 'todo' | 'in_progress' | 'completed' | 'overdue';
  progress?: {
    current: number;
    total: number;
  };
  score?: number;
  attempts: number;
  passed: boolean;
}

// Activity creation wizard
export interface ActivityFormData {
  title: string;
  description: string;
  activity_type: ActivityType;
  play_ids: string[];
  question_filters: QuestionFilters;
  time_limit_seconds: number | null;
  passing_score_percent: number;
  question_count: number | null;
  show_explanations: boolean;
  allow_retakes: boolean;
  randomize_questions: boolean;
  randomize_options: boolean;
  assigned_to: AssignedTo;
  due_date: string | null;
}

// Activity metadata for the games-style cards
export interface ActivityMetadata {
  quick_quiz: {
    title: 'QUICK QUIZ';
    subtitle: 'Multiple Choice';
    icon: 'clipboard';
    color: 'teal';
    description: 'Test your knowledge with multiple choice questions';
  };
  true_false: {
    title: 'TRUE/FALSE';
    subtitle: 'Speed Challenge';
    icon: 'check';
    color: 'orange';
    description: 'Quick true or false statements - build your streak!';
  };
  scenario: {
    title: 'SCENARIO';
    subtitle: 'Game Situations';
    icon: 'play';
    color: 'ice';
    description: 'Make the right call in game-like scenarios';
  };
  coverage_id: {
    title: 'COVERAGE ID';
    subtitle: 'Recognition Test';
    icon: 'shield';
    color: 'purple';
    description: 'Identify defensive coverages from pre-snap looks';
  };
  route_id: {
    title: 'ROUTE ID';
    subtitle: 'Pattern Recognition';
    icon: 'route';
    color: 'gold';
    description: 'Recognize route concepts and combinations';
  };
  mixed: {
    title: 'MIXED REVIEW';
    subtitle: 'All Question Types';
    icon: 'star';
    color: 'cyan';
    description: 'Comprehensive review with all question types';
  };
}
