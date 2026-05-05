/**
 * StatusToggle Component
 * Component for toggling and changing user status
 * 
 * Features:
 * - Display visual indicator (green for active, gray for inactive, red for suspended)
 * - Trigger ConfirmationDialog on status change
 * - Support different user statuses (active, inactive, suspended)
 * - Require reason for deactivation or suspension
 * - Keyboard accessible dropdown
 * 
 * Requirements: 5.1, 5.2, 5.6
 */

import { useState, useRef, useEffect } from 'react';
import { ChevronDown, CheckCircle, XCircle, Ban } from 'lucide-react';
import ConfirmationDialog from './ConfirmationDialog';

/**
 * Status configuration with display properties
 */
const STATUSES = {
  active: {
    value: 'active',
    label: 'Active',
    icon: CheckCircle,
    color: '#34D399',
    bgColor: 'rgba(52,211,153,0.15)',
    description: 'User has full access to the platform',
  },
  inactive: {
    value: 'inactive',
    label: 'Inactive',
    icon: XCircle,
    color: '#9CA3AF',
    bgColor: 'rgba(156,163,175,0.15)',
    description: 'User account is deactivated',
  },
  suspended: {
    value: 'suspended',
    label: 'Suspended',
    icon: Ban,
    color: '#F87171',
    bgColor: 'rgba(248,113,113,0.15)',
    description: 'User account is temporarily suspended',
  },
};

/**
 * StatusToggle Component
 * 
 * @param {Object} props
 * @param {string} props.currentStatus - Current user status (active, inactive, suspended)
 * @param {string} props.userId - User ID for the status change
 * @param {function(string, string, string): void} props.onStatusChange - Callback when status is changed (userId, newStatus, reason)
 * @param {boolean} [props.disabled] - Whether the selector is disabled
 */
export default function StatusToggle({
  currentStatus,
  userId,
  onStatusChange,
  disabled = false,
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState(null);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const dropdownRef = useRef(null);

  const currentStatusConfig = STATUSES[currentStatus] || STATUSES.active;
  const CurrentStatusIcon = currentStatusConfig.icon;

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  // Handle status selection
  const handleStatusSelect = (status) => {
    setIsOpen(false);
    
    // Don't show confirmation if selecting the same status
    if (status === currentStatus) {
      return;
    }

    setSelectedStatus(status);
    setShowConfirmation(true);
  };

  // Handle confirmation
  const handleConfirm = (reason) => {
    if (selectedStatus && onStatusChange) {
      onStatusChange(userId, selectedStatus, reason);
    }
    setShowConfirmation(false);
    setSelectedStatus(null);
  };

  // Handle cancel
  const handleCancel = () => {
    setShowConfirmation(false);
    setSelectedStatus(null);
  };

  // Get confirmation dialog content based on selected status
  const getConfirmationContent = () => {
    if (!selectedStatus) return { title: '', message: '', requireReason: false };

    const newStatusConfig = STATUSES[selectedStatus];
    const requireReason = selectedStatus === 'inactive' || selectedStatus === 'suspended';

    let message = `Are you sure you want to change this user's status from ${currentStatusConfig.label} to ${newStatusConfig.label}?`;

    if (selectedStatus === 'suspended') {
      message = `⚠️ WARNING: You are about to suspend this user's account. The user will lose access to the platform immediately. This action should only be performed for policy violations or security concerns.\n\n${message}`;
    } else if (selectedStatus === 'inactive') {
      message = `You are about to deactivate this user's account. The user will lose access to the platform.\n\n${message}`;
    } else if (selectedStatus === 'active') {
      message = `You are about to reactivate this user's account. The user will regain access to the platform.\n\n${message}`;
    }

    return {
      title: 'Change User Status',
      message,
      requireReason,
    };
  };

  const confirmationContent = getConfirmationContent();

  return (
    <>
      {/* Status Toggle Dropdown */}
      <div className="relative" ref={dropdownRef}>
        <button
          onClick={() => !disabled && setIsOpen(!isOpen)}
          disabled={disabled}
          className="flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold transition-all hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
          style={{
            background: currentStatusConfig.bgColor,
            color: currentStatusConfig.color,
          }}
          aria-haspopup="listbox"
          aria-expanded={isOpen}
          aria-label={`Current status: ${currentStatusConfig.label}. Click to change status.`}
        >
          <CurrentStatusIcon className="w-3 h-3" />
          {currentStatusConfig.label}
          <ChevronDown className={`w-3 h-3 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </button>

        {/* Dropdown Menu */}
        {isOpen && (
          <div
            className="absolute top-full left-0 mt-2 w-56 rounded-xl shadow-2xl z-50 overflow-hidden animate-scaleIn"
            style={{
              background: 'rgba(20,16,40,0.98)',
              border: '1px solid rgba(183,148,246,0.2)',
            }}
            role="listbox"
            aria-label="Select user status"
          >
            {Object.values(STATUSES).map((status) => {
              const StatusIcon = status.icon;
              const isCurrentStatus = status.value === currentStatus;

              return (
                <button
                  key={status.value}
                  onClick={() => handleStatusSelect(status.value)}
                  className="w-full px-4 py-3 flex items-start gap-3 transition-all hover:bg-opacity-80"
                  style={{
                    background: isCurrentStatus ? 'rgba(183,148,246,0.08)' : 'transparent',
                    borderBottom: '1px solid rgba(183,148,246,0.1)',
                  }}
                  role="option"
                  aria-selected={isCurrentStatus}
                >
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{ background: status.bgColor }}
                  >
                    <StatusIcon className="w-4 h-4" style={{ color: status.color }} />
                  </div>
                  <div className="flex-1 text-left">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold" style={{ color: status.color }}>
                        {status.label}
                      </span>
                      {isCurrentStatus && (
                        <span
                          className="text-xs px-2 py-0.5 rounded-full"
                          style={{
                            background: 'rgba(183,148,246,0.15)',
                            color: '#B794F6',
                          }}
                        >
                          Current
                        </span>
                      )}
                    </div>
                    <p className="text-xs mt-1" style={{ color: 'rgba(240,234,255,0.5)' }}>
                      {status.description}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Confirmation Dialog */}
      <ConfirmationDialog
        isOpen={showConfirmation}
        title={confirmationContent.title}
        message={confirmationContent.message}
        requireReason={confirmationContent.requireReason}
        minReasonLength={10}
        onConfirm={handleConfirm}
        onCancel={handleCancel}
        confirmLabel="Change Status"
        danger={selectedStatus === 'suspended' || selectedStatus === 'inactive'}
      />
    </>
  );
}
