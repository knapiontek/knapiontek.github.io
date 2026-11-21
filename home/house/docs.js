// @ts-check
/* house/docs.js: the house's Documents as sheets (core/sheet.js shows them): the rooms and their areas, the inner doors as
   bought, the floor tiles to buy, the notes; and two a room's view has too: the elements (the tree of what is shown, a
   room's furniture in it) and the test (the checks with their items). Data in, sheets out: no browser, no house file. */
function houseDocsModule() {
'use strict';
const mm = v => Math.round(v * 10) / 10;
const roomName = r => `${r.node.number}. ${r.node.name}`;

/** the rooms shown by floor: the model's area against archon's
    @param {any} MODEL  house/model.js @param {any[]} shown  the rooms shown @returns {TableSheet} */
function rooms(MODEL, shown) {
  const rooms = /** @type {TableSheet} */ ({ name: 'Rooms', cols: [{ width: 34, share: 2, max: 40 }, { width: 14, digits: 2, fix: 9 }, { width: 14, digits: 2, fix: 9 }, { width: 60, share: 4 }],
    rows: [{ kind: 'title', cells: [MODEL.HOUSE.name] }, { kind: 'head', cells: ['Room', 'Model [m²]', 'Archon [m²]', 'Note'] }] });
  for (const F of MODEL.FLOORS) {
    const list = shown.filter(r => r.floor === F);
    if (!list.length) continue;
    rooms.rows.push({ kind: 'cat', cells: [F.name] });
    const first = rooms.rows.length + 1;
    for (const r of list) rooms.rows.push({ cells: [roomName(r), MODEL.areaOf(r.rects), r.node.archonArea ?? null, r.node.note || ''] });
    const last = rooms.rows.length;
    rooms.rows.push({ kind: 'sum', cells: ['Total', { f: `SUM(B${first}:B${last})` }, { f: `SUM(C${first}:C${last})` }] });
  }
  rooms.rows.push({ cells: ['The model at the block faces; archon after plaster.'] });
  return rooms;
}
/** the inner doors, each by its own name and place: what is bought for it
    @param {Door[]} doors @param {HouseNode[]} floors @param {Library} library @returns {TableSheet} */
function doors(doors, floors, library) {
  const sheet = /** @type {TableSheet} */ ({ name: 'Doors', cols: [{ width: 12, fix: 9 }, { width: 14, share: 1 }, { width: 50, share: 4 }, { width: 12, digits: 2, fix: 10, z: '#,##0.00' }],
    rows: [{ kind: 'title', cells: ['Inner doors'] }, { kind: 'head', cells: ['Door', 'Floor', 'Bought', 'Price [zł]'] }] });
  const first = sheet.rows.length + 1;
  for (const d of doors) for (const key of [d.product, ...d.extras]) {
    const P = key && library.product(key);
    sheet.rows.push({ cells: [d.label, /** @type {HouseNode} */ (floors.find(F => F.id === d.floor)).name, P ? P.name : 'to choose', P && P.price !== null ? { v: P.price, input: true } : ''] });
  }
  sheet.rows.push({ kind: 'sum', cells: ['Total', '', '', { f: `SUM(D${first}:D${sheet.rows.length})` }] });
  return sheet;
}
/** the floor tiles: each layout as laid (room/tiles.js floor), its area and the reserve give the m² to buy
    @param {{ P: TileProduct, rooms: any[], count: TileCount }[]} laid @param {number} reserve @returns {TableSheet} */
function tiles(laid, reserve) {
  const sheet = /** @type {TableSheet} */ ({ name: 'Floor tiles', cols: [{ width: 40, share: 2 }, { width: 40, share: 3 }, { width: 30, share: 2 }, { width: 12, digits: 2, fix: 9, z: '#,##0.00' }, { width: 12, digits: 2, fix: 9, z: '#,##0.00' }, { width: 14, digits: 2, fix: 10, z: '#,##0.00' }, { width: 14, digits: 2, fix: 10, z: '#,##0.00' }],
    rows: [{ kind: 'title', cells: ['Floor tiles'] }, { cells: ['Reserve for cuts', { v: reserve, input: true, z: '0%' }] },
      { kind: 'head', cells: ['Tile', 'Rooms', 'Laid', 'Area [m²]', 'To buy [m²]', 'Price [zł/m²]', 'Value [zł]'] }] });
  const first = sheet.rows.length + 1;
  for (const A of laid) {
    const r = sheet.rows.length + 1, c = A.count;
    sheet.rows.push({ cells: [A.P.name, A.rooms.map(roomName).join(', '), `${c.tiles} tiles: ${c.full} whole, ${c.cut} cut, ${c.small} small cuts`,
      Math.round(c.area * 100) / 100, { f: `ROUND(D${r}*(1+$B$2),2)` }, A.P.price ? { v: A.P.price, input: true } : '', { f: `E${r}*F${r}` }] });
  }
  sheet.rows.push({ kind: 'sum', cells: ['Total', '', '', { f: `SUM(D${first}:D${sheet.rows.length})` }, { f: `SUM(E${first}:E${sheet.rows.length})` }, '', { f: `SUM(G${first}:G${sheet.rows.length})` }] });
  sheet.rows.push({ cells: ['As laid in Finish (3D); the glue, the grout, the skirting and the work not counted.'] });
  return sheet;
}
/** the house's notes, under its source @param {any} house @returns {TableSheet} */
const notes = house => ({ name: 'Notes', cols: [{ width: 120, share: 1, max: 140 }], rows: [{ kind: 'title', cells: [house.source] }, { kind: 'head', cells: ['Notes'] }, ...house.notes.map(n => ({ cells: [n] }))] });

/** the tree of what is shown: each node where it is in its parent (mm); a room with furniture goes down into it, a group
    where its scene sets it in its room, the side its fronts face, and in it every part in the group's own x, y, h.
    site: a row over the roots (the whole house's site), roots: [{node, path, level}], furnitureOf(node): a room's prepared
    furniture (room/model.js) to go into, or nothing
    @param {string} title @param {any} site @param {{ node: any, path: string, level: number }[]} roots @param {(node: any) => any} furnitureOf @returns {TableSheet} */
function elements(title, site, roots, furnitureOf) {
  const tree = /** @type {TableSheet} */ ({ name: 'Elements', tree: 'closed', cols: [{ width: 44, share: 3 }, { width: 34, share: 2 }, ...Array(6).fill({ width: 9, fix: 7 })],
    rows: [{ kind: 'title', cells: [title] }, { kind: 'head', cells: ['Node', 'Path', 'x', 'y', 'h', 'Width (x)', 'Depth (y)', 'Height (h)'] }] });
  function walk(n, path, level, offset = n.offset, size = n.size, name = n.name) {
    tree.rows.push({ level, kind: level ? undefined : 'cat', cells: [name, path, ...offset.map(mm), ...size.map(mm)] });
    const P = n.type !== undefined && furnitureOf(n);
    if (P) for (const g of P.TREE) {
      if (g.type === 'builtIns') { walk(g, (path ? path + '/' : '') + g.id, level + 1); continue; }   // in the room's axes
      const s = g.type === 'product' ? P.scene.fixtures[g.id] : P.scene.groups[g.id.slice(1)], box = P.PLACE[g.type === 'product' ? g.id : g.id.slice(1)].box;
      walk(g, (path ? path + '/' : '') + g.id, level + 1, s.offset, s.size || [box[1] - box[0], box[3] - box[2], box[5] - box[4]], g.name + ' (fronts ' + s.front + ')');
    }
    for (const c of n.children || []) walk(c, (path ? path + '/' : '') + c.id, level + 1);
  }
  if (site) tree.rows.push({ level: 0, kind: 'cat', cells: [site.name, '', ...site.offset.map(mm), ...site.size.map(mm)] });
  for (const r of roots) walk(r.node, r.path, r.level);
  tree.rows.push({ cells: ['A node at its offset from the origin of its parent (its left, back, bottom corner); a group of furniture by its box in its room, and in it the group\'s own x (along its fronts), y (from its wall), h.'] });
  return tree;
}
/** the checks, each with its result, what to correct under it @param {string} title @param {Check[]} checks @returns {TableSheet} */
function test(title, checks) {
  const sheet = /** @type {TableSheet} */ ({ name: 'Test', tree: 'open', cols: [{ width: 44, share: 2 }, { width: 70, share: 4 }, { width: 10, fix: 8 }],
    rows: [{ kind: 'title', cells: [title] }, { kind: 'head', cells: ['Test', 'Details: what it checks', 'Result'] }] });
  for (const c of checks) {
    sheet.rows.push({ level: 0, cells: [c.name, c.about || '', c.info ? 'i' : c.items.length ? String(c.items.length) : 'OK'] });
    for (const i of c.items) sheet.rows.push({ level: 1, cells: [i, '', ''] });
  }
  sheet.rows.push({ cells: ['Result: OK, nothing to correct; a number, how many to correct (listed under it); i, to know, not a fault.'] });
  return sheet;
}

return { rooms, doors, tiles, notes, elements, test };
}
