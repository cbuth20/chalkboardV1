# API Refactoring Plan
## Organization-Scoped Multi-Tenancy & Simplified Quiz Workflow

---

## Current State Analysis

### Existing Endpoints
1. **`playbook-metadata`** - CRUD for metadata (file uploads)
2. **`create-play-record`** - Fast play creation with "generating" status
3. **`process-play-content-background`** - 15min background job: AI analysis → assignments → flashcards
4. **`analyze-plays`** - GPT-4o Vision analysis (seems redundant with background processor)
5. **`review-play-content`** - Coach approve/reject/update workflow
6. **`check-play-status`** - Poll for generation status
7. **`get-approved-plays`** - Fetch approved plays + assignments/flashcards
8. **`flashcard-templates`** - (Not read yet, likely CRUD)
9. **`playbooks-clear-content`** - Bulk delete operations
10. **`content-generation-prompts`** - Shared prompt library

### Current Workflow
```
1. Upload playbook → Create metadata (with team_id)
2. Create play record (status: "generating")
3. Background process:
   - Analyze image/text with GPT-4o
   - Generate insights
   - Generate knowledge cards
   - Generate assignment flashcards
   - Insert to DB (status: "draft")
4. Coach reviews → approve/reject
5. Players access approved plays
```

### Problems
❌ **No org_id scoping** - All APIs use `team_id` only
❌ **No RBAC enforcement** - Missing role checks (admin, coach, player)
❌ **Redundant endpoints** - `analyze-plays` vs `process-play-content-background`
❌ **No quiz assignment workflow** - Flashcards exist but can't be assigned as quizzes
❌ **Mixed responsibilities** - Background processor does too much in one function
❌ **No organization context** - Cannot differentiate between orgs

---

## Proposed Simplified Architecture

### Core Principles
1. **Organization-Scoped** - All APIs require `org_id`
2. **Role-Based Access** - Enforce admin/coach/player permissions
3. **Simplified Workflow** - Separate concerns (save → analyze → generate → assign)
4. **Clear Separation** - Plays vs Flashcards vs Quiz Assignments

### New Workflow
```
┌─────────────────────────────────────────────────────────────────┐
│ 1. UPLOAD & SAVE                                                │
│    POST /api/plays/create                                       │
│    - Upload file → Supabase Storage                             │
│    - Create playbook_metadata (org_id, team_id)                 │
│    - Create play record (status: "generating")                  │
│    - Return playId immediately                                  │
└─────────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│ 2. ANALYZE & GENERATE (Background)                              │
│    Background Function: process-play-analysis                   │
│    - Analyze image/text with GPT-4o Vision                      │
│    - Generate play_assignments                                  │
│    - Update play (status: "draft")                              │
│    - Trigger flashcard generation (separate job)                │
└─────────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│ 3. GENERATE FLASHCARDS (Background)                             │
│    Background Function: generate-flashcards                     │
│    - Read play_assignments                                      │
│    - Generate assignment flashcards (alignment, assignment, read)│
│    - Generate knowledge cards with GPT-4                        │
│    - Insert flashcard_templates (org_id via play)               │
└─────────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│ 4. REVIEW & APPROVE                                             │
│    POST /api/plays/:playId/review                               │
│    - Coach reviews generated content                            │
│    - Approve → status: "approved", is_published: true           │
│    - Reject → status: "rejected"                                │
│    - Update → modify content, status: "pending_review"          │
└─────────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│ 5. CREATE QUIZ ASSIGNMENTS (NEW)                                │
│    POST /api/quizzes/assignments                                │
│    - Coach selects flashcards from question bank                │
│    - Assigns to: specific player, position, segment, or team    │
│    - Sets due date, passing score, max attempts                 │
│    - Creates quiz_assignment + quiz_assignment_questions         │
└─────────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│ 6. PLAYERS TAKE QUIZZES (NEW)                                   │
│    GET /api/quizzes/assignments (list assigned quizzes)         │
│    POST /api/quizzes/attempts (create attempt)                  │
│    POST /api/quizzes/attempts/:id/submit (submit answers)       │
└─────────────────────────────────────────────────────────────────┘
```

---

## Refactored API Endpoints

### **1. Plays API** (Org-Scoped)

#### **POST `/api/plays`** - Create Play
**Purpose:** Upload playbook file, create metadata and play record
**Auth:** Coach or Admin
**Request:**
```json
{
  "orgId": "uuid",
  "teamId": "uuid",
  "file": "base64 or multipart/form-data",
  "fileName": "string",
  "metadata": {
    "side_of_ball": "offense | defense | special_teams",
    "content_type": "play | coverage | formation | legend | index | reference",
    "formation_name": "string",
    "concept_name": "string",
    "position_relevance": ["QB", "WR"],
    "level": "varsity | jv | freshman",
    "custom_notes": "string"
  }
}
```
**Response:**
```json
{
  "success": true,
  "playId": "uuid",
  "status": "generating",
  "message": "Play is being analyzed..."
}
```

**Replaces:**
- `playbook-metadata` (POST)
- `create-play-record`

---

#### **GET `/api/plays`** - List Plays
**Purpose:** List all plays for organization
**Auth:** Coach, Admin (all plays), Player (approved only)
**Query Params:**
```
?orgId=uuid
&teamId=uuid (optional)
&status=generating|draft|approved|rejected (optional)
&contentType=play|coverage|formation (optional)
```
**Response:**
```json
{
  "plays": [
    {
      "id": "uuid",
      "orgId": "uuid",
      "teamId": "uuid",
      "name": "Mesh Concept",
      "shortName": "Mesh",
      "playType": "PASS",
      "content_status": "approved",
      "created_at": "timestamp",
      "metadata": { ... }
    }
  ]
}
```

**Replaces:**
- `playbook-metadata` (GET)
- `get-approved-plays` (partially)

---

#### **GET `/api/plays/:playId`** - Get Play Details
**Purpose:** Get single play with assignments and flashcards
**Auth:** Coach, Admin (any status), Player (approved only)
**Query Params:**
```
?include=assignments,flashcards,insights
```
**Response:**
```json
{
  "play": {
    "id": "uuid",
    "orgId": "uuid",
    "name": "Mesh Concept",
    "content_status": "approved",
    "ai_insights": "string"
  },
  "assignments": [ ... ],
  "flashcards": [ ... ]
}
```

**Replaces:**
- `check-play-status`
- `get-approved-plays` (with playId filter)

---

#### **POST `/api/plays/:playId/review`** - Review Play
**Purpose:** Coach approve/reject/update play
**Auth:** Coach or Admin
**Request:**
```json
{
  "action": "approve | reject | update",
  "reviewNotes": "string",
  "updates": {
    "insights": "string",
    "assignments": [ ... ],
    "knowledgeCards": [ ... ]
  }
}
```
**Response:**
```json
{
  "success": true,
  "playId": "uuid",
  "newStatus": "approved",
  "message": "Play approved successfully"
}
```

**Replaces:**
- `review-play-content`

---

#### **DELETE `/api/plays/:playId`** - Delete Play
**Purpose:** Soft delete or hard delete play
**Auth:** Admin only

---

### **2. Flashcards API** (Org-Scoped)

#### **GET `/api/flashcards`** - List Flashcards (Question Bank)
**Purpose:** Browse all flashcards for quiz assignment creation
**Auth:** Coach or Admin
**Query Params:**
```
?orgId=uuid
&playId=uuid (optional)
&position=QB|WR (optional)
&category=alignment|assignment|coverage|read (optional)
&cardType=assignment|knowledge (optional)
```
**Response:**
```json
{
  "flashcards": [
    {
      "id": "uuid",
      "playId": "uuid",
      "playName": "Mesh Concept",
      "position": "QB",
      "category": "assignment",
      "cardType": "assignment",
      "question_prompt": "What is your assignment as the QB?",
      "correct_answer": "Read high-low progression",
      "difficulty": "intermediate"
    }
  ],
  "total": 150
}
```

**Replaces:**
- `flashcard-templates` (GET)

---

#### **POST `/api/flashcards/:flashcardId/regenerate`** - Regenerate Single Flashcard
**Purpose:** Coach regenerates a flashcard with AI if unsatisfied
**Auth:** Coach or Admin
**Request:**
```json
{
  "prompt": "string (optional custom prompt)"
}
```

**New Functionality**

---

### **3. Quiz Assignments API** (NEW - Org-Scoped)

#### **POST `/api/quizzes/assignments`** - Create Quiz Assignment
**Purpose:** Coach assigns flashcards as a quiz to players
**Auth:** Coach or Admin
**Request:**
```json
{
  "orgId": "uuid",
  "teamId": "uuid",
  "title": "Week 3 QB Quiz",
  "description": "Cover 2 vs Cover 3 reads",

  // Target audience (one of these)
  "assignedToUserId": "uuid", // Specific player
  "assignedToPosition": "QB", // All QBs
  "assignedToSegmentId": "uuid", // All in segment (Varsity, JV)
  "assignedToTeamId": "uuid", // All in team

  // Timing
  "dueDate": "timestamp",
  "availableFrom": "timestamp",
  "availableUntil": "timestamp",

  // Settings
  "passingScore": 80,
  "maxAttempts": 3,
  "timeLimitSeconds": 600,
  "randomizeQuestions": true,

  // Questions (from question bank)
  "flashcardIds": ["uuid1", "uuid2", "uuid3"]
}
```
**Response:**
```json
{
  "success": true,
  "quizAssignmentId": "uuid",
  "message": "Quiz assigned to 5 players"
}
```

---

#### **GET `/api/quizzes/assignments`** - List Quiz Assignments
**Purpose:** List quiz assignments (coach sees all, player sees assigned to them)
**Auth:** Coach, Admin, Player
**Query Params:**
```
?orgId=uuid
&teamId=uuid (optional)
&status=active|completed|overdue (optional)
&assignedToMe=true (for players)
```
**Response:**
```json
{
  "assignments": [
    {
      "id": "uuid",
      "title": "Week 3 QB Quiz",
      "description": "Cover 2 vs Cover 3 reads",
      "dueDate": "timestamp",
      "passingScore": 80,
      "totalQuestions": 10,
      "status": "active",
      "myAttempts": 1, // For players
      "bestScore": 75 // For players
    }
  ]
}
```

---

#### **GET `/api/quizzes/assignments/:assignmentId`** - Get Quiz Assignment Details
**Purpose:** Get quiz details including questions (for taking quiz)
**Auth:** Coach, Admin, Player (if assigned)
**Response:**
```json
{
  "assignment": {
    "id": "uuid",
    "title": "Week 3 QB Quiz",
    "totalQuestions": 10,
    "timeLimitSeconds": 600,
    "passingScore": 80,
    "maxAttempts": 3
  },
  "questions": [
    {
      "id": "uuid",
      "flashcardId": "uuid",
      "question_prompt": "What is your assignment as the QB?",
      "hints": ["Option A", "Option B", "Option C", "Option D"],
      "points": 1
    }
  ]
}
```

---

#### **POST `/api/quizzes/attempts`** - Start Quiz Attempt
**Purpose:** Player starts taking a quiz
**Auth:** Player
**Request:**
```json
{
  "quizAssignmentId": "uuid"
}
```
**Response:**
```json
{
  "attemptId": "uuid",
  "quizAssignmentId": "uuid",
  "attemptNumber": 2,
  "startedAt": "timestamp",
  "questions": [ ... ]
}
```

---

#### **POST `/api/quizzes/attempts/:attemptId/submit`** - Submit Quiz Attempt
**Purpose:** Player submits answers for grading
**Auth:** Player (own attempts only)
**Request:**
```json
{
  "answers": [
    {
      "flashcardId": "uuid",
      "userAnswer": "string",
      "responseTimeMs": 3500
    }
  ]
}
```
**Response:**
```json
{
  "attemptId": "uuid",
  "scorePercentage": 85,
  "passed": true,
  "correctAnswers": 8,
  "totalQuestions": 10,
  "timeTakenSeconds": 345,
  "xpEarned": 150
}
```

---

#### **GET `/api/quizzes/attempts`** - List Quiz Attempts
**Purpose:** Get attempt history (coach sees all org attempts, player sees own)
**Auth:** Coach, Admin, Player
**Query Params:**
```
?orgId=uuid
&quizAssignmentId=uuid (optional)
&userId=uuid (optional, coach/admin can filter by player)
```

---

### **4. Background Functions** (Netlify)

#### **`process-play-analysis-background`** (NEW)
**Purpose:** Analyze uploaded play and generate assignments
**Timeout:** 15 minutes
**Triggered by:** `POST /api/plays` after play creation
**Steps:**
1. Fetch play and metadata
2. Analyze image/text with GPT-4o Vision
3. Generate play_assignments
4. Update play (status: "draft")
5. Trigger flashcard generation

---

#### **`generate-flashcards-background`** (NEW)
**Purpose:** Generate flashcards from play assignments
**Timeout:** 15 minutes
**Triggered by:** After play analysis completes
**Steps:**
1. Fetch play_assignments
2. Generate assignment flashcards (multiple choice)
3. Generate knowledge cards with GPT-4
4. Insert flashcard_templates

---

#### **`process-play-content-background`** (REFACTOR)
**Change:** Split into two separate functions above
**Reason:** Separation of concerns, better error handling, retry-ability

---

### **5. Deprecated Endpoints**

These can be removed or consolidated:

❌ **`analyze-plays`** - Redundant with background processor
❌ **`content-generation-prompts`** - Move to shared lib
❌ **`playbooks-clear-content`** - Admin-only, move to admin namespace

---

## Database Changes Required

### Add `org_id` to Existing Tables
```sql
-- Already in refined schema proposal
ALTER TABLE plays ADD COLUMN org_id uuid REFERENCES organizations(id);
ALTER TABLE playbook_metadata ADD COLUMN org_id uuid REFERENCES organizations(id);
ALTER TABLE flashcard_templates ADD COLUMN org_id uuid REFERENCES organizations(id);
```

### Create New Tables
```sql
-- Already in refined schema proposal
CREATE TABLE quiz_assignments ( ... );
CREATE TABLE quiz_assignment_questions ( ... );
CREATE TABLE quiz_attempts ( ... );
CREATE TABLE quiz_attempt_answers ( ... );
```

---

## RBAC Enforcement

### Middleware: `withOrgAuth(requiredRole)`
```typescript
// Pseudo-code
export function withOrgAuth(requiredRole: 'admin' | 'coach' | 'player') {
  return async (req, res) => {
    const { orgId } = req.body || req.query;
    const userId = getUserIdFromSession(req);

    // Check org membership
    const membership = await db.org_memberships
      .select('role')
      .where({ orgId, userId, isActive: true })
      .first();

    if (!membership) {
      return res.status(403).json({ error: 'Not a member of this organization' });
    }

    // Check role
    const roleHierarchy = { admin: 3, coach: 2, player: 1 };
    if (roleHierarchy[membership.role] < roleHierarchy[requiredRole]) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }

    req.user = { userId, orgId, role: membership.role };
    return next();
  };
}
```

### Usage
```typescript
// Only coaches and admins can create plays
app.post('/api/plays', withOrgAuth('coach'), async (req, res) => {
  // req.user.orgId is guaranteed to be valid
  // req.user.role is 'coach' or 'admin'
});
```

---

## Migration Strategy

### Phase 1: Add New Endpoints (Non-Breaking)
1. ✅ Create new quiz assignment endpoints
2. ✅ Add org_id parameter support to existing endpoints (optional for now)
3. ✅ Create new background functions
4. ✅ Test new workflows alongside old ones

### Phase 2: Database Migration
1. ✅ Run `migration_to_org_scoped.sql`
2. ✅ Backfill org_id on existing records
3. ✅ Create new quiz tables

### Phase 3: Update Frontend
1. ✅ Add org context provider
2. ✅ Update API calls to include orgId
3. ✅ Implement quiz assignment UI
4. ✅ Implement quiz-taking UI

### Phase 4: Enforce org_id (Breaking)
1. ✅ Make org_id required on all endpoints
2. ✅ Remove redundant old endpoints
3. ✅ Deploy to production

---

## File Structure (Proposed)

```
netlify/functions/
├── plays/
│   ├── create-play.ts                 # POST /api/plays
│   ├── list-plays.ts                  # GET /api/plays
│   ├── get-play.ts                    # GET /api/plays/:id
│   ├── review-play.ts                 # POST /api/plays/:id/review
│   ├── delete-play.ts                 # DELETE /api/plays/:id
│   └── process-play-analysis-background.ts
│
├── flashcards/
│   ├── list-flashcards.ts             # GET /api/flashcards
│   ├── regenerate-flashcard.ts        # POST /api/flashcards/:id/regenerate
│   └── generate-flashcards-background.ts
│
├── quizzes/
│   ├── create-assignment.ts           # POST /api/quizzes/assignments
│   ├── list-assignments.ts            # GET /api/quizzes/assignments
│   ├── get-assignment.ts              # GET /api/quizzes/assignments/:id
│   ├── start-attempt.ts               # POST /api/quizzes/attempts
│   ├── submit-attempt.ts              # POST /api/quizzes/attempts/:id/submit
│   └── list-attempts.ts               # GET /api/quizzes/attempts
│
└── shared/
    ├── auth.ts                        # withOrgAuth middleware
    ├── supabase.ts                    # Supabase client setup
    ├── prompts.ts                     # AI prompts library
    └── validators.ts                  # Request validation
```

---

## Summary of Improvements

### ✅ Simplified
- **Before:** 10+ endpoints with mixed responsibilities
- **After:** 6 core endpoint groups with clear separation

### ✅ Organization-Scoped
- All APIs require and enforce `orgId`
- Proper multi-tenancy support

### ✅ RBAC Enforced
- Role checks at API level (admin, coach, player)
- Database-level RLS policies

### ✅ Clear Quiz Workflow
- **Before:** Flashcards generated but no assignment mechanism
- **After:** Complete quiz assignment → attempt → grading flow

### ✅ Better Error Handling
- Split background jobs for retry-ability
- Clear status tracking at each step

### ✅ Maintainable
- Organized file structure
- Shared utilities (auth, prompts, validation)
- TypeScript types from refined schema

---

## Next Steps

1. **Review this plan** with team
2. **Implement Phase 1** (new quiz endpoints)
3. **Run database migration**
4. **Update frontend** to use new APIs
5. **Deprecate old endpoints** after full migration
6. **Update documentation** for API consumers
