/**
 * Standard error codes for API responses
 */
export const ErrorCodes = {
  // Authentication errors
  AUTH_REQUIRED: 'AUTH_REQUIRED',
  TOKEN_EXPIRED: 'TOKEN_EXPIRED',
  TOKEN_INVALID: 'TOKEN_INVALID',
  INVALID_CREDENTIALS: 'INVALID_CREDENTIALS',

  // Validation errors
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  MISSING_FIELD: 'MISSING_FIELD',
  INVALID_FORMAT: 'INVALID_FORMAT',

  // Resource errors
  NOT_FOUND: 'NOT_FOUND',
  CONFLICT: 'CONFLICT',

  // Server errors
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  DATABASE_ERROR: 'DATABASE_ERROR',

  // Rate limiting
  RATE_LIMITED: 'RATE_LIMITED',
};

/**
 * Creates a standardized error response object
 * @param {string} error - Human-readable error type
 * @param {string} code - Machine-readable error code from ErrorCodes
 * @param {string} message - User-friendly error message
 * @param {object} [details] - Optional additional error details
 * @returns {object} Standardized error response
 */
export const createErrorResponse = (error, code, message, details = null) => {
  const response = {
    error,
    code,
    message,
  };

  if (details) {
    response.details = details;
  }

  return response;
};

/**
 * Common error responses for reuse
 */
export const CommonErrors = {
  unauthorized: (message = 'Authentication required') =>
    createErrorResponse('Unauthorized', ErrorCodes.AUTH_REQUIRED, message),

  tokenExpired: () =>
    createErrorResponse('Session expired', ErrorCodes.TOKEN_EXPIRED, 'Your session has expired. Please log in again.'),

  tokenInvalid: () =>
    createErrorResponse('Invalid token', ErrorCodes.TOKEN_INVALID, 'Your authentication token is invalid. Please log in again.'),

  invalidCredentials: () =>
    createErrorResponse('Authentication failed', ErrorCodes.INVALID_CREDENTIALS, 'Invalid email or password. Please check your credentials and try again.'),

  validationError: (message, details = null) =>
    createErrorResponse('Validation error', ErrorCodes.VALIDATION_ERROR, message, details),

  notFound: (resource = 'Resource') =>
    createErrorResponse('Not found', ErrorCodes.NOT_FOUND, `${resource} not found. It may have been deleted or moved.`),

  conflict: (message) =>
    createErrorResponse('Conflict', ErrorCodes.CONFLICT, message),

  internalError: (operation = 'complete the request') =>
    createErrorResponse('Server error', ErrorCodes.INTERNAL_ERROR, `Unable to ${operation}. Please try again later.`),

  databaseError: (operation = 'access data') =>
    createErrorResponse('Database error', ErrorCodes.DATABASE_ERROR, `Unable to ${operation}. Please try again later.`),
};

/**
 * Express middleware for handling errors consistently
 */
export const errorHandler = (err, req, res, next) => {
  console.error(`[${new Date().toISOString()}] Error:`, err.message);

  // Don't log stack traces for expected errors
  if (err.status >= 500) {
    console.error(err.stack);
  }

  const status = err.status || 500;
  const response = err.response || CommonErrors.internalError();

  res.status(status).json(response);
};

export default {
  ErrorCodes,
  createErrorResponse,
  CommonErrors,
  errorHandler,
};
