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

    const { inviteCode } = JSON.parse(event.body || '{}');

    if (!inviteCode || inviteCode.trim().length === 0) {
      return { statusCode: 400, body: JSON.stringify({ error: 'Invite code is required' }) };
    }

    // Simple format: just the org ID
    const orgId = inviteCode.trim();

    const { data: profile, error: profileError } = await supabase
      .from('users')
      .select('id, role')
      .eq('auth_id', user.id)
      .single();

    if (profileError || !profile) {
      console.error('[Onboarding] Error fetching profile:', profileError);
      return { statusCode: 400, body: JSON.stringify({ error: 'Profile not found. Complete profile setup first.' }) };
    }

    const { data: organization, error: orgError } = await supabase
      .from('organizations')
      .select('id, name')
      .eq('id', orgId)
      .single();

    if (orgError || !organization) {
      console.error('[Onboarding] Organization not found:', orgError);
      return { statusCode: 404, body: JSON.stringify({ error: 'Organization not found. Invalid invite code.' }) };
    }

    const { data: existingMembership } = await supabase
      .from('org_memberships')
      .select('id')
      .eq('org_id', organization.id)
      .eq('user_id', profile.id)
      .maybeSingle();

    if (existingMembership) {
      return { statusCode: 400, body: JSON.stringify({ error: 'You are already a member of this organization' }) };
    }

    const membershipRole = profile.role || 'player';
    console.log('[Onboarding] Creating org membership with role:', membershipRole, 'for user:', profile.id);

    const { data: membership, error: membershipError } = await supabase
      .from('org_memberships')
      .insert({
        org_id: organization.id,
        user_id: profile.id,
        role: membershipRole
      })
      .select()
      .single();

    if (membershipError) {
      console.error('[Onboarding] Error creating membership:', membershipError);
      return { statusCode: 500, body: JSON.stringify({ error: 'Failed to join organization' }) };
    }

    const nextState = 'pending_team';

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

    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        data: {
          organization,
          membership,
          nextStep: 'team'
        }
      }),
    };
  } catch (error) {
    console.error('[Onboarding] Unexpected error:', error);
    return { statusCode: 500, body: JSON.stringify({ error: 'Internal server error' }) };
  }
};
