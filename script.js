/* Gor Khachatryan — portfolio
   1. background lines   2. typed role   3. theme   4. sections + nav pill
   5. works filter       6. form/toast   7. pointer glow   8. liquid-glass refraction */
(() => {
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const mobile = () => matchMedia('(max-width: 900px)').matches;

  $('#year').textContent = new Date().getFullYear();

  // local time in Armenia, so remote clients see the time difference
  const clock = $('#clock');
  const fmt = new Intl.DateTimeFormat('en-GB', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Yerevan' });
  const tick = () => { clock.textContent = fmt.format(new Date()); };
  tick(); setInterval(tick, 15000);

  /* ---------- 1. vertical lines with falling light ---------- */
  const lines = $('.lines');
  const n = Math.max(6, Math.round(innerWidth / 120));
  for (let i = 0; i < n; i++) {
    const l = document.createElement('i');
    const d = 6 + Math.random() * 8;
    l.style.setProperty('--d', d.toFixed(2) + 's');
    l.style.setProperty('--delay', (-Math.random() * d).toFixed(2) + 's');
    lines.appendChild(l);
  }

  /* ---------- 2. typed role ---------- */
  const typed = $('.typed');
  const words = typed.dataset.words.split('|');
  if (reduced) typed.textContent = words[0];
  else (async function loop() {
    const wait = ms => new Promise(r => setTimeout(r, ms));
    for (let w = 0; ; w = (w + 1) % words.length) {
      const word = words[w];
      for (let i = 1; i <= word.length; i++) { typed.textContent = word.slice(0, i); await wait(65); }
      await wait(1700);
      for (let i = word.length; i >= 0; i--) { typed.textContent = word.slice(0, i); await wait(30); }
      await wait(250);
    }
  })();

  /* ---------- toast ---------- */
  const toastEl = $('.toast');
  let toastT;
  const toast = msg => {
    toastEl.textContent = msg;
    toastEl.classList.add('is-on');
    clearTimeout(toastT);
    toastT = setTimeout(() => toastEl.classList.remove('is-on'), 2600);
  };
  $$('[data-toast]').forEach(a => a.addEventListener('click', e => { e.preventDefault(); toast(a.dataset.toast); }));

  /* ---------- 3. theme ---------- */
  $('.theme-btn').addEventListener('click', () => {
    const next = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
    document.documentElement.dataset.theme = next;
    try { localStorage.setItem('theme', next); } catch (e) {}
  });

  /* ---------- 4. sections + nav pill ---------- */
  const nav = $('.nav');
  const panel = $('.panel');
  const scroller = $('.panel-scroll');
  const sections = Object.fromEntries($$('.section').map(s => [s.id, s]));
  const navBtns = $$('.nav-btn[data-section]');
  const pill = document.createElement('span');
  pill.className = 'nav-pill';
  nav.prepend(pill);

  let current = 'about';
  let outTimer;

  function placePill(animate = true) {
    const btn = navBtns.find(b => b.dataset.section === current);
    if (!btn) return;
    if (!animate) pill.style.transition = 'none';
    pill.style.transform = `translate(${btn.offsetLeft}px, ${btn.offsetTop}px)`;
    if (!animate) { pill.offsetWidth; pill.style.transition = ''; }
  }

  function show(id, { instant = false } = {}) {
    if (!sections[id]) return;
    navBtns.forEach(b => {
      const on = b.dataset.section === id;
      b.classList.toggle('is-active', on);
      on ? b.setAttribute('aria-current', 'page') : b.removeAttribute('aria-current');
    });

    if (id !== current) {
      const prev = sections[current], next = sections[id];
      clearTimeout(outTimer);
      $$('.section').forEach(s => s.classList.remove('is-out', 'is-in', 'is-active'));
      const enter = () => {
        prev.classList.remove('is-out');
        next.classList.add('is-active', 'is-in');
        scroller.scrollTop = 0;
      };
      if (instant || reduced) enter();
      else { prev.classList.add('is-out'); outTimer = setTimeout(enter, 300); }
      current = id;
      history.replaceState(null, '', '#' + id);

      if (mobile() && !instant) {
        const top = panel.getBoundingClientRect().top;
        if (top < 0 || top > innerHeight * .6) scrollTo({ top: scrollY + top - 14, behavior: reduced ? 'auto' : 'smooth' });
      }
    } else {
      sections[id].classList.add('is-active');
    }
    placePill(!instant);
  }

  document.addEventListener('click', e => {
    const a = e.target.closest('[data-section]');
    if (!a) return;
    e.preventDefault();
    show(a.dataset.section);
  });
  const fromHash = location.hash.slice(1);
  show(sections[fromHash] ? fromHash : 'about', { instant: true });
  addEventListener('resize', () => placePill(false));
  document.fonts && document.fonts.ready.then(() => placePill(false));

  /* ---------- 5. works filter ---------- */
  $$('.filters button').forEach(b => b.addEventListener('click', () => {
    $$('.filters button').forEach(x => x.classList.toggle('is-on', x === b));
    const f = b.dataset.filter;
    $$('.work').forEach(w => w.classList.toggle('is-hidden', f !== 'all' && w.dataset.cat !== f));
  }));
  // case window: plays the project video (or shows the image) with a description and links
  const lb = $('.lightbox');
  const lbImg = $('img', lb);
  const lbVid = $('video', lb);
  const lbTitle = $('.case-text h4', lb);
  const lbDesc = $('.case-text p', lb);
  const lbLinks = $('.case-links', lb);
  let lastFocus = null;
  const closeLb = () => {
    if (!lb.classList.contains('is-on')) return;
    lb.classList.remove('is-on');
    lb.setAttribute('aria-hidden', 'true');
    lbVid.pause();
    setTimeout(() => { if (!lb.classList.contains('is-on')) { lbVid.removeAttribute('src'); lbVid.load(); } }, 400);
    lastFocus && lastFocus.focus();
  };
  $$('.work:not([target])').forEach(w => w.addEventListener('click', e => {
    e.preventDefault();
    lastFocus = w;
    const video = w.dataset.video;
    lb.classList.toggle('has-video', !!video);
    if (video) {
      lbVid.poster = w.dataset.poster || '';
      lbVid.src = video;
      lbVid.currentTime = 0;
      lbVid.play().catch(() => {});
    } else {
      lbImg.src = w.getAttribute('href');
      lbImg.alt = $('img', w).alt;
    }
    lbTitle.textContent = $('h4', w).textContent;
    lbDesc.textContent = w.dataset.desc || $('p', w).textContent;
    lbLinks.innerHTML = '';
    (w.dataset.links || '').split(';').filter(Boolean).forEach(pair => {
      const [label, url] = pair.split('|');
      const a = document.createElement('a');
      a.className = 'btn btn-ghost';
      a.href = url; a.target = '_blank'; a.rel = 'noopener';
      a.innerHTML = '<svg viewBox="0 0 24 24"><path d="M7 17 17 7M8 7h9v9"/></svg>';
      a.prepend(label + ' ');
      lbLinks.append(a);
    });
    lb.classList.add('is-on');
    lb.setAttribute('aria-hidden', 'false');
    $('.lightbox-close', lb).focus({ preventScroll: true });
  }));
  lb.addEventListener('click', e => { if (e.target === lb || e.target.closest('.lightbox-close')) closeLb(); });
  addEventListener('keydown', e => { if (e.key === 'Escape') closeLb(); });

  /* ---------- 6. contact form → email via FormSubmit (no backend needed) ---------- */
  const form = $('#contact-form');
  const sendBtn = $('button[type="submit"]', form);
  form.addEventListener('submit', async e => {
    e.preventDefault();
    let ok = true;
    $$('[required]', form).forEach(i => {
      const bad = !i.value.trim() || (i.type === 'email' && !/^\S+@\S+\.\S+$/.test(i.value));
      i.classList.toggle('is-invalid', bad);
      if (bad) ok = false;
    });
    if (!ok) return toast('Please fill in the highlighted fields');
    if (form.elements._honey.value) return toast('Thanks! Your message was sent.'); // bot

    const data = Object.fromEntries(new FormData(form));
    delete data._honey;
    data._subject = `Portfolio: new message from ${data.name}`;
    data._template = 'table';

    sendBtn.disabled = true;
    sendBtn.classList.add('is-sending');
    try {
      const res = await fetch(form.dataset.endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify(data),
      });
      const out = await res.json().catch(() => ({}));
      if (res.ok && String(out.success) === 'true') {
        form.reset();
        toast('Thanks! Your message was sent — I reply within one day.');
      } else {
        throw new Error(out.message || res.status);
      }
    } catch (err) {
      toast('Sorry, sending failed. Please email me directly: gordrak2017@yandex.com');
      console.warn('contact form:', err);
    } finally {
      sendBtn.disabled = false;
      sendBtn.classList.remove('is-sending');
    }
  });
  $$('[required]', form).forEach(i => i.addEventListener('input', () => i.classList.remove('is-invalid')));

  /* ---------- 7. specular glow follows the pointer ---------- */
  const glass = $$('.glass');
  let raf = 0, px = 0, py = 0;
  addEventListener('pointermove', e => {
    px = e.clientX; py = e.clientY;
    if (raf) return;
    raf = requestAnimationFrame(() => {
      raf = 0;
      glass.forEach(g => {
        const r = g.getBoundingClientRect();
        g.style.setProperty('--mx', (px - r.left) + 'px');
        g.style.setProperty('--my', (py - r.top) + 'px');
      });
    });
  }, { passive: true });

  /* ---------- 8. liquid-glass refraction ----------
     Chromium can run an SVG filter inside backdrop-filter. For each glass element we draw a
     displacement map: near the rounded edge, pixels are pulled from further inside, so the
     background bends like light through the thick rim of a lens. The centre stays flat.
     Safari / Firefox keep the plain frosted glass. */
  const supportsRefraction = !!navigator.userAgentData && CSS.supports('backdrop-filter', 'url(#a)');
  if (!supportsRefraction) return;

  const NS = 'http://www.w3.org/2000/svg';
  const defs = $('.lg-defs defs');
  const cfg = { nav: { bezel: 22, scale: 46 }, card: { bezel: 30, scale: 60 }, panel: { bezel: 34, scale: 70 } };
  const cvs = document.createElement('canvas');
  const ctx = cvs.getContext('2d');

  function displacementMap(w, h, r, bezel) {
    cvs.width = w; cvs.height = h;
    const img = ctx.createImageData(w, h);
    const d = img.data;
    const hw = w / 2, hh = h / 2;
    r = Math.min(r, hw, hh);
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const i = (y * w + x) * 4;
        let R = 128, G = 128;
        const px = x + .5 - hw, py = y + .5 - hh;
        const qx = Math.abs(px) - (hw - r), qy = Math.abs(py) - (hh - r);
        const ox = Math.max(qx, 0), oy = Math.max(qy, 0);
        const sd = Math.hypot(ox, oy) + Math.min(Math.max(qx, qy), 0) - r; // signed distance, <0 inside
        const e = -sd;
        if (e >= 0 && e < bezel) {
          let nx, ny;
          if (qx > 0 && qy > 0) { const l = Math.hypot(qx, qy) || 1; nx = qx / l; ny = qy / l; }
          else if (qx > qy) { nx = 1; ny = 0; } else { nx = 0; ny = 1; }
          nx *= Math.sign(px) || 1; ny *= Math.sign(py) || 1;
          const t = 1 - e / bezel;
          const s = t * t * (3 - 2 * t) * t;          // steep at the rim, smooth into the flat centre
          R = 128 - nx * s * 127;
          G = 128 - ny * s * 127;
        }
        d[i] = R; d[i + 1] = G; d[i + 2] = 128; d[i + 3] = 255;
      }
    }
    ctx.putImageData(img, 0, 0);
    return cvs.toDataURL();
  }

  function el(tag, attrs) {
    const node = document.createElementNS(NS, tag);
    for (const k in attrs) node.setAttribute(k, attrs[k]);
    return node;
  }

  const kindOf = g => g.classList.contains('nav') ? 'nav' : g.classList.contains('card') ? 'card' : 'panel';

  function build(g, idx) {
    const w = Math.round(g.offsetWidth), h = Math.round(g.offsetHeight);
    if (!w || !h) return;
    const { bezel, scale } = cfg[kindOf(g)];
    const r = parseFloat(getComputedStyle(g).borderTopLeftRadius) || 0;
    const id = 'lg-' + idx;
    const old = document.getElementById(id);
    if (old) old.remove();
    const f = el('filter', {
      id, x: 0, y: 0, width: w, height: h,
      filterUnits: 'userSpaceOnUse', primitiveUnits: 'userSpaceOnUse',
      'color-interpolation-filters': 'sRGB'
    });
    f.appendChild(el('feImage', { href: displacementMap(w, h, r, bezel), x: 0, y: 0, width: w, height: h, preserveAspectRatio: 'none', result: 'map' }));
    f.appendChild(el('feDisplacementMap', { in: 'SourceGraphic', in2: 'map', scale, xChannelSelector: 'R', yChannelSelector: 'G' }));
    defs.appendChild(f);
    g.style.setProperty('--lg-filter', `url(#${id})`);
    g.classList.add('refract');
  }

  const pending = new Set();
  let buildRaf = 0;
  const ro = new ResizeObserver(entries => {
    entries.forEach(en => pending.add(en.target));
    cancelAnimationFrame(buildRaf);
    buildRaf = requestAnimationFrame(() => {
      pending.forEach(g => build(g, glass.indexOf(g)));
      pending.clear();
    });
  });
  glass.forEach(g => ro.observe(g));
})();
