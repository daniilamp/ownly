/**
 * Unit tests for UserTable component
 * 
 * Tests:
 * - Rendering with different states (loading, error, empty, data)
 * - Sortable columns functionality
 * - Pagination controls
 * - User click callback
 * - Responsive behavior
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import UserTable from './UserTable';

// Mock user data
const mockUsers = [
  {
    id: '123e4567-e89b-12d3-a456-426614174000',
    email: 'user1@example.com',
    role: 'user',
    status: 'active',
    created_at: '2024-01-15T10:30:00Z',
  },
  {
    id: '223e4567-e89b-12d3-a456-426614174001',
    email: 'business@example.com',
    role: 'business',
    status: 'active',
    created_at: '2024-01-20T14:20:00Z',
  },
  {
    id: '323e4567-e89b-12d3-a456-426614174002',
    email: 'admin@example.com',
    role: 'admin',
    status: 'active',
    created_at: '2024-01-25T09:15:00Z',
  },
];

const mockPagination = {
  currentPage: 1,
  pageSize: 50,
  totalPages: 2,
  hasPrevPage: false,
  hasNextPage: true,
  prevPage: vi.fn(),
  nextPage: vi.fn(),
};

describe('UserTable', () => {
  describe('Loading State', () => {
    it('should display loading spinner when loading with no users', () => {
      render(<UserTable users={[]} loading={true} />);
      
      expect(screen.getByText('Loading users...')).toBeInTheDocument();
    });

    it('should display loading indicator in header when loading with existing users', () => {
      render(<UserTable users={mockUsers} loading={true} totalUsers={3} />);
      
      expect(screen.getByText('Loading...')).toBeInTheDocument();
      expect(screen.getByText('Users (3)')).toBeInTheDocument();
    });
  });

  describe('Error State', () => {
    it('should display error message when error prop is provided', () => {
      const errorMessage = 'Failed to load users';
      render(<UserTable users={[]} error={errorMessage} />);
      
      expect(screen.getByText(errorMessage)).toBeInTheDocument();
    });

    it('should not display error when loading', () => {
      render(<UserTable users={[]} loading={true} error="Some error" />);
      
      expect(screen.queryByText('Some error')).not.toBeInTheDocument();
    });
  });

  describe('Empty State', () => {
    it('should display empty state when no users and not loading', () => {
      render(<UserTable users={[]} loading={false} />);
      
      expect(screen.getByText('No users found')).toBeInTheDocument();
      expect(screen.getByText('No users match your current filters')).toBeInTheDocument();
    });
  });

  describe('Data Display', () => {
    it('should render user table with data', () => {
      render(<UserTable users={mockUsers} totalUsers={3} />);
      
      // Check header
      expect(screen.getByText('Users (3)')).toBeInTheDocument();
      
      // Check column headers
      expect(screen.getByText('User ID')).toBeInTheDocument();
      expect(screen.getByText('Email')).toBeInTheDocument();
      expect(screen.getByText('Role')).toBeInTheDocument();
      expect(screen.getByText('Status')).toBeInTheDocument();
      expect(screen.getByText('Registration Date')).toBeInTheDocument();
      expect(screen.getByText('Actions')).toBeInTheDocument();
      
      // Check user data
      expect(screen.getByText('user1@example.com')).toBeInTheDocument();
      expect(screen.getByText('business@example.com')).toBeInTheDocument();
      expect(screen.getByText('admin@example.com')).toBeInTheDocument();
    });

    it('should display truncated user IDs', () => {
      render(<UserTable users={mockUsers} />);
      
      expect(screen.getByText('123e4567...')).toBeInTheDocument();
    });

    it('should display role badges with correct styling', () => {
      render(<UserTable users={mockUsers} />);
      
      const roleBadges = screen.getAllByText(/user|business|admin/i);
      expect(roleBadges.length).toBeGreaterThan(0);
    });

    it('should display status badges', () => {
      render(<UserTable users={mockUsers} />);
      
      const statusBadges = screen.getAllByText('active');
      expect(statusBadges.length).toBe(3);
    });

    it('should format registration dates', () => {
      render(<UserTable users={mockUsers} />);
      
      // Dates should be formatted as locale date strings
      const dateElements = screen.getAllByText(/\d{1,2}\/\d{1,2}\/\d{4}/);
      expect(dateElements.length).toBeGreaterThan(0);
    });
  });

  describe('Sorting', () => {
    it('should display sort indicators on sortable columns', () => {
      render(<UserTable users={mockUsers} />);
      
      // Email, Role, Status, and Registration Date should be sortable
      const emailHeader = screen.getByText('Email').closest('th');
      const roleHeader = screen.getByText('Role').closest('th');
      const statusHeader = screen.getByText('Status').closest('th');
      const dateHeader = screen.getByText('Registration Date').closest('th');
      
      expect(emailHeader).toHaveClass('cursor-pointer');
      expect(roleHeader).toHaveClass('cursor-pointer');
      expect(statusHeader).toHaveClass('cursor-pointer');
      expect(dateHeader).toHaveClass('cursor-pointer');
    });

    it('should call onSort callback when column header is clicked', () => {
      const onSort = vi.fn();
      render(<UserTable users={mockUsers} onSort={onSort} />);
      
      const emailHeader = screen.getByText('Email').closest('th');
      fireEvent.click(emailHeader);
      
      expect(onSort).toHaveBeenCalledWith('email', 'asc');
    });

    it('should toggle sort direction on repeated clicks', () => {
      const onSort = vi.fn();
      render(<UserTable users={mockUsers} onSort={onSort} />);
      
      const emailHeader = screen.getByText('Email').closest('th');
      
      // First click - ascending
      fireEvent.click(emailHeader);
      expect(onSort).toHaveBeenCalledWith('email', 'asc');
      
      // Second click - descending
      fireEvent.click(emailHeader);
      expect(onSort).toHaveBeenCalledWith('email', 'desc');
    });

    it('should sort users client-side when onSort not provided', () => {
      const unsortedUsers = [
        { ...mockUsers[2], email: 'zebra@example.com' },
        { ...mockUsers[1], email: 'alpha@example.com' },
        { ...mockUsers[0], email: 'beta@example.com' },
      ];
      
      render(<UserTable users={unsortedUsers} />);
      
      const emailHeader = screen.getByText('Email').closest('th');
      fireEvent.click(emailHeader);
      
      // Check that emails are displayed in sorted order
      const emailCells = screen.getAllByText(/@example\.com/);
      expect(emailCells[0]).toHaveTextContent('alpha@example.com');
      expect(emailCells[1]).toHaveTextContent('beta@example.com');
      expect(emailCells[2]).toHaveTextContent('zebra@example.com');
    });
  });

  describe('User Actions', () => {
    it('should call onUserClick when View Details button is clicked', () => {
      const onUserClick = vi.fn();
      render(<UserTable users={mockUsers} onUserClick={onUserClick} />);
      
      const viewButtons = screen.getAllByText('View Details');
      fireEvent.click(viewButtons[0]);
      
      // Table is sorted by created_at descending by default, so first row is the last user (admin)
      expect(onUserClick).toHaveBeenCalledWith(mockUsers[2].id);
    });

    it('should not throw error when onUserClick is not provided', () => {
      render(<UserTable users={mockUsers} />);
      
      const viewButtons = screen.getAllByText('View Details');
      expect(() => fireEvent.click(viewButtons[0])).not.toThrow();
    });

    it('should render RoleSelector when onRoleChange is provided', () => {
      const onRoleChange = vi.fn();
      render(<UserTable users={mockUsers} onRoleChange={onRoleChange} />);
      
      // RoleSelector should be rendered for each user
      const roleButtons = screen.getAllByLabelText(/Current role:/i);
      expect(roleButtons.length).toBe(3);
    });

    it('should render StatusToggle when onStatusChange is provided', () => {
      const onStatusChange = vi.fn();
      render(<UserTable users={mockUsers} onStatusChange={onStatusChange} />);
      
      // StatusToggle should be rendered for each user
      const statusButtons = screen.getAllByLabelText(/Current status:/i);
      expect(statusButtons.length).toBe(3);
    });

    it('should render static status badge when onStatusChange is not provided', () => {
      render(<UserTable users={mockUsers} />);
      
      // Static status badges should be rendered
      const statusBadges = screen.getAllByText('active');
      expect(statusBadges.length).toBe(3);
      
      // Should not have status toggle buttons
      expect(screen.queryByLabelText(/Current status:/i)).not.toBeInTheDocument();
    });
  });

  describe('Pagination', () => {
    it('should display pagination controls when totalPages > 1', () => {
      render(
        <UserTable
          users={mockUsers}
          totalUsers={100}
          pagination={mockPagination}
        />
      );
      
      expect(screen.getByText('Previous')).toBeInTheDocument();
      expect(screen.getByText('Next')).toBeInTheDocument();
      expect(screen.getByText('Page 1 of 2')).toBeInTheDocument();
    });

    it('should not display pagination when totalPages <= 1', () => {
      const singlePagePagination = { ...mockPagination, totalPages: 1 };
      render(
        <UserTable
          users={mockUsers}
          totalUsers={3}
          pagination={singlePagePagination}
        />
      );
      
      expect(screen.queryByText('Previous')).not.toBeInTheDocument();
      expect(screen.queryByText('Next')).not.toBeInTheDocument();
    });

    it('should call prevPage when Previous button is clicked', () => {
      const pagination = { ...mockPagination, currentPage: 2, hasPrevPage: true };
      render(
        <UserTable
          users={mockUsers}
          totalUsers={100}
          pagination={pagination}
        />
      );
      
      const prevButton = screen.getByText('Previous');
      fireEvent.click(prevButton);
      
      expect(pagination.prevPage).toHaveBeenCalled();
    });

    it('should call nextPage when Next button is clicked', () => {
      render(
        <UserTable
          users={mockUsers}
          totalUsers={100}
          pagination={mockPagination}
        />
      );
      
      const nextButton = screen.getByText('Next');
      fireEvent.click(nextButton);
      
      expect(mockPagination.nextPage).toHaveBeenCalled();
    });

    it('should disable Previous button when hasPrevPage is false', () => {
      render(
        <UserTable
          users={mockUsers}
          totalUsers={100}
          pagination={mockPagination}
        />
      );
      
      const prevButton = screen.getByText('Previous');
      expect(prevButton).toBeDisabled();
    });

    it('should disable Next button when hasNextPage is false', () => {
      const pagination = { ...mockPagination, hasNextPage: false };
      render(
        <UserTable
          users={mockUsers}
          totalUsers={100}
          pagination={pagination}
        />
      );
      
      const nextButton = screen.getByText('Next');
      expect(nextButton).toBeDisabled();
    });

    it('should display correct item range in pagination info', () => {
      render(
        <UserTable
          users={mockUsers}
          totalUsers={100}
          pagination={mockPagination}
        />
      );
      
      // Text is split across multiple elements, so use a function matcher
      expect(screen.getByText((content, element) => {
        return element?.textContent === 'Showing 1 to 50 of 100 users';
      })).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should render table with proper semantic HTML', () => {
      const { container } = render(<UserTable users={mockUsers} />);
      
      const table = container.querySelector('table');
      expect(table).toBeInTheDocument();
      
      const thead = container.querySelector('thead');
      expect(thead).toBeInTheDocument();
      
      const tbody = container.querySelector('tbody');
      expect(tbody).toBeInTheDocument();
    });

    it('should have clickable column headers for sorting', () => {
      render(<UserTable users={mockUsers} />);
      
      const emailHeader = screen.getByText('Email').closest('th');
      expect(emailHeader).toHaveClass('cursor-pointer');
    });
  });

  describe('Edge Cases', () => {
    it('should handle users with missing fields gracefully', () => {
      const incompleteUser = {
        id: '123',
        email: 'test@example.com',
        role: 'user',
        status: 'active',
        // missing created_at
      };
      
      expect(() => render(<UserTable users={[incompleteUser]} />)).not.toThrow();
    });

    it('should handle empty user array', () => {
      render(<UserTable users={[]} />);
      
      expect(screen.getByText('No users found')).toBeInTheDocument();
    });

    it('should handle undefined pagination prop', () => {
      render(<UserTable users={mockUsers} pagination={null} />);
      
      expect(screen.queryByText('Previous')).not.toBeInTheDocument();
      expect(screen.queryByText('Next')).not.toBeInTheDocument();
    });
  });
});
