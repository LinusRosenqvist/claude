// Usage: node tools/play.js <url> <outdir> '<json steps>' [w h]
// steps: {wait:ms} {down:'KeyD'} {up:'KeyD'} {press:'Space', ms} {click:[x,y]} {rclick:[x,y]} {move:[x,y]} {shot:'name'} {eval:'js'} {log:'js'}
const { chromium } = require('playwright');
(async () => {
  const [url, outdir, stepsJson, w = 960, h = 540] = process.argv.slice(2);
  const steps = JSON.parse(stepsJson);
  const browser = await chromium.launch({ args: ['--autoplay-policy=no-user-gesture-required'] });
  const page = await browser.newPage({ viewport: { width: +w, height: +h } });
  const logs = [];
  page.on('console', (m) => { if (m.type() === 'error' || m.type() === 'warning') logs.push(m.type() + ': ' + m.text()); });
  page.on('pageerror', (e) => logs.push('PAGEERROR: ' + e.message + '\n' + (e.stack || '').split('\n').slice(0, 5).join('\n')));
  await page.goto(url);
  await page.waitForTimeout(400);
  for (const s of steps) {
    if (s.wait) await page.waitForTimeout(s.wait);
    if (s.down) await page.keyboard.down(s.down);
    if (s.up) await page.keyboard.up(s.up);
    if (s.press) { await page.keyboard.down(s.press); await page.waitForTimeout(s.ms || 80); await page.keyboard.up(s.press); }
    if (s.move) await page.mouse.move(s.move[0], s.move[1]);
    if (s.click) { await page.mouse.move(s.click[0], s.click[1]); await page.mouse.down(); await page.waitForTimeout(40); await page.mouse.up(); }
    if (s.rdown) { await page.mouse.move(s.rdown[0], s.rdown[1]); await page.mouse.down({ button: 'right' }); }
    if (s.rup) await page.mouse.up({ button: 'right' });
    if (s.eval) { try { await page.evaluate(s.eval); } catch (e) { logs.push('EVAL: ' + e.message); } }
    if (s.log) { try { console.log('log:', JSON.stringify(await page.evaluate(s.log))); } catch (e) { logs.push('LOG: ' + e.message); } }
    if (s.shot) await page.screenshot({ path: outdir + '/' + s.shot + '.png' });
  }
  for (const l of logs) console.log(l);
  await browser.close();
})();
