# API Client Local Development Fix

## Issue
The new API clients (plays, flashcards, quizzes) were failing in local development with error:
```
Error: API request failed
```

## Root Cause
The API clients were hardcoded to use `/.netlify/functions` which doesn't work when running `npm run dev` (Next.js dev server only). The Next.js dev server doesn't have access to Netlify functions.

## Solution
Updated all three API clients to use environment-based routing similar to the playbooks API:

- **Local development**: `http://localhost:8888/.netlify/functions`
- **Production**: `/.netlify/functions`

## Files Modified

### 1. `/src/lib/api/plays.ts`
**Backup:** `src/lib/api/plays.ts.backup`

**Before:**
```typescript
class PlaysAPI {
  private baseURL = '/.netlify/functions';
```

**After:**
```typescript
class PlaysAPI {
  private getBaseURL(): string {
    if (typeof window !== 'undefined') {
      const isLocalhost = window.location.hostname === 'localhost' ||
                         window.location.hostname === '127.0.0.1';

      if (isLocalhost) {
        return 'http://localhost:8888/.netlify/functions';
      }
    }
    return '/.netlify/functions';
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const baseURL = this.getBaseURL();
    const response = await fetch(`${baseURL}/${endpoint}`, { ... });
  }
}
```

### 2. `/src/lib/api/flashcards.ts`
**Backup:** `src/lib/api/flashcards.ts.backup`

Same changes as plays.ts - added `getBaseURL()` method with environment detection.

### 3. `/src/lib/api/quizzes.ts`
**Backup:** `src/lib/api/quizzes.ts.backup`

Same changes as plays.ts - added `getBaseURL()` method with environment detection.

## How It Works

### Development Environment Detection
```typescript
private getBaseURL(): string {
  if (typeof window !== 'undefined') {
    const isLocalhost = window.location.hostname === 'localhost' ||
                       window.location.hostname === '127.0.0.1';

    if (isLocalhost) {
      // Running locally - use Netlify CLI dev server
      return 'http://localhost:8888/.netlify/functions';
    }
  }

  // Production - use relative path
  return '/.netlify/functions';
}
```

### Request Flow

**Local Development:**
```
Browser → http://localhost:3000 (Next.js)
↓
API Client detects localhost
↓
Fetch → http://localhost:8888/.netlify/functions/plays-list
↓
Netlify CLI dev server (port 8888)
↓
Netlify function executes
```

**Production:**
```
Browser → https://yourapp.netlify.app
↓
API Client uses relative path
↓
Fetch → /.netlify/functions/plays-list
↓
Netlify CDN serves function
```

## Running Locally - IMPORTANT!

### ⚠️ You Must Use Netlify CLI

To develop locally with the new API endpoints, you MUST run:

```bash
netlify dev
```

**DO NOT use:**
```bash
npm run dev  # This won't work! ❌
```

### Why Netlify CLI?

`netlify dev` does the following:
1. Starts Next.js dev server on port 3000
2. Starts Netlify functions server on port 8888
3. Proxies requests between them
4. Simulates production environment

### Verify It's Working

When you run `netlify dev`, you should see:
```
◈ Netlify Dev ◈
◈ Injected build setting env var: ...
◈ Starting Netlify Dev with Next.js
◈ Server now ready on http://localhost:8888
```

The API clients will automatically use port 8888 for functions.

## Endpoints Affected

### Plays API
- `GET /.netlify/functions/plays-list` - List plays
- `POST /.netlify/functions/plays-create` - Create play
- `GET /.netlify/functions/plays-get/:id` - Get play details
- `PATCH /.netlify/functions/plays-update-status/:id` - Update play status
- `POST /.netlify/functions/plays-process/:id` - Process play content

### Flashcards API
- `GET /.netlify/functions/flashcards-list` - List flashcards
- `POST /.netlify/functions/flashcards-regenerate/:playId` - Regenerate flashcards

### Quizzes API
- `GET /.netlify/functions/quiz-assignments-list` - List quiz assignments
- `GET /.netlify/functions/quiz-assignments-get/:id` - Get quiz assignment
- `POST /.netlify/functions/quiz-assignments-create` - Create quiz assignment
- `POST /.netlify/functions/quiz-attempts-start` - Start quiz attempt
- `POST /.netlify/functions/quiz-attempts-submit` - Submit quiz attempt

## Testing

### Test Local Development
1. Start Netlify dev server:
   ```bash
   netlify dev
   ```

2. Navigate to a page that uses the new APIs:
   - `/coach/playbook` - Uses usePlays hook
   - `/games/quiz-cards` - Uses usePlays and useFlashcards
   - `/playbook` - Uses usePlays hook

3. Check browser console - should NOT see:
   - 404 errors for /.netlify/functions endpoints
   - "API request failed" errors
   - CORS errors

4. Verify data loads correctly

### Test Production Build
1. Build for production:
   ```bash
   npm run build
   netlify deploy --prod
   ```

2. Verify APIs work in production environment

## Benefits

### ✅ Works in All Environments
- Local development (with Netlify CLI)
- Preview deployments (Netlify)
- Production (Netlify)

### ✅ Consistent Pattern
- Matches how playbooks API works
- Uses same environment detection logic
- No hardcoded URLs

### ✅ Better Developer Experience
- No manual configuration needed
- Automatic environment detection
- Clear error messages if misconfigured

## Common Issues

### Issue: "Failed to fetch" or "API request failed"

**Cause:** Running `npm run dev` instead of `netlify dev`

**Solution:** Stop the dev server and run:
```bash
netlify dev
```

### Issue: CORS errors in local development

**Cause:** Next.js on port 3000 trying to fetch from port 8888

**Solution:** Already handled by `netlify dev` proxy. Make sure you're using `netlify dev`.

### Issue: 404 on /.netlify/functions endpoints

**Cause:** Netlify CLI not running or functions not built

**Solution:**
1. Make sure `netlify dev` is running (not `npm run dev`)
2. Check that functions exist in `netlify/functions/` directory
3. Verify netlify.toml configuration:
   ```toml
   [build]
     functions = "netlify/functions"
   ```

## Alternative: Next.js API Proxies (Not Recommended)

If you absolutely cannot use `netlify dev`, you could create Next.js API routes that proxy to Netlify functions. However, this is NOT recommended because:

- Adds maintenance overhead (duplicate routes)
- May have subtle differences from production
- Requires additional configuration
- Doesn't test actual Netlify function behavior

## Rollback

If issues occur:
```bash
# Restore API clients
cp src/lib/api/plays.ts.backup src/lib/api/plays.ts
cp src/lib/api/flashcards.ts.backup src/lib/api/flashcards.ts
cp src/lib/api/quizzes.ts.backup src/lib/api/quizzes.ts
```

## Related Documentation

- [Netlify Dev Documentation](https://docs.netlify.com/cli/get-started/#run-a-local-development-environment)
- [Netlify Functions Documentation](https://docs.netlify.com/functions/overview/)
- Next.js API Routes (existing playbooks endpoint for reference)

---

**Fix Date:** January 26, 2026
**Issue:** API clients failing in local development
**Status:** ✅ Fixed
**Tested:** ⏳ Pending user verification
**Important:** Must use `netlify dev` for local development!
