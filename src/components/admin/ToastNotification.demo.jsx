/**
 * ToastNotification Demo
 * Interactive demo showcasing all toast notification features
 */

import { useState } from 'react';
import { ToastContainer } from './ToastNotification';
import { CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react';

export default function ToastNotificationDemo() {
  const [toasts, setToasts] = useState([]);

  const showToast = (type, message, duration = 3000) => {
    const id = Date.now() + Math.random(); // Ensure unique IDs
    setToasts(prev => [...prev, { id, type, message, duration }]);
  };

  const removeToast = (id) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  };

  const demoMessages = {
    success: [
      'User role updated successfully',
      'API key revoked successfully',
      'Changes saved',
      'Operation completed!',
    ],
    error: [
      'Failed to update user role',
      'Network connection error',
      'Invalid credentials',
      'Something went wrong',
    ],
    warning: [
      'This action cannot be undone',
      'User account will be deactivated in 24 hours',
      'Please review your input',
      'Session will expire soon',
    ],
    info: [
      'New features available in settings',
      'Logs exported successfully',
      'System maintenance scheduled',
      'Update available',
    ],
  };

  const getRandomMessage = (type) => {
    const messages = demoMessages[type];
    return messages[Math.floor(Math.random() * messages.length)];
  };

  return (
    <div className="min-h-screen p-8" style={{ background: '#070510' }}>
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2" style={{ color: '#F0EAFF' }}>
            ToastNotification Demo
          </h1>
          <p className="text-sm" style={{ color: 'rgba(240,234,255,0.6)' }}>
            Interactive demo showcasing all toast notification features
          </p>
        </div>

        {/* Demo Controls */}
        <div
          className="rounded-xl p-6 mb-8"
          style={{
            background: 'rgba(183,148,246,0.04)',
            border: '1px solid rgba(183,148,246,0.15)',
          }}
        >
          <h2 className="text-xl font-bold mb-4" style={{ color: '#F0EAFF' }}>
            Toast Types
          </h2>
          <p className="text-sm mb-6" style={{ color: 'rgba(240,234,255,0.6)' }}>
            Click a button to show a toast notification
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Success */}
            <button
              onClick={() => showToast('success', getRandomMessage('success'))}
              className="flex items-center gap-3 p-4 rounded-xl transition-all hover:scale-105"
              style={{
                background: 'rgba(52,211,153,0.12)',
                border: '1px solid rgba(52,211,153,0.3)',
              }}
            >
              <CheckCircle className="w-6 h-6" style={{ color: '#34D399' }} />
              <div className="text-left">
                <div className="font-semibold" style={{ color: '#34D399' }}>
                  Success Toast
                </div>
                <div className="text-xs" style={{ color: 'rgba(240,234,255,0.6)' }}>
                  For successful operations
                </div>
              </div>
            </button>

            {/* Error */}
            <button
              onClick={() => showToast('error', getRandomMessage('error'))}
              className="flex items-center gap-3 p-4 rounded-xl transition-all hover:scale-105"
              style={{
                background: 'rgba(248,113,113,0.12)',
                border: '1px solid rgba(248,113,113,0.3)',
              }}
            >
              <AlertCircle className="w-6 h-6" style={{ color: '#F87171' }} />
              <div className="text-left">
                <div className="font-semibold" style={{ color: '#F87171' }}>
                  Error Toast
                </div>
                <div className="text-xs" style={{ color: 'rgba(240,234,255,0.6)' }}>
                  For failed operations
                </div>
              </div>
            </button>

            {/* Warning */}
            <button
              onClick={() => showToast('warning', getRandomMessage('warning'))}
              className="flex items-center gap-3 p-4 rounded-xl transition-all hover:scale-105"
              style={{
                background: 'rgba(251,191,36,0.12)',
                border: '1px solid rgba(251,191,36,0.3)',
              }}
            >
              <AlertTriangle className="w-6 h-6" style={{ color: '#FBBF24' }} />
              <div className="text-left">
                <div className="font-semibold" style={{ color: '#FBBF24' }}>
                  Warning Toast
                </div>
                <div className="text-xs" style={{ color: 'rgba(240,234,255,0.6)' }}>
                  For warnings
                </div>
              </div>
            </button>

            {/* Info */}
            <button
              onClick={() => showToast('info', getRandomMessage('info'))}
              className="flex items-center gap-3 p-4 rounded-xl transition-all hover:scale-105"
              style={{
                background: 'rgba(96,165,250,0.12)',
                border: '1px solid rgba(96,165,250,0.3)',
              }}
            >
              <Info className="w-6 h-6" style={{ color: '#60A5FA' }} />
              <div className="text-left">
                <div className="font-semibold" style={{ color: '#60A5FA' }}>
                  Info Toast
                </div>
                <div className="text-xs" style={{ color: 'rgba(240,234,255,0.6)' }}>
                  For general information
                </div>
              </div>
            </button>
          </div>
        </div>

        {/* Duration Controls */}
        <div
          className="rounded-xl p-6 mb-8"
          style={{
            background: 'rgba(183,148,246,0.04)',
            border: '1px solid rgba(183,148,246,0.15)',
          }}
        >
          <h2 className="text-xl font-bold mb-4" style={{ color: '#F0EAFF' }}>
            Custom Durations
          </h2>
          <p className="text-sm mb-6" style={{ color: 'rgba(240,234,255,0.6)' }}>
            Test different auto-dismiss durations
          </p>

          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => showToast('success', 'Quick dismiss (1 second)', 1000)}
              className="px-4 py-2 rounded-lg font-semibold text-sm transition-all hover:scale-105"
              style={{
                background: 'rgba(183,148,246,0.15)',
                color: '#B794F6',
                border: '1px solid rgba(183,148,246,0.3)',
              }}
            >
              1 Second
            </button>
            <button
              onClick={() => showToast('info', 'Default duration (3 seconds)', 3000)}
              className="px-4 py-2 rounded-lg font-semibold text-sm transition-all hover:scale-105"
              style={{
                background: 'rgba(183,148,246,0.15)',
                color: '#B794F6',
                border: '1px solid rgba(183,148,246,0.3)',
              }}
            >
              3 Seconds (Default)
            </button>
            <button
              onClick={() => showToast('warning', 'Long duration (7 seconds)', 7000)}
              className="px-4 py-2 rounded-lg font-semibold text-sm transition-all hover:scale-105"
              style={{
                background: 'rgba(183,148,246,0.15)',
                color: '#B794F6',
                border: '1px solid rgba(183,148,246,0.3)',
              }}
            >
              7 Seconds
            </button>
            <button
              onClick={() => showToast('info', 'No auto-dismiss (manual close only)', 0)}
              className="px-4 py-2 rounded-lg font-semibold text-sm transition-all hover:scale-105"
              style={{
                background: 'rgba(183,148,246,0.15)',
                color: '#B794F6',
                border: '1px solid rgba(183,148,246,0.3)',
              }}
            >
              No Auto-Dismiss
            </button>
          </div>
        </div>

        {/* Multiple Toasts */}
        <div
          className="rounded-xl p-6 mb-8"
          style={{
            background: 'rgba(183,148,246,0.04)',
            border: '1px solid rgba(183,148,246,0.15)',
          }}
        >
          <h2 className="text-xl font-bold mb-4" style={{ color: '#F0EAFF' }}>
            Multiple Toasts
          </h2>
          <p className="text-sm mb-6" style={{ color: 'rgba(240,234,255,0.6)' }}>
            Test stacking behavior with multiple toasts
          </p>

          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => {
                showToast('success', 'First toast');
                setTimeout(() => showToast('info', 'Second toast'), 200);
                setTimeout(() => showToast('warning', 'Third toast'), 400);
              }}
              className="px-4 py-2 rounded-lg font-semibold text-sm transition-all hover:scale-105"
              style={{
                background: 'rgba(183,148,246,0.15)',
                color: '#B794F6',
                border: '1px solid rgba(183,148,246,0.3)',
              }}
            >
              Show 3 Toasts
            </button>
            <button
              onClick={() => {
                for (let i = 0; i < 5; i++) {
                  setTimeout(() => {
                    const types = ['success', 'error', 'warning', 'info'];
                    const type = types[i % types.length];
                    showToast(type, `Toast ${i + 1} of 5`);
                  }, i * 300);
                }
              }}
              className="px-4 py-2 rounded-lg font-semibold text-sm transition-all hover:scale-105"
              style={{
                background: 'rgba(183,148,246,0.15)',
                color: '#B794F6',
                border: '1px solid rgba(183,148,246,0.3)',
              }}
            >
              Show 5 Toasts
            </button>
            <button
              onClick={() => setToasts([])}
              className="px-4 py-2 rounded-lg font-semibold text-sm transition-all hover:scale-105"
              style={{
                background: 'rgba(248,113,113,0.15)',
                color: '#F87171',
                border: '1px solid rgba(248,113,113,0.3)',
              }}
            >
              Clear All Toasts
            </button>
          </div>
        </div>

        {/* Active Toasts Counter */}
        <div
          className="rounded-xl p-4 text-center"
          style={{
            background: 'rgba(183,148,246,0.04)',
            border: '1px solid rgba(183,148,246,0.15)',
          }}
        >
          <div className="text-sm" style={{ color: 'rgba(240,234,255,0.6)' }}>
            Active Toasts
          </div>
          <div className="text-3xl font-bold mt-1" style={{ color: '#B794F6' }}>
            {toasts.length}
          </div>
        </div>

        {/* Features List */}
        <div
          className="rounded-xl p-6 mt-8"
          style={{
            background: 'rgba(183,148,246,0.04)',
            border: '1px solid rgba(183,148,246,0.15)',
          }}
        >
          <h2 className="text-xl font-bold mb-4" style={{ color: '#F0EAFF' }}>
            Features
          </h2>
          <ul className="space-y-2 text-sm" style={{ color: 'rgba(240,234,255,0.8)' }}>
            <li className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4" style={{ color: '#34D399' }} />
              4 toast types: success, error, info, warning
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4" style={{ color: '#34D399' }} />
              Auto-dismiss after configurable duration
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4" style={{ color: '#34D399' }} />
              Manual close button
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4" style={{ color: '#34D399' }} />
              Slide-in animation from top-right
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4" style={{ color: '#34D399' }} />
              Stack multiple toasts vertically
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4" style={{ color: '#34D399' }} />
              Progress bar showing remaining time
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4" style={{ color: '#34D399' }} />
              Matches Ownly design system
            </li>
          </ul>
        </div>
      </div>

      {/* Toast Container */}
      <ToastContainer toasts={toasts} onClose={removeToast} />
    </div>
  );
}
