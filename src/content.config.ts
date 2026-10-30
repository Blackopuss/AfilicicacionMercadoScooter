import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { scooterSchema } from './lib/scooter';

// Un archivo JSON por modelo; el nombre del archivo es el slug.
const scooters = defineCollection({
  loader: glob({ pattern: '*.json', base: './src/content/scooters' }),
  schema: scooterSchema,
});

export const collections = { scooters };
