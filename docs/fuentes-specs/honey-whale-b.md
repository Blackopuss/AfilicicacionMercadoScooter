# Fuentes de specs: Honey Whale (lote B)

Nueve modelos de Honey Whale (la marca con la que KuKirin se vende en México). Consultado el 30/10/2026.
Los nueve están en la categoría "Scooters" de `honeywhale.com.mx`; ninguno lo clasifica el sitio como moto,
motobici ni trimoto.

Orden de fuentes:

1. **Ficha** del producto en `honeywhale.com.mx` (texto y tabla "Información adicional") y **tabla de parámetros
   del manual** en PDF, enlazado desde [Manuales para scooters](https://honeywhale.com.mx/manuales-para-scooters/).
   Si no coinciden, manda el manual. Solo hay manual para H3, H4, T4A, T4D y M1 Max; F50, H2 Dual Ultra, M1 Lite
   y GT1 no tienen manual publicado.
2. **Honey Whale en otro país**, solo si es el mismo producto (mismas cifras de motor, batería, velocidad,
   autonomía y rueda que la ficha de México): [honeywhale.co.nz](https://honeywhale.co.nz) (Nueva Zelanda) y
   [honeywhale.com.br](https://www.honeywhale.com.br) (Brasil). Son sitios de la marca, pero de otro mercado.
3. **No oficial**: fichas de Amazon México de la tienda HONEYWHALE. Solo donde 1 y 2 no tienen el dato.

No se usó Mercado Libre.

Marcas en la columna de fuente:

- **(otro mercado)**: sale de Honey Whale Nueva Zelanda o Brasil, no de Honey Whale México.
- **(no oficial)**: sale de Amazon México.
- **(derivado)**: no está tal cual en la fuente, se calculó a partir de ella.
- **(decisión)**: la fuente no lo resuelve del todo y el campo no admite `null`; queda anotado por qué.

Criterios comunes (los mismos del lote A, `docs/fuentes-specs/honey-whale-a.md`):

- `pendienteMaxPct`: Honey Whale publica la pendiente en grados. Se convirtió con `tan(θ) × 100`, redondeado:
  15° → 27 %, 20° → 36 %, 25° → 47 %. **(derivado)**
- `bateriaWh`: `null` en todos. Las fuentes dan voltios y amperios-hora, no Wh.
- `voltajeV`: el nominal. Algunas fichas publican el voltaje máximo de carga (54.6 V en baterías de 48 V,
  67.2 V en las de 60 V); los manuales lo separan como "Tensión máxima de trabajo".
- `tipoRueda`: "Neumáticos de vacío" o "tubeless" → `tubeless`; "Neumáticos inflables (con cámara)" → `neumatica`.
- `potenciaW` es la nominal y `potenciaPicoW` la máxima; en doble motor, la suma de los dos.
- `tiempoCargaH`: si la fuente da un rango ("6-8 horas"), el extremo alto. **(decisión)**
- `proteccionIP`: Honey Whale Nueva Zelanda publica IPX5 en modelos que el manual de México marca IPX4 (T4A),
  así que su IP no se usa para México.
- `categorias`: urbano si la ficha lo plantea para ciudad y pavimento; plegable si además es compacto (≈13 kg);
  todoterreno si la ficha habla de neumáticos o uso "todo terreno"/off-road; larga autonomía desde 60 km.

## F50

Ficha: <https://honeywhale.com.mx/producto/scooter-electrico-honey-whale-f50/> (sin manual).
Nueva Zelanda: <https://honeywhale.co.nz/shop/all-electric-scooter/f50/electric-scooter-f50/>. Es el mismo
producto: 800 W pico, 45 km/h, 50 km, batería de 15 Ah, rueda tubeless de 10", suspensión delantera y trasera,
frenos de disco delantero y trasero. No confundir con el F50D (doble motor), que es otra ficha.

| Campo | Valor | Fuente |
|---|---|---|
| autonomiaFabricanteKm | 50 | Ficha ("≤50 Km") |
| velocidadMaxKmh | 45 | Ficha ("≤45 Km/h") |
| potenciaW | 500 | Nueva Zelanda ("Motor Rated Power 500W") **(otro mercado)** |
| potenciaPicoW | 800 | Ficha ("Potencia Máxima 800W") |
| voltajeV | 48 | Ficha ("48V/15AH") |
| pesoKg | 25.5 | Nueva Zelanda ("Weight 25.5KG") **(otro mercado)** |
| cargaMaxKg | 120 | Nueva Zelanda ("Maximum Loading 120KG") **(otro mercado)** |
| ruedaPulgadas / tipoRueda | 10 / tubeless | Ficha ("Neumáticos de vacío de 10 pulgadas") |
| proteccionIP | null | La ficha no lo da; Nueva Zelanda dice IPX5, que no se usa (ver criterios) |
| plegable | true | Nueva Zelanda ("Foldable: Yes") **(otro mercado)** |
| suspension | doble | Ficha ("doble suspensión") |
| frenos | Disco delantero y trasero | Ficha ("frenos de doble disco") |
| pendienteMaxPct | 27 | Ficha ("≤15°") **(derivado)** |
| tiempoCargaH | 8 | Ficha ("6-8 Horas") **(decisión)** |
| categorias | urbano | Ficha ("para moverte por la ciudad") |

## H2 Dual Ultra

Ficha: <https://honeywhale.com.mx/producto/scooter-electrico-plegable-honey-whale-h2-dual-ultra/> (sin manual; el
manual "H2 Dual" del sitio es de otro modelo y no se usó).
No oficial: [Amazon México, HONEYWHALE H2D-Ultra](https://www.amazon.com.mx/dp/B0D8SZKPFK). Coincide con la ficha
(1200 W × 2 pico, 54.6V/18Ah, 65 km, 20°, 150 kg) salvo la velocidad máxima, que allí es 50 km/h.

| Campo | Valor | Fuente |
|---|---|---|
| autonomiaFabricanteKm | 65 | Ficha ("≤65 Km") |
| velocidadMaxKmh | 55 | Ficha ("≤55 Km/h"). Amazon dice 50 km/h |
| potenciaW | 1600 | Amazon ("Potencia nominal 800W*2") **(no oficial)**. La ficha solo da la máxima |
| potenciaPicoW | 2400 | Ficha ("Potencia Máxima 1200W*2") |
| voltajeV | 48 | Amazon ("Tensión de salida: 48 V") **(no oficial)**. La ficha dice 54.6V/18AH: es el voltaje máximo de carga |
| pesoKg | 28.9 | Ficha ("Peso de 28.9 kg"). Amazon dice 28.4 kg |
| cargaMaxKg | 150 | Ficha ("capacidad de carga máxima de 150 kg") |
| ruedaPulgadas / tipoRueda | 10 / tubeless | Ficha (10"); tipo de Amazon ("Neumático de vacío") **(no oficial)** |
| proteccionIP | IPX4 | Amazon ("Índice de impermeabilidad: IPx4") **(no oficial)** |
| plegable | true | Ficha ("Diseño Compacto y Plegable") |
| suspension | doble | Ficha ("amortiguación delantero y trasero") |
| frenos | Disco y freno electrónico | Ficha ("Freno de disco combinado con freno electrónico") |
| pendienteMaxPct | 36 | Ficha ("≤20°") **(derivado)** |
| tiempoCargaH | 12 | Ficha ("12 Horas") |
| categorias | urbano, larga-autonomia | Ficha ("Ideal para terrenos urbanos"); 65 km |

## H3

Ficha: <https://honeywhale.com.mx/producto/scooter-electrico-honey-whale-h3-negro/>.
Manual: [H3](https://honeywhale.com.mx/wp-content/uploads/2025/09/Honey-Whale-Scooter-electrico-H3-Manual.pdf), tabla en la pág. 17.

| Campo | Valor | Fuente |
|---|---|---|
| autonomiaFabricanteKm | 60 | Manual ("<60km") y ficha |
| velocidadMaxKmh | 55 | Manual ("<55km/h") y ficha |
| potenciaW / potenciaPicoW | 800 / 1000 | Manual y ficha |
| voltajeV | 48 | Manual ("Tensión nominal 48V", 15 Ah) |
| pesoKg | 35 | Manual ("Peso neto 35kg") |
| cargaMaxKg | 120 | Manual y ficha |
| ruedaPulgadas / tipoRueda | 10 / tubeless | Manual ("Neumáticos de vacío", "Rueda delantera de 11", rueda trasera de 10""). Rueda delantera 11" y trasera 10": el esquema admite un solo tamaño y se puso el menor **(decisión)** |
| proteccionIP | IPX4 | Manual y ficha |
| plegable | true | Ficha ("Estructura plegable") y manual (tamaño plegado) |
| suspension | doble | Ficha ("Suspensión delantera y trasera") |
| frenos | Disco y freno electrónico | Manual ("Frenos electrónicos y de disco") |
| pendienteMaxPct | 27 | Manual ("15°") **(derivado)** |
| tiempoCargaH | 7 | Manual ("<7H") y ficha |
| categorias | todoterreno, larga-autonomia | Ficha ("Llantas todoterreno", "aventuras todoterreno"); 60 km. La tabla dice "Pavimento asfáltico / plano" |

## H4

Ficha: <https://honeywhale.com.mx/producto/scooter-electrico-honey-whale-h4-azul/>.
Manual: [H4](https://honeywhale.com.mx/wp-content/uploads/2025/09/Honey-Whale-Scooter-electrico-H4-Manual.pdf), tabla en la pág. 18.

| Campo | Valor | Fuente |
|---|---|---|
| autonomiaFabricanteKm | 75 | Manual ("<75km") y ficha |
| velocidadMaxKmh | 70 | Manual ("<70km/h") y ficha |
| potenciaW / potenciaPicoW | 1800 / 2400 | Manual y ficha |
| voltajeV | 60 | Manual ("Tensión nominal 60V", 20.8 Ah) |
| pesoKg | 40 | Manual ("Peso neto 40kg"). En las preguntas de la ficha, Honey Whale respondió en 2024 que pesa 49 kg; manda el manual |
| cargaMaxKg | 120 | Manual y ficha |
| ruedaPulgadas / tipoRueda | 11 / tubeless | Manual ("Neumáticos de vacío", "11 inch") |
| proteccionIP | IPX4 | Manual y ficha |
| plegable | true | Manual y ficha (tamaño plegado 133.6 × 66 × 55 cm) |
| suspension | doble | Ficha ("Amortiguadores delanteros y traseros") |
| frenos | Disco y freno electrónico | Manual ("Frenos electrónicos y de disco") |
| pendienteMaxPct | 27 | Manual y tabla de la ficha (15°) **(derivado)**. El texto de la ficha dice "hasta 20°" |
| tiempoCargaH | 12 | Manual ("<12H") y ficha |
| categorias | urbano, larga-autonomia | Tabla ("Pavimento asfáltico / plano"); 75 km. Honey Whale responde en la ficha que no es apto para terracería |

## T4A

Ficha: <https://honeywhale.com.mx/producto/scooter-electrico-honey-whale-t4-a/> (titulada "T4-A").
Manual: [T4A](https://honeywhale.com.mx/wp-content/uploads/2025/09/Honey-Whale-Scooter-electrico-T4A-Manual.pdf), tabla en la pág. 21.
Nueva Zelanda: <https://honeywhale.co.nz/shop/all-electric-scooter/t4-a/t4-a/>. Mismo producto (750 W, 45 km/h,
10 Ah, rueda tubeless de 10", 23 kg, 120 kg, mismas medidas); solo se usó para la suspensión. Allí la potencia
nominal es 500 W y el IP es IPX5, distintos del manual de México.

| Campo | Valor | Fuente |
|---|---|---|
| autonomiaFabricanteKm | 35 | Manual ("<35km") y ficha |
| velocidadMaxKmh | 45 | Manual ("<45km/h") y ficha |
| potenciaW / potenciaPicoW | 600 / 750 | Manual y ficha |
| voltajeV | 48 | Manual ("Tensión nominal 48V", 10 Ah) |
| pesoKg | 23 | Manual ("Peso neto 23kg") |
| cargaMaxKg | 120 | Manual y ficha |
| ruedaPulgadas / tipoRueda | 10 / tubeless | Manual ("Neumáticos de vacío", "10 inch") |
| proteccionIP | IPX4 | Manual y ficha |
| plegable | true | Ficha ("Plegable para fácil almacenamiento") y manual |
| suspension | doble | Nueva Zelanda ("Shock Absorbers: Dual Front and Dual Rear") **(otro mercado)**. La ficha de México no lo detalla |
| frenos | Disco delantero y trasero | Manual ("Frenos de disco"); Nueva Zelanda ("front and rear disc brakes") |
| pendienteMaxPct | 27 | Manual ("15°") **(derivado)** |
| tiempoCargaH | 7 | Manual ("<7H") y ficha |
| categorias | urbano | Ficha ("Ideal para desplazamientos urbanos") |

## T4D

Ficha: <https://honeywhale.com.mx/producto/scooter-electrico-honey-whale-t4d/>.
Manual: [T4D](https://honeywhale.com.mx/wp-content/uploads/2025/09/Honey-Whale-Scooter-electrico-T4D-Manual.pdf), tabla en la pág. 21; suspensión en "Introducción del producto" (pág. 2).

| Campo | Valor | Fuente |
|---|---|---|
| autonomiaFabricanteKm | 65 | Manual y ficha ("Motor único: 65 Km; Motor doble: 55 Km"). Se tomó la cifra principal de la ficha (65 km); con los dos motores son 55 km **(decisión)** |
| velocidadMaxKmh | 65 | Manual ("<65km/h") y ficha. Con un solo motor, 60 km/h |
| potenciaW / potenciaPicoW | 1600 / 2600 | Manual y ficha ("800W*2" / "1300W*2") |
| voltajeV | 52 | Manual ("Tensión nominal 52V", 20 Ah) |
| pesoKg | 34 | Manual ("Peso neto 34kg") |
| cargaMaxKg | 120 | Manual |
| ruedaPulgadas / tipoRueda | 11 / tubeless | Manual ("Neumáticos todoterreno al vacío", "11 Inch") |
| proteccionIP | IPX4 | Manual y ficha |
| plegable | true | Manual (tamaño plegado y "Dispositivo de plegado") |
| suspension | doble | Manual ("Amortiguador delantero", "Amortiguador trasero") |
| frenos | Disco | Manual ("Freno de disco") y ficha |
| pendienteMaxPct | 27 | Manual ("15°") **(derivado)** |
| tiempoCargaH | 11 | Manual ("11H") y ficha |
| categorias | todoterreno, larga-autonomia | Ficha ("neumáticos todoterreno de vacío"); 65 km |

## M1 Max

Ficha: <https://honeywhale.com.mx/producto/scooter-electrico-honey-whale-m1-max-negro-rojo/>.
Manual: [M1 MAX](https://honeywhale.com.mx/wp-content/uploads/2025/09/Honey-Whale-Scooter-electrico-M1-MAX-Manual.pdf), tabla en la pág. 20; suspensión en "Introducción del producto" (pág. 2).

| Campo | Valor | Fuente |
|---|---|---|
| autonomiaFabricanteKm | 22 | Manual ("<22km") y ficha |
| velocidadMaxKmh | 32 | Manual ("<32km/h") y ficha |
| potenciaW / potenciaPicoW | 350 / 500 | Manual y ficha |
| voltajeV | 36 | Manual ("Tensión nominal 36V", 7.8 Ah) |
| pesoKg | 17 | Manual ("Peso neto 17kg") |
| cargaMaxKg | 120 | Manual y ficha |
| ruedaPulgadas / tipoRueda | 10 / neumatica | Manual ("Neumáticos inflables (con cámara)", "10 inch") |
| proteccionIP | IPX4 | Manual y ficha |
| plegable | true | Ficha ("diseño plegable en 2 pasos") y manual |
| suspension | doble | Manual ("Amortiguadores delantero", "Amortiguador trasero") |
| frenos | Disco y freno electrónico | Manual ("Frenos de disco y frenos electrónicos") |
| pendienteMaxPct | 27 | Manual ("15°") **(derivado)** |
| tiempoCargaH | 7 | Manual ("<7H") y tabla de la ficha. El texto de la ficha dice 6-8 h |
| categorias | urbano | Tabla ("Pavimento plano"). No va en plegable: 17 kg |

## M1 Lite

Ficha: <https://honeywhale.com.mx/producto/scooter-electrico-honey-whale-m1-lite-azul/> (sin manual; el manual
"M1" del sitio es de otro modelo y no se usó).
Brasil: <https://www.honeywhale.com.br/produto/m1-lite-patinete-eletrico-dobravel/>. Mismo producto (500 W,
25 km/h, 16 km, 36 V 5.2 Ah, rueda de 8.5", carga en 7 h).
No oficial: [Amazon México, HONEYWHALE M1 Lite](https://www.amazon.com.mx/dp/B0G7GC76RP).

| Campo | Valor | Fuente |
|---|---|---|
| autonomiaFabricanteKm | 16 | Ficha ("≤16 Km") |
| velocidadMaxKmh | 25 | Ficha ("≤25 Km/h") |
| potenciaW | 500 | Brasil ("motor nominal / pico informado de 500 W") **(otro mercado)** |
| potenciaPicoW | 500 | Ficha ("Potencia Máxima 500W") |
| voltajeV | 36 | Ficha ("36V/5.2AH") |
| pesoKg | 12.5 | Amazon ("Peso del artículo 12,5 Kilogramos") **(no oficial)** |
| cargaMaxKg | 120 | Brasil ("Carga máxima 120 kg") **(otro mercado)**; Amazon igual |
| ruedaPulgadas / tipoRueda | 8.5 / solida | Ficha ("Neumáticos sólidos de 8.5 pulgadas") |
| proteccionIP | IPX4 | Ficha ("Clasificación IPX4 impermeable") |
| plegable | true | Ficha ("plegable con un solo toque") |
| suspension | ninguna | Ninguna fuente menciona amortiguadores (ficha, Brasil ni Amazon); el campo no admite `null` **(decisión)** |
| frenos | Freno electrónico | Brasil ("freio eletrônico") **(otro mercado)**; Amazon igual |
| pendienteMaxPct | 27 | Ficha ("≤15°") **(derivado)** |
| tiempoCargaH | 7 | Ficha ("7 Horas") |
| categorias | urbano, plegable | Ficha (uso en carretera urbana); 12.5 kg |

## GT1

Ficha: <https://honeywhale.com.mx/producto/scooter-electrico-honey-whale-gt1/> (sin manual).
Nueva Zelanda: <https://honeywhale.co.nz/shop/all-electric-scooter/gt1/electric-scooter-gt1/>. Mismo producto
(2000 W × 2 pico, 100 km/h, 100 km, 29.4 Ah, rueda tubeless de 12", suspensión hidráulica). No confundir con el
GT1 Mini, que es otra ficha.

| Campo | Valor | Fuente |
|---|---|---|
| autonomiaFabricanteKm | 100 | Ficha ("≤100 Km") |
| velocidadMaxKmh | 100 | Ficha ("100 km/h con motores dobles") |
| potenciaW | 3000 | Nueva Zelanda ("Motor Rated Power 3000W (1500W x 2)") **(otro mercado)** |
| potenciaPicoW | 4000 | Ficha ("Potencia Máxima 2000W*2") |
| voltajeV | 60 | Ficha ("60V/29.4AH"). Nueva Zelanda publica 67.2 V, el máximo de carga |
| pesoKg | 41.55 | Nueva Zelanda ("Weight 41.55KG") **(otro mercado)** |
| cargaMaxKg | 150 | Nueva Zelanda ("Maximum Loading 150KG") **(otro mercado)** |
| ruedaPulgadas / tipoRueda | 12 / tubeless | Ficha ("Neumáticos todoterreno para vacío de 12 pulgadas") |
| proteccionIP | IPX4 | Ficha ("Resistencia al agua certificada IPX4") |
| plegable | true | Nueva Zelanda ("Foldable: Yes") **(otro mercado)** |
| suspension | doble | Nueva Zelanda ("Front & Rear Hydraulic Suspension") **(otro mercado)**. La ficha dice "Amortiguación hidráulica" sin precisar ejes |
| frenos | Hidráulicos delantero y trasero | Nueva Zelanda ("Front & Rear Hydraulic Brakes") **(otro mercado)** |
| pendienteMaxPct | 47 | Ficha ("≤25°") **(derivado)** |
| tiempoCargaH | 8 | Ficha ("6-8 Horas") **(decisión)** |
| categorias | todoterreno, larga-autonomia | Ficha ("Neumáticos Todoterreno", "incluyendo off-road"); 100 km |
