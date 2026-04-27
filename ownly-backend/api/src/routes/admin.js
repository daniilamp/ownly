/**
 * Admin Routes
 * Administrative endpoints for system management
 * RBAC: Requires ADMIN role for all endpoints
 */

import { Router } from 'express';
import { z } from 'zod';
import * as adminService from '../services/adminService.js';
import { verifyJWT } from '../middleware/authMiddleware.js';
import { requireAdmin } from '../middleware/rbacMiddleware.js';

export const adminRouter = Router();

// Middleware: Require JWT authentication and ADMIN role for all admin endpoints
adminRouter.use(verifyJWT);
adminRouter.use(requireAdmin);

// ============================================
// USER MANAGEMENT ENDPOINTS
// ============================================

/**
 * GET /api/admin/users
 * List all users with optional filters
 * Query params: role, status, search, limit, offset
 */
adminRouter.get('/users', async (req, res, next) => {
  try {
    const { role, status, search, limit, offset } = req.query;

    const filters = {
      role,
      status,
      search,
      limit: limit ? parseInt(limit) : undefined,
      offset: offset ? parseInt(offset) : undefined,
    };

    const result = await adminService.listAllUsers(filters);

    return res.json({
      success: true,
      ...result,
    });
  } catch (err) {
    console.error('List users error:', err);
    next(err);
  }
});

/**
 * GET /api/admin/users/:userId
 * Get specific user details
 */
adminRouter.get('/users/:userId', async (req, res, next) => {
  try {
    const { userId } = req.params;

    const { getUserById } = await import('../services/userService.js');
    const user = await getUserById(userId);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    return res.json({
      success: true,
      user,
    });
  } catch (err) {
    console.error('Get user error:', err);
    next(err);
  }
});

/**
 * PUT /api/admin/users/:userId/role
 * Change user role
 * Body: { role, reason }
 */
const ChangeRoleSchema = z.object({
  role: z.enum(['user', 'business', 'admin']),
  reason: z.string().min(1),
});

adminRouter.put('/users/:userId/role', async (req, res, next) => {
  try {
    const { userId } = req.params;
    const parsed = ChangeRoleSchema.safeParse(req.body);

    if (!parsed.success) {
      return res.status(400).json({
        error: 'Invalid request',
        details: parsed.error.flatten(),
      });
    }

    const { role, reason } = parsed.data;
    const adminId = req.user.userId || req.user.id;

    const updatedUser = await adminService.updateUserRole(userId, role, adminId, reason);

    return res.json({
      success: true,
      user: updatedUser,
      message: `User role changed to ${role}`,
    });
  } catch (err) {
    console.error('Change user role error:', err);
    next(err);
  }
});

/**
 * PUT /api/admin/users/:userId/status
 * Activate or deactivate user
 * Body: { status, reason }
 */
const ChangeStatusSchema = z.object({
  status: z.enum(['active', 'inactive', 'suspended']),
  reason: z.string().optional(),
});

adminRouter.put('/users/:userId/status', async (req, res, next) => {
  try {
    const { userId } = req.params;
    const parsed = ChangeStatusSchema.safeParse(req.body);

    if (!parsed.success) {
      return res.status(400).json({
        error: 'Invalid request',
        details: parsed.error.flatten(),
      });
    }

    const { status, reason } = parsed.data;
    const adminId = req.user.userId || req.user.id;

    let updatedUser;
    if (status === 'inactive') {
      updatedUser = await adminService.deactivateUser(userId, adminId, reason || 'Deactivated by admin');
    } else if (status === 'active') {
      updatedUser = await adminService.reactivateUser(userId, adminId);
    } else {
      // For suspended status, use updateUser directly
      const { updateUser } = await import('../services/userService.js');
      updatedUser = await updateUser(userId, { status });
    }

    return res.json({
      success: true,
      user: updatedUser,
      message: `User status changed to ${status}`,
    });
  } catch (err) {
    console.error('Change user status error:', err);
    next(err);
  }
});

// ============================================
// API KEY MANAGEMENT ENDPOINTS
// ============================================

/**
 * GET /api/admin/api-keys
 * List all API keys
 * Query params: status, userId, limit
 */
adminRouter.get('/api-keys', async (req, res, next) => {
  try {
    const { status, userId, limit } = req.query;

    const filters = {
      status,
      userId,
      limit: limit ? parseInt(limit) : undefined,
    };

    const apiKeys = await adminService.listAllApiKeys(filters);

    return res.json({
      success: true,
      apiKeys,
      count: apiKeys.length,
    });
  } catch (err) {
    console.error('List API keys error:', err);
    next(err);
  }
});

/**
 * DELETE /api/admin/api-keys/:apiKeyId
 * Revoke API key
 * Body: { reason }
 */
const RevokeApiKeySchema = z.object({
  reason: z.string().min(1),
});

adminRouter.delete('/api-keys/:apiKeyId', async (req, res, next) => {
  try {
    const { apiKeyId } = req.params;
    const parsed = RevokeApiKeySchema.safeParse(req.body);

    if (!parsed.success) {
      return res.status(400).json({
        error: 'Invalid request',
        details: parsed.error.flatten(),
      });
    }

    const { reason } = parsed.data;
    const adminId = req.user.userId || req.user.id;

    const revokedKey = await adminService.revokeApiKey(apiKeyId, adminId, reason);

    return res.json({
      success: true,
      apiKey: revokedKey,
      message: 'API key revoked successfully',
    });
  } catch (err) {
    console.error('Revoke API key error:', err);
    next(err);
  }
});

// ============================================
// AUDIT LOG ENDPOINTS
// ============================================

/**
 * GET /api/admin/logs/access
 * Get access control logs
 * Query params: userId, accessGranted, endpoint, startDate, endDate, limit
 */
adminRouter.get('/logs/access', async (req, res, next) => {
  try {
    const { userId, accessGranted, endpoint, startDate, endDate, limit } = req.query;

    const filters = {
      userId,
      accessGranted: accessGranted !== undefined ? accessGranted === 'true' : undefined,
      endpoint,
      startDate,
      endDate,
      limit: limit ? parseInt(limit) : undefined,
    };

    const logs = await adminService.getAccessControlLogs(filters);

    return res.json({
      success: true,
      logs,
      count: logs.length,
    });
  } catch (err) {
    console.error('Get access logs error:', err);
    next(err);
  }
});

/**
 * GET /api/admin/logs/role-changes
 * Get role change logs
 * Query params: userId, changedBy, limit
 */
adminRouter.get('/logs/role-changes', async (req, res, next) => {
  try {
    const { userId, changedBy, limit } = req.query;

    const filters = {
      userId,
      changedBy,
      limit: limit ? parseInt(limit) : undefined,
    };

    const logs = await adminService.getRoleChangeLogs(filters);

    return res.json({
      success: true,
      logs,
      count: logs.length,
    });
  } catch (err) {
    console.error('Get role change logs error:', err);
    next(err);
  }
});

/**
 * GET /api/admin/logs/security
 * Get security events (denied access attempts)
 * Query params: userId, endpoint, startDate, endDate, limit
 */
adminRouter.get('/logs/security', async (req, res, next) => {
  try {
    const { userId, endpoint, startDate, endDate, limit } = req.query;

    const filters = {
      userId,
      endpoint,
      startDate,
      endDate,
      limit: limit ? parseInt(limit) : undefined,
    };

    const events = await adminService.getSecurityEvents(filters);

    return res.json({
      success: true,
      events,
      count: events.length,
    });
  } catch (err) {
    console.error('Get security events error:', err);
    next(err);
  }
});

// ============================================
// STATISTICS ENDPOINTS
// ============================================

/**
 * GET /api/admin/stats/users
 * Get user statistics
 */
adminRouter.get('/stats/users', async (req, res, next) => {
  try {
    const stats = await adminService.getUserStatistics();

    return res.json({
      success: true,
      stats,
    });
  } catch (err) {
    console.error('Get user stats error:', err);
    next(err);
  }
});

/**
 * GET /api/admin/stats/api-usage
 * Get API usage statistics
 */
adminRouter.get('/stats/api-usage', async (req, res, next) => {
  try {
    const stats = await adminService.getApiUsageStatistics();

    return res.json({
      success: true,
      stats,
    });
  } catch (err) {
    console.error('Get API usage stats error:', err);
    next(err);
  }
});

/**
 * GET /api/admin/health
 * Get system health status
 */
adminRouter.get('/health', async (req, res, next) => {
  try {
    const health = await adminService.getSystemHealth();

    return res.json({
      success: true,
      health,
    });
  } catch (err) {
    console.error('Get system health error:', err);
    next(err);
  }
});

/**
 * GET /api/admin/security/summary
 * Get security events summary
 * Query: hours=24 (default)
 */
adminRouter.get('/security/summary', async (req, res, next) => {
  try {
    const { getSecuritySummary } = await import('../services/securityMonitor.js');
    const hours = parseInt(req.query.hours) || 24;
    const summary = await getSecuritySummary(hours);

    return res.json({
      success: true,
      summary,
    });
  } catch (err) {
    console.error('Get security summary error:', err);
    next(err);
  }
});

export default adminRouter;
