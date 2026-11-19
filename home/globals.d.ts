// Only for the check (jsconfig.json): what the pages get from outside. Not loaded by any page.
/** HOME: the one global; each file adds its module (HOME.load, HOME.ui, HOME.cabinets, …). */
interface Home { [module: string]: any }
declare var HOME: Home;
declare var THREE: any;      // three.js r128, from its CDN
declare var Alpine: any;     // Alpine.js 3, from its CDN
interface Window { HOME: Home; XLSX: any; }
