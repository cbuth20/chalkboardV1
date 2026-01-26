/**
 * GET /api/plays/:id
 * Get single play with assignments and flashcards
 * Auth: Player+ (if published), Coach/Admin (all)
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
      .from('plays')
      .select(`
        *,
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
      .eq('id', playId)
      .single();

    if (playError || !play) {
      throw new NotFoundError('Play');
    }

    // Verify access: play must belong to user's org
    if (play.org_id !== user.orgId) {
      throw new ForbiddenError('Access denied to this play');
    }

    // If player, verify play is published and approved
    if (user.role === 'player' && (!play.is_published || play.content_status !== 'approved')) {
      throw new ForbiddenError('This play is not available');
    }

    // Fetch assignments if requested
    let assignments = [];
    if (includeAssignments) {
      const { data: assignmentData, error: assignmentError } = await supabase
        .from('play_assignments')
        .select('*')
        .eq('play_id', playId)
        .order('position', { ascending: true });

      if (assignmentError) {
        console.warn('Failed to fetch assignments:', assignmentError);
      } else {
        assignments = assignmentData || [];
      }
    }

    // Fetch flashcards if requested
    let flashcards = [];
    if (includeFlashcards) {
      let flashcardsQuery = supabase
        .from('flashcard_templates')
        .select('*')
        .eq('play_id', playId)
        .eq('is_active', true)
        .order('category', { ascending: true })
        .order('difficulty', { ascending: true });

      // Filter by position if provided
      if (position) {
        flashcardsQuery = flashcardsQuery.eq('position', position.toUpperCase());
      }

      const { data: flashcardData, error: flashcardError } = await flashcardsQuery;

      if (flashcardError) {
        console.warn('Failed to fetch flashcards:', flashcardError);
      } else {
        flashcards = flashcardData || [];
      }
    }

    console.log(`✅ Fetched play ${playId} with ${assignments.length} assignments, ${flashcards.length} flashcards`);

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
          isPublished: play.is_published,
          aiInsights: play.ai_insights,
          createdAt: play.created_at,
          updatedAt: play.updated_at,
          metadata: play.playbook_metadata,
        },
        assignments,
        flashcards,
      }),
    };
  } catch (error) {
    console.error('Error fetching play:', error);
    return formatErrorResponse(error);
  }
});

export { handler };
