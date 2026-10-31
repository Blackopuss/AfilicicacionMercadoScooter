import type { ImageMetadata } from 'astro';
import { z } from 'astro/zod';

// Hosts de Mercado Libre aceptados en linkAfiliado (seguridad.md §3: lista blanca).
// meli.la es el link corto que genera el propio programa de afiliados; solo el host exacto, sin subdominios.
const HOST_MERCADO_LIBRE = /^(([a-z0-9-]+\.)*mercadolibre\.com(\.mx)?|meli\.la)$/;

export const CATEGORIAS = ['urbano', 'todoterreno', 'plegable', 'larga-autonomia'] as const;

// Especificaciones tal como las publica el fabricante. Un dato que no está en la fuente oficial va como null.
export const scooterSchema = z.strictObject({
  marca: z.string().min(1),
  modelo: z.string().min(1),
  autonomiaFabricanteKm: z.number().positive(),
  velocidadMaxKmh: z.number().positive(),
  potenciaW: z.number().int().positive(), // nominal
  potenciaPicoW: z.number().int().positive().nullable(),
  bateriaWh: z.number().positive().nullable(),
  voltajeV: z.number().positive().nullable(),
  pesoKg: z.number().positive(),
  cargaMaxKg: z.number().positive(),
  ruedaPulgadas: z.number().positive(),
  tipoRueda: z.enum(['neumatica', 'solida', 'tubeless']),
  proteccionIP: z.string().regex(/^IP[0-6X][0-8]$/).nullable(),
  plegable: z.boolean(),
  suspension: z.enum(['ninguna', 'delantera', 'trasera', 'doble']),
  frenos: z.string().min(1),
  pendienteMaxPct: z.number().positive().max(100).nullable(),
  tiempoCargaH: z.number().positive().nullable(),
  categorias: z.array(z.enum(CATEGORIAS)).min(1),
  fuenteSpecs: z.url({ protocol: /^https$/ }),
  linkAfiliado: z.url({ protocol: /^https$/, hostname: HOST_MERCADO_LIBRE }).nullable(),
  tipoVendedor: z.enum(['oficial', 'verde', 'amarilla']).nullable(),
  foto: z.null(), // content.config.ts la cambia por image(): el helper solo existe dentro de Astro
  activo: z.boolean(),
});

export type ScooterSpecs = Omit<z.infer<typeof scooterSchema>, 'foto'> & { foto: ImageMetadata | null };
export type Categoria = (typeof CATEGORIAS)[number];
/** Un modelo del catálogo: sus specs más el slug (nombre del archivo). */
export type Scooter = ScooterSpecs & { slug: string };

/** Activos, ordenados por marca y modelo (el orden de getCollection no es determinista). */
export function ordenarScooters(scooters: Scooter[]): Scooter[] {
  return scooters
    .filter((s) => s.activo)
    .sort((a, b) => a.marca.localeCompare(b.marca, 'es') || a.modelo.localeCompare(b.modelo, 'es'));
}
