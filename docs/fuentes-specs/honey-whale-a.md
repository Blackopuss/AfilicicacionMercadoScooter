# Fuentes de specs: Honey Whale (lote A)

Ocho modelos de Honey Whale (la marca con la que KuKirin se vende en México). Consultado el 30/10/2026.

Todas las cifras salen de dos fuentes oficiales de Honey Whale México: la **ficha** del producto en
`honeywhale.com.mx` (texto y tabla "Información adicional") y la **tabla de parámetros del manual** en PDF,
enlazado desde [Manuales para scooters](https://honeywhale.com.mx/manuales-para-scooters/). Cuando la ficha y el
manual no coinciden, manda el manual (es la tabla técnica completa; la ficha mezcla cifras de otros modelos), y la
diferencia queda anotada. No se usó Mercado Libre ni ninguna fuente no oficial.

Marcas en la columna de fuente:

- **(derivado)**: no está tal cual en la fuente, se calculó a partir de ella. Revisar si se prefiere `null`.
- **(decisión)**: la fuente no lo resuelve del todo y el campo no admite `null`; se eligió el valor más conservador.

Criterios comunes:

- `pendienteMaxPct`: Honey Whale publica la pendiente en grados. Se convirtió a porcentaje con `tan(θ) × 100`,
  redondeado: 10° → 18 %, 12° → 21 %, 15° → 27 %, 20° → 36 %, 22° → 40 %. **(derivado)**
- `bateriaWh`: calculado como voltios nominales × amperios-hora de la misma fuente (las fuentes no dan Wh), igual que en `iscooter.md`. Los Ah de cada modelo están en su fila `voltajeV`.
- `tipoRueda`: "Neumáticos de vacío" → `tubeless`; "Neumáticos inflables (con cámara)" → `neumatica`.
- `potenciaW` es la nominal y `potenciaPicoW` la máxima; en doble motor, la suma de los dos.
- `categorias`: urbano si la ficha lo plantea para ciudad y pavimento; plegable si además es compacto (≈13 kg);
  todoterreno si la ficha habla de neumáticos o estabilidad "todo terreno"; larga autonomía desde 60 km.
- Ninguno lo clasifica el sitio como moto, motobici ni trimoto: los ocho están en la categoría "Scooters".

## E9 Pro

Ficha: <https://honeywhale.com.mx/producto/e9-pro-scooter-electrico/> (titulada "Scooter Eléctrico M2 Pro / E9 Pro").
Manual: [M2 PRO / E9 PRO](https://honeywhale.com.mx/wp-content/uploads/2025/09/Honey-Whale-Scooter-electrico-M2-Pro-E9-Pro-Manual.pdf), tabla en la pág. 21.
Hay un manual anterior solo "E9 PRO" (2024) con cifras distintas e incompletas (12.5 kg, 18-28 km, potencia nominal "71");
se usó el de 2025 porque la ficha actual describe el producto como M2 Pro / E9 Pro.

| Campo | Valor | Fuente |
|---|---|---|
| autonomiaFabricanteKm | 22 | Manual ("<22km"). La tabla de la ficha dice ≤25 km |
| velocidadMaxKmh | 32 | Manual y ficha |
| potenciaW / potenciaPicoW | 350 / 500 | Manual |
| voltajeV | 36 | Manual (7.8 Ah). La tabla de la ficha dice 36V/7.5AH |
| pesoKg | 13 | Manual |
| cargaMaxKg | 120 | Manual y ficha |
| ruedaPulgadas / tipoRueda | 8.5 / neumatica | Manual ("Neumáticos inflables") y ficha ("cámara de aire") |
| proteccionIP | IPX4 | Manual |
| plegable | true | Manual y ficha |
| suspension | ninguna | Manual (pág. 2): el diagrama no muestra amortiguadores; la ficha no menciona suspensión |
| frenos | Disco trasero y freno electrónico | Manual ("Frenos de disco traseros") y ficha ("frenos de disco y electrónicos") |
| pendienteMaxPct | 18 | Manual (10°). La ficha dice ≤15° **(derivado)** |
| tiempoCargaH | 7 | Manual ("<7H"). La ficha dice 6 h en el texto y 8 h en la tabla |

## E9 Max-N

Ficha: <https://honeywhale.com.mx/producto/scooter-electrico-honey-whale-e9-max-n/>.
Manual: [E9 MAX-N](https://honeywhale.com.mx/wp-content/uploads/2025/09/Honey-Whale-Scooter-electrico-E9MAX-N-Manual.pdf), tabla en la pág. 20.

| Campo | Valor | Fuente |
|---|---|---|
| autonomiaFabricanteKm | 40 | Manual y ficha |
| velocidadMaxKmh | 32 | Manual y ficha |
| potenciaW / potenciaPicoW | 500 / 650 | Manual y ficha |
| voltajeV | 36 | Manual y ficha (15 Ah) |
| pesoKg | 22 | Manual |
| cargaMaxKg | 120 | Manual y ficha |
| ruedaPulgadas / tipoRueda | 10 / neumatica | Manual ("Neumáticos inflables (con cámara)") |
| proteccionIP | IPX4 | Manual y ficha |
| plegable | true | Manual y ficha |
| suspension | ninguna | Ni el manual (diagrama de la pág. 2) ni la ficha mencionan amortiguadores **(decisión)** |
| frenos | Tambor delantero y disco trasero | Manual y ficha |
| pendienteMaxPct | 27 | Manual y ficha (15°) **(derivado)** |
| tiempoCargaH | 8 | Manual y ficha |

## G2 Pro

Ficha: <https://honeywhale.com.mx/producto/scooter-electrico-honey-whale-g2-pro/>.
Manual: [G2 PRO](https://honeywhale.com.mx/wp-content/uploads/2025/09/Honey-Whale-Scooter-electrico-G2-PRO-Manual.pdf), tabla en la pág. 18.
No es el mismo producto que el KuKirin G2 Pro de [kukirin-scooter.com](https://www.kukirin-scooter.com/products/kukirin-g2-pro-electric-scooter)
(allí: 600 W, 48V 15Ah, rueda de 9"), así que no se usó como fuente.

| Campo | Valor | Fuente |
|---|---|---|
| autonomiaFabricanteKm | 50 | Manual ("<50km") y texto de la ficha. La tabla de la ficha dice ≤35 km y el resumen 35 km |
| velocidadMaxKmh | 50 | Manual y tabla de la ficha. El resumen de la ficha dice 45 km/h |
| potenciaW / potenciaPicoW | 800 / 1200 | Manual y ficha |
| voltajeV | 48 | Manual y ficha (16 Ah) |
| pesoKg | 24.5 | Manual y ficha |
| cargaMaxKg | 120 | Manual y ficha |
| ruedaPulgadas / tipoRueda | 10 / tubeless | Manual ("Neumáticos de vacío") |
| proteccionIP | IPX4 | Manual y ficha |
| plegable | true | Manual y ficha |
| suspension | trasera | Manual (pág. 2): solo rotula "Amortiguador trasero"; la ficha no habla de suspensión. El G4 Max, con el mismo diagrama, sí declara amortiguadores delanteros en su ficha, así que puede tener también delantera **(decisión)** |
| frenos | Disco delantero y trasero | Manual y ficha |
| pendienteMaxPct | 21 | Manual y ficha (12°) **(derivado)** |
| tiempoCargaH | 8 | Manual ("<8H") y tabla de la ficha. El texto de la ficha dice 6 h |

## G3 Pro

Ficha: <https://honeywhale.com.mx/producto/scooter-electrico-honey-whale-g3-pro-blanco-negro/>.
Manual: [G3 PRO](https://honeywhale.com.mx/wp-content/uploads/2025/09/Honey-Whale-Scooter-electrico-G3PRO-Manual.pdf), tabla en la pág. 18.

| Campo | Valor | Fuente |
|---|---|---|
| autonomiaFabricanteKm | 56 | Manual y tabla de la ficha. El texto de la ficha dice "hasta 66 km" |
| velocidadMaxKmh | 60 | Manual y ficha |
| potenciaW / potenciaPicoW | 800 / 1640 | Manual y ficha |
| voltajeV | 48 | Manual y ficha (18 Ah) |
| pesoKg | 31 | Manual |
| cargaMaxKg | 150 | Manual y ficha |
| ruedaPulgadas / tipoRueda | 12 / tubeless | Manual ("Neumáticos de vacío") |
| proteccionIP | IPX4 | Manual y ficha |
| plegable | true | Manual |
| suspension | trasera | Manual (pág. 2): solo rotula "Amortiguador trasero"; la ficha habla de "amortiguadores de alto rendimiento" sin decir dónde **(decisión)** |
| frenos | Disco delantero y trasero | Manual y ficha |
| pendienteMaxPct | 40 | Manual y ficha (22°) **(derivado)** |
| tiempoCargaH | 6 | Manual y ficha |

## G4 Max

Ficha: <https://honeywhale.com.mx/producto/scooter-electrico-honey-whale-g4-max/>.
Manual: [G4 MAX](https://honeywhale.com.mx/wp-content/uploads/2025/09/Honey-Whale-Scooter-electrico-G4-MAX-Manual.pdf), tabla en la pág. 18.
Doble motor (se puede usar con uno o con dos).

| Campo | Valor | Fuente |
|---|---|---|
| autonomiaFabricanteKm | 70 | Manual y ficha: 70 km con un motor, 60 km con dos. Se tomó la cifra máxima publicada |
| velocidadMaxKmh | 72 | Manual y ficha: 72 km/h con dos motores, 55 km/h con uno |
| potenciaW / potenciaPicoW | 1600 / 2400 | Manual y ficha: "800W*2" nominal, "1200W*2" máxima |
| voltajeV | 60 | Manual y ficha (20.8 Ah) |
| pesoKg | 36 | Manual |
| cargaMaxKg | 150 | Manual y texto de la ficha |
| ruedaPulgadas / tipoRueda | 12 / tubeless | Manual ("Neumáticos de vacío") y ficha |
| proteccionIP | IPX4 | Manual y ficha |
| plegable | true | Ficha ("Diseño ergonómico plegable") |
| suspension | doble | Ficha ("Amortiguadores delanteros y traseros") |
| frenos | Disco delantero y trasero | Manual y ficha |
| pendienteMaxPct | 36 | Manual y ficha (20°) **(derivado)** |
| tiempoCargaH | 7 | Manual ("≤7H") y ficha |

## T8 Max

Ficha: <https://honeywhale.com.mx/producto/scooter-electrico-honey-whale-t8-max/>.
Manual: [T8 MAX](https://honeywhale.com.mx/wp-content/uploads/2025/09/Honey-Whale-Scooter-electrico-T8MAX-Manual.pdf), tabla en la pág. 21.
Doble motor (delantero y trasero, según el manual).

| Campo | Valor | Fuente |
|---|---|---|
| autonomiaFabricanteKm | 65 | Manual y ficha |
| velocidadMaxKmh | 65 | Manual y ficha |
| potenciaPicoW | 2000 | Ficha ("1000W*2", "2000W potencia total"). El manual y la tabla de la ficha dicen 1000 W, que es por motor |
| potenciaW | 1600 | Manual y tabla de la ficha dicen "800W" nominal sin aclarar si es por motor; se tomó por motor (×2), igual que la máxima **(decisión)** |
| voltajeV | 52 | Manual y ficha (20 Ah) |
| pesoKg | 33 | Manual |
| cargaMaxKg | 120 | Manual y ficha |
| ruedaPulgadas / tipoRueda | 12 / tubeless | Manual ("Neumáticos de vacío") y ficha |
| proteccionIP | IPX4 | Manual y ficha |
| plegable | true | Ficha ("Diseño plegable") |
| suspension | doble | Ficha ("Amortiguación de balancín delantero y trasero") |
| frenos | Disco hidráulico delantero y trasero | Manual ("Frenos de disco delantero y trasero") y texto de la ficha ("frenos de aceite con transmisión hidráulica") |
| pendienteMaxPct | 27 | Manual y ficha (15°) **(derivado)** |
| tiempoCargaH | 10 | Manual ("<10H") y ficha |

## M2 Pro V2

Ficha: <https://honeywhale.com.mx/producto/scooter-electrico-honey-whale-m2-pro-v2/>.
Manual: [M2 PRO / E9 PRO](https://honeywhale.com.mx/wp-content/uploads/2025/09/Honey-Whale-Scooter-electrico-M2-Pro-E9-Pro-Manual.pdf), tabla en la pág. 21.
Honey Whale publica el mismo manual y la misma descripción para el M2 Pro y el E9 Pro, así que sus specs coinciden.

| Campo | Valor | Fuente |
|---|---|---|
| autonomiaFabricanteKm | 22 | Manual ("<22km"). La tabla de la ficha dice ≤25 km |
| velocidadMaxKmh | 32 | Manual y ficha |
| potenciaW / potenciaPicoW | 350 / 500 | Manual y ficha |
| voltajeV | 36 | Manual y ficha (7.8 Ah) |
| pesoKg | 13 | Manual |
| cargaMaxKg | 120 | Manual y ficha |
| ruedaPulgadas / tipoRueda | 8.5 / neumatica | Manual ("Neumáticos inflables") y ficha |
| proteccionIP | IPX4 | Manual y ficha |
| plegable | true | Manual y ficha |
| suspension | ninguna | Manual (pág. 2): el diagrama no muestra amortiguadores; la ficha no menciona suspensión |
| frenos | Disco trasero y freno electrónico | Manual ("Frenos de disco traseros") y ficha ("frenos de disco y electrónicos") |
| pendienteMaxPct | 18 | Manual (10°). La ficha dice ≤15° **(derivado)** |
| tiempoCargaH | 7 | Manual y tabla de la ficha |

## S2

Ficha: <https://honeywhale.com.mx/producto/scooter-electrico-honey-whale-s2-negro/>.
Manual: [S2](https://honeywhale.com.mx/wp-content/uploads/2025/09/Honey-Whale-Scooter-electrico-S2-Manual.pdf), tabla en la pág. 19.
Es el S2 a secas (no el S2 V2, S2 Max ni S2 sólido, que tienen ficha y manual propios).

| Campo | Valor | Fuente |
|---|---|---|
| autonomiaFabricanteKm | 20 | Manual y ficha |
| velocidadMaxKmh | 25 | Manual y ficha |
| potenciaW / potenciaPicoW | 350 / 500 | Manual y ficha |
| voltajeV | 36 | Manual y ficha (6.6 Ah) |
| pesoKg | 13 | Manual |
| cargaMaxKg | 120 | Manual y ficha |
| ruedaPulgadas / tipoRueda | 8.5 / neumatica | Manual ("Neumáticos inflables") y ficha |
| proteccionIP | IPX4 | Manual y ficha |
| plegable | true | Manual y ficha |
| suspension | ninguna | Manual (pág. 2): el diagrama no muestra amortiguadores; la ficha no menciona suspensión |
| frenos | Disco trasero y freno electrónico | Manual ("Frenos de disco traseros") y ficha ("frenos de disco y electrónicos") |
| pendienteMaxPct | 18 | Manual y ficha (10°; el texto de la ficha dice 15°) **(derivado)** |
| tiempoCargaH | 6 | Manual ("<6H") y ficha |
