import { describe, expect, it } from 'vitest';
import { categoriasDe, ranking } from '../../src/lib/mejores';
import type { ScooterSpecs } from '../../src/lib/scooter';
import { pares, razones, rivales, rutaVs, type Rival } from '../../src/lib/versus';

const base: ScooterSpecs = {
  marca: 'Marca',
  modelo: 'Modelo',
  autonomiaFabricanteKm: 40,
  velocidadMaxKmh: 25,
  potenciaW: 350,
  potenciaPicoW: null,
  bateriaWh: null,
  voltajeV: null,
  pesoKg: 15,
  cargaMaxKg: 100,
  ruedaPulgadas: 10,
  tipoRueda: 'neumatica',
  proteccionIP: null,
  plegable: true,
  suspension: 'ninguna',
  frenos: 'Disco trasero',
  pendienteMaxPct: null,
  tiempoCargaH: null,
  categorias: ['urbano'],
  fuenteSpecs: 'https://fabricante.example/modelo',
  linkAfiliado: null,
  tipoVendedor: null,
  foto: null,
  activo: true,
};
const r = (slug: string, cambios: Partial<Rival> = {}): Rival => ({ ...base, slug, puntuacion: 50, precioMxn: null, ...cambios });

describe('rutaVs y pares', () => {
  it('la ruta no depende del orden', () => {
    expect(rutaVs('b', 'a')).toBe('/comparar/a-vs-b');
    expect(rutaVs('a', 'b')).toBe('/comparar/a-vs-b');
  });
  it('cada par una sola vez, slug menor primero', () => {
    const p = pares([r('c'), r('a'), r('b')]).map(([x, y]) => `${x.slug}-${y.slug}`);
    expect(p).toEqual(['a-b', 'a-c', 'b-c']);
    expect(pares(Array.from({ length: 16 }, (_, i) => r(`m${String(i).padStart(2, '0')}`)))).toHaveLength(120);
  });
});

describe('razones', () => {
  it('cada modelo gana en lo que de verdad es mejor', () => {
    const a = r('a', { puntuacion: 70, pesoKg: 14, suspension: 'doble', proteccionIP: 'IPX5' });
    const b = r('b', { puntuacion: 60, autonomiaFabricanteKm: 60, cargaMaxKg: 120 });
    const { a: ra, b: rb } = razones(a, b);
    expect(ra).toEqual([
      'quieres el de mejor puntuación global: 70/100 contra 60/100',
      'lo vas a cargar seguido: pesa 14 kg contra 15 kg',
      'tus calles tienen baches y topes: suspensión doble contra sin suspensión',
      'lo vas a usar con lluvia: IPX5 contra sin certificación IP',
    ]);
    expect(rb).toEqual([
      'quieres llegar más lejos: 42 km reales contra 28 km',
      'necesitas que aguante más peso: hasta 120 kg contra 100 kg',
    ]);
  });
  it('sin precio o sin dato no hay razón; iguales tampoco', () => {
    expect(razones(r('a', { precioMxn: 9000 }), r('b'))).toEqual({ a: [], b: [] });
    expect(razones(r('a', { precioMxn: 9000 }), r('b', { precioMxn: 12000 })).a).toEqual([
      'buscas gastar menos: $9,000 contra $12,000',
    ]);
  });
});

describe('rivales', () => {
  it('prefiere categorías en común y luego puntuación cercana', () => {
    const s = r('s', { categorias: ['urbano', 'plegable'], puntuacion: 60 });
    const todos = [
      s,
      r('lejos', { categorias: ['todoterreno'], puntuacion: 60 }),
      r('una', { categorias: ['urbano'], puntuacion: 61 }),
      r('dos', { categorias: ['urbano', 'plegable'], puntuacion: 90 }),
      r('una-cerca', { categorias: ['plegable'], puntuacion: 60 }),
    ];
    expect(rivales(s, todos).map((x) => x.slug)).toEqual(['dos', 'una-cerca', 'una']);
  });
});

describe('mejores', () => {
  const catalogo = [
    r('ligero', { pesoKg: 14, puntuacion: 40 }),
    r('pesado', { pesoKg: 25, cargaMaxKg: 120, puntuacion: 80, categorias: ['todoterreno'] }),
    r('justo', { pesoKg: 20, cargaMaxKg: 101, puntuacion: 60 }),
  ];
  it('ranking por puntuación dentro del criterio', () => {
    expect(ranking('ligeros', catalogo).map((s) => s.slug)).toEqual(['justo', 'ligero']);
    expect(ranking('para-mas-de-100-kg', catalogo).map((s) => s.slug)).toEqual(['pesado', 'justo']);
    expect(ranking('todoterreno', catalogo).map((s) => s.slug)).toEqual(['pesado']);
  });
  it('categoriasDe junta etiquetas del catálogo y criterios numéricos', () => {
    expect(categoriasDe(catalogo[1])).toEqual(['todoterreno', 'para-mas-de-100-kg']);
    expect(categoriasDe(catalogo[0])).toEqual(['urbano', 'ligeros']);
  });
});
