# Onboarding Workflow Design

## Overview
This document outlines the onboarding workflow for ChalkboardV1, supporting both coaches setting up new teams and players joining existing teams.

## Onboarding States
Tracked via `users.onboarding_state` enum:

```typescript
type OnboardingState =
  | 'new'                 // Just signed up via Supabase Auth
  | 'profile_incomplete'  // Started profile, missing required info
  | 'pending_org'         // Profile complete, needs org assignment
  | 'pending_team'        // In org, needs team setup (coaches only)
  | 'pending_position'    // In team, needs position (players only)
  | 'completed';          // Fully onboarded
```

## User Flows

### Flow A: Coach Creating New Organization

**Step 1: Authentication**
- User signs up via Supabase Auth (email/password or OAuth)
- `users` record created with `onboarding_state = 'new'`
- Redirect to profile setup

**Step 2: Profile Setup** (`onboarding_state: 'new' → 'profile_incomplete'`)
- Collect:
  - First name
  - Last name
  - Role selection: "Coach" or "Player"
  - Avatar (optional)
- Update `users.first_name`, `users.last_name`, `users.role`
- Transition to `onboarding_state = 'pending_org'`

**Step 3: Organization Creation** (`onboarding_state: 'pending_org' → 'pending_team'`)
- Collect:
  - Organization name (e.g., "Central High School Football")
- Create `organizations` record with `owner_id = user.id`
- Create `org_memberships` record with `role = 'admin'`
- Transition to `onboarding_state = 'pending_team'`

**Step 4: Team Setup** (`onboarding_state: 'pending_team' → 'completed'`)
- Collect:
  - Team name (e.g., "Central High School Wildcats")
  - Season (e.g., "2024", "2024-25")
  - Team segments (optional)
    - Offense / Defense / Special Teams
    - OR Varsity / JV
    - OR Position Groups (WR Room, Secondary, O-Line, etc.)
- Create `teams` record linked to organization
- Create `team_segments` records if provided
- Transition to `onboarding_state = 'completed'`

**Step 5: Invite Players** (post-onboarding)
- Generate invite codes or links
- Send to players via email/text
- Players use invite to join organization

---

### Flow B: Player Joining via Invite

**Step 1: Authentication**
- Player clicks invite link with org invite code
- Signs up via Supabase Auth
- `users` record created with `onboarding_state = 'new'`
- Store invite code in session/URL param

**Step 2: Profile Setup** (`onboarding_state: 'new' → 'profile_incomplete'`)
- Same as Flow A Step 2, but role defaults to "Player"
- Transition to `onboarding_state = 'pending_org'`

**Step 3: Auto-join Organization** (`onboarding_state: 'pending_org' → 'pending_position'`)
- Use invite code to lookup organization
- Create `org_memberships` record with `role = 'player'`
- Transition to `onboarding_state = 'pending_position'`

**Step 4: Position & Jersey Selection** (`onboarding_state: 'pending_position' → 'completed'`)
- Collect:
  - Primary position (e.g., "QB", "WR", "CB")
  - Jersey number
  - Segment assignment (if team has segments)
- Update `org_memberships.position_code`, `org_memberships.jersey_number`, `org_memberships.segment_id`
- Transition to `onboarding_state = 'completed'`

---

### Flow C: Player Self-Signup (No Invite)

**Step 1-2: Same as Flow B**

**Step 3: Join or Create Organization** (`onboarding_state: 'pending_org' → 'pending_position'`)
- Present options:
  - Enter invite code
  - Search for existing team
  - Create your own team (becomes coach)
- If joining existing: create `org_memberships` as player
- If creating: follow Flow A starting at Step 3
- Transition to `onboarding_state = 'pending_position'` (if joining) or `'pending_team'` (if creating)

**Step 4: Same as Flow B Step 4**

---

## Implementation Components

### API Endpoints

```typescript
POST /api/onboarding/profile
- Body: { firstName, lastName, role, avatarUrl? }
- Creates/updates user profile
- Updates onboarding_state

POST /api/onboarding/organization
- Body: { name }
- Creates organization with user as owner
- Creates org_membership
- Updates onboarding_state

POST /api/onboarding/team
- Body: { name, season, segments?: { code, name }[] }
- Creates team linked to org
- Creates team_segments
- Updates onboarding_state

POST /api/onboarding/join
- Body: { inviteCode }
- Validates invite code
- Creates org_membership
- Updates onboarding_state

POST /api/onboarding/position
- Body: { positionCode, jerseyNumber, segmentId? }
- Updates org_membership
- Updates onboarding_state to 'completed'

GET /api/onboarding/status
- Returns current onboarding state and next step
```

### UI Components

```typescript
<OnboardingFlow />
  - Wizard component that renders steps based on onboarding_state
  - Components:
    - <ProfileSetup />
    - <OrganizationSetup />
    - <TeamSetup />
    - <JoinOrganization />
    - <PositionSetup />
    - <OnboardingComplete />
```

### State Management

```typescript
// src/contexts/OnboardingContext.tsx
interface OnboardingContextType {
  currentState: OnboardingState;
  nextStep: () => void;
  skipToStep: (step: OnboardingState) => void;
  updateProfile: (data) => Promise<void>;
  createOrganization: (data) => Promise<void>;
  createTeam: (data) => Promise<void>;
  joinWithInvite: (inviteCode) => Promise<void>;
  setPosition: (data) => Promise<void>;
}
```

---

## Database Changes

See `migrations/001_org_structure_migration.sql` for full schema changes.

Key additions:
- `organizations` table
- `org_memberships` table
- `team_segments` table
- `users.onboarding_state` column
- `users.role` column
- `teams.org_id` FK

---

## Next Steps

1. ✅ Create migration SQL
2. ✅ Update TypeScript types
3. ⏳ Create API endpoints
4. ⏳ Create onboarding context
5. ⏳ Build UI components
6. ⏳ Test end-to-end flows
