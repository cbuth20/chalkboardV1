/**
 * API client for Situational Tags endpoints
 */

export interface SituationalTag {
  id: string;
  name: string;
  category: 'down' | 'field_position' | 'game_situation' | 'custom';
  sideOfBall: 'offense' | 'defense' | 'both';
  isSystemDefined: boolean;
  orgId?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateSituationalTagRequest {
  name: string;
  category: 'down' | 'field_position' | 'game_situation' | 'custom';
  sideOfBall: 'offense' | 'defense' | 'both';
}

export interface UpdateSituationalTagRequest {
  id: string;
  name?: string;
  category?: 'down' | 'field_position' | 'game_situation' | 'custom';
  sideOfBall?: 'offense' | 'defense' | 'both';
}

class SituationalTagsAPI {
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
    filters?: { sideOfBall?: string; category?: string }
  ): Promise<{ success: boolean; tags: SituationalTag[] }> {
    const params = new URLSearchParams();
    if (filters?.sideOfBall) params.append('sideOfBall', filters.sideOfBall);
    if (filters?.category) params.append('category', filters.category);

    const query = params.toString();
    const endpoint = query ? `situational-tags?${query}` : 'situational-tags';

    return this.request(endpoint, {
      method: 'GET',
      headers: { Authorization: `Bearer ${token}` },
    });
  }

  async create(
    data: CreateSituationalTagRequest,
    token: string
  ): Promise<{ success: boolean; tag: SituationalTag }> {
    return this.request('situational-tags', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify(data),
    });
  }

  async update(
    data: UpdateSituationalTagRequest,
    token: string
  ): Promise<{ success: boolean; tag: SituationalTag }> {
    return this.request('situational-tags', {
      method: 'PUT',
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify(data),
    });
  }

  async delete(
    id: string,
    token: string
  ): Promise<{ success: boolean; message: string }> {
    return this.request('situational-tags', {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify({ id }),
    });
  }
}

export const situationalTagsAPI = new SituationalTagsAPI();
