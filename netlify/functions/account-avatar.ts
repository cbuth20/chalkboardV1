import { Handler } from '@netlify/functions';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const BUCKET_NAME = 'Chalkboard Bucket';
const FOLDER_PREFIX = 'public/avatars';

type AvatarUploadBody = {
  fileName: string;
  contentType: string;
  dataBase64: string; // raw base64 (no data: prefix)
};

const ALLOWED_CONTENT_TYPES = new Set(['image/png', 'image/jpeg', 'image/webp']);
const MAX_BYTES = 2 * 1024 * 1024; // 2MB

export const handler: Handler = async (event) => {
  if (event.httpMethod !== 'POST') {
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

    const body = JSON.parse(event.body || '{}') as Partial<AvatarUploadBody>;
    const fileName = typeof body.fileName === 'string' ? body.fileName : '';
    const contentType = typeof body.contentType === 'string' ? body.contentType : '';
    const dataBase64 = typeof body.dataBase64 === 'string' ? body.dataBase64 : '';

    if (!fileName || !contentType || !dataBase64) {
      return { statusCode: 400, body: JSON.stringify({ success: false, error: 'Missing fileName, contentType, or dataBase64' }) };
    }

    if (!ALLOWED_CONTENT_TYPES.has(contentType)) {
      return { statusCode: 400, body: JSON.stringify({ success: false, error: 'Avatar must be a PNG, JPG, or WebP' }) };
    }

    const bytes = Buffer.from(dataBase64, 'base64');
    if (bytes.byteLength > MAX_BYTES) {
      return { statusCode: 400, body: JSON.stringify({ success: false, error: 'Avatar must be <= 2MB' }) };
    }

    const { data: profile, error: profileError } = await supabase
      .from('users')
      .select('id')
      .eq('auth_id', user.id)
      .single();

    if (profileError || !profile) {
      return { statusCode: 404, body: JSON.stringify({ success: false, error: 'Profile not found' }) };
    }

    const ext = contentType === 'image/png' ? 'png' : contentType === 'image/webp' ? 'webp' : 'jpg';
    const objectPath = `${FOLDER_PREFIX}/${profile.id}/${Date.now()}-${Math.random().toString(16).slice(2)}.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(objectPath, bytes, { contentType, upsert: true });

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

    if (updateError) throw new Error(updateError.message);

    return { statusCode: 200, body: JSON.stringify({ success: true, data: { avatarUrl } }) };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    return { statusCode: 500, body: JSON.stringify({ success: false, error: message }) };
  }
};

