/**
 * Example usage of usePagination hook
 * 
 * This file demonstrates how to use the usePagination hook in a real component.
 * It shows integration with data fetching and UI rendering.
 */

import React, { useState, useEffect } from 'react';
import { usePagination } from './usePagination';

/**
 * Example: User Table with Pagination
 */
export function UserTableExample() {
  const [users, setUsers] = useState([]);
  const [totalUsers, setTotalUsers] = useState(0);
  const [loading, setLoading] = useState(false);

  // Initialize pagination with 50 items per page
  const {
    currentPage,
    pageSize,
    totalPages,
    hasNextPage,
    hasPrevPage,
    goToPage,
    nextPage,
    prevPage,
    setPageSize,
  } = usePagination({ 
    totalItems: totalUsers, 
    initialPageSize: 50 
  });

  // Fetch users when page or page size changes
  useEffect(() => {
    const fetchUsers = async () => {
      setLoading(true);
      try {
        // Calculate offset for API request
        const offset = (currentPage - 1) * pageSize;
        
        // Example API call
        const response = await fetch(
          `/api/admin/users?limit=${pageSize}&offset=${offset}`
        );
        const data = await response.json();
        
        setUsers(data.users);
        setTotalUsers(data.total);
      } catch (error) {
        console.error('Failed to fetch users:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, [currentPage, pageSize]);

  return (
    <div className="user-table-container">
      <h2>User Management</h2>
      
      {/* Page Size Selector */}
      <div className="page-size-selector">
        <label htmlFor="pageSize">Items per page:</label>
        <select
          id="pageSize"
          value={pageSize}
          onChange={(e) => setPageSize(Number(e.target.value))}
        >
          <option value={25}>25</option>
          <option value={50}>50</option>
          <option value={100}>100</option>
        </select>
      </div>

      {/* User Table */}
      {loading ? (
        <div>Loading...</div>
      ) : (
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Email</th>
              <th>Role</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id}>
                <td>{user.id}</td>
                <td>{user.email}</td>
                <td>{user.role}</td>
                <td>{user.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {/* Pagination Controls */}
      <div className="pagination-controls">
        <button 
          onClick={prevPage} 
          disabled={!hasPrevPage || loading}
        >
          Previous
        </button>

        <span className="page-info">
          Page {currentPage} of {totalPages} ({totalUsers} total items)
        </span>

        <button 
          onClick={nextPage} 
          disabled={!hasNextPage || loading}
        >
          Next
        </button>
      </div>

      {/* Page Number Input */}
      <div className="page-jump">
        <label htmlFor="pageNumber">Go to page:</label>
        <input
          id="pageNumber"
          type="number"
          min={1}
          max={totalPages}
          placeholder={currentPage}
          onKeyPress={(e) => {
            if (e.key === 'Enter') {
              const page = Number(e.target.value);
              goToPage(page);
              e.target.value = '';
            }
          }}
        />
      </div>
    </div>
  );
}

/**
 * Example: Audit Logs with Pagination
 */
export function AuditLogsExample() {
  const [logs, setLogs] = useState([]);
  const [totalLogs, setTotalLogs] = useState(0);

  // Initialize pagination with 100 items per page (as per design spec)
  const {
    currentPage,
    pageSize,
    totalPages,
    hasNextPage,
    hasPrevPage,
    nextPage,
    prevPage,
  } = usePagination({ 
    totalItems: totalLogs, 
    initialPageSize: 100 
  });

  useEffect(() => {
    const fetchLogs = async () => {
      const offset = (currentPage - 1) * pageSize;
      const response = await fetch(
        `/api/admin/logs/access?limit=${pageSize}&offset=${offset}`
      );
      const data = await response.json();
      
      setLogs(data.logs);
      setTotalLogs(data.count);
    };

    fetchLogs();
  }, [currentPage, pageSize]);

  return (
    <div className="audit-logs-container">
      <h2>Audit Logs</h2>
      
      <table>
        <thead>
          <tr>
            <th>Timestamp</th>
            <th>User</th>
            <th>Endpoint</th>
            <th>Access Granted</th>
          </tr>
        </thead>
        <tbody>
          {logs.map((log) => (
            <tr key={log.id}>
              <td>{new Date(log.timestamp).toLocaleString()}</td>
              <td>{log.userEmail}</td>
              <td>{log.endpoint}</td>
              <td>{log.accessGranted ? '✓' : '✗'}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="pagination-controls">
        <button onClick={prevPage} disabled={!hasPrevPage}>
          Previous
        </button>
        <span>
          Page {currentPage} of {totalPages}
        </span>
        <button onClick={nextPage} disabled={!hasNextPage}>
          Next
        </button>
      </div>
    </div>
  );
}

/**
 * Example: Simple Pagination with Page Numbers
 */
export function PageNumbersExample() {
  const [totalItems] = useState(250);
  
  const {
    currentPage,
    totalPages,
    goToPage,
  } = usePagination({ 
    totalItems, 
    initialPageSize: 25 
  });

  // Generate array of page numbers to display
  const getPageNumbers = () => {
    const pages = [];
    const maxPagesToShow = 5;
    
    let startPage = Math.max(1, currentPage - Math.floor(maxPagesToShow / 2));
    let endPage = Math.min(totalPages, startPage + maxPagesToShow - 1);
    
    // Adjust start if we're near the end
    if (endPage - startPage < maxPagesToShow - 1) {
      startPage = Math.max(1, endPage - maxPagesToShow + 1);
    }
    
    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }
    
    return pages;
  };

  return (
    <div className="pagination-numbers">
      {/* First page button */}
      {currentPage > 1 && (
        <button onClick={() => goToPage(1)}>First</button>
      )}
      
      {/* Page number buttons */}
      {getPageNumbers().map((pageNum) => (
        <button
          key={pageNum}
          onClick={() => goToPage(pageNum)}
          className={pageNum === currentPage ? 'active' : ''}
        >
          {pageNum}
        </button>
      ))}
      
      {/* Last page button */}
      {currentPage < totalPages && (
        <button onClick={() => goToPage(totalPages)}>Last</button>
      )}
    </div>
  );
}
