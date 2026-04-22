/**
 * Sumsub KYC Service
 * Handles all interactions with Sumsub API
 * Docs: https://developers.sumsub.com/api-reference/
 */

import axios from 'axios';
import crypto from 'crypto';

const SUMSUB_BASE_URL = process.env.SUMSUB_BASE_URL || 'https://api.sumsub.com';
const APP_TOKEN = process.env.SUMSUB_APP_TOKEN;
const SECRET_KEY = process.env.SUMSUB_SECRET_KEY;
const LEVEL_NAME = process.env.SUMSUB_LEVEL_NAME || 'default';

/**
 * Generate signature for Sumsub API requests
 * Required for authentication
 */
function generateSignature(method, url, timestamp, body = null) {
  const data = timestamp + method.toUpperCase() + url + (body || '');
  return crypto
    .createHmac('sha256', SECRET_KEY)
    .update(data)
    .digest('hex');
}

/**
 * Make authenticated request to Sumsub API
 */
async function sumsubRequest(method, path, body = null) {
  const timestamp = Math.floor(Date.now() / 1000).toString();
  // Include full path with query parameters in signature
  const signature = generateSignature(method, path, timestamp, body ? JSON.stringify(body) : null);
  
  const headers = {
    'X-App-Token': APP_TOKEN,
    'X-App-Access-Sig': signature,
    'X-App-Access-Ts': timestamp,
    'Content-Type': 'application/json',
  };

  try {
    const response = await axios({
      method,
      url: `${SUMSUB_BASE_URL}${path}`,
      headers,
      data: body,
    });
    return response.data;
  } catch (error) {
    console.error('Sumsub API error:', error.response?.data || error.message);
    throw new Error(error.response?.data?.description || 'Sumsub API request failed');
  }
}

/**
 * Create a new applicant in Sumsub
 * @param {Object} userData - User information
 * @param {string} userData.externalUserId - Your internal user ID
 * @param {string} userData.email - User email
 * @param {string} userData.firstName - First name
 * @param {string} userData.lastName - Last name
 * @returns {Promise<Object>} Applicant data with ID
 */
export async function createApplicant(userData) {
  const { externalUserId, email, firstName, lastName } = userData;

  const body = {
    externalUserId,
    email,
    fixedInfo: {
      firstName,
      lastName,
    },
  };

  // Always use levelName - it's required by Sumsub
  const path = `/resources/applicants?levelName=${LEVEL_NAME}`;
  
  try {
    const applicant = await sumsubRequest('POST', path, body);
    return {
      applicantId: applicant.id,
      externalUserId: applicant.externalUserId,
      createdAt: applicant.createdAt,
    };
  } catch (err) {
    // If applicant already exists, extract the ID
    if (err.message.includes('already exists')) {
      const match = err.message.match(/already exists: ([a-f0-9]+)/);
      if (match) {
        return {
          applicantId: match[1],
          externalUserId,
          createdAt: new Date().toISOString(),
          existing: true,
        };
      }
    }
    throw err;
  }
}

/**
 * Generate SDK access token for frontend
 * This token allows the user to upload documents via Sumsub Web SDK
 * @param {string} externalUserId - Your internal user ID
 * @param {string} levelName - Verification level (optional)
 * @returns {Promise<Object>} SDK token and expiration
 */
export async function generateSDKToken(externalUserId, levelName = LEVEL_NAME) {
  // Build path with levelName
  let path = `/resources/accessTokens?userId=${externalUserId}&levelName=${levelName}`;
  
  try {
    const result = await sumsubRequest('POST', path);
    return {
      token: result.token,
      userId: result.userId,
    };
  } catch (err) {
    // If fails, try without levelName
    path = `/resources/accessTokens?userId=${externalUserId}`;
    const result = await sumsubRequest('POST', path);
    return {
      token: result.token,
      userId: result.userId,
    };
  }
}

/**
 * Get applicant status and review result
 * @param {string} applicantId - Sumsub applicant ID
 * @returns {Promise<Object>} Applicant status and data
 */
export async function getApplicantStatus(applicantId) {
  const applicant = await sumsubRequest('GET', `/resources/applicants/${applicantId}/one`);
  
  return {
    id: applicant.id,
    externalUserId: applicant.externalUserId,
    email: applicant.email,
    review: applicant.review,
    reviewResult: applicant.reviewResult,
    reviewStatus: applicant.reviewStatus,
    createdAt: applicant.createdAt,
  };
}

/**
 * Get applicant's document data (extracted info from ID/passport)
 * @param {string} applicantId - Sumsub applicant ID
 * @returns {Promise<Object>} Document information
 */
export async function getApplicantDocuments(applicantId) {
  const applicant = await sumsubRequest('GET', `/resources/applicants/${applicantId}/one`);
  
  // Extract document info from fixedInfo
  const info = applicant.info || {};
  const idDocs = info.idDocs || [];
  
  if (idDocs.length === 0) {
    return null;
  }

  const doc = idDocs[0]; // Get first document
  
  return {
    type: doc.idDocType, // ID_CARD, PASSPORT, DRIVERS, etc.
    number: doc.number,
    firstName: doc.firstName,
    lastName: doc.lastName,
    dob: doc.dob, // Date of birth (YYYY-MM-DD)
    expiryDate: doc.validUntil,
    issuedDate: doc.issuedDate,
    country: doc.country, // ISO 3166-1 alpha-3
  };
}

/**
 * Verify webhook signature from Sumsub
 * Important for security - ensures webhook is from Sumsub
 * @param {string} payload - Raw request body
 * @param {string} signature - X-Payload-Digest header
 * @returns {boolean} True if signature is valid
 */
export function verifyWebhookSignature(payload, signature) {
  const expectedSignature = crypto
    .createHmac('sha256', SECRET_KEY)
    .update(payload)
    .digest('hex');
  
  return signature === expectedSignature;
}

/**
 * Parse webhook payload from Sumsub
 * @param {Object} payload - Webhook body
 * @returns {Object} Parsed webhook data
 */
export function parseWebhook(payload) {
  return {
    applicantId: payload.applicantId,
    inspectionId: payload.inspectionId,
    correlationId: payload.correlationId,
    externalUserId: payload.externalUserId,
    type: payload.type, // applicantReviewed, applicantPending, etc.
    reviewResult: payload.reviewResult,
    reviewStatus: payload.reviewStatus,
    createdAt: payload.createdAt,
  };
}

/**
 * Check if review result is approved
 * @param {Object} reviewResult - Review result from Sumsub
 * @returns {boolean} True if approved
 */
export function isApproved(reviewResult) {
  return reviewResult?.reviewAnswer === 'GREEN';
}

/**
 * Check if review result is rejected
 * @param {Object} reviewResult - Review result from Sumsub
 * @returns {boolean} True if rejected
 */
export function isRejected(reviewResult) {
  return reviewResult?.reviewAnswer === 'RED';
}

/**
 * Check if review is pending (manual review required)
 * @param {Object} reviewResult - Review result from Sumsub
 * @returns {boolean} True if pending
 */
export function isPending(reviewResult) {
  return reviewResult?.reviewAnswer === 'YELLOW' || !reviewResult?.reviewAnswer;
}

/**
 * Get rejection reasons
 * @param {Object} reviewResult - Review result from Sumsub
 * @returns {Array<string>} Array of rejection labels
 */
export function getRejectionReasons(reviewResult) {
  return reviewResult?.rejectLabels || [];
}
