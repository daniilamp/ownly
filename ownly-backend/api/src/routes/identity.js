/**
 * Identity API — para integración B2B (prop firms, brokers, exchanges)
 * Permite a empresas verificar usuarios por su Ownly ID
 * 
 * SEGURIDAD: Todos los endpoints requieren autenticación (API Key) y rol BUSINESS o ADMIN
 * RESPUESTA: Datos seguros sin exponer PII o detalles internos
 */

import { Router } from 'express';
import * as dbService from '../services/databaseService.js';
import { verifyApiKey, requirePermission } from '../middleware/authMiddleware.js';
import { requireBusiness } from '../middleware/rbacMiddleware.js';
import * as apiKeyService from '../services/apiKeyService.js';

export const identityRouter = Router();

// Middleware: Require API key and BUSINESS or ADMIN role for all identity endpoints
identityRouter.use(verifyApiKey);
identityRouter.use(requireBusiness);

/**
 * GET /api/identity/:ownlyId
 * Consulta el estado de verificación de un usuario por su Ownly ID (userId)
 * Si no encuentra por Ownly ID, intenta buscar por email (fallback)
 * 
 * REQUIERE: API Key con permiso 'verify:read'
 * 
 * Respuesta segura (sin exponer datos sensibles):
 * {
 *   verified: boolean,
 *   verification_level: 'full' | 'pending' | 'rejected' | 'none',
 *   risk_score: 'low' | 'medium' | 'high' | 'unknown',
 *   timestamp: ISO string,
 *   unique_user: boolean
 * }
 */
identityRouter.get('/:ownlyId', requirePermission('verify:read'), async (req, res, next) => {
  try {
    const { ownlyId } = req.params;
    if (!ownlyId) return res.status(400).json({ error: 'ownlyId requerido' });

    // Primero intenta buscar por Ownly ID
    let verification = await dbService.getKYCByUserId(ownlyId);

    // Si no encuentra, intenta buscar por email (fallback)
    if (!verification && ownlyId.includes('@')) {
      verification = await dbService.getKYCByEmail(ownlyId);
    }

    if (!verification) {
      return res.json({
        verified: false,
        verification_level: 'none',
        risk_score: 'unknown',
        timestamp: new Date().toISOString(),
        unique_user: false,
      });
    }

    const isVerified = verification.review_answer === 'GREEN' || verification.status === 'completed' || !!verification.credential_id;

    // Log API usage (non-blocking)
    apiKeyService.logApiUsage(req.apiKey.id, '/api/identity/:ownlyId', 'GET', 200, 0).catch(console.error);

    return res.json({
      verified: isVerified,
      verification_level: isVerified ? 'full' : (verification.status === 'pending' ? 'pending' : 'rejected'),
      risk_score: 'low',
      timestamp: verification.created_at,
      unique_user: true,
      // NO exponer: kyc_provider, PII, credenciales, detalles internos
    });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/identity/verify
 * Verifica un Ownly ID o email y devuelve el estado de verificación
 * Endpoint principal para integración empresarial
 * Soporta búsqueda por Ownly ID o email
 * 
 * REQUIERE: API Key con permiso 'verify:read'
 * 
 * Body: { ownly_id: string }
 */
identityRouter.post('/verify', requirePermission('verify:read'), async (req, res, next) => {
  try {
    const { ownly_id } = req.body;

    if (!ownly_id) return res.status(400).json({ error: 'ownly_id requerido' });

    // Primero intenta buscar por Ownly ID
    let verification = await dbService.getKYCByUserId(ownly_id);

    // Si no encuentra, intenta buscar por email (fallback)
    if (!verification && ownly_id.includes('@')) {
      verification = await dbService.getKYCByEmail(ownly_id);
    }

    if (!verification) {
      return res.json({
        verified: false,
        verification_level: 'none',
        risk_score: 'unknown',
        timestamp: new Date().toISOString(),
        unique_user: false,
        can_trade: false,
      });
    }

    const isVerified = verification.review_answer === 'GREEN' || verification.status === 'completed' || !!verification.credential_id;

    // Log API usage (non-blocking)
    apiKeyService.logApiUsage(req.apiKey.id, '/api/identity/verify', 'POST', 200, 0).catch(console.error);

    return res.json({
      verified: isVerified,
      verification_level: isVerified ? 'full' : (verification.status === 'pending' ? 'pending' : 'rejected'),
      risk_score: 'low',
      timestamp: verification.created_at,
      approved_at: verification.approved_at,
      unique_user: true,
      can_trade: isVerified,
      // NO exponer: kyc_provider, PII, credenciales, detalles internos
    });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/identity/:ownlyId/unique
 * Comprueba si un usuario es único (anti multicuenta)
 * Soporta búsqueda por Ownly ID o email
 * Útil para prop firms que quieren evitar múltiples cuentas
 * 
 * REQUIERE: API Key con permiso 'verify:read'
 */
identityRouter.get('/:ownlyId/unique', requirePermission('verify:read'), async (req, res, next) => {
  try {
    const { ownlyId } = req.params;
    
    // Primero intenta buscar por Ownly ID
    let verification = await dbService.getKYCByUserId(ownlyId);

    // Si no encuentra, intenta buscar por email (fallback)
    if (!verification && ownlyId.includes('@')) {
      verification = await dbService.getKYCByEmail(ownlyId);
    }

    // Log API usage (non-blocking)
    apiKeyService.logApiUsage(req.apiKey.id, '/api/identity/:ownlyId/unique', 'GET', 200, 0).catch(console.error);

    return res.json({
      is_unique: !!verification,
      verified: verification ? (verification.review_answer === 'GREEN' || verification.status === 'completed' || !!verification.credential_id) : false,
    });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/identity/email/:email
 * Busca verificación por email directamente
 * Útil cuando se tiene el email pero no el Ownly ID
 * 
 * REQUIERE: API Key con permiso 'verify:read'
 */
identityRouter.get('/email/:email', requirePermission('verify:read'), async (req, res, next) => {
  try {
    const { email } = req.params;
    if (!email) return res.status(400).json({ error: 'Email requerido' });

    const verification = await dbService.getKYCByEmail(email);

    if (!verification) {
      return res.json({
        verified: false,
        verification_level: 'none',
        risk_score: 'unknown',
        timestamp: new Date().toISOString(),
        unique_user: false,
      });
    }

    const isVerified = verification.review_answer === 'GREEN' || verification.status === 'completed' || !!verification.credential_id;

    // Log API usage (non-blocking)
    apiKeyService.logApiUsage(req.apiKey.id, '/api/identity/email/:email', 'GET', 200, 0).catch(console.error);

    return res.json({
      verified: isVerified,
      verification_level: isVerified ? 'full' : (verification.status === 'pending' ? 'pending' : 'rejected'),
      risk_score: 'low',
      timestamp: verification.created_at,
      unique_user: true,
      // NO exponer: email, ownly_id, kyc_provider, PII
    });
  } catch (err) {
    next(err);
  }
});
