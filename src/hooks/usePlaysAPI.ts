/**
 * Custom hooks for Plays API
 */

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import {
  playsAPI,
  Play,
  CreatePlayRequest,
  ListPlaysParams,
  UpdatePlayStatusRequest,
  ProcessPlayRequest,
} from '@/lib/api/plays';

export function usePlays(params?: Omit<ListPlaysParams, 'orgId'>) {
  const { session, orgId } = useAuth();
  const [plays, setPlays] = useState<Play[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [total, setTotal] = useState(0);

  // Stringify params to create a stable dependency
  const paramsKey = JSON.stringify(params || {});

  const fetchPlays = useCallback(async () => {
    if (!session?.access_token || !orgId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const result = await playsAPI.listPlays(
        { orgId, ...params },
        session.access_token
      );
      setPlays(result.plays);
      setTotal(result.total);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch plays');
      console.error('Error fetching plays:', err);
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.access_token, orgId, paramsKey]);

  useEffect(() => {
    fetchPlays();
  }, [fetchPlays]);

  return { plays, loading, error, total, refetch: fetchPlays };
}

export function usePlay(playId: string | null, options?: { includeAssignments?: boolean; includeFlashcards?: boolean; position?: string }) {
  const { session, orgId } = useAuth();
  const [play, setPlay] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Stringify options to create a stable dependency
  const optionsKey = JSON.stringify(options || {});

  const fetchPlay = useCallback(async () => {
    if (!session?.access_token || !playId || !orgId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const result = await playsAPI.getPlay(playId, session.access_token, { ...options, orgId });
      setPlay(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch play');
      console.error('Error fetching play:', err);
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.access_token, playId, orgId, optionsKey]);

  useEffect(() => {
    fetchPlay();
  }, [fetchPlay]);

  return { play, loading, error, refetch: fetchPlay };
}

export function useCreatePlay() {
  const { session, orgId, teamId } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createPlay = useCallback(
    async (data: Omit<CreatePlayRequest, 'orgId' | 'teamId'>) => {
      if (!session?.access_token || !orgId) {
        throw new Error('Not authenticated');
      }

      try {
        setLoading(true);
        setError(null);
        const result = await playsAPI.createPlay(
          {
            ...data,
            orgId,
            teamId: data.teamId || teamId || undefined,
          },
          session.access_token
        );
        return result;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to create play';
        setError(message);
        throw new Error(message);
      } finally {
        setLoading(false);
      }
    },
    [session, orgId, teamId]
  );

  return { createPlay, loading, error };
}

export function useUpdatePlayStatus() {
  const { session, orgId } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const updateStatus = useCallback(
    async (playId: string, data: UpdatePlayStatusRequest) => {
      if (!session?.access_token || !orgId) {
        throw new Error('Not authenticated');
      }

      try {
        setLoading(true);
        setError(null);
        const result = await playsAPI.updatePlayStatus(playId, data, session.access_token, orgId);
        return result;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to update play';
        setError(message);
        throw new Error(message);
      } finally {
        setLoading(false);
      }
    },
    [session, orgId]
  );

  return { updateStatus, loading, error };
}

export function useProcessPlay() {
  const { session } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const processPlay = useCallback(
    async (playId: string, data: ProcessPlayRequest = {}) => {
      if (!session?.access_token) {
        throw new Error('Not authenticated');
      }

      try {
        setLoading(true);
        setError(null);
        const result = await playsAPI.processPlay(playId, data, session.access_token);
        return result;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to process play';
        setError(message);
        throw new Error(message);
      } finally {
        setLoading(false);
      }
    },
    [session]
  );

  return { processPlay, loading, error };
}
