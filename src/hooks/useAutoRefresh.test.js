/**
 * Unit Tests for useAutoRefresh Hook
 * Tests auto-refresh functionality, interval management, and cleanup behavior
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useAutoRefresh } from './useAutoRefresh';

describe('useAutoRefresh Hook', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.runOnlyPendingTimers();
    vi.useRealTimers();
  });

  // ============================================
  // BASIC FUNCTIONALITY TESTS
  // ============================================

  describe('Basic Functionality', () => {
    it('should initialize with default values', () => {
      const callback = vi.fn();
      const { result } = renderHook(() => useAutoRefresh({ callback }));

      expect(result.current.isRefreshing).toBe(false);
      expect(typeof result.current.startAutoRefresh).toBe('function');
      expect(typeof result.current.stopAutoRefresh).toBe('function');
      expect(typeof result.current.toggleAutoRefresh).toBe('function');
      expect(typeof result.current.refresh).toBe('function');
    });

    it('should start with enabled=true', () => {
      const callback = vi.fn();
      const { result } = renderHook(() => 
        useAutoRefresh({ callback, interval: 1000, enabled: true })
      );

      expect(result.current.isRefreshing).toBe(true);
    });

    it('should execute callback on manual refresh', () => {
      const callback = vi.fn();
      const { result } = renderHook(() => useAutoRefresh({ callback }));

      act(() => {
        result.current.refresh();
      });

      expect(callback).toHaveBeenCalledTimes(1);
    });

    it('should use default interval of 30000ms', () => {
      const callback = vi.fn();
      const { result } = renderHook(() => useAutoRefresh({ callback }));

      act(() => {
        result.current.startAutoRefresh();
      });

      // Should not call before 30000ms
      act(() => {
        vi.advanceTimersByTime(29999);
      });
      expect(callback).toHaveBeenCalledTimes(0);

      // Should call after 30000ms
      act(() => {
        vi.advanceTimersByTime(1);
      });
      expect(callback).toHaveBeenCalledTimes(1);
    });
  });

  // ============================================
  // AUTO-REFRESH CONTROL TESTS
  // ============================================

  describe('Auto-Refresh Control', () => {
    it('should start auto-refresh and execute callback at intervals', () => {
      const callback = vi.fn();
      const { result } = renderHook(() => 
        useAutoRefresh({ callback, interval: 1000 })
      );

      act(() => {
        result.current.startAutoRefresh();
      });

      expect(result.current.isRefreshing).toBe(true);

      // First interval
      act(() => {
        vi.advanceTimersByTime(1000);
      });
      expect(callback).toHaveBeenCalledTimes(1);

      // Second interval
      act(() => {
        vi.advanceTimersByTime(1000);
      });
      expect(callback).toHaveBeenCalledTimes(2);

      // Third interval
      act(() => {
        vi.advanceTimersByTime(1000);
      });
      expect(callback).toHaveBeenCalledTimes(3);
    });

    it('should stop auto-refresh', () => {
      const callback = vi.fn();
      const { result } = renderHook(() => 
        useAutoRefresh({ callback, interval: 1000 })
      );

      act(() => {
        result.current.startAutoRefresh();
      });

      // Execute once
      act(() => {
        vi.advanceTimersByTime(1000);
      });
      expect(callback).toHaveBeenCalledTimes(1);

      // Stop auto-refresh
      act(() => {
        result.current.stopAutoRefresh();
      });

      expect(result.current.isRefreshing).toBe(false);

      // Should not execute after stopping
      act(() => {
        vi.advanceTimersByTime(5000);
      });
      expect(callback).toHaveBeenCalledTimes(1);
    });

    it('should toggle auto-refresh on and off', () => {
      const callback = vi.fn();
      const { result } = renderHook(() => 
        useAutoRefresh({ callback, interval: 1000 })
      );

      // Toggle on
      act(() => {
        result.current.toggleAutoRefresh();
      });
      expect(result.current.isRefreshing).toBe(true);

      act(() => {
        vi.advanceTimersByTime(1000);
      });
      expect(callback).toHaveBeenCalledTimes(1);

      // Toggle off
      act(() => {
        result.current.toggleAutoRefresh();
      });
      expect(result.current.isRefreshing).toBe(false);

      act(() => {
        vi.advanceTimersByTime(1000);
      });
      expect(callback).toHaveBeenCalledTimes(1);
    });

    it('should not start if already running', () => {
      const callback = vi.fn();
      const { result } = renderHook(() => 
        useAutoRefresh({ callback, interval: 1000 })
      );

      act(() => {
        result.current.startAutoRefresh();
        result.current.startAutoRefresh(); // Try to start again
      });

      // Should only execute once per interval
      act(() => {
        vi.advanceTimersByTime(1000);
      });
      expect(callback).toHaveBeenCalledTimes(1);
    });

    it('should handle stop when not running', () => {
      const callback = vi.fn();
      const { result } = renderHook(() => useAutoRefresh({ callback }));

      // Should not throw error
      expect(() => {
        act(() => {
          result.current.stopAutoRefresh();
        });
      }).not.toThrow();

      expect(result.current.isRefreshing).toBe(false);
    });
  });

  // ============================================
  // INTERVAL TIMING TESTS
  // ============================================

  describe('Interval Timing', () => {
    it('should respect custom interval values', () => {
      const callback = vi.fn();
      const { result } = renderHook(() => 
        useAutoRefresh({ callback, interval: 5000 })
      );

      act(() => {
        result.current.startAutoRefresh();
      });

      // Should not call before 5000ms
      act(() => {
        vi.advanceTimersByTime(4999);
      });
      expect(callback).toHaveBeenCalledTimes(0);

      // Should call after 5000ms
      act(() => {
        vi.advanceTimersByTime(1);
      });
      expect(callback).toHaveBeenCalledTimes(1);
    });

    it('should handle very short intervals', () => {
      const callback = vi.fn();
      const { result } = renderHook(() => 
        useAutoRefresh({ callback, interval: 100 })
      );

      act(() => {
        result.current.startAutoRefresh();
      });

      act(() => {
        vi.advanceTimersByTime(100);
      });
      expect(callback).toHaveBeenCalledTimes(1);

      act(() => {
        vi.advanceTimersByTime(100);
      });
      expect(callback).toHaveBeenCalledTimes(2);
    });

    it('should handle very long intervals', () => {
      const callback = vi.fn();
      const { result } = renderHook(() => 
        useAutoRefresh({ callback, interval: 300000 }) // 5 minutes
      );

      act(() => {
        result.current.startAutoRefresh();
      });

      act(() => {
        vi.advanceTimersByTime(299999);
      });
      expect(callback).toHaveBeenCalledTimes(0);

      act(() => {
        vi.advanceTimersByTime(1);
      });
      expect(callback).toHaveBeenCalledTimes(1);
    });

    it('should not start with invalid interval (zero)', () => {
      const callback = vi.fn();
      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      
      const { result } = renderHook(() => 
        useAutoRefresh({ callback, interval: 0 })
      );

      act(() => {
        result.current.startAutoRefresh();
      });

      expect(consoleWarnSpy).toHaveBeenCalledWith(
        'Invalid interval. Interval must be a positive number.'
      );
      expect(result.current.isRefreshing).toBe(false);

      consoleWarnSpy.mockRestore();
    });

    it('should not start with invalid interval (negative)', () => {
      const callback = vi.fn();
      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      
      const { result } = renderHook(() => 
        useAutoRefresh({ callback, interval: -1000 })
      );

      act(() => {
        result.current.startAutoRefresh();
      });

      expect(consoleWarnSpy).toHaveBeenCalledWith(
        'Invalid interval. Interval must be a positive number.'
      );
      expect(result.current.isRefreshing).toBe(false);

      consoleWarnSpy.mockRestore();
    });
  });

  // ============================================
  // CALLBACK HANDLING TESTS
  // ============================================

  describe('Callback Handling', () => {
    it('should update callback reference when callback changes', () => {
      const callback1 = vi.fn();
      const callback2 = vi.fn();
      
      const { result, rerender } = renderHook(
        ({ callback }) => useAutoRefresh({ callback, interval: 1000 }),
        { initialProps: { callback: callback1 } }
      );

      act(() => {
        result.current.startAutoRefresh();
      });

      act(() => {
        vi.advanceTimersByTime(1000);
      });
      expect(callback1).toHaveBeenCalledTimes(1);
      expect(callback2).toHaveBeenCalledTimes(0);

      // Change callback
      rerender({ callback: callback2 });

      act(() => {
        vi.advanceTimersByTime(1000);
      });
      expect(callback1).toHaveBeenCalledTimes(1);
      expect(callback2).toHaveBeenCalledTimes(1);
    });

    it('should handle callback errors gracefully during auto-refresh', () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const errorCallback = vi.fn(() => {
        throw new Error('Callback error');
      });
      
      const { result } = renderHook(() => 
        useAutoRefresh({ callback: errorCallback, interval: 1000 })
      );

      act(() => {
        result.current.startAutoRefresh();
      });

      act(() => {
        vi.advanceTimersByTime(1000);
      });

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Error during auto-refresh:',
        expect.any(Error)
      );
      expect(result.current.isRefreshing).toBe(true); // Should still be running

      consoleErrorSpy.mockRestore();
    });

    it('should handle callback errors gracefully during manual refresh', () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const errorCallback = vi.fn(() => {
        throw new Error('Manual refresh error');
      });
      
      const { result } = renderHook(() => 
        useAutoRefresh({ callback: errorCallback })
      );

      expect(() => {
        act(() => {
          result.current.refresh();
        });
      }).not.toThrow();

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Error during manual refresh:',
        expect.any(Error)
      );

      consoleErrorSpy.mockRestore();
    });

    it('should not start with invalid callback (null)', () => {
      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      
      const { result } = renderHook(() => 
        useAutoRefresh({ callback: null, interval: 1000 })
      );

      act(() => {
        result.current.startAutoRefresh();
      });

      expect(consoleWarnSpy).toHaveBeenCalledWith(
        'Invalid callback. Callback must be a function.'
      );
      expect(result.current.isRefreshing).toBe(false);

      consoleWarnSpy.mockRestore();
    });

    it('should not start with invalid callback (undefined)', () => {
      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      
      const { result } = renderHook(() => 
        useAutoRefresh({ callback: undefined, interval: 1000 })
      );

      act(() => {
        result.current.startAutoRefresh();
      });

      expect(consoleWarnSpy).toHaveBeenCalledWith(
        'Invalid callback. Callback must be a function.'
      );
      expect(result.current.isRefreshing).toBe(false);

      consoleWarnSpy.mockRestore();
    });

    it('should handle manual refresh with no callback', () => {
      const { result } = renderHook(() => 
        useAutoRefresh({ callback: null })
      );

      expect(() => {
        act(() => {
          result.current.refresh();
        });
      }).not.toThrow();
    });
  });

  // ============================================
  // ENABLED PROP TESTS
  // ============================================

  describe('Enabled Prop', () => {
    it('should start automatically when enabled=true', () => {
      const callback = vi.fn();
      const { result } = renderHook(() => 
        useAutoRefresh({ callback, interval: 1000, enabled: true })
      );

      expect(result.current.isRefreshing).toBe(true);

      act(() => {
        vi.advanceTimersByTime(1000);
      });
      expect(callback).toHaveBeenCalledTimes(1);
    });

    it('should not start automatically when enabled=false', () => {
      const callback = vi.fn();
      const { result } = renderHook(() => 
        useAutoRefresh({ callback, interval: 1000, enabled: false })
      );

      expect(result.current.isRefreshing).toBe(false);

      act(() => {
        vi.advanceTimersByTime(1000);
      });
      expect(callback).toHaveBeenCalledTimes(0);
    });

    it('should start when enabled changes from false to true', () => {
      const callback = vi.fn();
      const { result, rerender } = renderHook(
        ({ enabled }) => useAutoRefresh({ callback, interval: 1000, enabled }),
        { initialProps: { enabled: false } }
      );

      expect(result.current.isRefreshing).toBe(false);

      // Change enabled to true
      rerender({ enabled: true });

      expect(result.current.isRefreshing).toBe(true);

      act(() => {
        vi.advanceTimersByTime(1000);
      });
      expect(callback).toHaveBeenCalledTimes(1);
    });

    it('should stop when enabled changes from true to false', () => {
      const callback = vi.fn();
      const { result, rerender } = renderHook(
        ({ enabled }) => useAutoRefresh({ callback, interval: 1000, enabled }),
        { initialProps: { enabled: true } }
      );

      expect(result.current.isRefreshing).toBe(true);

      act(() => {
        vi.advanceTimersByTime(1000);
      });
      expect(callback).toHaveBeenCalledTimes(1);

      // Change enabled to false
      rerender({ enabled: false });

      expect(result.current.isRefreshing).toBe(false);

      act(() => {
        vi.advanceTimersByTime(1000);
      });
      expect(callback).toHaveBeenCalledTimes(1); // Should not increase
    });
  });

  // ============================================
  // CLEANUP TESTS
  // ============================================

  describe('Cleanup', () => {
    it('should cleanup interval on unmount', () => {
      const callback = vi.fn();
      const clearIntervalSpy = vi.spyOn(global, 'clearInterval');
      
      const { result, unmount } = renderHook(() => 
        useAutoRefresh({ callback, interval: 1000 })
      );

      act(() => {
        result.current.startAutoRefresh();
      });

      unmount();

      expect(clearIntervalSpy).toHaveBeenCalled();
    });

    it('should not execute callback after unmount', () => {
      const callback = vi.fn();
      
      const { result, unmount } = renderHook(() => 
        useAutoRefresh({ callback, interval: 1000 })
      );

      act(() => {
        result.current.startAutoRefresh();
      });

      unmount();

      act(() => {
        vi.advanceTimersByTime(5000);
      });

      expect(callback).toHaveBeenCalledTimes(0);
    });

    it('should cleanup when stopping auto-refresh', () => {
      const callback = vi.fn();
      const clearIntervalSpy = vi.spyOn(global, 'clearInterval');
      
      const { result } = renderHook(() => 
        useAutoRefresh({ callback, interval: 1000 })
      );

      act(() => {
        result.current.startAutoRefresh();
      });

      act(() => {
        result.current.stopAutoRefresh();
      });

      expect(clearIntervalSpy).toHaveBeenCalled();
    });
  });

  // ============================================
  // REAL-WORLD USAGE TESTS
  // ============================================

  describe('Real-World Usage Scenarios', () => {
    it('should simulate audit log auto-refresh (30 seconds)', () => {
      const fetchAuditLogs = vi.fn();
      const { result } = renderHook(() => 
        useAutoRefresh({ callback: fetchAuditLogs, interval: 30000, enabled: true })
      );

      expect(result.current.isRefreshing).toBe(true);

      // After 30 seconds
      act(() => {
        vi.advanceTimersByTime(30000);
      });
      expect(fetchAuditLogs).toHaveBeenCalledTimes(1);

      // After 60 seconds
      act(() => {
        vi.advanceTimersByTime(30000);
      });
      expect(fetchAuditLogs).toHaveBeenCalledTimes(2);

      // After 90 seconds
      act(() => {
        vi.advanceTimersByTime(30000);
      });
      expect(fetchAuditLogs).toHaveBeenCalledTimes(3);
    });

    it('should simulate dashboard statistics refresh (60 seconds)', () => {
      const fetchStats = vi.fn();
      const { result } = renderHook(() => 
        useAutoRefresh({ callback: fetchStats, interval: 60000 })
      );

      act(() => {
        result.current.startAutoRefresh();
      });

      // After 1 minute
      act(() => {
        vi.advanceTimersByTime(60000);
      });
      expect(fetchStats).toHaveBeenCalledTimes(1);

      // After 2 minutes
      act(() => {
        vi.advanceTimersByTime(60000);
      });
      expect(fetchStats).toHaveBeenCalledTimes(2);
    });

    it('should handle user toggling auto-refresh on and off', () => {
      const fetchData = vi.fn();
      const { result } = renderHook(() => 
        useAutoRefresh({ callback: fetchData, interval: 1000 })
      );

      // User starts auto-refresh
      act(() => {
        result.current.startAutoRefresh();
      });

      act(() => {
        vi.advanceTimersByTime(2000);
      });
      expect(fetchData).toHaveBeenCalledTimes(2);

      // User stops auto-refresh
      act(() => {
        result.current.stopAutoRefresh();
      });

      act(() => {
        vi.advanceTimersByTime(2000);
      });
      expect(fetchData).toHaveBeenCalledTimes(2); // Should not increase

      // User manually refreshes
      act(() => {
        result.current.refresh();
      });
      expect(fetchData).toHaveBeenCalledTimes(3);

      // User starts auto-refresh again
      act(() => {
        result.current.startAutoRefresh();
      });

      act(() => {
        vi.advanceTimersByTime(1000);
      });
      expect(fetchData).toHaveBeenCalledTimes(4);
    });

    it('should handle component re-renders without restarting interval', () => {
      const callback = vi.fn();
      const { result, rerender } = renderHook(
        ({ someProp }) => useAutoRefresh({ callback, interval: 1000 }),
        { initialProps: { someProp: 'value1' } }
      );

      act(() => {
        result.current.startAutoRefresh();
      });

      act(() => {
        vi.advanceTimersByTime(1000);
      });
      expect(callback).toHaveBeenCalledTimes(1);

      // Re-render with different prop
      rerender({ someProp: 'value2' });

      act(() => {
        vi.advanceTimersByTime(1000);
      });
      expect(callback).toHaveBeenCalledTimes(2);

      // Should still be running normally
      act(() => {
        vi.advanceTimersByTime(1000);
      });
      expect(callback).toHaveBeenCalledTimes(3);
    });
  });

  // ============================================
  // EDGE CASES
  // ============================================

  describe('Edge Cases', () => {
    it('should handle rapid start/stop calls', () => {
      const callback = vi.fn();
      const { result } = renderHook(() => 
        useAutoRefresh({ callback, interval: 1000 })
      );

      act(() => {
        result.current.startAutoRefresh();
        result.current.stopAutoRefresh();
        result.current.startAutoRefresh();
        result.current.stopAutoRefresh();
        result.current.startAutoRefresh();
      });

      expect(result.current.isRefreshing).toBe(true);

      act(() => {
        vi.advanceTimersByTime(1000);
      });
      expect(callback).toHaveBeenCalledTimes(1);
    });

    it('should handle multiple manual refreshes in quick succession', () => {
      const callback = vi.fn();
      const { result } = renderHook(() => useAutoRefresh({ callback }));

      act(() => {
        result.current.refresh();
        result.current.refresh();
        result.current.refresh();
      });

      expect(callback).toHaveBeenCalledTimes(3);
    });

    it('should handle callback that returns a promise', async () => {
      const asyncCallback = vi.fn(() => Promise.resolve('data'));
      const { result } = renderHook(() => 
        useAutoRefresh({ callback: asyncCallback, interval: 1000 })
      );

      act(() => {
        result.current.startAutoRefresh();
      });

      act(() => {
        vi.advanceTimersByTime(1000);
      });

      expect(asyncCallback).toHaveBeenCalledTimes(1);
    });

    it('should handle callback with parameters', () => {
      const callbackWithParams = vi.fn((param1, param2) => {
        return param1 + param2;
      });
      
      const { result } = renderHook(() => 
        useAutoRefresh({ callback: callbackWithParams })
      );

      act(() => {
        result.current.refresh();
      });

      expect(callbackWithParams).toHaveBeenCalledTimes(1);
    });
  });
});
