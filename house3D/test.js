/* test.js: the checks of the house, on the solids engine.js builds from house.js as it is now. Nothing is stored.
   A check is {name, items}: the faults it found; none is OK. view.html shows them in Problemy. */
(function (root) {
'use strict';

function checkHouse(HOUSE, M) {
const { EPS, prismIntersect, volume, rectArea, rectMinus, mergeRects } = root.CORE.geometry, { fmt } = root.CORE.ui;
const GEO = HOUSE.geometry, KIND = GEO.kinds, FLOORS = GEO.floors;
const { CELLS, FIXTURES, ROOF_CELLS, STAIR_CELLS, SITE_CELLS, voidsAt } = M;

const thickness = GEO.elements.filter(e => KIND[e.kind].thickness).flatMap(e => {
  const d = Math.min(e.b[1] - e.b[0], e.b[3] - e.b[2], e.b[5] - e.b[4]), t = KIND[e.kind].thickness;
  return Math.abs(d - t) > 0.05 ? [`${e.id}: ${fmt(d, 1)} zamiast ${t} (${KIND[e.kind].name})`] : [];
});
/* every pair of solids, frames, glass, leaves and the site included, also two pieces of one element */
const solids = [CELLS, FIXTURES, ROOF_CELLS, STAIR_CELLS, SITE_CELLS].flat(), overlapping = [];
for (let i = 0; i < solids.length; i++) for (let j = i + 1; j < solids.length; j++) {
  const a = solids[i], b = solids[j], I = prismIntersect(a.S, b.S);
  if (!I || volume(I) <= 1e-3) continue;
  const ys = I.poly.map(p => p[0]), zs = I.poly.map(p => p[1]), at = [I.x1, I.x2, Math.min(...ys), Math.max(...ys), Math.min(...zs), Math.max(...zs)].map(v => fmt(v, 1));
  overlapping.push(`${a.element} (${a.material || a.cap}) × ${b.element} (${b.material || b.cap}): ${fmt(volume(I), 1)} cm³, x ${at[0]}–${at[1]}, y ${at[2]}–${at[3]}, z ${at[4]}–${at[5]}`);
}
const free = FLOORS.flatMap(F => {        // what is left of the floor once rooms, walls and voids are taken away
  const h = F.level + 100;
  const taken = F.rooms.concat(F.other).flatMap(r => r.rects)
    .concat(GEO.elements.filter(e => e.b[4] <= h && e.b[5] >= h).map(e => e.b))
    .concat(voidsAt(F.level));
  const left = taken.reduce((rest, b) => rest.flatMap(a => rectMinus(a, b)), F.inside.map(q => q.slice(0, 4)));
  return mergeRects(left).filter(q => rectArea(q) > 1).map(q => `${F.name}: ${fmt(rectArea(q) / 1e4, 2)} m², x ${fmt(q[0], 0)}–${fmt(q[1], 0)}, y ${fmt(q[2], 0)}–${fmt(q[3], 0)}`);
});
return [
  { name: 'Grubości według rodzaju', items: thickness },
  { name: `Bryły nie nachodzą na siebie (${solids.length} brył)`, items: overlapping },
  { name: 'Posadzka bez pomieszczenia', items: free }
];
}

root.HouseTests = { check: checkHouse };
})(typeof window !== 'undefined' ? window : globalThis);
