import { describe, expect, it } from 'vitest';
import { alternativasMasBaratas, filtrarYOrdenar, ganadores, leerSeleccion, type Fila } from '../../src/lib/comparar';
import { conUnidad } from '../../src/lib/especificaciones';
import { formatoFecha } from '../../src/lib/formato';

const fila = (slug: string, cambios: Partial<Fila> = {}): Fila => ({
  slug,
  puntuacion: 50,
  precioMxn: 10_000,
  autonomiaFabricanteKm: 40,
  pesoKg: 15,
  plegable: true,
  categorias: ['urbano'],
  ...cambios,
});

describe('filtrarYOrdenar', () => {
  const filas = [
    fila('a', { puntuacion: 60, precioMxn: 12_000, autonomiaFabricanteKm: 30, pesoKg: 12 }),
    fila('b', { puntuacion: 80, precioMxn: null, autonomiaFabricanteKm: 70, pesoKg: 25, plegable: false, categorias: ['todoterreno'] }),
    fila('c', { puntuacion: 70, precioMxn: 8_000, autonomiaFabricanteKm: 45, pesoKg: 18 }),
  ];

  it('sin filtros devuelve todo en el orden pedido', () => {
    expect(filtrarYOrdenar(filas, {}, 'puntuacion')).toEqual(['b', 'c', 'a']);
    expect(filtrarYOrdenar(filas, {}, 'precio')).toEqual(['c', 'a', 'b']); // sin precio al final
    expect(filtrarYOrdenar(filas, {}, 'autonomia')).toEqual(['b', 'c', 'a']);
    expect(filtrarYOrdenar(filas, {}, 'peso')).toEqual(['a', 'c', 'b']);
  });

  it('el precio máximo deja fuera a los modelos sin precio', () => {
    expect(filtrarYOrdenar(filas, { precioMax: 12_000 }, 'puntuacion')).toEqual(['c', 'a']);
    expect(filtrarYOrdenar(filas, { precioMax: 9_000 }, 'puntuacion')).toEqual(['c']);
  });

  it('la autonomía mínima usa la autonomía real con el peso del conductor', () => {
    // c: 45 km × 0.7 = 32 km con 75 kg; con 110 kg baja a 25 km.
    expect(filtrarYOrdenar(filas, { autonomiaMin: 30 }, 'puntuacion')).toEqual(['b', 'c']);
    expect(filtrarYOrdenar(filas, { autonomiaMin: 30, pesoConductorKg: 110 }, 'puntuacion')).toEqual(['b']);
  });

  it('filtra por peso, plegable y categoría', () => {
    expect(filtrarYOrdenar(filas, { pesoMax: 18 }, 'peso')).toEqual(['a', 'c']);
    expect(filtrarYOrdenar(filas, { soloPlegables: true }, 'puntuacion')).toEqual(['c', 'a']);
    expect(filtrarYOrdenar(filas, { categoria: 'todoterreno' }, 'puntuacion')).toEqual(['b']);
  });
});

describe('ganadores', () => {
  it('marca el mayor, o el menor si menos es mejor', () => {
    expect(ganadores([30, 50, 40])).toEqual([false, true, false]);
    expect(ganadores([30, 50, 40], true)).toEqual([true, false, false]);
  });
  it('los empates ganan juntos y los null nunca ganan', () => {
    expect(ganadores([50, null, 50, 20])).toEqual([true, false, true, false]);
  });
  it('nadie gana si todos empatan o falta con qué comparar', () => {
    expect(ganadores([40, 40])).toEqual([false, false]);
    expect(ganadores([40, null])).toEqual([false, false]);
    expect(ganadores([null, null])).toEqual([false, false]);
  });
});

describe('leerSeleccion', () => {
  const validos = ['a', 'b', 'c', 'd'];
  it('ignora slugs desconocidos y repetidos y corta en 3', () => {
    expect(leerSeleccion('a,x,a,b', validos)).toEqual(['a', 'b']);
    expect(leerSeleccion('a,b,c,d', validos)).toEqual(['a', 'b', 'c']);
  });
  it('sin parámetro no hay selección', () => {
    expect(leerSeleccion(null, validos)).toEqual([]);
    expect(leerSeleccion('', validos)).toEqual([]);
  });
});

describe('alternativasMasBaratas', () => {
  const todos = [
    { slug: 'actual', precioMxn: 15_000, puntuacion: 70 },
    { slug: 'barato-bueno', precioMxn: 12_000, puntuacion: 65 },
    { slug: 'barato-malo', precioMxn: 6_000, puntuacion: 30 },
    { slug: 'caro', precioMxn: 20_000, puntuacion: 90 },
    { slug: 'sin-precio', precioMxn: null, puntuacion: 99 },
    { slug: 'barato-medio', precioMxn: 9_000, puntuacion: 50 },
    { slug: 'barato-peor', precioMxn: 5_000, puntuacion: 20 },
  ];
  it('solo más baratos con precio, mejor puntuados primero, hasta 3', () => {
    expect(alternativasMasBaratas(todos[0], todos).map((s) => s.slug)).toEqual(['barato-bueno', 'barato-medio', 'barato-malo']);
  });
  it('sin precio del modelo no hay alternativas', () => {
    expect(alternativasMasBaratas({ slug: 'x', precioMxn: null, puntuacion: 0 }, todos)).toEqual([]);
  });
});

describe('formato', () => {
  it('formatoFecha usa la hora de la Ciudad de México', () => {
    expect(formatoFecha('2026-10-31T03:00:00Z')).toBe('30 oct 2026'); // 21:00 del 30 en CDMX
    expect(() => formatoFecha('no es fecha')).toThrow(RangeError);
  });
  it('conUnidad', () => {
    expect(conUnidad(1000, 'W')).toBe('1,000 W');
    expect(conUnidad(20.1, 'kg')).toBe('20.1 kg');
    expect(conUnidad(null, 'kg')).toBe('Sin dato');
  });
});
