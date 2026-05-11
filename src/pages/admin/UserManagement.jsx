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
import { Users as UsersIcon, UserPlus } from 'lucide-react';
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
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createForm, setCreateForm] = useState({ email: '', role: 'business', password: '' });
  const [creating, setCreating] = useState(false);
  const [createdUser, setCreatedUser] = useState(null);

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
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <UsersIcon className="w-8 h-8" style={{ color: '#B794F6' }} />
          <h1 className="text-3xl font-bold" style={{ color: '#F0EAFF' }}>
            User Management
          </h1>
        </div>
        <button
          onClick={() => { setShowCreateModal(true); setCreatedUser(null); setCreateForm({ email: '', role: 'business', password: '' }); }}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all hover:scale-105"
          style={{
            background: 'linear-gradient(135deg, #B794F6, #7C3AED)',
            color: '#070510',
          }}
        >
          <UserPlus className="w-4 h-4" />
          Create User
        </button>
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

      {/* Create User Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black bg-opacity-60" onClick={() => setShowCreateModal(false)} />
          <div className="relative max-w-md w-full rounded-2xl p-6" style={{ background: '#0F0B1A', border: '1px solid rgba(183,148,246,0.2)' }}>
            <h2 className="text-xl font-bold mb-4" style={{ color: '#F0EAFF' }}>
              {createdUser ? 'User Created' : 'Create New User'}
            </h2>

            {createdUser ? (
              <div className="space-y-4">
                <div className="p-4 rounded-xl" style={{ background: 'rgba(52,211,153,0.08)', border: '1px solid rgba(52,211,153,0.25)' }}>
                  <p className="text-sm font-semibold mb-2" style={{ color: '#34D399' }}>User created successfully!</p>
                  <p className="text-sm" style={{ color: '#F0EAFF' }}>Email: {createdUser.user?.email}</p>
                  <p className="text-sm" style={{ color: '#F0EAFF' }}>Role: {createdUser.user?.role}</p>
                  {createdUser.tempPassword && (
                    <div className="mt-3 p-3 rounded-lg" style={{ background: 'rgba(251,191,36,0.08)', border: '1px solid rgba(251,191,36,0.25)' }}>
                      <p className="text-xs font-semibold mb-1" style={{ color: '#FBBF24' }}>Temporary Password (save it now!):</p>
                      <code className="text-sm font-mono break-all" style={{ color: '#F0EAFF' }}>{createdUser.tempPassword}</code>
                    </div>
                  )}
                </div>
                <button
                  onClick={() => { setShowCreateModal(false); fetchUsers(); }}
                  className="w-full px-4 py-2.5 rounded-xl text-sm font-semibold"
                  style={{ background: 'linear-gradient(135deg, #B794F6, #7C3AED)', color: '#070510' }}
                >
                  Done
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: '#F0EAFF' }}>Email</label>
                  <input
                    type="email"
                    value={createForm.email}
                    onChange={(e) => setCreateForm(f => ({ ...f, email: e.target.value }))}
                    placeholder="user@company.com"
                    className="w-full px-4 py-2.5 rounded-lg text-sm outline-none"
                    style={{ background: 'rgba(183,148,246,0.06)', border: '1px solid rgba(183,148,246,0.2)', color: '#F0EAFF' }}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: '#F0EAFF' }}>Role</label>
                  <select
                    value={createForm.role}
                    onChange={(e) => setCreateForm(f => ({ ...f, role: e.target.value }))}
                    className="w-full px-4 py-2.5 rounded-lg text-sm outline-none"
                    style={{ background: 'rgba(183,148,246,0.06)', border: '1px solid rgba(183,148,246,0.2)', color: '#F0EAFF' }}
                  >
                    <option value="user">USER</option>
                    <option value="business">BUSINESS</option>
                    <option value="admin">ADMIN</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: '#F0EAFF' }}>Password (optional — auto-generated if empty)</label>
                  <input
                    type="text"
                    value={createForm.password}
                    onChange={(e) => setCreateForm(f => ({ ...f, password: e.target.value }))}
                    placeholder="Leave empty to auto-generate"
                    className="w-full px-4 py-2.5 rounded-lg text-sm outline-none"
                    style={{ background: 'rgba(183,148,246,0.06)', border: '1px solid rgba(183,148,246,0.2)', color: '#F0EAFF' }}
                  />
                </div>
                <div className="flex gap-3 pt-2">
                  <button
                    onClick={() => setShowCreateModal(false)}
                    className="flex-1 px-4 py-2.5 rounded-xl text-sm font-semibold"
                    style={{ background: 'rgba(183,148,246,0.08)', border: '1px solid rgba(183,148,246,0.2)', color: '#F0EAFF' }}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={async () => {
                      if (!createForm.email) { showToast('error', 'Email is required'); return; }
                      setCreating(true);
                      try {
                        const API_BASE = import.meta.env.VITE_OWNLY_API_URL || 'http://localhost:3001';
                        const token = localStorage.getItem('ownly_token');
                        const res = await fetch(`${API_BASE}/api/admin/users`, {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                          body: JSON.stringify({ email: createForm.email, role: createForm.role, ...(createForm.password ? { password: createForm.password } : {}) }),
                        });
                        const data = await res.json();
                        if (!res.ok) throw new Error(data.error || 'Failed to create user');
                        setCreatedUser(data);
                        showToast('success', 'User created successfully');
                      } catch (err) {
                        showToast('error', err.message);
                      } finally {
                        setCreating(false);
                      }
                    }}
                    disabled={creating}
                    className="flex-1 px-4 py-2.5 rounded-xl text-sm font-semibold"
                    style={{ background: 'linear-gradient(135deg, #B794F6, #7C3AED)', color: '#070510', opacity: creating ? 0.6 : 1 }}
                  >
                    {creating ? 'Creating...' : 'Create User'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
