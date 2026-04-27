# Spec: Integración de Sumsub KYC

## Metadata
- **Status**: draft
- **Owner**: Dani
- **Created**: 2026-04-22
- **Priority**: high
- **Estimated effort**: 2-3 semanas

---

## 1. Objetivo

Integrar Sumsub como proveedor KYC para validar documentos de identidad reales antes de emitir credenciales en blockchain. Esto permitirá que Ownly emita credenciales verificadas con valor legal.

---

## 2. Contexto

### Estado actual
- El Issuer Dashboard permite subir lotes de credenciales en JSON
- Las credenciales se publican en blockchain sin validación previa
- No hay forma de verificar que los datos sean reales

### Problema
- Las credenciales actuales son solo datos de prueba
- No tienen valor legal ni confianza
- Cualquiera puede crear credenciales falsas

### Solución
- Integrar Sumsub para validar documentos (DNI, pasaporte, carnet)
- Solo emitir credenciales blockchain después de validación KYC exitosa
- Crear flujo completo: Usuario → KYC → Credencial verificada

---

## 3. Alcance

### ✅ Incluido en este spec
1. Configuración de cuenta Sumsub (sandbox)
2. Backend: API endpoints para iniciar/verificar KYC
3. Frontend: Flujo de usuario para subir documentos
4. Integración con Issuer Dashboard
5. Almacenamiento de resultados KYC
6. Emisión automática de credenciales tras KYC exitoso

### ❌ Fuera de alcance
- Migración a producción de Sumsub (se hará después)
- Integración con otros proveedores KYC
- Dashboard de administración de verificaciones
- Webhooks avanzados de Sumsub

---

## 4. Requisitos Funcionales

### RF1: Configuración de Sumsub
- [ ] Crear cuenta en Sumsub (sandbox)
- [ ] Obtener API keys (App Token, Secret Key)
- [ ] Configurar nivel de verificación (basic-kyc-level)
- [ ] Configurar tipos de documentos aceptados (DNI, pasaporte, carnet)

### RF2: Backend - API de KYC
- [ ] Endpoint: `POST /api/kyc/init` - Iniciar verificación
  - Input: `{ userId, email, firstName, lastName }`
  - Output: `{ applicantId, sdkToken, externalUserId }`
- [ ] Endpoint: `POST /api/kyc/status` - Consultar estado
  - Input: `{ applicantId }`
  - Output: `{ status, reviewResult, documentData }`
- [ ] Endpoint: `POST /api/kyc/webhook` - Recibir notificaciones
  - Sumsub notifica cambios de estado
  - Trigger automático de emisión de credencial

### RF3: Frontend - Flujo de usuario
- [ ] Nueva página: `/kyc` - Verificación de identidad
- [ ] Integrar Sumsub Web SDK
- [ ] Flujo paso a paso:
  1. Usuario ingresa datos personales
  2. Sube foto de documento (DNI/pasaporte)
  3. Toma selfie para liveness check
  4. Espera revisión (automática o manual)
  5. Recibe credencial si aprobado

### RF4: Integración con Issuer
- [ ] Modificar Issuer Dashboard para usar datos de KYC
- [ ] Crear credenciales automáticamente tras KYC aprobado
- [ ] Almacenar mapping: `applicantId → credentialHash`

### RF5: Almacenamiento
- [ ] Base de datos para KYC results (SQLite/PostgreSQL)
- [ ] Tabla: `kyc_verifications`
  - `id`, `applicantId`, `userId`, `status`, `documentType`, `documentNumber`, `firstName`, `lastName`, `birthDate`, `expiryDate`, `createdAt`, `approvedAt`
- [ ] Tabla: `credentials`
  - `id`, `kycId`, `commitmentHash`, `merkleRoot`, `batchId`, `txHash`, `createdAt`

---

## 5. Requisitos No Funcionales

### RNF1: Seguridad
- API keys de Sumsub en variables de entorno
- Validar firma de webhooks de Sumsub
- Encriptar datos sensibles en base de datos
- HTTPS obligatorio para todos los endpoints

### RNF2: Privacidad (GDPR)
- Almacenar solo datos mínimos necesarios
- No guardar imágenes de documentos (solo en Sumsub)
- Permitir eliminación de datos (derecho al olvido)
- Consentimiento explícito del usuario

### RNF3: Performance
- Tiempo de verificación: < 5 minutos (automática)
- Tiempo de verificación: < 24 horas (manual)
- API response time: < 2 segundos

### RNF4: Costos
- Usar sandbox de Sumsub (gratis) para desarrollo
- Estimar costos de producción: ~100-500€/mes según volumen
- Alternativa: Stripe Identity (~1-2€/verificación)

---

## 6. Arquitectura Técnica

### Stack
- **KYC Provider**: Sumsub (sandbox)
- **Backend**: Node.js + Express (ya existente)
- **Frontend**: React + Vite (ya existente)
- **Database**: PostgreSQL (nuevo - usar Supabase free tier)
- **SDK**: @sumsub/websdk (npm package)

### Flujo de datos

```
┌─────────────┐
│   Usuario   │
└──────┬──────┘
       │ 1. Inicia KYC
       ↓
┌─────────────────────────────────────────┐
│  Frontend (/kyc)                        │
│  - Formulario datos personales          │
│  - Sumsub Web SDK (upload docs)         │
└──────┬──────────────────────────────────┘
       │ 2. POST /api/kyc/init
       ↓
┌─────────────────────────────────────────┐
│  Backend API                            │
│  - Crea applicant en Sumsub             │
│  - Genera SDK token                     │
│  - Guarda en DB (pending)               │
└──────┬──────────────────────────────────┘
       │ 3. SDK token
       ↓
┌─────────────────────────────────────────┐
│  Sumsub Platform                        │
│  - Usuario sube documentos              │
│  - Liveness check (selfie)              │
│  - Revisión automática/manual           │
└──────┬──────────────────────────────────┘
       │ 4. Webhook: applicantReviewed
       ↓
┌─────────────────────────────────────────┐
│  Backend /api/kyc/webhook               │
│  - Valida firma                         │
│  - Actualiza DB (approved/rejected)     │
│  - Si approved: genera credencial       │
└──────┬──────────────────────────────────┘
       │ 5. Genera commitment
       ↓
┌─────────────────────────────────────────┐
│  Blockchain (Polygon Amoy)              │
│  - Publica credencial en batch          │
│  - Retorna txHash                       │
└──────┬──────────────────────────────────┘
       │ 6. Credencial lista
       ↓
┌─────────────────────────────────────────┐
│  Usuario recibe notificación            │
│  - Email: "Tu identidad fue verificada" │
│  - Puede ver credencial en /credentials │
└─────────────────────────────────────────┘
```

---

## 7. Diseño de API

### POST /api/kyc/init
Inicia una verificación KYC para un usuario.

**Request**:
```json
{
  "userId": "user_123",
  "email": "juan@example.com",
  "firstName": "Juan",
  "lastName": "Pérez García"
}
```

**Response**:
```json
{
  "success": true,
  "applicantId": "66a1234567890abcdef12345",
  "sdkToken": "sbx:...",
  "externalUserId": "user_123"
}
```

### GET /api/kyc/status/:applicantId
Consulta el estado de una verificación.

**Response**:
```json
{
  "success": true,
  "status": "completed",
  "reviewResult": {
    "reviewAnswer": "GREEN",
    "rejectLabels": [],
    "reviewRejectType": null
  },
  "documentData": {
    "type": "ID_CARD",
    "number": "12345678A",
    "firstName": "Juan",
    "lastName": "Pérez García",
    "dob": "1990-05-15",
    "expiryDate": "2030-05-15",
    "country": "ESP"
  }
}
```

### POST /api/kyc/webhook
Recibe notificaciones de Sumsub (interno).

**Request** (enviado por Sumsub):
```json
{
  "applicantId": "66a1234567890abcdef12345",
  "inspectionId": "66a1234567890abcdef12346",
  "correlationId": "req_123",
  "externalUserId": "user_123",
  "type": "applicantReviewed",
  "reviewResult": {
    "reviewAnswer": "GREEN"
  },
  "reviewStatus": "completed",
  "createdAt": "2026-04-22T10:00:00Z"
}
```

---

## 8. Diseño de Frontend

### Nueva página: /kyc

**Layout**:
```
┌─────────────────────────────────────────┐
│  OWNLY - Verificación de Identidad     │
├─────────────────────────────────────────┤
│                                         │
│  [Paso 1/3] Datos Personales           │
│                                         │
│  Nombre:     [___________]              │
│  Apellidos:  [___________]              │
│  Email:      [___________]              │
│                                         │
│  [Continuar →]                          │
│                                         │
├─────────────────────────────────────────┤
│  🔒 Tus datos están protegidos          │
│  Solo se usan para verificación KYC     │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│  [Paso 2/3] Subir Documento             │
│                                         │
│  [Sumsub Web SDK integrado aquí]       │
│  - Selecciona tipo (DNI/Pasaporte)     │
│  - Sube foto frontal                    │
│  - Sube foto trasera (si DNI)           │
│  - Toma selfie (liveness check)         │
│                                         │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│  [Paso 3/3] Verificación en Proceso     │
│                                         │
│  ⏳ Estamos verificando tu identidad... │
│                                         │
│  Esto puede tomar unos minutos.         │
│  Te notificaremos por email.            │
│                                         │
│  [Ver estado]                           │
└─────────────────────────────────────────┘
```

### Componentes nuevos
- `src/pages/KYC.jsx` - Página principal
- `src/components/kyc/PersonalDataForm.jsx` - Formulario paso 1
- `src/components/kyc/SumsubSDK.jsx` - Wrapper del SDK
- `src/components/kyc/VerificationStatus.jsx` - Estado de verificación
- `src/hooks/useKYC.js` - Hook para API calls

---

## 9. Base de Datos

### Opción recomendada: Supabase (PostgreSQL)
- Free tier: 500 MB, 2 GB bandwidth
- Incluye Auth, Storage, Realtime
- Fácil integración con Node.js

### Schema

```sql
-- Tabla de verificaciones KYC
CREATE TABLE kyc_verifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  applicant_id VARCHAR(255) UNIQUE NOT NULL,
  external_user_id VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  first_name VARCHAR(255),
  last_name VARCHAR(255),
  status VARCHAR(50) NOT NULL, -- pending, completed, rejected
  review_answer VARCHAR(50), -- GREEN, RED, YELLOW
  document_type VARCHAR(50), -- ID_CARD, PASSPORT, DRIVERS
  document_number VARCHAR(100),
  date_of_birth DATE,
  expiry_date DATE,
  country VARCHAR(3),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  approved_at TIMESTAMP
);

-- Tabla de credenciales emitidas
CREATE TABLE credentials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  kyc_id UUID REFERENCES kyc_verifications(id),
  commitment_hash VARCHAR(66) NOT NULL,
  merkle_root VARCHAR(66),
  batch_id INTEGER,
  tx_hash VARCHAR(66),
  credential_type VARCHAR(50), -- dni, passport, driving_license
  issued_to VARCHAR(255), -- user email or wallet
  created_at TIMESTAMP DEFAULT NOW()
);

-- Índices
CREATE INDEX idx_kyc_applicant ON kyc_verifications(applicant_id);
CREATE INDEX idx_kyc_user ON kyc_verifications(external_user_id);
CREATE INDEX idx_kyc_status ON kyc_verifications(status);
CREATE INDEX idx_cred_kyc ON credentials(kyc_id);
```

---

## 10. Plan de Implementación

### Sprint 1: Setup y Backend (Semana 1)
**Tareas**:
1. Crear cuenta Sumsub sandbox
2. Configurar nivel de verificación
3. Instalar dependencias: `@sumsub/websdk`, `pg`, `@supabase/supabase-js`
4. Crear base de datos en Supabase
5. Implementar `/api/kyc/init` endpoint
6. Implementar `/api/kyc/status` endpoint
7. Implementar `/api/kyc/webhook` endpoint
8. Testing con Postman

**Entregables**:
- [ ] Cuenta Sumsub configurada
- [ ] Base de datos creada
- [ ] 3 endpoints funcionando
- [ ] Documentación de API

### Sprint 2: Frontend (Semana 2)
**Tareas**:
1. Crear página `/kyc`
2. Implementar formulario de datos personales
3. Integrar Sumsub Web SDK
4. Crear componente de estado de verificación
5. Implementar hook `useKYC`
6. Conectar con backend
7. Testing end-to-end

**Entregables**:
- [ ] Página KYC funcional
- [ ] Flujo completo usuario → Sumsub → backend
- [ ] UI/UX pulida

### Sprint 3: Integración con Blockchain (Semana 3)
**Tareas**:
1. Modificar webhook para generar credenciales
2. Conectar con Issuer Dashboard
3. Publicar credenciales en blockchain automáticamente
4. Notificar usuario por email
5. Mostrar credenciales en `/credentials`
6. Testing completo

**Entregables**:
- [ ] Credenciales se emiten automáticamente tras KYC
- [ ] Usuario recibe notificación
- [ ] Credencial visible en dashboard

---

## 11. Testing

### Test Cases

#### TC1: Verificación exitosa
1. Usuario inicia KYC con datos válidos
2. Sube DNI español válido
3. Completa liveness check
4. Sumsub aprueba automáticamente (GREEN)
5. Backend recibe webhook
6. Credencial se publica en blockchain
7. Usuario ve credencial en `/credentials`

**Expected**: ✅ Credencial emitida con txHash

#### TC2: Verificación rechazada
1. Usuario sube documento borroso
2. Sumsub rechaza (RED)
3. Backend recibe webhook
4. Usuario ve mensaje de rechazo
5. Puede reintentar

**Expected**: ❌ No se emite credencial

#### TC3: Verificación pendiente manual
1. Usuario sube documento que requiere revisión manual
2. Sumsub marca como YELLOW (pending)
3. Usuario ve "En revisión manual"
4. Después de 24h, Sumsub aprueba
5. Credencial se emite

**Expected**: ⏳ → ✅ Credencial emitida tras aprobación

---

## 12. Costos Estimados

### Sumsub Pricing (producción)
- **Starter**: 100€/mes - 100 verificaciones/mes
- **Growth**: 300€/mes - 500 verificaciones/mes
- **Business**: 500€/mes - 1000 verificaciones/mes
- **Enterprise**: Custom pricing

### Alternativa: Stripe Identity
- Pay-per-verification: ~1.50€/verificación
- Sin cuota mensual
- Más simple pero menos features

### Supabase
- Free tier: Suficiente para MVP
- Pro: 25€/mes (si necesitas más)

### Total estimado (MVP)
- Sumsub sandbox: **GRATIS**
- Supabase free: **GRATIS**
- Polygon Amoy gas: **GRATIS** (testnet)

**Total: 0€/mes durante desarrollo** 🎉

---

## 13. Riesgos y Mitigaciones

| Riesgo | Probabilidad | Impacto | Mitigación |
|--------|--------------|---------|------------|
| Sumsub rechaza muchas verificaciones | Media | Alto | Configurar nivel de verificación más permisivo en sandbox |
| Webhook no llega | Baja | Alto | Implementar polling como fallback |
| Costos de producción altos | Media | Medio | Evaluar Stripe Identity como alternativa |
| GDPR compliance issues | Baja | Alto | Consultar con abogado, implementar derecho al olvido |
| Sumsub downtime | Baja | Medio | Mostrar mensaje de error amigable, reintentar |

---

## 14. Métricas de Éxito

- [ ] 90%+ de verificaciones automáticas (sin revisión manual)
- [ ] < 5 minutos tiempo promedio de verificación
- [ ] 0 errores en emisión de credenciales
- [ ] 100% de webhooks procesados correctamente
- [ ] 0 quejas de privacidad/GDPR

---

## 15. Documentación

### Para desarrolladores
- [ ] README de integración Sumsub
- [ ] Guía de setup de Supabase
- [ ] Documentación de API endpoints
- [ ] Ejemplos de uso del SDK

### Para usuarios
- [ ] FAQ: "¿Por qué necesito verificar mi identidad?"
- [ ] Guía: "Cómo tomar una buena foto de tu DNI"
- [ ] Política de privacidad actualizada

---

## 16. Próximos Pasos (Post-MVP)

1. **Migrar a producción**
   - Activar cuenta Sumsub producción
   - Migrar a Polygon mainnet
   - Configurar dominio custom

2. **Features adicionales**
   - Verificación de dirección (proof of address)
   - Verificación de teléfono (SMS)
   - Soporte para más tipos de documentos

3. **Dashboard de administración**
   - Ver todas las verificaciones
   - Revisar casos pendientes
   - Estadísticas y analytics

4. **Integraciones**
   - Notificaciones por email (SendGrid)
   - Notificaciones push (Firebase)
   - Webhooks para terceros

---

## 17. Referencias

- [Sumsub Documentation](https://developers.sumsub.com/)
- [Sumsub Web SDK](https://developers.sumsub.com/msdk/web-sdk/)
- [Sumsub Webhooks](https://developers.sumsub.com/api-reference/#webhooks)
- [Supabase Docs](https://supabase.com/docs)
- [Stripe Identity](https://stripe.com/docs/identity)

---

## Aprobaciones

- [ ] **Dani** (Owner) - Revisar y aprobar spec
- [ ] **Kiro** (AI Agent) - Listo para implementar

---

**Última actualización**: 2026-04-22
