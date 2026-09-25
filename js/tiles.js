/* Hitta Kevin — rutor (tiles): typer, egenskaper och procedurell grafik per värld. */
(function (HK) {
  'use strict';
  const U = HK.U;
  const K = '#1a1c2c';
  const TS = 16;

  const T = {
    EMPTY: 0, GROUND: 1, BRICK: 2, BLOCK: 3, QBLOCK: 4, USED: 5, ONEWAY: 6, SPIKES: 7, LIQUID: 8,
    ICE: 9, CONV_L: 10, CONV_R: 11, CRACKED: 12, FAKE: 13, BGWALL: 14, HIDDEN: 15, CANNON: 16,
  };
  const SOLID = new Uint8Array(32);
  [T.GROUND, T.BRICK, T.BLOCK, T.QBLOCK, T.USED, T.ICE, T.CONV_L, T.CONV_R, T.CRACKED, T.CANNON].forEach((t) => (SOLID[t] = 1));
  // rutor som "hänger ihop" visuellt med marken
  const TERRAIN = new Uint8Array(32);
  [T.GROUND, T.FAKE, T.CRACKED].forEach((t) => (TERRAIN[t] = 1));

  function mk() {
    return U.makeCanvas(TS, TS);
  }
  function R(ctx, x, y, w, h, c) {
    ctx.fillStyle = c;
    ctx.fillRect(x, y, w, h);
  }
  function P(ctx, x, y, c) {
    ctx.fillStyle = c;
    ctx.fillRect(x, y, 1, 1);
  }

  // ---------------- Mark ----------------
  function groundFill(ctx, th, r, variant) {
    const g = th.ground;
    R(ctx, 0, 0, 16, 16, g.fill);
    switch (g.style) {
      case 'grass':
      case 'rock': {
        for (let i = 0; i < 7; i++) {
          const x = Math.floor(r() * 15), y = 5 + Math.floor(r() * 10);
          const c = r() < 0.5 ? g.fillD : g.fillL;
          R(ctx, x, y, r() < 0.4 ? 2 : 1, 1, c);
          if (r() < 0.3) P(ctx, x, y + 1, g.fillD);
        }
        if (g.style === 'rock' && r() < 0.5) {
          const x = 3 + Math.floor(r() * 10), y = 7 + Math.floor(r() * 6);
          P(ctx, x, y, g.speck);
          P(ctx, x + 1, y + 1, '#c9c5ff');
        }
        if (g.style === 'grass' && variant === 2) {
          // en liten sten
          R(ctx, 5, 9, 3, 2, '#b8a08a');
          R(ctx, 5, 10, 3, 1, '#8a7560');
        }
        break;
      }
      case 'roof': {
        R(ctx, 0, 8, 16, 1, g.fillD);
        R(ctx, (variant * 5) % 16, 0, 1, 8, g.fillD);
        R(ctx, (variant * 5 + 8) % 16, 9, 1, 7, g.fillD);
        for (let i = 0; i < 4; i++) P(ctx, Math.floor(r() * 16), Math.floor(r() * 16), g.fillL);
        break;
      }
      case 'cloud': {
        for (let i = 0; i < 5; i++) {
          const x = Math.floor(r() * 13), y = 5 + Math.floor(r() * 9);
          R(ctx, x, y, 3, 1, g.fillD);
          P(ctx, x + 1, y - 1, g.fillD);
        }
        break;
      }
      case 'castle': {
        R(ctx, 0, 3, 16, 1, g.fillD);
        R(ctx, 0, 11, 16, 1, g.fillD);
        R(ctx, variant % 2 ? 4 : 11, 4, 1, 7, g.fillD);
        R(ctx, variant % 2 ? 11 : 4, 12, 1, 4, g.fillD);
        R(ctx, variant % 2 ? 11 : 4, 0, 1, 3, g.fillD);
        R(ctx, 1, 4, 3, 1, g.fillL);
        if (r() < 0.45) {
          // glödande spricka
          let x = 3 + Math.floor(r() * 10), y = 5 + Math.floor(r() * 5);
          for (let k = 0; k < 4; k++) {
            P(ctx, x, y, g.speck);
            x += r() < 0.5 ? 1 : -1;
            y += 1;
          }
        }
        break;
      }
      case 'metal': {
        R(ctx, 0, 0, 1, 16, g.fillD);
        R(ctx, 8, 0, 1, 16, g.fillD);
        R(ctx, 0, 8, 16, 1, g.fillD);
        P(ctx, 2, 2, g.fillL); P(ctx, 6, 2, g.fillL); P(ctx, 2, 6, g.fillL); P(ctx, 6, 6, g.fillL);
        P(ctx, 10, 10, g.fillL); P(ctx, 14, 10, g.fillL); P(ctx, 10, 14, g.fillL); P(ctx, 14, 14, g.fillL);
        if (variant === 1) R(ctx, 10, 2, 4, 3, '#2b2f47');
        if (variant === 3) { R(ctx, 2, 10, 4, 1, '#2ef2ff'); }
        break;
      }
    }
  }

  function groundTop(ctx, th, r, left, right) {
    const g = th.ground;
    switch (g.style) {
      case 'grass': {
        R(ctx, 0, 0, 16, 1, K);
        R(ctx, 0, 1, 16, 2, g.topL);
        R(ctx, 0, 3, 16, 2, g.top);
        for (let x = 0; x < 16; x++) {
          const d = Math.floor(r() * 3.2);
          if (d > 0) R(ctx, x, 5, 1, d, g.top);
          P(ctx, x, 5 + d, g.topD);
          if (r() < 0.25) P(ctx, x, 2, g.top);
        }
        for (let i = 0; i < 3; i++) P(ctx, Math.floor(r() * 16), 1, '#e6ffc2');
        break;
      }
      case 'rock': {
        R(ctx, 0, 0, 16, 1, K);
        R(ctx, 0, 1, 16, 1, g.topL);
        R(ctx, 0, 2, 16, 1, g.top);
        for (let x = 0; x < 16; x++) {
          const d = Math.floor(r() * 2.6);
          if (d > 0) R(ctx, x, 3, 1, d, g.top);
          P(ctx, x, 3 + d, g.topD);
        }
        break;
      }
      case 'roof': {
        R(ctx, 0, 0, 16, 1, K);
        R(ctx, 0, 1, 16, 1, g.topL);
        R(ctx, 0, 2, 16, 1, g.top);
        R(ctx, 0, 3, 16, 1, g.neon);
        R(ctx, 0, 4, 16, 1, g.topD);
        break;
      }
      case 'cloud': {
        for (let x = 0; x < 16; x++) {
          const b = Math.round(2 * Math.abs(Math.sin((Math.PI * (x + 0.5)) / 8)));
          const top = 3 - b;
          ctx.clearRect(x, 0, 1, top);
          P(ctx, x, top, K);
          P(ctx, x, top + 1, '#ffffff');
          P(ctx, x, top + 2, '#ffffff');
        }
        break;
      }
      case 'castle': {
        R(ctx, 0, 0, 16, 1, K);
        R(ctx, 0, 1, 16, 1, g.topL);
        R(ctx, 0, 2, 16, 2, g.top);
        R(ctx, 0, 4, 16, 1, g.topD);
        R(ctx, 7, 1, 1, 3, g.topD);
        break;
      }
      case 'metal': {
        R(ctx, 0, 0, 16, 1, K);
        R(ctx, 0, 1, 16, 1, g.topL);
        R(ctx, 0, 2, 16, 1, g.top);
        R(ctx, 0, 3, 16, 1, g.topD);
        for (let x = 1; x < 16; x += 4) R(ctx, x, 3, 2, 1, g.neon);
        break;
      }
    }
    if (left) {
      ctx.clearRect(0, 0, 1, 1);
      P(ctx, 0, 1, K);
      P(ctx, 1, 0, K);
    }
    if (right) {
      ctx.clearRect(15, 0, 1, 1);
      P(ctx, 15, 1, K);
      P(ctx, 14, 0, K);
    }
  }

  function drawGround(ctx, th, mask, variant, cracked) {
    const r = U.rng(variant * 977 + mask * 131 + th.seed * 7919 + (cracked ? 5 : 0));
    const g = th.ground;
    const top = !(mask & 1), right = !(mask & 2), bottom = !(mask & 4), left = !(mask & 8);
    groundFill(ctx, th, r, variant);
    if (left) { R(ctx, 0, 0, 1, 16, K); R(ctx, 1, 0, 1, 16, g.fillL); }
    if (right) { R(ctx, 15, 0, 1, 16, K); R(ctx, 14, 0, 1, 16, g.fillD); }
    if (bottom) {
      R(ctx, 0, 15, 16, 1, K);
      R(ctx, left ? 1 : 0, 14, 16 - (left ? 1 : 0) - (right ? 1 : 0), 1, g.fillD);
      if (g.style === 'cloud') { ctx.clearRect(0, 15, 1, 1); ctx.clearRect(15, 15, 1, 1); }
      if (left) { ctx.clearRect(0, 15, 1, 1); P(ctx, 1, 15, K); P(ctx, 0, 14, K); }
      if (right) { ctx.clearRect(15, 15, 1, 1); P(ctx, 14, 15, K); P(ctx, 15, 14, K); }
    }
    if (top) groundTop(ctx, th, r, left, right);
    if (cracked) {
      const cr = U.rng(mask * 7 + variant);
      let x = 3 + Math.floor(cr() * 4), y = top ? 5 : 1;
      ctx.fillStyle = K;
      while (y < 15) {
        ctx.fillRect(x, y, 1, 2);
        x += cr() < 0.5 ? 1 : -1;
        x = U.clamp(x, 2, 13);
        y += 2;
      }
      ctx.fillRect(x, 8, 4, 1);
      ctx.fillRect(Math.max(2, x - 4), 11, 3, 1);
      P(ctx, 11, 4 + (top ? 3 : 0), K);
      P(ctx, 12, 5 + (top ? 3 : 0), K);
    }
  }

  function drawBgWall(ctx, th, variant) {
    const g = th.ground;
    R(ctx, 0, 0, 16, 16, g.bg);
    const r = U.rng(variant * 31 + th.seed);
    ctx.fillStyle = g.bgD;
    switch (g.style) {
      case 'castle':
      case 'roof':
        ctx.fillRect(0, 7, 16, 1);
        ctx.fillRect(0, 15, 16, 1);
        ctx.fillRect(variant % 2 ? 3 : 11, 0, 1, 7);
        ctx.fillRect(variant % 2 ? 11 : 3, 8, 1, 7);
        break;
      case 'metal':
        ctx.fillRect(0, 0, 16, 1);
        ctx.fillRect(0, 0, 1, 16);
        P(ctx, 3, 3, g.fillD); P(ctx, 12, 3, g.fillD); P(ctx, 3, 12, g.fillD); P(ctx, 12, 12, g.fillD);
        break;
      default:
        for (let i = 0; i < 6; i++) ctx.fillRect(Math.floor(r() * 15), Math.floor(r() * 15), 2, 1);
    }
  }

  // ---------------- Block ----------------
  function drawBrick(ctx, th) {
    const b = th.brick;
    R(ctx, 0, 0, 16, 16, b.mortar);
    for (let row = 0; row < 4; row++) {
      const off = row % 2 ? 4 : 0;
      for (let col = -1; col < 2; col++) {
        const x = col * 8 + off, y = row * 4;
        const x0 = Math.max(0, x), x1 = Math.min(16, x + 7);
        if (x1 <= x0) continue;
        R(ctx, x0, y, x1 - x0, 3, b.base);
        R(ctx, x0, y, x1 - x0, 1, b.light);
        R(ctx, x0, y + 2, x1 - x0, 1, b.dark);
      }
    }
    R(ctx, 0, 0, 16, 1, K);
    R(ctx, 0, 15, 16, 1, K);
    R(ctx, 0, 0, 1, 16, K);
    R(ctx, 15, 0, 1, 16, K);
  }

  function bevel(ctx, base, light, dark) {
    R(ctx, 0, 0, 16, 16, K);
    R(ctx, 1, 1, 14, 14, base);
    R(ctx, 1, 1, 14, 1, light);
    R(ctx, 1, 1, 1, 14, light);
    R(ctx, 1, 14, 14, 1, dark);
    R(ctx, 14, 1, 1, 14, dark);
  }

  function drawBlock(ctx, th) {
    const b = th.block;
    bevel(ctx, b.base, b.light, b.dark);
    if (b.crystal) {
      ctx.fillStyle = b.light;
      for (let i = 0; i < 6; i++) ctx.fillRect(3 + i, 9 - i, 1, 1);
      for (let i = 0; i < 4; i++) ctx.fillRect(8 + i, 12 - i, 1, 1);
      P(ctx, 4, 4, '#ffffff');
    } else {
      R(ctx, 3, 3, 10, 10, U.mix(b.base, b.dark, 0.25));
      R(ctx, 4, 4, 8, 8, b.base);
      P(ctx, 3, 3, b.light); P(ctx, 12, 3, b.dark); P(ctx, 3, 12, b.dark); P(ctx, 12, 12, b.dark);
    }
  }

  const KL = ['#ffd23f', '#fff3a0', '#d18b0c', '#a3620a'];
  function drawQBlock(ctx, frame) {
    bevel(ctx, KL[0], KL[1], KL[2]);
    // nitar
    P(ctx, 3, 3, KL[2]); P(ctx, 12, 3, KL[2]); P(ctx, 3, 12, KL[2]); P(ctx, 12, 12, KL[2]);
    // K
    const k = KL[3];
    R(ctx, 5, 4, 2, 8, k);
    R(ctx, 7, 7, 1, 2, k);
    R(ctx, 8, 6, 1, 1, k); R(ctx, 9, 5, 1, 1, k); R(ctx, 10, 4, 1, 1, k);
    R(ctx, 8, 9, 1, 1, k); R(ctx, 9, 10, 1, 1, k); R(ctx, 10, 11, 1, 1, k);
    R(ctx, 6, 4, 1, 8, '#c77a0c');
    // glans som sveper över
    if (frame > 0) {
      const off = [0, 2, 7, 12][frame];
      ctx.fillStyle = 'rgba(255,255,255,0.75)';
      for (let i = 0; i < 12; i++) {
        const x = off + i - 4, y = 13 - i;
        if (x >= 2 && x < 14 && y >= 2 && y < 14) ctx.fillRect(x, y, 2, 1);
      }
    }
  }

  function drawUsed(ctx) {
    bevel(ctx, '#a0704f', '#c9966c', '#6b452c');
    P(ctx, 3, 3, '#6b452c'); P(ctx, 12, 3, '#6b452c'); P(ctx, 3, 12, '#6b452c'); P(ctx, 12, 12, '#6b452c');
  }

  function drawIce(ctx) {
    bevel(ctx, '#bff4ff', '#ffffff', '#6fcff0');
    ctx.fillStyle = '#ffffff';
    for (let i = 0; i < 5; i++) ctx.fillRect(3 + i, 8 - i, 1, 1);
    for (let i = 0; i < 3; i++) ctx.fillRect(9 + i, 12 - i, 1, 1);
  }

  function drawConveyor(ctx, dir, frame) {
    R(ctx, 0, 0, 16, 16, K);
    R(ctx, 1, 1, 14, 14, '#3b3f5c');
    R(ctx, 1, 1, 14, 4, '#50557a');
    ctx.fillStyle = '#ffd23f';
    for (let i = -1; i < 4; i++) {
      const x = ((i * 6 + frame * 2 * dir) % 18 + 18) % 18 - 2;
      for (let k = 0; k < 2; k++) {
        const xx = dir > 0 ? x + k : x + 1 - k;
        if (xx >= 1 && xx < 15) ctx.fillRect(xx, 2 + k, 1, 1);
        if (xx >= 1 && xx < 15) ctx.fillRect(xx, 4 - k, 1, 1);
      }
    }
    for (const cx of [4, 11]) {
      R(ctx, cx - 2, 8, 4, 4, '#8f95b2');
      P(ctx, cx - 1 + (frame % 2), 9 + (frame >> 1), '#1a1c2c');
    }
  }

  function drawOneway(ctx, th, caps) {
    const p = th.plank;
    const capL = caps & 1, capR = caps & 2;
    switch (p.style) {
      case 'wood':
      case 'chain': {
        R(ctx, 0, 0, 16, 6, K);
        R(ctx, 0, 1, 16, 4, p.base);
        R(ctx, 0, 1, 16, 1, p.light);
        R(ctx, 0, 4, 16, 1, p.dark);
        R(ctx, 7, 1, 1, 4, p.dark);
        P(ctx, 3, 2, p.dark); P(ctx, 12, 2, p.dark);
        if (capL) { R(ctx, 0, 0, 1, 6, K); R(ctx, 2, 6, 2, 3, p.dark); R(ctx, 1, 6, 1, 3, K); R(ctx, 4, 6, 1, 3, K); }
        if (capR) { R(ctx, 15, 0, 1, 6, K); R(ctx, 12, 6, 2, 3, p.dark); R(ctx, 11, 6, 1, 3, K); R(ctx, 14, 6, 1, 3, K); }
        if (p.style === 'chain') { R(ctx, 3, 6, 1, 2, '#9aa7c2'); R(ctx, 12, 6, 1, 2, '#9aa7c2'); }
        break;
      }
      case 'grate': {
        R(ctx, 0, 0, 16, 5, K);
        R(ctx, 0, 1, 16, 3, p.base);
        R(ctx, 0, 1, 16, 1, p.light);
        for (let x = 1; x < 16; x += 3) P(ctx, x, 2, K);
        R(ctx, 0, 3, 16, 1, p.dark);
        if (capL) R(ctx, 0, 0, 1, 5, K);
        if (capR) R(ctx, 15, 0, 1, 5, K);
        R(ctx, 3, 5, 1, 4, p.dark); R(ctx, 12, 5, 1, 4, p.dark);
        break;
      }
      case 'cloud': {
        for (let x = 0; x < 16; x++) {
          const b = Math.round(1.5 * Math.abs(Math.sin((Math.PI * (x + 0.5)) / 8)));
          const y0 = 2 - b;
          P(ctx, x, y0, K);
          R(ctx, x, y0 + 1, 1, 6 - y0, '#ffffff');
          P(ctx, x, 7, p.dark);
          P(ctx, x, 8, K);
        }
        if (capL) { ctx.clearRect(0, 0, 2, 9); R(ctx, 1, 2, 1, 6, K); ctx.clearRect(1, 7, 1, 2); P(ctx, 2, 8, K); }
        if (capR) { ctx.clearRect(14, 0, 2, 9); R(ctx, 14, 2, 1, 6, K); ctx.clearRect(14, 7, 1, 2); P(ctx, 13, 8, K); }
        break;
      }
      case 'energy': {
        R(ctx, 0, 0, 16, 5, 'rgba(46,242,255,0.25)');
        R(ctx, 0, 1, 16, 3, p.base);
        R(ctx, 0, 2, 16, 1, p.light);
        if (capL) R(ctx, 0, 0, 2, 5, '#50557a');
        if (capR) R(ctx, 14, 0, 2, 5, '#50557a');
        break;
      }
    }
  }

  function drawSpikes(ctx) {
    R(ctx, 0, 13, 16, 3, K);
    R(ctx, 0, 14, 16, 1, '#6b7090');
    for (let s = 0; s < 2; s++) {
      const bx = s * 8;
      for (let y = 0; y < 12; y++) {
        const hw = Math.floor((y + 1) / 3);
        const cx = bx + 4;
        ctx.fillStyle = K;
        ctx.fillRect(cx - hw - 1, 2 + y, hw * 2 + 3, 1);
        ctx.fillStyle = '#e8ecf5';
        ctx.fillRect(cx - hw, 2 + y, hw + 1, 1);
        ctx.fillStyle = '#9aa7c2';
        if (hw > 0) ctx.fillRect(cx + 1, 2 + y, hw, 1);
      }
      P(ctx, bx + 4, 1, K);
    }
  }

  function drawLiquid(ctx, th, surface, frame) {
    const L = th.liquid;
    R(ctx, 0, 0, 16, 16, L.a);
    for (let y = 4; y < 16; y += 4) {
      const off = (frame * 2 + y) % 16;
      R(ctx, off, y, 5, 1, L.b);
      R(ctx, (off + 9) % 16, y + 2, 3, 1, U.mix(L.a, L.top, 0.35));
    }
    if (surface) {
      ctx.clearRect(0, 0, 16, 3);
      for (let x = 0; x < 16; x++) {
        const y = 2 + Math.round(Math.sin(((x + frame * 4) / 16) * Math.PI * 2) * 1.2);
        ctx.clearRect(x, 0, 1, y);
        R(ctx, x, y, 1, 2, L.top);
        R(ctx, x, y + 2, 1, 1, U.mix(L.top, L.a, 0.5));
      }
    }
  }

  // ---------------- Atlas per värld ----------------
  const atlases = {};

  function build(themeId) {
    const th = HK.Themes[themeId];
    const A = { ground: [], cracked: [], bg: [], kblock: [], conv: { 1: [], '-1': [] }, oneway: [], spikes: [], liqTop: [], liqBody: [] };
    for (let mask = 0; mask < 16; mask++) {
      for (let v = 0; v < 4; v++) {
        const c = mk();
        drawGround(c.getContext('2d'), th, mask, v, false);
        A.ground.push(c);
      }
      const cc = mk();
      drawGround(cc.getContext('2d'), th, mask, 1, true);
      A.cracked.push(cc);
    }
    for (let v = 0; v < 4; v++) {
      const c = mk();
      drawBgWall(c.getContext('2d'), th, v);
      A.bg.push(c);
    }
    let c = mk(); drawBrick(c.getContext('2d'), th); A.brick = c;
    c = mk(); drawBlock(c.getContext('2d'), th); A.block = c;
    c = mk(); drawUsed(c.getContext('2d')); A.used = c;
    c = mk(); drawIce(c.getContext('2d')); A.ice = c;
    for (let f = 0; f < 4; f++) { c = mk(); drawQBlock(c.getContext('2d'), f); A.kblock.push(c); }
    for (const d of [1, -1]) for (let f = 0; f < 4; f++) { c = mk(); drawConveyor(c.getContext('2d'), d, f); A.conv[d].push(c); }
    for (let caps = 0; caps < 4; caps++) { c = mk(); drawOneway(c.getContext('2d'), th, caps); A.oneway.push(c); }
    // taggar i fyra riktningar: 0 upp, 1 höger, 2 ner, 3 vänster
    const base = mk();
    drawSpikes(base.getContext('2d'));
    for (let o = 0; o < 4; o++) {
      c = mk();
      const x = c.getContext('2d');
      x.translate(8, 8);
      x.rotate((o * Math.PI) / 2);
      x.drawImage(base, -8, -8);
      A.spikes.push(c);
    }
    for (let f = 0; f < 4; f++) {
      c = mk(); drawLiquid(c.getContext('2d'), th, true, f); A.liqTop.push(c);
      c = mk(); drawLiquid(c.getContext('2d'), th, false, f); A.liqBody.push(c);
    }
    A.cannon = HK.Sprites.frame('kanon', 0);
    return A;
  }

  const Tiles = {
    T, SOLID, TERRAIN, TS,
    atlas(themeId) {
      if (!atlases[themeId]) atlases[themeId] = build(themeId);
      return atlases[themeId];
    },
  };

  HK.T = T;
  HK.Tiles = Tiles;
})((window.HK = window.HK || {}));
