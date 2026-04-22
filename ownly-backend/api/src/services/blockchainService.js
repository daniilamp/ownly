/**
 * Blockchain Service
 * Handles credential publishing and verification on blockchain
 * Uses ethers.js to interact with smart contracts
 */

import { ethers } from 'ethers';

// Contract ABI - CredentialRegistry real functions
const CREDENTIAL_REGISTRY_ABI = [
  'function publishBatch(bytes32 merkleRoot) external returns (uint256 batchId)',
  'function addIssuer(address issuer) external',
  'function isIssuer(address) external view returns (bool)',
  'function getBatchRoot(address issuer, uint256 batchId) external view returns (bytes32)',
  'function batchCount(address) external view returns (uint256)',
  'event BatchPublished(address indexed issuer, uint256 indexed batchId, bytes32 merkleRoot)',
];

// Initialize provider and signer
let provider;
let signer;
let credentialRegistry;

const RPC_URL = process.env.RPC_URL || process.env.POLYGON_RPC_URL || 'https://rpc-amoy.polygon.technology';
const PRIVATE_KEY = process.env.ISSUER_PRIVATE_KEY || process.env.PRIVATE_KEY;
const CONTRACT_ADDRESS = process.env.CREDENTIAL_REGISTRY_ADDRESS;

/**
 * Initialize blockchain connection
 */
export async function initializeBlockchain() {
  try {
    provider = new ethers.JsonRpcProvider(RPC_URL);

    if (!PRIVATE_KEY) {
      throw new Error('ISSUER_PRIVATE_KEY not set in environment');
    }

    signer = new ethers.Wallet(PRIVATE_KEY, provider);

    if (!CONTRACT_ADDRESS) {
      throw new Error('CREDENTIAL_REGISTRY_ADDRESS not set in environment');
    }

    credentialRegistry = new ethers.Contract(
      CONTRACT_ADDRESS,
      CREDENTIAL_REGISTRY_ABI,
      signer
    );

    const network = await provider.getNetwork();
    console.log(`[blockchain] Connected to ${network.name} (chainId: ${network.chainId})`);
    console.log(`[blockchain] Signer: ${signer.address}`);
    console.log(`[blockchain] Contract: ${CONTRACT_ADDRESS}`);

    return true;
  } catch (err) {
    console.error('[blockchain] Init error:', err.message);
    throw err;
  }
}

/**
 * Publish credential to blockchain
 * @param {Object} credential - Credential object
 * @returns {Promise<Object>} Transaction result with hash and address
 */
export async function publishCredential(credential) {
  try {
    if (!credentialRegistry) {
      await initializeBlockchain();
    }

    if (!credential.id || (!credential.userId && !credential.user_id)) {
      throw new Error('Invalid credential: missing id or userId');
    }

    const proof = generateProof(credential);
    const credentialType = 'identity_verified';
    const rawUserId = credential.userId || credential.user_id;

    // Convert userId to a valid Ethereum address
    let subjectAddress;
    try {
      subjectAddress = ethers.getAddress(rawUserId);
    } catch {
      const hash = ethers.keccak256(ethers.toUtf8Bytes(rawUserId));
      subjectAddress = ethers.getAddress('0x' + hash.slice(-40));
    }

    console.log(`[blockchain] Publishing credential ${credential.id}...`);
    console.log(`[blockchain] Subject: ${subjectAddress}`);

    // Build a simple Merkle root from the credential hash
    const credentialHash = ethers.keccak256(
      ethers.toUtf8Bytes(JSON.stringify({ id: credential.id, userId: rawUserId, type: 'identity_verified' }))
    );

    const tx = await credentialRegistry.publishBatch(credentialHash);

    console.log(`[blockchain] Tx sent: ${tx.hash}`);
    const receipt = await tx.wait();
    console.log(`[blockchain] Confirmed in block ${receipt.blockNumber}`);

    return {
      txHash: receipt.hash,
      blockNumber: receipt.blockNumber,
      gasUsed: receipt.gasUsed.toString(),
      status: receipt.status === 1 ? 'success' : 'failed',
    };
  } catch (err) {
    console.error('[blockchain] publishCredential error:', err.message);
    throw err;
  }
}

/**
 * Verify credential on blockchain
 * @param {string} credentialId - Credential ID
 * @param {string} txHash - Transaction hash
 * @returns {Promise<Object>} Verification result
 */
export async function verifyCredential(credentialId, txHash) {
  try {
    if (!credentialRegistry) {
      throw new Error('Blockchain not initialized. Call initializeBlockchain() first.');
    }

    // Get transaction receipt
    const receipt = await provider.getTransactionReceipt(txHash);

    if (!receipt) {
      return {
        verified: false,
        reason: 'Transaction not found',
      };
    }

    // Check if transaction was successful
    if (receipt.status !== 1) {
      return {
        verified: false,
        reason: 'Transaction failed',
      };
    }

    // Verify credential on contract
    const proof = generateProof({ id: credentialId });
    const isValid = await credentialRegistry.verifyCredential(credentialId, proof);

    return {
      verified: isValid,
      txHash: receipt.hash,
      blockNumber: receipt.blockNumber,
      blockchainAddress: receipt.to,
    };
  } catch (err) {
    console.error('Error verifying credential:', err);
    throw err;
  }
}

/**
 * Revoke credential on blockchain
 * @param {string} credentialId - Credential ID
 * @returns {Promise<Object>} Transaction result
 */
export async function revokeCredential(credentialId) {
  try {
    if (!credentialRegistry) {
      throw new Error('Blockchain not initialized. Call initializeBlockchain() first.');
    }

    console.log(`Revoking credential ${credentialId} on blockchain...`);

    // Send transaction
    const tx = await credentialRegistry.revokeCredential(credentialId);

    console.log(`Revocation transaction sent: ${tx.hash}`);

    // Wait for confirmation
    const receipt = await tx.wait();

    console.log(`Revocation confirmed in block ${receipt.blockNumber}`);

    return {
      txHash: receipt.hash,
      blockNumber: receipt.blockNumber,
      status: receipt.status === 1 ? 'success' : 'failed',
    };
  } catch (err) {
    console.error('Error revoking credential:', err);
    throw err;
  }
}

/**
 * Get credential from blockchain
 * @param {string} credentialId - Credential ID
 * @returns {Promise<Object>} Credential data from blockchain
 */
export async function getBlockchainCredential(credentialId) {
  try {
    if (!credentialRegistry) {
      throw new Error('Blockchain not initialized. Call initializeBlockchain() first.');
    }

    const credential = await credentialRegistry.getCredential(credentialId);

    return {
      subject: credential.subject,
      credentialType: credential.credentialType,
      issuanceDate: new Date(credential.issuanceDate * 1000),
      expirationDate: new Date(credential.expirationDate * 1000),
      revoked: credential.revoked,
    };
  } catch (err) {
    console.error('Error getting blockchain credential:', err);
    throw err;
  }
}

/**
 * Generate proof for credential
 * Placeholder - will be replaced with actual ZK proof in SPRINT 4
 * @param {Object} credential - Credential object
 * @returns {string} Proof bytes
 */
function generateProof(credential) {
  // TODO: Implement actual ZK proof generation
  // For now, return a simple hash of the credential
  const data = JSON.stringify(credential);
  const hash = ethers.keccak256(ethers.toUtf8Bytes(data));
  return hash;
}

/**
 * Get current gas price
 * @returns {Promise<Object>} Gas price info
 */
export async function getGasPrice() {
  try {
    if (!provider) {
      throw new Error('Provider not initialized');
    }

    const feeData = await provider.getFeeData();

    return {
      gasPrice: feeData.gasPrice?.toString(),
      maxFeePerGas: feeData.maxFeePerGas?.toString(),
      maxPriorityFeePerGas: feeData.maxPriorityFeePerGas?.toString(),
    };
  } catch (err) {
    console.error('Error getting gas price:', err);
    throw err;
  }
}

/**
 * Get signer balance
 * @returns {Promise<string>} Balance in wei
 */
export async function getSignerBalance() {
  try {
    if (!signer) {
      throw new Error('Signer not initialized');
    }

    const balance = await provider.getBalance(signer.address);
    return ethers.formatEther(balance);
  } catch (err) {
    console.error('Error getting signer balance:', err);
    throw err;
  }
}

/**
 * Check if blockchain is connected
 * @returns {Promise<boolean>} Connection status
 */
export async function isBlockchainConnected() {
  try {
    if (!provider) return false;
    await provider.getNetwork();
    return true;
  } catch {
    return false;
  }
}

export default {
  initializeBlockchain,
  publishCredential,
  verifyCredential,
  revokeCredential,
  getBlockchainCredential,
  getGasPrice,
  getSignerBalance,
  isBlockchainConnected,
};
