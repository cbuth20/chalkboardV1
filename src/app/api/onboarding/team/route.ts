import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase admin client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

interface TeamSegment {
  code: string;
  name: string;
}

interface TeamRequestBody {
  name: string;
  season?: string;
  segments?: TeamSegment[];
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

    const body: TeamRequestBody = await request.json();
    const { name, season, segments } = body;

    // Validate required fields
    if (!name || name.trim().length === 0) {
      return NextResponse.json(
        { error: 'Team name is required' },
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

    // Get user's organization
    const { data: membership, error: membershipError } = await supabase
      .from('org_memberships')
      .select('org_id, role')
      .eq('user_id', profile.id)
      .single();

    if (membershipError || !membership) {
      console.error('[Onboarding] Error fetching membership:', membershipError);
      return NextResponse.json(
        { error: 'Organization membership not found. Create or join an organization first.' },
        { status: 400 }
      );
    }

    // Verify user is coach or admin
    if (membership.role !== 'coach' && membership.role !== 'admin') {
      return NextResponse.json(
        { error: 'Only coaches and admins can create teams' },
        { status: 403 }
      );
    }

    // Check if team already exists for this org
    const { data: existingTeam } = await supabase
      .from('teams')
      .select('id')
      .eq('org_id', membership.org_id)
      .maybeSingle();

    if (existingTeam) {
      return NextResponse.json(
        { error: 'Team already exists for this organization' },
        { status: 400 }
      );
    }

    // Create team slug from name
    const slug = name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');

    // Create team
    const { data: team, error: teamError } = await supabase
      .from('teams')
      .insert({
        org_id: membership.org_id,
        name: name.trim(),
        slug,
        season: season || new Date().getFullYear().toString()
      })
      .select()
      .single();

    if (teamError) {
      console.error('[Onboarding] Error creating team:', teamError);
      return NextResponse.json(
        { error: 'Failed to create team' },
        { status: 500 }
      );
    }

    // Create team segments if provided
    if (segments && segments.length > 0) {
      const segmentInserts = segments.map(seg => ({
        team_id: team.id,
        code: seg.code.trim().toUpperCase(),
        name: seg.name.trim()
      }));

      const { error: segmentsError } = await supabase
        .from('team_segments')
        .insert(segmentInserts);

      if (segmentsError) {
        console.error('[Onboarding] Error creating segments:', segmentsError);
        // Don't fail the entire request if segments fail
      }
    }

    // Update user onboarding state to completed
    const { error: updateError } = await supabase
      .from('users')
      .update({
        onboarding_state: 'completed',
        updated_at: new Date().toISOString()
      })
      .eq('id', profile.id);

    if (updateError) {
      console.error('[Onboarding] Error updating onboarding state:', updateError);
    }

    return NextResponse.json({
      success: true,
      data: {
        team,
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
