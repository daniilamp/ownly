/**
 * Simple in-memory data cache with TTL (Time To Live)
 * Used for caching admin panel statistics and frequently accessed data
 * 
 * Features:
 * - In-memory cache storage
 * - TTL-based expiration (default: 60 seconds)
 * - Cache invalidation
 * - Cache warming support
 * 
 * Requirements: 24.3
 */

class DataCache {
  constructor() {
    this.cache = new Map();
  }

  /**
   * Set a value in the cache with TTL
   * @param {string} key - Cache key
   * @param {any} value - Value to cache
   * @param {number} ttl - Time to live in milliseconds (default: 60000ms = 60s)
   */
  set(key, value, ttl = 60000) {
    const expiresAt = Date.now() + ttl;
    this.cache.set(key, {
      value,
      expiresAt,
    });
  }

  /**
   * Get a value from the cache
   * @param {string} key - Cache key
   * @returns {any|null} - Cached value or null if expired/not found
   */
  get(key) {
    const cached = this.cache.get(key);
    
    if (!cached) {
      return null;
    }

    // Check if expired
    if (Date.now() > cached.expiresAt) {
      this.cache.delete(key);
      return null;
    }

    return cached.value;
  }

  /**
   * Check if a key exists and is not expired
   * @param {string} key - Cache key
   * @returns {boolean} - True if key exists and is valid
   */
  has(key) {
    return this.get(key) !== null;
  }

  /**
   * Invalidate (delete) a specific cache key
   * @param {string} key - Cache key to invalidate
   */
  invalidate(key) {
    this.cache.delete(key);
  }

  /**
   * Invalidate all cache keys matching a pattern
   * @param {string} pattern - Pattern to match (e.g., 'users:*')
   */
  invalidatePattern(pattern) {
    const regex = new RegExp(pattern.replace('*', '.*'));
    for (const key of this.cache.keys()) {
      if (regex.test(key)) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * Clear all cache entries
   */
  clear() {
    this.cache.clear();
  }

  /**
   * Get or set a value with a factory function
   * If the key exists and is valid, return cached value
   * Otherwise, call the factory function, cache the result, and return it
   * 
   * @param {string} key - Cache key
   * @param {Function} factory - Async function that returns the value to cache
   * @param {number} ttl - Time to live in milliseconds
   * @returns {Promise<any>} - Cached or freshly fetched value
   */
  async getOrSet(key, factory, ttl = 60000) {
    const cached = this.get(key);
    
    if (cached !== null) {
      return cached;
    }

    const value = await factory();
    this.set(key, value, ttl);
    return value;
  }

  /**
   * Get cache statistics
   * @returns {Object} - Cache statistics
   */
  getStats() {
    let validCount = 0;
    let expiredCount = 0;

    for (const [key, entry] of this.cache.entries()) {
      if (Date.now() > entry.expiresAt) {
        expiredCount++;
      } else {
        validCount++;
      }
    }

    return {
      totalEntries: this.cache.size,
      validEntries: validCount,
      expiredEntries: expiredCount,
    };
  }
}

// Export singleton instance
export const dataCache = new DataCache();

// Export cache key constants for consistency
export const CACHE_KEYS = {
  USER_STATS: 'admin:stats:users',
  API_STATS: 'admin:stats:api',
  SYSTEM_HEALTH: 'admin:health',
  SECURITY_SUMMARY: 'admin:security:summary',
  USER_LIST: (filters) => `admin:users:${JSON.stringify(filters)}`,
  API_KEY_LIST: (filters) => `admin:apikeys:${JSON.stringify(filters)}`,
  ACCESS_LOGS: (filters) => `admin:logs:access:${JSON.stringify(filters)}`,
  ROLE_CHANGE_LOGS: (filters) => `admin:logs:roles:${JSON.stringify(filters)}`,
  SECURITY_EVENTS: (filters) => `admin:logs:security:${JSON.stringify(filters)}`,
};

// Export TTL constants
export const CACHE_TTL = {
  STATISTICS: 60000, // 60 seconds for statistics
  LOGS: 30000, // 30 seconds for logs
  USER_DATA: 120000, // 2 minutes for user data
  SYSTEM_HEALTH: 30000, // 30 seconds for health checks
};
