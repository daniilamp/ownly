# 🧪 TESTING GUIDE - FIXES APPLIED

**Date**: April 22, 2026  
**Status**: Ready to Test

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

## Test 1: Document Viewer Fix ✅

### Steps:
1. Open http://localhost:5173/login
2. Login with any method (Metamask, Email, or Biometric)
3. Go to http://localhost:5173/documents
4. Click "Subir Documento"
5. Select a document type (e.g., "DNI")
6. Choose a file (PDF, JPG, PNG, DOC)
7. Enter a password (min 8 characters)
8. Confirm password
9. Click "Subir Documento"
10. Wait for success message
11. Click "Ver Documento" on the uploaded document
12. Enter the password you used
13. Click "Ver Documento" button

### Expected Results:
- ✅ Document decrypts successfully
- ✅ No "string to be decoded" error
- ✅ Document displays or shows download option
- ✅ Clear error messages if something goes wrong

### If Error Occurs:
- Check browser console (F12) for detailed error
- Verify password is correct
- Try uploading a different file type
- Check backend logs for any issues

---

## Test 2: Metamask Connection Fix ✅

### Test 2a: Metamask Not Installed
1. Open http://localhost:5173/login
2. Make sure Metamask is NOT installed (or disabled)
3. Click "Conectar Metamask"

### Expected Results:
- ✅ Error message: "Metamask no está instalado. Por favor instálalo desde https://metamask.io"
- ✅ Link to Metamask installation page

### Test 2b: Metamask Installed
1. Open http://localhost:5173/login
2. Make sure Metamask is installed and enabled
3. Click "Conectar Metamask"

### Expected Results:
- ✅ Metamask popup appears
- ✅ Shows account selection
- ✅ After approval, redirects to dashboard

### Test 2c: User Rejects Connection
1. Open http://localhost:5173/login
2. Click "Conectar Metamask"
3. In Metamask popup, click "Cancel" or "Reject"

### Expected Results:
- ✅ Error message: "Conexión rechazada. Por favor acepta la solicitud en Metamask."
- ✅ User stays on login page
- ✅ Can try again

---

## Test 3: Registration Route Integration ✅

### Steps:
1. Open http://localhost:5173/login
2. Look for "¿No tienes cuenta?" section at bottom
3. Click "Crear Cuenta" button

### Expected Results:
- ✅ Navigates to http://localhost:5173/register
- ✅ Shows registration form with:
  - Email field
  - Password field
  - Confirm Password field
  - "Crear Cuenta" button
  - "Volver a Iniciar Sesión" link

### Test 3b: Register New Account
1. On registration page, fill in:
   - Email: test@example.com (or any valid email)
   - Password: TestPassword123 (min 8 chars)
   - Confirm Password: TestPassword123
2. Click "Crear Cuenta"

### Expected Results:
- ✅ Account created
- ✅ Redirects to dashboard
- ✅ User is logged in
- ✅ Can access protected pages (KYC, Documents, Credentials)

### Test 3c: Validation
1. Try to register with:
   - Empty fields → Should show "Por favor completa todos los campos"
   - Mismatched passwords → Should show "Las contraseñas no coinciden"
   - Password < 8 chars → Should show "La contraseña debe tener al menos 8 caracteres"
   - Invalid email → Should show "Email inválido"

### Expected Results:
- ✅ All validation messages appear correctly
- ✅ Form doesn't submit with invalid data

---

## Test 4: Biometric Authentication (if supported)

### Prerequisites:
- Device with biometric support (fingerprint or face recognition)
- Browser with WebAuthn support (Chrome, Firefox, Safari, Edge)

### Steps:
1. Open http://localhost:5173/login
2. Look for "Huella Digital / Cara" button
3. If button appears: Device supports biometric
4. Click button
5. Use fingerprint or face recognition

### Expected Results:
- ✅ Biometric prompt appears
- ✅ After successful authentication, redirects to dashboard
- ✅ User is logged in

### If Button Doesn't Appear:
- Device doesn't support biometric
- Or biometric not registered yet
- This is normal - other auth methods still work

---

## Test 5: All Authentication Methods

### Test 5a: Email Login
1. Go to http://localhost:5173/login
2. Click "Email y Contraseña"
3. Enter email and password
4. Click "Iniciar Sesión"

### Expected Results:
- ✅ Logs in successfully
- ✅ Redirects to dashboard

### Test 5b: Metamask Login
1. Go to http://localhost:5173/login
2. Click "Conectar Metamask"
3. Approve in Metamask

### Expected Results:
- ✅ Logs in successfully
- ✅ Redirects to dashboard

### Test 5c: Biometric Login (if available)
1. Go to http://localhost:5173/login
2. Click "Huella Digital / Cara"
3. Use biometric

### Expected Results:
- ✅ Logs in successfully
- ✅ Redirects to dashboard

---

## Test 6: Protected Routes

After logging in, verify you can access:
- ✅ http://localhost:5173/dashboard
- ✅ http://localhost:5173/kyc
- ✅ http://localhost:5173/credentials
- ✅ http://localhost:5173/documents

If you try to access these without logging in:
- ✅ Should redirect to /login

---

## Troubleshooting

### Issue: Document viewer still shows error
- Clear browser cache (Ctrl+Shift+Delete)
- Clear IndexedDB: Open DevTools → Application → IndexedDB → Delete "ownly_db"
- Re-upload the document
- Check browser console for detailed error

### Issue: Metamask connection fails
- Make sure Metamask is installed and enabled
- Try refreshing the page
- Check if you're on a supported network
- Look at browser console for error details

### Issue: Registration doesn't work
- Check if email is valid format
- Make sure passwords match
- Password must be at least 8 characters
- Check browser console for errors

### Issue: Biometric not available
- Check if device supports biometric
- Check if browser supports WebAuthn
- Try on a different device or browser
- Other auth methods should still work

---

## Success Criteria

All tests should pass:
- ✅ Document viewer decrypts without errors
- ✅ Metamask connection has proper error handling
- ✅ Registration route is accessible
- ✅ Can create new account
- ✅ All authentication methods work
- ✅ Protected routes redirect to login when not authenticated

---

## Next Steps

After testing:
1. Report any issues found
2. If all tests pass, mark SPRINT 5 as complete
3. Plan SPRINT 6 features:
   - Google OAuth integration
   - Biometric registration UI
   - Email verification
   - Password reset
   - Two-factor authentication

---

**Ready to test?** Start with Test 1 and work through all tests! 🚀

