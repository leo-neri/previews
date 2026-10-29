/* Digital Things: o conteúdo "sai da tela". Scroll nativo; animação por entrada na tela (uma vez), tempo e ponteiro. */
(function () {
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };

  Kit.init({ h1: '#h1', entrance: '[data-in]', reveal: '[data-reveal]', form: '#form', msg: '#formMsg', tilt: '[data-tilt]' });

  var gsap = window.gsap;
  if (Kit.reduced || !gsap) return;
  var fine = matchMedia('(pointer: fine)').matches;

  // ---------- Hero: notebook solta curtidas, corações e moedas ----------
  var stage = $('#stage'), stageIn = $('#stageIn'), bn = $('#bn');
  var tokens = $$('.tk', stage);
  var origin = { x: 0.36, y: 0.55 }; // tela do notebook, em fração do palco

  function launch() {
    var r = stage.getBoundingClientRect();
    var ox = r.width * origin.x, oy = r.height * origin.y;
    gsap.fromTo(bn, { opacity: 0, y: 36, scale: 0.92 }, { opacity: 1, y: 0, scale: 1, duration: 1.2, ease: 'expo.out', delay: 0.15 });
    tokens.forEach(function (tk, i) {
      var a = $('.tk__a', tk), svg = $('svg', tk);
      var b = tk.getBoundingClientRect();
      var dx = (r.left + ox) - (b.left + b.width / 2), dy = (r.top + oy) - (b.top + b.height / 2);
      gsap.set(tk, { opacity: 1 });
      gsap.fromTo(a, { x: dx, y: dy, scale: 0, rotation: gsap.utils.random(-120, 120) },
        { x: 0, y: 0, scale: 1, rotation: 0, duration: 1.5, ease: 'expo.out', delay: 0.55 + i * 0.09,
          onComplete: function () {
            // flutuação contínua, fase diferente por objeto
            gsap.to(svg, { y: gsap.utils.random(-9, -16), duration: gsap.utils.random(1.8, 2.8), ease: 'sine.inOut', yoyo: true, repeat: -1, delay: gsap.utils.random(0, 1) });
          } });
    });
  }
  launch();

  // paralaxe por profundidade + inclinação do palco: só mouse, só ponteiro
  if (fine) {
    var layers = $$('[data-d]', stage).map(function (el) {
      return { d: parseFloat(el.getAttribute('data-d')), qx: gsap.quickTo(el, 'x', { duration: 0.9, ease: 'power3.out' }), qy: gsap.quickTo(el, 'y', { duration: 0.9, ease: 'power3.out' }) };
    });
    var rotY = gsap.quickTo(stageIn, 'rotationY', { duration: 1, ease: 'power3.out' });
    var rotX = gsap.quickTo(stageIn, 'rotationX', { duration: 1, ease: 'power3.out' });
    gsap.set(stageIn, { transformPerspective: 1100 });
    var hero = $('.hero');
    hero.addEventListener('pointermove', function (e) {
      var r = stage.getBoundingClientRect();
      var nx = gsap.utils.clamp(-1, 1, (e.clientX - (r.left + r.width / 2)) / (window.innerWidth / 2));
      var ny = gsap.utils.clamp(-1, 1, (e.clientY - (r.top + r.height / 2)) / (window.innerHeight / 2));
      layers.forEach(function (l) { l.qx(-nx * 26 * l.d); l.qy(-ny * 18 * l.d); });
      rotY(nx * 7); rotX(-ny * 5);
    });
    hero.addEventListener('pointerleave', function () {
      layers.forEach(function (l) { l.qx(0); l.qy(0); }); rotY(0); rotX(0);
    });
  }
  // tocar/passar sobre um objeto: ele pula e gira
  tokens.forEach(function (tk) {
    var svg = $('svg', tk), busy = false;
    function pop() {
      if (busy) return; busy = true;
      gsap.timeline({ onComplete: function () { busy = false; } })
        .to(svg, { scale: 1.25, duration: 0.25, ease: 'back.out(3)' })
        .to(svg, { rotation: '+=360', duration: 0.8, ease: 'expo.out' }, 0)
        .to(svg, { scale: 1, duration: 0.5, ease: 'power3.out' }, 0.3);
    }
    if (!tk.classList.contains('tk--blur')) { svg.addEventListener('pointerenter', pop); svg.addEventListener('click', pop); }
  });

  // ---------- Títulos: palavras sobem da máscara ao entrar na tela ----------
  var ioH = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      if (!e.isIntersecting) return;
      ioH.unobserve(e.target);
      gsap.to(e.target._w, { yPercent: 0, duration: 1.1, ease: 'expo.out', stagger: 0.06 });
    });
  }, { rootMargin: '0px 0px -10% 0px' });
  $$('[data-split]').forEach(function (h) {
    h._w = Kit.maskWords(h);
    gsap.set(h._w, { yPercent: 115 });
    ioH.observe(h);
  });

  // ---------- Serviços: setas se "ligam" em sequência quando as cartas entram ----------
  var arrows = $$('.card__arrow');
  gsap.set(arrows, { scaleX: 0, transformOrigin: 'left center' });
  var ioA = new IntersectionObserver(function (entries) {
    if (!entries.some(function (e) { return e.isIntersecting; })) return;
    ioA.disconnect();
    gsap.to(arrows, { scaleX: 1, duration: 0.9, ease: 'expo.out', stagger: 0.25, delay: 0.5 });
  }, { rootMargin: '0px 0px -15% 0px' });
  var tri = $('#tri'); if (tri) ioA.observe(tri);

  // ---------- Quem somos: < DT > se monta (colchetes entram dos lados, DT sobe) ----------
  var mark = $('#mark');
  if (mark) {
    var bl = $('.about__br--l', mark), brr = $('.about__br--r', mark), dt = $('.about__dtin', mark);
    gsap.set(dt, { yPercent: 105 }); gsap.set(bl, { x: -70, opacity: 0 }); gsap.set(brr, { x: 70, opacity: 0 });
    var ioM = new IntersectionObserver(function (entries) {
      if (!entries.some(function (e) { return e.isIntersecting; })) return;
      ioM.disconnect();
      gsap.timeline()
        .to(dt, { yPercent: 0, duration: 1.2, ease: 'expo.out' }, 0)
        .to([bl, brr], { x: 0, opacity: 1, duration: 1.1, ease: 'expo.out' }, 0.15);
    }, { rootMargin: '0px 0px -15% 0px' });
    ioM.observe(mark);
    if (fine) {
      var mx = gsap.quickTo(mark, 'rotationY', { duration: 0.8, ease: 'power3.out' });
      var my = gsap.quickTo(mark, 'rotationX', { duration: 0.8, ease: 'power3.out' });
      var sec = $('#quem-somos');
      sec.addEventListener('pointermove', function (e) {
        var r = mark.getBoundingClientRect();
        mx(gsap.utils.clamp(-1, 1, (e.clientX - r.left - r.width / 2) / 400) * 14);
        my(-gsap.utils.clamp(-1, 1, (e.clientY - r.top - r.height / 2) / 300) * 10);
      });
      sec.addEventListener('pointerleave', function () { mx(0); my(0); });
    }
  }
})();
