/**
 * API Key Management Service
 * Handles creation, validation, and management of API keys for B2B clients
 */

import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

/**
 * Generate a new API key for a client
 * @param {string} clientId - Unique client identifier
 * @param {string} clientName - Human-readable client name
 * @param {object} options - Additional options
 * @returns {Promise<{apiKey: string, record: object}>}
 */
export async function generateApiKey(clientId, clientName, options = {}) {
  try {
    // Generate random API key
    const apiKey = `ownly_${crypto.randomBytes(32).toString('hex')}`;
    const keyHash = hashApiKey(apiKey);

    const { data, error } = await supabase
      .from('api_keys')
      .insert({
        client_id: clientId,
        client_name: clientName,
        key_hash: keyHash,
        permissions: options.permissions || ['verify:read'],
        rate_limit: options.rateLimit || 1000,
        description: options.description,
        contact_email: options.contactEmail,
        webhook_url: options.webhookUrl,
        expires_at: options.expiresAt,
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create API key: ${error.message}`);
    }

    return {
      apiKey, // Only return the plain key once
      record: data,
    };
  } catch (err) {
    console.error('Error generating API key:', err);
    throw err;
  }
}

/**
 * Revoke an API key
 */
export async function revokeApiKey(apiKeyId) {
  try {
    const { error } = await supabase
      .from('api_keys')
      .update({ status: 'revoked' })
      .eq('id', apiKeyId);

    if (error) {
      throw new Error(`Failed to revoke API key: ${error.message}`);
    }

    return { success: true };
  } catch (err) {
    console.error('Error revoking API key:', err);
    throw err;
  }
}

/**
 * Get API key info (without exposing the key itself)
 */
export async function getApiKeyInfo(apiKeyId) {
  try {
    const { data, error } = await supabase
      .from('api_keys')
      .select('id, client_id, client_name, permissions, rate_limit, status, created_at, expires_at, last_used_at')
      .eq('id', apiKeyId)
      .single();

    if (error) {
      throw new Error(`API key not found: ${error.message}`);
    }

    return data;
  } catch (err) {
    console.error('Error getting API key info:', err);
    throw err;
  }
}

/**
 * List all API keys for a client
 */
export async function listApiKeys(clientId) {
  try {
    const { data, error } = await supabase
      .from('api_keys')
      .select('id, client_id, client_name, permissions, rate_limit, status, created_at, expires_at, last_used_at')
      .eq('client_id', clientId)
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to list API keys: ${error.message}`);
    }

    return data;
  } catch (err) {
    console.error('Error listing API keys:', err);
    throw err;
  }
}

/**
 * Update API key permissions
 */
export async function updateApiKeyPermissions(apiKeyId, permissions) {
  try {
    const { data, error } = await supabase
      .from('api_keys')
      .update({ permissions })
      .eq('id', apiKeyId)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update permissions: ${error.message}`);
    }

    return data;
  } catch (err) {
    console.error('Error updating API key permissions:', err);
    throw err;
  }
}

/**
 * Log API usage for analytics
 */
export async function logApiUsage(apiKeyId, endpoint, method, statusCode, responseTimeMs) {
  try {
    // Non-blocking insert
    supabase
      .from('api_key_usage')
      .insert({
        api_key_id: apiKeyId,
        endpoint,
        method,
        status_code: statusCode,
        response_time_ms: responseTimeMs,
      })
      .then()
      .catch(err => console.error('Error logging API usage:', err));
  } catch (err) {
    console.error('Error in logApiUsage:', err);
  }
}

/**
 * Get API usage statistics
 */
export async function getApiUsageStats(apiKeyId, days = 30) {
  try {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const { data, error } = await supabase
      .from('api_key_usage')
      .select('*')
      .eq('api_key_id', apiKeyId)
      .gte('created_at', startDate.toISOString())
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to get usage stats: ${error.message}`);
    }

    // Calculate statistics
    const stats = {
      totalRequests: data.length,
      successfulRequests: data.filter(r => r.status_code >= 200 && r.status_code < 300).length,
      failedRequests: data.filter(r => r.status_code >= 400).length,
      averageResponseTime: data.length > 0 
        ? Math.round(data.reduce((sum, r) => sum + (r.response_time_ms || 0), 0) / data.length)
        : 0,
      endpointBreakdown: {},
    };

    // Group by endpoint
    data.forEach(usage => {
      if (!stats.endpointBreakdown[usage.endpoint]) {
        stats.endpointBreakdown[usage.endpoint] = 0;
      }
      stats.endpointBreakdown[usage.endpoint]++;
    });

    return stats;
  } catch (err) {
    console.error('Error getting usage stats:', err);
    throw err;
  }
}

/**
 * Regenerate API key — invalidates old key and creates a new one
 * @param {string} apiKeyId - ID of the API key to regenerate
 * @returns {Promise<{apiKey: string, record: object}>}
 */
export async function regenerateApiKey(apiKeyId) {
  try {
    // Get existing key info
    const existing = await getApiKeyInfo(apiKeyId);
    if (!existing) {
      throw new Error('API key not found');
    }

    // Revoke old key
    await revokeApiKey(apiKeyId);

    // Generate new key with same settings
    const newApiKey = `ownly_${crypto.randomBytes(32).toString('hex')}`;
    const keyHash = hashApiKey(newApiKey);

    const { data, error } = await supabase
      .from('api_keys')
      .insert({
        client_id: existing.client_id,
        client_name: existing.client_name,
        key_hash: keyHash,
        permissions: existing.permissions,
        rate_limit: existing.rate_limit,
        user_id: existing.user_id || null,
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to regenerate API key: ${error.message}`);
    }

    // Log regeneration event
    logApiUsage(apiKeyId, '/api-keys/regenerate', 'POST', 200, 0).catch(console.error);

    return {
      apiKey: newApiKey, // Only return plain key once
      record: data,
    };
  } catch (err) {
    console.error('Error regenerating API key:', err);
    throw err;
  }
}

/**
 * Log API key validation failure
 * @param {string} keyFragment - First 8 chars of attempted key (for identification without exposing full key)
 * @param {string} reason - Reason for failure
 * @param {string} endpoint - Endpoint that was attempted
 * @param {string} ipAddress - IP address of requester
 */
export async function logApiKeyFailure(keyFragment, reason, endpoint, ipAddress) {
  try {
    supabase
      .from('api_key_usage')
      .insert({
        api_key_id: null,
        endpoint,
        method: 'AUTH_FAILURE',
        status_code: 401,
        response_time_ms: 0,
        // Store key fragment and reason in a safe way
      })
      .then()
      .catch(err => console.error('Error logging API key failure:', err));

    console.warn(`[SECURITY] API key validation failed: ${reason} | key: ${keyFragment}... | endpoint: ${endpoint} | ip: ${ipAddress}`);
  } catch (err) {
    console.error('Error in logApiKeyFailure:', err);
  }
}

// ============================================
// Business Portal API Key Functions
// ============================================

/**
 * Mask an API key for display purposes.
 * Shows only the last 4 characters (key_prefix) with the rest masked.
 * @param {string} keyPrefix - The last 4 characters of the original API key stored at generation time
 * @returns {string} Masked key string like "ownly_****...****{last4}"
 */
export function maskApiKey(keyPrefix) {
  return `ownly_${'*'.repeat(56)}${keyPrefix}`;
}

/**
 * Generate a new API key for a business portal user.
 * Creates a key with default "verify:read" permission, stores it hashed,
 * and links it to the user_id. Stores last 4 chars as key_prefix for display.
 * @param {string} userId - The user ID to link the key to
 * @param {string} clientName - Human-readable business/client name
 * @returns {Promise<{apiKey: string, record: object}>} The plaintext key (shown once) and the DB record
 */
export async function generateBusinessKey(userId, clientName) {
  try {
    // Generate random API key
    const apiKey = `ownly_${crypto.randomBytes(32).toString('hex')}`;
    const keyHash = hashApiKey(apiKey);
    const keyPrefix = apiKey.slice(-4);

    const { data, error } = await supabase
      .from('api_keys')
      .insert({
        client_id: `business_${userId}`,
        client_name: clientName,
        key_hash: keyHash,
        key_prefix: keyPrefix,
        permissions: ['verify:read'],
        rate_limit: 1000,
        user_id: userId,
        status: 'active',
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to generate business API key: ${error.message}`);
    }

    return {
      apiKey, // Only return the plain key once
      record: data,
    };
  } catch (err) {
    console.error('Error generating business API key:', err);
    throw err;
  }
}

/**
 * Regenerate an API key for a business user.
 * Revokes the current key and generates a new one in a single operation.
 * @param {string} apiKeyId - The ID of the API key to regenerate
 * @param {string} userId - The user ID (for ownership verification)
 * @returns {Promise<{apiKey: string, record: object}>} The new plaintext key (shown once) and the DB record
 */
export async function regenerateKey(apiKeyId, userId) {
  try {
    // Verify ownership — get existing key and check it belongs to this user
    const { data: existing, error: fetchError } = await supabase
      .from('api_keys')
      .select('id, client_id, client_name, permissions, rate_limit, status, user_id, key_prefix')
      .eq('id', apiKeyId)
      .eq('user_id', userId)
      .single();

    if (fetchError || !existing) {
      throw new Error('API key not found or access denied');
    }

    if (existing.status === 'revoked') {
      throw new Error('Cannot regenerate a revoked key');
    }

    // Revoke the old key
    const { error: revokeError } = await supabase
      .from('api_keys')
      .update({ status: 'revoked' })
      .eq('id', apiKeyId);

    if (revokeError) {
      throw new Error(`Failed to revoke old key: ${revokeError.message}`);
    }

    // Generate new key
    const newApiKey = `ownly_${crypto.randomBytes(32).toString('hex')}`;
    const keyHash = hashApiKey(newApiKey);
    const keyPrefix = newApiKey.slice(-4);

    const { data, error } = await supabase
      .from('api_keys')
      .insert({
        client_id: existing.client_id,
        client_name: existing.client_name,
        key_hash: keyHash,
        key_prefix: keyPrefix,
        permissions: existing.permissions,
        rate_limit: existing.rate_limit,
        user_id: userId,
        status: 'active',
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create new key: ${error.message}`);
    }

    return {
      apiKey: newApiKey, // Only return plain key once
      record: data,
    };
  } catch (err) {
    console.error('Error regenerating key:', err);
    throw err;
  }
}

/**
 * Revoke an API key for a business user.
 * Sets the key status to "revoked" immediately, preventing further API access.
 * @param {string} apiKeyId - The ID of the API key to revoke
 * @param {string} userId - The user ID (for ownership verification)
 * @returns {Promise<{success: boolean}>}
 */
export async function revokeKey(apiKeyId, userId) {
  try {
    // Verify ownership and check current status
    const { data: existing, error: fetchError } = await supabase
      .from('api_keys')
      .select('id, status, user_id')
      .eq('id', apiKeyId)
      .eq('user_id', userId)
      .single();

    if (fetchError || !existing) {
      throw new Error('API key not found or access denied');
    }

    if (existing.status === 'revoked') {
      throw new Error('API key is already revoked');
    }

    // Revoke immediately
    const { error } = await supabase
      .from('api_keys')
      .update({ status: 'revoked' })
      .eq('id', apiKeyId);

    if (error) {
      throw new Error(`Failed to revoke API key: ${error.message}`);
    }

    return { success: true };
  } catch (err) {
    console.error('Error revoking key:', err);
    throw err;
  }
}

/**
 * Get API key metadata for a business user.
 * Returns masked key info including creation date, last used, and status.
 * @param {string} userId - The user ID to get keys for
 * @returns {Promise<Array<object>>} Array of key metadata objects with masked keys
 */
export async function getKeyMetadata(userId) {
  try {
    const { data, error } = await supabase
      .from('api_keys')
      .select('id, client_name, key_prefix, permissions, status, created_at, last_used_at, expires_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to get key metadata: ${error.message}`);
    }

    // Return metadata with masked keys
    return data.map(key => ({
      id: key.id,
      clientName: key.client_name,
      maskedKey: maskApiKey(key.key_prefix || '****'),
      permissions: key.permissions,
      status: key.status,
      createdAt: key.created_at,
      lastUsedAt: key.last_used_at,
      expiresAt: key.expires_at,
    }));
  } catch (err) {
    console.error('Error getting key metadata:', err);
    throw err;
  }
}

/**
 * Hash API key using SHA-256
 */
export function hashApiKey(key) {
  return crypto.createHash('sha256').update(key).digest('hex');
}
