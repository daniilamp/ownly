# ConfirmationDialog Component Usage Guide

## Overview

The `ConfirmationDialog` component is a modal dialog used to confirm destructive or important actions in the admin panel. It provides a consistent user experience for actions that require user confirmation, with optional reason input and validation.

## Features

- ✅ Modal overlay with backdrop blur
- ✅ Optional reason text input with validation
- ✅ Danger styling for destructive actions
- ✅ Keyboard shortcuts (Enter to confirm, Escape to cancel)
- ✅ Minimum reason length validation
- ✅ Focus management and accessibility
- ✅ Character count display
- ✅ Responsive design

## Basic Usage

### Simple Confirmation (No Reason Required)

```jsx
import { useState } from 'react';
import ConfirmationDialog from '@/components/admin/ConfirmationDialog';

function MyComponent() {
  const [showDialog, setShowDialog] = useState(false);

  const handleDelete = () => {
    // Perform delete action
    console.log('Item deleted');
    setShowDialog(false);
  };

  return (
    <>
      <button onClick={() => setShowDialog(true)}>
        Delete Item
      </button>

      <ConfirmationDialog
        isOpen={showDialog}
        title="Delete Item"
        message="Are you sure you want to delete this item? This action cannot be undone."
        confirmLabel="Delete"
        danger={true}
        onConfirm={handleDelete}
        onCancel={() => setShowDialog(false)}
      />
    </>
  );
}
```

### Confirmation with Required Reason

```jsx
import { useState } from 'react';
import ConfirmationDialog from '@/components/admin/ConfirmationDialog';

function UserManagement() {
  const [showRoleDialog, setShowRoleDialog] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);

  const handleRoleChange = (reason) => {
    // Perform role change with reason
    console.log('Changing role for user:', selectedUser.id);
    console.log('Reason:', reason);
    
    // API call here...
    
    setShowRoleDialog(false);
  };

  return (
    <>
      <button onClick={() => {
        setSelectedUser({ id: '123', email: 'user@example.com' });
        setShowRoleDialog(true);
      }}>
        Change Role to Admin
      </button>

      <ConfirmationDialog
        isOpen={showRoleDialog}
        title="Change User Role"
        message={`You are about to change the role of ${selectedUser?.email} to ADMIN. This will grant them full administrative privileges.`}
        requireReason={true}
        minReasonLength={10}
        confirmLabel="Change Role"
        danger={true}
        onConfirm={handleRoleChange}
        onCancel={() => setShowRoleDialog(false)}
      />
    </>
  );
}
```

### Non-Destructive Confirmation

```jsx
<ConfirmationDialog
  isOpen={showDialog}
  title="Export Data"
  message="This will export all user data to a CSV file. Continue?"
  confirmLabel="Export"
  danger={false}  // Non-destructive action
  onConfirm={handleExport}
  onCancel={() => setShowDialog(false)}
/>
```

## Props

| Prop | Type | Default | Required | Description |
|------|------|---------|----------|-------------|
| `isOpen` | `boolean` | - | ✅ | Whether the dialog is visible |
| `title` | `string` | - | ✅ | Dialog title |
| `message` | `string` | - | ✅ | Dialog message/description |
| `onConfirm` | `(reason?: string) => void` | - | ✅ | Callback when confirmed. Receives reason if `requireReason` is true |
| `onCancel` | `() => void` | - | ✅ | Callback when cancelled |
| `requireReason` | `boolean` | `false` | ❌ | Whether reason input is required |
| `minReasonLength` | `number` | `10` | ❌ | Minimum length for reason text |
| `confirmLabel` | `string` | `'Confirm'` | ❌ | Label for confirm button |
| `danger` | `boolean` | `true` | ❌ | Whether to use danger styling (red) |

## Common Use Cases

### 1. User Role Change

```jsx
<ConfirmationDialog
  isOpen={showDialog}
  title="Change User Role"
  message="You are about to promote this user to ADMIN. This grants full system access."
  requireReason={true}
  minReasonLength={10}
  confirmLabel="Change Role"
  danger={true}
  onConfirm={(reason) => updateUserRole(userId, 'admin', reason)}
  onCancel={() => setShowDialog(false)}
/>
```

### 2. User Deactivation

```jsx
<ConfirmationDialog
  isOpen={showDialog}
  title="Deactivate User"
  message="This will prevent the user from accessing the system. They can be reactivated later."
  requireReason={true}
  minReasonLength={10}
  confirmLabel="Deactivate"
  danger={true}
  onConfirm={(reason) => deactivateUser(userId, reason)}
  onCancel={() => setShowDialog(false)}
/>
```

### 3. API Key Revocation

```jsx
<ConfirmationDialog
  isOpen={showDialog}
  title="Revoke API Key"
  message="This will immediately invalidate the API key. All requests using this key will be rejected."
  requireReason={true}
  minReasonLength={10}
  confirmLabel="Revoke Key"
  danger={true}
  onConfirm={(reason) => revokeAPIKey(keyId, reason)}
  onCancel={() => setShowDialog(false)}
/>
```

### 4. Bulk Action Confirmation

```jsx
<ConfirmationDialog
  isOpen={showDialog}
  title="Delete Multiple Items"
  message={`You are about to delete ${selectedItems.length} items. This action cannot be undone.`}
  confirmLabel="Delete All"
  danger={true}
  onConfirm={() => deleteMultipleItems(selectedItems)}
  onCancel={() => setShowDialog(false)}
/>
```

## Keyboard Shortcuts

- **Escape**: Cancel and close the dialog
- **Enter**: Confirm (only when reason is not required)
- **Tab**: Navigate between focusable elements within the dialog

## Validation

When `requireReason` is true:

1. **Empty Reason**: Shows "Reason is required" error
2. **Too Short**: Shows "Reason must be at least X characters" error
3. **Valid**: Calls `onConfirm` with trimmed reason text

The validation is triggered when the user clicks the Confirm button.

## Accessibility

The component follows accessibility best practices:

- ✅ Proper ARIA attributes (`role="dialog"`, `aria-modal`, `aria-labelledby`, `aria-describedby`)
- ✅ Focus trap within the dialog
- ✅ Focus management (auto-focus reason input when required)
- ✅ Keyboard navigation support
- ✅ Error announcements with `role="alert"`
- ✅ Proper label associations for form inputs
- ✅ Invalid state indication for textarea

## Styling

The component uses the Ownly design system with:

- Dark background with purple accents
- Danger mode: Red tones for destructive actions
- Non-danger mode: Purple gradient for normal actions
- Backdrop blur effect
- Scale-in animation on open

## Best Practices

1. **Always require reason for destructive actions**: Set `requireReason={true}` for role changes, deactivations, and revocations
2. **Use appropriate minimum length**: Default is 10 characters, adjust based on context
3. **Clear and specific messages**: Explain what will happen and any consequences
4. **Descriptive confirm labels**: Use action-specific labels like "Delete", "Revoke", "Change Role" instead of generic "OK"
5. **Danger styling for destructive actions**: Set `danger={true}` for actions that cannot be easily undone
6. **Reset state on close**: Clear any local state when the dialog closes

## Example: Complete Integration

```jsx
import { useState } from 'react';
import ConfirmationDialog from '@/components/admin/ConfirmationDialog';
import { useAdminAPI } from '@/hooks/useAdminAPI';

function UserManagement() {
  const [confirmDialog, setConfirmDialog] = useState({
    isOpen: false,
    type: null,
    user: null,
  });
  const { updateUserRole, updateUserStatus } = useAdminAPI();

  const openRoleChangeDialog = (user) => {
    setConfirmDialog({
      isOpen: true,
      type: 'roleChange',
      user,
    });
  };

  const openDeactivateDialog = (user) => {
    setConfirmDialog({
      isOpen: true,
      type: 'deactivate',
      user,
    });
  };

  const handleConfirm = async (reason) => {
    try {
      if (confirmDialog.type === 'roleChange') {
        await updateUserRole(confirmDialog.user.id, 'admin', reason);
        // Show success toast
      } else if (confirmDialog.type === 'deactivate') {
        await updateUserStatus(confirmDialog.user.id, 'inactive', reason);
        // Show success toast
      }
    } catch (error) {
      // Show error toast
      console.error('Action failed:', error);
    } finally {
      setConfirmDialog({ isOpen: false, type: null, user: null });
    }
  };

  const handleCancel = () => {
    setConfirmDialog({ isOpen: false, type: null, user: null });
  };

  const getDialogConfig = () => {
    if (confirmDialog.type === 'roleChange') {
      return {
        title: 'Change User Role',
        message: `You are about to promote ${confirmDialog.user?.email} to ADMIN. This grants full system access.`,
        confirmLabel: 'Change Role',
        requireReason: true,
      };
    } else if (confirmDialog.type === 'deactivate') {
      return {
        title: 'Deactivate User',
        message: `This will prevent ${confirmDialog.user?.email} from accessing the system.`,
        confirmLabel: 'Deactivate',
        requireReason: true,
      };
    }
    return {};
  };

  const dialogConfig = getDialogConfig();

  return (
    <>
      {/* Your user management UI */}
      
      <ConfirmationDialog
        isOpen={confirmDialog.isOpen}
        {...dialogConfig}
        danger={true}
        onConfirm={handleConfirm}
        onCancel={handleCancel}
      />
    </>
  );
}
```

## Related Components

- `FilterPanel`: For filtering data tables
- `ToastNotification`: For displaying success/error feedback after confirmation
- `AdminLayout`: The layout wrapper for admin pages

## Requirements Satisfied

This component satisfies the following requirements:
- 4.2, 4.6: User role management with confirmation
- 5.2, 5.4: User status management with confirmation
- 9.2, 9.3: API key revocation with confirmation
- 22.1, 22.2, 22.3, 22.4, 22.5, 22.6: Confirmation dialogs for destructive actions
