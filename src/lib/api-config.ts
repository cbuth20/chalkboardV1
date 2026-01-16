// Utility to determine the correct API endpoint based on environment

export function getPlaybooksApiUrl(): string {
  // Check if we're running on localhost
  if (typeof window !== 'undefined') {
    const isLocalhost = window.location.hostname === 'localhost' ||
                       window.location.hostname === '127.0.0.1';

    if (isLocalhost) {
      return '/api/playbooks';
    }
  }

  // Use Netlify functions for production
  return '/.netlify/functions/playbooks';
}

export function getAnalyzePlaysApiUrl(): string {
  // Check if we're running on localhost
  if (typeof window !== 'undefined') {
    const isLocalhost = window.location.hostname === 'localhost' ||
                       window.location.hostname === '127.0.0.1';

    if (isLocalhost) {
      return '/api/analyze-plays';
    }
  }

  // Use Netlify functions for production
  return '/.netlify/functions/analyze-plays';
}

export function getPlaybookMetadataApiUrl(): string {
  // Check if we're running on localhost
  if (typeof window !== 'undefined') {
    const isLocalhost = window.location.hostname === 'localhost' ||
                       window.location.hostname === '127.0.0.1';

    if (isLocalhost) {
      return '/api/playbook-metadata';
    }
  }

  // Use Netlify functions for production
  return '/.netlify/functions/playbook-metadata';
}

export function getGenerateInsightsApiUrl(): string {
  // Check if we're running on localhost
  if (typeof window !== 'undefined') {
    const isLocalhost = window.location.hostname === 'localhost' ||
                       window.location.hostname === '127.0.0.1';

    if (isLocalhost) {
      return '/api/generate-insights';
    }
  }

  // Use Netlify functions for production
  return '/.netlify/functions/generate-insights';
}

export function getCreatePlayRecordApiUrl(): string {
  // Check if we're running on localhost
  if (typeof window !== 'undefined') {
    const isLocalhost = window.location.hostname === 'localhost' ||
                       window.location.hostname === '127.0.0.1';

    if (isLocalhost) {
      return '/api/generate-play-content'; // Local dev uses the all-in-one function
    }
  }

  // Use Netlify function to create play record
  return '/.netlify/functions/create-play-record';
}

export function getProcessPlayContentApiUrl(): string {
  // Check if we're running on localhost
  if (typeof window !== 'undefined') {
    const isLocalhost = window.location.hostname === 'localhost' ||
                       window.location.hostname === '127.0.0.1';

    if (isLocalhost) {
      return '/api/generate-play-content'; // Local dev doesn't need this
    }
  }

  // Use Netlify background function to process play
  return '/.netlify/functions/process-play-content-background';
}

export function getCheckPlayStatusApiUrl(): string {
  // Check if we're running on localhost
  if (typeof window !== 'undefined') {
    const isLocalhost = window.location.hostname === 'localhost' ||
                       window.location.hostname === '127.0.0.1';

    if (isLocalhost) {
      return '/api/check-play-status';
    }
  }

  // Use Netlify function for production
  return '/.netlify/functions/check-play-status';
}

export function getReviewPlayContentApiUrl(): string {
  // Check if we're running on localhost
  if (typeof window !== 'undefined') {
    const isLocalhost = window.location.hostname === 'localhost' ||
                       window.location.hostname === '127.0.0.1';

    if (isLocalhost) {
      return '/api/review-play-content';
    }
  }

  // Use Netlify functions for production
  return '/.netlify/functions/review-play-content';
}

export function getApprovedPlaysApiUrl(): string {
  // Check if we're running on localhost
  if (typeof window !== 'undefined') {
    const isLocalhost = window.location.hostname === 'localhost' ||
                       window.location.hostname === '127.0.0.1';

    if (isLocalhost) {
      return '/api/get-approved-plays';
    }
  }

  // Use Netlify functions for production
  return '/.netlify/functions/get-approved-plays';
}

export function getClearPlayContentApiUrl(): string {
  // Check if we're running on localhost
  if (typeof window !== 'undefined') {
    const isLocalhost = window.location.hostname === 'localhost' ||
                       window.location.hostname === '127.0.0.1';

    if (isLocalhost) {
      return '/api/playbooks/clear-content';
    }
  }

  // Use Netlify functions for production
  return '/.netlify/functions/playbooks-clear-content';
}
