// Verificación de «Plantear problemas» y «Practicar» de «Ecuaciones del movimiento y caída libre» (A.1):
// node pruebas/verificar-problemas-caida.js
// 1000 problemas al azar de cada tipo: los cinco valores (s, u, v, a, t) cumplen las cuatro ecuaciones del Cuadernillo,
// la respuesta coincide con lo que mide el modelo (comun/proyectil.js), hay al menos una ecuación válida y cada una
// de ellas, despejada, da la respuesta; los datos marcados son coherentes con el enunciado y la resolución muestra el resultado.

const PF = require('../comun/proyectil.js');
const P = require('../sims/A.1-caida-libre/problemas.js');
let fallos = 0, comprobaciones = 0;
function ok(cond, msg) { comprobaciones++; if (!cond) { fallos++; if (fallos <= 40) console.log('FALLO:', msg); } }
const cerca = (a, b, tol) => Math.abs(a - b) <= tol * Math.abs(b) + 1e-9;
const texto = (e) => [e.texto, e.resolucion, e.pista, e.explicacion, ...(e.opciones || []).map(o => o[0] + (o[2] || '')), ...Object.values(e.avisos || {})].join(' ');

// Despeja la incógnita de la ecuación i con los demás valores de «c» (raíz elegida según el problema)
function despejar(i, inc, c, raiz) {
  const { s, u, v, a, t } = c;
  const elegir = (r) => { r = r.filter(isFinite); if (raiz === 'negativa') return Math.min(...r); if (raiz === 'mayor') return Math.max(...r); if (raiz === 'positiva') return Math.max(...r); return r.length === 1 ? r[0] : r.find(x => cerca(x, c[inc], 1e-6)); };
  const cuad = (A, B, C) => { const d = B * B - 4 * A * C; if (Math.abs(A) < 1e-12) return [-C / B]; return d < 0 ? [] : [(-B + Math.sqrt(d)) / (2 * A), (-B - Math.sqrt(d)) / (2 * A)]; };
  switch (i) {
    case 0: return { s: (u + v) * t / 2, u: 2 * s / t - v, v: 2 * s / t - u, t: 2 * s / (u + v) }[inc];
    case 1: return { v: u + a * t, u: v - a * t, a: (v - u) / t, t: (v - u) / a }[inc];
    case 2: return inc === 't' ? elegir(cuad(0.5 * a, u, -s).filter(x => x > 0)) : { s: u * t + 0.5 * a * t * t, u: (s - 0.5 * a * t * t) / t, a: 2 * (s - u * t) / (t * t) }[inc];
    case 3: return inc === 'v' ? elegir([Math.sqrt(u * u + 2 * a * s), -Math.sqrt(u * u + 2 * a * s)]) : inc === 'u' ? elegir([Math.sqrt(v * v - 2 * a * s), -Math.sqrt(v * v - 2 * a * s)]) : { a: (v * v - u * u) / (2 * s), s: (v * v - u * u) / (2 * a) }[inc];
  }
}

for (const tipo of P.LISTA) {
  ok(P.GRUPO_DE[tipo], `${tipo}: sin grupo`);
  for (let k = 0; k < 1000; k++) {
    const e = P.generar(tipo), id = `${tipo} #${k}: ${e.texto.replace(/<[^>]+>/g, '').slice(0, 100)}`;
    ok(!/NaN|undefined|Infinity|null/.test(texto(e)), `${id}: texto con NaN/undefined`);
    ok(e.texto.toLowerCase().includes(e.termino.toLowerCase()), `${id}: el enunciado no usa «${e.termino}»`);
    ok(e.grupo === P.GRUPO_DE[tipo], `${id}: grupo`);
    if (e.opciones) { ok(e.opciones.filter(o => o[1]).length === 1 && e.opciones.every(o => o[1] || o[2]) && e.explicacion, `${id}: opciones mal formadas`); continue; }
    const medido = e.medir(PF);
    ok(cerca(medido, e.respuesta, e.tolMedir || 0.005), `${id}: el modelo mide ${medido}, la respuesta es ${e.respuesta}`);
    ok(e.resolucion.includes('<b>' + P.c3(e.respuesta)), `${id}: la resolución no muestra el resultado ${P.c3(e.respuesta)}`);
    ok(Math.abs(Number(P.c3(e.respuesta).replace('−', '-').replace(',', '.')) - e.respuesta) <= e.tol * Math.abs(e.respuesta), `${id}: el resultado mostrado no se aceptaría`);
    if (!e.papeles) continue;
    // plantear: valores completos, papeles y ecuaciones
    ok(P.residuos(e.completo).every(r => r < 1e-9), `${id}: los cinco valores no cumplen las ecuaciones ${P.residuos(e.completo)}`);
    ok(P.MAG.filter(m => e.papeles[m] === 'incognita').length === 1 && e.papeles[e.incognita] === 'incognita', `${id}: incógnita`);
    ok(P.MAG.filter(m => e.papeles[m] === 'dato').length === 3, `${id}: debe haber tres datos`);
    ok(e.validas.length >= 1, `${id}: ninguna ecuación sirve`);
    for (const i of e.validas) {
      const r = despejar(i, e.incognita, e.completo, e.raiz);
      ok(cerca(r, e.respuesta, 1e-9), `${id}: la ecuación ${i} da ${r} y no ${e.respuesta}`);
    }
    // cada dato que se nombra con su número en el enunciado aparece con su valor absoluto
    for (const m of P.MAG) if (e.papeles[m] === 'dato' && e.completo[m] !== 0 && m !== 'a') ok(e.texto.includes(P.c3(Math.abs(e.completo[m]))) || e.texto.includes(P.n(Math.abs(e.completo[m]), 1)), `${id}: el dato ${m} = ${e.completo[m]} no está en el enunciado`);
    for (const m of P.MAG) if (e.papeles[m] !== 'incognita') ok(!!(e.avisos || {})[m] || m === 'a' && e.papeles.a === 'dato' && e.avisos.a, `${id}: falta el aviso de ${m}`);
  }
}
for (const [g] of P.GRUPOS) for (let i = 0; i < 40; i++) { const e = P.aleatorio(P.LISTA, g, null); ok(g === 'todos' || e.grupo === g, `grupo ${g}: generó ${e.id}`); }
for (let i = 0; i < 200; i++) ok(P.LISTA_PLANTEAR.includes(P.aleatorio(P.LISTA_PLANTEAR, 'todos', null).id), 'plantear: tipo fuera de la lista');

console.log(`${comprobaciones} comprobaciones · ${fallos} fallos`);
process.exit(fallos ? 1 : 0);
