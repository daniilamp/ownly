/**
 * Authentication Middleware
 * Validates API keys and JWT tokens for protected endpoints
 */

import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

/**
 * Verify API Key for B2B access
 * Headers: Authorization: Bearer {API_KEY}
 */
export async function verifyApiKey(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'API key required', code: 'MISSING_API_KEY' });
    }

    const apiKey = authHeader.substring(7);

    // Validate API key format (should be at least 32 chars)
    if (apiKey.length < 32) {
      return res.status(401).json({ error: 'Invalid API key format', code: 'INVALID_API_KEY' });
    }

    // Check API key in database
    const { data: apiKeyRecord, error } = await supabase
      .from('api_keys')
      .select('*')
      .eq('key_hash', hashApiKey(apiKey))
      .eq('status', 'active')
      .single();

    if (error || !apiKeyRecord) {
      return res.status(401).json({ error: 'Invalid or inactive API key', code: 'UNAUTHORIZED' });
    }

    // Check if API key has expired
    if (apiKeyRecord.expires_at && new Date(apiKeyRecord.expires_at) < new Date()) {
      return res.status(401).json({ error: 'API key expired', code: 'EXPIRED_API_KEY' });
    }

    // Attach API key info to request
    req.apiKey = {
      id: apiKeyRecord.id,
      clientId: apiKeyRecord.client_id,
      clientName: apiKeyRecord.client_name,
      permissions: apiKeyRecord.permissions || [],
      rateLimit: apiKeyRecord.rate_limit || 1000,
    };

    // Update last used timestamp
    await supabase
      .from('api_keys')
      .update({ last_used_at: new Date().toISOString() })
      .eq('id', apiKeyRecord.id);

    next();
  } catch (err) {
    console.error('API key verification error:', err);
    res.status(500).json({ error: 'Authentication failed', code: 'AUTH_ERROR' });
  }
}

/**
 * Verify JWT token for user endpoints
 */
export async function verifyJWT(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Token required', code: 'MISSING_TOKEN' });
    }

    const token = authHeader.substring(7);

    // Verify with Supabase
    const { data, error } = await supabase.auth.getUser(token);

    if (error || !data.user) {
      return res.status(401).json({ error: 'Invalid token', code: 'INVALID_TOKEN' });
    }

    req.user = {
      id: data.user.id,
      email: data.user.email,
      type: 'user',
    };

    next();
  } catch (err) {
    console.error('JWT verification error:', err);
    res.status(500).json({ error: 'Token verification failed', code: 'AUTH_ERROR' });
  }
}

/**
 * Check if client has specific permission
 */
export function requirePermission(permission) {
  return (req, res, next) => {
    if (!req.apiKey) {
      return res.status(403).json({ error: 'API key required', code: 'FORBIDDEN' });
    }

    if (!req.apiKey.permissions.includes(permission) && !req.apiKey.permissions.includes('*')) {
      return res.status(403).json({ 
        error: `Permission denied: ${permission}`, 
        code: 'INSUFFICIENT_PERMISSIONS' 
      });
    }

    next();
  };
}

/**
 * Simple hash function for API keys (use bcrypt in production)
 */
function hashApiKey(key) {
  return crypto.createHash('sha256').update(key).digest('hex');
}

/**
 * Rate limiting middleware
 */
export function rateLimit(req, res, next) {
  if (!req.apiKey) {
    return next();
  }

  // TODO: Implement Redis-based rate limiting
  // For now, just pass through
  next();
}
