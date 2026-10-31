import { afterEach, describe, expect, it, vi } from 'vitest';
import { autonomiaReal, FACTOR_SUBIDAS, FACTOR_URBANO } from '../../src/lib/autonomia';
import { formatoPrecio } from '../../src/lib/formato';
import { getPreciosActuales } from '../../src/lib/precios';
import { PESOS, percentil, puntuacion } from '../../src/lib/puntuacion';
import { ordenarScooters, scooterSchema, type Scooter, type ScooterSpecs } from '../../src/lib/scooter';

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
const s = (slug: string, cambios: Partial<Scooter> = {}): Scooter => ({ ...base, slug, ...cambios });

describe('scooterSchema', () => {
  it('acepta un modelo válido', () => {
    expect(scooterSchema.parse(base)).toEqual(base);
  });
  it('rechaza campos extra, http y links que no son de Mercado Libre', () => {
    expect(scooterSchema.safeParse({ ...base, extra: 1 }).success).toBe(false);
    expect(scooterSchema.safeParse({ ...base, fuenteSpecs: 'http://fabricante.example' }).success).toBe(false);
    expect(scooterSchema.safeParse({ ...base, linkAfiliado: 'https://acortador.example/x' }).success).toBe(false);
    expect(scooterSchema.safeParse({ ...base, linkAfiliado: 'https://mercadolibre.com.mx.evil.example/x' }).success).toBe(
      false,
    );
    expect(scooterSchema.safeParse({ ...base, linkAfiliado: 'https://articulo.mercadolibre.com.mx/MLM-1' }).success).toBe(
      true,
    );
    expect(scooterSchema.safeParse({ ...base, linkAfiliado: 'https://meli.la/1FZMRFY' }).success).toBe(true);
    for (const malo of ['http://meli.la/1FZMRFY', 'https://x.meli.la/1', 'https://meli.la.evil.example/1', 'https://melixla/1']) {
      expect(scooterSchema.safeParse({ ...base, linkAfiliado: malo }).success).toBe(false);
    }
  });
  it('valida el código IP', () => {
    expect(scooterSchema.safeParse({ ...base, proteccionIP: 'IPX5' }).success).toBe(true);
    expect(scooterSchema.safeParse({ ...base, proteccionIP: 'IP54' }).success).toBe(true);
    expect(scooterSchema.safeParse({ ...base, proteccionIP: 'resistente' }).success).toBe(false);
  });
});

describe('ordenarScooters', () => {
  it('quita inactivos y ordena por marca y modelo', () => {
    const lista = [s('c', { marca: 'Xiaomi', modelo: '5' }), s('a', { marca: 'NIU', modelo: 'KQi' }), s('b', { activo: false })];
    expect(ordenarScooters(lista).map((x) => x.slug)).toEqual(['a', 'c']);
  });
});

describe('autonomiaReal', () => {
  it('aplica el factor urbano con el peso de referencia', () => {
    expect(autonomiaReal(base)).toBe(Math.round(40 * FACTOR_URBANO));
  });
  it('baja con más peso y con subidas', () => {
    const normal = autonomiaReal(base);
    expect(autonomiaReal(base, { pesoKg: 110 })).toBeLessThan(normal);
    expect(autonomiaReal(base, { conSubidas: true })).toBe(Math.round(40 * FACTOR_URBANO * FACTOR_SUBIDAS));
  });
  it('nunca supera la del fabricante, aunque el conductor sea muy ligero', () => {
    expect(autonomiaReal(base, { pesoKg: 1 })).toBeLessThanOrEqual(40);
  });
  it('rechaza pesos no válidos', () => {
    expect(() => autonomiaReal(base, { pesoKg: 0 })).toThrow(RangeError);
    expect(() => autonomiaReal(base, { pesoKg: Number.NaN })).toThrow(RangeError);
  });
});

describe('percentil', () => {
  const todos = [s('a', { pesoKg: 10, potenciaW: 250 }), s('b', { pesoKg: 20, potenciaW: 500 }), s('c', { pesoKg: 30, potenciaW: 1000, bateriaWh: 500 })];
  it('cuenta los modelos que supera (más es mejor)', () => {
    expect(percentil('potenciaW', todos[2], todos)).toBe(100);
    expect(percentil('potenciaW', todos[1], todos)).toBe(50);
    expect(percentil('potenciaW', todos[0], todos)).toBe(0);
  });
  it('en peso gana el menor', () => {
    expect(percentil('pesoKg', todos[0], todos)).toBe(100);
    expect(percentil('pesoKg', todos[2], todos)).toBe(0);
  });
  it('null si falta el dato propio o de los demás', () => {
    expect(percentil('bateriaWh', todos[0], todos)).toBeNull();
    expect(percentil('bateriaWh', todos[2], todos)).toBeNull();
  });
});

describe('puntuacion', () => {
  it('los pesos suman 1', () => {
    expect(Object.values(PESOS).reduce((a, b) => a + b, 0)).toBeCloseTo(1);
  });
  it('queda entre 0 y 100 y premia al mejor equipado', () => {
    const bueno = s('bueno', { autonomiaFabricanteKm: 70, potenciaW: 900, cargaMaxKg: 120, suspension: 'doble', tipoRueda: 'tubeless', proteccionIP: 'IPX5' });
    const malo = s('malo', { autonomiaFabricanteKm: 20, potenciaW: 250, tipoRueda: 'solida' });
    const todos = [bueno, malo, s('medio')];
    for (const x of todos) {
      const p = puntuacion(x, todos);
      expect(p).toBeGreaterThanOrEqual(0);
      expect(p).toBeLessThanOrEqual(100);
    }
    expect(puntuacion(bueno, todos)).toBeGreaterThan(puntuacion(malo, todos));
  });
});

describe('formatoPrecio', () => {
  it('formatea pesos mexicanos sin centavos', () => {
    expect(formatoPrecio(12499)).toBe('$12,499');
    expect(formatoPrecio(999.6)).toBe('$1,000');
  });
  it('sin precio muestra "Precio pendiente"', () => {
    expect(formatoPrecio(null)).toBe('Precio pendiente');
    expect(formatoPrecio(undefined)).toBe('Precio pendiente');
  });
  it('rechaza valores imposibles', () => {
    expect(() => formatoPrecio(-1)).toThrow(RangeError);
    expect(() => formatoPrecio(Number.NaN)).toThrow(RangeError);
  });
});

describe('getPreciosActuales', () => {
  it('sin variables devuelve un mapa vacío', async () => {
    expect((await getPreciosActuales({})).size).toBe(0);
  });
  afterEach(() => vi.unstubAllGlobals());
  it('si la consulta falla devuelve un mapa vacío sin lanzar', async () => {
    vi.stubGlobal('fetch', () => Promise.reject(new TypeError('fetch failed')));
    const precios = await getPreciosActuales({ PUBLIC_SUPABASE_URL: 'http://127.0.0.1:9', PUBLIC_SUPABASE_ANON_KEY: 'x' });
    expect(precios.size).toBe(0);
  }, 15_000); // supabase-js reintenta 3 veces (1 s + 2 s + 4 s) antes de rendirse
});
