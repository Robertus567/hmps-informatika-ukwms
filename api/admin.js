import { readState, writeState, backend, DIVISIONS } from './_lib/store.js';
import { send, readBody, queryOf, isAdmin, checkCredentials, sessionCookie, clearCookie, adminConfigured } from './_lib/http.js';

const NO_STORE = { 'Cache-Control': 'no-store' };
const clean = (s, max = 80) => String(s == null ? '' : s).replace(/\s+/g, ' ').trim().slice(0, max);
const newId = () => 'c' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);

export default async function handler(req, res) {
  const op = queryOf(req).get('op') || '';
  try {
    if (op === 'login' && req.method === 'POST') {
      const b = await readBody(req);
      if (!adminConfigured()) return send(res, 503, { error: 'Login admin belum dikonfigurasi di server (ADMIN_USERNAME / ADMIN_PASSWORD).' }, NO_STORE);
      if (!checkCredentials(b.username, b.password)) {
        await new Promise((r) => setTimeout(r, 600));
        return send(res, 401, { error: 'Username atau password salah.' }, NO_STORE);
      }
      return send(res, 200, { ok: true }, { ...NO_STORE, 'Set-Cookie': sessionCookie(req) });
    }
    if (op === 'logout') {
      return send(res, 200, { ok: true }, { ...NO_STORE, 'Set-Cookie': clearCookie() });
    }
    if (!isAdmin(req)) return send(res, 401, { error: 'Sesi berakhir. Silakan login lagi.' }, NO_STORE);

    if (op === 'state' && req.method === 'GET') {
      const s = await readState({ fresh: true });
      return send(res, 200, { state: s, divisions: DIVISIONS, storage: backend(), serverNow: Date.now() }, NO_STORE);
    }

    if (op === 'action' && req.method === 'POST') {
      const b = await readBody(req);
      const s = await readState({ fresh: true });
      if (b.action === 'batch') {
        const ops = Array.isArray(b.ops) ? b.ops.slice(0, 200) : [];
        for (const o of ops) applyOp(s, o, true); // stale ids inside a batch are skipped
      } else {
        const err = applyOp(s, b, false);
        if (err) return send(res, err.status, { error: err.error }, NO_STORE);
      }
      const saved = await writeState(s);
      return send(res, 200, { state: saved, serverNow: Date.now() }, NO_STORE);
    }
    return send(res, 404, { error: 'Not found' });
  } catch (e) {
    return send(res, e.status || 500, { error: e.message || 'Server error' }, NO_STORE);
  }
}

function applyOp(s, b, lenient) {
  const fail = (status, error) => (lenient ? null : { status, error });
  const find = (id) => s.candidates.find((c) => c.id === id);
  switch (b && b.action) {
    case 'add': {
      const name = clean(b.name);
      if (!name) return fail(400, 'Nama tidak boleh kosong.');
      if (s.candidates.length >= 300) return fail(400, 'Jumlah peserta sudah maksimal.');
      s.candidates.push({ id: newId(), name, division: DIVISIONS.includes(b.division) ? b.division : '', passed: !!b.passed });
      return null;
    }
    case 'bulkAdd': {
      const names = String(b.names || '').split(/\r?\n/).map((x) => clean(x.replace(/^\s*\d+[.)]\s*/, ''))).filter(Boolean);
      if (!names.length) return fail(400, 'Tidak ada nama yang bisa ditambahkan.');
      const existing = new Set(s.candidates.map((c) => c.name.toLowerCase()));
      names.forEach((name) => { if (!existing.has(name.toLowerCase()) && s.candidates.length < 300) { s.candidates.push({ id: newId(), name, division: '', passed: false }); existing.add(name.toLowerCase()); } });
      return null;
    }
    case 'update': {
      const c = find(b.id);
      if (!c) return fail(404, 'Peserta tidak ditemukan.');
      if (b.name !== undefined) { const name = clean(b.name); if (!name) return fail(400, 'Nama tidak boleh kosong.'); c.name = name; }
      if (b.division !== undefined) c.division = DIVISIONS.includes(b.division) ? b.division : '';
      if (b.passed !== undefined) c.passed = !!b.passed;
      return null;
    }
    case 'remove': {
      const i = s.candidates.findIndex((c) => c.id === b.id);
      if (i < 0) return fail(404, 'Peserta tidak ditemukan.');
      s.candidates.splice(i, 1);
      return null;
    }
    case 'move': {
      const i = s.candidates.findIndex((c) => c.id === b.id);
      const j = i + (b.dir === 'up' ? -1 : 1);
      if (i >= 0 && j >= 0 && j < s.candidates.length) [s.candidates[i], s.candidates[j]] = [s.candidates[j], s.candidates[i]];
      return null;
    }
    case 'settings': {
      if (b.revealAt !== undefined) {
        if (b.revealAt === null || b.revealAt === '') s.revealAt = null;
        else {
          const t = Date.parse(b.revealAt);
          if (!Number.isFinite(t)) return fail(400, 'Tanggal/waktu tidak valid.');
          s.revealAt = new Date(t).toISOString();
        }
      }
      if (b.enabled !== undefined) s.enabled = !!b.enabled;
      if (b.message !== undefined) s.message = String(b.message).slice(0, 1200);
      return null;
    }
    case 'replay':
      s.revealVersion = (s.revealVersion || 1) + 1;
      return null;
    default:
      return fail(400, 'Aksi tidak dikenal.');
  }
}
