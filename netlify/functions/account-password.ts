import { Handler } from '@netlify/functions';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

export const handler: Handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ success: false, error: 'Method not allowed' }) };
  }

  try {
    const authHeader = event.headers.authorization || event.headers.Authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      return { statusCode: 401, body: JSON.stringify({ success: false, error: 'Missing or invalid authorization header' }) };
    }

    const token = authHeader.substring(7);
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
    if (authError || !user) {
      return { statusCode: 401, body: JSON.stringify({ success: false, error: 'Unauthorized' }) };
    }

    const { newPassword } = JSON.parse(event.body || '{}');
    if (typeof newPassword !== 'string' || newPassword.trim().length < 8) {
      return { statusCode: 400, body: JSON.stringify({ success: false, error: 'Password must be at least 8 characters' }) };
    }

    const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(user.id, { password: newPassword });
    if (updateError) {
      return { statusCode: 500, body: JSON.stringify({ success: false, error: updateError.message }) };
    }

    return { statusCode: 200, body: JSON.stringify({ success: true }) };
  } catch (error: unknown) {
    console.error('[Account Password] Unexpected error:', error);
    const message = error instanceof Error ? error.message : 'Internal server error';
    return { statusCode: 500, body: JSON.stringify({ success: false, error: message }) };
  }
};

