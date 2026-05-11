/**
 * Retry Service
 * Handles automatic retry of failed blockchain credential publishing
 * 
 * Retry strategy: exponential backoff
 * Intervals: 60s, 300s, 1800s, 7200s, 14400s (1min, 5min, 30min, 2h, 4h)
 * Maximum attempts: 5
 */

import { supabase } from './databaseService.js';
import * as blockchainService from './blockchainService.js';

/**
 * Backoff intervals in seconds for each retry attempt
 */
const BACKOFF_INTERVALS = [60, 300, 1800, 7200, 14400]; // 1min, 5min, 30min, 2h, 4h

/**
 * Maximum number of retry attempts before marking as permanently failed
 */
const MAX_RETRIES = 5;

/**
 * Interval for checking the retry queue (in milliseconds)
 */
const QUEUE_CHECK_INTERVAL = 60 * 1000; // 60 seconds

let retryInterval = null;

/**
 * Calculate next retry time based on attempt number
 * @param {number} attemptNumber - Current attempt number (0-indexed)
 * @returns {Date} Next retry timestamp
 */
export function calculateNextRetry(attemptNumber) {
  const backoffSeconds = BACKOFF_INTERVALS[Math.min(attemptNumber, BACKOFF_INTERVALS.length - 1)];
  return new Date(Date.now() + backoffSeconds * 1000);
}

/**
 * Schedule a retry for a failed credential
 * @param {string} credentialId - Credential ID
 * @param {number} currentRetryCount - Current retry count
 * @param {string} error - Error message from last attempt
 * @returns {Promise<void>}
 */
export async function scheduleRetry(credentialId, currentRetryCount, error) {
  const newRetryCount = currentRetryCount + 1;

  if (newRetryCount >= MAX_RETRIES) {
    // Mark as permanently failed
    await supabase
      .from('credentials')
      .update({
        status: 'permanently_failed',
        retry_count: newRetryCount,
        last_error: error,
        next_retry_at: null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', credentialId);

    console.log(`[retry] Credential ${credentialId} permanently failed after ${newRetryCount} attempts`);
    return;
  }

  const nextRetryAt = calculateNextRetry(newRetryCount);

  await supabase
    .from('credentials')
    .update({
      status: 'failed',
      retry_count: newRetryCount,
      last_error: error,
      next_retry_at: nextRetryAt.toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', credentialId);

  console.log(`[retry] Credential ${credentialId} scheduled for retry #${newRetryCount} at ${nextRetryAt.toISOString()}`);
}

/**
 * Attempt to retry publishing a single credential
 * @param {Object} credential - Credential record from database
 * @returns {Promise<boolean>} True if successful
 */
export async function retryCredential(credential) {
  try {
    console.log(`[retry] Attempting to publish credential ${credential.id} (attempt #${(credential.retry_count || 0) + 1})`);

    // Initialize blockchain if needed
    if (!await blockchainService.isBlockchainConnected()) {
      await blockchainService.initializeBlockchain();
    }

    // Attempt publishing
    const result = await blockchainService.publishCredential(credential);

    // Success — update credential
    await supabase
      .from('credentials')
      .update({
        status: 'published',
        blockchain_tx_hash: result.txHash,
        last_error: null,
        next_retry_at: null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', credential.id);

    console.log(`[retry] Credential ${credential.id} published successfully: ${result.txHash}`);
    return true;
  } catch (err) {
    console.error(`[retry] Failed to publish credential ${credential.id}:`, err.message);

    // Schedule next retry
    await scheduleRetry(credential.id, credential.retry_count || 0, err.message);
    return false;
  }
}

/**
 * Process the retry queue
 * Finds all credentials that are due for retry and attempts to publish them
 * @returns {Promise<{ processed: number, succeeded: number, failed: number }>}
 */
export async function processRetryQueue() {
  try {
    const now = new Date().toISOString();

    // Find credentials ready for retry
    const { data: credentials, error } = await supabase
      .from('credentials')
      .select('*')
      .eq('status', 'failed')
      .lt('retry_count', MAX_RETRIES)
      .lte('next_retry_at', now)
      .order('next_retry_at', { ascending: true })
      .limit(10); // Process max 10 at a time

    if (error) {
      console.error('[retry] Error fetching retry queue:', error);
      return { processed: 0, succeeded: 0, failed: 0 };
    }

    if (!credentials || credentials.length === 0) {
      return { processed: 0, succeeded: 0, failed: 0 };
    }

    console.log(`[retry] Processing ${credentials.length} credentials from retry queue`);

    let succeeded = 0;
    let failed = 0;

    for (const credential of credentials) {
      const success = await retryCredential(credential);
      if (success) {
        succeeded++;
      } else {
        failed++;
      }
    }

    console.log(`[retry] Queue processed: ${succeeded} succeeded, ${failed} failed`);
    return { processed: credentials.length, succeeded, failed };
  } catch (err) {
    console.error('[retry] Error processing retry queue:', err);
    return { processed: 0, succeeded: 0, failed: 0 };
  }
}

/**
 * Process pending credentials (those that never got a first attempt)
 * Runs on startup to catch any credentials stuck in 'pending' state
 * @returns {Promise<void>}
 */
export async function processPendingCredentials() {
  try {
    // Find credentials stuck in pending state (older than 5 minutes)
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();

    const { data: credentials, error } = await supabase
      .from('credentials')
      .select('*')
      .eq('status', 'pending')
      .lt('created_at', fiveMinutesAgo)
      .limit(10);

    if (error || !credentials || credentials.length === 0) {
      return;
    }

    console.log(`[retry] Found ${credentials.length} pending credentials to process`);

    for (const credential of credentials) {
      await retryCredential(credential);
    }
  } catch (err) {
    console.error('[retry] Error processing pending credentials:', err);
  }
}

/**
 * Initialize the retry service
 * Processes pending/failed credentials on startup, then sets up periodic checking
 */
export async function initRetryService() {
  console.log('[retry] Initializing retry service...');

  // Process any pending credentials on startup
  try {
    await processPendingCredentials();
    await processRetryQueue();
  } catch (err) {
    console.warn('[retry] Initial queue processing failed (non-fatal):', err.message);
  }

  // Set up periodic queue checking
  retryInterval = setInterval(async () => {
    try {
      await processRetryQueue();
    } catch (err) {
      console.error('[retry] Periodic queue check failed:', err.message);
    }
  }, QUEUE_CHECK_INTERVAL);

  console.log(`[retry] Retry service started (checking every ${QUEUE_CHECK_INTERVAL / 1000}s)`);
}

/**
 * Stop the retry service (for graceful shutdown)
 */
export function stopRetryService() {
  if (retryInterval) {
    clearInterval(retryInterval);
    retryInterval = null;
    console.log('[retry] Retry service stopped');
  }
}

/**
 * Get retry queue status (for admin dashboard)
 * @returns {Promise<Object>} Queue statistics
 */
export async function getRetryQueueStatus() {
  const { count: pendingCount } = await supabase
    .from('credentials')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'pending');

  const { count: failedCount } = await supabase
    .from('credentials')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'failed')
    .lt('retry_count', MAX_RETRIES);

  const { count: permanentlyFailedCount } = await supabase
    .from('credentials')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'permanently_failed');

  return {
    pending: pendingCount || 0,
    failedAwaitingRetry: failedCount || 0,
    permanentlyFailed: permanentlyFailedCount || 0,
    maxRetries: MAX_RETRIES,
    checkInterval: QUEUE_CHECK_INTERVAL / 1000,
  };
}

export default {
  initRetryService,
  stopRetryService,
  processRetryQueue,
  processPendingCredentials,
  retryCredential,
  scheduleRetry,
  calculateNextRetry,
  getRetryQueueStatus,
};
