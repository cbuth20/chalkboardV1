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
