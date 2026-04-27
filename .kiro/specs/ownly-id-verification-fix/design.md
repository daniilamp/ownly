# Ownly ID Verification Fix - Bugfix Design

## Overview

The identity verification API returns inconsistent results when querying by Ownly ID versus email. The root cause is that the `external_user_id` field in the `kyc_verifications` table stores the user ID passed during KYC initialization (from `/api/kyc/init`), but this value may not always be in the Ownly ID format (`ow_*`). When the identity API queries by Ownly ID using `getKYCByUserId()`, it searches `external_user_id` directly, which fails if the stored value doesn't match the Ownly ID format.

The fix requires ensuring that `external_user_id` consistently stores the Ownly ID format, or alternatively, adding a mapping mechanism to resolve Ownly IDs to the stored `external_user_id` values. The minimal approach is to verify what format is currently being stored and ensure the identity API can query correctly regardless of the stored format.

## Glossary

- **Bug_Condition (C)**: The condition that triggers the bug - when querying by Ownly ID format (`ow_*`) fails to find a verified user
- **Property (P)**: The desired behavior - identity queries by Ownly ID should return the same verification status as queries by email for the same user
- **Preservation**: Existing email-based queries must continue to work exactly as before
- **Ownly ID**: User identifier in format `ow_XXXXX` (e.g., `ow_MEAYG4B`)
- **external_user_id**: Database field in `kyc_verifications` table that stores the user identifier passed during KYC initialization
- **getKYCByUserId()**: Database service function in `databaseService.js` that queries `kyc_verifications` by `external_user_id`
- **getKYCByEmail()**: Database service function that queries `kyc_verifications` by `email` field

## Bug Details

### Bug Condition

The bug manifests when a B2B client queries the identity API using an Ownly ID format (`ow_*`), but the `external_user_id` field in the database contains a different format (possibly email or another identifier). The `getKYCByUserId()` function performs a direct equality match on `external_user_id`, which fails when the formats don't match.

**Formal Specification:**
```
FUNCTION isBugCondition(input)
  INPUT: input of type { identifier: string, queryType: 'ownlyId' | 'email' }
  OUTPUT: boolean
  
  RETURN input.queryType == 'ownlyId'
         AND input.identifier MATCHES /^ow_[A-Z0-9]+$/
         AND external_user_id_in_database != input.identifier
         AND user_exists_with_matching_email
END FUNCTION
```

### Examples

- **Example 1**: Query `/api/identity/ow_MEAYG4B` → Returns `verified: false` even though user with email `danilamp@dlminvesting.com` is verified (because `external_user_id` stores email, not Ownly ID)
- **Example 2**: Query `/api/identity/verify` with `ownly_id: "ow_MEAYG4B"` → Returns `can_trade: false` even though the user is approved (same root cause)
- **Example 3**: Query `/api/identity/:ownlyId/unique` with `ow_MEAYG4B` → Returns `is_unique: false` incorrectly (fails to find the user)
- **Edge Case**: Query with Ownly ID when `external_user_id` actually does store Ownly ID format → Should work correctly (this is the expected behavior we want for all cases)

## Expected Behavior

### Preservation Requirements

**Unchanged Behaviors:**
- Email-based queries via `/api/identity/:email` must continue to return correct verification status
- Email fallback in `/api/identity/:ownlyId` endpoint (when identifier contains '@') must continue to work
- POST `/api/identity/verify` with email format must continue to work
- GET `/api/identity/email/:email` endpoint must continue to work exactly as before
- All database queries using `getKYCByEmail()` must remain unchanged

**Scope:**
All inputs that do NOT involve Ownly ID format (`ow_*`) should be completely unaffected by this fix. This includes:
- Email-based queries (any identifier containing '@')
- Direct email endpoint queries
- Webhook processing and KYC status updates
- Credential creation and blockchain publishing flows

## Hypothesized Root Cause

Based on the bug description and code analysis, the most likely issues are:

1. **Inconsistent User ID Format During KYC Init**: The `/api/kyc/init` endpoint receives `userId` in the request body and stores it as `external_user_id`. If clients pass email instead of Ownly ID during initialization, the database stores email format, causing Ownly ID queries to fail.

2. **Missing Ownly ID to User ID Mapping**: There may be no mapping table or mechanism to resolve Ownly IDs to the actual `external_user_id` values stored in the database. The system assumes `external_user_id` always contains Ownly ID format.

3. **No Normalization in Identity API**: The identity API endpoints don't normalize or resolve the input identifier before querying. They pass the Ownly ID directly to `getKYCByUserId()`, which performs a literal string match.

4. **Database Schema Limitation**: The `kyc_verifications` table only has one field (`external_user_id`) to store user identifiers, with no separate field for Ownly ID. If the stored value is not in Ownly ID format, there's no way to query by Ownly ID.

## Correctness Properties

Property 1: Bug Condition - Ownly ID Queries Return Correct Verification Status

_For any_ input where an Ownly ID format identifier (`ow_*`) is provided and a corresponding verified user exists in the database, the identity API SHALL return the correct verification status (`verified: true`, `verification_level: 'full'`) matching the status returned by email-based queries for the same user.

**Validates: Requirements 2.1, 2.2, 2.3**

Property 2: Preservation - Email-Based Queries Unchanged

_For any_ input that is NOT in Ownly ID format (email addresses, other identifiers), the identity API SHALL produce exactly the same results as before the fix, preserving all existing email-based query functionality and fallback behavior.

**Validates: Requirements 3.1, 3.2, 3.3, 3.4, 3.5**

## Fix Implementation

### Changes Required

Assuming our root cause analysis is correct, we need to implement one of the following approaches:

**Approach A: Add Ownly ID Field to Database (Recommended)**

**File**: `ownly-backend/api/database/schema.sql` (or create migration)

**Changes**:
1. **Add ownly_id column**: Add a new `ownly_id VARCHAR(255)` column to `kyc_verifications` table
2. **Create index**: Add index on `ownly_id` for query performance
3. **Backfill data**: Update existing records to populate `ownly_id` from `external_user_id` where format matches

**File**: `ownly-backend/api/src/services/databaseService.js`

**Function**: `getKYCByUserId(externalUserId)`

**Specific Changes**:
1. **Detect Ownly ID format**: Check if `externalUserId` matches `/^ow_[A-Z0-9]+$/`
2. **Query ownly_id field**: If Ownly ID format, query using `.eq('ownly_id', externalUserId)`
3. **Fallback to external_user_id**: If not found or not Ownly ID format, query using `.eq('external_user_id', externalUserId)`

**File**: `ownly-backend/api/src/services/databaseService.js`

**Function**: `createKYCVerification(data)`

**Specific Changes**:
1. **Extract Ownly ID**: If `data.externalUserId` matches Ownly ID format, store it in both `external_user_id` and `ownly_id`
2. **Handle email format**: If `data.externalUserId` is email format, store in `external_user_id` only, leave `ownly_id` null

**Approach B: Normalize Query in Identity API (Alternative)**

**File**: `ownly-backend/api/src/routes/identity.js`

**Changes**:
1. **Add resolution logic**: Before calling `getKYCByUserId()`, check if identifier is Ownly ID format
2. **Query by email first**: If Ownly ID format, attempt to resolve to email by querying a mapping table or using a different strategy
3. **Fallback to direct query**: If resolution fails, try direct `external_user_id` query

This approach is less robust because it doesn't solve the underlying data inconsistency.

**Recommended Approach: A (Database Schema Change)**

This ensures data consistency and makes queries straightforward without complex resolution logic.

## Testing Strategy

### Validation Approach

The testing strategy follows a two-phase approach: first, surface counterexamples that demonstrate the bug on unfixed code, then verify the fix works correctly and preserves existing behavior.

### Exploratory Bug Condition Checking

**Goal**: Surface counterexamples that demonstrate the bug BEFORE implementing the fix. Confirm or refute the root cause analysis. If we refute, we will need to re-hypothesize.

**Test Plan**: Write tests that query the identity API with Ownly ID format for a known verified user, and assert that the response indicates verification. Run these tests on the UNFIXED code to observe failures and understand the root cause.

**Test Cases**:
1. **Ownly ID GET Query Test**: Query `/api/identity/ow_MEAYG4B` and expect `verified: true` (will fail on unfixed code, returns `verified: false`)
2. **Ownly ID POST Verify Test**: POST to `/api/identity/verify` with `ownly_id: "ow_MEAYG4B"` and expect `verified: true, can_trade: true` (will fail on unfixed code)
3. **Ownly ID Unique Check Test**: Query `/api/identity/ow_MEAYG4B/unique` and expect `is_unique: true, verified: true` (will fail on unfixed code)
4. **Database Query Test**: Directly call `getKYCByUserId('ow_MEAYG4B')` and expect non-null result (will fail on unfixed code, returns null)

**Expected Counterexamples**:
- Ownly ID queries return `verified: false` or `verification_level: 'none'` when user is actually verified
- Database query `getKYCByUserId()` returns null for Ownly ID input
- Possible causes: `external_user_id` field contains email instead of Ownly ID, no mapping exists, query logic doesn't handle format mismatch

### Fix Checking

**Goal**: Verify that for all inputs where the bug condition holds (Ownly ID format queries for verified users), the fixed function produces the expected behavior (correct verification status).

**Pseudocode:**
```
FOR ALL input WHERE isBugCondition(input) DO
  result := identityAPI_fixed(input.identifier)
  ASSERT result.verified == true
  ASSERT result.verification_level == 'full'
  
  // Compare with email query result for same user
  emailResult := identityAPI_fixed(user.email)
  ASSERT result.verified == emailResult.verified
  ASSERT result.verification_level == emailResult.verification_level
END FOR
```

### Preservation Checking

**Goal**: Verify that for all inputs where the bug condition does NOT hold (email-based queries, non-Ownly ID formats), the fixed function produces the same result as the original function.

**Pseudocode:**
```
FOR ALL input WHERE NOT isBugCondition(input) DO
  ASSERT identityAPI_original(input) == identityAPI_fixed(input)
END FOR
```

**Testing Approach**: Property-based testing is recommended for preservation checking because:
- It generates many test cases automatically across the input domain (various email formats, edge cases)
- It catches edge cases that manual unit tests might miss (special characters, long emails, etc.)
- It provides strong guarantees that behavior is unchanged for all non-buggy inputs

**Test Plan**: Observe behavior on UNFIXED code first for email-based queries, then write property-based tests capturing that behavior.

**Test Cases**:
1. **Email Query Preservation**: Verify that `/api/identity/danilamp@dlminvesting.com` returns the same result before and after fix
2. **Email POST Preservation**: Verify that POST `/api/identity/verify` with email format returns the same result
3. **Email Endpoint Preservation**: Verify that `/api/identity/email/:email` returns the same result
4. **Fallback Behavior Preservation**: Verify that email fallback in `/:ownlyId` endpoint (when identifier contains '@') continues to work

### Unit Tests

- Test `getKYCByUserId()` with Ownly ID format input returns correct record
- Test `getKYCByUserId()` with email format input continues to work (if applicable)
- Test identity API endpoints with Ownly ID format return correct verification status
- Test identity API endpoints with email format continue to return correct status
- Test edge cases: invalid Ownly ID format, non-existent Ownly ID, null/undefined inputs

### Property-Based Tests

- Generate random Ownly IDs and verify that queries return consistent results with email queries for the same user
- Generate random email addresses and verify that queries return the same results before and after fix
- Generate random verified/unverified user states and verify query results match expected verification status
- Test across many scenarios: pending verifications, rejected verifications, missing verifications

### Integration Tests

- Test full KYC flow: initialize with Ownly ID, verify, query by Ownly ID
- Test full KYC flow: initialize with email, verify, query by both email and Ownly ID
- Test B2B client workflow: create user, verify, query by Ownly ID from external system
- Test that credential creation and blockchain publishing are unaffected by the fix
