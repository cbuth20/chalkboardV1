/**
 * API client for Formations endpoints
 */

export interface FormationPlayerPosition {
  position: string;
  x: number;
  y: number;
  label: string;
  group: 'quarterback' | 'backs' | 'line' | 'receivers' | 'linebackers' | 'secondary';
}

export interface Formation {
  id: string;
  name: string;
  sideOfBall: 'offense' | 'defense';
  personnel?: string;
  isSystemDefined: boolean;
  orgId?: string;
  playerPositions: FormationPlayerPosition[];
  description?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateFormationRequest {
  name: string;
  sideOfBall: 'offense' | 'defense';
  personnel?: string;
  playerPositions: FormationPlayerPosition[];
  description?: string;
}

export interface UpdateFormationRequest {
  id: string;
  name?: string;
  personnel?: string;
  playerPositions?: FormationPlayerPosition[];
  description?: string;
}

class FormationsAPI {
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

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const baseURL = this.getBaseURL();
    const response = await fetch(`${baseURL}/${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Request failed');
    }

    return response.json();
  }

  async list(
    token: string,
    filters?: { sideOfBall?: string; personnel?: string }
  ): Promise<{ success: boolean; formations: Formation[] }> {
    const params = new URLSearchParams();
    if (filters?.sideOfBall) params.append('sideOfBall', filters.sideOfBall);
    if (filters?.personnel) params.append('personnel', filters.personnel);

    const query = params.toString();
    const endpoint = query ? `formations?${query}` : 'formations';

    return this.request(endpoint, {
      method: 'GET',
      headers: { Authorization: `Bearer ${token}` },
    });
  }

  async create(
    data: CreateFormationRequest,
    token: string
  ): Promise<{ success: boolean; formation: Formation }> {
    return this.request('formations', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify(data),
    });
  }

  async update(
    data: UpdateFormationRequest,
    token: string
  ): Promise<{ success: boolean; formation: Formation }> {
    return this.request('formations', {
      method: 'PUT',
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify(data),
    });
  }

  async delete(
    id: string,
    token: string
  ): Promise<{ success: boolean; message: string }> {
    return this.request('formations', {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify({ id }),
    });
  }
}

export const formationsAPI = new FormationsAPI();
