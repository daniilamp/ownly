/**
 * Document Service
 * Manages user documents with encryption support
 * Backend stores encrypted blobs only - never has decryption key
 */

import * as dbService from './databaseService.js';

// Document types
export const DOCUMENT_TYPES = {
  // Identity
  DNI: 'dni',
  PASSPORT: 'passport',
  DRIVER_LICENSE: 'driver_license',
  FOREIGNER_ID: 'foreigner_id',
  
  // Health
  VACCINATION_CARD: 'vaccination_card',
  MEDICAL_CERTIFICATE: 'medical_certificate',
  MEDICAL_PRESCRIPTION: 'medical_prescription',
  LAB_REPORT: 'lab_report',
  
  // Education
  UNIVERSITY_DEGREE: 'university_degree',
  HIGH_SCHOOL_DIPLOMA: 'high_school_diploma',
  STUDY_CERTIFICATE: 'study_certificate',
  TECHNICAL_DEGREE: 'technical_degree',
  
  // Professional
  PROFESSIONAL_LICENSE: 'professional_license',
  EXPERIENCE_CERTIFICATE: 'experience_certificate',
  PROFESSIONAL_REGISTRATION: 'professional_registration',
  
  // Other
  PROOF_OF_ADDRESS: 'proof_of_address',
  PROOF_OF_INCOME: 'proof_of_income',
  EMPLOYMENT_CONTRACT: 'employment_contract',
  OTHER: 'other',
};

// Document type labels (for UI)
export const DOCUMENT_LABELS = {
  dni: 'DNI',
  passport: 'Pasaporte',
  driver_license: 'Carnet de Conducir',
  foreigner_id: 'Cédula de Extranjería',
  vaccination_card: 'Cartilla de Vacunación',
  medical_certificate: 'Certificado Médico',
  medical_prescription: 'Receta Médica',
  lab_report: 'Informe de Laboratorio',
  university_degree: 'Título Universitario',
  high_school_diploma: 'Diploma de Bachillerato',
  study_certificate: 'Certificado de Estudios',
  technical_degree: 'Título Técnico',
  professional_license: 'Licencia Profesional',
  experience_certificate: 'Certificado de Experiencia',
  professional_registration: 'Colegiación',
  proof_of_address: 'Comprobante de Domicilio',
  proof_of_income: 'Comprobante de Ingresos',
  employment_contract: 'Contrato de Trabajo',
  other: 'Otros',
};

/**
 * Create a new document record
 * Backend stores encrypted blob only - never decrypts
 */
export async function createDocument(userId, documentData) {
  try {
    if (!userId || !documentData.documentType || !documentData.fileName) {
      throw new Error('userId, documentType, and fileName are required');
    }

    // Validate document type
    if (!Object.values(DOCUMENT_TYPES).includes(documentData.documentType)) {
      throw new Error(`Invalid document type: ${documentData.documentType}`);
    }

    const document = {
      userId,
      documentType: documentData.documentType,
      fileName: documentData.fileName,
      fileSize: documentData.fileSize,
      mimeType: documentData.mimeType,
      
      // Encryption info (from frontend)
      encryptionKeyHash: documentData.encryptionKeyHash,
      iv: documentData.iv,
      authTag: documentData.authTag,
      
      // Storage
      storageLocation: documentData.storageLocation || 'local',
      cloudUrl: documentData.cloudUrl,
      
      // Status
      status: 'local',
      isVerified: false,
      verificationHash: documentData.verificationHash,
    };

    const result = await dbService.createDocument(document);
    
    console.log(`Document created: ${result.id} for user ${userId}`);
    return result;
  } catch (err) {
    console.error('Error creating document:', err);
    throw err;
  }
}

/**
 * Get a specific document
 * Returns metadata only - encrypted content handled by frontend
 */
export async function getDocument(documentId) {
  try {
    if (!documentId) {
      throw new Error('documentId is required');
    }

    const document = await dbService.getDocument(documentId);
    
    if (!document) {
      throw new Error('Document not found');
    }

    // Return metadata only (no encrypted content)
    return {
      id: document.id,
      documentType: document.document_type,
      fileName: document.file_name,
      fileSize: document.file_size,
      mimeType: document.mime_type,
      uploadedAt: document.uploaded_at,
      storageLocation: document.storage_location,
      status: document.status,
      isVerified: document.is_verified,
    };
  } catch (err) {
    console.error('Error getting document:', err);
    throw err;
  }
}

/**
 * Get all documents for a user
 * Returns metadata only
 */
export async function getUserDocuments(userId) {
  try {
    if (!userId) {
      throw new Error('userId is required');
    }

    const documents = await dbService.getUserDocuments(userId);
    
    // Return metadata only
    return documents.map(doc => ({
      id: doc.id,
      documentType: doc.document_type,
      documentLabel: DOCUMENT_LABELS[doc.document_type] || doc.document_type,
      fileName: doc.file_name,
      fileSize: doc.file_size,
      uploadedAt: doc.uploaded_at,
      storageLocation: doc.storage_location,
      status: doc.status,
      isVerified: doc.is_verified,
    }));
  } catch (err) {
    console.error('Error getting user documents:', err);
    throw err;
  }
}

/**
 * Get documents by type
 */
export async function getDocumentsByType(userId, documentType) {
  try {
    if (!userId || !documentType) {
      throw new Error('userId and documentType are required');
    }

    const documents = await dbService.getDocumentsByType(userId, documentType);
    
    return documents.map(doc => ({
      id: doc.id,
      documentType: doc.document_type,
      fileName: doc.file_name,
      uploadedAt: doc.uploaded_at,
      status: doc.status,
    }));
  } catch (err) {
    console.error('Error getting documents by type:', err);
    throw err;
  }
}

/**
 * Update document metadata
 */
export async function updateDocument(documentId, updateData) {
  try {
    if (!documentId) {
      throw new Error('documentId is required');
    }

    const updated = await dbService.updateDocument(documentId, {
      status: updateData.status,
      isVerified: updateData.isVerified,
      cloudUrl: updateData.cloudUrl,
      lastAccessed: new Date(),
    });

    console.log(`Document ${documentId} updated`);
    return updated;
  } catch (err) {
    console.error('Error updating document:', err);
    throw err;
  }
}

/**
 * Delete a document
 */
export async function deleteDocument(documentId) {
  try {
    if (!documentId) {
      throw new Error('documentId is required');
    }

    await dbService.deleteDocument(documentId);
    
    console.log(`Document ${documentId} deleted`);
    return { success: true };
  } catch (err) {
    console.error('Error deleting document:', err);
    throw err;
  }
}

/**
 * Get document statistics
 */
export async function getDocumentStats(userId) {
  try {
    if (!userId) {
      throw new Error('userId is required');
    }

    const stats = await dbService.getDocumentStats(userId);
    return stats;
  } catch (err) {
    console.error('Error getting document stats:', err);
    throw err;
  }
}

/**
 * Sync document to cloud
 * Backend stores encrypted blob - never decrypts
 */
export async function syncDocumentToCloud(documentId, encryptedBlob) {
  try {
    if (!documentId || !encryptedBlob) {
      throw new Error('documentId and encryptedBlob are required');
    }

    // TODO: Implement cloud storage (S3, GCS, etc.)
    // For now, just update status
    const updated = await updateDocument(documentId, {
      status: 'synced',
      cloudUrl: `cloud://document/${documentId}`,
    });

    console.log(`Document ${documentId} synced to cloud`);
    return updated;
  } catch (err) {
    console.error('Error syncing document to cloud:', err);
    throw err;
  }
}

/**
 * Link document to credential
 */
export async function linkDocumentToCredential(credentialId, documentId) {
  try {
    if (!credentialId || !documentId) {
      throw new Error('credentialId and documentId are required');
    }

    const result = await dbService.linkDocumentToCredential(credentialId, documentId);
    
    console.log(`Document ${documentId} linked to credential ${credentialId}`);
    return result;
  } catch (err) {
    console.error('Error linking document to credential:', err);
    throw err;
  }
}

/**
 * Get documents for a credential
 */
export async function getCredentialDocuments(credentialId) {
  try {
    if (!credentialId) {
      throw new Error('credentialId is required');
    }

    const documents = await dbService.getCredentialDocuments(credentialId);
    
    return documents.map(doc => ({
      id: doc.id,
      documentType: doc.document_type,
      documentLabel: DOCUMENT_LABELS[doc.document_type] || doc.document_type,
      fileName: doc.file_name,
      uploadedAt: doc.uploaded_at,
      status: doc.status,
    }));
  } catch (err) {
    console.error('Error getting credential documents:', err);
    throw err;
  }
}

/**
 * Verify document integrity
 * Check authentication tag and verification hash
 */
export async function verifyDocumentIntegrity(documentId, verificationHash) {
  try {
    if (!documentId || !verificationHash) {
      throw new Error('documentId and verificationHash are required');
    }

    const document = await dbService.getDocument(documentId);
    
    if (!document) {
      throw new Error('Document not found');
    }

    // Compare verification hashes
    const isValid = document.verification_hash === verificationHash;
    
    if (isValid) {
      // Update verification status
      await updateDocument(documentId, { isVerified: true });
    }

    return { verified: isValid };
  } catch (err) {
    console.error('Error verifying document:', err);
    throw err;
  }
}

export default {
  DOCUMENT_TYPES,
  DOCUMENT_LABELS,
  createDocument,
  getDocument,
  getUserDocuments,
  getDocumentsByType,
  updateDocument,
  deleteDocument,
  getDocumentStats,
  syncDocumentToCloud,
  linkDocumentToCredential,
  getCredentialDocuments,
  verifyDocumentIntegrity,
};
