/* Simulación A.1 — parte Practicar: ejercicios aleatorios que se corrigen uno a uno, sin puntaje.
   Los ejercicios y su corrección vienen de ejercicios.js; aquí solo está la pantalla. */

(function () {
  'use strict';
  const { numero } = window.Cinematica;
  const D = window.A1Dibujo, E = window.A1Ejercicios;
  const { COL } = D;
  const $ = (id) => document.getElementById(id);
  const PISTA = { min: -30, max: 30 };
  const LETRAS = 'ABCD';
  const UNIDADES = ['m', 's', 'm s⁻¹', 'm s⁻²'];

  const st = { ej: null, m: null, pts: null, ejes: null, sel: -1, descartadas: [], resuelto: false, valores: null, mal: null,
               t: 0, jugando: false, ultimoId: null };
  const escena = D.crearEscena($('pEscena'));
  const azar = E.rngSemilla((Math.random() * 4294967296) >>> 0);

  // ---------- Nuevo ejercicio ----------
  function nuevo() {
    const ids = E.GRUPOS[$('pTipo').value];
    let id; do { id = E.elegir(azar, ids); } while (ids.length > 1 && id === st.ultimoId);
    poner(E.generar(azar, id));
  }
  function poner(ej) {
    const m = E.crear(ej.def);
    Object.assign(st, { ej, m, sel: -1, descartadas: [], resuelto: false, t: 0, jugando: false, ultimoId: ej.id,
      valores: ej.tipo === 'dibujar' ? ej.inicial.slice() : null, mal: null });
    st.pts = { s: D.muestrear(m, 's'), v: D.muestrear(m, 'v'), a: D.muestrear(m, 'a') };
    st.ejes = {
      s: D.ejeAuto('s', D.maxAbsPuntos(st.pts.s)),
      v: D.ejeAuto('v', Math.max(D.maxAbsPuntos(st.pts.v), ej.vMax || 1)),
      a: D.ejeAuto('a', D.maxAbsPuntos(st.pts.a))
    };
    $('pEnunciado').innerHTML = `<span class="p-etiqueta">${ej.titulo}</span> ${ej.enunciado}`;
    pintarRespuesta();
    $('pCorreccion').innerHTML = '';
    $('pComprobar').hidden = false; $('pSolucion').hidden = true; $('pSiguiente').hidden = true;
    actualizarBotones();
    dibujar();
  }

  function pintarRespuesta() {
    const ej = st.ej, caja = $('pRespuesta');
    if (ej.tipo === 'grafica') {
      caja.innerHTML = '<div class="p-opciones graficas4">' + ej.opciones.map((o, i) =>
        `<button type="button" class="opc" data-i="${i}" aria-label="Opción ${LETRAS[i]}"><span class="letra">${LETRAS[i]}</span><canvas></canvas></button>`).join('') + '</div>';
    } else if (ej.tipo === 'texto') {
      caja.innerHTML = '<div class="p-opciones textos">' + ej.opciones.map((o, i) =>
        `<button type="button" class="opc" data-i="${i}"><span class="letra">${LETRAS[i]}</span><span>${o.texto}</span></button>`).join('') + '</div>';
    } else if (ej.tipo === 'numero') {
      caja.innerHTML = `<div class="p-numero"><label for="pNum">Tu respuesta</label>
        <input id="pNum" type="text" inputmode="decimal" autocomplete="off" placeholder="número" aria-label="Número">
        <select id="pUni" aria-label="Unidad"><option value="">unidad…</option>${UNIDADES.map(u => `<option>${u}</option>`).join('')}</select></div>
        <p class="p-ayuda">Usa coma decimal. Lee los valores en la gráfica.</p>`;
      $('pNum').addEventListener('keydown', (e) => { if (e.key === 'Enter') comprobar(); });
    } else if (ej.modo === 'niveles') {
      caja.innerHTML = `<div class="grafica p-aux"><canvas id="pAux" aria-label="Gráfica posición–tiempo: objetivo y tu resultado"></canvas></div>
        <p class="p-ayuda"><span class="muestra gris"></span> objetivo &nbsp; <span class="muestra azul"></span> tu movimiento</p>`;
    } else {
      caja.innerHTML = `<p class="p-ayuda">Arrastra los puntos verdes de la gráfica. Cada punto se mueve de 1 en 1 m s⁻¹.</p>`;
    }
  }

  // ---------- Dibujo ----------
  function valorDe(mag, t) { return mag === 's' ? st.m.s(t) : mag === 'v' ? st.m.v(t) : st.m.a(t); }

  function opcionesPrincipal() {
    const ej = st.ej, m = st.m, Tf = m.duracion;
    const conCursor = st.jugando || st.t > 0;
    if (ej.tipo === 'dibujar') {
      const eje = D.ejeAuto('v', ej.vMax);
      const o = { mag: 'v', eje, tMax: Tf, curvas: [] };
      const bien = st.resuelto;
      if (ej.modo === 'nodos') {
        o.curvas.push({ puntos: ej.tiempos.map((t, i) => [t, st.valores[i]]) });
        o.nodos = ej.tiempos.map((t, i) => ({ t, y: st.valores[i], mal: st.mal && st.mal[i], bien }));
        o.tramos = ej.tiempos.slice(1).map((t, i) => ({ t0: ej.tiempos[i], t1: t }));
      } else {
        o.niveles = ej.tramos.map((tr, i) => ({ t0: tr.t0, t1: tr.t1, y: st.valores[i], mal: st.mal && st.mal[i], bien }));
        o.tramos = ej.tramos;
      }
      if (conCursor && st.resuelto) o.cursor = { t: st.t, y: m.v(st.t) };
      return o;
    }
    const mag = ej.dado || 'v';
    const o = { mag, eje: st.ejes[mag], tMax: Tf, curvas: [], tramos: m.tramos.length > 1 ? m.tramos : null };
    if (!ej.dado && !st.resuelto) {
      o.tramos = null;
      o.vacio = 'Observa el movimiento del carrito\ny elige su gráfica v–t.';
      return o;
    }
    o.curvas.push({ puntos: st.pts[mag] });
    if (ej.marcas) o.marcas = ej.marcas.map(x => ({ t: x.t, y: valorDe(x.mag, x.t), nombre: x.nombre }));
    if (conCursor) o.cursor = { t: st.t, y: valorDe(mag, st.t) };
    return o;
  }

  function dibujar() {
    if ($('panel-practicar').hidden || !st.ej) return;
    const ej = st.ej, m = st.m;
    escena.dibujar({
      mov: m, t: st.t, jugando: st.jugando, pista: PISTA,
      vMax: st.ejes.v.max, aMax: st.ejes.a.max,
      vectores: st.resuelto, desplazamiento: st.resuelto || !!ej.verAntes
    });
    D.dibujarGrafica($('pGraf'), opcionesPrincipal());
    if (ej.tipo === 'grafica') {
      const todo = Math.max.apply(null, ej.opciones.map(o => D.maxAbsPuntos(o.puntos)));
      const eje = D.ejeAuto(ej.magOpc, todo);
      document.querySelectorAll('#pRespuesta .opc canvas').forEach((cv, i) => {
        D.dibujarGrafica(cv, { mag: ej.magOpc, eje, tMax: m.duracion, mini: true, curvas: [{ puntos: ej.opciones[i].puntos }] });
      });
    }
    if (ej.tipo === 'dibujar' && ej.modo === 'niveles' && $('pAux')) {
      const hecho = E.movDibujado(ej, st.valores);
      D.dibujarGrafica($('pAux'), {
        mag: 's', eje: st.ejes.s, tMax: m.duracion, tramos: ej.tramos,
        curvas: [{ puntos: st.pts.s, color: '#B8C3CF', ancho: 7 }, { puntos: D.muestrear(hecho, 's') }]
      });
    }
  }

  // ---------- Selección y dibujo con el puntero ----------
  $('pRespuesta').addEventListener('click', (e) => {
    const b = e.target.closest('.opc'); if (!b || st.resuelto || b.disabled) return;
    st.sel = Number(b.dataset.i);
    document.querySelectorAll('#pRespuesta .opc').forEach((x, i) => x.classList.toggle('elegida', i === st.sel));
  });

  (function () {
    const cv = $('pGraf');
    let indice = -1;
    const geo = () => { const r = cv.getBoundingClientRect(); return { r, G: D.geometria(r.width, r.height, D.ejeAuto('v', st.ej.vMax), st.m.duracion) }; };
    const mover = (e) => {
      const ej = st.ej, { r, G } = geo();
      let v = Math.round(G.V(e.clientY - r.top) / ej.paso) * ej.paso;
      v = Math.max(-ej.vMax, Math.min(ej.vMax, v));
      if (st.valores[indice] !== v) { st.valores[indice] = v; st.mal = null; dibujar(); }
    };
    cv.addEventListener('pointerdown', (e) => {
      const ej = st.ej;
      if (!ej || ej.tipo !== 'dibujar' || st.resuelto) return;
      const { r, G } = geo(), x = e.clientX - r.left, y = e.clientY - r.top;
      indice = -1;
      if (ej.modo === 'nodos') {
        let mejor = 26;
        ej.tiempos.forEach((t, i) => { const d = Math.hypot(G.X(t) - x, G.Y(st.valores[i]) - y); if (d < mejor) { mejor = d; indice = i; } });
        if (indice < 0) {             // sin punto cerca: se toma el del instante más próximo
          let dx = 30; ej.tiempos.forEach((t, i) => { const d = Math.abs(G.X(t) - x); if (d < dx) { dx = d; indice = i; } });
        }
      } else {
        const t = G.T(x);
        indice = ej.tramos.findIndex(tr => t >= tr.t0 && t <= tr.t1);
      }
      if (indice >= 0) { cv.setPointerCapture(e.pointerId); mover(e); }
    });
    cv.addEventListener('pointermove', (e) => { if (indice >= 0) mover(e); });
    const soltar = () => { indice = -1; };
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
    st.resuelto = true; st.mal = null;
    if (ej.tipo === 'grafica' || ej.tipo === 'texto') {
      document.querySelectorAll('#pRespuesta .opc').forEach((b, i) => { b.classList.toggle('bien', !!ej.opciones[i].correcta); b.disabled = true; });
    }
    if (ej.tipo === 'dibujar') st.valores = ej.objetivo.slice();
    if (ej.tipo === 'numero') { $('pNum').disabled = true; $('pUni').disabled = true; }
    let sol = '';
    if (!acierto) {
      if (ej.tipo === 'grafica' || ej.tipo === 'texto') sol = `La opción correcta es la <b>${LETRAS[ej.opciones.findIndex(o => o.correcta)]}</b>. `;
      if (ej.tipo === 'dibujar') sol = 'La gráfica ya muestra la solución. ';
    }
    cajaCorreccion(acierto ? 'bien' : 'solucion', acierto ? 'Correcto.' : 'Solución.', sol + ej.explicacion);
    $('pComprobar').hidden = true; $('pSolucion').hidden = true; $('pSiguiente').hidden = false;
    actualizarBotones();
    dibujar();
  }
  function fallar(pista) {
    cajaCorreccion('pista', 'Todavía no.', pista);
    $('pSolucion').hidden = false;
  }
  function comprobar() {
    const ej = st.ej; if (!ej || st.resuelto) return;
    if (ej.tipo === 'grafica' || ej.tipo === 'texto') {
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
      const c = E.corregirDibujo(ej, st.valores);
      if (c.ok) terminar(true); else { st.mal = c.mal; fallar(c.pista); dibujar(); }
    }
  }
  $('pComprobar').addEventListener('click', comprobar);
  $('pSolucion').addEventListener('click', () => terminar(false));
  $('pSiguiente').addEventListener('click', nuevo);
  $('pNuevo').addEventListener('click', nuevo);
  $('pTipo').addEventListener('change', nuevo);

  // ---------- Ver el movimiento ----------
  function actualizarBotones() {
    const puede = st.ej && (st.resuelto || st.ej.verAntes);
    $('pVer').disabled = !puede;
    $('pVer').title = puede ? '' : 'Disponible cuando resuelvas el ejercicio';
    $('pVerTxt').textContent = st.jugando ? 'Pausar' : (st.t > 0 && st.t >= st.m.duracion - 1e-9 ? 'Ver otra vez' : 'Ver el movimiento');
  }
  let ultimo = null;
  function cuadro(ahora) {
    if (!st.jugando) { ultimo = null; return; }
    if (ultimo !== null) {
      st.t = Math.min(st.m.duracion, st.t + (ahora - ultimo) / 1000);
      if (st.t >= st.m.duracion) st.jugando = false;
    }
    ultimo = ahora;
    dibujar(); actualizarBotones();
    if (st.jugando) requestAnimationFrame(cuadro); else ultimo = null;
  }
  $('pVer').addEventListener('click', () => {
    if (st.jugando) { st.jugando = false; actualizarBotones(); dibujar(); return; }
    if (st.t >= st.m.duracion - 1e-9) st.t = 0;
    st.jugando = true; ultimo = null; requestAnimationFrame(cuadro); actualizarBotones();
  });

  // ---------- Entrar y salir de la pestaña ----------
  window.addEventListener('a1-practicar', (e) => {
    if (e.detail) { if (!st.ej) nuevo(); else dibujar(); }
    else if (st.jugando) { st.jugando = false; actualizarBotones(); }
  });
  new ResizeObserver(() => dibujar()).observe($('panel-practicar'));
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(dibujar);

  // Para las pruebas automáticas
  window.__practicarA1 = { st, poner, nuevo, comprobar, generar: (id, semilla) => E.generar(E.rngSemilla(semilla), id) };
})();
