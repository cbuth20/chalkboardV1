/**
 * Request Validators
 * Validate and sanitize API request data
 */

import { ValidationError } from './errors';

/**
 * Validate UUID format
 */
export function validateUUID(value: string, fieldName: string = 'id'): string {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(value)) {
    throw new ValidationError(`Invalid UUID format for ${fieldName}`, fieldName);
  }
  return value;
}

/**
 * Validate required field exists
 */
export function validateRequired<T>(value: T | undefined | null, fieldName: string): T {
  if (value === undefined || value === null || value === '') {
    throw new ValidationError(`${fieldName} is required`, fieldName);
  }
  return value;
}

/**
 * Validate enum value
 */
export function validateEnum<T extends string>(
  value: string,
  allowedValues: readonly T[],
  fieldName: string
): T {
  if (!allowedValues.includes(value as T)) {
    throw new ValidationError(
      `${fieldName} must be one of: ${allowedValues.join(', ')}`,
      fieldName
    );
  }
  return value as T;
}

/**
 * Validate number is positive
 */
export function validatePositiveNumber(value: number, fieldName: string): number {
  if (value <= 0) {
    throw new ValidationError(`${fieldName} must be a positive number`, fieldName);
  }
  return value;
}

/**
 * Validate number is in range
 */
export function validateRange(
  value: number,
  min: number,
  max: number,
  fieldName: string
): number {
  if (value < min || value > max) {
    throw new ValidationError(`${fieldName} must be between ${min} and ${max}`, fieldName);
  }
  return value;
}

/**
 * Validate array is not empty
 */
export function validateNonEmptyArray<T>(value: T[], fieldName: string): T[] {
  if (!Array.isArray(value) || value.length === 0) {
    throw new ValidationError(`${fieldName} must be a non-empty array`, fieldName);
  }
  return value;
}

/**
 * Validate date is in future
 */
export function validateFutureDate(value: string | Date, fieldName: string): Date {
  const date = typeof value === 'string' ? new Date(value) : value;
  if (isNaN(date.getTime())) {
    throw new ValidationError(`${fieldName} must be a valid date`, fieldName);
  }
  if (date < new Date()) {
    throw new ValidationError(`${fieldName} must be in the future`, fieldName);
  }
  return date;
}

/**
 * Validate quiz assignment target (only one should be set)
 */
export function validateQuizTarget(data: {
  assignedToUserId?: string;
  assignedToPosition?: string;
  assignedToSegmentId?: string;
  assignedToTeamId?: string;
}): void {
  const targets = [
    data.assignedToUserId,
    data.assignedToPosition,
    data.assignedToSegmentId,
    data.assignedToTeamId,
  ];
  const setTargets = targets.filter((t) => t !== undefined && t !== null);

  if (setTargets.length === 0) {
    throw new ValidationError(
      'Must specify one target: assignedToUserId, assignedToPosition, assignedToSegmentId, or assignedToTeamId'
    );
  }

  if (setTargets.length > 1) {
    throw new ValidationError('Can only specify one assignment target');
  }
}

/**
 * Sanitize string input (trim, max length)
 */
export function sanitizeString(value: string, maxLength: number = 1000): string {
  return value.trim().substring(0, maxLength);
}
