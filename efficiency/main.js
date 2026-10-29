/* Efficiency — comportamento. Scroll nativo; animação por entrada, tempo, ponteiro e clique. Nada ligado ao scroll. */
(function () {
  var d = document.documentElement;
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var reduced = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;

  // base: título por palavras, revelações, inclinação dos cards (só mouse), formulário que não envia
  if (window.Kit) Kit.init({ h1: '#h1', entrance: '[data-in]', reveal: '[data-reveal]', tilt: '[data-tilt]', form: '#form', msg: '#formMsg' });
  var gsap = !reduced && window.gsap;

  // ---------- jornada: abas ----------
  var jr = $('#jr');
  if (jr) {
    d.classList.add('tabs-ready');
    var tabs = $$('.jr__tab', jr), panels = $$('.jr__panel', jr);
    var show = function (i, focus) {
      tabs.forEach(function (t, k) {
        var on = k === i;
        t.classList.toggle('is-on', on);
        t.setAttribute('aria-selected', on ? 'true' : 'false');
        t.tabIndex = on ? 0 : -1;
      });
      panels.forEach(function (p, k) { p.classList.toggle('is-on', k === i); });
      if (focus) tabs[i].focus();
      if (gsap) {
        var p = panels[i];
        gsap.fromTo([$('.jr__q', p), $('.jr__t', p)], { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.7, ease: 'expo.out', stagger: 0.08, clearProps: 'transform' });
        gsap.fromTo($$('.jr__ch li', p), { opacity: 0, y: 12, scale: 0.92 }, { opacity: 1, y: 0, scale: 1, duration: 0.55, ease: 'back.out(1.6)', stagger: 0.07, delay: 0.15, clearProps: 'transform' });
      }
    };
    tabs.forEach(function (t, i) {
      t.addEventListener('click', function () { show(i); });
      t.addEventListener('keydown', function (e) {
        var k = e.key, n = tabs.length;
        if (k === 'ArrowRight' || k === 'ArrowDown') { e.preventDefault(); show((i + 1) % n, true); }
        else if (k === 'ArrowLeft' || k === 'ArrowUp') { e.preventDefault(); show((i + n - 1) % n, true); }
        else if (k === 'Home') { e.preventDefault(); show(0, true); }
        else if (k === 'End') { e.preventDefault(); show(n - 1, true); }
      });
    });
  }

  // ---------- hero: a trilha da jornada ----------
  var route = $('#route');
  if (!route) return;
  var nodes = $$('.node', route);
  var fr = [0, 1 / 3, 2 / 3, 1];
  if (!gsap) { nodes.forEach(function (n) { n.classList.add('is-on'); }); return; }

  var path = $('#routePath'), dot = $('#routeDot'), L = path.getTotalLength();
  var chips = $$('.chip', route), dots = $$('.node__dot', route), txts = $$('.node__txt', route);
  var st = { p: 0 }, reached = -1;
  path.style.strokeDasharray = '1 1';
  path.style.strokeDashoffset = '1';
  gsap.set(dot, { opacity: 0 });
  gsap.set(dots, { scale: 0 });
  gsap.set(txts, { opacity: 0, y: 8 });
  gsap.set(chips, { opacity: 0 });

  var reach = function (i) {
    nodes[i].classList.add('is-on');
    gsap.to(dots[i], { scale: 1, duration: 0.7, ease: 'back.out(2.2)', overwrite: 'auto' });
    gsap.to(txts[i], { opacity: 1, y: 0, duration: 0.6, ease: 'power3.out', overwrite: 'auto' });
  };
  var setP = function (p, draw) {
    var pt = path.getPointAtLength(p * L);
    dot.setAttribute('cx', pt.x); dot.setAttribute('cy', pt.y);
    if (draw) path.style.strokeDashoffset = String(1 - p);
    for (var i = 0; i < fr.length; i++) if (p >= fr[i] - 0.004 && i > reached) { reached = i; reach(i); }
  };

  var loop;
  var tl = gsap.timeline({ delay: 0.25 });
  tl.to(dot, { opacity: 1, duration: 0.3 }, 0)
    .to(st, { p: 1, duration: 2.4, ease: 'power2.inOut', onUpdate: function () { setP(st.p, true); } }, 0)
    .to(chips, { opacity: 1, duration: 0.8, ease: 'power2.out', stagger: 0.12 }, 0.9)
    .add(function () {
      // depois da abertura, um ponto de luz percorre a trilha de tempos em tempos
      loop = gsap.timeline({ repeat: -1, repeatDelay: 1.4 });
      loop.call(function () { reached = -1; nodes.forEach(function (n) { n.classList.remove('is-on'); }); })
          .fromTo(dot, { opacity: 0 }, { opacity: 1, duration: 0.3 }, 0)
          .fromTo(st, { p: 0 }, { p: 1, duration: 4.5, ease: 'sine.inOut', onUpdate: function () { setP(st.p, false); } }, 0)
          .to(dot, { opacity: 0, duration: 0.5 }, '-=0.5');
      new IntersectionObserver(function (en) { en[0].isIntersecting ? loop.resume() : loop.pause(); }).observe(route);
    });

  // profundidade com o ponteiro (só mouse): chips, trilha e nós em camadas
  if (matchMedia('(pointer: fine)').matches) {
    var layer = $('.route__layer', route), svg = $('.route__svg', route), nd = $('.route__nodes', route), glow = $('.route__glow', route);
    var mk = function (el, k) { return { x: gsap.quickTo(el, 'x', { duration: 0.9, ease: 'power3.out' }), y: gsap.quickTo(el, 'y', { duration: 0.9, ease: 'power3.out' }), k: k }; };
    var ls = [mk(layer, 26), mk(svg, 10), mk(nd, 10), mk(glow, -16)];
    route.addEventListener('pointermove', function (e) {
      var r = route.getBoundingClientRect(), nx = (e.clientX - r.left) / r.width - 0.5, ny = (e.clientY - r.top) / r.height - 0.5;
      ls.forEach(function (o) { o.x(nx * o.k); o.y(ny * o.k); });
    });
    route.addEventListener('pointerleave', function () { ls.forEach(function (o) { o.x(0); o.y(0); }); });
  }
})();
