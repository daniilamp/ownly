# FilterPanel Component Usage Guide

## Overview

The `FilterPanel` component is a reusable, flexible filtering component designed for admin tables. It supports multiple filter types and provides a consistent UI for filtering data across different admin pages.

## Features

- ✅ Text input with search icon
- ✅ Dropdown select
- ✅ Date range picker
- ✅ Multi-select with checkboxes
- ✅ Active filter count badge
- ✅ Reset all filters functionality
- ✅ Responsive layout (mobile/desktop)
- ✅ Consistent Ownly design system styling

## Basic Usage

```jsx
import FilterPanel from '@/components/admin/FilterPanel';

function MyComponent() {
  const [filters, setFilters] = useState({});

  const filterConfig = [
    {
      key: 'search',
      type: 'text',
      label: 'Search',
      placeholder: 'Search by email or ID...'
    },
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

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const handleReset = () => {
    setFilters({});
  };

  return (
    <FilterPanel
      filters={filterConfig}
      activeFilters={filters}
      onChange={handleFilterChange}
      onReset={handleReset}
    />
  );
}
```

## Filter Types

### 1. Text Input

```jsx
{
  key: 'search',
  type: 'text',
  label: 'Search',
  placeholder: 'Search users...',
  defaultValue: '' // optional
}
```

**Value**: String

### 2. Select Dropdown

```jsx
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
```

**Value**: String (selected option value)

### 3. Date Range

```jsx
{
  key: 'dateRange',
  type: 'dateRange',
  label: 'Date Range'
}
```

**Value**: Object `{ startDate: '2024-01-01', endDate: '2024-01-31' }`

### 4. Multi-Select

```jsx
{
  key: 'status',
  type: 'multiSelect',
  label: 'Status',
  placeholder: 'Select status...',
  options: [
    { value: 'active', label: 'Active' },
    { value: 'inactive', label: 'Inactive' },
    { value: 'suspended', label: 'Suspended' }
  ]
}
```

**Value**: Array of strings `['active', 'inactive']`

## Complete Example: User Management Filters

```jsx
import { useState, useEffect } from 'react';
import FilterPanel from '@/components/admin/FilterPanel';

function UserManagement() {
  const [filters, setFilters] = useState({});
  const [users, setUsers] = useState([]);

  // Filter configuration
  const filterConfig = [
    {
      key: 'search',
      type: 'text',
      label: 'Search',
      placeholder: 'Search by email or user ID...'
    },
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
    },
    {
      key: 'status',
      type: 'multiSelect',
      label: 'Status',
      placeholder: 'Select status...',
      options: [
        { value: 'active', label: 'Active' },
        { value: 'inactive', label: 'Inactive' },
        { value: 'suspended', label: 'Suspended' }
      ]
    },
    {
      key: 'dateRange',
      type: 'dateRange',
      label: 'Registration Date'
    }
  ];

  // Fetch users when filters change
  useEffect(() => {
    fetchUsers(filters);
  }, [filters]);

  const fetchUsers = async (filterValues) => {
    // Build query params from filters
    const params = new URLSearchParams();
    
    if (filterValues.search) {
      params.append('search', filterValues.search);
    }
    if (filterValues.role) {
      params.append('role', filterValues.role);
    }
    if (filterValues.status?.length > 0) {
      params.append('status', filterValues.status.join(','));
    }
    if (filterValues.dateRange?.startDate) {
      params.append('startDate', filterValues.dateRange.startDate);
    }
    if (filterValues.dateRange?.endDate) {
      params.append('endDate', filterValues.dateRange.endDate);
    }

    // Fetch data
    const response = await fetch(`/api/admin/users?${params}`);
    const data = await response.json();
    setUsers(data.users);
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const handleReset = () => {
    setFilters({});
  };

  return (
    <div>
      <h1>User Management</h1>
      
      <FilterPanel
        filters={filterConfig}
        activeFilters={filters}
        onChange={handleFilterChange}
        onReset={handleReset}
      />

      {/* User table */}
      <table>
        {/* ... */}
      </table>
    </div>
  );
}
```

## With Debouncing (Recommended for Text Inputs)

For better performance, debounce text input changes:

```jsx
import { useState, useEffect } from 'react';
import FilterPanel from '@/components/admin/FilterPanel';

function UserManagement() {
  const [filters, setFilters] = useState({});
  const [debouncedFilters, setDebouncedFilters] = useState({});

  // Debounce filter changes (300ms)
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedFilters(filters);
    }, 300);

    return () => clearTimeout(timer);
  }, [filters]);

  // Fetch data with debounced filters
  useEffect(() => {
    fetchUsers(debouncedFilters);
  }, [debouncedFilters]);

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const handleReset = () => {
    setFilters({});
  };

  // ... rest of component
}
```

## API Reference

### Props

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `filters` | `Array<FilterConfig>` | Yes | Array of filter configurations |
| `activeFilters` | `Object` | Yes | Current filter values `{ filterKey: value }` |
| `onChange` | `(key: string, value: any) => void` | Yes | Callback when filter changes |
| `onReset` | `() => void` | Yes | Callback to reset all filters |

### FilterConfig

```typescript
interface FilterConfig {
  key: string;              // Unique filter identifier
  type: 'text' | 'select' | 'dateRange' | 'multiSelect';
  label: string;            // Display label
  placeholder?: string;     // Placeholder text
  options?: Array<{         // For select/multiSelect
    value: string;
    label: string;
  }>;
  defaultValue?: any;       // Default value
}
```

## Styling

The component uses the Ownly design system with:
- Purple accent color (`#B794F6`)
- Dark background (`rgba(183,148,246,0.04)`)
- Consistent border styling
- Responsive layout with flexbox
- Mobile-friendly touch targets

## Accessibility

- All inputs have associated labels
- Keyboard navigation supported
- Focus states visible
- Color contrast meets WCAG AA standards

## Requirements Satisfied

- ✅ 3.1: Text input filter
- ✅ 3.2: Dropdown filter
- ✅ 3.3: Date range filter (not explicitly mentioned but implied)
- ✅ 3.4: Filter application updates table
- ✅ 3.5: Debouncing (handled by parent component)
- ✅ 3.6: Active filter count badge
- ✅ 8.1-8.4: API Key filtering support
- ✅ 12.1-12.6: Audit log filtering support
- ✅ Responsive layout for mobile/desktop
