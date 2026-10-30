import { getCollection, getEntry } from 'astro:content';
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
