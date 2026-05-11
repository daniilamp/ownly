/**
 * UsageDashboard Component
 * Displays API usage statistics with charts and date range filtering.
 * 
 * Features:
 * - Total API requests for current billing period
 * - Time-series chart of requests over last 30 days
 * - Endpoint breakdown (verify, unique check, email lookup)
 * - Success (2xx) and error (4xx/5xx) counts
 * - Average response time
 * - Custom date range picker that filters all statistics
 * 
 * Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6
 */

import { useState, useEffect, useCallback } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from 'recharts';
import {
  Activity, CheckCircle2, AlertTriangle, Clock, Calendar,
  TrendingUp, Loader2, AlertCircle, RefreshCw,
} from 'lucide-react';
import { format, subDays, parseISO } from 'date-fns';

const API_BASE = import.meta.env.VITE_OWNLY_API_URL || 'http://localhost:3001';

/**
 * Format a date to YYYY-MM-DD for API query params
 */
function toDateString(date) {
  return format(date, 'yyyy-MM-dd');
}

/**
 * Get default date range: last 30 days
 */
function getDefaultDateRange() {
  const end = new Date();
  const start = subDays(end, 30);
  return { start: toDateString(start), end: toDateString(end) };
}

/**
 * Custom tooltip for the time-series chart
 */
function ChartTooltip({ active, payload, label }) {
  if (!active || !payload || !payload.length) return null;
  return (
    <div
      className="rounded-lg px-3 py-2 text-xs"
      style={{
        background: 'rgba(7,5,16,0.95)',
        border: '1px solid rgba(183,148,246,0.3)',
        color: '#F0EAFF',
      }}
    >
      <p className="font-medium mb-1">{label}</p>
      <p style={{ color: '#B794F6' }}>
        {payload[0].value.toLocaleString()} requests
      </p>
    </div>
  );
}

/**
 * Stat card component for displaying key metrics
 */
function StatCard({ icon: Icon, label, value, color, subtext }) {
  return (
    <div
      className="rounded-xl p-5 flex flex-col gap-2"
      style={{
        background: 'rgba(183,148,246,0.04)',
        border: '1px solid rgba(183,148,246,0.12)',
      }}
    >
      <div className="flex items-center gap-2">
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center"
          style={{
            background: `${color}15`,
            border: `1px solid ${color}30`,
          }}
        >
          <Icon className="w-4 h-4" style={{ color }} />
        </div>
        <span className="text-xs font-medium" style={{ color: 'rgba(240,234,255,0.5)' }}>
          {label}
        </span>
      </div>
      <p className="text-2xl font-bold" style={{ color: '#F0EAFF' }}>
        {value}
      </p>
      {subtext && (
        <p className="text-xs" style={{ color: 'rgba(240,234,255,0.4)' }}>
          {subtext}
        </p>
      )}
    </div>
  );
}

export default function UsageDashboard() {
  const [dateRange, setDateRange] = useState(getDefaultDateRange);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchUsageData = useCallback(async (start, end) => {
    setLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem('ownly_token');
      const res = await fetch(
        `${API_BASE}/api/business/usage?start=${start}&end=${end}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!res.ok) {
        if (res.status === 401) throw new Error('Session expired. Please log in again.');
        if (res.status === 403) throw new Error('Access denied. Business account required.');
        throw new Error('Failed to load usage data. Please try again.');
      }

      const json = await res.json();
      setData(json);
    } catch (err) {
      setError(err.message || 'Unable to connect to the server.');
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch data on mount and when date range changes
  useEffect(() => {
    fetchUsageData(dateRange.start, dateRange.end);
  }, [dateRange, fetchUsageData]);

  const handleDateChange = (field) => (e) => {
    setDateRange((prev) => ({ ...prev, [field]: e.target.value }));
  };

  const handleRefresh = () => {
    fetchUsageData(dateRange.start, dateRange.end);
  };

  // Loading state
  if (loading && !data) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <Loader2
            className="w-8 h-8 animate-spin mx-auto mb-3"
            style={{ color: '#B794F6' }}
          />
          <p className="text-sm" style={{ color: 'rgba(240,234,255,0.5)' }}>
            Loading usage statistics...
          </p>
        </div>
      </div>
    );
  }

  // Error state
  if (error && !data) {
    return (
      <div className="flex items-center justify-center py-20">
        <div
          className="max-w-md w-full p-6 rounded-xl text-center"
          style={{
            background: 'rgba(248,113,113,0.06)',
            border: '1px solid rgba(248,113,113,0.2)',
          }}
        >
          <AlertCircle className="w-10 h-10 mx-auto mb-3" style={{ color: '#F87171' }} />
          <p className="text-sm mb-4" style={{ color: '#F87171' }}>{error}</p>
          <button
            onClick={handleRefresh}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all hover:scale-105"
            style={{
              background: 'rgba(183,148,246,0.1)',
              border: '1px solid rgba(183,148,246,0.3)',
              color: '#B794F6',
            }}
          >
            <RefreshCw className="w-4 h-4" />
            Retry
          </button>
        </div>
      </div>
    );
  }

  // Extract data from response
  const stats = data?.stats || { totalRequests: 0, successCount: 0, errorCount: 0 };
  const timeSeries = data?.timeSeries?.series || [];
  const endpointBreakdown = data?.endpointBreakdown?.breakdown || {};
  const avgResponseTime = data?.avgResponseTime?.avgMs || 0;

  // Format time-series data for recharts
  const chartData = timeSeries.map((item) => ({
    date: format(parseISO(item.date), 'MMM dd'),
    count: item.count,
  }));

  // Format endpoint breakdown for display
  const endpointLabels = {
    '/api/identity/verify': 'Verify',
    '/api/identity/unique-check': 'Unique Check',
    '/api/identity/email-lookup': 'Email Lookup',
  };

  const endpointData = Object.entries(endpointBreakdown).map(([endpoint, count]) => ({
    name: endpointLabels[endpoint] || endpoint,
    value: count,
    endpoint,
  }));

  const ENDPOINT_COLORS = ['#B794F6', '#7C3AED', '#A78BFA'];

  // Empty state
  const isEmpty = stats.totalRequests === 0 && timeSeries.length === 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: '#F0EAFF' }}>
            Usage Dashboard
          </h1>
          <p className="text-sm mt-1" style={{ color: 'rgba(240,234,255,0.5)' }}>
            Monitor your API usage and performance metrics
          </p>
        </div>
        <button
          onClick={handleRefresh}
          disabled={loading}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all hover:scale-105 self-start"
          style={{
            background: 'rgba(183,148,246,0.08)',
            border: '1px solid rgba(183,148,246,0.2)',
            color: '#B794F6',
            opacity: loading ? 0.5 : 1,
          }}
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Date Range Picker */}
      <div
        className="rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center gap-3"
        style={{
          background: 'rgba(183,148,246,0.04)',
          border: '1px solid rgba(183,148,246,0.12)',
        }}
      >
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4" style={{ color: '#B794F6' }} />
          <span className="text-sm font-medium" style={{ color: 'rgba(240,234,255,0.7)' }}>
            Date Range:
          </span>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <input
            type="date"
            value={dateRange.start}
            onChange={handleDateChange('start')}
            className="px-3 py-1.5 rounded-lg text-sm outline-none"
            style={{
              background: 'rgba(183,148,246,0.08)',
              border: '1px solid rgba(183,148,246,0.2)',
              color: '#F0EAFF',
              colorScheme: 'dark',
            }}
          />
          <span className="text-sm" style={{ color: 'rgba(240,234,255,0.4)' }}>to</span>
          <input
            type="date"
            value={dateRange.end}
            onChange={handleDateChange('end')}
            className="px-3 py-1.5 rounded-lg text-sm outline-none"
            style={{
              background: 'rgba(183,148,246,0.08)',
              border: '1px solid rgba(183,148,246,0.2)',
              color: '#F0EAFF',
              colorScheme: 'dark',
            }}
          />
        </div>
      </div>

      {/* Empty state */}
      {isEmpty && (
        <div
          className="rounded-xl p-12 text-center"
          style={{
            background: 'rgba(183,148,246,0.04)',
            border: '1px solid rgba(183,148,246,0.12)',
          }}
        >
          <Activity className="w-12 h-12 mx-auto mb-4" style={{ color: 'rgba(183,148,246,0.3)' }} />
          <h3 className="text-lg font-semibold mb-2" style={{ color: '#F0EAFF' }}>
            No usage data yet
          </h3>
          <p className="text-sm" style={{ color: 'rgba(240,234,255,0.5)' }}>
            Start making API requests to see your usage statistics here.
          </p>
        </div>
      )}

      {/* Stats Cards */}
      {!isEmpty && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              icon={TrendingUp}
              label="Total Requests"
              value={stats.totalRequests.toLocaleString()}
              color="#B794F6"
              subtext="Current billing period"
            />
            <StatCard
              icon={CheckCircle2}
              label="Successful (2xx)"
              value={stats.successCount.toLocaleString()}
              color="#34D399"
              subtext={stats.totalRequests > 0
                ? `${((stats.successCount / stats.totalRequests) * 100).toFixed(1)}% success rate`
                : undefined
              }
            />
            <StatCard
              icon={AlertTriangle}
              label="Errors (4xx/5xx)"
              value={stats.errorCount.toLocaleString()}
              color="#F87171"
              subtext={stats.totalRequests > 0
                ? `${((stats.errorCount / stats.totalRequests) * 100).toFixed(1)}% error rate`
                : undefined
              }
            />
            <StatCard
              icon={Clock}
              label="Avg Response Time"
              value={`${Math.round(avgResponseTime)} ms`}
              color="#FBBF24"
            />
          </div>

          {/* Time-Series Chart */}
          {chartData.length > 0 && (
            <div
              className="rounded-xl p-6"
              style={{
                background: 'rgba(183,148,246,0.04)',
                border: '1px solid rgba(183,148,246,0.12)',
              }}
            >
              <h2 className="text-lg font-semibold mb-4" style={{ color: '#F0EAFF' }}>
                Requests Over Time
              </h2>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="rgba(183,148,246,0.1)"
                      vertical={false}
                    />
                    <XAxis
                      dataKey="date"
                      tick={{ fill: 'rgba(240,234,255,0.5)', fontSize: 11 }}
                      axisLine={{ stroke: 'rgba(183,148,246,0.15)' }}
                      tickLine={false}
                      interval="preserveStartEnd"
                    />
                    <YAxis
                      tick={{ fill: 'rgba(240,234,255,0.5)', fontSize: 11 }}
                      axisLine={{ stroke: 'rgba(183,148,246,0.15)' }}
                      tickLine={false}
                      allowDecimals={false}
                    />
                    <Tooltip content={<ChartTooltip />} cursor={{ fill: 'rgba(183,148,246,0.08)' }} />
                    <Bar
                      dataKey="count"
                      fill="#B794F6"
                      radius={[4, 4, 0, 0]}
                      maxBarSize={40}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* Endpoint Breakdown */}
          {endpointData.length > 0 && (
            <div
              className="rounded-xl p-6"
              style={{
                background: 'rgba(183,148,246,0.04)',
                border: '1px solid rgba(183,148,246,0.12)',
              }}
            >
              <h2 className="text-lg font-semibold mb-4" style={{ color: '#F0EAFF' }}>
                Endpoint Breakdown
              </h2>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Pie Chart */}
                <div className="h-56 flex items-center justify-center">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={endpointData}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={80}
                        paddingAngle={3}
                        dataKey="value"
                      >
                        {endpointData.map((entry, index) => (
                          <Cell
                            key={entry.name}
                            fill={ENDPOINT_COLORS[index % ENDPOINT_COLORS.length]}
                          />
                        ))}
                      </Pie>
                      <Legend
                        wrapperStyle={{ fontSize: '12px', color: 'rgba(240,234,255,0.7)' }}
                        formatter={(value) => (
                          <span style={{ color: 'rgba(240,234,255,0.7)' }}>{value}</span>
                        )}
                      />
                      <Tooltip
                        contentStyle={{
                          background: 'rgba(7,5,16,0.95)',
                          border: '1px solid rgba(183,148,246,0.3)',
                          borderRadius: '8px',
                          color: '#F0EAFF',
                          fontSize: '12px',
                        }}
                        formatter={(value) => [value.toLocaleString(), 'Requests']}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                {/* Table */}
                <div className="space-y-3">
                  {endpointData.map((item, index) => {
                    const total = endpointData.reduce((sum, e) => sum + e.value, 0);
                    const percentage = total > 0 ? ((item.value / total) * 100).toFixed(1) : 0;
                    return (
                      <div
                        key={item.name}
                        className="flex items-center justify-between p-3 rounded-lg"
                        style={{
                          background: 'rgba(183,148,246,0.04)',
                          border: '1px solid rgba(183,148,246,0.08)',
                        }}
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className="w-3 h-3 rounded-full"
                            style={{ background: ENDPOINT_COLORS[index % ENDPOINT_COLORS.length] }}
                          />
                          <span className="text-sm font-medium" style={{ color: '#F0EAFF' }}>
                            {item.name}
                          </span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-sm font-semibold" style={{ color: '#F0EAFF' }}>
                            {item.value.toLocaleString()}
                          </span>
                          <span
                            className="text-xs px-2 py-0.5 rounded-full"
                            style={{
                              background: 'rgba(183,148,246,0.1)',
                              color: 'rgba(240,234,255,0.6)',
                            }}
                          >
                            {percentage}%
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
