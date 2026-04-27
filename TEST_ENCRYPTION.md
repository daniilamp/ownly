# 🔐 TEST ENCRYPTION - Verificar que la Encriptación Funciona

## Prueba Rápida en la Consola

1. Abre DevTools (F12)
2. Ve a la pestaña **Console**
3. Copia y pega esto:

```javascript
// Importar funciones de encriptación
import { encryptDocument, decryptDocument, arrayBufferToBase64, base64ToArrayBuffer } from './src/utils/encryption.js';

// Crear datos de prueba
const testData = new TextEncoder().encode('Hola, esto es un test');
const password = 'TestPassword123';

// Encriptar
const encrypted = await encryptDocument(testData, password);
console.log('✅ Encriptación exitosa');
console.log('Encrypted data length:', encrypted.encryptedData.length);
console.log('IV length:', encrypted.iv.length);
console.log('Salt length:', encrypted.salt.length);

// Convertir a Base64
const encryptedB64 = arrayBufferToBase64(encrypted.encryptedData);
const ivB64 = arrayBufferToBase64(encrypted.iv);
const saltB64 = arrayBufferToBase64(encrypted.salt);

console.log('✅ Base64 conversion exitosa');
console.log('Encrypted B64 length:', encryptedB64.length);
console.log('IV B64 length:', ivB64.length);
console.log('Salt B64 length:', saltB64.length);

// Convertir de vuelta desde Base64
const encryptedBack = base64ToArrayBuffer(encryptedB64);
const ivBack = base64ToArrayBuffer(ivB64);
const saltBack = base64ToArrayBuffer(saltB64);

console.log('✅ Base64 decode exitoso');

// Desencriptar
const decrypted = await decryptDocument(encryptedBack, password, ivBack, saltBack);
const decryptedText = new TextDecoder().decode(decrypted);

console.log('✅ Desencriptación exitosa');
console.log('Original:', 'Hola, esto es un test');
console.log('Decrypted:', decryptedText);
console.log('Match:', decryptedText === 'Hola, esto es un test');
```

## Resultado Esperado

```
✅ Encriptación exitosa
Encrypted data length: 37
IV length: 12
Salt length: 16

✅ Base64 conversion exitosa
Encrypted B64 length: 52
IV B64 length: 16
Salt B64 length: 24

✅ Base64 decode exitoso
✅ Desencriptación exitosa
Original: Hola, esto es un test
Decrypted: Hola, esto es un test
Match: true
```

## Si Hay Error

### Error: "Invalid Base64 string"
- Significa que la conversión a Base64 falló
- Verifica que `arrayBufferToBase64` recibe datos válidos

### Error: "Decryption failed"
- Significa que la contraseña es incorrecta o los datos están corruptos
- Verifica que usas la misma contraseña

### Error: "Base64 decoding failed"
- Significa que el Base64 está corrupto
- Verifica que `base64ToArrayBuffer` recibe un string válido

---

## Prueba Manual en la UI

1. Limpia IndexedDB (ver CLEAR_INDEXEDDB.md)
2. Inicia sesión
3. Ve a Documentos
4. Sube un archivo pequeño (ej: un PDF de prueba)
5. Usa contraseña: `TestPassword123`
6. Intenta abrir el documento
7. Ingresa la contraseña: `TestPassword123`
8. Debería funcionar

---

## Archivos Modificados

- `src/utils/encryption.js` - Mejorado manejo de Base64
- `src/components/documents/DocumentViewer.jsx` - Mejorada validación

---

## Próximos Pasos

1. Limpia IndexedDB
2. Sube un documento nuevo
3. Intenta abrirlo
4. Si funciona: ✅ Problema resuelto
5. Si no funciona: Copia el error de la consola

