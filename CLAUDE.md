@AGENTS.md
@docs/seguridad.md

# Reglas del proyecto (aplican en cada sesión)

Comparador de scooters eléctricos para todo México, monetizado con el Programa de Afiliados de
Mercado Libre. Plan y decisiones: `PLAN.md`. Ramas: `README.md`. Diseño: `design-system/webafiliados/MASTER.md`.
El nombre de la marca no está decidido: vive solo en `src/config.ts` (`SITE.name`).

Si una petición choca con estas reglas, dilo y pregunta antes de saltártelas.

## 1. Reglas de Mercado Libre (romperlas puede cerrar la cuenta de afiliado)

- Nunca scraping ni acceso automatizado a Mercado Libre: ni precios, ni fotos, ni comprobar links. Los precios se capturan a mano en `/admin`.
- Links de afiliado tal cual: sin acortadores ni redirecciones propias, con `rel="sponsored nofollow noopener"`, y siempre un clic voluntario (nada de popups, iframes o capas que redirijan solos).
- Nunca links de afiliado en emails: los emails enlazan a la web.
- Sin "Mercado" ni "Libre" en nombre, dominio o logo. Solo productos nuevos. Aviso de afiliado visible.
- Fotos: del fabricante o propias, nunca copiadas de Mercado Libre.
- Publicidad pagada solo en Instagram, TikTok, Facebook y Pinterest; nunca Google, Bing ni YouTube Ads.
- Comisión de scooters (Deportes y Fitness): 10 % directa, 5 % indirecta (tabla del 02/02/2026).

## 2. Stack fijo (no cambiar ni añadir piezas sin preguntar)

| Capa | Tecnología |
|---|---|
| Runtime | Node 22.23+ (CI usa 24) |
| Framework | Astro 7, salida estática, TypeScript strict |
| Estilos | Tailwind CSS 4 vía `@tailwindcss/vite`; configuración CSS-first en `src/styles/global.css` (no hay `tailwind.config`) |
| Fuentes | Archivo Black + Archivo Variable, self-hosted con @fontsource |
| Interactividad | `<script>` de Astro con TypeScript vanilla. **Sin React/Vue/Svelte** salvo acuerdo explícito |
| Hosting | Cloudflare Pages + Pages Functions (`functions/`). **No Vercel** (su plan gratis no es comercial) |
| Datos | Specs de scooters en el repo (content collections); precios, historial y alertas en Supabase (Postgres + Auth + RLS) |
| Mapa | MapLibre GL + OpenFreeMap. Rutas y buscador de direcciones con Mapbox detrás de `functions/_lib/rutas.ts` (licencia por confirmar: `docs/mapa.md`) |
| Email | Brevo (+ Cloudflare Turnstile en el formulario) |
| Pruebas | Vitest (`tests/unit`), Playwright + @axe-core/playwright, comprobación de CSP (`scripts/check-csp.mjs`), Lighthouse CI |

Presupuesto $0 salvo el dominio: nada de servicios de pago. No añadir una dependencia para algo que
se resuelve en pocas líneas. Antes de usar APIs de Astro, Supabase o MapLibre, consulta su documentación
actual (Context7 si está instalado; si no, la documentación oficial): Astro 7 es más nuevo que lo que conoces.

## 3. Arquitectura de código

```
src/
  config.ts            nombre de marca y navegación (único lugar)
  styles/global.css    tokens, variante dark, componentes base (.btn, .card, .label, .container-page) y animaciones
  layouts/Layout.astro head, tema, header, footer
  components/          componentes .astro reutilizables (Icon.astro = iconos Lucide inline)
  pages/               rutas (file routing de Astro)
  content/scooters/    16 modelos (JSON, esquema en src/content.config.ts); linkAfiliado y foto los pone el dueño
  content/guias/       guías en Markdown
  lib/                 lógica pura en TS: puntuación, autonomía real, percentiles, recomendar, comparar, precios, historial; sin DOM, con pruebas
functions/api/         Cloudflare Pages Functions: publicar, alertas (alta/confirmar/baja), ruta, geocode (lo único con secretos)
functions/_lib/        helpers de las funciones (alertas, proveedor de rutas)
supabase/migrations/   SQL versionado (0001 tablas + RLS, 0002 avisos de alertas); pgTAP en supabase/tests/
scripts/check-csp.mjs  verifica que el CSP de public/_headers permita todos los scripts inline del build
tests/                 Playwright (UX/a11y, PAGES una por línea) y tests/unit (Vitest)
docs/                  seguridad, supabase, alertas, mapa, legal: guías de configuración y pendientes
design-system/         MASTER.md: fuente de verdad del diseño
```

- Estático por defecto: los precios se hornean en el build; "Publicar" en `/admin` dispara un deploy hook. La web pública no consulta la base de datos.
- La lógica de negocio va en `src/lib` como funciones puras; las páginas solo la llaman y pintan.
- Seguridad: seguir `docs/seguridad.md` (cargado arriba) en todo lo que toque `/admin`, Supabase, `functions/`, formularios o emails.

## 4. Patrones de diseño ("Asfalto")

- Colores solo por tokens de Tailwind (`bg-bg`, `bg-surface`, `bg-surface-2`, `text-fg`, `text-muted`, `border-line`, `bg-accent`, `text-on-accent`, `text-accent-ink`, `text-good`, `text-bad`). Nunca hex sueltos en componentes; la única excepción es la cinta, que siempre es tinta (#111) porque naranja sobre crema no pasa contraste.
- Nunca texto blanco sobre naranja; usar `text-on-accent`. Naranja como texto sobre papel: `text-accent-ink`.
- Titulares: `font-display`, mayúsculas, tracking negativo, line-height 0.86–0.95. Etiquetas: clase `.label`.
- Componentes base: `.btn` + `.btn-ink` / `.btn-outline` / `.btn-accent`; `.card` + `.card-lift`; `.container-page`.
- Esquinas rectas y bordes de 2px. Pills solo para badges pequeños.
- Animaciones: `.slam`, `.sticker`, `.rise-num`, `.marquee`, `.grow-x`. Todas se desactivan con `prefers-reduced-motion`. Hover y press de 150–200 ms.
- Iconos con `Icon.astro` (Lucide), nunca emoji.
- Mobile-first: sin scroll horizontal a 375px, botones de 44px o más, contraste de 4.5:1 o más, foco visible. Revisar siempre en claro y en oscuro.
- Textos en español de México, tono directo. Ningún dato inventado: si falta, un placeholder visible (`[PRECIO]`). Todo precio va con su fecha de verificación.

## 5. Pruebas (obligatorias antes de cada PR)

1. `npm run validate` = `astro check` + Vitest + build + `check:csp` + Playwright/axe. Tiene que pasar en verde.
2. Cada página nueva se añade a `PAGES` en `tests/ux.spec.ts`, **una por línea al final**: así se prueba en 375, 768 y 1280 px, en claro y oscuro, contra WCAG 2.2 AA.
3. Toda lógica nueva en `src/lib` o `functions/` lleva su prueba unitaria; los endpoints, pruebas que demuestran que fallan cuando deben.
4. Si añades o cambias un `<script>` inline, `npm run check:csp` te dice qué hash falta en `public/_headers`. El servidor de preview ignora `_headers`: sin esta comprobación, un hash faltante solo rompe en producción.
5. Cambios visuales: verlos a 375 y 1280 px, en ambos temas.
6. En el CI corren además Lighthouse (10 páginas autodetectadas; las `noindex` van en `autodiscoverUrlBlocklist` de `lighthouserc.json`), `npm audit`, Gitleaks y CodeQL. Lighthouse no arranca en Windows en local: se valida en el CI.
7. Si `npm ci` falla en Windows con EPERM, hay un `astro dev` abierto bloqueando archivos: `npx astro dev stop`.

## 6. Revisión con skills

| Cuándo | Qué usar |
|---|---|
| Página o componente nuevo | Skill `ui-ux-pro-max` (instalada en `.claude/skills`): `--domain ux` / `landing` / `--stack astro`. El design system ya está persistido: no regenerarlo con `--force` sin preguntar |
| Antes de un PR con UI | `web-design-guidelines` e Impeccable si están instalados |
| Animaciones | Skills de Emil Kowalski si están instaladas; si no, las reglas de la sección 4 |
| Antes de cada PR | `/code-review` o `ponytail:ponytail-review` sobre el diff |
| Cambios en auth, `/admin`, Supabase/RLS, `functions/`, formularios o emails | Skill `security-audit` y `/security-review` antes de abrir el PR |
| Antes de lanzar | Strix contra staging, nunca contra producción ni sitios de terceros |
| Contexto de sesiones anteriores | claude-mem si está instalado |

Si una skill de la tabla no está instalada, sigue sin ella y dilo.

## 7. Git

- Flujo: `feat/*` → PR a **`desarrollo`** (integración) → el dueño abre el PR `desarrollo` → `main` (producción). Ninguna sesión abre PRs ni hace merge hacia `main`.
- `main` y `desarrollo` están protegidas: solo entran por Pull Request con el CI en verde. Nunca push directo, nunca force push.
- Una rama `feat/*` por función (tabla y dependencias en `README.md`). Cambios de configuración o documentación: `chore/*`.
- Cierre de cada rama: `git merge origin/desarrollo` → `npm run validate` → push → `gh pr create --base desarrollo` → `gh pr merge --auto --squash`. GitHub fusiona solo si pasan las 5 revisiones requeridas.
- Conflictos: son casi siempre en archivos compartidos (`tests/ux.spec.ts`, `public/_headers`, `.env.example`, `package.json`). Se resuelven conservando ambas partes. `tests/ux.spec.ts` tiene `merge=union` en `.gitattributes` para merges locales, pero GitHub igual marca el PR como conflictivo: hay que hacer el merge local y empujar. Cada vez que entra un PR, los demás abiertos pueden volver a chocar.
- `gh` está en el PATH vía `~/bin/gh` (envoltorio de `C:\Program Files\GitHub CLI\gh.exe`). Las reglas de permiso del usuario (`~/.claude/settings.json`) permiten push a `feat/*` y PRs/auto-merge hacia `desarrollo`, y bloquean push a `main`/`desarrollo`, force push y PRs a `main`.
- Commits pequeños y descriptivos en español.

## 8. Estado y cómo seguir

El estado al día, lo hecho y lo pendiente están en `PLAN.md` → "Estado". Para trabajar varias funciones a la vez, una
sesión coordinadora lanza una sesión por rama en su propio worktree; cada una empieza con
`git fetch origin && git reset --hard origin/desarrollo` (el worktree puede nacer de `main`) y termina con el cierre de la sección 7.
