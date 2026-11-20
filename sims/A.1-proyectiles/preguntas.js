/* A.1 · Movimiento de proyectiles — preguntas guiadas de Explorar (sin pantalla).
   Las respuestas salen del mismo modelo que dibuja la simulación (comun/proyectil.js); las preguntas de
   opción traen «verifica(ctx)», que comprueba con el modelo lo que afirma la opción correcta. */
(function (raiz) {
  'use strict';
  const nodo = typeof module !== 'undefined' && module.exports;
  const { Proyectil, G, RAD } = nodo ? require('../../comun/proyectil.js') : raiz.ProyectilFisica;
  const Guia = nodo ? require('../../comun/guia.js') : raiz.Guia;
  const c3 = Guia.c3;
  const K_AIRE = 0.3;
  const A0 = '<i>a</i>', V = '<i>v</i>', U = '<i>u</i>', T = '<i>t</i>', H = '<i>h</i>', g = '<i>g</i>', TH = '<i>θ</i>';
  const VX = `${V}<sub>x</sub>`, VY = `${V}<sub>y</sub>`, UX = `${U}<sub>x</sub>`, UY = `${U}<sub>y</sub>`;
  const cerca = (x, y, e) => Math.abs(x - y) <= (e || 1e-9);
  const n2 = (x) => c3(x);

  const SIT = {
    hor:     { nombre: 'Lanzamiento horizontal', nivel: 1, par: { h: 0.8, ang: 0, v: 2.5 } },
    horRap:  { nombre: 'Horizontal, más rápido', nivel: 1, par: { h: 0.8, ang: 0, v: 4.5 } },
    a45:     { nombre: 'Desde la mesa a 45°', nivel: 2, par: { h: 0, ang: 45, v: 4 } },
    a30:     { nombre: 'Desde la mesa a 30°', nivel: 2, par: { h: 0, ang: 30, v: 4 } },
    a60:     { nombre: 'Desde la mesa a 60°', nivel: 2, par: { h: 0, ang: 60, v: 4 } },
    alto:    { nombre: 'Desde una altura', nivel: 3, par: { h: 0.6, ang: 35, v: 4 }, aire: false },
    aire:    { nombre: 'Con resistencia del aire', nivel: 3, par: { h: 0.6, ang: 35, v: 4 }, aire: true }
  };
  function contextoDe(par, nivel, aire) {
    return { par: Object.assign({}, par), p: new Proyectil(par.h, par.v, par.ang),
      pAire: nivel === 3 && aire ? new Proyectil(par.h, par.v, par.ang, { k: K_AIRE }) : null };
  }
  const contexto = (id) => contextoDe(SIT[id].par, SIT[id].nivel, SIT[id].aire);
  const ux = (c) => c.p.ux, uy = (c) => c.p.uy;
  // Instante en que la bola con aire vuelve a pasar por la altura de salida (bisección después de la cumbre)
  function bajadaConAire(pa) {
    let a = pa.tCumbre, b = pa.duracion;
    if (pa.y(b) > pa.h) return b;
    for (let i = 0; i < 80; i++) { const m = (a + b) / 2; if (pa.y(m) > pa.h) a = m; else b = m; }
    return (a + b) / 2;
  }
  const OC_T = ['resT', 'valT'], OC_R = ['resR', 'valX', 'cotas'], OC_H = ['resH', 'valY', 'cotas'];

  const NIVELES = {
    1: [
      { sit: 'hor', tipo: 'opcion', texto: 'Pulsa «Reproducir». Una bola sale en horizontal y la otra se suelta en el mismo instante y desde la misma altura. ¿Cuál llega antes a la mesa?',
        opciones: [
          ['Llegan a la vez', true],
          ['La que se suelta', false, `Mira las huellas: en cada instante las dos bolas están a la misma altura. El movimiento horizontal no cambia la caída.`],
          ['La que se lanza', false, `La velocidad horizontal no ayuda a caer más rápido: la componente vertical de las dos empieza en 0 y cambia igual.`]
        ],
        explicacion: `Las dos tienen ${UY} = 0 y la misma aceleración ${g} hacia abajo: la caída es idéntica. La componente horizontal es independiente.`,
        verifica: (c) => cerca(c.p.duracion, new Proyectil(c.par.h, 0, 0).duracion) },
      { sit: 'hor', tipo: 'valor', oculta: OC_T,
        texto: `<b>Calcula</b> el tiempo de vuelo de la bola lanzada (usa ${g} = 9,81 m s⁻²).`,
        unidad: 's', respuesta: (c) => c.p.duracion,
        pista: `Solo importa la vertical: ${H} = ½${g}${T}², con ${UY} = 0.`,
        resolucion: (c) => `${T} = √(2${H}/${g}) = √(2 × ${n2(c.par.h)} / 9,81) = <b>${c3(c.p.duracion)} s</b>` },
      { sit: 'hor', tipo: 'valor', oculta: OC_R,
        texto: `<b>Calcula</b> el alcance horizontal.`,
        unidad: 'm', respuesta: (c) => c.p.alcance(),
        pista: `En horizontal la velocidad es constante: alcance = ${UX} × tiempo de vuelo.`,
        pistaExtra: (x, c) => cerca(x, c.p.duracion, 0.01 * c.p.duracion) ? 'Ese es el tiempo de vuelo. Multiplícalo por la velocidad horizontal.' : null,
        resolucion: (c) => `${T} = √(2${H}/${g}) = ${c3(c.p.duracion)} s; alcance = ${UX}${T} = (${n2(c.par.v)})(${c3(c.p.duracion)}) = <b>${c3(c.p.alcance())} m</b>` },
      { sit: 'horRap', tipo: 'opcion', texto: 'Ahora la bola sale casi al doble de rapidez. ¿Qué pasa con el tiempo de vuelo?',
        opciones: [
          ['No cambia', true],
          ['Aumenta, porque llega más lejos', false, `Llega más lejos porque avanza más rápido en horizontal, no porque esté más tiempo en el aire. Compara el tiempo con el de la pregunta anterior.`],
          ['Disminuye, porque va más rápido', false, `La rapidez es horizontal: no cambia la caída. Mira la bola soltada: sigue llegando a la vez.`]
        ],
        explicacion: `El tiempo de vuelo depende solo de ${H} (y de ${g}): √(2${H}/${g}). La rapidez horizontal cambia el alcance, no el tiempo.`,
        verifica: (c) => cerca(c.p.duracion, new Proyectil(c.par.h, 2.5, 0).duracion) && c.p.alcance() > new Proyectil(c.par.h, 2.5, 0).alcance() },
      { sit: 'hor', tipo: 'opcion', texto: `Mira las gráficas ${VX}–${T} y ${VY}–${T}. ¿Qué componente de la velocidad cambia durante el vuelo?`,
        opciones: [
          [`Solo ${VY}`, true],
          [`Solo ${VX}`, false, `La ${VX}–${T} es horizontal: ${VX} no cambia. Ninguna fuerza horizontal actúa (sin aire).`],
          ['Las dos', false, `Fíjate en la ${VX}–${T}: es una recta horizontal. Solo cambia la componente en la dirección de ${g}.`]
        ],
        explicacion: `${g} es vertical: ${VY} cambia 9,81 m s⁻¹ cada segundo y ${VX} se mantiene igual a ${UX}.`,
        verifica: (c) => cerca(c.p.vx(0), c.p.vx(0.9 * c.p.duracion)) && c.p.vy(0.9 * c.p.duracion) < -1 },
      { sit: 'hor', tipo: 'valor', oculta: ['valV', 'valVy'],
        texto: `<b>Calcula</b> la rapidez con que la bola llega a la mesa.`,
        unidad: 'm s⁻¹', respuesta: (c) => c.p.rapidez(c.p.duracion),
        pista: `Halla ${VY} al llegar (${VY}² = 2${g}${H}) y combínala con ${VX} por Pitágoras.`,
        pistaExtra: (x, c) => cerca(Math.abs(x), Math.abs(c.p.vy(c.p.duracion)), 0.02 * Math.abs(c.p.vy(c.p.duracion))) ? `Esa es solo la componente vertical. La rapidez combina ${VX} y ${VY}.` : null,
        resolucion: (c) => { const vy = c.p.vy(c.p.duracion);
          return `${VY} = −√(2${g}${H}) = ${c3(vy)} m s⁻¹; ${VX} = ${n2(c.par.v)} m s⁻¹.<br>${V} = √(${VX}² + ${VY}²) = √(${n2(c.par.v)}² + (${c3(vy)})²) = <b>${c3(c.p.rapidez(c.p.duracion))} m s⁻¹</b>`; } }
    ],
    2: [
      { sit: 'a45', tipo: 'opcion', texto: `Pausa la bola en el punto más alto. ¿Cuánto vale ahí su velocidad?`,
        opciones: [
          [`${U} cos ${TH}, horizontal`, true],
          ['Cero, porque se detiene', false, `Solo se anula ${VY}. Mira la ${VX}–${T}: la componente horizontal no cambia en todo el vuelo.`],
          [`${U} sen ${TH}, vertical`, false, `${U} sen ${TH} es la componente vertical al <i>salir</i>; en la cumbre esa componente vale 0.`]
        ],
        explicacion: (c) => `En la cumbre ${VY} = 0 y queda solo ${VX} = ${U} cos ${TH} = ${c3(c.p.vx(0))} m s⁻¹: la bola nunca se detiene.`,
        verifica: (c) => cerca(c.p.rapidez(c.p.tCumbre), c.par.v * Math.cos(c.par.ang * RAD), 1e-9) && cerca(c.p.vy(c.p.tCumbre), 0, 1e-9) },
      { sit: 'a45', tipo: 'opcion', texto: `Activa «Aceleración». ¿Cuál es la aceleración de la bola en el punto más alto?`,
        opciones: [
          [`${g} = 9,81 m s⁻², hacia abajo`, true],
          ['Cero, porque ahí se detiene', false, `Si ${A0} fuera 0 en la cumbre, ${VY} seguiría siendo 0 y la bola no bajaría. La flecha roja no cambia en todo el vuelo.`],
          ['Horizontal, en el sentido del movimiento', false, `No hay ninguna fuerza horizontal (sin aire). La única fuerza es el peso, vertical.`]
        ],
        explicacion: `La aceleración es ${g} hacia abajo durante <b>todo</b> el vuelo, también en la cumbre.`,
        verifica: (c) => c.p.ay(c.p.tCumbre) === -G && c.p.ax(c.p.tCumbre) === 0 },
      { sit: 'a30', tipo: 'valor', oculta: OC_H,
        texto: `<b>Calcula</b> la altura máxima que alcanza la bola sobre la mesa.`,
        unidad: 'm', respuesta: (c) => c.p.alturaMax(),
        pista: `En la cumbre ${VY} = 0: 0 = ${UY}² − 2${g}${H}, con ${UY} = ${U} sen ${TH}.`,
        pistaExtra: (x, c) => cerca(x, c.par.v * c.par.v / (2 * G), 0.02 * c.par.v * c.par.v / (2 * G)) ? `Usaste ${U} completa. En la vertical solo cuenta ${UY} = ${U} sen ${TH}.` : null,
        resolucion: (c) => `${UY} = ${n2(c.par.v)} sen ${c.par.ang}° = ${c3(uy(c))} m s⁻¹; ${H}<sub>máx</sub> = ${UY}²/(2${g}) = (${c3(uy(c))})²/19,62 = <b>${c3(c.p.alturaMax())} m</b>` },
      { sit: 'a30', tipo: 'valor', oculta: OC_R.concat(OC_T),
        texto: `<b>Calcula</b> el alcance sobre la mesa.`,
        unidad: 'm', respuesta: (c) => c.p.alcance(),
        pista: `Tiempo de vuelo = 2${UY}/${g} (sube y baja a la misma altura); alcance = ${UX} × tiempo de vuelo.`,
        pistaExtra: (x, c) => cerca(x, c.p.alcance() / 2, 0.02 * c.p.alcance()) ? `Usaste solo el tiempo de subida. El vuelo dura el doble: sube y baja.` : null,
        resolucion: (c) => `${UX} = ${n2(c.par.v)} cos ${c.par.ang}° = ${c3(ux(c))} m s⁻¹; ${UY} = ${c3(uy(c))} m s⁻¹.<br>${T} = 2${UY}/${g} = ${c3(c.p.duracion)} s; alcance = ${UX}${T} = <b>${c3(c.p.alcance())} m</b>` },
      { sit: 'a60', tipo: 'opcion', texto: `Misma rapidez, pero ahora a 60°. Comparado con el lanzamiento a 30°, ¿cómo es el alcance?`,
        opciones: [
          ['Igual', true],
          ['Mayor, porque sube más', false, `Sube más y está más tiempo en el aire, pero avanza más despacio en horizontal (${U} cos 60° es menor).`],
          ['Menor, porque el ángulo es mayor', false, `Mira la cota del alcance: compárala con la de 30°. Los ángulos complementarios dan el mismo alcance.`]
        ],
        explicacion: `Alcance = ${U}² sen 2${TH}/${g}, y sen 120° = sen 60°. Con 60° sube más y tarda más, pero la altura máxima no decide el alcance.`,
        verifica: (c) => cerca(c.p.alcance(), new Proyectil(0, c.par.v, 90 - c.par.ang).alcance(), 1e-9) },
      { sit: 'a45', tipo: 'opcion', texto: `Saliendo y llegando a la misma altura, ¿con qué ángulo es <b>máximo</b> el alcance? Prueba con el deslizador.`,
        opciones: [
          ['45°', true],
          ['90°', false, `Hacia arriba sube lo más posible, pero vuelve al mismo lugar: alcance 0.`],
          ['60°', false, `Compara 60° con 45° con la misma rapidez: la cota del alcance es menor.`]
        ],
        explicacion: `sen 2${TH} vale 1 con ${TH} = 45°. Ojo: solo cuando sale y llega a la misma altura (lo verás en el nivel 3).`,
        verifica: (c) => { const R = (a) => new Proyectil(0, c.par.v, a).alcance(); return R(45) > R(40) && R(45) > R(50) && R(45) > R(60); } }
    ],
    3: [
      { sit: 'alto', tipo: 'opcion', texto: `Ahora el lanzador está a 0,60 m sobre la mesa. ¿Sigue siendo 45° el ángulo de mayor alcance? Prueba varios ángulos.`,
        opciones: [
          ['No: el mejor ángulo es menor que 45°', true],
          ['Sí, siempre es 45°', false, `Compara el alcance con 35° y con 45°. Al caer desde más alto, conviene salir más «tendido».`],
          ['No: el mejor ángulo es mayor que 45°', false, `Con un ángulo mayor gana tiempo de vuelo, pero pierde mucha velocidad horizontal. Prueba 35°, 40° y 50°.`]
        ],
        explicacion: `Al llegar más abajo de donde sale, la bola gana tiempo de vuelo «gratis»: conviene más velocidad horizontal, es decir, un ángulo menor que 45°.`,
        verifica: (c) => { const R = (a) => new Proyectil(c.par.h, c.par.v, a).alcance(); return R(40) > R(45) && R(35) > R(45); } },
      { sit: 'alto', tipo: 'valor', oculta: OC_T.concat(OC_R),
        texto: `<b>Determina</b> el tiempo de vuelo hasta la mesa (la bola termina 0,60 m más abajo de donde sale).`,
        unidad: 's', respuesta: (c) => c.p.duracion,
        pista: `Vertical, con arriba +: −${H} = ${UY}${T} − ½${g}${T}². Es una ecuación de segundo grado: elige la raíz positiva.`,
        pistaExtra: (x, c) => cerca(x, 2 * uy(c) / G, 0.02 * 2 * uy(c) / G) ? `Ese sería el tiempo si llegara a la misma altura de salida. Aquí baja ${n2(c.par.h)} m más: usa la ecuación de 2.º grado.` : null,
        resolucion: (c) => `${UY} = ${n2(c.par.v)} sen ${c.par.ang}° = ${c3(uy(c))} m s⁻¹.<br>−${n2(c.par.h)} = ${c3(uy(c))}${T} − 4,905${T}² ⇒ 4,905${T}² − ${c3(uy(c))}${T} − ${n2(c.par.h)} = 0 ⇒ ${T} = <b>${c3(c.p.duracion)} s</b> (la otra raíz es negativa).` },
      { sit: 'alto', tipo: 'valor', oculta: ['valVy', 'valV'],
        texto: `<b>Calcula</b> la componente vertical de la velocidad al llegar a la mesa, ${VY}, con su signo.`,
        unidad: 'm s⁻¹', respuesta: (c) => c.p.vy(c.p.duracion),
        pista: `${VY}² = ${UY}² + 2${g}${H} (la mesa está ${H} por debajo de la salida). Al llegar la bola baja: ¿qué signo tiene?`,
        pistaSigno: `El valor es correcto, pero al llegar la bola se mueve hacia <b>abajo</b>: ${VY} es negativa.`,
        resolucion: (c) => `${VY}² = ${UY}² + 2${g}${H} = (${c3(uy(c))})² + 2(9,81)(${n2(c.par.h)}) ⇒ ${VY} = <b>${c3(c.p.vy(c.p.duracion))} m s⁻¹</b> (negativa: baja).` },
      { sit: 'aire', tipo: 'opcion', texto: `Se compara con una bola que sufre resistencia del aire (trazo discontinuo). ¿Qué les pasa al alcance y a la altura máxima?`,
        opciones: [
          ['Los dos disminuyen', true],
          ['Disminuye el alcance, pero la altura máxima es la misma', false, `Mira las dos cumbres: el aire también frena la subida.`],
          ['No cambian: el aire solo frena en horizontal', false, `La resistencia del aire se opone a la <i>velocidad</i>, que tiene componente horizontal y vertical.`]
        ],
        explicacion: `La resistencia del aire actúa en sentido contrario a la velocidad: frena la subida (menor altura) y el avance (menor alcance).`,
        verifica: (c) => c.pAire.alcance() < c.p.alcance() && c.pAire.alturaMax() < c.p.alturaMax() },
      { sit: 'aire', tipo: 'opcion', texto: `Con aire, ¿tarda la bola lo mismo en subir hasta la cumbre que en bajar de nuevo a la altura de salida?`,
        opciones: [
          ['No: tarda más en bajar', true],
          ['Sí: la trayectoria sigue siendo simétrica', false, `Sin aire sí. Con aire, al subir el peso y el arrastre apuntan hacia abajo; al bajar, el arrastre se opone al peso.`],
          ['No: tarda más en subir', false, `Al subir, el peso y el arrastre frenan juntos: la subida es más corta. Al bajar, el arrastre se opone al peso.`]
        ],
        explicacion: `Al subir, el arrastre se suma al peso (frena más deprisa); al bajar, se le opone (acelera menos). Por eso la bajada es más lenta y más empinada.`,
        verifica: (c) => bajadaConAire(c.pAire) - c.pAire.tCumbre > c.pAire.tCumbre },
      { sit: 'aire', tipo: 'opcion', texto: `Durante el vuelo con aire, ¿qué fuerzas actúan sobre la bola?`,
        opciones: [
          ['El peso, hacia abajo, y el arrastre del aire, opuesto a la velocidad', true],
          ['El peso y una fuerza del lanzamiento en el sentido del movimiento', false, `La fuerza del lanzador solo actúa mientras lo toca. En el aire nada «empuja» a la bola hacia delante: por eso ${VX} disminuye.`],
          ['Solo el arrastre del aire', false, `La Tierra sigue atrayendo a la bola: el peso actúa siempre.`]
        ],
        explicacion: `Peso (vertical, constante) y arrastre (opuesto a la velocidad, mayor cuanto más rápido va). Mira la ${VX}–${T}: con aire ya no es horizontal.`,
        verifica: (c) => c.pAire.ax(0.3 * c.pAire.duracion) < 0 && c.pAire.vx(0.9 * c.pAire.duracion) < c.pAire.vx(0) }
    ]
  };

  const api = { SIT, NIVELES, contexto, contextoDe, K_AIRE, bajadaConAire };
  if (nodo) module.exports = api; else raiz.PreguntasProy = api;
})(typeof window !== 'undefined' ? window : globalThis);
