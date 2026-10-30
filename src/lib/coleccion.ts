import { getCollection, getEntry } from 'astro:content';
import { getPreciosActuales, type PrecioActual } from './precios';
import { puntuacion } from './puntuacion';
import { ordenarScooters, type Scooter } from './scooter';

/** Todos los scooters activos, ordenados por marca y modelo. */
export async function getScooters(): Promise<Scooter[]> {
  const entradas = await getCollection('scooters');
  return ordenarScooters(entradas.map((e) => ({ slug: e.id, ...e.data })));
}

/** Un scooter por slug, o undefined si no existe o está inactivo. */
export async function getScooter(slug: string): Promise<Scooter | undefined> {
  const e = await getEntry('scooters', slug);
  return e?.data.activo ? { slug: e.id, ...e.data } : undefined;
}

export type ScooterCatalogo = Scooter & { puntuacion: number; precio: PrecioActual | null; precioMxn: number | null };

/** Activos con su puntuación y su último precio, los mejor puntuados primero. */
export async function getCatalogo(): Promise<ScooterCatalogo[]> {
  const [scooters, precios] = await Promise.all([getScooters(), getPreciosActuales()]);
  return scooters
    .map((s) => {
      const precio = precios.get(s.slug) ?? null;
      return { ...s, puntuacion: puntuacion(s, scooters), precio, precioMxn: precio?.precioMxn ?? null };
    })
    .sort((a, b) => b.puntuacion - a.puntuacion);
}
