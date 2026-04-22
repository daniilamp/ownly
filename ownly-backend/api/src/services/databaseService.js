/**
 * Database Service
 * Handles all database operations using Supabase
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY;

// Create Supabase client
export const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * Create a new KYC verification record
 * @param {Object} data - Verification data
 * @returns {Promise<Object>} Created record
 */
export async function createKYCVerification(data) {
  const { data: record, error } = await supabase
    .from('kyc_verifications')
    .insert({
      applicant_id: data.applicantId,
      external_user_id: data.externalUserId,
      email: data.email,
      first_name: data.firstName,
      last_name: data.lastName,
      status: 'pending',
    })
    .select()
    .single();

  if (error) {
    console.error('Database error creating KYC verification:', error);
    throw new Error('Failed to create KYC verification record');
  }

  return record;
}

/**
 * Update KYC verification with review result
 * @param {string} applicantId - Sumsub applicant ID
 * @param {Object} reviewData - Review result data
 * @returns {Promise<Object>} Updated record
 */
export async function updateKYCVerification(applicantId, reviewData) {
  const updateData = {
    status: reviewData.status,
    review_answer: reviewData.reviewAnswer,
    review_reject_type: reviewData.reviewRejectType,
    reject_labels: reviewData.rejectLabels,
    inspection_id: reviewData.inspectionId,
    correlation_id: reviewData.correlationId,
    updated_at: new Date().toISOString(),
  };

  // If approved, set approved_at timestamp
  if (reviewData.reviewAnswer === 'GREEN') {
    updateData.approved_at = new Date().toISOString();
    updateData.status = 'completed';
  } else if (reviewData.reviewAnswer === 'RED') {
    updateData.status = 'rejected';
  }

  const { data: record, error } = await supabase
    .from('kyc_verifications')
    .update(updateData)
    .eq('applicant_id', applicantId)
    .select()
    .single();

  if (error) {
    console.error('Database error updating KYC verification:', error);
    throw new Error('Failed to update KYC verification');
  }

  return record;
}

/**
 * Update KYC verification with document data
 * @param {string} applicantId - Sumsub applicant ID
 * @param {Object} documentData - Extracted document info
 * @returns {Promise<Object>} Updated record
 */
export async function updateKYCDocumentData(applicantId, documentData) {
  const { data: record, error } = await supabase
    .from('kyc_verifications')
    .update({
      document_type: documentData.type,
      document_number: documentData.number,
      date_of_birth: documentData.dob,
      expiry_date: documentData.expiryDate,
      country: documentData.country,
      updated_at: new Date().toISOString(),
    })
    .eq('applicant_id', applicantId)
    .select()
    .single();

  if (error) {
    console.error('Database error updating document data:', error);
    throw new Error('Failed to update document data');
  }

  return record;
}

/**
 * Get KYC verification by applicant ID
 * @param {string} applicantId - Sumsub applicant ID
 * @returns {Promise<Object|null>} Verification record or null
 */
export async function getKYCVerification(applicantId) {
  const { data, error } = await supabase
    .from('kyc_verifications')
    .select('*')
    .eq('applicant_id', applicantId)
    .single();

  if (error && error.code !== 'PGRST116') { // PGRST116 = not found
    console.error('Database error getting KYC verification:', error);
    throw new Error('Failed to get KYC verification');
  }

  return data;
}

/**
 * Get KYC verification by external user ID
 * @param {string} externalUserId - Your internal user ID
 * @returns {Promise<Object|null>} Verification record or null
 */
export async function getKYCByUserId(externalUserId) {
  const { data, error } = await supabase
    .from('kyc_verifications')
    .select('*')
    .eq('external_user_id', externalUserId)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (error && error.code !== 'PGRST116') {
    console.error('Database error getting KYC by user ID:', error);
    throw new Error('Failed to get KYC verification');
  }

  return data;
}

/**
 * Get KYC verification by email
 * @param {string} email - User email
 * @returns {Promise<Object|null>} Verification record or null
 */
export async function getKYCByEmail(email) {
  const { data, error } = await supabase
    .from('kyc_verifications')
    .select('*')
    .eq('email', email)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (error && error.code !== 'PGRST116') {
    console.error('Database error getting KYC by email:', error);
    throw new Error('Failed to get KYC verification');
  }

  return data;
}

/**
 * Create a credential record
 * @param {Object} data - Credential data
 * @returns {Promise<Object>} Created credential
 */
export async function createCredential(data) {
  // Support both old and new credential formats
  const insertData = {
    // New format (SPRINT 3)
    user_id: data.userId,
    type: data.type || 'identity_verified',
    status: data.status || 'pending',
    credential_data: data.credentialData,
    expires_at: data.expiresAt,
    
    // Old format (for backward compatibility)
    kyc_id: data.kycId,
    commitment_hash: data.commitmentHash || 'auto_generated',
    merkle_root: data.merkleRoot,
    batch_id: data.batchId,
    tx_hash: data.txHash,
    credential_type: data.credentialType || data.type || 'identity_verified',
    credential_name: data.credentialName,
    issued_to: data.issuedTo,
    issuer: data.issuer || 'Ownly KYC',
  };

  const { data: record, error } = await supabase
    .from('credentials')
    .insert(insertData)
    .select()
    .single();

  if (error) {
    console.error('Database error creating credential:', error);
    throw new Error('Failed to create credential');
  }

  return record;
}

/**
 * Get credentials by KYC ID
 * @param {string} kycId - KYC verification ID
 * @returns {Promise<Array>} Array of credentials
 */
export async function getCredentialsByKYC(kycId) {
  const { data, error } = await supabase
    .from('credentials')
    .select('*')
    .eq('kyc_id', kycId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Database error getting credentials:', error);
    throw new Error('Failed to get credentials');
  }

  return data || [];
}

/**
 * Get credentials by user email
 * @param {string} email - User email
 * @returns {Promise<Array>} Array of credentials
 */
export async function getCredentialsByEmail(email) {
  const { data, error } = await supabase
    .from('credentials')
    .select('*')
    .eq('issued_to', email)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Database error getting credentials by email:', error);
    throw new Error('Failed to get credentials');
  }

  return data || [];
}

/**
 * Get recent verifications (for admin dashboard)
 * @param {number} limit - Number of records to return
 * @returns {Promise<Array>} Array of recent verifications
 */
export async function getRecentVerifications(limit = 50) {
  const { data, error } = await supabase
    .from('kyc_verifications')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('Database error getting recent verifications:', error);
    throw new Error('Failed to get recent verifications');
  }

  return data || [];
}

/**
 * Get verification statistics
 * @returns {Promise<Object>} Stats object
 */
export async function getVerificationStats() {
  // Total verifications
  const { count: total } = await supabase
    .from('kyc_verifications')
    .select('*', { count: 'exact', head: true });

  // Approved
  const { count: approved } = await supabase
    .from('kyc_verifications')
    .select('*', { count: 'exact', head: true })
    .eq('review_answer', 'GREEN');

  // Rejected
  const { count: rejected } = await supabase
    .from('kyc_verifications')
    .select('*', { count: 'exact', head: true })
    .eq('review_answer', 'RED');

  // Pending
  const { count: pending } = await supabase
    .from('kyc_verifications')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'pending');

  return {
    total: total || 0,
    approved: approved || 0,
    rejected: rejected || 0,
    pending: pending || 0,
  };
}


/**
 * Get credentials by user ID
 * @param {string} userId - User ID
 * @returns {Promise<Array>} Array of credentials
 */
export async function getCredentialsByUserId(userId) {
  const { data, error } = await supabase
    .from('credentials')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Database error getting credentials by user ID:', error);
    throw new Error('Failed to get credentials');
  }

  return data || [];
}

/**
 * Get a specific credential by ID
 * @param {string} credentialId - Credential ID
 * @returns {Promise<Object|null>} Credential record or null
 */
export async function getCredential(credentialId) {
  const { data, error } = await supabase
    .from('credentials')
    .select('*')
    .eq('id', credentialId)
    .single();

  if (error && error.code !== 'PGRST116') {
    console.error('Database error getting credential:', error);
    throw new Error('Failed to get credential');
  }

  return data;
}

/**
 * Update credential status and blockchain info
 * @param {string} credentialId - Credential ID
 * @param {Object} updateData - Data to update
 * @returns {Promise<Object>} Updated credential
 */
export async function updateCredential(credentialId, updateData) {
  const { data: record, error } = await supabase
    .from('credentials')
    .update({
      ...updateData,
      updated_at: new Date().toISOString(),
    })
    .eq('id', credentialId)
    .select()
    .single();

  if (error) {
    console.error('Database error updating credential:', error);
    throw new Error('Failed to update credential');
  }

  return record;
}

/**
 * Get credentials by status
 * @param {string} status - Credential status (pending, published, failed, revoked)
 * @returns {Promise<Array>} Array of credentials
 */
export async function getCredentialsByStatus(status) {
  const { data, error } = await supabase
    .from('credentials')
    .select('*')
    .eq('status', status)
    .order('created_at', { ascending: true });

  if (error) {
    console.error('Database error getting credentials by status:', error);
    throw new Error('Failed to get credentials');
  }

  return data || [];
}

/**
 * Get credential statistics
 * @returns {Promise<Object>} Stats object
 */
export async function getCredentialStats() {
  // Total credentials
  const { count: total } = await supabase
    .from('credentials')
    .select('*', { count: 'exact', head: true });

  // Published
  const { count: published } = await supabase
    .from('credentials')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'published');

  // Pending
  const { count: pending } = await supabase
    .from('credentials')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'pending');

  // Failed
  const { count: failed } = await supabase
    .from('credentials')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'failed');

  // Revoked
  const { count: revoked } = await supabase
    .from('credentials')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'revoked');

  return {
    total: total || 0,
    published: published || 0,
    pending: pending || 0,
    failed: failed || 0,
    revoked: revoked || 0,
  };
}

/**
 * Link credential to KYC verification
 * @param {string} kycId - KYC verification ID
 * @param {string} credentialId - Credential ID
 * @returns {Promise<Object>} Updated KYC record
 */
export async function linkCredentialToKYC(kycId, credentialId) {
  const { data: record, error } = await supabase
    .from('kyc_verifications')
    .update({
      credential_id: credentialId,
      credential_status: 'pending',
      updated_at: new Date().toISOString(),
    })
    .eq('id', kycId)
    .select()
    .single();

  if (error) {
    console.error('Database error linking credential to KYC:', error);
    throw new Error('Failed to link credential to KYC');
  }

  return record;
}

/**
 * Update KYC credential status
 * @param {string} kycId - KYC verification ID
 * @param {string} credentialStatus - Credential status
 * @returns {Promise<Object>} Updated KYC record
 */
export async function updateKYCCredentialStatus(kycId, credentialStatus) {
  const { data: record, error } = await supabase
    .from('kyc_verifications')
    .update({
      credential_status: credentialStatus,
      updated_at: new Date().toISOString(),
    })
    .eq('id', kycId)
    .select()
    .single();

  if (error) {
    console.error('Database error updating KYC credential status:', error);
    throw new Error('Failed to update KYC credential status');
  }

  return record;
}


/**
 * Create a document record
 * @param {Object} data - Document data
 * @returns {Promise<Object>} Created document
 */
export async function createDocument(data) {
  const { data: record, error } = await supabase
    .from('user_documents')
    .insert({
      user_id: data.userId,
      document_type: data.documentType,
      file_name: data.fileName,
      file_size: data.fileSize,
      mime_type: data.mimeType,
      encryption_key_hash: data.encryptionKeyHash,
      iv: data.iv,
      auth_tag: data.authTag,
      storage_location: data.storageLocation,
      cloud_url: data.cloudUrl,
      status: data.status,
      is_verified: data.isVerified,
      verification_hash: data.verificationHash,
    })
    .select()
    .single();

  if (error) {
    console.error('Database error creating document:', error);
    throw new Error('Failed to create document');
  }

  return record;
}

/**
 * Get a specific document
 * @param {string} documentId - Document ID
 * @returns {Promise<Object|null>} Document record or null
 */
export async function getDocument(documentId) {
  const { data, error } = await supabase
    .from('user_documents')
    .select('*')
    .eq('id', documentId)
    .single();

  if (error && error.code !== 'PGRST116') {
    console.error('Database error getting document:', error);
    throw new Error('Failed to get document');
  }

  return data;
}

/**
 * Get all documents for a user
 * @param {string} userId - User ID
 * @returns {Promise<Array>} Array of documents
 */
export async function getUserDocuments(userId) {
  const { data, error } = await supabase
    .from('user_documents')
    .select('*')
    .eq('user_id', userId)
    .order('uploaded_at', { ascending: false });

  if (error) {
    console.error('Database error getting user documents:', error);
    throw new Error('Failed to get documents');
  }

  return data || [];
}

/**
 * Get documents by type
 * @param {string} userId - User ID
 * @param {string} documentType - Document type
 * @returns {Promise<Array>} Array of documents
 */
export async function getDocumentsByType(userId, documentType) {
  const { data, error } = await supabase
    .from('user_documents')
    .select('*')
    .eq('user_id', userId)
    .eq('document_type', documentType)
    .order('uploaded_at', { ascending: false });

  if (error) {
    console.error('Database error getting documents by type:', error);
    throw new Error('Failed to get documents');
  }

  return data || [];
}

/**
 * Update document
 * @param {string} documentId - Document ID
 * @param {Object} updateData - Data to update
 * @returns {Promise<Object>} Updated document
 */
export async function updateDocument(documentId, updateData) {
  const { data: record, error } = await supabase
    .from('user_documents')
    .update({
      ...updateData,
      updated_at: new Date().toISOString(),
    })
    .eq('id', documentId)
    .select()
    .single();

  if (error) {
    console.error('Database error updating document:', error);
    throw new Error('Failed to update document');
  }

  return record;
}

/**
 * Delete a document
 * @param {string} documentId - Document ID
 * @returns {Promise<void>}
 */
export async function deleteDocument(documentId) {
  const { error } = await supabase
    .from('user_documents')
    .delete()
    .eq('id', documentId);

  if (error) {
    console.error('Database error deleting document:', error);
    throw new Error('Failed to delete document');
  }
}

/**
 * Get document statistics for a user
 * @param {string} userId - User ID
 * @returns {Promise<Object>} Stats object
 */
export async function getDocumentStats(userId) {
  // Total documents
  const { count: total } = await supabase
    .from('user_documents')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId);

  // By storage location
  const { count: local } = await supabase
    .from('user_documents')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('storage_location', 'local');

  const { count: synced } = await supabase
    .from('user_documents')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('status', 'synced');

  // Verified
  const { count: verified } = await supabase
    .from('user_documents')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('is_verified', true);

  return {
    total: total || 0,
    local: local || 0,
    synced: synced || 0,
    verified: verified || 0,
  };
}

/**
 * Link document to credential
 * @param {string} credentialId - Credential ID
 * @param {string} documentId - Document ID
 * @returns {Promise<Object>} Updated credential
 */
export async function linkDocumentToCredential(credentialId, documentId) {
  // Get current documents array
  const { data: credential } = await supabase
    .from('credentials')
    .select('documents')
    .eq('id', credentialId)
    .single();

  const documents = credential?.documents || [];
  
  // Add document ID if not already present
  if (!documents.includes(documentId)) {
    documents.push(documentId);
  }

  // Update credential
  const { data: updated, error } = await supabase
    .from('credentials')
    .update({ documents })
    .eq('id', credentialId)
    .select()
    .single();

  if (error) {
    console.error('Database error linking document to credential:', error);
    throw new Error('Failed to link document');
  }

  return updated;
}

/**
 * Get documents for a credential
 * @param {string} credentialId - Credential ID
 * @returns {Promise<Array>} Array of documents
 */
export async function getCredentialDocuments(credentialId) {
  // Get credential with documents array
  const { data: credential, error: credError } = await supabase
    .from('credentials')
    .select('documents')
    .eq('id', credentialId)
    .single();

  if (credError) {
    console.error('Database error getting credential:', credError);
    throw new Error('Failed to get credential');
  }

  if (!credential?.documents || credential.documents.length === 0) {
    return [];
  }

  // Get all documents
  const { data: documents, error: docError } = await supabase
    .from('user_documents')
    .select('*')
    .in('id', credential.documents);

  if (docError) {
    console.error('Database error getting documents:', docError);
    throw new Error('Failed to get documents');
  }

  return documents || [];
}
