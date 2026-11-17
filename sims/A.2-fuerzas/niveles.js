/* Simulación A.2 · Explorar por niveles: situaciones preparadas y preguntas guiadas.
   Sin pantalla (también lo cargan las pruebas con node).

   Cada pregunta usa una situación (montaje + valores). Tipos:
     · «opcion»: opciones [texto, ¿correcta?, comentario si se elige]; «explicacion» se muestra al acertar.
     · «valor»: respuesta(par) calcula el valor con los parámetros que haya en ese momento (si el alumno mueve los
       deslizadores, la respuesta correcta cambia con ellos); tolerancia ±2 %; «pista» tras un error y
       «resolucion(par)» paso a paso tras dos errores.
   «ajustes: true» abre el cuadro de ajustes porque la pregunta pide mover un deslizador.
   «oculta»: datos que no se muestran mientras la pregunta está activa porque darían la respuesta
   (un deslizador por su id, o «anguloLimite» en las lecturas y las barras). */

(function (raiz) {
  'use strict';
  const G = 9.81, RAD = Math.PI / 180;
  const v = (x) => `<span class="var">${x}</span>`;
  const F = (s) => `${v('F')}<sub>${s}</sub>`;
  const mus = `${v('μ')}<sub>s</sub>`, mud = `${v('μ')}<sub>d</sub>`;
  const n = (x, d) => { const r = Math.abs(x) < 0.5 * Math.pow(10, -d) ? 0 : x; return (r < 0 ? '−' : '') + Math.abs(r).toFixed(d).replace('.', ','); };
  const n3 = (x) => { const a = Math.abs(x); return n(x, a >= 100 ? 0 : a >= 10 ? 1 : a >= 1 ? 2 : 3); };

  /* ---------- Situaciones ---------- */
  const SIT = {
    riel: { nombre: 'Riel sin rozamiento', escena: 'horizontal', par: { m: 1, F: 0, ang: 0, modo: 'constante', mus: 0, mud: 0, u: 0.5 } },
    velConst: { nombre: 'Velocidad constante con rozamiento', escena: 'horizontal', par: { m: 2, F: 0.3 * 2 * G, ang: 0, modo: 'constante', mus: 0.5, mud: 0.3, u: 1 }, ver: { valores: true } },
    ascSube: { nombre: 'Ascensor que sube', escena: 'ascensor', par: { m: 60, modo: 'subir', aV: 2, aC: 2 } },
    cuerdas: { nombre: 'Cuerpo colgado de dos cuerdas', escena: 'cuerdas', par: { m: 1, ang1: 30, ang2: 50 } },
    terminal: { nombre: 'Esfera en glicerina', escena: 'esfera', par: { material: 'acero', r: 2.5, liquido: 'glicerina' } },

    pequena: { nombre: 'Fuerza pequeña', escena: 'horizontal', par: { m: 2, F: 3, ang: 0, modo: 'constante', mus: 0.5, mud: 0.3, u: 0 }, ver: { valores: true } },
    rampa: { nombre: 'Fuerza que crece poco a poco', escena: 'horizontal', par: { m: 2, F: 15, ang: 0, modo: 'rampa', mus: 0.5, mud: 0.3, u: 0 } },
    soltar: { nombre: 'Tirar y soltar', escena: 'horizontal', par: { m: 2, F: 10.5, ang: 0, modo: 'soltar', mus: 0.5, mud: 0.3, u: 0 } },

    planoQuieto: { nombre: 'Bloque quieto en el plano', escena: 'plano', par: { m: 1, ang: 20, mus: 0.5, mud: 0.3, u: 0 }, ver: { componentes: true } },
    planoLimite: { nombre: 'Busca el ángulo límite', escena: 'plano', par: { m: 1, ang: 15, mus: 0.5, mud: 0.3, u: 0 } },
    planoSube: { nombre: 'Bloque lanzado hacia arriba', escena: 'plano', par: { m: 1, ang: 30, mus: 0.5, mud: 0.3, u: 3 } },
    oblicua: { nombre: 'Fuerza con ángulo', escena: 'horizontal', par: { m: 2, F: 10, ang: 30, modo: 'constante', mus: 0.5, mud: 0.3, u: 0 }, ver: { componentes: true, valores: true } },
    caidaLibre: { nombre: 'Se rompe el cable', escena: 'ascensor', par: { m: 60, modo: 'constante', aV: 2, aC: -9.81 } },

    atwood: { nombre: 'Máquina de Atwood', escena: 'atwood', par: { m1: 0.4, m2: 0.6 } },
    atwoodIgual: { nombre: 'Masas iguales', escena: 'atwood', par: { m1: 0.5, m2: 0.5 } },
    mesa: { nombre: 'Bloque y masa colgante', escena: 'mesa', par: { m1: 1, m2: 0.5, mus: 0.3, mud: 0.2 } },
    mesaQuieta: { nombre: 'Masa colgante pequeña', escena: 'mesa', par: { m1: 1, m2: 0.2, mus: 0.3, mud: 0.2 } }
  };

  /* ---------- Niveles ---------- */
  const NIVELES = [
    { nombre: 'Equilibrio y primera ley', corto: 'Equilibrio', preguntas: [
      { sit: 'riel', tipo: 'opcion',
        texto: `Pulsa «Empezar». El bloque sale con 0,5 m s⁻¹ por un riel sin rozamiento y el dinamómetro no tira. ¿Qué hace el bloque?`,
        opciones: [
          ['Se frena poco a poco hasta detenerse.', false, 'Para frenarlo haría falta una fuerza en contra de su velocidad. Sin rozamiento no la hay: mira la gráfica v–t.'],
          ['Sigue con velocidad constante.', true],
          ['Acelera, porque ya lleva velocidad.', false, 'Llevar velocidad no es lo mismo que tener fuerza neta. Mira la gráfica v–t: ¿cambia la velocidad?'],
          ['Se detiene enseguida, porque nadie lo empuja.', false, 'Es la idea de Aristóteles. Mira la gráfica v–t: la velocidad no cambia.']
        ],
        explicacion: `Primera ley de Newton: si la fuerza neta es cero, la velocidad no cambia. No hace falta ninguna fuerza para mantener el movimiento; hace falta una fuerza para <b>cambiarlo</b>.` },
      { sit: 'velConst', tipo: 'opcion',
        texto: `Ahora hay rozamiento. El bloque sale con 1 m s⁻¹ y el dinamómetro tira con ${F('H')} = ${mud}${F('N')}. Se mueve con velocidad constante. ¿Cuánto vale la fuerza neta?`,
        opciones: [
          [`Cero: ${F('H')} y ${F('f')} son iguales y opuestas.`, true],
          [`Igual a ${F('H')}, porque el bloque se mueve hacia la derecha.`, false, 'El sentido del movimiento no dice nada de la fuerza neta. ¿Cambia la velocidad?'],
          ['Un poco mayor que cero; si no, el bloque se pararía.', false, 'Con fuerza neta positiva el bloque aceleraría. Mira la gráfica v–t y el recuadro de la fuerza neta.']
        ],
        explicacion: `Velocidad constante ⇒ ${v('a')} = 0 ⇒ ${F('neta')} = 0. Moverse con velocidad constante es equilibrio de traslación, igual que estar en reposo.` },
      { sit: 'velConst', tipo: 'valor', unidad: '', oculta: ['mud'],
        texto: `Con la lectura del dinamómetro y la masa del bloque, calcula el coeficiente de rozamiento dinámico ${mud}.`,
        respuesta: (p) => p.F / (p.m * G),
        pista: `En equilibrio ${F('f')} = ${F('H')}, y mientras desliza ${F('f')} = ${mud}${F('N')} con ${F('N')} = ${v('mg')}.`,
        resolucion: (p) => `${F('f')} = ${F('H')} = ${n3(p.F)} N; ${F('N')} = ${v('mg')} = ${n3(p.m)} × 9,81 = ${n3(p.m * G)} N.<br>${mud} = ${F('f')} / ${F('N')} = ${n3(p.F)} / ${n3(p.m * G)} = <b>${n3(p.F / (p.m * G))}</b>` },
      { sit: 'ascSube', tipo: 'opcion',
        texto: `Pulsa «Empezar». Entre 1,5 s y 3,5 s el ascensor sube con velocidad constante. ¿Qué marca la balanza en ese tramo?`,
        opciones: [
          [`Más que el peso ${v('mg')}, porque el ascensor sube.`, false, 'Que suba no importa: lo que cuenta es la aceleración. ¿Cuánto vale en ese tramo?'],
          [`Exactamente el peso ${v('mg')}.`, true],
          [`Menos que el peso ${v('mg')}.`, false, 'Mira la gráfica de la lectura de la balanza entre 1,5 s y 3,5 s.']
        ],
        explicacion: `Con velocidad constante, ${v('a')} = 0: ${F('N')} − ${v('mg')} = 0, así que ${F('N')} = ${v('mg')}. La balanza marca la normal, que solo coincide con el peso cuando no hay aceleración vertical.` },
      { sit: 'cuerdas', tipo: 'opcion',
        texto: `El cuerpo cuelga de dos cuerdas que forman 30° y 50° con el techo. ¿Qué cuerda soporta más tensión?`,
        opciones: [
          ['La cuerda 1 (30°).', false, 'Compara las componentes horizontales: deben ser iguales. ¿Qué cuerda necesita más tensión para tener la misma componente horizontal?'],
          ['La cuerda 2 (50°).', true],
          ['Las dos la misma.', false, 'Solo pasaría si los dos ángulos fueran iguales. Mira los dinamómetros.']
        ],
        explicacion: `Las componentes horizontales se anulan: ${F('T1')} cos θ₁ = ${F('T2')} cos θ₂. Como cos 50° < cos 30°, ${F('T2')} > ${F('T1')}: la cuerda más vertical sostiene más.` },
      { sit: 'cuerdas', tipo: 'valor', unidad: 'N', ajustes: true,
        texto: `Cambia los ángulos como quieras. Con las lecturas de los dinamómetros, calcula ${F('T1')} sen θ₁ + ${F('T2')} sen θ₂. (Usa la masa que tengas en los ajustes.)`,
        respuesta: (p) => p.m * G,
        pista: `En equilibrio las componentes verticales de las tensiones equilibran el peso.`,
        resolucion: (p) => `Equilibrio vertical: ${F('T1')} sen θ₁ + ${F('T2')} sen θ₂ = ${v('mg')} = ${n3(p.m)} × 9,81 = <b>${n3(p.m * G)} N</b>, sean cuales sean los ángulos.` },
      { sit: 'terminal', tipo: 'opcion',
        texto: `Activa «Ampliar el comienzo». Justo al soltar la esfera (${v('v')} = 0), ¿cuánto vale su aceleración?`,
        opciones: [
          [`${v('g')} = 9,81 m s⁻², como en caída libre.`, false, 'En el líquido, además del peso, actúa otra fuerza desde el primer instante. ¿Cuál?'],
          [`${v('g')}(1 − ρ<sub>f</sub>/ρ<sub>s</sub>), algo menor que ${v('g')}.`, true],
          ['Cero, porque al principio no se mueve.', false, 'Que la velocidad sea cero no significa que la aceleración lo sea. Mira la pendiente de la v–t al principio.']
        ],
        explicacion: `Al principio ${F('d')} = 6πη${v('rv')} = 0, pero el empuje ${F('b')} = ρ<sub>f</sub>${v('Vg')} ya actúa. ${v('a')} = (${F('g')} − ${F('b')}) / ${v('m')} = ${v('g')}(1 − ρ<sub>f</sub>/ρ<sub>s</sub>).` },
      { sit: 'terminal', tipo: 'opcion',
        texto: `Cuando la esfera llega a la velocidad terminal, ¿qué relación cumplen las fuerzas?`,
        opciones: [
          [`${F('d')} = ${F('g')}`, false, 'Falta una fuerza. Mira la tabla de fuerzas: ¿cuántas actúan sobre la esfera?'],
          [`${F('d')} + ${F('b')} = ${F('g')}`, true],
          ['Las fuerzas desaparecen y por eso no acelera.', false, 'Las fuerzas siguen actuando; lo que es cero es su suma. Mira el diagrama de cuerpo libre.']
        ],
        explicacion: `Con velocidad constante la fuerza neta es cero: ${F('d')} + ${F('b')} = ${F('g')}. De ahí sale ${v('v')}<sub>t</sub> = 2${v('r')}²(ρ<sub>s</sub> − ρ<sub>f</sub>)${v('g')} / 9η. Es otro caso de equilibrio de traslación.` }
    ] },

    { nombre: 'Rozamiento estático y dinámico', corto: 'Rozamiento', preguntas: [
      { sit: 'pequena', tipo: 'valor', unidad: 'N',
        texto: `El dinamómetro tira con 3,0 N y el bloque (2,0 kg, ${mus} = 0,50) no se mueve. ¿Cuánto vale la fuerza de rozamiento?`,
        respuesta: (p) => p.F * Math.cos(p.ang * RAD),
        pista: `El bloque está en reposo: la fuerza neta es cero. El rozamiento estático no vale ${mus}${F('N')}; vale solo lo que hace falta.`,
        resolucion: (p) => `En reposo, ${F('f')} = ${F('H')} = <b>${n3(p.F)} N</b>. Es menor que el máximo ${mus}${F('N')} = ${n3(p.mus)} × ${n3(p.m * G)} = ${n3(p.mus * p.m * G)} N, por eso no desliza.` },
      { sit: 'pequena', tipo: 'opcion',
        texto: `¿Por qué el rozamiento no vale ${mus}${F('N')} = 9,81 N en este caso?`,
        opciones: [
          [`Porque ${mus}${F('N')} es el valor máximo; el rozamiento estático vale lo necesario para mantener el reposo.`, true],
          [`Porque la normal es menor que ${v('mg')}.`, false, `Aquí la fuerza es horizontal: ${F('N')} = ${v('mg')}. Mira la tabla de lecturas.`],
          ['Porque, como no se mueve, el rozamiento es dinámico.', false, 'Es al revés: sin deslizamiento el rozamiento es estático.']
        ],
        explicacion: `El modelo es ${F('f')} ≤ ${mus}${F('N')}: el «igual» solo se cumple justo cuando el bloque está a punto de deslizar.` },
      { sit: 'rampa', tipo: 'opcion',
        texto: `Pulsa «Empezar»: la fuerza del dinamómetro crece poco a poco. Observa la gráfica ${F('f')}–${F('H')}. ¿Qué ocurre justo cuando el bloque empieza a deslizar?`,
        opciones: [
          [`El rozamiento cae de ${mus}${F('N')} a ${mud}${F('N')}.`, true],
          ['El rozamiento sigue creciendo igual que la fuerza aplicada.', false, 'Mira la gráfica después del salto: ¿sigue subiendo?'],
          ['El rozamiento se anula.', false, 'Mientras desliza sigue habiendo rozamiento. Mira la gráfica y la tabla de fuerzas.']
        ],
        explicacion: `Mientras está en reposo, ${F('f')} = ${F('H')} (la recta). Al superar ${mus}${F('N')} empieza a deslizar y el rozamiento pasa a ser dinámico, ${mud}${F('N')}, menor y constante. Por eso cuesta más arrancar un mueble que mantenerlo en movimiento.` },
      { sit: 'rampa', tipo: 'valor', unidad: '', oculta: ['mus'],
        texto: `Con la gráfica, calcula ${mus}: la fuerza máxima antes de deslizar dividida por la normal.`,
        respuesta: (p) => p.mus,
        pista: `Busca el punto más alto de la gráfica (justo antes del salto) y divide por ${F('N')} = ${v('mg')}.`,
        resolucion: (p) => `${F('f')} máximo = ${n3(p.mus * p.m * G)} N; ${F('N')} = ${v('mg')} = ${n3(p.m * G)} N.<br>${mus} = ${n3(p.mus * p.m * G)} / ${n3(p.m * G)} = <b>${n3(p.mus)}</b>` },
      { sit: 'rampa', tipo: 'valor', unidad: 'm s⁻²',
        texto: `Mientras desliza, calcula la aceleración del bloque en el instante en que el dinamómetro marca 12,0 N.`,
        respuesta: (p) => (12 - p.mud * p.m * G) / p.m,
        pista: `Segunda ley: ${F('H')} − ${mud}${F('N')} = ${v('ma')}.`,
        resolucion: (p) => `${F('f')} = ${mud}${v('mg')} = ${n3(p.mud)} × ${n3(p.m * G)} = ${n3(p.mud * p.m * G)} N<br>${v('a')} = (12,0 − ${n3(p.mud * p.m * G)}) / ${n3(p.m)} = <b>${n3((12 - p.mud * p.m * G) / p.m)} m s⁻²</b>` },
      { sit: 'soltar', tipo: 'opcion',
        texto: `Pulsa «Empezar». Al cabo de 1 s se suelta el dinamómetro. Después, ¿qué fuerzas horizontales actúan sobre el bloque mientras sigue moviéndose?`,
        opciones: [
          ['Solo el rozamiento dinámico, en contra de la velocidad.', true],
          ['Ninguna: por eso sigue moviéndose.', false, 'Si no hubiera ninguna, seguiría con velocidad constante. Mira la gráfica v–t después de 1 s.'],
          ['La fuerza que le dio el dinamómetro, que se va gastando, y el rozamiento.', false, 'Una fuerza solo actúa mientras hay interacción. Al soltar el dinamómetro, ¿quién empujaría al bloque? Mira la tabla de fuerzas.']
        ],
        explicacion: `El bloque no «lleva» fuerza: lleva velocidad. Después de soltar solo actúa ${F('f')} = ${mud}${F('N')} hacia atrás, que lo frena con aceleración constante.` },
      { sit: 'soltar', tipo: 'valor', unidad: 'm s⁻²',
        texto: `Calcula la aceleración del bloque después de soltar el dinamómetro y antes de que se detenga (con su signo; derecha +).`,
        respuesta: (p) => -p.mud * G,
        pista: `Solo actúa el rozamiento: −${mud}${v('mg')} = ${v('ma')}. La masa se simplifica.`,
        resolucion: (p) => `${v('a')} = −${mud}${v('mg')} / ${v('m')} = −${mud}${v('g')} = −${n3(p.mud)} × 9,81 = <b>${n3(-p.mud * G)} m s⁻²</b>` },
      { sit: 'soltar', tipo: 'opcion',
        texto: `Cuando el bloque se detiene, ¿vuelve hacia atrás?`,
        opciones: [
          ['No: en reposo y sin fuerza aplicada, el rozamiento estático es cero.', true],
          ['Sí, porque el rozamiento sigue empujándolo hacia atrás.', false, 'El rozamiento se opone al deslizamiento; no puede ponerlo en movimiento. Mira la tabla de fuerzas al final.'],
          ['Sí, un poco, y luego se para.', false, 'Mira la gráfica v–t: ¿llega a ser negativa la velocidad?']
        ],
        explicacion: `En reposo, el rozamiento estático vale lo necesario para mantener el reposo. Sin fuerza aplicada, lo necesario es cero.` }
    ] },

    { nombre: 'Plano inclinado, fuerza con ángulo y ascensor', corto: 'Plano y ascensor', preguntas: [
      { sit: 'planoQuieto', tipo: 'opcion',
        texto: `El bloque está quieto en un plano de 20°. ¿Cuánto vale la fuerza normal?`,
        opciones: [
          [`${v('mg')}`, false, `La normal es perpendicular al plano. Mira la componente del peso perpendicular al plano.`],
          [`${v('mg')} cos θ`, true],
          [`${v('mg')} sen θ`, false, 'Esa es la componente del peso a lo largo del plano.']
        ],
        explicacion: `Perpendicular al plano no hay aceleración: ${F('N')} = ${v('mg')} cos θ, menor que ${v('mg')}. La normal no siempre es igual al peso.` },
      { sit: 'planoQuieto', tipo: 'opcion',
        texto: `El bloque no se mueve. ¿Hacia dónde apunta el rozamiento?`,
        opciones: [
          ['Hacia arriba del plano.', true],
          ['Hacia abajo del plano.', false, 'El rozamiento se opone a hacia dónde tiende a deslizar el bloque. ¿Hacia dónde deslizaría sin rozamiento?'],
          ['No hay rozamiento, porque no se mueve.', false, 'Sin rozamiento, la componente del peso a lo largo del plano lo haría deslizar. Mira la tabla de fuerzas.']
        ],
        explicacion: `El bloque tiende a deslizar hacia abajo; el rozamiento estático apunta hacia arriba y vale ${F('f')} = ${v('mg')} sen θ (menor que ${mus}${F('N')}).` },
      { sit: 'planoLimite', tipo: 'valor', unidad: '°', ajustes: true, tol: 0.04, oculta: ['anguloLimite'],
        texto: `Sube la inclinación grado a grado. ¿A partir de qué ángulo empieza a deslizar el bloque (${mus} = 0,50)? Responde con el ángulo límite.`,
        respuesta: (p) => Math.atan(p.mus) / RAD,
        pista: `Desliza cuando ${v('mg')} sen θ supera ${mus}${v('mg')} cos θ. Mira las barras «A lo largo del plano».`,
        resolucion: (p) => `Justo a punto de deslizar: ${v('mg')} sen θ = ${mus}${v('mg')} cos θ ⇒ tan θ = ${mus}.<br>θ = arctan ${n3(p.mus)} = <b>${n(Math.atan(p.mus) / RAD, 1)}°</b>. La masa no influye.` },
      { sit: 'planoSube', tipo: 'opcion',
        texto: `Pulsa «Empezar»: el bloque se lanza hacia arriba del plano. Mientras sube, ¿hacia dónde apunta el rozamiento?`,
        opciones: [
          ['Hacia abajo del plano, en contra de la velocidad.', true],
          ['Hacia arriba del plano, como cuando estaba quieto.', false, 'Mientras desliza, el rozamiento dinámico se opone a la velocidad. ¿Hacia dónde se mueve?'],
          ['No hay rozamiento mientras sube.', false, 'Mira la tabla de fuerzas mientras sube.']
        ],
        explicacion: `Mientras sube, el rozamiento y la componente del peso apuntan los dos hacia abajo del plano. Al bajar, el rozamiento cambia de sentido.` },
      { sit: 'planoSube', tipo: 'opcion',
        texto: `Mira la gráfica v–t. ¿Cómo son las aceleraciones al subir y al bajar?`,
        opciones: [
          [`Al subir es mayor (en módulo): ${v('g')}(sen θ + ${mud} cos θ) frente a ${v('g')}(sen θ − ${mud} cos θ).`, true],
          ['Iguales, porque el plano y el bloque son los mismos.', false, 'Compara las pendientes de la v–t antes y después de v = 0.'],
          ['Al bajar es mayor.', false, 'Compara las pendientes: ¿cuál es más inclinada?']
        ],
        explicacion: `Subiendo, el peso y el rozamiento frenan juntos; bajando, el rozamiento se opone a la componente del peso. La v–t tiene dos rectas con pendientes distintas.` },
      { sit: 'oblicua', tipo: 'valor', unidad: 'N',
        texto: `El dinamómetro tira con 10,0 N a 30° sobre la horizontal. Calcula la fuerza normal sobre el bloque (2,0 kg) y compárala después con la tabla de fuerzas.`,
        respuesta: (p) => p.m * G - p.F * Math.sin(p.ang * RAD),
        pista: `En vertical no hay aceleración: ${F('N')} + ${F('H')} sen θ = ${v('mg')}.`,
        resolucion: (p) => `${F('N')} = ${v('mg')} − ${F('H')} sen θ = ${n3(p.m * G)} − ${n3(p.F)} × sen ${p.ang}° = <b>${n3(p.m * G - p.F * Math.sin(p.ang * RAD))} N</b>` },
      { sit: 'oblicua', tipo: 'opcion',
        texto: `Comparado con tirar horizontalmente con la misma fuerza, tirar hacia arriba con ángulo…`,
        opciones: [
          ['…reduce la normal y, con ella, el rozamiento.', true],
          ['…no cambia la normal, porque la normal siempre es mg.', false, 'Mira la lectura de la normal con θ = 30° y con θ = 0°.'],
          ['…aumenta el rozamiento, porque el bloque se aprieta contra la mesa.', false, 'La componente vertical tira hacia arriba: ¿aprieta o alivia el contacto?']
        ],
        explicacion: `La componente ${F('H')} sen θ «levanta» parte del peso: ${F('N')} = ${v('mg')} − ${F('H')} sen θ, y ${F('f')} = ${mud}${F('N')} disminuye. A cambio, solo ${F('H')} cos θ tira hacia delante.` },
      { sit: 'ascSube', tipo: 'opcion',
        texto: `Mientras el ascensor arranca hacia arriba (0 a 1,5 s), la balanza marca…`,
        opciones: [
          [`…más que ${v('mg')}.`, true],
          [`…${v('mg')}, porque la masa de la persona no cambia.`, false, `La masa no cambia, pero la balanza no mide la masa: mide la normal. Mira la gráfica.`],
          [`…menos que ${v('mg')}.`, false, 'Eso ocurre cuando la aceleración es hacia abajo. ¿Hacia dónde acelera al arrancar hacia arriba?']
        ],
        explicacion: `${F('N')} − ${v('mg')} = ${v('ma')} con ${v('a')} > 0 ⇒ ${F('N')} = ${v('m')}(${v('g')} + ${v('a')}) > ${v('mg')}. El peso no cambia; cambia la normal.` },
      { sit: 'ascSube', tipo: 'valor', unidad: 'N',
        texto: `Calcula la lectura de la balanza mientras el ascensor frena al final de la subida (3,5 s a 5 s). Después compruébalo en la gráfica.`,
        respuesta: (p) => p.m * (G - p.aV),
        pista: `Al frenar mientras sube, la aceleración apunta hacia abajo. Aplica ${F('N')} − ${v('mg')} = ${v('ma')} con ${v('a')} negativa.`,
        resolucion: (p) => `${F('N')} − ${v('mg')} = ${v('ma')} con ${v('a')} = −${n3(p.aV)} m s⁻²<br>${F('N')} = ${n3(p.m)} × (9,81 − ${n3(p.aV)}) = <b>${n3(p.m * (G - p.aV))} N</b>` },
      { sit: 'caidaLibre', tipo: 'opcion',
        texto: `Se rompe el cable y el ascensor cae libremente (${v('a')} = −${v('g')}). ¿Qué marca la balanza? ¿Cambió el peso de la persona?`,
        opciones: [
          [`Marca 0; el peso sigue siendo ${v('mg')}.`, true],
          ['Marca 0 porque la persona ya no tiene peso.', false, 'Mira la tabla de fuerzas: ¿sigue actuando la Tierra sobre la persona?'],
          [`Sigue marcando ${v('mg')}.`, false, 'Mira la lectura de la balanza en la escena.']
        ],
        explicacion: `${F('N')} = ${v('m')}(${v('g')} + ${v('a')}) = ${v('m')}(${v('g')} − ${v('g')}) = 0. La única fuerza es el peso, que no cambia. La «ingravidez» es ausencia de normal, no de peso.` }
    ] },

    { nombre: 'Sistemas unidos', corto: 'Sistemas unidos', preguntas: [
      { sit: 'atwood', tipo: 'valor', unidad: 'm s⁻²',
        texto: `Calcula la aceleración de las masas (m₁ = 0,40 kg, m₂ = 0,60 kg) y compruébala con la gráfica v–t.`,
        respuesta: (p) => (p.m2 - p.m1) * G / (p.m1 + p.m2),
        pista: `Trata las dos masas como un sistema: la fuerza que lo mueve es (m₂ − m₁)${v('g')} y la masa que se acelera es m₁ + m₂. La tensión es interna.`,
        resolucion: (p) => `${v('a')} = (m₂ − m₁)${v('g')} / (m₁ + m₂) = (${n3(p.m2)} − ${n3(p.m1)}) × 9,81 / ${n3(p.m1 + p.m2)} = <b>${n3((p.m2 - p.m1) * G / (p.m1 + p.m2))} m s⁻²</b>` },
      { sit: 'atwood', tipo: 'opcion',
        texto: `¿Cómo es la tensión de la cuerda comparada con los pesos de las masas?`,
        opciones: [
          [`Mayor que m₁${v('g')} y menor que m₂${v('g')}.`, true],
          [`Igual a m₂${v('g')}, el peso de la masa que tira.`, false, 'Si fuera igual, la fuerza neta sobre m₂ sería cero y no aceleraría. Mira las barras.'],
          [`Igual a (m₁ + m₂)${v('g')}.`, false, 'Ese es el peso total. Mira las barras de lecturas.']
        ],
        explicacion: `m₁ sube acelerando: ${F('T')} > m₁${v('g')}. m₂ baja acelerando: ${F('T')} < m₂${v('g')}. Con ${F('T')} = m₁(${v('g')} + ${v('a')}).` },
      { sit: 'atwood', tipo: 'opcion',
        texto: `El dinamómetro que sostiene la polea marca 2${F('T')}. ¿Por qué es menor que el peso total (m₁ + m₂)${v('g')}?`,
        opciones: [
          ['Porque el sistema no está en equilibrio: la masa mayor baja, la menor sube, y el centro de masas del conjunto acelera hacia abajo.', true],
          ['Porque la polea absorbe parte del peso.', false, 'La polea no tiene masa ni rozamiento en este modelo. Compara la lectura con masas iguales.'],
          ['Porque la tensión es distinta a cada lado de la polea.', false, 'Con cuerda ideal y polea sin masa la tensión es la misma a los dos lados. Mira la tabla de fuerzas.']
        ],
        explicacion: `Para el conjunto (masas y polea): (m₁ + m₂)${v('g')} − 2${F('T')} = (m₂ − m₁)${v('a')} > 0. Solo con masas iguales, sin aceleración, el dinamómetro marca el peso total.` },
      { sit: 'atwoodIgual', tipo: 'opcion',
        texto: `Con masas iguales y desde el reposo, ¿qué ocurre al pulsar «Empezar»?`,
        opciones: [
          ['Se quedan en reposo.', true],
          ['Baja la de la derecha, que está más arriba.', false, 'La altura no cambia las fuerzas. Mira el diagrama de cuerpo libre de cada masa.'],
          ['Se mueven con velocidad constante.', false, 'Partiendo del reposo y sin fuerza neta, ¿por qué empezarían a moverse?']
        ],
        explicacion: `Con m₁ = m₂, ${F('T')} = ${v('mg')} en cada lado y la fuerza neta es cero. Si les dieras un empujón, seguirían con velocidad constante (primera ley).` },
      { sit: 'mesa', tipo: 'valor', unidad: 'N',
        texto: `Calcula la tensión de la cuerda cuando el sistema desliza (m₁ = 1,0 kg, m₂ = 0,50 kg, ${mud} = 0,20). Después compárala con la lectura.`,
        respuesta: (p) => { const a = (p.m2 - p.mud * p.m1) * G / (p.m1 + p.m2); return p.m2 * (G - a); },
        pista: `Primero la aceleración del sistema: ${v('a')} = (m₂${v('g')} − ${mud}m₁${v('g')}) / (m₁ + m₂). Después, la masa colgante: m₂${v('g')} − ${F('T')} = m₂${v('a')}.`,
        resolucion: (p) => { const a = (p.m2 - p.mud * p.m1) * G / (p.m1 + p.m2); return `${v('a')} = (${n3(p.m2 * G)} − ${n3(p.mud * p.m1 * G)}) / ${n3(p.m1 + p.m2)} = ${n3(a)} m s⁻²<br>${F('T')} = m₂(${v('g')} − ${v('a')}) = ${n3(p.m2)} × (9,81 − ${n3(a)}) = <b>${n3(p.m2 * (G - a))} N</b>`; } },
      { sit: 'mesa', tipo: 'opcion',
        texto: `¿Por qué la tensión no es igual al peso de la masa colgante, m₂${v('g')}?`,
        opciones: [
          [`Porque la masa colgante acelera hacia abajo: m₂${v('g')} − ${F('T')} = m₂${v('a')}.`, true],
          ['Porque parte del peso se pierde en la polea.', false, 'La polea es ideal en este modelo. Mira el diagrama de cuerpo libre de la masa colgante.'],
          ['Sí es igual; la diferencia es un error de redondeo.', false, 'Compara las barras m₂g y F_T: la diferencia es clara.']
        ],
        explicacion: `Solo si la masa colgante estuviera en reposo o con velocidad constante sería ${F('T')} = m₂${v('g')}.` },
      { sit: 'mesaQuieta', tipo: 'valor', unidad: 'N',
        texto: `Con m₂ = 0,20 kg el sistema no se mueve. ¿Cuánto vale la fuerza de rozamiento sobre el bloque?`,
        respuesta: (p) => p.m2 * G,
        pista: `En reposo: la tensión equilibra el peso colgante, y el rozamiento equilibra la tensión.`,
        resolucion: (p) => `Masa colgante en reposo: ${F('T')} = m₂${v('g')} = ${n3(p.m2 * G)} N. Bloque en reposo: ${F('f')} = ${F('T')} = <b>${n3(p.m2 * G)} N</b> (menor que ${mus}${F('N')} = ${n3(p.mus * p.m1 * G)} N).` },
      { sit: 'mesaQuieta', tipo: 'valor', unidad: 'kg', ajustes: true,
        texto: `¿Cuál es la mayor masa colgante m₂ que todavía deja el sistema en reposo? Compruébalo con el deslizador.`,
        respuesta: (p) => p.mus * p.m1,
        pista: `Justo a punto de deslizar: m₂${v('g')} = ${mus}m₁${v('g')}.`,
        resolucion: (p) => `m₂${v('g')} = ${mus}m₁${v('g')} ⇒ m₂ = ${mus}m₁ = ${n3(p.mus)} × ${n3(p.m1)} = <b>${n3(p.mus * p.m1)} kg</b>. Con un poco más, el sistema arranca.` }
    ] }
  ];

  const api = { SIT, NIVELES, G };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else raiz.NivelesFuerzas = api;
})(this);
