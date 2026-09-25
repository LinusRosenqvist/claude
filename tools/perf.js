// Mät hur lång tid update+render tar per bildruta i några nivåer.
const { chromium } = require('playwright');
const path = require('path');
(async () => {
  const ids = process.argv.slice(2);
  const browser = await chromium.launch();
  for (const id of ids) {
    const page = await browser.newPage({ viewport: { width: 960, height: 540 } });
    await page.goto('file://' + path.join(__dirname, '..', 'index.html') + '?level=' + id);
    await page.waitForTimeout(2300);
    const r = await page.evaluate(() => {
      const G = HK.Game;
      const sc = G.scene;
      sc.state = 'play'; sc.world.cutscene = false;
      const w = sc.world;
      const res = [];
      for (const frac of [0.25, 0.5, 0.75]) {
        w.player.x = w.level.pw * frac; w.player.y = 20; w.player.inv = 99999;
        for (let i = 0; i < 30; i++) { G.update(); }
        const t0 = performance.now();
        const N = 120;
        for (let i = 0; i < N; i++) { G.update(); G.render(); }
        res.push(((performance.now() - t0) / N).toFixed(2));
      }
      return res;
    });
    console.log(id, 'ms/frame:', r.join(' '));
    await page.close();
  }
  await browser.close();
})();
