/* Simulación A.1 · Movimiento de proyectiles — partes Explorar y «Acierta al blanco»
   Explorar: nivel 1 (lanzamiento horizontal junto a una bola soltada), nivel 2 (lanzamiento oblicuo desde la mesa)
   y nivel 3 (desde una altura, con comparación cualitativa con resistencia del aire).
   La física sale de comun/proyectil.js. */

(function () {
  'use strict';
  const { numero } = window.Cinematica;
  const { Proyectil } = window.ProyectilFisica;
  const Gr = window.Graficas, Es = window.ProyEscena;
  const { COL, fmt } = Gr;
  const $ = (id) => document.getElementById(id);

  const K_AIRE = 0.3;                  // m⁻¹ (solo para la comparación cualitativa)
  const MEDIA_BANDEJA = 0.08;          // m (la bandeja mide 0,16 m)
  const COLOR_AIRE = '#5A6B7D';
  const V = '<span class="var">v</span>', X = '<span class="var">x</span>', Y = '<span class="var">y</span>', T = '<span class="var">t</span>', H = '<span class="var">h</span>';

  const NIVELES = {
    1: { des: { h: [0.3, 1, 0.1], v: [1, 5, 0.5] }, ini: { h: 0.8, ang: 0, v: 2.5 }, usa: { h: true, ang: false, v: true }, casos: [],
      observar: [
        'Lanza con «Huellas». Compara la altura de las dos bolas en cada instante. ¿Cuál llega primero a la mesa?',
        'Aumenta la rapidez de lanzamiento. ¿Cambia el tiempo de vuelo? ¿Y el alcance?',
        `Mira las gráficas ${V}<sub>x</sub>–${T} y ${V}<sub>y</sub>–${T}. ¿Cuál de las dos componentes cambia durante el vuelo?`,
        `Cambia la altura ${H}. ¿Qué magnitudes cambian ahora?`,
        'Entre dos huellas seguidas, ¿la bola avanza siempre lo mismo en horizontal? ¿Y en vertical?'
      ] },
    2: { des: { ang: [10, 80, 5], v: [1, 5, 0.5] }, ini: { h: 0, ang: 40, v: 4 }, usa: { h: false, ang: true, v: true },
      casos: [{ html: '30°', ang: 30 }, { html: '45°', ang: 45 }, { html: '60°', ang: 60 }],
      observar: [
        'Lanza con 30° y después con 60°, con la misma rapidez. Compara alcances, alturas máximas y tiempos de vuelo.',
        '¿Con qué ángulo es máximo el alcance? Compruébalo con varios lanzamientos.',
        `En el punto más alto, ¿cuánto vale ${V}<sub>y</sub>? ¿Y la rapidez de la bola: es cero?`,
        'Activa «Aceleración». ¿Cambia la flecha durante el vuelo? ¿Y en el punto más alto?',
        'Compara la rapidez de la bola al salir y al llegar a la mesa.'
      ] },
    3: { des: { h: [0, 1, 0.1], ang: [0, 80, 5], v: [1, 5, 0.5] }, ini: { h: 0.6, ang: 35, v: 4 }, usa: { h: true, ang: true, v: true }, casos: [],
      observar: [
        `Con ${H} = 0,60 m, ¿sigue siendo 45° el ángulo de mayor alcance? Prueba con ángulos menores.`,
        'Activa la resistencia del aire. ¿Qué le pasa al alcance y a la altura máxima?',
        'Con aire, ¿es simétrica la trayectoria? Compara la subida con la bajada.',
        `Con aire, mira la gráfica ${V}<sub>x</sub>–${T}. ¿Sigue siendo constante la componente horizontal?`,
        'Compara la rapidez de llegada con la de salida, sin aire y con aire.'
      ] }
  };
  const PISTAS_BLANCO = [
    'Antes de lanzar, estima: ¿hace falta más ángulo o más rapidez?',
    'Para calcularlo: halla el tiempo de vuelo con la componente vertical y después el alcance con la horizontal.',
    'Con la misma rapidez suele haber dos ángulos que dan en el blanco. ¿Cuál es el otro?',
    'Si el lanzador está a una altura, el tiempo de vuelo sale de una ecuación de segundo grado.'
  ];

  // ---------- Estado ----------
  const estado = {
    modo: 'explorar', nivel: 1,
    par: { 1: Object.assign({}, NIVELES[1].ini), 2: Object.assign({}, NIVELES[2].ini), 3: Object.assign({}, NIVELES[3].ini) },
    aire: false, fantasmas: [], lanzado: false,
    p: null, pAire: null, gemela: null, pts: null, ptsAire: null, ejes: null, fin: 1,
    t: 0, jugando: false, rapidez: 0.25, disparo: 0,
    ver: { componentes: true, velocidad: false, aceleracion: false, huellas: true, anteriores: true },
    // Acierta al blanco
    blanco: null, tiro: { ang: 45, v: 3 }, intentos: [], calcula: false, abierto: false
  };
  const escena = Es.crearEscena($('escena'));
  const GRAFICAS = [
    { id: 'gX', mag: 'x', color: Es.COMP.x, rotulo: [['x', true], [' / m', false]] },
    { id: 'gY', mag: 'y', color: Es.COMP.y, rotulo: [['y', true], [' / m', false]] },
    { id: 'gVx', mag: 'vx', color: Es.COMP.x, rotulo: [['v', true], ['x', true, true], [' / m s⁻¹', false]] },
    { id: 'gVy', mag: 'vy', color: Es.COMP.y, rotulo: [['v', true], ['y', true, true], [' / m s⁻¹', false]] }
  ];

  // ---------- Ejes ----------
  function ejeLindo(min, max) {
    for (const paso of [0.1, 0.2, 0.5, 1, 2, 5, 10]) {
      const lo = Math.floor(min / paso + 1e-9) * paso, hi0 = Math.ceil(max / paso - 1e-9) * paso, hi = hi0 > lo ? hi0 : lo + paso;
      if ((hi - lo) / paso <= 5.001) return { min: lo, max: hi, mayor: paso, menor: paso / 2 };
    }
    return { min, max, mayor: 10, menor: 5 };
  }
  function ejeTiempo(Tf) {
    const [mayor, menor] = Tf <= 0.6 ? [0.1, 0.05] : Tf <= 1.2 ? [0.2, 0.1] : [0.5, 0.1];
    return { max: Math.ceil(Tf / mayor - 1e-9) * mayor, pasoH: { mayor, menor } };
  }

  // ---------- Lanzamiento actual ----------
  function parametros() {
    if (estado.modo === 'construir') return { h: estado.blanco.h, ang: estado.tiro.ang, v: estado.tiro.v };
    return estado.par[estado.nivel];
  }
  function recalcular() {
    const q = parametros(), exp = estado.modo === 'explorar';
    estado.p = new Proyectil(q.h, q.v, q.ang);
    estado.gemela = exp && estado.nivel === 1 ? new Proyectil(q.h, 0, 0) : null;
    estado.pAire = exp && estado.nivel === 3 && estado.aire ? new Proyectil(q.h, q.v, q.ang, { k: K_AIRE }) : null;
    estado.fin = Math.max(estado.p.duracion, estado.pAire ? estado.pAire.duracion : 0);
    estado.t = 0; estado.lanzado = false; estado.abierto = false;
    const mags = ['x', 'y', 'vx', 'vy'];
    estado.pts = {}; estado.ptsAire = estado.pAire ? {} : null;
    mags.concat(['tray']).forEach(m => { estado.pts[m] = estado.p.puntos(m, 80); if (estado.pAire) estado.ptsAire[m] = estado.pAire.puntos(m, 80); });
    const rango = (m) => {
      let lo = 0, hi = 0;
      for (const lista of [estado.pts[m], estado.ptsAire ? estado.ptsAire[m] : []]) for (const pt of lista) { lo = Math.min(lo, pt[1]); hi = Math.max(hi, pt[1]); }
      return ejeLindo(lo, hi);
    };
    estado.ejes = { x: rango('x'), y: rango('y'), vx: rango('vx'), vy: rango('vy'), t: ejeTiempo(estado.fin) };
    $('barraTiempo').max = estado.fin;
  }

  // ---------- Dibujo ----------
  function opcionesGrafica(g) {
    const p = estado.p, t = estado.t, tp = Math.min(t, p.duracion);
    const curvas = [];
    if (estado.ptsAire) curvas.push({ puntos: estado.ptsAire[g.mag], color: COLOR_AIRE, ancho: 2, raya: [5, 4], hasta: t });
    curvas.push({ puntos: estado.pts[g.mag], alfa: 0.25 });
    curvas.push({ puntos: estado.pts[g.mag], hasta: tp });
    return { eje: estado.ejes[g.mag], hMax: estado.ejes.t.max, pasoH: estado.ejes.t.pasoH, rotulo: g.rotulo, color: g.color,
      curvas, cursor: { t: tp, y: p[g.mag](tp) } };
  }

  function actualizarTextos() {
    const p = estado.p, t = Math.min(estado.t, p.duracion), fin = estado.t >= estado.fin - 1e-9;
    $('valT').textContent = numero(t, 3);
    $('valX').textContent = numero(p.x(t), 2);
    $('valY').textContent = numero(p.y(t), 2);
    $('valVx').textContent = numero(p.vx(t), 2);
    $('valVy').textContent = numero(p.vy(t), 2);
    $('valV').textContent = numero(p.rapidez(t), 2);
    $('resT').textContent = numero(p.duracion, 2);
    $('resR').textContent = numero(p.alcance(), 2);
    $('resH').textContent = numero(p.alturaMax(), 2);
    $('barraTiempo').value = estado.t;
    $('btnPlay').setAttribute('aria-label', estado.jugando ? 'Pausar' : 'Lanzar');
    $('txtPlay').textContent = estado.jugando ? 'Pausar' : (fin ? 'Repetir' : estado.t > 0 ? 'Seguir' : 'Lanzar');
    $('icoPlay').hidden = estado.jugando;
    $('icoPausa').hidden = !estado.jugando;
  }

  // Lo más lejos y lo más alto que debe verse en la escena (con sitio para los rótulos)
  function vista() {
    let x = 0, y = 0;
    const mira = (pts) => { for (const q of pts) { x = Math.max(x, q[0]); y = Math.max(y, q[1]); } };
    mira(estado.pts.tray); if (estado.ptsAire) mira(estado.ptsAire.tray);
    if (estado.modo === 'explorar') { if (estado.ver.anteriores) estado.fantasmas.forEach(f => mira(f.puntos)); }
    else { x = Math.max(x, estado.blanco.x); estado.intentos.forEach(i => mira(i.puntos)); }
    return { x: x + 0.28, y: Math.max(y + 0.3, parametros().h + 0.45, 0.75) };
  }

  function dibujarTodo() {
    if ($('panel-visor').hidden) return;
    const q = parametros(), exp = estado.modo === 'explorar';
    const bolas = [{ p: estado.p, etiqueta: estado.pAire ? 'sin aire' : null }];
    if (estado.pAire) bolas.push({ p: estado.pAire, etiqueta: 'con aire', color: COLOR_AIRE, relleno: '#E4E9EF', raya: [5, 4] });
    const E = {
      h: q.h, angulo: q.ang, bolas, t: estado.t, jugando: estado.jugando, disparo: estado.disparo,
      ver: estado.ver, gemela: estado.gemela, cotas: exp, vista: vista(),
      fantasmas: exp ? (estado.ver.anteriores ? estado.fantasmas : []) : estado.intentos.filter(i => !i.actual).slice(-3).map(i => ({ puntos: i.puntos })),
    };
    if (!exp) {
      E.blanco = { x: estado.blanco.x, acierto: estado.intentos.some(i => i.acierto) };
      E.marcas = estado.intentos.map((i, n) => ({ x: i.x, n: n + 1, actual: n === estado.intentos.length - 1 }));
    }
    escena.dibujar(E);
    GRAFICAS.forEach(g => Gr.dibujarGrafica($(g.id), opcionesGrafica(g)));
    actualizarTextos();
  }

  // ---------- Reproducción ----------
  let ultimo = null;
  function alTerminar() {
    if (estado.modo === 'construir' && estado.abierto) registrarIntento();
  }
  function cuadro(ahora) {
    if (!estado.jugando) { ultimo = null; return; }
    if (ultimo !== null) {
      estado.t = Math.min(estado.fin, estado.t + (ahora - ultimo) / 1000 * estado.rapidez);
      if (estado.t >= estado.fin) { estado.jugando = false; alTerminar(); }
    }
    ultimo = ahora;
    dibujarTodo();
    if (estado.jugando) requestAnimationFrame(cuadro); else ultimo = null;
  }
  function reproducir() {
    if (estado.t >= estado.fin - 1e-9) estado.t = 0;
    if (estado.t === 0) { estado.disparo++; estado.lanzado = true; if (estado.modo === 'construir') estado.abierto = true; }
    if (!estado.jugando) { estado.jugando = true; ultimo = null; requestAnimationFrame(cuadro); }
    actualizarTextos();
  }
  function pausar() { estado.jugando = false; actualizarTextos(); }
  function irA(t) {
    estado.t = Math.min(estado.fin, Math.max(0, Math.round(t * 1000) / 1000));
    if (estado.t >= estado.fin - 1e-9) alTerminar();
    dibujarTodo();
  }

  $('btnPlay').addEventListener('click', () => (estado.jugando ? pausar() : reproducir()));
  $('btnReiniciar').addEventListener('click', () => { pausar(); irA(0); });
  $('btnAtras').addEventListener('click', () => { pausar(); irA(estado.t - 0.02); });
  $('btnAdelante').addEventListener('click', () => { pausar(); irA(estado.t + 0.02); });
  $('barraTiempo').addEventListener('input', (e) => { pausar(); irA(Number(e.target.value)); });
  $('rapidez').addEventListener('change', (e) => { estado.rapidez = Number(e.target.value); });

  // ---------- Controles ----------
  const rotuloTiro = (q) => `${fmt(q.ang)}° · ${fmt(q.v)} m s⁻¹`;
  function guardarFantasma() {
    if (estado.modo !== 'explorar' || !estado.lanzado) return;
    estado.fantasmas.push({ puntos: estado.p.puntos('tray', 60), rotulo: estado.nivel === 1 ? `${fmt(estado.p.v0)} m s⁻¹` : rotuloTiro({ ang: estado.p.angulo, v: estado.p.v0 }) });
    if (estado.fantasmas.length > 3) estado.fantasmas.shift();
  }

  function pintarControles() {
    const exp = estado.modo === 'explorar', n = estado.nivel, cfg = NIVELES[n];
    document.querySelectorAll('.nivel').forEach(b => {
      const activo = Number(b.dataset.nivel) === n;
      b.classList.toggle('activo', activo); b.setAttribute('aria-pressed', String(activo));
    });
    $('tituloAjustes').textContent = exp ? 'Prepara el lanzamiento' : 'Acierta al blanco';
    const usa = exp ? cfg.usa : { h: false, ang: true, v: true };
    $('grupoH').hidden = !usa.h; $('grupoAng').hidden = !usa.ang; $('grupoV').hidden = !usa.v;
    const q = parametros();
    const pon = (id, r, val) => { const el = $(id); el.min = r[0]; el.max = r[1]; el.step = r[2]; el.value = val; };
    if (exp) {
      if (usa.h) pon('desH', cfg.des.h, q.h);
      if (usa.ang) pon('desAng', cfg.des.ang, q.ang);
      pon('desV', cfg.des.v, q.v);
      const cont = $('casos');
      cont.hidden = !cfg.casos.length;
      cont.innerHTML = cfg.casos.map((c, i) => `<button type="button" class="boton caso" data-i="${i}">${c.html}</button>`).join('');
      $('rotAire').hidden = n !== 3; $('notaAire').hidden = !(n === 3 && estado.aire);
      $('chkAire').checked = estado.aire;
    } else {
      pon('desAng', [estado.blanco.h > 0 ? 0 : 10, 80, 5], q.ang);
      pon('desV', [1, 5, 0.5], q.v);
      $('desV').disabled = estado.calcula;
      $('blancoInfo').innerHTML = `Bandeja en ${X} = ${numero(estado.blanco.x, 2)} m · lanzador a ${H} = ${numero(estado.blanco.h, 2)} m`;
    }
    if (exp) $('desV').disabled = false;
    marcar();
    $('rotObservar').textContent = exp ? 'Para observar' : 'Pistas';
    $('listaObservar').innerHTML = (exp ? cfg.observar : PISTAS_BLANCO).map(x => `<li>${x}</li>`).join('');
  }
  function marcar() {
    const q = parametros();
    $('outH').textContent = numero(q.h, 2) + ' m';
    $('outAng').textContent = fmt(q.ang) + '°';
    $('outV').textContent = numero(q.v, 1) + ' m s⁻¹';
    if (estado.modo === 'explorar') document.querySelectorAll('#casos .caso').forEach((b, i) => b.classList.toggle('activo', NIVELES[estado.nivel].casos[i].ang === q.ang));
  }

  function ponerNivel(n) {
    pausar();
    estado.nivel = n; estado.fantasmas = [];
    pintarControles(); recalcular(); dibujarTodo();
  }
  document.querySelectorAll('.nivel').forEach(b => b.addEventListener('click', () => ponerNivel(Number(b.dataset.nivel))));

  $('casos').addEventListener('click', (e) => {
    const b = e.target.closest('.caso'); if (!b) return;
    const c = NIVELES[estado.nivel].casos[Number(b.dataset.i)];
    pausar(); guardarFantasma();
    estado.par[estado.nivel].ang = c.ang; $('desAng').value = c.ang;
    recalcular(); marcar(); dibujarTodo(); reproducir();
  });

  let arrastrando = false;
  function alMoverDeslizador() {
    const r1 = (x) => Math.round(x * 10) / 10;
    const exp = estado.modo === 'explorar', q = parametros();
    const nuevo = { h: exp && NIVELES[estado.nivel].usa.h ? r1(Number($('desH').value)) : q.h,
      ang: $('grupoAng').hidden ? q.ang : Number($('desAng').value), v: r1(Number($('desV').value)) };
    if (nuevo.h === q.h && nuevo.ang === q.ang && nuevo.v === q.v) return;
    if (!arrastrando) guardarFantasma();
    arrastrando = true;
    pausar();
    if (exp) Object.assign(estado.par[estado.nivel], nuevo); else Object.assign(estado.tiro, { ang: nuevo.ang, v: nuevo.v });
    recalcular(); marcar(); dibujarTodo();
  }
  ['desH', 'desAng', 'desV'].forEach(id => {
    $(id).addEventListener('input', alMoverDeslizador);
    $(id).addEventListener('change', () => { arrastrando = false; if (estado.modo === 'explorar') reproducir(); });
  });
  $('chkAire').addEventListener('change', (e) => {
    pausar(); estado.aire = e.target.checked; $('notaAire').hidden = !estado.aire;
    recalcular(); dibujarTodo(); reproducir();
  });
  [['chkComponentes', 'componentes'], ['chkVelocidad', 'velocidad'], ['chkAceleracion', 'aceleracion'], ['chkHuellas', 'huellas'], ['chkAnteriores', 'anteriores']].forEach(([id, k]) => {
    estado.ver[k] = $(id).checked;
    $(id).addEventListener('change', (e) => { estado.ver[k] = e.target.checked; dibujarTodo(); });
  });
  $('btnBorrar').addEventListener('click', () => { estado.fantasmas = []; dibujarTodo(); });

  // ---------- Acierta al blanco ----------
  function nuevoBlanco() {
    for (let i = 0; i < 500; i++) {
      const h = [0, 0, 0, 0.6][Math.floor(Math.random() * 4)];
      const ang = (h > 0 ? 0 : 20) + 5 * Math.floor(Math.random() * (h > 0 ? 13 : 11));
      const v = 2.5 + 0.5 * Math.floor(Math.random() * 6);
      const R = new Proyectil(h, v, ang).alcance();
      if (R < 0.7 || R > 3.3) continue;
      if (estado.blanco && Math.abs(R - estado.blanco.x) < 0.3) continue;
      estado.blanco = { x: R, h, vSol: v, angSol: ang };
      break;
    }
    estado.intentos = [];
    estado.tiro = { ang: estado.blanco.h > 0 ? 20 : 45, v: estado.calcula ? estado.blanco.vSol : 3 };
    // el punto de partida no debe dar ya en el blanco
    if (Math.abs(new Proyectil(estado.blanco.h, estado.tiro.v, estado.tiro.ang).alcance() - estado.blanco.x) <= MEDIA_BANDEJA) estado.tiro.ang += 15;
    $('resBlanco').textContent = ''; $('resBlanco').className = 'resultado-blanco';
    pintarIntentos();
  }
  function registrarIntento() {
    estado.abierto = false;
    const ult = estado.intentos[estado.intentos.length - 1];
    if (ult && ult.ang === estado.tiro.ang && ult.v === estado.tiro.v) return;      // repetir el mismo lanzamiento no cuenta otra vez
    const x = estado.p.alcance(), dif = x - estado.blanco.x, acierto = Math.abs(dif) <= MEDIA_BANDEJA;
    estado.intentos.forEach(i => { i.actual = false; });
    estado.intentos.push({ ang: estado.tiro.ang, v: estado.tiro.v, x, dif, acierto, actual: true, puntos: estado.p.puntos('tray', 60) });
    const r = $('resBlanco');
    r.className = 'resultado-blanco ' + (acierto ? 'bien' : 'mal');
    r.textContent = acierto ? '¡En el blanco!' : `${dif < 0 ? 'Corto' : 'Largo'} por ${numero(Math.abs(dif), 2)} m.`;
    pintarIntentos();
  }
  function pintarIntentos() {
    $('listaIntentos').innerHTML = estado.intentos.slice(-3).map(i =>
      `<li class="${i.acierto ? 'bien' : ''}">${rotuloTiro(i)} → ${i.acierto ? 'en el blanco' : (i.dif < 0 ? 'corto ' : 'largo ') + numero(Math.abs(i.dif), 2) + ' m'}</li>`).join('');
    $('listaIntentos').start = Math.max(1, estado.intentos.length - 2);
  }
  $('btnLanzar').addEventListener('click', () => { pausar(); estado.t = 0; reproducir(); });
  $('btnNuevoBlanco').addEventListener('click', () => { pausar(); nuevoBlanco(); pintarControles(); recalcular(); dibujarTodo(); });
  $('chkCalcula').addEventListener('change', (e) => {
    pausar(); estado.calcula = e.target.checked;
    if (estado.calcula) estado.tiro.v = estado.blanco.vSol;
    pintarControles(); recalcular(); dibujarTodo();
  });

  // ---------- Clic y arrastre sobre las gráficas ----------
  GRAFICAS.forEach(g => {
    const cv = $(g.id);
    let abajo = false;
    const tDesde = (e) => { const r = cv.getBoundingClientRect(); return Gr.geometria(r.width, r.height, estado.ejes[g.mag], estado.ejes.t.max).T(e.clientX - r.left); };
    cv.addEventListener('pointerdown', (e) => { abajo = true; cv.setPointerCapture(e.pointerId); pausar(); estado.lanzado = true; irA(tDesde(e)); });
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
  function ponerModo(modo) {
    pausar();
    estado.modo = modo;
    document.querySelectorAll('.solo-explorar').forEach(el => { el.hidden = modo !== 'explorar'; });
    document.querySelectorAll('.solo-construir').forEach(el => { el.hidden = modo !== 'construir'; });
    if (modo === 'construir' && !estado.blanco) nuevoBlanco();
    pintarControles(); recalcular(); dibujarTodo();
  }
  document.querySelectorAll('.pestanas [role="tab"]').forEach(tab => tab.addEventListener('click', () => {
    const parte = tab.dataset.panel;
    document.querySelectorAll('.pestanas [role="tab"]').forEach(x => x.setAttribute('aria-selected', String(x === tab)));
    $('panel-visor').hidden = parte === 'practicar';
    $('panel-practicar').hidden = parte !== 'practicar';
    $('panel-visor').setAttribute('aria-labelledby', tab.id);
    document.querySelectorAll('.observar[open]').forEach(d => { d.open = false; });
    if (parte === 'practicar') { pausar(); window.dispatchEvent(new CustomEvent('proy-practicar', { detail: true })); }
    else { window.dispatchEvent(new CustomEvent('proy-practicar', { detail: false })); ponerModo(parte); }
  }));

  // ---------- Inicio ----------
  pintarControles();
  recalcular();
  new ResizeObserver(() => dibujarTodo()).observe(document.querySelector('.taller'));
  window.addEventListener('resize', dibujarTodo);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(dibujarTodo);
  dibujarTodo();

  // Para las pruebas automáticas
  window.__simProy = { estado, irA, dibujarTodo, ponerNivel, ponerModo, recalcular, reproducir, pausar, nuevoBlanco, registrarIntento };
})();
