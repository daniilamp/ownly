# 🔐 CONFIGURACIÓN DE GOOGLE OAUTH

## Paso 1: Crear Proyecto en Google Cloud

1. Ve a [Google Cloud Console](https://console.cloud.google.com/)
2. Crea un nuevo proyecto o selecciona uno existente
3. Nombre del proyecto: `Ownly` (o el que prefieras)

## Paso 2: Habilitar Google OAuth API

1. En el menú lateral, ve a **APIs & Services** → **Library**
2. Busca "Google+ API" o "Google Identity"
3. Haz clic en **Enable**

## Paso 3: Crear Credenciales OAuth

1. Ve a **APIs & Services** → **Credentials**
2. Haz clic en **Create Credentials** → **OAuth client ID**
3. Si es la primera vez, configura la pantalla de consentimiento:
   - **User Type**: External
   - **App name**: Ownly
   - **User support email**: tu email
   - **Developer contact**: tu email
   - Guarda y continúa

4. Vuelve a **Create Credentials** → **OAuth client ID**
5. **Application type**: Web application
6. **Name**: Ownly Web Client
7. **Authorized JavaScript origins**:
   - `http://localhost:5173` (desarrollo)
   - `http://TU_IP_LOCAL:5173` (móvil en red local)
   - Tu dominio de producción cuando despliegues
8. **Authorized redirect URIs**:
   - `http://localhost:5173`
   - `http://TU_IP_LOCAL:5173`
   - Tu dominio de producción
9. Haz clic en **Create**

## Paso 4: Copiar Client ID

1. Copia el **Client ID** que aparece
2. Se verá algo así: `1234567890-abcdefghijklmnopqrstuvwxyz.apps.googleusercontent.com`

## Paso 5: Configurar en el Proyecto

1. Crea un archivo `.env.local` en la raíz del proyecto:
```bash
VITE_API_URL=http://localhost:3001
VITE_GOOGLE_CLIENT_ID=TU_CLIENT_ID_AQUI.apps.googleusercontent.com
```

2. Reemplaza `TU_CLIENT_ID_AQUI` con tu Client ID real

## Paso 6: Reiniciar el Servidor

```bash
# Detén el servidor (Ctrl+C)
# Inicia de nuevo
npm run dev
```

---

## Verificación

1. Abre http://localhost:5173/login
2. Deberías ver el botón "Continuar con Google"
3. Haz clic en el botón
4. Debería abrir el popup de Google
5. Selecciona tu cuenta
6. Debería redirigir a /dashboard

---

## Troubleshooting

### Error: "redirect_uri_mismatch"
**Problema**: La URL de redirección no está autorizada

**Solución**:
1. Ve a Google Cloud Console → Credentials
2. Edita tu OAuth Client ID
3. Agrega la URL exacta en "Authorized redirect URIs"
4. Guarda y espera unos minutos

### Error: "popup_closed_by_user"
**Problema**: El usuario cerró el popup

**Solución**: Normal, el usuario canceló. Intenta de nuevo.

### Error: "idpiframe_initialization_failed"
**Problema**: Cookies de terceros bloqueadas

**Solución**:
1. Abre configuración del navegador
2. Permite cookies de terceros para google.com
3. O usa modo incógnito

### El botón no aparece
**Problema**: Client ID no configurado

**Solución**:
1. Verifica que `.env.local` existe
2. Verifica que `VITE_GOOGLE_CLIENT_ID` está configurado
3. Reinicia el servidor

---

## Producción

Cuando despliegues a producción:

1. Agrega tu dominio de producción en Google Cloud Console:
   - **Authorized JavaScript origins**: `https://tudominio.com`
   - **Authorized redirect URIs**: `https://tudominio.com`

2. Actualiza la variable de entorno en tu plataforma de hosting:
   - Vercel: Settings → Environment Variables
   - Netlify: Site settings → Environment variables
   - Railway: Variables

---

## Seguridad

⚠️ **Importante**:
- Nunca compartas tu Client ID en repositorios públicos
- Usa `.env.local` (ya está en .gitignore)
- En producción, restringe los dominios autorizados
- Revisa los logs de uso en Google Cloud Console

---

## Datos que Obtenemos de Google

Cuando el usuario inicia sesión con Google, obtenemos:
- ✅ Email
- ✅ Nombre completo
- ✅ Foto de perfil
- ✅ ID único de Google

**No obtenemos**:
- ❌ Contraseña
- ❌ Datos sensibles
- ❌ Acceso a Gmail o Drive

---

## Próximos Pasos

1. Configura Google OAuth siguiendo esta guía
2. Prueba el login con Google
3. Verifica que redirige a /dashboard
4. Verifica que mantiene la sesión

