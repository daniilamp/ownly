/**
 * RoleSelector Component Tests
 * 
 * Tests:
 * - Renders current role correctly
 * - Opens dropdown on click
 * - Displays all role options
 * - Shows confirmation dialog on role selection
 * - Requires reason for role change
 * - Shows warning for ADMIN role assignment
 * - Calls onRoleChange with correct parameters
 * - Handles disabled state
 * - Closes dropdown when clicking outside
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import RoleSelector from './RoleSelector';

describe('RoleSelector', () => {
  const mockOnRoleChange = vi.fn();
  const defaultProps = {
    currentRole: 'user',
    userId: 'user-123',
    onRoleChange: mockOnRoleChange,
  };

  beforeEach(() => {
    mockOnRoleChange.mockClear();
  });

  describe('Rendering', () => {
    it('should render current role correctly', () => {
      render(<RoleSelector {...defaultProps} />);
      
      expect(screen.getByText('USER')).toBeInTheDocument();
      expect(screen.getByLabelText(/Current role: USER/i)).toBeInTheDocument();
    });

    it('should render BUSINESS role correctly', () => {
      render(<RoleSelector {...defaultProps} currentRole="business" />);
      
      expect(screen.getByText('BUSINESS')).toBeInTheDocument();
    });

    it('should render ADMIN role correctly', () => {
      render(<RoleSelector {...defaultProps} currentRole="admin" />);
      
      expect(screen.getByText('ADMIN')).toBeInTheDocument();
    });

    it('should be disabled when disabled prop is true', () => {
      render(<RoleSelector {...defaultProps} disabled={true} />);
      
      const button = screen.getByRole('button');
      expect(button).toBeDisabled();
    });
  });

  describe('Dropdown Interaction', () => {
    it('should open dropdown on click', () => {
      render(<RoleSelector {...defaultProps} />);
      
      const button = screen.getByRole('button');
      fireEvent.click(button);
      
      // Should show all three role options
      expect(screen.getByText('Standard user with basic access')).toBeInTheDocument();
      expect(screen.getByText('Business user with API access')).toBeInTheDocument();
      expect(screen.getByText('Administrator with full system access')).toBeInTheDocument();
    });

    it('should close dropdown on second click', () => {
      render(<RoleSelector {...defaultProps} />);
      
      const button = screen.getByRole('button');
      
      // Open dropdown
      fireEvent.click(button);
      expect(screen.getByText('Standard user with basic access')).toBeInTheDocument();
      
      // Close dropdown
      fireEvent.click(button);
      expect(screen.queryByText('Standard user with basic access')).not.toBeInTheDocument();
    });

    it('should highlight current role in dropdown', () => {
      render(<RoleSelector {...defaultProps} currentRole="business" />);
      
      const button = screen.getByRole('button');
      fireEvent.click(button);
      
      // Should show "Current" badge next to BUSINESS role
      const currentBadges = screen.getAllByText('Current');
      expect(currentBadges.length).toBeGreaterThan(0);
    });

    it('should not open dropdown when disabled', () => {
      render(<RoleSelector {...defaultProps} disabled={true} />);
      
      const button = screen.getByRole('button');
      fireEvent.click(button);
      
      // Dropdown should not open
      expect(screen.queryByText('Standard user with basic access')).not.toBeInTheDocument();
    });
  });

  describe('Role Selection', () => {
    it('should show confirmation dialog when selecting a different role', async () => {
      render(<RoleSelector {...defaultProps} currentRole="user" />);
      
      // Open dropdown
      const button = screen.getByRole('button');
      fireEvent.click(button);
      
      // Click on BUSINESS role
      const businessOption = screen.getByText('Business user with API access').closest('button');
      fireEvent.click(businessOption);
      
      // Confirmation dialog should appear
      await waitFor(() => {
        expect(screen.getByText('Change User Role')).toBeInTheDocument();
      });
    });

    it('should not show confirmation when selecting the same role', () => {
      render(<RoleSelector {...defaultProps} currentRole="user" />);
      
      // Open dropdown
      const button = screen.getByRole('button');
      fireEvent.click(button);
      
      // Click on USER role (same as current)
      const userOption = screen.getByText('Standard user with basic access').closest('button');
      fireEvent.click(userOption);
      
      // Confirmation dialog should NOT appear
      expect(screen.queryByText('Change User Role')).not.toBeInTheDocument();
    });

    it('should show warning message for ADMIN role assignment', async () => {
      render(<RoleSelector {...defaultProps} currentRole="user" />);
      
      // Open dropdown
      const button = screen.getByRole('button');
      fireEvent.click(button);
      
      // Click on ADMIN role
      const adminOption = screen.getByText('Administrator with full system access').closest('button');
      fireEvent.click(adminOption);
      
      // Should show warning in confirmation dialog
      await waitFor(() => {
        expect(screen.getByText(/WARNING: You are about to grant ADMIN privileges/i)).toBeInTheDocument();
      });
    });

    it('should require reason for role change', async () => {
      render(<RoleSelector {...defaultProps} currentRole="user" />);
      
      // Open dropdown and select BUSINESS role
      const button = screen.getByRole('button');
      fireEvent.click(button);
      const businessOption = screen.getByText('Business user with API access').closest('button');
      fireEvent.click(businessOption);
      
      // Wait for confirmation dialog
      await waitFor(() => {
        expect(screen.getByText('Change User Role')).toBeInTheDocument();
      });
      
      // Should have reason textarea
      expect(screen.getByPlaceholderText(/Enter reason/i)).toBeInTheDocument();
    });

    it('should validate minimum reason length', async () => {
      render(<RoleSelector {...defaultProps} currentRole="user" />);
      
      // Open dropdown and select BUSINESS role
      const button = screen.getByRole('button');
      fireEvent.click(button);
      const businessOption = screen.getByText('Business user with API access').closest('button');
      fireEvent.click(businessOption);
      
      // Wait for confirmation dialog
      await waitFor(() => {
        expect(screen.getByText('Change User Role')).toBeInTheDocument();
      });
      
      // Enter short reason
      const reasonInput = screen.getByPlaceholderText(/Enter reason/i);
      fireEvent.change(reasonInput, { target: { value: 'Short' } });
      
      // Try to confirm
      const confirmButton = screen.getByText('Change Role');
      fireEvent.click(confirmButton);
      
      // Should show validation error
      await waitFor(() => {
        expect(screen.getByText(/must be at least 10 characters/i)).toBeInTheDocument();
      });
      
      // onRoleChange should not be called
      expect(mockOnRoleChange).not.toHaveBeenCalled();
    });

    it('should call onRoleChange with correct parameters when confirmed', async () => {
      render(<RoleSelector {...defaultProps} currentRole="user" />);
      
      // Open dropdown and select BUSINESS role
      const button = screen.getByRole('button');
      fireEvent.click(button);
      const businessOption = screen.getByText('Business user with API access').closest('button');
      fireEvent.click(businessOption);
      
      // Wait for confirmation dialog
      await waitFor(() => {
        expect(screen.getByText('Change User Role')).toBeInTheDocument();
      });
      
      // Enter valid reason
      const reasonInput = screen.getByPlaceholderText(/Enter reason/i);
      fireEvent.change(reasonInput, { target: { value: 'Upgrading to business account' } });
      
      // Confirm
      const confirmButton = screen.getByText('Change Role');
      fireEvent.click(confirmButton);
      
      // Should call onRoleChange with correct parameters
      await waitFor(() => {
        expect(mockOnRoleChange).toHaveBeenCalledWith(
          'user-123',
          'business',
          'Upgrading to business account'
        );
      });
    });

    it('should not call onRoleChange when cancelled', async () => {
      render(<RoleSelector {...defaultProps} currentRole="user" />);
      
      // Open dropdown and select BUSINESS role
      const button = screen.getByRole('button');
      fireEvent.click(button);
      const businessOption = screen.getByText('Business user with API access').closest('button');
      fireEvent.click(businessOption);
      
      // Wait for confirmation dialog
      await waitFor(() => {
        expect(screen.getByText('Change User Role')).toBeInTheDocument();
      });
      
      // Cancel
      const cancelButton = screen.getByText('Cancel');
      fireEvent.click(cancelButton);
      
      // Should not call onRoleChange
      expect(mockOnRoleChange).not.toHaveBeenCalled();
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA attributes', () => {
      render(<RoleSelector {...defaultProps} />);
      
      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('aria-haspopup', 'listbox');
      expect(button).toHaveAttribute('aria-expanded', 'false');
      
      // Open dropdown
      fireEvent.click(button);
      expect(button).toHaveAttribute('aria-expanded', 'true');
    });

    it('should have proper role attributes in dropdown', () => {
      render(<RoleSelector {...defaultProps} />);
      
      // Open dropdown
      const button = screen.getByRole('button');
      fireEvent.click(button);
      
      // Should have listbox role
      expect(screen.getByRole('listbox')).toBeInTheDocument();
      
      // Should have option roles
      const options = screen.getAllByRole('option');
      expect(options).toHaveLength(3);
    });
  });

  describe('Visual States', () => {
    it('should rotate chevron icon when dropdown is open', () => {
      render(<RoleSelector {...defaultProps} />);
      
      const button = screen.getByRole('button');
      
      // Check initial state (chevron not rotated)
      const chevron = button.querySelector('svg:last-child');
      expect(chevron).not.toHaveClass('rotate-180');
      
      // Open dropdown
      fireEvent.click(button);
      
      // Chevron should be rotated
      expect(chevron).toHaveClass('rotate-180');
    });

    it('should use danger styling for ADMIN role confirmation', async () => {
      render(<RoleSelector {...defaultProps} currentRole="user" />);
      
      // Open dropdown and select ADMIN role
      const button = screen.getByRole('button');
      fireEvent.click(button);
      const adminOption = screen.getByText('Administrator with full system access').closest('button');
      fireEvent.click(adminOption);
      
      // Wait for confirmation dialog
      await waitFor(() => {
        expect(screen.getByText('Change User Role')).toBeInTheDocument();
      });
      
      // Confirm button should have danger styling (red color)
      const confirmButton = screen.getByText('Change Role');
      expect(confirmButton).toHaveStyle({ color: '#F87171' });
    });
  });
});
