/**
 * Usage Statistics Service
 * Aggregates and filters API usage data from the api_key_usage table
 * for the Business Portal usage dashboard.
 */

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

/**
 * Build date range filter from options.
 * Defaults to last 30 days if no range specified.
 * @param {object} options - { startDate, endDate }
 * @returns {{ start: string, end: string }}
 */
function getDateRange(options = {}) {
  const end = options.endDate ? new Date(options.endDate) : new Date();
  const start = options.startDate
    ? new Date(options.startDate)
    : new Date(end.getTime() - 30 * 24 * 60 * 60 * 1000);

  return {
    start: start.toISOString(),
    end: end.toISOString(),
  };
}

/**
 * Get overall usage statistics for an API key within a date range.
 * Returns total requests, success count (2xx), and error count (4xx/5xx).
 *
 * @param {string} apiKeyId - UUID of the API key
 * @param {object} options - { startDate, endDate }
 * @returns {Promise<{ totalRequests: number, successCount: number, errorCount: number }>}
 */
export async function getUsageStats(apiKeyId, options = {}) {
  try {
    const { start, end } = getDateRange(options);

    const { data, error } = await supabase
      .from('api_key_usage')
      .select('status_code')
      .eq('api_key_id', apiKeyId)
      .gte('created_at', start)
      .lte('created_at', end);

    if (error) {
      throw new Error(`Failed to get usage stats: ${error.message}`);
    }

    const records = data || [];

    const totalRequests = records.length;
    const successCount = records.filter(
      (r) => r.status_code >= 200 && r.status_code < 300
    ).length;
    const errorCount = records.filter(
      (r) => r.status_code >= 400
    ).length;

    return { totalRequests, successCount, errorCount };
  } catch (err) {
    console.error('Error in getUsageStats:', err);
    throw err;
  }
}

/**
 * Get time-series data — daily request counts for the specified number of days.
 *
 * @param {string} apiKeyId - UUID of the API key
 * @param {number} days - Number of days to look back (default 30)
 * @returns {Promise<{ series: Array<{ date: string, count: number }> }>}
 */
export async function getTimeSeriesData(apiKeyId, days = 30) {
  try {
    const end = new Date();
    const start = new Date(end.getTime() - days * 24 * 60 * 60 * 1000);

    const { data, error } = await supabase
      .from('api_key_usage')
      .select('created_at')
      .eq('api_key_id', apiKeyId)
      .gte('created_at', start.toISOString())
      .lte('created_at', end.toISOString())
      .order('created_at', { ascending: true });

    if (error) {
      throw new Error(`Failed to get time series data: ${error.message}`);
    }

    const records = data || [];

    // Group by date (YYYY-MM-DD)
    const countsByDate = {};
    records.forEach((record) => {
      const date = record.created_at.substring(0, 10); // YYYY-MM-DD
      countsByDate[date] = (countsByDate[date] || 0) + 1;
    });

    // Build series with one entry per day (including days with zero requests)
    const series = [];
    const current = new Date(start);
    current.setUTCHours(0, 0, 0, 0);

    for (let i = 0; i < days; i++) {
      const dateStr = current.toISOString().substring(0, 10);
      series.push({
        date: dateStr,
        count: countsByDate[dateStr] || 0,
      });
      current.setUTCDate(current.getUTCDate() + 1);
    }

    return { series };
  } catch (err) {
    console.error('Error in getTimeSeriesData:', err);
    throw err;
  }
}

/**
 * Get per-endpoint request breakdown within a date range.
 *
 * @param {string} apiKeyId - UUID of the API key
 * @param {object} options - { startDate, endDate }
 * @returns {Promise<{ breakdown: Record<string, number> }>}
 */
export async function getEndpointBreakdown(apiKeyId, options = {}) {
  try {
    const { start, end } = getDateRange(options);

    const { data, error } = await supabase
      .from('api_key_usage')
      .select('endpoint')
      .eq('api_key_id', apiKeyId)
      .gte('created_at', start)
      .lte('created_at', end);

    if (error) {
      throw new Error(`Failed to get endpoint breakdown: ${error.message}`);
    }

    const records = data || [];

    const breakdown = {};
    records.forEach((record) => {
      const ep = record.endpoint;
      breakdown[ep] = (breakdown[ep] || 0) + 1;
    });

    return { breakdown };
  } catch (err) {
    console.error('Error in getEndpointBreakdown:', err);
    throw err;
  }
}

/**
 * Get average response time in milliseconds within a date range.
 *
 * @param {string} apiKeyId - UUID of the API key
 * @param {object} options - { startDate, endDate }
 * @returns {Promise<{ avgMs: number }>}
 */
export async function getResponseTimeAverage(apiKeyId, options = {}) {
  try {
    const { start, end } = getDateRange(options);

    const { data, error } = await supabase
      .from('api_key_usage')
      .select('response_time_ms')
      .eq('api_key_id', apiKeyId)
      .gte('created_at', start)
      .lte('created_at', end);

    if (error) {
      throw new Error(`Failed to get response time average: ${error.message}`);
    }

    const records = data || [];

    if (records.length === 0) {
      return { avgMs: 0 };
    }

    const total = records.reduce(
      (sum, r) => sum + (r.response_time_ms || 0),
      0
    );
    const avgMs = Math.round(total / records.length);

    return { avgMs };
  } catch (err) {
    console.error('Error in getResponseTimeAverage:', err);
    throw err;
  }
}
