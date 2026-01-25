import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase admin client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

interface OrganizationRequestBody {
  name: string;
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

    const body: OrganizationRequestBody = await request.json();
    const { name } = body;

    // Validate required fields
    if (!name || name.trim().length === 0) {
      return NextResponse.json(
        { error: 'Organization name is required' },
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

    // Create organization
    const { data: organization, error: orgError } = await supabase
      .from('organizations')
      .insert({
        owner_id: profile.id,
        name: name.trim()
      })
      .select()
      .single();

    if (orgError) {
      console.error('[Onboarding] Error creating organization:', orgError);
      return NextResponse.json(
        { error: 'Failed to create organization' },
        { status: 500 }
      );
    }

    // Create org membership for the owner
    // Use the user's profile role directly
    const membershipRole = profile.role || 'admin'; // Default to admin for org creators
    console.log('[Onboarding] Creating org membership with role:', membershipRole, 'for user:', profile.id);

    const { error: membershipError } = await supabase
      .from('org_memberships')
      .insert({
        org_id: organization.id,
        user_id: profile.id,
        role: membershipRole
      });

    if (membershipError) {
      console.error('[Onboarding] Error creating membership:', membershipError);
      // Rollback organization creation
      await supabase.from('organizations').delete().eq('id', organization.id);
      return NextResponse.json(
        { error: 'Failed to create organization membership' },
        { status: 500 }
      );
    }

    // Update user onboarding state based on role
    const nextState = profile.role === 'coach' || profile.role === 'admin'
      ? 'pending_team'
      : 'completed';  // Players complete onboarding after org creation

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
        nextStep: nextState === 'pending_team' ? 'team' : 'dashboard'
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
