# Integración Frontend ↔ Backend

## Archivos nuevos a añadir al proyecto Base44

### 1. `src/api/ownlyApi.js`
Cliente HTTP para el backend. Reemplaza las llamadas directas a base44 en la verificación.

### 2. `src/hooks/useZKVerify.js`
Hook que centraliza el flujo completo:
- Busca el ShareRequest en base44
- Llama a la API para verificar
- Marca el ShareRequest como verificado
- Devuelve el resultado estructurado

### 3. `src/pages/Verify.jsx`
Reemplaza el archivo existente. Usa `useZKVerify` en lugar de lógica inline.
Añade badge de estado de la API (online/demo).

## Cambios en archivos existentes

### `src/pages/B2BDashboard.jsx`
Reemplaza `handleVerify` con:

```js
import { useZKVerify } from '@/hooks/useZKVerify';

// Dentro del componente:
const { verify, loading, result, reset } = useZKVerify();

// En handleVerify:
const handleVerify = () => verify(token);

// En reset:
const reset = () => { reset(); setToken(''); setResult(null); };
```

## Variables de entorno

Añadir a `.env.local` del proyecto:
```
VITE_OWNLY_API_URL=http://localhost:3001
```

## Flujo completo

```
Usuario genera QR (CredentialDetail.jsx)
    ↓ token guardado en base44 (ShareRequest)
    
Verificador introduce token (Verify.jsx)
    ↓ useZKVerify.verify(token)
    
useZKVerify:
    1. isApiReachable() → badge online/demo
    2. base44.ShareRequest.filter({ qr_code: token })
    3. POST /api/verify/token { token, shareRequest }
    4. base44.ShareRequest.update({ status: 'verified' })
    5. setResult(...)
    
API (/api/verify/token):
    - Valida expiración del QR
    - Devuelve claims + tipo + emisor
    - (Cuando ZK esté compilado: verifica Groth16 + Merkle root on-chain)
```
