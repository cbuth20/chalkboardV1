# API Testing Guide
## How to Test the New Quiz Endpoints

---

## Prerequisites

### 1. Run Database Migration
```bash
# From Supabase dashboard SQL editor or local psql
psql -h your-db-host -U user -d database -f migrations/migration_to_org_scoped.sql
```

### 2. Start Local Development Server
```bash
# Terminal 1: Start Netlify functions
netlify dev

# Or if you prefer to test functions directly
netlify functions:serve
```

Your endpoints will be available at:
- `http://localhost:8888/.netlify/functions/quizzes-assignments-create`
- `http://localhost:8888/.netlify/functions/quizzes-assignments-list`
- etc.

---

## Test Data Setup

### 1. Create Test Organization & Users

```sql
-- Create test organization
INSERT INTO organizations (id, owner_id, name, slug)
VALUES (
  'test-org-id',
  (SELECT id FROM users WHERE email = 'your-email@example.com'),
  'Test High School',
  'test-high-school'
);

-- Create test team
INSERT INTO teams (id, org_id, name, slug)
VALUES (
  'test-team-id',
  'test-org-id',
  'Varsity Football',
  'varsity'
);

-- Create coach membership
INSERT INTO org_memberships (org_id, user_id, role, team_id, is_active)
VALUES (
  'test-org-id',
  (SELECT id FROM users WHERE email = 'coach@example.com'),
  'coach',
  'test-team-id',
  true
);

-- Create player memberships
INSERT INTO org_memberships (org_id, user_id, role, team_id, position_code, is_active)
VALUES
  (
    'test-org-id',
    (SELECT id FROM users WHERE email = 'player-qb@example.com'),
    'player',
    'test-team-id',
    'QB',
    true
  ),
  (
    'test-org-id',
    (SELECT id FROM users WHERE email = 'player-wr@example.com'),
    'player',
    'test-team-id',
    'WR',
    true
  );
```

### 2. Create Test Play & Flashcards

```sql
-- Create test play
INSERT INTO plays (id, org_id, team_id, name, play_type, content_status, is_published)
VALUES (
  'test-play-id',
  'test-org-id',
  'test-team-id',
  'Mesh Concept',
  'PASS',
  'approved',
  true
);

-- Create test flashcards
INSERT INTO flashcard_templates (id, org_id, play_id, position, category, card_type, question_prompt, correct_answer, hints, difficulty, is_active)
VALUES
  (
    'flashcard-1',
    'test-org-id',
    'test-play-id',
    'QB',
    'assignment',
    'assignment',
    'What is your assignment as the QB?',
    'Read high-low progression',
    '["Read high-low progression", "Check down", "Scramble", "Throw away"]',
    'intermediate',
    true
  ),
  (
    'flashcard-2',
    'test-org-id',
    'test-play-id',
    'QB',
    'alignment',
    'assignment',
    'Where do you line up as the QB?',
    'Shotgun',
    '["Shotgun", "Under center", "Pistol", "Empty"]',
    'beginner',
    true
  ),
  (
    'flashcard-3',
    'test-org-id',
    'test-play-id',
    'WR',
    'route',
    'assignment',
    'What route do you run as the X receiver?',
    '15-yard dig',
    '["15-yard dig", "Go route", "Out route", "Slant"]',
    'intermediate',
    true
  ),
  (
    'flashcard-4',
    'test-org-id',
    'test-play-id',
    'QB',
    'read',
    'assignment',
    'What is your key read as the QB?',
    'Middle linebacker',
    '["Middle linebacker", "Free safety", "Cornerback", "Slot defender"]',
    'intermediate',
    true
  ),
  (
    'flashcard-5',
    'test-org-id',
    'test-play-id',
    'QB',
    'coverage',
    'knowledge',
    'What coverage is best to attack with this play?',
    'Cover 2',
    '["Cover 2", "Cover 3", "Man", "Cover 4"]',
    'intermediate',
    true
  );
```

---

## Testing with Postman/Insomnia

### Get Your JWT Token

1. **Login via Supabase**
   ```javascript
   // In browser console on your app
   const { data } = await supabase.auth.getSession();
   console.log(data.session.access_token);
   ```

2. **Or via API**
   ```bash
   curl -X POST 'https://your-project.supabase.co/auth/v1/token?grant_type=password' \
     -H 'apikey: YOUR_ANON_KEY' \
     -H 'Content-Type: application/json' \
     -d '{
       "email": "coach@example.com",
       "password": "your-password"
     }'
   ```

### Test 1: Create Quiz Assignment (Coach)

```bash
curl -X POST http://localhost:8888/.netlify/functions/quizzes-assignments-create \
  -H "Authorization: Bearer YOUR_COACH_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "orgId": "test-org-id",
    "teamId": "test-team-id",
    "title": "Week 3 QB Quiz",
    "description": "Cover 2 vs Cover 3 reads for Mesh concept",
    "assignedToPosition": "QB",
    "dueDate": "2024-03-01T17:00:00Z",
    "passingScore": 80,
    "maxAttempts": 3,
    "timeLimitSeconds": 600,
    "randomizeQuestions": true,
    "flashcardIds": [
      "flashcard-1",
      "flashcard-2",
      "flashcard-4",
      "flashcard-5"
    ]
  }'
```

**Expected Response (201):**
```json
{
  "success": true,
  "quizAssignmentId": "new-assignment-uuid",
  "message": "Quiz assigned to 1 user(s)",
  "assignment": {
    "id": "new-assignment-uuid",
    "title": "Week 3 QB Quiz",
    "totalQuestions": 4,
    "dueDate": "2024-03-01T17:00:00Z",
    "targetCount": 1
  }
}
```

### Test 2: List Quiz Assignments (Player)

```bash
# Get player JWT token first (for player-qb@example.com)
curl -X GET 'http://localhost:8888/.netlify/functions/quizzes-assignments-list?orgId=test-org-id&assignedToMe=true' \
  -H "Authorization: Bearer YOUR_PLAYER_JWT_TOKEN"
```

**Expected Response (200):**
```json
{
  "assignments": [
    {
      "id": "assignment-uuid",
      "title": "Week 3 QB Quiz",
      "description": "Cover 2 vs Cover 3 reads for Mesh concept",
      "dueDate": "2024-03-01T17:00:00Z",
      "passingScore": 80,
      "maxAttempts": 3,
      "timeLimitSeconds": 600,
      "totalQuestions": 4,
      "status": "active",
      "isActive": true,
      "myAttempts": 0,
      "bestScore": null,
      "lastAttempt": null,
      "canAttempt": true
    }
  ],
  "total": 1
}
```

### Test 3: Get Quiz Assignment Details (Player)

```bash
curl -X GET http://localhost:8888/.netlify/functions/quizzes-assignments-get/ASSIGNMENT_UUID \
  -H "Authorization: Bearer YOUR_PLAYER_JWT_TOKEN"
```

**Expected Response (200):**
```json
{
  "assignment": {
    "id": "assignment-uuid",
    "title": "Week 3 QB Quiz",
    "description": "Cover 2 vs Cover 3 reads for Mesh concept",
    "dueDate": "2024-03-01T17:00:00Z",
    "passingScore": 80,
    "maxAttempts": 3,
    "timeLimitSeconds": 600,
    "totalQuestions": 4
  },
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
  ],
  "attempts": [],
  "canAttempt": true
}
```

### Test 4: Start Quiz Attempt (Player)

```bash
curl -X POST http://localhost:8888/.netlify/functions/quizzes-attempts-start \
  -H "Authorization: Bearer YOUR_PLAYER_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "quizAssignmentId": "ASSIGNMENT_UUID"
  }'
```

**Expected Response (201):**
```json
{
  "attemptId": "attempt-uuid",
  "quizAssignmentId": "assignment-uuid",
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
    // ... more questions (possibly shuffled)
  ]
}
```

### Test 5: Submit Quiz Attempt (Player)

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
        "flashcardId": "flashcard-4",
        "userAnswer": "Middle linebacker",
        "responseTimeMs": 4200
      },
      {
        "flashcardId": "flashcard-5",
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
      "flashcardId": "flashcard-4",
      "isCorrect": true,
      "userAnswer": "Middle linebacker"
    },
    {
      "flashcardId": "flashcard-5",
      "isCorrect": true,
      "userAnswer": "Cover 2"
    }
  ]
}
```

---

## Error Case Testing

### Test: Player tries to access coach endpoint

```bash
curl -X POST http://localhost:8888/.netlify/functions/quizzes-assignments-create \
  -H "Authorization: Bearer YOUR_PLAYER_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{...}'
```

**Expected Response (403):**
```json
{
  "error": "This action requires coach role or higher. You have player role.",
  "code": "FORBIDDEN"
}
```

### Test: Invalid orgId

```bash
curl -X GET 'http://localhost:8888/.netlify/functions/quizzes-assignments-list?orgId=wrong-org-id' \
  -H "Authorization: Bearer YOUR_PLAYER_JWT_TOKEN"
```

**Expected Response (403):**
```json
{
  "error": "You are not a member of this organization",
  "code": "FORBIDDEN"
}
```

### Test: Exceed max attempts

```bash
# After taking 3 attempts (maxAttempts = 3)
curl -X POST http://localhost:8888/.netlify/functions/quizzes-attempts-start \
  -H "Authorization: Bearer YOUR_PLAYER_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "quizAssignmentId": "ASSIGNMENT_UUID"
  }'
```

**Expected Response (409):**
```json
{
  "error": "You have reached the maximum number of attempts (3)",
  "code": "CONFLICT"
}
```

### Test: Submit attempt twice

```bash
# Submit the same attempt twice
curl -X POST http://localhost:8888/.netlify/functions/quizzes-attempts-submit/ATTEMPT_UUID/submit \
  -H "Authorization: Bearer YOUR_PLAYER_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{...}'
```

**Expected Response (409):**
```json
{
  "error": "This attempt has already been submitted",
  "code": "CONFLICT"
}
```

---

## Verification Queries

After testing, verify the database state:

### Check quiz assignment was created
```sql
SELECT * FROM quiz_assignments WHERE org_id = 'test-org-id';
```

### Check quiz questions were linked
```sql
SELECT qa.title, COUNT(qaq.id) as question_count
FROM quiz_assignments qa
JOIN quiz_assignment_questions qaq ON qa.id = qaq.quiz_assignment_id
WHERE qa.org_id = 'test-org-id'
GROUP BY qa.id, qa.title;
```

### Check attempt was recorded
```sql
SELECT * FROM quiz_attempts WHERE user_id = (
  SELECT id FROM users WHERE email = 'player-qb@example.com'
);
```

### Check answers were saved
```sql
SELECT
  qa.question_number,
  qa.is_correct,
  qa.user_answer,
  ft.correct_answer
FROM quiz_attempt_answers qa
JOIN flashcard_templates ft ON qa.flashcard_id = ft.id
WHERE qa.quiz_attempt_id = 'attempt-uuid'
ORDER BY qa.question_number;
```

### Check XP was awarded
```sql
SELECT * FROM xp_events
WHERE user_id = (SELECT id FROM users WHERE email = 'player-qb@example.com')
  AND event_type = 'quiz_completion';
```

### Check spaced repetition was updated
```sql
SELECT
  ft.question_prompt,
  pfp.ease_factor,
  pfp.interval_days,
  pfp.due_date,
  pfp.times_shown,
  pfp.times_correct
FROM player_flashcard_progress pfp
JOIN flashcard_templates ft ON pfp.flashcard_id = ft.id
WHERE pfp.user_id = (SELECT id FROM users WHERE email = 'player-qb@example.com');
```

---

## Common Issues & Solutions

### Issue: "Missing authorization token"
**Solution:** Ensure you're passing the JWT token in the `Authorization: Bearer <token>` header

### Issue: "You are not a member of this organization"
**Solution:** Verify the user has an active org_membership record with the correct org_id

### Issue: "Flashcards not found or inactive"
**Solution:** Ensure flashcards exist, are active, and have org_id set via the play relationship

### Issue: "Invalid UUID format"
**Solution:** All IDs must be valid UUIDs (format: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx)

### Issue: Function timeout
**Solution:** Background functions have 15 minute timeout. Check Netlify function logs for errors.

---

## Performance Testing

### Load Test: Multiple concurrent attempts
```bash
# Use Apache Bench or similar
ab -n 100 -c 10 -H "Authorization: Bearer TOKEN" \
  -T "application/json" \
  -p post-data.json \
  http://localhost:8888/.netlify/functions/quizzes-attempts-start
```

### Monitoring
- Check Netlify function execution times
- Monitor database query performance
- Watch for N+1 query issues

---

## Next: Frontend Integration

Once all endpoints pass tests:
1. Create Org Context Provider
2. Build Coach Quiz Assignment UI
3. Build Player Quiz Taking UI
4. Test end-to-end workflow

Happy testing! 🚀
