import { fallo, json, mapbox, revisarPeticion, SIN_TOKEN, type Contexto } from '../_lib/rutas';

// GET /api/geocode?q=texto → { lugares: [{ nombre, lon, lat }] } (solo México)
export async function onRequest({ request, env }: Contexto): Promise<Response> {
  const params = revisarPeticion(request, ['q']);
  if (params instanceof Response) return params;
  if (!env.MAPBOX_TOKEN) return SIN_TOKEN();

  const q = (params.get('q') ?? '').trim();
  if (q.length < 3 || q.length > 120) return json({ error: 'Escribe entre 3 y 120 caracteres.' }, 400);

  try {
    // no-store: Mapbox no permite guardar resultados de geocodificación temporal (docs/mapa.md).
    return json({ lugares: await mapbox(env.MAPBOX_TOKEN).buscar(q) });
  } catch (e) {
    return fallo(e);
  }
}
