/* Simulación A.1 · Ecuaciones del movimiento y caída libre — escena de laboratorio.
   Soporte con regla vertical, electroimán que suelta la bola (caída) o lanzador vertical (subida),
   puerta fotoeléctrica con cable e interfaz, y bola de acero. Arriba es positivo.
   Aquí no hay física: las posiciones y velocidades llegan de comun/proyectil.js.
   El punto que se sigue es la base de la bola: la mesa está en y = 0. */

(function () {
  'use strict';
  const { numero } = window.Cinematica;
  const Gr = window.Graficas;
  const { COL, LETRA, QUIETO, prepararLienzo, textoRico, rectRedondo, pildora, flecha, fmt } = Gr;
  const MET = { claro: '#E4E9EF', brillo: '#F6F8FA', medio: '#8A97A6', oscuro: '#5A6B7D', pizarra: '#2F3E4E' };
  const VISTAS = [1.0, 1.5, 2.0, 2.5];          // alturas de la vista (m): se elige la menor en la que cabe todo

  function crearEscena(cv) {
    const retro = { x: 0, v: 0, disparo: -1 };            // retroceso del lanzador (decorativo)
    const cable = { y: null, v: 0 };                      // comba del cable de la puerta (decorativo)
    let ultimoT = null, pendiente = false, ultimaE = null;

    /* E = { modo: 'caida' | 'subida', p, h0, t, jugando, disparo,
             ver: { velocidad, aceleracion, huellas, puerta }, yPuerta, cruces: [t…], vista: altura máxima que hay que ver } */
    function dibujar(E) {
      ultimaE = E;
      const lienzo = prepararLienzo(cv);
      if (lienzo.w < 60 || lienzo.h < 60) return;
      const ctx = lienzo.ctx, w = lienzo.w, h = lienzo.h;
      const mArr = 34, mAba = 22;
      let alto = VISTAS[VISTAS.length - 1];
      for (const a of VISTAS) if (a >= E.vista) { alto = a; break; }
      const esc = (h - mArr - mAba) / alto;
      const k = Math.max(0.8, Math.min(1.5, Math.min(w / 300, esc / 150)));
      const Y0 = h - mAba, Y = (y) => Y0 - y * esc;
      const xr = Math.max(46, w * 0.2), xb = Math.max(xr + 62 * k, w * 0.46);     // varilla y línea de la bola
      const ahora = performance.now();
      const dt = ultimoT === null ? 0 : Math.min(0.05, (ahora - ultimoT) / 1000);
      ultimoT = ahora;
      const linea = (x1, y1, x2, y2) => { ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke(); };
      ctx.lineJoin = 'round';

      const p = E.p, t = Math.min(E.t, p.duracion), y = p.y(t), v = p.vy(t);
      const rBola = 6.5 * k, cyBola = Y(y) - rBola;

      // ----- Varilla del soporte con escala -----
      const tope = alto + 0.02;
      ctx.strokeStyle = COL.tinta; ctx.lineWidth = 1.2;
      ctx.beginPath(); ctx.moveTo(xr - 22 * k, Y0); ctx.lineTo(xr - 14 * k, Y0 - 7 * k); ctx.lineTo(xr + 14 * k, Y0 - 7 * k); ctx.lineTo(xr + 22 * k, Y0); ctx.closePath();
      ctx.fillStyle = MET.oscuro; ctx.fill(); ctx.stroke();
      ctx.fillStyle = MET.claro; ctx.fillRect(xr - 4 * k, Y(tope), 8 * k, Y0 - 7 * k - Y(tope)); ctx.strokeRect(xr - 4 * k, Y(tope), 8 * k, Y0 - 7 * k - Y(tope));
      for (let i = 1; i <= Math.floor(alto * 10 + 1e-9); i++) {
        const ym = i / 10;
        ctx.strokeStyle = MET.oscuro; ctx.lineWidth = 1;
        linea(xr - 4 * k, Y(ym), xr - 4 * k + (i % 5 === 0 ? 8 * k : 4 * k), Y(ym));
        if (i % 5 === 0) { ctx.font = `12px ${LETRA}`; ctx.fillStyle = COL.suave; ctx.textAlign = 'right'; ctx.textBaseline = 'middle'; ctx.fillText(fmt(ym), xr - 8 * k, Y(ym)); }
      }
      ctx.font = `700 12px ${LETRA}`; ctx.fillStyle = COL.azulOsc; ctx.textAlign = 'right'; ctx.textBaseline = 'middle'; ctx.fillText('0', xr - 24 * k, Y0 - 5);
      textoRico(ctx, [['y', true], [' / m', false]], xr - 8 * k, Y(tope) - 9, 12, COL.suave, 'right');

      // brazo con abrazadera, de la varilla hasta un punto
      const brazo = (yb, hasta) => {
        ctx.strokeStyle = COL.tinta; ctx.lineWidth = 5 * k; ctx.lineCap = 'round'; linea(xr, yb, hasta, yb);
        ctx.strokeStyle = MET.medio; ctx.lineWidth = 3 * k; linea(xr, yb, hasta, yb); ctx.lineCap = 'butt';
        ctx.fillStyle = MET.pizarra; ctx.strokeStyle = COL.tinta; ctx.lineWidth = 1.2;
        rectRedondo(ctx, xr - 7 * k, yb - 7 * k, 14 * k, 14 * k, 3); ctx.fill(); ctx.stroke();
      };

      // ----- Puerta fotoeléctrica, cable e interfaz -----
      const ix1 = w - 8, ix0 = Math.max(xb + 46 * k, ix1 - 92), iy0 = Y0 - 46;
      if (E.ver.puerta) {
        const yp = Y(E.yPuerta), xg = xb + 24 * k;
        brazo(yp + 13 * k, xb - 20 * k);
        ctx.strokeStyle = COL.tinta; ctx.lineWidth = 3 * k; linea(xb - 22 * k, yp + 13 * k, xg + 3 * k, yp + 13 * k);
        ctx.lineWidth = 1.2; ctx.fillStyle = MET.pizarra;
        for (const x of [xb - 24 * k, xg - 2 * k]) { rectRedondo(ctx, x - 3 * k, yp - 7 * k, 8 * k, 21 * k, 2); ctx.fill(); ctx.stroke(); }
        // haz de luz
        const cortado = Math.abs(y - E.yPuerta) * esc < 2.5 && t > 0 && t < p.duracion;
        ctx.save(); ctx.setLineDash([3, 3]); ctx.strokeStyle = cortado ? COL.gris : COL.ace; ctx.lineWidth = 1.4; linea(xb - 19 * k, yp, xg - 5 * k, yp); ctx.restore();
        ctx.beginPath(); ctx.arc(xg + 1 * k, yp + 9 * k, 1.8, 0, 2 * Math.PI); ctx.fillStyle = cortado ? '#4FD08A' : MET.medio; ctx.fill();
        // cable con comba: resorte amortiguado que sigue a la puerta cuando se mueve
        const objetivo = Math.min(Y0 - 8, Math.max(yp, iy0) + 30 * k);
        if (cable.y === null || QUIETO) { cable.y = objetivo; cable.v = 0; }
        else for (let i = 0; i < 4; i++) { const acc = 120 * (objetivo - cable.y) - 9 * cable.v; cable.v += acc * dt / 4; cable.y += cable.v * dt / 4; }
        ctx.strokeStyle = COL.tinta; ctx.lineWidth = 2.2; ctx.lineCap = 'round';
        ctx.beginPath(); ctx.moveTo(xg + 6 * k, yp + 4 * k); ctx.quadraticCurveTo((xg + ix0) / 2 + 6, cable.y + 14 * k, ix0 + 6, iy0 + 12); ctx.stroke(); ctx.lineCap = 'butt';
        // interfaz con los tiempos de paso
        ctx.lineWidth = 1.2; rectRedondo(ctx, ix0, iy0, ix1 - ix0, 46, 4); ctx.fillStyle = MET.pizarra; ctx.fill(); ctx.strokeStyle = COL.tinta; ctx.stroke();
        ctx.fillStyle = '#E8F1F8'; ctx.fillRect(ix0 + 5, iy0 + 5, ix1 - ix0 - 10, 30);
        ctx.fillStyle = MET.medio; for (const bx of [ix0 + 12, ix0 + 22, ix0 + 32]) { ctx.beginPath(); ctx.arc(bx, iy0 + 40.5, 1.6, 0, 2 * Math.PI); ctx.fill(); }
        const pasados = (E.cruces || []).filter(tc => E.t >= tc - 1e-9);
        ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
        if (!E.cruces || !E.cruces.length) { ctx.font = `11px ${LETRA}`; ctx.fillStyle = COL.suave; ctx.fillText('la bola no pasa', ix0 + 8, iy0 + 20); }
        else if (!pasados.length) { ctx.font = `700 13px ${LETRA}`; ctx.fillStyle = COL.suave; ctx.fillText('– – –  s', ix0 + 9, iy0 + 20); }
        else pasados.slice(0, 2).forEach((tc, i) => {
          const yy = iy0 + (pasados.length > 1 ? 13 + 14 * i : 20);
          textoRico(ctx, [['t', true], [E.cruces.length > 1 ? String(i + 1) : '', false, true], [' = ' + numero(tc, 3) + ' s', false]], ix0 + 8, yy, 12.5, COL.azulOsc, 'left', true);
        });
        if (w > 330) pildora(ctx, [['puerta en ', false], ['y', true], [' = ' + numero(E.yPuerta, 2) + ' m', false]], xg + 62 * k, yp - 12 * k, 12, COL.azul, COL.azulFondo, COL.azulOsc, xg + 8 * k, w - 4);
      }

      // ----- Electroimán (caída) o lanzador vertical (subida) -----
      const yS = Y(E.h0);                               // nivel de salida
      if (E.disparo !== retro.disparo) { if (retro.disparo !== -1) retro.v = 240; retro.disparo = E.disparo; }
      if (QUIETO) { retro.x = 0; retro.v = 0; }
      else for (let i = 0; i < 4; i++) { const acc = -900 * retro.x - 34 * retro.v; retro.v += acc * dt / 4; retro.x += retro.v * dt / 4; }
      if (E.modo === 'caida') {
        const yi = yS - 2 * rBola;                      // el imán toca la bola por arriba
        brazo(yi - 7 * k, xb);
        ctx.lineWidth = 1.2; ctx.strokeStyle = COL.tinta;
        rectRedondo(ctx, xb - 10 * k, yi - 15 * k, 20 * k, 15 * k, 3); ctx.fillStyle = MET.pizarra; ctx.fill(); ctx.stroke();
        ctx.fillStyle = '#E2B045'; ctx.fillRect(xb - 10 * k + 1, yi - 6 * k, 20 * k - 2, 3 * k);
        ctx.beginPath(); ctx.arc(xb + 6 * k, yi - 11 * k, 1.8, 0, 2 * Math.PI); ctx.fillStyle = E.t <= 0 ? '#4FD08A' : MET.medio; ctx.fill();
        ctx.font = `12px ${LETRA}`; ctx.fillStyle = COL.suave; ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
        if (w > 300) ctx.fillText('electroimán', xb + 15 * k, yi - 9 * k);
      } else {
        const largo = Math.max(6 * k, Math.min(40 * k, Y0 - yS - 2)), desp = retro.x * k * 0.1;
        if (Y0 - yS > 26 * k) brazo(yS + largo * 0.6, xb - 9 * k);
        ctx.lineWidth = 1.5; ctx.strokeStyle = COL.tinta;
        rectRedondo(ctx, xb - 9 * k, yS + desp, 18 * k, largo, 3); ctx.fillStyle = '#B5CFEC'; ctx.fill();
        ctx.save(); ctx.clip(); ctx.fillStyle = COL.azul; ctx.fillRect(xb - 9 * k, yS + desp + largo - 6 * k, 18 * k, 6 * k); ctx.restore();
        ctx.stroke();
        ctx.fillStyle = MET.pizarra; ctx.fillRect(xb - 11 * k, yS + desp, 22 * k, 4 * k); ctx.lineWidth = 1.2; ctx.strokeRect(xb - 11 * k, yS + desp, 22 * k, 4 * k);
      }

      // ----- Mesa de laboratorio -----
      ctx.fillStyle = '#EFE8DC'; ctx.fillRect(0, Y0, w, 3);
      ctx.fillStyle = '#D3AC84'; ctx.fillRect(0, Y0 + 3, w, 5);

      // ----- Nivel de salida y desplazamiento -----
      ctx.save(); ctx.setLineDash([4, 3]); ctx.strokeStyle = COL.azul; ctx.lineWidth = 1.3; linea(xb - 34 * k, yS, xb + 46 * k, yS); ctx.restore();
      const s = y - E.h0, xs = xb + 36 * k;
      if (Math.abs(s) * esc > 4) flecha(ctx, xs, yS, xs, Y(y), COL.des, 3, Math.min(11, Math.abs(s) * esc));
      if (E.t > 0 || E.jugando) {
        const yRot = Math.abs(s) * esc > 30 ? (yS + Y(y)) / 2 : (s <= 0 ? Math.max(yS, Y(y)) + 13 : Y(y) - 13);
        pildora(ctx, [['s', true], [' = ' + numero(s, 2) + ' m', false]], xs + 44 * k, yRot, 12, COL.des, COL.desFondo, COL.des, xs + 6, w - 4);
      }

      // ----- Huellas cada 0,1 s -----
      const dibBola = (yy, relleno, alfa) => {
        ctx.globalAlpha = alfa === undefined ? 1 : alfa;
        ctx.beginPath(); ctx.arc(xb, Y(yy) - rBola, rBola, 0, 2 * Math.PI);
        ctx.fillStyle = relleno; ctx.fill(); ctx.lineWidth = 1.4; ctx.strokeStyle = COL.tinta; ctx.stroke();
        ctx.beginPath(); ctx.arc(xb - rBola * 0.3, Y(yy) - rBola * 1.3, rBola * 0.25, 0, 2 * Math.PI); ctx.fillStyle = 'rgba(255,255,255,0.8)'; ctx.fill();
        ctx.globalAlpha = 1;
      };
      if (E.ver.huellas) {
        for (let i = 0; i * 0.1 <= t + 1e-9; i++) {
          const ya = p.y(i * 0.1);
          if (i > 0 || t > 0.02) dibBola(ya, '#EEF1F5', 0.6);
          // distancia recorrida en cada décima de segundo (solo en la caída, donde no se pisan)
          if (E.modo === 'caida' && (i + 1) * 0.1 <= t + 1e-9) {
            const yb = p.y((i + 1) * 0.1), sep = (ya - yb) * esc;
            if (sep >= 8) { ctx.font = `11px ${LETRA}`; ctx.fillStyle = COL.suave; ctx.textAlign = 'right'; ctx.textBaseline = 'middle'; ctx.fillText(numero(ya - yb, 2) + ' m', xb - 13 * k, (Y(ya) + Y(yb)) / 2 - rBola); }
          }
        }
      }
      dibBola(y, '#C9D3DF');

      // ----- Vectores: velocidad (verde, a la izquierda) y aceleración (roja, a la derecha) -----
      const enVuelo = E.t < p.duracion - 1e-9;
      const letra = (txt, x, yy, color) => { ctx.font = `italic 700 14px ${LETRA}`; ctx.fillStyle = color; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(txt, x, yy); };
      if (E.ver.velocidad && enVuelo && Math.abs(v) > 0.02) {
        const L = v * 0.055 * esc, xv = xb - 15 * k;
        flecha(ctx, xv, cyBola, xv, cyBola - L, COL.vel, 3.5, 11); letra('v', xv - 10, cyBola - L * 0.6, COL.vel);
      }
      if (E.ver.aceleracion && enVuelo) {
        const L = 9.81 * 0.022 * esc, xa = xb + 15 * k;
        flecha(ctx, xa, cyBola, xa, cyBola + L, COL.ace, 3.5, 11); letra('a', xa + 10, cyBola + L * 0.6, COL.ace);
      }

      pildora(ctx, [['arriba +', false]], 40, 14, 12, COL.azul, COL.azulFondo, COL.azulOsc);

      // seguir dibujando mientras lo decorativo no se haya asentado
      const obj = E.ver.puerta ? Math.min(Y0 - 8, Math.max(Y(E.yPuerta), iy0) + 30 * k) : cable.y;
      const inquieto = Math.abs(retro.x) > 0.05 || Math.abs(retro.v) > 0.5 || (cable.y !== null && (Math.abs(obj - cable.y) > 0.3 || Math.abs(cable.v) > 2));
      if (!E.jugando && inquieto && !pendiente) {
        pendiente = true;
        requestAnimationFrame(() => { pendiente = false; if (ultimaE && cv.offsetParent !== null) dibujar(ultimaE); });
      }
    }
    return { dibujar };
  }

  window.CaidaEscena = { crearEscena };
})();
