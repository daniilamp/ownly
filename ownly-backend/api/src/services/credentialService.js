/**
 * Credential Service
 * Manages credential creation, retrieval, and lifecycle
 * Minimal data approach - only stores what's necessary
 */

import * as dbService from './databaseService.js';

/**
 * Create a new credential after KYC approval
 * Stores minimal data only (no PII)
 */
export async function createCredential(userId, kycId, kycData) {
  try {
    // Validate inputs
    if (!userId || !kycId) {
      throw new Error('userId and kycId are required');
    }

    // Create credential with minimal data
    const credential = {
      userId,
      kycId,
      type: 'identity_verified',
      status: 'pending', // Will be 'published' after blockchain
      expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year
      credentialData: {
        // Minimal data only - NO PII
        type: 'identity_verified',
        issuer: process.env.CREDENTIAL_ISSUER || 'ownly.eth',
        issuanceDate: new Date().toISOString(),
        expirationDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
      },
    };

    // Save to database
    const result = await dbService.createCredential(credential);
    
    console.log(`Credential created: ${result.id} for user ${userId}`);
    return result;
  } catch (err) {
    console.error('Error creating credential:', err);
    throw err;
  }
}

/**
 * Get all credentials for a user
 * Returns only minimal data
 */
export async function getUserCredentials(userId) {
  try {
    if (!userId) {
      throw new Error('userId is required');
    }

    const credentials = await dbService.getCredentialsByUserId(userId);
    
    // Filter out sensitive data (extra safety)
    return credentials.map(cred => ({
      id: cred.id,
      type: cred.type,
      status: cred.status,
      issuanceDate: cred.credential_data?.issuanceDate,
      expirationDate: cred.credential_data?.expirationDate,
      blockchainTxHash: cred.blockchain_tx_hash,
      createdAt: cred.created_at,
    }));
  } catch (err) {
    console.error('Error getting user credentials:', err);
    throw err;
  }
}

/**
 * Get a specific credential by ID
 */
export async function getCredential(credentialId) {
  try {
    if (!credentialId) {
      throw new Error('credentialId is required');
    }

    const credential = await dbService.getCredential(credentialId);
    
    if (!credential) {
      throw new Error('Credential not found');
    }

    // Return minimal data
    return {
      id: credential.id,
      type: credential.type,
      status: credential.status,
      issuanceDate: credential.credential_data?.issuanceDate,
      expirationDate: credential.credential_data?.expirationDate,
      blockchainTxHash: credential.blockchain_tx_hash,
      blockchainAddress: credential.blockchain_address,
      createdAt: credential.created_at,
    };
  } catch (err) {
    console.error('Error getting credential:', err);
    throw err;
  }
}

/**
 * Update credential status after blockchain publishing
 */
export async function updateCredentialStatus(credentialId, status, txHash, blockchainAddress) {
  try {
    if (!credentialId || !status) {
      throw new Error('credentialId and status are required');
    }

    const updated = await dbService.updateCredential(credentialId, {
      status,
      blockchainTxHash: txHash,
      blockchainAddress: blockchainAddress,
    });

    console.log(`Credential ${credentialId} updated to status: ${status}`);
    return updated;
  } catch (err) {
    console.error('Error updating credential status:', err);
    throw err;
  }
}

/**
 * Revoke a credential
 */
export async function revokeCredential(credentialId, reason) {
  try {
    if (!credentialId) {
      throw new Error('credentialId is required');
    }

    const updated = await dbService.updateCredential(credentialId, {
      status: 'revoked',
      revokedAt: new Date(),
      revocationReason: reason,
    });

    console.log(`Credential ${credentialId} revoked: ${reason}`);
    return updated;
  } catch (err) {
    console.error('Error revoking credential:', err);
    throw err;
  }
}

/**
 * Check if credential is valid and not expired
 */
export async function isCredentialValid(credentialId) {
  try {
    const credential = await dbService.getCredential(credentialId);
    
    if (!credential) {
      return false;
    }

    // Check status
    if (credential.status !== 'published') {
      return false;
    }

    // Check expiration
    const expirationDate = new Date(credential.credential_data?.expirationDate);
    if (expirationDate < new Date()) {
      return false;
    }

    return true;
  } catch (err) {
    console.error('Error checking credential validity:', err);
    return false;
  }
}

/**
 * Get credentials pending blockchain publishing
 */
export async function getPendingCredentials() {
  try {
    const credentials = await dbService.getCredentialsByStatus('pending');
    return credentials;
  } catch (err) {
    console.error('Error getting pending credentials:', err);
    throw err;
  }
}

/**
 * Get failed credentials for retry
 */
export async function getFailedCredentials() {
  try {
    const credentials = await dbService.getCredentialsByStatus('failed');
    return credentials;
  } catch (err) {
    console.error('Error getting failed credentials:', err);
    throw err;
  }
}

/**
 * Mark credential as failed
 */
export async function markCredentialFailed(credentialId, error) {
  try {
    const updated = await dbService.updateCredential(credentialId, {
      status: 'failed',
      error: error,
      failedAt: new Date(),
    });

    console.log(`Credential ${credentialId} marked as failed: ${error}`);
    return updated;
  } catch (err) {
    console.error('Error marking credential as failed:', err);
    throw err;
  }
}

/**
 * Get credential statistics
 */
export async function getCredentialStats() {
  try {
    const stats = await dbService.getCredentialStats();
    return stats;
  } catch (err) {
    console.error('Error getting credential stats:', err);
    throw err;
  }
}

/**
 * Verify credential data integrity
 * Checks that credential has required fields
 */
export function verifyCredentialData(credential) {
  const required = ['id', 'userId', 'type', 'status', 'credentialData'];
  
  for (const field of required) {
    if (!credential[field]) {
      throw new Error(`Missing required field: ${field}`);
    }
  }

  // Verify credential data structure
  const credData = credential.credentialData;
  if (!credData.type || !credData.issuer || !credData.issuanceDate) {
    throw new Error('Invalid credential data structure');
  }

  return true;
}

/**
 * Generate credential proof (placeholder for ZK proof)
 * Will be replaced with actual ZK proof generation in SPRINT 4
 */
export function generateCredentialProof(credential) {
  // TODO: Implement ZK proof generation
  // For now, return a placeholder
  return {
    type: 'Groth16',
    proofValue: '0x' + Buffer.from(JSON.stringify(credential)).toString('hex'),
    verificationMethod: 'ownly-verifier',
  };
}

export default {
  createCredential,
  getUserCredentials,
  getCredential,
  updateCredentialStatus,
  revokeCredential,
  isCredentialValid,
  getPendingCredentials,
  getFailedCredentials,
  markCredentialFailed,
  getCredentialStats,
  verifyCredentialData,
  generateCredentialProof,
};
