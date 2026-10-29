// Kit — campo flutuante em perspectiva (canvas 2D, ~5 KB; sem WebGL, sem custo de parse no celular).
// Objetos = imagens da marca (padrão), palavras (kind "text") ou formas (kind "shape").
// Movimento por tempo, mouse e arrasto horizontal (touch-action: pan-y). NADA depende do scroll.
// initFloat({ stage, canvas, tag, items, mode:'orbit'|'drift', reduce, size, accent, violet })
// item: { src, label?, href?, scale?, x?, y?, z?, noGlow? } | { kind:'text', text, font?, weight?, color?, bg?, stroke? } | { kind:'shape', shape:'ring'|'blob', color, color2 }
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));

function glow(rgb) {
  const c = document.createElement('canvas');
  c.width = c.height = 128;
  const g = c.getContext('2d');
  const gr = g.createRadialGradient(64, 64, 0, 64, 64, 64);
  gr.addColorStop(0, `rgba(${rgb},.55)`);
  gr.addColorStop(1, `rgba(${rgb},0)`);
  g.fillStyle = gr;
  g.fillRect(0, 0, 128, 128);
  return c;
}

function textSprite(it) {
  const c = document.createElement('canvas');
  const g = c.getContext('2d');
  const size = it.size || 96;
  const font = `${it.weight || 700} ${size}px ${it.font || 'system-ui, sans-serif'}`;
  g.font = font;
  const w = Math.ceil(g.measureText(it.text).width) + 48;
  const h = Math.round(size * 1.5);
  c.width = w;
  c.height = h;
  g.font = font;
  g.textBaseline = 'middle';
  if (it.bg) { g.fillStyle = it.bg; g.beginPath(); g.roundRect(0, 0, w, h, h / 2); g.fill(); }
  if (it.stroke) { g.strokeStyle = it.stroke; g.lineWidth = 3; g.beginPath(); g.roundRect(2, 2, w - 4, h - 4, h / 2); g.stroke(); }
  g.fillStyle = it.color || '#fff';
  g.fillText(it.text, 24, h / 2 + 2);
  return c;
}

function shapeSprite(it) {
  const c = document.createElement('canvas');
  c.width = c.height = 256;
  const g = c.getContext('2d');
  if (it.shape === 'ring') {
    g.strokeStyle = it.color || '#fff';
    g.lineWidth = 18;
    g.beginPath(); g.arc(128, 128, 100, 0, 7); g.stroke();
  } else {
    const gr = g.createRadialGradient(100, 90, 10, 128, 128, 120);
    gr.addColorStop(0, it.color2 || '#fff');
    gr.addColorStop(1, it.color || '#888');
    g.fillStyle = gr;
    g.beginPath(); g.arc(128, 128, 112, 0, 7); g.fill();
  }
  return c;
}

export function initFloat({ stage, canvas, tag, items, mode = 'orbit', reduce, size = 1.7, accent = '115,205,48', violet = '123,92,255' }) {
  const ctx = canvas.getContext('2d');
  if (!ctx) return Promise.resolve(null);
  const gA = glow(accent);
  const gB = glow(violet);
  const NEED = 3.0;
  const D = 7;
  const ys = [0.1, 0.55, -0.4, 0.45, -0.35, 0.2, -0.15];
  const objs = [];

  const loads = items.map((it, i) => new Promise((resolve) => {
    const add = (drawable, w, h) => {
      objs.push({ it, drawable, ratio: w / h, a: Math.PI * 0.5 + (i / items.length) * Math.PI * 2, y: it.y ?? ys[i % ys.length], x: it.x, z: it.z, phase: i * 1.7, h: (it.scale || 1) * size, enter: { v: reduce ? 1 : 0 }, hover: 0, box: null, zz: 0 });
      resolve();
    };
    if (it.kind === 'text') { const c = textSprite(it); add(c, c.width, c.height); return; }
    if (it.kind === 'shape') { const c = shapeSprite(it); add(c, c.width, c.height); return; }
    const img = new Image();
    img.decoding = 'async';
    img.onload = () => add(img, img.naturalWidth, img.naturalHeight);
    img.onerror = () => resolve();
    img.src = it.src;
  }));

  let W = 1, Hh = 1, dpr = 1, U = 1, auto = 0, ry = 0, rx = 0, tx = 0, ty = 0, vel = 0, drag = null, hovered = null, mouse = null, visible = true, running = false, last = 0;
  const fine = matchMedia('(pointer: fine)').matches;

  function resize() {
    const r = stage.getBoundingClientRect();
    W = Math.max(1, r.width); Hh = Math.max(1, r.height);
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(W * dpr); canvas.height = Math.round(Hh * dpr);
    U = Math.min(W, Hh) / (2 * NEED) * 0.9;
    if (!running) frame(performance.now(), true);
  }

  function frame(now, still) {
    const dt = Math.min(0.05, (now - last) / 1000 || 0.016);
    last = now;
    const t = now / 1000;
    if (!reduce && !still && !drag) {
      if (mode === 'orbit') auto += dt * 0.16;
      ry += (tx - ry) * 0.06; rx += (ty - rx) * 0.06;
      if (Math.abs(vel) > 0.0001) { auto += vel; vel *= 0.93; }
    }
    const th = auto + ry, cth = Math.cos(th), sth = Math.sin(th), crx = Math.cos(rx), srx = Math.sin(rx);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, W, Hh);
    ctx.imageSmoothingQuality = 'high';
    const cx = W / 2, cy = Hh / 2;
    ctx.globalCompositeOperation = 'lighter';
    ctx.globalAlpha = 0.9;
    const bg = Math.min(W, Hh);
    ctx.drawImage(gB, cx - bg / 2, cy - bg / 2, bg, bg);

    for (const o of objs) {
      const e = o.enter.v;
      let x, y, z;
      if (mode === 'drift') {
        x = (o.x ?? Math.cos(o.a) * 2.2) * (0.3 + 0.7 * e);
        z = o.z ?? Math.sin(o.a) * 1.6;
        y = o.y * 1.5 * e + Math.sin(t * 0.7 + o.phase) * 0.1;
      } else {
        const R = 2.0 * (0.25 + 0.75 * e);
        x = Math.cos(o.a) * R * 1.15;
        y = o.y * 1.3 * e + Math.sin(t * 0.9 + o.phase) * 0.07;
        z = Math.sin(o.a) * R * 0.85;
      }
      const x1 = x * cth + z * sth, z1 = -x * sth + z * cth;
      const y2 = y * crx - z1 * srx, z2 = y * srx + z1 * crx;
      const s = D / (D - z2);
      o.zz = z2; o.sx = cx + x1 * s * U; o.sy = cy - y2 * s * U; o.s = s;
    }
    objs.sort((p, q) => p.zz - q.zz);

    for (const o of objs) {
      const e = o.enter.v;
      o.hover += ((o === hovered ? 1 : 0) - o.hover) * 0.15;
      const k = Math.max(0.001, e * (1 + o.hover * 0.14));
      const h = o.h * U * o.s * k, w = h * o.ratio;
      const depth = clamp((o.zz + 1.8) / 3.6, 0, 1);
      if (!o.it.noGlow) {
        ctx.globalCompositeOperation = 'lighter';
        ctx.globalAlpha = clamp(e, 0, 1) * (0.25 + 0.75 * depth);
        const g = h * 1.35;
        ctx.drawImage(gA, o.sx - g / 2, o.sy - g / 2, g, g);
      }
      ctx.globalCompositeOperation = 'source-over';
      ctx.globalAlpha = clamp(e * 1.4, 0, 1) * (0.72 + 0.28 * depth + o.hover * 0.1);
      ctx.save();
      ctx.translate(o.sx, o.sy);
      ctx.rotate(Math.sin(t * 0.6 + o.phase) * 0.05);
      ctx.drawImage(o.drawable, -w / 2, -h / 2, w, h);
      ctx.restore();
      o.box = { x: o.sx - w / 2, y: o.sy - h / 2, w, h };
    }
    ctx.globalAlpha = 1;

    if (fine && !still && tag) {
      let next = null;
      if (mouse) for (let i = objs.length - 1; i >= 0; i--) {
        const b = objs[i].box;
        if (b && objs[i].it.label && mouse.x > b.x && mouse.x < b.x + b.w && mouse.y > b.y && mouse.y < b.y + b.h) { next = objs[i]; break; }
      }
      if (next !== hovered) {
        hovered = next;
        canvas.style.cursor = next ? 'pointer' : '';
        if (window.gsap) window.gsap.to(tag, { opacity: next ? 1 : 0, duration: 0.2, overwrite: true });
        if (next) tag.textContent = next.it.label;
      }
      if (hovered && hovered.box) { tag.style.left = (hovered.box.x + hovered.box.w / 2) + 'px'; tag.style.top = (hovered.box.y + hovered.box.h * 0.12) + 'px'; }
    }
  }

  const loop = (now) => { if (!running) return; frame(now); requestAnimationFrame(loop); };
  const start = () => { if (running || reduce || !visible || document.hidden) return; running = true; last = performance.now(); requestAnimationFrame(loop); };
  const stop = () => { running = false; };

  if (!reduce) {
    const local = (e) => { const r = canvas.getBoundingClientRect(); return { x: e.clientX - r.left, y: e.clientY - r.top, nx: (e.clientX - r.left) / r.width - 0.5, ny: (e.clientY - r.top) / r.height - 0.5 }; };
    canvas.addEventListener('pointermove', (e) => {
      const p = local(e);
      if (e.pointerType === 'mouse') { mouse = { x: p.x, y: p.y }; tx = p.nx * 0.8; ty = p.ny * 0.35; }
      else if (drag) { const dx = e.clientX - drag.x; drag.x = e.clientX; auto += dx * 0.008; vel = dx * 0.0016; }
    });
    canvas.addEventListener('pointerleave', () => { mouse = null; tx = 0; ty = 0; });
    canvas.addEventListener('pointerdown', (e) => { if (e.pointerType !== 'mouse') drag = { x: e.clientX }; });
    ['pointerup', 'pointercancel'].forEach((ev) => canvas.addEventListener(ev, () => { drag = null; }));
    canvas.addEventListener('click', () => { if (hovered && hovered.it.href) location.hash = hovered.it.href; });
  }

  new ResizeObserver(resize).observe(stage);
  new IntersectionObserver(([en]) => { visible = en.isIntersecting; visible ? start() : stop(); }).observe(stage);
  document.addEventListener('visibilitychange', () => (document.hidden ? stop() : start()));

  return Promise.all(loads).then(() => {
    if (!objs.length) return null;
    resize();
    frame(performance.now(), true);
    stage.classList.add('is-gl');
    if (reduce || !window.gsap) objs.forEach((o) => { o.enter.v = 1; });
    else objs.forEach((o, i) => window.gsap.to(o.enter, { v: 1, duration: 1.7, ease: 'expo.out', delay: 0.15 + i * 0.12 }));
    start();
    if (reduce) frame(performance.now(), true);
    return { objs };
  });
}
