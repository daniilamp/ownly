/**
 * Error Handler Middleware
 * Handles all errors including RBAC-specific errors
 */

// RBAC Error Codes
export const RBAC_ERROR_CODES = {
  MISSING_AUTH: { status: 401, message: 'No authentication credentials provided' },
  INVALID_AUTH: { status: 401, message: 'Invalid authentication credentials' },
  MISSING_ROLE: { status: 403, message: 'User has no role assigned' },
  INSUFFICIENT_ROLE: { status: 403, message: 'User role lacks required permissions' },
  ROLE_VALIDATION_FAILED: { status: 403, message: 'Role validation process failed' },
  INVALID_ROLE: { status: 400, message: 'Attempted to assign invalid role' },
  ROLE_CHANGE_DENIED: { status: 403, message: 'User not authorized to change roles' },
};

/**
 * Create RBAC error
 * @param {string} code - Error code from RBAC_ERROR_CODES
 * @param {Object} details - Additional error details
 * @returns {Error} Error object with RBAC properties
 */
export function createRBACError(code, details = {}) {
  const errorConfig = RBAC_ERROR_CODES[code];
  if (!errorConfig) {
    throw new Error(`Unknown RBAC error code: ${code}`);
  }

  const error = new Error(errorConfig.message);
  error.code = code;
  error.status = errorConfig.status;
  error.details = details;
  error.isRBACError = true;
  return error;
}

/**
 * Main error handler
 */
export function errorHandler(err, req, res, _next) {
  // Log error
  console.error("[error]", {
    message: err.message,
    code: err.code,
    path: req.path,
    method: req.method,
    userId: req.user?.userId || req.user?.id,
  });

  // Handle RBAC errors
  if (err.isRBACError) {
    return res.status(err.status).json({
      error: err.message,
      code: err.code,
      details: err.details,
      timestamp: new Date().toISOString(),
    });
  }

  // Handle known error codes
  if (err.code && RBAC_ERROR_CODES[err.code]) {
    const errorConfig = RBAC_ERROR_CODES[err.code];
    return res.status(errorConfig.status).json({
      error: errorConfig.message,
      code: err.code,
      details: err.details || {},
      timestamp: new Date().toISOString(),
    });
  }

  // Handle validation errors (from zod or similar)
  if (err.name === 'ValidationError' || err.name === 'ZodError') {
    return res.status(400).json({
      error: 'Validation error',
      code: 'VALIDATION_ERROR',
      details: err.errors || err.issues || {},
      timestamp: new Date().toISOString(),
    });
  }

  // Default error response
  res.status(err.status || 500).json({
    error: err.message || "Internal server error",
    code: err.code || 'INTERNAL_ERROR',
    // Never expose stack traces in production
    ...(process.env.NODE_ENV === "development" && { detail: err.stack }),
    timestamp: new Date().toISOString(),
  });
}
