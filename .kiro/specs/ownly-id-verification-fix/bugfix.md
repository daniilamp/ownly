# Bugfix Requirements Document

## Introduction

The identity verification endpoint returns inconsistent results when querying the same user by different identifiers. Specifically, searching by Ownly ID (`ow_MEAYG4B`) returns `verified: false`, while searching by email (`danilamp@dlminvesting.com`) returns `verified: true` for the same user. This inconsistency breaks the B2B identity verification API and prevents prop firms, brokers, and exchanges from reliably verifying users by their Ownly ID.

The root cause is that the `external_user_id` field in the `kyc_verifications` table does not contain the Ownly ID format (`ow_*`), causing the database query in `getKYCByUserId()` to fail when searching by Ownly ID.

## Bug Analysis

### Current Behavior (Defect)

1.1 WHEN querying `/api/identity/ow_MEAYG4B` with a valid Ownly ID THEN the system returns `verified: false` and `verification_level: 'none'` even though the user is verified

1.2 WHEN querying `/api/identity/verify` with `ownly_id: "ow_MEAYG4B"` THEN the system returns `verified: false` and `can_trade: false` even though the user is verified

1.3 WHEN the database query `getKYCByUserId(externalUserId)` searches using `eq('external_user_id', externalUserId)` with an Ownly ID THEN the system returns null because `external_user_id` does not match the Ownly ID format

### Expected Behavior (Correct)

2.1 WHEN querying `/api/identity/ow_MEAYG4B` with a valid Ownly ID THEN the system SHALL return `verified: true` and `verification_level: 'full'` if the user is verified

2.2 WHEN querying `/api/identity/verify` with `ownly_id: "ow_MEAYG4B"` THEN the system SHALL return `verified: true` and `can_trade: true` if the user is verified

2.3 WHEN the database query `getKYCByUserId(externalUserId)` searches using the correct field or mapping THEN the system SHALL return the KYC verification record for the user with Ownly ID `ow_MEAYG4B`

### Unchanged Behavior (Regression Prevention)

3.1 WHEN querying `/api/identity/danilamp@dlminvesting.com` with an email address THEN the system SHALL CONTINUE TO return `verified: true` and `verification_level: 'full'` for verified users

3.2 WHEN querying `/api/identity/verify` with `ownly_id: "danilamp@dlminvesting.com"` (email format) THEN the system SHALL CONTINUE TO use the email fallback and return correct verification status

3.3 WHEN the database query `getKYCByEmail(email)` searches using `eq('email', email)` THEN the system SHALL CONTINUE TO return the correct KYC verification record

3.4 WHEN querying `/api/identity/:ownlyId/unique` with either Ownly ID or email THEN the system SHALL CONTINUE TO return correct uniqueness status

3.5 WHEN querying `/api/identity/email/:email` with an email address THEN the system SHALL CONTINUE TO return correct verification status
