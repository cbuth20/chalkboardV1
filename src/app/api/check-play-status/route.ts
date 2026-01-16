import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const playId = searchParams.get('playId');

    if (!playId) {
      return NextResponse.json(
        { error: 'playId is required' },
        { status: 400 }
      );
    }

    // Fetch play with all related data
    const { data: play, error: playError } = await supabase
      .from('plays')
      .select('*')
      .eq('id', playId)
      .single();

    if (playError || !play) {
      return NextResponse.json(
        { error: 'Play not found' },
        { status: 404 }
      );
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

    return NextResponse.json({
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
    });
  } catch (error: any) {
    console.error('Error checking play status:', error);
    return NextResponse.json(
      {
        error: 'Failed to check play status',
        message: error.message,
      },
      { status: 500 }
    );
  }
}
