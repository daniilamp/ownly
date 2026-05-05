/**
 * AuditLogs Component
 * Audit logs page for admin panel
 * 
 * Features:
 * - Display three types of logs: Access Logs, Role Changes, Security Events
 * - Tab selector to switch between log types
 * - Auto-refresh toggle (30 second interval)
 * - Date range filtering
 * - User email search
 * - Pagination (100 items per page)
 * - CSV export functionality
 * - Color-coded indicators
 * 
 * Requirements: 11.1, 11.2, 11.5, 11.6, 12.1, 12.2, 12.3, 12.4, 12.5, 12.6, 13.1, 13.2, 13.6, 14.1, 14.2, 14.5
 */

import { useState, useEffect } from 'react';
import { FileText, RefreshCw } from 'lucide-react';
import { useAdminAPI } from '../../hooks/useAdminAPI';
import { useDebounce } from '../../hooks/useDebounce';
import { usePagination } from '../../hooks/usePagination';
import { useAutoRefresh } from '../../hooks/useAutoRefresh';
import FilterPanel from '../../components/admin/FilterPanel';
import LogTable from '../../components/admin/LogTable';
import ExportButton from '../../components/admin/ExportButton';
import { ToastContainer } from '../../components/admin/ToastNotification';

export default function AuditLogs() {
  // State management
  const [logType, setLogType] = useState('access'); // 'access' | 'role-changes' | 'security'
  const [logs, setLogs] = useState([]);
  const [totalLogs, setTotalLogs] = useState(0);
  const [filters, setFilters] = useState({
    search: '',
    endpoint: '',
    accessGranted: '',
    dateRange: { startDate: '', endDate: '' },
  });
  const [toasts, setToasts] = useState([]);
  const [error, setError] = useState(null);
  const [autoRefreshEnabled, setAutoRefreshEnabled] = useState(false);

  // Hooks
  const adminAPI = useAdminAPI();
  const debouncedSearch = useDebounce(filters.search, 300);
  const pagination = usePagination({
    totalItems: totalLogs,
    initialPageSize: 100,
  });

  // Toast notification helper
  const showToast = (type, message, duration = 3000) => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, type, message, duration }]);
  };

  const removeToast = (id) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  };

  // Fetch logs data
  const fetchLogs = async () => {
    try {
      setError(null);
      
      // Build filter parameters
      const filterParams = {
        limit: pagination.pageSize,
        offset: (pagination.currentPage - 1) * pagination.pageSize,
      };

      // Add optional filters
      if (debouncedSearch) filterParams.userEmail = debouncedSearch;
      if (filters.endpoint) filterParams.endpoint = filters.endpoint;
      if (filters.accessGranted) filterParams.accessGranted = filters.accessGranted === 'granted';
      if (filters.dateRange.startDate) filterParams.startDate = filters.dateRange.startDate;
      if (filters.dateRange.endDate) filterParams.endDate = filters.dateRange.endDate;

      let response;
      switch (logType) {
        case 'access':
          response = await adminAPI.getAccessLogs(filterParams);
          break;
        case 'role-changes':
          response = await adminAPI.getRoleChangeLogs(filterParams);
          break;
        case 'security':
          response = await adminAPI.getSecurityEvents(filterParams);
          break;
        default:
          response = { logs: [], count: 0 };
      }
      
      setLogs(response.logs || response.events || []);
      setTotalLogs(response.count || 0);
    } catch (err) {
      console.error('Failed to fetch logs:', err);
      setError(err.message || 'Failed to load logs');
      showToast('error', err.message || 'Failed to load logs');
    }
  };

  // Auto-refresh hook
  const { isRefreshing, toggleAutoRefresh } = useAutoRefresh({
    callback: fetchLogs,
    interval: 30000, // 30 seconds
    enabled: autoRefreshEnabled,
  });

  // Fetch logs on mount and when filters/pagination/logType change
  useEffect(() => {
    fetchLogs();
  }, [pagination.currentPage, pagination.pageSize, debouncedSearch, filters.endpoint, filters.accessGranted, filters.dateRange, logType]); // eslint-disable-line react-hooks/exhaustive-deps

  // Handle filter changes
  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    // Reset to first page when filters change
    pagination.goToPage(1);
  };

  // Handle filter reset
  const handleFilterReset = () => {
    setFilters({
      search: '',
      endpoint: '',
      accessGranted: '',
      dateRange: { startDate: '', endDate: '' },
    });
    pagination.goToPage(1);
  };

  // Handle log type change
  const handleLogTypeChange = (newLogType) => {
    setLogType(newLogType);
    // Reset filters when changing log type
    handleFilterReset();
  };

  // Handle auto-refresh toggle
  const handleAutoRefreshToggle = () => {
    setAutoRefreshEnabled(!autoRefreshEnabled);
    toggleAutoRefresh();
  };

  // Get filter configuration based on log type
  const getFilterConfig = () => {
    const baseFilters = [
      {
        key: 'search',
        type: 'text',
        label: 'Search',
        placeholder: 'Search by user email...',
      },
      {
        key: 'dateRange',
        type: 'dateRange',
        label: 'Date Range',
      },
    ];

    if (logType === 'access') {
      return [
        ...baseFilters,
        {
          key: 'endpoint',
          type: 'text',
          label: 'Endpoint',
          placeholder: 'Filter by endpoint...',
        },
        {
          key: 'accessGranted',
          type: 'select',
          label: 'Access Status',
          placeholder: 'All',
          options: [
            { value: 'granted', label: 'Granted' },
            { value: 'denied', label: 'Denied' },
          ],
        },
      ];
    }

    return baseFilters;
  };

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <FileText className="w-8 h-8" style={{ color: '#B794F6' }} />
          <h1 className="text-3xl font-bold" style={{ color: '#F0EAFF' }}>
            Audit Logs
          </h1>
        </div>

        {/* Auto-refresh toggle */}
        <button
          onClick={handleAutoRefreshToggle}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all hover:scale-105 ${
            isRefreshing ? 'animate-pulse' : ''
          }`}
          style={{
            background: isRefreshing ? 'rgba(52,211,153,0.12)' : 'rgba(183,148,246,0.12)',
            border: `1px solid ${isRefreshing ? 'rgba(52,211,153,0.3)' : 'rgba(183,148,246,0.3)'}`,
            color: isRefreshing ? '#34D399' : '#B794F6',
          }}
        >
          <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          {isRefreshing ? 'Auto-Refresh On' : 'Auto-Refresh Off'}
        </button>
      </div>

      {/* Log Type Tabs */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => handleLogTypeChange('access')}
          className={`px-6 py-3 rounded-lg text-sm font-semibold transition-all hover:scale-105 ${
            logType === 'access' ? 'shadow-lg' : ''
          }`}
          style={{
            background: logType === 'access' ? 'rgba(183,148,246,0.2)' : 'rgba(183,148,246,0.04)',
            border: `1px solid ${logType === 'access' ? 'rgba(183,148,246,0.4)' : 'rgba(183,148,246,0.15)'}`,
            color: logType === 'access' ? '#B794F6' : 'rgba(240,234,255,0.6)',
          }}
        >
          Access Logs
        </button>
        <button
          onClick={() => handleLogTypeChange('role-changes')}
          className={`px-6 py-3 rounded-lg text-sm font-semibold transition-all hover:scale-105 ${
            logType === 'role-changes' ? 'shadow-lg' : ''
          }`}
          style={{
            background: logType === 'role-changes' ? 'rgba(183,148,246,0.2)' : 'rgba(183,148,246,0.04)',
            border: `1px solid ${logType === 'role-changes' ? 'rgba(183,148,246,0.4)' : 'rgba(183,148,246,0.15)'}`,
            color: logType === 'role-changes' ? '#B794F6' : 'rgba(240,234,255,0.6)',
          }}
        >
          Role Changes
        </button>
        <button
          onClick={() => handleLogTypeChange('security')}
          className={`px-6 py-3 rounded-lg text-sm font-semibold transition-all hover:scale-105 ${
            logType === 'security' ? 'shadow-lg' : ''
          }`}
          style={{
            background: logType === 'security' ? 'rgba(183,148,246,0.2)' : 'rgba(183,148,246,0.04)',
            border: `1px solid ${logType === 'security' ? 'rgba(183,148,246,0.4)' : 'rgba(183,148,246,0.15)'}`,
            color: logType === 'security' ? '#B794F6' : 'rgba(240,234,255,0.6)',
          }}
        >
          Security Events
        </button>
      </div>

      {/* Filter Panel */}
      <FilterPanel
        filters={getFilterConfig()}
        activeFilters={filters}
        onChange={handleFilterChange}
        onReset={handleFilterReset}
      />

      {/* Export Button */}
      <div className="mb-4">
        <ExportButton
          logs={logs}
          logType={logType}
          filters={filters}
        />
      </div>

      {/* Log Table */}
      <LogTable
        logs={logs}
        logType={logType}
        loading={adminAPI.loading}
        error={error}
        totalLogs={totalLogs}
        pagination={pagination}
      />

      {/* Toast Notifications */}
      <ToastContainer toasts={toasts} onClose={removeToast} />
    </div>
  );
}
