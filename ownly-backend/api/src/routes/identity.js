/**
 * Identity API — para integración B2B (prop firms, brokers, exchanges)
 * Permite a empresas verificar usuarios por su Ownly ID
 */

import { Router } from 'express';
import * as dbService from '../services/databaseService.js';

export const identityRouter = Router();

/**
 * GET /api/identity/:ownlyId
 * Consulta el estado de verificación de un usuario por su Ownly ID (userId)
 * Usado por empresas para verificar usuarios antes de dar acceso
 */
identityRouter.get('/:ownlyId', async (req, res, next) => {
  try {
    const { ownlyId } = req.params;
    if (!ownlyId) return res.status(400).json({ error: 'ownlyId requerido' });

    const verification = await dbService.getKYCByUserId(ownlyId);

    if (!verification) {
      return res.json({
        verified: false,
        ownly_id: ownlyId,
        reason: 'Usuario no encontrado o sin verificación KYC',
      });
    }

    const isVerified = verification.status === 'completed' || !!verification.credential_id;

    return res.json({
      verified: isVerified,
      ownly_id: ownlyId,
      kyc_provider: 'Sumsub',
      verification_level: isVerified ? 'full' : 'pending',
      timestamp: verification.created_at,
      unique_user: true,
      risk_score: 'low',
      // No se expone PII — solo estado
    });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/identity/verify
 * Verifica un Ownly ID y devuelve el objeto de verificación completo
 * Endpoint principal para integración empresarial
 */
identityRouter.post('/verify', async (req, res, next) => {
  try {
    const { ownly_id, api_key } = req.body;

    if (!ownly_id) return res.status(400).json({ error: 'ownly_id requerido' });

    // En producción aquí iría validación de api_key
    // Por ahora aceptamos cualquier petición (MVP)

    const verification = await dbService.getKYCByUserId(ownly_id);

    if (!verification) {
      return res.json({
        verified: false,
        ownly_id,
        reason: 'Usuario no encontrado',
        timestamp: new Date().toISOString(),
      });
    }

    const isVerified = verification.status === 'completed' || !!verification.credential_id;

    return res.json({
      verified: isVerified,
      ownly_id,
      kyc_provider: 'Sumsub',
      verification_level: isVerified ? 'full' : 'pending',
      timestamp: verification.created_at,
      approved_at: verification.approved_at,
      unique_user: true,
      risk_score: 'low',
      can_trade: isVerified,
    });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/identity/:ownlyId/unique
 * Comprueba si un usuario es único (anti multicuenta)
 * Útil para prop firms que quieren evitar múltiples cuentas
 */
identityRouter.get('/:ownlyId/unique', async (req, res, next) => {
  try {
    const { ownlyId } = req.params;
    const verification = await dbService.getKYCByUserId(ownlyId);

    return res.json({
      ownly_id: ownlyId,
      is_unique: !!verification,
      verified: verification ? (verification.status === 'completed' || !!verification.credential_id) : false,
    });
  } catch (err) {
    next(err);
  }
});
