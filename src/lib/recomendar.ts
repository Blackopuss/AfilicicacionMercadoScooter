import { autonomiaReal } from './autonomia';
import type { Scooter } from './scooter';

/** Llegar con la batería en cero no cuenta: se exige un 20 % de margen sobre la distancia diaria. */
export const MARGEN_DISTANCIA = 1.2;

export type Respuestas = {
  distanciaKm: number; // ida y vuelta, en un día
  pesoKg: number;
  presupuestoMxn: number | null; // null = sin límite
  subidas: boolean;
  portatil: boolean; // lo tiene que cargar (escaleras, metro, cajuela)
};

/** Lo mínimo de un modelo que necesita la recomendación (viaja al navegador). */
export type Candidato = Pick<
  Scooter,
  'slug' | 'marca' | 'modelo' | 'autonomiaFabricanteKm' | 'pesoKg' | 'cargaMaxKg' | 'plegable'
> & { puntuacion: number; precioMxn: number | null };

export type Recomendacion<T extends Candidato = Candidato> = {
  scooter: T;
  autonomiaKm: number;
  llega: boolean;
  cumple: boolean;
  motivos: string[];
};

/**
 * Los `n` mejores modelos para las respuestas. Primero los que cumplen todo (llegan con margen,
 * aguantan el peso, son plegables si hay que cargarlo y no pasan del presupuesto), por puntuación;
 * si cargarlo importa, cada kg resta un punto. Si no hay `n` que cumplan, se completa con los más
 * cercanos, marcados con `cumple: false` y el motivo. Sin precio conocido el presupuesto no descarta.
 */
export function recomendar<T extends Candidato>(r: Respuestas, catalogo: T[], n = 3): Recomendacion<T>[] {
  const necesarioKm = Math.ceil(r.distanciaKm * MARGEN_DISTANCIA);
  const orden = (s: Candidato) => s.puntuacion - (r.portatil ? s.pesoKg : 0);

  const evaluados = catalogo.map((scooter) => {
    const autonomiaKm = autonomiaReal(scooter, { pesoKg: r.pesoKg, conSubidas: r.subidas });
    const llega = autonomiaKm >= r.distanciaKm * MARGEN_DISTANCIA;
    const fallos: string[] = [];
    if (!llega) fallos.push(`No llega: unos ${autonomiaKm} km reales y necesitas ${necesarioKm} con margen`);
    if (r.pesoKg > scooter.cargaMaxKg) fallos.push(`Aguanta hasta ${scooter.cargaMaxKg} kg`);
    if (r.portatil && !scooter.plegable) fallos.push('No es plegable');
    if (r.presupuestoMxn !== null && scooter.precioMxn !== null && scooter.precioMxn > r.presupuestoMxn) {
      fallos.push('Se pasa de tu presupuesto');
    }

    const motivos = fallos.length
      ? fallos
      : [`Te sobra ${Math.round(100 * (1 - r.distanciaKm / autonomiaKm))} % de batería`];
    if (!fallos.length && r.portatil) motivos.push(`Pesa ${scooter.pesoKg} kg`);
    if (r.presupuestoMxn !== null && scooter.precioMxn === null) {
      motivos.push('Sin precio verificado: el presupuesto no lo descarta');
    }
    return { scooter, autonomiaKm, llega, cumple: !fallos.length, motivos, fallos: fallos.length };
  });

  return evaluados
    .sort(
      (a, b) =>
        a.fallos - b.fallos ||
        (a.cumple ? 0 : b.autonomiaKm - a.autonomiaKm) || // los que no cumplen: el que más se acerca
        orden(b.scooter) - orden(a.scooter),
    )
    .slice(0, n)
    .map(({ fallos: _, ...rec }) => rec);
}

// Parámetros de la URL: d distancia, p peso, b presupuesto ("sin" = sin límite), s subidas, c cargarlo.
const LIMITES = { d: [1, 100], p: [30, 200], b: [1000, 200_000] } as const;

function entero(valor: string | null, [min, max]: readonly [number, number]): number | undefined {
  if (valor === null || !/^\d{1,7}$/.test(valor)) return undefined;
  return Math.min(max, Math.max(min, Number(valor)));
}

function siNo(valor: string | null): boolean | undefined {
  return valor === '1' ? true : valor === '0' ? false : undefined;
}

/** Lee y acota las respuestas de la URL. Lo que no es válido se queda sin contestar (undefined). */
export function leerRespuestas(params: URLSearchParams): Partial<Respuestas> {
  const b = params.get('b');
  return {
    distanciaKm: entero(params.get('d'), LIMITES.d),
    pesoKg: entero(params.get('p'), LIMITES.p),
    presupuestoMxn: b === 'sin' ? null : entero(b, LIMITES.b),
    subidas: siNo(params.get('s')),
    portatil: siNo(params.get('c')),
  };
}

/** Las respuestas contestadas, como parámetros de URL (inverso de leerRespuestas). */
export function aParametros(r: Partial<Respuestas>): URLSearchParams {
  const params = new URLSearchParams();
  if (r.distanciaKm !== undefined) params.set('d', String(r.distanciaKm));
  if (r.pesoKg !== undefined) params.set('p', String(r.pesoKg));
  if (r.presupuestoMxn !== undefined) params.set('b', r.presupuestoMxn === null ? 'sin' : String(r.presupuestoMxn));
  if (r.subidas !== undefined) params.set('s', r.subidas ? '1' : '0');
  if (r.portatil !== undefined) params.set('c', r.portatil ? '1' : '0');
  return params;
}

const CLAVES = ['distanciaKm', 'pesoKg', 'presupuestoMxn', 'subidas', 'portatil'] as const;

export function completas(r: Partial<Respuestas>): r is Respuestas {
  return CLAVES.every((k) => r[k] !== undefined);
}
