# Guía de Migración: API Pública → API Privada

## ⚠️ Cambios Importantes

A partir de la versión 2.0, la API de verificación requiere autenticación.

### Antes (v1.0)
```bash
# ❌ Acceso público sin autenticación
GET /api/identity/ow_MEAYG4B
```

### Ahora (v2.0)
```bash
# ✅ Requiere API Key
GET /api/identity/ow_MEAYG4B
Authorization: Bearer ownly_xxxxx
```

---

## Paso 1: Obtener API Key

### Para Clientes Existentes

1. Contacta a: api-support@ownly.io
2. Proporciona:
   - Nombre de tu empresa
   - Caso de uso (prop firm, broker, exchange, etc.)
   - Volumen estimado de verificaciones/mes
   - Email de contacto técnico

3. Recibirás:
   - API Key (ej: `ownly_xxxxxxxxxxxxx`)
   - Documentación personalizada
   - Soporte técnico

---

## Paso 2: Actualizar Integración

### JavaScript/Node.js

**Antes:**
```javascript
const response = await fetch('https://api.ownly.io/api/identity/ow_MEAYG4B');
const data = await response.json();
```

**Ahora:**
```javascript
const API_KEY = process.env.OWNLY_API_KEY; // ownly_xxxxx

const response = await fetch('https://api.ownly.io/api/identity/ow_MEAYG4B', {
  headers: {
    'Authorization': `Bearer ${API_KEY}`
  }
});

if (!response.ok) {
  if (response.status === 401) {
    throw new Error('API key inválida o expirada');
  }
  throw new Error(`Error: ${response.status}`);
}

const data = await response.json();
```

### Python

**Antes:**
```python
import requests

response = requests.get('https://api.ownly.io/api/identity/ow_MEAYG4B')
data = response.json()
```

**Ahora:**
```python
import requests
import os

API_KEY = os.getenv('OWNLY_API_KEY')  # ownly_xxxxx

headers = {
    'Authorization': f'Bearer {API_KEY}'
}

response = requests.get(
    'https://api.ownly.io/api/identity/ow_MEAYG4B',
    headers=headers
)

if response.status_code == 401:
    raise Exception('API key inválida o expirada')

data = response.json()
```

### cURL

**Antes:**
```bash
curl https://api.ownly.io/api/identity/ow_MEAYG4B
```

**Ahora:**
```bash
curl https://api.ownly.io/api/identity/ow_MEAYG4B \
  -H "Authorization: Bearer ownly_xxxxx"
```

### Go

**Antes:**
```go
resp, _ := http.Get("https://api.ownly.io/api/identity/ow_MEAYG4B")
```

**Ahora:**
```go
client := &http.Client{}
req, _ := http.NewRequest("GET", "https://api.ownly.io/api/identity/ow_MEAYG4B", nil)
req.Header.Add("Authorization", "Bearer ownly_xxxxx")
resp, _ := client.Do(req)
```

---

## Paso 3: Configurar Variables de Entorno

### .env
```bash
OWNLY_API_KEY=ownly_xxxxxxxxxxxxx
OWNLY_API_URL=https://api.ownly.io
```

### Docker
```dockerfile
ENV OWNLY_API_KEY=ownly_xxxxxxxxxxxxx
```

### Kubernetes
```yaml
env:
  - name: OWNLY_API_KEY
    valueFrom:
      secretKeyRef:
        name: ownly-secrets
        key: api-key
```

---

## Paso 4: Manejo de Errores

### Errores Comunes

#### 401 Unauthorized
```
Causa: API key inválida, expirada o no incluida
Solución: Verifica que el header Authorization esté correcto
```

#### 403 Forbidden
```
Causa: API key válida pero sin permisos para este endpoint
Solución: Contacta a support para actualizar permisos
```

#### 429 Too Many Requests
```
Causa: Excediste el límite de tu plan
Solución: Espera hasta el próximo período de facturación o upgrade
```

#### 500 Internal Server Error
```
Causa: Error en el servidor
Solución: Reintenta en 30 segundos, contacta a support si persiste
```

---

## Paso 5: Testing

### Verificar Conectividad

```bash
# Test básico
curl -i https://api.ownly.io/api/identity/ow_MEAYG4B \
  -H "Authorization: Bearer ownly_xxxxx"

# Esperado: 200 OK
# {
#   "verified": true,
#   "verification_level": "full",
#   "risk_score": "low",
#   ...
# }
```

### Verificar Permisos

```bash
# Si obtienes 403, tus permisos son insuficientes
curl -i https://api.ownly.io/api/identity/verify \
  -X POST \
  -H "Authorization: Bearer ownly_xxxxx" \
  -H "Content-Type: application/json" \
  -d '{"ownly_id": "ow_MEAYG4B"}'
```

---

## Cambios en Respuesta

### Antes (v1.0)
```json
{
  "verified": true,
  "ownly_id": "ow_MEAYG4B",
  "kyc_provider": "Sumsub",
  "verification_level": "full",
  "timestamp": "2026-04-27T10:30:00Z",
  "unique_user": true,
  "risk_score": "low"
}
```

### Ahora (v2.0)
```json
{
  "verified": true,
  "verification_level": "full",
  "risk_score": "low",
  "timestamp": "2026-04-27T10:30:00Z",
  "unique_user": true
}
```

**Cambios:**
- ❌ Removido: `ownly_id` (no exponer identificadores)
- ❌ Removido: `kyc_provider` (detalles internos)
- ✅ Agregado: `can_trade` (en POST /verify)
- ✅ Agregado: `approved_at` (en POST /verify)

---

## Monitoreo y Alertas

### Configurar Alertas

```javascript
// Ejemplo: Alertar si API key está a punto de expirar
const checkApiKeyExpiry = async () => {
  const response = await fetch('https://api.ownly.io/api/api-keys/{keyId}', {
    headers: { 'Authorization': `Bearer ${JWT_TOKEN}` }
  });
  
  const { expires_at } = await response.json();
  const daysUntilExpiry = Math.floor(
    (new Date(expires_at) - new Date()) / (1000 * 60 * 60 * 24)
  );
  
  if (daysUntilExpiry < 30) {
    console.warn(`⚠️ API key expira en ${daysUntilExpiry} días`);
    // Enviar alerta
  }
};
```

### Dashboard de Uso

Accede a: https://dashboard.ownly.io/api-keys

Verás:
- Llamadas totales
- Tasa de éxito
- Errores
- Latencia promedio
- Endpoints más usados

---

## Soporte

### Preguntas Frecuentes

**P: ¿Cuándo debo migrar?**
A: Inmediatamente. La API v1.0 será deprecada el 2026-06-01.

**P: ¿Hay período de gracia?**
A: Sí, ambas versiones funcionarán hasta 2026-06-01.

**P: ¿Qué pasa si no migro?**
A: Tus integraciones dejarán de funcionar el 2026-06-01.

**P: ¿Cómo obtengo una nueva API key?**
A: Contacta a api-support@ownly.io

**P: ¿Puedo tener múltiples API keys?**
A: Sí, según tu plan.

### Contacto

- **Email:** api-support@ownly.io
- **Slack:** #api-support (si eres cliente)
- **Docs:** https://docs.ownly.io
- **Status:** https://status.ownly.io

---

## Checklist de Migración

- [ ] Obtener API Key
- [ ] Actualizar código para incluir header Authorization
- [ ] Configurar variables de entorno
- [ ] Probar en desarrollo
- [ ] Probar en staging
- [ ] Monitorear en producción
- [ ] Configurar alertas
- [ ] Documentar cambios internos
- [ ] Entrenar al equipo
- [ ] Confirmar migración completada

---

## Rollback (si es necesario)

Si encuentras problemas críticos:

1. Contacta a support inmediatamente
2. Podemos revertir temporalmente a v1.0
3. Trabajaremos juntos para resolver el problema
4. Reintentar migración

**Email de emergencia:** emergency@ownly.io
