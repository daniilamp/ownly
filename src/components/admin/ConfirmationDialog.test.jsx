/**
 * Unit tests for ConfirmationDialog component
 * Tests validation logic, callbacks, keyboard shortcuts, and accessibility
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ConfirmationDialog from './ConfirmationDialog';

describe('ConfirmationDialog', () => {
  const mockOnConfirm = vi.fn();
  const mockOnCancel = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should not render when isOpen is false', () => {
      render(
        <ConfirmationDialog
          isOpen={false}
          title="Test Title"
          message="Test message"
          onConfirm={mockOnConfirm}
          onCancel={mockOnCancel}
        />
      );

      expect(screen.queryByText('Test Title')).not.toBeInTheDocument();
    });

    it('should render when isOpen is true', () => {
      render(
        <ConfirmationDialog
          isOpen={true}
          title="Test Title"
          message="Test message"
          onConfirm={mockOnConfirm}
          onCancel={mockOnCancel}
        />
      );

      expect(screen.getByText('Test Title')).toBeInTheDocument();
      expect(screen.getByText('Test message')).toBeInTheDocument();
    });

    it('should render with custom confirm label', () => {
      render(
        <ConfirmationDialog
          isOpen={true}
          title="Delete User"
          message="Are you sure?"
          confirmLabel="Delete"
          onConfirm={mockOnConfirm}
          onCancel={mockOnCancel}
        />
      );

      expect(screen.getByText('Delete')).toBeInTheDocument();
    });

    it('should render with default confirm label', () => {
      render(
        <ConfirmationDialog
          isOpen={true}
          title="Test"
          message="Test"
          onConfirm={mockOnConfirm}
          onCancel={mockOnCancel}
        />
      );

      expect(screen.getByText('Confirm')).toBeInTheDocument();
    });

    it('should render Cancel button', () => {
      render(
        <ConfirmationDialog
          isOpen={true}
          title="Test"
          message="Test"
          onConfirm={mockOnConfirm}
          onCancel={mockOnCancel}
        />
      );

      expect(screen.getByText('Cancel')).toBeInTheDocument();
    });

    it('should render close button', () => {
      render(
        <ConfirmationDialog
          isOpen={true}
          title="Test"
          message="Test"
          onConfirm={mockOnConfirm}
          onCancel={mockOnCancel}
        />
      );

      const closeButton = screen.getByLabelText('Close dialog');
      expect(closeButton).toBeInTheDocument();
    });
  });

  describe('Danger Styling', () => {
    it('should apply danger styling by default', () => {
      const { container } = render(
        <ConfirmationDialog
          isOpen={true}
          title="Test"
          message="Test"
          onConfirm={mockOnConfirm}
          onCancel={mockOnCancel}
        />
      );

      // Check if danger color is applied (red tones)
      const confirmButton = screen.getByText('Confirm');
      expect(confirmButton).toHaveStyle({ color: '#F87171' });
    });

    it('should apply non-danger styling when danger is false', () => {
      const { container } = render(
        <ConfirmationDialog
          isOpen={true}
          title="Test"
          message="Test"
          danger={false}
          onConfirm={mockOnConfirm}
          onCancel={mockOnCancel}
        />
      );

      const confirmButton = screen.getByText('Confirm');
      expect(confirmButton).toHaveStyle({ color: '#070510' });
    });
  });

  describe('Reason Input', () => {
    it('should not render reason input when requireReason is false', () => {
      render(
        <ConfirmationDialog
          isOpen={true}
          title="Test"
          message="Test"
          requireReason={false}
          onConfirm={mockOnConfirm}
          onCancel={mockOnCancel}
        />
      );

      expect(screen.queryByPlaceholderText(/reason/i)).not.toBeInTheDocument();
    });

    it('should render reason input when requireReason is true', () => {
      render(
        <ConfirmationDialog
          isOpen={true}
          title="Test"
          message="Test"
          requireReason={true}
          onConfirm={mockOnConfirm}
          onCancel={mockOnCancel}
        />
      );

      expect(screen.getByPlaceholderText(/reason/i)).toBeInTheDocument();
    });

    it('should display minimum character requirement in label', () => {
      render(
        <ConfirmationDialog
          isOpen={true}
          title="Test"
          message="Test"
          requireReason={true}
          minReasonLength={15}
          onConfirm={mockOnConfirm}
          onCancel={mockOnCancel}
        />
      );

      expect(screen.getByText(/minimum 15 characters/i)).toBeInTheDocument();
    });

    it('should update reason value when typing', () => {
      render(
        <ConfirmationDialog
          isOpen={true}
          title="Test"
          message="Test"
          requireReason={true}
          onConfirm={mockOnConfirm}
          onCancel={mockOnCancel}
        />
      );

      const textarea = screen.getByPlaceholderText(/reason/i);
      fireEvent.change(textarea, { target: { value: 'Test reason' } });

      expect(textarea.value).toBe('Test reason');
    });

    it('should display character count when typing', () => {
      render(
        <ConfirmationDialog
          isOpen={true}
          title="Test"
          message="Test"
          requireReason={true}
          minReasonLength={10}
          onConfirm={mockOnConfirm}
          onCancel={mockOnCancel}
        />
      );

      const textarea = screen.getByPlaceholderText(/reason/i);
      fireEvent.change(textarea, { target: { value: 'Test reason' } });

      expect(screen.getByText('11 / 10 characters')).toBeInTheDocument();
    });
  });

  describe('Validation', () => {
    it('should show error when reason is empty and required', () => {
      render(
        <ConfirmationDialog
          isOpen={true}
          title="Test"
          message="Test"
          requireReason={true}
          onConfirm={mockOnConfirm}
          onCancel={mockOnCancel}
        />
      );

      const confirmButton = screen.getByText('Confirm');
      fireEvent.click(confirmButton);

      expect(screen.getByText('Reason is required')).toBeInTheDocument();
      expect(mockOnConfirm).not.toHaveBeenCalled();
    });

    it('should show error when reason is too short', () => {
      render(
        <ConfirmationDialog
          isOpen={true}
          title="Test"
          message="Test"
          requireReason={true}
          minReasonLength={10}
          onConfirm={mockOnConfirm}
          onCancel={mockOnCancel}
        />
      );

      const textarea = screen.getByPlaceholderText(/reason/i);
      fireEvent.change(textarea, { target: { value: 'Short' } });

      const confirmButton = screen.getByText('Confirm');
      fireEvent.click(confirmButton);

      expect(screen.getByText('Reason must be at least 10 characters')).toBeInTheDocument();
      expect(mockOnConfirm).not.toHaveBeenCalled();
    });

    it('should clear error when user starts typing', () => {
      render(
        <ConfirmationDialog
          isOpen={true}
          title="Test"
          message="Test"
          requireReason={true}
          minReasonLength={10}
          onConfirm={mockOnConfirm}
          onCancel={mockOnCancel}
        />
      );

      // Trigger error
      const confirmButton = screen.getByText('Confirm');
      fireEvent.click(confirmButton);
      expect(screen.getByText('Reason is required')).toBeInTheDocument();

      // Start typing
      const textarea = screen.getByPlaceholderText(/reason/i);
      fireEvent.change(textarea, { target: { value: 'T' } });

      expect(screen.queryByText('Reason is required')).not.toBeInTheDocument();
    });

    it('should call onConfirm with reason when validation passes', () => {
      render(
        <ConfirmationDialog
          isOpen={true}
          title="Test"
          message="Test"
          requireReason={true}
          minReasonLength={10}
          onConfirm={mockOnConfirm}
          onCancel={mockOnCancel}
        />
      );

      const textarea = screen.getByPlaceholderText(/reason/i);
      fireEvent.change(textarea, { target: { value: 'Valid reason text' } });

      const confirmButton = screen.getByText('Confirm');
      fireEvent.click(confirmButton);

      expect(mockOnConfirm).toHaveBeenCalledWith('Valid reason text');
    });

    it('should trim whitespace from reason before validation', () => {
      render(
        <ConfirmationDialog
          isOpen={true}
          title="Test"
          message="Test"
          requireReason={true}
          minReasonLength={10}
          onConfirm={mockOnConfirm}
          onCancel={mockOnCancel}
        />
      );

      const textarea = screen.getByPlaceholderText(/reason/i);
      fireEvent.change(textarea, { target: { value: '  Valid reason text  ' } });

      const confirmButton = screen.getByText('Confirm');
      fireEvent.click(confirmButton);

      expect(mockOnConfirm).toHaveBeenCalledWith('Valid reason text');
    });

    it('should call onConfirm without reason when requireReason is false', () => {
      render(
        <ConfirmationDialog
          isOpen={true}
          title="Test"
          message="Test"
          requireReason={false}
          onConfirm={mockOnConfirm}
          onCancel={mockOnCancel}
        />
      );

      const confirmButton = screen.getByText('Confirm');
      fireEvent.click(confirmButton);

      expect(mockOnConfirm).toHaveBeenCalledWith(undefined);
    });
  });

  describe('Callbacks', () => {
    it('should call onCancel when Cancel button is clicked', () => {
      render(
        <ConfirmationDialog
          isOpen={true}
          title="Test"
          message="Test"
          onConfirm={mockOnConfirm}
          onCancel={mockOnCancel}
        />
      );

      const cancelButton = screen.getByText('Cancel');
      fireEvent.click(cancelButton);

      expect(mockOnCancel).toHaveBeenCalled();
      expect(mockOnConfirm).not.toHaveBeenCalled();
    });

    it('should call onCancel when close button is clicked', () => {
      render(
        <ConfirmationDialog
          isOpen={true}
          title="Test"
          message="Test"
          onConfirm={mockOnConfirm}
          onCancel={mockOnCancel}
        />
      );

      const closeButton = screen.getByLabelText('Close dialog');
      fireEvent.click(closeButton);

      expect(mockOnCancel).toHaveBeenCalled();
      expect(mockOnConfirm).not.toHaveBeenCalled();
    });

    it('should call onConfirm when Confirm button is clicked', () => {
      render(
        <ConfirmationDialog
          isOpen={true}
          title="Test"
          message="Test"
          onConfirm={mockOnConfirm}
          onCancel={mockOnCancel}
        />
      );

      const confirmButton = screen.getByText('Confirm');
      fireEvent.click(confirmButton);

      expect(mockOnConfirm).toHaveBeenCalled();
      expect(mockOnCancel).not.toHaveBeenCalled();
    });
  });

  describe('Keyboard Shortcuts', () => {
    it('should call onCancel when Escape key is pressed', () => {
      render(
        <ConfirmationDialog
          isOpen={true}
          title="Test"
          message="Test"
          onConfirm={mockOnConfirm}
          onCancel={mockOnCancel}
        />
      );

      fireEvent.keyDown(document, { key: 'Escape' });

      expect(mockOnCancel).toHaveBeenCalled();
    });

    it('should call onConfirm when Enter key is pressed (without reason)', () => {
      render(
        <ConfirmationDialog
          isOpen={true}
          title="Test"
          message="Test"
          requireReason={false}
          onConfirm={mockOnConfirm}
          onCancel={mockOnCancel}
        />
      );

      fireEvent.keyDown(document, { key: 'Enter' });

      expect(mockOnConfirm).toHaveBeenCalled();
    });

    it('should not call onConfirm when Enter key is pressed with reason required', () => {
      render(
        <ConfirmationDialog
          isOpen={true}
          title="Test"
          message="Test"
          requireReason={true}
          onConfirm={mockOnConfirm}
          onCancel={mockOnCancel}
        />
      );

      fireEvent.keyDown(document, { key: 'Enter' });

      // Enter should not trigger confirm when reason is required (used for textarea)
      expect(mockOnConfirm).not.toHaveBeenCalled();
    });

    it('should not respond to keyboard shortcuts when dialog is closed', () => {
      render(
        <ConfirmationDialog
          isOpen={false}
          title="Test"
          message="Test"
          onConfirm={mockOnConfirm}
          onCancel={mockOnCancel}
        />
      );

      fireEvent.keyDown(document, { key: 'Escape' });
      fireEvent.keyDown(document, { key: 'Enter' });

      expect(mockOnCancel).not.toHaveBeenCalled();
      expect(mockOnConfirm).not.toHaveBeenCalled();
    });
  });

  describe('State Reset', () => {
    it('should reset reason and error when dialog opens', () => {
      const { rerender } = render(
        <ConfirmationDialog
          isOpen={false}
          title="Test"
          message="Test"
          requireReason={true}
          onConfirm={mockOnConfirm}
          onCancel={mockOnCancel}
        />
      );

      // Open dialog
      rerender(
        <ConfirmationDialog
          isOpen={true}
          title="Test"
          message="Test"
          requireReason={true}
          onConfirm={mockOnConfirm}
          onCancel={mockOnCancel}
        />
      );

      // Type reason and trigger error
      const textarea = screen.getByPlaceholderText(/reason/i);
      fireEvent.change(textarea, { target: { value: 'Short' } });
      
      const confirmButton = screen.getByText('Confirm');
      fireEvent.click(confirmButton);

      expect(screen.getByText(/must be at least/i)).toBeInTheDocument();

      // Close and reopen
      rerender(
        <ConfirmationDialog
          isOpen={false}
          title="Test"
          message="Test"
          requireReason={true}
          onConfirm={mockOnConfirm}
          onCancel={mockOnCancel}
        />
      );

      rerender(
        <ConfirmationDialog
          isOpen={true}
          title="Test"
          message="Test"
          requireReason={true}
          onConfirm={mockOnConfirm}
          onCancel={mockOnCancel}
        />
      );

      // Reason should be cleared
      const newTextarea = screen.getByPlaceholderText(/reason/i);
      expect(newTextarea.value).toBe('');
      
      // Error should be cleared
      expect(screen.queryByText(/must be at least/i)).not.toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA attributes', () => {
      render(
        <ConfirmationDialog
          isOpen={true}
          title="Test Title"
          message="Test message"
          onConfirm={mockOnConfirm}
          onCancel={mockOnCancel}
        />
      );

      const dialog = screen.getByRole('dialog');
      expect(dialog).toHaveAttribute('aria-modal', 'true');
      expect(dialog).toHaveAttribute('aria-labelledby', 'dialog-title');
      expect(dialog).toHaveAttribute('aria-describedby', 'dialog-description');
    });

    it('should mark textarea as invalid when there is an error', () => {
      render(
        <ConfirmationDialog
          isOpen={true}
          title="Test"
          message="Test"
          requireReason={true}
          onConfirm={mockOnConfirm}
          onCancel={mockOnCancel}
        />
      );

      const confirmButton = screen.getByText('Confirm');
      fireEvent.click(confirmButton);

      const textarea = screen.getByPlaceholderText(/reason/i);
      expect(textarea).toHaveAttribute('aria-invalid', 'true');
      expect(textarea).toHaveAttribute('aria-describedby', 'reason-error');
    });

    it('should announce error with role alert', () => {
      render(
        <ConfirmationDialog
          isOpen={true}
          title="Test"
          message="Test"
          requireReason={true}
          onConfirm={mockOnConfirm}
          onCancel={mockOnCancel}
        />
      );

      const confirmButton = screen.getByText('Confirm');
      fireEvent.click(confirmButton);

      const errorMessage = screen.getByRole('alert');
      expect(errorMessage).toHaveTextContent('Reason is required');
    });

    it('should have accessible labels for buttons', () => {
      render(
        <ConfirmationDialog
          isOpen={true}
          title="Test"
          message="Test"
          onConfirm={mockOnConfirm}
          onCancel={mockOnCancel}
        />
      );

      expect(screen.getByLabelText('Close dialog')).toBeInTheDocument();
    });

    it('should have label associated with textarea', () => {
      render(
        <ConfirmationDialog
          isOpen={true}
          title="Test"
          message="Test"
          requireReason={true}
          onConfirm={mockOnConfirm}
          onCancel={mockOnCancel}
        />
      );

      const textarea = screen.getByPlaceholderText(/reason/i);
      expect(textarea).toHaveAttribute('id', 'reason-input');
      
      const label = screen.getByText(/Reason/);
      expect(label).toHaveAttribute('for', 'reason-input');
    });
  });

  describe('Focus Management', () => {
    it('should focus reason input when dialog opens with requireReason', async () => {
      const { rerender } = render(
        <ConfirmationDialog
          isOpen={false}
          title="Test"
          message="Test"
          requireReason={true}
          onConfirm={mockOnConfirm}
          onCancel={mockOnCancel}
        />
      );

      rerender(
        <ConfirmationDialog
          isOpen={true}
          title="Test"
          message="Test"
          requireReason={true}
          onConfirm={mockOnConfirm}
          onCancel={mockOnCancel}
        />
      );

      await waitFor(() => {
        const textarea = screen.getByPlaceholderText(/reason/i);
        expect(textarea).toHaveFocus();
      }, { timeout: 200 });
    });
  });
});
