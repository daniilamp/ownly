# 🧪 SPRINT 3: Complete Testing Flow

**Status**: Ready to Test
**Date**: April 22, 2026
**Goal**: Test automatic credential generation via webhook

---

## Prerequisites

### 1. Backend Running
```bash
cd ownly-backend/api
npm run dev
# Should be running on http://localhost:3001
```

### 2. Frontend Running
```bash
npm run dev
# Should be running on http://localhost:5173
```

### 3. Database Connected
- Supabase should be connected
- Tables should exist: `kyc_verifications`, `credentials`

### 4. Environment Variables
Check `ownly-backend/api/.env`:
```
SUPABASE_URL=https://jmbqtvmmldxgstabgpwh.supabase.co
SUPABASE_KEY=sb_publishable_...
SUPABASE_SECRET=sb_secret_...
```

---

## Test Flow: Step by Step

### Step 1: Complete KYC Verification

**Action**:
1. Open http://localhost:5173/kyc
2. Fill form:
   - Email: `test@example.com`
   - Nombre: `Juan`
   - Apellido: `Pérez`
3. Click "Continuar"
4. Click "✓ Simular Verificación Exitosa"
5. See completion screen

**Expected Result**:
- ✅ Form submits successfully
- ✅ Mock verification button appears
- ✅ Completion screen shows
- ✅ Backend logs show KYC created

**Backend Logs** (look for):
```
Credential created: cred_... for user user_...
```

---

### Step 2: Check Database - KYC Record

**Action**:
1. Go to https://app.supabase.com
2. Select your project
3. Go to SQL Editor
4. Run query:
```sql
SELECT * FROM kyc_verifications 
ORDER BY created_at DESC LIMIT 1;
```

**Expected Result**:
- ✅ Record exists with your test data
- ✅ `status` = `completed` (mock mode)
- ✅ `credential_id` is NOT NULL (credential created!)
- ✅ `credential_status` = `pending`

**Example Result**:
```
id: 123e4567-e89b-12d3-a456-426614174000
applicant_id: mock_user_...
external_user_id: user_...
email: test@example.com
first_name: Juan
last_name: Pérez
status: completed
credential_id: 456f7890-a12b-34cd-e567-890123456789
credential_status: pending
created_at: 2026-04-22T...
```

---

### Step 3: Check Database - Credential Record

**Action**:
1. Copy the `credential_id` from previous query
2. Run query:
```sql
SELECT * FROM credentials 
WHERE id = 'YOUR_CREDENTIAL_ID';
```

**Expected Result**:
- ✅ Credential record exists
- ✅ `user_id` matches your user ID
- ✅ `type` = `identity_verified`
- ✅ `status` = `pending` (blockchain not available in mock mode)
- ✅ `credential_data` contains minimal data only

**Example Result**:
```
id: 456f7890-a12b-34cd-e567-890123456789
user_id: user_...
kyc_id: 123e4567-e89b-12d3-a456-426614174000
type: identity_verified
status: pending
credential_data: {
  "type": "identity_verified",
  "issuer": "ownly.eth",
  "issuanceDate": "2026-04-22T...",
  "expirationDate": "2027-04-22T..."
}
created_at: 2026-04-22T...
```

---

### Step 4: Verify Minimal Data (Privacy Check)

**Action**:
Check that credential_data does NOT contain:
- ❌ Full name
- ❌ Email
- ❌ Date of birth
- ❌ Document numbers

**Expected Result**:
- ✅ Only contains: type, issuer, issuanceDate, expirationDate
- ✅ No personal information stored
- ✅ GDPR compliant

---

### Step 5: Check Backend Logs

**Action**:
Look at backend terminal for logs:

**Expected Logs**:
```
Credential created: cred_... for user user_...
Document data saved, credential generation pending
```

Or if blockchain is configured:
```
Credential created: cred_... for user user_...
Publishing credential to blockchain...
Transaction sent: 0x...
Transaction confirmed in block 12345
Credential published to blockchain: 0x...
```

---

### Step 6: View Credentials in UI

**Action**:
1. Click "Ver mis credenciales →" on completion screen
2. Or navigate to http://localhost:5173/credentials

**Expected Result**:
- ✅ Credentials page loads
- ✅ Your new credential appears in list
- ✅ Shows credential type: "identity_verified"
- ✅ Shows creation date

---

### Step 7: Test Multiple Documents (Optional)

**Action**:
1. Complete KYC again with different email
2. Repeat steps 1-6

**Expected Result**:
- ✅ Multiple credentials created
- ✅ Each has unique ID
- ✅ All appear in credentials list

---

## Troubleshooting

### Issue: Credential not created

**Check**:
1. Backend logs for errors
2. Database connection
3. KYC record created successfully

**Solution**:
```bash
# Check backend logs
# Look for "Credential created" message
# If not there, check for errors
```

### Issue: Credential status is "failed"

**Check**:
1. Backend logs for blockchain errors
2. Wallet balance (if blockchain enabled)
3. Contract address configuration

**Solution**:
- In mock mode, status should be "pending"
- If blockchain enabled, check gas prices and wallet balance

### Issue: Credentials not visible in UI

**Check**:
1. Database has credential records
2. Frontend API call working
3. Browser console for errors

**Solution**:
```bash
# Check browser console (F12)
# Look for API errors
# Verify /api/kyc/user/:userId endpoint works
```

### Issue: Backend not running

**Check**:
```bash
cd ownly-backend/api
npm run dev
# Should show: "Ownly API running on port 3001"
```

---

## Database Queries Reference

### Get all KYC verifications
```sql
SELECT * FROM kyc_verifications ORDER BY created_at DESC;
```

### Get all credentials
```sql
SELECT * FROM credentials ORDER BY created_at DESC;
```

### Get credentials for specific user
```sql
SELECT c.* FROM credentials c
JOIN kyc_verifications k ON c.kyc_id = k.id
WHERE k.external_user_id = 'user_...'
ORDER BY c.created_at DESC;
```

### Get credential statistics
```sql
SELECT 
  COUNT(*) as total,
  COUNT(CASE WHEN status = 'published' THEN 1 END) as published,
  COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending,
  COUNT(CASE WHEN status = 'failed' THEN 1 END) as failed
FROM credentials;
```

---

## API Endpoints to Test

### 1. Get KYC Status
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
      "status": "pending"
    }
  ]
}
```

### 2. Get Credential Stats
```bash
curl http://localhost:3001/api/kyc/stats
```

**Expected Response**:
```json
{
  "success": true,
  "stats": {
    "total": 1,
    "approved": 1,
    "rejected": 0,
    "pending": 0
  }
}
```

### 3. Get Recent Verifications
```bash
curl http://localhost:3001/api/kyc/recent?limit=5
```

---

## Success Criteria

✅ KYC verification completes
✅ Credential created automatically
✅ Credential linked to KYC
✅ Minimal data stored (no PII)
✅ Credential visible in UI
✅ Database records correct
✅ Backend logs show success
✅ No errors in console

---

## Timeline

**Total Testing Time**: ~15 minutes

- Step 1-2: 5 minutes (KYC + database check)
- Step 3-4: 3 minutes (credential verification)
- Step 5-6: 3 minutes (logs + UI)
- Step 7: 4 minutes (optional multiple tests)

---

## Next Steps After Testing

### If Everything Works ✅
1. Test with real Sumsub (when internet available)
2. Test blockchain publishing (if configured)
3. Move to SPRINT 4: Documents

### If Issues Found ❌
1. Check logs for errors
2. Verify database connection
3. Check environment variables
4. Review code for issues

---

## Notes

- Mock mode creates credentials but doesn't publish to blockchain
- Credentials have minimal data (no personal information)
- Each test creates new records (database grows)
- Can delete records manually if needed
- Backend logs are very helpful for debugging

---

**Ready to test?** Start with Step 1!
