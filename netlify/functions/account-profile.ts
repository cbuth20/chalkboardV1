import { Handler } from '@netlify/functions';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

type ProfilePayload = {
  firstName?: string;
  lastName?: string;
  displayName?: string;
};

export const handler: Handler = async (event) => {
  if (event.httpMethod !== 'GET' && event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ success: false, error: 'Method not allowed' }) };
  }

  try {
    const authHeader = event.headers.authorization || event.headers.Authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      return { statusCode: 401, body: JSON.stringify({ success: false, error: 'Missing authorization header' }) };
    }

    const token = authHeader.substring(7);
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return { statusCode: 401, body: JSON.stringify({ success: false, error: 'Unauthorized' }) };
    }

    if (event.httpMethod === 'GET') {
      const { data: profile, error } = await supabase
        .from('users')
        .select('id, email, first_name, last_name, display_name, avatar_url, role')
        .eq('auth_id', user.id)
        .maybeSingle();

      if (error) throw new Error(error.message);
      if (!profile) return { statusCode: 404, body: JSON.stringify({ success: false, error: 'Profile not found' }) };

      return {
        statusCode: 200,
        body: JSON.stringify({
          success: true,
          data: {
            id: profile.id,
            email: profile.email,
            firstName: profile.first_name,
            lastName: profile.last_name,
            displayName: profile.display_name,
            avatarUrl: profile.avatar_url,
            role: profile.role,
          },
        }),
      };
    }

    const body = JSON.parse(event.body || '{}') as ProfilePayload;
    const firstName = typeof body.firstName === 'string' ? body.firstName.trim() : undefined;
    const lastName = typeof body.lastName === 'string' ? body.lastName.trim() : undefined;
    const displayName = typeof body.displayName === 'string' ? body.displayName.trim() : undefined;

    if (firstName != null && firstName.length === 0) {
      return { statusCode: 400, body: JSON.stringify({ success: false, error: 'First name cannot be empty' }) };
    }
    if (lastName != null && lastName.length === 0) {
      return { statusCode: 400, body: JSON.stringify({ success: false, error: 'Last name cannot be empty' }) };
    }
    if (displayName != null && displayName.length === 0) {
      return { statusCode: 400, body: JSON.stringify({ success: false, error: 'Display name cannot be empty' }) };
    }

    const update: any = { updated_at: new Date().toISOString() };
    if (firstName != null) update.first_name = firstName;
    if (lastName !=null) update.last_name = lastName;
    if (displayName != null) update.display_name = displayName;

    const { data: updated, error: updateError } = await supabase
      .from('users')
      .update(update)
      .eq('auth_id', user.id)
      .select('id, email, first_name, last_name, display_name, avatar_url, role')
      .single();

    if (updateError) throw new Error(updateError.message);

    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        data: {
          id: updated.id,
          email: updated.email,
          firstName: updated.first_name,
          lastName: updated.last_name,
          displayName: updated.display_name,
          avatarUrl: updated.avatar_url,
          role: updated.role,
        },
      }),
    };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    return { statusCode: 500, body: JSON.stringify({ success: false, error: message }) };
  }
};

