/* RAC Social — comportamento da página. Princípio: scroll nativo, animação por entrada na tela/tempo/ponteiro, nunca ligada ao scroll. */
(function () {
  var d = document.documentElement;
  var reduced = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };

  // formulário: nunca envia
  var form = $('#form'), msg = $('#formMsg');
  if (form) form.addEventListener('submit', function (e) { e.preventDefault(); msg.hidden = false; });

  // cena 3D (carrega depois do primeiro desenho; se falhar, fica a composição estática)
  function loadScene() {
    var stage = $('#stage');
    var items = $$('#fb img').map(function (img) { return { src: img.getAttribute('src'), label: img.alt, href: '#solucoes' }; });
    import('./scene.js').then(function (m) {
      return m.initScene({ stage: stage, canvas: $('#gl'), tag: $('#tag'), items: items, reduce: reduced });
    }).catch(function () {});
  }
  var idle = window.requestIdleCallback || function (f) { setTimeout(f, 200); };
  if (location.search.indexOf('noscene') < 0) window.addEventListener('load', function () { idle(loadScene); });

  if (reduced || !window.gsap) { d.classList.add('anim-fail'); return; }
  clearTimeout(window.__af);
  var gsap = window.gsap;

  // título: palavras sobem de uma máscara
  var h1 = $('#h1'), words = [];
  if (h1) {
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
    gsap.set(words, { yPercent: 115 });
    h1.style.visibility = 'visible';
  }
  var tl = gsap.timeline({ delay: 0.05 });
  tl.to(words, { yPercent: 0, duration: 1.1, ease: 'expo.out', stagger: 0.07 }, 0)
    .fromTo('[data-in]', { opacity: 0, y: 18 }, { opacity: 1, y: 0, duration: 0.7, ease: 'power3.out', stagger: 0.08, clearProps: 'transform' }, 0.2);

  // revelações: uma vez, quando entram na tela (IntersectionObserver, sem ScrollTrigger)
  var io = new IntersectionObserver(function (entries) {
    var vis = entries.filter(function (e) { return e.isIntersecting; }).map(function (e) { io.unobserve(e.target); return e.target; });
    if (vis.length) gsap.fromTo(vis, { opacity: 0, y: 22 }, { opacity: 1, y: 0, duration: 0.7, ease: 'power3.out', stagger: 0.07, clearProps: 'transform' });
  }, { rootMargin: '0px 0px -8% 0px' });
  $$('[data-reveal]').forEach(function (el) { io.observe(el); });

  // serviços: objeto 3D acompanha o cursor (só com mouse)
  if (matchMedia('(pointer: fine)').matches && matchMedia('(min-width: 861px)').matches) {
    var peek = $('#peek'), pimg = $('img', peek);
    var qx = gsap.quickTo(peek, 'x', { duration: 0.5, ease: 'power3.out' });
    var qy = gsap.quickTo(peek, 'y', { duration: 0.5, ease: 'power3.out' });
    var qr = gsap.quickTo(peek, 'rotation', { duration: 0.6, ease: 'power3.out' });
    var lastX = 0, shown = false;
    peek.style.left = '0'; peek.style.top = '0'; gsap.set(peek, { xPercent: -50, yPercent: -50 });
    $$('.row').forEach(function (row) {
      row.addEventListener('pointerenter', function (e) {
        pimg.src = row.getAttribute('data-img'); pimg.className = row.getAttribute('data-cls') || '';
        if (!shown) { gsap.set(peek, { x: e.clientX + 120, y: e.clientY, scale: 0.6 }); shown = true; }
        gsap.to(peek, { opacity: 1, scale: 1, duration: 0.45, ease: 'expo.out', overwrite: 'auto' });
      });
      row.addEventListener('pointermove', function (e) {
        qx(e.clientX + 140); qy(e.clientY);
        qr(gsap.utils.clamp(-14, 14, (e.clientX - lastX) * 0.8)); lastX = e.clientX;
      });
      row.addEventListener('pointerleave', function () {
        shown = false;
        gsap.to(peek, { opacity: 0, scale: 0.7, duration: 0.3, ease: 'power2.in', overwrite: 'auto' });
      });
    });
  }
})();
