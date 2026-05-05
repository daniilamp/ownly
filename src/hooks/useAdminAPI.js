/**
 * useAdminAPI Hook
 * Centralized hook for admin API calls with authentication
 * 
 * Provides methods for:
 * - User management (list, get, update role, update status)
 * - API key management (list, revoke)
 * - Audit logs (access logs, role changes, security events)
 * - Statistics (user stats, API usage, system health, security summary)
 * 
 * Features:
 * - Automatic JWT token injection from localStorage
 * - Error handling with user-friendly messages
 * - Loading state management
 */

import { useState, useCallback } from 'react';

const API_BASE_URL = import.meta.env.VITE_OWNLY_API_URL || 'http://localhost:3001';

/**
 * Get JWT token from localStorage
 */
const getAuthToken = () => {
  return localStorage.getItem('ownly_token');
};

/**
 * Build query string from filters object
 */
const buildQueryString = (filters) => {
  if (!filters) return '';
  
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      params.append(key, value);
    }
  });
  
  const queryString = params.toString();
  return queryString ? `?${queryString}` : '';
};

/**
 * Make authenticated API request
 */
const makeRequest = async (endpoint, options = {}) => {
  const token = getAuthToken();
  
  if (!token) {
    throw new Error('Authentication required. Please log in again.');
  }

  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
    ...options.headers,
  };

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  const data = await response.json();

  if (!response.ok) {
    // Handle specific error cases
    if (response.status === 401) {
      throw new Error('Your session has expired. Please log in again.');
    }
    if (response.status === 403) {
      throw new Error('You do not have permission to perform this action.');
    }
    if (response.status === 404) {
      throw new Error('The requested resource was not found.');
    }
    if (response.status === 500) {
      throw new Error('An unexpected error occurred. Please try again later.');
    }
    
    // Use error message from API if available
    throw new Error(data.error || data.message || 'An error occurred');
  }

  return data;
};

/**
 * useAdminAPI Hook
 */
export function useAdminAPI() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // ============================================
  // USER MANAGEMENT METHODS
  // ============================================

  /**
   * List all users with optional filters
   * @param {Object} filters - { role, status, search, limit, offset }
   * @returns {Promise<Object>} { users, total, limit, offset }
   */
  const listUsers = useCallback(async (filters = {}) => {
    setLoading(true);
    setError(null);
    
    try {
      const queryString = buildQueryString(filters);
      const data = await makeRequest(`/api/admin/users${queryString}`);
      return data;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Get specific user by ID
   * @param {string} userId - User ID
   * @returns {Promise<Object>} User object
   */
  const getUserById = useCallback(async (userId) => {
    setLoading(true);
    setError(null);
    
    try {
      const data = await makeRequest(`/api/admin/users/${userId}`);
      return data.user;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Update user role
   * @param {string} userId - User ID
   * @param {string} role - New role (user, business, admin)
   * @param {string} reason - Reason for role change
   * @returns {Promise<Object>} Updated user object
   */
  const updateUserRole = useCallback(async (userId, role, reason) => {
    setLoading(true);
    setError(null);
    
    try {
      const data = await makeRequest(`/api/admin/users/${userId}/role`, {
        method: 'PUT',
        body: JSON.stringify({ role, reason }),
      });
      return data.user;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Update user status
   * @param {string} userId - User ID
   * @param {string} status - New status (active, inactive, suspended)
   * @param {string} reason - Reason for status change (optional)
   * @returns {Promise<Object>} Updated user object
   */
  const updateUserStatus = useCallback(async (userId, status, reason) => {
    setLoading(true);
    setError(null);
    
    try {
      const data = await makeRequest(`/api/admin/users/${userId}/status`, {
        method: 'PUT',
        body: JSON.stringify({ status, reason }),
      });
      return data.user;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // ============================================
  // API KEY MANAGEMENT METHODS
  // ============================================

  /**
   * List all API keys with optional filters
   * @param {Object} filters - { status, userId, limit }
   * @returns {Promise<Object>} { apiKeys, count }
   */
  const listAPIKeys = useCallback(async (filters = {}) => {
    setLoading(true);
    setError(null);
    
    try {
      const queryString = buildQueryString(filters);
      const data = await makeRequest(`/api/admin/api-keys${queryString}`);
      return data;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Revoke API key
   * @param {string} apiKeyId - API Key ID
   * @param {string} reason - Reason for revocation
   * @returns {Promise<Object>} Revoked API key object
   */
  const revokeAPIKey = useCallback(async (apiKeyId, reason) => {
    setLoading(true);
    setError(null);
    
    try {
      const data = await makeRequest(`/api/admin/api-keys/${apiKeyId}`, {
        method: 'DELETE',
        body: JSON.stringify({ reason }),
      });
      return data.apiKey;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // ============================================
  // AUDIT LOG METHODS
  // ============================================

  /**
   * Get access control logs
   * @param {Object} filters - { userId, accessGranted, endpoint, startDate, endDate, limit }
   * @returns {Promise<Object>} { logs, count }
   */
  const getAccessLogs = useCallback(async (filters = {}) => {
    setLoading(true);
    setError(null);
    
    try {
      const queryString = buildQueryString(filters);
      const data = await makeRequest(`/api/admin/logs/access${queryString}`);
      return data;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Get role change logs
   * @param {Object} filters - { userId, changedBy, limit }
   * @returns {Promise<Object>} { logs, count }
   */
  const getRoleChangeLogs = useCallback(async (filters = {}) => {
    setLoading(true);
    setError(null);
    
    try {
      const queryString = buildQueryString(filters);
      const data = await makeRequest(`/api/admin/logs/role-changes${queryString}`);
      return data;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Get security events
   * @param {Object} filters - { userId, endpoint, startDate, endDate, limit }
   * @returns {Promise<Object>} { events, count }
   */
  const getSecurityEvents = useCallback(async (filters = {}) => {
    setLoading(true);
    setError(null);
    
    try {
      const queryString = buildQueryString(filters);
      const data = await makeRequest(`/api/admin/logs/security${queryString}`);
      return data;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // ============================================
  // STATISTICS METHODS
  // ============================================

  /**
   * Get user statistics
   * @returns {Promise<Object>} User statistics
   */
  const getUserStats = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const data = await makeRequest('/api/admin/stats/users');
      return data.stats;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Get API usage statistics
   * @returns {Promise<Object>} API usage statistics
   */
  const getAPIUsageStats = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const data = await makeRequest('/api/admin/stats/api-usage');
      return data.stats;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Get system health status
   * @returns {Promise<Object>} System health data
   */
  const getSystemHealth = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const data = await makeRequest('/api/admin/health');
      return data.health;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Get security summary
   * @param {number} hours - Number of hours to look back (default: 24)
   * @returns {Promise<Object>} Security summary data
   */
  const getSecuritySummary = useCallback(async (hours = 24) => {
    setLoading(true);
    setError(null);
    
    try {
      const data = await makeRequest(`/api/admin/security/summary?hours=${hours}`);
      return data.summary;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    // User Management
    listUsers,
    getUserById,
    updateUserRole,
    updateUserStatus,
    
    // API Key Management
    listAPIKeys,
    revokeAPIKey,
    
    // Audit Logs
    getAccessLogs,
    getRoleChangeLogs,
    getSecurityEvents,
    
    // Statistics
    getUserStats,
    getAPIUsageStats,
    getSystemHealth,
    getSecuritySummary,
    
    // State
    loading,
    error,
  };
}
