/**
 * RecentActivityTimeline Component Tests
 * 
 * Tests:
 * - Activity data fetching and display
 * - Event type icons
 * - Relative timestamp formatting
 * - Auto-refresh behavior (handled by parent)
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import RecentActivityTimeline from '../RecentActivityTimeline';

// Mock date-fns
vi.mock('date-fns', () => ({
  formatDistanceToNow: vi.fn((date, options) => {
    // Simple mock implementation
    return '5 minutes ago';
  }),
}));

describe('RecentActivityTimeline', () => {
  it('should render component header', () => {
    render(<RecentActivityTimeline recentActivity={[]} />);
    expect(screen.getByText('Recent Activity')).toBeInTheDocument();
  });

  it('should display empty state when no activity', () => {
    render(<RecentActivityTimeline recentActivity={[]} />);
    expect(screen.getByText('No recent activity')).toBeInTheDocument();
  });

  it('should display activity events', () => {
    const mockActivity = [
      {
        id: '1',
        timestamp: new Date().toISOString(),
        userEmail: 'user@test.com',
        endpoint: '/api/test',
        method: 'GET',
        accessGranted: true,
        userRole: 'user',
      },
    ];

    render(<RecentActivityTimeline recentActivity={mockActivity} />);

    expect(screen.getByText('user@test.com')).toBeInTheDocument();
    expect(screen.getByText('GET /api/test')).toBeInTheDocument();
    expect(screen.getByText('5 minutes ago')).toBeInTheDocument();
  });

  it('should display user role badge', () => {
    const mockActivity = [
      {
        id: '1',
        timestamp: new Date().toISOString(),
        userEmail: 'admin@test.com',
        endpoint: '/api/admin/users',
        accessGranted: true,
        userRole: 'admin',
      },
    ];

    render(<RecentActivityTimeline recentActivity={mockActivity} />);

    expect(screen.getByText('ADMIN')).toBeInTheDocument();
  });

  it('should display access denied events', () => {
    const mockActivity = [
      {
        id: '1',
        timestamp: new Date().toISOString(),
        userEmail: 'user@test.com',
        endpoint: '/api/admin/users',
        accessGranted: false,
        userRole: 'user',
      },
    ];

    render(<RecentActivityTimeline recentActivity={mockActivity} />);

    expect(screen.getByText('Access denied to /api/admin/users')).toBeInTheDocument();
  });

  it('should display user registration events', () => {
    const mockActivity = [
      {
        id: '1',
        timestamp: new Date().toISOString(),
        userEmail: 'newuser@test.com',
        endpoint: '/api/auth/register',
        accessGranted: true,
        userRole: 'user',
      },
    ];

    render(<RecentActivityTimeline recentActivity={mockActivity} />);

    expect(screen.getByText('New user registration')).toBeInTheDocument();
  });

  it('should display role change events', () => {
    const mockActivity = [
      {
        id: '1',
        timestamp: new Date().toISOString(),
        userEmail: 'user@test.com',
        endpoint: '/api/admin/users/123/role',
        accessGranted: true,
        userRole: 'admin',
      },
    ];

    render(<RecentActivityTimeline recentActivity={mockActivity} />);

    expect(screen.getByText('User role changed')).toBeInTheDocument();
  });

  it('should display API key events', () => {
    const mockActivity = [
      {
        id: '1',
        timestamp: new Date().toISOString(),
        userEmail: 'business@test.com',
        endpoint: '/api/admin/api-keys',
        accessGranted: true,
        userRole: 'business',
      },
    ];

    render(<RecentActivityTimeline recentActivity={mockActivity} />);

    expect(screen.getByText('API key activity')).toBeInTheDocument();
  });

  it('should display multiple activity events', () => {
    const mockActivity = [
      {
        id: '1',
        timestamp: new Date().toISOString(),
        userEmail: 'user1@test.com',
        endpoint: '/api/test1',
        accessGranted: true,
        userRole: 'user',
      },
      {
        id: '2',
        timestamp: new Date().toISOString(),
        userEmail: 'user2@test.com',
        endpoint: '/api/test2',
        accessGranted: true,
        userRole: 'business',
      },
      {
        id: '3',
        timestamp: new Date().toISOString(),
        userEmail: 'admin@test.com',
        endpoint: '/api/admin/users',
        accessGranted: true,
        userRole: 'admin',
      },
    ];

    render(<RecentActivityTimeline recentActivity={mockActivity} />);

    expect(screen.getByText('user1@test.com')).toBeInTheDocument();
    expect(screen.getByText('user2@test.com')).toBeInTheDocument();
    expect(screen.getByText('admin@test.com')).toBeInTheDocument();
  });

  it('should handle missing userEmail gracefully', () => {
    const mockActivity = [
      {
        id: '1',
        timestamp: new Date().toISOString(),
        endpoint: '/api/test',
        accessGranted: true,
      },
    ];

    render(<RecentActivityTimeline recentActivity={mockActivity} />);

    expect(screen.getByText('Unknown user')).toBeInTheDocument();
  });

  it('should handle missing endpoint gracefully', () => {
    const mockActivity = [
      {
        id: '1',
        timestamp: new Date().toISOString(),
        userEmail: 'user@test.com',
        accessGranted: true,
      },
    ];

    render(<RecentActivityTimeline recentActivity={mockActivity} />);

    expect(screen.getByText('user@test.com')).toBeInTheDocument();
    // Should not crash without endpoint
  });

  it('should display default method as GET when not provided', () => {
    const mockActivity = [
      {
        id: '1',
        timestamp: new Date().toISOString(),
        userEmail: 'user@test.com',
        endpoint: '/api/test',
        accessGranted: true,
      },
    ];

    render(<RecentActivityTimeline recentActivity={mockActivity} />);

    expect(screen.getByText('GET /api/test')).toBeInTheDocument();
  });

  it('should display custom HTTP method when provided', () => {
    const mockActivity = [
      {
        id: '1',
        timestamp: new Date().toISOString(),
        userEmail: 'user@test.com',
        endpoint: '/api/test',
        method: 'POST',
        accessGranted: true,
      },
    ];

    render(<RecentActivityTimeline recentActivity={mockActivity} />);

    expect(screen.getByText('POST /api/test')).toBeInTheDocument();
  });

  it('should handle activity without id field', () => {
    const mockActivity = [
      {
        timestamp: new Date().toISOString(),
        userEmail: 'user@test.com',
        endpoint: '/api/test',
        accessGranted: true,
      },
    ];

    render(<RecentActivityTimeline recentActivity={mockActivity} />);

    expect(screen.getByText('user@test.com')).toBeInTheDocument();
  });

  it('should render all 20 events when provided', () => {
    const mockActivity = Array.from({ length: 20 }, (_, i) => ({
      id: `${i + 1}`,
      timestamp: new Date().toISOString(),
      userEmail: `user${i + 1}@test.com`,
      endpoint: `/api/test${i + 1}`,
      accessGranted: true,
      userRole: 'user',
    }));

    render(<RecentActivityTimeline recentActivity={mockActivity} />);

    // Check that all 20 users are displayed
    mockActivity.forEach((activity) => {
      expect(screen.getByText(activity.userEmail)).toBeInTheDocument();
    });
  });
});
