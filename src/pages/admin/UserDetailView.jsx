/**
 * UserDetailView Component
 * Detailed user information page for admin panel
 * 
 * Features:
 * - Fetch and display detailed user data
 * - Display user profile information (email, role, status, registration date)
 * - Display KYC verification status and completion date
 * - Display recent activity timeline
 * - Back button to return to user list
 * 
 * Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6
 */

import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  User as UserIcon, 
  Mail, 
  Shield, 
  Activity, 
  Calendar,
  CheckCircle,
  XCircle,
  Clock,
  Loader2
} from 'lucide-react';
import { useAdminAPI } from '../../hooks/useAdminAPI';

/**
 * Format date to readable string
 */
const formatDate = (dateString) => {
  if (!dateString) return 'N/A';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

/**
 * Get role badge styling
 */
const getRoleBadgeStyle = (role) => {
  const styles = {
    admin: {
      background: 'rgba(248,113,113,0.15)',
      color: '#F87171',
    },
    business: {
      background: 'rgba(96,165,250,0.15)',
      color: '#60A5FA',
    },
    user: {
      background: 'rgba(52,211,153,0.15)',
      color: '#34D399',
    },
  };
  return styles[role] || styles.user;
};

/**
 * Get status badge styling
 */
const getStatusBadgeStyle = (status) => {
  const styles = {
    active: {
      background: 'rgba(52,211,153,0.15)',
      color: '#34D399',
    },
    inactive: {
      background: 'rgba(156,163,175,0.15)',
      color: '#9CA3AF',
    },
    suspended: {
      background: 'rgba(248,113,113,0.15)',
      color: '#F87171',
    },
  };
  return styles[status] || styles.inactive;
};

/**
 * Get KYC status icon and styling
 */
const getKYCStatusDisplay = (kycStatus) => {
  const displays = {
    completed: {
      icon: CheckCircle,
      color: '#34D399',
      background: 'rgba(52,211,153,0.15)',
      label: 'Completed',
    },
    pending: {
      icon: Clock,
      color: '#FBBF24',
      background: 'rgba(251,191,36,0.15)',
      label: 'Pending',
    },
    rejected: {
      icon: XCircle,
      color: '#F87171',
      background: 'rgba(248,113,113,0.15)',
      label: 'Rejected',
    },
  };
  return displays[kycStatus] || displays.pending;
};

export default function UserDetailView() {
  const { userId } = useParams();
  const navigate = useNavigate();
  const adminAPI = useAdminAPI();

  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch user data on mount
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        setLoading(true);
        setError(null);
        const userData = await adminAPI.getUserById(userId);
        setUser(userData);
      } catch (err) {
        console.error('Failed to fetch user details:', err);
        setError(err.message || 'Failed to load user details');
      } finally {
        setLoading(false);
      }
    };

    if (userId) {
      fetchUserData();
    }
  }, [userId]); // eslint-disable-line react-hooks/exhaustive-deps

  // Handle back button
  const handleBack = () => {
    navigate('/admin/users');
  };

  // Loading State
  if (loading) {
    return (
      <div>
        {/* Header with back button */}
        <div className="flex items-center gap-3 mb-6">
          <button
            onClick={handleBack}
            className="p-2 rounded-lg transition-all hover:scale-105"
            style={{
              background: 'rgba(183,148,246,0.08)',
              border: '1px solid rgba(183,148,246,0.2)',
              color: '#B794F6',
            }}
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-3xl font-bold" style={{ color: '#F0EAFF' }}>
            User Details
          </h1>
        </div>

        {/* Loading spinner */}
        <div
          className="rounded-xl p-12 flex flex-col items-center justify-center"
          style={{
            background: 'rgba(183,148,246,0.04)',
            border: '1px solid rgba(183,148,246,0.15)',
          }}
        >
          <Loader2 className="w-12 h-12 animate-spin mb-4" style={{ color: '#B794F6' }} />
          <p className="text-sm" style={{ color: 'rgba(240,234,255,0.6)' }}>
            Loading user details...
          </p>
        </div>
      </div>
    );
  }

  // Error State
  if (error || !user) {
    return (
      <div>
        {/* Header with back button */}
        <div className="flex items-center gap-3 mb-6">
          <button
            onClick={handleBack}
            className="p-2 rounded-lg transition-all hover:scale-105"
            style={{
              background: 'rgba(183,148,246,0.08)',
              border: '1px solid rgba(183,148,246,0.2)',
              color: '#B794F6',
            }}
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-3xl font-bold" style={{ color: '#F0EAFF' }}>
            User Details
          </h1>
        </div>

        {/* Error message */}
        <div
          className="rounded-xl p-8 text-center"
          style={{
            background: 'rgba(248,113,113,0.08)',
            border: '1px solid rgba(248,113,113,0.2)',
          }}
        >
          <XCircle className="w-12 h-12 mx-auto mb-4" style={{ color: '#F87171' }} />
          <p className="text-lg font-medium mb-2" style={{ color: '#F87171' }}>
            {error || 'User not found'}
          </p>
          <button
            onClick={handleBack}
            className="mt-4 px-6 py-2 rounded-lg text-sm font-semibold transition-all hover:scale-105"
            style={{
              background: 'rgba(183,148,246,0.12)',
              border: '1px solid rgba(183,148,246,0.3)',
              color: '#B794F6',
            }}
          >
            Back to User List
          </button>
        </div>
      </div>
    );
  }

  const roleBadgeStyle = getRoleBadgeStyle(user.role);
  const statusBadgeStyle = getStatusBadgeStyle(user.status);
  const kycDisplay = getKYCStatusDisplay(user.kyc_status || user.kycStatus);
  const KYCIcon = kycDisplay.icon;

  return (
    <div>
      {/* Header with back button */}
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={handleBack}
          className="p-2 rounded-lg transition-all hover:scale-105"
          style={{
            background: 'rgba(183,148,246,0.08)',
            border: '1px solid rgba(183,148,246,0.2)',
            color: '#B794F6',
          }}
          aria-label="Back to user list"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <UserIcon className="w-8 h-8" style={{ color: '#B794F6' }} />
        <h1 className="text-3xl font-bold" style={{ color: '#F0EAFF' }}>
          User Details
        </h1>
      </div>

      {/* User Profile Section */}
      <div
        className="rounded-xl p-6 mb-6"
        style={{
          background: 'rgba(183,148,246,0.04)',
          border: '1px solid rgba(183,148,246,0.15)',
        }}
      >
        <h2 className="text-xl font-bold mb-6" style={{ color: '#F0EAFF' }}>
          Profile Information
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* User ID */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Shield className="w-4 h-4" style={{ color: '#B794F6' }} />
              <label className="text-sm font-semibold" style={{ color: 'rgba(240,234,255,0.7)' }}>
                User ID
              </label>
            </div>
            <p className="text-base font-mono" style={{ color: '#F0EAFF' }}>
              {user.id}
            </p>
          </div>

          {/* Email */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Mail className="w-4 h-4" style={{ color: '#B794F6' }} />
              <label className="text-sm font-semibold" style={{ color: 'rgba(240,234,255,0.7)' }}>
                Email
              </label>
            </div>
            <p className="text-base" style={{ color: '#F0EAFF' }}>
              {user.email}
            </p>
          </div>

          {/* Role */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Shield className="w-4 h-4" style={{ color: '#B794F6' }} />
              <label className="text-sm font-semibold" style={{ color: 'rgba(240,234,255,0.7)' }}>
                Role
              </label>
            </div>
            <span
              className="inline-block px-3 py-1 rounded-full text-sm font-bold uppercase"
              style={roleBadgeStyle}
            >
              {user.role}
            </span>
          </div>

          {/* Status */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Activity className="w-4 h-4" style={{ color: '#B794F6' }} />
              <label className="text-sm font-semibold" style={{ color: 'rgba(240,234,255,0.7)' }}>
                Status
              </label>
            </div>
            <span
              className="inline-block px-3 py-1 rounded-full text-sm font-bold capitalize"
              style={statusBadgeStyle}
            >
              {user.status}
            </span>
          </div>

          {/* Registration Date */}
          <div className="md:col-span-2">
            <div className="flex items-center gap-2 mb-2">
              <Calendar className="w-4 h-4" style={{ color: '#B794F6' }} />
              <label className="text-sm font-semibold" style={{ color: 'rgba(240,234,255,0.7)' }}>
                Registration Date
              </label>
            </div>
            <p className="text-base" style={{ color: '#F0EAFF' }}>
              {formatDate(user.created_at || user.createdAt)}
            </p>
          </div>
        </div>
      </div>

      {/* KYC Verification Section */}
      <div
        className="rounded-xl p-6 mb-6"
        style={{
          background: 'rgba(183,148,246,0.04)',
          border: '1px solid rgba(183,148,246,0.15)',
        }}
      >
        <h2 className="text-xl font-bold mb-6" style={{ color: '#F0EAFF' }}>
          KYC Verification
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* KYC Status */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle className="w-4 h-4" style={{ color: '#B794F6' }} />
              <label className="text-sm font-semibold" style={{ color: 'rgba(240,234,255,0.7)' }}>
                Verification Status
              </label>
            </div>
            <div className="flex items-center gap-2">
              <KYCIcon className="w-5 h-5" style={{ color: kycDisplay.color }} />
              <span
                className="inline-block px-3 py-1 rounded-full text-sm font-bold capitalize"
                style={{
                  background: kycDisplay.background,
                  color: kycDisplay.color,
                }}
              >
                {kycDisplay.label}
              </span>
            </div>
          </div>

          {/* KYC Completion Date */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Calendar className="w-4 h-4" style={{ color: '#B794F6' }} />
              <label className="text-sm font-semibold" style={{ color: 'rgba(240,234,255,0.7)' }}>
                Completion Date
              </label>
            </div>
            <p className="text-base" style={{ color: '#F0EAFF' }}>
              {user.kyc_completed_at || user.kycCompletedAt
                ? formatDate(user.kyc_completed_at || user.kycCompletedAt)
                : 'Not completed'}
            </p>
          </div>
        </div>
      </div>

      {/* Recent Activity Timeline Section */}
      <div
        className="rounded-xl p-6"
        style={{
          background: 'rgba(183,148,246,0.04)',
          border: '1px solid rgba(183,148,246,0.15)',
        }}
      >
        <h2 className="text-xl font-bold mb-6" style={{ color: '#F0EAFF' }}>
          Recent Activity
        </h2>

        {/* Activity timeline placeholder */}
        <div className="space-y-4">
          {user.recentActivity && user.recentActivity.length > 0 ? (
            user.recentActivity.map((activity, index) => (
              <div
                key={index}
                className="flex items-start gap-4 p-4 rounded-lg"
                style={{
                  background: 'rgba(183,148,246,0.06)',
                  border: '1px solid rgba(183,148,246,0.1)',
                }}
              >
                <Activity className="w-5 h-5 mt-0.5" style={{ color: '#B794F6' }} />
                <div className="flex-1">
                  <p className="text-sm font-medium mb-1" style={{ color: '#F0EAFF' }}>
                    {activity.action || activity.type}
                  </p>
                  <p className="text-xs" style={{ color: 'rgba(240,234,255,0.6)' }}>
                    {formatDate(activity.timestamp || activity.createdAt)}
                  </p>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-8">
              <Activity className="w-12 h-12 mx-auto mb-3" style={{ color: 'rgba(183,148,246,0.3)' }} />
              <p className="text-sm" style={{ color: 'rgba(240,234,255,0.5)' }}>
                No recent activity available
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
