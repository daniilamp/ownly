/**
 * APIKeyManagement Component
 * Manages API key display, regeneration, and revocation for business users.
 * 
 * Features:
 * - Display masked API key (last 4 chars visible), creation date, last used date, status
 * - Regenerate button with confirmation dialog
 * - Revoke button with confirmation dialog
 * - Display new key exactly once after regeneration with save warning
 * - Handle error states (key generation failure with retry option)
 * - Generate API Key button when no keys exist
 * 
 * Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 3.6
 */

import { useState, useEffect, useCallback } from 'react';
import {
  Key,
  RefreshCw,
  XCircle,
  Copy,
  Check,
  AlertTriangle,
  Loader2,
  AlertCircle,
  ShieldAlert,
  Plus,
  Clock,
  Calendar,
  Activity,
} from 'lucide-react';

const API_BASE = import.meta.env.VITE_OWNLY_API_URL || 'http://localhost:3001';

/**
 * Helper to get auth headers for authenticated API calls
 */
function getAuthHeaders() {
  const token = localStorage.getItem('ownly_token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

/**
 * Format a date string for display
 */
function formatDate(dateStr) {
  if (!dateStr) return 'Never';
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function APIKeyManagement() {
  // State
  const [keys, setKeys] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [newKey, setNewKey] = useState(null); // Plaintext key shown once after generation/regeneration
  const [copied, setCopied] = useState(false);
  const [actionLoading, setActionLoading] = useState(null); // 'generate' | 'regenerate' | 'revoke' | null
  const [actionError, setActionError] = useState(null);

  // Confirmation dialog state
  const [confirmDialog, setConfirmDialog] = useState(null); // { type: 'regenerate' | 'revoke', keyId: string }

  /**
   * Fetch API key metadata from the backend
   */
  const fetchKeys = useCallback(async () => {
    try {
      setError(null);
      const res = await fetch(`${API_BASE}/api/business/api-keys`, {
        headers: getAuthHeaders(),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to load API keys');
      }

      const data = await res.json();
      setKeys(data.apiKeys || data.keys || []);
    } catch (err) {
      setError(err.message || 'Failed to load API keys');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchKeys();
  }, [fetchKeys]);

  /**
   * Generate a new API key (when no keys exist)
   */
  const handleGenerate = async () => {
    setActionLoading('generate');
    setActionError(null);
    setNewKey(null);

    try {
      const res = await fetch(`${API_BASE}/api/business/api-keys/generate`, {
        method: 'POST',
        headers: getAuthHeaders(),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to generate API key. Please retry.');
      }

      const data = await res.json();
      setNewKey(data.apiKey || data.key || data.plaintextKey);
      // Refresh key list
      await fetchKeys();
    } catch (err) {
      setActionError({ type: 'generate', message: err.message });
    } finally {
      setActionLoading(null);
    }
  };

  /**
   * Regenerate an existing API key
   */
  const handleRegenerate = async (apiKeyId) => {
    setConfirmDialog(null);
    setActionLoading('regenerate');
    setActionError(null);
    setNewKey(null);

    try {
      const res = await fetch(`${API_BASE}/api/business/api-keys/regenerate`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ apiKeyId, confirm: true }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to regenerate API key. Please retry.');
      }

      const data = await res.json();
      setNewKey(data.apiKey || data.key || data.plaintextKey);
      // Refresh key list
      await fetchKeys();
    } catch (err) {
      setActionError({ type: 'regenerate', message: err.message });
    } finally {
      setActionLoading(null);
    }
  };

  /**
   * Revoke an API key
   */
  const handleRevoke = async (apiKeyId) => {
    setConfirmDialog(null);
    setActionLoading('revoke');
    setActionError(null);

    try {
      const res = await fetch(`${API_BASE}/api/business/api-keys/revoke`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ apiKeyId }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to revoke API key');
      }

      // Refresh key list
      await fetchKeys();
    } catch (err) {
      setActionError({ type: 'revoke', message: err.message });
    } finally {
      setActionLoading(null);
    }
  };

  /**
   * Copy key to clipboard
   */
  const handleCopy = async () => {
    if (!newKey) return;
    try {
      await navigator.clipboard.writeText(newKey);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback for older browsers
      const textarea = document.createElement('textarea');
      textarea.value = newKey;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  /**
   * Dismiss the new key display (user acknowledges they've saved it)
   */
  const dismissNewKey = () => {
    setNewKey(null);
    setCopied(false);
  };

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin" style={{ color: '#B794F6' }} />
      </div>
    );
  }

  // Error state (initial load failure)
  if (error && keys.length === 0) {
    return (
      <div>
        <PageHeader />
        <div
          className="rounded-2xl p-8 text-center"
          style={{
            background: 'rgba(248,113,113,0.06)',
            border: '1px solid rgba(248,113,113,0.2)',
          }}
        >
          <AlertCircle className="w-12 h-12 mx-auto mb-4" style={{ color: '#F87171' }} />
          <h3 className="text-lg font-semibold mb-2" style={{ color: '#F0EAFF' }}>
            Failed to Load API Keys
          </h3>
          <p className="text-sm mb-4" style={{ color: 'rgba(240,234,255,0.6)' }}>
            {error}
          </p>
          <button
            onClick={() => { setLoading(true); fetchKeys(); }}
            className="px-5 py-2.5 rounded-xl font-semibold transition-all hover:scale-105"
            style={{
              background: 'linear-gradient(135deg, #B794F6, #7C3AED)',
              color: '#070510',
            }}
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const activeKeys = keys.filter(k => k.status === 'active');
  const revokedKeys = keys.filter(k => k.status === 'revoked');

  return (
    <div>
      <PageHeader />

      {/* New Key Display — shown exactly once after generation/regeneration */}
      {newKey && (
        <NewKeyBanner
          apiKey={newKey}
          copied={copied}
          onCopy={handleCopy}
          onDismiss={dismissNewKey}
        />
      )}

      {/* Action Error */}
      {actionError && (
        <div
          className="rounded-xl p-4 mb-6 flex items-center justify-between"
          style={{
            background: 'rgba(248,113,113,0.08)',
            border: '1px solid rgba(248,113,113,0.2)',
          }}
        >
          <div className="flex items-center gap-3">
            <AlertCircle className="w-5 h-5 flex-shrink-0" style={{ color: '#F87171' }} />
            <p className="text-sm" style={{ color: '#F87171' }}>
              {actionError.message}
            </p>
          </div>
          {(actionError.type === 'generate' || actionError.type === 'regenerate') && (
            <button
              onClick={actionError.type === 'generate' ? handleGenerate : () => setActionError(null)}
              className="px-4 py-1.5 rounded-lg text-xs font-semibold transition-all hover:scale-105"
              style={{
                background: 'rgba(248,113,113,0.15)',
                border: '1px solid rgba(248,113,113,0.3)',
                color: '#F87171',
              }}
            >
              Retry
            </button>
          )}
          <button
            onClick={() => setActionError(null)}
            className="ml-2 p-1 rounded-lg transition-all hover:scale-105"
            style={{ color: 'rgba(240,234,255,0.4)' }}
            aria-label="Dismiss error"
          >
            <XCircle className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Empty state — no keys exist */}
      {keys.length === 0 && (
        <EmptyState
          onGenerate={handleGenerate}
          loading={actionLoading === 'generate'}
        />
      )}

      {/* Active Keys */}
      {activeKeys.length > 0 && (
        <div className="mb-8">
          <h2 className="text-lg font-semibold mb-4" style={{ color: '#F0EAFF' }}>
            Active Keys
          </h2>
          <div className="space-y-4">
            {activeKeys.map((key) => (
              <KeyCard
                key={key.id}
                apiKey={key}
                onRegenerate={() => setConfirmDialog({ type: 'regenerate', keyId: key.id })}
                onRevoke={() => setConfirmDialog({ type: 'revoke', keyId: key.id })}
                actionLoading={actionLoading}
              />
            ))}
          </div>
        </div>
      )}

      {/* Revoked Keys */}
      {revokedKeys.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold mb-4" style={{ color: 'rgba(240,234,255,0.5)' }}>
            Revoked Keys
          </h2>
          <div className="space-y-4">
            {revokedKeys.map((key) => (
              <KeyCard
                key={key.id}
                apiKey={key}
                disabled
              />
            ))}
          </div>
        </div>
      )}

      {/* Confirmation Dialog */}
      {confirmDialog && (
        <ConfirmationDialog
          type={confirmDialog.type}
          onConfirm={() =>
            confirmDialog.type === 'regenerate'
              ? handleRegenerate(confirmDialog.keyId)
              : handleRevoke(confirmDialog.keyId)
          }
          onCancel={() => setConfirmDialog(null)}
        />
      )}
    </div>
  );
}

/**
 * Page header component
 */
function PageHeader() {
  return (
    <div className="flex items-center gap-3 mb-8">
      <div
        className="w-10 h-10 rounded-xl flex items-center justify-center"
        style={{
          background: 'rgba(183,148,246,0.12)',
          border: '1px solid rgba(183,148,246,0.25)',
        }}
      >
        <Key className="w-5 h-5" style={{ color: '#B794F6' }} />
      </div>
      <div>
        <h1 className="text-2xl font-bold" style={{ color: '#F0EAFF' }}>
          API Key Management
        </h1>
        <p className="text-sm" style={{ color: 'rgba(240,234,255,0.5)' }}>
          Manage your API keys for accessing Ownly's identity verification services.
        </p>
      </div>
    </div>
  );
}

/**
 * Empty state when no API keys exist
 */
function EmptyState({ onGenerate, loading }) {
  return (
    <div
      className="rounded-2xl p-10 text-center"
      style={{
        background: 'rgba(183,148,246,0.04)',
        border: '1px solid rgba(183,148,246,0.15)',
      }}
    >
      <div
        className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-5"
        style={{
          background: 'rgba(183,148,246,0.1)',
          border: '1px solid rgba(183,148,246,0.2)',
        }}
      >
        <Key className="w-8 h-8" style={{ color: '#B794F6' }} />
      </div>
      <h3 className="text-xl font-semibold mb-2" style={{ color: '#F0EAFF' }}>
        No API Keys Yet
      </h3>
      <p className="text-sm mb-6 max-w-md mx-auto" style={{ color: 'rgba(240,234,255,0.5)' }}>
        Generate your first API key to start integrating Ownly's identity verification into your platform.
      </p>
      <button
        onClick={onGenerate}
        disabled={loading}
        className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-semibold transition-all hover:scale-105"
        style={{
          background: loading
            ? 'rgba(183,148,246,0.3)'
            : 'linear-gradient(135deg, #B794F6, #7C3AED)',
          color: '#070510',
          opacity: loading ? 0.6 : 1,
        }}
      >
        {loading ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            Generating...
          </>
        ) : (
          <>
            <Plus className="w-5 h-5" />
            Generate API Key
          </>
        )}
      </button>
    </div>
  );
}

/**
 * Banner showing the newly generated/regenerated key (displayed exactly once)
 */
function NewKeyBanner({ apiKey, copied, onCopy, onDismiss }) {
  return (
    <div
      className="rounded-2xl p-6 mb-6"
      style={{
        background: 'rgba(52,211,153,0.06)',
        border: '1px solid rgba(52,211,153,0.25)',
      }}
    >
      {/* Warning header */}
      <div className="flex items-center gap-2 mb-4">
        <ShieldAlert className="w-5 h-5" style={{ color: '#FBBF24' }} />
        <span className="text-sm font-semibold" style={{ color: '#FBBF24' }}>
          Save your API key now — it won't be shown again!
        </span>
      </div>

      {/* Key display */}
      <div
        className="flex items-center gap-3 p-4 rounded-xl mb-4"
        style={{
          background: 'rgba(7,5,16,0.6)',
          border: '1px solid rgba(183,148,246,0.2)',
        }}
      >
        <code
          className="flex-1 text-sm font-mono break-all"
          style={{ color: '#34D399' }}
        >
          {apiKey}
        </code>
        <button
          onClick={onCopy}
          className="flex-shrink-0 p-2 rounded-lg transition-all hover:scale-110"
          style={{
            background: copied ? 'rgba(52,211,153,0.15)' : 'rgba(183,148,246,0.1)',
            border: `1px solid ${copied ? 'rgba(52,211,153,0.3)' : 'rgba(183,148,246,0.2)'}`,
          }}
          aria-label="Copy API key"
        >
          {copied ? (
            <Check className="w-4 h-4" style={{ color: '#34D399' }} />
          ) : (
            <Copy className="w-4 h-4" style={{ color: '#B794F6' }} />
          )}
        </button>
      </div>

      {/* Warning message */}
      <p className="text-xs mb-4" style={{ color: 'rgba(240,234,255,0.5)' }}>
        Store this key in a secure location (e.g., environment variables, secrets manager). 
        You will not be able to view the full key again after dismissing this message.
      </p>

      {/* Dismiss button */}
      <button
        onClick={onDismiss}
        className="px-4 py-2 rounded-lg text-sm font-medium transition-all hover:scale-105"
        style={{
          background: 'rgba(183,148,246,0.1)',
          border: '1px solid rgba(183,148,246,0.2)',
          color: '#F0EAFF',
        }}
      >
        I've saved my key
      </button>
    </div>
  );
}

/**
 * Individual API key card showing metadata and actions
 */
function KeyCard({ apiKey, onRegenerate, onRevoke, disabled, actionLoading }) {
  const statusColor = apiKey.status === 'active'
    ? { bg: 'rgba(52,211,153,0.1)', border: 'rgba(52,211,153,0.3)', text: '#34D399' }
    : { bg: 'rgba(248,113,113,0.1)', border: 'rgba(248,113,113,0.3)', text: '#F87171' };

  return (
    <div
      className="rounded-xl p-5"
      style={{
        background: 'rgba(183,148,246,0.04)',
        border: '1px solid rgba(183,148,246,0.12)',
        opacity: disabled ? 0.6 : 1,
      }}
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {/* Key info */}
        <div className="flex-1 space-y-3">
          {/* Masked key and status */}
          <div className="flex items-center gap-3 flex-wrap">
            <code
              className="text-sm font-mono px-3 py-1 rounded-lg"
              style={{
                background: 'rgba(7,5,16,0.5)',
                border: '1px solid rgba(183,148,246,0.15)',
                color: '#F0EAFF',
              }}
            >
              {apiKey.maskedKey || apiKey.masked_key || `ownly_****...****${(apiKey.key_prefix || apiKey.keyPrefix || '????')}`}
            </code>
            <span
              className="text-xs font-semibold px-2.5 py-1 rounded-full capitalize"
              style={{
                background: statusColor.bg,
                border: `1px solid ${statusColor.border}`,
                color: statusColor.text,
              }}
            >
              {apiKey.status}
            </span>
          </div>

          {/* Metadata row */}
          <div className="flex items-center gap-5 flex-wrap">
            <div className="flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5" style={{ color: 'rgba(240,234,255,0.4)' }} />
              <span className="text-xs" style={{ color: 'rgba(240,234,255,0.5)' }}>
                Created: {formatDate(apiKey.created_at || apiKey.createdAt)}
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5" style={{ color: 'rgba(240,234,255,0.4)' }} />
              <span className="text-xs" style={{ color: 'rgba(240,234,255,0.5)' }}>
                Last used: {formatDate(apiKey.last_used_at || apiKey.lastUsedAt)}
              </span>
            </div>
            {apiKey.permissions && (
              <div className="flex items-center gap-1.5">
                <Activity className="w-3.5 h-3.5" style={{ color: 'rgba(240,234,255,0.4)' }} />
                <span className="text-xs" style={{ color: 'rgba(240,234,255,0.5)' }}>
                  Permissions: {Array.isArray(apiKey.permissions) ? apiKey.permissions.join(', ') : apiKey.permissions}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Actions (only for active keys) */}
        {!disabled && (
          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              onClick={onRegenerate}
              disabled={!!actionLoading}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold transition-all hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
              style={{
                background: 'rgba(251,191,36,0.1)',
                border: '1px solid rgba(251,191,36,0.25)',
                color: '#FBBF24',
              }}
              title="Regenerate API key"
            >
              {actionLoading === 'regenerate' ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <RefreshCw className="w-3.5 h-3.5" />
              )}
              Regenerate
            </button>
            <button
              onClick={onRevoke}
              disabled={!!actionLoading}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold transition-all hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
              style={{
                background: 'rgba(248,113,113,0.1)',
                border: '1px solid rgba(248,113,113,0.25)',
                color: '#F87171',
              }}
              title="Revoke API key"
            >
              {actionLoading === 'revoke' ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <XCircle className="w-3.5 h-3.5" />
              )}
              Revoke
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Confirmation dialog for destructive actions (regenerate/revoke)
 */
function ConfirmationDialog({ type, onConfirm, onCancel }) {
  const isRegenerate = type === 'regenerate';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black bg-opacity-60"
        onClick={onCancel}
        aria-hidden="true"
      />

      {/* Dialog */}
      <div
        className="relative max-w-md w-full rounded-2xl p-6"
        style={{
          background: '#0F0B1A',
          border: '1px solid rgba(183,148,246,0.2)',
          boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)',
        }}
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-dialog-title"
      >
        {/* Icon */}
        <div
          className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4"
          style={{
            background: isRegenerate
              ? 'rgba(251,191,36,0.12)'
              : 'rgba(248,113,113,0.12)',
            border: `1px solid ${isRegenerate ? 'rgba(251,191,36,0.25)' : 'rgba(248,113,113,0.25)'}`,
          }}
        >
          <AlertTriangle
            className="w-6 h-6"
            style={{ color: isRegenerate ? '#FBBF24' : '#F87171' }}
          />
        </div>

        {/* Title */}
        <h3
          id="confirm-dialog-title"
          className="text-lg font-bold text-center mb-2"
          style={{ color: '#F0EAFF' }}
        >
          {isRegenerate ? 'Regenerate API Key?' : 'Revoke API Key?'}
        </h3>

        {/* Description */}
        <p className="text-sm text-center mb-6" style={{ color: 'rgba(240,234,255,0.6)' }}>
          {isRegenerate
            ? 'This will invalidate your current API key immediately. Any integrations using the old key will stop working. A new key will be generated.'
            : 'This will permanently revoke your API key. Any integrations using this key will immediately lose access. This action cannot be undone.'}
        </p>

        {/* Actions */}
        <div className="flex items-center gap-3">
          <button
            onClick={onCancel}
            className="flex-1 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all hover:scale-105"
            style={{
              background: 'rgba(183,148,246,0.08)',
              border: '1px solid rgba(183,148,246,0.2)',
              color: '#F0EAFF',
            }}
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all hover:scale-105"
            style={{
              background: isRegenerate
                ? 'linear-gradient(135deg, #FBBF24, #D97706)'
                : 'linear-gradient(135deg, #F87171, #DC2626)',
              color: '#070510',
            }}
          >
            {isRegenerate ? 'Regenerate' : 'Revoke'}
          </button>
        </div>
      </div>
    </div>
  );
}
