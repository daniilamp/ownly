/**
 * APIKeyTable Component
 * Reusable table component for displaying API key data
 * 
 * Features:
 * - Display API key data with masked values
 * - Loading skeleton state
 * - Empty state message
 * - Error state display
 * - Pagination controls
 * - Responsive design with horizontal scroll
 * - Revoke functionality with confirmation
 * - View usage statistics
 * 
 * Requirements: 7.1, 7.3, 7.4, 7.5, 21.3, 21.4
 */

import { useState } from 'react';
import { Key as KeyIcon, Loader2, ChevronUp, ChevronDown, Ban, BarChart3 } from 'lucide-react';
import ConfirmationDialog from './ConfirmationDialog';

/**
 * @typedef {Object} APIKey
 * @property {string} id - API Key ID
 * @property {string} userId - Business user ID
 * @property {string} userEmail - Business user email
 * @property {string} keyHash - Hashed API key
 * @property {string} lastFourChars - Last 4 characters for display
 * @property {string} status - API key status (active, revoked)
 * @property {string} createdAt - Creation date (ISO 8601)
 * @property {string} [revokedAt] - Revocation date (ISO 8601)
 * @property {string[]} permissions - Array of permission strings
 */

/**
 * @typedef {Object} SortConfig
 * @property {string} key - Column key to sort by
 * @property {'asc'|'desc'} direction - Sort direction
 */

/**
 * Mask API key to show only last 4 characters
 * Format: ****-****-****-XXXX
 */
const maskAPIKey = (lastFourChars) => {
  if (!lastFourChars) return '****-****-****-****';
  return `****-****-****-${lastFourChars}`;
};

/**
 * APIKeyTable Component
 * 
 * @param {Object} props
 * @param {APIKey[]} props.apiKeys - Array of API key objects to display
 * @param {boolean} props.loading - Loading state
 * @param {string|null} props.error - Error message to display
 * @param {function(string, string): void} props.onRevoke - Callback when revoke button is clicked (apiKeyId, reason)
 * @param {function(string): void} props.onViewUsage - Callback when view usage button is clicked (apiKeyId)
 * @param {number} [props.totalKeys] - Total number of API keys (for display)
 * @param {Object} [props.pagination] - Pagination object with controls
 * @param {number} props.pagination.currentPage - Current page number
 * @param {number} props.pagination.pageSize - Items per page
 * @param {number} props.pagination.totalPages - Total number of pages
 * @param {boolean} props.pagination.hasPrevPage - Whether previous page exists
 * @param {boolean} props.pagination.hasNextPage - Whether next page exists
 * @param {function(): void} props.pagination.prevPage - Go to previous page
 * @param {function(): void} props.pagination.nextPage - Go to next page
 */
export default function APIKeyTable({
  apiKeys = [],
  loading = false,
  error = null,
  onRevoke,
  onViewUsage,
  totalKeys = 0,
  pagination = null,
}) {
  // Sort state (client-side sorting)
  const [sortConfig, setSortConfig] = useState({
    key: 'createdAt',
    direction: 'desc',
  });

  // Confirmation dialog state
  const [revokeDialog, setRevokeDialog] = useState({
    isOpen: false,
    apiKeyId: null,
    userEmail: null,
  });

  // Handle column header click for sorting
  const handleSort = (key) => {
    const newDirection = sortConfig.key === key && sortConfig.direction === 'asc' ? 'desc' : 'asc';
    setSortConfig({ key, direction: newDirection });
  };

  // Sort API keys client-side
  const sortedKeys = [...apiKeys].sort((a, b) => {
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

  // Handle revoke button click
  const handleRevokeClick = (apiKeyId, userEmail) => {
    setRevokeDialog({
      isOpen: true,
      apiKeyId,
      userEmail,
    });
  };

  // Handle revoke confirmation
  const handleRevokeConfirm = (reason) => {
    if (onRevoke && revokeDialog.apiKeyId) {
      onRevoke(revokeDialog.apiKeyId, reason);
    }
    setRevokeDialog({ isOpen: false, apiKeyId: null, userEmail: null });
  };

  // Handle revoke cancel
  const handleRevokeCancel = () => {
    setRevokeDialog({ isOpen: false, apiKeyId: null, userEmail: null });
  };

  // Loading State
  if (loading && apiKeys.length === 0) {
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
            API Keys
          </h2>
        </div>
        <div className="flex flex-col items-center justify-center py-16">
          <Loader2 className="w-12 h-12 animate-spin mb-4" style={{ color: '#B794F6' }} />
          <p className="text-sm" style={{ color: 'rgba(240,234,255,0.6)' }}>
            Loading API keys...
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
            API Keys
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
  if (!loading && !error && apiKeys.length === 0) {
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
            API Keys
          </h2>
        </div>
        <div className="flex flex-col items-center justify-center py-16">
          <KeyIcon className="w-16 h-16 mb-4" style={{ color: 'rgba(183,148,246,0.3)' }} />
          <p className="text-base font-medium mb-2" style={{ color: '#F0EAFF' }}>
            No API keys found
          </p>
          <p className="text-sm" style={{ color: 'rgba(240,234,255,0.5)' }}>
            No API keys match your current filters
          </p>
        </div>
      </div>
    );
  }

  // Table with data
  return (
    <>
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
              API Keys ({totalKeys || apiKeys.length})
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
                  Key ID
                </th>
                <th 
                  className="px-6 py-3 text-left text-xs font-bold uppercase tracking-wider cursor-pointer hover:bg-opacity-80 transition-colors"
                  style={{ color: 'rgba(240,234,255,0.7)' }}
                  onClick={() => handleSort('userEmail')}
                >
                  <div className="flex items-center gap-1">
                    Business User
                    <SortIndicator columnKey="userEmail" />
                  </div>
                </th>
                <th className="px-6 py-3 text-left text-xs font-bold uppercase tracking-wider" style={{ color: 'rgba(240,234,255,0.7)' }}>
                  Masked Key
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
                  onClick={() => handleSort('createdAt')}
                >
                  <div className="flex items-center gap-1">
                    Creation Date
                    <SortIndicator columnKey="createdAt" />
                  </div>
                </th>
                <th className="px-6 py-3 text-left text-xs font-bold uppercase tracking-wider" style={{ color: 'rgba(240,234,255,0.7)' }}>
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {sortedKeys.map((apiKey, index) => (
                <tr
                  key={apiKey.id}
                  className="border-t transition-colors hover:bg-opacity-50"
                  style={{
                    borderColor: 'rgba(183,148,246,0.1)',
                    background: index % 2 === 0 ? 'transparent' : 'rgba(183,148,246,0.02)',
                  }}
                >
                  <td className="px-6 py-4 text-sm font-mono" style={{ color: 'rgba(240,234,255,0.8)' }}>
                    {apiKey.id.substring(0, 8)}...
                  </td>
                  <td className="px-6 py-4 text-sm" style={{ color: '#F0EAFF' }}>
                    {apiKey.userEmail || 'N/A'}
                  </td>
                  <td className="px-6 py-4 text-sm font-mono" style={{ color: 'rgba(240,234,255,0.7)' }}>
                    {maskAPIKey(apiKey.lastFourChars)}
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className="px-3 py-1 rounded-full text-xs font-bold capitalize"
                      style={{
                        background: apiKey.status === 'active' ? 'rgba(52,211,153,0.15)' : 'rgba(156,163,175,0.15)',
                        color: apiKey.status === 'active' ? '#34D399' : '#9CA3AF',
                      }}
                    >
                      {apiKey.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm" style={{ color: 'rgba(240,234,255,0.7)' }}>
                    {new Date(apiKey.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      {apiKey.status === 'active' && (
                        <button
                          onClick={() => handleRevokeClick(apiKey.id, apiKey.userEmail)}
                          className="flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-semibold transition-all hover:scale-105"
                          style={{
                            background: 'rgba(248,113,113,0.12)',
                            border: '1px solid rgba(248,113,113,0.3)',
                            color: '#F87171',
                          }}
                        >
                          <Ban className="w-3 h-3" />
                          Revoke
                        </button>
                      )}
                      <button
                        onClick={() => onViewUsage && onViewUsage(apiKey.id)}
                        className="flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-semibold transition-all hover:scale-105"
                        style={{
                          background: 'rgba(183,148,246,0.12)',
                          border: '1px solid rgba(183,148,246,0.3)',
                          color: '#B794F6',
                        }}
                      >
                        <BarChart3 className="w-3 h-3" />
                        View Usage
                      </button>
                    </div>
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
              {Math.min(pagination.currentPage * pagination.pageSize, totalKeys || apiKeys.length)} of {totalKeys || apiKeys.length} API keys
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

      {/* Revoke Confirmation Dialog */}
      <ConfirmationDialog
        isOpen={revokeDialog.isOpen}
        title="Revoke API Key"
        message={`Are you sure you want to revoke the API key for ${revokeDialog.userEmail}? This action cannot be undone and will immediately disable all access using this key.`}
        requireReason={true}
        minReasonLength={10}
        onConfirm={handleRevokeConfirm}
        onCancel={handleRevokeCancel}
        confirmLabel="Revoke Key"
        danger={true}
      />
    </>
  );
}
