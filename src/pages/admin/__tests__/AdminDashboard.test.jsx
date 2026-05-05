/**
 * AdminDashboard Component Tests
 * 
 * Tests:
 * - Statistics data fetching and display
 * - Auto-refresh intervals
 * - Loading states
 * - Error handling
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import AdminDashboard from '../AdminDashboard';
import * as useAdminAPIModule from '../../../hooks/useAdminAPI';
import * as useAutoRefreshModule from '../../../hooks/useAutoRefresh';

// Mock the hooks
vi.mock('../../../hooks/useAdminAPI');
vi.mock('../../../hooks/useAutoRefresh');

// Mock child components
vi.mock('../../../components/admin/StatisticsCards', () => ({
  default: ({ userStats, apiStats }) => (
    <div data-testid="statistics-cards">
      {userStats && <div>User Stats: {userStats.totalUsers}</div>}
      {apiStats && <div>API Stats: {apiStats.totalRequests}</div>}
    </div>
  ),
}));

vi.mock('../../../components/admin/SystemHealthIndicator', () => ({
  default: ({ systemHealth }) => (
    <div data-testid="system-health">
      {systemHealth && <div>Status: {systemHealth.status}</div>}
    </div>
  ),
}));

vi.mock('../../../components/admin/RecentActivityTimeline', () => ({
  default: ({ recentActivity }) => (
    <div data-testid="recent-activity">
      {recentActivity && <div>Activity Count: {recentActivity.length}</div>}
    </div>
  ),
}));

describe('AdminDashboard', () => {
  let mockAdminAPI;
  let mockAutoRefreshCallbacks;

  beforeEach(() => {
    // Reset mocks
    vi.clearAllMocks();

    // Mock admin API
    mockAdminAPI = {
      getUserStats: vi.fn(),
      getAPIUsageStats: vi.fn(),
      getSystemHealth: vi.fn(),
      getAccessLogs: vi.fn(),
      loading: false,
      error: null,
    };

    useAdminAPIModule.useAdminAPI = vi.fn(() => mockAdminAPI);

    // Mock auto-refresh hook
    mockAutoRefreshCallbacks = [];
    useAutoRefreshModule.useAutoRefresh = vi.fn(({ callback }) => {
      mockAutoRefreshCallbacks.push(callback);
      return {
        isRefreshing: true,
        startAutoRefresh: vi.fn(),
        stopAutoRefresh: vi.fn(),
        toggleAutoRefresh: vi.fn(),
        refresh: vi.fn(),
      };
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should render dashboard header', () => {
    mockAdminAPI.getUserStats.mockResolvedValue({ totalUsers: 100 });
    mockAdminAPI.getAPIUsageStats.mockResolvedValue({ totalRequests: 1000 });
    mockAdminAPI.getSystemHealth.mockResolvedValue({ status: 'healthy' });
    mockAdminAPI.getAccessLogs.mockResolvedValue({ logs: [] });

    render(<AdminDashboard />);

    expect(screen.getByText('Admin Dashboard')).toBeInTheDocument();
  });

  it('should display loading state initially', () => {
    mockAdminAPI.getUserStats.mockImplementation(
      () => new Promise(() => {}) // Never resolves
    );
    mockAdminAPI.getAPIUsageStats.mockImplementation(
      () => new Promise(() => {})
    );
    mockAdminAPI.getSystemHealth.mockImplementation(
      () => new Promise(() => {})
    );
    mockAdminAPI.getAccessLogs.mockImplementation(
      () => new Promise(() => {})
    );

    render(<AdminDashboard />);

    // Check for loading spinner by class
    const spinner = document.querySelector('.animate-spin');
    expect(spinner).toBeInTheDocument();
  });

  it('should fetch and display statistics data', async () => {
    const mockUserStats = {
      totalUsers: 150,
      usersByRole: { user: 100, business: 45, admin: 5 },
      kycStatistics: { completed: 80, pending: 20, rejected: 5 },
    };

    const mockApiStats = {
      totalRequests: 5000,
      requestsByBusiness: [
        { userId: '1', userEmail: 'business1@test.com', requestCount: 2000 },
      ],
    };

    const mockSystemHealth = {
      status: 'healthy',
      database: { connected: true, responseTime: 50 },
      api: { responseTime: 100, errorRate: 0.5 },
    };

    const mockRecentActivity = [
      {
        id: '1',
        timestamp: new Date().toISOString(),
        userEmail: 'user@test.com',
        endpoint: '/api/test',
        accessGranted: true,
      },
    ];

    mockAdminAPI.getUserStats.mockResolvedValue(mockUserStats);
    mockAdminAPI.getAPIUsageStats.mockResolvedValue(mockApiStats);
    mockAdminAPI.getSystemHealth.mockResolvedValue(mockSystemHealth);
    mockAdminAPI.getAccessLogs.mockResolvedValue({ logs: mockRecentActivity });

    render(<AdminDashboard />);

    await waitFor(() => {
      expect(screen.getByTestId('statistics-cards')).toBeInTheDocument();
      expect(screen.getByText('User Stats: 150')).toBeInTheDocument();
      expect(screen.getByText('API Stats: 5000')).toBeInTheDocument();
    });

    expect(screen.getByTestId('system-health')).toBeInTheDocument();
    expect(screen.getByText('Status: healthy')).toBeInTheDocument();

    expect(screen.getByTestId('recent-activity')).toBeInTheDocument();
    expect(screen.getByText('Activity Count: 1')).toBeInTheDocument();
  });

  it('should display error message when data fetch fails', async () => {
    const errorMessage = 'Failed to fetch statistics';
    mockAdminAPI.getUserStats.mockRejectedValue(new Error(errorMessage));
    mockAdminAPI.getAPIUsageStats.mockRejectedValue(new Error(errorMessage));
    mockAdminAPI.getSystemHealth.mockRejectedValue(new Error(errorMessage));
    mockAdminAPI.getAccessLogs.mockResolvedValue({ logs: [] });

    render(<AdminDashboard />);

    await waitFor(() => {
      expect(screen.getByText('Error loading dashboard')).toBeInTheDocument();
      expect(screen.getByText(errorMessage)).toBeInTheDocument();
    });
  });

  it('should set up auto-refresh for statistics (60 seconds)', () => {
    mockAdminAPI.getUserStats.mockResolvedValue({ totalUsers: 100 });
    mockAdminAPI.getAPIUsageStats.mockResolvedValue({ totalRequests: 1000 });
    mockAdminAPI.getSystemHealth.mockResolvedValue({ status: 'healthy' });
    mockAdminAPI.getAccessLogs.mockResolvedValue({ logs: [] });

    render(<AdminDashboard />);

    // Check that useAutoRefresh was called twice (stats and activity)
    expect(useAutoRefreshModule.useAutoRefresh).toHaveBeenCalledTimes(2);

    // Check statistics auto-refresh (60 seconds)
    expect(useAutoRefreshModule.useAutoRefresh).toHaveBeenCalledWith(
      expect.objectContaining({
        interval: 60000,
        enabled: true,
      })
    );
  });

  it('should set up auto-refresh for recent activity (30 seconds)', () => {
    mockAdminAPI.getUserStats.mockResolvedValue({ totalUsers: 100 });
    mockAdminAPI.getAPIUsageStats.mockResolvedValue({ totalRequests: 1000 });
    mockAdminAPI.getSystemHealth.mockResolvedValue({ status: 'healthy' });
    mockAdminAPI.getAccessLogs.mockResolvedValue({ logs: [] });

    render(<AdminDashboard />);

    // Check recent activity auto-refresh (30 seconds)
    expect(useAutoRefreshModule.useAutoRefresh).toHaveBeenCalledWith(
      expect.objectContaining({
        interval: 30000,
        enabled: true,
      })
    );
  });

  it('should call API methods on mount', async () => {
    mockAdminAPI.getUserStats.mockResolvedValue({ totalUsers: 100 });
    mockAdminAPI.getAPIUsageStats.mockResolvedValue({ totalRequests: 1000 });
    mockAdminAPI.getSystemHealth.mockResolvedValue({ status: 'healthy' });
    mockAdminAPI.getAccessLogs.mockResolvedValue({ logs: [] });

    render(<AdminDashboard />);

    await waitFor(() => {
      expect(mockAdminAPI.getUserStats).toHaveBeenCalled();
      expect(mockAdminAPI.getAPIUsageStats).toHaveBeenCalled();
      expect(mockAdminAPI.getSystemHealth).toHaveBeenCalled();
      expect(mockAdminAPI.getAccessLogs).toHaveBeenCalledWith({ limit: 20 });
    });
  });
});
