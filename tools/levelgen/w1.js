// Värld 1: GRÖNA KULLARNA
'use strict';
const { Lvl } = require('./lib');

function liquidPit(L, x0, x1, depth) {
  L.pit(x0, x1);
  L.fill(x0, L.h - (depth || 2), x1, L.h - 1, '~');
}

function l11() {
  const S = 18;
  const L = new Lvl({
    id: '1-1', world: 1, num: 1, name: 'FÖRSTA STEGET', theme: 'kullar', w: 192, h: 22, par: 150,
    hint: 'KEVIN GÖMMER SIG NÅGONSTANS HÄR...',
    kevinLine: 'WOW, DU HITTADE MIG! MEN JAG HAR MÅNGA FLER GÖMSTÄLLEN...',
  });
  L.ground(0, 191, S);
  L.set(3, S - 1, '@');
  L.sign(6, S - 1, 'HEJ! SPRING MED A OCH D. HOPPA MED SPACE - HÅLL INNE FÖR HÖGRE HOPP!');
  L.coins(9, S - 1, 3, 2);
  L.ground(16, 19, S - 2);
  L.coins(16, S - 3, 4);

  // K-block
  L.sign(22, S - 1, 'SLÅ HUVUDET I K-BLOCKEN. DET FINNS SAKER I DEM!');
  L.str(25, S - 4, '?B B?');
  L.pup(27, S - 4, 'heart');
  L.set(27, S - 8, '$');

  // första fienden
  L.sign(33, S - 1, 'FIENDE! HOPPA PÅ DEN - ELLER KLICKA MED MUSEN FÖR ATT SKJUTA.');
  L.set(40, S - 1, 'e');

  // grop
  L.pit(46, 48);
  L.coinArc(45, S - 3, 5);

  // upphöjning
  L.set(52, S - 1, '#');
  L.ground(53, 60, S - 3);
  L.coins(54, S - 4, 4);
  L.set(59, S - 4, 'e');

  // kikare + papp-kevin
  L.sign(65, S - 1, 'STÅ STILL OCH HÅLL IN E - ELLER HÖGERKLICKA - FÖR ATT SPANA MED KIKAREN!');
  L.plat(69, S - 3, 4);
  L.plat(74, S - 6, 4);
  L.plat(69, S - 9, 4);
  L.set(76, S - 7, 'k');
  L.coins(69, S - 4, 4);
  L.set(70, S - 10, '*');
  L.coins(71, S - 10, 2);

  L.set(84, S - 1, 'c');
  L.sign(88, S - 1, 'TAGGIS HAR TAGGAR - HOPPA INTE PÅ DEN. SKJUT DEN ISTÄLLET!');
  L.set(91, S - 1, 'e');
  L.fill(94, S - 3, 95, S - 1, 'X');
  L.set(99, S - 1, 'z');
  L.str(97, S - 5, '?B?');

  // studsmatta + vatten
  L.sign(102, S - 1, 'STUDSMATTA! HÅLL INNE HOPP NÄR DU LANDAR SÅ FLYGER DU HÖGRE.');
  L.set(105, S - 1, 's');
  L.plat(100, 8, 8);
  L.coins(100, 7, 3);
  L.set(103, 7, '*');
  L.coins(104, 7, 4);
  liquidPit(L, 106, 129, 2);
  L.plat(108, S - 2, 3);
  L.plat(113, S - 4, 3);
  L.plat(118, S - 2, 3);
  L.plat(123, S - 4, 3);
  L.coins(108, S - 3, 3);
  L.coins(113, S - 5, 3);
  L.coins(123, S - 5, 3);
  L.pup(119, S - 7, 'triple');
  L.set(114, 8, 'b');

  // spricka + hemligt rum
  L.sign(133, S - 1, 'SPRUCKNA VÄGGAR GÅR ATT SKJUTA SÖNDER. VAD GÖMMER SIG BAKOM?');
  L.plat(134, S - 3, 3);
  L.ground(138, 148, S - 5);
  L.fill(140, S - 3, 146, S - 1, ':');
  L.fill(138, S - 2, 139, S - 1, '%');
  L.coins(141, S - 1, 3);
  L.set(145, S - 1, '*');
  L.coins(140, S - 6, 7);
  L.set(147, S - 6, 'e');

  // Kevin syns första gången
  L.plat(155, S - 5, 5);
  L.set(157, S - 6, '1');
  L.set(163, S - 1, 'e');
  L.set(170, S - 1, 'g');

  // sista kullen med hemligt rum
  L.sign(172, S - 1, 'EN DEL VÄGGAR ÄR BARA KULISSER... LITA PÅ KEVIN-RADARN!');
  L.ground(176, 191, S - 6);
  L.fill(176, S - 3, 188, S - 1, ':');
  L.coins(179, S - 1, 4);
  L.set(185, S - 1, 'K');
  L.coins(178, S - 7, 5);
  return L.def();
}

function l12() {
  const S = 22;
  const L = new Lvl({
    id: '1-2', world: 1, num: 2, name: 'BLOMMANDE BACKAR', theme: 'kullar', w: 234, h: 26, par: 210,
    hint: 'KEVIN ÄR SNABB IDAG. HÄNG MED!',
    kevinLine: 'OKEJ, DU VANN! JAG TRODDE ALDRIG ATT DU SKULLE HITTA DE OSYNLIGA BLOCKEN.',
  });
  L.ground(0, 233, S);
  L.set(3, S - 1, '@');
  L.sign(7, S - 1, 'KEVIN KAN SMITA! FÖLJ KEVIN-RADARN UPPE TILL HÖGER: KALLT, VARMT, HETT!');
  L.coins(9, S - 1, 3);
  L.str(12, S - 4, '? ? ?');

  // kullar
  L.ground(20, 25, S - 2);
  L.ground(26, 33, S - 4);
  L.ground(34, 38, S - 2);
  L.ground(44, 50, S - 3);
  L.set(29, S - 5, 'g');
  L.set(47, S - 4, 'g');
  L.str(28, S - 8, 'B?B');
  L.coinArc(39, S - 3, 5);
  L.set(36, S - 3, 'e');
  L.set(41, S - 1, 'e');

  // bro över vatten + diamant högt upp
  liquidPit(L, 51, 74, 2);
  L.plat(51, S - 2, 8);
  L.plat(61, S - 2, 7);
  L.plat(70, S - 2, 5);
  L.set(64, S - 3, '1');
  L.set(58, S - 8, 'b');
  L.set(69, S - 9, 'b');
  L.coins(52, S - 5, 5);
  L.coins(62, S - 6, 4);
  L.plat(46, S - 6, 3);
  L.plat(50, S - 9, 3);
  L.plat(54, S - 12, 5);
  L.set(56, S - 13, '*');
  L.coins(54, S - 13, 2);
  L.coins(57, S - 13, 2);

  L.set(78, S - 1, 'c');

  // två vägar: mark och himmel
  L.set(82, S - 1, 's');
  L.plat(84, 12, 6);
  L.plat(92, 11, 5);
  L.plat(100, 12, 6);
  L.plat(109, 11, 5);
  L.plat(116, 12, 5);
  L.coins(84, 11, 6);
  L.coins(92, 10, 5);
  L.coins(100, 11, 2);
  L.set(102, 11, '*');
  L.coins(103, 11, 3);
  L.coins(116, 11, 5);
  L.set(112, 10, '2');
  L.set(97, 6, 'b');
  L.str(88, S - 4, '?B B?');
  L.pup(90, S - 4, 'shield');
  L.fill(96, S - 2, 97, S - 1, 'X');
  L.set(93, S - 1, 'e');
  L.set(100, S - 1, 'z');
  L.fill(104, S - 3, 105, S - 1, 'X');
  L.set(108, S - 1, 'e');
  L.set(111, S - 1, 'e');
  L.fill(114, S - 4, 115, S - 1, 'X');
  L.set(118, S - 1, 'g');

  // rörliga plattformar över vatten
  liquidPit(L, 122, 151, 2);
  L.mover(124, S - 3, 3, 'h', 2, 0.02, 0);
  L.ground(131, 133, S - 2);
  L.set(132, S - 3, '*');
  L.mover(136, S - 4, 3, 'v', 3, 0.025, 1.5);
  L.mover(142, S - 3, 3, 'h', 2, 0.022, 3);
  L.str(147, S - 3, 'xxx');
  L.coins(125, S - 6, 3);
  L.coins(142, S - 7, 3);

  // tegelborg + osynliga block
  L.sign(152, S - 1, 'PSST... HÄR FINNS OSYNLIGA BLOCK. HOPPA DÄR MYNTEN SVÄVAR!');
  L.plat(154, S - 3, 3);
  L.fill(158, S - 4, 180, S - 4, 'B');
  L.fill(158, S - 3, 158, S - 3, 'B');
  L.fill(180, S - 3, 180, S - 1, 'B');
  L.fill(165, S - 2, 166, S - 1, 'X');
  L.fill(172, S - 2, 173, S - 1, 'X');
  L.str(161, S - 4, '?B$');
  L.str(168, S - 4, 'B!B');
  L.pup(169, S - 4, 'magnet');
  L.set(162, S - 1, 'e');
  L.set(169, S - 1, 'e');
  L.set(176, S - 1, 'z');
  L.coins(159, S - 1, 3);
  L.coins(167, S - 1, 4);
  L.coins(174, S - 1, 2);
  // osynliga block från taket (rad 18) uppåt
  const hb = [[176, 15], [179, 12], [176, 9], [179, 6]];
  for (const [x, y] of hb) { L.set(x, y, ';'); L.set(x, y + 1, 'o'); }
  L.plat(181, 5, 22);
  L.coins(184, 4, 6);

  // svävande ö med hemligt rum
  L.fill(203, 2, 219, 7, '#');
  L.fill(203, 3, 217, 4, ':');
  L.coins(206, 4, 4);
  L.set(214, 4, 'K');

  // slutet på marken: lockbeten
  L.ground(196, 233, S - 1);
  L.set(206, S - 2, 'k');
  L.set(214, S - 2, 'e');
  L.set(222, S - 2, 'g');
  L.set(229, S - 2, 'k');
  L.str(200, S - 6, '?B?');
  L.plat(217, S - 5, 5);
  L.coins(217, S - 6, 5);
  return L.def();
}

module.exports = [l11, l12];
