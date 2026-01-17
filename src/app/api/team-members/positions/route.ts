import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { SkillPosition } from '@/lib/supabase/types/database';

// Initialize Supabase client with service role for server-side operations
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

const DEFAULT_TEAM_ID = '00000000-0000-0000-0000-000000000000';

// PUT /api/team-members/positions - Update user's positions (with auto-creation)
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, positions } = body as {
      userId: string;  // This is the auth.users.id
      positions: SkillPosition[];
    };

    if (!userId || !positions) {
      return NextResponse.json(
        { error: 'userId and positions are required' },
        { status: 400 }
      );
    }

    console.log('[API] Updating positions for auth user:', userId, 'to:', positions);

    // Get or create user in public.users table
    // Check if user exists in public.users by auth_id
    let { data: publicUser, error: userCheckError } = await supabase
      .from('users')
      .select('id, auth_id')
      .eq('auth_id', userId)
      .maybeSingle();

    if (!publicUser) {
      console.log('[API] User not found in public.users, creating...');

      // Get user data from auth to populate public.users
      const { data: authUser, error: authError } = await supabase.auth.admin.getUserById(userId);

      if (authError || !authUser.user) {
        console.error('[API] Error fetching auth user:', authError);
        return NextResponse.json(
          { error: 'User not found in auth system', details: authError?.message },
          { status: 404 }
        );
      }

      // Create user in public.users (only required columns to avoid schema mismatches)
      const { data: newUser, error: userCreateError } = await supabase
        .from('users')
        .insert({
          auth_id: userId,
          email: authUser.user.email || '',
          first_name: authUser.user.user_metadata?.first_name || '',
          last_name: authUser.user.user_metadata?.last_name || '',
          display_name: authUser.user.user_metadata?.display_name || authUser.user.email?.split('@')[0] || 'Player',
        })
        .select('id, auth_id')
        .single();

      if (userCreateError) {
        console.error('[API] Error creating user record:', userCreateError);
        return NextResponse.json(
          { error: 'Failed to create user record', details: userCreateError.message },
          { status: 500 }
        );
      }

      publicUser = newUser;
      console.log('[API] Created public.users record:', publicUser.id);
    }

    // Now use publicUser.id (not auth userId) for team_members foreign key
    const publicUserId = publicUser.id;
    console.log('[API] Using public user ID:', publicUserId);

    // Check if team member record exists (using public.users.id)
    const { data: existingMember, error: checkError } = await supabase
      .from('team_members')
      .select('id, user_id, team_id, role')
      .eq('user_id', publicUserId)
      .maybeSingle();

    if (checkError && checkError.code !== 'PGRST116') {
      console.error('[API] Error checking team member:', checkError);
      return NextResponse.json(
        { error: 'Failed to check team member', details: checkError.message },
        { status: 500 }
      );
    }

    let result;

    if (!existingMember) {
      // Create new team member record
      console.log('[API] Creating new team member record');

      const insertData = {
        user_id: publicUserId,  // Use public.users.id, not auth id
        team_id: DEFAULT_TEAM_ID,
        role: 'player',
        positions,
        position: positions.length > 0 ? positions[0] : null,
      };

      const { data, error } = await supabase
        .from('team_members')
        .insert(insertData)
        .select()
        .single();

      if (error) {
        console.error('[API] Error creating team member:', error);
        return NextResponse.json(
          { error: 'Failed to create team member', details: error.message },
          { status: 500 }
        );
      }

      result = data;
      console.log('[API] Team member created successfully');
    } else {
      // Update existing team member record
      console.log('[API] Updating existing team member record');

      const updateData: any = { positions };
      if (positions.length > 0) {
        updateData.position = positions[0];
      }

      const { data, error } = await supabase
        .from('team_members')
        .update(updateData)
        .eq('user_id', publicUserId)  // Use public.users.id, not auth id
        .select()
        .single();

      if (error) {
        console.error('[API] Error updating team member:', error);
        return NextResponse.json(
          { error: 'Failed to update positions', details: error.message },
          { status: 500 }
        );
      }

      result = data;
      console.log('[API] Positions updated successfully');
    }

    return NextResponse.json({
      success: true,
      teamMember: result,
    });
  } catch (error: any) {
    console.error('[API] Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}
