/* Panel admin pengumuman */
(function () {
  const $ = (s, r = document) => r.querySelector(s);
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const pad = (n) => String(n).padStart(2, '0');
  const API = '/api/admin';
  let state = null, divisions = [], filter = 'all', query = '', offset = 0, clock = 0;

  const ICON = {
    up: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m6 15 6-6 6 6"/></svg>',
    down: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m6 9 6 6 6-6"/></svg>',
    del: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 7h16M10 11v6M14 11v6M6 7l1 12a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-12M9 7V4h6v3"/></svg>',
    ok: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="m5 12.5 4.5 4.5L19 7.5"/></svg>',
    err: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><circle cx="12" cy="12" r="9"/><path d="M12 8v5M12 16.5v.01"/></svg>'
  };

  document.querySelectorAll('[data-bot]').forEach((el) => { if (window.Bito) el.innerHTML = Bito.svg(); });

  /* ---------- helpers ---------- */
  function toast(msg, isErr) {
    const t = document.createElement('div');
    t.className = 'toast' + (isErr ? ' err' : '');
    t.innerHTML = (isErr ? ICON.err : ICON.ok) + `<span>${esc(msg)}</span>`;
    $('#toasts').appendChild(t);
    setTimeout(() => { t.style.transition = 'opacity .3s'; t.style.opacity = '0'; setTimeout(() => t.remove(), 320); }, 2600);
  }
  function confirmBox(title, text, okLabel, danger) {
    return new Promise((resolve) => {
      const m = document.createElement('div');
      m.className = 'modal';
      m.innerHTML = `<div class="modal__box" role="alertdialog" aria-modal="true" aria-labelledby="mt"><h3 id="mt">${esc(title)}</h3><p>${esc(text)}</p><div class="modal__acts"><button class="btn btn--outline btn--sm" data-x>Batal</button><button class="btn btn--sm ${danger ? 'btn--danger' : ''}" data-ok>${esc(okLabel)}</button></div></div>`;
      document.body.appendChild(m);
      const done = (v) => { m.remove(); document.removeEventListener('keydown', key); resolve(v); };
      const key = (e) => { if (e.key === 'Escape') done(false); };
      document.addEventListener('keydown', key);
      m.addEventListener('click', (e) => { if (e.target === m || e.target.closest('[data-x]')) done(false); if (e.target.closest('[data-ok]')) done(true); });
      m.querySelector('[data-ok]').focus();
    });
  }
  async function api(op, body) {
    const r = await fetch(`${API}?op=${op}`, {
      method: body ? 'POST' : 'GET', credentials: 'same-origin', cache: 'no-store',
      headers: body ? { 'Content-Type': 'application/json' } : {}, body: body ? JSON.stringify(body) : undefined
    });
    let d = {};
    try { d = await r.json(); } catch (e) {}
    if (r.status === 401 && op !== 'login') { showLogin(); throw new Error(d.error || 'Sesi berakhir.'); }
    if (!r.ok) throw new Error(d.error || 'Terjadi kesalahan (' + r.status + ')');
    return d;
  }
  /* ---------- optimistic saving: apply locally now, save in the background (batched) ---------- */
  let pendingOps = [], flushTimer = 0, inflight = null;
  function setSave(st) {
    const el = $('#save-pill'); if (!el) return;
    el.dataset.state = st;
    el.textContent = st === 'saving' ? 'Menyimpan…' : st === 'error' ? 'Gagal menyimpan' : 'Tersimpan';
  }
  function applyLocal(o) {
    const list = state.candidates, i = list.findIndex((c) => c.id === o.id);
    if (i < 0) return;
    if (o.action === 'update') { const c = list[i]; ['name', 'division', 'passed'].forEach((k) => { if (o[k] !== undefined) c[k] = o[k]; }); }
    if (o.action === 'remove') list.splice(i, 1);
    if (o.action === 'move') { const j = i + (o.dir === 'up' ? -1 : 1); if (j >= 0 && j < list.length) [list[i], list[j]] = [list[j], list[i]]; }
  }
  function quick(op, msg) {
    applyLocal(op);
    renderAll();
    pendingOps.push(op);
    setSave('saving');
    if (msg) toast(msg);
    clearTimeout(flushTimer);
    flushTimer = setTimeout(flush, 350);
  }
  async function flush() {
    clearTimeout(flushTimer);
    if (inflight) return inflight.catch(() => {}).then(flush);
    if (!pendingOps.length) return;
    const ops = pendingOps; pendingOps = [];
    inflight = api('action', { action: 'batch', ops });
    try {
      const d = await inflight;
      offset = d.serverNow - Date.now();
      if (!pendingOps.length) { state = d.state; renderAll(); setSave('saved'); }
    } catch (e) {
      setSave('error');
      toast('Gagal menyimpan: ' + e.message, true);
      try { const d = await api('state'); state = d.state; renderAll(); } catch (x) {}
    } finally {
      inflight = null;
    }
    if (pendingOps.length) return flush();
  }
  window.addEventListener('beforeunload', (e) => { if (pendingOps.length || inflight) { e.preventDefault(); e.returnValue = ''; } });

  async function act(body, okMsg) {
    if (pendingOps.length || inflight) await flush();
    setSave('saving');
    try {
      const d = await api('action', body);
      state = d.state; offset = d.serverNow - Date.now();
      renderAll();
      setSave('saved');
      if (okMsg) toast(okMsg);
      return true;
    } catch (e) { setSave('error'); toast(e.message, true); return false; }
  }
  // WIB <-> input[type=datetime-local]
  const toLocalInput = (iso) => iso ? new Date(Date.parse(iso) + 7 * 3600e3).toISOString().slice(0, 16) : '';
  const fromLocalInput = (v) => v ? new Date(v + ':00+07:00').toISOString() : null;
  const fmt = (iso) => {
    const d = new Date(iso);
    return d.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Asia/Jakarta' }) + ', ' + d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Jakarta' }).replace(':', '.') + ' WIB';
  };

  /* ---------- views ---------- */
  function showLogin() {
    $('#view-dash').hidden = true;
    $('#view-login').hidden = false;
    document.documentElement.classList.add('is-ready');
    setTimeout(() => $('#u').focus(), 50);
  }
  async function showDash() {
    const d = await api('state');
    state = d.state; divisions = d.divisions || []; offset = d.serverNow - Date.now();
    $('#add-div').innerHTML = '<option value="">Divisi (opsional)</option>' + divisions.map((x) => `<option>${esc(x)}</option>`).join('');
    const labels = { redis: 'Upstash Redis', blob: 'Vercel Blob', file: 'file lokal (mode pengembangan)', none: 'belum dikonfigurasi' };
    $('#storage-info').textContent = 'Penyimpanan data: ' + (labels[d.storage] || d.storage) + '.';
    $('#view-login').hidden = true;
    $('#view-dash').hidden = false;
    fillSchedule();
    renderAll();
    clearInterval(clock);
    clock = setInterval(renderStatus, 1000);
  }

  /* ---------- login ---------- */
  $('#pw-toggle').addEventListener('click', () => {
    const p = $('#p');
    p.type = p.type === 'password' ? 'text' : 'password';
    $('#pw-toggle').setAttribute('aria-label', p.type === 'password' ? 'Tampilkan password' : 'Sembunyikan password');
  });
  $('#login-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const err = $('#login-err'), btn = $('#login-btn');
    err.textContent = '';
    const username = $('#u').value.trim(), password = $('#p').value;
    if (!username || !password) { err.textContent = 'Isi username dan password.'; return; }
    btn.disabled = true; btn.textContent = 'Memeriksa…';
    try {
      await api('login', { username, password });
      $('#p').value = '';
      await showDash();
      toast('Selamat datang, admin!');
    } catch (ex) {
      err.textContent = ex.message;
    } finally { btn.disabled = false; btn.textContent = 'Masuk ke panel'; }
  });
  $('#logout').addEventListener('click', async () => {
    try { await api('logout', {}); } catch (e) {}
    clearInterval(clock);
    showLogin();
  });

  /* ---------- candidates ---------- */
  $('#add-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = $('#add-name').value.trim();
    if (!name) { $('#add-name').focus(); return; }
    if (await act({ action: 'add', name, division: $('#add-div').value }, 'Peserta ditambahkan.')) {
      $('#add-name').value = ''; $('#add-div').value = ''; $('#add-name').focus();
    }
  });
  $('#bulk-add').addEventListener('click', async () => {
    const names = $('#bulk-names').value;
    if (!names.trim()) return;
    if (await act({ action: 'bulkAdd', names }, 'Nama-nama ditambahkan.')) $('#bulk-names').value = '';
  });
  document.querySelectorAll('.seg [data-f]').forEach((b) => b.addEventListener('click', () => {
    filter = b.dataset.f;
    document.querySelectorAll('.seg [data-f]').forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
    renderRows();
  }));
  $('#q').addEventListener('input', (e) => { query = e.target.value.trim().toLowerCase(); renderRows(); });

  function renderAll() { renderStats(); renderRows(); renderStatus(); }

  function renderStats() {
    const total = state.candidates.length, pass = state.candidates.filter((c) => c.passed).length;
    $('#st-total').textContent = total;
    $('#st-pass').textContent = pass;
    $('#st-fail').textContent = total - pass;
  }

  function renderRows() {
    if (document.activeElement && document.activeElement.matches('#rows input.input')) return; // don't wipe an open name edit
    const rows = $('#rows');
    const all = state.candidates;
    const list = all.map((c, i) => ({ c, i })).filter(({ c }) => (filter === 'all' || (filter === 'pass' ? c.passed : !c.passed)) && (!query || c.name.toLowerCase().includes(query)));
    if (!list.length) { rows.innerHTML = `<div class="empty">${all.length ? 'Tidak ada nama yang cocok.' : 'Belum ada peserta. Tambahkan nama di atas.'}</div>`; return; }
    rows.innerHTML = list.map(({ c, i }) => `
      <div class="row ${c.passed ? 'is-passed' : ''}" data-id="${esc(c.id)}">
        <span class="row__num">${pad(i + 1)}</span>
        <div class="row__name"><button type="button" data-edit title="Klik untuk ubah nama">${esc(c.name)}</button></div>
        <select class="select" data-div aria-label="Divisi ${esc(c.name)}"><option value="">Tanpa divisi</option>${divisions.map((d) => `<option ${d === c.division ? 'selected' : ''}>${esc(d)}</option>`).join('')}</select>
        <label class="switch row__pass"><input type="checkbox" data-pass ${c.passed ? 'checked' : ''}><span class="switch__track"></span><span class="switch__label">Lolos</span></label>
        <div class="row__acts">
          <button type="button" class="icon-btn" data-move="up" aria-label="Naikkan" ${i === 0 ? 'disabled' : ''}>${ICON.up}</button>
          <button type="button" class="icon-btn" data-move="down" aria-label="Turunkan" ${i === all.length - 1 ? 'disabled' : ''}>${ICON.down}</button>
          <button type="button" class="icon-btn danger" data-del aria-label="Hapus ${esc(c.name)}">${ICON.del}</button>
        </div>
      </div>`).join('');
  }

  $('#rows').addEventListener('change', (e) => {
    const row = e.target.closest('.row'); if (!row) return;
    const id = row.dataset.id;
    if (e.target.matches('[data-pass]')) {
      const passed = e.target.checked;
      quick({ action: 'update', id, passed });
    }
    if (e.target.matches('[data-div]')) quick({ action: 'update', id, division: e.target.value });
  });
  $('#rows').addEventListener('click', async (e) => {
    const row = e.target.closest('.row'); if (!row) return;
    const id = row.dataset.id;
    const c = state.candidates.find((x) => x.id === id);
    const mv = e.target.closest('[data-move]');
    if (mv) return quick({ action: 'move', id, dir: mv.dataset.move });
    if (e.target.closest('[data-del]')) {
      if (await confirmBox('Hapus peserta?', `"${c.name}" akan dihapus dari daftar wawancara.`, 'Hapus', true)) quick({ action: 'remove', id }, 'Peserta dihapus.');
      return;
    }
    const ed = e.target.closest('[data-edit]');
    if (ed) {
      const wrap = ed.parentElement;
      wrap.innerHTML = `<input class="input" maxlength="80" value="${esc(c.name)}" aria-label="Ubah nama">`;
      const inp = wrap.querySelector('input');
      inp.focus(); inp.select();
      let done = false;
      const finish = async (save) => {
        if (done) return; done = true;
        const v = inp.value.trim();
        if (save && v && v !== c.name) quick({ action: 'update', id, name: v });
        else renderRows();
      };
      inp.addEventListener('keydown', (ev) => { if (ev.key === 'Enter') finish(true); if (ev.key === 'Escape') finish(false); });
      inp.addEventListener('blur', () => finish(true));
    }
  });

  /* ---------- schedule ---------- */
  function fillSchedule() {
    $('#reveal-at').value = toLocalInput(state.revealAt);
    $('#enabled').checked = !!state.enabled;
    $('#message').value = state.message || '';
  }
  $('#sched-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const v = $('#reveal-at').value, enabled = $('#enabled').checked;
    if (enabled && !v) { toast('Isi tanggal dan jam pengumuman dulu.', true); $('#reveal-at').focus(); return; }
    const pass = state.candidates.filter((c) => c.passed).length;
    if (enabled && pass === 0 && !(await confirmBox('Belum ada yang lolos', 'Jadwal tetap disimpan, tapi belum ada nama yang ditandai lolos. Lanjutkan?', 'Simpan'))) return;
    const iso = fromLocalInput(v);
    if (enabled && iso && Date.parse(iso) <= Date.now() + offset && !(await confirmBox('Waktu sudah lewat', 'Waktu yang dipilih sudah lewat, jadi pengumuman akan langsung terbuka untuk semua pengunjung. Lanjutkan?', 'Buka sekarang', true))) return;
    if (await act({ action: 'settings', revealAt: iso, enabled, message: $('#message').value }, 'Jadwal disimpan.')) fillSchedule();
  });
  $('#replay').addEventListener('click', async () => {
    if (await confirmBox('Tampilkan ulang animasi?', 'Semua pengunjung yang sudah melihat animasi akan melihatnya lagi saat membuka halaman Pengumuman.', 'Ya, tampilkan ulang', true)) act({ action: 'replay' }, 'Animasi akan tampil ulang ke semua pengunjung.');
  });

  document.querySelectorAll('[data-test]').forEach((b) => b.addEventListener('click', async () => {
    const t = b.dataset.test;
    if (t === 'off') {
      if (await act({ action: 'settings', enabled: false }, 'Pengumuman ditutup. Pengunjung melihat “Coming soon”.')) fillSchedule();
      return;
    }
    if (!state.candidates.some((c) => c.passed)) { toast('Tandai minimal satu peserta lolos dulu.', true); return; }
    const mins = t === 'now' ? 0 : 1;
    const ok = await confirmBox(mins ? 'Buka 1 menit lagi?' : 'Buka pengumuman sekarang?', 'Ini mengubah jadwal yang dilihat semua pengunjung. Setelah selesai uji coba, atur ulang jadwal aslinya.', mins ? 'Jadwalkan' : 'Buka sekarang', !mins);
    if (!ok) return;
    const iso = new Date(Date.now() + offset + mins * 60000 + (mins ? 2000 : -1000)).toISOString();
    if (await act({ action: 'settings', revealAt: iso, enabled: true }, mins ? 'Pengumuman dibuka 1 menit lagi.' : 'Pengumuman dibuka. Buka halaman Pengumuman untuk melihat animasinya.')) {
      fillSchedule();
      window.open('/pengumuman', '_blank', 'noopener');
    }
  }));

  function renderStatus() {
    if (!state) return;
    const st = $('#st-status'), sub = $('#st-sub'), box = $('#sched-status');
    const at = state.revealAt ? Date.parse(state.revealAt) : NaN;
    const nowS = Date.now() + offset;
    let badge, title, line;
    if (!state.enabled || !Number.isFinite(at)) {
      badge = '<span class="badge badge--draft">Draft</span>'; title = 'Belum aktif'; line = 'Pengunjung melihat “Coming soon”.';
      sub.textContent = '';
    } else if (nowS < at) {
      const s = Math.floor((at - nowS) / 1000);
      const cd = `${Math.floor(s / 86400)}h ${pad(Math.floor(s / 3600) % 24)}:${pad(Math.floor(s / 60) % 60)}:${pad(s % 60)}`;
      badge = '<span class="badge badge--sched">Terjadwal</span>'; title = 'Terjadwal'; line = 'Dibuka ' + fmt(state.revealAt) + '.';
      sub.textContent = 'Dibuka dalam ' + cd;
    } else {
      badge = '<span class="badge badge--live">Live</span>'; title = 'Sudah dibuka'; line = 'Dibuka sejak ' + fmt(state.revealAt) + '.';
      sub.textContent = state.candidates.filter((c) => c.passed).length + ' nama ditampilkan';
    }
    st.textContent = title;
    box.innerHTML = badge + `<span>${esc(line)}</span>`;
  }

  /* ---------- boot ---------- */
  showDash().catch(() => showLogin());
})();
