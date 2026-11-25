// Local dev server: static files with clean URLs + /api/* handlers (file storage in ./data).
import http from 'node:http';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const root = path.dirname(fileURLToPath(import.meta.url));

// Local admin login: put ADMIN_USERNAME=... and ADMIN_PASSWORD=... in .env.dev (git-ignored).
// .env.local is deliberately NOT loaded: it holds the production Blob token.
try {
  for (const line of (await fs.readFile(path.join(root, '.env.dev'), 'utf8')).split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z_]+)\s*=\s*"?(.*?)"?\s*$/);
    if (m && !(m[1] in process.env)) process.env[m[1]] = m[2];
  }
} catch { /* no .env.dev */ }

const PORT = Number(process.env.PORT) || 5173;
const TYPES = { '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript', '.svg': 'image/svg+xml', '.webp': 'image/webp', '.png': 'image/png', '.json': 'application/json', '.ico': 'image/x-icon' };

async function tryFile(p) {
  try { const st = await fs.stat(p); return st.isFile() ? p : null; } catch { return null; }
}

http.createServer(async (req, res) => {
  const url = new URL(req.url, 'http://localhost');
  let pathname = decodeURIComponent(url.pathname);
  if (pathname.startsWith('/api/')) {
    const name = pathname.slice(5).replace(/[^a-z0-9-]/gi, '');
    const file = path.join(root, 'api', name + '.js');
    if (!(await tryFile(file))) { res.statusCode = 404; return res.end('Not found'); }
    const mod = await import(pathToFileURL(file).href + '?v=' + Date.now());
    return mod.default(req, res);
  }
  if (pathname.endsWith('/')) pathname += 'index.html';
  const base = path.join(root, pathname);
  if (!base.startsWith(root) || pathname.includes('/_src') || pathname.includes('/data')) { res.statusCode = 403; return res.end(); }
  const file = (await tryFile(base)) || (await tryFile(base + '.html')) || (await tryFile(path.join(base, 'index.html')));
  if (!file) { res.statusCode = 404; return res.end('Not found'); }
  res.setHeader('Content-Type', TYPES[path.extname(file)] || 'application/octet-stream');
  res.setHeader('Cache-Control', 'no-store');
  res.end(await fs.readFile(file));
}).listen(PORT, () => console.log(`Dev server: http://localhost:${PORT}`));
