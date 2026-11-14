/* Laboratorio de Física IB — dibujo común (utilidades de lienzo y gráficas con escala).
   Mismo estilo que las figuras de las fichas: fondo blanco, cuadrícula tipo papel milimetrado,
   ejes con flecha, rótulos «magnitud / unidad» con la variable en cursiva, coma decimal.
   La simulación A.1 «Un movimiento, tres gráficas» tiene su propia copia en su dibujo.js. */

(function (raiz) {
  'use strict';
  const numero = raiz.Cinematica.numero;

  const COL = {
    tinta: '#1F2A36', suave: '#5A6B7D', azul: '#2E74B5', azulOsc: '#1F4D78', azulFondo: '#EEF3F9',
    rejMayor: '#C9D3DF', rejMenor: '#E6EBF1', gris: '#8A97A6',
    pos: '#2E74B5', des: '#C25E0C', desFondo: '#FDF0E4', vel: '#1E7B4F', velFondo: '#E6F3EC',
    ace: '#C00000', aceFondo: '#FBEDED', ambar: '#9C6500', ambarFondo: '#FFF4DE', violeta: '#5B4B8A', violetaFondo: '#EFECF6'
  };
  const LETRA = 'Calibri, Carlito, "Segoe UI", Arial, sans-serif';
  const MENOS = '−';
  const QUIETO = !!(raiz.matchMedia && raiz.matchMedia('(prefers-reduced-motion: reduce)').matches);

  function prepararLienzo(cv) {
    const r = cv.getBoundingClientRect();
    const dpr = raiz.devicePixelRatio || 1;
    const w = Math.max(1, Math.round(r.width)), h = Math.max(1, Math.round(r.height));
    if (cv.width !== Math.round(w * dpr) || cv.height !== Math.round(h * dpr)) {
      cv.width = Math.round(w * dpr); cv.height = Math.round(h * dpr);
    }
    const ctx = cv.getContext('2d');
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, w, h);
    return { ctx, w, h };
  }
  // Texto con partes en cursiva: partes = [[texto, cursiva?], ...]
  // Cada parte es [texto, cursiva?, subíndice?]
  const fuente = (it, negrita, tam, sub) => `${it ? 'italic ' : ''}${negrita ? '700 ' : ''}${sub ? Math.round(tam * 0.72) : tam}px ${LETRA}`;
  function medirRico(ctx, partes, tam, negrita) {
    let ancho = 0;
    for (const [txt, it, sub] of partes) { ctx.font = fuente(it, negrita, tam, sub); ancho += ctx.measureText(txt).width; }
    return ancho;
  }
  function textoRico(ctx, partes, x, y, tam, color, alinear, negrita) {
    const ancho = medirRico(ctx, partes, tam, negrita);
    let cx = alinear === 'center' ? x - ancho / 2 : alinear === 'right' ? x - ancho : x;
    ctx.fillStyle = color; ctx.textBaseline = 'middle'; ctx.textAlign = 'left';
    for (const [txt, it, sub] of partes) {
      ctx.font = fuente(it, negrita, tam, sub);
      ctx.fillText(txt, cx, y + (sub ? tam * 0.26 : 0));
      cx += ctx.measureText(txt).width;
    }
    return ancho;
  }
  function rectRedondo(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }
  // Píldora centrada en (x, y); se mantiene dentro de [xmin, xmax]. Devuelve sus bordes.
  function pildora(ctx, partes, x, y, tam, borde, fondo, texto, xmin, xmax) {
    const ancho = medirRico(ctx, partes, tam, true) + 18, alto = tam + 9;
    let x0 = x - ancho / 2;
    if (xmin !== undefined) x0 = Math.max(xmin, Math.min(x0, xmax - ancho));
    rectRedondo(ctx, x0, y - alto / 2, ancho, alto, alto / 2);
    ctx.fillStyle = fondo; ctx.fill();
    ctx.lineWidth = 1.5; ctx.strokeStyle = borde; ctx.stroke();
    textoRico(ctx, partes, x0 + 9, y + 0.5, tam, texto, 'left', true);
    return [x0, x0 + ancho];
  }
  // Flecha con punta triangular sólida
  function flecha(ctx, x1, y1, x2, y2, color, grosor, punta) {
    const L = Math.hypot(x2 - x1, y2 - y1);
    if (L < 1) return;
    const ux = (x2 - x1) / L, uy = (y2 - y1) / L;
    const p = Math.min(punta, L);
    ctx.strokeStyle = color; ctx.lineWidth = grosor; ctx.lineCap = 'butt';
    ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2 - ux * p * 0.9, y2 - uy * p * 0.9); ctx.stroke();
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(x2, y2);
    ctx.lineTo(x2 - ux * p - uy * p * 0.55, y2 - uy * p + ux * p * 0.55);
    ctx.lineTo(x2 - ux * p + uy * p * 0.55, y2 - uy * p - ux * p * 0.55);
    ctx.closePath(); ctx.fill();
  }
  // Número sin decimales sobrantes (0,5 · 1 · −2 · 0,25)
  function fmt(x) {
    const r = Math.round(x * 100) / 100;
    return numero(r, Number.isInteger(r) ? 0 : (Number.isInteger(Math.round(r * 1000) / 100) ? 1 : 2));
  }

  // ---------- Gráficas ----------
  const MARGEN = { izq: 50, der: 34, arr: 22, aba: 26 };
  const MARGEN_MINI = { izq: 34, der: 14, arr: 18, aba: 20 };

  // Eje horizontal genérico: [0, hMax] (tiempo o distancia)
  function geometria(w, h, eje, hMax, mini, extraArr) {
    const M = mini ? MARGEN_MINI : MARGEN;
    const x0 = M.izq, x1 = w - M.der, y0 = M.arr + (extraArr || 0), y1 = h - M.aba;
    return {
      x0, x1, y0, y1,
      X: (t) => x0 + (t / hMax) * (x1 - x0),
      Y: (val) => y1 - (val - eje.min) / (eje.max - eje.min) * (y1 - y0),
      T: (x) => Math.min(hMax, Math.max(0, (x - x0) / (x1 - x0) * hMax)),
      V: (y) => eje.min + (y1 - y) / (y1 - y0) * (eje.max - eje.min)
    };
  }

  /* o = { eje: {min, max, mayor, menor}, hMax, pasoH: {mayor, menor},
           rotulo: partes del eje vertical, color, rotuloH: partes del eje horizontal (por defecto «t / s»),
           mini, extraArr,
           curvas: [{ puntos, color, ancho, raya, alfa, hasta }],
           cursor: { t, y }, marcas: [{ t, y, nombre }], rotulos: [[partes, color]], vacio: 'texto' } */
  function dibujarGrafica(cv, o) {
    const { ctx, w, h } = prepararLienzo(cv);
    if (w < 20 || h < 20) return null;
    const eje = o.eje, hMax = o.hMax, mini = !!o.mini;
    const G = geometria(w, h, eje, hMax, mini, o.extraArr);
    const tam = mini ? 11 : 13;
    const color = o.color || COL.tinta;
    const pasoH = o.pasoH || { mayor: 1, menor: 0.5 };

    // Cuadrícula
    const lineaV = (t, c) => { ctx.strokeStyle = c; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(G.X(t), G.y0); ctx.lineTo(G.X(t), G.y1); ctx.stroke(); };
    const lineaH = (y, c) => { ctx.strokeStyle = c; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(G.x0, G.Y(y)); ctx.lineTo(G.x1, G.Y(y)); ctx.stroke(); };
    const pasos = (paso, min, max) => { const r = []; for (let i = Math.ceil(min / paso - 1e-9); i * paso <= max + 1e-9; i++) r.push(i * paso); return r; };
    if (!mini) {
      pasos(pasoH.menor, 0, hMax).forEach(t => lineaV(t, COL.rejMenor));
      pasos(eje.menor, eje.min, eje.max).forEach(y => lineaH(y, COL.rejMenor));
    }
    pasos(pasoH.mayor, 0, hMax).forEach(t => lineaV(t, COL.rejMayor));
    pasos(mini ? eje.menor : eje.mayor, eje.min, eje.max).forEach(y => lineaH(y, COL.rejMayor));

    // Números
    ctx.font = `${tam}px ${LETRA}`; ctx.fillStyle = COL.suave; ctx.textAlign = 'right'; ctx.textBaseline = 'middle';
    pasos(eje.mayor, eje.min, eje.max).forEach(y => ctx.fillText(fmt(y), G.x0 - (mini ? 4 : 7), G.Y(y)));
    ctx.textAlign = 'center'; ctx.textBaseline = 'top';
    const px = (G.x1 - G.x0) / hMax * pasoH.mayor;
    const salto = px < 15 ? 4 : px < 26 ? 2 : 1;
    pasos(pasoH.mayor * salto, 0, hMax).forEach(t => ctx.fillText(fmt(t), G.X(t), G.y1 + (mini ? 3 : 6)));

    // Ejes: vertical en el origen y horizontal en el cero (o abajo si el cero no está en el rango)
    const yCero = eje.min <= 0 && eje.max >= 0 ? G.Y(0) : G.y1;
    flecha(ctx, G.x0, G.y1 + 2, G.x0, G.y0 - (mini ? 8 : 12), COL.tinta, 1.5, mini ? 6 : 8);
    flecha(ctx, G.x0 - 2, yCero, G.x1 + (mini ? 10 : 16), yCero, COL.tinta, 1.5, mini ? 6 : 8);
    if (o.rotulo) textoRico(ctx, o.rotulo, G.x0 + (mini ? 6 : 8), G.y0 - (mini ? 8 : 9), mini ? 12 : 14, color, 'left', true);
    textoRico(ctx, o.rotuloH || [['t', true], [' / s', false]], w - 3, yCero - (mini ? 9 : 12), mini ? 12 : 14, COL.tinta, 'right', true);

    ctx.save();
    ctx.beginPath(); ctx.rect(G.x0 - 2, G.y0 - 4, G.x1 - G.x0 + 4, G.y1 - G.y0 + 8); ctx.clip();
    ctx.lineJoin = 'round'; ctx.lineCap = 'round';
    for (const c of (o.curvas || [])) {
      if (!c.puntos || !c.puntos.length) continue;
      ctx.save();
      if (c.hasta !== undefined) { ctx.beginPath(); ctx.rect(G.x0 - 2, 0, G.X(c.hasta) - G.x0 + 2, h); ctx.clip(); }
      ctx.globalAlpha = c.alfa === undefined ? 1 : c.alfa;
      ctx.setLineDash(c.raya || []);
      ctx.strokeStyle = c.color || color; ctx.lineWidth = c.ancho || (mini ? 2.5 : 3);
      ctx.beginPath();
      c.puntos.forEach((p, i) => { if (i === 0) ctx.moveTo(G.X(p[0]), G.Y(p[1])); else ctx.lineTo(G.X(p[0]), G.Y(p[1])); });
      ctx.stroke();
      ctx.restore();
    }
    ctx.restore();

    // Rótulos en el margen superior, a la derecha
    const rot = o.rotulos || [];
    rot.forEach((rt, i) => textoRico(ctx, rt[0], w - 4, G.y0 - 9 - 17 * (rot.length - 1 - i), 13, rt[1], 'right', true));

    if (o.cursor) {
      const xt = G.X(o.cursor.t);
      ctx.save();
      ctx.setLineDash([4, 3]); ctx.strokeStyle = COL.azulOsc; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.moveTo(xt, G.y0 - 2); ctx.lineTo(xt, G.y1); ctx.stroke();
      ctx.restore();
      if (o.cursor.y !== undefined) {
        ctx.fillStyle = color; ctx.strokeStyle = '#FFF'; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.arc(xt, G.Y(o.cursor.y), 5.5, 0, 2 * Math.PI); ctx.fill(); ctx.stroke();
      }
    }
    for (const m of (o.marcas || [])) {
      const x = G.X(m.t), y = G.Y(m.y);
      ctx.fillStyle = COL.tinta; ctx.strokeStyle = '#FFF'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(x, y, 5, 0, 2 * Math.PI); ctx.fill(); ctx.stroke();
      const arriba = y - 16 > G.y0;
      pildora(ctx, [[m.nombre, false]], x + 14, arriba ? y - 14 : y + 16, 13, COL.tinta, '#FFF', COL.tinta, G.x0 + 2, G.x1);
    }
    if (o.vacio) {
      ctx.fillStyle = 'rgba(255,255,255,0.9)'; ctx.fillRect(G.x0 + 1, G.y0, G.x1 - G.x0 - 1, G.y1 - G.y0);
      ctx.font = `${mini ? 13 : 15}px ${LETRA}`; ctx.fillStyle = COL.suave; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      const lineas = o.vacio.split('\n');
      lineas.forEach((l, i) => ctx.fillText(l, (G.x0 + G.x1) / 2, (G.y0 + G.y1) / 2 + (i - (lineas.length - 1) / 2) * 20));
    }
    return G;
  }

  raiz.Graficas = { COL, LETRA, MENOS, QUIETO, prepararLienzo, medirRico, textoRico, rectRedondo, pildora, flecha, fmt, geometria, dibujarGrafica };
})(this);
