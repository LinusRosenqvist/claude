/* Hitta Kevin — spelaren: rörelse, hopp, jetpack, skjutning, kikare. */
(function (HK) {
  'use strict';
  const U = HK.U;
  const T = HK.T;
  const S = HK.Sprites;
  const I = HK.Input;
  const FX = HK.FX;

  const PH = {
    walk: 2.1, sprint: 2.85, crouch: 0.85,
    accG: 0.16, accA: 0.11, decG: 0.21, decA: 0.035, skid: 0.34, iceAcc: 0.045, iceDec: 0.015,
    jump: 6.3, jumpRun: 0.22, gUp: 0.32, gApex: 0.19, gDown: 0.58, maxFall: 5.8,
    coyote: 6, buffer: 8,
    stomp: 5.4, stompHeld: 7.8,
    spring: 10.8, springHeld: 12.8,
    jetThrust: 0.64, jetMaxUp: 3.5, jetDrain: 0.5, jetRegen: 1.3,
  };
  HK.PH = PH;

  function Player(world, x, y) {
    this.world = world;
    this.w = 10;
    this.h = 18;
    this.x = x;
    this.y = y;
    this.vx = 0;
    this.vy = 0;
    this.facing = 1;
    this.onGround = false;
    this.wasGround = false;
    this.coyote = 0;
    this.jumpBuf = 0;
    this.jumping = false;
    this.crouch = false;
    this.dropT = 0;
    this.maxHp = 3;
    this.hp = 3;
    this.inv = 0;
    this.dead = false;
    this.deathT = 0;
    this.shootCd = 0;
    this.lastShot = -999;
    this.animT = 0;
    this.blinkT = 120;
    this.sx = 1;
    this.sy = 1;
    this.jetpack = false;
    this.fuel = 100;
    this.thrusting = false;
    this.thrustArmed = false;
    this.shield = false;
    this.triple = 0;
    this.magnet = 0;
    this.disco = 0;
    this.lookT = 0;
    this.binoc = false;
    this.aim = 0;
    this.safe = { x, y };
    this.safeT = 0;
    this.platform = null;
    this.stillT = 0;
    this.skidding = false;
    this.fallStart = y;
    this.frozen = false;
    this.win = false;
    this.flameT = 0;
  }

  Player.prototype = {
    get cx() { return this.x + this.w / 2; },
    get cy() { return this.y + this.h / 2; },
    get bottom() { return this.y + this.h; },

    gmul() {
      return this.world.gravity;
    },

    setCrouch(on) {
      if (on === this.crouch) return;
      if (on) {
        this.y += 6;
        this.h = 12;
        this.crouch = true;
      } else {
        // kan vi resa oss?
        const lvl = this.world.level;
        const test = { x: this.x, y: this.y - 6, w: this.w, h: 18 };
        const x0 = Math.floor(test.x / 16), x1 = Math.floor((test.x + test.w - 0.01) / 16);
        const ty = Math.floor(test.y / 16);
        for (let tx = x0; tx <= x1; tx++) if (lvl.solid(tx, ty)) return;
        this.y -= 6;
        this.h = 18;
        this.crouch = false;
      }
    },

    update() {
      const W = this.world;
      const lvl = W.level;
      this.animT++;
      if (this.dead) {
        this.deathT++;
        if (this.deathT > 24) {
          this.vy += 0.3;
          this.y += this.vy;
        }
        if (this.deathT === 90) W.onPlayerDied();
        return;
      }
      if (this.win) {
        this.vx = U.approach(this.vx, 0, 0.2);
        this.vy = Math.min(this.vy + PH.gDown * this.gmul(), PH.maxFall);
        HK.Physics.move(this, lvl, {});
        return;
      }
      if (this.inv > 0) this.inv--;
      if (this.triple > 0) this.triple--;
      if (this.magnet > 0) this.magnet--;
      if (this.disco > 0) {
        this.disco--;
        if (this.disco === 0) W.endDisco();
        if (this.animT % 2 === 0) FX.add({ type: 'px', x: this.cx + U.rand(-4, 4), y: this.cy + U.rand(-8, 8), vx: -this.vx * 0.3, vy: U.rand(-0.3, 0.3), life: 18, size: 2, color: U.pick(FX.RAINBOW), fade: true }, true);
      }
      if (this.dropT > 0) this.dropT--;
      if (this.shootCd > 0) this.shootCd--;

      const frozen = this.frozen || W.cutscene;
      let ax = frozen ? 0 : I.axisX();

      // --- kikare ---
      const wantLook = !frozen && I.held('look');
      if (wantLook && this.onGround && Math.abs(this.vx) < 1.2) {
        if (!this.binoc) HK.Audio.sfx('kikare');
        this.binoc = true;
      } else if (!wantLook || !this.onGround) this.binoc = false;
      if (this.binoc) ax = 0;

      // --- hukning ---
      const downHeld = !frozen && !this.binoc && I.held('down');
      if (this.onGround && downHeld) this.setCrouch(true);
      else if (this.crouch) this.setCrouch(false);

      // --- vågrät rörelse ---
      const ice = this.onGround && this.groundTile === T.ICE;
      let maxSp = I.held('sprint') ? PH.sprint : PH.walk;
      if (this.crouch) maxSp = PH.crouch;
      if (this.disco > 0) maxSp += 0.5;
      this.skidding = false;
      if (ax !== 0) {
        if (this.onGround && Math.sign(this.vx) === -Math.sign(ax) && Math.abs(this.vx) > 1.0) {
          this.vx = U.approach(this.vx, 0, ice ? PH.iceDec * 3 : PH.skid);
          this.skidding = true;
          if (this.animT % 3 === 0) FX.dust(this.cx, this.bottom, -Math.sign(ax));
          if (this.animT % 10 === 0) HK.Audio.sfx('skid');
        } else {
          const acc = this.onGround ? (ice ? PH.iceAcc : PH.accG) : this.thrusting ? 0.14 : PH.accA;
          if (Math.abs(this.vx) > maxSp && Math.sign(this.vx) === Math.sign(ax)) this.vx = U.approach(this.vx, ax * maxSp, 0.05);
          else this.vx = U.approach(this.vx, ax * maxSp, acc);
        }
      } else {
        const dec = this.onGround ? (ice ? PH.iceDec : PH.decG) : PH.decA;
        this.vx = U.approach(this.vx, 0, dec);
      }
      if (W.wind && !this.onGround) this.vx += W.wind * 0.03;

      // --- hopp ---
      if (!frozen && !this.binoc && I.hit('jump')) {
        this.jumpBuf = PH.buffer;
        if (!this.onGround && this.coyote <= 0) this.thrustArmed = true;
      }
      if (this.onGround) this.coyote = PH.coyote;
      else if (this.coyote > 0) this.coyote--;
      if (this.jumpBuf > 0) this.jumpBuf--;
      const onOneway = this.onGround && this.groundTile === T.ONEWAY;
      if (this.jumpBuf > 0 && this.coyote > 0) {
        if (downHeld && (onOneway || (this.platform && !this.platform.solidTop))) {
          this.dropT = 14;
          this.platform = null;
          this.setCrouch(false);
          this.y += 2;
          this.onGround = false;
          this.jumpBuf = 0;
          this.coyote = 0;
        } else {
          if (this.crouch) this.setCrouch(false);
          if (!this.crouch) this.doJump(PH.jump + Math.abs(this.vx) * PH.jumpRun);
        }
      }
      // --- jetpack ---
      const jumpHeld = !frozen && I.held('jump');
      this.thrusting = false;
      if (this.jetpack && !this.onGround && jumpHeld && this.fuel > 0 && (this.thrustArmed || this.vy > -1.2)) {
        this.thrusting = true;
        this.thrustArmed = true;
        this.jumping = false;
        this.vy = Math.max(-PH.jetMaxUp * Math.sqrt(this.gmul() || 1), this.vy - PH.jetThrust * this.gmul() - 0.02);
        this.fuel = Math.max(0, this.fuel - PH.jetDrain);
        this.flameT++;
        if (this.flameT % 3 === 0) W.jetFlame(this);
        HK.Audio.jetpack(1);
      } else {
        HK.Audio.jetpack(0);
      }
      if (this.onGround) {
        this.fuel = Math.min(100, this.fuel + PH.jetRegen);
        this.thrustArmed = false;
      }

      // --- gravitation ---
      const gm = this.gmul();
      let g;
      if (this.thrusting) g = PH.gUp;
      else if (this.vy < 0 && this.jumping && jumpHeld) g = Math.abs(this.vy) < 1.1 ? PH.gApex : PH.gUp;
      else g = PH.gDown;
      if (this.vy < 0 && this.jumping && !jumpHeld && this.vy < -3.2 * Math.sqrt(gm)) this.vy = -3.2 * Math.sqrt(gm);
      this.vy += g * gm;
      const maxFall = PH.maxFall * (gm < 1 ? 0.65 : 1);
      if (this.vy > maxFall) this.vy = maxFall;

      // --- flytta ---
      this.wasGround = this.onGround;
      const preVy = this.vy;
      const self = this;
      HK.Physics.move(this, lvl, {
        dropThrough: this.dropT > 0,
        hidden: true,
        cornerCorrect: true,
        onHead(tx, ty) { W.bumpTile(tx, ty, self); },
      });
      if (this.hitCeil) this.jumping = false;
      // rullband
      if (this.onGround && (this.groundTile === T.CONV_L || this.groundTile === T.CONV_R)) {
        const saveVx = this.vx, saveVy = this.vy;
        this.vx = this.groundTile === T.CONV_L ? -0.9 : 0.9;
        this.vy = 0;
        HK.Physics.move(this, lvl, { dropThrough: true });
        this.vx = saveVx;
        this.vy = saveVy;
        this.onGround = true;
      }
      // plattformar
      W.platformCollide(this, preVy);

      if (!this.wasGround && this.onGround) this.onLand(preVy);
      if (this.onGround) {
        this.jumping = false;
        this.fallStart = this.y;
      }

      // --- faror ---
      this.checkHazards();

      // --- säker plats ---
      if (this.onGround && !this.platform && !this.crouch) {
        this.safeT++;
        if (this.safeT > 8 && this.isSafeSpot()) {
          this.safe.x = this.x;
          this.safe.y = this.y;
          this.safeT = 0;
        }
      }

      // --- sikte & skott ---
      this.updateAim(ax);
      if (!frozen && !this.binoc && this.shootCd <= 0 && (I.hit('shoot') || (I.held('shoot') && this.animT - this.lastShot > 13))) {
        this.shoot();
      }

      // --- titta upp/ner ---
      const still = this.onGround && Math.abs(this.vx) < 0.2;
      if (still && !frozen && (I.held('up') || (downHeld && this.crouch))) this.lookT++;
      else this.lookT = 0;
      this.stillT = still ? this.stillT + 1 : 0;

      // squash tillbaka
      this.sx = U.lerp(this.sx, 1, 0.18);
      this.sy = U.lerp(this.sy, 1, 0.18);

      // springdamm
      if (this.onGround && Math.abs(this.vx) > 1.6 && this.animT % 8 === 0) FX.dust(this.cx - this.facing * 3, this.bottom, this.facing);

      // magnet
      if (this.magnet > 0) W.magnetPull(this);

      if (this.blinkT-- <= 0) this.blinkT = U.randInt(120, 300);
    },

    doJump(v) {
      this.vy = -v * Math.sqrt(this.gmul());
      this.jumping = true;
      this.coyote = 0;
      this.jumpBuf = 0;
      this.onGround = false;
      this.platform = null;
      this.sx = 0.72;
      this.sy = 1.32;
      HK.Audio.sfx('jump');
      FX.landPuff(this.cx, this.bottom, 1);
    },

    bounce(held) {
      this.vy = -(held ? PH.stompHeld : PH.stomp) * Math.sqrt(this.gmul());
      this.jumping = held;
      this.coyote = 0;
      this.thrustArmed = false;
      this.sx = 0.8;
      this.sy = 1.25;
    },

    onLand(vy) {
      const s = U.clamp(vy / PH.maxFall, 0, 1);
      this.sx = 1 + 0.35 * s;
      this.sy = 1 - 0.3 * s;
      if (vy > 2.5) {
        FX.landPuff(this.cx, this.bottom, vy);
        HK.Audio.sfx('land');
      }
      if (vy > 5.2 && this.gmul() >= 1) this.world.game.shake(1.2);
    },

    isSafeSpot() {
      const lvl = this.world.level;
      const tx0 = Math.floor((this.x - 10) / 16), tx1 = Math.floor((this.x + this.w + 10) / 16);
      const ty = Math.floor((this.bottom + 1) / 16);
      for (let tx = tx0; tx <= tx1; tx++) {
        const t = lvl.get(tx, ty);
        if (t === T.EMPTY || t === T.SPIKES || t === T.LIQUID) return false;
        const a = lvl.get(tx, ty - 1);
        if (a === T.SPIKES || a === T.LIQUID) return false;
      }
      return true;
    },

    checkHazards() {
      const W = this.world;
      const lvl = W.level;
      if (this.y > lvl.ph + 24) {
        W.playerFellOut(this);
        return;
      }
      const x0 = Math.floor((this.x + 1) / 16), x1 = Math.floor((this.x + this.w - 1) / 16);
      const y0 = Math.floor((this.y + 2) / 16), y1 = Math.floor((this.y + this.h - 1) / 16);
      for (let ty = y0; ty <= y1; ty++)
        for (let tx = x0; tx <= x1; tx++) {
          const t = lvl.get(tx, ty);
          if (t === T.LIQUID) {
            // bara om vi faktiskt är under ytan
            const surf = lvl.get(tx, ty - 1) !== T.LIQUID ? ty * 16 + 4 : ty * 16;
            if (this.bottom > surf + 2) {
              W.playerInLiquid(this);
              return;
            }
          } else if (t === T.SPIKES) {
            // taggarnas träffyta: nedre/övre halvan beroende på riktning
            const sx = tx * 16, sy = ty * 16;
            const box = lvl.solid(tx, ty + 1) ? { x: sx + 2, y: sy + 6, w: 12, h: 10 }
              : lvl.solid(tx, ty - 1) ? { x: sx + 2, y: sy, w: 12, h: 10 }
              : { x: sx + 2, y: sy + 2, w: 12, h: 12 };
            if (U.overlap(this, box)) {
              this.hurt(1, sx + 8, true);
              if (this.vy >= 0 && lvl.solid(tx, ty + 1)) this.vy = -5;
            }
          }
        }
    },

    updateAim(ax) {
      const W = this.world;
      const src = I.shootSource;
      const px = this.cx, py = this.y + (this.crouch ? 4 : 8);
      let ang = null;
      if (src === 'mouse' && I.mouse.active) {
        ang = Math.atan2(W.cam.y + I.mouse.y - py, W.cam.x + I.mouse.x - px);
      } else if (src === 'tap' && I.touch.aim) {
        ang = Math.atan2(W.cam.y + I.touch.aim.y - py, W.cam.x + I.touch.aim.x - px);
      } else if (src === 'stick' && Math.hypot(I.pad.aimX, I.pad.aimY) > 0.4) {
        ang = Math.atan2(I.pad.aimY, I.pad.aimX);
      }
      this.aimFree = ang != null;
      if (ang == null) {
        // tangentbord/knapp: sikta framåt, uppåt med W, autosikte mot närmaste fiende
        const target = I.held('shoot') || I.hit('shoot') ? W.autoAim(this) : null;
        if (target) ang = Math.atan2(target.y - py, target.x - px);
        else if (I.held('up')) ang = this.facing > 0 ? -Math.PI / 2 + 0.25 : -Math.PI / 2 - 0.25;
        else if (!this.onGround && I.held('down')) ang = this.facing > 0 ? Math.PI / 2 - 0.25 : Math.PI / 2 + 0.25;
        else ang = this.facing > 0 ? 0 : Math.PI;
      }
      this.aim = ang;
      const aimRight = Math.cos(ang) >= 0;
      const recentShot = this.animT - this.lastShot < 24;
      if (ax !== 0 && !recentShot) this.facing = ax > 0 ? 1 : -1;
      else if (this.aimFree && (Math.abs(this.vx) < 0.3 || recentShot)) this.facing = aimRight ? 1 : -1;
      else if (recentShot) this.facing = aimRight ? 1 : -1;
    },

    armPivot() {
      const bottom = this.bottom;
      const top = bottom - 22;
      return { x: this.cx + this.facing * 1, y: top + (this.crouch ? 17 : 13) };
    },

    shoot() {
      const W = this.world;
      const p = this.armPivot();
      const ang = this.aim;
      const angles = this.triple > 0 ? [ang - 0.2, ang, ang + 0.2] : [ang];
      for (const a of angles) W.addPlayerShot(p.x + Math.cos(a) * 9, p.y + Math.sin(a) * 9, Math.cos(a) * 6.4, Math.sin(a) * 6.4);
      this.shootCd = 8;
      this.lastShot = this.animT;
      this.recoil = 3;
      HK.Audio.sfx('shoot');
      FX.burst(p.x + Math.cos(ang) * 10, p.y + Math.sin(ang) * 10, 3, { colors: ['#ffffff', '#6ff6ff'], g: 0, min: 0.3, max: 1.2, lifeMin: 5, lifeMax: 10, size: 1 });
    },

    hurt(dmg, srcX, fromHazard) {
      if (this.dead || this.win) return false;
      if (this.inv > 0 || this.disco > 0) return false;
      const W = this.world;
      if (this.shield) {
        this.shield = false;
        this.inv = 70;
        HK.Audio.sfx('shieldbreak');
        FX.ring(this.cx, this.cy, '#6ff6ff', 22, 20);
        FX.burst(this.cx, this.cy, 14, { colors: ['#6ff6ff', '#ffffff', '#4dc3ff'], g: 0.05 });
        return true;
      }
      this.hp -= dmg;
      W.stats.hits++;
      this.inv = 100;
      const dir = srcX != null ? Math.sign(this.cx - srcX) || -this.facing : -this.facing;
      this.vx = dir * 2.4;
      if (!fromHazard) this.vy = -3.6 * Math.sqrt(this.gmul());
      this.jumping = false;
      HK.Audio.sfx('hurt');
      W.game.shake(3);
      W.game.hitstop = 5;
      FX.burst(this.cx, this.cy, 10, { colors: ['#ff4d6d', '#ffffff', '#ffd23f'] });
      if (this.hp <= 0) this.die();
      return true;
    },

    die() {
      if (this.dead) return;
      this.hp = 0;
      this.dead = true;
      this.deathT = 0;
      this.vx = 0;
      this.vy = -6;
      this.binoc = false;
      this.world.stats.deaths++;
      HK.Audio.jetpack(0);
      HK.Audio.stopMusic();
      HK.Audio.sfx('death');
      this.world.game.shake(4);
    },

    draw(ctx, cam) {
      if (this.inv > 0 && !this.dead && Math.floor(this.inv / 3) % 2 === 0 && this.inv < 96) return;
      const bx = Math.round(this.cx - cam.ix);
      const by = Math.round(this.bottom - cam.iy);
      let frame = 'hero_idle0', fi = 0;
      if (this.dead) frame = 'hero_hurt';
      else if (this.win) frame = 'hero_win';
      else if (this.crouch) frame = 'hero_crouch';
      else if (!this.onGround) frame = this.vy < 0 || this.thrusting ? 'hero_jump' : 'hero_fall';
      else if (this.skidding) frame = 'hero_skid';
      else if (Math.abs(this.vx) > 0.25) {
        frame = 'hero_run';
        fi = Math.floor(this.animT * (0.12 + Math.abs(this.vx) * 0.06)) % 6;
      } else if (this.lookT > 0 || this.binoc) frame = 'hero_lookup';
      else if (this.blinkT < 8) frame = 'hero_blink';
      else frame = Math.floor(this.animT / 40) % 2 ? 'hero_idle1' : 'hero_idle0';
      if (this.inv > 90 && !this.dead) frame = 'hero_hurt';
      const flip = this.facing < 0;
      const opts = { flip, sx: this.sx, sy: this.sy };
      if (this.dead) {
        opts.rot = this.deathT > 24 ? (this.deathT - 24) * 0.15 * this.facing : 0;
        opts.ay = 0.6;
      }
      // jetpack bakom kroppen
      if (this.jetpack && !this.dead) {
        const jx = bx - this.facing * 7;
        const jy = by - 5;
        S.draw(ctx, 'hero_jetpack', 0, jx, jy, { flip });
        if (this.thrusting) {
          const f = this.animT % 4;
          ctx.fillStyle = '#ff9f1c';
          ctx.fillRect(jx - 2, jy, 4, 3 + f);
          ctx.fillStyle = '#fff27a';
          ctx.fillRect(jx - 1, jy, 2, 2 + (f >> 1));
        }
      }
      let flash = null;
      if (this.disco > 0) flash = U.rainbow(this.animT * 12, 100, 65);
      S.draw(ctx, frame, fi, bx, by + (this.dead ? -8 : 0), opts);
      if (flash && this.animT % 4 < 2) S.draw(ctx, frame, fi, bx, by, Object.assign({}, opts, { flash, alpha: 0.55 }));
      // arm + blaster
      if (!this.dead && !this.win) {
        if (this.binoc) {
          S.draw(ctx, 'kikare', 0, bx + this.facing * 5, by - 12, { flip });
        } else {
          const p = this.armPivot();
          let a = this.aim;
          const n = 32;
          const idx = ((Math.round((a / (Math.PI * 2)) * n) % n) + n) % n;
          const img = S.frame('hero_arm', idx);
          let rx = 0, ry = 0;
          if (this.recoil > 0) {
            rx = -Math.cos(a) * this.recoil;
            ry = -Math.sin(a) * this.recoil;
            this.recoil -= 0.6;
          }
          ctx.drawImage(img, Math.round(p.x - cam.ix - 12 + rx), Math.round(p.y - cam.iy - 12 + ry + (this.sy < 0.9 ? 2 : 0)));
        }
      }
      // sköld
      if (this.shield && !this.dead) {
        const r = 14 + Math.sin(this.animT * 0.15);
        ctx.globalAlpha = 0.55 + Math.sin(this.animT * 0.2) * 0.15;
        ctx.fillStyle = '#6ff6ff';
        const n = 40;
        for (let i = 0; i < n; i++) {
          const ang = (i / n) * Math.PI * 2;
          ctx.fillRect(Math.round(bx + Math.cos(ang) * r), Math.round(by - 10 + Math.sin(ang) * r), 1, 1);
        }
        ctx.globalAlpha = 1;
      }
    },
  };

  HK.Player = Player;
})((window.HK = window.HK || {}));
