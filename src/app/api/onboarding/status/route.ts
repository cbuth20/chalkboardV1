import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { OnboardingState } from '@/lib/supabase/types/database';

// Initialize Supabase admin client for server-side operations
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get user from Authorization header
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json(
        { error: 'Missing authorization header' },
        { status: 401 }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get user profile with onboarding state
    const { data: profile, error: profileError } = await supabase
      .from('users')
      .select('id, onboarding_state, first_name, last_name, email, role')
      .eq('auth_id', user.id)
      .maybeSingle();

    // If no profile exists yet, user is in 'new' state
    if (!profile) {
      console.log('[Onboarding] No profile found for user, returning new state');
      return NextResponse.json({
        success: true,
        data: {
          onboardingState: 'new',
          nextStep: 'profile',
          profile: null,
          membership: null
        }
      });
    }

    if (profileError) {
      console.error('[Onboarding] Error fetching profile:', profileError);
      return NextResponse.json(
        { error: 'Failed to fetch profile' },
        { status: 500 }
      );
    }

    const onboardingState = profile.onboarding_state || 'new';

    console.log('[Onboarding] User profile:', profile.id, 'state:', onboardingState, 'role:', profile.role);

    // Get org membership if exists
    const { data: membership, error: membershipError } = await supabase
      .from('org_memberships')
      .select(`
        id,
        role,
        position_code,
        jersey_number,
        segment_id,
        org_id,
        team_id
      `)
      .eq('user_id', profile.id)
      .maybeSingle();

    if (membershipError) {
      console.error('[Onboarding] Error fetching membership:', membershipError);
    }

    console.log('[Onboarding] Membership found:', !!membership, membership?.id);

    // Get org details if membership exists
    let orgData = null;
    let teamData = null;

    if (membership?.org_id) {
      const { data: org } = await supabase
        .from('organizations')
        .select('id, name')
        .eq('id', membership.org_id)
        .single();

      orgData = org;

      // Get team if assigned
      if (membership.team_id) {
        const { data: team } = await supabase
          .from('teams')
          .select('id, name')
          .eq('id', membership.team_id)
          .single();

        teamData = team;
      }
    }

    // Determine next step based on state
    const nextStepMap: Record<OnboardingState, string> = {
      'new': 'profile',
      'profile_incomplete': 'profile',
      'pending_org': 'organization',
      'pending_team': 'team',
      'pending_position': 'position',
      'completed': 'dashboard'
    };

    return NextResponse.json({
      success: true,
      data: {
        onboardingState,
        nextStep: nextStepMap[onboardingState as OnboardingState],
        profile: {
          id: profile.id,
          firstName: profile.first_name,
          lastName: profile.last_name,
          email: profile.email,
          role: profile.role
        },
        membership: membership ? {
          id: membership.id,
          orgId: orgData?.id,
          orgName: orgData?.name,
          teamId: teamData?.id,
          teamName: teamData?.name,
          role: membership.role,
          positionCode: membership.position_code,
          jerseyNumber: membership.jersey_number,
          segmentId: membership.segment_id
        } : null
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
