# 🧪 SPRINT 4 - Guía de Testing de Documentos

**Fecha**: 22 Abril 2026  
**Estado**: Listo para probar

---

## 📋 Checklist de Testing

### ✅ Pre-requisitos
- [ ] Backend corriendo en puerto 3001
- [ ] Frontend corriendo en puerto 5174
- [ ] Usuario autenticado (login con Metamask/Email)
- [ ] KYC completado (para tener userId)

---

## 🧪 Test 1: Subir Documento

### Pasos:
1. **Ir a "Mis Documentos"** desde el Dashboard
2. **Hacer clic en "Subir Documento"**
3. **Seleccionar tipo de documento** (ej: DNI)
4. **Seleccionar archivo** (PDF, JPG, PNG - máx 10MB)
5. **Ingresar contraseña** (mínimo 8 caracteres)
6. **Confirmar contraseña**
7. **Hacer clic en "Subir Documento"**

### ✅ Resultado Esperado:
- ✅ Mensaje de éxito "¡Documento subido exitosamente!"
- ✅ Documento aparece en la lista
- ✅ Muestra nombre del archivo
- ✅ Muestra tamaño del archivo
- ✅ Muestra fecha de subida
- ✅ Icono de candado verde (encriptado)

### ❌ Errores Posibles:
- "Por favor selecciona un archivo" → Falta archivo
- "Por favor ingresa una contraseña" → Falta contraseña
- "Las contraseñas no coinciden" → Contraseñas diferentes
- "La contraseña debe tener al menos 8 caracteres" → Contraseña muy corta
- "El archivo no puede ser mayor a 10MB" → Archivo muy grande

---

## 🧪 Test 2: Ver Documento

### Pasos:
1. **Hacer clic en el icono de ojo** 👁️ en un documento
2. **Ingresar la contraseña** del documento
3. **Hacer clic en "Desencriptar y Ver"**

### ✅ Resultado Esperado:
- ✅ Modal se abre con el documento
- ✅ PDF se muestra en el visor
- ✅ Imágenes se muestran correctamente
- ✅ Botón de cerrar funciona

### ❌ Errores Posibles:
- "Contraseña incorrecta" → Contraseña equivocada
- "Error al desencriptar" → Documento corrupto
- "Document is missing salt" → Documento en formato antiguo (re-subir)

---

## 🧪 Test 3: Eliminar Documento

### Pasos:
1. **Hacer clic en el icono de basura** 🗑️ en un documento
2. **Confirmar eliminación** en el diálogo

### ✅ Resultado Esperado:
- ✅ Diálogo de confirmación aparece
- ✅ Documento desaparece de la lista
- ✅ Contador de documentos se actualiza
- ✅ Documento eliminado de IndexedDB

---

## 🧪 Test 4: Múltiples Documentos

### Pasos:
1. **Subir 3 documentos diferentes**:
   - DNI (PDF)
   - Pasaporte (JPG)
   - Título Universitario (PDF)
2. **Usar contraseñas diferentes** para cada uno
3. **Verificar que todos aparecen** en la lista

### ✅ Resultado Esperado:
- ✅ Los 3 documentos aparecen
- ✅ Cada uno con su nombre correcto
- ✅ Cada uno con su tipo correcto
- ✅ Ordenados por fecha (más reciente primero)

---

## 🧪 Test 5: Tipos de Archivo

### Tipos Soportados:
- ✅ PDF (.pdf)
- ✅ JPG (.jpg, .jpeg)
- ✅ PNG (.png)
- ✅ DOC (.doc, .docx)

### Pasos:
1. **Probar subir cada tipo de archivo**
2. **Verificar que se suben correctamente**
3. **Verificar que se pueden ver**

### ✅ Resultado Esperado:
- ✅ Todos los tipos se suben sin error
- ✅ PDFs se muestran en el visor
- ✅ Imágenes se muestran correctamente
- ✅ DOCs se pueden descargar

---

## 🧪 Test 6: Persistencia de Datos

### Pasos:
1. **Subir un documento**
2. **Cerrar el navegador completamente**
3. **Abrir de nuevo y hacer login**
4. **Ir a "Mis Documentos"**

### ✅ Resultado Esperado:
- ✅ Documento sigue ahí
- ✅ Se puede ver con la contraseña correcta
- ✅ Datos no se pierden

---

## 🧪 Test 7: Seguridad - Contraseña Incorrecta

### Pasos:
1. **Subir documento con contraseña "password123"**
2. **Intentar ver con contraseña "wrongpassword"**

### ✅ Resultado Esperado:
- ❌ Error: "Contraseña incorrecta"
- ✅ Documento NO se desencripta
- ✅ No se muestra contenido

---

## 🧪 Test 8: Límite de Tamaño

### Pasos:
1. **Intentar subir archivo > 10MB**

### ✅ Resultado Esperado:
- ❌ Error: "El archivo no puede ser mayor a 10MB"
- ✅ Upload no procede
- ✅ Mensaje claro al usuario

---

## 🧪 Test 9: Sin Documentos

### Pasos:
1. **Ir a "Mis Documentos" sin haber subido nada**

### ✅ Resultado Esperado:
- ✅ Mensaje: "No tienes documentos guardados"
- ✅ Sugerencia: "Sube tu primer documento para comenzar"
- ✅ Icono de candado visible

---

## 🧪 Test 10: Múltiples Usuarios

### Pasos:
1. **Login con Usuario A**
2. **Subir documento**
3. **Logout**
4. **Login con Usuario B**
5. **Ir a "Mis Documentos"**

### ✅ Resultado Esperado:
- ✅ Usuario B NO ve documentos de Usuario A
- ✅ Cada usuario ve solo sus documentos
- ✅ Aislamiento completo de datos

---

## 🔍 Verificaciones Técnicas

### IndexedDB
```javascript
// Abrir DevTools → Application → IndexedDB → ownly_db → documents
// Verificar:
- ✅ Documentos están guardados
- ✅ encryptedData está en Base64
- ✅ iv y salt están presentes
- ✅ userId coincide con el usuario actual
```

### Console Logs
```javascript
// Abrir DevTools → Console
// Verificar:
- ✅ No hay errores de encriptación
- ✅ No hay errores de IndexedDB
- ✅ Logs de éxito al subir/eliminar
```

### Network
```javascript
// Abrir DevTools → Network
// Verificar:
- ✅ NO hay peticiones al backend con datos sin encriptar
- ✅ Solo metadata se envía (si se implementa sync)
```

---

## 🐛 Problemas Conocidos y Soluciones

### Problema 1: "Document is missing salt"
**Causa**: Documento subido con versión antigua del código  
**Solución**: Eliminar documento y volver a subirlo

### Problema 2: "Failed to decrypt"
**Causa**: Contraseña incorrecta o documento corrupto  
**Solución**: Verificar contraseña o re-subir documento

### Problema 3: "User ID not found"
**Causa**: No se ha completado KYC  
**Solución**: Completar proceso KYC primero

### Problema 4: Documento no aparece después de subir
**Causa**: Error en IndexedDB  
**Solución**: 
```javascript
// Limpiar IndexedDB
indexedDB.deleteDatabase('ownly_db');
location.reload();
```

---

## 📊 Métricas de Éxito

### Funcionalidad
- [ ] Upload funciona correctamente
- [ ] Encriptación funciona
- [ ] Desencriptación funciona
- [ ] Visualización funciona
- [ ] Eliminación funciona
- [ ] Persistencia funciona

### Seguridad
- [ ] Contraseña incorrecta rechazada
- [ ] Datos encriptados en IndexedDB
- [ ] No hay datos sin encriptar en network
- [ ] Aislamiento entre usuarios

### UX
- [ ] Mensajes de error claros
- [ ] Loading states visibles
- [ ] Confirmaciones apropiadas
- [ ] UI responsive

---

## 🎯 Casos de Uso Reales

### Caso 1: Guardar DNI
```
Usuario: Juan
Documento: DNI escaneado (PDF, 2MB)
Contraseña: MiDNI2026!
Resultado: ✅ Guardado y encriptado
```

### Caso 2: Guardar Título Universitario
```
Usuario: María
Documento: Título (PDF, 5MB)
Contraseña: Universidad123
Resultado: ✅ Guardado y encriptado
```

### Caso 3: Guardar Cartilla de Vacunación
```
Usuario: Pedro
Documento: Cartilla (JPG, 1MB)
Contraseña: Vacunas2026
Resultado: ✅ Guardado y encriptado
```

---

## 🚀 Testing Rápido (5 minutos)

### Quick Test:
1. ✅ Login
2. ✅ Ir a Documentos
3. ✅ Subir 1 PDF con contraseña "test1234"
4. ✅ Ver documento con contraseña correcta
5. ✅ Intentar ver con contraseña incorrecta (debe fallar)
6. ✅ Eliminar documento
7. ✅ Verificar que desapareció

**Si todo funciona**: ✅ SPRINT 4 COMPLETO

---

## 📝 Reporte de Testing

### Fecha: _____________
### Tester: _____________

| Test | Estado | Notas |
|------|--------|-------|
| Upload documento | ⬜ | |
| Ver documento | ⬜ | |
| Eliminar documento | ⬜ | |
| Múltiples documentos | ⬜ | |
| Tipos de archivo | ⬜ | |
| Persistencia | ⬜ | |
| Contraseña incorrecta | ⬜ | |
| Límite de tamaño | ⬜ | |
| Sin documentos | ⬜ | |
| Múltiples usuarios | ⬜ | |

**Estado General**: ⬜ PASS / ⬜ FAIL

**Comentarios**:
_________________________________
_________________________________
_________________________________

---

## 🎉 Siguiente Paso

Una vez completado el testing:
1. ✅ Marcar SPRINT 4 como completo
2. 🚀 Decidir siguiente sprint:
   - SPRINT 5: Blockchain Real
   - Mejoras de UX
   - Mobile App
   - Integración Sumsub Real

---

**¿Listo para probar?** 🧪

Abre la app, ve a "Mis Documentos" y sigue los pasos del Test 1! 🚀
