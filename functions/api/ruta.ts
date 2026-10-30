import { parsePunto } from '../../src/lib/mapa';
import { fallo, json, mapbox, revisarPeticion, SIN_TOKEN, type Contexto } from '../_lib/rutas';

// GET /api/ruta?desde=lon,lat&hasta=lon,lat → { distanciaKm, duracionMin, desnivelM, geometria }
export async function onRequest({ request, env }: Contexto): Promise<Response> {
  const params = revisarPeticion(request, ['desde', 'hasta']);
  if (params instanceof Response) return params;
  if (!env.MAPBOX_TOKEN) return SIN_TOKEN();

  const desde = parsePunto(params.get('desde'));
  const hasta = parsePunto(params.get('hasta'));
  if (!desde || !hasta) return json({ error: 'Los dos puntos tienen que estar en México.' }, 400);

  try {
    const ruta = await mapbox(env.MAPBOX_TOKEN).ruta(desde, hasta);
    if (!ruta) return json({ error: 'No encontramos una ruta en bici entre esos dos puntos.' }, 404);
    return json(ruta, 200, 'public, max-age=300');
  } catch (e) {
    return fallo(e);
  }
}
