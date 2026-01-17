"use client";

import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase/client';
import { SkillPosition, UserRole } from '@/lib/supabase/types/database';
import { DEFAULT_TEAM_ID } from '@/lib/constants';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  userPosition: SkillPosition | null; // Deprecated - returns first position for backwards compatibility
  userPositions: SkillPosition[]; // New - array of all positions
  userRole: UserRole | null;
  teamId: string | null;
  signOut: () => Promise<void>;
  updateUserPosition: (position: SkillPosition) => Promise<void>; // Deprecated - use updateUserPositions
  updateUserPositions: (positions: SkillPosition[]) => Promise<void>;
  refreshUserData: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);
const POSITIONS_STORAGE_KEY = "chalkboard_user_positions"; // New key for array
const POSITION_STORAGE_KEY = "chalkboard_user_position"; // Old key - kept for migration

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  // Always start with empty array to avoid hydration mismatch
  const [userPositions, setUserPositionsState] = useState<SkillPosition[]>([]);
  const [isHydrated, setIsHydrated] = useState(false);

  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const [teamId, setTeamId] = useState<string | null>(null);

  // Backwards compatibility: userPosition returns first position
  const userPosition = userPositions.length > 0 ? userPositions[0] : null;

  // Load from localStorage after hydration (client-side only)
  useEffect(() => {
    setIsHydrated(true);

    // Try new key first (array)
    const savedPositions = localStorage.getItem(POSITIONS_STORAGE_KEY);
    if (savedPositions) {
      try {
        const positions = JSON.parse(savedPositions) as SkillPosition[];
        setUserPositionsState(positions);
        return;
      } catch (e) {
        console.error('Failed to parse positions from localStorage', e);
      }
    }

    // Fallback to old key (single position) and migrate
    const oldPosition = localStorage.getItem(POSITION_STORAGE_KEY);
    if (oldPosition) {
      const positions = [oldPosition as SkillPosition];
      localStorage.setItem(POSITIONS_STORAGE_KEY, JSON.stringify(positions));
      localStorage.removeItem(POSITION_STORAGE_KEY); // Clean up old key
      setUserPositionsState(positions);
    }
  }, []);

  // Wrapper for setUserPositions that also saves to localStorage
  const setUserPositions = (positions: SkillPosition[]) => {
    setUserPositionsState(positions);
    if (isHydrated) {
      if (positions.length > 0) {
        localStorage.setItem(POSITIONS_STORAGE_KEY, JSON.stringify(positions));
      } else {
        localStorage.removeItem(POSITIONS_STORAGE_KEY);
      }
    }
  };

  // Deprecated: Wrapper for single position (backwards compatibility)
  const setUserPosition = (position: SkillPosition | null) => {
    if (position) {
      setUserPositions([position]);
    } else {
      setUserPositions([]);
    }
  };

  // Fetch team member data (positions, role, team_id)
  const fetchTeamMemberData = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('team_members')
        .select('position, positions, role, team_id')
        .eq('user_id', userId)
        .maybeSingle(); // Use maybeSingle instead of single to handle 0 or 1 rows

      if (error) {
        console.error('Error fetching team member data:', error);
        return;
      }

      if (data) {
        console.log('[AuthContext] Fetched data from DB:', data);

        // Prefer positions array (new), fallback to position (old)
        let positionsToSet: SkillPosition[] = [];

        if (data.positions && Array.isArray(data.positions) && data.positions.length > 0) {
          // New positions array exists
          positionsToSet = data.positions as SkillPosition[];
          console.log('[AuthContext] Using positions array:', positionsToSet);
        } else if (data.position) {
          // Old single position exists, convert to array
          positionsToSet = [data.position as SkillPosition];
          console.log('[AuthContext] Migrating single position to array:', positionsToSet);
          // Update DB with positions array
          await supabase
            .from('team_members')
            .update({ positions: positionsToSet })
            .eq('user_id', userId);
        } else {
          // No positions in DB - check localStorage
          const savedPositionsStr = typeof window !== "undefined" ? localStorage.getItem(POSITIONS_STORAGE_KEY) : null;
          if (savedPositionsStr) {
            try {
              const savedPositions = JSON.parse(savedPositionsStr) as SkillPosition[];
              console.log('[AuthContext] DB has no positions, but localStorage has:', savedPositions);
              // Update DB with the localStorage positions
              await supabase
                .from('team_members')
                .update({ positions: savedPositions })
                .eq('user_id', userId);
              positionsToSet = savedPositions;
            } catch (e) {
              console.error('Failed to parse positions from localStorage', e);
            }
          }
        }

        setUserPositions(positionsToSet);
        setUserRole(data.role as UserRole);
        setTeamId(data.team_id);
      } else {
        // User not in any team yet - auto-assign to default team
        console.log('User not in team, auto-assigning to default team...');

        const { data: newMember, error: insertError } = await supabase
          .from('team_members')
          .insert({
            user_id: userId,
            team_id: DEFAULT_TEAM_ID,
            role: 'player', // Default to player role
            positions: [], // No positions yet
          })
          .select('positions, role, team_id')
          .single();

        if (insertError) {
          // If insert fails (e.g., duplicate), just use defaults
          console.log('Team member record already exists or insert failed, using defaults');
          setTeamId(DEFAULT_TEAM_ID);
          setUserRole('player');
          setUserPositions([]);
        } else if (newMember) {
          setUserPositions((newMember.positions as SkillPosition[]) || []);
          setUserRole(newMember.role as UserRole);
          setTeamId(newMember.team_id);
          console.log('✅ Auto-assigned to default team');
        }
      }
    } catch (error) {
      console.error('Error in fetchTeamMemberData:', error);
    }
  };

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);

      // Fetch team member data if user exists
      if (session?.user) {
        await fetchTeamMemberData(session.user.id);
      }

      setLoading(false);
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);

      // Fetch team member data if user exists
      if (session?.user) {
        await fetchTeamMemberData(session.user.id);
      } else {
        // Clear team member data on sign out
        setUserPosition(null);
        setUserRole(null);
        setTeamId(null);
      }

      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
    setUserPositions([]);
    setUserRole(null);
    setTeamId(null);
  };

  // Deprecated: Single position update (backwards compatibility)
  const updateUserPosition = async (position: SkillPosition) => {
    if (!user) return;

    const positions = [position];
    const { error } = await supabase
      .from('team_members')
      .update({ positions, position }) // Update both for backwards compatibility
      .eq('user_id', user.id);

    if (error) {
      console.error('Error updating position:', error);
      throw error;
    }

    setUserPositions(positions);
  };

  // New: Multiple positions update
  const updateUserPositions = async (positions: SkillPosition[]) => {
    if (!user) return;

    const updateData: any = { positions };
    // Also update old position field with first position for backwards compatibility
    if (positions.length > 0) {
      updateData.position = positions[0];
    }

    const { error } = await supabase
      .from('team_members')
      .update(updateData)
      .eq('user_id', user.id);

    if (error) {
      console.error('Error updating positions:', error);
      throw error;
    }

    setUserPositions(positions);
  };

  const refreshUserData = async () => {
    if (user) {
      await fetchTeamMemberData(user.id);
    }
  };

  return (
    <AuthContext.Provider value={{
      user,
      session,
      loading,
      userPosition, // Backwards compatibility - first position
      userPositions, // New - all positions
      userRole,
      teamId,
      signOut,
      updateUserPosition, // Backwards compatibility
      updateUserPositions, // New
      refreshUserData,
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
