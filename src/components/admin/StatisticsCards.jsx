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
  const roleData = userStats?.usersByRole ? [
    { name: 'USER', value: userStats.usersByRole.user, color: ROLE_COLORS.user },
    { name: 'BUSINESS', value: userStats.usersByRole.business, color: ROLE_COLORS.business },
    { name: 'ADMIN', value: userStats.usersByRole.admin, color: ROLE_COLORS.admin },
  ] : [];

  // Prepare data for KYC status chart
  const kycData = userStats?.kycStatistics ? [
    { name: 'Completed', value: userStats.kycStatistics.completed, color: KYC_COLORS.completed },
    { name: 'Pending', value: userStats.kycStatistics.pending, color: KYC_COLORS.pending },
    { name: 'Rejected', value: userStats.kycStatistics.rejected, color: KYC_COLORS.rejected },
  ] : [];

  // Prepare data for API usage chart (top 5 businesses)
  const apiUsageData = apiStats?.requestsByBusiness
    ? apiStats.requestsByBusiness.slice(0, 5).map(item => ({
        name: item.userEmail.split('@')[0], // Show username part only
        requests: item.requestCount,
      }))
    : [];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
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
                {userStats.totalUsers || 0}
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
                  {userStats.usersByRole?.user || 0}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span style={{ color: 'rgba(240,234,255,0.7)' }}>Business</span>
                <span className="font-semibold" style={{ color: ROLE_COLORS.business }}>
                  {userStats.usersByRole?.business || 0}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span style={{ color: 'rgba(240,234,255,0.7)' }}>Admin</span>
                <span className="font-semibold" style={{ color: ROLE_COLORS.admin }}>
                  {userStats.usersByRole?.admin || 0}
                </span>
              </div>
            </div>
          </>
        ) : (
          <div className="flex items-center justify-center h-48">
            <p style={{ color: 'rgba(240,234,255,0.5)' }}>Loading...</p>
          </div>
        )}
      </div>

      {/* KYC Statistics Card */}
      <div
        className="p-6 rounded-lg border"
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

        {userStats?.kycStatistics ? (
          <>
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
          </>
        ) : (
          <div className="flex items-center justify-center h-48">
            <p style={{ color: 'rgba(240,234,255,0.5)' }}>Loading...</p>
          </div>
        )}
      </div>

      {/* API Usage Statistics Card */}
      <div
        className="p-6 rounded-lg border lg:col-span-2 xl:col-span-1"
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

            {/* Top Businesses Chart */}
            {apiUsageData.length > 0 && (
              <div className="h-48">
                <p className="text-sm mb-2" style={{ color: 'rgba(240,234,255,0.7)' }}>
                  Top 5 Businesses by API Usage
                </p>
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
            )}
          </>
        ) : (
          <div className="flex items-center justify-center h-48">
            <p style={{ color: 'rgba(240,234,255,0.5)' }}>Loading...</p>
          </div>
        )}
      </div>
    </div>
  );
}
