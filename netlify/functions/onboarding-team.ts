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

    const { name, season, segments } = JSON.parse(event.body || '{}');

    if (!name || name.trim().length === 0) {
      return { statusCode: 400, body: JSON.stringify({ error: 'Team name is required' }) };
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
      .select('org_id, role')
      .eq('user_id', profile.id)
      .single();

    if (membershipError || !membership) {
      console.error('[Onboarding] Error fetching membership:', membershipError);
      return { statusCode: 400, body: JSON.stringify({ error: 'Organization membership not found. Create or join an organization first.' }) };
    }

    if (membership.role !== 'coach' && membership.role !== 'admin') {
      return { statusCode: 403, body: JSON.stringify({ error: 'Only coaches and admins can create teams' }) };
    }

    const slug = name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');

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
      return { statusCode: 500, body: JSON.stringify({ error: 'Failed to create team' }) };
    }

    if (segments && segments.length > 0) {
      const segmentInserts = segments.map((seg: any) => ({
        team_id: team.id,
        code: seg.code.trim().toUpperCase(),
        name: seg.name.trim()
      }));

      const { error: segmentsError } = await supabase
        .from('team_segments')
        .insert(segmentInserts);

      if (segmentsError) {
        console.error('[Onboarding] Error creating segments:', segmentsError);
      }
    }

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

    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        data: {
          team,
          nextStep: 'dashboard'
        }
      }),
    };
  } catch (error) {
    console.error('[Onboarding] Unexpected error:', error);
    return { statusCode: 500, body: JSON.stringify({ error: 'Internal server error' }) };
  }
};
