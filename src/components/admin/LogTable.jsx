/**
 * LogTable Component
 * Reusable table component for displaying audit log data
 * 
 * Features:
 * - Support different column configurations based on log type
 * - Color-coded indicators (green for granted, red for denied, yellow/orange for security)
 * - Loading skeleton state
 * - Empty state message
 * - Error state display
 * - Pagination controls
 * - Responsive design with horizontal scroll
 * 
 * Requirements: 11.1, 11.3, 11.4, 11.5, 13.1, 13.3, 13.4, 13.5, 14.1, 14.3, 14.4, 21.3, 21.4
 */

import { useState } from 'react';
import { FileText, Loader2, ChevronUp, ChevronDown, CheckCircle, XCircle, AlertTriangle, ArrowRight } from 'lucide-react';

/**
 * @typedef {Object} AccessLogEntry
 * @property {string} id - Log entry ID
 * @property {string} timestamp - ISO 8601 timestamp
 * @property {string} userId - User ID
 * @property {string} userEmail - User email
 * @property {string} endpoint - API endpoint
 * @property {string} method - HTTP method
 * @property {boolean} accessGranted - Whether access was granted
 * @property {string} userRole - User role at time of access
 * @property {string} [requiredRole] - Required role for endpoint
 */

/**
 * @typedef {Object} RoleChangeLogEntry
 * @property {string} id - Log entry ID
 * @property {string} timestamp - ISO 8601 timestamp
 * @property {string} userId - User ID
 * @property {string} userEmail - User email
 * @property {string} oldRole - Previous role
 * @property {string} newRole - New role
 * @property {string} changedBy - Admin user ID
 * @property {string} changedByEmail - Admin email
 * @property {string} reason - Reason for change
 */

/**
 * @typedef {Object} SecurityEventLogEntry
 * @property {string} id - Log entry ID
 * @property {string} timestamp - ISO 8601 timestamp
 * @property {string} [userId] - User ID (optional)
 * @property {string} [userEmail] - User email (optional)
 * @property {string} endpoint - API endpoint
 * @property {string} eventType - Event type
 * @property {string} severity - Severity level (low, medium, high)
 * @property {string} details - Event details
 */

/**
 * Format timestamp to readable date and time
 */
const formatTimestamp = (timestamp) => {
  const date = new Date(timestamp);
  return date.toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
};

/**
 * LogTable Component
 * 
 * @param {Object} props
 * @param {Array} props.logs - Array of log entries to display
 * @param {string} props.logType - Type of logs: 'access' | 'role-changes' | 'security'
 * @param {boolean} props.loading - Loading state
 * @param {string|null} props.error - Error message to display
 * @param {number} [props.totalLogs] - Total number of logs (for display)
 * @param {Object} [props.pagination] - Pagination object with controls
 */
export default function LogTable({
  logs = [],
  logType = 'access',
  loading = false,
  error = null,
  totalLogs = 0,
  pagination = null,
}) {
  // Sort state (client-side sorting)
  const [sortConfig, setSortConfig] = useState({
    key: 'timestamp',
    direction: 'desc',
  });

  // Handle column header click for sorting
  const handleSort = (key) => {
    const newDirection = sortConfig.key === key && sortConfig.direction === 'asc' ? 'desc' : 'asc';
    setSortConfig({ key, direction: newDirection });
  };

  // Sort logs client-side
  const sortedLogs = [...logs].sort((a, b) => {
    const aValue = a[sortConfig.key];
    const bValue = b[sortConfig.key];
    
    if (aValue === bValue) return 0;
    
    const comparison = aValue < bValue ? -1 : 1;
    return sortConfig.direction === 'asc' ? comparison : -comparison;
  });

  // Render sort indicator
  const SortIndicator = ({ columnKey }) => {
    if (sortConfig.key !== columnKey) {
      return <ChevronUp className="w-4 h-4 opacity-30" />;
    }
    return sortConfig.direction === 'asc' 
      ? <ChevronUp className="w-4 h-4" style={{ color: '#B794F6' }} />
      : <ChevronDown className="w-4 h-4" style={{ color: '#B794F6' }} />;
  };

  // Render access log columns
  const renderAccessLogRow = (log, index) => (
    <tr
      key={log.id}
      className="border-t transition-colors hover:bg-opacity-50"
      style={{
        borderColor: 'rgba(183,148,246,0.1)',
        background: index % 2 === 0 ? 'transparent' : 'rgba(183,148,246,0.02)',
      }}
    >
      <td className="px-6 py-4 text-sm" style={{ color: 'rgba(240,234,255,0.7)' }}>
        {formatTimestamp(log.timestamp)}
      </td>
      <td className="px-6 py-4 text-sm" style={{ color: '#F0EAFF' }}>
        {log.userEmail || 'N/A'}
      </td>
      <td className="px-6 py-4 text-sm font-mono" style={{ color: 'rgba(240,234,255,0.8)' }}>
        {log.method} {log.endpoint}
      </td>
      <td className="px-6 py-4">
        <div className="flex items-center gap-2">
          {log.accessGranted ? (
            <>
              <CheckCircle className="w-4 h-4" style={{ color: '#34D399' }} />
              <span className="text-sm font-semibold" style={{ color: '#34D399' }}>
                Granted
              </span>
            </>
          ) : (
            <>
              <XCircle className="w-4 h-4" style={{ color: '#F87171' }} />
              <span className="text-sm font-semibold" style={{ color: '#F87171' }}>
                Denied
              </span>
            </>
          )}
        </div>
      </td>
      <td className="px-6 py-4">
        <span
          className="px-3 py-1 rounded-full text-xs font-bold uppercase"
          style={{
            background: 'rgba(183,148,246,0.15)',
            color: '#B794F6',
          }}
        >
          {log.userRole}
        </span>
      </td>
    </tr>
  );

  // Render role change log columns
  const renderRoleChangeLogRow = (log, index) => (
    <tr
      key={log.id}
      className="border-t transition-colors hover:bg-opacity-50"
      style={{
        borderColor: 'rgba(183,148,246,0.1)',
        background: index % 2 === 0 ? 'transparent' : 'rgba(183,148,246,0.02)',
      }}
    >
      <td className="px-6 py-4 text-sm" style={{ color: 'rgba(240,234,255,0.7)' }}>
        {formatTimestamp(log.timestamp)}
      </td>
      <td className="px-6 py-4 text-sm" style={{ color: '#F0EAFF' }}>
        {log.userEmail || 'N/A'}
      </td>
      <td className="px-6 py-4">
        <div className="flex items-center gap-2">
          <span
            className="px-3 py-1 rounded-full text-xs font-bold uppercase"
            style={{
              background: 'rgba(156,163,175,0.15)',
              color: '#9CA3AF',
            }}
          >
            {log.oldRole}
          </span>
          <ArrowRight className="w-4 h-4" style={{ color: 'rgba(240,234,255,0.4)' }} />
          <span
            className="px-3 py-1 rounded-full text-xs font-bold uppercase"
            style={{
              background: 'rgba(183,148,246,0.15)',
              color: '#B794F6',
            }}
          >
            {log.newRole}
          </span>
        </div>
      </td>
      <td className="px-6 py-4 text-sm" style={{ color: 'rgba(240,234,255,0.8)' }}>
        {log.changedByEmail || 'N/A'}
      </td>
      <td className="px-6 py-4 text-sm" style={{ color: 'rgba(240,234,255,0.7)' }}>
        {log.reason || 'No reason provided'}
      </td>
    </tr>
  );

  // Render security event log columns
  const renderSecurityEventLogRow = (log, index) => {
    const severityConfig = {
      low: { color: '#60A5FA', bg: 'rgba(96,165,250,0.15)' },
      medium: { color: '#FBBF24', bg: 'rgba(251,191,36,0.15)' },
      high: { color: '#F87171', bg: 'rgba(248,113,113,0.15)' },
    };
    const config = severityConfig[log.severity] || severityConfig.low;

    return (
      <tr
        key={log.id}
        className="border-t transition-colors hover:bg-opacity-50"
        style={{
          borderColor: 'rgba(183,148,246,0.1)',
          background: index % 2 === 0 ? 'transparent' : 'rgba(183,148,246,0.02)',
        }}
      >
        <td className="px-6 py-4 text-sm" style={{ color: 'rgba(240,234,255,0.7)' }}>
          {formatTimestamp(log.timestamp)}
        </td>
        <td className="px-6 py-4 text-sm" style={{ color: '#F0EAFF' }}>
          {log.userEmail || 'N/A'}
        </td>
        <td className="px-6 py-4 text-sm font-mono" style={{ color: 'rgba(240,234,255,0.8)' }}>
          {log.endpoint}
        </td>
        <td className="px-6 py-4 text-sm capitalize" style={{ color: 'rgba(240,234,255,0.8)' }}>
          {log.eventType || 'N/A'}
        </td>
        <td className="px-6 py-4">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4" style={{ color: config.color }} />
            <span
              className="px-3 py-1 rounded-full text-xs font-bold uppercase"
              style={{
                background: config.bg,
                color: config.color,
              }}
            >
              {log.severity}
            </span>
          </div>
        </td>
      </tr>
    );
  };

  // Render table headers based on log type
  const renderTableHeaders = () => {
    switch (logType) {
      case 'access':
        return (
          <tr style={{ background: 'rgba(183,148,246,0.06)' }}>
            <th 
              className="px-6 py-3 text-left text-xs font-bold uppercase tracking-wider cursor-pointer hover:bg-opacity-80 transition-colors"
              style={{ color: 'rgba(240,234,255,0.7)' }}
              onClick={() => handleSort('timestamp')}
            >
              <div className="flex items-center gap-1">
                Timestamp
                <SortIndicator columnKey="timestamp" />
              </div>
            </th>
            <th 
              className="px-6 py-3 text-left text-xs font-bold uppercase tracking-wider cursor-pointer hover:bg-opacity-80 transition-colors"
              style={{ color: 'rgba(240,234,255,0.7)' }}
              onClick={() => handleSort('userEmail')}
            >
              <div className="flex items-center gap-1">
                User Email
                <SortIndicator columnKey="userEmail" />
              </div>
            </th>
            <th className="px-6 py-3 text-left text-xs font-bold uppercase tracking-wider" style={{ color: 'rgba(240,234,255,0.7)' }}>
              Endpoint
            </th>
            <th className="px-6 py-3 text-left text-xs font-bold uppercase tracking-wider" style={{ color: 'rgba(240,234,255,0.7)' }}>
              Access Status
            </th>
            <th className="px-6 py-3 text-left text-xs font-bold uppercase tracking-wider" style={{ color: 'rgba(240,234,255,0.7)' }}>
              Role
            </th>
          </tr>
        );

      case 'role-changes':
        return (
          <tr style={{ background: 'rgba(183,148,246,0.06)' }}>
            <th 
              className="px-6 py-3 text-left text-xs font-bold uppercase tracking-wider cursor-pointer hover:bg-opacity-80 transition-colors"
              style={{ color: 'rgba(240,234,255,0.7)' }}
              onClick={() => handleSort('timestamp')}
            >
              <div className="flex items-center gap-1">
                Timestamp
                <SortIndicator columnKey="timestamp" />
              </div>
            </th>
            <th 
              className="px-6 py-3 text-left text-xs font-bold uppercase tracking-wider cursor-pointer hover:bg-opacity-80 transition-colors"
              style={{ color: 'rgba(240,234,255,0.7)' }}
              onClick={() => handleSort('userEmail')}
            >
              <div className="flex items-center gap-1">
                User Email
                <SortIndicator columnKey="userEmail" />
              </div>
            </th>
            <th className="px-6 py-3 text-left text-xs font-bold uppercase tracking-wider" style={{ color: 'rgba(240,234,255,0.7)' }}>
              Role Change
            </th>
            <th className="px-6 py-3 text-left text-xs font-bold uppercase tracking-wider" style={{ color: 'rgba(240,234,255,0.7)' }}>
              Changed By
            </th>
            <th className="px-6 py-3 text-left text-xs font-bold uppercase tracking-wider" style={{ color: 'rgba(240,234,255,0.7)' }}>
              Reason
            </th>
          </tr>
        );

      case 'security':
        return (
          <tr style={{ background: 'rgba(183,148,246,0.06)' }}>
            <th 
              className="px-6 py-3 text-left text-xs font-bold uppercase tracking-wider cursor-pointer hover:bg-opacity-80 transition-colors"
              style={{ color: 'rgba(240,234,255,0.7)' }}
              onClick={() => handleSort('timestamp')}
            >
              <div className="flex items-center gap-1">
                Timestamp
                <SortIndicator columnKey="timestamp" />
              </div>
            </th>
            <th 
              className="px-6 py-3 text-left text-xs font-bold uppercase tracking-wider cursor-pointer hover:bg-opacity-80 transition-colors"
              style={{ color: 'rgba(240,234,255,0.7)' }}
              onClick={() => handleSort('userEmail')}
            >
              <div className="flex items-center gap-1">
                User Email
                <SortIndicator columnKey="userEmail" />
              </div>
            </th>
            <th className="px-6 py-3 text-left text-xs font-bold uppercase tracking-wider" style={{ color: 'rgba(240,234,255,0.7)' }}>
              Endpoint
            </th>
            <th className="px-6 py-3 text-left text-xs font-bold uppercase tracking-wider" style={{ color: 'rgba(240,234,255,0.7)' }}>
              Event Type
            </th>
            <th 
              className="px-6 py-3 text-left text-xs font-bold uppercase tracking-wider cursor-pointer hover:bg-opacity-80 transition-colors"
              style={{ color: 'rgba(240,234,255,0.7)' }}
              onClick={() => handleSort('severity')}
            >
              <div className="flex items-center gap-1">
                Severity
                <SortIndicator columnKey="severity" />
              </div>
            </th>
          </tr>
        );

      default:
        return null;
    }
  };

  // Render table rows based on log type
  const renderTableRows = () => {
    switch (logType) {
      case 'access':
        return sortedLogs.map((log, index) => renderAccessLogRow(log, index));
      case 'role-changes':
        return sortedLogs.map((log, index) => renderRoleChangeLogRow(log, index));
      case 'security':
        return sortedLogs.map((log, index) => renderSecurityEventLogRow(log, index));
      default:
        return null;
    }
  };

  // Loading State
  if (loading && logs.length === 0) {
    return (
      <div
        className="rounded-xl overflow-hidden"
        style={{
          background: 'rgba(183,148,246,0.04)',
          border: '1px solid rgba(183,148,246,0.15)',
        }}
      >
        <div className="px-6 py-4 border-b" style={{ borderColor: 'rgba(183,148,246,0.15)' }}>
          <h2 className="text-lg font-bold" style={{ color: '#F0EAFF' }}>
            Audit Logs
          </h2>
        </div>
        <div className="flex flex-col items-center justify-center py-16">
          <Loader2 className="w-12 h-12 animate-spin mb-4" style={{ color: '#B794F6' }} />
          <p className="text-sm" style={{ color: 'rgba(240,234,255,0.6)' }}>
            Loading logs...
          </p>
        </div>
      </div>
    );
  }

  // Error State
  if (error && !loading) {
    return (
      <div
        className="rounded-xl overflow-hidden"
        style={{
          background: 'rgba(183,148,246,0.04)',
          border: '1px solid rgba(183,148,246,0.15)',
        }}
      >
        <div className="px-6 py-4 border-b" style={{ borderColor: 'rgba(183,148,246,0.15)' }}>
          <h2 className="text-lg font-bold" style={{ color: '#F0EAFF' }}>
            Audit Logs
          </h2>
        </div>
        <div
          className="m-6 p-6 rounded-lg border text-center"
          style={{
            background: 'rgba(248,113,113,0.08)',
            borderColor: 'rgba(248,113,113,0.2)',
          }}
        >
          <p className="text-sm font-medium" style={{ color: '#F87171' }}>
            {error}
          </p>
        </div>
      </div>
    );
  }

  // Empty State
  if (!loading && !error && logs.length === 0) {
    return (
      <div
        className="rounded-xl overflow-hidden"
        style={{
          background: 'rgba(183,148,246,0.04)',
          border: '1px solid rgba(183,148,246,0.15)',
        }}
      >
        <div className="px-6 py-4 border-b" style={{ borderColor: 'rgba(183,148,246,0.15)' }}>
          <h2 className="text-lg font-bold" style={{ color: '#F0EAFF' }}>
            Audit Logs
          </h2>
        </div>
        <div className="flex flex-col items-center justify-center py-16">
          <FileText className="w-16 h-16 mb-4" style={{ color: 'rgba(183,148,246,0.3)' }} />
          <p className="text-base font-medium mb-2" style={{ color: '#F0EAFF' }}>
            No logs found
          </p>
          <p className="text-sm" style={{ color: 'rgba(240,234,255,0.5)' }}>
            No logs match your current filters
          </p>
        </div>
      </div>
    );
  }

  // Table with data
  return (
    <div
      className="rounded-xl overflow-hidden"
      style={{
        background: 'rgba(183,148,246,0.04)',
        border: '1px solid rgba(183,148,246,0.15)',
      }}
    >
      {/* Table Header */}
      <div className="px-6 py-4 border-b" style={{ borderColor: 'rgba(183,148,246,0.15)' }}>
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold" style={{ color: '#F0EAFF' }}>
            Audit Logs ({totalLogs || logs.length})
          </h2>
          {loading && (
            <div className="flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin" style={{ color: '#B794F6' }} />
              <span className="text-sm" style={{ color: 'rgba(240,234,255,0.6)' }}>
                Loading...
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            {renderTableHeaders()}
          </thead>
          <tbody>
            {renderTableRows()}
          </tbody>
        </table>
      </div>

      {/* Pagination Controls */}
      {pagination && pagination.totalPages > 1 && (
        <div className="px-6 py-4 border-t flex items-center justify-between" style={{ borderColor: 'rgba(183,148,246,0.15)' }}>
          <div className="text-sm" style={{ color: 'rgba(240,234,255,0.6)' }}>
            Showing {(pagination.currentPage - 1) * pagination.pageSize + 1} to{' '}
            {Math.min(pagination.currentPage * pagination.pageSize, totalLogs || logs.length)} of {totalLogs || logs.length} logs
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={pagination.prevPage}
              disabled={!pagination.hasPrevPage}
              className="px-4 py-2 rounded-lg text-sm font-semibold transition-all hover:scale-105 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100"
              style={{
                background: 'rgba(183,148,246,0.12)',
                border: '1px solid rgba(183,148,246,0.3)',
                color: '#B794F6',
              }}
            >
              Previous
            </button>
            <span className="px-4 text-sm font-medium" style={{ color: '#F0EAFF' }}>
              Page {pagination.currentPage} of {pagination.totalPages}
            </span>
            <button
              onClick={pagination.nextPage}
              disabled={!pagination.hasNextPage}
              className="px-4 py-2 rounded-lg text-sm font-semibold transition-all hover:scale-105 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100"
              style={{
                background: 'rgba(183,148,246,0.12)',
                border: '1px solid rgba(183,148,246,0.3)',
                color: '#B794F6',
              }}
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
