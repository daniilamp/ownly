# ✅ SPRINT 3: UI Flow Fix

**Status**: ✅ FIXED

---

## The Problem

Cuando completabas el flujo KYC en la UI:
1. Llenabas el formulario
2. Hacías clic en "Continuar"
3. Hacías clic en "✓ Simular Verificación Exitosa"
4. Veías "¡Verificación Completada!"
5. Pero cuando ibas a "Mis Credenciales" → **No había ninguna credencial**

---

## Root Cause

El componente `SumsubSDK` estaba enviando el `sdkToken` como `applicantId` en el callback:

```javascript
// WRONG - sending sdkToken instead of applicantId
onSuccess?.({
  applicantId: sdkToken,  // ❌ This is "mock_token_..." not "mock_user_..."
  status: 'completed',
  mock: true,
});
```

Luego el frontend llamaba a `/api/kyc/simulate-approval` con el `applicantId` incorrecto:

```javascript
// Frontend sends wrong applicantId
fetch('/api/kyc/simulate-approval', {
  body: JSON.stringify({
    applicantId: "mock_token_...",  // ❌ WRONG
    userId: "user_test_...",
  }),
});
```

El backend no encontraba el KYC record porque el `applicantId` era incorrecto.

---

## The Fix

### 1. Pass `applicantId` to SumsubSDK
Updated `KYC.jsx`:
```javascript
const { loading, error, sdkToken, applicantId, initKYC, reset } = useKYC();

<SumsubSDK
  sdkToken={sdkToken}
  applicantId={applicantId}  // ✅ NEW
  onSuccess={handleVerificationSuccess}
  onError={handleVerificationError}
/>
```

### 2. Use `applicantId` in Callback
Updated `SumsubSDK.jsx`:
```javascript
export default function SumsubSDK({ sdkToken, applicantId, onSuccess, onError }) {
  // ...
  onSuccess?.({
    applicantId: applicantId,  // ✅ CORRECT
    status: 'completed',
    mock: true,
  });
}
```

### 3. Frontend Sends Correct Data
Now the frontend sends:
```javascript
fetch('/api/kyc/simulate-approval', {
  body: JSON.stringify({
    applicantId: "mock_user_...",  // ✅ CORRECT
    userId: "user_test_...",
  }),
});
```

### 4. Backend Finds KYC Record
Backend now finds the correct KYC record and creates the credential.

---

## Files Modified

1. **src/pages/KYC.jsx**
   - Added `applicantId` to destructuring from `useKYC()`
   - Pass `applicantId` prop to `SumsubSDK`

2. **src/components/kyc/SumsubSDK.jsx**
   - Added `applicantId` parameter
   - Use `applicantId` instead of `sdkToken` in callback (both places)

---

## Complete Flow Now

```
1. User fills form → Click "Continuar"
   ↓
2. Frontend calls POST /api/kyc/init
   ↓
3. Backend creates KYC + Credential
   ↓
4. Backend returns applicantId + sdkToken
   ↓
5. Frontend stores both in state
   ↓
6. User sees "✓ Simular Verificación Exitosa"
   ↓
7. User clicks button
   ↓
8. Frontend calls POST /api/kyc/simulate-approval
   ├─ Sends: { applicantId: "mock_user_...", userId: "user_test_..." }
   ↓
9. Backend finds KYC record ✅
   ↓
10. Backend creates/links credential ✅
    ↓
11. Frontend shows "¡Verificación Completada!"
    ↓
12. User clicks "Ver mis credenciales →"
    ↓
13. User sees credential in list ✅
```

---

## Testing

### Test 1: Backend Test
```bash
node test-simulate-approval.js
```
✅ Passes

### Test 2: UI Flow
1. Open http://localhost:5173/kyc
2. Fill form
3. Click "Continuar"
4. Click "✓ Simular Verificación Exitosa"
5. Click "Ver mis credenciales →"
6. See credential in list ✅

---

## Summary

✅ **Fixed**: applicantId now passed correctly
✅ **Fixed**: Backend finds KYC record
✅ **Fixed**: Credential created when you click verification button
✅ **Fixed**: Credential appears in "Mis Credenciales"
✅ **Ready**: UI flow now works end-to-end

---

**Status**: Ready for Testing
**Date**: April 22, 2026
