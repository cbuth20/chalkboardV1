# Debug Auth Token Issue

## Quick Debug Steps

### 1. Check if Token is in Browser Storage

Open browser console (F12) and run:

```javascript
// Check localStorage
const authData = localStorage.getItem('chalkboard-auth');
console.log('Auth data:', authData);

// Parse and check token
if (authData) {
  const parsed = JSON.parse(authData);
  console.log('Access token:', parsed.access_token?.substring(0, 50) + '...');
  console.log('Refresh token:', parsed.refresh_token?.substring(0, 50) + '...');

  // Check if expired
  if (parsed.access_token) {
    const payload = JSON.parse(atob(parsed.access_token.split('.')[1]));
    console.log('Token expires:', new Date(payload.exp * 1000));
    console.log('Current time:', new Date());
    console.log('Is expired?', Date.now() > payload.exp * 1000);
  }
}
```

### 2. Check if Token is Being Sent in Request

In Network tab:
1. Go to Network tab
2. Find the failing request: `plays-list?orgId=...`
3. Click on it
4. Look at **Request Headers**
5. Check if there's an `Authorization: Bearer eyJ...` header

**If Authorization header is MISSING** → Token not being sent from client
**If Authorization header is PRESENT** → Server validation issue

### 3. Check Session in AuthContext

In browser console:
```javascript
// Check React DevTools or run:
const { session } = window.__NEXT_DATA__ || {};
console.log('Session:', session);
```

## Common Causes

### Issue 1: Token Not Being Sent
**Symptom:** No Authorization header in request
**Fix:** Session not loaded in AuthContext yet

### Issue 2: Token Invalid on Server
**Symptom:** Authorization header present but still 401
**Causes:**
- Token signed with different key
- Token from different Supabase project
- Server environment variables wrong

### Issue 3: Session Storage Key Mismatch
**Your app uses:** `chalkboard-auth` as storage key
**Check:** `localStorage.getItem('chalkboard-auth')`

## Manual Token Test

Try calling the API directly with your token:

```bash
# Get your token from browser console first
TOKEN="your_access_token_here"

# Test the API
curl -X GET \
  "http://localhost:8888/.netlify/functions/plays-list?orgId=986d0f15-e926-4f76-89e1-bf7c7f731923&status=approved" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json"
```

## Check Server Logs

Look at your terminal where `netlify dev` is running. You should see logs like:
```
◈ Invoking function plays-list
[Function logs]
```

If you see the function being invoked, check the logs for errors.

## Verify Environment Variables

In terminal where you run `netlify dev`, check:

```bash
# These should match your .env.local
echo $NEXT_PUBLIC_SUPABASE_URL
echo $NEXT_PUBLIC_SUPABASE_ANON_KEY
echo $SUPABASE_SERVICE_ROLE_KEY
```

All three should have values and match your .env.local file.
