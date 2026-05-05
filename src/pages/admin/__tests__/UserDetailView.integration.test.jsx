/**
 * Integration tests for UserDetailView component
 * 
 * Tests:
 * - User data fetching and display
 * - Navigation from user list to detail view
 * - Back button navigation
 * - Integration between UserDetailView, UserManagement, and useAdminAPI
 * 
 * Requirements: 6.1, 6.2, 6.6
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import UserDetailView from '../UserDetailView';
import UserManagement from '../UserManagement';
import { useAdminAPI } from '../../../hooks/useAdminAPI';
import { useDebounce } from '../../../hooks/useDebounce';
import { usePagination } from '../../../hooks/usePagination';
import { AuthContext } from '../../../context/AuthContext';

// Mock the hooks
vi.mock('../../../hooks/useAdminAPI');
vi.mock('../../../hooks/useDebounce');
vi.mock('../../../hooks/usePagination');

// Mock FilterPanel to simplify testing
vi.mock('../../../components/admin/FilterPanel', () => ({
  default: () => <div data-testid="filter-panel">Filter Panel</div>,
}));

// Mock UserTable to include navigation to detail view
vi.mock('../../../components/admin/UserTable', () => ({
  default: ({ users, onUserClick }) => (
    <div data-testid="user-table">
      {users.map((user) => (
        <div key={user.id} data-testid={`user-row-${user.id}`}>
          <span data-testid={`user-email-${user.id}`}>{user.email}</span>
          <button
            data-testid={`view-details-${user.id}`}
            onClick={() => onUserClick(user.id)}
          >
            View Details
          </button>
        </div>
      ))}
    </div>
  ),
}));

// Mock user data
const mockUsers = [
  {
    id: 'user-123',
    email: 'testuser@example.com',
    role: 'user',
    status: 'active',
    created_at: '2024-01-15T10:30:00Z',
  },
  {
    id: 'user-456',
    email: 'business@example.com',
    role: 'business',
    status: 'active',
    created_at: '2024-01-20T14:20:00Z',
  },
];

// Mock detailed user data
const mockDetailedUser = {
  id: 'user-123',
  email: 'testuser@example.com',
  role: 'user',
  status: 'active',
  created_at: '2024-01-15T10:30:00Z',
  kyc_status: 'completed',
  kyc_completed_at: '2024-01-20T14:45:00Z',
  recentActivity: [
    {
      action: 'Login',
      timestamp: '2024-01-25T09:00:00Z',
    },
    {
      action: 'Profile Updated',
      timestamp: '2024-01-24T15:30:00Z',
    },
  ],
};

// Mock admin user for AuthContext
const mockAdminUser = {
  id: 'admin-123',
  email: 'admin@example.com',
  role: 'admin',
};

describe('UserDetailView - Integration Tests', () => {
  let mockListUsers;
  let mockGetUserById;
  let mockPagination;

  beforeEach(() => {
    vi.clearAllMocks();

    // Mock useAdminAPI
    mockListUsers = vi.fn().mockResolvedValue({
      users: mockUsers,
      total: mockUsers.length,
    });

    mockGetUserById = vi.fn().mockResolvedValue(mockDetailedUser);

    useAdminAPI.mockReturnValue({
      listUsers: mockListUsers,
      getUserById: mockGetUserById,
      loading: false,
      error: null,
    });

    // Mock useDebounce - return value immediately
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

  /**
   * Helper function to render with router and auth context
   */
  const renderWithRouterAndAuth = (initialRoute = '/admin/users') => {
    return render(
      <AuthContext.Provider value={{ user: mockAdminUser, isAuthenticated: true }}>
        <MemoryRouter initialEntries={[initialRoute]}>
          <Routes>
            <Route path="/admin/users" element={<UserManagement />} />
            <Route path="/admin/users/:userId" element={<UserDetailView />} />
          </Routes>
        </MemoryRouter>
      </AuthContext.Provider>
    );
  };

  describe('User Data Fetching and Display', () => {
    it('should fetch user data from API on mount', async () => {
      renderWithRouterAndAuth('/admin/users/user-123');

      // Wait for API call
      await waitFor(() => {
        expect(mockGetUserById).toHaveBeenCalledWith('user-123');
      });
    });

    it('should display loading state while fetching user data', () => {
      // Mock a pending promise
      mockGetUserById.mockImplementation(() => new Promise(() => {}));

      renderWithRouterAndAuth('/admin/users/user-123');

      // Should show loading indicator
      expect(screen.getByText('Loading user details...')).toBeInTheDocument();
    });

    it('should display user profile information correctly', async () => {
      renderWithRouterAndAuth('/admin/users/user-123');

      // Wait for data to load
      await waitFor(() => {
        expect(screen.getByText('Profile Information')).toBeInTheDocument();
      });

      // Verify all profile fields are displayed
      expect(screen.getByText(mockDetailedUser.email)).toBeInTheDocument();
      expect(screen.getByText(mockDetailedUser.id)).toBeInTheDocument();
      expect(screen.getByText('user')).toBeInTheDocument();
      expect(screen.getByText('active')).toBeInTheDocument();
    });

    it('should display KYC status correctly', async () => {
      renderWithRouterAndAuth('/admin/users/user-123');

      // Wait for data to load
      await waitFor(() => {
        expect(screen.getByText('KYC Verification')).toBeInTheDocument();
      });

      // Verify KYC status is displayed
      expect(screen.getByText('Completed')).toBeInTheDocument();
    });

    it('should display recent activity timeline', async () => {
      renderWithRouterAndAuth('/admin/users/user-123');

      // Wait for data to load
      await waitFor(() => {
        expect(screen.getByText('Recent Activity')).toBeInTheDocument();
      });

      // Verify activity items are displayed
      expect(screen.getByText('Login')).toBeInTheDocument();
      expect(screen.getByText('Profile Updated')).toBeInTheDocument();
    });

    it('should handle loading state correctly', async () => {
      // Mock loading state
      useAdminAPI.mockReturnValue({
        listUsers: mockListUsers,
        getUserById: mockGetUserById,
        loading: true,
        error: null,
      });

      renderWithRouterAndAuth('/admin/users/user-123');

      // Should show loading indicator
      expect(screen.getByText('Loading user details...')).toBeInTheDocument();
    });

    it('should handle error state correctly', async () => {
      const errorMessage = 'Failed to load user details';
      mockGetUserById.mockRejectedValue(new Error(errorMessage));

      renderWithRouterAndAuth('/admin/users/user-123');

      // Wait for error to be displayed
      await waitFor(() => {
        expect(screen.getByText(errorMessage)).toBeInTheDocument();
      });
    });

    it('should display empty state when no recent activity', async () => {
      const userWithoutActivity = { ...mockDetailedUser, recentActivity: [] };
      mockGetUserById.mockResolvedValue(userWithoutActivity);

      renderWithRouterAndAuth('/admin/users/user-123');

      // Wait for data to load
      await waitFor(() => {
        expect(screen.getByText('Recent Activity')).toBeInTheDocument();
      });

      // Should show empty state message
      expect(screen.getByText('No recent activity available')).toBeInTheDocument();
    });

    it('should display different KYC statuses correctly', async () => {
      const pendingUser = {
        ...mockDetailedUser,
        kyc_status: 'pending',
        kyc_completed_at: null,
      };
      mockGetUserById.mockResolvedValue(pendingUser);

      renderWithRouterAndAuth('/admin/users/user-123');

      // Wait for data to load
      await waitFor(() => {
        expect(screen.getByText('KYC Verification')).toBeInTheDocument();
      });

      // Verify pending status is displayed
      expect(screen.getByText('Pending')).toBeInTheDocument();
      expect(screen.getByText('Not completed')).toBeInTheDocument();
    });

    it('should display rejected KYC status correctly', async () => {
      const rejectedUser = {
        ...mockDetailedUser,
        kyc_status: 'rejected',
        kyc_completed_at: null,
      };
      mockGetUserById.mockResolvedValue(rejectedUser);

      renderWithRouterAndAuth('/admin/users/user-123');

      // Wait for data to load
      await waitFor(() => {
        expect(screen.getByText('KYC Verification')).toBeInTheDocument();
      });

      // Verify rejected status is displayed
      expect(screen.getByText('Rejected')).toBeInTheDocument();
    });

    it('should display different user roles correctly', async () => {
      const adminUser = { ...mockDetailedUser, role: 'admin' };
      mockGetUserById.mockResolvedValue(adminUser);

      renderWithRouterAndAuth('/admin/users/user-123');

      // Wait for data to load
      await waitFor(() => {
        expect(screen.getByText('Profile Information')).toBeInTheDocument();
      });

      // Verify admin role is displayed
      expect(screen.getByText('admin')).toBeInTheDocument();
    });

    it('should display different user statuses correctly', async () => {
      const suspendedUser = { ...mockDetailedUser, status: 'suspended' };
      mockGetUserById.mockResolvedValue(suspendedUser);

      renderWithRouterAndAuth('/admin/users/user-123');

      // Wait for data to load
      await waitFor(() => {
        expect(screen.getByText('Profile Information')).toBeInTheDocument();
      });

      // Verify suspended status is displayed
      expect(screen.getByText('suspended')).toBeInTheDocument();
    });
  });

  describe('Navigation from User List to Detail View', () => {
    it('should navigate to user detail view when clicking View Details button', async () => {
      renderWithRouterAndAuth('/admin/users');

      // Wait for user list to load
      await waitFor(() => {
        expect(screen.getByTestId('user-table')).toBeInTheDocument();
      });

      // Click View Details button for first user
      const viewDetailsButton = screen.getByTestId('view-details-user-123');
      fireEvent.click(viewDetailsButton);

      // Should navigate to detail view and fetch user data
      await waitFor(() => {
        expect(mockGetUserById).toHaveBeenCalledWith('user-123');
      });

      // Should display user detail view
      await waitFor(() => {
        expect(screen.getByText('Profile Information')).toBeInTheDocument();
      });
    });

    it('should display correct user information after navigation', async () => {
      renderWithRouterAndAuth('/admin/users');

      // Wait for user list to load
      await waitFor(() => {
        expect(screen.getByTestId('user-table')).toBeInTheDocument();
      });

      // Click View Details button
      const viewDetailsButton = screen.getByTestId('view-details-user-123');
      fireEvent.click(viewDetailsButton);

      // Wait for detail view to load
      await waitFor(() => {
        expect(screen.getByText('Profile Information')).toBeInTheDocument();
      });

      // Verify correct user data is displayed
      expect(screen.getByText(mockDetailedUser.email)).toBeInTheDocument();
      expect(screen.getByText(mockDetailedUser.id)).toBeInTheDocument();
    });

    it('should navigate to different user detail views', async () => {
      const secondUserDetails = {
        id: 'user-456',
        email: 'business@example.com',
        role: 'business',
        status: 'active',
        created_at: '2024-01-20T14:20:00Z',
        kyc_status: 'pending',
        kyc_completed_at: null,
        recentActivity: [],
      };

      mockGetUserById.mockImplementation((userId) => {
        if (userId === 'user-123') return Promise.resolve(mockDetailedUser);
        if (userId === 'user-456') return Promise.resolve(secondUserDetails);
        return Promise.reject(new Error('User not found'));
      });

      renderWithRouterAndAuth('/admin/users');

      // Wait for user list to load
      await waitFor(() => {
        expect(screen.getByTestId('user-table')).toBeInTheDocument();
      });

      // Click View Details for first user
      const viewDetailsButton1 = screen.getByTestId('view-details-user-123');
      fireEvent.click(viewDetailsButton1);

      // Wait for first user detail view
      await waitFor(() => {
        expect(screen.getByText(mockDetailedUser.email)).toBeInTheDocument();
      });

      // Navigate back
      const backButton = screen.getByLabelText('Back to user list');
      fireEvent.click(backButton);

      // Wait for user list to appear again
      await waitFor(() => {
        expect(screen.getByTestId('user-table')).toBeInTheDocument();
      });

      // Click View Details for second user
      const viewDetailsButton2 = screen.getByTestId('view-details-user-456');
      fireEvent.click(viewDetailsButton2);

      // Wait for second user detail view
      await waitFor(() => {
        expect(screen.getByText(secondUserDetails.email)).toBeInTheDocument();
      });

      // Verify correct user data is displayed
      expect(screen.getByText('business')).toBeInTheDocument();
    });

    it('should handle navigation to non-existent user', async () => {
      mockGetUserById.mockRejectedValue(new Error('User not found'));

      renderWithRouterAndAuth('/admin/users/non-existent-user');

      // Should display error message
      await waitFor(() => {
        expect(screen.getByText('User not found')).toBeInTheDocument();
      });
    });
  });

  describe('Back Button Navigation', () => {
    it('should display back button in user detail view', async () => {
      renderWithRouterAndAuth('/admin/users/user-123');

      // Wait for detail view to load
      await waitFor(() => {
        expect(screen.getByText('Profile Information')).toBeInTheDocument();
      });

      // Back button should be present
      const backButton = screen.getByLabelText('Back to user list');
      expect(backButton).toBeInTheDocument();
    });

    it('should navigate back to user list when clicking back button', async () => {
      renderWithRouterAndAuth('/admin/users/user-123');

      // Wait for detail view to load
      await waitFor(() => {
        expect(screen.getByText('Profile Information')).toBeInTheDocument();
      });

      // Click back button
      const backButton = screen.getByLabelText('Back to user list');
      fireEvent.click(backButton);

      // Should navigate back to user list
      await waitFor(() => {
        expect(screen.getByTestId('user-table')).toBeInTheDocument();
      });

      // User list should be displayed
      expect(screen.getByTestId('user-row-user-123')).toBeInTheDocument();
      expect(screen.getByTestId('user-row-user-456')).toBeInTheDocument();
    });

    it('should maintain user list state after returning from detail view', async () => {
      renderWithRouterAndAuth('/admin/users');

      // Wait for user list to load
      await waitFor(() => {
        expect(screen.getByTestId('user-table')).toBeInTheDocument();
      });

      // Verify initial user list
      expect(screen.getByTestId('user-email-user-123')).toHaveTextContent('testuser@example.com');
      expect(screen.getByTestId('user-email-user-456')).toHaveTextContent('business@example.com');

      // Navigate to detail view
      const viewDetailsButton = screen.getByTestId('view-details-user-123');
      fireEvent.click(viewDetailsButton);

      // Wait for detail view
      await waitFor(() => {
        expect(screen.getByText('Profile Information')).toBeInTheDocument();
      });

      // Navigate back
      const backButton = screen.getByLabelText('Back to user list');
      fireEvent.click(backButton);

      // Wait for user list to reappear
      await waitFor(() => {
        expect(screen.getByTestId('user-table')).toBeInTheDocument();
      });

      // Verify user list state is maintained
      expect(screen.getByTestId('user-email-user-123')).toHaveTextContent('testuser@example.com');
      expect(screen.getByTestId('user-email-user-456')).toHaveTextContent('business@example.com');
    });

    it('should navigate back from error state', async () => {
      mockGetUserById.mockRejectedValue(new Error('Failed to load user details'));

      renderWithRouterAndAuth('/admin/users/user-123');

      // Wait for error state
      await waitFor(() => {
        expect(screen.getByText('Failed to load user details')).toBeInTheDocument();
      });

      // Back button should still be present (without aria-label in error state)
      const backButtons = screen.getAllByRole('button');
      const backButton = backButtons.find(btn => btn.querySelector('svg.lucide-arrow-left'));
      expect(backButton).toBeInTheDocument();

      // Click back button
      fireEvent.click(backButton);

      // Should navigate back to user list
      await waitFor(() => {
        expect(screen.getByTestId('user-table')).toBeInTheDocument();
      });
    });

    it('should navigate back using Back to User List button in error state', async () => {
      mockGetUserById.mockRejectedValue(new Error('User not found'));

      renderWithRouterAndAuth('/admin/users/user-123');

      // Wait for error state
      await waitFor(() => {
        expect(screen.getByText('User not found')).toBeInTheDocument();
      });

      // Click "Back to User List" button in error message
      const backToListButton = screen.getByText('Back to User List');
      fireEvent.click(backToListButton);

      // Should navigate back to user list
      await waitFor(() => {
        expect(screen.getByTestId('user-table')).toBeInTheDocument();
      });
    });

    it('should handle multiple back and forth navigations', async () => {
      renderWithRouterAndAuth('/admin/users');

      // Wait for user list
      await waitFor(() => {
        expect(screen.getByTestId('user-table')).toBeInTheDocument();
      });

      // Navigate to detail view
      fireEvent.click(screen.getByTestId('view-details-user-123'));

      // Wait for detail view
      await waitFor(() => {
        expect(screen.getByText('Profile Information')).toBeInTheDocument();
      });

      // Navigate back
      fireEvent.click(screen.getByLabelText('Back to user list'));

      // Wait for user list
      await waitFor(() => {
        expect(screen.getByTestId('user-table')).toBeInTheDocument();
      });

      // Navigate to detail view again
      fireEvent.click(screen.getByTestId('view-details-user-123'));

      // Wait for detail view
      await waitFor(() => {
        expect(screen.getByText('Profile Information')).toBeInTheDocument();
      });

      // Verify data is still correct
      expect(screen.getByText(mockDetailedUser.email)).toBeInTheDocument();
    });
  });

  describe('Integration with useAdminAPI', () => {
    it('should call getUserById with correct userId parameter', async () => {
      renderWithRouterAndAuth('/admin/users/user-123');

      await waitFor(() => {
        expect(mockGetUserById).toHaveBeenCalledWith('user-123');
        expect(mockGetUserById).toHaveBeenCalledTimes(1);
      });
    });

    it('should handle API errors gracefully', async () => {
      const apiError = new Error('Network error');
      mockGetUserById.mockRejectedValue(apiError);

      renderWithRouterAndAuth('/admin/users/user-123');

      // Should display error message
      await waitFor(() => {
        expect(screen.getByText('Network error')).toBeInTheDocument();
      });
    });

    it('should refetch user data when userId changes', async () => {
      // This test verifies that navigating between different user detail views
      // triggers new API calls for each user
      renderWithRouterAndAuth('/admin/users');

      // Wait for user list to load
      await waitFor(() => {
        expect(screen.getByTestId('user-table')).toBeInTheDocument();
      });

      // Navigate to first user
      fireEvent.click(screen.getByTestId('view-details-user-123'));

      // Wait for first user to load
      await waitFor(() => {
        expect(mockGetUserById).toHaveBeenCalledWith('user-123');
      });

      // Navigate back
      const backButton = screen.getByLabelText('Back to user list');
      fireEvent.click(backButton);

      // Wait for user list
      await waitFor(() => {
        expect(screen.getByTestId('user-table')).toBeInTheDocument();
      });

      // Clear mock to track new calls
      mockGetUserById.mockClear();

      // Navigate to second user
      fireEvent.click(screen.getByTestId('view-details-user-456'));

      // Should fetch second user data
      await waitFor(() => {
        expect(mockGetUserById).toHaveBeenCalledWith('user-456');
      });
    });

    it('should not fetch data when userId is missing', () => {
      render(
        <AuthContext.Provider value={{ user: mockAdminUser, isAuthenticated: true }}>
          <MemoryRouter initialEntries={['/admin/users/']}>
            <Routes>
              <Route path="/admin/users/:userId" element={<UserDetailView />} />
            </Routes>
          </MemoryRouter>
        </AuthContext.Provider>
      );

      // Should not call API without userId
      expect(mockGetUserById).not.toHaveBeenCalled();
    });
  });

  describe('Complete User Journey', () => {
    it('should complete full user journey: list -> detail -> back', async () => {
      renderWithRouterAndAuth('/admin/users');

      // Step 1: User list loads
      await waitFor(() => {
        expect(screen.getByTestId('user-table')).toBeInTheDocument();
        expect(mockListUsers).toHaveBeenCalled();
      });

      // Step 2: Click View Details
      const viewDetailsButton = screen.getByTestId('view-details-user-123');
      fireEvent.click(viewDetailsButton);

      // Step 3: Detail view loads
      await waitFor(() => {
        expect(mockGetUserById).toHaveBeenCalledWith('user-123');
        expect(screen.getByText('Profile Information')).toBeInTheDocument();
      });

      // Verify all sections are displayed
      expect(screen.getByText('KYC Verification')).toBeInTheDocument();
      expect(screen.getByText('Recent Activity')).toBeInTheDocument();

      // Step 4: Click back button
      const backButton = screen.getByLabelText('Back to user list');
      fireEvent.click(backButton);

      // Step 5: User list reappears
      await waitFor(() => {
        expect(screen.getByTestId('user-table')).toBeInTheDocument();
      });

      // Verify we're back at the user list
      expect(screen.getByTestId('user-row-user-123')).toBeInTheDocument();
      expect(screen.getByTestId('user-row-user-456')).toBeInTheDocument();
    });
  });
});
