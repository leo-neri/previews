/* oito™ — scroll nativo; movimento por entrada na tela, tempo e ponteiro. O 8 se monta no carregamento e as pílulas reagem ao cursor/toque. */
(function () {
  if (window.Kit) Kit.init({ h1: '#h1', entrance: '[data-in]', reveal: '[data-reveal]', form: '#form', msg: '#formMsg', tilt: '[data-tilt]' });
  var gsap = window.gsap;
  if (!gsap || (window.Kit && Kit.reduced)) return;
  var $ = function (s) { return document.querySelector(s); };
  var a = $('.eight__p--a'), b = $('.eight__p--b'), tm = $('.eight__tm');
  if (!a || !b) return;
  var ia = a.querySelector('img'), ib = b.querySelector('img');

  // assinatura: duas pílulas chegam de lados opostos e se encaixam num 8; a foto dentro de cada uma respira
  var tl = gsap.timeline({ delay: 0.15 });
  tl.fromTo(a, { yPercent: -90, xPercent: -35, rotation: -14, opacity: 0, scale: 0.7 }, { yPercent: 0, xPercent: 0, rotation: 0, opacity: 1, scale: 1, duration: 1.4, ease: 'expo.out' }, 0)
    .fromTo(b, { yPercent: 90, xPercent: 35, rotation: 14, opacity: 0, scale: 0.7 }, { yPercent: 0, xPercent: 0, rotation: 0, opacity: 1, scale: 1, duration: 1.4, ease: 'expo.out' }, 0.12)
    .fromTo([ia, ib], { scale: 1.35 }, { scale: 1, duration: 1.8, ease: 'expo.out' }, 0)
    .to(tm, { opacity: 1, duration: 0.5 }, 1);
  tl.add(function () {
    gsap.to(ia, { scale: 1.06, x: -6, duration: 9, ease: 'sine.inOut', yoyo: true, repeat: -1 });
    gsap.to(ib, { scale: 1.06, x: 6, duration: 11, ease: 'sine.inOut', yoyo: true, repeat: -1 });
  }, 1.6);

  // ponteiro/toque: as pílulas se afastam e giram em sentidos opostos (profundidade)
  var hero = $('.hero'), cl = gsap.utils.clamp(-1, 1);
  var o = { duration: 0.9, ease: 'power3.out' };
  var ax = gsap.quickTo(a, 'x', o), bx = gsap.quickTo(b, 'x', o);
  var ar = gsap.quickTo(a, 'rotation', o), br = gsap.quickTo(b, 'rotation', o);
  var ay = gsap.quickTo(a, 'y', o), by = gsap.quickTo(b, 'y', o);
  var armed = false;
  tl.eventCallback('onComplete', function () { armed = true; });
  hero.addEventListener('pointermove', function (e) {
    if (!armed) return;
    var r = hero.getBoundingClientRect();
    var nx = cl(((e.clientX - r.left) / r.width - 0.5) * 2), ny = cl(((e.clientY - r.top) / r.height - 0.5) * 2);
    ax(nx * 26); bx(-nx * 26); ar(nx * 5); br(-nx * 5); ay(ny * -10); by(ny * 10);
  });
  hero.addEventListener('pointerleave', function () { ax(0); bx(0); ar(0); br(0); ay(0); by(0); });
})();
