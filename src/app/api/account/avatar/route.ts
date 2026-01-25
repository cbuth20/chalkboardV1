import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Keep consistent with existing playbook storage usage
const BUCKET_NAME = 'Chalkboard Bucket';
const FOLDER_PREFIX = 'public/avatars';

type AvatarUploadBody = {
  fileName: string;
  contentType: string;
  dataBase64: string; // raw base64 (no data: prefix)
};

const ALLOWED_CONTENT_TYPES = new Set(['image/png', 'image/jpeg', 'image/webp']);
const MAX_BYTES = 2 * 1024 * 1024; // 2MB

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

export async function POST(request: NextRequest) {
  try {
    const auth = await getAuthUser(request);
    if ('error' in auth) return auth.error;

    const { supabase, authUserId } = auth;
    const body = (await request.json()) as Partial<AvatarUploadBody>;

    const fileName = typeof body.fileName === 'string' ? body.fileName : '';
    const contentType = typeof body.contentType === 'string' ? body.contentType : '';
    const dataBase64 = typeof body.dataBase64 === 'string' ? body.dataBase64 : '';

    if (!fileName || !contentType || !dataBase64) {
      return NextResponse.json({ success: false, error: 'Missing fileName, contentType, or dataBase64' }, { status: 400 });
    }

    if (!ALLOWED_CONTENT_TYPES.has(contentType)) {
      return NextResponse.json({ success: false, error: 'Avatar must be a PNG, JPG, or WebP' }, { status: 400 });
    }

    const bytes = Buffer.from(dataBase64, 'base64');
    if (bytes.byteLength > MAX_BYTES) {
      return NextResponse.json({ success: false, error: 'Avatar must be <= 2MB' }, { status: 400 });
    }

    const { data: profile, error: profileError } = await supabase
      .from('users')
      .select('id')
      .eq('auth_id', authUserId)
      .single();
    if (profileError || !profile) {
      return NextResponse.json({ success: false, error: 'Profile not found' }, { status: 404 });
    }

    const ext = contentType === 'image/png' ? 'png' : contentType === 'image/webp' ? 'webp' : 'jpg';
    const objectPath = `${FOLDER_PREFIX}/${profile.id}/${Date.now()}-${Math.random().toString(16).slice(2)}.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(objectPath, bytes, {
        contentType,
        upsert: true,
      });

    if (uploadError) {
      throw new Error(uploadError.message);
    }

    const { data: urlData } = supabase.storage
      .from(BUCKET_NAME)
      .getPublicUrl(objectPath);

    const avatarUrl = urlData.publicUrl;

    const { error: updateError } = await supabase
      .from('users')
      .update({ avatar_url: avatarUrl, updated_at: new Date().toISOString() })
      .eq('id', profile.id);

    if (updateError) {
      throw new Error(updateError.message);
    }

    return NextResponse.json({ success: true, data: { avatarUrl } });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

