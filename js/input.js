/* Hitta Kevin — tangentbord, mus, touch och handkontroll. */
(function (HK) {
  'use strict';
  const U = HK.U;

  const BIND = {
    left: ['KeyA', 'ArrowLeft'],
    right: ['KeyD', 'ArrowRight'],
    up: ['KeyW', 'ArrowUp'],
    down: ['KeyS', 'ArrowDown'],
    jump: ['Space'],
    shoot: ['KeyJ', 'KeyF'],
    look: ['KeyE', 'KeyQ'],
    sprint: ['ShiftLeft', 'ShiftRight'],
    pause: ['Escape', 'KeyP'],
    confirm: ['Enter', 'Space', 'NumpadEnter'],
    back: ['Escape', 'Backspace'],
    mute: ['KeyM'],
    restart: ['KeyR'],
  };
  const GAME_KEYS = new Set(['Space', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Tab']);

  const keys = Object.create(null);
  const pressed = Object.create(null);
  const released = Object.create(null);

  const mouse = {
    x: U.VIEW_W / 2, y: U.VIEW_H / 2,
    down: [false, false, false], pressed: [false, false, false], released: [false, false, false],
    wheel: 0, active: false, lastMove: -9999, inside: true,
  };

  const touch = {
    enabled: false, visible: false,
    held: Object.create(null), pressed: Object.create(null),
    aim: null, aimPressed: false, pointers: new Map(),
  };

  const pad = {
    connected: false, held: Object.create(null), pressed: Object.create(null), prev: Object.create(null),
    ax: 0, ay: 0, aimX: 0, aimY: 0,
  };

  let viewport = { x: 0, y: 0, scale: 1 };
  let frameCount = 0;

  const Input = {
    BIND, keys, mouse, touch, pad,
    lastDevice: 'keyboard',
    shootSource: 'mouse',
    anyHit: false,
    typed: [],

    init(canvas) {
      Input.canvas = canvas;
      window.addEventListener('keydown', onKeyDown, { passive: false });
      window.addEventListener('keyup', onKeyUp);
      window.addEventListener('blur', clearAll);
      document.addEventListener('visibilitychange', () => { if (document.hidden) clearAll(); });

      window.addEventListener('mousemove', onMouseMove);
      window.addEventListener('mousedown', onMouseDown);
      window.addEventListener('mouseup', onMouseUp);
      window.addEventListener('wheel', (e) => { mouse.wheel += Math.sign(e.deltaY); }, { passive: true });
      canvas.addEventListener('contextmenu', (e) => e.preventDefault());
      window.addEventListener('contextmenu', (e) => { if (e.target === canvas) e.preventDefault(); });

      setupTouch();
      window.addEventListener('gamepadconnected', () => { pad.connected = true; });
      window.addEventListener('gamepaddisconnected', () => { pad.connected = false; });
    },

    setViewport(x, y, scale) {
      viewport = { x, y, scale };
    },

    toGame(clientX, clientY) {
      const dpr = window.devicePixelRatio || 1;
      return {
        x: (clientX * dpr - viewport.x) / viewport.scale,
        y: (clientY * dpr - viewport.y) / viewport.scale,
      };
    },

    poll() {
      frameCount++;
      pollGamepad();
    },

    held(action) {
      const b = BIND[action];
      if (b) for (let i = 0; i < b.length; i++) if (keys[b[i]]) return true;
      if (touch.held[action]) return true;
      if (pad.held[action]) return true;
      if (action === 'shoot' && (mouse.down[0] || touch.aim)) return true;
      if (action === 'look' && mouse.down[2]) return true;
      if (action === 'confirm' && (touch.held.jump || pad.held.jump)) return true;
      return false;
    },

    hit(action) {
      const b = BIND[action];
      if (b) for (let i = 0; i < b.length; i++) if (pressed[b[i]]) return true;
      if (touch.pressed[action]) return true;
      if (pad.pressed[action]) return true;
      if (action === 'shoot' && (mouse.pressed[0] || touch.aimPressed)) return true;
      if (action === 'look' && mouse.pressed[2]) return true;
      if (action === 'confirm' && (touch.pressed.jump || pad.pressed.jump)) return true;
      return false;
    },

    keyHit(code) {
      return !!pressed[code];
    },

    click() {
      return mouse.pressed[0];
    },

    // Riktning från tangenter/spak: -1..1
    axisX() {
      let v = 0;
      if (Input.held('left')) v -= 1;
      if (Input.held('right')) v += 1;
      if (Math.abs(pad.ax) > 0.3 && v === 0) v = pad.ax;
      return U.clamp(v, -1, 1);
    },

    endFrame() {
      for (const k in pressed) delete pressed[k];
      for (const k in released) delete released[k];
      for (const k in touch.pressed) delete touch.pressed[k];
      mouse.pressed[0] = mouse.pressed[1] = mouse.pressed[2] = false;
      mouse.released[0] = mouse.released[1] = mouse.released[2] = false;
      mouse.wheel = 0;
      touch.aimPressed = false;
      Input.anyHit = false;
      Input.typed.length = 0;
    },

    showTouch(on) {
      touch.visible = on;
      if (Input.touchEl) Input.touchEl.style.display = on ? 'block' : 'none';
    },
  };

  function onKeyDown(e) {
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    const code = e.code;
    if (GAME_KEYS.has(code)) e.preventDefault();
    if (!keys[code]) {
      pressed[code] = true;
      Input.anyHit = true;
      if (BIND.shoot.indexOf(code) >= 0) Input.shootSource = 'button';
      if (e.key && e.key.length === 1) Input.typed.push(e.key);
    }
    keys[code] = true;
    Input.lastDevice = 'keyboard';
    if (HK.Audio) HK.Audio.unlock();
  }

  function onKeyUp(e) {
    keys[e.code] = false;
    released[e.code] = true;
  }

  function clearAll() {
    for (const k in keys) keys[k] = false;
    mouse.down[0] = mouse.down[1] = mouse.down[2] = false;
    for (const k in touch.held) touch.held[k] = false;
    touch.pointers.clear();
    touch.aim = null;
  }

  function updateMousePos(e) {
    const p = Input.toGame(e.clientX, e.clientY);
    mouse.x = p.x;
    mouse.y = p.y;
    mouse.inside = p.x >= 0 && p.y >= 0 && p.x < U.VIEW_W && p.y < U.VIEW_H;
  }

  function onMouseMove(e) {
    if (e.sourceCapabilities && e.sourceCapabilities.firesTouchEvents) return;
    updateMousePos(e);
    mouse.active = true;
    mouse.lastMove = frameCount;
    if (Input.lastDevice !== 'touch') Input.lastDevice = 'mouse';
  }

  function onMouseDown(e) {
    if (e.sourceCapabilities && e.sourceCapabilities.firesTouchEvents) return;
    if (touch.visible && e.target !== Input.canvas) return;
    updateMousePos(e);
    const b = e.button === 2 ? 2 : e.button === 1 ? 1 : 0;
    if (!mouse.down[b]) mouse.pressed[b] = true;
    mouse.down[b] = true;
    mouse.active = true;
    Input.lastDevice = 'mouse';
    Input.anyHit = true;
    if (b === 0) Input.shootSource = 'mouse';
    if (HK.Audio) HK.Audio.unlock();
  }

  function onMouseUp(e) {
    const b = e.button === 2 ? 2 : e.button === 1 ? 1 : 0;
    mouse.down[b] = false;
    mouse.released[b] = true;
  }

  // ---------------- Touch ----------------
  const TOUCH_BUTTONS = [
    { id: 'left', label: '◀', cls: 'tb-left' },
    { id: 'right', label: '▶', cls: 'tb-right' },
    { id: 'down', label: '▼', cls: 'tb-down' },
    { id: 'jump', label: 'HOPP', cls: 'tb-jump' },
    { id: 'shoot', label: 'SKJUT', cls: 'tb-shoot' },
    { id: 'look', label: 'KIKARE', cls: 'tb-look' },
    { id: 'pause', label: 'II', cls: 'tb-pause' },
  ];

  function setupTouch() {
    const el = document.createElement('div');
    el.id = 'touch';
    el.style.display = 'none';
    for (const b of TOUCH_BUTTONS) {
      const d = document.createElement('div');
      d.className = 'tb ' + b.cls;
      d.dataset.action = b.id;
      d.textContent = b.label;
      el.appendChild(d);
    }
    document.body.appendChild(el);
    Input.touchEl = el;

    const onFirstTouch = () => {
      touch.enabled = true;
      Input.lastDevice = 'touch';
      Input.showTouch(true);
      if (HK.Audio) HK.Audio.unlock();
    };
    window.addEventListener('touchstart', onFirstTouch, { passive: true });

    const target = document.body;
    target.addEventListener('pointerdown', (e) => {
      if (e.pointerType !== 'touch') return;
      e.preventDefault();
      onFirstTouch();
      handlePointer(e, true);
    }, { passive: false });
    target.addEventListener('pointermove', (e) => {
      if (e.pointerType !== 'touch') return;
      if (touch.pointers.has(e.pointerId)) handlePointer(e, false);
    }, { passive: false });
    const up = (e) => {
      if (e.pointerType !== 'touch') return;
      touch.pointers.delete(e.pointerId);
      recomputeTouch();
    };
    target.addEventListener('pointerup', up);
    target.addEventListener('pointercancel', up);
  }

  function buttonAt(x, y) {
    const els = Input.touchEl ? Input.touchEl.children : [];
    for (let i = 0; i < els.length; i++) {
      const r = els[i].getBoundingClientRect();
      const pad2 = 8;
      if (x >= r.left - pad2 && x <= r.right + pad2 && y >= r.top - pad2 && y <= r.bottom + pad2) return els[i].dataset.action;
    }
    return null;
  }

  function handlePointer(e, isDown) {
    const action = touch.visible ? buttonAt(e.clientX, e.clientY) : null;
    const prev = touch.pointers.get(e.pointerId);
    const rec = { action, x: e.clientX, y: e.clientY, down: isDown || (prev && prev.down) };
    if (!action) {
      const p = Input.toGame(e.clientX, e.clientY);
      rec.gx = p.x;
      rec.gy = p.y;
      if (isDown) {
        touch.aimPressed = true;
        mouse.x = p.x;
        mouse.y = p.y;
        mouse.pressed[0] = true; // låter menyer reagera på tryck
      }
    }
    touch.pointers.set(e.pointerId, rec);
    recomputeTouch();
  }

  function recomputeTouch() {
    const now = Object.create(null);
    let aim = null;
    for (const rec of touch.pointers.values()) {
      if (rec.action) now[rec.action] = true;
      else aim = { x: rec.gx, y: rec.gy };
    }
    for (const b of TOUCH_BUTTONS) {
      const was = !!touch.held[b.id];
      const is = !!now[b.id];
      if (is && !was) {
        touch.pressed[b.id] = true;
        if (b.id === 'shoot') Input.shootSource = 'button';
        Input.anyHit = true;
      }
      touch.held[b.id] = is;
    }
    if (aim && !touch.aim) Input.shootSource = 'tap';
    touch.aim = aim;
    touch.held.tapshoot = !!aim;
    const els = Input.touchEl ? Input.touchEl.children : [];
    for (let i = 0; i < els.length; i++) els[i].classList.toggle('on', !!now[els[i].dataset.action]);
  }

  // ---------------- Handkontroll ----------------
  function pollGamepad() {
    const pads = navigator.getGamepads ? navigator.getGamepads() : [];
    let gp = null;
    for (let i = 0; i < pads.length; i++) if (pads[i] && pads[i].connected) { gp = pads[i]; break; }
    const h = pad.held;
    for (const k in h) pad.prev[k] = h[k];
    for (const k in pad.pressed) delete pad.pressed[k];
    if (!gp) {
      for (const k in h) h[k] = false;
      pad.ax = pad.ay = 0;
      return;
    }
    pad.connected = true;
    const btn = (i) => !!(gp.buttons[i] && (gp.buttons[i].pressed || gp.buttons[i].value > 0.5));
    const ax = gp.axes[0] || 0, ay = gp.axes[1] || 0;
    pad.ax = Math.abs(ax) > 0.25 ? ax : 0;
    pad.ay = Math.abs(ay) > 0.25 ? ay : 0;
    const rx = gp.axes[2] || 0, ry = gp.axes[3] || 0;
    pad.aimX = rx; pad.aimY = ry;
    const stickAim = Math.hypot(rx, ry) > 0.4;
    h.left = btn(14) || ax < -0.4;
    h.right = btn(15) || ax > 0.4;
    h.up = btn(12) || ay < -0.5;
    h.down = btn(13) || ay > 0.5;
    h.jump = btn(0);
    h.shoot = btn(2) || btn(7) || stickAim;
    h.look = btn(3) || btn(6);
    h.sprint = btn(5) || btn(4);
    h.pause = btn(9);
    h.back = btn(1);
    for (const k in h) {
      if (h[k] && !pad.prev[k]) {
        pad.pressed[k] = true;
        Input.lastDevice = 'pad';
        Input.anyHit = true;
        if (k === 'shoot') Input.shootSource = stickAim ? 'stick' : 'button';
        if (HK.Audio) HK.Audio.unlock();
      }
    }
    if (stickAim && h.shoot) Input.shootSource = 'stick';
  }

  HK.Input = Input;
})((window.HK = window.HK || {}));
