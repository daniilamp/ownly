/**
 * AdminRouter Component
 * Protects admin routes by verifying ADMIN role
 * Redirects unauthorized/unauthenticated users appropriately
 */

import { Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import AdminLayout from '@/components/admin/AdminLayout';

export default function AdminRouter() {
  const { isAuthenticated, userRole, loading } = useAuth();

  // Show loading spinner while checking authentication
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#070510' }}>
        <div className="animate-spin rounded-full h-10 w-10 border-b-2" style={{ borderColor: '#B794F6' }} />
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Redirect to home if not admin
  if (userRole !== 'admin') {
    return <Navigate to="/" replace />;
  }

  // Render admin layout with nested routes if authenticated and admin
  return <AdminLayout />;
}
