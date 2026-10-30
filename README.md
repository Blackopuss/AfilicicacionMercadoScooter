# Comparador de scooters eléctricos (México)

Comparador de los scooters eléctricos que se pueden comprar hoy en México: precio verificado a mano
cada día, historial de precios, autonomía real, mapa A → B y quiz. Monetiza con el Programa de
Afiliados de Mercado Libre. Plan completo: [PLAN.md](PLAN.md). Diseño: [design-system/webafiliados/MASTER.md](design-system/webafiliados/MASTER.md).

## Stack

Astro 7 + Tailwind CSS 4, desplegado en Cloudflare Pages. Specs de scooters en `src/content/scooters/`;
precios en Supabase ([docs/supabase.md](docs/supabase.md)). Más adelante: MapLibre (mapa) y Brevo (alertas).

## Comandos

| Comando | Qué hace |
|---|---|
| `npm install` | Instala dependencias (Node 22.23+) |
| `npm run dev` | Servidor local en `localhost:4321` |
| `npm run build` | Build de producción en `dist/` |
| `npm run check` | Revisión de tipos (`astro check`) |
| `npm run test:unit` | Pruebas unitarias de `src/lib` (Vitest) |
| `npm run test:ux` | Pruebas UX y accesibilidad (requiere `npx playwright install chromium` la primera vez) |
| `npm run validate` | Todo lo anterior, igual que el CI |

## Ramas

- **`main`** = producción. Lo que entra a `main` se despliega. Solo recibe el PR `desarrollo` → `main`, que abre el dueño del proyecto.
- **`desarrollo`** = integración. Aquí se unen las funciones terminadas y se prueba todo junto.
- **`feat/*`** = una rama por función. Al terminar se abre un PR hacia `desarrollo`.

Las dos ramas protegidas (`main` y `desarrollo`) solo aceptan Pull Requests con el CI en verde.

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

Cuando una rama depende de otra, se fusiona primero la base en `desarrollo` y luego se actualiza la dependiente con `desarrollo`.

## Validaciones automáticas (en cada PR a `desarrollo` o `main`)

| Revisión | Herramienta |
|---|---|
| Tipos, pruebas unitarias y build | `astro check`, Vitest, `astro build` |
| CSP permite todos los scripts inline | `npm run check:csp` |
| UX y accesibilidad en 375 / 768 / 1280 px, modo claro y oscuro | Playwright + axe (WCAG 2.2 AA), sin scroll horizontal, tamaño de botones y links |
| Accesibilidad ≥ 95, SEO ≥ 90, buenas prácticas ≥ 90 | Lighthouse CI |
| Vulnerabilidades en dependencias | `npm audit` (high o superior) + Dependabot semanal |
| Secretos filtrados (API keys, tokens) | Gitleaks |
| Seguridad del código | CodeQL (`security-extended`) |

## Reglas de Mercado Libre que el código respeta

Sin scraping ni acceso automatizado a Mercado Libre, sin acortadores de links, sin links de afiliado en
emails, sin popups que redirijan solos, `rel="sponsored nofollow"` en los links y aviso de afiliado visible.
