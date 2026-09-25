// Värld 2: NEONSTADEN
'use strict';
const { Lvl } = require('./lib');

function goo(L, x0, x1) {
  L.pit(x0, x1);
  L.fill(x0, L.h - 2, x1, L.h - 1, '~');
}

function l21() {
  const L = new Lvl({
    id: '2-1', world: 2, num: 1, name: 'TAKÅSARNA', theme: 'stad', w: 232, h: 28, par: 220,
    hint: 'HOPPA MELLAN TAKEN. KEVIN GILLAR NEONSKYLTAR...',
    kevinLine: 'DU HITTADE MIN HEMLIGA LÄGENHET! DEN HAR JAG INTE BERÄTTAT FÖR NÅGON OM.',
  });
  // hus (tak-rader)
  const B = (x0, x1, roof) => L.ground(x0, x1, roof);
  B(0, 18, 20);
  B(22, 34, 18);
  B(39, 55, 21);
  B(59, 70, 17);
  B(74, 90, 22);
  B(91, 104, 19);
  B(115, 135, 20);
  B(140, 160, 13);
  B(163, 180, 21);
  B(184, 231, 19);
  // gator med giftslem i botten
  for (const [a, b] of [[19, 21], [35, 38], [56, 58], [71, 73], [105, 114], [136, 139], [161, 162]]) goo(L, a, b);

  L.set(3, 19, '@');
  L.sign(6, 19, 'NEONSTADEN! HOPPA MELLAN TAKEN. ROBOTAR OCH DRÖNARE SKJUTER - AKTA DIG!');
  L.coins(9, 19, 5);
  L.str(12, 16, '?B?');
  // hus 2
  L.set(27, 17, 'd');
  L.str(25, 14, 'B!B');
  L.pup(26, 14, 'heart');
  L.coinArc(35, 16, 4);
  // hus 3: rullband + kanon
  L.fill(44, 21, 50, 21, '>');
  L.set(47, 20, 'o');
  L.set(42, 20, 'p');
  L.set(53, 20, 'C');
  L.plat(56, 18, 3);
  // hus 4: Kevin syns
  L.set(66, 16, '1');
  L.set(62, 16, 'e');
  L.coins(60, 13, 5);
  // hus 5: skyltställning med diamant
  L.fill(80, 18, 84, 21, 'X');
  L.plat(79, 15, 7);
  L.set(82, 14, '*');
  L.set(77, 21, 'p');
  L.set(88, 21, 'c');
  // hus 6
  L.set(97, 18, 'z');
  L.str(95, 15, '?B$B?');
  L.set(101, 13, 'd');
  // stort hopp med rörliga plattformar
  L.mover(107, 19, 3, 'h', 1.5, 0.025, 0);
  L.mover(111, 16, 3, 'v', 2, 0.02, 1);
  L.coins(107, 16, 3);
  L.set(110, 9, 'd');
  // hus 7
  L.fill(120, 20, 126, 20, '<');
  L.set(123, 19, 'p');
  L.set(130, 19, '2');
  L.str(127, 16, 'B!B');
  L.pup(128, 16, 'shield');
  L.set(134, 19, 's');
  // hus 8: högt tak
  L.set(145, 12, 'd');
  L.set(150, 12, 'p');
  L.set(157, 11, '*');
  L.plat(155, 12, 4);
  L.fill(155, 12, 158, 12, '=');
  L.coins(142, 12, 6);
  L.set(159, 12, 'C');
  // hus 9 + gränd
  L.set(166, 20, 'c');
  L.set(172, 20, 'e');
  L.set(176, 20, 'k');
  L.pit(181, 183);
  L.fill(181, 26, 183, 27, '#');
  L.set(182, 25, '3');
  L.set(181, 25, 's');
  L.sign(179, 20, 'GRÄNDEN ÄR TOM... ELLER?');
  // hemlig gång + lägenhet i sista huset
  L.fill(184, 24, 199, 25, ':');
  L.fill(200, 21, 214, 25, ':');
  L.coins(186, 25, 6);
  L.set(210, 25, 'K');
  L.coins(202, 25, 5);
  // tak på sista huset
  L.set(190, 18, 'p');
  L.set(198, 18, 'e');
  L.fill(206, 15, 208, 18, 'X');
  L.plat(212, 14, 5);
  L.set(214, 13, '*');
  L.set(222, 18, 'k');
  L.set(226, 12, 'd');
  L.str(217, 15, '?B?');
  return L.def();
}

function l22() {
  // Lodrät nivå: klättra upp för skyskrapan.
  const H = 92;
  const L = new Lvl({
    id: '2-2', world: 2, num: 2, name: 'NEONNATTEN', theme: 'stad', w: 42, h: H, par: 240,
    hint: 'KEVIN ÄR PÅ TAKET. KLÄTTRA HELA VÄGEN UPP!',
    kevinLine: 'VILKEN UTSIKT, VA? JAG VISSTE ATT DU SKULLE KLARA KLÄTTRINGEN.',
  });
  // väggar och gata
  L.fill(0, 0, 3, H - 1, '#');
  L.fill(38, 0, 41, H - 1, '#');
  L.ground(4, 37, H - 4);
  L.set(6, H - 5, '@');
  L.sign(9, H - 5, 'KEVIN ÄR PÅ TAKET! KLÄTTRA UPPÅT - TITTA UPP MED W ELLER KIKAREN.');
  L.coins(14, H - 5, 4);
  L.set(24, H - 5, 'p');
  // zick-zack med plattformar, var tredje rad
  const plats = [
    [26, 5], [18, 5], [9, 6], [15, 4], [23, 5], [30, 5], [22, 4], [13, 5], [5, 5], [11, 4], [19, 5], [27, 6], [33, 4],
    [26, 4], [18, 5], [10, 5], [5, 4], [12, 5], [20, 4], [28, 5], [33, 4], [25, 5], [17, 5], [9, 5], [15, 6],
  ];
  const ys = [];
  let y = H - 7;
  for (const [x, w] of plats) {
    L.plat(x, y, w);
    ys.push([x, y, w]);
    y -= 3;
  }
  const at = (i) => ys[i];
  // rullband på några avsatser
  for (const [i, ch] of [[3, '<'], [10, '>'], [18, '<']]) {
    const [x, yy, w] = at(i);
    L.fill(x, yy, x + w - 1, yy, ch);
  }
  // fiender
  L.set(at(2)[0] + 2, at(2)[1] - 1, 'e');
  L.set(20, at(5)[1] - 4, 'd');
  L.set(at(7)[0] + 1, at(7)[1] - 1, 'p');
  L.set(28, at(12)[1] - 5, 'd');
  L.set(at(14)[0] + 1, at(14)[1] - 1, 'z');
  L.set(12, at(19)[1] - 4, 'd');
  L.set(at(21)[0] + 1, at(21)[1] - 1, 'p');
  L.set(24, at(23)[1] - 3, 'b');
  // kanoner i väggarna
  L.set(4, at(8)[1] - 1, 'C');
  L.set(37, at(16)[1] - 1, 'C');
  L.set(4, at(22)[1] - 1, 'C');
  // mynt och block
  L.coins(at(1)[0], at(1)[1] - 1, 4);
  L.coins(at(6)[0], at(6)[1] - 1, 4);
  L.coins(at(11)[0], at(11)[1] - 1, 5);
  L.coins(at(17)[0], at(17)[1] - 1, 4);
  L.coins(at(20)[0], at(20)[1] - 1, 4);
  L.pup(at(4)[0] + 2, at(4)[1] - 5, 'triple');
  L.pup(at(15)[0] + 2, at(15)[1] - 5, 'heart');
  // checkpoints
  L.set(at(8)[0] + 2, at(8)[1] - 1, 'c');
  L.set(at(16)[0] + 1, at(16)[1] - 1, 'c');
  // Kevin på vägen upp
  L.set(at(9)[0] + 2, at(9)[1] - 1, '1');
  L.set(at(19)[0] + 2, at(19)[1] - 1, '2');
  // diamanter på avsides avsatser
  L.plat(34, at(6)[1] - 2, 4);
  L.set(35, at(6)[1] - 3, '*');
  L.plat(4, at(13)[1] - 1, 3);
  L.set(4, at(13)[1] - 2, '*');
  L.plat(34, at(20)[1] - 2, 4);
  L.set(35, at(20)[1] - 3, '*');
  // taket
  const last = at(ys.length - 1);
  const roofY = last[1] - 3;
  L.fill(4, roofY, 37, roofY, '#');
  L.fill(last[0], roofY, last[0] + last[2] - 1, roofY, '=');
  // takterrass med vattentank (hemligt rum)
  L.fill(4, roofY - 9, 12, roofY - 1, '#');
  L.fill(4, roofY - 7, 12, roofY - 1, ':');
  L.set(7, roofY - 1, 'K');
  L.coins(5, roofY - 1, 2);
  L.set(22, roofY - 1, 'k');
  L.set(31, roofY - 1, 'k');
  L.set(27, roofY - 4, 'd');
  L.coins(20, roofY - 4, 6);
  L.sign(35, roofY - 1, 'TAKET! MEN VAR ÄR KEVIN? LYSSNA PÅ RADARN...');
  return L.def();
}

module.exports = [l21, l22];
