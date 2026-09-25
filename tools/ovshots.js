// Usage: node tools/ovshots.js <levelId> <outdir> [segW=1200]
const { chromium } = require('playwright');
const path = require('path');
(async () => {
  const [id, outdir, segW = 1200] = process.argv.slice(2);
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1300, height: 800 } });
  const logs = [];
  page.on('pageerror', (e) => logs.push('PAGEERROR: ' + e.message));
  await page.goto('file://' + path.join(__dirname, 'overview.html') + '?level=' + id);
  await page.waitForFunction(() => window.__done === true, null, { timeout: 20000 }).catch(() => logs.push('timeout'));
  const size = await page.evaluate(() => { const c = document.getElementById('c'); return { w: c.width, h: c.height }; });
  const n = Math.ceil(size.w / segW);
  for (let i = 0; i < n; i++) {
    const x = i * segW;
    await page.screenshot({ path: `${outdir}/ov_${id}_${i}.png`, clip: { x, y: 0, width: Math.min(segW, size.w - x), height: size.h }, fullPage: true });
  }
  console.log(id, size, 'segments', n);
  for (const l of logs) console.log(l);
  await browser.close();
})();
