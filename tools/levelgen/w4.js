// Värld 4: MOLNRIKET
'use strict';
const { Lvl } = require('./lib');

function island(L, x0, x1, top, thick) {
  L.fill(x0, top, x1, Math.min(L.h - 1, top + (thick || 3) - 1), '#');
}

function l41() {
  const L = new Lvl({
    id: '4-1', world: 4, num: 1, name: 'JETPACKJAKTEN', theme: 'moln', w: 262, h: 40, par: 200, jetpack: true,
    hint: 'DU HAR EN JETPACK! KEVIN FLYGER OCKSÅ RUNT HÄR NÅGONSTANS...',
    kevinLine: 'VÄLKOMMEN TILL MITT MOLNSLOTT! JAG HAR ALLTID VELAT HA ETT.',
  });
  // öar: [x0, x1, top, tjocklek]
  const isl = [
    [0, 14, 30, 5], [20, 28, 26, 3], [36, 42, 22, 3], [50, 60, 28, 4], [66, 72, 18, 3], [80, 92, 25, 4],
    [100, 104, 16, 2], [106, 114, 11, 3], [122, 128, 20, 3], [136, 142, 27, 3], [148, 153, 31, 3],
    [160, 170, 22, 3], [178, 186, 14, 3], [194, 204, 24, 3],
  ];
  for (const [a, b, t, k] of isl) island(L, a, b, t, k);
  L.set(3, 29, '@');
  L.sign(6, 29, 'DU HAR EN JETPACK! HÅLL IN SPACE I LUFTEN FÖR ATT FLYGA. BRÄNSLET FYLLS PÅ NÄR DU LANDAR.');
  L.coins(9, 29, 4);
  L.coinArc(15, 26, 6);
  L.set(24, 25, 'e');
  L.coins(36, 21, 7);
  L.set(39, 16, 'w');
  L.set(54, 27, 'f');
  L.set(57, 27, 'g');
  L.str(52, 24, '?B!B?');
  L.pup(54, 24, 'heart');
  // Kevin nr 1
  L.set(70, 17, '1');
  L.coins(66, 17, 3);
  L.set(76, 10, 'b');
  L.set(84, 24, 'c');
  L.set(88, 24, 'e');
  L.set(90, 18, 'w');
  // hög ö med Kevin nr 2
  L.set(111, 10, '2');
  L.coins(106, 10, 4);
  L.set(101, 15, 'f');
  // diamant 1 högt uppe
  L.plat(116, 4, 4);
  L.set(118, 3, '*');
  L.coins(116, 3, 2);
  L.coins(119, 3, 1);
  L.set(125, 19, 'z');
  L.set(128, 12, 'w');
  // diamant 2 under en ö
  L.plat(137, 32, 5);
  L.plat(143, 33, 4);
  L.set(139, 31, '*');
  L.set(140, 26, 'e');
  // Kevin nr 3 på liten ö
  L.set(150, 30, '3');
  L.set(152, 30, 'f');
  L.set(165, 21, 'g');
  L.str(163, 18, '?B$B?');
  L.set(168, 12, 'w');
  L.set(181, 13, 'f');
  L.coins(178, 13, 3);
  L.set(185, 8, 'b');
  L.set(198, 23, 'c');
  L.set(201, 23, 'e');
  // molnslottet
  island(L, 212, 261, 18, 22);
  L.fill(214, 8, 216, 17, '#');
  L.fill(257, 8, 259, 17, '#');
  L.fill(214, 7, 259, 7, 'B');
  L.fill(217, 8, 256, 17, '.');
  L.clear(214, 15, 216, 17);
  L.clear(257, 15, 259, 17);
  L.str(226, 13, '?B!B?');
  L.pup(228, 13, 'disco');
  L.set(222, 17, 'k');
  L.set(234, 17, 'e');
  L.set(242, 17, 'k');
  L.set(248, 17, 'z');
  L.coins(236, 17, 4);
  // hemliga rum i slottets golv
  L.fill(236, 19, 255, 21, ':');
  L.fill(245, 18, 246, 18, ':');
  L.set(252, 21, 'K');
  L.coins(238, 21, 6);
  L.sign(254, 17, 'KEVIN? HAN ÄR NOG INTE HÄR. ELLER ÄR HAN DET...?');
  // diamant 3 inne i en mur av guldtegel
  L.fill(218, 14, 221, 16, '%');
  L.set(219, 15, '*');
  L.sign(213, 17, 'MOLNSLOTTET! SPRUCKNA MOLN GÅR ATT SKJUTA SÖNDER.');
  return L.def();
}

function l42() {
  const L = new Lvl({
    id: '4-2', world: 4, num: 2, name: 'ÅSKVÄGEN', theme: 'moln', w: 252, h: 30, par: 230, wind: -0.6,
    hint: 'STORMVARNING! JETPACKEN FINNS NÅGONSTANS PÅ VÄGEN...',
    kevinLine: 'BLIXTAR OCH DUNDER! BRA JOBBAT - DU FLÖG ÄNDA HIT.',
  });
  const isl = [
    [0, 16, 22, 8], [21, 26, 21, 3], [31, 36, 19, 3], [41, 50, 22, 4], [60, 68, 20, 3], [73, 80, 17, 3],
    [94, 104, 21, 4], [110, 114, 18, 3], [118, 128, 22, 4], [132, 146, 20, 5],
  ];
  for (const [a, b, t, k] of isl) island(L, a, b, t, k);
  L.set(3, 21, '@');
  L.sign(6, 21, 'STORMVARNING! VINDEN BLÅSER ÅT VÄNSTER - HOPPA LÄNGRE ÄN DU TROR.');
  L.coins(9, 21, 4);
  L.set(24, 20, 'e');
  L.coins(31, 18, 6);
  L.set(34, 12, 'w');
  L.set(46, 21, 'g');
  L.str(43, 18, '?B?');
  // rasmoln
  L.str(52, 21, 'xx');
  L.str(56, 20, 'xx');
  L.set(64, 19, '1');
  L.set(62, 12, 'b');
  // fjäder upp till hög ö
  L.set(78, 16, 's');
  L.plat(82, 8, 6);
  L.set(85, 7, '*');
  L.coins(82, 7, 3);
  L.coins(86, 7, 2);
  L.mover(84, 19, 3, 'h', 2, 0.02, 0);
  L.mover(90, 18, 3, 'v', 2, 0.02, 1);
  L.set(98, 20, 'c');
  L.set(102, 20, 'z');
  L.set(100, 12, 'w');
  L.str(112, 17, 'x');
  L.set(123, 21, 'e');
  L.set(126, 21, 'g');
  L.str(119, 18, 'B!B');
  L.pup(120, 18, 'shield');
  // jetpack-blocket
  L.sign(134, 19, 'EN STOR LUCKA... KANSKE FINNS DET NÅGOT I BLOCKET?');
  L.set(139, 15, 'J');
  L.set(143, 19, 'e');
  // stora luckan med bränsle på små moln
  const small = [[154, 18], [166, 14], [178, 19], [190, 13], [202, 17]];
  for (const [x, y] of small) {
    L.plat(x, y, 3);
    L.set(x + 1, y - 1, 'f');
  }
  L.set(160, 8, 'w');
  L.set(184, 7, 'w');
  L.set(196, 9, 'b');
  L.coins(170, 10, 5);
  L.plat(172, 26, 3);
  L.set(173, 25, '*');
  // åsktornet
  island(L, 212, 251, 20, 10);
  L.fill(234, 6, 246, 19, '#');
  L.fill(236, 8, 244, 11, ':');
  L.fill(234, 10, 235, 11, ':');
  L.set(242, 11, 'K');
  L.coins(237, 11, 4);
  L.plat(226, 16, 4);
  L.plat(230, 13, 3);
  L.set(218, 19, 'c');
  L.set(222, 19, 'k');
  L.set(228, 19, 'e');
  L.set(249, 19, 'k');
  L.set(240, 5, '*');
  L.coins(236, 5, 4);
  L.set(238, 2, 'w');
  return L.def();
}

module.exports = [l41, l42];
