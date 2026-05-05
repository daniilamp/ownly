# Requirements Document: Admin Panel

## Introduction

This document defines the requirements for implementing a comprehensive admin panel for the Ownly platform. The admin panel provides administrators with a centralized interface to manage users, business accounts, API keys, and monitor system activity through logs and statistics. The panel leverages existing backend admin endpoints and enforces ADMIN role access control.

## Glossary

- **Admin_Panel**: The frontend user interface for administrative operations
- **Admin_Dashboard**: The main dashboard view displaying system statistics and recent activity
- **User_Management_Interface**: The interface for viewing and managing user accounts
- **API_Key_Management_Interface**: The interface for viewing and managing business API keys
- **Audit_Log_Viewer**: The interface for viewing access control logs and security events
- **Statistics_Dashboard**: The interface displaying system metrics and usage statistics
- **Admin_API**: The backend API endpoints at /api/admin/* for administrative operations
- **User_Table**: The data table component displaying user information
- **API_Key_Table**: The data table component displaying API key information
- **Log_Table**: The data table component displaying audit log entries
- **Role_Selector**: The UI component for changing user roles
- **Status_Toggle**: The UI component for activating or deactivating user accounts
- **Confirmation_Dialog**: The modal dialog for confirming destructive actions
- **Filter_Panel**: The UI component for filtering and searching data
- **Export_Function**: The functionality to export audit logs for compliance
- **Authentication_Context**: The React context providing user authentication state
- **RBAC_System**: The role-based access control system enforcing permissions
- **Admin_Router**: The React router configuration for admin panel routes

## Requirements

### Requirement 1: Admin Panel Access Control

**User Story:** As a system administrator, I want the admin panel to be accessible only to users with ADMIN role, so that unauthorized users cannot access administrative functions.

#### Acceptance Criteria

1. WHEN a user navigates to /admin route, THE Admin_Router SHALL verify the user has ADMIN role
2. WHEN a user without ADMIN role attempts to access /admin route, THE Admin_Router SHALL redirect to the home page
3. WHEN a user is not authenticated, THE Admin_Router SHALL redirect to the login page
4. THE Admin_Panel SHALL display a "403 Forbidden" message if role verification fails
5. THE Admin_Panel SHALL verify ADMIN role on component mount before rendering content

### Requirement 2: User Management Display

**User Story:** As an administrator, I want to view a list of all users with their details, so that I can monitor user accounts.

#### Acceptance Criteria

1. THE User_Management_Interface SHALL display a table with user ID, email, role, status, and registration date
2. THE User_Management_Interface SHALL fetch user data from Admin_API endpoint /api/admin/users
3. WHEN user data is loading, THE User_Table SHALL display a loading indicator
4. WHEN user data fetch fails, THE User_Table SHALL display an error message
5. THE User_Table SHALL display pagination controls when user count exceeds 50 records
6. THE User_Table SHALL sort users by registration date in descending order by default

### Requirement 3: User Search and Filtering

**User Story:** As an administrator, I want to search and filter users, so that I can quickly find specific accounts.

#### Acceptance Criteria

1. THE Filter_Panel SHALL provide a search input field for filtering by email or user ID
2. THE Filter_Panel SHALL provide dropdown filters for role (USER, BUSINESS, ADMIN)
3. THE Filter_Panel SHALL provide dropdown filters for status (active, inactive, suspended)
4. WHEN a filter is applied, THE User_Table SHALL update to display only matching users
5. WHEN search input changes, THE User_Management_Interface SHALL debounce requests by 300 milliseconds
6. THE Filter_Panel SHALL display active filter count when filters are applied

### Requirement 4: User Role Management

**User Story:** As an administrator, I want to change user roles, so that I can assign appropriate permissions.

#### Acceptance Criteria

1. WHEN an administrator clicks on a user role, THE Role_Selector SHALL display a dropdown with USER, BUSINESS, and ADMIN options
2. WHEN an administrator selects a new role, THE Confirmation_Dialog SHALL prompt for confirmation and reason
3. WHEN role change is confirmed, THE User_Management_Interface SHALL send PUT request to /api/admin/users/:userId/role
4. WHEN role change succeeds, THE User_Table SHALL update the user row with new role
5. WHEN role change fails, THE User_Management_Interface SHALL display an error message
6. THE Confirmation_Dialog SHALL require a reason text input with minimum 10 characters

### Requirement 5: User Status Management

**User Story:** As an administrator, I want to activate or deactivate user accounts, so that I can control user access.

#### Acceptance Criteria

1. THE User_Table SHALL display a status toggle button for each user
2. WHEN an administrator clicks the status toggle, THE Confirmation_Dialog SHALL prompt for confirmation
3. WHEN status change is confirmed, THE User_Management_Interface SHALL send PUT request to /api/admin/users/:userId/status
4. WHEN deactivating a user, THE Confirmation_Dialog SHALL require a reason text input
5. WHEN status change succeeds, THE User_Table SHALL update the user row with new status
6. THE Status_Toggle SHALL display visual indicator for active (green) and inactive (red) states

### Requirement 6: User Detail View

**User Story:** As an administrator, I want to view detailed user information, so that I can review account history and activity.

#### Acceptance Criteria

1. WHEN an administrator clicks on a user row, THE User_Management_Interface SHALL navigate to user detail page
2. THE User_Management_Interface SHALL fetch detailed user data from /api/admin/users/:userId
3. THE User_Management_Interface SHALL display user profile information including email, role, status, and registration date
4. THE User_Management_Interface SHALL display KYC verification status and completion date
5. THE User_Management_Interface SHALL display recent activity timeline for the user
6. THE User_Management_Interface SHALL provide a back button to return to user list

### Requirement 7: API Key Management Display

**User Story:** As an administrator, I want to view all API keys with their associated businesses, so that I can monitor API access.

#### Acceptance Criteria

1. THE API_Key_Management_Interface SHALL display a table with API key ID, business user email, status, and creation date
2. THE API_Key_Management_Interface SHALL fetch API key data from Admin_API endpoint /api/admin/api-keys
3. THE API_Key_Table SHALL display masked API key values showing only last 4 characters
4. THE API_Key_Table SHALL display status indicator for active and revoked keys
5. THE API_Key_Table SHALL sort keys by creation date in descending order by default
6. THE API_Key_Table SHALL display pagination controls when key count exceeds 50 records

### Requirement 8: API Key Filtering

**User Story:** As an administrator, I want to filter API keys by status and business, so that I can find specific keys.

#### Acceptance Criteria

1. THE Filter_Panel SHALL provide dropdown filter for status (active, revoked)
2. THE Filter_Panel SHALL provide search input for filtering by business user email
3. WHEN a filter is applied, THE API_Key_Table SHALL update to display only matching keys
4. THE Filter_Panel SHALL display active filter count when filters are applied
5. THE API_Key_Management_Interface SHALL debounce search requests by 300 milliseconds

### Requirement 9: API Key Revocation

**User Story:** As an administrator, I want to revoke API keys, so that I can disable unauthorized or compromised access.

#### Acceptance Criteria

1. THE API_Key_Table SHALL display a revoke button for each active API key
2. WHEN an administrator clicks revoke button, THE Confirmation_Dialog SHALL prompt for confirmation and reason
3. THE Confirmation_Dialog SHALL require a reason text input with minimum 10 characters
4. WHEN revocation is confirmed, THE API_Key_Management_Interface SHALL send DELETE request to /api/admin/api-keys/:apiKeyId
5. WHEN revocation succeeds, THE API_Key_Table SHALL update the key row to show revoked status
6. WHEN revocation fails, THE API_Key_Management_Interface SHALL display an error message

### Requirement 10: API Key Usage Statistics

**User Story:** As an administrator, I want to view API key usage statistics, so that I can monitor API consumption.

#### Acceptance Criteria

1. WHEN an administrator clicks on an API key row, THE API_Key_Management_Interface SHALL display usage statistics modal
2. THE API_Key_Management_Interface SHALL fetch usage data from /api/admin/stats/api-usage
3. THE API_Key_Management_Interface SHALL display total requests count for the API key
4. THE API_Key_Management_Interface SHALL display requests by endpoint breakdown
5. THE API_Key_Management_Interface SHALL display usage timeline chart for last 30 days
6. THE API_Key_Management_Interface SHALL display permissions associated with the API key

### Requirement 11: Access Control Logs Display

**User Story:** As an administrator, I want to view access control logs, so that I can audit system access.

#### Acceptance Criteria

1. THE Audit_Log_Viewer SHALL display a table with timestamp, user email, endpoint, access granted status, and role
2. THE Audit_Log_Viewer SHALL fetch log data from Admin_API endpoint /api/admin/logs/access
3. THE Log_Table SHALL display color-coded indicators for granted (green) and denied (red) access
4. THE Log_Table SHALL sort logs by timestamp in descending order by default
5. THE Log_Table SHALL display pagination controls when log count exceeds 100 records
6. THE Audit_Log_Viewer SHALL auto-refresh logs every 30 seconds

### Requirement 12: Audit Log Filtering

**User Story:** As an administrator, I want to filter audit logs by date, user, and action type, so that I can find specific events.

#### Acceptance Criteria

1. THE Filter_Panel SHALL provide date range picker for filtering by start date and end date
2. THE Filter_Panel SHALL provide search input for filtering by user email
3. THE Filter_Panel SHALL provide dropdown filter for access granted status (granted, denied, all)
4. THE Filter_Panel SHALL provide search input for filtering by endpoint path
5. WHEN a filter is applied, THE Log_Table SHALL update to display only matching logs
6. THE Filter_Panel SHALL display active filter count when filters are applied

### Requirement 13: Role Change Logs Display

**User Story:** As an administrator, I want to view role change history, so that I can audit permission modifications.

#### Acceptance Criteria

1. THE Audit_Log_Viewer SHALL display a table with timestamp, user email, old role, new role, changed by admin, and reason
2. THE Audit_Log_Viewer SHALL fetch role change data from Admin_API endpoint /api/admin/logs/role-changes
3. THE Log_Table SHALL display role transitions with visual indicators (USER → BUSINESS → ADMIN)
4. THE Log_Table SHALL display the administrator who made the change
5. THE Log_Table SHALL display the reason provided for the role change
6. THE Log_Table SHALL sort logs by timestamp in descending order by default

### Requirement 14: Security Events Display

**User Story:** As an administrator, I want to view security events, so that I can monitor unauthorized access attempts.

#### Acceptance Criteria

1. THE Audit_Log_Viewer SHALL display a table with timestamp, user email, endpoint, and event type
2. THE Audit_Log_Viewer SHALL fetch security events from Admin_API endpoint /api/admin/logs/security
3. THE Log_Table SHALL highlight security events with warning color (yellow or orange)
4. THE Log_Table SHALL display event severity level (low, medium, high)
5. THE Audit_Log_Viewer SHALL display security summary statistics at the top
6. THE Audit_Log_Viewer SHALL fetch security summary from /api/admin/security/summary

### Requirement 15: Audit Log Export

**User Story:** As an administrator, I want to export audit logs, so that I can maintain compliance records.

#### Acceptance Criteria

1. THE Audit_Log_Viewer SHALL display an export button above the log table
2. WHEN an administrator clicks export button, THE Export_Function SHALL generate a CSV file with current filtered logs
3. THE Export_Function SHALL include all log fields in the CSV export
4. THE Export_Function SHALL name the file with format "audit-logs-YYYY-MM-DD.csv"
5. WHEN export is initiated, THE Audit_Log_Viewer SHALL display a progress indicator
6. WHEN export completes, THE Export_Function SHALL trigger browser download of the CSV file

### Requirement 16: Statistics Dashboard Display

**User Story:** As an administrator, I want to view system statistics, so that I can monitor platform health and usage.

#### Acceptance Criteria

1. THE Statistics_Dashboard SHALL display total user count by role (USER, BUSINESS, ADMIN)
2. THE Statistics_Dashboard SHALL fetch user statistics from /api/admin/stats/users
3. THE Statistics_Dashboard SHALL display KYC verification statistics (completed, pending, rejected)
4. THE Statistics_Dashboard SHALL display API usage statistics by business
5. THE Statistics_Dashboard SHALL fetch API statistics from /api/admin/stats/api-usage
6. THE Statistics_Dashboard SHALL display statistics in card layout with visual charts

### Requirement 17: System Health Monitoring

**User Story:** As an administrator, I want to view system health status, so that I can identify operational issues.

#### Acceptance Criteria

1. THE Statistics_Dashboard SHALL display system health status indicator
2. THE Statistics_Dashboard SHALL fetch health data from /api/admin/health
3. THE Statistics_Dashboard SHALL display database connection status
4. THE Statistics_Dashboard SHALL display API response time metrics
5. THE Statistics_Dashboard SHALL display error rate percentage
6. THE Statistics_Dashboard SHALL use color-coded indicators (green for healthy, yellow for warning, red for critical)

### Requirement 18: Recent Activity Timeline

**User Story:** As an administrator, I want to view recent system activity, so that I can monitor current operations.

#### Acceptance Criteria

1. THE Admin_Dashboard SHALL display a timeline of recent activity
2. THE Admin_Dashboard SHALL fetch recent logs from multiple log endpoints
3. THE Admin_Dashboard SHALL display last 20 events in chronological order
4. THE Admin_Dashboard SHALL show event type icons (user registration, role change, API key creation, access denied)
5. THE Admin_Dashboard SHALL display relative timestamps (e.g., "5 minutes ago")
6. THE Admin_Dashboard SHALL auto-refresh timeline every 30 seconds

### Requirement 19: Admin Panel Navigation

**User Story:** As an administrator, I want to navigate between admin panel sections, so that I can access different management functions.

#### Acceptance Criteria

1. THE Admin_Panel SHALL display a sidebar navigation menu
2. THE Admin_Panel SHALL provide navigation links for Dashboard, Users, API Keys, and Audit Logs
3. WHEN an administrator clicks a navigation link, THE Admin_Router SHALL navigate to the corresponding section
4. THE Admin_Panel SHALL highlight the active navigation item
5. THE Admin_Panel SHALL display the administrator's email and role in the sidebar header
6. THE Admin_Panel SHALL provide a logout button in the sidebar

### Requirement 20: Responsive Design

**User Story:** As an administrator, I want the admin panel to work on different screen sizes, so that I can manage the system from various devices.

#### Acceptance Criteria

1. THE Admin_Panel SHALL adapt layout for desktop screens (1024px and wider)
2. THE Admin_Panel SHALL adapt layout for tablet screens (768px to 1023px)
3. THE Admin_Panel SHALL adapt layout for mobile screens (below 768px)
4. WHEN screen width is below 768px, THE Admin_Panel SHALL collapse sidebar navigation to hamburger menu
5. THE User_Table SHALL display horizontal scroll on small screens when columns exceed viewport width
6. THE Admin_Panel SHALL maintain usability and readability across all screen sizes

### Requirement 21: Error Handling and User Feedback

**User Story:** As an administrator, I want clear error messages and feedback, so that I understand the results of my actions.

#### Acceptance Criteria

1. WHEN an API request fails, THE Admin_Panel SHALL display an error toast notification with descriptive message
2. WHEN an action succeeds, THE Admin_Panel SHALL display a success toast notification
3. WHEN data is loading, THE Admin_Panel SHALL display loading spinners or skeleton screens
4. WHEN no data is available, THE Admin_Panel SHALL display an empty state message
5. THE Admin_Panel SHALL display validation errors inline for form inputs
6. THE Admin_Panel SHALL automatically dismiss success notifications after 3 seconds

### Requirement 22: Confirmation Dialogs for Destructive Actions

**User Story:** As an administrator, I want to confirm destructive actions, so that I do not accidentally make irreversible changes.

#### Acceptance Criteria

1. WHEN an administrator attempts to revoke an API key, THE Confirmation_Dialog SHALL display before executing
2. WHEN an administrator attempts to deactivate a user, THE Confirmation_Dialog SHALL display before executing
3. WHEN an administrator attempts to change a user role to ADMIN, THE Confirmation_Dialog SHALL display with additional warning
4. THE Confirmation_Dialog SHALL display action description and consequences
5. THE Confirmation_Dialog SHALL provide Cancel and Confirm buttons
6. WHEN Cancel is clicked, THE Confirmation_Dialog SHALL close without executing the action

### Requirement 23: Audit Trail for Admin Actions

**User Story:** As a compliance officer, I want all admin actions to be logged, so that I can maintain an audit trail.

#### Acceptance Criteria

1. WHEN an administrator changes a user role, THE Admin_Panel SHALL include the admin user ID in the API request
2. WHEN an administrator revokes an API key, THE Admin_Panel SHALL include the admin user ID in the API request
3. WHEN an administrator deactivates a user, THE Admin_Panel SHALL include the admin user ID in the API request
4. THE Admin_Panel SHALL extract admin user ID from Authentication_Context
5. THE Admin_Panel SHALL display "Action performed by" information in log entries
6. THE Admin_Panel SHALL ensure all admin actions are traceable to specific administrator accounts

### Requirement 24: Performance Optimization

**User Story:** As an administrator, I want the admin panel to load quickly, so that I can work efficiently.

#### Acceptance Criteria

1. THE Admin_Panel SHALL implement pagination for tables with more than 50 records
2. THE Admin_Panel SHALL debounce search inputs by 300 milliseconds to reduce API calls
3. THE Admin_Panel SHALL cache statistics data for 60 seconds to reduce server load
4. THE Admin_Panel SHALL lazy load chart components to improve initial page load time
5. THE Admin_Panel SHALL implement virtual scrolling for tables with more than 100 records
6. THE Admin_Panel SHALL display loading states within 100 milliseconds of user action
