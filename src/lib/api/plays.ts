/**
 * API client for Plays endpoints
 */

export interface CreatePlayRequest {
  orgId: string;
  teamId?: string;
  playbookMetadataId: string;
  name?: string;
  playType?: 'PASS' | 'RUN' | 'RPO' | 'SCREEN';
  formationName?: string;
  concept?: string;
  triggerProcessing?: boolean;
  // v1 Classification fields
  unit?: Unit;
  playbookSection?: string;
  primaryClassification?: string;
  situation?: string;
}

export type Unit = 'O' | 'D' | 'ST';

export interface Play {
  id: string;
  name: string;
  shortName: string;
  formationName: string;
  concept: string;
  playType: 'PASS' | 'RUN' | 'RPO' | 'SCREEN';
  contentStatus: 'draft' | 'generating' | 'approved' | 'rejected';
  isPublished: boolean;
  aiInsights: string | null;
  createdAt: string;
  updatedAt: string;
  metadata?: any;
  // v1 Classification fields
  unit?: Unit;
  playbookSection?: string;
  primaryClassification?: string;
  situation?: string;
}

export interface PlayDetails extends Play {
  assignments: any[];
  flashcards: any[];
}

export interface ListPlaysParams {
  orgId: string;
  teamId?: string;
  status?: 'draft' | 'generating' | 'approved' | 'rejected';
  playType?: 'PASS' | 'RUN' | 'RPO' | 'SCREEN';
  limit?: number;
  offset?: number;
}

export interface UpdatePlayStatusRequest {
  contentStatus?: 'draft' | 'generating' | 'approved' | 'rejected';
  isPublished?: boolean;
}

export interface ProcessPlayRequest {
  generateInsights?: boolean;
  generateAssignments?: boolean;
  generateKnowledge?: boolean;
}

class PlaysAPI {
  private getBaseURL(): string {
    // Check if we're running on localhost
    if (typeof window !== 'undefined') {
      const isLocalhost = window.location.hostname === 'localhost' ||
                         window.location.hostname === '127.0.0.1';

      if (isLocalhost) {
        // Use Netlify CLI dev server if available, otherwise direct functions
        return 'http://localhost:8888/.netlify/functions';
      }
    }

    // Use Netlify functions for production
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

  async createPlay(data: CreatePlayRequest, token: string): Promise<{ success: boolean; playId: string; status: string; message: string }> {
    return this.request('plays-create', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify(data),
    });
  }

  async listPlays(params: ListPlaysParams, token: string): Promise<{ plays: Play[]; total: number; limit: number; offset: number }> {
    const queryParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        queryParams.append(key, value.toString());
      }
    });

    return this.request(`plays-list?${queryParams.toString()}`, {
      method: 'GET',
      headers: { Authorization: `Bearer ${token}` },
    });
  }

  async getPlay(
    playId: string,
    token: string,
    options?: { orgId?: string; includeAssignments?: boolean; includeFlashcards?: boolean; position?: string }
  ): Promise<{ play: Play; assignments?: any[]; flashcards?: any[] }> {
    const queryParams = new URLSearchParams();

    // Add orgId if provided (required by auth middleware)
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
    return this.request(`plays-get/${playId}${query ? `?${query}` : ''}`, {
      method: 'GET',
      headers: { Authorization: `Bearer ${token}` },
    });
  }

  async updatePlayStatus(
    playId: string,
    data: UpdatePlayStatusRequest,
    token: string,
    orgId: string
  ): Promise<{ success: boolean; play: { id: string; contentStatus: string; isPublished: boolean } }> {
    return this.request(`plays-update-status/${playId}?orgId=${orgId}`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify(data),
    });
  }

  async processPlay(
    playId: string,
    data: ProcessPlayRequest,
    token: string
  ): Promise<{ success: boolean; playId: string; status: string; message: string }> {
    return this.request(`plays-process/${playId}`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify(data),
    });
  }
}

export const playsAPI = new PlaysAPI();
