// Verificación de «Ecuaciones del movimiento y caída libre»: node pruebas/verificar-caida-libre.js
// Para todas las combinaciones de los deslizadores se comprueba, con cálculos independientes, que:
// las cuatro ecuaciones del Cuadernillo se cumplen en cada instante, la pendiente de s–t es v y la de v–t es −g,
// los tiempos de la puerta fotoeléctrica son correctos, y la subida y la bajada son simétricas.

const { Proyectil, G } = require('../comun/proyectil.js');
let fallos = 0, comprobaciones = 0;
function ok(cond, msg) { comprobaciones++; if (!cond) { fallos++; if (fallos <= 25) console.log('FALLO:', msg); } }
const cerca = (a, b, tol) => Math.abs(a - b) <= tol * Math.max(1, Math.abs(a), Math.abs(b));

// caída o lanzamiento vertical simulados paso a paso (Verlet, 10 µs), sin usar el módulo
function simular(h, u) {
  const dt = 1e-5; let y = h, v = u, t = 0, ymax = h, tc = 0;
  while (true) {
    const yn = y + v * dt - 0.5 * G * dt * dt, vn = v - G * dt;
    if (yn <= 0 && vn < 0) { const d = (v + Math.sqrt(v * v + 2 * G * y)) / G; return { T: t + d, vf: v - G * d, ymax, tc }; }
    y = yn; v = vn; t += dt; if (y > ymax) { ymax = y; tc = t; }
  }
}

function comprobar(p, h, u, n) {
  const T = p.duracion, sim = simular(h, u);
  ok(cerca(T, sim.T, 1e-7), `${n}: tiempo hasta la mesa ${T} vs ${sim.T}`);
  ok(cerca(p.vy(T), sim.vf, 1e-7), `${n}: velocidad de llegada`);
  ok(cerca(p.alturaMax(), sim.ymax, 1e-7), `${n}: altura máxima`);
  ok(Math.abs(p.tCumbre - sim.tc) < 2e-5, `${n}: tiempo de subida`);
  ok(p.x(T / 2) === 0 && p.vx(T / 2) === 0, `${n}: el movimiento no es vertical`);
  ok(p.uy === u, `${n}: velocidad inicial`);
  for (let k = 0; k <= 40; k++) {
    const t = T * k / 40, s = p.y(t) - h, v = p.vy(t), a = -G;
    ok(cerca(v, u + a * t, 1e-12), `${n}: v = u + at`);
    ok(cerca(s, u * t + 0.5 * a * t * t, 1e-12), `${n}: s = ut + ½at²`);
    ok(cerca(v * v, u * u + 2 * a * s, 1e-11), `${n}: v² = u² + 2as`);
    ok(cerca(s, 0.5 * (u + v) * t, 1e-12), `${n}: s = ½(u + v)t`);
    if (k > 0 && k < 40) {
      const e = 1e-6;
      ok(cerca((p.y(t + e) - p.y(t - e)) / (2 * e), v, 1e-6), `${n}: pendiente s–t ≠ v`);
      ok(cerca((p.vy(t + e) - p.vy(t - e)) / (2 * e), -G, 1e-6), `${n}: pendiente v–t ≠ −g`);
    }
  }
  // puerta fotoeléctrica: en todas las alturas posibles, de 0,05 en 0,05 m
  for (let yp = 0.1; yp <= p.alturaMax() + 1e-9; yp += 0.05) {
    const cr = p.crucesAltura(yp);
    const esperados = (yp > h + 1e-9 || u > 0) && yp >= h - 1e-9 && u > 0 && yp < p.alturaMax() - 1e-9 ? 2 : 1;
    if (Math.abs(yp - p.alturaMax()) > 1e-9 && Math.abs(yp - h) > 1e-9) ok(cr.length === esperados, `${n}: nº de pasos por y=${yp.toFixed(2)}: ${cr.length} (esperados ${esperados})`);
    for (const tc of cr) {
      ok(Math.abs(p.y(tc) - yp) < 1e-9, `${n}: la bola no está en la puerta en t=${tc}`);
      ok(tc > 0 && tc <= T + 1e-9, `${n}: paso fuera del vuelo`);
    }
    if (cr.length === 2) {
      ok(cerca(p.vy(cr[0]), -p.vy(cr[1]), 1e-9), `${n}: rapidez distinta en los dos pasos`);
      ok(cerca(cr[0] + cr[1], 2 * p.tCumbre, 1e-9), `${n}: pasos no simétricos respecto del punto más alto`);
    }
  }
}

let casos = 0;
for (let i = 4; i <= 20; i++) { const h = i / 10; comprobar(new Proyectil(h, 0, 0), h, 0, `caída h=${h}`); casos++;
  ok(cerca(new Proyectil(h, 0, 0).duracion, Math.sqrt(2 * h / G), 1e-12), `caída h=${h}: t = √(2h/g)`); }
for (let i = 0; i <= 10; i++) for (let j = 2; j <= 10; j++) {
  const h = i / 10, u = j / 2, p = new Proyectil(h, u, 90); comprobar(p, h, u, `subida h=${h} u=${u}`); casos++;
  ok(cerca(p.tCumbre, u / G, 1e-12) && cerca(p.alturaMax(), h + u * u / (2 * G), 1e-12), `subida h=${h} u=${u}: punto más alto`);
  ok(p.alturaMax() <= 2.3, `subida h=${h} u=${u}: se sale de la escena`);
  if (h === 0) ok(cerca(p.duracion, 2 * p.tCumbre, 1e-12) && cerca(-p.vy(p.duracion), u, 1e-12), `subida u=${u}: simetría`);
}
// caída: distancias en décimas de segundo sucesivas en proporción 1 : 3 : 5 : 7
const c = new Proyectil(2, 0, 0), d = [0, 1, 2, 3].map(k => c.y(k * 0.1) - c.y((k + 1) * 0.1));
ok(cerca(d[1] / d[0], 3, 1e-9) && cerca(d[2] / d[0], 5, 1e-9) && cerca(d[3] / d[0], 7, 1e-9), 'proporción 1 : 3 : 5 : 7');
console.log(`${casos} movimientos comprobados (todas las combinaciones de los deslizadores).`);
console.log(`${comprobaciones} comprobaciones · ${fallos} fallos`);
process.exit(fallos ? 1 : 0);
