# Testing the Onboarding Flow

## What We Built

✅ **OnboardingContext** - Manages onboarding state and API calls
✅ **Onboarding Page** - `/onboarding` route with all steps
✅ **4 Step Components**:
1. Profile Setup (name + role selection)
2. Organization (create or join)
3. Team Setup (coaches only)
4. Position Setup (players only)

## How to Test

### Prerequisites
1. Make sure your Next.js dev server is running:
   ```bash
   npm run dev
   ```

2. Open your browser to: http://localhost:3000

### Test Flow 1: New Coach Creating Organization

1. **Sign up as a new user** (if you don't have a test account)
   - Go to `/login` or `/signup`
   - Create a new account

2. **You should be redirected to `/onboarding`**
   - If not, manually navigate to http://localhost:3000/onboarding

3. **Step 1: Profile Setup**
   - Enter first name and last name
   - Select "Coach" role
   - Click "Continue"

4. **Step 2: Organization Setup**
   - Click "Create Organization" tab
   - Enter organization name (e.g., "Central High School Football")
   - Click "Create Organization"

5. **Step 3: Team Setup**
   - Enter team name (e.g., "Wildcats")
   - Set season (e.g., "2024")
   - Click "Create Team"

6. **Redirect to Dashboard**
   - Should automatically redirect to `/games` or main dashboard
   - Onboarding is complete!

### Test Flow 2: Player Joining with Invite

1. **Get the Organization ID** from Supabase:
   ```sql
   SELECT id, name FROM organizations;
   ```
   Copy the `id` value (this is your invite code for now)

2. **Sign up as a new player**
   - Create a new account (use incognito/private window)
   - Go to `/onboarding`

3. **Step 1: Profile Setup**
   - Enter name
   - Select "Player" role
   - Click "Continue"

4. **Step 2: Join Organization**
   - Click "Join with Code" tab
   - Paste the organization ID as the invite code
   - Click "Join Organization"

5. **Step 3: Position Setup**
   - Select your position (e.g., "Quarterback")
   - Enter jersey number (e.g., "12")
   - Click "Complete Setup"

6. **Redirect to Dashboard**
   - Should redirect to `/games`
   - Onboarding is complete!

## Verifying Data in Supabase

After testing, verify the data was saved correctly:

```sql
-- Check users
SELECT
  first_name,
  last_name,
  role,
  onboarding_state
FROM users
ORDER BY created_at DESC
LIMIT 5;

-- Check org memberships
SELECT
  u.first_name || ' ' || u.last_name as user_name,
  o.name as organization,
  om.role,
  om.position_code,
  om.jersey_number
FROM org_memberships om
JOIN users u ON om.user_id = u.id
JOIN organizations o ON om.org_id = o.id
ORDER BY om.created_at DESC;

-- Check teams
SELECT
  t.name as team_name,
  o.name as organization_name,
  t.season
FROM teams t
JOIN organizations o ON t.org_id = o.id;
```

## Expected Results

### For Coach:
- ✅ User created with role='coach' and onboarding_state='completed'
- ✅ Organization created with user as owner
- ✅ Team created linked to organization
- ✅ Org membership created with role='coach'

### For Player:
- ✅ User created with role='player' and onboarding_state='completed'
- ✅ Org membership created with role='player'
- ✅ Position code and jersey number saved

## Common Issues & Fixes

### Issue: Page shows "Loading..." forever
- Check browser console for errors
- Check that API endpoints are working: http://localhost:3000/api/onboarding/status

### Issue: "Failed to update profile" error
- Check that migration ran successfully
- Verify `onboarding_state` enum exists in database
- Check browser console for detailed error

### Issue: Gets stuck on one step
- Check the onboarding_state in database:
  ```sql
  SELECT first_name, onboarding_state FROM users WHERE email = 'your@email.com';
  ```
- Manually update if needed:
  ```sql
  UPDATE users SET onboarding_state = 'pending_org' WHERE email = 'your@email.com';
  ```

### Issue: Invite code doesn't work
- For now, invite code is just the organization UUID
- Get it from: `SELECT id FROM organizations;`
- Later we'll implement proper invite codes/tokens

## Next Steps

Once testing is complete, we can:
1. Add better invite code system (tokens/links instead of raw UUIDs)
2. Add team segments support
3. Add skip/back buttons
4. Add profile picture upload
5. Create admin dashboard to manage invites
6. Add email invitations

## Quick Reset (for testing)

If you want to reset your onboarding state:

```sql
-- Reset a user's onboarding
UPDATE users
SET onboarding_state = 'new'
WHERE email = 'your@email.com';

-- Delete org memberships (to test joining again)
DELETE FROM org_memberships WHERE user_id = 'user-id-here';
```
