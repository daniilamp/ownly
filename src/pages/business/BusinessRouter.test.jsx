/**
 * BusinessRouter Unit Tests
 * Tests role-based access control and redirects for Business Portal
 * 
 * Requirements: 7.1, 7.2, 7.3
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import BusinessRouter from './BusinessRouter';
import { AuthContext } from '@/context/AuthContext';

// Mock BusinessLayout component
vi.mock('@/components/business/BusinessLayout', () => ({
  default: () => <div data-testid="business-layout">Business Layout</div>
}));

// Helper function to render BusinessRouter with auth context
const renderWithAuth = (authValue, initialRoute = '/business') => {
  return render(
    <AuthContext.Provider value={authValue}>
      <MemoryRouter initialEntries={[initialRoute]}>
        <Routes>
          <Route path="/" element={<div>Home Page</div>} />
          <Route path="/login" element={<div>Login Page</div>} />
          <Route path="/dashboard" element={<div>Dashboard Page</div>} />
          <Route path="/business/*" element={<BusinessRouter />} />
        </Routes>
      </MemoryRouter>
    </AuthContext.Provider>
  );
};

describe('BusinessRouter', () => {
  describe('Loading State', () => {
    it('should display loading spinner when authentication is loading', () => {
      const authValue = {
        isAuthenticated: false,
        userRole: null,
        loading: true,
        user: null,
      };

      renderWithAuth(authValue);

      const spinner = document.querySelector('.animate-spin');
      expect(spinner).toBeInTheDocument();
    });
  });

  describe('Unauthenticated User Redirect (Req 7.2)', () => {
    it('should redirect unauthenticated users to /login', () => {
      const authValue = {
        isAuthenticated: false,
        userRole: null,
        loading: false,
        user: null,
      };

      renderWithAuth(authValue);

      expect(screen.getByText('Login Page')).toBeInTheDocument();
    });

    it('should not display business layout for unauthenticated users', () => {
      const authValue = {
        isAuthenticated: false,
        userRole: null,
        loading: false,
        user: null,
      };

      renderWithAuth(authValue);

      expect(screen.queryByTestId('business-layout')).not.toBeInTheDocument();
    });
  });

  describe('Access Denied for Non-Business Users (Req 7.3)', () => {
    it('should display access denied message for regular user role', () => {
      const authValue = {
        isAuthenticated: true,
        userRole: 'user',
        loading: false,
        user: { email: 'user@example.com' },
      };

      renderWithAuth(authValue);

      expect(screen.getByText('Access Denied')).toBeInTheDocument();
    });

    it('should not display business layout for non-business users', () => {
      const authValue = {
        isAuthenticated: true,
        userRole: 'user',
        loading: false,
        user: { email: 'user@example.com' },
      };

      renderWithAuth(authValue);

      expect(screen.queryByTestId('business-layout')).not.toBeInTheDocument();
    });

    it('should show a link to go back to dashboard', () => {
      const authValue = {
        isAuthenticated: true,
        userRole: 'user',
        loading: false,
        user: { email: 'user@example.com' },
      };

      renderWithAuth(authValue);

      expect(screen.getByText('Go to Dashboard')).toBeInTheDocument();
    });
  });

  describe('Business User Access (Req 7.1)', () => {
    it('should render BusinessLayout for authenticated business users', () => {
      const authValue = {
        isAuthenticated: true,
        userRole: 'business',
        loading: false,
        user: { email: 'business@company.com' },
      };

      renderWithAuth(authValue);

      expect(screen.getByTestId('business-layout')).toBeInTheDocument();
    });

    it('should not redirect business users', () => {
      const authValue = {
        isAuthenticated: true,
        userRole: 'business',
        loading: false,
        user: { email: 'business@company.com' },
      };

      renderWithAuth(authValue);

      expect(screen.queryByText('Login Page')).not.toBeInTheDocument();
      expect(screen.queryByText('Access Denied')).not.toBeInTheDocument();
    });
  });

  describe('Admin User Access', () => {
    it('should allow admin users to access business portal', () => {
      const authValue = {
        isAuthenticated: true,
        userRole: 'admin',
        loading: false,
        user: { email: 'admin@ownly.com' },
      };

      renderWithAuth(authValue);

      expect(screen.getByTestId('business-layout')).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('should show access denied for null userRole', () => {
      const authValue = {
        isAuthenticated: true,
        userRole: null,
        loading: false,
        user: { email: 'user@example.com' },
      };

      renderWithAuth(authValue);

      expect(screen.getByText('Access Denied')).toBeInTheDocument();
    });

    it('should prioritize authentication check over role check', () => {
      const authValue = {
        isAuthenticated: false,
        userRole: 'business',
        loading: false,
        user: null,
      };

      renderWithAuth(authValue);

      expect(screen.getByText('Login Page')).toBeInTheDocument();
    });
  });
});
