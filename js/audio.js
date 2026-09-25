/* Hitta Kevin — chiptune-ljud: syntade effekter och en liten sequencer med låtar. */
(function (HK) {
  'use strict';

  const A = {
    ctx: null,
    unlocked: false,
    song: null,
    wantSong: null,
    jetGain: null,
  };

  const NOTE = { C: 0, 'C#': 1, D: 2, 'D#': 3, E: 4, F: 5, 'F#': 6, G: 7, 'G#': 8, A: 9, 'A#': 10, B: 11 };
  function freq(name) {
    const m = /^([A-G]#?)(-?\d)$/.exec(name);
    if (!m) return 0;
    const midi = 12 * (parseInt(m[2], 10) + 1) + NOTE[m[1]];
    return 440 * Math.pow(2, (midi - 69) / 12);
  }

  function pulseWave(ctx, duty) {
    const n = 64;
    const real = new Float32Array(n), imag = new Float32Array(n);
    for (let k = 1; k < n; k++) {
      real[k] = Math.sin(2 * Math.PI * k * duty) / (k * Math.PI);
      imag[k] = (1 - Math.cos(2 * Math.PI * k * duty)) / (k * Math.PI);
    }
    return ctx.createPeriodicWave(real, imag);
  }

  A.unlock = function () {
    if (A.ctx) {
      if (A.ctx.state !== 'running' && !document.hidden) {
        const r = A.ctx.resume();
        if (r && r.catch) r.catch(() => {});
      }
      return;
    }
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    try {
      A.ctx = new AC();
    } catch (e) {
      return;
    }
    const ctx = A.ctx;
    A.master = ctx.createGain();
    A.master.gain.value = 0.9;
    const comp = ctx.createDynamicsCompressor();
    comp.threshold.value = -12;
    comp.ratio.value = 4;
    A.master.connect(comp);
    comp.connect(ctx.destination);
    A.music = ctx.createGain();
    A.sfxBus = ctx.createGain();
    A.music.connect(A.master);
    A.sfxBus.connect(A.master);
    A.waves = { p12: pulseWave(ctx, 0.125), p25: pulseWave(ctx, 0.25), p50: pulseWave(ctx, 0.5) };
    const len = ctx.sampleRate;
    A.noise = ctx.createBuffer(1, len, ctx.sampleRate);
    const d = A.noise.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    try {
      const b = ctx.createBuffer(1, 1, 22050);
      const src = ctx.createBufferSource();
      src.buffer = b;
      src.connect(ctx.destination);
      src.start(0);
    } catch (e) {
      /* ignorera */
    }
    A.unlocked = true;
    A.applySettings();
    A.timer = setInterval(A.tick, 25);
    if (A.wantSong) A.playMusic(A.wantSong, true);
  };

  A.applySettings = function () {
    if (!A.ctx) return;
    const s = HK.Game.settings;
    A.music.gain.setTargetAtTime(s.music ? 0.55 : 0, A.ctx.currentTime, 0.05);
    A.sfxBus.gain.setTargetAtTime(s.sfx ? 0.8 : 0, A.ctx.currentTime, 0.05);
  };

  A.suspend = function (on) {
    if (!A.ctx) return;
    if (on) A.ctx.suspend();
    else if (A.unlocked) A.ctx.resume();
  };

  // ---------------- Grundljud ----------------
  function osc(type, f, t0, dur, vol, o) {
    o = o || {};
    const ctx = A.ctx;
    const oN = ctx.createOscillator();
    if (A.waves[type]) oN.setPeriodicWave(A.waves[type]);
    else oN.type = type;
    oN.frequency.setValueAtTime(f, t0);
    if (o.to) {
      if (o.lin) oN.frequency.linearRampToValueAtTime(o.to, t0 + dur);
      else oN.frequency.exponentialRampToValueAtTime(Math.max(20, o.to), t0 + dur);
    }
    const g = ctx.createGain();
    const a = o.attack || 0.004;
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.linearRampToValueAtTime(vol, t0 + a);
    if (o.sustain) {
      g.gain.setValueAtTime(vol, t0 + dur - 0.03);
      g.gain.linearRampToValueAtTime(0.0001, t0 + dur);
    } else g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    if (o.vib) {
      const l = ctx.createOscillator();
      const lg = ctx.createGain();
      l.frequency.value = o.vib[0];
      lg.gain.value = o.vib[1];
      l.connect(lg);
      lg.connect(oN.frequency);
      l.start(t0);
      l.stop(t0 + dur + 0.05);
    }
    oN.connect(g);
    g.connect(o.dest || A.sfxBus);
    oN.start(t0);
    oN.stop(t0 + dur + 0.05);
  }

  function noise(t0, dur, vol, o) {
    o = o || {};
    const ctx = A.ctx;
    const src = ctx.createBufferSource();
    src.buffer = A.noise;
    src.loop = true;
    const f = ctx.createBiquadFilter();
    f.type = o.type || 'lowpass';
    f.frequency.setValueAtTime(o.f || 4000, t0);
    if (o.to) f.frequency.exponentialRampToValueAtTime(o.to, t0 + dur);
    f.Q.value = o.q || 0.7;
    const g = ctx.createGain();
    g.gain.setValueAtTime(vol, t0);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    src.connect(f);
    f.connect(g);
    g.connect(o.dest || A.sfxBus);
    src.start(t0, Math.random() * 0.5);
    src.stop(t0 + dur + 0.05);
  }

  const lastPlayed = {};
  const SFX = {
    jump(t) { osc('p25', 260, t, 0.14, 0.18, { to: 620 }); },
    land(t) { noise(t, 0.06, 0.12, { f: 900 }); },
    skid(t) { noise(t, 0.08, 0.06, { type: 'bandpass', f: 2400, q: 2 }); },
    coin(t) { osc('p25', 988, t, 0.06, 0.13, { sustain: true }); osc('p25', 1319, t + 0.06, 0.28, 0.13); },
    gem(t) { [1047, 1319, 1568, 2093, 2637].forEach((f, i) => osc('p25', f, t + i * 0.05, 0.22, 0.12)); osc('triangle', 523, t, 0.4, 0.15); },
    stomp(t) { osc('p50', 520, t, 0.13, 0.18, { to: 110 }); noise(t, 0.06, 0.12, { f: 1400 }); },
    shoot(t) { osc('p12', 1500, t, 0.09, 0.08, { to: 380 }); },
    hit(t) { osc('p50', 700, t, 0.08, 0.1, { to: 240 }); noise(t, 0.05, 0.08, { type: 'bandpass', f: 1800, q: 1.2 }); },
    enemydie(t) { osc('p50', 820, t, 0.22, 0.14, { to: 90 }); noise(t, 0.14, 0.1, { f: 2500, to: 300 }); },
    hurt(t) { osc('sawtooth', 480, t, 0.32, 0.14, { to: 120, vib: [30, 30] }); },
    bump(t) { osc('triangle', 170, t, 0.09, 0.3, { to: 90 }); noise(t, 0.05, 0.08, { f: 700 }); },
    break(t) { noise(t, 0.28, 0.25, { f: 3500, to: 200 }); osc('p50', 220, t, 0.12, 0.1, { to: 60 }); },
    powerup(t) { [523, 659, 784, 1047, 1319, 1568, 2093].forEach((f, i) => osc('p25', f, t + i * 0.045, 0.1, 0.12, { sustain: true })); },
    appear(t) { osc('p25', 300, t, 0.3, 0.12, { to: 900, lin: true }); },
    checkpoint(t) { [784, 988, 1175, 1568].forEach((f, i) => osc('p25', f, t + i * 0.07, 0.14, 0.13)); osc('triangle', 392, t, 0.35, 0.18); },
    spring(t) { osc('sine', 180, t, 0.3, 0.25, { to: 900, vib: [18, 40] }); },
    explosion(t) { noise(t, 0.6, 0.35, { f: 2200, to: 80 }); osc('triangle', 110, t, 0.4, 0.3, { to: 35 }); },
    decoy(t) { [392, 370, 349, 311].forEach((f, i) => osc('p50', f, t + i * 0.22, i === 3 ? 0.55 : 0.2, 0.12, { vib: [6, i === 3 ? 12 : 4] })); },
    poof(t) { noise(t, 0.2, 0.18, { type: 'bandpass', f: 1600, to: 400, q: 0.8 }); [880, 1047, 880, 1175].forEach((f, i) => osc('p25', f, t + 0.08 + i * 0.07, 0.06, 0.08)); },
    shieldbreak(t) { osc('triangle', 1400, t, 0.3, 0.2, { to: 300 }); noise(t, 0.25, 0.15, { type: 'highpass', f: 3000 }); },
    death(t) { [659, 622, 587, 554, 523].forEach((f, i) => osc('p50', f, t + 0.2 + i * 0.16, i === 4 ? 0.6 : 0.15, 0.13, { vib: [7, 8] })); osc('triangle', 196, t + 0.2, 1.2, 0.2, { to: 98 }); },
    select(t) { osc('p25', 660, t, 0.04, 0.1); },
    confirm(t) { osc('p25', 880, t, 0.05, 0.12, { sustain: true }); osc('p25', 1320, t + 0.05, 0.12, 0.12); },
    back(t) { osc('p25', 660, t, 0.05, 0.1, { sustain: true }); osc('p25', 440, t + 0.05, 0.1, 0.1); },
    pause(t) { osc('p25', 1047, t, 0.06, 0.1, { sustain: true }); osc('p25', 784, t + 0.07, 0.1, 0.1); },
    heart(t) { [659, 880, 1109].forEach((f, i) => osc('triangle', f, t + i * 0.06, 0.18, 0.2)); },
    fuel(t) { osc('triangle', 440, t, 0.15, 0.2, { to: 880 }); osc('p25', 1320, t + 0.1, 0.1, 0.08); },
    laser(t) { osc('sawtooth', 1300, t, 0.12, 0.05, { to: 420 }); },
    cannon(t) { noise(t, 0.3, 0.25, { f: 1200, to: 100 }); osc('triangle', 140, t, 0.2, 0.25, { to: 50 }); },
    thunder(t) { noise(t, 0.9, 0.35, { f: 4000, to: 60 }); osc('sawtooth', 90, t, 0.4, 0.12, { to: 40 }); },
    ghost(t) { osc('sine', 330, t, 0.6, 0.08, { to: 250, vib: [5, 25] }); },
    hop(t) { osc('p25', 330, t, 0.08, 0.08, { to: 520 }); },
    crystal(t) { [2093, 2637, 3136].forEach((f, i) => osc('triangle', f, t + i * 0.03, 0.2, 0.1)); noise(t, 0.15, 0.08, { type: 'highpass', f: 5000 }); },
    thud(t) { osc('triangle', 90, t, 0.3, 0.4, { to: 40 }); noise(t, 0.2, 0.2, { f: 500 }); },
    crumble(t) { noise(t, 0.25, 0.14, { f: 1200, to: 300 }); },
    splash(t) { noise(t, 0.3, 0.2, { type: 'bandpass', f: 1200, to: 400, q: 0.6 }); },
    lavapop(t) { osc('sine', 200, t, 0.12, 0.2, { to: 500 }); noise(t, 0.1, 0.08, { f: 900 }); },
    dive(t) { osc('p50', 900, t, 0.35, 0.1, { to: 150 }); },
    kikare(t) { osc('p25', 1760, t, 0.03, 0.05); osc('p25', 2093, t + 0.04, 0.05, 0.05); },
    secret(t) { [784, 740, 622, 440, 415, 659, 831, 1047].forEach((f, i) => osc('p25', f, t + i * 0.09, 0.12, 0.1)); },
    text(t, o) { osc('p25', 500 + Math.random() * 300, t, 0.025, 0.035); },
    radar(t, o) { osc('sine', (o && o.f) || 1200, t, 0.06, 0.05); },
    spot(t) { [1175, 1568, 2349].forEach((f, i) => osc('p25', f, t + i * 0.06, 0.12, 0.1)); },
    disco(t) { [523, 659, 784, 1047].forEach((f, i) => osc('p50', f, t + i * 0.05, 0.08, 0.1)); },
    block1up(t) { osc('p25', 523, t, 0.08, 0.1); },
    start(t) { [523, 659, 784, 1047, 784, 1047].forEach((f, i) => osc('p25', f, t + i * 0.07, 0.12, 0.12)); },
  };

  A.sfx = function (name, o) {
    if (!A.ctx || !A.unlocked) return;
    if (!HK.Game.settings.sfx) return;
    const now = A.ctx.currentTime;
    // undvik att samma ljud staplas i samma bildruta
    if (lastPlayed[name] && now - lastPlayed[name] < 0.03) return;
    lastPlayed[name] = now;
    const fn = SFX[name];
    if (!fn) return;
    try {
      fn(now + 0.005, o);
    } catch (e) {
      /* tyst */
    }
  };

  A.jetpack = function (level) {
    if (!A.ctx) return;
    if (!A.jetGain) {
      const ctx = A.ctx;
      const src = ctx.createBufferSource();
      src.buffer = A.noise;
      src.loop = true;
      const f = ctx.createBiquadFilter();
      f.type = 'bandpass';
      f.frequency.value = 700;
      f.Q.value = 0.9;
      A.jetGain = ctx.createGain();
      A.jetGain.gain.value = 0;
      src.connect(f);
      f.connect(A.jetGain);
      A.jetGain.connect(A.sfxBus);
      src.start();
    }
    const target = level > 0 ? 0.16 : 0;
    if (A.jetLevel !== target) {
      A.jetLevel = target;
      A.jetGain.gain.setTargetAtTime(target, A.ctx.currentTime, 0.03);
    }
  };

  // ---------------- Musik ----------------
  function parseTrack(str) {
    const tok = str.trim().split(/\s+/);
    const ev = [];
    for (let i = 0; i < tok.length; i++) {
      const tk = tok[i];
      if (tk === '-' || tk === '.') continue;
      let len = 1;
      while (i + len < tok.length && tok[i + len] === '-') len++;
      ev.push({ step: i, tok: tk, len, f: freq(tk) });
    }
    return { len: tok.length, ev };
  }

  const TRACK_DEF = {
    lead: { wave: 'p25', vol: 0.12 },
    lead2: { wave: 'p50', vol: 0.08 },
    harm: { wave: 'p12', vol: 0.05 },
    bass: { wave: 'triangle', vol: 0.22 },
    drums: {},
  };

  function compile(song) {
    const c = { bpm: song.bpm, loop: song.loop !== false, tracks: [], name: song.name };
    for (const k in song.tracks) {
      const t = parseTrack(song.tracks[k]);
      t.kind = k;
      t.cfg = Object.assign({}, TRACK_DEF[k.replace(/\d+$/, '')] || TRACK_DEF.lead, (song.cfg && song.cfg[k]) || {});
      c.tracks.push(t);
    }
    c.total = Math.max.apply(null, c.tracks.map((t) => t.len));
    return c;
  }

  function drum(tok, t) {
    const d = A.music;
    const s = 1;
    switch (tok) {
      case 'k': osc('sine', 150, t, 0.14, 0.5 * s, { to: 45, dest: d }); break;
      case 's': noise(t, 0.12, 0.22 * s, { type: 'bandpass', f: 1800, q: 0.7, dest: d }); osc('triangle', 220, t, 0.06, 0.1, { to: 120, dest: d }); break;
      case 'h': noise(t, 0.035, 0.07 * s, { type: 'highpass', f: 7000, dest: d }); break;
      case 'o': noise(t, 0.14, 0.07 * s, { type: 'highpass', f: 6000, dest: d }); break;
      case 'c': noise(t, 0.6, 0.12 * s, { type: 'highpass', f: 4000, dest: d }); break;
      case 'x': osc('sine', 150, t, 0.14, 0.5 * s, { to: 45, dest: d }); noise(t, 0.12, 0.2 * s, { type: 'bandpass', f: 1800, q: 0.7, dest: d }); break;
      case 't': osc('sine', 220, t, 0.12, 0.3, { to: 110, dest: d }); break;
    }
  }

  A.playMusic = function (name, force) {
    A.wantSong = name;
    if (!A.ctx) return;
    if (!force && A.song && A.song.name === name && A.song.playing) return;
    const def = SONGS[name];
    if (!def) return;
    if (!def.compiled) def.compiled = compile(Object.assign({ name }, def));
    A.song = { name, c: def.compiled, step: 0, next: A.ctx.currentTime + 0.08, playing: true, done: false };
  };

  A.stopMusic = function () {
    if (A.song) A.song.playing = false;
    A.wantSong = null;
  };

  A.currentSong = function () {
    return A.song && A.song.playing ? A.song.name : null;
  };

  A.tick = function () {
    const s = A.song;
    if (!s || !s.playing || !A.ctx || A.ctx.state !== 'running') return;
    const stepDur = 60 / s.c.bpm / 4;
    const horizon = A.ctx.currentTime + 0.12;
    if (s.next < A.ctx.currentTime - 0.3) s.next = A.ctx.currentTime + 0.02; // har hamnat efter
    while (s.next < horizon) {
      if (!s.c.loop && s.step >= s.c.total) {
        s.playing = false;
        if (s.onEnd) s.onEnd();
        return;
      }
      for (const tr of s.c.tracks) {
        const local = s.step % tr.len;
        for (const e of tr.ev) {
          if (e.step !== local) continue;
          if (tr.kind === 'drums') {
            for (const ch of e.tok) drum(ch, s.next);
          } else if (e.f) {
            const dur = e.len * stepDur * 0.92;
            const cfg = tr.cfg;
            osc(cfg.wave, e.f, s.next, dur, cfg.vol, { sustain: true, dest: A.music, vib: dur > 0.35 && cfg.vib !== false && tr.kind.startsWith('lead') ? [5.5, e.f * 0.006] : null });
          }
        }
      }
      s.step++;
      s.next += stepDur;
    }
  };

  // ---------------- Låtar ----------------
  function bars() { return Array.prototype.join.call(arguments, ' '); }
  function rep(p, n) { return new Array(n).fill(p).join(' '); }
  function arp(chords, pat) {
    // chords: [['C5','E5','G5'], ...] ; pat: index-sträng '0121'
    return chords.map((c) => {
      const out = [];
      for (let i = 0; i < 16; i++) out.push(c[+pat[i % pat.length]] || '.');
      return out.join(' ');
    }).join(' ');
  }

  const SONGS = {};

  SONGS.titel = {
    bpm: 140,
    tracks: {
      lead: bars(
        'E5 - G5 - C6 - - - B5 - G5 - E5 - D5 -', 'D5 - G5 - B5 - - - A5 - G5 - D5 - B4 -',
        'C5 - E5 - A5 - - - G5 - E5 - C5 - E5 -', 'F5 - A5 - C6 - A5 - G5 - - - - - . .',
        'E5 - G5 - C6 - - - D6 - C6 - B5 - C6 -', 'D6 - - - B5 - G5 - A5 - B5 - G5 - - -',
        'A5 - - - C6 - B5 - A5 - G5 - E5 - - -', 'F5 - A5 - G5 - - - C6 - - - - - . .'),
      harm: arp([['C5', 'E5', 'G5'], ['B4', 'D5', 'G5'], ['C5', 'E5', 'A5'], ['C5', 'F5', 'A5'], ['C5', 'E5', 'G5'], ['B4', 'D5', 'G5'], ['C5', 'E5', 'A5'], ['B4', 'D5', 'G5']], '0121'),
      bass: bars(rep('C3 . C4 .', 4), rep('G2 . G3 .', 4), rep('A2 . A3 .', 4), 'F2 . F3 . F2 . F3 . F2 . F3 . G2 . G3 .',
        rep('C3 . C4 .', 4), rep('G2 . G3 .', 4), rep('A2 . A3 .', 4), 'F2 . F3 . F2 . F3 . G2 . G3 . G2 . B2 .'),
      drums: bars(rep('k . h . s . h . k k h . s . h h', 7), 'k . h . s . h . k . s s s . c .'),
    },
  };

  SONGS.kullar = {
    bpm: 150,
    tracks: {
      lead: bars(
        'A4 - C5 - F5 - - - E5 - F5 - G5 - A5 -', 'G5 - - - E5 - C5 - D5 - E5 - C5 - - -',
        'D5 - F5 - A5 - - - G5 - F5 - E5 - D5 -', 'F5 - - - D5 - A#4 - C5 - D5 - C5 - - -',
        'A5 - - - A5 - G5 - F5 - G5 - A5 - C6 -', 'G5 - - - - - E5 - G5 - - - C5 - - -',
        'D5 - F5 - A#5 - - - A5 - G5 - F5 - D5 -', 'E5 - - - G5 - - - F5 - - - - - . .'),
      harm: arp([['F4', 'A4', 'C5'], ['E4', 'G4', 'C5'], ['D4', 'F4', 'A4'], ['D4', 'F4', 'A#4'], ['F4', 'A4', 'C5'], ['E4', 'G4', 'C5'], ['D4', 'F4', 'A#4'], ['E4', 'G4', 'C5']], '0120'),
      bass: bars('F2 . . F2 C3 . F2 . F2 . . F2 C3 . A2 .', 'C3 . . C3 G2 . C3 . C3 . . C3 G2 . E2 .',
        'D3 . . D3 A2 . D3 . D3 . . D3 A2 . F2 .', 'A#2 . . A#2 F2 . A#2 . A#2 . . A#2 F2 . D3 .',
        'F2 . . F2 C3 . F2 . F2 . . F2 C3 . A2 .', 'C3 . . C3 G2 . C3 . C3 . . C3 G2 . E2 .',
        'A#2 . . A#2 F2 . A#2 . A#2 . . A#2 F2 . D3 .', 'C3 . . C3 G2 . C3 . C3 . E3 . G3 . C3 .'),
      drums: rep('k . h h s . h . k . h k s . h h', 8),
    },
  };

  SONGS.stad = {
    bpm: 112,
    tracks: {
      lead: bars(
        'E5 - - - - - - - D5 - - - C5 - - -', 'C5 - - - - - - - A4 - - - C5 - D5 -',
        'E5 - - - - - G5 - - - E5 - D5 - C5 -', 'D5 - - - - - - - - - - - . . . .',
        'A5 - - - G5 - - - E5 - - - G5 - A5 -', 'C6 - - - A5 - - - F5 - - - A5 - - -',
        'G5 - - - E5 - - - C5 - - - E5 - G5 -', 'B5 - - - - - - - D6 - - - B5 - - -'),
      harm: arp([['A4', 'C5', 'E5', 'A5'], ['F4', 'A4', 'C5', 'F5'], ['C5', 'E5', 'G5', 'C6'], ['G4', 'B4', 'D5', 'G5'], ['A4', 'C5', 'E5', 'A5'], ['F4', 'A4', 'C5', 'F5'], ['C5', 'E5', 'G5', 'C6'], ['G4', 'B4', 'D5', 'G5']], '01231210'),
      bass: bars(rep('A2 . A2 A3', 4), rep('F2 . F2 F3', 4), rep('C3 . C3 C4', 4), rep('G2 . G2 G3', 4),
        rep('A2 . A2 A3', 4), rep('F2 . F2 F3', 4), rep('C3 . C3 C4', 4), rep('G2 . G2 G3', 4)),
      drums: rep('k . h . s . h . k . k h s . h o', 8),
    },
    cfg: { harm: { wave: 'p25', vol: 0.045 } },
  };

  SONGS.grotta = {
    bpm: 96,
    tracks: {
      lead: bars(
        'D5 - - - F5 - - - A5 - - - - - - -', 'A#4 - - - D5 - - - F5 - - - E5 - - -',
        'G4 - - - A#4 - - - D5 - - - C5 - A#4 -', 'A4 - - - - - - - C#5 - - - E5 - - -',
        'F5 - - - E5 - - - D5 - - - A4 - - -', 'D5 - - - C5 - - - A#4 - - - F4 - - -',
        'G4 - A#4 - D5 - G5 - F5 - - - D5 - - -', 'E5 - - - - - - - C#5 - - - A4 - - -'),
      harm: bars(rep('D4 . A4 . F4 . A4 .', 2), rep('A#3 . F4 . D4 . F4 .', 2), rep('G3 . D4 . A#3 . D4 .', 2), rep('A3 . E4 . C#4 . E4 .', 2),
        rep('D4 . A4 . F4 . A4 .', 2), rep('A#3 . F4 . D4 . F4 .', 2), rep('G3 . D4 . A#3 . D4 .', 2), rep('A3 . E4 . C#4 . E4 .', 2)),
      bass: bars('D2 - - - - - - - D2 - - - A2 - - -', 'A#1 - - - - - - - A#1 - - - F2 - - -', 'G1 - - - - - - - G2 - - - D2 - - -', 'A1 - - - - - - - A2 - - - E2 - - -'),
      drums: rep('k . . . . . h . . . k . . . h .', 4),
    },
    cfg: { lead: { wave: 'triangle', vol: 0.16 }, harm: { wave: 'p12', vol: 0.04 } },
  };

  SONGS.moln = {
    bpm: 158,
    tracks: {
      lead: bars(
        'B5 - D6 - B5 - G5 - A5 - B5 - D6 - - -', 'E6 - - - D6 - B5 - G5 - - - E5 - - -',
        'E5 - G5 - C6 - - - B5 - A5 - G5 - E5 -', 'F#5 - - - A5 - - - D6 - - - . . . .',
        'G5 - B5 - D6 - G6 - F#6 - D6 - B5 - D6 -', 'E6 - - - B5 - - - G5 - - - B5 - - -',
        'C6 - - - E6 - - - D6 - C6 - B5 - A5 -', 'A5 - - - F#5 - - - D5 - - - . . . .'),
      harm: arp([['G5', 'B5', 'D6'], ['E5', 'G5', 'B5'], ['C5', 'E5', 'G5'], ['D5', 'F#5', 'A5'], ['G5', 'B5', 'D6'], ['E5', 'G5', 'B5'], ['C5', 'E5', 'G5'], ['D5', 'F#5', 'A5']], '0120'),
      bass: bars(rep('G2 . D3 . G3 . D3 .', 2), rep('E2 . B2 . E3 . B2 .', 2), rep('C3 . G2 . C3 . G2 .', 2), rep('D3 . A2 . D3 . A2 .', 2)),
      drums: rep('k . h . s . h . k . h . s . h h', 8),
    },
  };

  SONGS.lava = {
    bpm: 168,
    tracks: {
      lead: bars(
        'E5 - - - G5 - - - B5 - A5 - G5 - F#5 -', 'E5 - - - - - - - C5 - D5 - E5 - G5 -',
        'F#5 - - - A5 - - - D6 - C6 - B5 - A5 -', 'B5 - - - - - - - D#5 - F#5 - B5 - - -',
        'E6 - - - D6 - B5 - G5 - - - B5 - E6 -', 'C6 - - - B5 - G5 - E5 - - - G5 - C6 -',
        'D6 - - - C6 - A5 - F#5 - - - A5 - D6 -', 'D#6 - - - - - - - B5 - - - F#5 - - -'),
      bass: bars(rep('E2 E2 E3 E2', 4), rep('C2 C2 C3 C2', 4), rep('D2 D2 D3 D2', 4), rep('B1 B1 B2 B1', 4)),
      harm: arp([['E4', 'G4', 'B4'], ['C4', 'E4', 'G4'], ['D4', 'F#4', 'A4'], ['B3', 'D#4', 'F#4']], '0102'),
      drums: rep('k . h k s . h . k k h . s . h s', 8),
    },
  };

  SONGS.rymd = {
    bpm: 120,
    tracks: {
      lead: bars(
        'G5 - - - - - - - D#5 - - - C5 - - -', 'C5 - - - - - D#5 - G#5 - - - G5 - - -',
        'G5 - - - - - A#5 - G5 - - - D#5 - - -', 'F5 - - - - - - - D5 - - - A#4 - - -',
        'C6 - - - A#5 - - - G5 - - - D#5 - - -', 'G#5 - - - G5 - - - D#5 - - - C5 - - -',
        'D#5 - G5 - A#5 - D#6 - D6 - A#5 - G5 - - -', 'F5 - - - - - - - - - - - . . . .'),
      harm: arp([['C4', 'D#4', 'G4', 'C5'], ['G#3', 'C4', 'D#4', 'G#4'], ['D#4', 'G4', 'A#4', 'D#5'], ['A#3', 'D4', 'F4', 'A#4']], '0123210'),
      bass: bars('C2 - . C2 - . C3 . C2 - . C2 G2 . C3 .', 'G#1 - . G#1 - . G#2 . G#1 - . G#1 D#2 . G#2 .', 'D#2 - . D#2 - . D#3 . D#2 - . D#2 A#2 . D#3 .', 'A#1 - . A#1 - . A#2 . A#1 - . A#1 F2 . A#2 .'),
      drums: rep('k . h . s . h . k . h k s . h .', 4),
    },
    cfg: { harm: { wave: 'p25', vol: 0.04 } },
  };

  SONGS.boss = {
    bpm: 176,
    tracks: {
      lead: bars(
        'A5 - A5 - C6 - A5 - E6 - D6 - C6 - B5 -', 'A5 - - - F5 - - - A5 - C6 - F6 - E6 -',
        'D6 - - - B5 - G5 - D6 - - - G6 - F6 -', 'E6 - - - D6 - C6 - B5 - G#5 - E5 - - -'),
      bass: bars(rep('A2 A2 A3 A2', 4), rep('F2 F2 F3 F2', 4), rep('G2 G2 G3 G2', 4), rep('E2 E2 E3 E2', 4)),
      harm: arp([['A4', 'C5', 'E5'], ['F4', 'A4', 'C5'], ['G4', 'B4', 'D5'], ['E4', 'G#4', 'B4']], '0121'),
      drums: rep('k h s h k k s h k h s h k k s s', 4),
    },
  };

  SONGS.karta = {
    bpm: 100,
    tracks: {
      lead: bars('E5 - - - G5 - - - C6 - - - B5 - - -', 'A5 - - - E5 - - - C5 - - - E5 - - -', 'F5 - - - A5 - - - C6 - - - A5 - - -', 'G5 - - - B5 - - - D6 - - - . . . .'),
      harm: arp([['C5', 'E5', 'G5'], ['A4', 'C5', 'E5'], ['F4', 'A4', 'C5'], ['G4', 'B4', 'D5']], '0121'),
      bass: bars('C3 - - - G2 - - - C3 - - - G2 - - -', 'A2 - - - E2 - - - A2 - - - E2 - - -', 'F2 - - - C3 - - - F2 - - - C3 - - -', 'G2 - - - D3 - - - G2 - - - D3 - - -'),
      drums: rep('k . . . h . . . k . . . h . h .', 4),
    },
    cfg: { lead: { wave: 'triangle', vol: 0.15 } },
  };

  SONGS.disco = {
    bpm: 128,
    tracks: {
      lead: bars('G5 . G5 . . . A#5 . . . G5 . F5 . D#5 .', 'C5 . . . C5 . D#5 . F5 . . . D#5 . C5 .'),
      bass: bars('C3 . C4 . C3 C3 C4 . A#2 . A#3 . A#2 A#2 A#3 .', 'G#2 . G#3 . G#2 G#2 G#3 . G2 . G3 . G2 G2 G3 .'),
      harm: arp([['C5', 'D#5', 'G5'], ['G#4', 'C5', 'D#5']], '0102'),
      drums: rep('k . o . x . o . k . o . x . o .', 2),
    },
  };

  SONGS.vinst = {
    bpm: 150, loop: false,
    tracks: {
      lead: 'G5 . C6 . E6 . G6 - - - E6 . G6 - - - - - - - C6 . D6 . E6 . F6 . G6 - - - - - - - - - - - . . . .',
      harm: 'E5 . G5 . C6 . E6 - - - C6 . E6 - - - - - - - A5 . B5 . C6 . D6 . E6 - - - - - - - - - - - . . . .',
      bass: 'C3 . . . G3 . . . C4 - - - - - - - F3 . . . G3 . . . C3 - - - - - - - - - - - . . . .',
      drums: 'k . . . s . . . k . k . s . . . k . . . s . . . c . . . . . . . . . . . . . . .',
    },
  };

  SONGS.start = {
    bpm: 160, loop: false,
    tracks: {
      lead: 'C5 . E5 . G5 . C6 - - - . . . . . .',
      bass: 'C3 . . . G3 . . . C3 - - - . . . .',
    },
  };

  SONGS.slut = SONGS.titel;

  A.SONGS = SONGS;
  HK.Audio = A;
})((window.HK = window.HK || {}));
