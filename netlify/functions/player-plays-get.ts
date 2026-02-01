/**
 * GET /api/player-plays-get/:id
 * Get single player play with assignments and flashcards
 * Auth: Player (only access own content)
 */

import { Handler } from '@netlify/functions';
import { withOrgAuth, getAuthenticatedUser } from './shared/auth';
import { getSupabaseAdmin } from './shared/supabase';
import { formatErrorResponse, NotFoundError, ForbiddenError } from './shared/errors';
import { validateUUID } from './shared/validators';

const handler: Handler = withOrgAuth('player')(async (event, context) => {
  if (event.httpMethod !== 'GET') {
    return {
      statusCode: 405,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Method not allowed' }),
    };
  }

  try {
    const user = getAuthenticatedUser(event);
    const supabase = getSupabaseAdmin();

    // Get play ID from path
    const pathParts = event.path.split('/');
    const playId = pathParts[pathParts.length - 1];
    validateUUID(playId, 'playId');

    // Query parameters for optional data
    const params = event.queryStringParameters || {};
    const includeAssignments = params.includeAssignments !== 'false'; // Default true
    const includeFlashcards = params.includeFlashcards !== 'false'; // Default true
    const position = params.position; // Filter flashcards by position

    // Fetch play
    const { data: play, error: playError } = await supabase
      .from('player_plays')
      .select(`
        *,
        player_playbook_metadata:player_playbook_metadata_id (
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
      .eq('id', playId)
      .single();

    if (playError || !play) {
      throw new NotFoundError('Player play');
    }

    // Verify access: play must belong to user
    if (play.user_id !== user.userId || play.org_id !== user.orgId) {
      throw new ForbiddenError('Access denied to this play');
    }

    // Fetch assignments if requested
    let assignments = [];
    if (includeAssignments) {
      const { data: assignmentData, error: assignmentError } = await supabase
        .from('player_play_assignments')
        .select('*')
        .eq('player_play_id', playId)
        .order('position', { ascending: true });

      if (assignmentError) {
        console.warn('Failed to fetch player assignments:', assignmentError);
      } else {
        assignments = assignmentData || [];
      }
    }

    // Fetch flashcards if requested
    let flashcards = [];
    if (includeFlashcards) {
      let flashcardsQuery = supabase
        .from('player_flashcard_templates')
        .select('*')
        .eq('player_play_id', playId)
        .eq('is_active', true)
        .order('category', { ascending: true })
        .order('difficulty', { ascending: true });

      // Filter by position if provided
      if (position) {
        flashcardsQuery = flashcardsQuery.eq('position', position.toUpperCase());
      }

      const { data: flashcardData, error: flashcardError } = await flashcardsQuery;

      if (flashcardError) {
        console.warn('Failed to fetch player flashcards:', flashcardError);
      } else {
        flashcards = flashcardData || [];
      }
    }

    console.log(`✅ Fetched player play ${playId} with ${assignments.length} assignments, ${flashcards.length} flashcards`);

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        play: {
          id: play.id,
          name: play.name,
          shortName: play.short_name,
          formationName: play.formation_name,
          concept: play.concept,
          playType: play.play_type,
          contentStatus: play.content_status,
          isArchived: play.is_archived,
          aiInsights: play.ai_insights,
          createdAt: play.created_at,
          updatedAt: play.updated_at,
          unit: play.unit,
          playbookSection: play.playbook_section,
          primaryClassification: play.primary_classification,
          situation: play.situation,
          metadata: play.player_playbook_metadata,
          diagram_data: play.diagram_data, // Include diagram data for PlayBuilder-created plays
        },
        assignments,
        flashcards,
      }),
    };
  } catch (error) {
    console.error('Error fetching player play:', error);
    return formatErrorResponse(error);
  }
});

export { handler };
