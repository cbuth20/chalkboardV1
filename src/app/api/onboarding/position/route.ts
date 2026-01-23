import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase admin client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

interface PositionRequestBody {
  positionCode: string;
  jerseyNumber: number;
  segmentId?: string;
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

    const body: PositionRequestBody = await request.json();
    const { positionCode, jerseyNumber, segmentId } = body;

    // Validate required fields
    if (!positionCode || positionCode.trim().length === 0) {
      return NextResponse.json(
        { error: 'Position code is required' },
        { status: 400 }
      );
    }

    if (!jerseyNumber || jerseyNumber < 0 || jerseyNumber > 99) {
      return NextResponse.json(
        { error: 'Jersey number must be between 0 and 99' },
        { status: 400 }
      );
    }

    // Get user profile
    const { data: profile, error: profileError } = await supabase
      .from('users')
      .select('id')
      .eq('auth_id', user.id)
      .single();

    if (profileError || !profile) {
      console.error('[Onboarding] Error fetching profile:', profileError);
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
      console.error('[Onboarding] Error fetching membership:', membershipError);
      return NextResponse.json(
        { error: 'Organization membership not found. Join an organization first.' },
        { status: 400 }
      );
    }

    // Verify segment belongs to this org's team (if provided)
    if (segmentId) {
      const { data: team } = await supabase
        .from('teams')
        .select('id')
        .eq('org_id', membership.org_id)
        .single();

      if (team) {
        const { data: segment, error: segmentError } = await supabase
          .from('team_segments')
          .select('id')
          .eq('id', segmentId)
          .eq('team_id', team.id)
          .single();

        if (segmentError || !segment) {
          return NextResponse.json(
            { error: 'Invalid segment ID' },
            { status: 400 }
          );
        }
      }
    }

    // Check if jersey number is already taken in this org
    const { data: existingJersey } = await supabase
      .from('org_memberships')
      .select('id')
      .eq('org_id', membership.org_id)
      .eq('jersey_number', jerseyNumber)
      .neq('id', membership.id)
      .maybeSingle();

    if (existingJersey) {
      return NextResponse.json(
        { error: `Jersey number ${jerseyNumber} is already taken` },
        { status: 400 }
      );
    }

    // Update org membership with position and jersey
    const { data: updatedMembership, error: updateError } = await supabase
      .from('org_memberships')
      .update({
        position_code: positionCode.trim().toUpperCase(),
        jersey_number: jerseyNumber,
        segment_id: segmentId || null,
        updated_at: new Date().toISOString()
      })
      .eq('id', membership.id)
      .select()
      .single();

    if (updateError) {
      console.error('[Onboarding] Error updating membership:', updateError);
      return NextResponse.json(
        { error: 'Failed to update position' },
        { status: 500 }
      );
    }

    // Update user onboarding state to completed
    const { error: stateUpdateError } = await supabase
      .from('users')
      .update({
        onboarding_state: 'completed',
        updated_at: new Date().toISOString()
      })
      .eq('id', profile.id);

    if (stateUpdateError) {
      console.error('[Onboarding] Error updating onboarding state:', stateUpdateError);
    }

    return NextResponse.json({
      success: true,
      data: {
        membership: updatedMembership,
        nextStep: 'dashboard'
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
