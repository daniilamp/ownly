/**
 * useAutoRefresh Hook - Usage Examples
 * 
 * This file demonstrates various ways to use the useAutoRefresh hook
 * in real-world scenarios.
 */

import React, { useState } from 'react';
import { useAutoRefresh } from './useAutoRefresh';

// ============================================
// Example 1: Audit Logs with Auto-Refresh
// ============================================

export function AuditLogsExample() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchAuditLogs = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/logs/access');
      const data = await response.json();
      setLogs(data);
    } catch (error) {
      console.error('Failed to fetch audit logs:', error);
    } finally {
      setLoading(false);
    }
  };

  const { isRefreshing, startAutoRefresh, stopAutoRefresh, refresh } = useAutoRefresh({
    callback: fetchAuditLogs,
    interval: 30000, // 30 seconds
    enabled: true, // Start auto-refresh on mount
  });

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2>Audit Logs</h2>
        <div className="flex gap-2">
          <button onClick={refresh} disabled={loading}>
            Refresh Now
          </button>
          <button onClick={isRefreshing ? stopAutoRefresh : startAutoRefresh}>
            {isRefreshing ? 'Stop' : 'Start'} Auto-Refresh
          </button>
        </div>
      </div>

      {loading && <p>Loading...</p>}

      <div className="log-list">
        {logs.map((log) => (
          <div key={log.id} className="log-entry">
            <span>{log.timestamp}</span>
            <span>{log.userEmail}</span>
            <span>{log.endpoint}</span>
          </div>
        ))}
      </div>

      {isRefreshing && (
        <div className="text-sm text-gray-500 mt-2">
          Auto-refreshing every 30 seconds...
        </div>
      )}
    </div>
  );
}

// ============================================
// Example 2: Dashboard Statistics
// ============================================

export function DashboardStatsExample() {
  const [stats, setStats] = useState(null);

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/admin/stats/users');
      const data = await response.json();
      setStats(data);
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    }
  };

  const { isRefreshing, toggleAutoRefresh } = useAutoRefresh({
    callback: fetchStats,
    interval: 60000, // 60 seconds
    enabled: false, // Don't start automatically
  });

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2>System Statistics</h2>
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={isRefreshing}
            onChange={toggleAutoRefresh}
          />
          Auto-refresh (every 60s)
        </label>
      </div>

      {stats && (
        <div className="stats-grid">
          <div className="stat-card">
            <h3>Total Users</h3>
            <p>{stats.totalUsers}</p>
          </div>
          <div className="stat-card">
            <h3>Active Users</h3>
            <p>{stats.activeUsers}</p>
          </div>
          <div className="stat-card">
            <h3>Business Accounts</h3>
            <p>{stats.businessAccounts}</p>
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================
// Example 3: Recent Activity Timeline
// ============================================

export function RecentActivityExample() {
  const [activities, setActivities] = useState([]);
  const [autoRefreshEnabled, setAutoRefreshEnabled] = useState(true);

  const fetchRecentActivity = async () => {
    try {
      const response = await fetch('/api/admin/logs/access?limit=20');
      const data = await response.json();
      setActivities(data);
    } catch (error) {
      console.error('Failed to fetch activity:', error);
    }
  };

  const { isRefreshing, refresh } = useAutoRefresh({
    callback: fetchRecentActivity,
    interval: 30000, // 30 seconds
    enabled: autoRefreshEnabled,
  });

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2>Recent Activity</h2>
        <div className="flex gap-2">
          <button onClick={refresh}>
            <RefreshIcon /> Refresh
          </button>
          <button onClick={() => setAutoRefreshEnabled(!autoRefreshEnabled)}>
            {isRefreshing ? 'Disable' : 'Enable'} Auto-Refresh
          </button>
        </div>
      </div>

      <div className="activity-timeline">
        {activities.map((activity) => (
          <div key={activity.id} className="activity-item">
            <span className="activity-icon">{getActivityIcon(activity.type)}</span>
            <span className="activity-description">{activity.description}</span>
            <span className="activity-time">{formatRelativeTime(activity.timestamp)}</span>
          </div>
        ))}
      </div>

      {isRefreshing && (
        <div className="status-indicator">
          <span className="pulse-dot"></span>
          Live updates enabled
        </div>
      )}
    </div>
  );
}

// ============================================
// Example 4: API Key Usage Monitor
// ============================================

export function APIKeyUsageExample({ apiKeyId }) {
  const [usage, setUsage] = useState(null);
  const [isMonitoring, setIsMonitoring] = useState(false);

  const fetchUsage = async () => {
    try {
      const response = await fetch(`/api/admin/api-keys/${apiKeyId}/usage`);
      const data = await response.json();
      setUsage(data);
    } catch (error) {
      console.error('Failed to fetch usage:', error);
    }
  };

  const { isRefreshing, startAutoRefresh, stopAutoRefresh } = useAutoRefresh({
    callback: fetchUsage,
    interval: 10000, // 10 seconds for real-time monitoring
    enabled: false,
  });

  const handleToggleMonitoring = () => {
    if (isMonitoring) {
      stopAutoRefresh();
      setIsMonitoring(false);
    } else {
      startAutoRefresh();
      setIsMonitoring(true);
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2>API Key Usage</h2>
        <button
          onClick={handleToggleMonitoring}
          className={isMonitoring ? 'btn-danger' : 'btn-primary'}
        >
          {isMonitoring ? 'Stop Monitoring' : 'Start Monitoring'}
        </button>
      </div>

      {usage && (
        <div className="usage-stats">
          <div className="stat">
            <label>Total Requests</label>
            <value>{usage.totalRequests}</value>
          </div>
          <div className="stat">
            <label>Requests (Last Hour)</label>
            <value>{usage.lastHourRequests}</value>
          </div>
          <div className="stat">
            <label>Average Response Time</label>
            <value>{usage.avgResponseTime}ms</value>
          </div>
        </div>
      )}

      {isRefreshing && (
        <div className="monitoring-indicator">
          <span className="blink">●</span> Monitoring in real-time (updates every 10s)
        </div>
      )}
    </div>
  );
}

// ============================================
// Example 5: Conditional Auto-Refresh
// ============================================

export function ConditionalRefreshExample() {
  const [data, setData] = useState([]);
  const [hasNewData, setHasNewData] = useState(false);
  const [lastFetchTime, setLastFetchTime] = useState(null);

  const fetchData = async () => {
    try {
      const response = await fetch('/api/admin/notifications');
      const newData = await response.json();
      
      // Check if there's new data
      if (newData.length > data.length) {
        setHasNewData(true);
      }
      
      setData(newData);
      setLastFetchTime(new Date());
    } catch (error) {
      console.error('Failed to fetch data:', error);
    }
  };

  const { isRefreshing, refresh } = useAutoRefresh({
    callback: fetchData,
    interval: 15000, // 15 seconds
    enabled: true,
  });

  const handleViewNewData = () => {
    setHasNewData(false);
    // Scroll to top or highlight new items
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2>Notifications</h2>
        {hasNewData && (
          <button onClick={handleViewNewData} className="btn-primary">
            View New Notifications
          </button>
        )}
      </div>

      <div className="data-list">
        {data.map((item) => (
          <div key={item.id} className="data-item">
            {item.message}
          </div>
        ))}
      </div>

      <div className="footer-info">
        {lastFetchTime && (
          <span>Last updated: {lastFetchTime.toLocaleTimeString()}</span>
        )}
        {isRefreshing && <span className="ml-4">● Auto-refresh active</span>}
      </div>
    </div>
  );
}

// ============================================
// Helper Functions
// ============================================

function getActivityIcon(type) {
  const icons = {
    user_registration: '👤',
    role_change: '🔄',
    api_key_creation: '🔑',
    access_denied: '🚫',
  };
  return icons[type] || '📝';
}

function formatRelativeTime(timestamp) {
  const now = new Date();
  const time = new Date(timestamp);
  const diffMs = now - time;
  const diffMins = Math.floor(diffMs / 60000);
  
  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins} minutes ago`;
  
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours} hours ago`;
  
  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays} days ago`;
}

function RefreshIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
      <path d="M8 3a5 5 0 1 0 4.546 2.914.5.5 0 0 1 .908-.417A6 6 0 1 1 8 2v1z"/>
      <path d="M8 4.466V.534a.25.25 0 0 1 .41-.192l2.36 1.966c.12.1.12.284 0 .384L8.41 4.658A.25.25 0 0 1 8 4.466z"/>
    </svg>
  );
}
