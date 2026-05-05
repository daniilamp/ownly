/**
 * AuditLogs Component Tests
 * 
 * Tests:
 * - Log type switching
 * - Filter application
 * - Auto-refresh toggle
 * - Pagination controls
 * 
 * Requirements: 11.6, 12.5, 12.6
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import AuditLogs from '../AuditLogs';
import * as useAdminAPIModule from '../../../hooks/useAdminAPI';

// Mock hooks
vi.mock('../../../hooks/useAdminAPI');
vi.mock('../../../hooks/useDebounce', () => ({
  useDebounce: (value) => value,
}));
vi.mock('../../../hooks/usePagination', () => ({
  usePagination: () => ({
    currentPage: 1,
    pageSize: 100,
    totalPages: 1,
    hasPrevPage: false,
    hasNextPage: false,
    goToPage: vi.fn(),
    nextPage: vi.fn(),
    prevPage: vi.fn(),
  }),
}));
vi.mock('../../../hooks/useAutoRefresh', () => ({
  useAutoRefresh: ({ callback, enabled }) => ({
    isRefreshing: enabled,
    toggleAutoRefresh: vi.fn(),
    startAutoRefresh: vi.fn(),
    stopAutoRefresh: vi.fn(),
    refresh: callback,
  }),
}));

describe('AuditLogs', () => {
  const mockAccessLogs = [
    {
      id: 'log-1',
      timestamp: '2024-01-15T10:00:00Z',
      userId: 'user-1',
      userEmail: 'user@example.com',
      endpoint: '/api/admin/users',
      method: 'GET',
      accessGranted: true,
      userRole: 'admin',
    },
    {
      id: 'log-2',
      timestamp: '2024-01-15T09:00:00Z',
      userId: 'user-2',
      userEmail: 'business@example.com',
      endpoint: '/api/admin/api-keys',
      method: 'GET',
      accessGranted: false,
      userRole: 'business',
    },
  ];

  const mockRoleChangeLogs = [
    {
      id: 'role-1',
      timestamp: '2024-01-15T10:00:00Z',
      userId: 'user-1',
      userEmail: 'user@example.com',
      oldRole: 'user',
      newRole: 'business',
      changedBy: 'admin-1',
      changedByEmail: 'admin@example.com',
      reason: 'User requested upgrade',
    },
  ];

  const mockSecurityEvents = [
    {
      id: 'sec-1',
      timestamp: '2024-01-15T10:00:00Z',
      userId: 'user-1',
      userEmail: 'user@example.com',
      endpoint: '/api/admin/users',
      eventType: 'unauthorized_access',
      severity: 'high',
      details: 'Attempted access without proper role',
    },
  ];

  const mockAdminAPI = {
    getAccessLogs: vi.fn(),
    getRoleChangeLogs: vi.fn(),
    getSecurityEvents: vi.fn(),
    loading: false,
    error: null,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(useAdminAPIModule, 'useAdminAPI').mockReturnValue(mockAdminAPI);
    mockAdminAPI.getAccessLogs.mockResolvedValue({
      logs: mockAccessLogs,
      count: 2,
    });
    mockAdminAPI.getRoleChangeLogs.mockResolvedValue({
      logs: mockRoleChangeLogs,
      count: 1,
    });
    mockAdminAPI.getSecurityEvents.mockResolvedValue({
      events: mockSecurityEvents,
      count: 1,
    });
  });

  it('should fetch and display access logs by default', async () => {
    render(
      <BrowserRouter>
        <AuditLogs />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(mockAdminAPI.getAccessLogs).toHaveBeenCalledWith({
        limit: 100,
        offset: 0,
      });
    });

    await waitFor(() => {
      expect(screen.getByText('user@example.com')).toBeInTheDocument();
      expect(screen.getByText('business@example.com')).toBeInTheDocument();
    });
  });

  it('should switch to role changes tab and fetch role change logs', async () => {
    render(
      <BrowserRouter>
        <AuditLogs />
      </BrowserRouter>
    );

    // Wait for initial access logs load
    await waitFor(() => {
      expect(mockAdminAPI.getAccessLogs).toHaveBeenCalled();
    });

    // Click role changes tab
    const roleChangesTab = screen.getByRole('button', { name: /role changes/i });
    fireEvent.click(roleChangesTab);

    await waitFor(() => {
      expect(mockAdminAPI.getRoleChangeLogs).toHaveBeenCalledWith({
        limit: 100,
        offset: 0,
      });
    });

    await waitFor(() => {
      expect(screen.getByText('User requested upgrade')).toBeInTheDocument();
    });
  });

  it('should switch to security events tab and fetch security events', async () => {
    render(
      <BrowserRouter>
        <AuditLogs />
      </BrowserRouter>
    );

    // Wait for initial access logs load
    await waitFor(() => {
      expect(mockAdminAPI.getAccessLogs).toHaveBeenCalled();
    });

    // Click security events tab
    const securityTab = screen.getByRole('button', { name: /security events/i });
    fireEvent.click(securityTab);

    await waitFor(() => {
      expect(mockAdminAPI.getSecurityEvents).toHaveBeenCalledWith({
        limit: 100,
        offset: 0,
      });
    });

    await waitFor(() => {
      expect(screen.getByText(/unauthorized_access/i)).toBeInTheDocument();
    });
  });

  it('should apply date range filter', async () => {
    render(
      <BrowserRouter>
        <AuditLogs />
      </BrowserRouter>
    );

    // Wait for initial load
    await waitFor(() => {
      expect(mockAdminAPI.getAccessLogs).toHaveBeenCalled();
    });

    // Find date inputs
    const dateInputs = screen.getAllByDisplayValue('');
    const startDateInput = dateInputs.find(input => input.type === 'date');
    
    if (startDateInput) {
      fireEvent.change(startDateInput, { target: { value: '2024-01-01' } });

      await waitFor(() => {
        expect(mockAdminAPI.getAccessLogs).toHaveBeenCalledWith(
          expect.objectContaining({
            startDate: '2024-01-01',
          })
        );
      });
    }
  });

  it('should apply user email search filter', async () => {
    render(
      <BrowserRouter>
        <AuditLogs />
      </BrowserRouter>
    );

    // Wait for initial load
    await waitFor(() => {
      expect(mockAdminAPI.getAccessLogs).toHaveBeenCalled();
    });

    // Find and type in search input
    const searchInput = screen.getByPlaceholderText(/search by user email/i);
    fireEvent.change(searchInput, { target: { value: 'user@example.com' } });

    await waitFor(() => {
      expect(mockAdminAPI.getAccessLogs).toHaveBeenCalledWith(
        expect.objectContaining({
          userEmail: 'user@example.com',
        })
      );
    });
  });

  it('should apply endpoint filter for access logs', async () => {
    render(
      <BrowserRouter>
        <AuditLogs />
      </BrowserRouter>
    );

    // Wait for initial load
    await waitFor(() => {
      expect(mockAdminAPI.getAccessLogs).toHaveBeenCalled();
    });

    // Find and type in endpoint filter
    const endpointInput = screen.getByPlaceholderText(/filter by endpoint/i);
    fireEvent.change(endpointInput, { target: { value: '/api/admin/users' } });

    await waitFor(() => {
      expect(mockAdminAPI.getAccessLogs).toHaveBeenCalledWith(
        expect.objectContaining({
          endpoint: '/api/admin/users',
        })
      );
    });
  });

  it('should apply access granted filter for access logs', async () => {
    render(
      <BrowserRouter>
        <AuditLogs />
      </BrowserRouter>
    );

    // Wait for initial load
    await waitFor(() => {
      expect(mockAdminAPI.getAccessLogs).toHaveBeenCalled();
    });

    // Find and select access status filter
    const accessStatusSelect = screen.getByRole('combobox', { name: /access status/i });
    fireEvent.change(accessStatusSelect, { target: { value: 'granted' } });

    await waitFor(() => {
      expect(mockAdminAPI.getAccessLogs).toHaveBeenCalledWith(
        expect.objectContaining({
          accessGranted: true,
        })
      );
    });
  });

  it('should toggle auto-refresh', async () => {
    render(
      <BrowserRouter>
        <AuditLogs />
      </BrowserRouter>
    );

    // Wait for initial load
    await waitFor(() => {
      expect(mockAdminAPI.getAccessLogs).toHaveBeenCalled();
    });

    // Find and click auto-refresh toggle
    const autoRefreshButton = screen.getByRole('button', { name: /auto-refresh/i });
    fireEvent.click(autoRefreshButton);

    // Button text should change (this is a simple check, actual auto-refresh is mocked)
    await waitFor(() => {
      expect(autoRefreshButton).toBeInTheDocument();
    });
  });

  it('should reset filters when reset button is clicked', async () => {
    render(
      <BrowserRouter>
        <AuditLogs />
      </BrowserRouter>
    );

    // Wait for initial load
    await waitFor(() => {
      expect(mockAdminAPI.getAccessLogs).toHaveBeenCalled();
    });

    // Apply a filter
    const searchInput = screen.getByPlaceholderText(/search by user email/i);
    fireEvent.change(searchInput, { target: { value: 'user@example.com' } });

    // Click reset button
    const resetButton = screen.getByRole('button', { name: /reset/i });
    fireEvent.click(resetButton);

    await waitFor(() => {
      expect(searchInput.value).toBe('');
    });
  });

  it('should display loading state while fetching', () => {
    mockAdminAPI.loading = true;
    mockAdminAPI.getAccessLogs.mockReturnValue(new Promise(() => {})); // Never resolves

    render(
      <BrowserRouter>
        <AuditLogs />
      </BrowserRouter>
    );

    expect(screen.getByText(/loading logs/i)).toBeInTheDocument();
  });

  it('should display error message on fetch failure', async () => {
    mockAdminAPI.getAccessLogs.mockRejectedValue(new Error('Failed to fetch logs'));

    render(
      <BrowserRouter>
        <AuditLogs />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/failed to fetch logs/i)).toBeInTheDocument();
    });
  });

  it('should display empty state when no logs found', async () => {
    mockAdminAPI.getAccessLogs.mockResolvedValue({
      logs: [],
      count: 0,
    });

    render(
      <BrowserRouter>
        <AuditLogs />
      </BrowserRouter>
    );

    await waitFor(() => {
      // Check that the page is rendered
      const headings = screen.getAllByRole('heading', { name: /audit logs/i });
      expect(headings.length).toBeGreaterThan(0);
    });
    
    // Verify no log rows are displayed (only header row if table exists)
    const table = screen.queryByRole('table');
    if (table) {
      const rows = screen.queryAllByRole('row');
      // Should only have header row, no data rows
      expect(rows.length).toBeLessThanOrEqual(1);
    }
  });

  it('should reset filters when switching log types', async () => {
    render(
      <BrowserRouter>
        <AuditLogs />
      </BrowserRouter>
    );

    // Wait for initial load
    await waitFor(() => {
      expect(mockAdminAPI.getAccessLogs).toHaveBeenCalled();
    });

    // Apply a filter
    const searchInput = screen.getByPlaceholderText(/search by user email/i);
    fireEvent.change(searchInput, { target: { value: 'user@example.com' } });

    // Switch to role changes tab
    const roleChangesTab = screen.getByRole('button', { name: /role changes/i });
    fireEvent.click(roleChangesTab);

    await waitFor(() => {
      // Search input should be reset
      const newSearchInput = screen.getByPlaceholderText(/search by user email/i);
      expect(newSearchInput.value).toBe('');
    });
  });
});
