# 🚀 Guía de Deploy — Ownly Stack

## Estado actual

✅ **Backend API** — Listo para Railway  
✅ **Frontend** — Listo para Vercel  
✅ **Contratos** — Desplegados en Polygon Amoy  
✅ **Circuitos ZK** — Compilados  

---

## Paso 1: Deploy de la API en Railway

### 1.1 Crea cuenta en Railway

1. Ve a [railway.app](https://railway.app)
2. Haz login con GitHub
3. Autoriza Railway para acceder a tus repos

### 1.2 Crea un nuevo proyecto

1. Click en **"New Project"**
2. Selecciona **"Deploy from GitHub"**
3. Busca tu repo `ownly` (o como se llame)
4. Selecciona la rama `main`

### 1.3 Configura las variables de entorno

Railway debería detectar automáticamente que es Node.js.

En el panel de Railway, ve a **Variables** y añade estas 8 variables:

```
PORT=3001
NODE_ENV=production
FRONTEND_URL=https://tu-frontend.vercel.app

RPC_URL=https://rpc-amoy.polygon.technology
CREDENTIAL_REGISTRY_ADDRESS=0x193f9ad4b82e7211D885eFb913F1741892F430fE
BATCH_PROCESSOR_ADDRESS=0x65ac8030675592aeB9E93994ac35bA48282E98CA
VERIFIER_CONTRACT_ADDRESS=0x7368efd0B81F675B3B392e8534d8A74FA0b0D2A2
ISSUER_PRIVATE_KEY=0xbba7ea7736f54a85328ba00ec42598d00d781bf2918f1adf38414e41d09c3360
```

### 1.4 Configura el comando de start

En **Settings** → **Build Command**:
```
cd ownly-backend/api && npm install
```

En **Start Command**:
```
cd ownly-backend/api && npm start
```

### 1.5 Deploy

Click en **Deploy** y espera ~2 minutos.

Cuando termine, verás una URL como:
```
https://ownly-api-production.up.railway.app
```

**Guarda esta URL** — la necesitarás para el frontend.

---

## Paso 2: Deploy del Frontend en Vercel

### 2.1 Crea cuenta en Vercel

1. Ve a [vercel.com](https://vercel.com)
2. Haz login con GitHub
3. Autoriza Vercel

### 2.2 Importa el proyecto

1. Click en **"Add New..."** → **"Project"**
2. Selecciona tu repo `ownly`
3. Vercel detectará automáticamente que es Vite

### 2.3 Configura las variables de entorno

En **Environment Variables**, añade:

```
VITE_OWNLY_API_URL=https://tu-api-railway.app
```

(Reemplaza con la URL real de Railway del paso anterior)

### 2.4 Deploy

Click en **Deploy** y espera ~1 minuto.

Tu frontend estará disponible en:
```
https://ownly.vercel.app
```

---

## Paso 3: Verifica que todo funciona

### 3.1 Prueba la API

```bash
curl https://tu-api-railway.app/health
```

Debería devolver:
```json
{"status":"ok","version":"1.0.0"}
```

### 3.2 Prueba el frontend

1. Ve a `https://ownly.vercel.app/verify`
2. Introduce un token de demo: `A1B2C3D4E5F6A7B8`
3. Debería verificar contra tu API en Railway

---

## Troubleshooting

### Error: "Cannot find module"

**Causa:** Railway no está ejecutando desde el directorio correcto.

**Solución:** Verifica que en **Start Command** está:
```
cd ownly-backend/api && npm start
```

### Error: "Port already in use"

**Causa:** Hardcodeaste un puerto.

**Solución:** Railway asigna el puerto automáticamente. Usa `process.env.PORT`.

### Error: "RPC connection failed"

**Causa:** La URL de RPC es incorrecta o Polygon Amoy está caído.

**Solución:** Prueba manualmente:
```bash
curl -X POST https://rpc-amoy.polygon.technology \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}'
```

### Error: "CORS error"

**Causa:** El frontend y la API tienen dominios diferentes.

**Solución:** Verifica que `FRONTEND_URL` en Railway es correcto:
```
FRONTEND_URL=https://ownly.vercel.app
```

---

## Próximos pasos

1. **Integrar con base44** (opcional) — si quieres guardar credenciales
2. **Compilar verifiers Solidity** — para los 3 circuitos ZK
3. **Deploy a mainnet** — cuando esté listo para producción

---

## URLs finales

| Componente | URL |
|-----------|-----|
| Frontend | `https://ownly.vercel.app` |
| API | `https://tu-api-railway.app` |
| Contratos | Polygon Amoy (testnet) |
| Explorer | `https://cardona-zkevm.polygonscan.com` |

