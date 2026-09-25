/* Hitta Kevin — spelvärlden: allt som händer inne i en nivå. */
(function (HK) {
  'use strict';
  const U = HK.U;
  const T = HK.T;
  const FX = HK.FX;
  const I = HK.Input;
  const E = HK.Ent;
  const TS = 16;
  const VW = U.VIEW_W, VH = U.VIEW_H;

  const ENEMY_CHARS = 'eEzbgCdprGwLFPauR';
  const PICKUPS = { j: 'jetpack', f: 'fuel', H: 'heart', D: 'disco', t: 'triple', O: 'shield', m: 'magnet' };

  class World {
    constructor(def, opts) {
      opts = opts || {};
      this.def = def;
      this.game = HK.Game;
      this.level = new HK.Level(def);
      this.theme = this.level.theme;
      this.gravity = def.gravity || this.theme.gravity || 1;
      this.wind = def.wind || 0;
      this.darkness = def.dark != null ? def.dark : this.theme.dark;
      this.cam = new HK.Camera();
      this.cam.setBounds(this.level.pw, this.level.ph);
      this.t = 0;
      this.enemies = [];
      this.items = [];
      this.platforms = [];
      this.shots = [];
      this.eshots = [];
      this.decoys = [];
      this.signs = [];
      this.checkpoints = [];
      this.springs = [];
      this.bubbles = [];
      this.kevin = null;
      this.boss = null;
      this.arena = null;
      this.arenaLocked = false;
      this.stats = { coins: 0, gems: [false, false, false], enemies: 0, deaths: 0, hits: 0, decoys: 0, poofs: 0, secrets: 0, score: 0, time: 0 };
      this.checkpoint = null;
      this.state = 'play';
      this.cutscene = false;
      this.lookAhead = 0;
      this.camTY = 0;
      this.binoX = 0;
      this.binoY = 0;
      this.binoK = 0;
      this.foundT = 0;
      this.heat = 0;
      this.lightCanvas = U.makeCanvas(VW / 2, VH / 2);
      this.onComplete = opts.onComplete || null;
      this.onDeath = opts.onDeath || null;
      this.hudTimer = null;
      this.hudTitle = null;
      this.onBossStart = opts.onBossStart || null;
      FX.clear();
      this.spawnAll();
      this.gemTotal = this.items.filter((i) => i instanceof E.Gem).length;
      this.coinTotal = this.items.filter((i) => i instanceof E.Coin).length;
      const p = this.player;
      this.camTY = p.bottom - VH * 0.62;
      this.cam.snap(p.cx - VW / 2, this.camTY);
    }

    // ------------------------------------------------------------------
    spawnAll() {
      const lvl = this.level;
      const spots = [];
      let final = null;
      let signIdx = 0;
      const gems = [];
      const pdefs = this.def.platforms || [];
      let pIdx = 0;
      const seenPlat = new Set();
      const rows = lvl.rows;
      for (const s of lvl.spawns) {
        const x = s.x * TS, y = s.y * TS;
        const ch = s.ch;
        if (ch === '@') {
          this.player = new HK.Player(this, x + 3, y + TS - 18);
          this.start = { x: x + 3, y: y + TS - 18 };
        } else if (ch === 'K') final = { x: s.x, y: s.y };
        else if (ch >= '1' && ch <= '4') spots.push({ x: s.x, y: s.y, n: +ch });
        else if (ch === 'k') this.decoys.push(new E.Decoy(s.x, s.y));
        else if (ch === 'o') this.items.push(new E.Coin(x + 3, y + 2, 'static'));
        else if (ch === '*') gems.push(s);
        else if (ch === 'c') this.checkpoints.push(new E.Checkpoint(x, y));
        else if (ch === 's') this.springs.push(new E.Spring(x, y));
        else if (ch === 'n') this.signs.push(new E.Sign(x, y, (this.def.signs || [])[signIdx++]));
        else if (PICKUPS[ch]) this.items.push(new E.PowerUp(x, y, PICKUPS[ch], false));
        else if (ch === '-' || ch === '|') {
          const key = s.y * lvl.w + s.x;
          if (seenPlat.has(key)) continue;
          let len = 0;
          while (rows[s.y][s.x + len] === ch) { seenPlat.add(s.y * lvl.w + s.x + len); len++; }
          const pd = pdefs[pIdx++] || {};
          this.platforms.push(new E.Platform(x, y + 4, len, ch === '-' ? 'h' : 'v', (pd.range || 3) * TS, pd.speed || 0.018, pd.phase || 0));
        } else if (ch === 'x') {
          this.platforms.push(new E.Platform(x, y + 4, 1, 'fall'));
        } else if (ENEMY_CHARS.indexOf(ch) >= 0) {
          const e = HK.Enemies.create(this, ch, s.x, s.y);
          if (e) {
            this.enemies.push(e);
            if (e.boss) this.boss = e;
          }
        }
      }
      gems.sort((a, b) => a.x - b.x);
      gems.forEach((g, i) => this.items.push(new E.Gem(g.x * TS, g.y * TS, i)));
      spots.sort((a, b) => a.n - b.n);
      if (!final) final = spots.length ? spots.pop() : { x: 5, y: 5 };
      this.kevin = new E.Kevin(this, spots, final);
      if (!this.player) {
        this.player = new HK.Player(this, 32, 32);
        this.start = { x: 32, y: 32 };
      }
      if (this.def.jetpack) this.player.jetpack = true;
      if (this.boss) {
        const ar = this.def.arena || { x: Math.floor(this.boss.x / TS) - 15, w: 30 };
        const bx = Math.floor(this.boss.cx / TS);
        let fy = Math.floor(this.boss.y / TS);
        while (fy < lvl.h && !lvl.solid(bx, fy)) fy++;
        this.arena = { x0: ar.x * TS, x1: (ar.x + ar.w) * TS, y0: Math.max(0, fy * TS - 210), floor: fy * TS, gateX: ar.x };
        this.boss.homeY = fy * TS - 150;
        this.boss.y = this.arena.y0 - 120;
        this.kevin.caged = true;
      }
    }

    // ------------------------------------------------------------------
    update() {
      this.t++;
      const p = this.player;
      this.level.update();
      for (const pl of this.platforms) pl.update(this);
      // bär spelaren med plattformen
      if (p.platform && !p.dead) {
        const pl = p.platform;
        if (pl.dx) {
          const svx = p.vx, svy = p.vy;
          p.vx = pl.dx; p.vy = 0;
          HK.Physics.move(p, this.level, { dropThrough: true });
          p.vx = svx; p.vy = svy;
        }
        if (pl.dy) p.y += pl.dy;
      }
      p.lastBottom = p.bottom;
      p.update();
      // under intro-rutan står allt still så att ingen fiende hinner träffa spelaren
      const intro = this.cutscene && this.state === 'play';
      if (this.state === 'play' && !intro) this.playerInteractions();

      if (!intro) for (const e of this.enemies) e.update();
      if (this.state === 'play' && !intro) this.playerVsEnemies();
      this.updateShots();
      for (const it of this.items) it.update(this);
      for (const c of this.checkpoints) c.update(this);
      for (const s of this.springs) s.update(this);
      for (const s of this.signs) s.update(this);
      for (const d of this.decoys) d.update(this);
      this.kevin.update();
      for (const b of this.bubbles) b.t++;
      this.bubbles = this.bubbles.filter((b) => b.t < b.dur);

      if (this.level.touchFake(p)) {
        this.stats.secrets++;
        HK.Audio.sfx('secret');
        FX.text(p.cx, p.y - 10, 'HEMLIGT STÄLLE!', '#ffd23f', { life: 90 });
      }

      this.updateBoss();
      this.ambient();
      FX.update();
      this.updateCamera();
      this.updateRadar();
      if (this.state === 'play' && !p.dead) this.stats.time++;
      if (this.state === 'found') this.updateFound();

      this.enemies = this.enemies.filter((e) => !e.dead);
      this.items = this.items.filter((i) => !i.dead);
      this.shots = this.shots.filter((s) => !s.dead);
      this.eshots = this.eshots.filter((s) => !s.dead);
    }

    playerInteractions() {
      const p = this.player;
      if (p.dead) return;
      // föremål
      for (const it of this.items) {
        if (it.dead) continue;
        if (it instanceof E.Coin) {
          if (it.mode === 'pop' || it.canTake > 0) continue;
          if (U.overlap(p, it)) {
            it.dead = true;
            this.addCoins(1, it.x + 5, it.y);
            FX.sparkle(it.x + 5, it.y + 6, '#fff3a0', 2);
          }
        } else if (it instanceof E.Gem) {
          if (U.overlap(p, it)) { it.dead = true; this.collectGem(it); }
        } else if (it instanceof E.PowerUp) {
          if (it.takeable && U.overlap(p, it)) { it.dead = true; this.applyPowerUp(it.kind, it); }
        }
      }
      // checkpoints
      for (const c of this.checkpoints) {
        if (!c.active && U.overlap(p, c)) {
          c.active = true;
          this.checkpoint = { x: c.x, y: c.y + c.h - 18 };
          HK.Audio.sfx('checkpoint');
          FX.text(c.x + 6, c.y - 6, 'CHECKPOINT!', '#7dff6b', { life: 70 });
          FX.burst(c.x + 10, c.y + 8, 16, { colors: ['#ff4fa3', '#ffd23f', '#ffffff'], up: 1 });
          if (p.hp < p.maxHp) { p.hp = p.maxHp; FX.text(p.cx, p.y - 20, '♥ FULLT!', '#ff4d6d', { life: 60 }); }
        }
      }
      // fjädrar
      for (const s of this.springs) {
        if (p.vy > 0 && U.overlap(p, s) && p.lastBottom <= s.y + 6) {
          const held = I.held('jump');
          p.y = s.y - p.h;
          p.vy = -(held ? HK.PH.springHeld : HK.PH.spring) * p.jmul();
          p.jumping = held;
          p.thrustArmed = false;
          p.sx = 0.7; p.sy = 1.35;
          s.anim = 14;
          HK.Audio.sfx('spring');
          FX.burst(s.x + 7, s.y, 8, { colors: ['#ffffff', '#ffd23f'], up: 1.5 });
        }
      }
    }

    playerVsEnemies() {
      const p = this.player;
      if (p.dead) return;
      for (const e of this.enemies) {
        if (e.dead || e.dying || !e.active || !e.harmful) continue;
        const boxes = e.hurtBoxes ? e.hurtBoxes() : [e];
        for (const b of boxes) {
          if (!U.overlap(p, b)) continue;
          if (p.disco > 0 && !e.boss && !e.isHazard && e.shootable !== false) {
            e.die('shot');
            break;
          }
          if (e.stompable && p.vy > 0 && p.lastBottom <= b.y + 6) {
            if (e.stomp(p)) {
              p.bounce(I.held('jump'));
              this.game.hitstop = 2;
              this.stats.stomps = (this.stats.stomps || 0) + 1;
            }
            break;
          }
          if (e.isPlatform && p.lastBottom <= e.y + 3) continue;
          p.hurt(1, b.x + b.w / 2);
          break;
        }
      }
      for (const s of this.eshots) {
        if (!s.dead && U.overlap(p, s.box)) {
          if (p.hurt(1, s.x) || p.disco > 0) s.dead = true;
        }
      }
    }

    updateShots() {
      for (const s of this.shots) {
        s.update(this);
        if (s.dead) continue;
        const b = s.box;
        for (const e of this.enemies) {
          if (!e.active || e.dead || e.dying || !e.shootable) continue;
          const boxes = e.hurtBoxes && !e.boss ? e.hurtBoxes() : [e];
          let hit = false;
          for (const bb of boxes) if (U.overlap(b, bb)) { hit = true; break; }
          if (hit && e.hit(s.dmg, s)) {
            s.dead = true;
            FX.burst(s.x, s.y, 5, { colors: ['#ffffff', '#6ff6ff', '#ffd23f'], g: 0.05, min: 0.5, max: 1.8, lifeMin: 6, lifeMax: 12 });
            break;
          }
        }
        if (s.dead) continue;
        for (const d of this.decoys) {
          if (!d.flat && U.overlap(b, d)) { d.knock(this); s.dead = true; break; }
        }
        if (s.dead) continue;
        const k = this.kevin;
        if (k.state === 'hide' && s.kind === 'blaster' && U.overlap(b, k) && !k.caged) {
          s.dead = true;
          if (!this.bubbles.some((x) => x.ent === k)) this.say(k, U.pick(['AJ! SLUTA SKJUTA!', 'HALLÅ! DET KITTLAS!', 'INTE PÅ MIG!']), 70);
          FX.burst(s.x, s.y, 6, { colors: ['#ffffff', '#6ff6ff'] });
        }
        for (const es of this.eshots) {
          if (!es.dead && es.kind !== 'wave' && Math.abs(es.x - s.x) < 7 && Math.abs(es.y - s.y) < 7) {
            es.dead = true;
            s.dead = true;
            FX.burst(s.x, s.y, 8, { colors: ['#ffffff', '#ff4fa3', '#6ff6ff'] });
            HK.Audio.sfx('hit');
            break;
          }
        }
      }
      for (const s of this.eshots) s.update(this);
    }

    // ------------------------------------------------------------------
    addPlayerShot(x, y, vx, vy) {
      if (this.shots.length > 24) return;
      this.shots.push(new E.Shot(x, y, vx, vy, 'blaster'));
    }
    addEnemyShot(x, y, vx, vy, kind) {
      this.eshots.push(new E.EnemyShot(x, y, vx, vy, kind));
    }
    addEnemy(e) {
      this.enemies.push(e);
      return e;
    }
    jetFlame(p) {
      const x = p.cx - p.facing * 7, y = p.bottom - 4;
      this.shots.push(new E.Shot(x + U.rand(-1, 1), y, U.rand(-0.3, 0.3) + p.vx * 0.2, 2.6, 'flame'));
      FX.add({ type: 'px', x, y: y + 2, vx: U.rand(-0.4, 0.4), vy: U.rand(1, 2), life: 12, size: 2, color: U.pick(['#ff9f1c', '#fff27a', '#ff4d6d']), fade: true }, true);
    }
    autoAim(p) {
      let best = null, bd = 1e9;
      for (const e of this.enemies) {
        if (!e.active || e.dead || e.dying || !e.shootable || e.isHazard) continue;
        const dx = e.cx - p.cx, dy = e.cy - p.cy;
        if (Math.sign(dx) !== p.facing && Math.abs(dx) > 8 && !e.boss) continue;
        const d = Math.hypot(dx, dy);
        const range = e.boss ? 420 : 210;
        if (d < range && Math.abs(dy) < (e.boss ? 260 : 130) && d < bd) { bd = d; best = e; }
      }
      return best ? { x: best.cx, y: best.cy } : null;
    }
    magnetPull(p) {
      for (const it of this.items) {
        if (it instanceof E.Coin && it.mode !== 'pop' && !it.dead) {
          if (Math.hypot(it.x + 5 - p.cx, it.y + 6 - p.cy) < 100) it.magnetized = true;
        }
      }
    }
    dropCoin(x, y) {
      this.items.push(new E.Coin(x, y, 'drop'));
    }
    addCoins(n, x, y) {
      const before = this.stats.coins;
      this.stats.coins += n;
      HK.Audio.sfx('coin');
      const p = this.player;
      if (Math.floor(before / 50) !== Math.floor(this.stats.coins / 50)) {
        if (p.hp < p.maxHp) p.hp++;
        else if (p.maxHp < 5) { p.maxHp++; p.hp++; }
        FX.text(p.cx, p.y - 14, '50 MYNT! +♥', '#ff4d6d', { life: 80 });
        HK.Audio.sfx('heart');
      }
    }
    addScore(pts, x, y) {
      this.stats.score += pts;
      if (pts > 0) FX.text(x, y - 4, pts, '#ffffff', { life: 40 });
    }
    collectGem(g) {
      this.stats.gems[g.index] = true;
      const n = this.stats.gems.filter(Boolean).length;
      HK.Audio.sfx('gem');
      FX.text(g.x + 7, g.y - 6, 'DIAMANT ' + n + '/' + this.gemTotal + '!', ['#ff4d6d', '#4ade6b', '#4dc3ff'][g.index % 3], { life: 90 });
      FX.confetti(g.x + 7, g.y + 7, 24, { up: 1, max: 3 });
      FX.ring(g.x + 7, g.y + 7, '#ffffff', 20, 20);
    }
    applyPowerUp(kind, it) {
      const p = this.player;
      const x = it.x + 7, y = it.y;
      HK.Audio.sfx(kind === 'heart' ? 'heart' : kind === 'fuel' ? 'fuel' : 'powerup');
      FX.ring(x, y + 7, '#ffffff', 18, 16);
      FX.burst(x, y + 7, 12, { colors: ['#ffffff', '#ffd23f', '#6ff6ff'] });
      switch (kind) {
        case 'heart':
          if (p.hp < p.maxHp) p.hp++;
          else if (p.maxHp < 5) { p.maxHp++; p.hp = p.maxHp; }
          FX.text(x, y - 6, '+♥', '#ff4d6d');
          break;
        case 'shield': p.shield = true; FX.text(x, y - 6, 'SKÖLD!', '#6ff6ff'); break;
        case 'triple': p.triple = 60 * 20; FX.text(x, y - 6, 'TRIPPELSKOTT!', '#ffd23f'); break;
        case 'magnet': p.magnet = 60 * 15; FX.text(x, y - 6, 'MYNTMAGNET!', '#ff4d6d'); break;
        case 'disco':
          p.disco = 60 * 10;
          FX.text(x, y - 6, 'DISCO!', '#ffffff', { rainbow: true, life: 80 });
          this.prevSong = HK.Audio.currentSong() || this.theme.music;
          HK.Audio.playMusic('disco');
          break;
        case 'jetpack':
          p.jetpack = true;
          p.fuel = 100;
          FX.text(x, y - 6, 'JETPACK!', '#ff4d6d', { life: 90 });
          this.say(p, 'HÅLL IN HOPP I LUFTEN FÖR ATT FLYGA!', 200);
          break;
        case 'fuel':
          p.fuel = 100;
          FX.text(x, y - 6, 'BRÄNSLE!', '#7dff6b');
          break;
      }
    }
    endDisco() {
      if (this.state === 'play' && !this.player.dead) HK.Audio.playMusic(this.arenaLocked && this.boss && !this.boss.dying ? 'boss' : this.def.music || this.theme.music);
    }

    // ------------------------------------------------------------------
    bumpTile(tx, ty, src) {
      const lvl = this.level;
      let t = lvl.get(tx, ty);
      const i = ty * lvl.w + tx;
      if (t === T.HIDDEN) {
        lvl.set(tx, ty, T.QBLOCK);
        t = T.QBLOCK;
        HK.Audio.sfx('secret');
        this.stats.secrets++;
      }
      // fiender ovanpå rutan
      const top = { x: tx * TS, y: ty * TS - 6, w: TS, h: 8 };
      for (const e of this.enemies) {
        if (e.active && !e.dying && e.shootable && !e.boss && U.overlap(e, top)) e.die('shot');
      }
      for (const it of this.items) {
        if (it instanceof E.Coin && it.mode === 'static' && !it.dead && U.overlap(it, top)) {
          it.dead = true;
          this.items.push(new E.Coin(it.x, it.y, 'pop'));
        }
      }
      if (t === T.QBLOCK) {
        lvl.bump(tx, ty);
        HK.Audio.sfx('bump');
        this.popContent(tx, ty);
      } else if (t === T.BRICK || t === T.CRACKED) {
        this.breakTile(tx, ty);
      } else {
        lvl.bump(tx, ty);
        HK.Audio.sfx('bump');
      }
      void i;
    }

    popContent(tx, ty) {
      const lvl = this.level;
      const i = ty * lvl.w + tx;
      const c = lvl.content.get(i) || 'coin';
      if (c === 'coin' || c === 'multicoin') {
        this.items.push(new E.Coin(tx * TS + 3, ty * TS - 12, 'pop'));
        if (c === 'multicoin') {
          const left = (lvl.coinsLeft.get(i) || 1) - 1;
          lvl.coinsLeft.set(i, left);
          if (left <= 0) lvl.set(tx, ty, T.USED);
        } else lvl.set(tx, ty, T.USED);
      } else {
        this.items.push(new E.PowerUp(tx * TS, ty * TS, c, true));
        HK.Audio.sfx('appear');
        lvl.set(tx, ty, T.USED);
      }
    }

    breakTile(tx, ty) {
      const lvl = this.level;
      const t = lvl.get(tx, ty);
      const A = HK.Tiles.atlas(this.theme.id);
      lvl.set(tx, ty, T.EMPTY);
      FX.debris(tx * TS, ty * TS, t === T.BRICK ? A.brick : A.cracked[15], 4);
      FX.burst(tx * TS + 8, ty * TS + 8, 8, { colors: ['#ffffff', '#c7cbe0'] });
      HK.Audio.sfx('break');
      this.game.shake(1);
      this.stats.score += 10;
      if (t === T.CRACKED) {
        HK.Audio.sfx('secret');
      }
    }

    shotTile(tx, ty, shot) {
      const t = this.level.get(tx, ty);
      if (t === T.BRICK || t === T.CRACKED) this.breakTile(tx, ty);
      else if (t === T.QBLOCK) {
        this.level.bump(tx, ty);
        HK.Audio.sfx('bump');
        this.popContent(tx, ty);
      }
    }

    platformCollide(ent, preVy) {
      ent.platform = null;
      if (ent.dropT > 0 || preVy < 0) return;
      const list = this.platforms;
      const check = (pl) => {
        if (pl.state === 'gone') return false;
        if (ent.x + ent.w <= pl.x + 1 || ent.x >= pl.x + pl.w - 1) return false;
        const tol = Math.max(2, Math.abs(pl.dy || 0) + 1.5);
        if (ent.lastBottom <= pl.y + tol && ent.y + ent.h >= pl.y - 0.5) {
          ent.y = pl.y - ent.h;
          ent.vy = 0;
          ent.onGround = true;
          ent.platform = pl;
          if (pl.stoodOn) pl.stoodOn();
          return true;
        }
        return false;
      };
      for (const pl of list) if (check(pl)) return;
      for (const e of this.enemies) if (e.isPlatform && !e.dying && e.active && check(e)) return;
    }

    say(ent, text, dur) {
      this.bubbles = this.bubbles.filter((b) => b.ent !== ent);
      this.bubbles.push({ ent, text, t: 0, dur: dur || 120 });
    }

    // ------------------------------------------------------------------
    playerFellOut(p) {
      if (p.dead) return;
      if (this.hazardDamage(p)) this.respawnSafe(p);
    }
    playerInLiquid(p) {
      if (p.dead) return;
      const L = this.theme.liquid;
      FX.burst(p.cx, p.bottom - 4, 16, { colors: [L.top, L.a, '#ffffff'], up: 2.5 });
      HK.Audio.sfx('splash');
      if (this.hazardDamage(p)) this.respawnSafe(p);
      else { p.vy = -2; }
    }
    hazardDamage(p) {
      p.hp -= 1;
      p.shield = false;
      this.stats.hits++;
      HK.Audio.sfx('hurt');
      this.game.shake(2);
      if (p.hp <= 0) {
        p.die();
        return false;
      }
      return true;
    }
    respawnSafe(p) {
      FX.smoke(p.cx, Math.min(p.cy, this.level.ph - 8), 4);
      p.x = p.safe.x;
      p.y = p.safe.y;
      p.vx = 0;
      p.vy = 0;
      p.inv = 100;
      p.platform = null;
      p.setCrouch(false);
      FX.smoke(p.cx, p.cy, 6);
      FX.text(p.cx, p.y - 10, 'OJ!', '#ffffff', { life: 40 });
    }
    onPlayerDied() {
      if (this.onDeath) { this.onDeath(); return; }
      const p = this.player;
      const sx = U.clamp(p.cx - this.cam.x, 20, VW - 20), sy = U.clamp(p.cy - this.cam.y, 20, VH - 20);
      const spot = this.checkpoint || this.start;
      this.game.transition(() => {
        p.dead = false;
        p.deathT = 0;
        p.hp = p.maxHp;
        p.x = spot.x;
        p.y = spot.y;
        p.vx = p.vy = 0;
        p.inv = 90;
        p.safe = { x: spot.x, y: spot.y };
        p.shield = false;
        p.disco = 0;
        p.fuel = 100;
        p.platform = null;
        this.eshots.length = 0;
        this.camTY = p.bottom - VH * 0.62;
        this.cam.snap(p.cx - VW / 2, this.camTY);
        if (this.arenaLocked && this.boss && !this.boss.dying) this.cam.minX = this.cam.maxX = this.arena.x0;
        HK.Audio.playMusic(this.arenaLocked && this.boss && !this.boss.dying ? 'boss' : this.def.music || this.theme.music, true);
      }, { type: 'iris', x: sx, y: sy, x2: U.clamp(spot.x - this.cam.x, 20, VW - 20), y2: U.clamp(spot.y - this.cam.y, 20, VH - 20), dur: 26 });
    }

    onKevinFound(k) {
      if (this.state !== 'play') return;
      this.state = 'found';
      this.foundT = 0;
      this.cutscene = true;
      const p = this.player;
      p.win = true;
      p.binoc = false;
      p.disco = 0;
      // ställ Kevin bredvid spelaren så att båda syns
      const lvl = this.level;
      const side = k.cx >= p.cx ? 1 : -1;
      for (const dir of [side, -side]) {
        const nx = p.cx + dir * 20 - k.w / 2;
        const tx = Math.floor((nx + k.w / 2) / 16), ty = Math.floor((k.y + k.h - 4) / 16);
        if (!lvl.solid(tx, ty) && !lvl.solid(tx, ty - 1)) {
          k.x = nx;
          k.y = p.y + p.h - k.h;
          break;
        }
      }
      p.facing = k.cx > p.cx ? 1 : -1;
      k.facing = -p.facing;
      FX.smoke(k.cx, k.cy, 3);
      HK.Audio.jetpack(0);
      HK.Audio.stopMusic();
      HK.Audio.playMusic('vinst', true);
      this.say(k, this.def.kevinLine || U.pick(E.Kevin.LINES), 260);
      FX.confetti(k.cx, k.y, 80, { up: 3 });
      FX.ring(k.cx, k.cy, '#ffd23f', 40, 30);
      this.game.shake(2);
    }

    updateFound() {
      this.foundT++;
      const k = this.kevin;
      if (this.foundT % 25 === 0 && this.foundT < 200) FX.confetti(k.cx + U.rand(-80, 80), this.cam.y - 4, 20, { angle: Math.PI / 2, up: 0, min: 0.5, max: 2 });
      if (this.foundT === (this.def.endless ? 150 : 260) && this.onComplete) this.onComplete();
    }

    // ------------------------------------------------------------------
    updateBoss() {
      const b = this.boss;
      if (!b || !this.arena) return;
      const p = this.player;
      const A = this.arena;
      if (!this.arenaLocked && b.state === 'sleep' && p.x > A.x0 + 48) {
        this.arenaLocked = true;
        this.cam.minX = this.cam.maxX = A.x0;
        // stäng grinden bakom spelaren
        const gx = A.gateX;
        for (let ty = Math.floor(A.floor / TS) - 1; ty >= Math.floor(A.floor / TS) - 6; ty--) {
          if (!this.level.solid(gx, ty)) {
            this.level.set(gx, ty, T.BLOCK);
            FX.smoke(gx * TS + 8, ty * TS + 8, 2);
          }
        }
        HK.Audio.sfx('thud');
        this.game.shake(3);
        this.checkpoint = { x: A.x0 + 40, y: A.floor - 18 };
        b.setState('intro');
        b.active = true;
        HK.Audio.playMusic('boss', true);
        if (this.onBossStart) this.onBossStart();
      }
      if (b.dead && !this.bossDoneT) {
        this.bossDoneT = 1;
      }
      if (this.bossDoneT) {
        this.bossDoneT++;
        if (this.bossDoneT === 30) {
          this.kevin.caged = false;
          FX.burst(this.kevin.cx, this.kevin.cy, 30, { colors: ['#9ff3ff', '#ffffff'] });
          HK.Audio.sfx('break');
          this.say(this.kevin, 'TACK! DU RÄDDADE MIG! KOM HIT!', 200);
          HK.Audio.playMusic('titel', true);
        }
      }
    }
    onBossDown(b) {
      HK.Audio.stopMusic();
      this.eshots.length = 0;
      for (const e of this.enemies) if (!e.boss && !e.dying) e.die('shot');
      this.say(b, 'NEEEJ! MINA KRETSAR!', 120);
    }

    // ------------------------------------------------------------------
    updateCamera() {
      const p = this.player;
      const cam = this.cam;
      if (this.state === 'found') {
        const k = this.kevin;
        cam.follow((p.cx + k.cx) / 2 - VW / 2, (p.cy + k.cy) / 2 - VH * 0.55, 0.06, 0.06);
        return;
      }
      if (p.dead) return;
      // framåtblick
      const want = Math.abs(p.vx) > 1.2 ? p.facing * 40 : Math.abs(p.vx) > 0.3 ? p.facing * 20 : this.lookAhead;
      this.lookAhead = U.approach(this.lookAhead, want, 0.8);
      // vertikalt
      if (p.onGround || p.platform) this.camTY = p.bottom - VH * 0.62;
      else {
        const top = cam.y + VH * 0.22, bot = cam.y + VH * 0.72;
        if (p.y < top) this.camTY = Math.min(this.camTY, p.y - VH * 0.22);
        if (p.bottom > bot) this.camTY = Math.max(this.camTY, p.bottom - VH * 0.72);
      }
      let ty = this.camTY;
      if (p.lookT > 18) ty += I.held('up') ? -80 : 80;
      // kikare
      if (p.binoc) {
        this.binoK = Math.min(1, this.binoK + 0.08);
        const mx = I.touch.aim ? I.touch.aim.x : I.mouse.x;
        const my = I.touch.aim ? I.touch.aim.y : I.mouse.y;
        if (I.lastDevice === 'mouse' || I.touch.aim) {
          this.binoX = U.lerp(this.binoX, ((mx - VW / 2) / (VW / 2)) * 260, 0.1);
          this.binoY = U.lerp(this.binoY, ((my - VH / 2) / (VH / 2)) * 170, 0.1);
        }
        let kx = 0, ky = 0;
        if (I.held('left')) kx -= 1;
        if (I.held('right')) kx += 1;
        if (I.held('up')) ky -= 1;
        if (I.held('down')) ky += 1;
        if (I.pad.aimX || I.pad.aimY) { kx += I.pad.aimX; ky += I.pad.aimY; }
        this.binoX = U.clamp(this.binoX + kx * 5, -340, 340);
        this.binoY = U.clamp(this.binoY + ky * 5, -240, 240);
      } else {
        this.binoK = Math.max(0, this.binoK - 0.1);
        this.binoX = U.lerp(this.binoX, 0, 0.15);
        this.binoY = U.lerp(this.binoY, 0, 0.15);
      }
      const tx = p.cx - VW / 2 + this.lookAhead + this.binoX;
      ty += this.binoY;
      const kx = p.binoc ? 0.2 : 0.14;
      const ky = p.binoc ? 0.2 : p.vy > 4 ? 0.2 : p.thrusting ? 0.14 : 0.09;
      cam.follow(tx, ty, kx, ky);
    }

    updateRadar() {
      const k = this.kevin;
      const p = this.player;
      const d = Math.hypot(p.cx - k.cx, p.cy - k.cy);
      this.heat = U.clamp(1 - d / 1400, 0, 1);
      this.kevinDist = d;
      if (k.state === 'hide' && !k.seen && k.visibleOnScreen(this.cam)) {
        k.seen = true;
        if (p.binoc || d > 150) {
          HK.Audio.sfx('spot');
          FX.text(k.cx, k.y - 26, 'KEVIN SPANAD!', '#ffd23f', { life: 90 });
        }
      }
      if (p.binoc && this.t % Math.max(8, Math.round(60 - this.heat * 50)) === 0) HK.Audio.sfx('radar', { f: 700 + this.heat * 900 });
    }

    ambient() {
      const kind = this.theme.ambient;
      const c = this.cam;
      const r = Math.random();
      if (this.wind && r < 0.35) {
        const dir = Math.sign(this.wind);
        FX.add({
          type: 'px', streak: U.randInt(4, 10), x: c.x + (dir < 0 ? VW + 10 : -10), y: c.y + U.rand(0, VH),
          vx: dir * U.rand(4, 7), vy: U.rand(-0.2, 0.2), life: 140, size: 1, color: 'rgba(255,255,255,0.55)', drag: 1,
        }, true);
      }
      if ((kind === 'petals' || kind === 'sparkles') && r < 0.004) {
        // en liten flock fåglar
        const dir = Math.random() < 0.5 ? 1 : -1;
        const y0 = c.y + U.rand(20, VH * 0.45);
        const n = U.randInt(2, 4);
        for (let i = 0; i < n; i++) {
          FX.add({
            type: 'bird', x: c.x + (dir > 0 ? -10 - i * 9 : VW + 10 + i * 9), y: y0 + i * 5 * (i % 2 ? -1 : 1),
            vx: dir * U.rand(0.8, 1.1), vy: 0, life: 700, color: '#2a3a5c', phase: i * 3, drag: 1,
          }, true);
        }
      }
      switch (kind) {
        case 'petals':
          if (r < 0.06) FX.add({ type: 'px', x: c.x + U.rand(0, VW + 60), y: c.y - 4, vx: -U.rand(0.3, 0.8), vy: U.rand(0.3, 0.6), life: 400, size: 2, color: U.pick(['#ffc2cf', '#ffffff', '#ffe0f0', '#fff3a0']), drag: 1 });
          break;
        case 'rain':
          for (let i = 0; i < 2; i++) FX.add({ type: 'px', x: c.x + U.rand(0, VW + 80), y: c.y - 4, vx: -1.2, vy: 5, life: 60, size: 1, color: 'rgba(160,220,255,0.55)', drag: 1, rain: true });
          break;
        case 'motes':
          if (r < 0.12) FX.add({ type: 'px', x: c.x + U.rand(0, VW), y: c.y + U.rand(0, VH), vx: U.rand(-0.1, 0.1), vy: -U.rand(0.05, 0.25), life: 160, size: 1, color: U.pick(['#7af5ff', '#ff7ad9', '#a4ffe4']), drag: 1, fade: true });
          break;
        case 'sparkles':
          if (r < 0.08) FX.add({ type: 'spark', x: c.x + U.rand(0, VW), y: c.y + U.rand(0, VH), life: 30, color: U.pick(['#ffffff', '#fff3a0', '#ffd6f0']), drag: 1 });
          break;
        case 'embers':
          if (r < 0.2) FX.add({ type: 'px', x: c.x + U.rand(0, VW), y: c.y + VH + 2, vx: U.rand(-0.3, 0.3), vy: -U.rand(0.4, 1.2), life: 240, size: U.pick([1, 1, 2]), color: U.pick(['#ff9f1c', '#ffd23f', '#ff5a2a']), drag: 1, fade: true });
          break;
        case 'stars':
          if (r < 0.004) FX.add({ type: 'px', x: c.x + U.rand(VW * 0.3, VW), y: c.y + U.rand(0, VH * 0.5), vx: -4, vy: 1.5, life: 30, size: 1, color: '#ffffff', drag: 1, fade: true });
          break;
      }
    }

    // ------------------------------------------------------------------
    draw(ctx) {
      const cam = this.cam;
      const t = this.t;
      HK.Themes.drawBg(ctx, this.theme.id, cam.x, cam.y, cam.maxY, t);
      this.level.drawBack(ctx, cam, t);
      FX.draw(ctx, cam, true);
      this.level.drawMain(ctx, cam, t);
      for (const pl of this.platforms) if (cam.visible(pl.x, pl.y, pl.w, 16, 16)) pl.draw(ctx, cam, t, this.theme.id);
      for (const c of this.checkpoints) if (cam.visible(c.x, c.y, c.w, c.h, 16)) c.draw(ctx, cam);
      for (const s of this.springs) if (cam.visible(s.x, s.y, s.w, s.h, 16)) s.draw(ctx, cam);
      for (const s of this.signs) if (cam.visible(s.x, s.y, s.w, s.h, 16)) s.draw(ctx, cam);
      for (const d of this.decoys) if (cam.visible(d.x, d.y, d.w, d.h, 16)) d.draw(ctx, cam);
      this.kevin.draw(ctx, cam);
      for (const it of this.items) if (cam.visible(it.x, it.y, 16, 16, 16)) it.draw(ctx, cam, t);
      for (const e of this.enemies) if (e.active || e.isHazard) e.draw(ctx, cam);
      this.player.draw(ctx, cam);
      for (const s of this.shots) s.draw(ctx, cam);
      for (const s of this.eshots) s.draw(ctx, cam);
      this.level.drawFront(ctx, cam, t);
      FX.draw(ctx, cam, false);
      if (this.darkness > 0) this.drawLighting(ctx);
      for (const s of this.signs) s.drawBubble(ctx, cam);
      for (const b of this.bubbles) {
        const e = b.ent;
        const top = e === this.player ? e.y - 8 : e.boss ? e.y - 16 : e.y - 10;
        const a = b.t < 8 ? b.t / 8 : b.dur - b.t < 10 ? (b.dur - b.t) / 10 : 1;
        HK.Hud.bubble(ctx, b.text, Math.round(e.cx - cam.ix), Math.round(top - cam.iy), a, Math.min(b.text.length, Math.floor(b.t * 1.2)));
      }
    }

    drawLighting(ctx) {
      const lc = this.lightCanvas;
      const l = lc.getContext('2d');
      const cam = this.cam;
      const dark = this.darkness * (1 - this.binoK * 0.75);
      l.globalCompositeOperation = 'source-over';
      l.clearRect(0, 0, lc.width, lc.height);
      l.fillStyle = 'rgba(6,4,20,' + dark.toFixed(3) + ')';
      l.fillRect(0, 0, lc.width, lc.height);
      l.globalCompositeOperation = 'destination-out';
      const hole = (x, y, r, a) => {
        const sx = (x - cam.ix) / 2, sy = (y - cam.iy) / 2, sr = r / 2;
        if (sx < -sr || sy < -sr || sx > lc.width + sr || sy > lc.height + sr) return;
        const g = l.createRadialGradient(sx, sy, 0, sx, sy, sr);
        g.addColorStop(0, 'rgba(0,0,0,' + (a == null ? 1 : a) + ')');
        g.addColorStop(0.55, 'rgba(0,0,0,' + (a == null ? 0.75 : a * 0.75) + ')');
        g.addColorStop(1, 'rgba(0,0,0,0)');
        l.fillStyle = g;
        l.fillRect(sx - sr, sy - sr, sr * 2, sr * 2);
      };
      const p = this.player;
      const fl = Math.sin(this.t * 0.2) * 3 + Math.sin(this.t * 0.53) * 2;
      hole(p.cx, p.cy, 92 + fl);
      for (const s of this.shots) hole(s.x, s.y, s.kind === 'flame' ? 22 : 30, 0.8);
      for (const s of this.eshots) hole(s.x, s.y, 20, 0.7);
      for (const L of this.level.lights) {
        const f = L.flick ? Math.sin(this.t * 0.3 + L.x) * 3 : 0;
        hole(L.x, L.y, L.r + f, 0.9);
      }
      for (const e of this.enemies) {
        if (!e.active || e.dying) continue;
        if (e instanceof HK.Enemies.Lavabubbla && e.state !== 'wait') hole(e.cx, e.cy, 40);
        if (e instanceof HK.Enemies.Eldstav) for (const b of e.balls()) hole(b.x + 4, b.y + 4, 22, 0.8);
        if (e instanceof HK.Enemies.Krabba && e.shell) hole(e.cx, e.cy, 26, 0.6);
      }
      for (const it of this.items) if (it instanceof E.Gem || it instanceof E.PowerUp) hole(it.x + 7, it.y + 7, 26, 0.7);
      // lysande vätska
      if (this.theme.liquid.glow) {
        const lvl = this.level;
        const x0 = Math.max(0, Math.floor(cam.x / TS)), x1 = Math.min(lvl.w - 1, Math.floor((cam.x + VW) / TS));
        const y0 = Math.max(0, Math.floor(cam.y / TS)), y1 = Math.min(lvl.h - 1, Math.floor((cam.y + VH) / TS));
        for (let y = y0; y <= y1; y++)
          for (let x = x0; x <= x1; x += 2)
            if (lvl.grid[y * lvl.w + x] === T.LIQUID && lvl.get(x, y - 1) !== T.LIQUID) hole(x * TS + 8, y * TS + 4, 56, 0.7);
      }
      if (this.kevin.state !== 'hide') hole(this.kevin.cx, this.kevin.cy, 60);
      ctx.drawImage(lc, 0, 0, lc.width, lc.height, 0, 0, VW, VH);
      // färgat sken
      ctx.globalCompositeOperation = 'lighter';
      for (const L of this.level.lights) {
        const x = L.x - cam.ix, y = L.y - cam.iy;
        if (x < -40 || y < -40 || x > VW + 40 || y > VH + 40) continue;
        const g = ctx.createRadialGradient(x, y, 0, x, y, L.r * 0.7);
        g.addColorStop(0, U.hexToRgb(L.c).concat([0.22]).reduce((s, v, i) => s + (i ? ',' : '') + v, 'rgba(') + ')');
        g.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = g;
        ctx.fillRect(x - L.r, y - L.r, L.r * 2, L.r * 2);
      }
      ctx.globalCompositeOperation = 'source-over';
    }
  }

  HK.World = World;
})((window.HK = window.HK || {}));
