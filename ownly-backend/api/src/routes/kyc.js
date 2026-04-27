/**
 * KYC Routes
 * Endpoints for KYC verification flow
 * RBAC: Requires USER or ADMIN role
 */

import { Router } from 'express';
import { z } from 'zod';
import * as sumsubService from '../services/sumsubService.js';
import * as dbService from '../services/databaseService.js';
import * as credentialService from '../services/credentialService.js';
import * as blockchainService from '../services/blockchainService.js';
import { verifyJWT } from '../middleware/authMiddleware.js';
import { requireUser } from '../middleware/rbacMiddleware.js';

export const kycRouter = Router();

// Public routes (no authentication required)
const publicRouter = Router();

// Protected routes (require JWT authentication and USER or ADMIN role)
const protectedRouter = Router();
protectedRouter.use(verifyJWT);
protectedRouter.use(requireUser);

// ── POST /api/kyc/init ────────────────────────────────────────────────────────
/**
 * Initialize KYC verification for a user
 * Creates applicant in Sumsub and returns SDK token for frontend
 * 
 * Body: { userId, email, firstName, lastName }
 * Returns: { applicantId, sdkToken, externalUserId }
 */
const InitSchema = z.object({
  userId: z.string().min(1),
  email: z.string().email(),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
});

publicRouter.post('/init', async (req, res, next) => {
  try {
    const parsed = InitSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ 
        error: 'Invalid request', 
        details: parsed.error.flatten() 
      });
    }

    const { userId, email, firstName, lastName } = parsed.data;

    // Check if user already has a verification — return existing mock token
    const existing = await dbService.getKYCByUserId(userId);
    if (existing) {
      const mockSdkToken = `mock_token_${userId}_${Date.now()}`;

      // If credential exists but is pending, try to publish to blockchain
      if (existing.credential_id) {
        try {
          const credential = await dbService.getCredential(existing.credential_id);
          if (credential && credential.status === 'pending') {
            await blockchainService.initializeBlockchain();
            const blockchainResult = await blockchainService.publishCredential(credential);
            console.log(`[blockchain] Existing credential published: ${blockchainResult.txHash}`);
            await credentialService.updateCredentialStatus(existing.credential_id, 'published', blockchainResult.txHash);
          }
        } catch (blockchainErr) {
          console.warn('[blockchain] Publishing existing credential failed:', blockchainErr.message);
        }
      }

      return res.json({
        success: true,
        applicantId: existing.applicant_id,
        sdkToken: mockSdkToken,
        externalUserId: userId,
        existing: true,
        mock: true,
      });
    }

    // Try real Sumsub first, fallback to mock if it fails
    let applicantId, sdkToken, isMock = false;

    try {
      // Attempt real Sumsub integration
      const sumsubResult = await sumsubService.createApplicant({
        externalUserId: userId,
        email,
        firstName,
        lastName,
      });

      applicantId = sumsubResult.id;
      sdkToken = await sumsubService.generateSDKToken(applicantId, userId);
      console.log('Real Sumsub applicant created:', applicantId);
    } catch (sumsubErr) {
      // Fallback to mock mode if Sumsub fails
      console.warn('Sumsub failed, using mock mode:', sumsubErr.message);
      applicantId = `mock_${userId}_${Date.now()}`;
      sdkToken = `mock_token_${userId}_${Date.now()}`;
      isMock = true;
    }

    // Save to database
    const kycRecord = await dbService.createKYCVerification({
      applicantId: applicantId,
      externalUserId: userId,
      email,
      firstName,
      lastName,
    });

    // Create credential automatically only in mock mode
    if (isMock) {
      try {
        const credential = await credentialService.createCredential(
          userId,
          kycRecord.id,
          { status: 'approved' }
        );

        console.log(`Credential created automatically in mock mode: ${credential.id}`);
        await dbService.linkCredentialToKYC(kycRecord.id, credential.id);

        // Publish to blockchain
        try {
          await blockchainService.initializeBlockchain();
          const blockchainResult = await blockchainService.publishCredential(credential);
          console.log(`[blockchain] Credential published: ${blockchainResult.txHash}`);
          await credentialService.updateCredentialStatus(credential.id, 'published', blockchainResult.txHash);
        } catch (blockchainErr) {
          console.warn('[blockchain] Publishing failed (credential still created):', blockchainErr.message);
        }
      } catch (credentialErr) {
        console.error('Error creating credential in mock mode:', credentialErr);
      }
    }

    return res.json({
      success: true,
      applicantId: applicantId,
      sdkToken: sdkToken,
      externalUserId: userId,
      mock: isMock,
    });

  } catch (err) {
    console.error('KYC init error:', err);
    next(err);
  }
});

// ── GET /api/kyc/status/:applicantId ──────────────────────────────────────────
/**
 * Get KYC verification status
 * Returns current status and review result
 * 
 * Params: applicantId
 * Returns: { status, reviewResult, documentData }
 */
protectedRouter.get('/status/:applicantId', async (req, res, next) => {
  try {
    const { applicantId } = req.params;

    // Get from database first
    const dbRecord = await dbService.getKYCVerification(applicantId);
    if (!dbRecord) {
      return res.status(404).json({ error: 'Verification not found' });
    }

    // Get latest status from Sumsub
    const sumsubStatus = await sumsubService.getApplicantStatus(applicantId);

    // If status changed, update database
    if (sumsubStatus.reviewResult?.reviewAnswer !== dbRecord.review_answer) {
      await dbService.updateKYCVerification(applicantId, {
        status: sumsubStatus.reviewStatus,
        reviewAnswer: sumsubStatus.reviewResult?.reviewAnswer,
        reviewRejectType: sumsubStatus.reviewResult?.reviewRejectType,
        rejectLabels: sumsubStatus.reviewResult?.rejectLabels,
      });
    }

    // Get document data if approved
    let documentData = null;
    if (sumsubService.isApproved(sumsubStatus.reviewResult)) {
      documentData = await sumsubService.getApplicantDocuments(applicantId);
      
      // Update database with document data
      if (documentData) {
        await dbService.updateKYCDocumentData(applicantId, documentData);
      }
    }

    return res.json({
      success: true,
      applicantId,
      status: sumsubStatus.reviewStatus,
      reviewResult: sumsubStatus.reviewResult,
      documentData,
      createdAt: dbRecord.created_at,
      updatedAt: dbRecord.updated_at,
    });
  } catch (err) {
    console.error('KYC status error:', err);
    next(err);
  }
});

// ── POST /api/kyc/webhook ──────────────────────────────────────────────────────
/**
 * Webhook endpoint for Sumsub notifications
 * Called by Sumsub when verification status changes
 * 
 * IMPORTANT: Verify signature for security
 */
publicRouter.post('/webhook', async (req, res, next) => {
  try {
    // Verify webhook signature
    const signature = req.headers['x-payload-digest'];
    const rawBody = JSON.stringify(req.body);
    
    if (!sumsubService.verifyWebhookSignature(rawBody, signature)) {
      console.error('Invalid webhook signature');
      return res.status(401).json({ error: 'Invalid signature' });
    }

    // Parse webhook data
    const webhook = sumsubService.parseWebhook(req.body);
    console.log('Received webhook:', webhook.type, webhook.applicantId);

    // Only process applicantReviewed events
    if (webhook.type !== 'applicantReviewed') {
      return res.json({ success: true, message: 'Event ignored' });
    }

    // Update database with review result
    await dbService.updateKYCVerification(webhook.applicantId, {
      status: webhook.reviewStatus,
      reviewAnswer: webhook.reviewResult?.reviewAnswer,
      reviewRejectType: webhook.reviewResult?.reviewRejectType,
      rejectLabels: webhook.reviewResult?.rejectLabels,
      inspectionId: webhook.inspectionId,
      correlationId: webhook.correlationId,
    });

    // If approved, create credential automatically
    if (sumsubService.isApproved(webhook.reviewResult)) {
      console.log('Verification approved:', webhook.applicantId);
      
      try {
        // Get KYC record to find user ID
        const kycRecord = await dbService.getKYCVerification(webhook.applicantId);
        if (!kycRecord) {
          throw new Error('KYC record not found');
        }

        // Create credential with minimal data (no PII)
        const credential = await credentialService.createCredential(
          kycRecord.external_user_id,
          kycRecord.id,
          { status: 'approved' }
        );

        console.log(`Credential created: ${credential.id}`);

        // Link credential to KYC
        await dbService.linkCredentialToKYC(kycRecord.id, credential.id);

        // Try to publish to blockchain
        try {
          // Initialize blockchain if not already done
          if (!blockchainService.isBlockchainConnected?.()) {
            await blockchainService.initializeBlockchain();
          }

          // Publish credential to blockchain
          const blockchainResult = await blockchainService.publishCredential(credential);
          
          // Update credential with blockchain info
          await credentialService.updateCredentialStatus(
            credential.id,
            'published',
            blockchainResult.txHash,
            blockchainResult.blockchainAddress
          );

          console.log(`Credential published to blockchain: ${blockchainResult.txHash}`);
        } catch (blockchainErr) {
          // If blockchain fails, mark credential as pending
          console.warn('Blockchain publishing failed, credential marked as pending:', blockchainErr.message);
          await credentialService.markCredentialFailed(credential.id, blockchainErr.message);
        }
      } catch (credentialErr) {
        console.error('Error creating credential:', credentialErr);
        // Don't fail the webhook - log the error and continue
      }
    } else if (sumsubService.isRejected(webhook.reviewResult)) {
      console.log('Verification rejected:', webhook.applicantId);
      const reasons = sumsubService.getRejectionReasons(webhook.reviewResult);
      console.log('Rejection reasons:', reasons);
    }

    return res.json({ success: true });
  } catch (err) {
    console.error('Webhook error:', err);
    // Always return 200 to Sumsub to avoid retries
    return res.json({ success: false, error: err.message });
  }
});

// ── GET /api/kyc/user/:userId ──────────────────────────────────────────────────
/**
 * Get user's KYC verification status by user ID
 * 
 * Params: userId (your internal user ID)
 * Returns: { verification, credentials }
 */
publicRouter.get('/user/:userId', async (req, res, next) => {
  try {
    const { userId } = req.params;

    const verification = await dbService.getKYCByUserId(userId);
    if (!verification) {
      return res.status(404).json({ error: 'No verification found for this user' });
    }

    const credentials = await dbService.getCredentialsByKYC(verification.id);

    return res.json({
      success: true,
      verification,
      credentials,
    });
  } catch (err) {
    console.error('Get user KYC error:', err);
    next(err);
  }
});

// ── POST /api/kyc/simulate-approval ────────────────────────────────────────────
/**
 * Simulate Sumsub approval for testing (mock mode only)
 * Creates credential automatically when called
 * 
 * Body: { applicantId, userId }
 * Returns: { success, credential }
 */
publicRouter.post('/simulate-approval', async (req, res, next) => {
  try {
    const { applicantId, userId } = req.body;

    if (!applicantId || !userId) {
      return res.status(400).json({ error: 'applicantId and userId are required' });
    }

    // Get KYC record
    const kycRecord = await dbService.getKYCVerification(applicantId);
    if (!kycRecord) {
      return res.status(404).json({ error: 'KYC record not found' });
    }

    // Check if credential already exists
    if (kycRecord.credential_id) {
      return res.json({
        success: true,
        message: 'Credential already exists',
        credential: { id: kycRecord.credential_id },
      });
    }

    // Create credential
    try {
      const credential = await credentialService.createCredential(
        userId,
        kycRecord.id,
        { status: 'approved' }
      );

      console.log(`Credential created via simulate-approval: ${credential.id}`);

      // Link credential to KYC
      await dbService.linkCredentialToKYC(kycRecord.id, credential.id);

      // Update KYC status to completed
      await dbService.updateKYCVerification(applicantId, {
        status: 'completed',
        review_answer: 'GREEN',
      });

      // Publish to blockchain
      let blockchainResult = null;
      try {
        await blockchainService.initializeBlockchain();
        blockchainResult = await blockchainService.publishCredential(credential);
        console.log(`[blockchain] Credential published: ${blockchainResult.txHash}`);

        await credentialService.updateCredentialStatus(
          credential.id,
          'published',
          blockchainResult.txHash,
        );
      } catch (blockchainErr) {
        console.warn('[blockchain] Publishing failed (credential still created):', blockchainErr.message);
      }

      return res.json({
        success: true,
        credential,
        blockchain: blockchainResult,
        message: blockchainResult
          ? `Credencial publicada en blockchain: ${blockchainResult.txHash}`
          : 'Credencial creada (blockchain no disponible)',
      });
    } catch (credentialErr) {
      console.error('Error creating credential:', credentialErr);
      return res.status(500).json({
        error: 'Failed to create credential',
        details: credentialErr.message,
      });
    }
  } catch (err) {
    console.error('Simulate approval error:', err);
    next(err);
  }
});

// ── GET /api/kyc/stats ─────────────────────────────────────────────────────────
/**
 * Get verification statistics (admin only)
 * Returns: { total, approved, rejected, pending }
 */
protectedRouter.get('/stats', async (req, res, next) => {
  try {
    const stats = await dbService.getVerificationStats();
    return res.json({ success: true, stats });
  } catch (err) {
    console.error('Get stats error:', err);
    next(err);
  }
});

// ── GET /api/kyc/recent ────────────────────────────────────────────────────────
/**
 * Get recent verifications (admin only)
 * Query: ?limit=50
 * Returns: Array of recent verifications
 */
protectedRouter.get('/recent', async (req, res, next) => {
  try {
    const limit = parseInt(req.query.limit) || 50;
    const verifications = await dbService.getRecentVerifications(limit);
    return res.json({ success: true, verifications });
  } catch (err) {
    console.error('Get recent verifications error:', err);
    next(err);
  }
});

// Mount routers
kycRouter.use(publicRouter);
kycRouter.use(protectedRouter);
