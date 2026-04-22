/**
 * Document Routes
 * Endpoints for document management
 * Backend stores encrypted blobs only - never decrypts
 */

import { Router } from 'express';
import { z } from 'zod';
import * as documentService from '../services/documentService.js';

export const documentRouter = Router();

// ── POST /api/documents/upload ────────────────────────────────────────────────
/**
 * Upload a document
 * Frontend encrypts before sending
 * Backend stores encrypted blob only
 * 
 * Body: { userId, documentType, fileName, fileSize, mimeType, encryptionKeyHash, iv, authTag, verificationHash }
 * Returns: { documentId, storageLocation }
 */
const UploadSchema = z.object({
  userId: z.string().min(1),
  documentType: z.string().min(1),
  fileName: z.string().min(1),
  fileSize: z.number().positive(),
  mimeType: z.string().min(1),
  encryptionKeyHash: z.string().min(1),
  iv: z.string().min(1),
  authTag: z.string().min(1),
  verificationHash: z.string().min(1),
});

documentRouter.post('/upload', async (req, res, next) => {
  try {
    const parsed = UploadSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        error: 'Invalid request',
        details: parsed.error.flatten(),
      });
    }

    const data = parsed.data;

    // Validate document type
    if (!Object.values(documentService.DOCUMENT_TYPES).includes(data.documentType)) {
      return res.status(400).json({
        error: 'Invalid document type',
        validTypes: Object.values(documentService.DOCUMENT_TYPES),
      });
    }

    // Create document record
    const document = await documentService.createDocument(data.userId, {
      documentType: data.documentType,
      fileName: data.fileName,
      fileSize: data.fileSize,
      mimeType: data.mimeType,
      encryptionKeyHash: data.encryptionKeyHash,
      iv: data.iv,
      authTag: data.authTag,
      verificationHash: data.verificationHash,
      storageLocation: 'local',
    });

    return res.json({
      success: true,
      documentId: document.id,
      storageLocation: document.storage_location,
      message: 'Document uploaded successfully',
    });
  } catch (err) {
    console.error('Document upload error:', err);
    next(err);
  }
});

// ── GET /api/documents/:documentId ────────────────────────────────────────────
/**
 * Get document metadata
 * Returns metadata only - encrypted content handled by frontend
 * 
 * Params: documentId
 * Returns: { id, documentType, fileName, fileSize, uploadedAt, status }
 */
documentRouter.get('/:documentId', async (req, res, next) => {
  try {
    const { documentId } = req.params;

    const document = await documentService.getDocument(documentId);

    return res.json({
      success: true,
      document,
    });
  } catch (err) {
    console.error('Get document error:', err);
    next(err);
  }
});

// ── GET /api/documents/user/:userId ──────────────────────────────────────────
/**
 * Get all documents for a user
 * Returns metadata only
 * 
 * Params: userId
 * Returns: Array of documents
 */
documentRouter.get('/user/:userId', async (req, res, next) => {
  try {
    const { userId } = req.params;

    const documents = await documentService.getUserDocuments(userId);

    return res.json({
      success: true,
      documents,
      count: documents.length,
    });
  } catch (err) {
    console.error('Get user documents error:', err);
    next(err);
  }
});

// ── GET /api/documents/type/:documentType ────────────────────────────────────
/**
 * Get documents by type for a user
 * Query: ?userId=...
 * 
 * Params: documentType
 * Returns: Array of documents
 */
documentRouter.get('/type/:documentType', async (req, res, next) => {
  try {
    const { documentType } = req.params;
    const { userId } = req.query;

    if (!userId) {
      return res.status(400).json({ error: 'userId query parameter required' });
    }

    const documents = await documentService.getDocumentsByType(userId, documentType);

    return res.json({
      success: true,
      documents,
      count: documents.length,
    });
  } catch (err) {
    console.error('Get documents by type error:', err);
    next(err);
  }
});

// ── DELETE /api/documents/:documentId ────────────────────────────────────────
/**
 * Delete a document
 * 
 * Params: documentId
 * Returns: { success: true }
 */
documentRouter.delete('/:documentId', async (req, res, next) => {
  try {
    const { documentId } = req.params;

    await documentService.deleteDocument(documentId);

    return res.json({
      success: true,
      message: 'Document deleted successfully',
    });
  } catch (err) {
    console.error('Delete document error:', err);
    next(err);
  }
});

// ── POST /api/documents/sync ─────────────────────────────────────────────────
/**
 * Sync documents to cloud
 * Body: { documentIds }
 * Returns: { synced: [...], failed: [...] }
 */
const SyncSchema = z.object({
  documentIds: z.array(z.string()).min(1),
});

documentRouter.post('/sync', async (req, res, next) => {
  try {
    const parsed = SyncSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        error: 'Invalid request',
        details: parsed.error.flatten(),
      });
    }

    const { documentIds } = parsed.data;
    const synced = [];
    const failed = [];

    for (const documentId of documentIds) {
      try {
        await documentService.syncDocumentToCloud(documentId, null);
        synced.push(documentId);
      } catch (err) {
        console.error(`Failed to sync document ${documentId}:`, err);
        failed.push({ documentId, error: err.message });
      }
    }

    return res.json({
      success: true,
      synced,
      failed,
      message: `Synced ${synced.length} documents, ${failed.length} failed`,
    });
  } catch (err) {
    console.error('Sync documents error:', err);
    next(err);
  }
});

// ── GET /api/documents/stats/:userId ─────────────────────────────────────────
/**
 * Get document statistics for a user
 * 
 * Params: userId
 * Returns: { total, local, synced, verified }
 */
documentRouter.get('/stats/:userId', async (req, res, next) => {
  try {
    const { userId } = req.params;

    const stats = await documentService.getDocumentStats(userId);

    return res.json({
      success: true,
      stats,
    });
  } catch (err) {
    console.error('Get document stats error:', err);
    next(err);
  }
});

// ── GET /api/documents/types ─────────────────────────────────────────────────
/**
 * Get available document types
 * Returns: { types: {...}, labels: {...} }
 */
documentRouter.get('/types', (req, res) => {
  return res.json({
    success: true,
    types: documentService.DOCUMENT_TYPES,
    labels: documentService.DOCUMENT_LABELS,
  });
});

export default documentRouter;
