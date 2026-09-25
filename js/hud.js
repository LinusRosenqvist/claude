/* Hitta Kevin — HUD, pratbubblor, paneler och kikarvy. */
(function (HK) {
  'use strict';
  const U = HK.U;
  const S = HK.Sprites;
  const F = HK.Font;
  const I = HK.Input;
  const VW = U.VIEW_W, VH = U.VIEW_H;
  const K = '#1a1c2c';

  let binoMask = null;
  function getBinoMask() {
    if (binoMask) return binoMask;
    binoMask = U.makeCanvas(VW, VH);
    const c = binoMask.getContext('2d');
    c.fillStyle = '#05040f';
    c.fillRect(0, 0, VW, VH);
    c.globalCompositeOperation = 'destination-out';
    const r = 118;
    for (const cx of [VW / 2 - 78, VW / 2 + 78]) {
      c.fillStyle = '#000';
      c.beginPath();
      c.arc(cx, VH / 2, r, 0, Math.PI * 2);
      c.fill();
    }
    c.globalCompositeOperation = 'source-over';
    // kant
    c.strokeStyle = 'rgba(255,255,255,0.10)';
    return binoMask;
  }

  const Hud = {
    panel(ctx, x, y, w, h, o) {
      o = o || {};
      x = Math.round(x); y = Math.round(y); w = Math.round(w); h = Math.round(h);
      const fill = o.fill || 'rgba(22,16,48,0.92)';
      const edge = o.edge || '#6b5ad6';
      ctx.fillStyle = K;
      ctx.fillRect(x + 1, y - 1, w - 2, h + 2);
      ctx.fillRect(x - 1, y + 1, w + 2, h - 2);
      ctx.fillRect(x, y, w, h);
      ctx.fillStyle = edge;
      ctx.fillRect(x + 1, y, w - 2, 1);
      ctx.fillRect(x + 1, y + h - 1, w - 2, 1);
      ctx.fillRect(x, y + 1, 1, h - 2);
      ctx.fillRect(x + w - 1, y + 1, 1, h - 2);
      ctx.fillStyle = fill;
      ctx.fillRect(x + 1, y + 1, w - 2, h - 2);
      if (o.shine !== false) {
        ctx.fillStyle = 'rgba(255,255,255,0.07)';
        ctx.fillRect(x + 2, y + 2, w - 4, 1);
      }
    },

    bubble(ctx, text, x, y, alpha, chars) {
      if (alpha <= 0) return;
      const shown = chars == null ? text : text.slice(0, chars);
      const lines = F.wrap(text, 150);
      const shownLines = F.wrap(shown, 150);
      let w = 0;
      for (const l of lines) w = Math.max(w, F.measure(l).w);
      const h = lines.length * F.lineHeight - 4 + 10;
      w += 12;
      let bx = Math.round(x - w / 2);
      bx = U.clamp(bx, 4, VW - w - 4);
      let by = Math.round(y - h - 6);
      if (by < 24) by = 24;
      const pa = ctx.globalAlpha;
      ctx.globalAlpha = pa * alpha;
      ctx.fillStyle = K;
      ctx.fillRect(bx + 1, by - 1, w - 2, h + 2);
      ctx.fillRect(bx - 1, by + 1, w + 2, h - 2);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(bx, by + 1, w, h - 2);
      ctx.fillRect(bx + 1, by, w - 2, h);
      // pil
      const ax = U.clamp(Math.round(x), bx + 6, bx + w - 6);
      if (y - 6 > by + h) {
        ctx.fillStyle = K;
        ctx.fillRect(ax - 4, by + h, 9, 1);
        ctx.fillRect(ax - 3, by + h + 1, 7, 1);
        ctx.fillRect(ax - 2, by + h + 2, 5, 1);
        ctx.fillRect(ax - 1, by + h + 3, 3, 1);
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(ax - 3, by + h - 1, 7, 1);
        ctx.fillRect(ax - 2, by + h, 5, 1);
        ctx.fillRect(ax - 1, by + h + 1, 3, 1);
        ctx.fillRect(ax, by + h + 2, 1, 1);
      }
      shownLines.forEach((l, i) => F.draw(ctx, l, bx + 6, by + 5 + i * F.lineHeight, { color: K, outline: null }));
      ctx.globalAlpha = pa;
    },

    hearts(ctx, x, y, hp, max, t) {
      for (let i = 0; i < max; i++) {
        const full = i < hp;
        const beat = full && hp === 1 && Math.floor(t / 12) % 2 === 0;
        S.draw(ctx, full ? 'hjarta' : 'hjarta_tom', beat ? 1 : 0, x + i * 14 + 6, y + 12);
      }
    },

    draw(ctx, W) {
      const p = W.player;
      const t = W.t;
      // --- kikare ---
      if (W.binoK > 0) {
        ctx.globalAlpha = Math.min(1, W.binoK) * 0.92;
        ctx.drawImage(getBinoMask(), 0, 0);
        ctx.globalAlpha = 1;
        if (W.binoK > 0.6) {
          ctx.fillStyle = 'rgba(111,246,255,0.35)';
          ctx.fillRect(VW / 2 - 12, VH / 2, 25, 1);
          ctx.fillRect(VW / 2, VH / 2 - 12, 1, 25);
          F.draw(ctx, 'KIKARE', VW / 2, VH - 30, { align: 'center', color: '#6ff6ff' });
          F.draw(ctx, I.touch.enabled ? 'DRA FINGRET FÖR ATT SPANA' : 'FLYTTA MUSEN ELLER WASD FÖR ATT SPANA', VW / 2, VH - 18, { align: 'center', color: '#c7d2ff' });
        }
      }

      // --- övre rad ---
      Hud.hearts(ctx, 4, 3, p.hp, p.maxHp, t);
      let x = 8 + p.maxHp * 14 + 6;
      S.draw(ctx, 'mynt', Math.floor(t / 8), x + 6, 17);
      F.draw(ctx, '×' + U.pad(W.stats.coins, 2), x + 14, 8, { color: '#fff3a0', mono: true });
      x += 44;
      // tid & nivånamn
      F.draw(ctx, W.hudTitle || W.def.id + ' ' + W.def.name, VW / 2, 5, { align: 'center', color: '#ffffff' });
      if (W.hudTimer != null) {
        const low = W.hudTimer < 15 * 60;
        const blink = low && Math.floor(W.t / 15) % 2 === 0;
        F.draw(ctx, U.fmtTime(W.hudTimer), VW / 2, 15, { align: 'center', color: blink ? '#ff3860' : low ? '#ff9f1c' : '#7dff6b', mono: true, scale: low ? 1 : 1 });
      } else F.draw(ctx, U.fmtTime(W.stats.time), VW / 2, 15, { align: 'center', color: '#c7d2ff', mono: true });
      // diamanter
      for (let i = 0; i < W.gemTotal; i++) {
        const got = W.stats.gems[i];
        const gx = VW - 12 - (W.gemTotal - 1 - i) * 14;
        if (got) S.draw(ctx, HK.Ent.Gem.NAMES[i % 3], 0, gx, 18);
        else S.draw(ctx, HK.Ent.Gem.NAMES[i % 3], 0, gx, 18, { alpha: 0.25 });
      }
      // Kevin-radar
      Hud.radar(ctx, VW - 100, 24, W);

      // --- jetpack-bränsle ---
      if (p.jetpack) {
        // på mobil ligger knapparna i nedre hörnen, så mätaren flyttas upp
        const bx = 6, by = I.touch.enabled ? 22 : VH - 16;
        S.draw(ctx, 'jetpack', 0, bx + 8, by + 14, { sx: 0.8, sy: 0.8 });
        ctx.fillStyle = K;
        ctx.fillRect(bx + 17, by + 3, 54, 8);
        const fw = Math.round((p.fuel / 100) * 50);
        ctx.fillStyle = p.fuel < 25 ? (t % 20 < 10 ? '#ff4d6d' : '#ff9f1c') : '#7dff6b';
        ctx.fillRect(bx + 19, by + 5, fw, 4);
        ctx.fillStyle = 'rgba(255,255,255,0.5)';
        ctx.fillRect(bx + 19, by + 5, fw, 1);
      }

      // --- krafttimers ---
      const pw = [];
      if (p.shield) pw.push(['skold', 1]);
      if (p.triple > 0) pw.push(['trippel', p.triple / 1200]);
      if (p.magnet > 0) pw.push(['magnet', p.magnet / 900]);
      if (p.disco > 0) pw.push(['disco', p.disco / 600]);
      pw.forEach((it, i) => {
        const bx = VW - 22 - i * 22, by = I.touch.enabled ? 48 : VH - 22;
        S.draw(ctx, it[0], Math.floor(t / 8), bx + 7, by + 15);
        ctx.fillStyle = K;
        ctx.fillRect(bx, by + 17, 16, 3);
        ctx.fillStyle = '#ffd23f';
        ctx.fillRect(bx + 1, by + 18, Math.round(14 * it[1]), 1);
      });

      // --- boss ---
      const b = W.boss;
      if (b && W.arenaLocked && !b.dead && b.state !== 'sleep') {
        const bw = 180, bx = VW / 2 - bw / 2, by = 30;
        F.draw(ctx, b.name, VW / 2, by - 2, { align: 'center', color: '#ff3860' });
        ctx.fillStyle = K;
        ctx.fillRect(bx - 1, by + 8, bw + 2, 7);
        ctx.fillStyle = '#3b1a2a';
        ctx.fillRect(bx, by + 9, bw, 5);
        ctx.fillStyle = b.phase === 3 ? (t % 16 < 8 ? '#ff3860' : '#ff9f1c') : '#ff3860';
        ctx.fillRect(bx, by + 9, Math.round((bw * Math.max(0, b.hp)) / b.maxHp), 5);
        ctx.fillStyle = 'rgba(255,255,255,0.4)';
        ctx.fillRect(bx, by + 9, Math.round((bw * Math.max(0, b.hp)) / b.maxHp), 1);
      }

      // --- pil mot Kevin ---
      const k = W.kevin;
      if (k.seen && k.state === 'hide' && !W.cam.visible(k.x, k.y, k.w, k.h, -4)) {
        const cx = VW / 2, cy = VH / 2;
        const dx = k.cx - (W.cam.x + cx), dy = k.cy - (W.cam.y + cy);
        const s = Math.min((VW / 2 - 18) / Math.abs(dx || 1), (VH / 2 - 26) / Math.abs(dy || 1));
        const ax = cx + dx * s, ay = cy + dy * s + 6;
        const a = Math.atan2(dy, dx);
        const bob = Math.sin(t * 0.15) * 2;
        const hx = ax - Math.cos(a) * (10 + bob), hy = ay - Math.sin(a) * (10 + bob);
        S.draw(ctx, 'kevin_head', 0, Math.round(hx), Math.round(hy + 7));
        ctx.fillStyle = '#ffd23f';
        for (let i = 0; i < 6; i++) {
          const r = 6 - i;
          const px = ax + Math.cos(a) * (i - 2), py = ay + Math.sin(a) * (i - 2);
          ctx.fillRect(Math.round(px - Math.sin(a) * r * 0.5), Math.round(py + Math.cos(a) * r * 0.5), 2, 2);
          ctx.fillRect(Math.round(px + Math.sin(a) * r * 0.5), Math.round(py - Math.cos(a) * r * 0.5), 2, 2);
        }
      }

      // --- sikte ---
      if (I.lastDevice === 'mouse' && I.mouse.inside && W.state === 'play' && !p.binoc) {
        let over = false;
        const mx = W.cam.x + I.mouse.x, my = W.cam.y + I.mouse.y;
        for (const e of W.enemies) if (e.active && !e.dying && e.shootable && mx > e.x - 2 && mx < e.x + e.w + 2 && my > e.y - 2 && my < e.y + e.h + 2) { over = true; break; }
        S.draw(ctx, 'sikte', over ? 1 : 0, Math.round(I.mouse.x), Math.round(I.mouse.y), { ay: 0.5 });
      }
    },

    radar(ctx, x, y, W) {
      const heat = W.heat;
      const k = W.kevin;
      Hud.panel(ctx, x, y, 96, 22, { fill: 'rgba(22,16,48,0.8)', edge: '#4d3fa6' });
      S.draw(ctx, 'kevin_head', 0, x + 10, y + 18);
      const n = 6;
      const lvl = Math.ceil(heat * n - 0.001);
      const cols = ['#4d7cff', '#4dc3ff', '#7dff6b', '#ffd23f', '#ff9f1c', '#ff3860'];
      for (let i = 0; i < n; i++) {
        const bh = 3 + i;
        ctx.fillStyle = i < lvl ? cols[i] : '#2a2450';
        ctx.fillRect(x + 20 + i * 4, y + 15 - bh, 3, bh);
      }
      let label, col;
      if (k.state !== 'hide') { label = 'HITTAD!'; col = '#7dff6b'; }
      else if (heat > 0.9) { label = 'HETT!'; col = W.t % 16 < 8 ? '#ff3860' : '#ffd23f'; }
      else if (heat > 0.72) { label = 'VARMT'; col = '#ff9f1c'; }
      else if (heat > 0.45) { label = 'LJUMMET'; col = '#ffd23f'; }
      else { label = 'KALLT'; col = '#4dc3ff'; }
      F.draw(ctx, label, x + 46, y + 8, { color: col });
    },
  };

  HK.Hud = Hud;
})((window.HK = window.HK || {}));
