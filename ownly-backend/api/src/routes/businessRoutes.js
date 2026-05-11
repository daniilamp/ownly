/**
 * Business Routes — Registration and business portal endpoints
 * Prefix: /api/business
 */

import { Router } from 'express';
import {
  validateRegistration,
  createApplication,
  getApplicationByEmail,
} from '../services/businessApplicationService.js';
import {
  sendConfirmationEmail,
  notifyAdminsNewApplication,
} from '../services/businessNotificationService.js';
import {
  generateBusinessKey,
  regenerateKey,
  revokeKey,
  getKeyMetadata,
} from '../services/apiKeyService.js';
import {
  getUsageStats,
  getTimeSeriesData,
  getEndpointBreakdown,
  getResponseTimeAverage,
} from '../services/usageStatsService.js';
import { verifyJWT } from '../middleware/authMiddleware.js';
import { requireBusiness } from '../middleware/rbacMiddleware.js';

export const businessRouter = Router();

// ── POST /api/business/register ───────────────────────────────────────────────
// Public endpoint — no auth required
businessRouter.post('/register', async (req, res, next) => {
  try {
    // 1. Validate input
    const { valid, errors } = validateRegistration(req.body);

    if (!valid) {
      return res.status(400).json({
        error: 'Validation failed',
        code: 'VALIDATION_ERROR',
        details: errors,
      });
    }

    // 2. Create the application
    const { application } = await createApplication(req.body);

    // 3. Fire-and-forget: send confirmation email and notify admins
    sendConfirmationEmail(application).catch((err) => {
      console.error('[BUSINESS REGISTER] Confirmation email error:', err.message);
    });
    notifyAdminsNewApplication(application).catch((err) => {
      console.error('[BUSINESS REGISTER] Admin notification error:', err.message);
    });

    // 4. Return success (exclude sensitive/internal fields)
    const { reviewed_by, reviewed_at, rejection_reason, ...publicData } = application;

    return res.status(201).json(publicData);
  } catch (err) {
    // Handle duplicate application (409)
    if (err.status === 409) {
      return res.status(409).json({
        error: err.message,
        code: err.code || 'DUPLICATE_APPLICATION',
        details: {},
      });
    }

    next(err);
  }
});

// ══════════════════════════════════════════════════════════════════════════════
// AUTHENTICATED ENDPOINTS — Require JWT + Business role
// ══════════════════════════════════════════════════════════════════════════════

// ── GET /api/business/application/status ──────────────────────────────────────
// Returns the authenticated user's own application status
businessRouter.get('/application/status', verifyJWT, requireBusiness, async (req, res, next) => {
  try {
    const email = req.user.email;
    const { application } = await getApplicationByEmail(email);

    if (!application) {
      return res.status(404).json({
        error: 'No application found for this account',
        code: 'APPLICATION_NOT_FOUND',
      });
    }

    // Return public fields only
    const { reviewed_by, ...publicData } = application;

    return res.status(200).json(publicData);
  } catch (err) {
    next(err);
  }
});

// ── GET /api/business/dashboard ───────────────────────────────────────────────
// Returns summary data: key status, recent usage, quick links
businessRouter.get('/dashboard', verifyJWT, requireBusiness, async (req, res, next) => {
  try {
    const userId = req.user.userId || req.user.id;

    // 1. Get API key metadata
    const keys = await getKeyMetadata(userId);
    const activeKey = keys.find((k) => k.status === 'active') || null;

    // 2. Get recent usage stats (last 30 days) if there's an active key
    let recentUsage = { totalRequests: 0, successCount: 0, errorCount: 0 };
    let avgResponseTime = { avgMs: 0 };

    if (activeKey) {
      // Find the actual key ID from the database for usage queries
      recentUsage = await getUsageStats(activeKey.id, {});
      avgResponseTime = await getResponseTimeAverage(activeKey.id, {});
    }

    // 3. Build dashboard response
    return res.status(200).json({
      keyStatus: activeKey
        ? { hasActiveKey: true, maskedKey: activeKey.maskedKey, createdAt: activeKey.createdAt, lastUsedAt: activeKey.lastUsedAt }
        : { hasActiveKey: false },
      recentUsage: {
        totalRequests: recentUsage.totalRequests,
        successCount: recentUsage.successCount,
        errorCount: recentUsage.errorCount,
        avgResponseTimeMs: avgResponseTime.avgMs,
      },
      quickLinks: [
        { label: 'API Documentation', path: '/business/docs' },
        { label: 'API Key Management', path: '/business/api-keys' },
        { label: 'Usage Statistics', path: '/business/usage' },
      ],
    });
  } catch (err) {
    next(err);
  }
});

// ── POST /api/business/api-keys/generate ──────────────────────────────────────
// Generates a new API key, returns plaintext once
businessRouter.post('/api-keys/generate', verifyJWT, requireBusiness, async (req, res, next) => {
  try {
    const userId = req.user.userId || req.user.id;
    const clientName = req.body.clientName || req.user.email;

    const { apiKey, record } = await generateBusinessKey(userId, clientName);

    return res.status(201).json({
      apiKey, // Plaintext — shown only once
      keyId: record.id,
      clientName: record.client_name,
      permissions: record.permissions,
      status: record.status,
      createdAt: record.created_at,
      warning: 'Save this API key securely. It will not be shown again.',
    });
  } catch (err) {
    return res.status(500).json({
      error: 'Failed to generate API key. Please retry.',
      code: 'KEY_GENERATION_FAILED',
    });
  }
});

// ── POST /api/business/api-keys/regenerate ────────────────────────────────────
// Regenerates key with confirmation check
businessRouter.post('/api-keys/regenerate', verifyJWT, requireBusiness, async (req, res, next) => {
  try {
    const userId = req.user.userId || req.user.id;
    const { apiKeyId, confirm } = req.body;

    if (!apiKeyId) {
      return res.status(400).json({
        error: 'apiKeyId is required',
        code: 'VALIDATION_ERROR',
      });
    }

    if (!confirm) {
      return res.status(400).json({
        error: 'Confirmation required. Set confirm: true to proceed.',
        code: 'CONFIRMATION_REQUIRED',
      });
    }

    const { apiKey, record } = await regenerateKey(apiKeyId, userId);

    return res.status(200).json({
      apiKey, // Plaintext — shown only once
      keyId: record.id,
      clientName: record.client_name,
      permissions: record.permissions,
      status: record.status,
      createdAt: record.created_at,
      warning: 'Save this new API key securely. The old key has been revoked.',
    });
  } catch (err) {
    if (err.message.includes('not found') || err.message.includes('access denied')) {
      return res.status(404).json({
        error: 'API key not found',
        code: 'KEY_NOT_FOUND',
      });
    }
    if (err.message.includes('revoked')) {
      return res.status(409).json({
        error: 'This API key has already been revoked',
        code: 'KEY_ALREADY_REVOKED',
      });
    }
    next(err);
  }
});

// ── POST /api/business/api-keys/revoke ────────────────────────────────────────
// Revokes active key
businessRouter.post('/api-keys/revoke', verifyJWT, requireBusiness, async (req, res, next) => {
  try {
    const userId = req.user.userId || req.user.id;
    const { apiKeyId } = req.body;

    if (!apiKeyId) {
      return res.status(400).json({
        error: 'apiKeyId is required',
        code: 'VALIDATION_ERROR',
      });
    }

    await revokeKey(apiKeyId, userId);

    return res.status(200).json({
      success: true,
      message: 'API key has been revoked successfully.',
    });
  } catch (err) {
    if (err.message.includes('not found') || err.message.includes('access denied')) {
      return res.status(404).json({
        error: 'API key not found',
        code: 'KEY_NOT_FOUND',
      });
    }
    if (err.message.includes('already revoked')) {
      return res.status(409).json({
        error: 'This API key has already been revoked',
        code: 'KEY_ALREADY_REVOKED',
      });
    }
    next(err);
  }
});

// ── GET /api/business/api-keys ────────────────────────────────────────────────
// Returns masked key metadata
businessRouter.get('/api-keys', verifyJWT, requireBusiness, async (req, res, next) => {
  try {
    const userId = req.user.userId || req.user.id;
    const keys = await getKeyMetadata(userId);

    return res.status(200).json({ keys });
  } catch (err) {
    next(err);
  }
});

// ── GET /api/business/usage ───────────────────────────────────────────────────
// Returns usage statistics with optional date range query params
businessRouter.get('/usage', verifyJWT, requireBusiness, async (req, res, next) => {
  try {
    const userId = req.user.userId || req.user.id;
    const { start, end } = req.query;

    // Get user's active key(s)
    const keys = await getKeyMetadata(userId);
    const activeKey = keys.find((k) => k.status === 'active');

    if (!activeKey) {
      return res.status(200).json({
        stats: { totalRequests: 0, successCount: 0, errorCount: 0 },
        timeSeries: { series: [] },
        endpointBreakdown: { breakdown: {} },
        avgResponseTime: { avgMs: 0 },
      });
    }

    const dateOptions = {};
    if (start) dateOptions.startDate = start;
    if (end) dateOptions.endDate = end;

    // Fetch all usage data in parallel
    const [stats, timeSeries, endpointBreakdown, avgResponseTime] = await Promise.all([
      getUsageStats(activeKey.id, dateOptions),
      getTimeSeriesData(activeKey.id, 30),
      getEndpointBreakdown(activeKey.id, dateOptions),
      getResponseTimeAverage(activeKey.id, dateOptions),
    ]);

    return res.status(200).json({
      stats,
      timeSeries,
      endpointBreakdown,
      avgResponseTime,
    });
  } catch (err) {
    next(err);
  }
});
