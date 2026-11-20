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

  let guia = null;   // tarjeta de preguntas guiadas (se crea al final)
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
      ] },
    4: { modo: 'caida', experimento: true, ini: { u: 0, h: 1.6, puerta: 1.4 }, rangoH: [1, 2, 0.1], rotH: 'Altura de salida',
      observar: [
        'Pulsa «Soltar y registrar»: la interfaz mide el tiempo desde que se suelta la bola hasta que pasa por la puerta.',
        'Baja la puerta y vuelve a medir. Consigue al menos cinco distancias diferentes, bien repartidas.',
        `¿Por qué se representa ${S} frente a ${T}² y no frente a ${T}? ¿Qué forma tendría la gráfica ${S}–${T}?`,
        `Si ${S} = ½${GG}${T}², ¿qué representa la pendiente de la recta? ¿Debería pasar por el origen?`,
        'Las rectas discontinuas son las de pendiente máxima y mínima que pasan por las barras de error. ¿Cómo dan la incertidumbre de g?',
        '¿Queda el valor aceptado (9,81 m s⁻²) dentro de tu intervalo? Si no, ¿qué error sistemático podría haber?'
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
    par: { 1: Object.assign({}, NIVELES[1].ini), 2: Object.assign({}, NIVELES[2].ini), 3: Object.assign({}, NIVELES[3].ini), 4: Object.assign({}, NIVELES[4].ini) },
    ligera: false, pL: null, ptsL: null, datos: [], medirPendiente: false,
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
  const K_ESPUMA = 3;     // m⁻¹: bola de espuma, llega pronto a su velocidad terminal √(g/k) ≈ 1,8 m s⁻¹
  const fin = () => Math.max(estado.p.duracion, estado.pL ? estado.pL.duracion : 0);
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
    // bola de espuma con resistencia del aire (solo nivel 1; comparación cualitativa)
    estado.pL = estado.nivel === 1 && estado.ligera ? new Proyectil(par.h, 0, 0, { k: K_ESPUMA }) : null;
    estado.t = 0;
    const Tf = fin(), N = 80;
    estado.pts = { s: [], v: [], a: [[0, -G], [estado.p.duracion, -G]] };
    for (let i = 0; i <= N; i++) { const t = estado.p.duracion * i / N; estado.pts.s.push([t, valor.s(t)]); estado.pts.v.push([t, valor.v(t)]); }
    estado.ptsL = null;
    if (estado.pL) {
      const pl = estado.pL; estado.ptsL = { s: [], v: [], a: [] };
      for (let i = 0; i <= N; i++) { const t = pl.duracion * i / N; estado.ptsL.s.push([t, pl.y(t) - pl.h]); estado.ptsL.v.push([t, pl.vy(t)]); estado.ptsL.a.push([t, pl.ay(t)]); }
    }
    const rango = (...listas) => { let lo = 0, hi = 0; for (const pts of listas) for (const pt of (pts || [])) { lo = Math.min(lo, pt[1]); hi = Math.max(hi, pt[1]); } return ejeLindo(lo, hi); };
    const L = estado.ptsL || {};
    estado.ejes = { s: rango(estado.pts.s, L.s), v: rango(estado.pts.v, L.v), a: { min: -10, max: 0, mayor: 5, menor: 2.5 }, t: ejeTiempo(Tf) };
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
    const p = estado.p, t = estado.t, alFinal = t >= fin() - 1e-9, caida = NIVELES[estado.nivel].modo === 'caida';
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
    $('txtPlay').textContent = estado.jugando ? 'Pausar' : (alFinal ? 'Repetir' : t > 0 ? 'Seguir' : verbo);
    $('icoPlay').hidden = estado.jugando;
    $('icoPausa').hidden = !estado.jugando;
    pintarEcuaciones();
  }

  function dibujarTodo() {
    if ($('panel-visor').hidden) return;
    const par = q(), p = estado.p, t = estado.t;
    escena.dibujar({
      modo: NIVELES[estado.nivel].modo, p, h0: par.h, t, jugando: estado.jugando, disparo: estado.disparo,
      ver: estado.ver, yPuerta: par.puerta, cruces: estado.cruces, ligera: estado.pL,
      vista: Math.max(p.alturaMax(), par.puerta) + 0.3
    });
    if (NIVELES[estado.nivel].experimento) dibujarExperimento();
    else GRAFICAS.forEach(g => {
      if ($(g.id).parentElement.hidden) return;
      const curvas = [{ puntos: estado.pts[g.mag], alfa: 0.25 }, { puntos: estado.pts[g.mag], hasta: t }];
      if (estado.ptsL) curvas.push({ puntos: estado.ptsL[g.mag], hasta: t, color: COL.suave, raya: [6, 4], ancho: 2.5 });
      Gr.dibujarGrafica($(g.id), {
        eje: estado.ejes[g.mag], hMax: estado.ejes.t.max, pasoH: estado.ejes.t.pasoH, rotulo: g.rotulo, color: g.color,
        curvas, cursor: { t, y: valor[g.mag](Math.min(t, p.duracion)) }
      });
    });
    actualizarTextos();
  }

  // ---------- Reproducción ----------
  let ultimo = null;
  function cuadro(ahora) {
    if (!estado.jugando) { ultimo = null; return; }
    const Tf = fin();
    if (ultimo !== null) {
      estado.t = Math.min(Tf, estado.t + (ahora - ultimo) / 1000 * estado.rapidez);
      if (estado.t >= Tf) estado.jugando = false;
    }
    if (estado.medirPendiente && estado.cruces.length && estado.t >= estado.cruces[0]) registrarMedida();
    ultimo = ahora;
    dibujarTodo();
    if (estado.jugando) requestAnimationFrame(cuadro); else ultimo = null;
  }
  function reproducir() {
    if (estado.t >= fin() - 1e-9) estado.t = 0;
    if (estado.t === 0) estado.disparo++;
    if (!estado.jugando) { estado.jugando = true; ultimo = null; requestAnimationFrame(cuadro); }
    actualizarTextos();
  }
  function pausar() { estado.jugando = false; actualizarTextos(); }
  function irA(t) { estado.t = Math.min(fin(), Math.max(0, Math.round(t * 1000) / 1000)); dibujarTodo(); }

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
    // nivel 4: experimento en lugar de las gráficas; bola de espuma solo en el nivel 1
    $('cajaExperimento').hidden = !cfg.experimento;
    $('apiladas').parentElement.hidden = !!cfg.experimento;
    $('rotLigera').hidden = n !== 1; $('chkLigera').checked = estado.ligera; $('notaLigera').hidden = !(n === 1 && estado.ligera);
    $('listaObservar').innerHTML = cfg.observar.map(x => `<li>${x}</li>`).join('');
    marcar();
  }
  function ponerNivel(n) {
    pausar();
    estado.nivel = n;
    pintarControles(); recalcular(); dibujarTodo();
    if (guia) guia.ponerNivel(n);
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
    if (window.ProblemasUI) window.ProblemasUI.mostrar(parte);
  }));

  // ---------- Nivel 4: medir g (experimento.js) ----------
  const X = window.ExperimentoCaida;
  function registrarMedida() {
    estado.medirPendiente = false;
    const par = q();
    estado.datos.push(X.medir(Math.random, par.h, par.puerta));
    pintarDatos();
  }
  $('btnMedir').addEventListener('click', () => {
    pausar(); estado.t = 0;
    if (!estado.cruces.length) return;
    estado.medirPendiente = true; reproducir();
  });
  $('btnBorrarDatos').addEventListener('click', () => { estado.datos = []; estado.medirPendiente = false; pintarDatos(); });
  function pintarDatos() {
    const n3 = (x) => numero(x, 3);
    $('cuerpoDatos').innerHTML = estado.datos.map(d => `<tr><td>${n3(d.s)}</td><td>${n3(d.t)}</td><td>${n3(d.t * d.t)} ± ${n3(2 * d.t * X.DT)}</td></tr>`).join('') ||
      '<tr><td colspan="3" class="vacio">Todavía no hay medidas.</td></tr>';
    const a = X.ajuste(estado.datos), res = $('expResultado');
    const distintas = new Set(estado.datos.map(d => d.s)).size;
    if (!a || distintas < 3) res.innerHTML = `Necesitas al menos tres distancias diferentes (llevas ${distintas}). Mueve la puerta entre medida y medida.`;
    else {
      const gI = X.conIncertidumbre(a.g, a.dg), mI = X.conIncertidumbre(a.m, a.dm), dentro = Math.abs(a.g - G) <= a.dg;
      res.innerHTML = `Pendiente = (${mI.valor} ± ${mI.inc}) m s⁻² ⇒ <b><i>g</i> = 2 × pendiente = (${gI.valor} ± ${gI.inc}) m s⁻²</b>. ` +
        `Corte con el eje: ${numero(a.c * 1000, 1)} mm (casi el origen). ` +
        (dentro ? 'El valor aceptado, 9,81 m s⁻², está dentro de la incertidumbre.' : 'El valor aceptado, 9,81 m s⁻², queda fuera: ¿hay algún error sistemático?') +
        (distintas < 5 ? ' Con cinco o más distancias el resultado es más fiable.' : '');
    }
    dibujarExperimento();
  }
  function dibujarExperimento() {
    const cv = $('gExp'); if (!cv || $('cajaExperimento').hidden) return;
    const { ctx, w, h } = Gr.prepararLienzo(cv);
    ctx.clearRect(0, 0, w, h);
    const a = X.ajuste(estado.datos);
    const pts = estado.datos.map(d => ({ x: d.t * d.t, y: d.s, dx: 2 * d.t * X.DT, dy: X.DS }));
    const xMax = Math.max(0.3, ...pts.map(p => p.x + p.dx)) * 1.08, yMax = Math.max(1.6, ...pts.map(p => p.y)) * 1.08;
    const pasoX = xMax > 0.6 ? 0.1 : 0.05, pasoY = yMax > 1 ? 0.2 : 0.1;
    const x0 = 46, x1 = w - 12, y0 = 22, y1 = h - 34;
    const X_ = (x) => x0 + (x1 - x0) * x / xMax, Y_ = (y) => y1 - (y1 - y0) * y / yMax;
    ctx.lineWidth = 1; ctx.strokeStyle = '#E4E9EF'; ctx.font = `12px ${Gr.LETRA}`; ctx.fillStyle = COL.suave;
    for (let x = 0; x <= xMax + 1e-9; x += pasoX) { ctx.beginPath(); ctx.moveTo(X_(x), y0); ctx.lineTo(X_(x), y1); ctx.stroke(); ctx.textAlign = 'center'; ctx.textBaseline = 'top'; ctx.fillText(numero(x, 2), X_(x), y1 + 4); }
    for (let y = 0; y <= yMax + 1e-9; y += pasoY) { ctx.beginPath(); ctx.moveTo(x0, Y_(y)); ctx.lineTo(x1, Y_(y)); ctx.stroke(); ctx.textAlign = 'right'; ctx.textBaseline = 'middle'; ctx.fillText(numero(y, 1), x0 - 5, Y_(y)); }
    ctx.strokeStyle = COL.tinta; ctx.lineWidth = 1.4; ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x0, y1); ctx.lineTo(x1, y1); ctx.stroke();
    Gr.textoRico(ctx, [['s', true], [' / m', false]], x0 + 4, y0 - 10, 13, COL.des, 'left', true);
    Gr.textoRico(ctx, [['t', true], ['² / s²', false]], x1, y1 + 24, 13, COL.tinta, 'right', true);
    ctx.save(); ctx.beginPath(); ctx.rect(x0, y0, x1 - x0, y1 - y0); ctx.clip();
    if (a) {
      const recta = (m, c, color, raya, ancho) => { ctx.setLineDash(raya); ctx.strokeStyle = color; ctx.lineWidth = ancho; ctx.beginPath(); ctx.moveTo(X_(0), Y_(c)); ctx.lineTo(X_(xMax), Y_(c + m * xMax)); ctx.stroke(); };
      recta(a.lineaMax.m, a.lineaMax.c, COL.suave, [5, 4], 1.4); recta(a.lineaMin.m, a.lineaMin.c, COL.suave, [5, 4], 1.4);
      recta(a.m, a.c, COL.azul, [], 2.2); ctx.setLineDash([]);
    }
    for (const p of pts) {
      ctx.strokeStyle = COL.tinta; ctx.lineWidth = 1.3;
      ctx.beginPath(); ctx.moveTo(X_(p.x - p.dx), Y_(p.y)); ctx.lineTo(X_(p.x + p.dx), Y_(p.y));
      for (const xe of [p.x - p.dx, p.x + p.dx]) { ctx.moveTo(X_(xe), Y_(p.y) - 4); ctx.lineTo(X_(xe), Y_(p.y) + 4); }
      ctx.moveTo(X_(p.x), Y_(p.y + p.dy) - 1); ctx.lineTo(X_(p.x), Y_(p.y - p.dy) + 1); ctx.stroke();
      ctx.beginPath(); ctx.arc(X_(p.x), Y_(p.y), 3.2, 0, 2 * Math.PI); ctx.fillStyle = COL.des; ctx.fill();
    }
    ctx.restore();
    if (!pts.length) { ctx.font = `14px ${Gr.LETRA}`; ctx.fillStyle = COL.suave; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('Registra medidas para ver la gráfica s frente a t².', (x0 + x1) / 2, (y0 + y1) / 2); }
  }
  $('chkLigera').addEventListener('change', (e) => { pausar(); estado.ligera = e.target.checked; $('notaLigera').hidden = !estado.ligera; recalcular(); dibujarTodo(); if (estado.ligera) reproducir(); });

  // ---------- Preguntas guiadas (comun/guia.js + preguntas.js) ----------
  const PQ = window.PreguntasCaida;
  guia = window.Guia.crear({
    contenedor: document.querySelector('#panel-visor .lateral'),
    niveles: PQ.NIVELES, situaciones: PQ.SIT,
    cargar: (id) => {
      const sit = PQ.SIT[id];
      pausar();
      estado.par[sit.nivel] = Object.assign({}, sit.par);
      estado.ligera = !!sit.ligera;
      pintarControles(); recalcular(); dibujarTodo();
    },
    contexto: () => ({ par: q(), p: estado.p, cruces: estado.cruces, nivel: estado.nivel, pL: estado.pL }),
    alOcultar: () => dibujarTodo()
  });

  // ---------- Inicio ----------
  armarEcuaciones();
  pintarControles();
  recalcular();
  guia.ponerNivel(estado.nivel);
  pintarDatos();
  new ResizeObserver(() => dibujarTodo()).observe(document.querySelector('.taller'));
  window.addEventListener('resize', dibujarTodo);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(dibujarTodo);
  dibujarTodo();

  // Para las pruebas automáticas
  window.__simCaida = { guia, registrarMedida, estado, irA, dibujarTodo, ponerNivel, recalcular, reproducir, pausar, valor };
})();
