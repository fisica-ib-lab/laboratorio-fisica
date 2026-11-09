/* Simulación A.1 · Un movimiento, tres gráficas — parte Explorar
   Nivel 1: velocidad constante (un tramo con a = 0).
   La física sale de comun/cinematica.js (valores exactos, sin aproximaciones numéricas). */

(function () {
  'use strict';
  const { Movimiento, numero } = window.Cinematica;

  // ---------- Configuración por nivel ----------
  const NIVELES = {
    1: {
      duracion: 10,                                   // s
      pista: { min: -30, max: 30 },                   // m
      ejes: {
        s: { min: -30, max: 30, mayor: 10, menor: 5 },
        v: { min: -2.5, max: 2.5, mayor: 1, menor: 0.5 },
        a: { min: -1, max: 1, mayor: 0.5, menor: 0.25 }
      },
      movimiento: (s0, v) => new Movimiento(s0, v, [{ duracion: 10, a: 0 }])
    }
  };
  const nivel = NIVELES[1];
  const DUR = nivel.duracion;

  // ---------- Colores y letra (Normas de diseño) ----------
  const COL = {
    tinta: '#1F2A36', suave: '#5A6B7D', azul: '#2E74B5', azulOsc: '#1F4D78', azulFondo: '#EEF3F9',
    rejMayor: '#C9D3DF', rejMenor: '#E6EBF1', gris: '#8A97A6',
    pos: '#2E74B5', des: '#C25E0C', vel: '#1E7B4F', velFondo: '#E6F3EC', ace: '#C00000', aceFondo: '#FBEDED'
  };
  const LETRA = 'Calibri, Carlito, "Segoe UI", Arial, sans-serif';
  const MENOS = '−';

  // ---------- Estado ----------
  const $ = (id) => document.getElementById(id);
  const estado = {
    s0: Number($('desS0').value),
    v: Number($('desV').value),
    mov: null,
    anterior: null,
    t: 0,
    jugando: false,
    rapidez: 1,
    verAnterior: $('chkAnterior').checked,
    completa: $('chkCompleta').checked
  };
  estado.mov = nivel.movimiento(estado.s0, estado.v);

  // ---------- Utilidades de dibujo ----------
  function prepararLienzo(cv) {
    const r = cv.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
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
  function medirRico(ctx, partes, tam, negrita) {
    let ancho = 0;
    for (const [txt, it] of partes) {
      ctx.font = `${it ? 'italic ' : ''}${negrita ? '700 ' : ''}${tam}px ${LETRA}`;
      ancho += ctx.measureText(txt).width;
    }
    return ancho;
  }
  function textoRico(ctx, partes, x, y, tam, color, alinear, negrita) {
    const ancho = medirRico(ctx, partes, tam, negrita);
    let cx = alinear === 'center' ? x - ancho / 2 : alinear === 'right' ? x - ancho : x;
    ctx.fillStyle = color;
    ctx.textBaseline = 'middle';
    ctx.textAlign = 'left';
    for (const [txt, it] of partes) {
      ctx.font = `${it ? 'italic ' : ''}${negrita ? '700 ' : ''}${tam}px ${LETRA}`;
      ctx.fillText(txt, cx, y);
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
  // Píldora centrada en (x, y); se mantiene dentro de [xmin, xmax]
  function pildora(ctx, partes, x, y, tam, borde, fondo, texto, xmin, xmax) {
    const ancho = medirRico(ctx, partes, tam, true) + 18, alto = tam + 9;
    let x0 = x - ancho / 2;
    if (xmin !== undefined) x0 = Math.max(xmin, Math.min(x0, xmax - ancho));
    rectRedondo(ctx, x0, y - alto / 2, ancho, alto, alto / 2);
    ctx.fillStyle = fondo; ctx.fill();
    ctx.lineWidth = 1.5; ctx.strokeStyle = borde; ctx.stroke();
    textoRico(ctx, partes, x0 + 9, y + 0.5, tam, texto, 'left', true);
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
  function num(x, d) { return numero(x, d); }
  // Número para ejes: sin decimales sobrantes (0,5 · 1 · −2)
  function numEje(x) {
    const r = Math.round(x * 1000) / 1000;
    return numero(r, Number.isInteger(r) ? 0 : (Number.isInteger(r * 10) ? 1 : 2));
  }

  // ---------- Escena: mesa de laboratorio, pista, sensor de movimiento y carrito ----------
  // El banderín es solo decorativo: cuelga en reposo y ondea hacia atrás cuando el carrito se mueve.
  const bandera = { phi: 0, om: 0, ultimo: null };
  let escenaPendiente = false;
  const QUIETO = !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  const MET = { claro: '#E4E9EF', brillo: '#F6F8FA', medio: '#8A97A6', oscuro: '#5A6B7D', pizarra: '#2F3E4E' };

  function dibujarEscena() {
    const cv = $('escena');
    const lienzo = prepararLienzo(cv);
    const ctx = lienzo.ctx;
    // En pantallas altas, todo el dibujo se amplía (hasta 1,5 veces) para que se vea bien al proyectar
    const k = Math.max(1, Math.min(1.5, lienzo.h / 190));
    ctx.scale(k, k);
    const w = lienzo.w / k, h = lienzo.h / k;
    const { min, max } = nivel.pista;
    const ancha = w >= 640;
    const mIzq = ancha ? 112 : 70, mDer = 56;
    const X = (s) => mIzq + (s - min) / (max - min) * (w - mIzq - mDer);
    const pxm = (w - mIzq - mDer) / (max - min);
    const yP = h - 62;                    // superficie de la pista (donde ruedan las ruedas)
    const ahora = performance.now();
    const linea = (x1, y1, x2, y2) => { ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke(); };
    ctx.lineJoin = 'round';

    const s = estado.mov.s(estado.t);
    const v = estado.mov.v(estado.t);
    const a = estado.mov.a(estado.t);
    const s0 = estado.mov.s0;
    const xc = X(s);

    // Indicador de sentido positivo
    pildora(ctx, [['derecha +', false]], 52, 15, 13, COL.azul, COL.azulFondo, COL.azulOsc);
    flecha(ctx, 100, 15, 140, 15, COL.azul, 2.5, 10);

    // Mesa de laboratorio
    ctx.fillStyle = '#EFE8DC'; ctx.fillRect(0, yP + 17, w, 3);
    ctx.fillStyle = '#D3AC84'; ctx.fillRect(0, yP + 20, w, 5);

    // Pista de aluminio con su escala
    const rx0 = mIzq - 58, rx1 = w - 8;
    ctx.strokeStyle = COL.tinta; ctx.lineWidth = 1.2;
    for (const xp of (ancha ? [rx0 + 16, (rx0 + rx1) / 2, rx1 - 16] : [rx0 + 14, rx1 - 14])) {   // patas niveladoras
      ctx.beginPath(); ctx.moveTo(xp - 6, yP + 11); ctx.lineTo(xp + 6, yP + 11); ctx.lineTo(xp + 9, yP + 17); ctx.lineTo(xp - 9, yP + 17); ctx.closePath();
      ctx.fillStyle = MET.oscuro; ctx.fill(); ctx.stroke();
    }
    ctx.fillStyle = MET.claro; ctx.fillRect(rx0, yP, rx1 - rx0, 11);
    ctx.fillStyle = MET.brillo; ctx.fillRect(rx0, yP, rx1 - rx0, 3);
    ctx.strokeRect(rx0, yP, rx1 - rx0, 11);
    for (let m = min; m <= max; m++) {
      if (pxm < 6 && m % 5 !== 0) continue;
      const largo = m === 0 ? 10 : m % 5 === 0 ? 6 : 3;
      ctx.strokeStyle = m === 0 ? COL.azulOsc : MET.oscuro; ctx.lineWidth = m === 0 ? 2 : 1;
      linea(X(m), yP + 10.5, X(m), yP + 10.5 - largo);
    }
    // Tope del extremo derecho
    ctx.strokeStyle = COL.tinta; ctx.lineWidth = 1.2;
    ctx.fillStyle = MET.medio; ctx.fillRect(rx1 - 7, yP - 14, 6, 14); ctx.strokeRect(rx1 - 7, yP - 14, 6, 14);
    ctx.fillStyle = COL.tinta; ctx.fillRect(rx1 - 10, yP - 11, 3, 7);

    // Números de la escala (bajo la mesa)
    const pasoEtiqueta = pxm >= 13 ? 5 : 10;
    for (let m = min; m <= max; m += pasoEtiqueta) {
      const cero = m === 0;
      ctx.font = `${cero ? '700 ' : ''}13px ${LETRA}`;
      ctx.fillStyle = cero ? COL.azulOsc : COL.suave;
      ctx.textAlign = 'center'; ctx.textBaseline = 'top';
      ctx.fillText(m < 0 ? MENOS + Math.abs(m) : String(m), X(m), yP + 28);
    }
    textoRico(ctx, [['s', true], [' / m', false]], w - 6, yP + 35, 13, COL.suave, 'right');

    // Interfaz y cable del sensor
    const sx = rx0 + 4;                     // borde izquierdo del sensor
    ctx.strokeStyle = COL.tinta; ctx.lineWidth = 2.2; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(sx + 1, yP - 15);
    if (ancha) ctx.bezierCurveTo(sx - 16, yP - 17, sx - 4, yP + 17, 40, yP + 9);
    else ctx.bezierCurveTo(sx - 9, yP - 16, sx - 2, yP + 15, 0, yP + 13);
    ctx.stroke(); ctx.lineCap = 'butt';
    if (ancha) {
      ctx.lineWidth = 1.2;
      rectRedondo(ctx, 10, yP - 6, 31, 23, 3); ctx.fillStyle = MET.pizarra; ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#E8F1F8'; ctx.fillRect(14, yP - 2, 23, 11);
      ctx.strokeStyle = COL.pos; ctx.lineWidth = 1.3;              // mini gráfica en la pantalla
      ctx.beginPath(); ctx.moveTo(16, yP + 6); ctx.lineTo(23, yP + 4); ctx.lineTo(28, yP + 1); ctx.lineTo(35, yP); ctx.stroke();
      ctx.fillStyle = MET.medio;
      for (const bx of [18, 25.5, 33]) { ctx.beginPath(); ctx.arc(bx, yP + 13, 1.4, 0, 2 * Math.PI); ctx.fill(); }
    }

    // Sensor de movimiento (ultrasonidos) sujeto al extremo de la pista
    ctx.strokeStyle = COL.tinta; ctx.lineWidth = 1.2;
    ctx.fillStyle = MET.oscuro; ctx.fillRect(sx + 4, yP - 5, 10, 5); ctx.strokeRect(sx + 4, yP - 5, 10, 5);
    rectRedondo(ctx, sx, yP - 27, 18, 22, 4); ctx.fillStyle = MET.pizarra; ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.ellipse(sx + 18, yP - 16, 2.6, 7, 0, 0, 2 * Math.PI);
    ctx.fillStyle = '#E2B045'; ctx.fill(); ctx.lineWidth = 1; ctx.stroke();
    const parpadeo = estado.jugando && (QUIETO || Math.floor(ahora / 350) % 2 === 0);
    ctx.beginPath(); ctx.arc(sx + 6, yP - 22, 1.8, 0, 2 * Math.PI);
    ctx.fillStyle = parpadeo ? '#4FD08A' : MET.medio; ctx.fill();
    // Pulsos de ultrasonidos mientras se mide
    if (estado.jugando && !QUIETO) {
      ctx.lineWidth = 1.3; ctx.strokeStyle = MET.oscuro;
      for (let k = 0; k < 3; k++) {
        const fase = (ahora / 900 + k / 3) % 1;
        ctx.globalAlpha = 0.75 * (1 - fase);
        ctx.beginPath(); ctx.arc(sx + 14, yP - 16, 9 + fase * 30, -0.55, 0.55); ctx.stroke();
      }
      ctx.globalAlpha = 1;
    }
    // Rótulo del sensor (se atenúa si el carrito está encima)
    ctx.font = `12px ${LETRA}`;
    const medio = Math.max(ctx.measureText('movimiento').width, ctx.measureText('sensor de').width) / 2;
    const xr = Math.max(4 + medio, sx + 9);
    const visible = Math.max(0, Math.min(1, (xc - 34 - (xr + medio)) / 24));
    if (visible > 0) {
      ctx.globalAlpha = visible;
      ctx.fillStyle = COL.suave; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText('sensor de', xr, yP - 56); ctx.fillText('movimiento', xr, yP - 44);
      ctx.strokeStyle = COL.suave; ctx.lineWidth = 1; linea(sx + 9, yP - 36, sx + 9, yP - 29);
      ctx.globalAlpha = 1;
    }

    // Posición inicial (marca discontinua)
    ctx.save();
    ctx.setLineDash([4, 3]); ctx.strokeStyle = COL.pos; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(X(s0), yP - 36); ctx.lineTo(X(s0), yP);
    ctx.moveTo(X(s0), yP + 43); ctx.lineTo(X(s0), yP + 58); ctx.stroke();
    ctx.restore();
    // el rótulo s₀ va abajo, en el lado contrario al desplazamiento
    if (xc >= X(s0)) textoRico(ctx, [['s', true], ['₀', false]], X(s0) - 5, yP + 51, 13, COL.pos, 'right', true);
    else textoRico(ctx, [['s', true], ['₀', false]], X(s0) + 5, yP + 51, 13, COL.pos, 'left', true);

    // Desplazamiento (naranja), desde s0 hasta s
    const yDes = yP + 51;
    if (Math.abs(xc - X(s0)) > 3) {
      flecha(ctx, X(s0), yDes, xc, yDes, COL.des, 3, Math.min(11, Math.abs(xc - X(s0))));
      ctx.font = `700 12px ${LETRA}`;
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      const xm = (X(s0) + xc) / 2, etiqueta = 'desplazamiento';
      const ancho = ctx.measureText(etiqueta).width;
      if (Math.abs(xc - X(s0)) > ancho + 16) {
        ctx.fillStyle = '#FFF'; ctx.fillRect(xm - ancho / 2 - 3, yDes - 7, ancho + 6, 14);
        ctx.fillStyle = COL.des; ctx.fillText(etiqueta, xm, yDes);
      }
    }

    // ----- Carrito de laboratorio (su posición es la de su centro) -----
    const yT = yP - 28, yB = yP - 8, rR = 6.5;
    // Ruedas: giran sin deslizar (ángulo = recorrido / radio)
    const giro = (s * pxm) / rR;
    for (const dx of [-18, 18]) {
      const cx = xc + dx, cy = yP - rR;
      ctx.beginPath(); ctx.arc(cx, cy, rR, 0, 2 * Math.PI); ctx.fillStyle = COL.tinta; ctx.fill();
      ctx.beginPath(); ctx.arc(cx, cy, 3.4, 0, 2 * Math.PI); ctx.fillStyle = '#C9D3DF'; ctx.fill();
      ctx.strokeStyle = COL.tinta; ctx.lineWidth = 1.1;
      for (let k = 0; k < 3; k++) {
        const ang = giro + k * 2 * Math.PI / 3;
        linea(cx, cy, cx + 3.4 * Math.cos(ang), cy + 3.4 * Math.sin(ang));
      }
    }
    // Topes de los extremos y cuerpo
    ctx.strokeStyle = COL.tinta; ctx.lineWidth = 1.2; ctx.fillStyle = MET.medio;
    for (const lado of [-1, 1]) {
      const x0 = lado < 0 ? xc - 33 : xc + 29;
      ctx.fillRect(x0, yT + 7, 4, 6); ctx.strokeRect(x0, yT + 7, 4, 6);
    }
    rectRedondo(ctx, xc - 29, yT, 58, yB - yT, 4);
    ctx.fillStyle = '#B5CFEC'; ctx.fill();
    ctx.save(); ctx.clip(); ctx.fillStyle = COL.azul; ctx.fillRect(xc - 29, yT, 58, 5); ctx.restore();
    ctx.lineWidth = 1.5; ctx.strokeStyle = COL.tinta; ctx.stroke();
    // Marca del centro y su índice sobre la escala
    ctx.strokeStyle = COL.azulOsc; ctx.lineWidth = 1.5; linea(xc, yT + 8, xc, yB - 2);
    ctx.fillStyle = COL.azulOsc;
    ctx.beginPath(); ctx.moveTo(xc, yP + 1); ctx.lineTo(xc - 4.5, yP + 9); ctx.lineTo(xc + 4.5, yP + 9); ctx.closePath(); ctx.fill();

    // Banderín: resorte amortiguado hacia su ángulo de equilibrio (decorativo)
    const objetivo = estado.jugando ? -Math.sign(v) * 1.43 * (1 - Math.exp(-Math.abs(v) / 0.5)) : 0.3;
    const dt = bandera.ultimo === null ? 0 : Math.min(0.05, (ahora - bandera.ultimo) / 1000);
    bandera.ultimo = ahora;
    if (QUIETO) { bandera.phi = objetivo; bandera.om = 0; }
    else {
      for (let i = 0; i < 4; i++) {
        const acc = 100 * (objetivo - bandera.phi) - 6 * bandera.om;
        bandera.om += acc * dt / 4; bandera.phi += bandera.om * dt / 4;
      }
    }
    const phi = bandera.phi;
    ctx.strokeStyle = COL.tinta; ctx.lineWidth = 1.5; linea(xc, yT, xc, yT - 21);
    ctx.beginPath(); ctx.arc(xc, yT - 21, 1.6, 0, 2 * Math.PI); ctx.fillStyle = COL.tinta; ctx.fill();
    // phi = 0: cuelga; phi < 0: ondea hacia la izquierda (el carrito va a la derecha)
    const dir = [Math.sin(phi), Math.cos(phi)], nor = [Math.cos(phi), -Math.sin(phi)];
    const onda = (estado.jugando && !QUIETO) ? 2.2 * Math.min(1, Math.abs(v)) : 0;
    const arriba = [], abajo = [];
    for (let i = 0; i <= 5; i++) {
      const f = i / 5, d = 17 * f, medioAncho = 3.6 * (1 - f);
      const riz = onda * f * Math.sin(ahora / 70 - i * 1.3);
      const px = xc + dir[0] * d + nor[0] * riz, py = (yT - 17) + dir[1] * d + nor[1] * riz;
      arriba.push([px + nor[0] * medioAncho, py + nor[1] * medioAncho]);
      abajo.push([px - nor[0] * medioAncho, py - nor[1] * medioAncho]);
    }
    ctx.beginPath(); ctx.moveTo(arriba[0][0], arriba[0][1]);
    for (let i = 1; i <= 5; i++) ctx.lineTo(arriba[i][0], arriba[i][1]);
    for (let i = 4; i >= 0; i--) ctx.lineTo(abajo[i][0], abajo[i][1]);
    ctx.closePath(); ctx.fillStyle = '#F2B84B'; ctx.fill(); ctx.lineWidth = 1.1; ctx.stroke();

    // Flecha de velocidad (verde) a escala: 30 px por cada m s⁻¹
    const yV = yT - 30;
    const kV = 30;
    if (Math.abs(v) > 1e-9) flecha(ctx, xc, yV, xc + v * kV, yV, COL.vel, 4, 12);
    const textoV = [['v', true], [' = ' + num(v, 1) + ' m s⁻¹', false]];
    const yPV = yV - 20;
    pildora(ctx, textoV, xc, yPV, 13, COL.vel, COL.velFondo, COL.vel, 4, w - 4);
    // Aceleración (roja): en este nivel es cero, sin flecha
    if (Math.abs(a) > 1e-9) flecha(ctx, xc, yV - 40, xc + a * 60, yV - 40, COL.ace, 4, 12);
    const textoA = [['a', true], [' = ' + num(a, a === 0 ? 0 : 1) + (a === 0 ? '' : ' m s⁻²'), false]];
    const anchoPV = medirRico(ctx, textoV, 13, true) + 18;
    let xA = xc + anchoPV / 2 + 8;
    const anchoA = medirRico(ctx, textoA, 13, true) + 18;
    if (xA + anchoA > w - 4) xA = xc - anchoPV / 2 - 8 - anchoA;
    pildora(ctx, textoA, xA + anchoA / 2, yPV, 13, COL.ace, COL.aceFondo, COL.ace, 4, w - 4);

    // Mientras el banderín no esté quieto, seguir dibujando aunque la simulación esté en pausa
    const inquieto = Math.abs(objetivo - bandera.phi) > 0.004 || Math.abs(bandera.om) > 0.004;
    if (!estado.jugando && inquieto && !escenaPendiente && w > 10) {
      escenaPendiente = true;
      requestAnimationFrame(() => { escenaPendiente = false; dibujarEscena(); });
    }
  }

  // ---------- Gráficas ----------
  const GRAFICAS = [
    { id: 'gS', mag: 's', color: COL.pos, unidad: 'm', f: (m, t) => m.s(t) },
    { id: 'gV', mag: 'v', color: COL.vel, unidad: 'm s⁻¹', f: (m, t) => m.v(t) },
    { id: 'gA', mag: 'a', color: COL.ace, unidad: 'm s⁻²', f: (m, t) => m.a(t) }
  ];
  const MARGEN = { izq: 54, der: 36, arr: 22, aba: 26 };

  function geometria(w, h, eje) {
    const x0 = MARGEN.izq, x1 = w - MARGEN.der, y0 = MARGEN.arr, y1 = h - MARGEN.aba;
    return {
      x0, x1, y0, y1,
      X: (t) => x0 + (t / DUR) * (x1 - x0),
      Y: (val) => y1 - (val - eje.min) / (eje.max - eje.min) * (y1 - y0),
      T: (x) => Math.min(DUR, Math.max(0, (x - x0) / (x1 - x0) * DUR))
    };
  }

  // Trazo exacto de una magnitud entre 0 y tFin
  function trazar(ctx, g, m, G, tFin) {
    ctx.beginPath();
    if (g.mag === 'a') {
      let primero = true;
      for (const tr of m.tramos) {
        if (tr.t0 > tFin) break;
        const fin = Math.min(tr.t1, tFin);
        if (primero) { ctx.moveTo(G.X(tr.t0), G.Y(tr.a)); primero = false; }
        else ctx.lineTo(G.X(tr.t0), G.Y(tr.a)); // salto vertical entre tramos
        ctx.lineTo(G.X(fin), G.Y(tr.a));
      }
    } else {
      let primero = true;
      for (const tr of m.tramos) {
        if (tr.t0 > tFin) break;
        const fin = Math.min(tr.t1, tFin);
        const n = (g.mag === 's' && tr.a !== 0) ? 80 : 1;
        for (let i = 0; i <= n; i++) {
          const t = tr.t0 + (fin - tr.t0) * i / n;
          const y = G.Y(g.f(m, t));
          if (primero) { ctx.moveTo(G.X(t), y); primero = false; } else ctx.lineTo(G.X(t), y);
        }
      }
    }
    ctx.stroke();
  }

  function dibujarGrafica(g) {
    const cv = $(g.id);
    const { ctx, w, h } = prepararLienzo(cv);
    const eje = nivel.ejes[g.mag];
    const G = geometria(w, h, eje);

    // Cuadrícula
    const lineaV = (t, c, a) => { ctx.strokeStyle = c; ctx.lineWidth = a; ctx.beginPath(); ctx.moveTo(G.X(t), G.y0); ctx.lineTo(G.X(t), G.y1); ctx.stroke(); };
    const lineaH = (y, c, a) => { ctx.strokeStyle = c; ctx.lineWidth = a; ctx.beginPath(); ctx.moveTo(G.x0, G.Y(y)); ctx.lineTo(G.x1, G.Y(y)); ctx.stroke(); };
    for (let t = 0; t <= DUR + 1e-9; t += 0.5) if (Math.abs(t - Math.round(t)) > 1e-6) lineaV(t, COL.rejMenor, 1);
    const pasos = (paso) => { const r = []; for (let k = Math.ceil(eje.min / paso - 1e-9); k * paso <= eje.max + 1e-9; k++) r.push(k * paso); return r; };
    pasos(eje.menor).forEach(y => lineaH(y, COL.rejMenor, 1));
    for (let t = 0; t <= DUR + 1e-9; t += 1) lineaV(t, COL.rejMayor, 1);
    pasos(eje.mayor).forEach(y => lineaH(y, COL.rejMayor, 1));

    // Números del eje vertical
    ctx.font = `13px ${LETRA}`; ctx.fillStyle = COL.suave; ctx.textAlign = 'right'; ctx.textBaseline = 'middle';
    pasos(eje.mayor).forEach(y => ctx.fillText(numEje(y), G.x0 - 7, G.Y(y)));
    // Números del tiempo (bajo la gráfica)
    ctx.textAlign = 'center'; ctx.textBaseline = 'top';
    const pasoT = (G.x1 - G.x0) / DUR < 26 ? 2 : 1;
    for (let t = 0; t <= DUR + 1e-9; t += pasoT) ctx.fillText(String(t), G.X(t), G.y1 + 6);

    // Ejes: vertical en t = 0 y eje de tiempo en el cero
    flecha(ctx, G.x0, G.y1 + 2, G.x0, G.y0 - 12, COL.tinta, 1.5, 8);
    flecha(ctx, G.x0 - 2, G.Y(0), G.x1 + 16, G.Y(0), COL.tinta, 1.5, 8);
    textoRico(ctx, [[g.mag, true], [' / ' + g.unidad, false]], G.x0 + 8, G.y0 - 9, 14, g.color, 'left', true);
    textoRico(ctx, [['t', true], [' / s', false]], w - 4, G.Y(0) - 12, 14, COL.tinta, 'right', true);

    ctx.save();
    ctx.beginPath(); ctx.rect(G.x0 - 2, G.y0 - 4, G.x1 - G.x0 + 4, G.y1 - G.y0 + 8); ctx.clip();
    ctx.lineJoin = 'round'; ctx.lineCap = 'round';

    // Movimiento anterior (gris discontinuo)
    if (estado.verAnterior && estado.anterior) {
      ctx.setLineDash([6, 4]); ctx.strokeStyle = COL.gris; ctx.lineWidth = 2;
      trazar(ctx, g, estado.anterior, G, DUR);
      ctx.setLineDash([]);
    }
    // Gráfica completa (tenue) si se pide
    if (estado.completa) {
      ctx.globalAlpha = 0.3; ctx.strokeStyle = g.color; ctx.lineWidth = 3;
      trazar(ctx, g, estado.mov, G, DUR);
      ctx.globalAlpha = 1;
    }
    // Trazo hasta el instante actual
    ctx.strokeStyle = g.color; ctx.lineWidth = 3;
    trazar(ctx, g, estado.mov, G, estado.t);
    ctx.restore();

    // Cursor del instante
    const xt = G.X(estado.t);
    ctx.save();
    ctx.setLineDash([4, 3]); ctx.strokeStyle = COL.azulOsc; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(xt, G.y0 - 2); ctx.lineTo(xt, G.y1); ctx.stroke();
    ctx.restore();
    const valor = g.f(estado.mov, estado.t);
    ctx.fillStyle = g.color; ctx.strokeStyle = '#FFF'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(xt, G.Y(valor), 5.5, 0, 2 * Math.PI); ctx.fill(); ctx.stroke();
  }

  // ---------- Valores y controles ----------
  function actualizarTextos() {
    const m = estado.mov, t = estado.t;
    $('valT').textContent = num(t, 2);
    $('valS').textContent = num(m.s(t), 2);
    $('valV').textContent = num(m.v(t), 2);
    $('valA').textContent = num(m.a(t), 2);
    $('valDes').textContent = num(m.desplazamiento(t), 2);
    $('valDist').textContent = num(m.distancia(t), 2);
    $('outS0').textContent = num(estado.s0, 0) + ' m';
    $('outV').textContent = num(estado.v, 1) + ' m s⁻¹';
    $('barraTiempo').value = t;
    $('btnPlay').setAttribute('aria-label', estado.jugando ? 'Pausar' : 'Reproducir');
    $('txtPlay').textContent = estado.jugando ? 'Pausar' : (t >= DUR - 1e-9 ? 'Repetir' : 'Reproducir');
    $('icoPlay').hidden = estado.jugando;
    $('icoPausa').hidden = !estado.jugando;
    document.querySelectorAll('.caso').forEach(b => {
      b.classList.toggle('activo', Number(b.dataset.s0) === estado.s0 && Number(b.dataset.v) === estado.v);
    });
  }

  function dibujarTodo() {
    dibujarEscena();
    GRAFICAS.forEach(dibujarGrafica);
    actualizarTextos();
  }

  // ---------- Reproducción ----------
  let ultimo = null;
  function cuadro(ahora) {
    if (!estado.jugando) { ultimo = null; return; }
    if (ultimo !== null) {
      estado.t = Math.min(DUR, estado.t + (ahora - ultimo) / 1000 * estado.rapidez);
      if (estado.t >= DUR) estado.jugando = false;
    }
    ultimo = ahora;
    dibujarTodo();
    if (estado.jugando) requestAnimationFrame(cuadro); else ultimo = null;
  }
  function reproducir() {
    if (estado.t >= DUR - 1e-9) estado.t = 0;
    if (!estado.jugando) { estado.jugando = true; ultimo = null; requestAnimationFrame(cuadro); }
    actualizarTextos();
  }
  function pausar() { estado.jugando = false; actualizarTextos(); }
  function irA(t) { estado.t = Math.min(DUR, Math.max(0, Math.round(t * 1000) / 1000)); dibujarTodo(); }

  $('btnPlay').addEventListener('click', () => (estado.jugando ? pausar() : reproducir()));
  $('btnReiniciar').addEventListener('click', () => { pausar(); irA(0); });
  $('btnAtras').addEventListener('click', () => { pausar(); irA(estado.t - 0.1); });
  $('btnAdelante').addEventListener('click', () => { pausar(); irA(estado.t + 0.1); });
  $('barraTiempo').addEventListener('input', (e) => { pausar(); irA(Number(e.target.value)); });
  $('rapidez').addEventListener('change', (e) => { estado.rapidez = Number(e.target.value); });

  // ---------- Cambiar el movimiento ----------
  function nuevoMovimiento(s0, v, guardarAnterior) {
    if (guardarAnterior && (s0 !== estado.s0 || v !== estado.v)) estado.anterior = estado.mov;
    estado.s0 = s0; estado.v = v;
    estado.mov = nivel.movimiento(s0, v);
    estado.t = 0;
  }

  let arrastrando = false;
  function alMoverDeslizador() {
    const s0 = Number($('desS0').value), v = Math.round(Number($('desV').value) * 10) / 10;
    // el movimiento anterior se guarda una sola vez al empezar a arrastrar
    const guardar = !arrastrando;
    arrastrando = true;
    pausar();
    nuevoMovimiento(s0, v, guardar);
    dibujarTodo();
  }
  function alSoltarDeslizador() { arrastrando = false; reproducir(); }
  ['desS0', 'desV'].forEach(id => {
    $(id).addEventListener('input', alMoverDeslizador);
    $(id).addEventListener('change', alSoltarDeslizador);
  });

  document.querySelectorAll('.caso').forEach(b => b.addEventListener('click', () => {
    const s0 = Number(b.dataset.s0), v = Number(b.dataset.v);
    $('desS0').value = s0; $('desV').value = v;
    pausar();
    nuevoMovimiento(s0, v, true);
    dibujarTodo();
    reproducir();
  }));

  $('chkAnterior').addEventListener('change', (e) => { estado.verAnterior = e.target.checked; dibujarTodo(); });
  $('chkCompleta').addEventListener('change', (e) => { estado.completa = e.target.checked; dibujarTodo(); });

  // ---------- Clic y arrastre sobre las gráficas ----------
  GRAFICAS.forEach(g => {
    const cv = $(g.id);
    let abajo = false;
    const tDesde = (e) => {
      const r = cv.getBoundingClientRect();
      return geometria(r.width, r.height, nivel.ejes[g.mag]).T(e.clientX - r.left);
    };
    cv.addEventListener('pointerdown', (e) => { abajo = true; cv.setPointerCapture(e.pointerId); pausar(); irA(tDesde(e)); });
    cv.addEventListener('pointermove', (e) => { if (abajo) irA(tDesde(e)); });
    const soltar = () => { abajo = false; };
    cv.addEventListener('pointerup', soltar);
    cv.addEventListener('pointercancel', soltar);
  });

  // ---------- Teclado ----------
  document.addEventListener('keydown', (e) => {
    const tag = (e.target.tagName || '').toLowerCase();
    if (tag === 'input' || tag === 'select' || tag === 'button') return;
    if ($('panel-explorar').hidden) return;
    if (e.code === 'Space') { e.preventDefault(); estado.jugando ? pausar() : reproducir(); }
    else if (e.key === 'ArrowRight') { pausar(); irA(estado.t + 0.1); }
    else if (e.key === 'ArrowLeft') { pausar(); irA(estado.t - 0.1); }
  });

  // ---------- Pestañas ----------
  document.querySelectorAll('.pestanas [role="tab"]').forEach(tab => tab.addEventListener('click', () => {
    document.querySelectorAll('.pestanas [role="tab"]').forEach(t => t.setAttribute('aria-selected', String(t === tab)));
    document.querySelectorAll('.panel').forEach(p => { p.hidden = p.id !== 'panel-' + tab.dataset.panel; });
    if (tab.dataset.panel !== 'explorar') pausar(); else dibujarTodo();
  }));

  // ---------- Inicio ----------
  new ResizeObserver(() => dibujarTodo()).observe(document.querySelector('.explorar'));
  window.addEventListener('resize', dibujarTodo);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(dibujarTodo);
  dibujarTodo();

  // Para las pruebas automáticas
  window.__simA1 = { estado, irA, nuevoMovimiento, dibujarTodo, nivel };
})();
