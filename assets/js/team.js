/* Data pengurus HMPS Informatika + renderer untuk Beranda & Tim Kami */
(function () {
  const DIVISIONS = [
    {
      id: 'bph', name: 'Badan Pengurus Harian', short: 'BPH',
      desc: 'Menentukan arah organisasi, menjaga ritme kerja tiap divisi, serta mengurus administrasi dan keuangan himpunan.'
    },
    {
      id: 'ie', name: 'Internal & External', short: 'Internal & External',
      desc: 'Merawat kekompakan di dalam himpunan dan membuka relasi dengan program studi, himpunan lain, serta mitra dari luar kampus.'
    },
    {
      id: 'cm', name: 'Creative Media', short: 'Creative Media',
      desc: 'Menjaga identitas visual HMPS Informatika: desain publikasi, konten Instagram, sampai dokumentasi setiap kegiatan.'
    },
    {
      id: 'rt', name: 'Research & Technology', short: 'Research & Tech',
      desc: 'Mengikuti perkembangan teknologi dan membagikannya ke mahasiswa lewat kajian, workshop, dan proyek bersama.'
    },
    {
      id: 'si', name: 'Student Interest', short: 'Student Interest',
      desc: 'Menampung minat dan bakat mahasiswa lewat kegiatan non-akademik yang seru dan tetap bermanfaat.'
    }
  ];

  const MEMBERS = [
    { name: 'Lita', role: 'Ketua', div: 'bph', photo: 'lita' },
    { name: 'Jevinca', role: 'Sekretaris', div: 'bph', photo: 'jevinca' },
    { name: 'Daniel', role: 'Bendahara', div: 'bph', photo: 'daniel' },
    { name: 'Berlin', role: 'Koor Internal & External', div: 'ie', photo: 'berlin' },
    { name: 'Marcel', role: 'Staff Internal & External', div: 'ie', photo: 'marcel' },
    { name: 'Rafael', role: 'Koor Creative Media', div: 'cm', photo: 'rafael' },
    { name: 'Alex', role: 'Staff Creative Media', div: 'cm', photo: 'alex' },
    { name: 'Bram', role: 'Staff Creative Media', div: 'cm', photo: 'bram' },
    { name: 'Robert', role: 'Koor Research & Tech', div: 'rt', photo: 'robert' },
    { name: 'Matthew', role: 'Staff Research & Tech', div: 'rt', photo: 'matthew' },
    { name: 'Dustin', role: 'Koor Student Interest', div: 'si', photo: 'dustin' },
    { name: 'Michelle', role: 'Staff Student Interest', div: 'si', photo: 'michelle' }
  ];

  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const divById = Object.fromEntries(DIVISIONS.map((d) => [d.id, d]));

  function card(m, i) {
    const d = divById[m.div];
    return `<article class="member rv" style="--d:${(i % 3) * 0.08}s">
      <div class="member__photo"><img src="/assets/img/team/${m.photo}.webp" alt="Foto ${esc(m.name)}, ${esc(m.role)}" loading="lazy" decoding="async" width="720" height="720"></div>
      <div class="member__body">
        <h3 class="member__name">${esc(m.name)}</h3>
        <span class="chip">${esc(m.role)}</span>
        <span class="member__div">${esc(d.name)}</span>
      </div>
    </article>`;
  }

  // Home preview: BPH
  const preview = document.querySelector('[data-team-preview]');
  if (preview) preview.innerHTML = MEMBERS.filter((m) => m.div === 'bph').map(pcard).join('');

  // Division counts on home
  document.querySelectorAll('[data-div-count]').forEach((el) => {
    const n = MEMBERS.filter((m) => m.div === el.dataset.divCount).length;
    el.textContent = `${n} pengurus`;
  });

  // Team page
  const root = document.querySelector('[data-team]');
  const filters = document.querySelector('[data-filters]');
  const reel = document.querySelector('[data-reel]');
  const isLead = (m) => /^(Ketua|Koor)/.test(m.role);

  if (reel) {
    const cols = [[], [], []];
    MEMBERS.forEach((m, i) => cols[i % 3].push(m));
    reel.innerHTML = cols.map((c) => {
      const imgs = c.concat(c).map((m) => `<img src="/assets/img/team/${m.photo}.webp" alt="" width="360" height="360" decoding="async">`).join('');
      return `<div class="reel__col"><div class="reel__track">${imgs}</div></div>`;
    }).join('');
    // mobile: one long horizontal track with everyone
    if (window.matchMedia('(max-width: 960px)').matches) {
      const all = MEMBERS.concat(MEMBERS).map((m) => `<img src="/assets/img/team/${m.photo}.webp" alt="" width="360" height="360" decoding="async">`).join('');
      reel.innerHTML = `<div class="reel__col"><div class="reel__track">${all}</div></div>`;
    }
  }

  function pcard(m, i) {
    const tag = m.role === 'Ketua' ? 'KETUA' : /^Koor/.test(m.role) ? 'KOORDINATOR' : '';
    return `<article class="pcard rv" style="--d:${(i % 4) * 0.07}s">
      <div class="pcard__in">
        <div class="pcard__media"><img src="/assets/img/team/${m.photo}.webp" alt="Foto ${esc(m.name)}, ${esc(m.role)}" loading="lazy" decoding="async" width="720" height="720"><span class="pcard__glare"></span>${tag ? `<span class="pcard__tag">${tag}</span>` : ''}</div>
        <div class="pcard__info"><div><h3>${esc(m.name)}</h3><span class="chip">${esc(m.role)}</span></div><span class="pcard__idx">${String(i + 1).padStart(2, '0')}</span></div>
      </div>
    </article>`;
  }

  if (root && filters) {
    root.innerHTML = DIVISIONS.map((d, i) => {
      const list = MEMBERS.filter((m) => m.div === d.id);
      const first = d.name.charAt(0), rest = d.name.slice(1);
      const head = `<header class="group-head rv">
          <span class="group-head__num">${String(i + 1).padStart(2, '0')}</span>
          <h2 id="h-${d.id}"><small>${list.length} PENGURUS</small><span class="px">${esc(first)}</span>${esc(rest)}</h2>
          <p>${esc(d.desc)}</p>
        </header>`;
      let body;
      if (d.id === 'bph') {
        const ketua = list.find((m) => m.role === 'Ketua');
        const others = list.filter((m) => m !== ketua);
        body = `<div class="bph">
          <article class="lead-card rv">
            <div class="lead-card__media"><img src="/assets/img/team/${ketua.photo}.webp" alt="Foto ${esc(ketua.name)}, Ketua HMPS Informatika" loading="lazy" width="720" height="720"></div>
            <div class="lead-card__body">
              <span class="px-tag">KETUA HMPS INFORMATIKA</span>
              <h3>${esc(ketua.name)}</h3>
              <blockquote>“Saya ingin HMPS Informatika lebih berfokus pada kebutuhan mahasiswa, dengan program kerja yang relevan dan bermanfaat.”</blockquote>
            </div>
          </article>
          <div class="bph__side">${others.map((m, k) => pcard(m, k + 1)).join('')}</div>
        </div>`;
      } else {
        body = `<div class="pgrid">${list.map(pcard).join('')}</div>`;
      }
      return `<section class="team-group" id="${d.id}" data-group="${d.id}" aria-labelledby="h-${d.id}">${head}${body}</section>`;
    }).join('');

    const all = [{ id: 'all', short: 'Semua', n: MEMBERS.length }].concat(DIVISIONS.map((d) => ({ id: d.id, short: d.short, n: MEMBERS.filter((m) => m.div === d.id).length })));
    filters.innerHTML = all.map((f) => `<button type="button" class="filter" data-filter="${f.id}" aria-pressed="${f.id === 'all'}">${esc(f.short)} <small>${f.n}</small></button>`).join('');
    filters.addEventListener('click', (e) => {
      const b = e.target.closest('[data-filter]');
      if (!b) return;
      const id = b.dataset.filter;
      filters.querySelectorAll('[data-filter]').forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
      root.querySelectorAll('[data-group]').forEach((g) => {
        g.hidden = !(id === 'all' || g.dataset.group === id);
        if (!g.hidden) g.querySelectorAll('.rv').forEach((r) => r.classList.add('in'));
      });
      b.scrollIntoView({ block: 'nearest', inline: 'center', behavior: 'smooth' });
      const top = root.getBoundingClientRect().top + window.scrollY - 150;
      if (window.scrollY > top) window.scrollTo({ top, behavior: 'smooth' });
    });

  }

  // 3D tilt + glare on cards (pointer devices only)
  if (window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
    {
      document.addEventListener('pointermove', (e) => {
        const card = e.target.closest('.pcard');
        if (!card) return;
        const r = card.getBoundingClientRect();
        const px = (e.clientX - r.left) / r.width, py = (e.clientY - r.top) / r.height;
        const inner = card.querySelector('.pcard__in');
        inner.style.transform = `rotateX(${((0.5 - py) * 9).toFixed(2)}deg) rotateY(${((px - 0.5) * 11).toFixed(2)}deg) translateY(-6px)`;
        card.style.setProperty('--gx', (px * 100).toFixed(1) + '%');
        card.style.setProperty('--gy', (py * 100).toFixed(1) + '%');
      });
      document.addEventListener('pointerout', (e) => {
        const card = e.target.closest('.pcard');
        if (card && !card.contains(e.relatedTarget)) card.querySelector('.pcard__in').style.transform = '';
      });
    }
  }

  const koor = document.querySelector('[data-koor-count]');
  if (koor) koor.textContent = String(MEMBERS.filter(isLead).length).padStart(2, '0');

  const total = document.querySelector('[data-total-members]');
  if (total) total.textContent = MEMBERS.length;
})();
