/* Simulación A.1 · Un movimiento, tres gráficas — partes Explorar y Construir
   Explorar: nivel 1 (velocidad constante), nivel 2 (con aceleración) y nivel 3 (por tramos).
   Construir: hasta 6 tramos con tabla y puntos arrastrables en la gráfica v–t.
   La física sale de comun/cinematica.js (valores exactos, sin aproximaciones numéricas). */

(function () {
  'use strict';
  const { Movimiento, numero } = window.Cinematica;
  const D = window.A1Dibujo;
  const { COL, fmt, LETRAS } = D;
  const $ = (id) => document.getElementById(id);

  const PISTA = { min: -30, max: 30 };
  const TMAX = 10;                 // s (eje de tiempo de las gráficas)
  const V_CONSTRUIR = 6;           // m s⁻¹ (límite de la gráfica v–t al construir)
  const MAX_TRAMOS = 6;
  const V = '<span class="var">v</span>', U = '<span class="var">u</span>', A = '<span class="var">a</span>', S = '<span class="var">s</span>', T = '<span class="var">t</span>';

  // ---------- Configuración de los niveles de Explorar ----------
  const NIVELES = {
    1: {
      rotV: 'Velocidad ' + V, des: { s0: [-10, 10, 1], v: [-2, 2, 0.1] }, usaA: false,
      ini: { s0: -10, v: 1.5, a: 0 },
      casos: [
        { html: 'En reposo', p: { s0: 0, v: 0, a: 0 } },
        { html: 'Derecha<br>(' + V + ' &gt; 0)', p: { s0: -10, v: 2, a: 0 } },
        { html: 'Izquierda<br>(' + V + ' &lt; 0)', p: { s0: 10, v: -2, a: 0 } }
      ],
      observar: [
        `Aumenta y disminuye ${V}. ¿Qué le pasa a la inclinación de la gráfica ${S}–${T}? ¿Y a la gráfica ${V}–${T}?`,
        'Pon una velocidad negativa. ¿Hacia dónde se mueve el carrito? ¿Cómo cambia cada gráfica?',
        `Cambia solo ${S}₀. ¿Qué gráficas cambian y cuáles no? ¿Por qué?`,
        `Activa «Área» y pausa en un instante. Compara el área bajo la ${V}–${T} con el desplazamiento.`,
        'Activa «Huellas». ¿Cómo quedan las marcas de cada segundo cuando la velocidad es constante?',
        '¿Cuándo coinciden el desplazamiento y la distancia recorrida? ¿Cuándo no?'
      ]
    },
    2: {
      rotV: 'Velocidad inicial ' + U, des: { s0: [-10, 10, 1], v: [-4, 4, 0.5], a: [-1, 1, 0.1] }, usaA: true,
      ini: { s0: -10, v: 0, a: 0.5 },
      casos: [
        { html: 'Acelera', p: { s0: -10, v: 0, a: 0.5 } },
        { html: 'Frena', p: { s0: -10, v: 4, a: -0.4 } },
        { html: 'Va y vuelve', p: { s0: -10, v: 4, a: -0.8 } },
        { html: 'Acelera ←', p: { s0: 10, v: 0, a: -0.5 } }
      ],
      observar: [
        `Con ${U} = 0, aumenta ${A}. ¿Cómo cambia la forma de cada una de las tres gráficas?`,
        `Elige «Frena». ¿Qué signos tienen ${V} y ${A}? ¿Y si el carrito frena mientras va hacia la izquierda?`,
        `En «Va y vuelve», ¿cuánto vale ${V} en el punto más alejado? ¿Y ${A} en ese mismo instante?`,
        `Activa «Pendiente». ¿Qué magnitud da la pendiente de la ${S}–${T}? ¿Y la de la ${V}–${T}?`,
        `Activa «Área». ¿Con qué coincide el área bajo la ${V}–${T}? ¿Qué pasa con el área cuando ${V} es negativa?`,
        'Activa «Huellas». ¿Qué les pasa a las marcas cuando el carrito acelera? ¿Y cuando frena?',
        'Activa «Vel. media» y acerca los dos puntos hasta casi juntarlos. ¿A qué se parece entonces la secante?',
        `¿En qué casos la rapidez aumenta aunque ${A} sea negativa?`
      ]
    },
    3: {
      casos: [
        { html: 'Arranca y frena', def: { s0: -12, u: 0, tramos: [{ duracion: 4, a: 1 }, { duracion: 2, a: 0 }, { duracion: 4, a: -1 }] } },
        { html: 'Va, espera y vuelve', def: { s0: -5, u: 2, tramos: [{ duracion: 3, a: 0 }, { duracion: 1, a: -2 }, { duracion: 2, a: 0 }, { duracion: 1, a: -2 }, { duracion: 3, a: 0 }] } },
        { html: 'Frena y regresa', def: { s0: -5, u: 4, tramos: [{ duracion: 6, a: -1 }, { duracion: 4, a: 0 }] } },
        { html: 'Dos aceleraciones', def: { s0: -20, u: 0, tramos: [{ duracion: 4, a: 0.5 }, { duracion: 4, a: 1 }, { duracion: 2, a: 0 }] } }
      ],
      observar: [
        `Activa «Predecir», elige un movimiento y míralo. Dibuja en tu cuaderno sus tres gráficas y luego pulsa «Revelar».`,
        `¿Cómo se ve un tramo en reposo en la ${V}–${T}? ¿Y en la ${S}–${T}?`,
        'En «Va, espera y vuelve», compara el desplazamiento total con la distancia recorrida.',
        `¿En qué instantes cambia ${A}? ¿Cambia ${V} de golpe en esos instantes?`,
        'Con «Área», halla el desplazamiento de cada tramo y compáralo con lo que ves en la pista.'
      ]
    }
  };
  const RETOS = [
    'Haz que el carrito termine exactamente donde empezó.',
    'Consigue un desplazamiento de 0 m con una distancia recorrida de 16 m.',
    `Construye un movimiento en el que ${A} sea negativa pero la rapidez aumente.`,
    'Haz que el carrito pase 2 s en reposo en mitad del recorrido.',
    `Consigue que la ${S}–${T} tenga forma de «montaña» (sube y baja) con un solo tramo.`
  ];
  const PLAN_INICIAL = { s0: -15, u: 0, tramos: [{ duracion: 3, a: 1 }, { duracion: 4, a: 0 }, { duracion: 3, a: -1 }] };

  // ---------- Estado ----------
  const estado = {
    modo: 'explorar', nivel: 1,
    par: { 1: Object.assign({}, NIVELES[1].ini), 2: Object.assign({}, NIVELES[2].ini) },
    caso3: 0,
    plan: JSON.parse(JSON.stringify(PLAN_INICIAL)),
    mov: null, anterior: null, pts: null, ptsAnt: null, ejes: null,
    t: 0, jugando: false, rapidez: 1,
    ver: { anterior: true, completa: false, pendiente: false, area: false, secante: false, huellas: false, prediccion: false },
    sec: [2, 6],                   // instantes de los dos puntos de la secante
    revelado: false                // modo predicción: gráficas ya mostradas
  };
  const escena = D.crearEscena($('escena'));
  const GRAFICAS = [{ id: 'gS', mag: 's' }, { id: 'gV', mag: 'v' }, { id: 'gA', mag: 'a' }];

  // ---------- Movimiento actual ----------
  function movimientoDe(modo, nivel) {
    if (modo === 'construir') return new Movimiento(estado.plan.s0, estado.plan.u, estado.plan.tramos);
    if (nivel === 3) { const d = NIVELES[3].casos[estado.caso3].def; return new Movimiento(d.s0, d.u, d.tramos); }
    const p = estado.par[nivel];
    let m = new Movimiento(p.s0, p.v, [{ duracion: TMAX, a: nivel === 2 ? p.a : 0 }]);
    const tc = m.primerCruce(PISTA.min, PISTA.max);        // si llega al final de la pista, el movimiento termina ahí
    if (tc !== null && tc < TMAX) m = m.recortar(tc);
    return m;
  }
  function puntosDe(m) { return { s: D.muestrear(m, 's'), v: D.muestrear(m, 'v'), a: D.muestrear(m, 'a') }; }

  function recalcular(guardarAnterior) {
    const nuevo = movimientoDe(estado.modo, estado.nivel);
    if (guardarAnterior && estado.mov) { estado.anterior = estado.mov; estado.ptsAnt = estado.pts; }
    estado.mov = nuevo; estado.pts = puntosDe(nuevo);
    estado.t = Math.min(estado.t, nuevo.duracion);
    estado.revelado = false;
    estado.sec[1] = Math.min(estado.sec[1], nuevo.duracion);
    estado.sec[0] = Math.max(0, Math.min(estado.sec[0], estado.sec[1] - 0.5));
    calcularEjes();
    $('barraTiempo').max = nuevo.duracion;
    pintarTablaTramos();
  }
  function calcularEjes() {
    const conAnt = estado.modo === 'explorar' && estado.ver.anterior && estado.ptsAnt;
    const mx = (mag) => Math.max(D.maxAbsPuntos(estado.pts[mag]), conAnt ? D.maxAbsPuntos(estado.ptsAnt[mag]) : 0);
    estado.ejes = {
      s: { min: PISTA.min, max: PISTA.max, mayor: 10, menor: 5 },
      v: estado.modo === 'construir' ? D.ejeAuto('v', V_CONSTRUIR) : D.ejeAuto('v', mx('v')),
      a: D.ejeAuto('a', mx('a'))
    };
  }

  // ---------- Dibujo ----------
  function velocidadesNodo(m) { const r = m.tramos.map(tr => tr.v0); r.push(m.v(m.duracion)); return r; }

  // Modo predicción: las gráficas quedan ocultas hasta pulsar «Revelar»
  function oculto() { return estado.modo === 'explorar' && estado.ver.prediccion && !estado.revelado; }

  function opcionesGrafica(mag) {
    const m = estado.mov, t = estado.t, construir = estado.modo === 'construir';
    if (oculto()) {
      return { mag, eje: estado.ejes[mag], tMax: TMAX, curvas: [], extraArr: extraArr(),
        vacio: '¿Qué forma tendrá esta gráfica?\nPiénsalo y pulsa «Revelar».' };
    }
    const valor = mag === 's' ? m.s(t) : mag === 'v' ? m.v(t) : m.a(t);
    const curvas = [];
    if (!construir && estado.ver.anterior && estado.ptsAnt) curvas.push({ puntos: estado.ptsAnt[mag], color: COL.gris, ancho: 2, raya: [6, 4] });
    if (construir || estado.ver.completa) curvas.push({ puntos: estado.pts[mag], alfa: 0.3 });
    curvas.push({ puntos: estado.pts[mag], hasta: t });
    const o = { mag, eje: estado.ejes[mag], tMax: TMAX, curvas, cursor: { t, y: valor }, tramos: m.tramos.length > 1 ? m.tramos : null, extraArr: extraArr() };
    if (estado.ver.pendiente && mag === 's') {
      o.tangente = { t, y: valor, m: m.v(t), color: COL.vel, texto: [['pendiente = ', false], ['v', true], [' = ' + numero(m.v(t), 2) + ' m s⁻¹', false]] };
    }
    if (estado.ver.secante && mag === 's') {
      const [t1, t2] = estado.sec, y1 = m.s(t1), y2 = m.s(t2);
      o.secante = { t1, y1, t2, y2, color: COL.violeta,
        texto: [['velocidad media = ' + numero((y2 - y1) / (t2 - t1), 2) + ' m s⁻¹', false]] };
    }
    if (estado.ver.pendiente && mag === 'v') {
      o.tangente = { t, y: valor, m: m.a(t), color: COL.ace, texto: [['pendiente = ', false], ['a', true], [' = ' + numero(m.a(t), 2) + ' m s⁻²', false]] };
    }
    if (estado.ver.area && mag === 'v') {
      o.area = { puntos: estado.pts.v, hasta: t, colorPos: 'rgba(194,94,12,0.22)', colorNeg: 'rgba(91,75,138,0.26)', colorTexto: COL.des,
        texto: [['área = Δ', false], ['s', true], [' = ' + numero(m.desplazamiento(t), 2) + ' m', false]] };
    }
    if (estado.ver.area && mag === 'a') {
      o.area = { puntos: estado.pts.a, hasta: t, colorPos: 'rgba(192,0,0,0.16)', colorNeg: 'rgba(91,75,138,0.26)', colorTexto: COL.ace,
        texto: [['área = Δ', false], ['v', true], [' = ' + numero(m.v(t) - m.v(0), 2) + ' m s⁻¹', false]] };
    }
    if (construir && mag === 'v') {
      const vs = velocidadesNodo(m);
      o.nodos = vs.map((y, i) => ({ t: i < m.tramos.length ? m.tramos[i].t0 : m.duracion, y }));
    }
    return o;
  }

  // con «Pendiente» y «Área» a la vez, la v–t lleva dos rótulos: las tres gráficas dejan una línea más arriba
  function extraArr() {
    if (oculto()) return 0;
    const v = estado.ver;
    const lineas = Math.max((v.pendiente ? 1 : 0) + (v.secante ? 1 : 0), (v.pendiente ? 1 : 0) + (v.area ? 1 : 0));
    return lineas > 1 ? 17 : 0;
  }

  function textoRapidez(v, a) {
    if (Math.abs(v) < 1e-9) return a === 0 ? 'en reposo' : 'cero en este instante';
    if (a === 0) return 'constante';
    return v * a > 0 ? 'aumenta' : 'disminuye';
  }

  let filaActual = -1;
  function actualizarTextos() {
    const m = estado.mov, t = estado.t, fin = t >= m.duracion - 1e-9;
    $('valT').textContent = numero(t, 2);
    $('valS').textContent = numero(m.s(t), 2);
    $('valV').textContent = numero(m.v(t), 2);
    $('valA').textContent = numero(m.a(t), 2);
    $('valDes').textContent = numero(m.desplazamiento(t), 2);
    $('valDist').textContent = numero(m.distancia(t), 2);
    $('valRap').textContent = textoRapidez(m.v(t), m.a(t));
    $('barraTiempo').value = t;
    $('btnPlay').setAttribute('aria-label', estado.jugando ? 'Pausar' : 'Reproducir');
    $('txtPlay').textContent = estado.jugando ? 'Pausar' : (fin ? 'Repetir' : 'Reproducir');
    $('icoPlay').hidden = estado.jugando;
    $('icoPausa').hidden = !estado.jugando;
    const i = m.tramos.length > 1 ? m.indice(t) : -1;
    if (i !== filaActual) {
      filaActual = i;
      ['tablaTramos', 'edTabla'].forEach(id => Array.from($(id).tBodies[0].rows).forEach((tr, k) => tr.classList.toggle('actual', k === i)));
    }
  }

  // Posición del carrito en cada segundo entero ya transcurrido
  function huellas() {
    const r = [];
    for (let k = 0; k <= estado.t + 1e-9 && k <= estado.mov.duracion + 1e-9; k++) r.push(estado.mov.s(k));
    return r;
  }
  function pintarRevelar() {
    const b = $('btnRevelar');
    b.hidden = !(estado.modo === 'explorar' && estado.ver.prediccion);
    b.textContent = estado.revelado ? 'Ocultar' : 'Revelar';
  }

  function dibujarTodo() {
    if ($('panel-visor').hidden) return;
    pintarRevelar();
    const m = estado.mov;
    escena.dibujar({
      mov: m, t: estado.t, jugando: estado.jugando, pista: PISTA,
      vMax: estado.ejes.v.max, aMax: estado.ejes.a.max,
      aviso: m.recortado && estado.t >= m.duracion - 1e-9 ? 'Fin de la pista' : null,
      huellas: estado.ver.huellas ? huellas() : null
    });
    GRAFICAS.forEach(g => D.dibujarGrafica($(g.id), opcionesGrafica(g.mag)));
    actualizarTextos();
  }

  // ---------- Reproducción ----------
  let ultimo = null;
  function cuadro(ahora) {
    if (!estado.jugando) { ultimo = null; return; }
    const fin = estado.mov.duracion;
    if (ultimo !== null) {
      estado.t = Math.min(fin, estado.t + (ahora - ultimo) / 1000 * estado.rapidez);
      if (estado.t >= fin) estado.jugando = false;
    }
    ultimo = ahora;
    dibujarTodo();
    if (estado.jugando) requestAnimationFrame(cuadro); else ultimo = null;
  }
  function reproducir() {
    if (estado.t >= estado.mov.duracion - 1e-9) estado.t = 0;
    if (!estado.jugando) { estado.jugando = true; ultimo = null; requestAnimationFrame(cuadro); }
    actualizarTextos();
  }
  function pausar() { estado.jugando = false; actualizarTextos(); }
  function irA(t) { estado.t = Math.min(estado.mov.duracion, Math.max(0, Math.round(t * 1000) / 1000)); dibujarTodo(); }

  $('btnPlay').addEventListener('click', () => (estado.jugando ? pausar() : reproducir()));
  $('btnReiniciar').addEventListener('click', () => { pausar(); irA(0); });
  $('btnAtras').addEventListener('click', () => { pausar(); irA(estado.t - 0.1); });
  $('btnAdelante').addEventListener('click', () => { pausar(); irA(estado.t + 0.1); });
  $('barraTiempo').addEventListener('input', (e) => { pausar(); irA(Number(e.target.value)); });
  $('rapidez').addEventListener('change', (e) => { estado.rapidez = Number(e.target.value); });

  // ---------- Explorar: niveles, casos y deslizadores ----------
  function pintarControles() {
    const n = estado.nivel, cfg = NIVELES[n];
    document.querySelectorAll('.nivel').forEach(b => {
      const activo = Number(b.dataset.nivel) === n;
      b.classList.toggle('activo', activo); b.setAttribute('aria-pressed', String(activo));
    });
    // casos
    const cont = $('casos');
    cont.innerHTML = '';
    cont.style.gridTemplateColumns = `repeat(${n === 1 ? 3 : n === 2 ? 4 : 2}, 1fr)`;
    cfg.casos.forEach((c, i) => {
      const b = document.createElement('button');
      b.className = 'boton caso'; b.innerHTML = c.html; b.dataset.i = i;
      cont.appendChild(b);
    });
    // deslizadores
    const hayDes = n !== 3;
    $('grupoS0').hidden = !hayDes; $('grupoV').hidden = !hayDes; $('grupoA').hidden = !cfg.usaA;
    $('tablaTramos').hidden = n !== 3;
    if (hayDes) {
      $('rotV').innerHTML = cfg.rotV;
      const pon = (id, r, val) => { const el = $(id); el.min = r[0]; el.max = r[1]; el.step = r[2]; el.value = val; };
      pon('desS0', cfg.des.s0, estado.par[n].s0);
      pon('desV', cfg.des.v, estado.par[n].v);
      if (cfg.usaA) pon('desA', cfg.des.a, estado.par[n].a);
    }
    marcarCaso();
    pintarObservar();
  }
  function marcarCaso() {
    const n = estado.nivel, p = estado.par[n];
    document.querySelectorAll('#casos .caso').forEach((b, i) => {
      const c = NIVELES[n].casos[i];
      const activo = n === 3 ? i === estado.caso3 : (c.p.s0 === p.s0 && c.p.v === p.v && c.p.a === p.a);
      b.classList.toggle('activo', activo);
    });
    if (n !== 3) {
      $('outS0').textContent = numero(p.s0, 0) + ' m';
      $('outV').textContent = numero(p.v, 1) + ' m s⁻¹';
      $('outA').textContent = numero(p.a, 1) + ' m s⁻²';
    }
  }
  function pintarObservar() {
    const construir = estado.modo === 'construir';
    $('rotObservar').textContent = construir ? 'Retos' : 'Para observar';
    $('listaObservar').innerHTML = (construir ? RETOS : NIVELES[estado.nivel].observar).map(x => `<li>${x}</li>`).join('');
  }
  function pintarTablaTramos() {
    const cuerpo = $('tablaTramos').tBodies[0];
    cuerpo.innerHTML = estado.mov.tramos.map((tr, i) =>
      `<tr><td>${LETRAS[i]}</td><td>${fmt(tr.t0)} – ${fmt(tr.t1)}</td><td>${fmt(tr.a)}</td></tr>`).join('');
    filaActual = -1;
  }

  function ponerNivel(n) {
    pausar();
    estado.nivel = n; estado.anterior = null; estado.ptsAnt = null; estado.t = 0;
    pintarControles(); recalcular(false); dibujarTodo();
  }
  document.querySelectorAll('.nivel').forEach(b => b.addEventListener('click', () => ponerNivel(Number(b.dataset.nivel))));

  $('casos').addEventListener('click', (e) => {
    const b = e.target.closest('.caso'); if (!b) return;
    const n = estado.nivel, c = NIVELES[n].casos[Number(b.dataset.i)];
    pausar();
    if (n === 3) estado.caso3 = Number(b.dataset.i);
    else {
      Object.assign(estado.par[n], c.p);
      $('desS0').value = c.p.s0; $('desV').value = c.p.v; $('desA').value = c.p.a;
    }
    estado.t = 0; recalcular(true); marcarCaso(); dibujarTodo(); reproducir();
  });

  let arrastrando = false;
  function alMoverDeslizador() {
    const n = estado.nivel, p = estado.par[n];
    const r1 = (x) => Math.round(x * 10) / 10;
    const nuevo = { s0: Number($('desS0').value), v: r1(Number($('desV').value)), a: NIVELES[n].usaA ? r1(Number($('desA').value)) : 0 };
    if (nuevo.s0 === p.s0 && nuevo.v === p.v && nuevo.a === p.a) return;
    const guardar = !arrastrando;                 // el movimiento anterior se guarda una sola vez al empezar a arrastrar
    arrastrando = true;
    pausar();
    Object.assign(p, nuevo);
    estado.t = 0; recalcular(guardar); marcarCaso(); dibujarTodo();
  }
  ['desS0', 'desV', 'desA'].forEach(id => {
    $(id).addEventListener('input', alMoverDeslizador);
    $(id).addEventListener('change', () => { arrastrando = false; reproducir(); });
  });

  [['chkAnterior', 'anterior'], ['chkCompleta', 'completa'], ['chkPendiente', 'pendiente'], ['chkArea', 'area'],
   ['chkSecante', 'secante'], ['chkHuellas', 'huellas'], ['chkPrediccion', 'prediccion']].forEach(([id, k]) => {
    estado.ver[k] = $(id).checked;
    $(id).addEventListener('change', (e) => {
      estado.ver[k] = e.target.checked;
      if (k === 'prediccion') estado.revelado = false;
      calcularEjes(); dibujarTodo();
    });
  });
  $('btnRevelar').addEventListener('click', () => { estado.revelado = !estado.revelado; dibujarTodo(); });

  // ---------- Construir: tabla de tramos ----------
  function paso(campo, i, valor, unidad) {
    return `<span class="paso"><button type="button" data-campo="${campo}" data-i="${i}" data-d="-1" aria-label="Disminuir">−</button>` +
      `<output>${valor}${unidad ? ' ' + unidad : ''}</output>` +
      `<button type="button" data-campo="${campo}" data-i="${i}" data-d="1" aria-label="Aumentar">+</button></span>`;
  }
  function pintarEditor() {
    const p = estado.plan;
    $('edIniciales').innerHTML =
      `<label>${S}₀ / m ${paso('s0', 0, numero(p.s0, 0))}</label><label>${U} / m s⁻¹ ${paso('u', 0, fmt(p.u))}</label>`;
    $('edCuerpo').innerHTML = p.tramos.map((tr, i) =>
      `<tr><td>${LETRAS[i]}</td><td>${paso('dur', i, fmt(tr.duracion))}</td><td>${paso('a', i, fmt(tr.a))}</td></tr>`).join('');
    $('edMas').disabled = p.tramos.length >= MAX_TRAMOS;
    $('edMenos').disabled = p.tramos.length <= 1;
    filaActual = -1;
  }
  function validarPlan(p) {
    const total = p.tramos.reduce((x, tr) => x + tr.duracion, 0);
    if (total > TMAX + 1e-9) return 'El movimiento no puede durar más de 10 s.';
    if (p.tramos.some(tr => tr.duracion < 0.5 - 1e-9)) return 'Cada tramo dura al menos 0,5 s.';
    const m = new Movimiento(p.s0, p.u, p.tramos);
    if (velocidadesNodo(m).some(v => Math.abs(v) > V_CONSTRUIR + 1e-9)) return 'La velocidad no puede pasar de 6 m s⁻¹ en esta gráfica.';
    const [mn, mx] = m.rangoS();
    if (mn < PISTA.min - 1e-9 || mx > PISTA.max + 1e-9) return 'Con ese cambio el carrito se saldría de la pista.';
    return null;
  }
  let relojAviso = null;
  function aviso(texto) {
    $('edAviso').textContent = texto || '';
    clearTimeout(relojAviso);
    if (texto) relojAviso = setTimeout(() => { $('edAviso').textContent = ''; }, 3500);
  }
  function intentarPlan(nuevo) {
    const error = validarPlan(nuevo);
    if (error) { aviso(error); return false; }
    aviso('');
    estado.plan = nuevo;
    pausar(); recalcular(false); pintarEditor(); dibujarTodo();
    return true;
  }
  const copiaPlan = () => JSON.parse(JSON.stringify(estado.plan));
  const medio = (x) => Math.round(x * 2) / 2;

  $('editor').addEventListener('click', (e) => {
    const b = e.target.closest('button'); if (!b) return;
    const p = copiaPlan();
    if (b.id === 'edMas') {
      p.tramos.push({ duracion: 1, a: 0 });
      if (validarPlan(p)) { p.tramos[p.tramos.length - 1].duracion = 0.5; }
      intentarPlan(p); return;
    }
    if (b.id === 'edMenos') { p.tramos.pop(); intentarPlan(p); return; }
    if (b.id === 'edReiniciar') { estado.t = 0; intentarPlan(JSON.parse(JSON.stringify(PLAN_INICIAL))); return; }
    const campo = b.dataset.campo, i = Number(b.dataset.i), d = Number(b.dataset.d);
    if (!campo) return;
    if (campo === 's0') p.s0 = Math.max(-25, Math.min(25, p.s0 + d));
    else if (campo === 'u') p.u = medio(p.u + 0.5 * d);
    else if (campo === 'dur') p.tramos[i].duracion = Math.max(0.5, medio(p.tramos[i].duracion + 0.5 * d));
    else if (campo === 'a') {
      // al siguiente múltiplo de 0,5 en el sentido pedido (a puede no ser «redonda» después de arrastrar un punto)
      const a = p.tramos[i].a;
      p.tramos[i].a = Math.max(-6, Math.min(6, d > 0 ? Math.floor(a * 2 + 1e-9) / 2 + 0.5 : Math.ceil(a * 2 - 1e-9) / 2 - 0.5));
    }
    intentarPlan(p);
  });

  // Arrastrar un punto de la v–t: cambia la velocidad en ese instante y, con ella, la aceleración de los tramos vecinos
  function moverNodo(i, y) {
    const p = copiaPlan(), vs = velocidadesNodo(estado.mov), n = p.tramos.length;
    y = Math.max(-V_CONSTRUIR, Math.min(V_CONSTRUIR, medio(y)));
    if (vs[i] === y) return;
    if (i === 0) p.u = y; else p.tramos[i - 1].a = (y - vs[i - 1]) / p.tramos[i - 1].duracion;
    if (i < n) p.tramos[i].a = (vs[i + 1] - y) / p.tramos[i].duracion;
    intentarPlan(p);
  }

  // ---------- Clic y arrastre sobre las gráficas ----------
  GRAFICAS.forEach(g => {
    const cv = $(g.id);
    let abajo = false, nodo = -1, punto = -1;
    const geo = () => { const r = cv.getBoundingClientRect(); return { r, G: D.geometria(r.width, r.height, estado.ejes[g.mag], TMAX, false, extraArr()) }; };
    cv.addEventListener('pointerdown', (e) => {
      const { r, G } = geo(), x = e.clientX - r.left, y = e.clientY - r.top;
      abajo = true; nodo = -1; punto = -1; cv.setPointerCapture(e.pointerId); pausar();
      if (g.mag === 's' && estado.ver.secante && !oculto()) {       // ¿se tomó un punto de la secante?
        let mejor = 18;
        estado.sec.forEach((ts, i) => {
          const d = Math.hypot(G.X(ts) - x, G.Y(estado.mov.s(ts)) - y);
          if (d < mejor) { mejor = d; punto = i; }
        });
        if (punto >= 0) return;
      }
      if (estado.modo === 'construir' && g.mag === 'v') {
        const m = estado.mov, vs = velocidadesNodo(m);
        let mejor = 18;
        vs.forEach((v, i) => {
          const d = Math.hypot(G.X(i < m.tramos.length ? m.tramos[i].t0 : m.duracion) - x, G.Y(v) - y);
          if (d < mejor) { mejor = d; nodo = i; }
        });
      }
      if (nodo < 0) irA(G.T(x));
    });
    cv.addEventListener('pointermove', (e) => {
      if (!abajo) return;
      const { r, G } = geo();
      if (punto >= 0) {
        // el punto se mueve sobre la curva, de 0,1 en 0,1 s, sin cruzarse con el otro
        let ts = Math.round(G.T(e.clientX - r.left) * 10) / 10;
        const fin = estado.mov.duracion;
        ts = punto === 0 ? Math.max(0, Math.min(ts, estado.sec[1] - 0.2)) : Math.min(fin, Math.max(ts, estado.sec[0] + 0.2));
        if (ts !== estado.sec[punto]) { estado.sec[punto] = ts; dibujarTodo(); }
      } else if (nodo >= 0) moverNodo(nodo, G.V(e.clientY - r.top)); else irA(G.T(e.clientX - r.left));
    });
    const soltar = () => { abajo = false; nodo = -1; punto = -1; };
    cv.addEventListener('pointerup', soltar);
    cv.addEventListener('pointercancel', soltar);
  });

  // ---------- Teclado ----------
  document.addEventListener('keydown', (e) => {
    const tag = (e.target.tagName || '').toLowerCase();
    if (tag === 'input' || tag === 'select' || tag === 'button' || tag === 'summary') return;
    if ($('panel-visor').hidden) return;
    if (e.code === 'Space') { e.preventDefault(); estado.jugando ? pausar() : reproducir(); }
    else if (e.key === 'ArrowRight') { pausar(); irA(estado.t + 0.1); }
    else if (e.key === 'ArrowLeft') { pausar(); irA(estado.t - 0.1); }
  });

  // ---------- Pestañas ----------
  function ponerModo(modo) {
    pausar();
    estado.modo = modo; estado.anterior = null; estado.ptsAnt = null; estado.t = 0;
    document.querySelectorAll('.solo-explorar').forEach(el => { el.hidden = modo !== 'explorar'; });
    document.querySelectorAll('.solo-construir').forEach(el => { el.hidden = modo !== 'construir'; });
    $('ayudaGraficas').textContent = modo === 'construir'
      ? 'Arrastra los puntos de la gráfica v–t o cambia la tabla. Clic en una gráfica: ir a ese instante.'
      : 'Clic en una gráfica: ir a ese instante.';
    if (modo === 'construir') pintarEditor(); else pintarControles();
    pintarObservar();
    recalcular(false);
    dibujarTodo();
  }
  document.querySelectorAll('.pestanas [role="tab"]').forEach(tab => tab.addEventListener('click', () => {
    const parte = tab.dataset.panel;
    document.querySelectorAll('.pestanas [role="tab"]').forEach(x => x.setAttribute('aria-selected', String(x === tab)));
    $('panel-visor').hidden = parte === 'practicar';
    $('panel-practicar').hidden = parte !== 'practicar';
    $('panel-visor').setAttribute('aria-labelledby', tab.id);
    document.querySelectorAll('.observar[open]').forEach(d => { d.open = false; });
    if (parte === 'practicar') { pausar(); window.dispatchEvent(new CustomEvent('a1-practicar', { detail: true })); }
    else { window.dispatchEvent(new CustomEvent('a1-practicar', { detail: false })); ponerModo(parte); }
  }));

  // ---------- Inicio ----------
  pintarControles();
  recalcular(false);
  new ResizeObserver(() => dibujarTodo()).observe(document.querySelector('.explorar'));
  window.addEventListener('resize', dibujarTodo);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(dibujarTodo);
  dibujarTodo();

  // Para las pruebas automáticas
  window.__simA1 = { estado, irA, dibujarTodo, ponerNivel, ponerModo, intentarPlan, moverNodo, recalcular, reproducir, pausar, NIVELES };
})();
