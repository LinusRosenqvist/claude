/* Hitta Kevin — all pixelkonst för figurer, fiender och föremål (ritas i kod). */
(function (HK) {
  'use strict';
  const U = HK.U;
  const S = HK.Sprites;
  const Painter = S.Painter;

  const K = '#1a1c2c'; // kontur
  const Art = {};

  // =====================================================================
  // HJÄLTEN
  // =====================================================================
  const HP = {
    K,
    h: '#ff4fa3', H: '#c42a7c', i: '#ffa3d6',
    s: '#ffd0a8', S: '#e8966e', c: '#ff8a8a',
    e: '#1a1c2c', w: '#ffffff', m: '#b83a4b',
    y: '#ffd23f', Y: '#e0961c', g: '#6ff6ff', G: '#2aa6d8',
  };
  const HERO = {
    jacket: '#ffb627', jacketD: '#e07a1a', jacketL: '#ffe48a', stripe: '#ffffff',
    pants: '#3f51c4', pantsD: '#29327f',
    shoe: '#ff4545', shoeD: '#b3263a', sole: '#ffffff',
    scarf: '#2ce8b4', scarfD: '#159e86',
  };
  Art.HERO = HERO;

  // Huvud 12x12, tittar åt höger
  const HERO_HEAD = [
    '....KK.KK...',
    '...KhhKhhKK.',
    '..KhhhhhhhhK',
    '.KhihhhhhhhK',
    '.KhhiyyyygGK',
    'KhhhhYYYYGGK',
    'KhhhhhhssssK',
    'KhhHhsseseK.',
    'KhhHhsswswK.',
    '.KHHssScsmK.',
    '..KKKSsssK..',
    '....KKKKK...',
  ];
  const HERO_HEAD_UP = [
    '....KK.KK...',
    '...KhhKhhKK.',
    '..KhhhhhhhhK',
    '.KhihhhhhhhK',
    '.KhhiyyyygGK',
    'KhhhhYYYYGGK',
    'KhhhhhhseseK',
    'KhhHhsswswK.',
    'KhhHhsssssK.',
    '.KHHssScsoK.',
    '..KKKSsssK..',
    '....KKKKK...',
  ];
  const HERO_HEAD_HURT = [
    '....KK.KK...',
    '...KhhKhhKK.',
    '..KhhhhhhhhK',
    '.KhihhhhhhhK',
    '.KhhiyyyygGK',
    'KhhhhYYYYGGK',
    'KhhhhhhssssK',
    'KhhHhsKsKsK.',
    'KhhHhssKsKK.',
    '.KHHssScsoK.',
    '..KKKSsssK..',
    '....KKKKK...',
  ];
  const HERO_HEAD_BLINK = HERO_HEAD.slice();
  HERO_HEAD_BLINK[7] = 'KhhHhsssssK.';
  HERO_HEAD_BLINK[8] = 'KhhHhsKsKsK.';

  function heroLeg(p, hx, hy, fx, fy, back) {
    const pc = back ? HERO.pantsD : HERO.pants;
    p.thick(hx, hy, fx, fy - 1, pc, 2.2);
    const sc = back ? HERO.shoeD : HERO.shoe;
    p.rect(fx - 1, fy - 1, 4, 2, sc);
    p.rect(fx - 1, fy, 4, 1, back ? '#c9cfe0' : HERO.sole);
  }

  function heroTorso(p, by, lean) {
    const x = 5 + (lean || 0);
    p.rect(x, 11 + by, 7, 5, HERO.jacket);
    p.rect(x, 11 + by, 1, 5, HERO.jacketD);
    p.rect(x + 1, 15 + by, 6, 1, HERO.jacketD);
    p.rect(x + 5, 12 + by, 1, 3, HERO.jacketL);
    p.rect(x + 3, 11 + by, 1, 4, HERO.stripe);
    // bakre arm (liten, i skugga)
    p.rect(x - 1, 12 + by, 2, 3, HERO.jacketD);
    p.px(x - 1, 15 + by, HP.S);
  }

  function heroFrame(opts) {
    const p = new Painter(16, 22);
    p.ty = 1;
    const by = opts.by || 0; // kroppens gungning
    const hy = opts.hy == null ? by : opts.hy;
    const legs = opts.legs;
    heroLeg(p, legs[0][0], 15 + by, legs[0][1], legs[0][2], true);
    heroTorso(p, by, opts.lean);
    heroLeg(p, legs[1][0], 15 + by, legs[1][1], legs[1][2], false);
    p.grid(opts.head || HERO_HEAD, HP, 3 + (opts.hx || 0), hy);
    p.ty = 0;
    p.outline(K);
    return p;
  }

  function buildHero() {
    const frames = {};
    // [hipX, footX, footY] för bakre, främre ben
    frames.idle0 = heroFrame({ legs: [[7, 6, 20], [9, 10, 20]] });
    frames.idle1 = heroFrame({ by: 1, hy: 1, legs: [[7, 6, 20], [9, 10, 20]] });
    frames.blink = heroFrame({ head: HERO_HEAD_BLINK, legs: [[7, 6, 20], [9, 10, 20]] });
    const run = [];
    for (let k = 0; k < 6; k++) {
      const th = (k / 6) * Math.PI * 2;
      const f1x = 8 + Math.round(3.4 * Math.sin(th));
      const f1y = 20 - Math.max(0, Math.round(2.4 * Math.cos(th)));
      const f2x = 8 + Math.round(3.4 * Math.sin(th + Math.PI));
      const f2y = 20 - Math.max(0, Math.round(2.4 * Math.cos(th + Math.PI)));
      const bob = k % 3 === 0 ? 0 : -1;
      // bakre ben = det som ligger bakom (f1), främre = f2
      run.push(heroFrame({ by: bob, lean: 1, hx: 1, legs: [[7, f1x, f1y], [9, f2x, f2y]] }));
    }
    frames.run = run;
    frames.jump = heroFrame({ by: -1, legs: [[7, 5, 18], [9, 11, 19]], head: HERO_HEAD_UP });
    frames.fall = heroFrame({ legs: [[7, 6, 20], [9, 11, 18]] });
    frames.crouch = (function () {
      const p = new Painter(16, 22);
      p.ty = 1;
      heroLeg(p, 7, 18, 5, 20, true);
      p.rect(5, 15, 7, 4, HERO.jacket);
      p.rect(5, 15, 1, 4, HERO.jacketD);
      p.rect(8, 15, 1, 3, HERO.stripe);
      heroLeg(p, 9, 18, 11, 20, false);
      p.grid(HERO_HEAD, HP, 3, 5);
      p.ty = 0;
      p.outline(K);
      return p;
    })();
    frames.lookup = heroFrame({ legs: [[7, 6, 20], [9, 10, 20]], head: HERO_HEAD_UP });
    frames.hurt = heroFrame({ by: 0, legs: [[7, 4, 19], [9, 12, 19]], head: HERO_HEAD_HURT });
    frames.win = heroFrame({ by: -1, legs: [[7, 5, 20], [9, 11, 20]], head: HERO_HEAD_UP });
    frames.skid = heroFrame({ lean: -1, legs: [[7, 5, 20], [9, 12, 20]], head: HERO_HEAD_HURT });

    const names = ['idle0', 'idle1', 'blink', 'jump', 'fall', 'crouch', 'lookup', 'hurt', 'win', 'skid'];
    for (const n of names) S.add('hero_' + n, frames[n].toCanvas());
    S.add('hero_run', run.map((p) => p.toCanvas()));

    // Arm + blaster i 32 riktningar (pivot i mitten av 24x24)
    const arms = [];
    for (let a = 0; a < 32; a++) {
      const ang = (a / 32) * Math.PI * 2;
      const p = new Painter(24, 24);
      const cx = 12, cy = 12;
      const dx = Math.cos(ang), dy = Math.sin(ang);
      p.thick(cx, cy, cx + dx * 3.5, cy + dy * 3.5, HERO.jacket, 2.4);
      p.thick(cx + dx * 4.5, cy + dy * 4.5, cx + dx * 5.2, cy + dy * 5.2, HP.s, 2.4);
      // blaster
      p.thick(cx + dx * 5.5, cy + dy * 5.5, cx + dx * 9.5, cy + dy * 9.5, '#5b6ee1', 2.6);
      p.thick(cx + dx * 6, cy + dy * 6, cx + dx * 7.5, cy + dy * 7.5, '#c7d2ff', 1.2);
      p.px(cx + dx * 10, cy + dy * 10, '#6ff6ff');
      p.outline(K);
      arms.push(p.toCanvas());
    }
    S.add('hero_arm', arms);

    // Jetpack på ryggen (6x11)
    S.fromGrids('hero_jetpack', {
      K, r: '#ff4d6d', R: '#b8264f', w: '#e8ecf5', g: '#9aa7c2', y: '#ffd23f',
    }, [[
      '.KKKK.',
      'KrrwgK',
      'KrrwgK',
      'KRrrRK',
      'KyKKyK',
      'KrrRRK',
      'KrrRRK',
      'KRRRRK',
      'KggggK',
      '.KgKgK',
      '.K.K..',
    ]]);
  }

  // =====================================================================
  // KEVIN
  // =====================================================================
  const KP = {
    K,
    y: '#ffd23f', Y: '#e59a17', o: '#ff7b24',
    t: '#7a4a2b', T: '#523019',
    s: '#f6c29a', S: '#d9895f', c: '#ff8a8a',
    b: '#23233a', B: '#4a5a8a', w: '#ffffff', m: '#b83a4b',
  };
  const KEVIN = {
    hoodie: '#9b5de5', hoodieD: '#6a2fb8', hoodieL: '#c9a0ff', logo: '#ffd23f',
    jeans: '#2c6fbb', jeansD: '#1c4680', shoe: '#ffffff', shoeD: '#c9cfe0', sole: '#ff4d6d',
  };
  Art.KEVIN = KEVIN;

  // Keps bakochfram + solglasögon + brett leende
  const KEVIN_HEAD = [
    '...KKKKKK...',
    '..KyyyyyyK..',
    '.KyyyyyyyyK.',
    'KYyyyyyyyyyK',
    'KKKYYYYYYYtK',
    'oKtttttttttK',
    '.KttKKKKKKKK',
    '.KtsKbBwKbwK',
    '.KssKbbbKbbK',
    '.KsSsKKsKKsK',
    '..KSsKwwwmK.',
    '...KKsKKKK..',
  ];
  const KEVIN_HEAD_BLINK = KEVIN_HEAD.slice(); // solglasögon — "blinkar" med glimt
  KEVIN_HEAD_BLINK[7] = '.KtsKbbbKbbK';
  const KEVIN_HEAD_WOW = KEVIN_HEAD.slice();
  KEVIN_HEAD_WOW[10] = '..KSsKsKKsK.';
  KEVIN_HEAD_WOW[11] = '...KKsKKKK..';
  const KEVIN_HEAD_SLEEP = [
    '...KKKKKK...',
    '..KyyyyyyK..',
    '.KyyyyyyyyK.',
    'KYyyyyyyyyyK',
    'KKKYYYYYYYtK',
    'oKtttttttttK',
    '.KttssssssK.',
    '.KtsKKKsKKK.',
    '.KsssssssssK',
    '.KsSssssSssK',
    '..KSsssKssK.',
    '...KKKKKKK..',
  ];

  function kevinLeg(p, hx, hy, fx, fy, back) {
    p.thick(hx, hy, fx, fy - 1, back ? KEVIN.jeansD : KEVIN.jeans, 2.2);
    p.rect(fx - 1, fy - 1, 4, 2, back ? KEVIN.shoeD : KEVIN.shoe);
    p.rect(fx - 1, fy, 4, 1, KEVIN.sole);
  }

  function kevinTorso(p, by, arms) {
    const x = 4;
    p.rect(x, 11 + by, 8, 5, KEVIN.hoodie);
    p.rect(x, 11 + by, 1, 5, KEVIN.hoodieD);
    p.rect(x + 1, 15 + by, 7, 1, KEVIN.hoodieD);
    p.rect(x + 6, 12 + by, 1, 3, KEVIN.hoodieL);
    // K-logga
    p.px(x + 3, 12 + by, KEVIN.logo); p.px(x + 3, 13 + by, KEVIN.logo); p.px(x + 3, 14 + by, KEVIN.logo);
    p.px(x + 4, 13 + by, KEVIN.logo); p.px(x + 5, 12 + by, KEVIN.logo); p.px(x + 5, 14 + by, KEVIN.logo);
    // luvsnören
    p.px(x + 2, 11 + by, '#ffffff');
    p.px(x + 6, 11 + by, '#ffffff');
    // armar: 'down' | 'wave0' | 'wave1' | 'up' | 'phone' | 'dance0' | 'dance1'
    const a = arms || 'down';
    const sk = KP.s;
    if (a === 'down') {
      p.rect(x - 1, 12 + by, 2, 3, KEVIN.hoodieD); p.px(x - 1, 15 + by, sk);
      p.rect(x + 8, 12 + by, 2, 3, KEVIN.hoodie); p.px(x + 9, 15 + by, sk);
    } else if (a === 'wave0' || a === 'wave1') {
      p.rect(x - 1, 12 + by, 2, 3, KEVIN.hoodieD); p.px(x - 1, 15 + by, sk);
      const tip = a === 'wave0' ? [x + 12, 7 + by] : [x + 10, 6 + by];
      p.thick(x + 8, 12 + by, tip[0], tip[1] + 2, KEVIN.hoodie, 2);
      p.rect(tip[0] - 1, tip[1], 2, 2, sk);
    } else if (a === 'up') {
      p.thick(x, 12 + by, x - 3, 7 + by, KEVIN.hoodieD, 2);
      p.rect(x - 4, 5 + by, 2, 2, sk);
      p.thick(x + 8, 12 + by, x + 11, 7 + by, KEVIN.hoodie, 2);
      p.rect(x + 11, 5 + by, 2, 2, sk);
    } else if (a === 'phone') {
      p.rect(x - 1, 12 + by, 2, 3, KEVIN.hoodieD); p.px(x - 1, 15 + by, sk);
      p.thick(x + 8, 13 + by, x + 10, 11 + by, KEVIN.hoodie, 2);
      p.rect(x + 9, 8 + by, 3, 4, '#2b2d42');
      p.px(x + 10, 9 + by, '#6ff6ff');
      p.px(x + 10, 10 + by, '#6ff6ff');
    } else if (a === 'dance0') {
      p.thick(x, 12 + by, x - 3, 8 + by, KEVIN.hoodieD, 2);
      p.rect(x - 4, 6 + by, 2, 2, sk);
      p.rect(x + 8, 12 + by, 2, 3, KEVIN.hoodie); p.px(x + 9, 15 + by, sk);
    } else if (a === 'dance1') {
      p.rect(x - 1, 12 + by, 2, 3, KEVIN.hoodieD); p.px(x - 1, 15 + by, sk);
      p.thick(x + 8, 12 + by, x + 11, 8 + by, KEVIN.hoodie, 2);
      p.rect(x + 11, 6 + by, 2, 2, sk);
    }
  }

  function kevinFrame(o) {
    const p = new Painter(18, 22);
    p.ty = 1;
    const by = o.by || 0;
    const legs = o.legs || [[7, 6, 20], [9, 10, 20]];
    kevinLeg(p, legs[0][0], 15 + by, legs[0][1], legs[0][2], true);
    kevinTorso(p, by, o.arms);
    kevinLeg(p, legs[1][0], 15 + by, legs[1][1], legs[1][2], false);
    p.grid(o.head || KEVIN_HEAD, KP, 2 + (o.hx || 0), o.hy == null ? by : o.hy);
    p.ty = 0;
    p.outline(K);
    return p;
  }

  function buildKevin() {
    const idle = [kevinFrame({}), kevinFrame({ by: 1 })];
    S.add('kevin_idle', idle.map((p) => p.toCanvas()));
    S.add('kevin_blink', kevinFrame({ head: KEVIN_HEAD_BLINK }).toCanvas());
    S.add('kevin_wave', [kevinFrame({ arms: 'wave0' }), kevinFrame({ arms: 'wave1' })].map((p) => p.toCanvas()));
    S.add('kevin_cheer', [kevinFrame({ arms: 'up', by: -1, head: KEVIN_HEAD_WOW }), kevinFrame({ arms: 'up', by: 0 })].map((p) => p.toCanvas()));
    S.add('kevin_phone', [kevinFrame({ arms: 'phone' }), kevinFrame({ arms: 'phone', by: 1 })].map((p) => p.toCanvas()));
    S.add('kevin_dance', [
      kevinFrame({ arms: 'dance0', legs: [[7, 5, 20], [9, 10, 20]] }),
      kevinFrame({ arms: 'down', by: 1, legs: [[7, 6, 20], [9, 11, 20]] }),
      kevinFrame({ arms: 'dance1', legs: [[7, 6, 20], [9, 11, 20]] }),
      kevinFrame({ arms: 'up', by: -1, legs: [[7, 5, 19], [9, 11, 19]], head: KEVIN_HEAD_WOW }),
    ].map((p) => p.toCanvas()));
    S.add('kevin_sleep', [kevinFrame({ head: KEVIN_HEAD_SLEEP, by: 1 }), kevinFrame({ head: KEVIN_HEAD_SLEEP, by: 0 })].map((p) => p.toCanvas()));
    const run = [];
    for (let k = 0; k < 6; k++) {
      const th = (k / 6) * Math.PI * 2;
      run.push(kevinFrame({
        by: k % 3 === 0 ? 0 : -1, hx: 1, arms: k < 3 ? 'dance0' : 'dance1',
        legs: [
          [7, 8 + Math.round(3.4 * Math.sin(th)), 20 - Math.max(0, Math.round(2.4 * Math.cos(th)))],
          [9, 8 + Math.round(3.4 * Math.sin(th + Math.PI)), 20 - Math.max(0, Math.round(2.4 * Math.cos(th + Math.PI)))],
        ],
      }));
    }
    S.add('kevin_run', run.map((p) => p.toCanvas()));
    // Huvud (ikon)
    const head = new Painter(14, 14).grid(KEVIN_HEAD, KP, 1, 1).outline(K);
    S.add('kevin_head', head.toCanvas());
    const heroHead = new Painter(14, 14).grid(HERO_HEAD, HP, 1, 1).outline(K);
    S.add('hero_head', heroHead.toCanvas());

    // Papp-Kevin (lockbete): platt, blekare, med pinne
    const d = kevinFrame({ arms: 'wave1' });
    const card = new Painter(20, 26);
    card.stamp(d, 1, 1);
    for (let i = 0; i < card.p.length; i++) {
      const c = card.p[i];
      if (c && c !== K) card.p[i] = U.mix(c, '#c8a27a', 0.35);
    }
    card.outline('#b07a4a', true);
    card.rect(9, 22, 2, 4, '#8a5a32');
    card.rect(6, 25, 8, 1, '#8a5a32');
    card.outline(K);
    const cardFlat = new Painter(26, 10);
    cardFlat.rect(1, 3, 24, 5, '#c8a27a');
    cardFlat.rect(1, 3, 24, 1, '#e0c09a');
    cardFlat.rect(3, 4, 5, 3, '#9b8aa8');
    cardFlat.rect(18, 4, 4, 3, '#e5c56a');
    cardFlat.outline(K);
    S.add('decoy', card.toCanvas());
    S.add('decoy_flat', cardFlat.toCanvas());
  }

  // =====================================================================
  // FIENDER
  // =====================================================================
  function eyes(p, x, y, lookX, big) {
    // två ögon, vita med pupiller
    const h = big ? 3 : 2;
    p.rect(x, y, 2, h, '#ffffff');
    p.rect(x + 3, y, 2, h, '#ffffff');
    const px = lookX > 0 ? 1 : 0;
    p.rect(x + px, y + h - 2 + (big ? 1 : 0), 1, big ? 2 : 2, K);
    p.rect(x + 3 + px, y + h - 2 + (big ? 1 : 0), 1, big ? 2 : 2, K);
  }

  function buildEnemies() {
    // --- Blobb: slemklump ---
    const blobCol = { b: '#4ade6b', d: '#1f9e4f', l: '#b8ffcf' };
    const blob = (col) => (p, f) => {
      const sq = [0, 1, 0, -1][f];
      const rx = 6.6 + sq * 0.9, ry = 5.6 - sq * 0.9;
      const base = 15;
      p.ellipse(8, base - ry + 0.5, rx, ry + 0.5, col.b);
      p.rect(Math.round(8 - rx + 1), base - 2, Math.round(rx * 2 - 2), 3, col.b);
      p.rect(Math.round(8 - rx + 1), base, Math.round(rx * 2 - 2), 1, col.d);
      p.ellipse(8, base - 1, rx - 1, 1.2, col.d);
      p.px(Math.round(8 - rx + 2), Math.round(base - ry * 1.3), col.l);
      p.px(Math.round(8 - rx + 3), Math.round(base - ry * 1.5), col.l);
      p.px(Math.round(8 - rx + 2), Math.round(base - ry * 1.5), col.l);
      eyes(p, 7, Math.round(base - ry - 0.5) + 2, 1, true);
      p.rect(9, base - 2, 3, 1, '#0d4d2b');
      p.outline(K);
    };
    S.fromPainter('blobb', 16, 16, 4, blob(blobCol));
    S.fromPainter('blobb_red', 16, 16, 4, blob({ b: '#ff5a7a', d: '#c02a4f', l: '#ffc2d0' }));
    S.fromPainter('blobb_flat', 16, 16, 1, (p) => {
      p.rect(2, 12, 12, 4, blobCol.b);
      p.rect(2, 15, 12, 1, blobCol.d);
      p.rect(5, 13, 2, 1, K); p.rect(9, 13, 2, 1, K);
      p.outline(K);
    });

    // --- Taggis: igelkott med taggar ---
    S.fromPainter('taggis', 16, 16, 2, (p, f) => {
      // taggar
      const spikes = [[3, 7], [5, 5], [7, 4], [9, 4], [11, 5], [2, 10]];
      for (const s of spikes) p.poly([[s[0] - 2, s[1] + 4], [s[0], s[1] - 2], [s[0] + 2, s[1] + 4]], f ? '#ff9f3d' : '#ff8a2d');
      p.ellipse(8, 10.5, 6.5, 4.5, '#a0673c');
      p.ellipse(7, 9.5, 4.5, 3, '#c98a55');
      // ansikte
      p.ellipse(12.5, 11, 3, 2.6, '#f6d2a8');
      p.px(15, 10, '#ff5a7a');
      p.px(12, 9, K); p.px(12, 10, K);
      // fötter
      p.rect(f ? 4 : 5, 14, 2, 2, '#5a3521');
      p.rect(f ? 10 : 9, 14, 2, 2, '#5a3521');
      p.outline(K);
    });

    // --- Fladder: fladdermus ---
    S.fromPainter('fladder', 20, 14, 3, (p, f) => {
      const wy = [2, 6, 9][f];
      const wing = '#7b3fe4', wingD = '#4a1f9e';
      p.poly([[9, 6], [1, wy], [3, wy + 3], [5, wy + 1], [7, 9]], wing);
      p.poly([[11, 6], [19, wy], [17, wy + 3], [15, wy + 1], [13, 9]], wing);
      p.line(9, 6, 2, wy, wingD);
      p.line(11, 6, 18, wy, wingD);
      p.ellipse(10, 8, 4, 4, '#9b5de5');
      p.poly([[6.5, 6], [7.5, 2], [9, 5]], '#9b5de5');
      p.poly([[11, 5], [12.5, 2], [13.5, 6]], '#9b5de5');
      p.px(8, 7, '#ffd23f'); p.px(12, 7, '#ffd23f');
      p.px(8, 8, '#ffd23f'); p.px(12, 8, '#ffd23f');
      p.px(9, 10, '#ffffff'); p.px(11, 10, '#ffffff');
      p.outline(K);
    });

    // --- Hoppis: groda ---
    S.fromPainter('hoppis', 16, 16, 2, (p, f) => {
      const c = '#3ee6c1', d = '#1b9e86';
      if (f === 0) {
        p.ellipse(8, 11.5, 6.5, 4, c);
        p.rect(2, 13, 4, 3, d); p.rect(10, 13, 4, 3, d);
      } else {
        p.ellipse(8, 9, 5.5, 4.5, c);
        p.thick(4, 11, 2, 15, d, 2); p.thick(12, 11, 14, 15, d, 2);
      }
      const ey = f === 0 ? 6 : 3;
      p.disc(5, ey + 2, 2.4, c); p.disc(11, ey + 2, 2.4, c);
      p.rect(4, ey + 1, 2, 2, '#ffffff'); p.rect(10, ey + 1, 2, 2, '#ffffff');
      p.px(5, ey + 2, K); p.px(11, ey + 2, K);
      p.rect(6, (f === 0 ? 12 : 10), 4, 1, '#0f5e4f');
      p.px(3, f === 0 ? 11 : 9, '#ff8ab0'); p.px(13, f === 0 ? 11 : 9, '#ff8ab0');
      p.outline(K);
    });

    // --- Kanon + raket ---
    S.fromPainter('kanon', 16, 16, 1, (p) => {
      p.rect(1, 1, 14, 14, '#3b3f5c');
      p.rect(1, 1, 14, 1, '#5b6184');
      p.rect(1, 14, 14, 1, '#262840');
      p.disc(8, 8, 4.5, '#1a1c2c');
      p.disc(8, 8, 3, '#50557a');
      p.disc(8, 8, 1.5, '#1a1c2c');
      p.px(3, 3, '#9aa7c2'); p.px(12, 3, '#9aa7c2'); p.px(3, 12, '#9aa7c2'); p.px(12, 12, '#9aa7c2');
      p.outline(K);
    });
    S.fromPainter('raket', 16, 10, 2, (p, f) => {
      p.rect(3, 3, 9, 5, '#ff4d4d');
      p.rect(3, 3, 9, 1, '#ff9a9a');
      p.rect(3, 7, 9, 1, '#b3263a');
      p.poly([[12, 3], [15.5, 5.5], [12, 8]], '#e8ecf5');
      p.poly([[3, 3], [1, 0], [6, 3]], '#e8ecf5');
      p.poly([[3, 8], [1, 10], [6, 8]], '#e8ecf5');
      p.px(9, 5, '#ffffff'); p.px(10, 5, K);
      p.outline(K);
      p.rect(0, 4, 1, 3, f ? '#ffd23f' : '#ff9f1c');
    });

    // --- Neondrönare ---
    S.fromPainter('dronare', 18, 14, 2, (p, f) => {
      p.ellipse(9, 8.5, 6.5, 4, '#2b2d42');
      p.rect(3, 9, 12, 1, '#2ef2ff');
      p.disc(9, 8, 2.2, '#ff3860');
      p.px(8, 7, '#ffc2cf');
      p.rect(8, 2, 2, 3, '#50557a');
      if (f === 0) p.rect(2, 1, 14, 1, '#c7d2ff');
      else p.rect(6, 1, 6, 1, '#c7d2ff');
      p.outline(K);
    });

    // --- Patrullbot ---
    S.fromPainter('robot', 16, 18, 2, (p, f) => {
      p.rect(3, 4, 10, 9, '#c7cbe0');
      p.rect(3, 4, 10, 1, '#eef0fa');
      p.rect(3, 12, 10, 1, '#8f95b2');
      p.rect(5, 6, 7, 3, '#1a1c2c');
      p.rect(8 + (f ? 1 : 0), 7, 3, 1, '#ff3860');
      p.rect(7, 1, 1, 3, '#8f95b2');
      p.px(7, 0, f ? '#ffd23f' : '#ff3860');
      p.disc(5, 15, 2.2, '#3b3f5c'); p.disc(11, 15, 2.2, '#3b3f5c');
      p.px(5, 15, f ? '#9aa7c2' : '#3b3f5c'); p.px(11, 15, f ? '#3b3f5c' : '#9aa7c2');
      p.outline(K);
    });

    // --- Kristallkrabba ---
    const krabba = (crystals) => (p, f) => {
      const c = '#ff5a7a', d = '#c02a4f';
      p.ellipse(10, 9.5, 6.5, 3.5, c);
      if (crystals) {
        p.poly([[5, 8], [7, 3], [9, 8]], '#7af5ff');
        p.poly([[8, 8], [10, 1], [12, 8]], '#b8fbff');
        p.poly([[11, 8], [13, 4], [15, 8]], '#4dd8ff');
      } else {
        p.ellipse(10, 8, 5, 2.5, '#ff8aa0');
      }
      const cy = f ? 4 : 6;
      p.disc(2.5, cy, 2.2, c); p.disc(17.5, cy, 2.2, c);
      p.px(2, cy - 2, d); p.px(18, cy - 2, d);
      p.line(4, 9, 3, cy + 1, c); p.line(16, 9, 17, cy + 1, c);
      p.px(8, 7, '#ffffff'); p.px(12, 7, '#ffffff');
      p.rect(5, 12, 1, 2, d); p.rect(8, 12, 1, 2, d); p.rect(11, 12, 1, 2, d); p.rect(14, 12, 1, 2, d);
      p.outline(K);
    };
    S.fromPainter('krabba', 20, 14, 2, krabba(true));
    S.fromPainter('krabba_naken', 20, 14, 2, krabba(false));

    // --- Spöke ---
    S.fromPainter('spoke', 16, 16, 2, (p, f) => {
      const c = '#f4f0ff';
      p.ellipse(8, 7, 6, 6, c);
      p.rect(2, 7, 12, 6, c);
      const wav = f ? [0, 1, 0, 1, 0, 1] : [1, 0, 1, 0, 1, 0];
      for (let i = 0; i < 6; i++) p.rect(2 + i * 2, 13, 2, wav[i] ? 2 : 1, c);
      p.rect(5, 5, 2, 3, K); p.rect(9, 5, 2, 3, K);
      p.px(5, 5, '#ffffff'); p.px(9, 5, '#ffffff');
      p.ellipse(8, 10, 1.5, 1.5, '#5a3a6b');
      p.px(3, 8, '#ffa3c6'); p.px(12, 8, '#ffa3c6');
      p.outline('#6b5a8a');
    });

    // --- Åskmoln ---
    S.fromPainter('askmoln', 26, 18, 2, (p, f) => {
      const c = f ? '#6b7699' : '#5c6784', l = '#8a96b8';
      p.disc(7, 10, 5, c); p.disc(13, 7, 6, c); p.disc(19, 10, 5, c);
      p.rect(4, 10, 18, 5, c);
      p.disc(11, 5, 2.5, l); p.disc(15, 5, 2, l);
      p.line(8, 8, 11, 9, K); p.line(18, 8, 15, 9, K);
      p.rect(9, 10, 2, 2, '#ffffff'); p.rect(15, 10, 2, 2, '#ffffff');
      p.px(10, 11, K); p.px(15, 11, K);
      p.rect(11, 13, 4, 1, K);
      p.outline(K);
    });
    S.fromPainter('blixt', 10, 24, 2, (p, f) => {
      const c = f ? '#ffffff' : '#fff27a';
      p.poly([[6, 0], [1, 12], [5, 12], [2, 24], [9, 9], [5, 9], [8, 0]], c);
      p.outline('#ffb627');
    });

    // --- Lavabubbla / eldklot ---
    S.fromPainter('lavabubbla', 14, 16, 2, (p, f) => {
      p.ellipse(7, 10, 5.5, 5.5, '#ff3b30');
      p.poly([[2, 9], [4 + f, 1], [7, 6], [10 - f, 0], [12, 9]], '#ff3b30');
      p.ellipse(7, 10.5, 4, 4, '#ff9f1c');
      p.ellipse(7, 11, 2.5, 2.5, '#fff27a');
      p.px(5, 9, K); p.px(9, 9, K); p.px(5, 10, K); p.px(9, 10, K);
      p.outline('#7a1010');
    });
    S.fromPainter('eld', 10, 10, 2, (p, f) => {
      p.disc(5, 5, 4.2, f ? '#ff9f1c' : '#ff3b30');
      p.disc(5, 5, 2.6, '#ffd23f');
      p.disc(5, 5, 1.2, '#ffffff');
    });

    // --- Stenstampen ---
    S.fromPainter('stamp', 26, 28, 2, (p, f) => {
      p.rect(1, 1, 24, 24, '#8a8fa8');
      p.rect(1, 1, 24, 2, '#b8bdd4');
      p.rect(1, 23, 24, 2, '#50546b');
      p.rect(1, 1, 2, 24, '#a3a8c0');
      p.rect(23, 1, 2, 24, '#6b7090');
      for (let i = 0; i < 6; i++) p.poly([[2 + i * 4, 25], [4 + i * 4, 28], [6 + i * 4, 25]], '#c7cbe0');
      // ansikte
      if (f) {
        p.line(5, 7, 10, 9, K); p.line(20, 7, 15, 9, K);
        p.rect(6, 10, 4, 4, '#ffffff'); p.rect(16, 10, 4, 4, '#ffffff');
        p.rect(8, 11, 2, 2, '#ff3860'); p.rect(16, 11, 2, 2, '#ff3860');
        p.rect(7, 17, 12, 4, K);
        for (let i = 0; i < 6; i++) p.rect(7 + i * 2, 17, 1, 2, '#ffffff');
      } else {
        p.rect(6, 9, 4, 2, K); p.rect(16, 9, 4, 2, K);
        p.rect(7, 12, 3, 3, '#ffffff'); p.rect(16, 12, 3, 3, '#ffffff');
        p.px(8, 13, K); p.px(17, 13, K);
        p.rect(9, 18, 8, 2, K);
      }
      p.outline(K);
    });

    // --- Rymdis ---
    S.fromPainter('rymdis', 16, 16, 2, (p, f) => {
      const c = '#7dff6b', d = '#3bb34a';
      const top = f ? 4 : 6;
      p.ellipse(8, top + 5.5, 5.5, f ? 5.5 : 4.5, c);
      p.rect(3, 13, 3, 3, d); p.rect(10, 13, 3, 3, d);
      p.line(8, top, 8, top - 3, d);
      p.disc(8, top - 3, 1.3, '#ff4fa3');
      p.disc(8, top + 5, 2.8, '#ffffff');
      p.disc(8.5, top + 5.5, 1.3, K);
      p.rect(6, top + 9, 4, 1, '#1b6b25');
      p.outline(K);
    });

    // --- UFO ---
    S.fromPainter('ufo', 24, 14, 3, (p, f) => {
      p.ellipse(12, 5.5, 5, 4.5, '#8ff0ff');
      p.disc(12, 6, 1.8, '#7dff6b');
      p.px(12, 5, K);
      p.ellipse(12, 9, 11, 3, '#b8c4dd');
      p.rect(2, 9, 20, 1, '#eef0fa');
      p.rect(3, 11, 18, 1, '#6b7699');
      const cols = ['#ff4d6d', '#ffd23f', '#2ef2ff'];
      for (let i = 0; i < 5; i++) p.px(4 + i * 4, 10, cols[(i + f) % 3]);
      p.outline(K);
    });

    // --- ROBO-KEVIN (boss) ---
    const RKP = {
      K, y: '#ffd23f', Y: '#e59a17', o: '#ff7b24',
      t: '#8f95b2', T: '#50557a', s: '#c7cbe0', S: '#8f95b2', c: '#ff3860',
      b: '#ff3860', B: '#ff8aa0', w: '#ffffff', m: '#ff3860',
    };
    const roboHead = new Painter(14, 14).grid(KEVIN_HEAD, RKP, 1, 1);
    for (let f = 0; f < 3; f++) {
      // (byggs nedan i fromPainter)
    }
    S.fromPainter('robokevin', 40, 44, 3, (p, f) => {
      // jetpack
      p.rect(3, 18, 8, 14, '#ff4d6d');
      p.rect(3, 18, 8, 2, '#ff9aa8');
      p.rect(4, 32, 6, 2, '#50557a');
      // kropp
      p.rect(9, 17, 22, 16, '#c7cbe0');
      p.rect(9, 17, 22, 2, '#eef0fa');
      p.rect(9, 31, 22, 2, '#8f95b2');
      p.rect(14, 21, 12, 8, '#3b3f5c');
      // K-logga
      const L = f === 2 ? '#ffffff' : '#ffd23f';
      p.rect(17, 22, 2, 6, L); p.rect(19, 24, 2, 2, L);
      p.rect(21, 22, 2, 2, L); p.rect(21, 26, 2, 2, L);
      // armar (kanon)
      const armY = f === 1 ? 20 : 22;
      p.rect(31, armY, 7, 5, '#8f95b2');
      p.rect(36, armY + 1, 4, 3, f === 1 ? '#ff3860' : '#50557a');
      p.rect(3, 22, 6, 4, '#8f95b2');
      // ben
      p.rect(12, 33, 6, 8, '#8f95b2'); p.rect(22, 33, 6, 8, '#8f95b2');
      p.rect(10, 40, 9, 4, '#3b3f5c'); p.rect(21, 40, 9, 4, '#3b3f5c');
      // huvud (Kevin-huvud i metall, dubbel storlek)
      for (let y = 0; y < 14; y++)
        for (let x = 0; x < 14; x++) {
          const c = roboHead.get(x, y);
          if (c) p.rect(6 + x * 2, -9 + y * 2, 2, 2, c);
        }
      p.outline(K);
      if (f === 2) {
        for (let i = 0; i < p.p.length; i++) if (p.p[i] && p.p[i] !== K) p.p[i] = U.mix(p.p[i], '#ffffff', 0.55);
      }
    });
  }

  // =====================================================================
  // FÖREMÅL
  // =====================================================================
  function buildItems() {
    // Mynt (10x12, 6 bilder)
    S.fromPainter('mynt', 12, 12, 6, (p, f) => {
      const w = [5, 4, 2, 0.8, 2, 4][f];
      const gold = '#ffd23f', dark = '#d18b0c', light = '#fff4a8';
      p.ellipse(6, 6, Math.max(0.8, w), 5, dark);
      if (w > 1.5) {
        p.ellipse(6, 6, Math.max(0.6, w - 1), 4, gold);
        if (w > 3) {
          p.rect(6, 3, 1, 6, dark);
          p.px(4, 3, light); p.px(4, 4, light);
        } else p.px(5, 4, light);
      }
      p.outline(K);
    });

    // Diamanter i tre färger (rubin, smaragd, safir)
    const gemCols = {
      rod: ['#ff4d6d', '#b3263a', '#ffc2cf'],
      gron: ['#4ade6b', '#1f9e4f', '#c9ffd6'],
      bla: ['#4dc3ff', '#2463d9', '#d6f4ff'],
    };
    for (const name in gemCols) {
      const [c, d, l] = gemCols[name];
      S.fromPainter('gem_' + name, 14, 14, 4, (p, f) => {
        p.poly([[2, 5], [5, 1.5], [9, 1.5], [12, 5], [7, 13]], c);
        p.poly([[2, 5], [12, 5], [7, 13]], d);
        p.poly([[4.5, 5], [9.5, 5], [7, 11]], c);
        p.line(5, 2, 4, 4, l);
        p.rect(6, 2, 2, 1, l);
        p.outline(K);
        if (f === 1) { p.px(10, 2, '#ffffff'); p.px(11, 1, '#ffffff'); p.px(9, 1, '#ffffff'); p.px(10, 0, '#ffffff'); }
        if (f === 2) { p.px(3, 7, '#ffffff'); }
      });
    }

    // Hjärta
    S.fromPainter('hjarta', 13, 12, 2, (p, f) => {
      const r = f ? 3.2 : 2.9;
      p.disc(4, 4.5, r, '#ff4d6d');
      p.disc(9, 4.5, r, '#ff4d6d');
      p.poly([[1, 5], [12, 5], [6.5, 11]], '#ff4d6d');
      p.poly([[3, 7], [10, 7], [6.5, 11]], '#d4284f');
      p.px(3, 3, '#ffffff'); p.px(3, 4, '#ffc2cf'); p.px(4, 3, '#ffc2cf');
      p.outline(K);
    });
    S.fromPainter('hjarta_tom', 13, 12, 1, (p) => {
      p.disc(4, 4.5, 2.9, '#3b2a4a');
      p.disc(9, 4.5, 2.9, '#3b2a4a');
      p.poly([[1, 5], [12, 5], [6.5, 11]], '#3b2a4a');
      p.outline(K);
    });

    // Jetpack (föremål)
    S.fromPainter('jetpack', 16, 18, 1, (p) => {
      p.rect(2, 2, 5, 11, '#ff4d6d'); p.rect(9, 2, 5, 11, '#ff4d6d');
      p.rect(2, 2, 5, 2, '#ffa3b3'); p.rect(9, 2, 5, 2, '#ffa3b3');
      p.rect(2, 11, 5, 2, '#b8264f'); p.rect(9, 11, 5, 2, '#b8264f');
      p.rect(6, 5, 4, 5, '#e8ecf5');
      p.rect(7, 6, 2, 1, '#ffd23f'); p.rect(7, 8, 2, 1, '#ffd23f');
      p.rect(3, 13, 3, 2, '#50557a'); p.rect(10, 13, 3, 2, '#50557a');
      p.rect(3, 15, 3, 2, '#ffd23f'); p.rect(10, 15, 3, 2, '#ffd23f');
      p.px(4, 17, '#ff9f1c'); p.px(11, 17, '#ff9f1c');
      p.outline(K);
    });
    // Bränsle
    S.fromPainter('bransle', 12, 14, 1, (p) => {
      p.rect(2, 3, 8, 10, '#4ade6b');
      p.rect(2, 3, 8, 1, '#b8ffcf');
      p.rect(2, 12, 8, 1, '#1f9e4f');
      p.rect(4, 1, 4, 2, '#9aa7c2');
      p.poly([[7, 4], [4, 8.5], [6, 8.5], [5, 12], [8, 7.5], [6, 7.5]], '#ffd23f');
      p.outline(K);
    });
    // Sköld
    S.fromPainter('skold', 14, 14, 1, (p) => {
      p.poly([[2, 2], [12, 2], [12, 7], [7, 13], [2, 7]], '#4dc3ff');
      p.poly([[7, 2], [12, 2], [12, 7], [7, 13]], '#2463d9');
      p.rect(4, 4, 2, 3, '#d6f4ff');
      p.outline(K);
    });
    // Trippelskott
    S.fromPainter('trippel', 14, 14, 1, (p) => {
      p.disc(7, 7, 6, '#ff9f1c');
      p.disc(7, 7, 4.8, '#ffd23f');
      p.line(4, 7, 10, 7, K); p.line(4, 7, 9, 4, K); p.line(4, 7, 9, 10, K);
      p.px(10, 7, '#ffffff'); p.px(9, 4, '#ffffff'); p.px(9, 10, '#ffffff');
      p.outline(K);
    });
    // Magnet
    S.fromPainter('magnet', 14, 14, 1, (p) => {
      p.thick(3, 3, 3, 9, '#ff4d6d', 3.2);
      p.thick(11, 3, 11, 9, '#ff4d6d', 3.2);
      p.ellipse(7, 9.5, 5.5, 3.5, '#ff4d6d');
      p.ellipse(7, 9, 2.2, 1.5, null);
      p.rect(5, 6, 4, 4, null);
      p.rect(2, 1, 3, 3, '#e8ecf5'); p.rect(10, 1, 3, 3, '#e8ecf5');
      p.outline(K);
    });
    // Discokula (oövervinnlighet)
    S.fromPainter('disco', 14, 16, 4, (p, f) => {
      p.rect(6, 0, 2, 2, '#9aa7c2');
      p.disc(7, 9, 6, '#c7d2ff');
      const cols = ['#ff4fa3', '#ffd23f', '#2ef2ff', '#7dff6b', '#9b5de5', '#ff9f1c'];
      for (let y = 4; y < 15; y += 2)
        for (let x = 2; x < 13; x += 2)
          if (p.get(x, y)) p.rect(x, y, 1, 1, cols[(x + y + f * 2) % cols.length]);
      p.px(4, 6, '#ffffff'); p.px(5, 5, '#ffffff');
      p.outline(K);
    });

    // Checkpoint-flagga
    S.fromPainter('flagga', 18, 34, 4, (p, f) => {
      p.rect(2, 2, 2, 30, '#e8ecf5');
      p.rect(3, 2, 1, 30, '#9aa7c2');
      p.disc(3, 2, 2, '#ffd23f');
      p.rect(0, 31, 6, 3, '#50557a');
      if (f === 0) {
        p.poly([[4, 22], [12, 25], [4, 28]], '#6b7699');
      } else {
        const w = [0, 1, 0, -1][f];
        p.poly([[4, 4], [16, 6 + w], [16, 12 + w], [4, 14]], '#ff4fa3');
        p.poly([[4, 8], [16, 9 + w], [16, 11 + w], [4, 11]], '#ffd23f');
        p.px(9, 7 + w, '#ffffff');
      }
      p.outline(K);
    });

    // Studsmatta / fjäder
    S.fromPainter('fjader', 16, 16, 3, (p, f) => {
      const top = [6, 10, 3][f];
      p.rect(1, top, 14, 3, '#ff4d6d');
      p.rect(1, top, 14, 1, '#ffa3b3');
      const coilH = 14 - (top + 3);
      for (let y = 0; y < coilH; y += 2) p.rect(4 + (y % 4 ? 1 : 0), top + 3 + y, 7, 1, '#c7cbe0');
      p.rect(2, 14, 12, 2, '#50557a');
      p.outline(K);
    });

    // Skylt
    S.fromPainter('skylt', 16, 16, 1, (p) => {
      p.rect(7, 9, 2, 7, '#8a5a32');
      p.rect(1, 1, 14, 9, '#c98a55');
      p.rect(1, 1, 14, 1, '#e8b37a');
      p.rect(1, 9, 14, 1, '#8a5a32');
      p.rect(4, 3, 8, 1, '#5a3521'); p.rect(4, 5, 6, 1, '#5a3521'); p.rect(4, 7, 7, 1, '#5a3521');
      p.outline(K);
    });

    // Skott
    S.fromPainter('skott', 10, 10, 2, (p, f) => {
      p.disc(5, 5, f ? 4 : 3.6, '#2ef2ff');
      p.disc(5, 5, 2.4, '#b8fbff');
      p.disc(5, 5, 1.2, '#ffffff');
    });
    S.fromPainter('fiendeskott', 8, 8, 2, (p, f) => {
      p.disc(4, 4, 3.4, f ? '#ff3860' : '#ff4fa3');
      p.disc(4, 4, 1.8, '#ffd6e0');
    });

    // Kikare-ikon
    S.fromPainter('kikare', 16, 10, 1, (p) => {
      p.disc(4, 5, 3.6, '#3b3f5c'); p.disc(12, 5, 3.6, '#3b3f5c');
      p.rect(6, 3, 4, 3, '#50557a');
      p.disc(4, 5, 2, '#6ff6ff'); p.disc(12, 5, 2, '#6ff6ff');
      p.px(3, 4, '#ffffff'); p.px(11, 4, '#ffffff');
      p.outline(K);
    });

    // Moln-partikel (rök)
    S.fromPainter('rok', 12, 12, 3, (p, f) => {
      const r = [5, 4, 2.6][f];
      p.disc(6, 6, r, '#f4f4f4');
      p.disc(5, 5, r * 0.5, '#ffffff');
      if (r > 3) p.outline('#b8c4dd');
    });

    // Skärmmarkör / sikte
    S.fromPainter('sikte', 11, 11, 2, (p, f) => {
      const c = f ? '#ff3860' : '#ffffff';
      p.rect(5, 0, 1, 3, c); p.rect(5, 8, 1, 3, c);
      p.rect(0, 5, 3, 1, c); p.rect(8, 5, 3, 1, c);
      p.px(5, 5, c);
      p.outline(K);
    });
  }

  Art.build = function () {
    buildHero();
    buildKevin();
    buildEnemies();
    buildItems();
  };

  HK.Art = Art;
})((window.HK = window.HK || {}));
