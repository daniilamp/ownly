/**
 * RoleSelector Component Demo
 * Interactive demonstration of the RoleSelector component
 */

import { useState } from 'react';
import RoleSelector from './RoleSelector';
import { ToastContainer } from './ToastNotification';

export default function RoleSelectorDemo() {
  const [users, setUsers] = useState([
    { id: '1', email: 'john.doe@example.com', role: 'user' },
    { id: '2', email: 'jane.smith@example.com', role: 'business' },
    { id: '3', email: 'admin@example.com', role: 'admin' },
  ]);
  const [toasts, setToasts] = useState([]);
  const [updatingUserId, setUpdatingUserId] = useState(null);

  const showToast = (type, message, duration = 3000) => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, type, message, duration }]);
  };

  const removeToast = (id) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  };

  const handleRoleChange = (userId, newRole, reason) => {
    setUpdatingUserId(userId);

    // Simulate API call
    setTimeout(() => {
      // Update user role
      setUsers(prev => prev.map(user => 
        user.id === userId ? { ...user, role: newRole } : user
      ));

      showToast('success', `Role updated to ${newRole.toUpperCase()}`);
      setUpdatingUserId(null);

      console.log('Role change:', { userId, newRole, reason });
    }, 1000);
  };

  return (
    <div className="min-h-screen p-8" style={{ background: '#070510' }}>
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2" style={{ color: '#F0EAFF' }}>
            RoleSelector Component Demo
          </h1>
          <p className="text-sm" style={{ color: 'rgba(240,234,255,0.6)' }}>
            Interactive demonstration of role selection with confirmation dialogs
          </p>
        </div>

        {/* Demo Table */}
        <div
          className="rounded-xl overflow-hidden"
          style={{
            background: 'rgba(183,148,246,0.04)',
            border: '1px solid rgba(183,148,246,0.15)',
          }}
        >
          <div className="px-6 py-4 border-b" style={{ borderColor: 'rgba(183,148,246,0.15)' }}>
            <h2 className="text-lg font-bold" style={{ color: '#F0EAFF' }}>
              User Management
            </h2>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr style={{ background: 'rgba(183,148,246,0.06)' }}>
                  <th className="px-6 py-3 text-left text-xs font-bold uppercase tracking-wider" style={{ color: 'rgba(240,234,255,0.7)' }}>
                    Email
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-bold uppercase tracking-wider" style={{ color: 'rgba(240,234,255,0.7)' }}>
                    Role
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-bold uppercase tracking-wider" style={{ color: 'rgba(240,234,255,0.7)' }}>
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {users.map((user, index) => (
                  <tr
                    key={user.id}
                    className="border-t"
                    style={{
                      borderColor: 'rgba(183,148,246,0.1)',
                      background: index % 2 === 0 ? 'transparent' : 'rgba(183,148,246,0.02)',
                    }}
                  >
                    <td className="px-6 py-4 text-sm" style={{ color: '#F0EAFF' }}>
                      {user.email}
                    </td>
                    <td className="px-6 py-4">
                      <RoleSelector
                        currentRole={user.role}
                        userId={user.id}
                        onRoleChange={handleRoleChange}
                        disabled={updatingUserId === user.id}
                      />
                    </td>
                    <td className="px-6 py-4">
                      {updatingUserId === user.id && (
                        <span className="text-xs" style={{ color: 'rgba(240,234,255,0.6)' }}>
                          Updating...
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Instructions */}
        <div
          className="mt-6 p-6 rounded-xl"
          style={{
            background: 'rgba(183,148,246,0.04)',
            border: '1px solid rgba(183,148,246,0.15)',
          }}
        >
          <h3 className="text-lg font-bold mb-3" style={{ color: '#F0EAFF' }}>
            Instructions
          </h3>
          <ul className="space-y-2 text-sm" style={{ color: 'rgba(240,234,255,0.7)' }}>
            <li>• Click on any role badge to open the dropdown menu</li>
            <li>• Select a different role to trigger the confirmation dialog</li>
            <li>• Enter a reason (minimum 10 characters) for the role change</li>
            <li>• Try assigning ADMIN role to see the special warning message</li>
            <li>• Selecting the same role does nothing (no confirmation)</li>
            <li>• The component is disabled during the update process</li>
          </ul>
        </div>

        {/* Features */}
        <div
          className="mt-6 p-6 rounded-xl"
          style={{
            background: 'rgba(183,148,246,0.04)',
            border: '1px solid rgba(183,148,246,0.15)',
          }}
        >
          <h3 className="text-lg font-bold mb-3" style={{ color: '#F0EAFF' }}>
            Features
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h4 className="text-sm font-bold mb-2" style={{ color: '#B794F6' }}>
                Visual Indicators
              </h4>
              <ul className="space-y-1 text-sm" style={{ color: 'rgba(240,234,255,0.6)' }}>
                <li>• Color-coded role badges</li>
                <li>• Role-specific icons</li>
                <li>• Current role highlighting</li>
              </ul>
            </div>
            <div>
              <h4 className="text-sm font-bold mb-2" style={{ color: '#B794F6' }}>
                Confirmation Dialog
              </h4>
              <ul className="space-y-1 text-sm" style={{ color: 'rgba(240,234,255,0.6)' }}>
                <li>• Required reason input</li>
                <li>• Minimum length validation</li>
                <li>• ADMIN role warning</li>
              </ul>
            </div>
            <div>
              <h4 className="text-sm font-bold mb-2" style={{ color: '#B794F6' }}>
                Accessibility
              </h4>
              <ul className="space-y-1 text-sm" style={{ color: 'rgba(240,234,255,0.6)' }}>
                <li>• Keyboard navigation</li>
                <li>• ARIA attributes</li>
                <li>• Focus management</li>
              </ul>
            </div>
            <div>
              <h4 className="text-sm font-bold mb-2" style={{ color: '#B794F6' }}>
                User Experience
              </h4>
              <ul className="space-y-1 text-sm" style={{ color: 'rgba(240,234,255,0.6)' }}>
                <li>• Smooth animations</li>
                <li>• Loading states</li>
                <li>• Toast notifications</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Toast Notifications */}
      <ToastContainer toasts={toasts} onClose={removeToast} />
    </div>
  );
}
