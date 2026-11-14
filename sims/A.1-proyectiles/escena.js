/* Simulación A.1 · Movimiento de proyectiles — escena de laboratorio.
   Mesa, soporte con regla vertical, lanzador con transportador, regla horizontal, bola de acero y bandeja de arena.
   Aquí no hay física: las posiciones y velocidades llegan de comun/proyectil.js.
   La escala es la misma en horizontal y en vertical, para que las trayectorias y los ángulos sean reales.
   El punto que se sigue es la base de la bola: sale de (0, h) y llega a la mesa en y = 0. */

(function () {
  'use strict';
  const { numero } = window.Cinematica;
  const Gr = window.Graficas;
  const { COL, LETRA, MENOS, QUIETO, prepararLienzo, medirRico, textoRico, rectRedondo, pildora, flecha, fmt } = Gr;
  const MET = { claro: '#E4E9EF', brillo: '#F6F8FA', medio: '#8A97A6', oscuro: '#5A6B7D', pizarra: '#2F3E4E' };
  const MUNDO = { xmin: -0.42, xmax: 3.6, ymax: 2.45 };
  const VISTAS = [1.0, 1.5, 2.0, 2.5, 3.0, 3.6];      // anchos de la vista (m): se elige el menor en el que cabe todo
  const COMP = { x: COL.des, y: COL.violeta };       // componente horizontal naranja, vertical violeta

  function crearEscena(cv) {
    const retro = { x: 0, v: 0, ultimo: null, disparo: -1 };
    let pendiente = false, ultimaE = null, geo = null;

    /* E = { h, angulo, bolas: [{ p, etiqueta, color, relleno, raya }], t, jugando, disparo (contador),
             ver: { componentes, huellas, aceleracion }, gemela: Proyectil (bola soltada), fantasmas: [{ puntos, rotulo }],
             cotas, blanco: { x, acierto }, marcas: [{ x, n, actual }], bandeja: { x }, sinVectores,
             vista: { x, y }  lo más lejos y lo más alto que hay que ver (m) } */
    function dibujar(E) {
      ultimaE = E;
      const lienzo = prepararLienzo(cv);
      if (lienzo.w < 40 || lienzo.h < 40) return;
      const ctx = lienzo.ctx, w = lienzo.w, h = lienzo.h;
      const mIzq = 8, mDer = 14, mArr = 30, mAba = 46;
      // Vista: la menor de la lista en la que caben el alcance y la altura pedidos (misma escala en x y en y)
      const pide = E.vista || { x: MUNDO.xmax, y: MUNDO.ymax };
      let esc = 0;
      for (const xm of VISTAS) {
        esc = (w - mIzq - mDer) / (xm - MUNDO.xmin);
        if (xm >= pide.x && (h - mArr - mAba) / esc >= pide.y) break;
      }
      esc = Math.min(esc, (h - mArr - mAba) / Math.min(pide.y, MUNDO.ymax));
      const k = Math.max(0.75, Math.min(1.6, esc / 150));        // tamaño de los objetos
      const X0 = mIzq + (-MUNDO.xmin) * esc, Y0 = h - mAba;
      const X = (x) => X0 + x * esc, Y = (y) => Y0 - y * esc;
      geo = { X, Y, esc, X0, Y0, mundo: (px) => (px - X0) / esc };
      const ahora = performance.now();
      const linea = (x1, y1, x2, y2) => { ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke(); };
      ctx.lineJoin = 'round';
      const xFinM = Math.min(MUNDO.xmax, Math.floor((w - mDer - X0) / esc * 10 + 1e-9) / 10), xFin = X(xFinM);

      // ----- Mesa de laboratorio -----
      // el lanzador va sujeto al borde de la mesa: la mesa empieza justo bajo la boca del lanzador
      const xMesa = X(-0.025);
      ctx.fillStyle = '#EFE8DC'; ctx.fillRect(xMesa, Y0, w - xMesa, 3);
      ctx.fillStyle = '#D3AC84'; ctx.fillRect(xMesa, Y0 + 3, w - xMesa, 5);
      ctx.strokeStyle = '#A8845F'; ctx.lineWidth = 1.5; linea(xMesa, Y0, xMesa, Y0 + 8);

      // ----- Regla horizontal sobre la mesa (escala bajo ella) -----
      ctx.fillStyle = MET.claro; ctx.fillRect(X(0), Y0 + 10, xFin - X(0), 9);
      ctx.strokeStyle = COL.tinta; ctx.lineWidth = 1.1; ctx.strokeRect(X(0), Y0 + 10, xFin - X(0), 9);
      for (let i = 0; i <= Math.round(xFinM * 10); i++) {
        const xm = i / 10, largo = i % 10 === 0 ? 9 : i % 5 === 0 ? 6 : 3;
        ctx.strokeStyle = i === 0 ? COL.azulOsc : MET.oscuro; ctx.lineWidth = i === 0 ? 2 : 1;
        linea(X(xm), Y0 + 10, X(xm), Y0 + 10 + largo);
      }
      ctx.textAlign = 'center'; ctx.textBaseline = 'top';
      const cada = esc >= 210 ? 0.2 : 0.5;
      for (let i = 0; i * cada <= xFinM + 1e-9; i++) {
        const xm = i * cada;
        ctx.font = `${i === 0 ? '700 ' : ''}13px ${LETRA}`; ctx.fillStyle = i === 0 ? COL.azulOsc : COL.suave;
        if (X(xm) < w - 46) ctx.fillText(fmt(xm), X(xm), Y0 + 22);
      }
      textoRico(ctx, [['x', true], [' / m', false]], w - 4, Y0 + 29, 13, COL.suave, 'right');

      // ----- Soporte con regla vertical -----
      const xr = X(-0.26), altoVar = Math.max(E.h + 0.3, 0.55);
      ctx.strokeStyle = COL.tinta; ctx.lineWidth = 1.2;
      // la varilla se apoya en el suelo, por debajo de la mesa; su escala mide desde la altura de la mesa
      ctx.fillStyle = MET.claro; ctx.fillRect(xr - 3.5 * k, Y(altoVar), 7 * k, h + 4 - Y(altoVar)); ctx.strokeRect(xr - 3.5 * k, Y(altoVar), 7 * k, h + 4 - Y(altoVar));
      ctx.strokeStyle = COL.azulOsc; ctx.lineWidth = 2; linea(xr - 3.5 * k, Y0, xr + 3.5 * k, Y0);
      ctx.font = `700 12px ${LETRA}`; ctx.fillStyle = COL.azulOsc; ctx.textAlign = 'right'; ctx.textBaseline = 'middle'; ctx.fillText('0', xr - 7 * k, Y0);
      for (let i = 1; i <= Math.floor(altoVar * 10 + 1e-9); i++) {
        const ym = i / 10;
        ctx.strokeStyle = MET.oscuro; ctx.lineWidth = 1;
        linea(xr - 3.5 * k, Y(ym), xr - 3.5 * k + (i % 5 === 0 ? 7 * k : 3.5 * k), Y(ym));
        if (i % 5 === 0) { ctx.font = `12px ${LETRA}`; ctx.fillStyle = COL.suave; ctx.textAlign = 'right'; ctx.textBaseline = 'middle'; ctx.fillText(fmt(ym), xr - 7 * k, Y(ym)); }
      }
      // rótulo del eje vertical
      textoRico(ctx, [['y', true], [' / m', false]], Math.max(4, xr - 26 * k), Y(altoVar) - 9, 12, COL.suave, 'left');

      // ----- Lanzador (retroceso decorativo con resorte amortiguado) -----
      if (E.disparo !== undefined && E.disparo !== retro.disparo) { if (retro.disparo !== -1) retro.v = -260; retro.disparo = E.disparo; }
      const dt = retro.ultimo === null ? 0 : Math.min(0.05, (ahora - retro.ultimo) / 1000);
      retro.ultimo = ahora;
      if (QUIETO) { retro.x = 0; retro.v = 0; }
      else for (let i = 0; i < 4; i++) { const acc = -900 * retro.x - 34 * retro.v; retro.v += acc * dt / 4; retro.x += retro.v * dt / 4; }
      const th = E.angulo * Math.PI / 180, cx = Math.cos(th), sy = Math.sin(th);
      const rBola = 6.5 * k, bx = X(0), by = Y(E.h) - rBola;         // centro de la bola en la boca del lanzador
      const largoC = 46 * k, anchoC = 17 * k;
      // brazo de la abrazadera, del soporte al lanzador
      const px = bx - cx * largoC * 0.62, py = by + sy * largoC * 0.62;
      ctx.strokeStyle = COL.tinta; ctx.lineWidth = 5 * k; ctx.lineCap = 'round'; linea(xr, py, px, py);
      ctx.strokeStyle = MET.medio; ctx.lineWidth = 3 * k; linea(xr, py, px, py); ctx.lineCap = 'butt';
      ctx.fillStyle = MET.pizarra; ctx.strokeStyle = COL.tinta; ctx.lineWidth = 1.2;
      rectRedondo(ctx, xr - 7 * k, py - 7 * k, 14 * k, 14 * k, 3); ctx.fill(); ctx.stroke();
      // cañón
      ctx.save();
      ctx.translate(bx, by); ctx.rotate(-th); ctx.translate(retro.x * k * 0.1, 0);
      rectRedondo(ctx, -largoC - rBola, -anchoC / 2, largoC, anchoC, 4); ctx.fillStyle = '#B5CFEC'; ctx.fill();
      ctx.save(); ctx.clip(); ctx.fillStyle = COL.azul; ctx.fillRect(-largoC - rBola, -anchoC / 2, 7 * k, anchoC); ctx.restore();
      ctx.lineWidth = 1.5; ctx.strokeStyle = COL.tinta; ctx.stroke();
      ctx.fillStyle = MET.pizarra; ctx.fillRect(-rBola - 4 * k, -anchoC / 2 - 1.5 * k, 4 * k, anchoC + 3 * k); ctx.strokeRect(-rBola - 4 * k, -anchoC / 2 - 1.5 * k, 4 * k, anchoC + 3 * k);
      ctx.restore();
      // pivote y transportador
      ctx.beginPath(); ctx.arc(px, py, 3.2 * k, 0, 2 * Math.PI); ctx.fillStyle = '#E2B045'; ctx.fill(); ctx.lineWidth = 1; ctx.stroke();
      const principal = E.bolas[0];
      if (!E.sinRotulos) {
        const rA = 34 * k;
        ctx.save(); ctx.setLineDash([4, 3]); ctx.strokeStyle = COL.suave; ctx.lineWidth = 1.2; linea(bx, by, bx + rA + 16 * k, by); ctx.restore();
        if (E.angulo > 0) { ctx.strokeStyle = COL.azul; ctx.lineWidth = 1.6; ctx.beginPath(); ctx.arc(bx, by, rA, -th, 0); ctx.stroke(); }
        // con el lanzador en alto, el rótulo va bajo la línea de referencia para no tapar la trayectoria
        const yTh = E.h > 0.15 ? by + 15 * k : by - Math.min(rA * sy * 0.5, 14 * k) - 2;
        pildora(ctx, [['θ', true], [' = ' + fmt(E.angulo) + '°', false]], bx + rA + 34 * k, yTh, 13, COL.azul, COL.azulFondo, COL.azulOsc);
        if (E.h > 0) pildora(ctx, [['h', true], [' = ' + numero(E.h, 2) + ' m', false]], Math.max(48, xr - 4 * k), Y(E.h / 2), 12, COL.azul, COL.azulFondo, COL.azulOsc, 2, bx - 4);
      }

      // ----- Trayectorias anteriores (gris) -----
      ctx.lineCap = 'round';
      for (const f of (E.fantasmas || [])) {
        ctx.save(); ctx.setLineDash([6, 4]); ctx.strokeStyle = COL.gris; ctx.lineWidth = 2;
        ctx.beginPath(); f.puntos.forEach((p, i) => { const x = X(p[0]), y = Y(p[1]) - rBola; if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y); }); ctx.stroke(); ctx.restore();
        if (f.rotulo) {
          let cima = f.puntos[0]; for (const p of f.puntos) if (p[1] > cima[1]) cima = p;
          ctx.font = `12px ${LETRA}`; ctx.fillStyle = COL.gris; ctx.textAlign = 'center'; ctx.textBaseline = 'bottom';
          ctx.fillText(f.rotulo, X(cima[0]), Y(cima[1]) - rBola - 4);
        }
      }

      // ----- Blanco: bandeja de arena -----
      const bandeja = (xb, acierto, arrastrable) => {
        const a = 0.16 * esc, x0 = X(xb) - a / 2;
        ctx.fillStyle = '#EAD9B0'; ctx.fillRect(x0 + 2, Y0 - 5 * k, a - 4, 5 * k);
        ctx.strokeStyle = acierto ? COL.vel : COL.tinta; ctx.lineWidth = acierto ? 2.5 : 1.5;
        ctx.beginPath(); ctx.moveTo(x0, Y0 - 9 * k); ctx.lineTo(x0, Y0); ctx.lineTo(x0 + a, Y0); ctx.lineTo(x0 + a, Y0 - 9 * k); ctx.stroke();
        ctx.fillStyle = acierto ? COL.vel : COL.azulOsc;
        ctx.beginPath(); ctx.moveTo(X(xb), Y0 + 9); ctx.lineTo(X(xb) - 5, Y0 + 1); ctx.lineTo(X(xb) + 5, Y0 + 1); ctx.closePath(); ctx.fill();
        if (arrastrable) pildora(ctx, [['bandeja en ', false], ['x', true], [' = ' + numero(xb, 2) + ' m', false]], X(xb), Y0 - 26 * k, 13, COL.azul, COL.azulFondo, COL.azulOsc, 60, w - 4);
      };
      if (E.blanco) bandeja(E.blanco.x, E.blanco.acierto, false);
      if (E.bandeja) bandeja(E.bandeja.x, E.bandeja.acierto, true);
      // marcas de los intentos anteriores
      for (const m of (E.marcas || [])) {
        ctx.strokeStyle = m.actual ? COL.ace : COL.gris; ctx.lineWidth = 2;
        linea(X(m.x) - 4, Y0 - 8, X(m.x) + 4, Y0); linea(X(m.x) + 4, Y0 - 8, X(m.x) - 4, Y0);
        ctx.font = `700 11px ${LETRA}`; ctx.fillStyle = m.actual ? COL.ace : COL.gris; ctx.textAlign = 'center'; ctx.textBaseline = 'bottom';
        ctx.fillText(String(m.n), X(m.x), Y0 - 10);
      }

      // ----- Bolas -----
      const t = E.t;
      const dibBola = (x, y, relleno, alfa) => {
        ctx.globalAlpha = alfa === undefined ? 1 : alfa;
        ctx.beginPath(); ctx.arc(X(x), Y(y) - rBola, rBola, 0, 2 * Math.PI);
        ctx.fillStyle = relleno; ctx.fill(); ctx.lineWidth = 1.4; ctx.strokeStyle = COL.tinta; ctx.stroke();
        ctx.beginPath(); ctx.arc(X(x) - rBola * 0.3, Y(y) - rBola * 1.3, rBola * 0.25, 0, 2 * Math.PI); ctx.fillStyle = 'rgba(255,255,255,0.8)'; ctx.fill();
        ctx.globalAlpha = 1;
      };
      // bola soltada a la vez (nivel 1): cae en vertical desde la misma altura
      if (E.gemela) {
        const g = E.gemela, xg = 0;      // sale del mismo punto que la bola lanzada
        if (E.ver && E.ver.huellas) {
          for (let i = 0; i * 0.1 <= t + 1e-9 && i * 0.1 <= g.duracion; i++) {
            const tt = i * 0.1;
            ctx.save(); ctx.setLineDash([3, 3]); ctx.strokeStyle = COL.gris; ctx.lineWidth = 1;
            linea(X(xg), Y(g.y(tt)) - rBola, X(principal.p.x(tt)), Y(principal.p.y(tt)) - rBola); ctx.restore();
            dibBola(xg, g.y(tt), '#F6E3B5', 0.55);
          }
        }
        dibBola(xg, g.y(t), '#F2B84B');
        if (!E.sinRotulos && t < 1e-9) { ctx.font = `12px ${LETRA}`; ctx.fillStyle = COL.suave; ctx.textAlign = 'center'; ctx.textBaseline = 'bottom'; ctx.fillText('una bola se lanza y otra se suelta a la vez', X(xg) + 120 * k, Y(E.h) - 2 * rBola - 26 * k); }
      }
      E.bolas.forEach((b, n) => {
        const p = b.p, tb = Math.min(t, p.duracion);
        // trayectoria recorrida
        ctx.save(); ctx.setLineDash(b.raya || []); ctx.strokeStyle = b.color || COL.azul; ctx.lineWidth = 2.5;
        ctx.beginPath();
        const N = 90;
        for (let i = 0; i <= N; i++) { const tt = tb * i / N, x = X(p.x(tt)), y = Y(p.y(tt)) - rBola; if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y); }
        ctx.stroke(); ctx.restore();
        if (E.ver && E.ver.huellas && n === 0) for (let i = 1; i * 0.1 <= tb + 1e-9; i++) dibBola(p.x(i * 0.1), p.y(i * 0.1), '#EEF1F5', 0.6);
        dibBola(p.x(tb), p.y(tb), b.relleno || '#C9D3DF');
        if (b.etiqueta && t >= p.duracion - 1e-9) {
          ctx.font = `700 12px ${LETRA}`; ctx.fillStyle = b.color || COL.azul; ctx.textAlign = 'center'; ctx.textBaseline = 'bottom';
          ctx.fillText(b.etiqueta, X(p.x(tb)), Y0 - 2 * rBola - 4 - (n === 0 ? 0 : 13));
        }
      });

      // ----- Cotas: alcance y altura máxima (al terminar el vuelo) -----
      const p0 = principal.p, fin = t >= p0.duracion - 1e-9;
      if (E.cotas && fin && t > 0) {
        const R = p0.alcance(), H = p0.alturaMax(), xc = p0.x(p0.tCumbre);
        if (H - 0 > 0.12) {
          ctx.save(); ctx.setLineDash([3, 3]); ctx.strokeStyle = COMP.y; ctx.lineWidth = 1.2; linea(X(xc), Y(H) - rBola, X(xc), Y0); ctx.restore();
          pildora(ctx, [['altura máxima = ' + numero(H, 2) + ' m', false]], X(xc), Y(H) - 2 * rBola - 14, 12, COMP.y, COL.violetaFondo, COMP.y, 70, w - 4);
        }
        if (R > 0.25) {
          const yc = Y0 - 3;
          flecha(ctx, (X(0) + X(R)) / 2, yc, X(R), yc, COMP.x, 2, 8); flecha(ctx, (X(0) + X(R)) / 2, yc, X(0), yc, COMP.x, 2, 8);
          pildora(ctx, [['alcance = ' + numero(R, 2) + ' m', false]], (X(0) + X(R)) / 2, yc - 14, 12, COMP.x, COL.desFondo, COMP.x, 60, w - 4);
        }
      }

      // ----- Vectores sobre la bola principal -----
      if (!E.sinVectores && E.ver && (E.ver.componentes || E.ver.velocidad || E.ver.aceleracion) && !(fin && t > 0)) {
        const tb = Math.min(t, p0.duracion), ox = X(p0.x(tb)), oy = Y(p0.y(tb)) - rBola;
        const kv = 0.105 * esc, vx = p0.vx(tb), vy = p0.vy(tb);
        const sub = (letra, indice, x, y, color) => {
          ctx.font = `italic 700 14px ${LETRA}`; ctx.fillStyle = color; ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
          ctx.fillText(letra, x, y); const a = ctx.measureText(letra).width;
          if (indice) { ctx.font = `italic 700 10px ${LETRA}`; ctx.fillText(indice, x + a, y + 4); }
        };
        if (E.ver.aceleracion) { flecha(ctx, ox, oy, ox, oy + 9.81 * 0.03 * esc, COL.ace, 3.5, 11); sub('g', '', ox - 14, oy + 9.81 * 0.03 * esc - 4, COL.ace); }
        if (E.ver.componentes) {
          ctx.save(); ctx.setLineDash([3, 3]); ctx.lineWidth = 1.1; ctx.strokeStyle = COL.gris;
          linea(ox + vx * kv, oy, ox + vx * kv, oy - vy * kv); linea(ox, oy - vy * kv, ox + vx * kv, oy - vy * kv); ctx.restore();
          if (Math.abs(vx) > 1e-9) { flecha(ctx, ox, oy, ox + vx * kv, oy, COMP.x, 3.5, 11); sub('v', 'x', ox + vx * kv + 4, oy + (vy >= 0 ? 9 : -9), COMP.x); }
          if (Math.abs(vy) > 0.02) { flecha(ctx, ox, oy, ox, oy - vy * kv, COMP.y, 3.5, 11); sub('v', 'y', ox - 17, oy - vy * kv + (vy > 0 ? -5 : 5), COMP.y); }
        }
        if (E.ver.velocidad) { flecha(ctx, ox, oy, ox + vx * kv, oy - vy * kv, COL.vel, 3.5, 11); sub('v', '', ox + vx * kv + 5, oy - vy * kv - (vy >= 0 ? 6 : -6), COL.vel); }
      }

      // sentido positivo
      pildora(ctx, [['derecha + · arriba +', false]], 76, 14, 12, COL.azul, COL.azulFondo, COL.azulOsc);
      if (E.aviso) pildora(ctx, [[E.aviso, false]], w / 2, 14, 13, COL.ambar, COL.ambarFondo, COL.ambar, 160, w - 6);

      // seguir dibujando mientras el retroceso no se haya asentado
      const inquieto = Math.abs(retro.x) > 0.05 || Math.abs(retro.v) > 0.5;
      if (!E.jugando && inquieto && !pendiente) {
        pendiente = true;
        requestAnimationFrame(() => { pendiente = false; if (ultimaE && cv.offsetParent !== null) dibujar(ultimaE); });
      }
    }
    return { dibujar, geometria: () => geo };
  }

  window.ProyEscena = { crearEscena, MUNDO, COMP };
})();
