# Mapa de autonomía (`/mapa`)

La persona escribe "Desde" y "Hasta"; la web pide la ruta en bici a nuestras Pages Functions y compara la distancia
con la autonomía real de cada scooter (`autonomiaReal` + `alcance` en `src/lib/`). Si las funciones no están
disponibles, la misma cuenta se hace con los km que escriba a mano.

| Pieza | Archivo |
|---|---|
| Página y mapa (MapLibre + OpenFreeMap, se descarga solo al dibujar una ruta) | `src/pages/mapa.astro` |
| "¿Llega? ¿Cuánto sobra?" y validación de coordenadas | `src/lib/mapa.ts` |
| `GET /api/geocode?q=` (≤ 120 caracteres, solo México, `no-store`) | `functions/api/geocode.ts` |
| `GET /api/ruta?desde=lon,lat&hasta=lon,lat` (dentro de México, caché 5 min) | `functions/api/ruta.ts` |
| Proveedor detrás de la interfaz `ProveedorRutas` + controles de seguridad | `functions/_lib/rutas.ts` |

## Configuración

- `MAPBOX_TOKEN`: token público de Mapbox (`pk.…`) con solo los scopes por defecto. Va como **Secret** en Cloudflare
  Pages (Settings → Variables and Secrets), nunca con prefijo `PUBLIC_` ni en el repo. Restringirlo por URL no
  sirve aquí (las llamadas salen del servidor), así que el límite real son las reglas de abajo.
- Sin token, las dos funciones responden **503** y la página manda a la persona al cálculo por km.
- Regla de Cloudflare (Security → WAF → Rate limiting, plan gratis): `/api/*`, por ejemplo 30 peticiones por minuto
  por IP. Así nadie gasta la cuota gratis de Mapbox desde fuera del navegador.

## Proveedor de rutas: conclusión (revisado el 30/10/2026)

- **Mapbox Directions** (perfil `cycling`, prioriza ciclovías): 100 000 peticiones/mes gratis. Devuelve distancia
  (m), duración (s) y geometría. **No da desnivel** en bici, así que `desnivelM` va `null` y "con subidas" lo marca
  la persona.
- **Mapbox Geocoding v6 (temporal)**: 100 000/mes gratis, pero su documentación dice que las respuestas solo se
  pueden usar "in conjunction with a Mapbox map" y que los resultados temporales no se pueden guardar (por eso
  `/api/geocode` va con `no-store`). Nuestro mapa es MapLibre + OpenFreeMap: **choca con esa condición**.
- Los términos de producto de Mapbox (PDF del 20/10/2026) no se pudieron leer (403). Sus términos generales piden
  licencia adicional para uso comercial "cuando lo requieran los términos": **confirmar con Mapbox antes de lanzar**.
- openrouteservice tenía la web principal caída (sus páginas de planes y términos daban 404).

Antes de lanzar: o se confirma por escrito con Mapbox que geocodificar y trazar rutas sobre un mapa que no es de
Mapbox está permitido en un sitio comercial, o se cambia el buscador de direcciones a otro proveedor. Cambiarlo solo
toca `mapbox()` en `functions/_lib/rutas.ts` (o un segundo proveedor con la misma interfaz).

## Seguridad (docs/seguridad.md §3)

Cada función: solo `GET` (405), rechaza `Origin` ajeno y `Sec-Fetch-Site` cruzado (403), URL ≤ 512 caracteres
(414), parámetros exactos sin extras y validados (400), token ausente (503), errores del proveedor genéricos (502)
con el detalle solo en los logs. Las URLs a Mapbox se arman con valores ya validados: nunca se reenvía una URL del
usuario. Pruebas en `tests/unit/mapa.test.ts`.
