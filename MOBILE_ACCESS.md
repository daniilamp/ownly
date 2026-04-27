# 📱 ACCESO DESDE MÓVIL

## Opción 1: Acceso en Red Local (Recomendado)

### Paso 1: Obtener tu IP Local

**En Windows:**
1. Abre CMD (Win + R, escribe `cmd`, Enter)
2. Escribe: `ipconfig`
3. Busca "Dirección IPv4" (ej: `192.168.1.100`)

**En Mac/Linux:**
1. Abre Terminal
2. Escribe: `ifconfig` o `ip addr`
3. Busca tu IP local (ej: `192.168.1.100`)

### Paso 2: Configurar Vite para Acceso Externo

**Opción A: Modificar package.json**

Edita `package.json`:
```json
{
  "scripts": {
    "dev": "vite --host"
  }
}
```

**Opción B: Crear vite.config.js**

Crea o edita `vite.config.js`:
```javascript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0', // Permite acceso desde red local
    port: 5173,
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
```

### Paso 3: Configurar Backend

Edita `ownly-backend/api/src/index.js`:

```javascript
// Permitir CORS desde cualquier origen en desarrollo
app.use(cors({
  origin: '*', // En producción, especifica tu dominio
  credentials: true,
}));
```

### Paso 4: Actualizar Variables de Entorno

Crea `.env.local` en la raíz del proyecto:
```
VITE_API_URL=http://TU_IP_LOCAL:3001
```

Ejemplo:
```
VITE_API_URL=http://192.168.1.100:3001
```

### Paso 5: Reiniciar Servidores

**Terminal 1: Backend**
```bash
cd ownly-backend/api
npm run dev
```

**Terminal 2: Frontend**
```bash
npm run dev
```

Deberías ver algo como:
```
  ➜  Local:   http://localhost:5173/
  ➜  Network: http://192.168.1.100:5173/
```

### Paso 6: Acceder desde Móvil

1. Asegúrate de que tu móvil está en la misma red WiFi
2. Abre el navegador en tu móvil
3. Ve a: `http://TU_IP_LOCAL:5173`
4. Ejemplo: `http://192.168.1.100:5173`

---

## Opción 2: Túnel con ngrok (Acceso desde Internet)

### Paso 1: Instalar ngrok

1. Ve a https://ngrok.com
2. Crea una cuenta gratis
3. Descarga ngrok
4. Instala y autentica

### Paso 2: Crear Túneles

**Terminal 1: Backend**
```bash
cd ownly-backend/api
npm run dev
```

**Terminal 2: Túnel Backend**
```bash
ngrok http 3001
```

Copia la URL (ej: `https://abc123.ngrok.io`)

**Terminal 3: Frontend**
```bash
npm run dev
```

**Terminal 4: Túnel Frontend**
```bash
ngrok http 5173
```

Copia la URL (ej: `https://xyz789.ngrok.io`)

### Paso 3: Actualizar Variables de Entorno

Edita `.env.local`:
```
VITE_API_URL=https://abc123.ngrok.io
```

### Paso 4: Acceder desde Móvil

Abre en tu móvil: `https://xyz789.ngrok.io`

---

## Opción 3: Desplegar en Vercel/Netlify

### Frontend en Vercel

1. Sube tu código a GitHub
2. Ve a https://vercel.com
3. Importa tu repositorio
4. Configura variables de entorno:
   - `VITE_API_URL=https://tu-backend.railway.app`
5. Despliega

### Backend en Railway

1. Ve a https://railway.app
2. Crea nuevo proyecto
3. Conecta tu repositorio
4. Selecciona `ownly-backend/api`
5. Configura variables de entorno
6. Despliega

---

## Troubleshooting

### No puedo acceder desde móvil

**Problema**: "No se puede conectar"

**Soluciones**:
1. Verifica que estás en la misma red WiFi
2. Verifica que el firewall no bloquea el puerto 5173
3. Intenta desactivar el firewall temporalmente
4. Verifica que usas la IP correcta

**En Windows, permitir puerto en firewall**:
```powershell
netsh advfirewall firewall add rule name="Vite Dev Server" dir=in action=allow protocol=TCP localport=5173
```

### Backend no responde

**Problema**: "Failed to fetch"

**Soluciones**:
1. Verifica que el backend está corriendo
2. Verifica que CORS está configurado
3. Verifica que la URL del backend es correcta
4. Revisa la consola del navegador para errores

### Metamask no funciona en móvil

**Problema**: "Metamask no está instalado"

**Soluciones**:
1. Usa el navegador de Metamask en móvil
2. O usa autenticación por email/biométrica
3. O instala Metamask Mobile

---

## Configuración Completa

### vite.config.js
```javascript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: 5173,
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
```

### .env.local
```
VITE_API_URL=http://192.168.1.100:3001
```

### ownly-backend/api/src/index.js
```javascript
app.use(cors({
  origin: '*', // En desarrollo
  credentials: true,
}));
```

---

## Verificación

1. ✅ Backend corriendo en `http://localhost:3001`
2. ✅ Frontend corriendo en `http://0.0.0.0:5173`
3. ✅ Móvil en la misma red WiFi
4. ✅ Firewall permite puerto 5173
5. ✅ CORS configurado en backend
6. ✅ Variables de entorno correctas

---

## Comandos Rápidos

### Iniciar con acceso de red
```bash
# Terminal 1: Backend
cd ownly-backend/api && npm run dev

# Terminal 2: Frontend
npm run dev -- --host
```

### Ver tu IP
```bash
# Windows
ipconfig | findstr IPv4

# Mac/Linux
ifconfig | grep inet
```

---

## Notas de Seguridad

⚠️ **Importante**:
- En desarrollo, CORS está abierto (`origin: '*'`)
- En producción, especifica tu dominio exacto
- No expongas tu servidor de desarrollo a Internet sin protección
- Usa HTTPS en producción

---

## Próximos Pasos

1. Configura vite.config.js
2. Obtén tu IP local
3. Reinicia los servidores
4. Accede desde móvil
5. Si funciona: ✅ Listo
6. Si no funciona: Revisa troubleshooting

