/* Hitta Kevin — spelmotor: loop, skalning, scener, övergångar, skak. */
(function (HK) {
  'use strict';
  const U = HK.U;
  const W = U.VIEW_W, H = U.VIEW_H;

  const Game = {
    t: 0,
    scene: null,
    trans: null,
    shakeAmt: 0,
    shakeX: 0,
    shakeY: 0,
    hitstop: 0,
    settings: { crt: false, music: true, sfx: true, shake: true },

    init() {
      Game.settings = Object.assign(Game.settings, U.store.get('hittakevin.settings', {}));
      Game.screen = document.getElementById('game');
      Game.sctx = Game.screen.getContext('2d');
      Game.buf = U.makeCanvas(W, H);
      Game.ctx = Game.buf.getContext('2d');
      Game.ctx.imageSmoothingEnabled = false;
      HK.Input.init(Game.screen);
      window.addEventListener('resize', Game.resize);
      if (window.visualViewport) window.visualViewport.addEventListener('resize', Game.resize);
      Game.resize();
      document.addEventListener('visibilitychange', () => {
        if (document.hidden) {
          if (Game.scene && Game.scene.onHide) Game.scene.onHide();
          if (HK.Audio) HK.Audio.suspend(true);
        } else if (HK.Audio) HK.Audio.suspend(false);
      });
      Game.last = performance.now();
      Game.acc = 0;
      requestAnimationFrame(Game.loop);
    },

    saveSettings() {
      U.store.set('hittakevin.settings', Game.settings);
    },

    resize() {
      const dpr = window.devicePixelRatio || 1;
      const vw = window.innerWidth, vh = window.innerHeight;
      Game.screen.width = Math.round(vw * dpr);
      Game.screen.height = Math.round(vh * dpr);
      Game.screen.style.width = vw + 'px';
      Game.screen.style.height = vh + 'px';
      const sw = Game.screen.width, sh = Game.screen.height;
      let s = Math.min(sw / W, sh / H);
      const si = Math.floor(s);
      // heltalsskala om den täcker det mesta av skärmen (skarpast)
      if (si >= 2 && (si * W * si * H) / (s * W * s * H) > 0.8) s = si;
      Game.scale = s;
      Game.ox = Math.floor((sw - W * s) / 2);
      Game.oy = Math.floor((sh - H * s) / 2);
      HK.Input.setViewport(Game.ox, Game.oy, s);
      Game.sctx.imageSmoothingEnabled = false;
      Game.crtPattern = null;
    },

    setScene(s) {
      if (Game.scene && Game.scene.exit) Game.scene.exit();
      Game.scene = s;
      if (s && s.enter) s.enter();
    },

    /** Byt scen med övergång. opts: {type:'iris'|'fade', x, y, x2, y2, dur} */
    transition(fn, opts) {
      opts = opts || {};
      if (Game.trans) return;
      Game.trans = {
        type: opts.type || 'iris',
        phase: 'out',
        t: 0,
        dur: opts.dur || 32,
        x: opts.x == null ? W / 2 : opts.x,
        y: opts.y == null ? H / 2 : opts.y,
        x2: opts.x2, y2: opts.y2,
        fn,
        hold: opts.hold || 6,
      };
    },

    shake(a) {
      if (!Game.settings.shake) return;
      Game.shakeAmt = Math.min(8, Math.max(Game.shakeAmt, a));
    },

    loop(now) {
      const dt = Math.min(0.25, (now - Game.last) / 1000);
      Game.last = now;
      Game.acc += dt;
      const step = 1 / 60;
      let n = 0;
      while (Game.acc >= step && n < 5) {
        Game.update();
        Game.acc -= step;
        n++;
      }
      if (n >= 5) Game.acc = 0;
      Game.render();
      requestAnimationFrame(Game.loop);
    },

    update() {
      const I = HK.Input;
      I.poll();
      if (I.keyHit('KeyM')) {
        Game.settings.music = !Game.settings.music;
        Game.settings.sfx = Game.settings.music;
        Game.saveSettings();
        if (HK.Audio) HK.Audio.applySettings();
      }
      Game.t++;
      // skak
      if (Game.shakeAmt > 0.1) {
        Game.shakeX = Math.round(U.rand(-1, 1) * Game.shakeAmt);
        Game.shakeY = Math.round(U.rand(-1, 1) * Game.shakeAmt);
        Game.shakeAmt *= 0.86;
      } else {
        Game.shakeAmt = 0;
        Game.shakeX = Game.shakeY = 0;
      }
      const tr = Game.trans;
      if (tr) {
        tr.t++;
        if (tr.phase === 'out' && tr.t >= tr.dur) {
          tr.phase = 'hold';
          tr.t = 0;
          const fn = tr.fn;
          tr.fn = null;
          if (fn) fn();
          if (tr.x2 != null) { tr.x = tr.x2; tr.y = tr.y2; }
        } else if (tr.phase === 'hold' && tr.t >= tr.hold) {
          tr.phase = 'in';
          tr.t = 0;
        } else if (tr.phase === 'in' && tr.t >= tr.dur) {
          Game.trans = null;
        }
      }
      if (Game.hitstop > 0) {
        Game.hitstop--;
      } else if (Game.scene && (!tr || tr.phase !== 'hold')) {
        Game.scene.update();
      }
      I.endFrame();
    },

    render() {
      const ctx = Game.ctx;
      // visa muspekaren i menyer, dölj den när spelet ritar ett eget sikte
      const wantCursor = Game.scene && Game.scene.hideCursor && Game.scene.hideCursor() ? 'none' : 'default';
      if (Game.cursor !== wantCursor) {
        Game.cursor = wantCursor;
        Game.screen.style.cursor = wantCursor;
      }
      if (Game.scene) Game.scene.render(ctx);
      Game.renderTransition(ctx);
      const s = Game.sctx;
      s.imageSmoothingEnabled = false;
      s.fillStyle = '#000';
      s.fillRect(0, 0, Game.screen.width, Game.screen.height);
      s.drawImage(Game.buf, 0, 0, W, H, Game.ox, Game.oy, W * Game.scale, H * Game.scale);
      if (Game.settings.crt) Game.renderCRT(s);
    },

    renderTransition(ctx) {
      const tr = Game.trans;
      if (!tr) return;
      let k; // 0 = öppen, 1 = helt täckt
      if (tr.phase === 'out') k = U.ease.inQuad(tr.t / tr.dur);
      else if (tr.phase === 'hold') k = 1;
      else k = 1 - U.ease.outQuad(tr.t / tr.dur);
      if (tr.type === 'fade') {
        ctx.fillStyle = 'rgba(11,8,32,' + k.toFixed(3) + ')';
        ctx.fillRect(0, 0, W, H);
        return;
      }
      const maxR = Math.hypot(Math.max(tr.x, W - tr.x), Math.max(tr.y, H - tr.y)) + 4;
      const r = Math.max(0, (1 - k) * maxR);
      ctx.fillStyle = '#0b0820';
      ctx.beginPath();
      ctx.rect(0, 0, W, H);
      if (r > 0.5) ctx.arc(Math.round(tr.x), Math.round(tr.y), r, 0, Math.PI * 2, true);
      ctx.fill('evenodd');
    },

    renderCRT(s) {
      const w = Game.screen.width, h = Game.screen.height;
      if (!Game.crtPattern) {
        const px = Math.max(2, Math.round(Game.scale / 2));
        const c = U.makeCanvas(1, px * 2);
        const cx = c.getContext('2d');
        cx.fillStyle = 'rgba(0,0,0,0.22)';
        cx.fillRect(0, px, 1, px);
        Game.crtPattern = s.createPattern(c, 'repeat');
      }
      s.save();
      s.fillStyle = Game.crtPattern;
      s.translate(0, Game.oy);
      s.fillRect(Game.ox, 0, W * Game.scale, H * Game.scale);
      s.restore();
      const g = s.createRadialGradient(w / 2, h / 2, Math.min(w, h) * 0.35, w / 2, h / 2, Math.max(w, h) * 0.75);
      g.addColorStop(0, 'rgba(0,0,0,0)');
      g.addColorStop(1, 'rgba(0,0,0,0.45)');
      s.fillStyle = g;
      s.fillRect(0, 0, w, h);
    },
  };

  // ---------- Kamera ----------
  function Camera() {
    this.x = 0;
    this.y = 0;
    this.tx = 0;
    this.ty = 0;
    this.minX = 0;
    this.minY = 0;
    this.maxX = 0;
    this.maxY = 0;
  }
  Camera.prototype = {
    setBounds(w, h) {
      this.maxX = Math.max(0, w - W);
      this.maxY = Math.max(0, h - H);
    },
    clamp() {
      this.x = U.clamp(this.x, this.minX, this.maxX);
      this.y = U.clamp(this.y, this.minY, this.maxY);
    },
    snap(x, y) {
      this.x = x;
      this.y = y;
      this.clamp();
    },
    follow(tx, ty, kx, ky) {
      this.x += (tx - this.x) * kx;
      this.y += (ty - this.y) * ky;
      this.clamp();
    },
    get ix() {
      return Math.round(this.x) + Game.shakeX;
    },
    get iy() {
      return Math.round(this.y) + Game.shakeY;
    },
    visible(x, y, w, h, margin) {
      const m = margin || 0;
      return x + w > this.x - m && x < this.x + W + m && y + h > this.y - m && y < this.y + H + m;
    },
  };

  HK.Game = Game;
  HK.Camera = Camera;
})((window.HK = window.HK || {}));
