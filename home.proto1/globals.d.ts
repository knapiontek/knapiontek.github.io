// Only for the check (jsconfig.json): the one global HOME (core/load.js: the data channel) and what the pages get from outside. Not loaded by any page.
interface Home { data: ReturnType<typeof coreLoadModule>['data']; load: ReturnType<typeof coreLoadModule>['load']; }
declare var HOME: Home;
declare var THREE: any;      // three.js r128, from its CDN
declare var Alpine: any;     // Alpine.js 3, from its CDN
interface Window { HOME: Home; XLSX: any; }
