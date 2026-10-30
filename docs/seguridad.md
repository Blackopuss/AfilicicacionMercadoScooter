# Patrones de seguridad (obligatorios)

Aplican a todo código que toque `/admin`, Supabase, `functions/`, formularios o emails. Están basados en
OWASP Top 10 (2021) y OWASP API Security Top 10 (2023), aterrizados a este stack.

## Superficie de ataque

| Pieza | Riesgo principal |
|---|---|
| Web pública (estática) | XSS, clickjacking, cabeceras débiles |
| `/admin` (cliente con Supabase Auth) | Acceso no autorizado, robo de sesión |
| API REST de Supabase (la anon key es **pública** por diseño) | Leer o escribir tablas sin permiso si falla RLS |
| `functions/` (Pages Functions) | Endpoints sin auth, inyección, abuso masivo |
| Alertas de precio (emails) | Datos personales expuestos, spam, enumeración de emails |

Regla de oro: **todo lo que hay en el navegador es público y manipulable**. La seguridad vive en RLS y en `functions/`, nunca en ocultar botones o rutas.

## 1. Autenticación del panel (A07)

- Solo inicio de sesión por enlace mágico u OTP de Supabase. **Registro público desactivado** en Supabase (Auth → Sign In / Providers → "Allow new users to sign up" apagado). Si no, cualquiera crea cuenta y queda "autenticado".
- **MFA (TOTP) obligatorio** para la cuenta admin. Las políticas de escritura exigen `aal2`.
- Ser admin se decide por `app_metadata.role = 'admin'` (solo editable desde el servidor) o por una tabla `admins`. **Nunca** por `user_metadata` ni por nada que mande el cliente: el usuario puede editarlo.
- En el servidor, la identidad se obtiene verificando el JWT (`supabase.auth.getUser(token)`), nunca leyendo la sesión sin verificar ni un `user_id` del body.

## 2. Autorización: que cada dato sea de quien debe (A01 / API1 BOLA, IDOR)

- **RLS activado y forzado en todas las tablas** (`enable` + `force row level security`). Sin política = nadie accede (denegar por defecto).
- Políticas separadas por operación (`select`, `insert`, `update`, `delete`). Nunca `using (true)` en escritura.
- Patrón de escritura admin:
  ```sql
  create policy "admin escribe precios" on precios for insert to authenticated
    with check ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin' and (auth.jwt() ->> 'aal') = 'aal2');
  ```
- Lectura pública solo de lo que se publica (specs, precios). **La tabla `alertas` no tiene ningún acceso con la anon key**: solo `functions/` con la service key.
- Nunca confiar en un ID que manda el cliente para decidir de quién es un registro. Lo que pertenece a un suscriptor se gestiona con un **token aleatorio de 32 bytes** (guardado como hash SHA-256) en los enlaces de confirmar y darse de baja, nunca con un ID secuencial.
- Funciones de Postgres: `security invoker` por defecto. Si alguna necesita `security definer`, con `set search_path = ''` y comprobando el rol dentro.

## 3. Endpoints en `functions/` (API2, API4, API5, API8)

Cada endpoint, en este orden:

1. **Método permitido** (405 si no).
2. **Origen**: rechaza `Origin` distinto de tu dominio. CORS sin `*`.
3. **Autenticación** si es de admin: `Authorization: Bearer <jwt>` verificado (401). Usar header y no cookie también evita CSRF.
4. **Autorización**: rol admin + `aal2` (403).
5. **Validación** del body con esquema estricto (`astro/zod`, ya incluido en Astro): tipos, rangos, longitudes, sin campos extra. Precio: entero en pesos > 0 y < 200 000. Link de afiliado: `https:` y host en lista blanca (dominios de Mercado Libre México). 400 si falla.
6. **Límite de tamaño** del body (por ejemplo 10 KB) y **rate limiting**: regla de Cloudflare para `/api/*` y Turnstile (gratis) en formularios públicos.
7. Errores genéricos al cliente (`{ "error": "..." }`), sin stack ni detalles de la base de datos. El detalle va a los logs.

Otras reglas:
- La service key de Supabase, el deploy hook y la API key de Brevo solo como secretos de Cloudflare, nunca con prefijo `PUBLIC_` ni en el repo.
- Nunca hacer `fetch` a una URL que venga del usuario (SSRF). Nunca endpoints de redirección abierta.

## 4. Inyección y XSS (A03)

- Solo el cliente de Supabase con parámetros. Nunca SQL armado concatenando strings.
- Astro escapa por defecto. `set:html` solo con constantes del código (como `Icon.astro`), **nunca** con datos de la base de datos, del usuario o de la URL.
- Nada de `innerHTML` con datos dinámicos en los `<script>`: usar `textContent`.

## 5. Cabeceras de seguridad (A05)

Archivo `public/_headers` de Cloudflare Pages, a crear con el primer despliegue:

```
/*
  Content-Security-Policy: default-src 'self'; script-src 'self' 'sha256-<hash del script de tema>'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self'; connect-src 'self' https://<proyecto>.supabase.co; frame-ancestors 'none'; base-uri 'self'; form-action 'self'
  Strict-Transport-Security: max-age=63072000; includeSubDomains; preload
  X-Content-Type-Options: nosniff
  Referrer-Policy: strict-origin-when-cross-origin
  Permissions-Policy: camera=(), microphone=(), geolocation=(self)
/admin/*
  X-Robots-Tag: noindex, nofollow
  Cache-Control: no-store
```

El CSP se ajusta cuando entren el mapa (tiles), Brevo o Turnstile: añadir solo los dominios exactos.

## 6. Datos personales y emails (LFPDPPP)

- Guardar solo el email, el scooter y el precio objetivo. Doble opt-in y baja en un clic.
- La respuesta de "suscribirse" es la misma exista o no el email (evita la enumeración).
- Rate limit por IP y por email, y Turnstile en el formulario.
- Aviso de privacidad publicado antes de captar el primer email.

## 7. Configuración, dependencias y registro (A05, A06, A08, A09)

- Antes de cada despliegue, revisar el **Security Advisor de Supabase**: sin tablas sin RLS ni funciones inseguras.
- Exponer en la API de Supabase solo el esquema `public`.
- `npm ci` con lockfile; dependencias nuevas justificadas; `npm audit`, Dependabot, Gitleaks y CodeQL en el CI.
- Tabla `auditoria` (solo inserción, solo funciones): quién publicó, cuándo y cuántos precios cambiaron. Revisar los logs de Auth ante inicios de sesión raros.

## 8. Pruebas de seguridad obligatorias

Toda tabla o endpoint nuevo llega con pruebas que demuestran que **sí falla** cuando debe:

- Con la anon key: no puede leer `alertas`, ni escribir en `precios`, ni en ninguna tabla.
- Con un usuario autenticado que no es admin: no puede escribir (403 o fila rechazada por RLS).
- Endpoint sin token → 401; con token sin admin → 403; body inválido o enorme → 400 o 413; método incorrecto → 405.
- `/admin` sin sesión no muestra datos (Playwright).
- Token de baja inventado o usado de otro suscriptor → no hace nada.

Antes del PR: skill `security-audit` + `/security-review`. Antes de lanzar: Strix contra staging.
