/* Hitta Kevin — scener: titel, berättelse, karta, spel, paus, resultat, slut. */
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
  const K = '#1a1c2c';

  // =====================================================================
  // MENY
  // =====================================================================
  class Menu {
    constructor(items, o) {
      this.items = items;
      this.o = o || {};
      this.sel = 0;
      this.rects = [];
      this.t = 0;
      this.lastMouse = { x: I.mouse.x, y: I.mouse.y };
    }
    reset(sel) {
      this.sel = sel || 0;
      this.lastMouse = { x: I.mouse.x, y: I.mouse.y };
    }
    update() {
      this.t++;
      const n = this.items.length;
      if (I.hit('up')) { this.sel = (this.sel - 1 + n) % n; HK.Audio.sfx('select'); }
      if (I.hit('down')) { this.sel = (this.sel + 1) % n; HK.Audio.sfx('select'); }
      const it = this.items[this.sel];
      if (I.hit('left') && it.left) { it.left(); HK.Audio.sfx('select'); }
      if (I.hit('right') && it.right) { it.right(); HK.Audio.sfx('select'); }
      const m = I.mouse;
      const moved = m.x !== this.lastMouse.x || m.y !== this.lastMouse.y;
      this.lastMouse = { x: m.x, y: m.y };
      let hover = -1;
      this.rects.forEach((r, i) => {
        if (r && m.x >= r.x && m.x <= r.x + r.w && m.y >= r.y && m.y <= r.y + r.h) hover = i;
      });
      if (hover >= 0 && moved && hover !== this.sel) { this.sel = hover; HK.Audio.sfx('select'); }
      if (I.hit('confirm') || (I.click() && hover >= 0)) {
        if (I.click() && hover >= 0) this.sel = hover;
        const item = this.items[this.sel];
        if (item.action) {
          HK.Audio.sfx('confirm');
          item.action();
        }
      }
    }
    draw(ctx, cx, y, o) {
      o = o || {};
      const gap = o.gap || 16;
      this.rects = [];
      this.items.forEach((it, i) => {
        const label = typeof it.label === 'function' ? it.label() : it.label;
        const sel = i === this.sel;
        const w = F.measure(label, o.scale || 1).w;
        const yy = y + i * gap;
        this.rects[i] = { x: cx - w / 2 - 14, y: yy - 4, w: w + 28, h: 15 };
        if (sel) {
          const bob = Math.round(Math.sin(this.t * 0.2) * 2);
          F.draw(ctx, '▶', cx - w / 2 - 12 + bob, yy, { color: '#ffd23f' });
          F.draw(ctx, '◀', cx + w / 2 + 6 - bob, yy, { color: '#ffd23f' });
        }
        F.draw(ctx, label, cx, yy, { align: 'center', color: sel ? '#ffd23f' : it.dim ? '#6b7699' : '#ffffff', scale: o.scale || 1 });
      });
    }
  }
  HK.Menu = Menu;

  function toggleLabel(name, on) {
    return name + ': ' + (on ? 'PÅ' : 'AV');
  }
  function settingsItems(extra) {
    const s = G.settings;
    return [
      { label: () => toggleLabel('MUSIK', s.music), action() { s.music = !s.music; G.saveSettings(); HK.Audio.applySettings(); }, left() { this.action(); }, right() { this.action(); } },
      { label: () => toggleLabel('LJUDEFFEKTER', s.sfx), action() { s.sfx = !s.sfx; G.saveSettings(); HK.Audio.applySettings(); }, left() { this.action(); }, right() { this.action(); } },
      { label: () => toggleLabel('SKAKNINGAR', s.shake), action() { s.shake = !s.shake; G.saveSettings(); }, left() { this.action(); }, right() { this.action(); } },
      { label: () => toggleLabel('CRT-FILTER', s.crt), action() { s.crt = !s.crt; G.saveSettings(); }, left() { this.action(); }, right() { this.action(); } },
    ].concat(extra || []);
  }

  // Liten bakgrundsscen med parallax (för meny/karta)
  function drawThemeBackdrop(ctx, theme, t, speed) {
    HK.Themes.drawBg(ctx, theme, t * (speed || 0.6), 0, 0, t);
  }

  function drawGroundStrip(ctx, theme, y, scroll) {
    const A = HK.Tiles.atlas(theme);
    const off = -Math.floor(scroll % 16);
    for (let x = off; x < VW + 16; x += 16) {
      ctx.drawImage(A.ground[(2 | 4 | 8) * 4 + (((x - off) / 16 + Math.floor(scroll / 16)) & 3)], x, y);
      for (let yy = y + 16; yy < VH; yy += 16) ctx.drawImage(A.ground[15 * 4 + 1], x, yy);
    }
  }

  // =====================================================================
  // TITEL
  // =====================================================================
  class TitleScene {
    constructor() {
      this.t = 0;
      this.mode = 'press';
      this.menu = new Menu([
        { label: 'SPELA', action: () => this.play() },
        { label: 'OÄNDLIGT LÄGE', action: () => G.transition(() => G.setScene(new HK.Scenes.EndlessScene())) },
        { label: 'KONTROLLER', action: () => { this.mode = 'controls'; } },
        { label: 'INSTÄLLNINGAR', action: () => { this.mode = 'settings'; this.settings.reset(0); } },
      ]);
      this.settings = new Menu(settingsItems([
        { label: 'NOLLSTÄLL FRAMSTEG', action: () => { this.mode = 'confirmreset'; this.confirm.reset(1); } },
        { label: 'TILLBAKA', action: () => { this.mode = 'menu'; } },
      ]));
      this.confirm = new Menu([
        { label: 'JA, BÖRJA OM', action: () => { HK.Save.reset(); this.mode = 'menu'; FX.text(VW / 2, 180, 'NOLLSTÄLLT!', '#ff4d6d'); } },
        { label: 'NEJ', action: () => { this.mode = 'settings'; } },
      ]);
      this.runner = { x: -40, kevin: -10 };
    }
    enter() {
      HK.Audio.playMusic('titel');
      FX.clear();
    }
    play() {
      G.transition(() => {
        if (!HK.Save.data.seenIntro) G.setScene(new StoryScene());
        else G.setScene(new MapScene());
      });
    }
    update() {
      this.t++;
      FX.update();
      if (this.mode === 'press') {
        if (I.anyHit || I.click()) {
          this.mode = 'menu';
          HK.Audio.unlock();
          HK.Audio.playMusic('titel');
          HK.Audio.sfx('confirm');
        }
      } else if (this.mode === 'menu') this.menu.update();
      else if (this.mode === 'settings') {
        this.settings.update();
        if (I.hit('back')) this.mode = 'menu';
      } else if (this.mode === 'confirmreset') {
        this.confirm.update();
        if (I.hit('back')) this.mode = 'settings';
      } else if (this.mode === 'controls') {
        if (I.hit('confirm') || I.hit('back') || I.click()) { this.mode = 'menu'; HK.Audio.sfx('back'); }
      }
      // jagande figurer längst ner
      const r = this.runner;
      r.x += 1.6;
      if (r.x > VW + 80) r.x = -60;
      if (this.t % 30 === 0) FX.add({ type: 'confetti', x: U.rand(0, VW), y: -4, vx: U.rand(-0.3, 0.3), vy: U.rand(0.3, 0.8), g: 0.01, drag: 1, life: 400, color: U.pick(FX.RAINBOW), phase: 0, spin: 0.2 });
    }
    render(ctx) {
      const t = this.t;
      drawThemeBackdrop(ctx, 'kullar', t, 0.8);
      drawGroundStrip(ctx, 'kullar', VH - 34, t * 0.8);
      // figurer
      const r = this.runner;
      const kx = r.x + 46;
      S.draw(ctx, 'kevin_run', Math.floor(t / 5), Math.round(kx), VH - 34, {});
      S.draw(ctx, 'hero_run', Math.floor(t / 4), Math.round(r.x), VH - 34, {});
      S.draw(ctx, 'hero_arm', 0, Math.round(r.x) + 1, VH - 34 - 9, { ay: 0.5 });
      if (Math.floor(t / 90) % 2 === 0) Hud.bubble(ctx, 'HITTA MIG!', Math.round(kx), VH - 60, 1);
      FX.draw(ctx, null, false);
      // logga
      this.drawLogo(ctx, VW / 2, 34, t);
      if (this.mode === 'press') {
        if (Math.floor(t / 30) % 2 === 0) F.draw(ctx, I.touch.enabled ? 'TRYCK FÖR ATT BÖRJA' : 'TRYCK PÅ EN TANGENT', VW / 2, 150, { align: 'center', color: '#ffffff' });
      } else if (this.mode === 'menu') {
        Hud.panel(ctx, VW / 2 - 80, 122, 160, 76);
        this.menu.draw(ctx, VW / 2, 132);
        const eb = HK.Endless && HK.Endless.best ? HK.Endless.best() : null;
        if (eb && eb.best > 0) F.draw(ctx, 'REKORD I OÄNDLIGT LÄGE: ' + eb.best + (eb.best === 1 ? ' KEVIN' : ' KEVINS'), VW / 2, 204, { align: 'center', color: '#ffd23f', alpha: 0.9 });
      } else if (this.mode === 'settings') {
        Hud.panel(ctx, VW / 2 - 100, 104, 200, 106);
        this.settings.draw(ctx, VW / 2, 113);
      } else if (this.mode === 'confirmreset') {
        Hud.panel(ctx, VW / 2 - 110, 120, 220, 56);
        F.draw(ctx, 'RADERA ALLA FRAMSTEG?', VW / 2, 128, { align: 'center', color: '#ff4d6d' });
        this.confirm.draw(ctx, VW / 2, 146);
      } else if (this.mode === 'controls') {
        ControlsPanel.draw(ctx, t);
      }
      F.draw(ctx, 'M = LJUD PÅ/AV', VW - 6, VH - 11, { align: 'right', color: '#c7d2ff', alpha: 0.8 });
    }
    drawLogo(ctx, cx, y, t) {
      const title = 'HITTA KEVIN';
      const scale = 4;
      const w = F.measure(title, scale).w;
      let x = cx - w / 2;
      for (let i = 0; i < title.length; i++) {
        const ch = title[i];
        const cw = F.measure(ch, scale).w;
        const oy = Math.round(Math.sin(t * 0.08 + i * 0.5) * 3);
        const hue = (t * 2 + i * 28) % 360;
        const col = ch === ' ' ? '#fff' : U.hsl(hue, 95, 62);
        // tjock skugga
        F.draw(ctx, ch, x + 3, y + oy + 4, { scale, color: '#1a1c2c', outline: '#1a1c2c' });
        F.draw(ctx, ch, x, y + oy, { scale, color: col, outline: '#1a1c2c' });
        x += cw + scale;
      }
      F.draw(ctx, 'ETT RETRO-ÄVENTYR', cx, y + 42, { align: 'center', color: '#ffffff', shadow: '#1a1c2c' });
    }
  }

  const ControlsPanel = {
    draw(ctx, t) {
      Hud.panel(ctx, 40, 86, VW - 80, 170);
      F.draw(ctx, 'KONTROLLER', VW / 2, 94, { align: 'center', color: '#ffd23f' });
      const rows = I.touch.enabled ? [
        ['◀ ▶', 'SPRINGA'],
        ['HOPP', 'HOPPA (HÅLL = HÖGRE)'],
        ['SKJUT', 'SKJUT MOT NÄRMASTE FIENDE'],
        ['TRYCK PÅ SKÄRMEN', 'SKJUT DIT DU TRYCKER'],
        ['▼', 'HUKA / SLÄPP IGENOM PLANKOR'],
        ['KIKARE', 'SPANA EFTER KEVIN'],
        ['HOPP I LUFTEN', 'FLYG MED JETPACK'],
      ] : [
        ['A / D', 'SPRINGA'],
        ['SPACE', 'HOPPA (HÅLL = HÖGRE)'],
        ['MUSKLICK', 'SKJUT DIT MUSEN PEKAR'],
        ['E / HÖGERKLICK', 'KIKARE: STÅ STILL OCH SPANA'],
        ['W / S', 'TITTA UPP / HUKA'],
        ['S + SPACE', 'HOPPA NER GENOM PLANKOR'],
        ['SHIFT', 'SPRINTA'],
        ['SPACE I LUFTEN', 'FLYG MED JETPACK'],
        ['ESC / P', 'PAUS'],
      ];
      rows.forEach((r, i) => {
        const y = 110 + i * 14;
        F.draw(ctx, r[0], VW / 2 - 8, y, { align: 'right', color: '#6ff6ff' });
        F.draw(ctx, r[1], VW / 2 + 8, y, { color: '#ffffff' });
      });
      if (Math.floor(t / 30) % 2 === 0) F.draw(ctx, 'TRYCK FÖR ATT GÅ TILLBAKA', VW / 2, 242, { align: 'center', color: '#c7d2ff' });
    },
  };
  HK.ControlsPanel = ControlsPanel;

  // =====================================================================
  // BERÄTTELSE
  // =====================================================================
  const STORY = [
    { text: 'DET HÄR ÄR KEVIN.', pose: 'dance' },
    { text: 'KEVIN ÄLSKAR ATT GÖMMA SIG. HAN ÄR VÄRLDSMÄSTARE PÅ KURRAGÖMMA.', pose: 'peek' },
    { text: 'NU HAR HAN GÖMT SIG NÅGONSTANS I PIXELRIKET... I SEX OLIKA VÄRLDAR!', pose: 'map' },
    { text: 'SPANA MED KIKAREN, LYSSNA PÅ KEVIN-RADARN OCH SE UPP FÖR PAPP-KEVINS!', pose: 'decoy' },
    { text: 'REDO? DÅ KÖR VI. HITTA KEVIN!', pose: 'hero' },
  ];

  class StoryScene {
    constructor() {
      this.i = 0;
      this.t = 0;
      this.chars = 0;
    }
    enter() {
      HK.Audio.playMusic('karta');
      FX.clear();
    }
    next() {
      const cur = STORY[this.i].text;
      if (this.chars < cur.length) { this.chars = cur.length; return; }
      this.i++;
      this.chars = 0;
      this.t = 0;
      HK.Audio.sfx('select');
      if (this.i >= STORY.length) {
        HK.Save.data.seenIntro = true;
        HK.Save.write();
        this.i = STORY.length - 1;
        this.done = true;
        G.transition(() => G.setScene(new MapScene()));
      }
    }
    update() {
      this.t++;
      FX.update();
      const cur = STORY[this.i].text;
      if (this.chars < cur.length && this.t % 2 === 0) {
        this.chars++;
        if (cur[this.chars - 1] !== ' ') HK.Audio.sfx('text');
      }
      if (this.done) return;
      if (I.hit('back')) {
        this.done = true;
        HK.Save.data.seenIntro = true;
        HK.Save.write();
        G.transition(() => G.setScene(new MapScene()));
        return;
      }
      if (I.hit('confirm') || I.click() || I.hit('jump')) this.next();
    }
    render(ctx) {
      const t = this.t;
      ctx.fillStyle = '#0b0820';
      ctx.fillRect(0, 0, VW, VH);
      // stjärnhimmel
      for (let i = 0; i < 60; i++) {
        const x = (i * 97 + Math.floor(G.t * 0.05 * (1 + (i % 3)))) % VW, y = (i * 53) % 150;
        ctx.fillStyle = i % 7 === 0 ? '#ffd6f0' : '#3b3f7c';
        ctx.fillRect(x, y, 1, 1);
      }
      const st = STORY[this.i];
      // scen i mitten
      Hud.panel(ctx, 90, 30, 300, 130, { fill: '#1b1440' });
      ctx.save();
      ctx.beginPath();
      ctx.rect(91, 31, 298, 128);
      ctx.clip();
      HK.Themes.drawBg(ctx, st.pose === 'map' ? 'moln' : st.pose === 'decoy' ? 'stad' : 'kullar', G.t * 0.4, 0, 0, G.t);
      ctx.restore();
      const cx = VW / 2, gy = 146;
      const A = HK.Tiles.atlas('kullar');
      ctx.save();
      ctx.beginPath();
      ctx.rect(91, 31, 298, 128);
      ctx.clip();
      for (let x = 91; x < 389; x += 16) ctx.drawImage(A.ground[14 * 4 + ((x >> 4) & 3)], x, gy);
      ctx.restore();
      if (st.pose === 'dance') {
        S.draw(ctx, 'kevin_dance', Math.floor(G.t / 10), cx, gy, { sx: 2, sy: 2 });
        if (G.t % 20 === 0) FX.confetti(cx, 60, 6, { angle: Math.PI / 2, up: 0 });
      } else if (st.pose === 'peek') {
        S.draw(ctx, 'kevin_idle', 0, cx + 30, gy, { sx: 2, sy: 2, flip: true });
        const bush = HK.Decor.sprite('bush', 0);
        ctx.drawImage(bush, cx - 10, gy - 28, bush.width * 2, bush.height * 2);
        S.draw(ctx, 'hero_lookup', 0, cx - 90, gy, { sx: 2, sy: 2 });
        F.draw(ctx, '?', cx - 90, gy - 64 + Math.round(Math.sin(G.t * 0.1) * 2), { color: '#ffd23f', scale: 2, align: 'center' });
      } else if (st.pose === 'map') {
        const worlds = ['kullar', 'stad', 'grotta', 'moln', 'lava', 'rymd'];
        worlds.forEach((w, i) => {
          const x = 110 + i * 46, y = 70 + (i % 2) * 20;
          HK.Hud.panel(ctx, x, y, 40, 30, { fill: HK.Themes[w].sky[2], edge: '#ffffff' });
          F.draw(ctx, String(i + 1), x + 20, y + 11, { align: 'center', color: '#ffffff' });
        });
        S.draw(ctx, 'kevin_head', 0, 110 + 5 * 46 + 20 + Math.round(Math.sin(G.t * 0.1) * 3), 70 + 20 - 6, {});
      } else if (st.pose === 'decoy') {
        S.draw(ctx, 'decoy', 0, cx - 50, gy + 4, { sx: 2, sy: 2 });
        S.draw(ctx, 'kevin_wave', Math.floor(G.t / 12), cx + 50, gy, { sx: 2, sy: 2, flip: true });
        F.draw(ctx, 'PAPP!', cx - 50, 50, { color: '#e0c09a', align: 'center' });
        F.draw(ctx, 'ÄKTA!', cx + 50, 50, { color: '#7dff6b', align: 'center' });
      } else if (st.pose === 'hero') {
        S.draw(ctx, 'hero_win', 0, cx, gy, { sx: 2, sy: 2 });
        if (G.t % 16 === 0) FX.sparkle(cx + U.rand(-30, 30), U.rand(50, 120), '#ffd23f', 2);
      }
      FX.draw(ctx, null, false);
      // text
      const lines = F.wrap(st.text, 360);
      let shown = this.chars;
      lines.forEach((l, i) => {
        const part = l.slice(0, Math.max(0, shown));
        shown -= l.length + 1;
        F.draw(ctx, part, VW / 2, 182 + i * 14, { align: 'center', color: '#ffffff' });
      });
      if (this.chars >= st.text.length && Math.floor(t / 20) % 2 === 0) F.draw(ctx, '▼', VW / 2, 226, { align: 'center', color: '#ffd23f' });
      F.draw(ctx, (this.i + 1) + '/' + STORY.length, VW - 10, VH - 14, { align: 'right', color: '#6b7699' });
      F.draw(ctx, I.touch.enabled ? 'TRYCK FÖR ATT FORTSÄTTA' : 'SPACE = NÄSTA   ESC = HOPPA ÖVER', 10, VH - 14, { color: '#6b7699' });
    }
  }

  // =====================================================================
  // KARTA
  // =====================================================================
  const NODES = [
    [48, 226], [96, 204],
    [150, 228], [206, 210],
    [262, 228], [318, 206],
    [372, 216], [428, 190],
    [410, 140], [352, 124],
    [292, 104], [228, 86], [150, 62],
  ];
  const WORLD_COL = { kullar: '#4fc46b', stad: '#9b5de5', grotta: '#2aa6d8', moln: '#e0e8ff', lava: '#ff5a2a', rymd: '#6b4fd6' };

  class MapScene {
    constructor(focus) {
      this.t = 0;
      const unlockedMax = HK.LEVELS.reduce((m, d, i) => (HK.Save.unlocked(i) ? i : m), 0);
      this.sel = focus != null ? focus : Math.min(HK.Save.data.lastLevel || 0, unlockedMax);
      this.pos = { x: NODES[this.sel][0], y: NODES[this.sel][1] };
      this.path = [];
      this.mapCanvas = null;
      this.menuOpen = false;
      this.pause = new Menu([
        { label: 'TILLBAKA TILL KARTAN', action: () => { this.menuOpen = false; } },
        ...settingsItems(),
        { label: 'TILL TITELSKÄRMEN', action: () => G.transition(() => G.setScene(new TitleScene()), { type: 'fade' }) },
      ]);
    }
    enter() {
      HK.Audio.playMusic('karta');
      FX.clear();
      if (!this.mapCanvas) this.mapCanvas = buildMap();
    }
    walkTo(i) {
      if (i === this.sel || i < 0 || i >= HK.LEVELS.length) return;
      if (!HK.Save.unlocked(i)) { HK.Audio.sfx('bump'); return; }
      const step = i > this.sel ? 1 : -1;
      this.path = [];
      for (let k = this.sel + step; step > 0 ? k <= i : k >= i; k += step) this.path.push(k);
      this.sel = i;
      HK.Audio.sfx('select');
    }
    start() {
      const idx = this.sel;
      HK.Save.data.lastLevel = idx;
      HK.Save.write();
      HK.Audio.sfx('start');
      const n = NODES[idx];
      G.transition(() => G.setScene(new PlayScene(idx)), { type: 'iris', x: n[0], y: n[1] });
    }
    update() {
      this.t++;
      FX.update();
      if (this.menuOpen) {
        this.pause.update();
        if (I.hit('back') || I.hit('pause')) this.menuOpen = false;
        return;
      }
      if (I.hit('pause') || I.hit('back')) { this.menuOpen = true; this.pause.reset(0); HK.Audio.sfx('pause'); return; }
      if (this.path.length) {
        const target = NODES[this.path[0]];
        const dx = target[0] - this.pos.x, dy = target[1] - this.pos.y;
        const d = Math.hypot(dx, dy);
        if (d < 2.5) { this.pos.x = target[0]; this.pos.y = target[1]; this.path.shift(); }
        else { this.pos.x += (dx / d) * 2.2; this.pos.y += (dy / d) * 2.2; this.face = dx < 0 ? -1 : 1; }
        if (this.t % 6 === 0) FX.dust(this.pos.x, this.pos.y, this.face || 1);
        return;
      }
      if (I.hit('right') || I.hit('up')) this.walkTo(this.sel + 1);
      if (I.hit('left') || I.hit('down')) this.walkTo(this.sel - 1);
      // klicka på en nod
      if (I.click()) {
        for (let i = 0; i < NODES.length && i < HK.LEVELS.length; i++) {
          if (Math.hypot(I.mouse.x - NODES[i][0], I.mouse.y - NODES[i][1]) < 11) {
            if (i === this.sel) this.start();
            else this.walkTo(i);
            return;
          }
        }
        // klick på info-panelen = spela
        if (I.mouse.y < 44 && I.mouse.x > 110 && I.mouse.x < 370) this.start();
      }
      if (I.hit('confirm')) this.start();
    }
    render(ctx) {
      const t = this.t;
      if (!this.mapCanvas) this.mapCanvas = buildMap();
      ctx.drawImage(this.mapCanvas, 0, 0);
      // vatten-glitter
      for (let i = 0; i < 14; i++) {
        const x = (i * 71 + Math.floor(t / 3)) % VW, y = 250 + (i * 7) % 18;
        if ((t + i * 13) % 60 < 30) { ctx.fillStyle = '#bff4ff'; ctx.fillRect(x, y, 3, 1); }
      }
      // vägen
      const n = Math.min(NODES.length, HK.LEVELS.length);
      for (let i = 0; i < n - 1; i++) {
        const a = NODES[i], b = NODES[i + 1];
        const open = HK.Save.unlocked(i + 1);
        const d = Math.hypot(b[0] - a[0], b[1] - a[1]);
        for (let s = 0; s < d; s += 5) {
          const x = Math.round(a[0] + ((b[0] - a[0]) * s) / d), y = Math.round(a[1] + ((b[1] - a[1]) * s) / d);
          ctx.fillStyle = K;
          ctx.fillRect(x - 2, y - 2, 4, 4);
          ctx.fillStyle = open ? '#fff3a0' : '#6b7699';
          ctx.fillRect(x - 1, y - 1, 2, 2);
        }
      }
      // noder
      for (let i = 0; i < n; i++) {
        const def = HK.LEVELS[i];
        const [x, y] = NODES[i];
        const open = HK.Save.unlocked(i);
        const done = HK.Save.isDone(def.id);
        const col = WORLD_COL[def.theme] || '#ffffff';
        const r = def.boss ? 10 : 8;
        HK.BgUtil.disc(ctx, x, y + 2, r + 1, K);
        HK.BgUtil.disc(ctx, x, y, r + 1, K);
        HK.BgUtil.disc(ctx, x, y, r, open ? col : '#50557a');
        HK.BgUtil.disc(ctx, x - 2, y - 2, Math.max(2, r - 5), open ? U.shade(col, 0.4) : '#6b7699');
        if (done) S.draw(ctx, 'kevin_head', 0, x, y + 7);
        else if (open) F.draw(ctx, def.boss ? '!' : String(def.num), x, y - 3, { align: 'center', color: '#ffffff' });
        else F.draw(ctx, '×', x, y - 3, { align: 'center', color: '#9aa7c2' });
        if (done) {
          const l = HK.Save.level(def.id);
          for (let g = 0; g < 3; g++) {
            ctx.fillStyle = K;
            ctx.fillRect(x - 7 + g * 5, y + r + 2, 4, 4);
            ctx.fillStyle = l && l.gems[g] ? ['#ff4d6d', '#4ade6b', '#4dc3ff'][g] : '#3b3f5c';
            ctx.fillRect(x - 6 + g * 5, y + r + 3, 2, 2);
          }
        }
      }
      // spelaren
      const bob = this.path.length ? Math.abs(Math.sin(t * 0.3)) * 3 : Math.sin(t * 0.1) * 1;
      const hx = Math.round(this.pos.x), hy = Math.round(this.pos.y - 6 - bob);
      S.draw(ctx, this.path.length ? 'hero_run' : 'hero_idle0', Math.floor(t / 4), hx, hy, { flip: (this.face || 1) < 0 });
      FX.draw(ctx, null, true);
      FX.draw(ctx, null, false);
      // infopanel
      const def = HK.LEVELS[this.sel];
      const l = HK.Save.level(def.id);
      Hud.panel(ctx, 112, 4, 256, 40);
      F.draw(ctx, 'VÄRLD ' + def.id + (def.boss ? ' - BOSS' : ''), VW / 2, 9, { align: 'center', color: WORLD_COL[def.theme] });
      F.draw(ctx, def.name, VW / 2, 20, { align: 'center', color: '#ffffff' });
      let info = HK.Themes[def.theme].name;
      if (l && l.done) info = 'BÄST: ' + U.fmtTime(l.best) + '   ' + '★'.repeat(l.stars) + '☆'.repeat(0);
      F.draw(ctx, info, VW / 2, 31, { align: 'center', color: '#c7d2ff' });
      if (!this.path.length && Math.floor(t / 25) % 2 === 0) F.draw(ctx, I.touch.enabled ? 'TRYCK PÅ NIVÅN FÖR ATT SPELA' : 'SPACE = SPELA   ◀ ▶ = VÄLJ', VW / 2, VH - 12, { align: 'center', color: '#ffffff' });
      const tot = HK.Save.totals();
      F.draw(ctx, '◆ ' + tot.gems + '/' + tot.maxGems, 8, 8, { color: '#6ff6ff' });
      F.draw(ctx, '★ ' + tot.stars + '/' + tot.count * 3, 8, 20, { color: '#ffd23f' });
      F.draw(ctx, 'ESC = MENY', VW - 8, 8, { align: 'right', color: '#c7d2ff' });
      if (this.menuOpen) {
        ctx.fillStyle = 'rgba(11,8,32,0.6)';
        ctx.fillRect(0, 0, VW, VH);
        Hud.panel(ctx, VW / 2 - 100, 58, 200, 130);
        F.draw(ctx, 'MENY', VW / 2, 66, { align: 'center', color: '#ffd23f' });
        this.pause.draw(ctx, VW / 2, 84);
      }
    }
  }

  function buildMap() {
    const c = U.makeCanvas(VW, VH);
    const ctx = c.getContext('2d');
    // hav
    HK.BgUtil.bands(ctx, 0, 0, VW, VH, ['#2a7fd6', '#2f8ae0', '#3596e8', '#3fa9f5']);
    const r = U.rng(123);
    for (let i = 0; i < 120; i++) {
      ctx.fillStyle = 'rgba(255,255,255,0.18)';
      ctx.fillRect(Math.floor(r() * VW), Math.floor(r() * VH), 4, 1);
    }
    // landmassa: stor ö
    const land = (cx, cy, rx, ry, col, edge) => {
      for (let y = -ry - 2; y <= ry + 2; y++)
        for (let x = -rx - 2; x <= rx + 2; x++) {
          const n = Math.sin((x + cx) * 0.13) * 0.08 + Math.cos((y + cy) * 0.17) * 0.08;
          const d = (x * x) / (rx * rx) + (y * y) / (ry * ry);
          if (d < 1 + n) {
            ctx.fillStyle = d > 0.86 + n ? edge : col;
            ctx.fillRect(cx + x, cy + y, 1, 1);
          }
        }
    };
    land(240, 150, 236, 118, '#f4d9a0', '#e8c27a');
    // regioner
    land(78, 214, 70, 42, '#5fd65f', '#2f9e4f');
    land(180, 218, 60, 36, '#3a2a5c', '#9b5de5');
    land(292, 216, 58, 38, '#232a5c', '#2aa6d8');
    land(410, 170, 64, 60, '#f4f0ff', '#c9c0ff');
    land(322, 112, 60, 36, '#4a1a20', '#ff5a2a');
    land(190, 72, 84, 46, '#140f38', '#6b4fd6');
    // dekor
    const tree = (x, y) => { HK.BgUtil.disc(ctx, x, y - 4, 5, '#1f7a3a'); HK.BgUtil.disc(ctx, x - 1, y - 5, 3.5, '#4fc46b'); ctx.fillStyle = '#6b3e26'; ctx.fillRect(x - 1, y, 2, 3); };
    [[30, 200], [60, 190], [120, 226], [26, 240], [84, 240], [110, 186]].forEach((p) => tree(p[0], p[1]));
    // stad
    for (let i = 0; i < 9; i++) {
      const x = 140 + i * 9, h = 10 + ((i * 7) % 14);
      ctx.fillStyle = '#1a0f30';
      ctx.fillRect(x, 222 - h, 7, h);
      ctx.fillStyle = i % 2 ? '#2ef2ff' : '#ff4fa3';
      ctx.fillRect(x, 222 - h, 7, 1);
      ctx.fillStyle = '#ffd23f';
      if (i % 3 === 0) ctx.fillRect(x + 2, 222 - h + 4, 1, 1);
    }
    // grotta: kristaller
    for (let i = 0; i < 8; i++) {
      const x = 256 + i * 9, y = 234 - (i % 3) * 6;
      ctx.fillStyle = i % 2 ? '#7af5ff' : '#ff7ad9';
      for (let k = 0; k < 6; k++) ctx.fillRect(x - Math.floor((6 - k) / 3), y - k, 1 + Math.floor((6 - k) / 3) * 2, 1);
    }
    // moln
    for (let i = 0; i < 5; i++) HK.BgUtil.cloud(ctx, 372 + (i % 3) * 22, 150 + i * 12, 4, '#ffffff', '#d6ccff');
    // vulkan
    for (let k = 0; k < 24; k++) {
      ctx.fillStyle = '#2e0a14';
      ctx.fillRect(322 - k, 96 + k, k * 2, 1);
    }
    ctx.fillStyle = '#ff9f1c';
    ctx.fillRect(318, 95, 8, 2);
    ctx.fillStyle = '#ff5a2a';
    for (let k = 0; k < 16; k++) ctx.fillRect(322 + Math.round(Math.sin(k * 0.6) * 2) + Math.floor(k / 3), 97 + k, 1, 1);
    // rymd: stjärnor och planet
    for (let i = 0; i < 40; i++) {
      ctx.fillStyle = i % 5 ? '#c7d2ff' : '#ffd6f0';
      ctx.fillRect(120 + Math.floor(r() * 150), 34 + Math.floor(r() * 70), 1, 1);
    }
    HK.BgUtil.disc(ctx, 250, 52, 9, '#ff9fd0');
    HK.BgUtil.disc(ctx, 248, 50, 6, '#ffc2e6');
    ctx.fillStyle = '#ffe7a0';
    ctx.fillRect(236, 54, 29, 1);
    // titel på kartan
    F.draw(ctx, 'PIXELRIKET', 468, 252, { align: 'right', color: '#ffffff', shadow: '#1a1c2c' });
    return c;
  }

  // =====================================================================
  // SPELSCEN
  // =====================================================================
  class PlayScene {
    constructor(idx) {
      this.idx = idx;
      this.def = HK.LEVELS[idx];
      this.state = 'intro';
      this.t = 0;
      this.world = new HK.World(this.def, {
        onComplete: () => this.complete(),
        onBossStart: () => {},
      });
      this.world.cutscene = true;
      this.pauseMenu = new Menu([
        { label: 'FORTSÄTT', action: () => this.resume() },
        { label: 'STARTA OM NIVÅN', action: () => G.transition(() => G.setScene(new PlayScene(this.idx))) },
        { label: 'KONTROLLER', action: () => { this.showControls = true; } },
        ...settingsItems(),
        { label: 'TILL KARTAN', action: () => G.transition(() => G.setScene(new MapScene(this.idx))) },
      ]);
      this.resultsT = 0;
    }
    enter() {
      HK.Audio.stopMusic();
      HK.Audio.playMusic('start', true);
    }
    exit() {
      HK.Audio.jetpack(0);
    }
    onHide() {
      if (this.state === 'play') this.pause();
    }
    hideCursor() {
      return this.state === 'play' && this.world.state === 'play';
    }
    pause() {
      this.state = 'pause';
      this.pauseMenu.reset(0);
      this.showControls = false;
      HK.Audio.sfx('pause');
      HK.Audio.jetpack(0);
    }
    resume() {
      this.state = 'play';
      HK.Audio.sfx('pause');
    }
    complete() {
      const W = this.world;
      const st = W.stats;
      let stars = 1;
      const allGems = st.gems.filter(Boolean).length >= W.gemTotal;
      if (allGems) stars++;
      if (st.time <= (this.def.par || 180) * 60) stars++;
      this.stars = stars;
      this.allGems = allGems;
      this.underPar = st.time <= (this.def.par || 180) * 60;
      const res = HK.Save.complete(this.def, st, stars);
      this.newBest = res.newBest;
      this.state = 'results';
      this.resultsT = 0;
    }
    update() {
      this.t++;
      const W = this.world;
      if (this.state === 'intro') {
        W.update();
        if (this.t > 110 || (this.t > 20 && (I.hit('confirm') || I.click()))) {
          this.state = 'play';
          W.cutscene = false;
          HK.Audio.playMusic(this.def.music || W.theme.music, true);
        }
        return;
      }
      if (this.state === 'pause') {
        if (this.showControls) {
          if (I.hit('confirm') || I.hit('back') || I.click()) this.showControls = false;
          return;
        }
        this.pauseMenu.update();
        if (I.hit('pause') || I.hit('back')) this.resume();
        return;
      }
      if (this.state === 'results') {
        this.resultsT++;
        W.update();
        if (this.resultsT % 40 === 0) FX.confetti(U.rand(40, VW - 40) + W.cam.x, W.cam.y - 4, 16, { angle: Math.PI / 2, up: 0, min: 0.5, max: 2 });
        if (this.resultsT > 60 && (I.hit('confirm') || I.click())) this.leave();
        return;
      }
      if (I.hit('pause') && W.state === 'play') { this.pause(); return; }
      if (I.keyHit('KeyR') && W.state === 'play' && !W.player.dead) {
        G.transition(() => G.setScene(new PlayScene(this.idx)));
        return;
      }
      W.update();
    }
    leave() {
      if (this.def.boss) {
        HK.Save.data.finished = true;
        HK.Save.write();
        G.transition(() => G.setScene(new EndingScene(this.world.stats)), { type: 'fade', dur: 50 });
        return;
      }
      const next = Math.min(HK.LEVELS.length - 1, this.idx + 1);
      G.transition(() => G.setScene(new MapScene(this.idx)), { type: 'iris' });
      HK.Save.data.lastLevel = next;
      HK.Save.write();
      this.leaving = true;
    }
    render(ctx) {
      const W = this.world;
      W.draw(ctx);
      if (this.state !== 'results') Hud.draw(ctx, W);
      if (this.state === 'intro') this.drawIntro(ctx);
      if (W.state === 'found' && this.state !== 'results') this.drawFoundBanner(ctx, W.foundT);
      if (this.state === 'pause') this.drawPause(ctx);
      if (this.state === 'results') this.drawResults(ctx);
      // touch-knappar döljs i menyer
    }
    drawIntro(ctx) {
      const t = this.t;
      const k = t < 14 ? U.ease.outBack(t / 14) : t > 96 ? 1 - U.ease.inQuad((t - 96) / 14) : 1;
      const y = Math.round(U.lerp(-80, 70, k));
      Hud.panel(ctx, VW / 2 - 130, y, 260, 74);
      F.draw(ctx, 'VÄRLD ' + this.def.id, VW / 2, y + 9, { align: 'center', color: WORLD_COL[this.def.theme] });
      F.draw(ctx, this.def.name, VW / 2, y + 22, { align: 'center', color: '#ffffff', scale: 2 });
      F.draw(ctx, this.def.hint || 'KEVIN GÖMMER SIG NÅGONSTANS HÄR...', VW / 2, y + 48, { align: 'center', color: '#c7d2ff' });
      S.draw(ctx, 'kevin_head', 0, VW / 2 - 118, y + 20);
      S.draw(ctx, 'kevin_head', 0, VW / 2 + 118, y + 20, { flip: true });
      F.draw(ctx, '? ? ?', VW / 2, y + 60, { align: 'center', color: '#ffd23f', wave: 1, t });
    }
    drawFoundBanner(ctx, ft) {
      const k = Math.min(1, ft / 20);
      const sc = 3;
      const text = 'DU HITTADE KEVIN!';
      const y = Math.round(U.lerp(-40, 40, U.ease.outBack(k)));
      F.draw(ctx, text, VW / 2 + 2, y + 3, { align: 'center', scale: sc, color: K, outline: K });
      F.draw(ctx, text, VW / 2, y, { align: 'center', scale: sc, rainbow: ft * 6, wave: 1, t: ft });
    }
    drawPause(ctx) {
      ctx.fillStyle = 'rgba(11,8,32,0.62)';
      ctx.fillRect(0, 0, VW, VH);
      if (this.showControls) { ControlsPanel.draw(ctx, this.t); return; }
      Hud.panel(ctx, VW / 2 - 100, 44, 200, 164);
      F.draw(ctx, 'PAUS', VW / 2, 54, { align: 'center', color: '#ffd23f', scale: 2 });
      this.pauseMenu.draw(ctx, VW / 2, 80);
      const W = this.world;
      F.draw(ctx, 'MYNT ' + W.stats.coins + '   DIAMANTER ' + W.stats.gems.filter(Boolean).length + '/' + W.gemTotal, VW / 2, 222, { align: 'center', color: '#c7d2ff' });
    }
    drawResults(ctx) {
      const W = this.world;
      const t = this.resultsT;
      const st = W.stats;
      ctx.fillStyle = 'rgba(11,8,32,' + Math.min(0.55, t / 40).toFixed(2) + ')';
      ctx.fillRect(0, 0, VW, VH);
      const k = Math.min(1, t / 18);
      const y = Math.round(U.lerp(VH, 30, U.ease.outBack(k)));
      Hud.panel(ctx, VW / 2 - 120, y, 240, 206);
      F.draw(ctx, 'KEVIN HITTAD!', VW / 2, y + 10, { align: 'center', scale: 2, rainbow: G.t * 5, wave: 1, t: G.t });
      const rows = [
        ['TID', U.fmtTime(st.time) + (this.newBest ? '  REKORD!' : '')],
        ['MYNT', st.coins + ''],
        ['DIAMANTER', st.gems.filter(Boolean).length + ' / ' + W.gemTotal],
        ['FIENDER', st.enemies + ''],
        ['HEMLIGHETER', st.secrets + ''],
        ['PAPP-KEVINS', st.decoys + ''],
      ];
      rows.forEach((r, i) => {
        if (t < 20 + i * 8) return;
        const yy = y + 36 + i * 13;
        F.draw(ctx, r[0], VW / 2 - 96, yy, { color: '#c7d2ff' });
        F.draw(ctx, r[1], VW / 2 + 96, yy, { align: 'right', color: i === 0 && this.newBest ? '#ffd23f' : '#ffffff' });
        if (t === 20 + i * 8) HK.Audio.sfx('select');
      });
      // stjärnor
      const reasons = ['HITTADE KEVIN', 'ALLA DIAMANTER', 'UNDER ' + U.fmtTime((this.def.par || 180) * 60)];
      const got = [true, this.allGems, this.underPar];
      for (let i = 0; i < 3; i++) {
        const appear = 80 + i * 16;
        if (t < appear) continue;
        const sx = VW / 2 - 60 + i * 60, sy = y + 128;
        const pop = t - appear < 8 ? 1 + (8 - (t - appear)) * 0.12 : 1;
        F.draw(ctx, '★', sx, sy - Math.round((pop - 1) * 6), { align: 'center', scale: 3 * pop, color: got[i] ? '#ffd23f' : '#3b3f5c' });
        F.draw(ctx, reasons[i], sx, sy + 30, { align: 'center', color: got[i] ? '#ffffff' : '#6b7699' });
        if (t === appear && got[i]) { HK.Audio.sfx('gem'); }
      }
      if (t > 60 && Math.floor(t / 25) % 2 === 0) F.draw(ctx, I.touch.enabled ? 'TRYCK FÖR ATT FORTSÄTTA' : 'SPACE = FORTSÄTT', VW / 2, y + 190, { align: 'center', color: '#ffd23f' });
    }
  }

  // =====================================================================
  // SLUT
  // =====================================================================
  const CREDITS = [
    ['HITTA KEVIN', '#ffd23f'],
    ['', ''],
    ['EN IDÉ AV', '#6ff6ff'],
    ['KEVIN', '#ffffff'],
    ['', ''],
    ['KOD, PIXELKONST OCH CHIPTUNE', '#6ff6ff'],
    ['CLAUDE', '#ffffff'],
    ['', ''],
    ['STJÄRNAN I SPELET', '#6ff6ff'],
    ['KEVIN (SJÄLVKLART)', '#ffffff'],
    ['', ''],
    ['PAPP-KEVINS', '#6ff6ff'],
    ['INGA PAPPFIGURER SKADADES', '#ffffff'],
    ['', ''],
    ['TACK FÖR ATT DU SPELADE!', '#ff4fa3'],
  ];

  class EndingScene {
    constructor(stats) {
      this.t = 0;
      this.stats = stats;
    }
    enter() {
      HK.Audio.playMusic('disco', true);
      FX.clear();
    }
    update() {
      this.t++;
      FX.update();
      if (this.t % 12 === 0) FX.confetti(U.rand(0, VW), -4, 10, { angle: Math.PI / 2, up: 0, min: 0.5, max: 2 });
      if (this.t > 240 && (I.hit('confirm') || I.click() || I.hit('back'))) {
        G.transition(() => G.setScene(new TitleScene()), { type: 'fade' });
      }
    }
    render(ctx) {
      const t = this.t;
      // discogolv
      ctx.fillStyle = '#12081f';
      ctx.fillRect(0, 0, VW, VH);
      for (let i = 0; i < 8; i++) {
        const a = t * 0.02 + i * 0.8;
        ctx.fillStyle = U.hsl(i * 45 + t * 2, 90, 60);
        ctx.globalAlpha = 0.12;
        ctx.beginPath();
        ctx.moveTo(VW / 2, 20);
        ctx.lineTo(VW / 2 + Math.cos(a) * 400, 20 + Math.abs(Math.sin(a)) * 400);
        ctx.lineTo(VW / 2 + Math.cos(a + 0.15) * 400, 20 + Math.abs(Math.sin(a + 0.15)) * 400);
        ctx.fill();
        ctx.globalAlpha = 1;
      }
      for (let x = 0; x < VW; x += 20) {
        for (let y = 200; y < VH; y += 12) {
          ctx.fillStyle = U.hsl(((x + y) * 3 + t * 4) % 360, 80, (x / 20 + y / 12 + Math.floor(t / 15)) % 2 ? 45 : 25);
          ctx.fillRect(x, y, 19, 11);
        }
      }
      S.draw(ctx, 'disco', Math.floor(t / 6), VW / 2, 34, { sx: 2, sy: 2 });
      ctx.fillStyle = '#9aa7c2';
      ctx.fillRect(VW / 2, 0, 1, 6);
      S.draw(ctx, 'kevin_dance', Math.floor(t / 8), VW / 2 + 40, 200, { sx: 2, sy: 2 });
      S.draw(ctx, t % 40 < 20 ? 'hero_win' : 'hero_jump', 0, VW / 2 - 40, 200 - Math.round(Math.abs(Math.sin(t * 0.1)) * 8), { sx: 2, sy: 2 });
      FX.draw(ctx, null, false);
      if (t < 240) {
        F.draw(ctx, 'GRATTIS!', VW / 2, 70, { align: 'center', scale: 3, rainbow: t * 5, wave: 1, t });
        F.draw(ctx, 'DU HITTADE KEVIN I HELA PIXELRIKET!', VW / 2, 104, { align: 'center', color: '#ffffff' });
        F.draw(ctx, 'OCH DET VISADE SIG... ATT HAN PLANERADE EN FEST FÖR DIG!', VW / 2, 118, { align: 'center', color: '#c7d2ff' });
      } else {
        const off = ((t - 240) * 0.4) % (CREDITS.length * 14 + 110);
        CREDITS.forEach((c, i) => {
          const y = Math.round(146 + i * 14 - off);
          if (y < 76 || y > 146) return;
          const a = Math.min(1, (y - 76) / 16, (146 - y) / 12);
          F.draw(ctx, c[0], VW / 2, y, { align: 'center', color: c[1] || '#ffffff', alpha: a });
        });
        const tot = HK.Save.totals();
        F.draw(ctx, 'DIAMANTER ' + tot.gems + '/' + tot.maxGems + '   STJÄRNOR ' + tot.stars + '/' + tot.count * 3, VW / 2, 60, { align: 'center', color: '#ffd23f' });
        if (Math.floor(t / 30) % 2 === 0) F.draw(ctx, 'TRYCK FÖR ATT GÅ TILL TITELSKÄRMEN', VW / 2, VH - 12, { align: 'center', color: '#ffffff' });
      }
    }
  }

  HK.Scenes = { TitleScene, StoryScene, MapScene, PlayScene, EndingScene, Menu };
})((window.HK = window.HK || {}));
