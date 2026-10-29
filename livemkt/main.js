/* LIVE MKT — comportamento. Scroll nativo sempre: animação só por tempo, entrada na tela (uma vez) e ponteiro/toque. */
(function () {
  var d = document.documentElement;
  var reduced = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var g = window.gsap;
  var fine = matchMedia('(pointer: fine)').matches;
  var wide = matchMedia('(min-width: 961px)').matches;

  /* ---------- mural: "ver todos" (sem JS, tudo aparece) ---------- */
  var mural = $('#mural'), more = $('#more');
  if (mural && more && $$('.tile', mural).length > 12) {
    mural.classList.add('is-collapsed');
    more.hidden = false;
    more.addEventListener('click', function () {
      var c = mural.classList.toggle('is-collapsed');
      more.textContent = c ? more.getAttribute('data-more') : more.getAttribute('data-less');
    });
  }

  /* ---------- janela de case: galeria dos cases reais ---------- */
  var dlg = $('#dlg');
  if (dlg) {
    var img = $('#dlgImg'), th = $('#dlgThumbs'), tt = $('#dlgT'), cc = $('#dlgC'), yt = $('#dlgYt');
    var show = function (src, alt, i) {
      img.src = src; img.alt = alt;
      $$('button', th).forEach(function (b, k) { b.setAttribute('aria-current', k === i ? 'true' : 'false'); });
    };
    var openCase = function (btn) {
      if (!btn) return;
      var gal = (btn.getAttribute('data-gal') || '').split(',').filter(Boolean);
      var title = btn.getAttribute('data-title') || '', client = btn.getAttribute('data-client') || '', vid = btn.getAttribute('data-yt');
      var alt = title + (client ? ' — ' + client : '');
      tt.textContent = title; cc.textContent = client; cc.hidden = !client;
      if (vid) { yt.href = 'https://www.youtube.com/watch?v=' + vid; yt.hidden = false; } else { yt.hidden = true; }
      th.innerHTML = '';
      gal.forEach(function (src, i) {
        var li = document.createElement('li'), b = document.createElement('button'), im = document.createElement('img');
        b.type = 'button'; b.setAttribute('aria-label', 'Foto ' + (i + 1) + ' de ' + gal.length);
        im.src = src; im.alt = ''; im.width = 64; im.height = 48; im.loading = 'lazy';
        b.appendChild(im); li.appendChild(b); th.appendChild(li);
        b.addEventListener('click', function () { show(src, alt, i); });
      });
      th.hidden = gal.length < 2;
      show(gal[0] || $('img', btn).getAttribute('src'), alt, 0);
      if (dlg.showModal) dlg.showModal(); else dlg.setAttribute('open', '');
      if (g && !reduced) g.fromTo(dlg, { opacity: 0, y: 24, scale: 0.97 }, { opacity: 1, y: 0, scale: 1, duration: 0.5, ease: 'expo.out', clearProps: 'transform' });
    };
    var tiles = $$('.tile__btn');
    tiles.forEach(function (b) { b.addEventListener('click', function () { openCase(b); }); });
    $$('.dcard').forEach(function (b) { b.addEventListener('click', function () { openCase(tiles[+b.getAttribute('data-open')]); }); });
    $('#dlgX').addEventListener('click', function () { dlg.close ? dlg.close() : dlg.removeAttribute('open'); });
    dlg.addEventListener('click', function (e) { if (e.target === dlg && dlg.close) dlg.close(); });
  }

  var opts = { h1: '#h1', entrance: '[data-in]', reveal: '[data-reveal]', form: '#form', msg: '#formMsg', tilt: '.tile__btn' };
  if (reduced || !g || !window.Kit) { if (window.Kit) Kit.init(opts); else d.classList.add('anim-fail'); return; }

  /* ---------- abertura de palco: cortina abre, texto entra, cases voam ---------- */
  var curtain = $('.curtain');
  var tl = g.timeline();
  tl.fromTo('.curtain__logo', { opacity: 0, scale: 0.92 }, { opacity: 1, scale: 1, duration: 0.2, ease: 'power2.out' }, 0)
    .to('.curtain__logo', { opacity: 0, scale: 1.08, duration: 0.2, ease: 'power2.in' }, 0.22)
    .to('.curtain__l', { xPercent: -102, duration: 0.65, ease: 'expo.inOut' }, 0.22)
    .to('.curtain__r', { xPercent: 102, duration: 0.65, ease: 'expo.inOut' }, 0.22)
    .call(function () { Kit.init(opts); startHero(); }, null, 0.25)
    .call(function () { if (curtain) curtain.style.display = 'none'; }, null, 0.95);

  function startHero() {
    var cards = $$('.dcard');
    g.fromTo(cards, { y: 90, scale: 0.86 }, {
      y: 0, scale: 1, duration: 1.3, ease: 'expo.out', stagger: 0.1,
      onComplete: function () {
        cards.forEach(function (c, i) {
          g.to(c, { y: (i % 2 ? -1 : 1) * 10, duration: 3 + i * 0.45, ease: 'sine.inOut', yoyo: true, repeat: -1 });
        });
      }
    });

    /* luz de palco e blobs: loops por tempo, pausam fora da tela */
    var amb = g.timeline({ paused: true });
    amb.fromTo('.beam--a', { rotation: -14 }, { rotation: 12, duration: 5.5, ease: 'sine.inOut', yoyo: true, repeat: -1 }, 0)
       .fromTo('.beam--b', { rotation: 14 }, { rotation: -12, duration: 6.5, ease: 'sine.inOut', yoyo: true, repeat: -1 }, 0)
       .to('.blob--a', { x: 40, y: -30, rotation: 18, duration: 7, ease: 'sine.inOut', yoyo: true, repeat: -1 }, 0)
       .to('.blob--b', { x: -36, y: 24, rotation: -14, duration: 8, ease: 'sine.inOut', yoyo: true, repeat: -1 }, 0);
    var hero = $('#top');
    new IntersectionObserver(function (en) { en[0].isIntersecting ? amb.play() : amb.pause(); }).observe(hero);

    /* ponteiro: o deck inclina em profundidade e o refletor segue o cursor */
    if (fine) {
      var rig = $('#rig'), spot = $('#spot');
      var qy = g.quickTo(rig, 'rotationY', { duration: 0.8, ease: 'power3.out' });
      var qx = g.quickTo(rig, 'rotationX', { duration: 0.8, ease: 'power3.out' });
      g.set(rig, { transformPerspective: 1100 });
      hero.addEventListener('pointermove', function (e) {
        var r = hero.getBoundingClientRect(), nx = (e.clientX - r.left) / r.width - 0.5, ny = (e.clientY - r.top) / r.height - 0.5;
        qy(nx * 22); qx(-ny * 12);
        g.to(spot, { '--mx': (e.clientX - r.left) + 'px', '--my': (e.clientY - r.top) + 'px', duration: 0.7, ease: 'power3.out', overwrite: 'auto' });
      });
      hero.addEventListener('pointerleave', function () { qy(0); qx(0); });
    }
  }

  /* ---------- serviços: foto de case segue o cursor (só mouse, tela larga) ---------- */
  if (fine && wide) {
    var peek = $('#peek'), pimg = $('img', peek), cap = $('figcaption', peek);
    var px = g.quickTo(peek, 'x', { duration: 0.5, ease: 'power3.out' });
    var py = g.quickTo(peek, 'y', { duration: 0.5, ease: 'power3.out' });
    var pr = g.quickTo(peek, 'rotation', { duration: 0.6, ease: 'power3.out' });
    var lastX = 0, shown = false;
    g.set(peek, { xPercent: -50, yPercent: -50 });
    $$('.row').forEach(function (row) {
      row.addEventListener('pointerenter', function (e) {
        pimg.src = row.getAttribute('data-img'); pimg.className = row.getAttribute('data-cls') || '';
        cap.textContent = row.getAttribute('data-cap') || '';
        if (!shown) { g.set(peek, { x: e.clientX + 120, y: e.clientY, scale: 0.6 }); shown = true; }
        g.to(peek, { opacity: 1, scale: 1, duration: 0.45, ease: 'expo.out', overwrite: 'auto' });
      });
      row.addEventListener('pointermove', function (e) {
        px(e.clientX + 170); py(e.clientY);
        pr(g.utils.clamp(-12, 12, (e.clientX - lastX) * 0.8)); lastX = e.clientX;
      });
      row.addEventListener('pointerleave', function () {
        shown = false;
        g.to(peek, { opacity: 0, scale: 0.7, duration: 0.3, ease: 'power2.in', overwrite: 'auto' });
      });
    });
  }

  /* ---------- megafone: flutua no tempo e inclina com o ponteiro ---------- */
  var mega = $('#mega');
  if (mega) {
    var mi = $('img', mega);
    var bob = g.to(mi, { y: -14, rotation: 2.5, duration: 3.2, ease: 'sine.inOut', yoyo: true, repeat: -1, paused: true });
    new IntersectionObserver(function (en) { en[0].isIntersecting ? bob.play() : bob.pause(); }).observe(mega);
    if (fine) {
      mega.addEventListener('pointermove', function (e) {
        var r = mega.getBoundingClientRect();
        g.to(mi, { rotationY: ((e.clientX - r.left) / r.width - 0.5) * 18, rotationX: (0.5 - (e.clientY - r.top) / r.height) * 12, transformPerspective: 800, duration: 0.6, ease: 'power3.out', overwrite: 'auto' });
      });
      mega.addEventListener('pointerleave', function () { g.to(mi, { rotationY: 0, rotationX: 0, duration: 1, ease: 'elastic.out(1,0.5)', overwrite: 'auto' }); });
    }
  }
})();
