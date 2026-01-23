import { Handler } from '@netlify/functions';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

export const handler: Handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ success: false, error: 'Method not allowed' }) };
  }

  try {
    const authHeader = event.headers.authorization || event.headers.Authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      return {
        statusCode: 401,
        body: JSON.stringify({ success: false, error: 'Missing or invalid authorization header' }),
      };
    }

    const token = authHeader.substring(7);
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);

    if (authError || !user) {
      console.error('[Admin Invite] Auth error:', authError);
      return {
        statusCode: 401,
        body: JSON.stringify({ success: false, error: 'Invalid authentication token' }),
      };
    }

    const { data: profile, error: profileError } = await supabaseAdmin
      .from('users')
      .select('id, role')
      .eq('auth_id', user.id)
      .single();

    if (profileError || !profile) {
      console.error('[Admin Invite] Profile error:', profileError);
      return {
        statusCode: 404,
        body: JSON.stringify({ success: false, error: 'User profile not found' }),
      };
    }

    if (profile.role !== 'admin') {
      return {
        statusCode: 403,
        body: JSON.stringify({ success: false, error: 'Unauthorized: Admin role required' }),
      };
    }

    const { data: membership, error: membershipError } = await supabaseAdmin
      .from('org_memberships')
      .select('org_id')
      .eq('user_id', profile.id)
      .single();

    if (membershipError || !membership) {
      console.error('[Admin Invite] Membership error:', membershipError);
      return {
        statusCode: 404,
        body: JSON.stringify({ success: false, error: 'Organization membership not found' }),
      };
    }

    const { email, role } = JSON.parse(event.body || '{}');

    if (!email || !email.includes('@')) {
      return {
        statusCode: 400,
        body: JSON.stringify({ success: false, error: 'Valid email address required' }),
      };
    }

    if (role && !['coach', 'player'].includes(role)) {
      return {
        statusCode: 400,
        body: JSON.stringify({ success: false, error: 'Role must be coach or player' }),
      };
    }

    const { data: existingAuthUser } = await supabaseAdmin.auth.admin.listUsers();
    const userExists = existingAuthUser?.users?.some(u => u.email === email);

    if (userExists) {
      return {
        statusCode: 400,
        body: JSON.stringify({ success: false, error: 'A user with this email already exists' }),
      };
    }

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.URL || 'http://localhost:3000';
    const redirectUrl = `${baseUrl}/join/${membership.org_id}`;

    console.log('[Admin Invite] Sending invite to:', email, 'redirect:', redirectUrl);

    const { data: inviteData, error: inviteError } = await supabaseAdmin.auth.admin.inviteUserByEmail(
      email,
      {
        redirectTo: redirectUrl,
        data: {
          invited_by: profile.id,
          org_id: membership.org_id,
          suggested_role: role || 'player'
        }
      }
    );

    if (inviteError) {
      console.error('[Admin Invite] Supabase invite error:', inviteError);
      return {
        statusCode: 500,
        body: JSON.stringify({ success: false, error: inviteError.message }),
      };
    }

    console.log('[Admin Invite] Invite sent successfully to:', email);

    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        data: {
          email,
          inviteCode: membership.org_id,
          message: 'Invitation sent successfully'
        }
      }),
    };

  } catch (error: any) {
    console.error('[Admin Invite] Unexpected error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ success: false, error: error.message || 'Internal server error' }),
    };
  }
};
