# Migration Plan: Netlify Background Functions → Upstash Redis + BullMQ

## Executive Summary

Replace the current fire-and-forget Netlify background function pattern with a durable job queue powered by Upstash Redis + BullMQ. Additionally, replace client-side polling with Supabase Realtime subscriptions for instant status updates.

**Current state:** 5 background functions triggered via fire-and-forget `fetch()` calls, with frontend polling every 3 seconds for up to 15 minutes.

**Target state:** Jobs enqueued to Redis via BullMQ with automatic retries, priority queues, concurrency controls, and real-time status updates via Supabase Realtime.

---

## Table of Contents

1. [Architecture Overview](#1-architecture-overview)
2. [Dependencies & Setup](#2-dependencies--setup)
3. [Queue Infrastructure](#3-queue-infrastructure)
4. [Migrate Background Functions to Workers](#4-migrate-background-functions-to-workers)
5. [Migrate Trigger Functions to Enqueue Jobs](#5-migrate-trigger-functions-to-enqueue-jobs)
6. [Worker Entrypoint (Netlify Function)](#6-worker-entrypoint-netlify-function)
7. [Replace Frontend Polling with Supabase Realtime](#7-replace-frontend-polling-with-supabase-realtime)
8. [Database Changes](#8-database-changes)
9. [Environment Variables](#9-environment-variables)
10. [Netlify Configuration Changes](#10-netlify-configuration-changes)
11. [Testing Strategy](#11-testing-strategy)
12. [Rollback Plan](#12-rollback-plan)
13. [Phase 2: Scale-Ready Enhancements](#13-phase-2-scale-ready-enhancements)
14. [File Change Summary](#14-file-change-summary)

---

## 1. Architecture Overview

### Current Architecture (Fire-and-Forget)

```
Frontend
  │
  ├── POST /api/plays-process/:id
  │     ├── Update DB: content_status = 'generating'
  │     ├── Return HTTP 202 immediately
  │     └── fetch("/.netlify/functions/process-play-content-background") ← fire-and-forget
  │           └── [15-min timeout] AI processing → write results to DB
  │
  └── Poll GET /api/plays/:id every 3 seconds (up to 300 attempts)
        └── Check content_status field
```

**Problems:**
- Fire-and-forget `fetch()` can silently fail (cold starts, deploy race conditions)
- No retry mechanism — crashed jobs stay in `generating` status forever
- No job visibility or monitoring
- Client polls Supabase every 3 seconds per active job — scales poorly
- No concurrency control — 10 concurrent uploads = 10 concurrent OpenAI API calls
- No priority system for different org tiers

### Target Architecture (Redis + BullMQ + Supabase Realtime)

```
Frontend
  │
  ├── POST /api/plays-process/:id
  │     ├── Update DB: content_status = 'generating'
  │     ├── Enqueue job to Redis via BullMQ
  │     └── Return HTTP 202 with jobId
  │
  └── Supabase Realtime subscription on `plays` table
        └── Instant notification when content_status changes
              └── Update UI immediately

Redis (Upstash)
  │
  └── BullMQ Queue: "play-processing"
        ├── Job: { playId, imageUrl, ... }
        ├── Retries: 3 with exponential backoff
        ├── Priority: based on org tier
        └── Concurrency: 5 concurrent jobs max

Worker (Netlify Background Function OR dedicated process)
  │
  └── BullMQ Worker picks up jobs from queue
        ├── AI processing (GPT-4o / Claude)
        ├── Write results to Supabase
        └── On failure: auto-retry or move to dead-letter queue
```

---

## 2. Dependencies & Setup

### 2.1 Install npm packages

```bash
npm install bullmq @upstash/redis ioredis
```

| Package | Purpose | Cost |
|---------|---------|------|
| `bullmq` | Job queue library (open source, free) | $0 |
| `@upstash/redis` | Serverless Redis client for Upstash | $0 |
| `ioredis` | Redis client required by BullMQ | $0 |

### 2.2 Create Upstash Redis instance

1. Go to [console.upstash.com](https://console.upstash.com)
2. Create a new Redis database
3. Select region closest to your Netlify deployment (likely US-East-1)
4. Start with the **Free tier** (256MB, 500K commands/month)
5. Copy the connection credentials:
   - `UPSTASH_REDIS_REST_URL`
   - `UPSTASH_REDIS_REST_TOKEN`
   - `UPSTASH_REDIS_URL` (the `rediss://` connection string for ioredis)

### 2.3 Add environment variables to Netlify

Add these to your Netlify site settings → Environment Variables:

```
UPSTASH_REDIS_URL=rediss://default:xxxxx@us1-xxxxx.upstash.io:6379
UPSTASH_REDIS_REST_URL=https://us1-xxxxx.upstash.io
UPSTASH_REDIS_REST_TOKEN=xxxxx
```

---

## 3. Queue Infrastructure

### 3.1 Create `netlify/functions/shared/queue.ts`

This is the central queue configuration file. All trigger functions and workers import from here.

```typescript
/**
 * BullMQ Queue Configuration
 * Central queue setup for all background job processing
 */

import { Queue, Worker, QueueEvents, Job } from 'bullmq';
import IORedis from 'ioredis';

// ----- Redis Connection -----

const REDIS_URL = process.env.UPSTASH_REDIS_URL;

if (!REDIS_URL) {
  console.error('Missing UPSTASH_REDIS_URL environment variable');
}

/**
 * Create a new Redis connection for BullMQ.
 * Upstash requires TLS (`rediss://` protocol).
 * BullMQ needs `maxRetriesPerRequest: null` to work properly.
 */
export function createRedisConnection(): IORedis {
  return new IORedis(REDIS_URL!, {
    maxRetriesPerRequest: null, // Required by BullMQ
    enableReadyCheck: false,
    tls: {
      rejectUnauthorized: false, // Upstash uses self-signed certs
    },
  });
}

// ----- Queue Names -----

export const QUEUE_NAMES = {
  PLAY_PROCESSING: 'play-processing',
  PLAYER_PLAY_PROCESSING: 'player-play-processing',
  PROTECTION_ANALYSIS: 'protection-analysis',
  FORMATIONS_ANALYSIS: 'formations-analysis',
  QUESTION_REGENERATION: 'question-regeneration',
} as const;

// ----- Job Data Interfaces -----

export interface PlayProcessingJobData {
  playId: string;
  imageUrl?: string;
  playData?: any;
  fileName?: string;
  generateInsights: boolean;
  generateAssignments: boolean;
  generateKnowledge: boolean;
}

export interface PlayerPlayProcessingJobData {
  playId: string;
  imageUrl?: string;
  generateInsights: boolean;
  generateAssignments: boolean;
  generateKnowledge: boolean;
  useStructuredData?: boolean;
}

export interface ProtectionAnalysisJobData {
  analysisId: string;
  userId: string;
  orgId: string;
  pdfIds: string[];
}

export interface FormationsAnalysisJobData {
  analysisId: string;
  userId: string;
  orgId: string;
  pdfIds: string[];
  positions: string[];
  modules: string[];
}

export interface QuestionRegenerationJobData {
  playId: string;
  orgId: string;
  userId: string;
  questionCount?: number;
  deactivateOld?: boolean;
}

// ----- Queue Factories -----

/**
 * Get or create a queue instance.
 * Queues are cheap to create — BullMQ handles connection pooling.
 */
export function getQueue(queueName: string): Queue {
  const connection = createRedisConnection();
  return new Queue(queueName, {
    connection,
    defaultJobOptions: {
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 5000, // 5s, 10s, 20s
      },
      removeOnComplete: {
        age: 86400,   // Keep completed jobs for 24 hours
        count: 1000,  // Keep last 1000 completed jobs
      },
      removeOnFail: {
        age: 604800,  // Keep failed jobs for 7 days
        count: 5000,  // Keep last 5000 failed jobs
      },
    },
  });
}

// ----- Priority Levels -----
// Lower number = higher priority in BullMQ

export const JOB_PRIORITY = {
  NFL: 1,       // Highest priority
  COLLEGE: 5,   // Medium priority
  HIGH_SCHOOL: 10, // Standard priority
  DEFAULT: 10,  // Default for now (all orgs treated equally until tiers exist)
} as const;

// ----- Helper: Enqueue a job -----

export async function enqueueJob<T>(
  queueName: string,
  jobName: string,
  data: T,
  options?: {
    priority?: number;
    delay?: number; // Delay in ms before job becomes available
    jobId?: string; // Unique job ID to prevent duplicates
  }
): Promise<string> {
  const queue = getQueue(queueName);

  try {
    const job = await queue.add(jobName, data, {
      priority: options?.priority ?? JOB_PRIORITY.DEFAULT,
      delay: options?.delay,
      jobId: options?.jobId,
    });

    console.log(`📋 Job enqueued: ${queueName}/${jobName} (ID: ${job.id})`);
    return job.id!;
  } finally {
    await queue.close();
  }
}
```

### 3.2 Create `netlify/functions/shared/queue-jobs.ts`

Convenience functions for enqueuing specific job types.

```typescript
/**
 * Job Enqueue Helpers
 * Type-safe functions to enqueue specific job types
 */

import {
  QUEUE_NAMES,
  enqueueJob,
  PlayProcessingJobData,
  PlayerPlayProcessingJobData,
  ProtectionAnalysisJobData,
  FormationsAnalysisJobData,
  QuestionRegenerationJobData,
} from './queue';

export async function enqueuePlayProcessing(
  data: PlayProcessingJobData,
  priority?: number
): Promise<string> {
  return enqueueJob(
    QUEUE_NAMES.PLAY_PROCESSING,
    'process-play',
    data,
    {
      priority,
      jobId: `play-${data.playId}`, // Prevent duplicate processing
    }
  );
}

export async function enqueuePlayerPlayProcessing(
  data: PlayerPlayProcessingJobData,
  priority?: number
): Promise<string> {
  return enqueueJob(
    QUEUE_NAMES.PLAYER_PLAY_PROCESSING,
    'process-player-play',
    data,
    {
      priority,
      jobId: `player-play-${data.playId}`,
    }
  );
}

export async function enqueueProtectionAnalysis(
  data: ProtectionAnalysisJobData,
  priority?: number
): Promise<string> {
  return enqueueJob(
    QUEUE_NAMES.PROTECTION_ANALYSIS,
    'analyze-protections',
    data,
    {
      priority,
      jobId: `protection-${data.analysisId}`,
    }
  );
}

export async function enqueueFormationsAnalysis(
  data: FormationsAnalysisJobData,
  priority?: number
): Promise<string> {
  return enqueueJob(
    QUEUE_NAMES.FORMATIONS_ANALYSIS,
    'analyze-formations',
    data,
    {
      priority,
      jobId: `formations-${data.analysisId}`,
    }
  );
}

export async function enqueueQuestionRegeneration(
  data: QuestionRegenerationJobData,
  priority?: number
): Promise<string> {
  return enqueueJob(
    QUEUE_NAMES.QUESTION_REGENERATION,
    'regenerate-questions',
    data,
    {
      priority,
      jobId: `questions-${data.playId}-${Date.now()}`, // Allow multiple regenerations
    }
  );
}
```

---

## 4. Migrate Background Functions to Workers

The existing background function logic stays almost identical — we just extract the processing logic into standalone functions that BullMQ workers call.

### 4.1 Create `netlify/functions/workers/play-processing-worker.ts`

This file contains the **pure processing logic** extracted from `process-play-content-background.ts`. The existing code is moved here with minimal changes — the only difference is it receives job data as a parameter instead of parsing `event.body`.

```typescript
/**
 * Play Processing Worker
 * Extracted logic from process-play-content-background.ts
 * Called by the BullMQ worker, NOT directly via HTTP
 */

import { PlayProcessingJobData } from '../shared/queue';
import { getSupabaseAdmin } from '../shared/supabase';
// ... (same imports as process-play-content-background.ts)

export async function processPlay(data: PlayProcessingJobData): Promise<void> {
  const {
    playId,
    imageUrl,
    playData,
    fileName,
    generateInsights,
    generateAssignments,
    generateKnowledge,
  } = data;

  const supabase = getSupabaseAdmin();
  const startTime = Date.now();

  try {
    // ---- EXACT SAME LOGIC as process-play-content-background.ts ----
    // Lines 92-541 of the current file move here unchanged.
    // The only difference: instead of parsing event.body, we use `data` directly.
    // Instead of returning HTTP responses, we throw errors or return void.

    // Fetch play and metadata...
    // AI analysis...
    // Insert assignments...
    // Insert flashcards...
    // Generate questions...
    // Update content_status to 'draft'...

    const duration = Date.now() - startTime;
    console.log(`Play ${playId} processed in ${(duration / 1000).toFixed(2)}s`);
  } catch (error: any) {
    console.error(`Play ${playId} processing failed:`, error);

    // Mark as rejected
    await supabase
      .from('plays')
      .update({ content_status: 'rejected' })
      .eq('id', playId);

    throw error; // Re-throw so BullMQ knows the job failed and can retry
  }
}
```

### 4.2 Create `netlify/functions/workers/player-play-processing-worker.ts`

Same approach — extract the logic from `process-player-play-content-background.ts`.

```typescript
import { PlayerPlayProcessingJobData } from '../shared/queue';
import { getSupabaseAdmin } from '../shared/supabase';

export async function processPlayerPlay(data: PlayerPlayProcessingJobData): Promise<void> {
  // ---- EXACT SAME LOGIC as process-player-play-content-background.ts ----
  // Lines 65-388 move here.
  // On failure: mark content_status = 'rejected', then re-throw.
}
```

### 4.3 Create `netlify/functions/workers/protection-analysis-worker.ts`

```typescript
import { ProtectionAnalysisJobData } from '../shared/queue';
import { getSupabaseAdmin } from '../shared/supabase';

export async function analyzeProtections(data: ProtectionAnalysisJobData): Promise<void> {
  // ---- EXACT SAME LOGIC as process-protection-analysis-background.ts ----
  // Lines 51-196 move here.
  // On failure: update player_playbook_analysis status = 'failed', then re-throw.
}
```

### 4.4 Create `netlify/functions/workers/formations-analysis-worker.ts`

```typescript
import { FormationsAnalysisJobData } from '../shared/queue';
import { getSupabaseAdmin } from '../shared/supabase';

export async function analyzeFormations(data: FormationsAnalysisJobData): Promise<void> {
  // ---- EXACT SAME LOGIC as process-formations-analysis-background.ts ----
  // Lines 38-196 move here.
  // On failure: update player_playbook_analysis status = 'failed', then re-throw.
}
```

### 4.5 Create `netlify/functions/workers/question-regeneration-worker.ts`

```typescript
import { QuestionRegenerationJobData } from '../shared/queue';
import { getSupabaseAdmin } from '../shared/supabase';

export async function regenerateQuestions(data: QuestionRegenerationJobData): Promise<void> {
  // ---- EXACT SAME LOGIC as questions-regenerate-background.ts ----
  // Lines 35-296 move here.
  // On failure: throw error (no status field to update for this job type).
}
```

### Key changes in worker extraction

For ALL workers, the changes from the original background functions are:

1. **Remove `Handler` export** — these are no longer HTTP endpoints
2. **Remove HTTP request/response handling** — no `event.body` parsing, no `statusCode` returns
3. **Accept typed job data as parameter** — `data: PlayProcessingJobData` instead of `JSON.parse(event.body)`
4. **Throw errors instead of returning error responses** — BullMQ catches thrown errors and retries
5. **Keep ALL business logic identical** — AI calls, DB operations, position normalization, etc.

---

## 5. Migrate Trigger Functions to Enqueue Jobs

### 5.1 Update `netlify/functions/plays-process.ts`

**Before (fire-and-forget):**
```typescript
// Fire-and-forget call to background function
fetch(backgroundFunctionUrl, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ playId, imageUrl, ... }),
}).catch((error) => {
  console.error('Failed to trigger background function:', error);
});
```

**After (enqueue to Redis):**
```typescript
import { enqueuePlayProcessing } from './shared/queue-jobs';

// ... (keep all existing auth, validation, status update logic)

// Replace the fire-and-forget fetch with:
const jobId = await enqueuePlayProcessing({
  playId,
  imageUrl,
  generateInsights,
  generateAssignments,
  generateKnowledge,
});

console.log(`Enqueued play processing job ${jobId} for play ${playId}`);

return {
  statusCode: 202,
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    success: true,
    playId,
    jobId, // NEW: return jobId for tracking
    status: 'generating',
    message: 'Processing queued. You will be notified when complete.',
  }),
};
```

### 5.2 Update `netlify/functions/player-plays-process.ts`

Same pattern — replace the fire-and-forget `fetch()` with:

```typescript
import { enqueuePlayerPlayProcessing } from './shared/queue-jobs';

const jobId = await enqueuePlayerPlayProcessing({
  playId,
  imageUrl,
  generateInsights,
  generateAssignments,
  generateKnowledge,
});
```

### 5.3 Update `netlify/functions/player-protections-analyze.ts`

```typescript
import { enqueueProtectionAnalysis } from './shared/queue-jobs';

const jobId = await enqueueProtectionAnalysis({
  analysisId: analysis.id,
  userId: user.userId,
  orgId: user.orgId,
  pdfIds: pdfs.map(p => p.id),
});
```

### 5.4 Update `netlify/functions/player-formations-analyze.ts`

```typescript
import { enqueueFormationsAnalysis } from './shared/queue-jobs';

const jobId = await enqueueFormationsAnalysis({
  analysisId: analysis.id,
  userId: user.userId,
  orgId: user.orgId,
  pdfIds: pdfs.map(p => p.id),
  positions: body.positions || ['QB', 'RB', 'WR', 'OT'],
  modules: body.modules || ['posse_2x2', 'posse_trips', 'quads', 'ranger', 'zombie', 'empty', 'special'],
});
```

### 5.5 Update `netlify/functions/questions-regenerate.ts`

```typescript
import { enqueueQuestionRegeneration } from './shared/queue-jobs';

const jobId = await enqueueQuestionRegeneration({
  playId,
  orgId: user.orgId,
  userId: user.userId,
  questionCount,
  deactivateOld,
});
```

### Changes per trigger function (summary)

For ALL 5 trigger functions, the changes are:

1. **Remove** the `backgroundFunctionUrl` construction
2. **Remove** the fire-and-forget `fetch()` call
3. **Add** import of the appropriate `enqueue*` function
4. **Add** `const jobId = await enqueue*(...)` call
5. **Add** `jobId` to the HTTP 202 response body
6. **Keep** everything else (auth, validation, status updates) unchanged

---

## 6. Worker Entrypoint (Netlify Function)

We need a single Netlify background function that runs the BullMQ workers. This replaces all 5 existing background functions.

### 6.1 Create `netlify/functions/queue-worker-background.ts`

```typescript
/**
 * BullMQ Worker Entrypoint
 * This is a Netlify background function (15-min timeout) that processes
 * jobs from ALL queues.
 *
 * It is triggered periodically or by a webhook to drain the queue.
 * The -background suffix gives it the 15-minute Netlify timeout.
 */

import { Handler } from '@netlify/functions';
import { Worker, Job } from 'bullmq';
import { createRedisConnection, QUEUE_NAMES } from './shared/queue';
import { processPlay } from './workers/play-processing-worker';
import { processPlayerPlay } from './workers/player-play-processing-worker';
import { analyzeProtections } from './workers/protection-analysis-worker';
import { analyzeFormations } from './workers/formations-analysis-worker';
import { regenerateQuestions } from './workers/question-regeneration-worker';

const WORKER_TIMEOUT_MS = 14 * 60 * 1000; // 14 minutes (leave 1 min buffer)

export const handler: Handler = async (event) => {
  const startTime = Date.now();
  const connection = createRedisConnection();

  console.log('🏭 Queue worker started');

  // Track active workers so we can shut them down gracefully
  const workers: Worker[] = [];

  try {
    // Create workers for each queue
    const playWorker = new Worker(
      QUEUE_NAMES.PLAY_PROCESSING,
      async (job: Job) => {
        console.log(`▶️ Processing play job ${job.id}: ${job.data.playId}`);
        await processPlay(job.data);
      },
      { connection: createRedisConnection(), concurrency: 3 }
    );
    workers.push(playWorker);

    const playerPlayWorker = new Worker(
      QUEUE_NAMES.PLAYER_PLAY_PROCESSING,
      async (job: Job) => {
        console.log(`▶️ Processing player play job ${job.id}: ${job.data.playId}`);
        await processPlayerPlay(job.data);
      },
      { connection: createRedisConnection(), concurrency: 3 }
    );
    workers.push(playerPlayWorker);

    const protectionWorker = new Worker(
      QUEUE_NAMES.PROTECTION_ANALYSIS,
      async (job: Job) => {
        console.log(`▶️ Processing protection analysis job ${job.id}`);
        await analyzeProtections(job.data);
      },
      { connection: createRedisConnection(), concurrency: 2 }
    );
    workers.push(protectionWorker);

    const formationsWorker = new Worker(
      QUEUE_NAMES.FORMATIONS_ANALYSIS,
      async (job: Job) => {
        console.log(`▶️ Processing formations analysis job ${job.id}`);
        await analyzeFormations(job.data);
      },
      { connection: createRedisConnection(), concurrency: 2 }
    );
    workers.push(formationsWorker);

    const questionsWorker = new Worker(
      QUEUE_NAMES.QUESTION_REGENERATION,
      async (job: Job) => {
        console.log(`▶️ Processing question regeneration job ${job.id}`);
        await regenerateQuestions(job.data);
      },
      { connection: createRedisConnection(), concurrency: 5 }
    );
    workers.push(questionsWorker);

    // Log worker events
    for (const worker of workers) {
      worker.on('completed', (job) => {
        console.log(`✅ Job ${job.id} completed`);
      });
      worker.on('failed', (job, err) => {
        console.error(`❌ Job ${job?.id} failed:`, err.message);
      });
    }

    // Run until timeout approaches
    await new Promise<void>((resolve) => {
      const checkInterval = setInterval(() => {
        const elapsed = Date.now() - startTime;
        if (elapsed >= WORKER_TIMEOUT_MS) {
          console.log('⏰ Approaching timeout, shutting down workers...');
          clearInterval(checkInterval);
          resolve();
        }
      }, 5000);
    });

    // Graceful shutdown
    console.log('🛑 Shutting down workers...');
    await Promise.all(workers.map(w => w.close()));
    await connection.quit();

    console.log('🏭 Queue worker completed');

    return {
      statusCode: 200,
      body: JSON.stringify({ success: true, runtime: Date.now() - startTime }),
    };
  } catch (error: any) {
    console.error('🏭 Queue worker error:', error);
    await Promise.all(workers.map(w => w.close().catch(() => {})));
    await connection.quit().catch(() => {});

    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message }),
    };
  }
};
```

### 6.2 Worker Invocation Strategy

The worker needs to be kept alive. There are two approaches:

#### Option A: Self-invoking (recommended for Phase 1)

Each trigger function, after enqueuing a job, also pings the worker function to ensure it's running:

```typescript
// Add to each trigger function AFTER enqueuing the job:
const workerUrl = `${protocol}://${host}/.netlify/functions/queue-worker-background`;
fetch(workerUrl, { method: 'POST' }).catch(() => {
  // Worker may already be running — that's fine
});
```

The worker is idempotent — if it's already running, the new invocation will process any new jobs.

#### Option B: Cron-based (better for Phase 2)

Use Netlify Scheduled Functions or an external cron (Upstash QStash, GitHub Actions cron) to invoke the worker every 1-2 minutes:

```toml
# netlify.toml
[functions."queue-worker-background"]
  schedule = "* * * * *"  # Every minute
```

This ensures the worker is always running and picking up jobs, even if the trigger function's ping fails.

---

## 7. Replace Frontend Polling with Supabase Realtime

### 7.1 Update `src/contexts/PlayContentGenerationContext.tsx`

**Before (polling loop):**
```typescript
// Poll every 3 seconds for up to 15 minutes
let attempts = 0;
const maxAttempts = 300;
let complete = false;

while (!complete && attempts < maxAttempts) {
  await new Promise(resolve => setTimeout(resolve, 3000));
  attempts++;
  const statusData = await playsAPI.getPlay(playId, ...);
  if (statusData.play.contentStatus === 'draft') {
    complete = true;
  }
}
```

**After (Supabase Realtime):**
```typescript
import { createClient } from '@supabase/supabase-js';

// Inside startGeneration, after creating the play:
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  {
    global: {
      headers: { Authorization: `Bearer ${session.access_token}` },
    },
  }
);

// Subscribe to real-time changes on this specific play
const complete = await new Promise<boolean>((resolve, reject) => {
  const timeoutId = setTimeout(() => {
    subscription.unsubscribe();
    reject(new Error(`Timeout waiting for ${play.name} to complete`));
  }, 15 * 60 * 1000); // 15 minute timeout

  const subscription = supabase
    .channel(`play-status-${playId}`)
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'plays',
        filter: `id=eq.${playId}`,
      },
      (payload) => {
        const newStatus = payload.new.content_status;
        console.log(`[Realtime] Play ${playId} status: ${newStatus}`);

        if (newStatus === 'draft' || newStatus === 'approved') {
          clearTimeout(timeoutId);
          subscription.unsubscribe();
          resolve(true);
        } else if (newStatus === 'rejected') {
          clearTimeout(timeoutId);
          subscription.unsubscribe();
          reject(new Error(`Generation failed for ${play.name}`));
        }
        // 'generating' — keep listening
      }
    )
    .subscribe();
});
```

### 7.2 Enable Supabase Realtime on relevant tables

In the Supabase dashboard (or via migration SQL):

```sql
-- Enable realtime for play status updates
ALTER PUBLICATION supabase_realtime ADD TABLE plays;
ALTER PUBLICATION supabase_realtime ADD TABLE player_plays;
ALTER PUBLICATION supabase_realtime ADD TABLE player_playbook_analysis;
```

**Important:** Only enable Realtime on the tables that need it. Each table adds overhead to the Realtime system.

### 7.3 Update protection/formations analysis polling

Any frontend component that polls `player_playbook_analysis` for status should also switch to Supabase Realtime:

```typescript
// Subscribe to analysis status changes
supabase
  .channel(`analysis-status-${analysisId}`)
  .on(
    'postgres_changes',
    {
      event: 'UPDATE',
      schema: 'public',
      table: 'player_playbook_analysis',
      filter: `id=eq.${analysisId}`,
    },
    (payload) => {
      if (payload.new.status === 'completed') {
        // Analysis complete — refresh data
      } else if (payload.new.status === 'failed') {
        // Analysis failed — show error
      }
    }
  )
  .subscribe();
```

---

## 8. Database Changes

### 8.1 Optional: `job_queue` table for visibility

While BullMQ stores job state in Redis, you may want a Supabase table for dashboard visibility and historical tracking:

```sql
-- Optional: Job tracking table for admin dashboard
CREATE TABLE IF NOT EXISTS job_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  queue_name TEXT NOT NULL,
  job_id TEXT NOT NULL,        -- BullMQ job ID
  job_type TEXT NOT NULL,      -- 'process-play', 'analyze-protections', etc.
  status TEXT NOT NULL DEFAULT 'queued',  -- queued, processing, completed, failed
  priority INTEGER DEFAULT 10,
  payload JSONB NOT NULL,
  result JSONB,
  error_message TEXT,
  attempts INTEGER DEFAULT 0,
  org_id UUID REFERENCES organizations(id),
  user_id UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  UNIQUE(queue_name, job_id)
);

-- Index for dashboard queries
CREATE INDEX idx_job_queue_status ON job_queue(status, created_at DESC);
CREATE INDEX idx_job_queue_org ON job_queue(org_id, created_at DESC);

-- Enable RLS
ALTER TABLE job_queue ENABLE ROW LEVEL SECURITY;

-- Admins can see all jobs for their org
CREATE POLICY "org_admins_view_jobs" ON job_queue
  FOR SELECT USING (org_id IN (
    SELECT org_id FROM profiles WHERE user_id = auth.uid() AND role IN ('admin', 'coach')
  ));
```

This table is **optional for Phase 1** but becomes valuable for ops visibility as you scale.

### 8.2 Enable Realtime publications

```sql
-- Enable realtime on tables that need instant status updates
ALTER PUBLICATION supabase_realtime ADD TABLE plays;
ALTER PUBLICATION supabase_realtime ADD TABLE player_plays;
ALTER PUBLICATION supabase_realtime ADD TABLE player_playbook_analysis;
```

---

## 9. Environment Variables

### Current environment variables (unchanged)

```
NEXT_PUBLIC_SUPABASE_URL          # Already exists
NEXT_PUBLIC_SUPABASE_ANON_KEY     # Already exists
SUPABASE_SERVICE_ROLE_KEY         # Already exists
GPT_KEY                           # Already exists (OpenAI)
OPENAI_API_KEY                    # Already exists (fallback)
ANTHROPIC_API_KEY                 # Already exists
```

### New environment variables to add

```
UPSTASH_REDIS_URL                 # rediss://default:xxxxx@us1-xxxxx.upstash.io:6379
UPSTASH_REDIS_REST_URL            # https://us1-xxxxx.upstash.io (optional, for REST API)
UPSTASH_REDIS_REST_TOKEN          # xxxxx (optional, for REST API)
```

Add these to:
1. Netlify site settings → Environment Variables
2. Local `.env` file (for development)

---

## 10. Netlify Configuration Changes

### 10.1 Update `netlify.toml`

Add the external modules that BullMQ needs:

```toml
[functions]
  directory = "netlify/functions"
  node_bundler = "esbuild"
  external_node_modules = ["@supabase/supabase-js", "bullmq", "ioredis"]
```

### 10.2 Old background functions

After migration is verified:

1. **Keep the old background functions** initially — they won't be called anymore since trigger functions now enqueue to Redis instead
2. **Delete them** once you've verified the new system works in production:
   - `process-play-content-background.ts`
   - `process-player-play-content-background.ts`
   - `process-protection-analysis-background.ts`
   - `process-formations-analysis-background.ts`
   - `questions-regenerate-background.ts`

---

## 11. Testing Strategy

### 11.1 Local development testing

1. **Use Upstash Redis** even locally (it's serverless, no Docker needed)
2. Run `netlify dev` to test trigger functions
3. Run the worker function manually via `curl`:
   ```bash
   curl -X POST http://localhost:8888/.netlify/functions/queue-worker-background
   ```
4. Verify jobs are enqueued and processed

### 11.2 Verification checklist

For each of the 5 job types, verify:

- [ ] Trigger function enqueues job to Redis (check Upstash console)
- [ ] Worker picks up job and processes it
- [ ] On success: DB records are created/updated correctly
- [ ] On failure: job is retried (up to 3 times)
- [ ] On permanent failure: status is set to 'rejected' or 'failed'
- [ ] Frontend receives Realtime update (no more polling)
- [ ] Duplicate job prevention works (same play can't be queued twice)

### 11.3 Staged rollout

1. **Week 1:** Deploy new queue infrastructure alongside existing fire-and-forget. Both paths active — enqueue AND fire-and-forget. Compare results.
2. **Week 2:** Disable fire-and-forget. Queue-only path. Monitor for issues.
3. **Week 3:** Remove old background functions. Clean deploy.

---

## 12. Rollback Plan

If something goes wrong, rolling back is trivial:

1. **Revert trigger functions** to use fire-and-forget `fetch()` calls (git revert)
2. **Revert frontend** to polling (git revert)
3. The old `*-background.ts` functions still exist and work immediately
4. **Redis data** can be safely deleted — it's just a queue, not source of truth. Supabase remains your source of truth throughout.

**Data safety:** At no point does this migration change where data is stored. Supabase is always the source of truth. Redis is only used as a transient job queue.

---

## 13. Phase 2: Scale-Ready Enhancements

Once the basic migration is working, these are the next steps for NFL-scale readiness:

### 13.1 Priority queues by org tier

```typescript
// When orgs have a tier field:
const priority = org.tier === 'nfl' ? JOB_PRIORITY.NFL
  : org.tier === 'college' ? JOB_PRIORITY.COLLEGE
  : JOB_PRIORITY.HIGH_SCHOOL;

await enqueuePlayProcessing(data, priority);
```

### 13.2 Per-org rate limiting

```typescript
// Add rate limiter to queue config
const queue = new Queue('play-processing', {
  connection,
  limiter: {
    max: 10,           // Max 10 jobs
    duration: 60_000,  // Per 60 seconds
    groupKey: 'orgId', // Per organization
  },
});
```

### 13.3 Dedicated workers (move off Netlify Functions)

For Phase 2+, move workers to dedicated compute:

- **Railway** ($5/mo): Run a long-lived Node.js process with BullMQ workers
- **Fly.io** ($0/mo free tier): Same, with auto-scaling
- **AWS ECS**: For NFL-scale, auto-scaling worker containers

The worker code stays identical — you just run it as a long-lived process instead of inside a Netlify function.

### 13.4 Bull Board (admin dashboard)

```typescript
import { createBullBoard } from '@bull-board/api';
import { BullMQAdapter } from '@bull-board/api/bullMQAdapter';

const { addQueue, removeQueue, setQueues, replaceQueues } = createBullBoard({
  queues: [
    new BullMQAdapter(playQueue),
    new BullMQAdapter(playerPlayQueue),
    new BullMQAdapter(protectionQueue),
    new BullMQAdapter(formationsQueue),
    new BullMQAdapter(questionsQueue),
  ],
});
```

### 13.5 Dead-letter queue

```typescript
// Jobs that fail all retries go to a DLQ for manual inspection
const dlq = new Queue('dead-letter-queue', { connection });

worker.on('failed', async (job, err) => {
  if (job && job.attemptsMade >= (job.opts.attempts || 3)) {
    await dlq.add('failed-job', {
      originalQueue: QUEUE_NAMES.PLAY_PROCESSING,
      originalJobId: job.id,
      data: job.data,
      error: err.message,
      failedAt: new Date().toISOString(),
    });
  }
});
```

---

## 14. File Change Summary

### New files to create

| File | Purpose |
|------|---------|
| `netlify/functions/shared/queue.ts` | Redis connection, queue config, interfaces |
| `netlify/functions/shared/queue-jobs.ts` | Type-safe enqueue helpers |
| `netlify/functions/queue-worker-background.ts` | BullMQ worker entrypoint |
| `netlify/functions/workers/play-processing-worker.ts` | Play processing logic (extracted) |
| `netlify/functions/workers/player-play-processing-worker.ts` | Player play logic (extracted) |
| `netlify/functions/workers/protection-analysis-worker.ts` | Protection analysis logic (extracted) |
| `netlify/functions/workers/formations-analysis-worker.ts` | Formations analysis logic (extracted) |
| `netlify/functions/workers/question-regeneration-worker.ts` | Question regen logic (extracted) |

### Files to modify

| File | Change |
|------|--------|
| `netlify/functions/plays-process.ts` | Replace `fetch()` with `enqueuePlayProcessing()` |
| `netlify/functions/player-plays-process.ts` | Replace `fetch()` with `enqueuePlayerPlayProcessing()` |
| `netlify/functions/player-protections-analyze.ts` | Replace `fetch()` with `enqueueProtectionAnalysis()` |
| `netlify/functions/player-formations-analyze.ts` | Replace `fetch()` with `enqueueFormationsAnalysis()` |
| `netlify/functions/questions-regenerate.ts` | Replace `fetch()` with `enqueueQuestionRegeneration()` |
| `src/contexts/PlayContentGenerationContext.tsx` | Replace polling with Supabase Realtime |
| `netlify.toml` | Add `bullmq`, `ioredis` to external_node_modules |
| `package.json` | Add `bullmq`, `@upstash/redis`, `ioredis` |

### Files to delete (after verification)

| File | Reason |
|------|--------|
| `netlify/functions/process-play-content-background.ts` | Logic moved to worker |
| `netlify/functions/process-player-play-content-background.ts` | Logic moved to worker |
| `netlify/functions/process-protection-analysis-background.ts` | Logic moved to worker |
| `netlify/functions/process-formations-analysis-background.ts` | Logic moved to worker |
| `netlify/functions/questions-regenerate-background.ts` | Logic moved to worker |

### Implementation order

1. Install dependencies (`bullmq`, `@upstash/redis`, `ioredis`)
2. Set up Upstash Redis instance and add env vars
3. Create `shared/queue.ts` and `shared/queue-jobs.ts`
4. Extract worker logic into `workers/*.ts` files
5. Create `queue-worker-background.ts`
6. Update `netlify.toml` with external modules
7. Update trigger functions one at a time (test each)
8. Enable Supabase Realtime on tables
9. Update frontend to use Realtime subscriptions
10. Deploy and verify with staged rollout
11. Delete old background functions after verification
