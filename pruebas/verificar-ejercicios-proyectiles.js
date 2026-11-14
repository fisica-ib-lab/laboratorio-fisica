// Verificación de los ejercicios de «Movimiento de proyectiles»: node pruebas/verificar-ejercicios-proyectiles.js
// 1000 ejercicios de cada tipo. Cada respuesta se vuelve a calcular por un camino independiente
// (simulación numérica paso a paso, sin usar las fórmulas del generador).

const E = require('../sims/A.1-proyectiles/ejercicios.js');
const { Proyectil, G, RAD } = require('../comun/proyectil.js');

let fallos = 0, comprobaciones = 0;
function ok(cond, msg) { comprobaciones++; if (!cond) { fallos++; if (fallos <= 25) console.log('FALLO:', msg); } }
const cerca = (a, b, tol) => Math.abs(a - b) <= tol * Math.max(1, Math.abs(a), Math.abs(b));

// Simulación independiente sin aire: Verlet con paso de 10 µs e interpolación de la llegada
function simular(h, v, ang) {
  const dt = 1e-5, ux = v * Math.cos(ang * RAD), uy = v * Math.sin(ang * RAD);
  let x = 0, y = h, vy = uy, t = 0, ymax = h, tCumbre = 0;
  while (true) {
    const yn = y + vy * dt - 0.5 * G * dt * dt, vyn = vy - G * dt;
    if (yn <= 0 && vyn < 0) {
      // raíz exacta dentro del paso
      const d = (vy + Math.sqrt(vy * vy + 2 * G * y)) / G;
      return { T: t + d, R: ux * (t + d), H: ymax, vf: Math.hypot(ux, vy - G * d), ux, uy, tCumbre };
    }
    y = yn; vy = vyn; t += dt; x += ux * dt;
    if (y > ymax) { ymax = y; tCumbre = t; }
  }
}
function valorEn(pts, t) {
  for (let i = 0; i + 1 < pts.length; i++) {
    const [t1, y1] = pts[i], [t2, y2] = pts[i + 1];
    if (t2 > t1 && t >= t1 && t <= t2) return y1 + (y2 - y1) * (t - t1) / (t2 - t1);
  }
  return pts[pts.length - 1][1];
}

const N = 1000, cuenta = {}, claves = {};
for (const id of Object.keys(E.TIPOS)) {
  const r = E.rngSemilla(771100 + id.length * 104729 + id.charCodeAt(1));
  cuenta[id] = 0;
  for (let k = 0; k < N; k++) {
    const ej = E.generar(r, id), n = `${id} #${k}`, q = ej.esc, s = simular(q.h, q.v, q.ang);
    cuenta[id]++;
    ok(ej.id === id && ej.titulo && ej.enunciado && ej.explicacion, `${n}: campos`);
    ok(!/undefined|NaN|Infinity|\[object/.test(ej.enunciado + ej.explicacion), `${n}: texto con valores vacíos`);
    ok(s.R <= 3.45 && s.H <= 2.3, `${n}: fuera de la escena (R=${s.R}, H=${s.H})`);

    if (ej.tipo === 'numero') {
      const real = {
        'componentes': /componente horizontal/.test(ej.enunciado) ? s.ux : s.uy,
        'tiempo-vuelo': s.T, 'altura-maxima': s.H, 'alcance': s.R,
        'horizontal-tiempo': s.T, 'horizontal-alcance': s.R, 'rapidez-llegada': s.vf
      }[id];
      ok(cerca(ej.respuesta, real, 2e-4), `${n}: respuesta ${ej.respuesta} ≠ simulación ${real}`);
      ok(ej.respuesta > 0, `${n}: respuesta no positiva`);
      ok(E.corregirNumero(ej, ej.respuesta, ej.unidad).ok === true, `${n}: no acepta la respuesta correcta`);
      // la respuesta redondeada a 3 cifras significativas también debe aceptarse
      ok(E.corregirNumero(ej, Number(ej.respuesta.toPrecision(3)), ej.unidad).ok === true, `${n}: no acepta 3 cifras significativas`);
      ok(E.corregirNumero(ej, Number(ej.respuesta.toPrecision(2)), ej.unidad).ok === true || Math.abs(Number(ej.respuesta.toPrecision(2)) - ej.respuesta) > ej.tolerancia, `${n}: 2 cifras`);
      ok(E.corregirNumero(ej, ej.respuesta, ej.unidad === 'm' ? 's' : 'm').ok === false, `${n}: acepta una unidad equivocada`);
      ok(E.corregirNumero(ej, ej.respuesta * 1.2 + 0.1, ej.unidad).ok === false, `${n}: acepta un valor equivocado`);
      for (const p of ej.pistas) {
        ok(Math.abs(p.valor - ej.respuesta) > 2 * ej.tolerancia, `${n}: una pista coincide con la respuesta`);
        const c = E.corregirNumero(ej, p.valor, ej.unidad);
        ok(c.ok === false && c.pista === p.texto, `${n}: pista de error no reconocida (${p.valor})`);
      }
      // el resultado que se muestra en la explicación es la respuesta con 3 cifras significativas
      const m = ej.explicacion.match(/<b>([\d,]+) [^<]*<\/b>/);
      ok(m && cerca(Number(m[1].replace(',', '.')), ej.respuesta, 6e-3), `${n}: la explicación no muestra la respuesta`);
    }

    if (ej.tipo === 'texto') {
      ok(ej.opciones.length === 4 && ej.opciones.filter(o => o.correcta).length === 1, `${n}: opciones`);
      ok(new Set(ej.opciones.map(o => o.texto)).size === 4, `${n}: opciones repetidas`);
      ok(ej.opciones.every(o => o.correcta || (o.pista && o.pista.length > 20)), `${n}: opción sin pista`);
      claves[ej.clave] = (claves[ej.clave] || 0) + 1;
      // el hecho físico que afirma la opción correcta
      const p = new Proyectil(q.h, q.v, q.ang);
      if (ej.clave === 'cumbre') ok(Math.abs(p.vy(p.tCumbre)) < 1e-9 && p.vx(p.tCumbre) > 0.5 && p.ay(p.tCumbre) === -G, `${n}: cumbre`);
      if (ej.clave === 'gemelas') ok(cerca(simular(q.h, 0, 0).T, s.T, 1e-9), `${n}: no llegan a la vez`);
      if (ej.clave === 'doble') { const d = simular(q.h, 2 * q.v, 0); ok(cerca(d.T, s.T, 1e-9) && cerca(d.R, 2 * s.R, 1e-9), `${n}: doble rapidez`); }
      if (ej.clave === 'complementarios') { const a = simular(0, q.v, 30), b = simular(0, q.v, 60); ok(cerca(a.R, b.R, 1e-6) && b.T > a.T * 1.5, `${n}: complementarios`); }
      if (ej.clave === 'vx') ok(p.vx(0) === p.vx(p.duracion / 3) && p.vx(0) === p.vx(p.duracion), `${n}: vx constante`);
      if (ej.clave === 'llegada') ok(cerca(s.vf, q.v, 1e-6), `${n}: rapidez de llegada`);
      if (ej.clave === 'aire') {
        const a = new Proyectil(q.h, q.v, q.ang, { k: E.K_AIRE });
        ok(a.alcance() < p.alcance() * 0.95 && a.alturaMax() < p.alturaMax() * 0.97 && -a.anguloV(a.duracion) > q.ang + 2, `${n}: efecto del aire`);
      }
    }

    if (ej.tipo === 'grafica') {
      ok(ej.opciones.length === 4 && ej.opciones.filter(o => o.correcta).length === 1, `${n}: opciones`);
      const bien = ej.opciones.find(o => o.correcta), p = new Proyectil(q.h, q.v, q.ang);
      ok(cerca(ej.tMax, s.T, 1e-4), `${n}: duración`);
      for (let i = 0; i <= 20; i++) { const t = s.T * i / 20; ok(cerca(valorEn(bien.puntos, t), ej.mag === 'vy' ? s.uy - G * t : s.ux, 1e-6), `${n}: gráfica correcta`); }
      const rango = Math.max(...ej.opciones.map(o => Math.max(...o.puntos.map(pt => Math.abs(pt[1])))));
      ej.opciones.forEach((o, a) => ej.opciones.forEach((o2, b) => {
        if (a >= b) return;
        let mx = 0; for (let i = 0; i < 40; i++) { const t = s.T * (i + 0.4) / 40; mx = Math.max(mx, Math.abs(valorEn(o.puntos, t) - valorEn(o2.puntos, t))); }
        ok(mx > 0.2 * rango, `${n}: dos opciones casi iguales (${a}, ${b})`);
      }));
      ok(ej.opciones.every(o => o.correcta || (o.pista && o.pista.length > 20)), `${n}: opción sin pista`);
    }

    if (ej.tipo === 'trayectoria') {
      ok(ej.opciones.length === 4 && ej.opciones.filter(o => o.correcta).length === 1, `${n}: opciones`);
      const a = new Proyectil(q.h, q.v, q.ang, { k: E.K_AIRE }), bien = ej.opciones.find(o => o.correcta);
      const fin = bien.puntos[bien.puntos.length - 1];
      ok(cerca(fin[0], a.alcance(), 1e-9) && Math.abs(fin[1]) < 1e-6, `${n}: la correcta no es la trayectoria con aire`);
      const cima = (pts) => pts.reduce((m, pt) => (pt[1] > m[1] ? pt : m), pts[0]);
      const alc = (pts) => Math.max(...pts.map(pt => pt[0]));
      const cB = cima(bien.puntos), cR = cima(ej.referencia);
      ok(alc(bien.puntos) < alc(ej.referencia) && cB[1] < cR[1] && cB[0] > alc(bien.puntos) / 2, `${n}: forma cualitativa con aire`);
      // cada distractor se distingue de la correcta en alcance, altura o posición del punto más alto
      for (const o of ej.opciones) {
        if (o.correcta) continue;
        const c = cima(o.puntos);
        // debe diferenciarse a simple vista: al menos un 12 % en el alcance o en la altura
        const dif = Math.max(Math.abs(alc(o.puntos) - alc(bien.puntos)) / alc(bien.puntos), Math.abs(c[1] - cB[1]) / cB[1]);
        ok(dif > 0.12, `${n}: distractor casi igual a la correcta (${dif})`);
        ok(o.pista && o.pista.length > 20, `${n}: distractor sin pista`);
      }
    }

    if (ej.tipo === 'bandeja') {
      ok(cerca(ej.respuesta, s.R, 2e-4), `${n}: caída ${ej.respuesta} ≠ simulación ${s.R}`);
      ok(s.R >= 0.6 && s.R <= 3.3, `${n}: caída fuera del recorrido de la bandeja`);
      const colocada = Math.round(ej.respuesta / 0.05) * 0.05;      // la bandeja se mueve de 0,05 en 0,05 m
      ok(E.corregirBandeja(ej, colocada).ok === true, `${n}: no acepta la bandeja bien colocada`);
      ok(E.corregirBandeja(ej, colocada + 0.15).ok === false && E.corregirBandeja(ej, colocada - 0.15).ok === false, `${n}: acepta una bandeja mal colocada`);
      for (const p of ej.pistas) ok(Math.abs(p.valor - ej.respuesta) > 2 * ej.tolerancia, `${n}: una pista coincide con la respuesta`);
    }
  }
}
ok(Object.keys(claves).length === E.CONCEPTOS.length, 'no salieron todos los conceptos');
console.log(Object.entries(cuenta).map(([k, v]) => `${k}: ${v}`).join(' · '));
console.log('conceptos:', Object.entries(claves).map(([k, v]) => `${k} ${v}`).join(', '));
console.log(`${comprobaciones} comprobaciones · ${fallos} fallos`);
process.exit(fallos ? 1 : 0);
