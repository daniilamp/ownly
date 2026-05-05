# Implementation Plan: Admin Panel

## Overview

This implementation plan creates a comprehensive admin panel for the Ownly platform, providing administrators with centralized control over users, API keys, audit logs, and system monitoring. The panel is built as a React-based single-page application using TypeScript/JavaScript with React Router v6, integrating with existing backend admin endpoints at `/api/admin/*`.

The implementation follows a 6-phase approach: Core Infrastructure → User Management → API Key Management → Audit Logs → Dashboard & Statistics → Polish & Testing.

## Tasks

### Phase 1: Core Infrastructure

- [x] 1. Set up admin routing and authentication protection
  - Create `src/pages/admin/` directory structure
  - Implement `AdminRouter` component with ADMIN role verification
  - Add admin routes to main App.jsx router configuration
  - Implement redirect logic for unauthorized/unauthenticated users
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5_

- [ ] 2. Create admin layout components
  - [x] 2.1 Implement AdminLayout component with responsive sidebar
    - Create `src/components/admin/AdminLayout.jsx`
    - Implement sidebar state management for mobile/desktop
    - Add main content area with proper spacing
    - _Requirements: 19.1, 19.4, 20.1, 20.2, 20.3, 20.4_
  
  - [x] 2.2 Implement AdminSidebar navigation component
    - Create `src/components/admin/AdminSidebar.jsx`
    - Add navigation links (Dashboard, Users, API Keys, Audit Logs)
    - Display admin user email and role from AuthContext
    - Implement active route highlighting
    - Add logout button functionality
    - _Requirements: 19.1, 19.2, 19.3, 19.5, 19.6_
  
  - [x] 2.3 Write unit tests for AdminRouter and AdminLayout
    - Test role-based access control and redirects
    - Test responsive sidebar toggle behavior
    - Test navigation link highlighting
    - _Requirements: 1.1, 1.2, 1.3_

- [ ] 3. Create shared UI components
  - [x] 3.1 Implement FilterPanel component
    - Create `src/components/admin/FilterPanel.jsx`
    - Support text input, dropdown, date range, and multi-select filters
    - Display active filter count badge
    - Implement reset all filters functionality
    - Add responsive layout for mobile/desktop
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 8.1, 8.2, 8.3, 8.4, 12.1, 12.2, 12.3, 12.4, 12.5, 12.6_
  
  - [x] 3.2 Implement ConfirmationDialog component
    - Create `src/components/admin/ConfirmationDialog.jsx`
    - Add optional reason text input with validation
    - Implement danger styling for destructive actions
    - Add keyboard shortcuts (Enter to confirm, Escape to cancel)
    - _Requirements: 4.2, 4.6, 5.2, 5.4, 9.2, 9.3, 22.1, 22.2, 22.3, 22.4, 22.5, 22.6_
  
  - [x] 3.3 Implement ToastNotification component
    - Create `src/components/admin/ToastNotification.jsx`
    - Support success, error, info, and warning types
    - Implement auto-dismiss after configurable duration
    - Add manual close button
    - Add slide-in animation
    - _Requirements: 21.1, 21.2, 21.6_
  
  - [x] 3.4 Write unit tests for shared components
    - Test FilterPanel filter state and onChange callbacks
    - Test ConfirmationDialog validation and callbacks
    - Test ToastNotification auto-dismiss timing
    - _Requirements: 3.1, 4.6, 21.6_

- [ ] 4. Create custom hooks for admin functionality
  - [x] 4.1 Implement useAdminAPI hook
    - Create `src/hooks/useAdminAPI.js`
    - Implement user management methods (listUsers, getUserById, updateUserRole, updateUserStatus)
    - Implement API key management methods (listAPIKeys, revokeAPIKey)
    - Implement audit log methods (getAccessLogs, getRoleChangeLogs, getSecurityEvents)
    - Implement statistics methods (getUserStats, getAPIUsageStats, getSystemHealth, getSecuritySummary)
    - Add automatic JWT token injection from localStorage
    - Implement error handling with user-friendly messages
    - Add loading state management
    - _Requirements: 2.2, 4.3, 5.3, 7.2, 9.4, 11.2, 13.2, 14.2, 14.6, 16.2, 16.5, 17.2_
  
  - [x] 4.2 Implement useDebounce hook
    - Create `src/hooks/useDebounce.js`
    - Implement 300ms debounce for search inputs
    - _Requirements: 3.5, 8.5, 24.2_
  
  - [x] 4.3 Implement usePagination hook
    - Create `src/hooks/usePagination.js`
    - Implement page navigation (goToPage, nextPage, prevPage)
    - Add page size configuration
    - Calculate total pages from total items
    - _Requirements: 2.5, 7.6, 11.5, 24.1_
  
  - [x] 4.4 Implement useAutoRefresh hook
    - Create `src/hooks/useAutoRefresh.js`
    - Support configurable refresh intervals
    - Add enable/disable toggle
    - Implement cleanup on unmount
    - _Requirements: 11.6, 18.6, 24.3_
  
  - [x] 4.5 Write unit tests for custom hooks
    - Test useDebounce timing and value updates
    - Test usePagination boundary conditions
    - Test useAutoRefresh interval execution and cleanup
    - _Requirements: 3.5, 24.1, 24.2_

- [x] 5. Checkpoint - Ensure core infrastructure is working
  - Verify admin routes are protected and redirect correctly
  - Test responsive sidebar behavior on different screen sizes
  - Ensure all shared components render without errors
  - Verify custom hooks function correctly
  - Ensure all tests pass, ask the user if questions arise.

### Phase 2: User Management

- [ ] 6. Implement user management page structure
  - [x] 6.1 Create UserManagement page component
    - Create `src/pages/admin/UserManagement.jsx`
    - Implement component state (users, filters, pagination, loading, error)
    - Fetch user data from useAdminAPI on mount
    - Implement search and filter logic with debouncing
    - Add pagination controls
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 3.1, 3.2, 3.3, 3.4, 3.5, 3.6_
  
  - [x] 6.2 Implement UserTable component
    - Create `src/components/admin/UserTable.jsx`
    - Display columns: User ID, Email, Role, Status, Registration Date, Actions
    - Implement sortable columns (default: registration date descending)
    - Add loading skeleton state
    - Add empty state message
    - Display error message on fetch failure
    - _Requirements: 2.1, 2.3, 2.4, 2.5, 2.6, 21.3, 21.4_
  
  - [x] 6.3 Write unit tests for UserManagement page
    - Test user data fetching and display
    - Test search debouncing behavior
    - Test filter application
    - Test pagination controls
    - _Requirements: 2.2, 2.5, 3.5_

- [ ] 7. Implement user role management
  - [x] 7.1 Create RoleSelector component
    - Create `src/components/admin/RoleSelector.jsx`
    - Display dropdown with USER, BUSINESS, ADMIN options
    - Trigger ConfirmationDialog on role selection
    - Show additional warning for ADMIN role assignment
    - _Requirements: 4.1, 4.2, 22.3_
  
  - [x] 7.2 Implement role change functionality in UserManagement
    - Add updateUserRole handler with confirmation dialog
    - Require reason text input (minimum 10 characters)
    - Call useAdminAPI.updateUserRole with admin user ID
    - Update user table on success
    - Display error toast on failure
    - Display success toast on success
    - _Requirements: 4.2, 4.3, 4.4, 4.5, 4.6, 21.1, 21.2, 23.1, 23.4_
  
  - [x] 7.3 Write integration tests for role management
    - Test role change flow with confirmation
    - Test reason validation (minimum 10 characters)
    - Test success and error toast notifications
    - _Requirements: 4.2, 4.3, 4.4, 4.5, 4.6_

- [ ] 8. Implement user status management
  - [x] 8.1 Create StatusToggle component
    - Create `src/components/admin/StatusToggle.jsx`
    - Display visual indicator (green for active, red for inactive)
    - Trigger ConfirmationDialog on toggle
    - _Requirements: 5.1, 5.2, 5.6_
  
  - [x] 8.2 Implement status change functionality in UserManagement
    - Add updateUserStatus handler with confirmation dialog
    - Require reason for deactivation (minimum 10 characters)
    - Call useAdminAPI.updateUserStatus with admin user ID
    - Update user table on success
    - Display error toast on failure
    - Display success toast on success
    - _Requirements: 5.2, 5.3, 5.4, 5.5, 21.1, 21.2, 23.3, 23.4_
  
  - [x] 8.3 Write integration tests for status management
    - Test status toggle flow with confirmation
    - Test reason requirement for deactivation
    - Test success and error toast notifications
    - _Requirements: 5.2, 5.3, 5.4, 5.5_

- [ ] 9. Implement user detail view
  - [x] 9.1 Create UserDetailView page component
    - Create `src/pages/admin/UserDetailView.jsx`
    - Fetch detailed user data from useAdminAPI.getUserById
    - Display user profile information (email, role, status, registration date)
    - Display KYC verification status and completion date
    - Display recent activity timeline
    - Add back button to return to user list
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6_
  
  - [x] 9.2 Write integration tests for user detail view
    - Test user data fetching and display
    - Test navigation from user list to detail view
    - Test back button navigation
    - _Requirements: 6.1, 6.2, 6.6_

- [x] 10. Checkpoint - Ensure user management is complete
  - Verify user search and filtering works correctly
  - Test role change with confirmation and reason
  - Test status toggle with confirmation and reason
  - Verify user detail view displays all information
  - Ensure all tests pass, ask the user if questions arise.

### Phase 3: API Key Management

- [ ] 11. Implement API key management page structure
  - [x] 11.1 Create APIKeyManagement page component
    - Create `src/pages/admin/APIKeyManagement.jsx`
    - Implement component state (apiKeys, filters, pagination, loading, error)
    - Fetch API key data from useAdminAPI on mount
    - Implement search and filter logic with debouncing
    - Add pagination controls
    - _Requirements: 7.1, 7.2, 7.5, 7.6, 8.1, 8.2, 8.3, 8.4, 8.5_
  
  - [x] 11.2 Implement APIKeyTable component
    - Create `src/components/admin/APIKeyTable.jsx`
    - Display columns: API Key ID, Business User Email, Masked Key, Status, Creation Date, Actions
    - Implement key masking (show only last 4 characters in format ****-****-****-XXXX)
    - Display status indicator (active/revoked)
    - Add loading skeleton state
    - Add empty state message
    - _Requirements: 7.1, 7.3, 7.4, 7.5, 21.3, 21.4_
  
  - [x] 11.3 Write unit tests for APIKeyManagement page
    - Test API key data fetching and display
    - Test key masking format
    - Test filter application
    - Test pagination controls
    - _Requirements: 7.2, 7.3, 8.5_

- [ ] 12. Implement API key revocation
  - [x] 12.1 Add revoke functionality to APIKeyTable
    - Display revoke button for each active API key
    - Trigger ConfirmationDialog on revoke button click
    - Require reason text input (minimum 10 characters)
    - _Requirements: 9.1, 9.2, 9.3_
  
  - [x] 12.2 Implement revoke handler in APIKeyManagement
    - Add revokeAPIKey handler with confirmation dialog
    - Call useAdminAPI.revokeAPIKey with admin user ID and reason
    - Update API key table on success
    - Display error toast on failure
    - Display success toast on success
    - _Requirements: 9.3, 9.4, 9.5, 9.6, 21.1, 21.2, 23.2, 23.4_
  
  - [x] 12.3 Write integration tests for API key revocation
    - Test revoke flow with confirmation
    - Test reason validation (minimum 10 characters)
    - Test success and error toast notifications
    - _Requirements: 9.2, 9.3, 9.4, 9.5, 9.6_

- [ ] 13. Implement API key usage statistics
  - [x] 13.1 Create UsageStatisticsModal component
    - Create `src/components/admin/UsageStatisticsModal.jsx`
    - Fetch usage data from useAdminAPI.getAPIUsageStats
    - Display total requests count
    - Display requests by endpoint breakdown
    - Display usage timeline chart for last 30 days (using recharts)
    - Display permissions associated with the API key
    - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5, 10.6_
  
  - [x] 13.2 Add view usage functionality to APIKeyTable
    - Add "View Usage" button for each API key
    - Open UsageStatisticsModal on button click
    - Pass API key ID to modal for data fetching
    - _Requirements: 10.1_
  
  - [x] 13.3 Write integration tests for usage statistics
    - Test modal opening and data fetching
    - Test usage data display
    - Test chart rendering
    - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5_

- [x] 14. Checkpoint - Ensure API key management is complete
  - Verify API key filtering and search works correctly
  - Test API key revocation with confirmation and reason
  - Verify usage statistics modal displays all data
  - Ensure all tests pass, ask the user if questions arise.

### Phase 4: Audit Logs

- [ ] 15. Implement audit logs page structure
  - [x] 15.1 Create AuditLogs page component
    - Create `src/pages/admin/AuditLogs.jsx`
    - Implement component state (logType, logs, filters, pagination, loading, autoRefresh)
    - Add log type selector tabs (Access Logs, Role Changes, Security Events)
    - Fetch appropriate log data based on selected log type
    - Implement filter logic with debouncing
    - Add pagination controls
    - Implement auto-refresh toggle (30 second interval)
    - _Requirements: 11.1, 11.2, 11.5, 11.6, 12.1, 12.2, 12.3, 12.4, 12.5, 12.6, 13.1, 13.2, 13.6, 14.1, 14.2, 14.5_
  
  - [x] 15.2 Implement LogTable component
    - Create `src/components/admin/LogTable.jsx`
    - Support different column configurations based on log type
    - Display color-coded indicators (green for granted, red for denied, yellow/orange for security events)
    - Implement sortable columns (default: timestamp descending)
    - Add loading skeleton state
    - Add empty state message
    - _Requirements: 11.1, 11.3, 11.4, 13.1, 13.3, 13.4, 13.5, 14.1, 14.3, 14.4, 21.3, 21.4_
  
  - [x] 15.3 Write unit tests for AuditLogs page
    - Test log type switching
    - Test filter application
    - Test auto-refresh toggle
    - Test pagination controls
    - _Requirements: 11.6, 12.5, 12.6_

- [ ] 16. Implement access control logs display
  - [x] 16.1 Add access log columns to LogTable
    - Display: Timestamp, User Email, Endpoint, Access Granted, Role
    - Implement color-coded access granted indicator (green/red)
    - Add endpoint filter support
    - _Requirements: 11.1, 11.3, 12.4_
  
  - [x] 16.2 Implement access log filtering
    - Add date range picker filter
    - Add user email search filter
    - Add endpoint search filter
    - Add access granted status filter (granted, denied, all)
    - _Requirements: 12.1, 12.2, 12.3, 12.4, 12.5_
  
  - [x] 16.3 Write integration tests for access logs
    - Test access log display and filtering
    - Test color-coded indicators
    - Test auto-refresh behavior
    - _Requirements: 11.1, 11.3, 11.6, 12.1, 12.2, 12.3, 12.4_

- [ ] 17. Implement role change logs display
  - [x] 17.1 Add role change log columns to LogTable
    - Display: Timestamp, User Email, Old Role → New Role, Changed By, Reason
    - Implement role transition visual indicators
    - Display administrator who made the change
    - Display reason for role change
    - _Requirements: 13.1, 13.3, 13.4, 13.5_
  
  - [x] 17.2 Write integration tests for role change logs
    - Test role change log display
    - Test role transition indicators
    - Test admin and reason display
    - _Requirements: 13.1, 13.3, 13.4, 13.5_

- [ ] 18. Implement security events display
  - [x] 18.1 Add security event columns to LogTable
    - Display: Timestamp, User Email, Endpoint, Event Type, Severity Level
    - Implement severity level color-coding (low, medium, high)
    - Highlight security events with warning colors
    - _Requirements: 14.1, 14.3, 14.4_
  
  - [x] 18.2 Add security summary statistics
    - Fetch security summary from useAdminAPI.getSecuritySummary
    - Display total events count
    - Display events by severity breakdown
    - Display top endpoints with security events
    - _Requirements: 14.5, 14.6_
  
  - [x] 18.3 Write integration tests for security events
    - Test security event display
    - Test severity level indicators
    - Test security summary statistics
    - _Requirements: 14.1, 14.3, 14.4, 14.5, 14.6_

- [ ] 19. Implement audit log export functionality
  - [x] 19.1 Create ExportButton component
    - Create `src/components/admin/ExportButton.jsx`
    - Add export button above log table
    - Implement CSV generation from current filtered logs
    - Include all log fields in CSV export
    - Generate filename with format "audit-logs-YYYY-MM-DD.csv"
    - Display progress indicator during export
    - Trigger browser download on completion
    - _Requirements: 15.1, 15.2, 15.3, 15.4, 15.5, 15.6_
  
  - [x] 19.2 Write integration tests for log export
    - Test CSV generation with filtered logs
    - Test filename format
    - Test download trigger
    - _Requirements: 15.2, 15.3, 15.4, 15.6_

- [x] 20. Checkpoint - Ensure audit logs are complete
  - Verify all three log types display correctly
  - Test log filtering and search for each type
  - Test auto-refresh functionality
  - Verify CSV export works with filtered data
  - Ensure all tests pass, ask the user if questions arise.

### Phase 5: Dashboard & Statistics

- [ ] 21. Implement admin dashboard page
  - [~] 21.1 Create AdminDashboard page component
    - Create `src/pages/admin/AdminDashboard.jsx`
    - Implement component state (userStats, apiStats, systemHealth, recentActivity, loading)
    - Fetch statistics data from multiple useAdminAPI methods
    - Implement auto-refresh for stats (60 seconds) and activity (30 seconds)
    - Add loading states for each section
    - _Requirements: 16.1, 16.2, 16.4, 16.5, 17.1, 17.2, 18.1, 18.2_
  
  - [~] 21.2 Create StatisticsCards component
    - Create `src/components/admin/StatisticsCards.jsx`
    - Display total user count by role (USER, BUSINESS, ADMIN)
    - Display KYC verification statistics (completed, pending, rejected)
    - Display API usage statistics by business
    - Use card layout with visual charts (recharts)
    - _Requirements: 16.1, 16.3, 16.4, 16.6_
  
  - [~] 21.3 Write unit tests for dashboard components
    - Test statistics data fetching and display
    - Test auto-refresh intervals
    - Test loading states
    - _Requirements: 16.2, 16.5, 17.2, 18.2_

- [ ] 22. Implement system health monitoring
  - [~] 22.1 Create SystemHealthIndicator component
    - Create `src/components/admin/SystemHealthIndicator.jsx`
    - Fetch health data from useAdminAPI.getSystemHealth
    - Display system health status indicator
    - Display database connection status
    - Display API response time metrics
    - Display error rate percentage
    - Use color-coded indicators (green for healthy, yellow for warning, red for critical)
    - _Requirements: 17.1, 17.2, 17.3, 17.4, 17.5, 17.6_
  
  - [~] 22.2 Write integration tests for system health
    - Test health data fetching and display
    - Test color-coded status indicators
    - Test metric display
    - _Requirements: 17.1, 17.2, 17.3, 17.4, 17.5, 17.6_

- [ ] 23. Implement recent activity timeline
  - [~] 23.1 Create RecentActivityTimeline component
    - Create `src/components/admin/RecentActivityTimeline.jsx`
    - Fetch recent logs from multiple log endpoints
    - Display last 20 events in chronological order
    - Show event type icons (user registration, role change, API key creation, access denied)
    - Display relative timestamps (e.g., "5 minutes ago") using date-fns
    - Implement auto-refresh every 30 seconds
    - _Requirements: 18.1, 18.2, 18.3, 18.4, 18.5, 18.6_
  
  - [~] 23.2 Write integration tests for activity timeline
    - Test activity data fetching and display
    - Test event type icons
    - Test relative timestamp formatting
    - Test auto-refresh behavior
    - _Requirements: 18.1, 18.2, 18.3, 18.4, 18.5, 18.6_

- [~] 24. Checkpoint - Ensure dashboard is complete
  - Verify all statistics cards display correctly
  - Test system health indicator with different statuses
  - Verify recent activity timeline updates automatically
  - Ensure all tests pass, ask the user if questions arise.

### Phase 6: Polish & Testing

- [ ] 25. Implement responsive design refinements
  - [~] 25.1 Test and refine desktop layout (≥1024px)
    - Verify persistent sidebar displays correctly
    - Ensure tables fit within viewport
    - Test all modals and dialogs
    - _Requirements: 20.1_
  
  - [~] 25.2 Test and refine tablet layout (768-1023px)
    - Verify collapsible sidebar behavior
    - Ensure tables are readable
    - Test touch interactions
    - _Requirements: 20.2_
  
  - [~] 25.3 Test and refine mobile layout (<768px)
    - Verify hamburger menu functionality
    - Ensure horizontal scroll for tables
    - Test touch targets (minimum 44x44px)
    - Verify modals are centered and responsive
    - _Requirements: 20.3, 20.4, 20.5, 20.6_

- [ ] 26. Implement accessibility improvements
  - [~] 26.1 Add keyboard navigation support
    - Ensure all interactive elements are keyboard accessible
    - Implement visible focus indicators
    - Add keyboard shortcuts for common actions
    - Trap focus in modals
    - _Requirements: Design accessibility requirements_
  
  - [~] 26.2 Add ARIA labels and semantic HTML
    - Add ARIA labels for icon buttons
    - Use semantic HTML elements
    - Implement ARIA live regions for dynamic content
    - Ensure form inputs have associated labels
    - _Requirements: Design accessibility requirements_
  
  - [~] 26.3 Verify color contrast compliance
    - Check all text meets WCAG AA standards (4.5:1 ratio)
    - Verify color-coded indicators have additional visual cues
    - Test with color blindness simulators
    - _Requirements: Design accessibility requirements_

- [ ] 27. Implement performance optimizations
  - [~] 27.1 Add lazy loading for admin routes
    - Implement React.lazy for admin page components
    - Add Suspense boundaries with loading fallbacks
    - Code-split admin routes from main bundle
    - _Requirements: 24.4_
  
  - [~] 27.2 Optimize table rendering
    - Implement React.memo for table row components
    - Add virtual scrolling for tables with >100 rows
    - Optimize re-renders with useMemo and useCallback
    - _Requirements: 24.5_
  
  - [~] 27.3 Implement data caching
    - Cache statistics data for 60 seconds
    - Implement cache invalidation on mutations
    - Add cache warming for frequently accessed data
    - _Requirements: 24.3_

- [ ] 28. Add error boundary and error handling
  - [~] 28.1 Create ErrorBoundary component
    - Create `src/components/admin/ErrorBoundary.jsx`
    - Catch and display component errors gracefully
    - Add error reporting mechanism
    - Provide fallback UI with retry option
    - _Requirements: 21.1, 21.2, 21.4_
  
  - [~] 28.2 Enhance error messages
    - Map API error codes to user-friendly messages
    - Add contextual error information
    - Implement error recovery suggestions
    - _Requirements: 21.1, 21.5_

- [ ] 29. Write comprehensive integration tests
  - [~] 29.1 Write E2E test for admin access control
    - Test non-admin user cannot access /admin routes
    - Test unauthenticated user is redirected to login
    - Test admin user can access all admin routes
    - _Requirements: 1.1, 1.2, 1.3_
  
  - [~] 29.2 Write E2E test for user management workflow
    - Test search for user by email
    - Test filter users by role and status
    - Test change user role with reason
    - Test deactivate user with reason
    - Test view user details
    - _Requirements: 3.1, 3.2, 3.3, 4.2, 4.3, 5.2, 5.3, 6.1_
  
  - [~] 29.3 Write E2E test for API key management workflow
    - Test view all API keys
    - Test filter by status
    - Test revoke API key with reason
    - Test view usage statistics
    - _Requirements: 8.1, 8.2, 9.2, 9.3, 10.1_
  
  - [~] 29.4 Write E2E test for audit log workflow
    - Test switch between log types
    - Test filter logs by date range
    - Test export logs to CSV
    - Test auto-refresh logs
    - _Requirements: 11.6, 12.1, 12.5, 15.1, 15.2_
  
  - [~] 29.5 Write E2E test for dashboard workflow
    - Test view statistics cards
    - Test check system health status
    - Test view recent activity timeline
    - _Requirements: 16.1, 17.1, 18.1_

- [ ] 30. Create documentation and finalize
  - [~] 30.1 Add inline code documentation
    - Document all component props with JSDoc
    - Add comments for complex logic
    - Document custom hooks usage
    - _Requirements: All_
  
  - [~] 30.2 Create admin panel user guide
    - Document how to access admin panel
    - Explain each section and its functionality
    - Provide troubleshooting tips
    - _Requirements: All_
  
  - [~] 30.3 Update main App.jsx with admin routes
    - Import admin components
    - Add protected admin routes
    - Ensure proper route hierarchy
    - _Requirements: 1.1, 19.2, 19.3_

- [~] 31. Final checkpoint - Complete testing and verification
  - Run all unit tests and ensure 80% coverage
  - Run all integration tests
  - Run all E2E tests
  - Perform manual testing on different browsers (Chrome, Firefox, Safari, Edge)
  - Verify responsive design on different devices
  - Test accessibility with screen readers
  - Verify performance metrics (initial load < 2 seconds, table pagination < 500ms)
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional testing tasks and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation at the end of each phase
- The implementation uses TypeScript/JavaScript with React and follows existing project patterns
- All admin actions include admin user ID for audit trail compliance
- Confirmation dialogs are required for all destructive actions (role changes, status changes, API key revocation)
- Auto-refresh intervals: Statistics (60s), Recent Activity (30s), Audit Logs (30s)
- Pagination limits: Users/API Keys (50 per page), Audit Logs (100 per page)
- Debounce delay: 300ms for all search inputs
- The admin panel integrates with existing backend endpoints at `/api/admin/*`
