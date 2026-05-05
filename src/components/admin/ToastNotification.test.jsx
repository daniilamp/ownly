/**
 * ToastNotification Component Tests
 * 
 * Tests:
 * - Rendering with different types
 * - Auto-dismiss timing
 * - Manual close functionality
 * - Multiple toast stacking
 * - Accessibility features
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ToastNotification, { ToastContainer } from './ToastNotification';

describe('ToastNotification', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Rendering', () => {
    it('should render with success type', () => {
      render(
        <ToastNotification
          type="success"
          message="Operation successful"
          onClose={vi.fn()}
        />
      );

      expect(screen.getByText('Operation successful')).toBeInTheDocument();
      expect(screen.getByRole('alert')).toBeInTheDocument();
    });

    it('should render with error type', () => {
      render(
        <ToastNotification
          type="error"
          message="Operation failed"
          onClose={vi.fn()}
        />
      );

      expect(screen.getByText('Operation failed')).toBeInTheDocument();
    });

    it('should render with warning type', () => {
      render(
        <ToastNotification
          type="warning"
          message="Warning message"
          onClose={vi.fn()}
        />
      );

      expect(screen.getByText('Warning message')).toBeInTheDocument();
    });

    it('should render with info type', () => {
      render(
        <ToastNotification
          type="info"
          message="Info message"
          onClose={vi.fn()}
        />
      );

      expect(screen.getByText('Info message')).toBeInTheDocument();
    });

    it('should render close button', () => {
      render(
        <ToastNotification
          type="success"
          message="Test message"
          onClose={vi.fn()}
        />
      );

      const closeButton = screen.getByLabelText('Close notification');
      expect(closeButton).toBeInTheDocument();
    });
  });

  describe('Auto-dismiss', () => {
    it('should auto-dismiss after default duration (3000ms)', async () => {
      const onClose = vi.fn();
      render(
        <ToastNotification
          type="success"
          message="Test message"
          onClose={onClose}
        />
      );

      expect(onClose).not.toHaveBeenCalled();

      // Fast-forward time by 3000ms + 300ms exit animation
      await vi.advanceTimersByTimeAsync(3300);

      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('should auto-dismiss after custom duration', async () => {
      const onClose = vi.fn();
      render(
        <ToastNotification
          type="success"
          message="Test message"
          duration={5000}
          onClose={onClose}
        />
      );

      // Fast-forward time by 5000ms + 300ms exit animation
      await vi.advanceTimersByTimeAsync(5300);

      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('should not auto-dismiss when duration is 0', async () => {
      const onClose = vi.fn();
      render(
        <ToastNotification
          type="success"
          message="Test message"
          duration={0}
          onClose={onClose}
        />
      );

      // Fast-forward time significantly
      vi.advanceTimersByTime(10000);

      expect(onClose).not.toHaveBeenCalled();
    });

    it('should not auto-dismiss when duration is negative', async () => {
      const onClose = vi.fn();
      render(
        <ToastNotification
          type="success"
          message="Test message"
          duration={-1}
          onClose={onClose}
        />
      );

      vi.advanceTimersByTime(10000);

      expect(onClose).not.toHaveBeenCalled();
    });
  });

  describe('Manual close', () => {
    it('should call onClose when close button is clicked', async () => {
      const onClose = vi.fn();
      render(
        <ToastNotification
          type="success"
          message="Test message"
          onClose={onClose}
        />
      );

      const closeButton = screen.getByLabelText('Close notification');
      fireEvent.click(closeButton);

      // Wait for exit animation (300ms)
      await vi.advanceTimersByTimeAsync(300);

      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('should handle close button click before auto-dismiss', async () => {
      const onClose = vi.fn();
      render(
        <ToastNotification
          type="success"
          message="Test message"
          duration={3000}
          onClose={onClose}
        />
      );

      // Click close button before auto-dismiss
      const closeButton = screen.getByLabelText('Close notification');
      fireEvent.click(closeButton);

      // Wait for exit animation (300ms)
      await vi.advanceTimersByTimeAsync(300);

      expect(onClose).toHaveBeenCalledTimes(1);

      // Advance time to when auto-dismiss would have triggered
      await vi.advanceTimersByTimeAsync(3000);

      // Should still only be called once
      expect(onClose).toHaveBeenCalledTimes(1);
    });
  });

  describe('Stacking', () => {
    it('should position toast based on index', () => {
      const { container: container1 } = render(
        <ToastNotification
          type="success"
          message="First toast"
          index={0}
          onClose={vi.fn()}
        />
      );

      const { container: container2 } = render(
        <ToastNotification
          type="success"
          message="Second toast"
          index={1}
          onClose={vi.fn()}
        />
      );

      const toast1 = container1.querySelector('[role="alert"]');
      const toast2 = container2.querySelector('[role="alert"]');

      // First toast should be at 24px
      expect(toast1).toHaveStyle({ top: '24px' });

      // Second toast should be at 104px (24 + 80)
      expect(toast2).toHaveStyle({ top: '104px' });
    });

    it('should calculate correct position for multiple toasts', () => {
      const { container } = render(
        <ToastNotification
          type="success"
          message="Third toast"
          index={2}
          onClose={vi.fn()}
        />
      );

      const toast = container.querySelector('[role="alert"]');

      // Third toast should be at 184px (24 + 80 * 2)
      expect(toast).toHaveStyle({ top: '184px' });
    });
  });

  describe('Accessibility', () => {
    it('should have role="alert"', () => {
      render(
        <ToastNotification
          type="success"
          message="Test message"
          onClose={vi.fn()}
        />
      );

      expect(screen.getByRole('alert')).toBeInTheDocument();
    });

    it('should have aria-live="polite"', () => {
      const { container } = render(
        <ToastNotification
          type="success"
          message="Test message"
          onClose={vi.fn()}
        />
      );

      const toast = container.querySelector('[role="alert"]');
      expect(toast).toHaveAttribute('aria-live', 'polite');
    });

    it('should have accessible close button label', () => {
      render(
        <ToastNotification
          type="success"
          message="Test message"
          onClose={vi.fn()}
        />
      );

      expect(screen.getByLabelText('Close notification')).toBeInTheDocument();
    });
  });

  describe('Animation', () => {
    it('should start with invisible state', () => {
      const { container } = render(
        <ToastNotification
          type="success"
          message="Test message"
          onClose={vi.fn()}
        />
      );

      const toast = container.querySelector('[role="alert"]');
      expect(toast).toHaveClass('opacity-0');
      expect(toast).toHaveClass('translate-x-full');
    });

    it('should become visible after mount', async () => {
      const { container } = render(
        <ToastNotification
          type="success"
          message="Test message"
          onClose={vi.fn()}
        />
      );

      // Advance timers to trigger visibility (10ms delay in useEffect)
      await vi.advanceTimersByTimeAsync(20);

      const toast = container.querySelector('[role="alert"]');
      expect(toast).toHaveClass('opacity-100');
      expect(toast).toHaveClass('translate-x-0');
    });
  });

  describe('Progress bar', () => {
    it('should render progress bar when duration > 0', () => {
      const { container } = render(
        <ToastNotification
          type="success"
          message="Test message"
          duration={3000}
          onClose={vi.fn()}
        />
      );

      const progressBar = container.querySelector('.absolute.bottom-0');
      expect(progressBar).toBeInTheDocument();
    });

    it('should not render progress bar when duration is 0', () => {
      const { container } = render(
        <ToastNotification
          type="success"
          message="Test message"
          duration={0}
          onClose={vi.fn()}
        />
      );

      const progressBar = container.querySelector('.absolute.bottom-0');
      expect(progressBar).not.toBeInTheDocument();
    });
  });
});

describe('ToastContainer', () => {
  it('should render multiple toasts', () => {
    const toasts = [
      { id: 1, type: 'success', message: 'First toast', duration: 3000 },
      { id: 2, type: 'error', message: 'Second toast', duration: 3000 },
      { id: 3, type: 'info', message: 'Third toast', duration: 3000 },
    ];

    render(<ToastContainer toasts={toasts} onClose={vi.fn()} />);

    expect(screen.getByText('First toast')).toBeInTheDocument();
    expect(screen.getByText('Second toast')).toBeInTheDocument();
    expect(screen.getByText('Third toast')).toBeInTheDocument();
  });

  it('should render empty when no toasts', () => {
    const { container } = render(<ToastContainer toasts={[]} onClose={vi.fn()} />);

    expect(container.firstChild).toBeNull();
  });

  it('should call onClose with correct id when toast is closed', async () => {
    const onClose = vi.fn();
    const toasts = [
      { id: 1, type: 'success', message: 'Test toast', duration: 3000 },
    ];

    render(<ToastContainer toasts={toasts} onClose={onClose} />);

    const closeButton = screen.getByLabelText('Close notification');
    fireEvent.click(closeButton);

    // Wait for exit animation (300ms)
    await vi.advanceTimersByTimeAsync(300);

    expect(onClose).toHaveBeenCalledWith(1);
  });

  it('should position toasts with correct indices', () => {
    const toasts = [
      { id: 1, type: 'success', message: 'First', duration: 3000 },
      { id: 2, type: 'error', message: 'Second', duration: 3000 },
    ];

    const { container } = render(<ToastContainer toasts={toasts} onClose={vi.fn()} />);

    const allToasts = container.querySelectorAll('[role="alert"]');
    expect(allToasts[0]).toHaveStyle({ top: '24px' });
    expect(allToasts[1]).toHaveStyle({ top: '104px' });
  });
});
