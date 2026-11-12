/* analysis.js: the checks of the house, on the solids engine.js builds from house.js as it is now. Nothing is stored.
   A check is {name, items}: the faults it found; none is OK. view.html shows them in Analiza. */
(function (root) {
'use strict';

function checkHouse(HOUSE, M) {
const { overlaps, volume, rectArea, rectMinus, mergeRects } = root.CORE.geometry, { fmt } = root.CORE.ui;
const GEO = HOUSE.geometry, KIND = GEO.kinds;

/* the smallest side of an element's box is its thickness */
function thicknessFaults() {
  return GEO.elements.filter(e => KIND[e.kind].thickness).flatMap(e => {
    const d = Math.min(e.b[1] - e.b[0], e.b[3] - e.b[2], e.b[5] - e.b[4]), t = KIND[e.kind].thickness;
    return Math.abs(d - t) > 0.05 ? [`${e.id}: ${fmt(d, 1)} zamiast ${t} (${KIND[e.kind].name})`] : [];
  });
}

/* every pair of solids, frames, glass, leaves and the site included, also two pieces of one element */
const SOLIDS = [M.CELLS, M.FIXTURES, M.ROOF_CELLS, M.STAIR_CELLS, M.SITE_CELLS].flat();
function overlapText({ a, b, common }) {
  const ys = common.poly.map(p => p[0]), zs = common.poly.map(p => p[1]);
  const at = [common.x1, common.x2, Math.min(...ys), Math.max(...ys), Math.min(...zs), Math.max(...zs)].map(v => fmt(v, 1));
  return `${a.element} (${a.material || a.cap}) × ${b.element} (${b.material || b.cap}): ${fmt(volume(common), 1)} cm³, x ${at[0]}–${at[1]}, y ${at[2]}–${at[3]}, z ${at[4]}–${at[5]}`;
}

/* what is left of a floor once rooms, the walls standing on it and the voids open at it are taken away */
function floorLeft(F) {
  const standing = GEO.elements.filter(e => e.b[4] <= F.level && e.b[5] > F.level).map(e => e.b);
  const taken = F.rooms.concat(F.other).flatMap(r => r.rects).concat(standing, M.voidsAt(F.level));
  const left = taken.reduce((rest, b) => rest.flatMap(a => rectMinus(a, b)), F.inside.map(q => q.slice(0, 4)));
  return mergeRects(left).filter(q => rectArea(q) > 1)
    .map(q => `${F.name}: ${fmt(rectArea(q) / 1e4, 2)} m², x ${fmt(q[0], 0)}–${fmt(q[1], 0)}, y ${fmt(q[2], 0)}–${fmt(q[3], 0)}`);
}

return [
  { name: 'Grubości według rodzaju', items: thicknessFaults() },
  { name: `Bryły nie nachodzą na siebie (${SOLIDS.length} brył)`, items: overlaps(SOLIDS).map(overlapText) },
  { name: 'Posadzka bez pomieszczenia', items: GEO.floors.flatMap(floorLeft) }
];
}

root.HouseAnalysis = { check: checkHouse };
})(typeof window !== 'undefined' ? window : globalThis);
