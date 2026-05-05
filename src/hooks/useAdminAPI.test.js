/**
 * Unit Tests for useAdminAPI Hook
 * Tests all admin API methods with mocked fetch responses
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useAdminAPI } from './useAdminAPI';

// Get the actual API URL from environment
const API_URL = import.meta.env.VITE_OWNLY_API_URL || '${API_URL}';

describe('useAdminAPI Hook', () => {
  let mockFetch;
  
  beforeEach(() => {
    // Mock localStorage
    Storage.prototype.getItem = vi.fn((key) => {
      if (key === 'ownly_token') return 'mock-jwt-token';
      return null;
    });
    
    // Mock fetch
    mockFetch = vi.fn();
    global.fetch = mockFetch;
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  // ============================================
  // USER MANAGEMENT TESTS
  // ============================================

  describe('listUsers', () => {
    it('should fetch users with filters', async () => {
      const mockResponse = {
        success: true,
        users: [
          { id: '1', email: 'user1@test.com', role: 'user', status: 'active' },
          { id: '2', email: 'user2@test.com', role: 'business', status: 'active' },
        ],
        total: 2,
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const { result } = renderHook(() => useAdminAPI());

      const filters = { role: 'user', status: 'active', limit: 50 };
      const data = await result.current.listUsers(filters);

      expect(mockFetch).toHaveBeenCalledWith(
        `${API_URL}/api/admin/users?role=user&status=active&limit=50`,
        expect.objectContaining({
          headers: expect.objectContaining({
            'Authorization': 'Bearer mock-jwt-token',
            'Content-Type': 'application/json',
          }),
        })
      );

      expect(data).toEqual(mockResponse);
    });

    it('should handle empty filters', async () => {
      const mockResponse = { success: true, users: [], total: 0 };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const { result } = renderHook(() => useAdminAPI());
      await result.current.listUsers();

      expect(mockFetch).toHaveBeenCalledWith(
        '${API_URL}/api/admin/users',
        expect.any(Object)
      );
    });

    it('should set loading state during request', async () => {
      mockFetch.mockImplementation(() => 
        new Promise(resolve => setTimeout(() => resolve({
          ok: true,
          json: async () => ({ success: true, users: [] }),
        }), 100))
      );

      const { result } = renderHook(() => useAdminAPI());

      expect(result.current.loading).toBe(false);

      const promise = result.current.listUsers();
      
      await waitFor(() => {
        expect(result.current.loading).toBe(true);
      });

      await promise;

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });
    });
  });

  describe('getUserById', () => {
    it('should fetch user by ID', async () => {
      const mockUser = {
        id: '123',
        email: 'test@test.com',
        role: 'user',
        status: 'active',
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, user: mockUser }),
      });

      const { result } = renderHook(() => useAdminAPI());
      const user = await result.current.getUserById('123');

      expect(mockFetch).toHaveBeenCalledWith(
        '${API_URL}/api/admin/users/123',
        expect.any(Object)
      );

      expect(user).toEqual(mockUser);
    });
  });

  describe('updateUserRole', () => {
    it('should update user role with reason', async () => {
      const mockUser = {
        id: '123',
        email: 'test@test.com',
        role: 'admin',
        status: 'active',
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, user: mockUser }),
      });

      const { result } = renderHook(() => useAdminAPI());
      const user = await result.current.updateUserRole('123', 'admin', 'Promoted to admin');

      expect(mockFetch).toHaveBeenCalledWith(
        '${API_URL}/api/admin/users/123/role',
        expect.objectContaining({
          method: 'PUT',
          body: JSON.stringify({ role: 'admin', reason: 'Promoted to admin' }),
        })
      );

      expect(user).toEqual(mockUser);
    });
  });

  describe('updateUserStatus', () => {
    it('should update user status with reason', async () => {
      const mockUser = {
        id: '123',
        email: 'test@test.com',
        role: 'user',
        status: 'inactive',
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, user: mockUser }),
      });

      const { result } = renderHook(() => useAdminAPI());
      const user = await result.current.updateUserStatus('123', 'inactive', 'Violated terms');

      expect(mockFetch).toHaveBeenCalledWith(
        '${API_URL}/api/admin/users/123/status',
        expect.objectContaining({
          method: 'PUT',
          body: JSON.stringify({ status: 'inactive', reason: 'Violated terms' }),
        })
      );

      expect(user).toEqual(mockUser);
    });
  });

  // ============================================
  // API KEY MANAGEMENT TESTS
  // ============================================

  describe('listAPIKeys', () => {
    it('should fetch API keys with filters', async () => {
      const mockResponse = {
        success: true,
        apiKeys: [
          { id: '1', userId: 'user1', status: 'active' },
          { id: '2', userId: 'user2', status: 'active' },
        ],
        count: 2,
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const { result } = renderHook(() => useAdminAPI());
      const data = await result.current.listAPIKeys({ status: 'active' });

      expect(mockFetch).toHaveBeenCalledWith(
        '${API_URL}/api/admin/api-keys?status=active',
        expect.any(Object)
      );

      expect(data).toEqual(mockResponse);
    });
  });

  describe('revokeAPIKey', () => {
    it('should revoke API key with reason', async () => {
      const mockApiKey = {
        id: 'key123',
        status: 'revoked',
        revokedAt: '2024-01-01T00:00:00Z',
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, apiKey: mockApiKey }),
      });

      const { result } = renderHook(() => useAdminAPI());
      const apiKey = await result.current.revokeAPIKey('key123', 'Security concern');

      expect(mockFetch).toHaveBeenCalledWith(
        '${API_URL}/api/admin/api-keys/key123',
        expect.objectContaining({
          method: 'DELETE',
          body: JSON.stringify({ reason: 'Security concern' }),
        })
      );

      expect(apiKey).toEqual(mockApiKey);
    });
  });

  // ============================================
  // AUDIT LOG TESTS
  // ============================================

  describe('getAccessLogs', () => {
    it('should fetch access logs with filters', async () => {
      const mockResponse = {
        success: true,
        logs: [
          { id: '1', userId: 'user1', endpoint: '/api/test', accessGranted: true },
        ],
        count: 1,
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const { result } = renderHook(() => useAdminAPI());
      const data = await result.current.getAccessLogs({
        userId: 'user1',
        accessGranted: true,
      });

      expect(mockFetch).toHaveBeenCalledWith(
        '${API_URL}/api/admin/logs/access?userId=user1&accessGranted=true',
        expect.any(Object)
      );

      expect(data).toEqual(mockResponse);
    });
  });

  describe('getRoleChangeLogs', () => {
    it('should fetch role change logs', async () => {
      const mockResponse = {
        success: true,
        logs: [
          { id: '1', userId: 'user1', oldRole: 'user', newRole: 'admin' },
        ],
        count: 1,
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const { result } = renderHook(() => useAdminAPI());
      const data = await result.current.getRoleChangeLogs({ userId: 'user1' });

      expect(mockFetch).toHaveBeenCalledWith(
        '${API_URL}/api/admin/logs/role-changes?userId=user1',
        expect.any(Object)
      );

      expect(data).toEqual(mockResponse);
    });
  });

  describe('getSecurityEvents', () => {
    it('should fetch security events with filters', async () => {
      const mockResponse = {
        success: true,
        events: [
          { id: '1', userId: 'user1', eventType: 'unauthorized_access', severity: 'high' },
        ],
        count: 1,
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const { result } = renderHook(() => useAdminAPI());
      const data = await result.current.getSecurityEvents({
        userId: 'user1',
        endpoint: '/api/admin',
      });

      expect(mockFetch).toHaveBeenCalledWith(
        '${API_URL}/api/admin/logs/security?userId=user1&endpoint=%2Fapi%2Fadmin',
        expect.any(Object)
      );

      expect(data).toEqual(mockResponse);
    });
  });

  // ============================================
  // STATISTICS TESTS
  // ============================================

  describe('getUserStats', () => {
    it('should fetch user statistics', async () => {
      const mockStats = {
        totalUsers: 100,
        usersByRole: { user: 80, business: 15, admin: 5 },
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, stats: mockStats }),
      });

      const { result } = renderHook(() => useAdminAPI());
      const stats = await result.current.getUserStats();

      expect(mockFetch).toHaveBeenCalledWith(
        '${API_URL}/api/admin/stats/users',
        expect.any(Object)
      );

      expect(stats).toEqual(mockStats);
    });
  });

  describe('getAPIUsageStats', () => {
    it('should fetch API usage statistics', async () => {
      const mockStats = {
        totalRequests: 1000,
        requestsByBusiness: [],
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, stats: mockStats }),
      });

      const { result } = renderHook(() => useAdminAPI());
      const stats = await result.current.getAPIUsageStats();

      expect(mockFetch).toHaveBeenCalledWith(
        '${API_URL}/api/admin/stats/api-usage',
        expect.any(Object)
      );

      expect(stats).toEqual(mockStats);
    });
  });

  describe('getSystemHealth', () => {
    it('should fetch system health status', async () => {
      const mockHealth = {
        status: 'healthy',
        database: { connected: true, responseTime: 10 },
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, health: mockHealth }),
      });

      const { result } = renderHook(() => useAdminAPI());
      const health = await result.current.getSystemHealth();

      expect(mockFetch).toHaveBeenCalledWith(
        '${API_URL}/api/admin/health',
        expect.any(Object)
      );

      expect(health).toEqual(mockHealth);
    });
  });

  describe('getSecuritySummary', () => {
    it('should fetch security summary with default hours', async () => {
      const mockSummary = {
        totalEvents: 10,
        eventsBySeverity: { low: 5, medium: 3, high: 2 },
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, summary: mockSummary }),
      });

      const { result } = renderHook(() => useAdminAPI());
      const summary = await result.current.getSecuritySummary();

      expect(mockFetch).toHaveBeenCalledWith(
        '${API_URL}/api/admin/security/summary?hours=24',
        expect.any(Object)
      );

      expect(summary).toEqual(mockSummary);
    });

    it('should fetch security summary with custom hours', async () => {
      const mockSummary = {
        totalEvents: 50,
        eventsBySeverity: { low: 30, medium: 15, high: 5 },
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, summary: mockSummary }),
      });

      const { result } = renderHook(() => useAdminAPI());
      const summary = await result.current.getSecuritySummary(48);

      expect(mockFetch).toHaveBeenCalledWith(
        '${API_URL}/api/admin/security/summary?hours=48',
        expect.any(Object)
      );

      expect(summary).toEqual(mockSummary);
    });
  });

  // ============================================
  // ERROR HANDLING TESTS
  // ============================================

  describe('Error Handling', () => {
    it('should throw error when token is missing', async () => {
      Storage.prototype.getItem = vi.fn(() => null);

      const { result } = renderHook(() => useAdminAPI());

      await expect(result.current.listUsers()).rejects.toThrow(
        'Authentication required. Please log in again.'
      );
    });

    it('should handle 401 Unauthorized error', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: async () => ({ error: 'Unauthorized' }),
      });

      const { result } = renderHook(() => useAdminAPI());

      await expect(result.current.listUsers()).rejects.toThrow(
        'Your session has expired. Please log in again.'
      );

      await waitFor(() => {
        expect(result.current.error).toBe('Your session has expired. Please log in again.');
      });
    });

    it('should handle 403 Forbidden error', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 403,
        json: async () => ({ error: 'Forbidden' }),
      });

      const { result } = renderHook(() => useAdminAPI());

      await expect(result.current.getUserById('123')).rejects.toThrow(
        'You do not have permission to perform this action.'
      );
    });

    it('should handle 404 Not Found error', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        json: async () => ({ error: 'Not found' }),
      });

      const { result } = renderHook(() => useAdminAPI());

      await expect(result.current.getUserById('999')).rejects.toThrow(
        'The requested resource was not found.'
      );
    });

    it('should handle 500 Server Error', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: async () => ({ error: 'Internal server error' }),
      });

      const { result } = renderHook(() => useAdminAPI());

      await expect(result.current.listUsers()).rejects.toThrow(
        'An unexpected error occurred. Please try again later.'
      );
    });

    it('should use API error message when available', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => ({ error: 'Invalid role specified' }),
      });

      const { result } = renderHook(() => useAdminAPI());

      await expect(result.current.updateUserRole('123', 'invalid', 'test')).rejects.toThrow(
        'Invalid role specified'
      );
    });

    it('should set error state on failure', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: async () => ({ error: 'Server error' }),
      });

      const { result } = renderHook(() => useAdminAPI());

      try {
        await result.current.listUsers();
      } catch (err) {
        // Expected error
      }

      await waitFor(() => {
        expect(result.current.error).toBe('An unexpected error occurred. Please try again later.');
      });
    });

    it('should clear error state on successful request', async () => {
      // First request fails
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: async () => ({ error: 'Server error' }),
      });

      const { result } = renderHook(() => useAdminAPI());

      try {
        await result.current.listUsers();
      } catch (err) {
        // Expected error
      }

      await waitFor(() => {
        expect(result.current.error).toBeTruthy();
      });

      // Second request succeeds
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, users: [] }),
      });

      await result.current.listUsers();

      await waitFor(() => {
        expect(result.current.error).toBeNull();
      });
    });
  });

  // ============================================
  // QUERY STRING BUILDING TESTS
  // ============================================

  describe('Query String Building', () => {
    it('should skip undefined and null values', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, users: [] }),
      });

      const { result } = renderHook(() => useAdminAPI());
      await result.current.listUsers({
        role: 'user',
        status: undefined,
        search: null,
        limit: 50,
      });

      expect(mockFetch).toHaveBeenCalledWith(
        '${API_URL}/api/admin/users?role=user&limit=50',
        expect.any(Object)
      );
    });

    it('should skip empty string values', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, users: [] }),
      });

      const { result } = renderHook(() => useAdminAPI());
      await result.current.listUsers({
        role: 'user',
        search: '',
      });

      expect(mockFetch).toHaveBeenCalledWith(
        '${API_URL}/api/admin/users?role=user',
        expect.any(Object)
      );
    });

    it('should properly encode special characters', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, logs: [] }),
      });

      const { result } = renderHook(() => useAdminAPI());
      await result.current.getAccessLogs({
        endpoint: '/api/admin/users',
      });

      expect(mockFetch).toHaveBeenCalledWith(
        '${API_URL}/api/admin/logs/access?endpoint=%2Fapi%2Fadmin%2Fusers',
        expect.any(Object)
      );
    });
  });
});
