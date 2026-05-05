/**
 * AdminDashboard Component
 * Main dashboard for admin panel
 * 
 * Features:
 * - Display user statistics by role (USER, BUSINESS, ADMIN)
 * - Display KYC verification statistics (completed, pending, rejected)
 * - Display API usage statistics by business
 * - Display system health status with color-coded indicators
 * - Display recent activity timeline (last 20 events)
 * - Auto-refresh: Statistics (60 seconds), Recent Activity (30 seconds)
 * 
 * Requirements: 16.1, 16.2, 16.4, 16.5, 17.1, 17.2, 18.1, 18.2
 */

import { useState, useEffect } from 'react';
import { LayoutDashboard } from 'lucide-react';
import { useAdminAPI } from '../../hooks/useAdminAPI';
import { useAutoRefresh } from '../../hooks/useAutoRefresh';
import StatisticsCards from '../../components/admin/StatisticsCards';
import SystemHealthIndicator from '../../components/admin/SystemHealthIndicator';
import RecentActivityTimeline from '../../components/admin/RecentActivityTimeline';

export default function AdminDashboard() {
  // State management
  const [userStats, setUserStats] = useState(null);
  const [apiStats, setApiStats] = useState(null);
  const [systemHealth, setSystemHealth] = useState(null);
  const [recentActivity, setRecentActivity] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Hooks
  const adminAPI = useAdminAPI();

  // Fetch statistics data
  const fetchStatistics = async () => {
    try {
      const [userStatsData, apiStatsData, healthData] = await Promise.all([
        adminAPI.getUserStats(),
        adminAPI.getAPIUsageStats(),
        adminAPI.getSystemHealth(),
      ]);
      
      setUserStats(userStatsData);
      setApiStats(apiStatsData);
      setSystemHealth(healthData);
      setError(null);
    } catch (err) {
      console.error('Failed to fetch statistics:', err);
      setError(err.message || 'Failed to load statistics');
    } finally {
      setLoading(false);
    }
  };

  // Fetch recent activity
  const fetchRecentActivity = async () => {
    try {
      // Fetch last 20 events from access logs
      const response = await adminAPI.getAccessLogs({ limit: 20 });
      setRecentActivity(response.logs || []);
    } catch (err) {
      console.error('Failed to fetch recent activity:', err);
    }
  };

  // Auto-refresh for statistics (60 seconds)
  useAutoRefresh({
    callback: fetchStatistics,
    interval: 60000,
    enabled: true,
  });

  // Auto-refresh for recent activity (30 seconds)
  useAutoRefresh({
    callback: fetchRecentActivity,
    interval: 30000,
    enabled: true,
  });

  // Initial data fetch
  useEffect(() => {
    fetchStatistics();
    fetchRecentActivity();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div>
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <LayoutDashboard className="w-8 h-8" style={{ color: '#B794F6' }} />
        <h1 className="text-3xl font-bold" style={{ color: '#F0EAFF' }}>
          Admin Dashboard
        </h1>
      </div>

      {/* Error State */}
      {error && (
        <div
          className="p-4 rounded-lg border mb-6"
          style={{
            background: 'rgba(239,68,68,0.1)',
            borderColor: 'rgba(239,68,68,0.3)',
            color: '#EF4444',
          }}
        >
          <p className="font-semibold">Error loading dashboard</p>
          <p className="text-sm mt-1">{error}</p>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2" style={{ borderColor: '#B794F6' }}></div>
        </div>
      )}

      {/* Dashboard Content */}
      {!loading && (
        <div className="space-y-6">
          {/* Statistics Cards */}
          <StatisticsCards userStats={userStats} apiStats={apiStats} />

          {/* System Health Indicator */}
          <SystemHealthIndicator systemHealth={systemHealth} />

          {/* Recent Activity Timeline */}
          <RecentActivityTimeline recentActivity={recentActivity} />
        </div>
      )}
    </div>
  );
}
