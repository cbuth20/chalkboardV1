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

  // Fetch user profile and membership data from API (bypasses RLS)
  const fetchUserData = async (authUserId: string, signal?: AbortSignal) => {
    try {
      console.log('[AuthContext] Fetching user data for auth ID:', authUserId);

      // Get current session for auth token
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        console.warn('[AuthContext] No session available for API call');
        setProfile(null);
        setMembership(null);
        return;
      }

      // Use onboarding status API which already fetches all this data
      const response = await fetch('/api/onboarding/status', {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        },
        signal // Pass abort signal if provided
      });

      if (!response.ok) {
        console.error('[AuthContext] API error:', response.status);
        console.log('[AuthContext] ✗ Clearing state due to API error');
        setProfile(null);
        setMembership(null);
        return;
      }

      const responseData = await response.json();
      console.log('[AuthContext] Raw API response:', responseData);

      const { success, data } = responseData;

      if (success && data) {
        console.log('[AuthContext] Data fetched from API:', data);
        console.log('[AuthContext] Profile role from API:', data.profile?.role);

        // Set profile from API response
        if (data.profile) {
          const profileData = {
            id: data.profile.id,
            firstName: data.profile.firstName || '',
            lastName: data.profile.lastName || '',
            role: data.profile.role as UserRole,
            onboardingState: data.onboardingState as OnboardingState,
            email: data.profile.email || '',
            avatarUrl: undefined,
          };
          console.log('[AuthContext] About to set profile state:', profileData);
          setProfile(profileData);
          console.log('[AuthContext] ✓ setProfile() called');
        } else {
          console.log('[AuthContext] No profile data, setting to null');
          setProfile(null);
        }

        // Set membership from API response
        if (data.membership) {
          const membershipData = {
            id: data.membership.id || '',
            orgId: data.membership.orgId,
            orgName: data.membership.orgName,
            teamId: data.membership.teamId,
            teamName: data.membership.teamName,
            role: data.membership.role as UserRole,
            positionCode: data.membership.positionCode,
            jerseyNumber: data.membership.jerseyNumber,
            segmentId: data.membership.segmentId,
          };
          console.log('[AuthContext] Membership role from API:', data.membership.role);
          console.log('[AuthContext] About to set membership state:', membershipData);
          setMembership(membershipData);
          console.log('[AuthContext] ✓ setMembership() called');
        } else {
          console.log('[AuthContext] No membership data, setting to null');
          setMembership(null);
        }
      } else {
        console.log('[AuthContext] ✗ No profile/membership data from API (success or data is falsy)');
        console.log('[AuthContext] Success:', success, 'Data:', data);
        console.log('[AuthContext] Clearing state...');
        setProfile(null);
        setMembership(null);
      }
    } catch (error: any) {
      // Ignore abort errors - they're expected when requests are cancelled
      if (error.name === 'AbortError') {
        console.log('[AuthContext] Fetch aborted (request cancelled)');
        return;
      }
      console.error('[AuthContext] ✗ Error in fetchUserData:', error);
      console.log('[AuthContext] Clearing state due to error...');
      setProfile(null);
      setMembership(null);
    }
  };

  useEffect(() => {
    let mounted = true;

    const initializeAuth = async () => {
      try {
        console.log('[AuthContext] Starting auth initialization...');

        // Add overall timeout to prevent infinite hanging
        const timeoutId = setTimeout(() => {
          console.warn('[AuthContext] Overall initialization timeout, setting loading to false');
          if (mounted) {
            setLoading(false);
          }
        }, 15000); // 15 second max wait (increased from 8)

        try {
          // Get session
          const { data: { session }, error } = await supabase.auth.getSession();

          if (!mounted) {
            clearTimeout(timeoutId);
            return;
          }

          if (error) {
            console.error('[AuthContext] getSession error:', error);
            setSession(null);
            setUser(null);
            setProfile(null);
            setMembership(null);
            setLoading(false);
            clearTimeout(timeoutId);
            return;
          }

          console.log('[AuthContext] Session retrieved:', !!session);

          setSession(session);
          setUser(session?.user ?? null);

          // Fetch user data if user exists
          if (session?.user) {
            console.log('[AuthContext] Fetching user profile and membership...');

            try {
              await fetchUserData(session.user.id);
            } catch (err: any) {
              // Ignore AbortError
              if (err.name !== 'AbortError') {
                console.warn('[AuthContext] User data fetch failed (non-critical):', err);
              }
              // Continue anyway - user is still authenticated
            }
          }

          if (mounted) {
            setLoading(false);
            console.log('[AuthContext] Auth initialization complete');
          }

          clearTimeout(timeoutId);
        } catch (innerError) {
          clearTimeout(timeoutId);
          throw innerError;
        }
      } catch (error) {
        console.error('[AuthContext] Failed to initialize auth:', error);
        if (mounted) {
          setSession(null);
          setUser(null);
          setProfile(null);
          setMembership(null);
          setLoading(false);
        }
      }
    };

    initializeAuth();

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      console.log('[AuthContext] Auth state changed:', _event);
      setSession(session);
      setUser(session?.user ?? null);

      // Fetch user data if user exists
      if (session?.user) {
        try {
          await fetchUserData(session.user.id);
        } catch (err: any) {
          // Ignore AbortError
          if (err.name !== 'AbortError') {
            console.warn('[AuthContext] User data fetch failed on auth change:', err);
          }
        }
      } else {
        // Clear user data on sign out
        setProfile(null);
        setMembership(null);
      }

      setLoading(false);
    });

    // Combined cleanup function
    return () => {
      mounted = false;
      subscription.unsubscribe();
      console.log('[AuthContext] Cleanup: unsubscribed from auth changes');
    };
  }, []);

  const signOut = async () => {
    try {
      console.log('[AuthContext] Signing out...');
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('[AuthContext] Sign out error:', error);
        throw error;
      }
      console.log('[AuthContext] Sign out successful');

      // Clear local state
      setSession(null);
      setUser(null);
      setProfile(null);
      setMembership(null);
    } catch (error) {
      console.error('[AuthContext] Failed to sign out:', error);
      // Force clear state even on error
      setSession(null);
      setUser(null);
      setProfile(null);
      setMembership(null);
      throw error;
    }
  };

  const refreshUserData = async () => {
    if (user) {
      await fetchUserData(user.id);
    }
  };

  const updatePosition = async (positionCode: string, jerseyNumber?: number) => {
    if (!session) {
      throw new Error('No active session');
    }

    try {
      console.log('[AuthContext] Updating position to:', positionCode, jerseyNumber);
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
    } catch (error: any) {
      console.error('[AuthContext] Failed to update position:', error);
      throw error;
    }
  };

  // Debug: Log the context value being provided
  console.log('[AuthContext] Provider rendering with:', {
    hasUser: !!user,
    hasSession: !!session,
    loading,
    profileRole: profile?.role,
    membershipRole: membership?.role,
  });

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
