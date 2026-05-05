/**
 * RecentActivityTimeline Component
 * Display recent system activity timeline
 * 
 * Features:
 * - Display last 20 events in chronological order
 * - Show event type icons (user registration, role change, API key creation, access denied)
 * - Display relative timestamps (e.g., "5 minutes ago")
 * - Auto-refresh every 30 seconds (handled by parent)
 * 
 * Requirements: 18.1, 18.2, 18.3, 18.4, 18.5, 18.6
 */

import { Clock, UserPlus, Shield, Key, XCircle, CheckCircle, Activity } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

export default function RecentActivityTimeline({ recentActivity }) {
  // Determine event icon based on activity type
  const getEventIcon = (log) => {
    // Check if access was denied
    if (log.accessGranted === false) {
      return <XCircle className="w-5 h-5" style={{ color: '#EF4444' }} />;
    }

    // Check endpoint to determine event type
    if (log.endpoint?.includes('/register') || log.endpoint?.includes('/signup')) {
      return <UserPlus className="w-5 h-5" style={{ color: '#10B981' }} />;
    }
    if (log.endpoint?.includes('/role')) {
      return <Shield className="w-5 h-5" style={{ color: '#B794F6' }} />;
    }
    if (log.endpoint?.includes('/api-key')) {
      return <Key className="w-5 h-5" style={{ color: '#F59E0B' }} />;
    }
    if (log.accessGranted === true) {
      return <CheckCircle className="w-5 h-5" style={{ color: '#10B981' }} />;
    }

    // Default activity icon
    return <Activity className="w-5 h-5" style={{ color: '#B794F6' }} />;
  };

  // Get event description
  const getEventDescription = (log) => {
    if (log.accessGranted === false) {
      return `Access denied to ${log.endpoint}`;
    }
    if (log.endpoint?.includes('/register') || log.endpoint?.includes('/signup')) {
      return 'New user registration';
    }
    if (log.endpoint?.includes('/role')) {
      return 'User role changed';
    }
    if (log.endpoint?.includes('/api-key')) {
      return 'API key activity';
    }
    return `Accessed ${log.endpoint}`;
  };

  // Format relative timestamp
  const formatRelativeTime = (timestamp) => {
    try {
      return formatDistanceToNow(new Date(timestamp), { addSuffix: true });
    } catch (error) {
      return 'Unknown time';
    }
  };

  return (
    <div
      className="p-6 rounded-lg border"
      style={{
        background: 'rgba(183,148,246,0.04)',
        borderColor: 'rgba(183,148,246,0.15)',
      }}
    >
      <div className="flex items-center gap-3 mb-6">
        <Clock className="w-6 h-6" style={{ color: '#B794F6' }} />
        <h2 className="text-xl font-semibold" style={{ color: '#F0EAFF' }}>
          Recent Activity
        </h2>
      </div>

      {recentActivity && recentActivity.length > 0 ? (
        <div className="space-y-4">
          {recentActivity.map((log, index) => (
            <div
              key={log.id || index}
              className="flex items-start gap-4 p-4 rounded-lg border transition-all hover:scale-[1.01]"
              style={{
                background: 'rgba(183,148,246,0.02)',
                borderColor: 'rgba(183,148,246,0.1)',
              }}
            >
              {/* Event Icon */}
              <div className="flex-shrink-0 mt-1">{getEventIcon(log)}</div>

              {/* Event Details */}
              <div className="flex-1 min-w-0">
                <p className="font-semibold" style={{ color: '#F0EAFF' }}>
                  {getEventDescription(log)}
                </p>
                <p className="text-sm mt-1" style={{ color: 'rgba(240,234,255,0.7)' }}>
                  {log.userEmail || 'Unknown user'}
                  {log.userRole && (
                    <span
                      className="ml-2 px-2 py-0.5 rounded text-xs font-semibold"
                      style={{
                        background: 'rgba(183,148,246,0.2)',
                        color: '#B794F6',
                      }}
                    >
                      {log.userRole.toUpperCase()}
                    </span>
                  )}
                </p>
                {log.endpoint && (
                  <p
                    className="text-xs mt-1 font-mono"
                    style={{ color: 'rgba(240,234,255,0.5)' }}
                  >
                    {log.method || 'GET'} {log.endpoint}
                  </p>
                )}
              </div>

              {/* Timestamp */}
              <div className="flex-shrink-0 text-right">
                <p className="text-xs" style={{ color: 'rgba(240,234,255,0.6)' }}>
                  {formatRelativeTime(log.timestamp)}
                </p>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-12">
          <Activity className="w-12 h-12 mb-3" style={{ color: 'rgba(183,148,246,0.3)' }} />
          <p style={{ color: 'rgba(240,234,255,0.5)' }}>No recent activity</p>
        </div>
      )}
    </div>
  );
}
