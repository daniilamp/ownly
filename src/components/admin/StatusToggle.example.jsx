/**
 * StatusToggle Component Example
 * 
 * This file demonstrates the StatusToggle component in action.
 * It can be used for visual testing and documentation purposes.
 */

import { useState } from 'react';
import StatusToggle from './StatusToggle';

export default function StatusToggleExample() {
  const [users, setUsers] = useState([
    { id: 'user-1', email: 'john@example.com', status: 'active' },
    { id: 'user-2', email: 'jane@example.com', status: 'inactive' },
    { id: 'user-3', email: 'bob@example.com', status: 'suspended' },
  ]);

  const [logs, setLogs] = useState([]);

  const handleStatusChange = (userId, newStatus, reason) => {
    // Update user status
    setUsers(users.map(user => 
      user.id === userId ? { ...user, status: newStatus } : user
    ));

    // Log the change
    const user = users.find(u => u.id === userId);
    const logEntry = {
      timestamp: new Date().toLocaleTimeString(),
      userId,
      email: user.email,
      newStatus,
      reason: reason || 'N/A',
    };
    setLogs([logEntry, ...logs]);
  };

  return (
    <div className="min-h-screen p-8" style={{ background: '#070510' }}>
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2" style={{ color: '#F0EAFF' }}>
            StatusToggle Component Example
          </h1>
          <p className="text-sm" style={{ color: 'rgba(240,234,255,0.6)' }}>
            Interactive demonstration of the StatusToggle component
          </p>
        </div>

        {/* User Table */}
        <div
          className="rounded-xl overflow-hidden mb-8"
          style={{
            background: 'rgba(183,148,246,0.04)',
            border: '1px solid rgba(183,148,246,0.15)',
          }}
        >
          <div className="px-6 py-4 border-b" style={{ borderColor: 'rgba(183,148,246,0.15)' }}>
            <h2 className="text-lg font-bold" style={{ color: '#F0EAFF' }}>
              Users
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr style={{ background: 'rgba(183,148,246,0.06)' }}>
                  <th className="px-6 py-3 text-left text-xs font-bold uppercase" style={{ color: 'rgba(240,234,255,0.7)' }}>
                    Email
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-bold uppercase" style={{ color: 'rgba(240,234,255,0.7)' }}>
                    Status
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
                      <StatusToggle
                        currentStatus={user.status}
                        userId={user.id}
                        onStatusChange={handleStatusChange}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Status Legend */}
        <div
          className="rounded-xl p-6 mb-8"
          style={{
            background: 'rgba(183,148,246,0.04)',
            border: '1px solid rgba(183,148,246,0.15)',
          }}
        >
          <h3 className="text-sm font-bold mb-4 uppercase" style={{ color: 'rgba(240,234,255,0.7)' }}>
            Status Legend
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center gap-3">
              <div
                className="w-3 h-3 rounded-full"
                style={{ background: '#34D399' }}
              />
              <div>
                <p className="text-sm font-semibold" style={{ color: '#34D399' }}>
                  Active
                </p>
                <p className="text-xs" style={{ color: 'rgba(240,234,255,0.5)' }}>
                  User has full access
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div
                className="w-3 h-3 rounded-full"
                style={{ background: '#9CA3AF' }}
              />
              <div>
                <p className="text-sm font-semibold" style={{ color: '#9CA3AF' }}>
                  Inactive
                </p>
                <p className="text-xs" style={{ color: 'rgba(240,234,255,0.5)' }}>
                  Account is deactivated
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div
                className="w-3 h-3 rounded-full"
                style={{ background: '#F87171' }}
              />
              <div>
                <p className="text-sm font-semibold" style={{ color: '#F87171' }}>
                  Suspended
                </p>
                <p className="text-xs" style={{ color: 'rgba(240,234,255,0.5)' }}>
                  Temporarily suspended
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Activity Log */}
        <div
          className="rounded-xl overflow-hidden"
          style={{
            background: 'rgba(183,148,246,0.04)',
            border: '1px solid rgba(183,148,246,0.15)',
          }}
        >
          <div className="px-6 py-4 border-b" style={{ borderColor: 'rgba(183,148,246,0.15)' }}>
            <h2 className="text-lg font-bold" style={{ color: '#F0EAFF' }}>
              Activity Log
            </h2>
          </div>
          <div className="p-6">
            {logs.length === 0 ? (
              <p className="text-sm text-center py-8" style={{ color: 'rgba(240,234,255,0.5)' }}>
                No status changes yet. Try changing a user's status above.
              </p>
            ) : (
              <div className="space-y-3">
                {logs.map((log, index) => (
                  <div
                    key={index}
                    className="p-4 rounded-lg"
                    style={{
                      background: 'rgba(183,148,246,0.06)',
                      border: '1px solid rgba(183,148,246,0.1)',
                    }}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <p className="text-sm font-semibold" style={{ color: '#F0EAFF' }}>
                        {log.email}
                      </p>
                      <span className="text-xs" style={{ color: 'rgba(240,234,255,0.5)' }}>
                        {log.timestamp}
                      </span>
                    </div>
                    <p className="text-sm mb-1" style={{ color: 'rgba(240,234,255,0.7)' }}>
                      Status changed to:{' '}
                      <span
                        className="font-bold"
                        style={{
                          color: log.newStatus === 'active' ? '#34D399' : log.newStatus === 'suspended' ? '#F87171' : '#9CA3AF',
                        }}
                      >
                        {log.newStatus}
                      </span>
                    </p>
                    {log.reason !== 'N/A' && (
                      <p className="text-xs" style={{ color: 'rgba(240,234,255,0.5)' }}>
                        Reason: {log.reason}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Instructions */}
        <div className="mt-8 p-6 rounded-xl" style={{ background: 'rgba(183,148,246,0.04)', border: '1px solid rgba(183,148,246,0.15)' }}>
          <h3 className="text-sm font-bold mb-3 uppercase" style={{ color: 'rgba(240,234,255,0.7)' }}>
            Instructions
          </h3>
          <ul className="space-y-2 text-sm" style={{ color: 'rgba(240,234,255,0.6)' }}>
            <li>• Click on any status badge to open the status selector</li>
            <li>• Select a different status from the dropdown</li>
            <li>• For deactivation or suspension, you'll need to provide a reason (minimum 10 characters)</li>
            <li>• For activation, no reason is required</li>
            <li>• Confirm the change in the dialog</li>
            <li>• The activity log below will show all status changes</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
