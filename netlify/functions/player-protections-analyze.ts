/**
 * POST /api/player-protections-analyze
 * Trigger analysis of uploaded PDFs to extract RB protection scenarios
 * Auth: Player (only access own content)
 */

import { Handler } from '@netlify/functions';
import { withOrgAuth, getAuthenticatedUser } from './shared/auth';
import { getSupabaseAdmin } from './shared/supabase';
import { formatErrorResponse, ValidationError } from './shared/errors';

const handler: Handler = withOrgAuth('player')(async (event, context) => {
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Method not allowed' }),
    };
  }

  try {
    const user = getAuthenticatedUser(event);
    const supabase = getSupabaseAdmin();

    // Fetch all PDF files for this user
    const { data: allFiles, error: filesError } = await supabase
      .from('player_playbook_metadata')
      .select('id, file_paths, note_type, tags, created_at')
      .eq('user_id', user.userId)
      .eq('org_id', user.orgId);

    if (filesError) {
      throw new Error(`Failed to fetch files: ${filesError.message}`);
    }

    // Filter for PDFs
    const pdfs = allFiles?.filter(file =>
      file.file_paths?.some((path: string) => path.toLowerCase().endsWith('.pdf'))
    ) || [];

    if (pdfs.length === 0) {
      throw new ValidationError('No PDF files found. Please upload playbook PDFs first.');
    }

    console.log(`📚 Found ${pdfs.length} PDFs for protection analysis`);

    // Check if there's already a processing analysis
    const { data: existingAnalysis } = await supabase
      .from('player_playbook_analysis')
      .select('id, status')
      .eq('user_id', user.userId)
      .eq('status', 'processing')
      .single();

    if (existingAnalysis) {
      throw new ValidationError('An analysis is already in progress. Please wait for it to complete.');
    }

    // Create analysis record
    const { data: analysis, error: analysisError } = await supabase
      .from('player_playbook_analysis')
      .insert({
        user_id: user.userId,
        org_id: user.orgId,
        pdf_count: pdfs.length,
        status: 'processing',
        started_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (analysisError || !analysis) {
      throw new Error(`Failed to create analysis record: ${analysisError?.message}`);
    }

    console.log(`🎯 Created analysis record ${analysis.id}`);

    // Call background processing function
    const backgroundFunctionUrl = `${event.headers.host?.includes('localhost') ? 'http' : 'https'}://${event.headers.host}/.netlify/functions/process-protection-analysis-background`;

    console.log(`🚀 Triggering background protection analysis for ${pdfs.length} PDFs`);

    // Fire-and-forget call to background function
    fetch(backgroundFunctionUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        analysisId: analysis.id,
        userId: user.userId,
        orgId: user.orgId,
        pdfIds: pdfs.map(p => p.id),
      }),
    }).catch((error) => {
      console.error('Failed to trigger background function:', error);
      supabase
        .from('player_playbook_analysis')
        .update({ status: 'failed', error_message: 'Failed to start background processing' })
        .eq('id', analysis.id)
        .then(() => console.log('Updated analysis status to failed'));
    });

    return {
      statusCode: 202,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        success: true,
        analysisId: analysis.id,
        status: 'processing',
        pdfCount: pdfs.length,
        estimatedDuration: `${Math.ceil(pdfs.length * 3)} minutes`,
        message: 'Protection analysis started. This may take several minutes.',
      }),
    };
  } catch (error) {
    console.error('Error triggering protection analysis:', error);
    return formatErrorResponse(error);
  }
});

export { handler };
