/**
 * Unit tests for StatusToggle component
 * 
 * Tests:
 * - Renders with current status
 * - Opens dropdown on click
 * - Shows all status options
 * - Marks current status in dropdown
 * - Does not open dialog when selecting same status
 * - Opens confirmation dialog when selecting different status
 * - Requires reason for deactivation
 * - Requires reason for suspension
 * - Does not require reason for activation
 * - Calls onStatusChange with correct parameters
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import StatusToggle from './StatusToggle';

describe('StatusToggle', () => {
  let mockOnStatusChange;

  beforeEach(() => {
    mockOnStatusChange = vi.fn();
  });

  it('should render with current status', () => {
    render(
      <StatusToggle
        currentStatus="active"
        userId="user-123"
        onStatusChange={mockOnStatusChange}
      />
    );

    expect(screen.getByText('Active')).toBeInTheDocument();
    expect(screen.getByLabelText(/Current status: Active/i)).toBeInTheDocument();
  });

  it('should open dropdown on click', () => {
    render(
      <StatusToggle
        currentStatus="active"
        userId="user-123"
        onStatusChange={mockOnStatusChange}
      />
    );

    const button = screen.getByLabelText(/Current status: Active/i);
    fireEvent.click(button);

    // All status options should be visible
    expect(screen.getAllByText('Active')).toHaveLength(2); // Button + dropdown option
    expect(screen.getByText('Inactive')).toBeInTheDocument();
    expect(screen.getByText('Suspended')).toBeInTheDocument();
  });

  it('should mark current status in dropdown', () => {
    render(
      <StatusToggle
        currentStatus="active"
        userId="user-123"
        onStatusChange={mockOnStatusChange}
      />
    );

    const button = screen.getByLabelText(/Current status: Active/i);
    fireEvent.click(button);

    // Current status should have "Current" badge
    expect(screen.getByText('Current')).toBeInTheDocument();
  });

  it('should not open dialog when selecting same status', () => {
    render(
      <StatusToggle
        currentStatus="active"
        userId="user-123"
        onStatusChange={mockOnStatusChange}
      />
    );

    // Open dropdown
    const button = screen.getByLabelText(/Current status: Active/i);
    fireEvent.click(button);

    // Click on current status (Active)
    const activeOptions = screen.getAllByText('Active');
    const activeOptionInDropdown = activeOptions.find(
      (el) => el.closest('button[role="option"]')
    );
    fireEvent.click(activeOptionInDropdown.closest('button'));

    // Confirmation dialog should not appear
    expect(screen.queryByText('Change User Status')).not.toBeInTheDocument();
  });

  it('should open confirmation dialog when selecting different status', () => {
    render(
      <StatusToggle
        currentStatus="active"
        userId="user-123"
        onStatusChange={mockOnStatusChange}
      />
    );

    // Open dropdown
    const button = screen.getByLabelText(/Current status: Active/i);
    fireEvent.click(button);

    // Click on Inactive
    const inactiveOption = screen.getByText('Inactive');
    fireEvent.click(inactiveOption.closest('button'));

    // Confirmation dialog should appear
    expect(screen.getByText('Change User Status')).toBeInTheDocument();
  });

  it('should require reason for deactivation', () => {
    render(
      <StatusToggle
        currentStatus="active"
        userId="user-123"
        onStatusChange={mockOnStatusChange}
      />
    );

    // Open dropdown and select Inactive
    const button = screen.getByLabelText(/Current status: Active/i);
    fireEvent.click(button);
    const inactiveOption = screen.getByText('Inactive');
    fireEvent.click(inactiveOption.closest('button'));

    // Confirmation dialog should have reason input
    expect(screen.getByPlaceholderText(/Enter reason/i)).toBeInTheDocument();
    expect(screen.getByText(/minimum 10 characters/i)).toBeInTheDocument();
  });

  it('should require reason for suspension', () => {
    render(
      <StatusToggle
        currentStatus="active"
        userId="user-123"
        onStatusChange={mockOnStatusChange}
      />
    );

    // Open dropdown and select Suspended
    const button = screen.getByLabelText(/Current status: Active/i);
    fireEvent.click(button);
    const suspendedOption = screen.getByText('Suspended');
    fireEvent.click(suspendedOption.closest('button'));

    // Confirmation dialog should have reason input
    expect(screen.getByPlaceholderText(/Enter reason/i)).toBeInTheDocument();
    expect(screen.getByText(/minimum 10 characters/i)).toBeInTheDocument();
  });

  it('should not require reason for activation', () => {
    render(
      <StatusToggle
        currentStatus="inactive"
        userId="user-123"
        onStatusChange={mockOnStatusChange}
      />
    );

    // Open dropdown and select Active
    const button = screen.getByLabelText(/Current status: Inactive/i);
    fireEvent.click(button);
    const activeOption = screen.getByText('Active');
    fireEvent.click(activeOption.closest('button'));

    // Confirmation dialog should not have reason input
    expect(screen.queryByPlaceholderText(/Enter reason/i)).not.toBeInTheDocument();
  });

  it('should call onStatusChange with correct parameters when confirmed', async () => {
    render(
      <StatusToggle
        currentStatus="active"
        userId="user-123"
        onStatusChange={mockOnStatusChange}
      />
    );

    // Open dropdown and select Inactive
    const button = screen.getByLabelText(/Current status: Active/i);
    fireEvent.click(button);
    const inactiveOption = screen.getByText('Inactive');
    fireEvent.click(inactiveOption.closest('button'));

    // Enter reason
    const reasonInput = screen.getByPlaceholderText(/Enter reason/i);
    fireEvent.change(reasonInput, { target: { value: 'User requested deactivation' } });

    // Confirm
    const confirmButton = screen.getByText('Change Status');
    fireEvent.click(confirmButton);

    // onStatusChange should be called with correct parameters
    await waitFor(() => {
      expect(mockOnStatusChange).toHaveBeenCalledWith(
        'user-123',
        'inactive',
        'User requested deactivation'
      );
    });
  });

  it('should call onStatusChange without reason for activation', async () => {
    render(
      <StatusToggle
        currentStatus="inactive"
        userId="user-123"
        onStatusChange={mockOnStatusChange}
      />
    );

    // Open dropdown and select Active
    const button = screen.getByLabelText(/Current status: Inactive/i);
    fireEvent.click(button);
    const activeOption = screen.getByText('Active');
    fireEvent.click(activeOption.closest('button'));

    // Confirm (no reason required)
    const confirmButton = screen.getByText('Change Status');
    fireEvent.click(confirmButton);

    // onStatusChange should be called without reason
    await waitFor(() => {
      expect(mockOnStatusChange).toHaveBeenCalledWith(
        'user-123',
        'active',
        undefined
      );
    });
  });

  it('should not call onStatusChange when cancelled', () => {
    render(
      <StatusToggle
        currentStatus="active"
        userId="user-123"
        onStatusChange={mockOnStatusChange}
      />
    );

    // Open dropdown and select Inactive
    const button = screen.getByLabelText(/Current status: Active/i);
    fireEvent.click(button);
    const inactiveOption = screen.getByText('Inactive');
    fireEvent.click(inactiveOption.closest('button'));

    // Cancel
    const cancelButton = screen.getByText('Cancel');
    fireEvent.click(cancelButton);

    // onStatusChange should not be called
    expect(mockOnStatusChange).not.toHaveBeenCalled();
  });

  it('should be disabled when disabled prop is true', () => {
    render(
      <StatusToggle
        currentStatus="active"
        userId="user-123"
        onStatusChange={mockOnStatusChange}
        disabled={true}
      />
    );

    const button = screen.getByLabelText(/Current status: Active/i);
    expect(button).toBeDisabled();

    // Clicking should not open dropdown
    fireEvent.click(button);
    expect(screen.queryByText('Inactive')).not.toBeInTheDocument();
  });

  it('should close dropdown when clicking outside', () => {
    render(
      <div>
        <StatusToggle
          currentStatus="active"
          userId="user-123"
          onStatusChange={mockOnStatusChange}
        />
        <div data-testid="outside">Outside element</div>
      </div>
    );

    // Open dropdown
    const button = screen.getByLabelText(/Current status: Active/i);
    fireEvent.click(button);
    expect(screen.getByText('Inactive')).toBeInTheDocument();

    // Click outside
    const outside = screen.getByTestId('outside');
    fireEvent.mouseDown(outside);

    // Dropdown should close
    expect(screen.queryByText('Inactive')).not.toBeInTheDocument();
  });

  it('should display warning message for suspension', () => {
    render(
      <StatusToggle
        currentStatus="active"
        userId="user-123"
        onStatusChange={mockOnStatusChange}
      />
    );

    // Open dropdown and select Suspended
    const button = screen.getByLabelText(/Current status: Active/i);
    fireEvent.click(button);
    const suspendedOption = screen.getByText('Suspended');
    fireEvent.click(suspendedOption.closest('button'));

    // Warning message should be displayed
    expect(screen.getByText(/WARNING/i)).toBeInTheDocument();
    expect(screen.getByText(/suspend this user's account/i)).toBeInTheDocument();
  });

  it('should validate minimum reason length', async () => {
    render(
      <StatusToggle
        currentStatus="active"
        userId="user-123"
        onStatusChange={mockOnStatusChange}
      />
    );

    // Open dropdown and select Inactive
    const button = screen.getByLabelText(/Current status: Active/i);
    fireEvent.click(button);
    const inactiveOption = screen.getByText('Inactive');
    fireEvent.click(inactiveOption.closest('button'));

    // Enter short reason
    const reasonInput = screen.getByPlaceholderText(/Enter reason/i);
    fireEvent.change(reasonInput, { target: { value: 'Short' } });

    // Try to confirm
    const confirmButton = screen.getByText('Change Status');
    fireEvent.click(confirmButton);

    // Error message should appear
    await waitFor(() => {
      expect(screen.getByText(/must be at least 10 characters/i)).toBeInTheDocument();
    });

    // onStatusChange should not be called
    expect(mockOnStatusChange).not.toHaveBeenCalled();
  });
});
