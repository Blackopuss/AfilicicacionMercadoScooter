# Configurar Supabase (precios, alertas y auditoría)

Las especificaciones de los scooters viven en el repo (`src/content/scooters/`). En Supabase solo van
los precios (con su historial), las alertas de precio y la auditoría. La web pública **no** consulta la
base en vivo: lee la vista `precios_actuales` durante el build. Si faltan las variables o Supabase no
responde, el build sigue y la web muestra "Precio pendiente".

Seguridad: todo sigue [`docs/seguridad.md`](seguridad.md). Resumen de la migración
[`supabase/migrations/0001_init.sql`](../supabase/migrations/0001_init.sql):

| Tabla / vista | anon (web pública) | usuario autenticado | admin con MFA (`aal2`) | `functions/` (service key) |
|---|---|---|---|---|
| `precios` | leer | leer | leer, insertar, corregir, borrar | todo |
| `precios_actuales` (vista) | leer | leer | leer | leer |
| `alertas` | nada | nada | nada | todo |
| `auditoria` | nada | nada | nada | solo insertar y leer |

## 1. Crear el proyecto (plan Free)

1. Entra a [supabase.com](https://supabase.com) → **New project**. Plan **Free**.
2. Región: la más cercana a México que ofrezca (por ejemplo, East US).
3. Guarda la contraseña de la base en tu gestor de contraseñas. No va en el repo.

## 2. Cerrar el registro público

**Authentication → Sign In / Providers**:

- Apaga **Allow new users to sign up**. Si queda encendido, cualquiera crea una cuenta y queda "autenticado".
- Deja activado el proveedor **Email** (inicio de sesión por enlace mágico u OTP). Ningún otro proveedor.

## 3. Aplicar la migración

Opción A (sin instalar nada): **SQL Editor → New query**, pega el contenido de
`supabase/migrations/0001_init.sql` y pulsa **Run**.

Opción B (CLI, deja registro de la migración):

```bash
npx supabase login
npx supabase link --project-ref <ref-del-proyecto>
npx supabase db push
```

Después, en **Project Settings → Data API**, confirma que el único esquema expuesto es `public`.

## 4. Crear tu usuario y marcarlo como admin

1. **Authentication → Users → Add user → Create new user** con tu email (el registro público está cerrado, así que se crea desde aquí).
2. En **SQL Editor**, marca el rol en `app_metadata` (solo se puede editar desde el servidor; nunca uses `user_metadata`, que el usuario puede cambiar):

   ```sql
   update auth.users
   set raw_app_meta_data = raw_app_meta_data || '{"role": "admin"}'
   where email = 'tu-email@ejemplo.com';
   ```

3. Cierra sesión y vuelve a entrar: el rol viaja dentro del JWT y solo se actualiza al iniciar sesión.

## 5. Activar MFA (obligatorio para escribir precios)

1. **Authentication → Multi-Factor** (o **Sign In / Providers → Multi-Factor**): activa **TOTP (App Authenticator)**.
2. Registra tu app de autenticación (Google Authenticator, 1Password, etc.) cuando el panel `/admin` lo pida.
   Sin el segundo factor la sesión es `aal1` y las políticas rechazan cualquier escritura.

## 6. Variables en Cloudflare Pages

**Workers & Pages → tu proyecto → Settings → Variables and secrets**, en *Production* y *Preview*:

| Variable | Dónde se saca | Tipo |
|---|---|---|
| `PUBLIC_SUPABASE_URL` | Project Settings → API → Project URL | Texto (es pública) |
| `PUBLIC_SUPABASE_ANON_KEY` | Project Settings → API Keys → `anon` (o la *publishable key*) | Texto (es pública) |

En local, copia `.env.example` a `.env` y rellénalo. La `service_role` key **nunca** lleva prefijo
`PUBLIC_` ni entra al repo: solo se usará como *secret* de Cloudflare cuando lleguen `functions/`.

## 7. Comprobar la seguridad

- **Advisors → Security Advisor**: sin avisos de tablas sin RLS ni vistas inseguras.
- Pruebas de RLS con pgTAP en `supabase/tests/database/rls.test.sql`. Necesitan Docker y la CLI:

  ```bash
  npx supabase init      # solo la primera vez, crea supabase/config.toml
  npx supabase start
  npx supabase test db
  ```

  Comprueban que anon no escribe ni lee alertas, que un usuario sin rol admin (o con un rol falso en
  `user_metadata`) no escribe, que un admin sin MFA no escribe y que la auditoría no se puede borrar.
