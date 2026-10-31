# Fuentes de las specs: iScooter

Revisado el 2026-10-30. Orden de fuentes: ficha de la tienda oficial de México (`iscooter.com.mx`) → sitio
global (`iscooterglobal.com`) → manual oficial (PDF enlazado desde
[iscooterglobal.com/pages/user-manuals](https://www.iscooterglobal.com/pages/user-manuals)). Ningún dato sale
de Mercado Libre. Todas las fuentes de abajo son del fabricante; no hizo falta usar reseñas ni videos.

Marcas:

- **⚠ decisión**: la fuente no da el dato tal cual y el campo no admite `null`, o las fuentes oficiales chocan; se explica la decisión.
- **⚠ variante**: el dato sale de la versión de EE. UU., que no es idéntica a la que vende la tienda de México.

Rangos ("25-30 km", "6-7 h", "20-25 %") se registran con el valor alto, que es el que publica el fabricante como máximo.
`bateriaWh` se calcula como voltios × amperios-hora cuando la fuente no da los Wh.

Fuentes abreviadas:

| Clave | URL |
|---|---|
| MX-iX7 | https://iscooter.com.mx/products/ix7-pro-patineta-electrica-todoterreno-de-2000w |
| GL-iX7 | https://www.iscooterglobal.com/products/iscooter-ix7-pro-off-road-electric-scooter |
| MAN-iX7 | https://cdn.shopify.com/s/files/1/0732/5640/3225/files/iX7_Pro_Manual_US_V03_240614.pdf |
| MX-iX3 | https://iscooter.com.mx/products/ix3-patinete-electrico-todo-terreno-de |
| GL-iX3 | https://www.iscooterglobal.com/products/iscooter-ix3-800w-25mph-off-road-electric-scooter |
| MX-i8 | https://iscooter.com.mx/products/i8-scooter-electrico-plegable-para-adultos-500w |
| GL-i8 | https://www.iscooterglobal.com/products/i8-electric-scooter-350w-for-adults-and-teens |
| MAN-i8 | https://cdn.shopify.com/s/files/1/0732/5640/3225/files/i8_Manual_US_V02_240302_compressed.pdf |
| MX-i9 | https://iscooter.com.mx/products/scooter-electrico-patin-i9-250w-25km-h-36v-con-app-iscooter |
| GL-i9 | https://www.iscooterglobal.com/products/i9-electric-scooter-for-adult-with-bag |
| MAN-i9 | https://cdn.shopify.com/s/files/1/0732/5640/3225/files/i9_instructions.pdf |
| MX-F2 | https://iscooter.com.mx/products/f2-patinete-electrico-con-asiento-y-neumatico-de-10-pulgadas |
| GL-F2 | https://www.iscooterglobal.com/products/f2-electric-scooter-with-seat-10-pneumatic-tire |

## iX7 Pro (`iscooter-ix7-pro`)

| Campo | Valor | Fuente |
|---|---|---|
| autonomiaFabricanteKm | 80 | MX-iX7 |
| velocidadMaxKmh | 60 | MX-iX7 |
| potenciaW | 2000 | MX-iX7 ("Capacidad del motor 2000W"); MAN-iX7 "1000 W x2". **⚠ decisión**: GL-iX7 la llama "Peak 2000W" y ninguna fuente publica la potencia nominal; como el campo no admite `null`, va la cifra que anuncia la tienda de México |
| potenciaPicoW | 2000 | GL-iX7 ("Peak 2000W motor drive") |
| bateriaWh | 840 | MX-iX7 (48 V 17.5 Ah); GL-iX7 dice "840Wh" |
| voltajeV | 48 | MX-iX7 |
| pesoKg | 30 | GL-iX7 ("Net weight 65.5lbs (30kg)"); MX no lo da |
| cargaMaxKg | 150 | MX-iX7 |
| ruedaPulgadas | 10 | MX-iX7 |
| tipoRueda | tubeless | MX-iX7 ("Neumáticos sin cámara"); GL-iX7 y MAN-iX7 "10\" Off-Road Tubeless Tires". Nota: ambas tiendas venden una cámara de 10" "para iX3/iX7 Pro" |
| proteccionIP | IPX4 | GL-iX7 |
| plegable | true | GL-iX7 ("Easy 3 steps folding") |
| suspension | doble | GL-iX7 ("Dual front and rear suspension") |
| frenos | Disco delantero y trasero + freno electrónico | MAN-iX7 / GL-iX7 |
| pendienteMaxPct | 25 | GL-iX7 ("25% hill climb") |
| tiempoCargaH | 10 | GL-iX7 ("8-10 H"). **⚠ decisión**: MX-iX7 dice "4 h", pero con el cargador oficial de 54.6 V 2 A una batería de 840 Wh no carga en 4 h; se usa la cifra del sitio global, que corresponde a la batería de 840 Wh |
| categorias | todoterreno, larga-autonomia | specs (llanta todoterreno, 80 km) |

Variante: GL-iX7 y MAN-iX7 listan 48 V 15 Ah en su tabla; la tienda de México vende 48 V 17.5 Ah (840 Wh, igual que el texto de GL-iX7). Se usa lo de México.

## iX3 (`iscooter-ix3`)

| Campo | Valor | Fuente |
|---|---|---|
| autonomiaFabricanteKm | 45 | MX-iX3 |
| velocidadMaxKmh | 40 | MX-iX3 |
| potenciaW | 800 | MX-iX3 ("800 W pico"). **⚠ decisión**: ninguna fuente oficial publica la potencia nominal; el campo no admite `null`, así que repite la de pico |
| potenciaPicoW | 800 | MX-iX3 / GL-iX3 ("Peak Motor: 800W") |
| bateriaWh | 480 | MX-iX3 (48 V 10 Ah); GL-iX3 "480Wh" |
| voltajeV | 48 | MX-iX3 |
| pesoKg | 22 | GL-iX3 tabla de specs ("Net Weight 48.5 lbs (22 kg)"). **⚠ decisión**: el encabezado de la misma página dice "52.2 LBS" (23.7 kg); se usa la tabla de specs |
| cargaMaxKg | 120 | MX-iX3 |
| ruedaPulgadas | 10 | MX-iX3 |
| tipoRueda | tubeless | GL-iX3 ("10\" Off-Road Tubeless Pneumatic Tyres"); MX-iX3 dice "Neumática Todo Terreno" |
| proteccionIP | IPX4 | GL-iX3 |
| plegable | true | MX-iX3 ("Diseño plegable de tres etapas") |
| suspension | doble | MX-iX3 ("Amortiguadores dobles delanteros y traseros") |
| frenos | Disco mecánico delantero y trasero + freno electrónico | GL-iX3 |
| pendienteMaxPct | 25 | GL-iX3 ("Max Gradient: 20–25%") |
| tiempoCargaH | 7 | GL-iX3 ("6-7 Hours") |
| categorias | todoterreno | specs (llanta todoterreno, doble suspensión) |

## i8 (`iscooter-i8`)

| Campo | Valor | Fuente |
|---|---|---|
| autonomiaFabricanteKm | 30 | MX-i8 ("25-30 KM") |
| velocidadMaxKmh | 30 | MX-i8 |
| potenciaW | 500 | MX-i8 |
| potenciaPicoW | null | sin fuente |
| bateriaWh | 216 | MX-i8 (36 V 6 Ah) |
| voltajeV | 36 | MX-i8 |
| pesoKg | 12 | MX-i8 ("El peso neto es de 12 kg") |
| cargaMaxKg | 100 | MX-i8 |
| ruedaPulgadas | 8.5 | MX-i8 |
| tipoRueda | neumatica | MX-i8 ("Neumático Pneumático") |
| proteccionIP | IP54 | GL-i8 / MAN-i8. **⚠ variante** (versión de 350 W) |
| plegable | true | MX-i8 ("Diseño Plegable") |
| suspension | ninguna | GL-i8 ("Shock absorption /"). **⚠ variante** |
| frenos | Freno electrónico delantero y disco trasero | MX-i8 |
| pendienteMaxPct | 15 | MAN-i8 ("Max. Slope 15%"). **⚠ variante**. GL-i8 dice "15°" y MX-i8 habla de "pendientes de 0 a 15 grados"; se toma el 15 % del manual, que es la cifra más conservadora |
| tiempoCargaH | 6 | GL-i8 / MAN-i8 ("5-6 h"). **⚠ variante**: el de EE. UU. trae batería de 5.2 Ah y el de México de 6 Ah |
| categorias | urbano, plegable | specs (12 kg, rueda de 8.5") |

Variante: el i8 de EE. UU. (GL-i8, MAN-i8) es de 350 W, 25-29 km/h, 20 km y 36 V 5.2 Ah; el de México es de 500 W, 30 km/h, 25-30 km y 36 V 6 Ah. Comparten peso (12 kg), carga (100 kg) y rueda (8.5" neumática).

## i9 (`iscooter-i9`)

| Campo | Valor | Fuente |
|---|---|---|
| autonomiaFabricanteKm | 28 | MX-i9 |
| velocidadMaxKmh | 25 | MX-i9 |
| potenciaW | 350 | MX-i9; MAN-i9 "Nominal Power 350 W" |
| potenciaPicoW | null | sin fuente |
| bateriaWh | 270 | MX-i9 (36 V 7.5 Ah) |
| voltajeV | 36 | MX-i9 |
| pesoKg | 12 | MAN-i9 ("Net Weight 26.4 lbs/12 kg"). **⚠ decisión**: GL-i9 da 11 kg en su tabla y 13.4 kg en la comparativa de modelos; se usa el manual porque coincide con la versión de México (36 V 7.5 Ah, 120 kg, 25 km/h) |
| cargaMaxKg | 120 | MX-i9 |
| ruedaPulgadas | 8.5 | MX-i9 |
| tipoRueda | solida | MX-i9 ("Rueda de Panal"); GL-i9 "Honeycomb Tire" |
| proteccionIP | IP54 | MAN-i9 / GL-i9 |
| plegable | true | MX-i9 ("Plegable en 3 segundos") |
| suspension | ninguna | GL-i9 ("Suspension None") |
| frenos | EBAS delantero y disco trasero | GL-i9 ("Front Brakes EBAS electronic brake", "Rear disc brake") |
| pendienteMaxPct | 15 | MAN-i9 ("Max. Slope 15%") |
| tiempoCargaH | 6 | GL-i9 ("5-6h"); MAN-i9 "3-6 h" |
| categorias | urbano, plegable | specs (12 kg, plegable) |

Variante: la ficha de GL-i9 describe una versión de 30 km/h, 36 V 7.8 Ah y 100 kg; la de México es de 25 km/h, 7.5 Ah y 120 kg. Se usa lo de México.

## F2 (`iscooter-f2`)

| Campo | Valor | Fuente |
|---|---|---|
| autonomiaFabricanteKm | 30 | MX-F2 ("25-30 KM") |
| velocidadMaxKmh | 30 | MX-F2 |
| potenciaW | 500 | MX-F2 |
| potenciaPicoW | null | sin fuente |
| bateriaWh | 280.8 | MX-F2 (36 V 7.8 Ah) |
| voltajeV | 36 | MX-F2 |
| pesoKg | 17.5 | GL-F2 ("Net Weight 38.6 lbs(17.5kg)") |
| cargaMaxKg | 120 | MX-F2 |
| ruedaPulgadas | 10 | MX-F2 |
| tipoRueda | neumatica | GL-F2 ("Pneumatic tire"; incluye cámara de repuesto) |
| proteccionIP | null | ninguna fuente oficial lo publica |
| plegable | true | GL-F2 ("Foldable Yes") |
| suspension | ninguna | **⚠ decisión**: ni MX-F2 ni GL-F2 mencionan suspensión (la tabla de GL-F2 lista frenos, ruedas y asiento, sin amortiguadores); el campo no admite `null` |
| frenos | Doble freno de disco | GL-F2 ("Dual Disc Brake") |
| pendienteMaxPct | 15 | GL-F2 ("Max Slope 15%") |
| tiempoCargaH | 6 | GL-F2 ("5-6h") |
| categorias | urbano | specs (asiento, 17.5 kg) |

No hay manual del F2 en la página de manuales de iScooter.
