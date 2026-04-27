# SPRINT 3: Webhook Integration & Automatic Credential Generation

**Status**: Planning
**Priority**: High
**Estimated Duration**: 1-2 weeks

---

## Overview

Implement automatic credential generation when Sumsub approves a user's identity. No manual issuer upload needed - everything happens automatically via webhooks.

---

## Architecture

```
User completes KYC
    ↓
Sumsub validates identity
    ↓
Sumsub sends webhook to /api/kyc/webhook
    ↓
Backend verifies webhook signature
    ↓
Backend checks if identity approved
    ↓
Backend creates credential (minimal data)
    ↓
Backend publishes to blockchain
    ↓
User sees credential in /credentials
```

---

## Data Strategy: Minimal Data Collection

### What We Store (Minimal)
```javascript
{
  applicantId: "sumsub_id",           // From Sumsub
  userId: "user_id",                  // Your internal ID
  status: "approved",                 // From Sumsub
  credentialId: "cred_id",            // Generated
  blockchainTxHash: "0x...",          // From blockchain
  createdAt: "2026-04-22T...",        // Timestamp
  expiresAt: "2027-04-22T..."         // 1 year expiry
}
```

### What We DON'T Store (Privacy First)
- ❌ Full name
- ❌ Email
- ❌ Date of birth
- ❌ Document numbers
- ❌ Address
- ❌ Phone number

### Why This Approach
- ✅ Minimal data = minimal risk
- ✅ GDPR compliant
- ✅ User privacy protected
- ✅ Only what's needed for verification

---

## Implementation Plan

### Phase 1: Webhook Verification (Day 1-2)
- [ ] Implement webhook signature verification
- [ ] Handle applicantReviewed events
- [ ] Log webhook events
- [ ] Test webhook delivery

### Phase 2: Credential Generation (Day 3-4)
- [ ] Create credential service
- [ ] Generate credential data
- [ ] Create credential record in database
- [ ] Test credential creation

### Phase 3: Blockchain Publishing (Day 5-6)
- [ ] Implement blockchain service
- [ ] Publish credential to smart contract
- [ ] Store transaction hash
- [ ] Handle blockchain errors

### Phase 4: Testing & Integration (Day 7)
- [ ] End-to-end testing
- [ ] Error scenario testing
- [ ] Performance testing
- [ ] Documentation

---

## Database Changes

### New Table: credentials
```sql
CREATE TABLE credentials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id VARCHAR(255) NOT NULL,
  kyc_id UUID REFERENCES kyc_verifications(id),
  credential_type VARCHAR(50) NOT NULL, -- 'identity_verified'
  status VARCHAR(50) NOT NULL, -- 'pending', 'published', 'revoked'
  blockchain_tx_hash VARCHAR(255),
  blockchain_address VARCHAR(255),
  credential_data JSONB, -- Minimal data only
  expires_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### Update: kyc_verifications
```sql
ALTER TABLE kyc_verifications ADD COLUMN credential_id UUID;
ALTER TABLE kyc_verifications ADD COLUMN credential_status VARCHAR(50);
```

---

## API Endpoints

### POST /api/kyc/webhook (Already exists, needs update)
```javascript
// Receives webhook from Sumsub
// Verifies signature
// Creates credential if approved
// Publishes to blockchain
```

### GET /api/credentials/:userId
```javascript
// Returns user's credentials
// Only returns minimal data
// Includes blockchain verification
```

### POST /api/credentials/verify
```javascript
// Verifies a credential on blockchain
// Returns verification result
// Used by verifier page
```

---

## Services to Create

### 1. credentialService.js
```javascript
// Create credential
async function createCredential(userId, kycId, data)

// Get user credentials
async function getUserCredentials(userId)

// Get credential by ID
async function getCredential(credentialId)

// Revoke credential
async function revokeCredential(credentialId)
```

### 2. blockchainService.js
```javascript
// Publish credential to blockchain
async function publishCredential(credential)

// Verify credential on blockchain
async function verifyCredential(credentialId)

// Get credential from blockchain
async function getBlockchainCredential(txHash)
```

### 3. webhookService.js
```javascript
// Verify webhook signature
function verifyWebhookSignature(payload, signature)

// Parse webhook data
function parseWebhookData(payload)

// Handle applicantReviewed event
async function handleApplicantReviewed(webhook)
```

---

## Webhook Flow

### 1. Sumsub Sends Webhook
```json
{
  "type": "applicantReviewed",
  "applicantId": "5a4d...",
  "inspectionId": "5a4d...",
  "correlationId": "5a4d...",
  "reviewResult": {
    "reviewAnswer": "GREEN",
    "reviewRejectType": null,
    "rejectLabels": []
  },
  "reviewStatus": "completed"
}
```

### 2. Backend Verifies Signature
```javascript
const signature = req.headers['x-payload-digest'];
const isValid = verifyWebhookSignature(rawBody, signature);
if (!isValid) return 401;
```

### 3. Backend Creates Credential
```javascript
if (webhook.reviewResult.reviewAnswer === 'GREEN') {
  const credential = await createCredential(
    userId,
    kycId,
    { status: 'approved' }
  );
}
```

### 4. Backend Publishes to Blockchain
```javascript
const txHash = await publishCredential(credential);
await updateCredentialStatus(credential.id, 'published', txHash);
```

---

## Credential Data Structure

### Minimal Credential
```javascript
{
  id: "cred_123",
  type: "identity_verified",
  issuer: "ownly.eth",
  subject: "user_456",
  issuanceDate: "2026-04-22",
  expirationDate: "2027-04-22",
  proof: {
    type: "Groth16",
    proofValue: "0x...",
    verificationMethod": "ownly-verifier"
  }
}
```

### What's NOT Included
- ❌ Name
- ❌ Email
- ❌ Date of birth
- ❌ Document details
- ❌ Address
- ❌ Phone

---

## Smart Contract Integration

### CredentialRegistry.sol
```solidity
function issueCredential(
  address subject,
  string memory credentialType,
  bytes memory proof
) public onlyIssuer returns (uint256)

function verifyCredential(
  uint256 credentialId,
  bytes memory proof
) public view returns (bool)

function revokeCredential(uint256 credentialId) public onlyIssuer
```

---

## Testing Strategy

### Unit Tests
- [ ] Webhook signature verification
- [ ] Credential creation
- [ ] Blockchain publishing
- [ ] Error handling

### Integration Tests
- [ ] Complete webhook flow
- [ ] Credential retrieval
- [ ] Blockchain verification
- [ ] Error scenarios

### End-to-End Tests
- [ ] User completes KYC
- [ ] Webhook received
- [ ] Credential created
- [ ] Credential visible in UI
- [ ] Credential verifiable

---

## Error Handling

### Webhook Errors
- Invalid signature → 401
- Invalid payload → 400
- Processing error → 500 (retry)

### Credential Errors
- User not found → 404
- KYC not approved → 400
- Blockchain error → Retry with exponential backoff

### Recovery
- Webhook retry mechanism
- Failed credential queue
- Manual retry endpoint

---

## Security Considerations

### Webhook Security
- ✅ Verify signature (HMAC-SHA256)
- ✅ Validate payload structure
- ✅ Rate limiting
- ✅ Idempotency (prevent duplicates)

### Credential Security
- ✅ Only minimal data stored
- ✅ Encrypted at rest
- ✅ Blockchain immutability
- ✅ Access control

### Privacy
- ✅ No PII stored
- ✅ GDPR compliant
- ✅ User data minimization
- ✅ Right to be forgotten

---

## Deployment Checklist

- [ ] Database migrations
- [ ] Environment variables
- [ ] Webhook URL configured in Sumsub
- [ ] Smart contract deployed
- [ ] Blockchain RPC configured
- [ ] Error monitoring setup
- [ ] Webhook logging setup
- [ ] Backup and recovery plan

---

## Success Criteria

✅ Webhook received and verified
✅ Credential created automatically
✅ Credential published to blockchain
✅ User sees credential in UI
✅ Credential is verifiable
✅ No manual issuer upload needed
✅ Minimal data stored
✅ All errors handled gracefully

---

## Timeline

- **Day 1-2**: Webhook verification
- **Day 3-4**: Credential generation
- **Day 5-6**: Blockchain publishing
- **Day 7**: Testing & integration

**Total**: 1 week for core implementation

---

## Next Steps

1. Create credentialService.js
2. Create blockchainService.js
3. Update kyc.js webhook handler
4. Create database migrations
5. Test webhook flow
6. Deploy to staging
7. Test end-to-end

---

## Notes

- No manual issuer upload needed
- Everything automatic via webhooks
- Minimal data for privacy
- Blockchain for immutability
- User sees credential immediately after approval
