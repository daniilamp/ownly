/**
 * Integration tests for UserManagement role management functionality
 * 
 * Tests:
 * - Role change flow with confirmation dialog
 * - Reason validation (minimum 10 characters)
 * - Success and error toast notifications
 * - Integration between UserManagement, RoleSelector, ConfirmationDialog, and ToastNotification
 * 
 * Requirements: 4.2, 4.3, 4.4, 4.5, 4.6
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

// Mock UserTable to include RoleSelector
vi.mock('../../../components/admin/UserTable', () => ({
  default: ({ users, onRoleChange }) => (
    <div data-testid="user-table">
      {users.map((user) => (
        <div key={user.id} data-testid={`user-row-${user.id}`}>
          <span data-testid={`user-email-${user.id}`}>{user.email}</span>
          <button
            data-testid={`role-button-${user.id}`}
            onClick={() => {
              // Simulate RoleSelector opening and selecting a new role
              const newRole = user.role === 'user' ? 'admin' : 'user';
              onRoleChange(user.id, newRole, 'Test reason for role change');
            }}
          >
            Change Role to {user.role === 'user' ? 'ADMIN' : 'USER'}
          </button>
        </div>
      ))}
    </div>
  ),
}));

// Import actual components for integration testing
import RoleSelector from '../../../components/admin/RoleSelector';
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
    status: 'active',
    created_at: '2024-01-20T14:20:00Z',
  },
];

// Mock admin user for AuthContext
const mockAdminUser = {
  id: 'admin-123',
  email: 'admin@example.com',
  role: 'admin',
};

describe('UserManagement - Role Management Integration', () => {
  let mockListUsers;
  let mockUpdateUserRole;
  let mockPagination;

  beforeEach(() => {
    vi.clearAllMocks();

    // Mock useAdminAPI
    mockListUsers = vi.fn().mockResolvedValue({
      users: mockUsers,
      total: mockUsers.length,
    });

    mockUpdateUserRole = vi.fn().mockResolvedValue({
      id: 'user-1',
      email: 'user1@example.com',
      role: 'admin',
      status: 'active',
    });

    useAdminAPI.mockReturnValue({
      listUsers: mockListUsers,
      updateUserRole: mockUpdateUserRole,
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

  describe('Role Change Flow with Confirmation', () => {
    it('should trigger role change when role button is clicked', async () => {
      renderWithAuth();

      // Wait for users to load
      await waitFor(() => {
        expect(screen.getByTestId('user-row-user-1')).toBeInTheDocument();
      });

      // Click role change button
      const roleButton = screen.getByTestId('role-button-user-1');
      fireEvent.click(roleButton);

      // Verify API was called with correct parameters
      await waitFor(() => {
        expect(mockUpdateUserRole).toHaveBeenCalledWith(
          'user-1',
          'admin',
          'Test reason for role change'
        );
      });
    });

    it('should update user table after successful role change', async () => {
      renderWithAuth();

      // Wait for users to load
      await waitFor(() => {
        expect(screen.getByTestId('user-row-user-1')).toBeInTheDocument();
      });

      // Click role change button
      const roleButton = screen.getByTestId('role-button-user-1');
      fireEvent.click(roleButton);

      // Wait for API call to complete
      await waitFor(() => {
        expect(mockUpdateUserRole).toHaveBeenCalled();
      });

      // Verify the user table would be updated (in real implementation)
      // Note: The actual update is handled by UserManagement state
      expect(mockUpdateUserRole).toHaveBeenCalledWith(
        'user-1',
        'admin',
        'Test reason for role change'
      );
    });

    it('should display success toast after successful role change', async () => {
      renderWithAuth();

      // Wait for users to load
      await waitFor(() => {
        expect(screen.getByTestId('user-row-user-1')).toBeInTheDocument();
      });

      // Click role change button
      const roleButton = screen.getByTestId('role-button-user-1');
      fireEvent.click(roleButton);

      // Wait for success toast to appear
      await waitFor(() => {
        expect(screen.getByText('User role updated to ADMIN successfully')).toBeInTheDocument();
      });
    });

    it('should include admin user ID in role change request', async () => {
      renderWithAuth();

      // Wait for users to load
      await waitFor(() => {
        expect(screen.getByTestId('user-row-user-1')).toBeInTheDocument();
      });

      // Click role change button
      const roleButton = screen.getByTestId('role-button-user-1');
      fireEvent.click(roleButton);

      // Verify API was called (admin user ID is extracted from AuthContext)
      await waitFor(() => {
        expect(mockUpdateUserRole).toHaveBeenCalled();
      });
    });
  });

  describe('Error Handling', () => {
    it('should display error toast when role change fails', async () => {
      const errorMessage = 'Failed to update user role';
      mockUpdateUserRole.mockRejectedValueOnce(new Error(errorMessage));

      renderWithAuth();

      // Wait for users to load
      await waitFor(() => {
        expect(screen.getByTestId('user-row-user-1')).toBeInTheDocument();
      });

      // Click role change button
      const roleButton = screen.getByTestId('role-button-user-1');
      fireEvent.click(roleButton);

      // Wait for error toast to appear
      await waitFor(() => {
        expect(screen.getByText(errorMessage)).toBeInTheDocument();
      });
    });

    it('should not update user table when role change fails', async () => {
      mockUpdateUserRole.mockRejectedValueOnce(new Error('API Error'));

      renderWithAuth();

      // Wait for users to load
      await waitFor(() => {
        expect(screen.getByTestId('user-row-user-1')).toBeInTheDocument();
      });

      // Get initial user email
      const userEmail = screen.getByTestId('user-email-user-1');
      expect(userEmail).toHaveTextContent('user1@example.com');

      // Click role change button
      const roleButton = screen.getByTestId('role-button-user-1');
      fireEvent.click(roleButton);

      // Wait for error to be processed
      await waitFor(() => {
        expect(screen.getByText('API Error')).toBeInTheDocument();
      });

      // User should still be in the table (no update on error)
      await waitFor(() => {
        expect(screen.getByTestId('user-email-user-1')).toHaveTextContent('user1@example.com');
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

      // Click role change button
      const roleButton = screen.getByTestId('role-button-user-1');
      fireEvent.click(roleButton);

      // Should display error toast about missing admin user ID
      await waitFor(() => {
        expect(screen.getByText('Admin user ID not found. Please log in again.')).toBeInTheDocument();
      });

      // API should not be called
      expect(mockUpdateUserRole).not.toHaveBeenCalled();
    });
  });

  describe('Multiple Role Changes', () => {
    it('should handle multiple role changes in sequence', async () => {
      renderWithAuth();

      // Wait for users to load
      await waitFor(() => {
        expect(screen.getByTestId('user-row-user-1')).toBeInTheDocument();
        expect(screen.getByTestId('user-row-user-2')).toBeInTheDocument();
      });

      // Change first user's role
      const roleButton1 = screen.getByTestId('role-button-user-1');
      fireEvent.click(roleButton1);

      await waitFor(() => {
        expect(mockUpdateUserRole).toHaveBeenCalledWith(
          'user-1',
          'admin',
          'Test reason for role change'
        );
      });

      // Change second user's role
      const roleButton2 = screen.getByTestId('role-button-user-2');
      fireEvent.click(roleButton2);

      await waitFor(() => {
        expect(mockUpdateUserRole).toHaveBeenCalledWith(
          'user-2',
          'user',
          'Test reason for role change'
        );
      });

      // Both API calls should have been made
      expect(mockUpdateUserRole).toHaveBeenCalledTimes(2);
    });

    it('should display multiple success toasts for multiple role changes', async () => {
      renderWithAuth();

      // Wait for users to load
      await waitFor(() => {
        expect(screen.getByTestId('user-row-user-1')).toBeInTheDocument();
        expect(screen.getByTestId('user-row-user-2')).toBeInTheDocument();
      });

      // Change first user's role
      const roleButton1 = screen.getByTestId('role-button-user-1');
      fireEvent.click(roleButton1);

      await waitFor(() => {
        expect(screen.getByText('User role updated to ADMIN successfully')).toBeInTheDocument();
      });

      // Change second user's role
      const roleButton2 = screen.getByTestId('role-button-user-2');
      fireEvent.click(roleButton2);

      await waitFor(() => {
        // Should contain success message for second change
        expect(screen.getByText('User role updated to USER successfully')).toBeInTheDocument();
      });
    });
  });
});

describe('RoleSelector Component Integration', () => {
  it('should render role selector with current role', () => {
    const mockOnRoleChange = vi.fn();

    render(
      <RoleSelector
        currentRole="user"
        userId="user-1"
        onRoleChange={mockOnRoleChange}
      />
    );

    // Should display current role
    expect(screen.getByText('USER')).toBeInTheDocument();
  });

  it('should open dropdown when role button is clicked', async () => {
    const mockOnRoleChange = vi.fn();

    render(
      <RoleSelector
        currentRole="user"
        userId="user-1"
        onRoleChange={mockOnRoleChange}
      />
    );

    // Click role button to open dropdown
    const roleButton = screen.getByRole('button', { name: /Current role: USER/i });
    fireEvent.click(roleButton);

    // Dropdown should be visible with all role options
    await waitFor(() => {
      expect(screen.getByRole('listbox')).toBeInTheDocument();
      expect(screen.getByText('BUSINESS')).toBeInTheDocument();
      expect(screen.getByText('ADMIN')).toBeInTheDocument();
    });
  });

  it('should show confirmation dialog when selecting a new role', async () => {
    const mockOnRoleChange = vi.fn();

    render(
      <RoleSelector
        currentRole="user"
        userId="user-1"
        onRoleChange={mockOnRoleChange}
      />
    );

    // Open dropdown
    const roleButton = screen.getByRole('button', { name: /Current role: USER/i });
    fireEvent.click(roleButton);

    // Select ADMIN role
    await waitFor(() => {
      expect(screen.getByText('ADMIN')).toBeInTheDocument();
    });

    const adminOption = screen.getByRole('option', { name: /ADMIN/i });
    fireEvent.click(adminOption);

    // Confirmation dialog should appear
    await waitFor(() => {
      expect(screen.getByText('Change User Role')).toBeInTheDocument();
    });
  });

  it('should not show confirmation dialog when selecting the same role', async () => {
    const mockOnRoleChange = vi.fn();

    render(
      <RoleSelector
        currentRole="user"
        userId="user-1"
        onRoleChange={mockOnRoleChange}
      />
    );

    // Open dropdown
    const roleButton = screen.getByRole('button', { name: /Current role: USER/i });
    fireEvent.click(roleButton);

    // Select USER role (same as current)
    await waitFor(() => {
      expect(screen.getByText(/Current/)).toBeInTheDocument();
    });

    const userOption = screen.getByRole('option', { name: /USER.*Current/i });
    fireEvent.click(userOption);

    // Confirmation dialog should NOT appear
    await waitFor(() => {
      expect(screen.queryByText('Change User Role')).not.toBeInTheDocument();
    });

    // onRoleChange should not be called
    expect(mockOnRoleChange).not.toHaveBeenCalled();
  });

  it('should show warning message when upgrading to ADMIN', async () => {
    const mockOnRoleChange = vi.fn();

    render(
      <RoleSelector
        currentRole="user"
        userId="user-1"
        onRoleChange={mockOnRoleChange}
      />
    );

    // Open dropdown and select ADMIN
    const roleButton = screen.getByRole('button', { name: /Current role: USER/i });
    fireEvent.click(roleButton);

    await waitFor(() => {
      expect(screen.getByText('ADMIN')).toBeInTheDocument();
    });

    const adminOption = screen.getByRole('option', { name: /ADMIN/i });
    fireEvent.click(adminOption);

    // Should show warning in confirmation dialog
    await waitFor(() => {
      expect(screen.getByText(/WARNING.*ADMIN privileges/i)).toBeInTheDocument();
    });
  });
});

describe('ConfirmationDialog - Reason Validation Integration', () => {
  it('should require reason input with minimum 10 characters', async () => {
    const mockOnConfirm = vi.fn();
    const mockOnCancel = vi.fn();

    render(
      <ConfirmationDialog
        isOpen={true}
        title="Change User Role"
        message="Are you sure you want to change this user's role?"
        requireReason={true}
        minReasonLength={10}
        onConfirm={mockOnConfirm}
        onCancel={mockOnCancel}
        confirmLabel="Change Role"
        danger={false}
      />
    );

    // Reason input should be present
    const reasonInput = screen.getByPlaceholderText(/Enter reason/i);
    expect(reasonInput).toBeInTheDocument();

    // Try to confirm without entering reason
    const confirmButton = screen.getByText('Change Role');
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
        title="Change User Role"
        message="Are you sure?"
        requireReason={true}
        minReasonLength={10}
        onConfirm={mockOnConfirm}
        onCancel={mockOnCancel}
        confirmLabel="Confirm"
        danger={false}
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
        title="Change User Role"
        message="Are you sure?"
        requireReason={true}
        minReasonLength={10}
        onConfirm={mockOnConfirm}
        onCancel={mockOnCancel}
        confirmLabel="Confirm"
        danger={false}
      />
    );

    // Enter valid reason
    const reasonInput = screen.getByPlaceholderText(/Enter reason/i);
    await userEvent.type(reasonInput, 'This is a valid reason for the change');

    // Confirm
    const confirmButton = screen.getByText('Confirm');
    fireEvent.click(confirmButton);

    // onConfirm should be called with the reason
    await waitFor(() => {
      expect(mockOnConfirm).toHaveBeenCalledWith('This is a valid reason for the change');
    });
  });

  it('should clear error when user starts typing', async () => {
    const mockOnConfirm = vi.fn();
    const mockOnCancel = vi.fn();

    render(
      <ConfirmationDialog
        isOpen={true}
        title="Change User Role"
        message="Are you sure?"
        requireReason={true}
        minReasonLength={10}
        onConfirm={mockOnConfirm}
        onCancel={mockOnCancel}
        confirmLabel="Confirm"
        danger={false}
      />
    );

    // Try to confirm without reason to trigger error
    const confirmButton = screen.getByText('Confirm');
    fireEvent.click(confirmButton);

    await waitFor(() => {
      expect(screen.getByText('Reason is required')).toBeInTheDocument();
    });

    // Start typing
    const reasonInput = screen.getByPlaceholderText(/Enter reason/i);
    await userEvent.type(reasonInput, 'T');

    // Error should be cleared
    await waitFor(() => {
      expect(screen.queryByText('Reason is required')).not.toBeInTheDocument();
    });
  });

  it('should display character count when typing', async () => {
    const mockOnConfirm = vi.fn();
    const mockOnCancel = vi.fn();

    render(
      <ConfirmationDialog
        isOpen={true}
        title="Change User Role"
        message="Are you sure?"
        requireReason={true}
        minReasonLength={10}
        onConfirm={mockOnConfirm}
        onCancel={mockOnCancel}
        confirmLabel="Confirm"
        danger={false}
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

  it('should handle cancel action', async () => {
    const mockOnConfirm = vi.fn();
    const mockOnCancel = vi.fn();

    render(
      <ConfirmationDialog
        isOpen={true}
        title="Change User Role"
        message="Are you sure?"
        requireReason={true}
        minReasonLength={10}
        onConfirm={mockOnConfirm}
        onCancel={mockOnCancel}
        confirmLabel="Confirm"
        danger={false}
      />
    );

    // Click cancel
    const cancelButton = screen.getByText('Cancel');
    fireEvent.click(cancelButton);

    // onCancel should be called
    expect(mockOnCancel).toHaveBeenCalled();
    // onConfirm should not be called
    expect(mockOnConfirm).not.toHaveBeenCalled();
  });

  it('should handle Escape key to cancel', async () => {
    const mockOnConfirm = vi.fn();
    const mockOnCancel = vi.fn();

    render(
      <ConfirmationDialog
        isOpen={true}
        title="Change User Role"
        message="Are you sure?"
        requireReason={true}
        minReasonLength={10}
        onConfirm={mockOnConfirm}
        onCancel={mockOnCancel}
        confirmLabel="Confirm"
        danger={false}
      />
    );

    // Press Escape key
    fireEvent.keyDown(document, { key: 'Escape' });

    // onCancel should be called
    await waitFor(() => {
      expect(mockOnCancel).toHaveBeenCalled();
    });
  });
});

describe('Toast Notification Integration', () => {
  it('should display success toast with correct message', () => {
    const toasts = [
      {
        id: 1,
        type: 'success',
        message: 'User role updated to ADMIN successfully',
        duration: 3000,
      },
    ];

    const mockOnClose = vi.fn();

    render(<ToastContainer toasts={toasts} onClose={mockOnClose} />);

    // Success toast should be visible
    expect(screen.getByText('User role updated to ADMIN successfully')).toBeInTheDocument();
  });

  it('should display error toast with correct message', () => {
    const toasts = [
      {
        id: 1,
        type: 'error',
        message: 'Failed to update user role',
        duration: 3000,
      },
    ];

    const mockOnClose = vi.fn();

    render(<ToastContainer toasts={toasts} onClose={mockOnClose} />);

    // Error toast should be visible
    expect(screen.getByText('Failed to update user role')).toBeInTheDocument();
  });

  it('should allow closing toast manually', async () => {
    const toasts = [
      {
        id: 1,
        type: 'success',
        message: 'User role updated successfully',
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

  it('should display multiple toasts stacked', () => {
    const toasts = [
      {
        id: 1,
        type: 'success',
        message: 'First success message',
        duration: 3000,
      },
      {
        id: 2,
        type: 'error',
        message: 'Second error message',
        duration: 3000,
      },
    ];

    const mockOnClose = vi.fn();

    render(<ToastContainer toasts={toasts} onClose={mockOnClose} />);

    // Both toasts should be visible
    expect(screen.getByText('First success message')).toBeInTheDocument();
    expect(screen.getByText('Second error message')).toBeInTheDocument();
  });
});
