/* Nomo — comportamento. Scroll nativo; animação por tempo, entrada na tela (uma vez), ponteiro e clique. Nada ligado ao scroll. */
(function () {
  var d = document.documentElement;
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var reduced = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  var curtain = $('#curtain');
  var dropCurtain = function () { if (curtain) { curtain.style.display = 'none'; } };

  // linha do tempo de cases (acordeão): o primeiro aberto; o resto fechado só se o JS rodar
  function accordion(animate) {
    var rows = $$('.lu__row');
    if (!rows.length) return;
    d.classList.add('acc-ready');
    var set = function (row, open) {
      row.classList.toggle('is-open', open);
      $('.lu__btn', row).setAttribute('aria-expanded', open ? 'true' : 'false');
    };
    rows.forEach(function (row, i) {
      set(row, i === 0);
      $('.lu__btn', row).addEventListener('click', function () {
        var willOpen = !row.classList.contains('is-open');
        rows.forEach(function (r) { set(r, r === row ? willOpen : false); });
        if (willOpen && animate && window.gsap) {
          window.gsap.fromTo($$('.lu__in img, .lu__tx > *', row), { opacity: 0, y: 18 }, { opacity: 1, y: 0, duration: 0.7, ease: 'expo.out', stagger: 0.06, delay: 0.1, clearProps: 'transform,opacity' });
        }
      });
    });
  }

  if (!window.Kit) { d.classList.add('anim-fail'); dropCurtain(); accordion(false); return; }
  if (window.gsap) window.gsap.config({ nullTargetWarn: false });

  // base do kit (revelações por entrada, inclinação dos ingressos, imagem que segue o cursor, formulário que não envia)
  Kit.init({ h1: '#__sem-h1', entrance: '[data-sem-entrada]', reveal: '[data-reveal]', tilt: '[data-tilt]', form: '#form', msg: '#formMsg', peek: { rows: '.lu__row', el: '#peek' } });

  var animate = !d.classList.contains('anim-fail') && window.gsap;
  accordion(!!animate);
  if (!animate) { dropCurtain(); return; }

  var gsap = window.gsap;
  setTimeout(dropCurtain, 4500); // rede de segurança: a cortina nunca fica na frente do conteúdo

  try {
    var h1 = $('#h1');
    var words = h1 ? Kit.maskWords(h1) : [];
    gsap.set(words, { yPercent: 115 });
    if (h1) h1.style.visibility = 'visible';

    var cards = $$('.fan__c'), badge = $('.badge'), star = $('#star');
    var starIdle = null;
    var tl = gsap.timeline({ onComplete: idle });

    // 1) abertura: a cortina se abre de dentro para fora
    tl.to('.curtain__l', { xPercent: -101, duration: 1.1, ease: 'expo.inOut' }, 0.15)
      .to('.curtain__r', { xPercent: 101, duration: 1.1, ease: 'expo.inOut', onComplete: dropCurtain }, 0.15);
    // 2) o palco acende: título por palavras, texto, fotos, credencial e mascote
    tl.to(words, { yPercent: 0, duration: 1.1, ease: 'expo.out', stagger: 0.07 }, 0.8)
      .fromTo('[data-in]', { opacity: 0, y: 18 }, { opacity: 1, y: 0, duration: 0.7, ease: 'power3.out', stagger: 0.08, clearProps: 'transform' }, 0.95)
      .from(cards, { y: 90, scale: 0.9, duration: 1.2, ease: 'expo.out', stagger: 0.12 }, 0.85)
      .from(badge, { y: -140, rotation: 22, transformOrigin: '50% 0', duration: 1.3, ease: 'elastic.out(1,0.55)' }, 1.15)
      .from(star, { scale: 0, rotation: -140, duration: 1.4, ease: 'elastic.out(1,0.5)' }, 1.2);

    function idle() {
      cards.forEach(function (c, i) { gsap.to(c, { yPercent: i % 2 ? -2.5 : 2.5, duration: 2.6 + i * 0.4, ease: 'sine.inOut', yoyo: true, repeat: -1 }); });
      starIdle = gsap.to(star, { rotation: 7, duration: 1.8, ease: 'sine.inOut', yoyo: true, repeat: -1 });
    }

    // mouse: as camadas do leque se movem em profundidades diferentes
    if (matchMedia('(pointer: fine)').matches) {
      var hero = $('.hero'), layers = $$('[data-depth]', hero).map(function (el) {
        var k = parseFloat(el.getAttribute('data-depth')) * 7;
        return { k: k, x: gsap.quickTo(el, 'x', { duration: 0.9, ease: 'power3.out' }), y: gsap.quickTo(el, 'y', { duration: 0.9, ease: 'power3.out' }) };
      });
      hero.addEventListener('pointermove', function (e) {
        var r = hero.getBoundingClientRect(), nx = (e.clientX - r.left) / r.width - 0.5, ny = (e.clientY - r.top) / r.height - 0.5;
        layers.forEach(function (l) { l.x(-nx * l.k * 2); l.y(-ny * l.k * 1.6); });
      });
      hero.addEventListener('pointerleave', function () { layers.forEach(function (l) { l.x(0); l.y(0); }); });
    }

    // clique/toque no mascote: giro com mola
    star.addEventListener('pointerdown', function () {
      gsap.fromTo(star, { scale: 0.8 }, { scale: 1, duration: 1, ease: 'elastic.out(1,0.4)', overwrite: 'auto' });
      if (starIdle) starIdle.pause();
      gsap.to(star, { rotation: '+=360', duration: 0.9, ease: 'expo.out', overwrite: 'auto', onComplete: function () { gsap.set(star, { rotation: 0 }); if (starIdle) starIdle.restart(true); } });
    });
  } catch (err) {
    d.classList.add('anim-fail');
    dropCurtain();
  }
})();
