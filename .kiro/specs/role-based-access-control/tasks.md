# Implementation Plan: Role-Based Access Control (RBAC) System

## Overview

This implementation plan breaks down the RBAC system into discrete coding tasks. The system will add role-based access control to Ownly using a middleware-based architecture that integrates with existing authentication without modifying core business logic. Implementation will use JavaScript/Node.js with Express middleware patterns.

## Tasks

- [x] 1. Create database schema and migration for RBAC tables
  - Create migration file for users table with role column
  - Create migration file for role_change_log table
  - Create migration file for access_control_log table
  - Add indexes for performance optimization
  - Link existing api_keys table to users table via user_id foreign key
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5_

- [ ]* 1.1 Write property test for role value validation
  - **Property 3: Role Value Validation**
  - **Validates: Requirements 1.5, 10.3**

- [x] 2. Implement user service for role management
  - [x] 2.1 Create userService.js with CRUD operations
    - Implement createUser function with role assignment
    - Implement getUserById, getUserByEmail, getUserBySupabaseId functions
    - Implement updateUser function
    - Use parameterized queries to prevent SQL injection
    - _Requirements: 1.3, 1.4, 10.1_
  
  - [x] 2.2 Add role management functions to userService
    - Implement getUserRole function
    - Implement changeUserRole function with audit logging
    - Implement listUsersByRole and searchUsers functions
    - _Requirements: 10.2, 10.4, 10.5_

- [ ]* 2.3 Write property test for default role assignment
  - **Property 1: Default Role Assignment**
  - **Validates: Requirements 1.3**

- [ ]* 2.4 Write property test for single role invariant
  - **Property 2: Single Role Invariant**
  - **Validates: Requirements 1.4**

- [ ]* 2.5 Write unit tests for userService
  - Test user creation with and without explicit role
  - Test role change with audit logging
  - Test query functions (by ID, email, Supabase ID)
  - _Requirements: 1.3, 10.1, 10.2_

- [x] 3. Implement RBAC middleware component
  - [x] 3.1 Create rbacMiddleware.js with core functions
    - Implement requireRole middleware factory function
    - Implement getUserRole function to fetch role from database
    - Implement enrichRequestWithRole function to add role to request object
    - Define role permission matrix as configuration object
    - _Requirements: 5.1, 5.2, 5.3, 5.5, 6.4_
  
  - [x] 3.2 Add permission checking utilities
    - Implement hasRole function
    - Implement hasAnyRole function
    - Implement hasPermission function
    - _Requirements: 2.1, 3.1, 4.1_
  
  - [x] 3.3 Add access logging functionality
    - Implement logAccessAttempt function to write to access_control_log
    - Log all authorization decisions (granted and denied)
    - Include user ID, role, endpoint, method, IP address, user agent
    - _Requirements: 5.6, 8.5, 12.1, 12.2_

- [ ]* 3.4 Write property test for admin universal access
  - **Property 4: Admin Universal Access**
  - **Validates: Requirements 4.1**

- [ ]* 3.5 Write property test for authorization failure response
  - **Property 5: Authorization Failure Response**
  - **Validates: Requirements 5.4, 8.3**

- [ ]* 3.6 Write property test for access denial logging
  - **Property 6: Access Denial Logging**
  - **Validates: Requirements 5.6, 8.5, 12.1, 12.2**

- [ ]* 3.7 Write property test for role escalation prevention
  - **Property 7: Role Escalation Prevention**
  - **Validates: Requirements 6.5**

- [ ]* 3.8 Write unit tests for RBAC middleware
  - Test requireRole allows matching roles
  - Test requireRole denies non-matching roles
  - Test permission checking functions
  - Test access logging with correct details
  - _Requirements: 5.1, 5.2, 5.3, 5.4_

- [x] 4. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 5. Integrate RBAC middleware with existing authentication
  - [x] 5.1 Modify authMiddleware.js to enrich requests with user role
    - Update verifyJWT to call enrichRequestWithRole after authentication
    - Update verifyApiKey to fetch and attach user role from linked user record
    - Ensure req.user object includes role property
    - _Requirements: 6.1, 6.4_
  
  - [x] 5.2 Update existing routes to apply RBAC middleware
    - Apply requireRole(['user', 'admin']) to KYC routes
    - Apply requireRole(['user', 'admin']) to document routes
    - Apply requireRole(['business', 'admin']) to identity verification routes
    - Apply requireRole(['business', 'admin']) to verifier routes
    - Apply requireRole(['admin']) to admin routes
    - _Requirements: 2.1, 2.6, 2.7, 3.1, 3.6, 3.7, 5.1, 5.2, 5.3_

- [ ]* 5.3 Write integration tests for authentication and authorization flow
  - Test USER role can access KYC endpoints
  - Test USER role cannot access identity verification endpoints
  - Test BUSINESS role with valid API key can access identity endpoints
  - Test BUSINESS role cannot access document endpoints
  - Test ADMIN can access all endpoints
  - Test cross-role access attempts are denied and logged
  - _Requirements: 2.1, 2.6, 3.1, 3.6, 8.1, 8.2, 8.3_

- [x] 6. Implement admin service for system management
  - [x] 6.1 Create adminService.js with user management functions
    - Implement listAllUsers with filtering
    - Implement updateUserRole with authorization check
    - Implement deactivateUser and reactivateUser functions
    - _Requirements: 4.2, 4.3, 10.2, 10.5_
  
  - [x] 6.2 Add API key management functions
    - Implement listAllApiKeys function
    - Implement revokeApiKey function with reason logging
    - _Requirements: 4.3, 11.6_
  
  - [x] 6.3 Add audit log query functions
    - Implement getAccessLogs with filtering
    - Implement getRoleChangeLogs with optional user filter
    - Implement getSecurityEvents with filtering
    - _Requirements: 4.4, 12.5, 12.6_
  
  - [x] 6.4 Add system statistics functions
    - Implement getUserStatistics function
    - Implement getApiUsageStatistics function
    - _Requirements: 4.4_

- [ ]* 6.5 Write property test for non-admin role management denial
  - **Property 8: Non-Admin Role Management Denial**
  - **Validates: Requirements 10.5**

- [ ]* 6.6 Write property test for role change audit logging
  - **Property 9: Role Change Audit Logging**
  - **Validates: Requirements 10.4, 12.4**

- [ ]* 6.7 Write unit tests for adminService
  - Test user management operations
  - Test API key management operations
  - Test audit log queries
  - Test authorization checks for admin-only operations
  - _Requirements: 4.2, 4.3, 4.4, 10.5_

- [x] 7. Create admin API routes
  - [x] 7.1 Create adminRoutes.js with user management endpoints
    - Implement GET /api/admin/users (list all users)
    - Implement PUT /api/admin/users/:id/role (change user role)
    - Implement PUT /api/admin/users/:id/status (activate/deactivate user)
    - Apply requireRole(['admin']) middleware to all routes
    - _Requirements: 4.2, 4.3, 5.3_
  
  - [x] 7.2 Add API key management endpoints
    - Implement GET /api/admin/api-keys (list all API keys)
    - Implement DELETE /api/admin/api-keys/:id (revoke API key)
    - _Requirements: 4.3_
  
  - [x] 7.3 Add audit log endpoints
    - Implement GET /api/admin/logs/access (access control logs)
    - Implement GET /api/admin/logs/role-changes (role change logs)
    - Implement GET /api/admin/logs/security (security events)
    - _Requirements: 4.4, 12.5_
  
  - [x] 7.4 Add system statistics endpoints
    - Implement GET /api/admin/stats/users (user statistics)
    - Implement GET /api/admin/stats/api-usage (API usage statistics)
    - _Requirements: 4.4_

- [ ]* 7.5 Write integration tests for admin API routes
  - Test admin can access all admin endpoints
  - Test non-admin users are denied access to admin endpoints
  - Test role change endpoint creates audit log
  - Test API key revocation works correctly
  - _Requirements: 4.1, 4.2, 4.3, 5.3_

- [x] 8. Checkpoint - Ensure all tests pass

- [x] 9. Implement API key security enhancements
  - [x] 9.1 Update API key generation to use secure hashing
  - [x] 9.2 Add API key regeneration functionality
  - [x] 9.3 Add API key failure logging

- [x] 10. Create data migration scripts
  - [x] 10.1 Create migration script to add users table
  - [x] 10.2 Create migration script to link API keys to users
  - [x] 10.3 Create script to create initial admin user

- [x] 11. Update error handling for RBAC
  - [x] 11.1 Add RBAC-specific error codes and messages
  - [x] 11.2 Update errorHandler middleware

- [x] 12. Add security monitoring and alerting
  - [x] 12.1 Implement suspicious activity detection
  - [x] 12.2 Add security alerting functionality

- [x] 13. Final checkpoint and integration verification
  - [x] 13.1 All files created and integrated
  - [x] 13.2 Backward compatibility maintained (middleware-only, no logic changes)
  - [x] 13.3 Role-based access control applied to all route groups
  - [x] 13.4 Audit logging wired into RBAC middleware

- [x] 14. Final checkpoint - Implementation complete

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties from the design
- Unit tests validate specific examples and edge cases
- Integration tests verify end-to-end flows
- The implementation uses JavaScript/Node.js with Express middleware patterns
- Database operations use parameterized queries to prevent SQL injection
- All RBAC decisions are logged for security auditing
- The system maintains backward compatibility with existing authentication flows
