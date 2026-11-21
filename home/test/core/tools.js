/* core/tools.js: its public API, each part with what it gives (test/test.md) */
function coreToolsTest({ coreToolsModule }, data, check) {
  const T = coreToolsModule();
  check('the public API', Object.keys(T).join(' ') === 'LOCALE fmt esc formula input cols money kinds');

  check('LOCALE: British English, on every page and in every sheet', T.LOCALE === 'en-GB');
  check('fmt: exactly the decimals asked for', T.fmt(12, 2) === '12.00' && T.fmt(0.125, 2) === '0.13' && T.fmt(7.6, 0) === '8');
  check('fmt: thousands with a comma, decimals with a point', T.fmt(1234.5, 1) === '1,234.5');

  check('esc: text into HTML', T.esc('a < b & "c"') === 'a &lt; b &amp; &quot;c&quot;' && T.esc(null) === '');

  check('formula and input: a cell computed, a cell the viewer may change', T.formula('A1+1').f === 'A1+1' && T.input(5).v === 5 && T.input(5).input === true);
  const c = T.cols([10, 20, 30], { 2: T.money }, [8, 's2', 's1n16m40']);
  check('cols: the widths, how each shows, and more fields', c[0].width === 10 && c[0].fix === 8 && c[1].share === 2 && c[2].min === 16 && c[2].max === 40 && c[2].digits === 2);
  check('money: two decimals, thousands grouped', T.money.digits === 2 && T.money.z === '#,##0.00');
  const rows = T.kinds([['Title'], ['a', 1], { kind: 'sum', cells: ['b'] }, null]);
  check('kinds: the first row is the title, an object keeps its kind, nothing is an empty row', rows[0].kind === 'title' && rows[1].kind === undefined && rows[2].kind === 'sum' && rows[3].cells.length === 0);
}
