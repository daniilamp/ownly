/**
 * useSharedAccess — gestión de accesos compartidos
 * Guarda en Supabase via backend. Link corto, funciona en cualquier dispositivo.
 */

import { useState, useEffect, useCallback } from 'react';

const API_URL = import.meta.env.VITE_OWNLY_API_URL || 'http://localhost:3001';
const LOCAL_KEY = 'ownly_my_accesses'; // solo para mostrar lista al propietario

function loadMyAccesses() {
  try { return JSON.parse(localStorage.getItem(LOCAL_KEY) || '[]'); } catch { return []; }
}
function saveMyAccesses(a) { localStorage.setItem(LOCAL_KEY, JSON.stringify(a)); }

export function useSharedAccess() {
  const [accesses, setAccesses] = useState(loadMyAccesses);

  // Crear acceso — sube contenido al backend, devuelve link corto
  const createAccess = useCallback(async (doc, durationLabel, decryptedContent) => {
    const durationMs = durationLabel === '10min' ? 10 * 60000
      : durationLabel === '1h' ? 3600000
      : 86400000;

    const accessId = crypto.randomUUID();
    const expiresAt = new Date(Date.now() + durationMs).toISOString();

    // Subir al backend
    const res = await fetch(`${API_URL}/api/access`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        accessId,
        docTitle: doc.title || doc.documentType,
        docType: doc.documentType,
        mimeType: doc.mimeType,
        fileName: doc.fileName,
        expiresAt,
        content: decryptedContent,
      }),
    });

    if (!res.ok) throw new Error('Error al crear acceso');

    const access = {
      id: accessId,
      docId: doc.id,
      docTitle: doc.title || doc.documentType,
      docType: doc.documentType,
      mimeType: doc.mimeType,
      fileName: doc.fileName,
      createdAt: new Date().toISOString(),
      expiresAt,
      duration: durationLabel,
      status: 'active',
    };

    // Guardar en localStorage solo para mostrar la lista al propietario
    const updated = [access, ...loadMyAccesses()];
    saveMyAccesses(updated);
    setAccesses(updated);
    return access;
  }, []);

  // Revocar
  const revokeAccess = useCallback(async (accessId) => {
    try {
      await fetch(`${API_URL}/api/access/${accessId}`, { method: 'DELETE' });
    } catch (e) {
      console.warn('Error revoking on backend:', e);
    }
    const updated = loadMyAccesses().map(a =>
      a.id === accessId ? { ...a, status: 'revoked' } : a
    );
    saveMyAccesses(updated);
    setAccesses(updated);
  }, []);

  // Validar acceso (consulta backend)
  const validateAccess = useCallback(async (accessId) => {
    try {
      const res = await fetch(`${API_URL}/api/access/${accessId}`);
      return await res.json();
    } catch {
      return { valid: false, reason: 'Error de conexión' };
    }
  }, []);

  // Limpiar expirados locales
  useEffect(() => {
    const now = new Date();
    const updated = loadMyAccesses().map(a =>
      a.status === 'active' && new Date(a.expiresAt) < now ? { ...a, status: 'expired' } : a
    );
    saveMyAccesses(updated);
    setAccesses(updated);
  }, []);

  return {
    accesses,
    activeAccesses: accesses.filter(a => a.status === 'active'),
    createAccess,
    revokeAccess,
    validateAccess,
  };
}
