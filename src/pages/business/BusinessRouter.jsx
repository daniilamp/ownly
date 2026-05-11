/**
 * BusinessRouter Component
 * Protects business portal routes by verifying Business role
 * Redirects unauthenticated users to login page
 * Displays access denied message for users without Business role
 * 
 * Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 7.6, 9.1, 9.2, 9.4
 */

import { Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import BusinessLayout from '@/components/business/BusinessLayout';
import { ShieldX } from 'lucide-react';

export default function BusinessRouter() {
  const { isAuthenticated, userRole, loading } = useAuth();

  // Show loading spinner while checking authentication
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#070510' }}>
        <div className="animate-spin rounded-full h-10 w-10 border-b-2" style={{ borderColor: '#B794F6' }} />
      </div>
    );
  }

  // Redirect to login if not authenticated (Req 7.2)
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Display access denied message for users without Business role (Req 7.3)
  // Admin users also have access to the business portal
  if (userRole !== 'business' && userRole !== 'admin') {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#070510' }}>
        <div
          className="max-w-md w-full mx-4 p-8 rounded-2xl text-center"
          style={{
            background: 'rgba(183,148,246,0.04)',
            border: '1px solid rgba(183,148,246,0.15)',
          }}
        >
          <div
            className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
            style={{
              background: 'rgba(248,113,113,0.12)',
              border: '1px solid rgba(248,113,113,0.25)',
            }}
          >
            <ShieldX className="w-8 h-8" style={{ color: '#F87171' }} />
          </div>
          <h2 className="text-xl font-bold mb-2" style={{ color: '#F0EAFF' }}>
            Access Denied
          </h2>
          <p className="text-sm mb-6" style={{ color: 'rgba(240,234,255,0.6)' }}>
            You don't have permission to access the Business Portal. 
            A Business account is required to view this section.
          </p>
          <a
            href="/dashboard"
            className="inline-block px-6 py-2.5 rounded-lg text-sm font-semibold transition-all hover:scale-105"
            style={{
              background: 'linear-gradient(135deg, #B794F6, #7C3AED)',
              color: '#070510',
            }}
          >
            Go to Dashboard
          </a>
        </div>
      </div>
    );
  }

  // Render business layout with nested routes if authenticated and has Business role
  return <BusinessLayout />;
}
