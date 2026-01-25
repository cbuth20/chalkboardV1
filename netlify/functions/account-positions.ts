import { Handler } from '@netlify/functions';
import { createClient } from '@supabase/supabase-js';

type SkillPosition = string;

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

function normalizePositions(raw: unknown): SkillPosition[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((p) => (typeof p === 'string' ? p.trim().toUpperCase() : ''))
    .filter(Boolean) as SkillPosition[];
}

async function getAuthedUser(authHeader?: string) {
  if (!authHeader?.startsWith('Bearer ')) return null;
  const token = authHeader.substring(7);
  const supabase = createClient(supabaseUrl, supabaseServiceKey);
  const { data: { user }, error } = await supabase.auth.getUser(token);
  if (error || !user) return null;
  return { supabase, authUser: user };
}

async function getOrCreatePublicUser(supabase: ReturnType<typeof createClient>, authUserId: string) {
  const { data: publicUser } = await supabase
    .from('users')
    .select('id, auth_id, email')
    .eq('auth_id', authUserId)
    .maybeSingle();

  if (publicUser) return publicUser;

  const { data: authUser } = await supabase.auth.admin.getUserById(authUserId);
  const email = authUser.user?.email || '';
  const displayName = email ? email.split('@')[0] : 'Player';

  const { data: newUser, error: createError } = await supabase
    .from('users')
    .insert({
      auth_id: authUserId,
      email,
      first_name: authUser.user?.user_metadata?.first_name || '',
      last_name: authUser.user?.user_metadata?.last_name || '',
      display_name: authUser.user?.user_metadata?.display_name || displayName,
    })
    .select('id, auth_id, email')
    .single();

  if (createError || !newUser) {
    throw new Error(createError?.message || 'Failed to create user record');
  }

  return newUser;
}

async function resolveTeamId(supabase: ReturnType<typeof createClient>, publicUserId: string): Promise<string | null> {
  const { data: membership } = await supabase
    .from('org_memberships')
    .select('org_id, team_id')
    .eq('user_id', publicUserId)
    .maybeSingle();

  if (membership?.team_id) return membership.team_id;

  if (membership?.org_id) {
    const { data: team } = await supabase
      .from('teams')
      .select('id')
      .eq('org_id', membership.org_id)
      .maybeSingle();
    if (team?.id) return team.id;
  }

  return null;
}

export const handler: Handler = async (event) => {
  const authHeader = event.headers.authorization || event.headers.Authorization;
  const auth = await getAuthedUser(authHeader);
  if (!auth) {
    return { statusCode: 401, body: JSON.stringify({ success: false, error: 'Unauthorized' }) };
  }

  try {
    const { supabase, authUser } = auth;
    const publicUser = await getOrCreatePublicUser(supabase, authUser.id);
    const teamId = await resolveTeamId(supabase, publicUser.id);

    if (event.httpMethod === 'GET') {
      if (!teamId) {
        return { statusCode: 200, body: JSON.stringify({ success: true, data: { teamId: null, positions: [], primaryPosition: null } }) };
      }

      const { data: teamMember } = await supabase
        .from('team_members')
        .select('positions, position, team_id')
        .eq('user_id', publicUser.id)
        .eq('team_id', teamId)
        .maybeSingle();

      const positions = normalizePositions(teamMember?.positions);
      const primaryPosition = (teamMember?.position || (positions[0] ?? null)) as SkillPosition | null;

      return {
        statusCode: 200,
        body: JSON.stringify({ success: true, data: { teamId, positions, primaryPosition } }),
      };
    }

    if (event.httpMethod === 'POST') {
      if (!teamId) {
        return { statusCode: 400, body: JSON.stringify({ success: false, error: 'No team found for user. Complete onboarding first.' }) };
      }

      const body = JSON.parse(event.body || '{}');
      const positions = normalizePositions(body?.positions);
      const primary = (positions[0] ?? null) as SkillPosition | null;

      const { data: existing } = await supabase
        .from('team_members')
        .select('id')
        .eq('user_id', publicUser.id)
        .eq('team_id', teamId)
        .maybeSingle();

      let saved;
      if (!existing) {
        const { data, error } = await supabase
          .from('team_members')
          .insert({
            user_id: publicUser.id,
            team_id: teamId,
            role: 'player',
            positions,
            position: primary,
          })
          .select('team_id, position, positions')
          .single();
        if (error) throw new Error(error.message);
        saved = data;
      } else {
        const { data, error } = await supabase
          .from('team_members')
          .update({ positions, position: primary })
          .eq('id', existing.id)
          .select('team_id, position, positions')
          .single();
        if (error) throw new Error(error.message);
        saved = data;
      }

      await supabase
        .from('org_memberships')
        .update({ position_code: primary })
        .eq('user_id', publicUser.id);

      return {
        statusCode: 200,
        body: JSON.stringify({
          success: true,
          data: {
            teamId: saved.team_id,
            positions: normalizePositions(saved.positions),
            primaryPosition: (saved.position || primary) as SkillPosition | null,
          },
        }),
      };
    }

    return { statusCode: 405, body: JSON.stringify({ success: false, error: 'Method not allowed' }) };
  } catch (error: unknown) {
    console.error('[Account Positions] Unexpected error:', error);
    const message = error instanceof Error ? error.message : 'Internal server error';
    return { statusCode: 500, body: JSON.stringify({ success: false, error: message }) };
  }
};

