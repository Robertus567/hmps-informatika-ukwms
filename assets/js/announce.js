/* Halaman Pengumuman: ruang tunggu + countdown, hasil, dan animasi reveal. */
(function () {
  const main = document.getElementById('announce');
  if (!main) return;
  const params = new URLSearchParams(location.search);
  const isPreview = params.has('preview');
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  let offset = 0;
  let tickTimer = 0;

  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const pad = (n) => String(n).padStart(2, '0');
  const fmtDate = (d) => d.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Asia/Jakarta' });
  const fmtTime = (d) => d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Jakarta' }).replace(':', '.');
  const now = () => Date.now() + offset;
  const ICON_CAL = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><rect x="3" y="5" width="18" height="16" rx="3"/><path d="M3 10h18M8 3v4M16 3v4"/></svg>';
  const ICON_CHECK = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="m5 12.5 4.5 4.5L19 7.5"/></svg>';

  async function load() {
    const r = await fetch('/api/announcement' + (isPreview ? '?preview=1' : ''), { cache: 'no-store', credentials: 'same-origin' });
    if (!r.ok) throw new Error('HTTP ' + r.status);
    const d = await r.json();
    if (typeof d.serverNow === 'number') offset = d.serverNow - Date.now();
    return d;
  }

  function afterLoader(fn) {
    if (document.documentElement.classList.contains('is-ready')) fn();
    else document.addEventListener('site:ready', fn, { once: true });
  }

  function render(d) {
    clearInterval(tickTimer);
    if (d.status === 'live') {
      if (isPreview) showPreviewFlag();
      const key = 'hmpsinf26:reveal-seen:' + d.revealId;
      let seen = false;
      try { seen = !!localStorage.getItem(key); } catch (e) {}
      if ((isPreview || !seen) && d.accepted && d.accepted.length) {
        // Keep the names hidden until the animation has revealed them.
        main.innerHTML = roomShell('<p class="room__sub">Membuka pengumuman…</p>');
        afterLoader(() => playReveal(d, () => {
          renderResults(d); // rendered behind the overlay, visible once it closes
          if (!isPreview) try { localStorage.setItem(key, '1'); } catch (e) {}
        }));
      } else {
        renderResults(d);
      }
    } else if (d.status === 'scheduled') {
      renderRoom(d);
    } else {
      renderIdle();
    }
  }

  function showPreviewFlag() {
    if (document.querySelector('.preview-flag')) return;
    const f = document.createElement('div');
    f.className = 'preview-flag';
    f.textContent = 'Mode preview admin — pengunjung belum melihat ini';
    document.body.appendChild(f);
  }

  /* ---------- Waiting room ---------- */
  function roomShell(inner) {
    return `<section class="room"><div class="container room__inner">
      <span class="room__kicker rv in">MEMBER ANNOUNCEMENT</span>
      <div class="room__26" aria-hidden="true">26</div>
      <h1 class="room__title"><span class="px">H</span>MPSINF26</h1>
      ${inner}
    </div></section>`;
  }

  function renderIdle() {
    main.innerHTML = roomShell(`
      <p class="room__sub">Hasil wawancara calon anggota baru HMPS Informatika akan diumumkan di halaman ini.</p>
      <div class="room__soon">COMING SOON</div>
      <p class="room__note">Jadwal pengumuman sedang disiapkan. Pantau Instagram <a href="https://www.instagram.com/hmpsinf_ukwms/" target="_blank" rel="noopener" style="text-decoration:underline">@hmpsinf_ukwms</a> untuk kabar terbaru.</p>`);
  }

  function renderRoom(d) {
    const at = new Date(d.revealAt);
    main.innerHTML = roomShell(`
      <p class="room__sub">Hasil wawancara calon anggota baru HMPS Informatika akan dibuka pada:</p>
      <div class="room__date">${ICON_CAL}<span>${esc(fmtDate(at))} · ${esc(fmtTime(at))} WIB</span></div>
      <div class="countdown" role="timer" aria-label="Hitung mundur pengumuman">
        <div class="countdown__cell"><span class="countdown__num" data-cd="d">00</span><span class="countdown__lbl">Hari</span></div>
        <div class="countdown__cell"><span class="countdown__num" data-cd="h">00</span><span class="countdown__lbl">Jam</span></div>
        <div class="countdown__cell"><span class="countdown__num" data-cd="m">00</span><span class="countdown__lbl">Menit</span></div>
        <div class="countdown__cell"><span class="countdown__num" data-cd="s">00</span><span class="countdown__lbl">Detik</span></div>
      </div>
      <p class="room__note" data-cd-note>Biarkan halaman ini terbuka. Pengumuman akan tampil otomatis begitu waktunya tiba.</p>`);
    const el = { d: main.querySelector('[data-cd="d"]'), h: main.querySelector('[data-cd="h"]'), m: main.querySelector('[data-cd="m"]'), s: main.querySelector('[data-cd="s"]') };
    const note = main.querySelector('[data-cd-note]');
    let polling = false;
    const tick = () => {
      const left = Math.max(0, at.getTime() - now());
      const s = Math.floor(left / 1000);
      el.d.textContent = pad(Math.floor(s / 86400));
      el.h.textContent = pad(Math.floor(s / 3600) % 24);
      el.m.textContent = pad(Math.floor(s / 60) % 60);
      el.s.textContent = pad(s % 60);
      if (left <= 0 && !polling) {
        polling = true;
        note.textContent = 'Membuka pengumuman…';
        poll();
      }
    };
    tick();
    tickTimer = setInterval(tick, 250);
  }

  function poll() {
    load().then((d) => {
      if (d.status === 'live') render(d);
      else setTimeout(poll, 2000);
    }).catch(() => setTimeout(poll, 3000));
  }

  /* ---------- Results ---------- */
  function gridCols(n) { return n <= 4 ? Math.max(1, n) : n <= 6 ? 3 : 4; }

  function renderResults(d) {
    const list = d.accepted || [];
    const at = new Date(d.revealAt);
    const msg = (d.message || '').trim() || 'Untuk teman-teman yang lolos, informasi selanjutnya akan disampaikan langsung oleh pengurus. Untuk yang namanya belum tercantum, terima kasih sudah berani mencoba. Masih banyak kegiatan dan kepanitiaan HMPS Informatika yang bisa kamu ikuti.';
    main.innerHTML = `
      <section class="page-head on-dark results-head" style="padding-bottom:calc(clamp(48px,7vw,84px) + 56px)">
        <div class="hero__grid bg-grid"></div>
        <div class="container">
          <span class="kicker rv in">Hasil Wawancara · ${esc(fmtDate(at))}</span>
          <h1 class="display h1 rv in">Selamat datang,<br>anggota baru!</h1>
          <p class="lead rv in">${list.length ? `Selamat untuk ${list.length} nama di bawah ini yang resmi bergabung dengan HMPS Informatika.` : 'Daftar anggota baru belum tersedia.'}</p>
        </div>
      </section>
      <section class="on-light" style="background:var(--paper);padding-bottom:clamp(72px,10vw,112px)">
        <div class="container">
          <div class="winners" data-cols="${gridCols(list.length)}">
            ${list.map((p, i) => `<article class="winner rv" style="--d:${(i * 0.06).toFixed(2)}s">
              <span class="winner__num">${pad(i + 1)}</span>
              <div class="winner__text"><h2 class="winner__name">${esc(p.name)}</h2><span class="chip">${esc(p.division || 'Anggota Baru')}</span></div>
              <span class="winner__check" aria-hidden="true">${ICON_CHECK}</span>
            </article>`).join('')}
          </div>
          <div class="results-body">
            <div class="note-card rv"><h3>Pesan dari pengurus</h3><p>${esc(msg)}</p></div>
            <div class="note-card note-card--blue rv" style="--d:.08s"><h3>Putar lagi momennya</h3><p>Mau lihat animasi pengumumannya sekali lagi?</p>${list.length ? '<button type="button" class="btn btn--light" data-replay>Putar ulang animasi</button>' : ''}</div>
          </div>
        </div>
      </section>`;
    // reveal-on-scroll for injected content
    const io = new IntersectionObserver((en) => en.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }), { threshold: 0.05 });
    main.querySelectorAll('.rv:not(.in)').forEach((el) => io.observe(el));
    const rp = main.querySelector('[data-replay]');
    if (rp) rp.addEventListener('click', () => playReveal(d, () => {}));
  }

  /* ---------- FX engine (canvas particles) ---------- */
  function FX(canvas) {
    const ctx = canvas.getContext('2d');
    let W = 0, H = 0, raf = 0, alive = true, idle = false, dpr = 1;
    const P = [];
    const COLORS = ['#ffffff', '#dbeeff', '#9fd8ff', '#3da9e4', '#2e6bff', '#5b8cff', '#bcd0ff'];
    const CONF = ['#ffffff', '#7fd0ff', '#3da9e4', '#2e6bff', '#1652f0', '#c9dcff', '#ffd36b'];
    const pick = (a) => a[(Math.random() * a.length) | 0];
    function size() {
      // tiny particles look identical at 1.5x; fewer pixels to clear and draw each frame on phones
      dpr = Math.min(window.innerWidth < 760 ? 1.5 : 2, window.devicePixelRatio || 1);
      W = canvas.clientWidth; H = canvas.clientHeight;
      canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    size();
    window.addEventListener('resize', size);
    const cap = () => (W < 640 ? 650 : 1500);
    const add = (p) => { if (P.length < cap()) P.push(p); };

    const api = {
      get w() { return W; }, get h() { return H; },
      burst(x, y, n, speed, palette) {
        for (let i = 0; i < n; i++) {
          const a = Math.random() * Math.PI * 2, v = (speed || 7) * (0.25 + Math.random() * 0.75);
          add({ t: 's', x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, life: 1, decay: 0.01 + Math.random() * 0.018, size: 1.2 + Math.random() * 2.2, c: pick(palette || COLORS), g: 0.05, drag: 0.972 });
        }
      },
      ring(x, y, n, speed) {
        for (let i = 0; i < n; i++) {
          const a = (i / n) * Math.PI * 2;
          add({ t: 's', x, y, vx: Math.cos(a) * speed, vy: Math.sin(a) * speed, life: 1, decay: 0.016, size: 2, c: '#bfe3ff', g: 0, drag: 0.95 });
        }
      },
      cannon(fromLeft, n) {
        for (let i = 0; i < n; i++) {
          const dir = fromLeft ? 1 : -1;
          add({ t: 'c', x: fromLeft ? -10 : W + 10, y: H * (0.75 + Math.random() * 0.2), vx: dir * (4 + Math.random() * (W / 70)), vy: -(9 + Math.random() * (H / 55)), rot: Math.random() * 6, vr: (Math.random() - 0.5) * 0.35, w: 6 + Math.random() * 6, h: 9 + Math.random() * 9, c: pick(CONF), g: 0.2, drag: 0.982, life: 1, decay: 0.003 + Math.random() * 0.002, wob: Math.random() * 10 });
        }
      },
      rain(n) {
        for (let i = 0; i < n; i++) {
          add({ t: 'c', x: Math.random() * W, y: -20, vx: (Math.random() - 0.5) * 1.5, vy: 1.5 + Math.random() * 2.5, rot: Math.random() * 6, vr: (Math.random() - 0.5) * 0.2, w: 5 + Math.random() * 5, h: 8 + Math.random() * 7, c: pick(CONF), g: 0.03, drag: 0.995, life: 1, decay: 0.0025, wob: Math.random() * 10 });
        }
      },
      rocket() {
        const hueSet = Math.random() < 0.18 ? ['#ffe39a', '#ffd36b', '#fff'] : Math.random() < 0.5 ? ['#ffffff', '#bfe3ff', '#7fd0ff'] : ['#5b8cff', '#2e6bff', '#bcd0ff', '#fff'];
        add({ t: 'r', x: W * (0.12 + Math.random() * 0.76), y: H + 10, vx: (Math.random() - 0.5) * 1.6, vy: -(Math.sqrt(H) * 0.55 + Math.random() * 3), life: 1, decay: 0, size: 2.4, c: '#fff', g: 0.11, drag: 0.995, pal: hueSet });
      },
      stop() { alive = false; cancelAnimationFrame(raf); window.removeEventListener('resize', size); P.length = 0; ctx.clearRect(0, 0, W, H); }
    };

    // Same particles and look as before; the loop just does less work per frame:
    // swap-remove instead of splice, one transform call per confetti, and blend mode set once per pass.
    const spawn = [];
    function step() {
      if (!alive) return;
      if (!P.length && idle) { raf = requestAnimationFrame(step); return; } // nothing to draw
      idle = !P.length;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, W, H);
      let n = P.length;
      for (let i = n - 1; i >= 0; i--) {
        const p = P[i];
        p.vx *= p.drag; p.vy = p.vy * p.drag + p.g;
        p.x += p.vx; p.y += p.vy; p.life -= p.decay;
        let dead = false;
        if (p.t === 'r' && p.vy > -1.2) { spawn.push(p); dead = true; }
        else if (p.life <= 0 || p.y > H + 60 || p.x < -80 || p.x > W + 80) dead = true;
        if (dead) { P[i] = P[n - 1]; n--; }
      }
      P.length = n;
      // confetti
      ctx.globalCompositeOperation = 'source-over';
      for (let i = 0; i < n; i++) {
        const p = P[i];
        if (p.t !== 'c') continue;
        p.rot += p.vr; p.wob += 0.12;
        const c = Math.cos(p.rot), sn = Math.sin(p.rot), k = Math.cos(p.wob);
        ctx.setTransform(dpr * c, dpr * sn, -dpr * sn * k, dpr * c * k, dpr * p.x, dpr * p.y);
        ctx.globalAlpha = Math.min(1, p.life * 1.5);
        ctx.fillStyle = p.c;
        ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
      }
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      // sparks and rockets (additive glow)
      ctx.globalCompositeOperation = 'lighter';
      ctx.lineCap = 'round';
      for (let i = 0; i < n; i++) {
        const p = P[i];
        if (p.t === 'c') continue;
        ctx.globalAlpha = p.life > 0 ? p.life : 0;
        ctx.strokeStyle = p.c; ctx.lineWidth = p.size;
        ctx.beginPath(); ctx.moveTo(p.x - p.vx * 2.2, p.y - p.vy * 2.2); ctx.lineTo(p.x, p.y); ctx.stroke();
      }
      ctx.globalCompositeOperation = 'source-over';
      ctx.globalAlpha = 1;
      while (spawn.length) { const r = spawn.pop(); api.burst(r.x, r.y, 80, 6.5, r.pal); }
      raf = requestAnimationFrame(step);
    }
    raf = requestAnimationFrame(step);
    return api;
  }

  /* ---------- Reveal cinematic ---------- */
  let playing = false;
  function playReveal(d, onSeen) {
    if (playing) return;
    playing = true;
    const list = (d.accepted || []).slice();
    const n = list.length;
    const ov = document.createElement('div');
    ov.className = 'reveal';
    ov.setAttribute('role', 'dialog');
    ov.setAttribute('aria-modal', 'true');
    ov.setAttribute('aria-label', 'Animasi pengumuman anggota baru');
    ov.innerHTML = `<div class="rx-bg"></div><div class="rx-rays"></div><div class="rx-floor"></div><canvas class="rx-canvas"></canvas><div class="rx-flash"></div><div class="rx-stage"></div><button type="button" class="rx-skip">Lewati ›</button>`;
    document.body.appendChild(ov);
    document.body.classList.add('reveal-lock');
    const stage = ov.querySelector('.rx-stage');
    const flash = ov.querySelector('.rx-flash');
    const skipBtn = ov.querySelector('.rx-skip');
    const fx = FX(ov.querySelector('.rx-canvas'));
    const timers = [];
    let skipped = false, finaleDone = false, closed = false;
    const pending = new Set();
    const SKIP = {};

    function wait(ms) {
      return new Promise((res, rej) => {
        if (skipped) return rej(SKIP);
        const t = setTimeout(() => { pending.delete(cancel); skipped ? rej(SKIP) : res(); }, ms);
        const cancel = () => { clearTimeout(t); rej(SKIP); };
        pending.add(cancel);
      });
    }
    function later(fn, ms) { const t = setTimeout(fn, ms); timers.push(t); return t; }
    function center() { return { x: fx.w / 2, y: fx.h * 0.46 }; }
    function doFlash() { flash.classList.remove('go'); void flash.offsetWidth; flash.classList.add('go'); }

    async function typeText(el, text, speed) {
      for (let i = 1; i <= text.length; i++) { el.textContent = text.slice(0, i); await wait(speed); }
      el.classList.add('done');
    }

    let namesBuilt = false, cards = [];
    function buildNames() {
      if (namesBuilt) return;
      namesBuilt = true;
      stage.innerHTML = `<div class="rx-scene">
        <div class="rx-head"><div class="k">SELAMAT KEPADA</div><h2>Anggota Baru <span>HMPSINF26</span></h2></div>
        <div class="rx-grid">${list.map((p, i) => `<div class="rx-card"><span class="n">${pad(i + 1)}</span><span class="t"><strong>${esc(p.name)}</strong><span class="chip">${esc(p.division || 'Anggota Baru')}</span></span></div>`).join('')}</div>
        <div class="rx-actions"><button type="button" class="btn btn--light" data-close>Lihat hasil lengkap</button><button type="button" class="btn btn--ghost" data-again>Putar ulang</button></div>
      </div>`;
      cards = Array.from(stage.querySelectorAll('.rx-card'));
      layoutCols();
      stage.querySelector('[data-close]').addEventListener('click', close);
      stage.querySelector('[data-again]').addEventListener('click', () => { close(true); });
    }
    function layoutCols() {
      const grid = stage.querySelector('.rx-grid');
      if (!grid) return;
      const w = grid.clientWidth || stage.clientWidth;
      const want = n <= 4 ? Math.max(1, n) : n <= 6 ? 3 : 4;
      const maxW = Math.max(1, Math.floor((w + 12) / (w < 600 ? 150 : 210)));
      const c = Math.max(1, Math.min(want, maxW));
      cards.forEach((el) => el.style.setProperty('--cols', c));
    }
    window.addEventListener('resize', layoutCols);

    async function timeline() {
      requestAnimationFrame(() => ov.classList.add('on'));
      await wait(500);

      // 1) Intro
      stage.innerHTML = `<div class="rx-scene">
        <div class="rx-logos"><img src="/assets/img/logo-ukwms.webp" alt="UKWMS"><span class="sep"></span><img src="/assets/img/logo-hmps.svg" alt="HMPS Informatika"></div>
        <div class="rx-type" aria-live="polite"></div>
        <h1 class="rx-brand">HMPSINF<span class="px26">26</span></h1>
        <p class="rx-tag">Hasil wawancara anggota baru HMPS Informatika</p>
      </div>`;
      await wait(120);
      stage.querySelector('.rx-logos').style.cssText = 'opacity:1;transform:none';
      await wait(500);
      await typeText(stage.querySelector('.rx-type'), 'MEMBER ANNOUNCEMENT', 55);
      await wait(250);
      ov.classList.add('grid-on');
      stage.querySelector('.rx-brand').classList.add('in');
      const c0 = center(); fx.burst(c0.x, c0.y, 70, 6);
      await wait(1300);
      stage.querySelector('.rx-tag').classList.add('in');
      await wait(1700);

      // 2) Countdown
      for (const num of [3, 2, 1]) {
        stage.innerHTML = `<div class="rx-scene"><div class="rx-count"><span class="rx-ring"></span><b>${num}</b></div></div>`;
        const c = center(); fx.ring(c.x, c.y, 56, 7);
        await wait(950);
      }

      // 3) Flash + names
      doFlash();
      ov.classList.add('lit');
      buildNames();
      const c1 = center(); fx.burst(c1.x, c1.y, 180, 11); fx.ring(c1.x, c1.y, 80, 10);
      await wait(450);
      stage.querySelector('.rx-head').classList.add('in');
      await wait(800);

      for (let i = 0; i < n; i++) {
        const p = list[i];
        const spot = document.createElement('div');
        spot.className = 'rx-spot';
        spot.innerHTML = `<div class="idx">${pad(i + 1)} / ${pad(n)}</div><span class="name">${esc(p.name)}</span><span class="chip">${esc(p.division || 'Anggota Baru HMPSINF26')}</span>`;
        ov.appendChild(spot);
        spot.animate([
          { opacity: 0, transform: 'translate(-50%, -50%) scale(.55)', filter: 'blur(14px)' },
          { opacity: 1, transform: 'translate(-50%, -50%) scale(1.04)', filter: 'blur(0)', offset: 0.7 },
          { opacity: 1, transform: 'translate(-50%, -50%) scale(1)', filter: 'blur(0)' }
        ], { duration: 650, easing: 'cubic-bezier(.16,1,.3,1)', fill: 'forwards' });
        const c = center();
        fx.burst(c.x, c.y, 110, 9);
        if (i === n - 1) fx.ring(c.x, c.y, 64, 9);
        try { await wait(1350); } catch (e) { spot.remove(); throw e; }

        const slot = cards[i];
        slot.scrollIntoView({ block: 'nearest' });
        const sr = slot.getBoundingClientRect(), cr = spot.getBoundingClientRect();
        const dx = sr.left + sr.width / 2 - (cr.left + cr.width / 2);
        const dy = sr.top + sr.height / 2 - (cr.top + cr.height / 2);
        const s = Math.max(0.2, sr.width / cr.width);
        spot.animate([
          { transform: 'translate(-50%, -50%) scale(1)', opacity: 1 },
          { transform: `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px)) scale(${s})`, opacity: 0 }
        ], { duration: 620, easing: 'cubic-bezier(.65,0,.25,1)', fill: 'forwards' });
        later(() => { slot.classList.add('show'); fx.burst(sr.left + sr.width / 2, sr.top + sr.height / 2, 26, 4); }, 380);
        later(() => spot.remove(), 640);
        await wait(700);
      }
      await wait(300);
    }

    function finale() {
      if (finaleDone || closed) return;
      finaleDone = true;
      skipBtn.style.display = 'none';
      ov.querySelectorAll('.rx-spot').forEach((s) => s.remove());
      ov.classList.add('lit', 'grid-on');
      buildNames();
      stage.querySelector('.rx-head').classList.add('in');
      cards.forEach((c) => c.classList.add('show'));
      later(() => stage.querySelector('.rx-actions').classList.add('in'), 900);

      // Bito congratulates
      const bito = document.createElement('div');
      bito.className = 'rx-bito';
      bito.innerHTML = `<div class="rx-bubble">Selamat bergabung di HMPSINF26!<small>— Bito, maskot HMPS INF</small></div>${window.Bito ? Bito.svg('is-happy is-cheer') : ''}`;
      const small = window.matchMedia('(max-width: 600px), (max-height: 560px)').matches;
      (small ? stage.querySelector('.rx-scene') : ov).appendChild(bito);
      later(() => bito.classList.add('in'), 250);
      later(() => { const b = bito.querySelector('.bot'); if (b) { b.classList.remove('is-cheer'); b.classList.add('is-waving'); } }, 3200);

      // Fireworks + confetti
      if (!reduceMotion) {
        fx.cannon(true, fx.w < 640 ? 90 : 160);
        fx.cannon(false, fx.w < 640 ? 90 : 160);
        let k = 0;
        const fw = setInterval(() => { fx.rocket(); if (++k % 2) fx.rocket(); if (k > 12) clearInterval(fw); }, 420);
        timers.push(fw);
        let r = 0;
        const rain = setInterval(() => { fx.rain(fx.w < 640 ? 2 : 4); if (++r > 90) clearInterval(rain); }, 50);
        timers.push(rain);
        const calm = setInterval(() => { if (!closed) fx.rocket(); }, 2600);
        timers.push(calm);
      }
      try { onSeen && onSeen(); } catch (e) {}
    }

    function skip() {
      if (skipped) return;
      skipped = true;
      pending.forEach((c) => c());
      pending.clear();
      finale();
    }
    skipBtn.addEventListener('click', skip);
    function onKey(e) { if (e.key === 'Escape') { finaleDone ? close() : skip(); } }
    document.addEventListener('keydown', onKey);

    function close(replay) {
      if (closed) return;
      closed = true;
      skipped = true;
      pending.forEach((c) => c());
      timers.forEach((t) => { clearTimeout(t); clearInterval(t); });
      ov.classList.add('out');
      document.removeEventListener('keydown', onKey);
      window.removeEventListener('resize', layoutCols);
      setTimeout(() => {
        fx.stop(); ov.remove();
        document.body.classList.remove('reveal-lock');
        playing = false;
        window.scrollTo({ top: 0 });
        if (replay === true) playReveal(d, onSeen);
      }, 700);
    }

    if (reduceMotion) { requestAnimationFrame(() => ov.classList.add('on')); finale(); return; }
    timeline().then(finale, (e) => { if (e === SKIP) finale(); else { console.error(e); finale(); } });
  }

  /* ---------- Boot ---------- */
  load().then(render).catch(() => {
    main.innerHTML = roomShell('<p class="room__sub">Pengumuman belum bisa dimuat. Coba muat ulang halaman ini sebentar lagi.</p>');
  });

  // When the tab comes back into view, re-sync the clock (phones pause timers in the background)
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible' && main.querySelector('.countdown')) load().then(render).catch(() => {});
  });
})();
