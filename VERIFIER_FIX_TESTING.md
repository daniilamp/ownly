# Testing del Verificador de Empresas - Fix

## Cambios Realizados

Se han actualizado los endpoints de verificación para:
1. Considerar verificado si `review_answer === 'GREEN'` (además de otros criterios)
2. Soportar búsqueda por email como fallback

## Cómo Probar

### 1. Verificar por Ownly ID (ow_MEAYG4B)

```bash
# GET request
curl -X GET "http://localhost:3001/api/identity/ow_MEAYG4B"

# Respuesta esperada (si review_answer === 'GREEN'):
{
  "verified": true,
  "ownly_id": "ow_MEAYG4B",
  "kyc_provider": "Sumsub",
  "verification_level": "full",
  "timestamp": "2026-04-27T...",
  "unique_user": true,
  "risk_score": "low"
}
```

### 2. Verificar por Email

```bash
# GET request
curl -X GET "http://localhost:3001/api/identity/email/user@example.com"

# Respuesta esperada:
{
  "verified": true,
  "email": "user@example.com",
  "ownly_id": "ow_MEAYG4B",
  "kyc_provider": "Sumsub",
  "verification_level": "full",
  "timestamp": "2026-04-27T...",
  "unique_user": true,
  "risk_score": "low"
}
```

### 3. POST /api/identity/verify

```bash
# POST request
curl -X POST "http://localhost:3001/api/identity/verify" \
  -H "Content-Type: application/json" \
  -d '{"ownly_id": "ow_MEAYG4B"}'

# Respuesta esperada:
{
  "verified": true,
  "ownly_id": "ow_MEAYG4B",
  "kyc_provider": "Sumsub",
  "verification_level": "full",
  "timestamp": "2026-04-27T...",
  "approved_at": "2026-04-27T...",
  "unique_user": true,
  "risk_score": "low",
  "can_trade": true
}
```

### 4. Verificar Unicidad

```bash
# GET request
curl -X GET "http://localhost:3001/api/identity/ow_MEAYG4B/unique"

# Respuesta esperada:
{
  "ownly_id": "ow_MEAYG4B",
  "is_unique": true,
  "verified": true
}
```

## Lógica de Verificación

Un usuario se considera verificado si cumple CUALQUIERA de estas condiciones:

```javascript
verification.review_answer === 'GREEN'  // ✅ Aprobado por Sumsub
|| verification.status === 'completed'   // ✅ Estado completado
|| !!verification.credential_id          // ✅ Tiene credencial vinculada
```

## Casos de Uso

### Caso 1: Usuario con review_answer = 'GREEN'
- Dashboard: ✅ Muestra "Identidad verificada"
- Verificador: ✅ Ahora también muestra verificado

### Caso 2: Usuario con status = 'completed'
- Dashboard: ✅ Muestra "Identidad verificada"
- Verificador: ✅ Muestra verificado

### Caso 3: Usuario con credential_id
- Dashboard: ✅ Muestra "Identidad verificada"
- Verificador: ✅ Muestra verificado

## Próximos Pasos

1. Desplegar los cambios en el servidor
2. Probar con el Ownly ID `ow_MEAYG4B`
3. Verificar que el verificador ahora muestra "VERIFICADO" en lugar de "NO VERIFICADO"
4. Confirmar que el dashboard y el verificador son consistentes
