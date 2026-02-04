/**
 * API client for Player Plays endpoints
 */

export interface CreatePlayerPlayRequest {
  playerPlaybookMetadataId?: string;
  name?: string;
  playType?: 'PASS' | 'RUN' | 'RPO' | 'SCREEN';
  formationName?: string;
  concept?: string;
  triggerProcessing?: boolean;
  unit?: Unit;
  playbookSection?: string;
  primaryClassification?: string;
  situation?: string;
  diagramData?: any; // For legacy PlayBuilder-created plays

  // NEW: Structured Play Builder fields
  sideOfBall?: 'offense' | 'defense';
  structuredPlayType?: string;
  personnel?: string;
  formationId?: string;
  primaryFolder?: string;
  defensiveLook?: string;
  offensiveLook?: string;
  installPhase?: string;
  situationalTags?: string[];
  conceptTags?: string[];
  playerAssignments?: Record<string, any>;
  playerResponsibilities?: Record<string, any>;
  visualData?: any;
  isFinalized?: boolean;
}

export type Unit = 'O' | 'D' | 'ST';

export interface PlayerPlay {
  id: string;
  name: string;
  shortName: string;
  formationName: string;
  concept: string;
  playType: 'PASS' | 'RUN' | 'RPO' | 'SCREEN';
  contentStatus: 'draft' | 'generating' | 'approved' | 'rejected';
  isArchived: boolean;
  aiInsights: string | null;
  createdAt: string;
  updatedAt: string;
  metadata?: any;
  unit?: Unit;
  playbookSection?: string;
  primaryClassification?: string;
  situation?: string;
}

export interface PlayerPlayDetails extends PlayerPlay {
  assignments: any[];
  flashcards: any[];
}

export interface ListPlayerPlaysParams {
  orgId?: string;
  status?: 'draft' | 'generating' | 'approved' | 'rejected';
  playType?: 'PASS' | 'RUN' | 'RPO' | 'SCREEN';
  unit?: Unit;
  playbookSection?: string;
  search?: string;
  limit?: number;
  offset?: number;
}

export interface UpdatePlayerPlayStatusRequest {
  contentStatus?: 'draft' | 'generating' | 'approved' | 'rejected';
  isArchived?: boolean;
}

export interface ProcessPlayerPlayRequest {
  generateInsights?: boolean;
  generateAssignments?: boolean;
  generateKnowledge?: boolean;
}

export interface UpdatePlayerPlayRequest {
  name?: string;
  shortName?: string;
  playType?: 'PASS' | 'RUN' | 'RPO' | 'SCREEN';
  formationName?: string;
  concept?: string;
  unit?: Unit;
  playbookSection?: string;
  primaryClassification?: string;
  situation?: string;
}

class PlayerPlaysAPI {
  private getBaseURL(): string {
    if (typeof window !== 'undefined') {
      const isLocalhost = window.location.hostname === 'localhost' ||
                         window.location.hostname === '127.0.0.1';

      if (isLocalhost) {
        return 'http://localhost:8888/.netlify/functions';
      }
    }

    return '/.netlify/functions';
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const baseURL = this.getBaseURL();
    const response = await fetch(`${baseURL}/${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: response.statusText }));
      throw new Error(error.error || 'API request failed');
    }

    return response.json();
  }

  async createPlay(data: CreatePlayerPlayRequest, token: string, orgId: string): Promise<{ success: boolean; playId: string; status: string; message: string }> {
    return this.request(`player-plays-create?orgId=${orgId}`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify(data),
    });
  }

  async listPlays(params: ListPlayerPlaysParams, token: string): Promise<{ plays: PlayerPlay[]; total: number; limit: number; offset: number }> {
    const queryParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        queryParams.append(key, value.toString());
      }
    });

    return this.request(`player-plays-list?${queryParams.toString()}`, {
      method: 'GET',
      headers: { Authorization: `Bearer ${token}` },
    });
  }

  async getPlay(
    playId: string,
    token: string,
    options?: { orgId?: string; includeAssignments?: boolean; includeFlashcards?: boolean; position?: string }
  ): Promise<{ play: PlayerPlay; assignments?: any[]; flashcards?: any[] }> {
    const queryParams = new URLSearchParams();

    if (options?.orgId) {
      queryParams.append('orgId', options.orgId);
    }
    if (options?.includeAssignments !== undefined) {
      queryParams.append('includeAssignments', options.includeAssignments.toString());
    }
    if (options?.includeFlashcards !== undefined) {
      queryParams.append('includeFlashcards', options.includeFlashcards.toString());
    }
    if (options?.position) {
      queryParams.append('position', options.position);
    }

    const query = queryParams.toString();
    const endpoint = query ? `player-plays-get/${playId}?${query}` : `player-plays-get/${playId}`;

    return this.request(endpoint, {
      method: 'GET',
      headers: { Authorization: `Bearer ${token}` },
    });
  }

  async updatePlayStatus(
    playId: string,
    data: UpdatePlayerPlayStatusRequest,
    token: string,
    orgId: string
  ): Promise<{ success: boolean; play: { id: string; contentStatus: string; isArchived: boolean } }> {
    return this.request(`player-plays-update-status/${playId}?orgId=${orgId}`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify(data),
    });
  }

  async updatePlay(
    playId: string,
    data: UpdatePlayerPlayRequest,
    token: string,
    orgId: string
  ): Promise<{ success: boolean; play: PlayerPlay }> {
    return this.request(`player-plays-update/${playId}?orgId=${orgId}`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify(data),
    });
  }

  async processPlay(
    playId: string,
    data: ProcessPlayerPlayRequest,
    token: string,
    orgId: string
  ): Promise<{ success: boolean; playId: string; status: string; message: string }> {
    return this.request(`player-plays-process/${playId}?orgId=${orgId}`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify(data),
    });
  }

  async batchProcessPlays(
    playIds: string[],
    data: ProcessPlayerPlayRequest,
    token: string,
    orgId: string
  ): Promise<{ success: boolean; message: string; playIds: string[]; processingCount: number }> {
    return this.request(`player-plays-batch-process?orgId=${orgId}`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify({
        playIds,
        generateInsights: data.generateInsights,
        generateAssignments: data.generateAssignments,
        generateKnowledge: data.generateKnowledge,
      }),
    });
  }

  async deletePlay(
    playId: string,
    token: string,
    orgId: string
  ): Promise<{ success: boolean; message: string; playId: string }> {
    return this.request(`player-plays-delete/${playId}?orgId=${orgId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    });
  }

  // NEW: Structured Play Builder methods

  async validatePlay(
    playId: string,
    token: string
  ): Promise<{
    success: boolean;
    isValid: boolean;
    warnings: Array<{ type: 'error' | 'warning'; message: string; playerId?: string }>;
    playerCount: number;
    playersWithAssignments: number;
    playersWithResponsibilities: number;
  }> {
    return this.request(`player-plays-validate`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify({ playId }),
    });
  }

  async finalizePlay(
    playId: string,
    token: string,
    triggerProcessing?: boolean
  ): Promise<{ success: boolean; message: string; playId: string }> {
    return this.request(`player-plays-finalize`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify({ playId, triggerProcessing }),
    });
  }
}

export const playerPlaysAPI = new PlayerPlaysAPI();
