# Onboarding System - Complete Summary

## ✅ What We Built

### 1. Database Schema (Migration 001)
**File:** `migrations/001_org_structure_migration.sql`

**New Tables:**
- `organizations` - Root tenant with owner
- `org_memberships` - User-org relationships (replaces `team_members`)
- `team_segments` - Team subdivisions (offense/defense/position groups)

**Schema Changes:**
- Added `onboarding_state` enum to `users` table
- Added `role` column to `users` table
- Linked `teams` to `organizations` (one-to-one)

**Onboarding States:**
```typescript
type OnboardingState =
  | 'new'                 // Just signed up
  | 'profile_incomplete'  // Started profile
  | 'pending_org'         // Needs org
  | 'pending_team'        // Needs team (coaches)
  | 'pending_position'    // Needs position (players)
  | 'completed';          // Done!
```

### 2. API Endpoints
**All located in:** `src/app/api/onboarding/`

- `GET /api/onboarding/status` - Get current onboarding state
- `POST /api/onboarding/profile` - Update profile (name, role)
- `POST /api/onboarding/organization` - Create organization
- `POST /api/onboarding/team` - Create team
- `POST /api/onboarding/join` - Join org with invite code
- `POST /api/onboarding/position` - Set position & jersey

**Auth:** All endpoints use Bearer token authentication from session

### 3. React Context
**File:** `src/contexts/OnboardingContext.tsx`

Provides:
- Current onboarding status
- Methods to update profile, create org/team, join org, set position
- Auto-refreshes status after each step
- Error handling

### 4. Onboarding UI
**File:** `src/app/onboarding/page.tsx`

**Features:**
- Single-page wizard with progress indicator
- 4 steps: Profile → Organization → Team → Position
- **Always accessible** - even after completion (for updates)
- Pre-fills data when editing
- Coach vs Player flows

### 5. OnboardingGuard Component
**File:** `src/components/OnboardingGuard.tsx`

Auto-redirects users to `/onboarding` if not completed.

---

## 🚀 How It Works

### User Flow: Coach Creating Team

1. **Sign up** → Creates auth account
2. **Profile** → Enter name, select "Coach" role
3. **Organization** → Create organization (e.g., "Central High Football")
4. **Team** → Create team (e.g., "Wildcats", season "2024")
5. **Done!** → `onboarding_state = 'completed'`

### User Flow: Player Joining

1. **Sign up** → Creates auth account
2. **Profile** → Enter name, select "Player" role
3. **Join Org** → Enter invite code (org UUID)
4. **Position** → Select position + jersey number
5. **Done!** → `onboarding_state = 'completed'`

---

## 🔧 How to Use

### Basic Setup (Already Done)

1. ✅ Migration ran in Supabase
2. ✅ API routes created
3. ✅ OnboardingProvider added to layout
4. ✅ Onboarding page created at `/onboarding`

### Protecting Routes (Optional)

Wrap any page that requires completed onboarding:

```tsx
import { OnboardingGuard } from '@/components/OnboardingGuard';

export default function GamesPage() {
  return (
    <OnboardingGuard>
      <YourGameContent />
    </OnboardingGuard>
  );
}
```

This will auto-redirect users to `/onboarding` if they haven't completed it.

### Manually Redirecting After Login

In your login success handler:

```typescript
const { status } = useOnboarding();

if (status?.onboardingState !== 'completed') {
  router.push('/onboarding');
} else {
  router.push('/games');
}
```

---

## 🧪 Testing

### Option 1: New User Flow
1. Sign up with a new account
2. You'll start at `onboarding_state = 'new'`
3. Go through each step

### Option 2: Reset Existing User

Run in Supabase SQL Editor:

```sql
-- Reset your account
UPDATE users
SET onboarding_state = 'new'
WHERE email = 'your@email.com';

-- Optionally delete membership to test join flow
DELETE FROM org_memberships
WHERE user_id = (SELECT id FROM users WHERE email = 'your@email.com');
```

Then navigate to `/onboarding`

### Get Invite Code

For testing the player join flow:

```sql
SELECT id, name FROM organizations;
```

Use the `id` as the invite code (for now - we can enhance this later with tokens/links).

---

## 📝 Key Behaviors

### `/onboarding` Route

✅ **Always accessible** - Users can visit anytime
✅ **No auto-redirect** - Stays on page even if completed
✅ **Pre-fills data** - Shows current info when editing
✅ **Updates allowed** - Can change profile even after completion

### When `onboarding_state = 'completed'`

- Shows "Update Your Profile" form
- All 4 steps shown as complete in progress bar
- User can still update their info

### Automatic Redirects

**Only happens if you use `<OnboardingGuard>`:**
- Incomplete users → redirected to `/onboarding`
- Completed users → allowed through

---

## 🎨 Customization Ideas

### Better Invite System
Currently invite code = org UUID. Could improve with:
- Unique short codes (e.g., "ABC-123")
- Time-limited tokens
- Email-based invites
- QR codes

### Team Segments
Added to schema but not used in UI yet. Could add:
- Offense/Defense split
- Varsity/JV split
- Position rooms (WR Room, Secondary, etc.)

### Profile Pictures
Add avatar upload to profile step using existing `avatar_url` field.

### Skip Steps
Allow coaches to skip team creation if joining existing org.

### Multi-Team Support
Users can be in multiple orgs. Could add org switcher.

---

## 📂 Files Created/Modified

### New Files
- `migrations/001_org_structure_migration.sql`
- `migrations/verify_migration_simple.sql`
- `migrations/reset_onboarding_for_testing.sql`
- `migrations/MIGRATION_GUIDE.md`
- `migrations/RUN_MIGRATION_NOW.md`
- `src/contexts/OnboardingContext.tsx`
- `src/app/onboarding/page.tsx`
- `src/app/api/onboarding/status/route.ts`
- `src/app/api/onboarding/profile/route.ts`
- `src/app/api/onboarding/organization/route.ts`
- `src/app/api/onboarding/team/route.ts`
- `src/app/api/onboarding/join/route.ts`
- `src/app/api/onboarding/position/route.ts`
- `src/components/OnboardingGuard.tsx`
- `docs/onboarding-workflow.md`
- `docs/TESTING_ONBOARDING.md`

### Modified Files
- `src/app/layout.tsx` - Added OnboardingProvider
- `src/lib/supabase/types/database.ts` - Added new types
- `src/contexts/AuthContext.tsx` - Increased timeouts

---

## 🎉 Done!

The onboarding system is fully functional and ready to use!

**Current behavior:**
- `/onboarding` is always accessible
- Users can update info anytime
- No forced redirects from onboarding page

**To add auto-redirect on login:**
- Use `<OnboardingGuard>` on protected pages
- Or manually check status in login handler
