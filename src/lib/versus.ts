import { autonomiaReal } from './autonomia';
import { ganadores } from './comparar';
import { conUnidad, ETIQUETA_RUEDA, ETIQUETA_SUSPENSION } from './especificaciones';
import { formatoPrecio } from './formato';
import { nivelAgua, NOTA_RUEDA, NOTA_SUSPENSION } from './puntuacion';
import type { Scooter } from './scooter';

/** Lo que una página "A vs B" sabe de cada modelo. */
export type Rival = Scooter & { puntuacion: number; precioMxn: number | null };

const porSlug = (x: { slug: string }, y: { slug: string }) => (x.slug < y.slug ? -1 : x.slug > y.slug ? 1 : 0);

/** Ruta de la comparativa: los slugs siempre en orden alfabético, así cada par tiene una sola página. */
export function rutaVs(a: string, b: string): string {
  const [x, y] = a < b ? [a, b] : [b, a];
  return `/comparar/${x}-vs-${y}`;
}

/** Todos los pares sin repetir, con el slug menor primero. */
export function pares<T extends { slug: string }>(modelos: T[]): [T, T][] {
  const orden = [...modelos].sort(porSlug);
  return orden.flatMap((a, i) => orden.slice(i + 1).map((b): [T, T] => [a, b]));
}

const suspension = (s: Rival) =>
  s.suspension === 'ninguna' ? 'sin suspensión' : `suspensión ${ETIQUETA_SUSPENSION[s.suspension].toLowerCase()}`;

type Razon = {
  valor: (s: Rival) => number | null;
  menorEsMejor?: boolean;
  /** Completa la frase "Elige <gana> si…". */
  texto: (gana: Rival, pierde: Rival) => string;
};

// Cada razón sale de una especificación en la que un modelo gana al otro; nunca de opiniones.
const RAZONES: Razon[] = [
  {
    valor: (s) => s.puntuacion,
    texto: (g, p) => `quieres el de mejor puntuación global: ${g.puntuacion}/100 contra ${p.puntuacion}/100`,
  },
  {
    valor: (s) => s.precioMxn,
    menorEsMejor: true,
    texto: (g, p) => `buscas gastar menos: ${formatoPrecio(g.precioMxn)} contra ${formatoPrecio(p.precioMxn)}`,
  },
  {
    valor: (s) => autonomiaReal(s),
    texto: (g, p) => `quieres llegar más lejos: ${autonomiaReal(g)} km reales contra ${autonomiaReal(p)} km`,
  },
  {
    valor: (s) => s.velocidadMaxKmh,
    texto: (g, p) => `quieres ir más rápido: ${conUnidad(g.velocidadMaxKmh, 'km/h')} contra ${conUnidad(p.velocidadMaxKmh, 'km/h')}`,
  },
  {
    valor: (s) => s.potenciaW,
    texto: (g, p) => `necesitas más fuerza: ${conUnidad(g.potenciaW, 'W')} de potencia nominal contra ${conUnidad(p.potenciaW, 'W')}`,
  },
  {
    valor: (s) => s.pendienteMaxPct,
    texto: (g, p) => `tu ruta tiene cuestas: sube pendientes de hasta ${conUnidad(g.pendienteMaxPct, '%')} contra ${conUnidad(p.pendienteMaxPct, '%')}`,
  },
  {
    valor: (s) => s.cargaMaxKg,
    texto: (g, p) => `necesitas que aguante más peso: hasta ${conUnidad(g.cargaMaxKg, 'kg')} contra ${conUnidad(p.cargaMaxKg, 'kg')}`,
  },
  {
    valor: (s) => s.pesoKg,
    menorEsMejor: true,
    texto: (g, p) => `lo vas a cargar seguido: pesa ${conUnidad(g.pesoKg, 'kg')} contra ${conUnidad(p.pesoKg, 'kg')}`,
  },
  {
    valor: (s) => s.tiempoCargaH,
    menorEsMejor: true,
    texto: (g, p) => `quieres cargarlo más rápido: ${conUnidad(g.tiempoCargaH, 'h')} contra ${conUnidad(p.tiempoCargaH, 'h')}`,
  },
  {
    valor: (s) => NOTA_SUSPENSION[s.suspension],
    texto: (g, p) => `tus calles tienen baches y topes: ${suspension(g)} contra ${suspension(p)}`,
  },
  {
    valor: (s) => NOTA_RUEDA[s.tipoRueda],
    texto: (g, p) =>
      `quieres más agarre y confort: ruedas ${ETIQUETA_RUEDA[g.tipoRueda].toLowerCase()} contra ${ETIQUETA_RUEDA[p.tipoRueda].toLowerCase()}`,
  },
  {
    valor: (s) => nivelAgua(s.proteccionIP),
    texto: (g, p) => `lo vas a usar con lluvia: ${g.proteccionIP} contra ${p.proteccionIP ?? 'sin certificación IP'}`,
  },
];

/** "Elige A si…" y "Elige B si…": una frase por cada especificación en la que gana cada uno. */
export function razones(a: Rival, b: Rival): { a: string[]; b: string[] } {
  const r = { a: [] as string[], b: [] as string[] };
  for (const { valor, menorEsMejor, texto } of RAZONES) {
    const [ganaA, ganaB] = ganadores([valor(a), valor(b)], menorEsMejor);
    if (ganaA) r.a.push(texto(a, b));
    if (ganaB) r.b.push(texto(b, a));
  }
  return r;
}

type ConCategorias = { slug: string; categorias: readonly string[]; puntuacion: number };

/** Los `n` rivales más parecidos: más categorías en común, luego la puntuación más cercana. */
export function rivales<T extends ConCategorias>(s: ConCategorias, todos: T[], n = 3): T[] {
  const comunes = (o: T) => o.categorias.filter((c) => s.categorias.includes(c)).length;
  const distancia = (o: T) => Math.abs(o.puntuacion - s.puntuacion);
  return todos
    .filter((o) => o.slug !== s.slug)
    .sort((x, y) => comunes(y) - comunes(x) || distancia(x) - distancia(y) || porSlug(x, y))
    .slice(0, n);
}
