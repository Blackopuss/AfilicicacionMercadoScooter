# Plan de implementación: web de afiliados de scooters eléctricos

Comparador de scooters eléctricos para todo México, con historial de precios, mapa de autonomía
A → B, quiz recomendador y guías. Monetiza con el Programa de Afiliados de Mercado Libre
(10 % venta directa, 5 % indirecta en Deportes y Fitness, tabla vigente desde 02/02/2026).

## Estado (31/10/2026)

**Fases 1-8 terminadas y publicadas en producción** (https://comparador-scooters-mx.pages.dev), con todas las revisiones del CI en verde. Validación integrada:
0 errores de tipos, 133 pruebas unitarias y 390 de UX/accesibilidad; CSP correcto en todas las páginas.

| Función | PR | Notas |
|---|---|---|
| Base, diseño Asfalto, CI | #2 (a `main`) | |
| Datos: 16 modelos, lógica, Supabase + RLS | #4 | specs solo de páginas oficiales; `linkAfiliado` y `foto` en `null` |
| Legales, 404, robots, `_headers` (CSP) | #3 | aviso de privacidad con placeholders |
| Panel `/admin` (OTP + MFA), Publicar, historial | #7 | |
| Quiz | #6 | resultado enlazable por URL |
| Mapa A → B + respaldo por km | #5 | proveedor Mapbox por confirmar |
| Comparador, fichas, cómo puntuamos, top 3 en home | #8 | |
| Alertas de precio y popup de salida | #10 | doble opt-in, Turnstile, Brevo |
| Guías, A vs B, `/mejores`, sitemap, JSON-LD | #11 | |

### Hecho con el dueño (31/10/2026)

- Web publicada en Cloudflare Pages: https://comparador-scooters-mx.pages.dev (proyecto `comparador-scooters-mx`, rama `main`).
- Supabase: proyecto `scooters-mx` (https://amtcmshxqulhgifzhnvu.supabase.co), migraciones 0001 y 0002 aplicadas, registro público cerrado, MFA TOTP, admin por `app_metadata.role`. Variables y deploy hook en Pages.
- Catálogo de México: 26 modelos (Segway, iScooter, Honey Whale) con `linkAfiliado` de meli.la, fotos oficiales (`docs/fotos.md`) y fuentes (`docs/fuentes-specs/`).
- Buscador de direcciones de `/mapa` con Photon; sin Mapbox la distancia se estima.

### Pendiente del dueño (no lo puede hacer Claude)

1. **Capturar precios** en `/admin` y pulsar Publicar. Sin precios no hay historial, bajadas de la semana ni alertas.
2. **Dominio**: comprarlo, nameservers en Cloudflare, añadirlo como *Custom domain* en Pages, cambiar `SITE_URL` y la *Site URL* y *Redirect URLs* de Supabase. Con el dominio, crear la regla de rate limiting de `/api/*` (`*.pages.dev` no admite reglas).
3. **Después de la regla de rate limiting** (no antes: sin ella cualquiera gasta la cuota llamando a la API sin navegador):
   - Mapbox para la ruta por calles (`docs/mapa.md`); confirmar antes su licencia sobre un mapa MapLibre en un sitio comercial.
   - Brevo + Turnstile para las alertas de precio (`docs/alertas.md`). Brevo también sirve como SMTP de Supabase para que el correo de acceso a `/admin` traiga el código.
4. **Legal** (`docs/legal.md`): llenar los placeholders del aviso de privacidad y que lo revise un abogado antes de captar emails. Régimen fiscal con un contador.
5. **Programa de afiliados**: declarar la web y las redes como Medios.
6. **Al fusionar `desarrollo` → `main`**: usar *Rebase and merge*. Con *merge commit* hay que sincronizar `desarrollo` con un PR `chore/sync-main` antes del siguiente.

### Siguiente trabajo técnico

- QA final (fase 9): revisión visual hecha el 30/10/2026. Falta Impeccable / `web-design-guidelines` si se instalan y Strix contra staging.
  Ojo: Astro borra el salto de línea entre un texto y la etiqueta o `{variable}` que sigue ("Fuente:" + enlace sale "Fuente:enlace"); poner `{' '}` al final de la línea.
- Datos sin fuente: `potenciaPicoW` en 3 modelos y `proteccionIP` en 2.
- Cloudflare Web Analytics: el CSP ya lo permite (`docs/seguridad.md` §5); falta activarlo en el panel de Cloudflare. Los clics en links de afiliado los cuenta `/api/clic` (migración 0003, panel `/admin`).

## Decisiones tomadas

| Tema | Decisión |
|---|---|
| Estilo | Modo oscuro y claro (sigue al sistema + interruptor). Estética de webs virales en TikTok: tipografía enorme, bento grid, animaciones al hacer scroll, que entre por los ojos |
| Nombre | **RSCOOT** (`SITE.name` en `src/config.ts`) |
| Alcance | Todo México por igual |
| Catálogo inicial | 15-20 modelos, solo productos nuevos de tiendas oficiales o reputación verde/amarilla |
| v1 incluye | Comparador, ficha por modelo, historial de precios, mapa de autonomía A → B, quiz, guías/blog |
| Emails | Popup de salida con alertas de precio ("avísame cuando baje") |
| Hosting | Cloudflare Pages (gratis y permite uso comercial). **No Vercel**: su plan gratis es solo no comercial |
| Dominio | Comprado en Hostinger, con los nameservers apuntando a Cloudflare |

## Competencia (revisada el 29/10/2026)

**[scooterbest.com](https://scooterbest.com/categoria-todoterreno.html)**: España, solo Amazon.
- Sin precios ni fechas en las tarjetas.
- Puntuaciones /10 sin explicar.
- Solo 3 productos por categoría y menús duplicados.
- Lo aprovechable: categorías (urbano, todoterreno, plegable, larga autonomía) y una página "Cómo elegimos".

**[versus.com](https://versus.com/es/electric-scooter)**: el grande. Global, 257 scooters.
- Lo que hace bien (y vamos a adoptar):
  - Puntuación 0-100 con página "cómo puntuamos".
  - **"Supera al X % de los modelos"** en cada especificación.
  - Páginas **"A vs B"** (enorme fuente de tráfico SEO).
  - "Alternativas más baratas".
  - Filtros por especificación.
  - Alerta "avísame por debajo de $X".
- Sus debilidades en México (nuestra oportunidad):
  - Solo Amazon, sin Mercado Libre, y la mayoría de modelos sin precio en MXN.
  - Precios mexicanos visiblemente erróneos (scooters "desde $553").
  - El ranking premia scooters de 50 kg y 200 km que casi nadie compra en México.
  - Cero contexto local: autonomía de fabricante, sin rutas, pendientes ni ciudades.
  - Pensada para escritorio (filtros en barra lateral), traducida, sin personalidad.

**Nuestro posicionamiento**: *el comparador de scooters que puedes comprar hoy en México, con su
precio real de hoy y su historial*.
- Solo modelos disponibles en Mercado Libre México.
- Precio verificado a mano cada día, con fecha.
- Autonomía real (no la del fabricante) y mapa A → B.
- Quiz para decidir.
- Diseño mobile-first pensado para TikTok.

## Stack (todo con plan gratis)

| Pieza | Herramienta |
|---|---|
| Web | Astro (páginas estáticas + componentes interactivos donde haga falta) + Tailwind CSS |
| Hosting y funciones | Cloudflare Pages + Pages Functions (para ocultar API keys) |
| Base de datos y login del panel | Supabase (Postgres, login por enlace mágico solo a tu email, Row Level Security) |
| Mapa | MapLibre + OpenFreeMap |
| Rutas A → B | Buscador de direcciones con Photon (OpenStreetMap, gratis y sin clave, desde el navegador). Ruta con Mapbox Directions (perfil ciclismo) detrás de `functions/_lib/rutas.ts`; licencia por confirmar (`docs/mapa.md`). Sin token, `/mapa` estima la distancia en línea recta × 1.3 y lo dice |
| Gráficas de precio | SVG propio sin dependencias (`HistorialPrecio.astro`) |
| Emails | Brevo (plan gratis) |
| Analítica | Cloudflare Web Analytics (sin cookies) |

## Cómo se actualizan los precios

1. Entras a `/admin` (solo tu email puede iniciar sesión).
2. Ves la lista de scooters con un botón para abrir cada link de Mercado Libre.
3. Escribes el precio de hoy y marcas si hay stock. Se **guarda como registro nuevo**, no sobrescribe: así se forma el historial.
4. Pulsas "Publicar": una función de Cloudflare comprueba que eres tú y lanza un nuevo build.
   La web pública sigue siendo estática (rápida, buena para SEO, sin consultas a la base de datos).
5. Si un precio bajó por debajo del objetivo de alguien, se envía su alerta por email.

Nada automatizado contra Mercado Libre: ni scraping, ni comprobación automática de links.

## Datos

- **scooters**: marca, modelo, slug, autonomía del fabricante (km), velocidad máx., potencia (W),
  batería (Wh), peso, carga máxima, rueda, protección IP, plegable, suspensión, frenos,
  pendiente máx., fotos (de prensa del fabricante o propias, nunca de Mercado Libre),
  link de afiliado, tipo de vendedor, activo.
- **precios**: scooter, precio, fecha, disponible.
- **alertas**: email, scooter, precio objetivo, confirmado (doble opt-in), token de baja.
- **guías**: archivos Markdown dentro del proyecto (no en la base de datos).

**Autonomía real estimada** = autonomía del fabricante × factor de uso real × factor de peso.
La fórmula se muestra en la web para que sea honesta, y se ajusta con el tiempo.

## Páginas

| Ruta | Contenido |
|---|---|
| `/` | Hero llamativo, CTA al quiz, "bajadas de precio de la semana", teaser del mapa |
| `/comparar` | Tabla con filtros y orden; comparar 2-3 modelos lado a lado con barra fija |
| `/scooter/[slug]` | Ficha, puntuación 0-100, "supera al X %" por especificación, gráfica de historial, "precio más bajo en 30 días", autonomía real, alternativas más baratas, botón "Ver en Mercado Libre", alerta de precio |
| `/comparar/[a]-vs-[b]` | Generadas automáticamente para cada par de modelos (20 modelos = 190 páginas): ganador por especificación, diferencia de precio, cuál conviene a quién |
| `/mejores/[categoria]` | Urbano, todoterreno, plegable, larga autonomía, para personas de más de 100 kg, por menos de $10 000… |
| `/como-puntuamos` | Fórmula de la puntuación y de la autonomía real, a la vista |
| `/quiz` | 5 preguntas → 3 recomendaciones + tarjeta de resultado para compartir en redes |
| `/mapa` | Eliges scooter, origen y destino: ¿llegas o no?, con la ruta por calles |
| `/guias`, `/guias/[slug]` | Artículos |
| `/como-ganamos-dinero` | Aviso de links de afiliado |
| `/aviso-de-privacidad` | Obligatorio por los emails (LFPDPPP) |
| `/admin` | Panel privado (noindex) |

## Reglas de Mercado Libre que el código debe respetar

- Links de afiliado tal cual: sin acortadores ni redirecciones propias. `rel="sponsored nofollow"`.
- El usuario siempre hace clic a propósito: nada de popups o iframes que lleven solos a Mercado Libre.
- Los emails nunca llevan links de afiliado, solo links a tu web.
- Nada de Google Ads, Shopping ni YouTube Ads. La publicidad pagada solo en Instagram, TikTok, Facebook y Pinterest.
- Sin "Mercado" ni "Libre" en el nombre, el dominio o el logo.
- Solo productos nuevos.
- Aviso visible de que usas links de afiliado.

## Skills por fase

- **Diseño**: `ui-ux-pro-max` (design system persistido en `design-system/`) + `taste-skill`
  (aquí sí encaja: no hay paleta fija y buscas impacto visual).
- **Código**: Context7 para la documentación al día de Astro, Supabase y MapLibre.
- **Componentes**: Magic (21st.dev) para secciones vistosas.
- **Animación**: skills de Emil Kowalski, respetando `prefers-reduced-motion`.
- **Revisión**: Impeccable, `web-design-guidelines`, Playwright en 375/768/1280 px y en los dos modos.
- **Seguridad**: Strix contra un entorno de pruebas, sobre todo el panel y las alertas.

## Fases

| # | Fase | Resultado |
|---|---|---|
| 0 | **Preparación (tú)** | Nombre elegido, dominio comprado, cuentas en GitHub, Cloudflare, Supabase y Brevo; redes de la marca con 5-10 videos; solicitud al programa de afiliados |
| 1 | Base | Proyecto Astro, design system, tokens claro/oscuro, header, footer, despliegue en Cloudflare con tu dominio |
| 2 | Datos | Tablas y seguridad en Supabase, los 15-20 scooters capturados |
| 3 | Comparador y fichas | `/comparar` y `/scooter/[slug]` con datos reales, puntuación, percentiles, `/como-puntuamos` |
| 4 | Panel e historial | `/admin`, guardado diario, gráfica y botón "Publicar" |
| 5 | Quiz | `/quiz` con tarjeta para compartir |
| 6 | Mapa A → B | Elegir el proveedor de rutas, `/mapa` |
| 7 | Alertas y popup | Doble opt-in, envío con Brevo, baja en un clic, aviso de privacidad |
| 8 | Guías y SEO | Páginas "A vs B" y `/mejores/[categoria]`, 3-5 guías iniciales, sitemap, datos estructurados, imágenes para redes |
| 9 | QA | Playwright, Impeccable, guidelines, Lighthouse, Strix |
| 10 | Lanzamiento | Declarar la web en el programa, videos apuntando a la web |

## Costo

Unos $300 MXN al año (dominio). Todo lo demás en plan gratis.

## Pendiente

Ver "Estado" al inicio: pendientes del dueño y siguiente trabajo técnico.
