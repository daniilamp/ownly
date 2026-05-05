/**
 * ConfirmationDialog Component
 * Modal for confirming destructive actions with optional reason input
 * 
 * Features:
 * - Optional reason text input with validation
 * - Danger styling for destructive actions
 * - Keyboard shortcuts (Enter to confirm, Escape to cancel)
 * - Minimum reason length validation
 * - Modal overlay with backdrop blur
 * 
 * Requirements: 4.2, 4.6, 5.2, 5.4, 9.2, 9.3, 22.1, 22.2, 22.3, 22.4, 22.5, 22.6
 */

import { useState, useEffect, useRef } from 'react';
import { AlertTriangle, X } from 'lucide-react';

/**
 * ConfirmationDialog Component
 * 
 * @param {Object} props
 * @param {boolean} props.isOpen - Whether the dialog is visible
 * @param {string} props.title - Dialog title
 * @param {string} props.message - Dialog message/description
 * @param {boolean} props.requireReason - Whether reason input is required
 * @param {number} props.minReasonLength - Minimum length for reason text (default: 10)
 * @param {Function} props.onConfirm - Callback when confirmed (reason?: string) => void
 * @param {Function} props.onCancel - Callback when cancelled
 * @param {string} props.confirmLabel - Label for confirm button (default: 'Confirm')
 * @param {boolean} props.danger - Whether to use danger styling (default: true)
 */
export default function ConfirmationDialog({
  isOpen,
  title,
  message,
  requireReason = false,
  minReasonLength = 10,
  onConfirm,
  onCancel,
  confirmLabel = 'Confirm',
  danger = true,
}) {
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');
  const dialogRef = useRef(null);
  const reasonInputRef = useRef(null);

  // Reset state when dialog opens/closes
  useEffect(() => {
    if (isOpen) {
      setReason('');
      setError('');
      // Focus reason input if required
      if (requireReason && reasonInputRef.current) {
        setTimeout(() => reasonInputRef.current?.focus(), 100);
      }
    }
  }, [isOpen, requireReason]);

  // Handle keyboard shortcuts
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onCancel();
      } else if (e.key === 'Enter' && !requireReason) {
        // Only allow Enter to confirm if reason is not required
        // If reason is required, Enter should be used for textarea
        e.preventDefault();
        handleConfirm();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, requireReason, onCancel]);

  // Trap focus within dialog
  useEffect(() => {
    if (!isOpen || !dialogRef.current) return;

    const dialog = dialogRef.current;
    const focusableElements = dialog.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    const handleTabKey = (e) => {
      if (e.key !== 'Tab') return;

      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          e.preventDefault();
          lastElement?.focus();
        }
      } else {
        if (document.activeElement === lastElement) {
          e.preventDefault();
          firstElement?.focus();
        }
      }
    };

    dialog.addEventListener('keydown', handleTabKey);
    return () => dialog.removeEventListener('keydown', handleTabKey);
  }, [isOpen]);

  const validateReason = () => {
    if (!requireReason) return true;

    const trimmedReason = reason.trim();
    if (trimmedReason.length === 0) {
      setError('Reason is required');
      return false;
    }
    if (trimmedReason.length < minReasonLength) {
      setError(`Reason must be at least ${minReasonLength} characters`);
      return false;
    }
    setError('');
    return true;
  };

  const handleConfirm = () => {
    if (!validateReason()) return;
    onConfirm(requireReason ? reason.trim() : undefined);
  };

  const handleReasonChange = (e) => {
    setReason(e.target.value);
    // Clear error when user starts typing
    if (error) setError('');
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center px-4"
      style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="dialog-title"
      aria-describedby="dialog-description"
    >
      <div
        ref={dialogRef}
        className="w-full max-w-md rounded-2xl p-6 animate-scaleIn"
        style={{ background: 'rgba(20,16,40,0.98)', border: '1px solid rgba(183,148,246,0.2)' }}
      >
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: danger ? 'rgba(248,113,113,0.1)' : 'rgba(183,148,246,0.1)' }}
            >
              <AlertTriangle className="w-5 h-5" style={{ color: danger ? '#F87171' : '#B794F6' }} />
            </div>
            <h3 id="dialog-title" className="font-bold text-lg" style={{ color: '#F0EAFF' }}>
              {title}
            </h3>
          </div>
          <button
            onClick={onCancel}
            className="p-1 rounded-lg transition-all hover:scale-110"
            style={{ color: 'rgba(240,234,255,0.4)' }}
            aria-label="Close dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Message */}
        <p id="dialog-description" className="mb-4 text-sm" style={{ color: 'rgba(240,234,255,0.6)' }}>
          {message}
        </p>

        {/* Optional reason input */}
        {requireReason && (
          <div className="mb-6">
            <label htmlFor="reason-input" className="block text-xs font-semibold mb-2" style={{ color: 'rgba(240,234,255,0.6)' }}>
              Reason {minReasonLength > 0 && `(minimum ${minReasonLength} characters)`}
            </label>
            <textarea
              id="reason-input"
              ref={reasonInputRef}
              value={reason}
              onChange={handleReasonChange}
              placeholder="Enter reason for this action..."
              rows={3}
              className="w-full px-4 py-2.5 rounded-lg text-sm transition-all focus:outline-none focus:ring-2 resize-none"
              style={{
                background: 'rgba(183,148,246,0.04)',
                border: error ? '1px solid rgba(248,113,113,0.5)' : '1px solid rgba(183,148,246,0.15)',
                color: '#F0EAFF',
                '--tw-ring-color': 'rgba(183,148,246,0.3)',
              }}
              aria-invalid={!!error}
              aria-describedby={error ? 'reason-error' : undefined}
            />
            {error && (
              <p id="reason-error" className="mt-2 text-xs" style={{ color: '#F87171' }} role="alert">
                {error}
              </p>
            )}
            {!error && reason.trim().length > 0 && (
              <p className="mt-2 text-xs" style={{ color: 'rgba(240,234,255,0.4)' }}>
                {reason.trim().length} / {minReasonLength} characters
              </p>
            )}
          </div>
        )}

        {/* Action buttons */}
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 py-2.5 rounded-xl font-semibold text-sm transition-all hover:scale-105"
            style={{
              background: 'rgba(183,148,246,0.08)',
              color: '#B794F6',
              border: '1px solid rgba(183,148,246,0.2)',
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            className="flex-1 py-2.5 rounded-xl font-semibold text-sm transition-all hover:scale-105"
            style={{
              background: danger
                ? 'rgba(248,113,113,0.15)'
                : 'linear-gradient(135deg, #B794F6, #7C3AED)',
              color: danger ? '#F87171' : '#070510',
              border: danger ? '1px solid rgba(248,113,113,0.3)' : 'none',
            }}
          >
            {confirmLabel}
          </button>
        </div>

        {/* Keyboard shortcuts hint */}
        <div className="mt-4 pt-4 border-t flex items-center justify-center gap-4 text-xs" style={{ borderColor: 'rgba(183,148,246,0.1)', color: 'rgba(240,234,255,0.3)' }}>
          <span>Press <kbd className="px-1.5 py-0.5 rounded" style={{ background: 'rgba(183,148,246,0.08)' }}>Esc</kbd> to cancel</span>
          {!requireReason && (
            <span>Press <kbd className="px-1.5 py-0.5 rounded" style={{ background: 'rgba(183,148,246,0.08)' }}>Enter</kbd> to confirm</span>
          )}
        </div>
      </div>
    </div>
  );
}
