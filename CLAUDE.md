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
| Mapa | MapLibre GL + OpenFreeMap. Proveedor de rutas A → B pendiente (Mapbox vs openrouteservice) |
| Email | Brevo |
| Pruebas | Playwright + @axe-core/playwright; Lighthouse CI; Vitest se añade con la primera lógica en `src/lib` |

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
  content/             specs de scooters con esquema validado (feat/datos)
  lib/                 lógica pura en TS: puntuación, autonomía real, percentiles, formato de precios; sin DOM, con pruebas
functions/             Cloudflare Pages Functions: publicar, alertas (lo único con secretos)
supabase/migrations/   SQL versionado: tablas y políticas RLS
tests/                 Playwright (UX/a11y) y pruebas unitarias de src/lib
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

1. `npm run validate` = `astro check` + build + Playwright/axe. Tiene que pasar en verde.
2. Cada página nueva se añade a `PAGES` en `tests/ux.spec.ts`: así se prueba en 375, 768 y 1280 px, en claro y oscuro, contra WCAG 2.2 AA.
3. Toda lógica nueva en `src/lib` lleva su prueba unitaria.
4. Cambios visuales: verlos en el navegador a 375 y 1280 px, en ambos temas.
5. En el CI corren además Lighthouse (accesibilidad ≥ 95, SEO ≥ 90, buenas prácticas ≥ 90), `npm audit`, Gitleaks y CodeQL. Lighthouse no arranca en Windows en local: se valida en el CI.

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

- `main` = producción. Solo entra por Pull Request con el CI en verde. Nunca push directo, nunca force push.
- Una rama `feat/*` por función, creada desde `main` (tabla y dependencias en `README.md`). Cambios de configuración o documentación: `chore/*`.
- Commits pequeños y descriptivos en español.
