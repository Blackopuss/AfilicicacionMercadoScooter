# Comparador de scooters eléctricos (México)

Comparador de los scooters eléctricos que se pueden comprar hoy en México: precio verificado a mano
cada día, historial de precios, autonomía real, mapa A → B y quiz. Monetiza con el Programa de
Afiliados de Mercado Libre. Plan completo: [PLAN.md](PLAN.md). Diseño: [design-system/webafiliados/MASTER.md](design-system/webafiliados/MASTER.md).

## Stack

Astro 7 + Tailwind CSS 4, desplegado en Cloudflare Pages. Más adelante: Supabase (panel e historial),
MapLibre (mapa) y Brevo (alertas).

## Comandos

| Comando | Qué hace |
|---|---|
| `npm install` | Instala dependencias (Node 22.23+) |
| `npm run dev` | Servidor local en `localhost:4321` |
| `npm run build` | Build de producción en `dist/` |
| `npm run check` | Revisión de tipos (`astro check`) |
| `npm run test:ux` | Pruebas UX y accesibilidad (requiere `npx playwright install chromium` la primera vez) |
| `npm run validate` | Todo lo anterior, igual que el CI |

## Ramas

- **`main`** = producción. Lo que entra a `main` se despliega. Nadie hace push directo: todo entra por Pull Request con el CI en verde.
- **`feat/*`** = una rama por función, creada desde `main`. Al terminar se abre un PR hacia `main`.

| Rama | Función | Depende de |
|---|---|---|
| `feat/datos` | Modelo de datos de scooters (specs en el repo) y Supabase (precios) | — |
| `feat/comparador-fichas` | `/comparar`, `/scooter/[slug]`, puntuación y percentiles | `feat/datos` |
| `feat/panel-historial` | `/admin`, guardado diario de precios, gráfica de historial | `feat/datos` |
| `feat/quiz` | `/quiz` y tarjeta para compartir | `feat/datos` |
| `feat/mapa-rutas` | `/mapa` con ruta A → B | `feat/datos` |
| `feat/alertas-popup` | Popup de salida y alertas de precio por email | `feat/panel-historial` |
| `feat/guias-seo` | Guías, páginas "A vs B", `/mejores/[categoria]`, sitemap | `feat/comparador-fichas` |
| `feat/paginas-legales` | Aviso de privacidad, cómo ganamos dinero, cómo puntuamos | — |

Cuando una rama depende de otra, se fusiona primero la base y luego se actualiza la dependiente con `main`.

## Validaciones automáticas (en cada PR y en `main`)

| Revisión | Herramienta |
|---|---|
| Tipos y build | `astro check`, `astro build` |
| UX y accesibilidad en 375 / 768 / 1280 px, modo claro y oscuro | Playwright + axe (WCAG 2.2 AA), sin scroll horizontal, tamaño de botones y links |
| Accesibilidad ≥ 95, SEO ≥ 90, buenas prácticas ≥ 90 | Lighthouse CI |
| Vulnerabilidades en dependencias | `npm audit` (high o superior) + Dependabot semanal |
| Secretos filtrados (API keys, tokens) | Gitleaks |
| Seguridad del código | CodeQL (`security-extended`) |

## Reglas de Mercado Libre que el código respeta

Sin scraping ni acceso automatizado a Mercado Libre, sin acortadores de links, sin links de afiliado en
emails, sin popups que redirijan solos, `rel="sponsored nofollow"` en los links y aviso de afiliado visible.
