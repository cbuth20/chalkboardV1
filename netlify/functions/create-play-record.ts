import { Handler } from '@netlify/functions';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing required environment variables');
}

const supabase = supabaseUrl && supabaseServiceKey
  ? createClient(supabaseUrl, supabaseServiceKey)
  : null;

// Fast function that ONLY creates the play record and returns the ID
export const handler: Handler = async (event, context) => {
  console.log('📝 Create play record function started');

  if (!supabase) {
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        error: 'Server configuration error',
        message: 'Missing required environment variables',
      }),
    };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Method not allowed' }),
    };
  }

  try {
    const {
      playbookMetadataId,
      fileName,
      teamId,
    } = JSON.parse(event.body || '{}');

    if (!playbookMetadataId || !teamId) {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          error: 'Missing required fields: playbookMetadataId, teamId',
        }),
      };
    }

    // Fetch playbook metadata
    const { data: metadata, error: metadataError } = await supabase
      .from('playbook_metadata')
      .select('*')
      .eq('id', playbookMetadataId)
      .single();

    if (metadataError || !metadata) {
      console.error('❌ Metadata fetch failed:', metadataError);
      return {
        statusCode: 404,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Playbook metadata not found' }),
      };
    }

    // Create play record with "generating" status
    console.log('💾 Creating play record...');
    const { data: play, error: playError } = await supabase
      .from('plays')
      .insert({
        team_id: teamId,
        playbook_metadata_id: playbookMetadataId,
        name: metadata.formation_name || fileName || 'Untitled Play',
        short_name: metadata.formation_name?.substring(0, 50) || 'Untitled',
        play_type: 'PASS',
        concept: metadata.concept_name,
        formation_name: metadata.formation_name,
        ai_insights: null,
        content_status: 'generating',
        is_published: false,
      })
      .select()
      .single();

    if (playError || !play) {
      console.error('❌ Failed to insert play:', playError);
      return {
        statusCode: 500,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          error: 'Failed to create play record',
          details: playError?.message,
        }),
      };
    }

    console.log('✅ Play created with ID:', play.id);

    // Return immediately with playId
    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        success: true,
        playId: play.id,
        status: 'generating',
      }),
    };
  } catch (error: any) {
    console.error('❌ Error creating play:', error);
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        error: 'Failed to create play record',
        message: error.message,
      }),
    };
  }
};
