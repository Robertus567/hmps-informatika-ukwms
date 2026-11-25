/* Shared site behaviour: page loader, transitions, nav, scroll reveal, buddy. */
(function () {
  const html = document.documentElement;
  html.classList.remove('no-js');

  /* ---------- Loader ---------- */
  const loader = document.querySelector('.loader');
  if (loader && window.Bito) {
    const slot = loader.querySelector('.loader__bot');
    if (slot) slot.innerHTML = Bito.svg('is-happy');
  }
  const firstVisit = !sessionStorage.getItem('hmps-visited');
  sessionStorage.setItem('hmps-visited', '1');
  const noAnim = /[?&]noanim\b/.test(location.search); // used for static screenshots
  if (noAnim) html.classList.add('noanim', 'is-ready');
  const minShow = noAnim ? 0 : firstVisit ? 1100 : 520;

  function ready() {
    const elapsed = performance.now();
    setTimeout(() => {
      html.classList.add('is-ready');
      html.classList.remove('is-leaving');
      document.dispatchEvent(new CustomEvent('site:ready'));
      if (loader) setTimeout(() => { if (!html.classList.contains('is-leaving')) loader.hidden = true; }, 500); // after fade-out
    }, Math.max(0, minShow - elapsed));
  }
  if (document.readyState === 'complete') ready();
  else window.addEventListener('load', ready, { once: true });
  // safety net — never trap the visitor behind the loader
  setTimeout(() => html.classList.add('is-ready'), 4000);

  window.addEventListener('pageshow', (e) => {
    if (e.persisted) { html.classList.remove('is-leaving'); html.classList.add('is-ready'); if (loader) loader.hidden = true; }
  });

  document.addEventListener('click', (e) => {
    const a = e.target.closest('a');
    if (!a || e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    if (a.target && a.target !== '_self') return;
    if (a.hasAttribute('download') || a.dataset.noLoader !== undefined) return;
    const url = new URL(a.href, location.href);
    if (url.origin !== location.origin) return;
    if (url.pathname === location.pathname && url.hash) return;
    if (url.pathname === location.pathname && url.search === location.search) { e.preventDefault(); return; }
    e.preventDefault();
    if (loader) loader.hidden = false;
    html.classList.remove('is-ready');
    html.classList.add('is-leaving');
    document.body.classList.remove('nav-open');
    setTimeout(() => { location.href = url.href; }, 420);
  });

  /* ---------- Nav ---------- */
  const header = document.querySelector('.site-header');
  const toggle = document.querySelector('.nav__toggle');
  if (toggle) {
    toggle.addEventListener('click', () => {
      const open = document.body.classList.toggle('nav-open');
      toggle.setAttribute('aria-expanded', String(open));
    });
    window.addEventListener('resize', () => { if (window.innerWidth > 860) document.body.classList.remove('nav-open'); });
  }
  if (header) {
    const onScroll = () => header.classList.toggle('is-scrolled', window.scrollY > 24);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
  }

  /* ---------- Reveal on scroll ---------- */
  const els = document.querySelectorAll('.rv');
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((en) => { if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); } });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
    const start = () => els.forEach((el) => io.observe(el));
    if (html.classList.contains('is-ready')) start(); else document.addEventListener('site:ready', start, { once: true });
  } else {
    els.forEach((el) => el.classList.add('in'));
  }

  /* ---------- Buddy ---------- */
  if (window.Bito && !document.body.hasAttribute('data-no-buddy')) {
    window.buddy = Bito.mountBuddy();
  }

  /* ---------- Footer year ---------- */
  document.querySelectorAll('[data-year]').forEach((el) => { el.textContent = new Date().getFullYear(); });

  /* ---------- Home CTA: live status of the announcement ---------- */
  const status = document.querySelector('[data-announce-status]');
  if (status) {
    fetch('/api/announcement', { cache: 'no-store' }).then((r) => r.json()).then((d) => {
      if (d.status === 'scheduled') {
        const when = new Date(d.revealAt);
        status.innerHTML = `<span class="dot"></span>Dibuka ${fmtDate(when)} pukul ${fmtTime(when)} WIB`;
      } else if (d.status === 'live') {
        status.innerHTML = '<span class="dot"></span>Pengumuman sudah dibuka';
      }
    }).catch(() => {});
  }

  function fmtDate(d) { return d.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Asia/Jakarta' }); }
  function fmtTime(d) { return d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Jakarta' }).replace(':', '.'); }
  window.HMPS = { fmtDate, fmtTime };
})();
