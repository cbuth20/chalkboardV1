/**
 * BullMQ Worker Entrypoint
 * This is a Netlify background function (15-min timeout) that processes
 * jobs from ALL queues.
 *
 * It is triggered by a ping from trigger functions after enqueuing a job.
 * The -background suffix gives it the 15-minute Netlify timeout.
 *
 * IMPORTANT: Exits after an idle period to minimize Redis commands on Upstash free tier.
 */

import { Handler } from '@netlify/functions';
import { Worker, Job } from 'bullmq';
import { createRedisConnection, QUEUE_NAMES } from './shared/queue';
import { processPlay } from './workers/play-processing-worker';
import { processPlayerPlay } from './workers/player-play-processing-worker';
import { analyzeProtections } from './workers/protection-analysis-worker';
import { analyzeFormations } from './workers/formations-analysis-worker';
import { regenerateQuestions } from './workers/question-regeneration-worker';

const WORKER_TIMEOUT_MS = 14 * 60 * 1000; // 14 minutes hard cap
const IDLE_TIMEOUT_MS = 5 * 60 * 1000; // Exit after 5 min with no job activity

export const handler: Handler = async (event) => {
  const startTime = Date.now();
  let lastActivityTime = Date.now();
  let jobsProcessed = 0;

  // Share a single Redis connection for all workers
  const connection = createRedisConnection();

  console.log('Queue worker started');

  const workers: Worker[] = [];

  try {
    // Helper to track activity
    const onJobStart = () => { lastActivityTime = Date.now(); };
    const onJobEnd = () => { lastActivityTime = Date.now(); jobsProcessed++; };

    // Create workers for each queue
    // Use shared connection, low concurrency, and long stalledInterval to reduce Redis chatter
    const workerOpts = {
      connection: connection as any,
      stalledInterval: 60000, // Check for stalled jobs every 60s instead of default 30s
    };

    const playWorker = new Worker(
      QUEUE_NAMES.PLAY_PROCESSING,
      async (job: Job) => {
        onJobStart();
        console.log(`Processing play job ${job.id}: ${job.data.playId}`);
        await processPlay(job.data);
        onJobEnd();
      },
      { ...workerOpts, concurrency: 2 }
    );
    workers.push(playWorker);

    const playerPlayWorker = new Worker(
      QUEUE_NAMES.PLAYER_PLAY_PROCESSING,
      async (job: Job) => {
        onJobStart();
        console.log(`Processing player play job ${job.id}: ${job.data.playId}`);
        await processPlayerPlay(job.data);
        onJobEnd();
      },
      { ...workerOpts, concurrency: 2 }
    );
    workers.push(playerPlayWorker);

    const protectionWorker = new Worker(
      QUEUE_NAMES.PROTECTION_ANALYSIS,
      async (job: Job) => {
        onJobStart();
        console.log(`Processing protection analysis job ${job.id}`);
        await analyzeProtections(job.data);
        onJobEnd();
      },
      { ...workerOpts, concurrency: 1 }
    );
    workers.push(protectionWorker);

    const formationsWorker = new Worker(
      QUEUE_NAMES.FORMATIONS_ANALYSIS,
      async (job: Job) => {
        onJobStart();
        console.log(`Processing formations analysis job ${job.id}`);
        await analyzeFormations(job.data);
        onJobEnd();
      },
      { ...workerOpts, concurrency: 1 }
    );
    workers.push(formationsWorker);

    const questionsWorker = new Worker(
      QUEUE_NAMES.QUESTION_REGENERATION,
      async (job: Job) => {
        onJobStart();
        console.log(`Processing question regeneration job ${job.id}`);
        await regenerateQuestions(job.data);
        onJobEnd();
      },
      { ...workerOpts, concurrency: 2 }
    );
    workers.push(questionsWorker);

    // Log worker events
    for (const worker of workers) {
      worker.on('completed', (job) => {
        console.log(`Job ${job.id} completed`);
      });
      worker.on('failed', (job, err) => {
        console.error(`Job ${job?.id} failed:`, err.message);
      });
      worker.on('error', (err) => {
        console.error(`Worker error (${worker.name}):`, err.message);
      });
      worker.on('stalled', (jobId) => {
        console.warn(`Job ${jobId} stalled in ${worker.name}`);
      });
    }

    // Wait for all workers to be ready before starting idle check
    await Promise.all(workers.map(w =>
      w.waitUntilReady().catch(err => {
        console.error(`Worker ${w.name} failed to start:`, err.message);
      })
    ));
    console.log(`All ${workers.length} workers ready`);
    lastActivityTime = Date.now(); // Reset so idle timer starts from "ready"

    // Run until idle or timeout
    await new Promise<void>((resolve) => {
      const checkInterval = setInterval(() => {
        const elapsed = Date.now() - startTime;
        const idleTime = Date.now() - lastActivityTime;

        if (elapsed >= WORKER_TIMEOUT_MS) {
          console.log('Approaching timeout, shutting down...');
          clearInterval(checkInterval);
          resolve();
        } else if (idleTime >= IDLE_TIMEOUT_MS) {
          console.log(`Idle for ${Math.round(idleTime / 1000)}s after ${jobsProcessed} jobs, shutting down...`);
          clearInterval(checkInterval);
          resolve();
        }
      }, 5000);
    });

    // Graceful shutdown
    console.log('Shutting down workers...');
    await Promise.all(workers.map(w => w.close()));
    await connection.quit();

    console.log(`Queue worker completed (${jobsProcessed} jobs in ${Math.round((Date.now() - startTime) / 1000)}s)`);

    return {
      statusCode: 200,
      body: JSON.stringify({ success: true, jobsProcessed, runtime: Date.now() - startTime }),
    };
  } catch (error: any) {
    console.error('Queue worker error:', error);
    await Promise.all(workers.map(w => w.close().catch(() => {})));
    await connection.quit().catch(() => {});

    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message }),
    };
  }
};
