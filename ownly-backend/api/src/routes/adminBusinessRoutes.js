/**
 * Admin Business Application Routes
 * Endpoints for managing business applications (list, view, approve, reject)
 * RBAC: Requires ADMIN role for all endpoints
 */

import { Router } from 'express';
import { verifyJWT } from '../middleware/authMiddleware.js';
import { requireAdmin } from '../middleware/rbacMiddleware.js';
import {
  listApplications,
  getApplicationById,
  approveApplication,
  rejectApplication,
} from '../services/businessApplicationService.js';
import {
  sendApprovalEmail,
  sendRejectionEmail,
} from '../services/businessNotificationService.js';

export const adminBusinessRouter = Router();

// Middleware: Require JWT authentication and ADMIN role for all endpoints
adminBusinessRouter.use(verifyJWT);
adminBusinessRouter.use(requireAdmin);

// ============================================
// BUSINESS APPLICATION MANAGEMENT ENDPOINTS
// ============================================

/**
 * GET /api/admin/business-applications
 * List all business applications with optional status filter
 * Query params: status (pending | approved | rejected), limit
 */
adminBusinessRouter.get('/', async (req, res, next) => {
  try {
    const { status, limit } = req.query;

    const filters = {
      status: status || undefined,
      limit: limit ? parseInt(limit) : undefined,
    };

    const { applications } = await listApplications(filters);

    return res.json({
      success: true,
      applications,
      count: applications.length,
    });
  } catch (err) {
    console.error('List business applications error:', err);
    next(err);
  }
});

/**
 * GET /api/admin/business-applications/:id
 * Get full application details by ID
 */
adminBusinessRouter.get('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;

    const { application } = await getApplicationById(id);

    return res.json({
      success: true,
      application,
    });
  } catch (err) {
    if (err.status === 404) {
      return res.status(404).json({
        error: err.message,
        code: err.code || 'APPLICATION_NOT_FOUND',
      });
    }
    console.error('Get business application error:', err);
    next(err);
  }
});

/**
 * POST /api/admin/business-applications/:id/approve
 * Approve a pending business application
 * Creates a user account with Business role and sends approval email
 */
adminBusinessRouter.post('/:id/approve', async (req, res, next) => {
  try {
    const { id } = req.params;
    const reviewerId = req.user.userId || req.user.id;

    const { application, user } = await approveApplication(id, reviewerId);

    // Fire-and-forget: send approval email
    const loginUrl = process.env.FRONTEND_URL
      ? `${process.env.FRONTEND_URL}/business/dashboard`
      : 'http://localhost:5173/business/dashboard';

    sendApprovalEmail(application, loginUrl).catch((emailErr) => {
      console.error('Failed to send approval email (non-blocking):', emailErr.message);
    });

    return res.json({
      success: true,
      application,
      user,
      message: 'Application approved successfully',
    });
  } catch (err) {
    if (err.status === 404) {
      return res.status(404).json({
        error: err.message,
        code: err.code || 'APPLICATION_NOT_FOUND',
      });
    }
    if (err.status === 409) {
      return res.status(409).json({
        error: err.message,
        code: err.code || 'INVALID_STATUS_TRANSITION',
      });
    }
    console.error('Approve business application error:', err);
    next(err);
  }
});

/**
 * POST /api/admin/business-applications/:id/reject
 * Reject a pending business application
 * Body: { reason: string }
 */
adminBusinessRouter.post('/:id/reject', async (req, res, next) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    const reviewerId = req.user.userId || req.user.id;

    // Validate rejection reason is provided
    if (!reason || reason.trim().length === 0) {
      return res.status(400).json({
        error: 'Rejection reason is required',
        code: 'MISSING_REASON',
      });
    }

    const { application } = await rejectApplication(id, reviewerId, reason);

    // Fire-and-forget: send rejection email
    sendRejectionEmail(application, reason).catch((emailErr) => {
      console.error('Failed to send rejection email (non-blocking):', emailErr.message);
    });

    return res.json({
      success: true,
      application,
      message: 'Application rejected',
    });
  } catch (err) {
    if (err.status === 404) {
      return res.status(404).json({
        error: err.message,
        code: err.code || 'APPLICATION_NOT_FOUND',
      });
    }
    if (err.status === 409) {
      return res.status(409).json({
        error: err.message,
        code: err.code || 'INVALID_STATUS_TRANSITION',
      });
    }
    if (err.status === 400) {
      return res.status(400).json({
        error: err.message,
        code: err.code || 'MISSING_REASON',
      });
    }
    console.error('Reject business application error:', err);
    next(err);
  }
});

export default adminBusinessRouter;
