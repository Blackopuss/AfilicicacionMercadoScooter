import type { Scooter } from './scooter';

/**
 * Los fabricantes miden la autonomía en condiciones de laboratorio: 75 kg, plano, unos 15 km/h y 25 °C.
 * En ciudad (arrancar y frenar, ir a la velocidad máxima, baches) se pierde cerca de un 30 %.
 */
export const FACTOR_URBANO = 0.7;
/** Peso del conductor con el que el fabricante mide la autonomía. */
export const PESO_REFERENCIA_KG = 75;
/** Las subidas frecuentes gastan cerca de un 20 % más de batería. */
export const FACTOR_SUBIDAS = 0.8;

export type OpcionesAutonomia = { pesoKg?: number; conSubidas?: boolean };

/**
 * Autonomía real estimada en km (entero), nunca mayor que la del fabricante.
 * El ajuste por peso escala con la masa total (conductor + scooter), porque la resistencia
 * a la rodadura y el esfuerzo al acelerar crecen con ella.
 */
export function autonomiaReal(
  scooter: Pick<Scooter, 'autonomiaFabricanteKm' | 'pesoKg'>,
  { pesoKg = PESO_REFERENCIA_KG, conSubidas = false }: OpcionesAutonomia = {},
): number {
  if (!(pesoKg > 0)) throw new RangeError('pesoKg debe ser mayor que 0');
  const factorPeso = (PESO_REFERENCIA_KG + scooter.pesoKg) / (pesoKg + scooter.pesoKg);
  const km = scooter.autonomiaFabricanteKm * FACTOR_URBANO * factorPeso * (conSubidas ? FACTOR_SUBIDAS : 1);
  return Math.round(Math.min(km, scooter.autonomiaFabricanteKm));
}
