# Instrucciones de Deployment: Sistema B2B Seguro

## 📋 Pre-requisitos

- Node.js 18+
- Supabase account
- Git
- npm o yarn

---

## 🔧 Paso 1: Preparar Base de Datos

### 1.1 Ejecutar Migraciones

```bash
# Abrir Supabase SQL Editor
# https://app.supabase.com/project/{PROJECT_ID}/sql/new

# Copiar y ejecutar el contenido de:
# ownly-backend/api/database/migration-api-keys.sql
```

**Verificar que se crearon las tablas:**
```sql
SELECT * FROM api_keys LIMIT 1;
SELECT * FROM api_key_usage LIMIT 1;
```

### 1.2 Verificar Permisos

```sql
-- Verificar que los permisos están correctos
SELECT * FROM information_schema.role_table_grants 
WHERE table_name IN ('api_keys', 'api_key_usage');
```

---

## 📦 Paso 2: Actualizar Backend

### 2.1 Descargar Cambios

```bash
cd ownly-backend/api

# Verificar que existen los nuevos archivos:
ls -la src/middleware/authMiddleware.js
ls -la src/services/apiKeyService.js
ls -la src/routes/apiKeys.js
ls -la database/migration-api-keys.sql
```

### 2.2 Instalar Dependencias

```bash
npm install
# No hay nuevas dependencias, pero asegurar que todo está actualizado
```

### 2.3 Verificar Configuración

```bash
# Verificar que .env tiene:
cat .env | grep SUPABASE
```

**Debe contener:**
```
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_SERVICE_KEY=eyJhbGc...
```

### 2.4 Probar Localmente

```bash
npm start

# Esperado:
# Ownly API running on port 3001
```

---

## 🌐 Paso 3: Actualizar Frontend

### 3.1 Copiar Componente

```bash
cd src/components

# Verificar que existe:
ls -la VerificationResult.jsx
```

### 3.2 Actualizar Páginas

**En `src/pages/Verify.jsx`:**

```javascript
// Agregar import
import { VerificationResult } from '@/components/VerificationResult';

// En el componente IDMode, reemplazar la sección de resultado:
// Antes: Mostrar JSON expandible
// Después: Usar <VerificationResult />
```

**Ejemplo:**
```jsx
{result && (
  <VerificationResult 
    result={result}
    showDetails={isAuthenticated}
    onToggleDetails={() => setShowDetails(!showDetails)}
  />
)}
```

### 3.3 Probar Localmente

```bash
npm run dev

# Abrir http://localhost:5173
# Verificar que la UI se ve correcta
```

---

## 🚀 Paso 4: Deployment a Producción

### 4.1 Backend (Railway/Vercel/Heroku)

#### Opción A: Railway

```bash
# Instalar Railway CLI
npm install -g @railway/cli

# Login
railway login

# Crear proyecto
railway init

# Configurar variables de entorno
railway variables set SUPABASE_URL=...
railway variables set SUPABASE_SERVICE_KEY=...

# Deploy
railway up
```

#### Opción B: Vercel

```bash
# Instalar Vercel CLI
npm install -g vercel

# Deploy
vercel --prod

# Configurar variables de entorno en dashboard
```

#### Opción C: Heroku

```bash
# Instalar Heroku CLI
brew tap heroku/brew && brew install heroku

# Login
heroku login

# Crear app
heroku create ownly-api

# Configurar variables
heroku config:set SUPABASE_URL=...
heroku config:set SUPABASE_SERVICE_KEY=...

# Deploy
git push heroku main
```

### 4.2 Frontend (Vercel/Netlify)

#### Opción A: Vercel

```bash
# Deploy automático desde GitHub
# 1. Push a main branch
# 2. Vercel detecta cambios
# 3. Build automático
# 4. Deploy a producción
```

#### Opción B: Netlify

```bash
# Instalar Netlify CLI
npm install -g netlify-cli

# Deploy
netlify deploy --prod
```

---

## ✅ Paso 5: Verificación Post-Deployment

### 5.1 Verificar Backend

```bash
# Health check
curl https://api.ownly.io/health

# Esperado:
# {"status":"ok","version":"1.0.0"}
```

### 5.2 Generar API Key de Prueba

```bash
# Necesitas un JWT token válido primero
# Obtenerlo del login

curl -X POST "https://api.ownly.io/api/api-keys/generate" \
  -H "Authorization: Bearer {JWT_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "clientId": "test-prod",
    "clientName": "Test Production",
    "permissions": ["verify:read"]
  }'

# Guardar el apiKey retornado
```

### 5.3 Probar Verificación

```bash
curl -X GET "https://api.ownly.io/api/identity/ow_MEAYG4B" \
  -H "Authorization: Bearer {API_KEY}"

# Esperado: 200 OK con datos de verificación
```

### 5.4 Verificar Logging

```bash
# En Supabase, verificar que se registran las llamadas
SELECT * FROM api_key_usage ORDER BY created_at DESC LIMIT 10;
```

### 5.5 Probar Frontend

```bash
# Abrir https://ownly.io/verify
# Ingresar un Ownly ID
# Verificar que se muestra la UI limpia (sin JSON)
```

---

## 🔐 Paso 6: Configuración de Seguridad

### 6.1 CORS

**En `ownly-backend/api/src/index.js`:**

```javascript
const allowedOrigins = [
  "https://ownly.io",
  "https://www.ownly.io",
  "https://app.ownly.io",
  "https://dashboard.ownly.io",
  // Agregar otros dominios según sea necesario
];
```

### 6.2 Rate Limiting

**Verificar que está configurado:**

```javascript
// En index.js
const verifyLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  message: { error: "Too many requests" },
});
```

### 6.3 Helmet

**Verificar que está habilitado:**

```javascript
app.use(helmet());
```

### 6.4 Variables de Entorno

**Verificar que NO están en el código:**

```bash
# Buscar credenciales hardcodeadas
grep -r "ownly_" src/ --include="*.js"
grep -r "Bearer " src/ --include="*.js"

# No debe haber resultados
```

---

## 📊 Paso 7: Monitoreo

### 7.1 Configurar Logs

```bash
# En Supabase, crear alertas para:
# - Errores 500
# - Tasa de error > 5%
# - Latencia > 1000ms
```

### 7.2 Configurar Alertas

```bash
# Email: api-support@ownly.io
# Slack: #api-alerts
# PagerDuty: (si aplica)
```

### 7.3 Dashboard de Monitoreo

```bash
# Crear dashboard en:
# - Supabase: Estadísticas de base de datos
# - Vercel/Railway: Logs y métricas
# - Sentry: Error tracking (opcional)
```

---

## 🧪 Paso 8: Testing Final

### 8.1 Test de Autenticación

```bash
# Sin API key (debe fallar)
curl -X GET "https://api.ownly.io/api/identity/ow_MEAYG4B"
# Esperado: 401 Unauthorized

# Con API key inválida (debe fallar)
curl -X GET "https://api.ownly.io/api/identity/ow_MEAYG4B" \
  -H "Authorization: Bearer invalid_key"
# Esperado: 401 Unauthorized

# Con API key válida (debe funcionar)
curl -X GET "https://api.ownly.io/api/identity/ow_MEAYG4B" \
  -H "Authorization: Bearer ownly_xxxxx"
# Esperado: 200 OK
```

### 8.2 Test de Permisos

```bash
# API key sin permisos (debe fallar)
curl -X GET "https://api.ownly.io/api/identity/ow_MEAYG4B" \
  -H "Authorization: Bearer ownly_no_perms"
# Esperado: 403 Forbidden
```

### 8.3 Test de Rate Limiting

```bash
# Hacer 31 requests en 1 minuto
for i in {1..31}; do
  curl -X GET "https://api.ownly.io/api/identity/ow_MEAYG4B" \
    -H "Authorization: Bearer ownly_xxxxx"
done

# El request 31 debe retornar 429 Too Many Requests
```

### 8.4 Test de UI

```bash
# Abrir https://ownly.io/verify
# Verificar:
# - Input para Ownly ID
# - Botón de verificación
# - Resultado sin JSON
# - Detalles expandibles (si autenticado)
# - Aviso de seguridad
```

---

## 🔄 Paso 9: Rollback (si es necesario)

### 9.1 Revertir Backend

```bash
# Si hay problemas críticos
git revert HEAD
git push origin main

# O revertir a versión anterior
git checkout v1.0
git push origin main --force
```

### 9.2 Revertir Base de Datos

```bash
# Si hay problemas con las tablas
DROP TABLE IF EXISTS api_key_usage;
DROP TABLE IF EXISTS api_keys;

# Esto eliminará todos los datos de API keys
# Usar solo en emergencia
```

### 9.3 Contactar Soporte

```
Email: emergency@ownly.io
Teléfono: +1-XXX-XXX-XXXX
Slack: #emergency
```

---

## 📝 Paso 10: Documentación

### 10.1 Actualizar Docs

```bash
# Copiar archivos de documentación
cp B2B_SECURITY_IMPLEMENTATION.md docs/
cp API_MIGRATION_GUIDE.md docs/
cp IMPLEMENTATION_SUMMARY.md docs/
```

### 10.2 Notificar a Clientes

```
Email a clientes:
- Cambios en API
- Cómo obtener API key
- Guía de migración
- Fecha de deprecación de v1.0
```

### 10.3 Actualizar Status Page

```
https://status.ownly.io

Anunciar:
- Nuevo sistema de autenticación
- Cambios en endpoints
- Período de transición
```

---

## ✨ Checklist Final

- [ ] Migraciones ejecutadas
- [ ] Backend actualizado
- [ ] Frontend actualizado
- [ ] Variables de entorno configuradas
- [ ] CORS configurado
- [ ] Rate limiting verificado
- [ ] Helmet habilitado
- [ ] Logs configurados
- [ ] Alertas configuradas
- [ ] Tests pasados
- [ ] Documentación actualizada
- [ ] Clientes notificados
- [ ] Status page actualizado
- [ ] Monitoreo activo
- [ ] Rollback plan listo

---

## 🎉 Deployment Completado

Una vez completados todos los pasos:

1. ✅ Sistema B2B seguro en producción
2. ✅ API privada con autenticación
3. ✅ UI limpia sin JSON expuesto
4. ✅ Auditoría y logging completo
5. ✅ Preparado para monetización
6. ✅ Monitoreo activo

---

## 📞 Soporte

Si encuentras problemas durante el deployment:

- **Email:** deployment-support@ownly.io
- **Slack:** #deployment-help
- **Docs:** https://docs.ownly.io/deployment
- **Status:** https://status.ownly.io
