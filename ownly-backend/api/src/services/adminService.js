/**
 * Admin Service
 * Administrative operations for system management
 * All functions require ADMIN role
 */

import { supabase } from './databaseService.js';
import {
  getAllUsers,
  getUserById,
  changeUserRole,
  deactivateUser as deactivateUserService,
  reactivateUser as reactivateUserService,
  getAllRoleChanges,
  getUserCountByRole,
} from './userService.js';
import { getAccessLogs } from '../middleware/rbacMiddleware.js';

/**
 * Create a user manually (admin onboarding)
 * Creates both a Supabase Auth user and a users table record.
 * @param {string} email - User email
 * @param {string} role - User role (user, business, admin)
 * @param {string} [password] - Optional password (auto-generated if not provided)
 * @param {string} adminId - Admin user ID creating the user
 * @returns {Promise<Object>} { user, tempPassword }
 */
export async function createUserManually(email, role, password, adminId) {
  // Check if user already exists in users table
  const { data: existingUser } = await supabase
    .from('users')
    .select('id')
    .eq('email', email)
    .single();

  if (existingUser) {
    throw new Error('A user with this email already exists');
  }

  // Generate temp password if not provided
  const crypto = await import('crypto');
  const tempPassword = password || crypto.randomBytes(12).toString('base64url');

  // Create Supabase Auth user
  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email,
    password: tempPassword,
    email_confirm: true,
  });

  if (authError) {
    if (authError.message.includes('already been registered')) {
      throw new Error('This email is already registered in the auth system');
    }
    throw new Error(`Failed to create auth user: ${authError.message}`);
  }

  // Create user record in users table
  const { data: userRecord, error: userError } = await supabase
    .from('users')
    .insert({
      email,
      role,
      status: 'active',
      supabase_user_id: authData.user.id,
    })
    .select()
    .single();

  if (userError) {
    console.error('Error creating user record:', userError);
    throw new Error(`Failed to create user record: ${userError.message}`);
  }

  // Log the action
  await logAdminAction(adminId, 'create_user', userRecord.id, `Created ${role} user: ${email}`);

  return {
    user: userRecord,
    tempPassword: password ? undefined : tempPassword, // Only return temp password if auto-generated
  };
}

/**
 * List all users with optional filters
 * @param {Object} [filters] - Optional filters
 * @param {string} [filters.role] - Filter by role
 * @param {string} [filters.status] - Filter by status
 * @param {string} [filters.search] - Search by email
 * @param {number} [filters.limit=100] - Maximum number of results
 * @param {number} [filters.offset=0] - Offset for pagination
 * @returns {Promise<Object>} Object with users array and total count
 */
export async function listAllUsers(filters = {}) {
  const { role, status, search, limit = 100, offset = 0 } = filters;

  let query = supabase
    .from('users')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (role) {
    query = query.eq('role', role);
  }

  if (status) {
    query = query.eq('status', status);
  }

  if (search) {
    query = query.ilike('email', `%${search}%`);
  }

  const { data, error, count } = await query;

  if (error) {
    console.error('Database error listing users:', error);
    throw new Error('Failed to list users');
  }

  return {
    users: data || [],
    total: count || 0,
    limit,
    offset,
  };
}

/**
 * Update user role (admin only)
 * @param {string} userId - User ID to update
 * @param {string} newRole - New role to assign
 * @param {string} adminId - Admin user ID making the change
 * @param {string} reason - Reason for role change
 * @returns {Promise<Object>} Updated user record
 */
export async function updateUserRole(userId, newRole, adminId, reason) {
  // Verify admin exists
  const admin = await getUserById(adminId);
  if (!admin || admin.role !== 'admin') {
    throw new Error('Only admins can change user roles');
  }

  // Change role with audit logging
  const updatedUser = await changeUserRole(userId, newRole, adminId, reason);

  return updatedUser;
}

/**
 * Deactivate user account
 * @param {string} userId - User ID to deactivate
 * @param {string} adminId - Admin user ID making the change
 * @param {string} reason - Reason for deactivation
 * @returns {Promise<Object>} Updated user record
 */
export async function deactivateUser(userId, adminId, reason) {
  // Verify admin exists
  const admin = await getUserById(adminId);
  if (!admin || admin.role !== 'admin') {
    throw new Error('Only admins can deactivate users');
  }

  // Deactivate user
  const updatedUser = await deactivateUserService(userId);

  // Log the action
  await logAdminAction(adminId, 'deactivate_user', userId, reason);

  return updatedUser;
}

/**
 * Reactivate user account
 * @param {string} userId - User ID to reactivate
 * @param {string} adminId - Admin user ID making the change
 * @returns {Promise<Object>} Updated user record
 */
export async function reactivateUser(userId, adminId) {
  // Verify admin exists
  const admin = await getUserById(adminId);
  if (!admin || admin.role !== 'admin') {
    throw new Error('Only admins can reactivate users');
  }

  // Reactivate user
  const updatedUser = await reactivateUserService(userId);

  // Log the action
  await logAdminAction(adminId, 'reactivate_user', userId, 'User reactivated');

  return updatedUser;
}

/**
 * Log admin action
 * @param {string} adminId - Admin user ID
 * @param {string} action - Action performed
 * @param {string} targetId - Target user/resource ID
 * @param {string} details - Action details
 * @returns {Promise<void>}
 */
async function logAdminAction(adminId, action, targetId, details) {
  try {
    await supabase
      .from('access_control_log')
      .insert({
        user_id: adminId,
        user_role: 'admin',
        endpoint: `/admin/${action}`,
        method: 'ADMIN_ACTION',
        access_granted: true,
        reason: `${action}: ${details}`,
      });
  } catch (error) {
    console.error('Error logging admin action:', error);
    // Don't throw - logging failure shouldn't block the operation
  }
}

/**
 * List all API keys
 * @param {Object} [filters] - Optional filters
 * @param {string} [filters.status] - Filter by status (active, revoked, expired)
 * @param {string} [filters.userId] - Filter by user ID
 * @param {number} [filters.limit=100] - Maximum number of results
 * @returns {Promise<Array>} Array of API keys (without sensitive data)
 */
export async function listAllApiKeys(filters = {}) {
  const { status, userId, limit = 100 } = filters;

  let query = supabase
    .from('api_keys')
    .select('id, client_id, client_name, user_id, status, created_at, last_used_at, expires_at, rate_limit')
    .order('created_at', { ascending: false })
    .limit(limit);

  if (status) {
    query = query.eq('status', status);
  }

  if (userId) {
    query = query.eq('user_id', userId);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Database error listing API keys:', error);
    throw new Error('Failed to list API keys');
  }

  return data || [];
}

/**
 * Revoke API key
 * @param {string} apiKeyId - API key ID to revoke
 * @param {string} adminId - Admin user ID making the change
 * @param {string} reason - Reason for revocation
 * @returns {Promise<Object>} Updated API key record
 */
export async function revokeApiKey(apiKeyId, adminId, reason) {
  // Verify admin exists
  const admin = await getUserById(adminId);
  if (!admin || admin.role !== 'admin') {
    throw new Error('Only admins can revoke API keys');
  }

  // Revoke API key
  const { data, error } = await supabase
    .from('api_keys')
    .update({ status: 'revoked' })
    .eq('id', apiKeyId)
    .select()
    .single();

  if (error) {
    console.error('Database error revoking API key:', error);
    throw new Error('Failed to revoke API key');
  }

  // Log the action
  await logAdminAction(adminId, 'revoke_api_key', apiKeyId, reason);

  return data;
}

/**
 * Get access control logs with filters
 * @param {Object} [filters] - Optional filters
 * @param {string} [filters.userId] - Filter by user ID
 * @param {boolean} [filters.accessGranted] - Filter by access granted/denied
 * @param {string} [filters.endpoint] - Filter by endpoint
 * @param {string} [filters.startDate] - Filter by start date (ISO string)
 * @param {string} [filters.endDate] - Filter by end date (ISO string)
 * @param {number} [filters.limit=100] - Maximum number of results
 * @returns {Promise<Array>} Array of access log entries
 */
export async function getAccessControlLogs(filters = {}) {
  return getAccessLogs(filters);
}

/**
 * Get role change logs with filters
 * @param {Object} [filters] - Optional filters
 * @param {string} [filters.userId] - Filter by user ID
 * @param {string} [filters.changedBy] - Filter by admin who made change
 * @param {number} [filters.limit=100] - Maximum number of results
 * @returns {Promise<Array>} Array of role change log entries
 */
export async function getRoleChangeLogs(filters = {}) {
  return getAllRoleChanges(filters);
}

/**
 * Get security events (denied access attempts)
 * @param {Object} [filters] - Optional filters
 * @param {string} [filters.userId] - Filter by user ID
 * @param {string} [filters.endpoint] - Filter by endpoint
 * @param {string} [filters.startDate] - Filter by start date (ISO string)
 * @param {string} [filters.endDate] - Filter by end date (ISO string)
 * @param {number} [filters.limit=100] - Maximum number of results
 * @returns {Promise<Array>} Array of security events
 */
export async function getSecurityEvents(filters = {}) {
  // Security events are access logs where access was denied
  return getAccessLogs({ ...filters, accessGranted: false });
}

/**
 * Get user statistics
 * @returns {Promise<Object>} User statistics
 */
export async function getUserStatistics() {
  const roleCounts = await getUserCountByRole();

  // Get status counts
  const { count: activeCount } = await supabase
    .from('users')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'active');

  const { count: inactiveCount } = await supabase
    .from('users')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'inactive');

  const { count: suspendedCount } = await supabase
    .from('users')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'suspended');

  // Get recent registrations (last 30 days)
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const { count: recentRegistrations } = await supabase
    .from('users')
    .select('*', { count: 'exact', head: true })
    .gte('created_at', thirtyDaysAgo.toISOString());

  return {
    total: roleCounts.total,
    byRole: {
      user: roleCounts.user,
      business: roleCounts.business,
      admin: roleCounts.admin,
    },
    byStatus: {
      active: activeCount || 0,
      inactive: inactiveCount || 0,
      suspended: suspendedCount || 0,
    },
    recentRegistrations: recentRegistrations || 0,
  };
}

/**
 * Get API usage statistics
 * @returns {Promise<Object>} API usage statistics
 */
export async function getApiUsageStatistics() {
  // Total API keys
  const { count: totalKeys } = await supabase
    .from('api_keys')
    .select('*', { count: 'exact', head: true });

  // Active API keys
  const { count: activeKeys } = await supabase
    .from('api_keys')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'active');

  // Revoked API keys
  const { count: revokedKeys } = await supabase
    .from('api_keys')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'revoked');

  // Total API usage (if api_key_usage table exists)
  let totalRequests = 0;
  let requestsLast24h = 0;

  try {
    const { count: total } = await supabase
      .from('api_key_usage')
      .select('*', { count: 'exact', head: true });

    totalRequests = total || 0;

    // Requests in last 24 hours
    const twentyFourHoursAgo = new Date();
    twentyFourHoursAgo.setHours(twentyFourHoursAgo.getHours() - 24);

    const { count: recent } = await supabase
      .from('api_key_usage')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', twentyFourHoursAgo.toISOString());

    requestsLast24h = recent || 0;
  } catch (error) {
    console.warn('API usage table not available:', error.message);
  }

  return {
    totalKeys: totalKeys || 0,
    activeKeys: activeKeys || 0,
    revokedKeys: revokedKeys || 0,
    totalRequests,
    requestsLast24h,
  };
}

/**
 * Get system health status
 * @returns {Promise<Object>} System health information
 */
export async function getSystemHealth() {
  // Check database connectivity by running a simple query
  let dbConnected = false;
  let dbResponseTime = 0;

  try {
    const dbStart = Date.now();
    const { error } = await supabase.from('users').select('id', { count: 'exact', head: true });
    dbResponseTime = Date.now() - dbStart;
    dbConnected = !error;
  } catch {
    dbConnected = false;
  }

  // Get API usage stats for response time and error rate
  let apiResponseTime = 0;
  let apiErrorRate = 0;

  try {
    const twentyFourHoursAgo = new Date();
    twentyFourHoursAgo.setHours(twentyFourHoursAgo.getHours() - 24);

    const { data: usageRecords } = await supabase
      .from('api_key_usage')
      .select('response_time_ms, status_code')
      .gte('created_at', twentyFourHoursAgo.toISOString())
      .limit(1000);

    if (usageRecords && usageRecords.length > 0) {
      const totalMs = usageRecords.reduce((sum, r) => sum + (r.response_time_ms || 0), 0);
      apiResponseTime = Math.round(totalMs / usageRecords.length);
      const errors = usageRecords.filter(r => r.status_code >= 400).length;
      apiErrorRate = (errors / usageRecords.length) * 100;
    }
  } catch {
    // api_key_usage table might not exist yet
  }

  // Get recent security events (last 24 hours)
  let securityEvents = 0;
  try {
    const twentyFourHoursAgo = new Date();
    twentyFourHoursAgo.setHours(twentyFourHoursAgo.getHours() - 24);

    const { count } = await supabase
      .from('access_control_log')
      .select('*', { count: 'exact', head: true })
      .eq('access_granted', false)
      .gte('created_at', twentyFourHoursAgo.toISOString());

    securityEvents = count || 0;
  } catch {
    // access_control_log might not exist
  }

  // Determine overall status
  let status = 'healthy';
  if (!dbConnected) status = 'critical';
  else if (apiErrorRate > 5 || apiResponseTime > 500) status = 'warning';

  return {
    status,
    lastChecked: new Date().toISOString(),
    database: {
      connected: dbConnected,
      responseTime: dbResponseTime,
    },
    api: {
      responseTime: apiResponseTime || undefined,
      errorRate: apiErrorRate || undefined,
      totalRequests24h: 0,
    },
    security: {
      deniedAccessLast24h: securityEvents,
    },
  };
}
