# 🚀 QUICK REFERENCE - OWNLY PROJECT

**Last Updated**: April 22, 2026

---

## Running the Project

### Terminal 1: Backend
```bash
cd ownly-backend/api
npm run dev
# Runs on http://localhost:3001
```

### Terminal 2: Frontend
```bash
npm run dev
# Runs on http://localhost:5173
```

---

## Key URLs

| Page | URL | Auth Required |
|------|-----|---------------|
| Login | http://localhost:5173/login | ❌ No |
| Register | http://localhost:5173/register | ❌ No |
| Dashboard | http://localhost:5173/dashboard | ✅ Yes |
| KYC | http://localhost:5173/kyc | ✅ Yes |
| Credentials | http://localhost:5173/credentials | ✅ Yes |
| Documents | http://localhost:5173/documents | ✅ Yes |
| Verify | http://localhost:5173/verify | ❌ No |

---

## Authentication Methods

### 1. Metamask
- Click "Conectar Metamask"
- Approve in Metamask popup
- Redirects to dashboard

### 2. Email
- Click "Email y Contraseña"
- Enter email and password
- Click "Iniciar Sesión"

### 3. Biometric (if device supports)
- Click "Huella Digital / Cara"
- Use fingerprint or face
- Redirects to dashboard

### 4. Register
- Click "Crear Cuenta"
- Fill in email, password, confirm password
- Click "Crear Cuenta"
- Redirects to dashboard

---

## Document Management

### Upload
1. Go to Documents page
2. Click "Subir Documento"
3. Select document type
4. Choose file
5. Enter password (min 8 chars)
6. Confirm password
7. Click "Subir Documento"

### View
1. Click "Ver Documento" on document
2. Enter password
3. Click "Ver Documento"
4. Document decrypts and displays

### Download
1. After decryption, click download icon
2. File saves to downloads folder

---

## KYC Flow

### Step 1: Personal Data
- Enter email
- Enter name
- Enter last name
- Click "Continuar"

### Step 2: Verification
- Click "✓ Simular Verificación Exitosa"
- Wait for completion

### Step 3: Completion
- See "¡Verificación Completada!"
- Click "Ver mis credenciales →"

### Result
- Credential created automatically
- Visible in Credentials page
- No PII stored

---

## Troubleshooting

### Document Viewer Error
```
Error: "string to be decoded is not correctly encoded"
Solution:
1. Clear browser cache (Ctrl+Shift+Delete)
2. Clear IndexedDB (DevTools → Application → IndexedDB → Delete ownly_db)
3. Re-upload document
4. Check browser console for details
```

### Metamask Not Connecting
```
Error: "Metamask no está instalado"
Solution:
1. Install Metamask from https://metamask.io
2. Enable Metamask extension
3. Try again
```

### Biometric Not Available
```
No "Huella Digital / Cara" button
Solution:
1. Device may not support biometric
2. Use email or Metamask instead
3. Try on different device
```

### Can't Login
```
Error: "Por favor completa todos los campos"
Solution:
1. Make sure email is valid format
2. Make sure password is at least 8 characters
3. Check if account exists (try Register)
4. Check browser console for errors
```

---

## Database

### Supabase Connection
- URL: Check `.env` file
- Key: Check `.env` file
- Tables: kyc_verifications, credentials, user_documents

### Check Data
```sql
-- KYC records
SELECT * FROM kyc_verifications ORDER BY created_at DESC LIMIT 5;

-- Credentials
SELECT * FROM credentials ORDER BY created_at DESC LIMIT 5;

-- Documents
SELECT * FROM user_documents ORDER BY created_at DESC LIMIT 5;
```

---

## Environment Variables

### Frontend (.env)
```
VITE_API_URL=http://localhost:3001
```

### Backend (ownly-backend/api/.env)
```
SUPABASE_URL=your_url
SUPABASE_KEY=your_key
SUMSUB_APP_TOKEN=your_token
SUMSUB_SECRET_KEY=your_secret
CREDENTIAL_ISSUER=ownly.eth
```

---

## File Structure

### Important Frontend Files
- `src/App.jsx` - Main app with routes
- `src/pages/Login.jsx` - Login page
- `src/pages/Register.jsx` - Registration page
- `src/pages/Dashboard.jsx` - User dashboard
- `src/pages/Documents.jsx` - Document management
- `src/context/AuthContext.jsx` - Auth state
- `src/hooks/useAuth.js` - Auth hook
- `src/utils/encryption.js` - Encryption utilities
- `src/utils/biometric.js` - Biometric utilities

### Important Backend Files
- `ownly-backend/api/src/index.js` - Server entry
- `ownly-backend/api/src/routes/kyc.js` - KYC endpoints
- `ownly-backend/api/src/routes/credentials.js` - Credential endpoints
- `ownly-backend/api/src/routes/documents.js` - Document endpoints
- `ownly-backend/api/src/services/sumsubService.js` - Sumsub integration
- `ownly-backend/api/src/services/databaseService.js` - Database service

---

## Common Commands

### Frontend
```bash
npm run dev          # Start dev server
npm run build        # Build for production
npm run preview      # Preview production build
npm run lint         # Run linter
```

### Backend
```bash
npm run dev          # Start dev server
npm run build        # Build for production
npm start            # Start production server
npm test             # Run tests
```

---

## Testing

### Quick Test
1. Open http://localhost:5173/login
2. Click "Email y Contraseña"
3. Enter: test@example.com / TestPassword123
4. Click "Iniciar Sesión"
5. Should redirect to dashboard

### Document Test
1. Go to Documents page
2. Upload a file with password "TestPassword123"
3. Click "Ver Documento"
4. Enter password "TestPassword123"
5. Should decrypt and display

### KYC Test
1. Go to KYC page
2. Fill in form with test data
3. Click "Continuar"
4. Click "✓ Simular Verificación Exitosa"
5. Should show completion message

---

## Performance Tips

### Frontend
- Use `npm run build` for production
- Enable gzip compression
- Use CDN for static assets
- Cache API responses

### Backend
- Use connection pooling
- Cache database queries
- Enable CORS properly
- Use rate limiting

---

## Security Checklist

- ✅ Passwords encrypted with AES-256-GCM
- ✅ No PII stored in database
- ✅ HTTPS only in production
- ✅ CORS configured properly
- ✅ Rate limiting enabled
- ✅ Input validation on all endpoints
- ✅ Error messages don't leak info
- ✅ Session tokens secure

---

## Support

### Issues
1. Check browser console (F12)
2. Check backend logs
3. Check database for data
4. Read error messages carefully
5. Check TESTING_FIXES.md for solutions

### Documentation
- SPRINT5_STATUS.md - Current status
- TESTING_FIXES.md - Testing guide
- FIXES_APPLIED.md - What was fixed
- CURRENT_STATUS.md - Project overview

---

## Next Steps

1. ✅ Run tests from TESTING_FIXES.md
2. ✅ Report any issues
3. ✅ Fix issues if found
4. ✅ Mark SPRINT 5 as complete
5. ✅ Plan SPRINT 6 features

---

**Last Updated**: April 22, 2026  
**Status**: ✅ Ready for Testing

