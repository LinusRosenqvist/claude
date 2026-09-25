// Regressionstest: går det att hoppa från varje rörlig plattform i spelet?
const { chromium } = require('playwright');
const path = require('path');
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 960, height: 540 } });
  const errs = [];
  page.on('pageerror', (e) => errs.push(e.message));
  await page.goto('file://' + path.join(__dirname, '..', 'index.html') + '?level=1-1');
  await page.waitForTimeout(1500);
  const res = await page.evaluate(() => {
    const out = [];
    const I = HK.Input;
    const orig = { held: I.held, hit: I.hit, axisX: I.axisX };
    let press = false, hold = false;
    I.held = (a) => (a === 'jump' ? hold : false);
    I.hit = (a) => (a === 'jump' ? press : false);
    I.axisX = () => 0;
    HK.LEVELS.forEach((def, idx) => {
      const W = new HK.World(def, {});
      W.cutscene = false;
      W.enemies.length = 0;
      W.platforms.forEach((pl, pi) => {
        if (pl.kind === 'fall') return;
        const p = W.player;
        for (let i = 0; i < 90; i++) {
          p.x = pl.x + pl.w / 2 - p.w / 2; p.y = pl.y - p.h; p.vy = 0; p.platform = pl; p.dead = false; p.inv = 999; p.hp = 3;
          W.update();
        }
        const y0 = p.y;
        press = true; hold = true; W.update(); press = false;
        let minY = p.y;
        for (let i = 0; i < 20; i++) { W.update(); minY = Math.min(minY, p.y); }
        hold = false;
        out.push({ level: def.id, plat: pi, kind: pl.kind, rise: Math.round(y0 - minY) });
      });
    });
    I.held = orig.held; I.hit = orig.hit; I.axisX = orig.axisX;
    return out;
  });
  let bad = 0;
  for (const r of res) {
    const ok = r.rise > 30;
    if (!ok) bad++;
    console.log((ok ? 'OK  ' : 'FEL ') + r.level + ' plattform ' + r.plat + ' (' + r.kind + ') hopp ' + r.rise + ' px');
  }
  if (errs.length) console.log('Fel på sidan:', errs.join(' | '));
  await browser.close();
  process.exit(bad || errs.length ? 1 : 0);
})();
