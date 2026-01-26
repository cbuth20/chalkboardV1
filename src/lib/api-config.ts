// Utility to determine the correct API endpoint based on environment
// NOTE: Most play-related APIs have been migrated to Netlify functions with direct URLs
// See src/lib/api/plays.ts, flashcards.ts, and quizzes.ts for new API clients

/**
 * Get Playbooks API URL (file upload and listing)
 * Uses Netlify function for both local and production
 */
export function getPlaybooksApiUrl(): string {
  if (typeof window !== 'undefined') {
    const isLocalhost = window.location.hostname === 'localhost' ||
                       window.location.hostname === '127.0.0.1';

    if (isLocalhost) {
      return 'http://localhost:8888/.netlify/functions/playbooks';
    }
  }

  return '/.netlify/functions/playbooks';
}

/**
 * Get Analyze Plays API URL (play diagram analysis)
 * Uses Netlify function for both local and production
 */
export function getAnalyzePlaysApiUrl(): string {
  if (typeof window !== 'undefined') {
    const isLocalhost = window.location.hostname === 'localhost' ||
                       window.location.hostname === '127.0.0.1';

    if (isLocalhost) {
      return 'http://localhost:8888/.netlify/functions/analyze-plays';
    }
  }

  return '/.netlify/functions/analyze-plays';
}

/**
 * Get Playbook Metadata API URL
 * Legacy endpoint - still in use
 */
export function getPlaybookMetadataApiUrl(): string {
  if (typeof window !== 'undefined') {
    const isLocalhost = window.location.hostname === 'localhost' ||
                       window.location.hostname === '127.0.0.1';

    if (isLocalhost) {
      return '/api/playbook-metadata';
    }
  }

  return '/.netlify/functions/playbook-metadata';
}

/**
 * Get Generate Insights API URL
 * Legacy endpoint - still in use
 */
export function getGenerateInsightsApiUrl(): string {
  if (typeof window !== 'undefined') {
    const isLocalhost = window.location.hostname === 'localhost' ||
                       window.location.hostname === '127.0.0.1';

    if (isLocalhost) {
      return '/api/generate-insights';
    }
  }

  return '/.netlify/functions/generate-insights';
}

/**
 * Get Approved Plays API URL
 * @deprecated Use playsAPI.listPlays() and flashcardsAPI.listFlashcards() instead
 */
export function getApprovedPlaysApiUrl(): string {
  if (typeof window !== 'undefined') {
    const isLocalhost = window.location.hostname === 'localhost' ||
                       window.location.hostname === '127.0.0.1';

    if (isLocalhost) {
      return '/api/get-approved-plays';
    }
  }

  return '/.netlify/functions/get-approved-plays';
}

/**
 * Get Clear Play Content API URL
 * Legacy endpoint - still in use
 */
export function getClearPlayContentApiUrl(): string {
  if (typeof window !== 'undefined') {
    const isLocalhost = window.location.hostname === 'localhost' ||
                       window.location.hostname === '127.0.0.1';

    if (isLocalhost) {
      return '/api/playbooks/clear-content';
    }
  }

  return '/.netlify/functions/playbooks-clear-content';
}
