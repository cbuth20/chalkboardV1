/**
 * PATCH /api/plays/:id
 * Update play metadata and classification
 * Auth: Coach/Admin
 */

import { Handler } from '@netlify/functions';
import { withOrgAuth, getAuthenticatedUser } from './shared/auth';
import { getSupabaseAdmin } from './shared/supabase';
import { formatErrorResponse, NotFoundError, ForbiddenError, ValidationError } from './shared/errors';
import { validateUUID, validateEnum } from './shared/validators';

interface UpdatePlayRequest {
  name?: string;
  shortName?: string;
  playType?: 'PASS' | 'RUN' | 'RPO' | 'SCREEN';
  formationName?: string;
  concept?: string;
  // v1 Classification fields
  unit?: 'O' | 'D' | 'ST';
  playbookSection?: string;
  primaryClassification?: string;
  situation?: string;
}

const handler: Handler = withOrgAuth('coach')(async (event, context) => {
  if (event.httpMethod !== 'PATCH') {
    return {
      statusCode: 405,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Method not allowed' }),
    };
  }

  try {
    const user = getAuthenticatedUser(event);
    const supabase = getSupabaseAdmin();

    // Get play ID from path (last segment)
    const pathParts = event.path.split('/').filter(p => p);
    const playId = pathParts[pathParts.length - 1];
    validateUUID(playId, 'playId');

    // Parse request body
    const body: UpdatePlayRequest = JSON.parse(event.body || '{}');

    // Validate at least one field is provided
    if (Object.keys(body).length === 0) {
      throw new ValidationError('Must provide at least one field to update');
    }

    // Validate playType if provided
    if (body.playType) {
      validateEnum(body.playType, ['PASS', 'RUN', 'RPO', 'SCREEN'], 'playType');
    }

    // Validate unit if provided
    if (body.unit) {
      validateEnum(body.unit, ['O', 'D', 'ST'], 'unit');
    }

    // Fetch play to verify ownership
    const { data: play, error: playError } = await supabase
      .from('plays')
      .select('id, org_id')
      .eq('id', playId)
      .single();

    if (playError || !play) {
      throw new NotFoundError('Play');
    }

    // Verify play belongs to user's org
    if (play.org_id !== user.orgId) {
      throw new ForbiddenError('Access denied to this play');
    }

    // Build update object
    const updates: any = {};
    if (body.name !== undefined) updates.name = body.name;
    if (body.shortName !== undefined) updates.short_name = body.shortName;
    if (body.playType !== undefined) updates.play_type = body.playType;
    if (body.formationName !== undefined) updates.formation_name = body.formationName;
    if (body.concept !== undefined) updates.concept = body.concept;
    if (body.unit !== undefined) updates.unit = body.unit;
    if (body.playbookSection !== undefined) updates.playbook_section = body.playbookSection;
    if (body.primaryClassification !== undefined) updates.primary_classification = body.primaryClassification;
    if (body.situation !== undefined) updates.situation = body.situation;

    // Update play
    const { data: updatedPlay, error: updateError } = await supabase
      .from('plays')
      .update(updates)
      .eq('id', playId)
      .select()
      .single();

    if (updateError) {
      throw new Error(`Failed to update play: ${updateError.message}`);
    }

    console.log(`✅ Play ${playId} updated by user ${user.userId}`);

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        success: true,
        play: {
          id: updatedPlay.id,
          name: updatedPlay.name,
          shortName: updatedPlay.short_name,
          formationName: updatedPlay.formation_name,
          concept: updatedPlay.concept,
          playType: updatedPlay.play_type,
          unit: updatedPlay.unit,
          playbookSection: updatedPlay.playbook_section,
          primaryClassification: updatedPlay.primary_classification,
          situation: updatedPlay.situation,
        },
      }),
    };
  } catch (error) {
    console.error('Error updating play:', error);
    return formatErrorResponse(error);
  }
});

export { handler };
