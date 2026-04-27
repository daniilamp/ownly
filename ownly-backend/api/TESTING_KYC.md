# Testing KYC API Endpoints

## Setup

1. Asegúrate de que el backend está corriendo:
```bash
npm run dev
```

2. El API debe estar en: `http://localhost:3001`

---

## Test 1: Iniciar verificación KYC

**Endpoint**: `POST /api/kyc/init`

**Descripción**: Crea un nuevo applicant en Sumsub y retorna el SDK token para el frontend.

**Request**:
```bash
curl -X POST http://localhost:3001/api/kyc/init \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "user_test_001",
    "email": "juan@example.com",
    "firstName": "Juan",
    "lastName": "Pérez García"
  }'
```

**Expected Response** (200 OK):
```json
{
  "success": true,
  "applicantId": "66a1234567890abcdef12345",
  "sdkToken": "sbx:...",
  "externalUserId": "user_test_001"
}
```

**What it does**:
- Crea un applicant en Sumsub
- Genera un SDK token para que el usuario suba documentos
- Guarda el registro en la base de datos (status: pending)

---

## Test 2: Consultar estado de verificación

**Endpoint**: `GET /api/kyc/status/:applicantId`

**Descripción**: Obtiene el estado actual de una verificación.

**Request** (reemplaza `APPLICANT_ID` con el del Test 1):
```bash
curl -X GET http://localhost:3001/api/kyc/status/APPLICANT_ID
```

**Expected Response** (200 OK):
```json
{
  "success": true,
  "applicantId": "66a1234567890abcdef12345",
  "status": "pending",
  "reviewResult": null,
  "documentData": null,
  "createdAt": "2026-04-22T10:00:00Z",
  "updatedAt": "2026-04-22T10:00:00Z"
}
```

**What it does**:
- Consulta el estado en Sumsub
- Si cambió, actualiza la base de datos
- Retorna el estado actual

---

## Test 3: Obtener datos del usuario

**Endpoint**: `GET /api/kyc/user/:userId`

**Descripción**: Obtiene la verificación KYC y credenciales de un usuario.

**Request** (reemplaza `USER_ID` con el del Test 1):
```bash
curl -X GET http://localhost:3001/api/kyc/user/USER_ID
```

**Expected Response** (200 OK):
```json
{
  "success": true,
  "verification": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "applicant_id": "66a1234567890abcdef12345",
    "external_user_id": "user_test_001",
    "email": "juan@example.com",
    "first_name": "Juan",
    "last_name": "Pérez García",
    "status": "pending",
    "review_answer": null,
    "created_at": "2026-04-22T10:00:00Z",
    "updated_at": "2026-04-22T10:00:00Z"
  },
  "credentials": []
}
```

**What it does**:
- Busca la verificación KYC del usuario
- Retorna también las credenciales emitidas (si las hay)

---

## Test 4: Estadísticas (Admin)

**Endpoint**: `GET /api/kyc/stats`

**Descripción**: Obtiene estadísticas de verificaciones.

**Request**:
```bash
curl -X GET http://localhost:3001/api/kyc/stats
```

**Expected Response** (200 OK):
```json
{
  "success": true,
  "stats": {
    "total": 1,
    "approved": 0,
    "rejected": 0,
    "pending": 1
  }
}
```

---

## Test 5: Verificaciones recientes (Admin)

**Endpoint**: `GET /api/kyc/recent?limit=50`

**Descripción**: Obtiene las verificaciones más recientes.

**Request**:
```bash
curl -X GET "http://localhost:3001/api/kyc/recent?limit=10"
```

**Expected Response** (200 OK):
```json
{
  "success": true,
  "verifications": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "applicant_id": "66a1234567890abcdef12345",
      "external_user_id": "user_test_001",
      "email": "juan@example.com",
      "first_name": "Juan",
      "last_name": "Pérez García",
      "status": "pending",
      "review_answer": null,
      "created_at": "2026-04-22T10:00:00Z"
    }
  ]
}
```

---

## Flujo completo de testing

### Paso 1: Iniciar verificación
```bash
# Ejecuta Test 1 y guarda el applicantId
APPLICANT_ID="<resultado del test 1>"
USER_ID="user_test_001"
```

### Paso 2: Verificar que se guardó en BD
```bash
# Ejecuta Test 3 para ver que el usuario está en la BD
curl -X GET http://localhost:3001/api/kyc/user/$USER_ID
```

### Paso 3: Simular aprobación en Sumsub (manual)
1. Ve a https://cockpit.sumsub.com/
2. Busca el applicant que creaste
3. En sandbox, puedes simular una aprobación
4. O espera a que Sumsub lo apruebe automáticamente

### Paso 4: Consultar estado actualizado
```bash
# Ejecuta Test 2 para ver si cambió el estado
curl -X GET http://localhost:3001/api/kyc/status/$APPLICANT_ID
```

### Paso 5: Ver estadísticas
```bash
# Ejecuta Test 4 para ver las estadísticas
curl -X GET http://localhost:3001/api/kyc/stats
```

---

## Troubleshooting

### Error: "Cannot find module '@supabase/supabase-js'"
**Solución**: Ejecuta `npm install` en `ownly-backend/api/`

### Error: "SUMSUB_APP_TOKEN is not defined"
**Solución**: Verifica que el `.env` tiene las variables de Sumsub

### Error: "SUPABASE_URL is not defined"
**Solución**: Verifica que el `.env` tiene las variables de Supabase

### Error: "Invalid signature" en webhook
**Solución**: Esto es normal si no es un webhook real de Sumsub. Los webhooks se prueban después.

### Error: "Verification not found" (404)
**Solución**: Asegúrate de usar el applicantId correcto del Test 1

---

## Notas importantes

1. **Sandbox mode**: Estamos en sandbox de Sumsub, así que las verificaciones son simuladas
2. **Webhooks**: Los webhooks se prueban después cuando Sumsub notifique cambios
3. **Base de datos**: Todos los datos se guardan en Supabase
4. **RLS**: Row Level Security está habilitado, pero el backend usa service_role que tiene acceso total

---

## Próximos pasos

Una vez que confirmes que los endpoints funcionan:
1. Pasamos al frontend (crear página `/kyc`)
2. Integramos Sumsub Web SDK
3. Testeamos el flujo completo usuario → KYC → credencial

