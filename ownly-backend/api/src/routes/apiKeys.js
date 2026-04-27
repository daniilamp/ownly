/**
 * API Keys Management Routes
 * Admin endpoints for managing B2B API keys
 */

import { Router } from 'express';
import * as apiKeyService from '../services/apiKeyService.js';
import { verifyJWT } from '../middleware/authMiddleware.js';

export const apiKeysRouter = Router();

// All routes require JWT authentication
apiKeysRouter.use(verifyJWT);

/**
 * POST /api/api-keys/generate
 * Generate a new API key for a client
 * 
 * Body: {
 *   clientId: string,
 *   clientName: string,
 *   permissions?: string[],
 *   rateLimit?: number,
 *   description?: string,
 *   contactEmail?: string,
 *   expiresAt?: ISO string
 * }
 */
apiKeysRouter.post('/generate', async (req, res, next) => {
  try {
    const { clientId, clientName, permissions, rateLimit, description, contactEmail, expiresAt } = req.body;

    if (!clientId || !clientName) {
      return res.status(400).json({ error: 'clientId and clientName are required' });
    }

    const result = await apiKeyService.generateApiKey(clientId, clientName, {
      permissions,
      rateLimit,
      description,
      contactEmail,
      expiresAt,
    });

    return res.json({
      success: true,
      apiKey: result.apiKey,
      record: result.record,
      warning: 'Save this API key securely. You will not be able to see it again.',
    });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/api-keys/:apiKeyId
 * Get API key information (without exposing the key)
 */
apiKeysRouter.get('/:apiKeyId', async (req, res, next) => {
  try {
    const { apiKeyId } = req.params;
    const info = await apiKeyService.getApiKeyInfo(apiKeyId);
    return res.json(info);
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/api-keys/client/:clientId
 * List all API keys for a client
 */
apiKeysRouter.get('/client/:clientId', async (req, res, next) => {
  try {
    const { clientId } = req.params;
    const keys = await apiKeyService.listApiKeys(clientId);
    return res.json(keys);
  } catch (err) {
    next(err);
  }
});

/**
 * PUT /api/api-keys/:apiKeyId/permissions
 * Update API key permissions
 * 
 * Body: {
 *   permissions: string[]
 * }
 */
apiKeysRouter.put('/:apiKeyId/permissions', async (req, res, next) => {
  try {
    const { apiKeyId } = req.params;
    const { permissions } = req.body;

    if (!Array.isArray(permissions)) {
      return res.status(400).json({ error: 'permissions must be an array' });
    }

    const updated = await apiKeyService.updateApiKeyPermissions(apiKeyId, permissions);
    return res.json({ success: true, record: updated });
  } catch (err) {
    next(err);
  }
});

/**
 * DELETE /api/api-keys/:apiKeyId
 * Revoke an API key
 */
apiKeysRouter.delete('/:apiKeyId', async (req, res, next) => {
  try {
    const { apiKeyId } = req.params;
    await apiKeyService.revokeApiKey(apiKeyId);
    return res.json({ success: true, message: 'API key revoked' });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/api-keys/:apiKeyId/usage
 * Get API usage statistics
 * 
 * Query: days=30 (default)
 */
apiKeysRouter.get('/:apiKeyId/usage', async (req, res, next) => {
  try {
    const { apiKeyId } = req.params;
    const days = parseInt(req.query.days) || 30;
    const stats = await apiKeyService.getApiUsageStats(apiKeyId, days);
    return res.json(stats);
  } catch (err) {
    next(err);
  }
});
