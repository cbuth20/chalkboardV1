# PLAYBOOK WORKFLOW & FUNCTIONALITY SPECIFICATION

> **Version:** 1.0  
> **Last Updated:** December 2024  
> **Status:** Specification Draft  

This document defines the product logic, user flows, coaching intelligence, and functional behavior of the Chalkboard Playbook feature. It focuses on **functionality, data structures, and interactions**—not visual design.

---

## Table of Contents

1. [Core Purpose](#1-core-purpose)
2. [Data Models](#2-data-models)
3. [Play Card Content Logic](#3-play-card-content-logic)
4. [Category & Status Logic](#4-category--status-logic)
5. [AI Coach Behavior](#5-ai-coach-behavior)
6. [Flashcards Workflow](#6-flashcards-workflow)
7. [Player Workflow](#7-player-workflow)
8. [Coach Workflow](#8-coach-workflow)
9. [Intelligence Layer](#9-intelligence-layer)
10. [API Contracts](#10-api-contracts)
11. [Integration Points](#11-integration-points)

---

## 1. Core Purpose

The Playbook system is the **central knowledge hub** for a player's football education. It:

- **Teaches concepts** through structured breakdowns and AI explanations
- **Tracks mastery** via rep counting, quiz accuracy, and time-based review
- **Surfaces assignments** with position-specific focus
- **Shows coverage adjustments** so players know how plays adapt
- **Provides coaching points** from the team's actual coaches
- **Recommends study paths** based on performance and schedule

### Design Principles

1. **Position-First**: Every interaction is filtered through the player's position
2. **Install-Aware**: Plays are organized by week/install schedule
3. **Spaced Repetition**: Mastered plays resurface at optimal intervals
4. **Coach-Controlled**: Coaches set emphasis, rep targets, and install schedules
5. **AI-Assisted**: AI Coach helps explain, quiz, and identify weaknesses

---

## 2. Data Models

### 2.1 PlaybookPlay

The core unit of the playbook system.

```typescript
interface PlaybookPlay {
  id: string;
  teamId: string;
  
  // Identity
  name: string;                    // "Gun Trips RPO Glance"
  shortName: string;               // "Glance RPO"
  formationId: FormationId;        // Reference to formation
  playType: PlayType;              // "PASS" | "RUN" | "RPO" | "SCREEN" | "TRICK" | "SPECIAL"
  concept: string;                 // "Glance RPO" | "Mesh" | "Split Zone"
  
  // Personnel & Tags
  personnel: string;               // "11" | "12" | "21" | "10"
  tags: string[];                  // ["RED_ZONE", "GOAL_LINE", "3RD_DOWN"]
  situationalTags: string[];       // ["2-MIN", "BACKED_UP", "PLUS_TERRITORY"]
  
  // Install Schedule
  installWeek: number;             // Week this play is introduced
  installDate: string;             // ISO date when added to active playbook
  isActive: boolean;               // Currently in active install
  
  // Position Assignments (detailed breakdowns)
  assignments: PlayAssignment[];
  
  // Coaching Content
  coachingPoints: string[];        // 3-5 key coaching rules
  coverageAdjustments: CoverageAdjustment[];
  motionTimeline?: MotionStep[];
  
  // Metadata
  createdAt: string;
  updatedAt: string;
  createdBy: string;               // Coach who added it
  
  // Diagram Reference
  diagramType: "pass" | "run";
  diagramData?: DiagramData;       // For visual rendering
}
```

### 2.2 PlayAssignment

Position-specific assignment within a play.

```typescript
interface PlayAssignment {
  position: SkillPosition;         // "QB" | "RB" | "X" | "Z" | "H" | "Y" | "TE"
  
  // Core Assignment Fields (quizzable)
  alignment: string;               // "Shotgun, 5 yards deep"
  splitDepth?: string;             // "3x1 outside numbers"
  landmark: string;                // "Eyes on Mike LB"
  firstStep: string;               // "Open step to playside"
  assignment: string;              // "Quick game progression: Mesh → Corner → Check"
  readProgression?: string[];      // ["1. Mesh crosser", "2. Corner route", "3. RB check"]
  runTrack?: string;               // For RBs: "Zone track - press the A-gap"
  
  // Route Info (for pass plays)
  routeId?: RouteId;
  routeDepth?: number;
  routeLandmarks?: string;         // "Opposite hash at 6 yards"
  
  // Motion (if applicable)
  motion?: {
    type: "jet" | "orbit" | "shift" | "trade";
    timing: "pre" | "on" | "post";
    path: string;
  };
  
  // Coverage Adjustments
  adjustments: {
    vsMan: string;
    vsZone: string;
    vsCover2?: string;
    vsCover3?: string;
    vsCover4?: string;
    vsBlitz?: string;
    vsFireZone?: string;
  };
  
  // Key Read
  read: string;                    // What to look for pre/post snap
}
```

### 2.3 PlayerPlayProgress

Tracks individual player progress on each play.

```typescript
interface PlayerPlayProgress {
  id: string;
  userId: string;
  teamId: string;
  playId: string;
  position: SkillPosition;         // The position they're studying
  
  // Rep Tracking
  repsCompleted: number;           // Mental reps logged
  repsTarget: number;              // Assigned by coach or AI
  physicalReps: number;            // Reps logged from practice
  
  // Mastery Metrics
  masteryScore: number;            // 0-100
  masteryLevel: MasteryLevel;      // "new" | "learning" | "proficient" | "mastered"
  
  // Quiz Performance
  quizAttempts: number;
  quizCorrect: number;
  quizAccuracy: number;            // 0-100
  avgResponseTimeMs: number;
  
  // Category Breakdown
  categoryScores: {
    alignment: number;             // 0-100
    landmark: number;
    assignment: number;
    read: number;
    adjustment: number;
  };
  
  // Spaced Repetition
  lastStudied: string;             // ISO timestamp
  nextDueDate: string;             // When to review again
  easeFactor: number;              // SM-2 algorithm ease factor
  interval: number;                // Days until next review
  
  // Status Flags
  isStarred: boolean;              // Player marked as favorite
  isEmphasis: boolean;             // Coach marked as emphasis
  needsReview: boolean;            // Flagged for review
  
  // History
  studyHistory: StudySession[];
}

type MasteryLevel = "new" | "learning" | "proficient" | "mastered";

interface StudySession {
  timestamp: string;
  type: "quiz" | "flashcard" | "review" | "rep";
  score?: number;
  duration: number;                // seconds
  questionsAttempted?: number;
  questionsCorrect?: number;
}
```

### 2.4 Install

Weekly install schedule managed by coaches.

```typescript
interface Install {
  id: string;
  teamId: string;
  
  // Schedule
  weekNumber: number;
  weekLabel: string;               // "Week 4: Red Zone RPO"
  startDate: string;
  endDate: string;
  
  // Content
  playIds: string[];               // Plays in this install
  emphasisPlayIds: string[];       // Highlighted plays
  
  // Player Targets
  repTargets: {
    default: number;               // Default reps for all players
    byPosition: Record<SkillPosition, number>;
    byPlayId: Record<string, number>;
  };
  
  // Status
  status: "upcoming" | "active" | "completed";
  
  // Notes
  coachNotes: string;
  focusAreas: string[];
}
```

---

## 3. Play Card Content Logic

### 3.1 Assignments Breakdown

Each play automatically breaks down assignments by position group:

#### Receiver Positions (X, Z, H, Y)
| Field | Description | Example |
|-------|-------------|---------|
| Alignment | Formation spot | "#2 to trips, 1 yard inside Z" |
| Split/Depth | Distance from formation | "On numbers, 1 yard off ball" |
| Route | Assigned route | "Shallow cross at 6 yards" |
| Landmarks | Aiming points | "Opposite numbers" |
| Read | Coverage key | "Find window in zone, settle vs man" |
| Adjustments | Coverage-specific changes | "vs Man: Rub off Y's cross" |

#### Running Back
| Field | Description | Example |
|-------|-------------|---------|
| Alignment | Backfield position | "Offset left, 1 yard behind QB" |
| First Step | Initial movement | "Zone step playside" |
| Track | Run path | "Press A-gap, read first DL" |
| Landmark | Aiming point | "Playside guard's hip" |
| Pass Responsibility | Protection assignment | "Check release to flat" |
| Adjustments | Situational rules | "vs Blitz: Block first threat" |

#### Quarterback
| Field | Description | Example |
|-------|-------------|---------|
| Alignment | Pre-snap depth | "Shotgun, 5 yards deep" |
| Progression | Read order | "1. Mesh → 2. Corner → 3. Check" |
| Key | Primary read | "Mike LB movement" |
| Hot Read | Blitz adjustment | "Hot to first crosser" |
| Run Read (RPO) | Give/pull key | "Read conflict defender" |

#### Tight End
| Field | Description | Example |
|-------|-------------|---------|
| Alignment | Inline or detached | "Inline, tight" |
| Route/Block | Assignment | "Zone combo to LB" |
| Release | If passing | "Chip DE, release flat" |
| Adjustments | Coverage rules | "vs Man: Win inside" |

### 3.2 Coaching Points

Each play contains 3-5 coaching rules. These are:

1. **Position-Agnostic Truths** - Rules everyone must know
2. **Timing-Based** - Sequence and tempo reminders
3. **Read-Based** - What to look for pre/post snap
4. **Common Mistake Corrections** - What NOT to do
5. **Success Indicators** - When you've done it right

**Example for Mesh Concept:**
```
1. "Shallow crosses must mesh TIGHT—within 1 yard of each other"
2. "Outside receivers: Your job is to CLEAR, not catch the ball"
3. "QB: If Mike jumps the mesh, go corner immediately"
4. "Common mistake: Crossers running too deep—stay at 5-6 yards"
5. "Success: You've created a rub and one crosser is wide open"
```

### 3.3 Coverage Adjustments

Each play defines behavior vs common coverages:

```typescript
interface CoverageAdjustment {
  coverageId: CoverageId;          // "cover-2" | "cover-3" | "man" | etc.
  
  // Overall Play Adjustment
  playAdjustment: string;          // "Work the seams—Cover 2 is weak there"
  
  // Position-Specific Changes
  positionAdjustments: {
    position: SkillPosition;
    adjustment: string;
    reason: string;
  }[];
  
  // Key Read for This Coverage
  coverageKey: string;             // "Corner sinks with #1 = Cover 2"
  
  // Confidence Level
  effectiveness: "excellent" | "good" | "neutral" | "poor";
}
```

**Example Adjustments:**

| Coverage | Adjustment | Why |
|----------|------------|-----|
| Cover 2 | Hit the seam between corner and safety | Corners squat, hole opens |
| Cover 3 | Flood concept—3v2 to one side | Only 4 underneath defenders |
| Man | Use picks and rubs; mesh is money | DBs trail, can't fight through traffic |
| Blitz | Hot to first crosser | Get ball out quick before pressure arrives |
| Fire Zone | Identify 3-deep shell; work hot | 3 rush, 3 deep—find the soft spot |

### 3.4 Motion/Shift Timeline

For plays with pre-snap movement:

```typescript
interface MotionStep {
  step: number;                    // 1, 2, 3...
  timing: "pre-huddle" | "at-line" | "on-cadence" | "on-snap";
  description: string;
  involvedPositions: SkillPosition[];
}
```

**Example Timeline:**
```
1. [at-line] H aligns as #3 in trips
2. [on-cadence] H motions across formation (jet motion)
3. [on-snap] Ball snapped as H crosses center
4. [post-snap] H continues for handoff or bubble option
```

### 3.5 Rep Tracking Logic

**Incrementing Reps:**
- Player taps ➕ button → `repsCompleted` increments by 1
- Physical rep logged from practice integration → `physicalReps` increments

**Progress Calculation:**
```typescript
function calculateRepProgress(progress: PlayerPlayProgress): number {
  const mentalWeight = 0.7;
  const physicalWeight = 0.3;
  
  const mentalProgress = Math.min(progress.repsCompleted / progress.repsTarget, 1);
  const physicalProgress = Math.min(progress.physicalReps / Math.max(progress.repsTarget * 0.5, 3), 1);
  
  return (mentalProgress * mentalWeight + physicalProgress * physicalWeight) * 100;
}
```

**Dynamic Target Adjustment:**
AI adjusts `repsTarget` based on:
- Quiz performance (low accuracy → more reps needed)
- Time since last study (long gap → refresh reps)
- Play importance (emphasis plays → higher baseline)
- Player history (struggling learner → more scaffolding)

---

## 4. Category & Status Logic

### 4.1 Play Categories

Plays are automatically organized by `playType`:

| Category | Play Types | Description |
|----------|------------|-------------|
| RPO | `RPO` | Run-pass options with read keys |
| Pass Concepts | `PASS` | Drop-back passes, quick game |
| Run Game | `RUN` | Inside zone, power, counter |
| Screens | `SCREEN` | WR screens, RB screens |
| Trick Plays | `TRICK` | Reverses, flea flickers |
| Special | `SPECIAL` | 2-minute, red zone specials |

### 4.2 Status Determination

Play status is calculated dynamically:

```typescript
function determinePlayStatus(
  play: PlaybookPlay,
  progress: PlayerPlayProgress,
  install: Install
): PlayStatus {
  // NEW: Recently added or never studied
  if (progress.masteryLevel === "new" || progress.repsCompleted === 0) {
    const daysSinceInstall = daysBetween(play.installDate, now());
    if (daysSinceInstall <= 7) return "NEW";
  }
  
  // DUE_TODAY: Spaced repetition says review now
  if (isToday(progress.nextDueDate) || isPast(progress.nextDueDate)) {
    return "DUE_TODAY";
  }
  
  // EMPHASIS: Coach flagged as priority
  if (progress.isEmphasis || install.emphasisPlayIds.includes(play.id)) {
    return "EMPHASIS";
  }
  
  // NEEDS_REPS: Behind on rep target
  const repProgress = progress.repsCompleted / progress.repsTarget;
  const weekProgress = getWeekProgress(install);
  if (repProgress < weekProgress - 0.2) {
    return "NEEDS_REPS";
  }
  
  // COMPLETED: Fully mastered for this install
  if (progress.masteryLevel === "mastered" && repProgress >= 1) {
    return "COMPLETED";
  }
  
  return "NORMAL";
}
```

### 4.3 Due Today Logic

Plays enter "Due Today" when:

1. **Spaced Repetition Schedule**: SM-2 algorithm determines next review date
2. **Install Requirement**: Current install has incomplete rep target
3. **Quiz Failure**: Recent quiz below 70% accuracy
4. **Coach Override**: Coach manually flags for review

```typescript
function calculateNextDueDate(progress: PlayerPlayProgress, wasCorrect: boolean): string {
  // SM-2 Spaced Repetition Algorithm
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
  
  return addDays(now(), interval);
}
```

### 4.4 Starred/Emphasis Behavior

| Status | Set By | Effect |
|--------|--------|--------|
| Starred | Player | Appears in "Favorites" filter; no learning impact |
| Emphasis | Coach | Higher rep target (+50%); appears in "Priority" section |

---

## 5. AI Coach Behavior

### 5.1 General Feedback Mode

When player opens AI Coach from playbook:

```typescript
interface AIPlaybookAnalysis {
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
```

**AI Response Pattern:**
```
🎯 Your Coverage ID skills are lagging behind your assignment knowledge.

Top 3 Plays to Study:
1. **Split Zone Bubble** — Your read key accuracy is 45%. Focus on conflict defender.
2. **Red Zone Mesh** — Due today, hasn't been reviewed in 5 days.
3. **Duo Read Lock** — New play this week, only 1 rep logged.

Why? Your RPO reads show hesitation. You're identifying the coverage correctly,
but your "give/pull" decision is slow. Let's drill conflict defenders.
```

### 5.2 Per-Play AI Breakdown

When player taps "AI Coach" on a specific play:

**Capabilities:**

1. **Explain Assignment** (by position)
```
"As the H receiver on Mesh, your job is the SHALLOW CROSS at 6 yards.
You're the 'over' crosser—meaning you go OVER the top of Y's route.
Mesh tight. If there's daylight between you and Y, the rub doesn't work."
```

2. **Quiz the Player** (dynamic generation)
```
Q: On Mesh Trips, what's your landmark if you're the H receiver?
A: Opposite numbers
B: Far hash
C: Back pylon
D: Sideline at 5 yards
```

3. **Identify Common Mistakes**
```
"Most players run the mesh too deep. Stay at 5-6 yards MAX.
If you drift to 8 yards, you're in the linebacker's zone and
the timing is off for the QB."
```

4. **Coverage-Specific Coaching**
```
"Against Cover 1, the safety is sitting in the middle. He's reading
the QB's eyes. You need to SPEED through the mesh and get separation
before he jumps your route. Don't throttle down."
```

5. **Defensive Identification Cues**
```
"Pre-snap tells for Cover 1:
• Single high safety at 12-15 yards
• Corners pressed with inside leverage
• LBs tracking RBs/TEs pre-snap
If you see this, expect man—the mesh should work."
```

### 5.3 Adaptive Learning

AI adjusts based on player performance:

```typescript
interface AdaptiveLearningRules {
  // When player struggles with a concept
  onRepeatedFailure: {
    threshold: number;             // 3 failures in a row
    action: "add_scaffolding";
    scaffolding: string[];         // ["Simplify", "Add drill", "Break into steps"]
  };
  
  // When player masters a concept
  onMastery: {
    threshold: number;             // 90%+ accuracy over 10+ questions
    action: "increase_difficulty";
    changes: string[];             // ["Add coverage variants", "Reduce time"]
  };
  
  // When player is coasting
  onCoasting: {
    threshold: number;             // 80%+ accuracy, no new challenges
    action: "introduce_complexity";
    additions: string[];           // ["New blitz looks", "Motion adjustments"]
  };
}
```

**Example Adaptations:**

| Trigger | AI Response |
|---------|-------------|
| 3 wrong answers on "alignment" questions | Add visual alignment drill with diagram |
| 90%+ on all mesh questions | Introduce "Mesh vs Fire Zone" variant |
| Player skipping Coverage ID games | Surface coverage ID flashcards in playbook |
| Slow response times (>10s) | Add timed quiz mode to build speed |

---

## 6. Flashcards Workflow

### 6.1 Flashcard Types

```typescript
type FlashcardCategory = 
  | "alignment"      // Where do you line up?
  | "assignment"     // What's your job?
  | "coverage"       // How does this change vs coverage X?
  | "motion"         // What's the motion timing?
  | "read"           // What are you reading?
  | "progression";   // What's your read order?

interface PlaybookFlashcard {
  id: string;
  playId: string;
  position: SkillPosition;
  category: FlashcardCategory;
  
  front: string;                   // Question
  back: string;                    // Answer
  hint?: string;                   // Optional help
  
  difficulty: "beginner" | "intermediate" | "advanced";
  
  // Spaced repetition data
  easeFactor: number;
  interval: number;
  dueDate: string;
  
  // Performance
  timesShown: number;
  timesCorrect: number;
}
```

### 6.2 Auto-Generated Flashcards

System generates flashcards from play assignments:

```typescript
function generateFlashcardsForPlay(
  play: PlaybookPlay,
  position: SkillPosition
): PlaybookFlashcard[] {
  const assignment = play.assignments.find(a => a.position === position);
  if (!assignment) return [];
  
  const cards: PlaybookFlashcard[] = [];
  
  // Alignment card
  cards.push({
    category: "alignment",
    front: `On ${play.name}, where do you align?`,
    back: assignment.alignment,
    difficulty: "beginner"
  });
  
  // Assignment card
  cards.push({
    category: "assignment",
    front: `What's your assignment on ${play.name}?`,
    back: assignment.assignment,
    hint: assignment.routeId ? `Hint: Think about your route` : undefined,
    difficulty: "beginner"
  });
  
  // Read card
  cards.push({
    category: "read",
    front: `What are you reading on ${play.name}?`,
    back: assignment.read,
    difficulty: "intermediate"
  });
  
  // Coverage adjustment cards (one per coverage)
  for (const [coverage, adjustment] of Object.entries(assignment.adjustments)) {
    if (adjustment) {
      cards.push({
        category: "coverage",
        front: `On ${play.name}, how do you adjust vs ${formatCoverage(coverage)}?`,
        back: adjustment,
        difficulty: "advanced"
      });
    }
  }
  
  // Motion card (if applicable)
  if (assignment.motion) {
    cards.push({
      category: "motion",
      front: `Describe the motion on ${play.name}`,
      back: `${assignment.motion.type} motion, ${assignment.motion.timing} snap: ${assignment.motion.path}`,
      difficulty: "intermediate"
    });
  }
  
  return cards;
}
```

### 6.3 Flashcard Study Flow

1. **Selection**: Player chooses play or study mode ("Due Cards" / "Weak Areas")
2. **Presentation**: Front of card shown
3. **Self-Assessment**: Player thinks, then taps to reveal answer
4. **Grading**: Player self-reports: "Got it" / "Needs work"
5. **Scheduling**: SM-2 algorithm updates next review date
6. **Continuation**: Next card shown until deck complete

**Study Session Rules:**
- Minimum 5 cards per session
- Maximum 25 cards per session (avoid fatigue)
- Mix categories to prevent pattern memorization
- Show hint after 10 seconds of inactivity (optional)

---

## 7. Player Workflow

### 7.1 Daily Study Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                     PLAYER DAILY WORKFLOW                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  1. ENTER PLAYBOOK                                               │
│     └─ App shows "Due Today" count badge                         │
│                                                                  │
│  2. VIEW DUE TODAY                                               │
│     └─ Plays sorted by: Emphasis > Due > New > Needs Reps        │
│     └─ Each card shows: Rep progress, mastery %, last studied    │
│                                                                  │
│  3. COMPLETE REPS/QUIZZES                                        │
│     └─ Tap play → View assignment → Tap ➕ to log rep            │
│     └─ Or: Tap "Quiz Me" → Answer 5-10 questions                 │
│     └─ Or: Tap "Flashcards" → Study deck                         │
│                                                                  │
│  4. STUDY AI SUGGESTIONS                                         │
│     └─ AI surfaces: "Focus on Split Zone—read key is weak"       │
│     └─ Player drills specific concept                            │
│                                                                  │
│  5. REVIEW TOMORROW'S INSTALL                                    │
│     └─ Preview plays being added next day                        │
│     └─ Watch install video (if available)                        │
│                                                                  │
│  6. LOG FLASHCARDS                                               │
│     └─ Quick 5-minute flashcard session                          │
│     └─ System adapts based on responses                          │
│                                                                  │
│  7. EXIT → AI UPDATES MASTERY                                    │
│     └─ Mastery scores recalculated                               │
│     └─ Due dates updated for spaced repetition                   │
│     └─ Streak maintained                                         │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 7.2 Position-Specific Views

Different positions see different information:

**Quarterback View:**
- Full play diagram with all routes
- Complete read progression
- Protection calls
- RPO read keys
- All coverage adjustments

**Receiver View (X/Z/H/Y):**
- Route diagram (their route highlighted)
- Alignment and split
- Route depth and landmarks
- Coverage adjustments for their route
- Motion responsibilities

**Running Back View:**
- Run track / pass route
- Blocking assignments
- Blitz pickup rules
- Check-release reads
- Ball security coaching points

### 7.3 Study Mode Options

Players can choose:

| Mode | Description | Best For |
|------|-------------|----------|
| Quick Review | 5-min flashcard sprint | Pre-practice |
| Deep Study | Full play breakdown + quiz | Night before game |
| Quiz Only | Timed assessment | Testing readiness |
| Rep Logging | Track mental reps manually | Walk-through review |
| AI Coaching | Conversational learning | Understanding concepts |

---

## 8. Coach Workflow

### 8.1 Play Management

Coaches can:

```typescript
interface CoachPlaybookActions {
  // Add plays to install
  addPlayToInstall(playId: string, installWeek: number): void;
  
  // Set emphasis plays
  setEmphasisPlays(playIds: string[], installWeek: number): void;
  
  // Add/edit coaching points
  updateCoachingPoints(playId: string, points: string[]): void;
  
  // Adjust rep targets
  setRepTargets(playId: string, targets: {
    default: number;
    byPosition?: Record<SkillPosition, number>;
  }): void;
  
  // Create custom plays
  createPlay(play: Partial<PlaybookPlay>): PlaybookPlay;
  
  // Import from library
  importFromLibrary(libraryPlayId: string, teamId: string): PlaybookPlay;
}
```

### 8.2 Player Mastery Heatmap

Coaches see aggregate view:

```typescript
interface MasteryHeatmap {
  plays: {
    playId: string;
    playName: string;
    positionMastery: Record<SkillPosition, {
      avgMastery: number;
      playersAtRisk: number;
      playersComplete: number;
    }>;
  }[];
  
  // Struggling concepts
  strugglingConcepts: {
    concept: string;
    avgMastery: number;
    affectedPlayers: string[];
    suggestedAction: string;
  }[];
  
  // Position room summaries
  positionRooms: {
    position: SkillPosition;
    avgMastery: number;
    topPerformer: { name: string; mastery: number };
    needsAttention: { name: string; mastery: number }[];
  }[];
}
```

### 8.3 Coach Dashboard Metrics

| Metric | Description | Threshold |
|--------|-------------|-----------|
| Team Mastery % | Average across all players/plays | Green: >80%, Yellow: 60-80%, Red: <60% |
| Completion Rate | Plays with 100% rep target | Target: 100% by game day |
| At-Risk Players | Players below 60% mastery | Alert if >20% of roster |
| Concept Gaps | Specific concepts with low scores | Flag for extra practice |

---

## 9. Intelligence Layer

### 9.1 Mastery Calculation

```typescript
function calculateMasteryScore(progress: PlayerPlayProgress): number {
  const weights = {
    quizAccuracy: 0.40,      // Quiz performance
    repCompletion: 0.25,     // Rep target progress
    categoryBalance: 0.20,   // All categories studied
    recency: 0.15            // Recent study activity
  };
  
  // Quiz accuracy component (0-100)
  const quizScore = progress.quizAccuracy;
  
  // Rep completion component (0-100)
  const repScore = Math.min(100, (progress.repsCompleted / progress.repsTarget) * 100);
  
  // Category balance (0-100): all categories should be above threshold
  const categoryScores = Object.values(progress.categoryScores);
  const minCategory = Math.min(...categoryScores);
  const avgCategory = categoryScores.reduce((a, b) => a + b, 0) / categoryScores.length;
  const categoryBalance = (minCategory * 0.4 + avgCategory * 0.6);
  
  // Recency (0-100): decay over time since last study
  const daysSinceStudy = daysBetween(progress.lastStudied, now());
  const recencyScore = Math.max(0, 100 - (daysSinceStudy * 5));
  
  return Math.round(
    quizScore * weights.quizAccuracy +
    repScore * weights.repCompletion +
    categoryBalance * weights.categoryBalance +
    recencyScore * weights.recency
  );
}
```

### 9.2 Weakness Detection

AI identifies weakest concepts:

```typescript
function identifyWeaknesses(
  playerProgress: PlayerPlayProgress[],
  position: SkillPosition
): WeaknessAnalysis {
  // Group by category
  const categoryPerformance: Record<string, number[]> = {};
  
  for (const progress of playerProgress) {
    for (const [category, score] of Object.entries(progress.categoryScores)) {
      if (!categoryPerformance[category]) {
        categoryPerformance[category] = [];
      }
      categoryPerformance[category].push(score);
    }
  }
  
  // Find weakest categories
  const weakCategories = Object.entries(categoryPerformance)
    .map(([category, scores]) => ({
      category,
      avgScore: scores.reduce((a, b) => a + b, 0) / scores.length
    }))
    .filter(c => c.avgScore < 70)
    .sort((a, b) => a.avgScore - b.avgScore);
  
  // Find weakest plays
  const weakPlays = playerProgress
    .filter(p => p.masteryScore < 60)
    .sort((a, b) => a.masteryScore - b.masteryScore);
  
  return {
    weakestCategories: weakCategories.slice(0, 3),
    weakestPlays: weakPlays.slice(0, 5),
    recommendation: generateRecommendation(weakCategories, weakPlays)
  };
}
```

### 9.3 Personalized Study Path

```typescript
function generateStudyPath(
  player: Player,
  progress: PlayerPlayProgress[],
  install: Install
): StudyPath {
  const steps: StudyStep[] = [];
  
  // Priority 1: Emphasis plays not yet at 80% mastery
  const emphasisNeeded = progress
    .filter(p => install.emphasisPlayIds.includes(p.playId) && p.masteryScore < 80);
  
  for (const play of emphasisNeeded) {
    steps.push({
      type: "study",
      playId: play.playId,
      reason: "Coach emphasized this play",
      suggestedDuration: 10
    });
  }
  
  // Priority 2: Due today based on spaced repetition
  const dueToday = progress
    .filter(p => isToday(p.nextDueDate) || isPast(p.nextDueDate));
  
  for (const play of dueToday) {
    steps.push({
      type: "review",
      playId: play.playId,
      reason: "Scheduled review",
      suggestedDuration: 5
    });
  }
  
  // Priority 3: New plays this week
  const newPlays = progress
    .filter(p => p.masteryLevel === "new");
  
  for (const play of newPlays) {
    steps.push({
      type: "learn",
      playId: play.playId,
      reason: "New this week",
      suggestedDuration: 15
    });
  }
  
  // Priority 4: Weak areas identified by AI
  const weaknesses = identifyWeaknesses(progress, player.position);
  
  for (const weak of weaknesses.weakestPlays.slice(0, 2)) {
    if (!steps.find(s => s.playId === weak.playId)) {
      steps.push({
        type: "remediation",
        playId: weak.playId,
        reason: `Mastery at ${weak.masteryScore}%`,
        suggestedDuration: 10
      });
    }
  }
  
  return {
    steps,
    totalDuration: steps.reduce((sum, s) => sum + s.suggestedDuration, 0),
    generatedAt: now()
  };
}
```

### 9.4 Play Sorting Priority

Plays are sorted by:

```typescript
function sortPlaysByPriority(
  plays: PlaybookPlay[],
  progress: Map<string, PlayerPlayProgress>,
  install: Install
): PlaybookPlay[] {
  return plays.sort((a, b) => {
    const progA = progress.get(a.id);
    const progB = progress.get(b.id);
    
    // Priority weights
    const scoreA = calculatePriorityScore(a, progA, install);
    const scoreB = calculatePriorityScore(b, progB, install);
    
    return scoreB - scoreA; // Descending
  });
}

function calculatePriorityScore(
  play: PlaybookPlay,
  progress: PlayerPlayProgress | undefined,
  install: Install
): number {
  let score = 0;
  
  // Status weights
  if (!progress || progress.masteryLevel === "new") score += 50;
  if (progress?.isEmphasis || install.emphasisPlayIds.includes(play.id)) score += 40;
  if (isToday(progress?.nextDueDate) || isPast(progress?.nextDueDate)) score += 35;
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
```

---

## 10. API Contracts

### 10.1 Playbook Endpoints

```typescript
// GET /api/playbook/:teamId/plays
// Returns all plays for a team with player progress
interface GetPlaysResponse {
  plays: PlaybookPlay[];
  progress: Record<string, PlayerPlayProgress>;
  install: Install;
  aiRecommendations: AIPlaybookAnalysis;
}

// POST /api/playbook/play/:playId/rep
// Log a mental rep
interface LogRepRequest {
  playId: string;
  repType: "mental" | "physical" | "walkthrough";
  notes?: string;
}

// POST /api/playbook/play/:playId/quiz
// Submit quiz answers
interface SubmitQuizRequest {
  playId: string;
  answers: {
    questionId: string;
    answerId: string;
    timeMs: number;
  }[];
}

// GET /api/playbook/flashcards/due
// Get due flashcards for player
interface GetDueFlashcardsResponse {
  cards: PlaybookFlashcard[];
  totalDue: number;
  byCategory: Record<FlashcardCategory, number>;
}

// POST /api/playbook/flashcards/study
// Submit flashcard study session
interface SubmitFlashcardSessionRequest {
  results: {
    cardId: string;
    correct: boolean;
    timeMs: number;
  }[];
}
```

### 10.2 Coach Endpoints

```typescript
// GET /api/coach/playbook/:teamId/mastery
// Get mastery heatmap for team
interface GetMasteryHeatmapResponse {
  heatmap: MasteryHeatmap;
  alerts: CoachAlert[];
}

// POST /api/coach/playbook/install
// Create/update install week
interface UpdateInstallRequest {
  weekNumber: number;
  weekLabel: string;
  playIds: string[];
  emphasisPlayIds: string[];
  repTargets: RepTargets;
}

// POST /api/coach/playbook/play/:playId/emphasis
// Toggle emphasis status
interface SetEmphasisRequest {
  playId: string;
  isEmphasis: boolean;
  reason?: string;
}
```

---

## 11. Integration Points

### 11.1 With Games System

```typescript
// Playbook data feeds into games
interface PlaybookGameIntegration {
  // Assignment Tracker pulls from PlaybookPlay.assignments
  getAssignmentQuestions(playId: string, position: SkillPosition): AssignmentQuestion[];
  
  // Coverage ID uses PlaybookPlay.coverageAdjustments
  getCoverageScenarios(playId: string): CoverageScenario[];
  
  // Game results update playbook mastery
  onGameComplete(session: GameSession): void;
}
```

### 11.2 With AI Coach

```typescript
// AI Coach accesses playbook data
interface PlaybookAIIntegration {
  // Get context for coaching
  getPlayerPlaybookContext(userId: string, teamId: string): {
    currentInstall: Install;
    weaknesses: WeaknessAnalysis;
    duePlays: PlaybookPlay[];
    recentProgress: PlayerPlayProgress[];
  };
  
  // Generate personalized coaching
  generateCoachingResponse(
    context: PlaybookContext,
    query: string
  ): CoachMessage;
}
```

### 11.3 With Film Room

```typescript
// Link plays to film clips
interface PlaybookFilmIntegration {
  // Attach film clip to play
  attachClipToPlay(playId: string, clipId: string): void;
  
  // Get clips for a play
  getClipsForPlay(playId: string): FilmClip[];
  
  // AI analyzes clip and updates play data
  analyzeClipForPlay(clipId: string, playId: string): PlayAnalysis;
}
```

### 11.4 With Analytics

```typescript
// Analytics pulls playbook data
interface PlaybookAnalyticsIntegration {
  // Calculate playbook-specific IQ
  calculateAssignmentIQ(progress: PlayerPlayProgress[]): number;
  
  // Generate readiness report
  generateInstallReadiness(
    userId: string,
    teamId: string,
    installWeek: number
  ): InstallReadiness[];
  
  // Track concept mastery over time
  getConceptMasteryTrend(
    userId: string,
    concept: string,
    period: "week" | "month" | "season"
  ): TrendDataPoint[];
}
```

---

## Appendix A: Mastery Level Thresholds

| Level | Score Range | Criteria |
|-------|-------------|----------|
| New | 0-20 | Never studied or <3 reps |
| Learning | 21-50 | Started studying, <70% quiz accuracy |
| Proficient | 51-80 | 70-85% quiz accuracy, rep target >50% |
| Mastered | 81-100 | >85% quiz accuracy, rep target 100%, all categories >70 |

## Appendix B: Spaced Repetition Intervals

| Review # | If Correct | If Incorrect |
|----------|------------|--------------|
| 1st | 1 day | 1 day |
| 2nd | 3 days | 1 day |
| 3rd | 7 days | 1 day |
| 4th | 14 days | 1 day |
| 5th+ | interval × 2.0 | 1 day |

## Appendix C: AI Coach Response Templates

See `src/lib/ai-coach/service.ts` for implementation details.




