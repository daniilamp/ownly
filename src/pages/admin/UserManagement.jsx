/**
 * UserManagement Component
 * User management page for admin panel
 * 
 * Features:
 * - Display searchable, filterable table of users
 * - Support pagination (50 users per page)
 * - Implement debounced search (300ms)
 * - Show loading states and error messages
 * - Integrate with useAdminAPI hook for data fetching
 * 
 * Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 3.1, 3.2, 3.3, 3.4, 3.5, 3.6
 */

import { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users as UsersIcon } from 'lucide-react';
import { useAdminAPI } from '../../hooks/useAdminAPI';
import { useDebounce } from '../../hooks/useDebounce';
import { usePagination } from '../../hooks/usePagination';
import { AuthContext } from '../../context/AuthContext';
import FilterPanel from '../../components/admin/FilterPanel';
import UserTable from '../../components/admin/UserTable';
import { ToastContainer } from '../../components/admin/ToastNotification';

export default function UserManagement() {
  // State management
  const [users, setUsers] = useState([]);
  const [totalUsers, setTotalUsers] = useState(0);
  const [filters, setFilters] = useState({
    role: '',
    status: '',
    search: '',
  });
  const [toasts, setToasts] = useState([]);
  const [error, setError] = useState(null);

  // Hooks
  const adminAPI = useAdminAPI();
  const navigate = useNavigate();
  const debouncedSearch = useDebounce(filters.search, 300);
  const pagination = usePagination({
    totalItems: totalUsers,
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

  // Fetch users data
  const fetchUsers = async () => {
    try {
      setError(null);
      
      // Build filter parameters
      const filterParams = {
        limit: pagination.pageSize,
        offset: (pagination.currentPage - 1) * pagination.pageSize,
      };

      // Add optional filters
      if (filters.role) filterParams.role = filters.role;
      if (filters.status) filterParams.status = filters.status;
      if (debouncedSearch) filterParams.search = debouncedSearch;

      const response = await adminAPI.listUsers(filterParams);
      
      setUsers(response.users || []);
      setTotalUsers(response.total || 0);
    } catch (err) {
      console.error('Failed to fetch users:', err);
      setError(err.message || 'Failed to load users');
      showToast('error', err.message || 'Failed to load users');
    }
  };

  // Fetch users on mount and when filters/pagination change
  useEffect(() => {
    fetchUsers();
  }, [pagination.currentPage, pagination.pageSize, filters.role, filters.status, debouncedSearch]); // eslint-disable-line react-hooks/exhaustive-deps

  // Handle filter changes
  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    // Reset to first page when filters change
    pagination.goToPage(1);
  };

  // Handle filter reset
  const handleFilterReset = () => {
    setFilters({
      role: '',
      status: '',
      search: '',
    });
    pagination.goToPage(1);
  };

  // Handle user click
  const handleUserClick = (userId) => {
    // Navigate to user detail view
    navigate(`/admin/users/${userId}`);
  };

  // Handle role change
  const handleRoleChange = async (userId, newRole, reason) => {
    try {
      // Extract admin user ID from AuthContext
      const adminUserId = user?.id || user?.email;
      
      if (!adminUserId) {
        showToast('error', 'Admin user ID not found. Please log in again.');
        return;
      }

      // Call API to update user role
      const updatedUser = await adminAPI.updateUserRole(userId, newRole, reason);
      
      // Update the users state with the updated user
      setUsers(prevUsers => 
        prevUsers.map(u => u.id === userId ? { ...u, role: updatedUser.role || newRole } : u)
      );
      
      // Show success toast
      showToast('success', `User role updated to ${newRole.toUpperCase()} successfully`);
    } catch (err) {
      console.error('Failed to update user role:', err);
      showToast('error', err.message || 'Failed to update user role');
    }
  };

  // Handle status change
  const handleStatusChange = async (userId, newStatus, reason) => {
    try {
      // Extract admin user ID from AuthContext
      const adminUserId = user?.id || user?.email;
      
      if (!adminUserId) {
        showToast('error', 'Admin user ID not found. Please log in again.');
        return;
      }

      // Call API to update user status
      const updatedUser = await adminAPI.updateUserStatus(userId, newStatus, reason);
      
      // Update the users state with the updated user
      setUsers(prevUsers => 
        prevUsers.map(u => u.id === userId ? { ...u, status: updatedUser.status || newStatus } : u)
      );
      
      // Show success toast
      showToast('success', `User status updated to ${newStatus} successfully`);
    } catch (err) {
      console.error('Failed to update user status:', err);
      showToast('error', err.message || 'Failed to update user status');
    }
  };

  // Filter configuration for FilterPanel
  const filterConfig = [
    {
      key: 'search',
      type: 'text',
      label: 'Search',
      placeholder: 'Search by email or user ID...',
    },
    {
      key: 'role',
      type: 'select',
      label: 'Role',
      placeholder: 'All Roles',
      options: [
        { value: 'user', label: 'USER' },
        { value: 'business', label: 'BUSINESS' },
        { value: 'admin', label: 'ADMIN' },
      ],
    },
    {
      key: 'status',
      type: 'select',
      label: 'Status',
      placeholder: 'All Statuses',
      options: [
        { value: 'active', label: 'Active' },
        { value: 'inactive', label: 'Inactive' },
        { value: 'suspended', label: 'Suspended' },
      ],
    },
  ];

  return (
    <div>
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <UsersIcon className="w-8 h-8" style={{ color: '#B794F6' }} />
        <h1 className="text-3xl font-bold" style={{ color: '#F0EAFF' }}>
          User Management
        </h1>
      </div>

      {/* Filter Panel */}
      <FilterPanel
        filters={filterConfig}
        activeFilters={filters}
        onChange={handleFilterChange}
        onReset={handleFilterReset}
      />

      {/* User Table */}
      <UserTable
        users={users}
        loading={adminAPI.loading}
        error={error}
        onUserClick={handleUserClick}
        onRoleChange={handleRoleChange}
        onStatusChange={handleStatusChange}
        totalUsers={totalUsers}
        pagination={pagination}
      />

      {/* Toast Notifications */}
      <ToastContainer toasts={toasts} onClose={removeToast} />
    </div>
  );
}
