import { Handler } from '@netlify/functions';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export const handler: Handler = async (event) => {
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

  // GET - Fetch available teams
  if (event.httpMethod === 'GET') {
    try {
      const { data: profile, error: profileError } = await supabase
        .from('users')
        .select('id, onboarding_state')
        .eq('auth_id', user.id)
        .single();

      if (profileError || !profile) {
        console.error('[Onboarding] Profile not found for auth_id:', user.id, profileError);
        return { statusCode: 400, body: JSON.stringify({ error: 'Profile not found' }) };
      }

      console.log('[Onboarding] Found profile:', profile.id, 'state:', profile.onboarding_state);

      const { data: membership, error: membershipError } = await supabase
        .from('org_memberships')
        .select('org_id')
        .eq('user_id', profile.id)
        .maybeSingle();

      if (membershipError) {
        console.error('[Onboarding] Error fetching membership:', membershipError);
        return { statusCode: 500, body: JSON.stringify({ error: 'Error fetching organization membership' }) };
      }

      if (!membership) {
        console.log('[Onboarding] No membership found for user:', profile.id);
        return {
          statusCode: 200,
          body: JSON.stringify({
            success: true,
            data: { teams: [] }
          }),
        };
      }

      const { data: teams, error: teamsError } = await supabase
        .from('teams')
        .select('id, name, season')
        .eq('org_id', membership.org_id)
        .order('created_at', { ascending: false });

      if (teamsError) {
        console.error('[Onboarding] Error fetching teams:', teamsError);
        return { statusCode: 500, body: JSON.stringify({ error: 'Failed to fetch teams' }) };
      }

      return {
        statusCode: 200,
        body: JSON.stringify({
          success: true,
          data: { teams: teams || [] }
        }),
      };
    } catch (error) {
      console.error('[Onboarding] Unexpected error:', error);
      return { statusCode: 500, body: JSON.stringify({ error: 'Internal server error' }) };
    }
  }

  // POST - Select a team
  if (event.httpMethod === 'POST') {
    try {
      const { teamId } = JSON.parse(event.body || '{}');

      if (!teamId) {
        return { statusCode: 400, body: JSON.stringify({ error: 'Team ID is required' }) };
      }

      const { data: profile, error: profileError } = await supabase
        .from('users')
        .select('id, role')
        .eq('auth_id', user.id)
        .single();

      if (profileError || !profile) {
        return { statusCode: 400, body: JSON.stringify({ error: 'Profile not found' }) };
      }

      const { data: membership, error: membershipError } = await supabase
        .from('org_memberships')
        .select('id, org_id')
        .eq('user_id', profile.id)
        .single();

      if (membershipError || !membership) {
        return { statusCode: 400, body: JSON.stringify({ error: 'No organization membership found' }) };
      }

      const { data: team, error: teamError } = await supabase
        .from('teams')
        .select('id, name, org_id')
        .eq('id', teamId)
        .eq('org_id', membership.org_id)
        .single();

      if (teamError || !team) {
        return { statusCode: 404, body: JSON.stringify({ error: 'Team not found or does not belong to your organization' }) };
      }

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
        return { statusCode: 500, body: JSON.stringify({ error: 'Failed to select team' }) };
      }

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

      return {
        statusCode: 200,
        body: JSON.stringify({
          success: true,
          data: {
            membership: updatedMembership,
            team,
            nextStep: nextState === 'pending_position' ? 'position' : 'dashboard'
          }
        }),
      };
    } catch (error) {
      console.error('[Onboarding] Unexpected error:', error);
      return { statusCode: 500, body: JSON.stringify({ error: 'Internal server error' }) };
    }
  }

  return { statusCode: 405, body: JSON.stringify({ error: 'Method not allowed' }) };
};
