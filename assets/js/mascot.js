/* BITO — maskot robot HMPS Informatika.
   Bito.svg() returns the SVG markup; Bito.mountBuddy() adds the draggable corner buddy. */
(function () {
  let uid = 0;

  function svg(extraClass) {
    const id = 'b' + (++uid);
    return `
<svg class="bot ${extraClass || ''}" viewBox="0 0 200 220" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false">
  <defs>
    <radialGradient id="${id}w" cx=".36" cy=".28" r=".85"><stop offset="0" stop-color="#ffffff"/><stop offset=".55" stop-color="#edf2fb"/><stop offset=".85" stop-color="#cbd6ea"/><stop offset="1" stop-color="#a9b8d6"/></radialGradient>
    <radialGradient id="${id}bl" cx=".35" cy=".3" r=".9"><stop offset="0" stop-color="#cfe2ff"/><stop offset=".45" stop-color="#82b1ff"/><stop offset="1" stop-color="#3d74f0"/></radialGradient>
    <linearGradient id="${id}sc" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#26303f"/><stop offset=".5" stop-color="#0d1320"/><stop offset="1" stop-color="#05070d"/></linearGradient>
    <radialGradient id="${id}core" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#ffffff"/><stop offset=".45" stop-color="#9ff3ff"/><stop offset="1" stop-color="#3db8f5"/></radialGradient>
    <radialGradient id="${id}halo" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#7fe8ff" stop-opacity=".9"/><stop offset="1" stop-color="#3da9e4" stop-opacity="0"/></radialGradient>
    <linearGradient id="${id}sh" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#fff" stop-opacity="0"/><stop offset=".5" stop-color="#fff" stop-opacity=".85"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient>
    <filter id="${id}glow" x="-60%" y="-60%" width="220%" height="220%"><feGaussianBlur stdDeviation="2.6" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
    <clipPath id="${id}hc"><rect x="38" y="44" width="124" height="98" rx="42"/></clipPath>
  </defs>
  <ellipse class="hover-ring" cx="100" cy="212" rx="38" ry="6" fill="url(#${id}halo)"/>
  <!-- bunny-ear antennas -->
  <g class="ears">
    <ellipse cx="44" cy="40" rx="8" ry="21" transform="rotate(-18 44 40)" fill="url(#${id}bl)"/>
    <ellipse cx="156" cy="40" rx="8" ry="21" transform="rotate(18 156 40)" fill="url(#${id}bl)"/>
    <ellipse cx="41" cy="33" rx="2.6" ry="8" transform="rotate(-18 41 33)" fill="#fff" opacity=".6"/>
    <ellipse cx="153" cy="33" rx="2.6" ry="8" transform="rotate(18 153 33)" fill="#fff" opacity=".6"/>
  </g>
  <!-- floating arms -->
  <g class="arm arm-l">
    <path d="M10 150 C6 140 14 132 26 134 L58 140 C66 142 66 156 58 158 L26 164 C16 166 12 160 10 150 Z" fill="url(#${id}w)"/>
    <path d="M46 138.5 L58 140 C66 142 66 156 58 158 L46 160 C50 152 50 145 46 138.5 Z" fill="url(#${id}bl)"/>
  </g>
  <g class="arm arm-r">
    <path d="M190 150 C194 140 186 132 174 134 L142 140 C134 142 134 156 142 158 L174 164 C184 166 188 160 190 150 Z" fill="url(#${id}w)"/>
    <path d="M154 138.5 L142 140 C134 142 134 156 142 158 L154 160 C150 152 150 145 154 138.5 Z" fill="url(#${id}bl)"/>
  </g>
  <!-- body -->
  <path d="M66 150 C66 136 134 136 134 150 L134 168 C134 196 118 206 100 206 C82 206 66 196 66 168 Z" fill="url(#${id}w)"/>
  <path d="M64 148 C64 134 136 134 136 148 L136 160 C128 168 72 168 64 160 Z" fill="url(#${id}bl)"/>
  <path d="M90 162 L110 162 L108 192 C106 197 94 197 92 192 Z" fill="url(#${id}bl)"/>
  <path d="M72 146 C80 141 92 140 100 140" stroke="#fff" stroke-width="3" stroke-linecap="round" fill="none" opacity=".55"/>
  <circle class="core-halo" cx="100" cy="153" r="13" fill="url(#${id}halo)"/>
  <circle class="core" cx="100" cy="153" r="7.5" fill="url(#${id}core)"/>
  <!-- ear discs -->
  <ellipse cx="38" cy="94" rx="13" ry="18" fill="url(#${id}bl)"/>
  <ellipse cx="162" cy="94" rx="13" ry="18" fill="url(#${id}bl)"/>
  <ellipse cx="34" cy="88" rx="4" ry="7" fill="#fff" opacity=".55"/>
  <ellipse cx="158" cy="88" rx="4" ry="7" fill="#fff" opacity=".45"/>
  <!-- head -->
  <rect x="38" y="44" width="124" height="98" rx="42" fill="url(#${id}w)"/>
  <g clip-path="url(#${id}hc)"><rect class="shine" x="-40" y="30" width="34" height="130" fill="url(#${id}sh)" transform="skewX(-18)"/></g>
  <path d="M58 58 C66 50 80 48 92 48" stroke="#fff" stroke-width="5" stroke-linecap="round" fill="none" opacity=".9"/>
  <!-- face screen -->
  <rect x="52" y="60" width="96" height="68" rx="26" fill="url(#${id}sc)"/>
  <path d="M60 74 C64 66 72 63 86 63" stroke="#fff" stroke-width="2.5" stroke-linecap="round" fill="none" opacity=".18"/>
  <g stroke="#6fe6ff" stroke-width="2.2" stroke-linecap="round" fill="none" opacity=".75">
    <path d="M64 75 V70 H69"/><path d="M136 75 V70 H131"/><path d="M64 113 V118 H69"/><path d="M136 113 V118 H131"/>
  </g>
  <g filter="url(#${id}glow)">
    <g class="eyes-normal">
      <rect class="eye" x="76" y="82" width="12" height="20" rx="6" fill="#7ff0ff"/>
      <rect class="eye" x="112" y="82" width="12" height="20" rx="6" fill="#7ff0ff"/>
    </g>
    <g class="eyes-happy" stroke="#7ff0ff" stroke-width="5.5" stroke-linecap="round" fill="none">
      <path d="M72 98 Q82 82 92 98"/><path d="M108 98 Q118 82 128 98"/>
    </g>
    <g class="eyes-squeeze" stroke="#7ff0ff" stroke-width="5.5" stroke-linecap="round" stroke-linejoin="round" fill="none">
      <path d="M75 83 L89 92 L75 101"/><path d="M125 83 L111 92 L125 101"/>
    </g>
    <path class="mouth-smile" d="M94 108 Q100 113 106 108" stroke="#7ff0ff" stroke-width="3" stroke-linecap="round" fill="none"/>
    <ellipse class="mouth-o" cx="100" cy="110" rx="4.5" ry="5" fill="#7ff0ff"/>
  </g>
  <ellipse class="blush" cx="68" cy="106" rx="7" ry="4" fill="#ff8fc0" opacity=".7"/>
  <ellipse class="blush" cx="132" cy="106" rx="7" ry="4" fill="#ff8fc0" opacity=".7"/>
</svg>`;
  }

  /* ---------- Corner buddy with drag physics ---------- */
  function mountBuddy() {
    if (document.querySelector('.buddy')) return;
    const el = document.createElement('div');
    el.className = 'buddy';
    el.setAttribute('role', 'button');
    el.setAttribute('tabindex', '0');
    el.setAttribute('aria-label', 'Bito, maskot HMPS Informatika. Klik atau seret.');
    el.innerHTML = `<div class="buddy__bubble" aria-live="polite"></div><div class="buddy__float"><div class="buddy__body">${svg()}</div></div><div class="buddy__shadow"></div>`;
    document.body.appendChild(el);

    const bot = el.querySelector('.bot');
    const body = el.querySelector('.buddy__body');
    const bubble = el.querySelector('.buddy__bubble');
    const eyes = el.querySelector('.eyes-normal');

    const lines = [
      'Halo! Aku Bito, robot HMPS Informatika.',
      'Coba angkat aku, deh!',
      'Sudah cek halaman Pengumuman?',
      'Semangat buat yang ikut wawancara!',
      'Hehe, geli tahu!'
    ];
    let lineIdx = 0, bubbleTimer;
    function say(text, ms) {
      bubble.textContent = text;
      bubble.classList.add('show');
      clearTimeout(bubbleTimer);
      bubbleTimer = setTimeout(() => bubble.classList.remove('show'), ms || 2600);
    }
    setTimeout(() => say('Halo! Aku Bito. Seret aku kalau gabut~', 3200), 1800);

    // Physics state (offset from home corner)
    let x = 0, y = 0, vx = 0, vy = 0, ang = 0, va = 0;
    let dragging = false, raf = 0, startX = 0, startY = 0, grabDX = 0, grabDY = 0, moved = false, lastPX = 0, lastPY = 0, pvx = 0;

    function homeRect() {
      const r = el.getBoundingClientRect();
      return { left: r.left - x, top: r.top - y, w: r.width, h: r.height };
    }

    function render() {
      el.style.transform = `translate3d(${x.toFixed(2)}px, ${y.toFixed(2)}px, 0)`;
      body.style.transform = `rotate(${ang.toFixed(2)}deg)`;
    }

    function loop() {
      if (dragging) {
        // pendulum: angle follows horizontal velocity (dangling from the antenna)
        const target = Math.max(-40, Math.min(40, -pvx * 2.2));
        va += (target - ang) * 0.18; va *= 0.72; ang += va;
        pvx *= 0.85;
      } else {
        // spring back home
        vx += -x * 0.045; vy += -y * 0.045;
        vy += 0.0; vx *= 0.86; vy *= 0.86;
        x += vx; y += vy;
        va += (-ang) * 0.12 + (-vx * 0.4 - ang) * 0.02; va *= 0.8; ang += va;
        if (Math.abs(x) < 0.3 && Math.abs(y) < 0.3 && Math.abs(vx) < 0.2 && Math.abs(vy) < 0.2 && Math.abs(ang) < 0.3 && Math.abs(va) < 0.2) {
          x = y = vx = vy = ang = va = 0; render(); raf = 0;
          el.classList.remove('is-flying');
          return;
        }
      }
      render();
      raf = requestAnimationFrame(loop);
    }
    function kick() { if (!raf) raf = requestAnimationFrame(loop); }

    el.addEventListener('pointerdown', (e) => {
      if (e.button !== 0) return;
      el.setPointerCapture(e.pointerId);
      dragging = true; moved = false;
      startX = lastPX = e.clientX; startY = lastPY = e.clientY;
      grabDX = e.clientX - x; grabDY = e.clientY - y;
      el.classList.add('is-dragging');
      kick();
    });
    el.addEventListener('pointermove', (e) => {
      if (!dragging) {
        // eyes follow the pointer when hovering
        return;
      }
      if (!moved && Math.hypot(e.clientX - startX, e.clientY - startY) > 6) {
        moved = true;
        bot.classList.add('is-held');
        say('Eh eh, turunin akuu!', 1800);
      }
      if (!moved) return;
      const h = homeRect();
      let nx = e.clientX - grabDX, ny = e.clientY - grabDY;
      // keep inside viewport
      nx = Math.max(-h.left + 4, Math.min(window.innerWidth - h.left - h.w - 4, nx));
      ny = Math.max(-h.top + 4, Math.min(window.innerHeight - h.top - h.h - 4, ny));
      pvx = pvx * 0.5 + (e.clientX - lastPX) * 0.5;
      vx = nx - x; vy = ny - y;
      x = nx; y = ny;
      lastPX = e.clientX; lastPY = e.clientY;
    });
    function release() {
      if (!dragging) return;
      dragging = false;
      el.classList.remove('is-dragging');
      if (moved) {
        el.classList.add('is-flying');
        vx *= 0.6; vy *= 0.6;
        setTimeout(() => { bot.classList.remove('is-held'); bot.classList.add('is-happy'); sparkle(8); }, 350);
        setTimeout(() => bot.classList.remove('is-happy'), 1500);
      } else {
        poke();
      }
      kick();
    }
    el.addEventListener('pointerup', release);
    el.addEventListener('pointercancel', release);
    el.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); poke(); } });

    function sparkle(n) {
      const r = el.getBoundingClientRect();
      for (let i = 0; i < n; i++) {
        const sp = document.createElement('i');
        sp.className = 'spark';
        const a = Math.random() * Math.PI * 2, d = 50 + Math.random() * 60;
        sp.style.left = (r.left + r.width / 2 - 6) + 'px';
        sp.style.top = (r.top + r.height * 0.4 - 6) + 'px';
        sp.style.setProperty('--dx', Math.cos(a) * d + 'px');
        sp.style.setProperty('--dy', Math.sin(a) * d + 'px');
        sp.style.animationDelay = (Math.random() * 0.15) + 's';
        document.body.appendChild(sp);
        setTimeout(() => sp.remove(), 1200);
      }
    }

    function poke() {
      sparkle(10);
      bot.classList.add('is-happy', 'is-waving');
      say(lines[lineIdx++ % lines.length]);
      vy = -9; el.classList.add('is-flying'); kick();
      setTimeout(() => bot.classList.remove('is-happy', 'is-waving'), 1400);
    }

    // Eyes follow the cursor anywhere on the page
    let eyeRaf = 0;
    window.addEventListener('pointermove', (e) => {
      if (dragging || eyeRaf) return;
      eyeRaf = requestAnimationFrame(() => {
        eyeRaf = 0;
        const r = el.getBoundingClientRect();
        const dx = e.clientX - (r.left + r.width / 2), dy = e.clientY - (r.top + r.height * 0.35);
        const d = Math.hypot(dx, dy) || 1;
        const k = Math.min(1, d / 300);
        eyes.style.transform = `translate(${(dx / d * 6 * k).toFixed(2)}px, ${(dy / d * 4.5 * k).toFixed(2)}px)`;
      });
    }, { passive: true });

    window.addEventListener('resize', () => { x = 0; y = 0; render(); });
    return { el, say, bot };
  }

  window.Bito = { svg, mountBuddy };
})();
