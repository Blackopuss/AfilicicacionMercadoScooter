// Contador anónimo de clics en los links de afiliado: dónde se dio el clic y cómo se resume en /admin.

/** Lugares de la web con link de afiliado (data-lugar). Lista cerrada: la misma en supabase/migrations/0003_clics.sql. */
export const LUGARES_CLIC = ['ficha', 'comparar', 'versus', 'mejores', 'portada'] as const;
export type LugarClic = (typeof LUGARES_CLIC)[number];

export const ZONA_MEXICO = 'America/Mexico_City'; // el día del contador se cuenta en hora del centro de México

/** Primer día (YYYY-MM-DD, hora de México) de los últimos 7 días, hoy incluido. */
export function desdeSemana(ahora: Date): string {
  return new Date(ahora.getTime() - 6 * 86_400_000).toLocaleDateString('en-CA', { timeZone: ZONA_MEXICO });
}

export type FilaClic = { scooter_slug: string; lugar: string; total: number };
export type Conteo = [nombre: string, total: number];

/** Suma las filas diarias por modelo y por lugar, de más a menos clics. */
export function resumirClics(filas: FilaClic[]): { total: number; porModelo: Conteo[]; porLugar: Conteo[] } {
  const sumar = (clave: 'scooter_slug' | 'lugar') => {
    const m = new Map<string, number>();
    for (const f of filas) m.set(f[clave], (m.get(f[clave]) ?? 0) + f.total);
    return [...m].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
  };
  return { total: filas.reduce((s, f) => s + f.total, 0), porModelo: sumar('scooter_slug'), porLugar: sumar('lugar') };
}
