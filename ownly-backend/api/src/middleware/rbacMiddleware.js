/**
 * RBAC Middleware
 * Role-Based Access Control middleware for enforcing permissions
 */

import { getUserRole, getUserById, getUserBySupabaseId } from '../services/userService.js';
import { supabase } from '../services/databaseService.js';
import { checkAndAlertIfSuspicious } from '../services/securityMonitor.js';

/**
 * Role Permission Matrix
 * Defines which roles can access which endpoint categories
 */
export const ROLE_PERMISSIONS = {
  // KYC endpoints - USER and ADMIN only
  kyc: ['user', 'admin'],
  
  // Document endpoints - USER and ADMIN only
  documents: ['user', 'admin'],
  
  // Identity verification endpoints - BUSINESS and ADMIN only
  identity: ['business', 'admin'],
  
  // Verifier endpoints - BUSINESS and ADMIN only
  verify: ['business', 'admin'],
  
  // Admin endpoints - ADMIN only
  admin: ['admin'],
  
  // Access management - All roles
  access: ['user', 'business', 'admin'],
};

/**
 * Get user role from database
 * @param {string} userId - User ID
 * @returns {Promise<string|null>} User role or null if not found
 */
export async function getUserRoleFromDB(userId) {
  try {
    const role = await getUserRole(userId);
    return role;
  } catch (error) {
    console.error('Error getting user role:', error);
    return null;
  }
}

/**
 * Enrich request with user role
 * Fetches user role from database and attaches to request object
 * @param {Object} req - Express request object
 * @returns {Promise<void>}
 */
export async function enrichRequestWithRole(req) {
  // Skip if no user or apiKey attached
  if (!req.user && !req.apiKey) {
    return;
  }

  try {
    let userId = null;
    let userRecord = null;

    // For JWT authenticated users
    if (req.user && req.user.id) {
      // Try to find user by Supabase ID
      userRecord = await getUserBySupabaseId(req.user.id);
      
      // If not found by Supabase ID, try by email
      if (!userRecord && req.user.email) {
        const { getUserByEmail } = await import('../services/userService.js');
        userRecord = await getUserByEmail(req.user.email);
      }
    }

    // For API key authenticated users
    if (req.apiKey && req.apiKey.userId) {
      userRecord = await getUserById(req.apiKey.userId);
    }

    // Attach role to request
    if (userRecord) {
      if (req.user) {
        req.user.role = userRecord.role;
        req.user.userId = userRecord.id;
      }
      if (req.apiKey) {
        req.apiKey.role = userRecord.role;
        req.apiKey.userId = userRecord.id;
      }
    } else {
      // Default to 'user' role if no record found (backward compatibility)
      const defaultRole = 'user';
      if (req.user) {
        req.user.role = defaultRole;
      }
      if (req.apiKey) {
        req.apiKey.role = defaultRole;
      }
    }
  } catch (error) {
    console.error('Error enriching request with role:', error);
    // Don't throw - let the request continue with default role
  }
}

/**
 * Require specific role(s) middleware factory
 * Creates middleware that checks if user has one of the allowed roles
 * @param {string[]} allowedRoles - Array of allowed roles
 * @returns {Function} Express middleware function
 */
export function requireRole(allowedRoles) {
  return async (req, res, next) => {
    try {
      // Get user role from request
      let userRole = null;
      let userId = null;

      if (req.user) {
        userRole = req.user.role;
        userId = req.user.userId || req.user.id;
      } else if (req.apiKey) {
        userRole = req.apiKey.role;
        userId = req.apiKey.userId;
      }

      // If no role found, deny access
      if (!userRole) {
        await logAccessAttempt(
          userId,
          'unknown',
          req.path,
          req.method,
          false,
          'No role found',
          req
        );
        
        return res.status(403).json({
          error: 'Access denied',
          code: 'MISSING_ROLE',
          details: {
            requiredRole: allowedRoles,
            endpoint: req.path,
          },
        });
      }

      // Check if user role is in allowed roles
      if (!allowedRoles.includes(userRole)) {
        await logAccessAttempt(
          userId,
          userRole,
          req.path,
          req.method,
          false,
          `Insufficient role: required ${allowedRoles.join(' or ')}, has ${userRole}`,
          req
        );

        // Check for suspicious activity (non-blocking)
        const userObj = req.user || req.apiKey;
        checkAndAlertIfSuspicious(userObj, req.path).catch(console.error);
        
        return res.status(403).json({
          error: 'Access denied',
          code: 'INSUFFICIENT_ROLE',
          details: {
            requiredRole: allowedRoles,
            userRole: userRole,
            endpoint: req.path,
          },
        });
      }

      // Access granted - log and continue
      await logAccessAttempt(
        userId,
        userRole,
        req.path,
        req.method,
        true,
        'Access granted',
        req
      );

      next();
    } catch (error) {
      console.error('RBAC middleware error:', error);
      
      return res.status(500).json({
        error: 'Authorization check failed',
        code: 'ROLE_VALIDATION_FAILED',
      });
    }
  };
}

/**
 * Check if user has specific role
 * @param {Object} user - User object with role property
 * @param {string} role - Role to check
 * @returns {boolean} True if user has the role
 */
export function hasRole(user, role) {
  if (!user || !user.role) {
    return false;
  }
  return user.role === role;
}

/**
 * Check if user has any of the specified roles
 * @param {Object} user - User object with role property
 * @param {string[]} roles - Array of roles to check
 * @returns {boolean} True if user has any of the roles
 */
export function hasAnyRole(user, roles) {
  if (!user || !user.role) {
    return false;
  }
  return roles.includes(user.role);
}

/**
 * Check if user has permission for a resource
 * @param {Object} user - User object with role property
 * @param {string} permission - Permission key (e.g., 'kyc', 'documents', 'admin')
 * @returns {boolean} True if user has permission
 */
export function hasPermission(user, permission) {
  if (!user || !user.role) {
    return false;
  }
  
  const allowedRoles = ROLE_PERMISSIONS[permission];
  if (!allowedRoles) {
    return false;
  }
  
  return allowedRoles.includes(user.role);
}

/**
 * Log access attempt to database
 * @param {string} userId - User ID
 * @param {string} userRole - User role
 * @param {string} endpoint - Endpoint path
 * @param {string} method - HTTP method
 * @param {boolean} accessGranted - Whether access was granted
 * @param {string} reason - Reason for decision
 * @param {Object} req - Express request object
 * @returns {Promise<void>}
 */
export async function logAccessAttempt(userId, userRole, endpoint, method, accessGranted, reason, req) {
  try {
    // Extract IP and user agent
    const ipAddress = req.ip || req.connection?.remoteAddress || 'unknown';
    const userAgent = req.get('user-agent') || 'unknown';

    await supabase
      .from('access_control_log')
      .insert({
        user_id: userId || null,
        user_role: userRole,
        endpoint: endpoint,
        method: method,
        access_granted: accessGranted,
        reason: reason,
        ip_address: ipAddress,
        user_agent: userAgent,
      });
  } catch (error) {
    console.error('Error logging access attempt:', error);
    // Don't throw - logging failure shouldn't block the request
  }
}

/**
 * Get access logs with optional filters
 * @param {Object} [filters] - Optional filters
 * @param {string} [filters.userId] - Filter by user ID
 * @param {boolean} [filters.accessGranted] - Filter by access granted/denied
 * @param {string} [filters.endpoint] - Filter by endpoint
 * @param {number} [filters.limit=100] - Maximum number of results
 * @returns {Promise<Array>} Array of access log entries
 */
export async function getAccessLogs(filters = {}) {
  const { userId, accessGranted, endpoint, limit = 100 } = filters;

  let query = supabase
    .from('access_control_log')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit);

  if (userId) {
    query = query.eq('user_id', userId);
  }

  if (typeof accessGranted === 'boolean') {
    query = query.eq('access_granted', accessGranted);
  }

  if (endpoint) {
    query = query.eq('endpoint', endpoint);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Database error getting access logs:', error);
    throw new Error('Failed to get access logs');
  }

  return data || [];
}

/**
 * Middleware to require admin role
 * Convenience wrapper for requireRole(['admin'])
 */
export const requireAdmin = requireRole(['admin']);

/**
 * Middleware to require business or admin role
 * Convenience wrapper for requireRole(['business', 'admin'])
 */
export const requireBusiness = requireRole(['business', 'admin']);

/**
 * Middleware to require user or admin role
 * Convenience wrapper for requireRole(['user', 'admin'])
 */
export const requireUser = requireRole(['user', 'admin']);
