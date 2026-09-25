// Litet verktyg för att bygga nivåer i kod och skriva ut dem som ASCII-kartor.
'use strict';

const TILE_CHARS = '#BX?$!JU=^~I<>%:,;CLF.';

class Lvl {
  constructor(meta) {
    this.meta = Object.assign({}, meta);
    this.w = meta.w;
    this.h = meta.h;
    this.g = [];
    for (let y = 0; y < this.h; y++) this.g.push(new Array(this.w).fill('.'));
    this.signList = [];
    this.overlay = [];
    this.pupList = [];
    this.platList = [];
  }
  in(x, y) {
    return x >= 0 && y >= 0 && x < this.w && y < this.h;
  }
  set(x, y, ch) {
    if (!this.in(x, y)) throw new Error(`${this.meta.id}: utanför kartan (${x},${y}) '${ch}'`);
    const cur = this.g[y][x];
    // Föremål inne i hemliga väggar/bakgrundsväggar läggs i ett eget lager så att väggen finns kvar.
    if ((cur === ':' || cur === ',') && !TILE_CHARS.includes(ch)) {
      this.overlay = this.overlay.filter((o) => o[0] !== x || o[1] !== y);
      this.overlay.push([x, y, ch]);
      return this;
    }
    this.g[y][x] = ch;
    return this;
  }
  get(x, y) {
    return this.in(x, y) ? this.g[y][x] : '#';
  }
  fill(x0, y0, x1, y1, ch) {
    for (let y = Math.min(y0, y1); y <= Math.max(y0, y1); y++)
      for (let x = Math.min(x0, x1); x <= Math.max(x0, x1); x++) this.set(x, y, ch);
    return this;
  }
  // Mark från rad top ner till botten
  ground(x0, x1, top, ch) {
    return this.fill(x0, top, x1, this.h - 1, ch || '#');
  }
  clear(x0, y0, x1, y1) {
    return this.fill(x0, y0, x1, y1, '.');
  }
  pit(x0, x1, keepBottom) {
    for (let x = x0; x <= x1; x++) for (let y = 0; y < this.h - (keepBottom || 0); y++) if ('#%:,'.includes(this.g[y][x])) this.g[y][x] = '.';
    return this;
  }
  // Skriv en sträng vågrätt. Mellanslag = hoppa över.
  str(x, y, s) {
    for (let i = 0; i < s.length; i++) if (s[i] !== ' ') this.set(x + i, y, s[i]);
    return this;
  }
  col(x, y, s) {
    for (let i = 0; i < s.length; i++) if (s[i] !== ' ') this.set(x, y + i, s[i]);
    return this;
  }
  block(x, y, rows) {
    rows.forEach((r, i) => this.str(x, y + i, r));
    return this;
  }
  coins(x, y, n, step) {
    step = step || 1;
    for (let i = 0; i < n; i++) this.set(x + i * step, y, 'o');
    return this;
  }
  coinArc(x, y, n) {
    for (let i = 0; i < n; i++) {
      const k = (i / (n - 1)) * 2 - 1;
      this.set(x + i, y - Math.round((1 - k * k) * 2), 'o');
    }
    return this;
  }
  // Trappa: n steg, dir=1 uppåt åt höger
  stairs(x, base, n, dir, ch) {
    ch = ch || 'X';
    for (let i = 0; i < n; i++) {
      const cx = dir > 0 ? x + i : x + n - 1 - i;
      this.fill(cx, base - i, cx, base, ch);
    }
    return this;
  }
  plat(x, y, w, ch) {
    return this.fill(x, y, x + w - 1, y, ch || '=');
  }
  sign(x, y, text) {
    this.set(x, y, 'n');
    this.signList.push({ x, y, text });
    return this;
  }
  pup(x, y, kind) {
    this.set(x, y, '!');
    this.pupList.push({ x, y, kind });
    return this;
  }
  mover(x, y, w, kind, range, speed, phase) {
    this.fill(x, y, x + w - 1, y, kind === 'v' ? '|' : '-');
    this.platList.push({ x, y, range, speed, phase });
    return this;
  }
  rows() {
    return this.g.map((r) => r.join(''));
  }
  def() {
    const rm = (a, b) => a.y - b.y || a.x - b.x;
    const d = Object.assign({}, this.meta);
    delete d.w;
    delete d.h;
    d.signs = this.signList.slice().sort(rm).map((s) => s.text);
    d.powerups = this.pupList.slice().sort(rm).map((s) => s.kind);
    d.platforms = this.platList.slice().sort(rm).map((p) => {
      const o = {};
      if (p.range != null) o.range = p.range;
      if (p.speed != null) o.speed = p.speed;
      if (p.phase != null) o.phase = p.phase;
      return o;
    });
    if (this.overlay.length) d.overlay = this.overlay.slice().sort((a, b) => a[1] - b[1] || a[0] - b[0]);
    d.rows = this.rows();
    return d;
  }
}

module.exports = { Lvl };
