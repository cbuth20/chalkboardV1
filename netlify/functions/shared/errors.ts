/**
 * Custom Error Classes
 * Standardized error handling for API endpoints
 */

export class ApiError extends Error {
  constructor(
    public statusCode: number,
    message: string,
    public code?: string
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export class ValidationError extends ApiError {
  constructor(message: string, public field?: string) {
    super(400, message, 'VALIDATION_ERROR');
    this.name = 'ValidationError';
  }
}

export class AuthError extends ApiError {
  constructor(message: string = 'Authentication required') {
    super(401, message, 'AUTH_ERROR');
    this.name = 'AuthError';
  }
}

export class ForbiddenError extends ApiError {
  constructor(message: string = 'Insufficient permissions') {
    super(403, message, 'FORBIDDEN');
    this.name = 'ForbiddenError';
  }
}

export class NotFoundError extends ApiError {
  constructor(resource: string = 'Resource') {
    super(404, `${resource} not found`, 'NOT_FOUND');
    this.name = 'NotFoundError';
  }
}

export class ConflictError extends ApiError {
  constructor(message: string) {
    super(409, message, 'CONFLICT');
    this.name = 'ConflictError';
  }
}

/**
 * Format error response for API
 */
export function formatErrorResponse(error: unknown) {
  if (error instanceof ApiError) {
    return {
      statusCode: error.statusCode,
      body: JSON.stringify({
        error: error.message,
        code: error.code,
        ...(error instanceof ValidationError && error.field ? { field: error.field } : {}),
      }),
      headers: { 'Content-Type': 'application/json' },
    };
  }

  // Generic error
  console.error('Unexpected error:', error);
  return {
    statusCode: 500,
    body: JSON.stringify({
      error: 'Internal server error',
      code: 'INTERNAL_ERROR',
      message: error instanceof Error ? error.message : 'Unknown error',
    }),
    headers: { 'Content-Type': 'application/json' },
  };
}
