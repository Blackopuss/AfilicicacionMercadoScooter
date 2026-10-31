# Mapa de autonomía (`/mapa`)

La persona escribe "Desde" y "Hasta" y elige una de las direcciones que sugiere Photon; la web pide la ruta en bici a
nuestras Pages Functions y compara la distancia con la autonomía real de cada scooter (`autonomiaReal` + `alcance` en
`src/lib/`). Si la función de rutas responde 503 (sin token de Mapbox), la distancia se **estima** en línea recta
(haversine) × `FACTOR_DESVIO` (1.3), se dibuja como línea punteada y la página dice que es estimada. La persona
siempre puede escribir sus km a mano.

| Pieza | Archivo |
|---|---|
| Página y mapa (MapLibre + OpenFreeMap, se descarga solo al dibujar una ruta) | `src/pages/mapa.astro` |
| "¿Llega? ¿Cuánto sobra?", validación de coordenadas, respuesta de Photon → sugerencias, distancia estimada | `src/lib/mapa.ts` |
| Buscador de direcciones: combobox ARIA que consulta Photon desde el navegador | `src/pages/mapa.astro` |
| `GET /api/ruta?desde=lon,lat&hasta=lon,lat` (dentro de México, caché 5 min) | `functions/api/ruta.ts` |
| Proveedor detrás de la interfaz `ProveedorRutas` + controles de seguridad | `functions/_lib/rutas.ts` |

## Configuración

- `MAPBOX_TOKEN`: token público de Mapbox (`pk.…`) con solo los scopes por defecto. Va como **Secret** en Cloudflare
  Pages (Settings → Variables and Secrets), nunca con prefijo `PUBLIC_` ni en el repo. Restringirlo por URL no
  sirve aquí (las llamadas salen del servidor), así que el límite real son las reglas de abajo.
- Sin token, `/api/ruta` responde **503** y la página estima la distancia en línea recta (ver arriba).
- Regla de Cloudflare (Security → WAF → Rate limiting, plan gratis): `/api/*`, por ejemplo 30 peticiones por minuto
  por IP. Así nadie gasta la cuota gratis de Mapbox desde fuera del navegador.

## Buscador de direcciones: Photon (revisado el 30/10/2026)

- `https://photon.komoot.io/api/?q=…&limit=5&bbox=<MEXICO_BBOX>`: OpenStreetMap, gratis, sin cuenta ni clave. El
  navegador lo llama directo (está en `connect-src` de `public/_headers`), así que no gasta nada nuestro ni pasa por
  `functions/`.
- Sin `lang`: la instancia pública responde **400** a `lang=es` (lo probamos el 30/10/2026). Sin el
  parámetro usa el `Accept-Language` del navegador y cae al nombre local, que en México ya está en español.
- Uso justo (su web: "please be fair - extensive usage will be throttled"; sin límite numérico ni garantía de
  disponibilidad): debounce de 250 ms, mínimo 3 letras, se cancela la petición anterior y no se pide nada al cargar.
  Si algún día hace falta más, Photon es software libre (Apache 2.0) y se puede montar una instancia propia.
- Se descarta lo que cae fuera del recuadro de México o trae otro `countrycode` (el recuadro toca Guatemala, Belice y
  EE. UU.).
- Atribución visible bajo los campos: "Búsqueda: Photon · © colaboradores de OpenStreetMap".
- Privacidad: lo que se escribe va a komoot; está declarado en el aviso de privacidad. No lo guardamos.

## Proveedor de rutas: conclusión (revisado el 30/10/2026)

- **Mapbox Directions** (perfil `cycling`, prioriza ciclovías): 100 000 peticiones/mes gratis. Devuelve distancia
  (m), duración (s) y geometría. **No da desnivel** en bici, así que `desnivelM` va `null` y "con subidas" lo marca
  la persona.
- **Mapbox Geocoding v6** se descartó: su documentación dice que las respuestas solo se pueden usar "in conjunction
  with a Mapbox map" y nuestro mapa es MapLibre + OpenFreeMap. Por eso el buscador es Photon y `/api/geocode` ya no
  existe.
- Los términos de producto de Mapbox (PDF del 20/10/2026) no se pudieron leer (403). Sus términos generales piden
  licencia adicional para uso comercial "cuando lo requieran los términos": **confirmar con Mapbox antes de lanzar**.
- openrouteservice tenía la web principal caída (sus páginas de planes y términos daban 404).

Antes de lanzar: o se confirma por escrito con Mapbox que trazar rutas sobre un mapa que no es de Mapbox está
permitido en un sitio comercial, o se cambia de proveedor de rutas. Cambiarlo solo toca `mapbox()` en
`functions/_lib/rutas.ts` (o un segundo proveedor con la misma interfaz).

## Seguridad (docs/seguridad.md §3)

`/api/ruta`: solo `GET` (405), rechaza `Origin` ajeno y `Sec-Fetch-Site` cruzado (403), URL ≤ 512 caracteres
(414), parámetros exactos sin extras y validados (400), token ausente (503), errores del proveedor genéricos (502)
con el detalle solo en los logs. Las URLs a Mapbox se arman con valores ya validados: nunca se reenvía una URL del
usuario. Pruebas en `tests/unit/mapa.test.ts`.
