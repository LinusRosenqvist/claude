/* Hitta Kevin — fiender och bossen Robo-Kevin. */
(function (HK) {
  'use strict';
  const U = HK.U;
  const T = HK.T;
  const S = HK.Sprites;
  const FX = HK.FX;
  const TS = 16;

  class Enemy {
    constructor(W, x, y, o) {
      this.W = W;
      this.x = x; this.y = y; this.w = o.w; this.h = o.h;
      this.vx = 0; this.vy = 0;
      this.hp = o.hp || 1; this.maxHp = this.hp;
      this.stompable = o.stompable !== false;
      this.shootable = o.shootable !== false;
      this.gravity = o.gravity !== false;
      this.collide = o.collide !== false;
      this.harmful = o.harmful !== false;
      this.sprite = o.sprite;
      this.points = o.points || 100;
      this.facing = -1;
      this.t = 0; this.flash = 0;
      this.dead = false; this.dying = null; this.dieT = 0;
      this.active = false;
      this.spawnX = x; this.spawnY = y;
      this.flipSprite = o.flipSprite !== false; // sprites tittar åt höger
      this.coinDrop = o.coinDrop == null ? 0.35 : o.coinDrop;
    }
    get cx() { return this.x + this.w / 2; }
    get cy() { return this.y + this.h / 2; }

    update() {
      const W = this.W;
      if (!this.active) {
        if (W.cam.visible(this.x, this.y, this.w, this.h, 24)) this.active = true;
        else return;
      }
      if (!W.cam.visible(this.x, this.y, this.w, this.h, 520) && !this.boss) return; // sov långt bort
      this.t++;
      if (this.flash > 0) this.flash--;
      if (this.dying) { this.updateDying(); return; }
      this.ai(W);
      if (this.gravity) this.vy = Math.min(this.vy + 0.4 * W.gravity, 6 * (W.gravity < 1 ? 0.7 : 1));
      if (this.collide) HK.Physics.move(this, W.level, {});
      else { this.x += this.vx; this.y += this.vy; }
      if (this.y > W.level.ph + 48) this.dead = true;
      if (this.W.level.get(Math.floor(this.cx / TS), Math.floor((this.y + this.h - 2) / TS)) === T.LIQUID && this.gravity && !this.liquidOk) {
        this.die('liquid');
      }
    }

    ai() {}

    // Gå och vänd vid väggar/kanter
    walk(speed, edges) {
      const W = this.W;
      if (this.onGround && edges) {
        const fx = this.facing > 0 ? this.x + this.w + 1 : this.x - 1;
        const below = W.level.get(Math.floor(fx / TS), Math.floor((this.y + this.h + 2) / TS));
        if (!HK.Tiles.SOLID[below] && below !== T.ONEWAY) this.facing = -this.facing;
      }
      if (this.hitWall) this.facing = -this.hitWall;
      this.vx = this.facing * speed;
    }

    hit(dmg, src) {
      if (this.dying || !this.shootable) return false;
      this.hp -= dmg;
      this.flash = 6;
      if (src && src.vx) this.x += Math.sign(src.vx) * 1;
      if (this.hp <= 0) this.die('shot');
      else HK.Audio.sfx('hit');
      return true;
    }

    stomp(p) {
      this.die('stomp');
      return true;
    }

    die(how) {
      if (this.dying) return;
      const W = this.W;
      this.dying = how;
      this.dieT = 0;
      W.stats.enemies++;
      W.addScore(this.points, this.cx, this.y);
      if (how === 'stomp') {
        HK.Audio.sfx('stomp');
        FX.burst(this.cx, this.y + this.h, 8, { colors: ['#ffffff', '#ffd23f'], up: 1 });
      } else if (how === 'liquid') {
        HK.Audio.sfx('splash');
        FX.burst(this.cx, this.y + this.h, 10, { colors: ['#ffffff', '#9ff3ff'], up: 2 });
        this.dead = true;
        return;
      } else {
        HK.Audio.sfx('enemydie');
        this.vy = -4;
        this.vx = (this.W.player.cx < this.cx ? 1 : -1) * 1.2;
        FX.burst(this.cx, this.cy, 12, { colors: ['#ffffff', '#ffd23f', '#ff9f1c'] });
        FX.ring(this.cx, this.cy, '#ffffff', 14, 14);
      }
      if (Math.random() < this.coinDrop) W.dropCoin(this.cx - 5, this.y);
    }

    updateDying() {
      this.dieT++;
      if (this.dying === 'stomp') {
        if (this.dieT > 30) this.dead = true;
      } else {
        this.vy += 0.3;
        this.x += this.vx;
        this.y += this.vy;
        if (this.dieT > 120) this.dead = true;
      }
    }

    frame() {
      return Math.floor(this.t / 8);
    }

    draw(ctx, cam) {
      const x = Math.round(this.cx - cam.ix), y = Math.round(this.y + this.h - cam.iy);
      const flip = this.flipSprite ? this.facing < 0 : false;
      if (this.dying === 'stomp') {
        const flat = S.get(this.sprite + '_flat') ? this.sprite + '_flat' : null;
        if (flat) S.draw(ctx, flat, 0, x, y, { flip });
        else S.draw(ctx, this.sprite, 0, x, y, { flip, sy: 0.4, sx: 1.3 });
        return;
      }
      if (this.dying) {
        S.draw(ctx, this.sprite, 0, x, y - this.h / 2, { flip, sy: -1, ay: 0.5 });
        return;
      }
      S.draw(ctx, this.sprite, this.frame(), x, y + (this.drawOffY || 0), { flip, flash: this.flash > 0 ? '#ffffff' : null });
    }
  }

  // ---------------------------------------------------------------------
  class Blobb extends Enemy {
    constructor(W, x, y, red) {
      super(W, x + 2, y + 4, { w: 12, h: 12, hp: 1, sprite: red ? 'blobb_red' : 'blobb', points: red ? 150 : 100 });
      this.red = red;
      this.speed = red ? 0.8 : 0.45;
      this.hopT = U.randInt(60, 140);
    }
    ai(W) {
      this.walk(this.speed, true);
      if (this.red && this.onGround && --this.hopT <= 0) {
        this.vy = -4.6 * Math.sqrt(W.gravity);
        this.hopT = U.randInt(80, 160);
        this.facing = W.player.cx < this.cx ? -1 : 1;
      }
    }
    frame() { return Math.floor(this.t / (this.red ? 5 : 8)); }
  }

  class Taggis extends Enemy {
    constructor(W, x, y) {
      super(W, x + 1, y + 5, { w: 14, h: 11, hp: 2, sprite: 'taggis', stompable: false, points: 200 });
    }
    ai() { this.walk(0.4, true); }
    frame() { return Math.floor(this.t / 10); }
  }

  class Fladder extends Enemy {
    constructor(W, x, y) {
      super(W, x + 2, y + 3, { w: 14, h: 10, hp: 1, sprite: 'fladder', gravity: false, points: 150 });
      this.baseY = this.y;
      this.dir = -1;
    }
    ai(W) {
      const p = W.player;
      const dx = p.cx - this.cx;
      if (Math.abs(dx) < 150 && Math.abs(p.cy - this.cy) < 110) {
        this.vx = U.approach(this.vx, Math.sign(dx) * 0.9, 0.03);
        this.baseY = U.approach(this.baseY, U.clamp(p.cy - 20, this.spawnY - 48, this.spawnY + 64), 0.3);
      } else {
        this.vx = U.approach(this.vx, this.dir * 0.5, 0.03);
        if (Math.abs(this.x - this.spawnX) > 64) this.dir = this.x > this.spawnX ? -1 : 1;
      }
      if (this.hitWall) { this.dir = -this.hitWall; this.vx = -this.vx; }
      this.facing = this.vx < 0 ? -1 : 1;
      const ty = this.baseY + Math.sin(this.t * 0.08) * 10;
      this.vy = (ty - this.y) * 0.15;
    }
    frame() { return [0, 1, 2, 1][Math.floor(this.t / 5) % 4]; }
  }

  class Hoppis extends Enemy {
    constructor(W, x, y) {
      super(W, x + 2, y + 4, { w: 12, h: 12, hp: 1, sprite: 'hoppis', points: 150 });
      this.wait = U.randInt(40, 90);
    }
    ai(W) {
      if (this.onGround) {
        this.vx = U.approach(this.vx, 0, 0.2);
        this.facing = W.player.cx < this.cx ? -1 : 1;
        if (--this.wait <= 0) {
          this.vy = -5.2 * Math.sqrt(W.gravity);
          this.vx = this.facing * 1.3;
          this.wait = U.randInt(60, 110);
          HK.Audio.sfx('hop', { vol: 0.4 });
        }
      }
      if (this.hitWall) this.vx = -this.vx * 0.5;
    }
    frame() { return this.onGround ? 0 : 1; }
  }

  class Rocket extends Enemy {
    constructor(W, x, y, dir) {
      super(W, x, y, { w: 14, h: 8, hp: 1, sprite: 'raket', gravity: false, points: 100, coinDrop: 0 });
      this.facing = dir;
      this.active = true;
      this.vx = dir * 1.7;
    }
    ai() {
      this.vx = this.facing * 1.7;
      if (this.hitWall) { this.die('shot'); }
      if (this.t % 4 === 0) FX.add({ type: 'px', x: this.facing > 0 ? this.x - 1 : this.x + this.w + 1, y: this.cy, vx: -this.facing * 0.4, vy: U.rand(-0.2, 0.2), life: 14, size: 2, color: U.pick(['#9aa7c2', '#c7cbe0']), fade: true }, true);
      if (this.t > 600) this.dead = true;
    }
    frame() { return Math.floor(this.t / 4); }
  }

  class Kanon extends Enemy {
    constructor(W, tx, ty) {
      super(W, tx * TS, ty * TS, { w: 16, h: 16, hp: 99, sprite: 'kanon', gravity: false, collide: false, harmful: false, stompable: false, shootable: false });
      this.timer = U.randInt(60, 140);
      this.invisible = true;
    }
    ai(W) {
      const p = W.player;
      const dx = p.cx - this.cx, dy = p.cy - this.cy;
      if (Math.abs(dx) < 300 && Math.abs(dx) > 26 && Math.abs(dy) < 140) {
        if (--this.timer <= 0) {
          const dir = dx < 0 ? -1 : 1;
          const tx = Math.floor(this.x / TS) + dir;
          if (!W.level.solid(tx, Math.floor(this.cy / TS))) {
            W.addEnemy(new Rocket(W, dir > 0 ? this.x + 16 : this.x - 14, this.cy - 4, dir));
            FX.smoke(dir > 0 ? this.x + 18 : this.x - 2, this.cy, 4);
            HK.Audio.sfx('cannon');
            W.game.shake(0.8);
          }
          this.timer = U.randInt(150, 210);
        }
      }
    }
    draw() {}
  }

  class Dronare extends Enemy {
    constructor(W, x, y) {
      super(W, x, y + 2, { w: 16, h: 10, hp: 2, sprite: 'dronare', gravity: false, points: 250, flipSprite: false });
      this.fire = U.randInt(60, 120);
    }
    ai(W) {
      const p = W.player;
      const dx = p.cx - this.cx;
      const want = U.clamp(p.cx + (dx > 0 ? -70 : 70), this.spawnX - 160, this.spawnX + 160);
      this.vx = U.approach(this.vx, U.clamp((want - this.cx) * 0.02, -0.7, 0.7), 0.04);
      const ty = this.spawnY + Math.sin(this.t * 0.05) * 8;
      this.vy = (ty - this.y) * 0.08;
      if (Math.hypot(dx, p.cy - this.cy) < 220 && --this.fire <= 0) {
        const a = Math.atan2(p.cy - this.cy, dx);
        W.addEnemyShot(this.cx, this.cy + 2, Math.cos(a) * 2, Math.sin(a) * 2);
        HK.Audio.sfx('laser');
        this.fire = U.randInt(100, 140);
      }
    }
    frame() { return Math.floor(this.t / 2); }
  }

  class Robot extends Enemy {
    constructor(W, x, y) {
      super(W, x + 2, y, { w: 12, h: 16, hp: 2, sprite: 'robot', points: 250 });
      this.fire = 90;
      this.pause = 0;
    }
    ai(W) {
      const p = W.player;
      if (this.pause > 0) {
        this.pause--;
        this.vx = 0;
        if (this.pause === 10) {
          W.addEnemyShot(this.cx + this.facing * 8, this.y + 7, this.facing * 2.3, 0);
          HK.Audio.sfx('laser');
        }
        return;
      }
      this.walk(0.55, true);
      const dx = p.cx - this.cx;
      if (--this.fire <= 0 && Math.sign(dx) === this.facing && Math.abs(dx) < 190 && Math.abs(p.cy - this.cy) < 40) {
        this.pause = 30;
        this.fire = 160;
      }
    }
    frame() { return this.pause > 0 ? Math.floor(this.t / 3) : Math.floor(this.t / 10); }
  }

  class Krabba extends Enemy {
    constructor(W, x, y) {
      super(W, x, y + 4, { w: 16, h: 12, hp: 2, sprite: 'krabba', stompable: false, points: 250 });
      this.shell = true;
    }
    ai() { this.walk(this.shell ? 0.55 : 1.1, true); }
    hit(dmg, src) {
      if (this.shell && !this.dying) {
        this.shell = false;
        this.stompable = true;
        this.sprite = 'krabba_naken';
        this.flash = 8;
        this.hp = 1;
        HK.Audio.sfx('crystal');
        FX.burst(this.cx, this.y + 2, 10, { colors: ['#7af5ff', '#b8fbff', '#ffffff'], up: 1.5 });
        return true;
      }
      return super.hit(dmg, src);
    }
    frame() { return Math.floor(this.t / 12); }
  }

  class Spoke extends Enemy {
    constructor(W, x, y) {
      super(W, x + 2, y + 2, { w: 12, h: 13, hp: 3, sprite: 'spoke', gravity: false, collide: false, stompable: false, points: 300 });
      this.phase = 'visible';
      this.pt = 0;
      this.alpha = 1;
    }
    ai(W) {
      const p = W.player;
      this.pt++;
      const dx = p.cx - this.cx, dy = p.cy - this.cy;
      const d = Math.hypot(dx, dy) || 1;
      const sp = this.phase === 'hidden' ? 0.9 : 0.32;
      if (d < 260) {
        this.vx = U.approach(this.vx, (dx / d) * sp, 0.03);
        this.vy = U.approach(this.vy, (dy / d) * sp + Math.sin(this.t * 0.06) * 0.2, 0.03);
      } else { this.vx *= 0.95; this.vy *= 0.95; }
      this.facing = dx < 0 ? -1 : 1;
      if (this.phase === 'visible' && this.pt > 170) { this.phase = 'fadeout'; this.pt = 0; }
      else if (this.phase === 'fadeout') { this.alpha = 1 - this.pt / 30; if (this.pt >= 30) { this.phase = 'hidden'; this.pt = 0; } }
      else if (this.phase === 'hidden' && this.pt > 90) { this.phase = 'fadein'; this.pt = 0; HK.Audio.sfx('ghost'); }
      else if (this.phase === 'fadein') { this.alpha = this.pt / 30; if (this.pt >= 30) { this.phase = 'visible'; this.pt = 0; } }
      if (this.phase === 'hidden') this.alpha = 0.08;
      this.harmful = this.alpha > 0.6;
      this.shootable = this.alpha > 0.6;
    }
    frame() { return Math.floor(this.t / 12); }
    draw(ctx, cam) {
      const x = Math.round(this.cx - cam.ix), y = Math.round(this.y + this.h - cam.iy);
      if (this.dying) return super.draw(ctx, cam);
      S.draw(ctx, 'spoke', this.frame(), x, y, { flip: this.facing < 0, alpha: 0.85 * this.alpha, flash: this.flash > 0 ? '#ffffff' : null });
    }
  }

  class Blixt {
    constructor(W, x, top, bottom) {
      this.W = W; this.x = x - 5; this.y = top; this.w = 10; this.h = bottom - top;
      this.t = 0; this.dead = false; this.active = true; this.harmful = true; this.shootable = false; this.stompable = false;
      this.isHazard = true;
    }
    update() { if (++this.t > 20) this.dead = true; }
    draw(ctx, cam) {
      const x = Math.round(this.x + 5 - cam.ix);
      for (let y = this.y; y < this.y + this.h; y += 24) S.draw(ctx, 'blixt', (this.t >> 1) % 2, x, Math.round(y + 24 - cam.iy), { alpha: this.t > 14 ? 0.5 : 1 });
      if (this.t < 3) { ctx.fillStyle = 'rgba(255,255,255,0.25)'; ctx.fillRect(0, 0, U.VIEW_W, U.VIEW_H); }
    }
  }

  class Askmoln extends Enemy {
    constructor(W, x, y) {
      super(W, x - 4, y + 2, { w: 24, h: 14, hp: 3, sprite: 'askmoln', gravity: false, collide: false, points: 400 });
      this.cool = 90;
      this.charge = 0;
    }
    ai(W) {
      const p = W.player;
      const dx = p.cx - this.cx;
      if (this.charge > 0) {
        this.charge--;
        this.vx = 0;
        this.x += (this.t % 4 < 2 ? 1 : -1) * 0.5;
        if (this.charge === 0) {
          // blixtnedslag till marken
          const lvl = W.level;
          const tx = Math.floor(this.cx / TS);
          let ty = Math.floor((this.y + this.h) / TS);
          while (ty < lvl.h && !lvl.solid(tx, ty) && lvl.get(tx, ty) !== T.ONEWAY) ty++;
          W.addEnemy(new Blixt(W, this.cx, this.y + this.h, ty * TS));
          HK.Audio.sfx('thunder');
          W.game.shake(2);
          this.cool = 150;
        }
      } else {
        if (Math.abs(dx) < 220) this.vx = U.approach(this.vx, U.clamp(dx * 0.03, -0.8, 0.8), 0.03);
        else this.vx *= 0.95;
        if (--this.cool <= 0 && Math.abs(dx) < 10 && p.y > this.y) this.charge = 45;
      }
      this.vy = (this.spawnY + Math.sin(this.t * 0.04) * 4 - this.y) * 0.1;
      this.facing = dx < 0 ? -1 : 1;
    }
    frame() { return this.charge > 0 ? Math.floor(this.t / 3) : Math.floor(this.t / 20); }
    stomp(p) {
      this.die('stomp');
      return true;
    }
  }

  class Lavabubbla extends Enemy {
    constructor(W, tx, ty) {
      super(W, tx * TS + 2, ty * TS, { w: 12, h: 14, hp: 1, sprite: 'lavabubbla', gravity: false, collide: false, stompable: false, points: 150, coinDrop: 0 });
      this.surf = ty * TS;
      // hitta ytan
      const lvl = W.level;
      let sy = ty;
      while (sy > 0 && lvl.get(tx, sy - 1) === T.LIQUID) sy--;
      this.surf = sy * TS + 4;
      this.y = this.surf + 20;
      this.state = 'wait';
      this.wait = U.randInt(30, 140);
      this.liquidOk = true;
    }
    ai(W) {
      if (this.state === 'wait') {
        this.harmful = false; this.shootable = false;
        this.y = this.surf + 20;
        if (--this.wait <= 0) {
          this.state = 'jump';
          this.vy = -7.6;
          this.y = this.surf;
          HK.Audio.sfx('lavapop', { vol: 0.5 });
          FX.burst(this.cx, this.surf, 6, { colors: ['#ff9f1c', '#fff27a'], up: 2 });
        }
        return;
      }
      this.harmful = true; this.shootable = true;
      this.vy += 0.26;
      if (this.y > this.surf + 20 && this.vy > 0) {
        this.state = 'wait';
        this.wait = U.randInt(80, 170);
        FX.burst(this.cx, this.surf, 5, { colors: ['#ff9f1c', '#fff27a'], up: 1.5 });
      }
      if (this.t % 3 === 0) FX.add({ type: 'px', x: this.cx + U.rand(-3, 3), y: this.y + this.h, vy: 0.3, life: 14, size: 2, color: U.pick(['#ff9f1c', '#ff3b30']), fade: true }, true);
    }
    hit(dmg, src) {
      if (this.state === 'wait') return false;
      FX.burst(this.cx, this.cy, 10, { colors: ['#ff9f1c', '#fff27a', '#ffffff'] });
      HK.Audio.sfx('hit');
      this.state = 'wait';
      this.wait = 200;
      this.W.stats.enemies++;
      return true;
    }
    draw(ctx, cam) {
      if (this.state === 'wait') return;
      const x = Math.round(this.cx - cam.ix), y = Math.round(this.y + this.h - cam.iy);
      S.draw(ctx, 'lavabubbla', Math.floor(this.t / 4), x, y, { sy: this.vy > 0 ? -1 : 1, ay: this.vy > 0 ? 0 : 1 });
    }
  }

  class Eldstav extends Enemy {
    constructor(W, tx, ty, len) {
      super(W, tx * TS, ty * TS, { w: 16, h: 16, hp: 99, sprite: 'eld', gravity: false, collide: false, stompable: false, shootable: false, points: 0 });
      this.len = len || 5;
      this.ang = (tx * 0.7) % (Math.PI * 2);
      this.dir = tx % 2 ? 1 : -1;
      this.isHazard = true;
    }
    ai() { this.ang += 0.032 * this.dir; }
    balls() {
      const out = [];
      for (let i = 1; i <= this.len; i++) {
        const r = i * 8;
        out.push({ x: this.x + 8 + Math.cos(this.ang) * r - 4, y: this.y + 8 + Math.sin(this.ang) * r - 4, w: 8, h: 8 });
      }
      return out;
    }
    hurtBoxes() { return this.balls(); }
    draw(ctx, cam) {
      for (const b of this.balls()) S.draw(ctx, 'eld', Math.floor(this.t / 4), Math.round(b.x + 4 - cam.ix), Math.round(b.y + 9 - cam.iy));
    }
  }

  class Stamp extends Enemy {
    constructor(W, x, y) {
      super(W, x - 4, y, { w: 24, h: 26, hp: 99, sprite: 'stamp', gravity: false, collide: false, stompable: false, shootable: false, points: 0 });
      this.state = 'wait';
      this.timer = 0;
      this.isPlatform = true;
      this.solidTop = true;
      this.dx = 0; this.dy = 0;
      this.flipSprite = false;
    }
    ai(W) {
      const p = W.player;
      const oy = this.y;
      if (this.state === 'wait') {
        this.y = this.spawnY;
        if (Math.abs(p.cx - this.cx) < 26 && p.y > this.y + this.h - 4 && p.y - this.y < 220) { this.state = 'fall'; this.vy = 0; }
      } else if (this.state === 'fall') {
        this.vy = Math.min(this.vy + 0.55, 8);
        this.y += this.vy;
        const lvl = W.level;
        const ty = Math.floor((this.y + this.h) / TS);
        const x0 = Math.floor((this.x + 2) / TS), x1 = Math.floor((this.x + this.w - 2) / TS);
        let hit = false;
        for (let tx = x0; tx <= x1; tx++) if (lvl.solid(tx, ty) || lvl.get(tx, ty) === T.ONEWAY) hit = true;
        if (hit) {
          this.y = ty * TS - this.h;
          this.state = 'land';
          this.timer = 50;
          if (W.cam.visible(this.x, this.y, this.w, this.h, 0)) { W.game.shake(3); HK.Audio.sfx('thud'); }
          FX.landPuff(this.x + 4, this.y + this.h, 6);
          FX.landPuff(this.x + this.w - 4, this.y + this.h, 6);
        }
      } else if (this.state === 'land') {
        if (--this.timer <= 0) this.state = 'rise';
      } else if (this.state === 'rise') {
        // står spelaren på stampen och taket är i vägen? då väntar stampen
        if (!(W.riding(this) && W.headBlocked(p, -0.8))) {
          this.y -= 0.8;
          if (this.y <= this.spawnY) { this.y = this.spawnY; this.state = 'wait'; }
        }
      }
      this.vy = 0;
      this.dy = this.y - oy;
      this.dx = 0;
    }
    hurtBoxes() {
      // bara sidor och undersida gör ont
      return [{ x: this.x + 1, y: this.y + 6, w: this.w - 2, h: this.h - 4 }];
    }
    stoodOn() {}
    get active2() { return true; }
    frame() { return this.state === 'fall' || this.state === 'land' ? 1 : 0; }
  }

  class Rymdis extends Enemy {
    constructor(W, x, y) {
      super(W, x + 2, y + 4, { w: 12, h: 12, hp: 1, sprite: 'rymdis', points: 150 });
      this.wait = U.randInt(20, 60);
    }
    ai(W) {
      if (this.onGround) {
        this.vx = U.approach(this.vx, 0, 0.1);
        if (--this.wait <= 0) {
          this.facing = W.player.cx < this.cx ? -1 : 1;
          this.vy = -4.2 * Math.sqrt(W.gravity);
          this.vx = this.facing * 0.9;
          this.wait = U.randInt(40, 70);
        }
      }
    }
    frame() { return this.onGround ? 0 : 1; }
  }

  class Ufo extends Enemy {
    constructor(W, x, y) {
      super(W, x - 4, y + 2, { w: 22, h: 10, hp: 3, sprite: 'ufo', gravity: false, collide: false, points: 400, flipSprite: false });
      this.dir = 1;
      this.cool = 60;
    }
    ai(W) {
      const p = W.player;
      const dx = p.cx - this.cx;
      if (Math.abs(dx) < 200) this.vx = U.approach(this.vx, U.clamp(dx * 0.02, -1, 1), 0.04);
      else {
        this.vx = U.approach(this.vx, this.dir * 0.6, 0.03);
        if (Math.abs(this.x - this.spawnX) > 80) this.dir = this.x > this.spawnX ? -1 : 1;
      }
      this.vy = (this.spawnY + Math.sin(this.t * 0.05) * 6 - this.y) * 0.1;
      if (--this.cool <= 0 && Math.abs(dx) < 20 && p.y > this.y) {
        W.addEnemyShot(this.cx, this.y + this.h + 2, this.vx * 0.5, 0.5, 'drop');
        HK.Audio.sfx('laser');
        this.cool = 70;
      }
    }
    frame() { return Math.floor(this.t / 6); }
  }

  // =====================================================================
  // BOSS: ROBO-KEVIN
  // =====================================================================
  class RoboKevin extends Enemy {
    constructor(W, x, y) {
      super(W, x, y, { w: 30, h: 40, hp: 40, sprite: 'robokevin', gravity: false, collide: false, stompable: false, points: 5000, coinDrop: 0 });
      this.boss = true;
      this.state = 'sleep';
      this.st = 0;
      this.volleys = 0;
      this.cycle = 0;
      this.homeY = y;
      this.flipSprite = true;
      this.facing = -1;
      this.name = 'ROBO-KEVIN';
    }
    get phase() { return this.hp > 26 ? 1 : this.hp > 12 ? 2 : 3; }
    arena() { return this.W.arena; }
    setState(s) { this.state = s; this.st = 0; }
    ai(W) {
      const p = W.player;
      const A = this.arena();
      this.st++;
      const ph = this.phase;
      if (this.state === 'sleep') {
        this.harmful = false; this.shootable = false;
        return;
      }
      this.harmful = true;
      this.shootable = true;
      this.stompable = false;
      if (this.t % 3 === 0 && this.state !== 'stun') {
        FX.add({ type: 'px', x: this.cx - this.facing * 12 + U.rand(-2, 2), y: this.y + 34, vx: U.rand(-0.3, 0.3), vy: U.rand(0.8, 1.6), life: 14, size: 2, color: U.pick(['#ff9f1c', '#fff27a', '#ff4d6d']), fade: true }, true);
      }
      switch (this.state) {
        case 'intro': {
          this.y = U.lerp(this.y, this.homeY, 0.05);
          if (this.st === 1) W.say(this, 'HA! DU HITTAR ALDRIG DEN RIKTIGA KEVIN!', 150);
          if (this.st > 150) this.setState('hover');
          break;
        }
        case 'hover': {
          const tx = A.x0 + 60 + (Math.sin(this.st * (0.012 + ph * 0.004)) * 0.5 + 0.5) * (A.x1 - A.x0 - 150);
          this.x = U.lerp(this.x, tx, 0.04);
          this.y = U.lerp(this.y, this.homeY + Math.sin(this.st * 0.05) * 8, 0.08);
          this.facing = p.cx < this.cx ? -1 : 1;
          const rate = [0, 75, 60, 45][ph];
          if (this.st % rate === rate - 1) {
            const n = ph === 1 ? 3 : 5;
            const base = Math.atan2(p.cy - this.cy, p.cx - this.cx);
            for (let i = 0; i < n; i++) {
              const a = base + (i - (n - 1) / 2) * 0.22;
              const sp = 2 + ph * 0.3;
              W.addEnemyShot(this.cx + this.facing * 16, this.y + 22, Math.cos(a) * sp, Math.sin(a) * sp);
            }
            HK.Audio.sfx('laser');
            this.volleys++;
          }
          if (this.volleys >= 3 + (ph === 3 ? 1 : 0)) {
            this.volleys = 0;
            this.cycle++;
            if (ph === 3 && this.cycle % 2 === 0) this.setState('dashprep');
            else this.setState('rise');
          }
          break;
        }
        case 'rise': {
          this.y = U.lerp(this.y, A.y0 + 10, 0.08);
          this.x = U.lerp(this.x, U.clamp(p.cx - this.w / 2, A.x0 + 20, A.x1 - this.w - 20), 0.08);
          if (this.st > 40) this.setState('warn');
          break;
        }
        case 'warn': {
          this.x += (this.st % 4 < 2 ? 1 : -1);
          if (this.st > (ph === 3 ? 14 : 24)) { this.setState('pound'); this.vy = 2; HK.Audio.sfx('dive'); }
          break;
        }
        case 'pound': {
          this.vy = Math.min(this.vy + 0.6, 9);
          this.y += this.vy;
          if (this.y + this.h >= A.floor) {
            this.y = A.floor - this.h;
            this.vy = 0;
            W.game.shake(5);
            HK.Audio.sfx('thud');
            FX.landPuff(this.cx - 10, A.floor, 8);
            FX.landPuff(this.cx + 10, A.floor, 8);
            const sp = 2 + ph * 0.5;
            W.addEnemyShot(this.x - 4, A.floor - 5, -sp, 0, 'wave');
            W.addEnemyShot(this.x + this.w + 4, A.floor - 5, sp, 0, 'wave');
            this.setState('stun');
          }
          break;
        }
        case 'stun': {
          this.stompable = true;
          if (this.st % 10 === 0) FX.sparkle(this.cx + U.rand(-10, 10), this.y + 4, '#ffd23f', 1);
          if (this.st > (ph === 3 ? 60 : 85)) {
            if (ph >= 2 && this.cycle % 2 === 1) this.setState('summon');
            else this.setState('back');
          }
          break;
        }
        case 'summon': {
          if (this.st === 10) {
            W.say(this, 'ANFALL, BLOBBAR!', 80);
            W.addEnemy(Object.assign(new Blobb(W, A.x0 + 24, A.y0 + 20, ph === 3), { active: true }));
            W.addEnemy(Object.assign(new Blobb(W, A.x1 - 40, A.y0 + 20, ph === 3), { active: true }));
            HK.Audio.sfx('poof');
          }
          if (this.st > 40) this.setState('back');
          break;
        }
        case 'back': {
          this.y = U.lerp(this.y, this.homeY, 0.06);
          if (Math.abs(this.y - this.homeY) < 2) this.setState('hover');
          break;
        }
        case 'dashprep': {
          const side = p.cx < (A.x0 + A.x1) / 2 ? 1 : -1;
          this.dashDir = -side;
          const tx = side > 0 ? A.x1 - this.w - 10 : A.x0 + 10;
          this.x = U.lerp(this.x, tx, 0.1);
          this.y = U.lerp(this.y, A.floor - this.h - 18, 0.1);
          this.facing = this.dashDir;
          if (this.st > 50) { this.setState('dash'); HK.Audio.sfx('dive'); }
          break;
        }
        case 'dash': {
          this.x += this.dashDir * 5;
          if (this.st % 2 === 0) FX.add({ type: 'px', x: this.cx, y: this.cy + U.rand(-10, 10), life: 16, size: 3, color: '#ff3860', fade: true }, true);
          if ((this.dashDir > 0 && this.x + this.w > A.x1 - 8) || (this.dashDir < 0 && this.x < A.x0 + 8)) this.setState('back');
          break;
        }
      }
    }
    stomp(p) {
      if (this.state !== 'stun') return false;
      this.hit(4, null, true);
      this.setState('back');
      return true;
    }
    hit(dmg, src, stomped) {
      if (this.dying || this.state === 'sleep' || this.state === 'intro') return false;
      this.hp -= dmg;
      this.flash = 6;
      HK.Audio.sfx(stomped ? 'stomp' : 'hit');
      if (this.hp <= 0) {
        this.hp = 0;
        this.dying = 'boss';
        this.dieT = 0;
        this.W.stats.enemies++;
        this.W.onBossDown(this);
      }
      return true;
    }
    updateDying() {
      this.dieT++;
      if (this.dieT % 7 === 0 && this.dieT < 130) {
        const x = this.x + U.rand(0, this.w), y = this.y + U.rand(0, this.h);
        FX.burst(x, y, 12, { colors: ['#ffffff', '#ffd23f', '#ff9f1c', '#ff3860'] });
        FX.ring(x, y, '#ffd23f', 18, 16);
        FX.smoke(x, y, 2);
        HK.Audio.sfx('explosion');
        this.W.game.shake(3);
      }
      if (this.dieT > 130) {
        this.vy += 0.25;
        this.y += this.vy;
      }
      if (this.dieT > 220) this.dead = true;
    }
    frame() {
      if (this.flash > 0) return 2;
      return this.state === 'hover' && this.st % 75 > 60 ? 1 : 0;
    }
    draw(ctx, cam) {
      if (this.state === 'sleep') return;
      const x = Math.round(this.cx - cam.ix), y = Math.round(this.y + this.h - cam.iy);
      const ph = this.phase;
      let fl = this.flash > 0 ? '#ffffff' : null;
      if (!fl && ph === 3 && this.t % 20 < 4) fl = '#ff3860';
      S.draw(ctx, 'robokevin', this.frame(), x, y + 2, { flip: this.facing > 0, flash: fl, rot: this.dying ? Math.sin(this.dieT * 0.5) * 0.1 : 0 });
      if (this.state === 'stun') HK.Font.draw(ctx, '★ ★', x, y - 50 + Math.round(Math.sin(this.t * 0.2) * 2), { color: '#ffd23f', align: 'center' });
      if (this.state === 'warn') HK.Font.draw(ctx, '!', x, y - 52, { color: '#ff3860', align: 'center', scale: 2 });
    }
  }

  // ---------------------------------------------------------------------
  const Enemies = {
    Enemy, Blobb, Taggis, Fladder, Hoppis, Rocket, Kanon, Dronare, Robot, Krabba, Spoke, Askmoln, Blixt, Lavabubbla, Eldstav, Stamp, Rymdis, Ufo, RoboKevin,
    create(W, ch, tx, ty) {
      const x = tx * TS, y = ty * TS;
      switch (ch) {
        case 'e': return new Blobb(W, x, y, false);
        case 'E': return new Blobb(W, x, y, true);
        case 'z': return new Taggis(W, x, y);
        case 'b': return new Fladder(W, x, y);
        case 'g': return new Hoppis(W, x, y);
        case 'C': return new Kanon(W, tx, ty);
        case 'd': return new Dronare(W, x, y);
        case 'p': return new Robot(W, x, y);
        case 'r': return new Krabba(W, x, y);
        case 'G': return new Spoke(W, x, y);
        case 'w': return new Askmoln(W, x, y);
        case 'L': return new Lavabubbla(W, tx, ty);
        case 'F': return new Eldstav(W, tx, ty, 5);
        case 'P': return new Stamp(W, x, y);
        case 'a': return new Rymdis(W, x, y);
        case 'u': return new Ufo(W, x, y);
        case 'R': return new RoboKevin(W, x - 8, y - 24);
      }
      return null;
    },
  };

  HK.Enemies = Enemies;
})((window.HK = window.HK || {}));
