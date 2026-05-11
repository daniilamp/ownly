/**
 * Credentials API Routes
 * Dedicated endpoints for credential lifecycle management
 * 
 * Separate from credentials.js (which handles ZK proof inputs).
 * This router handles: list, get, verify, retry
 */

import { Router } from 'express';
import * as credentialService from '../services/credentialService.js';
import * as blockchainService from '../services/blockchainService.js';
import { supabase } from '../services/databaseService.js';
import { verifyJWT } from '../middleware/authMiddleware.js';
import { requireUser, requireAdmin } from '../middleware/rbacMiddleware.js';

export const credentialsApiRouter = Router();

// ============================================
// PUBLIC ENDPOINTS (no auth required)
// ============================================

/**
 * POST /api/credentials/verify
 * Verify a credential's validity (public endpoint)
 * 
 * Body: { credentialId, txHash? }
 * Returns: { verified, status, reason, blockNumber?, expiresAt }
 */
credentialsApiRouter.post('/verify', async (req, res, next) => {
  try {
    const { credentialId, txHash } = req.body;

    if (!credentialId) {
      return res.status(400).json({ error: 'credentialId is required' });
    }

    // Fetch credential from database
    const { data: credential, error } = await supabase
      .from('credentials')
      .select('*')
      .eq('id', credentialId)
      .single();

    if (error || !credential) {
      return res.json({
        verified: false,
        status: 'not_found',
        reason: 'Credential not found',
      });
    }

    // Check if revoked
    if (credential.status === 'revoked') {
      return res.json({
        verified: false,
        status: 'revoked',
        reason: 'Credential has been revoked',
        credentialId,
      });
    }

    // Check if expired
    if (credential.expires_at && new Date(credential.expires_at) < new Date()) {
      return res.json({
        verified: false,
        status: 'expired',
        reason: 'Credential has expired',
        credentialId,
        expiresAt: credential.expires_at,
      });
    }

    // Check if published
    if (credential.status !== 'published') {
      return res.json({
        verified: false,
        status: credential.status,
        reason: `Credential is in "${credential.status}" state, not yet published to blockchain`,
        credentialId,
      });
    }

    // If txHash provided, verify on blockchain
    let blockchainVerification = null;
    const effectiveTxHash = txHash || credential.blockchain_tx_hash;

    if (effectiveTxHash) {
      try {
        if (!await blockchainService.isBlockchainConnected()) {
          await blockchainService.initializeBlockchain();
        }

        const provider = (await import('ethers')).ethers;
        // Use a simple receipt check
        const rpcUrl = process.env.RPC_URL || process.env.POLYGON_RPC_URL || 'https://rpc-amoy.polygon.technology';
        const rpcProvider = new provider.JsonRpcProvider(rpcUrl);
        const receipt = await rpcProvider.getTransactionReceipt(effectiveTxHash);

        if (receipt && receipt.status === 1) {
          blockchainVerification = {
            confirmed: true,
            blockNumber: receipt.blockNumber,
            txHash: effectiveTxHash,
          };
        } else if (receipt && receipt.status === 0) {
          blockchainVerification = {
            confirmed: false,
            reason: 'Transaction failed on-chain',
          };
        } else {
          blockchainVerification = {
            confirmed: false,
            reason: 'Transaction receipt not found',
          };
        }
      } catch (blockchainErr) {
        console.warn('[verify] Blockchain check failed:', blockchainErr.message);
        blockchainVerification = {
          confirmed: false,
          reason: 'Blockchain verification unavailable',
        };
      }
    }

    return res.json({
      verified: true,
      status: 'published',
      credentialId,
      type: credential.credential_type || credential.type,
      expiresAt: credential.expires_at,
      issuedAt: credential.created_at,
      blockchainTxHash: credential.blockchain_tx_hash,
      blockchain: blockchainVerification,
    });
  } catch (err) {
    console.error('Credential verify error:', err);
    next(err);
  }
});

// ============================================
// PROTECTED ENDPOINTS (require auth)
// ============================================

/**
 * GET /api/credentials/user/:userId
 * Get all credentials for a user
 * 
 * Returns: { credentials: [...], total }
 */
credentialsApiRouter.get('/user/:userId', verifyJWT, requireUser, async (req, res, next) => {
  try {
    const { userId } = req.params;

    const { data: credentials, error } = await supabase
      .from('credentials')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching credentials:', error);
      return res.status(500).json({ error: 'Failed to fetch credentials' });
    }

    // Transform to safe response (no internal fields)
    const safeCredentials = (credentials || []).map(cred => ({
      id: cred.id,
      type: cred.credential_type || cred.type || 'identity_verified',
      status: cred.status,
      blockchainTxHash: cred.blockchain_tx_hash,
      blockchainAddress: cred.blockchain_address,
      expiresAt: cred.expires_at,
      createdAt: cred.created_at,
      credentialData: cred.credential_data,
    }));

    return res.json({
      success: true,
      credentials: safeCredentials,
      total: safeCredentials.length,
    });
  } catch (err) {
    console.error('Get user credentials error:', err);
    next(err);
  }
});

/**
 * GET /api/credentials/:credentialId
 * Get a single credential by ID
 * 
 * Returns: { credential: { ... } }
 */
credentialsApiRouter.get('/:credentialId', verifyJWT, requireUser, async (req, res, next) => {
  try {
    const { credentialId } = req.params;

    // Avoid matching other routes like /user/:userId or /verify
    if (credentialId === 'verify' || credentialId === 'user') {
      return next();
    }

    const { data: credential, error } = await supabase
      .from('credentials')
      .select('*')
      .eq('id', credentialId)
      .single();

    if (error || !credential) {
      return res.status(404).json({ error: 'Credential not found' });
    }

    return res.json({
      success: true,
      credential: {
        id: credential.id,
        userId: credential.user_id,
        kycId: credential.kyc_id,
        type: credential.credential_type || credential.type || 'identity_verified',
        status: credential.status,
        blockchainTxHash: credential.blockchain_tx_hash,
        blockchainAddress: credential.blockchain_address,
        expiresAt: credential.expires_at,
        createdAt: credential.created_at,
        credentialData: credential.credential_data,
        retryCount: credential.retry_count,
        lastError: credential.last_error,
      },
    });
  } catch (err) {
    console.error('Get credential error:', err);
    next(err);
  }
});

/**
 * POST /api/credentials/retry/:credentialId
 * Retry blockchain publishing for a failed credential (admin only)
 * 
 * Returns: { success, txHash } or { error }
 */
credentialsApiRouter.post('/retry/:credentialId', verifyJWT, requireAdmin, async (req, res, next) => {
  try {
    const { credentialId } = req.params;

    // Fetch credential
    const { data: credential, error } = await supabase
      .from('credentials')
      .select('*')
      .eq('id', credentialId)
      .single();

    if (error || !credential) {
      return res.status(404).json({ error: 'Credential not found' });
    }

    // Only retry failed or pending credentials
    if (!['failed', 'pending', 'permanently_failed'].includes(credential.status)) {
      return res.status(400).json({
        error: `Cannot retry credential with status "${credential.status}". Only failed/pending credentials can be retried.`,
      });
    }

    // Attempt blockchain publishing
    try {
      if (!await blockchainService.isBlockchainConnected()) {
        await blockchainService.initializeBlockchain();
      }

      const blockchainResult = await blockchainService.publishCredential(credential);

      // Update credential status
      await supabase
        .from('credentials')
        .update({
          status: 'published',
          blockchain_tx_hash: blockchainResult.txHash,
          last_error: null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', credentialId);

      console.log(`[retry] Credential ${credentialId} published: ${blockchainResult.txHash}`);

      return res.json({
        success: true,
        credentialId,
        txHash: blockchainResult.txHash,
        blockNumber: blockchainResult.blockNumber,
        message: 'Credential successfully published to blockchain',
      });
    } catch (publishErr) {
      // Update error info
      await supabase
        .from('credentials')
        .update({
          last_error: publishErr.message,
          retry_count: (credential.retry_count || 0) + 1,
          updated_at: new Date().toISOString(),
        })
        .eq('id', credentialId);

      return res.status(500).json({
        error: 'Blockchain publishing failed',
        details: publishErr.message,
        retryCount: (credential.retry_count || 0) + 1,
      });
    }
  } catch (err) {
    console.error('Retry credential error:', err);
    next(err);
  }
});

export default credentialsApiRouter;
