# 🚀 GOOGLE OAUTH - INICIO RÁPIDO

## Paso 1: Crear Proyecto en Google Cloud

1. Ve a https://console.cloud.google.com/
2. Crea un nuevo proyecto llamado "Ownly"
3. Espera a que se cree (30 segundos)

## Paso 2: Configurar OAuth

1. En el menú lateral, busca **APIs & Services** → **Credentials**
2. Haz clic en **Configure Consent Screen**
3. Selecciona **External** → **Create**
4. Completa:
   - App name: `Ownly`
   - User support email: tu email
   - Developer contact: tu email
5. Haz clic en **Save and Continue** (3 veces)

## Paso 3: Crear Client ID

1. Ve a **Credentials** → **Create Credentials** → **OAuth client ID**
2. Application type: **Web application**
3. Name: `Ownly Web`
4. Authorized JavaScript origins:
   - Haz clic en **Add URI**
   - Agrega: `http://localhost:5173`
5. Authorized redirect URIs:
   - Haz clic en **Add URI**
   - Agrega: `http://localhost:5173`
6. Haz clic en **Create**
7. **COPIA EL CLIENT ID** (se ve así: `123456789-abc...xyz.apps.googleusercontent.com`)

## Paso 4: Configurar en el Proyecto

1. Crea archivo `.env.local` en la raíz del proyecto:
```
VITE_API_URL=http://localhost:3001
VITE_GOOGLE_CLIENT_ID=PEGA_TU_CLIENT_ID_AQUI
```

2. Reinicia el servidor:
```bash
# Ctrl+C para detener
npm run dev
```

## Paso 5: Probar

1. Abre http://localhost:5173/login
2. Haz clic en "Continuar con Google"
3. Debería funcionar ✅

---

## ⏱️ Tiempo estimado: 5 minutos

