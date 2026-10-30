import { autonomiaReal } from './autonomia';
import type { Scooter } from './scooter';

/** Campos numéricos comparables entre modelos. */
export type CampoNumerico =
  | 'autonomiaFabricanteKm'
  | 'velocidadMaxKmh'
  | 'potenciaW'
  | 'potenciaPicoW'
  | 'bateriaWh'
  | 'voltajeV'
  | 'pesoKg'
  | 'cargaMaxKg'
  | 'ruedaPulgadas'
  | 'pendienteMaxPct'
  | 'tiempoCargaH';

const MENOR_ES_MEJOR = new Set<CampoNumerico>(['pesoKg', 'tiempoCargaH']);

/** % de los valores de `otros` (sin null) que `valor` supera estrictamente; null si no hay con qué comparar. */
function superaA(valor: number | null, otros: (number | null)[], menorEsMejor = false): number | null {
  const conDato = otros.filter((v): v is number => v !== null);
  if (valor === null || conDato.length === 0) return null;
  const peores = conDato.filter((v) => (menorEsMejor ? valor < v : valor > v)).length;
  return Math.round((100 * peores) / conDato.length);
}

/**
 * "Supera al X % de los modelos" en un campo (0-100), comparado con el resto de `todos`.
 * En peso y tiempo de carga gana el menor. null si el modelo no tiene el dato o no hay otros con él.
 */
export function percentil(campo: CampoNumerico, scooter: Scooter, todos: Scooter[]): number | null {
  const otros = todos.filter((s) => s.slug !== scooter.slug).map((s) => s[campo]);
  return superaA(scooter[campo], otros, MENOR_ES_MEJOR.has(campo));
}

/** Nivel de protección contra agua: segundo dígito del código IP (IPX5 → 5). Sin dato → 0. */
export function nivelAgua(ip: string | null): number {
  return ip ? Number(ip[3]) : 0;
}

export const NOTA_SUSPENSION: Record<Scooter['suspension'], number> = { ninguna: 0, delantera: 0.6, trasera: 0.4, doble: 1 };
export const NOTA_RUEDA: Record<Scooter['tipoRueda'], number> = { solida: 0, neumatica: 0.8, tubeless: 1 };

/**
 * Pesos de la puntuación (suman 1). Se priorizan lo que más importa al moverse por ciudad en México:
 * cuánto llegas de verdad y si aguanta tu peso, por encima de la potencia bruta.
 * Los criterios numéricos usan el percentil dentro del catálogo; un dato ausente cuenta como 0.
 */
export const PESOS = {
  autonomiaReal: 0.3, // km reales con 75 kg en ciudad
  velocidad: 0.1,
  potencia: 0.15, // nominal: sube pendientes y aguanta carga
  cargaMax: 0.1,
  ligereza: 0.1, // menos kg, más fácil de cargar por escaleras y transporte
  suspension: 0.1, // calles con baches y topes
  rueda: 0.1, // tubeless > neumática > sólida en agarre y confort
  agua: 0.05, // temporada de lluvias
} as const;

/** Puntuación 0-100 (entera) de un scooter frente al resto del catálogo. */
export function puntuacion(scooter: Scooter, todos: Scooter[]): number {
  const otros = todos.filter((s) => s.slug !== scooter.slug);
  const pct = (valor: number | null, de: (s: Scooter) => number | null, menorEsMejor = false) =>
    (superaA(valor, otros.map(de), menorEsMejor) ?? 100) / 100; // sin rivales: nota máxima

  const notas: Record<keyof typeof PESOS, number> = {
    autonomiaReal: pct(autonomiaReal(scooter), (s) => autonomiaReal(s)),
    velocidad: pct(scooter.velocidadMaxKmh, (s) => s.velocidadMaxKmh),
    potencia: pct(scooter.potenciaW, (s) => s.potenciaW),
    cargaMax: pct(scooter.cargaMaxKg, (s) => s.cargaMaxKg),
    ligereza: pct(scooter.pesoKg, (s) => s.pesoKg, true),
    suspension: NOTA_SUSPENSION[scooter.suspension],
    rueda: NOTA_RUEDA[scooter.tipoRueda],
    agua: nivelAgua(scooter.proteccionIP) / 8,
  };
  const total = (Object.keys(PESOS) as (keyof typeof PESOS)[]).reduce((suma, k) => suma + PESOS[k] * notas[k], 0);
  return Math.round(100 * total);
}
