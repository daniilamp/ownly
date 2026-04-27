# ✅ Progreso de Setup - Sistema B2B Seguro

## Estado Actual

### ✅ COMPLETADO

#### 1. Base de Datos
- ✅ Archivos de migración creados
- ⏳ **PENDIENTE:** Ejecutar SQL en Supabase

**Instrucciones:**
1. Abre: https://app.supabase.com
2. Ve a: SQL Editor → New Query
3. Copia y pega el SQL de `migration-api-keys.sql`
4. Haz clic: Run

#### 2. Backend
- ✅ Archivos creados:
  - `ownly-backend/api/src/middleware/authMiddleware.js`
  - `ownly-backend/api/src/services/apiKeyService.js`
  - `ownly-backend/api/src/routes/apiKeys.js`
- ✅ Archivos modificados:
  - `ownly-backend/api/src/routes/identity.js`
  - `ownly-backend/api/src/index.js`
- ✅ npm install completado
- ✅ Servidor iniciado en puerto 3001
- ✅ Health check funcionando

**Estado:** LISTO

#### 3. API Key de Prueba
- ✅ Generada: `ownly_test_local_545999`
- ✅ Hash: `b93960d65b28f708d1c675c62d929d9ae89fff4f321a8817b3909b6aafad9553`
- ⏳ **PENDIENTE:** Insertar en Supabase

**Instrucciones:**
Ver archivo: `SETUP_API_KEY_MANUAL.md`

#### 4. Frontend
- ✅ Componente creado: `src/components/VerificationResult.jsx`
- ⏳ **PENDIENTE:** Importar en `src/pages/Verify.jsx`

---

## 📋 PRÓXIMOS PASOS (En Orden)

### PASO 1: Insertar API Key en Supabase (2 min)

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

### PASO 2: Probar Endpoint (1 min)

```bash
curl -X GET "http://localhost:3001/api/identity/ow_MEAYG4B" \
  -H "Authorization: Bearer ownly_test_local_545999"
```

**Esperado:**
```json
{
  "verified": false,
  "verification_level": "none",
  "risk_score": "unknown",
  "timestamp": "2026-04-27T...",
  "unique_user": false
}
```

### PASO 3: Actualizar Frontend (3 min)

En `src/pages/Verify.jsx`, agregar:

```javascript
import { VerificationResult } from '@/components/VerificationResult';
```

Y reemplazar la sección de resultado con:

```jsx
{result && (
  <VerificationResult 
    result={result}
    showDetails={isAuthenticated}
    onToggleDetails={() => setShowDetails(!showDetails)}
  />
)}
```

### PASO 4: Probar Frontend (2 min)

```bash
npm run dev
# Abrir http://localhost:5173/verify
# Ingresar un Ownly ID
# Verificar que se muestra la UI limpia
```

### PASO 5: Desplegar a Producción (10 min)

**Opción A: Railway (Recomendado)**

```bash
npm install -g @railway/cli
railway login
cd ownly-backend/api
railway up
```

**Opción B: Vercel**

```bash
# Push a main branch
# Vercel detecta cambios automáticamente
# Deploy automático
```

### PASO 6: Verificar en Producción (2 min)

```bash
curl -X GET "https://api.ownly.io/health"
curl -X GET "https://api.ownly.io/api/identity/ow_MEAYG4B" \
  -H "Authorization: Bearer ownly_test_local_545999"
```

### PASO 7: Notificar a Clientes (5 min)

Enviar email con:
- Cambios en API
- Cómo obtener API key
- Guía de migración
- Fecha de deprecación de v1.0

---

## 🔧 Información Técnica

### Servidor Backend
- **URL Local:** http://localhost:3001
- **Status:** ✅ Corriendo
- **Health Check:** http://localhost:3001/health

### Base de Datos
- **Proveedor:** Supabase
- **URL:** https://jmbqtvmmldxgstabgpwh.supabase.co
- **Tablas Creadas:** api_keys, api_key_usage

### API Key de Prueba
- **Key:** ownly_test_local_545999
- **Hash:** b93960d65b28f708d1c675c62d929d9ae89fff4f321a8817b3909b6aafad9553
- **Permisos:** verify:read
- **Rate Limit:** 10,000 requests/mes

---

## 📊 Checklist Final

- [ ] Ejecutar SQL en Supabase
- [ ] Verificar que tablas se crearon
- [ ] Insertar API key en Supabase
- [ ] Probar endpoint con API key
- [ ] Actualizar frontend
- [ ] Probar frontend localmente
- [ ] Desplegar a producción
- [ ] Verificar en producción
- [ ] Notificar a clientes

---

## 🆘 Problemas Comunes

### Error: "API key required"
```
Solución: Incluir header Authorization
curl -H "Authorization: Bearer ownly_test_local_545999"
```

### Error: "Invalid API key"
```
Solución: Verificar que la API key está en Supabase
SELECT * FROM api_keys WHERE client_id = 'test-local';
```

### Error: "Permission denied"
```
Solución: Verificar que el permiso 'verify:read' está en la API key
```

---

## 📞 Soporte

- **Email:** api-support@ownly.io
- **Docs:** https://docs.ownly.io
- **Emergencia:** emergency@ownly.io

---

**Última actualización:** 2026-04-27
**Estado:** En progreso - Paso 1 pendiente
