# Complete API Testing Guide

This guide covers testing all refactored API endpoints for the Plays, Flashcards, and Quiz systems.

---

## Prerequisites

### 1. Database Migration
Ensure you've run the migration from `migrations/migration_to_org_scoped.sql` (✅ Already completed)

### 2. Start Local Development Server
```bash
# Terminal 1: Start Netlify functions
netlify dev

# Your endpoints will be available at:
# http://localhost:8888/.netlify/functions/*
```

### 3. Get JWT Tokens

**Login via Browser Console:**
```javascript
// In browser console on your app
const { data } = await supabase.auth.getSession();
console.log('Coach Token:', data.session.access_token);
```

**Or via cURL:**
```bash
curl -X POST 'https://your-project.supabase.co/auth/v1/token?grant_type=password' \
  -H 'apikey: YOUR_ANON_KEY' \
  -H 'Content-Type: application/json' \
  -d '{
    "email": "coach@example.com",
    "password": "your-password"
  }'
```

---

## Part 1: Plays API Testing

### Test 1.1: Create a Play (Coach)

```bash
curl -X POST http://localhost:8888/.netlify/functions/plays-create \
  -H "Authorization: Bearer YOUR_COACH_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "orgId": "test-org-id",
    "teamId": "test-team-id",
    "playbookMetadataId": "metadata-uuid",
    "name": "Mesh Concept",
    "playType": "PASS",
    "formationName": "Shotgun Spread",
    "concept": "Mesh",
    "triggerProcessing": false
  }'
```

**Expected Response (201):**
```json
{
  "success": true,
  "playId": "new-play-uuid",
  "status": "draft",
  "message": "Play created as draft"
}
```

**Save the playId** for subsequent tests.

### Test 1.2: List Plays as Coach

```bash
curl -X GET 'http://localhost:8888/.netlify/functions/plays-list?orgId=test-org-id' \
  -H "Authorization: Bearer YOUR_COACH_JWT_TOKEN"
```

**Expected Response (200):**
```json
{
  "plays": [
    {
      "id": "play-uuid",
      "name": "Mesh Concept",
      "shortName": "Mesh",
      "formationName": "Shotgun Spread",
      "concept": "Mesh",
      "playType": "PASS",
      "contentStatus": "draft",
      "isPublished": false,
      "createdAt": "2024-02-10T15:30:00Z",
      "playbook_metadata": { ... }
    }
  ],
  "total": 1,
  "limit": 50,
  "offset": 0
}
```

### Test 1.3: List Plays as Player (Should See None)

```bash
curl -X GET 'http://localhost:8888/.netlify/functions/plays-list?orgId=test-org-id' \
  -H "Authorization: Bearer YOUR_PLAYER_JWT_TOKEN"
```

**Expected Response (200):**
```json
{
  "plays": [],
  "total": 0,
  "limit": 50,
  "offset": 0
}
```

*Note: Players only see published, approved plays*

### Test 1.4: Get Play Details

```bash
curl -X GET 'http://localhost:8888/.netlify/functions/plays-get/PLAY_UUID?includeAssignments=true&includeFlashcards=true' \
  -H "Authorization: Bearer YOUR_COACH_JWT_TOKEN"
```

**Expected Response (200):**
```json
{
  "play": {
    "id": "play-uuid",
    "name": "Mesh Concept",
    "contentStatus": "draft",
    "isPublished": false,
    ...
  },
  "assignments": [],
  "flashcards": []
}
```

### Test 1.5: Trigger Background Processing

```bash
curl -X POST http://localhost:8888/.netlify/functions/plays-process/PLAY_UUID \
  -H "Authorization: Bearer YOUR_COACH_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "generateInsights": true,
    "generateAssignments": true,
    "generateKnowledge": true
  }'
```

**Expected Response (202 Accepted):**
```json
{
  "success": true,
  "playId": "play-uuid",
  "status": "generating",
  "message": "Background processing started. Check play status for completion."
}
```

Wait 30-60 seconds for processing to complete, then check play status:

```bash
curl -X GET http://localhost:8888/.netlify/functions/plays-get/PLAY_UUID \
  -H "Authorization: Bearer YOUR_COACH_JWT_TOKEN"
```

**Expected:** `contentStatus` should be `"draft"` (processing complete)

### Test 1.6: Approve the Play

```bash
curl -X PATCH http://localhost:8888/.netlify/functions/plays-update-status/PLAY_UUID \
  -H "Authorization: Bearer YOUR_COACH_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "contentStatus": "approved"
  }'
```

**Expected Response (200):**
```json
{
  "success": true,
  "play": {
    "id": "play-uuid",
    "contentStatus": "approved",
    "isPublished": false
  }
}
```

### Test 1.7: Publish the Play

```bash
curl -X PATCH http://localhost:8888/.netlify/functions/plays-update-status/PLAY_UUID \
  -H "Authorization: Bearer YOUR_COACH_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "isPublished": true
  }'
```

**Expected Response (200):**
```json
{
  "success": true,
  "play": {
    "id": "play-uuid",
    "contentStatus": "approved",
    "isPublished": true
  }
}
```

### Test 1.8: Player Can Now See Play

```bash
curl -X GET 'http://localhost:8888/.netlify/functions/plays-list?orgId=test-org-id' \
  -H "Authorization: Bearer YOUR_PLAYER_JWT_TOKEN"
```

**Expected Response (200):**
```json
{
  "plays": [
    {
      "id": "play-uuid",
      "name": "Mesh Concept",
      "contentStatus": "approved",
      "isPublished": true
    }
  ],
  "total": 1
}
```

---

## Part 2: Flashcards API Testing

### Test 2.1: List All Flashcards (Coach)

```bash
curl -X GET 'http://localhost:8888/.netlify/functions/flashcards-list?orgId=test-org-id' \
  -H "Authorization: Bearer YOUR_COACH_JWT_TOKEN"
```

**Expected Response (200):**
```json
{
  "flashcards": [
    {
      "id": "flashcard-uuid",
      "playId": "play-uuid",
      "position": "QB",
      "category": "assignment",
      "cardType": "assignment",
      "questionPrompt": "What is your assignment as the QB?",
      "correctAnswer": "Read high-low progression",
      "hints": ["Read high-low progression", "Check down", "Scramble", "Throw away"],
      "difficulty": "intermediate",
      "isAutoGenerated": true,
      "isActive": true,
      "play": {
        "id": "play-uuid",
        "name": "Mesh Concept",
        "playType": "PASS"
      }
    }
  ],
  "total": 10,
  "limit": 100,
  "offset": 0
}
```

### Test 2.2: Filter Flashcards by Position

```bash
curl -X GET 'http://localhost:8888/.netlify/functions/flashcards-list?orgId=test-org-id&position=QB&difficulty=intermediate' \
  -H "Authorization: Bearer YOUR_COACH_JWT_TOKEN"
```

**Expected:** Only QB flashcards with intermediate difficulty

### Test 2.3: Filter by Card Type

```bash
curl -X GET 'http://localhost:8888/.netlify/functions/flashcards-list?orgId=test-org-id&cardType=knowledge' \
  -H "Authorization: Bearer YOUR_COACH_JWT_TOKEN"
```

**Expected:** Only knowledge cards (not position-specific)

### Test 2.4: Regenerate Flashcards

```bash
curl -X POST http://localhost:8888/.netlify/functions/flashcards-regenerate/PLAY_UUID \
  -H "Authorization: Bearer YOUR_COACH_JWT_TOKEN"
```

**Expected Response (200):**
```json
{
  "success": true,
  "message": "Existing flashcards deactivated. Trigger play processing to regenerate.",
  "playId": "play-uuid"
}
```

Then trigger processing again to regenerate:

```bash
curl -X POST http://localhost:8888/.netlify/functions/plays-process/PLAY_UUID \
  -H "Authorization: Bearer YOUR_COACH_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "generateAssignments": true,
    "generateKnowledge": true
  }'
```

---

## Part 3: Quiz System Testing

### Test 3.1: Create Quiz Assignment from Flashcards (Coach)

First, collect flashcard IDs from the flashcards list endpoint, then:

```bash
curl -X POST http://localhost:8888/.netlify/functions/quizzes-assignments-create \
  -H "Authorization: Bearer YOUR_COACH_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "orgId": "test-org-id",
    "teamId": "test-team-id",
    "title": "Week 3 QB Quiz",
    "description": "Mesh Concept Quiz",
    "assignedToPosition": "QB",
    "dueDate": "2024-03-01T17:00:00Z",
    "passingScore": 80,
    "maxAttempts": 3,
    "timeLimitSeconds": 600,
    "randomizeQuestions": true,
    "flashcardIds": [
      "flashcard-1",
      "flashcard-2",
      "flashcard-3",
      "flashcard-4"
    ]
  }'
```

**Expected Response (201):**
```json
{
  "success": true,
  "quizAssignmentId": "quiz-assignment-uuid",
  "message": "Quiz assigned to 2 user(s)",
  "assignment": {
    "id": "quiz-assignment-uuid",
    "title": "Week 3 QB Quiz",
    "totalQuestions": 4,
    "dueDate": "2024-03-01T17:00:00Z",
    "targetCount": 2
  }
}
```

### Test 3.2: Player Lists Assigned Quizzes

```bash
curl -X GET 'http://localhost:8888/.netlify/functions/quizzes-assignments-list?orgId=test-org-id&assignedToMe=true' \
  -H "Authorization: Bearer YOUR_PLAYER_JWT_TOKEN"
```

**Expected Response (200):**
```json
{
  "assignments": [
    {
      "id": "quiz-assignment-uuid",
      "title": "Week 3 QB Quiz",
      "description": "Mesh Concept Quiz",
      "dueDate": "2024-03-01T17:00:00Z",
      "passingScore": 80,
      "maxAttempts": 3,
      "totalQuestions": 4,
      "status": "active",
      "myAttempts": 0,
      "bestScore": null,
      "canAttempt": true
    }
  ],
  "total": 1
}
```

### Test 3.3: Player Starts Quiz Attempt

```bash
curl -X POST http://localhost:8888/.netlify/functions/quizzes-attempts-start \
  -H "Authorization: Bearer YOUR_PLAYER_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "quizAssignmentId": "quiz-assignment-uuid"
  }'
```

**Expected Response (201):**
```json
{
  "attemptId": "attempt-uuid",
  "quizAssignmentId": "quiz-assignment-uuid",
  "attemptNumber": 1,
  "startedAt": "2024-02-10T15:30:00Z",
  "totalQuestions": 4,
  "timeLimitSeconds": 600,
  "questions": [
    {
      "questionNumber": 1,
      "flashcardId": "flashcard-1",
      "question": "What is your assignment as the QB?",
      "hints": ["Read high-low progression", "Check down", "Scramble", "Throw away"],
      "difficulty": "intermediate",
      "category": "assignment",
      "points": 1
    }
    // ... more questions
  ]
}
```

**Save the attemptId** for submission.

### Test 3.4: Player Submits Quiz Answers

```bash
curl -X POST http://localhost:8888/.netlify/functions/quizzes-attempts-submit/ATTEMPT_UUID/submit \
  -H "Authorization: Bearer YOUR_PLAYER_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "answers": [
      {
        "flashcardId": "flashcard-1",
        "userAnswer": "Read high-low progression",
        "responseTimeMs": 3500
      },
      {
        "flashcardId": "flashcard-2",
        "userAnswer": "Shotgun",
        "responseTimeMs": 2800
      },
      {
        "flashcardId": "flashcard-3",
        "userAnswer": "Middle linebacker",
        "responseTimeMs": 4200
      },
      {
        "flashcardId": "flashcard-4",
        "userAnswer": "Cover 2",
        "responseTimeMs": 3100
      }
    ]
  }'
```

**Expected Response (200):**
```json
{
  "attemptId": "attempt-uuid",
  "scorePercentage": 100,
  "passed": true,
  "correctAnswers": 4,
  "totalQuestions": 4,
  "timeTakenSeconds": 245,
  "xpEarned": 115,
  "message": "Congratulations! You passed!",
  "results": [
    {
      "flashcardId": "flashcard-1",
      "isCorrect": true,
      "userAnswer": "Read high-low progression"
    },
    {
      "flashcardId": "flashcard-2",
      "isCorrect": true,
      "userAnswer": "Shotgun"
    },
    {
      "flashcardId": "flashcard-3",
      "isCorrect": true,
      "userAnswer": "Middle linebacker"
    },
    {
      "flashcardId": "flashcard-4",
      "isCorrect": true,
      "userAnswer": "Cover 2"
    }
  ]
}
```

---

## Part 4: Error Case Testing

### Test 4.1: Player Tries to Create Play (Should Fail)

```bash
curl -X POST http://localhost:8888/.netlify/functions/plays-create \
  -H "Authorization: Bearer YOUR_PLAYER_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "orgId": "test-org-id",
    "playbookMetadataId": "metadata-uuid",
    "name": "Test Play"
  }'
```

**Expected Response (403):**
```json
{
  "error": "This action requires coach role or higher. You have player role.",
  "code": "FORBIDDEN"
}
```

### Test 4.2: Access Wrong Org's Data (Should Fail)

```bash
curl -X GET 'http://localhost:8888/.netlify/functions/plays-list?orgId=wrong-org-id' \
  -H "Authorization: Bearer YOUR_COACH_JWT_TOKEN"
```

**Expected Response (403):**
```json
{
  "error": "orgId must match your organization",
  "code": "VALIDATION_ERROR"
}
```

### Test 4.3: Player Accesses Unpublished Play (Should Fail)

```bash
curl -X GET http://localhost:8888/.netlify/functions/plays-get/UNPUBLISHED_PLAY_UUID \
  -H "Authorization: Bearer YOUR_PLAYER_JWT_TOKEN"
```

**Expected Response (403):**
```json
{
  "error": "This play is not available",
  "code": "FORBIDDEN"
}
```

### Test 4.4: Publish Unapproved Play (Should Fail)

```bash
curl -X PATCH http://localhost:8888/.netlify/functions/plays-update-status/DRAFT_PLAY_UUID \
  -H "Authorization: Bearer YOUR_COACH_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "isPublished": true
  }'
```

**Expected Response (400):**
```json
{
  "error": "Can only publish approved plays",
  "code": "VALIDATION_ERROR"
}
```

### Test 4.5: Exceed Max Quiz Attempts (Should Fail)

After taking 3 attempts (if maxAttempts = 3):

```bash
curl -X POST http://localhost:8888/.netlify/functions/quizzes-attempts-start \
  -H "Authorization: Bearer YOUR_PLAYER_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "quizAssignmentId": "quiz-assignment-uuid"
  }'
```

**Expected Response (409):**
```json
{
  "error": "You have reached the maximum number of attempts (3)",
  "code": "CONFLICT"
}
```

---

## Part 5: Database Verification

After testing, verify the database state:

### Check Plays Created

```sql
SELECT id, name, org_id, content_status, is_published
FROM plays
WHERE org_id = 'test-org-id'
ORDER BY created_at DESC;
```

### Check Flashcards Generated

```sql
SELECT ft.id, ft.position, ft.question_prompt, ft.is_active, p.name as play_name
FROM flashcard_templates ft
JOIN plays p ON ft.play_id = p.id
WHERE p.org_id = 'test-org-id'
ORDER BY ft.created_at DESC;
```

### Check Quiz Assignments

```sql
SELECT qa.id, qa.title, qa.assigned_to_position, COUNT(qaq.id) as question_count
FROM quiz_assignments qa
LEFT JOIN quiz_assignment_questions qaq ON qa.id = qaq.quiz_assignment_id
WHERE qa.org_id = 'test-org-id'
GROUP BY qa.id, qa.title, qa.assigned_to_position;
```

### Check Quiz Attempts

```sql
SELECT qa.id, qa.user_id, qa.attempt_number, qa.score_percentage, qa.passed
FROM quiz_attempts qa
JOIN quiz_assignments qas ON qa.quiz_assignment_id = qas.id
WHERE qas.org_id = 'test-org-id'
ORDER BY qa.started_at DESC;
```

### Check XP Awarded

```sql
SELECT * FROM xp_events
WHERE org_id = 'test-org-id'
  AND event_type = 'quiz_completion'
ORDER BY created_at DESC;
```

### Check Spaced Repetition Updates

```sql
SELECT
  u.email,
  ft.question_prompt,
  pfp.ease_factor,
  pfp.interval_days,
  pfp.due_date,
  pfp.times_shown,
  pfp.times_correct
FROM player_flashcard_progress pfp
JOIN users u ON pfp.user_id = u.id
JOIN flashcard_templates ft ON pfp.flashcard_id = ft.id
WHERE ft.play_id IN (SELECT id FROM plays WHERE org_id = 'test-org-id')
ORDER BY pfp.last_reviewed_at DESC;
```

---

## Summary Checklist

### Plays Workflow
- [ ] Coach creates play
- [ ] Coach triggers background processing
- [ ] Play status: draft → generating → draft
- [ ] Assignments and flashcards are generated
- [ ] Coach approves play
- [ ] Coach publishes play
- [ ] Player can view published play
- [ ] Player cannot access unpublished play

### Flashcards Workflow
- [ ] Coach lists all flashcards (question bank)
- [ ] Filter by position, difficulty, category works
- [ ] Coach regenerates flashcards for a play
- [ ] Player sees only flashcards from published plays

### Quiz Workflow
- [ ] Coach creates quiz from flashcards
- [ ] Player lists assigned quizzes
- [ ] Player starts quiz attempt
- [ ] Questions are randomized (if enabled)
- [ ] Player submits answers
- [ ] Grading is accurate
- [ ] XP is awarded for passing
- [ ] Spaced repetition is updated

### Security & RBAC
- [ ] Players cannot create/edit plays
- [ ] Players cannot access unpublished content
- [ ] Users cannot access other org's data
- [ ] Invalid org_id is rejected
- [ ] Max attempts enforced
- [ ] Only approved plays can be published

---

## Common Issues & Solutions

### Issue: "Missing authorization token"
**Solution:** Ensure you're passing the JWT token in the `Authorization: Bearer <token>` header

### Issue: "orgId must match your organization"
**Solution:** Verify the user has an active org_membership record with the correct org_id

### Issue: "This play is not available"
**Solution:** For players, ensure the play is both published AND approved

### Issue: "Flashcards not found or inactive"
**Solution:** Ensure flashcards exist, are active, and belong to published plays (for players)

### Issue: Background processing never completes
**Solution:** Check Netlify function logs for errors. Verify GPT_KEY environment variable is set.

---

## Next Steps

After all tests pass:
1. Update frontend to use new API endpoints
2. Deprecate/remove old endpoints
3. Deploy to production
4. Monitor error rates and performance

Happy testing! 🚀
