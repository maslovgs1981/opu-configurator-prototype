/* Конфигуратор ОПУ. Чертёж схематичный, геометрия постоянная, значения меняются.
   Вставка на сайт: <div id="opu-konfigurator" data-endpoint="/opu/send.php"></div>
   <link rel="stylesheet" href="opu.css"><script src="opu.js"></script> */
(function () {
  'use strict';

  /* ---------- справочник полей ---------- */
  var F = {
    De:  ['Наружный диаметр De', 'мм'],
    de:  ['Диаметр расточки наружного кольца de', 'мм'],
    di:  ['Наружный диаметр внутреннего кольца di', 'мм'],
    Di:  ['Внутренний диаметр Di', 'мм'],
    Dce: ['Центрирующий бурт наружного кольца Dce', 'мм'],
    Dci: ['Центрирующий бурт внутреннего кольца Dci', 'мм'],
    Dx:  ['Диаметр посадочного уступа Dx', 'мм'],
    U:   ['Диаметр уступа наружного кольца U', 'мм'],
    V:   ['Диаметр уступа внутреннего кольца V', 'мм'],
    a:   ['Диаметр бурта a', 'мм'],
    Fe:  ['Окружность отверстий наружного кольца Fe', 'мм'],
    Ne:  ['Количество отверстий наружного кольца Ne', 'шт'],
    Fi:  ['Окружность отверстий внутреннего кольца Fi', 'мм'],
    Ni:  ['Количество отверстий внутреннего кольца Ni', 'шт'],
    N:   ['Количество отверстий N', 'шт'],
    m:   ['Модуль зацепления m', 'мм'],
    Z:   ['Число зубьев Z', 'шт'],
    x:   ['Смещение исходного контура x', 'мм'],
    H:   ['Высота общая', 'мм'],
    He:  ['Высота наружного кольца He', 'мм'],
    Hi:  ['Высота внутреннего кольца Hi', 'мм'],
    Ht:  ['Высота общая Ht', 'мм'],
    Hd:  ['Высота зубчатого венца Hd', 'мм'],
    hf:  ['Высота фланца', 'мм'],
    he:  ['Глубина уступа наружного кольца he', 'мм'],
    hi:  ['Глубина уступа внутреннего кольца hi', 'мм'],
    hl:  ['Высота бурта hl', 'мм'],
    L:   ['Размер отверстия L', 'мм'],
    W:   ['Размер W', 'мм'],
    oe:  ['Диаметр отверстий наружного кольца Ø', 'мм'],
    oi:  ['Диаметр отверстий внутреннего кольца Ø', 'мм'],
    oeM: ['Резьба отверстий наружного кольца M', ''],
    oiM: ['Резьба отверстий внутреннего кольца M', ''],
    ge:  ['Глубина отверстия наружного кольца', 'мм'],
    gi:  ['Глубина отверстия внутреннего кольца', 'мм'],
    d:   ['Внутренний диаметр d', 'мм'],
    D:   ['Наружный диаметр D', 'мм'],
    B:   ['Ширина B', 'мм'],
    Dp:  ['Делительный диаметр Dp', 'мм'],
    ds:  ['Диаметр опоры вала ds', 'мм'],
    dh:  ['Диаметр опоры корпуса dh', 'мм'],
    D1:  ['Диаметр D1', 'мм'],
    C:   ['Ширина C', 'мм'],
    H1:  ['Высота H1', 'мм'],
    H2:  ['Высота H2', 'мм']
  };

  function fld(k, def, alt) { var kk = alt || k; return { k: k, label: F[kk][0], unit: F[kk][1], def: def }; }

  /* ---------- геометрия, общие примитивы ---------- */
  var AX = 720;      // ось изделия справа, все диаметры меряются от неё
  var VB = [0, 0, 780, 600];

  function esc(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;'); }
  function fmt(v) {
    if (v === '' || v === null || v === undefined) return '';
    var n = parseFloat(String(v).replace(',', '.'));
    if (!isFinite(n)) return esc(v);
    return String(Math.round(n * 100) / 100).replace('.', ',');
  }

  function hatchRect(x, y, w, h, cls) {
    return '<rect class="k-ring ' + (cls || '') + '" x="' + x + '" y="' + y + '" width="' + w + '" height="' + h + '"/>';
  }
  function hatchPath(d, cls) { return '<path class="k-ring ' + (cls || '') + '" d="' + d + '"/>'; }
  function white(x, y, w, h) { return '<rect class="k-white" x="' + x + '" y="' + y + '" width="' + w + '" height="' + h + '"/>'; }
  function cl(x, y0, y1) { return '<line class="k-cl" x1="' + x + '" y1="' + y0 + '" x2="' + x + '" y2="' + y1 + '"/>'; }
  function thin(d) { return '<path class="k-thin" d="' + d + '"/>'; }
  function ball(cx, cy, r) { return '<circle class="k-ball" cx="' + cx + '" cy="' + cy + '" r="' + r + '"/>'; }
  function roller(cx, cy, r) {   // перекрёстный ролик, ромб
    return '<path class="k-ball" d="M' + cx + ',' + (cy - r) + ' L' + (cx + r) + ',' + cy + ' L' + cx + ',' + (cy + r) + ' L' + (cx - r) + ',' + cy + ' z"/>';
  }
  function rollBox(x, y, w, h) { return '<rect class="k-ball" x="' + x + '" y="' + y + '" width="' + w + '" height="' + h + '" rx="2"/>'; }
  function seal(x, y, dir) {      // уплотнение, чёрная скобка
    var s = dir < 0 ? -1 : 1;
    return '<path class="k-seal" d="M' + x + ',' + y + ' l' + (14 * s) + ',0 l' + (10 * s) + ',' + (6 * s) + ' l-4,4 l' + (-8 * s) + ',' + (-4 * s) + ' l' + (-12 * s) + ',0 z"/>';
  }
  function plugs(x, y) {          // G масленка и P пробка
    return '<path class="k-plug" d="M' + (x - 14) + ',' + (y - 5) + ' l10,5 l-10,5 z"/>' +
      '<path class="k-plug2" d="M' + (x + 2) + ',' + (y - 5) + ' l10,5 l-10,5 z"/>' +
      '<text class="k-tiny" x="' + (x - 16) + '" y="' + (y - 8) + '">G</text><text class="k-tiny" x="' + (x + 4) + '" y="' + (y - 8) + '">P</text>';
  }
  /* отверстие в кольце: through Ø, thread M, counterbore (сквозное с уступом) */
  function hole(kind, x, y0, y1, w, depth) {
    var s = '';
    if (kind === 'thread') {
      var d = depth || (y1 - y0) * 0.6;
      s += white(x - w / 2, y1 - d, w, d);
      s += '<path class="k-thin" d="M' + (x - w / 2 - 3) + ',' + (y1 - d) + ' v' + d + ' M' + (x + w / 2 + 3) + ',' + (y1 - d) + ' v' + d + '"/>';
      s += '<path class="k-obj" d="M' + (x - w / 2) + ',' + (y1 - d) + ' l' + (w / 2) + ',-7 l' + (w / 2) + ',7"/>';
      s += cl(x, y1 - d - 12, y1 + 8);
    } else {
      s += white(x - w / 2, y0, w, y1 - y0);
      s += cl(x, y0 - 10, y1 + 10);
    }
    return s;
  }
  /* зубчатый венец: серый блок с уклоном зуба, side 'ext' слева, 'int' справа */
  function teeth(side, x0, x1, y0, y1) {
    if (side === 'ext') {
      return '<path class="k-teeth" d="M' + x1 + ',' + y0 + ' L' + (x0 + 6) + ',' + (y0 + 8) + ' L' + x0 + ',' + (y0 + 26) + ' L' + x0 + ',' + (y1 - 26) + ' L' + (x0 + 6) + ',' + (y1 - 8) + ' L' + x1 + ',' + y1 + ' z"/>' +
        cl((x0 + x1) / 2, y0 - 10, y1 + 10);
    }
    // внутреннее: белое поле с линией зуба
    return '<rect class="k-white" x="' + x0 + '" y="' + y0 + '" width="' + (x1 - x0) + '" height="' + (y1 - y0) + '"/>' +
      '<line class="k-tooth" x1="' + (x1 + 4) + '" y1="' + (y0 - 14) + '" x2="' + (x0 + (x1 - x0) * 0.35) + '" y2="' + (y1 + 14) + '"/>';
  }

  /* размерные цепочки. dims: [{k, x, side:'top'|'bottom', tol}] — x это левый край диаметра,
     правый край на оси AX. Цепочки укладываются лесенкой от чертежа наружу. */
  function hdims(list, yTop, yBot, vals) {
    var s = '';
    var top = list.filter(function (d) { return d.side === 'top'; });
    var bot = list.filter(function (d) { return d.side === 'bottom'; });
    // верх: самая короткая ближе к детали
    top.sort(function (a, b) { return b.x - a.x; });
    bot.sort(function (a, b) { return b.x - a.x; });
    function one(d, y, dir) {
      var val = fmt(vals[d.k]);
      var txt = (d.pre || '') + val + (d.tol ? '<tspan class="k-tol" dy="-6">' + d.tol + '</tspan>' : '');
      s += '<line class="k-dim" x1="' + d.x + '" y1="' + y + '" x2="' + (AX - 10) + '" y2="' + y + '" marker-start="url(#k-al)"/>';
      s += '<line class="k-ext" x1="' + d.x + '" y1="' + (dir < 0 ? y - 4 : y + 4) + '" x2="' + d.x + '" y2="' + (dir < 0 ? yTop - 6 : yBot + 6) + '"/>';
      s += '<text class="k-txt" x="' + (AX - 16) + '" y="' + (y - 5) + '" text-anchor="end">' + txt + '</text>';
    }
    top.forEach(function (d, i) { one(d, yTop - 26 - i * 24, -1); });
    bot.forEach(function (d, i) { one(d, yBot + 30 + i * 24, 1); });
    // осевая линия
    s += '<line class="k-axis" x1="' + AX + '" y1="' + (yTop - 40 - top.length * 24) + '" x2="' + AX + '" y2="' + (yBot + 44 + bot.length * 24) + '"/>';
    return s;
  }
  /* вертикальные размеры: [{k, y0, y1, x, side:'left'|'right', tol}] лесенкой */
  function vdims(list, vals) {
    var s = '';
    list.forEach(function (d) {
      var val = fmt(vals[d.k]);
      var txt = val + (d.tol ? '<tspan class="k-tol" dy="-6">' + d.tol + '</tspan>' : '');
      s += '<line class="k-dim" x1="' + d.x + '" y1="' + d.y0 + '" x2="' + d.x + '" y2="' + d.y1 + '" marker-start="url(#k-al)" marker-end="url(#k-ar)"/>';
      var ex0 = d.side === 'left' ? d.x - 4 : d.x + 4, ex1 = d.ext;
      s += '<line class="k-ext" x1="' + ex0 + '" y1="' + d.y0 + '" x2="' + ex1 + '" y2="' + d.y0 + '"/>';
      s += '<line class="k-ext" x1="' + ex0 + '" y1="' + d.y1 + '" x2="' + ex1 + '" y2="' + d.y1 + '"/>';
      var tx = d.side === 'left' ? d.x - 6 : d.x + 6;
      s += '<text class="k-txt" transform="rotate(-90 ' + tx + ' ' + ((d.y0 + d.y1) / 2) + ')" x="' + tx + '" y="' + ((d.y0 + d.y1) / 2 + (d.side === 'left' ? 0 : 12)) + '" text-anchor="middle">' + txt + '</text>';
    });
    return s;
  }
  /* подпись отверстия: "Ø18" или "M12" со стрелкой к отверстию */
  function holeLabel(x, y, text, below) {
    return '<line class="k-ext" x1="' + x + '" y1="' + (below ? y : y) + '" x2="' + x + '" y2="' + (below ? y + 16 : y - 16) + '"/>' +
      '<text class="k-txt" x="' + x + '" y="' + (below ? y + 30 : y - 20) + '" text-anchor="middle">' + esc(text) + '</text>';
  }
  function defs() {
    return '<defs>' +
      '<pattern id="k-hg" width="8" height="8" patternTransform="rotate(45)" patternUnits="userSpaceOnUse"><rect width="8" height="8" fill="#d6ec5e"/><line x1="0" y1="0" x2="0" y2="8" stroke="#6b7a22" stroke-width="1"/></pattern>' +
      '<pattern id="k-hs" width="8" height="8" patternTransform="rotate(45)" patternUnits="userSpaceOnUse"><rect width="8" height="8" fill="#c9ccd2"/><line x1="0" y1="0" x2="0" y2="8" stroke="#5e626a" stroke-width="1"/></pattern>' +
      '<marker id="k-ar" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="8" markerHeight="8" orient="auto"><path d="M0,1 L10,5 L0,9 z" fill="#111"/></marker>' +
      '<marker id="k-al" viewBox="0 0 10 10" refX="1" refY="5" markerWidth="8" markerHeight="8" orient="auto"><path d="M10,1 L0,5 L10,9 z" fill="#111"/></marker>' +
      '</defs>';
  }

  /* ---------- сцены по семействам ----------
     Общая схема одного ряда тел качения: наружное кольцо слева [xo0..xo1], зазор,
     внутреннее кольцо справа [xi0..xi1]. Высоты: наружное yo0..yo1, внутреннее yi0..yi1.
     Опции: gear 'ext'|'int'|'none', flange 'e'|'i'|'ei'|'', body 'ball'|'roller'|'ball2'|'roller3' */
  function oneRow(o, v) {
    var s = '';
    var yo0 = o.yo0, yo1 = o.yo1, yi0 = o.yi0, yi1 = o.yi1;
    var xo0 = o.xo0, xo1 = o.xo1, xi0 = o.xi0, xi1 = o.xi1;
    var cy = (Math.max(yo0, yi0) + Math.min(yo1, yi1)) / 2;
    var fl = 34;  // ширина фланца
    var fh = 40;  // высота фланца
    // наружное кольцо
    if (o.flange === 'e' || o.flange === 'ei') {
      s += hatchPath('M' + (xo0 - fl) + ',' + yo0 + ' H' + xo1 + ' V' + yo1 + ' H' + xo0 + ' V' + (yo0 + fh) + ' H' + (xo0 - fl) + ' z');
      s += hole('through', xo0 - fl / 2, yo0, yo0 + fh, 16);
      s += holeLabel(xo0 - fl / 2, yo0 + fh, 'Ø' + fmt(v.oe), true);
    } else {
      s += hatchRect(xo0, yo0, xo1 - xo0, yo1 - yo0);
      var hx = (xo0 + xo1) / 2 - (o.gear === 'ext' ? 0 : 0);
      if (o.holeE === 'thread') { s += hole('thread', hx, yo0, yo1, 16, 70); s += holeLabel(hx, yo1, 'M' + fmt(v.oe), true); }
      else { s += hole('through', hx, yo0, yo1, 16); s += holeLabel(hx, yo1, 'Ø' + fmt(v.oe), true); }
    }
    // внутреннее кольцо
    if (o.flange === 'i' || o.flange === 'ei') {
      s += hatchPath('M' + xi0 + ',' + yi0 + ' H' + (xi1 + fl) + ' V' + (yi0 + fh) + ' H' + xi1 + ' V' + yi1 + ' H' + xi0 + ' z');
      s += hole('through', xi1 + fl / 2, yi0, yi0 + fh, 16);
      s += holeLabel(xi1 + fl / 2, yi0 + fh, 'Ø' + fmt(v.oi), true);
    } else {
      s += hatchRect(xi0, yi0, xi1 - xi0, yi1 - yi0);
      var hx2 = (xi0 + xi1) / 2;
      if (o.holeI === 'thread') { s += hole('thread', hx2, yi0, yi1, 16, 70); s += holeLabel(hx2, yi1, 'M' + fmt(v.oi), true); }
      else { s += hole('through', hx2, yi0, yi1, 16); s += holeLabel(hx2, yi1, 'Ø' + fmt(v.oi), true); }
    }
    // дорожка и тело качения
    var r = o.r || 30;
    var cx = (xo1 + xi0) / 2;
    s += '<rect class="k-white" x="' + (xo1 - 2) + '" y="' + (yo0) + '" width="' + (xi0 - xo1 + 4) + '" height="' + (yo1 - yo0) + '"/>';
    var rh = (o.body === 'ball2' || o.body === 'roller3') ? 2 * r + 8 : r + 4;
    s += white(cx - r - 4, cy - rh, 2 * r + 8, 2 * rh);
    if (o.body === 'roller') s += roller(cx, cy, r);
    else if (o.body === 'ball2') { s += ball(cx, cy - r - 3, r - 2); s += ball(cx, cy + r + 3, r - 2); }
    else if (o.body === 'roller3') {
      s += rollBox(cx - r - 6, cy - r - 10, 2 * r + 12, 18);
      s += rollBox(cx - r - 6, cy + r - 8, 2 * r + 12, 18);
      s += rollBox(cx + r - 2, cy - 12, 16, 24);
    }
    else s += ball(cx, cy, r);
    s += seal(xo1 - 10, Math.max(yo0, yi0) + 6, 1);
    s += seal(xi0 + 10, Math.min(yo1, yi1) - 12, -1);
    s += plugs(o.gear === 'int' ? xo0 + 30 : xi1 - 30, cy);
    // зацепление
    if (o.gear === 'ext') s += teeth('ext', xo0 - 34, xo0, yo0 + 4, yo1 - 4);
    if (o.gear === 'int') s += teeth('int', xi1, xi1 + 44, yi0, yi1);
    return s;
  }

  /* каждая сцена возвращает {svg, dims:[], vdims:[]} */
  function sceneBall(cfg) {
    return function (v) {
      var G = cfg.gear, FL = cfg.flange || '';
      var xo0 = G === 'ext' ? 250 : 216, xo1 = xo0 + 120;
      var xi0 = xo1 + 26, xi1 = xi0 + 120;
      var yo0 = 200, yo1 = 380, yi0 = 236, yi1 = 416;   // наружное выше, внутреннее ниже
      if (G === 'int') { yo0 = 236; yo1 = 416; yi0 = 200; yi1 = 380; }
      var o = { xo0: xo0, xo1: xo1, xi0: xi0, xi1: xi1, yo0: yo0, yo1: yo1, yi0: yi0, yi1: yi1,
        gear: G, flange: FL, body: cfg.body || 'ball', holeE: cfg.holeE, holeI: cfg.holeI, r: cfg.r };
      var svg = oneRow(o, v);
      var dims = [];
      var xDe = G === 'ext' ? xo0 - 34 : (FL.indexOf('e') >= 0 ? xo0 - 34 : xo0);
      // наружное кольцо: De, Fe, de (+ U/Dce)
      dims.push({ k: 'De', x: xDe, side: G === 'int' ? 'top' : 'bottom', tol: cfg.tolDe });
      dims.push({ k: 'Fe', x: FL.indexOf('e') >= 0 ? xo0 - 17 : (xo0 + xo1) / 2, side: G === 'int' ? 'top' : 'bottom', pre: fmt(v.Ne) + ' отв. на ' });
      if (cfg.U) dims.push({ k: 'U', x: xo0 + 30, side: G === 'int' ? 'top' : 'bottom' });
      if (cfg.Dce) dims.push({ k: 'Dce', x: xo0, side: G === 'int' ? 'top' : 'bottom' });
      dims.push({ k: 'de', x: xo1, side: G === 'int' ? 'top' : 'bottom' });
      if (G === 'ext') dims.push({ k: 'Dp', x: xo0 - 20, side: 'bottom' });
      // внутреннее кольцо: di, Fi, (V/Dci), Di (+Dp у внутреннего)
      var sideI = G === 'int' ? 'bottom' : 'top';
      dims.push({ k: 'di', x: xi0, side: sideI });
      dims.push({ k: 'Fi', x: FL.indexOf('i') >= 0 ? xi1 + 17 : (xi0 + xi1) / 2, side: sideI, pre: fmt(v.Ni) + ' отв. на ' });
      if (cfg.V) dims.push({ k: 'V', x: xi1 - 30, side: sideI });
      if (cfg.Dci) dims.push({ k: 'Dci', x: xi1, side: sideI });
      if (G === 'int') dims.push({ k: 'Dp', x: xi1 + 24, side: 'bottom' });
      dims.push({ k: 'Di', x: G === 'int' ? xi1 + 44 : (FL.indexOf('i') >= 0 ? xi1 + 34 : xi1), side: sideI, tol: cfg.tolDi });
      var vd = [
        { k: 'He', y0: yo0, y1: yo1, x: 150, side: 'left', ext: xo0 - (G === 'ext' ? 34 : (FL.indexOf('e') >= 0 ? 34 : 0)) },
        { k: 'Hi', y0: yi0, y1: yi1, x: 640, side: 'right', ext: xi1 + (G === 'int' ? 44 : (FL.indexOf('i') >= 0 ? 34 : 0)) },
        { k: 'H', y0: Math.min(yo0, yi0), y1: Math.max(yo1, yi1), x: 672, side: 'right', ext: xi1 + 44 }
      ];
      return { svg: svg, dims: dims, vdims: vd, yTop: Math.min(yo0, yi0), yBot: Math.max(yo1, yi1) };
    };
  }

  /* прецизионный перекрёстный ролик, тонкие кольца */
  function scenePrecisionCR(v) {
    var xo0 = 250, xo1 = 330, xi0 = 356, xi1 = 640, y0 = 250, y1 = 330;
    var s = hatchRect(xo0, y0, xo1 - xo0, y1 - y0) + hatchRect(xi0, y0, xi1 - xi0, y1 - y0);
    var cx = (xo1 + xi0) / 2, cy = (y0 + y1) / 2;
    s += white(cx - 26, cy - 26, 52, 52) + roller(cx, cy, 22);
    s += thin('M' + xo0 + ',' + (y0 + 6) + ' h-8 M' + xo0 + ',' + (y1 - 6) + ' h-8');
    var dims = [
      { k: 'D', x: xo0, side: 'top' }, { k: 'Dp', x: cx, side: 'top' }, { k: 'd', x: xi0, side: 'top' },
      { k: 'ds', x: xi0 + 30, side: 'bottom' }, { k: 'dh', x: xo0 + 40, side: 'bottom' }
    ];
    return { svg: s, dims: dims, vdims: [{ k: 'B', y0: y0, y1: y1, x: 200, side: 'left', ext: xo0 }], yTop: y0, yBot: y1 };
  }
  /* прецизионный для поворотных столов, YRT */
  function sceneYRT(v) {
    var s = '';
    var xo0 = 230, xo1 = 330, xi0 = 356, xi1 = 640;
    s += hatchPath('M' + xo0 + ',230 H' + xo1 + ' V350 H' + xo0 + ' z');
    s += hatchPath('M' + xi0 + ',250 H' + xi1 + ' V330 H' + xi0 + ' z');
    s += white(xo1 - 6, 244, xi0 - xo1 + 12, 92);
    s += rollBox(xo1 - 2, 252, 30, 16) + rollBox(xo1 - 2, 312, 30, 16) + rollBox(xo1 + 4, 278, 16, 24);
    s += hole('through', 280, 230, 350, 14); s += holeLabel(280, 350, 'Ø' + fmt(v.oe), true);
    s += hole('through', 420, 250, 330, 14); s += holeLabel(420, 330, 'Ø' + fmt(v.oi), true);
    var dims = [
      { k: 'De', x: xo0, side: 'top' }, { k: 'Fe', x: 280, side: 'top', pre: fmt(v.Ne) + ' отв. на ' },
      { k: 'D1', x: xo1, side: 'top' }, { k: 'Di', x: xi1, side: 'top' },
      { k: 'Fi', x: 420, side: 'bottom', pre: fmt(v.Ni) + ' отв. на ' }, { k: 'C', x: xi0, side: 'bottom' }
    ];
    var vd = [{ k: 'H2', y0: 230, y1: 350, x: 176, side: 'left', ext: xo0 }, { k: 'H1', y0: 250, y1: 330, x: 668, side: 'right', ext: xi1 }];
    return { svg: s, dims: dims, vdims: vd, yTop: 230, yBot: 350 };
  }

  /* ---------- типы. Имена по подписям серий каталога, без кодов ---------- */
  function T(id, name, group, scene, fields) { return { id: id, name: name, group: group, scene: scene, fields: fields }; }
  var HOLES_T = [fld('oe', 18), fld('oi', 12), fld('gi', 20)];
  var GEAR = [fld('m', 5), fld('Z', 79), fld('x', 0)];

  var TYPES = [
    T('zk', 'Лёгкая серия, один ряд шариков, внутреннее зубчатое зацепление', 'Лёгкая серия',
      sceneBall({ gear: 'int', flange: 'e', U: true, tolDi: '+0,5' }),
      [fld('De', 498), fld('U', 432), fld('a', 384), fld('de', 340), fld('di', 336), fld('Di', 331), fld('Fe', 470), fld('Ne', 16), fld('Fi', 400), fld('Ni', 16), fld('He', 61), fld('Hi', 61), fld('H', 82), fld('oe', 17), fld('oi', 17)].concat([fld('m', 5), fld('Z', 68), fld('x', 0)])),
    T('nk', 'Лёгкая серия, один ряд шариков, без зацепления', 'Лёгкая серия',
      sceneBall({ gear: 'none', flange: 'e', U: true }),
      [fld('De', 498), fld('U', 432), fld('a', 384), fld('de', 340), fld('di', 336), fld('Di', 331), fld('Fe', 470), fld('Ne', 16), fld('Fi', 400), fld('Ni', 16), fld('He', 61), fld('Hi', 61), fld('H', 82), fld('oe', 17), fld('oi', 17)]),

    T('ebl', 'Фланцевое опорно-поворотное устройство, один ряд шариков, наружное зубчатое зацепление', 'Фланцевые серии',
      sceneBall({ gear: 'ext', flange: 'i', V: true, holeE: 'thread', tolDe: '-0,5', tolDi: '+0,5' }),
      [fld('De', 404), fld('de', 315.5), fld('di', 312.5), fld('V', 269), fld('Di', 204), fld('Fe', 355), fld('Ne', 10), fld('Fi', 232), fld('Ni', 12), fld('He', 45.5), fld('Hi', 45.5), fld('H', 56), fld('oe', 12, 'oeM'), fld('oi', 18)].concat(GEAR)),
    T('zbl', 'Фланцевое опорно-поворотное устройство, один ряд шариков, внутреннее зубчатое зацепление', 'Фланцевые серии',
      sceneBall({ gear: 'int', flange: 'e', U: true, holeI: 'thread', tolDe: '-0,5' }),
      [fld('De', 418), fld('U', 353), fld('de', 315.5), fld('di', 312.5), fld('Di', 225), fld('Fe', 390), fld('Ne', 8), fld('Fi', 275), fld('Ni', 12), fld('He', 45.5), fld('Hi', 45.5), fld('H', 56), fld('oe', 18), fld('oi', 12, 'oiM')].concat([fld('m', 5), fld('Z', 47), fld('x', 0)])),
    T('nbl', 'Фланцевое опорно-поворотное устройство, один ряд шариков, без зацепления', 'Фланцевые серии',
      sceneBall({ gear: 'none', flange: 'ei', U: true, V: true, tolDe: '-0,5', tolDi: '+0,5' }),
      [fld('De', 418), fld('U', 353), fld('de', 315.5), fld('di', 312.5), fld('V', 269), fld('Di', 204), fld('Fe', 390), fld('Ne', 8), fld('Fi', 232), fld('Ni', 12), fld('He', 45.5), fld('Hi', 45.5), fld('H', 56), fld('oe', 18), fld('oi', 18)]),

    T('eb1', 'Стандартное опорно-поворотное устройство, один ряд шариков, наружное зубчатое зацепление', 'Один ряд шариков',
      sceneBall({ gear: 'ext', holeE: 'thread', tolDi: '+0,5' }),
      [fld('De', 404), fld('de', 315.5), fld('di', 312.5), fld('Di', 242), fld('Fe', 355), fld('Ne', 20), fld('Fi', 268), fld('Ni', 20), fld('He', 45.5), fld('Hi', 45.5), fld('H', 56), fld('oe', 12, 'oeM'), fld('oi', 14)].concat(GEAR)),
    T('eb1p', 'Прецизионная серия, один ряд шариков, наружное зубчатое зацепление', 'Один ряд шариков',
      sceneBall({ gear: 'ext', holeE: 'thread', tolDi: '+0,5' }),
      [fld('De', 404), fld('de', 315.5), fld('di', 312.5), fld('Di', 242), fld('Fe', 355), fld('Ne', 20), fld('Fi', 268), fld('Ni', 20), fld('He', 45.5), fld('Hi', 45.5), fld('H', 56), fld('oe', 12, 'oeM'), fld('oi', 14)].concat(GEAR)),
    T('eb1r', 'Стандартное опорно-поворотное устройство, один ряд шариков, наружное зубчатое зацепление, сквозные отверстия', 'Один ряд шариков',
      sceneBall({ gear: 'ext', tolDi: '+0,7', tolDe: '' }),
      [fld('De', 1338), fld('de', 1206), fld('di', 1202), fld('Di', 1119), fld('Fe', 1257), fld('Ne', 45), fld('Fi', 1151), fld('Ni', 45), fld('He', 58), fld('Hi', 58), fld('H', 68), fld('oe', 22), fld('oi', 22)].concat([fld('m', 10), fld('Z', 131), fld('x', 0)])),
    T('zb1', 'Стандартное опорно-поворотное устройство, один ряд шариков, внутреннее зубчатое зацепление', 'Один ряд шариков',
      sceneBall({ gear: 'int', holeI: 'thread', tolDe: '-0,5' }),
      [fld('De', 386), fld('de', 315.5), fld('di', 312.5), fld('Di', 225), fld('Fe', 360), fld('Ne', 24), fld('Fi', 275), fld('Ni', 24), fld('He', 45.5), fld('Hi', 45.5), fld('H', 56), fld('oe', 14), fld('oi', 12, 'oiM')].concat([fld('m', 5), fld('Z', 47), fld('x', 0)])),
    T('nb1', 'Стандартное опорно-поворотное устройство, один ряд шариков, без зацепления', 'Один ряд шариков',
      sceneBall({ gear: 'none', tolDe: '-0,5', tolDi: '+0,5' }),
      [fld('De', 386), fld('de', 315.5), fld('di', 312.5), fld('Di', 242), fld('Fe', 360), fld('Ne', 20), fld('Fi', 268), fld('Ni', 20), fld('He', 45.5), fld('Hi', 45.5), fld('H', 56), fld('oe', 14), fld('oi', 14)]),

    T('eb2', 'Опорно-поворотное устройство с двумя рядами шариков, наружное зубчатое зацепление', 'Два ряда шариков',
      sceneBall({ gear: 'ext', body: 'ball2', r: 22, tolDi: '+0,5' }),
      [fld('De', 432), fld('de', 309), fld('di', 305), fld('Di', 224), fld('Dx', 394), fld('Fe', 360), fld('Fi', 254), fld('N', 16), fld('Ne', 16), fld('Ni', 16), fld('He', 83), fld('Hi', 83), fld('H', 92), fld('Hd', 50), fld('L', 25), fld('W', 12), fld('oe', 17), fld('oi', 17)].concat([fld('m', 6), fld('Z', 70), fld('x', 0)])),
    T('zb2', 'Опорно-поворотное устройство с двумя рядами шариков, внутреннее зубчатое зацепление', 'Два ряда шариков',
      sceneBall({ gear: 'int', body: 'ball2', r: 22, tolDe: '-0,5' }),
      [fld('De', 705), fld('de', 627), fld('di', 623), fld('Di', 504), fld('Dx', 547), fld('Fe', 675), fld('Fi', 575), fld('N', 32), fld('Ne', 32), fld('Ni', 32), fld('He', 83), fld('Hi', 83), fld('H', 92), fld('Hd', 74), fld('L', 25), fld('W', 9), fld('oe', 17), fld('oi', 17)].concat([fld('m', 8), fld('Z', 65), fld('x', 0)])),

    T('er1', 'Опорно-поворотное устройство с одним рядом перекрёстных роликов, наружное зубчатое зацепление', 'Перекрёстные ролики',
      sceneBall({ gear: 'ext', body: 'roller', holeE: 'thread', Dci: true }),
      [fld('De', 503.3), fld('Dce', 417), fld('di', 413), fld('Dci', 344), fld('Di', 342), fld('Fe', 455), fld('Ne', 20), fld('Fi', 368), fld('Ni', 24), fld('He', 44.5), fld('Hi', 44.5), fld('H', 56), fld('oe', 12, 'oeM'), fld('oi', 14)].concat([fld('m', 5), fld('Z', 99), fld('x', 0)])),
    T('zr1', 'Опорно-поворотное устройство с одним рядом перекрёстных роликов, внутреннее зубчатое зацепление', 'Перекрёстные ролики',
      sceneBall({ gear: 'int', body: 'roller', holeI: 'thread', Dce: true }),
      [fld('De', 486), fld('Dce', 484), fld('de', 415), fld('Dci', 411), fld('Di', 325), fld('Fe', 460), fld('Ne', 24), fld('Fi', 375), fld('Ni', 24), fld('He', 44.5), fld('Hi', 44.5), fld('H', 56), fld('oe', 14), fld('oi', 12, 'oiM')].concat([fld('m', 5), fld('Z', 67), fld('x', 0)])),
    T('nr1', 'Опорно-поворотное устройство с одним рядом перекрёстных роликов, без зацепления', 'Перекрёстные ролики',
      sceneBall({ gear: 'none', body: 'roller', Dce: true, Dci: true }),
      [fld('De', 486), fld('Dce', 484), fld('de', 415), fld('di', 413), fld('Dci', 344), fld('Di', 342), fld('Fe', 460), fld('Ne', 24), fld('Fi', 368), fld('Ni', 24), fld('He', 44.5), fld('Hi', 44.5), fld('H', 56), fld('oe', 14), fld('oi', 14)]),

    T('er3', 'Опорно-поворотное устройство с тремя рядами роликов, наружное зубчатое зацепление', 'Три ряда роликов',
      sceneBall({ gear: 'ext', body: 'roller3', r: 24 }),
      [fld('De', 1461.6), fld('de', 1282), fld('di', 1280), fld('Di', 1103), fld('Fe', 1355), fld('Fi', 1155), fld('N', 36), fld('Ne', 36), fld('Ni', 36), fld('He', 106), fld('Hi', 123), fld('H', 132), fld('V', 26), fld('oe', 26), fld('oi', 26)].concat([fld('m', 12), fld('Z', 119), fld('x', 0.5)])),
    T('zr3', 'Опорно-поворотное устройство с тремя рядами роликов, внутреннее зубчатое зацепление', 'Три ряда роликов',
      sceneBall({ gear: 'int', body: 'roller3', r: 24 }),
      [fld('De', 1397), fld('de', 1219), fld('di', 1218), fld('Di', 1032), fld('Fe', 1345), fld('Fi', 1145), fld('N', 36), fld('Ne', 36), fld('Ni', 36), fld('He', 123), fld('Hi', 106), fld('H', 132), fld('V', 26), fld('oe', 26), fld('oi', 26)].concat([fld('m', 12), fld('Z', 87), fld('x', -0.5)])),

    T('crb', 'Прецизионная серия с перекрёстными роликами', 'Прецизионные подшипники',
      scenePrecisionCR,
      [fld('d', 100), fld('D', 140), fld('B', 16), fld('Dp', 119.3), fld('ds', 109), fld('dh', 129)]),
    T('yrt', 'Прецизионный подшипник для поворотных кругов', 'Прецизионные подшипники',
      sceneYRT,
      [fld('De', 126), fld('D1', 105), fld('Di', 50), fld('C', 10), fld('H1', 20), fld('H2', 30), fld('Fe', 116), fld('Ne', 12), fld('Fi', 63), fld('Ni', 10), fld('oe', 5.6), fld('oi', 5.6)])
  ];

  /* ---------- сборка чертежа ---------- */
  function drawSVG(type, v, opts) {
    var sc = type.scene(v);
    var s = '<svg class="k-plan" viewBox="' + VB.join(' ') + '" xmlns="http://www.w3.org/2000/svg">' + defs();
    s += '<rect class="k-bg" x="0" y="0" width="780" height="600"/>';
    s += sc.svg;
    s += hdims(sc.dims, sc.yTop, sc.yBot, v);
    s += vdims(sc.vdims, v);
    if (v.m && v.Z) {
      var Dp = parseFloat(v.m) * parseFloat(v.Z) + 2 * parseFloat(v.m) * (parseFloat(v.x) || 0);
      s += '<text class="k-txt" x="30" y="40">m=' + fmt(v.m) + '   Z=' + fmt(v.Z) + '   x=' + fmt(v.x || 0) + '   Dp=' + fmt(Dp) + '</text>';
    }
    if (opts && opts.watermark) s += opts.watermark;
    s += '<text class="k-note" x="30" y="580">Размеры справочные, точные подтверждает инженер.</text>';
    s += '</svg>';
    return s;
  }

  /* ---------- виджет ---------- */
  function build(root) {
    var endpoint = root.getAttribute('data-endpoint') || '';
    var logo = root.getAttribute('data-logo') || '';
    if (logo && logo.indexOf('data:') !== 0) {
      (function (src) {
        var im = new Image(); im.crossOrigin = 'anonymous';
        im.onload = function () {
          try { var c = document.createElement('canvas'); c.width = im.naturalWidth; c.height = im.naturalHeight;
            c.getContext('2d').drawImage(im, 0, 0); logo = c.toDataURL('image/png'); if (cur) redraw(); } catch (e) {}
        };
        im.src = src;
      })(logo);
    }
    var groups = {};
    TYPES.forEach(function (t) { (groups[t.group] = groups[t.group] || []).push(t); });
    var opts = '';
    Object.keys(groups).forEach(function (g) {
      opts += '<optgroup label="' + esc(g) + '">';
      groups[g].forEach(function (t) { opts += '<option value="' + t.id + '">' + esc(t.name) + '</option>'; });
      opts += '</optgroup>';
    });
    root.innerHTML =
      '<div class="k-wrap"><div class="k-grid">' +
      '<form class="k-card k-form" autocomplete="off">' +
      '<div class="k-f"><label>Тип изделия</label><select name="tip">' + opts + '</select></div>' +
      '<div class="k-fields"></div>' +
      '<div class="k-sect"><div class="k-f"><label>Дополнения или уточнения</label><textarea name="dop" rows="3" placeholder="Что важно учесть по вашему изделию"></textarea></div>' +
      '<div class="k-row"><div class="k-f"><label>Имя</label><input type="text" name="fio"></div><div class="k-f"><label>Телефон или почта</label><input type="text" name="tel" required></div></div>' +
      '<button type="submit">Отправить заявку</button>' +
      '<div class="k-note">Заявка уходит с параметрами и чертежом. Инженер свяжется и уточнит информацию.</div>' +
      '<div class="k-ok" hidden></div></div></form>' +
      '<div class="k-card"><div class="k-draw"></div><div class="k-under"></div></div>' +
      '</div></div>';

    var form = root.querySelector('form'), sel = form.tip, fieldsBox = root.querySelector('.k-fields');
    var drawBox = root.querySelector('.k-draw'), under = root.querySelector('.k-under'), ok = root.querySelector('.k-ok');
    var cur;

    function renderFields(t) {
      var h = '';
      var groups = [
        ['Диаметры, мм', ['De','Dce','U','a','de','Dx','di','Dci','V','Di','D','d','Dp','ds','dh','D1','C']],
        ['Высоты, мм', ['H','He','Hi','Ht','Hd','B','H1','H2','L','W']],
        ['Крепёжные отверстия', ['Fe','Ne','oe','Fi','Ni','oi','N','ge','gi','he','hi','hl']],
        ['Зубчатое зацепление', ['m','Z','x']]
      ];
      groups.forEach(function (g) {
        var fs = t.fields.filter(function (f) { return g[1].indexOf(f.k) >= 0; });
        if (!fs.length) return;
        h += '<div class="k-sect"><div class="k-sect-t">' + g[0] + '</div><div class="k-row">';
        fs.forEach(function (f) {
          var isInt = f.k === 'Ne' || f.k === 'Ni' || f.k === 'N' || f.k === 'Z';
          h += '<div class="k-f"><label>' + esc(f.label) + (f.unit ? ', ' + f.unit : '') + '</label>' +
            '<input type="number" name="' + f.k + '" value="' + f.def + '" step="' + (isInt ? '1' : '0.1') + '"></div>';
        });
        h += '</div></div>';
      });
      fieldsBox.innerHTML = h;
    }
    function values() {
      var v = {};
      cur.fields.forEach(function (f) { v[f.k] = form[f.k].value; });
      if (v.m && v.Z) v.Dp = parseFloat(v.m) * parseFloat(v.Z) + 2 * parseFloat(v.m) * (parseFloat(v.x) || 0);
      return v;
    }
    function watermark() {
      if (!logo) return '';
      return '<image class="k-wm" href="' + esc(logo) + '" x="300" y="200" width="200" height="200" opacity="0.18" preserveAspectRatio="xMidYMid meet"/>';
    }
    function redraw() {
      var v = values();
      drawBox.innerHTML = drawSVG(cur, v, { watermark: watermark() });
      var lines = '';
      if (v.Ne !== undefined) lines += '<div class="k-line"><span>Количество отверстий наружного кольца</span><span>' + fmt(v.Ne) + '</span></div>';
      if (v.Ni !== undefined) lines += '<div class="k-line"><span>Количество отверстий внутреннего кольца</span><span>' + fmt(v.Ni) + '</span></div>';
      if (v.N !== undefined) lines += '<div class="k-line"><span>Количество отверстий</span><span>' + fmt(v.N) + '</span></div>';
      if (v.m && v.Z) lines += '<div class="k-line"><span>Делительный диаметр зацепления</span><span>' + fmt(parseFloat(v.m) * parseFloat(v.Z) + 2 * parseFloat(v.m) * (parseFloat(v.x) || 0)) + ' мм</span></div>';
      under.innerHTML = lines;
    }
    function setType(id) {
      cur = TYPES.filter(function (t) { return t.id === id; })[0] || TYPES[0];
      renderFields(cur);
      redraw();
    }
    sel.addEventListener('change', function () { setType(sel.value); });
    form.addEventListener('input', function (e) { if (e.target.tagName === 'INPUT' && e.target.type === 'number') redraw(); });

    /* PNG чертежа для письма */
    function toPNG(cb) {
      var svgEl = drawBox.querySelector('svg');
      var xml = new XMLSerializer().serializeToString(svgEl);
      var css = document.getElementById('opu-css') ? document.getElementById('opu-css').textContent : '';
      xml = xml.replace('<defs>', '<style>' + css + '</style><defs>');
      var img = new Image();
      var blob = new Blob([xml], { type: 'image/svg+xml;charset=utf-8' });
      var url = URL.createObjectURL(blob);
      img.onload = function () {
        var c = document.createElement('canvas'); c.width = 1560; c.height = 1200;
        var g = c.getContext('2d'); g.fillStyle = '#fff'; g.fillRect(0, 0, c.width, c.height);
        g.drawImage(img, 0, 0, c.width, c.height);
        URL.revokeObjectURL(url);
        try { cb(c.toDataURL('image/png')); } catch (e) { cb(''); }
      };
      img.onerror = function () { cb(''); };
      img.src = url;
    }

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var v = values();
      var payload = { type: cur.name, fields: [], dop: form.dop.value, fio: form.fio.value, tel: form.tel.value, page: location.href };
      cur.fields.forEach(function (f) { payload.fields.push({ k: f.k, label: f.label, unit: f.unit, value: v[f.k] }); });
      var btn = form.querySelector('button'); btn.disabled = true; btn.textContent = 'Отправляю';
      toPNG(function (png) {
        payload.png = png;
        if (!endpoint) {
          ok.hidden = false; ok.textContent = 'Заявка собрана. На сайте она уйдёт на почту с параметрами и чертежом.';
          btn.disabled = false; btn.textContent = 'Отправить заявку';
          if (window.console) console.log('opu payload', payload);
          return;
        }
        var xhr = new XMLHttpRequest();
        xhr.open('POST', endpoint, true);
        xhr.setRequestHeader('Content-Type', 'application/json');
        xhr.onload = function () {
          btn.disabled = false; btn.textContent = 'Отправить заявку';
          ok.hidden = false;
          ok.textContent = xhr.status === 200 ? 'Заявка отправлена. Инженер свяжется с вами.' : 'Не удалось отправить, позвоните нам по телефону на сайте.';
          if (window.ym && xhr.status === 200) { try { ym(root.getAttribute('data-ym'), 'reachGoal', 'opuForm'); } catch (err) {} }
        };
        xhr.onerror = function () { btn.disabled = false; btn.textContent = 'Отправить заявку'; ok.hidden = false; ok.textContent = 'Не удалось отправить, позвоните нам по телефону на сайте.'; };
        xhr.send(JSON.stringify(payload));
      });
    });

    setType(TYPES[0].id);
  }

  function init() {
    var roots = document.querySelectorAll('#opu-konfigurator, .opu-konfigurator');
    for (var i = 0; i < roots.length; i++) if (!roots[i].getAttribute('data-ready')) { roots[i].setAttribute('data-ready', '1'); build(roots[i]); }
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
  window.OPU = { types: TYPES, draw: drawSVG };
})();
