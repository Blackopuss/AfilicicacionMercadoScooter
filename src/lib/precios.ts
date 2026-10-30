import { createClient } from '@supabase/supabase-js';

export type PrecioActual = { precioMxn: number; disponible: boolean; verificadoEn: string };
type Env = { PUBLIC_SUPABASE_URL?: string; PUBLIC_SUPABASE_ANON_KEY?: string };
type Fila = { scooter_slug: string; precio_mxn: number; disponible: boolean; verificado_en: string };

/**
 * Último precio de cada modelo (vista precios_actuales), leído en tiempo de build.
 * Nunca rompe el build: sin variables o si falla la consulta devuelve un mapa vacío
 * y la web muestra "Precio pendiente".
 */
export async function getPreciosActuales(env: Env = import.meta.env): Promise<Map<string, PrecioActual>> {
  const precios = new Map<string, PrecioActual>();
  const { PUBLIC_SUPABASE_URL: url, PUBLIC_SUPABASE_ANON_KEY: key } = env;
  if (!url || !key) {
    console.warn('[precios] Faltan PUBLIC_SUPABASE_URL o PUBLIC_SUPABASE_ANON_KEY: sin precios en este build.');
    return precios;
  }
  try {
    const supabase = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
    const { data, error } = await supabase
      .from('precios_actuales')
      .select('scooter_slug, precio_mxn, disponible, verificado_en')
      .abortSignal(AbortSignal.timeout(10_000)); // una base caída no deja el build colgado
    if (error) throw error;
    for (const f of (data ?? []) as Fila[]) {
      precios.set(f.scooter_slug, { precioMxn: f.precio_mxn, disponible: f.disponible, verificadoEn: f.verificado_en });
    }
  } catch (e) {
    console.warn('[precios] No se pudieron leer los precios: sin precios en este build.', e);
  }
  return precios;
}

export const PRECIO_MAX = 200_000;

/** Precio capturable en /admin: entero en pesos de 1 a 200 000 (el mismo check que la tabla precios). */
export function esPrecioValido(mxn: number): boolean {
  return Number.isInteger(mxn) && mxn >= 1 && mxn <= PRECIO_MAX;
}
