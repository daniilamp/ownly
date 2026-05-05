# StatusToggle Component Usage Guide

## Overview

The `StatusToggle` component is a dropdown selector for changing user account status in the admin panel. It provides visual indicators for different statuses (active, inactive, suspended) and triggers a confirmation dialog before applying changes.

## Features

- **Visual Status Indicators**: Color-coded badges for each status
  - Active: Green (#34D399)
  - Inactive: Gray (#9CA3AF)
  - Suspended: Red (#F87171)
- **Confirmation Dialog**: Requires confirmation before status changes
- **Reason Requirement**: Requires reason for deactivation or suspension (minimum 10 characters)
- **Warning Messages**: Special warning for suspension actions
- **Keyboard Accessible**: Full keyboard navigation support
- **Responsive Design**: Works on all screen sizes

## Props

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `currentStatus` | `string` | Yes | Current user status: `'active'`, `'inactive'`, or `'suspended'` |
| `userId` | `string` | Yes | User ID for tracking the status change |
| `onStatusChange` | `function` | Yes | Callback function: `(userId, newStatus, reason) => void` |
| `disabled` | `boolean` | No | Whether the selector is disabled (default: `false`) |

## Usage Examples

### Basic Usage

```jsx
import StatusToggle from '@/components/admin/StatusToggle';

function UserManagement() {
  const handleStatusChange = (userId, newStatus, reason) => {
    console.log(`Changing user ${userId} status to ${newStatus}`);
    console.log(`Reason: ${reason}`);
    
    // Call API to update user status
    updateUserStatus(userId, newStatus, reason);
  };

  return (
    <StatusToggle
      currentStatus="active"
      userId="user-123"
      onStatusChange={handleStatusChange}
    />
  );
}
```

### In a Table

```jsx
import StatusToggle from '@/components/admin/StatusToggle';

function UserTable({ users, onStatusChange }) {
  return (
    <table>
      <thead>
        <tr>
          <th>Email</th>
          <th>Status</th>
        </tr>
      </thead>
      <tbody>
        {users.map((user) => (
          <tr key={user.id}>
            <td>{user.email}</td>
            <td>
              <StatusToggle
                currentStatus={user.status}
                userId={user.id}
                onStatusChange={onStatusChange}
              />
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
```

### With API Integration

```jsx
import { useState } from 'react';
import StatusToggle from '@/components/admin/StatusToggle';
import { useAdminAPI } from '@/hooks/useAdminAPI';

function UserManagement() {
  const [users, setUsers] = useState([]);
  const adminAPI = useAdminAPI();

  const handleStatusChange = async (userId, newStatus, reason) => {
    try {
      // Call API to update status
      const updatedUser = await adminAPI.updateUserStatus(userId, newStatus, reason);
      
      // Update local state
      setUsers(users.map(user => 
        user.id === userId ? { ...user, status: newStatus } : user
      ));
      
      // Show success message
      showToast('success', 'User status updated successfully');
    } catch (error) {
      // Show error message
      showToast('error', error.message || 'Failed to update user status');
    }
  };

  return (
    <div>
      {users.map((user) => (
        <StatusToggle
          key={user.id}
          currentStatus={user.status}
          userId={user.id}
          onStatusChange={handleStatusChange}
        />
      ))}
    </div>
  );
}
```

### Disabled State

```jsx
<StatusToggle
  currentStatus="active"
  userId="user-123"
  onStatusChange={handleStatusChange}
  disabled={true}
/>
```

## Status Options

### Active
- **Color**: Green (#34D399)
- **Icon**: CheckCircle
- **Description**: User has full access to the platform
- **Reason Required**: No

### Inactive
- **Color**: Gray (#9CA3AF)
- **Icon**: XCircle
- **Description**: User account is deactivated
- **Reason Required**: Yes (minimum 10 characters)

### Suspended
- **Color**: Red (#F87171)
- **Icon**: Ban
- **Description**: User account is temporarily suspended
- **Reason Required**: Yes (minimum 10 characters)
- **Warning**: Shows special warning message about immediate access loss

## Confirmation Dialog Behavior

### Activating a User (inactive/suspended → active)
- **Title**: "Change User Status"
- **Message**: Explains that user will regain access
- **Reason Required**: No
- **Danger Styling**: No

### Deactivating a User (active → inactive)
- **Title**: "Change User Status"
- **Message**: Explains that user will lose access
- **Reason Required**: Yes (minimum 10 characters)
- **Danger Styling**: Yes

### Suspending a User (active/inactive → suspended)
- **Title**: "Change User Status"
- **Message**: ⚠️ WARNING with detailed explanation
- **Reason Required**: Yes (minimum 10 characters)
- **Danger Styling**: Yes

## Callback Parameters

The `onStatusChange` callback receives three parameters:

```typescript
onStatusChange(
  userId: string,      // The user ID
  newStatus: string,   // The new status ('active', 'inactive', 'suspended')
  reason?: string      // The reason (undefined for activation, required for deactivation/suspension)
)
```

## Accessibility

- **Keyboard Navigation**: Full keyboard support with Tab, Enter, and Escape keys
- **ARIA Labels**: Proper ARIA labels for screen readers
- **Focus Management**: Focus is trapped within the confirmation dialog
- **Visual Indicators**: Color-coded status with icons for better visibility

## Styling

The component uses inline styles that match the admin panel design system:
- Purple theme (#B794F6)
- Dark background (rgba(20,16,40,0.98))
- Smooth transitions and hover effects
- Responsive design with proper spacing

## Integration with UserTable

The StatusToggle component is designed to work seamlessly with the UserTable component:

```jsx
<UserTable
  users={users}
  onStatusChange={handleStatusChange}
  // ... other props
/>
```

When `onStatusChange` is provided to UserTable, it automatically renders StatusToggle for each user. When not provided, it renders a static status badge.

## Best Practices

1. **Always handle errors**: Wrap API calls in try-catch blocks
2. **Provide user feedback**: Show success/error messages after status changes
3. **Update local state**: Keep UI in sync with backend changes
4. **Validate permissions**: Ensure admin has permission to change status
5. **Log actions**: Include admin user ID in API requests for audit trail
6. **Handle edge cases**: Consider what happens if user is already in target status

## Example with Error Handling

```jsx
const handleStatusChange = async (userId, newStatus, reason) => {
  try {
    // Show loading state
    setLoading(true);
    
    // Call API
    const result = await adminAPI.updateUserStatus(userId, newStatus, reason);
    
    // Update UI
    setUsers(users.map(user => 
      user.id === userId ? { ...user, status: newStatus } : user
    ));
    
    // Show success
    showToast('success', `User status changed to ${newStatus}`);
  } catch (error) {
    // Handle specific error cases
    if (error.statusCode === 403) {
      showToast('error', 'You do not have permission to change user status');
    } else if (error.statusCode === 404) {
      showToast('error', 'User not found');
    } else {
      showToast('error', error.message || 'Failed to update user status');
    }
  } finally {
    setLoading(false);
  }
};
```

## Requirements Satisfied

- **Requirement 5.1**: Display status toggle button for each user
- **Requirement 5.2**: Trigger ConfirmationDialog on toggle
- **Requirement 5.6**: Display visual indicator for active (green) and inactive (red) states
- Also supports suspended status with red indicator

## Related Components

- **ConfirmationDialog**: Used for confirming status changes
- **UserTable**: Integrates StatusToggle for each user row
- **RoleSelector**: Similar pattern for role changes
