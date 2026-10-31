import { describe, expect, it } from 'vitest';
import { bajadasSemana } from '../../src/lib/bajadas';
import type { PuntoHistorial } from '../../src/lib/historial';

const AHORA = new Date('2026-10-30T15:00:00Z');
const p = (fecha: string, precioMxn: number, disponible = true): PuntoHistorial => ({ fecha, precioMxn, disponible });

describe('bajadasSemana', () => {
  it('sin historial no hay bajadas', () => {
    expect(bajadasSemana([], AHORA)).toEqual([]);
    expect(bajadasSemana([{ slug: 'a', puntos: [] }], AHORA)).toEqual([]);
  });

  it('compara el último precio contra el más alto de la semana, con su fecha', () => {
    const puntos = [p('2026-10-24T15:00:00Z', 10_000), p('2026-10-26T15:00:00Z', 12_000), p('2026-10-30T14:00:00Z', 9_000)];
    expect(bajadasSemana([{ slug: 'a', puntos }], AHORA)).toEqual([
      { slug: 'a', porcentaje: 25, precioMxn: 9_000, antesMxn: 12_000, verificadoEn: '2026-10-30T14:00:00Z' },
    ]);
  });

  it('ignora precios de hace más de 7 días y los que no tenían stock', () => {
    const puntos = [p('2026-10-20T15:00:00Z', 20_000), p('2026-10-25T15:00:00Z', 15_000, false), p('2026-10-29T15:00:00Z', 10_000)];
    expect(bajadasSemana([{ slug: 'a', puntos }], AHORA)).toEqual([]);
  });

  it('no cuenta subidas, precios iguales, bajadas de menos de 1 % ni el último sin stock', () => {
    const h = (slug: string, ...puntos: PuntoHistorial[]) => ({ slug, puntos });
    expect(
      bajadasSemana(
        [
          h('sube', p('2026-10-25T15:00:00Z', 9_000), p('2026-10-29T15:00:00Z', 10_000)),
          h('igual', p('2026-10-25T15:00:00Z', 9_000), p('2026-10-29T15:00:00Z', 9_000)),
          h('poco', p('2026-10-25T15:00:00Z', 10_000), p('2026-10-29T15:00:00Z', 9_960)),
          h('agotado', p('2026-10-25T15:00:00Z', 10_000), p('2026-10-29T15:00:00Z', 5_000, false)),
        ],
        AHORA,
      ),
    ).toEqual([]);
  });

  it('ordena de la mayor bajada a la menor', () => {
    const h = (slug: string, antes: number, ahora: number) => ({
      slug,
      puntos: [p('2026-10-25T15:00:00Z', antes), p('2026-10-29T15:00:00Z', ahora)],
    });
    expect(bajadasSemana([h('a', 10_000, 9_500), h('b', 10_000, 8_000)], AHORA).map((b) => b.slug)).toEqual(['b', 'a']);
  });
});
