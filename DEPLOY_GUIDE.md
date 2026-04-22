# 🚀 Guía de Deploy — OWNLY

## Stack
- **Frontend**: Vite + React → Vercel
- **Backend**: Express + Node.js → Railway
- **Base de datos**: Supabase (ya en la nube)
- **Blockchain**: Polygon Amoy testnet

---

## 1. Deploy del Backend en Railway

### Pasos:
1. Ve a [railway.app](https://railway.app) y crea una cuenta
2. "New Project" → "Deploy from GitHub repo"
3. Selecciona el repo, carpeta: `ownly-backend/api`
4. Railway detecta el `Procfile` automáticamente

### Variables de entorno en Railway:
```
PORT=3001
NODE_ENV=production
FRONTEND_URL=https://tu-app.vercel.app

# Supabase
SUPABASE_URL=https://jmbqtvmmldxgstabgpwh.supabase.co
SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_KEY=...

# Blockchain
RPC_URL=https://rpc-amoy.polygon.technology
CREDENTIAL_REGISTRY_ADDRESS=0x193f9ad4b82e7211D885eFb913F1741892F430fE
ISSUER_PRIVATE_KEY=0x...

# Sumsub (opcional)
SUMSUB_APP_TOKEN=...
SUMSUB_SECRET_KEY=...
```

### URL resultante:
`https://ownly-api-production.up.railway.app`

---

## 2. Deploy del Frontend en Vercel

### Pasos:
1. Ve a [vercel.com](https://vercel.com) y crea una cuenta
2. "New Project" → importa tu repo de GitHub
3. Framework: **Vite** (se detecta automáticamente)
4. Root directory: `/` (raíz del proyecto)

### Variables de entorno en Vercel:
```
VITE_OWNLY_API_URL=https://ownly-api-production.up.railway.app
VITE_CREDENTIAL_REGISTRY_ADDRESS=0x193f9ad4b82e7211D885eFb913F1741892F430fE
VITE_BATCH_PROCESSOR_ADDRESS=0x65ac8030675592aeB9E93994ac35bA48282E98CA
VITE_VERIFIER_CONTRACT_ADDRESS=0x7368efd0B81F675B3B392e8534d8A74FA0b0D2A2
```

### URL resultante:
`https://ownly.vercel.app`

---

## 3. Actualizar CORS

Una vez tengas la URL de Vercel, actualiza en Railway:
```
FRONTEND_URL=https://ownly.vercel.app
```

---

## 4. Verificar el deploy

```bash
# Health check del backend
curl https://ownly-api-production.up.railway.app/health

# Debería devolver:
# {"status":"ok","version":"1.0.0"}
```

---

## Checklist pre-deploy

- [x] No hay `localhost:3001` hardcodeados en el frontend
- [x] Variables de entorno en `.env.example`
- [x] CORS configurado para Vercel
- [x] `vercel.json` con rewrites para SPA
- [x] `.gitignore` excluye `.env.local`
- [ ] Subir código a GitHub
- [ ] Crear proyecto en Railway
- [ ] Crear proyecto en Vercel
- [ ] Configurar variables de entorno en ambos
- [ ] Verificar health check del backend
- [ ] Probar flujo completo en producción
