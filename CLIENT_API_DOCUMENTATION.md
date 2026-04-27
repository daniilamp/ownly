# 🔐 Ownly B2B API - Documentación para Clientes

## 📋 Resumen

Ownly ahora ofrece una API privada y segura para que empresas (prop firms, brokers, exchanges) puedan verificar usuarios de forma instantánea sin duplicar procesos KYC.

---

## 🚀 Inicio Rápido

### 1. Obtener tu API Key

Contacta con el equipo de Ownly para obtener tu API key:
- **Email**: support@ownly.io
- **Formato**: `ownly_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`

⚠️ **IMPORTANTE**: Guarda tu API key de forma segura. No la compartas públicamente ni la incluyas en código frontend.

---

## 🔌 Endpoints Disponibles

### Base URL
```
https://ownly-api.onrender.com
```

### Autenticación

Todas las peticiones requieren el header:
```
Authorization: Bearer {TU_API_KEY}
```

---

## 📡 API Reference

### 1. Verificar Usuario por Ownly ID

**Endpoint**: `GET /api/identity/:ownlyId`

**Descripción**: Consulta el estado de verificación de un usuario. Soporta búsqueda por Ownly ID o email.

**Ejemplo**:
```bash
curl -X GET "https://ownly-api.onrender.com/api/identity/ow_8F3K29X" \
  -H "Authorization: Bearer ownly_18ab0bc16ca54b7aa170ca0b4092a62e"
```

**Respuesta exitosa** (200):
```json
{
  "verified": true,
  "verification_level": "full",
  "risk_score": "low",
  "timestamp": "2026-04-27T10:30:00.000Z",
  "unique_user": true
}
```

**Respuesta usuario no verificado** (200):
```json
{
  "verified": false,
  "verification_level": "none",
  "risk_score": "unknown",
  "timestamp": "2026-04-27T10:30:00.000Z",
  "unique_user": false
}
```

---

### 2. Verificar Usuario (POST)

**Endpoint**: `POST /api/identity/verify`

**Descripción**: Endpoint principal para verificación. Soporta Ownly ID o email.

**Body**:
```json
{
  "ownly_id": "ow_8F3K29X"
}
```

**Ejemplo**:
```bash
curl -X POST "https://ownly-api.onrender.com/api/identity/verify" \
  -H "Authorization: Bearer ownly_18ab0bc16ca54b7aa170ca0b4092a62e" \
  -H "Content-Type: application/json" \
  -d '{"ownly_id": "ow_8F3K29X"}'
```

**Respuesta** (200):
```json
{
  "verified": true,
  "verification_level": "full",
  "risk_score": "low",
  "timestamp": "2026-04-27T10:30:00.000Z",
  "approved_at": "2026-04-27T10:35:00.000Z",
  "unique_user": true,
  "can_trade": true
}
```

---

### 3. Verificar Unicidad de Usuario

**Endpoint**: `GET /api/identity/:ownlyId/unique`

**Descripción**: Comprueba si un usuario es único (anti multicuenta). Útil para prop firms.

**Ejemplo**:
```bash
curl -X GET "https://ownly-api.onrender.com/api/identity/ow_8F3K29X/unique" \
  -H "Authorization: Bearer ownly_18ab0bc16ca54b7aa170ca0b4092a62e"
```

**Respuesta** (200):
```json
{
  "is_unique": true,
  "verified": true
}
```

---

### 4. Buscar por Email

**Endpoint**: `GET /api/identity/email/:email`

**Descripción**: Busca verificación directamente por email.

**Ejemplo**:
```bash
curl -X GET "https://ownly-api.onrender.com/api/identity/email/user@example.com" \
  -H "Authorization: Bearer ownly_18ab0bc16ca54b7aa170ca0b4092a62e"
```

**Respuesta** (200):
```json
{
  "verified": true,
  "verification_level": "full",
  "risk_score": "low",
  "timestamp": "2026-04-27T10:30:00.000Z",
  "unique_user": true
}
```

---

## 📊 Campos de Respuesta

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `verified` | boolean | Usuario verificado (KYC completo) |
| `verification_level` | string | `full`, `pending`, `rejected`, `none` |
| `risk_score` | string | `low`, `medium`, `high`, `unknown` |
| `timestamp` | string | Fecha de verificación (ISO 8601) |
| `unique_user` | boolean | Usuario único (no multicuenta) |
| `can_trade` | boolean | Puede operar (solo en `/verify`) |
| `approved_at` | string | Fecha de aprobación (solo en `/verify`) |

---

## ⚠️ Códigos de Error

### 401 Unauthorized
```json
{
  "error": "API key required",
  "code": "MISSING_API_KEY"
}
```

**Causa**: No se proporcionó el header `Authorization`.

---

### 401 Unauthorized
```json
{
  "error": "Invalid or inactive API key",
  "code": "UNAUTHORIZED"
}
```

**Causa**: API key incorrecta o inactiva.

---

### 401 Unauthorized
```json
{
  "error": "API key expired",
  "code": "EXPIRED_API_KEY"
}
```

**Causa**: Tu API key ha expirado. Contacta con soporte.

---

### 403 Forbidden
```json
{
  "error": "Permission denied: verify:read",
  "code": "INSUFFICIENT_PERMISSIONS"
}
```

**Causa**: Tu API key no tiene permisos para este endpoint.

---

### 400 Bad Request
```json
{
  "error": "ownly_id requerido"
}
```

**Causa**: Falta el parámetro requerido.

---

## 🔒 Seguridad

### Buenas Prácticas

✅ **Hacer**:
- Guarda tu API key en variables de entorno
- Usa HTTPS para todas las peticiones
- Implementa rate limiting en tu lado
- Monitorea el uso de tu API key

❌ **No hacer**:
- Exponer tu API key en código frontend
- Compartir tu API key públicamente
- Hardcodear la API key en tu código
- Usar la misma API key en múltiples entornos

### Ejemplo de Configuración Segura

**Node.js**:
```javascript
// .env
OWNLY_API_KEY=ownly_18ab0bc16ca54b7aa170ca0b4092a62e

// server.js
const OWNLY_API_KEY = process.env.OWNLY_API_KEY;

async function verifyUser(ownlyId) {
  const response = await fetch(
    `https://ownly-api.onrender.com/api/identity/${ownlyId}`,
    {
      headers: {
        'Authorization': `Bearer ${OWNLY_API_KEY}`
      }
    }
  );
  return response.json();
}
```

**Python**:
```python
# .env
OWNLY_API_KEY=ownly_18ab0bc16ca54b7aa170ca0b4092a62e

# app.py
import os
import requests

OWNLY_API_KEY = os.getenv('OWNLY_API_KEY')

def verify_user(ownly_id):
    response = requests.get(
        f'https://ownly-api.onrender.com/api/identity/{ownly_id}',
        headers={'Authorization': f'Bearer {OWNLY_API_KEY}'}
    )
    return response.json()
```

---

## 💼 Casos de Uso

### 1. Prop Firm - Verificar Trader

```javascript
// Antes de asignar capital, verifica que el trader esté verificado
const result = await verifyUser(traderId);

if (result.verified && result.can_trade && result.unique_user) {
  // ✅ Trader verificado, único, puede operar
  assignCapital(traderId, 100000);
} else {
  // ❌ Rechazar solicitud
  rejectApplication(traderId);
}
```

### 2. Broker - Onboarding Instantáneo

```javascript
// Usuario ya verificado en Ownly → onboarding instantáneo
const result = await verifyUser(userEmail);

if (result.verified && result.verification_level === 'full') {
  // ✅ KYC completo → activar cuenta inmediatamente
  activateAccount(userId);
} else {
  // ⏳ Iniciar proceso KYC tradicional
  startKYCProcess(userId);
}
```

### 3. Exchange - Anti Multicuenta

```javascript
// Detectar usuarios con múltiples cuentas
const uniqueCheck = await fetch(
  `https://ownly-api.onrender.com/api/identity/${userId}/unique`,
  { headers: { 'Authorization': `Bearer ${API_KEY}` } }
).then(r => r.json());

if (!uniqueCheck.is_unique) {
  // ⚠️ Usuario detectado con múltiples cuentas
  flagAccount(userId, 'MULTI_ACCOUNT');
}
```

---

## 📈 Rate Limits

- **Default**: 1000 peticiones/día
- **Burst**: 10 peticiones/segundo

Si necesitas límites más altos, contacta con soporte.

---

## 🆘 Soporte

**Email**: support@ownly.io  
**Documentación**: https://docs.ownly.io  
**Status**: https://status.ownly.io

---

## 🔄 Changelog

### v2.0.0 (2026-04-27)
- ✨ Implementación de autenticación con API keys
- 🔒 Endpoints protegidos (requieren autenticación)
- 🚫 Eliminada exposición de JSON/PII en UI pública
- ✅ Soporte de búsqueda por email (fallback)
- 📊 Respuestas limpias y seguras

### v1.0.0 (2026-04-01)
- 🎉 Lanzamiento inicial (API pública - DEPRECADA)

---

## ⚠️ Migración desde v1.0

Si estabas usando la API pública anterior, necesitas:

1. **Obtener una API key** (contacta con soporte)
2. **Añadir header de autenticación** a todas tus peticiones
3. **Actualizar el formato de respuesta** (ya no se devuelve `ownly_id`, `reason`, etc.)

**Antes (v1.0 - DEPRECADO)**:
```javascript
const response = await fetch(`/api/identity/${ownlyId}`);
// Sin autenticación ❌
```

**Ahora (v2.0)**:
```javascript
const response = await fetch(`/api/identity/${ownlyId}`, {
  headers: {
    'Authorization': `Bearer ${API_KEY}` // ✅
  }
});
```

---

**¿Preguntas?** Contacta con nuestro equipo: support@ownly.io
