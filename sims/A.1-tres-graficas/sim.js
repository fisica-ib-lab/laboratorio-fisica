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

  // ---------- Escena: pista, regla y carrito ----------
  function dibujarEscena() {
    const cv = $('escena');
    const { ctx, w, h } = prepararLienzo(cv);
    const { min, max } = nivel.pista;
    const margen = 24;
    const X = (s) => margen + (s - min) / (max - min) * (w - 2 * margen);
    const pxm = (w - 2 * margen) / (max - min);
    const yPista = h - 70;

    // Indicador de sentido positivo
    pildora(ctx, [['derecha +', false]], margen + 44, 18, 13, COL.azul, COL.azulFondo, COL.azulOsc);
    flecha(ctx, margen + 92, 18, margen + 132, 18, COL.azul, 2.5, 10);

    // Pista
    ctx.strokeStyle = COL.tinta; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(X(min) - 6, yPista); ctx.lineTo(X(max) + 6, yPista); ctx.stroke();
    // Topes
    ctx.fillStyle = '#B8C3CF';
    ctx.fillRect(X(min) - 10, yPista - 16, 5, 16);
    ctx.fillRect(X(max) + 5, yPista - 16, 5, 16);

    // Regla
    const pasoEtiqueta = pxm >= 13 ? 5 : 10;
    ctx.strokeStyle = COL.gris; ctx.lineWidth = 1;
    for (let s = min; s <= max; s++) {
      const largo = s === 0 ? 12 : s % 5 === 0 ? 8 : 4;
      if (pxm < 6 && s % 5 !== 0) continue;
      ctx.beginPath(); ctx.moveTo(X(s), yPista); ctx.lineTo(X(s), yPista + largo); ctx.stroke();
    }
    for (let s = min; s <= max; s += pasoEtiqueta) {
      const cero = s === 0;
      ctx.font = `${cero ? '700 ' : ''}13px ${LETRA}`;
      ctx.fillStyle = cero ? COL.azulOsc : COL.suave;
      ctx.textAlign = 'center'; ctx.textBaseline = 'top';
      ctx.fillText(s < 0 ? MENOS + Math.abs(s) : String(s), X(s), yPista + 14);
    }
    textoRico(ctx, [['s', true], [' / m', false]], X(max) + 4, yPista + 38, 13, COL.suave, 'right');

    const s = estado.mov.s(estado.t);
    const v = estado.mov.v(estado.t);
    const a = estado.mov.a(estado.t);
    const s0 = estado.mov.s0;

    // Posición inicial (marca discontinua)
    ctx.save();
    ctx.setLineDash([4, 3]); ctx.strokeStyle = COL.pos; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(X(s0), yPista - 30); ctx.lineTo(X(s0), yPista + 10);
    ctx.moveTo(X(s0), yPista + 32); ctx.lineTo(X(s0), yPista + 58); ctx.stroke();
    ctx.restore();
    textoRico(ctx, [['s', true], ['₀', false]], X(s0) - 4, yPista - 36, 13, COL.pos, 'right', true);

    // Desplazamiento (naranja), desde s0 hasta s
    const yDes = yPista + 52;
    if (Math.abs(X(s) - X(s0)) > 3) {
      flecha(ctx, X(s0), yDes, X(s), yDes, COL.des, 3, Math.min(11, Math.abs(X(s) - X(s0))));
      ctx.font = `700 12px ${LETRA}`;
      ctx.fillStyle = COL.des; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      const xm = (X(s0) + X(s)) / 2;
      const etiqueta = 'desplazamiento';
      const ancho = ctx.measureText(etiqueta).width;
      if (Math.abs(X(s) - X(s0)) > ancho + 16) {
        ctx.fillStyle = '#FFF'; ctx.fillRect(xm - ancho / 2 - 3, yDes - 7, ancho + 6, 14);
        ctx.fillStyle = COL.des; ctx.fillText(etiqueta, xm, yDes);
      }
    }

    // Carrito (el punto de referencia es su centro)
    const xc = X(s), anchoC = 58, altoC = 24, rRueda = 7;
    const yBase = yPista - 2 * rRueda + 2;
    rectRedondo(ctx, xc - anchoC / 2, yBase - altoC, anchoC, altoC, 5);
    ctx.fillStyle = COL.azulFondo; ctx.fill();
    ctx.strokeStyle = COL.azul; ctx.lineWidth = 2; ctx.stroke();
    ctx.fillStyle = COL.tinta;
    for (const dx of [-17, 17]) { ctx.beginPath(); ctx.arc(xc + dx, yPista - rRueda, rRueda, 0, 2 * Math.PI); ctx.fill(); }
    // marca del centro sobre la regla
    ctx.fillStyle = COL.azulOsc;
    ctx.beginPath(); ctx.moveTo(xc, yPista + 1); ctx.lineTo(xc - 5, yPista + 9); ctx.lineTo(xc + 5, yPista + 9); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = COL.azulOsc; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(xc, yBase - altoC + 4); ctx.lineTo(xc, yBase - 2); ctx.stroke();

    // Flecha de velocidad (verde) a escala: 30 px por cada m s⁻¹
    const yV = yBase - altoC - 16;
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
