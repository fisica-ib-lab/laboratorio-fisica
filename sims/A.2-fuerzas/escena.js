/* Simulación A.2 · Diagramas de cuerpo libre y segunda ley — dibujo.
   Siete montajes de laboratorio con las fuerzas sobre cada cuerpo (flechas a escala desde su punto de aplicación),
   el diagrama de cuerpo libre (modelo de partícula) con la fuerza neta en un recuadro aparte, y paneles de barras.
   Aquí no hay física: todos los valores llegan de comun/dinamica.js. */

(function () {
  'use strict';
  const { numero } = window.Cinematica;
  const Gr = window.Graficas;
  const { COL, LETRA, QUIETO, prepararLienzo, textoRico, medirRico, rectRedondo, pildora, flecha } = Gr;
  const MET = { claro: '#E4E9EF', brillo: '#F6F8FA', medio: '#8A97A6', oscuro: '#5A6B7D', pizarra: '#2F3E4E', dorado: '#E2B045' };
  const CUERPO = { relleno: '#B5CFEC', franja: '#2E74B5' };
  const RAD = Math.PI / 180;

  // Colores y símbolos de las fuerzas (iguales en la escena, el diagrama y las tablas)
  const FZ = {
    Fg: { color: '#5B4B8A', sub: 'g', nombre: 'peso' },
    FN: { color: '#2E74B5', sub: 'N', nombre: 'fuerza normal' },
    Ff: { color: '#C25E0C', sub: 'f', nombre: 'rozamiento' },
    FT: { color: '#0F7C86', sub: 'T', nombre: 'tensión' },
    FH: { color: '#B5367A', sub: 'H', nombre: 'fuerza elástica' },
    Fb: { color: '#6C7A00', sub: 'b', nombre: 'empuje' },
    Fd: { color: '#8C2D19', sub: 'd', nombre: 'arrastre viscoso' }
  };
  const NETA = '#C00000';
  // partes de texto del símbolo: F con subíndice (recto); «extra» para distinguir F_T1 y F_T2
  const simbolo = (f) => [['F', true], [FZ[f.tipo].sub + (f.extra || ''), false, true]];
  const N1 = (x) => numero(x, Math.abs(x) >= 100 ? 0 : Math.abs(x) >= 10 ? 1 : 2);

  const linea = (ctx, x1, y1, x2, y2) => { ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke(); };
  function mesaLab(ctx, x0, x1, y) {
    ctx.fillStyle = '#EFE8DC'; ctx.fillRect(x0, y, x1 - x0, 3);
    ctx.fillStyle = '#D3AC84'; ctx.fillRect(x0, y + 3, x1 - x0, 5);
  }
  function rotulo(ctx, txt, x, y, alinear) {
    ctx.font = `12px ${LETRA}`; ctx.fillStyle = COL.suave; ctx.textAlign = alinear || 'center'; ctx.textBaseline = 'middle'; ctx.fillText(txt, x, y);
  }
  // Bloque de laboratorio (azul claro con franja), centrado en (cx, cy) y girado «ang» radianes (antihorario en pantalla)
  function bloque(ctx, cx, cy, w, h, ang, texto) {
    ctx.save(); ctx.translate(cx, cy); ctx.rotate(-ang);
    rectRedondo(ctx, -w / 2, -h / 2, w, h, 4); ctx.fillStyle = CUERPO.relleno; ctx.fill();
    ctx.save(); ctx.clip(); ctx.fillStyle = CUERPO.franja; ctx.fillRect(-w / 2, h / 2 - h * 0.2, w, h * 0.2); ctx.restore();
    ctx.lineWidth = 1.5; ctx.strokeStyle = COL.tinta; rectRedondo(ctx, -w / 2, -h / 2, w, h, 4); ctx.stroke();
    if (texto) textoRico(ctx, texto, 0, -h * 0.1, 13, COL.azulOsc, 'center', true);
    ctx.restore();
  }
  // Polea con radios que giran sin deslizar con la cuerda
  function polea(ctx, x, y, R, giro) {
    ctx.lineWidth = 1.3; ctx.strokeStyle = COL.tinta;
    ctx.beginPath(); ctx.arc(x, y, R, 0, 2 * Math.PI); ctx.fillStyle = MET.claro; ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.arc(x, y, R - 4, 0, 2 * Math.PI); ctx.strokeStyle = MET.medio; ctx.stroke();
    ctx.strokeStyle = MET.oscuro; ctx.lineWidth = 1.5;
    for (let i = 0; i < 3; i++) { const a = giro + i * 2 * Math.PI / 3; linea(ctx, x, y, x + Math.cos(a) * (R - 5), y + Math.sin(a) * (R - 5)); }
    ctx.beginPath(); ctx.arc(x, y, 3.5, 0, 2 * Math.PI); ctx.fillStyle = MET.pizarra; ctx.fill();
  }
  // Dinamómetro de resorte a lo largo de la dirección (ux, uy) en pantalla, desde el gancho (x, y).
  // «alarg» en píxeles: la varilla graduada que asoma crece con la fuerza (F = kx).
  function dinamometro(ctx, x, y, ux, uy, alarg, largoTubo) {
    const ang = Math.atan2(uy, ux);
    ctx.save(); ctx.translate(x, y); ctx.rotate(ang);
    ctx.strokeStyle = COL.tinta; ctx.lineWidth = 1.2;
    // gancho
    ctx.beginPath(); ctx.arc(4, 0, 4, Math.PI * 0.5, Math.PI * 1.9); ctx.stroke();
    // varilla graduada (sale del tubo al estirarse el resorte)
    const v0 = 8, v1 = v0 + 6 + alarg;
    ctx.fillStyle = MET.brillo; ctx.fillRect(v0, -3, v1 - v0, 6); ctx.strokeRect(v0, -3, v1 - v0, 6);
    ctx.strokeStyle = COL.ace; ctx.lineWidth = 1;
    for (let p = v1 - 4; p > v0 + 2; p -= 6) linea(ctx, p, -3, p, 1);
    // tubo con ventana y resorte
    ctx.lineWidth = 1.2; ctx.strokeStyle = COL.tinta;
    rectRedondo(ctx, v1, -7, largoTubo, 14, 4); ctx.fillStyle = MET.claro; ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#FFFFFF'; ctx.fillRect(v1 + 8, -3.5, largoTubo - 16, 7);
    ctx.strokeStyle = MET.oscuro; ctx.lineWidth = 1;
    ctx.beginPath();
    const n = 7, paso = (largoTubo - 18) / n;
    for (let i = 0; i <= n; i++) ctx.lineTo(v1 + 9 + i * paso, i % 2 ? -3 : 3);
    ctx.stroke();
    // anilla del extremo
    ctx.strokeStyle = COL.tinta; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.arc(v1 + largoTubo + 6, 0, 5, 0, 2 * Math.PI); ctx.stroke();
    ctx.restore();
    return { fin: [x + Math.cos(ang) * (v1 + largoTubo + 11), y + Math.sin(ang) * (v1 + largoTubo + 11)], medio: [x + Math.cos(ang) * (v1 + largoTubo / 2), y + Math.sin(ang) * (v1 + largoTubo / 2)] };
  }

  /* Punto donde sale la flecha: la recta que pasa por el centro del cuerpo en la dirección de la fuerza corta su borde.
     c = { cx, cy, w, h, ang } (rectángulo girado «ang» rad, antihorario) o { cx, cy, r } (círculo). (dx, dy) en pantalla. */
  function salida(c, dx, dy) {
    const L = Math.hypot(dx, dy) || 1, ux = dx / L, uy = dy / L, hueco = 2;
    let t;
    if (c.r !== undefined) t = c.r;
    else {
      const a = c.ang || 0, ca = Math.cos(a), sa = Math.sin(a);
      const lx = ux * ca - uy * sa, ly = ux * sa + uy * ca;      // dirección en los ejes del cuerpo
      t = Math.min(Math.abs(lx) > 1e-9 ? c.w / 2 / Math.abs(lx) : Infinity, Math.abs(ly) > 1e-9 ? c.h / 2 / Math.abs(ly) : Infinity);
    }
    return [c.cx + ux * (t + hueco), c.cy + uy * (t + hueco)];
  }
  /* Flechas de fuerza.
     lista: [{ f, c }] con el cuerpo c (cada flecha sale de su borde, alineada con el centro) o [{ f, x, y }] con el origen.
     Dos fuerzas sobre el mismo cuerpo con igual dirección y sentido (empuje y arrastre) se separan un poco para que no se pisen.
     pxN: píxeles por newton. */
  function flechasFuerza(ctx, lista, pxN, ver, w, h) {
    lista = lista.map(it => {
      if (!it.c) return it;
      const [x, y] = salida(it.c, it.f.x, -it.f.y);
      return Object.assign({}, it, { x, y });
    });
    for (let a = 0; a < lista.length; a++) for (let b = a + 1; b < lista.length; b++) {
      const A = lista[a], B = lista[b], fa = A.f, fb = B.f;
      if (!A.c || A.c !== B.c || fa.mod < 1e-12 || fb.mod < 1e-12) continue;
      if (Math.abs((fa.x * fb.x + fa.y * fb.y) / (fa.mod * fb.mod) - 1) < 1e-6) {
        const px = -fa.y / fa.mod, py = -fa.x / fa.mod, d = 5;
        A.x += px * d; A.y += py * d; B.x -= px * d; B.y -= py * d;
      }
    }
    const rotulos = [];
    for (const { f, x, y } of lista) {
      const dx = f.x * pxN, dy = -f.y * pxN, L = Math.hypot(dx, dy);
      if (L < 2) continue;
      const c = FZ[f.tipo].color;
      if (ver.componentes && f.comp) {
        // componentes en trazo discontinuo (en la dirección indicada por f.comp: [[ux, uy, rotulo], …])
        for (const [ux, uy, rot] of f.comp) {
          const p = (f.x * ux + f.y * uy) * pxN;
          if (Math.abs(p) < 3) continue;
          ctx.save(); ctx.setLineDash([5, 4]); ctx.globalAlpha = 0.85;
          flecha(ctx, x, y, x + ux * p, y - uy * p, c, 2, 8); ctx.restore();
          if (rot) rotulos.push({ partes: rot, x: x + ux * p + Math.sign(p) * ux * 14, y: y - uy * p - Math.sign(p) * uy * 12, color: c, peq: true });
        }
      }
      if (ver.halo) flecha(ctx, x, y, x + dx, y + dy, 'rgba(255,255,255,0.9)', 6.5, Math.min(15, L + 2));
      flecha(ctx, x, y, x + dx, y + dy, c, 3.5, Math.min(12, L));
      const ux = dx / L, uy = dy / L;
      const partes = simbolo(f).concat(ver.valores ? [[' = ' + (ver.mili ? numero(f.mod * 1000, 2) + ' mN' : N1(f.mod) + ' N'), false]] : []);
      rotulos.push({ partes, x: x + dx + ux * 13, y: y + dy + uy * 11, color: c, ux });
    }
    const puestos = [];
    for (const r of rotulos) {
      const tam = r.peq ? 12 : 14, ancho = medirRico(ctx, r.partes, tam, true);
      let x = r.ux !== undefined ? (r.ux > 0.4 ? r.x - 4 : r.ux < -0.4 ? r.x - ancho + 4 : r.x - ancho / 2) : r.x - ancho / 2;
      x = Math.max(2, Math.min(w - ancho - 2, x));
      let y = Math.max(9, Math.min(h - 9, r.y));
      // si pisa a un rótulo ya puesto, se corre hacia arriba o hacia abajo (lo que quede dentro del lienzo)
      const pisa = (yy) => puestos.some(q => x < q.x1 && x + ancho > q.x0 && Math.abs(yy - q.y) < tam + 2);
      for (let i = 1; i <= 4 && pisa(y); i++) {
        const arriba = y - i * (tam + 3), abajo = y + i * (tam + 3);
        if (!pisa(arriba) && arriba > 9) { y = arriba; break; }
        if (!pisa(abajo) && abajo < h - 9) { y = abajo; break; }
      }
      puestos.push({ x0: x, x1: x + ancho, y });
      ctx.fillStyle = 'rgba(255,255,255,0.8)'; ctx.fillRect(x - 2, y - tam / 2 - 1, ancho + 4, tam + 3);
      textoRico(ctx, r.partes, x, y, tam, r.color, 'left', true);
    }
  }
  // Componentes que se pueden mostrar para cada fuerza (dirección unitaria en ejes x derecha, y arriba)
  function conComponentes(f, ejes) { return Object.assign({}, f, { comp: ejes }); }
  const MG_SEN = (n) => [['mg sen θ', true]];

  /* ======================= Escenas ======================= */
  // E = { mod, est, ver, Fmax, jugando }
  const ESCENAS = {
    horizontal(ctx, w, h, E, k) {
      const { est, mod } = E, par = mod.par;
      const yM = Math.round(h * 0.64), w0 = 84 * k, h0 = 50 * k, xL = 30;
      const pxm = (w - xL - w0 - 170 * k) / 2.4;
      mesaLab(ctx, 0, w, yM);
      ctx.fillStyle = '#F7F2EA'; ctx.fillRect(0, yM + 8, w, 26);
      // regla grabada en el canto de la mesa
      ctx.strokeStyle = MET.oscuro; ctx.lineWidth = 1;
      for (let i = 0; i <= 24; i++) { const xx = xL + i * 0.1 * pxm; linea(ctx, xx, yM + 3, xx, yM + (i % 5 ? 5 : 8)); }
      for (let i = 0; i <= 2.4 + 1e-9; i += 0.5) rotulo(ctx, numero(i, 1).replace(',0', ''), xL + i * pxm, yM + 18);
      textoRico(ctx, [['x', true], [' / m', false]], w - 6, yM + 18, 12, COL.suave, 'right');
      const x0 = xL + est.x * pxm, cx = x0 + w0 / 2, cy = yM - h0 / 2;
      bloque(ctx, cx, cy, w0, h0, 0, [['m', true], [' = ' + numero(par.m, 1) + ' kg', false]]);
      // gancho y dinamómetro (solo mientras tira)
      const bloqueF = est.cuerpos[0], FH = bloqueF.fuerzas.find(f => f.tipo === 'FH');
      // el gancho está donde la recta de la fuerza (que pasa por el centro) corta la cara del bloque
      const th = par.ang * RAD, [gx, gy] = salida({ cx, cy, w: w0, h: h0, ang: 0 }, Math.cos(th), -Math.sin(th));
      ctx.strokeStyle = COL.tinta; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(gx + 1, gy, 3, -Math.PI / 2, Math.PI / 2); ctx.stroke();
      if (FH) {
        const alarg = est.lecturas.alargamiento * 320 * k;
        const d = dinamometro(ctx, gx + 4 * Math.cos(th), gy - 4 * Math.sin(th), Math.cos(th), -Math.sin(th), alarg, 70 * k);
        // la mano tira de la anilla
        ctx.beginPath(); ctx.arc(d.fin[0] + 6 * Math.cos(th), d.fin[1] - 6 * Math.sin(th), 7 * k, 0, 2 * Math.PI);
        ctx.fillStyle = '#F1D6BE'; ctx.fill(); ctx.strokeStyle = COL.tinta; ctx.lineWidth = 1.2; ctx.stroke();
        if (w > 380) pildora(ctx, [['dinamómetro: ' + N1(est.lecturas.dinamometro) + ' N', false]], d.fin[0] + 10, d.fin[1] - 20 * k, 12, COL.azul, COL.azulFondo, COL.azulOsc, 4, w - 4);
      } else if (par.modo === 'soltar' && est.t >= window.Dinamica.SOLTAR) pildora(ctx, [['se soltó el dinamómetro', false]], Math.min(w - 90, cx + 110), cy - 20, 12, COL.ambar, COL.ambarFondo, COL.ambar, 4, w - 4);
      if (par.mus === 0 && par.mud === 0) pildora(ctx, [['sin rozamiento', false]], w - 70, 16, 12, COL.ambar, COL.ambarFondo, COL.ambar, 4, w - 4);
      pildora(ctx, [['derecha +', false]], 44, 16, 12, COL.azul, COL.azulFondo, COL.azulOsc);
      if (E.ver.fuerzas) {
        const cb = { cx, cy, w: w0, h: h0, ang: 0 };
        const lista = bloqueF.fuerzas.map(f => ({ f: f.tipo === 'FH' && par.ang ? conComponentes(f, [[1, 0, [['F', true], ['H', false, true], [' cos θ', false]]], [0, 1, [['F', true], ['H', false, true], [' sen θ', false]]]]) : f, c: cb }));
        flechasFuerza(ctx, lista, E.pxN, E.ver, w, h);
      }
    },

    plano(ctx, w, h, E, k) {
      const { est, mod } = E, par = mod.par, th = par.ang * RAD, c = Math.cos(th), s = Math.sin(th);
      const yb = h - 26, xb = 30;
      const Lpx = Math.min((w - 70) / Math.max(c, 0.2), s > 0.01 ? Math.max(h * 0.4, h - 60 - E.pxN * E.Fmax) / s : 1e9);
      const B = [xb, yb], C = [xb + Lpx * c, yb], T = [xb + Lpx * c, yb - Lpx * s];
      mesaLab(ctx, 0, w, yb);
      // rampa de aluminio con soporte
      ctx.lineWidth = 1.3; ctx.strokeStyle = COL.tinta;
      ctx.beginPath(); ctx.moveTo(...B); ctx.lineTo(...C); ctx.lineTo(...T); ctx.closePath(); ctx.fillStyle = MET.claro; ctx.fill(); ctx.stroke();
      ctx.lineWidth = 3; ctx.strokeStyle = MET.oscuro; linea(ctx, B[0], B[1] - 1, T[0], T[1] - 1);
      ctx.lineWidth = 1.2; ctx.strokeStyle = COL.tinta;
      // tope al final de la rampa
      ctx.save(); ctx.translate(T[0], T[1]); ctx.rotate(-th); ctx.fillStyle = MET.medio; ctx.fillRect(-6, -14, 6, 14); ctx.strokeRect(-6, -14, 6, 14); ctx.restore();
      // ángulo
      const ra = 34;
      ctx.beginPath(); ctx.arc(B[0], B[1], ra, -th, 0); ctx.strokeStyle = COL.azulOsc; ctx.lineWidth = 1.5; ctx.stroke();
      textoRico(ctx, [['θ', true], [' = ' + par.ang + '°', false]], B[0] + ra + 6, B[1] - Math.max(9, ra * Math.sin(th / 2)), 13, COL.azulOsc, 'left', true);
      // bloque (x: posición de su centro a lo largo del plano)
      const w0 = 58 * k, h0 = 36 * k, L = window.Dinamica.LARGO_PLANO;
      const sPx = w0 / 2 + 3 + est.x / L * (Lpx - w0 - 12);
      const ux = c, uy = -s, nx = -s, ny = -c;                  // tangente y normal (hacia fuera) en pantalla
      const bx = B[0] + ux * sPx, by = B[1] + uy * sPx;          // centro de la base
      const cx = bx + nx * h0 / 2, cy = by + ny * h0 / 2;
      bloque(ctx, cx, cy, w0, h0, th, null);
      pildora(ctx, [['hacia arriba del plano +', false]], 90, 16, 12, COL.azul, COL.azulFondo, COL.azulOsc, 4, w - 4);
      if (E.ver.fuerzas) {
        const cuerpo = est.cuerpos[0];
        const cb = { cx, cy, w: w0, h: h0, ang: th };
        const lista = cuerpo.fuerzas.map(f => ({ f: f.tipo === 'Fg' ? conComponentes(f, [[c, s, [['mg sen θ', false]]], [s, -c, [['mg cos θ', false]]]]) : f, c: cb }));
        flechasFuerza(ctx, lista, E.pxN, E.ver, w, h);
      }
    },

    ascensor(ctx, w, h, E, k) {
      const { est, mod } = E, par = mod.par;
      // persona centrada en la altura, con sitio arriba y abajo para las flechas (salen de la cabeza y de los pies)
      const alto = Math.min(h * 0.44, 150 * k), esc = alto / 150, hs = 9 * k;
      const pie = h / 2 + 73 * esc;
      const top = pie - 146 * esc - 20, bot = pie + hs + 8, Hc = bot - top;
      const cxp = Math.min(w * 0.42, w / 2), Wc = Math.min(Hc * 0.9, 170 * k);
      E.pxN = Math.min(E.pxN, (Math.min(pie - 146 * esc, h - pie) - 20) / E.Fmax);
      const pxm = 34;                       // píxeles por metro en el hueco del ascensor
      // hueco: paredes y pisos (un piso cada 3 m) que se desplazan al moverse la cabina
      const xw0 = cxp - Wc / 2 - 16, xw1 = cxp + Wc / 2 + 16;
      ctx.fillStyle = '#F4F1EC'; ctx.fillRect(xw0, 0, xw1 - xw0, h);
      ctx.strokeStyle = MET.oscuro; ctx.lineWidth = 2; linea(ctx, xw0, 0, xw0, h); linea(ctx, xw1, 0, xw1, h);
      const yRef = bot + est.x * pxm;       // y del piso 0
      for (let p = -40; p <= 40; p++) {
        const y = yRef - p * 3 * pxm;
        if (y < -10 || y > h + 10) continue;
        ctx.fillStyle = '#D3AC84'; ctx.fillRect(xw0 - 30, y, 30, 5); ctx.fillRect(xw1, y, 30, 5);
        rotulo(ctx, 'piso ' + p, xw0 - 18, y - 9);
      }
      // cable
      ctx.strokeStyle = COL.tinta; ctx.lineWidth = 2; linea(ctx, cxp, 0, cxp, top);
      // cabina
      ctx.lineWidth = 1.5; ctx.strokeStyle = COL.tinta;
      rectRedondo(ctx, cxp - Wc / 2, top, Wc, Hc, 4); ctx.fillStyle = '#FFFFFF'; ctx.fill(); ctx.stroke();
      ctx.fillStyle = MET.claro; ctx.fillRect(cxp - Wc / 2, top, Wc, 8); ctx.fillRect(cxp - Wc / 2, bot - 8, Wc, 8);
      ctx.strokeRect(cxp - Wc / 2, top, Wc, 8); ctx.strokeRect(cxp - Wc / 2, bot - 8, Wc, 8);
      // balanza de baño
      const yS = bot - 8, ws = Wc * 0.55;
      rectRedondo(ctx, cxp - ws / 2, yS - hs, ws, hs, 3); ctx.fillStyle = MET.pizarra; ctx.fill(); ctx.stroke();
      // persona (silueta plana)
      const pxp = cxp + 4 * esc;
      ctx.lineWidth = 1.3; ctx.strokeStyle = COL.tinta;
      const parte = (x, y, ww, hh, r, col) => { rectRedondo(ctx, x, y, ww, hh, r); ctx.fillStyle = col; ctx.fill(); ctx.stroke(); };
      parte(pxp - 14 * esc, pie - 62 * esc, 11 * esc, 62 * esc, 4 * esc, '#5A6B7D');      // piernas
      parte(pxp + 3 * esc, pie - 62 * esc, 11 * esc, 62 * esc, 4 * esc, '#5A6B7D');
      parte(pxp - 19 * esc, pie - 118 * esc, 38 * esc, 60 * esc, 10 * esc, CUERPO.relleno); // torso
      parte(pxp - 28 * esc, pie - 112 * esc, 9 * esc, 46 * esc, 4 * esc, CUERPO.relleno);  // brazos
      parte(pxp + 19 * esc, pie - 112 * esc, 9 * esc, 46 * esc, 4 * esc, CUERPO.relleno);
      ctx.beginPath(); ctx.arc(pxp, pie - 132 * esc, 14 * esc, 0, 2 * Math.PI); ctx.fillStyle = '#F1D6BE'; ctx.fill(); ctx.stroke();
      // pantalla de la balanza (a la derecha, en la pared) con su lectura
      const lect = est.lecturas.balanza;
      if (w > 330) {
        const px = Math.min(w - 76, xw1 + 40);
        pildora(ctx, [['balanza: ' + numero(lect, 0) + ' N', false]], px + 36, yS - 4, 12, COL.azul, COL.azulFondo, COL.azulOsc, xw1 + 34, w - 3);
        ctx.strokeStyle = COL.suave; ctx.lineWidth = 1; linea(ctx, cxp + ws / 2, yS - hs / 2, xw1 + 32, yS - 4);
        pildora(ctx, [['peso: ' + numero(est.lecturas.peso, 0) + ' N', false]], px + 36, yS - 30, 12, FZ.Fg.color, '#EFECF6', FZ.Fg.color, xw1 + 34, w - 3);
      }
      pildora(ctx, [['arriba +', false]], 40, 16, 12, COL.azul, COL.azulFondo, COL.azulOsc);
      if (Math.abs(par.a + 9.81) < 1e-9 && par.modo === 'constante') pildora(ctx, [['caída libre', false]], 40, 40, 12, COL.ambar, COL.ambarFondo, COL.ambar);
      if (E.ver.fuerzas) {
        const cuerpo = est.cuerpos[0];
        const cb = { cx: pxp, cy: pie - 73 * esc, w: 58 * esc, h: 146 * esc, ang: 0 };
        const lista = cuerpo.fuerzas.map(f => ({ f, c: cb }));
        flechasFuerza(ctx, lista, E.pxN, E.ver, w, h);
      }
    },

    atwood(ctx, w, h, E, k) {
      const { est, mod } = E, par = mod.par;
      const cxp = Math.min(w * 0.42, w / 2), yTecho = 10;
      ctx.fillStyle = '#D3AC84'; ctx.fillRect(cxp - 90, yTecho - 10, 180, 10); ctx.fillStyle = '#EFE8DC'; ctx.fillRect(cxp - 90, yTecho - 2, 180, 2);
      // dinamómetro que sostiene la polea (vertical, alarga con 2F_T)
      const lectura = est.lecturas.polea, alarg = lectura / 200 * 320 * k;
      const d = dinamometro(ctx, cxp, yTecho + 2, 0, 1, Math.min(alarg * 0.5, 14), 26 * k);
      const R = 24 * k, yP = d.fin[1] + R + 4;
      ctx.strokeStyle = COL.tinta; ctx.lineWidth = 1.5; linea(ctx, cxp, d.fin[1] - 4, cxp, yP);
      ctx.fillStyle = MET.pizarra; ctx.fillRect(cxp - 3, yP - R - 8, 6, R + 8);
      const yMesa = h - 20;
      mesaLab(ctx, 0, w, yMesa);
      // la masa que baja empieza arriba (junto a la polea) y la que sube, apoyada en la mesa
      const rec = mod.recorrido, h1 = (20 + 14 * par.m1) * k, h2 = (20 + 14 * par.m2) * k, wb = 40 * k;
      const arriba = yP + R + 8, baja2 = par.m2 >= par.m1, altoMax = Math.max(h1, h2);
      // debajo de las masas queda sitio para la flecha del peso (sale de su base)
      const pesoMax = Math.max(par.m1, par.m2) * window.Dinamica.G;
      E.pxN = Math.min(E.pxN, 0.22 * h / pesoMax);
      const abajo = h - 14 - E.pxN * pesoMax;          // donde queda la base de la masa más baja
      const pxm = Math.max(10, (abajo - arriba - altoMax) / rec);
      const y1 = baja2 ? abajo - h1 - est.x * pxm : arriba - est.x * pxm;
      const y2 = baja2 ? arriba + est.x * pxm : abajo - h2 + est.x * pxm;
      ctx.strokeStyle = COL.tinta; ctx.lineWidth = 1.5;
      linea(ctx, cxp - R, yP, cxp - R, y1); linea(ctx, cxp + R, yP, cxp + R, y2);
      ctx.beginPath(); ctx.arc(cxp, yP, R, Math.PI, 2 * Math.PI); ctx.stroke();
      polea(ctx, cxp, yP, R, QUIETO ? 0 : -est.x * pxm / R);
      bloque(ctx, cxp - R, y1 + h1 / 2, wb, h1, 0, [['m', true], ['₁', false]]);
      bloque(ctx, cxp + R, y2 + h2 / 2, wb, h2, 0, [['m', true], ['₂', false]]);
      if (w > 330) pildora(ctx, [['dinamómetro: ' + N1(lectura) + ' N', false]], cxp + 100, d.medio[1], 12, COL.azul, COL.azulFondo, COL.azulOsc, cxp + 20, w - 3);
      pildora(ctx, [['m', true], ['₂', false], [' hacia abajo +', false]], 70, 16, 12, COL.azul, COL.azulFondo, COL.azulOsc, 4, w - 4);
      if (E.ver.fuerzas) {
        const [c1, c2] = est.cuerpos, lista = [];
        for (const [cuerpo, x, y, hh] of [[c1, cxp - R, y1, h1], [c2, cxp + R, y2, h2]])
          { const cb = { cx: x, cy: y + hh / 2, w: wb, h: hh, ang: 0 }; for (const f of cuerpo.fuerzas) lista.push({ f, c: cb }); }
        flechasFuerza(ctx, lista, E.pxN, E.ver, w, h);
      }
    },

    mesa(ctx, w, h, E, k) {
      const { est, mod } = E, par = mod.par;
      const R = 16 * k, w0 = 60 * k, h0 = 38 * k, xE = Math.min(w * 0.66, w - 110);
      // sobre el bloque queda sitio para la normal (sale de su cara de arriba)
      E.pxN = Math.min(E.pxN, (h * 0.42 - h0 - 22) / E.Fmax);
      const yT = Math.max(54, h0 + E.pxN * E.est.cuerpos[0].fuerzas.find(f => f.tipo === 'FN').mod + 24);
      // mesa: tablero, canto y pata
      mesaLab(ctx, 0, xE, yT);
      ctx.fillStyle = '#C49A72'; ctx.fillRect(xE - 22, yT + 8, 14, h - yT - 8); ctx.strokeStyle = COL.tinta; ctx.lineWidth = 1.2; ctx.strokeRect(xE - 22, yT + 8, 14, h - yT - 8);
      const yF = h - 6; ctx.fillStyle = '#D3AC84'; ctx.fillRect(0, yF, w, 6);
      // polea sujeta al borde
      const yh = yT - h0 * 0.55, pxc = xE + R + 4, pyc = yh + R;
      ctx.fillStyle = MET.pizarra; ctx.fillRect(xE - 6, yT - 4, 14, 20); ctx.strokeRect(xE - 6, yT - 4, 14, 20);
      ctx.strokeStyle = MET.oscuro; ctx.lineWidth = 4; linea(ctx, xE, yT + 2, pxc, pyc);
      // recorridos
      const rec = mod.recorrido, xL = 24, hm = (20 + 26 * par.m2) * k, wm = 34 * k;
      const yM0 = pyc + 26;
      const pxm = Math.max(10, Math.min((xE - xL - w0 - 18) / rec, (yF - 6 - yM0 - hm) / rec));
      const bx0 = xE - 14 - w0 - rec * pxm;
      const x0 = bx0 + est.x * pxm, cx = x0 + w0 / 2, cy = yT - h0 / 2;
      const yM = yM0 + est.x * pxm;
      ctx.strokeStyle = COL.tinta; ctx.lineWidth = 1.5;
      linea(ctx, x0 + w0 + 2, yh, pxc, yh); linea(ctx, pxc + R, pyc, pxc + R, yM);
      ctx.beginPath(); ctx.arc(pxc, pyc, R, -Math.PI / 2, 0); ctx.stroke();
      polea(ctx, pxc, pyc, R, QUIETO ? 0 : est.x * pxm / R);
      bloque(ctx, cx, cy, w0, h0, 0, [['m', true], ['₁', false]]);
      bloque(ctx, pxc + R, yM + hm / 2, wm, hm, 0, [['m', true], ['₂', false]]);
      if (par.mus === 0 && par.mud === 0) pildora(ctx, [['sin rozamiento', false]], 70, 40, 12, COL.ambar, COL.ambarFondo, COL.ambar, 4, w - 4);
      pildora(ctx, [['hacia la polea +', false]], 64, 16, 12, COL.azul, COL.azulFondo, COL.azulOsc, 4, w - 4);
      if (E.ver.fuerzas) {
        const [c1, c2] = est.cuerpos, lista = [];
        const b1 = { cx, cy, w: w0, h: h0, ang: 0 }, b2 = { cx: pxc + R, cy: yM + hm / 2, w: wm, h: hm, ang: 0 };
        for (const f of c1.fuerzas) lista.push({ f, c: b1 });
        for (const f of c2.fuerzas) lista.push({ f, c: b2 });
        flechasFuerza(ctx, lista, E.pxN, E.ver, w, h);
      }
    },

    cuerdas(ctx, w, h, E, k) {
      const { est, mod } = E, par = mod.par, a1 = par.ang1 * RAD, a2 = par.ang2 * RAD;
      const yC = 12, prof = Math.min(h - yC - 120 * k, 170 * k);
      // separación de los anclajes para que el nudo quede a la profundidad «prof»
      const cot = (a) => Math.cos(a) / Math.sin(a);
      let D = prof * (cot(a1) + cot(a2)), p = prof;
      const Dmax = w - 60;
      if (D > Dmax) { p = prof * Dmax / D; D = Dmax; }
      const xA = (w - D) / 2 + Math.min(0, 0), xB = xA + D, xN = xA + p * cot(a1), yN = yC + p;
      ctx.fillStyle = '#D3AC84'; ctx.fillRect(0, 0, w, yC); ctx.fillStyle = '#EFE8DC'; ctx.fillRect(0, yC - 3, w, 3);
      for (const xx of [xA, xB]) { ctx.fillStyle = MET.pizarra; ctx.fillRect(xx - 6, yC, 12, 6); ctx.strokeStyle = COL.tinta; ctx.lineWidth = 1.2; ctx.strokeRect(xx - 6, yC, 12, 6); }
      // ángulos con el techo
      ctx.strokeStyle = COL.azulOsc; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.arc(xA, yC + 6, 30, 0, a1); ctx.stroke();
      ctx.beginPath(); ctx.arc(xB, yC + 6, 30, Math.PI - a2, Math.PI); ctx.stroke();
      textoRico(ctx, [['θ', true], ['₁', false], [' = ' + par.ang1 + '°', false]], xA + 36, yC + 18, 13, COL.azulOsc, 'left', true);
      textoRico(ctx, [['θ', true], ['₂', false], [' = ' + par.ang2 + '°', false]], xB - 36, yC + 18, 13, COL.azulOsc, 'right', true);
      // cuerdas con un dinamómetro intercalado en cada una
      const tramo = (x0, y0, x1, y1, lectura) => {
        const L = Math.hypot(x1 - x0, y1 - y0), ux = (x1 - x0) / L, uy = (y1 - y0) / L;
        const lt = Math.min(46 * k, L * 0.4), al = Math.min(28, lectura / 200 * 320 * k), tot = lt + al + 25;
        const s0 = (L - tot) / 2;
        ctx.strokeStyle = COL.tinta; ctx.lineWidth = 1.5;
        linea(ctx, x0, y0, x0 + ux * s0, y0 + uy * s0);
        const d = dinamometro(ctx, x1 - ux * (s0 - 2), y1 - uy * (s0 - 2), -ux, -uy, al, lt);
        linea(ctx, x1, y1, x1 - ux * (s0 - 2), y1 - uy * (s0 - 2));
        return d;
      };
      const d1 = tramo(xA, yC + 6, xN, yN, est.lecturas.T1), d2 = tramo(xB, yC + 6, xN, yN, est.lecturas.T2);
      if (w > 360) {
        pildora(ctx, [['F', true], ['T1', false, true], [' = ' + N1(est.lecturas.T1) + ' N', false]], d1.medio[0] - 50, d1.medio[1] + 4, 12, FZ.FT.color, '#E3F2F3', FZ.FT.color, 3, w - 3);
        pildora(ctx, [['F', true], ['T2', false, true], [' = ' + N1(est.lecturas.T2) + ' N', false]], d2.medio[0] + 50, d2.medio[1] + 4, 12, FZ.FT.color, '#E3F2F3', FZ.FT.color, 3, w - 3);
      }
      // anilla y cuerpo
      ctx.strokeStyle = COL.tinta; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(xN, yN, 4, 0, 2 * Math.PI); ctx.stroke();
      const wb = 52 * k, hb = (30 + 8 * par.m) * k;
      linea(ctx, xN, yN + 4, xN, yN + 10);
      bloque(ctx, xN, yN + 10 + hb / 2, wb, hb, 0, [['m', true], [' = ' + numero(par.m, 1) + ' kg', false]]);
      pildora(ctx, [['en equilibrio', false]], w - 60, h - 16, 12, COL.vel, COL.velFondo, COL.vel, 4, w - 4);
      if (E.ver.fuerzas) {
        const cuerpo = est.cuerpos[0], cb = { cx: xN, cy: yN + 10 + hb / 2, w: wb, h: hb, ang: 0 };
        let n = 0;
        const lista = cuerpo.fuerzas.map(f => {
          if (f.tipo === 'Fg') return { f, c: cb };
          n++;
          const g = Object.assign({}, f, { extra: String(n) });
          return { f: conComponentes(g, [[1, 0, null], [0, 1, null]]), c: cb };
        });
        flechasFuerza(ctx, lista, E.pxN, E.ver, w, h);
      }
    },

    esfera(ctx, w, h, E, k) {
      const { est, mod } = E;
      // sobre la superficie queda sitio para las flechas hacia arriba (empuje y arrastre) cuando la esfera sale
      const yTop = Math.max(36, h * 0.28), yBot = h - 18, cxp = Math.min(w * 0.36, w / 2 - 20), wt = 58 * k;
      const pxm = (yBot - yTop - 16) / (mod.tubo + 0.02);
      const ySup = yTop + 10;                               // superficie del líquido
      E.pxN = Math.min(E.pxN, (ySup - 22 - (4 + mod.par.r * 2.2) * k) / Math.max(mod.Fb, mod.m * window.Dinamica.G - mod.Fb));
      mesaLab(ctx, 0, w, yBot);
      // probeta: líquido, escala en cm y marcas de cronometraje
      const col = mod.par.liquido === 'glicerina' ? '#F4ECCF' : '#F3DC9A';
      ctx.fillStyle = col; ctx.fillRect(cxp - wt / 2, ySup, wt, yBot - ySup - 4);
      ctx.strokeStyle = COL.tinta; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.moveTo(cxp - wt / 2, yTop - 8); ctx.lineTo(cxp - wt / 2, yBot - 4); ctx.lineTo(cxp + wt / 2, yBot - 4); ctx.lineTo(cxp + wt / 2, yTop - 8); ctx.stroke();
      ctx.fillStyle = MET.oscuro; ctx.fillRect(cxp - wt / 2 - 10, yBot - 6, wt + 20, 6);
      ctx.strokeStyle = MET.oscuro; ctx.lineWidth = 1;
      for (let cm = 0; cm <= mod.tubo * 100 + 1e-9; cm++) {
        const y = ySup + cm / 100 * pxm;
        linea(ctx, cxp - wt / 2, y, cxp - wt / 2 + (cm % 5 ? 4 : 8), y);
        if (cm % 10 === 0) rotulo(ctx, String(cm), cxp - wt / 2 - 8, y, 'right');
      }
      textoRico(ctx, [['x', true], [' / cm', false]], cxp - wt / 2 - 6, yTop - 22, 12, COL.suave, 'right');
      for (const marca of [0.1, 0.3]) {
        const y = ySup + marca * pxm;
        ctx.fillStyle = '#F2B84B'; ctx.fillRect(cxp - wt / 2 - 2, y - 2, wt + 4, 4);
      }
      // esfera (no está a escala: se dibuja mayor para verla)
      const rpx = (4 + mod.par.r * 2.2) * k, ys = ySup + est.x * pxm + rpx * 0.2;
      ctx.beginPath(); ctx.arc(cxp, ys, rpx, 0, 2 * Math.PI);
      ctx.fillStyle = mod.par.material === 'acero' ? '#C9D3DF' : '#DDEFF2'; ctx.fill(); ctx.strokeStyle = COL.tinta; ctx.lineWidth = 1.4; ctx.stroke();
      ctx.beginPath(); ctx.arc(cxp - rpx * 0.35, ys - rpx * 0.35, rpx * 0.25, 0, 2 * Math.PI); ctx.fillStyle = 'rgba(255,255,255,0.85)'; ctx.fill();
      rotulo(ctx, mod.liquido.nombre, cxp + wt / 2 + 8, yBot - 30, 'left');
      rotulo(ctx, 'marcas de 10 cm y 30 cm', cxp + wt / 2 + 8, yBot - 14, 'left');
      pildora(ctx, [['abajo +', false]], 36, 16, 12, COL.azul, COL.azulFondo, COL.azulOsc);
      if (E.ver.fuerzas) {
        const cuerpo = est.cuerpos[0];
        // F_b y F_d actúan sobre la esfera: se separan un poco para que no se pisen (las dos son verticales hacia arriba)
        const cb = { cx: cxp, cy: ys, r: rpx };
        const lista = cuerpo.fuerzas.map(f => ({ f, c: cb }));
        flechasFuerza(ctx, lista, E.pxN, E.ver, w, h);
      }
    }
  };

  function dibujarEscena(cv, E) {
    const lz = prepararLienzo(cv);
    if (lz.w < 60 || lz.h < 60) return;
    const ctx = lz.ctx;
    // en pantallas grandes todo el dibujo (también los rótulos) se amplía hasta 1,5 veces
    const kz = Math.max(1, Math.min(1.5, lz.h / 300, lz.w / 760));
    ctx.scale(kz, kz);
    const w = lz.w / kz, h = lz.h / kz;
    ctx.lineJoin = 'round';
    const k = Math.max(0.75, Math.min(1.25, h / 260, w / 520));
    // píxeles por newton: la fuerza mayor de todo el experimento mide «Lmax» píxeles
    const Lmax = Math.max(36, Math.min(E.mod.escena === 'esfera' ? 110 : 82, h * 0.3));
    E.pxN = Lmax / E.Fmax;
    E.ver = Object.assign({}, E.ver, { mili: E.mod.escena === 'esfera', halo: true });
    ESCENAS[E.mod.escena](ctx, w, h, E, k);
  }

  /* ======================= Diagrama de cuerpo libre (modelo de partícula) ======================= */
  function dibujarDCL(cv, E) {
    const { ctx, w, h } = prepararLienzo(cv);
    if (w < 60 || h < 60) return;
    const cuerpos = E.est.cuerpos, n = cuerpos.length;
    textoRico(ctx, [['Diagrama de cuerpo libre', false]], 8, 11, 13, COL.azulOsc, 'left', true);
    const anchoC = w / n, altoPie = 26;
    const Lmax = Math.max(22, Math.min(anchoC * 0.32, (h - 46 - altoPie) * 0.36));
    const pxN = Lmax / E.Fmax;
    cuerpos.forEach((c, i) => {
      const cx = anchoC * (i + 0.5), cy = 24 + (h - 24 - altoPie) / 2;
      if (n > 1) textoRico(ctx, [[c.nombre.replace(/^la |^el /, ''), false]], cx - anchoC / 2 + 10, 30, 12, COL.suave, 'left');
      // el cuerpo como partícula: un cuadrito (girado en el plano inclinado) o un círculo (esfera)
      ctx.save(); ctx.translate(cx, cy);
      if (E.mod.escena === 'plano') ctx.rotate(-E.mod.par.ang * RAD);
      ctx.fillStyle = CUERPO.relleno; ctx.strokeStyle = COL.tinta; ctx.lineWidth = 1.4;
      if (E.mod.escena === 'esfera') { ctx.beginPath(); ctx.arc(0, 0, 8, 0, 2 * Math.PI); ctx.fill(); ctx.stroke(); }
      else { ctx.fillRect(-9, -9, 18, 18); ctx.strokeRect(-9, -9, 18, 18); }
      ctx.restore();
      ctx.beginPath(); ctx.arc(cx, cy, 2.5, 0, 2 * Math.PI); ctx.fillStyle = COL.tinta; ctx.fill();
      let m = 0;
      const caja = E.mod.escena === 'esfera' ? { cx, cy, r: 8 } : { cx, cy, w: 18, h: 18, ang: E.mod.escena === 'plano' ? E.mod.par.ang * RAD : 0 };
      const lista = c.fuerzas.map(f => {
        let g = f;
        if (E.mod.escena === 'cuerdas' && f.tipo === 'FT') { m++; g = Object.assign({}, f, { extra: String(m), comp: [[1, 0, null], [0, 1, null]] }); }
        if (E.mod.escena === 'plano' && f.tipo === 'Fg') { const th = E.mod.par.ang * RAD; g = Object.assign({}, f, { comp: [[Math.cos(th), Math.sin(th), null], [Math.sin(th), -Math.cos(th), null]] }); }
        if (E.mod.escena === 'horizontal' && f.tipo === 'FH' && E.mod.par.ang) g = Object.assign({}, f, { comp: [[1, 0, null], [0, 1, null]] });
        return { f: g, c: caja };
      });
      flechasFuerza(ctx, lista, pxN, { componentes: E.ver.componentes, valores: E.ver.valores, mili: E.mod.escena === 'esfera' }, w, h);
      // fuerza neta y aceleración, aparte (no forman parte del diagrama)
      const Fx = c.m * c.a.x, Fy = c.m * c.a.y, Fn = Math.hypot(Fx, Fy), yp = h - altoPie / 2;
      ctx.fillStyle = '#FBEDED'; rectRedondo(ctx, cx - anchoC / 2 + 6, h - altoPie, anchoC - 12, altoPie - 3, 6); ctx.fill();
      if (Fn < 1e-6) textoRico(ctx, [['F', true], ['neta', false, true], [' = 0 (', false], ['a', true], [' = 0)', false]], cx, yp - 1, 13, NETA, 'center', true);
      else {
        const valor = E.mod.escena === 'esfera' ? numero(Fn * 1000, 2) + ' mN' : N1(Fn) + ' N';
        const partes = anchoC > 240 ? [['F', true], ['neta', false, true], [' = ', false], ['ma', true], [' = ' + valor, false]] : [['F', true], ['neta', false, true], [' = ' + valor, false]];
        const t = textoRico(ctx, partes, cx - 16, yp - 1, 13, NETA, 'center', true);
        const ux = Fx / Fn, uy = -Fy / Fn, x0 = cx - 16 + t / 2 + 20;
        ctx.save(); ctx.setLineDash([4, 3]); flecha(ctx, x0 - ux * 11, yp - 1 - uy * 9, x0 + ux * 11, yp - 1 + uy * 9, NETA, 2.5, 8); ctx.restore();
      }
    });
    if (n > 1) { ctx.strokeStyle = COL.rejMayor; ctx.lineWidth = 1; linea(ctx, w / 2, 22, w / 2, h - altoPie - 2); }
  }

  /* ======================= Barras de comparación =======================
     o = { titulo, filas: [{ partes, valor, color, raya }], nota } */
  function dibujarBarras(cv, o) {
    const { ctx, w, h } = prepararLienzo(cv);
    if (w < 60 || h < 60) return;
    textoRico(ctx, [[o.titulo, false]], 8, 11, 13, COL.azulOsc, 'left', true);
    const filas = o.filas, n = filas.length;
    const tl = w < 340 ? 12 : 13;
    let anchoRot = 0;
    for (const f of filas) anchoRot = Math.max(anchoRot, medirRico(ctx, f.partes, tl, true));
    const x0 = Math.min(w * 0.62, anchoRot + 14), x1 = w - 58, y0 = 26, y1 = h - (o.nota ? 22 : 6);
    const alto = Math.min(26, (y1 - y0) / n), max = Math.max(1e-9, ...filas.map(f => Math.abs(f.valor))) * 1.05;
    filas.forEach((f, i) => {
      const yc = y0 + alto * (i + 0.5);
      if (f.separador) { ctx.strokeStyle = COL.rejMayor; ctx.lineWidth = 1; linea(ctx, 6, yc - alto / 2, w - 6, yc - alto / 2); }
      textoRico(ctx, f.partes, x0 - 7, yc, tl, f.color, 'right', true);
      const L = (x1 - x0) * Math.abs(f.valor) / max, hb = Math.max(6, alto * 0.55);
      ctx.save();
      if (f.raya) { ctx.setLineDash([4, 3]); ctx.strokeStyle = f.color; ctx.lineWidth = 2; ctx.strokeRect(x0, yc - hb / 2, L, hb); }
      else { ctx.fillStyle = f.color; ctx.globalAlpha = 0.85; ctx.fillRect(x0, yc - hb / 2, L, hb); }
      ctx.restore();
      ctx.font = `700 ${tl}px ${LETRA}`; ctx.fillStyle = f.color; ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
      ctx.fillText(N1(f.valor) + ' N', x0 + L + 5, yc);
    });
    if (o.nota) { if (Array.isArray(o.nota)) textoRico(ctx, o.nota, 8, h - 10, 12, COL.suave, 'left'); else { ctx.font = `12px ${LETRA}`; ctx.fillStyle = COL.suave; ctx.textAlign = 'left'; ctx.textBaseline = 'middle'; ctx.fillText(o.nota, 8, h - 10); } }
  }

  /* ======================= Triángulo de fuerzas (dos cuerdas) ======================= */
  function dibujarTriangulo(cv, E) {
    const { ctx, w, h } = prepararLienzo(cv);
    if (w < 60 || h < 60) return;
    textoRico(ctx, [['Triángulo de fuerzas (punta con cola)', false]], 8, 11, 13, COL.azulOsc, 'left', true);
    const f = E.est.cuerpos[0].fuerzas;
    const Fg = f.find(x => x.tipo === 'Fg'), [T1, T2] = f.filter(x => x.tipo === 'FT');
    // recorrido: F_g, luego F_T2, luego F_T1: vuelve al punto de partida (suma cero)
    const pts = [[0, 0]]; for (const v of [Fg, T2, T1]) { const p = pts[pts.length - 1]; pts.push([p[0] + v.x, p[1] + v.y]); }
    const xs = pts.map(p => p[0]), ys = pts.map(p => p[1]);
    const ancho = Math.max(...xs) - Math.min(...xs), alto = Math.max(...ys) - Math.min(...ys);
    const esc = Math.min((w - 120) / Math.max(ancho, 1e-6), (h - 50) / Math.max(alto, 1e-6));
    const ox = (w - ancho * esc) / 2 - Math.min(...xs) * esc, oy = 30 + Math.max(...ys) * esc;
    const P = (p) => [ox + p[0] * esc, oy - p[1] * esc];
    const pares = [[Fg, '', 0], [T2, '2', 1], [T1, '1', 2]];
    for (const [v, ex, i] of pares) {
      const a = P(pts[i]), b = P(pts[i + 1]), c = FZ[v.tipo].color;
      flecha(ctx, a[0], a[1], b[0], b[1], c, 3, 11);
      const mx = (a[0] + b[0]) / 2, my = (a[1] + b[1]) / 2, L = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1;
      // rótulo hacia fuera del triángulo
      const nx = (b[1] - a[1]) / L, ny = -(b[0] - a[0]) / L;
      const partes = [['F', true], [FZ[v.tipo].sub + ex, false, true], [' = ' + N1(v.mod) + ' N', false]];
      textoRico(ctx, partes, mx - nx * 16, my - ny * 14, 13, c, nx > 0.3 ? 'right' : nx < -0.3 ? 'left' : 'center', true);
    }
    ctx.font = `12px ${LETRA}`; ctx.fillStyle = COL.vel; ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
    ctx.fillText('El triángulo se cierra: la fuerza neta es cero.', 8, h - 9);
  }

  window.FuerzasEscena = { FZ, NETA, simbolo, N1, salida, bloque, mesaLab, dibujarEscena, dibujarDCL, dibujarBarras, dibujarTriangulo };
})();
