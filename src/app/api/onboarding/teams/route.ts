import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase admin client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// GET /api/onboarding/teams - Get available teams for user's organization
export async function GET(request: NextRequest) {
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

    // Get user profile
    const { data: profile, error: profileError } = await supabase
      .from('users')
      .select('id, onboarding_state')
      .eq('auth_id', user.id)
      .single();

    if (profileError || !profile) {
      console.error('[Onboarding] Profile not found for auth_id:', user.id, profileError);
      return NextResponse.json(
        { error: 'Profile not found' },
        { status: 400 }
      );
    }

    console.log('[Onboarding] Found profile:', profile.id, 'state:', profile.onboarding_state);

    // Get user's org membership
    const { data: membership, error: membershipError } = await supabase
      .from('org_memberships')
      .select('org_id')
      .eq('user_id', profile.id)
      .maybeSingle();

    if (membershipError) {
      console.error('[Onboarding] Error fetching membership:', membershipError);
      return NextResponse.json(
        { error: 'Error fetching organization membership' },
        { status: 500 }
      );
    }

    if (!membership) {
      console.log('[Onboarding] No membership found for user:', profile.id);
      // Return empty teams list if no membership yet
      return NextResponse.json({
        success: true,
        data: {
          teams: []
        }
      });
    }

    // Get all teams in user's organization
    const { data: teams, error: teamsError } = await supabase
      .from('teams')
      .select('id, name, season')
      .eq('org_id', membership.org_id)
      .order('created_at', { ascending: false });

    if (teamsError) {
      console.error('[Onboarding] Error fetching teams:', teamsError);
      return NextResponse.json(
        { error: 'Failed to fetch teams' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        teams: teams || []
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

// POST /api/onboarding/teams/select - Select a team
interface SelectTeamRequestBody {
  teamId: string;
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

    const body: SelectTeamRequestBody = await request.json();
    const { teamId } = body;

    if (!teamId) {
      return NextResponse.json(
        { error: 'Team ID is required' },
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
      return NextResponse.json(
        { error: 'Profile not found' },
        { status: 400 }
      );
    }

    // Get user's org membership
    const { data: membership, error: membershipError } = await supabase
      .from('org_memberships')
      .select('id, org_id')
      .eq('user_id', profile.id)
      .single();

    if (membershipError || !membership) {
      return NextResponse.json(
        { error: 'No organization membership found' },
        { status: 400 }
      );
    }

    // Verify team belongs to user's org
    const { data: team, error: teamError } = await supabase
      .from('teams')
      .select('id, name, org_id')
      .eq('id', teamId)
      .eq('org_id', membership.org_id)
      .single();

    if (teamError || !team) {
      return NextResponse.json(
        { error: 'Team not found or does not belong to your organization' },
        { status: 404 }
      );
    }

    // Update membership with team_id
    const { data: updatedMembership, error: updateError } = await supabase
      .from('org_memberships')
      .update({
        team_id: teamId,
        updated_at: new Date().toISOString()
      })
      .eq('id', membership.id)
      .select()
      .single();

    if (updateError) {
      console.error('[Onboarding] Error updating membership:', updateError);
      return NextResponse.json(
        { error: 'Failed to select team' },
        { status: 500 }
      );
    }

    // Update onboarding state
    // If player, move to position selection
    // If coach, they're done
    const nextState = profile.role === 'player' ? 'pending_position' : 'completed';

    const { error: stateError } = await supabase
      .from('users')
      .update({
        onboarding_state: nextState,
        updated_at: new Date().toISOString()
      })
      .eq('id', profile.id);

    if (stateError) {
      console.error('[Onboarding] Error updating onboarding state:', stateError);
    }

    return NextResponse.json({
      success: true,
      data: {
        membership: updatedMembership,
        team,
        nextStep: nextState === 'pending_position' ? 'position' : 'dashboard'
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
