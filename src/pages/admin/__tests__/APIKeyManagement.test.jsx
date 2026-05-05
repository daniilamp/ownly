/**
 * APIKeyManagement Component Tests
 * 
 * Tests:
 * - API key data fetching and display
 * - Key masking format
 * - Filter application
 * - Pagination controls
 * 
 * Requirements: 7.2, 7.3, 8.5
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import APIKeyManagement from '../APIKeyManagement';
import * as useAdminAPIModule from '../../../hooks/useAdminAPI';

// Mock hooks
vi.mock('../../../hooks/useAdminAPI');
vi.mock('../../../hooks/useDebounce', () => ({
  useDebounce: (value) => value,
}));
vi.mock('../../../hooks/usePagination', () => ({
  usePagination: () => ({
    currentPage: 1,
    pageSize: 50,
    totalPages: 1,
    hasPrevPage: false,
    hasNextPage: false,
    goToPage: vi.fn(),
    nextPage: vi.fn(),
    prevPage: vi.fn(),
  }),
}));

// Mock AuthContext with useContext
const mockUser = { id: 'admin-1', email: 'admin@example.com', role: 'admin' };

vi.mock('react', async () => {
  const actual = await vi.importActual('react');
  return {
    ...actual,
    useContext: vi.fn(() => ({ user: mockUser })),
  };
});

describe('APIKeyManagement', () => {
  const mockAPIKeys = [
    {
      id: 'key-123',
      userId: 'user-1',
      userEmail: 'business@example.com',
      keyHash: 'hash123',
      lastFourChars: 'ABCD',
      status: 'active',
      createdAt: '2024-01-15T10:00:00Z',
      permissions: ['read:credentials', 'write:credentials'],
    },
    {
      id: 'key-456',
      userId: 'user-2',
      userEmail: 'company@example.com',
      keyHash: 'hash456',
      lastFourChars: 'EFGH',
      status: 'revoked',
      createdAt: '2024-01-10T10:00:00Z',
      permissions: ['read:credentials'],
    },
  ];

  const mockAdminAPI = {
    listAPIKeys: vi.fn(),
    revokeAPIKey: vi.fn(),
    loading: false,
    error: null,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(useAdminAPIModule, 'useAdminAPI').mockReturnValue(mockAdminAPI);
    mockAdminAPI.listAPIKeys.mockResolvedValue({
      apiKeys: mockAPIKeys,
      count: 2,
    });
  });

  it('should fetch and display API keys on mount', async () => {
    render(
      <BrowserRouter>
        <APIKeyManagement />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(mockAdminAPI.listAPIKeys).toHaveBeenCalledWith({
        limit: 50,
        offset: 0,
      });
    });

    await waitFor(() => {
      expect(screen.getByText('business@example.com')).toBeInTheDocument();
      expect(screen.getByText('company@example.com')).toBeInTheDocument();
    });
  });

  it('should display masked API keys in correct format', async () => {
    render(
      <BrowserRouter>
        <APIKeyManagement />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('****-****-****-ABCD')).toBeInTheDocument();
      expect(screen.getByText('****-****-****-EFGH')).toBeInTheDocument();
    });
  });

  it('should apply status filter when selected', async () => {
    render(
      <BrowserRouter>
        <APIKeyManagement />
      </BrowserRouter>
    );

    // Wait for initial load
    await waitFor(() => {
      expect(mockAdminAPI.listAPIKeys).toHaveBeenCalled();
    });

    // Find and click status filter dropdown
    const statusSelect = screen.getByRole('combobox', { name: /status/i });
    fireEvent.change(statusSelect, { target: { value: 'active' } });

    await waitFor(() => {
      expect(mockAdminAPI.listAPIKeys).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'active',
        })
      );
    });
  });

  it('should apply search filter with debouncing', async () => {
    render(
      <BrowserRouter>
        <APIKeyManagement />
      </BrowserRouter>
    );

    // Wait for initial load
    await waitFor(() => {
      expect(mockAdminAPI.listAPIKeys).toHaveBeenCalled();
    });

    // Find and type in search input
    const searchInput = screen.getByPlaceholderText(/search by business email/i);
    fireEvent.change(searchInput, { target: { value: 'business@example.com' } });

    await waitFor(() => {
      expect(mockAdminAPI.listAPIKeys).toHaveBeenCalledWith(
        expect.objectContaining({
          search: 'business@example.com',
        })
      );
    });
  });

  it('should display loading state while fetching', () => {
    mockAdminAPI.loading = true;
    mockAdminAPI.listAPIKeys.mockReturnValue(new Promise(() => {})); // Never resolves

    render(
      <BrowserRouter>
        <APIKeyManagement />
      </BrowserRouter>
    );

    expect(screen.getByText(/loading api keys/i)).toBeInTheDocument();
  });

  it('should display error message on fetch failure', async () => {
    mockAdminAPI.listAPIKeys.mockRejectedValue(new Error('Failed to fetch API keys'));

    render(
      <BrowserRouter>
        <APIKeyManagement />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/failed to fetch api keys/i)).toBeInTheDocument();
    });
  });

  it('should display empty state when no API keys found', async () => {
    mockAdminAPI.listAPIKeys.mockResolvedValue({
      apiKeys: [],
      count: 0,
    });

    render(
      <BrowserRouter>
        <APIKeyManagement />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/no api keys found/i)).toBeInTheDocument();
    });
  });

  it('should reset filters when reset button is clicked', async () => {
    render(
      <BrowserRouter>
        <APIKeyManagement />
      </BrowserRouter>
    );

    // Wait for initial load
    await waitFor(() => {
      expect(mockAdminAPI.listAPIKeys).toHaveBeenCalled();
    });

    // Apply a filter
    const statusSelect = screen.getByRole('combobox', { name: /status/i });
    fireEvent.change(statusSelect, { target: { value: 'active' } });

    // Click reset button
    const resetButton = screen.getByRole('button', { name: /reset/i });
    fireEvent.click(resetButton);

    await waitFor(() => {
      expect(mockAdminAPI.listAPIKeys).toHaveBeenCalledWith(
        expect.objectContaining({
          status: '',
        })
      );
    });
  });
});
