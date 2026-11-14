/* Simulación A.1 · Movimiento de proyectiles — parte Practicar: ejercicios aleatorios que se corrigen uno a uno, sin puntaje.
   Los ejercicios y su corrección vienen de ejercicios.js; aquí solo está la pantalla. */

(function () {
  'use strict';
  const { numero } = window.Cinematica;
  const { Proyectil } = window.ProyectilFisica;
  const Gr = window.Graficas, Es = window.ProyEscena, E = window.ProyEjercicios;
  const { COL } = Gr;
  const $ = (id) => document.getElementById(id);
  const LETRAS = 'ABCD';
  const UNIDADES = ['m', 's', 'm s⁻¹', 'm s⁻²', '°'];
  const COLOR_AIRE = '#5A6B7D';

  const st = { ej: null, p: null, pAire: null, gemela: null, fin: 1, sel: -1, resuelto: false, bandeja: 1.5,
               t: 0, jugando: false, disparo: 0, ultimoId: null };
  const escena = Es.crearEscena($('pEscena'));
  const azar = E.rngSemilla((Math.random() * 4294967296) >>> 0);

  // ---------- Nuevo ejercicio ----------
  function nuevo() {
    const ids = E.GRUPOS[$('pTipo').value];
    let id; do { id = E.elegir(azar, ids); } while (new Set(ids).size > 1 && id === st.ultimoId);
    poner(E.generar(azar, id));
  }
  function poner(ej) {
    const q = ej.esc;
    Object.assign(st, { ej, sel: -1, resuelto: false, t: 0, jugando: false, ultimoId: ej.id });
    st.p = new Proyectil(q.h, q.v, q.ang);
    st.pAire = q.aire ? new Proyectil(q.h, q.v, q.ang, { k: E.K_AIRE }) : null;
    st.gemela = q.gemela ? new Proyectil(q.h, 0, 0) : null;
    st.fin = Math.max(st.p.duracion, st.pAire ? st.pAire.duracion : 0);
    if (ej.tipo === 'bandeja') { st.bandeja = ej.respuesta > 1.8 ? 1.0 : 2.6; }       // lejos del punto de caída
    $('pEnunciado').innerHTML = `<span class="p-etiqueta">${ej.titulo}</span> ${ej.enunciado}`;
    pintarRespuesta();
    $('pCorreccion').innerHTML = '';
    $('pComprobar').hidden = false; $('pSolucion').hidden = true; $('pSiguiente').hidden = true;
    actualizarBotones();
    dibujar();
  }

  function pintarRespuesta() {
    const ej = st.ej, caja = $('pRespuesta');
    if (ej.tipo === 'grafica' || ej.tipo === 'trayectoria') {
      caja.innerHTML = '<div class="p-opciones graficas4">' + ej.opciones.map((o, i) =>
        `<button type="button" class="opc" data-i="${i}" aria-label="Opción ${LETRAS[i]}"><span class="letra">${LETRAS[i]}</span><canvas></canvas></button>`).join('') + '</div>';
    } else if (ej.tipo === 'texto') {
      caja.innerHTML = '<div class="p-opciones textos">' + ej.opciones.map((o, i) =>
        `<button type="button" class="opc" data-i="${i}"><span class="letra">${LETRAS[i]}</span><span>${o.texto}</span></button>`).join('') + '</div>';
    } else if (ej.tipo === 'numero') {
      caja.innerHTML = `<div class="p-numero"><label for="pNum">Tu respuesta</label>
        <input id="pNum" type="text" inputmode="decimal" autocomplete="off" placeholder="número" aria-label="Número">
        <select id="pUni" aria-label="Unidad"><option value="">unidad…</option>${UNIDADES.map(u => `<option>${u}</option>`).join('')}</select></div>
        <p class="p-ayuda">Usa coma decimal y da el resultado con 3 cifras significativas.</p>`;
      $('pNum').addEventListener('keydown', (e) => { if (e.key === 'Enter') comprobar(); });
    } else {
      caja.innerHTML = `<p class="p-ayuda">Arrastra la bandeja sobre la mesa (se mueve de 0,05 en 0,05 m). Cuando esté en su sitio, pulsa «Comprobar».</p>`;
    }
  }

  // ---------- Dibujo ----------
  function dibujar() {
    if ($('panel-practicar').hidden || !st.ej) return;
    const ej = st.ej, q = ej.esc, p = st.p;
    const bolas = [{ p, etiqueta: st.pAire && st.resuelto ? 'sin aire' : null }];
    if (st.pAire && st.resuelto) bolas.push({ p: st.pAire, etiqueta: 'con aire', color: COLOR_AIRE, relleno: '#E4E9EF', raya: [5, 4] });
    // antes de resolver, la vista no debe delatar dónde cae la bola
    const vista = ej.tipo === 'bandeja' ? { x: 3.6, y: Math.max(p.alturaMax() + 0.3, 1.0) }
      : st.resuelto ? { x: p.alcance() + 0.3, y: Math.max(p.alturaMax() + 0.3, q.h + 0.45, 0.75) }
      : { x: 2.5, y: Math.max(q.h + 0.6, 1.0) };
    const Ev = {
      h: q.h, angulo: q.ang, bolas, t: st.t, jugando: st.jugando, disparo: st.disparo, vista,
      ver: { componentes: st.resuelto, velocidad: false, aceleracion: false, huellas: st.resuelto },
      gemela: st.gemela, cotas: st.resuelto && ej.tipo !== 'bandeja' && !st.gemela
    };
    if (ej.tipo === 'bandeja') Ev.bandeja = { x: st.resuelto ? ej.respuesta : st.bandeja, acierto: st.resuelto };
    escena.dibujar(Ev);

    if (ej.tipo === 'grafica') {
      let lo = 0, hi = 0;
      ej.opciones.forEach(o => o.puntos.forEach(pt => { lo = Math.min(lo, pt[1]); hi = Math.max(hi, pt[1]); }));
      const tope = Math.ceil(Math.max(hi, -lo) / 2) * 2 || 2;
      const eje = { min: lo < 0 ? -tope : 0, max: tope, mayor: tope / 2, menor: tope / 2 };
      const vertical = ej.mag === 'vy';
      document.querySelectorAll('#pRespuesta .opc canvas').forEach((cv, i) => {
        Gr.dibujarGrafica(cv, { eje, hMax: ej.tMax, pasoH: { mayor: ej.tMax / 2, menor: ej.tMax / 2 }, mini: true, sinNumerosH: true,
          rotulo: [['v', true], [vertical ? 'y' : 'x', true, true]], color: vertical ? Es.COMP.y : Es.COMP.x,
          curvas: [{ puntos: ej.opciones[i].puntos }] });
      });
    }
    if (ej.tipo === 'trayectoria') {
      let xm = 0, ym = 0;
      [ej.referencia].concat(ej.opciones.map(o => o.puntos)).forEach(pts => pts.forEach(pt => { xm = Math.max(xm, pt[0]); ym = Math.max(ym, pt[1]); }));
      const hMax = Math.ceil(xm * 2 + 0.2) / 2, tope = Math.ceil(ym * 2 + 0.1) / 2;
      document.querySelectorAll('#pRespuesta .opc canvas').forEach((cv, i) => {
        Gr.dibujarGrafica(cv, { eje: { min: 0, max: tope, mayor: 0.5, menor: 0.5 }, hMax, pasoH: { mayor: 0.5, menor: 0.5 }, mini: true,
          rotulo: [['y', true], [' / m', false]], rotuloH: [['x', true], [' / m', false]], color: COL.azul,
          curvas: [{ puntos: ej.referencia, color: COL.gris, ancho: 2, raya: [5, 4] }, { puntos: ej.opciones[i].puntos }] });
      });
    }
  }

  // ---------- Selección y arrastre de la bandeja ----------
  $('pRespuesta').addEventListener('click', (e) => {
    const b = e.target.closest('.opc'); if (!b || st.resuelto || b.disabled) return;
    st.sel = Number(b.dataset.i);
    document.querySelectorAll('#pRespuesta .opc').forEach((x, i) => x.classList.toggle('elegida', i === st.sel));
  });
  (function () {
    const cv = $('pEscena');
    let abajo = false;
    const mover = (e) => {
      const g = escena.geometria(); if (!g) return;
      const r = cv.getBoundingClientRect();
      let x = Math.round(g.mundo(e.clientX - r.left) / 0.05) * 0.05;
      x = Math.max(0.3, Math.min(3.4, Math.round(x * 100) / 100));
      if (x !== st.bandeja) { st.bandeja = x; dibujar(); }
    };
    cv.addEventListener('pointerdown', (e) => {
      if (!st.ej || st.ej.tipo !== 'bandeja' || st.resuelto) return;
      abajo = true; cv.setPointerCapture(e.pointerId); mover(e);
    });
    cv.addEventListener('pointermove', (e) => { if (abajo) mover(e); });
    const soltar = () => { abajo = false; };
    cv.addEventListener('pointerup', soltar);
    cv.addEventListener('pointercancel', soltar);
  })();

  // ---------- Corrección ----------
  function cajaCorreccion(clase, titulo, html) {
    $('pCorreccion').innerHTML = `<div class="correccion ${clase}"><b>${titulo}</b> ${html || ''}</div>`;
  }
  function leerNumero(txt) {
    const limpio = txt.trim().replace(/−/g, '-').replace(/\s/g, '').replace(',', '.');
    return limpio === '' ? NaN : Number(limpio);
  }
  function terminar(acierto) {
    const ej = st.ej;
    st.resuelto = true;
    const conOpciones = ej.tipo === 'grafica' || ej.tipo === 'texto' || ej.tipo === 'trayectoria';
    if (conOpciones) document.querySelectorAll('#pRespuesta .opc').forEach((b, i) => { b.classList.toggle('bien', !!ej.opciones[i].correcta); b.disabled = true; });
    if (ej.tipo === 'numero') { $('pNum').disabled = true; $('pUni').disabled = true; }
    let sol = '';
    if (!acierto && conOpciones) sol = `La opción correcta es la <b>${LETRAS[ej.opciones.findIndex(o => o.correcta)]}</b>. `;
    if (!acierto && ej.tipo === 'bandeja') sol = 'La bandeja ya está en su sitio. ';
    cajaCorreccion(acierto ? 'bien' : 'solucion', acierto ? 'Correcto.' : 'Solución.', sol + ej.explicacion);
    $('pComprobar').hidden = true; $('pSolucion').hidden = true; $('pSiguiente').hidden = false;
    actualizarBotones();
    lanzar();                       // al resolver, se ve el lanzamiento
  }
  function fallar(pista) {
    cajaCorreccion('pista', 'Todavía no.', pista);
    $('pSolucion').hidden = false;
  }
  function comprobar() {
    const ej = st.ej; if (!ej || st.resuelto) return;
    if (ej.tipo === 'grafica' || ej.tipo === 'texto' || ej.tipo === 'trayectoria') {
      if (st.sel < 0) { cajaCorreccion('pista', '', 'Elige una opción.'); return; }
      const o = ej.opciones[st.sel];
      if (o.correcta) { terminar(true); return; }
      const b = document.querySelectorAll('#pRespuesta .opc')[st.sel];
      b.classList.remove('elegida'); b.classList.add('mal'); b.disabled = true;
      st.sel = -1;
      fallar(o.pista);
    } else if (ej.tipo === 'numero') {
      const x = leerNumero($('pNum').value), u = $('pUni').value;
      if (isFinite(x) && !u) { cajaCorreccion('pista', '', 'Elige la unidad.'); return; }
      const c = E.corregirNumero(ej, x, u);
      if (c.ok) terminar(true); else fallar(c.pista);
    } else {
      const c = E.corregirBandeja(ej, st.bandeja);
      if (c.ok) terminar(true); else fallar(c.pista);
    }
  }
  $('pComprobar').addEventListener('click', comprobar);
  $('pSolucion').addEventListener('click', () => terminar(false));
  $('pSiguiente').addEventListener('click', nuevo);
  $('pNuevo').addEventListener('click', nuevo);
  $('pTipo').addEventListener('change', nuevo);

  // ---------- Ver el lanzamiento (a cámara lenta) ----------
  function actualizarBotones() {
    const puede = st.ej && st.resuelto;
    $('pVer').disabled = !puede;
    $('pVer').title = puede ? '' : 'Disponible cuando resuelvas el ejercicio';
    $('pVerTxt').textContent = st.jugando ? 'Pausar' : (st.t > 0 && st.t >= st.fin - 1e-9 ? 'Ver otra vez' : 'Ver el lanzamiento');
  }
  let ultimo = null;
  function cuadro(ahora) {
    if (!st.jugando) { ultimo = null; return; }
    if (ultimo !== null) {
      st.t = Math.min(st.fin, st.t + (ahora - ultimo) / 1000 * 0.35);
      if (st.t >= st.fin) st.jugando = false;
    }
    ultimo = ahora;
    dibujar(); actualizarBotones();
    if (st.jugando) requestAnimationFrame(cuadro); else ultimo = null;
  }
  function lanzar() {
    if (st.t >= st.fin - 1e-9) st.t = 0;
    if (st.t === 0) st.disparo++;
    st.jugando = true; ultimo = null; requestAnimationFrame(cuadro); actualizarBotones();
  }
  $('pVer').addEventListener('click', () => {
    if (st.jugando) { st.jugando = false; actualizarBotones(); dibujar(); return; }
    lanzar();
  });

  // ---------- Entrar y salir de la pestaña ----------
  window.addEventListener('proy-practicar', (e) => {
    if (e.detail) { if (!st.ej) nuevo(); else dibujar(); }
    else if (st.jugando) { st.jugando = false; actualizarBotones(); }
  });
  new ResizeObserver(() => dibujar()).observe($('panel-practicar'));
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(dibujar);

  // Para las pruebas automáticas
  window.__practicarProy = { st, poner, nuevo, comprobar, geo: () => escena.geometria(), generar: (id, semilla) => E.generar(E.rngSemilla(semilla), id) };
})();
