// Fails if any inline <script> in dist/ is not allowed by the CSP in public/_headers.
// The preview server ignores _headers, so Playwright can't catch this: a missing hash only breaks in production.
import { readFileSync, readdirSync } from 'node:fs';
import { join, relative } from 'node:path';
import { createHash } from 'node:crypto';

const csp = readFileSync('public/_headers', 'utf8').match(/Content-Security-Policy:.*?script-src ([^;]+)/);
if (!csp) throw new Error('No Content-Security-Policy with script-src in public/_headers');
const allowed = new Set(csp[1].match(/sha256-[^']+/g) ?? []);

const missing = new Map();
let total = 0;
(function walk(dir) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) walk(path);
    else if (path.endsWith('.html')) {
      for (const [tag, body] of readFileSync(path, 'utf8').matchAll(/<script(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/g)) {
        if (/type="application\/(ld\+)?json"/.test(tag)) continue; // data, not executed
        total++;
        const hash = `sha256-${createHash('sha256').update(body).digest('base64')}`;
        if (!allowed.has(hash)) missing.set(hash, [...(missing.get(hash) ?? []), relative('dist', path)]);
      }
    }
  }
})('dist');

if (missing.size) {
  for (const [hash, pages] of missing) console.error(`CSP missing '${hash}' (${pages.length} pages, e.g. ${pages[0]})`);
  console.error('Add the hashes to script-src in public/_headers (see docs/seguridad.md).');
  process.exit(1);
}
console.log(`CSP ok: ${total} inline scripts allowed`);
