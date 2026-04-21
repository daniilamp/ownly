import { useState, useEffect } from 'react';
import CryptoJS from 'crypto-js';

const STORAGE_KEY = 'ownly_credentials';
const SECRET_KEY = 'ownly-secret-key-dev'; // En prod, usar algo más seguro

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
      const encrypted = localStorage.getItem(STORAGE_KEY);
      if (encrypted) {
        const decrypted = CryptoJS.AES.decrypt(encrypted, SECRET_KEY).toString(CryptoJS.enc.Utf8);
        setCredentials(JSON.parse(decrypted));
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
      const encrypted = CryptoJS.AES.encrypt(JSON.stringify(newCreds), SECRET_KEY).toString();
      localStorage.setItem(STORAGE_KEY, encrypted);
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
      const encrypted = CryptoJS.AES.encrypt(JSON.stringify(newCreds), SECRET_KEY).toString();
      localStorage.setItem(STORAGE_KEY, encrypted);
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
