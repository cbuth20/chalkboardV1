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
