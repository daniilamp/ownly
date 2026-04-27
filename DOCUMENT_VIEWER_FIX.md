# 🔧 DOCUMENT VIEWER FIX - Error al Abrir Documento

**Problema**: Error "The string to be decoded is not correctly encoded" al intentar abrir un documento

**Causa**: Los datos Base64 guardados en IndexedDB estaban corruptos

**Solución**: Se arreglaron las funciones de encriptación y se mejoró la validación

---

## Cambios Realizados

### 1. Mejorada `arrayBufferToBase64()` en `src/utils/encryption.js`

**Antes**:
```javascript
export function arrayBufferToBase64(buffer) {
  const bytes = new Uint8Array(buffer);
  // ... resto del código
}
```

**Problema**: Si `buffer` ya era un `Uint8Array`, `new Uint8Array(buffer)` creaba una copia incorrecta

**Después**:
```javascript
export function arrayBufferToBase64(buffer) {
  // Handle both ArrayBuffer and Uint8Array
  let bytes;
  if (buffer instanceof Uint8Array) {
    bytes = buffer;
  } else if (buffer instanceof ArrayBuffer) {
    bytes = new Uint8Array(buffer);
  } else {
    throw new Error('Invalid buffer type');
  }
  // ... resto del código
}
```

---

### 2. Mejorada `base64ToArrayBuffer()` en `src/utils/encryption.js`

**Antes**:
```javascript
export function base64ToArrayBuffer(base64) {
  const binary = atob(base64);
  // ... resto del código
}
```

**Problema**: No validaba la entrada ni manejaba errores de decodificación

**Después**:
```javascript
export function base64ToArrayBuffer(base64) {
  if (!base64 || typeof base64 !== 'string') {
    throw new Error('Invalid Base64 string');
  }
  
  try {
    const binary = atob(base64);
    // ... resto del código
  } catch (err) {
    throw new Error(`Base64 decoding failed: ${err.message}`);
  }
}
```

---

### 3. Mejorada Validación en `DocumentViewer.jsx`

**Agregado**:
- Validación de que los campos sean strings (Base64)
- Mejor manejo de errores con console.error para debugging
- Mensajes de error más específicos

```javascript
// Validate that fields are strings (Base64)
if (typeof document.encryptedData !== 'string') {
  throw new Error('Datos encriptados inválidos');
}
if (typeof document.iv !== 'string') {
  throw new Error('IV inválido');
}
if (typeof document.salt !== 'string') {
  throw new Error('Salt inválido');
}
```

---

## Cómo Arreglarlo

### Paso 1: Limpiar IndexedDB

Los documentos antiguos tienen datos corruptos. Necesitas limpiar la base de datos:

**Opción A: Desde DevTools (Recomendado)**
1. Abre DevTools (F12)
2. Ve a **Application** → **IndexedDB**
3. Haz clic derecho en **ownly_db**
4. Selecciona **Delete database**
5. Recarga la página

**Opción B: Desde la Consola**
1. Abre DevTools (F12)
2. Ve a **Console**
3. Copia y pega:
```javascript
const deleteDB = () => {
  return new Promise((resolve) => {
    const request = indexedDB.deleteDatabase('ownly_db');
    request.onsuccess = () => {
      console.log('✅ IndexedDB limpiado');
      location.reload();
    };
  });
};
deleteDB();
```

### Paso 2: Subir un Documento Nuevo

1. Inicia sesión
2. Ve a **Mis Documentos**
3. Haz clic en **+ Subir Documento**
4. Selecciona un archivo pequeño (PDF, JPG, PNG)
5. Ingresa una contraseña (mín 8 caracteres)
6. Confirma la contraseña
7. Haz clic en **Subir Documento**

### Paso 3: Abrir el Documento

1. Haz clic en **Ver Documento**
2. Ingresa la contraseña que usaste
3. Haz clic en **Ver Documento**
4. Debería funcionar ahora ✅

---

## Si Sigue Sin Funcionar

### Paso 1: Abre la Consola
1. Presiona F12
2. Ve a la pestaña **Console**

### Paso 2: Intenta Abrir el Documento
- Verás el error exacto en la consola

### Paso 3: Copia el Error
- Copia el mensaje de error completo
- Incluye el stack trace

### Paso 4: Verifica los Datos
En la consola, ejecuta:
```javascript
// Ver documentos guardados
const db = await new Promise((resolve, reject) => {
  const request = indexedDB.open('ownly_db', 1);
  request.onsuccess = () => resolve(request.result);
  request.onerror = () => reject(request.error);
});

const transaction = db.transaction(['documents'], 'readonly');
const store = transaction.objectStore('documents');
const request = store.getAll();

request.onsuccess = () => {
  console.log('Documentos guardados:', request.result);
  request.result.forEach(doc => {
    console.log('Doc:', doc.fileName);
    console.log('  - encryptedData type:', typeof doc.encryptedData);
    console.log('  - iv type:', typeof doc.iv);
    console.log('  - salt type:', typeof doc.salt);
  });
};
```

---

## Archivos Modificados

1. **src/utils/encryption.js**
   - Mejorada `arrayBufferToBase64()`
   - Mejorada `base64ToArrayBuffer()`

2. **src/components/documents/DocumentViewer.jsx**
   - Agregada validación de tipos
   - Mejorado manejo de errores
   - Agregado console.error para debugging

---

## Verificación

Para verificar que todo funciona:

1. Limpia IndexedDB
2. Sube un documento nuevo
3. Abre el documento
4. Debería mostrar el contenido sin errores

---

## Resumen

| Problema | Causa | Solución |
|----------|-------|----------|
| Base64 corrupto | Manejo incorrecto de Uint8Array | Validar tipo de buffer |
| Decodificación falla | Sin validación de entrada | Validar string antes de atob() |
| Datos inválidos en IndexedDB | Documentos antiguos corruptos | Limpiar IndexedDB |

---

## Próximos Pasos

1. ✅ Limpia IndexedDB
2. ✅ Sube un documento nuevo
3. ✅ Abre el documento
4. ✅ Verifica que funciona

Si todo funciona: **Problema resuelto** ✅

Si sigue sin funcionar: Copia el error de la consola y comparte

