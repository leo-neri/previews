/* Rookie Digital — comportamento. Scroll nativo; animação só por entrada na tela (uma vez), tempo ou ponteiro/toque. */
(function () {
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };

  Kit.init({ h1: '#h1', entrance: '[data-in]', reveal: '[data-reveal]', form: '#form', msg: '#formMsg', tilt: '[data-tilt]' });

  if (Kit.reduced || !window.gsap) return;
  var gsap = window.gsap;
  var fine = matchMedia('(pointer: fine)').matches;

  /* ---------- HERO: mostrador gira ao entrar, alvo e etiquetas em camadas de profundidade ---------- */
  var dial = $('#heroDial'), img = $('#heroImg'), chips = $$('.chip'), hero = $('#top');
  gsap.fromTo(dial, { rotation: -140, opacity: 0, scale: 0.86 }, { rotation: 0, opacity: 1, scale: 1, duration: 1.7, ease: 'expo.out', delay: 0.1, transformOrigin: '50% 50%' });
  gsap.fromTo(img, { scale: 0.8, opacity: 0 }, { scale: 1, opacity: 1, duration: 1.3, ease: 'expo.out', delay: 0.2 });
  gsap.fromTo(chips, { scale: 0.4, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.8, ease: 'back.out(1.8)', stagger: 0.12, delay: 0.9 });
  // flutuação por tempo (não ligada ao scroll)
  chips.forEach(function (c, i) {
    gsap.to(c, { yPercent: i % 2 ? 14 : -14, duration: 2.4 + i * 0.5, ease: 'sine.inOut', yoyo: true, repeat: -1, delay: 1.2 + i * 0.3 });
  });
  // marcações do mostrador giram bem devagar
  gsap.to(dial, { rotation: '+=360', duration: 140, ease: 'none', repeat: -1, delay: 2 });

  if (fine && hero) {
    var ix = gsap.quickTo(img, 'x', { duration: 0.9, ease: 'power3.out' });
    var iy = gsap.quickTo(img, 'y', { duration: 0.9, ease: 'power3.out' });
    var ir = gsap.quickTo(img, 'rotation', { duration: 1.1, ease: 'power3.out' });
    var cq = chips.map(function (c, i) {
      var d = 1 + i * 0.6;
      return { d: d, x: gsap.quickTo(c, 'x', { duration: 1, ease: 'power3.out' }), y: gsap.quickTo(c, 'y', { duration: 1, ease: 'power3.out' }) };
    });
    hero.addEventListener('pointermove', function (e) {
      var r = hero.getBoundingClientRect();
      var nx = (e.clientX - r.left) / r.width - 0.5, ny = (e.clientY - r.top) / r.height - 0.5;
      ix(nx * -26); iy(ny * -26); ir(nx * 5);
      cq.forEach(function (q) { q.x(nx * 36 * q.d); q.y(ny * 36 * q.d); });
    });
    hero.addEventListener('pointerleave', function () { ix(0); iy(0); ir(0); cq.forEach(function (q) { q.x(0); q.y(0); }); });
  }

  /* ---------- QUEM SOMOS: linhas de construção da marca se desenham ---------- */
  var guides = $('#guides');
  if (guides && 'IntersectionObserver' in window) {
    var gio = new IntersectionObserver(function (en) {
      if (en[0].isIntersecting) {
        gio.disconnect();
        gsap.to(guides, { clipPath: 'inset(0 0% 0 0)', duration: 1.4, ease: 'expo.out' });
      }
    }, { threshold: 0.4 });
    gio.observe(guides);
  }

  /* ---------- ASSINATURA: a agulha acha o norte e depois segue o ponteiro ---------- */
  var needle = $('#needle'), section = $('#contato'), north = $('#north');
  if (needle && section && north) {
    var cur = 0, idle = null, armed = false;
    var setAngle = function (target, quick) {
      // caminho mais curto, sem dar voltas
      var delta = ((target - cur + 540) % 360) - 180;
      cur += delta;
      gsap.to(needle, { rotation: cur, duration: quick ? 1.1 : 1.6, ease: 'elastic.out(1,0.5)', overwrite: 'auto' });
    };
    var angleTo = function (x, y) {
      var r = north.getBoundingClientRect();
      var dx = x - (r.left + r.width / 2), dy = y - (r.top + r.height / 2);
      return Math.atan2(dx, -dy) * 180 / Math.PI;
    };
    var startIdle = function () {
      if (idle) idle.kill();
      idle = gsap.to(needle, { rotation: cur + 9, duration: 2.2, ease: 'sine.inOut', yoyo: true, repeat: -1 });
    };
    gsap.set(needle, { xPercent: -50, yPercent: -50, rotation: -150 });
    cur = -150;
    var nio = new IntersectionObserver(function (en) {
      if (!en[0].isIntersecting) return;
      nio.disconnect();
      armed = true;
      cur = 0;
      gsap.to(needle, { rotation: 0, duration: 2.2, ease: 'elastic.out(1,0.35)', delay: 0.2, onComplete: function () { if (!fine) startIdle(); } });
    }, { threshold: 0.35 });
    nio.observe(north);

    if (fine) {
      var raf = 0, lx = 0, ly = 0;
      section.addEventListener('pointermove', function (e) {
        if (!armed) return;
        lx = e.clientX; ly = e.clientY;
        if (raf) return;
        raf = requestAnimationFrame(function () { raf = 0; setAngle(angleTo(lx, ly), true); });
      });
      section.addEventListener('pointerleave', function () { if (armed) setAngle(0, false); });
    } else {
      north.addEventListener('pointerdown', function (e) {
        if (!armed) return;
        if (idle) { idle.kill(); idle = null; }
        setAngle(angleTo(e.clientX, e.clientY), true);
        clearTimeout(north.__t);
        north.__t = setTimeout(function () { setAngle(0, false); }, 3500);
      });
    }
  }
})();
