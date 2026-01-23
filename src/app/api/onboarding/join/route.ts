import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase admin client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

interface JoinRequestBody {
  inviteCode: string;
}

// Helper function to decode invite code (format: orgId-base64(orgName))
function decodeInviteCode(inviteCode: string): { orgId: string } | null {
  try {
    // Simple format: just the org ID for now
    // In production, you'd want a more secure token-based system
    return { orgId: inviteCode };
  } catch (error) {
    return null;
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get user from Authorization header
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Missing authorization header' }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body: JoinRequestBody = await request.json();
    const { inviteCode } = body;

    // Validate required fields
    if (!inviteCode || inviteCode.trim().length === 0) {
      return NextResponse.json(
        { error: 'Invite code is required' },
        { status: 400 }
      );
    }

    // Decode invite code
    const decoded = decodeInviteCode(inviteCode.trim());
    if (!decoded) {
      return NextResponse.json(
        { error: 'Invalid invite code' },
        { status: 400 }
      );
    }

    // Get user profile
    const { data: profile, error: profileError } = await supabase
      .from('users')
      .select('id, role')
      .eq('auth_id', user.id)
      .single();

    if (profileError || !profile) {
      console.error('[Onboarding] Error fetching profile:', profileError);
      return NextResponse.json(
        { error: 'Profile not found. Complete profile setup first.' },
        { status: 400 }
      );
    }

    // Verify organization exists
    const { data: organization, error: orgError } = await supabase
      .from('organizations')
      .select('id, name')
      .eq('id', decoded.orgId)
      .single();

    if (orgError || !organization) {
      console.error('[Onboarding] Organization not found:', orgError);
      return NextResponse.json(
        { error: 'Organization not found. Invalid invite code.' },
        { status: 404 }
      );
    }

    // Check if user is already a member
    const { data: existingMembership } = await supabase
      .from('org_memberships')
      .select('id')
      .eq('org_id', organization.id)
      .eq('user_id', profile.id)
      .maybeSingle();

    if (existingMembership) {
      return NextResponse.json(
        { error: 'You are already a member of this organization' },
        { status: 400 }
      );
    }

    // Create org membership
    const membershipRole = profile.role || 'player';
    console.log('[Onboarding] Creating org membership with role:', membershipRole, 'for user:', profile.id);

    const { data: membership, error: membershipError } = await supabase
      .from('org_memberships')
      .insert({
        org_id: organization.id,
        user_id: profile.id,
        role: membershipRole
      })
      .select()
      .single();

    if (membershipError) {
      console.error('[Onboarding] Error creating membership:', membershipError);
      return NextResponse.json(
        { error: 'Failed to join organization' },
        { status: 500 }
      );
    }

    // Update user onboarding state
    // After joining org, both coaches and players need to select a team
    const nextState = 'pending_team';

    const { error: updateError } = await supabase
      .from('users')
      .update({
        onboarding_state: nextState,
        updated_at: new Date().toISOString()
      })
      .eq('id', profile.id);

    if (updateError) {
      console.error('[Onboarding] Error updating onboarding state:', updateError);
    }

    return NextResponse.json({
      success: true,
      data: {
        organization,
        membership,
        nextStep: 'team'
      }
    });
  } catch (error) {
    console.error('[Onboarding] Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
