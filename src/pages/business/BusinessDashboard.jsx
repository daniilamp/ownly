/**
 * BusinessDashboard Component
 * Summary view with API key status, recent usage statistics, and quick links.
 * Shows OnboardingWizard on first visit (if no API key exists yet).
 *
 * Requirements: 9.3, 9.5
 */

import { useState, useEffect, lazy, Suspense } from 'react';
import { Link } from 'react-router-dom';
import {
  Key,
  Activity,
  ArrowRight,
  Loader2,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Clock,
  RefreshCw,
} from 'lucide-react';

const API_BASE = import.meta.env.VITE_OWNLY_API_URL || 'http://localhost:3001';

// Lazy load OnboardingWizard (created in task 10.2)
const OnboardingWizard = lazy(() => import('./OnboardingWizard'));

export default function BusinessDashboard() {
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    setLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem('ownly_token');
      const res = await fetch(`${API_BASE}/api/business/dashboard`, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || `Failed to load dashboard (${res.status})`);
      }

      const data = await res.json();
      setDashboardData(data);
    } catch (err) {
      setError(err.message || 'Unable to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <Loader2
            className="w-8 h-8 animate-spin mx-auto mb-3"
            style={{ color: '#B794F6' }}
          />
          <p className="text-sm" style={{ color: 'rgba(240,234,255,0.5)' }}>
            Loading dashboard...
          </p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="flex items-center justify-center py-20">
        <div
          className="max-w-md w-full p-6 rounded-2xl text-center"
          style={{
            background: 'rgba(248,113,113,0.06)',
            border: '1px solid rgba(248,113,113,0.2)',
          }}
        >
          <AlertCircle className="w-10 h-10 mx-auto mb-3" style={{ color: '#F87171' }} />
          <h2 className="text-lg font-semibold mb-2" style={{ color: '#F0EAFF' }}>
            Failed to Load Dashboard
          </h2>
          <p className="text-sm mb-4" style={{ color: 'rgba(240,234,255,0.6)' }}>
            {error}
          </p>
          <button
            onClick={fetchDashboard}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold transition-all hover:scale-105"
            style={{
              background: 'linear-gradient(135deg, #B794F6, #7C3AED)',
              color: '#070510',
            }}
          >
            <RefreshCw className="w-4 h-4" />
            Retry
          </button>
        </div>
      </div>
    );
  }

  // If no active API key, show onboarding wizard (Req 9.5)
  if (dashboardData && !dashboardData.keyStatus?.hasActiveKey) {
    return (
      <Suspense
        fallback={
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin" style={{ color: '#B794F6' }} />
          </div>
        }
      >
        <OnboardingWizard onComplete={fetchDashboard} />
      </Suspense>
    );
  }

  const { keyStatus, recentUsage, quickLinks } = dashboardData;

  return (
    <div>
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold" style={{ color: '#F0EAFF' }}>
          Dashboard
        </h1>
        <p className="text-sm mt-1" style={{ color: 'rgba(240,234,255,0.5)' }}>
          Overview of your API integration status and recent activity.
        </p>
      </div>

      {/* Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {/* API Key Status Card */}
        <div
          className="rounded-2xl p-6"
          style={{
            background: 'rgba(183,148,246,0.04)',
            border: '1px solid rgba(183,148,246,0.15)',
          }}
        >
          <div className="flex items-center gap-3 mb-4">
            <div
              className="w-10 h-10 rounded-lg flex items-center justify-center"
              style={{
                background: 'rgba(183,148,246,0.12)',
                border: '1px solid rgba(183,148,246,0.25)',
              }}
            >
              <Key className="w-5 h-5" style={{ color: '#B794F6' }} />
            </div>
            <h2 className="text-base font-semibold" style={{ color: '#F0EAFF' }}>
              API Key Status
            </h2>
          </div>

          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" style={{ color: '#34D399' }} />
              <span className="text-sm" style={{ color: 'rgba(240,234,255,0.7)' }}>
                Active
              </span>
            </div>

            {keyStatus?.maskedKey && (
              <div>
                <p className="text-xs mb-1" style={{ color: 'rgba(240,234,255,0.4)' }}>
                  Key
                </p>
                <p
                  className="text-sm font-mono px-3 py-1.5 rounded-lg inline-block"
                  style={{
                    background: 'rgba(183,148,246,0.08)',
                    color: '#F0EAFF',
                  }}
                >
                  {keyStatus.maskedKey}
                </p>
              </div>
            )}

            {keyStatus?.createdAt && (
              <div className="flex items-center gap-2">
                <Clock className="w-3.5 h-3.5" style={{ color: 'rgba(240,234,255,0.4)' }} />
                <span className="text-xs" style={{ color: 'rgba(240,234,255,0.4)' }}>
                  Created: {new Date(keyStatus.createdAt).toLocaleDateString()}
                </span>
              </div>
            )}

            {keyStatus?.lastUsedAt && (
              <div className="flex items-center gap-2">
                <Activity className="w-3.5 h-3.5" style={{ color: 'rgba(240,234,255,0.4)' }} />
                <span className="text-xs" style={{ color: 'rgba(240,234,255,0.4)' }}>
                  Last used: {new Date(keyStatus.lastUsedAt).toLocaleDateString()}
                </span>
              </div>
            )}
          </div>

          <Link
            to="/business/api-keys"
            className="mt-4 inline-flex items-center gap-1 text-sm font-medium transition-all hover:gap-2"
            style={{ color: '#B794F6' }}
          >
            Manage Keys <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {/* Recent Usage Card */}
        <div
          className="rounded-2xl p-6"
          style={{
            background: 'rgba(183,148,246,0.04)',
            border: '1px solid rgba(183,148,246,0.15)',
          }}
        >
          <div className="flex items-center gap-3 mb-4">
            <div
              className="w-10 h-10 rounded-lg flex items-center justify-center"
              style={{
                background: 'rgba(52,211,153,0.12)',
                border: '1px solid rgba(52,211,153,0.25)',
              }}
            >
              <Activity className="w-5 h-5" style={{ color: '#34D399' }} />
            </div>
            <h2 className="text-base font-semibold" style={{ color: '#F0EAFF' }}>
              Recent Usage
            </h2>
          </div>

          <div className="space-y-3">
            <div>
              <p className="text-xs" style={{ color: 'rgba(240,234,255,0.4)' }}>
                Total Requests
              </p>
              <p className="text-2xl font-bold" style={{ color: '#F0EAFF' }}>
                {recentUsage?.totalRequests?.toLocaleString() ?? '—'}
              </p>
            </div>

            <div className="flex gap-4">
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5" style={{ color: '#34D399' }} />
                <span className="text-sm" style={{ color: 'rgba(240,234,255,0.7)' }}>
                  {recentUsage?.successCount?.toLocaleString() ?? '0'} success
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <XCircle className="w-3.5 h-3.5" style={{ color: '#F87171' }} />
                <span className="text-sm" style={{ color: 'rgba(240,234,255,0.7)' }}>
                  {recentUsage?.errorCount?.toLocaleString() ?? '0'} errors
                </span>
              </div>
            </div>

            {recentUsage?.avgResponseTimeMs != null && (
              <div className="flex items-center gap-2">
                <Clock className="w-3.5 h-3.5" style={{ color: 'rgba(240,234,255,0.4)' }} />
                <span className="text-xs" style={{ color: 'rgba(240,234,255,0.4)' }}>
                  Avg response: {recentUsage.avgResponseTimeMs}ms
                </span>
              </div>
            )}
          </div>

          <Link
            to="/business/usage"
            className="mt-4 inline-flex items-center gap-1 text-sm font-medium transition-all hover:gap-2"
            style={{ color: '#B794F6' }}
          >
            View Details <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {/* Quick Links Card */}
        <div
          className="rounded-2xl p-6 md:col-span-2 xl:col-span-1"
          style={{
            background: 'rgba(183,148,246,0.04)',
            border: '1px solid rgba(183,148,246,0.15)',
          }}
        >
          <div className="flex items-center gap-3 mb-4">
            <div
              className="w-10 h-10 rounded-lg flex items-center justify-center"
              style={{
                background: 'rgba(96,165,250,0.12)',
                border: '1px solid rgba(96,165,250,0.25)',
              }}
            >
              <ArrowRight className="w-5 h-5" style={{ color: '#60A5FA' }} />
            </div>
            <h2 className="text-base font-semibold" style={{ color: '#F0EAFF' }}>
              Quick Links
            </h2>
          </div>

          <div className="space-y-2">
            {quickLinks && quickLinks.length > 0 ? (
              quickLinks.map((link, idx) => (
                <Link
                  key={idx}
                  to={link.path}
                  className="flex items-center justify-between px-4 py-3 rounded-xl transition-all hover:scale-[1.01]"
                  style={{
                    background: 'rgba(183,148,246,0.06)',
                    border: '1px solid rgba(183,148,246,0.1)',
                  }}
                >
                  <span className="text-sm font-medium" style={{ color: '#F0EAFF' }}>
                    {link.label}
                  </span>
                  <ArrowRight className="w-4 h-4" style={{ color: 'rgba(240,234,255,0.4)' }} />
                </Link>
              ))
            ) : (
              <p className="text-sm" style={{ color: 'rgba(240,234,255,0.4)' }}>
                No quick links available.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
