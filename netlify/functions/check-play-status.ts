import { Handler } from '@netlify/functions';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

export const handler: Handler = async (event, context) => {
  if (event.httpMethod !== 'GET') {
    return {
      statusCode: 405,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Method not allowed' }),
    };
  }

  try {
    const playId = event.queryStringParameters?.playId;

    if (!playId) {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'playId is required' }),
      };
    }

    // Fetch play with all related data
    const { data: play, error: playError } = await supabase
      .from('plays')
      .select('*')
      .eq('id', playId)
      .single();

    if (playError || !play) {
      return {
        statusCode: 404,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Play not found' }),
      };
    }

    // Fetch assignments
    const { data: assignments } = await supabase
      .from('play_assignments')
      .select('*')
      .eq('play_id', playId);

    // Fetch flashcards
    const { data: knowledgeCards } = await supabase
      .from('flashcard_templates')
      .select('*')
      .eq('play_id', playId);

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        playId: play.id,
        status: play.content_status,
        insights: play.ai_insights,
        assignments: assignments || [],
        knowledgeCards: knowledgeCards || [],
        playAnalysis: {
          name: play.name,
          shortName: play.short_name,
          playType: play.play_type,
          concept: play.concept,
          formation: play.formation_name,
        },
      }),
    };
  } catch (error: any) {
    console.error('Error checking play status:', error);
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        error: 'Failed to check play status',
        message: error.message,
      }),
    };
  }
};
