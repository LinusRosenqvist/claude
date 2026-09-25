// Laddar spelets moduler i Node (utan webbläsare) för simulering och test.
const fs = require('fs');
const path = require('path');
const vm = require('vm');

function fakeCtx() {
  const noop = () => {};
  return new Proxy({}, {
    get(t, k) {
      if (k === 'createImageData') return (w, h) => ({ data: new Uint8ClampedArray(w * h * 4) });
      if (k === 'createRadialGradient' || k === 'createLinearGradient') return () => ({ addColorStop: noop });
      if (k === 'createPattern') return () => ({});
      if (k === 'measureText') return () => ({ width: 0 });
      if (k in t) return t[k];
      return noop;
    },
    set(t, k, v) { t[k] = v; return true; },
  });
}

function load(opts) {
  opts = opts || {};
  const root = path.join(__dirname, '..');
  const document = {
    createElement() { return { width: 0, height: 0, getContext: () => fakeCtx(), style: {}, dataset: {}, classList: { toggle() {} }, appendChild() {} }; },
    getElementById() { return null; },
    addEventListener() {},
    body: { appendChild() {}, addEventListener() {} },
    hidden: false,
    readyState: 'complete',
  };
  const window = {
    document, addEventListener() {}, localStorage: { getItem() { return null; }, setItem() {} },
    innerWidth: 960, innerHeight: 540, devicePixelRatio: 1, location: { search: '' },
    requestAnimationFrame() {}, performance: { now: () => 0 },
  };
  window.window = window;
  const ctx = vm.createContext({ window, document, console, Math, Date, JSON, setInterval() {}, clearInterval() {}, navigator: {}, performance: window.performance, requestAnimationFrame() {}, URLSearchParams });
  const files = ['util', 'font', 'input', 'sprites', 'art', 'engine', 'fx', 'audio', 'themes', 'tiles', 'level', 'player', 'entities', 'enemies', 'world', 'hud', 'save'];
  for (const f of files) vm.runInContext(fs.readFileSync(path.join(root, 'js', f + '.js'), 'utf8'), ctx, { filename: f + '.js' });
  const levelFiles = opts.levelFiles || fs.readdirSync(path.join(root, 'js', 'levels')).filter((f) => f.endsWith('.js')).sort();
  for (const f of levelFiles) vm.runInContext(fs.readFileSync(path.join(root, 'js', 'levels', f), 'utf8'), ctx, { filename: f });
  return window.HK;
}

module.exports = { load };
