# Fotos de los modelos

Una foto por modelo en `src/assets/scooters/<slug>.webp`, enlazada desde el campo `foto` de su JSON
(`src/content/scooters/`). Astro la optimiza en el build (`<Picture>` de `astro:assets`, AVIF y WebP en varios anchos)
con el componente `src/components/FotoScooter.astro`; si `foto` es `null`, se muestra el placeholder "Foto pendiente".

## Origen

Son **fotos de prensa del fabricante**, tomadas de la galería de la ficha del producto en su tienda oficial de México
(la misma página de `fuenteSpecs`). Nunca de Mercado Libre, Amazon ni tiendas de terceros (regla del programa de
afiliados). Se eligió la foto de cuerpo completo con fondo blanco, del mismo modelo y variante de la ficha.

Cuidado con la tienda de iScooter México: parte de su galería son archivos copiados de Mercado Libre
(nombre `D_NQ_NP_…-MLM…`) o de Amazon (`…_AC_SL1500…`). No se usan: solo imágenes subidas con nombre propio.

Procesado: el original se bajó una sola vez del sitio del fabricante. Las de Honey Whale ya eran WebP y van tal cual;
las de Segway (PNG con fondo transparente se aplanaron sobre blanco) e iScooter se guardaron como WebP (calidad 90,
máximo 1600 px). La web la
pinta con `mix-blend-multiply` sobre una placa blanca (tema claro) o crema (tema oscuro) para que el blanco de la foto
se funda con el marco.

Fecha de descarga: 2026-10-30.

| Modelo | Archivo | Página de origen | Imagen de origen |
|---|---|---|---|
| Honey Whale E9 Max-N | [honey-whale-e9-max-n.webp](../src/assets/scooters/honey-whale-e9-max-n.webp) | https://honeywhale.com.mx/producto/scooter-electrico-honey-whale-e9-max-n/ | https://honeywhale.com.mx/wp-content/uploads/2026/04/scooter-electrico-honey-whale-e9-max-n-negro-01-1.webp |
| Honey Whale E9 Pro | [honey-whale-e9-pro.webp](../src/assets/scooters/honey-whale-e9-pro.webp) | https://honeywhale.com.mx/producto/e9-pro-scooter-electrico/ | https://honeywhale.com.mx/wp-content/uploads/2022/11/scooter-electrico-honey-whale-e9-pro-negro-01.webp |
| Honey Whale F50 | [honey-whale-f50.webp](../src/assets/scooters/honey-whale-f50.webp) | https://honeywhale.com.mx/producto/scooter-electrico-honey-whale-f50/ | https://honeywhale.com.mx/wp-content/uploads/2026/09/scooter-electrico-honey-whale-f50-1.webp |
| Honey Whale G2 Pro | [honey-whale-g2-pro.webp](../src/assets/scooters/honey-whale-g2-pro.webp) | https://honeywhale.com.mx/producto/scooter-electrico-honey-whale-g2-pro/ | https://honeywhale.com.mx/wp-content/uploads/2026/04/scooter-electrico-honey-whale-g2-pro-amarillo-01-1.webp |
| Honey Whale G3 Pro | [honey-whale-g3-pro.webp](../src/assets/scooters/honey-whale-g3-pro.webp) | https://honeywhale.com.mx/producto/scooter-electrico-honey-whale-g3-pro-blanco-negro/ | https://honeywhale.com.mx/wp-content/uploads/2026/04/scooter-electrico-honey-whale-g3-pro-negro-01-1.webp |
| Honey Whale G4 Max | [honey-whale-g4-max.webp](../src/assets/scooters/honey-whale-g4-max.webp) | https://honeywhale.com.mx/producto/scooter-electrico-honey-whale-g4-max/ | https://honeywhale.com.mx/wp-content/uploads/2026/04/scooter-electrico-honey-whale-g4-max-azul-01-1.webp |
| Honey Whale GT1 | [honey-whale-gt1.webp](../src/assets/scooters/honey-whale-gt1.webp) | https://honeywhale.com.mx/producto/scooter-electrico-honey-whale-gt1/ | https://honeywhale.com.mx/wp-content/uploads/2026/04/Scooter-Electrico-Honey-Whale-GT1-01-1.webp |
| Honey Whale H2 Dual Ultra | [honey-whale-h2-dual-ultra.webp](../src/assets/scooters/honey-whale-h2-dual-ultra.webp) | https://honeywhale.com.mx/producto/scooter-electrico-plegable-honey-whale-h2-dual-ultra/ | https://honeywhale.com.mx/wp-content/uploads/2026/04/Scooter-Electrico-Plegable-Honey-Whale-H2-Dual-Ultra-02.webp |
| Honey Whale H3 | [honey-whale-h3.webp](../src/assets/scooters/honey-whale-h3.webp) | https://honeywhale.com.mx/producto/scooter-electrico-honey-whale-h3-negro/ | https://honeywhale.com.mx/wp-content/uploads/2023/11/scooter-electrico-honey-whale-h3-negro-01.webp |
| Honey Whale H4 | [honey-whale-h4.webp](../src/assets/scooters/honey-whale-h4.webp) | https://honeywhale.com.mx/producto/scooter-electrico-honey-whale-h4-azul/ | https://honeywhale.com.mx/wp-content/uploads/2024/02/scooter-electrico-honey-whale-h4-azul-01.webp |
| Honey Whale M1 Lite | [honey-whale-m1-lite.webp](../src/assets/scooters/honey-whale-m1-lite.webp) | https://honeywhale.com.mx/producto/scooter-electrico-honey-whale-m1-lite-azul/ | https://honeywhale.com.mx/wp-content/uploads/2025/09/scooter-electrico-honey-whale-m1-lite-azul-01.webp |
| Honey Whale M1 Max | [honey-whale-m1-max.webp](../src/assets/scooters/honey-whale-m1-max.webp) | https://honeywhale.com.mx/producto/scooter-electrico-honey-whale-m1-max-negro-rojo/ | https://honeywhale.com.mx/wp-content/uploads/2026/04/scooter-electrico-honey-whale-m1-max-negro-rojo-01-1.webp |
| Honey Whale M2 Pro V2 | [honey-whale-m2-pro-v2.webp](../src/assets/scooters/honey-whale-m2-pro-v2.webp) | https://honeywhale.com.mx/producto/scooter-electrico-honey-whale-m2-pro-v2/ | https://honeywhale.com.mx/wp-content/uploads/2025/01/scooter-electrico-honey-whale-m2-pro-v2-azul-01.webp |
| Honey Whale S2 | [honey-whale-s2.webp](../src/assets/scooters/honey-whale-s2.webp) | https://honeywhale.com.mx/producto/scooter-electrico-honey-whale-s2-negro/ | https://honeywhale.com.mx/wp-content/uploads/2024/06/scooter-electrico-honey-whale-s2-negro-01.webp |
| Honey Whale T4A | [honey-whale-t4a.webp](../src/assets/scooters/honey-whale-t4a.webp) | https://honeywhale.com.mx/producto/scooter-electrico-honey-whale-t4-a/ | https://honeywhale.com.mx/wp-content/uploads/2023/08/scooter-electrico-honey-whale-t4a-01.webp |
| Honey Whale T4D | [honey-whale-t4d.webp](../src/assets/scooters/honey-whale-t4d.webp) | https://honeywhale.com.mx/producto/scooter-electrico-honey-whale-t4d/ | https://honeywhale.com.mx/wp-content/uploads/2026/04/scooter-electrico-honey-whale-t4d-amarillo-01-1.webp |
| Honey Whale T8 Max | [honey-whale-t8-max.webp](../src/assets/scooters/honey-whale-t8-max.webp) | https://honeywhale.com.mx/producto/scooter-electrico-honey-whale-t8-max/ | https://honeywhale.com.mx/wp-content/uploads/2026/04/scooter-electrico-honey-whale-t8-max-amarillo-01-1.webp |
| iScooter F2 | [iscooter-f2.webp](../src/assets/scooters/iscooter-f2.webp) | https://iscooter.com.mx/products/f2-patinete-electrico-con-asiento-y-neumatico-de-10-pulgadas | https://cdn.shopify.com/s/files/1/0878/3079/0459/files/1_5.jpg?v=1754640014 |
| iScooter i8 | [iscooter-i8.webp](../src/assets/scooters/iscooter-i8.webp) | https://iscooter.com.mx/products/i8-scooter-electrico-plegable-para-adultos-500w | https://cdn.shopify.com/s/files/1/0878/3079/0459/files/1_1f833738-712c-4e6d-ac3d-f18122a1f135.webp?v=1755588693 |
| iScooter i9 | [iscooter-i9.webp](../src/assets/scooters/iscooter-i9.webp) | https://iscooter.com.mx/products/scooter-electrico-patin-i9-250w-25km-h-36v-con-app-iscooter | https://cdn.shopify.com/s/files/1/0878/3079/0459/files/1_2_cceae8e9-3377-4f58-8c9c-7d2064adbef4.webp?v=1756461731 |
| iScooter iX3 | [iscooter-ix3.webp](../src/assets/scooters/iscooter-ix3.webp) | https://iscooter.com.mx/products/ix3-patinete-electrico-todo-terreno-de | https://cdn.shopify.com/s/files/1/0878/3079/0459/files/1.jpg?v=1773799825 |
| iScooter iX7 Pro | [iscooter-ix7-pro.webp](../src/assets/scooters/iscooter-ix7-pro.webp) | https://iscooter.com.mx/products/ix7-pro-patineta-electrica-todoterreno-de-2000w | https://cdn.shopify.com/s/files/1/0878/3079/0459/files/6.png?v=1754617201 |
| Segway E2 Plus II | [segway-e2-plus-ii.webp](../src/assets/scooters/segway-e2-plus-ii.webp) | https://store-mx.segway.com/ninebot-kickscooter-e2-plus-ii | https://store-mx.segway.com/media/catalog/product/cache/d3ec3723470ff918c92e447639eaf984/e/2/e2plusii0001_1.png |
| Segway E3 Pro | [segway-e3-pro.webp](../src/assets/scooters/segway-e3-pro.webp) | https://store-mx.segway.com/e3-pro-electric-scooter | https://store-mx.segway.com/media/catalog/product/cache/d3ec3723470ff918c92e447639eaf984/e/3/e3_-2_1.png |
| Segway Max G3 | [segway-max-g3.webp](../src/assets/scooters/segway-max-g3.webp) | https://store-mx.segway.com/ninebot-kickscooter-max-g3 | https://store-mx.segway.com/media/catalog/product/cache/d3ec3723470ff918c92e447639eaf984/3/_/3_4.jpg |
| Segway ZT3 Pro | [segway-zt3-pro.webp](../src/assets/scooters/segway-zt3-pro.webp) | https://store-mx.segway.com/segway-zt3-pro | https://store-mx.segway.com/media/catalog/product/cache/d3ec3723470ff918c92e447639eaf984/z/t/zt3_pro-2_1__1.png |

## Cambiar o añadir una foto

1. Baja la foto desde la ficha oficial del fabricante (o usa una propia). Confirma que es el mismo modelo y variante.
2. Guárdala como `src/assets/scooters/<slug>.webp` (fondo blanco o liso, de preferencia lateral o 3/4).
3. En el JSON pon `"foto": "../../assets/scooters/<slug>.webp"` (ruta relativa al JSON) y añade la fila a esta tabla.
