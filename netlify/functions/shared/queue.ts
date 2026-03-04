/**
 * BullMQ Queue Configuration
 * Central queue setup for all background job processing
 */

import { Queue, Job } from 'bullmq';
import Redis from 'ioredis';

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
export function createRedisConnection(): Redis {
  return new Redis(REDIS_URL!, {
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
 * Shared Redis connection for enqueue operations within a single function invocation.
 * Avoids creating/closing a connection per enqueue call.
 */
let sharedQueueConnection: Redis | null = null;

function getSharedConnection(): Redis {
  if (!sharedQueueConnection || sharedQueueConnection.status === 'end') {
    sharedQueueConnection = createRedisConnection();
  }
  return sharedQueueConnection;
}

export function getQueue(queueName: string): Queue {
  return new Queue(queueName, {
    connection: getSharedConnection() as any,
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

  const job = await queue.add(jobName, data, {
    priority: options?.priority ?? JOB_PRIORITY.DEFAULT,
    delay: options?.delay,
    jobId: options?.jobId,
  });

  console.log(`Job enqueued: ${queueName}/${jobName} (ID: ${job.id})`);
  return job.id!;
}
