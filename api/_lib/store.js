// State storage. Uses Upstash Redis (if configured), else Vercel Blob, else a local JSON file (dev).
import { promises as fs } from 'node:fs';
import path from 'node:path';

const KEY = 'hmpsinf26:state';

export const DIVISIONS = ['Internal & External', 'Creative Media', 'Research & Technology', 'Student Interest'];

export function defaultState() {
  const names = [
    'Yefta Fernando Setiawan',
    'Matthew Sinclaire Lim',
    'Zertio Constantine',
    'Clarissa Ardella',
    'Wilsen Tanamal',
    'Kevin Dharmawan Oemar',
    'Intan Teresia Sagala',
    'Benedicta Celine Chavella'
  ];
  return {
    candidates: names.map((name, i) => ({ id: 'c' + (i + 1) + Math.random().toString(36).slice(2, 7), name, division: '', passed: false })),
    revealAt: null,
    enabled: false,
    message: '',
    revealVersion: 1,
    updatedAt: Date.now()
  };
}

function normalize(s) {
  const d = defaultState();
  if (!s || typeof s !== 'object') return d;
  return {
    candidates: Array.isArray(s.candidates) ? s.candidates : d.candidates,
    revealAt: s.revealAt || null,
    enabled: !!s.enabled,
    message: typeof s.message === 'string' ? s.message : '',
    revealVersion: Number(s.revealVersion) || 1,
    updatedAt: s.updatedAt || Date.now()
  };
}

/* ---------- Upstash Redis (REST) ---------- */
const REDIS_URL = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
const REDIS_TOKEN = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;

async function redis(cmd) {
  const r = await fetch(REDIS_URL, { method: 'POST', headers: { Authorization: `Bearer ${REDIS_TOKEN}`, 'Content-Type': 'application/json' }, body: JSON.stringify(cmd) });
  if (!r.ok) throw new Error('Redis error ' + r.status);
  return (await r.json()).result;
}

/* ---------- Vercel Blob ---------- */
const BLOB_TOKEN = process.env.BLOB_READ_WRITE_TOKEN;
const PREFIX = 'hmpsinf26-state/';

let lastBlobs = [];
async function blobRead() {
  const { list } = await import('@vercel/blob');
  const { blobs } = await list({ prefix: PREFIX, limit: 100 });
  blobs.sort((a, b) => new Date(b.uploadedAt) - new Date(a.uploadedAt));
  lastBlobs = blobs;
  if (!blobs.length) return null;
  const r = await fetch(blobs[0].url, { cache: 'no-store' });
  if (!r.ok) throw new Error('Blob read ' + r.status);
  return r.json();
}
async function blobWrite(state) {
  const { put, del } = await import('@vercel/blob');
  const name = `${PREFIX}${String(Date.now()).padStart(15, '0')}.json`;
  const jobs = [put(name, JSON.stringify(state), { access: 'public', addRandomSuffix: true, contentType: 'application/json', cacheControlMaxAge: 60 })];
  // prune old versions only now and then, in parallel with the write (keeps a short history)
  if (lastBlobs.length >= 8) {
    const old = lastBlobs.slice(3).map((x) => x.url);
    jobs.push(del(old).catch(() => {}));
    lastBlobs = lastBlobs.slice(0, 3);
  }
  await Promise.all(jobs);
}

/* ---------- Local file (dev) ---------- */
const FILE = path.join(process.cwd(), 'data', 'state.json');
async function fileRead() {
  try { return JSON.parse(await fs.readFile(FILE, 'utf8')); } catch { return null; }
}
async function fileWrite(state) {
  await fs.mkdir(path.dirname(FILE), { recursive: true });
  await fs.writeFile(FILE, JSON.stringify(state, null, 2));
}

export function backend() {
  if (REDIS_URL && REDIS_TOKEN) return 'redis';
  if (BLOB_TOKEN) return 'blob';
  if (process.env.VERCEL) return 'none';
  return 'file';
}

// Small in-memory cache for warm serverless instances (public reads only)
let cache = null, cacheAt = 0;

export async function readState({ fresh = false } = {}) {
  if (!fresh && cache && Date.now() - cacheAt < 8000) return cache;
  const b = backend();
  let raw = null;
  if (b === 'redis') { const v = await redis(['GET', KEY]); raw = v ? JSON.parse(v) : null; }
  else if (b === 'blob') raw = await blobRead();
  else if (b === 'file') raw = await fileRead();
  else throw Object.assign(new Error('Penyimpanan belum dikonfigurasi di server.'), { status: 503 });
  if (!raw) return writeState(defaultState()); // seed once so ids stay stable
  const s = normalize(raw);
  cache = s; cacheAt = Date.now();
  return s;
}

export async function writeState(state) {
  const s = normalize({ ...state, updatedAt: Date.now() });
  const b = backend();
  if (b === 'redis') await redis(['SET', KEY, JSON.stringify(s)]);
  else if (b === 'blob') await blobWrite(s);
  else if (b === 'file') await fileWrite(s);
  else throw Object.assign(new Error('Penyimpanan belum dikonfigurasi di server.'), { status: 503 });
  cache = s; cacheAt = Date.now();
  return s;
}
