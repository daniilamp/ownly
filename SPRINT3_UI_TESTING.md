# 🧪 SPRINT 3: Testing in the UI

**Status**: ✅ Ready to Test

---

## Prerequisites

Make sure both servers are running:

### Terminal 1: Backend
```bash
cd ownly-backend/api
npm run dev
```
Should show: `Ownly API running on port 3001`

### Terminal 2: Frontend
```bash
npm run dev
```
Should show: `Local: http://localhost:5173`

---

## Test Flow

### Step 1: Open KYC Page
1. Open http://localhost:5173/kyc
2. You should see the KYC form

### Step 2: Fill the Form
Fill in the form with test data:
- **Email**: test@example.com (or any email)
- **Nombre**: Juan
- **Apellido**: Pérez

### Step 3: Click "Continuar"
1. Click the "Continuar" button
2. You should see a loading spinner
3. After a moment, you'll see "Paso 2: Verificar Identidad"

### Step 4: Simulate Verification
1. You should see a button: "✓ Simular Verificación Exitosa"
2. Click it
3. You should see: "¡Verificación Completada!"

### Step 5: View Credentials
1. Click "Ver mis credenciales →" button
2. Or navigate to http://localhost:5173/credentials
3. You should see your new credential in the list

---

## What to Verify

### In the UI:
- ✅ Form submits successfully
- ✅ Loading spinner appears
- ✅ Verification button appears
- ✅ Completion message shows
- ✅ Credential appears in list
- ✅ Credential shows type and date

### In the Database:
Open Supabase SQL Editor and run:

```sql
-- Check KYC record
SELECT * FROM kyc_verifications 
ORDER BY created_at DESC LIMIT 1;

-- Check credential
SELECT * FROM credentials 
ORDER BY created_at DESC LIMIT 1;

-- Check linking
SELECT 
  k.id as kyc_id,
  k.email,
  k.credential_id,
  c.type,
  c.status
FROM kyc_verifications k
LEFT JOIN credentials c ON k.credential_id = c.id
ORDER BY k.created_at DESC LIMIT 1;
```

Expected results:
- ✅ KYC record exists with your email
- ✅ Credential record exists
- ✅ `credential_id` is NOT NULL
- ✅ Credential type is `identity_verified`
- ✅ Credential status is `pending`

### In the Backend Logs:
Look for messages like:
```
Credential created: 4e3194ff-eb12-413c-bd8b-b8d31d4fc275 for user user_test_...
Credential created automatically in mock mode: 4e3194ff-eb12-413c-bd8b-b8d31d4fc275
```

---

## Privacy Check

The credential should contain ONLY:
```json
{
  "type": "identity_verified",
  "issuer": "ownly.eth",
  "issuanceDate": "2026-04-22T...",
  "expirationDate": "2027-04-22T..."
}
```

It should NOT contain:
- ❌ Your name
- ❌ Your email
- ❌ Your date of birth
- ❌ Any personal information

---

## Troubleshooting

### Issue: Form doesn't submit
- Check backend is running on port 3001
- Check browser console (F12) for errors
- Check backend logs for errors

### Issue: Verification button doesn't appear
- Check backend logs for errors
- Verify KYC record was created in database
- Try refreshing the page

### Issue: Credential doesn't appear in list
- Check database for credential record
- Check if credential_id is linked to KYC
- Try refreshing the page
- Check browser console for errors

### Issue: Backend shows errors
- Check `.env` file has correct Supabase credentials
- Check database migration was executed
- Check backend logs for specific errors

---

## Test Multiple Times

You can test multiple times:
1. Each test creates new records
2. Database will grow with test data
3. You can delete records manually if needed
4. Or just keep testing with different emails

---

## Next: SPRINT 4

After verifying SPRINT 3 works:
1. Implement document upload
2. Add encryption
3. Test document storage
4. Integrate with credentials page

---

**Ready to test?** Open http://localhost:5173/kyc and start! 🚀
