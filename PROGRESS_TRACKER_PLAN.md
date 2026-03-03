# Add Real Progress Tracking to Protection Analysis

## Context
When a user clicks "Analyze Playbooks" in the RB Protection game, the UI shows a fake 60% progress bar and polls `player_block_coverages` every 8s comparing row counts. If the analysis fails, the user waits 10 minutes before seeing an error. The backend worker processes PDFs sequentially but never reports intermediate progress.

## Changes

### 1. Add `pdfs_processed` column to `player_playbook_analysis`
- **File:** `src/lib/database/migrations/025_analysis_progress_tracking.sql`
- `ALTER TABLE player_playbook_analysis ADD COLUMN IF NOT EXISTS pdfs_processed INT DEFAULT 0;`
- This gives us "PDF 2 of 5" progress alongside the existing `pdf_count`

### 2. Update worker to report progress after each PDF
- **File:** `netlify/functions/workers/protection-analysis-worker.ts`
- After each PDF is processed in the loop (line ~124-127), update the analysis record:
  ```
  pdfs_processed: i + 1
  formations_extracted: allScenarios.length  (running total)
  ```
- This is 1 small Supabase write per PDF — negligible cost

### 3. Create a status endpoint
- **File:** `netlify/functions/player-analysis-status.ts`
- GET with `?analysisId=xxx&orgId=xxx`
- Returns the `player_playbook_analysis` row: `{ status, pdf_count, pdfs_processed, formations_extracted, error_message, started_at }`
- Auth: player-level (same as protections-analyze)
- **File:** `netlify.toml` — add redirect `/api/player-analysis-status` → `/.netlify/functions/player-analysis-status`

### 4. Update frontend polling to use status endpoint
- **File:** `src/components/games/RBProtectionContent.tsx`
- Replace `startPolling()` (lines 645-699):
  - Poll `GET /api/player-analysis-status?analysisId=xxx&orgId=xxx` every 5s
  - Track `pdfs_processed`, `pdf_count`, `formations_extracted` in state
  - On `status === 'completed'` → fetch scenarios from `player_block_coverages` and finish
  - On `status === 'failed'` → show error immediately (no 10-min wait)
  - Keep 10-min safety timeout as fallback

### 5. Update progress banner UI
- **File:** `src/components/games/RBProtectionContent.tsx` (lines 989-1005)
- Replace fake progress bar with real data:
  - "Processing PDF 2 of 5..."
  - "8 scenarios extracted so far"
  - Real progress bar: `(pdfs_processed / pdf_count) * 100`%
  - Show elapsed time
- On failure, show `error_message` from backend instead of generic text

## Verification
1. Run migration SQL in Supabase dashboard
2. Click "Analyze Playbooks" → see real "PDF X of Y" progress
3. Watch progress bar advance as each PDF completes
4. If worker fails, UI should show error within 5 seconds (not 10 minutes)
5. On completion, scenarios load normally
