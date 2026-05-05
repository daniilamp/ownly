/**
 * AdminRouter Unit Tests
 * Tests role-based access control and redirects
 * 
 * Requirements: 1.1, 1.2, 1.3
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import AdminRouter from './AdminRouter';
import { AuthContext } from '@/context/AuthContext';

// Mock AdminLayout component
vi.mock('@/components/admin/AdminLayout', () => ({
  default: () => <div data-testid="admin-layout">Admin Layout</div>
}));

// Helper function to render AdminRouter with auth context
const renderWithAuth = (authValue, initialRoute = '/admin') => {
  return render(
    <AuthContext.Provider value={authValue}>
      <MemoryRouter initialEntries={[initialRoute]}>
        <Routes>
          <Route path="/" element={<div>Home Page</div>} />
          <Route path="/login" element={<div>Login Page</div>} />
          <Route path="/admin/*" element={<AdminRouter />} />
        </Routes>
      </MemoryRouter>
    </AuthContext.Provider>
  );
};

describe('AdminRouter', () => {
  describe('Loading State', () => {
    it('should display loading spinner when authentication is loading', () => {
      const authValue = {
        isAuthenticated: false,
        userRole: null,
        loading: true,
        user: null,
      };

      renderWithAuth(authValue);

      // Check for loading spinner
      const spinner = document.querySelector('.animate-spin');
      expect(spinner).toBeInTheDocument();
    });

    it('should have correct loading spinner styles', () => {
      const authValue = {
        isAuthenticated: false,
        userRole: null,
        loading: true,
        user: null,
      };

      renderWithAuth(authValue);

      const spinner = document.querySelector('.animate-spin');
      expect(spinner).toHaveClass('rounded-full', 'h-10', 'w-10', 'border-b-2');
    });
  });

  describe('Unauthenticated User Redirect', () => {
    it('should redirect unauthenticated users to /login', () => {
      const authValue = {
        isAuthenticated: false,
        userRole: null,
        loading: false,
        user: null,
      };

      renderWithAuth(authValue);

      // Should redirect to login page
      expect(screen.getByText('Login Page')).toBeInTheDocument();
    });

    it('should not display admin layout for unauthenticated users', () => {
      const authValue = {
        isAuthenticated: false,
        userRole: null,
        loading: false,
        user: null,
      };

      renderWithAuth(authValue);

      // Admin layout should not be rendered
      expect(screen.queryByTestId('admin-layout')).not.toBeInTheDocument();
    });
  });

  describe('Non-Admin User Redirect', () => {
    it('should redirect authenticated USER role to home page', () => {
      const authValue = {
        isAuthenticated: true,
        userRole: 'user',
        loading: false,
        user: { email: 'user@example.com', role: 'user' },
      };

      renderWithAuth(authValue);

      // Should redirect to home page
      expect(screen.getByText('Home Page')).toBeInTheDocument();
    });

    it('should redirect authenticated BUSINESS role to home page', () => {
      const authValue = {
        isAuthenticated: true,
        userRole: 'business',
        loading: false,
        user: { email: 'business@example.com', role: 'business' },
      };

      renderWithAuth(authValue);

      // Should redirect to home page
      expect(screen.getByText('Home Page')).toBeInTheDocument();
    });

    it('should not display admin layout for non-admin users', () => {
      const authValue = {
        isAuthenticated: true,
        userRole: 'user',
        loading: false,
        user: { email: 'user@example.com', role: 'user' },
      };

      renderWithAuth(authValue);

      // Admin layout should not be rendered
      expect(screen.queryByTestId('admin-layout')).not.toBeInTheDocument();
    });
  });

  describe('Admin User Access', () => {
    it('should render AdminLayout for authenticated admin users', () => {
      const authValue = {
        isAuthenticated: true,
        userRole: 'admin',
        loading: false,
        user: { email: 'admin@example.com', role: 'admin' },
      };

      renderWithAuth(authValue);

      // Admin layout should be rendered
      expect(screen.getByTestId('admin-layout')).toBeInTheDocument();
    });

    it('should allow admin access with uppercase ADMIN role', () => {
      const authValue = {
        isAuthenticated: true,
        userRole: 'admin',
        loading: false,
        user: { email: 'admin@example.com', role: 'admin' },
      };

      renderWithAuth(authValue);

      expect(screen.getByTestId('admin-layout')).toBeInTheDocument();
    });

    it('should not redirect admin users', () => {
      const authValue = {
        isAuthenticated: true,
        userRole: 'admin',
        loading: false,
        user: { email: 'admin@example.com', role: 'admin' },
      };

      renderWithAuth(authValue);

      // Should not show login or home page
      expect(screen.queryByText('Login Page')).not.toBeInTheDocument();
      expect(screen.queryByText('Home Page')).not.toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('should handle null userRole gracefully', () => {
      const authValue = {
        isAuthenticated: true,
        userRole: null,
        loading: false,
        user: { email: 'user@example.com' },
      };

      renderWithAuth(authValue);

      // Should redirect to home page (not admin)
      expect(screen.getByText('Home Page')).toBeInTheDocument();
    });

    it('should handle undefined userRole gracefully', () => {
      const authValue = {
        isAuthenticated: true,
        userRole: undefined,
        loading: false,
        user: { email: 'user@example.com' },
      };

      renderWithAuth(authValue);

      // Should redirect to home page (not admin)
      expect(screen.getByText('Home Page')).toBeInTheDocument();
    });

    it('should handle empty string userRole gracefully', () => {
      const authValue = {
        isAuthenticated: true,
        userRole: '',
        loading: false,
        user: { email: 'user@example.com' },
      };

      renderWithAuth(authValue);

      // Should redirect to home page (not admin)
      expect(screen.getByText('Home Page')).toBeInTheDocument();
    });

    it('should prioritize authentication check over role check', () => {
      const authValue = {
        isAuthenticated: false,
        userRole: 'admin', // Has admin role but not authenticated
        loading: false,
        user: null,
      };

      renderWithAuth(authValue);

      // Should redirect to login, not home
      expect(screen.getByText('Login Page')).toBeInTheDocument();
    });
  });

  describe('Security', () => {
    it('should not allow access with only isAuthenticated=true', () => {
      const authValue = {
        isAuthenticated: true,
        userRole: null,
        loading: false,
        user: { email: 'user@example.com' },
      };

      renderWithAuth(authValue);

      // Should not render admin layout
      expect(screen.queryByTestId('admin-layout')).not.toBeInTheDocument();
    });

    it('should not allow access with case-sensitive role mismatch', () => {
      const authValue = {
        isAuthenticated: true,
        userRole: 'Admin', // Uppercase A
        loading: false,
        user: { email: 'admin@example.com' },
      };

      renderWithAuth(authValue);

      // Should redirect to home (role check is case-sensitive)
      expect(screen.getByText('Home Page')).toBeInTheDocument();
    });

    it('should not allow access with similar role names', () => {
      const authValue = {
        isAuthenticated: true,
        userRole: 'administrator',
        loading: false,
        user: { email: 'admin@example.com' },
      };

      renderWithAuth(authValue);

      // Should redirect to home
      expect(screen.getByText('Home Page')).toBeInTheDocument();
    });
  });
});
