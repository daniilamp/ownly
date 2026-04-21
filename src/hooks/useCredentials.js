import { useState, useEffect } from 'react';

const STORAGE_KEY = 'ownly_credentials';

// Simple base64 encoding (for dev - use proper encryption in prod)
const encode = (str) => btoa(JSON.stringify(str));
const decode = (str) => JSON.parse(atob(str));

export function useCredentials() {
  const [credentials, setCredentials] = useState([]);
  const [loading, setLoading] = useState(true);

  // Cargar credenciales al montar
  useEffect(() => {
    loadCredentials();
  }, []);

  // Cargar desde localStorage
  const loadCredentials = () => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        setCredentials(decode(stored));
      }
      setLoading(false);
    } catch (err) {
      console.error('Error loading credentials:', err);
      setLoading(false);
    }
  };

  // Guardar credenciales
  const saveCredential = (credential) => {
    try {
      const newCreds = [...credentials, { ...credential, id: Date.now(), createdAt: new Date().toISOString() }];
      localStorage.setItem(STORAGE_KEY, encode(newCreds));
      setCredentials(newCreds);
      return newCreds[newCreds.length - 1];
    } catch (err) {
      console.error('Error saving credential:', err);
      return null;
    }
  };

  // Eliminar credencial
  const deleteCredential = (id) => {
    try {
      const newCreds = credentials.filter(c => c.id !== id);
      localStorage.setItem(STORAGE_KEY, encode(newCreds));
      setCredentials(newCreds);
    } catch (err) {
      console.error('Error deleting credential:', err);
    }
  };

  // Generar QR data
  const generateQRData = (credentialId) => {
    const cred = credentials.find(c => c.id === credentialId);
    if (!cred) return null;
    
    // Crear un token que incluya el ID de la credencial
    const qrData = {
      type: 'ownly_credential',
      credentialId,
      timestamp: Date.now(),
      expiresAt: Date.now() + 24 * 60 * 60 * 1000, // 24 horas
    };
    
    return JSON.stringify(qrData);
  };

  return {
    credentials,
    loading,
    saveCredential,
    deleteCredential,
    generateQRData,
  };
}
