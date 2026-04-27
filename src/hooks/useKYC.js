/**
 * useKYC Hook
 * Manages KYC verification flow with Sumsub
 */

import { useState, useCallback } from 'react';

const API_URL = import.meta.env.VITE_OWNLY_API_URL || 'http://localhost:3001';

/**
 * Get auth headers with JWT token if available
 */
function getAuthHeaders() {
  const token = localStorage.getItem('ownly_token');
  const headers = { 'Content-Type': 'application/json' };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

export function useKYC() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [sdkToken, setSdkToken] = useState(null);
  const [applicantId, setApplicantId] = useState(null);
  const [status, setStatus] = useState(null);
  const [verification, setVerification] = useState(null);

  /**
   * Initialize KYC verification
   */
  const initKYC = useCallback(async (userData) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_URL}/api/kyc/init`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(userData),
      });

      if (!response.ok) {
        throw new Error('Failed to initialize KYC');
      }

      const data = await response.json();
      setSdkToken(data.sdkToken);
      setApplicantId(data.applicantId);
      setVerification({
        userId: userData.userId,
        email: userData.email,
        firstName: userData.firstName,
        lastName: userData.lastName,
      });

      return data;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Get verification status
   */
  const getStatus = useCallback(async (appId) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_URL}/api/kyc/status/${appId}`, {
        headers: getAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error('Failed to get status');
      }

      const data = await response.json();
      setStatus(data);
      return data;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Get user's KYC data
   */
  const getUserKYC = useCallback(async (userId) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_URL}/api/kyc/user/${userId}`, {
        headers: getAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error('Failed to get user KYC data');
      }

      const data = await response.json();
      setVerification(data.verification);
      return data;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Reset state
   */
  const reset = useCallback(() => {
    setSdkToken(null);
    setApplicantId(null);
    setStatus(null);
    setError(null);
  }, []);

  return {
    loading,
    error,
    sdkToken,
    applicantId,
    status,
    verification,
    initKYC,
    getStatus,
    getUserKYC,
    reset,
  };
}
