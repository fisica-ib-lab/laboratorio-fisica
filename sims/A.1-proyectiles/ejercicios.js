/* Simulación A.1 · Movimiento de proyectiles — generador de ejercicios de Practicar (sin pantalla).
   Cada respuesta se calcula con comun/proyectil.js y los distractores y pistas reproducen errores típicos.
   Se comprueba con: node pruebas/verificar-ejercicios-proyectiles.js */

(function (raiz) {
  'use strict';
  const enNode = typeof module !== 'undefined' && module.exports;
  const { numero } = enNode ? require('../../comun/cinematica.js') : raiz.Cinematica;
  const { Proyectil, G, RAD } = enNode ? require('../../comun/proyectil.js') : raiz.ProyectilFisica;

  const K_AIRE = 0.3;                    // m⁻¹: efecto bien visible a las rapideces del laboratorio
  const U = '<span class="var">u</span>', V = '<span class="var">v</span>', TH = '<span class="var">θ</span>', H = '<span class="var">h</span>',
    T = '<span class="var">t</span>', GG = '<span class="var">g</span>';
  const UX = `${U}<sub>x</sub>`, UY = `${U}<sub>y</sub>`, VX = `${V}<sub>x</sub>`, VY = `${V}<sub>y</sub>`;

  // ---------- Azar con semilla ----------
  function rngSemilla(semilla) {
    let x = semilla >>> 0;
    return function () {
      x = (x + 0x6D2B79F5) >>> 0;
      let t = x;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  const elegir = (r, lista) => lista[Math.floor(r() * lista.length)];
  function barajar(r, lista) {
    const x = lista.slice();
    for (let i = x.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [x[i], x[j]] = [x[j], x[i]]; }
    return x;
  }
  // tres cifras significativas, con coma decimal
  function cs3(x) {
    if (x === 0) return '0';
    const d = Math.max(0, 2 - Math.floor(Math.log10(Math.abs(x))));
    return numero(x, Math.min(d, 4));
  }
  const n1 = (x) => numero(x, 1), n2 = (x) => numero(x, 2);
  const datos = (lista) => '<ul class="p-datos">' + lista.map(x => `<li>${x}</li>`).join('') + '</ul>';
  const tolerancia = (x) => Math.max(0.01, 0.02 * Math.abs(x));

  const ANGULOS = [20, 25, 30, 35, 40, 50, 55, 60, 65, 70];
  const RAPIDECES = [2, 2.5, 3, 3.5, 4, 4.5, 5];
  const ALTURAS = [0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1.0];
  const sen = (a) => Math.sin(a * RAD), cos = (a) => Math.cos(a * RAD);

  function limpiarPistas(pistas, resp, tol) {
    const r = [];
    for (const p of pistas) {
      if (!p || !isFinite(p.valor)) continue;
      if (Math.abs(p.valor - resp) <= 2.5 * tol) continue;
      if (r.some(q => Math.abs(q.valor - p.valor) <= 2 * Math.max(0.01, 0.01 * Math.abs(q.valor), 0.01 * Math.abs(p.valor)))) continue;
      r.push(p);
    }
    return r;
  }
  function numerico(o) {
    const tol = tolerancia(o.respuesta);
    return Object.assign({ tipo: 'numero', tolerancia: tol }, o, { pistas: limpiarPistas(o.pistas, o.respuesta, tol) });
  }

  // ---------- Calcular ----------
  function ejComponentes(r) {
    const v = elegir(r, RAPIDECES), ang = elegir(r, ANGULOS), horizontal = r() < 0.5;
    const resp = horizontal ? v * cos(ang) : v * sen(ang), otra = horizontal ? v * sen(ang) : v * cos(ang);
    return numerico({
      id: 'componentes', titulo: 'Componentes de la velocidad', esc: { h: 0, v, ang },
      enunciado: `Una bola sale del lanzador con rapidez ${U} = ${n1(v)} m s⁻¹ y un ángulo ${TH} = ${ang}° sobre la horizontal. <b>Calcule</b> la componente ${horizontal ? 'horizontal' : 'vertical'} de la velocidad inicial.`,
      respuesta: resp, unidad: 'm s⁻¹',
      pistas: [
        { valor: otra, texto: `Esa es la otra componente. La componente ${horizontal ? 'horizontal es la contigua al ángulo: usa el coseno' : 'vertical es la opuesta al ángulo: usa el seno'}.` },
        { valor: horizontal ? v * Math.cos(ang) : v * Math.sin(ang), texto: 'Revisa tu calculadora: parece estar en radianes y el ángulo está en grados.' },
        { valor: Math.abs(horizontal ? v * Math.cos(ang) : v * Math.sin(ang)), texto: 'Revisa tu calculadora: parece estar en radianes y el ángulo está en grados.' },
        { valor: horizontal ? v / cos(ang) : v / sen(ang), texto: `Una componente nunca es mayor que ${U}: hay que multiplicar por el ${horizontal ? 'coseno' : 'seno'}, no dividir.` },
        { valor: v * Math.tan(ang * RAD), texto: `Usa el ${horizontal ? 'coseno' : 'seno'} del ángulo, no la tangente.` }
      ],
      pistaGeneral: `Dibuja el triángulo de la velocidad: ${U} es la hipotenusa y ${TH} está junto a la componente horizontal.`,
      explicacion: horizontal
        ? `${UX} = ${U} cos ${TH} = ${n1(v)} × cos ${ang}° = <b>${cs3(resp)} m s⁻¹</b>.`
        : `${UY} = ${U} sen ${TH} = ${n1(v)} × sen ${ang}° = <b>${cs3(resp)} m s⁻¹</b>.`
    });
  }

  function ejOblicuo(r, que) {
    const v = elegir(r, RAPIDECES.slice(2)), ang = elegir(r, ANGULOS);
    const ux = v * cos(ang), uy = v * sen(ang), Tf = 2 * uy / G;
    const base = `Una bola sale desde la mesa con rapidez ${U} = ${n1(v)} m s⁻¹ y un ángulo ${TH} = ${ang}° sobre la horizontal, y vuelve a caer sobre la mesa. Se desprecia la resistencia del aire.`;
    const paso1 = `${UY} = ${n1(v)} × sen ${ang}° = ${cs3(uy)} m s⁻¹`;
    if (que === 'tiempo') {
      return numerico({
        id: 'tiempo-vuelo', titulo: 'Tiempo de vuelo', esc: { h: 0, v, ang },
        enunciado: `${base} <b>Calcule</b> el tiempo de vuelo.`, respuesta: Tf, unidad: 's',
        pistas: [
          { valor: uy / G, texto: 'Ese es el tiempo de subida hasta el punto más alto. Falta el tiempo de bajada.' },
          { valor: 2 * v / G, texto: `En el movimiento vertical se usa la componente vertical ${UY}, no ${U}.` },
          { valor: v / G, texto: `En el movimiento vertical se usa la componente vertical ${UY}, no ${U}; y cuenta la subida y la bajada.` },
          { valor: 2 * ux / G, texto: `Usaste la componente horizontal. El tiempo de vuelo lo decide el movimiento vertical: usa ${UY}.` },
          { valor: 2 * uy / 10, texto: `Usa ${GG} = 9,81 m s⁻², el valor del Cuadernillo de datos.` }
        ],
        pistaGeneral: `Trabaja solo con el movimiento vertical: la bola vuelve a la altura de salida, así que el desplazamiento vertical es cero.`,
        explicacion: `${paso1}. En vertical, el desplazamiento total es cero: 0 = ${UY} ${T} − ½ ${GG} ${T}², de donde ${T} = 2 ${UY} / ${GG} = 2 × ${cs3(uy)} / 9,81 = <b>${cs3(Tf)} s</b>.`
      });
    }
    if (que === 'altura') {
      const Hm = uy * uy / (2 * G);
      return numerico({
        id: 'altura-maxima', titulo: 'Altura máxima', esc: { h: 0, v, ang },
        enunciado: `${base} <b>Calcule</b> la altura máxima que alcanza la bola sobre la mesa.`, respuesta: Hm, unidad: 'm',
        pistas: [
          { valor: v * v / (2 * G), texto: `En el movimiento vertical se usa la componente vertical ${UY}, no ${U}.` },
          { valor: uy * uy / G, texto: `Revisa la ecuación: ${V}² = ${U}² + 2${'<span class="var">a</span>'}${'<span class="var">s</span>'}. Falta el 2.` },
          { valor: ux * ux / (2 * G), texto: `Usaste la componente horizontal. La altura depende de la componente vertical ${UY}.` },
          { valor: uy / G, texto: 'Ese es el tiempo de subida, no la altura.' },
          { valor: uy * Tf - 0.5 * G * Tf * Tf, texto: 'En el punto más alto ha pasado solo la mitad del tiempo de vuelo.' }
        ],
        pistaGeneral: `En el punto más alto la componente vertical de la velocidad es cero. Usa una ecuación del movimiento vertical que no necesite el tiempo.`,
        explicacion: `${paso1}. En el punto más alto ${VY} = 0: 0 = ${UY}² − 2 ${GG} ${H}<sub>máx</sub>, de donde ${H}<sub>máx</sub> = ${UY}² / (2 ${GG}) = ${cs3(uy)}² / (2 × 9,81) = <b>${cs3(Hm)} m</b>.`
      });
    }
    const R = ux * Tf;
    return numerico({
      id: 'alcance', titulo: 'Alcance', esc: { h: 0, v, ang },
      enunciado: `${base} <b>Determine</b> el alcance (la distancia horizontal hasta el punto de caída).`, respuesta: R, unidad: 'm',
      pistas: [
        { valor: v * Tf, texto: `En horizontal la bola avanza con ${UX}, no con ${U}.` },
        { valor: ux * Tf / 2, texto: 'Usaste solo el tiempo de subida. El alcance se calcula con el tiempo de vuelo completo.' },
        { valor: uy * Tf, texto: `Usaste la componente vertical para avanzar. En horizontal se usa ${UX} = ${U} cos ${TH}.` },
        { valor: v * v * sen(ang) / G, texto: `Revisa el tiempo de vuelo (subida y bajada) y la componente horizontal ${UX}.` },
        { valor: Tf, texto: 'Ese es el tiempo de vuelo. Falta multiplicarlo por la componente horizontal de la velocidad.' }
      ],
      pistaGeneral: `Son dos pasos: el tiempo de vuelo sale del movimiento vertical; el alcance, de ${UX} por ese tiempo.`,
      explicacion: `${paso1} y ${UX} = ${n1(v)} × cos ${ang}° = ${cs3(ux)} m s⁻¹. Tiempo de vuelo: ${T} = 2 ${UY} / ${GG} = ${cs3(Tf)} s. Alcance: ${UX} ${T} = ${cs3(ux)} × ${cs3(Tf)} = <b>${cs3(R)} m</b>.`
    });
  }

  function ejHorizontal(r, que) {
    const v = elegir(r, RAPIDECES), h = elegir(r, ALTURAS);
    const Tf = Math.sqrt(2 * h / G), vy = G * Tf;
    const base = `Una bola sale horizontalmente del lanzador con rapidez ${U} = ${n1(v)} m s⁻¹, desde una altura ${H} = ${n2(h)} m sobre la mesa. Se desprecia la resistencia del aire.`;
    const pasoT = `En vertical la bola parte con ${UY} = 0: ${H} = ½ ${GG} ${T}², de donde ${T} = √(2${H}/${GG}) = √(2 × ${n2(h)} / 9,81) = ${cs3(Tf)} s`;
    if (que === 'tiempo') {
      return numerico({
        id: 'horizontal-tiempo', titulo: 'Lanzamiento horizontal: tiempo', esc: { h, v, ang: 0 },
        enunciado: `${base} <b>Calcule</b> el tiempo que tarda la bola en llegar a la mesa.`, respuesta: Tf, unidad: 's',
        pistas: [
          { valor: h / v, texto: `La rapidez de lanzamiento es horizontal: no sirve para el movimiento vertical. En vertical la bola parte con ${UY} = 0 y acelera con ${GG}.` },
          { valor: 2 * h / G, texto: `Falta la raíz cuadrada: ${T}² = 2${H}/${GG}.` },
          { valor: Math.sqrt(h / G), texto: `Revisa la ecuación: ${H} = ½ ${GG} ${T}². Falta el 2.` },
          { valor: Math.sqrt(2 * h * G), texto: `Eso es ${VY} al llegar, no el tiempo.` },
          { valor: Math.sqrt(2 * h / 10), texto: `Usa ${GG} = 9,81 m s⁻², el valor del Cuadernillo de datos.` }
        ],
        pistaGeneral: `Trabaja solo con el movimiento vertical: la bola cae ${n2(h)} m partiendo con velocidad vertical cero.`,
        explicacion: `${pasoT} → <b>${cs3(Tf)} s</b>. No depende de la rapidez de lanzamiento.`
      });
    }
    if (que === 'alcance') {
      const R = v * Tf;
      return numerico({
        id: 'horizontal-alcance', titulo: 'Lanzamiento horizontal: alcance', esc: { h, v, ang: 0 },
        enunciado: `${base} <b>Determine</b> la distancia horizontal que recorre la bola hasta llegar a la mesa.`, respuesta: R, unidad: 'm',
        pistas: [
          { valor: v * 2 * h / G, texto: `Revisa el tiempo de caída: ${T}² = 2${H}/${GG}; falta la raíz cuadrada.` },
          { valor: v * Math.sqrt(h / G), texto: `Revisa el tiempo de caída: ${H} = ½ ${GG} ${T}². Falta el 2.` },
          { valor: Tf, texto: 'Ese es el tiempo de caída. Falta multiplicarlo por la rapidez horizontal.' },
          { valor: h, texto: 'La distancia horizontal no tiene por qué ser igual a la altura: calcula primero el tiempo de caída.' },
          { valor: vy * Tf, texto: `En horizontal la bola avanza con la rapidez de lanzamiento ${U}, que no cambia; ${VY} solo sirve para el movimiento vertical.` }
        ],
        pistaGeneral: 'Son dos pasos: el tiempo de caída sale del movimiento vertical; la distancia horizontal, de la rapidez horizontal por ese tiempo.',
        explicacion: `${pasoT}. En horizontal la velocidad es constante: ${'<span class="var">x</span>'} = ${U} ${T} = ${n1(v)} × ${cs3(Tf)} = <b>${cs3(R)} m</b>.`
      });
    }
    const vf = Math.hypot(v, vy);
    return numerico({
      id: 'rapidez-llegada', titulo: 'Rapidez de llegada', esc: { h, v, ang: 0 },
      enunciado: `${base} <b>Determine</b> la rapidez de la bola justo antes de llegar a la mesa.`, respuesta: vf, unidad: 'm s⁻¹',
      pistas: [
        { valor: vy, texto: `Esa es solo la componente vertical ${VY}. La bola también conserva su componente horizontal: combínalas.` },
        { valor: v, texto: `La componente horizontal no cambia, pero la bola gana componente vertical al caer.` },
        { valor: v + vy, texto: `Las dos componentes son perpendiculares: no se suman directamente, se combinan con el teorema de Pitágoras.` },
        { valor: Math.sqrt(v * v + G * h), texto: `Revisa ${VY}: ${VY}² = 2 ${GG} ${H}.` },
        { valor: Math.sqrt(2 * G * h + v), texto: `Combina las componentes con Pitágoras: ${V}² = ${VX}² + ${VY}².` }
      ],
      pistaGeneral: `Halla la componente vertical al llegar (${VY}² = 2 ${GG} ${H}) y combínala con la horizontal, que no cambia.`,
      explicacion: `${VX} = ${n1(v)} m s⁻¹ (no cambia). ${VY}² = 2 ${GG} ${H} = 2 × 9,81 × ${n2(h)}, así que ${VY} = ${cs3(vy)} m s⁻¹ hacia abajo. Rapidez: ${V} = √(${VX}² + ${VY}²) = √(${n1(v)}² + ${cs3(vy)}²) = <b>${cs3(vf)} m s⁻¹</b>.`
    });
  }

  // ---------- Interpretar ----------
  // «hecho» describe la comprobación numérica que hace la verificación
  const CONCEPTOS = [
    { clave: 'cumbre', esc: (r) => ({ h: 0, v: elegir(r, [3.5, 4, 4.5]), ang: elegir(r, [40, 50, 60]) }),
      pregunta: 'La bola sale del lanzador con un ángulo sobre la horizontal. Sin resistencia del aire, <b>indique</b> qué ocurre en el punto más alto de la trayectoria.',
      correcta: 'La velocidad es horizontal y la aceleración es <span class="var">g</span> hacia abajo.',
      falsas: [
        ['La velocidad es cero y la aceleración es <span class="var">g</span> hacia abajo.', 'Solo la componente vertical de la velocidad es cero: la bola sigue avanzando en horizontal.'],
        ['La velocidad es horizontal y la aceleración es cero.', 'La gravedad actúa durante todo el vuelo: la aceleración es la misma en todos los puntos.'],
        ['La velocidad y la aceleración son cero.', 'Si las dos fueran cero, la bola se quedaría quieta en el aire. Piensa en cada componente por separado.']
      ],
      explicacion: `En el punto más alto ${VY} = 0, pero ${VX} no ha cambiado: la velocidad es horizontal. La aceleración es ${GG} hacia abajo durante todo el vuelo.` },
    { clave: 'gemelas', esc: (r) => ({ h: elegir(r, [0.6, 0.8, 1.0]), v: elegir(r, [2, 3, 4]), ang: 0, gemela: true }),
      pregunta: 'Una bola se lanza horizontalmente y, en el mismo instante, otra se suelta desde la misma altura. Sin resistencia del aire, <b>indique</b> cuál llega primero a la mesa.',
      correcta: 'Las dos llegan a la vez.',
      falsas: [
        ['Llega primero la bola soltada, porque recorre menos distancia.', 'El tiempo de caída depende solo del movimiento vertical, y las dos parten con velocidad vertical cero desde la misma altura.'],
        ['Llega primero la bola lanzada, porque va más rápido.', 'La rapidez horizontal no acelera la caída: el movimiento vertical es independiente del horizontal.'],
        ['Depende de la rapidez con que se lance la primera.', 'Prueba a pensar solo en el movimiento vertical: ¿interviene en él la rapidez horizontal?']
      ],
      explicacion: 'Los movimientos horizontal y vertical son independientes. Las dos bolas tienen el mismo movimiento vertical (parten con velocidad vertical cero y caen la misma altura), así que tardan lo mismo.' },
    { clave: 'doble', esc: (r) => ({ h: elegir(r, [0.6, 0.8, 1.0]), v: elegir(r, [1.5, 2, 2.5]), ang: 0 }),
      pregunta: 'Una bola se lanza horizontalmente desde cierta altura. Se repite el lanzamiento desde la misma altura con el doble de rapidez. Sin resistencia del aire, <b>indique</b> qué cambia.',
      correcta: 'El tiempo de vuelo no cambia y el alcance se duplica.',
      falsas: [
        ['El tiempo de vuelo y el alcance se duplican.', 'El tiempo de vuelo lo decide la altura de caída, que es la misma.'],
        ['El tiempo de vuelo se reduce a la mitad y el alcance no cambia.', 'Ir más rápido en horizontal no hace caer antes: el movimiento vertical es independiente.'],
        ['El tiempo de vuelo no cambia y el alcance se cuadruplica.', 'En horizontal la velocidad es constante: la distancia es proporcional a la rapidez, no a su cuadrado.']
      ],
      explicacion: `El tiempo de caída solo depende de la altura (${H} = ½ ${GG} ${T}²). En ese mismo tiempo, con el doble de rapidez horizontal, la bola recorre el doble de distancia.` },
    { clave: 'complementarios', esc: (r) => ({ h: 0, v: elegir(r, [3.5, 4, 4.5]), ang: 60 }),
      pregunta: 'Se lanzan dos bolas desde la mesa con la misma rapidez: una a 30° y otra a 60° sobre la horizontal. Sin resistencia del aire, <b>indique</b> la afirmación correcta.',
      correcta: 'Las dos tienen el mismo alcance, pero la de 60° está más tiempo en el aire.',
      falsas: [
        ['La de 60° llega más lejos, porque sube más.', 'Subir más da más tiempo de vuelo, pero la de 60° avanza más despacio en horizontal. Compara los dos efectos.'],
        ['La de 30° llega más lejos, porque va más rápido en horizontal.', 'Va más rápido en horizontal, pero está menos tiempo en el aire. Compara los dos efectos.'],
        ['Las dos tienen el mismo alcance y el mismo tiempo de vuelo.', 'El tiempo de vuelo depende de la componente vertical de la velocidad, que no es igual en las dos.']
      ],
      explicacion: `Con ángulos complementarios (30° y 60°) el alcance es el mismo: la de 60° tiene más componente vertical (más tiempo en el aire) y menos componente horizontal, y los dos efectos se compensan.` },
    { clave: 'vx', esc: (r) => ({ h: 0, v: elegir(r, [3.5, 4, 4.5]), ang: elegir(r, [35, 50]) }),
      pregunta: 'La bola sale del lanzador con un ángulo sobre la horizontal. Sin resistencia del aire, <b>indique</b> qué le ocurre a la componente horizontal de su velocidad durante el vuelo.',
      correcta: 'Se mantiene constante.',
      falsas: [
        ['Disminuye hasta el punto más alto y después aumenta.', 'Eso le ocurre a la rapidez total, por el cambio de la componente vertical. ¿Hay alguna aceleración horizontal?'],
        ['Disminuye durante todo el vuelo.', 'Eso ocurriría con resistencia del aire. Sin aire no hay aceleración horizontal.'],
        ['Es cero en el punto más alto.', 'En el punto más alto se anula la componente vertical, no la horizontal.']
      ],
      explicacion: `La única aceleración es ${GG}, que es vertical. Como no hay aceleración horizontal, ${VX} no cambia.` },
    { clave: 'llegada', esc: (r) => ({ h: 0, v: elegir(r, [3.5, 4, 4.5]), ang: elegir(r, [35, 50, 60]) }),
      pregunta: 'La bola sale desde la mesa con un ángulo sobre la horizontal y vuelve a caer sobre la mesa. Sin resistencia del aire, <b>indique</b> cómo es su rapidez al llegar, comparada con la de salida.',
      correcta: 'Igual que la rapidez de salida.',
      falsas: [
        ['Mayor que la rapidez de salida.', 'Lo que la gravedad le quita al subir se lo devuelve al bajar hasta la misma altura.'],
        ['Menor que la rapidez de salida.', 'Sin resistencia del aire no se pierde energía: compara la altura de salida con la de llegada.'],
        ['Cero.', 'La bola llega moviéndose: compara cada componente de la velocidad al salir y al llegar.']
      ],
      explicacion: `${VX} no cambia y ${VY} vuelve con el mismo valor y signo contrario, porque la bola regresa a la altura de salida. La rapidez es la misma.` },
    { clave: 'aire', esc: (r) => ({ h: 0, v: elegir(r, [4, 4.5, 5]), ang: elegir(r, [40, 45, 50]), aire: true }),
      pregunta: 'Se repite un lanzamiento oblicuo, pero ahora con una resistencia del aire apreciable. <b>Indique</b> cómo cambia la trayectoria.',
      correcta: 'El alcance y la altura máxima son menores, y la bajada es más empinada que la subida.',
      falsas: [
        ['El alcance y la altura máxima son menores, pero la trayectoria sigue siendo simétrica.', 'La bola va perdiendo rapidez horizontal durante todo el vuelo: ¿avanza lo mismo en la bajada que en la subida?'],
        ['El alcance es menor, pero la altura máxima es la misma.', 'El aire también frena el movimiento vertical durante la subida.'],
        ['El alcance es mayor, porque la bola tarda más en caer.', 'La resistencia del aire se opone al movimiento: la bola pierde rapidez.']
      ],
      explicacion: 'La resistencia del aire se opone a la velocidad: reduce las dos componentes. La bola sube menos y llega menos lejos; como va perdiendo rapidez horizontal, la bajada es más empinada que la subida y la trayectoria deja de ser simétrica.' }
  ];
  function ejConcepto(r) {
    const c = elegir(r, CONCEPTOS);
    return {
      id: 'conceptos', clave: c.clave, tipo: 'texto', titulo: 'Interpretar el movimiento', esc: c.esc(r), enunciado: c.pregunta,
      opciones: barajar(r, [{ texto: c.correcta, correcta: true }].concat(c.falsas.map(f => ({ texto: f[0], correcta: false, pista: f[1] })))),
      explicacion: c.explicacion
    };
  }

  // ---------- Gráficas y trayectorias ----------
  const transformar = (pts, f) => pts.map(p => [p[0], f(p[1], p[0])]);
  function ejGrafica(r, vertical) {
    // en la de vx, ángulos grandes: así la rapidez total (un distractor) se distingue bien de la componente horizontal
    const v = elegir(r, [3.5, 4, 4.5, 5]), ang = elegir(r, vertical ? [35, 40, 50, 55, 60] : [50, 55, 60, 65]);
    const p = new Proyectil(0, v, ang), Tf = p.duracion, ux = p.ux, uy = p.uy;
    const recta = (a, b) => [[0, a], [Tf, b]];
    let correcta, falsas;
    if (vertical) {
      correcta = recta(uy, -uy);
      falsas = [
        { puntos: [[0, uy], [Tf / 2, 0], [Tf, uy]], pista: `Esa gráfica no tiene valores negativos. Con «arriba +», ${VY} es negativa cuando la bola baja.` },
        { puntos: recta(uy, uy), pista: `La gravedad cambia la componente vertical de la velocidad durante todo el vuelo.` },
        { puntos: transformar(p.puntos('y', 40), y => y * uy / p.alturaMax()), pista: `Esa es la forma de la gráfica de la altura, no la de ${VY}. La aceleración vertical es constante: ¿qué forma tiene entonces ${VY}–${T}?` },
        { puntos: recta(-uy, uy), pista: `Revisa el signo: al salir, la bola sube, así que ${VY} empieza siendo positiva.` }
      ];
    } else {
      correcta = recta(ux, ux);
      falsas = [
        { puntos: recta(ux, 0), pista: `Sin resistencia del aire no hay aceleración horizontal: nada frena a la bola en esa dirección.` },
        { puntos: p.puntos('rapidez', 40), pista: `Esa es la forma de la rapidez total, que cambia por la componente vertical. La componente horizontal va aparte.` },
        { puntos: [[0, ux], [Tf / 2, 0], [Tf, ux]], pista: `En el punto más alto se anula la componente vertical, no la horizontal.` },
        { puntos: recta(0, ux), pista: `La bola sale del lanzador ya con su componente horizontal; no hay nada que la haga aumentar.` }
      ];
    }
    const elegidas = barajar(r, falsas).slice(0, 3);
    return {
      id: vertical ? 'grafica-vy' : 'grafica-vx', tipo: 'grafica', titulo: vertical ? 'Gráfica de la componente vertical' : 'Gráfica de la componente horizontal',
      esc: { h: 0, v, ang }, mag: vertical ? 'vy' : 'vx', tMax: Tf,
      enunciado: `La bola sale desde la mesa con un ángulo sobre la horizontal y vuelve a caer sobre la mesa, sin resistencia del aire (arriba es positivo). <b>Identifique</b> la gráfica de la componente ${vertical ? 'vertical' : 'horizontal'} de su velocidad en función del tiempo.`,
      opciones: barajar(r, [{ puntos: correcta, correcta: true }].concat(elegidas.map(f => ({ puntos: f.puntos, correcta: false, pista: f.pista })))),
      explicacion: vertical
        ? `En vertical la aceleración es constante (−${GG}): ${VY} = ${UY} − ${GG}${T} es una recta de pendiente −9,81 m s⁻², que empieza en ${UY} = ${cs3(uy)} m s⁻¹, pasa por cero en el punto más alto y termina en −${cs3(uy)} m s⁻¹.`
        : `No hay aceleración horizontal: ${VX} = ${cs3(ux)} m s⁻¹ durante todo el vuelo, una recta horizontal.`
    };
  }

  function ejTrayectoriaAire(r) {
    const v = elegir(r, [4, 4.5, 5]), ang = elegir(r, [40, 45, 50, 55]);
    const sinAire = new Proyectil(0, v, ang), conAire = new Proyectil(0, v, ang, { k: K_AIRE });
    const ref = sinAire.puntos('tray', 60), real = conAire.puntos('tray', 60), Ra = conAire.alcance();
    const escalar = (pts, fx, fy) => pts.map(p => [p[0] * fx, p[1] * fy]);
    // Los distractores cambian solo el alcance, solo la altura, o los aumentan. (La asimetría es demasiado
    // sutil para distinguirla en un dibujo pequeño; se trabaja en los ejercicios de interpretar.)
    const fR = Ra / sinAire.alcance();
    const falsas = [
      { puntos: escalar(ref, 1.18, 1), pista: 'La resistencia del aire frena a la bola: no puede llegar más lejos que sin aire.' },
      { puntos: escalar(ref, fR, 1.16), pista: 'El aire también frena la subida: la altura máxima no puede ser mayor que sin aire.' },
      { puntos: escalar(ref, fR, 1), pista: 'El alcance disminuye, sí; pero el aire también frena el movimiento vertical durante la subida.' },
      { puntos: escalar(ref, 1, conAire.alturaMax() / sinAire.alturaMax() * 0.9), pista: 'La altura disminuye, sí; pero el aire también frena el movimiento horizontal durante todo el vuelo.' }
    ];
    const elegidas = barajar(r, falsas).slice(0, 3);
    return {
      id: 'trayectoria-aire', tipo: 'trayectoria', titulo: 'Trayectoria con resistencia del aire', esc: { h: 0, v, ang, aire: true }, referencia: ref,
      enunciado: 'La línea gris discontinua es la trayectoria de la bola sin resistencia del aire. <b>Identifique</b> la trayectoria de la misma bola, lanzada igual, cuando la resistencia del aire es apreciable.',
      opciones: barajar(r, [{ puntos: real, correcta: true }].concat(elegidas.map(f => ({ puntos: f.puntos, correcta: false, pista: f.pista })))),
      explicacion: 'La resistencia del aire se opone a la velocidad. La bola sube menos y llega menos lejos; como pierde rapidez horizontal durante todo el vuelo, el punto más alto queda desplazado hacia el final y la bajada es más empinada que la subida.'
    };
  }

  // ---------- Coloca la bandeja ----------
  function ejBandeja(r) {
    for (let i = 0; i < 200; i++) {
      const desdeAltura = r() < 0.5;
      const h = desdeAltura ? elegir(r, ALTURAS) : 0, ang = desdeAltura ? elegir(r, [0, 0, 20, 30, 40]) : elegir(r, ANGULOS), v = elegir(r, RAPIDECES.slice(1));
      const p = new Proyectil(h, v, ang), R = p.alcance(), Tf = p.duracion;
      if (R < 0.6 || R > 3.3) continue;
      const pistas = limpiarPistas([
        { valor: v * Tf, texto: `En horizontal la bola avanza con la componente horizontal ${UX}, no con ${U}.` },
        { valor: p.ux * p.tCumbre, texto: 'Usaste solo el tiempo de subida. Hace falta el tiempo de vuelo completo.' },
        h > 0 ? { valor: p.ux * 2 * p.uy / G, texto: `La bola no cae a la altura de salida, sino ${n2(h)} m más abajo: el tiempo de vuelo es mayor.` } : null,
        h > 0 ? { valor: v * h / v, texto: 'La distancia horizontal no tiene por qué ser igual a la altura: calcula el tiempo de caída.' } : null,
        { valor: p.uy * Tf, texto: `Usaste la componente vertical para avanzar. En horizontal se usa ${UX}.` }
      ], R, 0.06);
      return {
        id: 'bandeja', tipo: 'bandeja', titulo: 'Coloca la bandeja', esc: { h, v, ang }, respuesta: R, tolerancia: 0.06, pistas,
        enunciado: `La bola va a salir del lanzador con estos valores, sin resistencia del aire:` +
          datos([`rapidez ${U} = ${n1(v)} m s⁻¹`, `ángulo ${TH} = ${ang}°`, `altura del lanzador ${H} = ${n2(h)} m`]) +
          `<b>Determine</b> dónde caerá y arrastra la bandeja de arena hasta ese punto.`,
        pistaCorta: 'La bola caería más lejos. Calcula el tiempo de vuelo con el movimiento vertical y después la distancia horizontal.',
        pistaLarga: 'La bola caería más cerca. Calcula el tiempo de vuelo con el movimiento vertical y después la distancia horizontal.',
        explicacion: (ang === 0
          ? `En vertical la bola parte con ${UY} = 0: ${T} = √(2${H}/${GG}) = ${cs3(Tf)} s. `
          : `${UX} = ${cs3(p.ux)} m s⁻¹ y ${UY} = ${cs3(p.uy)} m s⁻¹. ` + (h > 0
            ? `En vertical, −${n2(h)} = ${UY} ${T} − ½ ${GG} ${T}², cuya solución positiva es ${T} = ${cs3(Tf)} s. `
            : `Tiempo de vuelo: ${T} = 2 ${UY} / ${GG} = ${cs3(Tf)} s. `)) +
          `Distancia horizontal: ${ang === 0 ? U : UX} ${T} = ${cs3(p.ux)} × ${cs3(Tf)} = <b>${cs3(R)} m</b>.`
      };
    }
    return null;
  }

  // ---------- Corrección ----------
  function corregirNumero(ej, valor, unidad) {
    if (!isFinite(valor)) return { ok: false, pista: 'Escribe un número (puedes usar coma decimal).' };
    if (Math.abs(valor - ej.respuesta) <= ej.tolerancia) {
      return unidad === ej.unidad ? { ok: true } : { ok: false, pista: 'El número es correcto. Revisa la unidad.' };
    }
    for (const p of ej.pistas) if (Math.abs(valor - p.valor) <= Math.max(0.01, 0.01 * Math.abs(p.valor))) return { ok: false, pista: p.texto };
    return { ok: false, pista: ej.pistaGeneral };
  }
  function corregirBandeja(ej, x) {
    if (Math.abs(x - ej.respuesta) <= ej.tolerancia) return { ok: true };
    for (const p of ej.pistas) if (Math.abs(x - p.valor) <= 0.035) return { ok: false, pista: p.texto };
    return { ok: false, pista: x < ej.respuesta ? ej.pistaCorta : ej.pistaLarga };
  }

  // ---------- Catálogo ----------
  const TIPOS = {
    'componentes': ejComponentes,
    'tiempo-vuelo': (r) => ejOblicuo(r, 'tiempo'),
    'altura-maxima': (r) => ejOblicuo(r, 'altura'),
    'alcance': (r) => ejOblicuo(r, 'alcance'),
    'horizontal-tiempo': (r) => ejHorizontal(r, 'tiempo'),
    'horizontal-alcance': (r) => ejHorizontal(r, 'alcance'),
    'rapidez-llegada': (r) => ejHorizontal(r, 'llegada'),
    'conceptos': ejConcepto,
    'grafica-vy': (r) => ejGrafica(r, true),
    'grafica-vx': (r) => ejGrafica(r, false),
    'trayectoria-aire': ejTrayectoriaAire,
    'bandeja': ejBandeja
  };
  const GRUPOS = {
    calcular: ['componentes', 'tiempo-vuelo', 'altura-maxima', 'alcance', 'horizontal-tiempo', 'horizontal-alcance', 'rapidez-llegada'],
    interpretar: ['conceptos'],
    graficas: ['grafica-vy', 'grafica-vx', 'trayectoria-aire'],
    bandeja: ['bandeja']
  };
  GRUPOS.todos = [].concat(GRUPOS.calcular, GRUPOS.interpretar, GRUPOS.interpretar, GRUPOS.graficas, GRUPOS.bandeja, GRUPOS.bandeja);

  function generar(r, id) {
    for (let i = 0; i < 300; i++) { const ej = TIPOS[id](r); if (ej) return ej; }
    throw new Error('No se pudo generar un ejercicio de tipo ' + id);
  }

  const api = { TIPOS, GRUPOS, CONCEPTOS, K_AIRE, generar, rngSemilla, elegir, corregirNumero, corregirBandeja };
  if (enNode) module.exports = api; else raiz.ProyEjercicios = api;
})(this);
