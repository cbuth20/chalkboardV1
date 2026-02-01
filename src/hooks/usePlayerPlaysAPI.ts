/**
 * Custom hooks for Player Plays API
 */

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import {
  playerPlaysAPI,
  PlayerPlay,
  CreatePlayerPlayRequest,
  ListPlayerPlaysParams,
  UpdatePlayerPlayStatusRequest,
  ProcessPlayerPlayRequest,
  UpdatePlayerPlayRequest,
} from '@/lib/api/player-plays';

export function usePlayerPlays(params?: ListPlayerPlaysParams) {
  const { session, orgId } = useAuth();
  const [plays, setPlays] = useState<PlayerPlay[]>([]);
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
      const result = await playerPlaysAPI.listPlays(
        { orgId, ...params },
        session.access_token
      );
      setPlays(result.plays);
      setTotal(result.total);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch player plays');
      console.error('Error fetching player plays:', err);
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

export function usePlayerPlay(
  playId: string | null,
  options?: { includeAssignments?: boolean; includeFlashcards?: boolean; position?: string }
) {
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
      const result = await playerPlaysAPI.getPlay(playId, session.access_token, { ...options, orgId });
      setPlay(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch player play');
      console.error('Error fetching player play:', err);
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

export function useCreatePlayerPlay() {
  const { session, orgId } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createPlay = useCallback(
    async (data: CreatePlayerPlayRequest) => {
      if (!session?.access_token || !orgId) {
        throw new Error('Not authenticated');
      }

      try {
        setLoading(true);
        setError(null);
        const result = await playerPlaysAPI.createPlay(data, session.access_token, orgId);
        return result;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to create player play';
        setError(message);
        throw new Error(message);
      } finally {
        setLoading(false);
      }
    },
    [session, orgId]
  );

  return { createPlay, loading, error };
}

export function useUpdatePlayerPlayStatus() {
  const { session, orgId } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const updateStatus = useCallback(
    async (playId: string, data: UpdatePlayerPlayStatusRequest) => {
      if (!session?.access_token || !orgId) {
        throw new Error('Not authenticated');
      }

      try {
        setLoading(true);
        setError(null);
        const result = await playerPlaysAPI.updatePlayStatus(playId, data, session.access_token, orgId);
        return result;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to update player play status';
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

export function useUpdatePlayerPlay() {
  const { session, orgId } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const updatePlay = useCallback(
    async (playId: string, data: UpdatePlayerPlayRequest) => {
      if (!session?.access_token || !orgId) {
        throw new Error('Not authenticated');
      }

      try {
        setLoading(true);
        setError(null);
        const result = await playerPlaysAPI.updatePlay(playId, data, session.access_token, orgId);
        return result;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to update player play';
        setError(message);
        throw new Error(message);
      } finally {
        setLoading(false);
      }
    },
    [session, orgId]
  );

  return { updatePlay, loading, error };
}

export function useProcessPlayerPlay() {
  const { session, orgId } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const processPlay = useCallback(
    async (playId: string, data: ProcessPlayerPlayRequest = {}) => {
      if (!session?.access_token || !orgId) {
        throw new Error('Not authenticated');
      }

      try {
        setLoading(true);
        setError(null);
        const result = await playerPlaysAPI.processPlay(playId, data, session.access_token, orgId);
        return result;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to process player play';
        setError(message);
        throw new Error(message);
      } finally {
        setLoading(false);
      }
    },
    [session, orgId]
  );

  return { processPlay, loading, error };
}

export function useDeletePlayerPlay() {
  const { session, orgId } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const deletePlay = useCallback(
    async (playId: string) => {
      if (!session?.access_token || !orgId) {
        throw new Error('Not authenticated');
      }

      try {
        setLoading(true);
        setError(null);
        const result = await playerPlaysAPI.deletePlay(playId, session.access_token, orgId);
        return result;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to delete player play';
        setError(message);
        throw new Error(message);
      } finally {
        setLoading(false);
      }
    },
    [session, orgId]
  );

  return { deletePlay, loading, error };
}
