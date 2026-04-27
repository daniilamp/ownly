# SPRINT 2: KYC Frontend Testing Guide

## Overview
This guide walks you through testing the complete KYC verification flow with mock mode enabled for local development.

## Prerequisites
- Frontend running on `http://localhost:5173`
- Backend running on `http://localhost:3001`
- No internet connection required (mock mode handles SDK CDN failures)

## Testing the Complete Flow

### Step 1: Navigate to KYC Page
1. Open your browser to `http://localhost:5173`
2. Click on the **"KYC"** link in the navigation
3. You should see the KYC page with the title "Verificación de Identidad"

### Step 2: Fill Personal Data Form
1. Fill in the form with test data:
   - **Email**: `test@example.com`
   - **Nombre**: `Juan`
   - **Apellido**: `Pérez`
2. Click **"Continuar"** button
3. You should see a loading spinner briefly

### Step 3: Mock Verification (No Internet Required)
Since you don't have internet access, the system automatically falls back to mock mode:

1. You'll see a **"📋 Modo Demo - Sumsub SDK"** section
2. Click the **"✓ Simular Verificación Exitosa"** button
3. The verification will complete immediately

### Step 4: Verification Completed
1. You should see the **"¡Verificación Completada!"** screen
2. The screen shows:
   - Green checkmark icon
   - Your email and name
   - "Ver mis credenciales →" button

### Step 5: View Credentials
1. Click **"Ver mis credenciales →"** button
2. You'll be taken to the Credentials page
3. Your new credential should appear in the list

## What's Happening Behind the Scenes

### Frontend Flow
```
PersonalDataForm (Step 1)
    ↓
useKYC.initKYC() → POST /api/kyc/init
    ↓
SumsubSDK Component (Step 2)
    ↓
Mock Mode Fallback (No internet)
    ↓
Mock Verification Button
    ↓
KYC.jsx → COMPLETED state
```

### Backend Flow
```
POST /api/kyc/init
    ↓
Try: Create Sumsub applicant
    ↓
Catch: Sumsub fails → Create mock applicant
    ↓
Save to database
    ↓
Return mock SDK token (starts with "mock_")
```

### Mock Mode Detection
- If SDK token starts with `"mock_"`, the frontend knows to use mock mode
- Mock mode shows a demo UI with a simulation button
- No real Sumsub API calls are made

## Expected Behavior

### Success Path
✅ Form validation works
✅ Backend creates mock applicant
✅ Frontend receives mock token
✅ Mock verification button appears
✅ Clicking button completes verification
✅ Completion screen shows
✅ Credential is created

### Error Handling
- If form validation fails → Error message appears
- If backend fails → Error state shown
- If verification fails → Retry button appears

## Database Records

After completing the flow, check your Supabase database:

1. Go to `https://app.supabase.com`
2. Select your project
3. Go to **SQL Editor**
4. Run this query:
```sql
SELECT * FROM kyc_verifications ORDER BY created_at DESC LIMIT 5;
```

You should see your test record with:
- `applicant_id`: `mock_user_XXXXX_TIMESTAMP`
- `external_user_id`: `user_TIMESTAMP`
- `email`: `test@example.com`
- `first_name`: `Juan`
- `last_name`: `Pérez`
- `status`: `pending` (mock mode doesn't auto-approve)

## Troubleshooting

### Issue: "Failed to load Sumsub SDK" error
**Expected behavior** - This is normal without internet. The system should fall back to mock mode.
- Check browser console for the error message
- Verify mock button appears below the error

### Issue: Form doesn't submit
**Solution**:
- Check all fields are filled
- Verify email format is correct
- Check browser console for validation errors

### Issue: Mock button doesn't appear
**Solution**:
- Check browser console for errors
- Verify backend is running on port 3001
- Check that `/api/kyc/init` returns a token starting with `"mock_"`

### Issue: Verification doesn't complete
**Solution**:
- Click the mock button again
- Check browser console for JavaScript errors
- Verify `onSuccess` callback is being called

## Next Steps (SPRINT 3)

Once mock mode testing is complete:

1. **Webhook Integration**: Implement automatic credential generation when Sumsub approves
2. **Real Sumsub Integration**: Fix API signature calculation for production
3. **Credential Generation**: Create blockchain credentials after KYC approval
4. **Status Polling**: Add polling to check verification status

## Files Modified in SPRINT 2

- `src/pages/KYC.jsx` - Main KYC flow page
- `src/components/kyc/PersonalDataForm.jsx` - Personal data collection
- `src/components/kyc/SumsubSDK.jsx` - Sumsub SDK integration with mock fallback
- `src/hooks/useKYC.js` - KYC state management
- `ownly-backend/api/src/routes/kyc.js` - KYC API endpoints with mock fallback
- `ownly-backend/api/src/services/sumsubService.js` - Sumsub API integration
- `ownly-backend/api/src/services/databaseService.js` - Database operations

## Testing Checklist

- [ ] Frontend loads on `/kyc`
- [ ] Form validation works
- [ ] Form submission calls backend
- [ ] Mock mode is triggered (no internet)
- [ ] Mock verification button appears
- [ ] Clicking button completes verification
- [ ] Completion screen shows user data
- [ ] "Ver mis credenciales" button works
- [ ] Database record is created
- [ ] Can retry from error state

## Notes

- Mock mode is **only for local development**
- In production, real Sumsub SDK will load from CDN
- Mock applicant IDs start with `"mock_"`
- Mock tokens start with `"mock_token_"`
- All mock data is saved to database for testing purposes
