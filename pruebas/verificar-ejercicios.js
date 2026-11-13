// Verificación de los ejercicios de Practicar: node pruebas/verificar-ejercicios.js
// 1000 ejercicios de cada tipo. Cada respuesta correcta se vuelve a calcular por un camino independiente
// (integración y derivación numéricas) y se comprueba que hay una sola opción correcta, que las opciones
// son distintas entre sí, que las pistas no coinciden con la respuesta y que el carrito no sale de la pista.

const E = require('../sims/A.1-tres-graficas/ejercicios.js');
const { Movimiento } = require('../comun/cinematica.js');

let fallos = 0, comprobaciones = 0;
function ok(cond, msg) { comprobaciones++; if (!cond) { fallos++; if (fallos <= 25) console.log('FALLO:', msg); } }
const cerca = (a, b, tol) => Math.abs(a - b) <= tol * Math.max(1, Math.abs(a), Math.abs(b));

// integral numérica por tramos (puntos medios dentro de cada tramo, para no cruzar saltos)
function integrar(m, f) {
  let total = 0;
  for (const tr of m.tramos) {
    const n = 400, h = (tr.t1 - tr.t0) / n;
    for (let i = 0; i < n; i++) total += f(tr.t0 + (i + 0.5) * h) * h;
  }
  return total;
}
function valorEn(pts, t) {
  for (let i = 0; i + 1 < pts.length; i++) {
    const [t1, y1] = pts[i], [t2, y2] = pts[i + 1];
    if (t2 > t1 && t >= t1 && t <= t2) return y1 + (y2 - y1) * (t - t1) / (t2 - t1);
  }
  return pts[pts.length - 1][1];
}

const N = 1000, cuenta = {};
for (const id of E.GRUPOS.todos) {
  const r = E.rngSemilla(20261113 + id.length * 7919 + id.charCodeAt(0));
  cuenta[id] = 0;
  for (let k = 0; k < N; k++) {
    const ej = E.generar(r, id), m = E.crear(ej.def), Tf = m.duracion, n = `${id} #${k}`;
    cuenta[id]++;
    ok(ej.id === id && ej.titulo && ej.enunciado && ej.explicacion, `${n}: campos`);
    ok(!/undefined|NaN|Infinity/.test(ej.enunciado + ej.explicacion), `${n}: texto con valores vacíos`);
    ok(Tf <= 10 + 1e-9 && Tf >= 2, `${n}: duración ${Tf}`);
    const [mn, mx] = m.rangoS();
    ok(mn >= -30 && mx <= 30, `${n}: fuera de la pista (${mn}, ${mx})`);

    if (ej.tipo === 'grafica') {
      ok(ej.opciones.length === 4 && ej.opciones.filter(o => o.correcta).length === 1, `${n}: opciones`);
      const bien = ej.opciones.find(o => o.correcta);
      // la opción correcta coincide con el movimiento en 60 instantes
      for (let i = 0; i < 60; i++) {
        const t = Tf * (i + 0.5) / 60;
        const real = ej.magOpc === 's' ? m.s(t) : ej.magOpc === 'v' ? m.v(t) : m.a(t);
        const lejos = m.tramos.every(tr => Math.abs(t - tr.t0) > 1e-6);
        // la s–t se dibuja con 40 segmentos por tramo: el error de dibujo es menor que 5 mm
        if (lejos) ok(Math.abs(valorEn(bien.puntos, t) - real) <= (ej.magOpc === 's' ? 5e-3 : 1e-9), `${n}: opción correcta ≠ movimiento en t=${t}`);
      }
      // comprobación independiente de la relación entre gráficas
      if (ej.magOpc === 'v' || ej.magOpc === 'a') {
        for (let i = 0; i < 20; i++) {
          const t = Tf * (i + 0.31) / 20, e = 1e-5;
          if (!m.tramos.every(tr => Math.abs(t - tr.t0) > 1e-3 && Math.abs(t - tr.t1) > 1e-3)) continue;
          const deriv = ej.magOpc === 'v' ? (m.s(t + e) - m.s(t - e)) / (2 * e) : (m.v(t + e) - m.v(t - e)) / (2 * e);
          ok(cerca(valorEn(bien.puntos, t), deriv, 1e-5), `${n}: la opción correcta no es la pendiente`);
        }
      } else {
        ok(cerca(valorEn(bien.puntos, Tf) - valorEn(bien.puntos, 0), integrar(m, t => m.v(t)), 1e-6), `${n}: Δs ≠ área v–t`);
      }
      // distractores distintos de la correcta y con pista
      for (const o of ej.opciones) {
        if (o.correcta) continue;
        ok(typeof o.pista === 'string' && o.pista.length > 10, `${n}: distractor sin pista`);
        const base = ej.magOpc === 's' ? ej.def.s0 : 0;
        let mxd = 0; const rango = Math.max(...[o, bien].map(q => Math.max(...q.puntos.map(p => Math.abs(p[1] - base)))));
        for (let i = 0; i < 80; i++) { const t = Tf * (i + 0.37) / 80; mxd = Math.max(mxd, Math.abs(valorEn(o.puntos, t) - valorEn(bien.puntos, t))); }
        ok(mxd > 0.2 * rango, `${n}: distractor casi igual a la correcta (${mxd} de ${rango})`);
      }
    }

    if (ej.tipo === 'numero') {
      let real;
      if (id === 'desplazamiento') real = integrar(m, t => m.v(t));
      else if (id === 'distancia') real = integrar(m, t => Math.abs(m.v(t)));
      else {
        const tr = m.tramos[ej.tramo], t = (tr.t0 + tr.t1) / 2, e = 1e-5;
        real = id === 'pendiente-a' ? (m.v(t + e) - m.v(t - e)) / (2 * e) : (m.s(t + e) - m.s(t - e)) / (2 * e);
        ok(Math.abs(real) > 1e-6, `${n}: pendiente nula`);
      }
      ok(cerca(ej.respuesta, real, 2e-5), `${n}: respuesta ${ej.respuesta} ≠ cálculo ${real}`);
      ok(E.corregirNumero(ej, ej.respuesta, ej.unidad).ok === true, `${n}: no acepta la respuesta correcta`);
      ok(E.corregirNumero(ej, ej.respuesta, ej.unidad === 'm' ? 's' : 'm').ok === false, `${n}: acepta una unidad equivocada`);
      ok(E.corregirNumero(ej, ej.respuesta + 3 * ej.tolerancia + 0.2, ej.unidad).ok === false, `${n}: acepta un valor equivocado`);
      for (const p of ej.pistas) {
        ok(Math.abs(p.valor - ej.respuesta) > ej.tolerancia, `${n}: una pista coincide con la respuesta`);
        const c = E.corregirNumero(ej, p.valor, ej.unidad);
        ok(c.ok === false && c.pista === p.texto, `${n}: pista de error no reconocida`);
      }
      if (id === 'distancia') ok(ej.respuesta - Math.abs(m.desplazamiento(Tf)) > 1e-9, `${n}: distancia sin cambio de sentido`);
    }

    if (ej.tipo === 'texto') {
      ok(ej.opciones.filter(o => o.correcta).length === 1, `${n}: una sola correcta`);
      ok(new Set(ej.opciones.map(o => o.texto)).size === ej.opciones.length, `${n}: opciones repetidas`);
      ok(ej.opciones.every(o => o.correcta || (o.pista && o.pista.length > 10)), `${n}: opción sin pista`);
      const i = ej.opciones.findIndex(o => o.correcta);
      if (id === 'rapidez' || id === 'sentido') {
        const t = ej.marcas[0].t, e = 1e-5;
        ok(m.tramos.every(tr => Math.abs(t - tr.t0) > 1e-3 && Math.abs(t - tr.t1) > 1e-3), `${n}: P en un límite de tramo`);
        const v = (m.s(t + e) - m.s(t - e)) / (2 * e);                              // pendiente numérica de s
        const dRap = (Math.abs(m.v(t + e)) - Math.abs(m.v(t - e))) / (2 * e);        // cambio numérico de la rapidez
        let esperado;
        if (id === 'rapidez') esperado = Math.abs(v) < 1e-6 && Math.abs(dRap) < 1e-6 ? 3 : Math.abs(dRap) < 1e-6 ? 2 : dRap > 0 ? 0 : 1;
        else esperado = v > 1e-6 ? 0 : v < -1e-6 ? 1 : 2;
        ok(i === esperado, `${n}: correcta ${i}, esperada ${esperado}`);
        if (Math.abs(v) < 1e-6) ok(Math.abs(dRap) < 1e-6, `${n}: P en un instante de cambio de sentido`);
      }
    }

    if (ej.tipo === 'dibujar') {
      const hecho = E.movDibujado(ej, ej.objetivo);
      for (let i = 0; i <= 50; i++) { const t = Tf * i / 50; ok(cerca(hecho.s(t), m.s(t), 1e-9), `${n}: el objetivo no reproduce el movimiento`); }
      ok(E.corregirDibujo(ej, ej.objetivo).ok === true, `${n}: no acepta el dibujo correcto`);
      ok(E.corregirDibujo(ej, ej.inicial).ok === false, `${n}: acepta el dibujo inicial`);
      const otro = ej.objetivo.slice(); otro[otro.length - 1] += ej.paso;
      const c = E.corregirDibujo(ej, otro);
      ok(c.ok === false && c.mal[otro.length - 1] && typeof c.pista === 'string', `${n}: no detecta un punto mal`);
      ok(ej.objetivo.every(v => Math.abs(v) <= ej.vMax && Math.abs(v / ej.paso - Math.round(v / ej.paso)) < 1e-9), `${n}: objetivo fuera de la cuadrícula`);
    }
  }
}
console.log(Object.entries(cuenta).map(([k, v]) => `${k}: ${v}`).join(' · '));
console.log(`${comprobaciones} comprobaciones · ${fallos} fallos`);
process.exit(fallos ? 1 : 0);
