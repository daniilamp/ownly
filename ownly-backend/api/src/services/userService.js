/**
 * User Service
 * Handles user management and role operations for RBAC system
 */

import { supabase } from './databaseService.js';

/**
 * Valid role types
 */
export const VALID_ROLES = ['user', 'business', 'admin'];

/**
 * Valid status types
 */
export const VALID_STATUSES = ['active', 'inactive', 'suspended'];

/**
 * Validate role value
 * @param {string} role - Role to validate
 * @throws {Error} If role is invalid
 */
function validateRole(role) {
  if (!VALID_ROLES.includes(role)) {
    throw new Error(`Invalid role: ${role}. Must be one of: ${VALID_ROLES.join(', ')}`);
  }
}

/**
 * Validate status value
 * @param {string} status - Status to validate
 * @throws {Error} If status is invalid
 */
function validateStatus(status) {
  if (!VALID_STATUSES.includes(status)) {
    throw new Error(`Invalid status: ${status}. Must be one of: ${VALID_STATUSES.join(', ')}`);
  }
}

/**
 * Create a new user
 * @param {Object} userData - User data
 * @param {string} userData.email - User email (required)
 * @param {string} [userData.role='user'] - User role (default: 'user')
 * @param {string} [userData.supabaseUserId] - Supabase auth user ID
 * @param {string} [userData.status='active'] - Account status (default: 'active')
 * @returns {Promise<Object>} Created user record
 */
export async function createUser(userData) {
  const { email, role = 'user', supabaseUserId, status = 'active' } = userData;

  if (!email) {
    throw new Error('Email is required');
  }

  // Validate role and status
  validateRole(role);
  validateStatus(status);

  const insertData = {
    email,
    role,
    status,
  };

  if (supabaseUserId) {
    insertData.supabase_user_id = supabaseUserId;
  }

  const { data: user, error } = await supabase
    .from('users')
    .insert(insertData)
    .select()
    .single();

  if (error) {
    console.error('Database error creating user:', error);
    
    // Handle unique constraint violations
    if (error.code === '23505') {
      if (error.message.includes('email')) {
        throw new Error('User with this email already exists');
      }
      if (error.message.includes('supabase_user_id')) {
        throw new Error('User with this Supabase ID already exists');
      }
    }
    
    throw new Error('Failed to create user');
  }

  return user;
}

/**
 * Get user by ID
 * @param {string} userId - User ID (UUID)
 * @returns {Promise<Object|null>} User record or null if not found
 */
export async function getUserById(userId) {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', userId)
    .single();

  if (error && error.code !== 'PGRST116') { // PGRST116 = not found
    console.error('Database error getting user by ID:', error);
    throw new Error('Failed to get user');
  }

  return data;
}

/**
 * Get user by email
 * @param {string} email - User email
 * @returns {Promise<Object|null>} User record or null if not found
 */
export async function getUserByEmail(email) {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('email', email)
    .single();

  if (error && error.code !== 'PGRST116') {
    console.error('Database error getting user by email:', error);
    throw new Error('Failed to get user');
  }

  return data;
}

/**
 * Get user by Supabase user ID
 * @param {string} supabaseUserId - Supabase auth user ID
 * @returns {Promise<Object|null>} User record or null if not found
 */
export async function getUserBySupabaseId(supabaseUserId) {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('supabase_user_id', supabaseUserId)
    .single();

  if (error && error.code !== 'PGRST116') {
    console.error('Database error getting user by Supabase ID:', error);
    throw new Error('Failed to get user');
  }

  return data;
}

/**
 * Update user
 * @param {string} userId - User ID
 * @param {Object} updates - Fields to update
 * @returns {Promise<Object>} Updated user record
 */
export async function updateUser(userId, updates) {
  // Validate role if being updated
  if (updates.role) {
    validateRole(updates.role);
  }

  // Validate status if being updated
  if (updates.status) {
    validateStatus(updates.status);
  }

  // Prepare update data
  const updateData = { ...updates };
  
  // Don't allow direct ID updates
  delete updateData.id;
  delete updateData.created_at;

  const { data: user, error } = await supabase
    .from('users')
    .update(updateData)
    .eq('id', userId)
    .select()
    .single();

  if (error) {
    console.error('Database error updating user:', error);
    throw new Error('Failed to update user');
  }

  return user;
}

/**
 * Update user's last login timestamp
 * @param {string} userId - User ID
 * @returns {Promise<void>}
 */
export async function updateLastLogin(userId) {
  const { error } = await supabase
    .from('users')
    .update({ last_login_at: new Date().toISOString() })
    .eq('id', userId);

  if (error) {
    console.error('Database error updating last login:', error);
    // Don't throw - this is not critical
  }
}

/**
 * Get user's role
 * @param {string} userId - User ID
 * @returns {Promise<string>} User role
 */
export async function getUserRole(userId) {
  const { data, error } = await supabase
    .from('users')
    .select('role')
    .eq('id', userId)
    .single();

  if (error) {
    console.error('Database error getting user role:', error);
    throw new Error('Failed to get user role');
  }

  return data?.role;
}

/**
 * List users by role
 * @param {string} role - Role to filter by
 * @returns {Promise<Array>} Array of users with specified role
 */
export async function listUsersByRole(role) {
  validateRole(role);

  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('role', role)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Database error listing users by role:', error);
    throw new Error('Failed to list users');
  }

  return data || [];
}

/**
 * Search users by email or name
 * @param {string} query - Search query
 * @returns {Promise<Array>} Array of matching users
 */
export async function searchUsers(query) {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .ilike('email', `%${query}%`)
    .order('created_at', { ascending: false })
    .limit(50);

  if (error) {
    console.error('Database error searching users:', error);
    throw new Error('Failed to search users');
  }

  return data || [];
}

/**
 * Get all users with optional filters
 * @param {Object} [filters] - Optional filters
 * @param {string} [filters.role] - Filter by role
 * @param {string} [filters.status] - Filter by status
 * @param {number} [filters.limit=100] - Maximum number of results
 * @returns {Promise<Array>} Array of users
 */
export async function getAllUsers(filters = {}) {
  const { role, status, limit = 100 } = filters;

  let query = supabase
    .from('users')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit);

  if (role) {
    validateRole(role);
    query = query.eq('role', role);
  }

  if (status) {
    validateStatus(status);
    query = query.eq('status', status);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Database error getting all users:', error);
    throw new Error('Failed to get users');
  }

  return data || [];
}

/**
 * Delete user (soft delete by setting status to inactive)
 * @param {string} userId - User ID
 * @returns {Promise<Object>} Updated user record
 */
export async function deactivateUser(userId) {
  return updateUser(userId, { status: 'inactive' });
}

/**
 * Reactivate user
 * @param {string} userId - User ID
 * @returns {Promise<Object>} Updated user record
 */
export async function reactivateUser(userId) {
  return updateUser(userId, { status: 'active' });
}

/**
 * Check if user exists by email
 * @param {string} email - User email
 * @returns {Promise<boolean>} True if user exists
 */
export async function userExists(email) {
  const user = await getUserByEmail(email);
  return user !== null;
}

/**
 * Get user count by role
 * @returns {Promise<Object>} Object with counts by role
 */
export async function getUserCountByRole() {
  const counts = {
    user: 0,
    business: 0,
    admin: 0,
    total: 0,
  };

  for (const role of VALID_ROLES) {
    const { count, error } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true })
      .eq('role', role);

    if (!error) {
      counts[role] = count || 0;
      counts.total += count || 0;
    }
  }

  return counts;
}

/**
 * Change user role with audit logging
 * @param {string} userId - User ID to change role for
 * @param {string} newRole - New role to assign
 * @param {string} changedBy - Admin user ID making the change
 * @param {string} reason - Reason for role change
 * @returns {Promise<Object>} Updated user record
 */
export async function changeUserRole(userId, newRole, changedBy, reason) {
  // Validate new role
  validateRole(newRole);

  // Get current user to log old role
  const currentUser = await getUserById(userId);
  if (!currentUser) {
    throw new Error('User not found');
  }

  const oldRole = currentUser.role;

  // Don't update if role is the same
  if (oldRole === newRole) {
    return currentUser;
  }

  // Update user role
  const updatedUser = await updateUser(userId, { role: newRole });

  // Log role change
  await logRoleChange(userId, oldRole, newRole, changedBy, reason);

  return updatedUser;
}

/**
 * Log role change to audit log
 * @param {string} userId - User ID
 * @param {string} oldRole - Previous role
 * @param {string} newRole - New role
 * @param {string} changedBy - Admin user ID
 * @param {string} reason - Reason for change
 * @returns {Promise<Object>} Log entry
 */
export async function logRoleChange(userId, oldRole, newRole, changedBy, reason) {
  const { data, error } = await supabase
    .from('role_change_log')
    .insert({
      user_id: userId,
      old_role: oldRole,
      new_role: newRole,
      changed_by: changedBy,
      reason: reason || 'No reason provided',
    })
    .select()
    .single();

  if (error) {
    console.error('Database error logging role change:', error);
    // Don't throw - logging failure shouldn't block the operation
  }

  return data;
}

/**
 * Get role change history for a user
 * @param {string} userId - User ID
 * @returns {Promise<Array>} Array of role change log entries
 */
export async function getRoleChangeHistory(userId) {
  const { data, error } = await supabase
    .from('role_change_log')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Database error getting role change history:', error);
    throw new Error('Failed to get role change history');
  }

  return data || [];
}

/**
 * Get all role changes (admin only)
 * @param {Object} [filters] - Optional filters
 * @param {string} [filters.userId] - Filter by user ID
 * @param {string} [filters.changedBy] - Filter by admin who made change
 * @param {number} [filters.limit=100] - Maximum number of results
 * @returns {Promise<Array>} Array of role change log entries
 */
export async function getAllRoleChanges(filters = {}) {
  const { userId, changedBy, limit = 100 } = filters;

  let query = supabase
    .from('role_change_log')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit);

  if (userId) {
    query = query.eq('user_id', userId);
  }

  if (changedBy) {
    query = query.eq('changed_by', changedBy);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Database error getting all role changes:', error);
    throw new Error('Failed to get role changes');
  }

  return data || [];
}
