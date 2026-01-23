import { Handler } from '@netlify/functions';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export const handler: Handler = async (event) => {
  // Only allow POST requests
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' }),
    };
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get user from Authorization header
    const authHeader = event.headers.authorization || event.headers.Authorization;
    if (!authHeader) {
      return {
        statusCode: 401,
        body: JSON.stringify({ error: 'Missing authorization header' }),
      };
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return {
        statusCode: 401,
        body: JSON.stringify({ error: 'Unauthorized' }),
      };
    }

    const { firstName, lastName, role, avatarUrl } = JSON.parse(event.body || '{}');

    // Validate required fields
    if (!firstName || !lastName || !role) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Missing required fields: firstName, lastName, role' }),
      };
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
        return {
          statusCode: 500,
          body: JSON.stringify({ error: 'Failed to update profile' }),
        };
      }

      return {
        statusCode: 200,
        body: JSON.stringify({
          success: true,
          data: {
            profile: updatedProfile,
            nextStep: 'organization'
          }
        }),
      };
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
        return {
          statusCode: 500,
          body: JSON.stringify({ error: 'Failed to create profile' }),
        };
      }

      return {
        statusCode: 200,
        body: JSON.stringify({
          success: true,
          data: {
            profile: newProfile,
            nextStep: 'organization'
          }
        }),
      };
    }
  } catch (error) {
    console.error('[Onboarding] Unexpected error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Internal server error' }),
    };
  }
};
