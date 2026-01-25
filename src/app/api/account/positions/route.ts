import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import type { SkillPosition } from '@/lib/supabase/types/database';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

function normalizePositions(raw: unknown): SkillPosition[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((p) => (typeof p === 'string' ? p.trim().toUpperCase() : ''))
    .filter(Boolean) as SkillPosition[];
}

async function getAuthedUser(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return { error: NextResponse.json({ success: false, error: 'Missing authorization header' }, { status: 401 }) };
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);
  const token = authHeader.substring(7);
  const { data: { user }, error } = await supabase.auth.getUser(token);
  if (error || !user) {
    return { error: NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 }) };
  }

  return { supabase, token, authUser: user };
}

async function getOrCreatePublicUser(supabase: ReturnType<typeof createClient>, authUserId: string) {
  // Try to find the user in public.users
  let { data: publicUser } = await supabase
    .from('users')
    .select('id, auth_id, email')
    .eq('auth_id', authUserId)
    .maybeSingle();

  if (publicUser) return publicUser;

  // Create minimal record (first/last are NOT NULL in this schema)
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

async function resolveTeamId(
  supabase: ReturnType<typeof createClient>,
  publicUserId: string
): Promise<string | null> {
  // Prefer explicit team assignment from org_memberships if present
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

export async function GET(request: NextRequest) {
  try {
    const auth = await getAuthedUser(request);
    if ('error' in auth && auth.error) return auth.error;

    const { supabase, authUser } = auth;
    const publicUser = await getOrCreatePublicUser(supabase, authUser.id);
    const teamId = await resolveTeamId(supabase, publicUser.id);

    if (!teamId) {
      return NextResponse.json({
        success: true,
        data: {
          teamId: null,
          positions: [] as SkillPosition[],
          primaryPosition: null as SkillPosition | null,
        },
      });
    }

    const { data: teamMember } = await supabase
      .from('team_members')
      .select('positions, position, team_id')
      .eq('user_id', publicUser.id)
      .eq('team_id', teamId)
      .maybeSingle();

    const positions = normalizePositions(teamMember?.positions);
    const primaryPosition = (teamMember?.position || (positions[0] ?? null)) as SkillPosition | null;

    return NextResponse.json({
      success: true,
      data: {
        teamId,
        positions,
        primaryPosition,
      },
    });
  } catch (error: any) {
    console.error('[Account Positions] GET error:', error);
    return NextResponse.json({ success: false, error: error.message || 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await getAuthedUser(request);
    if ('error' in auth && auth.error) return auth.error;

    const { supabase, authUser } = auth;
    const publicUser = await getOrCreatePublicUser(supabase, authUser.id);
    const teamId = await resolveTeamId(supabase, publicUser.id);

    if (!teamId) {
      return NextResponse.json(
        { success: false, error: 'No team found for user. Complete onboarding first.' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const positions = normalizePositions(body?.positions);

    // Upsert team_members row for this user/team
    const { data: existing } = await supabase
      .from('team_members')
      .select('id')
      .eq('user_id', publicUser.id)
      .eq('team_id', teamId)
      .maybeSingle();

    const primary = (positions[0] ?? null) as SkillPosition | null;

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
        .update({
          positions,
          position: primary,
        })
        .eq('id', existing.id)
        .select('team_id, position, positions')
        .single();
      if (error) throw new Error(error.message);
      saved = data;
    }

    // Backwards-compat: keep org_memberships.position_code aligned to primary
    await supabase
      .from('org_memberships')
      .update({ position_code: primary })
      .eq('user_id', publicUser.id);

    return NextResponse.json({
      success: true,
      data: {
        teamId: saved.team_id,
        positions: normalizePositions(saved.positions),
        primaryPosition: (saved.position || primary) as SkillPosition | null,
      },
    });
  } catch (error: any) {
    console.error('[Account Positions] POST error:', error);
    return NextResponse.json({ success: false, error: error.message || 'Internal server error' }, { status: 500 });
  }
}

