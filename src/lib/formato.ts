export const PRECIO_PENDIENTE = 'Precio pendiente';

const MXN = new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', maximumFractionDigits: 0 });

/** "$12,499" (pesos enteros). Sin precio → "Precio pendiente". */
export function formatoPrecio(mxn: number | null | undefined): string {
  if (mxn == null) return PRECIO_PENDIENTE;
  if (!Number.isFinite(mxn) || mxn < 0) throw new RangeError(`Precio inválido: ${mxn}`);
  return MXN.format(Math.round(mxn));
}

const FECHA = new Intl.DateTimeFormat('es-MX', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
  timeZone: 'America/Mexico_City',
});

/** "30 oct 2026" (hora de la Ciudad de México) a partir de una fecha ISO. */
export function formatoFecha(iso: string): string {
  const fecha = new Date(iso);
  if (Number.isNaN(fecha.getTime())) throw new RangeError(`Fecha inválida: ${iso}`);
  return FECHA.format(fecha);
}
