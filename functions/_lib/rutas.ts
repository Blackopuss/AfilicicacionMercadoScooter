// Proveedor de rutas detrás de una interfaz pequeña: cambiar de Mapbox a otro solo toca este archivo.
// No es una ruta (no exporta onRequest*): Pages Functions solo enruta los handlers exportados.
import type { Punto } from '../../src/lib/mapa';

export type Env = { MAPBOX_TOKEN?: string };
export type Contexto = { request: Request; env: Env };

export type Ruta = {
  distanciaKm: number;
  duracionMin: number;
  /** Metros de subida acumulada; null si el proveedor no lo da (Mapbox no lo da en bici). */
  desnivelM: number | null;
  geometria: { type: 'LineString'; coordinates: [number, number][] };
};
// El buscador de direcciones no pasa por aquí: el navegador consulta Photon directo (docs/mapa.md).
export interface ProveedorRutas {
  /** null = el proveedor no encontró ruta entre los puntos. */
  ruta(desde: Punto, hasta: Punto): Promise<Ruta | null>;
}

export class ErrorProveedor extends Error {}

const TIMEOUT_MS = 8000;
const coord = ({ lon, lat }: Punto) => `${lon.toFixed(6)},${lat.toFixed(6)}`;

async function pedir(url: URL): Promise<unknown> {
  const res = await fetch(url, { signal: AbortSignal.timeout(TIMEOUT_MS) });
  // Mapbox responde 4xx con code "NoRoute"/"NoSegment" cuando no hay camino: eso no es un fallo del proveedor.
  if (!res.ok && res.status !== 404 && res.status !== 422) throw new ErrorProveedor(`Mapbox ${res.status}`);
  return res.json();
}

/** Mapbox Directions (perfil cycling, prioriza ciclovías). */
export function mapbox(token: string): ProveedorRutas {
  return {
    async ruta(desde, hasta) {
      const url = new URL(`https://api.mapbox.com/directions/v5/mapbox/cycling/${coord(desde)};${coord(hasta)}`);
      url.search = new URLSearchParams({ geometries: 'geojson', overview: 'full', access_token: token }).toString();
      const data = (await pedir(url)) as {
        code?: string;
        routes?: { distance: number; duration: number; geometry: Ruta['geometria'] }[];
      };
      const r = data.routes?.[0];
      if (data.code === 'NoRoute' || data.code === 'NoSegment') return null;
      if (data.code !== 'Ok' || !r) throw new ErrorProveedor(`Mapbox code ${data.code}`);
      return {
        distanciaKm: Math.round(r.distance / 100) / 10,
        duracionMin: Math.round(r.duration / 60),
        desnivelM: null,
        geometria: { type: 'LineString', coordinates: r.geometry.coordinates },
      };
    },
  };
}

/** Respuesta JSON. Los errores son genéricos: el detalle va a los logs, nunca al cliente. */
export function json(cuerpo: unknown, status = 200, cache = 'no-store'): Response {
  return new Response(JSON.stringify(cuerpo), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': status === 200 ? cache : 'no-store',
      'X-Content-Type-Options': 'nosniff',
    },
  });
}

const MAX_URL = 512;

/**
 * Pasos 1-2 y 6 de docs/seguridad.md §3: solo GET, solo desde nuestro origen, URL acotada, sin parámetros extra.
 * Devuelve los parámetros o la Response de error. Sin CORS: el navegador bloquea a otros orígenes.
 */
export function revisarPeticion(request: Request, permitidos: string[]): URLSearchParams | Response {
  if (request.method !== 'GET') return new Response(null, { status: 405, headers: { Allow: 'GET' } });
  const url = new URL(request.url);
  const origen = request.headers.get('Origin');
  const sitio = request.headers.get('Sec-Fetch-Site');
  if ((origen && origen !== url.origin) || (sitio && sitio !== 'same-origin' && sitio !== 'none')) {
    return json({ error: 'Origen no permitido.' }, 403);
  }
  if (request.url.length > MAX_URL) return json({ error: 'Petición demasiado larga.' }, 414);
  if ([...url.searchParams.keys()].some((k) => !permitidos.includes(k))) {
    return json({ error: 'Parámetros no válidos.' }, 400);
  }
  return url.searchParams;
}

export const SIN_TOKEN = () =>
  json({ error: 'El cálculo de rutas no está disponible. Escribe los km de tu trayecto a mano.' }, 503);

export function fallo(e: unknown): Response {
  console.error('Proveedor de rutas:', e);
  return json({ error: 'El servicio de rutas no respondió. Inténtalo de nuevo o escribe los km a mano.' }, 502);
}
