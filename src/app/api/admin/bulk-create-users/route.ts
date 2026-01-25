import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

function isValidEmail(email: string) {
  return email.includes('@') && email.includes('.') && email.length > 5;
}

/**
 * POST /api/admin/bulk-create-users
 * Body: { emails: string[], password: string, role?: 'player' | 'coach' }
 * Creates users via Supabase Admin API and sends a custom email (with initial password).
 *
 * Env:
 * - RESEND_API_KEY
 * - EMAIL_FROM (e.g. "Chalkboard Sports <no-reply@chalkboardsports.io>")
 * - NEXT_PUBLIC_APP_URL
 */
export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json(
        { success: false, error: 'Missing or invalid authorization header' },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json({ success: false, error: 'Invalid authentication token' }, { status: 401 });
    }

    // Verify requester is admin
    const { data: requester, error: requesterError } = await supabaseAdmin
      .from('users')
      .select('id, role')
      .eq('auth_id', user.id)
      .single();

    if (requesterError || !requester) {
      return NextResponse.json({ success: false, error: 'User profile not found' }, { status: 404 });
    }

    if (requester.role !== 'admin') {
      return NextResponse.json({ success: false, error: 'Unauthorized: Admin role required' }, { status: 403 });
    }

    // Get admin org
    const { data: membership, error: membershipError } = await supabaseAdmin
      .from('org_memberships')
      .select('org_id')
      .eq('user_id', requester.id)
      .single();

    if (membershipError || !membership) {
      return NextResponse.json({ success: false, error: 'Organization membership not found' }, { status: 404 });
    }

    const body = await request.json();
    const emails: string[] = Array.isArray(body?.emails) ? body.emails : [];
    const password: string = typeof body?.password === 'string' ? body.password : '';
    const role: 'player' | 'coach' = body?.role === 'coach' ? 'coach' : 'player';

    const cleanedEmails = emails
      .map((e) => (typeof e === 'string' ? e.trim().toLowerCase() : ''))
      .filter(Boolean);

    if (cleanedEmails.length === 0) {
      return NextResponse.json({ success: false, error: 'At least one email is required' }, { status: 400 });
    }

    const invalid = cleanedEmails.filter((e) => !isValidEmail(e));
    if (invalid.length > 0) {
      return NextResponse.json({ success: false, error: `Invalid email(s): ${invalid.join(', ')}` }, { status: 400 });
    }

    if (!password || password.trim().length < 8) {
      return NextResponse.json(
        { success: false, error: 'Password must be at least 8 characters' },
        { status: 400 }
      );
    }

    const resendApiKey = process.env.RESEND_API_KEY;
    const emailFrom = process.env.EMAIL_FROM;
    if (!resendApiKey || !emailFrom) {
      return NextResponse.json(
        { success: false, error: 'Missing RESEND_API_KEY or EMAIL_FROM environment variables' },
        { status: 500 }
      );
    }

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const joinUrl = `${baseUrl}/login?redirect=${encodeURIComponent(`/join/${membership.org_id}`)}`;

    const results: Array<{ email: string; success: boolean; error?: string }> = [];

    for (const email of cleanedEmails) {
      try {
        // Pre-check: if a public.users row already exists with this email but no auth_id,
        // the auth->public.users trigger can fail due to UNIQUE(email).
        const { data: existingEmailProfile, error: existingEmailProfileError } = await supabaseAdmin
          .from('users')
          .select('id, auth_id')
          .eq('email', email)
          .maybeSingle();

        if (existingEmailProfileError) {
          results.push({ email, success: false, error: `Failed checking existing profile: ${existingEmailProfileError.message}` });
          continue;
        }

        if (existingEmailProfile && !existingEmailProfile.auth_id) {
          results.push({
            email,
            success: false,
            error:
              'A row already exists in public.users with this email but no auth_id. ' +
              'This can block Supabase Auth user creation due to a UNIQUE(email) conflict in the auth trigger. ' +
              'Fix: delete or merge that public.users row, or apply `migrations/fix_handle_new_user_email_conflict.sql`.',
          });
          continue;
        }

        const { data: created, error: createError } = await supabaseAdmin.auth.admin.createUser({
          email,
          password,
          email_confirm: true,
          user_metadata: {
            display_name: email.split('@')[0],
            suggested_role: role,
            invited_by: requester.id,
            org_id: membership.org_id,
          },
        });

        const authUserId = created?.user?.id;
        if (createError || !authUserId) {
          results.push({ email, success: false, error: createError?.message || 'Failed to create auth user' });
          continue;
        }

        // Ensure public.users record exists (trigger normally handles this) AND set correct role.
        const { data: existingProfile } = await supabaseAdmin
          .from('users')
          .select('id, role')
          .eq('auth_id', authUserId)
          .maybeSingle();

        if (!existingProfile) {
          const { error: profileError } = await supabaseAdmin
            .from('users')
            .insert({
              auth_id: authUserId,
              email,
              first_name: '',
              last_name: '',
              display_name: email.split('@')[0],
              role,
            });

          if (profileError) {
            results.push({ email, success: false, error: `Created auth user but failed to create profile: ${profileError.message}` });
            continue;
          }
        } else if (existingProfile.role !== role) {
          // Most common case: trigger created profile with default role 'player'
          const { error: roleUpdateError } = await supabaseAdmin
            .from('users')
            .update({ role, updated_at: new Date().toISOString() })
            .eq('id', existingProfile.id);

          if (roleUpdateError) {
            results.push({ email, success: false, error: `User created but failed to set role: ${roleUpdateError.message}` });
            continue;
          }
        }

        // Send email via Resend (custom)
        const subject = `Your Chalkboard account is ready`;
        const html = `
          <h2>Welcome to Chalkboard Sports</h2>
          <p>An admin created your account.</p>
          <p><strong>Email:</strong> ${email}</p>
          <p><strong>Temporary password:</strong> ${password}</p>
          <p><a href="${joinUrl}">Click here to log in and join your team</a></p>
          <p style="color:#64748b;font-size:12px;margin-top:8px;">
            After you log in, go to Account settings to change your password.
          </p>
        `;

        const emailRes = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${resendApiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            from: emailFrom,
            to: email,
            subject,
            html,
          }),
        });

        if (!emailRes.ok) {
          const text = await emailRes.text();
          results.push({ email, success: false, error: `User created but email failed: ${text}` });
          continue;
        }

        results.push({ email, success: true });
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Unexpected error';
        results.push({ email, success: false, error: message });
      }
    }

    return NextResponse.json({ success: true, data: { results } });
  } catch (error: unknown) {
    console.error('[Admin Bulk Create] Unexpected error:', error);
    const message = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}

