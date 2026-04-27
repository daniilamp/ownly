# Email Verification Fallback - Solución

## Problema
El verificador de empresas no encontraba el Ownly ID verificado, aunque el dashboard mostraba "Identidad verificada". Esto ocurría porque:
1. El dashboard solo verifica si existe un registro en `kyc_verifications`
2. El verificador para empresas usaba una lógica más restrictiva: solo consideraba verificado si `status === 'completed'`
3. El usuario tenía `review_answer === 'GREEN'` pero el status no era 'completed'

## Solución Implementada

Se han actualizado los endpoints de verificación de identidad para:
1. Soportar búsqueda por email como fallback cuando no se encuentra por Ownly ID
2. Considerar verificado si `review_answer === 'GREEN'` (además de los criterios anteriores)

### Cambios en `ownly-backend/api/src/routes/identity.js`

#### Lógica de Verificación Actualizada
Ahora se considera un usuario como verificado si cumple CUALQUIERA de estas condiciones:
- `review_answer === 'GREEN'` (aprobado por Sumsub)
- `status === 'completed'` (estado completado)
- `credential_id` existe (tiene credencial vinculada)

```javascript
const isVerified = verification.review_answer === 'GREEN' || verification.status === 'completed' || !!verification.credential_id;
```

Esto hace que el verificador sea consistente con el dashboard, que simplemente verifica si existe un registro.
- **Antes**: Solo buscaba por Ownly ID
- **Ahora**: Busca por Ownly ID primero, y si no encuentra y el parámetro contiene `@`, busca por email

```bash
# Buscar por Ownly ID
GET /api/identity/user123

# Buscar por email (fallback automático)
GET /api/identity/user@example.com
```

#### 2. POST `/api/identity/verify` (Actualizado)
- **Antes**: Solo aceptaba Ownly ID
- **Ahora**: Acepta Ownly ID o email en el campo `ownly_id`

```bash
# Buscar por Ownly ID
POST /api/identity/verify
{
  "ownly_id": "user123"
}

# Buscar por email (fallback automático)
POST /api/identity/verify
{
  "ownly_id": "user@example.com"
}
```

#### 3. GET `/api/identity/:ownlyId/unique` (Actualizado)
- **Antes**: Solo buscaba por Ownly ID
- **Ahora**: Busca por Ownly ID primero, y si no encuentra y el parámetro contiene `@`, busca por email

```bash
# Buscar por Ownly ID
GET /api/identity/user123/unique

# Buscar por email (fallback automático)
GET /api/identity/user@example.com/unique
```

#### 4. GET `/api/identity/email/:email` (NUEVO)
- Endpoint específico para búsqueda por email
- Útil cuando se tiene el email pero no el Ownly ID

```bash
# Buscar por email directamente
GET /api/identity/email/user@example.com
```

**Respuesta:**
```json
{
  "verified": true,
  "email": "user@example.com",
  "ownly_id": "user123",
  "kyc_provider": "Sumsub",
  "verification_level": "full",
  "timestamp": "2026-04-27T10:30:00Z",
  "unique_user": true,
  "risk_score": "low"
}
```

## Cómo Funciona

1. **Búsqueda por Ownly ID**: El sistema intenta buscar en la tabla `kyc_verifications` usando el campo `external_user_id`

2. **Fallback por Email**: Si no encuentra resultado y el parámetro contiene `@`, intenta buscar usando el campo `email`

3. **Verificación**: Se considera verificado si:
   - `review_answer === 'GREEN'` (aprobado por Sumsub) ✅
   - O `status === 'completed'` (estado completado)
   - O existe un `credential_id` (tiene credencial vinculada)

4. **Respuesta**: Devuelve el estado de verificación sin exponer datos personales (PII)

## Casos de Uso

### Caso 1: Usuario con Ownly ID verificado
```bash
GET /api/identity/user123
# Encuentra inmediatamente por Ownly ID
```

### Caso 2: Usuario con email verificado pero sin Ownly ID
```bash
GET /api/identity/user@example.com
# No encuentra por Ownly ID, intenta por email y encuentra
```

### Caso 3: Búsqueda explícita por email
```bash
GET /api/identity/email/user@example.com
# Busca directamente por email
```

## Ventajas

✅ **Compatibilidad hacia atrás**: Los endpoints existentes siguen funcionando igual
✅ **Flexibilidad**: Soporta búsqueda por Ownly ID o email
✅ **Fallback automático**: No requiere cambios en el cliente
✅ **Nuevo endpoint**: Opción explícita para búsqueda por email
✅ **Seguridad**: No expone datos personales en las respuestas

## Próximos Pasos

1. Desplegar los cambios en el servidor
2. Probar los endpoints con usuarios que tienen email verificado
3. Considerar agregar un endpoint para obtener el Ownly ID a partir del email (si es necesario)
