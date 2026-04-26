/**
 * useSharedAccess — gestión de accesos compartidos a documentos
 * Almacena en localStorage. Sin backend adicional.
 */

import { useState, useEffect, useCallback } from 'react';

const STORAGE_KEY = 'ownly_shared_access';

function loadAccesses() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
  } catch {
    return [];
  }
}

function saveAccesses(accesses) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(accesses));
}

export function useSharedAccess() {
  const [accesses, setAccesses] = useState(loadAccesses);

  // Crear acceso compartido
  const createAccess = useCallback((doc, durationLabel) => {
    const durationMs = durationLabel === '10min' ? 10 * 60000
      : durationLabel === '1h' ? 3600000
      : 86400000; // 24h

    const access = {
      id: crypto.randomUUID(),
      docId: doc.id,
      docTitle: doc.title || doc.documentType,
      docType: doc.documentType,
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + durationMs).toISOString(),
      duration: durationLabel,
      status: 'active', // active | revoked | expired
    };

    const updated = [access, ...loadAccesses()];
    saveAccesses(updated);
    setAccesses(updated);
    return access;
  }, []);

  // Revocar acceso
  const revokeAccess = useCallback((accessId) => {
    const updated = loadAccesses().map(a =>
      a.id === accessId ? { ...a, status: 'revoked' } : a
    );
    saveAccesses(updated);
    setAccesses(updated);
  }, []);

  // Validar acceso (para la página pública)
  const validateAccess = useCallback((accessId) => {
    const all = loadAccesses();
    const access = all.find(a => a.id === accessId);
    if (!access) return { valid: false, reason: 'Acceso no encontrado' };
    if (access.status === 'revoked') return { valid: false, reason: 'Acceso revocado' };
    if (new Date(access.expiresAt) < new Date()) {
      // Marcar como expirado
      const updated = all.map(a => a.id === accessId ? { ...a, status: 'expired' } : a);
      saveAccesses(updated);
      setAccesses(updated);
      return { valid: false, reason: 'Acceso expirado' };
    }
    return { valid: true, access };
  }, []);

  // Limpiar expirados al cargar
  useEffect(() => {
    const now = new Date();
    const updated = loadAccesses().map(a =>
      a.status === 'active' && new Date(a.expiresAt) < now
        ? { ...a, status: 'expired' }
        : a
    );
    saveAccesses(updated);
    setAccesses(updated);
  }, []);

  const activeAccesses = accesses.filter(a => a.status === 'active');
  const allAccesses = accesses;

  return { accesses: allAccesses, activeAccesses, createAccess, revokeAccess, validateAccess };
}
