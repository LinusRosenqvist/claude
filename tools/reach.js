// Nåbarhetskontroll: simulerar spelarens riktiga fysik från alla ståplatser (BFS).
'use strict';
const fs = require('fs');
const path = require('path');

module.exports = function makeValidator(HK, opts) {
  opts = opts || {};
  const T = HK.T;
  const TS = 16;
  const wantMap = !!opts.map;
  const inp = { held: {}, hit: {} };
  HK.Input.held = (a) => !!inp.held[a];
  HK.Input.hit = (a) => !!inp.hit[a];
  HK.Input.axisX = () => (inp.held.left ? -1 : 0) + (inp.held.right ? 1 : 0);
  HK.Input.keyHit = () => false;
  HK.Input.shootSource = 'button';

  function overlap(a, b) {
    return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
  }

  function validate(def) {
    const level = new HK.Level(def);
    // Förenkla: sprickor kan skjutas bort, osynliga block antas hittade (tegel räknas som fast).
    for (let i = 0; i < level.grid.length; i++) {
      const t = level.grid[i];
      if (t === T.CRACKED) level.grid[i] = T.EMPTY;
      else if (t === T.HIDDEN) level.grid[i] = T.USED;
    }
    const gravity = def.gravity || HK.Themes[def.theme].gravity || 1;
    const plats = [];
    const springs = [];
    const goals = [];
    let start = null;
    let hasJet = !!def.jetpack;
    const rows = level.rows;
    const pdefs = def.platforms || [];
    let pIdx = 0;
    const seen = new Set();
    for (const s of level.spawns) {
      const x = s.x * TS, y = s.y * TS;
      if (s.ch === '@') start = { x: x + 3, y: y + TS - 18 };
      else if (s.ch === 'K') goals.push({ name: 'KEVIN', box: { x: x, y: y - 4, w: 16, h: 20 } });
      else if (s.ch >= '1' && s.ch <= '4') goals.push({ name: 'kevin' + s.ch, box: { x: x, y: y - 4, w: 16, h: 20 }, soft: true });
      else if (s.ch === '*') goals.push({ name: 'gem@' + s.x + ',' + s.y, box: { x: x + 1, y: y + 1, w: 14, h: 14 } });
      else if (s.ch === 's') springs.push({ x: x + 1, y: y + 6, w: 14, h: 10 });
      else if (s.ch === 'j') hasJet = true;
      else if (s.ch === '-' || s.ch === '|') {
        const key = s.y * level.w + s.x;
        if (seen.has(key)) continue;
        let len = 0;
        while (rows[s.y][s.x + len] === s.ch) { seen.add(s.y * level.w + s.x + len); len++; }
        const pd = pdefs[pIdx++] || {};
        const r = (pd.range || 3) * TS;
        for (const off of [-r, -r / 2, 0, r / 2, r]) {
          if (s.ch === '-') plats.push({ x: x + off, y: y + 4, w: len * TS, h: 8 });
          else plats.push({ x, y: y + 4 + off, w: len * TS, h: 8 });
        }
      } else if (s.ch === 'x') plats.push({ x, y: y + 4, w: TS, h: 8 });
      else if (s.ch === 'P') plats.push({ x: x - 4, y, w: 24, h: 8 });
    }
    for (const [i, c] of level.content) if (c === 'jetpack') hasJet = true;
    if (!start) return { ok: false, msg: 'ingen startpunkt' };

    const W = {
      level, gravity, wind: def.wind || 0, stats: { hits: 0, deaths: 0 }, game: { shake() {}, hitstop: 0 }, cam: { x: 0, y: 0 },
      enemies: [], cutscene: false,
      bumpTile() {}, jetFlame() {}, autoAim() { return null; }, magnetPull() {}, onPlayerDied() {}, endDisco() {},
      playerFellOut(p) { p.simDead = true; }, playerInLiquid(p) { p.simDead = true; },
      platformCollide(ent, preVy) {
        ent.platform = null;
        if (ent.dropT > 0 || preVy < 0) return;
        for (const pl of plats) {
          if (ent.x + ent.w <= pl.x + 1 || ent.x >= pl.x + pl.w - 1) continue;
          if (ent.lastBottom <= pl.y + 2 && ent.y + ent.h >= pl.y - 0.5) {
            ent.y = pl.y - ent.h; ent.vy = 0; ent.onGround = true; ent.platform = pl;
            return;
          }
        }
      },
    };
    const p = new HK.Player(W, start.x, start.y);
    W.player = p;
    p.hurt = function () { this.simDead = true; return true; };
    p.die = function () { this.simDead = true; };
    p.jetpack = hasJet;

    const macros = [];
    for (const dir of [-1, 1]) {
      macros.push({ dir, frames: 60 });
      macros.push({ dir, crouch: true, frames: 60 });
      for (const hold of [3, 7, 11, 16, 999]) for (const run of [0, 1]) for (const air of ['hold', 'release', 'reverse']) macros.push({ dir, jump: hold, run, air });
    }
    macros.push({ dir: 0, jump: 40 });
    macros.push({ dir: 0, jump: 8 });
    macros.push({ drop: true, dir: 0 });
    macros.push({ drop: true, dir: 1 });
    macros.push({ drop: true, dir: -1 });
    if (hasJet) for (const dir of [-1, 0, 1]) for (const jt of [30, 70, 130]) macros.push({ dir, jump: 2, jet: jt, run: 1 });

    const nodes = new Map();
    const queue = [];
    const reached = new Set();
    const key = () => Math.floor(p.cx / TS) + ',' + Math.round(p.bottom);
    function addNode() {
      const k = key();
      if (!nodes.has(k)) {
        nodes.set(k, { x: p.x, y: p.y });
        queue.push(k);
      }
    }
    function reset(n, m) {
      p.x = n.x; p.y = n.y; p.vx = m.run ? m.dir * HK.PH.walk : 0; p.vy = 0;
      p.onGround = true; p.wasGround = true; p.coyote = 6; p.jumpBuf = 0; p.jumping = false; p.dropT = 0;
      p.h = 18; p.crouch = false; p.simDead = false; p.fuel = 100; p.thrustArmed = false; p.inv = 0; p.platform = null;
      p.binoc = false; p.dead = false; p.win = false;
    }
    function checkGoals() {
      for (const g of goals) if (!reached.has(g.name) && overlap(p, g.box)) reached.add(g.name);
    }
    // startnod
    p.x = start.x; p.y = start.y;
    for (let i = 0; i < 30; i++) { inp.held = {}; inp.hit = {}; p.lastBottom = p.bottom; p.update(); }
    addNode();
    let sims = 0;
    while (queue.length) {
      const k = queue.shift();
      const n = nodes.get(k);
      for (const m of macros) {
        reset(n, m);
        sims++;
        let air = false;
        const maxF = m.frames || 260;
        for (let f = 0; f < maxF; f++) {
          inp.held = {};
          inp.hit = {};
          let d = m.dir;
          if (air && m.air === 'release' && p.vy >= 0) d = 0;
          if (air && m.air === 'reverse' && p.vy >= 0) d = -m.dir;
          if (d < 0) inp.held.left = true;
          if (d > 0) inp.held.right = true;
          if (m.crouch) inp.held.down = true;
          if (m.jump) {
            if (f === 0) inp.hit.jump = true;
            if (f < m.jump) inp.held.jump = true;
            if (m.jet && f > 12 && f < 12 + m.jet) { inp.held.jump = true; if (f === 13) inp.hit.jump = true; }
          }
          if (m.drop) { inp.held.down = true; if (f === 1) inp.hit.jump = true; }
          p.lastBottom = p.bottom;
          p.update();
          // fjädrar
          for (const s of springs) {
            if (p.vy > 0 && overlap(p, s) && p.lastBottom <= s.y + 6) {
              const held = !!inp.held.jump || (m.jump && f < m.jump + 30);
              p.y = s.y - p.h;
              p.vy = -(held ? HK.PH.springHeld : HK.PH.spring) * p.jmul();
              p.jumping = held;
            }
          }
          if (p.simDead) break;
          checkGoals();
          if (!p.onGround) air = true;
          if (p.onGround) {
            if (!m.jump && !m.drop) { if (f % 4 === 0) addNode(); }
            else if (air) { addNode(); break; }
          }
          if (p.onGround && air) break;
        }
        if (!p.simDead && p.onGround) addNode();
      }
      if (nodes.size > 6000) break;
    }
    const res = { id: def.id, nodes: nodes.size, sims, goals: goals.map((g) => ({ name: g.name, ok: reached.has(g.name), soft: g.soft })) };
    res.ok = res.goals.every((g) => g.ok || g.soft);
    if (wantMap) {
      const out = level.rows.map((r) => r.split(''));
      for (const k of nodes.keys()) {
        const [tx, by] = k.split(',').map(Number);
        const ty = Math.round(by / TS) - 1;
        if (ty >= 0 && ty < out.length && tx >= 0 && tx < out[0].length && (out[ty][tx] === '.' || out[ty][tx] === ',')) out[ty][tx] = '+';
      }
      fs.mkdirSync(path.join(__dirname, 'out'), { recursive: true });
      fs.writeFileSync(path.join(__dirname, 'out', 'reach_' + def.id + '.txt'), out.map((r) => r.join('')).join('\n'));
    }
    return res;
  }


  return validate;
};
