/**
 * Auth Context
 * Manages user authentication and session
 */

import { createContext, useState, useEffect, useCallback } from 'react';
import { isBiometricAvailable, authenticateWithBiometric, getBiometricCredentialId } from '@/utils/biometric';

export const AuthContext = createContext();

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

      const apiUrl = import.meta.env.VITE_OWNLY_API_URL || 'http://localhost:3001';
      const res = await fetch(`${apiUrl}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al iniciar sesión');

      const userData = {
        id: data.userId,
        email: data.email,
        type: 'email',
        loginTime: new Date().toISOString(),
      };

      setUser(userData);
      setAuthMethod('email');
      localStorage.setItem('ownly_user', JSON.stringify(userData));
      localStorage.setItem('ownly_auth_method', 'email');
      localStorage.setItem('ownly_userId', data.email);

      return userData;
    } catch (err) {
      throw new Error(err.message || 'Error al iniciar sesión');
    }
  }, []);

  const registerWithEmail = useCallback(async (email, password) => {
    try {
      if (!email || !password) throw new Error('Email y contraseña requeridos');

      const apiUrl = import.meta.env.VITE_OWNLY_API_URL || 'http://localhost:3001';
      const res = await fetch(`${apiUrl}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al registrarse');

      // Login automático tras registro
      return await loginWithEmail(email, password);
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
