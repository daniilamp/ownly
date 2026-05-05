# Design Document: Admin Panel

## Overview

The Admin Panel is a comprehensive administrative interface for the Ownly platform that provides administrators with centralized control over users, API keys, audit logs, and system monitoring. The panel is built as a React-based single-page application that integrates with existing backend admin endpoints at `/api/admin/*`.

### Key Design Principles

1. **Security First**: All admin routes enforce ADMIN role verification at both frontend and backend levels
2. **Responsive Design**: Mobile-first approach with adaptive layouts for desktop, tablet, and mobile
3. **Performance Optimization**: Pagination, debouncing, caching, and lazy loading to ensure fast load times
4. **User Experience**: Clear feedback, confirmation dialogs for destructive actions, and intuitive navigation
5. **Audit Trail**: All administrative actions are logged with admin user ID and reason for compliance

### Technology Stack

- **Frontend Framework**: React 18 with React Router v6
- **State Management**: React Context API (AuthContext) + local component state
- **HTTP Client**: Fetch API with JWT authentication
- **UI Components**: Custom components with Tailwind CSS styling (matching existing design system)
- **Icons**: Lucide React
- **Data Visualization**: Recharts for statistics charts
- **Date Handling**: date-fns for date formatting and manipulation

## Architecture

### High-Level Architecture

```mermaid
graph TB
    subgraph "Frontend - Admin Panel"
        Router[Admin Router]
        Layout[Admin Layout]
        Dashboard[Dashboard Page]
        Users[User Management Page]
        APIKeys[API Key Management Page]
        Logs[Audit Logs Page]
        
        Router --> Layout
        Layout --> Dashboard
        Layout --> Users
        Layout --> APIKeys
        Layout --> Logs
    end
    
    subgraph "Shared Components"
        Table[Data Table]
        Filter[Filter Panel]
        Modal[Confirmation Dialog]
        Toast[Toast Notifications]
    end
    
    subgraph "Context & Hooks"
        Auth[AuthContext]
        AdminAPI[useAdminAPI Hook]
    end
    
    subgraph "Backend API"
        AdminEndpoints[/api/admin/*]
        RBAC[RBAC Middleware]
    end
    
    Dashboard --> Table
    Users --> Table
    Users --> Filter
    Users --> Modal
    APIKeys --> Table
    APIKeys --> Filter
    Logs --> Table
    Logs --> Filter
    
    Dashboard --> AdminAPI
    Users --> AdminAPI
    APIKeys --> AdminAPI
    Logs --> AdminAPI
    
    AdminAPI --> Auth
    AdminAPI --> AdminEndpoints
    AdminEndpoints --> RBAC
```

### Component Hierarchy

```
App
└── AdminRouter (Protected Route)
    └── AdminLayout
        ├── AdminSidebar
        │   ├── Navigation Links
        │   ├── User Info
        │   └── Logout Button
        └── AdminContent
            ├── AdminDashboard
            │   ├── StatisticsCards
            │   ├── SystemHealthIndicator
            │   └── RecentActivityTimeline
            ├── UserManagement
            │   ├── FilterPanel
            │   ├── UserTable
            │   │   ├── UserRow
            │   │   ├── RoleSelector
            │   │   └── StatusToggle
            │   └── UserDetailModal
            ├── APIKeyManagement
            │   ├── FilterPanel
            │   ├── APIKeyTable
            │   │   └── APIKeyRow
            │   └── UsageStatisticsModal
            └── AuditLogs
                ├── LogTypeSelector
                ├── FilterPanel
                ├── LogTable
                │   └── LogRow
                └── ExportButton
```

### Routing Structure

```javascript
/admin                          -> AdminDashboard (requires ADMIN role)
/admin/users                    -> UserManagement
/admin/users/:userId            -> UserDetailView
/admin/api-keys                 -> APIKeyManagement
/admin/logs                     -> AuditLogs
/admin/logs/access              -> AccessControlLogs
/admin/logs/role-changes        -> RoleChangeLogs
/admin/logs/security            -> SecurityEvents
```

## Components and Interfaces

### Core Components

#### 1. AdminRouter (Route Protection)

**Purpose**: Enforce ADMIN role access control for all admin routes

**Props**: None (uses AuthContext)

**Responsibilities**:
- Verify user authentication status
- Check user role is ADMIN
- Redirect unauthorized users to home page
- Redirect unauthenticated users to login page

**Implementation**:
```javascript
function AdminRouter() {
  const { isAuthenticated, userRole, loading } = useAuth();
  
  if (loading) return <LoadingSpinner />;
  if (!isAuthenticated) return <Navigate to="/login" />;
  if (userRole !== 'admin') return <Navigate to="/" />;
  
  return <AdminLayout />;
}
```

#### 2. AdminLayout

**Purpose**: Provide consistent layout structure for all admin pages

**Props**: None

**State**:
- `sidebarOpen: boolean` - Mobile sidebar visibility

**Responsibilities**:
- Render sidebar navigation
- Render main content area
- Handle responsive sidebar toggle
- Display admin user information

**Responsive Behavior**:
- Desktop (≥1024px): Persistent sidebar
- Tablet/Mobile (<1024px): Collapsible hamburger menu

#### 3. AdminSidebar

**Purpose**: Navigation menu for admin sections

**Props**:
- `isOpen: boolean` - Sidebar visibility state
- `onClose: () => void` - Close callback for mobile

**Navigation Items**:
- Dashboard (`/admin`)
- Users (`/admin/users`)
- API Keys (`/admin/api-keys`)
- Audit Logs (`/admin/logs`)

**Features**:
- Active route highlighting
- User email and role display
- Logout button

#### 4. AdminDashboard

**Purpose**: Main dashboard displaying system overview

**State**:
- `userStats: UserStatistics | null`
- `apiStats: APIUsageStatistics | null`
- `systemHealth: SystemHealth | null`
- `recentActivity: ActivityEvent[]`
- `loading: boolean`
- `error: string | null`

**Data Sources**:
- `GET /api/admin/stats/users`
- `GET /api/admin/stats/api-usage`
- `GET /api/admin/health`
- `GET /api/admin/logs/access?limit=20`

**Refresh Strategy**:
- Initial load on mount
- Auto-refresh every 60 seconds for stats
- Auto-refresh every 30 seconds for recent activity

#### 5. UserManagement

**Purpose**: Interface for viewing and managing user accounts

**State**:
- `users: User[]`
- `filters: UserFilters`
- `pagination: PaginationState`
- `loading: boolean`
- `selectedUser: User | null`
- `actionModal: ActionModalState | null`

**Features**:
- User table with sorting
- Search by email or user ID (debounced 300ms)
- Filter by role (USER, BUSINESS, ADMIN)
- Filter by status (active, inactive, suspended)
- Pagination (50 records per page)
- Role change with confirmation
- Status toggle with confirmation
- User detail view

#### 6. UserTable

**Purpose**: Display user data in tabular format

**Props**:
- `users: User[]`
- `onRoleChange: (userId, newRole, reason) => void`
- `onStatusChange: (userId, newStatus, reason) => void`
- `onUserClick: (userId) => void`
- `loading: boolean`

**Columns**:
- User ID
- Email
- Role (with dropdown selector)
- Status (with toggle button)
- Registration Date
- Actions (View Details)

**Sorting**:
- Default: Registration date descending
- Sortable columns: Email, Role, Status, Registration Date

#### 7. APIKeyManagement

**Purpose**: Interface for viewing and managing API keys

**State**:
- `apiKeys: APIKey[]`
- `filters: APIKeyFilters`
- `pagination: PaginationState`
- `loading: boolean`
- `selectedKey: APIKey | null`
- `usageModalOpen: boolean`

**Features**:
- API key table with masked values
- Filter by status (active, revoked)
- Search by business user email (debounced 300ms)
- Pagination (50 records per page)
- Revoke key with confirmation and reason
- View usage statistics modal

#### 8. APIKeyTable

**Purpose**: Display API key data in tabular format

**Props**:
- `apiKeys: APIKey[]`
- `onRevoke: (apiKeyId, reason) => void`
- `onViewUsage: (apiKeyId) => void`
- `loading: boolean`

**Columns**:
- API Key ID
- Business User Email
- Masked Key (shows last 4 characters)
- Status (active/revoked indicator)
- Creation Date
- Actions (Revoke, View Usage)

**Key Masking**:
- Format: `****-****-****-XXXX` (show last 4 characters)

#### 9. AuditLogs

**Purpose**: Interface for viewing audit logs and security events

**State**:
- `logType: 'access' | 'role-changes' | 'security'`
- `logs: LogEntry[]`
- `filters: LogFilters`
- `pagination: PaginationState`
- `loading: boolean`
- `autoRefresh: boolean`

**Features**:
- Log type selector (tabs)
- Date range picker
- Filter by user email
- Filter by endpoint (for access logs)
- Filter by access granted status
- Pagination (100 records per page)
- Auto-refresh every 30 seconds (toggleable)
- Export to CSV

#### 10. LogTable

**Purpose**: Display log entries in tabular format

**Props**:
- `logs: LogEntry[]`
- `logType: 'access' | 'role-changes' | 'security'`
- `loading: boolean`

**Columns (Access Logs)**:
- Timestamp
- User Email
- Endpoint
- Access Granted (color-coded: green/red)
- Role

**Columns (Role Change Logs)**:
- Timestamp
- User Email
- Old Role → New Role (with visual indicator)
- Changed By (admin email)
- Reason

**Columns (Security Events)**:
- Timestamp
- User Email
- Endpoint
- Event Type
- Severity Level (color-coded)

#### 11. FilterPanel

**Purpose**: Reusable filter component for tables

**Props**:
- `filters: FilterConfig[]`
- `activeFilters: Record<string, any>`
- `onChange: (filterKey, value) => void`
- `onReset: () => void`

**Filter Types**:
- Text input (with debounce)
- Dropdown select
- Date range picker
- Multi-select

**Features**:
- Active filter count badge
- Reset all filters button
- Responsive layout

#### 12. ConfirmationDialog

**Purpose**: Modal for confirming destructive actions

**Props**:
- `isOpen: boolean`
- `title: string`
- `message: string`
- `requireReason: boolean`
- `minReasonLength: number`
- `onConfirm: (reason?: string) => void`
- `onCancel: () => void`
- `confirmLabel: string`
- `danger: boolean`

**Features**:
- Optional reason text input
- Validation for minimum reason length
- Danger styling for destructive actions
- Keyboard shortcuts (Enter to confirm, Escape to cancel)

#### 13. ToastNotification

**Purpose**: Display success/error feedback messages

**Props**:
- `type: 'success' | 'error' | 'info' | 'warning'`
- `message: string`
- `duration: number` (default: 3000ms)
- `onClose: () => void`

**Features**:
- Auto-dismiss after duration
- Manual close button
- Slide-in animation
- Color-coded by type

### Custom Hooks

#### useAdminAPI

**Purpose**: Centralized hook for admin API calls with authentication

**Returns**:
```typescript
{
  // User Management
  listUsers: (filters: UserFilters) => Promise<UserListResponse>
  getUserById: (userId: string) => Promise<User>
  updateUserRole: (userId: string, role: string, reason: string) => Promise<User>
  updateUserStatus: (userId: string, status: string, reason?: string) => Promise<User>
  
  // API Key Management
  listAPIKeys: (filters: APIKeyFilters) => Promise<APIKeyListResponse>
  revokeAPIKey: (apiKeyId: string, reason: string) => Promise<APIKey>
  
  // Audit Logs
  getAccessLogs: (filters: LogFilters) => Promise<LogEntry[]>
  getRoleChangeLogs: (filters: LogFilters) => Promise<LogEntry[]>
  getSecurityEvents: (filters: LogFilters) => Promise<LogEntry[]>
  
  // Statistics
  getUserStats: () => Promise<UserStatistics>
  getAPIUsageStats: () => Promise<APIUsageStatistics>
  getSystemHealth: () => Promise<SystemHealth>
  getSecuritySummary: (hours: number) => Promise<SecuritySummary>
  
  // State
  loading: boolean
  error: string | null
}
```

**Features**:
- Automatic JWT token injection from localStorage
- Error handling with user-friendly messages
- Loading state management
- Request cancellation on unmount

#### useDebounce

**Purpose**: Debounce search input to reduce API calls

**Signature**:
```typescript
function useDebounce<T>(value: T, delay: number): T
```

**Usage**:
```javascript
const [searchTerm, setSearchTerm] = useState('');
const debouncedSearch = useDebounce(searchTerm, 300);

useEffect(() => {
  // Fetch data with debouncedSearch
}, [debouncedSearch]);
```

#### usePagination

**Purpose**: Manage pagination state and logic

**Returns**:
```typescript
{
  currentPage: number
  pageSize: number
  totalItems: number
  totalPages: number
  goToPage: (page: number) => void
  nextPage: () => void
  prevPage: () => void
  setPageSize: (size: number) => void
}
```

#### useAutoRefresh

**Purpose**: Auto-refresh data at specified intervals

**Signature**:
```typescript
function useAutoRefresh(
  callback: () => void,
  interval: number,
  enabled: boolean
): void
```

## Data Models

### User

```typescript
interface User {
  id: string;
  email: string;
  role: 'user' | 'business' | 'admin';
  status: 'active' | 'inactive' | 'suspended';
  createdAt: string; // ISO 8601 timestamp
  kycStatus?: 'pending' | 'completed' | 'rejected';
  kycCompletedAt?: string;
}
```

### APIKey

```typescript
interface APIKey {
  id: string;
  userId: string; // Business user ID
  userEmail: string; // Business user email
  keyHash: string; // Hashed API key
  lastFourChars: string; // Last 4 characters for display
  status: 'active' | 'revoked';
  createdAt: string;
  revokedAt?: string;
  revokedBy?: string; // Admin user ID
  revokeReason?: string;
  permissions: string[]; // Array of permission strings
}
```

### LogEntry (Access Control)

```typescript
interface AccessLogEntry {
  id: string;
  timestamp: string;
  userId: string;
  userEmail: string;
  endpoint: string;
  method: string;
  accessGranted: boolean;
  userRole: string;
  requiredRole?: string;
}
```

### LogEntry (Role Change)

```typescript
interface RoleChangeLogEntry {
  id: string;
  timestamp: string;
  userId: string;
  userEmail: string;
  oldRole: string;
  newRole: string;
  changedBy: string; // Admin user ID
  changedByEmail: string;
  reason: string;
}
```

### LogEntry (Security Event)

```typescript
interface SecurityEventLogEntry {
  id: string;
  timestamp: string;
  userId?: string;
  userEmail?: string;
  endpoint: string;
  eventType: 'unauthorized_access' | 'invalid_token' | 'rate_limit_exceeded' | 'suspicious_activity';
  severity: 'low' | 'medium' | 'high';
  details: string;
}
```

### UserStatistics

```typescript
interface UserStatistics {
  totalUsers: number;
  usersByRole: {
    user: number;
    business: number;
    admin: number;
  };
  usersByStatus: {
    active: number;
    inactive: number;
    suspended: number;
  };
  kycStatistics: {
    completed: number;
    pending: number;
    rejected: number;
  };
  newUsersLast30Days: number;
}
```

### APIUsageStatistics

```typescript
interface APIUsageStatistics {
  totalRequests: number;
  requestsByBusiness: Array<{
    userId: string;
    userEmail: string;
    requestCount: number;
  }>;
  requestsByEndpoint: Array<{
    endpoint: string;
    count: number;
  }>;
  timelineData: Array<{
    date: string;
    count: number;
  }>;
}
```

### SystemHealth

```typescript
interface SystemHealth {
  status: 'healthy' | 'warning' | 'critical';
  database: {
    connected: boolean;
    responseTime: number; // milliseconds
  };
  api: {
    responseTime: number; // milliseconds
    errorRate: number; // percentage
  };
  lastChecked: string;
}
```

### SecuritySummary

```typescript
interface SecuritySummary {
  totalEvents: number;
  eventsBySeverity: {
    low: number;
    medium: number;
    high: number;
  };
  topEndpoints: Array<{
    endpoint: string;
    count: number;
  }>;
  recentEvents: SecurityEventLogEntry[];
}
```

### Filter Types

```typescript
interface UserFilters {
  role?: 'user' | 'business' | 'admin';
  status?: 'active' | 'inactive' | 'suspended';
  search?: string; // Email or user ID
  limit?: number;
  offset?: number;
}

interface APIKeyFilters {
  status?: 'active' | 'revoked';
  userId?: string;
  search?: string; // Business user email
  limit?: number;
  offset?: number;
}

interface LogFilters {
  userId?: string;
  userEmail?: string;
  endpoint?: string;
  accessGranted?: boolean;
  startDate?: string;
  endDate?: string;
  limit?: number;
  offset?: number;
}
```

## Error Handling

### Error Handling Strategy

1. **API Error Responses**: All API errors return structured error objects
2. **User-Friendly Messages**: Technical errors are translated to user-friendly messages
3. **Toast Notifications**: Errors are displayed as toast notifications
4. **Inline Validation**: Form validation errors are displayed inline
5. **Fallback UI**: Empty states and error states for failed data loads

### Error Types

```typescript
interface APIError {
  error: string; // Error message
  details?: any; // Additional error details
  statusCode: number;
}
```

### Error Handling in Components

```javascript
try {
  const result = await adminAPI.updateUserRole(userId, newRole, reason);
  showToast('success', 'User role updated successfully');
} catch (error) {
  const message = error.message || 'Failed to update user role';
  showToast('error', message);
  console.error('Role update error:', error);
}
```

### Common Error Messages

- **401 Unauthorized**: "Your session has expired. Please log in again."
- **403 Forbidden**: "You do not have permission to perform this action."
- **404 Not Found**: "The requested resource was not found."
- **500 Server Error**: "An unexpected error occurred. Please try again later."
- **Network Error**: "Unable to connect to the server. Please check your internet connection."

## Testing Strategy

### Testing Approach

The admin panel requires comprehensive testing across multiple layers:

1. **Unit Tests**: Test individual components and utility functions
2. **Integration Tests**: Test component interactions and API integration
3. **End-to-End Tests**: Test complete user workflows
4. **Manual Testing**: Test responsive design and accessibility

### Unit Testing

**Framework**: Vitest + React Testing Library

**Components to Test**:
- FilterPanel: Filter state management and onChange callbacks
- ConfirmationDialog: Validation logic and callback execution
- UserTable: Sorting, rendering, and action callbacks
- APIKeyTable: Key masking and action callbacks
- LogTable: Log type-specific rendering
- ToastNotification: Auto-dismiss and manual close

**Hooks to Test**:
- useDebounce: Debounce timing and value updates
- usePagination: Page navigation and boundary conditions
- useAutoRefresh: Interval execution and cleanup

**Example Unit Test**:
```javascript
describe('FilterPanel', () => {
  it('should call onChange with debounced value for text input', async () => {
    const onChange = vi.fn();
    render(<FilterPanel filters={[...]} onChange={onChange} />);
    
    const input = screen.getByPlaceholderText('Search...');
    fireEvent.change(input, { target: { value: 'test' } });
    
    // Should not call immediately
    expect(onChange).not.toHaveBeenCalled();
    
    // Should call after debounce delay
    await waitFor(() => {
      expect(onChange).toHaveBeenCalledWith('search', 'test');
    }, { timeout: 400 });
  });
  
  it('should display active filter count', () => {
    const activeFilters = { role: 'admin', status: 'active' };
    render(<FilterPanel activeFilters={activeFilters} />);
    
    expect(screen.getByText('2 active filters')).toBeInTheDocument();
  });
});
```

### Integration Testing

**Focus Areas**:
- Admin route protection and redirects
- API integration with useAdminAPI hook
- Toast notification display on API success/error
- Confirmation dialog flow for destructive actions
- Pagination with API calls

**Example Integration Test**:
```javascript
describe('UserManagement Integration', () => {
  it('should update user role with confirmation', async () => {
    const mockUpdateRole = vi.fn().mockResolvedValue({ success: true });
    vi.mock('@/hooks/useAdminAPI', () => ({
      useAdminAPI: () => ({ updateUserRole: mockUpdateRole })
    }));
    
    render(<UserManagement />);
    
    // Click role dropdown
    const roleButton = screen.getByText('USER');
    fireEvent.click(roleButton);
    
    // Select new role
    const adminOption = screen.getByText('ADMIN');
    fireEvent.click(adminOption);
    
    // Confirmation dialog should appear
    expect(screen.getByText('Change User Role')).toBeInTheDocument();
    
    // Enter reason
    const reasonInput = screen.getByPlaceholderText('Reason for role change');
    fireEvent.change(reasonInput, { target: { value: 'Promoted to admin' } });
    
    // Confirm
    const confirmButton = screen.getByText('Confirm');
    fireEvent.click(confirmButton);
    
    // API should be called
    await waitFor(() => {
      expect(mockUpdateRole).toHaveBeenCalledWith(
        expect.any(String),
        'admin',
        'Promoted to admin'
      );
    });
    
    // Success toast should appear
    expect(screen.getByText('User role updated successfully')).toBeInTheDocument();
  });
});
```

### End-to-End Testing

**Framework**: Playwright or Cypress

**Test Scenarios**:

1. **Admin Access Control**
   - Non-admin user cannot access /admin routes
   - Unauthenticated user is redirected to login
   - Admin user can access all admin routes

2. **User Management Workflow**
   - Search for user by email
   - Filter users by role and status
   - Change user role with reason
   - Deactivate user with reason
   - View user details

3. **API Key Management Workflow**
   - View all API keys
   - Filter by status
   - Revoke API key with reason
   - View usage statistics

4. **Audit Log Workflow**
   - Switch between log types
   - Filter logs by date range
   - Export logs to CSV
   - Auto-refresh logs

5. **Dashboard Workflow**
   - View statistics cards
   - Check system health status
   - View recent activity timeline

**Example E2E Test**:
```javascript
test('Admin can revoke API key', async ({ page }) => {
  // Login as admin
  await page.goto('/login');
  await page.fill('input[type="email"]', 'admin@ownly.com');
  await page.fill('input[type="password"]', 'admin123');
  await page.click('button[type="submit"]');
  
  // Navigate to API Keys
  await page.goto('/admin/api-keys');
  await page.waitForSelector('table');
  
  // Click revoke button on first active key
  await page.click('button:has-text("Revoke"):first');
  
  // Confirmation dialog appears
  await expect(page.locator('text=Revoke API Key')).toBeVisible();
  
  // Enter reason
  await page.fill('textarea[placeholder*="reason"]', 'Security concern');
  
  // Confirm revocation
  await page.click('button:has-text("Confirm")');
  
  // Success message appears
  await expect(page.locator('text=API key revoked successfully')).toBeVisible();
  
  // Key status updates to revoked
  await expect(page.locator('text=revoked').first()).toBeVisible();
});
```

### Manual Testing Checklist

**Responsive Design**:
- [ ] Desktop layout (≥1024px) displays persistent sidebar
- [ ] Tablet layout (768-1023px) displays collapsible sidebar
- [ ] Mobile layout (<768px) displays hamburger menu
- [ ] Tables scroll horizontally on small screens
- [ ] Modals are centered and responsive
- [ ] Touch targets are at least 44x44px on mobile

**Accessibility**:
- [ ] All interactive elements are keyboard accessible
- [ ] Focus indicators are visible
- [ ] Color contrast meets WCAG AA standards
- [ ] Screen reader announces page changes
- [ ] Form inputs have associated labels
- [ ] Error messages are announced

**Performance**:
- [ ] Initial page load < 2 seconds
- [ ] Table pagination loads < 500ms
- [ ] Search debounce reduces API calls
- [ ] Statistics cache reduces server load
- [ ] No memory leaks on auto-refresh

**Browser Compatibility**:
- [ ] Chrome (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Edge (latest)

### Test Coverage Goals

- **Unit Tests**: 80% code coverage
- **Integration Tests**: All critical user flows
- **E2E Tests**: All major workflows
- **Manual Tests**: Responsive design and accessibility

## Implementation Notes

### Phase 1: Core Infrastructure (Week 1)

1. Create admin routing structure
2. Implement AdminRouter with role protection
3. Create AdminLayout and AdminSidebar
4. Implement useAdminAPI hook
5. Create shared components (FilterPanel, ConfirmationDialog, ToastNotification)

### Phase 2: User Management (Week 2)

1. Implement UserManagement page
2. Create UserTable component
3. Implement user search and filtering
4. Add role change functionality
5. Add status toggle functionality
6. Create UserDetailView

### Phase 3: API Key Management (Week 2)

1. Implement APIKeyManagement page
2. Create APIKeyTable component
3. Implement API key filtering
4. Add revoke functionality
5. Create UsageStatisticsModal

### Phase 4: Audit Logs (Week 3)

1. Implement AuditLogs page
2. Create LogTable component
3. Implement log type switching
4. Add log filtering
5. Implement CSV export
6. Add auto-refresh functionality

### Phase 5: Dashboard & Statistics (Week 3)

1. Implement AdminDashboard page
2. Create StatisticsCards component
3. Implement SystemHealthIndicator
4. Create RecentActivityTimeline
5. Add data visualization charts

### Phase 6: Polish & Testing (Week 4)

1. Responsive design refinement
2. Accessibility improvements
3. Performance optimization
4. Unit test implementation
5. Integration test implementation
6. E2E test implementation
7. Documentation

### Security Considerations

1. **JWT Token Management**:
   - Store JWT in localStorage (existing pattern)
   - Include token in Authorization header for all admin API calls
   - Handle token expiration with redirect to login

2. **Role Verification**:
   - Frontend: Check userRole in AuthContext
   - Backend: Enforce ADMIN role with requireAdmin middleware
   - Never trust frontend-only checks

3. **Sensitive Data**:
   - Mask API keys (show only last 4 characters)
   - Do not log sensitive information
   - Sanitize user inputs before API calls

4. **Audit Trail**:
   - Include admin user ID in all mutation requests
   - Require reason for destructive actions
   - Log all admin actions on backend

### Performance Optimizations

1. **Pagination**: Limit table rows to 50-100 per page
2. **Debouncing**: 300ms delay for search inputs
3. **Caching**: Cache statistics for 60 seconds
4. **Lazy Loading**: Code-split admin routes
5. **Virtual Scrolling**: For tables with >100 rows
6. **Memoization**: Use React.memo for expensive components

### Accessibility Requirements

1. **Keyboard Navigation**: All interactive elements accessible via keyboard
2. **Focus Management**: Visible focus indicators, trap focus in modals
3. **Screen Readers**: Semantic HTML, ARIA labels where needed
4. **Color Contrast**: WCAG AA compliance (4.5:1 for text)
5. **Error Announcements**: Use ARIA live regions for dynamic content

### Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

### Dependencies to Add

```json
{
  "dependencies": {
    "recharts": "^2.10.0",
    "date-fns": "^2.30.0"
  },
  "devDependencies": {
    "@testing-library/react": "^14.0.0",
    "@testing-library/user-event": "^14.5.0",
    "vitest": "^1.0.0",
    "@vitest/ui": "^1.0.0"
  }
}
```

## Conclusion

This design document provides a comprehensive blueprint for implementing the Admin Panel feature. The architecture emphasizes security, performance, and user experience while maintaining consistency with the existing Ownly platform design system. The modular component structure allows for incremental development and testing, with clear separation of concerns between presentation, business logic, and data access layers.
