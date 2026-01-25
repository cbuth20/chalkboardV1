import { Handler } from '@netlify/functions';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export const handler: Handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const authHeader = event.headers.authorization || event.headers.Authorization;
    if (!authHeader) {
      return { statusCode: 401, body: JSON.stringify({ error: 'Missing authorization header' }) };
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return { statusCode: 401, body: JSON.stringify({ error: 'Unauthorized' }) };
    }

    const { positionCode, jerseyNumber, segmentId } = JSON.parse(event.body || '{}');

    if (!positionCode || positionCode.trim().length === 0) {
      return { statusCode: 400, body: JSON.stringify({ error: 'Position code is required' }) };
    }

    if (!jerseyNumber || jerseyNumber < 0 || jerseyNumber > 99) {
      return { statusCode: 400, body: JSON.stringify({ error: 'Jersey number must be between 0 and 99' }) };
    }

    const { data: profile, error: profileError } = await supabase
      .from('users')
      .select('id')
      .eq('auth_id', user.id)
      .single();

    if (profileError || !profile) {
      console.error('[Onboarding] Error fetching profile:', profileError);
      return { statusCode: 400, body: JSON.stringify({ error: 'Profile not found' }) };
    }

    const { data: membership, error: membershipError } = await supabase
      .from('org_memberships')
      .select('id, org_id')
      .eq('user_id', profile.id)
      .single();

    if (membershipError || !membership) {
      console.error('[Onboarding] Error fetching membership:', membershipError);
      return { statusCode: 400, body: JSON.stringify({ error: 'Organization membership not found. Join an organization first.' }) };
    }

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
          return { statusCode: 400, body: JSON.stringify({ error: 'Invalid segment ID' }) };
        }
      }
    }

    const { data: existingJersey } = await supabase
      .from('org_memberships')
      .select('id')
      .eq('org_id', membership.org_id)
      .eq('jersey_number', jerseyNumber)
      .neq('id', membership.id)
      .maybeSingle();

    if (existingJersey) {
      return { statusCode: 400, body: JSON.stringify({ error: `Jersey number ${jerseyNumber} is already taken` }) };
    }

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
      return { statusCode: 500, body: JSON.stringify({ error: 'Failed to update position' }) };
    }

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

    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        data: {
          membership: updatedMembership,
          nextStep: 'dashboard'
        }
      }),
    };
  } catch (error) {
    console.error('[Onboarding] Unexpected error:', error);
    return { statusCode: 500, body: JSON.stringify({ error: 'Internal server error' }) };
  }
};
