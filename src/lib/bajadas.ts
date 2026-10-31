import type { PuntoHistorial } from './historial';

export const DIAS_BAJADA = 7;
const DIA_MS = 86_400_000;

export type Bajada = { slug: string; porcentaje: number; precioMxn: number; antesMxn: number; verificadoEn: string };

/**
 * Modelos cuyo precio bajó en los últimos 7 días, la mayor bajada primero.
 * Se compara el último precio (con stock) contra el más alto con stock capturado en la semana:
 * con capturas a mano y días sin dato, el de "hace exactamente 7 días" puede no existir.
 * Bajadas que redondean a menos de 1 % no cuentan.
 */
export function bajadasSemana(historiales: { slug: string; puntos: PuntoHistorial[] }[], ahora = new Date()): Bajada[] {
  const desde = ahora.getTime() - DIAS_BAJADA * DIA_MS;
  const bajadas: Bajada[] = [];
  for (const { slug, puntos } of historiales) {
    const semana = puntos.filter((p) => Date.parse(p.fecha) >= desde);
    const actual = semana.at(-1);
    if (!actual?.disponible) continue;
    const antesMxn = Math.max(...semana.filter((p) => p.disponible).map((p) => p.precioMxn));
    const porcentaje = Math.round(((antesMxn - actual.precioMxn) / antesMxn) * 100);
    if (porcentaje >= 1) bajadas.push({ slug, porcentaje, precioMxn: actual.precioMxn, antesMxn, verificadoEn: actual.fecha });
  }
  return bajadas.sort((a, b) => b.porcentaje - a.porcentaje);
}
