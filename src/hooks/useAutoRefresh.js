/**
 * useAutoRefresh Hook
 * Manages automatic data refresh with configurable intervals
 * 
 * This hook provides automatic refresh functionality with controls to start/stop
 * auto-refresh, manually trigger refresh, and handle cleanup on unmount. It's
 * particularly useful for audit logs, real-time monitoring views, and dashboards
 * that need to display up-to-date information.
 * 
 * @example
 * const { isRefreshing, startAutoRefresh, stopAutoRefresh, refresh } = useAutoRefresh({
 *   callback: fetchAuditLogs,
 *   interval: 30000, // 30 seconds
 *   enabled: true
 * });
 * 
 * // Toggle auto-refresh
 * <button onClick={isRefreshing ? stopAutoRefresh : startAutoRefresh}>
 *   {isRefreshing ? 'Stop' : 'Start'} Auto-Refresh
 * </button>
 * 
 * // Manual refresh
 * <button onClick={refresh}>Refresh Now</button>
 */

import { useEffect, useRef, useCallback, useState } from 'react';

/**
 * useAutoRefresh Hook
 * 
 * @param {Object} options - Configuration options
 * @param {Function} options.callback - Function to call on each refresh
 * @param {number} options.interval - Refresh interval in milliseconds (default: 30000)
 * @param {boolean} options.enabled - Whether auto-refresh is enabled initially (default: false)
 * @returns {Object} Auto-refresh state and control functions
 */
export function useAutoRefresh({ 
  callback, 
  interval = 30000,
  enabled = false 
} = {}) {
  const [isRefreshing, setIsRefreshing] = useState(enabled);
  const intervalIdRef = useRef(null);
  const callbackRef = useRef(callback);
  const isMountedRef = useRef(true);

  // Keep callback ref up to date
  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  // Track mounted state
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  /**
   * Manually trigger a refresh
   * Executes the callback function immediately
   */
  const refresh = useCallback(() => {
    if (callbackRef.current && typeof callbackRef.current === 'function') {
      try {
        callbackRef.current();
      } catch (error) {
        console.error('Error during manual refresh:', error);
      }
    }
  }, []);

  /**
   * Start auto-refresh
   * Begins executing the callback at the specified interval
   */
  const startAutoRefresh = useCallback(() => {
    // Don't start if already running
    if (intervalIdRef.current) {
      return;
    }

    // Validate interval
    if (typeof interval !== 'number' || interval <= 0) {
      console.warn('Invalid interval. Interval must be a positive number.');
      return;
    }

    // Validate callback
    if (!callbackRef.current || typeof callbackRef.current !== 'function') {
      console.warn('Invalid callback. Callback must be a function.');
      return;
    }

    setIsRefreshing(true);

    // Set up interval
    intervalIdRef.current = setInterval(() => {
      // Only execute if component is still mounted
      if (isMountedRef.current && callbackRef.current) {
        try {
          callbackRef.current();
        } catch (error) {
          console.error('Error during auto-refresh:', error);
        }
      }
    }, interval);
  }, [interval]);

  /**
   * Stop auto-refresh
   * Clears the refresh interval
   */
  const stopAutoRefresh = useCallback(() => {
    if (intervalIdRef.current) {
      clearInterval(intervalIdRef.current);
      intervalIdRef.current = null;
      setIsRefreshing(false);
    }
  }, []);

  /**
   * Toggle auto-refresh on/off
   */
  const toggleAutoRefresh = useCallback(() => {
    if (isRefreshing) {
      stopAutoRefresh();
    } else {
      startAutoRefresh();
    }
  }, [isRefreshing, startAutoRefresh, stopAutoRefresh]);

  // Handle enabled prop changes
  useEffect(() => {
    if (enabled) {
      startAutoRefresh();
    } else {
      stopAutoRefresh();
    }
  }, [enabled, startAutoRefresh, stopAutoRefresh])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (intervalIdRef.current) {
        clearInterval(intervalIdRef.current);
        intervalIdRef.current = null;
      }
    };
  }, []);

  return {
    isRefreshing,
    startAutoRefresh,
    stopAutoRefresh,
    toggleAutoRefresh,
    refresh,
  };
}
