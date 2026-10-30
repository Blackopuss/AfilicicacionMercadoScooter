/** Recuadro de México en [oeste, sur, este, norte] (lon/lat), con un margen pequeño sobre sus islas extremas. */
export const MEXICO_BBOX = [-118.6, 14.4, -86.5, 32.8] as const;

export type Punto = { lon: number; lat: number };

export function enMexico({ lon, lat }: Punto): boolean {
  const [oeste, sur, este, norte] = MEXICO_BBOX;
  return lon >= oeste && lon <= este && lat >= sur && lat <= norte;
}

/** "lon,lat" → Punto dentro de México, o null si el texto no es exactamente eso. */
export function parsePunto(texto: string | null): Punto | null {
  const m = texto?.match(/^(-?\d{1,3}(?:\.\d{1,8})?),(-?\d{1,2}(?:\.\d{1,8})?)$/);
  if (!m) return null;
  const punto = { lon: Number(m[1]), lat: Number(m[2]) };
  return enMexico(punto) ? punto : null;
}

export type Alcance = {
  llega: boolean;
  /** Porcentaje de batería que queda al terminar (0 si no llega). */
  sobraPct: number;
  /** Km de margen; negativo = los km que le faltan. */
  sobraKm: number;
};

/** ¿Alcanza la autonomía (km) para la distancia (km)? */
export function alcance(autonomiaKm: number, distanciaKm: number): Alcance {
  if (!(autonomiaKm > 0)) throw new RangeError('autonomiaKm debe ser mayor que 0');
  if (!(distanciaKm >= 0)) throw new RangeError('distanciaKm no puede ser negativa');
  const sobraKm = Math.round((autonomiaKm - distanciaKm) * 10) / 10;
  const llega = sobraKm >= 0;
  return { llega, sobraPct: llega ? Math.floor((sobraKm / autonomiaKm) * 100) : 0, sobraKm };
}
