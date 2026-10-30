import { describe, expect, it } from 'vitest';
import { aParametros, completas, leerRespuestas, recomendar, type Candidato, type Respuestas } from '../../src/lib/recomendar';

const c = (slug: string, cambios: Partial<Candidato> = {}): Candidato => ({
  slug,
  marca: 'Marca',
  modelo: slug,
  autonomiaFabricanteKm: 40, // 28 km reales con 75 kg en plano
  pesoKg: 15,
  cargaMaxKg: 100,
  plegable: true,
  puntuacion: 50,
  precioMxn: null,
  ...cambios,
});
const r = (cambios: Partial<Respuestas> = {}): Respuestas => ({
  distanciaKm: 10,
  pesoKg: 75,
  presupuestoMxn: null,
  subidas: false,
  portatil: false,
  ...cambios,
});

describe('recomendar', () => {
  it('ordena por puntuación los que cumplen y da el motivo', () => {
    const res = recomendar(r(), [c('a', { puntuacion: 60 }), c('b', { puntuacion: 90 }), c('c', { puntuacion: 70 }), c('d')]);
    expect(res.map((x) => x.scooter.slug)).toEqual(['b', 'c', 'a']);
    expect(res.every((x) => x.cumple && x.llega)).toBe(true);
    expect(res[0].motivos).toEqual(['Te sobra 64 % de batería']); // 1 - 10/28
  });

  it('exige un 20 % de margen sobre la distancia', () => {
    // 28 km reales: 23 km × 1.2 = 27.6 llega; 24 km × 1.2 = 28.8 no
    expect(recomendar(r({ distanciaKm: 23 }), [c('a')])[0].llega).toBe(true);
    expect(recomendar(r({ distanciaKm: 24 }), [c('a')])[0].llega).toBe(false);
  });

  it('descarta los que no aguantan el peso o no se pliegan si hay que cargarlo', () => {
    const res = recomendar(r({ pesoKg: 110, portatil: true }), [
      c('debil', { cargaMaxKg: 100, puntuacion: 99 }),
      c('fijo', { cargaMaxKg: 150, plegable: false, puntuacion: 99 }),
      c('ok', { cargaMaxKg: 150 }),
    ]);
    expect(res[0]).toMatchObject({ scooter: { slug: 'ok' }, cumple: true });
    expect(res[0].motivos).toContain('Pesa 15 kg');
    expect(res.slice(1).every((x) => !x.cumple)).toBe(true);
  });

  it('si hay que cargarlo, el más ligero gana a igual puntuación', () => {
    const res = recomendar(r({ portatil: true }), [c('pesado', { pesoKg: 25 }), c('ligero', { pesoKg: 12 })]);
    expect(res[0].scooter.slug).toBe('ligero');
  });

  it('el presupuesto descarta solo con precio conocido y lo dice', () => {
    const res = recomendar(r({ presupuestoMxn: 10_000 }), [
      c('caro', { precioMxn: 15_000, puntuacion: 99 }),
      c('sin-precio', { puntuacion: 80 }),
      c('barato', { precioMxn: 9_000, puntuacion: 70 }),
    ]);
    expect(res.map((x) => [x.scooter.slug, x.cumple])).toEqual([
      ['sin-precio', true],
      ['barato', true],
      ['caro', false],
    ]);
    expect(res[0].motivos).toContain('Sin precio verificado: el presupuesto no lo descarta');
    expect(res[2].motivos).toContain('Se pasa de tu presupuesto');
  });

  it('si nada cumple devuelve los que más se acercan, marcados', () => {
    const res = recomendar(r({ distanciaKm: 80 }), [
      c('corto', { autonomiaFabricanteKm: 20, puntuacion: 99 }),
      c('largo', { autonomiaFabricanteKm: 70 }),
      c('medio', { autonomiaFabricanteKm: 45 }),
    ]);
    expect(res.map((x) => x.scooter.slug)).toEqual(['largo', 'medio', 'corto']);
    expect(res.every((x) => !x.cumple && !x.llega)).toBe(true);
    expect(res[0].motivos[0]).toBe('No llega: unos 49 km reales y necesitas 96 con margen');
  });
});

describe('parámetros de la URL', () => {
  it('ida y vuelta sin pérdidas', () => {
    const resp = r({ presupuestoMxn: 12_000, subidas: true });
    const leidas = leerRespuestas(aParametros(resp));
    expect(leidas).toEqual(resp);
    expect(completas(leidas)).toBe(true);
    expect(aParametros(r()).toString()).toBe('d=10&p=75&b=sin&s=0&c=0');
  });

  it('acota los valores y descarta lo inválido', () => {
    const leidas = leerRespuestas(new URLSearchParams('d=9999&p=1&b=-5&s=si&c=1&x=<script>'));
    expect(leidas).toEqual({ distanciaKm: 100, pesoKg: 30, presupuestoMxn: undefined, subidas: undefined, portatil: true });
    expect(completas(leidas)).toBe(false);
    expect(leerRespuestas(new URLSearchParams('d=1e3&p=80.5&b=Infinity'))).toMatchObject({
      distanciaKm: undefined,
      pesoKg: undefined,
      presupuestoMxn: undefined,
    });
  });
});
