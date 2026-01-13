# Supabase Authentication Setup

This document explains how to configure Supabase authentication for the Chalkboard app.

## Environment Variables

The following environment variables are required:

### For Local Development (.env.local)

```bash
NEXT_PUBLIC_SUPABASE_URL=https://svqkijmzpmxcmmapsdzp.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN2cWtpam16cG14Y21tYXBzZHpwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgzMzY0MTMsImV4cCI6MjA4MzkxMjQxM30.Xc2Kk-_7DjMOtxPpWP7TJ-APDBn6_humES-5mwrDjRQ
```

## Netlify Environment Variable Setup

To deploy your app to Netlify with Supabase authentication, follow these steps:

### 1. Navigate to Your Site Settings

1. Log into your Netlify dashboard
2. Select your site
3. Go to **Site configuration** → **Environment variables**

### 2. Add Environment Variables

Add the following environment variables:

| Key | Value | Scope |
|-----|-------|-------|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://svqkijmzpmxcmmapsdzp.supabase.co` | All scopes |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` | All scopes |

**Steps:**
1. Click **Add a variable**
2. Select **Add a single variable**
3. Enter the key name (e.g., `NEXT_PUBLIC_SUPABASE_URL`)
4. Enter the value
5. Select scopes: **All scopes** (Production, Deploy Previews, Branch deploys)
6. Click **Create variable**
7. Repeat for each variable

### 3. Trigger a Redeploy

After adding the environment variables:
1. Go to **Deploys** tab
2. Click **Trigger deploy** → **Deploy site**

This will rebuild your site with the new environment variables.

## Supabase Configuration

### Authentication Providers

The app is configured to support:
- Email/Password authentication
- Google OAuth (optional)

### Redirect URLs

Make sure to configure these redirect URLs in your Supabase project:

1. Go to your Supabase Dashboard
2. Navigate to **Authentication** → **URL Configuration**
3. Add the following URLs to **Redirect URLs**:
   - `http://localhost:3000/auth/callback` (for local development)
   - `https://your-netlify-site.netlify.app/auth/callback` (for production)
   - `https://your-custom-domain.com/auth/callback` (if using custom domain)

### Site URL

Set your Site URL in Supabase:
- **Development**: `http://localhost:3000`
- **Production**: `https://your-netlify-site.netlify.app` or your custom domain

## Testing Authentication

### Local Testing

1. Start your development server:
   ```bash
   npm run dev
   ```

2. Navigate to `http://localhost:3000/login`

3. Try signing up with email or Google

4. After successful authentication, you should be redirected to `/playbook`

### Production Testing

1. Deploy your site to Netlify
2. Navigate to `https://your-site.netlify.app/login`
3. Test authentication flow
4. Verify redirect to protected routes works correctly

## Protected Routes

The following routes require authentication:
- `/playbook` - Main playbook page

To protect additional routes, wrap them with the `<ProtectedRoute>` component:

```tsx
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';

export default function MyProtectedPage() {
  return (
    <ProtectedRoute>
      {/* Your page content */}
    </ProtectedRoute>
  );
}
```

## Authentication Context

Access user data and authentication state anywhere in your app:

```tsx
import { useAuth } from '@/contexts/AuthContext';

function MyComponent() {
  const { user, session, loading, signOut } = useAuth();

  if (loading) return <div>Loading...</div>;
  
  if (!user) return <div>Not authenticated</div>;

  return (
    <div>
      <p>Welcome, {user.email}</p>
      <button onClick={signOut}>Sign Out</button>
    </div>
  );
}
```

## Troubleshooting

### "Invalid API key" error
- Verify environment variables are set correctly in Netlify
- Make sure you've redeployed after adding variables
- Check that variable names match exactly (including `NEXT_PUBLIC_` prefix)

### Redirect loop on login
- Verify redirect URLs are configured in Supabase
- Check that Site URL matches your deployment URL
- Clear browser cookies and try again

### Authentication not persisting
- Check that cookies are enabled in browser
- Verify Supabase session is being stored correctly
- Check browser console for errors

## Security Notes

- ✅ The `NEXT_PUBLIC_` prefix makes these variables accessible client-side (required for Supabase)
- ✅ The Anon Key is safe to expose - it only allows operations permitted by Row Level Security (RLS)
- ⚠️ Never commit `.env.local` to version control (already in `.gitignore`)
- ⚠️ Always use environment variables for sensitive data
- ⚠️ Set up Row Level Security (RLS) policies in Supabase to protect your data

## Next Steps

1. Configure Row Level Security (RLS) policies in Supabase
2. Set up additional authentication providers (GitHub, etc.)
3. Customize the login UI theme
4. Add user profile management
5. Implement role-based access control
