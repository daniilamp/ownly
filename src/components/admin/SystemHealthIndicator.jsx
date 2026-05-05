/**
 * SystemHealthIndicator Component
 * Display system health status with color-coded indicators
 * 
 * Features:
 * - Display system health status indicator
 * - Display database connection status
 * - Display API response time metrics
 * - Display error rate percentage
 * - Use color-coded indicators (green for healthy, yellow for warning, red for critical)
 * 
 * Requirements: 17.1, 17.2, 17.3, 17.4, 17.5, 17.6
 */

import { Activity, Database, Zap, AlertTriangle } from 'lucide-react';

export default function SystemHealthIndicator({ systemHealth }) {
  // Determine overall health status color
  const getStatusColor = (status) => {
    switch (status) {
      case 'healthy':
        return '#10B981'; // Green
      case 'warning':
        return '#F59E0B'; // Yellow/Orange
      case 'critical':
        return '#EF4444'; // Red
      default:
        return 'rgba(240,234,255,0.5)'; // Gray
    }
  };

  // Determine status label
  const getStatusLabel = (status) => {
    switch (status) {
      case 'healthy':
        return 'Healthy';
      case 'warning':
        return 'Warning';
      case 'critical':
        return 'Critical';
      default:
        return 'Unknown';
    }
  };

  // Format response time
  const formatResponseTime = (ms) => {
    if (ms < 1000) {
      return `${ms}ms`;
    }
    return `${(ms / 1000).toFixed(2)}s`;
  };

  // Determine response time status
  const getResponseTimeStatus = (ms) => {
    if (ms < 200) return 'healthy';
    if (ms < 500) return 'warning';
    return 'critical';
  };

  // Determine error rate status
  const getErrorRateStatus = (rate) => {
    if (rate < 1) return 'healthy';
    if (rate < 5) return 'warning';
    return 'critical';
  };

  const statusColor = systemHealth ? getStatusColor(systemHealth.status) : 'rgba(240,234,255,0.5)';

  return (
    <div
      className="p-6 rounded-lg border"
      style={{
        background: 'rgba(183,148,246,0.04)',
        borderColor: 'rgba(183,148,246,0.15)',
      }}
    >
      <div className="flex items-center gap-3 mb-6">
        <Activity className="w-6 h-6" style={{ color: '#B794F6' }} />
        <h2 className="text-xl font-semibold" style={{ color: '#F0EAFF' }}>
          System Health
        </h2>
      </div>

      {systemHealth ? (
        <>
          {/* Overall Status */}
          <div className="mb-6">
            <div className="flex items-center gap-3">
              <div
                className="w-4 h-4 rounded-full"
                style={{ background: statusColor }}
              ></div>
              <div>
                <p className="text-2xl font-bold" style={{ color: statusColor }}>
                  {getStatusLabel(systemHealth.status)}
                </p>
                <p className="text-sm" style={{ color: 'rgba(240,234,255,0.6)' }}>
                  Overall System Status
                </p>
              </div>
            </div>
          </div>

          {/* Health Metrics Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Database Connection */}
            <div
              className="p-4 rounded-lg border"
              style={{
                background: 'rgba(183,148,246,0.02)',
                borderColor: 'rgba(183,148,246,0.1)',
              }}
            >
              <div className="flex items-center gap-2 mb-2">
                <Database
                  className="w-5 h-5"
                  style={{
                    color: systemHealth.database?.connected
                      ? '#10B981'
                      : '#EF4444',
                  }}
                />
                <p className="font-semibold" style={{ color: '#F0EAFF' }}>
                  Database
                </p>
              </div>
              <p
                className="text-sm mb-1"
                style={{
                  color: systemHealth.database?.connected
                    ? '#10B981'
                    : '#EF4444',
                }}
              >
                {systemHealth.database?.connected ? 'Connected' : 'Disconnected'}
              </p>
              {systemHealth.database?.responseTime !== undefined && (
                <p className="text-xs" style={{ color: 'rgba(240,234,255,0.6)' }}>
                  Response: {formatResponseTime(systemHealth.database.responseTime)}
                </p>
              )}
            </div>

            {/* API Response Time */}
            <div
              className="p-4 rounded-lg border"
              style={{
                background: 'rgba(183,148,246,0.02)',
                borderColor: 'rgba(183,148,246,0.1)',
              }}
            >
              <div className="flex items-center gap-2 mb-2">
                <Zap
                  className="w-5 h-5"
                  style={{
                    color: systemHealth.api?.responseTime
                      ? getStatusColor(
                          getResponseTimeStatus(systemHealth.api.responseTime)
                        )
                      : 'rgba(240,234,255,0.5)',
                  }}
                />
                <p className="font-semibold" style={{ color: '#F0EAFF' }}>
                  API Response
                </p>
              </div>
              <p
                className="text-lg font-bold"
                style={{
                  color: systemHealth.api?.responseTime
                    ? getStatusColor(
                        getResponseTimeStatus(systemHealth.api.responseTime)
                      )
                    : 'rgba(240,234,255,0.5)',
                }}
              >
                {systemHealth.api?.responseTime !== undefined
                  ? formatResponseTime(systemHealth.api.responseTime)
                  : 'N/A'}
              </p>
              <p className="text-xs" style={{ color: 'rgba(240,234,255,0.6)' }}>
                Average response time
              </p>
            </div>

            {/* Error Rate */}
            <div
              className="p-4 rounded-lg border"
              style={{
                background: 'rgba(183,148,246,0.02)',
                borderColor: 'rgba(183,148,246,0.1)',
              }}
            >
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle
                  className="w-5 h-5"
                  style={{
                    color: systemHealth.api?.errorRate !== undefined
                      ? getStatusColor(
                          getErrorRateStatus(systemHealth.api.errorRate)
                        )
                      : 'rgba(240,234,255,0.5)',
                  }}
                />
                <p className="font-semibold" style={{ color: '#F0EAFF' }}>
                  Error Rate
                </p>
              </div>
              <p
                className="text-lg font-bold"
                style={{
                  color: systemHealth.api?.errorRate !== undefined
                    ? getStatusColor(
                        getErrorRateStatus(systemHealth.api.errorRate)
                      )
                    : 'rgba(240,234,255,0.5)',
                }}
              >
                {systemHealth.api?.errorRate !== undefined
                  ? `${systemHealth.api.errorRate.toFixed(2)}%`
                  : 'N/A'}
              </p>
              <p className="text-xs" style={{ color: 'rgba(240,234,255,0.6)' }}>
                Error percentage
              </p>
            </div>
          </div>

          {/* Last Checked */}
          {systemHealth.lastChecked && (
            <div className="mt-4 text-center">
              <p className="text-xs" style={{ color: 'rgba(240,234,255,0.5)' }}>
                Last checked: {new Date(systemHealth.lastChecked).toLocaleString()}
              </p>
            </div>
          )}
        </>
      ) : (
        <div className="flex items-center justify-center h-32">
          <p style={{ color: 'rgba(240,234,255,0.5)' }}>Loading system health...</p>
        </div>
      )}
    </div>
  );
}
