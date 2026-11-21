// @ts-check
/* core/format.js: how numbers are written, the same on every page and in every sheet. Knows no project and no browser. */
function formatModule() {
'use strict';

const LOCALE = 'en-GB';
/* a number with exactly d decimals: fmt(12, 2) = '12.00', fmt(1234.5, 1) = '1,234.5' */
const fmt = (/** @type {number} */ v, /** @type {number} */ d) => v.toLocaleString(LOCALE, { minimumFractionDigits: d, maximumFractionDigits: d });

return { LOCALE, fmt };
}
HOME.format = formatModule();
