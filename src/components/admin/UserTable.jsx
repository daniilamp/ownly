/**
 * UserTable Component
 * Reusable table component for displaying user data
 * 
 * Features:
 * - Display user data with sortable columns
 * - Loading skeleton state
 * - Empty state message
 * - Error state display
 * - Pagination controls
 * - Responsive design with horizontal scroll
 * - Role change functionality with RoleSelector
 * 
 * Requirements: 2.1, 2.3, 2.4, 2.5, 2.6, 21.3, 21.4
 */

import { useState } from 'react';
import { Users as UsersIcon, Loader2, ChevronUp, ChevronDown } from 'lucide-react';
import RoleSelector from './RoleSelector';
import StatusToggle from './StatusToggle';

/**
 * @typedef {Object} User
 * @property {string} id - User ID
 * @property {string} email - User email
 * @property {string} role - User role (user, business, admin)
 * @property {string} status - User status (active, inactive, suspended)
 * @property {string} created_at - Registration date (ISO 8601)
 */

/**
 * @typedef {Object} SortConfig
 * @property {string} key - Column key to sort by
 * @property {'asc'|'desc'} direction - Sort direction
 */

/**
 * UserTable Component
 * 
 * @param {Object} props
 * @param {User[]} props.users - Array of user objects to display
 * @param {boolean} props.loading - Loading state
 * @param {string|null} props.error - Error message to display
 * @param {function(string): void} props.onUserClick - Callback when user row is clicked
 * @param {function(string, string, string): void} [props.onRoleChange] - Callback when role is changed (userId, newRole, reason)
 * @param {function(string, string, string): void} [props.onStatusChange] - Callback when status is changed (userId, newStatus, reason)
 * @param {function(string, 'asc'|'desc'): void} [props.onSort] - Callback when column header is clicked for sorting
 * @param {number} [props.totalUsers] - Total number of users (for display)
 * @param {Object} [props.pagination] - Pagination object with controls
 * @param {number} props.pagination.currentPage - Current page number
 * @param {number} props.pagination.pageSize - Items per page
 * @param {number} props.pagination.totalPages - Total number of pages
 * @param {boolean} props.pagination.hasPrevPage - Whether previous page exists
 * @param {boolean} props.pagination.hasNextPage - Whether next page exists
 * @param {function(): void} props.pagination.prevPage - Go to previous page
 * @param {function(): void} props.pagination.nextPage - Go to next page
 */
export default function UserTable({
  users = [],
  loading = false,
  error = null,
  onUserClick,
  onRoleChange,
  onStatusChange,
  onSort,
  totalUsers = 0,
  pagination = null,
}) {
  // Sort state (client-side sorting if onSort not provided)
  const [sortConfig, setSortConfig] = useState({
    key: 'created_at',
    direction: 'desc',
  });

  // Handle column header click for sorting
  const handleSort = (key) => {
    const newDirection = sortConfig.key === key && sortConfig.direction === 'asc' ? 'desc' : 'asc';
    setSortConfig({ key, direction: newDirection });
    
    if (onSort) {
      onSort(key, newDirection);
    }
  };

  // Sort users client-side if onSort callback not provided
  const sortedUsers = onSort ? users : [...users].sort((a, b) => {
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

  // Loading State
  if (loading && users.length === 0) {
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
            Users
          </h2>
        </div>
        <div className="flex flex-col items-center justify-center py-16">
          <Loader2 className="w-12 h-12 animate-spin mb-4" style={{ color: '#B794F6' }} />
          <p className="text-sm" style={{ color: 'rgba(240,234,255,0.6)' }}>
            Loading users...
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
            Users
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
  if (!loading && !error && users.length === 0) {
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
            Users
          </h2>
        </div>
        <div className="flex flex-col items-center justify-center py-16">
          <UsersIcon className="w-16 h-16 mb-4" style={{ color: 'rgba(183,148,246,0.3)' }} />
          <p className="text-base font-medium mb-2" style={{ color: '#F0EAFF' }}>
            No users found
          </p>
          <p className="text-sm" style={{ color: 'rgba(240,234,255,0.5)' }}>
            No users match your current filters
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
            Users ({totalUsers || users.length})
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
            <tr style={{ background: 'rgba(183,148,246,0.06)' }}>
              <th className="px-6 py-3 text-left text-xs font-bold uppercase tracking-wider" style={{ color: 'rgba(240,234,255,0.7)' }}>
                User ID
              </th>
              <th 
                className="px-6 py-3 text-left text-xs font-bold uppercase tracking-wider cursor-pointer hover:bg-opacity-80 transition-colors"
                style={{ color: 'rgba(240,234,255,0.7)' }}
                onClick={() => handleSort('email')}
              >
                <div className="flex items-center gap-1">
                  Email
                  <SortIndicator columnKey="email" />
                </div>
              </th>
              <th 
                className="px-6 py-3 text-left text-xs font-bold uppercase tracking-wider cursor-pointer hover:bg-opacity-80 transition-colors"
                style={{ color: 'rgba(240,234,255,0.7)' }}
                onClick={() => handleSort('role')}
              >
                <div className="flex items-center gap-1">
                  Role
                  <SortIndicator columnKey="role" />
                </div>
              </th>
              <th 
                className="px-6 py-3 text-left text-xs font-bold uppercase tracking-wider cursor-pointer hover:bg-opacity-80 transition-colors"
                style={{ color: 'rgba(240,234,255,0.7)' }}
                onClick={() => handleSort('status')}
              >
                <div className="flex items-center gap-1">
                  Status
                  <SortIndicator columnKey="status" />
                </div>
              </th>
              <th 
                className="px-6 py-3 text-left text-xs font-bold uppercase tracking-wider cursor-pointer hover:bg-opacity-80 transition-colors"
                style={{ color: 'rgba(240,234,255,0.7)' }}
                onClick={() => handleSort('created_at')}
              >
                <div className="flex items-center gap-1">
                  Registration Date
                  <SortIndicator columnKey="created_at" />
                </div>
              </th>
              <th className="px-6 py-3 text-left text-xs font-bold uppercase tracking-wider" style={{ color: 'rgba(240,234,255,0.7)' }}>
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {sortedUsers.map((user, index) => (
              <tr
                key={user.id}
                className="border-t transition-colors hover:bg-opacity-50"
                style={{
                  borderColor: 'rgba(183,148,246,0.1)',
                  background: index % 2 === 0 ? 'transparent' : 'rgba(183,148,246,0.02)',
                }}
              >
                <td className="px-6 py-4 text-sm font-mono" style={{ color: 'rgba(240,234,255,0.8)' }}>
                  {user.id.substring(0, 8)}...
                </td>
                <td className="px-6 py-4 text-sm" style={{ color: '#F0EAFF' }}>
                  {user.email}
                </td>
                <td className="px-6 py-4">
                  {onRoleChange ? (
                    <RoleSelector
                      currentRole={user.role}
                      userId={user.id}
                      onRoleChange={onRoleChange}
                    />
                  ) : (
                    <span
                      className="px-3 py-1 rounded-full text-xs font-bold uppercase"
                      style={{
                        background: user.role === 'admin' ? 'rgba(248,113,113,0.15)' : user.role === 'business' ? 'rgba(96,165,250,0.15)' : 'rgba(52,211,153,0.15)',
                        color: user.role === 'admin' ? '#F87171' : user.role === 'business' ? '#60A5FA' : '#34D399',
                      }}
                    >
                      {user.role}
                    </span>
                  )}
                </td>
                <td className="px-6 py-4">
                  {onStatusChange ? (
                    <StatusToggle
                      currentStatus={user.status}
                      userId={user.id}
                      onStatusChange={onStatusChange}
                    />
                  ) : (
                    <span
                      className="px-3 py-1 rounded-full text-xs font-bold capitalize"
                      style={{
                        background: user.status === 'active' ? 'rgba(52,211,153,0.15)' : user.status === 'suspended' ? 'rgba(248,113,113,0.15)' : 'rgba(156,163,175,0.15)',
                        color: user.status === 'active' ? '#34D399' : user.status === 'suspended' ? '#F87171' : '#9CA3AF',
                      }}
                    >
                      {user.status}
                    </span>
                  )}
                </td>
                <td className="px-6 py-4 text-sm" style={{ color: 'rgba(240,234,255,0.7)' }}>
                  {new Date(user.created_at).toLocaleDateString()}
                </td>
                <td className="px-6 py-4">
                  <button
                    onClick={() => onUserClick && onUserClick(user.id)}
                    className="text-sm font-semibold transition-all hover:scale-105"
                    style={{ color: '#B794F6' }}
                  >
                    View Details
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination Controls */}
      {pagination && pagination.totalPages > 1 && (
        <div className="px-6 py-4 border-t flex items-center justify-between" style={{ borderColor: 'rgba(183,148,246,0.15)' }}>
          <div className="text-sm" style={{ color: 'rgba(240,234,255,0.6)' }}>
            Showing {(pagination.currentPage - 1) * pagination.pageSize + 1} to{' '}
            {Math.min(pagination.currentPage * pagination.pageSize, totalUsers || users.length)} of {totalUsers || users.length} users
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
