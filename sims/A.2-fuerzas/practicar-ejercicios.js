/* Simulación A.2 · Practicar: generador de ejercicios con datos al azar. Sin pantalla (también lo usan las pruebas).

   Cada ejercicio: { tipo, grupo, termino, texto, figura, unidad, respuesta, tol, pista, resolucion, medir }
     · termino: término de instrucción del IB (Calcula, Determina, Indica, Explica).
     · figura: { escena, par, t } del montaje de comun/dinamica.js (se dibuja sin fuerzas ni lecturas), o null.
     · respuesta: valor exacto con los datos del enunciado; se acepta ±tol (2 %).
     · medir(D): lo que mide el modelo con esos mismos datos (las pruebas comprueban que coincide con la respuesta).
     · Los de opción («opciones», «explicacion») no llevan respuesta numérica. */

(function (raiz) {
  'use strict';
  const G = 9.81, RAD = Math.PI / 180;
  const azar = (a) => a[Math.floor(Math.random() * a.length)];
  const entre = (min, max, paso) => { const n = Math.round((max - min) / paso); return Math.round((min + paso * Math.floor(Math.random() * (n + 1))) * 1e6) / 1e6; };
  const mezclar = (a) => { const b = a.slice(); for (let i = b.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [b[i], b[j]] = [b[j], b[i]]; } return b; };
  const n = (x, d) => { const r = Math.abs(x) < 0.5 * Math.pow(10, -d) ? 0 : x; return (r < 0 ? '−' : '') + Math.abs(r).toFixed(d).replace('.', ','); };
  // 3 cifras significativas, como en las resoluciones del IB
  const c3 = (x) => { if (x === 0) return '0'; const e = Math.floor(Math.log10(Math.abs(x))); return n(x, Math.max(0, 2 - e)); };
  const v = (x) => `<span class="var">${x}</span>`;
  const F = (s) => `${v('F')}<sub>${s}</sub>`;
  const mus = `${v('μ')}<sub>s</sub>`, mud = `${v('μ')}<sub>d</sub>`;
  const paso = (lineas) => '<ol class="pasos">' + lineas.map(l => `<li>${l}</li>`).join('') + '</ol>';
  const mesa0 = (o) => Object.assign({ m: 2, F: 0, ang: 0, modo: 'constante', mus: 0.5, mud: 0.3, u: 0 }, o);

  const TIPOS = {
    /* ---------- Bloque en la mesa ---------- */
    aHoriz() {
      const m = entre(0.5, 5, 0.5), ms = azar([0.3, 0.4, 0.5, 0.6]), md = Math.round(entre(0.1, ms - 0.1, 0.05) * 100) / 100;
      const lim = ms * m * G, Fa = Math.max(1, Math.round(lim * (1.2 + Math.random() * 0.8) * 2) / 2);
      const a = (Fa - md * m * G) / m;
      return { grupo: 'mesa', termino: 'Calcula',
        texto: `Un bloque de ${n(m, 1)} kg está sobre una mesa horizontal (${mus} = ${n(ms, 2)}, ${mud} = ${n(md, 2)}). Un dinamómetro tira de él horizontalmente con ${n(Fa, 1)} N y el bloque desliza. Calcula la aceleración del bloque.`,
        figura: { escena: 'horizontal', par: mesa0({ m, F: Fa, mus: ms, mud: md }), t: 0 }, unidad: 'm s⁻²', respuesta: a,
        pista: `Mientras desliza, ${F('f')} = ${mud}${F('N')} con ${F('N')} = ${v('mg')}. Luego aplica ${F('H')} − ${F('f')} = ${v('ma')}.`,
        resolucion: paso([`${F('N')} = ${v('mg')} = ${n(m, 1)} × 9,81 = ${c3(m * G)} N`, `${F('f')} = ${mud}${F('N')} = ${n(md, 2)} × ${c3(m * G)} = ${c3(md * m * G)} N`,
          `${v('a')} = (${F('H')} − ${F('f')}) / ${v('m')} = (${n(Fa, 1)} − ${c3(md * m * G)}) / ${n(m, 1)} = <b>${c3(a)} m s⁻²</b>`]),
        medir: (D) => D.crear('horizontal', mesa0({ m, F: Fa, mus: ms, mud: md })).estado(0.05).a };
    },
    seMueve() {
      const m = entre(1, 5, 0.5), ms = azar([0.3, 0.4, 0.5, 0.6]), md = Math.round(entre(0.1, ms - 0.1, 0.05) * 100) / 100;
      const lim = ms * m * G, desliza = Math.random() < 0.5;
      const Fa = Math.round(lim * (desliza ? 1.15 + Math.random() * 0.5 : 0.3 + Math.random() * 0.55) * 2) / 2 || 0.5;
      const se = Fa > lim, kin = md * m * G;
      const opciones = [
        [`No desliza; ${F('f')} = ${F('H')} = ${n(Fa, 1)} N`, !se, se ? `${F('H')} = ${n(Fa, 1)} N supera el rozamiento estático máximo ${mus}${F('N')} = ${c3(lim)} N.` : ''],
        [`No desliza; ${F('f')} = ${mus}${F('N')} = ${c3(lim)} N`, false, `${mus}${F('N')} es el valor máximo del rozamiento estático. En reposo, el rozamiento vale solo lo necesario para equilibrar ${F('H')}.`],
        [`Desliza; ${F('f')} = ${mud}${F('N')} = ${c3(kin)} N`, se, se ? '' : `Compara ${F('H')} = ${n(Fa, 1)} N con el máximo estático ${mus}${F('N')} = ${c3(lim)} N: no lo supera.`],
        [`Desliza; ${F('f')} = ${mus}${F('N')} = ${c3(lim)} N`, false, `Mientras desliza, el rozamiento es dinámico: ${mud}${F('N')}.`]
      ];
      return { grupo: 'mesa', termino: 'Determina',
        texto: `Un dinamómetro tira horizontalmente con ${n(Fa, 1)} N de un bloque de ${n(m, 1)} kg en reposo sobre una mesa (${mus} = ${n(ms, 2)}, ${mud} = ${n(md, 2)}). Determina si el bloque desliza y el valor de la fuerza de rozamiento.`,
        figura: { escena: 'horizontal', par: mesa0({ m, F: Fa, mus: ms, mud: md }), t: 0 }, opciones: mezclar(opciones),
        explicacion: paso([`Rozamiento estático máximo: ${mus}${F('N')} = ${n(ms, 2)} × ${c3(m * G)} = ${c3(lim)} N.`,
          se ? `${F('H')} = ${n(Fa, 1)} N > ${c3(lim)} N: <b>desliza</b>, y el rozamiento es dinámico: ${F('f')} = ${mud}${F('N')} = <b>${c3(kin)} N</b>.`
             : `${F('H')} = ${n(Fa, 1)} N ≤ ${c3(lim)} N: <b>no desliza</b>, y el rozamiento equilibra la fuerza: ${F('f')} = <b>${n(Fa, 1)} N</b>.`]),
        medir: (D) => { const e = D.crear('horizontal', mesa0({ m, F: Fa, mus: ms, mud: md })).estado(0.5); return { desliza: e.v > 0, Ff: e.lecturas.Ff, esperado: { desliza: se, Ff: se ? kin : Fa } }; } };
    },
    normalOblicua() {
      const m = entre(1, 5, 0.5), th = azar([20, 25, 30, 35, 40, 45, 50]), Fa = entre(2, Math.max(2, Math.min(30, Math.floor(0.9 * m * G / Math.sin(th * RAD) * 2) / 2)), 0.5);
      const N = m * G - Fa * Math.sin(th * RAD);
      return { grupo: 'mesa', termino: 'Calcula',
        texto: `Un dinamómetro tira de un bloque de ${n(m, 1)} kg con ${n(Fa, 1)} N, formando ${th}° con la horizontal hacia arriba. Calcula la fuerza normal que la mesa ejerce sobre el bloque.`,
        figura: { escena: 'horizontal', par: mesa0({ m, F: Fa, ang: th }), t: 0 }, unidad: 'N', respuesta: N,
        pista: `En vertical no hay aceleración: ${F('N')} + ${F('H')} sen θ − ${v('mg')} = 0.`,
        resolucion: paso([`Vertical: ${F('N')} + ${F('H')} sen θ = ${v('mg')}`, `${F('N')} = ${v('mg')} − ${F('H')} sen θ = ${c3(m * G)} − ${n(Fa, 1)} × sen ${th}° = <b>${c3(N)} N</b>`]),
        medir: (D) => D.crear('horizontal', mesa0({ m, F: Fa, ang: th })).estado(0).lecturas.FN };
    },
    aOblicua() {
      for (;;) {
        const m = entre(1, 4, 0.5), th = azar([20, 25, 30, 35, 40]), ms = azar([0.2, 0.3, 0.4]), md = Math.round(entre(0.1, ms, 0.05) * 100) / 100;
        const s = Math.sin(th * RAD), c = Math.cos(th * RAD), Fa = entre(4, 30, 0.5);
        if (Fa * s > 0.9 * m * G) continue;
        const N = m * G - Fa * s;
        if (Fa * c < 1.1 * ms * N) continue;
        const a = (Fa * c - md * N) / m;
        return { grupo: 'mesa', termino: 'Calcula',
          texto: `Un dinamómetro tira con ${n(Fa, 1)} N, a ${th}° sobre la horizontal, de un bloque de ${n(m, 1)} kg que desliza por una mesa (${mud} = ${n(md, 2)}). Calcula la aceleración del bloque.`,
          figura: { escena: 'horizontal', par: mesa0({ m, F: Fa, ang: th, mus: ms, mud: md }), t: 0 }, unidad: 'm s⁻²', respuesta: a,
          pista: `La normal no es ${v('mg')}: ${F('N')} = ${v('mg')} − ${F('H')} sen θ. Luego, en horizontal, ${F('H')} cos θ − ${mud}${F('N')} = ${v('ma')}.`,
          resolucion: paso([`${F('N')} = ${v('mg')} − ${F('H')} sen θ = ${c3(m * G)} − ${c3(Fa * s)} = ${c3(N)} N`, `${F('f')} = ${mud}${F('N')} = ${c3(md * N)} N`,
            `${v('a')} = (${F('H')} cos θ − ${F('f')}) / ${v('m')} = (${c3(Fa * c)} − ${c3(md * N)}) / ${n(m, 1)} = <b>${c3(a)} m s⁻²</b>`]),
          medir: (D) => D.crear('horizontal', mesa0({ m, F: Fa, ang: th, mus: ms, mud: md })).estado(0.05).a };
      }
    },
    muConst() {
      const m = entre(1, 5, 0.5), md0 = azar([0.15, 0.2, 0.25, 0.3, 0.35, 0.4, 0.45, 0.5]), Fa = Math.round(md0 * m * G * 10) / 10;
      const r = Fa / (m * G);
      return { grupo: 'mesa', termino: 'Determina',
        texto: `Un bloque de ${n(m, 1)} kg desliza por una mesa horizontal con velocidad constante mientras un dinamómetro tira horizontalmente de él con ${n(Fa, 1)} N. Determina el coeficiente de rozamiento dinámico.`,
        figura: { escena: 'horizontal', par: mesa0({ m, F: Fa, mus: Math.min(1, md0 + 0.2), mud: r, u: 1 }), t: 0 }, unidad: '', respuesta: r,
        pista: `Velocidad constante ⇒ fuerza neta cero ⇒ ${F('f')} = ${F('H')}. Y ${F('f')} = ${mud}${F('N')} con ${F('N')} = ${v('mg')}.`,
        resolucion: paso([`Velocidad constante: ${F('f')} = ${F('H')} = ${n(Fa, 1)} N`, `${F('N')} = ${v('mg')} = ${c3(m * G)} N`, `${mud} = ${F('f')} / ${F('N')} = ${n(Fa, 1)} / ${c3(m * G)} = <b>${c3(r)}</b>`]),
        // con ese μd el bloque lanzado mantiene la velocidad: lo que mide el modelo es F_f / F_N con a = 0
        medir: (D) => { const e = D.crear('horizontal', mesa0({ m, F: Fa, mus: Math.min(1, md0 + 0.2), mud: r, u: 1 })).estado(1); return Math.abs(e.a) < 1e-9 ? e.lecturas.Ff / e.lecturas.FN : NaN; } };
    },
    /* ---------- Plano inclinado ---------- */
    aPlano() {
      for (;;) {
        const m = entre(0.5, 3, 0.5), th = azar([25, 30, 35, 40, 45, 50]), ms = azar([0.2, 0.25, 0.3, 0.35, 0.4, 0.45, 0.5, 0.6]);
        if (Math.tan(th * RAD) < ms + 0.05) continue;
        const md = Math.round(entre(0.1, ms, 0.05) * 100) / 100, s = Math.sin(th * RAD), c = Math.cos(th * RAD), a = G * (s - md * c);
        const par = { m, ang: th, mus: ms, mud: md, u: 0 };
        return { grupo: 'plano', termino: 'Calcula',
          texto: `Un bloque de ${n(m, 1)} kg baja deslizando por un plano inclinado ${th}° (${mud} = ${n(md, 2)}). Calcula el módulo de su aceleración.`,
          figura: { escena: 'plano', par, t: 0 }, unidad: 'm s⁻²', respuesta: a,
          pista: `A lo largo del plano: ${v('mg')} sen θ − ${mud}${v('mg')} cos θ = ${v('ma')}. La masa se simplifica.`,
          resolucion: paso([`${F('N')} = ${v('mg')} cos θ`, `${v('ma')} = ${v('mg')} sen θ − ${mud}${v('mg')} cos θ ⇒ ${v('a')} = ${v('g')}(sen θ − ${mud} cos θ)`,
            `${v('a')} = 9,81 × (sen ${th}° − ${n(md, 2)} × cos ${th}°) = <b>${c3(a)} m s⁻²</b>`]),
          medir: (D) => -D.crear('plano', par).estado(0.1).a };
      }
    },
    anguloLim() {
      const ms = azar([0.2, 0.25, 0.3, 0.35, 0.4, 0.45, 0.5, 0.55, 0.6, 0.7, 0.8]), m = entre(0.5, 3, 0.5), ang = Math.atan(ms) / RAD;
      return { grupo: 'plano', termino: 'Calcula',
        texto: `Un bloque de ${n(m, 1)} kg reposa sobre una tabla que se va inclinando poco a poco (${mus} = ${n(ms, 2)}). Calcula el ángulo a partir del cual el bloque empieza a deslizar.`,
        figura: { escena: 'plano', par: { m, ang: 15, mus: ms, mud: ms * 0.6, u: 0 }, t: 0 }, unidad: '°', respuesta: ang,
        pista: `A punto de deslizar, la componente del peso a lo largo del plano iguala al rozamiento estático máximo: ${v('mg')} sen θ = ${mus}${v('mg')} cos θ.`,
        resolucion: paso([`${v('mg')} sen θ = ${mus}${v('mg')} cos θ ⇒ tan θ = ${mus}`, `θ = arctan ${n(ms, 2)} = <b>${n(ang, 1)}°</b> (la masa no influye)`]),
        // el modelo: ángulo umbral por bisección (por debajo queda en reposo, por encima desliza)
        medir: (D) => { let a = 0.1, b = 89; for (let i = 0; i < 50; i++) { const c = (a + b) / 2; if (D.crear('plano', { m, ang: c, mus: ms, mud: ms * 0.6, u: 0 }).estado(0.2).v === 0) a = c; else b = c; } return (a + b) / 2; } };
    },
    muDeAngulo() {
      const th = azar([15, 18, 20, 22, 25, 28, 30, 32, 35]), m = entre(0.5, 3, 0.5), r = Math.tan(th * RAD);
      return { grupo: 'plano', termino: 'Determina',
        texto: `Se inclina poco a poco una tabla con un bloque de ${n(m, 1)} kg encima. El bloque empieza a deslizar justo cuando la tabla forma ${th}° con la horizontal. Determina el coeficiente de rozamiento estático.`,
        figura: { escena: 'plano', par: { m, ang: th, mus: r, mud: r * 0.6, u: 0 }, t: 0 }, unidad: '', respuesta: r,
        pista: `Justo a punto de deslizar: ${v('mg')} sen θ = ${mus}${v('mg')} cos θ.`,
        resolucion: paso([`${v('mg')} sen θ = ${mus}${v('mg')} cos θ ⇒ ${mus} = tan θ`, `${mus} = tan ${th}° = <b>${c3(r)}</b>`]),
        medir: (D) => { let a = 0.01, b = 3; for (let i = 0; i < 50; i++) { const c = (a + b) / 2; if (D.crear('plano', { m, ang: th, mus: c, mud: c * 0.6, u: 0 }).estado(0.2).v === 0) b = c; else a = c; } return (a + b) / 2; } };
    },
    /* ---------- Ascensor ---------- */
    balanza() {
      const m = entre(45, 90, 5), A = entre(0.5, 3, 0.5);
      const caso = azar([['sube acelerando', A], ['sube frenando', -A], ['baja acelerando', -A], ['baja frenando', A], ['sube con velocidad constante', 0]]);
      const a = caso[1], N = m * (G + a);
      return { grupo: 'ascensor', termino: 'Calcula',
        texto: `Una persona de ${n(m, 0)} kg está de pie sobre una balanza dentro de un ascensor que ${caso[0]}${a ? ` con una aceleración de módulo ${n(Math.abs(a), 1)} m s⁻²` : ''}. Calcula la lectura de la balanza.`,
        figura: { escena: 'ascensor', par: { m, modo: 'constante', a }, t: 0 }, unidad: 'N', respuesta: N,
        pista: `Primero decide hacia dónde apunta la aceleración (arriba +). Luego ${F('N')} − ${v('mg')} = ${v('ma')}: la balanza marca ${F('N')}.`,
        resolucion: paso([`El ascensor ${caso[0]}: ${v('a')} = ${a === 0 ? '0' : (a > 0 ? '+' : '−') + n(Math.abs(a), 1)} m s⁻² (arriba +)`, `${F('N')} − ${v('mg')} = ${v('ma')} ⇒ ${F('N')} = ${v('m')}(${v('g')} + ${v('a')})`,
          `${F('N')} = ${n(m, 0)} × (9,81 ${a < 0 ? '−' : '+'} ${n(Math.abs(a), 1)}) = <b>${c3(N)} N</b>`]),
        medir: (D) => D.crear('ascensor', { m, modo: 'constante', a }).estado(1).lecturas.balanza };
    },
    /* ---------- Máquina de Atwood ---------- */
    atwoodA() {
      let m1, m2; do { m1 = entre(0.2, 2, 0.1); m2 = entre(0.2, 2, 0.1); } while (Math.abs(m1 - m2) < 0.15);
      const a = Math.abs(m2 - m1) * G / (m1 + m2);
      return { grupo: 'atwood', termino: 'Calcula',
        texto: `En una máquina de Atwood cuelgan m₁ = ${n(m1, 2)} kg y m₂ = ${n(m2, 2)} kg (cuerda y polea ideales). Calcula el módulo de la aceleración de las masas.`,
        figura: { escena: 'atwood', par: { m1, m2 }, t: 0 }, unidad: 'm s⁻²', respuesta: a,
        pista: `Para el sistema: la fuerza neta es la diferencia de pesos y la masa que se acelera es m₁ + m₂ (la tensión es interna).`,
        resolucion: paso([`${v('a')} = |m₂ − m₁|${v('g')} / (m₁ + m₂)`, `${v('a')} = ${n(Math.abs(m2 - m1), 2)} × 9,81 / ${n(m1 + m2, 2)} = <b>${c3(a)} m s⁻²</b>`]),
        medir: (D) => Math.abs(D.crear('atwood', { m1, m2 }).estado(0.1).a) };
    },
    atwoodT() {
      let m1, m2; do { m1 = entre(0.2, 2, 0.1); m2 = entre(0.2, 2, 0.1); } while (Math.abs(m1 - m2) < 0.15);
      const T = 2 * m1 * m2 * G / (m1 + m2), a = (m2 - m1) * G / (m1 + m2), mm = Math.min(m1, m2);
      return { grupo: 'atwood', termino: 'Calcula',
        texto: `En una máquina de Atwood cuelgan m₁ = ${n(m1, 2)} kg y m₂ = ${n(m2, 2)} kg (cuerda y polea ideales). Calcula la tensión de la cuerda.`,
        figura: { escena: 'atwood', par: { m1, m2 }, t: 0 }, unidad: 'N', respuesta: T,
        pista: `Calcula primero la aceleración del sistema. Luego aplica la segunda ley a una sola masa, por ejemplo la que sube: ${F('T')} − m${v('g')} = m${v('a')}.`,
        resolucion: paso([`${v('a')} = |m₂ − m₁|${v('g')} / (m₁ + m₂) = ${c3(Math.abs(a))} m s⁻²`, `Masa que sube (${n(mm, 2)} kg): ${F('T')} − m${v('g')} = m${v('a')}`,
          `${F('T')} = ${n(mm, 2)} × (9,81 + ${c3(Math.abs(a))}) = <b>${c3(T)} N</b>`]),
        medir: (D) => D.crear('atwood', { m1, m2 }).estado(0.1).lecturas.FT };
    },
    polea() {
      let m1, m2; do { m1 = entre(0.2, 2, 0.1); m2 = entre(0.2, 2, 0.1); } while (Math.abs(m1 - m2) < 0.15);
      const T = 2 * m1 * m2 * G / (m1 + m2);
      return { grupo: 'atwood', termino: 'Determina',
        texto: `La polea de una máquina de Atwood (m₁ = ${n(m1, 2)} kg, m₂ = ${n(m2, 2)} kg) cuelga de un dinamómetro. Determina la lectura del dinamómetro mientras las masas se mueven.`,
        figura: { escena: 'atwood', par: { m1, m2 }, t: 0 }, unidad: 'N', respuesta: 2 * T,
        pista: `La polea (sin masa) está en equilibrio: el dinamómetro sostiene las dos ramas de la cuerda, 2${F('T')}. No es (m₁ + m₂)${v('g')}, porque las masas aceleran.`,
        resolucion: paso([`${F('T')} = 2m₁m₂${v('g')} / (m₁ + m₂) = ${c3(T)} N`, `Dinamómetro = 2${F('T')} = <b>${c3(2 * T)} N</b> (menor que (m₁ + m₂)${v('g')} = ${c3((m1 + m2) * G)} N)`]),
        medir: (D) => D.crear('atwood', { m1, m2 }).estado(0.1).lecturas.polea };
    },
    /* ---------- Bloque con masa colgante ---------- */
    mesaA() {
      for (;;) {
        const m1 = entre(0.5, 2, 0.1), m2 = entre(0.1, 1, 0.05), ms = azar([0.2, 0.3, 0.4]), md = Math.round(entre(0.1, ms, 0.05) * 100) / 100;
        if (m2 < 1.15 * ms * m1) continue;
        const a = (m2 - md * m1) * G / (m1 + m2), par = { m1, m2, mus: ms, mud: md };
        return { grupo: 'mesa2', termino: 'Calcula',
          texto: `Un bloque de ${n(m1, 2)} kg sobre una mesa (${mud} = ${n(md, 2)}) está unido por una cuerda, que pasa por una polea ideal, a una masa colgante de ${n(m2, 2)} kg. El sistema se mueve. Calcula su aceleración.`,
          figura: { escena: 'mesa', par, t: 0 }, unidad: 'm s⁻²', respuesta: a,
          pista: `Para el sistema: la masa colgante tira con m₂${v('g')}, el rozamiento frena con ${mud}m₁${v('g')} y se aceleran las dos masas.`,
          resolucion: paso([`(m₁ + m₂)${v('a')} = m₂${v('g')} − ${mud}m₁${v('g')}`, `${v('a')} = (${c3(m2 * G)} − ${c3(md * m1 * G)}) / ${n(m1 + m2, 2)} = <b>${c3(a)} m s⁻²</b>`]),
          medir: (D) => D.crear('mesa', par).estado(0.1).a };
      }
    },
    mesaT() {
      for (;;) {
        const m1 = entre(0.5, 2, 0.1), m2 = entre(0.1, 1, 0.05), ms = azar([0.2, 0.3, 0.4]), md = Math.round(entre(0.1, ms, 0.05) * 100) / 100;
        if (m2 < 1.15 * ms * m1) continue;
        const a = (m2 - md * m1) * G / (m1 + m2), T = m2 * (G - a), par = { m1, m2, mus: ms, mud: md };
        return { grupo: 'mesa2', termino: 'Calcula',
          texto: `Un bloque de ${n(m1, 2)} kg sobre una mesa (${mud} = ${n(md, 2)}) está unido por una cuerda, que pasa por una polea ideal, a una masa colgante de ${n(m2, 2)} kg. Mientras el sistema se mueve, calcula la tensión de la cuerda.`,
          figura: { escena: 'mesa', par, t: 0 }, unidad: 'N', respuesta: T,
          pista: `Calcula la aceleración del sistema y aplica la segunda ley a la masa colgante: m₂${v('g')} − ${F('T')} = m₂${v('a')}.`,
          resolucion: paso([`${v('a')} = (m₂ − ${mud}m₁)${v('g')} / (m₁ + m₂) = ${c3(a)} m s⁻²`, `${F('T')} = m₂(${v('g')} − ${v('a')}) = ${n(m2, 2)} × (9,81 − ${c3(a)}) = <b>${c3(T)} N</b>`]),
          medir: (D) => D.crear('mesa', par).estado(0.1).lecturas.FT };
      }
    },
    /* ---------- Dos cuerdas ---------- */
    cuerdasT() {
      const m = entre(0.5, 3, 0.5), a1 = entre(15, 75, 5), a2 = entre(15, 75, 5), cual = azar([1, 2]);
      const den = Math.sin((a1 + a2) * RAD), T1 = m * G * Math.cos(a2 * RAD) / den, T2 = m * G * Math.cos(a1 * RAD) / den, T = cual === 1 ? T1 : T2;
      return { grupo: 'cuerdas', termino: 'Calcula',
        texto: `Un cuerpo de ${n(m, 1)} kg cuelga en reposo de dos cuerdas que forman θ₁ = ${a1}° y θ₂ = ${a2}° con el techo. Calcula la tensión de la cuerda ${cual}.`,
        figura: { escena: 'cuerdas', par: { m, ang1: a1, ang2: a2 }, t: 0 }, unidad: 'N', respuesta: T,
        pista: `Equilibrio: horizontal ${F('T1')} cos θ₁ = ${F('T2')} cos θ₂; vertical ${F('T1')} sen θ₁ + ${F('T2')} sen θ₂ = ${v('mg')}. Resuelve el sistema.`,
        resolucion: paso([`${F('T1')} cos ${a1}° = ${F('T2')} cos ${a2}°`, `${F('T1')} sen ${a1}° + ${F('T2')} sen ${a2}° = ${c3(m * G)} N`,
          `Resolviendo: ${F('T' + cual)} = ${v('mg')} cos θ${cual === 1 ? '₂' : '₁'} / sen(θ₁ + θ₂) = <b>${c3(T)} N</b>`]),
        medir: (D) => D.crear('cuerdas', { m, ang1: a1, ang2: a2 }).estado(0).lecturas['T' + cual] };
    },
    /* ---------- Fuerza elástica ---------- */
    hooke() {
      const m = azar([0.1, 0.15, 0.2, 0.25, 0.3, 0.4, 0.5]), x = entre(2, 12, 0.5), k = m * G / (x / 100);
      return { grupo: 'elastica', termino: 'Calcula',
        texto: `Al colgar una masa de ${n(m * 1000, 0)} g del resorte de un dinamómetro, el resorte se alarga ${n(x, 1)} cm y la masa queda en reposo. Calcula la constante elástica del resorte.`,
        figura: { dibujo: 'resorte', m, x }, unidad: 'N m⁻¹', respuesta: k,
        pista: `En equilibrio, la fuerza elástica iguala al peso: ${v('kx')} = ${v('mg')}. Pasa el alargamiento a metros.`,
        resolucion: paso([`${F('H')} = ${v('kx')} = ${v('mg')} (equilibrio)`, `${v('k')} = ${v('mg')} / ${v('x')} = (${n(m, 3)} × 9,81) / ${n(x / 100, 3)} = <b>${c3(k)} N m⁻¹</b>`]),
        medir: () => m * G / (x / 100) };
    },
    /* ---------- Esfera en un líquido ---------- */
    terminal() {
      const D0 = (typeof module !== 'undefined' && module.exports) ? require('../../comun/dinamica.js') : raiz.Dinamica;
      const mat = azar(['acero', 'vidrio']), liq = azar(['glicerina', 'ricino']), r = entre(1.5, 3, 0.5);
      const L = D0.LIQUIDOS[liq], M = D0.MATERIALES[mat], rr = r / 1000, vt = 2 * rr * rr * (M.rho - L.rho) * G / (9 * L.eta);
      return { grupo: 'esfera', termino: 'Calcula',
        texto: `Una esfera de ${M.nombre} (ρ = ${M.rho} kg m⁻³) de radio ${n(r, 1)} mm cae en ${L.nombre} (ρ = ${L.rho} kg m⁻³, η = ${n(L.eta, 2)} Pa s). Calcula su velocidad terminal (en m s⁻¹).`,
        figura: { escena: 'esfera', par: { material: mat, r, liquido: liq }, t: 0 }, unidad: 'm s⁻¹', respuesta: vt,
        pista: `A la velocidad terminal la fuerza neta es cero: ${F('g')} = ${F('b')} + ${F('d')}, con ${F('d')} = 6πη${v('r')}${v('v')} y ${v('V')} = 4/3 π${v('r')}³.`,
        resolucion: paso([`ρ<sub>s</sub>${v('V')}${v('g')} = ρ<sub>f</sub>${v('V')}${v('g')} + 6πη${v('r')}${v('v')}<sub>t</sub> ⇒ ${v('v')}<sub>t</sub> = 2${v('r')}²(ρ<sub>s</sub> − ρ<sub>f</sub>)${v('g')} / 9η`,
          `${v('v')}<sub>t</sub> = 2 × (${n(rr, 4)})² × ${M.rho - L.rho} × 9,81 / (9 × ${n(L.eta, 2)}) = <b>${c3(vt)} m s⁻¹</b>`]),
        medir: (D) => { const mod = D.crear('esfera', { material: mat, r, liquido: liq }); return mod.estado(mod.T).v; } };
    },
    viscosidad() {
      const D0 = (typeof module !== 'undefined' && module.exports) ? require('../../comun/dinamica.js') : raiz.Dinamica;
      const mat = azar(['acero', 'vidrio']), liq = azar(['glicerina', 'ricino']), r = entre(1.5, 3, 0.5);
      const L = D0.LIQUIDOS[liq], M = D0.MATERIALES[mat], rr = r / 1000;
      const vtReal = 2 * rr * rr * (M.rho - L.rho) * G / (9 * L.eta);
      const e = Math.floor(Math.log10(vtReal)), vt = Math.round(vtReal / Math.pow(10, e - 2)) * Math.pow(10, e - 2);   // medida con 3 c.s.
      const eta = 2 * rr * rr * (M.rho - L.rho) * G / (9 * vt);
      return { grupo: 'esfera', termino: 'Determina',
        texto: `Una esfera de ${M.nombre} (ρ = ${M.rho} kg m⁻³) de radio ${n(r, 1)} mm alcanza una velocidad terminal de ${c3(vt)} m s⁻¹ al caer en un líquido de densidad ${L.rho} kg m⁻³. Determina la viscosidad del líquido.`,
        figura: { escena: 'esfera', par: { material: mat, r, liquido: liq }, t: 0 }, unidad: 'Pa s', respuesta: eta,
        pista: `Velocidad terminal: ${F('g')} = ${F('b')} + ${F('d')}. Despeja η de ${v('v')}<sub>t</sub> = 2${v('r')}²(ρ<sub>s</sub> − ρ<sub>f</sub>)${v('g')} / 9η.`,
        resolucion: paso([`η = 2${v('r')}²(ρ<sub>s</sub> − ρ<sub>f</sub>)${v('g')} / 9${v('v')}<sub>t</sub>`, `η = 2 × (${n(rr, 4)})² × ${M.rho - L.rho} × 9,81 / (9 × ${c3(vt)}) = <b>${c3(eta)} Pa s</b>`]),
        medir: (D) => D.LIQUIDOS[liq].eta };
    },
    /* ---------- Explica (opción múltiple con razonamiento) ---------- */
    explica() {
      const q = azar(EXPLICA);
      return Object.assign({ grupo: 'explica', termino: 'Explica' }, q, { opciones: mezclar(q.opciones) });
    }
  };

  const EXPLICA = [
    { texto: 'Un bloque lanzado sobre una mesa horizontal termina deteniéndose. Explica por qué.', figura: { escena: 'horizontal', par: mesa0({ F: 0, u: 1.5 }), t: 0 },
      opciones: [['Porque el rozamiento de la mesa actúa en contra de su velocidad y lo frena.', true],
        ['Porque se le acaba la fuerza con la que fue lanzado.', false, 'El bloque no «lleva» fuerza: lleva velocidad. Después del lanzamiento, ¿qué cuerpo lo empuja hacia delante?'],
        ['Porque todo cuerpo en movimiento tiende a detenerse por sí solo.', false, 'Sin rozamiento seguiría con velocidad constante (primera ley). Algo tiene que frenarlo.']],
      explicacion: 'Después del lanzamiento solo hay fuerzas verticales que se compensan y el rozamiento dinámico, opuesto a la velocidad: la fuerza neta apunta hacia atrás y el bloque frena hasta detenerse.' },
    { texto: 'Un paracaidista desciende con velocidad constante. Explica cómo es la resistencia del aire comparada con su peso.', figura: null,
      opciones: [['Igual al peso: con velocidad constante la fuerza neta es cero.', true],
        ['Menor que el peso, porque el paracaidista va hacia abajo.', false, 'Si fuera menor, la fuerza neta apuntaría hacia abajo y aceleraría. ¿Cambia su velocidad?'],
        ['Mayor que el peso, porque lo frena.', false, 'Si fuera mayor, el paracaidista iría cada vez más despacio. Su velocidad es constante.']],
      explicacion: 'Velocidad constante ⇒ a = 0 ⇒ fuerza neta cero: la resistencia del aire equilibra exactamente el peso. Es la velocidad terminal.' },
    { texto: 'Explica por qué la balanza de un ascensor marca más que mg cuando el ascensor frena mientras baja.', figura: { escena: 'ascensor', par: { m: 60, modo: 'constante', a: 2 }, t: 0 },
      opciones: [['Porque al frenar mientras baja la aceleración apunta hacia arriba, y F_N − mg = ma > 0.', true],
        ['Porque la persona pesa más mientras el ascensor frena.', false, 'El peso (la atracción de la Tierra) no cambia. Lo que cambia es la normal.'],
        ['Porque el ascensor se mueve hacia abajo y empuja a la persona contra la balanza.', false, 'El sentido de la velocidad no importa: cuenta el de la aceleración. ¿Hacia dónde apunta al frenar mientras baja?']],
      explicacion: 'Frenar mientras se baja es acelerar hacia arriba. La balanza mide la normal: F_N = m(g + a) > mg. El peso sigue siendo mg.' },
    { texto: 'Explica por qué la fuerza normal sobre un bloque apoyado en un plano inclinado es menor que su peso.', figura: { escena: 'plano', par: { m: 1, ang: 30, mus: 0.7, mud: 0.5, u: 0 }, t: 0 },
      opciones: [['Porque la normal solo equilibra la componente del peso perpendicular al plano, mg cos θ.', true],
        ['Porque parte del peso se pierde por el rozamiento.', false, 'El rozamiento es paralelo al plano; no afecta a la dirección perpendicular. Descompón el peso.'],
        ['Porque en un plano inclinado el bloque pesa menos.', false, 'El peso es mg en cualquier lugar de la superficie terrestre. ¿Qué componente del peso equilibra la normal?']],
      explicacion: 'Perpendicular al plano no hay aceleración: F_N = mg cos θ, que es menor que mg para θ > 0.' },
    { texto: 'En una máquina de Atwood que acelera, explica por qué la tensión es menor que el peso de la masa mayor.', figura: { escena: 'atwood', par: { m1: 0.4, m2: 0.6 }, t: 0 },
      opciones: [['Porque la masa mayor acelera hacia abajo: su peso tiene que superar a la tensión.', true],
        ['Porque la polea se queda con parte de la fuerza.', false, 'En el modelo la polea es ideal (sin masa ni rozamiento). Aplica la segunda ley a la masa mayor.'],
        ['Porque la tensión es la diferencia entre los dos pesos.', false, 'La diferencia de pesos es la fuerza neta del sistema, no la tensión. Calcúlala para comprobarlo.']],
      explicacion: 'Para la masa mayor: m₂g − F_T = m₂a con a > 0, así que F_T < m₂g. Para la menor, F_T > m₁g.' },
    { texto: 'Explica por qué el ángulo a partir del cual un bloque desliza por un plano no depende de su masa.', figura: { escena: 'plano', par: { m: 2, ang: 20, mus: 0.5, mud: 0.3, u: 0 }, t: 0 },
      opciones: [['Porque la componente del peso a lo largo del plano y el rozamiento máximo son proporcionales a la masa: tan θ = μs.', true],
        ['Porque los cuerpos pesados tienen más rozamiento y los ligeros menos, y se compensa.', false, 'Es casi la idea, pero no explica por qué la masa desaparece. Escribe las dos fuerzas y compáralas.'],
        ['Porque la masa no influye en el rozamiento.', false, 'Sí influye: F_f máx = μs mg cos θ depende de m. Pero la componente del peso también.']],
      explicacion: 'A punto de deslizar: mg sen θ = μs mg cos θ. La masa se simplifica y queda tan θ = μs.' },
    { texto: 'Explica por qué una esfera que cae en glicerina llega a una velocidad constante.', figura: { escena: 'esfera', par: { material: 'acero', r: 2.5, liquido: 'glicerina' }, t: 0 },
      opciones: [['Porque el arrastre viscoso crece con la rapidez hasta que, con el empuje, equilibra al peso.', true],
        ['Porque el empuje crece a medida que la esfera se hunde.', false, 'El empuje (ρ_f V g) no depende de la profundidad. ¿Qué fuerza depende de la velocidad?'],
        ['Porque la glicerina absorbe la fuerza del peso.', false, 'El peso no cambia. Fíjate en la fuerza del líquido que depende de la velocidad: F_d = 6πηrv.']],
      explicacion: 'F_d = 6πηrv aumenta con v. Cuando F_d + F_b = F_g la fuerza neta es cero y la velocidad deja de cambiar: es la velocidad terminal.' },
    { texto: 'Explica por qué la fuerza de rozamiento sobre un bloque en reposo puede ser menor que μs F_N.', figura: { escena: 'horizontal', par: mesa0({ F: 3 }), t: 0 },
      opciones: [['Porque μs F_N es el valor máximo: en reposo, el rozamiento vale solo lo necesario para equilibrar las demás fuerzas.', true],
        ['Porque μs solo se usa cuando el bloque se mueve.', false, 'Mientras se mueve se usa μd. μs da el máximo del rozamiento estático.'],
        ['No puede: en reposo el rozamiento siempre vale μs F_N.', false, 'Si fuera así, un bloque en reposo sin ninguna fuerza aplicada sería empujado por el rozamiento. ¿Tiene sentido?']],
      explicacion: 'El modelo es F_f ≤ μs F_N. La igualdad solo se da justo cuando el bloque está a punto de deslizar.' }
  ];

  const GRUPOS = [
    ['todos', 'Todos'], ['mesa', 'Mesa y rozamiento'], ['plano', 'Plano inclinado'], ['ascensor', 'Ascensor'], ['atwood', 'Atwood'],
    ['mesa2', 'Masa colgante'], ['cuerdas', 'Dos cuerdas'], ['elastica', 'Fuerza elástica'], ['esfera', 'Velocidad terminal'], ['explica', 'Explica']
  ];
  const LISTA = Object.keys(TIPOS);
  const GRUPO_DE = { aHoriz: 'mesa', seMueve: 'mesa', normalOblicua: 'mesa', aOblicua: 'mesa', muConst: 'mesa', aPlano: 'plano', anguloLim: 'plano',
    muDeAngulo: 'plano', balanza: 'ascensor', atwoodA: 'atwood', atwoodT: 'atwood', polea: 'atwood', mesaA: 'mesa2', mesaT: 'mesa2', cuerdasT: 'cuerdas',
    hooke: 'elastica', terminal: 'esfera', viscosidad: 'esfera', explica: 'explica' };
  function generar(tipo) { const e = TIPOS[tipo](); e.tipo = tipo; e.tol = e.tol || 0.02; return e; }
  // ejercicio al azar del grupo elegido, distinto del anterior si se puede
  function generarDeGrupo(grupo, anterior) {
    const tipos = LISTA.filter(t => grupo === 'todos' || GRUPO_DE[t] === grupo);
    const otros = tipos.filter(t => t !== anterior || tipos.length === 1 || t === 'explica');
    return generar(azar(otros.length ? otros : tipos));
  }

  const api = { TIPOS, LISTA, GRUPOS, GRUPO_DE, EXPLICA, generar, generarDeGrupo, c3 };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else raiz.PracticarFuerzas = api;
})(this);
