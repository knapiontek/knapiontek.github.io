/* core/format.js: its public API, each part with what it gives (test/test.md) */
function formatTest({ formatModule }, data, check) {
  const F = formatModule();
  check('the public API', Object.keys(F).join(' ') === 'LOCALE fmt');

  check('LOCALE: British English, on every page and in every sheet', F.LOCALE === 'en-GB');
  check('fmt: exactly the decimals asked for', F.fmt(12, 2) === '12.00' && F.fmt(0.125, 2) === '0.13' && F.fmt(7.6, 0) === '8');
  check('fmt: thousands with a comma, decimals with a point', F.fmt(1234.5, 1) === '1,234.5');
}
