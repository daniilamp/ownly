# UserTable Component Usage Guide

## Overview

The `UserTable` component is a reusable table component for displaying user data in the admin panel. It provides sortable columns, loading states, empty states, error handling, and pagination controls.

## Features

- **Sortable Columns**: Click column headers to sort by email, role, status, or registration date
- **Loading States**: Displays loading spinner during data fetch
- **Empty State**: Shows friendly message when no users match filters
- **Error State**: Displays error messages with retry option
- **Pagination**: Built-in pagination controls for large datasets
- **Responsive Design**: Horizontal scroll on small screens
- **User Actions**: Click "View Details" to navigate to user detail view

## Props

| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `users` | `User[]` | Yes | `[]` | Array of user objects to display |
| `loading` | `boolean` | No | `false` | Loading state indicator |
| `error` | `string \| null` | No | `null` | Error message to display |
| `onUserClick` | `function(userId: string): void` | No | - | Callback when user row is clicked |
| `onSort` | `function(key: string, direction: 'asc'\|'desc'): void` | No | - | Callback for server-side sorting |
| `totalUsers` | `number` | No | `0` | Total number of users (for display) |
| `pagination` | `PaginationObject` | No | `null` | Pagination controls object |

### User Object Structure

```typescript
interface User {
  id: string;              // User ID
  email: string;           // User email
  role: string;            // User role (user, business, admin)
  status: string;          // User status (active, inactive, suspended)
  created_at: string;      // Registration date (ISO 8601)
}
```

### Pagination Object Structure

```typescript
interface PaginationObject {
  currentPage: number;     // Current page number
  pageSize: number;        // Items per page
  totalPages: number;      // Total number of pages
  hasPrevPage: boolean;    // Whether previous page exists
  hasNextPage: boolean;    // Whether next page exists
  prevPage: () => void;    // Go to previous page
  nextPage: () => void;    // Go to next page
}
```

## Basic Usage

### Simple Table (Client-Side Sorting)

```jsx
import UserTable from '../../components/admin/UserTable';

function MyComponent() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);

  const handleUserClick = (userId) => {
    console.log('View user:', userId);
    // Navigate to user detail view
  };

  return (
    <UserTable
      users={users}
      loading={loading}
      onUserClick={handleUserClick}
    />
  );
}
```

### With Server-Side Sorting

```jsx
import UserTable from '../../components/admin/UserTable';

function MyComponent() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [sortKey, setSortKey] = useState('created_at');
  const [sortDirection, setSortDirection] = useState('desc');

  const handleSort = async (key, direction) => {
    setSortKey(key);
    setSortDirection(direction);
    
    // Fetch sorted data from server
    const response = await fetchUsers({ sortBy: key, sortOrder: direction });
    setUsers(response.users);
  };

  return (
    <UserTable
      users={users}
      loading={loading}
      onSort={handleSort}
      onUserClick={handleUserClick}
    />
  );
}
```

### With Pagination

```jsx
import UserTable from '../../components/admin/UserTable';
import { usePagination } from '../../hooks/usePagination';

function MyComponent() {
  const [users, setUsers] = useState([]);
  const [totalUsers, setTotalUsers] = useState(0);
  const [loading, setLoading] = useState(false);

  const pagination = usePagination({
    totalItems: totalUsers,
    initialPageSize: 50,
  });

  useEffect(() => {
    fetchUsers({
      limit: pagination.pageSize,
      offset: (pagination.currentPage - 1) * pagination.pageSize,
    });
  }, [pagination.currentPage, pagination.pageSize]);

  return (
    <UserTable
      users={users}
      loading={loading}
      totalUsers={totalUsers}
      pagination={pagination}
      onUserClick={handleUserClick}
    />
  );
}
```

### With Error Handling

```jsx
import UserTable from '../../components/admin/UserTable';

function MyComponent() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.getUsers();
      setUsers(response.users);
    } catch (err) {
      setError(err.message || 'Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  return (
    <UserTable
      users={users}
      loading={loading}
      error={error}
      onUserClick={handleUserClick}
    />
  );
}
```

## Complete Example (UserManagement Page)

```jsx
import { useState, useEffect } from 'react';
import { Users as UsersIcon } from 'lucide-react';
import { useAdminAPI } from '../../hooks/useAdminAPI';
import { useDebounce } from '../../hooks/useDebounce';
import { usePagination } from '../../hooks/usePagination';
import FilterPanel from '../../components/admin/FilterPanel';
import UserTable from '../../components/admin/UserTable';

export default function UserManagement() {
  const [users, setUsers] = useState([]);
  const [totalUsers, setTotalUsers] = useState(0);
  const [filters, setFilters] = useState({
    role: '',
    status: '',
    search: '',
  });
  const [error, setError] = useState(null);

  const adminAPI = useAdminAPI();
  const debouncedSearch = useDebounce(filters.search, 300);
  const pagination = usePagination({
    totalItems: totalUsers,
    initialPageSize: 50,
  });

  const fetchUsers = async () => {
    try {
      setError(null);
      
      const filterParams = {
        limit: pagination.pageSize,
        offset: (pagination.currentPage - 1) * pagination.pageSize,
      };

      if (filters.role) filterParams.role = filters.role;
      if (filters.status) filterParams.status = filters.status;
      if (debouncedSearch) filterParams.search = debouncedSearch;

      const response = await adminAPI.listUsers(filterParams);
      setUsers(response.users || []);
      setTotalUsers(response.total || 0);
    } catch (err) {
      setError(err.message || 'Failed to load users');
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [pagination.currentPage, filters.role, filters.status, debouncedSearch]);

  const handleUserClick = (userId) => {
    // Navigate to user detail view
    console.log('View user:', userId);
  };

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <UsersIcon className="w-8 h-8" style={{ color: '#B794F6' }} />
        <h1 className="text-3xl font-bold" style={{ color: '#F0EAFF' }}>
          User Management
        </h1>
      </div>

      <FilterPanel
        filters={filterConfig}
        activeFilters={filters}
        onChange={handleFilterChange}
        onReset={handleFilterReset}
      />

      <UserTable
        users={users}
        loading={adminAPI.loading}
        error={error}
        onUserClick={handleUserClick}
        totalUsers={totalUsers}
        pagination={pagination}
      />
    </div>
  );
}
```

## Styling

The component uses inline styles matching the Ownly design system:

- **Primary Color**: `#B794F6` (purple)
- **Text Color**: `#F0EAFF` (light purple)
- **Background**: `rgba(183,148,246,0.04)` (transparent purple)
- **Border**: `rgba(183,148,246,0.15)` (semi-transparent purple)

### Role Badge Colors

- **Admin**: Red (`#F87171`)
- **Business**: Blue (`#60A5FA`)
- **User**: Green (`#34D399`)

### Status Badge Colors

- **Active**: Green (`#34D399`)
- **Suspended**: Red (`#F87171`)
- **Inactive**: Gray (`#9CA3AF`)

## Accessibility

- Semantic HTML table structure
- Keyboard accessible sort controls
- Disabled state for pagination buttons
- ARIA-friendly button labels

## Responsive Behavior

- **Desktop (≥1024px)**: Full table layout
- **Tablet/Mobile (<1024px)**: Horizontal scroll for table
- Touch-friendly button sizes (44x44px minimum)

## Performance Considerations

- Client-side sorting only when `onSort` prop is not provided
- Efficient re-renders with proper key props
- Pagination reduces DOM nodes for large datasets
- Loading states prevent layout shift

## Testing

The component includes comprehensive unit tests covering:

- Loading, error, and empty states
- Data display and formatting
- Sortable columns functionality
- Pagination controls
- User click callbacks
- Accessibility features

Run tests with:

```bash
npm test -- src/components/admin/UserTable.test.jsx
```

## Related Components

- **FilterPanel**: For filtering user data
- **ToastNotification**: For displaying success/error messages
- **ConfirmationDialog**: For confirming user actions

## Related Hooks

- **useAdminAPI**: For fetching user data from admin API
- **usePagination**: For managing pagination state
- **useDebounce**: For debouncing search inputs
