/* Simulación A.2 · Construir: datos de los dos retos. Sin pantalla (también lo cargan las pruebas con node).

   Reto 1 · Diagrama de cuerpo libre. Cada situación usa un montaje de comun/dinamica.js en un instante t; las fuerzas
   correctas (tipo y dirección) se sacan del propio modelo, así que no pueden contradecir la simulación. «espera» repite
   los tipos a mano para que las pruebas detecten cualquier descuido. El carrito que acelera no tiene modelo: sus
   direcciones se dan a mano.
   Ángulos en grados, sentido antihorario desde la derecha (0° derecha, 90° arriba, −90° abajo).

   Reto 2 · Parejas de tercera ley: construir la pareja de una fuerza (quién, sobre quién, tipo, sentido, módulo) o
   preguntas de opción. */

(function (raiz) {
  'use strict';

  // Fuerzas que no existen o no van en el diagrama (están siempre en el banco)
  const DISTRACTORES = {
    movimiento: { texto: 'Fuerza del movimiento', corto: 'F mov.',
      comentario: 'No existe una «fuerza del movimiento». Un cuerpo puede moverse sin que nada lo empuje en ese sentido (primera ley). Cada fuerza la ejerce otro cuerpo: ¿cuál ejercería esta?' },
    inercia: { texto: 'Fuerza de inercia', corto: 'F inercia',
      comentario: 'La inercia no es una fuerza: es la tendencia de un cuerpo a mantener su velocidad. Ningún cuerpo ejerce una «fuerza de inercia».' },
    neta: { texto: 'Fuerza neta', corto: 'F neta',
      comentario: 'La fuerza neta es la suma de las fuerzas del diagrama. No se dibuja como una fuerza más.' },
    sobreMesa: { texto: 'Fuerza del bloque sobre la mesa', corto: 'F bloque→mesa',
      comentario: 'Esa fuerza actúa sobre la mesa, no sobre el bloque. En el diagrama de cuerpo libre solo van las fuerzas que actúan SOBRE el cuerpo.' },
    pesoColgante: { texto: 'Peso de la masa colgante', corto: 'peso colgante',
      comentario: 'El peso de la masa colgante actúa sobre la masa colgante. Al bloque solo le llega a través de la cuerda: es la tensión.' },
    cable: { texto: 'Fuerza del cable del ascensor', corto: 'F cable',
      comentario: 'El cable tira de la cabina, no de la persona. Sobre la persona solo actúan la Tierra y la balanza.' },
    motor: { texto: 'Fuerza del motor del carrito', corto: 'F motor',
      comentario: 'El motor empuja al carrito, no al bloque. El bloque solo toca el carrito: ¿qué fuerzas de contacto le hace?' }
  };
  const SIEMPRE = ['movimiento', 'inercia', 'neta'];

  // Pistas de dirección por tipo de fuerza
  const DIRECCION = {
    Fg: 'El peso siempre apunta verticalmente hacia abajo.',
    FN: 'La normal es perpendicular a la superficie de contacto y empuja hacia fuera de ella.',
    Ff: 'El rozamiento es paralelo a la superficie y se opone al deslizamiento (o a la tendencia a deslizar).',
    FT: 'La tensión tira a lo largo de la cuerda, alejándose del cuerpo.',
    FH: 'La fuerza elástica tira a lo largo del resorte del dinamómetro.',
    Fb: 'El empuje apunta verticalmente hacia arriba.',
    Fd: 'El arrastre viscoso se opone a la velocidad.'
  };
  const NOMBRE = { Fg: 'el peso', FN: 'la fuerza normal', Ff: 'el rozamiento', FT: 'la tensión', FH: 'la fuerza elástica', Fb: 'el empuje', Fd: 'el arrastre viscoso' };
  const CONTACTO = { Fg: false, FN: true, Ff: true, FT: true, FH: true, Fb: true, Fd: true };

  const SITUACIONES = [
    { id: 'reposoMesa', equilibrio: 'en reposo',  nombre: 'Bloque en reposo', escena: 'horizontal', t: 0.5, cuerpo: 0,
      par: { m: 2, F: 0, ang: 0, modo: 'constante', mus: 0.5, mud: 0.3, u: 0 },
      texto: 'Un bloque está en reposo sobre la mesa. Nadie tira de él. Dibuja las fuerzas que actúan sobre el bloque.',
      forma: 'bloque', contexto: 'mesa', espera: ['Fg', 'FN'], extra: ['sobreMesa'],
      sobra: { Ff: 'Nada intenta hacer deslizar el bloque, así que no hay rozamiento.' },
      explica: 'Solo la Tierra (peso) y la mesa (normal) actúan sobre el bloque. Están equilibradas: F_N = F_g.' },
    { id: 'tirado', haciaA: 'hacia la derecha',  nombre: 'Tirado por el dinamómetro', escena: 'horizontal', t: 0.5, cuerpo: 0,
      par: { m: 2, F: 12, ang: 0, modo: 'constante', mus: 0.5, mud: 0.3, u: 0 },
      texto: 'El dinamómetro tira del bloque hacia la derecha y el bloque desliza. Dibuja las fuerzas sobre el bloque.',
      forma: 'bloque', contexto: 'mesa', espera: ['Fg', 'FN', 'Ff', 'FH'], extra: ['sobreMesa'],
      explica: 'Cuatro interacciones: la Tierra, la mesa (normal y rozamiento, en contra del deslizamiento) y el resorte del dinamómetro.' },
    { id: 'soltado', haciaA: 'hacia la izquierda (va frenando)',  nombre: 'Después de soltar', escena: 'horizontal', t: 1.3, cuerpo: 0,
      par: { m: 2, F: 10.5, ang: 0, modo: 'soltar', mus: 0.5, mud: 0.3, u: 0 },
      texto: 'El dinamómetro se soltó hace un momento y el bloque sigue deslizando hacia la derecha, cada vez más despacio. Dibuja las fuerzas sobre el bloque.',
      forma: 'bloque', contexto: 'mesa', espera: ['Fg', 'FN', 'Ff'], extra: ['sobreMesa'],
      sobra: { FH: 'El dinamómetro ya no toca el bloque: una fuerza solo existe mientras dura la interacción. El bloque lleva velocidad, no «lleva» fuerza.' },
      explica: 'Nada empuja al bloque hacia la derecha: se mueve por inercia. El rozamiento, hacia la izquierda, es lo que lo frena.' },
    { id: 'planoQuieto', equilibrio: 'en reposo',  nombre: 'Quieto en el plano', escena: 'plano', t: 0.5, cuerpo: 0,
      par: { m: 1, ang: 20, mus: 0.5, mud: 0.3, u: 0 },
      texto: 'El bloque está en reposo sobre el plano inclinado. Dibuja las fuerzas sobre el bloque.',
      forma: 'bloque', contexto: 'plano', espera: ['Fg', 'FN', 'Ff'], extra: [],
      explica: 'La normal es perpendicular al plano. El rozamiento estático apunta hacia arriba del plano porque el bloque tiende a deslizar hacia abajo.' },
    { id: 'planoSube', haciaA: 'hacia abajo del plano (va frenando)',  nombre: 'Sube por el plano', escena: 'plano', t: 0.1, cuerpo: 0,
      par: { m: 1, ang: 30, mus: 0.5, mud: 0.3, u: 3 },
      texto: 'El bloque se lanzó hacia arriba del plano y ahora sube cada vez más despacio. Dibuja las fuerzas sobre el bloque.',
      forma: 'bloque', contexto: 'plano', espera: ['Fg', 'FN', 'Ff'], extra: [],
      explica: 'Mientras sube, el rozamiento apunta hacia abajo del plano, en contra de la velocidad. No hay ninguna fuerza «hacia arriba del plano».' },
    { id: 'planoBaja', haciaA: 'hacia abajo del plano',  nombre: 'Baja por el plano', escena: 'plano', t: 0.5, cuerpo: 0,
      par: { m: 1, ang: 30, mus: 0.4, mud: 0.3, u: 0 },
      texto: 'El bloque baja deslizando por el plano. Dibuja las fuerzas sobre el bloque.',
      forma: 'bloque', contexto: 'plano', espera: ['Fg', 'FN', 'Ff'], extra: [],
      explica: 'Ahora el bloque se mueve hacia abajo del plano, así que el rozamiento apunta hacia arriba del plano.' },
    { id: 'ascensorBaja', haciaA: 'hacia abajo, con el ascensor',  nombre: 'Ascensor que arranca hacia abajo', escena: 'ascensor', t: 0.5, cuerpo: 0,
      par: { m: 60, modo: 'bajar', a: 2 },
      texto: 'El ascensor arranca hacia abajo. Dibuja las fuerzas sobre la persona que está sobre la balanza.',
      forma: 'persona', contexto: 'piso', flecha: 'abajo', espera: ['Fg', 'FN'], extra: ['cable'],
      explica: 'Solo dos fuerzas: el peso y la normal de la balanza. Como acelera hacia abajo, F_N es menor que F_g (la balanza marca menos).' },
    { id: 'colgante', haciaA: 'hacia abajo',  nombre: 'Masa colgante', escena: 'mesa', t: 0.3, cuerpo: 1,
      par: { m1: 1, m2: 0.5, mus: 0.3, mud: 0.2 },
      texto: 'El bloque de la mesa y la masa colgante se mueven unidos por la cuerda. Dibuja las fuerzas sobre la masa colgante.',
      forma: 'colgante', contexto: 'cuerda', espera: ['Fg', 'FT'], extra: [],
      sobra: { Ff: 'La masa colgante no toca la mesa: el rozamiento actúa sobre el bloque, no sobre ella.', FN: 'La masa colgante no está apoyada en ninguna superficie.' },
      explica: 'Sobre la masa colgante solo actúan la Tierra y la cuerda. Baja acelerando, así que F_T es menor que F_g.' },
    { id: 'bloqueMesa', haciaA: 'hacia la polea',  nombre: 'Bloque unido a la masa colgante', escena: 'mesa', t: 0.3, cuerpo: 0,
      par: { m1: 1, m2: 0.5, mus: 0.3, mud: 0.2 },
      texto: 'Ahora dibuja las fuerzas sobre el bloque de la mesa, mientras el sistema se mueve hacia la polea.',
      forma: 'bloque', contexto: 'mesaCuerda', espera: ['Fg', 'FN', 'Ff', 'FT'], extra: ['pesoColgante', 'sobreMesa'],
      explica: 'La cuerda tira del bloque hacia la polea (tensión). El peso de la masa colgante no actúa sobre el bloque.' },
    { id: 'cuerdas', equilibrio: 'en reposo',  nombre: 'Colgado de dos cuerdas', escena: 'cuerdas', t: 0, cuerpo: 0,
      par: { m: 1, ang1: 30, ang2: 50 },
      texto: 'El cuerpo cuelga en reposo de dos cuerdas que forman 30° y 50° con el techo (las líneas grises marcan sus direcciones). Dibuja las fuerzas sobre el cuerpo.',
      forma: 'bloque', contexto: 'cuerdas', espera: ['Fg', 'FT', 'FT'], extra: [],
      explica: 'Cada cuerda tira a lo largo de sí misma: dos tensiones distintas y el peso. Las tres suman cero.' },
    { id: 'esfera', haciaA: 'hacia abajo (todavía no llega a la velocidad terminal)',  nombre: 'Esfera en glicerina', escena: 'esfera', t: 0.005, cuerpo: 0,
      par: { material: 'acero', r: 2.5, liquido: 'glicerina' },
      texto: 'La esfera de acero acaba de soltarse en la glicerina y todavía está acelerando hacia abajo. Dibuja las fuerzas sobre la esfera.',
      forma: 'esfera', contexto: 'liquido', espera: ['Fg', 'Fb', 'Fd'], extra: [],
      explica: 'El líquido ejerce dos fuerzas: el empuje (aunque la esfera no se moviera) y el arrastre viscoso, en contra de la velocidad.' },
    { id: 'carrito', haciaA: 'hacia la derecha, con el carrito', neta: 0,  nombre: 'Bloque sobre un carrito que acelera', modelo: false,
      fuerzas: [{ tipo: 'Fg', ang: -90 }, { tipo: 'FN', ang: 90 }, { tipo: 'Ff', ang: 0 }],
      texto: 'Un carrito acelera hacia la derecha y el bloque que lleva encima se mueve con él, sin deslizar. Dibuja las fuerzas sobre el bloque.',
      forma: 'bloque', contexto: 'carrito', espera: ['Fg', 'FN', 'Ff'], extra: ['motor'],
      sobra: {},
      faltaFf: 'Falta el rozamiento: sin él, ¿qué haría acelerar al bloque hacia la derecha?',
      explica: 'El rozamiento estático es la única fuerza horizontal sobre el bloque: apunta hacia la derecha, en el sentido de la aceleración. El rozamiento no siempre se opone al movimiento; se opone al deslizamiento entre las superficies.' }
  ];

  /* Reto 2 · Parejas de tercera ley */
  const TIPOS = [['gravitatoria', 'gravitatoria (peso)'], ['normal', 'normal (contacto)'], ['rozamiento', 'rozamiento'], ['tension', 'tensión'], ['empuje', 'empuje'], ['arrastre', 'arrastre viscoso']];
  const SENTIDOS = [['arriba', 'hacia arriba'], ['abajo', 'hacia abajo'], ['izquierda', 'hacia la izquierda'], ['derecha', 'hacia la derecha']];
  const OPUESTO = { arriba: 'abajo', abajo: 'arriba', izquierda: 'derecha', derecha: 'izquierda' };
  const MODULOS = [['igual', 'igual'], ['mayor', 'mayor'], ['menor', 'menor']];

  const PAREJAS = [
    { tipo: 'pareja', fuerza: 'El peso del bloque: la fuerza gravitatoria que ejerce <b>la Tierra</b> sobre <b>el bloque</b>, hacia abajo.',
      por: 'la Tierra', sobre: 'el bloque', clase: 'gravitatoria', sentido: 'abajo',
      cuerpos: ['la Tierra', 'el bloque', 'la mesa'],
      explica: 'El bloque atrae a la Tierra hacia arriba con una fuerza del mismo módulo. No se nota porque la masa de la Tierra es enorme y su aceleración, mínima.' },
    { tipo: 'pareja', fuerza: 'La fuerza normal que ejerce <b>la mesa</b> sobre <b>el bloque</b>, hacia arriba.',
      por: 'la mesa', sobre: 'el bloque', clase: 'normal', sentido: 'arriba',
      cuerpos: ['la Tierra', 'el bloque', 'la mesa'],
      explica: 'El bloque empuja a la mesa hacia abajo con una fuerza normal del mismo módulo. Esa fuerza actúa sobre la mesa, por eso no aparece en el diagrama del bloque.' },
    { tipo: 'opcion', texto: '¿Son pareja de tercera ley el peso del bloque y la normal que la mesa ejerce sobre el bloque?',
      opciones: [
        ['No: actúan sobre el mismo cuerpo y son de distinto tipo.', true],
        ['Sí: son iguales y opuestas.', false, 'Ser iguales y opuestas no basta. Las parejas de tercera ley actúan sobre cuerpos distintos y son del mismo tipo. ¿Sobre qué cuerpo actúa cada una?'],
        ['Sí, pero solo cuando el bloque está en reposo.', false, 'Las parejas de tercera ley lo son siempre. Piensa en el ascensor que acelera: ¿son iguales el peso y la normal?']
      ],
      explica: 'Las dos actúan sobre el bloque. Si son iguales es por la primera ley (el bloque no acelera), no por la tercera: en un ascensor que acelera son distintas.' },
    { tipo: 'pareja', fuerza: 'El rozamiento que ejerce <b>la mesa</b> sobre <b>el bloque</b>, que desliza hacia la derecha: hacia la izquierda.',
      por: 'la mesa', sobre: 'el bloque', clase: 'rozamiento', sentido: 'izquierda',
      cuerpos: ['la Tierra', 'el bloque', 'la mesa'],
      explica: 'El bloque arrastra a la mesa hacia la derecha con un rozamiento del mismo módulo (por eso se gasta la superficie).' },
    { tipo: 'pareja', fuerza: 'La tensión que ejerce <b>la cuerda</b> sobre <b>la masa colgante</b>, hacia arriba.',
      por: 'la cuerda', sobre: 'la masa colgante', clase: 'tension', sentido: 'arriba',
      cuerpos: ['la Tierra', 'la cuerda', 'la masa colgante', 'el bloque'],
      explica: 'La masa colgante tira de la cuerda hacia abajo con la misma fuerza. Aunque la masa acelere, la pareja sigue siendo igual y opuesta.' },
    { tipo: 'pareja', fuerza: 'El empuje que ejerce <b>el líquido</b> sobre <b>la esfera</b>, hacia arriba.',
      por: 'el líquido', sobre: 'la esfera', clase: 'empuje', sentido: 'arriba',
      cuerpos: ['la Tierra', 'el líquido', 'la esfera'],
      explica: 'La esfera empuja al líquido hacia abajo con la misma fuerza (por eso una balanza bajo el vaso marca más al sumergir un objeto colgado).' },
    { tipo: 'opcion', texto: 'Un camión choca de frente contra un auto pequeño. Durante el choque, ¿qué fuerza es mayor?',
      opciones: [
        ['Las dos son iguales: son pareja de tercera ley.', true],
        ['La del camión sobre el auto, porque el camión tiene más masa.', false, 'Lo que depende de la masa es la aceleración (segunda ley), no la fuerza. ¿Qué dice la tercera ley de las dos fuerzas de una interacción?'],
        ['La del auto sobre el camión, porque el auto se deforma más.', false, 'La deformación depende de cada vehículo, no de qué fuerza es mayor. Las dos fuerzas de una interacción tienen siempre el mismo módulo.']
      ],
      explica: 'Las fuerzas son iguales y opuestas. El auto sufre más porque, con menos masa, su aceleración (F/m) es mucho mayor.' },
    { tipo: 'opcion', texto: 'En el ascensor que arranca hacia arriba, la balanza empuja a la persona con 709 N y su peso es 589 N. ¿Con qué fuerza empuja la persona a la balanza?',
      opciones: [
        ['709 N, hacia abajo.', true],
        ['589 N, hacia abajo: su peso.', false, 'La persona empuja a la balanza con una fuerza normal, que es la pareja de la normal que recibe. El peso es otra interacción (con la Tierra).'],
        ['120 N, la diferencia.', false, 'Esa diferencia es la fuerza neta sobre la persona (ma). ¿Cuál es la pareja de la normal de la balanza sobre la persona?']
      ],
      explica: 'La normal de la balanza sobre la persona y la de la persona sobre la balanza son pareja: iguales (709 N) y opuestas. Por eso la balanza marca 709 N.' },
    { tipo: 'opcion', texto: 'En la máquina de Atwood que acelera, ¿son pareja de tercera ley la tensión sobre m₂ y el peso de m₂?',
      opciones: [
        ['No: actúan sobre el mismo cuerpo, son de distinto tipo y ni siquiera son iguales.', true],
        ['Sí, porque tienen la misma dirección y sentidos opuestos.', false, '¿Sobre qué cuerpo actúa cada una? Las parejas actúan sobre cuerpos distintos.'],
        ['Sí, cuando las masas son iguales.', false, 'Con masas iguales serían iguales en módulo, pero siguen actuando sobre el mismo cuerpo y siendo de distinto tipo.']
      ],
      explica: 'La pareja de la tensión sobre m₂ es la fuerza de m₂ sobre la cuerda; la pareja del peso de m₂ es la atracción de m₂ sobre la Tierra.' }
  ];

  const api = { DISTRACTORES, SIEMPRE, DIRECCION, NOMBRE, CONTACTO, SITUACIONES, PAREJAS, TIPOS, SENTIDOS, OPUESTO, MODULOS };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else raiz.ConstruirDatos = api;
})(this);
