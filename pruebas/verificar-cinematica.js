// Verificación de la física: node pruebas/verificar-cinematica.js
// Comprueba con integración y derivación numéricas independientes que el modelo exacto cumple:
// pendiente s–t = v, pendiente v–t = a, área v–t = Δs, área a–t = Δv, distancia = ∫|v| dt,
// continuidad de s y v, y que el nivel 1 nunca saca el carrito de la pista.

const { Movimiento, numero } = require('../comun/cinematica.js');

let fallos = 0, comprobaciones = 0;
function ok(cond, msg) { comprobaciones++; if (!cond) { fallos++; if (fallos < 20) console.log('FALLO:', msg); } }
const cerca = (a, b, tol) => Math.abs(a - b) <= tol * Math.max(1, Math.abs(a), Math.abs(b));

function aleatorio(min, max) { return min + Math.random() * (max - min); }

function comprobar(m, nombre) {
  const D = m.duracion, N = 20000, h = D / N;
  let areaV = 0, areaA = 0, areaAbsV = 0;
  for (let i = 0; i < N; i++) {
    const t = (i + 0.5) * h; // punto medio
    areaV += m.v(t) * h; areaA += m.a(t) * h; areaAbsV += Math.abs(m.v(t)) * h;
  }
  ok(cerca(areaV, m.s(D) - m.s(0), 1e-6), `${nombre}: área v–t ≠ Δs (${areaV} vs ${m.s(D) - m.s(0)})`);
  // a es escalonada: se integra por intervalos entre los límites de los tramos (puntos medios internos)
  areaA = 0;
  for (const tr of m.tramos) {
    const n = 200, hh = (tr.t1 - tr.t0) / n;
    for (let i = 0; i < n; i++) areaA += m.a(tr.t0 + (i + 0.5) * hh) * hh;
  }
  ok(cerca(areaA, m.v(D) - m.v(0), 1e-9), `${nombre}: área a–t ≠ Δv`);
  ok(cerca(areaAbsV, m.distancia(D), 1e-5), `${nombre}: distancia ≠ ∫|v| (${areaAbsV} vs ${m.distancia(D)})`);
  ok(cerca(m.desplazamiento(D), m.s(D) - m.s0, 1e-12), `${nombre}: desplazamiento`);
  // pendientes en instantes al azar (lejos de los límites entre tramos)
  for (let k = 0; k < 30; k++) {
    const t = aleatorio(0.01, D - 0.01);
    const lejos = m.tramos.every(tr => Math.abs(t - tr.t0) > 1e-3 && Math.abs(t - tr.t1) > 1e-3);
    if (!lejos) continue;
    const e = 1e-5;
    ok(cerca((m.s(t + e) - m.s(t - e)) / (2 * e), m.v(t), 1e-6), `${nombre}: pendiente s–t ≠ v en t=${t}`);
    ok(cerca((m.v(t + e) - m.v(t - e)) / (2 * e), m.a(t), 1e-6), `${nombre}: pendiente v–t ≠ a en t=${t}`);
    // distancia parcial
    const n = 4000, hh = t / n; let d = 0;
    for (let i = 0; i < n; i++) d += Math.abs(m.v((i + 0.5) * hh)) * hh;
    ok(cerca(d, m.distancia(t), 1e-4), `${nombre}: distancia parcial en t=${t}`);
  }
  // continuidad de s y v en los límites
  for (const tr of m.tramos.slice(1)) {
    const e = 1e-9;
    ok(cerca(m.s(tr.t0 - e), m.s(tr.t0 + e), 1e-7), `${nombre}: s discontinua en ${tr.t0}`);
    ok(cerca(m.v(tr.t0 - e), m.v(tr.t0 + e), 1e-6), `${nombre}: v discontinua en ${tr.t0}`);
  }
  // rango de s
  const [mn, mx] = m.rangoS();
  for (let i = 0; i <= 2000; i++) { const s = m.s(D * i / 2000); ok(s >= mn - 1e-9 && s <= mx + 1e-9, `${nombre}: rangoS`); }
}

// 1) Nivel 1: todas las combinaciones de los deslizadores
let maxAbs = 0;
for (let s0 = -10; s0 <= 10; s0++) {
  for (let k = -20; k <= 20; k++) {
    const v = k / 10;
    const m = new Movimiento(s0, v, [{ duracion: 10, a: 0 }]);
    comprobar(m, `N1 s0=${s0} v=${v}`);
    ok(m.a(5) === 0, 'N1: a debe ser 0');
    ok(cerca(m.s(10), s0 + 10 * v, 1e-12), 'N1: s = s0 + v t');
    ok(cerca(m.distancia(10), Math.abs(v) * 10, 1e-12), 'N1: distancia = |v| t');
    const [mn, mx] = m.rangoS();
    maxAbs = Math.max(maxAbs, Math.abs(mn), Math.abs(mx));
  }
}
ok(maxAbs <= 30, `N1: el carrito sale de la pista (|s| máx = ${maxAbs})`);
console.log(`Nivel 1: 861 movimientos comprobados; |s| máximo = ${maxAbs} m (pista de −30 a 30 m).`);

// 2) 1000 movimientos aleatorios por tramos (base para los niveles 2 y 3)
for (let i = 0; i < 1000; i++) {
  const n = 1 + Math.floor(Math.random() * 6);
  const tramos = [];
  for (let j = 0; j < n; j++) tramos.push({ duracion: aleatorio(0.5, 4), a: Math.random() < 0.25 ? 0 : aleatorio(-3, 3) });
  comprobar(new Movimiento(aleatorio(-10, 10), aleatorio(-5, 5), tramos), `aleatorio ${i}`);
}
console.log('1000 movimientos aleatorios por tramos comprobados.');

// 3) Caso a mano: sube, se detiene y vuelve (u = 4, a = −2, 4 s): Δs = 0, distancia = 8 m
const ida = new Movimiento(0, 4, [{ duracion: 4, a: -2 }]);
ok(cerca(ida.desplazamiento(4), 0, 1e-12), 'ida y vuelta: Δs = 0');
ok(cerca(ida.distancia(4), 8, 1e-12), 'ida y vuelta: distancia = 8 m');
ok(cerca(ida.distancia(2), 4, 1e-12), 'ida y vuelta: distancia a los 2 s = 4 m');

// 4) Formato de números
ok(numero(-1.5, 1) === '−1,5', 'formato −1,5');
ok(numero(25000, 0) === '25 000', 'formato 25 000');
ok(numero(-0.004, 2) === '0,00', 'formato sin −0,00');
ok(numero(9.81, 2) === '9,81', 'formato 9,81');

console.log(`${comprobaciones} comprobaciones · ${fallos} fallos`);
process.exit(fallos ? 1 : 0);
