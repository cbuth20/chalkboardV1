import { Handler } from '@netlify/functions';
import { createClient } from '@supabase/supabase-js';

// Test endpoint to verify service role key is working
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export const handler: Handler = async (event, context) => {
  // Check environment variables
  const envCheck = {
    NEXT_PUBLIC_SUPABASE_URL: !!supabaseUrl ? 'SET' : 'MISSING',
    SUPABASE_SERVICE_ROLE_KEY: !!supabaseServiceKey ? 'SET' : 'MISSING',
    keyLength: supabaseServiceKey?.length || 0,
  };

  console.log('[Test Service Role] Environment check:', envCheck);

  if (!supabaseUrl || !supabaseServiceKey) {
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        error: 'Missing Supabase credentials',
        env: envCheck,
      }),
    };
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });

  try {
    // Test 1: Can we query playbook_metadata?
    const { data: metadata, error: metadataError, count } = await supabase
      .from('playbook_metadata')
      .select('id, team_id, is_built_play', { count: 'exact' })
      .limit(5);

    // Test 2: Can we query plays?
    const { data: plays, error: playsError } = await supabase
      .from('plays')
      .select('id, name')
      .limit(5);

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        success: true,
        message: 'Service role is working!',
        env: envCheck,
        tests: {
          playbook_metadata: {
            success: !metadataError,
            count: count || 0,
            sampleIds: metadata?.map(m => m.id) || [],
            error: metadataError?.message,
          },
          plays: {
            success: !playsError,
            count: plays?.length || 0,
            sampleIds: plays?.map(p => p.id) || [],
            error: playsError?.message,
          },
        },
      }),
    };
  } catch (error: any) {
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        error: 'Test failed',
        message: error.message,
        env: envCheck,
      }),
    };
  }
};
