// Värld 6: RYMDEN
'use strict';
const { Lvl } = require('./lib');

function plasmaPit(L, x0, x1, top) {
  L.pit(x0, x1);
  L.fill(x0, top, x1, L.h - 1, '~');
}

function l61() {
  const S = 26;
  const L = new Lvl({
    id: '6-1', world: 6, num: 1, name: 'MÅNPROMENADEN', theme: 'rymd', w: 252, h: 32, par: 220,
    hint: 'LÅG GRAVITATION! HOPPEN BLIR HÖGA OCH LÅNGA.',
    kevinLine: 'ETT LITET STEG FÖR KEVIN, ETT JÄTTEKLIV FÖR DIG! BRA HITTAT.',
  });
  const seg = [[0, 22, S], [29, 44, S - 2], [52, 70, S], [80, 92, S - 3], [100, 124, S], [134, 150, S - 2], [157, 178, S], [185, 251, S]];
  for (const [a, b, t] of seg) L.ground(a, b, t);
  L.set(3, S - 1, '@');
  L.sign(6, S - 1, 'LÅG GRAVITATION! DU HOPPAR HÖGRE OCH LÄNGRE HÄR UPPE I RYMDEN.');
  L.coins(9, S - 1, 4);
  L.str(13, S - 6, '?B B?');
  L.pup(15, S - 6, 'heart');
  L.set(19, S - 1, 'a');
  L.coinArc(22, S - 5, 7);
  L.set(36, S - 3, 'a');
  L.set(40, S - 12, 'u');
  L.plat(34, S - 7, 5);
  L.coins(34, S - 8, 5);
  plasmaPit(L, 58, 63, S + 2);
  L.set(55, S - 1, 'a');
  L.set(66, S - 1, 'a');
  L.coinArc(57, S - 5, 8);
  // Kevin nr 1
  L.plat(72, S - 4, 5);
  L.set(74, S - 5, '1');
  L.set(86, S - 4, 'a');
  L.set(98, S - 16, 'u');
  // satellittrappa med diamant
  L.plat(84, 19, 3);
  L.plat(89, 15, 3);
  L.plat(94, 11, 3);
  L.plat(89, 7, 3);
  L.set(90, 6, '*');
  L.coins(94, 10, 3);
  L.set(104, S - 1, 'c');
  L.set(112, S - 1, 'a');
  L.set(120, S - 1, 'p');
  L.str(106, S - 6, 'B?B$B');
  // spricka ner till plasmagrotta
  L.sign(110, S - 1, 'SPRICKOR I MARKEN... SKJUT NERÅT!');
  L.fill(114, S, 115, S, '%');
  L.fill(108, S + 1, 122, S + 3, ':');
  L.set(120, S + 3, '*');
  L.coins(109, S + 3, 4);
  L.set(116, S + 3, 'X');
  // bro
  L.plat(126, S - 4, 6);
  L.set(130, S - 13, 'u');
  L.set(140, S - 3, 'a');
  L.set(146, S - 3, 'z');
  L.set(152, S - 12, 'd');
  // Kevin nr 2 på ett torn
  L.plat(161, S - 4, 3);
  L.fill(165, S - 8, 167, S - 1, 'X');
  L.set(166, S - 9, '2');
  L.set(172, S - 1, 'a');
  L.set(176, S - 1, 'k');
  L.set(182, S - 14, 'u');
  // kraschad raket med hemligt rum
  L.set(190, S - 1, 'c');
  L.fill(214, S - 12, 230, S - 1, '#');
  L.fill(216, S - 16, 228, S - 13, '#');
  L.fill(219, S - 19, 225, S - 17, '#');
  L.fill(214, S - 3, 214, S - 1, ':');
  L.fill(215, S - 6, 227, S - 1, ':');
  L.set(224, S - 1, 'K');
  L.coins(217, S - 1, 4);
  L.set(204, S - 1, 'k');
  L.set(236, S - 1, 'k');
  L.set(240, S - 1, 'a');
  L.plat(206, S - 4, 3);
  L.plat(209, S - 8, 3);
  L.set(222, S - 20, '*');
  L.set(198, S - 1, 'p');
  L.sign(200, S - 1, 'EN KRASCHAD RAKET! UNDRAR OM NÅGON ÄR KVAR DÄR INNE...');
  return L.def();
}

function l62() {
  const S = 30;
  const L = new Lvl({
    id: '6-2', world: 6, num: 2, name: 'STJÄRNBASEN', theme: 'rymd', w: 222, h: 34, par: 260, gravity: 1,
    hint: 'ROBO-KEVINS BAS. HÄR FINNS MASSOR AV PAPP-KEVINS...',
    kevinLine: 'SSSCH! JAG SMET IN I BASEN FÖR ATT SPIONERA PÅ ROBO-KEVIN. HAN BOR I NÄSTA RUM!',
  });
  L.fill(0, 0, 221, 33, '#');
  L.fill(2, 18, 219, S - 1, ',');
  L.fill(2, 6, 113, 12, ',');
  L.fill(114, 6, 119, S - 1, ',');
  // start
  L.set(4, S - 1, '@');
  L.sign(7, S - 1, 'STJÄRNBASEN! ROBO-KEVIN HAR BYGGT MASSOR AV PAPP-KEVINS HÄR. LITA PÅ RADARN!');
  L.coins(10, S - 1, 4);
  L.set(16, S - 1, 'k');
  L.set(22, S - 1, 'p');
  L.fill(26, S, 34, S, '>');
  L.set(30, S - 1, 'o');
  L.set(38, 24, 'd');
  L.str(42, 25, '?B B?');
  L.pup(44, 25, 'triple');
  L.set(50, S - 1, 'k');
  // mellanvåning
  L.plat(51, 27, 3);
  L.plat(54, 24, 2);
  L.fill(56, 22, 100, 22, '#');
  L.set(60, 21, 'p');
  L.set(70, 21, 'k');
  L.set(76, 19, 'd');
  L.set(84, 21, '1');
  L.set(92, 21, 'k');
  L.set(99, 21, 'C');
  L.coins(62, 21, 6);
  L.set(64, S - 1, 'z');
  L.set(74, S - 1, 'k');
  L.set(88, S - 1, 'p');
  L.fill(66, S, 80, S, '<');
  // förråd med diamant
  L.fill(101, 23, 108, S - 1, '#');
  L.fill(101, 28, 101, S - 1, '%');
  L.fill(102, 26, 107, S - 1, ':');
  L.set(105, S - 1, '*');
  L.coins(103, S - 1, 2);
  L.set(111, S - 1, 'c');
  // jetpack och schakt
  L.set(113, S - 1, 'j');
  L.sign(116, S - 1, 'EN JETPACK! SCHAKTET GÅR HÖGT UPP...');
  L.set(117, 17, 'f');
  L.plat(114, 23, 2);
  L.plat(118, 17, 2);
  // övre korridoren, åt vänster
  L.set(108, 12, 'k');
  L.set(96, 12, 'p');
  L.set(82, 12, 'k');
  L.set(70, 8, 'd');
  L.coins(84, 12, 8);
  L.set(60, 12, 'k');
  L.set(48, 12, 'p');
  L.plat(38, 10, 4);
  L.set(40, 9, '*');
  L.set(30, 12, 'k');
  // hemligt labb
  L.fill(2, 6, 20, 12, '#');
  L.fill(4, 8, 20, 12, ':');
  L.set(8, 12, 'K');
  L.coins(10, 12, 5);
  L.set(24, 12, 'k');
  L.sign(26, 12, 'ÅTERVÄNDSGRÄND? KEVIN-RADARN SÄGER NÅGOT ANNAT...');
  // högra delen av nedre korridoren
  L.set(146, S - 1, 'k');
  L.set(152, S - 1, 'p');
  L.fill(158, S, 170, S, '>');
  L.set(174, 24, 'd');
  L.set(180, S - 1, 'k');
  L.set(190, S - 1, 'z');
  L.str(184, 25, 'B$B');
  L.set(198, S - 1, 'k');
  L.fill(204, 26, 208, S - 1, '#');
  L.fill(204, 28, 204, S - 1, '%');
  L.fill(205, 28, 207, S - 1, ':');
  L.set(206, S - 1, '*');
  L.set(212, S - 1, 'k');
  L.sign(216, S - 1, 'INGEN KEVIN HÄR. BARA PAPP. PAPP PAPP PAPP.');
  return L.def();
}

function l63() {
  const S = 17;
  const L = new Lvl({
    id: '6-3', world: 6, num: 3, name: 'ROBO-KEVINS LYA', theme: 'rymd', w: 76, h: 20, par: 180, gravity: 1, boss: true,
    arena: { x: 46, w: 30 },
    music: 'rymd',
    hint: 'ROBO-KEVIN HAR FÅNGAT DEN RIKTIGA KEVIN!',
    kevinLine: 'DU BESEGRADE ROBO-KEVIN! TACK - NU HAR JAG EN ÖVERRASKNING TILL DIG...',
  });
  L.ground(0, 75, S);
  L.fill(0, 0, 75, 1, '#');
  L.set(3, S - 1, '@');
  L.sign(6, S - 1, 'DET HÄR ÄR DET. ROBO-KEVIN VÄNTAR LÄNGRE IN. SKJUT HONOM MED MUSEN - HOPPA PÅ HONOM NÄR HAN ÄR YR!');
  L.coins(10, S - 1, 6);
  L.str(18, S - 5, '?B!B?');
  L.pup(20, S - 5, 'heart');
  L.set(26, S - 1, 'k');
  L.set(30, S - 1, 'p');
  L.str(34, S - 5, 'B!B');
  L.pup(35, S - 5, 'shield');
  L.set(40, S - 1, 'c');
  // arenan
  L.plat(52, S - 4, 4);
  L.plat(66, S - 4, 4);
  L.set(60, 6, 'R');
  L.set(72, S - 1, 'K');
  return L.def();
}

module.exports = [l61, l62, l63];
