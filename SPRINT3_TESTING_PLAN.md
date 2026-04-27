# 🧪 SPRINT 3: Testing Plan - Webhook & Automatic Credentials

**Status**: Ready for Testing
**Date**: April 22, 2026

---

## Testing Overview

We'll test the complete automatic credential generation flow:

```
KYC Completion → Webhook Received → Credential Created → Blockchain Published
```

---

## Prerequisites

### Environment Setup
```bash
# Backend .env needs:
POLYGON_RPC_URL=https://rpc-mumbai.maticvigil.com
PRIVATE_KEY=0x...  # Your wallet private key
CREDENTIAL_REGISTRY_ADDRESS=0x...  # Smart contract address
CREDENTIAL_ISSUER=ownly.eth
```

### Wallet Setup
- You need POL tokens on Mumbai testnet for gas fees
- Get from faucet: https://faucet.polygon.technology/

### Smart Contract
- CredentialRegistry.sol must be deployed
- Address stored in CREDENTIAL_REGISTRY_ADDRESS

---

## Test Scenarios

### Scenario 1: Mock Mode (No Internet)
**Goal**: Test credential creation without blockchain

#### Steps
1. Complete KYC flow (as before)
2. Check database for credential record
3. Verify credential status is "pending" (blockchain not available)

#### Expected Results
- ✅ Credential created in database
- ✅ Credential linked to KYC
- ✅ Status is "pending" (blockchain failed)
- ✅ Error logged but webhook returns 200

#### Database Query
```sql
SELECT * FROM credentials WHERE user_id = 'user_...' ORDER BY created_at DESC LIMIT 1;
```

---

### Scenario 2: Blockchain Publishing (With Internet)
**Goal**: Test complete flow with blockchain

#### Prerequisites
- Internet connection available
- POL tokens in wallet
- Smart contract deployed

#### Steps
1. Complete KYC flow
2. Wait for webhook processing
3. Check database for credential
4. Check blockchain for transaction

#### Expected Results
- ✅ Credential created in database
- ✅ Credential published to blockchain
- ✅ Transaction hash stored
- ✅ Status is "published"
- ✅ User sees credential in UI

#### Database Query
```sql
SELECT * FROM credentials WHERE user_id = 'user_...' ORDER BY created_at DESC LIMIT 1;
```

#### Blockchain Verification
1. Copy `blockchain_tx_hash` from database
2. Go to https://mumbai.polygonscan.com
3. Paste transaction hash
4. Verify transaction is successful

---

### Scenario 3: Error Handling
**Goal**: Test error scenarios

#### Test 3a: Invalid Webhook Signature
```bash
curl -X POST http://localhost:3001/api/kyc/webhook \
  -H "Content-Type: application/json" \
  -H "x-payload-digest: invalid_signature" \
  -d '{"type":"applicantReviewed","applicantId":"test"}'
```

**Expected**: 401 Unauthorized

#### Test 3b: Missing Required Fields
```bash
curl -X POST http://localhost:3001/api/kyc/webhook \
  -H "Content-Type: application/json" \
  -d '{"type":"applicantReviewed"}'
```

**Expected**: 400 Bad Request or 200 (ignored)

#### Test 3c: Blockchain Failure
- Simulate by using invalid contract address
- Credential should be marked as "failed"
- Webhook should still return 200

---

### Scenario 4: Credential Retrieval
**Goal**: Test getting credentials

#### Test 4a: Get User Credentials
```bash
curl http://localhost:3001/api/kyc/user/user_123
```

**Expected Response**:
```json
{
  "success": true,
  "verification": { ... },
  "credentials": [
    {
      "id": "cred_...",
      "type": "identity_verified",
      "status": "published",
      "blockchainTxHash": "0x...",
      "createdAt": "2026-04-22T..."
    }
  ]
}
```

#### Test 4b: Get Specific Credential
```bash
curl http://localhost:3001/api/credentials/cred_123
```

**Expected**: Credential data with minimal fields

---

### Scenario 5: Credential Verification
**Goal**: Test credential verification on blockchain

#### Steps
1. Get credential from database
2. Get blockchain transaction hash
3. Call verification endpoint
4. Verify credential is valid

#### Expected Results
- ✅ Credential verified on blockchain
- ✅ Verification returns true
- ✅ Credential data matches

---

## Manual Testing Checklist

### KYC Flow
- [ ] Navigate to /kyc
- [ ] Fill form with test data
- [ ] Click "Continuar"
- [ ] Click "✓ Simular Verificación Exitosa"
- [ ] See completion screen

### Credential Creation
- [ ] Check database for credential record
- [ ] Verify credential has minimal data only
- [ ] Verify no PII stored
- [ ] Verify credential linked to KYC

### Blockchain Publishing
- [ ] Check database for transaction hash
- [ ] Verify transaction on blockchain
- [ ] Verify transaction is successful
- [ ] Verify credential status is "published"

### UI Display
- [ ] Click "Ver mis credenciales →"
- [ ] See credential in list
- [ ] Verify credential details shown
- [ ] Verify no PII displayed

### Error Scenarios
- [ ] Test invalid webhook signature
- [ ] Test missing fields
- [ ] Test blockchain failure
- [ ] Verify errors logged
- [ ] Verify webhook returns 200

---

## Automated Testing (Optional)

### Unit Tests
```javascript
// Test credential creation
test('createCredential creates credential with minimal data', async () => {
  const credential = await credentialService.createCredential(
    'user_123',
    'kyc_456',
    { status: 'approved' }
  );
  
  expect(credential.id).toBeDefined();
  expect(credential.type).toBe('identity_verified');
  expect(credential.credentialData.issuer).toBeDefined();
  expect(credential.credentialData.firstName).toBeUndefined(); // No PII
});
```

### Integration Tests
```javascript
// Test complete webhook flow
test('webhook creates credential and publishes to blockchain', async () => {
  const webhook = {
    type: 'applicantReviewed',
    applicantId: 'test_123',
    reviewResult: { reviewAnswer: 'GREEN' }
  };
  
  const response = await request(app)
    .post('/api/kyc/webhook')
    .send(webhook);
  
  expect(response.status).toBe(200);
  
  // Verify credential created
  const credential = await db.getCredential(...);
  expect(credential).toBeDefined();
  expect(credential.status).toBe('published');
});
```

---

## Performance Testing

### Metrics to Track
- Webhook processing time: < 500ms
- Credential creation time: < 100ms
- Blockchain publishing time: 10-30 seconds
- Database query time: < 200ms

### Load Testing
- Test with multiple webhooks simultaneously
- Verify no race conditions
- Verify database consistency

---

## Security Testing

### Webhook Security
- [ ] Verify signature validation works
- [ ] Test with invalid signatures
- [ ] Test with tampered payload
- [ ] Verify rate limiting works

### Data Privacy
- [ ] Verify no PII stored in credentials
- [ ] Verify no PII in logs
- [ ] Verify no PII in blockchain
- [ ] Verify GDPR compliance

### Access Control
- [ ] Verify only authorized users can get credentials
- [ ] Verify users can't see other users' credentials
- [ ] Verify admin endpoints are protected

---

## Troubleshooting Guide

### Webhook Not Received
**Problem**: Webhook endpoint not called
**Solutions**:
1. Check Sumsub webhook URL configuration
2. Check backend logs for errors
3. Check firewall/network settings
4. Verify webhook signature verification is working

### Credential Not Created
**Problem**: Credential not in database
**Solutions**:
1. Check backend logs for errors
2. Verify Sumsub approval status
3. Check webhook payload
4. Verify database connection

### Blockchain Publishing Fails
**Problem**: Transaction hash not stored
**Solutions**:
1. Check wallet balance (need POL tokens)
2. Check gas prices
3. Check contract address
4. Check private key
5. Check blockchain connection

### Credential Not Visible in UI
**Problem**: Credential not showing in /credentials
**Solutions**:
1. Check database for credential records
2. Check blockchain for transaction
3. Check frontend for errors
4. Check API response

---

## Test Data

### User Data
```javascript
{
  userId: "user_test_" + Date.now(),
  email: "test@example.com",
  firstName: "Juan",
  lastName: "Pérez"
}
```

### Webhook Payload (Example)
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

---

## Expected Database Records

### After KYC Completion
```sql
-- kyc_verifications
{
  id: "kyc_123",
  applicant_id: "mock_user_...",
  external_user_id: "user_...",
  email: "test@example.com",
  first_name: "Juan",
  last_name: "Pérez",
  status: "completed",
  credential_id: "cred_123",
  credential_status: "pending"
}

-- credentials
{
  id: "cred_123",
  user_id: "user_...",
  kyc_id: "kyc_123",
  type: "identity_verified",
  status: "pending",
  credential_data: {
    type: "identity_verified",
    issuer: "ownly.eth",
    issuanceDate: "2026-04-22T...",
    expirationDate: "2027-04-22T..."
  },
  created_at: "2026-04-22T..."
}
```

### After Blockchain Publishing
```sql
-- credentials (updated)
{
  id: "cred_123",
  user_id: "user_...",
  kyc_id: "kyc_123",
  type: "identity_verified",
  status: "published",
  blockchain_tx_hash: "0x...",
  blockchain_address: "0x...",
  credential_data: { ... },
  created_at: "2026-04-22T...",
  updated_at: "2026-04-22T..."
}
```

---

## Success Criteria

✅ Webhook received and verified
✅ Credential created with minimal data
✅ Credential linked to KYC
✅ Credential published to blockchain
✅ Transaction hash stored
✅ Credential status updated to "published"
✅ User sees credential in UI
✅ No PII stored
✅ All errors handled gracefully
✅ Webhook returns 200 always

---

## Next Steps

1. **This Week**
   - [ ] Test webhook with mock Sumsub
   - [ ] Test credential creation
   - [ ] Test blockchain publishing
   - [ ] Verify credentials appear in UI

2. **Next Week**
   - [ ] Test with real Sumsub (when internet available)
   - [ ] Fix any blockchain issues
   - [ ] Implement credential verification page
   - [ ] Add credential revocation

3. **Following Week**
   - [ ] Implement ZK proofs (SPRINT 4)
   - [ ] Add proof verification
   - [ ] Implement credential verification page
   - [ ] Add batch credential operations

---

## Notes

- Mock mode will create credentials but not publish to blockchain
- Real Sumsub integration requires internet connection
- Blockchain publishing requires POL tokens
- All errors are logged but webhook returns 200 to prevent Sumsub retries
- Credentials use minimal data approach for privacy

---

**Ready to test?** Start with Scenario 1 (Mock Mode) first!
