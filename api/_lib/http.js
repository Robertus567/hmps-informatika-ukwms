import crypto from 'node:crypto';

export function send(res, status, body, headers = {}) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  for (const [k, v] of Object.entries(headers)) res.setHeader(k, v);
  res.end(JSON.stringify(body));
}

export async function readBody(req) {
  if (req.body !== undefined && req.body !== null) {
    if (typeof req.body === 'string') { try { return JSON.parse(req.body); } catch { return {}; } }
    if (Buffer.isBuffer(req.body)) { try { return JSON.parse(req.body.toString('utf8')); } catch { return {}; } }
    return req.body;
  }
  const chunks = [];
  let size = 0;
  for await (const c of req) { size += c.length; if (size > 200_000) break; chunks.push(c); }
  try { return JSON.parse(Buffer.concat(chunks).toString('utf8') || '{}'); } catch { return {}; }
}

export function parseCookies(req) {
  const out = {};
  (req.headers.cookie || '').split(';').forEach((p) => {
    const i = p.indexOf('=');
    if (i > 0) out[p.slice(0, i).trim()] = decodeURIComponent(p.slice(i + 1).trim());
  });
  return out;
}

export function queryOf(req) {
  return new URL(req.url, 'http://x').searchParams;
}

/* ---------- Admin session (HMAC-signed cookie) ---------- */
// Credentials come only from environment variables (Vercel project settings, or .env.local for local dev).
const USER = process.env.ADMIN_USERNAME || '';
const PASS = process.env.ADMIN_PASSWORD || '';
const SECRET = process.env.ADMIN_SECRET || crypto.createHash('sha256').update('hmpsinf26::' + USER + '::' + PASS + '::session-v1').digest('hex');
export const adminConfigured = () => !!(USER && PASS);
const COOKIE = 'hmps_admin';
const TTL = 1000 * 60 * 60 * 10; // 10 jam

const b64 = (s) => Buffer.from(s).toString('base64url');
const sign = (s) => crypto.createHmac('sha256', SECRET).update(s).digest('base64url');
function safeEq(a, b) {
  const x = Buffer.from(String(a)), y = Buffer.from(String(b));
  return x.length === y.length && crypto.timingSafeEqual(x, y);
}

export function checkCredentials(u, p) {
  if (!adminConfigured()) return false;
  // compare both to avoid leaking which one is wrong
  const okU = safeEq(String(u || '').trim().toUpperCase(), USER.toUpperCase());
  const okP = safeEq(String(p || ''), PASS);
  return okU && okP;
}

export function sessionCookie(req) {
  const payload = b64(JSON.stringify({ u: USER, exp: Date.now() + TTL }));
  const token = payload + '.' + sign(payload);
  const secure = (req.headers['x-forwarded-proto'] || '').includes('https') ? '; Secure' : '';
  return `${COOKIE}=${token}; Path=/; HttpOnly; SameSite=Strict; Max-Age=${TTL / 1000}${secure}`;
}
export function clearCookie() {
  return `${COOKIE}=; Path=/; HttpOnly; SameSite=Strict; Max-Age=0`;
}
export function isAdmin(req) {
  const t = parseCookies(req)[COOKIE];
  if (!t) return false;
  const [payload, sig] = t.split('.');
  if (!payload || !sig || !safeEq(sig, sign(payload))) return false;
  try { return JSON.parse(Buffer.from(payload, 'base64url').toString()).exp > Date.now(); } catch { return false; }
}
