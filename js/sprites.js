/* Hitta Kevin — pixelmålare och spritesystem. */
(function (HK) {
  'use strict';
  const U = HK.U;

  // ---------- Painter: rita pixelkonst i kod ----------
  function Painter(w, h) {
    this.w = w;
    this.h = h;
    this.p = new Array(w * h).fill(null);
    this.tx = 0;
    this.ty = 0;
  }
  Painter.prototype = {
    px(x, y, c) {
      x = Math.round(x + this.tx);
      y = Math.round(y + this.ty);
      if (x < 0 || y < 0 || x >= this.w || y >= this.h) return this;
      this.p[y * this.w + x] = c;
      return this;
    },
    get(x, y) {
      if (x < 0 || y < 0 || x >= this.w || y >= this.h) return null;
      return this.p[y * this.w + x];
    },
    rect(x, y, w, h, c) {
      for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) this.px(x + i, y + j, c);
      return this;
    },
    ellipse(cx, cy, rx, ry, c) {
      for (let y = Math.floor(cy - ry - 1); y <= Math.ceil(cy + ry + 1); y++) {
        for (let x = Math.floor(cx - rx - 1); x <= Math.ceil(cx + rx + 1); x++) {
          const dx = (x + 0.5 - cx) / rx, dy = (y + 0.5 - cy) / ry;
          if (dx * dx + dy * dy <= 1) this.px(x, y, c);
        }
      }
      return this;
    },
    disc(cx, cy, r, c) {
      return this.ellipse(cx, cy, r, r, c);
    },
    line(x0, y0, x1, y1, c) {
      x0 = Math.round(x0); y0 = Math.round(y0); x1 = Math.round(x1); y1 = Math.round(y1);
      const dx = Math.abs(x1 - x0), dy = -Math.abs(y1 - y0);
      const sx = x0 < x1 ? 1 : -1, sy = y0 < y1 ? 1 : -1;
      let err = dx + dy;
      for (;;) {
        this.px(x0, y0, c);
        if (x0 === x1 && y0 === y1) break;
        const e2 = 2 * err;
        if (e2 >= dy) { err += dy; x0 += sx; }
        if (e2 <= dx) { err += dx; y0 += sy; }
      }
      return this;
    },
    thick(x0, y0, x1, y1, c, t) {
      const r = (t || 2) / 2;
      const n = Math.max(1, Math.ceil(Math.hypot(x1 - x0, y1 - y0) * 2));
      for (let i = 0; i <= n; i++) {
        const x = U.lerp(x0, x1, i / n), y = U.lerp(y0, y1, i / n);
        this.ellipse(x, y, r, r, c);
      }
      return this;
    },
    poly(points, c) {
      // enkel scanline-fyllning
      let minY = Infinity, maxY = -Infinity;
      for (const p of points) { minY = Math.min(minY, p[1]); maxY = Math.max(maxY, p[1]); }
      for (let y = Math.floor(minY); y <= Math.ceil(maxY); y++) {
        const yc = y + 0.5;
        const xs = [];
        for (let i = 0; i < points.length; i++) {
          const a = points[i], b = points[(i + 1) % points.length];
          if ((a[1] <= yc && b[1] > yc) || (b[1] <= yc && a[1] > yc)) {
            xs.push(a[0] + ((yc - a[1]) / (b[1] - a[1])) * (b[0] - a[0]));
          }
        }
        xs.sort((p, q) => p - q);
        for (let i = 0; i + 1 < xs.length; i += 2) {
          for (let x = Math.ceil(xs[i] - 0.5); x <= Math.floor(xs[i + 1] - 0.5); x++) this.px(x, y, c);
        }
      }
      return this;
    },
    grid(rows, pal, ox, oy) {
      ox = ox || 0;
      oy = oy || 0;
      for (let y = 0; y < rows.length; y++) {
        const r = rows[y];
        for (let x = 0; x < r.length; x++) {
          const ch = r[x];
          if (ch === '.' || ch === ' ') continue;
          const c = pal[ch];
          if (c === undefined) continue;
          this.px(ox + x, oy + y, c);
        }
      }
      return this;
    },
    outline(c, diag) {
      const src = this.p.slice();
      for (let y = 0; y < this.h; y++) {
        for (let x = 0; x < this.w; x++) {
          if (src[y * this.w + x]) continue;
          let hit = false;
          for (let dy = -1; dy <= 1 && !hit; dy++) {
            for (let dx = -1; dx <= 1; dx++) {
              if (!dx && !dy) continue;
              if (!diag && dx && dy) continue;
              const xx = x + dx, yy = y + dy;
              if (xx < 0 || yy < 0 || xx >= this.w || yy >= this.h) continue;
              if (src[yy * this.w + xx]) { hit = true; break; }
            }
          }
          if (hit) this.p[y * this.w + x] = c;
        }
      }
      return this;
    },
    // Byt färg a -> b
    swap(a, b) {
      for (let i = 0; i < this.p.length; i++) if (this.p[i] === a) this.p[i] = b;
      return this;
    },
    // Skuggning: pixlar av färg c nära nedre högra kanten blir mörkare
    shadeEdge(c, dark, fromRight) {
      const src = this.p.slice();
      for (let y = 0; y < this.h; y++) {
        for (let x = 0; x < this.w; x++) {
          if (src[y * this.w + x] !== c) continue;
          const nx = x + (fromRight ? 1 : -1);
          const below = y + 1 < this.h ? src[(y + 1) * this.w + x] : null;
          const side = nx >= 0 && nx < this.w ? src[y * this.w + nx] : null;
          if (below !== c || side !== c) {
            if (below !== c) this.p[y * this.w + x] = dark;
          }
        }
      }
      return this;
    },
    flipX() {
      const q = new Array(this.p.length);
      for (let y = 0; y < this.h; y++) for (let x = 0; x < this.w; x++) q[y * this.w + x] = this.p[y * this.w + (this.w - 1 - x)];
      this.p = q;
      return this;
    },
    clone() {
      const c = new Painter(this.w, this.h);
      c.p = this.p.slice();
      return c;
    },
    stamp(other, ox, oy) {
      for (let y = 0; y < other.h; y++)
        for (let x = 0; x < other.w; x++) {
          const c = other.p[y * other.w + x];
          if (c) this.px(ox + x, oy + y, c);
        }
      return this;
    },
    toCanvas() {
      const c = U.makeCanvas(this.w, this.h);
      const ctx = c.getContext('2d');
      const img = ctx.createImageData(this.w, this.h);
      const cache = {};
      for (let i = 0; i < this.p.length; i++) {
        const col = this.p[i];
        if (!col) continue;
        let rgb = cache[col];
        if (!rgb) rgb = cache[col] = U.hexToRgb(col);
        img.data[i * 4] = rgb[0];
        img.data[i * 4 + 1] = rgb[1];
        img.data[i * 4 + 2] = rgb[2];
        img.data[i * 4 + 3] = 255;
      }
      ctx.putImageData(img, 0, 0);
      return c;
    },
  };

  function silhouette(canvas, color) {
    const c = U.makeCanvas(canvas.width, canvas.height);
    const ctx = c.getContext('2d');
    ctx.drawImage(canvas, 0, 0);
    ctx.globalCompositeOperation = 'source-in';
    ctx.fillStyle = color;
    ctx.fillRect(0, 0, c.width, c.height);
    return c;
  }

  // ---------- Spritebibliotek ----------
  const sheets = Object.create(null);

  const Sprites = {
    Painter,
    sheets,

    add(name, canvases) {
      const frames = Array.isArray(canvases) ? canvases : [canvases];
      sheets[name] = { frames, w: frames[0].width, h: frames[0].height, flash: null };
      return sheets[name];
    },

    // Bygg från rutnät: frames = [[rader...], [rader...]]
    fromGrids(name, pal, frames, outlineColor) {
      const canv = frames.map((rows) => {
        const w = Math.max.apply(null, rows.map((r) => r.length));
        const p = new Painter(w, rows.length).grid(rows, pal);
        if (outlineColor) p.outline(outlineColor);
        return p.toCanvas();
      });
      return Sprites.add(name, canv);
    },

    fromPainter(name, w, h, n, fn) {
      const canv = [];
      for (let i = 0; i < n; i++) {
        const p = new Painter(w, h);
        fn(p, i);
        canv.push(p.toCanvas());
      }
      return Sprites.add(name, canv);
    },

    get(name) {
      return sheets[name];
    },

    frame(name, i) {
      const s = sheets[name];
      if (!s) return null;
      const n = s.frames.length;
      return s.frames[((i % n) + n) % n];
    },

    flashFrame(name, i, color) {
      const s = sheets[name];
      if (!s) return null;
      const key = color || '#ffffff';
      if (!s.flash) s.flash = {};
      if (!s.flash[key]) s.flash[key] = s.frames.map((f) => silhouette(f, key));
      const n = s.frames.length;
      return s.flash[key][((i % n) + n) % n];
    },

    /**
     * Rita en sprite. (x, y) är ankarpunkten; standard är nederkant mitt (ax=.5, ay=1).
     * opts: flip, sx, sy, rot, alpha, ax, ay, flash (färg), silhouette
     */
    draw(ctx, name, i, x, y, opts) {
      opts = opts || {};
      const s = sheets[name];
      if (!s) return;
      const img = opts.flash ? Sprites.flashFrame(name, i, opts.flash) : Sprites.frame(name, i);
      Sprites.drawImg(ctx, img, x, y, opts);
    },

    drawImg(ctx, img, x, y, opts) {
      opts = opts || {};
      const ax = opts.ax == null ? 0.5 : opts.ax;
      const ay = opts.ay == null ? 1 : opts.ay;
      const sx = opts.sx == null ? 1 : opts.sx;
      const sy = opts.sy == null ? 1 : opts.sy;
      const rot = opts.rot || 0;
      const alpha = opts.alpha == null ? 1 : opts.alpha;
      if (alpha <= 0) return;
      const w = img.width, h = img.height;
      const prev = ctx.globalAlpha;
      if (alpha !== 1) ctx.globalAlpha = prev * alpha;
      if (!opts.flip && sx === 1 && sy === 1 && !rot) {
        ctx.drawImage(img, Math.round(x - ax * w), Math.round(y - ay * h));
      } else {
        ctx.save();
        ctx.translate(Math.round(x), Math.round(y));
        if (rot) ctx.rotate(rot);
        ctx.scale(opts.flip ? -sx : sx, sy);
        ctx.drawImage(img, -Math.round(ax * w), -Math.round(ay * h));
        ctx.restore();
      }
      if (alpha !== 1) ctx.globalAlpha = prev;
    },
  };

  HK.Sprites = Sprites;
})((window.HK = window.HK || {}));
