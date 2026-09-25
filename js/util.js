/* Hitta Kevin — små hjälpfunktioner som används överallt. */
(function (HK) {
  'use strict';

  const U = {};

  U.TILE = 16;
  U.VIEW_W = 480;
  U.VIEW_H = 270;

  U.clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
  U.lerp = (a, b, t) => a + (b - a) * t;
  U.approach = (v, target, step) =>
    v < target ? Math.min(v + step, target) : Math.max(v - step, target);
  U.sign = (v) => (v > 0 ? 1 : v < 0 ? -1 : 0);
  U.rand = (a, b) => a + Math.random() * (b - a);
  U.randInt = (a, b) => Math.floor(a + Math.random() * (b - a + 1));
  U.pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
  U.chance = (p) => Math.random() < p;
  U.dist = (x1, y1, x2, y2) => Math.hypot(x2 - x1, y2 - y1);
  U.angle = (x1, y1, x2, y2) => Math.atan2(y2 - y1, x2 - x1);

  // Deterministisk slump (för att nivåer och grafik ska se likadana ut varje gång).
  U.rng = function (seed) {
    let s = seed >>> 0;
    return function () {
      s = (s + 0x6d2b79f5) >>> 0;
      let t = s;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  };

  U.hash2 = function (x, y, seed) {
    let h = (x | 0) * 374761393 + (y | 0) * 668265263 + ((seed | 0) * 1442695041);
    h = Math.imul(h ^ (h >>> 13), 1274126177);
    h ^= h >>> 16;
    return (h >>> 0) / 4294967296;
  };

  U.overlap = (a, b) =>
    a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;

  U.ease = {
    linear: (t) => t,
    inQuad: (t) => t * t,
    outQuad: (t) => 1 - (1 - t) * (1 - t),
    inOutQuad: (t) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2),
    outCubic: (t) => 1 - Math.pow(1 - t, 3),
    outBack: (t) => {
      const c1 = 1.70158, c3 = c1 + 1;
      return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
    },
    outElastic: (t) =>
      t === 0 ? 0 : t === 1 ? 1 : Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * ((2 * Math.PI) / 3)) + 1,
    outBounce: (t) => {
      const n1 = 7.5625, d1 = 2.75;
      if (t < 1 / d1) return n1 * t * t;
      if (t < 2 / d1) return n1 * (t -= 1.5 / d1) * t + 0.75;
      if (t < 2.5 / d1) return n1 * (t -= 2.25 / d1) * t + 0.9375;
      return n1 * (t -= 2.625 / d1) * t + 0.984375;
    },
  };

  // ---- Färger ----
  U.hexToRgb = function (hex) {
    let h = hex.replace('#', '');
    if (h.length === 3) h = h.split('').map((c) => c + c).join('');
    const n = parseInt(h, 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  };
  U.rgbToHex = function (r, g, b) {
    const c = (v) => U.clamp(Math.round(v), 0, 255).toString(16).padStart(2, '0');
    return '#' + c(r) + c(g) + c(b);
  };
  U.mix = function (a, b, t) {
    const A = U.hexToRgb(a), B = U.hexToRgb(b);
    return U.rgbToHex(U.lerp(A[0], B[0], t), U.lerp(A[1], B[1], t), U.lerp(A[2], B[2], t));
  };
  U.shade = function (hex, amt) {
    // amt < 0 mörkare, > 0 ljusare
    return amt < 0 ? U.mix(hex, '#10081c', -amt) : U.mix(hex, '#ffffff', amt);
  };
  U.hsl = (h, s, l) => 'hsl(' + ((h % 360) + 360) % 360 + ',' + s + '%,' + l + '%)';
  U.rainbow = function (t, s, l) {
    return U.hsl(Math.floor(t) % 360, s == null ? 95 : s, l == null ? 62 : l);
  };

  U.makeCanvas = function (w, h) {
    const c = document.createElement('canvas');
    c.width = Math.max(1, w | 0);
    c.height = Math.max(1, h | 0);
    const ctx = c.getContext('2d');
    ctx.imageSmoothingEnabled = false;
    return c;
  };

  U.fmtTime = function (frames) {
    const s = Math.floor(frames / 60);
    const m = Math.floor(s / 60);
    const r = s % 60;
    return (m < 10 ? '0' : '') + m + ':' + (r < 10 ? '0' : '') + r;
  };

  U.pad = (n, len) => String(n).padStart(len, '0');

  // Säker lagring (fungerar även i privat läge där localStorage kan kasta fel).
  U.store = {
    get(key, fallback) {
      try {
        const v = window.localStorage.getItem(key);
        return v == null ? fallback : JSON.parse(v);
      } catch (e) {
        return fallback;
      }
    },
    set(key, value) {
      try {
        window.localStorage.setItem(key, JSON.stringify(value));
      } catch (e) {
        /* ignorera */
      }
    },
  };

  HK.U = U;
})((window.HK = window.HK || {}));
