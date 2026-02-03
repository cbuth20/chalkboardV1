/**
 * API client for Concept Tags endpoints
 */

export interface ConceptTag {
  id: string;
  name: string;
  description?: string;
  sideOfBall: 'offense' | 'defense' | 'both';
  orgId: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateConceptTagRequest {
  name: string;
  description?: string;
  sideOfBall: 'offense' | 'defense' | 'both';
}

export interface UpdateConceptTagRequest {
  id: string;
  name?: string;
  description?: string;
  sideOfBall?: 'offense' | 'defense' | 'both';
}

class ConceptTagsAPI {
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
    filters?: { sideOfBall?: string }
  ): Promise<{ success: boolean; tags: ConceptTag[] }> {
    const params = new URLSearchParams();
    if (filters?.sideOfBall) params.append('sideOfBall', filters.sideOfBall);

    const query = params.toString();
    const endpoint = query ? `concept-tags?${query}` : 'concept-tags';

    return this.request(endpoint, {
      method: 'GET',
      headers: { Authorization: `Bearer ${token}` },
    });
  }

  async create(
    data: CreateConceptTagRequest,
    token: string
  ): Promise<{ success: boolean; tag: ConceptTag }> {
    return this.request('concept-tags', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify(data),
    });
  }

  async update(
    data: UpdateConceptTagRequest,
    token: string
  ): Promise<{ success: boolean; tag: ConceptTag }> {
    return this.request('concept-tags', {
      method: 'PUT',
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify(data),
    });
  }

  async delete(
    id: string,
    token: string
  ): Promise<{ success: boolean; message: string }> {
    return this.request('concept-tags', {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify({ id }),
    });
  }
}

export const conceptTagsAPI = new ConceptTagsAPI();
