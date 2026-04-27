# Guía: Hacer tu usuario ADMIN

## Problema
Tu usuario `danilamp@dlminvesting.com` no tiene rol de ADMIN en la base de datos, por lo que no puedes acceder al panel de administración.

## Solución

### Paso 1: Acceder a Supabase SQL Editor

1. Ve a https://app.supabase.com
2. Inicia sesión con tu cuenta
3. Selecciona tu proyecto Ownly
4. En el menú lateral, click en **SQL Editor**

### Paso 2: Ejecutar el script

1. Click en **New query** (botón verde)
2. Copia y pega el siguiente script:

```sql
-- Make danilamp@dlminvesting.com an ADMIN user
DO $$
DECLARE
  user_exists BOOLEAN;
  user_record RECORD;
BEGIN
  -- Check if user exists in users table
  SELECT EXISTS(SELECT 1 FROM users WHERE email = 'danilamp@dlminvesting.com') INTO user_exists;
  
  IF user_exists THEN
    -- User exists, update role to admin
    UPDATE users 
    SET role = 'admin', 
        updated_at = NOW()
    WHERE email = 'danilamp@dlminvesting.com';
    
    RAISE NOTICE 'User danilamp@dlminvesting.com updated to ADMIN role';
  ELSE
    -- User doesn't exist, check if they have a Supabase auth account
    SELECT au.id, au.email, au.created_at
    INTO user_record
    FROM auth.users au
    WHERE au.email = 'danilamp@dlminvesting.com';
    
    IF FOUND THEN
      -- Create user with admin role
      INSERT INTO users (email, supabase_user_id, role, status, created_at)
      VALUES (
        user_record.email,
        user_record.id,
        'admin',
        'active',
        user_record.created_at
      );
      
      RAISE NOTICE 'User danilamp@dlminvesting.com created with ADMIN role';
    ELSE
      RAISE EXCEPTION 'User danilamp@dlminvesting.com not found in Supabase auth.users. Please register first.';
    END IF;
  END IF;
END $$;

-- Verify the change
SELECT id, email, role, status, created_at, updated_at
FROM users
WHERE email = 'danilamp@dlminvesting.com';

-- Log the role change
INSERT INTO role_change_log (user_id, old_role, new_role, changed_by, reason, changed_at)
SELECT 
  id,
  'user',
  'admin',
  id,
  'Initial admin setup',
  NOW()
FROM users
WHERE email = 'danilamp@dlminvesting.com'
ON CONFLICT DO NOTHING;
```

3. Click en **Run** (botón verde en la esquina inferior derecha)

### Paso 3: Verificar el resultado

Deberías ver un resultado como:

```
NOTICE: User danilamp@dlminvesting.com updated to ADMIN role
```

Y una tabla mostrando tu usuario con `role = 'admin'`:

| id | email | role | status | created_at | updated_at |
|----|-------|------|--------|------------|------------|
| ... | danilamp@dlminvesting.com | admin | active | ... | ... |

### Paso 4: Cerrar sesión y volver a iniciar

1. En la app de Ownly, haz click en **Salir**
2. Inicia sesión nuevamente con `danilamp@dlminvesting.com`
3. Ahora deberías tener acceso completo como ADMIN

## Verificación

Para verificar que funcionó:

1. Inicia sesión en https://ownly-weld.vercel.app
2. Deberías ver todas las páginas en el menú:
   - ✅ Verificación KYC
   - ✅ Mis Credenciales
   - ✅ Mis Documentos
   - ✅ Verificador
   - ✅ Admin (cuando esté implementado)

## Troubleshooting

### Error: "User not found in Supabase auth.users"

Esto significa que no has registrado la cuenta `danilamp@dlminvesting.com` en Supabase Auth.

**Solución:**
1. Ve a https://ownly-weld.vercel.app/register
2. Registra la cuenta con email y contraseña
3. Luego ejecuta el script SQL nuevamente

### Error: "relation 'users' does not exist"

Esto significa que no has ejecutado las migraciones RBAC.

**Solución:**
1. Ejecuta primero: `ownly-backend/api/database/migration-rbac-schema.sql`
2. Luego ejecuta: `ownly-backend/api/database/migration-rbac-data.sql`
3. Finalmente ejecuta: `ownly-backend/api/database/make-admin.sql`

### El rol no se actualiza en el frontend

**Solución:**
1. Cierra sesión completamente
2. Borra el localStorage del navegador (F12 → Application → Local Storage → Clear)
3. Inicia sesión nuevamente

## Archivos relacionados

- Script SQL: `ownly-backend/api/database/make-admin.sql`
- Migración de schema: `ownly-backend/api/database/migration-rbac-schema.sql`
- Migración de datos: `ownly-backend/api/database/migration-rbac-data.sql`
