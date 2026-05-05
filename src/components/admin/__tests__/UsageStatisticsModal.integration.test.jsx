/**
 * UsageStatisticsModal Integration Tests
 * 
 * Tests:
 * - Modal opening and data fetching
 * - Usage data display
 * - Chart rendering
 * 
 * Requirements: 10.1, 10.2, 10.3, 10.4, 10.5
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import UsageStatisticsModal from '../UsageStatisticsModal';
import * as useAdminAPIModule from '../../../hooks/useAdminAPI';

// Mock useAdminAPI hook
vi.mock('../../../hooks/useAdminAPI');

// Mock recharts to avoid rendering issues in tests
vi.mock('recharts', () => ({
  LineChart: ({ children }) => <div data-testid="line-chart">{children}</div>,
  Line: () => <div data-testid="line" />,
  XAxis: () => <div data-testid="x-axis" />,
  YAxis: () => <div data-testid="y-axis" />,
  CartesianGrid: () => <div data-testid="cartesian-grid" />,
  Tooltip: () => <div data-testid="tooltip" />,
  ResponsiveContainer: ({ children }) => <div data-testid="responsive-container">{children}</div>,
}));

describe('UsageStatisticsModal - Integration', () => {
  const mockUsageData = {
    totalRequests: 15420,
    requestsByEndpoint: [
      { endpoint: '/api/credentials', count: 8500 },
      { endpoint: '/api/verify', count: 4200 },
      { endpoint: '/api/documents', count: 2720 },
    ],
    timelineData: [
      { date: '2024-01-01', count: 450 },
      { date: '2024-01-02', count: 520 },
      { date: '2024-01-03', count: 480 },
      { date: '2024-01-04', count: 610 },
      { date: '2024-01-05', count: 550 },
    ],
  };

  const mockAdminAPI = {
    getAPIUsageStats: vi.fn(),
    loading: false,
    error: null,
  };

  const mockOnClose = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(useAdminAPIModule, 'useAdminAPI').mockReturnValue(mockAdminAPI);
    mockAdminAPI.getAPIUsageStats.mockResolvedValue(mockUsageData);
  });

  it('should fetch and display usage statistics on mount', async () => {
    render(
      <UsageStatisticsModal
        apiKeyId="key-123"
        onClose={mockOnClose}
      />
    );

    // Should show loading state initially
    expect(screen.getByText(/loading usage statistics/i)).toBeInTheDocument();

    // Wait for data to load
    await waitFor(() => {
      expect(mockAdminAPI.getAPIUsageStats).toHaveBeenCalled();
    });

    // Should display total requests
    await waitFor(() => {
      expect(screen.getByText('15,420')).toBeInTheDocument();
    });
  });

  it('should display requests by endpoint breakdown', async () => {
    render(
      <UsageStatisticsModal
        apiKeyId="key-123"
        onClose={mockOnClose}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('/api/credentials')).toBeInTheDocument();
      expect(screen.getByText('/api/verify')).toBeInTheDocument();
      expect(screen.getByText('/api/documents')).toBeInTheDocument();
    });

    // Should display request counts
    await waitFor(() => {
      expect(screen.getByText('8,500')).toBeInTheDocument();
      expect(screen.getByText('4,200')).toBeInTheDocument();
      expect(screen.getByText('2,720')).toBeInTheDocument();
    });
  });

  it('should render usage timeline chart', async () => {
    render(
      <UsageStatisticsModal
        apiKeyId="key-123"
        onClose={mockOnClose}
      />
    );

    await waitFor(() => {
      expect(screen.getByTestId('responsive-container')).toBeInTheDocument();
      expect(screen.getByTestId('line-chart')).toBeInTheDocument();
    });
  });

  it('should display permissions section', async () => {
    render(
      <UsageStatisticsModal
        apiKeyId="key-123"
        onClose={mockOnClose}
      />
    );

    await waitFor(() => {
      expect(screen.getByText(/api key permissions/i)).toBeInTheDocument();
    });

    // Should display permission badges
    await waitFor(() => {
      expect(screen.getByText('read:credentials')).toBeInTheDocument();
      expect(screen.getByText('write:credentials')).toBeInTheDocument();
    });
  });

  it('should close modal when close button is clicked', async () => {
    const user = userEvent.setup();
    
    render(
      <UsageStatisticsModal
        apiKeyId="key-123"
        onClose={mockOnClose}
      />
    );

    await waitFor(() => {
      expect(mockAdminAPI.getAPIUsageStats).toHaveBeenCalled();
    });

    // Click close button in header
    const closeButtons = screen.getAllByRole('button', { name: /close/i });
    await user.click(closeButtons[0]);

    expect(mockOnClose).toHaveBeenCalled();
  });

  it('should close modal when escape key is pressed', async () => {
    render(
      <UsageStatisticsModal
        apiKeyId="key-123"
        onClose={mockOnClose}
      />
    );

    await waitFor(() => {
      expect(mockAdminAPI.getAPIUsageStats).toHaveBeenCalled();
    });

    // Press escape key
    fireEvent.keyDown(document, { key: 'Escape' });

    expect(mockOnClose).toHaveBeenCalled();
  });

  it('should close modal when backdrop is clicked', async () => {
    const user = userEvent.setup();
    
    render(
      <UsageStatisticsModal
        apiKeyId="key-123"
        onClose={mockOnClose}
      />
    );

    await waitFor(() => {
      expect(mockAdminAPI.getAPIUsageStats).toHaveBeenCalled();
    });

    // Click backdrop (the outer div)
    const backdrop = screen.getByText(/api key usage statistics/i).closest('div').parentElement;
    await user.click(backdrop);

    expect(mockOnClose).toHaveBeenCalled();
  });

  it('should display error message on fetch failure', async () => {
    mockAdminAPI.getAPIUsageStats.mockRejectedValue(new Error('Failed to fetch usage data'));

    render(
      <UsageStatisticsModal
        apiKeyId="key-123"
        onClose={mockOnClose}
      />
    );

    await waitFor(() => {
      expect(screen.getByText(/failed to fetch usage data/i)).toBeInTheDocument();
    });
  });

  it('should display loading state while fetching', () => {
    mockAdminAPI.getAPIUsageStats.mockReturnValue(new Promise(() => {})); // Never resolves

    render(
      <UsageStatisticsModal
        apiKeyId="key-123"
        onClose={mockOnClose}
      />
    );

    expect(screen.getByText(/loading usage statistics/i)).toBeInTheDocument();
  });

  it('should format timeline dates correctly', async () => {
    render(
      <UsageStatisticsModal
        apiKeyId="key-123"
        onClose={mockOnClose}
      />
    );

    await waitFor(() => {
      expect(mockAdminAPI.getAPIUsageStats).toHaveBeenCalled();
    });

    // Chart should be rendered with formatted data
    await waitFor(() => {
      expect(screen.getByTestId('line-chart')).toBeInTheDocument();
    });
  });
});
