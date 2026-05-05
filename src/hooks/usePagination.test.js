/**
 * Unit tests for usePagination hook
 * 
 * Tests cover:
 * - Initial state
 * - Page navigation (next, previous, go to page)
 * - Boundary conditions (first page, last page, invalid pages)
 * - Page size changes
 * - Edge cases (zero items, invalid inputs)
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { usePagination } from './usePagination';

describe('usePagination', () => {
  // Suppress console warnings during tests
  beforeEach(() => {
    vi.spyOn(console, 'warn').mockImplementation(() => {});
  });

  describe('Initial State', () => {
    it('should initialize with default values', () => {
      const { result } = renderHook(() => usePagination());

      expect(result.current.currentPage).toBe(1);
      expect(result.current.pageSize).toBe(50);
      expect(result.current.totalItems).toBe(0);
      expect(result.current.totalPages).toBe(0);
      expect(result.current.hasNextPage).toBe(false);
      expect(result.current.hasPrevPage).toBe(false);
    });

    it('should initialize with custom values', () => {
      const { result } = renderHook(() => 
        usePagination({ 
          totalItems: 150, 
          initialPageSize: 25,
          initialPage: 2
        })
      );

      expect(result.current.currentPage).toBe(2);
      expect(result.current.pageSize).toBe(25);
      expect(result.current.totalItems).toBe(150);
      expect(result.current.totalPages).toBe(6); // 150 / 25 = 6
      expect(result.current.hasNextPage).toBe(true);
      expect(result.current.hasPrevPage).toBe(true);
    });

    it('should calculate total pages correctly', () => {
      const { result } = renderHook(() => 
        usePagination({ totalItems: 100, initialPageSize: 50 })
      );

      expect(result.current.totalPages).toBe(2);
    });

    it('should round up total pages for partial pages', () => {
      const { result } = renderHook(() => 
        usePagination({ totalItems: 101, initialPageSize: 50 })
      );

      expect(result.current.totalPages).toBe(3); // 101 / 50 = 2.02, rounds up to 3
    });
  });

  describe('Page Navigation', () => {
    it('should navigate to next page', () => {
      const { result } = renderHook(() => 
        usePagination({ totalItems: 150, initialPageSize: 50 })
      );

      expect(result.current.currentPage).toBe(1);

      act(() => {
        result.current.nextPage();
      });

      expect(result.current.currentPage).toBe(2);
    });

    it('should navigate to previous page', () => {
      const { result } = renderHook(() => 
        usePagination({ totalItems: 150, initialPageSize: 50, initialPage: 2 })
      );

      expect(result.current.currentPage).toBe(2);

      act(() => {
        result.current.prevPage();
      });

      expect(result.current.currentPage).toBe(1);
    });

    it('should navigate to specific page', () => {
      const { result } = renderHook(() => 
        usePagination({ totalItems: 150, initialPageSize: 50 })
      );

      act(() => {
        result.current.goToPage(3);
      });

      expect(result.current.currentPage).toBe(3);
    });

    it('should not go beyond last page with nextPage', () => {
      const { result } = renderHook(() => 
        usePagination({ totalItems: 150, initialPageSize: 50, initialPage: 3 })
      );

      expect(result.current.currentPage).toBe(3);
      expect(result.current.hasNextPage).toBe(false);

      act(() => {
        result.current.nextPage();
      });

      // Should stay on page 3
      expect(result.current.currentPage).toBe(3);
    });

    it('should not go below first page with prevPage', () => {
      const { result } = renderHook(() => 
        usePagination({ totalItems: 150, initialPageSize: 50, initialPage: 1 })
      );

      expect(result.current.currentPage).toBe(1);
      expect(result.current.hasPrevPage).toBe(false);

      act(() => {
        result.current.prevPage();
      });

      // Should stay on page 1
      expect(result.current.currentPage).toBe(1);
    });
  });

  describe('Boundary Conditions', () => {
    it('should clamp goToPage to valid range (too high)', () => {
      const { result } = renderHook(() => 
        usePagination({ totalItems: 150, initialPageSize: 50 })
      );

      act(() => {
        result.current.goToPage(999);
      });

      // Should clamp to last page (3)
      expect(result.current.currentPage).toBe(3);
    });

    it('should clamp goToPage to valid range (too low)', () => {
      const { result } = renderHook(() => 
        usePagination({ totalItems: 150, initialPageSize: 50, initialPage: 2 })
      );

      act(() => {
        result.current.goToPage(0);
      });

      // Should clamp to first page (1)
      expect(result.current.currentPage).toBe(1);
    });

    it('should handle negative page numbers', () => {
      const { result } = renderHook(() => 
        usePagination({ totalItems: 150, initialPageSize: 50 })
      );

      act(() => {
        result.current.goToPage(-5);
      });

      // Should clamp to first page (1)
      expect(result.current.currentPage).toBe(1);
    });

    it('should correctly identify hasNextPage on first page', () => {
      const { result } = renderHook(() => 
        usePagination({ totalItems: 150, initialPageSize: 50, initialPage: 1 })
      );

      expect(result.current.hasNextPage).toBe(true);
      expect(result.current.hasPrevPage).toBe(false);
    });

    it('should correctly identify hasPrevPage on last page', () => {
      const { result } = renderHook(() => 
        usePagination({ totalItems: 150, initialPageSize: 50, initialPage: 3 })
      );

      expect(result.current.hasNextPage).toBe(false);
      expect(result.current.hasPrevPage).toBe(true);
    });

    it('should correctly identify boundaries on middle page', () => {
      const { result } = renderHook(() => 
        usePagination({ totalItems: 150, initialPageSize: 50, initialPage: 2 })
      );

      expect(result.current.hasNextPage).toBe(true);
      expect(result.current.hasPrevPage).toBe(true);
    });
  });

  describe('Page Size Changes', () => {
    it('should update page size', () => {
      const { result } = renderHook(() => 
        usePagination({ totalItems: 150, initialPageSize: 50 })
      );

      expect(result.current.pageSize).toBe(50);
      expect(result.current.totalPages).toBe(3);

      act(() => {
        result.current.setPageSize(25);
      });

      expect(result.current.pageSize).toBe(25);
      expect(result.current.totalPages).toBe(6); // 150 / 25 = 6
    });

    it('should reset to first page when page size changes', () => {
      const { result } = renderHook(() => 
        usePagination({ totalItems: 150, initialPageSize: 50, initialPage: 3 })
      );

      expect(result.current.currentPage).toBe(3);

      act(() => {
        result.current.setPageSize(25);
      });

      // Should reset to page 1
      expect(result.current.currentPage).toBe(1);
    });

    it('should recalculate total pages when page size changes', () => {
      const { result } = renderHook(() => 
        usePagination({ totalItems: 100, initialPageSize: 50 })
      );

      expect(result.current.totalPages).toBe(2);

      act(() => {
        result.current.setPageSize(10);
      });

      expect(result.current.totalPages).toBe(10); // 100 / 10 = 10
    });

    it('should reject invalid page size (zero)', () => {
      const { result } = renderHook(() => 
        usePagination({ totalItems: 150, initialPageSize: 50 })
      );

      const originalPageSize = result.current.pageSize;

      act(() => {
        result.current.setPageSize(0);
      });

      // Should not change page size
      expect(result.current.pageSize).toBe(originalPageSize);
    });

    it('should reject invalid page size (negative)', () => {
      const { result } = renderHook(() => 
        usePagination({ totalItems: 150, initialPageSize: 50 })
      );

      const originalPageSize = result.current.pageSize;

      act(() => {
        result.current.setPageSize(-10);
      });

      // Should not change page size
      expect(result.current.pageSize).toBe(originalPageSize);
    });

    it('should reject invalid page size (non-number)', () => {
      const { result } = renderHook(() => 
        usePagination({ totalItems: 150, initialPageSize: 50 })
      );

      const originalPageSize = result.current.pageSize;

      act(() => {
        result.current.setPageSize('invalid');
      });

      // Should not change page size
      expect(result.current.pageSize).toBe(originalPageSize);
    });
  });

  describe('Edge Cases', () => {
    it('should handle zero total items', () => {
      const { result } = renderHook(() => 
        usePagination({ totalItems: 0, initialPageSize: 50 })
      );

      expect(result.current.totalPages).toBe(0);
      expect(result.current.hasNextPage).toBe(false);
      expect(result.current.hasPrevPage).toBe(false);
    });

    it('should handle zero page size', () => {
      const { result } = renderHook(() => 
        usePagination({ totalItems: 150, initialPageSize: 0 })
      );

      expect(result.current.totalPages).toBe(0);
    });

    it('should handle single item', () => {
      const { result } = renderHook(() => 
        usePagination({ totalItems: 1, initialPageSize: 50 })
      );

      expect(result.current.totalPages).toBe(1);
      expect(result.current.hasNextPage).toBe(false);
      expect(result.current.hasPrevPage).toBe(false);
    });

    it('should handle single page with multiple items', () => {
      const { result } = renderHook(() => 
        usePagination({ totalItems: 25, initialPageSize: 50 })
      );

      expect(result.current.totalPages).toBe(1);
      expect(result.current.hasNextPage).toBe(false);
      expect(result.current.hasPrevPage).toBe(false);
    });

    it('should handle goToPage when totalPages is 0', () => {
      const { result } = renderHook(() => 
        usePagination({ totalItems: 0, initialPageSize: 50 })
      );

      act(() => {
        result.current.goToPage(5);
      });

      // Should stay on page 1
      expect(result.current.currentPage).toBe(1);
    });

    it('should handle invalid goToPage input (non-number)', () => {
      const { result } = renderHook(() => 
        usePagination({ totalItems: 150, initialPageSize: 50 })
      );

      const originalPage = result.current.currentPage;

      act(() => {
        result.current.goToPage('invalid');
      });

      // Should not change page
      expect(result.current.currentPage).toBe(originalPage);
    });
  });

  describe('Realistic Usage Scenarios', () => {
    it('should handle typical user table pagination (150 users, 50 per page)', () => {
      const { result } = renderHook(() => 
        usePagination({ totalItems: 150, initialPageSize: 50 })
      );

      expect(result.current.totalPages).toBe(3);
      expect(result.current.currentPage).toBe(1);

      // Navigate through pages
      act(() => {
        result.current.nextPage();
      });
      expect(result.current.currentPage).toBe(2);

      act(() => {
        result.current.nextPage();
      });
      expect(result.current.currentPage).toBe(3);
      expect(result.current.hasNextPage).toBe(false);
    });

    it('should handle audit logs pagination (500 logs, 100 per page)', () => {
      const { result } = renderHook(() => 
        usePagination({ totalItems: 500, initialPageSize: 100 })
      );

      expect(result.current.totalPages).toBe(5);

      // Jump to last page
      act(() => {
        result.current.goToPage(5);
      });
      expect(result.current.currentPage).toBe(5);
      expect(result.current.hasNextPage).toBe(false);
      expect(result.current.hasPrevPage).toBe(true);
    });

    it('should handle page size change in user interface', () => {
      const { result } = renderHook(() => 
        usePagination({ totalItems: 150, initialPageSize: 50, initialPage: 2 })
      );

      expect(result.current.currentPage).toBe(2);
      expect(result.current.totalPages).toBe(3);

      // User changes page size from 50 to 25
      act(() => {
        result.current.setPageSize(25);
      });

      // Should reset to page 1 and recalculate total pages
      expect(result.current.currentPage).toBe(1);
      expect(result.current.totalPages).toBe(6);
    });

    it('should handle empty search results', () => {
      const { result } = renderHook(() => 
        usePagination({ totalItems: 0, initialPageSize: 50 })
      );

      expect(result.current.totalPages).toBe(0);
      expect(result.current.currentPage).toBe(1);
      expect(result.current.hasNextPage).toBe(false);
      expect(result.current.hasPrevPage).toBe(false);

      // Attempting to navigate should not crash
      act(() => {
        result.current.nextPage();
        result.current.prevPage();
        result.current.goToPage(5);
      });

      expect(result.current.currentPage).toBe(1);
    });
  });
});
