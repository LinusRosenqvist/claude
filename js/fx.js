/* Hitta Kevin — partiklar, konfetti, flytande text. */
(function (HK) {
  'use strict';
  const U = HK.U;

  const RAINBOW = ['#ff4d6d', '#ff9f1c', '#ffd23f', '#7dff6b', '#2ef2ff', '#4d7cff', '#b55cff', '#ff4fa3'];

  const FX = {
    list: [],
    back: [],
    RAINBOW,

    clear() {
      FX.list.length = 0;
      FX.back.length = 0;
    },

    add(p, behind) {
      p.age = 0;
      p.life = p.life || 30;
      p.vx = p.vx || 0;
      p.vy = p.vy || 0;
      p.g = p.g || 0;
      p.drag = p.drag == null ? 1 : p.drag;
      (behind ? FX.back : FX.list).push(p);
      if (FX.list.length > 900) FX.list.splice(0, FX.list.length - 900);
      return p;
    },

    burst(x, y, n, o) {
      o = o || {};
      for (let i = 0; i < n; i++) {
        const a = o.angle != null ? o.angle + U.rand(-(o.spread || Math.PI), o.spread || Math.PI) : U.rand(0, Math.PI * 2);
        const sp = U.rand(o.min || 0.5, o.max || 2.5);
        FX.add({
          type: 'px', x: x + U.rand(-(o.jx || 0), o.jx || 0), y: y + U.rand(-(o.jy || 0), o.jy || 0),
          vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - (o.up || 0),
          g: o.g == null ? 0.12 : o.g, drag: o.drag == null ? 0.96 : o.drag,
          life: U.randInt(o.lifeMin || 16, o.lifeMax || 34),
          size: o.size || U.pick([1, 1, 2]),
          color: o.colors ? U.pick(o.colors) : o.color || '#ffffff',
        }, o.behind);
      }
    },

    dust(x, y, dir) {
      for (let i = 0; i < 4; i++) {
        FX.add({
          type: 'px', x: x + U.rand(-3, 3), y: y - U.rand(0, 2),
          vx: -dir * U.rand(0.2, 1) + U.rand(-0.3, 0.3), vy: -U.rand(0.1, 0.6), g: 0.01, drag: 0.92,
          life: U.randInt(10, 20), size: U.pick([1, 2, 2]), color: U.pick(['#ffffff', '#e8ecf5', '#c7cbe0']), fade: true,
        }, true);
      }
    },

    landPuff(x, y, strength) {
      const n = Math.min(10, 3 + Math.floor(strength * 1.5));
      for (let i = 0; i < n; i++) {
        const side = i % 2 ? 1 : -1;
        FX.add({
          type: 'px', x: x + side * U.rand(1, 5), y: y - 1,
          vx: side * U.rand(0.4, 1.4), vy: -U.rand(0.1, 0.5), g: 0.01, drag: 0.9,
          life: U.randInt(10, 18), size: 2, color: U.pick(['#ffffff', '#e8ecf5']), fade: true,
        }, true);
      }
    },

    sparkle(x, y, color, n) {
      for (let i = 0; i < (n || 1); i++) {
        FX.add({
          type: 'spark', x: x + U.rand(-4, 4), y: y + U.rand(-4, 4), vy: -U.rand(0.1, 0.5), vx: U.rand(-0.3, 0.3),
          life: U.randInt(18, 30), color: color || '#ffffff', drag: 0.95,
        });
      }
    },

    text(x, y, str, color, o) {
      o = o || {};
      return FX.add({
        type: 'text', x, y, str: String(str), color: color || '#ffffff', vy: o.vy == null ? -0.6 : o.vy, drag: 0.95,
        life: o.life || 50, scale: o.scale || 1, rainbow: o.rainbow, pop: true,
      });
    },

    ring(x, y, color, r, life) {
      return FX.add({ type: 'ring', x, y, color: color || '#ffffff', r: r || 16, life: life || 18 });
    },

    smoke(x, y, n) {
      for (let i = 0; i < (n || 5); i++) {
        FX.add({
          type: 'sprite', name: 'rok', x: x + U.rand(-6, 6), y: y + U.rand(-6, 6),
          vx: U.rand(-0.6, 0.6), vy: U.rand(-0.9, -0.1), drag: 0.93, life: U.randInt(20, 34), frames: 3,
        });
      }
    },

    confetti(x, y, n, o) {
      o = o || {};
      for (let i = 0; i < n; i++) {
        const a = o.angle != null ? o.angle + U.rand(-0.9, 0.9) : U.rand(0, Math.PI * 2);
        const sp = U.rand(o.min || 1.5, o.max || 5);
        FX.add({
          type: 'confetti', x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - (o.up || 2),
          g: 0.06, drag: 0.97, life: U.randInt(80, 150), color: U.pick(RAINBOW), phase: U.rand(0, 6), spin: U.rand(0.1, 0.3),
        });
      }
    },

    debris(x, y, img, n) {
      for (let i = 0; i < (n || 4); i++) {
        const sx = (i % 2) * 8, sy = Math.floor(i / 2) * 8;
        FX.add({
          type: 'chunk', img, sx, sy, x: x + sx, y: y + sy,
          vx: (i % 2 ? 1 : -1) * U.rand(0.8, 1.8), vy: -U.rand(2.5, 4.5) + (sy ? 1 : 0), g: 0.25, drag: 0.99,
          life: 60, rot: 0, vr: U.rand(-0.3, 0.3),
        });
      }
    },

    update() {
      upd(FX.list);
      upd(FX.back);
    },

    draw(ctx, cam, behind) {
      const arr = behind ? FX.back : FX.list;
      const ox = cam ? cam.ix : 0, oy = cam ? cam.iy : 0;
      for (let i = 0; i < arr.length; i++) drawP(ctx, arr[i], ox, oy);
    },
  };

  function upd(arr) {
    for (let i = arr.length - 1; i >= 0; i--) {
      const p = arr[i];
      p.age++;
      p.vy += p.g;
      p.vx *= p.drag;
      p.vy *= p.drag;
      p.x += p.vx;
      p.y += p.vy;
      if (p.vr) p.rot += p.vr;
      if (p.age >= p.life) arr.splice(i, 1);
    }
  }

  function drawP(ctx, p, ox, oy) {
    const k = p.age / p.life;
    const x = Math.round(p.x - ox), y = Math.round(p.y - oy);
    switch (p.type) {
      case 'px': {
        let s = p.size;
        if (k > 0.7 && s > 1) s = Math.max(1, Math.round(s * (1 - (k - 0.7) / 0.3)));
        if (p.fade) ctx.globalAlpha = 1 - k;
        ctx.fillStyle = p.color;
        if (p.rain) ctx.fillRect(x, y, 1, 4);
        else ctx.fillRect(x, y, s, s);
        ctx.globalAlpha = 1;
        break;
      }
      case 'spark': {
        const on = Math.floor(p.age / 3) % 2 === 0 || k < 0.5;
        if (!on) break;
        ctx.fillStyle = p.color;
        const s = k < 0.6 ? 2 : 1;
        ctx.fillRect(x, y - s, 1, s * 2 + 1);
        ctx.fillRect(x - s, y, s * 2 + 1, 1);
        break;
      }
      case 'text': {
        let sc = p.scale;
        const pop = p.age < 6 ? 1 + (6 - p.age) * 0.08 : 1;
        HK.Font.draw(ctx, p.str, x, y, {
          align: 'center', color: p.color, scale: sc, alpha: k > 0.75 ? 1 - (k - 0.75) / 0.25 : 1,
          rainbow: p.rainbow ? p.age * 8 : null,
        });
        void pop;
        break;
      }
      case 'ring': {
        const r = Math.round(p.r * U.ease.outQuad(k));
        ctx.fillStyle = p.color;
        ctx.globalAlpha = 1 - k;
        const n = Math.max(8, Math.floor(r * 4));
        for (let i = 0; i < n; i++) {
          const a = (i / n) * Math.PI * 2;
          ctx.fillRect(Math.round(x + Math.cos(a) * r), Math.round(y + Math.sin(a) * r), 1, 1);
        }
        ctx.globalAlpha = 1;
        break;
      }
      case 'sprite': {
        const f = Math.min(p.frames - 1, Math.floor(k * p.frames));
        HK.Sprites.draw(ctx, p.name, f, x, y, { ay: 0.5 });
        break;
      }
      case 'confetti': {
        const w = Math.abs(Math.cos(p.phase + p.age * p.spin)) > 0.4 ? 2 : 1;
        ctx.fillStyle = p.color;
        if (k > 0.8) ctx.globalAlpha = 1 - (k - 0.8) / 0.2;
        ctx.fillRect(x, y, w, 3 - w);
        ctx.globalAlpha = 1;
        p.vx += Math.sin(p.age * 0.1 + p.phase) * 0.03;
        break;
      }
      case 'chunk': {
        ctx.save();
        ctx.translate(x + 4, y + 4);
        ctx.rotate(p.rot);
        ctx.drawImage(p.img, p.sx, p.sy, 8, 8, -4, -4, 8, 8);
        ctx.restore();
        break;
      }
    }
  }

  HK.FX = FX;
})((window.HK = window.HK || {}));
