// @ts-check
// house/docs.js: the house's Documents as sheets (core/sheet.js; docs.js shows them): the rooms and their areas (the model's
// against archon's), the tiles laid in the rooms with their scenes (what is laid, its price), the inner doors as bought, the
// notes. From the hierarchy and the library: data in, sheets out, no browser.

/** @typedef {import('../core/sheet.js').Sheet} Sheet */
/** @typedef {import('../core/sheet.js').Row} Row */
/** @typedef {import('../types.js').Catalog} Catalog */
/** @typedef {import('../core/hierarchy.js').HierarchyNode & Record<string, any>} Node */
/** @typedef {{ node: (path: string) => any, walk: (fn: (n: any) => void) => void, path: (n: any) => string, parent: (n: any) => any }} Hierarchy */

const MONEY = '#,##0.00';
/** a room's name: its number and name @param {Node} r */
const roomName = r => `${r.number}. ${r.name}`;
/** a floor's rooms (nodes with a number), in their order @param {Node} floor @returns {Node[]} */
const roomsOf = floor => (floor.children || []).filter((/** @type {Node} */ c) => c.number !== undefined);
/** the floors of the house (nodes with rooms) @param {Node} house @returns {Node[]} */
const floorsOf = house => (house.children || []).filter(f => roomsOf(f).length);
/** an area in m² of rectangles [x0, x1, y0, y1] (mm) @param {number[][]} rects */
const areaOf = rects => Math.round(rects.reduce((s, r) => s + (r[1] - r[0]) * (r[3] - r[2]), 0) / 1e4) / 100;

/**
 * The rooms by floor, each its area in the model (its floor's rectangles) against archon's; a sum a floor.
 * @param {Node} house @returns {Sheet}
 */
export function roomsSheet(house) {
  const sheet = /** @type {Sheet & { rows: Row[] }} */ ({ name: 'Rooms', cols: [{ width: 34, share: 2, max: 40 }, { width: 14, digits: 2, fix: 9 }, { width: 14, digits: 2, fix: 9 }, { width: 60, share: 4 }],
    rows: [{ kind: 'title', cells: [house.name] }, { kind: 'head', cells: ['Room', 'Model [m²]', 'Archon [m²]', 'Note'] }] });
  for (const F of floorsOf(house)) {
    sheet.rows.push({ kind: 'cat', cells: [F.name] });
    const first = sheet.rows.length + 1;
    for (const r of roomsOf(F)) sheet.rows.push({ cells: [roomName(r), areaOf(r.area || [[0, r.size[0], 0, r.size[1]]]), r.archonArea ?? null, r.note || ''] });
    const last = sheet.rows.length;
    sheet.rows.push({ kind: 'sum', cells: ['Total', { f: `SUM(B${first}:B${last})` }, { f: `SUM(C${first}:C${last})` }] });
  }
  sheet.rows.push({ cells: ['The model at the blocks\' faces; archon after plaster.'] });
  return sheet;
}

/**
 * The tiles laid in the rooms (their scenes: the floor's, the walls'), each as laid: its product, its room, how many tiles
 * (whole, cut, small cuts), the area, the price a m² (the viewer may change it), the value; the sums. No reserve: the tiles
 * counted are the tiles bought.
 * @param {Node} house @param {Catalog} catalog @returns {Sheet}
 */
export function tilesSheet(house, catalog) {
  const sheet = /** @type {Sheet & { rows: Row[] }} */ ({ name: 'Tiles', cols: [{ width: 40, share: 3 }, { width: 24, share: 2 }, { width: 10, share: 1 }, { width: 34, share: 2 },
    { width: 12, digits: 2, fix: 9, z: MONEY }, { width: 14, digits: 2, fix: 10, z: MONEY }, { width: 14, digits: 2, fix: 10, z: MONEY }],
    rows: [{ kind: 'title', cells: ['Tiles'] }, { kind: 'head', cells: ['Tile', 'Room', 'Where', 'Laid', 'Area [m²]', 'Price [zł/m²]', 'Value [zł]'] }] });
  const first = sheet.rows.length + 1;
  for (const F of floorsOf(house)) for (const room of roomsOf(F)) for (const [k, id, where] of [['floor', 'floorTiles', 'floor'], ['walls', 'wallTiles', 'walls']]) {
    const n = /** @type {Node | undefined} */ ((room.children || []).find((/** @type {Node} */ c) => c.id === id)), t = room.tiles?.[k];
    if (!n || !t) continue;
    const P = /** @type {any} */ (catalog.product(t.product)), c = n.count, r = sheet.rows.length + 1;
    const name = P.links?.length ? { text: P.name, links: P.links.map((/** @type {{ name: string, url: string }} */ l) => ({ text: l.name, href: l.url })) } : P.name;
    sheet.rows.push({ cells: [name, roomName(room), where, `${c.tiles} tiles: ${c.whole} whole, ${c.cut} cut, ${c.small} small cuts`, c.area,
      P.price !== null && P.price !== undefined ? { v: P.price, input: true } : '', { f: `E${r}*F${r}` }] });
  }
  const last = sheet.rows.length;
  sheet.rows.push({ kind: 'sum', cells: ['Total', '', '', '', { f: `SUM(E${first}:E${last})` }, '', { f: `SUM(G${first}:G${last})` }] });
  sheet.rows.push({ cells: ['As laid by the rooms\' scenes (3D); the glue, the grout, the silicone and the work not counted.'] });
  return sheet;
}

/**
 * The inner doors, each by its label, its floor: what is bought for it (its product and its extras: the handle); a door with
 * none yet: to choose. The prices the viewer may change; their sum.
 * @param {Node} house @param {Catalog} catalog @param {Hierarchy} H @returns {Sheet}
 */
export function doorsSheet(house, catalog, H) {
  const sheet = /** @type {Sheet & { rows: Row[] }} */ ({ name: 'Doors', cols: [{ width: 34, share: 2 }, { width: 14, share: 1 }, { width: 50, share: 4 }, { width: 12, digits: 2, fix: 10, z: MONEY }],
    rows: [{ kind: 'title', cells: ['Inner doors'] }, { kind: 'head', cells: ['Door', 'Floor', 'Bought', 'Price [zł]'] }] });
  const first = sheet.rows.length + 1;
  /** @type {Node[]} */
  const doors = [];
  H.walk(n => { if (n.type === 'door' && H.path(n).startsWith(H.path(house) + '/')) doors.push(n); });
  for (const d of doors) {
    let floor = H.parent(d);
    while (floor && H.parent(floor) !== house) floor = H.parent(floor);
    const where = `${d.label || ''} ${d.id.replace(/^door_/, '').replace(/_/g, ' ')}`.trim();
    const keys = d.product ? [d.product, ...(d.extras || [])] : [null];
    for (const key of keys) {
      const P = key ? /** @type {any} */ (catalog.product(key)) : null;
      sheet.rows.push({ cells: [where, floor?.name || '', P ? P.name : 'to choose', P && P.price !== null && P.price !== undefined ? { v: P.price, input: true } : ''] });
    }
  }
  sheet.rows.push({ kind: 'sum', cells: ['Total', '', '', { f: `SUM(D${first}:D${sheet.rows.length})` }] });
  return sheet;
}

/** the house's notes, under its source @param {Node} house @returns {Sheet} */
export const notesSheet = house => ({ name: 'Notes', cols: [{ width: 120, share: 1, max: 140 }],
  rows: [{ kind: 'title', cells: [house.source || house.name] }, { kind: 'head', cells: ['Notes'] }, ...(house.notes || []).map((/** @type {string} */ n) => ({ cells: [n] }))] });

/** the house's sheets: Rooms, Tiles, Doors, Notes @param {Node} house @param {Catalog} catalog @param {Hierarchy} H @returns {Sheet[]} */
export const houseSheets = (house, catalog, H) => [roomsSheet(house), tilesSheet(house, catalog), doorsSheet(house, catalog, H), notesSheet(house)];
