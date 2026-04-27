# Arquitectura del Sistema B2B Seguro de Ownly

## 🏗️ Diagrama General

```
┌─────────────────────────────────────────────────────────────────┐
│                        CLIENTES B2B                              │
│  (Prop Firms, Brokers, Exchanges)                               │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         │ Authorization: Bearer {API_KEY}
                         │
┌────────────────────────▼────────────────────────────────────────┐
│                    API GATEWAY                                   │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ CORS | Rate Limiting | Helmet | Body Parser             │  │
│  └──────────────────────────────────────────────────────────┘  │
└────────────────────────┬────────────────────────────────────────┘
                         │
┌────────────────────────▼────────────────────────────────────────┐
│              MIDDLEWARE DE AUTENTICACIÓN                         │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ verifyApiKey()                                           │  │
│  │ - Validar formato de API key                            │  │
│  │ - Buscar en base de datos                               │  │
│  │ - Verificar estado (activo/expirado)                    │  │
│  │ - Adjuntar info a request                               │  │
│  └──────────────────────────────────────────────────────────┘  │
└────────────────────────┬────────────────────────────────────────┘
                         │\n                         │\n                         │\n┌────────────────────────▼────────────────────────────────────────┐
│              RUTAS PROTEGIDAS                                    │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ GET /api/identity/:ownlyId                              │  │
│  │ POST /api/identity/verify                               │  │
│  │ GET /api/identity/:ownlyId/unique                       │  │
│  │ GET /api/identity/email/:email                          │  │
│  └──────────────────────────────────────────────────────────┘  │
└────────────────────────┬────────────────────────────────────────┘
                         │
┌────────────────────────▼────────────────────────────────────────┐
│              SERVICIOS DE NEGOCIO                                │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ databaseService.getKYCByUserId()                         │  │
│  │ databaseService.getKYCByEmail()                          │  │
│  │ apiKeyService.logApiUsage()                              │  │
│  └──────────────────────────────────────────────────────────┘  │
└────────────────────────┬────────────────────────────────────────┘
                         │
┌────────────────────────▼────────────────────────────────────────┐
│              BASE DE DATOS (Supabase)                            │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ kyc_verifications                                        │  │
│  │ ├─ id, applicant_id, external_user_id, email            │  │
│  │ ├─ status, review_answer, credential_id                 │  │
│  │ └─ created_at, approved_at, ...                          │  │
│  │                                                          │  │
│  │ api_keys                                                 │  │
│  │ ├─ id, client_id, client_name, key_hash                 │  │
│  │ ├─ permissions, rate_limit, status                      │  │
│  │ └─ created_at, expires_at, last_used_at                 │  │
│  │                                                          │  │
│  │ api_key_usage                                            │  │
│  │ ├─ id, api_key_id, endpoint, method                      │  │
│  │ ├─ status_code, response_time_ms                         │  │
│  │ └─ created_at                                            │  │
│  └──────────────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────────────┘
```

---

## 🔐 Flujo de Autenticación

```
Cliente                    API Gateway              Base de Datos
   │                            │                         │
   │ GET /api/identity/ow_XXX   │                         │
   │ Authorization: Bearer ownly_xxxxx                    │
   ├───────────────────────────>│                         │
   │                            │ verifyApiKey()          │
   │                            ├─────────────────────────>│
   │                            │ SELECT * FROM api_keys  │
   │                            │ WHERE key_hash = ...    │
   │                            │<─────────────────────────┤
   │                            │ ✅ API key válida       │
   │                            │ ✅ Permisos OK          │
   │                            │ ✅ No expirada          │
   │                            │                         │
   │                            │ getKYCByUserId()        │
   │                            ├─────────────────────────>│
   │                            │ SELECT * FROM           │
   │                            │ kyc_verifications       │
   │                            │<─────────────────────────┤
   │                            │ ✅ Usuario encontrado   │
   │                            │                         │
   │                            │ logApiUsage()           │
   │                            ├─────────────────────────>│
   │                            │ INSERT INTO             │
   │                            │ api_key_usage           │
   │                            │<─────────────────────────┤
   │                            │                         │
   │ {verified: true, ...}      │                         │
   │<───────────────────────────┤                         │
   │                            │                         │
```

---

## 🎯 Flujo de Verificación

```
┌─────────────────────────────────────────────────────────────┐
│ Cliente hace request con API Key                            │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│ Middleware: verifyApiKey()                                  │
│ ├─ Validar formato                                          │
│ ├─ Buscar en BD                                             │
│ ├─ Verificar estado                                         │
│ └─ Adjuntar info a request                                  │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│ Middleware: requirePermission('verify:read')                │
│ ├─ Verificar que API key tiene permiso                      │
│ └─ Si no, retornar 403 Forbidden                            │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│ Route Handler: GET /api/identity/:ownlyId                   │
│ ├─ Buscar por Ownly ID                                      │
│ ├─ Si no encuentra y es email, buscar por email             │
│ ├─ Determinar si está verificado                            │
│ ├─ Log de uso                                               │
│ └─ Retornar datos seguros                                   │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│ Respuesta Segura                                            │
│ {                                                           │
│   "verified": true,                                         │
│   "verification_level": "full",                             │
│   "risk_score": "low",                                      │
│   "timestamp": "2026-04-27T10:30:00Z",                      │
│   "unique_user": true                                       │
│ }                                                           │
└─────────────────────────────────────────────────────────────┘
```

---

## 🛡️ Capas de Seguridad

```
┌─────────────────────────────────────────────────────────────┐
│ Capa 1: CORS                                                │
│ ├─ Restringir a dominios autorizados                        │
│ └─ Prevenir requests desde dominios no autorizados          │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│ Capa 2: Rate Limiting                                       │
│ ├─ 30 requests/minuto por IP (global)                       │
│ └─ Límite configurable por API key                          │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│ Capa 3: Autenticación                                       │
│ ├─ Validar API key en header Authorization                  │
│ ├─ Verificar que existe en BD                               │
│ ├─ Verificar que no está expirada                           │
│ └─ Verificar que no está revocada                           │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│ Capa 4: Autorización                                        │
│ ├─ Verificar que API key tiene permisos                     │
│ └─ Verificar que cliente tiene acceso a endpoint            │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│ Capa 5: Validación de Input                                 │
│ ├─ Validar formato de Ownly ID                              │
│ ├─ Validar formato de email                                 │
│ └─ Usar Zod para validación                                 │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│ Capa 6: Lógica de Negocio                                   │
│ ├─ Buscar usuario en BD                                     │
│ ├─ Determinar estado de verificación                        │
│ └─ Retornar solo datos seguros                              │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│ Capa 7: Auditoría                                           │
│ ├─ Loguear todas las llamadas                               │
│ ├─ Registrar endpoint, método, status                       │
│ ├─ Registrar tiempo de respuesta                            │
│ └─ Usar para facturación y análisis                         │
└─────────────────────────────────────────────────────────────┘
```

---

## 📊 Modelo de Datos

### Tabla: api_keys

```sql
CREATE TABLE api_keys (
  id UUID PRIMARY KEY,
  client_id VARCHAR(255) UNIQUE,
  client_name VARCHAR(255),
  key_hash VARCHAR(255),
  permissions TEXT[],
  rate_limit INTEGER,
  status VARCHAR(50),
  created_at TIMESTAMP,
  expires_at TIMESTAMP,
  last_used_at TIMESTAMP
);
```

### Tabla: api_key_usage

```sql
CREATE TABLE api_key_usage (
  id UUID PRIMARY KEY,
  api_key_id UUID REFERENCES api_keys(id),
  endpoint VARCHAR(255),
  method VARCHAR(10),
  status_code INTEGER,
  response_time_ms INTEGER,
  created_at TIMESTAMP
);
```

### Tabla: kyc_verifications (existente)

```sql
CREATE TABLE kyc_verifications (
  id UUID PRIMARY KEY,
  applicant_id VARCHAR(255) UNIQUE,
  external_user_id VARCHAR(255),
  email VARCHAR(255),
  status VARCHAR(50),
  review_answer VARCHAR(50),
  credential_id UUID,
  created_at TIMESTAMP,
  approved_at TIMESTAMP
);
```

---

## 🔄 Ciclo de Vida de API Key

```
1. GENERACIÓN
   ├─ Admin genera API key
   ├─ Se crea registro en BD
   ├─ Se retorna plain key (una sola vez)
   └─ Se almacena hash en BD

2. USO
   ├─ Cliente incluye en Authorization header
   ├─ Servidor valida hash
   ├─ Se verifica permisos
   ├─ Se ejecuta operación
   └─ Se registra en api_key_usage

3. MONITOREO
   ├─ Admin ve estadísticas
   ├─ Admin ve uso por endpoint
   ├─ Admin ve errores
   └─ Admin ve latencia

4. MANTENIMIENTO
   ├─ Admin puede actualizar permisos
   ├─ Admin puede cambiar rate limit
   ├─ Admin puede ver última vez usada
   └─ Admin puede revocar

5. EXPIRACIÓN
   ├─ API key llega a fecha de expiración
   ├─ Servidor rechaza requests
   ├─ Cliente recibe 401 Unauthorized
   └─ Admin genera nueva key
```

---

## 🎯 Flujo de Monetización

```
┌─────────────────────────────────────────────────────────────┐
│ Cliente elige plan                                          │
│ ├─ Básico: $99/mes, 10k verificaciones                      │
│ ├─ Pro: $499/mes, 100k verificaciones                       │
│ └─ Enterprise: Custom                                       │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│ Admin genera API key con rate_limit                         │
│ ├─ Básico: 10,000 requests/mes                              │
│ ├─ Pro: 100,000 requests/mes                                │
│ └─ Enterprise: Ilimitado                                    │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│ Cliente usa API                                             │
│ ├─ Cada request se registra en api_key_usage                │
│ ├─ Se cuenta contra el límite mensual                       │
│ └─ Si excede, retorna 429 Too Many Requests                 │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│ Admin monitorea uso                                         │
│ ├─ Ve estadísticas en dashboard                             │
│ ├─ Ve uso por cliente                                       │
│ ├─ Ve tendencias                                            │
│ └─ Genera reportes                                          │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│ Facturación automática                                      │
│ ├─ Calcular uso del mes                                     │
│ ├─ Aplicar tarifa según plan                                │
│ ├─ Generar factura                                          │
│ └─ Cobrar a cliente                                         │
└─────────────────────────────────────────────────────────────┘
```

---

## 🚀 Escalabilidad

```
┌─────────────────────────────────────────────────────────────┐
│ Fase 1: MVP (Actual)                                        │
│ ├─ API Keys básicas                                         │
│ ├─ Rate limiting simple                                     │
│ ├─ Logging en BD                                            │
│ └─ Dashboard manual                                         │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│ Fase 2: Escalabilidad (3-6 meses)                           │
│ ├─ Redis para rate limiting                                 │
│ ├─ Webhooks para notificaciones                             │
│ ├─ Dashboard automático                                     │
│ └─ Facturación integrada                                    │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│ Fase 3: Enterprise (6-12 meses)                             │
│ ├─ Multi-región                                             │
│ ├─ CDN para latencia baja                                   │
│ ├─ Analytics avanzado                                       │
│ ├─ SLA garantizado                                          │
│ └─ Soporte 24/7                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## 📈 Métricas y Monitoreo

```
┌─────────────────────────────────────────────────────────────┐
│ Métricas por Cliente                                        │
│ ├─ Total de requests                                        │
│ ├─ Requests exitosos (2xx)                                  │
│ ├─ Requests fallidos (4xx, 5xx)                             │
│ ├─ Tiempo promedio de respuesta                             │
│ ├─ Endpoints más usados                                     │
│ ├─ Errores más comunes                                      │
│ └─ Uso de ancho de banda                                    │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│ Dashboard de Administración                                 │
│ ├─ Uso en tiempo real                                       │
│ ├─ Gráficos de tendencias                                   │
│ ├─ Alertas de límites                                       │
│ ├─ Historial de cambios                                     │
│ ├─ Reportes de facturación                                  │
│ └─ Análisis de fraude                                       │
└─────────────────────────────────────────────────────────────┘
```

---

## 🔗 Integración con Clientes

```
Cliente Backend                    Ownly API
    │                                  │
    │ 1. Obtener API Key               │
    │ (contactar support)              │
    │<─────────────────────────────────│
    │ ownly_xxxxxxxxxxxxx              │
    │                                  │
    │ 2. Guardar en .env               │
    │ OWNLY_API_KEY=ownly_xxxxx        │
    │                                  │
    │ 3. Hacer request                 │
    │ GET /api/identity/ow_MEAYG4B     │
    │ Authorization: Bearer ownly_xxx  │
    ├─────────────────────────────────>│
    │                                  │
    │                                  │ Validar API key
    │                                  │ Verificar permisos
    │                                  │ Buscar usuario
    │                                  │ Log de uso
    │                                  │
    │ {verified: true, ...}            │
    │<─────────────────────────────────┤
    │                                  │
    │ 4. Usar resultado                │
    │ if (data.verified) {             │
    │   // Permitir acceso             │
    │ }                                │
    │                                  │
```

---

## ✨ Conclusión

La arquitectura implementada proporciona:

✅ **Seguridad:** Múltiples capas de protección
✅ **Escalabilidad:** Preparada para crecimiento
✅ **Monetización:** Infraestructura lista
✅ **Auditoría:** Logging completo
✅ **Claridad:** Flujos bien definidos

---

*Diagrama actualizado: 2026-04-27*
