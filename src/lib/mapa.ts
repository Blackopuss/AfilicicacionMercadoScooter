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

export type Lugar = Punto & { nombre: string };
/** Lugar con su nombre partido en dos líneas para la lista de sugerencias. */
export type Sugerencia = Lugar & { titulo: string; detalle: string };

// Sin `lang`: la instancia pública de Photon responde 400 a lang=es. Sin él usa el Accept-Language del navegador
// y cae al nombre local, que en México ya está en español.
export function urlPhoton(q: string): string {
  return `https://photon.komoot.io/api/?${new URLSearchParams({ q, limit: '5', bbox: MEXICO_BBOX.join(',') })}`;
}

type PropsPhoton = Partial<
  Record<'name' | 'street' | 'housenumber' | 'locality' | 'district' | 'city' | 'state' | 'countrycode', unknown>
>;
const texto = (v: unknown) => (typeof v === 'string' ? v.trim().slice(0, 120) : '');

/** Respuesta GeoJSON de Photon → sugerencias en México: "Lugar · calle y número, colonia, ciudad, estado". */
export function sugerenciasPhoton(data: unknown): Sugerencia[] {
  const features = (data as { features?: unknown })?.features;
  if (!Array.isArray(features)) return [];
  const vistos = new Set<string>();
  return features.flatMap((f) => {
    const [lon, lat] = (f?.geometry?.coordinates ?? []) as unknown[];
    const p: PropsPhoton = f?.properties ?? {};
    if (typeof lon !== 'number' || typeof lat !== 'number' || !enMexico({ lon, lat })) return [];
    // El recuadro de México toca Guatemala, Belice y EE. UU.: el país manda cuando viene.
    if (p.countrycode !== undefined && p.countrycode !== 'MX') return [];
    const calle = [texto(p.street), texto(p.housenumber)].filter(Boolean).join(' ');
    const ciudad = texto(p.city) || texto(p.district);
    const partes = [texto(p.name), calle, texto(p.locality), ciudad, texto(p.state)].filter(Boolean);
    // Sin repetir: "Ciudad de México, Ciudad de México" o un nombre igual a la calle.
    const unicas = partes.filter((x, i) => partes.findIndex((y) => y.toLowerCase() === x.toLowerCase()) === i);
    const [titulo, ...resto] = unicas;
    if (!titulo) return [];
    const nombre = unicas.join(', ');
    if (vistos.has(nombre)) return [];
    vistos.add(nombre);
    return [{ nombre, titulo, detalle: resto.join(', '), lon, lat }];
  });
}

/** Distancia en línea recta (km) sobre la Tierra, fórmula de haversine. */
export function distanciaRectaKm(a: Punto, b: Punto): number {
  const rad = Math.PI / 180;
  const h =
    Math.sin(((b.lat - a.lat) * rad) / 2) ** 2 +
    Math.cos(a.lat * rad) * Math.cos(b.lat * rad) * Math.sin(((b.lon - a.lon) * rad) / 2) ** 2;
  return 2 * 6371 * Math.asin(Math.sqrt(h));
}

/**
 * Las calles no van en línea recta: en ciudad la ruta real suele ser entre 1.2 y 1.4 veces la recta
 * (índice de desvío o "circuity"). 1.3 es un punto medio; la página lo presenta siempre como estimado.
 */
export const FACTOR_DESVIO = 1.3;

/** Km estimados por calle a partir de la línea recta, con un decimal. */
export const kmEstimados = (a: Punto, b: Punto) => Math.round(distanciaRectaKm(a, b) * FACTOR_DESVIO * 10) / 10;
