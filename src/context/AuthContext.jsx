/**
 * Auth Context
 * Manages user authentication and session
 */

import { createContext, useState, useEffect, useCallback } from 'react';
import { isBiometricAvailable, authenticateWithBiometric, getBiometricCredentialId } from '@/utils/biometric';

export const AuthContext = createContext();

/**
 * Hash password using Web Crypto API (SHA-256 + salt)
 */
async function hashPassword(password, salt) {
  const encoder = new TextEncoder();
  const data = encoder.encode(password + salt);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hashBuffer))
    .map(b => b.toString(16).padStart(2, '0')).join('');
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authMethod, setAuthMethod] = useState(null); // 'metamask', 'biometric', 'email'
  const [biometricAvailable, setBiometricAvailable] = useState(false);

  // Check if user is already logged in
  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      // Check localStorage for existing session
      const storedUser = localStorage.getItem('ownly_user');
      const storedAuthMethod = localStorage.getItem('ownly_auth_method');
      
      if (storedUser) {
        setUser(JSON.parse(storedUser));
        setAuthMethod(storedAuthMethod);
      }

      // Check if biometric is available
      const available = await isBiometricAvailable();
      const credentialId = getBiometricCredentialId();
      setBiometricAvailable(available && !!credentialId);
    } catch (err) {
      console.error('Error checking auth:', err);
    } finally {
      setLoading(false);
    }
  };

  const loginWithMetamask = useCallback(async (address, chainId) => {
    try {
      const userData = {
        id: address,
        address: address,
        chainId: chainId,
        type: 'wallet',
        loginTime: new Date().toISOString(),
      };

      setUser(userData);
      setAuthMethod('metamask');
      localStorage.setItem('ownly_user', JSON.stringify(userData));
      localStorage.setItem('ownly_auth_method', 'metamask');
      localStorage.setItem('ownly_userId', address); // For KYC compatibility

      return userData;
    } catch (err) {
      throw new Error(`Metamask login failed: ${err.message}`);
    }
  }, []);

  const loginWithBiometric = useCallback(async () => {
    try {
      const credentialId = getBiometricCredentialId();
      if (!credentialId) {
        throw new Error('Biometric not registered');
      }

      // Authenticate with biometric
      await authenticateWithBiometric(credentialId);

      // Get user ID from localStorage
      const userId = localStorage.getItem('ownly_userId');
      if (!userId) {
        throw new Error('User ID not found. Please complete KYC first.');
      }

      const userData = {
        id: userId,
        userId: userId,
        type: 'biometric',
        loginTime: new Date().toISOString(),
      };

      setUser(userData);
      setAuthMethod('biometric');
      localStorage.setItem('ownly_user', JSON.stringify(userData));
      localStorage.setItem('ownly_auth_method', 'biometric');

      return userData;
    } catch (err) {
      throw new Error(`Biometric login failed: ${err.message}`);
    }
  }, []);

  const loginWithEmail = useCallback(async (email, password) => {
    try {
      if (!email || !password) throw new Error('Email y contraseña requeridos');

      const usersDB = JSON.parse(localStorage.getItem('ownly_users_db') || '{}');
      const stored = usersDB[email.toLowerCase()];

      if (!stored) {
        throw new Error('No existe una cuenta con ese email. Regístrate primero.');
      }

      const hash = await hashPassword(password, stored.salt);
      if (hash !== stored.passwordHash) {
        throw new Error('Contraseña incorrecta.');
      }

      const userData = {
        id: email,
        email: email,
        type: 'email',
        loginTime: new Date().toISOString(),
      };

      setUser(userData);
      setAuthMethod('email');
      localStorage.setItem('ownly_user', JSON.stringify(userData));
      localStorage.setItem('ownly_auth_method', 'email');
      localStorage.setItem('ownly_userId', email);

      return userData;
    } catch (err) {
      throw new Error(err.message || 'Error al iniciar sesión');
    }
  }, []);

  const registerWithEmail = useCallback(async (email, password) => {
    try {
      if (!email || !password) throw new Error('Email y contraseña requeridos');

      // Intentar cargar desde localStorage (mismo dispositivo/navegador)
      const usersDB = JSON.parse(localStorage.getItem('ownly_users_db') || '{}');

      if (usersDB[email.toLowerCase()]) {
        throw new Error('Ya existe una cuenta con ese email.');
      }

      const salt = Array.from(crypto.getRandomValues(new Uint8Array(16)))
        .map(b => b.toString(16).padStart(2, '0')).join('');
      const passwordHash = await hashPassword(password, salt);

      usersDB[email.toLowerCase()] = { passwordHash, salt, createdAt: new Date().toISOString() };
      localStorage.setItem('ownly_users_db', JSON.stringify(usersDB));

      const userData = {
        id: email,
        email: email,
        type: 'email',
        loginTime: new Date().toISOString(),
      };

      setUser(userData);
      setAuthMethod('email');
      localStorage.setItem('ownly_user', JSON.stringify(userData));
      localStorage.setItem('ownly_auth_method', 'email');
      localStorage.setItem('ownly_userId', email);

      return userData;
    } catch (err) {
      throw new Error(err.message || 'Error al registrarse');
    }
  }, []);

  const loginWithGoogle = useCallback(async (credential) => {
    try {
      // Decode JWT to get user info
      const base64Url = credential.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
      }).join(''));
      
      const payload = JSON.parse(jsonPayload);
      
      const userData = {
        id: payload.sub,
        email: payload.email,
        name: payload.name,
        picture: payload.picture,
        type: 'google',
        loginTime: new Date().toISOString(),
      };

      setUser(userData);
      setAuthMethod('google');
      localStorage.setItem('ownly_user', JSON.stringify(userData));
      localStorage.setItem('ownly_auth_method', 'google');
      localStorage.setItem('ownly_userId', payload.email);

      return userData;
    } catch (err) {
      throw new Error(`Google login failed: ${err.message}`);
    }
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    setAuthMethod(null);
    localStorage.removeItem('ownly_user');
    localStorage.removeItem('ownly_auth_method');
    localStorage.removeItem('ownly_userId');
  }, []);

  const isAuthenticated = !!user;

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        authMethod,
        biometricAvailable,
        isAuthenticated,
        loginWithMetamask,
        loginWithBiometric,
        loginWithEmail,
        loginWithGoogle,
        registerWithEmail,
        logout,
        checkAuth,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
