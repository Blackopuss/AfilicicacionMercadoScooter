# Fuentes de specs: Segway

Todos los datos salen de la ficha de cada modelo en la tienda oficial de Segway México
(`store-mx.segway.com`), tabla "Especificaciones, Información Adicional y Aviso Legal". Consultada el 30/10/2026.
Ningún dato sale de fuentes no oficiales y ningún campo quedó en `null`.

Criterios cuando la ficha da más de un valor:

- **Autonomía**: la máxima del fabricante (modo ECO), no la "a velocidad máxima".
- **Velocidad máxima**: la máxima que publica la ficha, aunque haya que desbloquearla en la app (Max G3).
- **Tiempo de carga**: con un solo cargador.
- **Peso**: el de la tabla de especificaciones cuando la descripción de la página dice otro.

## Segway E3 Pro (`segway-e3-pro`)

Fuente: https://store-mx.segway.com/e3-pro-electric-scooter

| Campo | Valor | Fuente / nota |
|---|---|---|
| autonomiaFabricanteKm | 55 | Tabla: "Alcances de modos de velocidad – ECO: aprox. 55 km"; resumen superior: "55 km Autonomía Máx. a 15 km/h". **Conflicto en la misma página**: la descripción dice "hasta 45 km" (45 km es el ECO del E3 sin Pro) |
| velocidadMaxKmh | 32 | Tabla: "Velocidad máx. aprox. 32 km/h". El selector de modelo dice "30 kmph" |
| potenciaW | 400 | Tabla: "Motor – Corriente nominal 400 W" |
| potenciaPicoW | 800 | Tabla: "Potencia máx. 800 W" |
| bateriaWh | 368 | Tabla: "Energía nominal 368 Wh" |
| voltajeV | 36 | Tabla: "Tensión nominal 36 V" |
| pesoKg | 18.2 | Tabla: "Peso neto aprox. 18,2 kg" |
| cargaMaxKg | 120 | Tabla: "Carga útil máxima 120 kg" |
| ruedaPulgadas | 10 | Tabla: "Neumáticos sin cámara de 10 pulgadas" |
| tipoRueda | tubeless | Ídem ("sin cámara") |
| proteccionIP | IPX5 | Tabla: "Clasificación IP IPX5" |
| plegable | true | Tabla: medidas "L × W × H (Plegado)" |
| suspension | doble | Tabla: "Delantero y trasero: amortiguador de elastómero" |
| frenos | Tambor delantero y electrónico trasero | Tabla: "Sistema de frenos" |
| pendienteMaxPct | 18 | Tabla: "Pendiente máxima aprox. 18 %" |
| tiempoCargaH | 7 | Tabla: "Duración de la carga aprox. 7 h" |

## Segway E2 Plus II (`segway-e2-plus-ii`)

Fuente: https://store-mx.segway.com/ninebot-kickscooter-e2-plus-ii

| Campo | Valor | Fuente / nota |
|---|---|---|
| autonomiaFabricanteKm | 25 | Tabla: "Autonomía máx. aprox. 25 km" |
| velocidadMaxKmh | 25 | Tabla: "Velocidad máx. aprox. 25 km/h" |
| potenciaW | 300 | Tabla: "Potencia nominal 300 W" |
| potenciaPicoW | 500 | Tabla: "Potencia máx. 500 W" |
| bateriaWh | 220 | Tabla: "Energía nominal 220 Wh" |
| voltajeV | 21.6 | Tabla: "Voltaje nominal 21.6 V" |
| pesoKg | 16.4 | Tabla: "Peso neto aprox. 16.4 kg". **Conflicto**: la descripción dice 16.5 kg |
| cargaMaxKg | 90 | Tabla: "Carga máx. 90 kg" |
| ruedaPulgadas | 8.1 | Tabla: "Neumáticos de 8.1 pulgadas con amortiguación hueca interna" |
| tipoRueda | solida | Ídem; la página los describe "a prueba de ponchaduras, sin necesidad de mantenimiento" (sin aire) |
| proteccionIP | IPX4 | Tabla: "Clasificación IP IPX4" |
| plegable | true | Tabla: medidas "L × A × A (plegado)" |
| suspension | delantera | Página: "suspensión delantera de doble resorte y un recorrido de 27 mm" (la tabla no tiene fila de suspensión) |
| frenos | Electrónico delantero y tambor trasero | Página: "freno electrónico delantero y el freno de tambor mecánico trasero" (la tabla no tiene fila de frenos) |
| pendienteMaxPct | 12 | Tabla: "Pendiente máx. aprox. 12 %" |
| tiempoCargaH | 7.5 | Tabla: "Tiempo de carga aprox. 7.5 h" |

## Segway ZT3 Pro (`segway-zt3-pro`)

Fuente: https://store-mx.segway.com/segway-zt3-pro

| Campo | Valor | Fuente / nota |
|---|---|---|
| autonomiaFabricanteKm | 70 | Resumen de la página: "70 km Autonomía en modo Eco a 15 kmph" (la tabla solo da "Autonomía a velocidad máxima aprox. 30 km") |
| velocidadMaxKmh | 40 | Tabla: "Velocidad máxima aprox. 40 km/h". **Conflicto**: la descripción dice 38 km/h |
| potenciaW | 650 | Tabla: "Potencia nominal 650 W" |
| potenciaPicoW | 1600 | Tabla: "Potencia máxima 1600 W" |
| bateriaWh | 597 | Tabla: "Energía nominal 597 Wh" |
| voltajeV | 46.8 | Tabla: "Voltaje nominal 46.8 V" |
| pesoKg | 29.7 | Tabla: "Peso neto aprox. 29.7 kg" |
| cargaMaxKg | 120 | Tabla: "Carga máxima 120 kg" |
| ruedaPulgadas | 11 | Tabla: "Neumáticos todoterreno sin cámara de 11 pulgadas" |
| tipoRueda | tubeless | Ídem |
| proteccionIP | IPX5 | Tabla: "Clasificación IP IPX5" |
| plegable | true | Tabla: medidas "L × W × H (plegado)" |
| suspension | doble | Tabla: "Suspensión telescópica delantera dual; suspensión trasera de muelle" |
| frenos | Disco delantero, disco trasero y electrónico | Tabla: "Freno de disco delantero; freno de disco trasero + freno electrónico" |
| pendienteMaxPct | 25 | Tabla: "Pendiente máxima aprox. 25 %" |
| tiempoCargaH | 4 | Tabla: "Duración de la carga aprox. 4±1 h" |

## Segway Max G3 (`segway-max-g3`)

Fuente: https://store-mx.segway.com/ninebot-kickscooter-max-g3

| Campo | Valor | Fuente / nota |
|---|---|---|
| autonomiaFabricanteKm | 80 | Tabla: "Autonomía a velocidad máx. – ECO aprox. 80 km" |
| velocidadMaxKmh | 45 | Tabla: "Aprox. 45 km/h (habilite la alta velocidad a través de la app Segway Mobility)". De fábrica viene limitado a 32 km/h |
| potenciaW | 850 | Tabla: "Potencia nominal 850 W" |
| potenciaPicoW | 2000 | Tabla: "Potencia máx. 2000 W" |
| bateriaWh | 597 | Tabla: "Energía nominal 597 Wh" |
| voltajeV | 46.8 | Tabla: "Voltaje nominal 46.8 V" |
| pesoKg | 24.6 | Tabla: "Peso neto aprox. 24.6 kg" |
| cargaMaxKg | 130 | Tabla: "Carga máx. 130 kg" |
| ruedaPulgadas | 11 | Tabla: "Neumáticos tubeless autosellantes de 11 pulgadas" |
| tipoRueda | tubeless | Ídem |
| proteccionIP | IPX6 | Tabla: "Clasificación IP IPX6" (batería IPX7) |
| plegable | true | Tabla: medidas "L × An × Al (plegado)" |
| suspension | doble | Tabla: "Amortiguador hidráulico delantero de doble tubo; amortiguadores hidráulicos traseros dobles" |
| frenos | Disco delantero y disco trasero | Tabla: "Sistema de frenos" |
| pendienteMaxPct | 30 | Tabla: "Pendiente máx. aprox. 30 %" |
| tiempoCargaH | 3.5 | Tabla: "Duración de carga (sencilla) aprox. 3.5 h" (con dos cables: 2.5 h) |

## Categorías asignadas

| Modelo | Categorías | Motivo |
|---|---|---|
| E3 Pro | urbano, plegable | 18.2 kg, pavimento y caminos lisos |
| E2 Plus II | urbano, plegable | 16.4 kg, "principalmente carreteras lisas" |
| ZT3 Pro | urbano, todoterreno, larga-autonomia | Segway lo vende como "dos en uno" urbano y todoterreno; 70 km |
| Max G3 | urbano, larga-autonomia | 80 km; 24.6 kg, no compacto |
