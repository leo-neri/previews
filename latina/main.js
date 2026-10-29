/* Latina: scroll nativo; movimento só por entrada na tela (uma vez), tempo e ponteiro. */
Kit.init({ h1: '#h1', entrance: '[data-in]', reveal: '[data-reveal]', form: '#form', msg: '#formMsg', tilt: '[data-tilt]' });

(function () {
  if (Kit.reduced || !window.gsap) return;
  var gsap = window.gsap;
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var fine = matchMedia('(pointer: fine)').matches;

  /* Assinatura: os frames "revelam" em cascata, como uma folha de contato sendo montada; o logotipo sobe da base. */
  var frs = $$('.fr');
  frs.forEach(function (f) { gsap.set(f, { rotation: parseFloat(f.getAttribute('data-r')) || 0 }); });
  var tl = gsap.timeline({ delay: 0.15 });
  tl.to('#heroLogo', { y: 0, duration: 1.3, ease: 'expo.out', clearProps: 'transform' }, 0)
    .fromTo(frs, { opacity: 0, y: 110, scale: 0.86, rotation: function (i, el) { return (parseFloat(el.getAttribute('data-r')) || 0) + (i % 2 ? 10 : -10); } },
      { opacity: 1, y: 0, scale: 1, rotation: function (i, el) { return parseFloat(el.getAttribute('data-r')) || 0; }, duration: 1.2, ease: 'expo.out', stagger: 0.09 }, 0.25);

  /* flutuação lenta (tempo) em camada interna, para não brigar com o paralaxe do ponteiro */
  tl.add(function () {
    $$('.fr__in').forEach(function (el, i) {
      gsap.to(el, { y: (i % 2 ? -8 : 8), duration: 2.6 + (i % 3) * 0.5, ease: 'sine.inOut', yoyo: true, repeat: -1, delay: i * 0.2 });
    });
  }, '>-0.4');

  /* profundidade: cada frame segue o mouse com intensidade diferente (só mouse) */
  var hero = $('.hero');
  if (fine && hero && frs.length) {
    var movers = frs.map(function (f) {
      var d = parseFloat(f.getAttribute('data-depth')) || 1;
      return { d: d, x: gsap.quickTo(f, 'x', { duration: 0.9, ease: 'power3.out' }), y: gsap.quickTo(f, 'y', { duration: 0.9, ease: 'power3.out' }) };
    });
    var ready = false;
    tl.eventCallback('onComplete', function () { ready = true; });
    hero.addEventListener('pointermove', function (e) {
      if (!ready) return;
      var r = hero.getBoundingClientRect();
      var nx = (e.clientX - r.left) / r.width - 0.5, ny = (e.clientY - r.top) / r.height - 0.5;
      movers.forEach(function (m) { m.x(-nx * 34 * m.d); m.y(-ny * 26 * m.d); });
    });
    hero.addEventListener('pointerleave', function () { movers.forEach(function (m) { m.x(0); m.y(0); }); });
  }

  /* figura do método: acompanha o ponteiro com leve profundidade (só mouse) */
  var fig = $('#fig img');
  if (fine && fig) {
    var fx = gsap.quickTo(fig, 'x', { duration: 0.8, ease: 'power3.out' }), fy = gsap.quickTo(fig, 'y', { duration: 0.8, ease: 'power3.out' }), fr = gsap.quickTo(fig, 'rotation', { duration: 0.8, ease: 'power3.out' });
    var box = $('#fig');
    box.addEventListener('pointermove', function (e) {
      var r = box.getBoundingClientRect(), nx = (e.clientX - r.left) / r.width - 0.5, ny = (e.clientY - r.top) / r.height - 0.5;
      fx(nx * 18); fy(ny * 12); fr(nx * 2);
    });
    box.addEventListener('pointerleave', function () { fx(0); fy(0); fr(0); });
  }

  /* linha do método e citação: disparam uma vez, quando entram na tela */
  var once = function (el, fn) {
    if (!el) return;
    var io = new IntersectionObserver(function (es) { if (es[0].isIntersecting) { io.disconnect(); fn(); } }, { rootMargin: '0px 0px -12% 0px' });
    io.observe(el);
  };
  once($('#steps'), function () { gsap.fromTo('.steps__line', { scaleY: 0 }, { scaleY: 1, duration: 1.6, ease: 'power2.inOut' }); });
  var q = $('#quote');
  once(q, function () {
    var words = Kit.maskWords(q);
    gsap.set(words, { yPercent: 115 });
    q.style.visibility = 'visible';
    gsap.to(words, { yPercent: 0, duration: 1, ease: 'expo.out', stagger: 0.04 });
  });
})();
