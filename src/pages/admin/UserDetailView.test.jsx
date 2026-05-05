/**
 * UserDetailView Component Tests
 * Tests for the user detail view page
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter, MemoryRouter, Route, Routes } from 'react-router-dom';
import UserDetailView from './UserDetailView';
import * as useAdminAPIModule from '../../hooks/useAdminAPI';

// Mock the useAdminAPI hook
vi.mock('../../hooks/useAdminAPI');

describe('UserDetailView', () => {
  const mockUser = {
    id: '123e4567-e89b-12d3-a456-426614174000',
    email: 'test@example.com',
    role: 'user',
    status: 'active',
    created_at: '2024-01-15T10:30:00Z',
    kyc_status: 'completed',
    kyc_completed_at: '2024-01-20T14:45:00Z',
    recentActivity: [
      {
        action: 'Login',
        timestamp: '2024-01-25T09:00:00Z',
      },
      {
        action: 'Profile Updated',
        timestamp: '2024-01-24T15:30:00Z',
      },
    ],
  };

  const mockGetUserById = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useAdminAPIModule.useAdminAPI).mockReturnValue({
      getUserById: mockGetUserById,
      loading: false,
      error: null,
    });
  });

  it('should display loading state while fetching user data', () => {
    mockGetUserById.mockImplementation(() => new Promise(() => {})); // Never resolves

    render(
      <MemoryRouter initialEntries={['/admin/users/123']}>
        <Routes>
          <Route path="/admin/users/:userId" element={<UserDetailView />} />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByText('Loading user details...')).toBeInTheDocument();
  });

  it('should display user profile information', async () => {
    mockGetUserById.mockResolvedValue(mockUser);

    render(
      <MemoryRouter initialEntries={['/admin/users/123']}>
        <Routes>
          <Route path="/admin/users/:userId" element={<UserDetailView />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Profile Information')).toBeInTheDocument();
    });

    expect(screen.getByText(mockUser.email)).toBeInTheDocument();
    expect(screen.getByText(mockUser.id)).toBeInTheDocument();
    expect(screen.getByText('user')).toBeInTheDocument();
    expect(screen.getByText('active')).toBeInTheDocument();
  });

  it('should display KYC verification status', async () => {
    mockGetUserById.mockResolvedValue(mockUser);

    render(
      <MemoryRouter initialEntries={['/admin/users/123']}>
        <Routes>
          <Route path="/admin/users/:userId" element={<UserDetailView />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('KYC Verification')).toBeInTheDocument();
    });

    expect(screen.getByText('Completed')).toBeInTheDocument();
  });

  it('should display recent activity timeline', async () => {
    mockGetUserById.mockResolvedValue(mockUser);

    render(
      <MemoryRouter initialEntries={['/admin/users/123']}>
        <Routes>
          <Route path="/admin/users/:userId" element={<UserDetailView />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Recent Activity')).toBeInTheDocument();
    });

    expect(screen.getByText('Login')).toBeInTheDocument();
    expect(screen.getByText('Profile Updated')).toBeInTheDocument();
  });

  it('should display error state when user fetch fails', async () => {
    const errorMessage = 'Failed to load user details';
    mockGetUserById.mockRejectedValue(new Error(errorMessage));

    render(
      <MemoryRouter initialEntries={['/admin/users/123']}>
        <Routes>
          <Route path="/admin/users/:userId" element={<UserDetailView />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(errorMessage)).toBeInTheDocument();
    });
  });

  it('should display empty state when no recent activity', async () => {
    const userWithoutActivity = { ...mockUser, recentActivity: [] };
    mockGetUserById.mockResolvedValue(userWithoutActivity);

    render(
      <MemoryRouter initialEntries={['/admin/users/123']}>
        <Routes>
          <Route path="/admin/users/:userId" element={<UserDetailView />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('No recent activity available')).toBeInTheDocument();
    });
  });

  it('should display different KYC statuses correctly', async () => {
    const pendingUser = { ...mockUser, kyc_status: 'pending', kyc_completed_at: null };
    mockGetUserById.mockResolvedValue(pendingUser);

    render(
      <MemoryRouter initialEntries={['/admin/users/123']}>
        <Routes>
          <Route path="/admin/users/:userId" element={<UserDetailView />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Pending')).toBeInTheDocument();
      expect(screen.getByText('Not completed')).toBeInTheDocument();
    });
  });

  it('should display different role badges correctly', async () => {
    const adminUser = { ...mockUser, role: 'admin' };
    mockGetUserById.mockResolvedValue(adminUser);

    render(
      <MemoryRouter initialEntries={['/admin/users/123']}>
        <Routes>
          <Route path="/admin/users/:userId" element={<UserDetailView />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('admin')).toBeInTheDocument();
    });
  });

  it('should display different status badges correctly', async () => {
    const suspendedUser = { ...mockUser, status: 'suspended' };
    mockGetUserById.mockResolvedValue(suspendedUser);

    render(
      <MemoryRouter initialEntries={['/admin/users/123']}>
        <Routes>
          <Route path="/admin/users/:userId" element={<UserDetailView />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('suspended')).toBeInTheDocument();
    });
  });
});
