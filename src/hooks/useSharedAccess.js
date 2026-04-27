/**
 * useSharedAccess — gestión de accesos compartidos a documentos
 * Al compartir, guarda una copia desencriptada del documento en localStorage
 * protegida por el access_id. El receptor puede verla desde el link.
 */

import { useState, useEffect, useCallback } from 'react';

const STORAGE_KEY = 'ownly_shared_access';
const CONTENT_KEY = 'ownly_shared_content';

function loadAccesses() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'); } catch { return []; }
}
function saveAccesses(a) { localStorage.setItem(STORAGE_KEY, JSON.stringify(a)); }

function loadContent(accessId) {
  try { return JSON.parse(localStorage.getItem(`${CONTENT_KEY}_${accessId}`) || 'null'); } catch { return null; }
}
function saveContent(accessId, content) {
  localStorage.setItem(`${CONTENT_KEY}_${accessId}`, JSON.stringify(content));
}
function deleteContent(accessId) {
  localStorage.removeItem(`${CONTENT_KEY}_${accessId}`);
}

export function useSharedAccess() {
  const [accesses, setAccesses] = useState(loadAccesses);

  // Crear acceso compartido — codifica todo en el token de la URL
  const createAccess = useCallback((doc, durationLabel, decryptedContent) => {
    const durationMs = durationLabel === '10min' ? 10 * 60000
      : durationLabel === '1h' ? 3600000
      : 86400000;

    const accessId = crypto.randomUUID();

    const access = {
      id: accessId,
      docId: doc.id,
      docTitle: doc.title || doc.documentType,
      docType: doc.documentType,
      mimeType: doc.mimeType,
      fileName: doc.fileName,
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + durationMs).toISOString(),
      duration: durationLabel,
      status: 'active',
    };

    // Guardar contenido en localStorage del propietario (para acceso desde mismo dispositivo)
    if (decryptedContent) {
      saveContent(accessId, { data: decryptedContent, mimeType: doc.mimeType, fileName: doc.fileName });
    }

    // También guardar el acceso con el contenido embebido para generar URL self-contained
    const accessWithContent = decryptedContent
      ? { ...access, content: decryptedContent }
      : access;

    // Guardar en localStorage del propietario
    const updated = [access, ...loadAccesses()];
    saveAccesses(updated);
    setAccesses(updated);

    return { access, accessWithContent };
  }, []);

  // Revocar — también elimina el contenido
  const revokeAccess = useCallback((accessId) => {
    const updated = loadAccesses().map(a =>
      a.id === accessId ? { ...a, status: 'revoked' } : a
    );
    saveAccesses(updated);
    deleteContent(accessId);
    setAccesses(updated);
  }, []);

  // Validar acceso
  const validateAccess = useCallback((accessId) => {
    const all = loadAccesses();
    const access = all.find(a => a.id === accessId);
    if (!access) return { valid: false, reason: 'Acceso no encontrado' };
    if (access.status === 'revoked') return { valid: false, reason: 'Acceso revocado por el propietario' };
    if (new Date(access.expiresAt) < new Date()) {
      const updated = all.map(a => a.id === accessId ? { ...a, status: 'expired' } : a);
      saveAccesses(updated);
      deleteContent(accessId);
      setAccesses(updated);
      return { valid: false, reason: 'Este acceso ha expirado' };
    }
    return { valid: true, access };
  }, []);

  // Obtener contenido del documento para el receptor
  const getSharedContent = useCallback((accessId) => {
    return loadContent(accessId);
  }, []);

  useEffect(() => {
    const now = new Date();
    const updated = loadAccesses().map(a => {
      if (a.status === 'active' && new Date(a.expiresAt) < now) {
        deleteContent(a.id);
        return { ...a, status: 'expired' };
      }
      return a;
    });
    saveAccesses(updated);
    setAccesses(updated);
  }, []);

  return {
    accesses,
    activeAccesses: accesses.filter(a => a.status === 'active'),
    createAccess,
    revokeAccess,
    validateAccess,
    getSharedContent,
  };
}
