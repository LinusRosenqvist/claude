/* Hitta Kevin — världarnas färger, bakgrunder och stämning. */
(function (HK) {
  'use strict';
  const U = HK.U;
  const W = U.VIEW_W, H = U.VIEW_H;
  const K = '#1a1c2c';

  // ---------- Hjälpfunktioner för bakgrunder ----------
  function bands(ctx, x, y, w, h, colors) {
    const n = colors.length;
    const bh = h / n;
    for (let i = 0; i < n; i++) {
      const y0 = Math.round(y + i * bh), y1 = Math.round(y + (i + 1) * bh);
      ctx.fillStyle = colors[i];
      ctx.fillRect(x, y0, w, y1 - y0);
      if (i < n - 1) {
        // rutig dithering mellan banden
        ctx.fillStyle = colors[i + 1];
        for (let yy = y1 - 2; yy < y1; yy++)
          for (let xx = x + ((yy & 1) ? 1 : 0); xx < x + w; xx += 2) ctx.fillRect(xx, yy, 1, 1);
        ctx.fillStyle = colors[i];
        for (let xx = x + ((y1 & 1) ? 0 : 1); xx < x + w; xx += 2) ctx.fillRect(xx, y1, 1, 1);
      }
    }
  }

  function disc(ctx, cx, cy, r, c) {
    ctx.fillStyle = c;
    for (let y = -Math.ceil(r); y <= Math.ceil(r); y++) {
      const hw = Math.floor(Math.sqrt(Math.max(0, r * r - y * y)));
      ctx.fillRect(Math.round(cx - hw), Math.round(cy + y), hw * 2 + 1, 1);
    }
  }

  function cloud(ctx, x, y, s, fill, shade, outline) {
    const puffs = [[0, 0, 1], [0.9, -0.5, 1.2], [1.9, -0.2, 1.0], [2.7, 0.2, 0.8], [-0.8, 0.3, 0.75]];
    if (outline) for (const p of puffs) disc(ctx, x + p[0] * s, y + p[1] * s, p[2] * s + 1, outline);
    for (const p of puffs) disc(ctx, x + p[0] * s, y + p[1] * s, p[2] * s, shade);
    for (const p of puffs) disc(ctx, x + p[0] * s, y + p[1] * s - 1.5, p[2] * s - 1, fill);
    ctx.fillStyle = shade;
    ctx.fillRect(Math.round(x - 0.8 * s), Math.round(y + 0.55 * s), Math.round(3.6 * s), 2);
  }

  // sinusform som går jämnt ut i bredden w (för sömlös upprepning)
  function wave(w, parts, seed) {
    const r = U.rng(seed);
    const comps = parts.map((p) => ({ amp: p[0], k: p[1], ph: r() * Math.PI * 2 }));
    return (x) => {
      let v = 0;
      for (const c of comps) v += c.amp * Math.sin((x / w) * Math.PI * 2 * c.k + c.ph);
      return v;
    };
  }

  function hills(w, h, o) {
    const c = U.makeCanvas(w, h);
    const ctx = c.getContext('2d');
    const f = wave(w, o.waves, o.seed || 1);
    for (let x = 0; x < w; x++) {
      const top = Math.round(o.base + f(x));
      ctx.fillStyle = o.color;
      ctx.fillRect(x, top, 1, h - top);
      if (o.light) {
        ctx.fillStyle = o.light;
        ctx.fillRect(x, top, 1, 2);
        if (x % 2 === 0) ctx.fillRect(x, top + 2, 1, 1);
      }
      if (o.outline) {
        ctx.fillStyle = o.outline;
        ctx.fillRect(x, top - 1, 1, 1);
      }
      if (o.dark) {
        ctx.fillStyle = o.dark;
        const d = top + (o.darkOff || 18);
        for (let y = d; y < h; y++) if ((x + y) % 2 === 0 || y > d + 3) ctx.fillRect(x, y, 1, 1);
      }
    }
    if (o.after) o.after(ctx, f);
    return c;
  }

  function lollipopTree(ctx, x, y, s, c1, c2, trunk) {
    ctx.fillStyle = trunk;
    ctx.fillRect(x - 1, y - s, 2, s);
    disc(ctx, x, y - s - s * 0.6, s * 0.8 + 1, K);
    disc(ctx, x, y - s - s * 0.6, s * 0.8, c2);
    disc(ctx, x - 1, y - s - s * 0.6 - 1, s * 0.62, c1);
  }

  function stars(ctx, w, h, n, seed, cols) {
    const r = U.rng(seed);
    for (let i = 0; i < n; i++) {
      ctx.fillStyle = cols[Math.floor(r() * cols.length)];
      const x = Math.floor(r() * w), y = Math.floor(r() * h);
      ctx.fillRect(x, y, 1, 1);
      if (r() < 0.08) {
        ctx.fillRect(x - 1, y, 3, 1);
        ctx.fillRect(x, y - 1, 1, 3);
      }
    }
  }

  // ---------- Bakgrundsbyggare per värld ----------
  const BG = {};

  BG.kullar = function (th) {
    const sky = U.makeCanvas(W, H);
    const s = sky.getContext('2d');
    bands(s, 0, 0, W, H, th.sky);
    // sol
    disc(s, 392, 52, 30, '#fff7c2');
    disc(s, 392, 52, 24, '#ffe66b');
    disc(s, 388, 48, 16, '#fff3a0');
    const layers = [];
    // moln långt bort
    const cl = U.makeCanvas(960, 150);
    const cc = cl.getContext('2d');
    const r = U.rng(7);
    for (let i = 0; i < 9; i++) cloud(cc, 30 + i * 105 + r() * 40, 30 + r() * 80, 6 + r() * 6, '#ffffff', '#d6ecff');
    layers.push({ img: cl, fx: 0.08, fy: 0.03, y: 0, drift: 0.06, top: true });
    layers.push({
      img: hills(960, 170, {
        base: 70, waves: [[18, 2], [10, 5], [5, 11]], color: '#7fd0c0', light: '#b6f0e0', dark: '#6cbfae', darkOff: 30, seed: 3,
        after(ctx, f) {
          const rr = U.rng(11);
          for (let i = 0; i < 40; i++) {
            const x = Math.floor(rr() * 960);
            const y = Math.round(70 + f(x)) + 2;
            ctx.fillStyle = '#5eb3a0';
            ctx.fillRect(x, y - 3, 3, 3);
          }
        },
      }),
      fx: 0.18, fy: 0.08,
    });
    layers.push({
      img: hills(960, 130, {
        base: 50, waves: [[14, 3], [8, 7], [3, 17]], color: '#4fc46b', light: '#9ff08a', outline: '#2f8f4e', dark: '#43b05f', darkOff: 22, seed: 9,
        after(ctx, f) {
          const rr = U.rng(21);
          for (let i = 0; i < 14; i++) {
            const x = Math.floor(rr() * 940) + 10;
            const y = Math.round(50 + f(x)) + 4;
            lollipopTree(ctx, x, y, 6 + Math.floor(rr() * 5), '#7ee06a', '#3aa55a', '#8a5a32');
          }
        },
      }),
      fx: 0.35, fy: 0.15,
    });
    return { sky, layers };
  };

  BG.stad = function (th) {
    const sky = U.makeCanvas(W, H);
    const s = sky.getContext('2d');
    bands(s, 0, 0, W, H, th.sky);
    stars(s, W, 120, 90, 5, ['#ffffff', '#ffd6f0', '#9ff3ff']);
    // synthwave-sol med ränder
    const sx = 300, sy = 150, sr = 48;
    for (let y = -sr; y <= sr; y++) {
      const t = (y + sr) / (sr * 2);
      if (y > 0 && Math.floor(y / 3) % 2 === 1 && y / sr > 0.1 * (y / 6)) continue;
      const hw = Math.floor(Math.sqrt(sr * sr - y * y));
      s.fillStyle = U.mix('#ffe66b', '#ff3d8b', t);
      s.fillRect(sx - hw, sy + y, hw * 2 + 1, 1);
    }
    const layers = [];
    const mk = (w, h, seed, o) => {
      const c = U.makeCanvas(w, h);
      const ctx = c.getContext('2d');
      const r = U.rng(seed);
      let x = 0;
      while (x < w) {
        const bw = Math.floor(o.minW + r() * (o.maxW - o.minW));
        const bh = Math.floor(o.minH + r() * (o.maxH - o.minH));
        const bx = x, by = h - bh;
        const ww = Math.min(bw, w - bx);
        ctx.fillStyle = o.color;
        ctx.fillRect(bx, by, ww, bh);
        if (r() < 0.4) {
          ctx.fillRect(bx + Math.floor(ww / 2), by - 8, 1, 8);
          ctx.fillStyle = r() < 0.5 ? '#ff3860' : '#ffd23f';
          ctx.fillRect(bx + Math.floor(ww / 2), by - 9, 1, 1);
        }
        // fönster
        for (let yy = by + 4; yy < h - 3; yy += o.win) {
          for (let xx = bx + 3; xx < bx + ww - 3; xx += o.win) {
            if (r() < o.lit) {
              ctx.fillStyle = r() < 0.7 ? o.winA : o.winB;
              ctx.fillRect(xx, yy, o.winS, o.winS);
            }
          }
        }
        if (o.neon && r() < 0.5) {
          const nc = r() < 0.5 ? '#2ef2ff' : '#ff4fa3';
          ctx.fillStyle = nc;
          ctx.fillRect(bx, by, ww, 1);
          if (r() < 0.6) {
            const sw = Math.min(ww - 6, 18 + Math.floor(r() * 12));
            const syy = by + 8 + Math.floor(r() * 20);
            if (sw > 8) {
              ctx.fillRect(bx + 3, syy, sw, 1);
              ctx.fillRect(bx + 3, syy + 7, sw, 1);
              ctx.fillRect(bx + 3, syy, 1, 8);
              ctx.fillRect(bx + 2 + sw, syy, 1, 8);
              ctx.fillStyle = r() < 0.5 ? '#ffd23f' : '#ffffff';
              for (let k = 0; k < sw - 4; k += 3) ctx.fillRect(bx + 5 + k, syy + 3, 2, 2);
            }
          }
        }
        x += bw + Math.floor(r() * o.gap);
      }
      return c;
    };
    layers.push({ img: mk(960, 170, 3, { minW: 22, maxW: 50, minH: 50, maxH: 140, color: '#2a1545', win: 5, winS: 1, lit: 0.35, winA: '#ffd23f', winB: '#2ef2ff', gap: 4 }), fx: 0.15, fy: 0.06 });
    layers.push({ img: mk(960, 210, 8, { minW: 34, maxW: 70, minH: 70, maxH: 190, color: '#170b2b', win: 6, winS: 2, lit: 0.25, winA: '#ff9f1c', winB: '#b55cff', gap: 10, neon: true }), fx: 0.33, fy: 0.12 });
    return { sky, layers };
  };

  BG.grotta = function (th) {
    const sky = U.makeCanvas(W, H);
    const s = sky.getContext('2d');
    bands(s, 0, 0, W, H, th.sky);
    const layers = [];
    const far = U.makeCanvas(960, H);
    const f = far.getContext('2d');
    const top = wave(960, [[16, 3], [9, 8], [4, 19]], 4);
    const bot = wave(960, [[20, 2], [8, 9], [4, 23]], 6);
    const r = U.rng(17);
    for (let x = 0; x < 960; x++) {
      const t = Math.round(40 + top(x));
      const b = Math.round(200 + bot(x));
      f.fillStyle = '#161a3f';
      f.fillRect(x, 0, 1, t);
      f.fillRect(x, b, 1, H - b);
      f.fillStyle = '#232a5c';
      f.fillRect(x, t - 1, 1, 1);
      f.fillRect(x, b, 1, 1);
    }
    for (let i = 0; i < 26; i++) {
      const x = Math.floor(r() * 950) + 5;
      const up = r() < 0.5;
      const col = r() < 0.5 ? '#7af5ff' : '#ff7ad9';
      const y = up ? Math.round(200 + bot(x)) : Math.round(40 + top(x));
      const hgt = 4 + Math.floor(r() * 8);
      f.fillStyle = U.mix(col, '#161a3f', 0.35);
      for (let k = 0; k < hgt; k++) {
        const hw = Math.max(0, Math.floor((hgt - k) / 3));
        f.fillRect(x - hw, up ? y - k : y + k, hw * 2 + 1, 1);
      }
    }
    layers.push({ img: far, fx: 0.15, fy: 0.1, full: true });
    const near = U.makeCanvas(960, H);
    const n = near.getContext('2d');
    const r2 = U.rng(29);
    for (let i = 0; i < 22; i++) {
      const x = Math.floor(r2() * 940) + 10;
      const len = 20 + Math.floor(r2() * 50);
      const wdt = 4 + Math.floor(r2() * 6);
      n.fillStyle = '#0b0d24';
      for (let k = 0; k < len; k++) {
        const hw = Math.max(0, Math.round(wdt * (1 - k / len)));
        n.fillRect(x - hw, k, hw * 2 + 1, 1);
      }
      const x2 = Math.floor(r2() * 940) + 10;
      const len2 = 16 + Math.floor(r2() * 40);
      for (let k = 0; k < len2; k++) {
        const hw = Math.max(0, Math.round(wdt * (1 - k / len2)));
        n.fillRect(x2 - hw, H - k, hw * 2 + 1, 1);
      }
    }
    layers.push({ img: near, fx: 0.32, fy: 0.16, full: true });
    return { sky, layers };
  };

  BG.moln = function (th) {
    const sky = U.makeCanvas(W, H);
    const s = sky.getContext('2d');
    bands(s, 0, 0, W, H, th.sky);
    disc(s, 110, 70, 36, '#fff6e0');
    disc(s, 110, 70, 28, '#ffffff');
    const layers = [];
    const far = U.makeCanvas(960, 160);
    const f = far.getContext('2d');
    const r = U.rng(41);
    for (let i = 0; i < 16; i++) cloud(f, i * 62 + r() * 30, 90 + r() * 50, 10 + r() * 8, '#ffffff', '#f3e3ff');
    f.fillStyle = '#f3e3ff';
    f.fillRect(0, 140, 960, 20);
    layers.push({ img: far, fx: 0.07, fy: 0.05, drift: 0.04 });
    // svävande öar
    const isl = U.makeCanvas(960, 200);
    const ic = isl.getContext('2d');
    const r2 = U.rng(55);
    for (let i = 0; i < 5; i++) {
      const x = 60 + i * 190 + Math.floor(r2() * 60);
      const y = 40 + Math.floor(r2() * 90);
      const w = 26 + Math.floor(r2() * 30);
      for (let k = 0; k < 18; k++) {
        const hw = Math.round(w * (1 - k / 18) * 0.5);
        ic.fillStyle = k < 3 ? '#8fe08a' : U.mix('#b98a6a', '#8a6a9a', k / 18);
        ic.fillRect(x - hw, y + k, hw * 2, 1);
      }
      ic.fillStyle = '#5fc46b';
      ic.fillRect(x - w / 2, y, w, 1);
      if (r2() < 0.7) {
        ic.fillStyle = '#bff0ff';
        const wx = x + Math.floor((r2() - 0.5) * w * 0.6);
        for (let k = 0; k < 60; k++) if (k % 3 !== 0) ic.fillRect(wx, y + 4 + k, 2, 1);
      }
      lollipopTree(ic, x - 4, y, 4, '#9ff08a', '#4fc46b', '#8a5a32');
    }
    layers.push({ img: isl, fx: 0.18, fy: 0.08 });
    const near = U.makeCanvas(960, 110);
    const nc = near.getContext('2d');
    const r3 = U.rng(61);
    for (let i = 0; i < 12; i++) cloud(nc, i * 82 + r3() * 20, 60 + r3() * 30, 14 + r3() * 8, '#ffffff', '#e6e0ff', '#d0c6f5');
    nc.fillStyle = '#e6e0ff';
    nc.fillRect(0, 90, 960, 20);
    layers.push({ img: near, fx: 0.4, fy: 0.2, drift: 0.12 });
    return { sky, layers };
  };

  BG.lava = function (th) {
    const sky = U.makeCanvas(W, H);
    const s = sky.getContext('2d');
    bands(s, 0, 0, W, H, th.sky);
    stars(s, W, 90, 30, 9, ['#ff9f1c', '#ffd23f']);
    const layers = [];
    const volc = U.makeCanvas(960, 170);
    const v = volc.getContext('2d');
    const r = U.rng(71);
    for (let i = 0; i < 4; i++) {
      const cx = 80 + i * 240 + Math.floor(r() * 60);
      const hgt = 90 + Math.floor(r() * 60);
      for (let k = 0; k < hgt; k++) {
        const hw = Math.round(12 + k * 1.1);
        v.fillStyle = '#3a0d14';
        v.fillRect(cx - hw, 170 - hgt + k, hw * 2, 1);
      }
      // lavaflöden
      v.fillStyle = '#ff5a2a';
      for (let k = 0; k < hgt; k += 1) {
        const off = Math.round(Math.sin(k * 0.15) * 3);
        if (k % 4 !== 3) v.fillRect(cx + off - 1 + Math.round(k * 0.3), 170 - hgt + k, 2, 1);
      }
      v.fillStyle = '#ffb627';
      v.fillRect(cx - 10, 170 - hgt, 20, 2);
    }
    layers.push({ img: volc, fx: 0.1, fy: 0.05 });
    const castle = U.makeCanvas(960, 200);
    const c = castle.getContext('2d');
    const r2 = U.rng(83);
    let x = 0;
    while (x < 960) {
      const w = 30 + Math.floor(r2() * 50);
      const hgt = 60 + Math.floor(r2() * 110);
      const ww = Math.min(w, 960 - x);
      c.fillStyle = '#1f0a12';
      c.fillRect(x, 200 - hgt, ww, hgt);
      for (let k = 0; k < ww; k += 6) c.fillRect(x + k, 200 - hgt - 4, 3, 4);
      c.fillStyle = '#ffb627';
      for (let yy = 200 - hgt + 10; yy < 190; yy += 18) {
        if (r2() < 0.55) c.fillRect(x + Math.floor(ww / 2) - 1, yy, 3, 5);
      }
      x += w + Math.floor(r2() * 20);
    }
    layers.push({ img: castle, fx: 0.3, fy: 0.12 });
    return { sky, layers };
  };

  BG.rymd = function (th) {
    const sky = U.makeCanvas(W, H);
    const s = sky.getContext('2d');
    bands(s, 0, 0, W, H, th.sky);
    // nebulosa
    const r = U.rng(91);
    const blob = (cx, cy, rad, col) => {
      for (let y = -rad; y <= rad; y++)
        for (let x = -rad; x <= rad; x++) {
          const d = Math.hypot(x, y * 1.6) / rad;
          if (d > 1) continue;
          const on = d < 0.5 || (d < 0.8 && (x + y) % 2 === 0) || ((x + y) % 4 === 0 && x % 2 === 0);
          if (on) {
            s.fillStyle = col;
            s.fillRect(cx + x, cy + y, 1, 1);
          }
        }
    };
    blob(120, 90, 60, '#2a1552');
    blob(150, 100, 34, '#3d1d6e');
    blob(360, 180, 70, '#10304a');
    blob(380, 170, 36, '#15476b');
    stars(s, W, H, 220, 13, ['#ffffff', '#c7d2ff', '#ffd6f0', '#9ff3ff', '#6b7699']);
    const layers = [];
    const pl = U.makeCanvas(960, H);
    const p = pl.getContext('2d');
    // ringplanet
    disc(p, 300, 80, 34, '#ff9fd0');
    disc(p, 296, 76, 28, '#ffc2e6');
    for (let x = -60; x <= 60; x++) {
      const y = Math.round(x * 0.18);
      p.fillStyle = Math.abs(x) > 34 || y > 0 ? '#ffe7a0' : 'rgba(0,0,0,0)';
      if (Math.abs(x) > 30 || x * 0.18 > -2) p.fillRect(300 + x, 84 + y, 1, 2);
    }
    disc(p, 740, 150, 16, '#9aa7c2');
    disc(p, 736, 146, 12, '#c7cbe0');
    disc(p, 732, 150, 3, '#9aa7c2');
    disc(p, 742, 142, 2, '#9aa7c2');
    layers.push({ img: pl, fx: 0.05, fy: 0.02, full: true });
    const ast = U.makeCanvas(960, H);
    const a = ast.getContext('2d');
    const r2 = U.rng(97);
    for (let i = 0; i < 18; i++) {
      const x = Math.floor(r2() * 940) + 10, y = Math.floor(r2() * 250) + 10;
      const rad = 2 + Math.floor(r2() * 6);
      disc(a, x, y, rad + 1, '#0d0b22');
      disc(a, x, y, rad, '#3b3f5c');
      disc(a, x - 1, y - 1, Math.max(1, rad - 2), '#565d80');
    }
    layers.push({ img: ast, fx: 0.25, fy: 0.1, full: true });
    return { sky, layers };
  };

  // ---------- Världsdefinitioner ----------
  const Themes = {
    kullar: {
      id: 'kullar', name: 'GRÖNA KULLARNA', music: 'kullar', seed: 1,
      sky: ['#48a8ff', '#5fb9ff', '#7ccaff', '#9ad9ff', '#b8e7ff', '#d6f3ff'],
      ground: { style: 'grass', fill: '#c77b43', fillD: '#9a5a32', fillL: '#e0a066', speck: '#7a4526', top: '#5fd65f', topL: '#b4f58a', topD: '#2f9e4f', bg: '#6b3f26', bgD: '#55301c' },
      brick: { base: '#e0763a', light: '#ffab6b', dark: '#a8491f', mortar: '#5e2a12' },
      block: { base: '#b8bdd4', light: '#eef0fa', dark: '#6b7090' },
      plank: { style: 'wood', base: '#c98a55', light: '#eab47c', dark: '#7a4a26' },
      liquid: { name: 'vatten', top: '#e0fbff', a: '#3fa9f5', b: '#2a7fd6', glow: false },
      ambient: 'petals', dark: 0, gravity: 1,
    },
    stad: {
      id: 'stad', name: 'NEONSTADEN', music: 'stad', seed: 2,
      sky: ['#0b0626', '#150a36', '#230d47', '#361255', '#4f165f', '#6e1c66', '#9a2768', '#c2386b'],
      ground: { style: 'roof', fill: '#3a3f5c', fillD: '#262a40', fillL: '#4d5478', speck: '#2b2f47', top: '#8f95b2', topL: '#c7cbe0', topD: '#565d80', neon: '#2ef2ff', bg: '#241a3a', bgD: '#1a1230' },
      brick: { base: '#b3405a', light: '#e0667f', dark: '#7a2438', mortar: '#2e0d1a' },
      block: { base: '#6b7699', light: '#9aa7c2', dark: '#3b3f5c' },
      plank: { style: 'grate', base: '#8f95b2', light: '#c7cbe0', dark: '#50557a' },
      liquid: { name: 'giftslem', top: '#e2ffd0', a: '#7dff6b', b: '#2fb34a', glow: true },
      ambient: 'rain', dark: 0, gravity: 1,
    },
    grotta: {
      id: 'grotta', name: 'KRISTALLGROTTAN', music: 'grotta', seed: 3,
      sky: ['#05060f', '#080a1c', '#0c0f29', '#101536', '#141b43'],
      ground: { style: 'rock', fill: '#3d3a6b', fillD: '#2a2750', fillL: '#57539a', speck: '#7a74d6', top: '#2ce8b4', topL: '#a4ffe4', topD: '#159e86', bg: '#1d1b3a', bgD: '#15132b' },
      brick: { base: '#5a5f8a', light: '#8a8fc0', dark: '#3a3d5c', mortar: '#1a1c2c' },
      block: { base: '#7af5ff', light: '#d6fcff', dark: '#2aa6d8', crystal: true },
      plank: { style: 'wood', base: '#8a5a32', light: '#b8834f', dark: '#5a3521' },
      liquid: { name: 'grottvatten', top: '#9ff3ff', a: '#2a5ad6', b: '#1a3a9e', glow: true },
      ambient: 'motes', dark: 0.86, gravity: 1,
    },
    moln: {
      id: 'moln', name: 'MOLNRIKET', music: 'moln', seed: 4,
      sky: ['#6ab8ff', '#86c8ff', '#a6d8ff', '#c4e4ff', '#e0e8ff', '#ffe4f2', '#ffd6ea'],
      ground: { style: 'cloud', fill: '#ffffff', fillD: '#e3dcff', fillL: '#ffffff', speck: '#f1ecff', top: '#ffffff', topL: '#ffffff', topD: '#d6ccff', bg: '#d8d0ff', bgD: '#c6bcf5' },
      brick: { base: '#ffd23f', light: '#fff3a0', dark: '#d18b0c', mortar: '#a3620a' },
      block: { base: '#f4f0ff', light: '#ffffff', dark: '#b8b0e0' },
      plank: { style: 'cloud', base: '#ffffff', light: '#ffffff', dark: '#d6ccff' },
      liquid: { name: 'regnbåge', top: '#ffffff', a: '#ff9fd0', b: '#b55cff', glow: true },
      ambient: 'sparkles', dark: 0, gravity: 1,
    },
    lava: {
      id: 'lava', name: 'LAVASLOTTET', music: 'lava', seed: 5,
      sky: ['#12030a', '#1f0610', '#2e0a14', '#420d17', '#5e1316', '#7f1f14', '#a8330f'],
      ground: { style: 'castle', fill: '#4a2c3a', fillD: '#2e1a26', fillL: '#6b4256', speck: '#ff5a2a', top: '#8a6070', topL: '#b88a9a', topD: '#5a3a48', bg: '#2a1520', bgD: '#1f0f18' },
      brick: { base: '#7a3a4a', light: '#a8566a', dark: '#4a1f2c', mortar: '#1f0a12' },
      block: { base: '#3a2a4a', light: '#5d4a78', dark: '#1f142c' },
      plank: { style: 'chain', base: '#8a6a4a', light: '#b8946a', dark: '#4a3422' },
      liquid: { name: 'lava', top: '#fff27a', a: '#ff9f1c', b: '#ff3b30', glow: true },
      ambient: 'embers', dark: 0.5, gravity: 1,
    },
    rymd: {
      id: 'rymd', name: 'RYMDEN', music: 'rymd', seed: 6,
      sky: ['#020108', '#050316', '#090622', '#0d0930', '#120d3d'],
      ground: { style: 'metal', fill: '#5b6184', fillD: '#3b3f5c', fillL: '#7d84ab', speck: '#2b2f47', top: '#c7cbe0', topL: '#eef0fa', topD: '#8f95b2', neon: '#b55cff', bg: '#20223a', bgD: '#181a2e' },
      brick: { base: '#4d7cff', light: '#8faaff', dark: '#2a47b3', mortar: '#101a4a' },
      block: { base: '#8f95b2', light: '#c7cbe0', dark: '#50557a' },
      plank: { style: 'energy', base: '#2ef2ff', light: '#c9fdff', dark: '#1a9ec0' },
      liquid: { name: 'plasma', top: '#ffd6f0', a: '#ff4fa3', b: '#b52a78', glow: true },
      ambient: 'stars', dark: 0, gravity: 0.5,
    },
  };

  for (const id in Themes) Themes[id].buildBg = BG[id];

  const bgCache = {};
  Themes.getBg = function (id) {
    if (!bgCache[id]) bgCache[id] = BG[id](Themes[id]);
    return bgCache[id];
  };

  /** Rita himmel + parallaxlager. camY0 = kamerans y när den står längst ner. */
  Themes.drawBg = function (ctx, id, camX, camY, maxCamY, t) {
    const bg = Themes.getBg(id);
    ctx.drawImage(bg.sky, 0, 0);
    for (const L of bg.layers) {
      const lw = L.img.width, lh = L.img.height;
      let ox = -((camX * L.fx + (L.drift || 0) * t) % lw);
      if (ox > 0) ox -= lw;
      let y;
      if (L.full) y = 0;
      else if (L.top) y = Math.round((maxCamY - camY) * L.fy);
      else y = Math.round(H - lh + (maxCamY - camY) * L.fy);
      if (y >= H) continue;
      for (let x = Math.round(ox); x < W; x += lw) ctx.drawImage(L.img, x, y);
    }
  };

  HK.Themes = Themes;
  HK.BgUtil = { bands, disc, cloud };
})((window.HK = window.HK || {}));
