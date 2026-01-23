# Onboarding V2 - Multiple Teams Per Organization

## Problem
The original onboarding workflow assumed one organization = one team, but the requirement is for organizations to have multiple teams (Varsity, JV, Freshman, etc.).

## Solution Overview
Updated the database schema and onboarding flow to support multiple teams per organization with proper team selection during onboarding.

---

## Database Changes

### Migration: `002_multiple_teams_per_org.sql`

**Run this in Supabase SQL Editor:**

```sql
-- Remove unique constraint on teams.org_id (allow multiple teams per org)
DROP INDEX IF EXISTS idx_teams_org_id_unique;
CREATE INDEX IF NOT EXISTS idx_teams_org_id ON teams(org_id);

-- Add team_id to org_memberships
ALTER TABLE org_memberships
  ADD COLUMN IF NOT EXISTS team_id UUID REFERENCES teams(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_org_memberships_team_id ON org_memberships(team_id);

-- Migrate existing data
UPDATE org_memberships om
SET team_id = t.id
FROM teams t
WHERE om.org_id = t.org_id
  AND om.team_id IS NULL;
```

---

## New Onboarding Flow

### Coach Creating New Org (First Person)
1. **Profile** → Name + Role (Coach)
2. **Create Organization** → Organization name
3. **Create Team** → Team name + season
4. ✅ **Complete**

### Coach/Player Joining Existing Org
1. **Profile** → Name + Role
2. **Join Organization** → Enter invite code
3. **Select/Create Team** → Choose from dropdown OR create new team
4. **Set Position** (players only) → Position + jersey number
5. ✅ **Complete**

---

## API Endpoints Added/Modified

### New: `GET /api/onboarding/teams`
Returns list of teams in user's organization.

**Response:**
```json
{
  "success": true,
  "data": {
    "teams": [
      { "id": "...", "name": "Varsity", "season": "2024" },
      { "id": "...", "name": "JV", "season": "2024" }
    ]
  }
}
```

### New: `POST /api/onboarding/teams`
Selects a team for the user.

**Request:**
```json
{
  "teamId": "uuid"
}
```

**Updates:**
- Sets `org_memberships.team_id`
- Moves user to next onboarding state

### Modified: `POST /api/onboarding/join`
**Changed:** Now moves users to `pending_team` state instead of `pending_position` after joining org.

---

## Frontend Changes

### OnboardingContext (`src/contexts/OnboardingContext.tsx`)
Added methods:
- `getAvailableTeams()` - Fetches teams in user's org
- `selectTeam(teamId)` - Assigns user to a team

### Onboarding Page (`src/app/onboarding/page.tsx`)
Added `TeamSelectionStep` component with:
- **Select Mode** - Dropdown of existing teams
- **Create Mode** - Form to create new team
- Automatic fallback to create mode if no teams exist
- Toggle between modes if teams exist

---

## Testing Steps

### 1. Run Migration
Execute `002_multiple_teams_per_org.sql` in Supabase SQL Editor.

### 2. Test Coach Creating Org
1. Sign up as new user
2. Enter profile (select Coach)
3. Create organization (e.g., "Central High School")
4. Create team (e.g., "Varsity 2024")
5. Should complete onboarding

### 3. Test Player Joining Org
1. Get org ID from Supabase: `SELECT id, name FROM organizations;`
2. Sign up as new user
3. Enter profile (select Player)
4. Enter invite code (org ID for now)
5. Select team from dropdown (should see "Varsity 2024")
6. Select position + jersey number
7. Should complete onboarding

### 4. Test Multiple Teams
1. As coach (completed onboarding), visit `/onboarding`
2. Should show update profile form
3. Manually update onboarding_state to 'pending_team' in DB
4. Visit `/onboarding` - should see team creation/selection
5. Create "JV 2024" team
6. New players should now see both Varsity and JV in dropdown

---

## Future Enhancements

### Better Invite System
Current: Invite code = org UUID
Future: Generate short codes (ABC-123), time-limited tokens, email invites

### Team Selection After Onboarding
Allow users to switch teams or be on multiple teams.

### Permissions & Roles
- Org admins can manage all teams
- Team coaches can only manage their team
- Players can view their team

### Segments (Already in Schema)
Use `team_segments` for Offense/Defense/Position Groups.

---

## Key Files Modified

- `migrations/002_multiple_teams_per_org.sql` (NEW)
- `src/app/api/onboarding/teams/route.ts` (NEW)
- `src/app/api/onboarding/join/route.ts` (MODIFIED)
- `src/contexts/OnboardingContext.tsx` (MODIFIED)
- `src/app/onboarding/page.tsx` (MODIFIED)
