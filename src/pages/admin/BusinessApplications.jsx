/**
 * BusinessApplicationsAdmin Component
 * Admin page for reviewing and managing business applications
 * 
 * Features:
 * - Display list of business applications with status filters (pending, approved, rejected)
 * - Show company name, contact email, use case summary, submission date
 * - Detail view showing full application info including expected volume
 * - Approve button that calls POST /api/admin/business-applications/:id/approve
 * - Reject button with reason input that calls POST /api/admin/business-applications/:id/reject
 * - Handle error states (application not found, already processed)
 * 
 * Requirements: 2.2, 2.3, 2.4, 2.8
 */

import { useState, useEffect, useCallback } from 'react';
import { Briefcase, Check, X, Eye, AlertCircle, Clock, CheckCircle, XCircle } from 'lucide-react';

const API_BASE_URL = import.meta.env.VITE_OWNLY_API_URL || 'http://localhost:3001';

/**
 * Get JWT token from localStorage
 */
const getAuthToken = () => {
  return localStorage.getItem('ownly_token');
};

/**
 * Make authenticated API request
 */
const makeRequest = async (endpoint, options = {}) => {
  const token = getAuthToken();

  if (!token) {
    throw new Error('Authentication required. Please log in again.');
  }

  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
    ...options.headers,
  };

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  const data = await response.json();

  if (!response.ok) {
    if (response.status === 401) {
      throw new Error('Your session has expired. Please log in again.');
    }
    if (response.status === 403) {
      throw new Error('You do not have permission to perform this action.');
    }
    if (response.status === 404) {
      throw new Error('Application not found.');
    }
    if (response.status === 409) {
      throw new Error(data.error || 'This application has already been processed.');
    }
    throw new Error(data.error || data.message || 'An error occurred');
  }

  return data;
};

/**
 * Status badge component
 */
function StatusBadge({ status }) {
  const config = {
    pending: { color: '#F59E0B', bg: 'rgba(245,158,11,0.1)', border: 'rgba(245,158,11,0.3)', icon: Clock, label: 'Pending' },
    approved: { color: '#10B981', bg: 'rgba(16,185,129,0.1)', border: 'rgba(16,185,129,0.3)', icon: CheckCircle, label: 'Approved' },
    rejected: { color: '#F87171', bg: 'rgba(248,113,113,0.1)', border: 'rgba(248,113,113,0.3)', icon: XCircle, label: 'Rejected' },
  };

  const { color, bg, border, icon: Icon, label } = config[status] || config.pending;

  return (
    <span
      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold"
      style={{ color, background: bg, border: `1px solid ${border}` }}
    >
      <Icon className="w-3 h-3" />
      {label}
    </span>
  );
}

/**
 * Detail modal for viewing full application info
 */
function ApplicationDetailModal({ application, onClose, onApprove, onReject }) {
  const [rejectionReason, setRejectionReason] = useState('');
  const [showRejectInput, setShowRejectInput] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState(null);

  const handleApprove = async () => {
    setActionLoading(true);
    setActionError(null);
    try {
      await onApprove(application.id);
      onClose();
    } catch (err) {
      setActionError(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    if (!rejectionReason.trim()) {
      setActionError('Rejection reason is required.');
      return;
    }
    setActionLoading(true);
    setActionError(null);
    try {
      await onReject(application.id, rejectionReason.trim());
      onClose();
    } catch (err) {
      setActionError(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-black bg-opacity-60"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal */}
      <div
        className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl p-6"
        style={{
          background: '#0D0A1A',
          border: '1px solid rgba(183,148,246,0.2)',
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold" style={{ color: '#F0EAFF' }}>
            Application Details
          </h2>
          <button
            onClick={onClose}
            className="p-2 rounded-lg transition-all hover:scale-105"
            style={{
              background: 'rgba(183,148,246,0.08)',
              border: '1px solid rgba(183,148,246,0.2)',
              color: '#B794F6',
            }}
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Application info */}
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <DetailField label="Company Name" value={application.company_name} />
            <DetailField label="Contact Name" value={application.contact_name} />
            <DetailField label="Contact Email" value={application.contact_email} />
            <DetailField label="Company Website" value={application.company_website || 'N/A'} />
            <DetailField label="Expected Monthly Volume" value={application.expected_monthly_volume ? application.expected_monthly_volume.toLocaleString() : 'Not specified'} />
            <DetailField label="Status" value={<StatusBadge status={application.status} />} />
            <DetailField label="Submitted" value={new Date(application.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })} />
            {application.reviewed_at && (
              <DetailField label="Reviewed" value={new Date(application.reviewed_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })} />
            )}
          </div>

          {/* Use case - full text */}
          <div
            className="p-4 rounded-lg"
            style={{
              background: 'rgba(183,148,246,0.04)',
              border: '1px solid rgba(183,148,246,0.1)',
            }}
          >
            <p className="text-xs font-semibold mb-2" style={{ color: 'rgba(240,234,255,0.5)' }}>
              Use Case
            </p>
            <p className="text-sm leading-relaxed" style={{ color: '#F0EAFF' }}>
              {application.use_case}
            </p>
          </div>

          {/* Rejection reason if rejected */}
          {application.status === 'rejected' && application.rejection_reason && (
            <div
              className="p-4 rounded-lg"
              style={{
                background: 'rgba(248,113,113,0.04)',
                border: '1px solid rgba(248,113,113,0.15)',
              }}
            >
              <p className="text-xs font-semibold mb-2" style={{ color: 'rgba(248,113,113,0.7)' }}>
                Rejection Reason
              </p>
              <p className="text-sm leading-relaxed" style={{ color: '#F87171' }}>
                {application.rejection_reason}
              </p>
            </div>
          )}
        </div>

        {/* Action buttons - only show for pending applications */}
        {application.status === 'pending' && (
          <div className="mt-6 pt-6 border-t" style={{ borderColor: 'rgba(183,148,246,0.1)' }}>
            {actionError && (
              <div
                className="mb-4 p-3 rounded-lg flex items-center gap-2"
                style={{
                  background: 'rgba(248,113,113,0.08)',
                  border: '1px solid rgba(248,113,113,0.2)',
                }}
              >
                <AlertCircle className="w-4 h-4 flex-shrink-0" style={{ color: '#F87171' }} />
                <p className="text-sm" style={{ color: '#F87171' }}>{actionError}</p>
              </div>
            )}

            {showRejectInput ? (
              <div className="space-y-3">
                <label className="block">
                  <span className="text-sm font-semibold" style={{ color: 'rgba(240,234,255,0.7)' }}>
                    Rejection Reason
                  </span>
                  <textarea
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    placeholder="Enter the reason for rejecting this application..."
                    rows={3}
                    className="mt-1 w-full px-4 py-3 rounded-lg text-sm resize-none focus:outline-none focus:ring-2"
                    style={{
                      background: 'rgba(183,148,246,0.04)',
                      border: '1px solid rgba(183,148,246,0.2)',
                      color: '#F0EAFF',
                      focusRingColor: '#B794F6',
                    }}
                  />
                </label>
                <div className="flex gap-3">
                  <button
                    onClick={handleReject}
                    disabled={actionLoading}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed"
                    style={{
                      background: 'rgba(248,113,113,0.12)',
                      border: '1px solid rgba(248,113,113,0.3)',
                      color: '#F87171',
                    }}
                  >
                    <XCircle className="w-4 h-4" />
                    {actionLoading ? 'Rejecting...' : 'Confirm Rejection'}
                  </button>
                  <button
                    onClick={() => { setShowRejectInput(false); setRejectionReason(''); setActionError(null); }}
                    disabled={actionLoading}
                    className="px-4 py-2 rounded-lg text-sm font-semibold transition-all"
                    style={{
                      background: 'rgba(183,148,246,0.08)',
                      border: '1px solid rgba(183,148,246,0.2)',
                      color: 'rgba(240,234,255,0.7)',
                    }}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex gap-3">
                <button
                  onClick={handleApprove}
                  disabled={actionLoading}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{
                    background: 'rgba(16,185,129,0.12)',
                    border: '1px solid rgba(16,185,129,0.3)',
                    color: '#10B981',
                  }}
                >
                  <CheckCircle className="w-4 h-4" />
                  {actionLoading ? 'Approving...' : 'Approve'}
                </button>
                <button
                  onClick={() => setShowRejectInput(true)}
                  disabled={actionLoading}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{
                    background: 'rgba(248,113,113,0.12)',
                    border: '1px solid rgba(248,113,113,0.3)',
                    color: '#F87171',
                  }}
                >
                  <XCircle className="w-4 h-4" />
                  Reject
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Detail field component for the modal
 */
function DetailField({ label, value }) {
  return (
    <div>
      <p className="text-xs font-semibold mb-1" style={{ color: 'rgba(240,234,255,0.5)' }}>
        {label}
      </p>
      <div className="text-sm font-semibold" style={{ color: '#F0EAFF' }}>
        {value}
      </div>
    </div>
  );
}

/**
 * Main BusinessApplications component
 */
export default function BusinessApplications() {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [statusFilter, setStatusFilter] = useState('pending');
  const [selectedApplication, setSelectedApplication] = useState(null);
  const [toast, setToast] = useState(null);

  // Fetch applications
  const fetchApplications = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const queryParam = statusFilter ? `?status=${statusFilter}` : '';
      const data = await makeRequest(`/api/admin/business-applications${queryParam}`);
      setApplications(data.applications || []);
    } catch (err) {
      console.error('Failed to fetch business applications:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    fetchApplications();
  }, [fetchApplications]);

  // Show toast notification
  const showToast = (type, message) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 4000);
  };

  // Handle approve
  const handleApprove = async (applicationId) => {
    await makeRequest(`/api/admin/business-applications/${applicationId}/approve`, {
      method: 'POST',
    });
    showToast('success', 'Application approved successfully.');
    fetchApplications();
  };

  // Handle reject
  const handleReject = async (applicationId, reason) => {
    await makeRequest(`/api/admin/business-applications/${applicationId}/reject`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    });
    showToast('success', 'Application rejected.');
    fetchApplications();
  };

  // Handle inline approve (quick action from table row)
  const handleApproveInline = async (applicationId) => {
    try {
      await handleApprove(applicationId);
    } catch (err) {
      showToast('error', err.message);
    }
  };

  // Handle view detail
  const handleViewDetail = async (application) => {
    try {
      const data = await makeRequest(`/api/admin/business-applications/${application.id}`);
      setSelectedApplication(data.application || data);
    } catch (err) {
      showToast('error', err.message);
    }
  };

  // Status filter tabs
  const statusTabs = [
    { value: 'pending', label: 'Pending', icon: Clock },
    { value: 'approved', label: 'Approved', icon: CheckCircle },
    { value: 'rejected', label: 'Rejected', icon: XCircle },
    { value: '', label: 'All', icon: Briefcase },
  ];

  // Truncate text helper
  const truncate = (text, maxLength = 60) => {
    if (!text) return '';
    return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
  };

  return (
    <div>
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Briefcase className="w-8 h-8" style={{ color: '#B794F6' }} />
        <h1 className="text-3xl font-bold" style={{ color: '#F0EAFF' }}>
          Business Applications
        </h1>
      </div>

      {/* Status filter tabs */}
      <div
        className="flex flex-wrap gap-2 mb-6 p-2 rounded-xl"
        style={{
          background: 'rgba(183,148,246,0.04)',
          border: '1px solid rgba(183,148,246,0.1)',
        }}
      >
        {statusTabs.map((tab) => {
          const isActive = statusFilter === tab.value;
          const Icon = tab.icon;
          return (
            <button
              key={tab.value}
              onClick={() => setStatusFilter(tab.value)}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all"
              style={{
                background: isActive ? 'rgba(183,148,246,0.12)' : 'transparent',
                border: isActive ? '1px solid rgba(183,148,246,0.25)' : '1px solid transparent',
                color: isActive ? '#B794F6' : 'rgba(240,234,255,0.6)',
              }}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Error state */}
      {error && (
        <div
          className="mb-6 p-4 rounded-xl flex items-center gap-3"
          style={{
            background: 'rgba(248,113,113,0.08)',
            border: '1px solid rgba(248,113,113,0.2)',
          }}
        >
          <AlertCircle className="w-5 h-5 flex-shrink-0" style={{ color: '#F87171' }} />
          <p className="text-sm" style={{ color: '#F87171' }}>{error}</p>
          <button
            onClick={fetchApplications}
            className="ml-auto px-3 py-1 rounded-lg text-xs font-semibold transition-all"
            style={{
              background: 'rgba(183,148,246,0.08)',
              border: '1px solid rgba(183,148,246,0.2)',
              color: '#B794F6',
            }}
          >
            Retry
          </button>
        </div>
      )}

      {/* Loading state */}
      {loading && (
        <div className="flex items-center justify-center py-16">
          <div className="flex flex-col items-center gap-3">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2" style={{ borderColor: '#B794F6' }} />
            <p className="text-sm" style={{ color: 'rgba(240,234,255,0.5)' }}>Loading applications...</p>
          </div>
        </div>
      )}

      {/* Empty state */}
      {!loading && !error && applications.length === 0 && (
        <div
          className="flex flex-col items-center justify-center py-16 rounded-xl"
          style={{
            background: 'rgba(183,148,246,0.02)',
            border: '1px solid rgba(183,148,246,0.08)',
          }}
        >
          <Briefcase className="w-12 h-12 mb-4" style={{ color: 'rgba(183,148,246,0.3)' }} />
          <p className="text-lg font-semibold mb-1" style={{ color: 'rgba(240,234,255,0.7)' }}>
            No applications found
          </p>
          <p className="text-sm" style={{ color: 'rgba(240,234,255,0.4)' }}>
            {statusFilter ? `No ${statusFilter} applications at this time.` : 'No business applications have been submitted yet.'}
          </p>
        </div>
      )}

      {/* Applications table */}
      {!loading && !error && applications.length > 0 && (
        <div
          className="rounded-xl overflow-hidden"
          style={{
            background: 'rgba(183,148,246,0.02)',
            border: '1px solid rgba(183,148,246,0.1)',
          }}
        >
          {/* Table header */}
          <div
            className="hidden md:grid grid-cols-12 gap-4 px-6 py-3 text-xs font-semibold uppercase tracking-wider"
            style={{
              background: 'rgba(183,148,246,0.06)',
              borderBottom: '1px solid rgba(183,148,246,0.1)',
              color: 'rgba(240,234,255,0.5)',
            }}
          >
            <div className="col-span-3">Company</div>
            <div className="col-span-3">Contact Email</div>
            <div className="col-span-3">Use Case</div>
            <div className="col-span-1">Date</div>
            <div className="col-span-1">Status</div>
            <div className="col-span-1">Actions</div>
          </div>

          {/* Table rows */}
          {applications.map((app) => (
            <div
              key={app.id}
              className="grid grid-cols-1 md:grid-cols-12 gap-2 md:gap-4 px-6 py-4 items-center transition-all hover:bg-opacity-50"
              style={{
                borderBottom: '1px solid rgba(183,148,246,0.06)',
                cursor: 'pointer',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(183,148,246,0.04)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
            >
              {/* Company name */}
              <div className="col-span-3">
                <p className="text-sm font-semibold" style={{ color: '#F0EAFF' }}>
                  {app.company_name}
                </p>
                <p className="text-xs md:hidden mt-0.5" style={{ color: 'rgba(240,234,255,0.5)' }}>
                  {app.contact_email}
                </p>
              </div>

              {/* Contact email */}
              <div className="col-span-3 hidden md:block">
                <p className="text-sm" style={{ color: 'rgba(240,234,255,0.7)' }}>
                  {app.contact_email}
                </p>
              </div>

              {/* Use case (truncated) */}
              <div className="col-span-3 hidden md:block">
                <p className="text-sm" style={{ color: 'rgba(240,234,255,0.6)' }}>
                  {truncate(app.use_case)}
                </p>
              </div>

              {/* Date */}
              <div className="col-span-1 hidden md:block">
                <p className="text-xs" style={{ color: 'rgba(240,234,255,0.5)' }}>
                  {new Date(app.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </p>
              </div>

              {/* Status */}
              <div className="col-span-1">
                <StatusBadge status={app.status} />
              </div>

              {/* Actions */}
              <div className="col-span-1 flex items-center gap-1">
                <button
                  onClick={(e) => { e.stopPropagation(); handleViewDetail(app); }}
                  className="p-2 rounded-lg transition-all hover:scale-105"
                  style={{
                    background: 'rgba(183,148,246,0.08)',
                    border: '1px solid rgba(183,148,246,0.2)',
                    color: '#B794F6',
                  }}
                  title="View details"
                  aria-label={`View details for ${app.company_name}`}
                >
                  <Eye className="w-4 h-4" />
                </button>
                {app.status === 'pending' && (
                  <>
                    <button
                      onClick={(e) => { e.stopPropagation(); handleApproveInline(app.id); }}
                      className="p-2 rounded-lg transition-all hover:scale-105"
                      style={{
                        background: 'rgba(16,185,129,0.08)',
                        border: '1px solid rgba(16,185,129,0.2)',
                        color: '#10B981',
                      }}
                      title="Approve"
                      aria-label={`Approve ${app.company_name}`}
                    >
                      <Check className="w-4 h-4" />
                    </button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Detail Modal */}
      {selectedApplication && (
        <ApplicationDetailModal
          application={selectedApplication}
          onClose={() => setSelectedApplication(null)}
          onApprove={handleApprove}
          onReject={handleReject}
        />
      )}

      {/* Toast notification */}
      {toast && (
        <div
          className="fixed bottom-6 right-6 z-50 px-4 py-3 rounded-xl flex items-center gap-2 shadow-lg animate-in slide-in-from-bottom-5"
          style={{
            background: toast.type === 'success' ? 'rgba(16,185,129,0.15)' : 'rgba(248,113,113,0.15)',
            border: `1px solid ${toast.type === 'success' ? 'rgba(16,185,129,0.3)' : 'rgba(248,113,113,0.3)'}`,
            color: toast.type === 'success' ? '#10B981' : '#F87171',
          }}
        >
          {toast.type === 'success' ? <CheckCircle className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
          <p className="text-sm font-semibold">{toast.message}</p>
        </div>
      )}
    </div>
  );
}
