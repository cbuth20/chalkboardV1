import { Handler } from '@netlify/functions';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client with service role key
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing required environment variables');
}

const supabase = createClient(supabaseUrl!, supabaseServiceKey!);

// This function ONLY creates the play record and returns the playId
// The actual AI generation happens in generate-play-content-background
export const handler: Handler = async (event, context) => {
  console.log('🚀 Starting play generation...');

  // Check for missing environment variables
  if (!supabaseUrl || !supabaseServiceKey) {
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
      imageUrl,
      fileName,
      teamId,
    } = JSON.parse(event.body || '{}');

    // Validation
    if (!playbookMetadataId || !imageUrl || !teamId) {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          error: 'Missing required fields: playbookMetadataId, imageUrl, teamId',
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
      return {
        statusCode: 404,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Playbook metadata not found' }),
      };
    }

    // Create play record with "generating" status
    console.log('Creating play record with generating status...');
    const { data: play, error: playError } = await supabase
      .from('plays')
      .insert({
        team_id: teamId,
        playbook_metadata_id: playbookMetadataId,
        name: metadata.formation_name || fileName || 'Untitled Play',
        short_name: metadata.formation_name?.substring(0, 50) || 'Untitled',
        play_type: 'PASS', // Default
        concept: metadata.concept_name,
        formation_name: metadata.formation_name,
        ai_insights: null,
        content_status: 'generating',
        is_published: false,
      })
      .select()
      .single();

    if (playError || !play) {
      console.error('Failed to insert play:', playError);
      return {
        statusCode: 500,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          error: 'Failed to create play record',
          details: playError?.message,
        }),
      };
    }

    const playId = play.id;
    console.log('✅ Created play with ID:', playId);

    // Trigger the background function to process this play
    // Note: This is a fire-and-forget call to the background function
    const host = event.headers.host || 'chalkboardv1.netlify.app';
    const backgroundUrl = `https://${host}/.netlify/functions/generate-play-content-background`;

    console.log('Triggering background function:', backgroundUrl);

    fetch(backgroundUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        playId,
        playbookMetadataId,
        imageUrl,
        fileName,
        teamId,
        generateInsights: true,
        generateAssignments: true,
        generateKnowledge: true,
      }),
    }).catch(err => console.error('Failed to trigger background function:', err));

    // Return immediately with playId
    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        success: true,
        playId,
        status: 'generating',
        message: 'Generation started - poll check-play-status endpoint',
      }),
    };
  } catch (error: any) {
    console.error('Error starting play generation:', error);
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        error: 'Failed to start play generation',
        message: error.message,
      }),
    };
  }
};
