// @ts-check
// types.js: the contracts between the modules of the project: only what one module counts on from another. Types only: no
// code runs here; a module takes a type by import('…/types.js') in a comment, which the browser never loads. core knows none of this.

/* ---------- the library's catalog: what is bought, how a material looks ---------- */

/** @typedef {{ group: string, name: string, unit?: string, price?: number | null, priced?: string, shop?: string, family?: string, metal?: string } & Record<string, unknown>} Product  a product as bought: price in zł gross per unit (null: not known), as last checked: priced, the month (YYYY-MM; none: not known), shop, where; a family's products differ only by metal, decor or length (runners); the other fields of its group pass through as the shop and the maker give them */
/** @typedef {Product & { thickness: number, length?: number, width?: number }} Board  a board (group boards), as an estimate and the cabinets read it: a sheet length × width */
/** @typedef {Product & { texture: string, len: number, wid: number, joint: number, minCut: number[], pattern: string }} Tile  a tile (group tiles), as a layout reads it: len × wid, the joint, the smallest piece [along, across] */
/** @typedef {Record<string, unknown>} Material  how a material looks; the scene reads it (its type comes with the scene) */
/** @typedef {{ kind: 'wood' | 'stone', size: number[], faces: string[] }} Texture  an image: size, mm one image covers [along, across]; faces, data URLs */
/** @typedef {{ name: string }} Shop */

/**
 * @typedef {object} Catalog  what the catalog gives the other modules
 * @property {string[]} groups  the product groups, in order
 * @property {(group: string) => string[]} products  the keys of a group's products, in order
 * @property {(key: string) => Product} product  a product by its key; an unknown key throws
 * @property {(key: string) => string[]} variants  the products of its family, itself among them; with no family only itself
 * @property {() => string[]} materials  every material's key
 * @property {(key: string) => Material} material  a material by its key; an unknown key throws
 * @property {(key: string) => Promise<Texture>} texture  an image by its key, read once
 * @property {(key: string) => Shop} shop  a shop by its key; an unknown key throws
 */
/** @typedef {() => Promise<Catalog>} OpenCatalog  the catalog, its files read */

/* ---------- parts: what is drawn of a node, in its own axes (a product's: library/shapes.js; an element's: its builder); the
   scene places them and gives them their look ---------- */

/** @typedef {number[]} Vec  [x, y, h], mm, in the node's own axes, 0 its zero; the model's axes, right-handed (core/tools.js): a product's or a run of cabinets': zero at its back (the wall), its left end as one sees its front, bottom; x to the right, y toward the wall (the front at negative y), h up */
/**
 * @typedef {object} Part  one solid of a node
 * @property {'box' | 'prism' | 'cylinder' | 'ring' | 'disc' | 'plane' | 'sphere' | 'torus' | 'extrude' | 'tube' | 'mesh' | 'text'} form
 * @property {string} material  a key of materials.json; 'board:' and a board's key: the board of the library (its decor, lacquer or colour); or 'metal': the fittings' metal, set by Finish
 * @property {string} [layer]  its own layer, before its node's
 * @property {string} [floor]  its own floor, before its node's (what lies over both floors, split)
 * @property {string} [mover]  the id of the moving part it moves with: one of the shape's movers, or one the room gives (a fridge door carried by a cabinet front); none: it stands
 * @property {number[]} [box]  box: [x0, x1, y0, y1, h0, h1]
 * @property {number[]} [x]  prism: [x1, x2], along x
 * @property {number[][]} [poly]  prism: its section, a convex polygon of [y, h] points, counter-clockwise
 * @property {Record<string, string>} [faces]  prism: a face's material by its side: top, bottom, ends (along x), eaves (a side at an eaves' y), reveals (the other sides)
 * @property {Vec} [uvAt]  where its texture starts, in its node's axes (a tile's corner: the tile's photo from there)
 * @property {{ n: Vec, material: string }} [face]  a finish on one face: the face toward n (in its node's axes) in this material, the others in the part's (a tile: its face toward the room)
 * @property {number[]} [eaves]  prism: the y of its outer edges, where a side is an eave
 * @property {string} [raw]  the material when its finish's layer is off (EPS under its facade)
 * @property {string} [finish]  the layer of its finish
 * @property {string} [cap]  the material of its cut, in a section (2D)
 * @property {Vec} [at]  the others' middle (extrude: the start of its depth)
 * @property {Vec} [axis]  cylinder, torus, extrude: along it; ring, disc, plane, text: the way it faces
 * @property {number[]} [radius]  cylinder: [bottom, top]; ring: [inner, outer]; disc, sphere, torus, tube: [r]
 * @property {number} [length]  cylinder: its length; extrude: its depth
 * @property {number[]} [size]  plane, text: [width, height]
 * @property {number} [tube]  torus: the tube's radius
 * @property {number[]} [arc]  sphere: [from, to] of the angle down from the top, radians; cylinder, disc: [from, to] round it
 * @property {boolean} [open]  cylinder: no ends
 * @property {'back' | 'double'} [side]  the faces drawn: inside, or both; none: outside
 * @property {number[][]} [outline]  extrude: [y, h] points of its section
 * @property {string} [ends]  extrude: the material of its two ends
 * @property {Vec[]} [points]  tube: the line it follows
 * @property {number[]} [positions]  mesh: x, y, h of each point
 * @property {number[]} [index]  mesh: three points per triangle
 * @property {number[]} [matrix]  mesh: its rows x, y, h of the product: [a, b, c, d] each, x = a·px + b·py + c·pz + d
 * @property {string} [text]  text: what it shows
 * @property {number} [segments]  round forms: the facets round
 * @property {false} [edges]  false: drawn without its edges (the lawn)
 */
/** @typedef {{ id: string, pivot: Vec, axis: Vec, sign: 1 | -1, travel: number }} Mover  a moving part: turning about the axis through its pivot, toward sign, travel degrees */
/** @typedef {{ kind: 'spot' | 'point', at: Vec, target?: Vec, color: string, intensity: number, distance: number, angle?: number, penumbra?: number, decay: number, shadow: boolean }} Light  a light a product carries, lit at night */
/** @typedef {{ box: number[], name: string }} Envelope  a box documents give the sizes of: [x0, x1, y0, y1, h0, h1] */
/** @typedef {{ size: Vec, parts: Part[], movers: Mover[], lights: Light[], envelopes: Envelope[], anchor?: Vec }} Shape  a product as drawn: size, its outer box; anchor: the point the room places it by (none: its zero) */
/** @typedef {{ feet?: number, worktop?: number, opens?: 'in' | 'out', angle?: number, drop?: number, reach?: number, toWall?: number, hand?: 'left' | 'right' | 'lying', gap?: number, edge?: number, width?: number, depth?: number, left?: number, right?: number, front?: number, height?: number }} ShapeOptions  what the room decides: an oven's feet (mm), how far below a hood the worktop is, which way a shower door opens and how far (degrees); a trap's drop and reach (within its maker's ranges) and its pipe to the wall; a fitting's hand (the side it is on), the gap before a door, a hinge's door edge from the side, the room it fits in (width, depth, left, right), a front's thickness, a leg's height */
/** @typedef {(product: Product, size?: Vec, options?: ShapeOptions) => Shape} ShapeOf  a product's shape; size: its node's, for what fits to it (a pipe's length, a hood's chimney up to the ceiling) */

export {};
