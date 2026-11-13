/* core/plan.js: the 2D plan of every view, drawn from the model's own solids. What the cut meets is filled with its
   material's plan colour or hatch; what lies under the cut is seen from above (the higher over the lower), what lies over
   it is dashed; rooms, opening labels and dimensions come from the project's data. Sheets stand side by side. The sheet
   is in mm of the house (plan x = house y, plan y = house x: the garden at the top), so every size of the drawing is in
   mm too. Knows no project. Needs core/geometry.js and core/ui.js (THREE only for meshShape). */
(function (CORE) {
'use strict';
const { zRange, sectionAt, cutBy, rectArea } = CORE.geometry;

const SIZE = {
  gap: 4200, margin: 1200, side: 1600, head: 600, foot: 1400,          // between the sheets, around them
  hatch: 80, title: 340, titleAt: 200,
  line: { cut: 14, over: 12, dash: '70 50', clear: '100 80', window: '60 50', hole: '60 60', thin: 10, label: 8, seen: 6 },
  clear: { font: 180, inset: 60, down: 260 },
  label: { push: 450, r: 240, font: 130, bar: 200, up: 40, down: 130 },   // fits mm labels of five digits (6000/3460)
  room: { number: 220, name: 150, area: 140, up: 60, nameDown: 180, areaDown: 360 },
  dim: { off: 600, text: 840, font: 180, side: 600, sideText: 700 }
};
const INK = '#1f2523', FLOOR_FILL = '#f4f1ea';

/* materials: the library (key -> {color, plan: colour | {hatch: [ground, line]}}) */
function create(materials) {
  const S = SIZE, fmt = CORE.ui.fmt;
  const fill = key => { const d = materials[key] || {}; return d.plan?.hatch ? `url(#hatch-${key})` : d.plan || d.color || '#bbbbbb'; };
  const rect = (X, x1, x2, y1, y2, attr) => `<rect x="${Math.round(X + y1)}" y="${Math.round(x1)}" width="${Math.round(y2 - y1)}" height="${Math.round(x2 - x1)}" ${attr}/>`;
  const hatches = () => Object.entries(materials).filter(([, d]) => d.plan?.hatch).map(([k, d]) =>
    `<pattern id="hatch-${k}" width="${S.hatch}" height="${S.hatch}" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="${S.hatch}" height="${S.hatch}" fill="${d.plan.hatch[0]}"/><line x1="0" y1="0" x2="0" y2="${S.hatch}" stroke="${d.plan.hatch[1]}" stroke-width="${S.line.cut}"/></pattern>`).join('');

  /* the floor of rooms: rects [x1, x2, y1, y2] */
  const floorArea = (X, rects) => rects.map(q => rect(X, ...q, `fill="${FLOOR_FILL}"`)).join('');
  /* what the cut at h meets: each solid's section, in its section colour (cell.cap) */
  function cut(X, solids, h, keep = () => true) {
    let s = '';
    for (const c of solids) {
      if (!keep(c) || !cutBy(c.S, h)) continue;
      const y = sectionAt(c.S, h); if (y) s += rect(X, c.S.x1, c.S.x2, y[0], y[1], `fill="${fill(c.cap)}"`);
    }
    return s;
  }
  /* seen from above: shapes {poly: [[x, y]] (house mm), bottom, top, glass}; under the cut drawn lowest first, each over
     what lies lower; over the cut (all of it above h) dashed */
  function seen(X, shapes, h) {
    const pts = sh => sh.poly.map(p => `${Math.round((X + p[1]) * 10) / 10},${Math.round(p[0] * 10) / 10}`).join(' ');
    const under = shapes.filter(sh => sh.bottom < h).sort((a, b) => a.top - b.top), over = shapes.filter(sh => sh.bottom >= h);
    return under.map(sh => `<polygon points="${pts(sh)}" fill="${sh.glass ? 'none' : '#fbfaf7'}" stroke="${sh.glass ? '#6f97ad' : '#7b827e'}" stroke-width="${S.line.seen}"/>`).join('')
      + over.map(sh => `<polygon points="${pts(sh)}" fill="none" stroke="#8a8d88" stroke-width="${S.line.seen}" stroke-dasharray="${S.line.dash}"/>`).join('');
  }
  /* the archon labels (width / height) of the openings the cut at h meets, outside the wall for outer ones;
     sides: side key -> {axis, sign} */
  function labels(X, openings, h, sides, keep = () => true) {
    const B = S.label;
    let s = '';
    for (const o of openings) {
      if (o.b[4] > h || o.b[5] < h || !keep(o)) continue;
      const side = sides[o.outer], push = [0, 0]; if (side) push[side.axis] = B.push * side.sign;
      const tx = X + (o.b[2] + o.b[3]) / 2 + push[1], ty = (o.b[0] + o.b[1]) / 2 + push[0], [a, b] = o.label.split('/');
      s += `<g font-size="${B.font}" text-anchor="middle" fill="${INK}"><circle cx="${tx}" cy="${ty}" r="${B.r}" fill="#fff" stroke="${INK}" stroke-width="${S.line.thin}"/>`
        + `<line x1="${tx - B.bar}" y1="${ty}" x2="${tx + B.bar}" y2="${ty}" stroke="${INK}" stroke-width="${S.line.label}"/><text x="${tx}" y="${ty - B.up}">${a}</text><text x="${tx}" y="${ty + B.down}">${b}</text></g>`;
    }
    return s;
  }
  /* each room's label in its largest rectangle: number, name, area (rooms {rects, numbers, name, area}; area in m², else of rects) */
  function rooms(X, list) {
    const R = S.room;
    return list.map(r => {
      const q = r.rects.reduce((m, q) => rectArea(q) > rectArea(m) ? q : m), cx = (q[0] + q[1]) / 2, cy = X + (q[2] + q[3]) / 2;
      const area = r.area ?? r.rects.reduce((s, q) => s + rectArea(q), 0) / 1e6;
      return `<text x="${cy}" y="${cx - R.up}" text-anchor="middle" font-size="${R.number}" font-weight="700" fill="#9a6a2f">${r.numbers ? r.numbers.join(',') : ''}</text>`
        + `<text x="${cy}" y="${cx + R.nameDown}" text-anchor="middle" font-size="${R.name}" fill="${INK}">${r.name}</text>`
        + `<text x="${cy}" y="${cx + R.areaDown}" text-anchor="middle" font-size="${R.area}" fill="#5f6a66">${fmt(area, 2)} m²</text>`;
    }).join('');
  }
  /* the overall sizes of [x1, x2, y1, y2], in mm: the width under x = at, the length on the left */
  function dims(X, [x1, x2, y1, y2], at) {
    const D = S.dim, yb = at + D.off, w = Math.round(y2 - y1), l = Math.round(x2 - x1), xm = (x1 + x2) / 2, xs = X + y1 - D.side, xt = X + y1 - D.sideText;
    return `<g stroke="${INK}" stroke-width="${S.line.over}" font-size="${D.font}" fill="${INK}"><line x1="${X + y1}" y1="${yb}" x2="${X + y2}" y2="${yb}"/><text x="${X + (y1 + y2) / 2}" y="${at + D.text}" text-anchor="middle" stroke="none">${w}</text>
      <line x1="${xs}" y1="${x1}" x2="${xs}" y2="${x2}"/><text x="${xt}" y="${xm}" text-anchor="middle" stroke="none" transform="rotate(-90 ${xt} ${xm})">${l}</text></g>`;
  }
  /* the sheets side by side: [{extent: [x1, x2, y1, y2] (house mm), title, draw(X)}]; X shifts a sheet along the plan.
     A sheet narrower than its title gets the title's width, the drawing in its middle. */
  function sheets(list) {
    let at = 0;
    const X = list.map(sh => {
      const w = sh.extent[3] - sh.extent[2], slot = Math.max(w, Math.ceil(sh.title.length * S.title * 0.56 / 100) * 100), x = at + (slot - w) / 2 - sh.extent[2];
      at += slot + S.gap; return x;
    });
    const top = Math.min(...list.map(sh => sh.extent[0])) - S.margin, bottom = Math.max(...list.map(sh => sh.extent[1])) + S.margin;
    let s = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${-S.side} ${top - S.head} ${at - S.gap + 2 * S.side} ${bottom - top + S.foot}" font-family="Barlow, Arial, sans-serif"><defs>${hatches()}</defs>
  <rect x="${-S.side}" y="${top - S.head}" width="100%" height="100%" fill="#fff"/>`;
    list.forEach((sh, i) => {
      s += `<text x="${X[i] + (sh.extent[2] + sh.extent[3]) / 2}" y="${top - S.titleAt}" text-anchor="middle" font-size="${S.title}" font-weight="700" fill="${INK}">${sh.title}</text>`;
      s += sh.draw(X[i]);
    });
    return s + '</svg>';
  }
  return { SIZE, fill, rect, hatches, floorArea, cut, seen, labels, rooms, dims, sheets };
}

/* the footprint of a solid: its box seen from above */
function solidShape(c, glass = false) {
  const ys = c.S.poly.map(p => p[0]), [bottom, top] = zRange(c.S), y1 = Math.min(...ys), y2 = Math.max(...ys);
  return { poly: [[c.S.x1, y1], [c.S.x2, y1], [c.S.x2, y2], [c.S.x1, y2]], bottom, top, glass };
}
/* the footprint of a mesh: the convex hull of its points seen from above; toHouse: world -> house mm (Matrix4) */
function meshShape(mesh, toHouse, glass = false) {
  const P = mesh.geometry.attributes.position, m = new THREE.Matrix4().multiplyMatrices(toHouse, mesh.matrixWorld), v = new THREE.Vector3(), pts = [];
  let bottom = Infinity, top = -Infinity;
  for (let i = 0; i < P.count; i++) { v.fromBufferAttribute(P, i).applyMatrix4(m); pts.push([v.x, v.y]); bottom = Math.min(bottom, v.z); top = Math.max(top, v.z); }
  pts.sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  const cross = (o, a, b) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]), half = list => {
    const h = [];
    for (const p of list) { while (h.length >= 2 && cross(h[h.length - 2], h[h.length - 1], p) <= 0) h.pop(); h.push(p); }
    h.pop(); return h;
  };
  return { poly: half(pts).concat(half(pts.slice().reverse())), bottom, top, glass };
}

CORE.plan = { SIZE, create, solidShape, meshShape };
})(window.CORE = window.CORE || {});
