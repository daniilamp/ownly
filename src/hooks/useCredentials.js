import { useState, useEffect } from 'react';

const STORAGE_KEY = 'ownly_credentials';
const API_URL = import.meta.env.VITE_OWNLY_API_URL || 'http://localhost:3001';

// Simple base64 encoding (for dev - use proper encryption in prod)
const encode = (str) => btoa(JSON.stringify(str));
const decode = (str) => JSON.parse(atob(str));

export function useCredentials() {
  const [credentials, setCredentials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState(null);

  // Cargar credenciales al montar
  useEffect(() => {
    loadCredentials();
  }, []);

  // Cargar desde backend
  const loadCredentials = async () => {
    try {
      // Try to get userId from localStorage (saved during KYC)
      const storedUserId = localStorage.getItem('ownly_userId');
      
      if (storedUserId) {
        setUserId(storedUserId);
        
        // Fetch from backend
        const response = await fetch(`${API_URL}/api/kyc/user/${storedUserId}`);
        if (response.ok) {
          const data = await response.json();
          const backendCredentials = data.credentials || [];
          
          // Transform backend credentials to frontend format
          const transformed = backendCredentials.map(cred => ({
            id: cred.id,
            type: cred.credential_type || cred.type || 'identity_verified',
            name: cred.credential_name || (cred.credential_type === 'identity_verified' ? 'Identidad Verificada' : cred.credential_type),
            number: cred.id?.slice(0, 8).toUpperCase(),
            issuer: cred.issuer || 'Ownly KYC',
            status: cred.status,
            issuanceDate: cred.credential_data?.issuanceDate || cred.created_at,
            expiryDate: cred.expires_at || cred.credential_data?.expirationDate,
            blockchainTxHash: cred.blockchain_tx_hash || cred.tx_hash,
            createdAt: cred.created_at,
            source: 'backend',
          }));
          
          setCredentials(transformed);
          setLoading(false);
          return;
        }
      }
      
      // Fallback to localStorage
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        setCredentials(decode(stored));
      }
      setLoading(false);
    } catch (err) {
      console.error('Error loading credentials:', err);
      // Fallback to localStorage
      try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
          setCredentials(decode(stored));
        }
      } catch (e) {
        console.error('Error loading from localStorage:', e);
      }
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
