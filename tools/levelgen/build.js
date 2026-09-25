// Bygger js/levels/worldN.js från nivåskripten i tools/levelgen/wN.js
'use strict';
const fs = require('fs');
const path = require('path');
const out = path.join(__dirname, '..', '..', 'js', 'levels');
const worlds = process.argv.slice(2).length ? process.argv.slice(2).map(Number) : [1, 2, 3, 4, 5, 6];
for (const n of worlds) {
  const file = path.join(__dirname, 'w' + n + '.js');
  if (!fs.existsSync(file)) continue;
  delete require.cache[require.resolve(file)];
  const builders = require(file);
  const defs = builders.map((b) => b());
  let js = '/* Hitta Kevin — värld ' + n + ' (genererad av tools/levelgen/build.js, redigera w' + n + '.js) */\n';
  js += '(function (HK) {\n  \'use strict\';\n  HK.LEVELS = HK.LEVELS || [];\n';
  for (const d of defs) {
    const rows = d.rows;
    const meta = Object.assign({}, d);
    delete meta.rows;
    js += '  HK.LEVELS.push(Object.assign(' + JSON.stringify(meta) + ', {\n    rows: [\n';
    for (const r of rows) js += '      ' + JSON.stringify(r) + ',\n';
    js += '    ],\n  }));\n';
  }
  js += '})(window.HK);\n';
  fs.writeFileSync(path.join(out, 'world' + n + '.js'), js);
  console.log('world' + n + ': ' + defs.map((d) => d.id + ' ' + d.rows[0].length + 'x' + d.rows.length).join(', '));
}
