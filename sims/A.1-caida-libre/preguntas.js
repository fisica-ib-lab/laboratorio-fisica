/* A.1 · Ecuaciones del movimiento y caída libre — preguntas guiadas de Explorar (sin pantalla).
   Las respuestas salen del mismo modelo que dibuja la simulación (comun/proyectil.js con θ = 90° o u = 0);
   arriba +, s se mide desde el punto de salida. Las de opción traen «verifica(ctx)». */
(function (raiz) {
  'use strict';
  const nodo = typeof module !== 'undefined' && module.exports;
  const { Proyectil, G } = nodo ? require('../../comun/proyectil.js') : raiz.ProyectilFisica;
  const Guia = nodo ? require('../../comun/guia.js') : raiz.Guia;
  const c3 = Guia.c3;
  const V = '<i>v</i>', U = '<i>u</i>', A = '<i>a</i>', S = '<i>s</i>', T = '<i>t</i>', g = '<i>g</i>', H = '<i>h</i>';
  const cerca = (x, y, e) => Math.abs(x - y) <= (e || 1e-9);
  const T_PAUSA = 0.9;   // instante del nivel 3

  const SIT = {
    suelta: { nombre: 'Caída desde el reposo', nivel: 1, par: { u: 0, h: 1.5, puerta: 0.75 } },
    espuma: { nombre: 'Acero y espuma, con aire', nivel: 1, par: { u: 0, h: 1.5, puerta: 0.75 }, ligera: true },
    sube:   { nombre: 'Lanzamiento hacia arriba', nivel: 2, par: { u: 4, h: 0, puerta: 0.5 } },
    ecu:    { nombre: 'Desde el lanzador elevado', nivel: 3, par: { u: 4, h: 0.5, puerta: 0.5 } }
  };
  const K_ESPUMA = 3;   // el mismo valor que sim.js
  function contextoDe(par, nivel, ligera) {
    const p = nivel === 1 ? new Proyectil(par.h, 0, 0) : new Proyectil(par.h, par.u, 90);
    return { par: Object.assign({}, par), p, cruces: p.crucesAltura(par.puerta), nivel,
      pL: nivel === 1 && ligera ? new Proyectil(par.h, 0, 0, { k: K_ESPUMA }) : null };
  }
  const contexto = (id) => contextoDe(SIT[id].par, SIT[id].nivel, SIT[id].ligera);
  const s = (c, t) => c.p.y(t) - c.p.h;
  const vF = (c) => c.p.vy(c.p.duracion);

  const NIVELES = {
    1: [
      { sit: 'suelta', tipo: 'opcion', texto: 'Suelta la bola con «Huellas» (cada 0,1 s) y mira las distancias entre huellas. ¿Cómo cambian?',
        opciones: [
          ['Crecen como 1 : 3 : 5 : 7…', true],
          ['Son todas iguales', false, `Eso pasaría con velocidad constante. Lee las distancias que marca el dibujo junto a las huellas.`],
          ['Se duplican cada vez: 1 : 2 : 4 : 8…', false, `Calcula los cocientes con las distancias que marca el dibujo: aumentan siempre en la misma cantidad, no se duplican.`]
        ],
        explicacion: `Desde el reposo, ${S} = ½${g}${T}²: en 0,1, 0,2, 0,3 s ha caído 1, 4, 9 veces lo mismo, así que en cada décima recorre 1, 3, 5… veces lo mismo.`,
        verifica: (c) => { const d = (i) => s(c, 0.1 * i) - s(c, 0.1 * (i + 1)); const b = d(0); return cerca(d(1) / b, 3, 1e-9) && cerca(d(2) / b, 5, 1e-9) && cerca(d(3) / b, 7, 1e-9); } },
      { sit: 'suelta', tipo: 'valor', oculta: ['resT', 'valT'],
        texto: `<b>Calcula</b> el tiempo que tarda la bola en llegar a la mesa (usa ${g} = 9,81 m s⁻²).`,
        unidad: 's', respuesta: (c) => c.p.duracion,
        pista: `Se suelta ⇒ ${U} = 0. Usa ${S} = ${U}${T} + ½${A}${T}² con ${S} = −${H} y ${A} = −9,81 m s⁻².`,
        resolucion: (c) => `−${c3(c.par.h)} = 0 + ½(−9,81)${T}² ⇒ ${T} = √(2 × ${c3(c.par.h)} / 9,81) = <b>${c3(c.p.duracion)} s</b>` },
      { sit: 'suelta', tipo: 'valor', oculta: ['resV', 'valV'],
        texto: `<b>Calcula</b> la velocidad de la bola al llegar a la mesa, con su signo.`,
        unidad: 'm s⁻¹', respuesta: vF,
        pista: `${V}² = ${U}² + 2${A}${S}, con ${U} = 0, ${A} = −9,81 m s⁻² y ${S} = −${H}. Elige el signo según el sentido del movimiento.`,
        pistaSigno: `El valor es correcto, pero la bola va hacia <b>abajo</b>: con arriba +, ${V} es negativa.`,
        resolucion: (c) => `${V}² = 0 + 2(−9,81)(−${c3(c.par.h)}) = ${c3(vF(c) * vF(c))} ⇒ ${V} = <b>${c3(vF(c))} m s⁻¹</b> (negativa: baja).` },
      { sit: 'suelta', tipo: 'opcion', texto: 'La puerta fotoeléctrica está a mitad de altura. ¿El tiempo que marca es la mitad del tiempo de caída?',
        opciones: [
          ['No: es más de la mitad', true],
          ['Sí: mitad de altura, mitad de tiempo', false, `Eso valdría con velocidad constante. Compara el tiempo de la interfaz con el tiempo hasta la mesa.`],
          ['No: es menos de la mitad', false, `Al principio la bola va lenta: tarda más en recorrer la primera mitad que la segunda.`]
        ],
        explicacion: `${S} ∝ ${T}²: para caer la mitad hace falta ${T} = (tiempo total)/√2 ≈ 0,71 del total. La primera mitad, más lenta, lleva más tiempo.`,
        verifica: (c) => c.cruces.length === 1 && c.cruces[0] > 0.5 * c.p.duracion && cerca(c.cruces[0] / c.p.duracion, Math.SQRT1_2, 1e-9) },
      { sit: 'suelta', tipo: 'valor',
        texto: `Suelta la bola y lee en la interfaz el tiempo que tarda en llegar a la puerta. Con la distancia caída hasta la puerta, <b>determina</b> ${g}.`,
        unidad: 'm s⁻²', respuesta: (c) => 2 * (c.par.h - c.par.puerta) / (c.cruces[0] * c.cruces[0]),
        pista: `Distancia caída = altura de salida − altura de la puerta. Desde el reposo, ${S} = ½${g}${T}² ⇒ ${g} = 2${S}/${T}².`,
        resolucion: (c) => { const d = c.par.h - c.par.puerta, t = c.cruces[0];
          return `Cae ${c3(d)} m en ${c3(t)} s ⇒ ${g} = 2${S}/${T}² = 2(${c3(d)})/(${c3(t)})² = <b>${c3(2 * d / (t * t))} m s⁻²</b>`; } },
      { sit: 'suelta', tipo: 'opcion', texto: 'Sube la altura de salida y vuelve a soltar la bola. ¿Cambia su aceleración?',
        opciones: [
          ['No: sigue siendo 9,81 m s⁻² hacia abajo', true],
          ['Sí: aumenta, porque llega más rápido', false, `Llega más rápido porque cae durante más tiempo, no porque acelere más. Mira la pendiente de la ${V}–${T}.`],
          ['Sí: disminuye, porque está más lejos del suelo', false, `En un laboratorio la diferencia de altura es mínima: ${g} es la misma. Mira la gráfica ${A}–${T}.`]
        ],
        explicacion: `Sin aire, todos los cuerpos caen con la misma aceleración ${g}, desde cualquier altura del laboratorio.`,
        verifica: (c) => new Proyectil(c.par.h + 0.5, 0, 0).ay(0.2) === c.p.ay(0.2) && c.p.ay(0.2) === -G },
      { sit: 'espuma', tipo: 'opcion', texto: `Se sueltan a la vez una bola de acero y una de espuma (línea discontinua), con aire. ¿Cómo es la ${V}–${T} de la espuma?`,
        opciones: [
          ['Una curva que se aplana: su velocidad tiende a un valor constante', true],
          ['Una recta, como la del acero pero menos inclinada', false, `Una recta sería aceleración constante. Mira la ${A}–${T} de la espuma: su aceleración va cambiando hasta casi 0.`],
          ['Una recta igual a la del acero, porque g es la misma', false, `Sin aire caerían igual. Con aire, el arrastre crece con la rapidez y frena mucho más a la espuma, que es muy ligera.`]
        ],
        explicacion: `El arrastre del aire crece con la rapidez hasta igualar el peso: entonces la fuerza neta es 0, ${A} = 0 y la espuma cae con <b>velocidad terminal</b> constante. El acero, mucho más pesado, apenas lo nota en esta altura.`,
        verifica: (c) => { const pl = c.pL, T = pl.duracion; return Math.abs(pl.ay(T)) < 0.2 * G && Math.abs(pl.vy(T) - pl.vy(0.8 * T)) < 0.05 * Math.abs(pl.vy(T)) && Math.abs(pl.vy(0.2)) < Math.abs(c.p.vy(0.2)); } }
    ],
    2: [
      { sit: 'sube', tipo: 'opcion', texto: `Pausa en el punto más alto. ¿Cuánto valen ahí ${V} y ${A}?`,
        opciones: [
          [`${V} = 0 y ${A} = −9,81 m s⁻²`, true],
          [`${V} = 0 y ${A} = 0`, false, `Si ${A} fuera 0 justo ahí, la bola se quedaría flotando. Activa «Aceleración»: la flecha no cambia.`],
          [`${V} = −9,81 m s⁻¹ y ${A} = 0`, false, `Fíjate en la ${V}–${T}: en la cumbre corta el eje (${V} = 0). La que no cambia es ${A}.`]
        ],
        explicacion: `En la cumbre ${V} = 0 solo un instante; ${A} = −${g} en todo el vuelo, también ahí.`,
        verifica: (c) => cerca(c.p.vy(c.p.tCumbre), 0, 1e-12) && c.p.ay(c.p.tCumbre) === -G },
      { sit: 'sube', tipo: 'valor', oculta: ['resTs', 'valT'],
        texto: `<b>Calcula</b> el tiempo de subida hasta la cumbre.`,
        unidad: 's', respuesta: (c) => c.p.tCumbre,
        pista: `En la cumbre ${V} = 0: usa ${V} = ${U} + ${A}${T} con ${A} = −9,81 m s⁻².`,
        resolucion: (c) => `0 = ${c3(c.par.u)} + (−9,81)${T} ⇒ ${T} = ${c3(c.par.u)}/9,81 = <b>${c3(c.p.tCumbre)} s</b>` },
      { sit: 'sube', tipo: 'valor', oculta: ['resH', 'valS', 'valY', 'pildoraS'],
        texto: `<b>Calcula</b> la altura máxima que sube la bola sobre el punto de salida.`,
        unidad: 'm', respuesta: (c) => c.p.alturaMax() - c.p.h,
        pista: `Sin conocer el tiempo: ${V}² = ${U}² + 2${A}${S} con ${V} = 0 en la cumbre.`,
        pistaExtra: (x, c) => cerca(x, c.par.u * c.par.u / G, 0.02 * c.par.u * c.par.u / G) ? 'Revisa el factor 2: 0 = u² + 2as ⇒ s = u²/(2g).' : null,
        resolucion: (c) => `0 = ${c3(c.par.u)}² + 2(−9,81)${S} ⇒ ${S} = ${c3(c.par.u)}²/19,62 = <b>${c3(c.p.alturaMax() - c.p.h)} m</b>` },
      { sit: 'sube', tipo: 'opcion', texto: 'Con el lanzador sobre la mesa, compara el tiempo de subida con el de bajada.',
        opciones: [
          ['Son iguales', true],
          ['Baja más rápido, porque la gravedad la ayuda', false, `${g} actúa igual al subir y al bajar: frena la subida al mismo ritmo con que acelera la bajada.`],
          ['Sube más rápido, porque sale con velocidad', false, `Sale con velocidad pero va frenando; al bajar parte de 0 y gana velocidad al mismo ritmo.`]
        ],
        explicacion: `El movimiento es simétrico: tiempo de vuelo = 2 × tiempo de subida, y llega con la misma rapidez con que salió.`,
        verifica: (c) => cerca(c.p.duracion, 2 * c.p.tCumbre, 1e-12) },
      { sit: 'sube', tipo: 'opcion', texto: 'La bola cruza la puerta fotoeléctrica dos veces. ¿Cómo son sus velocidades en los dos pasos?',
        opciones: [
          ['Misma rapidez, sentidos opuestos', true],
          ['Iguales en todo', false, `La rapidez es la misma, pero al subir ${V} &gt; 0 y al bajar ${V} &lt; 0: no son la misma velocidad.`],
          ['Al bajar es mayor', false, `Entre los dos pasos sube y baja la misma altura: pierde y recupera la misma rapidez.`]
        ],
        explicacion: `${V}² = ${U}² + 2${A}${S} da el mismo ${V}² para la misma ${S}: misma rapidez, con signo + al subir y − al bajar.`,
        verifica: (c) => c.cruces.length === 2 && cerca(c.p.vy(c.cruces[0]), -c.p.vy(c.cruces[1]), 1e-9) && c.p.vy(c.cruces[0]) > 0 },
      { sit: 'sube', tipo: 'valor', oculta: ['resV', 'valV'],
        texto: `¿Con qué velocidad (con signo) vuelve la bola a la mesa?`,
        unidad: 'm s⁻¹', respuesta: vF,
        pista: `Vuelve a la altura de salida: ${S} = 0. Usa ${V}² = ${U}² + 2${A}${S}.`,
        pistaSigno: `Es la misma rapidez de salida, pero ahora la bola baja: ${V} es negativa.`,
        resolucion: (c) => c.par.h === 0 ? `${S} = 0 ⇒ ${V}² = ${U}² ⇒ ${V} = −${U} = <b>${c3(vF(c))} m s⁻¹</b> (misma rapidez, hacia abajo).`
          : `${S} = −${c3(c.par.h)} m ⇒ ${V}² = ${c3(c.par.u)}² + 2(−9,81)(−${c3(c.par.h)}) ⇒ ${V} = <b>${c3(vF(c))} m s⁻¹</b> (hacia abajo).` }
    ],
    3: [
      { sit: 'ecu', tipo: 'opcion', texto: 'Quieres hallar la altura máxima <b>sin conocer el tiempo</b>. ¿Qué ecuación del Cuadernillo usas?',
        opciones: [
          [`${V}² = ${U}² + 2${A}${S}`, true],
          [`${S} = ${U}${T} + ½${A}${T}²`, false, `Esta ecuación contiene ${T}, que no conoces.`],
          [`${V} = ${U} + ${A}${T}`, false, `Esta ni siquiera contiene ${S}, que es lo que buscas.`]
        ],
        explicacion: (c) => `Es la que no contiene ${T}: con ${V} = 0, ${S} = ${U}²/(2${g}) = ${c3(c.par.u * c.par.u / (2 * G))} m.`,
        verifica: (c) => cerca(c.par.u * c.par.u / (2 * G), c.p.alturaMax() - c.p.h, 1e-9) },
      { sit: 'ecu', tipo: 'valor', oculta: ['resT', 'valT'],
        texto: (c) => `<b>Determina</b> el tiempo hasta que la bola llega a la mesa (${c3(c.par.h)} m por debajo del lanzador).`,
        unidad: 's', respuesta: (c) => c.p.duracion,
        pista: (c) => `${S} = ${U}${T} + ½${A}${T}² con ${S} = −${c3(c.par.h)} m: ecuación de 2.º grado. Elige la raíz positiva.`,
        pistaExtra: (x, c) => cerca(x, 2 * c.par.u / G, 0.02 * 2 * c.par.u / G) ? `Ese es el tiempo hasta volver a la altura de salida. La mesa está ${c3(c.par.h)} m más abajo: ${S} = −${c3(c.par.h)} m.` : null,
        resolucion: (c) => `−${c3(c.par.h)} = ${c3(c.par.u)}${T} − 4,905${T}² ⇒ 4,905${T}² − ${c3(c.par.u)}${T} − ${c3(c.par.h)} = 0 ⇒ ${T} = <b>${c3(c.p.duracion)} s</b> (la otra raíz es negativa).` },
      { sit: 'ecu', tipo: 'valor', oculta: ['valS', 'valY', 'pildoraS', 'cajaEcuaciones'],
        texto: `<b>Calcula</b> el desplazamiento ${S} de la bola en ${T} = 0,90 s, con su signo. Después pausa en ese instante y compruébalo en la tabla.`,
        unidad: 'm', respuesta: (c) => s(c, Math.min(T_PAUSA, c.p.duracion)),
        pista: `${S} = ${U}${T} + ½${A}${T}², con ${A} = −9,81 m s⁻². El signo te dirá si está por encima o por debajo del punto de salida.`,
        pistaSigno: `El valor es correcto, pero en ese instante la bola está <b>por debajo</b> del punto de salida: ${S} es negativo.`,
        resolucion: (c) => { const t = Math.min(T_PAUSA, c.p.duracion), x = s(c, t);
          return `${S} = (${c3(c.par.u)})(${c3(t)}) + ½(−9,81)(${c3(t)})² = ${c3(c.par.u * t)} − ${c3(4.905 * t * t)} = <b>${c3(x)} m</b> (${x < 0 ? 'por debajo' : 'por encima'} de la salida).`; } },
      { sit: 'ecu', tipo: 'opcion', texto: `En ${T} = 0,90 s, ¿qué signos tienen ${S}, ${V} y ${A}?`,
        opciones: [
          [`Los tres negativos`, true],
          [`${S} positivo; ${V} y ${A} negativos`, false, `${S} se mide desde el punto de salida, no desde la mesa. En ese instante la bola ya está por debajo del lanzador.`],
          [`${S} y ${V} negativos; ${A} positiva`, false, `${A} = −${g} siempre (arriba +), suba o baje la bola.`]
        ],
        explicacion: `Está por debajo de la salida (${S} &lt; 0), bajando (${V} &lt; 0), y ${A} = −9,81 m s⁻² todo el tiempo.`,
        verifica: (c) => s(c, T_PAUSA) < 0 && c.p.vy(T_PAUSA) < 0 && c.p.ay(T_PAUSA) < 0 && T_PAUSA < c.p.duracion },
      { sit: 'ecu', tipo: 'valor', oculta: ['resV', 'valV', 'cajaEcuaciones'],
        texto: `<b>Calcula</b> la velocidad con que la bola llega a la mesa, con su signo.`,
        unidad: 'm s⁻¹', respuesta: vF,
        pista: (c) => `${V}² = ${U}² + 2${A}${S} con ${S} = −${c3(c.par.h)} m (la mesa está por debajo de la salida).`,
        pistaSigno: `El valor es correcto, pero al llegar la bola baja: ${V} es negativa.`,
        pistaExtra: (x, c) => cerca(Math.abs(x), c.par.u, 0.02 * c.par.u) ? `Esa sería la rapidez si volviera a la altura de salida. Aquí cae ${c3(c.par.h)} m más.` : null,
        resolucion: (c) => `${V}² = ${c3(c.par.u)}² + 2(−9,81)(−${c3(c.par.h)}) = ${c3(vF(c) * vF(c))} ⇒ ${V} = <b>${c3(vF(c))} m s⁻¹</b>` }
    ]
  };

  const api = { SIT, NIVELES, contexto, contextoDe, T_PAUSA };
  if (nodo) module.exports = api; else raiz.PreguntasCaida = api;
})(typeof window !== 'undefined' ? window : globalThis);
