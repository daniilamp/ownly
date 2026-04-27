# Insertar API Key Manualmente en Supabase

## API Key de Prueba Generada

```
API Key: ownly_test_local_545999
Hash: b93960d65b28f708d1c675c62d929d9ae89fff4f321a8817b3909b6aafad9553
```

## Pasos para Insertar en Supabase

1. **Abre Supabase:** https://app.supabase.com
2. **Selecciona tu proyecto**
3. **Ve a:** SQL Editor
4. **Haz clic:** "New Query"
5. **Copia y pega esto:**

```sql
INSERT INTO api_keys (
  client_id,
  client_name,
  key_hash,
  permissions,
  rate_limit,
  status,
  description,
  contact_email
) VALUES (
  'test-local',
  'Test Local',
  'b93960d65b28f708d1c675c62d929d9ae89fff4f321a8817b3909b6aafad9553',
  ARRAY['verify:read'],
  10000,
  'active',
  'API key de prueba local',
  'test@ownly.io'
);
```

6. **Haz clic:** "Run"
7. **Espera a que termine** (debe decir "Success")

## Verificar que se insertó

```sql
SELECT * FROM api_keys WHERE client_id = 'test-local';
```

## Usar la API Key

```bash
curl -X GET "http://localhost:3001/api/identity/ow_MEAYG4B" \
  -H "Authorization: Bearer ownly_test_local_545999"
```

## Resultado Esperado

```json
{
  "verified": false,
  "verification_level": "none",
  "risk_score": "unknown",
  "timestamp": "2026-04-27T...",
  "unique_user": false
}
```

(Retorna false porque no hay usuario con ese Ownly ID en la BD)
