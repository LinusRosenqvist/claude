// Testa touchkontrollerna i ett emulerat mobilfönster.
const { chromium, devices } = require('playwright');
(async () => {
  const [url, outdir] = process.argv.slice(2);
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 844, height: 390 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  const page = await ctx.newPage();
  const logs = [];
  page.on('pageerror', (e) => logs.push('PAGEERROR: ' + e.message));
  page.on('console', (m) => { if (m.type() === 'error') logs.push('console: ' + m.text()); });
  await page.goto(url);
  await page.waitForTimeout(800);
  await page.touchscreen.tap(422, 200);
  await page.waitForTimeout(500);
  await page.screenshot({ path: outdir + '/m_title.png' });
  // tryck på SPELA (mitten av menyn)
  await page.touchscreen.tap(422, 205);
  await page.waitForTimeout(1500);
  await page.screenshot({ path: outdir + '/m_after.png' });
  const btn = async (sel) => page.evaluate((s) => { const r = document.querySelector(s).getBoundingClientRect(); return { x: r.x + r.width / 2, y: r.y + r.height / 2 }; }, sel);
  const cdp = await ctx.newCDPSession(page);
  async function hold(sel, ms) {
    const p = await btn(sel);
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: p.x, y: p.y, id: 1 }] });
    await page.waitForTimeout(ms);
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  }
  // gå till en nivå direkt
  await page.goto(url + '?level=1-1');
  await page.waitForTimeout(600);
  await page.touchscreen.tap(422, 200);
  await page.waitForTimeout(2200);
  await hold('.tb-right', 900);
  await hold('.tb-jump', 200);
  await page.waitForTimeout(200);
  await page.screenshot({ path: outdir + '/m_play.png' });
  const st = await page.evaluate(() => { const w = HK.Game.scene.world; return { x: w.player.x, touch: HK.Input.touch.visible }; });
  console.log('state', JSON.stringify(st));
  for (const l of logs) console.log(l);
  await browser.close();
})();
