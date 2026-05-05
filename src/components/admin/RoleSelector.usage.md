# RoleSelector Component Usage Guide

## Overview

The `RoleSelector` component is a dropdown component for selecting and changing user roles in the admin panel. It provides a visual interface for role management with built-in confirmation dialogs and validation.

## Features

- **Visual Role Indicators**: Color-coded role badges with icons
- **Dropdown Menu**: Accessible dropdown with all available roles
- **Confirmation Dialog**: Requires confirmation and reason for role changes
- **ADMIN Warning**: Special warning message when assigning ADMIN role
- **Validation**: Minimum 10 character reason requirement
- **Accessibility**: Full keyboard navigation and ARIA attributes
- **Disabled State**: Can be disabled to prevent role changes

## Props

| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `currentRole` | `string` | Yes | - | Current user role (`'user'`, `'business'`, or `'admin'`) |
| `userId` | `string` | Yes | - | User ID for the role change |
| `onRoleChange` | `function` | Yes | - | Callback when role is changed: `(userId, newRole, reason) => void` |
| `disabled` | `boolean` | No | `false` | Whether the selector is disabled |

## Basic Usage

```jsx
import RoleSelector from './components/admin/RoleSelector';

function UserManagement() {
  const handleRoleChange = (userId, newRole, reason) => {
    console.log('Changing role:', { userId, newRole, reason });
    // Call API to update user role
  };

  return (
    <RoleSelector
      currentRole="user"
      userId="user-123"
      onRoleChange={handleRoleChange}
    />
  );
}
```

## Integration with UserTable

```jsx
import UserTable from './components/admin/UserTable';
import RoleSelector from './components/admin/RoleSelector';

function UserManagement() {
  const [users, setUsers] = useState([]);

  const handleRoleChange = async (userId, newRole, reason) => {
    try {
      // Call API to update role
      await adminAPI.updateUserRole(userId, newRole, reason);
      
      // Update local state
      setUsers(prev => prev.map(user => 
        user.id === userId ? { ...user, role: newRole } : user
      ));
      
      showToast('success', 'User role updated successfully');
    } catch (error) {
      showToast('error', error.message);
    }
  };

  return (
    <table>
      <tbody>
        {users.map(user => (
          <tr key={user.id}>
            <td>{user.email}</td>
            <td>
              <RoleSelector
                currentRole={user.role}
                userId={user.id}
                onRoleChange={handleRoleChange}
              />
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
```

## Disabled State

```jsx
<RoleSelector
  currentRole="admin"
  userId="user-123"
  onRoleChange={handleRoleChange}
  disabled={true}
/>
```

## Role Options

The component supports three roles:

### USER
- **Icon**: User icon
- **Color**: Green (`#34D399`)
- **Description**: Standard user with basic access

### BUSINESS
- **Icon**: Briefcase icon
- **Color**: Blue (`#60A5FA`)
- **Description**: Business user with API access

### ADMIN
- **Icon**: Shield icon
- **Color**: Red (`#F87171`)
- **Description**: Administrator with full system access
- **Special**: Shows warning message in confirmation dialog

## Confirmation Dialog

When a user selects a different role, a confirmation dialog appears with:

1. **Title**: "Change User Role"
2. **Message**: 
   - For ADMIN role: Warning message about granting full system access
   - For other roles: Standard confirmation with role description
3. **Reason Input**: Required text area with minimum 10 characters
4. **Actions**: Cancel and Change Role buttons

### ADMIN Role Warning

When assigning ADMIN role, the confirmation dialog shows:

```
⚠️ WARNING: You are about to grant ADMIN privileges to this user. 
Admins have full system access including user management, API key 
control, and audit log access. This action should only be performed 
for trusted personnel.

Are you sure you want to change this user's role from USER to ADMIN?
```

## Validation

The component validates:

1. **Reason Required**: User must provide a reason for the role change
2. **Minimum Length**: Reason must be at least 10 characters
3. **Same Role**: Selecting the current role does nothing (no confirmation)

## Accessibility

The component is fully accessible:

- **Keyboard Navigation**: Full keyboard support for dropdown and dialog
- **ARIA Attributes**: Proper `role`, `aria-haspopup`, `aria-expanded`, `aria-selected`
- **Focus Management**: Focus trapped in confirmation dialog
- **Screen Reader**: Descriptive labels and announcements

## Styling

The component uses the existing design system:

- **Colors**: Matches the purple theme (`#B794F6`)
- **Animations**: Smooth transitions and scale effects
- **Responsive**: Works on all screen sizes
- **Dark Theme**: Designed for dark background

## Error Handling

The component handles errors through the parent component's `onRoleChange` callback. The parent should:

1. Call the API to update the role
2. Handle success/error states
3. Show toast notifications
4. Update the UI accordingly

```jsx
const handleRoleChange = async (userId, newRole, reason) => {
  try {
    await adminAPI.updateUserRole(userId, newRole, reason);
    showToast('success', 'Role updated successfully');
    fetchUsers(); // Refresh user list
  } catch (error) {
    showToast('error', error.message || 'Failed to update role');
  }
};
```

## Best Practices

1. **Always provide feedback**: Show toast notifications for success/error
2. **Refresh data**: Update the user list after successful role change
3. **Handle loading states**: Disable the selector during API calls
4. **Validate permissions**: Ensure the current admin has permission to change roles
5. **Audit trail**: The reason is logged for compliance purposes

## Example: Complete Integration

```jsx
import { useState, useEffect } from 'react';
import { useAdminAPI } from '../../hooks/useAdminAPI';
import UserTable from '../../components/admin/UserTable';
import RoleSelector from '../../components/admin/RoleSelector';
import { ToastContainer } from '../../components/admin/ToastNotification';

export default function UserManagement() {
  const [users, setUsers] = useState([]);
  const [toasts, setToasts] = useState([]);
  const [updatingUserId, setUpdatingUserId] = useState(null);
  const adminAPI = useAdminAPI();

  const showToast = (type, message) => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, type, message }]);
  };

  const handleRoleChange = async (userId, newRole, reason) => {
    setUpdatingUserId(userId);
    
    try {
      await adminAPI.updateUserRole(userId, newRole, reason);
      
      // Update local state
      setUsers(prev => prev.map(user => 
        user.id === userId ? { ...user, role: newRole } : user
      ));
      
      showToast('success', `User role updated to ${newRole.toUpperCase()}`);
    } catch (error) {
      showToast('error', error.message || 'Failed to update user role');
    } finally {
      setUpdatingUserId(null);
    }
  };

  return (
    <div>
      <table>
        <thead>
          <tr>
            <th>Email</th>
            <th>Role</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {users.map(user => (
            <tr key={user.id}>
              <td>{user.email}</td>
              <td>
                <RoleSelector
                  currentRole={user.role}
                  userId={user.id}
                  onRoleChange={handleRoleChange}
                  disabled={updatingUserId === user.id}
                />
              </td>
              <td>{user.status}</td>
            </tr>
          ))}
        </tbody>
      </table>
      
      <ToastContainer toasts={toasts} onClose={(id) => 
        setToasts(prev => prev.filter(t => t.id !== id))
      } />
    </div>
  );
}
```

## Requirements Satisfied

- **Requirement 4.1**: Display dropdown with USER, BUSINESS, ADMIN options
- **Requirement 4.2**: Trigger ConfirmationDialog on role selection
- **Requirement 22.3**: Show additional warning for ADMIN role assignment
