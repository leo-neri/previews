/* Kit de comportamento (global Kit). Scroll nativo SEMPRE: animações disparam por entrada na tela (uma vez), tempo ou ponteiro.
   Kit.init({ h1:'#h1', entrance:'[data-in]', reveal:'[data-reveal]', form:'#form', msg:'#formMsg',
              tilt:'[data-tilt]', peek:{ rows:'.row', el:'#peek' },
              scene:{ stage:'#stage', canvas:'#gl', tag:'#tag', items:[...], mode:'orbit'|'drift', size:1.7 } }) */
window.Kit = (function () {
  var d = document.documentElement;
  var reduced = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };

  function maskWords(h1) {
    var words = [];
    (function split(node) {
      Array.prototype.slice.call(node.childNodes).forEach(function (n) {
        if (n.nodeType === 3) {
          var frag = document.createDocumentFragment();
          n.textContent.split(/(\s+)/).forEach(function (p) {
            if (!p) return;
            if (/^\s+$/.test(p)) { frag.appendChild(document.createTextNode(p)); return; }
            var o = document.createElement('span'); o.className = 'mw';
            var i = document.createElement('span'); i.className = 'mw__in'; i.textContent = p;
            o.appendChild(i); words.push(i); frag.appendChild(o);
          });
          n.replaceWith(frag);
        } else if (n.nodeType === 1) split(n);
      });
    })(h1);
    return words;
  }

  function init(o) {
    o = o || {};
    var form = $(o.form || '#form'), msg = $(o.msg || '#formMsg');
    if (form) form.addEventListener('submit', function (e) { e.preventDefault(); if (msg) msg.hidden = false; });

    if (o.scene) {
      var run = function () {
        var s = o.scene, stage = $(s.stage || '#stage');
        if (!stage) return;
        import(s.module || '../_kit/float.js').then(function (m) {
          return m.initFloat({ stage: stage, canvas: $(s.canvas || '#gl'), tag: $(s.tag || '#tag'), items: s.items, mode: s.mode || 'orbit', size: s.size || 1.7, accent: s.accent, violet: s.violet, reduce: reduced });
        }).catch(function () {});
      };
      var idle = window.requestIdleCallback || function (f) { setTimeout(f, 200); };
      if (document.readyState === 'complete') idle(run); else window.addEventListener('load', function () { idle(run); });
    }

    if (reduced || !window.gsap) { d.classList.add('anim-fail'); return; }
    clearTimeout(window.__af);
    var gsap = window.gsap;

    var h1 = $(o.h1 || '#h1'), words = [];
    if (h1) { words = maskWords(h1); gsap.set(words, { yPercent: 115 }); h1.style.visibility = 'visible'; }
    var tl = gsap.timeline({ delay: 0.05 });
    if (words.length) tl.to(words, { yPercent: 0, duration: 1.1, ease: 'expo.out', stagger: 0.07 }, 0);
    tl.fromTo(o.entrance || '[data-in]', { opacity: 0, y: 18 }, { opacity: 1, y: 0, duration: 0.7, ease: 'power3.out', stagger: 0.08, clearProps: 'transform' }, 0.2);

    var io = new IntersectionObserver(function (entries) {
      var vis = entries.filter(function (e) { return e.isIntersecting; }).map(function (e) { io.unobserve(e.target); return e.target; });
      if (vis.length) gsap.fromTo(vis, { opacity: 0, y: 22 }, { opacity: 1, y: 0, duration: 0.7, ease: 'power3.out', stagger: 0.07, clearProps: 'transform' });
    }, { rootMargin: '0px 0px -8% 0px' });
    $$(o.reveal || '[data-reveal]').forEach(function (el) { io.observe(el); });

    var fine = matchMedia('(pointer: fine)').matches;
    // inclinação de cards seguindo o ponteiro (só mouse)
    if (fine && o.tilt) $$(o.tilt).forEach(function (card) {
      card.addEventListener('pointermove', function (e) {
        var r = card.getBoundingClientRect(), x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height;
        gsap.to(card, { rotationX: (0.5 - y) * 8, rotationY: (x - 0.5) * 10, transformPerspective: 800, duration: 0.5, ease: 'power3.out', overwrite: 'auto' });
        card.style.setProperty('--gx', (x * 100) + '%'); card.style.setProperty('--gy', (y * 100) + '%');
      });
      card.addEventListener('pointerleave', function () { gsap.to(card, { rotationX: 0, rotationY: 0, duration: 0.9, ease: 'elastic.out(1,0.55)', overwrite: 'auto' }); });
    });
    // imagem que segue o cursor sobre linhas de lista (só mouse, só telas largas)
    if (fine && o.peek && matchMedia('(min-width: 861px)').matches) {
      var peek = $(o.peek.el || '#peek'), pimg = peek && $('img', peek);
      if (peek && pimg) {
        var qx = gsap.quickTo(peek, 'x', { duration: 0.5, ease: 'power3.out' }), qy = gsap.quickTo(peek, 'y', { duration: 0.5, ease: 'power3.out' }), qr = gsap.quickTo(peek, 'rotation', { duration: 0.6, ease: 'power3.out' });
        var lastX = 0, shown = false;
        peek.style.left = '0'; peek.style.top = '0'; gsap.set(peek, { xPercent: -50, yPercent: -50 });
        $$(o.peek.rows || '.row').forEach(function (row) {
          row.addEventListener('pointerenter', function (e) {
            var s = row.getAttribute('data-img'); if (!s) return; pimg.src = s;
            if (!shown) { gsap.set(peek, { x: e.clientX + 120, y: e.clientY, scale: 0.6 }); shown = true; }
            gsap.to(peek, { opacity: 1, scale: 1, duration: 0.45, ease: 'expo.out', overwrite: 'auto' });
          });
          row.addEventListener('pointermove', function (e) { qx(e.clientX + 140); qy(e.clientY); qr(gsap.utils.clamp(-14, 14, (e.clientX - lastX) * 0.8)); lastX = e.clientX; });
          row.addEventListener('pointerleave', function () { shown = false; gsap.to(peek, { opacity: 0, scale: 0.7, duration: 0.3, ease: 'power2.in', overwrite: 'auto' }); });
        });
      }
    }
  }
  return { init: init, maskWords: maskWords, reduced: reduced };
})();
