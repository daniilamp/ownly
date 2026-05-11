/**
 * Business Application Service
 * Handles the full lifecycle of business registration applications:
 * creation, retrieval, validation, approval, and rejection.
 */

import { z } from 'zod';
import crypto from 'crypto';
import { supabase } from './databaseService.js';

// ─── Validation Schema ────────────────────────────────────────────────────────

export const registrationSchema = z.object({
  companyName: z.string().min(2).max(200),
  companyWebsite: z.string().url().optional().or(z.literal('')),
  contactEmail: z.string().email(),
  contactName: z.string().min(2).max(255),
  useCase: z.string().min(10).max(2000),
  expectedMonthlyVolume: z.number().int().positive().optional(),
});

// ─── Validation ───────────────────────────────────────────────────────────────

/**
 * Validate registration input using Zod schema.
 * @param {object} data - Registration form data
 * @returns {{ valid: boolean, errors: object }}
 */
export function validateRegistration(data) {
  const result = registrationSchema.safeParse(data);

  if (result.success) {
    return { valid: true, errors: {} };
  }

  // Map Zod issues to a field → message object
  const errors = {};
  for (const issue of result.error.issues) {
    const field = issue.path.join('.');
    if (!errors[field]) {
      errors[field] = issue.message;
    }
  }

  return { valid: false, errors };
}

// ─── Create Application ───────────────────────────────────────────────────────

/**
 * Create a new business application with status "pending".
 * @param {object} data - Validated registration data (camelCase keys)
 * @returns {Promise<{ application: object }>}
 * @throws {object} { status: 409, code: 'DUPLICATE_APPLICATION', message: string } on duplicate
 */
export async function createApplication(data) {
  const insertData = {
    company_name: data.companyName,
    company_website: data.companyWebsite || null,
    contact_email: data.contactEmail,
    contact_name: data.contactName,
    use_case: data.useCase,
    expected_monthly_volume: data.expectedMonthlyVolume || null,
    status: 'pending',
  };

  const { data: application, error } = await supabase
    .from('business_applications')
    .insert(insertData)
    .select()
    .single();

  if (error) {
    // Unique partial index violation (duplicate pending email)
    if (error.code === '23505') {
      const duplicateError = new Error('An application for this email is already pending');
      duplicateError.status = 409;
      duplicateError.code = 'DUPLICATE_APPLICATION';
      throw duplicateError;
    }
    console.error('Database error creating business application:', error);
    throw new Error('Failed to create business application');
  }

  return { application };
}

// ─── Retrieve Applications ────────────────────────────────────────────────────

/**
 * Get a business application by contact email.
 * Returns the most recent application for that email.
 * @param {string} email
 * @returns {Promise<{ application: object | null }>}
 */
export async function getApplicationByEmail(email) {
  const { data, error } = await supabase
    .from('business_applications')
    .select('*')
    .eq('contact_email', email)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (error && error.code !== 'PGRST116') {
    console.error('Database error getting application by email:', error);
    throw new Error('Failed to get business application');
  }

  return { application: data || null };
}

/**
 * Get a business application by UUID.
 * @param {string} id - Application UUID
 * @returns {Promise<{ application: object }>}
 * @throws {object} { status: 404, code: 'APPLICATION_NOT_FOUND' } if not found
 */
export async function getApplicationById(id) {
  const { data, error } = await supabase
    .from('business_applications')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      const notFoundError = new Error('Application not found');
      notFoundError.status = 404;
      notFoundError.code = 'APPLICATION_NOT_FOUND';
      throw notFoundError;
    }
    console.error('Database error getting application by ID:', error);
    throw new Error('Failed to get business application');
  }

  return { application: data };
}

/**
 * List business applications with optional filters.
 * @param {object} [filters]
 * @param {string} [filters.status] - Filter by status ('pending', 'approved', 'rejected')
 * @param {number} [filters.limit=100] - Max results
 * @returns {Promise<{ applications: object[] }>}
 */
export async function listApplications(filters = {}) {
  const { status, limit = 100 } = filters;

  let query = supabase
    .from('business_applications')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit);

  if (status) {
    query = query.eq('status', status);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Database error listing business applications:', error);
    throw new Error('Failed to list business applications');
  }

  return { applications: data || [] };
}

// ─── Status Transitions ───────────────────────────────────────────────────────

/**
 * Approve a pending business application.
 * - Transitions status to "approved"
 * - Creates a Supabase Auth user with a temporary password
 * - Creates a user record with "business" role
 * - Records reviewer and timestamp
 *
 * @param {string} id - Application UUID
 * @param {string} reviewerId - Admin user UUID who is approving
 * @returns {Promise<{ application: object, user: object }>}
 * @throws {object} { status: 409, code: 'INVALID_STATUS_TRANSITION' } if not pending
 */
export async function approveApplication(id, reviewerId) {
  // 1. Get the application and verify it's pending
  const { application } = await getApplicationById(id);

  if (application.status !== 'pending') {
    const err = new Error('Application is no longer pending');
    err.status = 409;
    err.code = 'INVALID_STATUS_TRANSITION';
    throw err;
  }

  // 2. Create Supabase Auth user with a temporary password
  const tempPassword = crypto.randomBytes(16).toString('hex');

  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email: application.contact_email,
    password: tempPassword,
    email_confirm: true,
  });

  if (authError) {
    console.error('Error creating auth user for business application:', authError);
    throw new Error(`Failed to create user account: ${authError.message}`);
  }

  // 3. Create user record in users table with "business" role
  const { data: userRecord, error: userError } = await supabase
    .from('users')
    .insert({
      email: application.contact_email,
      role: 'business',
      status: 'active',
      supabase_user_id: authData.user.id,
    })
    .select()
    .single();

  if (userError) {
    console.error('Error creating user record for business application:', userError);
    // If user record creation fails, we still have the auth user — log but continue
    // In production you might want to clean up the auth user here
    throw new Error(`Failed to create user record: ${userError.message}`);
  }

  // 4. Update application status to "approved"
  const { data: updatedApp, error: updateError } = await supabase
    .from('business_applications')
    .update({
      status: 'approved',
      reviewed_by: reviewerId,
      reviewed_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .single();

  if (updateError) {
    console.error('Error updating application status to approved:', updateError);
    throw new Error('Failed to update application status');
  }

  return { application: updatedApp, user: userRecord };
}

/**
 * Reject a pending business application.
 * - Transitions status to "rejected"
 * - Stores rejection reason
 * - Records reviewer and timestamp
 *
 * @param {string} id - Application UUID
 * @param {string} reviewerId - Admin user UUID who is rejecting
 * @param {string} reason - Rejection reason
 * @returns {Promise<{ application: object }>}
 * @throws {object} { status: 409, code: 'INVALID_STATUS_TRANSITION' } if not pending
 * @throws {object} { status: 400, code: 'MISSING_REASON' } if reason is empty
 */
export async function rejectApplication(id, reviewerId, reason) {
  if (!reason || reason.trim().length === 0) {
    const err = new Error('Rejection reason is required');
    err.status = 400;
    err.code = 'MISSING_REASON';
    throw err;
  }

  // 1. Get the application and verify it's pending
  const { application } = await getApplicationById(id);

  if (application.status !== 'pending') {
    const err = new Error('Application is no longer pending');
    err.status = 409;
    err.code = 'INVALID_STATUS_TRANSITION';
    throw err;
  }

  // 2. Update application status to "rejected"
  const { data: updatedApp, error: updateError } = await supabase
    .from('business_applications')
    .update({
      status: 'rejected',
      reviewed_by: reviewerId,
      reviewed_at: new Date().toISOString(),
      rejection_reason: reason.trim(),
    })
    .eq('id', id)
    .select()
    .single();

  if (updateError) {
    console.error('Error updating application status to rejected:', updateError);
    throw new Error('Failed to update application status');
  }

  return { application: updatedApp };
}
