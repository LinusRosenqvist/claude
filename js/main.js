/* Hitta Kevin — start. */
(function (HK) {
  'use strict';

  function boot() {
    HK.Art.build();
    HK.Save.load();
    HK.Game.init();
    const params = new URLSearchParams(window.location.search);
    if (params.get('unlock')) HK.DEBUG_UNLOCK = true;
    const lv = params.get('level');
    const th = params.get('theme');
    if (th && HK.Themes[th]) HK.LEVELS.forEach((d) => { d.theme = th; });
    const scene = params.get('scene');
    if (lv) {
      const idx = HK.LEVELS.findIndex((d) => d.id === lv);
      HK.Game.setScene(new HK.Scenes.PlayScene(Math.max(0, idx)));
    } else if (scene === 'map') HK.Game.setScene(new HK.Scenes.MapScene());
    else if (scene === 'story') HK.Game.setScene(new HK.Scenes.StoryScene());
    else if (scene === 'ending') HK.Game.setScene(new HK.Scenes.EndingScene({}));
    else HK.Game.setScene(new HK.Scenes.TitleScene());
    const loader = document.getElementById('loader');
    if (loader) loader.remove();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})((window.HK = window.HK || {}));
