// Verificación de la física de proyectiles: node pruebas/verificar-proyectiles.js
// Sin aire: se comprueba el modelo exacto con cálculos independientes (derivadas numéricas, energía,
// llegada por bisección, fórmulas de alcance, altura máxima y tiempo de vuelo).
// Con aire: se compara con otra integración independiente (Euler semimplícito con paso de 2 µs)
// y se comprueban los efectos cualitativos (menos alcance, menos altura, caída más empinada).

const { Proyectil, G, RAD } = require('../comun/proyectil.js');

let fallos = 0, comprobaciones = 0;
function ok(cond, msg) { comprobaciones++; if (!cond) { fallos++; if (fallos <= 25) console.log('FALLO:', msg); } }
const cerca = (a, b, tol) => Math.abs(a - b) <= tol * Math.max(1, Math.abs(a), Math.abs(b));

let casos = 0;
for (let h = 0; h <= 1.0001; h += 0.1) {
  for (let v = 1; v <= 6.0001; v += 0.5) {
    for (let ang = 0; ang <= 90; ang += 5) {
      if (h < 1e-9 && ang === 0) continue;
      const p = new Proyectil(h, v, ang), T = p.duracion, n = `h=${h.toFixed(1)} v=${v} θ=${ang}`;
      casos++;
      ok(T > 0, `${n}: duración`);
      ok(Math.abs(p.y(T)) < 1e-9, `${n}: y(T) ≠ 0`);
      // llegada por bisección independiente sobre la fórmula de la posición
      const yy = (t) => h + v * Math.sin(ang * RAD) * t - 0.5 * G * t * t;
      let a = Math.max(p.tCumbre, 1e-9), b = 5;
      for (let i = 0; i < 80; i++) { const m = (a + b) / 2; if (yy(m) > 0) a = m; else b = m; }
      ok(cerca(T, (a + b) / 2, 1e-9), `${n}: tiempo de vuelo`);
      for (let k = 1; k < 20; k++) {
        const t = T * k / 20, e = 1e-6;
        ok(cerca((p.x(t + e) - p.x(t - e)) / (2 * e), p.vx(t), 1e-6), `${n}: dx/dt ≠ vx`);
        ok(cerca((p.y(t + e) - p.y(t - e)) / (2 * e), p.vy(t), 1e-6), `${n}: dy/dt ≠ vy`);
        ok(cerca((p.vy(t + e) - p.vy(t - e)) / (2 * e), -G, 1e-6), `${n}: dvy/dt ≠ −g`);
        ok(p.vx(t) === p.vx(0), `${n}: vx no es constante`);
        ok(cerca(0.5 * p.rapidez(t) ** 2 + G * p.y(t), 0.5 * v * v + G * h, 1e-9), `${n}: energía`);
      }
      ok(cerca(p.rapidez(0), v, 1e-12), `${n}: rapidez inicial`);
      ok(cerca(p.alcance(), v * Math.cos(ang * RAD) * T, 1e-9), `${n}: alcance = vx T`);
      // altura máxima por barrido
      let ymax = -1; for (let i = 0; i <= 4000; i++) ymax = Math.max(ymax, p.y(T * i / 4000));
      ok(Math.abs(p.alturaMax() - ymax) < 1e-5 && p.alturaMax() >= ymax - 1e-12, `${n}: altura máxima`);
      ok(cerca(p.rapidez(T), Math.sqrt(v * v + 2 * G * h), 1e-9), `${n}: rapidez de llegada`);
      if (h < 1e-9) {
        const s = Math.sin(ang * RAD), c = Math.cos(ang * RAD);
        ok(cerca(T, 2 * v * s / G, 1e-9), `${n}: T = 2 v sen θ / g`);
        ok(cerca(p.alcance(), v * v * Math.sin(2 * ang * RAD) / G, 1e-9), `${n}: R = v² sen 2θ / g`);
        ok(cerca(p.alturaMax(), (v * s) ** 2 / (2 * G), 1e-9), `${n}: H = (v sen θ)² / 2g`);
        if (ang > 0 && ang < 90) ok(cerca(p.alcance(), new Proyectil(0, v, 90 - ang).alcance(), 1e-9), `${n}: ángulos complementarios`);
        ok(cerca(p.anguloV(T), -ang, 1e-9) || ang === 90, `${n}: ángulo de llegada`);
      }
      if (ang === 0) ok(cerca(T, Math.sqrt(2 * h / G), 1e-12), `${n}: horizontal T = √(2h/g)`);
    }
  }
}
// 45° da el alcance máximo desde el suelo
for (let v = 1; v <= 6; v++) {
  const r45 = new Proyectil(0, v, 45).alcance();
  for (let ang = 1; ang < 90; ang++) ok(new Proyectil(0, v, ang).alcance() <= r45 + 1e-12, `alcance máximo a 45° (v=${v}, θ=${ang})`);
}
console.log(`Sin aire: ${casos} lanzamientos comprobados.`);

// ---------- Con aire ----------
function independiente(h, v, ang, k) {
  let x = 0, y = h, vx = v * Math.cos(ang * RAD), vy = v * Math.sin(ang * RAD), t = 0, ymax = h;
  const dt = 2e-6;
  while (true) {
    const s = Math.hypot(vx, vy);
    vx += -k * s * vx * dt; vy += (-G - k * s * vy) * dt;
    const xn = x + vx * dt, yn = y + vy * dt;
    if (yn <= 0 && vy < 0) { const f = y / (y - yn); return { T: t + f * dt, R: x + f * (xn - x), ymax }; }
    x = xn; y = yn; t += dt; ymax = Math.max(ymax, y);
  }
}
let casosAire = 0;
for (const K of [0.14, 0.3]) for (const h of [0, 0.5, 1.0]) for (const v of [2, 4, 6]) for (const ang of [15, 30, 45, 60, 75]) {
  const p = new Proyectil(h, v, ang, { k: K }), q = new Proyectil(h, v, ang), ind = independiente(h, v, ang, K), n = `aire h=${h} v=${v} θ=${ang}`;
  casosAire++;
  ok(Math.abs(p.duracion - ind.T) < 2e-4, `${n}: tiempo de vuelo ${p.duracion} vs ${ind.T}`);
  ok(Math.abs(p.alcance() - ind.R) < 1e-3, `${n}: alcance ${p.alcance()} vs ${ind.R}`);
  ok(Math.abs(p.alturaMax() - ind.ymax) < 1e-3, `${n}: altura máxima`);
  ok(Math.abs(p.y(p.duracion)) < 1e-6, `${n}: y(T) ≠ 0`);
  ok(p.alcance() < q.alcance(), `${n}: el aire no reduce el alcance`);
  ok(p.alturaMax() < q.alturaMax(), `${n}: el aire no reduce la altura`);
  ok(p.rapidez(p.duracion) < q.rapidez(q.duracion), `${n}: el aire no reduce la rapidez de llegada`);
  let e0 = Infinity, baja = true;
  for (let i = 0; i <= 200; i++) { const t = p.duracion * i / 200, e = 0.5 * p.rapidez(t) ** 2 + G * p.y(t); if (e > e0 + 1e-6) baja = false; e0 = e; }
  ok(baja, `${n}: la energía no disminuye`);
  if (h === 0) ok(-p.anguloV(p.duracion) > ang, `${n}: la caída no es más empinada que la subida`);
  ok(p.tCumbre > 0 && p.vy(p.tCumbre) < 1e-6 && Math.abs(p.vy(p.tCumbre)) < 1e-6, `${n}: cumbre`);
}
console.log(`Con aire: ${casosAire} lanzamientos comprobados (k = 0,14 y 0,30 m⁻¹).`);
console.log(`${comprobaciones} comprobaciones · ${fallos} fallos`);
process.exit(fallos ? 1 : 0);
