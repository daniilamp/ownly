# Quick Start: Sistema B2B Seguro de Ownly

## 🚀 En 5 Minutos

### 1. Generar API Key

```bash
curl -X POST "https://api.ownly.io/api/api-keys/generate" \
  -H "Authorization: Bearer {JWT_TOKEN}" \
  -d '{
    "clientId": "my-company",
    "clientName": "My Company",
    "permissions": ["verify:read"]
  }'

# Respuesta:
# {
#   "apiKey": "ownly_xxxxxxxxxxxxx",
#   "warning": "Save this API key securely"
# }
```

### 2. Usar API Key

```bash
curl -X GET "https://api.ownly.io/api/identity/ow_MEAYG4B" \
  -H "Authorization: Bearer ownly_xxxxxxxxxxxxx"

# Respuesta:
# {
#   "verified": true,
#   "verification_level": "full",
#   "risk_score": "low",
#   "timestamp": "2026-04-27T10:30:00Z",
#   "unique_user": true
# }
```

### 3. Integrar en tu App

```javascript
const API_KEY = process.env.OWNLY_API_KEY;

async function verifyUser(ownlyId) {
  const response = await fetch(
    `https://api.ownly.io/api/identity/${ownlyId}`,
    {
      headers: {
        'Authorization': `Bearer ${API_KEY}`
      }
    }
  );
  
  const data = await response.json();
  
  if (data.verified) {
    // Usuario verificado
    console.log('✅ Usuario verificado');
  } else {
    // Usuario no verificado
    console.log('❌ Usuario no verificado');
  }
}
```

---

## 📚 Documentación Completa

| Documento | Descripción |
|-----------|-------------|
| **B2B_SECURITY_IMPLEMENTATION.md** | Implementación técnica completa |
| **API_MIGRATION_GUIDE.md** | Guía para migrar desde v1.0 |
| **DEPLOYMENT_INSTRUCTIONS.md** | Pasos para desplegar a producción |
| **IMPLEMENTATION_SUMMARY.md** | Resumen ejecutivo de cambios |

---

## 🔑 Obtener API Key

### Para Clientes Nuevos

1. Contacta: api-support@ownly.io
2. Proporciona:
   - Nombre de empresa
   - Caso de uso
   - Volumen estimado
3. Recibirás API key en 24 horas

### Para Clientes Existentes

1. Accede a: https://dashboard.ownly.io
2. Ve a: API Keys
3. Haz clic: Generate New Key
4. Copia: Tu API key

---

## 🧪 Probar Endpoints

### Verificar por Ownly ID

```bash
curl -X GET "https://api.ownly.io/api/identity/ow_MEAYG4B" \
  -H "Authorization: Bearer ownly_xxxxx"
```

### Verificar por Email

```bash
curl -X GET "https://api.ownly.io/api/identity/email/user@example.com" \
  -H "Authorization: Bearer ownly_xxxxx"
```

### Verificar Unicidad

```bash
curl -X GET "https://api.ownly.io/api/identity/ow_MEAYG4B/unique" \
  -H "Authorization: Bearer ownly_xxxxx"
```

### POST Verify

```bash
curl -X POST "https://api.ownly.io/api/identity/verify" \
  -H "Authorization: Bearer ownly_xxxxx" \
  -H "Content-Type: application/json" \
  -d '{"ownly_id": "ow_MEAYG4B"}'
```

---

## 📊 Respuesta Segura

```json
{
  "verified": true,
  "verification_level": "full",
  "risk_score": "low",
  "timestamp": "2026-04-27T10:30:00Z",
  "unique_user": true,
  "can_trade": true
}
```

**Campos:**
- `verified` - ¿Usuario verificado?
- `verification_level` - full | pending | rejected | none
- `risk_score` - low | medium | high | unknown
- `timestamp` - Fecha de verificación
- `unique_user` - ¿Usuario único?
- `can_trade` - ¿Puede operar? (solo en POST)

---

## ⚠️ Errores Comunes

### 401 Unauthorized
```
Causa: API key inválida o no incluida
Solución: Verifica el header Authorization
```

### 403 Forbidden
```
Causa: API key sin permisos
Solución: Contacta a support para actualizar permisos
```

### 429 Too Many Requests
```
Causa: Excediste el límite de tu plan
Solución: Espera o upgrade tu plan
```

---

## 🔒 Seguridad

✅ **Autenticación:** API Keys con hash SHA-256
✅ **Autorización:** Permisos granulares
✅ **Rate Limiting:** Límite por cliente
✅ **Auditoría:** Logging de todas las llamadas
✅ **PII:** Nunca exponer datos personales

---

## 💰 Planes

| Plan | Precio | Verificaciones | API Keys |
|------|--------|-----------------|----------|
| **Básico** | $99/mes | 10,000 | 1 |
| **Pro** | $499/mes | 100,000 | 5 |
| **Enterprise** | Custom | Ilimitadas | Ilimitadas |

---

## 📞 Soporte

- **Email:** api-support@ownly.io
- **Docs:** https://docs.ownly.io
- **Status:** https://status.ownly.io
- **Slack:** #api-support (clientes)

---

## 🎯 Próximos Pasos

1. ✅ Obtener API key
2. ✅ Probar endpoints
3. ✅ Integrar en tu app
4. ✅ Monitorear uso
5. ✅ Escalar según necesidad

---

## 📖 Ejemplos de Código

### JavaScript/Node.js

```javascript
const API_KEY = process.env.OWNLY_API_KEY;

async function verifyUser(ownlyId) {
  const response = await fetch(
    `https://api.ownly.io/api/identity/${ownlyId}`,
    {
      headers: { 'Authorization': `Bearer ${API_KEY}` }
    }
  );
  return response.json();
}

// Uso
const result = await verifyUser('ow_MEAYG4B');
console.log(result.verified ? '✅ Verificado' : '❌ No verificado');
```

### Python

```python
import requests
import os

API_KEY = os.getenv('OWNLY_API_KEY')

def verify_user(ownly_id):
    headers = {'Authorization': f'Bearer {API_KEY}'}
    response = requests.get(
        f'https://api.ownly.io/api/identity/{ownly_id}',
        headers=headers
    )
    return response.json()

# Uso
result = verify_user('ow_MEAYG4B')
print('✅ Verificado' if result['verified'] else '❌ No verificado')
```

### Go

```go
package main

import (
    "fmt"
    "net/http"
    "os"
)

func verifyUser(ownlyID string) {
    client := &http.Client{}
    req, _ := http.NewRequest(
        "GET",
        fmt.Sprintf("https://api.ownly.io/api/identity/%s", ownlyID),
        nil,
    )
    
    apiKey := os.Getenv("OWNLY_API_KEY")
    req.Header.Add("Authorization", fmt.Sprintf("Bearer %s", apiKey))
    
    resp, _ := client.Do(req)
    defer resp.Body.Close()
    
    // Procesar respuesta
}
```

---

## 🚀 Deployment

### Backend
```bash
# Railway, Vercel, o Heroku
# Ejecutar migraciones de base de datos
# Configurar variables de entorno
# Deploy
```

### Frontend
```bash
# Vercel o Netlify
# Importar VerificationResult component
# Deploy
```

---

## ✨ Características

✅ API privada con autenticación
✅ UI limpia sin JSON expuesto
✅ Permisos granulares
✅ Rate limiting por cliente
✅ Auditoría completa
✅ Estadísticas de uso
✅ Preparado para monetización
✅ Soporte empresarial

---

## 🎉 ¡Listo!

Tu sistema B2B seguro está listo para usar.

**Próximo paso:** Obtener API key y empezar a integrar.

---

## 📋 Checklist

- [ ] Obtener API key
- [ ] Probar endpoints
- [ ] Integrar en app
- [ ] Configurar monitoreo
- [ ] Documentar para equipo
- [ ] Escalar según necesidad

---

**¿Preguntas?** Contacta a api-support@ownly.io
