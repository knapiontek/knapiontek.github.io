/* test.js: checks of the house's solids, built by engine.js from house.js as it is now. Nothing is stored.
   Each test returns a list of faults; an empty list is OK. test.html shows them. */
(function () {
'use strict';
const { prismIntersect, volume } = CORE.geometry;
const S = HouseEngine.build(window.HOUSE);
const SETS = ['CELLS', 'FIXTURES', 'ROOF_CELLS', 'STAIR_CELLS', 'SITE_CELLS'];
const ALL = SETS.flatMap(set => S[set].map((c, i) => ({ c, name: `${set}[${i}] ${c.element} (${c.material || c.cap})` })));
const r2 = v => +v.toFixed(2);

/* no two solids share volume: every pair, frames, glass, leaves, grooves, handles and the site included,
   also two pieces of one element; exact prism intersection, nothing is sampled */
function overlaps() {
  const MIN = 1e-3, out = [];                // cm³: anything above rounding
  for (let i = 0; i < ALL.length; i++) for (let j = i + 1; j < ALL.length; j++) {
    const I = prismIntersect(ALL[i].c.S, ALL[j].c.S);
    if (!I || volume(I) <= MIN) continue;
    const ys = I.poly.map(p => p[0]), zs = I.poly.map(p => p[1]);
    out.push(`${ALL[i].name} × ${ALL[j].name}: ${r2(volume(I))} cm³, box [${[I.x1, I.x2, Math.min(...ys), Math.max(...ys), Math.min(...zs), Math.max(...zs)].map(r2).join(', ')}]`);
  }
  return out;
}

window.TESTS = [
  { name: `Bryły nie nachodzą na siebie (${ALL.length} brył)`, run: overlaps }
];
})();
