// Mät spelarens hoppförmåga med den riktiga fysiken.
const { load } = require('./harness');
const HK = load({ levelFiles: [] });
const T = HK.T;
function mkWorld(gravity) {
  const w = 60, h = 40;
  const rows = [];
  for (let y = 0; y < h; y++) rows.push((y >= 30 ? '#' : '.').repeat(w));
  const level = new HK.Level({ id: 'x', theme: 'kullar', rows });
  const W = { level, gravity, wind: 0, stats: { hits: 0, deaths: 0 }, game: { shake() {}, hitstop: 0 }, cam: { x: 0, y: 0 },
    bumpTile() {}, platformCollide() {}, jetFlame() {}, autoAim() { return null; }, magnetPull() {}, playerFellOut(p) { p.simDead = true; }, playerInLiquid(p) { p.simDead = true; }, onPlayerDied() {}, endDisco() {}, cutscene: false };
  return W;
}
const inp = { held: {}, hit: {} };
HK.Input.held = (a) => !!inp.held[a];
HK.Input.hit = (a) => !!inp.hit[a];
HK.Input.axisX = () => (inp.held.left ? -1 : 0) + (inp.held.right ? 1 : 0);
HK.Input.shootSource = 'button';
function jump(gravity, run, hold) {
  const W = mkWorld(gravity);
  const p = new HK.Player(W, 100, 30 * 16 - 18);
  W.player = p;
  p.onGround = true;
  p.vx = run ? HK.PH.walk : 0;
  let minY = p.y, t = 0, startX = p.x, maxDX = 0;
  // run-up grounded
  for (let f = 0; f < 200; f++) {
    inp.held = { right: run || true };
    inp.hit = {};
    if (f === 0) { inp.hit.jump = true; }
    if (f < hold) inp.held.jump = true;
    p.update();
    minY = Math.min(minY, p.y);
    if (f > 2 && p.onGround) break;
    t = f;
  }
  return { rise: (30 * 16 - 18) - minY, dist: p.x - startX, t };
}
for (const g of [1, 0.5]) {
  for (const hold of [1, 6, 12, 60]) {
    const a = jump(g, false, hold), b = jump(g, true, hold);
    console.log('g=' + g, 'hold=' + hold, 'stand rise=' + a.rise.toFixed(1) + ' (' + (a.rise / 16).toFixed(2) + ' tiles)', 'run rise=' + b.rise.toFixed(1) + ' (' + (b.rise / 16).toFixed(2) + ') dist=' + (b.dist / 16).toFixed(2) + ' tiles, frames=' + b.t);
  }
}
