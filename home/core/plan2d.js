// @ts-check
/* core/plan2d.js: the 2D plan of every view, drawn from the model's own solids. What the cut meets is filled with its
   material's plan colour or hatch; what lies under the cut is seen from above (the higher over the lower), what lies over
   it is dashed; rooms, opening labels and dimensions come from the project's data. Sheets stand side by side. The sheet
   is in mm of the house (plan x = house y, plan y = house x: the garden at the top), so every size of the drawing is in
   mm too. Knows no project and no browser. Gets core/geometry.js and core/format.js. */
/**
 * @typedef {object} PlanShape  a thing seen from above
 * @property {number[][]} poly  [x, y] house mm
 * @property {number} bottom
 * @property {number} top
 * @property {boolean} [glass]
 * @property {{ poly: number[][] }[]} [pieces]  a figure of pieces (a worktop): one outline round them
 */
/** @typedef {{ b: Box, outer?: string, label: string }} PlanOpening  an opening with its archon label 'width/height' */
/** @typedef {{ rects: Rect[], numbers?: (string | number)[], name: string, area?: number }} PlanRoom  area m² (else of rects) */
/** @typedef {{ extent: Rect, title: string, draw: (X: number) => string }} PlanSheet  extent in house mm; draw at the shift X */
/** @typedef {Cell & { cap?: string }} PlanCell  cap: the material of its section */
/** @param {ReturnType<typeof geometryModule>} geometry @param {ReturnType<typeof formatModule>} format */
function plan2dModule(geometry, format) {
'use strict';
const { hRange, sectionAt, cutBy, rectArea } = geometry;

const SIZE = {
  gap: 4200, margin: 2000, side: 2400, head: 600, foot: 1400,          // between the sheets, around them
  hatch: 80, title: 340, titleAt: 200,
  line: { cut: 14, over: 12, dash: '70 50', clear: '100 80', window: '60 50', hole: '60 60', border: '160 50 20 50', thin: 10, label: 8, seen: 6 },
  clear: { font: 180, inset: 60, down: 260 },
  label: { push: 450, r: 240, font: 130, bar: 200, up: 40, down: 130 },   // fits mm labels of five digits (6000/3460)
  room: { number: 220, name: 150, area: 140, up: 60, nameDown: 180, areaDown: 360 },
  dim: { off: 900, row: 650, font: 150, text: 60, tick: 70, over: 120, small: 260 }   // chains of dimensions: rows outside the drawing
};
const INK = '#1f2523', FLOOR_FILL = '#f4f1ea';

/** a plan drawer for a page @param {Object<string, MaterialLook>} materials */
function create(materials) {
  const S = SIZE, fmt = format.fmt;
  const fill = (/** @type {string | undefined} */ key) => { const d = (key && materials[key]) || {}; return d.plan?.hatch ? `url(#hatch-${key})` : d.plan || d.color || '#bbbbbb'; };
  const rect = (/** @type {number} */ X, /** @type {number} */ x1, /** @type {number} */ x2, /** @type {number} */ y1, /** @type {number} */ y2, /** @type {string} */ attr) => `<rect x="${Math.round(X + y1)}" y="${Math.round(x1)}" width="${Math.round(y2 - y1)}" height="${Math.round(x2 - x1)}" ${attr}/>`;
  const hatches = () => Object.entries(materials).filter(([, d]) => d.plan?.hatch).map(([k, d]) =>
    `<pattern id="hatch-${k}" width="${S.hatch}" height="${S.hatch}" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="${S.hatch}" height="${S.hatch}" fill="${d.plan.hatch[0]}"/><line x1="0" y1="0" x2="0" y2="${S.hatch}" stroke="${d.plan.hatch[1]}" stroke-width="${S.line.cut}"/></pattern>`).join('');

  /* the floor of rooms: rects [x1, x2, y1, y2] */
  const floorArea = (/** @type {number} */ X, /** @type {Rect[]} */ rects) => rects.map(q => rect(X, q[0], q[1], q[2], q[3], `fill="${FLOOR_FILL}"`)).join('');
  /* what the cut at h meets: each solid's section, in its section colour (cell.cap) */
  /** @param {number} X @param {PlanCell[]} solids @param {number} h @param {(solid: any) => boolean} [keep] */
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
  /** @param {number} X @param {PlanShape[]} shapes @param {number} h */
  function seen(X, shapes, h) {
    const pts = (/** @type {{ poly: number[][] }} */ sh) => sh.poly.map(p => `${Math.round((X + p[1]) * 10) / 10},${Math.round(p[0] * 10) / 10}`).join(' ');
    const under = shapes.filter(sh => sh.bottom < h).sort((a, b) => a.top - b.top), over = shapes.filter(sh => sh.bottom >= h);
    /* a figure of pieces (a worktop): the pieces filled, one outline round them, no joints */
    const figure = (/** @type {PlanShape} */ sh) => (sh.pieces || []).map(q => `<polygon points="${pts(q)}" fill="#fbfaf7" stroke="none"/>`).join('')
      + outline(sh.pieces || []).map(([a, b]) => `<line x1="${X + a[1]}" y1="${a[0]}" x2="${X + b[1]}" y2="${b[0]}" stroke="#7b827e" stroke-width="${S.line.seen}"/>`).join('');
    return under.map(sh => sh.pieces ? figure(sh) : `<polygon points="${pts(sh)}" fill="${sh.glass ? 'none' : '#fbfaf7'}" stroke="${sh.glass ? '#6f97ad' : '#7b827e'}" stroke-width="${S.line.seen}"/>`).join('')
      + over.map(sh => `<polygon points="${pts(sh)}" fill="none" stroke="#8a8d88" stroke-width="${S.line.seen}" stroke-dasharray="${S.line.dash}"/>`).join('');
  }
  /* the archon labels (width / height) of the openings the cut at h meets, outside the wall for outer ones;
     sides: side key -> {axis, sign} */
  /** @param {number} X @param {PlanOpening[]} openings @param {number} h @param {Object<string, { axis: number, sign: number }>} sides @param {(opening: any) => boolean} [keep] */
  function labels(X, openings, h, sides, keep = () => true) {
    const B = S.label;
    let s = '';
    for (const o of openings) {
      if (o.b[4] > h || o.b[5] < h || !keep(o)) continue;
      const side = o.outer && sides[o.outer], push = [0, 0]; if (side) push[side.axis] = B.push * side.sign;
      const tx = X + (o.b[2] + o.b[3]) / 2 + push[1], ty = (o.b[0] + o.b[1]) / 2 + push[0], [a, b] = o.label.split('/');
      s += `<g font-size="${B.font}" text-anchor="middle" fill="${INK}"><circle cx="${tx}" cy="${ty}" r="${B.r}" fill="#fff" stroke="${INK}" stroke-width="${S.line.thin}"/>`
        + `<line x1="${tx - B.bar}" y1="${ty}" x2="${tx + B.bar}" y2="${ty}" stroke="${INK}" stroke-width="${S.line.label}"/><text x="${tx}" y="${ty - B.up}">${a}</text><text x="${tx}" y="${ty + B.down}">${b}</text></g>`;
    }
    return s;
  }
  /* each room's label in its largest rectangle: number, name, area (rooms {rects, numbers, name, area}; area in m², else of rects) */
  /** @param {number} X @param {PlanRoom[]} list */
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
  /* where two rooms meet with no wall between them: a thin dash-dot line, neither a wall (solid) nor what is over the
     cut (dashed); lines [[x, y], [x, y]] */
  const borders = (/** @type {number} */ X, /** @type {number[][][]} */ lines) => lines.map(([a, b]) => `<line x1="${X + a[1]}" y1="${a[0]}" x2="${X + b[1]}" y2="${b[0]}" stroke="#8a8d88" stroke-width="${S.line.thin}" stroke-dasharray="${S.line.border}"/>`).join('');
  /* a chain of dimensions, as in CAD: a line through the points, a slash at each, the size of each span over it.
     side: where the chain stands outside box [x1, x2, y1, y2] (house mm): 'E' (over the sheet: the garden), 'W' (under
     it: the entrance), 'N' (left), 'S' (right); row: 0 the nearest; points along the side (house y for E/W, house x for N/S) */
  /** @param {number} X @param {Rect} box @param {Side} side @param {number} row @param {number[]} points */
  function chain(X, box, side, row, points) {
    const D = S.dim, ps = [...new Set(points.map(Math.round))].sort((a, b) => a - b);
    if (ps.length < 2) return '';
    const across = side === 'E' || side === 'W', out = side === 'E' || side === 'N' ? -1 : 1;
    const edge = { E: box[0], W: box[1], N: box[2], S: box[3] }[side], d = edge + out * (D.off + row * D.row);
    /* plan coordinates of a point along the chain (u) at a distance from the drawing (v, house mm across the side) */
    const at = (/** @type {number} */ u, /** @type {number} */ v) => across ? [X + u, v] : [X + v, u];
    const seg = (/** @type {number[]} */ a, /** @type {number[]} */ b) => { const [p, q] = [at(a[0], a[1]), at(b[0], b[1])]; return `<line x1="${p[0]}" y1="${p[1]}" x2="${q[0]}" y2="${q[1]}"/>`; };
    let s = seg([ps[0] - D.over, d], [ps[ps.length - 1] + D.over, d]);
    for (const u of ps) {
      s += seg([u, d - out * D.over], [u, d + out * D.over]);                          // the extension past the line
      const [cx, cy] = at(u, d);
      s += `<line x1="${cx - D.tick}" y1="${cy + D.tick}" x2="${cx + D.tick}" y2="${cy - D.tick}" stroke-width="${S.line.cut}"/>`;   // the slash
    }
    for (let i = 0; i + 1 < ps.length; i++) {
      const m = (ps[i] + ps[i + 1]) / 2, len = ps[i + 1] - ps[i], [tx, ty] = at(m, d - D.text), size = len < D.small ? D.font * 0.75 : D.font;
      s += across ? `<text x="${tx}" y="${ty}" text-anchor="middle" font-size="${size}" stroke="none">${len}</text>`
        : `<text x="${tx}" y="${ty}" text-anchor="middle" font-size="${size}" stroke="none" transform="rotate(-90 ${tx} ${ty})">${len}</text>`;
    }
    return `<g stroke="${INK}" stroke-width="${S.line.thin}" fill="${INK}">${s}</g>`;
  }
  /* the overall sizes of [x1, x2, y1, y2], in mm: under the drawing and on its left */
  const dims = (/** @type {number} */ X, /** @type {Rect} */ box) => chain(X, box, 'W', 0, [box[2], box[3]]) + chain(X, box, 'N', 0, [box[0], box[1]]);
  /* the sheets side by side: [{extent: [x1, x2, y1, y2] (house mm), title, draw(X)}]; X shifts a sheet along the plan.
     A sheet narrower than its title gets the title's width, the drawing in its middle. */
  /** @param {PlanSheet[]} list @returns {string} an svg */
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
  return { SIZE, rect, floorArea, cut, seen, labels, rooms, borders, chain, dims, sheets };
}

/* the outline of axis-aligned rectangles (shapes with a box poly): the edges of the grid's cells between covered and not,
   joined along each line; [[x, y], [x, y]] */
/** @param {{ poly: number[][] }[]} pieces @returns {number[][][]} */
function outline(pieces) {
  const boxes = pieces.map(q => { const xs = q.poly.map(p => p[0]), ys = q.poly.map(p => p[1]); return [Math.min(...xs), Math.max(...xs), Math.min(...ys), Math.max(...ys)]; });
  const X = [...new Set(boxes.flatMap(b => [b[0], b[1]]).map(v => Math.round(v * 10) / 10))].sort((a, b) => a - b);
  const Y = [...new Set(boxes.flatMap(b => [b[2], b[3]]).map(v => Math.round(v * 10) / 10))].sort((a, b) => a - b);
  const on = (/** @type {number} */ i, /** @type {number} */ j) => i >= 0 && j >= 0 && i < X.length - 1 && j < Y.length - 1 && boxes.some(b => b[0] <= X[i] + 0.05 && b[1] >= X[i + 1] - 0.05 && b[2] <= Y[j] + 0.05 && b[3] >= Y[j + 1] - 0.05);
  /** @type {number[][][]} */ const segs = [];
  for (let i = 0; i <= X.length - 1; i++) for (let j = 0; j < Y.length - 1; j++) if (on(i - 1, j) !== on(i, j)) segs.push([[X[i], Y[j]], [X[i], Y[j + 1]]]);
  for (let j = 0; j <= Y.length - 1; j++) for (let i = 0; i < X.length - 1; i++) if (on(i, j - 1) !== on(i, j)) segs.push([[X[i], Y[j]], [X[i + 1], Y[j]]]);
  return segs;
}
/* the footprint of a solid: its box seen from above */
/** @param {Cell} c @param {boolean} [glass] @returns {PlanShape} */
function solidShape(c, glass = false) {
  const ys = c.S.poly.map(p => p[0]), [bottom, top] = hRange(c.S), y1 = Math.min(...ys), y2 = Math.max(...ys);
  return { poly: [[c.S.x1, y1], [c.S.x2, y1], [c.S.x2, y2], [c.S.x1, y2]], bottom, top, glass };
}

return { create, solidShape };
}
HOME.plan2d = plan2dModule(HOME.geometry, HOME.format);
