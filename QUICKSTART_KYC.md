# 🚀 Quick Start: KYC Testing

**Time to test**: 5 minutes
**Requirements**: Frontend + Backend running
**Internet**: Not required (mock mode)

---

## Step 1: Start the Application

### Terminal 1 - Frontend
```bash
npm run dev
# Opens on http://localhost:5173
```

### Terminal 2 - Backend
```bash
cd ownly-backend/api
npm run dev
# Runs on http://localhost:3001
```

---

## Step 2: Open KYC Page

Go to: **http://localhost:5173/kyc**

You should see:
- OWNLY header with KYC badge
- "Verificación de Identidad" title
- Progress indicator (1, 2, ✓)
- Personal data form

---

## Step 3: Fill the Form

Enter test data:
- **Email**: `test@example.com`
- **Nombre**: `Juan`
- **Apellido**: `Pérez`

---

## Step 4: Click "Continuar"

You'll see:
- Loading spinner briefly
- Form disappears
- "Paso 2: Verificar Identidad" appears
- **"📋 Modo Demo - Sumsub SDK"** section with button

---

## Step 5: Click "✓ Simular Verificación Exitosa"

The button will:
- Simulate successful verification
- Show success message
- Move to step 3

---

## Step 6: See Completion Screen

You'll see:
- Green checkmark ✓
- "¡Verificación Completada!" message
- Your email and name
- "Ver mis credenciales →" button

---

## Step 7: View Credentials (Optional)

Click **"Ver mis credenciales →"** to:
- Go to credentials page
- See your new credential in the list

---

## What's Happening

```
You fill form
    ↓
Click "Continuar"
    ↓
Backend: POST /api/kyc/init
    ↓
Backend tries Sumsub (fails - no internet)
    ↓
Backend creates mock applicant
    ↓
Backend returns mock token (starts with "mock_")
    ↓
Frontend detects mock mode
    ↓
Frontend shows mock UI with button
    ↓
You click button
    ↓
Frontend calls onSuccess callback
    ↓
Page moves to completion screen
    ↓
Done! ✅
```

---

## Troubleshooting

### Issue: Page shows error "Failed to load Sumsub SDK"
**Expected!** This is normal without internet.
- ✅ Mock button should appear below the error
- ✅ Click the button to continue

### Issue: Form doesn't submit
- Check all fields are filled
- Check email format (must have @)
- Check browser console (F12) for errors

### Issue: Mock button doesn't appear
- Verify backend is running on port 3001
- Check browser console for errors
- Try refreshing the page

### Issue: Nothing happens when clicking mock button
- Check browser console (F12) for JavaScript errors
- Try clicking again
- Refresh page and try again

---

## Check Database (Optional)

To verify the record was created:

1. Go to: https://app.supabase.com
2. Select your project
3. Go to **SQL Editor**
4. Run:
```sql
SELECT * FROM kyc_verifications ORDER BY created_at DESC LIMIT 1;
```

You should see your test record with:
- Email: `test@example.com`
- First name: `Juan`
- Last name: `Pérez`
- Status: `pending`

---

## Next Steps

After testing:
1. Try with different data
2. Test error scenarios (invalid email, empty fields)
3. Try the retry button on error screen
4. Check credentials page

---

## Files to Know

- **Frontend**: `src/pages/KYC.jsx`
- **Backend**: `ownly-backend/api/src/routes/kyc.js`
- **Database**: `kyc_verifications` table in Supabase
- **Testing Guide**: `SPRINT2_KYC_TESTING.md`
- **Full Status**: `SPRINT2_COMPLETE.md`

---

## That's It! 🎉

You now have a working KYC verification flow with mock mode.

For more details, see `SPRINT2_KYC_TESTING.md`
