/**
 * Custom hooks for Flashcards API
 */

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { flashcardsAPI, Flashcard, ListFlashcardsParams } from '@/lib/api/flashcards';

export function useFlashcards(params?: Omit<ListFlashcardsParams, 'orgId'>) {
  const { session, orgId } = useAuth();
  const [flashcards, setFlashcards] = useState<Flashcard[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [total, setTotal] = useState(0);

  const fetchFlashcards = useCallback(async () => {
    if (!session?.access_token || !orgId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const result = await flashcardsAPI.listFlashcards(
        { orgId, ...params },
        session.access_token
      );
      setFlashcards(result.flashcards);
      setTotal(result.total);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch flashcards');
      console.error('Error fetching flashcards:', err);
    } finally {
      setLoading(false);
    }
  }, [session, orgId, params]);

  useEffect(() => {
    fetchFlashcards();
  }, [fetchFlashcards]);

  return { flashcards, loading, error, total, refetch: fetchFlashcards };
}

export function useRegenerateFlashcards() {
  const { session } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const regenerate = useCallback(
    async (playId: string) => {
      if (!session?.access_token) {
        throw new Error('Not authenticated');
      }

      try {
        setLoading(true);
        setError(null);
        const result = await flashcardsAPI.regenerateFlashcards(
          playId,
          session.access_token
        );
        return result;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to regenerate flashcards';
        setError(message);
        throw new Error(message);
      } finally {
        setLoading(false);
      }
    },
    [session]
  );

  return { regenerate, loading, error };
}
