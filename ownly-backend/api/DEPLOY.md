# Deploy de Ownly API a Railway

## Pasos rápidos

### 1. Conecta tu repo a Railway

1. Ve a [railway.app](https://railway.app)
2. Haz login con GitHub
3. Crea un nuevo proyecto → "Deploy from GitHub"
4. Selecciona tu repo `ownly-backend`
5. Railway detectará automáticamente que es Node.js

### 2. Configura las variables de entorno

En Railway, ve a **Variables** y añade:

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

### 3. Configura el start script

Railway debería detectar automáticamente `npm start` desde `package.json`.

Si no, ve a **Settings** → **Build Command** y asegúrate de que sea:
```
npm install
```

Y **Start Command**:
```
node src/index.js
```

### 4. Deploy

Railway desplegará automáticamente cuando hagas push a `main`. 

Tu API estará disponible en: `https://ownly-api-production.up.railway.app` (o similar)

---

## Verificar que funciona

```bash
curl https://tu-api-railway.app/health
# Debería devolver: {"status":"ok","version":"1.0.0"}
```

---

## Actualizar el frontend

Una vez que tengas la URL de Railway, actualiza en Vercel:

```
VITE_OWNLY_API_URL=https://tu-api-railway.app
```

Y redeploy.

---

## Troubleshooting

**Error: "Cannot find module"**
- Asegúrate de que `package.json` está en `ownly-backend/api/`
- Railway debería instalar dependencias automáticamente

**Error: "Port already in use"**
- Railway asigna el puerto automáticamente. No hardcodees puertos.

**Error: "RPC connection failed"**
- Verifica que `RPC_URL` es correcto
- Prueba manualmente: `curl https://rpc-amoy.polygon.technology`

