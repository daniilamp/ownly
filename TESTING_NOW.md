# 🚀 TESTING NOW: SPRINT 3 Complete Flow

**Status**: Ready to Test
**Time**: ~15 minutes
**Difficulty**: Easy

---

## What We're Testing

**Automatic Credential Generation**:
```
User completes KYC
    ↓
Credential created automatically
    ↓
Credential visible in UI
    ↓
Done! ✅
```

---

## Prerequisites (5 minutes)

### 1. Start Backend
```bash
cd ownly-backend/api
npm run dev
```

**Expected Output**:
```
Ownly API running on port 3001
```

### 2. Start Frontend
```bash
npm run dev
```

**Expected Output**:
```
Local: http://localhost:5173
```

### 3. Verify Supabase Connection
- Check `.env` file has Supabase credentials
- Should be already configured

---

## Testing (10 minutes)

### Step 1: Complete KYC (2 minutes)

1. Open http://localhost:5173/kyc
2. Fill form:
   - Email: `test@example.com`
   - Nombre: `Juan`
   - Apellido: `Pérez`
3. Click "Continuar"
4. Click "✓ Simular Verificación Exitosa"
5. See completion screen ✅

**Backend should log**:
```
Credential created: cred_... for user user_...
```

---

### Step 2: Check Database (3 minutes)

1. Go to https://app.supabase.com
2. Select your project
3. Go to SQL Editor
4. Run:
```sql
SELECT * FROM kyc_verifications ORDER BY created_at DESC LIMIT 1;
```

**Look for**:
- ✅ `credential_id` is NOT NULL
- ✅ `credential_status` = `pending`
- ✅ Your test data (Juan, Pérez, test@example.com)

---

### Step 3: Check Credential Record (2 minutes)

1. Copy `credential_id` from previous query
2. Run:
```sql
SELECT * FROM credentials WHERE id = 'YOUR_CREDENTIAL_ID';
```

**Look for**:
- ✅ `type` = `identity_verified`
- ✅ `status` = `pending`
- ✅ `credential_data` has minimal data only
- ✅ NO personal information stored

---

### Step 4: View in UI (2 minutes)

1. Click "Ver mis credenciales →" on completion screen
2. Or go to http://localhost:5173/credentials

**Look for**:
- ✅ Your credential appears in list
- ✅ Shows type and creation date

---

### Step 5: Check Backend Logs (1 minute)

Look at backend terminal for:
```
Credential created: cred_... for user user_...
```

---

## Success Criteria

✅ All of these should be true:

- [ ] KYC form submits successfully
- [ ] Completion screen appears
- [ ] Backend logs show credential created
- [ ] Database has KYC record with credential_id
- [ ] Database has credential record
- [ ] Credential has minimal data only
- [ ] Credential visible in UI
- [ ] No errors in console

---

## If Something Goes Wrong

### Credential not created?
1. Check backend logs for errors
2. Verify database connection
3. Check KYC record was created

### Credential not visible in UI?
1. Check browser console (F12)
2. Verify database has credential record
3. Check API endpoint: http://localhost:3001/api/kyc/user/user_...

### Backend not running?
```bash
cd ownly-backend/api
npm run dev
```

---

## Files to Reference

- **Testing Guide**: `SPRINT3_TESTING_FLOW.md`
- **Checklist**: `SPRINT3_TESTING_CHECKLIST.txt`
- **Implementation**: `SPRINT3_IMPLEMENTATION.md`

---

## What's Happening Behind the Scenes

### Frontend
1. User fills KYC form
2. Sends to `/api/kyc/init`
3. Backend creates applicant (or mock)
4. Frontend shows mock verification button
5. User clicks button
6. Frontend shows completion screen

### Backend
1. Receives KYC data
2. Creates KYC record in database
3. Creates credential with minimal data
4. Stores credential in database
5. Links credential to KYC
6. Returns success

### Database
1. KYC record created
2. Credential record created
3. Linked together
4. Ready for blockchain (optional)

---

## Next Steps After Testing

### If Everything Works ✅
1. Test with real Sumsub (when internet available)
2. Test blockchain publishing (if configured)
3. Move to SPRINT 4: Documents

### If Issues Found ❌
1. Document the issue
2. Check logs
3. Fix and retry

---

## Quick Reference

### Database Queries
```sql
-- Get latest KYC
SELECT * FROM kyc_verifications ORDER BY created_at DESC LIMIT 1;

-- Get latest credential
SELECT * FROM credentials ORDER BY created_at DESC LIMIT 1;

-- Get all credentials
SELECT * FROM credentials;

-- Get stats
SELECT COUNT(*) as total FROM credentials;
```

### API Endpoints
```bash
# Get KYC status
curl http://localhost:3001/api/kyc/user/user_123

# Get stats
curl http://localhost:3001/api/kyc/stats

# Get recent
curl http://localhost:3001/api/kyc/recent
```

---

## Timeline

- **Prerequisites**: 5 minutes
- **Testing**: 10 minutes
- **Total**: ~15 minutes

---

## Summary

**SPRINT 3 is ready to test!**

1. Start backend and frontend
2. Complete KYC flow
3. Check database
4. Verify in UI
5. Done! ✅

---

**Ready?** Start with Step 1 above! 🚀

---

**Questions?** Check `SPRINT3_TESTING_FLOW.md` for detailed instructions.
