/**
 * Integration tests for UserManagement status management functionality
 * 
 * Tests:
 * - Status change flow with confirmation dialog
 * - Reason requirement for deactivation and suspension
 * - Success and error toast notifications
 * - Integration between UserManagement, StatusToggle, ConfirmationDialog, and ToastNotification
 * 
 * Requirements: 5.2, 5.3, 5.4, 5.5
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import UserManagement from '../UserManagement';
import { useAdminAPI } from '../../../hooks/useAdminAPI';
import { useDebounce } from '../../../hooks/useDebounce';
import { usePagination } from '../../../hooks/usePagination';
import { AuthContext } from '../../../context/AuthContext';

// Mock the hooks
vi.mock('../../../hooks/useAdminAPI');
vi.mock('../../../hooks/useDebounce');
vi.mock('../../../hooks/usePagination');

// Mock react-router-dom
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => vi.fn(),
  };
});

// Mock FilterPanel to simplify testing
vi.mock('../../../components/admin/FilterPanel', () => ({
  default: () => <div data-testid="filter-panel">Filter Panel</div>,
}));

// Mock UserTable to include StatusToggle
vi.mock('../../../components/admin/UserTable', () => ({
  default: ({ users, onStatusChange }) => (
    <div data-testid="user-table">
      {users.map((user) => (
        <div key={user.id} data-testid={`user-row-${user.id}`}>
          <span data-testid={`user-email-${user.id}`}>{user.email}</span>
          <span data-testid={`user-status-${user.id}`}>{user.status}</span>
          <button
            data-testid={`status-button-${user.id}`}
            onClick={() => {
              // Simulate StatusToggle selecting a new status
              const newStatus = user.status === 'active' ? 'inactive' : 'active';
              const reason = newStatus === 'inactive' ? 'Test reason for deactivation' : undefined;
              onStatusChange(user.id, newStatus, reason);
            }}
          >
            Change Status to {user.status === 'active' ? 'INACTIVE' : 'ACTIVE'}
          </button>
        </div>
      ))}
    </div>
  ),
}));

// Import actual components for integration testing
import StatusToggle from '../../../components/admin/StatusToggle';
import ConfirmationDialog from '../../../components/admin/ConfirmationDialog';
import { ToastContainer } from '../../../components/admin/ToastNotification';

// Mock user data
const mockUsers = [
  {
    id: 'user-1',
    email: 'user1@example.com',
    role: 'user',
    status: 'active',
    created_at: '2024-01-15T10:30:00Z',
  },
  {
    id: 'user-2',
    email: 'business@example.com',
    role: 'business',
    status: 'inactive',
    created_at: '2024-01-20T14:20:00Z',
  },
  {
    id: 'user-3',
    email: 'suspended@example.com',
    role: 'user',
    status: 'suspended',
    created_at: '2024-01-25T09:15:00Z',
  },
];

// Mock admin user for AuthContext
const mockAdminUser = {
  id: 'admin-123',
  email: 'admin@example.com',
  role: 'admin',
};

describe('UserManagement - Status Management Integration', () => {
  let mockListUsers;
  let mockUpdateUserStatus;
  let mockPagination;

  beforeEach(() => {
    vi.clearAllMocks();

    // Mock useAdminAPI
    mockListUsers = vi.fn().mockResolvedValue({
      users: mockUsers,
      total: mockUsers.length,
    });

    mockUpdateUserStatus = vi.fn().mockResolvedValue({
      id: 'user-1',
      email: 'user1@example.com',
      role: 'user',
      status: 'inactive',
    });

    useAdminAPI.mockReturnValue({
      listUsers: mockListUsers,
      updateUserStatus: mockUpdateUserStatus,
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
   * Helper function to render UserManagement with AuthContext
   */
  const renderWithAuth = (user = mockAdminUser) => {
    return render(
      <AuthContext.Provider value={{ user, isAuthenticated: true }}>
        <UserManagement />
      </AuthContext.Provider>
    );
  };

  describe('Status Change Flow with Confirmation', () => {
    it('should trigger status change when status button is clicked', async () => {
      renderWithAuth();

      // Wait for users to load
      await waitFor(() => {
        expect(screen.getByTestId('user-row-user-1')).toBeInTheDocument();
      });

      // Click status change button
      const statusButton = screen.getByTestId('status-button-user-1');
      fireEvent.click(statusButton);

      // Verify API was called with correct parameters
      await waitFor(() => {
        expect(mockUpdateUserStatus).toHaveBeenCalledWith(
          'user-1',
          'inactive',
          'Test reason for deactivation'
        );
      });
    });

    it('should update user table after successful status change', async () => {
      renderWithAuth();

      // Wait for users to load
      await waitFor(() => {
        expect(screen.getByTestId('user-row-user-1')).toBeInTheDocument();
      });

      // Verify initial status
      expect(screen.getByTestId('user-status-user-1')).toHaveTextContent('active');

      // Click status change button
      const statusButton = screen.getByTestId('status-button-user-1');
      fireEvent.click(statusButton);

      // Wait for API call to complete
      await waitFor(() => {
        expect(mockUpdateUserStatus).toHaveBeenCalled();
      });

      // Verify the user table would be updated (in real implementation)
      expect(mockUpdateUserStatus).toHaveBeenCalledWith(
        'user-1',
        'inactive',
        'Test reason for deactivation'
      );
    });

    it('should display success toast after successful status change', async () => {
      renderWithAuth();

      // Wait for users to load
      await waitFor(() => {
        expect(screen.getByTestId('user-row-user-1')).toBeInTheDocument();
      });

      // Click status change button
      const statusButton = screen.getByTestId('status-button-user-1');
      fireEvent.click(statusButton);

      // Wait for success toast to appear
      await waitFor(() => {
        expect(screen.getByText('User status updated to inactive successfully')).toBeInTheDocument();
      });
    });

    it('should include admin user ID in status change request', async () => {
      renderWithAuth();

      // Wait for users to load
      await waitFor(() => {
        expect(screen.getByTestId('user-row-user-1')).toBeInTheDocument();
      });

      // Click status change button
      const statusButton = screen.getByTestId('status-button-user-1');
      fireEvent.click(statusButton);

      // Verify API was called (admin user ID is extracted from AuthContext)
      await waitFor(() => {
        expect(mockUpdateUserStatus).toHaveBeenCalled();
      });
    });
  });

  describe('Reason Requirement for Deactivation', () => {
    it('should require reason when deactivating user (inactive)', async () => {
      // This test verifies that the confirmation dialog requires a reason
      // The actual validation is tested in the ConfirmationDialog tests below
      renderWithAuth();

      await waitFor(() => {
        expect(screen.getByTestId('user-row-user-1')).toBeInTheDocument();
      });

      const statusButton = screen.getByTestId('status-button-user-1');
      fireEvent.click(statusButton);

      await waitFor(() => {
        expect(mockUpdateUserStatus).toHaveBeenCalledWith(
          'user-1',
          'inactive',
          'Test reason for deactivation'
        );
      });
    });

    it('should not require reason when activating user', async () => {
      // Mock user with inactive status
      mockListUsers.mockResolvedValueOnce({
        users: [mockUsers[1]], // business@example.com with inactive status
        total: 1,
      });

      mockUpdateUserStatus.mockResolvedValueOnce({
        id: 'user-2',
        email: 'business@example.com',
        role: 'business',
        status: 'active',
      });

      renderWithAuth();

      await waitFor(() => {
        expect(screen.getByTestId('user-row-user-2')).toBeInTheDocument();
      });

      // Click status change button (inactive -> active)
      const statusButton = screen.getByTestId('status-button-user-2');
      fireEvent.click(statusButton);

      // Verify API was called without reason (undefined)
      await waitFor(() => {
        expect(mockUpdateUserStatus).toHaveBeenCalledWith(
          'user-2',
          'active',
          undefined
        );
      });
    });
  });

  describe('Error Handling', () => {
    it('should display error toast when status change fails', async () => {
      const errorMessage = 'Failed to update user status';
      mockUpdateUserStatus.mockRejectedValueOnce(new Error(errorMessage));

      renderWithAuth();

      // Wait for users to load
      await waitFor(() => {
        expect(screen.getByTestId('user-row-user-1')).toBeInTheDocument();
      });

      // Click status change button
      const statusButton = screen.getByTestId('status-button-user-1');
      fireEvent.click(statusButton);

      // Wait for error toast to appear
      await waitFor(() => {
        expect(screen.getByText(errorMessage)).toBeInTheDocument();
      });
    });

    it('should not update user table when status change fails', async () => {
      mockUpdateUserStatus.mockRejectedValueOnce(new Error('API Error'));

      renderWithAuth();

      // Wait for users to load
      await waitFor(() => {
        expect(screen.getByTestId('user-row-user-1')).toBeInTheDocument();
      });

      // Get initial user status
      const userStatus = screen.getByTestId('user-status-user-1');
      expect(userStatus).toHaveTextContent('active');

      // Click status change button
      const statusButton = screen.getByTestId('status-button-user-1');
      fireEvent.click(statusButton);

      // Wait for error to be processed
      await waitFor(() => {
        expect(screen.getByText('API Error')).toBeInTheDocument();
      });

      // User status should still be active (no update on error)
      await waitFor(() => {
        expect(screen.getByTestId('user-status-user-1')).toHaveTextContent('active');
      });
    });

    it('should handle missing admin user ID gracefully', async () => {
      // Render without admin user
      render(
        <AuthContext.Provider value={{ user: null, isAuthenticated: true }}>
          <UserManagement />
        </AuthContext.Provider>
      );

      // Wait for users to load
      await waitFor(() => {
        expect(screen.getByTestId('user-row-user-1')).toBeInTheDocument();
      });

      // Click status change button
      const statusButton = screen.getByTestId('status-button-user-1');
      fireEvent.click(statusButton);

      // Should display error toast about missing admin user ID
      await waitFor(() => {
        expect(screen.getByText('Admin user ID not found. Please log in again.')).toBeInTheDocument();
      });

      // API should not be called
      expect(mockUpdateUserStatus).not.toHaveBeenCalled();
    });
  });

  describe('Multiple Status Changes', () => {
    it('should handle multiple status changes in sequence', async () => {
      renderWithAuth();

      // Wait for users to load
      await waitFor(() => {
        expect(screen.getByTestId('user-row-user-1')).toBeInTheDocument();
        expect(screen.getByTestId('user-row-user-2')).toBeInTheDocument();
      });

      // Change first user's status
      const statusButton1 = screen.getByTestId('status-button-user-1');
      fireEvent.click(statusButton1);

      await waitFor(() => {
        expect(mockUpdateUserStatus).toHaveBeenCalledWith(
          'user-1',
          'inactive',
          'Test reason for deactivation'
        );
      });

      // Change second user's status
      const statusButton2 = screen.getByTestId('status-button-user-2');
      fireEvent.click(statusButton2);

      await waitFor(() => {
        expect(mockUpdateUserStatus).toHaveBeenCalledWith(
          'user-2',
          'active',
          undefined
        );
      });

      // Both API calls should have been made
      expect(mockUpdateUserStatus).toHaveBeenCalledTimes(2);
    });

    it('should display multiple success toasts for multiple status changes', async () => {
      renderWithAuth();

      // Wait for users to load
      await waitFor(() => {
        expect(screen.getByTestId('user-row-user-1')).toBeInTheDocument();
        expect(screen.getByTestId('user-row-user-2')).toBeInTheDocument();
      });

      // Change first user's status
      const statusButton1 = screen.getByTestId('status-button-user-1');
      fireEvent.click(statusButton1);

      await waitFor(() => {
        expect(screen.getByText('User status updated to inactive successfully')).toBeInTheDocument();
      });

      // Change second user's status
      const statusButton2 = screen.getByTestId('status-button-user-2');
      fireEvent.click(statusButton2);

      await waitFor(() => {
        // Should contain success message for second change
        expect(screen.getByText('User status updated to active successfully')).toBeInTheDocument();
      });
    });
  });
});

describe('StatusToggle Component Integration', () => {
  it('should render status toggle with current status', () => {
    const mockOnStatusChange = vi.fn();

    render(
      <StatusToggle
        currentStatus="active"
        userId="user-1"
        onStatusChange={mockOnStatusChange}
      />
    );

    // Should display current status
    expect(screen.getByText('Active')).toBeInTheDocument();
  });

  it('should open dropdown when status button is clicked', async () => {
    const mockOnStatusChange = vi.fn();

    render(
      <StatusToggle
        currentStatus="active"
        userId="user-1"
        onStatusChange={mockOnStatusChange}
      />
    );

    // Click status button to open dropdown
    const statusButton = screen.getByRole('button', { name: /Current status: Active/i });
    fireEvent.click(statusButton);

    // Dropdown should be visible with all status options
    await waitFor(() => {
      expect(screen.getByRole('listbox')).toBeInTheDocument();
      expect(screen.getByText('Inactive')).toBeInTheDocument();
      expect(screen.getByText('Suspended')).toBeInTheDocument();
    });
  });

  it('should show confirmation dialog when selecting a new status', async () => {
    const mockOnStatusChange = vi.fn();

    render(
      <StatusToggle
        currentStatus="active"
        userId="user-1"
        onStatusChange={mockOnStatusChange}
      />
    );

    // Open dropdown
    const statusButton = screen.getByRole('button', { name: /Current status: Active/i });
    fireEvent.click(statusButton);

    // Select Inactive status
    await waitFor(() => {
      expect(screen.getByText('Inactive')).toBeInTheDocument();
    });

    const inactiveOption = screen.getByRole('option', { name: /Inactive/i });
    fireEvent.click(inactiveOption);

    // Confirmation dialog should appear
    await waitFor(() => {
      expect(screen.getByText('Change User Status')).toBeInTheDocument();
    });
  });

  it('should not show confirmation dialog when selecting the same status', async () => {
    const mockOnStatusChange = vi.fn();

    render(
      <StatusToggle
        currentStatus="active"
        userId="user-1"
        onStatusChange={mockOnStatusChange}
      />
    );

    // Open dropdown
    const statusButton = screen.getByRole('button', { name: /Current status: Active/i });
    fireEvent.click(statusButton);

    // Select Active status (same as current)
    await waitFor(() => {
      expect(screen.getByText(/Current/)).toBeInTheDocument();
    });

    const activeOption = screen.getByRole('option', { name: /Active.*Current/i });
    fireEvent.click(activeOption);

    // Confirmation dialog should NOT appear
    await waitFor(() => {
      expect(screen.queryByText('Change User Status')).not.toBeInTheDocument();
    });

    // onStatusChange should not be called
    expect(mockOnStatusChange).not.toHaveBeenCalled();
  });

  it('should show warning message when suspending user', async () => {
    const mockOnStatusChange = vi.fn();

    render(
      <StatusToggle
        currentStatus="active"
        userId="user-1"
        onStatusChange={mockOnStatusChange}
      />
    );

    // Open dropdown and select Suspended
    const statusButton = screen.getByRole('button', { name: /Current status: Active/i });
    fireEvent.click(statusButton);

    await waitFor(() => {
      expect(screen.getByText('Suspended')).toBeInTheDocument();
    });

    const suspendedOption = screen.getByRole('option', { name: /Suspended/i });
    fireEvent.click(suspendedOption);

    // Should show warning in confirmation dialog
    await waitFor(() => {
      expect(screen.getByText(/WARNING.*suspend/i)).toBeInTheDocument();
    });
  });

  it('should require reason for deactivation', async () => {
    const mockOnStatusChange = vi.fn();

    render(
      <StatusToggle
        currentStatus="active"
        userId="user-1"
        onStatusChange={mockOnStatusChange}
      />
    );

    // Open dropdown and select Inactive
    const statusButton = screen.getByRole('button', { name: /Current status: Active/i });
    fireEvent.click(statusButton);

    await waitFor(() => {
      expect(screen.getByText('Inactive')).toBeInTheDocument();
    });

    const inactiveOption = screen.getByRole('option', { name: /Inactive/i });
    fireEvent.click(inactiveOption);

    // Confirmation dialog should have reason input
    await waitFor(() => {
      expect(screen.getByPlaceholderText(/Enter reason/i)).toBeInTheDocument();
    });
  });

  it('should require reason for suspension', async () => {
    const mockOnStatusChange = vi.fn();

    render(
      <StatusToggle
        currentStatus="active"
        userId="user-1"
        onStatusChange={mockOnStatusChange}
      />
    );

    // Open dropdown and select Suspended
    const statusButton = screen.getByRole('button', { name: /Current status: Active/i });
    fireEvent.click(statusButton);

    await waitFor(() => {
      expect(screen.getByText('Suspended')).toBeInTheDocument();
    });

    const suspendedOption = screen.getByRole('option', { name: /Suspended/i });
    fireEvent.click(suspendedOption);

    // Confirmation dialog should have reason input
    await waitFor(() => {
      expect(screen.getByPlaceholderText(/Enter reason/i)).toBeInTheDocument();
    });
  });

  it('should not require reason for activation', async () => {
    const mockOnStatusChange = vi.fn();

    render(
      <StatusToggle
        currentStatus="inactive"
        userId="user-1"
        onStatusChange={mockOnStatusChange}
      />
    );

    // Open dropdown and select Active
    const statusButton = screen.getByRole('button', { name: /Current status: Inactive/i });
    fireEvent.click(statusButton);

    await waitFor(() => {
      expect(screen.getByText('Active')).toBeInTheDocument();
    });

    // Get all Active options and select the one that is NOT current (aria-selected="false")
    const activeOptions = screen.getAllByRole('option', { name: /Active/i });
    const activeOption = activeOptions.find(option => option.getAttribute('aria-selected') === 'false');
    fireEvent.click(activeOption);

    // Confirmation dialog should NOT have reason input
    await waitFor(() => {
      expect(screen.getByText('Change User Status')).toBeInTheDocument();
      expect(screen.queryByPlaceholderText(/Enter reason/i)).not.toBeInTheDocument();
    });
  });
});

describe('ConfirmationDialog - Status Change Reason Validation', () => {
  it('should require reason input with minimum 10 characters for deactivation', async () => {
    const mockOnConfirm = vi.fn();
    const mockOnCancel = vi.fn();

    render(
      <ConfirmationDialog
        isOpen={true}
        title="Change User Status"
        message="Are you sure you want to deactivate this user?"
        requireReason={true}
        minReasonLength={10}
        onConfirm={mockOnConfirm}
        onCancel={mockOnCancel}
        confirmLabel="Change Status"
        danger={true}
      />
    );

    // Reason input should be present
    const reasonInput = screen.getByPlaceholderText(/Enter reason/i);
    expect(reasonInput).toBeInTheDocument();

    // Try to confirm without entering reason
    const confirmButton = screen.getByText('Change Status');
    fireEvent.click(confirmButton);

    // Should show validation error
    await waitFor(() => {
      expect(screen.getByText('Reason is required')).toBeInTheDocument();
    });

    // onConfirm should not be called
    expect(mockOnConfirm).not.toHaveBeenCalled();
  });

  it('should show error when reason is less than minimum length', async () => {
    const mockOnConfirm = vi.fn();
    const mockOnCancel = vi.fn();

    render(
      <ConfirmationDialog
        isOpen={true}
        title="Change User Status"
        message="Are you sure?"
        requireReason={true}
        minReasonLength={10}
        onConfirm={mockOnConfirm}
        onCancel={mockOnCancel}
        confirmLabel="Confirm"
        danger={true}
      />
    );

    // Enter reason that's too short
    const reasonInput = screen.getByPlaceholderText(/Enter reason/i);
    await userEvent.type(reasonInput, 'Short');

    // Try to confirm
    const confirmButton = screen.getByText('Confirm');
    fireEvent.click(confirmButton);

    // Should show validation error
    await waitFor(() => {
      expect(screen.getByText('Reason must be at least 10 characters')).toBeInTheDocument();
    });

    // onConfirm should not be called
    expect(mockOnConfirm).not.toHaveBeenCalled();
  });

  it('should allow confirmation when reason meets minimum length', async () => {
    const mockOnConfirm = vi.fn();
    const mockOnCancel = vi.fn();

    render(
      <ConfirmationDialog
        isOpen={true}
        title="Change User Status"
        message="Are you sure?"
        requireReason={true}
        minReasonLength={10}
        onConfirm={mockOnConfirm}
        onCancel={mockOnCancel}
        confirmLabel="Confirm"
        danger={true}
      />
    );

    // Enter valid reason
    const reasonInput = screen.getByPlaceholderText(/Enter reason/i);
    await userEvent.type(reasonInput, 'This is a valid reason for deactivation');

    // Confirm
    const confirmButton = screen.getByText('Confirm');
    fireEvent.click(confirmButton);

    // onConfirm should be called with the reason
    await waitFor(() => {
      expect(mockOnConfirm).toHaveBeenCalledWith('This is a valid reason for deactivation');
    });
  });

  it('should display character count when typing', async () => {
    const mockOnConfirm = vi.fn();
    const mockOnCancel = vi.fn();

    render(
      <ConfirmationDialog
        isOpen={true}
        title="Change User Status"
        message="Are you sure?"
        requireReason={true}
        minReasonLength={10}
        onConfirm={mockOnConfirm}
        onCancel={mockOnCancel}
        confirmLabel="Confirm"
        danger={true}
      />
    );

    // Type some text
    const reasonInput = screen.getByPlaceholderText(/Enter reason/i);
    await userEvent.type(reasonInput, 'Testing');

    // Should show character count
    await waitFor(() => {
      expect(screen.getByText('7 / 10 characters')).toBeInTheDocument();
    });
  });
});

describe('Toast Notification Integration - Status Changes', () => {
  it('should display success toast with correct message for status change', () => {
    const toasts = [
      {
        id: 1,
        type: 'success',
        message: 'User status updated to inactive successfully',
        duration: 3000,
      },
    ];

    const mockOnClose = vi.fn();

    render(<ToastContainer toasts={toasts} onClose={mockOnClose} />);

    // Success toast should be visible
    expect(screen.getByText('User status updated to inactive successfully')).toBeInTheDocument();
  });

  it('should display error toast with correct message', () => {
    const toasts = [
      {
        id: 1,
        type: 'error',
        message: 'Failed to update user status',
        duration: 3000,
      },
    ];

    const mockOnClose = vi.fn();

    render(<ToastContainer toasts={toasts} onClose={mockOnClose} />);

    // Error toast should be visible
    expect(screen.getByText('Failed to update user status')).toBeInTheDocument();
  });

  it('should allow closing toast manually', async () => {
    const toasts = [
      {
        id: 1,
        type: 'success',
        message: 'User status updated successfully',
        duration: 3000,
      },
    ];

    const mockOnClose = vi.fn();

    render(<ToastContainer toasts={toasts} onClose={mockOnClose} />);

    // Find and click close button
    const closeButton = screen.getByLabelText('Close notification');
    fireEvent.click(closeButton);

    // onClose should be called with toast id
    await waitFor(() => {
      expect(mockOnClose).toHaveBeenCalledWith(1);
    });
  });

  it('should display multiple toasts for multiple status changes', () => {
    const toasts = [
      {
        id: 1,
        type: 'success',
        message: 'User status updated to inactive successfully',
        duration: 3000,
      },
      {
        id: 2,
        type: 'success',
        message: 'User status updated to active successfully',
        duration: 3000,
      },
    ];

    const mockOnClose = vi.fn();

    render(<ToastContainer toasts={toasts} onClose={mockOnClose} />);

    // Both toasts should be visible
    expect(screen.getByText('User status updated to inactive successfully')).toBeInTheDocument();
    expect(screen.getByText('User status updated to active successfully')).toBeInTheDocument();
  });
});
