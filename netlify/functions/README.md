# Netlify Functions - API Routes

This directory contains Netlify Functions that replace Next.js API routes for production deployment.

## Converted Routes

The following Next.js API routes have been converted to Netlify Functions:

### Onboarding Routes
- `/api/onboarding/status` → `onboarding-status.ts` (GET)
- `/api/onboarding/profile` → `onboarding-profile.ts` (POST)
- `/api/onboarding/organization` → `onboarding-organization.ts` (POST)
- `/api/onboarding/join` → `onboarding-join.ts` (POST)
- `/api/onboarding/team` → `onboarding-team.ts` (POST)
- `/api/onboarding/teams` → `onboarding-teams.ts` (GET, POST)
- `/api/onboarding/position` → `onboarding-position.ts` (POST)

### Admin Routes
- `/api/admin/invite` → `admin-invite.ts` (POST)

### Auth Routes
- `/auth/callback` → `auth-callback.ts` (GET) - OAuth callback handler
  - Handles Supabase OAuth callbacks (Google sign-in, email magic links, invites)
  - Exchanges auth code for session
  - Preserves redirect parameter for invite flows

## How It Works

1. **Netlify Functions** are serverless functions that run on Netlify's edge network
2. **Redirects** in `netlify.toml` map `/api/*` routes to `/.netlify/functions/*`
3. **Environment Variables** must be set in Netlify dashboard:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `NEXT_PUBLIC_APP_URL` (for email invites)

## Development

### Testing Locally
```bash
# Install Netlify CLI
npm install -g netlify-cli

# Run locally with Netlify Dev
netlify dev
```

This will:
- Start Next.js dev server
- Run Netlify Functions locally
- Simulate redirects from netlify.toml

### Testing Functions Directly
```bash
# Test a specific function
netlify functions:serve

# Or invoke a function with test data
netlify functions:invoke onboarding-status
```

## Deployment

### Set Environment Variables
In your Netlify dashboard:
1. Go to Site Settings → Build & Deploy → Environment
2. Add these variables:
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
   NEXT_PUBLIC_APP_URL=https://your-site.netlify.app
   ```

### Deploy
```bash
# Deploy to production
netlify deploy --prod

# Or push to git (if connected to GitHub)
git push origin main
```

## Function Structure

Each function follows this pattern:

```typescript
import { Handler } from '@netlify/functions';
import { createClient } from '@supabase/supabase-js';

export const handler: Handler = async (event) => {
  // Check HTTP method
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  // Get auth header
  const authHeader = event.headers.authorization || event.headers.Authorization;

  // Parse body
  const body = JSON.parse(event.body || '{}');

  // Return response
  return {
    statusCode: 200,
    body: JSON.stringify({ success: true, data: {...} })
  };
};
```

## Troubleshooting

### Function Timeouts
- Default timeout: 10 seconds
- Increase in `netlify.toml`: `[functions] timeout = 26`

### CORS Issues
Add headers to function response:
```typescript
return {
  statusCode: 200,
  headers: {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization'
  },
  body: JSON.stringify({...})
};
```

### Function Not Found
1. Check `netlify.toml` has correct redirects
2. Verify function file is in `netlify/functions/`
3. Check function is exported correctly: `export const handler: Handler = ...`

### Environment Variables Not Working
1. Make sure they're set in Netlify dashboard
2. Check capitalization (case-sensitive!)
3. Rebuild/redeploy after adding new variables

## Logs

View function logs in:
- **Netlify Dashboard**: Functions → Function name → Logs
- **Netlify CLI**: `netlify dev` shows logs in terminal
- **Production**: Netlify dashboard → Deploys → Function log

## Migration Notes

### Key Differences from Next.js API Routes

1. **Request/Response**
   - Next.js: `request.json()`, `NextResponse.json()`
   - Netlify: `JSON.parse(event.body)`, return `{ statusCode, body: JSON.stringify() }`

2. **Headers**
   - Next.js: `request.headers.get('authorization')`
   - Netlify: `event.headers.authorization` or `event.headers.Authorization`

3. **HTTP Method**
   - Next.js: Separate `GET()`, `POST()` functions
   - Netlify: Single handler, check `event.httpMethod`

4. **Environment Variables**
   - Both use `process.env.*`
   - Must set in Netlify dashboard for production

## Additional Resources

- [Netlify Functions Documentation](https://docs.netlify.com/functions/overview/)
- [Netlify CLI Documentation](https://docs.netlify.com/cli/get-started/)
- [Next.js on Netlify](https://docs.netlify.com/integrations/frameworks/next-js/)
