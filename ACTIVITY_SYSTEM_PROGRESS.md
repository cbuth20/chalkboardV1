# Activity System - Implementation Progress

## ✅ Phase 1: Database Setup - COMPLETE

### Created
- **Migration**: `src/lib/database/migrations/017_activity_system.sql`
  - `activity_type` enum (6 types)
  - `activities` table (coach creates)
  - `activity_attempts` table (player attempts)
  - Indexes for performance
  - Views for analytics (activity_stats, player_activity_progress)

### TypeScript Types
- **File**: `src/types/activities.ts`
  - Activity, ActivityAttempt, QuestionResult types
  - UI-specific types (ActivityCardData, ActivityFormData)
  - Metadata for activity types

## ✅ Phase 2: API Endpoints - COMPLETE

### Created Endpoints

1. **POST `/activities-create`** (`netlify/functions/activities-create.ts`)
   - Create new learning activity
   - Auth: Coach/Admin only
   - Validates play IDs, assignment config
   - Returns created activity

2. **GET `/activities-list`** (`netlify/functions/activities-list.ts`)
   - List activities
   - Coach: sees all org activities + stats
   - Player: sees only assigned activities + personal progress
   - Filters by status, team

3. **POST `/activities-start`** (`netlify/functions/activities-start.ts`)
   - Start activity attempt
   - Fetches filtered questions based on activity type and filters
   - Randomizes questions/options if enabled
   - Creates attempt record
   - Returns questions to play

4. **POST `/activities-submit`** (`netlify/functions/activities-submit.ts`)
   - Submit activity results
   - Calculates score and pass/fail
   - Updates attempt with results
   - Returns score breakdown by topic

## ✅ Phase 3: Player UI - COMPLETE

### Created Pages

1. **`/app/activities/page.tsx`** - My Activities (Player)
   - Games-style card layout
   - Shows assigned activities
   - Filters: All, To Do, Completed
   - Stats: Total, To Do, Completed
   - Status badges: TODO, IN PROGRESS, COMPLETED, OVERDUE
   - Shows score, attempts, due date
   - Click card → go to activity detail

2. **`/app/coach/activities/page.tsx`** - Manage Activities (Coach)
   - Table view of all activities
   - Filters: All, Active, Draft, Archived
   - Shows completion rates, avg scores
   - "Create Activity" button
   - Click row → go to activity detail
   - Edit button → go to edit page

## 📝 Phase 4: Remaining Work

### To Complete

1. **Activity Detail Page** (`/app/activities/[id]/page.tsx`)
   - Show activity details
   - "Start Activity" button
   - Show previous attempts if any
   - Display due date, passing score
   - Preview questions (if coach)

2. **Activity Game Mode** (`/app/activities/[id]/play/page.tsx`)
   - Quick Quiz mode (multiple choice)
   - True/False mode
   - Scenario mode
   - Progress bar
   - Timer (if enabled)
   - Submit results

3. **Activity Results** (component)
   - Score display
   - Pass/Fail status
   - Time taken
   - Topic breakdown
   - Questions missed
   - Option to retry

4. **Activity Creation Wizard** (`/app/coach/activities/create/page.tsx`)
   - Step 1: Select activity type
   - Step 2: Select plays
   - Step 3: Configure filters (difficulty, topics, positions)
   - Step 4: Set parameters (time, passing score, etc.)
   - Step 5: Assign to players/positions/team
   - Step 6: Review & create

5. **Coach Activity Detail** (`/app/coach/activities/[id]/page.tsx`)
   - View activity details
   - Analytics: completion rates, scores, time spent
   - Player-by-player breakdown
   - Common missed questions
   - Edit/Archive/Delete buttons

6. **Coach Activity Edit** (`/app/coach/activities/[id]/edit/page.tsx`)
   - Edit activity settings
   - Update assignment
   - Change status (activate, archive)

## 🗄️ Database Migration Status

### ⚠️ IMPORTANT: Run Migration

Before using the activity system, run this migration in Supabase SQL Editor:

```bash
src/lib/database/migrations/017_activity_system.sql
```

This creates:
- `activity_type` enum
- `activities` table
- `activity_attempts` table
- Indexes and views

## 🧪 Testing the System

### 1. Run Database Migration
```sql
-- In Supabase SQL Editor
-- Copy/paste content from: src/lib/database/migrations/017_activity_system.sql
```

### 2. Test API Endpoints
```bash
# Create activity (as coach)
curl -X POST http://localhost:8888/.netlify/functions/activities-create \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "title": "Week 1 Pass Game Quiz",
    "activity_type": "quick_quiz",
    "play_ids": ["play-uuid-1", "play-uuid-2"],
    "assigned_to": {"type": "team", "values": []},
    "passing_score_percent": 80
  }'

# List activities (as player)
curl http://localhost:8888/.netlify/functions/activities-list?orgId=YOUR_ORG_ID
```

### 3. Test UI
1. Start dev server: `netlify dev`
2. Go to `/activities` (player view)
3. Go to `/coach/activities` (coach view)

## 📊 Architecture Overview

```
Coach Flow:
┌──────────────────┐
│ Coach creates    │
│ activity via     │
│ wizard           │
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│ Activity stored  │
│ in database      │
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│ Players see      │
│ assigned         │
│ activity in      │
│ /activities      │
└──────────────────┘

Player Flow:
┌──────────────────┐
│ Player clicks    │
│ activity card    │
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│ See details &    │
│ click "Start"    │
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│ POST /start      │
│ fetches          │
│ questions        │
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│ Play activity    │
│ (game mode)      │
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│ POST /submit     │
│ with results     │
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│ Show results &   │
│ score            │
└──────────────────┘
```

## 🎯 Next Immediate Steps

1. **Run the database migration** ✅ CRITICAL
2. **Build activity creation wizard** (coach can create activities)
3. **Build activity detail page** (player can view/start)
4. **Build first game mode** (quick_quiz with multiple choice)
5. **Build results screen** (show score after completion)

## 🔄 Future Enhancements

- [ ] XP/Streak system integration
- [ ] Leaderboards
- [ ] Team challenges (compete against other teams)
- [ ] Study mode (review questions without scoring)
- [ ] Video explanations
- [ ] Image-based questions (show play diagram)
- [ ] Voice recognition for answers
- [ ] Mobile app integration

---

**Status**: Phase 1-3 complete (Database + API + Basic UI)
**Next**: Complete Phase 4 (Activity detail, game modes, creation wizard)
