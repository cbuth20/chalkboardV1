"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { OnboardingState, UserRole } from '@/lib/supabase/types/database';

interface OnboardingStatus {
  onboardingState: OnboardingState;
  nextStep: string;
  profile?: {
    id: string;
    firstName: string;
    lastName: string;
    role: UserRole;
  };
  membership?: {
    orgId: string;
    orgName: string;
    teamId?: string;
    teamName?: string;
    role: UserRole;
    positionCode?: string;
    jerseyNumber?: number;
    segmentId?: string;
  };
}

interface Team {
  id: string;
  name: string;
  season?: string;
}

interface OnboardingContextType {
  status: OnboardingStatus | null;
  loading: boolean;
  error: string | null;
  refreshStatus: () => Promise<void>;
  updateProfile: (data: {
    firstName: string;
    lastName: string;
    role: UserRole;
    avatarUrl?: string;
  }) => Promise<void>;
  createOrganization: (data: { name: string }) => Promise<void>;
  createTeam: (data: {
    name: string;
    season?: string;
    segments?: { code: string; name: string }[];
  }) => Promise<void>;
  joinWithInvite: (inviteCode: string) => Promise<void>;
  getAvailableTeams: () => Promise<Team[]>;
  selectTeam: (teamId: string) => Promise<void>;
  setPosition: (data: {
    positionCode: string;
    jerseyNumber: number;
    segmentId?: string;
  }) => Promise<void>;
  resetOnboarding: () => Promise<void>;
}

const OnboardingContext = createContext<OnboardingContextType | undefined>(undefined);

export function OnboardingProvider({ children }: { children: React.ReactNode }) {
  const { user, session } = useAuth();
  const [status, setStatus] = useState<OnboardingStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refreshStatus = async () => {
    if (!user || !session) {
      console.log('[Onboarding] No user or session, skipping status fetch');
      setStatus(null);
      setLoading(false);
      return;
    }

    try {
      setError(null);
      console.log('[Onboarding] Fetching status...');
      const response = await fetch('/api/onboarding/status', {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('[Onboarding] API error:', response.status, errorText);
        throw new Error('Failed to fetch onboarding status');
      }

      const data = await response.json();

      if (data.success) {
        console.log('[Onboarding] Status fetched:', data.data.onboardingState);
        setStatus(data.data);
      } else {
        throw new Error(data.error || 'Failed to fetch status');
      }
    } catch (err: any) {
      console.error('[Onboarding] Error fetching status:', err);
      setError(err.message || 'Failed to load onboarding status');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshStatus();
  }, [user]);

  const updateProfile = async (data: {
    firstName: string;
    lastName: string;
    role: UserRole;
    avatarUrl?: string;
  }) => {
    if (!session) throw new Error('No active session');

    try {
      setError(null);
      const response = await fetch('/api/onboarding/profile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify(data)
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Failed to update profile');
      }

      await refreshStatus();
    } catch (err: any) {
      console.error('[Onboarding] Error updating profile:', err);
      setError(err.message);
      throw err;
    }
  };

  const createOrganization = async (data: { name: string }) => {
    if (!session) throw new Error('No active session');

    try {
      setError(null);
      const response = await fetch('/api/onboarding/organization', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify(data)
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Failed to create organization');
      }

      await refreshStatus();
    } catch (err: any) {
      console.error('[Onboarding] Error creating organization:', err);
      setError(err.message);
      throw err;
    }
  };

  const createTeam = async (data: {
    name: string;
    season?: string;
    segments?: { code: string; name: string }[];
  }) => {
    if (!session) throw new Error('No active session');

    try {
      setError(null);
      const response = await fetch('/api/onboarding/team', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify(data)
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Failed to create team');
      }

      await refreshStatus();
    } catch (err: any) {
      console.error('[Onboarding] Error creating team:', err);
      setError(err.message);
      throw err;
    }
  };

  const joinWithInvite = async (inviteCode: string) => {
    if (!session) throw new Error('No active session');

    try {
      setError(null);
      const response = await fetch('/api/onboarding/join', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({ inviteCode })
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Failed to join organization');
      }

      await refreshStatus();
    } catch (err: any) {
      console.error('[Onboarding] Error joining organization:', err);
      setError(err.message);
      throw err;
    }
  };

  const getAvailableTeams = async (): Promise<Team[]> => {
    if (!session) throw new Error('No active session');

    try {
      const response = await fetch('/api/onboarding/teams', {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Failed to fetch teams');
      }

      return result.data.teams;
    } catch (err: any) {
      console.error('[Onboarding] Error fetching teams:', err);
      setError(err.message);
      throw err;
    }
  };

  const selectTeam = async (teamId: string) => {
    if (!session) throw new Error('No active session');

    try {
      setError(null);
      const response = await fetch('/api/onboarding/teams', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({ teamId })
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Failed to select team');
      }

      await refreshStatus();
    } catch (err: any) {
      console.error('[Onboarding] Error selecting team:', err);
      setError(err.message);
      throw err;
    }
  };

  const setPosition = async (data: {
    positionCode: string;
    jerseyNumber: number;
    segmentId?: string;
  }) => {
    if (!session) throw new Error('No active session');

    try {
      setError(null);
      const response = await fetch('/api/onboarding/position', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify(data)
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Failed to set position');
      }

      await refreshStatus();
    } catch (err: any) {
      console.error('[Onboarding] Error setting position:', err);
      setError(err.message);
      throw err;
    }
  };

  const resetOnboarding = async () => {
    if (!session) throw new Error('No active session');

    try {
      setError(null);
      const response = await fetch('/api/onboarding/reset', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Failed to reset onboarding');
      }

      await refreshStatus();
    } catch (err: any) {
      console.error('[Onboarding] Error resetting onboarding:', err);
      setError(err.message);
      throw err;
    }
  };

  return (
    <OnboardingContext.Provider
      value={{
        status,
        loading,
        error,
        refreshStatus,
        updateProfile,
        createOrganization,
        createTeam,
        joinWithInvite,
        getAvailableTeams,
        selectTeam,
        setPosition,
        resetOnboarding
      }}
    >
      {children}
    </OnboardingContext.Provider>
  );
}

export function useOnboarding() {
  const context = useContext(OnboardingContext);
  if (context === undefined) {
    throw new Error('useOnboarding must be used within an OnboardingProvider');
  }
  return context;
}
