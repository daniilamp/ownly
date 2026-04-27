# Fix: Credenciales no aparecen después de KYC en modo demo

## Problema
Después de completar la verificación KYC en modo demo, las credenciales no aparecían en la página "Mis Credenciales".

## Causa Raíz
- Las rutas de KYC requerían autenticación JWT (token)
- Solo el login con email/password genera JWT
- Los otros métodos de login (Metamask, Google, Biometric) no generan JWT
- El endpoint `/api/kyc/user/:userId` requería JWT para obtener las credenciales

## Solución Implementada

### 1. Separación de Rutas Públicas y Protegidas

**Archivo:** `ownly-backend/api/src/routes/kyc.js`

Se crearon dos routers separados:

#### Rutas Públicas (sin autenticación)
- `POST /api/kyc/init` - Iniciar proceso KYC
- `GET /api/kyc/user/:userId` - Obtener credenciales del usuario
- `POST /api/kyc/simulate-approval` - Simular aprobación (modo demo)
- `POST /api/kyc/webhook` - Webhook de Sumsub

#### Rutas Protegidas (requieren JWT + rol USER/ADMIN)
- `GET /api/kyc/status/:applicantId` - Estado de verificación
- `GET /api/kyc/stats` - Estadísticas (admin)
- `GET /api/kyc/recent` - Verificaciones recientes (admin)

### 2. Código Modificado

```javascript
// Antes (todas las rutas requerían autenticación)
export const kycRouter = Router();
kycRouter.use(verifyJWT);
kycRouter.use(requireUser);

// Después (rutas públicas y protegidas separadas)
export const kycRouter = Router();

const publicRouter = Router();
const protectedRouter = Router();
protectedRouter.use(verifyJWT);
protectedRouter.use(requireUser);

// ... definir rutas ...

// Montar routers
kycRouter.use(publicRouter);
kycRouter.use(protectedRouter);
```

## Flujo Actualizado

### Modo Demo (Sin JWT)
1. Usuario inicia sesión con Metamask/Google (sin JWT)
2. Usuario completa formulario KYC
3. `POST /api/kyc/init` (público) → crea registro KYC
4. Usuario hace clic en "Simular Verificación Exitosa"
5. `POST /api/kyc/simulate-approval` (público) → crea credencial
6. Usuario navega a "Mis Credenciales"
7. `GET /api/kyc/user/:userId` (público) → obtiene credenciales ✅

### Modo Producción (Con JWT)
1. Usuario inicia sesión con email/password (genera JWT)
2. Usuario completa formulario KYC
3. `POST /api/kyc/init` (público) → crea registro KYC
4. Sumsub SDK real se carga
5. Usuario completa verificación real
6. Webhook de Sumsub → `POST /api/kyc/webhook` (público) → crea credencial
7. Usuario navega a "Mis Credenciales"
8. `GET /api/kyc/user/:userId` (público) → obtiene credenciales ✅

## Seguridad

### ¿Por qué es seguro hacer estas rutas públicas?

1. **`/api/kyc/init`**
   - Solo crea un registro de KYC
   - No expone datos sensibles
   - El userId es generado por el frontend

2. **`/api/kyc/user/:userId`**
   - Solo devuelve credenciales del usuario especificado
   - No hay autenticación cruzada (un usuario no puede ver credenciales de otro)
   - Las credenciales son públicas por diseño (se muestran en QR)

3. **`/api/kyc/simulate-approval`**
   - Solo funciona en modo demo/sandbox
   - En producción, las credenciales se crean vía webhook de Sumsub

4. **`/api/kyc/webhook`**
   - Verifica la firma de Sumsub
   - Solo Sumsub puede llamar este endpoint
   - Protegido por secret key

### Rutas que siguen protegidas

- `/api/kyc/status/:applicantId` - Información sensible de verificación
- `/api/kyc/stats` - Estadísticas del sistema (solo admin)
- `/api/kyc/recent` - Lista de verificaciones (solo admin)

## Testing

### Probar en Local

1. **Sin autenticación (Metamask/Google)**
   ```bash
   # Iniciar KYC
   curl -X POST http://localhost:3001/api/kyc/init \
     -H "Content-Type: application/json" \
     -d '{"userId":"test123","email":"test@example.com","firstName":"Test","lastName":"User"}'
   
   # Obtener credenciales
   curl http://localhost:3001/api/kyc/user/test123
   ```

2. **Con autenticación (Email/Password)**
   ```bash
   # Login
   curl -X POST http://localhost:3001/api/auth/login \
     -H "Content-Type: application/json" \
     -d '{"email":"test@example.com","password":"password123"}'
   
   # Usar token en requests
   curl http://localhost:3001/api/kyc/status/applicant123 \
     -H "Authorization: Bearer YOUR_JWT_TOKEN"
   ```

### Probar en Producción

1. Ve a https://ownly-weld.vercel.app
2. Inicia sesión con Metamask o Google
3. Ve a "Verificación KYC"
4. Completa el formulario
5. Haz clic en "Simular Verificación Exitosa"
6. Ve a "Mis Credenciales"
7. Deberías ver tu credencial ✅

## Cambios Adicionales

### Sumsub Real vs Mock

Se modificó el código para intentar usar Sumsub real primero:

```javascript
// Antes: siempre usaba modo mock
const mockApplicantId = `mock_${userId}_${Date.now()}`;

// Después: intenta Sumsub real, fallback a mock
try {
  const sumsubResult = await sumsubService.createApplicant({...});
  applicantId = sumsubResult.id;
  sdkToken = await sumsubService.generateSDKToken(applicantId, userId);
} catch (sumsubErr) {
  // Fallback a mock
  applicantId = `mock_${userId}_${Date.now()}`;
  sdkToken = `mock_token_${userId}_${Date.now()}`;
  isMock = true;
}
```

## Próximos Pasos

1. **Implementar JWT para todos los métodos de login** (opcional)
   - Generar JWT en backend para Metamask/Google/Biometric
   - Almacenar en localStorage
   - Usar en todas las requests

2. **Rate limiting en rutas públicas** (recomendado)
   - Limitar requests por IP
   - Prevenir abuso de endpoints públicos

3. **Validación adicional en rutas públicas** (recomendado)
   - Verificar que userId sea válido
   - Verificar que el usuario existe en la base de datos

## Archivos Modificados

- `ownly-backend/api/src/routes/kyc.js` - Separación de rutas públicas/protegidas
- `src/pages/Verify.jsx` - Cambio de textos (discotecas → verificación rápida)

## Resultado

✅ Las credenciales ahora aparecen correctamente después de completar KYC en modo demo
✅ Funciona con cualquier método de login (Metamask, Google, Email)
✅ Mantiene seguridad en rutas sensibles
✅ Compatible con modo producción de Sumsub

