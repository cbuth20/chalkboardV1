"use client";

import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase/client';
import { UserRole, OnboardingState } from '@/lib/supabase/types/database';

interface UserProfile {
  id: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  onboardingState: OnboardingState;
  email: string;
  avatarUrl?: string;
}

interface UserMembership {
  id: string;
  orgId: string;
  orgName?: string;
  teamId?: string;
  teamName?: string;
  role: UserRole;
  positionCode?: string;
  jerseyNumber?: number;
  segmentId?: string;
}

interface AuthContextType {
  // Auth
  user: User | null;
  session: Session | null;
  loading: boolean;

  // Profile data (from users table)
  profile: UserProfile | null;

  // Membership data (from org_memberships table)
  membership: UserMembership | null;

  // Backwards compatibility (for existing code)
  userRole: UserRole | null;
  teamId: string | null;
  positionCode: string | null;
  orgId: string | null;
  userPositions: any[]; // Single position as array for backwards compatibility

  // Methods
  signOut: () => Promise<void>;
  refreshUserData: () => Promise<void>;
  updatePosition: (positionCode: string, jerseyNumber?: number) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [membership, setMembership] = useState<UserMembership | null>(null);

  // Backwards compatibility
  const userRole = profile?.role || membership?.role || null;
  const teamId = membership?.teamId || null;
  const positionCode = membership?.positionCode || null;
  const orgId = membership?.orgId || null;

  // Computed: single position as array for backwards compatibility
  // In new schema, users have one position per org membership
  const userPositions: any[] = positionCode ? [positionCode as any] : [];

  // Fetch user profile and membership data from API (non-blocking)
  const fetchUserData = async (accessToken: string) => {
    try {
      const response = await fetch('/api/onboarding/status', {
        headers: { 'Authorization': `Bearer ${accessToken}` }
      });

      if (!response.ok) {
        console.warn('[AuthContext] Failed to fetch profile/membership:', response.status);
        return;
      }

      const { success, data } = await response.json();

      if (success && data) {
        // Set profile
        if (data.profile) {
          setProfile({
            id: data.profile.id,
            firstName: data.profile.firstName || '',
            lastName: data.profile.lastName || '',
            role: data.profile.role as UserRole,
            onboardingState: data.onboardingState as OnboardingState,
            email: data.profile.email || '',
            avatarUrl: undefined,
          });
        } else {
          setProfile(null);
        }

        // Set membership
        if (data.membership) {
          setMembership({
            id: data.membership.id || '',
            orgId: data.membership.orgId,
            orgName: data.membership.orgName,
            teamId: data.membership.teamId,
            teamName: data.membership.teamName,
            role: data.membership.role as UserRole,
            positionCode: data.membership.positionCode,
            jerseyNumber: data.membership.jerseyNumber,
            segmentId: data.membership.segmentId,
          });
        } else {
          setMembership(null);
        }
      }
    } catch (error) {
      console.error('[AuthContext] Error fetching user data:', error);
      // Don't clear profile/membership on error - keep existing data
    }
  };

  useEffect(() => {
    // Initialize auth
    const initializeAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();

      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);

      // Fetch profile/membership in background (non-blocking)
      if (session?.access_token) {
        fetchUserData(session.access_token);
      }
    };

    initializeAuth();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      console.log('[AuthContext] Auth changed:', _event);

      setSession(session);
      setUser(session?.user ?? null);

      if (session?.access_token) {
        // Fetch updated profile/membership (non-blocking)
        fetchUserData(session.access_token);
      } else {
        // Clear on sign out
        setProfile(null);
        setMembership(null);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();

    // Clear local state
    setSession(null);
    setUser(null);
    setProfile(null);
    setMembership(null);
  };

  const refreshUserData = async () => {
    if (session?.access_token) {
      await fetchUserData(session.access_token);
    }
  };

  const updatePosition = async (positionCode: string, jerseyNumber?: number) => {
    if (!session?.access_token) {
      throw new Error('No active session');
    }

    const response = await fetch('/api/onboarding/position', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`
      },
      body: JSON.stringify({
        positionCode,
        jerseyNumber: jerseyNumber || 0
      })
    });

    const result = await response.json();

    if (!response.ok || !result.success) {
      throw new Error(result.error || 'Failed to update position');
    }

    // Refresh user data to get updated position
    await refreshUserData();
  };

  return (
    <AuthContext.Provider value={{
      user,
      session,
      loading,
      profile,
      membership,
      userRole,
      teamId,
      positionCode,
      orgId,
      userPositions,
      signOut,
      refreshUserData,
      updatePosition,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
