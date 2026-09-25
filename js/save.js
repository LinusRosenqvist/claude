/* Hitta Kevin — sparade framsteg (i webbläsarens lokala lagring). */
(function (HK) {
  'use strict';
  const U = HK.U;
  const KEY = 'hittakevin.save.v1';

  const Save = {
    data: null,

    load() {
      const d = U.store.get(KEY, null);
      Save.data = Object.assign({ levels: {}, seenIntro: false, finished: false, lastLevel: 0 }, d || {});
      return Save.data;
    },

    write() {
      U.store.set(KEY, Save.data);
    },

    reset() {
      Save.data = { levels: {}, seenIntro: true, finished: false, lastLevel: 0 };
      Save.write();
    },

    level(id) {
      return Save.data.levels[id] || null;
    },

    isDone(id) {
      const l = Save.data.levels[id];
      return !!(l && l.done);
    },

    unlocked(idx) {
      if (idx <= 0) return true;
      if (HK.DEBUG_UNLOCK) return true;
      const prev = HK.LEVELS[idx - 1];
      return !!prev && Save.isDone(prev.id);
    },

    /** Spara ett avklarat varv. Returnerar {newBest}. */
    complete(def, stats, stars) {
      const cur = Save.data.levels[def.id] || { done: false, gems: [false, false, false], best: null, stars: 0, coins: 0 };
      const res = { newBest: false };
      cur.done = true;
      for (let i = 0; i < 3; i++) cur.gems[i] = cur.gems[i] || !!stats.gems[i];
      if (cur.best == null || stats.time < cur.best) { cur.best = stats.time; res.newBest = cur.best != null; }
      cur.stars = Math.max(cur.stars || 0, stars);
      cur.coins = Math.max(cur.coins || 0, stats.coins);
      Save.data.levels[def.id] = cur;
      Save.write();
      return res;
    },

    totals() {
      let gems = 0, maxGems = 0, done = 0, stars = 0;
      for (const def of HK.LEVELS) {
        const l = Save.data.levels[def.id];
        maxGems += def.gems || 3;
        if (l) {
          gems += l.gems.filter(Boolean).length;
          if (l.done) done++;
          stars += l.stars || 0;
        }
      }
      return { gems, maxGems, done, stars, count: HK.LEVELS.length };
    },
  };

  HK.Save = Save;
})((window.HK = window.HK || {}));
