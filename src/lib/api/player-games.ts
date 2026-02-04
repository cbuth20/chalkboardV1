/**
 * API client for Player Games endpoints
 */

export interface CreateGameRequest {
  name: string;
  description?: string;
  category: 'coverage_blitz' | 'routes_concepts' | 'situational' | 'assignments';
  filters: GameFilters;
  questionCount?: number;
  timeLimitSeconds?: number;
  passingScore?: number;
  selectionStrategy?: 'random' | 'difficulty_progression' | 'spaced_repetition';
}

export interface GameFilters {
  positions?: string[];
  topics?: string[];
  difficulty?: string[];
  playIds?: string[];
  tags?: string[];
}

export interface PlayerGame {
  id: string;
  userId: string;
  orgId: string;
  name: string;
  description: string | null;
  category: string;
  filters: GameFilters;
  questionCount: number;
  timeLimitSeconds: number | null;
  passingScore: number;
  selectionStrategy: string;
  isActive: boolean;
  totalAttempts: number;
  bestScore: number | null;
  lastPlayedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface StartGameRequest {
  gameId?: string;
  adHocFilters?: GameFilters;
  questionCount?: number;
  timeLimitSeconds?: number;
}

export interface GameQuestion {
  id: string;
  position: string;
  questionType: string;
  topic: string;
  questionPrompt: string;
  options: string[] | null;
  scenarioContext: string | null;
  difficulty: string;
  hints: any;
  playName: string;
}

export interface StartGameResponse {
  success: boolean;
  attemptId: string;
  questions: GameQuestion[];
  questionCount: number;
  timeLimitSeconds: number | null;
}

export interface SubmitAnswersRequest {
  attemptId: string;
  responses: Array<{
    questionId: string;
    answer: string;
    timeSpent: number;
  }>;
}

export interface ScoredResponse {
  questionId: string;
  answer: string;
  correct: boolean;
  correctAnswer: string;
  explanation: string;
  questionPrompt: string;
  position: string;
  topic: string;
  difficulty: string;
  timeSpent: number;
}

export interface SubmitAnswersResponse {
  success: boolean;
  score: number;
  correct: number;
  total: number;
  breakdown: ScoredResponse[];
}

export interface QuestionAvailability {
  success: boolean;
  total: number;
  byDifficulty: Record<string, number>;
  byTopic: Record<string, number>;
  byPosition: Record<string, number>;
  plays: Array<{
    playId: string;
    playName: string;
    questionCount: number;
  }>;
  filters: {
    position?: string;
    category?: string;
    topic?: string;
    difficulty?: string;
  };
}

class PlayerGamesAPI {
  private getBaseURL(): string {
    if (typeof window !== 'undefined') {
      const isLocalhost = window.location.hostname === 'localhost' ||
                         window.location.hostname === '127.0.0.1';
      return isLocalhost ? 'http://localhost:8888/.netlify/functions' : '/.netlify/functions';
    }
    return '/.netlify/functions';
  }

  private async getAuthToken(): Promise<string | null> {
    if (typeof window === 'undefined') return null;

    // Use the shared Supabase client
    const { supabase } = await import('@/lib/supabase/client');

    // Retry up to 3 times with delays to handle race conditions
    for (let i = 0; i < 3; i++) {
      const { data: { session } } = await supabase.auth.getSession();

      if (session?.access_token) {
        return session.access_token;
      }

      // Wait before retrying (50ms, 100ms, 200ms)
      if (i < 2) {
        await new Promise(resolve => setTimeout(resolve, 50 * Math.pow(2, i)));
      }
    }

    return null;
  }

  private async fetchWithAuth(endpoint: string, options: RequestInit = {}) {
    const token = await this.getAuthToken();

    if (!token) {
      console.error('[PlayerGamesAPI] Failed to get auth token after retries');
      throw new Error('Unable to authenticate. Please try refreshing the page or signing in again.');
    }

    const headers = new Headers(options.headers);
    headers.set('Authorization', `Bearer ${token}`);
    headers.set('Content-Type', 'application/json');

    const response = await fetch(`${this.getBaseURL()}/${endpoint}`, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Unknown error' }));
      throw new Error(error.error || `HTTP ${response.status}`);
    }

    return response.json();
  }

  /**
   * Create a new custom game
   */
  async createGame(request: CreateGameRequest, orgId: string): Promise<{ success: boolean; gameId: string; game: PlayerGame }> {
    return this.fetchWithAuth(`player-games-create?orgId=${orgId}`, {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  /**
   * List player's games
   */
  async listGames(
    orgId: string,
    params?: {
      category?: string;
      isActive?: boolean;
    }
  ): Promise<{ success: boolean; games: PlayerGame[]; count: number }> {
    const queryParams = new URLSearchParams();
    queryParams.set('orgId', orgId);
    if (params?.category) queryParams.set('category', params.category);
    if (params?.isActive !== undefined) queryParams.set('isActive', String(params.isActive));

    return this.fetchWithAuth(`player-games-list?${queryParams.toString()}`);
  }

  /**
   * Start a game session (saved or ad-hoc)
   */
  async startGame(request: StartGameRequest, orgId: string): Promise<StartGameResponse> {
    return this.fetchWithAuth(`player-games-start?orgId=${orgId}`, {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  /**
   * Submit game answers and get score
   */
  async submitAnswers(request: SubmitAnswersRequest, orgId: string): Promise<SubmitAnswersResponse> {
    return this.fetchWithAuth(`player-games-submit?orgId=${orgId}`, {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  /**
   * Get available question counts with filters
   */
  async getAvailableQuestions(
    orgId: string,
    params?: {
      position?: string;
      category?: string;
      topic?: string;
      difficulty?: string;
    }
  ): Promise<QuestionAvailability> {
    const queryParams = new URLSearchParams();
    queryParams.set('orgId', orgId);
    if (params?.position) queryParams.set('position', params.position);
    if (params?.category) queryParams.set('category', params.category);
    if (params?.topic) queryParams.set('topic', params.topic);
    if (params?.difficulty) queryParams.set('difficulty', params.difficulty);

    return this.fetchWithAuth(`player-questions-available?${queryParams.toString()}`);
  }

  /**
   * Update a game
   */
  async updateGame(gameId: string, updates: Partial<CreateGameRequest>, orgId: string): Promise<{ success: boolean }> {
    return this.fetchWithAuth(`player-games-update/${gameId}?orgId=${orgId}`, {
      method: 'PATCH',
      body: JSON.stringify(updates),
    });
  }

  /**
   * Delete a game
   */
  async deleteGame(gameId: string, orgId: string): Promise<{ success: boolean }> {
    return this.fetchWithAuth(`player-games-delete/${gameId}?orgId=${orgId}`, {
      method: 'DELETE',
    });
  }
}

// Export singleton instance
export const playerGamesAPI = new PlayerGamesAPI();
