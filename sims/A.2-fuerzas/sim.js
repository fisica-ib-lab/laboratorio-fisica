/* Simulación A.2 · Diagramas de cuerpo libre y segunda ley — parte Explorar (laboratorio libre con siete montajes).
   La física sale de comun/dinamica.js; el dibujo, de escena.js. */

(function () {
  'use strict';
  const { numero } = window.Cinematica;
  const Din = window.Dinamica, G = Din.G;
  const Gr = window.Graficas, Es = window.FuerzasEscena;
  const { COL } = Gr;
  const $ = (id) => document.getElementById(id);
  const v_ = (x) => `<span class="var">${x}</span>`;
  const F_ = (sub) => `${v_('F')}<sub>${sub}</sub>`;
  const MU_S = `${v_('μ')}<sub>s</sub>`, MU_D = `${v_('μ')}<sub>d</sub>`;
  const n2 = (x) => Es.N1(x);

  /* ---------- Controles comunes ---------- */
  const cMasa = (id, rot, min, max, paso, ini) => ({ id, tipo: 'rango', rotulo: rot, min, max, paso, unidad: 'kg', dec: paso < 0.1 ? 2 : 1, ini });
  const cMus = { id: 'mus', tipo: 'rango', rotulo: `Coef. estático ${MU_S}`, min: 0, max: 1, paso: 0.05, dec: 2, ini: 0.5 };
  const cMud = { id: 'mud', tipo: 'rango', rotulo: `Coef. dinámico ${MU_D}`, min: 0, max: 1, paso: 0.05, dec: 2, ini: 0.3 };
  const ACEL_LISTA = [-9.81, -9, -8, -7, -6, -5, -4, -3, -2.5, -2, -1.5, -1, -0.5, 0, 0.5, 1, 1.5, 2, 2.5, 3, 4, 5];

  /* ---------- Las siete escenas ---------- */
  const ESCENAS = {
    horizontal: {
      nombre: 'Bloque en la mesa',
      controles: [
        cMasa('m', `Masa del bloque ${v_('m')}`, 0.5, 5, 0.5, 2),
        { id: 'F', tipo: 'rango', rotulo: `Fuerza del dinamómetro ${F_('H')}`, min: 0, max: 30, paso: 0.5, unidad: 'N', dec: 1, ini: 12 },
        { id: 'ang', tipo: 'rango', rotulo: `Ángulo de la fuerza ${v_('θ')}`, min: 0, max: 60, paso: 5, unidad: '°', dec: 0, ini: 0 },
        { id: 'modo', tipo: 'opciones', rotulo: 'La fuerza', opciones: [['constante', 'es constante'], ['rampa', 'crece poco a poco'], ['soltar', 'se suelta en 1 s']], ini: 'constante' },
        Object.assign({}, cMus, { ini: 0.5 }), Object.assign({}, cMud, { ini: 0.3 }),
        { id: 'u', tipo: 'rango', rotulo: `Velocidad inicial ${v_('u')}`, min: 0, max: 2, paso: 0.5, unidad: 'm s⁻¹', dec: 1, ini: 0 }
      ],
      limites(par) { const s = Math.sin(par.ang * Math.PI / 180); return { F: s > 0 ? Math.min(30, Math.floor(0.95 * par.m * G / s * 2) / 2) : 30 }; },
      nota: `El dinamómetro es un resorte: tira del bloque con la fuerza elástica ${F_('H')} = ${v_('kx')} (${v_('k')} = 200 N m⁻¹).`
    },
    plano: {
      nombre: 'Plano inclinado',
      controles: [
        cMasa('m', `Masa del bloque ${v_('m')}`, 0.5, 5, 0.5, 1),
        { id: 'ang', tipo: 'rango', rotulo: `Inclinación ${v_('θ')}`, min: 0, max: 60, paso: 1, unidad: '°', dec: 0, ini: 30 },
        Object.assign({}, cMus, { ini: 0.4 }), Object.assign({}, cMud, { ini: 0.3 }),
        { id: 'u', tipo: 'rango', rotulo: `Velocidad inicial hacia arriba ${v_('u')}`, min: 0, max: 4, paso: 0.5, unidad: 'm s⁻¹', dec: 1, ini: 0 }
      ],
      nota: `Con ${v_('u')} = 0 el bloque sale en reposo desde arriba; con ${v_('u')} > 0 se lanza desde abajo hacia arriba del plano.`
    },
    ascensor: {
      nombre: 'Ascensor',
      controles: [
        cMasa('m', `Masa de la persona ${v_('m')}`, 30, 100, 5, 60),
        { id: 'modo', tipo: 'opciones', rotulo: 'Movimiento', opciones: [['subir', 'viaje de subida'], ['bajar', 'viaje de bajada'], ['constante', 'aceleración constante']], ini: 'subir' },
        { id: 'aV', tipo: 'rango', rotulo: `Arranque y frenado |${v_('a')}|`, min: 0.5, max: 3, paso: 0.5, unidad: 'm s⁻²', dec: 1, ini: 2, vis: (p) => p.modo !== 'constante' },
        { id: 'aC', tipo: 'lista', rotulo: `Aceleración del ascensor ${v_('a')}`, valores: ACEL_LISTA, unidad: 'm s⁻²', dec: 2, ini: 2, vis: (p) => p.modo === 'constante' }
      ],
      parFisica: (p) => ({ m: p.m, modo: p.modo, a: p.modo === 'constante' ? p.aC : p.aV }),
      nota: 'Se describe desde el edificio (sistema inercial). La balanza mide la fuerza normal que ejerce sobre la persona.'
    },
    atwood: {
      nombre: 'Máquina de Atwood',
      controles: [cMasa('m1', `Masa ${v_('m')}<sub>1</sub> (izquierda)`, 0.1, 2, 0.1, 0.4), cMasa('m2', `Masa ${v_('m')}<sub>2</sub> (derecha)`, 0.1, 2, 0.1, 0.6)],
      nota: 'Cuerda ideal y polea sin masa ni rozamiento: la tensión es la misma a los dos lados. El dinamómetro sostiene la polea.'
    },
    mesa: {
      nombre: 'Bloque y masa colgante',
      controles: [
        cMasa('m1', `Bloque sobre la mesa ${v_('m')}<sub>1</sub>`, 0.2, 2, 0.1, 1),
        cMasa('m2', `Masa colgante ${v_('m')}<sub>2</sub>`, 0.05, 1, 0.05, 0.5),
        Object.assign({}, cMus, { ini: 0.3 }), Object.assign({}, cMud, { ini: 0.2 })
      ],
      nota: 'Cuerda ideal y polea sin masa ni rozamiento.'
    },
    cuerdas: {
      nombre: 'Dos cuerdas',
      estatica: true,
      controles: [
        cMasa('m', `Masa del cuerpo ${v_('m')}`, 0.5, 3, 0.5, 1),
        { id: 'ang1', tipo: 'rango', rotulo: `Ángulo de la cuerda 1 ${v_('θ')}<sub>1</sub>`, min: 10, max: 80, paso: 5, unidad: '°', dec: 0, ini: 30 },
        { id: 'ang2', tipo: 'rango', rotulo: `Ángulo de la cuerda 2 ${v_('θ')}<sub>2</sub>`, min: 10, max: 80, paso: 5, unidad: '°', dec: 0, ini: 50 }
      ],
      nota: 'Ángulos medidos desde el techo. Cada cuerda lleva un dinamómetro que mide su tensión.'
    },
    esfera: {
      nombre: 'Esfera en un líquido',
      controles: [
        { id: 'material', tipo: 'opciones', rotulo: 'Esfera de', opciones: [['acero', 'acero (7800 kg m⁻³)'], ['vidrio', 'vidrio (2500 kg m⁻³)']], ini: 'acero' },
        { id: 'r', tipo: 'rango', rotulo: `Radio de la esfera ${v_('r')}`, min: 1.5, max: 3, paso: 0.5, unidad: 'mm', dec: 1, ini: 2.5 },
        { id: 'liquido', tipo: 'opciones', rotulo: 'Líquido', opciones: [['glicerina', 'glicerina'], ['ricino', 'aceite de ricino']], ini: 'glicerina' }
      ],
      nota: 'Se suelta desde el reposo, ya sumergida. La esfera se dibuja más grande que su tamaño real.'
    }
  };
  const ORDEN = ['horizontal', 'plano', 'ascensor', 'atwood', 'mesa', 'cuerdas', 'esfera'];

  const estado = {
    escena: 'horizontal', par: {}, mod: null, Fmax: 1, t: 0, jugando: false, rapidez: 1,
    ver: { fuerzas: true, valores: false, componentes: false }, lupa: false, puntos: null, aviso: ''
  };
  for (const k of ORDEN) { estado.par[k] = {}; for (const c of ESCENAS[k].controles) estado.par[k][c.id] = c.ini; }
  const P = () => estado.par[estado.escena];
  const CFG = () => ESCENAS[estado.escena];

  /* ---------- Cálculo ---------- */
  function ejeLindo(min, max) {
    for (const paso of [0.01, 0.02, 0.05, 0.1, 0.2, 0.5, 1, 2, 5, 10, 20, 50, 100, 200, 500, 1000]) {
      const lo = Math.floor(min / paso + 1e-9) * paso, hi0 = Math.ceil(max / paso - 1e-9) * paso, hi = hi0 > lo ? hi0 : lo + paso;
      if ((hi - lo) / paso <= 5.001) return { min: lo, max: hi, mayor: paso, menor: paso / 2 };
    }
    return { min, max, mayor: (max - min) / 4, menor: (max - min) / 8 };
  }
  function ejeTiempo(Tf) {
    for (const [mayor, menor] of [[0.01, 0.005], [0.02, 0.01], [0.05, 0.025], [0.1, 0.05], [0.2, 0.1], [0.5, 0.1], [1, 0.5], [2, 1], [5, 1], [10, 5], [20, 10]])
      if (Tf / mayor <= 8) return { max: Math.max(mayor, Math.ceil(Tf / mayor - 1e-9) * mayor), pasoH: { mayor, menor } };
    return { max: Tf, pasoH: { mayor: Tf / 4, menor: Tf / 8 } };
  }
  function recalcular() {
    const cfg = CFG(), par = cfg.parFisica ? cfg.parFisica(P()) : Object.assign({}, P());
    const mod = Din.crear(estado.escena, par);
    estado.mod = mod;
    estado.t = 0;
    // fuerza mayor de todo el experimento (fija la escala de las flechas) y puntos de las gráficas
    const N = 240, T = mod.T, pts = { v: [], t: [], F: [], Ff: [], FN: [], Fd: [], FbFd: [] };
    let Fmax = 0;
    for (let i = 0; i <= N; i++) {
      const t = cfg.estatica ? 0 : (estado.escena === 'esfera' ? T * Math.pow(i / N, 2) : T * i / N);
      const e = mod.estado(t);
      for (const c of e.cuerpos) for (const f of c.fuerzas) Fmax = Math.max(Fmax, f.mod);
      pts.t.push(t); pts.v.push([t, e.v]);
      if (estado.escena === 'horizontal') { pts.F.push([t, e.lecturas.dinamometro]); pts.Ff.push([t, e.lecturas.Ff]); }
      if (estado.escena === 'ascensor') pts.FN.push([t, e.lecturas.balanza]);
      if (estado.escena === 'esfera') { pts.Fd.push([t, e.lecturas.Fd]); pts.FbFd.push([t, e.lecturas.Fd + e.lecturas.Fb]); }
    }
    if (estado.escena === 'horizontal' && P().modo === 'rampa') {
      // F_f frente a F_H: con muestras finas para que el salto de estático a dinámico se vea vertical
      pts.FfF = [];
      for (let i = 0; i <= 1600; i++) { const t = T * i / 1600, e = mod.estado(t); pts.FfF.push([e.lecturas.dinamometro, e.lecturas.Ff, t]); }
    }
    if (estado.escena === 'esfera') {
      // instantes de paso por las marcas de 10 cm y 30 cm (bisección)
      const cruce = (x) => { let a = 0, b = T; for (let i = 0; i < 60; i++) { const m = (a + b) / 2; if (mod.estado(m).x < x) a = m; else b = m; } return (a + b) / 2; };
      pts.marcas = [cruce(0.1), cruce(0.3)];
    }
    estado.Fmax = Math.max(Fmax, 1e-6);
    estado.puntos = pts;
    let vmin = 0, vmax = 0; for (const p of pts.v) { vmin = Math.min(vmin, p[1]); vmax = Math.max(vmax, p[1]); }
    if (vmax - vmin < 1e-6) vmax = 1;
    estado.ejeV = ejeLindo(vmin, vmax);
    estado.ejeT = ejeTiempo(Math.max(T, 0.05));
    $('barraTiempo').max = Math.max(T, 0.001);
  }

  /* ---------- Dibujo ---------- */
  function dibujarExtra(e) {
    const cv = $('gExtra'), esc = estado.escena, L = e.lecturas, par = P(), mod = estado.mod, t = estado.t, pts = estado.puntos;
    const FZ = Es.FZ;
    const sim = (sub) => [['F', true], [sub, false, true]];
    if (esc === 'horizontal') {
      if (par.modo === 'rampa') {
        const Fm = Math.max(par.F, 0.5), ejeF = ejeLindo(0, Math.max(...pts.FfF.map(p => p[1]), 0.5) * 1.15);
        const paso = ejeLindo(0, Fm).mayor;
        Gr.dibujarGrafica(cv, {
          eje: ejeF, hMax: Fm, pasoH: { mayor: paso, menor: paso / 2 }, rotulo: [['F', true], ['f', false, true], [' / N', false]], color: FZ.Ff.color,
          rotuloH: [['F', true], ['H', false, true], [' / N', false]],
          curvas: [{ puntos: pts.FfF, color: FZ.Ff.color, alfa: 0.2 }, { puntos: pts.FfF.filter(p => p[2] <= t + 1e-9), color: FZ.Ff.color }],
          rotulos: [[[['rozamiento frente a fuerza aplicada', false]], COL.suave]]
        });
        return;
      }
      const ejeF = ejeLindo(0, Math.max(par.F, L.limiteEstatico, 0.5) * 1.1);
      Gr.dibujarGrafica(cv, {
        eje: ejeF, hMax: estado.ejeT.max, pasoH: estado.ejeT.pasoH, rotulo: [['F', true], [' / N', false]],
        curvas: [{ puntos: pts.F, color: FZ.FH.color, alfa: 0.25 }, { puntos: pts.F, color: FZ.FH.color, hasta: t },
          { puntos: pts.Ff, color: FZ.Ff.color, alfa: 0.25 }, { puntos: pts.Ff, color: FZ.Ff.color, hasta: t }],
        cursor: { t }, rotulos: [[sim('H'), FZ.FH.color], [sim('f'), FZ.Ff.color]], extraArr: 17
      });
      return;
    }
    if (esc === 'plano') {
      const quieto = e.v === 0;
      Es.dibujarBarras(cv, {
        titulo: 'A lo largo del plano',
        filas: [
          { partes: [['mg', true], [' sen θ', false]], valor: L.paralela, color: FZ.Fg.color },
          { partes: [['μ', true], ['s', false, true], [' F', true], ['N', false, true], [' (máximo)', false]], valor: L.limiteEstatico, color: FZ.Ff.color, raya: true },
          { partes: [['F', true], ['f', false, true], [' ahora', false]], valor: L.Ff, color: FZ.Ff.color },
          { partes: [['F', true], ['N', false, true], [' = ', false], ['mg', true], [' cos θ', false]], valor: L.FN, color: FZ.FN.color, separador: true },
          { partes: [['mg', true]], valor: e.cuerpos[0].m * G, color: FZ.Fg.color }
        ],
        nota: oculto('anguloLimite') ? [['Busca el ángulo en que ', false], ['mg', true], [' sen θ supera a ', false], ['μ', true], ['s', false, true], ['F', true], ['N', false, true]] : [['Ángulo límite: ', false], ['θ', true], [' = arctan ', false], ['μ', true], ['s', false, true], [' = ' + numero(L.anguloLimite, 1) + '°', false]]
      });
      return;
    }
    if (esc === 'ascensor') {
      const ejeF = ejeLindo(0, Math.max(...pts.FN.map(p => p[1]), L.peso) * 1.1);
      Gr.dibujarGrafica(cv, {
        eje: ejeF, hMax: estado.ejeT.max, pasoH: estado.ejeT.pasoH, rotulo: [['F', true], ['N', false, true], [' / N', false]], color: FZ.FN.color,
        curvas: [{ puntos: [[0, L.peso], [estado.ejeT.max, L.peso]], color: FZ.Fg.color, raya: [6, 4], ancho: 2 },
          { puntos: pts.FN, alfa: 0.25 }, { puntos: pts.FN, hasta: t }],
        cursor: { t, y: L.balanza }, rotulos: [[[['lectura de la balanza', false]], FZ.FN.color], [[['peso ', false], ['mg', true], [' (raya)', false]], FZ.Fg.color]], extraArr: 17
      });
      return;
    }
    if (esc === 'atwood') {
      const [c1, c2] = e.cuerpos;
      Es.dibujarBarras(cv, {
        titulo: 'Lecturas',
        filas: [
          { partes: [['m', true], ['₁', false], ['g', true]], valor: c1.m * G, color: FZ.Fg.color },
          { partes: [['F', true], ['T', false, true]], valor: L.FT, color: FZ.FT.color },
          { partes: [['m', true], ['₂', false], ['g', true]], valor: c2.m * G, color: FZ.Fg.color },
          { partes: [['2', false], ['F', true], ['T', false, true], [' (dinamómetro)', false]], valor: L.polea, color: COL.azul, separador: true },
          { partes: [['(', false], ['m', true], ['₁', false], [' + ', false], ['m', true], ['₂', false], [')', false], ['g', true]], valor: L.pesoTotal, color: FZ.Fg.color, raya: true }
        ],
        nota: [[Math.abs(e.a) > 1e-9 ? 'Acelera: 2' : 'En reposo: 2', false], ['F', true], ['T', false, true], [Math.abs(e.a) > 1e-9 ? ' < (' : ' = (', false], ['m', true], ['₁ + ', false], ['m', true], ['₂)', false], ['g', true]]
      });
      return;
    }
    if (esc === 'mesa') {
      Es.dibujarBarras(cv, {
        titulo: 'Fuerzas en la cuerda y en la mesa',
        filas: [
          { partes: [['m', true], ['₂', false], ['g', true]], valor: L.pesoColgante, color: FZ.Fg.color },
          { partes: [['F', true], ['T', false, true]], valor: L.FT, color: FZ.FT.color },
          { partes: [['F', true], ['f', false, true]], valor: L.Ff, color: FZ.Ff.color, separador: true },
          { partes: [['μ', true], ['s', false, true], [' F', true], ['N', false, true], [' (máximo)', false]], valor: L.limiteEstatico, color: FZ.Ff.color, raya: true }
        ],
        nota: [[Math.abs(e.a) > 1e-9 ? 'Acelera: ' : 'En reposo: ', false], ['F', true], ['T', false, true], [Math.abs(e.a) > 1e-9 ? ' < ' : ' = ', false], ['m', true], ['₂', false], ['g', true]]
      });
      return;
    }
    if (esc === 'cuerdas') { Es.dibujarTriangulo(cv, { est: e }); return; }
    if (esc === 'esfera') {
      const hMax = estado.lupa ? ejeTiempo(8 * mod.tau) : estado.ejeT;
      const ejeF = ejeLindo(0, L.peso * 1.12);
      Gr.dibujarGrafica(cv, {
        eje: ejeF, hMax: hMax.max, pasoH: hMax.pasoH, rotulo: [['F', true], [' / mN', false]],
        curvas: [{ puntos: [[0, L.peso], [hMax.max, L.peso]], color: FZ.Fg.color, ancho: 2 },
          { puntos: [[0, L.Fb], [hMax.max, L.Fb]], color: FZ.Fb.color, ancho: 2 },
          { puntos: pts.FbFd, color: COL.suave, raya: [5, 4], ancho: 2, hasta: t },
          { puntos: pts.Fd, color: FZ.Fd.color, alfa: 0.25 }, { puntos: pts.Fd, color: FZ.Fd.color, hasta: t }],
        cursor: { t }, extraArr: 34, rotulos: [[sim('g'), FZ.Fg.color], [sim('b'), FZ.Fb.color], [[['F', true], ['d', false, true], ['  ·  ', false], ['F', true], ['b', false, true], [' + ', false], ['F', true], ['d', false, true], [' (raya)', false]], FZ.Fd.color]]
      });
    }
  }
  function dibujarTodo() {
    if ($('panel-visor').hidden) return;
    const mod = estado.mod, e = mod.estado(estado.t);
    Es.dibujarEscena($('escena'), { mod, est: e, ver: estado.ver, Fmax: estado.Fmax, jugando: estado.jugando });
    Es.dibujarDCL($('gDCL'), { mod, est: e, ver: estado.ver, Fmax: estado.Fmax });
    if (CFG().estatica) {
      const L = e.lecturas, a1 = P().ang1 * Math.PI / 180, a2 = P().ang2 * Math.PI / 180, FZ = Es.FZ;
      Es.dibujarBarras($('gV'), {
        titulo: 'Componentes (equilibrio)',
        filas: [
          { partes: [['F', true], ['T1', false, true], [' cos θ', false], ['₁', false]], valor: L.T1 * Math.cos(a1), color: FZ.FT.color },
          { partes: [['F', true], ['T2', false, true], [' cos θ', false], ['₂', false]], valor: L.T2 * Math.cos(a2), color: FZ.FT.color },
          { partes: [['F', true], ['T1', false, true], [' sen θ', false], ['₁', false], [' + ', false], ['F', true], ['T2', false, true], [' sen θ', false], ['₂', false]], valor: L.T1 * Math.sin(a1) + L.T2 * Math.sin(a2), color: FZ.FT.color, separador: true },
          { partes: [['mg', true]], valor: L.peso, color: FZ.Fg.color }
        ],
        nota: [['Horizontales: iguales · verticales: suman ', false], ['mg', true]]
      });
    } else {
      const lupa = estado.escena === 'esfera' && estado.lupa;
      const ejeT = lupa ? ejeTiempo(8 * mod.tau) : estado.ejeT;
      const curvas = [{ puntos: estado.puntos.v, alfa: 0.25 }, { puntos: estado.puntos.v, hasta: estado.t }];
      const rotulos = [];
      if (estado.escena === 'esfera') { curvas.unshift({ puntos: [[0, mod.vt], [ejeT.max, mod.vt]], color: COL.suave, raya: [5, 4], ancho: 1.5 }); rotulos.push([[['v', true], ['t', false, true], [' (raya)', false]], COL.suave]); }
      Gr.dibujarGrafica($('gV'), {
        eje: estado.ejeV, hMax: ejeT.max, pasoH: ejeT.pasoH, rotulo: [['v', true], [' / m s⁻¹', false]], color: COL.vel,
        curvas, cursor: { t: estado.t, y: e.v }, rotulos
      });
    }
    // gráficas de la esfera en mN
    if (estado.escena === 'esfera') {
      const e2 = JSON.parse(JSON.stringify(e)), L = e2.lecturas;
      for (const k of ['peso', 'Fb', 'Fd', 'Fneta']) L[k] *= 1000;
      const viejos = estado.puntos;
      estado.puntos = Object.assign({}, viejos, { Fd: viejos.Fd.map(p => [p[0], p[1] * 1000]), FbFd: viejos.FbFd.map(p => [p[0], p[1] * 1000]) });
      dibujarExtra(e2);
      estado.puntos = viejos;
    } else dibujarExtra(e);
    actualizarTextos(e);
  }

  /* ---------- Lecturas ---------- */
  function fila(th, val, u, cls) { return `<tr${cls ? ` class="${cls}"` : ''}><th>${th}</th><td>${val}</td><td class="u">${u || ''}</td></tr>`; }
  function actualizarTextos(e) {
    const esc = estado.escena, L = e.lecturas, mod = estado.mod, par = P(), cfg = CFG();
    $('valT').innerHTML = cfg.estatica ? '' : `${v_('t')} = ${numero(estado.t, 2)} s`;
    let h = '';
    if (!cfg.estatica) {
      const sentido = { horizontal: '', plano: '', ascensor: '', atwood: '', mesa: '', esfera: '' }[esc];
      if (esc === 'esfera') h += fila(`${v_('v')} <small>velocidad</small>`, numero(e.v * 100, 2), 'cm s⁻¹', 'c-vel');
      else h += fila(`${v_('v')} <small>velocidad${sentido}</small>`, numero(e.v, 2), 'm s⁻¹', 'c-vel');
      h += fila(`${v_('a')} <small>aceleración</small>`, numero(e.a, 2), 'm s⁻²', 'c-ace');
    }
    const neta = esc === 'atwood' || esc === 'mesa' ? `${F_('neta')} <small>del sistema</small>` : F_('neta');
    h += fila(neta, esc === 'esfera' ? numero(L.Fneta * 1000, 2) : n2(L.Fneta), esc === 'esfera' ? 'mN' : 'N', 'c-ace');
    if (esc === 'horizontal') { h += fila('Dinamómetro', n2(L.dinamometro), 'N'); h += fila(`Alargamiento ${v_('x')} <small>del resorte</small>`, numero(L.alargamiento * 100, 1), 'cm'); }
    if (esc === 'plano' && !oculto('anguloLimite')) h += fila(`Ángulo límite <small>arctan ${MU_S}</small>`, numero(L.anguloLimite, 1), '°');
    if (esc === 'ascensor') { h += fila('Balanza', numero(L.balanza, 0), 'N'); h += fila(`Peso ${v_('mg')}`, numero(L.peso, 0), 'N'); }
    if (esc === 'atwood') { h += fila(`Tensión ${F_('T')}`, n2(L.FT), 'N'); h += fila('Dinamómetro de la polea', n2(L.polea), 'N'); }
    if (esc === 'mesa') h += fila(`Tensión ${F_('T')}`, n2(L.FT), 'N');
    if (esc === 'cuerdas') { h += fila(`Dinamómetro 1 ${F_('T1')}`, n2(L.T1), 'N'); h += fila(`Dinamómetro 2 ${F_('T2')}`, n2(L.T2), 'N'); }
    if (esc === 'esfera') {
      h += fila(`Velocidad terminal ${v_('v')}<sub>t</sub>`, numero(mod.vt * 100, 2), 'cm s⁻¹');
      const [t1, t2] = estado.puntos.marcas, pasado = estado.t >= t2 - 1e-9;
      h += fila('Tiempo entre marcas', pasado ? numero(t2 - t1, 2) : '–', 's');
      h += fila(`Rapidez medida <small>0,20 m ÷ tiempo</small>`, pasado ? numero(0.2 / (t2 - t1) * 100, 2) : '–', 'cm s⁻¹');
    }
    $('tablaLecturas').innerHTML = h;

    // ¿en reposo o deslizando? (escenas con rozamiento)
    const roz = $('estadoRoz');
    if ('limiteEstatico' in L) {
      roz.hidden = false;
      const conRoz = par.mus > 0 || par.mud > 0;
      if (!conRoz) { roz.className = 'estado-roz desliza'; roz.innerHTML = 'Sin rozamiento'; }
      else if (e.v === 0 && Math.abs(e.a) < 1e-12) { roz.className = 'estado-roz reposo'; roz.innerHTML = `En reposo: ${F_('f')} = ${n2(L.Ff)} N ≤ ${MU_S}${F_('N')} = ${n2(L.limiteEstatico)} N`; }
      else { roz.className = 'estado-roz desliza'; roz.innerHTML = e.v === 0 ? `Empieza a deslizar: ${F_('f')} = ${MU_D}${F_('N')} = ${n2(L.Ff)} N` : `Desliza: ${F_('f')} = ${MU_D}${F_('N')} = ${n2(L.Ff)} N`; }
    } else roz.hidden = true;

    // fuerzas sobre cada cuerpo: quién la ejerce y sobre quién
    let hf = '';
    for (const c of e.cuerpos) {
      let n = 0;
      for (const f of c.fuerzas) {
        const sub = Es.FZ[f.tipo].sub + (esc === 'cuerdas' && f.tipo === 'FT' ? String(++n) : '');
        const val = esc === 'esfera' ? numero(f.mod * 1000, 2) : n2(f.mod);
        hf += `<tr><th style="color:${Es.FZ[f.tipo].color}">${F_(sub)}</th><td class="quien">${f.por} → ${f.sobre}</td><td style="color:${Es.FZ[f.tipo].color}">${val}</td><td class="u">${esc === 'esfera' ? 'mN' : 'N'}</td></tr>`;
      }
    }
    $('tablaFuerzas').innerHTML = hf;
    $('notaEscena').innerHTML = cfg.nota || '';

    // reproducción
    const fin = estado.t >= mod.T - 1e-9;
    $('btnPlay').setAttribute('aria-label', estado.jugando ? 'Pausar' : 'Empezar');
    $('txtPlay').textContent = estado.jugando ? 'Pausar' : (fin && estado.t > 0 ? 'Repetir' : estado.t > 0 ? 'Seguir' : 'Empezar');
    $('icoPlay').hidden = estado.jugando; $('icoPausa').hidden = !estado.jugando;
    $('barraTiempo').value = estado.t;
  }

  /* ---------- Reproducción ---------- */
  let ultimo = null;
  function cuadro(ahora) {
    if (!estado.jugando) { ultimo = null; return; }
    const fin = estado.mod.T;
    if (ultimo !== null) {
      estado.t = Math.min(fin, estado.t + (ahora - ultimo) / 1000 * estado.rapidez);
      if (estado.t >= fin) estado.jugando = false;
    }
    ultimo = ahora;
    dibujarTodo();
    if (estado.jugando) requestAnimationFrame(cuadro); else ultimo = null;
  }
  function reproducir() {
    if (CFG().estatica) return;
    if (estado.t >= estado.mod.T - 1e-9) estado.t = 0;
    if (!estado.jugando) { estado.jugando = true; ultimo = null; requestAnimationFrame(cuadro); }
    dibujarTodo();
  }
  function pausar() { estado.jugando = false; }
  function irA(t) { estado.t = Math.min(estado.mod.T, Math.max(0, Math.round(t * 1000) / 1000)); dibujarTodo(); }
  $('btnPlay').addEventListener('click', () => (estado.jugando ? (pausar(), dibujarTodo()) : reproducir()));
  $('btnReiniciar').addEventListener('click', () => { pausar(); irA(0); });
  $('btnAtras').addEventListener('click', () => { pausar(); irA(estado.t - 0.05); });
  $('btnAdelante').addEventListener('click', () => { pausar(); irA(estado.t + 0.05); });
  $('barraTiempo').addEventListener('input', (e) => { pausar(); irA(Number(e.target.value)); });
  $('rapidez').addEventListener('change', (e) => { estado.rapidez = Number(e.target.value); });

  /* ---------- Controles ---------- */
  function texto(c, val) {
    if (c.tipo === 'opciones') return '';
    return numero(val, c.dec) + (c.unidad ? (c.unidad === '°' ? '°' : ' ' + c.unidad) : '');
  }
  function construirControles() {
    const cfg = CFG(), par = P();
    $('controles').innerHTML = cfg.controles.map(c => {
      if (c.tipo === 'opciones') return `<div class="opciones-ctl" id="g-${c.id}"><label for="c-${c.id}">${c.rotulo}</label><select id="c-${c.id}">${c.opciones.map(o => `<option value="${o[0]}"${o[0] === par[c.id] ? ' selected' : ''}>${o[1]}</option>`).join('')}</select></div>`;
      const lista = c.tipo === 'lista';
      const min = lista ? 0 : c.min, max = lista ? c.valores.length - 1 : c.max, paso = lista ? 1 : c.paso;
      const val = lista ? c.valores.indexOf(par[c.id]) : par[c.id];
      return `<div class="deslizador" id="g-${c.id}"><div class="fila"><label for="c-${c.id}">${c.rotulo}</label><output id="o-${c.id}">${texto(c, par[c.id])}</output></div>
        <input type="range" id="c-${c.id}" min="${min}" max="${max}" step="${paso}" value="${val}"></div>`;
    }).join('');
    for (const c of cfg.controles) {
      const el = $('c-' + c.id);
      el.addEventListener(c.tipo === 'opciones' ? 'change' : 'input', () => alCambiar(c));
      if (c.tipo !== 'opciones') el.addEventListener('change', () => { if (!CFG().estatica) reproducir(); });
    }
    visibilidad();
  }
  const oculto = (id) => { const q = estado.modo ? window.NivelesFuerzas.NIVELES[estado.modo - 1].preguntas[estado.preg[estado.modo]] : null; return !!(q && q.oculta && q.oculta.includes(id) && q.sit === estado.sit); };
  function visibilidad() {
    const cfg = CFG(), par = P();
    for (const c of cfg.controles) $('g-' + c.id).hidden = (c.vis ? !c.vis(par) : false) || oculto(c.id);
    // límites que dependen de otros controles
    if (cfg.limites) {
      const lim = cfg.limites(par);
      for (const id in lim) {
        const el = $('c-' + id);
        if (par[id] > lim[id]) { par[id] = lim[id]; estado.aviso = 'Fuerza limitada para que el bloque no se despegue de la mesa.'; }
        el.max = lim[id]; el.value = par[id]; $('o-' + id).textContent = texto(cfg.controles.find(c => c.id === id), par[id]);
      }
    }
    $('aviso').textContent = estado.aviso;
  }
  function alCambiar(c) {
    const par = P(), el = $('c-' + c.id);
    let val = c.tipo === 'opciones' ? el.value : c.tipo === 'lista' ? c.valores[Number(el.value)] : Math.round(Number(el.value) / c.paso) * c.paso;
    if (c.tipo === 'rango') val = Number(val.toFixed(4));
    if (val === par[c.id]) return;
    pausar();
    estado.aviso = '';
    par[c.id] = val;
    // μd no puede ser mayor que μs
    if ('mus' in par && par.mud > par.mus + 1e-9) {
      if (c.id === 'mud') { par.mud = par.mus; estado.aviso = 'μd no puede ser mayor que μs.'; }
      else { par.mud = par.mus; }
      $('c-mud').value = par.mud; $('o-mud').textContent = texto(c, par.mud);
    }
    if (c.tipo !== 'opciones') $('o-' + c.id).textContent = texto(c, par[c.id]);
    visibilidad();
    recalcular(); dibujarTodo();
  }

  function pintarSelector() {
    $('escenas').innerHTML = ORDEN.map(k => `<button class="nivel${k === estado.escena ? ' activo' : ''}" data-escena="${k}" aria-pressed="${k === estado.escena}">${ESCENAS[k].nombre}</button>`).join('');
    document.querySelectorAll('#escenas .nivel').forEach(b => b.addEventListener('click', () => ponerEscena(b.dataset.escena)));
  }
  function ponerEscena(k) {
    pausar();
    estado.escena = k; estado.aviso = '';
    document.querySelectorAll('#escenas .nivel').forEach(b => { const a = b.dataset.escena === k; b.classList.toggle('activo', a); b.setAttribute('aria-pressed', String(a)); });
    construirControles();
    $('reproduccion').classList.toggle('inactiva', !!CFG().estatica);
    for (const id of ['btnReiniciar', 'btnAtras', 'btnPlay', 'btnAdelante', 'barraTiempo', 'rapidez']) $(id).disabled = !!CFG().estatica;
    $('grupoLupa').hidden = k !== 'esfera';
    $('chkComponentes').parentElement.hidden = !(k === 'plano' || k === 'horizontal' || k === 'cuerdas');
    recalcular(); dibujarTodo();
  }

  [['chkFuerzas', 'fuerzas'], ['chkValores', 'valores'], ['chkComponentes', 'componentes']].forEach(([id, k]) => {
    estado.ver[k] = $(id).checked;
    $(id).addEventListener('change', (e) => { estado.ver[k] = e.target.checked; dibujarTodo(); });
  });
  $('chkLupa').addEventListener('change', (e) => { estado.lupa = e.target.checked; dibujarTodo(); });

  // clic y arrastre sobre la gráfica v–t para ir a un instante
  (function () {
    const cv = $('gV'); let abajo = false;
    const tDesde = (e) => {
      const r = cv.getBoundingClientRect(), mod = estado.mod;
      const ejeT = estado.escena === 'esfera' && estado.lupa ? ejeTiempo(8 * mod.tau) : estado.ejeT;
      return Gr.geometria(r.width, r.height, estado.ejeV, ejeT.max).T(e.clientX - r.left);
    };
    cv.addEventListener('pointerdown', (e) => { if (CFG().estatica) return; abajo = true; cv.setPointerCapture(e.pointerId); pausar(); irA(tDesde(e)); });
    cv.addEventListener('pointermove', (e) => { if (abajo) irA(tDesde(e)); });
    cv.addEventListener('pointerup', () => { abajo = false; });
    cv.addEventListener('pointercancel', () => { abajo = false; });
  })();

  document.addEventListener('keydown', (e) => {
    const tag = (e.target.tagName || '').toLowerCase();
    if (tag === 'input' || tag === 'select' || tag === 'button' || tag === 'summary') return;
    if ($('panel-visor').hidden || CFG().estatica) return;
    if (e.code === 'Space') { e.preventDefault(); estado.jugando ? (pausar(), dibujarTodo()) : reproducir(); }
    else if (e.key === 'ArrowRight') { pausar(); irA(estado.t + 0.05); }
    else if (e.key === 'ArrowLeft') { pausar(); irA(estado.t - 0.05); }
  });

  document.querySelectorAll('.pestanas [role="tab"]').forEach(tab => tab.addEventListener('click', () => {
    const parte = tab.dataset.panel;
    document.querySelectorAll('.pestanas [role="tab"]').forEach(x => x.setAttribute('aria-selected', String(x === tab)));
    $('panel-visor').hidden = parte !== 'explorar';
    $('panel-construir').hidden = parte !== 'construir';
    $('panel-practicar').hidden = parte !== 'practicar';
    if (parte === 'explorar') dibujarTodo(); else pausar();
    if (parte === 'construir' && window.ConstruirFuerzas) window.ConstruirFuerzas.mostrar();
    if (parte === 'practicar' && window.PracticarUI) window.PracticarUI.mostrar();
  }));

  /* ---------- Niveles con preguntas guiadas ---------- */
  const NV = window.NivelesFuerzas;
  estado.modo = 1; estado.preg = { 1: 0, 2: 0, 3: 0, 4: 0 }; estado.resp = {}; estado.sit = null;
  function ponerVer(ver) {
    const v = Object.assign({ fuerzas: true, valores: false, componentes: false }, ver || {});
    for (const [id, k] of [['chkFuerzas', 'fuerzas'], ['chkValores', 'valores'], ['chkComponentes', 'componentes']]) { estado.ver[k] = v[k]; $(id).checked = v[k]; }
    estado.lupa = false; $('chkLupa').checked = false;
  }
  function cargarSituacion(id) {
    const sit = NV.SIT[id];
    const base = {}; for (const c of ESCENAS[sit.escena].controles) base[c.id] = c.ini;
    estado.par[sit.escena] = Object.assign(base, sit.par);
    estado.sit = id;
    ponerVer(sit.ver);
    ponerEscena(sit.escena);
  }
  function pintarNiveles() {
    $('niveles').innerHTML = NV.NIVELES.map((nv, i) => `<button class="nivel${estado.modo === i + 1 ? ' activo' : ''}" data-modo="${i + 1}" aria-pressed="${estado.modo === i + 1}"><b>Nivel ${i + 1}</b> ${nv.corto}</button>`).join('') +
      `<button class="nivel libre${estado.modo === 0 ? ' activo' : ''}" data-modo="0" aria-pressed="${estado.modo === 0}">Laboratorio libre</button>`;
    document.querySelectorAll('#niveles .nivel').forEach(b => b.addEventListener('click', () => ponerModo(Number(b.dataset.modo))));
  }
  function ponerModo(m) {
    pausar();
    estado.modo = m;
    pintarNiveles();
    $('escenas').hidden = m !== 0;
    $('guia').hidden = m === 0;
    if (m === 0) { estado.sit = null; $('ajustes').open = true; ponerEscena(estado.escena); return; }
    irPregunta(estado.preg[m], true);
  }
  const clave = () => `${estado.modo}-${estado.preg[estado.modo]}`;
  const pregActual = () => NV.NIVELES[estado.modo - 1].preguntas[estado.preg[estado.modo]];
  function irPregunta(i, forzar) {
    const nv = NV.NIVELES[estado.modo - 1];
    i = Math.max(0, Math.min(nv.preguntas.length - 1, i));
    estado.preg[estado.modo] = i;
    const q = nv.preguntas[i];
    if (forzar || q.sit !== estado.sit) cargarSituacion(q.sit);
    else { visibilidad(); dibujarTodo(); }
    $('ajustes').open = !!q.ajustes;
    pintarGuia();
  }
  function pintarGuia() {
    const nv = NV.NIVELES[estado.modo - 1], i = estado.preg[estado.modo], q = nv.preguntas[i], r = estado.resp[clave()] || {};
    $('guiaNum').textContent = `Pregunta ${i + 1} de ${nv.preguntas.length}`;
    $('guiaPuntos').innerHTML = nv.preguntas.map((_, j) => {
      const rj = estado.resp[`${estado.modo}-${j}`];
      return `<button class="${j === i ? 'actual' : ''}${rj && rj.bien ? ' bien' : ''}" data-i="${j}" aria-label="Pregunta ${j + 1}${rj && rj.bien ? ' (resuelta)' : ''}"></button>`;
    }).join('');
    $('guiaPuntos').querySelectorAll('button').forEach(b => b.addEventListener('click', () => irPregunta(Number(b.dataset.i))));
    $('guiaSit').textContent = NV.SIT[q.sit].nombre;
    $('guiaTexto').innerHTML = q.texto;
    const corr = $('guiaCorr');
    if (q.tipo === 'opcion') {
      $('guiaResp').innerHTML = q.opciones.map((o, j) => {
        const cls = r.bien && o[1] ? ' bien' : (r.malas || []).includes(j) ? ' mal' : '';
        return `<button class="opc${cls}" data-j="${j}"${r.bien || cls ? ' disabled' : ''}>${o[0]}</button>`;
      }).join('');
      $('guiaResp').querySelectorAll('.opc').forEach(b => b.addEventListener('click', () => elegir(Number(b.dataset.j))));
    } else {
      $('guiaResp').innerHTML = `<div class="guia-valor"><input id="guiaInput" inputmode="decimal" autocomplete="off" aria-label="Tu respuesta"${r.bien ? ' disabled' : ''} value="${r.texto || ''}">` +
        `<span>${q.unidad || ''}</span><button class="boton mini primario" id="guiaComprobar"${r.bien ? ' disabled' : ''}>Comprobar</button></div>`;
      $('guiaComprobar').addEventListener('click', comprobar);
      $('guiaInput').addEventListener('keydown', (e) => { if (e.key === 'Enter') comprobar(); });
    }
    corr.hidden = !r.mensaje; corr.className = 'correccion ' + (r.clase || ''); corr.innerHTML = r.mensaje || '';
    const ver = $('guiaVerRes'); if (ver) ver.addEventListener('click', verResolucion);
    $('guiaAnt').disabled = i === 0; $('guiaSig').disabled = i === nv.preguntas.length - 1;
  }
  function elegir(j) {
    const q = pregActual(), r = estado.resp[clave()] = estado.resp[clave()] || { malas: [] };
    if (q.opciones[j][1]) Object.assign(r, { bien: true, clase: 'bien', mensaje: `<b>¡Correcto!</b> ${q.explicacion}` });
    else { r.malas.push(j); Object.assign(r, { clase: 'pista', mensaje: `<b>No es así.</b> ${q.opciones[j][2]}` }); }
    pintarGuia();
  }
  function comprobar() {
    const q = pregActual(), r = estado.resp[clave()] = estado.resp[clave()] || { intentos: 0 };
    const txt = $('guiaInput').value.trim(); r.texto = txt;
    const x = Number(txt.replace(/\s/g, '').replace(',', '.').replace('−', '-'));
    if (!txt || !isFinite(x)) { Object.assign(r, { clase: 'pista', mensaje: 'Escribe un número (con coma o punto decimal).' }); pintarGuia(); return; }
    const correcta = q.respuesta(P()), tol = q.tol || 0.02;
    if (Math.abs(x - correcta) <= tol * Math.abs(correcta) + 1e-9) {
      Object.assign(r, { bien: true, clase: 'bien', mensaje: `<b>¡Correcto!</b><br>${q.resolucion(P())}` });
    } else {
      r.intentos = (r.intentos || 0) + 1;
      Object.assign(r, { clase: 'pista', mensaje: `<b>Todavía no.</b> ${q.pista}` + (r.intentos >= 2 ? '<br><button class="boton mini" id="guiaVerRes">Ver resolución</button>' : '') });
    }
    pintarGuia();
  }
  function verResolucion() {
    const q = pregActual(), r = estado.resp[clave()];
    Object.assign(r, { clase: 'solucion', mensaje: q.resolucion(P()) });
    pintarGuia();
  }
  $('guiaAnt').addEventListener('click', () => irPregunta(estado.preg[estado.modo] - 1));
  $('guiaSig').addEventListener('click', () => irPregunta(estado.preg[estado.modo] + 1));
  $('guiaReiniciar').addEventListener('click', () => { if (estado.sit) cargarSituacion(estado.sit); });

  // ---------- Inicio ----------
  pintarSelector();
  ponerModo(1);
  new ResizeObserver(() => dibujarTodo()).observe(document.querySelector('.taller'));
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(dibujarTodo);

  // Para las pruebas automáticas
  window.__simFuerzas = { estado, ponerEscena, irA, dibujarTodo, recalcular, P, ponerModo, irPregunta, cargarSituacion };
})();
