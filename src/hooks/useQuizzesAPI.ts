/**
 * Custom hooks for Quizzes API
 */

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import {
  quizzesAPI,
  QuizAssignment,
  CreateQuizAssignmentRequest,
  SubmitAttemptRequest,
} from '@/lib/api/quizzes';

export function useQuizAssignments(params?: { assignedToMe?: boolean; status?: string }) {
  const { session, orgId } = useAuth();
  const [assignments, setAssignments] = useState<QuizAssignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [total, setTotal] = useState(0);

  const fetchAssignments = useCallback(async () => {
    if (!session?.access_token || !orgId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const result = await quizzesAPI.listAssignments(
        { orgId, ...params },
        session.access_token
      );
      setAssignments(result.assignments);
      setTotal(result.total);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch assignments');
      console.error('Error fetching assignments:', err);
    } finally {
      setLoading(false);
    }
  }, [session, orgId, params]);

  useEffect(() => {
    fetchAssignments();
  }, [fetchAssignments]);

  return { assignments, loading, error, total, refetch: fetchAssignments };
}

export function useQuizAssignment(assignmentId: string | null) {
  const { session } = useAuth();
  const [assignment, setAssignment] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAssignment = useCallback(async () => {
    if (!session?.access_token || !assignmentId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const result = await quizzesAPI.getAssignment(assignmentId, session.access_token);
      setAssignment(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch assignment');
      console.error('Error fetching assignment:', err);
    } finally {
      setLoading(false);
    }
  }, [session, assignmentId]);

  useEffect(() => {
    fetchAssignment();
  }, [fetchAssignment]);

  return { assignment, loading, error, refetch: fetchAssignment };
}

export function useCreateQuizAssignment() {
  const { session, orgId, teamId } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createAssignment = useCallback(
    async (data: Omit<CreateQuizAssignmentRequest, 'orgId' | 'teamId'>) => {
      if (!session?.access_token || !orgId) {
        throw new Error('Not authenticated');
      }

      try {
        setLoading(true);
        setError(null);
        const result = await quizzesAPI.createAssignment(
          {
            ...data,
            orgId,
            teamId: teamId || undefined,
          },
          session.access_token
        );
        return result;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to create assignment';
        setError(message);
        throw new Error(message);
      } finally {
        setLoading(false);
      }
    },
    [session, orgId, teamId]
  );

  return { createAssignment, loading, error };
}

export function useStartQuizAttempt() {
  const { session } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const startAttempt = useCallback(
    async (quizAssignmentId: string) => {
      if (!session?.access_token) {
        throw new Error('Not authenticated');
      }

      try {
        setLoading(true);
        setError(null);
        const result = await quizzesAPI.startAttempt(quizAssignmentId, session.access_token);
        return result;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to start attempt';
        setError(message);
        throw new Error(message);
      } finally {
        setLoading(false);
      }
    },
    [session]
  );

  return { startAttempt, loading, error };
}

export function useSubmitQuizAttempt() {
  const { session } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submitAttempt = useCallback(
    async (attemptId: string, data: SubmitAttemptRequest) => {
      if (!session?.access_token) {
        throw new Error('Not authenticated');
      }

      try {
        setLoading(true);
        setError(null);
        const result = await quizzesAPI.submitAttempt(attemptId, data, session.access_token);
        return result;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to submit attempt';
        setError(message);
        throw new Error(message);
      } finally {
        setLoading(false);
      }
    },
    [session]
  );

  return { submitAttempt, loading, error };
}
