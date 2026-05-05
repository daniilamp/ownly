/**
 * RoleSelector Component
 * Dropdown component for selecting and changing user roles
 * 
 * Features:
 * - Display dropdown with USER, BUSINESS, ADMIN options
 * - Trigger ConfirmationDialog on role selection
 * - Show additional warning for ADMIN role assignment
 * - Visual role indicators with color coding
 * - Keyboard accessible dropdown
 * 
 * Requirements: 4.1, 4.2, 22.3
 */

import { useState, useRef, useEffect } from 'react';
import { ChevronDown, Shield, Briefcase, User as UserIcon } from 'lucide-react';
import ConfirmationDialog from './ConfirmationDialog';

/**
 * Role configuration with display properties
 */
const ROLES = {
  user: {
    value: 'user',
    label: 'USER',
    icon: UserIcon,
    color: '#34D399',
    bgColor: 'rgba(52,211,153,0.15)',
    description: 'Standard user with basic access',
  },
  business: {
    value: 'business',
    label: 'BUSINESS',
    icon: Briefcase,
    color: '#60A5FA',
    bgColor: 'rgba(96,165,250,0.15)',
    description: 'Business user with API access',
  },
  admin: {
    value: 'admin',
    label: 'ADMIN',
    icon: Shield,
    color: '#F87171',
    bgColor: 'rgba(248,113,113,0.15)',
    description: 'Administrator with full system access',
  },
};

/**
 * RoleSelector Component
 * 
 * @param {Object} props
 * @param {string} props.currentRole - Current user role (user, business, admin)
 * @param {string} props.userId - User ID for the role change
 * @param {function(string, string, string): void} props.onRoleChange - Callback when role is changed (userId, newRole, reason)
 * @param {boolean} [props.disabled] - Whether the selector is disabled
 */
export default function RoleSelector({
  currentRole,
  userId,
  onRoleChange,
  disabled = false,
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedRole, setSelectedRole] = useState(null);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const dropdownRef = useRef(null);

  const currentRoleConfig = ROLES[currentRole] || ROLES.user;
  const CurrentRoleIcon = currentRoleConfig.icon;

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

  // Handle role selection
  const handleRoleSelect = (role) => {
    setIsOpen(false);
    
    // Don't show confirmation if selecting the same role
    if (role === currentRole) {
      return;
    }

    setSelectedRole(role);
    setShowConfirmation(true);
  };

  // Handle confirmation
  const handleConfirm = (reason) => {
    if (selectedRole && onRoleChange) {
      onRoleChange(userId, selectedRole, reason);
    }
    setShowConfirmation(false);
    setSelectedRole(null);
  };

  // Handle cancel
  const handleCancel = () => {
    setShowConfirmation(false);
    setSelectedRole(null);
  };

  // Get confirmation dialog content based on selected role
  const getConfirmationContent = () => {
    if (!selectedRole) return { title: '', message: '' };

    const newRoleConfig = ROLES[selectedRole];
    const isUpgradingToAdmin = selectedRole === 'admin';

    return {
      title: 'Change User Role',
      message: isUpgradingToAdmin
        ? `⚠️ WARNING: You are about to grant ADMIN privileges to this user. Admins have full system access including user management, API key control, and audit log access. This action should only be performed for trusted personnel.\n\nAre you sure you want to change this user's role from ${currentRoleConfig.label} to ${newRoleConfig.label}?`
        : `Are you sure you want to change this user's role from ${currentRoleConfig.label} to ${newRoleConfig.label}?\n\n${newRoleConfig.description}`,
    };
  };

  const confirmationContent = getConfirmationContent();

  return (
    <>
      {/* Role Selector Dropdown */}
      <div className="relative" ref={dropdownRef}>
        <button
          onClick={() => !disabled && setIsOpen(!isOpen)}
          disabled={disabled}
          className="flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold uppercase transition-all hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
          style={{
            background: currentRoleConfig.bgColor,
            color: currentRoleConfig.color,
          }}
          aria-haspopup="listbox"
          aria-expanded={isOpen}
          aria-label={`Current role: ${currentRoleConfig.label}. Click to change role.`}
        >
          <CurrentRoleIcon className="w-3 h-3" />
          {currentRoleConfig.label}
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
            aria-label="Select user role"
          >
            {Object.values(ROLES).map((role) => {
              const RoleIcon = role.icon;
              const isCurrentRole = role.value === currentRole;

              return (
                <button
                  key={role.value}
                  onClick={() => handleRoleSelect(role.value)}
                  className="w-full px-4 py-3 flex items-start gap-3 transition-all hover:bg-opacity-80"
                  style={{
                    background: isCurrentRole ? 'rgba(183,148,246,0.08)' : 'transparent',
                    borderBottom: '1px solid rgba(183,148,246,0.1)',
                  }}
                  role="option"
                  aria-selected={isCurrentRole}
                >
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{ background: role.bgColor }}
                  >
                    <RoleIcon className="w-4 h-4" style={{ color: role.color }} />
                  </div>
                  <div className="flex-1 text-left">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold" style={{ color: role.color }}>
                        {role.label}
                      </span>
                      {isCurrentRole && (
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
                      {role.description}
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
        requireReason={true}
        minReasonLength={10}
        onConfirm={handleConfirm}
        onCancel={handleCancel}
        confirmLabel="Change Role"
        danger={selectedRole === 'admin'}
      />
    </>
  );
}
