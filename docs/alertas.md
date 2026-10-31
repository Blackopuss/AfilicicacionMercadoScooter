# Alertas de precio

Un visitante deja su correo, el modelo y, si quiere, un precio objetivo. Confirma por correo (doble opt-in) y,
cada vez que se publican precios desde `/admin`, recibe un aviso si el precio llegó a su objetivo (o, sin
objetivo, si bajó). Los correos enlazan **solo a la web** (la ficha del modelo y la baja); nunca a Mercado Libre.

## Piezas

| Pieza | Qué hace |
|---|---|
| `src/components/AlertaForm.astro` | Formulario: correo, modelo, precio objetivo opcional, consentimiento obligatorio y Turnstile (se carga solo cuando el formulario se ve). En la ficha: `<AlertaForm id="alerta-ficha" slug={s.slug} />` (sección `#alerta`) |
| `src/components/AlertaPopup.astro` | Popup de salida en `Layout.astro`: exit-intent en escritorio; en móvil, 60 % de scroll o 45 s. Máximo una vez cada 7 días (`localStorage`). No sale en `/admin`, `/aviso-de-privacidad` ni `/alertas/*` |
| `POST /api/alertas` | Valida (zod), verifica Turnstile, guarda con `confirmado = false` y el SHA-256 de un token aleatorio de 32 bytes, envía la confirmación. Misma respuesta (202) exista o no el correo |
| `/alertas/confirmar/#t=`, `/alertas/dar-de-baja/#t=` | Páginas a las que enlazan los correos (`noindex`). Abrirlas no cambia nada: un botón (`AlertaToken.astro`) manda el token por POST |
| `POST /api/alertas/confirmar` | Body `t=<token>`. Confirma la alerta de ese token. Siempre redirige a `/alertas/confirmada` |
| `POST /api/alertas/baja` | Body `t=<token>`. Borra la alerta de ese token. Siempre redirige a `/alertas/baja` |
| `POST /api/publicar` | Tras el deploy hook llama a `enviarAvisos` (`functions/_lib/alertas.ts`) |
| `/modelos.json` | slug → nombre, generado en el build. Las funciones lo leen (binding `ASSETS`) para no confiar en el nombre que mande el cliente |
| `supabase/migrations/0002_alertas_avisos.sql` | Objetivo opcional, `ultimo_aviso_mxn`, vista `precios_ultimos_dos` y función `registrar_avisos` (solo `service_role`) |

Reglas de aviso (`precioParaAvisar` en `src/lib/alertas.ts`): solo alertas confirmadas y modelos disponibles;
con objetivo, precio ≤ objetivo; sin objetivo, precio menor que la captura anterior; nunca dos avisos por el
mismo precio. Primero se registra y luego se envía: si Brevo falla se pierde ese aviso, pero nunca se repite.

### Confirmar y darse de baja: siempre con un clic (POST)

Los filtros de enlaces de algunos correos corporativos abren los links solos. Por eso un GET nunca modifica nada:

- Los correos enlazan a `/alertas/confirmar/#t=` y `/alertas/dar-de-baja/#t=`. Son rutas nuevas porque
  `/alertas/confirmada` y `/alertas/baja` ya son las páginas de resultado (y los enlaces viejos y marcadores
  apuntan ahí): el verbo es la acción pendiente, el participio o sustantivo, el resultado.
- El token va en el **fragmento** (`#t=`): el navegador no lo manda al servidor al abrir el enlace, ni queda en
  los logs, ni viaja en el `Referer`. El script de la página lo copia a un campo oculto del formulario.
- El botón hace `POST` al endpoint (mismo origen; el CSP ya tiene `form-action 'self'`). El endpoint sigue
  `docs/seguridad.md` §3: método (405), `Origin` igual al del sitio (403), body de 1 KB como mucho (413), solo
  el campo `t` con la regex `TOKEN` y, válido o no, el mismo 303 a la página genérica.
- `GET /api/alertas/confirmar?t=` y `GET /api/alertas/baja?t=` (correos ya enviados) solo redirigen a la página
  del botón con el token en el fragmento.
- Esas dos páginas llevan `Referrer-Policy: same-origin` (`public/_headers`) y no cargan nada externo. No
  `no-referrer`: con esa política el navegador manda el POST del formulario con `Origin: null` y el endpoint lo
  rechazaría. Como el token va en el fragmento, nunca está en el `Referer` de todas formas.

Sin `List-Unsubscribe` / `List-Unsubscribe-Post` (RFC 8058) por ahora: solo lo exigen Gmail y Yahoo a quien
envía más de 5000 correos al día, abriría un POST sin `Origin` (el cliente de correo no lo manda) y cada correo
necesita su propio token en esa cabecera. Ver "Pendiente".

El token rota en cada aviso (solo guardamos su hash, así que cada correo nuevo necesita uno nuevo): el enlace de
baja que vale es el del último correo. El de la confirmación también sirve para darse de baja.

Límites por correo (en el código, contra el bombardeo de correos a un tercero): 20 alertas por correo y 3 sin
confirmar como máximo; si una alerta sin confirmar se vuelve a pedir, la confirmación se reenvía como mucho una
vez cada 24 h. Una alerta ya confirmada no se toca.

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

- Baja en un clic desde el cliente de correo (`List-Unsubscribe` + `List-Unsubscribe-Post`, RFC 8058) si el
  volumen se acerca a 5000 correos al día. Esos POST llegan sin `Origin`: aceptarlos solo en `baja`, con el token
  en la URL de la cabecera y el body exacto `List-Unsubscribe=One-Click`. Confirmar antes que Brevo admita
  cabeceras distintas por destinatario en `messageVersions`.
- El aviso puede llegar unos minutos antes de que la web reconstruida muestre el precio nuevo.
