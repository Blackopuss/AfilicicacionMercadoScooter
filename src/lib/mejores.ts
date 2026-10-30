import { autonomiaReal, PESO_REFERENCIA_KG } from './autonomia';
import { conUnidad, ETIQUETA_RUEDA, ETIQUETA_SUSPENSION } from './especificaciones';
import type { Scooter } from './scooter';

/** Peso máximo del scooter para entrar en "ligeros". */
export const PESO_LIGERO_KG = 20;
/** Carga máxima que tiene que superar un modelo para "más de 100 kg". */
export const CARGA_MINIMA_KG = 100;
/** Peso de conductor con el que se muestra la autonomía en "más de 100 kg". */
export const PESO_CONDUCTOR_PESADO_KG = 110;

type Mejor = {
  nombre: string; // para chips y enlaces
  titulo: string;
  criterio: string;
  incluye: (s: Scooter) => boolean;
  /** El dato que decide la categoría, para mostrarlo en cada tarjeta. */
  dato: { etiqueta: string; texto: (s: Scooter) => string };
};

const real = { etiqueta: 'Autonomía real', texto: (s: Scooter) => `${autonomiaReal(s)} km` };

export const MEJORES = {
  urbano: {
    nombre: 'Urbanos',
    titulo: 'Mejores scooters urbanos',
    criterio:
      'Los modelos que en el catálogo clasificamos como urbanos: pensados para calles pavimentadas y trayectos diarios en la ciudad.',
    incluye: (s) => s.categorias.includes('urbano'),
    dato: real,
  },
  todoterreno: {
    nombre: 'Todoterreno',
    titulo: 'Mejores scooters todoterreno',
    criterio:
      'Los modelos que en el catálogo clasificamos como todoterreno, para calles en mal estado, empedrado o terracería ligera. En cada uno mostramos la suspensión y el tipo de rueda, que es lo que más se nota fuera del pavimento liso.',
    incluye: (s) => s.categorias.includes('todoterreno'),
    dato: { etiqueta: 'Suspensión y rueda', texto: (s) => `${ETIQUETA_SUSPENSION[s.suspension]} · ${ETIQUETA_RUEDA[s.tipoRueda]}` },
  },
  plegable: {
    nombre: 'Plegables',
    titulo: 'Mejores scooters plegables y compactos',
    criterio:
      'Que se pliegue no basta: aquí están los que en el catálogo clasificamos como plegables por ser compactos: los más fáciles de subir al transporte público o guardar en la oficina.',
    incluye: (s) => s.plegable && s.categorias.includes('plegable'),
    dato: { etiqueta: 'Peso', texto: (s) => conUnidad(s.pesoKg, 'kg') },
  },
  'larga-autonomia': {
    nombre: 'Larga autonomía',
    titulo: 'Scooters con más autonomía',
    criterio: `Los modelos que en el catálogo clasificamos de larga autonomía. Mostramos la autonomía real estimada en ciudad con ${PESO_REFERENCIA_KG} kg, no la del fabricante.`,
    incluye: (s) => s.categorias.includes('larga-autonomia'),
    dato: real,
  },
  'para-mas-de-100-kg': {
    nombre: 'Para más de 100 kg',
    titulo: 'Scooters para personas de más de 100 kg',
    criterio: `Carga máxima de más de ${CARGA_MINIMA_KG} kg según el fabricante. La carga máxima es el peso total que soporta: tú más lo que lleves encima. Con más peso baja la autonomía, así que la mostramos estimada con ${PESO_CONDUCTOR_PESADO_KG} kg.`,
    incluye: (s) => s.cargaMaxKg > CARGA_MINIMA_KG,
    dato: {
      etiqueta: `Carga máx. · real con ${PESO_CONDUCTOR_PESADO_KG} kg`,
      texto: (s) => `${conUnidad(s.cargaMaxKg, 'kg')} · ${autonomiaReal(s, { pesoKg: PESO_CONDUCTOR_PESADO_KG })} km`,
    },
  },
  ligeros: {
    nombre: 'Ligeros',
    titulo: 'Scooters eléctricos ligeros',
    criterio: `Pesan ${PESO_LIGERO_KG} kg o menos según el fabricante: los más fáciles de cargar por escaleras o en el transporte.`,
    incluye: (s) => s.pesoKg <= PESO_LIGERO_KG,
    dato: { etiqueta: 'Peso', texto: (s) => conUnidad(s.pesoKg, 'kg') },
  },
} satisfies Record<string, Mejor>;

export type CategoriaMejores = keyof typeof MEJORES;
export const CATEGORIAS_MEJORES = Object.keys(MEJORES) as CategoriaMejores[];

/** Los modelos de una categoría, del mejor al peor puntuado (empates por slug). */
export function ranking<T extends Scooter & { puntuacion: number }>(categoria: CategoriaMejores, catalogo: T[]): T[] {
  return catalogo
    .filter(MEJORES[categoria].incluye)
    .sort((a, b) => b.puntuacion - a.puntuacion || (a.slug < b.slug ? -1 : 1));
}

/** Las categorías de /mejores en las que entra un modelo. */
export function categoriasDe(s: Scooter): CategoriaMejores[] {
  return CATEGORIAS_MEJORES.filter((c) => MEJORES[c].incluye(s));
}
