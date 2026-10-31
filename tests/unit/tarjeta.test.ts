import { describe, expect, it } from 'vitest';
import { cortarLineas, tamanoQueCabe } from '../../src/lib/tarjeta';

const medir = (s: string) => s.length * 10; // 10 px por carácter

describe('cortarLineas', () => {
  it('deja el texto entero si cabe', () => {
    expect(cortarLineas('  Ninebot   Max ', 200, medir, 2)).toEqual(['Ninebot Max']);
  });

  it('corta por palabras sin pasarse del ancho', () => {
    const lineas = cortarLineas('Electric Scooter 4 Pro', 120, medir, 3);
    expect(lineas).toEqual(['Electric', 'Scooter 4', 'Pro']);
    expect(lineas.every((l) => medir(l) <= 120)).toBe(true);
  });

  it('corta por letras una palabra que no cabe sola', () => {
    expect(cortarLineas('Supercalifragilístico', 100, medir, 3)).toEqual(['Supercalif', 'ragilístic', 'o']);
  });

  it('si sobran líneas, la última acaba en … y cabe', () => {
    const lineas = cortarLineas('Xiaomi Electric Scooter 4 Lite (2nd Gen)', 160, medir, 2);
    expect(lineas).toEqual(['Xiaomi Electric', 'Scooter 4 Lite…']);
    expect(lineas.every((l) => medir(l) <= 160)).toBe(true);
  });

  it('texto vacío no da líneas', () => {
    expect(cortarLineas('   ', 100, medir, 2)).toEqual([]);
  });
});

describe('tamanoQueCabe', () => {
  const medirPx = (s: string, px: number) => s.length * px * 0.7;
  it('usa el máximo si cabe', () => {
    expect(tamanoQueCabe('MIS 3', 920, medirPx, 180)).toBe(180);
  });
  it('reduce en proporción si no cabe', () => {
    const px = tamanoQueCabe('SCOOTERS', 920, medirPx, 180);
    expect(px).toBe(164); // 920 / (8 × 0.7)
    expect(medirPx('SCOOTERS', px)).toBeLessThanOrEqual(920);
  });
});
