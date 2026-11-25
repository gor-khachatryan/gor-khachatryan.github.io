/* Gor Khachatryan — portfolio
   1. background lines   2. typed role   3. theme   4. sections + nav pill
   5. works filter       6. form/toast   7. pointer glow   8. liquid-glass refraction
   9. opening animation */
(() => {
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  const root = document.documentElement;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const mobile = () => matchMedia('(max-width: 900px)').matches;
  // resolved when the opening animation (section 9) has finished, or at once without it
  let introDone;
  const introReady = new Promise(resolve => { introDone = resolve; });

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
  else introReady.then(async function loop() {   // starts typing once the card is on screen
    const wait = ms => new Promise(r => setTimeout(r, ms));
    for (let w = 0; ; w = (w + 1) % words.length) {
      const word = words[w];
      for (let i = 1; i <= word.length; i++) { typed.textContent = word.slice(0, i); await wait(65); }
      await wait(1700);
      for (let i = word.length; i >= 0; i--) { typed.textContent = word.slice(0, i); await wait(30); }
      await wait(250);
    }
  });

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
      toast('Sorry, sending failed. Please email me directly: gor.khachatryan03@yandex.ru');
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

  // one SVG filter (w x h px, corner radius r) for backdrop-filter; returns its url(#id)
  function lensFilter(id, w, h, r, bezel, scale) {
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
    return `url(#${id})`;
  }

  if (supportsRefraction) {
    const kindOf = g => g.classList.contains('nav') ? 'nav' : g.classList.contains('card') ? 'card' : 'panel';
    const build = (g, idx) => {
      const w = Math.round(g.offsetWidth), h = Math.round(g.offsetHeight);
      if (!w || !h) return;
      const { bezel, scale } = cfg[kindOf(g)];
      const r = parseFloat(getComputedStyle(g).borderTopLeftRadius) || 0;
      g.style.setProperty('--lg-filter', lensFilter('lg-' + idx, w, h, r, bezel, scale));
      g.classList.add('refract');
    };
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
  }

  /* ---------- 9. opening animation ----------
     html.intro comes from <head> (not with reduced motion). While the page loads, a glass lens sits over
     the colour field gathered in the centre and a ring around it fills. Then "G" gets its amber dot, the
     lens flies into the photo, the card's glass opens out of it (its content following the edge), and
     the panel, the menu and the background come in. A click, a tap, a key or the wheel skips to the end. */
  (function opening() {
    const box = $('.intro-stage');
    clearTimeout(window.introFailsafe);
    if (!root.classList.contains('intro') || !box) {
      root.classList.remove('intro');
      if (box) box.remove();
      return introDone();
    }
    const lens = $('.intro-lens', box);
    const ring = $('.intro-ring circle', box);
    const RING = 604;              // the ring's length (r = 96)
    const MIN = 1150, MAX = 4000;  // the lens stays at least MIN ms; after MAX ms the site opens whatever is still loading
    const t0 = performance.now();
    const anims = [];
    let state = 'loading';         // loading -> reveal -> done

    if (supportsRefraction) {
      lens.style.setProperty('--lg-filter', lensFilter('lg-intro', 148, 148, 74, 34, 64));
      lens.classList.add('refract');
    }

    // what the lens waits for: the fonts, the photo and the window's load event
    const photo = $('.avatar img');
    const tasks = [
      document.fonts ? document.fonts.ready : Promise.resolve(),
      photo && photo.decode ? photo.decode() : Promise.resolve(),
      document.readyState === 'complete' ? Promise.resolve() : new Promise(r => addEventListener('load', r, { once: true })),
    ];
    let loaded = 0;
    tasks.forEach(t => t.then(() => loaded++, () => loaded++));
    // "G" waits for its font, so it never swaps from a fallback letter
    (document.fonts ? document.fonts.load('600 54px Geist') : Promise.resolve())
      .then(() => box.classList.add('has-font'), () => box.classList.add('has-font'));

    const easeInOut = t => t < .5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2;
    const tick = () => {
      if (state !== 'loading') return;
      const elapsed = performance.now() - t0;
      const p = elapsed >= MAX ? 1 : Math.min(loaded / tasks.length, easeInOut(Math.min(1, elapsed / MIN)));
      ring.style.strokeDashoffset = RING * (1 - p);
      if (p >= 1) {
        state = 'reveal';
        box.classList.add('is-done');   // the amber dot
        setTimeout(reveal, 420);
      } else requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);

    const play = (target, keyframes, options) => {
      if (!target) return;
      anims.push(target.animate(keyframes, { fill: 'both', easing: 'cubic-bezier(.2, .8, .2, 1)', ...options }));
    };

    function reveal() {
      if (state === 'done') return;
      box.style.cursor = 'auto';
      const phone = mobile();
      const card = $('.card');
      const avatar = $('.avatar');
      const a = avatar.getBoundingClientRect();
      const l = lens.getBoundingClientRect();
      const ax = a.left + a.width / 2, ay = a.top + a.height / 2;
      const FLY = 820;   // the lens's flight into the photo

      // the ring lets go, the colour field opens out to the whole screen
      play($('.intro-ring', box), [{ opacity: 1 }, { opacity: 0, scale: 1.12 }], { duration: 320 });
      const swirl = $('.swirl');
      play(swirl, [{ scale: getComputedStyle(swirl).scale }, { scale: 1 }], { duration: 1800, easing: 'cubic-bezier(.16, 1, .3, 1)' });
      play($('.blobs'), [{ filter: 'blur(60px)' }, { filter: 'blur(0px)' }], { duration: 1500, easing: 'cubic-bezier(.3, 0, .2, 1)' });
      play($('.lines'), [{ opacity: 0 }, { opacity: 1 }], { duration: 1400, delay: 700 });

      // the lens flies into the photo: "G." fades out, the photo fades in behind the glass
      play(lens, [{ translate: '0 0', scale: 1 }, { translate: `${ax - (l.left + l.width / 2)}px ${ay - (l.top + l.height / 2)}px`, scale: l.width ? a.width / l.width : 1 }],
        { duration: FLY, easing: 'cubic-bezier(.65, 0, .25, 1)' });
      play($('.intro-mark', box), [{ opacity: 1 }, { opacity: 0 }], { duration: 260, delay: 140 });
      play($('img', lens), [{ opacity: 0 }, { opacity: 1 }], { duration: 440, delay: 260 });
      // ...and hands over to the real photo with its colour ring
      play(avatar, [{ opacity: 0 }, { opacity: 1 }], { duration: 300, delay: FLY - 40 });
      play(lens, [{ opacity: 1 }, { opacity: 0 }], { duration: 300, delay: FLY + 40 });

      // the card's glass opens out of the photo; its content comes in as the edge passes it
      const c = card.getBoundingClientRect();
      const ox = ax - c.left, oy = ay - c.top;
      const far = Math.hypot(Math.max(ox, c.width - ox), Math.max(oy, c.height - oy)) + 100;   // + the shadow
      const OPEN = FLY - 110;
      anims.push(card.animate([
        { opacity: 1, clipPath: `circle(${a.width / 2}px at ${ox}px ${oy}px)` },
        { opacity: 1, clipPath: `circle(${far}px at ${ox}px ${oy}px)` },
      ], { duration: 1050, delay: OPEN, fill: 'forwards', easing: 'cubic-bezier(.5, 0, .15, 1)' }));
      [$('.status'), $('.name'), $('.role'), $('.social'), ...$$('.meta li'), $('.card-actions')].forEach(part => {
        if (!part) return;
        const r = part.getBoundingClientRect();
        const d = Math.hypot(r.left + r.width / 2 - ax, r.top + r.height / 2 - ay);
        play(part, [{ opacity: 0, translate: '0 14px' }, { opacity: 1, translate: '0 0' }], { duration: 700, delay: OPEN + 140 + d * .5 });
      });

      // then the panel, its section's content, the menu and the footer
      const PANEL = OPEN + 260;
      play($('.panel'), phone
        ? [{ opacity: 0, translate: '0 48px' }, { opacity: 1, translate: '0 0' }]
        : [{ opacity: 0, translate: '-56px 0', scale: .97 }, { opacity: 1, translate: '0 0', scale: 1 }],
        { duration: 1100, delay: PANEL });
      setTimeout(() => { const s = $('.section.is-active'); if (s && state !== 'done') s.classList.add('is-in'); }, PANEL + 150);
      play($('.nav'), phone
        ? [{ opacity: 0, translate: '0 36px' }, { opacity: 1, translate: '0 0' }]
        : [{ opacity: 0, translate: '40px 0' }, { opacity: 1, translate: '0 0' }],
        { duration: 1000, delay: PANEL + 240, easing: 'cubic-bezier(.34, 1.25, .5, 1)' });
      play($('.foot'), [{ opacity: 0 }, { opacity: 1 }], { duration: 800, delay: PANEL + 500 });

      const end = Math.max(...anims.map(x => x.effect.getComputedTiming().endTime));
      setTimeout(finish, end + 30);
    }

    function finish() {
      if (state === 'done') return;
      state = 'done';
      ['pointerdown', 'keydown', 'wheel', 'touchstart'].forEach(t => removeEventListener(t, finish, true));
      root.classList.remove('intro');
      box.remove();
      anims.forEach(x => x.cancel());   // back to the page's own styles: everything in place
      introDone();
    }
    ['pointerdown', 'keydown', 'wheel', 'touchstart'].forEach(t => addEventListener(t, finish, { capture: true, passive: true }));
  })();
})();
