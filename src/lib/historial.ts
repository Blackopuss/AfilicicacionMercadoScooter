import { createClient } from '@supabase/supabase-js';

export type PuntoHistorial = { fecha: string; precioMxn: number; disponible: boolean };
type Env = { PUBLIC_SUPABASE_URL?: string; PUBLIC_SUPABASE_ANON_KEY?: string };
type Fila = { precio_mxn: number; disponible: boolean; verificado_en: string };

const DIA_MS = 86_400_000;

/**
 * Precios capturados de un modelo en los últimos `dias`, del más antiguo al más reciente, leídos en el build.
 * Como getPreciosActuales: sin variables o si falla la consulta devuelve [] y no rompe el build.
 */
export async function getHistorial(slug: string, dias = 90, env: Env = import.meta.env): Promise<PuntoHistorial[]> {
  const { PUBLIC_SUPABASE_URL: url, PUBLIC_SUPABASE_ANON_KEY: key } = env;
  if (!url || !key) return [];
  try {
    const supabase = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
    const { data, error } = await supabase
      .from('precios')
      .select('precio_mxn, disponible, verificado_en')
      .eq('scooter_slug', slug)
      .gte('verificado_en', new Date(Date.now() - dias * DIA_MS).toISOString())
      .order('verificado_en', { ascending: true })
      .order('id', { ascending: true })
      .abortSignal(AbortSignal.timeout(10_000));
    if (error) throw error;
    return ((data ?? []) as Fila[]).map((f) => ({ fecha: f.verificado_en, precioMxn: f.precio_mxn, disponible: f.disponible }));
  } catch (e) {
    console.warn(`[historial] No se pudo leer el historial de ${slug}: sin gráfica en este build.`, e);
    return [];
  }
}

export type ResumenHistorial = {
  min: PuntoHistorial;
  max: PuntoHistorial;
  /** Precio más bajo con stock en los últimos 30 días; null si no hubo stock. */
  minimo30d: PuntoHistorial | null;
};

/** Extremos del historial (puntos en orden cronológico). Ante empate gana el más reciente. null si está vacío. */
export function resumenHistorial(puntos: PuntoHistorial[], ahora = new Date()): ResumenHistorial | null {
  if (!puntos.length) return null;
  const desde = ahora.getTime() - 30 * DIA_MS;
  let min = puntos[0];
  let max = puntos[0];
  let minimo30d: PuntoHistorial | null = null;
  for (const p of puntos) {
    if (p.precioMxn <= min.precioMxn) min = p;
    if (p.precioMxn >= max.precioMxn) max = p;
    if (p.disponible && Date.parse(p.fecha) >= desde && (!minimo30d || p.precioMxn <= minimo30d.precioMxn)) minimo30d = p;
  }
  return { min, max, minimo30d };
}
