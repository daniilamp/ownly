/**
 * StatisticsCards Component
 * Display statistics cards for user and API usage data
 * 
 * Features:
 * - Display total user count by role (USER, BUSINESS, ADMIN)
 * - Display KYC verification statistics (completed, pending, rejected)
 * - Display API usage statistics by business
 * - Use card layout with visual charts (recharts)
 * 
 * Requirements: 16.1, 16.3, 16.4, 16.6
 */

import { Users, Shield, Key, CheckCircle, Clock, XCircle } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';

export default function StatisticsCards({ userStats, apiStats }) {
  // Colors for charts
  const ROLE_COLORS = {
    user: '#3B82F6',    // Blue
    business: '#10B981', // Green
    admin: '#B794F6',    // Purple
  };

  const KYC_COLORS = {
    completed: '#10B981', // Green
    pending: '#F59E0B',   // Orange
    rejected: '#EF4444',  // Red
  };

  // Prepare data for role distribution chart
  const roleData = userStats?.byRole ? [
    { name: 'USER', value: userStats.byRole.user || 0, color: ROLE_COLORS.user },
    { name: 'BUSINESS', value: userStats.byRole.business || 0, color: ROLE_COLORS.business },
    { name: 'ADMIN', value: userStats.byRole.admin || 0, color: ROLE_COLORS.admin },
  ] : [];

  // Prepare data for KYC status chart
  const kycData = userStats?.kycStatistics ? [
    { name: 'Completed', value: userStats.kycStatistics.completed || 0, color: KYC_COLORS.completed },
    { name: 'Pending', value: userStats.kycStatistics.pending || 0, color: KYC_COLORS.pending },
    { name: 'Rejected', value: userStats.kycStatistics.rejected || 0, color: KYC_COLORS.rejected },
  ] : [];

  // Prepare data for API usage chart (top 5 businesses)
  // Note: Backend doesn't currently provide requestsByBusiness
  const apiUsageData = apiStats?.requestsByBusiness
    ? apiStats.requestsByBusiness.slice(0, 5).map(item => ({
        name: item.userEmail.split('@')[0], // Show username part only
        requests: item.requestCount,
      }))
    : [];

  // Check if KYC statistics are available
  const hasKycStats = userStats?.kycStatistics && 
    (userStats.kycStatistics.completed > 0 || 
     userStats.kycStatistics.pending > 0 || 
     userStats.kycStatistics.rejected > 0);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* User Statistics Card */}
      <div
        className="p-6 rounded-lg border"
        style={{
          background: 'rgba(183,148,246,0.04)',
          borderColor: 'rgba(183,148,246,0.15)',
        }}
      >
        <div className="flex items-center gap-3 mb-4">
          <Users className="w-6 h-6" style={{ color: '#B794F6' }} />
          <h2 className="text-xl font-semibold" style={{ color: '#F0EAFF' }}>
            User Statistics
          </h2>
        </div>

        {userStats ? (
          <>
            <div className="mb-4">
              <p className="text-3xl font-bold" style={{ color: '#B794F6' }}>
                {userStats.total || 0}
              </p>
              <p className="text-sm" style={{ color: 'rgba(240,234,255,0.6)' }}>
                Total Users
              </p>
            </div>

            {/* Role Distribution Chart */}
            {roleData.length > 0 && (
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={roleData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, value }) => `${name}: ${value}`}
                      outerRadius={60}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {roleData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        background: 'rgba(30,27,75,0.95)',
                        border: '1px solid rgba(183,148,246,0.3)',
                        borderRadius: '8px',
                        color: '#F0EAFF',
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* Role Breakdown */}
            <div className="mt-4 space-y-2">
              <div className="flex justify-between items-center">
                <span style={{ color: 'rgba(240,234,255,0.7)' }}>Users</span>
                <span className="font-semibold" style={{ color: ROLE_COLORS.user }}>
                  {userStats.byRole?.user || 0}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span style={{ color: 'rgba(240,234,255,0.7)' }}>Business</span>
                <span className="font-semibold" style={{ color: ROLE_COLORS.business }}>
                  {userStats.byRole?.business || 0}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span style={{ color: 'rgba(240,234,255,0.7)' }}>Admin</span>
                <span className="font-semibold" style={{ color: ROLE_COLORS.admin }}>
                  {userStats.byRole?.admin || 0}
                </span>
              </div>
            </div>

            {/* Status Breakdown */}
            {userStats.byStatus && (
              <div className="mt-4 pt-4 border-t" style={{ borderColor: 'rgba(183,148,246,0.15)' }}>
                <p className="text-sm mb-2" style={{ color: 'rgba(240,234,255,0.7)' }}>
                  By Status
                </p>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span style={{ color: 'rgba(240,234,255,0.6)' }}>Active</span>
                    <span className="font-semibold" style={{ color: '#10B981' }}>
                      {userStats.byStatus.active || 0}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span style={{ color: 'rgba(240,234,255,0.6)' }}>Inactive</span>
                    <span className="font-semibold" style={{ color: '#6B7280' }}>
                      {userStats.byStatus.inactive || 0}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span style={{ color: 'rgba(240,234,255,0.6)' }}>Suspended</span>
                    <span className="font-semibold" style={{ color: '#EF4444' }}>
                      {userStats.byStatus.suspended || 0}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="flex items-center justify-center h-48">
            <p style={{ color: 'rgba(240,234,255,0.5)' }}>Loading...</p>
          </div>
        )}
      </div>

      {/* API Usage Statistics Card */}
      <div
        className="p-6 rounded-lg border"
        style={{
          background: 'rgba(183,148,246,0.04)',
          borderColor: 'rgba(183,148,246,0.15)',
        }}
      >
        <div className="flex items-center gap-3 mb-4">
          <Key className="w-6 h-6" style={{ color: '#B794F6' }} />
          <h2 className="text-xl font-semibold" style={{ color: '#F0EAFF' }}>
            API Usage
          </h2>
        </div>

        {apiStats ? (
          <>
            <div className="mb-4">
              <p className="text-3xl font-bold" style={{ color: '#B794F6' }}>
                {apiStats.totalRequests?.toLocaleString() || 0}
              </p>
              <p className="text-sm" style={{ color: 'rgba(240,234,255,0.6)' }}>
                Total API Requests
              </p>
            </div>

            {/* API Keys Breakdown */}
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span style={{ color: 'rgba(240,234,255,0.7)' }}>Total API Keys</span>
                <span className="font-semibold" style={{ color: '#B794F6' }}>
                  {apiStats.totalKeys || 0}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span style={{ color: 'rgba(240,234,255,0.7)' }}>Active Keys</span>
                <span className="font-semibold" style={{ color: '#10B981' }}>
                  {apiStats.activeKeys || 0}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span style={{ color: 'rgba(240,234,255,0.7)' }}>Revoked Keys</span>
                <span className="font-semibold" style={{ color: '#EF4444' }}>
                  {apiStats.revokedKeys || 0}
                </span>
              </div>
            </div>

            {/* Recent Activity */}
            {apiStats.requestsLast24h !== undefined && (
              <div className="mt-4 pt-4 border-t" style={{ borderColor: 'rgba(183,148,246,0.15)' }}>
                <div className="flex justify-between items-center">
                  <span style={{ color: 'rgba(240,234,255,0.7)' }}>Last 24 Hours</span>
                  <span className="font-semibold" style={{ color: '#F59E0B' }}>
                    {apiStats.requestsLast24h?.toLocaleString() || 0}
                  </span>
                </div>
              </div>
            )}

            {/* Top Businesses Chart (if available) */}
            {apiUsageData.length > 0 && (
              <div className="mt-4 pt-4 border-t" style={{ borderColor: 'rgba(183,148,246,0.15)' }}>
                <p className="text-sm mb-2" style={{ color: 'rgba(240,234,255,0.7)' }}>
                  Top 5 Businesses by API Usage
                </p>
                <div className="h-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={apiUsageData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(183,148,246,0.1)" />
                      <XAxis
                        dataKey="name"
                        tick={{ fill: 'rgba(240,234,255,0.6)', fontSize: 12 }}
                        stroke="rgba(183,148,246,0.3)"
                      />
                      <YAxis
                        tick={{ fill: 'rgba(240,234,255,0.6)', fontSize: 12 }}
                        stroke="rgba(183,148,246,0.3)"
                      />
                      <Tooltip
                        contentStyle={{
                          background: 'rgba(30,27,75,0.95)',
                          border: '1px solid rgba(183,148,246,0.3)',
                          borderRadius: '8px',
                          color: '#F0EAFF',
                        }}
                      />
                      <Bar dataKey="requests" fill="#B794F6" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="flex items-center justify-center h-48">
            <p style={{ color: 'rgba(240,234,255,0.5)' }}>Loading...</p>
          </div>
        )}
      </div>

      {/* KYC Statistics Card - Only show if data is available */}
      {hasKycStats && (
        <div
          className="p-6 rounded-lg border lg:col-span-2"
          style={{
            background: 'rgba(183,148,246,0.04)',
            borderColor: 'rgba(183,148,246,0.15)',
          }}
        >
          <div className="flex items-center gap-3 mb-4">
            <Shield className="w-6 h-6" style={{ color: '#B794F6' }} />
            <h2 className="text-xl font-semibold" style={{ color: '#F0EAFF' }}>
              KYC Verification
            </h2>
          </div>

          {/* KYC Status Chart */}
          {kycData.length > 0 && (
            <div className="h-48 mb-4">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={kycData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, value }) => `${name}: ${value}`}
                    outerRadius={60}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {kycData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      background: 'rgba(30,27,75,0.95)',
                      border: '1px solid rgba(183,148,246,0.3)',
                      borderRadius: '8px',
                      color: '#F0EAFF',
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* KYC Status Breakdown */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5" style={{ color: KYC_COLORS.completed }} />
                <span style={{ color: 'rgba(240,234,255,0.7)' }}>Completed</span>
              </div>
              <span className="font-semibold" style={{ color: KYC_COLORS.completed }}>
                {userStats.kycStatistics.completed || 0}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5" style={{ color: KYC_COLORS.pending }} />
                <span style={{ color: 'rgba(240,234,255,0.7)' }}>Pending</span>
              </div>
              <span className="font-semibold" style={{ color: KYC_COLORS.pending }}>
                {userStats.kycStatistics.pending || 0}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <XCircle className="w-5 h-5" style={{ color: KYC_COLORS.rejected }} />
                <span style={{ color: 'rgba(240,234,255,0.7)' }}>Rejected</span>
              </div>
              <span className="font-semibold" style={{ color: KYC_COLORS.rejected }}>
                {userStats.kycStatistics.rejected || 0}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
