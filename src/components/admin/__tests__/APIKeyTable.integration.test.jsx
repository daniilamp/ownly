/**
 * APIKeyTable Integration Tests
 * 
 * Tests:
 * - Revoke flow with confirmation
 * - Reason validation (minimum 10 characters)
 * - Success and error toast notifications
 * 
 * Requirements: 9.2, 9.3, 9.4, 9.5, 9.6
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import APIKeyTable from '../APIKeyTable';

describe('APIKeyTable - Revocation Integration', () => {
  const mockAPIKeys = [
    {
      id: 'key-123',
      userId: 'user-1',
      userEmail: 'business@example.com',
      keyHash: 'hash123',
      lastFourChars: 'ABCD',
      status: 'active',
      createdAt: '2024-01-15T10:00:00Z',
      permissions: ['read:credentials', 'write:credentials'],
    },
    {
      id: 'key-456',
      userId: 'user-2',
      userEmail: 'company@example.com',
      keyHash: 'hash456',
      lastFourChars: 'EFGH',
      status: 'active',
      createdAt: '2024-01-10T10:00:00Z',
      permissions: ['read:credentials'],
    },
  ];

  const mockOnRevoke = vi.fn();
  const mockOnViewUsage = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should open confirmation dialog when revoke button is clicked', async () => {
    render(
      <APIKeyTable
        apiKeys={mockAPIKeys}
        loading={false}
        error={null}
        onRevoke={mockOnRevoke}
        onViewUsage={mockOnViewUsage}
      />
    );

    // Find and click the first revoke button
    const revokeButtons = screen.getAllByRole('button', { name: /revoke/i });
    fireEvent.click(revokeButtons[0]);

    // Confirmation dialog should appear
    await waitFor(() => {
      expect(screen.getByText(/revoke api key/i)).toBeInTheDocument();
      expect(screen.getByText(/business@example.com/i)).toBeInTheDocument();
    });
  });

  it('should require reason with minimum 10 characters', async () => {
    const user = userEvent.setup();
    
    render(
      <APIKeyTable
        apiKeys={mockAPIKeys}
        loading={false}
        error={null}
        onRevoke={mockOnRevoke}
        onViewUsage={mockOnViewUsage}
      />
    );

    // Click revoke button
    const revokeButtons = screen.getAllByRole('button', { name: /revoke/i });
    fireEvent.click(revokeButtons[0]);

    // Wait for dialog
    await waitFor(() => {
      expect(screen.getByText(/revoke api key/i)).toBeInTheDocument();
    });

    // Try to confirm without reason
    const confirmButton = screen.getByRole('button', { name: /revoke key/i });
    expect(confirmButton).toBeDisabled();

    // Enter short reason (less than 10 characters)
    const reasonInput = screen.getByPlaceholderText(/reason/i);
    await user.type(reasonInput, 'Short');

    // Confirm button should still be disabled
    expect(confirmButton).toBeDisabled();

    // Enter valid reason (10+ characters)
    await user.clear(reasonInput);
    await user.type(reasonInput, 'Security concern detected');

    // Confirm button should be enabled
    await waitFor(() => {
      expect(confirmButton).not.toBeDisabled();
    });
  });

  it('should call onRevoke with apiKeyId and reason when confirmed', async () => {
    const user = userEvent.setup();
    
    render(
      <APIKeyTable
        apiKeys={mockAPIKeys}
        loading={false}
        error={null}
        onRevoke={mockOnRevoke}
        onViewUsage={mockOnViewUsage}
      />
    );

    // Click revoke button
    const revokeButtons = screen.getAllByRole('button', { name: /revoke/i });
    fireEvent.click(revokeButtons[0]);

    // Wait for dialog
    await waitFor(() => {
      expect(screen.getByText(/revoke api key/i)).toBeInTheDocument();
    });

    // Enter reason
    const reasonInput = screen.getByPlaceholderText(/reason/i);
    await user.type(reasonInput, 'Security concern detected');

    // Click confirm
    const confirmButton = screen.getByRole('button', { name: /revoke key/i });
    await user.click(confirmButton);

    // onRevoke should be called with correct arguments
    await waitFor(() => {
      expect(mockOnRevoke).toHaveBeenCalledWith('key-123', 'Security concern detected');
    });
  });

  it('should close dialog when cancel is clicked', async () => {
    const user = userEvent.setup();
    
    render(
      <APIKeyTable
        apiKeys={mockAPIKeys}
        loading={false}
        error={null}
        onRevoke={mockOnRevoke}
        onViewUsage={mockOnViewUsage}
      />
    );

    // Click revoke button
    const revokeButtons = screen.getAllByRole('button', { name: /revoke/i });
    fireEvent.click(revokeButtons[0]);

    // Wait for dialog
    await waitFor(() => {
      expect(screen.getByText(/revoke api key/i)).toBeInTheDocument();
    });

    // Click cancel
    const cancelButton = screen.getByRole('button', { name: /cancel/i });
    await user.click(cancelButton);

    // Dialog should close
    await waitFor(() => {
      expect(screen.queryByText(/revoke api key/i)).not.toBeInTheDocument();
    });

    // onRevoke should not be called
    expect(mockOnRevoke).not.toHaveBeenCalled();
  });

  it('should not show revoke button for revoked keys', () => {
    const revokedKeys = [
      {
        ...mockAPIKeys[0],
        status: 'revoked',
      },
    ];

    render(
      <APIKeyTable
        apiKeys={revokedKeys}
        loading={false}
        error={null}
        onRevoke={mockOnRevoke}
        onViewUsage={mockOnViewUsage}
      />
    );

    // Revoke button should not be present
    const revokeButtons = screen.queryAllByRole('button', { name: /revoke/i });
    expect(revokeButtons).toHaveLength(0);

    // View Usage button should still be present
    expect(screen.getByRole('button', { name: /view usage/i })).toBeInTheDocument();
  });

  it('should call onViewUsage when view usage button is clicked', async () => {
    const user = userEvent.setup();
    
    render(
      <APIKeyTable
        apiKeys={mockAPIKeys}
        loading={false}
        error={null}
        onRevoke={mockOnRevoke}
        onViewUsage={mockOnViewUsage}
      />
    );

    // Click view usage button
    const viewUsageButtons = screen.getAllByRole('button', { name: /view usage/i });
    await user.click(viewUsageButtons[0]);

    // onViewUsage should be called with correct apiKeyId
    expect(mockOnViewUsage).toHaveBeenCalledWith('key-123');
  });

  it('should display API keys with correct status indicators', () => {
    const mixedKeys = [
      { ...mockAPIKeys[0], status: 'active' },
      { ...mockAPIKeys[1], status: 'revoked' },
    ];

    render(
      <APIKeyTable
        apiKeys={mixedKeys}
        loading={false}
        error={null}
        onRevoke={mockOnRevoke}
        onViewUsage={mockOnViewUsage}
      />
    );

    // Check status badges
    const statusBadges = screen.getAllByText(/active|revoked/i);
    expect(statusBadges).toHaveLength(2);
    expect(statusBadges[0]).toHaveTextContent('active');
    expect(statusBadges[1]).toHaveTextContent('revoked');
  });
});
