/**
 * Security Monitor Service
 * Detects suspicious activity and triggers alerts
 */

import { supabase } from './databaseService.js';

// Thresholds for suspicious activity detection
const THRESHOLDS = {
  MAX_FAILURES_PER_HOUR: 10,       // Max auth failures per user per hour
  MAX_CROSS_ROLE_ATTEMPTS: 5,      // Max cross-role attempts before alert
  ALERT_WINDOW_MINUTES: 60,        // Time window for counting events
};

/**
 * Detect suspicious activity for a user
 * @param {string} userId - User ID to check
 * @returns {Promise<Object>} Suspicious activity report
 */
export async function detectSuspiciousActivity(userId) {
  if (!userId) return { suspicious: false };

  const windowStart = new Date();
  windowStart.setMinutes(windowStart.getMinutes() - THRESHOLDS.ALERT_WINDOW_MINUTES);

  try {
    // Count denied access attempts in the window
    const { count: deniedCount } = await supabase
      .from('access_control_log')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('access_granted', false)
      .gte('created_at', windowStart.toISOString());

    const suspicious = (deniedCount || 0) >= THRESHOLDS.MAX_FAILURES_PER_HOUR;

    return {
      suspicious,
      deniedCount: deniedCount || 0,
      threshold: THRESHOLDS.MAX_FAILURES_PER_HOUR,
      windowMinutes: THRESHOLDS.ALERT_WINDOW_MINUTES,
    };
  } catch (error) {
    console.error('Error detecting suspicious activity:', error);
    return { suspicious: false };
  }
}

/**
 * Detect cross-role access attempts
 * @param {string} userId - User ID to check
 * @param {string} userRole - User's actual role
 * @returns {Promise<boolean>} True if suspicious cross-role activity detected
 */
export async function detectCrossRoleAttempts(userId, userRole) {
  if (!userId) return false;

  const windowStart = new Date();
  windowStart.setMinutes(windowStart.getMinutes() - THRESHOLDS.ALERT_WINDOW_MINUTES);

  try {
    const { count } = await supabase
      .from('access_control_log')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('access_granted', false)
      .gte('created_at', windowStart.toISOString());

    return (count || 0) >= THRESHOLDS.MAX_CROSS_ROLE_ATTEMPTS;
  } catch (error) {
    console.error('Error detecting cross-role attempts:', error);
    return false;
  }
}

/**
 * Alert security team about suspicious activity
 * @param {Object} user - User object
 * @param {string} reason - Reason for alert
 * @param {Object} details - Additional details
 * @returns {Promise<void>}
 */
export async function alertSecurityTeam(user, reason, details = {}) {
  const alert = {
    timestamp: new Date().toISOString(),
    userId: user?.id || user?.userId,
    userRole: user?.role,
    reason,
    details,
    severity: 'warning',
  };

  // Log to console (in production, send to monitoring service like Sentry, PagerDuty, etc.)
  console.warn('[SECURITY ALERT]', JSON.stringify(alert, null, 2));

  // Store alert in access_control_log with special marker
  try {
    await supabase
      .from('access_control_log')
      .insert({
        user_id: alert.userId || null,
        user_role: alert.userRole || 'unknown',
        endpoint: '/security/alert',
        method: 'ALERT',
        access_granted: false,
        reason: `SECURITY_ALERT: ${reason}`,
      });
  } catch (error) {
    console.error('Error storing security alert:', error);
  }
}

/**
 * Check and alert on suspicious activity after an access denial
 * Call this after logging a denied access attempt
 * @param {Object} user - User object
 * @param {string} endpoint - Endpoint that was denied
 * @returns {Promise<void>}
 */
export async function checkAndAlertIfSuspicious(user, endpoint) {
  if (!user?.id && !user?.userId) return;

  const userId = user.userId || user.id;

  try {
    const activity = await detectSuspiciousActivity(userId);

    if (activity.suspicious) {
      await alertSecurityTeam(user, `Repeated access failures (${activity.deniedCount} in ${activity.windowMinutes} min)`, {
        endpoint,
        deniedCount: activity.deniedCount,
      });
    }
  } catch (error) {
    console.error('Error in checkAndAlertIfSuspicious:', error);
  }
}

/**
 * Get recent security events summary
 * @param {number} hours - Number of hours to look back (default: 24)
 * @returns {Promise<Object>} Security summary
 */
export async function getSecuritySummary(hours = 24) {
  const windowStart = new Date();
  windowStart.setHours(windowStart.getHours() - hours);

  try {
    // Total denied attempts
    const { count: totalDenied } = await supabase
      .from('access_control_log')
      .select('*', { count: 'exact', head: true })
      .eq('access_granted', false)
      .gte('created_at', windowStart.toISOString());

    // Unique users with denied attempts
    const { data: deniedUsers } = await supabase
      .from('access_control_log')
      .select('user_id')
      .eq('access_granted', false)
      .gte('created_at', windowStart.toISOString())
      .not('user_id', 'is', null);

    const uniqueUsers = new Set(deniedUsers?.map(r => r.user_id) || []).size;

    // Most targeted endpoints
    const { data: endpointData } = await supabase
      .from('access_control_log')
      .select('endpoint')
      .eq('access_granted', false)
      .gte('created_at', windowStart.toISOString());

    const endpointCounts = {};
    endpointData?.forEach(r => {
      endpointCounts[r.endpoint] = (endpointCounts[r.endpoint] || 0) + 1;
    });

    const topEndpoints = Object.entries(endpointCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([endpoint, count]) => ({ endpoint, count }));

    return {
      windowHours: hours,
      totalDeniedAttempts: totalDenied || 0,
      uniqueUsersWithDenials: uniqueUsers,
      topTargetedEndpoints: topEndpoints,
      generatedAt: new Date().toISOString(),
    };
  } catch (error) {
    console.error('Error getting security summary:', error);
    throw new Error('Failed to get security summary');
  }
}
