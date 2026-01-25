import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

type ProfilePayload = {
  firstName?: string;
  lastName?: string;
  displayName?: string;
};

async function getAuthUser(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return { error: NextResponse.json({ success: false, error: 'Missing authorization header' }, { status: 401 }) };
  }

  const token = authHeader.substring(7);
  const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const { data: { user }, error } = await supabase.auth.getUser(token);
  if (error || !user) {
    return { error: NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 }) };
  }

  return { supabase, authUserId: user.id };
}

export async function GET(request: NextRequest) {
  try {
    const auth = await getAuthUser(request);
    if ('error' in auth) return auth.error;

    const { supabase, authUserId } = auth;
    const { data: profile, error } = await supabase
      .from('users')
      .select('id, email, first_name, last_name, display_name, avatar_url, role')
      .eq('auth_id', authUserId)
      .maybeSingle();

    if (error) throw new Error(error.message);
    if (!profile) {
      return NextResponse.json({ success: false, error: 'Profile not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: {
        id: profile.id,
        email: profile.email,
        firstName: profile.first_name,
        lastName: profile.last_name,
        displayName: profile.display_name,
        avatarUrl: profile.avatar_url,
        role: profile.role,
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await getAuthUser(request);
    if ('error' in auth) return auth.error;

    const { supabase, authUserId } = auth;
    const body = (await request.json()) as ProfilePayload;

    const firstName = typeof body.firstName === 'string' ? body.firstName.trim() : undefined;
    const lastName = typeof body.lastName === 'string' ? body.lastName.trim() : undefined;
    const displayName = typeof body.displayName === 'string' ? body.displayName.trim() : undefined;

    if (firstName != null && firstName.length === 0) {
      return NextResponse.json({ success: false, error: 'First name cannot be empty' }, { status: 400 });
    }
    if (lastName != null && lastName.length === 0) {
      return NextResponse.json({ success: false, error: 'Last name cannot be empty' }, { status: 400 });
    }
    if (displayName != null && displayName.length === 0) {
      return NextResponse.json({ success: false, error: 'Display name cannot be empty' }, { status: 400 });
    }

    const update: any = { updated_at: new Date().toISOString() };
    if (firstName != null) update.first_name = firstName;
    if (lastName != null) update.last_name = lastName;
    if (displayName != null) update.display_name = displayName;

    const { data: updated, error } = await supabase
      .from('users')
      .update(update)
      .eq('auth_id', authUserId)
      .select('id, email, first_name, last_name, display_name, avatar_url, role')
      .single();

    if (error) throw new Error(error.message);

    return NextResponse.json({
      success: true,
      data: {
        id: updated.id,
        email: updated.email,
        firstName: updated.first_name,
        lastName: updated.last_name,
        displayName: updated.display_name,
        avatarUrl: updated.avatar_url,
        role: updated.role,
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

