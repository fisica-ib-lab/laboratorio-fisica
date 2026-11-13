/* Simulación A.1 — generador de ejercicios de Practicar (sin pantalla: solo datos y textos).
   Cada ejercicio sale de un movimiento exacto por tramos (comun/cinematica.js); la respuesta correcta
   se calcula con ese movimiento y los distractores reproducen errores típicos.
   Se comprueba con: node pruebas/verificar-ejercicios.js */

(function (raiz) {
  'use strict';
  const enNode = typeof module !== 'undefined' && module.exports;
  const { Movimiento, numero } = enNode ? require('../../comun/cinematica.js') : raiz.Cinematica;

  const LETRAS = 'ABCDEF';
  const V = '<span class="var">v</span>', U = '<span class="var">u</span>', A = '<span class="var">a</span>', S = '<span class="var">s</span>', T = '<span class="var">t</span>';

  // ---------- Azar con semilla (para poder repetir las pruebas) ----------
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
  const entero = (r, a, b) => a + Math.floor(r() * (b - a + 1));
  function barajar(r, lista) {
    const x = lista.slice();
    for (let i = x.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [x[i], x[j]] = [x[j], x[i]]; }
    return x;
  }
  function fmt(x) {
    const r = Math.round(x * 100) / 100;
    return numero(r, Number.isInteger(r) ? 0 : (Number.isInteger(Math.round(r * 1000) / 100) ? 1 : 2));
  }
  const conSigno = (x) => (x > 0 ? '+' : '') + fmt(x);

  // ---------- Movimientos ----------
  function crear(def) { return new Movimiento(def.s0, def.u, def.tramos); }

  /* o: nMin, nMax; saltos (velocidad constante por tramo); cambioSentido (true / false / indiferente);
        conAceleracion (al menos un tramo con a ≠ 0) */
  function movAleatorio(r, o) {
    for (let intento = 0; intento < 400; intento++) {
      const n = entero(r, o.nMin, o.nMax);
      const durs = []; let total = 0;
      for (let i = 0; i < n; i++) { const d = elegir(r, [2, 2, 3, 3, 4]); durs.push(d); total += d; }
      if (total > 10) continue;
      let u, tramos;
      if (o.saltos) {
        const vs = [];
        for (let i = 0; i < n; i++) {
          let v; do { v = entero(r, -4, 4); } while (i > 0 && v === vs[i - 1]);
          vs.push(v);
        }
        if (vs.every(v => v === 0)) continue;
        u = vs[0];
        tramos = durs.map((d, i) => ({ duracion: d, a: 0, v: vs[i] }));
      } else {
        u = elegir(r, [-4, -3, -2, -1, 0, 0, 0, 1, 2, 3, 4]);
        const as = [];
        for (let i = 0; i < n; i++) {
          let a; do { a = r() < 0.3 ? 0 : elegir(r, [-2, -1.5, -1, -0.5, 0.5, 1, 1.5, 2]); } while (i > 0 && a === as[i - 1]);
          as.push(a);
        }
        if (o.conAceleracion && as.every(a => a === 0)) continue;
        tramos = durs.map((d, i) => ({ duracion: d, a: as[i] }));
      }
      const m = new Movimiento(0, u, tramos);
      // velocidades dentro de la gráfica y cambios de sentido en instantes «redondos»
      let bien = true;
      for (const tr of m.tramos) {
        const v1 = tr.v0 + tr.a * (tr.t1 - tr.t0);
        if (Math.abs(tr.v0) > 6 || Math.abs(v1) > 6) bien = false;
        if (tr.a !== 0 && tr.v0 * v1 < 0) { const d = -tr.v0 / tr.a; if (Math.abs(d * 2 - Math.round(d * 2)) > 1e-9) bien = false; }
      }
      if (!bien) continue;
      if (!o.saltos && u === 0 && tramos[0].a === 0 && n === 1) continue;
      const [mn, mx] = m.rangoS();
      if (mx - mn > 50 || mx - mn < 4) continue;
      const cambia = m.distancia(m.duracion) - Math.abs(m.desplazamiento(m.duracion)) > 1e-9;
      if (o.cambioSentido === true && !cambia) continue;
      if (o.cambioSentido === false && cambia) continue;
      return { s0: -Math.round((mn + mx) / 2), u, tramos };
    }
    return null;
  }

  // ---------- Curvas como listas de puntos (t, valor) ----------
  function muestra(m, mag, n) {
    n = n || 40;
    const pts = [];
    for (const tr of m.tramos) {
      if (mag === 'a') { pts.push([tr.t0, tr.a], [tr.t1, tr.a]); continue; }
      const k = (mag !== 'v' && tr.a !== 0) ? n : 1, D = tr.t1 - tr.t0;
      for (let i = 0; i <= k; i++) {
        const d = D * i / k;
        if (mag === 'v') pts.push([tr.t0 + d, tr.v0 + tr.a * d]);
        else pts.push([tr.t0 + d, tr.s0 + tr.v0 * d + 0.5 * tr.a * d * d]);
      }
    }
    return pts;
  }
  const maxAbs = (pts) => pts.reduce((x, p) => Math.max(x, Math.abs(p[1])), 0);
  const transformar = (pts, f) => pts.map(p => [p[0], f(p[1], p[0])]);
  function valorEn(pts, t) {
    for (let i = 0; i + 1 < pts.length; i++) {
      const [t1, y1] = pts[i], [t2, y2] = pts[i + 1];
      if (t2 > t1 && t >= t1 && t <= t2) return y1 + (y2 - y1) * (t - t1) / (t2 - t1);
    }
    return pts[pts.length - 1][1];
  }
  // «base» es el valor inicial común (s₀ en las gráficas de posición), para comparar solo lo que cambia
  function distintas(p1, p2, base) {
    base = base || 0;
    const Tf = p1[p1.length - 1][0];
    const rango = Math.max(maxAbs(transformar(p1, y => y - base)), maxAbs(transformar(p2, y => y - base)), 1e-9);
    let mx = 0, suma = 0;
    for (let i = 0; i < 40; i++) { const d = Math.abs(valorEn(p1, Tf * (i + 0.37) / 40) - valorEn(p2, Tf * (i + 0.37) / 40)); mx = Math.max(mx, d); suma += d; }
    return mx > 0.22 * rango && suma / 40 > 0.05 * rango;
  }
  // |y|: añade los puntos donde la curva cruza el eje
  function valorAbsoluto(pts) {
    const r = [];
    for (let i = 0; i < pts.length; i++) {
      if (i > 0) {
        const [t1, y1] = pts[i - 1], [t2, y2] = pts[i];
        if (y1 * y2 < 0 && t2 > t1) r.push([t1 + (t2 - t1) * y1 / (y1 - y2), 0]);
      }
      r.push([pts[i][0], Math.abs(pts[i][1])]);
    }
    return r;
  }
  function invertirTiempo(pts) { const Tf = pts[pts.length - 1][0]; return pts.slice().reverse().map(p => [Tf - p[0], p[1]]); }
  // misma forma que «pts», con la altura máxima indicada
  function forma(pts, alturaMax) { const m = maxAbs(pts); return m < 1e-9 ? null : transformar(pts, y => y * alturaMax / m); }

  function armarOpciones(r, correcta, candidatas, base) {
    const elegidas = [];
    for (const c of candidatas) {
      if (!c || !c.puntos) continue;
      if (!distintas(c.puntos, correcta, base)) continue;
      if (elegidas.some(e => !distintas(e.puntos, c.puntos, base))) continue;
      elegidas.push(c);
      if (elegidas.length === 3) break;
    }
    if (elegidas.length < 3) return null;
    return barajar(r, [{ puntos: correcta, correcta: true }].concat(elegidas.map(c => ({ puntos: c.puntos, correcta: false, pista: c.pista }))));
  }

  // ---------- Textos ----------
  const intervalo = (tr) => `${fmt(tr.t0)}–${fmt(tr.t1)} s`;
  const vFinal = (tr) => tr.v0 + tr.a * (tr.t1 - tr.t0);
  const lado = (x) => (x > 0 ? 'la derecha' : 'la izquierda');
  function describirTramo(v0, v1, a) {
    if (a === 0) return v0 === 0 ? 'está en reposo' : `se mueve hacia ${lado(v0)} con velocidad constante`;
    if (v0 === 0) return `parte del reposo y acelera hacia ${lado(a)}`;
    if (v1 === 0) return `frena hasta detenerse mientras va hacia ${lado(v0)}`;
    if (v0 * v1 < 0) return `frena, se detiene un instante y vuelve acelerando hacia ${lado(v1)}`;
    return Math.abs(v1) > Math.abs(v0) ? `acelera hacia ${lado(v0)}` : `frena mientras va hacia ${lado(v0)}`;
  }
  function unir(frases) {
    const pre = frases.length === 1 ? [''] : frases.length === 2 ? ['Primero ', 'después '] :
      frases.length === 3 ? ['Primero ', 'después ', 'al final '] : ['Primero ', 'después ', 'luego ', 'al final '];
    const txt = frases.map((f, i) => (pre[Math.min(i, pre.length - 1)] || '') + f).join('; ') + '.';
    return txt.charAt(0).toUpperCase() + txt.slice(1);
  }
  const listaHtml = (items) => '<ul>' + items.map(x => `<li>${x}</li>`).join('') + '</ul>';

  // ---------- Ejercicios: de una gráfica a otra ----------
  function explicarV(m) {
    return listaHtml(m.tramos.map((tr, i) => {
      const v1 = vFinal(tr);
      return `Tramo ${LETRAS[i]} (${intervalo(tr)}): ` + (tr.a === 0
        ? (tr.v0 === 0 ? `la ${S}–${T} es horizontal, ${V} = 0.` : `la ${S}–${T} es una recta de pendiente ${fmt(tr.v0)} m s⁻¹: ${V} constante.`)
        : `la pendiente de la ${S}–${T} pasa de ${fmt(tr.v0)} a ${fmt(v1)} m s⁻¹: la ${V}–${T} es una recta inclinada.`);
    }));
  }

  function ejStVt(r, verMovimiento) {
    const def = movAleatorio(r, { nMin: 2, nMax: 3 }); if (!def) return null;
    const m = crear(def), pv = muestra(m, 'v'), alto = Math.max(maxAbs(pv), 1);
    const ps = transformar(muestra(m, 's'), y => y - def.s0), pa = muestra(m, 'a');
    const cand = [
      { puntos: forma(ps, alto), pista: verMovimiento
        ? `Esa gráfica tiene la forma de la posición. La ${V}–${T} muestra lo rápido que va el carrito y hacia dónde, no dónde está.`
        : `Esa gráfica tiene la misma forma que la ${S}–${T}. La velocidad es la pendiente de la ${S}–${T}, no su altura.` },
      { puntos: transformar(pv, y => -y), pista: verMovimiento
        ? `Revisa el signo: cuando el carrito va hacia la derecha, ${V} es positiva.`
        : `Revisa el signo: donde la ${S}–${T} sube, la velocidad es positiva.` },
      { puntos: valorAbsoluto(pv), pista: `La velocidad tiene signo: cuando el carrito va hacia la izquierda, ${V} es negativa.` },
      { puntos: invertirTiempo(pv), pista: 'Compara el principio con el final: ¿cuándo va más rápido el carrito?' },
      { puntos: def.u !== 0 ? transformar(pv, y => y - def.u) : null, pista: `Mira el inicio: en ${T} = 0 el carrito ya se está moviendo.` },
      { puntos: forma(pa, alto), pista: `Esa gráfica tiene la forma de la aceleración, no de la velocidad.` }
    ];
    const opciones = armarOpciones(r, pv, cand); if (!opciones) return null;
    return {
      id: verMovimiento ? 'mov-vt' : 'st-vt', tipo: 'grafica', def,
      titulo: verMovimiento ? 'Del movimiento a la v–t' : 'De la s–t a la v–t',
      enunciado: verMovimiento
        ? `Pulsa «Ver el movimiento» y observa el carrito las veces que necesites. <b>Identifique</b> la gráfica velocidad–tiempo de ese movimiento.`
        : `La gráfica muestra la posición ${S} de un carrito en función del tiempo. <b>Identifique</b> la gráfica velocidad–tiempo del mismo movimiento.`,
      dado: verMovimiento ? null : 's', verAntes: !!verMovimiento, magOpc: 'v', opciones,
      explicacion: `La velocidad es la pendiente de la gráfica ${S}–${T}.` + explicarV(m)
    };
  }

  function ejVtAt(r) {
    const def = movAleatorio(r, { nMin: 2, nMax: 3, conAceleracion: true }); if (!def) return null;
    const m = crear(def), pv = muestra(m, 'v'), pa = muestra(m, 'a'), alto = Math.max(maxAbs(pa), 0.5), Tf = m.duracion;
    const media = (m.v(Tf) - def.u) / Tf;
    const cand = [
      { puntos: forma(pv, alto), pista: `Esa gráfica tiene la misma forma que la ${V}–${T}. La aceleración es la pendiente de la ${V}–${T}, no su altura.` },
      { puntos: transformar(pa, y => -y), pista: `Revisa el signo de la pendiente: si ${V} aumenta, ${A} es positiva.` },
      { puntos: [[0, media], [Tf, media]], pista: `La pendiente de la ${V}–${T} no es la misma en todos los tramos.` },
      { puntos: invertirTiempo(pa), pista: 'Fíjate en qué tramo ocurre cada pendiente.' },
      { puntos: valorAbsoluto(pa), pista: `La aceleración tiene signo: cuando la ${V}–${T} baja, ${A} es negativa.` },
      { puntos: transformar(pa, y => y * 2), pista: `Calcula la pendiente con cuidado: Δ${V} entre Δ${T}.` }
    ];
    const opciones = armarOpciones(r, pa, cand); if (!opciones) return null;
    return {
      id: 'vt-at', tipo: 'grafica', def, titulo: 'De la v–t a la a–t',
      enunciado: `La gráfica muestra la velocidad ${V} de un carrito en función del tiempo. <b>Identifique</b> la gráfica aceleración–tiempo del mismo movimiento.`,
      dado: 'v', magOpc: 'a', opciones,
      explicacion: `La aceleración es la pendiente de la gráfica ${V}–${T}.` + listaHtml(m.tramos.map((tr, i) =>
        `Tramo ${LETRAS[i]} (${intervalo(tr)}): ${A} = Δ${V}/Δ${T} = (${fmt(vFinal(tr))} − ${tr.v0 < 0 ? '(' + fmt(tr.v0) + ')' : fmt(tr.v0)})/${fmt(tr.t1 - tr.t0)} = ${fmt(tr.a)} m s⁻².`))
    };
  }

  function ejVtSt(r) {
    const def = movAleatorio(r, { nMin: 2, nMax: 3, conAceleracion: true }); if (!def) return null;
    const m = crear(def), s0 = def.s0, ps = muestra(m, 's'), pv = muestra(m, 'v');
    const alto = Math.max(maxAbs(transformar(ps, y => y - s0)), 1);
    // concavidad invertida: cada tramo reflejado respecto de su cuerda
    const reflejada = [];
    for (const tr of m.tramos) {
      const D = tr.t1 - tr.t0, sFin = tr.s0 + tr.v0 * D + 0.5 * tr.a * D * D;
      for (let i = 0; i <= 40; i++) {
        const d = D * i / 40, s = tr.s0 + tr.v0 * d + 0.5 * tr.a * d * d, cuerda = tr.s0 + (sFin - tr.s0) * d / D;
        reflejada.push([tr.t0 + d, 2 * cuerda - s]);
      }
    }
    const rectas = [[0, s0]].concat(m.tramos.map(tr => [tr.t1, m.s(tr.t1)]));
    const fv = forma(transformar(pv, y => y - def.u), alto);
    const distancia = []; for (let i = 0; i <= 120; i++) { const t = m.duracion * i / 120; distancia.push([t, s0 + m.distancia(t)]); }
    const cand = [
      { puntos: reflejada, pista: `Mira si la rapidez aumenta o disminuye en cada tramo: la ${S}–${T} se hace más inclinada cuando la rapidez aumenta.` },
      { puntos: transformar(ps, y => 2 * s0 - y), pista: `Cuando ${V} es positiva, ${S} aumenta; cuando es negativa, disminuye.` },
      { puntos: fv ? transformar(fv, y => y + s0) : null, pista: `Esa gráfica tiene la misma forma que la ${V}–${T}. El cambio de posición es el área bajo la ${V}–${T}.` },
      { puntos: rectas, pista: `Si la velocidad cambia durante un tramo, la ${S}–${T} de ese tramo es una curva, no una recta.` },
      { puntos: distancia, pista: `Cuando ${V} es negativa el carrito retrocede: ${S} disminuye.` }
    ];
    const opciones = armarOpciones(r, ps, cand, s0); if (!opciones) return null;
    return {
      id: 'vt-st', tipo: 'grafica', def, titulo: 'De la v–t a la s–t',
      enunciado: `La gráfica muestra la velocidad ${V} de un carrito. En ${T} = 0 el carrito está en ${S} = ${fmt(s0)} m. <b>Identifique</b> la gráfica posición–tiempo del mismo movimiento.`,
      dado: 'v', magOpc: 's', opciones,
      explicacion: `El cambio de posición en cada tramo es el área bajo la ${V}–${T}; la pendiente de la ${S}–${T} es ${V}.` + listaHtml(m.tramos.map((tr, i) => {
        const ds = m.s(tr.t1) - m.s(tr.t0);
        return `Tramo ${LETRAS[i]} (${intervalo(tr)}): Δ${S} = ${conSigno(ds)} m; ` +
          (tr.a === 0 ? (tr.v0 === 0 ? 'horizontal.' : 'recta.') : (tr.a > 0 ? 'curva que se dobla hacia arriba.' : 'curva que se dobla hacia abajo.'));
      }))
    };
  }

  // ---------- Ejercicios: calcular con la gráfica ----------
  function limpiarPistas(pistas, resp, tol) {
    const r = [];
    for (const p of pistas) {
      if (p === null || !isFinite(p.valor)) continue;
      if (Math.abs(p.valor - resp) <= 2 * tol) continue;
      if (r.some(q => Math.abs(q.valor - p.valor) <= 2 * Math.max(0.02, 0.01 * Math.abs(q.valor), 0.01 * Math.abs(p.valor)))) continue;   // dos errores con casi el mismo valor: se queda el primero
      r.push(p);
    }
    return r;
  }
  const tolerancia = (x) => Math.max(0.05, 0.02 * Math.abs(x));

  function ejArea(r, distancia) {
    const def = movAleatorio(r, { nMin: 2, nMax: 3, cambioSentido: distancia ? true : undefined }); if (!def) return null;
    const m = crear(def), Tf = m.duracion, desp = m.desplazamiento(Tf), dist = m.distancia(Tf);
    const resp = distancia ? dist : desp, tol = tolerancia(resp);
    const rectFin = m.tramos.reduce((x, tr) => x + vFinal(tr) * (tr.t1 - tr.t0), 0);
    const rectIni = m.tramos.reduce((x, tr) => x + tr.v0 * (tr.t1 - tr.t0), 0);
    const triang = 'En los tramos inclinados el área es la de un triángulo o un trapecio, no la de un rectángulo.';
    const pistas = distancia ? [
      { valor: desp, texto: 'Eso es el desplazamiento. Para la distancia recorrida, todas las áreas se suman como positivas.' },
      { valor: Math.abs(desp), texto: 'Eso es el módulo del desplazamiento. Para la distancia recorrida, suma el área de encima del eje y la de debajo, las dos como positivas.' },
      { valor: Math.abs(rectFin), texto: triang }, { valor: Math.abs(rectIni), texto: triang }
    ] : [
      { valor: dist, texto: 'Eso es la distancia recorrida. Para el desplazamiento, el área por debajo del eje se resta.' },
      { valor: -desp, texto: 'Revisa el signo: el área por encima del eje es positiva y la de debajo, negativa.' },
      { valor: m.v(Tf) * Tf, texto: `No multipliques la velocidad final por el tiempo: el desplazamiento es el área bajo la gráfica.` },
      { valor: rectFin, texto: triang }, { valor: rectIni, texto: triang }
    ];
    const partes = m.tramos.map((tr, i) => {
      const ds = m.s(tr.t1) - m.s(tr.t0), d = m.distancia(tr.t1) - m.distancia(tr.t0);
      const mixto = d - Math.abs(ds) > 1e-9;
      return `Tramo ${LETRAS[i]} (${intervalo(tr)}): ` + (mixto
        ? `área de encima ${fmt((d + ds) / 2)} m y área de debajo ${fmt((d - ds) / 2)} m.`
        : `área = ${fmt(distancia ? d : ds)} m${!distancia && ds < 0 ? ' (por debajo del eje)' : ''}.`);
    });
    return {
      id: distancia ? 'distancia' : 'desplazamiento', tipo: 'numero', def,
      titulo: distancia ? 'Distancia desde la v–t' : 'Desplazamiento desde la v–t',
      enunciado: `La gráfica muestra la velocidad ${V} de un carrito. <b>Determine</b> ${distancia ? 'la distancia recorrida por el carrito' : 'el desplazamiento del carrito'} entre ${T} = 0 y ${T} = ${fmt(Tf)} s.`,
      dado: 'v', respuesta: resp, unidad: 'm', tolerancia: tol, pistas: limpiarPistas(pistas, resp, tol),
      pistaGeneral: `Calcula el área entre la gráfica y el eje del tiempo en cada tramo (rectángulos, triángulos o trapecios).`,
      explicacion: (distancia
        ? `La distancia recorrida es el área entre la ${V}–${T} y el eje del tiempo, toda como positiva.`
        : `El desplazamiento es el área entre la ${V}–${T} y el eje del tiempo, con signo: positiva por encima del eje y negativa por debajo.`) +
        listaHtml(partes) + `Total: <b>${fmt(resp)} m</b>.`
    };
  }

  function ejPendiente(r, deS) {
    const def = movAleatorio(r, deS ? { nMin: 2, nMax: 3, saltos: true } : { nMin: 2, nMax: 3, conAceleracion: true }); if (!def) return null;
    const m = crear(def);
    const posibles = m.tramos.map((tr, i) => i).filter(i => deS ? m.tramos[i].v0 !== 0 : m.tramos[i].a !== 0);
    if (!posibles.length) return null;
    const i = elegir(r, posibles), tr = m.tramos[i], D = tr.t1 - tr.t0;
    const y0 = deS ? tr.s0 : tr.v0, y1 = deS ? m.s(tr.t1) : vFinal(tr);
    const resp = (y1 - y0) / D, tol = tolerancia(resp);
    const mag = deS ? S : V;
    const pistas = [
      { valor: -resp, texto: `Revisa el signo: Δ${mag} es el valor final menos el inicial.` },
      { valor: 1 / resp, texto: `La pendiente es Δ${mag}/Δ${T}, no Δ${T}/Δ${mag}.` },
      tr.t1 > 0 ? { valor: y1 / tr.t1, texto: `No dividas ${mag} entre ${T}: usa el cambio de ${mag} entre el cambio de ${T} dentro del tramo.` } : null,
      tr.t0 > 0 ? { valor: y0 / tr.t0, texto: `No dividas ${mag} entre ${T}: usa el cambio de ${mag} entre el cambio de ${T} dentro del tramo.` } : null,
      { valor: (y1 - y0) / tr.t1, texto: `Δ${T} es la duración del tramo, no el instante final.` },
      { valor: y1 / D, texto: `Usa el cambio de ${mag} en el tramo (final menos inicial), no solo el valor final.` },
      { valor: y1 - y0, texto: `Eso es Δ${mag}. Falta dividir entre Δ${T}.` }
    ];
    const u = deS ? 'm s⁻¹' : 'm s⁻²';
    return {
      id: deS ? 'pendiente-v' : 'pendiente-a', tipo: 'numero', def, tramo: i,
      titulo: deS ? 'Velocidad desde la s–t' : 'Aceleración desde la v–t',
      enunciado: deS
        ? `La gráfica muestra la posición ${S} de un carrito. <b>Calcule</b> la velocidad del carrito en el tramo ${LETRAS[i]}.`
        : `La gráfica muestra la velocidad ${V} de un carrito. <b>Calcule</b> la aceleración del carrito en el tramo ${LETRAS[i]}.`,
      dado: deS ? 's' : 'v', respuesta: resp, unidad: u, tolerancia: tol, pistas: limpiarPistas(pistas, resp, tol),
      pistaGeneral: `Elige dos puntos del tramo ${LETRAS[i]} y divide el cambio vertical entre el cambio horizontal.`,
      explicacion: `${deS ? 'La velocidad' : 'La aceleración'} es la pendiente de la gráfica en ese tramo: ` +
        `${deS ? V : A} = Δ${mag}/Δ${T} = (${fmt(y1)} − ${y0 < 0 ? '(' + fmt(y0) + ')' : fmt(y0)})/(${fmt(tr.t1)} − ${fmt(tr.t0)}) = <b>${fmt(resp)} ${u}</b>.`
    };
  }

  // ---------- Ejercicios: interpretar ----------
  function ejRapidez(r) {
    const def = movAleatorio(r, { nMin: 2, nMax: 3, conAceleracion: true }); if (!def) return null;
    const m = crear(def);
    const posibles = m.tramos.map((tr, i) => i).filter(i => {
      const tr = m.tramos[i], v = m.v((tr.t0 + tr.t1) / 2);
      return tr.a === 0 || Math.abs(v) >= 0.5;
    });
    if (!posibles.length) return null;
    const i = elegir(r, posibles), tr = m.tramos[i], tP = (tr.t0 + tr.t1) / 2, v = m.v(tP), a = tr.a;
    const real = v === 0 ? 3 : a === 0 ? 2 : v * a > 0 ? 0 : 1;
    const textos = ['Su rapidez aumenta', 'Su rapidez disminuye', 'Se mueve con velocidad constante', 'Está en reposo'];
    const pista = (k) => {
      if (k === 3) return `En P la gráfica no está sobre el eje del tiempo: ${V} no es cero.`;
      if (k === 2) return real === 3 ? `En P la gráfica está sobre el eje del tiempo: ¿cuánto vale ${V}?` : `En P la gráfica está inclinada: la velocidad está cambiando.`;
      if (real >= 2) return `En P la gráfica es horizontal: la velocidad no está cambiando.`;
      return `Compara el signo de ${V} en P con el signo de la pendiente (${A}). La rapidez es el valor de ${V} sin signo: ¿se aleja del eje o se acerca a él?`;
    };
    return {
      id: 'rapidez', tipo: 'texto', def, titulo: '¿Acelera o frena?',
      enunciado: `La gráfica muestra la velocidad ${V} de un carrito. <b>Indique</b> qué le ocurre al carrito en el instante marcado con P.`,
      dado: 'v', marcas: [{ t: tP, mag: 'v', nombre: 'P' }],
      opciones: textos.map((texto, k) => ({ texto, correcta: k === real, pista: k === real ? undefined : pista(k) })),
      explicacion: real === 3 ? `En P, ${V} = 0 y la gráfica es horizontal: el carrito está en reposo.`
        : real === 2 ? `En P, ${V} = ${fmt(v)} m s⁻¹ y la gráfica es horizontal (${A} = 0): la velocidad es constante.`
        : `En P, ${V} = ${fmt(v)} m s⁻¹ (${v > 0 ? 'positiva' : 'negativa'}) y la pendiente es ${A} = ${fmt(a)} m s⁻² (${a > 0 ? 'positiva' : 'negativa'}). ` +
          (real === 0 ? `Tienen el mismo signo: la gráfica se aleja del eje y la rapidez aumenta.` : `Tienen signos contrarios: la gráfica se acerca al eje y la rapidez disminuye.`)
    };
  }

  function ejSentido(r) {
    const enS = r() < 0.5;
    const def = movAleatorio(r, { nMin: 2, nMax: 3, conAceleracion: true }); if (!def) return null;
    const m = crear(def);
    const posibles = m.tramos.map((tr, i) => i).filter(i => {
      const tr = m.tramos[i], v = m.v((tr.t0 + tr.t1) / 2);
      return (v === 0 && tr.a === 0) || Math.abs(v) >= 1;
    });
    if (!posibles.length) return null;
    // se prefieren los puntos donde la «lectura rápida» falla
    const tramposos = posibles.filter(i => {
      const tr = m.tramos[i], tP = (tr.t0 + tr.t1) / 2, v = m.v(tP);
      return enS ? v * m.s(tP) < 0 : v * tr.a < 0;
    });
    const i = elegir(r, tramposos.length && r() < 0.75 ? tramposos : posibles), tr = m.tramos[i], tP = (tr.t0 + tr.t1) / 2, v = m.v(tP);
    const real = v > 0 ? 0 : v < 0 ? 1 : 2;
    const textos = ['Hacia la derecha', 'Hacia la izquierda', 'No se mueve'];
    const pista = (k) => {
      if (enS) {
        if (real === 2) return `En P la gráfica ${S}–${T} es horizontal: la posición no cambia.`;
        if (k === 2) return `En P la gráfica ${S}–${T} está inclinada: la posición está cambiando.`;
        return `En una gráfica ${S}–${T}, el sentido lo indica la pendiente (si ${S} aumenta o disminuye), no que ${S} sea positiva o negativa.`;
      }
      if (real === 2) return `En P la gráfica está sobre el eje del tiempo: ¿cuánto vale ${V}?`;
      if (k === 2) return `En P la gráfica no está sobre el eje del tiempo: ${V} no es cero.`;
      return `En una gráfica ${V}–${T}, el sentido lo indica el signo de ${V} (por encima o por debajo del eje), no que la gráfica suba o baje.`;
    };
    return {
      id: 'sentido', tipo: 'texto', def, titulo: '¿Hacia dónde se mueve?',
      enunciado: `La gráfica muestra la ${enS ? 'posición ' + S : 'velocidad ' + V} de un carrito. El sentido positivo es hacia la derecha. <b>Indique</b> hacia dónde se mueve el carrito en el instante marcado con P.`,
      dado: enS ? 's' : 'v', marcas: [{ t: tP, mag: enS ? 's' : 'v', nombre: 'P' }],
      opciones: textos.map((texto, k) => ({ texto, correcta: k === real, pista: k === real ? undefined : pista(k) })),
      explicacion: enS
        ? (real === 2 ? `En P la ${S}–${T} es horizontal: la pendiente (${V}) es cero y el carrito no se mueve.`
          : `En P la ${S}–${T} ${v > 0 ? 'sube' : 'baja'}: la pendiente es ${V} = ${fmt(v)} m s⁻¹, ${v > 0 ? 'positiva' : 'negativa'}. El carrito va hacia ${lado(v)}.`)
        : (real === 2 ? `En P, ${V} = 0: el carrito no se mueve.`
          : `En P, ${V} = ${fmt(v)} m s⁻¹, ${v > 0 ? 'positiva (por encima del eje)' : 'negativa (por debajo del eje)'}. El carrito va hacia ${lado(v)}.`)
    };
  }

  function ejDescripcion(r) {
    const def = movAleatorio(r, { nMin: 2, nMax: 3, conAceleracion: true }); if (!def) return null;
    const m = crear(def), ts = m.tramos.map(tr => [tr.v0, vFinal(tr), tr.a]);
    const correcta = unir(ts.map(x => describirTramo(x[0], x[1], x[2])));
    const comoSt = unir(ts.map(x => x[2] === 0 ? 'está en reposo' : `se mueve hacia ${lado(x[2])} con velocidad constante`));
    const cand = [
      { texto: comoSt, pista: `Esa descripción lee la gráfica como si fuera ${S}–${T}. En una ${V}–${T}, la altura es la velocidad: una línea horizontal fuera del eje es velocidad constante, no reposo.` },
      { texto: unir(ts.map(x => describirTramo(-x[0], -x[1], -x[2]))), pista: `Revisa el sentido: ${V} positiva (por encima del eje) significa hacia la derecha.` },
      { texto: unir(ts.map(x => describirTramo(x[1], x[0], -x[2]))), pista: `Compara la rapidez (el valor de ${V} sin signo) al principio y al final de cada tramo: ¿aumenta o disminuye?` },
      { texto: unir(ts.slice().reverse().map(x => describirTramo(x[0], x[1], x[2]))), pista: 'Lee la gráfica de izquierda a derecha: el tiempo avanza hacia la derecha.' },
      { texto: unir(ts.map(x => describirTramo(-x[1], -x[0], x[2]))), pista: `Revisa el sentido y si la rapidez aumenta o disminuye en cada tramo.` }
    ];
    const elegidas = [];
    for (const c of cand) {
      if (c.texto === correcta || elegidas.some(e => e.texto === c.texto)) continue;
      elegidas.push(c); if (elegidas.length === 3) break;
    }
    if (elegidas.length < 3) return null;
    return {
      id: 'descripcion', tipo: 'texto', def, titulo: 'Describir el movimiento',
      enunciado: `La gráfica muestra la velocidad ${V} de un carrito. El sentido positivo es hacia la derecha. <b>Identifique</b> la descripción correcta del movimiento.`,
      dado: 'v',
      opciones: barajar(r, [{ texto: correcta, correcta: true }].concat(elegidas.map(c => ({ texto: c.texto, correcta: false, pista: c.pista })))),
      explicacion: listaHtml(m.tramos.map((tr, i) => {
        const frase = describirTramo(tr.v0, vFinal(tr), tr.a);
        return `Tramo ${LETRAS[i]} (${intervalo(tr)}): ${V} pasa de ${fmt(tr.v0)} a ${fmt(vFinal(tr))} m s⁻¹ → ${frase}.`;
      }))
    };
  }

  // ---------- Ejercicios: dibujar ----------
  function ejDibujar(r) {
    const def = movAleatorio(r, { nMin: 2, nMax: 3, conAceleracion: true }); if (!def) return null;
    const m = crear(def);
    const tiempos = [0].concat(m.tramos.map(tr => tr.t1));
    const objetivo = [def.u].concat(m.tramos.map(tr => vFinal(tr)));
    if (objetivo.every(v => v === 0) || objetivo.some(v => !Number.isInteger(v))) return null;   // puntos sobre la cuadrícula
    return {
      id: 'dibujar', tipo: 'dibujar', modo: 'nodos', def, titulo: 'Dibujar la v–t',
      enunciado: `Un carrito parte con velocidad ${U} = ${fmt(def.u)} m s⁻¹ y se mueve así:` +
        listaHtml(m.tramos.map((tr, i) => `Tramo ${LETRAS[i]} (${intervalo(tr)}): ${A} = ${fmt(tr.a)} m s⁻²`)) +
        `<b>Dibuje</b> la gráfica velocidad–tiempo: arrastra cada punto hasta su lugar.`,
      tiempos, objetivo, inicial: tiempos.map(() => 0), paso: 1, vMax: 6,
      explicacion: `En cada tramo, Δ${V} = ${A} Δ${T}.` + listaHtml(m.tramos.map((tr, i) =>
        `Tramo ${LETRAS[i]}: Δ${V} = ${tr.a < 0 ? '(' + fmt(tr.a) + ')' : fmt(tr.a)} × ${fmt(tr.t1 - tr.t0)} = ${conSigno(tr.a * (tr.t1 - tr.t0))} m s⁻¹ → ${V} = ${fmt(vFinal(tr))} m s⁻¹ en ${T} = ${fmt(tr.t1)} s.`))
    };
  }

  function ejIgualar(r) {
    const def = movAleatorio(r, { nMin: 2, nMax: 3, saltos: true }); if (!def) return null;
    const m = crear(def);
    return {
      id: 'igualar', tipo: 'dibujar', modo: 'niveles', def, titulo: 'Desafío: iguala la gráfica',
      enunciado: `La gráfica ${S}–${T} gris es el movimiento que hay que conseguir. El carrito empieza en ${S} = ${fmt(def.s0)} m y en cada tramo va con velocidad constante. ` +
        `Arrastra la velocidad de cada tramo en la gráfica ${V}–${T} hasta que tu ${S}–${T} (azul) coincida con la gris.`,
      tramos: m.tramos.map(tr => ({ t0: tr.t0, t1: tr.t1 })), objetivo: m.tramos.map(tr => tr.v0),
      inicial: m.tramos.map(() => 0), paso: 1, vMax: 5,
      explicacion: `En cada tramo, ${V} es la pendiente de la ${S}–${T}.` + listaHtml(m.tramos.map((tr, i) =>
        `Tramo ${LETRAS[i]}: ${V} = Δ${S}/Δ${T} = (${fmt(m.s(tr.t1))} − ${tr.s0 < 0 ? '(' + fmt(tr.s0) + ')' : fmt(tr.s0)})/${fmt(tr.t1 - tr.t0)} = ${fmt(tr.v0)} m s⁻¹.`))
    };
  }

  // Movimiento que resulta de lo que el alumno ha dibujado
  function movDibujado(ej, valores) {
    if (ej.modo === 'niveles') {
      return new Movimiento(ej.def.s0, valores[0], ej.tramos.map((tr, i) => ({ duracion: tr.t1 - tr.t0, a: 0, v: valores[i] })));
    }
    const tramos = [];
    for (let i = 0; i + 1 < ej.tiempos.length; i++) {
      const D = ej.tiempos[i + 1] - ej.tiempos[i];
      tramos.push({ duracion: D, a: (valores[i + 1] - valores[i]) / D });
    }
    return new Movimiento(ej.def.s0, valores[0], tramos);
  }
  // Corrección de un dibujo: qué puntos están mal y una pista
  function corregirDibujo(ej, valores) {
    const mal = valores.map((v, i) => Math.abs(v - ej.objetivo[i]) > 1e-9);
    if (!mal.some(x => x)) return { ok: true, mal };
    let pista;
    const i = mal.indexOf(true);
    if (ej.modo === 'niveles') {
      pista = `Mira el tramo ${LETRAS[i]}: ¿la ${S}–${T} gris sube o baja?, ¿cuántos metros cambia ${S} en cada segundo?`;
    } else {
      const dif = valores.map((v, k) => v - ej.objetivo[k]);
      if (dif.every(d => Math.abs(d - dif[0]) < 1e-9)) pista = `La forma es correcta, pero la gráfica debe empezar en ${U}: revisa la velocidad en ${T} = 0.`;
      else if (i === 0) pista = `En ${T} = 0 la velocidad es ${U}.`;
      else pista = `Revisa el punto en ${T} = ${fmt(ej.tiempos[i])} s: en el tramo ${LETRAS[i - 1]}, Δ${V} = ${A} Δ${T}.`;
    }
    return { ok: false, mal, pista };
  }

  // Corrección de una respuesta numérica con unidad
  function corregirNumero(ej, valor, unidad) {
    if (!isFinite(valor)) return { ok: false, pista: 'Escribe un número (puedes usar coma decimal y signo menos).' };
    if (Math.abs(valor - ej.respuesta) <= ej.tolerancia) {
      return unidad === ej.unidad ? { ok: true } : { ok: false, pista: 'El número es correcto. Revisa la unidad.' };
    }
    for (const p of ej.pistas) if (Math.abs(valor - p.valor) <= Math.max(0.02, 0.01 * Math.abs(p.valor))) return { ok: false, pista: p.texto };
    return { ok: false, pista: ej.pistaGeneral };
  }

  // ---------- Catálogo ----------
  const TIPOS = {
    'mov-vt': (r) => ejStVt(r, true),
    'st-vt': (r) => ejStVt(r, false),
    'vt-at': ejVtAt,
    'vt-st': ejVtSt,
    'desplazamiento': (r) => ejArea(r, false),
    'distancia': (r) => ejArea(r, true),
    'pendiente-a': (r) => ejPendiente(r, false),
    'pendiente-v': (r) => ejPendiente(r, true),
    'rapidez': ejRapidez,
    'sentido': ejSentido,
    'descripcion': ejDescripcion,
    'dibujar': ejDibujar,
    'igualar': ejIgualar
  };
  const GRUPOS = {
    graficas: ['st-vt', 'vt-at', 'vt-st', 'mov-vt'],
    calcular: ['desplazamiento', 'distancia', 'pendiente-a', 'pendiente-v'],
    interpretar: ['rapidez', 'sentido', 'descripcion'],
    dibujar: ['dibujar', 'igualar']
  };
  GRUPOS.todos = [].concat(GRUPOS.graficas, GRUPOS.calcular, GRUPOS.interpretar, GRUPOS.dibujar);

  function generar(r, id) {
    for (let i = 0; i < 300; i++) { const ej = TIPOS[id](r); if (ej) return ej; }
    throw new Error('No se pudo generar un ejercicio de tipo ' + id);
  }

  const api = { TIPOS, GRUPOS, generar, crear, rngSemilla, muestra, movDibujado, corregirDibujo, corregirNumero, fmt, elegir };
  if (enNode) module.exports = api; else raiz.A1Ejercicios = api;
})(this);
