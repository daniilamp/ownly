# 🚀 Guía de Despliegue en Render

## 📋 Checklist de Despliegue

### ✅ Paso 1: Verificar que el código está pusheado

```bash
git status
# Debe mostrar: "nothing to commit, working tree clean"
```

Si hay cambios pendientes:
```bash
git add .
git commit -m "feat: B2B security implementation"
git push origin main
```

---

### ✅ Paso 2: Configurar Variables de Entorno en Render

1. Ve a: https://dashboard.render.com
2. Selecciona tu servicio: **ownly-api**
3. Ve a la pestaña **Environment**
4. Añade las siguientes variables:

#### Variables Públicas (ya en render.yaml)
```
PORT=3001
NODE_ENV=production
FRONTEND_URL=https://ownly-weld.vercel.app
RPC_URL=https://rpc-amoy.polygon.technology
CREDENTIAL_REGISTRY_ADDRESS=0x193f9ad4b82e7211D885eFb913F1741892F430fE
BATCH_PROCESSOR_ADDRESS=0x65ac8030675592aeB9E93994ac35bA48282E98CA
VERIFIER_CONTRACT_ADDRESS=0x7368efd0B81F675B3B392e8534d8A74FA0b0D2A2
ISSUER_PRIVATE_KEY=0xbba7ea7736f54a85328ba00ec42598d00d781bf2918f1adf38414e41d09c3360
SUPABASE_URL=https://jmbqtvmmldxgstabgpwh.supabase.co
SUMSUB_BASE_URL=https://api.sumsub.com
SUMSUB_LEVEL_NAME=idv-and-phone-verification
```

#### Variables Secretas (añadir manualmente)
```
SUPABASE_SERVICE_KEY=<tu_supabase_service_key>
SUMSUB_APP_TOKEN=<tu_sumsub_app_token>
SUMSUB_SECRET_KEY=<tu_sumsub_secret_key>
```

⚠️ **IMPORTANTE**: Marca estas 3 variables como **secretas** (no visibles en logs).

---

### ✅ Paso 3: Hacer Deploy Manual

1. En el dashboard de Render, ve a tu servicio **ownly-api**
2. Click en **Manual Deploy** → **Deploy latest commit**
3. Espera a que el deploy termine (2-3 minutos)

---

### ✅ Paso 4: Verificar que el Backend está funcionando

#### 4.1 Health Check
```bash
curl https://ownly-api.onrender.com/health
```

**Respuesta esperada**:
```json
{
  "status": "ok",
  "timestamp": "2026-04-27T10:30:00.000Z"
}
```

#### 4.2 Test sin API Key (debe fallar)
```bash
curl https://ownly-api.onrender.com/api/identity/test@example.com
```

**Respuesta esperada** (401):
```json
{
  "error": "API key required",
  "code": "MISSING_API_KEY"
}
```

✅ **Si ves este error, significa que la autenticación está funcionando correctamente.**

#### 4.3 Test con API Key (debe funcionar)
```bash
curl -X GET "https://ownly-api.onrender.com/api/identity/test@example.com" \
  -H "Authorization: Bearer ownly_18ab0bc16ca54b7aa170ca0b4092a62e"
```

**Respuesta esperada** (200):
```json
{
  "verified": false,
  "verification_level": "none",
  "risk_score": "unknown",
  "timestamp": "2026-04-27T10:30:00.000Z",
  "unique_user": false
}
```

✅ **Si ves esta respuesta, la API está funcionando correctamente.**

---

### ✅ Paso 5: Verificar Frontend en Vercel

1. Ve a: https://vercel.com/dashboard
2. Verifica que el último deploy de **ownly** esté completado
3. Abre: https://ownly-weld.vercel.app/verify

#### Verificar que:
- ✅ La página carga correctamente
- ✅ El componente `VerificationResult` se muestra (sin JSON)
- ✅ El botón "Verificar usuario" funciona
- ✅ No se expone información sensible en la UI

---

### ✅ Paso 6: Test End-to-End

#### 6.1 Crear un usuario de prueba en Supabase

1. Ve a: https://jmbqtvmmldxgstabgpwh.supabase.co
2. Abre la tabla `kyc_verifications`
3. Inserta un registro de prueba:

```sql
INSERT INTO kyc_verifications (
  user_id,
  email,
  status,
  review_answer,
  created_at
) VALUES (
  'ow_TEST123',
  'test@ownly.io',
  'completed',
  'GREEN',
  NOW()
);
```

#### 6.2 Probar el endpoint con el usuario de prueba

```bash
curl -X GET "https://ownly-api.onrender.com/api/identity/ow_TEST123" \
  -H "Authorization: Bearer ownly_18ab0bc16ca54b7aa170ca0b4092a62e"
```

**Respuesta esperada** (200):
```json
{
  "verified": true,
  "verification_level": "full",
  "risk_score": "low",
  "timestamp": "2026-04-27T10:30:00.000Z",
  "unique_user": true
}
```

✅ **Si ves `"verified": true`, todo está funcionando correctamente.**

---

## 🔍 Troubleshooting

### Problema: "API key required"

**Causa**: No se está enviando el header `Authorization`.

**Solución**:
```bash
# ❌ Incorrecto
curl https://ownly-api.onrender.com/api/identity/test

# ✅ Correcto
curl https://ownly-api.onrender.com/api/identity/test \
  -H "Authorization: Bearer ownly_18ab0bc16ca54b7aa170ca0b4092a62e"
```

---

### Problema: "Invalid or inactive API key"

**Causa**: La API key no está en la base de datos o está inactiva.

**Solución**: Verifica que la API key esté insertada en Supabase:

```sql
SELECT * FROM api_keys WHERE key_hash = encode(sha256('ownly_18ab0bc16ca54b7aa170ca0b4092a62e'::bytea), 'hex');
```

Si no existe, insértala:

```sql
INSERT INTO api_keys (
  key_hash,
  client_id,
  client_name,
  permissions,
  status,
  rate_limit
) VALUES (
  encode(sha256('ownly_18ab0bc16ca54b7aa170ca0b4092a62e'::bytea), 'hex'),
  'test-client',
  'Test Client',
  ARRAY['verify:read', 'verify:write'],
  'active',
  1000
);
```

---

### Problema: "Cannot find module '@supabase/supabase-js'"

**Causa**: Las dependencias no se instalaron correctamente.

**Solución**: En Render, ve a **Settings** → **Build Command** y verifica:
```bash
cd ownly-backend/api && npm install
```

Luego haz un **Manual Deploy**.

---

### Problema: Frontend muestra JSON en lugar de VerificationResult

**Causa**: El componente `VerificationResult` no está importado correctamente.

**Solución**: Verifica en `src/pages/Verify.jsx`:

```javascript
import { VerificationResult } from '../components/VerificationResult';

// En IDMode:
<VerificationResult 
  result={result}
  showDetails={showDetails}
  onToggleDetails={setShowDetails}
/>
```

---

### Problema: "SUPABASE_SERVICE_KEY is not defined"

**Causa**: La variable de entorno no está configurada en Render.

**Solución**:
1. Ve a Render Dashboard → ownly-api → Environment
2. Añade: `SUPABASE_SERVICE_KEY=<tu_supabase_service_key>`
3. Haz un **Manual Deploy**

---

## 📊 Monitoreo

### Logs en Render

1. Ve a: https://dashboard.render.com
2. Selecciona **ownly-api**
3. Ve a la pestaña **Logs**

**Busca**:
- ✅ `Server running on port 3001`
- ✅ `Connected to Supabase`
- ❌ Errores de autenticación
- ❌ Errores de base de datos

### Logs en Vercel

1. Ve a: https://vercel.com/dashboard
2. Selecciona tu proyecto **ownly**
3. Ve a **Deployments** → Click en el último deploy → **Logs**

---

## 🎯 Checklist Final

Antes de notificar a los clientes, verifica:

- [ ] Backend desplegado en Render
- [ ] Frontend desplegado en Vercel
- [ ] Variables de entorno configuradas
- [ ] Health check funciona
- [ ] Endpoint sin API key devuelve 401
- [ ] Endpoint con API key devuelve 200
- [ ] Frontend muestra `VerificationResult` (no JSON)
- [ ] Base de datos tiene tabla `api_keys`
- [ ] API key de prueba insertada en Supabase
- [ ] Test end-to-end exitoso

---

## 🚀 Siguiente Paso

Una vez completado el checklist, puedes:

1. **Notificar a clientes**: Envía `CLIENT_NOTIFICATION_EMAIL.md`
2. **Publicar documentación**: Sube `CLIENT_API_DOCUMENTATION.md` a tu sitio
3. **Monitorear uso**: Revisa logs y métricas en Render/Vercel

---

**¿Problemas?** Revisa los logs en Render y Vercel, o contacta con soporte.
