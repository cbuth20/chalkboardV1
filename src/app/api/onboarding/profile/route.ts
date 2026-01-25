import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { UserRole } from '@/lib/supabase/types/database';

// Initialize Supabase admin client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

interface ProfileRequestBody {
  firstName: string;
  lastName: string;
  role: UserRole;
  avatarUrl?: string;
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

    const body: ProfileRequestBody = await request.json();
    const { firstName, lastName, role, avatarUrl } = body;

    // Validate required fields
    if (!firstName || !lastName || !role) {
      return NextResponse.json(
        { error: 'Missing required fields: firstName, lastName, role' },
        { status: 400 }
      );
    }

    // Check if user profile exists
    const { data: existingProfile } = await supabase
      .from('users')
      .select('id, onboarding_state')
      .eq('auth_id', user.id)
      .maybeSingle();

    if (existingProfile) {
      // Update existing profile
      const { data: updatedProfile, error: updateError } = await supabase
        .from('users')
        .update({
          first_name: firstName,
          last_name: lastName,
          role,
          avatar_url: avatarUrl || null,
          onboarding_state: 'pending_org',
          updated_at: new Date().toISOString()
        })
        .eq('id', existingProfile.id)
        .select()
        .single();

      if (updateError) {
        console.error('[Onboarding] Error updating profile:', updateError);
        return NextResponse.json(
          { error: 'Failed to update profile' },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        data: {
          profile: updatedProfile,
          nextStep: 'organization'
        }
      });
    } else {
      // Create new profile
      const { data: newProfile, error: createError } = await supabase
        .from('users')
        .insert({
          auth_id: user.id,
          email: user.email!,
          first_name: firstName,
          last_name: lastName,
          role,
          avatar_url: avatarUrl || null,
          onboarding_state: 'pending_org'
        })
        .select()
        .single();

      if (createError) {
        console.error('[Onboarding] Error creating profile:', createError);
        return NextResponse.json(
          { error: 'Failed to create profile' },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        data: {
          profile: newProfile,
          nextStep: 'organization'
        }
      });
    }
  } catch (error) {
    console.error('[Onboarding] Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
