/* Agência Logar: abertura "entrar" (círculos que se expandem do G, pessoa e 3D em camadas, chip de login), profundidade por ponteiro, cards que inclinam. Scroll nativo; nada ligado ao scroll. */
Kit.init({ h1: '#h1', entrance: '[data-in]', reveal: '[data-reveal]', form: '#form', msg: '#formMsg', tilt: '[data-tilt]' });

(function () {
  if (Kit.reduced || !window.gsap) return;
  var gsap = window.gsap;
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };

  // 1) abertura: círculos concêntricos nascem do centro (como o fundo do site atual), depois o palco entra em camadas
  var tl = gsap.timeline({ delay: 0.1 });
  tl.fromTo('.rings__g circle', { scale: 0.2, opacity: 0 }, { scale: 1, opacity: 1, duration: 1.6, ease: 'expo.out', stagger: 0.07 }, 0)
    .fromTo('.stage__disc', { scale: 0.55, opacity: 0 }, { scale: 1, opacity: 1, duration: 1.2, ease: 'expo.out' }, 0.15)
    .fromTo('.dp--man', { y: 50, opacity: 0 }, { y: 0, opacity: 1, duration: 1.1, ease: 'expo.out' }, 0.35)
    .fromTo(['.dp--lap', '.dp--like'], { y: 30, scale: 0.6, opacity: 0 }, { y: 0, scale: 1, opacity: 1, duration: 1, ease: 'back.out(1.6)', stagger: 0.14 }, 0.6)
    .fromTo('.login', { x: -24, opacity: 0 }, { x: 0, opacity: 1, duration: 0.7, ease: 'power3.out' }, 1.0);

  // 2) chip "sua empresa · logada ✓": digita o nome e confirma o login
  var who = $('#who'), st = $('#st'), dot = $('.login__dot');
  if (who && st) {
    var full = who.textContent, o = { n: 0 };
    who.textContent = ''; gsap.set(st, { opacity: 0, x: -6 });
    tl.to(o, { n: full.length, duration: 0.9, ease: 'none', onUpdate: function () { who.textContent = full.slice(0, Math.round(o.n)); } }, 1.1)
      .to(st, { opacity: 1, x: 0, duration: 0.45, ease: 'power3.out' }, 2.1)
      .fromTo(dot, { scale: 1.8 }, { scale: 1, duration: 0.6, ease: 'elastic.out(1,.5)' }, 2.1)
      .fromTo('.login', { boxShadow: '0 0 0 0 rgba(51,204,153,.7)' }, { boxShadow: '0 0 0 14px rgba(51,204,153,0)', duration: 1, ease: 'power2.out' }, 2.1);
  }

  // 3) tempo: pulso que sai do G e flutuação suave dos 3D (pausa quando o hero sai da tela)
  var idle = gsap.timeline({ paused: true });
  idle.fromTo('#pulse', { scale: 0.15, opacity: 0.55 }, { scale: 1, opacity: 0, duration: 4.2, ease: 'power1.out', repeat: -1, repeatDelay: 0.4 }, 0);
  $$('.lap,.like,.why__lap,.fin__like').forEach(function (el, i) {
    idle.to(el, { y: i % 2 ? 9 : -9, rotation: i % 2 ? -2 : 2, duration: 3.2 + i * 0.5, ease: 'sine.inOut', yoyo: true, repeat: -1 }, 0);
  });
  tl.add(function () { idle.play(); }, 1.2);
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(function (es) { es.forEach(function (e) { if (tl.progress() === 1 || tl.time() > 1.2) e.isIntersecting ? idle.play() : idle.pause(); }); }).observe($('#top'));
  }

  // 4) profundidade por ponteiro (só mouse): cada camada .dp anda em uma proporção diferente
  if (matchMedia('(pointer: fine)').matches) {
    [['#top', '.hero'], ['#diferenciais'], ['#contato']].forEach(function (g) {
      var sec = $(g[0]); if (!sec) return;
      var layers = $$('.dp', sec).map(function (el) {
        return { d: parseFloat(el.getAttribute('data-depth')) || 10, x: gsap.quickTo(el, 'x', { duration: 0.9, ease: 'power3.out' }), y: gsap.quickTo(el, 'y', { duration: 0.9, ease: 'power3.out' }) };
      });
      sec.addEventListener('pointermove', function (e) {
        var r = sec.getBoundingClientRect(), nx = (e.clientX - r.left) / r.width - 0.5, ny = (e.clientY - r.top) / r.height - 0.5;
        layers.forEach(function (l) { l.x(-nx * l.d * 1.6); l.y(-ny * l.d * 1.2); });
      });
      sec.addEventListener('pointerleave', function () { layers.forEach(function (l) { l.x(0); l.y(0); }); });
    });
  }
})();
