import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Create Supabase client with service role key (bypasses RLS)
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

/**
 * POST /api/admin/invite
 * Send email invitation to join organization
 * Requires: Authorization header with Bearer token
 * Body: { email: string, role: 'coach' | 'player' }
 */
export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json(
        { success: false, error: 'Missing or invalid authorization header' },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);

    // Get the requesting user from token
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);

    if (authError || !user) {
      console.error('[Admin Invite] Auth error:', authError);
      return NextResponse.json(
        { success: false, error: 'Invalid authentication token' },
        { status: 401 }
      );
    }

    // Get admin's profile and verify they're an admin
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('users')
      .select('id, role')
      .eq('auth_id', user.id)
      .single();

    if (profileError || !profile) {
      console.error('[Admin Invite] Profile error:', profileError);
      return NextResponse.json(
        { success: false, error: 'User profile not found' },
        { status: 404 }
      );
    }

    if (profile.role !== 'admin') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized: Admin role required' },
        { status: 403 }
      );
    }

    // Get admin's organization
    const { data: membership, error: membershipError } = await supabaseAdmin
      .from('org_memberships')
      .select('org_id')
      .eq('user_id', profile.id)
      .single();

    if (membershipError || !membership) {
      console.error('[Admin Invite] Membership error:', membershipError);
      return NextResponse.json(
        { success: false, error: 'Organization membership not found' },
        { status: 404 }
      );
    }

    // Parse request body
    const { email, role } = await request.json();

    if (!email || !email.includes('@')) {
      return NextResponse.json(
        { success: false, error: 'Valid email address required' },
        { status: 400 }
      );
    }

    if (role && !['coach', 'player'].includes(role)) {
      return NextResponse.json(
        { success: false, error: 'Role must be coach or player' },
        { status: 400 }
      );
    }

    // Check if user with this email already exists
    const { data: existingAuthUser } = await supabaseAdmin.auth.admin.listUsers();
    const userExists = existingAuthUser?.users?.some(u => u.email === email);

    if (userExists) {
      return NextResponse.json(
        { success: false, error: 'A user with this email already exists' },
        { status: 400 }
      );
    }

    // Build redirect URL with invite code (org ID)
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const redirectUrl = `${baseUrl}/join/${membership.org_id}`;

    console.log('[Admin Invite] Sending invite to:', email, 'redirect:', redirectUrl);

    // Send Supabase invite email
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
      return NextResponse.json(
        { success: false, error: inviteError.message },
        { status: 500 }
      );
    }

    console.log('[Admin Invite] Invite sent successfully to:', email);

    return NextResponse.json({
      success: true,
      data: {
        email,
        inviteCode: membership.org_id,
        message: 'Invitation sent successfully'
      }
    });

  } catch (error: any) {
    console.error('[Admin Invite] Unexpected error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
