import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';
import { CATEGORIAS_MEJORES } from './lib/mejores';
import { scooterSchema } from './lib/scooter';

// Un archivo JSON por modelo; el nombre del archivo es el slug.
const scooters = defineCollection({
  loader: glob({ pattern: '*.json', base: './src/content/scooters' }),
  // foto: ruta relativa al JSON (../../assets/scooters/<slug>.webp), del fabricante o propia; null = placeholder.
  schema: ({ image }) => scooterSchema.extend({ foto: image().nullable() }),
});

// Guías en Markdown; el nombre del archivo es el slug.
const guias = defineCollection({
  loader: glob({ pattern: '*.md', base: './src/content/guias' }),
  schema: z.strictObject({
    titulo: z.string().min(1),
    descripcion: z.string().min(50).max(170),
    publicada: z.date(), // YAML ya convierte 2026-10-30 en Date
    actualizada: z.date(),
    /** Ranking de /mejores que se muestra al final de la guía. */
    mejores: z.enum(CATEGORIAS_MEJORES).optional(),
  }),
});

export const collections = { scooters, guias };
