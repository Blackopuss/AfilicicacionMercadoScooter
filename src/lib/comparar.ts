import { autonomiaReal } from './autonomia';

/** Máximo de modelos en la vista lado a lado. */
export const MAX_COMPARAR = 3;

/** Lo que el comparador necesita de cada modelo para filtrar y ordenar en el cliente. */
export type Fila = {
  slug: string;
  puntuacion: number;
  precioMxn: number | null;
  autonomiaFabricanteKm: number;
  pesoKg: number;
  plegable: boolean;
  categorias: string[];
};

/** Filtros vacíos (undefined) no filtran. */
export type Filtros = {
  precioMax?: number;
  autonomiaMin?: number;
  pesoConductorKg?: number;
  pesoMax?: number;
  soloPlegables?: boolean;
  categoria?: string;
};

export const ORDENES = {
  puntuacion: 'Puntuación',
  precio: 'Precio (menor primero)',
  autonomia: 'Autonomía real (mayor primero)',
  peso: 'Peso (menor primero)',
} as const;
export type Orden = keyof typeof ORDENES;

/**
 * Slugs que pasan los filtros, en el orden pedido (estable ante empates).
 * Con precio máximo, los modelos sin precio verificado quedan fuera: no se puede saber si cumplen.
 */
export function filtrarYOrdenar(filas: Fila[], f: Filtros, orden: Orden): string[] {
  const conAutonomia = filas.map((fila) => ({ ...fila, autonomia: autonomiaReal(fila, { pesoKg: f.pesoConductorKg }) }));
  const pasan = conAutonomia.filter(
    (s) =>
      (f.precioMax === undefined || (s.precioMxn !== null && s.precioMxn <= f.precioMax)) &&
      (f.autonomiaMin === undefined || s.autonomia >= f.autonomiaMin) &&
      (f.pesoMax === undefined || s.pesoKg <= f.pesoMax) &&
      (!f.soloPlegables || s.plegable) &&
      (!f.categoria || s.categorias.includes(f.categoria)),
  );
  const clave: Record<Orden, (s: (typeof pasan)[number]) => number> = {
    puntuacion: (s) => -s.puntuacion,
    precio: (s) => s.precioMxn ?? Infinity, // sin precio al final
    autonomia: (s) => -s.autonomia,
    peso: (s) => s.pesoKg,
  };
  return pasan.sort((a, b) => clave[orden](a) - clave[orden](b)).map((s) => s.slug);
}

/**
 * Qué posiciones ganan una especificación (empates incluidos).
 * Nadie gana si hay menos de dos valores con dato o si todos son iguales.
 */
export function ganadores(valores: (number | null)[], menorEsMejor = false): boolean[] {
  const conDato = valores.filter((v): v is number => v !== null);
  const mejor = menorEsMejor ? Math.min(...conDato) : Math.max(...conDato);
  const hayGanador = conDato.length >= 2 && conDato.some((v) => v !== mejor);
  return valores.map((v) => hayGanador && v === mejor);
}

/** Slugs válidos de `?m=a,b,c`, sin repetir y como mucho MAX_COMPARAR. */
export function leerSeleccion(param: string | null, validos: Iterable<string>): string[] {
  const permitidos = new Set(validos);
  const slugs = (param ?? '').split(',').map((s) => s.trim());
  return [...new Set(slugs)].filter((s) => permitidos.has(s)).slice(0, MAX_COMPARAR);
}

type ConPrecio = { slug: string; precioMxn: number | null; puntuacion: number };

/** Hasta `n` modelos más baratos que `actual`, los mejor puntuados primero. Sin precio actual → ninguno. */
export function alternativasMasBaratas<T extends ConPrecio>(actual: ConPrecio, todos: T[], n = 3): T[] {
  const precio = actual.precioMxn;
  if (precio === null) return [];
  return todos
    .filter((s) => s.slug !== actual.slug && s.precioMxn !== null && s.precioMxn < precio)
    .sort((a, b) => b.puntuacion - a.puntuacion || a.precioMxn! - b.precioMxn!)
    .slice(0, n);
}
