# Netlify Deployment Guide

## Prerequisites

- Netlify account
- GitHub/GitLab repository (or use Netlify CLI for manual deploys)
- Supabase project with service role key

## Step 1: Connect Repository to Netlify

1. Go to [Netlify Dashboard](https://app.netlify.com/)
2. Click **"Add new site" → "Import an existing project"**
3. Choose your Git provider (GitHub/GitLab)
4. Select your `chalkboardV1` repository
5. Netlify will auto-detect Next.js and configure build settings

## Step 2: Configure Build Settings

Verify these settings (should be auto-configured):

- **Build command**: `npm run build`
- **Publish directory**: `.next`
- **Functions directory**: `netlify/functions`

## Step 3: Set Environment Variables

In Netlify Dashboard → Site Settings → Environment Variables, add:

### Required Variables
```
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
NEXT_PUBLIC_APP_URL=https://your-site.netlify.app
GPT_KEY=your-openai-api-key
```

### Where to Find These Values

**NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY & SUPABASE_SERVICE_ROLE_KEY:**
1. Go to [Supabase Dashboard](https://app.supabase.com/)
2. Select your project
3. Go to Settings → API
4. Copy:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public** → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role secret** → `SUPABASE_SERVICE_ROLE_KEY`

**NEXT_PUBLIC_APP_URL:**
- After first deploy, use your Netlify URL: `https://your-site.netlify.app`
- Or set custom domain later

**GPT_KEY:**
- Your existing OpenAI API key

## Step 4: Deploy

### Option A: Automatic Deploy (Recommended)
```bash
git add .
git commit -m "Add Netlify Functions"
git push origin main
```
Netlify will automatically detect the push and deploy.

### Option B: Manual Deploy with CLI
```bash
# Install Netlify CLI
npm install -g netlify-cli

# Login to Netlify
netlify login

# Deploy
netlify deploy --prod
```

## Step 5: Verify Functions

After deployment:

1. Go to Netlify Dashboard → Functions
2. You should see 9 functions:
   - `onboarding-status`
   - `onboarding-profile`
   - `onboarding-organization`
   - `onboarding-join`
   - `onboarding-team`
   - `onboarding-teams`
   - `onboarding-position`
   - `admin-invite`
   - `auth-callback`

3. Click each function to view logs and ensure they're deploying without errors

## Step 6: Test the App

1. Visit your deployed site: `https://your-site.netlify.app`
2. Test the onboarding flow:
   - Sign up
   - Create profile
   - Create organization
   - Create team
   - Complete position (if player)
3. Test admin invite feature:
   - Go to `/admin/settings`
   - Send an invite
   - Check that email is received

## Step 7: Update Email Redirect (IMPORTANT!)

In Supabase Dashboard:
1. Go to Authentication → URL Configuration
2. Add your Netlify URL to **Site URL**: `https://your-site.netlify.app`
3. Add to **Redirect URLs**: `https://your-site.netlify.app/**`

This ensures invite emails redirect to your production site.

## Common Issues & Solutions

### Issue: Functions Not Found (404)
**Solution:** Check `netlify.toml` redirects are configured correctly

### Issue: Environment Variables Not Working
**Solution:**
1. Verify they're set in Netlify dashboard
2. Trigger a new deploy after adding variables
3. Check for typos (case-sensitive!)

### Issue: Function Timeout
**Solution:** Add to `netlify.toml`:
```toml
[functions]
  timeout = 26
```

### Issue: CORS Errors
**Solution:** Functions should already handle CORS, but if issues persist, add:
```typescript
headers: {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS'
}
```

### Issue: Supabase Connection Fails
**Solution:**
1. Verify `SUPABASE_SERVICE_ROLE_KEY` is correct (NOT the anon key!)
2. Check Supabase project is active
3. Verify RLS policies allow service role access

## Testing Locally Before Deploy

```bash
# Install Netlify CLI
npm install -g netlify-cli

# Run dev server with functions
netlify dev

# This will:
# - Start Next.js on port 3000
# - Serve Netlify Functions
# - Simulate redirects
```

Test your functions at: `http://localhost:8888/api/onboarding/status`

## Monitoring

### View Function Logs
- **Real-time**: Netlify Dashboard → Functions → Select function → Real-time logs
- **Historical**: Netlify Dashboard → Deploys → Deploy details → Function log

### Performance Monitoring
- Netlify Dashboard → Analytics
- Track function invocations, errors, and duration

## Custom Domain (Optional)

1. Go to Netlify Dashboard → Domain settings
2. Click **"Add custom domain"**
3. Follow DNS configuration instructions
4. Update `NEXT_PUBLIC_APP_URL` to your custom domain
5. Update Supabase redirect URLs

## Security Checklist

- [x] `SUPABASE_SERVICE_ROLE_KEY` is kept secret (never commit to git!)
- [x] Functions validate authentication tokens
- [x] Environment variables set in Netlify (not in code)
- [x] HTTPS enabled (automatic with Netlify)
- [x] RLS policies configured in Supabase

## Rollback

If something goes wrong:

1. Go to Netlify Dashboard → Deploys
2. Find a previous working deploy
3. Click **"Publish deploy"** to roll back

## Cost Considerations

Netlify Free Tier includes:
- 100GB bandwidth/month
- 300 build minutes/month
- 125K function invocations/month (up to 2M runtime seconds)

For this app, free tier should be sufficient for development and moderate production use.

## Support

- [Netlify Support](https://www.netlify.com/support/)
- [Netlify Community](https://answers.netlify.com/)
- [Supabase Support](https://supabase.com/support)

## Next Steps

After successful deployment:
1. Set up custom domain
2. Configure analytics
3. Set up form notifications
4. Enable deploy previews for pull requests
5. Add status badge to README
