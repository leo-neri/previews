/* Mootag: scroll nativo; movimento só por entrada na tela (uma vez), tempo e ponteiro. */
Kit.init({ h1: '#h1', entrance: '[data-in]', reveal: '[data-reveal]', form: '#form', msg: '#formMsg', tilt: '[data-tilt]' });

(function () {
  if (Kit.reduced || !window.gsap) return;
  var gsap = window.gsap;
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var fine = matchMedia('(pointer: fine)').matches;
  var wide = matchMedia('(min-width: 900px)').matches;

  /* Assinatura: "brandformance". Os destaques de branding (índigo) e performance (vermelho) varrem o H1, e o foguete decola no meio de uma rede de dados que se desenha. */
  gsap.to('.h1 .hl', { backgroundSize: '100% 100%', color: '#ffffff', duration: 0.9, ease: 'expo.inOut', stagger: 0.22, delay: 0.85 });

  var tl = gsap.timeline({ delay: 0.15 });
  tl.fromTo('#rocket', { y: 150, scale: 0.78, opacity: 0, rotation: -4 }, { y: 0, scale: 1, opacity: 1, rotation: 0, duration: 1.5, ease: 'expo.out', clearProps: 'opacity' }, 0.1);

  $$('.net__lines path').forEach(function (p, i) {
    var len = p.getTotalLength();
    gsap.set(p, { strokeDasharray: len, strokeDashoffset: len });
    gsap.to(p, { strokeDashoffset: 0, duration: 1.6, ease: 'power2.out', delay: 0.5 + i * 0.15 });
  });
  gsap.from('.net__dots circle', { scale: 0, duration: 0.6, ease: 'back.out(2.5)', stagger: 0.07, delay: 0.7 });
  gsap.to('.net__hot', { scale: 1.9, opacity: 0.25, duration: 1.3, ease: 'sine.inOut', yoyo: true, repeat: -1, stagger: 0.5, delay: 1.5 });

  var chips = $$('.chip');
  gsap.fromTo(chips, { opacity: 0, scale: 0.6, y: 16 }, { opacity: 1, scale: 1, y: 0, duration: 0.7, ease: 'back.out(1.8)', stagger: 0.12, delay: 1.0 });
  var flo = $$('.rocket img').concat(chips);
  flo.forEach(function (el, i) {
    gsap.to(el, { y: (i % 2 ? -9 : 9), duration: 2.4 + (i % 3) * 0.5, ease: 'sine.inOut', yoyo: true, repeat: -1, delay: 1.6 + i * 0.2 });
  });

  /* profundidade: foguete e chips seguem o mouse em intensidades diferentes (só mouse) */
  var hero = $('.hero');
  if (fine && wide && hero) {
    var parts = [{ el: $('#rocket'), d: 1, rot: true }].concat(chips.map(function (c) { return { el: c, d: parseFloat(c.getAttribute('data-depth')) || 1 }; }));
    parts.forEach(function (p) {
      p.x = gsap.quickTo(p.el, 'x', { duration: 0.9, ease: 'power3.out' });
      p.y = p.rot ? gsap.quickTo(p.el, 'yPercent', { duration: 0.9, ease: 'power3.out' }) : gsap.quickTo(p.el, 'marginTop', { duration: 0.9, ease: 'power3.out' });
      if (p.rot) p.r = gsap.quickTo(p.el, 'rotation', { duration: 1, ease: 'power3.out' });
    });
    var ready = false;
    gsap.delayedCall(1.8, function () { ready = true; });
    hero.addEventListener('pointermove', function (e) {
      if (!ready) return;
      var r = hero.getBoundingClientRect();
      var nx = (e.clientX - r.left) / r.width - 0.5, ny = (e.clientY - r.top) / r.height - 0.5;
      parts.forEach(function (p) {
        p.x(-nx * 40 * p.d);
        p.y(p.rot ? -ny * 3 : -ny * 30 * p.d);
        if (p.r) p.r(nx * 5);
      });
    });
    hero.addEventListener('pointerleave', function () {
      parts.forEach(function (p) { p.x(0); p.y(0); if (p.r) p.r(0); });
    });
  }

  /* pilares: anéis em órbita (tempo) */
  gsap.to('.pcard__ring.r1', { rotation: 360, duration: 12, ease: 'none', repeat: -1 });
  gsap.to('.pcard__ring.r2', { rotation: -360, duration: 20, ease: 'none', repeat: -1 });

  /* diagrama de dados: acompanha o ponteiro (só mouse, tela larga) */
  var fig = $('#fig'), fimg = $('#fig img');
  if (fine && wide && fig && fimg) {
    var fx = gsap.quickTo(fimg, 'x', { duration: 0.9, ease: 'power3.out' }), fy = gsap.quickTo(fimg, 'y', { duration: 0.9, ease: 'power3.out' });
    gsap.set(fimg, { scale: 1.05 });
    fig.addEventListener('pointermove', function (e) {
      var r = fig.getBoundingClientRect(), nx = (e.clientX - r.left) / r.width - 0.5, ny = (e.clientY - r.top) / r.height - 0.5;
      fx(-nx * 28); fy(-ny * 18);
    });
    fig.addEventListener('pointerleave', function () { fx(0); fy(0); });
  }

  /* fluxo de dados: linha se desenha e os passos acendem em sequência, uma vez, ao entrar na tela */
  var once = function (el, fn) {
    if (!el) return;
    var io = new IntersectionObserver(function (es) { if (es[0].isIntersecting) { io.disconnect(); fn(); } }, { rootMargin: '0px 0px -12% 0px' });
    io.observe(el);
  };
  var flow = $('#flow');
  once(flow, function () {
    var horiz = matchMedia('(min-width: 900px)').matches;
    gsap.fromTo('.flow__line', horiz ? { scaleX: 0 } : { scaleY: 0 }, horiz ? { scaleX: 1, duration: 2, ease: 'power2.inOut' } : { scaleY: 1, duration: 2, ease: 'power2.inOut' });
    $$('.fstep').forEach(function (s, i) { gsap.delayedCall(0.2 + i * 0.4, function () { s.classList.add('is-on'); }); });
    gsap.fromTo('.fstep', { opacity: 0, y: 16 }, { opacity: 1, y: 0, duration: 0.7, ease: 'power3.out', stagger: 0.35, clearProps: 'transform' });
    gsap.to('.flow__loop span', { rotation: -360, duration: 9, ease: 'none', repeat: -1 });
  });
})();
