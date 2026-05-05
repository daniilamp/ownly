/**
 * Unit Tests for useDebounce Hook
 * Tests debounce timing, value updates, and cleanup behavior
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useDebounce } from './useDebounce';

describe('useDebounce Hook', () => {
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
    it('should return initial value immediately', () => {
      const { result } = renderHook(() => useDebounce('initial', 300));
      
      expect(result.current).toBe('initial');
    });

    it('should debounce value updates', () => {
      const { result, rerender } = renderHook(
        ({ value, delay }) => useDebounce(value, delay),
        { initialProps: { value: 'initial', delay: 300 } }
      );

      expect(result.current).toBe('initial');

      // Update value
      rerender({ value: 'updated', delay: 300 });

      // Value should not update immediately
      expect(result.current).toBe('initial');

      // Fast-forward time by 299ms (just before delay)
      act(() => {
        vi.advanceTimersByTime(299);
      });
      expect(result.current).toBe('initial');

      // Fast-forward time by 1ms more (reaching 300ms)
      act(() => {
        vi.advanceTimersByTime(1);
      });
      
      expect(result.current).toBe('updated');
    });

    it('should use default delay of 300ms when not specified', () => {
      const { result, rerender } = renderHook(
        ({ value }) => useDebounce(value),
        { initialProps: { value: 'initial' } }
      );

      rerender({ value: 'updated' });

      // Should not update before 300ms
      act(() => {
        vi.advanceTimersByTime(299);
      });
      expect(result.current).toBe('initial');

      // Should update after 300ms
      act(() => {
        vi.advanceTimersByTime(1);
      });
      
      expect(result.current).toBe('updated');
    });
  });

  // ============================================
  // DEBOUNCE TIMING TESTS
  // ============================================

  describe('Debounce Timing', () => {
    it('should reset timer on rapid value changes', () => {
      const { result, rerender } = renderHook(
        ({ value }) => useDebounce(value, 300),
        { initialProps: { value: 'initial' } }
      );

      // First update
      rerender({ value: 'update1' });
      act(() => {
        vi.advanceTimersByTime(100);
      });

      // Second update before first delay completes
      rerender({ value: 'update2' });
      act(() => {
        vi.advanceTimersByTime(100);
      });

      // Third update before second delay completes
      rerender({ value: 'update3' });
      act(() => {
        vi.advanceTimersByTime(100);
      });

      // Still should be initial value (only 300ms total, but timer reset each time)
      expect(result.current).toBe('initial');

      // Wait for final delay to complete
      act(() => {
        vi.advanceTimersByTime(200);
      });
      
      expect(result.current).toBe('update3');
    });

    it('should handle custom delay values', () => {
      const { result, rerender } = renderHook(
        ({ value, delay }) => useDebounce(value, delay),
        { initialProps: { value: 'initial', delay: 500 } }
      );

      rerender({ value: 'updated', delay: 500 });

      // Should not update before 500ms
      act(() => {
        vi.advanceTimersByTime(499);
      });
      expect(result.current).toBe('initial');

      // Should update after 500ms
      act(() => {
        vi.advanceTimersByTime(1);
      });
      
      expect(result.current).toBe('updated');
    });

    it('should handle very short delays', () => {
      const { result, rerender } = renderHook(
        ({ value, delay }) => useDebounce(value, delay),
        { initialProps: { value: 'initial', delay: 50 } }
      );

      rerender({ value: 'updated', delay: 50 });

      act(() => {
        vi.advanceTimersByTime(50);
      });
      
      expect(result.current).toBe('updated');
    });

    it('should handle zero delay', () => {
      const { result, rerender } = renderHook(
        ({ value, delay }) => useDebounce(value, delay),
        { initialProps: { value: 'initial', delay: 0 } }
      );

      rerender({ value: 'updated', delay: 0 });

      act(() => {
        vi.advanceTimersByTime(0);
      });
      
      expect(result.current).toBe('updated');
    });
  });

  // ============================================
  // VALUE TYPE TESTS
  // ============================================

  describe('Value Types', () => {
    it('should debounce string values', () => {
      const { result, rerender } = renderHook(
        ({ value }) => useDebounce(value, 300),
        { initialProps: { value: 'hello' } }
      );

      rerender({ value: 'world' });
      act(() => {
        vi.advanceTimersByTime(300);
      });
      
      expect(result.current).toBe('world');
    });

    it('should debounce number values', () => {
      const { result, rerender } = renderHook(
        ({ value }) => useDebounce(value, 300),
        { initialProps: { value: 0 } }
      );

      rerender({ value: 42 });
      act(() => {
        vi.advanceTimersByTime(300);
      });
      
      expect(result.current).toBe(42);
    });

    it('should debounce boolean values', () => {
      const { result, rerender } = renderHook(
        ({ value }) => useDebounce(value, 300),
        { initialProps: { value: false } }
      );

      rerender({ value: true });
      act(() => {
        vi.advanceTimersByTime(300);
      });
      
      expect(result.current).toBe(true);
    });

    it('should debounce object values', () => {
      const { result, rerender } = renderHook(
        ({ value }) => useDebounce(value, 300),
        { initialProps: { value: { name: 'John' } } }
      );

      const newValue = { name: 'Jane' };
      rerender({ value: newValue });
      act(() => {
        vi.advanceTimersByTime(300);
      });
      
      expect(result.current).toEqual(newValue);
    });

    it('should debounce array values', () => {
      const { result, rerender } = renderHook(
        ({ value }) => useDebounce(value, 300),
        { initialProps: { value: [1, 2, 3] } }
      );

      const newValue = [4, 5, 6];
      rerender({ value: newValue });
      act(() => {
        vi.advanceTimersByTime(300);
      });
      
      expect(result.current).toEqual(newValue);
    });

    it('should handle null and undefined values', () => {
      const { result, rerender } = renderHook(
        ({ value }) => useDebounce(value, 300),
        { initialProps: { value: 'initial' } }
      );

      rerender({ value: null });
      act(() => {
        vi.advanceTimersByTime(300);
      });
      
      expect(result.current).toBeNull();

      rerender({ value: undefined });
      act(() => {
        vi.advanceTimersByTime(300);
      });
      
      expect(result.current).toBeUndefined();
    });
  });

  // ============================================
  // CLEANUP TESTS
  // ============================================

  describe('Cleanup', () => {
    it('should cleanup timer on unmount', () => {
      const clearTimeoutSpy = vi.spyOn(global, 'clearTimeout');
      
      const { unmount } = renderHook(() => useDebounce('test', 300));
      
      unmount();
      
      expect(clearTimeoutSpy).toHaveBeenCalled();
    });

    it('should cleanup previous timer when value changes', () => {
      const clearTimeoutSpy = vi.spyOn(global, 'clearTimeout');
      
      const { rerender } = renderHook(
        ({ value }) => useDebounce(value, 300),
        { initialProps: { value: 'initial' } }
      );

      // First update creates a timer
      rerender({ value: 'update1' });
      
      // Second update should clear the first timer
      rerender({ value: 'update2' });
      
      expect(clearTimeoutSpy).toHaveBeenCalled();
    });

    it('should cleanup timer when delay changes', () => {
      const clearTimeoutSpy = vi.spyOn(global, 'clearTimeout');
      
      const { rerender } = renderHook(
        ({ value, delay }) => useDebounce(value, delay),
        { initialProps: { value: 'test', delay: 300 } }
      );

      // Change delay
      rerender({ value: 'test', delay: 500 });
      
      expect(clearTimeoutSpy).toHaveBeenCalled();
    });
  });

  // ============================================
  // SEARCH INPUT SIMULATION TESTS
  // ============================================

  describe('Search Input Simulation', () => {
    it('should simulate typing behavior with multiple rapid changes', () => {
      const { result, rerender } = renderHook(
        ({ value }) => useDebounce(value, 300),
        { initialProps: { value: '' } }
      );

      // Simulate user typing "search"
      const searchTerm = 'search';
      
      for (let i = 1; i <= searchTerm.length; i++) {
        rerender({ value: searchTerm.substring(0, i) });
        act(() => {
          vi.advanceTimersByTime(50); // User types every 50ms
        });
      }

      // Value should still be empty (user is still typing)
      expect(result.current).toBe('');

      // Wait for debounce delay after last keystroke
      act(() => {
        vi.advanceTimersByTime(300);
      });
      
      expect(result.current).toBe('search');
    });

    it('should handle backspace/deletion during typing', () => {
      const { result, rerender } = renderHook(
        ({ value }) => useDebounce(value, 300),
        { initialProps: { value: '' } }
      );

      // Type "test"
      rerender({ value: 't' });
      act(() => {
        vi.advanceTimersByTime(50);
      });
      rerender({ value: 'te' });
      act(() => {
        vi.advanceTimersByTime(50);
      });
      rerender({ value: 'tes' });
      act(() => {
        vi.advanceTimersByTime(50);
      });
      rerender({ value: 'test' });
      act(() => {
        vi.advanceTimersByTime(50);
      });

      // Delete one character
      rerender({ value: 'tes' });
      act(() => {
        vi.advanceTimersByTime(50);
      });

      // Type again
      rerender({ value: 'test' });
      
      // Wait for debounce
      act(() => {
        vi.advanceTimersByTime(300);
      });
      
      expect(result.current).toBe('test');
    });

    it('should handle clearing search input', () => {
      const { result, rerender } = renderHook(
        ({ value }) => useDebounce(value, 300),
        { initialProps: { value: 'search term' } }
      );

      // Clear input
      rerender({ value: '' });
      
      act(() => {
        vi.advanceTimersByTime(300);
      });
      
      expect(result.current).toBe('');
    });
  });

  // ============================================
  // EDGE CASES
  // ============================================

  describe('Edge Cases', () => {
    it('should handle same value updates', () => {
      const { result, rerender } = renderHook(
        ({ value }) => useDebounce(value, 300),
        { initialProps: { value: 'test' } }
      );

      // Update to same value
      rerender({ value: 'test' });
      act(() => {
        vi.advanceTimersByTime(300);
      });
      
      expect(result.current).toBe('test');
    });

    it('should handle multiple updates to same value', () => {
      const { result, rerender } = renderHook(
        ({ value }) => useDebounce(value, 300),
        { initialProps: { value: 'initial' } }
      );

      rerender({ value: 'updated' });
      act(() => {
        vi.advanceTimersByTime(100);
      });
      
      rerender({ value: 'updated' });
      act(() => {
        vi.advanceTimersByTime(100);
      });
      
      rerender({ value: 'updated' });
      act(() => {
        vi.advanceTimersByTime(100);
      });
      
      expect(result.current).toBe('updated');
    });

    it('should handle very long strings', () => {
      const longString = 'a'.repeat(10000);
      
      const { result, rerender } = renderHook(
        ({ value }) => useDebounce(value, 300),
        { initialProps: { value: '' } }
      );

      rerender({ value: longString });
      act(() => {
        vi.advanceTimersByTime(300);
      });
      
      expect(result.current).toBe(longString);
    });

    it('should handle special characters in strings', () => {
      const specialChars = '!@#$%^&*()_+-=[]{}|;:\'",.<>?/~`';
      
      const { result, rerender } = renderHook(
        ({ value }) => useDebounce(value, 300),
        { initialProps: { value: '' } }
      );

      rerender({ value: specialChars });
      act(() => {
        vi.advanceTimersByTime(300);
      });
      
      expect(result.current).toBe(specialChars);
    });

    it('should handle unicode characters', () => {
      const unicode = '你好世界 🌍 مرحبا';
      
      const { result, rerender } = renderHook(
        ({ value }) => useDebounce(value, 300),
        { initialProps: { value: '' } }
      );

      rerender({ value: unicode });
      act(() => {
        vi.advanceTimersByTime(300);
      });
      
      expect(result.current).toBe(unicode);
    });
  });
});
