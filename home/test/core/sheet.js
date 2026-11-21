/* core/sheet.js: its public API, each part with what it gives; what needs the browser (the Documents screen, XLSX) is not
   called here (test/test.md) */
function sheetTest({ sheetModule, uiModule, toolsModule }, data, check) {
  const tools = toolsModule(), sheet = sheetModule(uiModule(tools), tools);
  check('the public API', Object.keys(sheet).join(' ') === 'evaluator xlsx view menu');

  const { formula, input } = tools;
  const book = { sheets: [
    { name: 'Boards', rows: [{ cells: ['Oak', input(4), input(100), formula('ROUND(B1*C1,2)')] }, { cells: ['Ash', input(2), input(80), formula('ROUND(B2*C2,2)')] }, { cells: ['Sum', '', '', formula('SUM(D1:D2)')] }] },
    { name: 'Total', rows: [{ cells: [formula("'Boards'!D3*1.1"), formula('ROUNDUP(2*3/4,0)'), 'text', formula('C1+1')] }] }] };
  const value = sheet.evaluator(book);
  check('evaluator: a formula of the cells on its row', value(book.sheets[0], 3, 1) === 400);
  check('evaluator: SUM over a range', value(book.sheets[0], 3, 3) === 560);
  check('evaluator: another sheet\'s cell', Math.abs(value(book.sheets[1], 0, 1) - 616) < 1e-9);
  check('evaluator: ROUNDUP', value(book.sheets[1], 1, 1) === 2);
  check('evaluator: text counts as 0, as in Excel', value(book.sheets[1], 3, 1) === 1);
}
