/* Simulación A.1 — dibujo compartido por Explorar, Construir y Practicar.
   crearEscena(lienzo): montaje de laboratorio (mesa, pista, sensor, carrito).
   dibujarGrafica(lienzo, opciones): gráfica con escala al estilo de las fichas.
   Aquí no hay física: todo llega calculado desde comun/cinematica.js. */

(function () {
  'use strict';
  const { numero } = window.Cinematica;

  const COL = {
    tinta: '#1F2A36', suave: '#5A6B7D', azul: '#2E74B5', azulOsc: '#1F4D78', azulFondo: '#EEF3F9',
    rejMayor: '#C9D3DF', rejMenor: '#E6EBF1', gris: '#8A97A6',
    pos: '#2E74B5', des: '#C25E0C', vel: '#1E7B4F', velFondo: '#E6F3EC', ace: '#C00000', aceFondo: '#FBEDED',
    ambar: '#9C6500', ambarFondo: '#FFF4DE', violeta: '#5B4B8A'
  };
  const MET = { claro: '#E4E9EF', brillo: '#F6F8FA', medio: '#8A97A6', oscuro: '#5A6B7D', pizarra: '#2F3E4E' };
  const LETRA = 'Calibri, Carlito, "Segoe UI", Arial, sans-serif';
  const MENOS = '−';
  const LETRAS = 'ABCDEF';
  const QUIETO = !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  const MAG = {
    s: { color: COL.pos, unidad: 'm', nombre: 'posición' },
    v: { color: COL.vel, unidad: 'm s⁻¹', nombre: 'velocidad' },
    a: { color: COL.ace, unidad: 'm s⁻²', nombre: 'aceleración' }
  };

  // ---------- Utilidades ----------
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
    ctx.fillStyle = color; ctx.textBaseline = 'middle'; ctx.textAlign = 'left';
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

  // Escalas «redondas» para los ejes verticales
  const ESCALAS = {
    s: [[6, 2, 1], [12, 4, 2], [30, 10, 5], [60, 20, 10]],
    v: [[2.5, 1, 0.5], [6, 2, 1], [12, 4, 2], [24, 8, 4]],
    a: [[1, 0.5, 0.25], [2, 1, 0.5], [4, 2, 1], [8, 4, 2], [16, 8, 4], [32, 16, 8]]
  };
  function ejeAuto(mag, maxAbs) {
    const lista = ESCALAS[mag];
    for (const [mx, mayor, menor] of lista) if (maxAbs <= mx * 1.0001) return { min: -mx, max: mx, mayor, menor };
    const [mx, mayor, menor] = lista[lista.length - 1];
    return { min: -mx, max: mx, mayor, menor };
  }

  // Puntos (t, valor) de una magnitud de un movimiento; los saltos quedan como dos puntos con el mismo t
  function muestrear(mov, mag, n) {
    n = n || 48;
    const pts = [];
    for (const tr of mov.tramos) {
      if (mag === 'a') { pts.push([tr.t0, tr.a], [tr.t1, tr.a]); continue; }
      const k = (mag === 's' && tr.a !== 0) ? n : 1, T = tr.t1 - tr.t0;
      for (let i = 0; i <= k; i++) {
        const d = T * i / k;
        pts.push([tr.t0 + d, mag === 's' ? tr.s0 + tr.v0 * d + 0.5 * tr.a * d * d : tr.v0 + tr.a * d]);
      }
    }
    return pts;
  }
  function maxAbsPuntos(pts) { let m = 0; for (const p of pts) m = Math.max(m, Math.abs(p[1])); return m; }

  // ---------- Escena: mesa de laboratorio, pista, sensor de movimiento y carrito ----------
  // El banderín es solo decorativo: cuelga en reposo y ondea hacia atrás cuando el carrito se mueve.
  function crearEscena(cv) {
    const bandera = { phi: 0.3, om: 0, ultimo: null };
    let pendiente = false, ultimaE = null;

    function dibujar(E) {
      ultimaE = E;
      const lienzo = prepararLienzo(cv);
      if (lienzo.w < 20) return;
      const ctx = lienzo.ctx;
      // En pantallas altas, todo el dibujo se amplía (hasta 1,5 veces) para que se vea bien al proyectar
      const k = Math.max(0.8, Math.min(1.5, lienzo.h / 190));
      ctx.scale(k, k);
      const w = lienzo.w / k, h = lienzo.h / k;
      const min = E.pista.min, max = E.pista.max;
      const ancha = w >= 640;
      const mIzq = ancha ? 112 : 70, mDer = 56;
      const X = (s) => mIzq + (s - min) / (max - min) * (w - mIzq - mDer);
      const pxm = (w - mIzq - mDer) / (max - min);
      const yP = h - 62;                    // superficie de la pista (donde ruedan las ruedas)
      const ahora = performance.now();
      const linea = (x1, y1, x2, y2) => { ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke(); };
      ctx.lineJoin = 'round';

      const mov = E.mov, t = E.t;
      const s = mov.s(t), v = mov.v(t), a = mov.a(t), s0 = mov.s0;
      const xc = X(s);

      // Indicador de sentido positivo
      pildora(ctx, [['derecha +', false]], 52, 15, 13, COL.azul, COL.azulFondo, COL.azulOsc);
      flecha(ctx, 100, 15, 140, 15, COL.azul, 2.5, 10);
      if (E.aviso) pildora(ctx, [[E.aviso, false]], w - 120, 15, 13, COL.ambar, COL.ambarFondo, COL.ambar, 150, w - 6);

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
      const parpadeo = E.jugando && (QUIETO || Math.floor(ahora / 350) % 2 === 0);
      ctx.beginPath(); ctx.arc(sx + 6, yP - 22, 1.8, 0, 2 * Math.PI);
      ctx.fillStyle = parpadeo ? '#4FD08A' : MET.medio; ctx.fill();
      // Pulsos de ultrasonidos mientras se mide
      if (E.jugando && !QUIETO) {
        ctx.lineWidth = 1.3; ctx.strokeStyle = MET.oscuro;
        for (let i = 0; i < 3; i++) {
          const fase = (ahora / 900 + i / 3) % 1;
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

      if (E.desplazamiento !== false) {
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
        for (let i = 0; i < 3; i++) {
          const ang = giro + i * 2 * Math.PI / 3;
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
      const objetivo = E.jugando ? -Math.sign(v) * 1.43 * (1 - Math.exp(-Math.abs(v) / 0.5)) : 0.3;
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
      const onda = (E.jugando && !QUIETO) ? 2.2 * Math.min(1, Math.abs(v)) : 0;
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

      if (E.vectores !== false) {
        // Flechas a escala: velocidad (verde) y, encima, aceleración (roja)
        const yV = yT - 30, yA = yV - 13, yPil = yA - 19;
        const kV = 62 / (E.vMax || 2.5), kA = 46 / (E.aMax || 1);
        if (Math.abs(v) > 1e-9) flecha(ctx, xc, yV, xc + v * kV, yV, COL.vel, 4, 12);
        if (Math.abs(a) > 1e-9) flecha(ctx, xc, yA, xc + a * kA, yA, COL.ace, 4, 12);
        const textoV = [['v', true], [' = ' + numero(v, 1) + ' m s⁻¹', false]];
        const textoA = [['a', true], [' = ' + (a === 0 ? '0' : fmt(a) + ' m s⁻²'), false]];
        const anchoV = medirRico(ctx, textoV, 13, true) + 18, anchoA = medirRico(ctx, textoA, 13, true) + 18;
        // las dos píldoras van juntas y centradas sobre el carrito, sin salirse del dibujo
        let x0 = xc - (anchoV + 8 + anchoA) / 2;
        x0 = Math.max(4, Math.min(x0, w - 4 - (anchoV + 8 + anchoA)));
        pildora(ctx, textoV, x0 + anchoV / 2, yPil, 13, COL.vel, COL.velFondo, COL.vel);
        pildora(ctx, textoA, x0 + anchoV + 8 + anchoA / 2, yPil, 13, COL.ace, COL.aceFondo, COL.ace);
      }

      // Mientras el banderín no esté quieto, seguir dibujando aunque la simulación esté en pausa
      const inquieto = Math.abs(objetivo - bandera.phi) > 0.004 || Math.abs(bandera.om) > 0.004;
      if (!E.jugando && inquieto && !pendiente) {
        pendiente = true;
        requestAnimationFrame(() => { pendiente = false; if (ultimaE && cv.offsetParent !== null) dibujar(ultimaE); });
      }
    }
    return { dibujar };
  }

  // ---------- Gráficas ----------
  const MARGEN = { izq: 54, der: 36, arr: 22, aba: 26 };
  const MARGEN_MINI = { izq: 34, der: 14, arr: 18, aba: 20 };

  // «extraArr»: píxeles de más en el margen superior (segunda línea de rótulos de pendiente y área)
  function geometria(w, h, eje, tMax, mini, extraArr) {
    const M = mini ? MARGEN_MINI : MARGEN;
    const x0 = M.izq, x1 = w - M.der, y0 = M.arr + (extraArr || 0), y1 = h - M.aba;
    return {
      x0, x1, y0, y1,
      X: (t) => x0 + (t / tMax) * (x1 - x0),
      Y: (val) => y1 - (val - eje.min) / (eje.max - eje.min) * (y1 - y0),
      T: (x) => Math.min(tMax, Math.max(0, (x - x0) / (x1 - x0) * tMax)),
      V: (y) => eje.min + (y1 - y) / (y1 - y0) * (eje.max - eje.min)
    };
  }

  /* o = { mag, eje, tMax, mini,
           curvas: [{ puntos, color, ancho, raya, alfa, hasta }],
           tramos: [{ t0, t1 }]            rótulos A, B, C…
           cursor: { t, y }                línea vertical y punto
           area: { puntos, hasta, texto }  área con signo entre la curva y el eje
           tangente: { t, y, m, color, texto }
           marcas: [{ t, y, nombre }]      puntos con letra (P)
           nodos: [{ t, y, mal, bien }]    puntos arrastrables
           niveles: [{ t0, t1, y, mal, bien }]   barras arrastrables
           vacio: 'texto', extraArr } */
  function dibujarGrafica(cv, o) {
    const { ctx, w, h } = prepararLienzo(cv);
    if (w < 20 || h < 20) return;
    const eje = o.eje, tMax = o.tMax, mini = !!o.mini;
    const G = geometria(w, h, eje, tMax, mini, o.extraArr);
    const info = MAG[o.mag];
    const tam = mini ? 11 : 13;

    // Cuadrícula
    const lineaV = (t, c) => { ctx.strokeStyle = c; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(G.X(t), G.y0); ctx.lineTo(G.X(t), G.y1); ctx.stroke(); };
    const lineaH = (y, c) => { ctx.strokeStyle = c; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(G.x0, G.Y(y)); ctx.lineTo(G.x1, G.Y(y)); ctx.stroke(); };
    const pasos = (paso) => { const r = []; for (let i = Math.ceil(eje.min / paso - 1e-9); i * paso <= eje.max + 1e-9; i++) r.push(i * paso); return r; };
    if (!mini) {
      for (let t = 0.5; t <= tMax + 1e-9; t += 1) lineaV(t, COL.rejMenor);
      pasos(eje.menor).forEach(y => lineaH(y, COL.rejMenor));
    }
    for (let t = 0; t <= tMax + 1e-9; t += 1) lineaV(t, COL.rejMayor);
    pasos(mini ? eje.menor : eje.mayor).forEach(y => lineaH(y, COL.rejMayor));

    // Números
    ctx.font = `${tam}px ${LETRA}`; ctx.fillStyle = COL.suave; ctx.textAlign = 'right'; ctx.textBaseline = 'middle';
    pasos(eje.mayor).forEach(y => ctx.fillText(fmt(y), G.x0 - (mini ? 4 : 7), G.Y(y)));
    ctx.textAlign = 'center'; ctx.textBaseline = 'top';
    const pxT = (G.x1 - G.x0) / tMax;
    const pasoT = pxT < 13 ? 5 : pxT < 26 ? 2 : 1;
    for (let t = 0; t <= tMax + 1e-9; t += pasoT) ctx.fillText(String(t), G.X(t), G.y1 + (mini ? 3 : 6));

    // Ejes: vertical en t = 0 y eje de tiempo en el cero
    flecha(ctx, G.x0, G.y1 + 2, G.x0, G.y0 - (mini ? 8 : 12), COL.tinta, 1.5, mini ? 6 : 8);
    flecha(ctx, G.x0 - 2, G.Y(0), G.x1 + (mini ? 10 : 16), G.Y(0), COL.tinta, 1.5, mini ? 6 : 8);
    textoRico(ctx, [[o.mag, true], [' / ' + info.unidad, false]], G.x0 + (mini ? 6 : 8), G.y0 - (mini ? 8 : 9), mini ? 12 : 14, info.color, 'left', true);
    textoRico(ctx, [['t', true], [' / s', false]], w - 3, G.Y(0) - (mini ? 9 : 12), mini ? 12 : 14, COL.tinta, 'right', true);

    // Rótulos de tramo
    if (o.tramos && o.tramos.length > 1) {
      ctx.save(); ctx.setLineDash([2, 3]); ctx.strokeStyle = COL.gris; ctx.lineWidth = 1;
      o.tramos.forEach((tr, i) => {
        if (i > 0) { ctx.beginPath(); ctx.moveTo(G.X(tr.t0), G.y0); ctx.lineTo(G.X(tr.t0), G.y1); ctx.stroke(); }
      });
      ctx.restore();
      ctx.font = `700 ${mini ? 10 : 12}px ${LETRA}`; ctx.fillStyle = COL.gris; ctx.textAlign = 'center'; ctx.textBaseline = 'bottom';
      o.tramos.forEach((tr, i) => {
        if (G.X(tr.t1) - G.X(tr.t0) >= 12) ctx.fillText(LETRAS[i], (G.X(tr.t0) + G.X(tr.t1)) / 2, G.y1 - 2);
      });
    }

    ctx.save();
    ctx.beginPath(); ctx.rect(G.x0 - 2, G.y0 - 4, G.x1 - G.x0 + 4, G.y1 - G.y0 + 8); ctx.clip();
    ctx.lineJoin = 'round'; ctx.lineCap = 'round';

    // Área con signo entre la curva y el eje del tiempo, desde 0 hasta «hasta»
    if (o.area) {
      const pts = o.area.puntos, hasta = o.area.hasta;
      for (let i = 0; i + 1 < pts.length; i++) {
        let [t1, y1] = pts[i], [t2, y2] = pts[i + 1];
        if (t2 <= t1 || t1 >= hasta) continue;
        if (t2 > hasta) { y2 = y1 + (y2 - y1) * (hasta - t1) / (t2 - t1); t2 = hasta; }
        const trozos = [];
        if (y1 * y2 < 0) { const tc = t1 + (t2 - t1) * y1 / (y1 - y2); trozos.push([t1, y1, tc, 0], [tc, 0, t2, y2]); }
        else trozos.push([t1, y1, t2, y2]);
        for (const [ta, ya, tb, yb] of trozos) {
          ctx.beginPath(); ctx.moveTo(G.X(ta), G.Y(0)); ctx.lineTo(G.X(ta), G.Y(ya)); ctx.lineTo(G.X(tb), G.Y(yb)); ctx.lineTo(G.X(tb), G.Y(0)); ctx.closePath();
          ctx.fillStyle = (ya + yb) >= 0 ? o.area.colorPos : o.area.colorNeg; ctx.fill();
        }
      }
    }

    for (const c of (o.curvas || [])) {
      if (!c.puntos || !c.puntos.length) continue;
      ctx.save();
      if (c.hasta !== undefined) { ctx.beginPath(); ctx.rect(G.x0 - 2, 0, G.X(c.hasta) - G.x0 + 2, h); ctx.clip(); }
      ctx.globalAlpha = c.alfa === undefined ? 1 : c.alfa;
      ctx.setLineDash(c.raya || []);
      ctx.strokeStyle = c.color || info.color; ctx.lineWidth = c.ancho || (mini ? 2.5 : 3);
      ctx.beginPath();
      c.puntos.forEach((p, i) => { if (i === 0) ctx.moveTo(G.X(p[0]), G.Y(p[1])); else ctx.lineTo(G.X(p[0]), G.Y(p[1])); });
      ctx.stroke();
      ctx.restore();
    }

    // Tangente en el instante actual
    if (o.tangente) {
      const g = o.tangente, d = tMax * 0.16;
      ctx.setLineDash([7, 4]); ctx.strokeStyle = g.color; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(G.X(g.t - d), G.Y(g.y - g.m * d)); ctx.lineTo(G.X(g.t + d), G.Y(g.y + g.m * d)); ctx.stroke();
      ctx.setLineDash([]);
    }
    // Barras arrastrables (velocidad constante por tramo)
    if (o.niveles) {
      for (const n of o.niveles) {
        ctx.strokeStyle = n.mal ? COL.ace : n.bien ? COL.vel : info.color; ctx.lineWidth = 4;
        ctx.beginPath(); ctx.moveTo(G.X(n.t0), G.Y(n.y)); ctx.lineTo(G.X(n.t1), G.Y(n.y)); ctx.stroke();
      }
    }
    ctx.restore();

    // Rótulos de la pendiente y del área: en el margen superior, a la derecha (el de más abajo comparte línea con el título del eje)
    const rotulos = [];
    if (o.tangente && o.tangente.texto) rotulos.push([o.tangente.texto, o.tangente.color]);
    if (o.area && o.area.texto) rotulos.push([o.area.texto, o.area.colorTexto]);
    rotulos.forEach((rt, i) => textoRico(ctx, rt[0], w - 4, G.y0 - 9 - 17 * (rotulos.length - 1 - i), 13, rt[1], 'right', true));

    // Cursor del instante
    if (o.cursor) {
      const xt = G.X(o.cursor.t);
      ctx.save();
      ctx.setLineDash([4, 3]); ctx.strokeStyle = COL.azulOsc; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.moveTo(xt, G.y0 - 2); ctx.lineTo(xt, G.y1); ctx.stroke();
      ctx.restore();
      if (o.cursor.y !== undefined) {
        ctx.fillStyle = info.color; ctx.strokeStyle = '#FFF'; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.arc(xt, G.Y(o.cursor.y), 5.5, 0, 2 * Math.PI); ctx.fill(); ctx.stroke();
      }
    }
    // Puntos con letra
    for (const m of (o.marcas || [])) {
      const x = G.X(m.t), y = G.Y(m.y);
      ctx.fillStyle = COL.tinta; ctx.strokeStyle = '#FFF'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(x, y, 5, 0, 2 * Math.PI); ctx.fill(); ctx.stroke();
      const arriba = y - 16 > G.y0;
      pildora(ctx, [[m.nombre, false]], x + 14, arriba ? y - 14 : y + 16, 13, COL.tinta, '#FFF', COL.tinta, G.x0 + 2, G.x1);
    }
    // Puntos arrastrables
    for (const n of (o.nodos || [])) {
      const x = G.X(n.t), y = G.Y(n.y);
      ctx.beginPath(); ctx.arc(x, y, 7, 0, 2 * Math.PI);
      ctx.fillStyle = '#FFF'; ctx.fill();
      ctx.lineWidth = 3; ctx.strokeStyle = n.mal ? COL.ace : n.bien ? COL.vel : info.color; ctx.stroke();
    }
    if (o.niveles) {
      for (const n of o.niveles) {
        const x = (G.X(n.t0) + G.X(n.t1)) / 2, y = G.Y(n.y);
        ctx.beginPath(); ctx.arc(x, y, 7, 0, 2 * Math.PI);
        ctx.fillStyle = '#FFF'; ctx.fill();
        ctx.lineWidth = 3; ctx.strokeStyle = n.mal ? COL.ace : n.bien ? COL.vel : info.color; ctx.stroke();
      }
    }
    if (o.vacio) {
      ctx.fillStyle = 'rgba(255,255,255,0.9)'; ctx.fillRect(G.x0 + 1, G.y0, G.x1 - G.x0 - 1, G.y1 - G.y0);
      ctx.font = `15px ${LETRA}`; ctx.fillStyle = COL.suave; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      const lineas = o.vacio.split('\n');
      lineas.forEach((l, i) => ctx.fillText(l, (G.x0 + G.x1) / 2, (G.y0 + G.y1) / 2 + (i - (lineas.length - 1) / 2) * 20));
    }
    return G;
  }

  window.A1Dibujo = { COL, MAG, LETRAS, QUIETO, fmt, ejeAuto, muestrear, maxAbsPuntos, crearEscena, dibujarGrafica, geometria };
})();
