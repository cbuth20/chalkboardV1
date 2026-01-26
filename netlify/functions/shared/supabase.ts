/**
 * Supabase Client Utilities
 * Provides configured Supabase clients for different use cases
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '../../../src/lib/supabase/types/database';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

/**
 * Get Supabase client with service role (bypasses RLS)
 * Use for admin operations and background jobs
 */
export function getSupabaseAdmin(): SupabaseClient<Database> {
  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Missing Supabase configuration: NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  }

  return createClient<Database>(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

/**
 * Get Supabase client with anon key (respects RLS)
 * Use for user-scoped operations
 *
 * Note: If accessToken is provided, this creates a client that will use
 * that token for auth. The token validation happens when getUser() is called.
 */
export function getSupabaseClient(accessToken?: string): SupabaseClient<Database> {
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing Supabase configuration: NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY');
  }

  const client = createClient<Database>(supabaseUrl, supabaseAnonKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
    global: {
      headers: accessToken ? {
        Authorization: `Bearer ${accessToken}`
      } : {}
    }
  });

  return client;
}

/**
 * Validate required environment variables
 * Call this at the start of each function to fail fast
 */
export function validateEnv(): { valid: boolean; error?: string } {
  if (!supabaseUrl) {
    return { valid: false, error: 'Missing NEXT_PUBLIC_SUPABASE_URL' };
  }
  if (!supabaseAnonKey) {
    return { valid: false, error: 'Missing NEXT_PUBLIC_SUPABASE_ANON_KEY' };
  }
  if (!supabaseServiceKey) {
    return { valid: false, error: 'Missing SUPABASE_SERVICE_ROLE_KEY' };
  }
  return { valid: true };
}
