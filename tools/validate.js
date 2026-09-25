// Kontrollerar att Kevin och alla diamanter går att nå i varje nivå.
// Usage: node tools/validate.js [nivå-id ...] [--map]
'use strict';
const { load } = require('./harness');
const HK = load();
const args = process.argv.slice(2);
const ids = args.filter((a) => !a.startsWith('--'));
const validate = require('./reach')(HK, { map: args.includes('--map') });

let allOk = true;
for (const def of HK.LEVELS) {
  if (ids.length && !ids.includes(def.id)) continue;
  const t0 = Date.now();
  const r = validate(def);
  const bad = r.goals.filter((g) => !g.ok);
  allOk = allOk && r.ok;
  console.log((r.ok ? 'OK  ' : 'FEL ') + def.id + '  noder=' + r.nodes + ' sim=' + r.sims + ' ' + (Date.now() - t0) + 'ms' + (bad.length ? '  ONÅBART: ' + bad.map((g) => g.name + (g.soft ? '(mjuk)' : '')).join(', ') : ''));
}
process.exit(allOk ? 0 : 1);
