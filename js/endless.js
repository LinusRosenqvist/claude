/* Hitta Kevin — OÄNDLIGT LÄGE: slumpade banor byggda av säkra bitar. */
(function (HK) {
  'use strict';
  const U = HK.U;

  const TILE_CHARS = '#BX?$!JU=^~I<>%:,;CLF.';

  // Minimal nivåbyggare (samma idé som tools/levelgen/lib.js)
  function Grid(w, h) {
    this.w = w;
    this.h = h;
    this.g = [];
    for (let y = 0; y < h; y++) this.g.push(new Array(w).fill('.'));
    this.overlay = [];
    this.pups = [];
    this.plats = [];
    this.signs = [];
  }
  Grid.prototype = {
    in(x, y) { return x >= 0 && y >= 0 && x < this.w && y < this.h; },
    set(x, y, ch) {
      if (!this.in(x, y)) return this;
      const cur = this.g[y][x];
      if ((cur === ':' || cur === ',') && TILE_CHARS.indexOf(ch) < 0) {
        this.overlay.push([x, y, ch]);
        return this;
      }
      this.g[y][x] = ch;
      return this;
    },
    get(x, y) { return this.in(x, y) ? this.g[y][x] : '#'; },
    fill(x0, y0, x1, y1, ch) {
      for (let y = Math.min(y0, y1); y <= Math.max(y0, y1); y++)
        for (let x = Math.min(x0, x1); x <= Math.max(x0, x1); x++) this.set(x, y, ch);
      return this;
    },
    ground(x0, x1, top) { return this.fill(x0, top, x1, this.h - 1, '#'); },
    pit(x0, x1) {
      for (let x = x0; x <= x1; x++) for (let y = 0; y < this.h; y++) if ('#%:,'.indexOf(this.g[y][x]) >= 0) this.g[y][x] = '.';
      return this;
    },
    str(x, y, s) { for (let i = 0; i < s.length; i++) if (s[i] !== ' ') this.set(x + i, y, s[i]); return this; },
    coins(x, y, n, step) { for (let i = 0; i < n; i++) this.set(x + i * (step || 1), y, 'o'); return this; },
    plat(x, y, w) { return this.fill(x, y, x + w - 1, y, '='); },
    pup(x, y, kind) { this.set(x, y, '!'); this.pups.push({ x, y, kind }); return this; },
    mover(x, y, w, kind, range, speed, phase) {
      this.fill(x, y, x + w - 1, y, kind === 'v' ? '|' : '-');
      this.plats.push({ x, y, range, speed, phase });
      return this;
    },
    def(meta) {
      const rm = (a, b) => a.y - b.y || a.x - b.x;
      const d = Object.assign({}, meta);
      d.powerups = this.pups.sort(rm).map((p) => p.kind);
      d.platforms = this.plats.sort(rm).map((p) => ({ range: p.range, speed: p.speed, phase: p.phase }));
      d.signs = this.signs.sort(rm).map((s) => s.text);
      d.overlay = this.overlay.sort((a, b) => a[1] - b[1] || a[0] - b[0]);
      d.rows = this.g.map((r) => r.join(''));
      return d;
    },
  };

  const THEMES = ['kullar', 'stad', 'grotta', 'moln', 'lava', 'rymd'];
  const FOES = {
    kullar: ['e', 'e', 'z', 'g'],
    stad: ['e', 'p', 'z', 'p'],
    grotta: ['r', 'e', 'z', 'r'],
    moln: ['e', 'g', 'z', 'E'],
    lava: ['E', 'z', 'e', 'E'],
    rymd: ['a', 'a', 'p', 'z'],
  };
  const FLYERS = { kullar: 'b', stad: 'd', grotta: 'b', moln: 'b', lava: 'b', rymd: 'u' };

  // Varje bit: (G, x, S, r, lvl) => bredd. Marken är på rad S vid in- och utgång.
  const SEG = {
    flat(G, x, S, r, L) {
      const w = 6 + Math.floor(r() * 6);
      if (r() < 0.6) G.coins(x + 1, S - 1, Math.min(w - 2, 3 + Math.floor(r() * 3)));
      else G.coins(x + 1, S - 4, 3);
      if (r() < 0.35 + L.diff * 0.05) G.set(x + w - 2, S - 1, L.foe(r));
      return w;
    },
    blocks(G, x, S, r, L) {
      const w = 9;
      const pats = ['?B!B?', 'B?B?B', '?$?', 'B!B'];
      const pat = pats[Math.floor(r() * pats.length)];
      const bx = x + 2;
      for (let i = 0; i < pat.length; i++) {
        if (pat[i] === '!') G.pup(bx + i, S - 4, L.powerup(r));
        else G.set(bx + i, S - 4, pat[i]);
      }
      if (r() < 0.6) G.set(x + w - 1, S - 1, L.foe(r));
      return w;
    },
    pit(G, x, S, r) {
      const gap = 2 + Math.floor(r() * 3);
      G.pit(x + 2, x + 1 + gap);
      if (r() < 0.5) G.fill(x + 2, G.h - 2, x + 1 + gap, G.h - 1, '~');
      for (let i = 0; i < gap + 2; i++) {
        const k = (i / (gap + 1)) * 2 - 1;
        G.set(x + 1 + i, S - 2 - Math.round((1 - k * k) * 2), 'o');
      }
      return gap + 4;
    },
    hill(G, x, S, r, L) {
      const w = 7 + Math.floor(r() * 5);
      const hgt = 2 + Math.floor(r() * 2);
      G.ground(x + 1, x + w - 2, S - hgt);
      G.coins(x + 2, S - hgt - 1, w - 4);
      if (r() < 0.5 + L.diff * 0.04) G.set(x + w - 3, S - hgt - 1, L.foe(r));
      return w;
    },
    stairs(G, x, S, r) {
      const n = 3 + Math.floor(r() * 2);
      for (let i = 0; i < n; i++) G.fill(x + 1 + i, S - 1 - i, x + 1 + i, S - 1, 'X');
      const top = x + n;
      const gap = r() < 0.5 ? 0 : 2;
      if (gap) G.pit(top + 1, top + gap);
      for (let i = 0; i < n; i++) G.fill(top + 1 + gap + i, S - n + i, top + 1 + gap + i, S - 1, 'X');
      G.coins(top - 1, S - n - 3, 3 + gap);
      return n * 2 + gap + 3;
    },
    bridge(G, x, S, r, L) {
      const w = 10 + Math.floor(r() * 5);
      G.pit(x + 1, x + w - 2);
      G.fill(x + 1, G.h - 2, x + w - 2, G.h - 1, '~');
      let px = x + 2;
      let up = true;
      while (px + 3 < x + w - 2) {
        const y = up ? S - 2 : S - 4;
        G.plat(px, y, 3);
        G.coins(px, y - 1, 3);
        px += 5;
        up = !up;
      }
      if (r() < 0.4 + L.diff * 0.04) G.set(x + Math.floor(w / 2), S - 9, L.flyer());
      return w;
    },
    movers(G, x, S, r) {
      const w = 12;
      G.pit(x + 1, x + w - 2);
      G.fill(x + 1, G.h - 2, x + w - 2, G.h - 1, '~');
      G.mover(x + 3, S - 2, 3, 'h', 2, 0.02 + r() * 0.01, r() * 6);
      G.plat(x + 8, S - 3, 2);
      G.coins(x + 3, S - 5, 3);
      return w;
    },
    spikes(G, x, S, r, L) {
      const n = 2 + Math.floor(r() * 2);
      G.str(x + 3, S - 1, '^'.repeat(n));
      G.coins(x + 3, S - 4, n);
      if (r() < 0.5) G.set(x + n + 5, S - 1, L.foe(r));
      return n + 7;
    },
    tower(G, x, S, r) {
      const h = 3;
      G.fill(x + 2, S - h, x + 3, S - 1, 'X');
      G.coins(x + 2, S - h - 1, 2);
      if (r() < 0.5) G.set(x + 2, S - h - 5, '?');
      return 6;
    },
    spring(G, x, S, r) {
      const w = 10;
      G.set(x + 2, S - 1, 's');
      G.plat(x + 3, S - 9, 6);
      G.coins(x + 3, S - 10, 6);
      if (r() < 0.5) G.set(x + 6, S - 10, '*');
      return w;
    },
    gauntlet(G, x, S, r, L) {
      const w = 12;
      G.set(x + 3, S - 1, L.foe(r));
      G.set(x + 8, S - 1, L.foe(r));
      G.set(x + 6, S - 8, L.flyer());
      G.coins(x + 4, S - 4, 4);
      return w;
    },
    lavapit(G, x, S, r) {
      const w = 9;
      G.pit(x + 1, x + w - 2);
      G.fill(x + 1, S + 2, x + w - 2, G.h - 1, '~');
      G.ground(x + 4, x + 4, S - 1);
      G.set(x + 2, S + 3, 'L');
      G.set(x + 6, S + 3, 'L');
      return w;
    },
    firebar(G, x, S) {
      G.set(x + 4, S - 4, 'F');
      G.coins(x + 1, S - 1, 3);
      G.coins(x + 6, S - 1, 3);
      return 10;
    },
    cannon(G, x, S, r) {
      G.set(x + 3, S - 1, 'C');
      G.set(x + 3, S - 2, 'C');
      G.coins(x + 2, S - 4, 3);
      return 8;
    },
    decoy(G, x, S, r) {
      const onPlat = r() < 0.5;
      if (onPlat) {
        G.plat(x + 2, S - 3, 4);
        G.set(x + 3, S - 4, 'k');
      } else G.set(x + 3, S - 1, 'k');
      G.coins(x + 1, S - 1, 2);
      return 7;
    },
    secretgem(G, x, S, r) {
      // spricka i golvet med diamant under
      const w = 9;
      G.fill(x + 3, S, x + 4, S, '%');
      G.fill(x + 1, S + 1, x + 7, S + 3, ':');
      G.set(x + 7, S + 3, '*');
      G.set(x + 5, S + 3, 'X');
      G.coins(x + 1, S + 3, 2);
      return w;
    },
  };

  // Kevins gömställen i slutet
  const HIDE = {
    room(G, x, S) {
      const w = 16;
      G.ground(x + 2, x + w - 1, S - 6);
      G.fill(x + 2, S - 3, x + w - 3, S - 1, ':');
      G.set(x + w - 5, S - 1, 'K');
      G.coins(x + 4, S - 1, 4);
      return w;
    },
    cracked(G, x, S) {
      const w = 14;
      G.ground(x + 2, x + w - 1, S - 5);
      G.fill(x + 2, S - 2, x + 2, S - 1, '%');
      G.fill(x + 3, S - 3, x + w - 3, S - 1, ':');
      G.set(x + w - 4, S - 1, 'K');
      G.coins(x + 4, S - 1, 3);
      return w;
    },
    ledge(G, x, S) {
      const w = 14;
      G.plat(x + 1, S - 3, 3);
      G.plat(x + 5, S - 6, 3);
      G.plat(x + 9, S - 9, 4);
      G.set(x + 11, S - 10, 'K');
      G.set(x + 6, S - 1, 'k');
      G.coins(x + 5, S - 7, 3);
      return w;
    },
    under(G, x, S) {
      const w = 14;
      G.fill(x + 3, S, x + 4, S, '%');
      G.fill(x + 2, S + 1, x + 12, S + 3, ':');
      G.set(x + 5, S + 3, 'X');
      G.set(x + 10, S + 3, 'K');
      G.coins(x + 7, S + 3, 2);
      G.set(x + 9, S - 1, 'k');
      return w;
    },
  };

  const Endless = {
    /** Skapa en bana för runda n (1, 2, 3 ...) */
    generate(round, baseSeed) {
      const r = U.rng((baseSeed | 0) * 7919 + round * 104729 + 13);
      const theme = THEMES[(round - 1 + (baseSeed % THEMES.length)) % THEMES.length];
      const H = 24, S = 19;
      const nSeg = Math.min(16, 7 + Math.floor(round * 0.8));
      const W = 12 + nSeg * 16 + 40;
      const G = new Grid(W, H);
      const diff = Math.min(10, round);
      const Ld = {
        diff,
        foe: (rr) => { const f = FOES[theme]; return f[Math.floor(rr() * Math.min(f.length, 2 + Math.floor(diff / 2)))]; },
        flyer: () => FLYERS[theme],
        powerup: (rr) => ['heart', 'heart', 'shield', 'triple', 'magnet', 'disco'][Math.floor(rr() * 6)],
      };
      G.ground(0, W - 1, S);
      G.set(3, S - 1, '@');
      let x = 8;
      const pool = ['flat', 'blocks', 'pit', 'hill', 'stairs', 'bridge', 'spikes', 'tower', 'gauntlet', 'decoy', 'spring', 'movers', 'secretgem'];
      if (theme === 'lava') pool.push('lavapit', 'firebar', 'lavapit');
      if (theme === 'stad' || theme === 'rymd') pool.push('cannon');
      let gems = 0;
      let last = '';
      const used = [];
      for (let i = 0; i < nSeg; i++) {
        let name;
        do { name = pool[Math.floor(r() * pool.length)]; } while (name === last || ((name === 'spring' || name === 'secretgem') && gems >= 2));
        last = name;
        const before = G.overlay.length;
        const w = SEG[name](G, x, S, r, Ld);
        if (name === 'spring' || name === 'secretgem') {
          // räkna diamanter
          for (let yy = 0; yy < H; yy++) for (let xx = x; xx < x + w; xx++) if (G.g[yy][xx] === '*') gems++;
          for (let k = before; k < G.overlay.length; k++) if (G.overlay[k][2] === '*') gems++;
        }
        used.push(name);
        x += w;
        if (i === Math.floor(nSeg / 2)) { G.set(x + 1, S - 1, 'c'); x += 3; }
      }
      // Kevin kan smita en gång i senare rundor
      if (round >= 3) {
        G.plat(x + 2, S - 3, 4);
        G.set(x + 3, S - 4, '1');
        x += 8;
      }
      const hide = ['room', 'cracked', 'ledge', 'under'][Math.floor(r() * 4)];
      x += HIDE[hide](G, x, S);
      G.ground(x, W - 1, S);
      const width = Math.min(W, x + 6);
      const def = G.def({
        id: 'R' + round, world: 0, num: round, name: 'RUNDA ' + round, theme, par: 9999, endless: true,
        hint: 'HITTA KEVIN INNAN TIDEN TAR SLUT!', seed: baseSeed + round,
      });
      def.rows = def.rows.map((row) => row.slice(0, width));
      def.overlay = def.overlay.filter((o) => o[0] < width);
      def.segments = used;
      def.hide = hide;
      return def;
    },
  };

  HK.Endless = Endless;
})((window.HK = window.HK || {}));

/* Scenen för oändligt läge */
(function (HK) {
  'use strict';
  const U = HK.U;
  const F = HK.Font;
  const S = HK.Sprites;
  const I = HK.Input;
  const FX = HK.FX;
  const G = HK.Game;
  const Hud = HK.Hud;
  const VW = U.VIEW_W, VH = U.VIEW_H;
  const KEY = 'hittakevin.endless';

  function best() {
    return U.store.get(KEY, { best: 0, round: 0 });
  }

  class EndlessScene {
    static newRun() {
      return { round: 1, seed: Math.floor(Math.random() * 90000) + 1000, found: 0, time: 100 * 60, hp: 3, maxHp: 3, gems: 0, coins: 0, enemies: 0, prevBest: best().best };
    }

    constructor(run) {
      this.run = run || EndlessScene.newRun();
      this.def = HK.Endless.generate(this.run.round, this.run.seed);
      this.world = new HK.World(this.def, {
        onComplete: () => this.roundDone(),
        onDeath: () => this.gameOver('DU TOG SLUT PÅ HJÄRTAN!'),
      });
      const p = this.world.player;
      p.maxHp = this.run.maxHp;
      p.hp = this.run.hp;
      this.world.cutscene = true;
      this.world.hudTimer = this.run.time;
      this.world.hudTitle = 'RUNDA ' + this.run.round + '   KEVINS: ' + this.run.found;
      this.state = 'intro';
      this.t = 0;
      this.gT = 0;
      const s = G.settings;
      const tog = (name, key, after) => ({
        label: () => name + ': ' + (s[key] ? 'PÅ' : 'AV'),
        action() { s[key] = !s[key]; G.saveSettings(); if (after) after(); },
        left() { this.action(); },
        right() { this.action(); },
      });
      this.pauseMenu = new HK.Menu([
        { label: 'FORTSÄTT', action: () => { this.state = 'play'; HK.Audio.sfx('pause'); } },
        { label: 'BÖRJA OM JAKTEN', action: () => G.transition(() => G.setScene(new EndlessScene())) },
        tog('MUSIK', 'music', () => HK.Audio.applySettings()),
        tog('LJUDEFFEKTER', 'sfx', () => HK.Audio.applySettings()),
        tog('CRT-FILTER', 'crt'),
        { label: 'TILL TITELSKÄRMEN', action: () => G.transition(() => G.setScene(new HK.Scenes.TitleScene()), { type: 'fade' }) },
      ]);
    }

    enter() {
      HK.Audio.stopMusic();
      HK.Audio.playMusic('start', true);
    }
    exit() {
      HK.Audio.jetpack(0);
    }
    onHide() {
      if (this.state === 'play' && this.world.state === 'play') this.pause();
    }
    hideCursor() {
      return this.state === 'play' && this.world.state === 'play';
    }
    wantsTouch() {
      return this.state === 'play' && this.world.state === 'play';
    }
    pause() {
      this.state = 'pause';
      this.pauseMenu.reset(0);
      HK.Audio.sfx('pause');
      HK.Audio.jetpack(0);
    }

    roundDone() {
      const W = this.world;
      const run = this.run;
      const gems = W.stats.gems.filter(Boolean).length;
      run.found++;
      run.gems += gems;
      run.coins += W.stats.coins;
      run.enemies += W.stats.enemies;
      const bonus = 40 * 60 + gems * 10 * 60;
      run.time = Math.min(run.time + bonus, 180 * 60);
      run.maxHp = W.player.maxHp;
      run.hp = Math.min(run.maxHp, W.player.hp + 1);
      run.round++;
      const b = best();
      if (run.found > b.best) U.store.set(KEY, { best: run.found, round: run.round });
      G.transition(() => G.setScene(new EndlessScene(run)));
    }

    gameOver(reason) {
      if (this.state === 'gameover') return;
      this.state = 'gameover';
      this.reason = reason;
      this.gT = 0;
      const b = best();
      this.newBest = this.run.found > (this.run.prevBest || 0);
      if (this.run.found > b.best) U.store.set(KEY, { best: this.run.found, round: this.run.round });
      this.best = Math.max(b.best, this.run.found);
      this.overMenu = new HK.Menu([
        { label: 'FÖRSÖK IGEN', action: () => G.transition(() => G.setScene(new EndlessScene())) },
        { label: 'TILL MENYN', action: () => G.transition(() => G.setScene(new HK.Scenes.TitleScene()), { type: 'fade' }) },
      ]);
      HK.Audio.stopMusic();
      HK.Audio.jetpack(0);
      HK.Audio.sfx('death');
    }

    update() {
      this.t++;
      const W = this.world;
      const run = this.run;
      if (this.state === 'intro') {
        W.update();
        if (this.t > 90 || (this.t > 15 && (I.hit('confirm') || I.click()))) {
          this.state = 'play';
          W.cutscene = false;
          HK.Audio.playMusic(W.theme.music, true);
        }
        return;
      }
      if (this.state === 'pause') {
        this.pauseMenu.update();
        if (I.hit('pause') || I.hit('back')) { this.state = 'play'; HK.Audio.sfx('pause'); }
        return;
      }
      if (this.state === 'gameover') {
        this.gT++;
        FX.update();
        if (this.gT > 50) {
          if (I.keyHit('KeyR')) { G.transition(() => G.setScene(new EndlessScene())); return; }
          if (I.hit('back')) { G.transition(() => G.setScene(new HK.Scenes.TitleScene()), { type: 'fade' }); return; }
          this.overMenu.update();
        }
        return;
      }
      if (I.hit('pause') && W.state === 'play') { this.pause(); return; }
      W.update();
      if (W.state === 'play' && !W.player.dead) {
        run.time--;
        if (run.time <= 10 * 60 && run.time > 0 && run.time % 60 === 0) HK.Audio.sfx('select');
        if (run.time <= 0) { run.time = 0; this.gameOver('TIDEN TOG SLUT!'); }
      }
      W.hudTimer = run.time;
    }

    render(ctx) {
      const W = this.world;
      W.draw(ctx);
      Hud.draw(ctx, W);
      const t = this.t;
      if (this.state === 'intro') {
        const k = t < 14 ? U.ease.outBack(t / 14) : t > 76 ? 1 - U.ease.inQuad((t - 76) / 14) : 1;
        const y = Math.round(U.lerp(-80, 72, k));
        Hud.panel(ctx, VW / 2 - 120, y, 240, 70);
        F.draw(ctx, 'OÄNDLIGT LÄGE', VW / 2, y + 8, { align: 'center', color: '#ff4fa3' });
        F.draw(ctx, 'RUNDA ' + this.run.round, VW / 2, y + 22, { align: 'center', scale: 2, color: '#ffffff' });
        F.draw(ctx, 'HITTA KEVIN INNAN TIDEN TAR SLUT!', VW / 2, y + 46, { align: 'center', color: '#c7d2ff' });
        F.draw(ctx, 'VARJE KEVIN GER +40 SEKUNDER', VW / 2, y + 57, { align: 'center', color: '#ffd23f' });
      }
      if (W.state === 'found' && this.state !== 'gameover') {
        const ft = W.foundT;
        const y = Math.round(U.lerp(-40, 48, U.ease.outBack(Math.min(1, ft / 18))));
        F.draw(ctx, 'KEVIN HITTAD!', VW / 2 + 2, y + 3, { align: 'center', scale: 3, color: '#1a1c2c', outline: '#1a1c2c' });
        F.draw(ctx, 'KEVIN HITTAD!', VW / 2, y, { align: 'center', scale: 3, rainbow: ft * 6, wave: 1, t: ft });
        const gems = W.stats.gems.filter(Boolean).length;
        F.draw(ctx, '+40 SEKUNDER' + (gems ? '   +' + gems * 10 + ' FÖR DIAMANTER' : '') + '   +♥', VW / 2, y + 30, { align: 'center', color: '#7dff6b' });
      }
      if (this.state === 'pause') {
        ctx.fillStyle = 'rgba(11,8,32,0.62)';
        ctx.fillRect(0, 0, VW, VH);
        Hud.panel(ctx, VW / 2 - 100, 50, 200, 140);
        F.draw(ctx, 'PAUS', VW / 2, 60, { align: 'center', color: '#ffd23f', scale: 2 });
        this.pauseMenu.draw(ctx, VW / 2, 86);
      }
      if (this.state === 'gameover') this.drawGameOver(ctx);
    }

    drawGameOver(ctx) {
      const t = this.gT;
      const run = this.run;
      ctx.fillStyle = 'rgba(11,8,32,' + Math.min(0.7, t / 30).toFixed(2) + ')';
      ctx.fillRect(0, 0, VW, VH);
      const y = Math.round(U.lerp(VH, 36, U.ease.outBack(Math.min(1, t / 20))));
      Hud.panel(ctx, VW / 2 - 124, y, 248, 196);
      F.draw(ctx, 'JAKTEN ÄR SLUT!', VW / 2, y + 10, { align: 'center', scale: 2, color: '#ff4d6d' });
      F.draw(ctx, this.reason || '', VW / 2, y + 32, { align: 'center', color: '#c7d2ff' });
      S.draw(ctx, 'kevin_head', 0, VW / 2 - 36, y + 72);
      F.draw(ctx, '× ' + run.found, VW / 2 - 24, y + 56, { scale: 2, color: '#ffd23f' });
      const rows = [
        ['RUNDOR', String(run.round)],
        ['MYNT', String(run.coins + this.world.stats.coins)],
        ['DIAMANTER', String(run.gems)],
        ['FIENDER', String(run.enemies + this.world.stats.enemies)],
        ['BÄSTA', this.best + (this.best === 1 ? ' KEVIN' : ' KEVINS') + (this.newBest ? '  NYTT REKORD!' : '')],
      ];
      rows.forEach((r, i) => {
        const yy = y + 88 + i * 13;
        F.draw(ctx, r[0], VW / 2 - 100, yy, { color: '#c7d2ff' });
        F.draw(ctx, r[1], VW / 2 + 100, yy, { align: 'right', color: i === 4 && this.newBest ? '#ffd23f' : '#ffffff' });
      });
      if (t > 50 && this.overMenu) this.overMenu.draw(ctx, VW / 2, y + 164, { gap: 14 });
    }
  }

  HK.Scenes = HK.Scenes || {};
  HK.Scenes.EndlessScene = EndlessScene;
  HK.Endless.best = best;
})((window.HK = window.HK || {}));
