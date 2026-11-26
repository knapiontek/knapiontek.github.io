// @ts-check
// types.js: the contracts between the modules of the project. Types only: no code runs here; a module takes a type by
// import('…/types.js'), which is gone when it runs. A module implements a contract, index.js joins the implementations;
// core knows none of this.

/* ---------- the library: the outside world, what is bought and how a material looks ---------- */

/** @typedef {{ name: string, url: string }} Link */
/** @typedef {{ name: string, links?: Link[] }} Shop  a shop or a workshop */
/** @typedef {{ width: number, height: number, depth: number }} Size  outer sizes, mm */

/**
 * @typedef {object} Bought  what every product has: how it is ordered
 * @property {string} name  as the shop gives it
 * @property {string} [spec]  what it is, as bought
 * @property {string} [code]  the maker's model (a board: its decor code)
 * @property {string} [maker]
 * @property {string} [unit]  pc, sheet, m, m², pack…
 * @property {number | null} [price]  zł gross per unit; null: not known
 * @property {string} [priceNote]  where the price comes from, how sure
 * @property {string} [shop]  a shop's key
 * @property {Link[]} [links]  the maker's documents first, then shops
 * @property {string} [note]  a remark on buying it
 * @property {string} [family]  products of one family differ only by metal or decor
 * @property {string} [metal]  a material's key: the product's metal, within its family
 * @property {string} [draw]  how it is drawn (the shapes step)
 * @property {string} [source]  where its sizes come from
 */

/** @typedef {Bought & { group: 'appliances', body: { width: number, depth: number, height?: number }, fascia?: { width: number, height: number, thickness: number, bottom: number }, door?: { hinge: string, height?: number }, doors?: { fridge: { bottom: number, top: number }, freezer: { bottom: number, top: number } }, doorDepth?: number, controlPanelHeight?: number, controlColumnWidth?: number, baseSetback?: number, glass?: { width: number, depth: number }, bowl?: Size, rim?: number, wall?: number, chimney?: { width: number, depth: number } }} Appliance  a built-in appliance: body, fascia, doors as the maker draws them */
/** @typedef {Bought & { group: 'boards', decor?: string, thickness: number, length?: number, width?: number, depth?: number, color: string, core?: string, coreSurface?: 'chipboard' | 'fibre', lacquered?: boolean, frameWidth?: number, factoryEdges?: string[], twoSided?: boolean, texture?: string }} Board  a board as sold: a sheet (length × width), a worktop or panel (depth), or by the metre */
/** @typedef {Bought & { group: 'building', body?: Size, shape?: unknown[] }} BuildingProduct  a building product: a pipe, a hatch, a screw… */
/** @typedef {Bought & { group: 'fasteners' }} Fastener */
/** @typedef {Bought & { group: 'hardware', cupDepth?: number, runnerWidth?: number, sideThickness?: number, sideFromCarcass?: number, fromBack?: number, fromFront?: number, length?: number, width?: number, height?: number, radius?: number, footRadius?: number, footHeight?: number }} Hardware  hinges, runners, handles, legs: the sizes the maker gives */
/** @typedef {Bought & { group: 'sanitary', body?: Size, material?: string, wall?: number, shelf?: number, height?: number, spout?: number, fixed?: number, door?: { at: number[], angle: number, sign: number }, shape?: unknown[] }} Sanitary  a basin, a tap, a shower, a WC… */
/** @typedef {Bought & { group: 'services' }} Service  work bought: cutting, edging */
/** @typedef {Bought & { group: 'tiles', look?: string, finish?: string, texture: string, len: number, wid: number, joint: number, minCut: number[], pattern: 'grid' | 'half' | 'third' | 'quarter' | 'random', formats?: string[] }} Tile  a tile, 8 mm: its size len × wid, its joint, the smallest piece [along, across] */
/** @typedef {Appliance | Board | BuildingProduct | Fastener | Hardware | Sanitary | Service | Tile} Product  a product of the library; its group tells its fields */

/**
 * @typedef {object} Material  how a material looks; at most one generated surface (texture, grass, slabs, wood, image)
 * @property {string} [color]
 * @property {number} [roughness]
 * @property {number} [metalness]
 * @property {number} [opacity]  glass
 * @property {number} [reflect]  strength of the sky's reflection
 * @property {number} [clearcoat]  lacquer over the colour
 * @property {number} [clearcoatRoughness]
 * @property {string} [emissive]  a light
 * @property {number} [glow]
 * @property {'metal'} [finish]  a metal offered as a finish
 * @property {string} [name]  a finish's name
 * @property {{ strength: number, grain: number, tile: number }} [texture]  plaster grain
 * @property {{ tile: number }} [grass]
 * @property {{ size: number, joint: string }} [slabs]  paving
 * @property {{ decor: string, board: number, vertical: boolean }} [wood]  boards cut from a decor
 * @property {{ key: string, turn: boolean }} [image]  a decor photo
 * @property {string | { hatch: string[] }} [plan]  the 2D section fill: a colour or a hatch [ground, line]
 */

/** @typedef {{ name: string, kind: 'wood' | 'stone', source: string, size: number[], grout?: string, faces: string[] }} Texture  one image: size: mm it covers [along the grain or length, across]; faces: the images as data URLs */

/* the library's data files (JSON); each says its format and version */
/** @typedef {{ format: 'library', version: 1, groups: string[] }} LibraryFile  library/library.json: the product groups, in order */
/** @typedef {Bought & Record<string, unknown>} ProductData  a product as its file gives it: its group's fields, without the group */
/** @typedef {{ format: 'products', version: 1, products: Record<string, ProductData> }} ProductsFile  library/products/<group>.json: a group's products by key */
/** @typedef {{ format: 'materials', version: 1, materials: Record<string, Material> }} MaterialsFile  library/materials.json */
/** @typedef {{ format: 'shops', version: 1, shops: Record<string, Shop> }} ShopsFile  library/shops.json */
/** @typedef {{ format: 'texture', version: 1 } & Texture} TextureFile  library/textures/<key>.json */

/**
 * @typedef {object} Catalog  what the library's catalog gives the other modules: the products, the materials, the textures, the shops
 * @property {string[]} groups  the product groups, in order
 * @property {(group: string) => string[]} products  the keys of a group's products, in order
 * @property {(key: string) => Product} product  a product by its key; an unknown key throws
 * @property {(key: string) => string[]} variants  the products of its family, itself among them; with no family only itself
 * @property {() => string[]} materials  every material's key
 * @property {(key: string) => Material} material  a material by its key; an unknown key throws
 * @property {(key: string) => Promise<Texture>} texture  an image by its key, loaded once
 * @property {(key: string) => Shop} shop  a shop by its key; an unknown key throws
 */

/** @typedef {() => Promise<Catalog>} OpenCatalog  the catalog, its files read */

export {};
