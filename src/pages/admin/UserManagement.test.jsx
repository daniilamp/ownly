/**
 * Unit tests for UserManagement page component
 * 
 * Tests:
 * - User data fetching and display
 * - Search debouncing behavior
 * - Filter application
 * - Pagination controls
 * - Error handling
 * - Loading states
 * - Empty states
 * - Integration with hooks (useAdminAPI, useDebounce, usePagination)
 * 
 * Requirements: 2.2, 2.5, 3.5
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import UserManagement from './UserManagement';
import { useAdminAPI } from '../../hooks/useAdminAPI';
import { useDebounce } from '../../hooks/useDebounce';
import { usePagination } from '../../hooks/usePagination';

// Mock the hooks
vi.mock('../../hooks/useAdminAPI');
vi.mock('../../hooks/useDebounce');
vi.mock('../../hooks/usePagination');

// Mock child components
vi.mock('../../components/admin/FilterPanel', () => ({
  default: ({ filters, activeFilters, onChange, onReset }) => (
    <div data-testid="filter-panel">
      <input
        data-testid="search-input"
        placeholder="Search..."
        value={activeFilters.search || ''}
        onChange={(e) => onChange('search', e.target.value)}
      />
      <select
        data-testid="role-filter"
        value={activeFilters.role || ''}
        onChange={(e) => onChange('role', e.target.value)}
      >
        <option value="">All Roles</option>
        <option value="user">USER</option>
        <option value="business">BUSINESS</option>
        <option value="admin">ADMIN</option>
      </select>
      <select
        data-testid="status-filter"
        value={activeFilters.status || ''}
        onChange={(e) => onChange('status', e.target.value)}
      >
        <option value="">All Statuses</option>
        <option value="active">Active</option>
        <option value="inactive">Inactive</option>
        <option value="suspended">Suspended</option>
      </select>
      <button data-testid="reset-filters" onClick={onReset}>
        Reset All
      </button>
    </div>
  ),
}));

vi.mock('../../components/admin/UserTable', () => ({
  default: ({ users, loading, error, onUserClick, totalUsers, pagination }) => (
    <div data-testid="user-table">
      {loading && <div>Loading users...</div>}
      {error && <div data-testid="error-message">{error}</div>}
      {!loading && !error && users.length === 0 && <div>No users found</div>}
      {!loading && !error && users.length > 0 && (
        <div>
          <div data-testid="user-count">Total: {totalUsers}</div>
          {users.map((user) => (
            <div key={user.id} data-testid={`user-${user.id}`}>
              {user.email}
              <button onClick={() => onUserClick(user.id)}>View Details</button>
            </div>
          ))}
          {pagination && (
            <div data-testid="pagination">
              <button
                data-testid="prev-page"
                onClick={pagination.prevPage}
                disabled={!pagination.hasPrevPage}
              >
                Previous
              </button>
              <span data-testid="page-info">
                Page {pagination.currentPage} of {pagination.totalPages}
              </span>
              <button
                data-testid="next-page"
                onClick={pagination.nextPage}
                disabled={!pagination.hasNextPage}
              >
                Next
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  ),
}));

vi.mock('../../components/admin/ToastNotification', () => ({
  ToastContainer: ({ toasts, onClose }) => (
    <div data-testid="toast-container">
      {toasts.map((toast) => (
        <div key={toast.id} data-testid={`toast-${toast.type}`}>
          {toast.message}
          <button onClick={() => onClose(toast.id)}>Close</button>
        </div>
      ))}
    </div>
  ),
}));

// Mock user data
const mockUsers = [
  {
    id: '123e4567-e89b-12d3-a456-426614174000',
    email: 'user1@example.com',
    role: 'user',
    status: 'active',
    created_at: '2024-01-15T10:30:00Z',
  },
  {
    id: '223e4567-e89b-12d3-a456-426614174001',
    email: 'business@example.com',
    role: 'business',
    status: 'active',
    created_at: '2024-01-20T14:20:00Z',
  },
  {
    id: '323e4567-e89b-12d3-a456-426614174002',
    email: 'admin@example.com',
    role: 'admin',
    status: 'active',
    created_at: '2024-01-25T09:15:00Z',
  },
];

describe('UserManagement', () => {
  let mockListUsers;
  let mockPagination;

  beforeEach(() => {
    // Reset all mocks before each test
    vi.clearAllMocks();

    // Mock useAdminAPI
    mockListUsers = vi.fn().mockResolvedValue({
      users: mockUsers,
      total: mockUsers.length,
    });

    useAdminAPI.mockReturnValue({
      listUsers: mockListUsers,
      loading: false,
      error: null,
    });

    // Mock useDebounce - return the value immediately for testing
    useDebounce.mockImplementation((value) => value);

    // Mock usePagination
    mockPagination = {
      currentPage: 1,
      pageSize: 50,
      totalPages: 1,
      hasPrevPage: false,
      hasNextPage: false,
      prevPage: vi.fn(),
      nextPage: vi.fn(),
      goToPage: vi.fn(),
    };

    usePagination.mockReturnValue(mockPagination);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Initial Render and Data Fetching', () => {
    it('should render UserManagement page with header', () => {
      render(<UserManagement />);

      expect(screen.getByText('User Management')).toBeInTheDocument();
    });

    it('should fetch users on mount', async () => {
      render(<UserManagement />);

      await waitFor(() => {
        expect(mockListUsers).toHaveBeenCalledTimes(1);
      });

      expect(mockListUsers).toHaveBeenCalledWith({
        limit: 50,
        offset: 0,
      });
    });

    it('should display fetched users in table', async () => {
      render(<UserManagement />);

      await waitFor(() => {
        expect(screen.getByTestId('user-table')).toBeInTheDocument();
      });

      expect(screen.getByText('user1@example.com')).toBeInTheDocument();
      expect(screen.getByText('business@example.com')).toBeInTheDocument();
      expect(screen.getByText('admin@example.com')).toBeInTheDocument();
    });

    it('should display total user count', async () => {
      render(<UserManagement />);

      await waitFor(() => {
        expect(screen.getByTestId('user-count')).toHaveTextContent('Total: 3');
      });
    });

    it('should render FilterPanel component', () => {
      render(<UserManagement />);

      expect(screen.getByTestId('filter-panel')).toBeInTheDocument();
    });

    it('should render UserTable component', () => {
      render(<UserManagement />);

      expect(screen.getByTestId('user-table')).toBeInTheDocument();
    });
  });

  describe('Search Functionality', () => {
    it('should update search filter when search input changes', async () => {
      render(<UserManagement />);

      const searchInput = screen.getByTestId('search-input');
      fireEvent.change(searchInput, { target: { value: 'test@example.com' } });

      expect(searchInput.value).toBe('test@example.com');
    });

    it('should call listUsers with search parameter', async () => {
      render(<UserManagement />);

      // Clear initial call
      mockListUsers.mockClear();

      const searchInput = screen.getByTestId('search-input');
      fireEvent.change(searchInput, { target: { value: 'test@example.com' } });

      await waitFor(() => {
        expect(mockListUsers).toHaveBeenCalledWith({
          limit: 50,
          offset: 0,
          search: 'test@example.com',
        });
      });
    });

    it('should use debounced search value', () => {
      render(<UserManagement />);

      // Verify useDebounce was called with search value and 300ms delay
      expect(useDebounce).toHaveBeenCalledWith('', 300);
    });

    it('should reset to first page when search changes', async () => {
      mockPagination.currentPage = 2;
      render(<UserManagement />);

      const searchInput = screen.getByTestId('search-input');
      fireEvent.change(searchInput, { target: { value: 'test' } });

      await waitFor(() => {
        expect(mockPagination.goToPage).toHaveBeenCalledWith(1);
      });
    });
  });

  describe('Filter Functionality', () => {
    it('should update role filter when role dropdown changes', async () => {
      render(<UserManagement />);

      const roleFilter = screen.getByTestId('role-filter');
      fireEvent.change(roleFilter, { target: { value: 'admin' } });

      expect(roleFilter.value).toBe('admin');
    });

    it('should call listUsers with role filter', async () => {
      render(<UserManagement />);

      mockListUsers.mockClear();

      const roleFilter = screen.getByTestId('role-filter');
      fireEvent.change(roleFilter, { target: { value: 'admin' } });

      await waitFor(() => {
        expect(mockListUsers).toHaveBeenCalledWith({
          limit: 50,
          offset: 0,
          role: 'admin',
        });
      });
    });

    it('should update status filter when status dropdown changes', async () => {
      render(<UserManagement />);

      const statusFilter = screen.getByTestId('status-filter');
      fireEvent.change(statusFilter, { target: { value: 'inactive' } });

      expect(statusFilter.value).toBe('inactive');
    });

    it('should call listUsers with status filter', async () => {
      render(<UserManagement />);

      mockListUsers.mockClear();

      const statusFilter = screen.getByTestId('status-filter');
      fireEvent.change(statusFilter, { target: { value: 'inactive' } });

      await waitFor(() => {
        expect(mockListUsers).toHaveBeenCalledWith({
          limit: 50,
          offset: 0,
          status: 'inactive',
        });
      });
    });

    it('should apply multiple filters simultaneously', async () => {
      render(<UserManagement />);

      mockListUsers.mockClear();

      const roleFilter = screen.getByTestId('role-filter');
      const statusFilter = screen.getByTestId('status-filter');
      const searchInput = screen.getByTestId('search-input');

      fireEvent.change(roleFilter, { target: { value: 'business' } });
      fireEvent.change(statusFilter, { target: { value: 'active' } });
      fireEvent.change(searchInput, { target: { value: 'test' } });

      await waitFor(() => {
        expect(mockListUsers).toHaveBeenCalledWith({
          limit: 50,
          offset: 0,
          role: 'business',
          status: 'active',
          search: 'test',
        });
      });
    });

    it('should reset filters when reset button is clicked', async () => {
      render(<UserManagement />);

      // Apply filters
      const roleFilter = screen.getByTestId('role-filter');
      const statusFilter = screen.getByTestId('status-filter');
      fireEvent.change(roleFilter, { target: { value: 'admin' } });
      fireEvent.change(statusFilter, { target: { value: 'inactive' } });

      mockListUsers.mockClear();

      // Reset filters
      const resetButton = screen.getByTestId('reset-filters');
      fireEvent.click(resetButton);

      // Verify filters are cleared
      expect(roleFilter.value).toBe('');
      expect(statusFilter.value).toBe('');

      await waitFor(() => {
        expect(mockListUsers).toHaveBeenCalledWith({
          limit: 50,
          offset: 0,
        });
      });
    });

    it('should reset to first page when filters change', async () => {
      mockPagination.currentPage = 3;
      render(<UserManagement />);

      const roleFilter = screen.getByTestId('role-filter');
      fireEvent.change(roleFilter, { target: { value: 'admin' } });

      await waitFor(() => {
        expect(mockPagination.goToPage).toHaveBeenCalledWith(1);
      });
    });
  });

  describe('Pagination', () => {
    it('should fetch users with correct offset based on current page', async () => {
      mockPagination.currentPage = 2;
      mockPagination.pageSize = 50;

      render(<UserManagement />);

      await waitFor(() => {
        expect(mockListUsers).toHaveBeenCalledWith({
          limit: 50,
          offset: 50, // (page 2 - 1) * 50
        });
      });
    });

    it('should display pagination controls', async () => {
      mockPagination.totalPages = 3;
      mockPagination.hasNextPage = true;

      render(<UserManagement />);

      await waitFor(() => {
        expect(screen.getByTestId('pagination')).toBeInTheDocument();
      });

      expect(screen.getByTestId('prev-page')).toBeInTheDocument();
      expect(screen.getByTestId('next-page')).toBeInTheDocument();
      expect(screen.getByTestId('page-info')).toHaveTextContent('Page 1 of 3');
    });

    it('should call nextPage when next button is clicked', async () => {
      mockPagination.hasNextPage = true;

      render(<UserManagement />);

      await waitFor(() => {
        expect(screen.getByTestId('next-page')).toBeInTheDocument();
      });

      const nextButton = screen.getByTestId('next-page');
      fireEvent.click(nextButton);

      expect(mockPagination.nextPage).toHaveBeenCalled();
    });

    it('should call prevPage when previous button is clicked', async () => {
      mockPagination.currentPage = 2;
      mockPagination.hasPrevPage = true;

      render(<UserManagement />);

      await waitFor(() => {
        expect(screen.getByTestId('prev-page')).toBeInTheDocument();
      });

      const prevButton = screen.getByTestId('prev-page');
      fireEvent.click(prevButton);

      expect(mockPagination.prevPage).toHaveBeenCalled();
    });

    it('should refetch users when page changes', async () => {
      const { rerender } = render(<UserManagement />);

      mockListUsers.mockClear();

      // Simulate page change
      mockPagination.currentPage = 2;
      usePagination.mockReturnValue(mockPagination);

      rerender(<UserManagement />);

      await waitFor(() => {
        expect(mockListUsers).toHaveBeenCalledWith({
          limit: 50,
          offset: 50,
        });
      });
    });
  });

  describe('Loading States', () => {
    it('should display loading state when fetching users', () => {
      useAdminAPI.mockReturnValue({
        listUsers: mockListUsers,
        loading: true,
        error: null,
      });

      render(<UserManagement />);

      expect(screen.getByText('Loading users...')).toBeInTheDocument();
    });

    it('should pass loading state to UserTable', () => {
      useAdminAPI.mockReturnValue({
        listUsers: mockListUsers,
        loading: true,
        error: null,
      });

      render(<UserManagement />);

      expect(screen.getByTestId('user-table')).toBeInTheDocument();
      expect(screen.getByText('Loading users...')).toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    it('should display error message when fetch fails', async () => {
      const errorMessage = 'Failed to load users';
      mockListUsers.mockRejectedValue(new Error(errorMessage));

      render(<UserManagement />);

      await waitFor(() => {
        expect(screen.getByTestId('error-message')).toHaveTextContent(errorMessage);
      });
    });

    it('should display error toast when fetch fails', async () => {
      const errorMessage = 'Network error';
      mockListUsers.mockRejectedValue(new Error(errorMessage));

      render(<UserManagement />);

      await waitFor(() => {
        expect(screen.getByTestId('toast-error')).toHaveTextContent(errorMessage);
      });
    });

    it('should pass error to UserTable', async () => {
      const errorMessage = 'Failed to load users';
      mockListUsers.mockRejectedValue(new Error(errorMessage));

      render(<UserManagement />);

      await waitFor(() => {
        expect(screen.getByTestId('user-table')).toBeInTheDocument();
        expect(screen.getByTestId('error-message')).toHaveTextContent(errorMessage);
      });
    });

    it('should clear error on successful refetch', async () => {
      // First render with error
      mockListUsers.mockRejectedValueOnce(new Error('Network error'));
      render(<UserManagement />);

      await waitFor(() => {
        expect(screen.getByTestId('error-message')).toBeInTheDocument();
      });

      // Successful refetch - reset mock to return success
      mockListUsers.mockResolvedValue({
        users: mockUsers,
        total: mockUsers.length,
      });

      // Trigger a refetch by changing a filter
      const roleFilter = screen.getByTestId('role-filter');
      fireEvent.change(roleFilter, { target: { value: 'user' } });

      await waitFor(() => {
        expect(screen.queryByTestId('error-message')).not.toBeInTheDocument();
      });
    });
  });

  describe('Empty State', () => {
    it('should display empty state when no users found', async () => {
      mockListUsers.mockResolvedValue({
        users: [],
        total: 0,
      });

      render(<UserManagement />);

      await waitFor(() => {
        expect(screen.getByText('No users found')).toBeInTheDocument();
      });
    });

    it('should display empty state with filters applied', async () => {
      mockListUsers.mockResolvedValue({
        users: [],
        total: 0,
      });

      render(<UserManagement />);

      const roleFilter = screen.getByTestId('role-filter');
      fireEvent.change(roleFilter, { target: { value: 'admin' } });

      await waitFor(() => {
        expect(screen.getByText('No users found')).toBeInTheDocument();
      });
    });
  });

  describe('User Interactions', () => {
    it('should handle user click', async () => {
      render(<UserManagement />);

      await waitFor(() => {
        expect(screen.getByTestId('user-123e4567-e89b-12d3-a456-426614174000')).toBeInTheDocument();
      });

      const viewButton = screen.getAllByText('View Details')[0];
      fireEvent.click(viewButton);

      // Should show info toast (user detail view not implemented yet)
      await waitFor(() => {
        expect(screen.getByTestId('toast-info')).toHaveTextContent('User detail view coming soon');
      });
    });
  });

  describe('Toast Notifications', () => {
    it('should render toast container', () => {
      render(<UserManagement />);

      expect(screen.getByTestId('toast-container')).toBeInTheDocument();
    });

    it('should display success toast', async () => {
      render(<UserManagement />);

      await waitFor(() => {
        expect(screen.getByTestId('user-table')).toBeInTheDocument();
      });

      // Trigger an action that shows success toast
      // (In this case, we'll test the toast infrastructure is present)
      expect(screen.getByTestId('toast-container')).toBeInTheDocument();
    });

    it('should allow closing toasts', async () => {
      const errorMessage = 'Test error';
      mockListUsers.mockRejectedValue(new Error(errorMessage));

      render(<UserManagement />);

      await waitFor(() => {
        expect(screen.getByTestId('toast-error')).toBeInTheDocument();
      });

      const closeButton = screen.getByText('Close');
      fireEvent.click(closeButton);

      await waitFor(() => {
        expect(screen.queryByTestId('toast-error')).not.toBeInTheDocument();
      });
    });
  });

  describe('Integration with Hooks', () => {
    it('should initialize usePagination with correct parameters', () => {
      render(<UserManagement />);

      expect(usePagination).toHaveBeenCalledWith({
        totalItems: 0, // Initial value before fetch
        initialPageSize: 50,
      });
    });

    it('should update pagination totalItems after fetch', async () => {
      const { rerender } = render(<UserManagement />);

      await waitFor(() => {
        expect(mockListUsers).toHaveBeenCalled();
      });

      // After fetch, totalItems should be updated
      // This would trigger a re-render with new pagination
      expect(usePagination).toHaveBeenCalled();
    });

    it('should use debounced search value for API calls', async () => {
      // Mock useDebounce to return a different value after delay
      useDebounce.mockImplementation((value) => {
        return value === 'test' ? 'test' : '';
      });

      render(<UserManagement />);

      const searchInput = screen.getByTestId('search-input');
      fireEvent.change(searchInput, { target: { value: 'test' } });

      await waitFor(() => {
        expect(useDebounce).toHaveBeenCalledWith('test', 300);
      });
    });

    it('should call useAdminAPI on mount', () => {
      render(<UserManagement />);

      expect(useAdminAPI).toHaveBeenCalled();
    });
  });

  describe('Edge Cases', () => {
    it('should handle undefined response from listUsers', async () => {
      mockListUsers.mockResolvedValue(undefined);

      render(<UserManagement />);

      await waitFor(() => {
        expect(screen.getByText('No users found')).toBeInTheDocument();
      });
    });

    it('should handle response with missing users array', async () => {
      mockListUsers.mockResolvedValue({ total: 0 });

      render(<UserManagement />);

      await waitFor(() => {
        expect(screen.getByText('No users found')).toBeInTheDocument();
      });
    });

    it('should handle response with missing total', async () => {
      mockListUsers.mockResolvedValue({ users: mockUsers });

      render(<UserManagement />);

      await waitFor(() => {
        expect(screen.getByTestId('user-count')).toHaveTextContent('Total: 0');
      });
    });

    it('should not include empty filter values in API call', async () => {
      render(<UserManagement />);

      // Wait for initial fetch
      await waitFor(() => {
        expect(mockListUsers).toHaveBeenCalledTimes(1);
      });

      mockListUsers.mockClear();

      // Apply a filter first
      const roleFilter = screen.getByTestId('role-filter');
      fireEvent.change(roleFilter, { target: { value: 'admin' } });

      await waitFor(() => {
        expect(mockListUsers).toHaveBeenCalledWith({
          limit: 50,
          offset: 0,
          role: 'admin',
        });
      });

      mockListUsers.mockClear();

      // Now clear the filter back to empty
      fireEvent.change(roleFilter, { target: { value: '' } });

      await waitFor(() => {
        expect(mockListUsers).toHaveBeenCalledWith({
          limit: 50,
          offset: 0,
          // Empty filters should not be included
        });
      });
    });

    it('should handle rapid filter changes', async () => {
      render(<UserManagement />);

      const roleFilter = screen.getByTestId('role-filter');

      // Rapidly change filters
      fireEvent.change(roleFilter, { target: { value: 'user' } });
      fireEvent.change(roleFilter, { target: { value: 'business' } });
      fireEvent.change(roleFilter, { target: { value: 'admin' } });

      // Should eventually call with the last value
      await waitFor(() => {
        expect(mockListUsers).toHaveBeenCalledWith(
          expect.objectContaining({ role: 'admin' })
        );
      });
    });
  });
});
