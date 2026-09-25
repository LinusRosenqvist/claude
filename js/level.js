/* Hitta Kevin — nivåer: tolkning av ASCII-kartor, rutkollisioner, rendering, dekor. */
(function (HK) {
  'use strict';
  const U = HK.U;
  const T = HK.T;
  const TS = 16;
  const SOLID = HK.Tiles.SOLID;
  const TERRAIN = HK.Tiles.TERRAIN;
  const K = '#1a1c2c';

  const TILE_CHARS = {
    '#': T.GROUND, B: T.BRICK, X: T.BLOCK, '?': T.QBLOCK, $: T.QBLOCK, '!': T.QBLOCK, J: T.QBLOCK,
    U: T.USED, '=': T.ONEWAY, '^': T.SPIKES, '~': T.LIQUID, I: T.ICE, '<': T.CONV_L, '>': T.CONV_R,
    '%': T.CRACKED, ':': T.FAKE, ',': T.BGWALL, ';': T.HIDDEN, C: T.CANNON, L: T.LIQUID, F: T.BLOCK,
  };

  function Level(def) {
    this.def = def;
    this.theme = HK.Themes[def.theme];
    let rows;
    if (def.rows) rows = def.rows.slice();
    else {
      const hgt = def.chunks[0].length;
      rows = new Array(hgt).fill('');
      def.chunks.forEach((ch, ci) => {
        if (ch.length !== hgt) throw new Error('Nivå ' + def.id + ': bit ' + ci + ' har ' + ch.length + ' rader, väntade ' + hgt);
        const cw = Math.max.apply(null, ch.map((r) => r.length));
        for (let y = 0; y < hgt; y++) rows[y] += ch[y].padEnd(cw, '.');
      });
    }
    this.rows = rows;
    this.h = rows.length;
    this.w = Math.max.apply(null, rows.map((r) => r.length));
    this.pw = this.w * TS;
    this.ph = this.h * TS;
    this.grid = new Uint8Array(this.w * this.h);
    this.content = new Map(); // innehåll i K-block
    this.bumps = new Map();
    this.spawns = [];
    this.coinsLeft = new Map(); // flermyntsblock
    let pIdx = 0;
    const pups = def.powerups || [];
    for (let y = 0; y < this.h; y++) {
      const row = rows[y];
      for (let x = 0; x < this.w; x++) {
        const ch = row[x] || '.';
        const t = TILE_CHARS[ch];
        const i = y * this.w + x;
        if (t !== undefined) {
          this.grid[i] = t;
          if (ch === '?' || ch === ';') this.content.set(i, 'coin');
          else if (ch === '$') { this.content.set(i, 'multicoin'); this.coinsLeft.set(i, 8); }
          else if (ch === '!') this.content.set(i, pups[pIdx++] || 'heart');
          else if (ch === 'J') this.content.set(i, 'jetpack');
          if (ch === 'C' || ch === 'L' || ch === 'F') this.spawns.push({ ch, x, y });
        } else if (ch !== '.' && ch !== ' ') {
          this.spawns.push({ ch, x, y });
        }
      }
    }
    // hemliga väggar: sammanhängande områden
    this.fakeRegion = new Int16Array(this.w * this.h).fill(-1);
    this.fakeAlpha = [];
    this.fakeFound = [];
    let rid = 0;
    for (let i = 0; i < this.grid.length; i++) {
      if (this.grid[i] !== T.FAKE || this.fakeRegion[i] >= 0) continue;
      const stack = [i];
      this.fakeRegion[i] = rid;
      while (stack.length) {
        const j = stack.pop();
        const jx = j % this.w, jy = (j / this.w) | 0;
        const nb = [[jx + 1, jy], [jx - 1, jy], [jx, jy + 1], [jx, jy - 1]];
        for (const [nx, ny] of nb) {
          if (nx < 0 || ny < 0 || nx >= this.w || ny >= this.h) continue;
          const k = ny * this.w + nx;
          if (this.grid[k] === T.FAKE && this.fakeRegion[k] < 0) {
            this.fakeRegion[k] = rid;
            stack.push(k);
          }
        }
      }
      this.fakeAlpha.push(1);
      this.fakeFound.push(false);
      rid++;
    }
    this.fakeActive = new Uint8Array(rid);
    this.buildDecor();
  }

  Level.prototype = {
    get(tx, ty) {
      if (tx < 0 || tx >= this.w) return T.GROUND;
      if (ty < 0) return T.EMPTY;
      if (ty >= this.h) return T.EMPTY;
      return this.grid[ty * this.w + tx];
    },
    set(tx, ty, t) {
      if (tx < 0 || ty < 0 || tx >= this.w || ty >= this.h) return;
      this.grid[ty * this.w + tx] = t;
    },
    solid(tx, ty) {
      return SOLID[this.get(tx, ty)] === 1;
    },
    terrain(tx, ty) {
      if (tx < 0 || tx >= this.w || ty < 0 || ty >= this.h) return true;
      return TERRAIN[this.grid[ty * this.w + tx]] === 1;
    },
    solidAtPx(px, py) {
      return this.solid(Math.floor(px / TS), Math.floor(py / TS));
    },
    tileAtPx(px, py) {
      return this.get(Math.floor(px / TS), Math.floor(py / TS));
    },
    bump(tx, ty) {
      this.bumps.set(ty * this.w + tx, 10);
    },

    // --------- Dekor ---------
    buildDecor() {
      this.decor = [];
      this.lights = [];
      const th = this.theme.id;
      const seed = (this.def.seed || 0) + this.w * 7;
      const taken = new Set(this.spawns.map((s) => s.y * this.w + s.x));
      for (let y = 1; y < this.h; y++) {
        for (let x = 0; x < this.w; x++) {
          const t = this.grid[y * this.w + x];
          if (t !== T.GROUND) continue;
          const above = this.grid[(y - 1) * this.w + x];
          const hsh = U.hash2(x, y, seed);
          if (above === T.EMPTY && !taken.has((y - 1) * this.w + x)) {
            const d = Decor.pickTop(th, hsh, this, x, y);
            if (d) this.decor.push({ kind: d, x: x * TS + Math.floor(U.hash2(y, x, seed) * 6) + 2, y: y * TS, back: Decor.isBack(d), seed: hsh });
          }
          if (y + 1 < this.h && this.grid[(y + 1) * this.w + x] === T.EMPTY) {
            const d = Decor.pickCeil(th, hsh);
            if (d) this.decor.push({ kind: d, x: x * TS + 8, y: (y + 1) * TS, back: true, ceil: true, seed: hsh });
          }
        }
      }
      for (const d of this.decor) {
        const L = Decor.light(d.kind);
        if (L) this.lights.push({ x: d.x, y: d.y - (d.ceil ? -L.oy : L.oy), r: L.r, c: L.c, flick: L.flick, decor: d });
      }
    },

    // --------- Rendering ---------
    drawBack(ctx, cam, t) {
      const A = HK.Tiles.atlas(this.theme.id);
      const ox = cam.ix, oy = cam.iy;
      const x0 = Math.max(0, Math.floor(ox / TS)), x1 = Math.min(this.w - 1, Math.floor((ox + U.VIEW_W) / TS));
      const y0 = Math.max(0, Math.floor(oy / TS)), y1 = Math.min(this.h - 1, Math.floor((oy + U.VIEW_H) / TS));
      for (let y = y0; y <= y1; y++) {
        for (let x = x0; x <= x1; x++) {
          const tt = this.grid[y * this.w + x];
          if (tt === T.BGWALL || tt === T.FAKE) {
            ctx.drawImage(A.bg[(Math.floor(U.hash2(x, y, 3) * 4))], x * TS - ox, y * TS - oy);
          }
        }
      }
      for (const d of this.decor) {
        if (!d.back) continue;
        if (d.x < ox - 48 || d.x > ox + U.VIEW_W + 48 || d.y < oy - 64 || d.y > oy + U.VIEW_H + 64) continue;
        Decor.draw(ctx, d, d.x - ox, d.y - oy, t);
      }
    },

    drawMain(ctx, cam, t) {
      const A = HK.Tiles.atlas(this.theme.id);
      const ox = cam.ix, oy = cam.iy;
      const x0 = Math.max(0, Math.floor(ox / TS)), x1 = Math.min(this.w - 1, Math.floor((ox + U.VIEW_W) / TS));
      const y0 = Math.max(0, Math.floor(oy / TS) - 1), y1 = Math.min(this.h - 1, Math.floor((oy + U.VIEW_H) / TS));
      const kf = Math.floor(t / 8) % 16;
      const kframe = kf < 4 ? kf : 0;
      const cf = Math.floor(t / 4) % 4;
      for (let y = y0; y <= y1; y++) {
        for (let x = x0; x <= x1; x++) {
          const i = y * this.w + x;
          const tt = this.grid[i];
          if (tt === T.EMPTY || tt === T.BGWALL || tt === T.FAKE || tt === T.HIDDEN || tt === T.LIQUID) continue;
          let dy = 0;
          const b = this.bumps.get(i);
          if (b) dy = -Math.round(Math.sin((b / 10) * Math.PI) * 5);
          const px = x * TS - ox, py = y * TS - oy + dy;
          let img = null;
          switch (tt) {
            case T.GROUND:
            case T.CRACKED: {
              const mask = (this.terrain(x, y - 1) ? 1 : 0) | (this.terrain(x + 1, y) ? 2 : 0) | (this.terrain(x, y + 1) ? 4 : 0) | (this.terrain(x - 1, y) ? 8 : 0);
              img = tt === T.CRACKED ? A.cracked[mask] : A.ground[mask * 4 + Math.floor(U.hash2(x, y, 1) * 4)];
              break;
            }
            case T.BRICK: img = A.brick; break;
            case T.BLOCK: img = A.block; break;
            case T.QBLOCK: img = A.kblock[kframe]; break;
            case T.USED: img = A.used; break;
            case T.ICE: img = A.ice; break;
            case T.CONV_L: img = A.conv[-1][cf]; break;
            case T.CONV_R: img = A.conv[1][cf]; break;
            case T.CANNON: img = A.cannon; break;
            case T.ONEWAY: {
              const caps = (this.get(x - 1, y) !== T.ONEWAY ? 1 : 0) | (this.get(x + 1, y) !== T.ONEWAY ? 2 : 0);
              img = A.oneway[caps];
              break;
            }
            case T.SPIKES: {
              let o = 0;
              if (this.solid(x, y + 1)) o = 0;
              else if (this.solid(x, y - 1)) o = 2;
              else if (this.solid(x - 1, y)) o = 1;
              else if (this.solid(x + 1, y)) o = 3;
              img = A.spikes[o];
              break;
            }
          }
          if (img) ctx.drawImage(img, px, py);
        }
      }
      for (const d of this.decor) {
        if (d.back) continue;
        if (d.x < ox - 32 || d.x > ox + U.VIEW_W + 32 || d.y < oy - 48 || d.y > oy + U.VIEW_H + 48) continue;
        Decor.draw(ctx, d, d.x - ox, d.y - oy, t);
      }
    },

    drawFront(ctx, cam, t) {
      const A = HK.Tiles.atlas(this.theme.id);
      const ox = cam.ix, oy = cam.iy;
      const x0 = Math.max(0, Math.floor(ox / TS)), x1 = Math.min(this.w - 1, Math.floor((ox + U.VIEW_W) / TS));
      const y0 = Math.max(0, Math.floor(oy / TS)), y1 = Math.min(this.h - 1, Math.floor((oy + U.VIEW_H) / TS));
      const lf = Math.floor(t / 10) % 4;
      for (let y = y0; y <= y1; y++) {
        for (let x = x0; x <= x1; x++) {
          const i = y * this.w + x;
          const tt = this.grid[i];
          if (tt === T.LIQUID) {
            const surf = this.get(x, y - 1) !== T.LIQUID;
            ctx.drawImage(surf ? A.liqTop[(lf + x) % 4] : A.liqBody[(lf + y) % 4], x * TS - ox, y * TS - oy);
          } else if (tt === T.FAKE) {
            const r = this.fakeRegion[i];
            const a = this.fakeAlpha[r];
            if (a <= 0.02) continue;
            const mask = (this.terrain(x, y - 1) ? 1 : 0) | (this.terrain(x + 1, y) ? 2 : 0) | (this.terrain(x, y + 1) ? 4 : 0) | (this.terrain(x - 1, y) ? 8 : 0);
            ctx.globalAlpha = a;
            ctx.drawImage(A.ground[mask * 4 + Math.floor(U.hash2(x, y, 1) * 4)], x * TS - ox, y * TS - oy);
            ctx.globalAlpha = 1;
          }
        }
      }
    },

    update() {
      for (const [i, v] of this.bumps) {
        if (v <= 1) this.bumps.delete(i);
        else this.bumps.set(i, v - 1);
      }
      for (let r = 0; r < this.fakeAlpha.length; r++) {
        const target = this.fakeActive[r] ? 0.22 : 1;
        this.fakeAlpha[r] = U.approach(this.fakeAlpha[r], target, 0.06);
        this.fakeActive[r] = 0;
      }
    },

    /** Markera hemliga områden som spelaren står i. Returnerar true första gången ett område hittas. */
    touchFake(ent) {
      let found = false;
      const x0 = Math.floor((ent.x - 4) / TS), x1 = Math.floor((ent.x + ent.w + 4) / TS);
      const y0 = Math.floor((ent.y - 4) / TS), y1 = Math.floor((ent.y + ent.h + 4) / TS);
      for (let y = y0; y <= y1; y++)
        for (let x = x0; x <= x1; x++) {
          if (x < 0 || y < 0 || x >= this.w || y >= this.h) continue;
          const r = this.fakeRegion[y * this.w + x];
          if (r >= 0) {
            this.fakeActive[r] = 1;
            if (!this.fakeFound[r]) {
              const cx = x * TS + 8, cy = y * TS + 8;
              if (cx > ent.x && cx < ent.x + ent.w && cy > ent.y - 4 && cy < ent.y + ent.h + 4) {
                this.fakeFound[r] = true;
                found = true;
              }
            }
          }
        }
      return found;
    },

    /** Är en punkt dold bakom en ännu inte upptäckt hemlig vägg? */
    hiddenAt(px, py) {
      const x = Math.floor(px / TS), y = Math.floor(py / TS);
      if (x < 0 || y < 0 || x >= this.w || y >= this.h) return false;
      const r = this.fakeRegion[y * this.w + x];
      return r >= 0 && this.fakeAlpha[r] > 0.5;
    },
  };

  // =====================================================================
  // DEKOR
  // =====================================================================
  const Decor = {
    cache: {},
    BACK: new Set(['bush', 'tree', 'tank', 'neonsign', 'stalagmite', 'pillar', 'banner', 'panel', 'fence', 'lamp', 'rainbow', 'dish']),
    isBack(k) {
      return Decor.BACK.has(k);
    },
    pickTop(th, h, lvl, x, y) {
      const clearAbove = (n) => {
        for (let k = 1; k <= n; k++) if (lvl.get(x, y - k) !== T.EMPTY) return false;
        return true;
      };
      const flat = (n) => {
        for (let k = 1; k < n; k++) if (lvl.get(x + k, y) !== T.GROUND || lvl.get(x + k, y - 1) !== T.EMPTY) return false;
        return true;
      };
      switch (th) {
        case 'kullar':
          if (h < 0.05 && clearAbove(4) && flat(2)) return 'tree';
          if (h < 0.13 && flat(2)) return 'bush';
          if (h < 0.3) return 'tuft';
          if (h < 0.42) return 'flower';
          if (h < 0.45) return 'mushroom';
          if (h < 0.48) return 'rock';
          if (h < 0.51 && flat(2)) return 'fence';
          return null;
        case 'stad':
          if (h < 0.06 && clearAbove(3)) return 'lamp';
          if (h < 0.1 && clearAbove(3) && flat(2)) return 'tank';
          if (h < 0.18) return 'antenna';
          if (h < 0.26) return 'ac';
          if (h < 0.32) return 'vent';
          if (h < 0.36 && clearAbove(2)) return 'neonsign';
          return null;
        case 'grotta':
          if (h < 0.12) return 'crystal';
          if (h < 0.2) return 'shroom';
          if (h < 0.26 && clearAbove(2)) return 'stalagmite';
          if (h < 0.34) return 'pebble';
          return null;
        case 'moln':
          if (h < 0.08 && clearAbove(3)) return 'pillar';
          if (h < 0.24) return 'cflower';
          if (h < 0.3) return 'sparkle';
          if (h < 0.33 && clearAbove(2) && flat(2)) return 'rainbow';
          return null;
        case 'lava':
          if (h < 0.08 && clearAbove(2)) return 'torch';
          if (h < 0.13 && clearAbove(2)) return 'banner';
          if (h < 0.2) return 'lavarock';
          return null;
        case 'rymd':
          if (h < 0.07) return 'beacon';
          if (h < 0.12 && clearAbove(2)) return 'dish';
          if (h < 0.18 && clearAbove(2)) return 'panel';
          if (h < 0.24) return 'pipe';
          return null;
      }
      return null;
    },
    pickCeil(th, h) {
      if (th === 'grotta' && h < 0.35) return 'stalactite';
      if (th === 'lava' && h < 0.12) return 'chain';
      if (th === 'grotta' && h > 0.9) return 'ceilcrystal';
      return null;
    },
    light(kind) {
      switch (kind) {
        case 'crystal': return { r: 34, c: '#7af5ff', oy: 6 };
        case 'ceilcrystal': return { r: 30, c: '#ff7ad9', oy: -6 };
        case 'shroom': return { r: 26, c: '#9dff8a', oy: 4 };
        case 'torch': return { r: 48, c: '#ffb627', oy: 10, flick: true };
        case 'lamp': return { r: 40, c: '#fff3a0', oy: 30 };
        case 'beacon': return { r: 20, c: '#ff3860', oy: 6, flick: true };
      }
      return null;
    },
    sprite(kind, variant) {
      const key = kind + ':' + variant;
      if (Decor.cache[key]) return Decor.cache[key];
      const Pn = HK.Sprites.Painter;
      let p;
      const v = variant;
      switch (kind) {
        case 'tuft':
          p = new Pn(7, 5);
          p.line(1, 4, 0, 1, '#2f9e4f'); p.line(3, 4, 3, 0, '#5fd65f'); p.line(5, 4, 6, 1, '#2f9e4f');
          p.px(3, 0, '#b4f58a');
          break;
        case 'flower': {
          const cols = [['#ff4d6d', '#ffc2cf'], ['#ffd23f', '#fff3a0'], ['#ffffff', '#ffe0f0'], ['#4dc3ff', '#d6f4ff'], ['#b55cff', '#e6c9ff']][v % 5];
          p = new Pn(7, 9);
          p.line(3, 8, 3, 4, '#2f9e4f');
          p.px(2, 6, '#5fd65f');
          p.disc(3.5, 2.5, 2.2, cols[0]);
          p.px(3, 2, '#ffd23f');
          p.outline(K);
          break;
        }
        case 'mushroom':
          p = new Pn(9, 8);
          p.rect(3, 4, 3, 4, '#f4e8d8');
          p.ellipse(4.5, 3, 4.2, 3, '#ff4d6d');
          p.px(2, 2, '#ffffff'); p.px(6, 1, '#ffffff'); p.px(5, 3, '#ffffff');
          p.outline(K);
          break;
        case 'rock':
          p = new Pn(9, 6);
          p.ellipse(4.5, 4, 4, 3, '#9aa7c2');
          p.rect(2, 2, 3, 1, '#c7cbe0');
          p.outline(K);
          break;
        case 'bush':
          p = new Pn(34, 14);
          p.disc(8, 9, 6.5, '#2f9e4f'); p.disc(17, 7, 7.5, '#2f9e4f'); p.disc(26, 9, 6.5, '#2f9e4f');
          p.disc(8, 8, 5, '#4fc46b'); p.disc(17, 6, 6, '#4fc46b'); p.disc(26, 8, 5, '#4fc46b');
          p.px(15, 3, '#9ff08a'); p.px(16, 3, '#9ff08a'); p.px(6, 5, '#9ff08a');
          p.rect(2, 13, 30, 1, '#2f9e4f');
          p.outline(K);
          break;
        case 'tree':
          p = new Pn(34, 52);
          p.rect(14, 26, 6, 26, '#8a5a32');
          p.rect(14, 26, 2, 26, '#a8734a');
          p.rect(19, 26, 1, 26, '#6b4226');
          p.disc(17, 18, 14, '#2f9e4f'); p.disc(9, 24, 8, '#2f9e4f'); p.disc(25, 23, 8, '#2f9e4f');
          p.disc(16, 15, 11, '#4fc46b'); p.disc(10, 21, 6, '#4fc46b'); p.disc(24, 20, 6, '#4fc46b');
          p.disc(13, 11, 5, '#7ee06a');
          p.px(20, 12, '#ff4d6d'); p.px(9, 20, '#ff4d6d'); p.px(26, 19, '#ff4d6d');
          p.outline(K);
          break;
        case 'fence':
          p = new Pn(18, 11);
          p.rect(0, 3, 18, 2, '#e8d5b0'); p.rect(0, 7, 18, 2, '#e8d5b0');
          for (const x of [1, 8, 15]) { p.rect(x, 1, 2, 10, '#f4e8d8'); p.px(x, 0, '#f4e8d8'); }
          p.outline(K);
          break;
        case 'antenna':
          p = new Pn(7, 16);
          p.rect(3, 3, 1, 13, '#8f95b2');
          p.rect(1, 6, 5, 1, '#8f95b2');
          p.rect(2, 10, 3, 1, '#8f95b2');
          p.outline(K);
          break;
        case 'ac':
          p = new Pn(14, 11);
          p.rect(1, 1, 12, 9, '#c7cbe0');
          p.rect(1, 1, 12, 1, '#eef0fa');
          p.disc(7, 5.5, 3.2, '#50557a');
          p.line(5, 5, 9, 6, '#8f95b2');
          p.outline(K);
          break;
        case 'vent':
          p = new Pn(9, 8);
          p.rect(1, 2, 7, 6, '#6b7699');
          p.rect(0, 1, 9, 2, '#8f95b2');
          p.outline(K);
          break;
        case 'tank':
          p = new Pn(24, 34);
          p.rect(4, 2, 16, 16, '#8a5a4a');
          p.rect(4, 2, 16, 2, '#b8836a');
          for (let x = 6; x < 20; x += 4) p.rect(x, 4, 1, 14, '#6b4236');
          p.poly([[2, 3], [12, -2], [22, 3]], '#6b4236');
          p.rect(6, 18, 2, 16, '#50557a'); p.rect(16, 18, 2, 16, '#50557a');
          p.line(6, 22, 17, 30, '#50557a'); p.line(17, 22, 6, 30, '#50557a');
          p.outline(K);
          break;
        case 'lamp':
          p = new Pn(12, 34);
          p.rect(5, 6, 2, 28, '#3b3f5c');
          p.rect(3, 4, 7, 3, '#3b3f5c');
          p.rect(4, 7, 5, 2, '#fff3a0');
          p.outline(K);
          break;
        case 'neonsign': {
          const col = ['#ff4fa3', '#2ef2ff', '#ffd23f', '#7dff6b'][v % 4];
          p = new Pn(26, 24);
          p.rect(2, 1, 22, 12, '#1a0f30');
          p.rect(2, 1, 22, 1, col); p.rect(2, 12, 22, 1, col); p.rect(2, 1, 1, 12, col); p.rect(23, 1, 1, 12, col);
          const word = [[1, 0, 1, 1, 1, 0, 1, 1], [1, 1, 0, 1, 1, 1, 0, 1]][v % 2];
          for (let i = 0; i < 8; i++) if (word[i]) p.rect(5 + i * 2, 5, 1, 4, col);
          p.rect(7, 13, 1, 11, '#3b3f5c'); p.rect(18, 13, 1, 11, '#3b3f5c');
          p.outline(K);
          break;
        }
        case 'crystal': {
          const col = v % 2 ? ['#ff7ad9', '#ffc9f0', '#b8338f'] : ['#7af5ff', '#d6fcff', '#2aa6d8'];
          p = new Pn(11, 14);
          p.poly([[1, 13], [2, 6], [4, 13]], col[2]);
          p.poly([[3, 13], [5.5, 1], [8, 13]], col[0]);
          p.poly([[7, 13], [9, 5], [10.5, 13]], col[2]);
          p.line(5, 3, 4, 11, col[1]);
          p.outline(K);
          break;
        }
        case 'ceilcrystal':
          p = new Pn(9, 12);
          p.poly([[1, 0], [4.5, 11], [8, 0]], '#ff7ad9');
          p.line(3, 1, 4, 8, '#ffc9f0');
          p.outline(K);
          break;
        case 'shroom':
          p = new Pn(10, 9);
          p.rect(4, 4, 2, 5, '#c9ffd6');
          p.ellipse(5, 3.5, 4.4, 3, '#4ade6b');
          p.px(3, 2, '#e6ffe6'); p.px(6, 1, '#e6ffe6');
          p.outline(K);
          break;
        case 'stalagmite':
          p = new Pn(12, 18);
          p.poly([[1, 18], [6, 1], [11, 18]], '#2a2750');
          p.line(5, 4, 3, 17, '#3d3a6b');
          p.outline(K);
          break;
        case 'stalactite':
          p = new Pn(10, 16);
          p.poly([[1, 0], [5, 12 + (v % 4)], [9, 0]], '#2a2750');
          p.line(4, 1, 5, 9, '#3d3a6b');
          p.outline(K);
          break;
        case 'pebble':
          p = new Pn(6, 4);
          p.ellipse(3, 2.5, 2.5, 1.6, '#57539a');
          p.px(2, 1, '#7a74d6');
          p.outline(K);
          break;
        case 'pillar':
          p = new Pn(16, 40);
          p.rect(3, 4, 10, 32, '#f4f0ff');
          for (let x = 5; x < 12; x += 3) p.rect(x, 5, 1, 30, '#d6ccff');
          p.rect(1, 0, 14, 4, '#ffd23f'); p.rect(1, 36, 14, 4, '#ffd23f');
          p.rect(1, 0, 14, 1, '#fff3a0');
          p.outline(K);
          break;
        case 'cflower': {
          const col = ['#ff9fd0', '#ffd23f', '#9ff3ff', '#c9a0ff'][v % 4];
          p = new Pn(9, 9);
          p.line(4, 8, 4, 5, '#7ee06a');
          for (let a = 0; a < 5; a++) p.px(4 + Math.round(Math.cos(a * 1.26) * 2), 3 + Math.round(Math.sin(a * 1.26) * 2), col);
          p.px(4, 3, '#ffffff');
          p.outline(K);
          break;
        }
        case 'sparkle':
          p = new Pn(7, 7);
          p.rect(3, 0, 1, 7, '#fff3a0'); p.rect(0, 3, 7, 1, '#fff3a0'); p.px(3, 3, '#ffffff');
          break;
        case 'rainbow': {
          p = new Pn(34, 18);
          const cols = ['#ff4d6d', '#ff9f1c', '#ffd23f', '#7dff6b', '#4dc3ff', '#b55cff'];
          for (let i = 0; i < cols.length; i++) {
            const r = 16 - i;
            for (let a = 0; a <= 60; a++) {
              const ang = Math.PI + (a / 60) * Math.PI;
              p.px(17 + Math.cos(ang) * r, 17 + Math.sin(ang) * r, cols[i]);
            }
          }
          break;
        }
        case 'torch':
          p = new Pn(8, 16);
          p.rect(3, 6, 2, 10, '#6b4a3a');
          p.rect(2, 5, 4, 2, '#9aa7c2');
          p.outline(K);
          break;
        case 'chain':
          p = new Pn(5, 26);
          for (let y = 0; y < 26; y += 4) { p.rect(1, y, 3, 3, '#6b7090'); p.px(2, y + 1, null); }
          break;
        case 'banner':
          p = new Pn(14, 26);
          p.rect(1, 0, 12, 2, '#6b4a3a');
          p.poly([[2, 2], [12, 2], [12, 20], [7, 16], [2, 20]], '#b3263a');
          p.rect(6, 5, 2, 8, '#ffd23f'); p.rect(8, 8, 2, 2, '#ffd23f'); p.px(10, 7, '#ffd23f'); p.px(10, 10, '#ffd23f');
          p.outline(K);
          break;
        case 'lavarock':
          p = new Pn(8, 5);
          p.ellipse(4, 3, 3.5, 2.2, '#4a2c3a');
          p.px(3, 2, '#ff5a2a');
          p.outline(K);
          break;
        case 'beacon':
          p = new Pn(7, 10);
          p.rect(2, 4, 3, 6, '#8f95b2');
          p.rect(1, 2, 5, 3, '#ff3860');
          p.outline(K);
          break;
        case 'dish':
          p = new Pn(16, 20);
          p.rect(7, 10, 2, 10, '#8f95b2');
          p.ellipse(8, 7, 7, 4, '#c7cbe0');
          p.ellipse(8, 6, 5, 2.5, '#eef0fa');
          p.line(8, 6, 11, 1, '#8f95b2');
          p.px(11, 1, '#ff3860');
          p.outline(K);
          break;
        case 'panel':
          p = new Pn(16, 16);
          p.rect(1, 1, 14, 11, '#3b3f5c');
          p.rect(3, 3, 10, 5, '#1a1c2c');
          p.rect(7, 12, 2, 4, '#50557a');
          p.outline(K);
          break;
        case 'pipe':
          p = new Pn(16, 6);
          p.rect(0, 1, 16, 4, '#8f95b2');
          p.rect(0, 1, 16, 1, '#c7cbe0');
          p.rect(6, 0, 3, 6, '#6b7699');
          p.outline(K);
          break;
        default:
          p = new Pn(2, 2);
      }
      const c = p.toCanvas();
      Decor.cache[key] = c;
      return c;
    },
    draw(ctx, d, x, y, t) {
      const v = Math.floor(d.seed * 997) % 8;
      const img = Decor.sprite(d.kind, v);
      if (d.ceil) {
        ctx.drawImage(img, Math.round(x - img.width / 2), Math.round(y));
        return;
      }
      let sway = 0;
      if (d.kind === 'tuft' || d.kind === 'flower' || d.kind === 'cflower') sway = Math.round(Math.sin(t * 0.05 + d.seed * 20) * 0.6);
      ctx.drawImage(img, Math.round(x - img.width / 2 + sway), Math.round(y - img.height + (d.kind === 'pipe' ? 0 : 0)));
      if (d.kind === 'torch') {
        const f = Math.floor(t / 5 + d.seed * 10) % 3;
        ctx.fillStyle = '#ff9f1c';
        ctx.fillRect(Math.round(x) - 2, Math.round(y - 16 - f), 4, 4 + f);
        ctx.fillStyle = '#fff27a';
        ctx.fillRect(Math.round(x) - 1, Math.round(y - 14 - f), 2, 2 + f);
      } else if (d.kind === 'beacon' || d.kind === 'antenna') {
        if (Math.floor(t / 30 + d.seed * 5) % 2 === 0) {
          ctx.fillStyle = d.kind === 'beacon' ? '#ffffff' : '#ff3860';
          ctx.fillRect(Math.round(x) - (d.kind === 'beacon' ? 1 : 0), Math.round(y - img.height + (d.kind === 'beacon' ? 3 : 1)), d.kind === 'beacon' ? 2 : 1, 1);
        }
      } else if (d.kind === 'sparkle') {
        if (Math.floor(t / 12 + d.seed * 10) % 3 === 0) ctx.clearRect(0, 0, 0, 0);
      }
    },
  };

  // =====================================================================
  // FYSIK MOT RUTNÄTET
  // =====================================================================
  const Physics = {
    /**
     * Flytta en entitet (x, y, w, h, vx, vy) mot rutnätet.
     * opts: { oneway: true, dropThrough: bool, onHead(tx, ty), hidden: true }
     * Sätter ent.onGround, ent.hitWall (-1/0/1), ent.hitCeil, ent.groundTile.
     */
    move(ent, lvl, opts) {
      opts = opts || {};
      ent.hitWall = 0;
      ent.hitCeil = false;
      // --- X ---
      if (ent.vx !== 0) {
        ent.x += ent.vx;
        const top = Math.floor(ent.y / TS), bot = Math.floor((ent.y + ent.h - 0.01) / TS);
        if (ent.vx > 0) {
          const tx = Math.floor((ent.x + ent.w - 0.01) / TS);
          for (let ty = top; ty <= bot; ty++) {
            if (lvl.solid(tx, ty)) {
              ent.x = tx * TS - ent.w;
              ent.hitWall = 1;
              break;
            }
          }
        } else {
          const tx = Math.floor(ent.x / TS);
          for (let ty = top; ty <= bot; ty++) {
            if (lvl.solid(tx, ty)) {
              ent.x = (tx + 1) * TS;
              ent.hitWall = -1;
              break;
            }
          }
        }
        if (ent.hitWall) ent.vx = 0;
      }
      // --- Y ---
      const prevBottom = ent.y + ent.h;
      ent.y += ent.vy;
      ent.onGround = false;
      ent.groundTile = 0;
      const left = Math.floor(ent.x / TS), right = Math.floor((ent.x + ent.w - 0.01) / TS);
      if (ent.vy > 0) {
        const ty = Math.floor((ent.y + ent.h - 0.01) / TS);
        let landed = false;
        for (let tx = left; tx <= right; tx++) {
          const t = lvl.get(tx, ty);
          if (SOLID[t] || (opts.oneway !== false && t === T.ONEWAY && !opts.dropThrough && prevBottom <= ty * TS + 0.5)) {
            landed = true;
            if (!ent.groundTile || t === T.ICE || t === T.CONV_L || t === T.CONV_R) ent.groundTile = t;
          }
        }
        if (landed) {
          ent.y = ty * TS - ent.h;
          ent.vy = 0;
          ent.onGround = true;
        }
      } else if (ent.vy < 0) {
        const ty = Math.floor(ent.y / TS);
        let hit = false;
        let best = null, bestD = 1e9;
        const cx = ent.x + ent.w / 2;
        for (let tx = left; tx <= right; tx++) {
          const t = lvl.get(tx, ty);
          const isHidden = t === T.HIDDEN && opts.hidden;
          if (SOLID[t] || isHidden) {
            hit = true;
            const d = Math.abs(tx * TS + 8 - cx);
            if (d < bestD) { bestD = d; best = tx; }
          }
        }
        if (hit) {
          // hörnkorrigering: glid förbi kanten om nästan fri
          if (opts.cornerCorrect && right > left) {
            const tl = SOLID[lvl.get(left, ty)], tr = SOLID[lvl.get(right, ty)];
            if (tl && !tr && (left + 1) * TS - ent.x <= 4 && !lvl.solid(right, ty)) {
              ent.x = (left + 1) * TS + 0.01;
              return;
            }
            if (tr && !tl && ent.x + ent.w - right * TS <= 4) {
              ent.x = right * TS - ent.w - 0.01;
              return;
            }
          }
          ent.y = (ty + 1) * TS;
          ent.vy = 0;
          ent.hitCeil = true;
          if (opts.onHead && best != null) opts.onHead(best, ty);
        }
      }
    },

    // Står det något fast under punkten?
    groundBelow(lvl, x, y) {
      const t = lvl.tileAtPx(x, y + 1);
      return SOLID[t] || t === T.ONEWAY;
    },
  };

  HK.Level = Level;
  HK.Decor = Decor;
  HK.Physics = Physics;
})((window.HK = window.HK || {}));
