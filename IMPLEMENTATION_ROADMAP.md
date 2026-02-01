# Question Generation System - Implementation Roadmap

## Summary of Changes

I've redesigned your question generation system to move from simple multiple-choice questions to a comprehensive, AI-powered quiz system that creates high-quality, pedagogically sound questions.

### What I've Created

1. **Database Migration** (`015_enhanced_question_system.sql`)
   - New `question_type` enum (multiple_choice, true_false, scenario, etc.)
   - New `question_topic` enum (20+ granular categories)
   - Enhanced `flashcard_templates` table with 10+ new columns
   - View for easy querying of active questions

2. **AI Prompt System** (`src/lib/question-generation-prompts.ts`)
   - Comprehensive system prompt for GPT-4
   - Dynamic prompt building for different content types
   - Support for play, coverage, and situational questions

3. **Question Generator Service** (`src/lib/services/question-generator.ts`)
   - `generateQuestionsWithAI()` - Main generation function
   - `generateCoverageQuestions()` - For defensive content
   - `transformQuestionsForDatabase()` - Convert AI output to DB format
   - Helper functions for difficulty distribution

4. **Documentation** (`QUESTION_GENERATION_SYSTEM.md`)
   - Complete system overview
   - Usage examples
   - Migration guide
   - FAQ

## Implementation Steps

### Phase 1: Database Setup (15 min)

1. **Run the migration**
   ```bash
   psql -U postgres -d your_db_name -f src/lib/database/migrations/015_enhanced_question_system.sql
   ```

2. **Verify columns exist**
   ```sql
   \d+ flashcard_templates;
   -- Check for: question_type, topic, scenario_context, etc.
   ```

### Phase 2: Update Flashcard Generation Endpoint (1-2 hours)

**Current:** `netlify/functions/flashcard-templates.ts` uses basic template substitution

**Updated:** Use AI generation

```typescript
// netlify/functions/flashcard-templates.ts

import { generateQuestionsWithAI, transformQuestionsForDatabase } from '@/lib/services/question-generator';

// In your generation function:
const generatedQuestions = await generateQuestionsWithAI({
  playId: play.id,
  orgId: play.org_id,
  playData: {
    name: play.name,
    concept: play.concept,
    playType: play.play_type,
    formation: play.formation_name,
    unit: play.unit,
    situation: play.situation,
  },
  assignments: assignments,
  options: {
    questionCount: 12,
    difficultyDistribution: {
      beginner: 4,
      intermediate: 6,
      advanced: 2,
    },
  },
}, process.env.OPENAI_API_KEY!);

// Transform for database
const assignmentMap = new Map(
  assignments.map(a => [a.position, a.id])
);

const dbQuestions = transformQuestionsForDatabase(
  generatedQuestions,
  play.id,
  play.org_id,
  assignmentMap
);

// Insert
const { data, error } = await supabase
  .from('flashcard_templates')
  .insert(dbQuestions)
  .select();
```

### Phase 3: Update Quiz Assignment UI (2-3 hours)

**Coach can now:**
1. Select plays to include
2. Filter questions by:
   - Topic (coverage_recognition, route_running, etc.)
   - Difficulty
   - Position
   - Tags (red_zone, 3rd_down, etc.)
3. Preview questions before assigning
4. Set passing score, time limit, due date

**Suggested UI Flow:**

```
[Create Quiz Assignment]

1. Quiz Details
   - Title: "Week 3 Pass Game"
   - Description: "Test knowledge of..."
   - Due Date: Feb 5, 2026
   - Passing Score: 80%

2. Select Content
   [x] Gun Trips Mesh (12 questions)
   [x] Gun Doubles Stick (10 questions)
   [ ] Pro I Power (8 questions)

3. Filter Questions
   Topics: [Coverage Recognition] [Route Running]
   Difficulty: [Beginner] [Intermediate] [Advanced]
   Positions: [X] [Z] [H]

4. Review (24 questions selected)
   [Preview Questions]

5. Assign To
   ( ) Entire Team
   ( ) Position Group: [WR ▼]
   ( ) Individual Player: [Select ▼]
   ( ) Segment: [Select ▼]

[Create Assignment]
```

### Phase 4: Update Player Quiz Interface (3-4 hours)

**Handle new question types:**

```typescript
function QuestionRenderer({ question, onAnswer }) {
  switch (question.question_type) {
    case 'multiple_choice':
      return <MultipleChoiceQuestion question={question} onAnswer={onAnswer} />;

    case 'true_false':
      return <TrueFalseQuestion question={question} onAnswer={onAnswer} />;

    case 'fill_blank':
      return <FillBlankQuestion question={question} onAnswer={onAnswer} />;

    case 'scenario':
      return <ScenarioQuestion
        context={question.scenario_context}
        question={question}
        onAnswer={onAnswer}
      />;

    case 'identification':
      return <IdentificationQuestion question={question} onAnswer={onAnswer} />;
  }
}
```

**Features to add:**
- Show scenario context prominently
- Display explanation after answer
- Show learning objective
- Related concepts links
- Hint system (progressive disclosure)

### Phase 5: Analytics Dashboard (2-3 hours)

**Track:**
- Question difficulty vs. success rate
- Topics players struggle with
- Position-specific weak areas
- Most missed questions
- Time spent per question type

**Suggested Queries:**

```sql
-- Questions with lowest success rate
SELECT
  ft.question_prompt,
  ft.topic,
  ft.difficulty,
  COUNT(*) as attempts,
  SUM(CASE WHEN qaa.is_correct THEN 1 ELSE 0 END)::float / COUNT(*) as success_rate
FROM quiz_attempt_answers qaa
JOIN flashcard_templates ft ON qaa.flashcard_id = ft.id
GROUP BY ft.id, ft.question_prompt, ft.topic, ft.difficulty
ORDER BY success_rate ASC
LIMIT 20;

-- Player weak topics
SELECT
  u.display_name,
  ft.topic,
  COUNT(*) as attempts,
  AVG(CASE WHEN qaa.is_correct THEN 1 ELSE 0 END) as success_rate
FROM quiz_attempt_answers qaa
JOIN flashcard_templates ft ON qaa.flashcard_id = ft.id
JOIN quiz_attempts qa ON qaa.quiz_attempt_id = qa.id
JOIN users u ON qa.user_id = u.id
WHERE u.id = $1
GROUP BY u.display_name, ft.topic
ORDER BY success_rate ASC;
```

## Optional Enhancements

### 1. Bulk Question Generation
Generate questions for multiple plays at once:
```typescript
async function generateQuestionsForPlaylist(playIds: string[]) {
  const results = await Promise.all(
    playIds.map(id => generateQuestionsWithAI({...}))
  );
  // Batch insert
}
```

### 2. Question Review/Approval Flow
Allow coaches to review AI-generated questions before activation:
```sql
ALTER TABLE flashcard_templates
  ADD COLUMN IF NOT EXISTS reviewed_by uuid REFERENCES users(id),
  ADD COLUMN IF NOT EXISTS reviewed_at timestamptz,
  ADD COLUMN IF NOT EXISTS review_status varchar DEFAULT 'pending'
    CHECK (review_status IN ('pending', 'approved', 'rejected', 'needs_revision'));
```

### 3. Player Feedback
Let players flag confusing questions:
```sql
CREATE TABLE question_feedback (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  flashcard_id uuid REFERENCES flashcard_templates(id),
  user_id uuid REFERENCES users(id),
  feedback_type varchar, -- 'confusing', 'incorrect', 'too_hard', 'too_easy'
  comment text,
  created_at timestamptz DEFAULT now()
);
```

### 4. Adaptive Difficulty
Track player performance and adjust question difficulty:
```typescript
function selectQuestionsForPlayer(playerId: string, targetDifficulty: string) {
  // Based on player history, select appropriate questions
  // Gradually increase difficulty as they improve
}
```

### 5. Question Templates
Let coaches create question templates that AI fills in:
```typescript
{
  template: "Against {coverage}, what is the {position}'s read?",
  variables: {
    coverage: ["Cover 2", "Cover 3", "Man"],
    position: ["X", "Z", "H"]
  }
}
```

## Cost Estimates

**AI Generation Costs (GPT-4o):**
- Input: ~1,500 tokens per play = $0.0075
- Output: ~1,200 tokens (12 questions) = $0.018
- **Total: ~$0.025 per play**

**For 100 plays: ~$2.50**

Much cheaper than manual question creation!

## Testing Plan

1. **Unit Tests**
   - Test prompt building functions
   - Test question transformation
   - Test database inserts

2. **Integration Tests**
   - Generate questions for sample play
   - Verify all fields populated correctly
   - Test quiz assignment creation
   - Test quiz attempt flow

3. **Manual Testing**
   - Upload new play
   - Generate questions
   - Review quality
   - Create quiz assignment
   - Take quiz as player
   - Review results

## Success Metrics

- **Question Quality**: Coach review rating (aim for 90%+ approval)
- **Question Variety**: Distribution across types and topics
- **Player Engagement**: Quiz completion rate
- **Learning Effectiveness**: Score improvement over time
- **Time Savings**: Manual question creation time vs AI

## Timeline

| Phase | Time | Priority |
|-------|------|----------|
| Database Migration | 15 min | High |
| Update Generation Endpoint | 2 hours | High |
| Update Quiz Assignment UI | 3 hours | High |
| Update Player Quiz UI | 4 hours | High |
| Analytics Dashboard | 3 hours | Medium |
| Optional Enhancements | Variable | Low |

**Total Core Implementation: ~1-2 days**

## Next Immediate Steps

1. Run the migration: `015_enhanced_question_system.sql`
2. Update `netlify/functions/flashcard-templates.ts` to use new generator
3. Test question generation on 1-2 plays
4. Review question quality with a coach
5. Iterate on prompts if needed
6. Build out quiz assignment UI
7. Update player quiz interface

---

**Ready to get started?** The migration and core services are ready to go. Let me know if you want me to help with any specific implementation step!
