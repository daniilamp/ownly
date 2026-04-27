# 🧹 LIMPIAR INDEXEDDB

El problema con los documentos es que los datos guardados en IndexedDB están corruptos. Necesitas limpiar la base de datos local.

## Opción 1: Limpiar desde DevTools (Recomendado)

1. Abre el navegador (http://localhost:5173)
2. Presiona **F12** para abrir DevTools
3. Ve a la pestaña **Application** (o **Storage** en Firefox)
4. En el lado izquierdo, busca **IndexedDB**
5. Expande **IndexedDB**
6. Haz clic derecho en **ownly_db**
7. Selecciona **Delete database**
8. Recarga la página (F5)

## Opción 2: Limpiar desde la Consola

1. Abre DevTools (F12)
2. Ve a la pestaña **Console**
3. Copia y pega esto:

```javascript
// Limpiar IndexedDB
const deleteDB = () => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.deleteDatabase('ownly_db');
    request.onsuccess = () => {
      console.log('✅ IndexedDB limpiado');
      resolve();
    };
    request.onerror = () => {
      console.error('❌ Error al limpiar IndexedDB');
      reject();
    };
  });
};

deleteDB().then(() => {
  console.log('Recarga la página para continuar');
  location.reload();
});
```

4. Presiona **Enter**
5. Espera a que se limpie
6. La página se recargará automáticamente

## Opción 3: Limpiar Todo (localStorage + IndexedDB)

Si quieres limpiar todo (incluyendo sesión):

```javascript
// Limpiar todo
localStorage.clear();
sessionStorage.clear();

const deleteDB = () => {
  return new Promise((resolve) => {
    const request = indexedDB.deleteDatabase('ownly_db');
    request.onsuccess = () => {
      console.log('✅ Todo limpiado');
      location.reload();
    };
  });
};

deleteDB();
```

---

## Después de Limpiar

1. Recarga la página
2. Inicia sesión nuevamente
3. Sube un documento nuevo
4. Intenta abrirlo

---

## Qué Cambió

Se arreglaron dos problemas:

1. **Función `arrayBufferToBase64`**: Ahora maneja correctamente tanto `ArrayBuffer` como `Uint8Array`
2. **Función `base64ToArrayBuffer`**: Ahora valida la entrada y maneja errores mejor
3. **DocumentViewer**: Ahora valida que los datos sean strings antes de decodificar

---

## Si Sigue Sin Funcionar

1. Abre DevTools (F12)
2. Ve a **Console**
3. Intenta abrir un documento
4. Copia el error completo
5. Comparte el error

