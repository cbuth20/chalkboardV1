# Refined Schema - Entity Relationship Diagram

## Core Identity & Multi-Tenancy

```
┌─────────────────────┐
│       users         │
│─────────────────────│
│ id (PK)             │
│ auth_id (UNIQUE)    │ ← Links to Supabase Auth
│ email (UNIQUE)      │
│ first_name          │
│ last_name           │
│ full_name           │ (generated)
│ display_name        │
│ avatar_url          │
│ total_xp            │ (global)
│ current_level       │ (global)
│ onboarding_state    │
└─────────────────────┘
         │
         │ owns
         ▼
┌─────────────────────┐
│   organizations     │ ◄──── PRIMARY TENANT
│─────────────────────│
│ id (PK)             │
│ owner_id (FK)       │ → users
│ name                │
│ slug (UNIQUE)       │
│ logo_url            │
│ timezone            │
└─────────────────────┘
         │
         │ 1:N
         ├────────────────────────┬──────────────────────┐
         ▼                        ▼                      ▼
┌─────────────────────┐  ┌─────────────────┐  ┌──────────────────┐
│  org_memberships    │  │     teams       │  │    seasons       │
│─────────────────────│  │─────────────────│  │──────────────────│
│ id (PK)             │  │ id (PK)         │  │ id (PK)          │
│ org_id (FK)         │  │ org_id (FK)     │  │ org_id (FK)      │
│ user_id (FK)        │  │ name            │  │ team_id (FK)     │
│ role                │  │ slug            │  │ name             │
│ team_id (FK)        │  │ logo_url        │  │ year             │
│ segment_id (FK)     │  │ season          │  │ start_date       │
│ jersey_number       │  └─────────────────┘  │ is_active        │
│ position_code       │           │           └──────────────────┘
│ positions[]         │           │ 1:N
│ org_xp              │           ▼
│ is_active           │  ┌─────────────────┐
└─────────────────────┘  │ team_segments   │
         │               │─────────────────│
         │               │ id (PK)         │
         │               │ team_id (FK)    │
         │               │ code            │
         └──────────────►│ name            │
           references    └─────────────────┘
```

**Key Points:**
- `organizations` is the primary tenant boundary
- `org_memberships` is the single source of truth for user ↔ org relationships
- `role` field enforces RBAC (admin, coach, player)
- Users can optionally be assigned to specific teams/segments

---

## Playbook & Content System (Org-Scoped)

```
┌──────────────────────┐
│   organizations      │
└──────────────────────┘
         │
         │ All content scoped to org
         │
         ├─────────────────┬──────────────────┬────────────────────┐
         ▼                 ▼                  ▼                    ▼
┌─────────────────┐ ┌──────────────────┐ ┌──────────────────┐ ┌──────────────────┐
│   playbooks     │ │      plays       │ │playbook_metadata │ │    seasons       │
│─────────────────│ │──────────────────│ │──────────────────│ │──────────────────│
│ id (PK)         │ │ id (PK)          │ │ id (PK)          │ │ id (PK)          │
│ org_id (FK) ✓   │ │ org_id (FK) ✓    │ │ org_id (FK) ✓    │ │ org_id (FK) ✓    │
│ team_id (FK)    │ │ team_id (FK)     │ │ team_id (FK)     │ │ team_id (FK)     │
│ season_id (FK)  │ │ name             │ │ file_name        │ │ name             │
│ name            │ │ short_name       │ │ file_paths[]     │ │ year             │
│ is_active       │ │ play_type        │ │ content_type     │ │ is_active        │
│ is_default      │ │ concept          │ │ side_of_ball     │ └──────────────────┘
└─────────────────┘ │ diagram_data     │ │ is_built_play    │
                    │ content_status   │ │ play_data        │
                    │ is_published     │ └──────────────────┘
                    └──────────────────┘          │
                              │                   │ 1:1 or 1:0
                              │ 1:N               ├────────────────┬─────────────────┐
                              ▼                   ▼                ▼                 ▼
                    ┌──────────────────┐ ┌──────────────┐ ┌─────────────┐ ┌────────────────┐
                    │ play_assignments │ │ formation_   │ │ coverage_   │ │ reference_     │
                    │──────────────────│ │  definitions │ │  definitions│ │   content      │
                    │ id (PK)          │ │──────────────│ │─────────────│ │────────────────│
                    │ play_id (FK)     │ │ id (PK)      │ │ id (PK)     │ │ id (PK)        │
                    │ position         │ │ metadata_id  │ │ metadata_id │ │ metadata_id    │
                    │ alignment        │ │   (FK)       │ │   (FK)      │ │   (FK)         │
                    │ landmark         │ │ name         │ │ name        │ │ title          │
                    │ assignment       │ │ formations[] │ │ coverage_   │ │ sections[]     │
                    │ key_read         │ │ diagram_data │ │   type      │ │ terminology[]  │
                    │ route_id         │ └──────────────┘ │ positions   │ └────────────────┘
                    │ category         │                  │ strengths   │
                    │ visible_to_      │                  │ weaknesses  │
                    │   positions[]    │                  └─────────────┘
                    └──────────────────┘
```

**Key Points:**
- All plays, playbooks, and metadata are org-scoped
- `play_assignments` = position-specific execution instructions
- `playbook_metadata` links to specialized content tables (formations, coverages, reference)

---

## Quiz & Learning System (Org-Scoped)

```
┌──────────────────────┐
│   organizations      │
└──────────────────────┘
         │
         ▼
┌──────────────────────┐
│       plays          │
│──────────────────────│
│ org_id (FK) ✓        │
└──────────────────────┘
         │
         │ 1:N
         ▼
┌──────────────────────────┐
│   flashcard_templates    │ ◄──── Question Bank
│──────────────────────────│
│ id (PK)                  │
│ org_id (FK) ✓            │
│ play_id (FK)             │
│ assignment_id (FK)       │
│ position                 │ ← Which position is this for
│ category                 │ ← alignment, assignment, coverage, etc.
│ card_type                │ ← 'assignment' or 'knowledge'
│ question_prompt          │
│ correct_answer           │
│ hints[]                  │
│ explanation              │
│ difficulty               │
│ is_active                │
└──────────────────────────┘
         │
         │ Used in
         ▼
┌──────────────────────────┐
│   quiz_assignments       │ ◄──── Coaches assign quizzes
│──────────────────────────│
│ id (PK)                  │
│ org_id (FK) ✓            │
│ team_id (FK)             │
│ title                    │
│ description              │
│                          │
│ ┌──────────────────────┐ │ ← Targeting options (one of):
│ │ assigned_to_user_id  │ │   - Specific player
│ │ assigned_to_position │ │   - All at position
│ │ assigned_to_segment  │ │   - All in segment
│ │ assigned_to_team     │ │   - All in team
│ └──────────────────────┘ │
│                          │
│ due_date                 │
│ passing_score            │
│ max_attempts             │
│ time_limit_seconds       │
│ is_active                │
│ assigned_by (FK)         │
└──────────────────────────┘
         │
         │ 1:N
         ▼
┌──────────────────────────┐
│ quiz_assignment_         │
│    questions             │
│──────────────────────────│
│ id (PK)                  │
│ quiz_assignment_id (FK)  │
│ flashcard_id (FK)        │ ─────┐
│ display_order            │      │
│ points                   │      │
└──────────────────────────┘      │
                                  │
         ┌────────────────────────┘
         │
         │ N:M relationship
         │ (same flashcard can be in multiple quizzes)
         │
┌────────┴─────────────────┐
│   quiz_attempts          │ ◄──── Players take quizzes
│──────────────────────────│
│ id (PK)                  │
│ quiz_assignment_id (FK)  │
│ user_id (FK)             │
│ attempt_number           │
│ started_at               │
│ completed_at             │
│ total_questions          │
│ correct_answers          │
│ score_percentage         │
│ passed                   │
│ time_taken_seconds       │
└──────────────────────────┘
         │
         │ 1:N
         ▼
┌──────────────────────────┐
│ quiz_attempt_answers     │ ◄──── Individual question responses
│──────────────────────────│
│ id (PK)                  │
│ quiz_attempt_id (FK)     │
│ flashcard_id (FK)        │
│ question_number          │
│ user_answer              │
│ is_correct               │
│ response_time_ms         │
│ answered_at              │
└──────────────────────────┘
```

**Quiz Flow:**
1. Coach creates `quiz_assignment` targeting players/positions/segments
2. Adds `flashcard_templates` to the quiz via `quiz_assignment_questions`
3. Players see assigned quizzes and create `quiz_attempts`
4. Each answer is recorded in `quiz_attempt_answers`
5. Progress tracked in `player_flashcard_progress` for spaced repetition

---

## Spaced Repetition & Progress Tracking

```
┌──────────────────────────┐     ┌──────────────────────────┐
│  flashcard_templates     │     │        users             │
└──────────────────────────┘     └──────────────────────────┘
         │                                   │
         │                                   │
         └───────────┬───────────────────────┘
                     │ N:M
                     ▼
         ┌──────────────────────────────────┐
         │ player_flashcard_progress        │ ◄──── Spaced Repetition
         │──────────────────────────────────│
         │ id (PK)                          │
         │ user_id (FK)                     │
         │ flashcard_id (FK)                │
         │                                  │
         │ ease_factor                      │ ← SM-2 algorithm
         │ interval_days                    │ ← How long until next review
         │ due_date                         │ ← When to show again
         │                                  │
         │ times_shown                      │
         │ times_correct                    │
         │ last_reviewed_at                 │
         └──────────────────────────────────┘
```

**Key Points:**
- Tracks individual player progress on each flashcard
- Uses spaced repetition algorithm (SM-2)
- Separate from quiz attempts (for study/practice mode)

---

## Gamification (Org-Scoped)

```
┌──────────────────────────┐
│   organizations          │
└──────────────────────────┘
         │
         ▼
┌──────────────────────────┐
│   xp_events              │ ◄──── All XP earning activities
│──────────────────────────│
│ id (PK)                  │
│ user_id (FK)             │
│ org_id (FK) ✓            │
│ team_id (FK)             │
│                          │
│ event_type               │ ← 'quiz_completion', 'streak_bonus', etc.
│ xp_amount                │
│ description              │
│ metadata                 │
│                          │
│ quiz_attempt_id (FK)     │ ← Optional context
│ created_at               │
└──────────────────────────┘
```

**Key Points:**
- All XP is org-scoped (can compare within org)
- User has `total_xp` (global) and org_memberships has `org_xp` (per org)
- Can trigger on quiz completions, streaks, achievements, etc.

---

## Access Control Matrix

| Table | Player READ | Player WRITE | Coach READ | Coach WRITE | Admin |
|-------|-------------|--------------|------------|-------------|-------|
| `plays` | ✓ (org) | ✗ | ✓ (org) | ✓ (org) | ✓ (org) |
| `play_assignments` | ✓ (org) | ✗ | ✓ (org) | ✓ (org) | ✓ (org) |
| `flashcard_templates` | ✓ (org) | ✗ | ✓ (org) | ✓ (org) | ✓ (org) |
| `quiz_assignments` | ✓ (if targeted) | ✗ | ✓ (org) | ✓ (org) | ✓ (org) |
| `quiz_attempts` | ✓ (own only) | ✓ (own only) | ✓ (org) | ✗ | ✓ (org) |
| `org_memberships` | ✓ (org) | ✗ | ✓ (org) | ✓ (org) | ✓ (org) |
| `xp_events` | ✓ (own only) | ✗ | ✓ (org) | ✗ | ✓ (org) |

**Legend:**
- ✓ = Allowed via RLS policy
- ✗ = Denied via RLS policy
- (org) = Can see all records in their organization
- (own only) = Can only see their own records
- (if targeted) = Players see quiz assignments targeted to them

---

## Key RLS Helper Functions

```sql
-- Check if user is member of org
is_org_member(org_id) → boolean

-- Get user's role in org
get_user_org_role(org_id) → 'admin' | 'coach' | 'player'

-- Check if user has specific role
has_org_role(org_id, role) → boolean

-- Check if user is admin or coach
is_org_staff(org_id) → boolean
```

These functions are used in all RLS policies to enforce access control at the database level.
