# ⚠️ Database Migration Required

Para que SPRINT 3 funcione correctamente, necesitas ejecutar una migración en tu base de datos Supabase.

## Pasos:

### 1. Abre Supabase
Ve a: https://app.supabase.com

### 2. Selecciona tu proyecto

### 3. Ve a SQL Editor
En el menú izquierdo, haz clic en "SQL Editor"

### 4. Copia y ejecuta la migración
Abre el archivo: `ownly-backend/api/database/migration-sprint3.sql`

Copia TODO el contenido y pégalo en el SQL Editor de Supabase.

Luego haz clic en "Run" (o presiona Ctrl+Enter)

### 5. Verifica que se ejecutó correctamente
Deberías ver un mensaje de éxito sin errores.

---

## ¿Qué hace la migración?

- ✅ Agrega nuevas columnas a la tabla `credentials`
- ✅ Hace `commitment_hash` nullable (para nuevas credenciales)
- ✅ Agrega columnas de tracking a `kyc_verifications`
- ✅ Crea tabla `user_documents` para SPRINT 4
- ✅ Crea índices para mejor rendimiento
- ✅ Crea triggers para actualizar timestamps

---

## Después de la migración

Una vez ejecutada la migración, puedes:

1. Ejecutar el script de prueba nuevamente:
```bash
cd ownly-backend/api
node test-sprint3-flow.js
```

2. O probar manualmente en la UI:
- Abre http://localhost:5173/kyc
- Completa el flujo KYC
- Verifica que la credencial se crea automáticamente

---

**¿Necesitas ayuda?** Revisa los logs de Supabase si hay errores.
