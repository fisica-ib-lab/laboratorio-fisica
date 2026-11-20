/* A.1 · Un movimiento, tres gráficas — preguntas guiadas de Explorar (sin pantalla).
   Cada situación fija los valores de la simulación; cada respuesta se calcula con el modelo que se ve
   (comun/cinematica.js), así que sigue siendo correcta aunque el alumno mueva los deslizadores.
   Las preguntas de opción traen «verifica(ctx)»: comprueba con el modelo lo que afirma la opción correcta. */
(function (raiz) {
  'use strict';
  const Cin = typeof module !== 'undefined' && module.exports ? require('../../comun/cinematica.js') : raiz.Cinematica;
  const Guia = typeof module !== 'undefined' && module.exports ? require('../../comun/guia.js') : raiz.Guia;
  const { Movimiento } = Cin, c3 = Guia.c3;
  const V = '<i>v</i>', U = '<i>u</i>', A = '<i>a</i>', S = '<i>s</i>', T = '<i>t</i>';
  const PISTA = { min: -30, max: 30 }, TMAX = 10;
  const cerca = (x, y, e) => Math.abs(x - y) <= (e || 1e-9);

  // Casos del nivel 3 (los mismos que en sim.js, por índice)
  const CASOS3 = [
    { s0: -12, u: 0, tramos: [{ duracion: 4, a: 1 }, { duracion: 2, a: 0 }, { duracion: 4, a: -1 }] },
    { s0: -5, u: 2, tramos: [{ duracion: 3, a: 0 }, { duracion: 1, a: -2 }, { duracion: 2, a: 0 }, { duracion: 1, a: -2 }, { duracion: 3, a: 0 }] },
    { s0: -5, u: 4, tramos: [{ duracion: 6, a: -1 }, { duracion: 4, a: 0 }] },
    { s0: -20, u: 0, tramos: [{ duracion: 4, a: 0.5 }, { duracion: 4, a: 1 }, { duracion: 2, a: 0 }] }
  ];
  const SIT = {
    der:     { nombre: 'Velocidad constante hacia la derecha', nivel: 1, par: { s0: -10, v: 2, a: 0 } },
    izq:     { nombre: 'Velocidad constante hacia la izquierda', nivel: 1, par: { s0: 10, v: -1.5, a: 0 } },
    reposo:  { nombre: 'En reposo', nivel: 1, par: { s0: 5, v: 0, a: 0 } },
    acelera: { nombre: 'Acelera desde el reposo', nivel: 2, par: { s0: -10, v: 0, a: 0.5 } },
    frena:   { nombre: 'Frena hacia la derecha', nivel: 2, par: { s0: -10, v: 4, a: -0.4 } },
    izqAce:  { nombre: 'Acelera hacia la izquierda', nivel: 2, par: { s0: 10, v: 0, a: -0.5 } },
    vuelve:  { nombre: 'Va y vuelve', nivel: 2, par: { s0: -10, v: 4, a: -0.8 } },
    arranca: { nombre: 'Arranca y frena', nivel: 3, caso: 0 },
    espera:  { nombre: 'Va, espera y vuelve', nivel: 3, caso: 1 },
    regresa: { nombre: 'Frena y regresa', nivel: 3, caso: 2 },
    dosAce:  { nombre: 'Dos aceleraciones', nivel: 3, caso: 3 }
  };
  // Movimiento de los niveles 1 y 2, igual que movimientoDe de sim.js (se corta al final de la pista)
  function movimientoPar(p, nivel) {
    let m = new Movimiento(p.s0, p.v, [{ duracion: TMAX, a: nivel === 2 ? p.a : 0 }]);
    const tc = m.primerCruce(PISTA.min, PISTA.max);
    if (tc !== null && tc < TMAX) m = m.recortar(tc);
    return m;
  }
  function contexto(id) {
    const s = SIT[id];
    if (s.nivel === 3) { const d = CASOS3[s.caso]; return { mov: new Movimiento(d.s0, d.u, d.tramos), par: null }; }
    const par = Object.assign({}, s.par);
    return { mov: movimientoPar(par, s.nivel), par };
  }
  const fin = (ctx) => ctx.mov.duracion;
  const tEn = (ctx, t) => Math.min(t, fin(ctx));
  const OCULTA_V = ['valV', 'valRap', 'outV', 'pildoras'], OCULTA_A = ['valA', 'outA', 'pildoras'];

  const NIVELES = {
    1: [
      { sit: 'der', tipo: 'opcion', texto: `Mira la gráfica ${S}–${T}. ¿Qué magnitud da su <b>pendiente</b>?`,
        opciones: [
          [`La velocidad ${V}`, true],
          [`La aceleración ${A}`, false, `La aceleración es la pendiente de la ${V}–${T}. La pendiente de la ${S}–${T} es Δ${S}/Δ${T}: ¿qué magnitud mide eso?`],
          ['La distancia recorrida', false, `La distancia se lee en el eje vertical (como cambio de ${S}), no en la inclinación. La pendiente es un cociente Δ${S}/Δ${T}.`],
          ['La posición del carrito', false, `La posición es la altura de la gráfica en cada instante, no su inclinación.`]
        ],
        explicacion: `Pendiente = Δ${S}/Δ${T} = ${V}. Aquí la ${S}–${T} es una recta, así que ${V} es constante.`,
        verifica: (ctx) => cerca((ctx.mov.s(4) - ctx.mov.s(1)) / 3, ctx.mov.v(2)) },
      { sit: 'der', tipo: 'valor', oculta: OCULTA_V,
        texto: `Lee en la gráfica ${S}–${T} la posición en ${T} = 2 s y en ${T} = 6 s y <b>calcula</b> la pendiente. ¿Cuánto vale la velocidad?`,
        unidad: 'm s⁻¹', respuesta: (ctx) => (ctx.mov.s(tEn(ctx, 6)) - ctx.mov.s(tEn(ctx, 2))) / (tEn(ctx, 6) - tEn(ctx, 2)),
        pista: `Pendiente = (${S}₂ − ${S}₁)/(${T}₂ − ${T}₁). Usa la barra de tiempo o haz clic en la gráfica para leer ${S} en cada instante.`,
        resolucion: (ctx) => { const a = ctx.mov.s(tEn(ctx, 2)), b = ctx.mov.s(tEn(ctx, 6)), d = tEn(ctx, 6) - tEn(ctx, 2);
          return `${V} = Δ${S}/Δ${T} = (${c3(b)} − (${c3(a)})) m / ${c3(d)} s = <b>${c3((b - a) / d)} m s⁻¹</b>`; } },
      { sit: 'izq', tipo: 'opcion', texto: `El carrito va hacia la izquierda con velocidad constante. ¿Cómo es su gráfica ${S}–${T}?`,
        opciones: [
          ['Una recta con pendiente negativa', true],
          ['Una recta horizontal por debajo del eje', false, `Una ${S}–${T} horizontal significa que la posición no cambia: el carrito estaría quieto.`],
          ['Una curva que baja cada vez más rápido', false, `Una curva indica que la pendiente (la velocidad) cambia. Aquí ${V} es constante.`]
        ],
        explicacion: `${S} disminuye lo mismo cada segundo: recta descendente, con pendiente igual a ${V} &lt; 0.`,
        verifica: (ctx) => ctx.mov.v(1) < 0 && cerca(ctx.mov.v(1), ctx.mov.v(5)) },
      { sit: 'izq', tipo: 'opcion', texto: `¿Y cómo es su gráfica ${V}–${T}?`,
        opciones: [
          ['Una recta horizontal por debajo del eje', true],
          ['Una recta horizontal por encima del eje', false, `Eso sería si se moviera hacia la derecha. Hacia la izquierda la velocidad es negativa (la <i>rapidez</i> sí es positiva).`],
          ['Una recta que baja', false, `Esa es la forma de la ${S}–${T}. En la ${V}–${T}, una recta que baja significaría que ${V} cambia.`]
        ],
        explicacion: (ctx) => `${V} = ${c3(ctx.mov.v(0))} m s⁻¹ en todo momento: recta horizontal en el valor negativo.`,
        verifica: (ctx) => ctx.mov.v(0.5) < 0 && cerca(ctx.mov.v(0.5), ctx.mov.v(7)) },
      { sit: 'izq', tipo: 'valor', oculta: ['valDes', 'valDist'],
        texto: `<b>Determina</b> el desplazamiento del carrito entre ${T} = 0 y ${T} = 8 s (con su signo).`,
        unidad: 'm', respuesta: (ctx) => ctx.mov.desplazamiento(tEn(ctx, 8)),
        pista: `Desplazamiento = posición final − posición inicial, o el área (con signo) bajo la ${V}–${T}.`,
        resolucion: (ctx) => { const t = tEn(ctx, 8), v = ctx.mov.v(0);
          return `Δ${S} = ${V}·${T} = (${c3(v)} m s⁻¹)(${c3(t)} s) = <b>${c3(ctx.mov.desplazamiento(t))} m</b>. Es negativo porque el carrito se mueve hacia la izquierda.`; } },
      { sit: 'reposo', tipo: 'opcion', texto: `El carrito está quieto en ${S} = 5 m. ¿Cómo es su gráfica ${V}–${T}?`,
        opciones: [
          [`Una recta sobre el eje ${T} (${V} = 0)`, true],
          [`Una recta horizontal en ${V} = 5`, false, `5 es la <i>posición</i>. Esa recta horizontal está en la ${S}–${T}; la velocidad de un cuerpo quieto es 0.`],
          ['No hay gráfica porque no se mueve', false, `Sí la hay: en cada instante ${V} vale 0.`]
        ],
        explicacion: `Quieto ⇒ ${V} = 0 en todo instante. La ${S}–${T} es horizontal en 5 m y la ${V}–${T} coincide con el eje.`,
        verifica: (ctx) => ctx.mov.v(3) === 0 && ctx.mov.s(3) === 5 }
    ],
    2: [
      { sit: 'acelera', tipo: 'opcion', texto: `Parte del reposo con ${A} &gt; 0 constante. ¿Qué forma tiene la gráfica ${S}–${T}?`,
        opciones: [
          ['Una curva cada vez más inclinada', true],
          ['Una recta inclinada', false, `Una recta tendría pendiente constante, es decir, ${V} constante. Aquí ${V} aumenta.`],
          ['Una curva cada vez más plana', false, `Si la pendiente disminuye, ${V} disminuye: eso sería frenar.`]
        ],
        explicacion: `La pendiente de la ${S}–${T} es ${V}, y ${V} crece: la curva (una parábola) se inclina cada vez más.`,
        verifica: (ctx) => ctx.mov.v(6) > ctx.mov.v(2) && ctx.mov.v(2) > 0 },
      { sit: 'acelera', tipo: 'valor', oculta: OCULTA_A,
        texto: `Lee dos puntos de la gráfica ${V}–${T} y <b>calcula</b> la aceleración del carrito.`,
        unidad: 'm s⁻²', respuesta: (ctx) => (ctx.mov.v(tEn(ctx, 6)) - ctx.mov.v(tEn(ctx, 2))) / (tEn(ctx, 6) - tEn(ctx, 2)),
        pista: `${A} = pendiente de la ${V}–${T} = Δ${V}/Δ${T}. Elige dos instantes bien separados.`,
        resolucion: (ctx) => { const a = ctx.mov.v(tEn(ctx, 2)), b = ctx.mov.v(tEn(ctx, 6)), d = tEn(ctx, 6) - tEn(ctx, 2);
          return `${A} = Δ${V}/Δ${T} = (${c3(b)} − ${c3(a)}) m s⁻¹ / ${c3(d)} s = <b>${c3((b - a) / d)} m s⁻²</b>`; } },
      { sit: 'frena', tipo: 'opcion', texto: `El carrito <b>frena</b> mientras va hacia la derecha. ¿Qué signos tienen ${V} y ${A}?`,
        opciones: [
          [`${V} positiva y ${A} negativa`, true],
          [`${V} negativa y ${A} negativa`, false, `El carrito va hacia la derecha, así que ${V} &gt; 0. Mira la ${V}–${T}: ¿está por encima o por debajo del eje?`],
          [`Las dos positivas`, false, `Si ${A} tuviera el mismo signo que ${V}, la rapidez aumentaría. Mira la pendiente de la ${V}–${T}.`]
        ],
        explicacion: `Frenar significa que ${V} y ${A} tienen signos <b>opuestos</b>: la rapidez disminuye.`,
        verifica: (ctx) => ctx.mov.v(3) > 0 && ctx.mov.a(3) < 0 && Math.abs(ctx.mov.v(6)) < Math.abs(ctx.mov.v(3)) },
      { sit: 'izqAce', tipo: 'opcion', texto: `Aquí ${A} es negativa. ¿Está frenando el carrito?`,
        opciones: [
          [`No: ${V} y ${A} son negativas, así que la rapidez aumenta`, true],
          [`Sí: una aceleración negativa siempre frena`, false, `Mira la rapidez en el panel: ¿aumenta o disminuye? El signo de ${A} indica un sentido, no si frena.`],
          ['No se puede saber sin conocer la posición', false, `La posición no influye. Compara los signos de ${V} y ${A}.`]
        ],
        explicacion: `Mismo signo ⇒ la rapidez aumenta; signos opuestos ⇒ disminuye. «Aceleración negativa» no es lo mismo que «frenar».`,
        verifica: (ctx) => ctx.mov.v(3) < 0 && ctx.mov.a(3) < 0 && Math.abs(ctx.mov.v(6)) > Math.abs(ctx.mov.v(3)) },
      { sit: 'vuelve', tipo: 'opcion', texto: `Pausa en el punto más alejado, justo cuando el carrito da la vuelta. ¿Qué pasa con ${V} y ${A} en ese instante?`,
        opciones: [
          [`${V} = 0, pero ${A} no es cero`, true],
          [`${V} = 0 y ${A} = 0`, false, `Si ${A} fuera 0 justo ahí, el carrito se quedaría quieto. Mira la gráfica ${A}–${T} en ese instante.`],
          [`${A} = 0, pero ${V} no es cero`, false, `En el punto de retorno el carrito deja de avanzar un instante: mira dónde corta la ${V}–${T} al eje.`]
        ],
        explicacion: (ctx) => `En el punto de retorno ${V} = 0 solo un instante, pero ${A} sigue valiendo ${c3(ctx.mov.a(0))} m s⁻²: por eso vuelve.`,
        verifica: (ctx) => { const tr = -ctx.mov.v(0) / ctx.mov.a(0); return cerca(ctx.mov.v(tr), 0, 1e-9) && ctx.mov.a(tr) !== 0; } },
      { sit: 'vuelve', tipo: 'valor', oculta: ['valDist', 'valDes'],
        texto: `<b>Calcula</b> la distancia recorrida en todo el movimiento (10 s), usando áreas bajo la ${V}–${T}.`,
        unidad: 'm', respuesta: (ctx) => ctx.mov.distancia(fin(ctx)),
        pista: `La distancia es la suma de las áreas <b>sin signo</b>: el triángulo por encima del eje más el de debajo.`,
        pistaExtra: (x, ctx) => Math.abs(x - ctx.mov.desplazamiento(fin(ctx))) < 0.05 ? `Ese es el <b>desplazamiento</b> (áreas con signo). La distancia suma las dos áreas como positivas.` : null,
        resolucion: (ctx) => { const tr = ctx.mov.v(0) / -ctx.mov.a(0), T1 = fin(ctx);
          const a1 = 0.5 * tr * ctx.mov.v(0), a2 = 0.5 * (T1 - tr) * Math.abs(ctx.mov.v(T1));
          return `Corta el eje en ${T} = ${c3(tr)} s. Área de arriba = ½(${c3(tr)})(${c3(ctx.mov.v(0))}) = ${c3(a1)} m; área de abajo = ½(${c3(T1 - tr)})(${c3(Math.abs(ctx.mov.v(T1)))}) = ${c3(a2)} m.<br>Distancia = ${c3(a1)} + ${c3(a2)} = <b>${c3(ctx.mov.distancia(T1))} m</b> (el desplazamiento es ${c3(ctx.mov.desplazamiento(T1))} m).`; } },
      { sit: 'vuelve', tipo: 'valor', oculta: ['valDist', 'valDes'],
        texto: `<b>Calcula</b> la <i>rapidez media</i> en los 10 s.`,
        unidad: 'm s⁻¹', respuesta: (ctx) => ctx.mov.distancia(fin(ctx)) / fin(ctx),
        pista: 'Rapidez media = distancia recorrida / tiempo empleado.',
        pistaExtra: (x) => Math.abs(x) < 1e-6 ? `0 es la <b>velocidad media</b> (desplazamiento/tiempo): vuelve al punto de partida. La rapidez media usa la distancia.` : null,
        resolucion: (ctx) => `Rapidez media = ${c3(ctx.mov.distancia(fin(ctx)))} m / ${c3(fin(ctx))} s = <b>${c3(ctx.mov.distancia(fin(ctx)) / fin(ctx))} m s⁻¹</b>. La velocidad media es ${c3(ctx.mov.desplazamiento(fin(ctx)) / fin(ctx))} m s⁻¹, porque el desplazamiento es nulo.` }
    ],
    3: [
      { sit: 'arranca', tipo: 'opcion', texto: `Entre ${T} = 4 s y ${T} = 6 s la aceleración es cero. ¿Cómo es la ${S}–${T} en ese tramo?`,
        opciones: [
          ['Una recta inclinada', true],
          ['Una recta horizontal', false, `Horizontal en la ${S}–${T} significa reposo. Aquí ${A} = 0 pero ${V} no es 0: el carrito sigue avanzando.`],
          ['Una curva', false, `Con ${A} = 0, ${V} es constante y la pendiente de la ${S}–${T} no cambia.`]
        ],
        explicacion: `${A} = 0 ⇒ ${V} constante ⇒ ${S}–${T} recta inclinada. No confundas «${A} = 0» con «quieto».`,
        verifica: (ctx) => cerca(ctx.mov.v(4.5), ctx.mov.v(5.5)) && ctx.mov.v(5) > 0 },
      { sit: 'arranca', tipo: 'opcion', texto: `En ${T} = 4 s la aceleración pasa de golpe de 1 a 0 m s⁻². ¿Qué le pasa a ${V} en ese instante?`,
        opciones: [
          [`Nada brusco: ${V} es continua y deja de aumentar`, true],
          [`${V} salta a cero`, false, `Para que ${V} cambiara de golpe haría falta una aceleración infinita. Mira la ${V}–${T} en ${T} = 4 s.`],
          [`${V} empieza a disminuir`, false, `Con ${A} = 0, ${V} no cambia. Disminuye recién desde ${T} = 6 s, cuando ${A} &lt; 0.`]
        ],
        explicacion: `La ${A}–${T} puede saltar; la ${V}–${T} y la ${S}–${T} no. La ${V}–${T} solo cambia de pendiente.`,
        verifica: (ctx) => cerca(ctx.mov.v(4 - 1e-7), ctx.mov.v(4 + 1e-7), 1e-5) && cerca(ctx.mov.v(4.5), ctx.mov.v(4), 1e-9) },
      { sit: 'arranca', tipo: 'valor', oculta: ['valDes', 'valDist', 'valS'],
        texto: `<b>Determina</b> el desplazamiento total con el área bajo la ${V}–${T} (divídela en figuras sencillas).`,
        unidad: 'm', respuesta: (ctx) => ctx.mov.desplazamiento(fin(ctx)),
        pista: 'Tres figuras: un triángulo (0–4 s), un rectángulo (4–6 s) y otro triángulo (6–10 s).',
        resolucion: (ctx) => { const vm = ctx.mov.v(4);
          return `Área = ½(4)(${c3(vm)}) + (2)(${c3(vm)}) + ½(4)(${c3(vm)}) = ${c3(2 * vm)} + ${c3(2 * vm)} + ${c3(2 * vm)} = <b>${c3(ctx.mov.desplazamiento(fin(ctx)))} m</b>`; } },
      { sit: 'espera', tipo: 'opcion', texto: `¿Cómo se ve en la ${V}–${T} el tramo en que el carrito espera (de 4 s a 6 s)?`,
        opciones: [
          [`Un segmento sobre el eje ${T}`, true],
          ['Un segmento horizontal por encima del eje', false, `Eso indicaría ${V} constante distinta de cero: el carrito se movería. Esperar es ${V} = 0.`],
          ['Un hueco: la gráfica se interrumpe', false, `Las gráficas no se interrumpen: en cada instante el carrito tiene una velocidad, aunque sea 0.`]
        ],
        explicacion: `Esperar ⇒ ${V} = 0 ⇒ la ${V}–${T} va sobre el eje y la ${S}–${T} es horizontal.`,
        verifica: (ctx) => ctx.mov.v(5) === 0 && ctx.mov.v(4.5) === 0 },
      { sit: 'espera', tipo: 'valor', oculta: ['valDist', 'valDes'],
        texto: `<b>Calcula</b> la distancia total recorrida por el carrito.`,
        unidad: 'm', respuesta: (ctx) => ctx.mov.distancia(fin(ctx)),
        pista: `Suma las áreas bajo la ${V}–${T} de cada tramo, todas como positivas.`,
        pistaExtra: (x, ctx) => Math.abs(x - ctx.mov.desplazamiento(fin(ctx))) < 0.05 ? `Ese es el desplazamiento: el carrito vuelve a donde empezó. La distancia cuenta también el camino de vuelta.` : null,
        resolucion: (ctx) => `Ida: (3)(2) + ½(1)(2) = 7 m. Vuelta: ½(1)(2) + (3)(2) = 7 m.<br>Distancia = 7 + 7 = <b>${c3(ctx.mov.distancia(fin(ctx)))} m</b>; desplazamiento = ${c3(ctx.mov.desplazamiento(fin(ctx)))} m.` },
      { sit: 'regresa', tipo: 'valor',
        texto: `¿En qué instante cambia de sentido el carrito?`,
        unidad: 's', respuesta: (ctx) => -ctx.mov.v(0) / ctx.mov.a(0),
        pista: `Cambia de sentido cuando ${V} pasa por cero: busca dónde corta la ${V}–${T} al eje, o usa ${V} = ${U} + ${A}${T} con ${V} = 0.`,
        resolucion: (ctx) => `0 = ${U} + ${A}${T} ⇒ ${T} = −${U}/${A} = −(${c3(ctx.mov.v(0))})/(${c3(ctx.mov.a(0))}) = <b>${c3(-ctx.mov.v(0) / ctx.mov.a(0))} s</b>` },
      { sit: 'dosAce', tipo: 'valor', oculta: OCULTA_V,
        texto: `<b>Determina</b> la velocidad en ${T} = 8 s con el área bajo la gráfica ${A}–${T}.`,
        unidad: 'm s⁻¹', respuesta: (ctx) => ctx.mov.v(8),
        pista: `El área bajo la ${A}–${T} es Δ${V}. Aquí son dos rectángulos (0–4 s y 4–8 s), y ${U} = 0.`,
        resolucion: (ctx) => `Δ${V} = (0,5)(4) + (1)(4) = 2 + 4 = 6 m s⁻¹; como ${U} = 0, ${V} = <b>${c3(ctx.mov.v(8))} m s⁻¹</b>.` }
    ]
  };

  const api = { SIT, CASOS3, NIVELES, contexto, movimientoPar };
  if (typeof module !== 'undefined' && module.exports) module.exports = api; else raiz.PreguntasA1 = api;
})(typeof window !== 'undefined' ? window : globalThis);
