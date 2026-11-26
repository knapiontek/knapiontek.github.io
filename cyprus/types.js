// @ts-check
// types.js: the contracts between the modules of the project: only what one module counts on from another. Types only: no
// code runs here; a module takes a type by import('…/types.js') in a comment, which the browser never loads. core knows none of this.

/* ---------- the library's catalog: what is bought, how a material looks ---------- */

/** @typedef {{ group: string, name: string, unit?: string, price?: number | null, shop?: string, family?: string, metal?: string } & Record<string, unknown>} Product  a product as bought: price in zł gross per unit (null: not known); a family's products differ only by metal or decor; the other fields of its group pass through as the shop and the maker give them */
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

export {};
