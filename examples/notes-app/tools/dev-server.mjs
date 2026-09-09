#!/usr/bin/env node
// dev-server.mjs — the static server `npm run dev` starts, and therefore what the harness's
// `commands.devServer` wrapper drives. Zero dependencies, on purpose: the project installs a
// compiler and nothing else.
//
// The port arrives on the one channel `scripts/start-dev-server.sh` uses and on no other:
// HARNESS_DEV_SERVER_PORT, which survives `npm run dev`. That wrapper shifts the port off before
// it forwards the rest, so the port never reaches this process as an argument and no positional is
// read here. Unset, the port is 3000 — the port left for a human, one below the `qa.portSeed`
// default a run takes.
//
// A taken port is fatal here rather than incremented: a server that moves ports drives another
// run's build, which is what the per-run port assignment exists to prevent.
//
// The static root is the project root, so both `dist/main.js` and `styles.css` resolve: `tsc`
// copies no asset, and a stylesheet under `src/` would never reach `dist/`.

import { createServer } from 'node:http';
import { createReadStream, statSync } from 'node:fs';
import { join, normalize, resolve, sep, extname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(fileURLToPath(new URL('..', import.meta.url)));
const DEFAULT_PORT = 3000;
const requested = process.env.HARNESS_DEV_SERVER_PORT;
const PORT = requested === undefined || requested === '' ? DEFAULT_PORT : Number(requested);
if (!Number.isInteger(PORT) || PORT < 0 || PORT > 65535) {
  console.error(`notes-app dev server: port must be an integer 0-65535, got '${requested}'`);
  process.exit(1);
}
const CONTENT_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
};

const server = createServer((request, response) => {
  const pathname = decodeURIComponent(new URL(request.url ?? '/', 'http://localhost').pathname);
  const target = join(ROOT, normalize(pathname === '/' ? '/index.html' : pathname));
  if (target !== ROOT && !target.startsWith(ROOT + sep)) {
    response.writeHead(403).end('Forbidden');
    return;
  }
  if (!statSync(target, { throwIfNoEntry: false })?.isFile()) {
    response.writeHead(404).end('Not Found');
    return;
  }
  response.writeHead(200, { 'Content-Type': CONTENT_TYPES[extname(target)] ?? 'application/octet-stream' });
  createReadStream(target).pipe(response);
});

server.on('error', (error) => {
  console.error(`notes-app dev server: cannot listen on ${PORT}: ${error.message}`);
  process.exit(1);
});

server.listen(PORT, '127.0.0.1', () => {
  console.log(`notes-app dev server listening on http://localhost:${PORT}/`);
});

process.on('SIGTERM', () => {
  server.close(() => process.exit(0));
});
