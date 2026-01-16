# Assignment Flashcards - Multiple Choice Quiz System

## Overview

Added automatic generation of position-specific, multiple-choice flashcards for the assignments page. Players can now quiz themselves on alignment, assignment, and key reads with instant feedback.

## What Was Added

### 1. Auto-Generate Assignment Flashcards ✅

**File:** `src/app/api/generate-play-content/route.ts`

**Function:** `generateAssignmentFlashcards()`

**What It Does:**
- Creates 3 flashcards per position: alignment, assignment, key_read
- Generates multiple choice options using other positions' data as distractors
- Shuffles options for randomization
- Stores options in the `hints` JSONB field

**Example:**
```typescript
// For QB position:
{
  question_prompt: "Where do you line up as the QB?",
  correct_answer: "Shotgun",
  hints: ["Shotgun", "Split left", "Inline right", "Slot left"], // Shuffled
  category: "alignment"
}
```

### 2. Multiple Choice Quiz UI ✅

**File:** `src/app/games/assignment/page.tsx`

**Features:**
- Click to select answer (no typing required)
- Submit answer button
- Instant visual feedback (green = correct, red = incorrect)
- Shows correct answer after submission
- Tracks score throughout quiz
- Completion screen with accuracy percentage

## How It Works

### Generation Phase (Coach)

1. **Coach uploads play and generates content**
2. **API analyzes play with GPT-4o Vision** → Gets position assignments
3. **API creates position assignments** → Saves to `play_assignments` table
4. **API generates flashcards automatically:**
   - For each position (QB, RB, FB, X, Z, H, Y, TE)
   - Creates 3 questions:
     - Alignment: "Where do you line up as the [position]?"
     - Assignment: "What is your assignment as the [position]?"
     - Key Read: "What is your key read as the [position]?"
   - Uses other positions' data to create realistic distractors
   - Shuffles options randomly
5. **Saves flashcards to database** with multiple choice options

### Quiz Phase (Player)

1. **Player selects play and position**
2. **Loads assignment details** (alignment, assignment, key read)
3. **Player clicks "Start Quiz"**
4. **Shows question with 2-4 multiple choice options**
5. **Player clicks an answer** (button highlights in cyan)
6. **Player clicks "Submit Answer"**
7. **Shows feedback:**
   - Correct answer = green border + checkmark
   - Wrong answer = red border + X mark
   - All other answers = grayed out
8. **Player clicks "Next Question"**
9. **Repeat until quiz complete**
10. **Shows completion screen with accuracy**

## Quiz UI Flow

### Before Submission
```
┌─────────────────────────────────────────────────┐
│ Question 1 of 3              ✓ 0  ✗ 0          │
├─────────────────────────────────────────────────┤
│ ALIGNMENT                                       │
│ Where do you line up as the QB?                │
│                                                 │
│ ┌─────────────────────────────────────────────┐│
│ │ Shotgun                             [CYAN]  ││ ← Selected
│ └─────────────────────────────────────────────┘│
│ ┌─────────────────────────────────────────────┐│
│ │ Split left                          [GRAY]  ││
│ └─────────────────────────────────────────────┘│
│ ┌─────────────────────────────────────────────┐│
│ │ Inline right                        [GRAY]  ││
│ └─────────────────────────────────────────────┘│
│ ┌─────────────────────────────────────────────┐│
│ │ Slot left                           [GRAY]  ││
│ └─────────────────────────────────────────────┘│
│                                                 │
│ [Submit Answer]                                 │
└─────────────────────────────────────────────────┘
```

### After Submission (Correct)
```
┌─────────────────────────────────────────────────┐
│ Question 1 of 3              ✓ 1  ✗ 0          │
├─────────────────────────────────────────────────┤
│ ALIGNMENT                                       │
│ Where do you line up as the QB?                │
│                                                 │
│ ┌─────────────────────────────────────────────┐│
│ │ Shotgun                          ✓ [GREEN]  ││ ← Correct!
│ └─────────────────────────────────────────────┘│
│ ┌─────────────────────────────────────────────┐│
│ │ Split left                       [GRAYED]   ││
│ └─────────────────────────────────────────────┘│
│ ┌─────────────────────────────────────────────┐│
│ │ Inline right                     [GRAYED]   ││
│ └─────────────────────────────────────────────┘│
│ ┌─────────────────────────────────────────────┐│
│ │ Slot left                        [GRAYED]   ││
│ └─────────────────────────────────────────────┘│
│                                                 │
│ [Next Question]                                 │
└─────────────────────────────────────────────────┘
```

### After Submission (Incorrect)
```
┌─────────────────────────────────────────────────┐
│ Question 2 of 3              ✓ 1  ✗ 1          │
├─────────────────────────────────────────────────┤
│ ASSIGNMENT                                      │
│ What is your assignment as the QB?             │
│                                                 │
│ ┌─────────────────────────────────────────────┐│
│ │ Pass                             ✓ [GREEN]  ││ ← Correct answer
│ └─────────────────────────────────────────────┘│
│ ┌─────────────────────────────────────────────┐│
│ │ Run                              [GRAYED]   ││
│ └─────────────────────────────────────────────┘│
│ ┌─────────────────────────────────────────────┐│
│ │ Block                            ✗ [RED]    ││ ← Your wrong answer
│ └─────────────────────────────────────────────┘│
│ ┌─────────────────────────────────────────────┐│
│ │ Route                            [GRAYED]   ││
│ └─────────────────────────────────────────────┘│
│                                                 │
│ [Next Question]                                 │
└─────────────────────────────────────────────────┘
```

## Technical Details

### Multiple Choice Option Generation

The system uses other positions' data as distractors:

```typescript
// For QB alignment question
const alignmentOptions = [
  "Shotgun",           // QB's correct answer
  "Split left",        // X receiver's alignment (distractor)
  "Inline right",      // TE's alignment (distractor)
  "Slot left",         // H-back's alignment (distractor)
];

// Shuffled randomly
shuffleArray(alignmentOptions); // → ["Inline right", "Shotgun", "Slot left", "Split left"]
```

**Benefits:**
- Realistic distractors (actual positions from the same play)
- Tests if player knows their specific assignment vs others
- No need for GPT to generate fake options

### Data Storage

**Flashcard record example:**
```json
{
  "id": "uuid",
  "play_id": "play-uuid",
  "assignment_id": "assignment-uuid",
  "position": "QB",
  "card_type": "assignment",
  "category": "alignment",
  "question_prompt": "Where do you line up as the QB?",
  "correct_answer": "Shotgun",
  "hints": ["Shotgun", "Split left", "Inline right", "Slot left"],
  "difficulty": "beginner",
  "is_auto_generated": true,
  "is_active": true
}
```

**Note:** The `hints` field stores the shuffled multiple choice options as a JSON array.

## Question Categories

Each position gets 3 flashcards:

1. **Alignment** (beginner difficulty)
   - "Where do you line up as the [position]?"
   - Tests: Pre-snap positioning

2. **Assignment** (intermediate difficulty)
   - "What is your assignment as the [position]?"
   - Tests: Main responsibility (pass protect, run route, block, etc.)

3. **Key Read** (intermediate difficulty)
   - "What is your key read as the [position]?"
   - Tests: What to watch/react to (linebacker, safety, coverage, etc.)

## Example: Full QB Quiz

**Play:** Spread Right 2-Jet E Drive

### Question 1 - Alignment
```
Where do you line up as the QB?

Options:
[ ] Inline right
[ ] Offset right
[✓] Shotgun          ← Correct
[ ] Split left
```

### Question 2 - Assignment
```
What is your assignment as the QB?

Options:
[ ] Shallow cross
[✓] Pass             ← Correct
[ ] Pass protect
[ ] Seam route
```

### Question 3 - Key Read
```
What is your key read as the QB?

Options:
[ ] Blitzing linebacker
[✓] Mike linebacker   ← Correct
[ ] Cornerback leverage
[ ] Safety rotation
```

**Result:** 3/3 correct = 100% accuracy!

## Benefits

✅ **No typing required** - Just click answers
✅ **Instant feedback** - Green/red visual indicators
✅ **Realistic distractors** - Uses actual positions from the play
✅ **Automatic generation** - No manual card creation needed
✅ **Position-specific** - Each position has unique questions
✅ **Progress tracking** - See score during quiz
✅ **Accuracy calculation** - Know your performance

## Testing

### Test the Full Flow

1. **Generate Play Content:**
   ```
   Upload play → Generate AI Content → Approve
   ```

2. **Check Database:**
   ```sql
   SELECT
     position,
     category,
     question_prompt,
     correct_answer,
     hints
   FROM flashcard_templates
   WHERE play_id = 'your-play-id'
     AND card_type = 'assignment'
   ORDER BY position, category;
   ```

   Should see:
   - 3 cards per position (alignment, assignment, read)
   - Each card has 2-4 options in `hints` field
   - Options are shuffled

3. **Test Quiz:**
   - Go to `/games/assignment`
   - Select the play
   - Select QB position
   - Click "Start Quiz"
   - Should see 3 questions
   - Answer all 3
   - Should see completion screen with accuracy

### Expected Output

For a play with 6 positions (QB, RB, X, Z, H, TE):
- **18 flashcards total** (6 positions × 3 questions each)
- **Alignment questions:** 6
- **Assignment questions:** 6
- **Key Read questions:** 6

## Notes

- Minimum 2 options required per question (correct + 1 distractor)
- If not enough unique options, question is skipped
- Options are shuffled every time the flashcard is created
- Options are NOT re-shuffled when displayed (consistent across attempts)
- Empty or duplicate options are filtered out

## Future Enhancements

1. **Track Attempt History:**
   - Save attempts to `player_flashcard_attempts` table
   - Show player's historical performance per card

2. **Adaptive Learning:**
   - Show harder questions more frequently
   - Focus on questions player gets wrong

3. **More Question Types:**
   - Route depth questions for receivers
   - Landmark questions
   - Coverage adjustment questions

4. **Better Distractors:**
   - Use GPT to generate more challenging wrong answers
   - Add common mistakes as distractors

5. **Explanation Field:**
   - Add explanations for why answers are correct/incorrect
   - Show after answer is submitted

## Summary

The assignment flashcards system provides an engaging, efficient way for players to learn their position-specific responsibilities. Multiple choice format makes it quick to answer, visual feedback makes it clear when they're right or wrong, and automatic generation means coaches don't have to create cards manually.

Players can now:
1. Study their assignment details
2. Quiz themselves with multiple choice questions
3. Get instant feedback
4. See their accuracy
5. Learn faster with no typing required
