import { describe, expect, it } from 'vitest';
import { MAX_VISITA_MS, MIN_VISITA_MS, tocaPopup } from '../../src/lib/popup';

describe('tocaPopup', () => {
  it('nunca en el primer minuto, ni con mucho interés', () => {
    expect(tocaPopup(MIN_VISITA_MS - 1, 10, 'salida')).toBe(false);
    expect(tocaPopup(0, 5, 'scroll')).toBe(false);
  });
  it('a los 5 minutos siempre, con cualquier señal', () => {
    expect(tocaPopup(MAX_VISITA_MS, 0, 'tiempo')).toBe(true);
    expect(tocaPopup(MAX_VISITA_MS + 1, 0, 'scroll')).toBe(true);
  });
  it('entre 1 y 5 minutos solo con 2+ fichas vistas y una señal de salida o lectura', () => {
    const t = 2 * 60_000;
    expect(tocaPopup(t, 1, 'salida')).toBe(false);
    expect(tocaPopup(t, 2, 'salida')).toBe(true);
    expect(tocaPopup(t, 2, 'scroll')).toBe(true);
    expect(tocaPopup(t, 3, 'tiempo')).toBe(false);
  });
});
