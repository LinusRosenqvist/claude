// Värld 5: LAVASLOTTET
'use strict';
const { Lvl } = require('./lib');

function lavaPit(L, x0, x1, top) {
  L.pit(x0, x1);
  L.fill(x0, top, x1, L.h - 1, '~');
}

function l51() {
  const S = 20;
  const L = new Lvl({
    id: '5-1', world: 5, num: 1, name: 'ELDPORTEN', theme: 'lava', w: 232, h: 26, par: 230,
    hint: 'RÖR INTE LAVAN! KEVIN VÄNTAR I TORNET...',
    kevinLine: 'PUH, VAD VARMT DET ÄR HÄR. BRA ATT DU KOM - VI GÅR OCH KÖPER GLASS!',
  });
  L.ground(0, 231, S);
  L.fill(0, 0, 231, 1, '#');
  L.set(3, S - 1, '@');
  L.sign(6, S - 1, 'LAVASLOTTET! RÖR INTE LAVAN - OCH SE UPP FÖR ELDKLOT SOM HOPPAR UR DEN.');
  L.coins(9, S - 1, 4);
  // lavagrop med pelare
  lavaPit(L, 17, 30, 23);
  L.ground(20, 21, S - 2);
  L.ground(25, 26, S - 2);
  L.set(23, 24, 'L');
  L.set(28, 24, 'L');
  L.coins(20, S - 3, 2);
  L.coins(25, S - 3, 2);
  // eldstav + block
  L.str(34, S - 4, '?B B?');
  L.pup(36, S - 4, 'heart');
  L.set(43, S - 6, 'F');
  L.set(48, S - 1, 'z');
  // kedjebro över lava
  lavaPit(L, 52, 69, 23);
  L.plat(52, S, 18);
  L.set(56, 24, 'L');
  L.set(62, 24, 'L');
  L.set(67, 24, 'L');
  L.coins(54, S - 3, 12, 1);
  // porten: tak + stampar
  L.set(72, S - 1, 'c');
  L.fill(74, 2, 92, 12, '#');
  L.set(78, 13, 'P');
  L.set(86, 13, 'P');
  L.coins(76, S - 1, 14);
  L.set(90, S - 1, 'E');
  // lavasjö med rörliga plattformar
  lavaPit(L, 94, 116, 22);
  L.mover(96, S - 2, 3, 'h', 2, 0.02, 0);
  L.mover(103, S - 4, 3, 'v', 2, 0.022, 1);
  L.mover(110, S - 2, 3, 'h', 2, 0.02, 2);
  L.set(101, 23, 'L');
  L.set(108, 23, 'L');
  // diamant högt ovanför sjön
  L.plat(102, 11, 5);
  L.set(104, 10, '*');
  L.coins(102, 10, 2);
  L.coins(105, 10, 2);
  L.set(98, 10, 'b');
  // korridor med eldstavar
  L.fill(117, 2, 150, 9, '#');
  L.set(124, S - 4, 'F');
  L.set(134, 12, 'F');
  L.set(144, S - 4, 'F');
  L.coins(120, S - 1, 3);
  L.coins(129, S - 1, 3);
  L.coins(139, S - 1, 3);
  L.set(131, S - 1, '1');
  L.set(148, S - 1, 'E');
  // spricka med diamant
  L.fill(151, 12, 164, S - 1, '#');
  L.fill(151, S - 2, 151, S - 1, '%');
  L.fill(152, S - 3, 157, S - 1, ':');
  L.set(156, S - 1, '*');
  L.coins(153, S - 1, 3);
  L.plat(146, 17, 3);
  L.plat(148, 14, 3);
  L.set(160, 11, 'z');
  L.coins(153, 11, 5);
  // hopp ner, fler lavagropar
  L.set(166, S - 1, 'c');
  lavaPit(L, 170, 180, 23);
  L.plat(172, S - 1, 3);
  L.plat(177, S - 2, 2);
  L.set(172, 24, 'L');
  L.set(178, 24, 'L');
  L.set(186, S - 1, 'E');
  L.set(192, S - 7, 'F');
  L.str(188, S - 4, 'B$B');
  // tornet
  L.fill(206, 6, 231, S - 1, '#');
  L.fill(206, S - 3, 206, S - 1, ':');
  L.fill(207, 10, 217, S - 1, ':');
  L.set(214, S - 1, 'K');
  L.coins(208, S - 1, 4);
  L.plat(200, 17, 3);
  L.plat(203, 14, 3);
  L.plat(200, 11, 3);
  L.plat(203, 8, 3);
  L.set(212, 5, 'k');
  L.set(226, 5, '*');
  L.coins(218, 5, 5);
  L.set(203, S - 1, 'k');
  L.set(197, S - 1, 'z');
  L.sign(194, S - 1, 'TORNET! MEN DÖRREN ÄR BORTA... HMM.');
  return L.def();
}

function l52() {
  const W = 180, H = 44;
  const L = new Lvl({
    id: '5-2', world: 5, num: 2, name: 'SLOTTETS HJÄRTA', theme: 'lava', w: W, h: H, par: 280,
    hint: 'SLOTTET ÄR FULLT AV HEMLIGA GÅNGAR. KEVIN ÄLSKAR DEM.',
    kevinLine: 'HEMLIG GÅNG, HEMLIG GÅNG, HEMLIGT RUM... OCH ÄNDÅ HITTADE DU MIG!',
  });
  // ytterväggar och bakgrund
  L.fill(0, 0, W - 1, H - 1, '#');
  L.fill(2, 3, W - 3, 40, ',');
  // våningsplan (golv-rader)
  const F2 = 32, F3 = 23, F4 = 14;
  L.fill(2, F2, W - 3, F2, '#');
  L.fill(2, F3, W - 3, F3, '#');
  L.fill(2, F4, W - 3, F4, '#');
  // öppningar mellan våningar
  L.fill(160, F2, 164, F2, ',');
  L.fill(80, F3, 84, F3, ',');
  L.fill(14, F4, 18, F4, ',');

  // --- VÅNING 1 (golv rad 41) ---
  L.set(4, 40, '@');
  L.sign(7, 40, 'SLOTTETS HJÄRTA! GÅ UPP GENOM ALLA VÅNINGAR. VISSA VÄGGAR ÄR... TUNNA.');
  L.coins(10, 40, 5);
  L.fill(24, 41, 36, 43, '~');
  L.set(28, 42, 'L');
  L.set(33, 42, 'L');
  L.plat(26, 38, 3);
  L.plat(32, 38, 3);
  L.set(44, 40, 'E');
  L.set(54, 38, 'F');
  L.str(62, 37, '?B!B?');
  L.pup(64, 37, 'shield');
  L.set(72, 40, 'z');
  L.fill(86, 41, 100, 43, '~');
  L.set(90, 42, 'L');
  L.set(96, 42, 'L');
  L.plat(88, 38, 3);
  L.plat(94, 37, 3);
  L.set(108, 40, 'E');
  // spricka + hemligt förråd med diamant
  L.fill(118, 37, 132, 40, '#');
  L.fill(118, 39, 118, 40, '%');
  L.fill(119, 38, 131, 40, ':');
  L.set(128, 40, '*');
  L.coins(121, 40, 5);
  L.plat(114, 38, 3);
  L.coins(119, 36, 12);
  L.set(140, 40, 'z');
  L.set(146, 38, 'F');
  // trappa upp till våning 2
  L.plat(154, 38, 3);
  L.plat(160, 35, 3);
  L.set(166, 40, 'c');

  // --- VÅNING 2 (golv rad 32) --- höger till vänster
  L.set(150, 31, 'E');
  L.set(140, 24, 'P');
  L.set(132, 24, 'P');
  L.coins(128, 31, 8);
  L.set(122, 31, '1');
  L.set(112, 29, 'F');
  L.set(100, 31, 'G');
  L.str(94, 28, 'B?B');
  L.set(88, 31, 'z');
  L.set(76, 31, 'k');
  L.set(66, 29, 'F');
  L.set(56, 31, 'E');
  L.set(46, 26, 'b');
  L.set(40, 31, 'c');
  // trappa upp till våning 3 vid x80
  L.plat(75, 29, 3);
  L.plat(80, 26, 3);

  // --- VÅNING 3 (golv rad 23) --- vänster till höger (till x14 längst bort åt vänster för att nå våning 4)
  L.set(90, 22, 'G');
  L.set(100, 22, 'E');
  L.set(108, 20, 'F');
  L.plat(118, 20, 4);
  L.plat(123, 17, 4);
  L.set(125, 16, '*');
  L.coins(118, 19, 4);
  L.set(132, 22, 'z');
  L.set(140, 22, 'k');
  L.set(150, 22, '2');
  L.set(160, 17, 'b');
  // gå vänster från öppningen
  L.set(70, 22, 'E');
  L.set(58, 20, 'F');
  L.set(46, 22, 'G');
  L.str(38, 19, '?B$B?');
  L.set(30, 22, 'c');
  L.plat(20, 20, 3);
  L.plat(15, 17, 3);

  // --- VÅNING 4 (golv rad 14) + vinden ---
  L.set(26, 13, 'E');
  L.set(42, 11, 'F');
  L.set(54, 13, 'G');
  L.coins(30, 13, 8);
  L.set(70, 13, 'z');
  L.set(84, 5, 'P');
  L.set(96, 13, 'k');
  L.set(110, 13, 'E');
  L.set(122, 11, 'F');
  // hemlig gång genom flera falska väggar
  L.fill(136, 3, 177, 13, '#');
  L.fill(136, 12, 139, 13, ':');
  L.fill(140, 10, 150, 13, ':');
  L.fill(151, 8, 153, 11, ':');
  L.fill(154, 6, 170, 9, ':');
  L.fill(154, 10, 158, 13, '#');
  L.set(166, 9, 'K');
  L.coins(142, 13, 6);
  L.coins(156, 9, 6);
  L.set(162, 9, '*');
  L.sign(132, 13, 'ÅTERVÄNDSGRÄND? TITTA PÅ KEVIN-RADARN...');
  return L.def();
}

module.exports = [l51, l52];
