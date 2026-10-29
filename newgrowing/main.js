/* NewGrowing: comportamento. Scroll nativo; animação por entrada na tela (uma vez), tempo e ponteiro. Nada ligado ao scroll. */
(function () {
  var d = document.documentElement;
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var reduced = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  var fine = window.matchMedia && matchMedia('(pointer: fine)').matches;

  // base: título por palavras, revelações, inclinação (só mouse), imagem que segue o cursor na lista, formulário que não envia
  if (window.Kit) Kit.init({ h1: '#h1', entrance: '[data-in]', reveal: '[data-reveal]', tilt: '[data-tilt]', peek: { rows: '.row', el: '#peek' }, form: '#form', msg: '#formMsg' });
  else d.classList.add('anim-fail');

  // ---------- campo de pontos (a marca é feita de pontos que crescem) ----------
  // Um único canvas 2D em vez de centenas de elementos: só redesenha enquanto a onda/ponteiro age.
  var hero = $('.hero'), field = $('#field');
  var cv = null, ctx = null, dots = [], GAP = 46, dpr = 1, W = 0, H = 0, raf = 0, focus = { x: -999, y: -999 }, ease = 0;

  function build() {
    if (!field || !hero) return;
    if (!cv) { cv = document.createElement('canvas'); cv.style.cssText = 'position:absolute;inset:0;width:100%;height:100%'; field.appendChild(cv); ctx = cv.getContext('2d'); }
    W = hero.clientWidth; H = hero.clientHeight;
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr);
    var gap = W < 700 ? 38 : GAP, cols = Math.ceil(W / gap) + 1, rows = Math.ceil(H / gap) + 1;
    var offX = (W - (cols - 1) * gap) / 2, offY = (H - (rows - 1) * gap) / 2;
    dots = [];
    for (var r = 0; r < rows; r++) for (var c = 0; c < cols; c++) dots.push({ x: offX + c * gap, y: offY + r * gap });
    field.classList.add('has-dots');
    draw();
  }

  // cada ponto cresce conforme a distância ao foco (ponteiro ou onda); passa de um certo tamanho, acende em verde
  function draw() {
    raf = 0;
    if (!ctx) return;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, W, H);
    var R = 120, R2 = R * R, fx = focus.x, fy = focus.y;
    for (var k = 0; k < dots.length; k++) {
      var p = dots[k], dx = p.x - fx, dy = p.y - fy, q = dx * dx + dy * dy;
      var s = q > R2 * 4 ? 1 : 1 + 3.6 * Math.exp(-q / R2);
      ctx.fillStyle = s > 2.1 ? '#2fe97c' : 'rgba(255,255,255,.26)';
      ctx.beginPath(); ctx.arc(p.x, p.y, 2.5 * s, 0, 6.2832); ctx.fill();
    }
  }
  function schedule() { if (!raf) raf = requestAnimationFrame(draw); }
  function setFocus(x, y) { focus.x = x; focus.y = y; schedule(); }

  if (!reduced && field && hero) {
    var start = function () {
      build();
      var rz; window.addEventListener('resize', function () { clearTimeout(rz); rz = setTimeout(build, 200); });
      var local = function (e) { var r = hero.getBoundingClientRect(); setFocus(e.clientX - r.left, e.clientY - r.top); };
      hero.addEventListener('pointermove', local);
      hero.addEventListener('pointerdown', local);
      hero.addEventListener('pointerleave', function () { setFocus(-999, -999); });
      // abertura: uma onda de crescimento atravessa o campo (só tempo; no toque também vale como convite)
      if (window.gsap) {
        var o = { t: 0 };
        window.gsap.to(o, { t: 1, duration: 3.4, ease: 'power2.inOut', delay: 0.3, onUpdate: function () {
          setFocus(W * (-0.1 + 1.2 * o.t), H * (0.5 + 0.32 * Math.sin(o.t * Math.PI * 2.2)));
        }, onComplete: function () { setFocus(-999, -999); } });
      }
    };
    if (document.readyState === 'complete') start(); else window.addEventListener('load', start);
  }

  var gsap = !reduced && window.gsap;
  if (!gsap) return;

  try {
    // ---------- hero: capas flutuam em profundidade ----------
    var cvs = $$('.cv');
    if (cvs.length) {
      gsap.set(cvs, { opacity: 0, y: 70 });
      gsap.to(cvs, { opacity: 1, y: 0, duration: 1.4, ease: 'expo.out', stagger: 0.14, delay: 0.35, onComplete: function () {
        // respiração lenta (só tempo): inclinação mínima, sem tocar em x/y do parallax
        cvs.forEach(function (c, i) {
          var r = gsap.getProperty(c, 'rotation');
          gsap.to(c, { rotation: r + (i % 2 ? -1.6 : 1.6), duration: 3.6 + i * 0.7, ease: 'sine.inOut', yoyo: true, repeat: -1 });
        });
      } });
      if (fine && hero) {
        var qs = cvs.map(function (c) {
          var k = parseFloat(c.getAttribute('data-depth')) || 20;
          return { k: k, x: gsap.quickTo(c, 'x', { duration: 0.9, ease: 'power3.out' }), y: gsap.quickTo(c, 'y', { duration: 0.9, ease: 'power3.out' }) };
        });
        hero.addEventListener('pointermove', function (e) {
          var r = hero.getBoundingClientRect();
          var nx = (e.clientX - r.left) / r.width - 0.5, ny = (e.clientY - r.top) / r.height - 0.5;
          qs.forEach(function (q) { q.x(nx * q.k); q.y(ny * q.k); });
        });
      }
    }

    // ---------- cartões do jardim: abrem por máscara ao entrar na tela ----------
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        io.unobserve(en.target);
        var m = en.target, img = $('img', m), c = m.parentNode.querySelector('.card__c');
        gsap.fromTo(m, { clipPath: 'inset(0 0 100% 0)' }, { clipPath: 'inset(0 0 0% 0)', duration: 1.15, ease: 'expo.out', clearProps: 'clipPath' });
        if (img) gsap.fromTo(img, { scale: 1.3 }, { scale: 1, duration: 1.5, ease: 'expo.out', clearProps: 'transform' });
        if (c) gsap.fromTo(c, { opacity: 0, y: 14 }, { opacity: 1, y: 0, duration: 0.7, ease: 'power3.out', delay: 0.25, clearProps: 'all' });
      });
    }, { rootMargin: '0px 0px -10% 0px' });
    $$('.card__m').forEach(function (m) { io.observe(m); });

    // ---------- método: a haste cresce e cada ponto brota ----------
    var stem = $('#stem');
    if (stem) {
      var io2 = new IntersectionObserver(function (entries) {
        if (!entries[0].isIntersecting) return;
        io2.disconnect();
        var steps = $$('.step', stem), line = { v: 0 };
        gsap.to(line, { v: 1, duration: 2.2, ease: 'power2.inOut', onUpdate: function () { stem.style.setProperty('--stem', line.v); } });
        steps.forEach(function (s, i) { gsap.delayedCall(0.2 + i * 0.85, function () { s.style.setProperty('--node', 1); }); });
      }, { rootMargin: '0px 0px -20% 0px' });
      io2.observe(stem);
    }
  } catch (err) { d.classList.add('anim-fail'); }
})();
