/**
 * ⚠️ DEPRECATED - Use plays-list.ts and plays-get.ts instead
 * This endpoint does not support org-scoped multi-tenancy or RBAC
 * Migration:
 * - List plays: GET /api/plays?orgId=xxx&status=approved
 * - Get play details: GET /api/plays/:id?includeAssignments=true&includeFlashcards=true
 */

import { Handler } from '@netlify/functions';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client with service role for server-side operations
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
    const params = event.queryStringParameters || {};
    const { teamId, playId, type = 'all' } = params;

    if (!teamId) {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'teamId is required' }),
      };
    }

    // Fetch approved plays
    let playsQuery = supabase
      .from('plays')
      .select(`
        id,
        name,
        short_name,
        formation_name,
        concept,
        play_type,
        ai_insights,
        created_at,
        playbook_metadata:playbook_metadata_id (
          id,
          formation_name,
          concept_name,
          side_of_ball,
          content_type,
          level,
          position_relevance,
          custom_notes,
          file_paths
        )
      `)
      .eq('team_id', teamId)
      .eq('content_status', 'approved')
      .order('created_at', { ascending: false });

    // Filter by specific play if provided
    if (playId) {
      playsQuery = playsQuery.eq('id', playId);
    }

    const { data: plays, error: playsError } = await playsQuery;

    if (playsError) {
      console.error('Failed to fetch plays:', playsError);
      return {
        statusCode: 500,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          error: 'Failed to fetch plays',
          message: playsError.message,
        }),
      };
    }

    // If type is 'all' or 'insights', return plays with insights
    if (type === 'all' || type === 'insights') {
      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plays: plays || [] }),
      };
    }

    // If type is 'assignments', fetch assignments for the play(s)
    if (type === 'assignments') {
      if (!playId) {
        return {
          statusCode: 400,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            error: 'playId is required when fetching assignments',
          }),
        };
      }

      const { data: assignments, error: assignmentsError } = await supabase
        .from('play_assignments')
        .select('*')
        .eq('play_id', playId)
        .order('position', { ascending: true });

      if (assignmentsError) {
        console.error('Failed to fetch assignments:', assignmentsError);
        return {
          statusCode: 500,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            error: 'Failed to fetch assignments',
            message: assignmentsError.message,
          }),
        };
      }

      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          plays: plays || [],
          assignments: assignments || [],
        }),
      };
    }

    // If type is 'knowledge', fetch knowledge flashcards for the play(s)
    if (type === 'knowledge') {
      if (!playId) {
        return {
          statusCode: 400,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            error: 'playId is required when fetching knowledge cards',
          }),
        };
      }

      const { data: knowledgeCards, error: cardsError } = await supabase
        .from('flashcard_templates')
        .select('*')
        .eq('play_id', playId)
        .eq('card_type', 'knowledge')
        .eq('is_active', true)
        .order('created_at', { ascending: true });

      if (cardsError) {
        console.error('Failed to fetch knowledge cards:', cardsError);
        return {
          statusCode: 500,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            error: 'Failed to fetch knowledge cards',
            message: cardsError.message,
          }),
        };
      }

      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          plays: plays || [],
          knowledgeCards: knowledgeCards || [],
        }),
      };
    }

    // If type is 'assignment-flashcards', fetch assignment-specific flashcards
    if (type === 'assignment-flashcards') {
      const position = params.position;

      if (!playId) {
        return {
          statusCode: 400,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            error: 'playId is required when fetching assignment flashcards',
          }),
        };
      }

      let flashcardsQuery = supabase
        .from('flashcard_templates')
        .select('*')
        .eq('play_id', playId)
        .eq('card_type', 'assignment')
        .eq('is_active', true);

      // Filter by position if provided
      if (position) {
        flashcardsQuery = flashcardsQuery.eq('position', position.toUpperCase());
      }

      const { data: flashcards, error: flashcardsError } = await flashcardsQuery.order(
        'category',
        { ascending: true }
      );

      if (flashcardsError) {
        console.error('Failed to fetch flashcards:', flashcardsError);
        return {
          statusCode: 500,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            error: 'Failed to fetch flashcards',
            message: flashcardsError.message,
          }),
        };
      }

      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          plays: plays || [],
          flashcards: flashcards || [],
        }),
      };
    }

    // Invalid type
    return {
      statusCode: 400,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        error: 'Invalid type parameter. Must be: all, insights, assignments, knowledge, or assignment-flashcards',
      }),
    };
  } catch (error: any) {
    console.error('Error fetching approved plays:', error);
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        error: 'Failed to fetch approved plays',
        message: error.message,
      }),
    };
  }
};
