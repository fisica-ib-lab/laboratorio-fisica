// Verificación de los niveles de «Diagramas de cuerpo libre y segunda ley» (A.2): node pruebas/verificar-niveles-fuerzas.js
// Comprueba que cada situación hace lo que dicen las preguntas y que cada respuesta numérica coincide con lo que
// mide la propia simulación (no solo con la fórmula), también con otros valores de los deslizadores.

const D = require('../comun/dinamica.js');
const { SIT, NIVELES } = require('../sims/A.2-fuerzas/niveles.js');
const G = D.G, RAD = D.RAD;
let fallos = 0, comprobaciones = 0;
function ok(cond, msg) { comprobaciones++; if (!cond) { fallos++; console.log('FALLO:', msg); } }
const cerca = (a, b, tol) => Math.abs(a - b) <= tol * Math.max(1e-9, Math.abs(b)) || Math.abs(a - b) < 1e-9;
const fisica = (esc, p) => esc === 'ascensor' ? { m: p.m, modo: p.modo, a: p.modo === 'constante' ? p.aC : p.aV } : p;
const crear = (id, cambios) => { const s = SIT[id]; const p = Object.assign({}, s.par, cambios || {}); return { p, mod: D.crear(s.escena, fisica(s.escena, p)) }; };
const muestrear = (mod, f) => { const r = []; for (let i = 0; i <= 400; i++) r.push(f(mod.estado(mod.T * i / 400), mod.T * i / 400)); return r; };

// ---------- Estructura ----------
for (const [i, niv] of NIVELES.entries()) for (const [j, q] of niv.preguntas.entries()) {
  const id = `nivel ${i + 1} pregunta ${j + 1}`;
  ok(SIT[q.sit], `${id}: situación «${q.sit}» inexistente`);
  if (q.tipo === 'opcion') {
    ok(q.opciones.filter(o => o[1]).length === 1, `${id}: debe haber exactamente una opción correcta`);
    ok(q.opciones.every(o => o[1] || o[2]), `${id}: falta el comentario de una opción incorrecta`);
    ok(!!q.explicacion, `${id}: falta la explicación`);
  } else {
    ok(typeof q.respuesta === 'function' && typeof q.resolucion === 'function' && q.pista, `${id}: faltan respuesta, resolución o pista`);
    const v = q.respuesta(SIT[q.sit].par);
    ok(isFinite(v), `${id}: respuesta no finita`);
    ok(q.resolucion(SIT[q.sit].par).includes('<b>'), `${id}: la resolución no destaca el resultado`);
  }
}
const preg = (niv, j) => NIVELES[niv - 1].preguntas[j - 1];

// ---------- Nivel 1 ----------
{ const { mod } = crear('riel');
  ok(muestrear(mod, e => Math.abs(e.v - 0.5) < 1e-12 && e.a === 0).every(Boolean), 'riel: la velocidad no es constante'); }
for (const m of [1, 2, 3]) {
  const F = 0.3 * m * G, { p, mod } = crear('velConst', { m, F });
  ok(muestrear(mod, e => Math.abs(e.v - 1) < 1e-9 && Math.abs(e.a) < 1e-9).every(Boolean), `velConst m=${m}: no es velocidad constante`);
  const e = mod.estado(1);
  ok(cerca(preg(1, 3).respuesta(p), e.lecturas.Ff / e.lecturas.FN, 1e-9), `velConst m=${m}: μd de la respuesta ≠ F_f/F_N medido`);
  ok(cerca(e.lecturas.dinamometro, e.lecturas.Ff, 1e-9), `velConst: F_H ≠ F_f`);
}
{ const { mod } = crear('ascSube');
  ok(cerca(mod.estado(2.5).lecturas.balanza, 60 * G, 1e-12), 'ascensor: a velocidad constante no marca mg'); }
for (const [a1, a2, m] of [[30, 50, 1], [20, 70, 2.5], [45, 45, 0.5]]) {
  const { p, mod } = crear('cuerdas', { ang1: a1, ang2: a2, m }), L = mod.estado(0).lecturas;
  ok(cerca(preg(1, 6).respuesta(p), L.T1 * Math.sin(a1 * RAD) + L.T2 * Math.sin(a2 * RAD), 1e-9), `cuerdas ${a1}/${a2}: respuesta ≠ suma de componentes verticales`);
}
{ const { mod } = crear('cuerdas'), L = mod.estado(0).lecturas; ok(L.T2 > L.T1, 'cuerdas: la cuerda 2 debía tener más tensión'); }
{ const { mod } = crear('terminal');
  ok(mod.estado(0).a < G && mod.estado(0).a > 0.8 * G, 'esfera: aceleración inicial');
  const e = mod.estado(mod.T); ok(cerca(e.lecturas.Fd + e.lecturas.Fb, e.lecturas.peso, 1e-6), 'esfera: F_d + F_b ≠ F_g al final'); }

// ---------- Nivel 2 ----------
for (const F of [3, 5, 9]) {
  const { p, mod } = crear('pequena', { F }), e = mod.estado(2);
  ok(e.v === 0 && mod.estado(mod.T).x === 0, `pequeña F=${F}: se movió`);
  ok(cerca(preg(2, 1).respuesta(p), e.lecturas.Ff, 1e-9), `pequeña F=${F}: respuesta ≠ F_f medido`);
}
for (const [m, mus, mud] of [[2, 0.5, 0.3], [1, 0.6, 0.4], [3, 0.3, 0.2]]) {
  const { p, mod } = crear('rampa', { m, mus, mud });
  const fmax = Math.max(...muestrear(mod, e => e.lecturas.Ff));
  ok(cerca(preg(2, 4).respuesta(p), fmax / (m * G), 0.01), `rampa m=${m}: μs medido ${fmax / (m * G)} ≠ ${p.mus}`);
  if (mus * m * G < 12 && 12 / p.F * D.RAMPA < mod.T) {
    const t12 = 12 / p.F * D.RAMPA, e = mod.estado(t12);
    ok(Math.abs(e.lecturas.dinamometro - 12) < 1e-9 && e.v > 0, `rampa m=${m}: a los 12 N no desliza`);
    ok(cerca(preg(2, 5).respuesta(p), e.a, 1e-6), `rampa m=${m}: a(12 N) = ${e.a} ≠ ${preg(2, 5).respuesta(p)}`);
  }
}
{ const { p, mod } = crear('soltar');
  ok(mod.T === 5 && !mod.fin, 'soltar: el bloque llega al final de la mesa');
  const vS = mod.estado(D.SOLTAR).v, tPara = D.SOLTAR + vS / (p.mud * G);
  ok(vS > 0 && tPara < 4.5, 'soltar: no arranca o no se detiene a tiempo');
  ok(cerca(preg(2, 7).respuesta(p), mod.estado((D.SOLTAR + tPara) / 2).a, 1e-6), 'soltar: aceleración de frenado');
  ok(mod.estado(mod.T).v === 0 && mod.estado(mod.T).lecturas.Ff === 0, 'soltar: al final debe estar quieto y sin rozamiento'); }

// ---------- Nivel 3 ----------
{ const { mod } = crear('planoQuieto'), e = mod.estado(1);
  ok(e.v === 0 && mod.estado(mod.T).x === mod.x0, 'plano 20°: debía quedarse quieto');
  ok(cerca(e.lecturas.FN, G * Math.cos(20 * RAD), 1e-12), 'plano: normal');
  const Ff = e.cuerpos[0].fuerzas.find(f => f.tipo === 'Ff'); ok(Ff.x > 0 && Ff.y > 0, 'plano: el rozamiento estático debía apuntar hacia arriba del plano'); }
for (const mus of [0.5, 0.3, 0.8]) {
  const p0 = Object.assign({}, SIT.planoLimite.par, { mus });
  // primer ángulo entero en que desliza = el ángulo límite redondeado hacia arriba
  let primero = null;
  for (let ang = 1; ang <= 60; ang++) { const mod = D.crear('plano', Object.assign({}, p0, { ang })); if (mod.estado(1).v !== 0) { primero = ang; break; } }
  const lim = preg(3, 3).respuesta(p0);
  ok(primero === Math.ceil(lim - 1e-9) || (Number.isInteger(lim) && primero === lim + 1), `ángulo límite μs=${mus}: desliza desde ${primero}°, respuesta ${lim}`);
  ok(Math.abs(primero - lim) / lim <= (preg(3, 3).tol || 0.02) + 1e-9 || mus !== 0.5, `ángulo límite μs=${mus}: el ángulo entero observado no se acepta`);
  ok(D.crear('plano', Object.assign({}, p0, { ang: 15 })).estado(1).v === 0 || mus < Math.tan(15 * RAD), 'ángulo límite: la situación inicial debía estar quieta');
}
{ const { mod } = crear('planoSube'), e = mod.estado(0.1);
  const Ff = e.cuerpos[0].fuerzas.find(f => f.tipo === 'Ff'); ok(Ff.x < 0, 'plano subiendo: el rozamiento debía apuntar hacia abajo');
  const vs = muestrear(mod, e => e.v); ok(vs.some(x => x < -0.1), 'plano subiendo: no vuelve a bajar');
  const aSub = mod.estado(0.1).a, aBaj = mod.estado(mod.T - 0.05).a; ok(Math.abs(aSub) > Math.abs(aBaj), 'plano: |a| subiendo debe ser mayor'); }
for (const [F, ang, m] of [[10, 30, 2], [8, 45, 1.5]]) {
  const { p, mod } = crear('oblicua', { F, ang, m });
  ok(cerca(preg(3, 6).respuesta(p), mod.estado(0.2).lecturas.FN, 1e-12), `oblicua F=${F}: normal`);
}
for (const aV of [2, 1, 3]) {
  const { p, mod } = crear('ascSube', { aV });
  ok(mod.estado(0.5).lecturas.balanza > p.m * G, 'ascensor: al arrancar debe marcar más que mg');
  ok(cerca(preg(3, 9).respuesta(p), mod.estado(4.2).lecturas.balanza, 1e-12), `ascensor aV=${aV}: lectura al frenar`);
}
{ const { mod } = crear('caidaLibre'); ok(Math.abs(mod.estado(1).lecturas.balanza) < 1e-9 && cerca(mod.estado(1).lecturas.peso, 60 * G, 1e-12), 'caída libre'); }

// ---------- Nivel 4 ----------
for (const [m1, m2] of [[0.4, 0.6], [0.2, 1.5], [1, 0.3]]) {
  const { p, mod } = crear('atwood', { m1, m2 }), e = mod.estado(0.1);
  ok(cerca(preg(4, 1).respuesta(p), e.a, 1e-6), `Atwood ${m1}/${m2}: aceleración`);
  if (m2 > m1) ok(e.lecturas.FT > m1 * G && e.lecturas.FT < m2 * G && e.lecturas.polea < (m1 + m2) * G, `Atwood ${m1}/${m2}: tensión entre pesos`);
}
{ const { mod } = crear('atwoodIgual'); ok(muestrear(mod, e => e.v === 0).every(Boolean), 'Atwood iguales: se movió'); }
for (const [m1, m2, mud] of [[1, 0.5, 0.2], [0.5, 1, 0.4], [2, 1, 0.1]]) {
  const { p, mod } = crear('mesa', { m1, m2, mud, mus: Math.max(mud, 0.3) }), e = mod.estado(0.2);
  ok(e.v > 0, `mesa ${m1}/${m2}: no desliza`);
  ok(cerca(preg(4, 5).respuesta(p), e.lecturas.FT, 1e-6), `mesa ${m1}/${m2}: tensión ${e.lecturas.FT} ≠ ${preg(4, 5).respuesta(p)}`);
  ok(e.lecturas.FT < m2 * G, 'mesa: F_T debe ser menor que m₂g');
}
{ const { p, mod } = crear('mesaQuieta');
  ok(mod.estado(mod.T).x === 0, 'mesa quieta: se movió');
  ok(cerca(preg(4, 7).respuesta(p), mod.estado(1).lecturas.Ff, 1e-9), 'mesa quieta: rozamiento');
  const lim = preg(4, 8).respuesta(p);
  ok(D.crear('mesa', Object.assign({}, p, { m2: lim })).estado(1).v === 0, 'mesa: con la masa límite debía quedarse quieto');
  ok(D.crear('mesa', Object.assign({}, p, { m2: lim + 0.05 })).estado(1).v > 0, 'mesa: con 0,05 kg más debía arrancar'); }

console.log(`${comprobaciones} comprobaciones · ${fallos} fallos`);
process.exit(fallos ? 1 : 0);
