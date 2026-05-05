/**
 * APIKeyManagement Component
 * API key management page for admin panel
 * 
 * Features:
 * - Display searchable, filterable table of API keys
 * - Support pagination (50 keys per page)
 * - Implement debounced search (300ms)
 * - Show loading states and error messages
 * - Integrate with useAdminAPI hook for data fetching
 * - Revoke API keys with confirmation
 * - View usage statistics for API keys
 * 
 * Requirements: 7.1, 7.2, 7.5, 7.6, 8.1, 8.2, 8.3, 8.4, 8.5
 */

import { useState, useEffect, useContext } from 'react';
import { Key as KeyIcon } from 'lucide-react';
import { useAdminAPI } from '../../hooks/useAdminAPI';
import { useDebounce } from '../../hooks/useDebounce';
import { usePagination } from '../../hooks/usePagination';
import { AuthContext } from '../../context/AuthContext';
import FilterPanel from '../../components/admin/FilterPanel';
import APIKeyTable from '../../components/admin/APIKeyTable';
import { ToastContainer } from '../../components/admin/ToastNotification';
import UsageStatisticsModal from '../../components/admin/UsageStatisticsModal';

export default function APIKeyManagement() {
  // State management
  const [apiKeys, setApiKeys] = useState([]);
  const [totalKeys, setTotalKeys] = useState(0);
  const [filters, setFilters] = useState({
    status: '',
    search: '',
  });
  const [toasts, setToasts] = useState([]);
  const [error, setError] = useState(null);
  const [selectedKeyId, setSelectedKeyId] = useState(null);
  const [usageModalOpen, setUsageModalOpen] = useState(false);

  // Hooks
  const adminAPI = useAdminAPI();
  const debouncedSearch = useDebounce(filters.search, 300);
  const pagination = usePagination({
    totalItems: totalKeys,
    initialPageSize: 50,
  });
  const { user } = useContext(AuthContext);

  // Toast notification helper
  const showToast = (type, message, duration = 3000) => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, type, message, duration }]);
  };

  const removeToast = (id) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  };

  // Fetch API keys data
  const fetchAPIKeys = async () => {
    try {
      setError(null);
      
      // Build filter parameters
      const filterParams = {
        limit: pagination.pageSize,
        offset: (pagination.currentPage - 1) * pagination.pageSize,
      };

      // Add optional filters
      if (filters.status) filterParams.status = filters.status;
      if (debouncedSearch) filterParams.search = debouncedSearch;

      const response = await adminAPI.listAPIKeys(filterParams);
      
      setApiKeys(response.apiKeys || []);
      setTotalKeys(response.count || 0);
    } catch (err) {
      console.error('Failed to fetch API keys:', err);
      setError(err.message || 'Failed to load API keys');
      showToast('error', err.message || 'Failed to load API keys');
    }
  };

  // Fetch API keys on mount and when filters/pagination change
  useEffect(() => {
    fetchAPIKeys();
  }, [pagination.currentPage, pagination.pageSize, filters.status, debouncedSearch]); // eslint-disable-line react-hooks/exhaustive-deps

  // Handle filter changes
  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    // Reset to first page when filters change
    pagination.goToPage(1);
  };

  // Handle filter reset
  const handleFilterReset = () => {
    setFilters({
      status: '',
      search: '',
    });
    pagination.goToPage(1);
  };

  // Handle API key revocation
  const handleRevoke = async (apiKeyId, reason) => {
    try {
      // Extract admin user ID from AuthContext
      const adminUserId = user?.id || user?.email;
      
      if (!adminUserId) {
        showToast('error', 'Admin user ID not found. Please log in again.');
        return;
      }

      // Call API to revoke API key
      const revokedKey = await adminAPI.revokeAPIKey(apiKeyId, reason);
      
      // Update the apiKeys state with the revoked key
      setApiKeys(prevKeys => 
        prevKeys.map(k => k.id === apiKeyId ? { ...k, status: revokedKey.status || 'revoked' } : k)
      );
      
      // Show success toast
      showToast('success', 'API key revoked successfully');
    } catch (err) {
      console.error('Failed to revoke API key:', err);
      showToast('error', err.message || 'Failed to revoke API key');
    }
  };

  // Handle view usage
  const handleViewUsage = (apiKeyId) => {
    setSelectedKeyId(apiKeyId);
    setUsageModalOpen(true);
  };

  // Handle close usage modal
  const handleCloseUsageModal = () => {
    setUsageModalOpen(false);
    setSelectedKeyId(null);
  };

  // Filter configuration for FilterPanel
  const filterConfig = [
    {
      key: 'search',
      type: 'text',
      label: 'Search',
      placeholder: 'Search by business email or key ID...',
    },
    {
      key: 'status',
      type: 'select',
      label: 'Status',
      placeholder: 'All Statuses',
      options: [
        { value: 'active', label: 'Active' },
        { value: 'revoked', label: 'Revoked' },
      ],
    },
  ];

  return (
    <div>
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <KeyIcon className="w-8 h-8" style={{ color: '#B794F6' }} />
        <h1 className="text-3xl font-bold" style={{ color: '#F0EAFF' }}>
          API Key Management
        </h1>
      </div>

      {/* Filter Panel */}
      <FilterPanel
        filters={filterConfig}
        activeFilters={filters}
        onChange={handleFilterChange}
        onReset={handleFilterReset}
      />

      {/* API Key Table */}
      <APIKeyTable
        apiKeys={apiKeys}
        loading={adminAPI.loading}
        error={error}
        onRevoke={handleRevoke}
        onViewUsage={handleViewUsage}
        totalKeys={totalKeys}
        pagination={pagination}
      />

      {/* Usage Statistics Modal */}
      {usageModalOpen && selectedKeyId && (
        <UsageStatisticsModal
          apiKeyId={selectedKeyId}
          onClose={handleCloseUsageModal}
        />
      )}

      {/* Toast Notifications */}
      <ToastContainer toasts={toasts} onClose={removeToast} />
    </div>
  );
}
