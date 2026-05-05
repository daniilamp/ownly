# ToastNotification Component Usage Guide

## Overview

The `ToastNotification` component displays temporary feedback messages for user actions. It supports 4 types (success, error, info, warning), auto-dismisses after a configurable duration, and includes a manual close button.

## Features

- ✅ 4 toast types: success, error, info, warning
- ✅ Auto-dismiss after configurable duration (default: 3000ms)
- ✅ Manual close button
- ✅ Slide-in animation from top-right corner
- ✅ Stack multiple toasts vertically
- ✅ Progress bar showing remaining time
- ✅ Matches Ownly design system

## Basic Usage

### Single Toast

```jsx
import { useState } from 'react';
import ToastNotification from '@/components/admin/ToastNotification';

function MyComponent() {
  const [showToast, setShowToast] = useState(false);

  const handleSuccess = () => {
    setShowToast(true);
  };

  return (
    <>
      <button onClick={handleSuccess}>Show Success</button>
      
      {showToast && (
        <ToastNotification
          type="success"
          message="User role updated successfully"
          duration={3000}
          onClose={() => setShowToast(false)}
        />
      )}
    </>
  );
}
```

### Multiple Toasts with ToastContainer

```jsx
import { useState } from 'react';
import { ToastContainer } from '@/components/admin/ToastNotification';

function MyComponent() {
  const [toasts, setToasts] = useState([]);

  const showToast = (type, message, duration = 3000) => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, type, message, duration }]);
  };

  const removeToast = (id) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  };

  return (
    <>
      <button onClick={() => showToast('success', 'Operation completed!')}>
        Success
      </button>
      <button onClick={() => showToast('error', 'Something went wrong')}>
        Error
      </button>
      <button onClick={() => showToast('warning', 'Please review your input')}>
        Warning
      </button>
      <button onClick={() => showToast('info', 'New update available')}>
        Info
      </button>

      <ToastContainer toasts={toasts} onClose={removeToast} />
    </>
  );
}
```

## Props

### ToastNotification

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `type` | `'success' \| 'error' \| 'info' \| 'warning'` | `'info'` | Toast type determining icon and color |
| `message` | `string` | required | Message to display |
| `duration` | `number` | `3000` | Auto-dismiss duration in milliseconds (0 = no auto-dismiss) |
| `onClose` | `() => void` | required | Callback when toast is closed |
| `index` | `number` | `0` | Stack index for positioning multiple toasts |

### ToastContainer

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `toasts` | `Array<{ id, type, message, duration }>` | `[]` | Array of toast objects |
| `onClose` | `(id) => void` | required | Callback to remove toast by id |

## Toast Types

### Success
- **Icon**: CheckCircle
- **Color**: Green (#34D399)
- **Use case**: Successful operations (role changes, API key revocations, etc.)

```jsx
<ToastNotification
  type="success"
  message="User role updated successfully"
  onClose={handleClose}
/>
```

### Error
- **Icon**: AlertCircle
- **Color**: Red (#F87171)
- **Use case**: Failed operations, validation errors

```jsx
<ToastNotification
  type="error"
  message="Failed to update user role"
  onClose={handleClose}
/>
```

### Warning
- **Icon**: AlertTriangle
- **Color**: Yellow (#FBBF24)
- **Use case**: Warnings, non-critical issues

```jsx
<ToastNotification
  type="warning"
  message="This action cannot be undone"
  onClose={handleClose}
/>
```

### Info
- **Icon**: Info
- **Color**: Blue (#60A5FA)
- **Use case**: General information, tips

```jsx
<ToastNotification
  type="info"
  message="New features available in settings"
  onClose={handleClose}
/>
```

## Advanced Usage

### Custom Duration

```jsx
// No auto-dismiss (duration = 0)
<ToastNotification
  type="info"
  message="This toast stays until manually closed"
  duration={0}
  onClose={handleClose}
/>

// Quick dismiss (1 second)
<ToastNotification
  type="success"
  message="Saved!"
  duration={1000}
  onClose={handleClose}
/>

// Long duration (10 seconds)
<ToastNotification
  type="warning"
  message="Please review this important message"
  duration={10000}
  onClose={handleClose}
/>
```

### Integration with API Calls

```jsx
import { useState } from 'react';
import { ToastContainer } from '@/components/admin/ToastNotification';
import { useAdminAPI } from '@/hooks/useAdminAPI';

function UserManagement() {
  const [toasts, setToasts] = useState([]);
  const { updateUserRole } = useAdminAPI();

  const showToast = (type, message, duration = 3000) => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, type, message, duration }]);
  };

  const removeToast = (id) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  };

  const handleRoleChange = async (userId, newRole, reason) => {
    try {
      await updateUserRole(userId, newRole, reason);
      showToast('success', 'User role updated successfully');
    } catch (error) {
      showToast('error', error.message || 'Failed to update user role');
    }
  };

  return (
    <>
      {/* Your component content */}
      <ToastContainer toasts={toasts} onClose={removeToast} />
    </>
  );
}
```

### Custom Hook for Toast Management

```jsx
// hooks/useToast.js
import { useState } from 'react';

export function useToast() {
  const [toasts, setToasts] = useState([]);

  const showToast = (type, message, duration = 3000) => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, type, message, duration }]);
  };

  const removeToast = (id) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  };

  const showSuccess = (message, duration) => showToast('success', message, duration);
  const showError = (message, duration) => showToast('error', message, duration);
  const showWarning = (message, duration) => showToast('warning', message, duration);
  const showInfo = (message, duration) => showToast('info', message, duration);

  return {
    toasts,
    showToast,
    removeToast,
    showSuccess,
    showError,
    showWarning,
    showInfo,
  };
}

// Usage in component
import { useToast } from '@/hooks/useToast';
import { ToastContainer } from '@/components/admin/ToastNotification';

function MyComponent() {
  const { toasts, removeToast, showSuccess, showError } = useToast();

  const handleAction = async () => {
    try {
      await someApiCall();
      showSuccess('Operation completed!');
    } catch (error) {
      showError('Operation failed');
    }
  };

  return (
    <>
      <button onClick={handleAction}>Perform Action</button>
      <ToastContainer toasts={toasts} onClose={removeToast} />
    </>
  );
}
```

## Styling

The component uses the Ownly design system:
- Background: Gradient with blur effect
- Border: Type-specific color with transparency
- Animation: Slide-in from right with fade
- Progress bar: Shows remaining time until auto-dismiss

## Accessibility

- Uses `role="alert"` for screen reader announcements
- Uses `aria-live="polite"` for non-intrusive announcements
- Close button has `aria-label="Close notification"`
- Keyboard accessible (can be closed with Tab + Enter)

## Best Practices

1. **Keep messages concise**: Aim for 1-2 sentences
2. **Use appropriate types**: Match the toast type to the action result
3. **Set reasonable durations**: 
   - Success: 3 seconds (default)
   - Error: 5-7 seconds (users need time to read)
   - Warning: 5-7 seconds
   - Info: 3-5 seconds
4. **Limit simultaneous toasts**: Avoid showing more than 3-4 toasts at once
5. **Provide context**: Include enough information for users to understand what happened

## Examples

### User Management
```jsx
// Success
showToast('success', 'User role updated to ADMIN');

// Error
showToast('error', 'Failed to update user role: Insufficient permissions');

// Warning
showToast('warning', 'User account will be deactivated in 24 hours');
```

### API Key Management
```jsx
// Success
showToast('success', 'API key revoked successfully');

// Error
showToast('error', 'Failed to revoke API key: Key not found');
```

### Audit Logs
```jsx
// Info
showToast('info', 'Logs exported to audit-logs-2024-01-15.csv');

// Warning
showToast('warning', 'Export may take a few minutes for large datasets');
```

## Requirements Mapping

- **Requirement 21.1**: Error toast notifications for failed API requests
- **Requirement 21.2**: Success toast notifications for successful actions
- **Requirement 21.6**: Auto-dismiss success notifications after 3 seconds
