# Activity-Based Learning System

## Overview

Replace the flashcard-based quiz system with an activity-based learning system similar to the games page. Each activity type provides a different interactive learning experience using the AI-generated questions.

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    COACH: CREATE ACTIVITIES                  │
├─────────────────────────────────────────────────────────────┤
│  1. Select plays (from playbook)                            │
│  2. Choose activity type:                                   │
│     • Quick Quiz (multiple choice)                          │
│     • True/False Challenge                                  │
│     • Scenario Decision Maker                               │
│     • Coverage Recognition                                  │
│     • Mixed Review (all types)                              │
│  3. Filter questions:                                       │
│     • By difficulty (beginner/intermediate/advanced)        │
│     • By topic (coverage, routes, blocking, etc.)           │
│     • By position (QB, RB, WR, etc.)                        │
│  4. Set parameters:                                         │
│     • Time limit (optional)                                 │
│     • Passing score (e.g., 80%)                             │
│     • Number of questions (or "all")                        │
│  5. Assign to:                                              │
│     • Specific players                                      │
│     • Positions (all WRs, all QBs, etc.)                    │
│     • Entire team                                           │
│  6. Set due date                                            │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                   DATABASE: ACTIVITIES TABLE                 │
├─────────────────────────────────────────────────────────────┤
│  • activity_id                                              │
│  • activity_type (quick_quiz, true_false, scenario, etc.)   │
│  • title (e.g., "Week 3 Pass Game Quiz")                    │
│  • play_ids[] (array of plays included)                     │
│  • question_filters (difficulty, topic, position)           │
│  • settings (time_limit, passing_score, question_count)     │
│  • assigned_to (user_ids or position groups)                │
│  • due_date                                                  │
│  • created_by (coach)                                        │
│  • status (draft, active, completed, archived)              │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                  PLAYER: MY ACTIVITIES PAGE                  │
├─────────────────────────────────────────────────────────────┤
│  Similar to Games page with activity cards showing:         │
│  • Activity type icon and color                             │
│  • Title and description                                    │
│  • Progress (e.g., "5/10 complete")                         │
│  • Score (if completed)                                     │
│  • Due date                                                  │
│  • Status badge (TODO, IN PROGRESS, COMPLETED)              │
│                                                              │
│  Click activity → Launch activity mode                      │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    ACTIVITY GAME MODES                       │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  1. QUICK QUIZ (multiple_choice questions)                  │
│     • Show question                                         │
│     • 4 answer options                                      │
│     • Click to answer                                       │
│     • Instant feedback (correct/incorrect)                  │
│     • Show explanation                                      │
│     • Progress bar (Question 3/10)                          │
│     • Timer (if enabled)                                    │
│                                                              │
│  2. TRUE/FALSE CHALLENGE (true_false questions)             │
│     • Show statement                                        │
│     • Two big buttons: TRUE | FALSE                         │
│     • Swipe gestures for mobile                             │
│     • Streak counter                                        │
│     • Fast-paced (30s per question)                         │
│                                                              │
│  3. SCENARIO DECISION MAKER (scenario questions)            │
│     • Show game situation (down, distance, coverage)        │
│     • Show play diagram or situation                        │
│     • "What would you do?"                                  │
│     • Multiple choice or decision tree                      │
│     • Detailed explanation of why answer is correct         │
│                                                              │
│  4. COVERAGE RECOGNITION (identification questions)         │
│     • Show pre-snap alignment                               │
│     • Identify coverage from description                    │
│     • Visual elements (formation diagrams)                  │
│     • Learn mode: hints available                           │
│                                                              │
│  5. MIXED REVIEW (all question types)                       │
│     • Random mix of all question types                      │
│     • Keeps things interesting                              │
│     • Best for comprehensive review                         │
│                                                              │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│               RESULTS & ANALYTICS                            │
├─────────────────────────────────────────────────────────────┤
│  After completion:                                           │
│  • Final score (85%)                                         │
│  • Time taken                                                │
│  • Breakdown by topic (Coverage: 4/5, Routes: 6/8)          │
│  • Questions missed (review them)                           │
│  • Comparison to team average                               │
│  • XP earned                                                 │
│  • Streak status                                             │
│                                                              │
│  Coach can see:                                              │
│  • Player completion rates                                   │
│  • Average scores by player                                  │
│  • Common missed questions                                   │
│  • Time spent per player                                     │
└─────────────────────────────────────────────────────────────┘
```

## Database Schema

### New Tables

```sql
-- Activities (coach creates these)
CREATE TABLE activities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID NOT NULL REFERENCES organizations(id),
  team_id UUID REFERENCES teams(id),

  -- Activity details
  activity_type activity_type NOT NULL, -- enum: quick_quiz, true_false, scenario, coverage_id, mixed
  title VARCHAR(255) NOT NULL,
  description TEXT,

  -- Content
  play_ids UUID[] NOT NULL, -- Array of play IDs included in this activity
  question_filters JSONB DEFAULT '{}', -- {difficulty: ['intermediate', 'advanced'], topic: ['coverage_recognition'], position: ['QB', 'WR']}

  -- Settings
  time_limit_seconds INTEGER, -- NULL = no time limit
  passing_score_percent INTEGER DEFAULT 80,
  question_count INTEGER, -- NULL = use all matching questions
  show_explanations BOOLEAN DEFAULT true,
  allow_retakes BOOLEAN DEFAULT true,

  -- Assignment
  created_by UUID NOT NULL REFERENCES users(id),
  assigned_to JSONB NOT NULL, -- {type: 'positions', values: ['QB', 'WR']} or {type: 'users', values: [uuid1, uuid2]}
  due_date TIMESTAMPTZ,

  -- Status
  status VARCHAR(20) DEFAULT 'active', -- draft, active, completed, archived
  is_active BOOLEAN DEFAULT true,

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Player activity attempts
CREATE TABLE activity_attempts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  activity_id UUID NOT NULL REFERENCES activities(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  org_id UUID NOT NULL REFERENCES organizations(id),

  -- Attempt details
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  time_spent_seconds INTEGER,

  -- Results
  total_questions INTEGER NOT NULL,
  correct_answers INTEGER DEFAULT 0,
  score_percent DECIMAL(5,2),
  passed BOOLEAN,

  -- Question-level results
  question_results JSONB DEFAULT '[]', -- [{question_id, correct, time_spent, answer_given}]

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Activity type enum
CREATE TYPE activity_type AS ENUM (
  'quick_quiz',        -- Multiple choice questions
  'true_false',        -- True/false challenge
  'scenario',          -- Scenario-based decisions
  'coverage_id',       -- Coverage recognition
  'route_id',          -- Route identification
  'mixed'              -- Mix of all types
);

-- Indexes
CREATE INDEX idx_activities_org_id ON activities(org_id);
CREATE INDEX idx_activities_team_id ON activities(team_id);
CREATE INDEX idx_activities_status ON activities(status);
CREATE INDEX idx_activities_due_date ON activities(due_date);
CREATE INDEX idx_activity_attempts_user_id ON activity_attempts(user_id);
CREATE INDEX idx_activity_attempts_activity_id ON activity_attempts(activity_id);
```

## UI Component Structure

```
/app
├── coach/
│   └── activities/
│       ├── page.tsx                    # List of created activities
│       ├── create/page.tsx             # Create new activity wizard
│       └── [id]/
│           ├── page.tsx                # View activity details & analytics
│           └── edit/page.tsx           # Edit activity
│
└── activities/                         # Player-facing
    ├── page.tsx                        # My Activities (like Games page)
    └── [id]/
        ├── page.tsx                    # Activity detail/start screen
        └── play/page.tsx               # Activity game mode

/components/activities/
├── ActivityCard.tsx                    # Card in activities list
├── ActivityWizard.tsx                  # Coach: create activity flow
├── QuickQuizMode.tsx                   # Game mode: multiple choice
├── TrueFalseMode.tsx                   # Game mode: true/false
├── ScenarioMode.tsx                    # Game mode: scenarios
├── CoverageIdMode.tsx                  # Game mode: coverage ID
└── ActivityResults.tsx                 # Results screen after completion
```

## Migration Path

### Phase 1: Database Setup
1. Create new tables (activities, activity_attempts)
2. Keep existing flashcard_templates as question source
3. No changes to existing question generation

### Phase 2: Coach UI
1. Create `/coach/activities` page
2. Build activity creation wizard
3. Allow assigning activities to players

### Phase 3: Player UI
1. Create `/activities` page (similar to games)
2. Build activity game modes (start with quick_quiz)
3. Results screen

### Phase 4: Deprecation
1. Mark old quiz-cards as deprecated
2. Migrate any existing usage
3. Keep flashcard_templates as question storage

## Benefits

✅ **Better UX**: Game-like interface is more engaging than flip cards
✅ **Flexible**: Different activity types for different learning styles
✅ **Trackable**: Proper completion and scoring system
✅ **Scalable**: Easy to add new activity types
✅ **Coach-Friendly**: Simple assignment workflow
✅ **Data-Driven**: Rich analytics on player performance

## Next Steps

1. Create database migration for new tables
2. Build coach activity creation UI
3. Build player activities page (like games)
4. Implement quick_quiz game mode first
5. Add other game modes incrementally
