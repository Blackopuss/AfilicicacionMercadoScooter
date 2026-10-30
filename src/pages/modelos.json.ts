import { getScooters } from '../lib/coleccion';

// slug → "Marca Modelo". Lo leen functions/ (vía ASSETS) para validar el modelo de una alerta y nombrarlo en los emails.
export async function GET() {
  const scooters = await getScooters();
  return Response.json(Object.fromEntries(scooters.map((s) => [s.slug, `${s.marca} ${s.modelo}`])));
}
