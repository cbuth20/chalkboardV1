# Testing the New AI Question Generation System

## ✅ What We've Completed

1. **Database Migration** - Added enhanced schema for question types, topics, and metadata
2. **AI Question Generation** - Updated `process-play-content-background.ts` to use GPT-4 for questions
3. **Regenerate Endpoint** - Created `questions-regenerate.ts` for refreshing questions
4. **UI Integration** - Added "Regenerate Questions" button to coach playbook page
5. **Improved Prompts** - Cleaned up `analysis-prompts.ts` for better AI output

## 🧪 How to Test

### Test 1: Upload a New Play

1. **Go to Coach Playbook Page**
   - Navigate to `/coach/playbook`

2. **Click "Upload Plays"**
   - Upload a play diagram (PDF or image)
   - Fill in metadata (Unit, Section, etc.)
   - Submit

3. **Wait for Processing**
   - Play status will show "generating"
   - Background function processes the play (~30-60 seconds)
   - Questions are automatically generated

4. **Check Results**
   - Play status changes to "draft"
   - View the play details (click to expand)
   - Questions should be created in the database

### Test 2: Regenerate Questions for Existing Play

1. **Go to Coach Playbook Page**
   - Find an approved play
   - Click on it to expand details

2. **Click "Regenerate Questions"**
   - Confirm the regeneration
   - Wait ~10-20 seconds
   - You should see a success message

3. **Verify New Questions**
   - Check database: `SELECT * FROM flashcard_templates WHERE play_id = 'your-play-id' AND is_active = true ORDER BY created_at DESC;`
   - Old questions should have `is_active = false`
   - New questions should have new `question_type`, `topic`, etc.

### Test 3: Check Question Quality

**Database Query:**
```sql
SELECT
  question_type,
  topic,
  difficulty,
  question_prompt,
  correct_answer,
  options,
  scenario_context,
  learning_objective,
  tags
FROM flashcard_templates
WHERE play_id = 'YOUR_PLAY_ID'
  AND is_active = true
ORDER BY difficulty, position;
```

**What to Look For:**
- ✅ Variety of question types (multiple_choice, true_false, scenario)
- ✅ Different topics (route_running, coverage_adjustments, alignment_rules)
- ✅ Progressive difficulty (beginner → intermediate → advanced)
- ✅ Realistic scenarios ("3rd and 7 vs Cover 2...")
- ✅ Clear explanations
- ✅ Appropriate tags (["3rd_down", "red_zone"])

### Test 4: View Questions by Topic

```sql
-- Group questions by topic
SELECT
  topic,
  COUNT(*) as question_count,
  array_agg(DISTINCT difficulty) as difficulty_levels,
  array_agg(DISTINCT question_type) as question_types
FROM flashcard_templates
WHERE is_active = true
  AND org_id = 'YOUR_ORG_ID'
GROUP BY topic
ORDER BY question_count DESC;
```

### Test 5: Check Fallback Behavior

**Simulate AI Failure:**
1. Temporarily set invalid OpenAI key in environment
2. Upload a new play
3. Should fall back to old `generateAssignmentFlashcards` function
4. Questions still created (basic ones)
5. No errors thrown

## 📊 Expected Results

### Question Distribution Example

For a play with 8 assignments:

| Type | Count | Difficulty | Topics |
|------|-------|------------|--------|
| multiple_choice | 5 | 2 beginner, 2 int, 1 adv | alignment_rules, route_running, coverage_recognition |
| true_false | 3 | 1 beginner, 2 int | formation_identification, coverage_adjustments |
| scenario | 4 | 3 int, 1 adv | situational_football, play_concepts |
| **Total** | **12** | 3B, 7I, 2A | Mixed topics |

### Sample Questions You Should See

**Beginner - Multiple Choice:**
```
Q: Where does the X receiver line up in Trips Right formation?
A: Split left 12 yards ✓
   Split right 12 yards
   Slot left
   Tight to the line
```

**Intermediate - True/False:**
```
Q: Against Cover 2, the Z receiver should sit at 8 yards in the window between the corner and linebacker.
A: True ✓
Explanation: Against 2-high safeties, the corner carries #1 vertical and the linebacker takes #3...
```

**Advanced - Scenario:**
```
Context: 3rd and 7 from midfield, trips right formation, Cover 2 shell pre-snap
Q: As the H receiver (middle of trips), what adjustment do you make when you see the safety stay in the middle post-snap?
A: Sit in the window at 8 yards instead of running through
Explanation: With the safety staying middle, there's a natural window between the corner and hook player...
```

## 🐛 Common Issues & Solutions

### Issue 1: No questions generated
**Symptoms:** Play created but `flashcard_templates` table empty

**Debug:**
```sql
-- Check if play has assignments
SELECT * FROM play_assignments WHERE play_id = 'YOUR_PLAY_ID';

-- Check function logs
-- Look in Netlify Functions logs for errors
```

**Solution:** Play must have assignments for questions to generate

### Issue 2: All questions are "multiple_choice"
**Symptoms:** Only seeing one question type

**Check:**
- OpenAI response in logs
- `question_type` field should vary
- May be AI not following format

**Solution:** Regenerate questions, check prompts

### Issue 3: Questions seem low quality
**Symptoms:** Distractors don't make sense, questions too easy/hard

**Solution:**
- Adjust difficulty distribution in prompt
- Tweak system prompt in `question-generation-prompts.ts`
- Regenerate questions

### Issue 4: Fallback questions showing
**Symptoms:** Only seeing basic "Where do you line up?" questions

**This means:** AI generation failed, fell back to old system

**Check:**
- OpenAI API key valid?
- Rate limits hit?
- Check logs for error messages

## 🎯 Success Metrics

After testing, you should see:

- ✅ 10-12 questions per play (varies by complexity)
- ✅ 3-5 different question types per play
- ✅ Questions span multiple difficulty levels
- ✅ Topics match play content (route plays → route_running questions)
- ✅ Scenario questions include game context
- ✅ Explanations are clear and educational
- ✅ Tags match play characteristics

## 📝 Feedback Loop

As you test, note:

1. **Question Quality**
   - Are questions clear and unambiguous?
   - Are distractors realistic?
   - Are explanations helpful?

2. **Content Coverage**
   - Does it test what players need to know?
   - Right balance of memorization vs. application?
   - Missing any important topics?

3. **Difficulty Progression**
   - Beginner questions truly basic?
   - Advanced questions appropriately challenging?
   - Smooth progression?

## 🚀 Next Steps After Testing

Once basic generation works:

1. **Create Quiz Assignment UI** - Let coaches build quizzes from questions
2. **Update Player Quiz Interface** - Handle new question types
3. **Add Question Preview** - Show questions before assigning
4. **Build Analytics** - Track which questions players struggle with
5. **Add Question Editing** - Let coaches refine AI questions
6. **Batch Generation** - Generate for multiple plays at once

## 📞 Need Help?

If something isn't working:

1. Check Netlify function logs
2. Check browser console for errors
3. Verify OpenAI API key is set
4. Check database for question records
5. Try regenerating questions manually

---

**Ready to test!** Start by uploading a new play or regenerating questions for an existing one.
