/* Simulación A.1 · Ecuaciones del movimiento y caída libre — parte Explorar
   Nivel 1: caída desde el reposo. Nivel 2: lanzamiento vertical hacia arriba. Nivel 3: las ecuaciones con
   aceleración uniforme del Cuadernillo de datos, con los valores de cada instante.
   La física sale de comun/proyectil.js (movimiento vertical exacto, a = −g). Arriba es positivo. */

(function () {
  'use strict';
  const { numero } = window.Cinematica;
  const { Proyectil, G } = window.ProyectilFisica;
  const Gr = window.Graficas, Es = window.CaidaEscena;
  const { COL, fmt } = Gr;
  const $ = (id) => document.getElementById(id);
  const V = '<span class="var">v</span>', U = '<span class="var">u</span>', A = '<span class="var">a</span>', S = '<span class="var">s</span>', T = '<span class="var">t</span>', GG = '<span class="var">g</span>';

  const NIVELES = {
    1: { modo: 'caida', ini: { u: 0, h: 1.5, puerta: 0.75 }, rangoH: [0.4, 2, 0.1], rotH: 'Altura de salida',
      observar: [
        'Activa «Huellas» y suelta la bola. Compara las distancias que recorre en cada décima de segundo: ¿qué regularidad ves?',
        `¿Qué forma tiene la gráfica ${V}–${T}? ¿Cuánto vale su pendiente?`,
        `Cambia la altura de salida. ¿Cambia la aceleración? ¿Y la rapidez al llegar a la mesa?`,
        'Coloca la puerta fotoeléctrica a la mitad de la altura de salida. ¿Marca la mitad del tiempo de caída? ¿Por qué?',
        `Con la distancia caída hasta la puerta y el tiempo que marca, calcula ${GG} con ${S} = ½${A}${T}².`
      ] },
    2: { modo: 'subida', ini: { u: 4, h: 0, puerta: 0.5 }, rangoH: [0, 1, 0.1], rotH: 'Altura del lanzador',
      observar: [
        `En el punto más alto, ¿cuánto vale ${V}? ¿Y ${A}? Activa «Aceleración» y mira la flecha durante todo el vuelo.`,
        'Con el lanzador sobre la mesa, compara el tiempo de subida con el de bajada, y la rapidez de salida con la de llegada.',
        `Mira la gráfica ${V}–${T}. ¿En qué instante corta al eje? ¿Qué representan el área de encima y la de debajo del eje?`,
        'La bola cruza la puerta fotoeléctrica dos veces. Compara su rapidez en los dos pasos.',
        `Sube el lanzador. ¿En qué parte del movimiento es negativo el desplazamiento ${S}?`
      ] },
    3: { modo: 'subida', ini: { u: 4, h: 0.5, puerta: 0.5 }, rangoH: [0, 1, 0.1], rotH: 'Altura del lanzador',
      observar: [
        'Pausa en un instante cualquiera y comprueba una de las ecuaciones con tu calculadora.',
        '¿Qué magnitud no aparece en cada ecuación?',
        'Quieres hallar la altura máxima sin conocer el tiempo: ¿qué ecuación usarías? ¿Por qué?',
        `Pausa en el punto más alto. ¿Qué valor toma ${V} en las ecuaciones?`,
        `Pausa cuando la bola esté por debajo del punto de salida. ¿Qué signo tiene ${S}? ¿Siguen cumpliéndose las ecuaciones?`
      ] }
  };
  // Las cuatro ecuaciones del Cuadernillo de datos; «falta» es la magnitud que no contienen
  const ECUACIONES = [
    { html: `${V} = ${U} + ${A}${T}`, falta: 's' },
    { html: `${S} = ${U}${T} + ½${A}${T}²`, falta: 'v' },
    { html: `${V}² = ${U}² + 2${A}${S}`, falta: 't' },
    { html: `${S} = ½(${U} + ${V})${T}`, falta: 'a' }
  ];

  const estado = {
    nivel: 1,
    par: { 1: Object.assign({}, NIVELES[1].ini), 2: Object.assign({}, NIVELES[2].ini), 3: Object.assign({}, NIVELES[3].ini) },
    p: null, cruces: [], pts: null, ejes: null,
    t: 0, jugando: false, rapidez: 0.25, disparo: 0,
    ver: { velocidad: true, aceleracion: false, huellas: true, puerta: true }
  };
  const escena = Es.crearEscena($('escena'));
  const GRAFICAS = [
    { id: 'gS', mag: 's', color: COL.des, rotulo: [['s', true], [' / m', false]] },
    { id: 'gV', mag: 'v', color: COL.vel, rotulo: [['v', true], [' / m s⁻¹', false]] },
    { id: 'gA', mag: 'a', color: COL.ace, rotulo: [['a', true], [' / m s⁻²', false]] }
  ];

  // ---------- Magnitudes del movimiento vertical ----------
  const q = () => estado.par[estado.nivel];
  const valor = {
    s: (t) => estado.p.y(t) - estado.p.h,
    v: (t) => estado.p.vy(t),
    a: () => -G
  };

  function ejeLindo(min, max) {
    for (const paso of [0.1, 0.2, 0.5, 1, 2, 5, 10]) {
      const lo = Math.floor(min / paso + 1e-9) * paso, hi0 = Math.ceil(max / paso - 1e-9) * paso, hi = hi0 > lo ? hi0 : lo + paso;
      if ((hi - lo) / paso <= 4.001) return { min: lo, max: hi, mayor: paso, menor: paso / 2 };
    }
    return { min, max, mayor: 10, menor: 5 };
  }
  function ejeTiempo(Tf) {
    const [mayor, menor] = Tf <= 0.6 ? [0.1, 0.05] : Tf <= 1.2 ? [0.2, 0.1] : [0.5, 0.1];
    return { max: Math.ceil(Tf / mayor - 1e-9) * mayor, pasoH: { mayor, menor } };
  }

  function recalcular() {
    const par = q(), cfg = NIVELES[estado.nivel];
    estado.p = cfg.modo === 'caida' ? new Proyectil(par.h, 0, 0) : new Proyectil(par.h, par.u, 90);
    estado.cruces = estado.p.crucesAltura(par.puerta);
    estado.t = 0;
    const Tf = estado.p.duracion, N = 80;
    estado.pts = { s: [], v: [], a: [[0, -G], [Tf, -G]] };
    for (let i = 0; i <= N; i++) { const t = Tf * i / N; estado.pts.s.push([t, valor.s(t)]); estado.pts.v.push([t, valor.v(t)]); }
    const rango = (pts) => { let lo = 0, hi = 0; for (const pt of pts) { lo = Math.min(lo, pt[1]); hi = Math.max(hi, pt[1]); } return ejeLindo(lo, hi); };
    estado.ejes = { s: rango(estado.pts.s), v: rango(estado.pts.v), a: { min: -10, max: 0, mayor: 5, menor: 2.5 }, t: ejeTiempo(Tf) };
    $('barraTiempo').max = Tf;
  }

  // ---------- Dibujo ----------
  function pintarEcuaciones() {
    if (estado.nivel !== 3) return;
    const t = estado.t, s = valor.s(t), u = estado.p.uy, v = valor.v(t), a = -G;
    const n = (x) => numero(x, 2), p = (x) => (x < 0 ? '(' + n(x) + ')' : n(x)), nt = numero(t, 3);
    const filas = [
      [`${n(v)} = ${n(u)} + ${p(a)} × ${nt}`, v, u + a * t],
      [`${n(s)} = ${n(u)} × ${nt} + ½ × ${p(a)} × ${nt}²`, s, u * t + 0.5 * a * t * t],
      [`${p(v)}² = ${n(u)}² + 2 × ${p(a)} × ${p(s)}`, v * v, u * u + 2 * a * s],
      [`${n(s)} = ½ × (${n(u)} + ${p(v)}) × ${nt}`, s, 0.5 * (u + v) * t]
    ];
    const cuerpo = $('cuerpoEcuaciones');
    filas.forEach((f, i) => {
      const tr = cuerpo.rows[i];
      tr.cells[6].textContent = f[0];
      tr.cells[7].textContent = `${n(f[1])} = ${n(f[2])}`;
    });
  }
  function armarEcuaciones() {
    $('cuerpoEcuaciones').innerHTML = ECUACIONES.map(e =>
      `<tr><td class="ec">${e.html}</td>` + ['s', 'u', 'v', 'a', 't'].map(m => e.falta === m ? '<td class="no">✗</td>' : '<td class="si">✓</td>').join('') +
      '<td class="sust"></td><td class="res"></td></tr>').join('');
  }

  function actualizarTextos() {
    const p = estado.p, t = estado.t, fin = t >= p.duracion - 1e-9, caida = NIVELES[estado.nivel].modo === 'caida';
    $('valT').textContent = numero(t, 3);
    $('valS').textContent = numero(valor.s(t), 2);
    $('valV').textContent = numero(valor.v(t), 2);
    $('valA').textContent = numero(-G, 2);
    $('valY').textContent = numero(p.y(t), 2);
    $('resT').textContent = numero(p.duracion, 2);
    $('resV').textContent = numero(Math.abs(p.vy(p.duracion)), 2);
    $('resTs').textContent = numero(p.tCumbre, 2);
    $('resH').textContent = numero(p.alturaMax(), 2);
    $('barraTiempo').value = t;
    const verbo = caida ? 'Soltar' : 'Lanzar';
    $('btnPlay').setAttribute('aria-label', estado.jugando ? 'Pausar' : verbo);
    $('txtPlay').textContent = estado.jugando ? 'Pausar' : (fin ? 'Repetir' : t > 0 ? 'Seguir' : verbo);
    $('icoPlay').hidden = estado.jugando;
    $('icoPausa').hidden = !estado.jugando;
    pintarEcuaciones();
  }

  function dibujarTodo() {
    if ($('panel-visor').hidden) return;
    const par = q(), p = estado.p, t = estado.t;
    escena.dibujar({
      modo: NIVELES[estado.nivel].modo, p, h0: par.h, t, jugando: estado.jugando, disparo: estado.disparo,
      ver: estado.ver, yPuerta: par.puerta, cruces: estado.cruces,
      vista: Math.max(p.alturaMax(), par.puerta) + 0.3
    });
    GRAFICAS.forEach(g => {
      if ($(g.id).parentElement.hidden) return;
      Gr.dibujarGrafica($(g.id), {
        eje: estado.ejes[g.mag], hMax: estado.ejes.t.max, pasoH: estado.ejes.t.pasoH, rotulo: g.rotulo, color: g.color,
        curvas: [{ puntos: estado.pts[g.mag], alfa: 0.25 }, { puntos: estado.pts[g.mag], hasta: t }],
        cursor: { t, y: valor[g.mag](t) }
      });
    });
    actualizarTextos();
  }

  // ---------- Reproducción ----------
  let ultimo = null;
  function cuadro(ahora) {
    if (!estado.jugando) { ultimo = null; return; }
    const fin = estado.p.duracion;
    if (ultimo !== null) {
      estado.t = Math.min(fin, estado.t + (ahora - ultimo) / 1000 * estado.rapidez);
      if (estado.t >= fin) estado.jugando = false;
    }
    ultimo = ahora;
    dibujarTodo();
    if (estado.jugando) requestAnimationFrame(cuadro); else ultimo = null;
  }
  function reproducir() {
    if (estado.t >= estado.p.duracion - 1e-9) estado.t = 0;
    if (estado.t === 0) estado.disparo++;
    if (!estado.jugando) { estado.jugando = true; ultimo = null; requestAnimationFrame(cuadro); }
    actualizarTextos();
  }
  function pausar() { estado.jugando = false; actualizarTextos(); }
  function irA(t) { estado.t = Math.min(estado.p.duracion, Math.max(0, Math.round(t * 1000) / 1000)); dibujarTodo(); }

  $('btnPlay').addEventListener('click', () => (estado.jugando ? pausar() : reproducir()));
  $('btnReiniciar').addEventListener('click', () => { pausar(); irA(0); });
  $('btnAtras').addEventListener('click', () => { pausar(); irA(estado.t - 0.02); });
  $('btnAdelante').addEventListener('click', () => { pausar(); irA(estado.t + 0.02); });
  $('barraTiempo').addEventListener('input', (e) => { pausar(); irA(Number(e.target.value)); });
  $('rapidez').addEventListener('change', (e) => { estado.rapidez = Number(e.target.value); });

  // ---------- Controles ----------
  // La puerta puede ir desde 0,10 m hasta lo más alto que llega la bola (redondeado a 0,05 m)
  function topePuerta() {
    const par = q(), caida = NIVELES[estado.nivel].modo === 'caida';
    const alto = caida ? par.h - 0.1 : par.h + par.u * par.u / (2 * G);
    return Math.max(0.1, Math.floor(alto / 0.05 + 1e-9) * 0.05);
  }
  function marcar() {
    const par = q();
    $('outU').textContent = numero(par.u, 1) + ' m s⁻¹';
    $('outH').textContent = numero(par.h, 2) + ' m';
    $('outP').textContent = numero(par.puerta, 2) + ' m';
  }
  function pintarControles() {
    const n = estado.nivel, cfg = NIVELES[n], par = q(), caida = cfg.modo === 'caida';
    document.querySelectorAll('.nivel').forEach(b => {
      const activo = Number(b.dataset.nivel) === n;
      b.classList.toggle('activo', activo); b.setAttribute('aria-pressed', String(activo));
    });
    $('grupoU').hidden = caida;
    $('rotH').textContent = cfg.rotH;
    const pon = (id, r, val) => { const el = $(id); el.min = r[0]; el.max = r[1]; el.step = r[2]; el.value = val; };
    pon('desH', cfg.rangoH, par.h);
    pon('desU', [1, 5, 0.5], par.u || 1);
    par.puerta = Math.min(par.puerta, topePuerta());
    pon('desP', [0.1, topePuerta(), 0.05], par.puerta);
    $('grupoP').hidden = !estado.ver.puerta;
    $('filaSubida').hidden = caida; $('filaAltura').hidden = caida;
    // nivel 3: tabla de ecuaciones y solo la gráfica v–t
    $('cajaEcuaciones').hidden = n !== 3;
    $('apiladas').classList.toggle('una', n === 3);
    $('gS').parentElement.hidden = n === 3; $('gA').parentElement.hidden = n === 3;
    $('listaObservar').innerHTML = cfg.observar.map(x => `<li>${x}</li>`).join('');
    marcar();
  }
  function ponerNivel(n) {
    pausar();
    estado.nivel = n;
    pintarControles(); recalcular(); dibujarTodo();
  }
  document.querySelectorAll('.nivel').forEach(b => b.addEventListener('click', () => ponerNivel(Number(b.dataset.nivel))));

  function alMoverDeslizador() {
    const par = q(), r = (x, d) => Math.round(x * d) / d;
    const nuevo = { u: NIVELES[estado.nivel].modo === 'caida' ? 0 : r(Number($('desU').value), 10), h: r(Number($('desH').value), 10), puerta: r(Number($('desP').value), 100) };
    if (nuevo.u === par.u && nuevo.h === par.h && nuevo.puerta === par.puerta) return;
    pausar();
    Object.assign(par, nuevo);
    // al cambiar la altura o la velocidad, la puerta no puede quedar más arriba de donde llega la bola
    const tope = topePuerta();
    if (par.puerta > tope) par.puerta = tope;
    $('desP').max = tope; $('desP').value = par.puerta;
    recalcular(); marcar(); dibujarTodo();
  }
  ['desU', 'desH', 'desP'].forEach(id => {
    $(id).addEventListener('input', alMoverDeslizador);
    $(id).addEventListener('change', () => { if (id !== 'desP') reproducir(); });
  });
  [['chkVelocidad', 'velocidad'], ['chkAceleracion', 'aceleracion'], ['chkHuellas', 'huellas'], ['chkPuerta', 'puerta']].forEach(([id, k]) => {
    estado.ver[k] = $(id).checked;
    $(id).addEventListener('change', (e) => { estado.ver[k] = e.target.checked; $('grupoP').hidden = !estado.ver.puerta; dibujarTodo(); });
  });

  // ---------- Clic y arrastre sobre las gráficas ----------
  GRAFICAS.forEach(g => {
    const cv = $(g.id);
    let abajo = false;
    const tDesde = (e) => { const r = cv.getBoundingClientRect(); return Gr.geometria(r.width, r.height, estado.ejes[g.mag], estado.ejes.t.max).T(e.clientX - r.left); };
    cv.addEventListener('pointerdown', (e) => { abajo = true; cv.setPointerCapture(e.pointerId); pausar(); irA(tDesde(e)); });
    cv.addEventListener('pointermove', (e) => { if (abajo) irA(tDesde(e)); });
    const soltar = () => { abajo = false; };
    cv.addEventListener('pointerup', soltar);
    cv.addEventListener('pointercancel', soltar);
  });

  // ---------- Teclado ----------
  document.addEventListener('keydown', (e) => {
    const tag = (e.target.tagName || '').toLowerCase();
    if (tag === 'input' || tag === 'select' || tag === 'button' || tag === 'summary') return;
    if ($('panel-visor').hidden) return;
    if (e.code === 'Space') { e.preventDefault(); estado.jugando ? pausar() : reproducir(); }
    else if (e.key === 'ArrowRight') { pausar(); irA(estado.t + 0.02); }
    else if (e.key === 'ArrowLeft') { pausar(); irA(estado.t - 0.02); }
  });

  // ---------- Pestañas ----------
  document.querySelectorAll('.pestanas [role="tab"]').forEach(tab => tab.addEventListener('click', () => {
    const parte = tab.dataset.panel;
    document.querySelectorAll('.pestanas [role="tab"]').forEach(x => x.setAttribute('aria-selected', String(x === tab)));
    $('panel-visor').hidden = parte !== 'explorar';
    $('panel-construir').hidden = parte !== 'construir';
    $('panel-practicar').hidden = parte !== 'practicar';
    document.querySelectorAll('.observar[open]').forEach(d => { d.open = false; });
    if (parte === 'explorar') dibujarTodo(); else pausar();
  }));

  // ---------- Inicio ----------
  armarEcuaciones();
  pintarControles();
  recalcular();
  new ResizeObserver(() => dibujarTodo()).observe(document.querySelector('.taller'));
  window.addEventListener('resize', dibujarTodo);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(dibujarTodo);
  dibujarTodo();

  // Para las pruebas automáticas
  window.__simCaida = { estado, irA, dibujarTodo, ponerNivel, recalcular, reproducir, pausar, valor };
})();
