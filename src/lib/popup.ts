// Cuándo abrir el popup de alertas: nunca al llegar, siempre a los 5 minutos de visita y, antes, solo si hay
// interés claro (varias fichas vistas) y una señal de que la persona se va o terminó de leer.
export const MIN_VISITA_MS = 60_000;
export const MAX_VISITA_MS = 5 * 60_000;
export const FICHAS_INTERES = 2;

export type Senal = 'tiempo' | 'salida' | 'scroll';

export function tocaPopup(msEnVisita: number, fichasVistas: number, senal: Senal): boolean {
  if (msEnVisita < MIN_VISITA_MS) return false;
  if (msEnVisita >= MAX_VISITA_MS) return true;
  return senal !== 'tiempo' && fichasVistas >= FICHAS_INTERES;
}
