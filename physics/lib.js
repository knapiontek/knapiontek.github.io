/* Physics notebook — shared helpers: math rendering, plotting, linear algebra, controls. */
(function (global) {
  'use strict';

  /* ---------- page list (index + prev/next) ---------- */
  const PAGES = [
    { file: 'newton.html',      title: 'Newtonian Gravity',        tag: 'Mechanics',        desc: 'Many-body orbits with collisions, integrated step by step.', tex: '\\vec F = -G\\frac{Mm}{r^3}\\vec r' },
    { file: 'euler.html',       title: "Euler's Formula & ODEs",   tag: 'Complex analysis', desc: 'Damped oscillators and the Euler method compared with the exact solution.', tex: 'e^{i\\omega t}=\\cos\\omega t+i\\sin\\omega t' },
    { file: 'runge_kutta.html', title: 'Runge–Kutta Methods',      tag: 'Numerics',         desc: 'A driven oscillator solved with Euler (RK1) and classic RK4.', tex: '\\text{error} = \\mathcal{O}(h^4)' },
    { file: 'lorenz.html',      title: 'The Lorenz System',        tag: 'Chaos',            desc: 'The butterfly attractor and its fixed points by Newton’s method.', tex: '\\dot x=\\sigma(y-x)' },
    { file: 'fourier.html',     title: 'Fourier Series & FFT',     tag: 'Signals',          desc: 'Build a square wave from harmonics; the radix-2 FFT derived.', tex: 'X_k=\\sum_n x_n e^{-2\\pi i kn/N}' },
    { file: 'spline.html',      title: 'Closed Splines',           tag: 'Numerics',         desc: 'Quadratic vs cubic closed curves through draggable points.', tex: 'x(t)=at^3+bt^2+ct+d' },
    { file: 'poisson.html',     title: 'Poisson Equation',         tag: 'Fields',           desc: 'Finite differences in 1-D and 2-D, with equipotential lines.', tex: '\\nabla^2 u = f' },
    { file: 'riemann.html',     title: 'Polar Coordinates',        tag: 'Geometry',         desc: 'Basis vectors and Christoffel symbols, the first step to curvature.', tex: '\\Gamma^\\phi_{r\\phi}=\\tfrac1r' },
    { file: 'lorentz.html',     title: 'Lorentz Transformation',   tag: 'Relativity',       desc: 'Derivation, time dilation and an interactive Minkowski diagram.', tex: "x'=\\gamma(x-vt)" },
    { file: 'maxwell.html',     title: "Maxwell's Equations",      tag: 'Electromagnetism', desc: 'Integral and differential forms, in Gaussian and SI units.', tex: '\\nabla\\cdot\\vec B=0' },
    { file: 'schrodinger.html', title: 'Schrödinger Equation',     tag: 'Quantum',          desc: 'Time-dependent and stationary forms, the particle in a box.', tex: 'i\\hbar\\,\\partial_t\\psi=\\hat H\\psi' },
    { file: 'dirac.html',       title: 'Dirac Equation',           tag: 'Quantum',          desc: 'Relativistic electron: Hamiltonian and covariant forms.', tex: '(i\\hbar\\gamma^\\mu\\partial_\\mu-mc)\\psi=0' },
  ];

  /* ---------- colours from CSS ---------- */
  function color(name) {
    return getComputedStyle(document.documentElement).getPropertyValue('--' + name).trim() || '#000';
  }

  /* ---------- math ---------- */
  function renderMath(root) {
    if (!global.katex) return;
    root = root || document;
    const opts = { throwOnError: false, strict: 'ignore' };
    root.querySelectorAll('.eq').forEach(el => {
      if (el.dataset.tex) return;
      el.dataset.tex = el.textContent;
      katex.render(el.textContent.trim(), el, Object.assign({ displayMode: true }, opts));
    });
    root.querySelectorAll('.m').forEach(el => {
      if (el.dataset.tex) return;
      el.dataset.tex = el.textContent;
      katex.render(el.textContent.trim(), el, Object.assign({ displayMode: false }, opts));
    });
  }

  /* ---------- page chrome: top bar + prev/next ---------- */
  function chrome() {
    const here = location.pathname.split('/').pop() || 'index.html';
    if (here === 'index.html') return;
    const main = document.querySelector('main');
    if (!main) return;
    const bar = document.createElement('div');
    bar.className = 'topbar';
    bar.innerHTML = '<a href="index.html">← Physics notebook</a>';
    main.parentNode.insertBefore(bar, main);

    const i = PAGES.findIndex(p => p.file === here);
    if (i < 0) return;
    const nav = document.createElement('nav');
    nav.className = 'pager';
    const prev = PAGES[i - 1], next = PAGES[i + 1];
    if (prev) nav.innerHTML += `<a class="prev" href="${prev.file}">← Previous<b>${prev.title}</b></a>`;
    if (next) nav.innerHTML += `<a class="next" href="${next.file}">Next →<b>${next.title}</b></a>`;
    main.appendChild(nav);
  }

  /* ---------- responsive canvas ---------- */
  class Figure {
    constructor(canvas, opts) {
      this.canvas = typeof canvas === 'string' ? document.querySelector(canvas) : canvas;
      this.ctx = this.canvas.getContext('2d');
      this.aspect = opts.aspect || 0.6;
      this.maxHeight = opts.maxHeight || 620;
      this.drawFn = opts.draw;
      this.w = this.h = 0;
      const ro = new ResizeObserver(() => this.resize());
      ro.observe(this.canvas);
      if (global.matchMedia) {
        const mq = matchMedia('(prefers-color-scheme: dark)');
        mq.addEventListener && mq.addEventListener('change', () => this.draw());
      }
      // first layout happens via the ResizeObserver callback, after the page script has finished
    }
    resize() {
      const w = this.canvas.clientWidth;
      if (!w || w === this.w) return;
      const h = Math.min(Math.round(w * this.aspect), this.maxHeight);
      const dpr = global.devicePixelRatio || 1;
      this.canvas.style.height = h + 'px';
      this.canvas.width = Math.round(w * dpr);
      this.canvas.height = Math.round(h * dpr);
      this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      this.w = w;
      this.h = h;
      this.draw();
    }
    draw() {
      if (!this.w) return;
      this.ctx.clearRect(0, 0, this.w, this.h);
      if (this.drawFn) this.drawFn(this.ctx, this);
    }
    // pointer position in CSS pixels
    pointer(ev) {
      const r = this.canvas.getBoundingClientRect();
      return { x: ev.clientX - r.left, y: ev.clientY - r.top };
    }
  }

  /* ---------- axes / plotting ---------- */
  function niceStep(span, target) {
    const raw = span / target;
    const mag = Math.pow(10, Math.floor(Math.log10(raw)));
    const n = raw / mag;
    return (n < 1.5 ? 1 : n < 3 ? 2 : n < 7 ? 5 : 10) * mag;
  }
  function fmt(v, step) {
    const d = Math.max(0, -Math.floor(Math.log10(step) + 1e-9));
    const s = v.toFixed(Math.min(d, 6));
    return s === '-0' ? '0' : s.replace('-', '−');
  }

  class Axes {
    constructor(ctx, fig, o) {
      this.ctx = ctx;
      this.pad = Object.assign({ l: 46, r: 14, t: 12, b: 30 }, o.pad || {});
      this.x0 = this.pad.l;
      this.x1 = fig.w - this.pad.r;
      this.y0 = fig.h - this.pad.b;
      this.y1 = this.pad.t;
      this.xr = o.x.slice();
      this.yr = o.y.slice();
      if (o.equal) {
        // same scale on both axes, centred
        const sx = (this.x1 - this.x0) / (this.xr[1] - this.xr[0]);
        const sy = (this.y0 - this.y1) / (this.yr[1] - this.yr[0]);
        const s = Math.min(sx, sy);
        const cx = (this.xr[0] + this.xr[1]) / 2, cy = (this.yr[0] + this.yr[1]) / 2;
        const hx = (this.x1 - this.x0) / s / 2, hy = (this.y0 - this.y1) / s / 2;
        this.xr = [cx - hx, cx + hx];
        this.yr = [cy - hy, cy + hy];
      }
      this.o = o;
    }
    X(x) { return this.x0 + (x - this.xr[0]) / (this.xr[1] - this.xr[0]) * (this.x1 - this.x0); }
    Y(y) { return this.y0 - (y - this.yr[0]) / (this.yr[1] - this.yr[0]) * (this.y0 - this.y1); }
    invX(px) { return this.xr[0] + (px - this.x0) / (this.x1 - this.x0) * (this.xr[1] - this.xr[0]); }
    invY(py) { return this.yr[0] + (this.y0 - py) / (this.y0 - this.y1) * (this.yr[1] - this.yr[0]); }

    frame() {
      const c = this.ctx, o = this.o;
      const sx = niceStep(this.xr[1] - this.xr[0], Math.max(3, (this.x1 - this.x0) / 90));
      const sy = niceStep(this.yr[1] - this.yr[0], Math.max(3, (this.y0 - this.y1) / 60));
      c.save();
      c.lineWidth = 1;
      c.strokeStyle = color('grid');
      c.fillStyle = color('muted');
      c.font = '11px ' + getComputedStyle(document.body).getPropertyValue('--sans');
      c.beginPath();
      for (let v = Math.ceil(this.xr[0] / sx) * sx; v <= this.xr[1] + 1e-9; v += sx) {
        const p = Math.round(this.X(v)) + .5;
        c.moveTo(p, this.y1); c.lineTo(p, this.y0);
      }
      for (let v = Math.ceil(this.yr[0] / sy) * sy; v <= this.yr[1] + 1e-9; v += sy) {
        const p = Math.round(this.Y(v)) + .5;
        c.moveTo(this.x0, p); c.lineTo(this.x1, p);
      }
      c.stroke();
      if (!o.noLabels) {
        c.textAlign = 'center'; c.textBaseline = 'top';
        for (let v = Math.ceil(this.xr[0] / sx) * sx; v <= this.xr[1] + 1e-9; v += sx)
          c.fillText(fmt(v, sx), this.X(v), this.y0 + 6);
        c.textAlign = 'right'; c.textBaseline = 'middle';
        for (let v = Math.ceil(this.yr[0] / sy) * sy; v <= this.yr[1] + 1e-9; v += sy)
          c.fillText(fmt(v, sy), this.x0 - 6, this.Y(v));
      }
      // zero lines
      c.strokeStyle = color('axis');
      c.beginPath();
      if (this.yr[0] <= 0 && this.yr[1] >= 0) { const p = Math.round(this.Y(0)) + .5; c.moveTo(this.x0, p); c.lineTo(this.x1, p); }
      if (this.xr[0] <= 0 && this.xr[1] >= 0) { const p = Math.round(this.X(0)) + .5; c.moveTo(p, this.y1); c.lineTo(p, this.y0); }
      c.stroke();
      if (o.xlabel) { c.textAlign = 'right'; c.textBaseline = 'bottom'; c.font = 'italic 13px ' + getComputedStyle(document.body).fontFamily; c.fillText(o.xlabel, this.x1 - 2, this.y0 - 4); }
      if (o.ylabel) { c.textAlign = 'left'; c.textBaseline = 'top'; c.font = 'italic 13px ' + getComputedStyle(document.body).fontFamily; c.fillText(o.ylabel, this.x0 + 6, this.y1 + 2); }
      c.restore();
      return this;
    }
    clip() {
      this.ctx.save();
      this.ctx.beginPath();
      this.ctx.rect(this.x0, this.y1, this.x1 - this.x0, this.y0 - this.y1);
      this.ctx.clip();
    }
    unclip() { this.ctx.restore(); }

    // polyline through arrays xs, ys
    line(xs, ys, st) {
      const c = this.ctx;
      st = st || {};
      this.clip();
      c.lineWidth = st.width || 2;
      c.strokeStyle = st.color || color('c1');
      c.setLineDash(st.dash || []);
      c.lineJoin = 'round';
      c.beginPath();
      let pen = false;
      for (let i = 0; i < xs.length; i++) {
        const y = ys[i];
        if (!isFinite(y)) { pen = false; continue; }
        const px = this.X(xs[i]), py = this.Y(y);
        if (pen) c.lineTo(px, py); else { c.moveTo(px, py); pen = true; }
      }
      c.stroke();
      this.unclip();
    }
    fn(f, st, n) {
      n = n || Math.max(200, Math.round(this.x1 - this.x0));
      const xs = [], ys = [];
      for (let i = 0; i <= n; i++) {
        const x = this.xr[0] + (this.xr[1] - this.xr[0]) * i / n;
        xs.push(x); ys.push(f(x));
      }
      this.line(xs, ys, st);
    }
    dots(xs, ys, st) {
      const c = this.ctx;
      st = st || {};
      this.clip();
      c.fillStyle = st.color || color('c1');
      for (let i = 0; i < xs.length; i++) {
        c.beginPath();
        c.arc(this.X(xs[i]), this.Y(ys[i]), st.r || 3, 0, 2 * Math.PI);
        c.fill();
      }
      this.unclip();
    }
  }

  /* ---------- linear algebra ---------- */
  // Solve A x = b with Gaussian elimination and partial pivoting. A: array of rows. Does not modify inputs.
  function solve(A, b) {
    const n = b.length;
    const M = A.map(r => Float64Array.from(r));
    const x = Float64Array.from(b);
    for (let k = 0; k < n; k++) {
      let p = k, best = Math.abs(M[k][k]);
      for (let i = k + 1; i < n; i++) if (Math.abs(M[i][k]) > best) { best = Math.abs(M[i][k]); p = i; }
      if (best < 1e-14) throw new Error('singular matrix');
      if (p !== k) { [M[p], M[k]] = [M[k], M[p]]; [x[p], x[k]] = [x[k], x[p]]; }
      for (let i = k + 1; i < n; i++) {
        const f = M[i][k] / M[k][k];
        if (f === 0) continue;
        for (let j = k; j < n; j++) M[i][j] -= f * M[k][j];
        x[i] -= f * x[k];
      }
    }
    for (let i = n - 1; i >= 0; i--) {
      let s = x[i];
      for (let j = i + 1; j < n; j++) s -= M[i][j] * x[j];
      x[i] = s / M[i][i];
    }
    return Array.from(x);
  }
  function matvec(A, x) { return A.map(r => r.reduce((s, a, j) => s + a * x[j], 0)); }
  function zeros(n, m) { return Array.from({ length: n }, () => new Array(m).fill(0)); }

  // Band matrix: only entries with |i-j| <= bw are stored (row i, column j -> data[i*(2bw+1) + j-i+bw]).
  class BandMatrix {
    constructor(n, bw) { this.n = n; this.bw = bw; this.w = 2 * bw + 1; this.data = new Float64Array(n * this.w); }
    idx(i, j) { return i * this.w + (j - i + this.bw); }
    set(i, j, v) { this.data[this.idx(i, j)] = v; }
    get(i, j) { return Math.abs(i - j) > this.bw ? 0 : this.data[this.idx(i, j)]; }
  }
  // Gaussian elimination inside the band, no pivoting (fine for diagonally dominant systems
  // such as finite-difference Laplacians). Cost O(n·bw²). Modifies the matrix.
  function solveBanded(M, b) {
    const n = M.n, bw = M.bw, D = M.data, w = M.w;
    const x = Float64Array.from(b);
    for (let k = 0; k < n; k++) {
      const akk = D[k * w + bw];
      const iEnd = Math.min(n, k + bw + 1);
      for (let i = k + 1; i < iEnd; i++) {
        const f = D[i * w + (k - i + bw)] / akk;
        if (f === 0) continue;
        for (let j = k; j < iEnd; j++) D[i * w + (j - i + bw)] -= f * D[k * w + (j - k + bw)];
        x[i] -= f * x[k];
      }
    }
    for (let i = n - 1; i >= 0; i--) {
      let s = x[i];
      const jEnd = Math.min(n, i + bw + 1);
      for (let j = i + 1; j < jEnd; j++) s -= D[i * w + (j - i + bw)] * x[j];
      x[i] = s / D[i * w + bw];
    }
    return x;
  }

  /* ---------- controls ---------- */
  // Bind a range input to a callback; shows the value in a sibling <output>.
  function slider(id, onChange, format) {
    const el = document.getElementById(id);
    const out = el.parentNode.querySelector('output');
    format = format || (v => v);
    const update = () => {
      const v = parseFloat(el.value);
      if (out) out.textContent = format(v);
      onChange(v);
    };
    el.addEventListener('input', update);
    update();
    return el;
  }

  /* ---------- boot ---------- */
  function boot() {
    renderMath();
    chrome();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();

  global.Lab = { PAGES, color, renderMath, Figure, Axes, solve, solveBanded, BandMatrix, matvec, zeros, slider };
})(window);
