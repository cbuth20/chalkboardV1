// ═══════════════════════════════════════════════════════════════════════════════════════════
// CHALKBOARD — SUPABASE CLIENT
// 
// Supabase client configuration for both browser and server contexts.
// In production, add your Supabase URL and anon key from environment variables.
// ═══════════════════════════════════════════════════════════════════════════════════════════

// Note: In production, install @supabase/supabase-js:
// npm install @supabase/supabase-js

// import { createClient } from '@supabase/supabase-js';
// import { createBrowserClient, createServerClient } from '@supabase/ssr';
import type { 
  User, 
  Team, 
  TeamMember, 
  Game, 
  Question, 
  GameSession, 
  GameAttempt,
  XPEvent,
  UserStreak,
  DailyChallenge,
  DailyChallengeCompletion,
  LeaderboardSnapshot,
} from '@/lib/types/database';

// ───────────────────────────────────────────────────────────────────────────────────────────
// DATABASE TYPE DEFINITIONS
// ───────────────────────────────────────────────────────────────────────────────────────────

/**
 * Database schema type for Supabase client
 * This provides type-safe access to all tables
 */
export interface Database {
  public: {
    Tables: {
      users: {
        Row: User;
        Insert: Omit<User, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<User, 'id'>>;
      };
      teams: {
        Row: Team;
        Insert: Omit<Team, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<Team, 'id'>>;
      };
      team_members: {
        Row: TeamMember;
        Insert: Omit<TeamMember, 'id' | 'joined_at'>;
        Update: Partial<Omit<TeamMember, 'id'>>;
      };
      games: {
        Row: Game;
        Insert: Omit<Game, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<Game, 'id'>>;
      };
      questions: {
        Row: Question;
        Insert: Omit<Question, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<Question, 'id'>>;
      };
      game_sessions: {
        Row: GameSession;
        Insert: Omit<GameSession, 'id' | 'created_at'>;
        Update: Partial<Omit<GameSession, 'id'>>;
      };
      game_attempts: {
        Row: GameAttempt;
        Insert: Omit<GameAttempt, 'id' | 'created_at'>;
        Update: Partial<Omit<GameAttempt, 'id'>>;
      };
      xp_events: {
        Row: XPEvent;
        Insert: Omit<XPEvent, 'id' | 'created_at'>;
        Update: Partial<Omit<XPEvent, 'id'>>;
      };
      user_streaks: {
        Row: UserStreak;
        Insert: Omit<UserStreak, 'id'>;
        Update: Partial<Omit<UserStreak, 'id'>>;
      };
      daily_challenges: {
        Row: DailyChallenge;
        Insert: Omit<DailyChallenge, 'id' | 'created_at'>;
        Update: Partial<Omit<DailyChallenge, 'id'>>;
      };
      daily_challenge_completions: {
        Row: DailyChallengeCompletion;
        Insert: Omit<DailyChallengeCompletion, 'id' | 'completed_at'>;
        Update: Partial<Omit<DailyChallengeCompletion, 'id'>>;
      };
      leaderboard_snapshots: {
        Row: LeaderboardSnapshot;
        Insert: Omit<LeaderboardSnapshot, 'id' | 'computed_at'>;
        Update: Partial<Omit<LeaderboardSnapshot, 'id'>>;
      };
    };
    Views: {
      user_team_stats: {
        Row: {
          user_id: string;
          team_id: string;
          first_name: string;
          last_name: string;
          display_name: string | null;
          avatar_url: string | null;
          position: string | null;
          position_group: string | null;
          role: string;
          current_level: number;
          team_xp: number;
          current_streak: number;
          longest_streak: number;
          total_games: number;
          avg_accuracy: number;
          total_score: number;
        };
      };
      weekly_leaderboard: {
        Row: {
          user_id: string;
          team_id: string;
          first_name: string;
          last_name: string;
          display_name: string | null;
          avatar_url: string | null;
          position: string | null;
          position_group: string | null;
          current_level: number;
          weekly_xp: number;
          games_this_week: number;
          current_streak: number;
          team_rank: number;
        };
      };
    };
    Functions: {
      get_level_from_xp: {
        Args: { total_xp: number };
        Returns: number;
      };
    };
  };
}

// ───────────────────────────────────────────────────────────────────────────────────────────
// ENVIRONMENT CONFIGURATION
// ───────────────────────────────────────────────────────────────────────────────────────────

/**
 * Supabase configuration from environment variables
 * In .env.local:
 *   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
 *   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
 *   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key (for server-side)
 */
export const supabaseConfig = {
  url: process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
  serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY || '',
};

// ───────────────────────────────────────────────────────────────────────────────────────────
// CLIENT CREATION (Uncomment when @supabase/supabase-js is installed)
// ───────────────────────────────────────────────────────────────────────────────────────────

/**
 * Browser client - for use in React components
 */
// export const createBrowserSupabaseClient = () => {
//   return createClient<Database>(
//     supabaseConfig.url,
//     supabaseConfig.anonKey
//   );
// };

/**
 * Server client - for use in API routes and server components
 */
// export const createServerSupabaseClient = (cookies: () => { get: (name: string) => { value: string } | undefined }) => {
//   return createServerClient<Database>(
//     supabaseConfig.url,
//     supabaseConfig.anonKey,
//     {
//       cookies: {
//         get(name: string) {
//           return cookies().get(name)?.value;
//         },
//       },
//     }
//   );
// };

/**
 * Admin client - for server-side operations that bypass RLS
 * Use sparingly and only when necessary
 */
// export const createAdminSupabaseClient = () => {
//   return createClient<Database>(
//     supabaseConfig.url,
//     supabaseConfig.serviceRoleKey,
//     {
//       auth: {
//         autoRefreshToken: false,
//         persistSession: false,
//       },
//     }
//   );
// };

// ───────────────────────────────────────────────────────────────────────────────────────────
// HELPER TYPES
// ───────────────────────────────────────────────────────────────────────────────────────────

/**
 * Helper type to extract row types from tables
 */
export type Tables<T extends keyof Database['public']['Tables']> = 
  Database['public']['Tables'][T]['Row'];

/**
 * Helper type for insert operations
 */
export type TablesInsert<T extends keyof Database['public']['Tables']> = 
  Database['public']['Tables'][T]['Insert'];

/**
 * Helper type for update operations
 */
export type TablesUpdate<T extends keyof Database['public']['Tables']> = 
  Database['public']['Tables'][T]['Update'];

/**
 * Helper type to extract view types
 */
export type Views<T extends keyof Database['public']['Views']> = 
  Database['public']['Views'][T]['Row'];

// ───────────────────────────────────────────────────────────────────────────────────────────
// MOCK CLIENT FOR DEVELOPMENT
// ───────────────────────────────────────────────────────────────────────────────────────────

/**
 * Mock Supabase client for development without a real database
 * Replace with real client in production
 */
export const mockSupabaseClient = {
  auth: {
    getUser: async () => ({
      data: {
        user: {
          id: 'user-demo-123',
          email: 'demo@chalkboard.io',
        },
      },
      error: null,
    }),
    signIn: async () => ({ data: null, error: null }),
    signOut: async () => ({ error: null }),
  },
  from: (table: string) => ({
    select: (columns = '*') => ({
      eq: (column: string, value: unknown) => ({
        single: async () => ({ data: null, error: null }),
        order: (col: string, opts?: { ascending: boolean }) => ({
          limit: (n: number) => ({
            single: async () => ({ data: null, error: null }),
          }),
        }),
      }),
      order: (column: string, opts?: { ascending: boolean }) => ({
        limit: (n: number) => ({ data: [], error: null }),
      }),
    }),
    insert: (data: unknown) => ({
      select: () => ({
        single: async () => ({ data: null, error: null }),
      }),
    }),
    update: (data: unknown) => ({
      eq: (column: string, value: unknown) => ({ data: null, error: null }),
    }),
    delete: () => ({
      eq: (column: string, value: unknown) => ({ data: null, error: null }),
    }),
  }),
};

export type MockSupabaseClient = typeof mockSupabaseClient;








