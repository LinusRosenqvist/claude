// Genererar många banor i oändligt läge och kontrollerar att Kevin alltid går att nå.
// Usage: node tools/validate-endless.js [antal frön] [max runda]
'use strict';
const { load } = require('./harness');
const HK = load({ levelFiles: [] });
const validate = require('./reach')(HK, {});
const seeds = +(process.argv[2] || 6), rounds = +(process.argv[3] || 12);
let bad = 0, n = 0;
for (let s = 1; s <= seeds; s++) {
  for (let r = 1; r <= rounds; r++) {
    const def = HK.Endless.generate(r, s * 1000 + 7);
    const res = validate(def);
    n++;
    const miss = res.goals.filter((g) => !g.ok && !g.soft);
    if (miss.length) {
      bad++;
      console.log('FEL frö ' + s + ' runda ' + r + ' (' + def.theme + ', göm: ' + def.hide + ') ' + miss.map((g) => g.name).join(', ') + '  bitar: ' + def.segments.join(' '));
    }
  }
}
console.log(n - bad + '/' + n + ' banor OK');
process.exit(bad ? 1 : 0);
