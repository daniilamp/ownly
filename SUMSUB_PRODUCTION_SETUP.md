# Configuración de Sumsub en Producción

## Estado Actual
- ✅ Modo sandbox configurado (para testing)
- ⏳ Modo producción pendiente de configurar

## Credenciales Actuales (Sandbox)
```
SUMSUB_APP_TOKEN=sbx:YZusfUx6nmgYQnE2VRrhrr75.ws6i16CesJSzfBJWuVCing7Dq6pd0Lj1
SUMSUB_SECRET_KEY=7YAX8ceFgucRX6lZGxBixjgqiQdE3VIK
SUMSUB_BASE_URL=https://api.sumsub.com
SUMSUB_LEVEL_NAME=idv-and-phone-verification
```

## Pasos para Activar Producción

### 1. Obtener Credenciales de Producción

1. **Accede a Sumsub Dashboard**
   - URL: https://cockpit.sumsub.com/
   - Inicia sesión con tu cuenta

2. **Cambia a Entorno de Producción**
   - En el dashboard, busca el selector de entorno (esquina superior derecha)
   - Cambia de "Sandbox" → "Production"
   
   **Nota:** Si no tienes acceso a producción:
   - Completa la verificación de tu empresa en Sumsub
   - Contacta a soporte: support@sumsub.com
   - Solicita activación de cuenta de producción

3. **Genera API Keys de Producción**
   - Ve a: **Settings** → **Developers** → **API Keys**
   - Click en "Create new token"
   - Selecciona los permisos necesarios:
     - ✓ Create applicants
     - ✓ Get applicant data
     - ✓ Get applicant status
     - ✓ Generate SDK tokens
   - Guarda estos valores:
     - `App Token` (empieza con `prd:` en producción)
     - `Secret Key`

4. **Verifica el Nivel de Verificación**
   - Ve a: **Settings** → **Levels**
   - Verifica que existe: `idv-and-phone-verification`
   - O crea uno nuevo con:
     - Document verification (ID, Passport, Driver License)
     - Liveness check
     - Phone verification (opcional)

### 2. Actualizar Variables de Entorno

**Archivo:** `ownly-backend/api/.env`

Reemplaza las credenciales sandbox con las de producción:

```bash
# Sumsub KYC - PRODUCTION
SUMSUB_APP_TOKEN=prd:TU_TOKEN_DE_PRODUCCION_AQUI
SUMSUB_SECRET_KEY=TU_SECRET_KEY_DE_PRODUCCION_AQUI
SUMSUB_BASE_URL=https://api.sumsub.com
SUMSUB_LEVEL_NAME=idv-and-phone-verification
```

### 3. Configurar Webhook (Importante)

Para que las verificaciones se procesen automáticamente:

1. **En Sumsub Dashboard**
   - Ve a: **Settings** → **Webhooks**
   - Click en "Add webhook"

2. **Configura el webhook**
   - **URL:** `https://ownly-api.onrender.com/api/kyc/webhook`
   - **Events:** Selecciona:
     - ✓ `applicantReviewed` (cuando se completa la revisión)
     - ✓ `applicantPending` (opcional)
   - **Secret:** Genera un secret y guárdalo

3. **Actualiza el .env con el webhook secret**
   ```bash
   SUMSUB_WEBHOOK_SECRET=tu_webhook_secret_aqui
   ```

### 4. Reiniciar el Backend

**En Render.com:**
1. Ve a tu dashboard de Render
2. Selecciona el servicio `ownly-api`
3. Ve a "Environment" → "Environment Variables"
4. Actualiza las variables:
   - `SUMSUB_APP_TOKEN`
   - `SUMSUB_SECRET_KEY`
   - `SUMSUB_WEBHOOK_SECRET` (nuevo)
5. Click en "Save Changes"
6. El servicio se reiniciará automáticamente

**En local:**
```bash
cd ownly-backend/api
# Actualiza el archivo .env con las nuevas credenciales
# Reinicia el servidor
npm run dev
```

### 5. Probar la Integración

1. **Accede a tu app**
   - URL: https://ownly-weld.vercel.app/kyc

2. **Inicia el proceso KYC**
   - Completa el formulario de datos personales
   - Deberías ver la interfaz REAL de Sumsub (no el botón de simulación)

3. **Completa la verificación**
   - Sube tu documento de identidad
   - Completa el liveness check (selfie)
   - Espera la revisión (puede tardar minutos u horas)

4. **Verifica el webhook**
   - Cuando Sumsub apruebe la verificación, el webhook creará automáticamente:
     - ✓ Credencial en la base de datos
     - ✓ Publicación en blockchain
   - Verifica en: https://ownly-weld.vercel.app/credentials

## Diferencias: Sandbox vs Producción

| Característica | Sandbox | Producción |
|---------------|---------|------------|
| Token prefix | `sbx:` | `prd:` |
| Verificación | Instantánea (mock) | Real (minutos/horas) |
| Documentos | Cualquier imagen | Documentos reales |
| Liveness | Simulado | Detección real |
| Costo | Gratis | Por verificación |
| Webhook | Opcional | Recomendado |

## Costos de Sumsub (Referencia)

- **Verificación básica:** ~$1-3 USD por verificación
- **Liveness check:** Incluido
- **Verificación de teléfono:** Adicional
- **Volumen alto:** Descuentos disponibles

Contacta a Sumsub para pricing exacto: sales@sumsub.com

## Troubleshooting

### Error: "Invalid signature"
- Verifica que `SUMSUB_SECRET_KEY` sea correcto
- Asegúrate de usar credenciales de producción (no sandbox)

### Error: "Level not found"
- Verifica que `SUMSUB_LEVEL_NAME` existe en tu cuenta de producción
- Los niveles de sandbox NO existen en producción

### Webhook no funciona
- Verifica que la URL sea accesible públicamente
- Verifica que el secret del webhook coincida con el .env
- Revisa los logs en Sumsub Dashboard → Webhooks → Logs

### Sigue en modo mock
- Verifica que las credenciales estén actualizadas en Render
- Reinicia el servicio en Render
- Verifica los logs del backend para ver errores de Sumsub

## Verificar que Funciona

**Logs del backend deberían mostrar:**

```
✅ Modo producción:
Real Sumsub applicant created: 65f8a9b2c3d4e5f6g7h8i9j0

❌ Modo sandbox/mock:
Sumsub failed, using mock mode: Invalid credentials
Creating mock KYC applicant for: user_123
```

## Soporte

- **Sumsub Support:** support@sumsub.com
- **Documentación:** https://docs.sumsub.com/
- **Dashboard:** https://cockpit.sumsub.com/

## Checklist de Activación

- [ ] Cuenta de Sumsub verificada
- [ ] Acceso a entorno de producción activado
- [ ] API Keys de producción generadas
- [ ] Nivel de verificación configurado
- [ ] Variables de entorno actualizadas en Render
- [ ] Webhook configurado en Sumsub
- [ ] Backend reiniciado
- [ ] Prueba de verificación real completada
- [ ] Webhook recibido y credencial creada

