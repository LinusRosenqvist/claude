// Värld 3: KRISTALLGROTTAN
'use strict';
const { Lvl } = require('./lib');

// Tak med ojämn underkant
function ceiling(L, x0, x1, bottom, seed) {
  for (let x = x0; x <= x1; x++) {
    const j = Math.round(Math.sin((x + (seed || 0)) * 0.9) * 0.7 + Math.sin((x + (seed || 0)) * 0.37));
    L.fill(x, 0, x, Math.max(0, bottom + j), '#');
  }
}

function l31() {
  const S = 22;
  const L = new Lvl({
    id: '3-1', world: 3, num: 1, name: 'GLITTERGRUVAN', theme: 'grotta', w: 224, h: 28, par: 230,
    hint: 'DET ÄR MÖRKT HÄR NERE. KRISTALLERNA LYSER VÄGEN.',
    kevinLine: 'BU! HAHA, BLEV DU RÄDD? JAG HAR SUTTIT HÄR I MÖRKRET HUR LÄNGE SOM HELST.',
  });
  L.ground(0, 223, S);
  ceiling(L, 0, 19, 8, 1);
  L.set(3, S - 1, '@');
  L.sign(6, S - 1, 'KRISTALLGROTTAN! DET ÄR MÖRKT. KIKAREN (E) SER BÄTTRE I MÖRKRET.');
  L.coins(9, S - 1, 4);
  // vattenpöl med stenar
  ceiling(L, 20, 37, 6, 2);
  L.pit(20, 37);
  L.fill(20, 25, 37, 27, '~');
  L.ground(23, 24, S - 1);
  L.ground(28, 29, S - 2);
  L.ground(33, 34, S - 1);
  L.coins(23, S - 3, 2);
  L.coins(28, S - 4, 2);
  L.coins(33, S - 3, 2);
  L.set(28, 12, 'b');
  // krabbor + block
  ceiling(L, 38, 58, 9, 3);
  L.set(44, S - 1, 'r');
  L.set(53, S - 1, 'r');
  L.str(46, S - 4, '?B B?');
  L.pup(48, S - 4, 'heart');
  // gruvschakt med rasplankor
  ceiling(L, 59, 72, 5, 4);
  L.pit(59, 72);
  L.str(61, S - 1, 'xx  xx  xx');
  L.set(66, 13, 'b');
  L.coins(61, S - 4, 2);
  L.coins(65, S - 5, 2);
  L.coins(69, S - 4, 2);
  // sprucket golv till hemlig tunnel
  ceiling(L, 73, 86, 8, 5);
  L.sign(74, S - 1, 'SPRICKOR I GOLVET? SIKTA NERÅT OCH SKJUT!');
  L.fill(78, S, 79, S, '%');
  L.fill(76, S + 1, 86, S + 3, ':');
  L.set(80, S + 3, 'X');
  L.coins(81, S + 3, 3);
  L.set(85, S + 3, '*');
  L.set(83, S - 1, 'c');
  // stor kristallsal
  ceiling(L, 87, 110, 3, 6);
  L.pit(87, 110);
  L.ground(87, 110, S + 2);
  L.plat(90, 20, 4);
  L.plat(96, 17, 4);
  L.plat(102, 14, 4);
  L.plat(96, 11, 4);
  L.plat(90, 8, 4);
  L.set(104, 13, '1');
  L.set(91, 7, '$');
  L.coins(96, 10, 4);
  L.set(92, S + 1, 'k');
  L.set(100, S + 1, 'r');
  L.set(95, 6, 'b');
  L.set(106, S + 1, 'e');
  // krypgång
  ceiling(L, 111, 112, 16, 7);
  L.sign(111, S - 1, 'TRÅNGT! HÅLL IN S OCH KRYP IGENOM GÅNGEN.');
  L.fill(113, 0, 128, S - 2, '#');
  L.coins(115, S - 1, 6, 2);
  L.fill(129, 0, 132, 16, '#');
  L.set(131, S - 1, '*');
  L.coins(129, S - 1, 2);
  // avgrund med hissar
  ceiling(L, 133, 158, 6, 8);
  L.pit(136, 158);
  L.mover(139, 19, 3, 'v', 3, 0.02, 0);
  L.mover(146, 17, 3, 'v', 3, 0.022, 2);
  L.mover(153, 19, 3, 'v', 3, 0.018, 4);
  L.coins(146, 11, 3);
  L.set(149, 9, 'b');
  // taggar + krabbor
  ceiling(L, 159, 190, 7, 9);
  L.str(165, S - 1, '^^^');
  L.str(175, S - 1, '^^^');
  L.str(170, S - 5, 'B?B');
  L.set(171, S - 1, 'r');
  L.set(181, 12, 'b');
  L.set(185, S - 1, 'k');
  L.set(162, S - 1, 'c');
  // slutet: pelare med hemligt rum
  ceiling(L, 191, 205, 6, 10);
  L.plat(199, 19, 3);
  L.plat(203, 16, 3);
  L.fill(206, 13, 223, 27, '#');
  L.fill(0, 0, 223, 0, '#');
  L.fill(206, 0, 223, 7, '#');
  L.fill(207, 18, 216, 21, ':');
  L.fill(206, 20, 206, 21, ':');
  L.set(214, 21, 'K');
  L.coins(208, 21, 4);
  L.set(220, 12, '*');
  L.coins(208, 12, 6);
  L.set(212, 12, 'r');
  L.set(196, S - 1, 'r');
  return L.def();
}

function l32() {
  const W = 64, H = 84;
  const L = new Lvl({
    id: '3-2', world: 3, num: 2, name: 'DJUPA DALEN', theme: 'grotta', w: W, h: H, par: 220,
    hint: 'KEVIN GÖMMER SIG LÄNGST NER I DALEN...',
    kevinLine: 'DU HITTADE MIG ÄNDA HÄR NERE?! JAG TRODDE ATT SPÖKENA SKULLE SKRÄMMA BORT DIG.',
  });
  L.fill(0, 0, W - 1, H - 1, '#');
  // Kammare A (överst)
  L.clear(2, 2, 61, 13);
  L.set(4, 13, '@');
  L.sign(7, 13, 'NU GÅR VI NERÅT! HÅLL IN S FÖR ATT TITTA NER INNAN DU HOPPAR.');
  L.str(20, 13, '^^^');
  L.coins(12, 13, 4);
  L.set(40, 6, 'G');
  L.pup(30, 9, 'shield');
  L.str(28, 9, 'B');
  L.str(32, 9, 'B');
  L.coins(36, 13, 6);
  L.set(46, 13, 'r');
  L.plat(44, 9, 4);
  L.coins(44, 8, 4);
  // hål ner till schakt B
  L.clear(54, 14, 57, 14);
  // Schakt B
  L.clear(52, 14, 59, 34);
  L.plat(52, 19, 3);
  L.plat(57, 24, 3);
  L.plat(52, 29, 3);
  L.coins(55, 22, 2);
  L.coins(55, 27, 2);
  L.set(56, 17, 'b');
  // alkov med diamant
  L.clear(46, 22, 51, 23);
  L.plat(52, 24, 3);
  L.set(47, 23, '*');
  L.coins(48, 23, 3);
  // Kammare C
  L.clear(4, 34, 59, 45);
  L.fill(30, 46, 41, 47, '~');
  L.fill(33, 46, 34, 47, '#');
  L.fill(37, 46, 38, 47, '#');
  L.set(20, 38, 'G');
  L.set(48, 45, 'r');
  L.set(54, 45, 'c');
  L.set(16, 45, '1');
  L.coins(19, 45, 7);
  L.plat(26, 43, 3);
  L.plat(22, 40, 4);
  L.plat(16, 37, 4);
  L.set(17, 36, '*');
  L.str(44, 41, '?B!B?');
  L.pup(46, 41, 'heart');
  // hål till schakt D
  L.clear(6, 46, 9, 46);
  // Schakt D med taggar på väggarna
  L.clear(5, 46, 12, 64);
  for (let y = 50; y <= 60; y++) L.set(5, y, '^');
  for (let y = 54; y <= 62; y++) L.set(12, y, '^');
  L.str(8, 52, 'xx');
  L.str(7, 58, 'xx');
  L.coins(8, 50, 2);
  L.coins(8, 56, 2);
  // Kammare E (botten)
  L.clear(5, 64, 48, 75);
  L.set(8, 75, 'c');
  L.str(18, 75, '^^');
  L.str(34, 75, '^^^');
  L.set(24, 75, 'r');
  L.set(42, 75, 'r');
  L.set(30, 67, 'b');
  L.set(38, 70, 'G');
  L.plat(24, 72, 3);
  L.plat(29, 69, 4);
  L.set(31, 68, '*');
  L.coins(20, 71, 3);
  L.set(44, 75, 'k');
  L.str(12, 71, 'B?B');
  // hemligt rum längst ner till höger
  L.fill(49, 72, 57, 75, ':');
  L.set(55, 75, 'K');
  L.coins(50, 75, 4);
  return L.def();
}

module.exports = [l31, l32];
