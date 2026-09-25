// Slumpa indata i varje nivå och leta efter JavaScript-fel.
const { chromium } = require('playwright');
const path = require('path');
(async () => {
  const ids = process.argv.slice(2);
  const secs = 22;
  const browser = await chromium.launch({ args: ['--autoplay-policy=no-user-gesture-required'] });
  let totalErr = 0;
  for (const id of ids) {
    const page = await browser.newPage({ viewport: { width: 960, height: 540 } });
    const errs = [];
    page.on('pageerror', (e) => errs.push(e.message + ' | ' + (e.stack || '').split('\n').slice(1, 3).join(' ')));
    page.on('console', (m) => { if (m.type() === 'error') errs.push('console: ' + m.text()); });
    await page.goto('file://' + path.join(__dirname, '..', 'index.html') + '?level=' + id);
    await page.waitForTimeout(2300);
    const keys = ['KeyA', 'KeyD', 'Space', 'KeyJ', 'KeyE', 'KeyS', 'KeyW', 'ShiftLeft'];
    const held = new Set();
    const t0 = Date.now();
    let frames = 0;
    while (Date.now() - t0 < secs * 1000) {
      const k = keys[Math.floor(Math.random() * keys.length)];
      if (held.has(k)) { await page.keyboard.up(k); held.delete(k); } else { await page.keyboard.down(k); held.add(k); }
      if (Math.random() < 0.3) {
        const x = Math.random() * 960, y = Math.random() * 540;
        await page.mouse.move(x, y);
        await page.mouse.down(); await page.mouse.up();
      }
      // håll oftast höger för att ta sig framåt
      if (Math.random() < 0.5 && !held.has('KeyD')) { await page.keyboard.down('KeyD'); held.add('KeyD'); }
      await page.waitForTimeout(120 + Math.random() * 200);
      frames++;
    }
    const st = await page.evaluate(() => { const w = HK.Game.scene && HK.Game.scene.world; return w ? { x: Math.round(w.player.x / 16), hp: w.player.hp, deaths: w.stats.deaths, t: w.t } : null; });
    console.log(id, JSON.stringify(st), errs.length ? 'FEL: ' + errs.slice(0, 3).join(' || ') : 'inga fel');
    totalErr += errs.length;
    await page.close();
  }
  await browser.close();
  process.exit(totalErr ? 1 : 0);
})();
