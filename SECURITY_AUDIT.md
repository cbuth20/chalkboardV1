# Security Audit — March 2026

## CRITICAL

### 1. Delete dead `chat.ts` endpoint
**File:** `netlify/functions/chat.ts`
Unauthenticated endpoint that calls OpenAI API. No auth, no route, no frontend usage — but still reachable at `/.netlify/functions/chat`. Anyone can burn your OpenAI credits.
**Fix:** Delete the file.

### 2. Fix TLS verification on Redis connection
**File:** `netlify/functions/shared/queue.ts:27`
`rejectUnauthorized: false` disables TLS cert verification. The comment says "Upstash uses self-signed certs" — this is incorrect, Upstash has valid certs.
**Fix:** Change to `rejectUnauthorized: true` or remove the `tls` block entirely.

---

## HIGH

### 3. Add security headers
**File:** `netlify.toml`
No security headers configured — no CSP, HSTS, X-Frame-Options, X-Content-Type-Options.
**Fix:** Add a `[[headers]]` section:
```toml
[[headers]]
  for = "/*"
  [headers.values]
    X-Frame-Options = "DENY"
    X-Content-Type-Options = "nosniff"
    Referrer-Policy = "strict-origin-when-cross-origin"
    Strict-Transport-Security = "max-age=31536000; includeSubDomains"
    Permissions-Policy = "camera=(), microphone=(), geolocation=()"
```

### 4. Cap pagination limits
**File:** `netlify/functions/plays-list.ts`
No max limit on `?limit=` query param. A user can request `limit=1000000`.
**Fix:** Add `Math.min(limit, 100)` to cap at a reasonable maximum. Check other list endpoints for the same issue.

### 5. Remove `ignoreBuildErrors: true`
**File:** `next.config.ts:9`
TypeScript errors are silently ignored during build, hiding real bugs.
**Fix:** Remove `typescript: { ignoreBuildErrors: true }` and fix resulting type errors.

### 6. Non-transactional multi-step operations
**Files:** `netlify/functions/player-plays-create.ts`, `netlify/functions/player-plays-delete.ts`
Multiple DB operations (create play → insert tags, or delete flashcards → delete assignments → delete play → delete files) are done without transactions. Partial failures leave data in inconsistent state.
**Fix:** Use Supabase RPC or wrap in a transaction where possible. At minimum, add rollback logic.

---

## MEDIUM

### 7. Missing env var validation
**Files:** `netlify/functions/coach.ts`, `process-play-content-background.ts`, `questions-regenerate-background.ts`
Functions use `process.env.GPT_KEY` etc. without checking if they exist. Fails with cryptic errors at runtime.
**Fix:** Add early validation (fail fast with clear error message).

### 8. Vulnerable dependencies
`npm audit` shows known vulnerabilities in minimatch (ReDoS) and Next.js (DoS vectors).
**Fix:** Run `npm audit fix` and assess.

### 9. Missing request body validation
**Files:** ~20+ functions use `JSON.parse(event.body || '{}')` without try-catch.
Invalid JSON will throw an uncaught exception → 500 error with no useful message.
**Fix:** Wrap JSON parsing in try-catch or add a shared `parseBody()` helper.

### 10. No max pagination limit enforced app-wide
Beyond `plays-list.ts`, audit all list/query endpoints for unbounded limit/offset params.

---

## LOW

### 11. Inconsistent error response format
Some functions return `{ error: '...' }`, some use `formatErrorResponse()` with `code` and `field`, some return plain text. Makes client-side error handling unreliable.

### 12. Frontend useEffect dependency warnings
**Files:** `src/contexts/OnboardingContext.tsx`, `src/components/ai-coach/CoachContext.tsx`, `src/app/film-room/page.tsx`
Missing or incorrect dependency arrays in useEffect hooks — can cause stale data or memory leaks.

### 13. No AbortController on fetch calls
Frontend fetch calls don't use AbortController, so navigating away from a page while a request is in-flight can cause state updates on unmounted components.

### 14. Hardcoded bucket name
**File:** `netlify/functions/player-plays-delete.ts:13`
`const BUCKET_NAME = 'Chalkboard Bucket'` is hardcoded. Should be an env var for environment flexibility.
