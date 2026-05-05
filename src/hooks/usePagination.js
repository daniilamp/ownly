/**
 * usePagination Hook
 * Manages pagination state and logic for data tables
 * 
 * This hook provides a complete pagination solution including:
 * - Current page tracking
 * - Page size configuration
 * - Total pages calculation
 * - Navigation functions (next, previous, go to page)
 * - Boundary checking (hasNextPage, hasPrevPage)
 * 
 * @example
 * const {
 *   currentPage,
 *   pageSize,
 *   totalPages,
 *   goToPage,
 *   nextPage,
 *   prevPage,
 *   setPageSize,
 *   hasNextPage,
 *   hasPrevPage
 * } = usePagination({ totalItems: 150, initialPageSize: 50 });
 * 
 * // Use currentPage and pageSize to fetch data
 * useEffect(() => {
 *   fetchData({ offset: (currentPage - 1) * pageSize, limit: pageSize });
 * }, [currentPage, pageSize]);
 */

import { useState, useMemo, useCallback } from 'react';

/**
 * usePagination Hook
 * 
 * @param {Object} options - Configuration options
 * @param {number} options.totalItems - Total number of items (default: 0)
 * @param {number} options.initialPageSize - Initial page size (default: 50)
 * @param {number} options.initialPage - Initial page number (default: 1)
 * @returns {Object} Pagination state and functions
 */
export function usePagination({ 
  totalItems = 0, 
  initialPageSize = 50,
  initialPage = 1 
} = {}) {
  const [currentPage, setCurrentPage] = useState(initialPage);
  const [pageSize, setPageSizeState] = useState(initialPageSize);

  // Calculate total pages based on total items and page size
  const totalPages = useMemo(() => {
    if (totalItems === 0 || pageSize === 0) return 0;
    return Math.ceil(totalItems / pageSize);
  }, [totalItems, pageSize]);

  // Check if there's a next page
  const hasNextPage = useMemo(() => {
    return currentPage < totalPages;
  }, [currentPage, totalPages]);

  // Check if there's a previous page
  const hasPrevPage = useMemo(() => {
    return currentPage > 1;
  }, [currentPage]);

  /**
   * Navigate to a specific page
   * @param {number} page - Page number to navigate to (1-indexed)
   */
  const goToPage = useCallback((page) => {
    // Validate page number type
    if (typeof page !== 'number') {
      console.warn('Invalid page number. Page must be a positive number.');
      return;
    }

    // Handle edge case: if totalPages is 0, stay on page 1
    if (totalPages === 0) {
      setCurrentPage(1);
      return;
    }

    // Clamp page number to valid range [1, totalPages]
    // This handles negative numbers, zero, and numbers beyond totalPages
    const validPage = Math.min(Math.max(1, page), totalPages);
    setCurrentPage(validPage);
  }, [totalPages]);

  /**
   * Navigate to the next page
   */
  const nextPage = useCallback(() => {
    if (hasNextPage) {
      setCurrentPage(prev => prev + 1);
    }
  }, [hasNextPage]);

  /**
   * Navigate to the previous page
   */
  const prevPage = useCallback(() => {
    if (hasPrevPage) {
      setCurrentPage(prev => prev - 1);
    }
  }, [hasPrevPage]);

  /**
   * Update page size and reset to first page
   * @param {number} newPageSize - New page size
   */
  const setPageSize = useCallback((newPageSize) => {
    // Validate page size
    if (typeof newPageSize !== 'number' || newPageSize < 1) {
      console.warn('Invalid page size. Page size must be a positive number.');
      return;
    }

    setPageSizeState(newPageSize);
    // Reset to first page when page size changes
    setCurrentPage(1);
  }, []);

  return {
    currentPage,
    pageSize,
    totalItems,
    totalPages,
    hasNextPage,
    hasPrevPage,
    goToPage,
    nextPage,
    prevPage,
    setPageSize,
  };
}
