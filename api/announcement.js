import { readState } from './_lib/store.js';
import { send, queryOf, isAdmin } from './_lib/http.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') return send(res, 405, { error: 'Method not allowed' });
  const preview = queryOf(req).has('preview') && isAdmin(req);
  try {
    const s = await readState();
    const serverNow = Date.now();
    const at = s.revealAt ? Date.parse(s.revealAt) : NaN;
    const noStore = { 'Cache-Control': 'no-store' };

    if (preview) {
      return send(res, 200, publicLive(s, serverNow, true), noStore);
    }
    if (!s.enabled || !Number.isFinite(at)) {
      return send(res, 200, { status: 'idle', serverNow }, noStore);
    }
    if (serverNow < at) {
      // Names are never sent before the reveal time.
      return send(res, 200, { status: 'scheduled', revealAt: new Date(at).toISOString(), serverNow }, noStore);
    }
    return send(res, 200, publicLive(s, serverNow, false), noStore);
  } catch (e) {
    return send(res, e.status || 500, { error: e.message || 'Server error' });
  }
}

function publicLive(s, serverNow, preview) {
  const at = s.revealAt ? Date.parse(s.revealAt) : serverNow;
  return {
    status: 'live',
    preview,
    revealAt: new Date(Number.isFinite(at) ? at : serverNow).toISOString(),
    revealId: `${s.revealAt || 'x'}#${s.revealVersion}`,
    serverNow,
    message: s.message || '',
    accepted: s.candidates.filter((c) => c.passed).map((c) => ({ name: c.name, division: c.division || '' }))
  };
}
