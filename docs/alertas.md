# Alertas de precio

Un visitante deja su correo, el modelo y, si quiere, un precio objetivo. Confirma por correo (doble opt-in) y,
cada vez que se publican precios desde `/admin`, recibe un aviso si el precio llegó a su objetivo (o, sin
objetivo, si bajó). Los correos enlazan **solo a la web** (la ficha del modelo y la baja); nunca a Mercado Libre.

## Piezas

| Pieza | Qué hace |
|---|---|
| `src/components/AlertaForm.astro` | Formulario: correo, modelo, precio objetivo opcional, consentimiento obligatorio y Turnstile (se carga solo cuando el formulario se ve). Úsalo con `<AlertaForm id="alerta-ficha" slug={slug} />` |
| `src/components/AlertaPopup.astro` | Popup de salida en `Layout.astro`: exit-intent en escritorio; en móvil, 60 % de scroll o 45 s. Máximo una vez cada 7 días (`localStorage`). No sale en `/admin`, `/aviso-de-privacidad` ni `/alertas/*` |
| `POST /api/alertas` | Valida (zod), verifica Turnstile, guarda con `confirmado = false` y el SHA-256 de un token aleatorio de 32 bytes, envía la confirmación. Misma respuesta (202) exista o no el correo |
| `GET /api/alertas/confirmar?t=` | Confirma la alerta de ese token. Siempre redirige a `/alertas/confirmada` |
| `GET /api/alertas/baja?t=` | Borra la alerta de ese token. Siempre redirige a `/alertas/baja` |
| `POST /api/publicar` | Tras el deploy hook llama a `enviarAvisos` (`functions/_lib/alertas.ts`) |
| `/modelos.json` | slug → nombre, generado en el build. Las funciones lo leen (binding `ASSETS`) para no confiar en el nombre que mande el cliente |
| `supabase/migrations/0002_alertas_avisos.sql` | Objetivo opcional, `ultimo_aviso_mxn`, vista `precios_ultimos_dos` y función `registrar_avisos` (solo `service_role`) |

Reglas de aviso (`precioParaAvisar` en `src/lib/alertas.ts`): solo alertas confirmadas y modelos disponibles;
con objetivo, precio ≤ objetivo; sin objetivo, precio menor que la captura anterior; nunca dos avisos por el
mismo precio. Primero se registra y luego se envía: si Brevo falla se pierde ese aviso, pero nunca se repite.

El token rota en cada aviso (solo guardamos su hash, así que cada correo nuevo necesita uno nuevo): el enlace de
baja que vale es el del último correo. El de la confirmación también sirve para darse de baja.

Límites por correo (en el código): 20 alertas por correo como máximo y, si una alerta sin confirmar se vuelve a
pedir, el correo de confirmación se reenvía como mucho una vez por hora. Una alerta ya confirmada no se toca.

## Variables

| Variable | Dónde | Para qué |
|---|---|---|
| `PUBLIC_TURNSTILE_SITE_KEY` | Build (pública) | Widget de Turnstile. Sin ella el formulario se ve pero el servidor lo rechaza |
| `TURNSTILE_SECRET_KEY` | Secreto de Cloudflare Pages | Verificar el token en el servidor |
| `BREVO_API_KEY` | Secreto de Cloudflare Pages | Enviar correos |
| `BREVO_SENDER_EMAIL` | Variable de Cloudflare Pages | Remitente verificado en Brevo |
| `PUBLIC_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` | Ya existen (`docs/supabase.md`) | Leer y escribir `alertas` |

Sin alguna de ellas, `/api/alertas` responde 500 genérico y `publicar` sigue funcionando sin enviar avisos.

## Puesta en marcha (cuando haya cuentas)

1. **Supabase**: aplica `0002_alertas_avisos.sql` igual que la 0001 (`docs/supabase.md` §3).
2. **Turnstile** (Cloudflare → Turnstile → Add widget): dominio de producción (y el de staging), modo *Managed*.
   Copia la site key a `PUBLIC_TURNSTILE_SITE_KEY` y la secret key a `TURNSTILE_SECRET_KEY`.
3. **Brevo**: verifica el dominio (SPF, DKIM y DMARC) y el remitente, crea una API key y **desactiva el
   seguimiento de clics y aperturas** en los correos transaccionales (el aviso de privacidad no contempla rastreo).
4. **Rate limiting** (Cloudflare → Security → WAF → Rate limiting rules, gratis 1 regla):
   - Si `URI Path` es igual a `/api/alertas` y `Request Method` es `POST`.
   - Contar por IP: **5 peticiones cada 10 minutos**; acción *Block* durante 10 minutos.
   - El límite por correo no se puede hacer con la regla (el correo va en el body): lo hace el endpoint (arriba).

## CSP

`public/_headers` añade `https://challenges.cloudflare.com` a `script-src` (el script de Turnstile) y a
`frame-src` (su iframe), lo que pide la [documentación de Turnstile](https://developers.cloudflare.com/turnstile/reference/content-security-policy/).
Nada más. Los dos scripts nuevos inline (formulario y popup) llevan su hash, que `tests/csp.spec.ts` comprueba.

## Pendiente

- Ponerlo en la ficha `/scooter/[slug]` cuando exista en `desarrollo`: `<AlertaForm id="alerta-ficha" slug={scooter.slug} />`.
- Los filtros de enlaces de algunos correos corporativos abren los links solos: pueden confirmar (o dar de baja)
  sin que la persona haga clic. Si se nota, cambiar `confirmar` y `baja` a una página con un botón que haga POST.
- El aviso puede llegar unos minutos antes de que la web reconstruida muestre el precio nuevo.
