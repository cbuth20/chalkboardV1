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

export const handler: Handler = async (event) => {
  if (event.httpMethod !== 'GET') {
    return { statusCode: 405, body: JSON.stringify({ success: false, error: 'Method not allowed' }) };
  }

  try {
    const authHeader = event.headers.authorization || event.headers.Authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      return { statusCode: 401, body: JSON.stringify({ success: false, error: 'Missing authorization header' }) };
    }

    const token = authHeader.substring(7);
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return { statusCode: 401, body: JSON.stringify({ success: false, error: 'Unauthorized' }) };
    }

    // Resolve the caller to a public.users row
    let { data: publicUser, error: publicUserError } = await supabase
      .from('users')
      .select('id, auth_id, email')
      .eq('auth_id', user.id)
      .maybeSingle();

    if (publicUserError) throw new Error(publicUserError.message);

    if (!publicUser) {
      const { data: authUser } = await supabase.auth.admin.getUserById(user.id);
      const email = authUser.user?.email || '';
      const displayName = email ? email.split('@')[0] : 'Player';

      const { data: created, error: createErr } = await supabase
        .from('users')
        .insert({
          auth_id: user.id,
          email,
          first_name: authUser.user?.user_metadata?.first_name || '',
          last_name: authUser.user?.user_metadata?.last_name || '',
          display_name: authUser.user?.user_metadata?.display_name || displayName,
        })
        .select('id, auth_id, email')
        .single();

      if (createErr || !created) throw new Error(createErr?.message || 'Failed to create user profile');
      publicUser = created;
    }

    const { data: membership, error: membershipError } = await supabase
      .from('org_memberships')
      .select('org_id, team_id')
      .eq('user_id', publicUser.id)
      .maybeSingle();

    if (membershipError) throw new Error(membershipError.message);

    if (!membership?.org_id) {
      return { statusCode: 200, body: JSON.stringify({ success: true, data: { teamId: null, orgId: null, members: [] } }) };
    }

    let teamId: string | null = membership.team_id || null;
    if (!teamId) {
      const { data: team, error: teamError } = await supabase
        .from('teams')
        .select('id')
        .eq('org_id', membership.org_id)
        .maybeSingle();
      if (teamError) throw new Error(teamError.message);
      teamId = team?.id || null;
    }

    if (!teamId) {
      return { statusCode: 200, body: JSON.stringify({ success: true, data: { teamId: null, orgId: membership.org_id, members: [] } }) };
    }

    const { data: orgMembers, error: orgMembersError } = await supabase
      .from('org_memberships')
      .select(`
        user_id,
        role,
        position_code,
        jersey_number,
        segment_id,
        users!inner(
          id,
          email,
          first_name,
          last_name,
          display_name,
          avatar_url
        )
      `)
      .eq('org_id', membership.org_id);

    if (orgMembersError) throw new Error(orgMembersError.message);

    const memberUserIds = (orgMembers || []).map((m: any) => m.user_id);

    const { data: teamMembers, error: teamMembersError } = await supabase
      .from('team_members')
      .select('user_id, positions, position')
      .eq('team_id', teamId)
      .in('user_id', memberUserIds);

    if (teamMembersError) {
      console.warn('[Team Members] Unable to load team_members.positions:', teamMembersError.message);
    }

    const positionsByUserId = new Map<string, SkillPosition[]>();
    const primaryByUserId = new Map<string, SkillPosition | null>();

    for (const row of teamMembers || []) {
      const positions = normalizePositions((row as any).positions);
      const primary = ((row as any).position || positions[0] || null) as SkillPosition | null;
      positionsByUserId.set((row as any).user_id, positions);
      primaryByUserId.set((row as any).user_id, primary);
    }

    const members = (orgMembers || []).map((m: any) => {
      const u = m.users;
      const multi = positionsByUserId.get(m.user_id) || [];
      const primary = primaryByUserId.get(m.user_id) || (m.position_code ? String(m.position_code).toUpperCase() : null);

      return {
        userId: m.user_id as string,
        email: u.email as string,
        firstName: u.first_name as string,
        lastName: u.last_name as string,
        displayName: (u.display_name as string) || `${u.first_name} ${u.last_name}`.trim(),
        avatarUrl: (u.avatar_url as string) || null,
        role: m.role as string,
        jerseyNumber: m.jersey_number as number | null,
        primaryPosition: primary,
        positions: multi.length > 0 ? multi : (primary ? [primary] : []),
        segmentId: m.segment_id as string | null,
      };
    });

    members.sort((a, b) => {
      const ln = a.lastName.localeCompare(b.lastName);
      if (ln !== 0) return ln;
      return a.firstName.localeCompare(b.firstName);
    });

    return {
      statusCode: 200,
      body: JSON.stringify({ success: true, data: { orgId: membership.org_id, teamId, members } }),
    };
  } catch (error: unknown) {
    console.error('[Team Members] GET error:', error);
    const message = error instanceof Error ? error.message : 'Internal server error';
    return { statusCode: 500, body: JSON.stringify({ success: false, error: message }) };
  }
};

