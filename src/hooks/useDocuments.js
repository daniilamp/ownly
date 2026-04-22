/**
 * useDocuments Hook
 * Manages document upload, storage, and retrieval
 */

import { useState, useEffect } from 'react';
import { encryptDocument, arrayBufferToBase64, base64ToArrayBuffer } from '@/utils/encryption';

const STORAGE_KEY = 'ownly_documents';
const DB_NAME = 'ownly_db';
const STORE_NAME = 'documents';

/**
 * Initialize IndexedDB
 */
function initDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };
  });
}

/**
 * Save document to IndexedDB
 */
async function saveToIndexedDB(document) {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.add(document);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
  });
}

/**
 * Load documents from IndexedDB
 */
async function loadFromIndexedDB() {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.getAll();

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
  });
}

/**
 * Delete document from IndexedDB
 */
async function deleteFromIndexedDB(id) {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.delete(id);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve();
  });
}

export function useDocuments() {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState(null);

  // Load documents on mount
  useEffect(() => {
    loadDocuments();
  }, []);

  const loadDocuments = async () => {
    try {
      const storedUserId = localStorage.getItem('ownly_userId');
      setUserId(storedUserId);

      // Load from IndexedDB
      let docs = await loadFromIndexedDB();
      
      // Filter out documents without salt (old format)
      docs = docs.filter(doc => doc.salt);
      
      // Filter by current user
      const userDocs = storedUserId
        ? docs.filter(doc => doc.userId === storedUserId)
        : docs;

      setDocuments(userDocs);
      setLoading(false);
    } catch (err) {
      console.error('Error loading documents:', err);
      setLoading(false);
    }
  };

  const uploadDocument = async (documentData) => {
    try {
      const storedUserId = localStorage.getItem('ownly_userId');
      if (!storedUserId) {
        throw new Error('User ID not found. Please complete KYC first.');
      }

      // Encrypt the file
      const { encryptedData, iv, salt } = await encryptDocument(
        documentData.fileData,
        documentData.password
      );

      // Create document record
      const document = {
        id: `doc_${Date.now()}`,
        userId: storedUserId,
        documentType: documentData.documentType,
        fileName: documentData.fileName,
        fileSize: documentData.fileSize,
        mimeType: documentData.mimeType,
        encryptedData: arrayBufferToBase64(encryptedData),
        iv: arrayBufferToBase64(iv),
        salt: arrayBufferToBase64(salt),
        uploadedAt: new Date().toISOString(),
        status: 'local',
      };

      // Save to IndexedDB
      await saveToIndexedDB(document);

      // Update state
      setDocuments([...documents, document]);

      return document;
    } catch (err) {
      throw new Error(`Upload failed: ${err.message}`);
    }
  };

  const deleteDocument = async (documentId) => {
    try {
      // Delete from IndexedDB
      await deleteFromIndexedDB(documentId);

      // Update state
      setDocuments(documents.filter(doc => doc.id !== documentId));
    } catch (err) {
      throw new Error(`Delete failed: ${err.message}`);
    }
  };

  const getDocument = (documentId) => {
    return documents.find(doc => doc.id === documentId);
  };

  const getDecryptedDocument = async (documentId, password) => {
    const document = getDocument(documentId);
    if (!document) {
      throw new Error('Document not found');
    }

    // Validate required fields
    if (!document.encryptedData || !document.iv) {
      throw new Error('Document is missing encryption data');
    }

    if (!document.salt) {
      throw new Error('Document is missing salt. Please re-upload the document.');
    }

    // Convert from Base64
    const encryptedData = base64ToArrayBuffer(document.encryptedData);
    const iv = base64ToArrayBuffer(document.iv);
    const salt = base64ToArrayBuffer(document.salt);

    // Return data for decryption
    return {
      ...document,
      encryptedData,
      iv,
      salt,
    };
  };

  return {
    documents,
    loading,
    userId,
    uploadDocument,
    deleteDocument,
    getDocument,
    getDecryptedDocument,
    reload: loadDocuments,
  };
}
