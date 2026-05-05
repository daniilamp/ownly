/**
 * ConfirmationDialog Demo Component
 * Visual demonstration of the ConfirmationDialog component with different configurations
 * 
 * This file is for development/testing purposes only
 */

import { useState } from 'react';
import ConfirmationDialog from './ConfirmationDialog';

export default function ConfirmationDialogDemo() {
  const [activeDialog, setActiveDialog] = useState(null);

  const demos = [
    {
      id: 'simple',
      label: 'Simple Confirmation',
      config: {
        title: 'Delete Item',
        message: 'Are you sure you want to delete this item? This action cannot be undone.',
        confirmLabel: 'Delete',
        danger: true,
        requireReason: false,
      },
    },
    {
      id: 'withReason',
      label: 'With Required Reason',
      config: {
        title: 'Change User Role',
        message: 'You are about to promote this user to ADMIN. This grants full system access.',
        confirmLabel: 'Change Role',
        danger: true,
        requireReason: true,
        minReasonLength: 10,
      },
    },
    {
      id: 'nonDanger',
      label: 'Non-Destructive Action',
      config: {
        title: 'Export Data',
        message: 'This will export all user data to a CSV file. Continue?',
        confirmLabel: 'Export',
        danger: false,
        requireReason: false,
      },
    },
    {
      id: 'longReason',
      label: 'Long Reason Required',
      config: {
        title: 'Revoke API Key',
        message: 'This will immediately invalidate the API key. All requests using this key will be rejected.',
        confirmLabel: 'Revoke Key',
        danger: true,
        requireReason: true,
        minReasonLength: 20,
      },
    },
  ];

  const handleConfirm = (reason) => {
    console.log('Confirmed!', reason ? `Reason: ${reason}` : 'No reason required');
    alert(`Action confirmed!${reason ? `\nReason: ${reason}` : ''}`);
    setActiveDialog(null);
  };

  const handleCancel = () => {
    console.log('Cancelled');
    setActiveDialog(null);
  };

  return (
    <div className="min-h-screen p-8" style={{ background: '#070510' }}>
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-2" style={{ color: '#F0EAFF' }}>
          ConfirmationDialog Demo
        </h1>
        <p className="mb-8 text-sm" style={{ color: 'rgba(240,234,255,0.6)' }}>
          Click the buttons below to see different configurations of the ConfirmationDialog component.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {demos.map((demo) => (
            <button
              key={demo.id}
              onClick={() => setActiveDialog(demo.id)}
              className="p-6 rounded-xl text-left transition-all hover:scale-105"
              style={{
                background: 'rgba(183,148,246,0.08)',
                border: '1px solid rgba(183,148,246,0.2)',
              }}
            >
              <h3 className="font-bold text-lg mb-2" style={{ color: '#F0EAFF' }}>
                {demo.label}
              </h3>
              <div className="space-y-1 text-xs" style={{ color: 'rgba(240,234,255,0.5)' }}>
                <p>Danger: {demo.config.danger ? 'Yes' : 'No'}</p>
                <p>Reason Required: {demo.config.requireReason ? 'Yes' : 'No'}</p>
                {demo.config.requireReason && (
                  <p>Min Length: {demo.config.minReasonLength} chars</p>
                )}
              </div>
            </button>
          ))}
        </div>

        {/* Keyboard shortcuts info */}
        <div
          className="mt-8 p-6 rounded-xl"
          style={{
            background: 'rgba(183,148,246,0.04)',
            border: '1px solid rgba(183,148,246,0.15)',
          }}
        >
          <h3 className="font-bold mb-3" style={{ color: '#F0EAFF' }}>
            Keyboard Shortcuts
          </h3>
          <div className="space-y-2 text-sm" style={{ color: 'rgba(240,234,255,0.6)' }}>
            <p>
              <kbd
                className="px-2 py-1 rounded text-xs font-mono"
                style={{ background: 'rgba(183,148,246,0.15)', color: '#B794F6' }}
              >
                Esc
              </kbd>{' '}
              - Cancel and close dialog
            </p>
            <p>
              <kbd
                className="px-2 py-1 rounded text-xs font-mono"
                style={{ background: 'rgba(183,148,246,0.15)', color: '#B794F6' }}
              >
                Enter
              </kbd>{' '}
              - Confirm (only when reason is not required)
            </p>
            <p>
              <kbd
                className="px-2 py-1 rounded text-xs font-mono"
                style={{ background: 'rgba(183,148,246,0.15)', color: '#B794F6' }}
              >
                Tab
              </kbd>{' '}
              - Navigate between elements (focus is trapped within dialog)
            </p>
          </div>
        </div>

        {/* Features list */}
        <div
          className="mt-4 p-6 rounded-xl"
          style={{
            background: 'rgba(183,148,246,0.04)',
            border: '1px solid rgba(183,148,246,0.15)',
          }}
        >
          <h3 className="font-bold mb-3" style={{ color: '#F0EAFF' }}>
            Features
          </h3>
          <ul className="space-y-2 text-sm" style={{ color: 'rgba(240,234,255,0.6)' }}>
            <li>✅ Modal overlay with backdrop blur</li>
            <li>✅ Optional reason text input with validation</li>
            <li>✅ Danger styling for destructive actions</li>
            <li>✅ Keyboard shortcuts (Enter/Escape)</li>
            <li>✅ Minimum reason length validation</li>
            <li>✅ Character count display</li>
            <li>✅ Focus management and accessibility</li>
            <li>✅ Error messages with ARIA announcements</li>
          </ul>
        </div>
      </div>

      {/* Render active dialog */}
      {demos.map((demo) => (
        <ConfirmationDialog
          key={demo.id}
          isOpen={activeDialog === demo.id}
          {...demo.config}
          onConfirm={handleConfirm}
          onCancel={handleCancel}
        />
      ))}
    </div>
  );
}
