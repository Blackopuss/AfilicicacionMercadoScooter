import { test, expect } from '@playwright/test';
import { createHash } from 'node:crypto';
import { readFileSync, readdirSync } from 'node:fs';

// The CSP in public/_headers only allows inline scripts by hash: any edit to one breaks it in production.
// JSON-LD is data, not script: the CSP does not apply to it.
test('every inline script in dist/ has its hash in the CSP', () => {
  const headers = readFileSync('public/_headers', 'utf8');
  const html = readdirSync('dist', { recursive: true, encoding: 'utf8' }).filter((f) => f.endsWith('.html'));
  const missing = new Set<string>();
  for (const file of html) {
    for (const [, body] of readFileSync(`dist/${file}`, 'utf8').matchAll(/<script(?![^>]*\b(?:src=|type="application\/ld\+json"))[^>]*>([\s\S]*?)<\/script>/g)) {
      const hash = `'sha256-${createHash('sha256').update(body).digest('base64')}'`;
      if (!headers.includes(hash)) missing.add(hash);
    }
  }
  expect(html.length).toBeGreaterThan(0);
  expect([...missing], 'Copia estos hashes a script-src en public/_headers').toEqual([]);
});
