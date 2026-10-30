import type { CampoNumerico } from './puntuacion';
import type { Categoria, Scooter } from './scooter';

export const ETIQUETA_CATEGORIA: Record<Categoria, string> = {
  urbano: 'Urbano',
  todoterreno: 'Todoterreno',
  plegable: 'Plegable',
  'larga-autonomia': 'Larga autonomía',
};
const ETIQUETA_SUSPENSION: Record<Scooter['suspension'], string> = {
  ninguna: 'Sin suspensión',
  delantera: 'Delantera',
  trasera: 'Trasera',
  doble: 'Doble',
};
const ETIQUETA_RUEDA: Record<Scooter['tipoRueda'], string> = {
  neumatica: 'Neumática',
  solida: 'Sólida',
  tubeless: 'Tubeless',
};

const NUM = new Intl.NumberFormat('es-MX', { maximumFractionDigits: 1 });

/** "1,000 W"; sin dato → "Sin dato". */
export function conUnidad(valor: number | null, unidad: string): string {
  return valor === null ? 'Sin dato' : `${NUM.format(valor)} ${unidad}`;
}

/** Una fila de la tabla de especificaciones. `valor` (si existe) permite marcar al ganador. */
export type Especificacion = {
  etiqueta: string;
  texto: (s: Scooter) => string;
  valor?: (s: Scooter) => number | null;
  menorEsMejor?: boolean;
};

const numerica = (etiqueta: string, campo: CampoNumerico, unidad: string, menorEsMejor = false): Especificacion => ({
  etiqueta,
  texto: (s) => conUnidad(s[campo], unidad),
  valor: (s) => s[campo],
  menorEsMejor,
});

/** Especificaciones del fabricante, en el orden en que se muestran. */
export const ESPECIFICACIONES: Especificacion[] = [
  numerica('Autonomía del fabricante', 'autonomiaFabricanteKm', 'km'),
  numerica('Velocidad máxima', 'velocidadMaxKmh', 'km/h'),
  numerica('Potencia nominal', 'potenciaW', 'W'),
  numerica('Potencia pico', 'potenciaPicoW', 'W'),
  numerica('Batería', 'bateriaWh', 'Wh'),
  numerica('Voltaje', 'voltajeV', 'V'),
  numerica('Peso del scooter', 'pesoKg', 'kg', true),
  numerica('Carga máxima', 'cargaMaxKg', 'kg'),
  numerica('Pendiente máxima', 'pendienteMaxPct', '%'),
  numerica('Tiempo de carga', 'tiempoCargaH', 'h', true),
  numerica('Rueda', 'ruedaPulgadas', 'pulgadas'),
  { etiqueta: 'Tipo de rueda', texto: (s) => ETIQUETA_RUEDA[s.tipoRueda] },
  { etiqueta: 'Suspensión', texto: (s) => ETIQUETA_SUSPENSION[s.suspension] },
  { etiqueta: 'Frenos', texto: (s) => s.frenos },
  { etiqueta: 'Protección al agua', texto: (s) => s.proteccionIP ?? 'Sin dato' },
  { etiqueta: 'Plegable', texto: (s) => (s.plegable ? 'Sí' : 'No') },
];

/** Especificaciones clave de la ficha con su "supera al X %". */
export const CLAVE: { etiqueta: string; campo: CampoNumerico }[] = [
  { etiqueta: 'Autonomía', campo: 'autonomiaFabricanteKm' },
  { etiqueta: 'Velocidad', campo: 'velocidadMaxKmh' },
  { etiqueta: 'Potencia', campo: 'potenciaW' },
  { etiqueta: 'Batería', campo: 'bateriaWh' },
  { etiqueta: 'Ligereza', campo: 'pesoKg' },
  { etiqueta: 'Carga máxima', campo: 'cargaMaxKg' },
  { etiqueta: 'Pendiente', campo: 'pendienteMaxPct' },
];
