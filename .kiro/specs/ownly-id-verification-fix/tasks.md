# Implementation Plan

- [x] 1. Write bug condition exploration test
  - **Property 1: Bug Condition** - Ownly ID Queries Return Incorrect Verification Status
  - **CRITICAL**: This test MUST FAIL on unfixed code - failure confirms the bug exists
  - **DO NOT attempt to fix the test or the code when it fails**
  - **NOTE**: This test encodes the expected behavior - it will validate the fix when it passes after implementation
  - **GOAL**: Surface counterexamples that demonstrate the bug exists
  - **Scoped PBT Approach**: Scope the property to the concrete failing case: Ownly ID `ow_MEAYG4B` with verified user
  - Test that querying `/api/identity/ow_MEAYG4B` returns `verified: true` and `verification_level: 'full'` (from Bug Condition in design)
  - Test that POST `/api/identity/verify` with `ownly_id: "ow_MEAYG4B"` returns `verified: true` and `can_trade: true`
  - Test that `getKYCByUserId('ow_MEAYG4B')` returns non-null KYC record
  - Run tests on UNFIXED code
  - **EXPECTED OUTCOME**: Tests FAIL (this is correct - it proves the bug exists)
  - Document counterexamples found:
    - What does `/api/identity/ow_MEAYG4B` actually return? (expected: `verified: false`)
    - What does `getKYCByUserId('ow_MEAYG4B')` return? (expected: null)
    - What is stored in `external_user_id` field? (expected: email format, not Ownly ID)
  - Mark task complete when test is written, run, and failure is documented
  - _Requirements: 1.1, 1.2, 1.3_

- [x] 2. Write preservation property tests (BEFORE implementing fix)
  - **Property 2: Preservation** - Email-Based Queries Unchanged
  - **IMPORTANT**: Follow observation-first methodology
  - Observe behavior on UNFIXED code for email-based queries:
    - Query `/api/identity/danilamp@dlminvesting.com` and record actual response
    - Query POST `/api/identity/verify` with email format and record response
    - Query `/api/identity/email/:email` and record response
    - Test email fallback in `/:ownlyId` endpoint (when identifier contains '@')
  - Write property-based tests capturing observed behavior patterns from Preservation Requirements:
    - For all email format identifiers, verify response matches baseline behavior
    - For all email-based POST requests, verify response matches baseline
    - For all direct email endpoint queries, verify response matches baseline
    - For all fallback scenarios (identifier with '@'), verify behavior unchanged
  - Property-based testing generates many test cases for stronger guarantees (various email formats, edge cases)
  - Run tests on UNFIXED code
  - **EXPECTED OUTCOME**: Tests PASS (this confirms baseline behavior to preserve)
  - Mark task complete when tests are written, run, and passing on unfixed code
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_

- [-] 3. Fix for Ownly ID verification inconsistency (Approach A: Add ownly_id field to database)

  - [x] 3.1 Add ownly_id column to kyc_verifications table
    - Create database migration or modify schema.sql
    - Add `ownly_id VARCHAR(255)` column to `kyc_verifications` table
    - Create index on `ownly_id` for query performance: `CREATE INDEX idx_kyc_ownly_id ON kyc_verifications(ownly_id)`
    - Add column as nullable to support existing records
    - _Bug_Condition: isBugCondition(input) where input.queryType == 'ownlyId' AND input.identifier matches /^ow_[A-Z0-9]+$/ AND external_user_id_in_database != input.identifier_
    - _Expected_Behavior: For all Ownly ID queries, return correct verification status matching email queries for same user_
    - _Preservation: Email-based queries must continue to work exactly as before_
    - _Requirements: 2.1, 2.2, 2.3_

  - [x] 3.2 Backfill existing records with ownly_id data
    - Write and run migration script to populate `ownly_id` column
    - For records where `external_user_id` matches Ownly ID format (`/^ow_[A-Z0-9]+$/`), copy value to `ownly_id`
    - For records where `external_user_id` is email format, leave `ownly_id` as null (will be populated on next update)
    - Verify backfill completed successfully by checking record counts
    - _Requirements: 2.3_

  - [x] 3.3 Update getKYCByUserId() to query ownly_id field
    - File: `ownly-backend/api/src/services/databaseService.js`
    - Function: `getKYCByUserId(externalUserId)`
    - Add Ownly ID format detection: `const isOwnlyId = /^ow_[A-Z0-9]+$/.test(externalUserId)`
    - If Ownly ID format detected, query using: `.eq('ownly_id', externalUserId)`
    - If not found or not Ownly ID format, fallback to: `.eq('external_user_id', externalUserId)`
    - Return first matching record or null
    - _Bug_Condition: isBugCondition(input) where getKYCByUserId() fails to find record when querying by Ownly ID_
    - _Expected_Behavior: getKYCByUserId() returns correct KYC record for Ownly ID queries_
    - _Preservation: Existing external_user_id queries must continue to work_
    - _Requirements: 2.3, 3.3_

  - [x] 3.4 Update createKYCVerification() to populate ownly_id field
    - File: `ownly-backend/api/src/services/databaseService.js`
    - Function: `createKYCVerification(data)`
    - Extract Ownly ID from `data.externalUserId` if it matches format `/^ow_[A-Z0-9]+$/`
    - If Ownly ID format, store in both `external_user_id` and `ownly_id` fields
    - If email format, store in `external_user_id` only, leave `ownly_id` null
    - Ensure new records are created with correct `ownly_id` value
    - _Requirements: 2.3_

  - [x] 3.5 Update updateKYCVerification() to maintain ownly_id field
    - File: `ownly-backend/api/src/services/databaseService.js`
    - Function: `updateKYCVerification()` or similar update functions
    - When updating KYC records, preserve `ownly_id` field
    - If `external_user_id` is updated and matches Ownly ID format, update `ownly_id` as well
    - Ensure consistency between `external_user_id` and `ownly_id` fields
    - _Requirements: 2.3_

  - [-] 3.6 Verify bug condition exploration test now passes
    - **Property 1: Expected Behavior** - Ownly ID Queries Return Correct Verification Status
    - **IMPORTANT**: Re-run the SAME test from task 1 - do NOT write a new test
    - The test from task 1 encodes the expected behavior
    - When this test passes, it confirms the expected behavior is satisfied
    - Run bug condition exploration test from step 1
    - Verify `/api/identity/ow_MEAYG4B` now returns `verified: true` and `verification_level: 'full'`
    - Verify POST `/api/identity/verify` with Ownly ID now returns `verified: true` and `can_trade: true`
    - Verify `getKYCByUserId('ow_MEAYG4B')` now returns correct KYC record
    - **EXPECTED OUTCOME**: Test PASSES (confirms bug is fixed)
    - _Requirements: 2.1, 2.2, 2.3_

  - [ ] 3.7 Verify preservation tests still pass
    - **Property 2: Preservation** - Email-Based Queries Unchanged
    - **IMPORTANT**: Re-run the SAME tests from task 2 - do NOT write new tests
    - Run preservation property tests from step 2
    - Verify all email-based queries return the same results as before fix
    - Verify email fallback behavior continues to work
    - Verify direct email endpoint queries unchanged
    - **EXPECTED OUTCOME**: Tests PASS (confirms no regressions)
    - Confirm all tests still pass after fix (no regressions)
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_

- [ ] 4. Checkpoint - Ensure all tests pass
  - Run complete test suite including exploration and preservation tests
  - Verify all tests pass: bug condition test (now passing), preservation tests (still passing)
  - Verify no regressions in existing functionality
  - Test edge cases: invalid Ownly ID format, non-existent Ownly ID, null/undefined inputs
  - If any issues arise, document and ask user for guidance
  - Mark complete when all tests pass and fix is validated
