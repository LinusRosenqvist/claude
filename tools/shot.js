// Usage: node tools/shot.js <url> <out.png> [w] [h] [waitMs] [js-to-eval-before-shot]
const { chromium } = require('playwright');
(async () => {
  const [url, out, w = 1400, h = 900, wait = 500, js] = process.argv.slice(2);
  const browser = await chromium.launch({ args: ['--autoplay-policy=no-user-gesture-required', '--allow-file-access-from-files'] });
  const page = await browser.newPage({ viewport: { width: +w, height: +h } });
  const logs = [];
  page.on('console', (m) => logs.push(m.type() + ': ' + m.text()));
  page.on('pageerror', (e) => logs.push('PAGEERROR: ' + e.message + '\n' + (e.stack || '')));
  await page.goto(url);
  await page.waitForTimeout(+wait);
  if (js) { try { const r = await page.evaluate(js); if (r !== undefined) console.log('eval:', JSON.stringify(r)); } catch (e) { logs.push('EVALERROR: ' + e.message); } await page.waitForTimeout(200); }
  await page.screenshot({ path: out, fullPage: true });
  for (const l of logs) console.log(l);
  await browser.close();
})();
