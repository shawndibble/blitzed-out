/**
 * Standardized error types for the application
 */

export class AppError extends Error {
  constructor(
    message: string,
    public code?: string,
    public cause?: Error
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export class AuthError extends AppError {
  constructor(message: string, code?: string, cause?: Error) {
    super(message, code, cause);
    this.name = 'AuthError';
  }
}

export class NetworkError extends AppError {
  constructor(message: string, code?: string, cause?: Error) {
    super(message, code, cause);
    this.name = 'NetworkError';
  }
}

export class ValidationError extends AppError {
  constructor(
    message: string,
    public field?: string,
    cause?: Error
  ) {
    super(message, 'VALIDATION_ERROR', cause);
    this.name = 'ValidationError';
  }
}

export class SyncError extends AppError {
  constructor(message: string, code?: string, cause?: Error) {
    super(message, code, cause);
    this.name = 'SyncError';
  }
}

/**
 * Type guard to check if an error is an instance of AppError
 */
export function isAppError(error: unknown): error is AppError {
  return error instanceof AppError;
}

/**
 * Type guard to check if an error is a standard Error
 */
export function isError(error: unknown): error is Error {
  return error instanceof Error;
}

/**
 * Safely extracts error message from unknown error type
 */
export function getErrorMessage(error: unknown): string {
  if (isError(error)) {
    return error.message;
  }
  if (typeof error === 'string') {
    return error;
  }
  return 'An unknown error occurred';
}

/**
 * Safely extracts error code from unknown error type
 */
export function getErrorCode(error: unknown): string | undefined {
  if (isAppError(error)) {
    return error.code;
  }
  if (isError(error) && 'code' in error) {
    return (error as Error & { code?: string }).code;
  }
  return undefined;
}

/**
 * Creates a standardized error from an unknown error type
 */
export function createStandardError(
  error: unknown,
  defaultMessage = 'An unexpected error occurred'
): AppError {
  if (isAppError(error)) {
    return error;
  }

  if (isError(error)) {
    return new AppError(error.message || defaultMessage, undefined, error);
  }

  if (typeof error === 'string') {
    return new AppError(error);
  }

  return new AppError(defaultMessage);
}

/**
 * Firebase error code mappings to user-friendly messages
 */
export const FIREBASE_ERROR_MESSAGES: Record<string, string> = {
  'auth/user-not-found': 'No account found with this email address',
  'auth/wrong-password': 'Incorrect password',
  'auth/email-already-in-use': 'An account with this email already exists',
  'auth/weak-password': 'Password is too weak',
  'auth/invalid-email': 'Invalid email address',
  'auth/too-many-requests': 'Too many login attempts. Please try again later',
  'auth/network-request-failed': 'Network error. Please check your connection',
  'permission-denied': 'You do not have permission to perform this action',
  unavailable: 'Service is temporarily unavailable. Please try again',
};

/**
 * Converts Firebase error to user-friendly message
 */
export function getFirebaseErrorMessage(error: unknown): string {
  const code = getErrorCode(error);
  if (code && FIREBASE_ERROR_MESSAGES[code]) {
    return FIREBASE_ERROR_MESSAGES[code];
  }
  return getErrorMessage(error);
}
