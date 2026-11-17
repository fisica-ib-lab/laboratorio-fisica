// Verificación de «Diagramas de cuerpo libre y segunda ley» (A.2): node pruebas/verificar-dinamica.js
// Para muchas combinaciones de los deslizadores de las siete escenas se comprueba, con fórmulas analíticas
// independientes del integrador, que:
//   · la suma de las fuerzas sobre cada cuerpo es m·a (segunda ley) en todo instante;
//   · aceleración, tensión, normal, lectura de la balanza y del dinamómetro coinciden con las fórmulas;
//   · el rozamiento estático cumple F_f ≤ μs F_N (y no siempre es igual), el dinámico es μd F_N;
//   · el bloque solo se mueve si la fuerza que lo empuja supera μs F_N, y al frenar se queda quieto (no retrocede);
//   · el ángulo límite del plano es arctan μs; la esfera alcanza v_t = 2r²(ρs − ρf)g / 9η y empieza con a = g(1 − ρf/ρs).

const D = require('../comun/dinamica.js');
const G = D.G, RAD = D.RAD;
let fallos = 0, comprobaciones = 0;
function ok(cond, msg) { comprobaciones++; if (!cond) { fallos++; if (fallos <= 30) console.log('FALLO:', msg); } }
const cerca = (a, b, tol) => Math.abs(a - b) <= tol * Math.max(1, Math.abs(a), Math.abs(b));
const rango = (a, b, p) => { const r = []; for (let x = a; x <= b + 1e-9; x += p) r.push(Math.round(x * 1000) / 1000); return r; };

// Segunda ley en todos los instantes y cuerpos; nada de fuerzas nulas mostradas como flechas
function segundaLey(mod, n) {
  const T = mod.T;
  for (let k = 0; k <= 60; k++) {
    const t = T * k / 60, e = mod.estado(t);
    for (const c of e.cuerpos) {
      let sx = 0, sy = 0;
      for (const f of c.fuerzas) { sx += f.x; sy += f.y; ok(isFinite(f.x) && isFinite(f.y), `${n}: fuerza no finita`); }
      ok(cerca(sx, c.m * c.a.x, 2e-3) && cerca(sy, c.m * c.a.y, 2e-3), `${n} t=${t.toFixed(3)} ${c.id}: ΣF = (${sx.toFixed(4)}, ${sy.toFixed(4)}) ≠ ma = (${(c.m * c.a.x).toFixed(4)}, ${(c.m * c.a.y).toFixed(4)})`);
      const pesos = c.fuerzas.filter(f => f.tipo === 'Fg');
      ok(pesos.length === 1 && cerca(pesos[0].y, -c.m * G, 1e-12), `${n}: el peso no es mg`);
    }
  }
}
// Comprobación de x(t) y v(t) contra aceleración uniforme a partir de t0 (con tolerancia por el paso de integración)
function uniforme(mod, n, a, t0, x0, v0, hasta) {
  for (let k = 0; k <= 20; k++) {
    const t = t0 + (hasta - t0) * k / 20, e = mod.estado(t), d = t - t0;
    ok(cerca(e.v, v0 + a * d, 2e-3), `${n}: v(${t.toFixed(3)}) = ${e.v} ≠ ${v0 + a * d}`);
    ok(cerca(e.x, x0 + v0 * d + 0.5 * a * d * d, 2e-3), `${n}: x(${t.toFixed(3)}) = ${e.x} ≠ ${x0 + v0 * d + 0.5 * a * d * d}`);
  }
}

// ---------- 1. Bloque en la mesa ----------
for (const m of [0.5, 1, 2.5, 5]) for (const mus of [0, 0.2, 0.5, 0.8]) for (const mud of rango(0, mus, 0.1)) for (const ang of [0, 20, 45]) for (const F of [0, 2, 5, 10, 20, 30]) for (const modo of ['constante', 'soltar', 'rampa']) {
  if (F * Math.sin(ang * RAD) > 0.95 * m * G) continue;      // la interfaz no lo permite (el bloque se despegaría)
  const n = `mesa m=${m} μs=${mus} μd=${mud} θ=${ang} F=${F} ${modo}`;
  const mod = D.crear('horizontal', { m, mus, mud, F, ang, modo });
  segundaLey(mod, n);
  const c = Math.cos(ang * RAD), s = Math.sin(ang * RAD), FN = m * G - F * s, Fx = F * c;
  const arranca = Fx > mus * FN + 1e-9;
  if (modo === 'constante') {
    const e = mod.estado(0.3);
    if (!arranca) {
      ok(e.v === 0 && mod.estado(mod.T).x === 0, `${n}: se movió sin superar μs F_N`);
      ok(cerca(e.lecturas.Ff, Fx, 1e-12) && e.lecturas.Ff <= mus * FN + 1e-9, `${n}: F_f estático ${e.lecturas.Ff} ≠ ${Fx}`);
    } else {
      const a = (Fx - mud * FN) / m;
      ok(cerca(e.a, a, 1e-9), `${n}: a = ${e.a} ≠ ${a}`);
      ok(cerca(e.lecturas.Ff, mud * FN, 1e-9), `${n}: F_f dinámico`);
      uniforme(mod, n, a, 0, 0, 0, mod.T);
    }
    ok(cerca(e.lecturas.FN, FN, 1e-12), `${n}: normal ${e.lecturas.FN} ≠ ${FN}`);
    ok(cerca(e.lecturas.alargamiento, F / D.K_DINAMOMETRO, 1e-12), `${n}: alargamiento del resorte`);
  }
  if (modo === 'soltar' && arranca && mod.T > D.SOLTAR + 0.05) {
    // después de soltar frena con a = −μd g y se queda quieto; nunca retrocede
    const e1 = mod.estado(D.SOLTAR), vS = e1.v;
    if (mud > 0) {
      const tPara = D.SOLTAR + vS / (mud * G);
      const ep = mod.estado(Math.min(mod.T, (D.SOLTAR + tPara) / 2));
      ok(cerca(ep.a, -mud * G, 1e-6), `${n}: frenado ${ep.a} ≠ ${-mud * G}`);
      if (tPara < mod.T - 0.05) {
        const ef = mod.estado(mod.T);
        ok(ef.v === 0 && ef.a === 0 && ef.lecturas.Ff === 0, `${n}: después de detenerse sigue con v=${ef.v} a=${ef.a}`);
        ok(cerca(ef.x, e1.x + vS * vS / (2 * mud * G), 3e-3), `${n}: distancia de frenado ${ef.x - e1.x} ≠ ${vS * vS / (2 * mud * G)}`);
      }
    }
    for (let k = 0; k <= 100; k++) ok(mod.estado(mod.T * k / 100).v >= -1e-12, `${n}: retrocede`);
  }
  if (modo === 'rampa' && ang === 0 && F > 0) {
    // en reposo F_f = F mientras F ≤ μs F_N; empieza a deslizar justo cuando F supera μs F_N
    const tArr = mus * m * G / F * D.RAMPA;
    for (let k = 0; k <= 40; k++) {
      const t = mod.T * k / 40, e = mod.estado(t), Fa = mod.Fde(t);
      if (t < tArr - 0.02) ok(e.v === 0 && cerca(e.lecturas.Ff, Fa, 1e-9), `${n}: rampa t=${t} F_f=${e.lecturas.Ff} ≠ F=${Fa}`);
      if (t > tArr + 0.02 && tArr < D.RAMPA && mud > 0) ok(cerca(e.lecturas.Ff, mud * m * G, 1e-9), `${n}: rampa deslizando F_f=${e.lecturas.Ff}`);
      ok(e.lecturas.Ff <= mus * m * G + 1e-9, `${n}: F_f > μs F_N`);
    }
  }
}

// Bloque con velocidad inicial: primera ley (sin fuerzas horizontales) y velocidad constante con F_H = μd F_N
for (const m of [0.5, 1, 2, 5]) for (const u of [0.5, 1, 2]) for (const mud of [0, 0.1, 0.3, 0.6]) {
  const n = `mesa con u=${u} m=${m} μd=${mud}`;
  const F = mud * m * G;
  const mod = D.crear('horizontal', { m, mus: Math.min(1, mud + 0.2), mud, F, ang: 0, modo: 'constante', u });
  segundaLey(mod, n);
  for (let k = 0; k <= 20; k++) { const e = mod.estado(mod.T * k / 20); ok(Math.abs(e.v - u) < 1e-9 && Math.abs(e.a) < 1e-9, `${n}: no sigue con velocidad constante (v=${e.v})`); }
  ok(cerca(mod.T, Math.min(5, 2.4 / u), 1e-3), `${n}: llega al final de la mesa en ${mod.T}`);
  // sin fuerza aplicada y con rozamiento: frena con a = −μd g hasta detenerse
  if (mud > 0) {
    const mod2 = D.crear('horizontal', { m, mus: Math.min(1, mud + 0.2), mud, F: 0, ang: 0, modo: 'constante', u });
    uniforme(mod2, n + ' (frena)', -mud * G, 0, 0, u, u / (mud * G));
    const ef = mod2.estado(mod2.T);
    ok(ef.v === 0 && cerca(ef.x, u * u / (2 * mud * G), 2e-3), `${n}: distancia de frenado`);
  }
}

// ---------- 2. Plano inclinado ----------
for (const m of [0.5, 2]) for (const ang of rango(5, 60, 5)) for (const mus of [0, 0.2, 0.4, 0.6, 0.8]) for (const mud of rango(0, mus, 0.2)) for (const u of [0, 1, 2.5, 4]) {
  const n = `plano m=${m} θ=${ang} μs=${mus} μd=${mud} u=${u}`;
  const mod = D.crear('plano', { m, ang, mus, mud, u });
  segundaLey(mod, n);
  const th = ang * RAD, s = Math.sin(th), c = Math.cos(th);
  const e0 = mod.estado(0);
  ok(cerca(e0.lecturas.FN, m * G * c, 1e-12) && e0.lecturas.FN < m * G, `${n}: normal ≠ mg cos θ`);
  ok(cerca(e0.lecturas.anguloLimite, Math.atan(mus) / RAD, 1e-12), `${n}: ángulo límite`);
  const deslizaSolo = Math.tan(th) > mus + 1e-9;
  if (u === 0) {
    if (!deslizaSolo) ok(mod.estado(mod.T).x === mod.x0 && e0.lecturas.Ff <= mus * m * G * c + 1e-9 && cerca(e0.lecturas.Ff, m * G * s, 1e-9), `${n}: debía quedarse quieto con F_f = mg sen θ`);
    else uniforme(mod, n, -G * (s - mud * c), 0, mod.x0, 0, mod.T);
  } else {
    const aSub = -G * (s + mud * c), tSub = u / -aSub;
    uniforme(mod, n, aSub, 0, mod.x0, u, Math.min(tSub, mod.T));
    if (tSub < mod.T - 0.1) {
      const xc = mod.x0 + u * tSub + 0.5 * aSub * tSub * tSub;
      if (deslizaSolo) uniforme(mod, n + ' (bajada)', -G * (s - mud * c), tSub, xc, 0, mod.T);
      else { const ef = mod.estado(mod.T); ok(ef.v === 0 && cerca(ef.x, xc, 2e-3), `${n}: debía quedarse arriba en x=${xc}, está en ${ef.x} con v=${ef.v}`); }
    }
  }
}

// ---------- 3. Ascensor ----------
for (const m of [40, 60, 100]) for (const modo of ['constante', 'subir', 'bajar']) for (const a of (modo === 'constante' ? [-9.81, -5, -1, 0, 1, 2.5, 5] : [0.5, 1, 2, 3])) {
  const n = `ascensor m=${m} ${modo} a=${a}`;
  const mod = D.crear('ascensor', { m, a, modo });
  segundaLey(mod, n);
  for (let k = 0; k <= 50; k++) {
    const t = mod.T * k / 50, e = mod.estado(t);
    ok(cerca(e.lecturas.balanza, m * (G + e.a), 1e-12) && e.lecturas.balanza >= -1e-9, `${n}: la balanza no marca m(g + a)`);
    ok(cerca(e.lecturas.peso, m * G, 1e-12), `${n}: el peso cambió`);
  }
  if (modo !== 'constante') {
    const s = modo === 'subir' ? 1 : -1;
    ok(cerca(mod.estado(0.75).a, s * a, 1e-12) && cerca(mod.estado(2.5).a, 0, 1e-12) && cerca(mod.estado(4.2).a, -s * a, 1e-12), `${n}: fases del viaje`);
    ok(Math.abs(mod.estado(mod.T).v) < 1e-9, `${n}: no termina en reposo`);
    ok(cerca(mod.estado(2.5).lecturas.balanza, m * G, 1e-12), `${n}: a velocidad constante la balanza debe marcar mg`);
  }
  if (a === -9.81) ok(Math.abs(mod.estado(1).lecturas.balanza) < 1e-9, `${n}: en caída libre la balanza debe marcar 0`);
}

// ---------- 4. Máquina de Atwood ----------
for (const m1 of rango(0.1, 2, 0.1)) for (const m2 of rango(0.1, 2, 0.1)) {
  const n = `Atwood m1=${m1} m2=${m2}`;
  const mod = D.crear('atwood', { m1, m2 });
  segundaLey(mod, n);
  const a = (m2 - m1) * G / (m1 + m2), T = 2 * m1 * m2 * G / (m1 + m2);
  const e = mod.estado(Math.min(0.2, mod.T / 2));
  ok(cerca(e.a, a, 1e-9), `${n}: a = ${e.a} ≠ ${a}`);
  ok(cerca(e.lecturas.FT, T, 1e-9), `${n}: T = ${e.lecturas.FT} ≠ ${T}`);
  ok(cerca(e.lecturas.polea, 2 * T, 1e-9), `${n}: el dinamómetro de la polea no marca 2T`);
  if (m1 !== m2) ok(e.lecturas.polea < (m1 + m2) * G - 1e-9, `${n}: al acelerar la polea debe marcar menos que (m1 + m2)g`);
  else ok(mod.estado(mod.T).x === 0, `${n}: con masas iguales debía quedarse quieto`);
  ok(e.lecturas.FT > Math.min(m1, m2) * G - 1e-9 && e.lecturas.FT < Math.max(m1, m2) * G + 1e-9, `${n}: T fuera de [m_menor g, m_mayor g]`);
  uniforme(mod, n, a, 0, 0, 0, mod.T);
}

// ---------- 5. Bloque en la mesa con masa colgante ----------
for (const m1 of [0.2, 0.5, 1, 2]) for (const m2 of [0.05, 0.1, 0.2, 0.5, 1]) for (const mus of [0, 0.2, 0.4, 0.6]) for (const mud of rango(0, mus, 0.1)) {
  const n = `mesa+colgante m1=${m1} m2=${m2} μs=${mus} μd=${mud}`;
  const mod = D.crear('mesa', { m1, m2, mus, mud });
  segundaLey(mod, n);
  const e = mod.estado(Math.min(0.2, mod.T / 2));
  if (m2 * G <= mus * m1 * G + 1e-9) {
    ok(e.v === 0 && mod.estado(mod.T).x === 0, `${n}: debía quedarse quieto`);
    ok(cerca(e.lecturas.FT, m2 * G, 1e-9) && cerca(e.lecturas.Ff, m2 * G, 1e-9), `${n}: en reposo T = F_f = m2 g`);
  } else {
    const a = (m2 - mud * m1) * G / (m1 + m2);
    ok(cerca(e.a, a, 1e-9), `${n}: a = ${e.a} ≠ ${a}`);
    ok(cerca(e.lecturas.FT, m2 * (G - a), 1e-9) && e.lecturas.FT < m2 * G, `${n}: T debe ser m2(g − a) < m2 g`);
    uniforme(mod, n, a, 0, 0, 0, mod.T);
  }
}

// ---------- 6. Dos cuerdas ----------
for (const m of [0.5, 1, 3]) for (const a1 of rango(10, 80, 5)) for (const a2 of rango(10, 80, 5)) {
  const n = `cuerdas m=${m} θ1=${a1} θ2=${a2}`;
  const mod = D.crear('cuerdas', { m, ang1: a1, ang2: a2 });
  segundaLey(mod, n);
  const e = mod.estado(0), T1 = e.lecturas.T1, T2 = e.lecturas.T2, r1 = a1 * RAD, r2 = a2 * RAD;
  ok(cerca(T1 * Math.cos(r1), T2 * Math.cos(r2), 1e-12), `${n}: componentes horizontales`);
  ok(cerca(T1 * Math.sin(r1) + T2 * Math.sin(r2), m * G, 1e-12), `${n}: componentes verticales`);
  if (a1 === a2) ok(cerca(T1, m * G / (2 * Math.sin(r1)), 1e-12), `${n}: caso simétrico`);
}

// ---------- 7. Esfera en un líquido ----------
for (const liquido of Object.keys(D.LIQUIDOS)) for (const material of Object.keys(D.MATERIALES)) for (const r of rango(1.5, 3, 0.5)) {
  const n = `esfera ${material} r=${r} mm en ${liquido}`;
  const mod = D.crear('esfera', { r, liquido, material });
  segundaLey(mod, n);
  const L = D.LIQUIDOS[liquido], M = D.MATERIALES[material], rr = r / 1000;
  const vt = 2 * rr * rr * (M.rho - L.rho) * G / (9 * L.eta);
  ok(cerca(mod.vt, vt, 1e-12), `${n}: v_t = ${mod.vt} ≠ ${vt}`);
  ok(cerca(mod.estado(0).a, G * (1 - L.rho / M.rho), 1e-12), `${n}: aceleración inicial ≠ g(1 − ρf/ρs)`);
  ok(mod.estado(0).a < G, `${n}: la aceleración inicial no puede ser g (el empuje actúa desde el principio)`);
  const ef = mod.estado(mod.T);
  ok(cerca(ef.x, D.crear('esfera', { r, liquido, material }).tubo, 1e-9), `${n}: no llega al fondo en T`);
  ok(cerca(ef.lecturas.Fd + ef.lecturas.Fb, ef.lecturas.peso, 1e-3), `${n}: al final F_d + F_b ≠ F_g`);
  ok(mod.Re < 1, `${n}: Re = ${mod.Re} (Stokes no valdría)`);
  ok(mod.T < 120, `${n}: tarda demasiado (${mod.T} s)`);
  // derivada numérica de v = a
  for (const t of [0.2 * mod.tau, mod.tau, 3 * mod.tau]) {
    const h = 1e-7, e = mod.estado(t);
    ok(cerca((mod.estado(t + h).v - mod.estado(t - h).v) / (2 * h), e.a, 1e-5), `${n}: dv/dt ≠ a`);
  }
}

console.log(`${comprobaciones} comprobaciones · ${fallos} fallos`);
process.exit(fallos ? 1 : 0);
