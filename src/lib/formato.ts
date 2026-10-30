export const PRECIO_PENDIENTE = 'Precio pendiente';

const MXN = new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', maximumFractionDigits: 0 });

/** "$12,499" (pesos enteros). Sin precio → "Precio pendiente". */
export function formatoPrecio(mxn: number | null | undefined): string {
  if (mxn == null) return PRECIO_PENDIENTE;
  if (!Number.isFinite(mxn) || mxn < 0) throw new RangeError(`Precio inválido: ${mxn}`);
  return MXN.format(Math.round(mxn));
}
