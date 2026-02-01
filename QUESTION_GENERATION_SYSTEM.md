# Enhanced Question Generation System

## Overview

This document outlines the redesigned question generation system for creating high-quality, pedagogically sound quiz questions from football playbook content.

## What's New

### 1. **Expanded Question Types**

Instead of just multiple-choice with hints, we now support:

| Type | Description | Use Case |
|------|-------------|----------|
| `multiple_choice` | 4 options, 1 correct | Most versatile, good for testing recognition and recall |
| `true_false` | Binary true/false | Quick checks, testing common misconceptions |
| `fill_blank` | Fill in missing term | Terminology, specific assignments |
| `scenario` | Game situation → decision | Decision-making, situational football IQ |
| `identification` | Describe → identify | Coverage recognition, formation ID |

### 2. **Granular Topic Categorization**

More specific than the old `category` field:

**Alignment & Formation:**
- `formation_identification` - "What formation is this?"
- `alignment_rules` - "Where does X line up in trips?"
- `personnel_groupings` - "What personnel is 11 personnel?"

**Assignments & Execution:**
- `route_running` - Route details, depths, breaks
- `blocking_assignments` - Who blocks who
- `pass_protection` - Protection schemes
- `run_fits` - Gap responsibilities

**Reads & Keys:**
- `pre_snap_reads` - What to look for before snap
- `post_snap_reads` - Reading coverage/defenders
- `coverage_recognition` - Identifying coverages
- `hot_routes` - Hot route rules

**Adjustments & Strategy:**
- `coverage_adjustments` - Adjusting routes vs coverage
- `formation_checks` - Pre-snap checks
- `play_concepts` - Why/how plays work
- `situational_football` - Down/distance/game situations

### 3. **AI-Generated Questions**

Instead of just using assignment data as-is, we now:

1. **Analyze play context** - Formation, concept, situation
2. **Generate diverse questions** - Multiple types and topics
3. **Create realistic distractors** - Wrong answers that test understanding
4. **Include explanations** - Teaching moments, not just correctness
5. **Add learning objectives** - What player should learn from each question
6. **Progressive difficulty** - Build from basic to advanced

### 4. **Better Metadata**

Each question now includes:

```typescript
{
  question_type: 'scenario',
  topic: 'coverage_adjustments',
  position: 'X',
  difficulty: 'intermediate',
  question_prompt: "3rd and 7, you're in trips right...",
  correct_answer: "Sit in the window vs Cover 2",
  explanation: "Against Cover 2, the corner will carry...",
  scenario_context: "3rd and 7, trips right, Cover 2 shell",
  learning_objective: "Understand route adjustments vs 2-high safeties",
  tags: ["3rd_down", "cover_2", "route_adjustment"],
  hints: ["Look at the safeties", "Think about spacing"],
  related_concepts: ["Cover 2", "Route concepts", "Third down"],
  // Metadata
  ai_generation_metadata: {
    generated_at: "2026-01-30T...",
    model: "gpt-4o",
    prompt_version: "v2"
  }
}
```

## Database Changes

### New Migration: `015_enhanced_question_system.sql`

**New Enums:**
```sql
CREATE TYPE question_type AS ENUM (
  'multiple_choice',
  'true_false',
  'fill_blank',
  'matching',
  'ordering',
  'scenario',
  'identification'
);

CREATE TYPE question_topic AS ENUM (
  'formation_identification',
  'alignment_rules',
  -- ... (see migration for full list)
);
```

**New Columns on `flashcard_templates`:**
- `question_type` - Type of question
- `topic` - Granular topic classification
- `options` - For multiple choice: shuffled array of all options
- `scenario_context` - Game situation setup
- `tags` - Flexible tagging: ["red_zone", "3rd_down", "blitz"]
- `learning_objective` - What player should learn
- `ai_generation_metadata` - Track AI generation details
- `requires_position` - Whether question is position-specific
- `visible_to_positions` - Which positions see this

**New View:**
```sql
CREATE VIEW v_active_questions AS
  -- Active questions with play context for easy querying
```

## Usage

### Step 1: Generate Questions for a Play

```typescript
import { generateQuestionsWithAI, transformQuestionsForDatabase } from '@/lib/services/question-generator';

const questions = await generateQuestionsWithAI({
  playId: play.id,
  orgId: org.id,
  playData: {
    name: play.name,
    concept: play.concept,
    playType: play.play_type,
    formation: play.formation_name,
    unit: play.unit,
    situation: play.situation,
  },
  assignments: playAssignments,
  options: {
    questionCount: 10,
    difficultyDistribution: {
      beginner: 3,
      intermediate: 5,
      advanced: 2,
    },
    questionTypes: ['multiple_choice', 'true_false', 'scenario'],
    focusTopics: ['coverage_adjustments', 'route_running'],
  },
}, openAIKey);
```

### Step 2: Save to Database

```typescript
const assignmentMap = new Map(
  playAssignments.map(a => [a.position, a.id])
);

const dbQuestions = transformQuestionsForDatabase(
  questions,
  play.id,
  org.id,
  assignmentMap
);

// Insert into flashcard_templates
await supabase
  .from('flashcard_templates')
  .insert(dbQuestions);
```

### Step 3: Create Quiz Assignments

```typescript
// Create a quiz
const { data: quiz } = await supabase
  .from('quiz_assignments')
  .insert({
    org_id: orgId,
    team_id: teamId,
    title: "Week 3 Pass Game Quiz",
    description: "Test your knowledge of our passing concepts",
    assigned_to_position: 'X', // Or null for all
    due_date: '2026-02-05',
    passing_score: 80,
    randomize_questions: true,
  })
  .select()
  .single();

// Add questions to quiz
const questionLinks = questions.slice(0, 10).map((q, idx) => ({
  quiz_assignment_id: quiz.id,
  flashcard_id: q.id,
  display_order: idx,
  points: q.difficulty === 'advanced' ? 3 : q.difficulty === 'intermediate' ? 2 : 1,
}));

await supabase
  .from('quiz_assignment_questions')
  .insert(questionLinks);
```

## Question Generation Strategies

### For New Plays (Just Uploaded)

Generate comprehensive question set:
```typescript
{
  questionCount: 12,
  difficultyDistribution: { beginner: 4, intermediate: 6, advanced: 2 },
  questionTypes: ['multiple_choice', 'true_false', 'scenario'],
}
```

### For Coverage/Defense Content

Focus on recognition and adjustments:
```typescript
{
  questionCount: 8,
  focusTopics: ['coverage_recognition', 'coverage_adjustments', 'run_fits'],
  questionTypes: ['multiple_choice', 'identification', 'scenario'],
}
```

### For Situational Content (Red Zone, 3rd Down, etc.)

Emphasize decision-making:
```typescript
{
  questionCount: 6,
  focusTopics: ['situational_football', 'play_concepts'],
  questionTypes: ['scenario', 'multiple_choice'],
  // All questions will be tagged with situation
}
```

### For Position-Specific Study

Generate questions for specific position groups:
```typescript
{
  positions: ['QB', 'X', 'Z'], // Just skill positions
  focusTopics: ['route_running', 'coverage_adjustments', 'hot_routes'],
}
```

## Creating Effective Assignments

### Weekly Install Quiz
- 10-15 questions
- Mix of new plays from the week
- 70% beginner/intermediate, 30% advanced
- Due before practice

### Position Group Quiz
- 8-12 questions
- Position-specific content
- Include scenario questions
- Focus on their responsibilities

### Situational Quiz (3rd Down, Red Zone, etc.)
- 6-10 questions
- All scenario-based
- Test decision-making
- Tagged with situation

### Game Prep Quiz
- 12-20 questions
- Mix of opponent's coverages + our plays
- Advanced difficulty
- Emphasize adjustments

## Migration Path

### Phase 1: Run Migration
```bash
# Apply the new schema
psql -f src/lib/database/migrations/015_enhanced_question_system.sql
```

### Phase 2: Update Flashcard Generation Endpoint

Replace the old `generateAssignmentFlashcards` function with AI generation:

```typescript
// OLD: netlify/functions/flashcard-templates.ts
// NEW: Use question-generator.ts service

import { generateQuestionsWithAI } from '@/lib/services/question-generator';
```

### Phase 3: Backfill Existing Plays (Optional)

For plays that already have basic flashcards, optionally regenerate with AI:

```typescript
// Fetch plays with old-style flashcards
// Regenerate with new system
// Mark old flashcards as inactive
```

## Benefits

1. **Higher Quality Questions** - AI generates varied, thoughtful questions
2. **Better Learning** - Explanations teach, not just test
3. **More Variety** - Multiple question types keep players engaged
4. **Progressive Difficulty** - Build understanding systematically
5. **Situational Focus** - Test game-applicable knowledge
6. **Position-Specific** - Tailor content to what each position needs
7. **Flexible Assignment** - Easy to create targeted quizzes
8. **Better Analytics** - Rich metadata for tracking weak areas

## Next Steps

1. ✅ Created migration for enhanced schema
2. ✅ Built AI prompt system
3. ✅ Created question generator service
4. ⏭️ Update flashcard generation endpoint to use new system
5. ⏭️ Build coach UI for creating quiz assignments
6. ⏭️ Update player quiz interface to handle new question types
7. ⏭️ Add analytics dashboard for question performance

## Example Questions Generated

### Beginner (Multiple Choice)
**Question:** Where does the X receiver line up in Trips Right?
- A) Split left 12 yards ✅
- B) Slot right
- C) Split right 12 yards
- D) Tight to the line

**Learning Objective:** Understand formation alignment rules

---

### Intermediate (Scenario)
**Context:** 3rd and 7 from midfield, trips right, Cover 2 shell

**Question:** As the Z receiver in the middle of trips, what adjustment do you make when you see 2-high safeties?

**Answer:** Sit in the window at 8 yards instead of running through

**Explanation:** Against Cover 2, the corner will carry #1 vertical and the linebacker will carry #3. This creates a window between them where you can sit down and be the hot read.

---

### Advanced (Identification)
**Question:** The safety is aligned at 12 yards deep, shaded to the field. The corners are at 7 yards off. On the snap, the safety rotates to the boundary and the field corner sinks to deep half. What coverage is this?

**Answer:** Cover 3 Sky (rotation coverage)

**Explanation:** This is a rotation coverage from a 2-high shell to Cover 3. The sky technique means the boundary safety comes down to the flat while the field corner takes deep third. This is designed to disguise the coverage pre-snap.

---

## FAQ

**Q: Do we still need the old `category` field?**
A: Yes, for backward compatibility. The new `topic` field is more granular, but we map topics back to categories.

**Q: Can coaches edit AI-generated questions?**
A: Yes, coaches should review and can edit any field. Mark `is_auto_generated` as false when edited.

**Q: How many questions per play?**
A: Recommend 10-12 for simple plays, 15-20 for complex plays. Quality over quantity.

**Q: What about images/diagrams in questions?**
A: The schema supports `image_url` field. Future enhancement: embed play diagram images in questions.

**Q: Cost of AI generation?**
A: GPT-4o: ~$0.10-0.15 per play (10-12 questions). Run once per play, cache results.

**Q: Can we generate questions for formations and coverages too?**
A: Yes! Use `buildCoverageQuestionPrompt` for defensive content. Works similarly.

