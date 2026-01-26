# Schema Refactoring Guide

## Overview
This guide outlines the refactoring of the Chalkboard database schema to support proper multi-tenancy with organization-based access control.

---

## Key Changes

### 1. **Primary Tenant: Organization**

**Before:** Mixed tenancy with both `team_id` and `org_id`
**After:** Organization is the primary tenant, teams are subdivisions

```
Organization (Primary Tenant)
  └── Teams (Subdivisions)
      └── Team Segments (e.g., Varsity, JV, Offense, Defense)
```

### 2. **Consolidated Membership Model**

**REMOVED:** `team_members` table (deprecated)
**KEPT:** `org_memberships` as the single source of truth

```sql
org_memberships:
  - org_id (FK) → organization the user belongs to
  - user_id (FK) → the user
  - role (admin | coach | player) → RBAC role
  - team_id (FK, optional) → specific team assignment
  - segment_id (FK, optional) → specific segment
  - positions[] → array of positions player plays
```

**Benefits:**
- Single membership record per user per org
- Clear role-based access control
- Optional team/segment assignment (org admins might not be on a team)

### 3. **Clarified Assignment Concepts**

#### **play_assignments** = Position instructions for executing a play
- Alignment, routes, reads, assignments for each position
- Technical instructions: "Line up at X, run route Y, read Z"

#### **quiz_assignments** = Coaches assigning quizzes to players (NEW)
- Coaches create quiz assignments for players
- Can target: specific player, position, segment, or team
- Has due dates, passing scores, max attempts

```
Coach creates quiz assignment → "QB Quiz Week 3"
  ├── Assigned to: All QBs
  ├── Due: Friday 5pm
  ├── Contains: 10 flashcards about play reads
  └── Players take quiz attempts
```

### 4. **Organization-Scoped Data**

All major tables now have `org_id` as FK:

| Table | Org-Scoped? | Team-Scoped? |
|-------|-------------|--------------|
| `plays` | ✅ Required | Optional |
| `playbooks` | ✅ Required | Optional |
| `playbook_metadata` | ✅ Required | Optional |
| `flashcard_templates` | ✅ Required (via play) | - |
| `quiz_assignments` | ✅ Required | Optional |
| `quiz_attempts` | ✅ Required (via assignment) | - |
| `xp_events` | ✅ Required | Optional |

### 5. **Role-Based Access Control (RBAC)**

Three roles enforced via RLS policies:

| Role | Permissions |
|------|-------------|
| **admin** | Full org access, manage everything |
| **coach** | View all org data, create/manage plays, assign quizzes, view player progress |
| **player** | View assigned content, take quizzes, view own progress |

### 6. **Quiz System Refinement**

```
flashcard_templates (org-scoped quiz questions)
  ↓
quiz_assignments (coaches assign flashcards to players)
  ↓
quiz_assignment_questions (which flashcards in this quiz)
  ↓
quiz_attempts (player takes the quiz)
  ↓
quiz_attempt_answers (individual question responses)
```

**Key features:**
- Coaches create quiz assignments targeting players/positions/teams
- Quizzes can have due dates, time limits, passing scores
- Players can retake quizzes (configurable max attempts)
- Progress tracked via spaced repetition in `player_flashcard_progress`

---

## Migration Strategy

### Phase 1: Add New Tables
1. Create `quiz_assignments`
2. Create `quiz_assignment_questions`
3. Create `quiz_attempts`
4. Create `quiz_attempt_answers`

### Phase 2: Add `org_id` to Existing Tables
1. Add `org_id` column to:
   - `plays`
   - `playbooks`
   - `playbook_metadata`
   - `flashcard_templates` (via play relationship)
2. Backfill `org_id` from existing `team_id` relationships
3. Make `org_id` NOT NULL after backfill

### Phase 3: Update RLS Policies
1. Create helper functions:
   - `is_org_member(org_id)`
   - `get_user_org_role(org_id)`
   - `has_org_role(org_id, role)`
   - `is_org_staff(org_id)` (admin or coach)
2. Replace team-based policies with org-based policies
3. Add role-based access checks

### Phase 4: Deprecate `team_members`
1. Create view `team_members_legacy` that maps to `org_memberships`
2. Update application code to use `org_memberships`
3. Eventually drop `team_members` table

### Phase 5: Application Updates
1. Update queries to filter by `org_id` instead of `team_id`
2. Add org context provider in frontend
3. Implement role-based UI rendering
4. Update forms to support new quiz assignment flow

---

## RLS Policy Pattern

All org-scoped tables follow this pattern:

```sql
-- Players, coaches, and admins can VIEW
CREATE POLICY "Org members can view X" ON table_name
  FOR SELECT USING (public.is_org_member(org_id));

-- Only coaches and admins can CREATE/UPDATE/DELETE
CREATE POLICY "Org staff can manage X" ON table_name
  FOR ALL USING (public.is_org_staff(org_id));
```

---

## Key Benefits

### ✅ Multi-Tenancy
- Multiple organizations can use the same database
- Complete data isolation between orgs
- Org-level billing and limits possible

### ✅ Role-Based Access Control
- Clear permission boundaries (admin, coach, player)
- Enforceable at database level via RLS
- Frontend can render different UIs per role

### ✅ Scalable Team Structure
- Organizations can have multiple teams
- Teams can have segments (Varsity, JV, etc.)
- Flexible player assignments

### ✅ Clear Quiz Workflow
- Coaches create and assign quizzes
- Players receive assignments and take quizzes
- Progress tracking and analytics per player

### ✅ Performance
- Proper indexes on `org_id`
- Efficient RLS policies with SECURITY DEFINER functions
- Denormalized data where appropriate

---

## Examples

### Creating a Quiz Assignment (Coach)
```sql
-- Coach creates quiz for all QBs, due Friday
INSERT INTO quiz_assignments (
  org_id,
  team_id,
  title,
  description,
  assigned_to_position,
  due_date,
  passing_score,
  assigned_by
) VALUES (
  'org-uuid',
  'team-uuid',
  'QB Read Progression Quiz - Week 3',
  'Cover 2 vs Cover 3 recognition',
  'QB',
  '2024-02-16 17:00:00',
  80,
  'coach-user-id'
);

-- Add flashcards to the quiz
INSERT INTO quiz_assignment_questions (quiz_assignment_id, flashcard_id, display_order)
VALUES
  ('quiz-uuid', 'flashcard-1-uuid', 1),
  ('quiz-uuid', 'flashcard-2-uuid', 2),
  -- ... more flashcards
```

### Player Takes Quiz
```sql
-- Create quiz attempt
INSERT INTO quiz_attempts (quiz_assignment_id, user_id, attempt_number, total_questions)
VALUES ('quiz-uuid', 'player-uuid', 1, 10);

-- Record answers
INSERT INTO quiz_attempt_answers (quiz_attempt_id, flashcard_id, question_number, is_correct, response_time_ms)
VALUES
  ('attempt-uuid', 'flashcard-1-uuid', 1, true, 3500),
  ('attempt-uuid', 'flashcard-2-uuid', 2, false, 5200),
  -- ... more answers
```

### Query: Get All Quiz Assignments for a Player
```sql
SELECT qa.*
FROM quiz_assignments qa
JOIN org_memberships om ON qa.org_id = om.org_id
WHERE om.user_id = 'player-user-id'
  AND (
    qa.assigned_to_user_id = 'player-user-id'
    OR qa.assigned_to_position = om.position_code
    OR qa.assigned_to_segment_id = om.segment_id
    OR qa.assigned_to_team_id = om.team_id
  )
  AND qa.is_active = true
  AND (qa.available_until IS NULL OR qa.available_until > NOW());
```

---

## Next Steps

1. **Review this proposal** with stakeholders
2. **Test migration script** on development database
3. **Update TypeScript types** in `src/lib/supabase/types/database.ts`
4. **Update application queries** to use new schema
5. **Implement role-based UI** components
6. **Deploy incrementally** with feature flags
