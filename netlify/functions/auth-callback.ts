import { Handler } from '@netlify/functions';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const handler: Handler = async (event) => {
  // Only allow GET requests
  if (event.httpMethod !== 'GET') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' }),
    };
  }

  try {
    // Parse query parameters
    const params = event.queryStringParameters || {};
    const code = params.code;
    const redirect = params.redirect;

    if (code) {
      // Create Supabase client
      const supabase = createClient(supabaseUrl, supabaseAnonKey);

      // Exchange code for session
      await supabase.auth.exchangeCodeForSession(code);
    }

    // Determine redirect URL
    const redirectTo = redirect || '/playbook';
    console.log('[Auth Callback] Redirecting to:', redirectTo);

    // Get the base URL (Netlify provides this)
    const baseUrl = process.env.URL || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

    // Redirect to the appropriate page
    return {
      statusCode: 302,
      headers: {
        Location: `${baseUrl}${redirectTo}`,
      },
      body: '',
    };
  } catch (error) {
    console.error('[Auth Callback] Error:', error);

    // On error, redirect to login
    const baseUrl = process.env.URL || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    return {
      statusCode: 302,
      headers: {
        Location: `${baseUrl}/login`,
      },
      body: '',
    };
  }
};
