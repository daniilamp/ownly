/**
 * Unit tests for FilterPanel component
 * Tests filter state management, onChange callbacks, and active filter count
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import FilterPanel from './FilterPanel';

describe('FilterPanel', () => {
  const mockOnChange = vi.fn();
  const mockOnReset = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Text Input Filter', () => {
    it('should render text input filter with label and placeholder', () => {
      const filters = [
        { key: 'search', type: 'text', label: 'Search', placeholder: 'Search users...' }
      ];

      render(
        <FilterPanel
          filters={filters}
          activeFilters={{}}
          onChange={mockOnChange}
          onReset={mockOnReset}
        />
      );

      expect(screen.getByText('Search')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Search users...')).toBeInTheDocument();
    });

    it('should call onChange when text input changes', () => {
      const filters = [
        { key: 'search', type: 'text', label: 'Search', placeholder: 'Search...' }
      ];

      render(
        <FilterPanel
          filters={filters}
          activeFilters={{}}
          onChange={mockOnChange}
          onReset={mockOnReset}
        />
      );

      const input = screen.getByPlaceholderText('Search...');
      fireEvent.change(input, { target: { value: 'test@example.com' } });

      expect(mockOnChange).toHaveBeenCalledWith('search', 'test@example.com');
    });

    it('should display current value in text input', () => {
      const filters = [
        { key: 'search', type: 'text', label: 'Search' }
      ];

      render(
        <FilterPanel
          filters={filters}
          activeFilters={{ search: 'existing value' }}
          onChange={mockOnChange}
          onReset={mockOnReset}
        />
      );

      const input = screen.getByDisplayValue('existing value');
      expect(input).toBeInTheDocument();
    });
  });

  describe('Select Filter', () => {
    it('should render select filter with options', () => {
      const filters = [
        {
          key: 'role',
          type: 'select',
          label: 'Role',
          placeholder: 'All Roles',
          options: [
            { value: 'user', label: 'User' },
            { value: 'business', label: 'Business' },
            { value: 'admin', label: 'Admin' }
          ]
        }
      ];

      render(
        <FilterPanel
          filters={filters}
          activeFilters={{}}
          onChange={mockOnChange}
          onReset={mockOnReset}
        />
      );

      expect(screen.getByText('Role')).toBeInTheDocument();
      const select = screen.getByRole('combobox');
      expect(select).toBeInTheDocument();
      expect(screen.getByText('All Roles')).toBeInTheDocument();
    });

    it('should call onChange when select value changes', () => {
      const filters = [
        {
          key: 'role',
          type: 'select',
          label: 'Role',
          options: [
            { value: 'user', label: 'User' },
            { value: 'admin', label: 'Admin' }
          ]
        }
      ];

      render(
        <FilterPanel
          filters={filters}
          activeFilters={{}}
          onChange={mockOnChange}
          onReset={mockOnReset}
        />
      );

      const select = screen.getByRole('combobox');
      fireEvent.change(select, { target: { value: 'admin' } });

      expect(mockOnChange).toHaveBeenCalledWith('role', 'admin');
    });

    it('should display selected value', () => {
      const filters = [
        {
          key: 'role',
          type: 'select',
          label: 'Role',
          options: [
            { value: 'user', label: 'User' },
            { value: 'admin', label: 'Admin' }
          ]
        }
      ];

      render(
        <FilterPanel
          filters={filters}
          activeFilters={{ role: 'admin' }}
          onChange={mockOnChange}
          onReset={mockOnReset}
        />
      );

      const select = screen.getByRole('combobox');
      expect(select.value).toBe('admin');
    });
  });

  describe('Date Range Filter', () => {
    it('should render date range filter with start and end inputs', () => {
      const filters = [
        { key: 'dateRange', type: 'dateRange', label: 'Date Range' }
      ];

      render(
        <FilterPanel
          filters={filters}
          activeFilters={{}}
          onChange={mockOnChange}
          onReset={mockOnReset}
        />
      );

      expect(screen.getByText('Date Range')).toBeInTheDocument();
      const dateInputs = screen.getAllByPlaceholderText(/date/i);
      expect(dateInputs).toHaveLength(2);
    });

    it('should call onChange with date range object when start date changes', () => {
      const filters = [
        { key: 'dateRange', type: 'dateRange', label: 'Date Range' }
      ];

      render(
        <FilterPanel
          filters={filters}
          activeFilters={{}}
          onChange={mockOnChange}
          onReset={mockOnReset}
        />
      );

      const dateInputs = screen.getAllByPlaceholderText(/date/i);
      fireEvent.change(dateInputs[0], { target: { value: '2024-01-01' } });

      expect(mockOnChange).toHaveBeenCalledWith('dateRange', { startDate: '2024-01-01' });
    });

    it('should call onChange with date range object when end date changes', () => {
      const filters = [
        { key: 'dateRange', type: 'dateRange', label: 'Date Range' }
      ];

      render(
        <FilterPanel
          filters={filters}
          activeFilters={{ dateRange: { startDate: '2024-01-01' } }}
          onChange={mockOnChange}
          onReset={mockOnReset}
        />
      );

      const dateInputs = screen.getAllByPlaceholderText(/date/i);
      fireEvent.change(dateInputs[1], { target: { value: '2024-01-31' } });

      expect(mockOnChange).toHaveBeenCalledWith('dateRange', {
        startDate: '2024-01-01',
        endDate: '2024-01-31'
      });
    });
  });

  describe('Multi-Select Filter', () => {
    it('should render multi-select filter with button', () => {
      const filters = [
        {
          key: 'status',
          type: 'multiSelect',
          label: 'Status',
          placeholder: 'Select status...',
          options: [
            { value: 'active', label: 'Active' },
            { value: 'inactive', label: 'Inactive' }
          ]
        }
      ];

      render(
        <FilterPanel
          filters={filters}
          activeFilters={{}}
          onChange={mockOnChange}
          onReset={mockOnReset}
        />
      );

      expect(screen.getByText('Status')).toBeInTheDocument();
      expect(screen.getByText('Select status...')).toBeInTheDocument();
    });

    it('should expand dropdown when button is clicked', () => {
      const filters = [
        {
          key: 'status',
          type: 'multiSelect',
          label: 'Status',
          options: [
            { value: 'active', label: 'Active' },
            { value: 'inactive', label: 'Inactive' }
          ]
        }
      ];

      render(
        <FilterPanel
          filters={filters}
          activeFilters={{}}
          onChange={mockOnChange}
          onReset={mockOnReset}
        />
      );

      const button = screen.getByRole('button', { name: /select/i });
      fireEvent.click(button);

      expect(screen.getByText('Active')).toBeInTheDocument();
      expect(screen.getByText('Inactive')).toBeInTheDocument();
    });

    it('should call onChange when checkbox is selected', () => {
      const filters = [
        {
          key: 'status',
          type: 'multiSelect',
          label: 'Status',
          options: [
            { value: 'active', label: 'Active' },
            { value: 'inactive', label: 'Inactive' }
          ]
        }
      ];

      render(
        <FilterPanel
          filters={filters}
          activeFilters={{}}
          onChange={mockOnChange}
          onReset={mockOnReset}
        />
      );

      // Open dropdown
      const button = screen.getByRole('button', { name: /select/i });
      fireEvent.click(button);

      // Select checkbox - use getAllByRole and select the first one
      const checkboxes = screen.getAllByRole('checkbox');
      fireEvent.click(checkboxes[0]);

      expect(mockOnChange).toHaveBeenCalledWith('status', ['active']);
    });

    it('should display selected count', () => {
      const filters = [
        {
          key: 'status',
          type: 'multiSelect',
          label: 'Status',
          options: [
            { value: 'active', label: 'Active' },
            { value: 'inactive', label: 'Inactive' }
          ]
        }
      ];

      render(
        <FilterPanel
          filters={filters}
          activeFilters={{ status: ['active', 'inactive'] }}
          onChange={mockOnChange}
          onReset={mockOnReset}
        />
      );

      expect(screen.getByText('2 selected')).toBeInTheDocument();
    });
  });

  describe('Active Filter Count', () => {
    it('should display active filter count badge when filters are applied', () => {
      const filters = [
        { key: 'search', type: 'text', label: 'Search' },
        { key: 'role', type: 'select', label: 'Role', options: [] }
      ];

      render(
        <FilterPanel
          filters={filters}
          activeFilters={{ search: 'test', role: 'admin' }}
          onChange={mockOnChange}
          onReset={mockOnReset}
        />
      );

      expect(screen.getByText('2')).toBeInTheDocument();
    });

    it('should not display badge when no filters are active', () => {
      const filters = [
        { key: 'search', type: 'text', label: 'Search' }
      ];

      render(
        <FilterPanel
          filters={filters}
          activeFilters={{}}
          onChange={mockOnChange}
          onReset={mockOnReset}
        />
      );

      expect(screen.queryByText(/^\d+$/)).not.toBeInTheDocument();
    });

    it('should count array filters correctly', () => {
      const filters = [
        { key: 'status', type: 'multiSelect', label: 'Status', options: [] }
      ];

      render(
        <FilterPanel
          filters={filters}
          activeFilters={{ status: ['active', 'inactive'] }}
          onChange={mockOnChange}
          onReset={mockOnReset}
        />
      );

      expect(screen.getByText('1')).toBeInTheDocument(); // 1 filter with 2 values
    });

    it('should count date range filters correctly', () => {
      const filters = [
        { key: 'dateRange', type: 'dateRange', label: 'Date Range' }
      ];

      render(
        <FilterPanel
          filters={filters}
          activeFilters={{ dateRange: { startDate: '2024-01-01', endDate: '2024-01-31' } }}
          onChange={mockOnChange}
          onReset={mockOnReset}
        />
      );

      expect(screen.getByText('1')).toBeInTheDocument();
    });
  });

  describe('Reset Functionality', () => {
    it('should display reset button when filters are active', () => {
      const filters = [
        { key: 'search', type: 'text', label: 'Search' }
      ];

      render(
        <FilterPanel
          filters={filters}
          activeFilters={{ search: 'test' }}
          onChange={mockOnChange}
          onReset={mockOnReset}
        />
      );

      expect(screen.getByText('Reset All')).toBeInTheDocument();
    });

    it('should not display reset button when no filters are active', () => {
      const filters = [
        { key: 'search', type: 'text', label: 'Search' }
      ];

      render(
        <FilterPanel
          filters={filters}
          activeFilters={{}}
          onChange={mockOnChange}
          onReset={mockOnReset}
        />
      );

      expect(screen.queryByText('Reset All')).not.toBeInTheDocument();
    });

    it('should call onReset when reset button is clicked', () => {
      const filters = [
        { key: 'search', type: 'text', label: 'Search' }
      ];

      render(
        <FilterPanel
          filters={filters}
          activeFilters={{ search: 'test' }}
          onChange={mockOnChange}
          onReset={mockOnReset}
        />
      );

      const resetButton = screen.getByText('Reset All');
      fireEvent.click(resetButton);

      expect(mockOnReset).toHaveBeenCalled();
    });
  });

  describe('Responsive Layout', () => {
    it('should render all filters in a flex layout', () => {
      const filters = [
        { key: 'search', type: 'text', label: 'Search' },
        { key: 'role', type: 'select', label: 'Role', options: [] },
        { key: 'dateRange', type: 'dateRange', label: 'Date Range' }
      ];

      const { container } = render(
        <FilterPanel
          filters={filters}
          activeFilters={{}}
          onChange={mockOnChange}
          onReset={mockOnReset}
        />
      );

      const filterContainer = container.querySelector('.flex.flex-wrap');
      expect(filterContainer).toBeInTheDocument();
      expect(filterContainer.children).toHaveLength(3);
    });
  });

  describe('Multiple Filters', () => {
    it('should handle multiple filter types simultaneously', () => {
      const filters = [
        { key: 'search', type: 'text', label: 'Search' },
        {
          key: 'role',
          type: 'select',
          label: 'Role',
          options: [{ value: 'admin', label: 'Admin' }]
        },
        { key: 'dateRange', type: 'dateRange', label: 'Date Range' },
        {
          key: 'status',
          type: 'multiSelect',
          label: 'Status',
          options: [{ value: 'active', label: 'Active' }]
        }
      ];

      render(
        <FilterPanel
          filters={filters}
          activeFilters={{
            search: 'test',
            role: 'admin',
            dateRange: { startDate: '2024-01-01' },
            status: ['active']
          }}
          onChange={mockOnChange}
          onReset={mockOnReset}
        />
      );

      expect(screen.getByDisplayValue('test')).toBeInTheDocument();
      expect(screen.getByRole('combobox').value).toBe('admin');
      expect(screen.getByText('1 selected')).toBeInTheDocument();
      expect(screen.getByText('4')).toBeInTheDocument(); // Active filter count
    });
  });
});
