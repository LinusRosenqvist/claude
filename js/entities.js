/* Hitta Kevin — skott, föremål, plattformar, checkpoints, Kevin och lockbeten. */
(function (HK) {
  'use strict';
  const U = HK.U;
  const T = HK.T;
  const S = HK.Sprites;
  const FX = HK.FX;
  const TS = 16;

  // =====================================================================
  // SKOTT
  // =====================================================================
  class Shot {
    constructor(x, y, vx, vy, kind) {
      this.x = x; this.y = y; this.vx = vx; this.vy = vy;
      this.kind = kind || 'blaster';
      this.r = this.kind === 'flame' ? 3 : 3;
      this.life = this.kind === 'flame' ? 16 : 70;
      this.dmg = this.kind === 'flame' ? 0.5 : 1;
      this.dead = false;
      this.t = 0;
    }
    get box() { return { x: this.x - this.r, y: this.y - this.r, w: this.r * 2, h: this.r * 2 }; }
    update(W) {
      this.t++;
      if (this.kind === 'flame') this.vy += 0.1;
      this.x += this.vx;
      this.y += this.vy;
      if (--this.life <= 0) { this.dead = true; return; }
      const lvl = W.level;
      const tx = Math.floor(this.x / TS), ty = Math.floor(this.y / TS);
      const t = lvl.get(tx, ty);
      if (HK.Tiles.SOLID[t]) {
        this.dead = true;
        if (this.kind === 'blaster') W.shotTile(tx, ty, this);
        FX.burst(this.x - this.vx, this.y - this.vy, 4, { colors: ['#ffffff', '#6ff6ff'], g: 0.05, min: 0.4, max: 1.5, lifeMin: 6, lifeMax: 12, size: 1 });
        return;
      }
      if (this.kind === 'blaster' && this.t % 2 === 0) FX.add({ type: 'px', x: this.x, y: this.y, life: 8, size: 2, color: '#2ef2ff', fade: true }, true);
    }
    draw(ctx, cam) {
      const x = Math.round(this.x - cam.ix), y = Math.round(this.y - cam.iy);
      if (this.kind === 'flame') {
        ctx.fillStyle = this.t % 4 < 2 ? '#ff9f1c' : '#fff27a';
        ctx.fillRect(x - 1, y - 1, 3, 3);
        return;
      }
      S.draw(ctx, 'skott', this.t >> 2, x, y, { ay: 0.5 });
    }
  }

  class EnemyShot {
    constructor(x, y, vx, vy, kind) {
      this.x = x; this.y = y; this.vx = vx; this.vy = vy;
      this.kind = kind || 'orb';
      this.r = 3;
      this.life = 240;
      this.dead = false;
      this.t = 0;
      this.g = kind === 'drop' ? 0.08 : 0;
      this.ghost = kind === 'wave';
    }
    get box() { return { x: this.x - this.r, y: this.y - this.r, w: this.r * 2, h: this.r * 2 }; }
    update(W) {
      this.t++;
      this.vy += this.g;
      this.x += this.vx;
      this.y += this.vy;
      if (--this.life <= 0) this.dead = true;
      if (this.kind === 'wave') {
        // chockvåg längs marken
        if (!W.level.solidAtPx(this.x, this.y + 8)) this.dead = true;
        if (W.level.solidAtPx(this.x + Math.sign(this.vx) * 4, this.y)) this.dead = true;
        if (this.t % 3 === 0) FX.add({ type: 'px', x: this.x + U.rand(-3, 3), y: this.y + 4, vy: -U.rand(0.5, 1.5), life: 12, size: 2, color: U.pick(['#ffd23f', '#ff9f1c']), fade: true });
        return;
      }
      if (W.level.solidAtPx(this.x, this.y)) {
        this.dead = true;
        FX.burst(this.x, this.y, 4, { colors: ['#ff4fa3', '#ffffff'], g: 0.05, min: 0.4, max: 1.2, lifeMin: 6, lifeMax: 12, size: 1 });
      }
    }
    draw(ctx, cam) {
      const x = Math.round(this.x - cam.ix), y = Math.round(this.y - cam.iy);
      if (this.kind === 'wave') {
        ctx.fillStyle = this.t % 4 < 2 ? '#ffd23f' : '#ff9f1c';
        ctx.fillRect(x - 3, y - 2, 6, 6);
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(x - 1, y, 2, 3);
        return;
      }
      S.draw(ctx, 'fiendeskott', this.t >> 2, x, y, { ay: 0.5 });
    }
  }

  // =====================================================================
  // FÖREMÅL
  // =====================================================================
  class Coin {
    constructor(x, y, mode) {
      this.x = x; this.y = y; this.w = 10; this.h = 12;
      this.mode = mode || 'static'; // static | pop | drop
      this.vx = 0; this.vy = 0; this.t = 0; this.dead = false;
      this.canTake = this.mode !== 'drop' ? 0 : 12;
      if (this.mode === 'pop') { this.vy = -5.5; }
      if (this.mode === 'drop') { this.vy = -U.rand(2.5, 4); this.vx = U.rand(-1.2, 1.2); this.life = 480; }
    }
    update(W) {
      this.t++;
      if (this.canTake > 0) this.canTake--;
      if (this.mode === 'pop') {
        this.vy += 0.35;
        this.y += this.vy;
        if (this.vy > 2) {
          this.dead = true;
          W.addCoins(1, this.x + 5, this.y);
          FX.sparkle(this.x + 5, this.y + 6, '#fff3a0', 3);
        }
        return;
      }
      if (this.mode === 'drop') {
        this.vy = Math.min(this.vy + 0.25, 5);
        HK.Physics.move(this, W.level, {});
        if (this.onGround) { this.vy = -Math.abs(this.vy) * 0.4; this.vx *= 0.8; }
        if (this.hitWall) this.vx = -this.vx;
        if (--this.life <= 0) this.dead = true;
      }
      if (this.magnetized) {
        const p = W.player;
        const dx = p.cx - (this.x + 5), dy = p.cy - (this.y + 6);
        const d = Math.hypot(dx, dy) || 1;
        this.x += (dx / d) * 4;
        this.y += (dy / d) * 4;
      }
    }
    draw(ctx, cam, t) {
      if (this.mode === 'drop' && this.life < 120 && this.life % 6 < 3) return;
      S.draw(ctx, 'mynt', Math.floor((t + this.x * 0.3) / 6), Math.round(this.x + 5 - cam.ix), Math.round(this.y + 12 - cam.iy));
    }
  }

  const GEM_NAMES = ['gem_rod', 'gem_gron', 'gem_bla'];
  class Gem {
    constructor(x, y, index) {
      this.x = x + 1; this.y = y + 1; this.w = 14; this.h = 14;
      this.index = index; this.t = 0; this.dead = false;
      this.baseY = this.y;
    }
    update() {
      this.t++;
      this.y = this.baseY + Math.round(Math.sin(this.t * 0.07) * 2);
      if (this.t % 20 === 0) FX.sparkle(this.x + U.rand(0, 14), this.y + U.rand(0, 14), '#ffffff', 1);
    }
    draw(ctx, cam) {
      const f = Math.floor(this.t / 8) % 4;
      S.draw(ctx, GEM_NAMES[this.index % 3], f, Math.round(this.x + 7 - cam.ix), Math.round(this.y + 14 - cam.iy));
    }
  }
  Gem.NAMES = GEM_NAMES;

  const PU_SPRITE = { heart: 'hjarta', shield: 'skold', triple: 'trippel', magnet: 'magnet', disco: 'disco', jetpack: 'jetpack', fuel: 'bransle' };
  class PowerUp {
    constructor(x, y, kind, fromBlock) {
      this.kind = kind;
      this.w = 14; this.h = 14;
      this.x = x + 1; this.y = y + 1;
      this.t = 0; this.dead = false;
      this.emerge = fromBlock ? 18 : 0;
      this.baseY = this.y;
      if (fromBlock) { this.y += 12; this.baseY = y - 15; }
    }
    update() {
      this.t++;
      if (this.emerge > 0) {
        this.emerge--;
        this.y = U.lerp(this.y, this.baseY, 0.2);
        return;
      }
      this.y = this.baseY + Math.round(Math.sin(this.t * 0.08) * 2);
      if (this.t % 24 === 0) FX.sparkle(this.x + U.rand(0, 14), this.y + U.rand(0, 14), '#fff3a0', 1);
    }
    get takeable() { return this.emerge <= 4; }
    draw(ctx, cam) {
      const sp = PU_SPRITE[this.kind] || 'hjarta';
      const s = S.get(sp);
      const f = Math.floor(this.t / 8) % s.frames.length;
      const x = Math.round(this.x + 7 - cam.ix), y = Math.round(this.y + 14 - cam.iy);
      // glöd bakom
      ctx.fillStyle = 'rgba(255,255,255,0.25)';
      const r = 9 + Math.sin(this.t * 0.15) * 1.5;
      HK.BgUtil.disc(ctx, x, y - 7, r, 'rgba(255,255,255,0.18)');
      S.draw(ctx, sp, f, x, y);
    }
  }
  PowerUp.SPRITE = PU_SPRITE;

  // =====================================================================
  // RUTOR MED LIV: checkpoint, fjäder, skylt
  // =====================================================================
  class Checkpoint {
    constructor(x, y) {
      this.x = x + 2; this.y = y - 18; this.w = 12; this.h = 34;
      this.active = false; this.t = 0;
    }
    update() { this.t++; }
    draw(ctx, cam) {
      const f = this.active ? 1 + (Math.floor(this.t / 8) % 3) : 0;
      S.draw(ctx, 'flagga', f, Math.round(this.x + 6 - cam.ix), Math.round(this.y + this.h - cam.iy));
    }
  }

  class Spring {
    constructor(x, y) {
      this.x = x + 1; this.y = y + 6; this.w = 14; this.h = 10;
      this.t = 0; this.anim = 0;
    }
    update() { this.t++; if (this.anim > 0) this.anim--; }
    draw(ctx, cam) {
      const f = this.anim > 8 ? 1 : this.anim > 0 ? 2 : 0;
      S.draw(ctx, 'fjader', f, Math.round(this.x + 7 - cam.ix), Math.round(this.y + 10 - cam.iy));
    }
  }

  class Sign {
    constructor(x, y, text) {
      this.x = x; this.y = y; this.w = 16; this.h = 16;
      this.text = text || '';
      this.show = 0;
    }
    update(W) {
      const p = W.player;
      const near = Math.abs(p.cx - (this.x + 8)) < 28 && Math.abs(p.cy - (this.y + 8)) < 30;
      this.show = U.approach(this.show, near ? 1 : 0, 0.12);
    }
    draw(ctx, cam) {
      S.draw(ctx, 'skylt', 0, Math.round(this.x + 8 - cam.ix), Math.round(this.y + 16 - cam.iy));
    }
    drawBubble(ctx, cam) {
      if (this.show <= 0.01 || !this.text) return;
      HK.Hud.bubble(ctx, this.text, Math.round(this.x + 8 - cam.ix), Math.round(this.y - 6 - cam.iy), this.show);
    }
  }

  // =====================================================================
  // PLATTFORMAR
  // =====================================================================
  class Platform {
    constructor(x, y, wTiles, kind, range, speed, phase) {
      this.kind = kind; // 'h' | 'v' | 'fall'
      this.x0 = x; this.y0 = y;
      this.x = x; this.y = y;
      this.w = wTiles * TS; this.h = 8;
      this.range = range || 48;
      this.speed = speed || 0.02;
      this.phase = phase || 0;
      this.t = 0;
      this.dx = 0; this.dy = 0;
      this.state = 'idle'; // för fallande: idle | shake | fall | gone
      this.timer = 0;
      this.solidTop = false;
      this.alpha = 1;
    }
    update(W) {
      this.t++;
      const ox = this.x, oy = this.y;
      if (this.kind === 'h') {
        this.x = this.x0 + Math.sin(this.t * this.speed + this.phase) * this.range;
      } else if (this.kind === 'v') {
        this.y = this.y0 + Math.sin(this.t * this.speed + this.phase) * this.range;
      } else if (this.kind === 'fall') {
        if (this.state === 'shake') {
          if (--this.timer <= 0) { this.state = 'fall'; this.vy = 0; HK.Audio.sfx('crumble'); }
        } else if (this.state === 'fall') {
          this.vy = Math.min((this.vy || 0) + 0.25, 6);
          this.y += this.vy;
          if (this.y > W.level.ph + 40) { this.state = 'gone'; this.timer = 180; }
        } else if (this.state === 'gone') {
          if (--this.timer <= 0) {
            this.state = 'idle';
            this.x = this.x0; this.y = this.y0;
            this.alpha = 0;
          }
        }
        if (this.alpha < 1) this.alpha = Math.min(1, this.alpha + 0.05);
      }
      this.dx = this.x - ox;
      this.dy = this.y - oy;
    }
    stoodOn() {
      if (this.kind === 'fall' && this.state === 'idle') { this.state = 'shake'; this.timer = 28; }
    }
    get active() { return this.state !== 'gone'; }
    draw(ctx, cam, t, theme) {
      if (this.state === 'gone') return;
      const A = HK.Tiles.atlas(theme);
      let sx = 0;
      if (this.state === 'shake') sx = (this.timer % 4 < 2) ? 1 : -1;
      const n = Math.round(this.w / TS);
      ctx.globalAlpha = this.alpha;
      for (let i = 0; i < n; i++) {
        const caps = (i === 0 ? 1 : 0) | (i === n - 1 ? 2 : 0);
        const px = Math.round(this.x + i * TS - cam.ix + sx), py = Math.round(this.y - cam.iy);
        if (this.kind === 'fall') {
          ctx.drawImage(A.oneway[caps], px, py);
          ctx.fillStyle = '#ff4d6d';
          ctx.fillRect(px + 4, py + 2, 1, 1);
          ctx.fillRect(px + 11, py + 2, 1, 1);
          ctx.fillStyle = '#1a1c2c';
          ctx.fillRect(px + 7, py + 1, 1, 3);
          ctx.fillRect(px + 8, py + 3, 1, 2);
        } else {
          ctx.drawImage(A.oneway[caps], px, py);
          if (i === 0 || i === n - 1) {
            ctx.fillStyle = '#ffd23f';
            ctx.fillRect(px + (i === 0 ? 2 : 13), py + 2, 1, 1);
          }
        }
      }
      ctx.globalAlpha = 1;
    }
  }

  // =====================================================================
  // KEVIN
  // =====================================================================
  const KEVIN_LINES = [
    'DU HITTADE MIG! JAG VAR BARA UTE OCH KÖPTE GODIS.',
    'NÄMEN HEJ! HUR VISSTE DU ATT JAG VAR HÄR?',
    'OKEJ, OKEJ... DU VANN DEN HÄR RUNDAN!',
    'SSSCH! JAG GÖMDE MIG INTE. JAG... VILADE.',
    'SNYGGT! MEN NÄSTA GÅNG GÖMMER JAG MIG BÄTTRE.',
    'WOW, DU ÄR JU EN RIKTIG DETEKTIV!',
  ];
  const TAUNTS = ['HAHA! FÅNGA MIG!', 'FÖR LÅNGSAM!', 'HIHI! INTE ÄN!', 'NÄSTAN!', 'POFF!'];

  class Kevin {
    constructor(W, spots, final) {
      this.W = W;
      this.spots = spots.concat([final]);
      this.idx = 0;
      this.w = 12; this.h = 20;
      this.place();
      this.t = 0;
      this.state = 'hide'; // hide | found
      this.seen = false;
      this.notice = 0;
      this.caged = false;
      this.pose = 'idle';
      this.facing = -1;
      this.say = null;
      this.sayT = 0;
    }
    place() {
      const s = this.spots[this.idx];
      this.x = s.x * TS + 2;
      this.y = s.y * TS + 16 - this.h;
      // landa på marken under
      const lvl = this.W.level;
      let ty = s.y;
      while (ty < lvl.h - 1 && !lvl.solid(s.x, ty + 1) && lvl.get(s.x, ty + 1) !== T.ONEWAY) ty++;
      this.y = ty * TS + 16 - this.h;
      const poses = ['phone', 'sleep', 'idle', 'dance', 'phone'];
      this.pose = this.final ? poses[(s.x + s.y) % poses.length] : 'idle';
      if (this.idx === this.spots.length - 1 && this.W.def.kevinPose) this.pose = this.W.def.kevinPose;
    }
    get final() { return this.idx === this.spots.length - 1; }
    get cx() { return this.x + this.w / 2; }
    get cy() { return this.y + this.h / 2; }
    update() {
      const W = this.W;
      this.t++;
      if (this.sayT > 0) this.sayT--;
      if (this.state !== 'hide') return;
      const p = W.player;
      const dx = p.cx - this.cx, dy = p.cy - this.cy;
      const d = Math.hypot(dx, dy);
      this.facing = dx < 0 ? -1 : 1;
      if (d < 96) this.notice = Math.min(30, this.notice + 1);
      else this.notice = Math.max(0, this.notice - 1);
      if (this.caged) return;
      if (!this.final && !p.dead) {
        // hittar spelaren det riktiga gömstället först? då är Kevin redan där.
        const fs = this.spots[this.spots.length - 1];
        if (Math.hypot(p.cx - (fs.x * TS + 8), p.cy - (fs.y * TS + 8)) < 72) {
          FX.smoke(this.cx, this.cy, 6);
          this.idx = this.spots.length - 1;
          this.place();
          this.seen = false;
          return;
        }
      }
      if (!this.final && d < 58 && !p.dead) {
        // poff! till nästa gömställe
        FX.smoke(this.cx, this.cy, 8);
        FX.text(this.cx, this.y - 6, U.pick(TAUNTS), '#ffd23f', { life: 70 });
        HK.Audio.sfx('poof');
        this.idx++;
        this.place();
        this.seen = false;
        this.notice = 0;
        FX.smoke(this.cx, this.cy, 6);
        W.stats.poofs++;
        return;
      }
      if (this.final && U.overlap(p, { x: this.x - 2, y: this.y - 2, w: this.w + 4, h: this.h + 4 }) && !p.dead) {
        this.state = 'found';
        W.onKevinFound(this);
      }
    }
    visibleOnScreen(cam) {
      if (!cam.visible(this.x, this.y, this.w, this.h, -6)) return false;
      if (this.W.level.hiddenAt(this.cx, this.cy)) return false;
      return true;
    }
    draw(ctx, cam) {
      const x = Math.round(this.cx - cam.ix), y = Math.round(this.y + this.h - cam.iy);
      let name = 'kevin_idle', f = Math.floor(this.t / 30);
      if (this.state === 'found') {
        name = 'kevin_cheer';
        f = Math.floor(this.t / 8);
      } else if (this.caged) {
        name = 'kevin_wave'; f = Math.floor(this.t / 12);
      } else if (this.notice > 20) {
        name = 'kevin_wave'; f = Math.floor(this.t / 10);
      } else if (this.pose === 'phone') {
        name = 'kevin_phone'; f = Math.floor(this.t / 40);
      } else if (this.pose === 'sleep') {
        name = 'kevin_sleep'; f = Math.floor(this.t / 50);
        if (this.t % 70 === 0) FX.text(x + cam.ix + 6, y + cam.iy - 24, 'Z', '#c7d2ff', { life: 60, vy: -0.4 });
      } else if (this.pose === 'dance') {
        name = 'kevin_dance'; f = Math.floor(this.t / 10);
      } else if (this.t % 200 < 6) {
        name = 'kevin_blink'; f = 0;
      }
      const bob = this.state === 'found' ? -Math.abs(Math.sin(this.t * 0.2)) * 6 : 0;
      S.draw(ctx, name, f, x, y + Math.round(bob), { flip: this.facing < 0 });
      if (this.caged) {
        // glaskapsel
        ctx.globalAlpha = 0.35;
        ctx.fillStyle = '#9ff3ff';
        ctx.fillRect(x - 12, y - 30, 24, 30);
        ctx.globalAlpha = 1;
        ctx.fillStyle = '#c7d2ff';
        ctx.fillRect(x - 12, y - 31, 24, 2);
        ctx.fillRect(x - 12, y - 1, 24, 2);
        ctx.fillRect(x - 12, y - 30, 1, 30);
        ctx.fillRect(x + 11, y - 30, 1, 30);
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(x - 9, y - 26, 1, 8);
      }
      if (this.notice > 10 && this.state === 'hide' && !this.caged) {
        const a = Math.min(1, (this.notice - 10) / 10);
        HK.Font.draw(ctx, '!', x, y - 34 + Math.round(Math.sin(this.t * 0.3)), { color: '#ffd23f', align: 'center', alpha: a, scale: 1 });
      }
    }
  }
  Kevin.LINES = KEVIN_LINES;

  class Decoy {
    constructor(x, y) {
      this.x = x * TS - 1; this.w = 18; this.h = 22;
      this.y = y * TS + 16 - this.h;
      this.flat = false;
      this.t = 0;
      this.fallT = 0;
    }
    update(W) {
      this.t++;
      if (this.flat) { if (this.fallT < 20) this.fallT++; return; }
      const p = W.player;
      if (U.overlap(p, this) && !p.dead) this.knock(W);
    }
    knock(W) {
      if (this.flat) return;
      this.flat = true;
      HK.Audio.sfx('decoy');
      FX.text(this.x + 9, this.y - 4, 'PAPP-KEVIN!', '#e0c09a', { life: 80 });
      FX.burst(this.x + 9, this.y + 10, 10, { colors: ['#c8a27a', '#e0c09a', '#8a5a32'] });
      W.stats.decoys++;
    }
    draw(ctx, cam) {
      const x = Math.round(this.x + 9 - cam.ix), y = Math.round(this.y + this.h - cam.iy);
      if (!this.flat) {
        const sway = Math.sin(this.t * 0.03) * 0.03;
        S.draw(ctx, 'decoy', 0, x, y + 4, { rot: sway });
      } else {
        const k = U.ease.outBounce(Math.min(1, this.fallT / 20));
        if (k < 1) S.draw(ctx, 'decoy', 0, x, y + 4, { rot: (k * Math.PI) / 2 });
        else S.draw(ctx, 'decoy_flat', 0, x, y);
      }
    }
  }

  HK.Ent = { Shot, EnemyShot, Coin, Gem, PowerUp, Checkpoint, Spring, Sign, Platform, Kevin, Decoy };
})((window.HK = window.HK || {}));
